import {
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { IonBadge, IonButton, IonIcon, IonInput, IonSpinner } from '@ionic/angular';
import { ContextoChat, MensajeChat } from '../../core/modelos';
import { HaceTiempoPipe } from '../../core/pipes/fecha.pipe';
import { AuthService } from '../../core/servicios/auth.service';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { mensajeDeError } from '../../core/mensaje-de-error';

const CLAVE_NOMBRE_INVITADO = 'quick_chat_guest_name';

/**
 * Chat desplegable al pie de cada tarjeta. Admite invitados sin cuenta: se
 * les pide un apodo la primera vez y se guarda en el navegador.
 */
@Component({
  selector: 'app-chat-rapido',
  imports: [IonButton, IonIcon, IonInput, IonBadge, IonSpinner, HaceTiempoPipe],
  templateUrl: './chat-rapido.component.html',
  styleUrl: './chat-rapido.component.scss',
})
export class ChatRapidoComponent implements OnDestroy {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);

  readonly tipoDeContexto = input.required<ContextoChat>();
  readonly idDeContexto = input.required<string>();
  readonly tituloDeContexto = input.required<string>();

  protected readonly usuario = this.auth.usuario;
  protected readonly abierto = signal(false);
  protected readonly mensajes = signal<MensajeChat[]>([]);
  protected readonly texto = signal('');
  protected readonly enviando = signal(false);
  protected readonly nombreInvitado = signal(leerNombreInvitado());
  protected readonly pidiendoNombre = signal(false);
  protected readonly nombreTentativo = signal('');
  private textoPendiente = '';

  private readonly lista = viewChild<ElementRef<HTMLDivElement>>('lista');
  private desuscribir: (() => void) | null = null;

  constructor() {
    // Al abrir, carga la conversación y se suscribe a mensajes nuevos.
    effect(() => {
      const abierto = this.abierto();
      const idConversacion = this.idConversacion;
      this.desuscribir?.();
      this.desuscribir = null;
      if (!abierto) return;

      this.supabase.mensajesDeChat
        .filtrar({ conversation_id: idConversacion }, 'created_at', 100)
        .then((lista) => this.mensajes.set(lista))
        .catch((error) => console.error('No se pudo cargar el chat:', error));

      this.desuscribir = this.supabase.mensajesDeChat.suscribir((evento) => {
        if (evento.datos?.conversation_id !== idConversacion) return;
        if (evento.tipo === 'create') this.agregarMensaje(evento.datos);
      });
    });

    // Cada mensaje nuevo baja la lista hasta el final.
    effect(() => {
      this.mensajes();
      const elemento = this.lista()?.nativeElement;
      if (elemento) setTimeout(() => (elemento.scrollTop = elemento.scrollHeight), 0);
    });
  }

  ngOnDestroy(): void {
    this.desuscribir?.();
  }

  protected get idConversacion(): string {
    return `${this.tipoDeContexto()}_${this.idDeContexto()}`;
  }

  protected esMio(mensaje: MensajeChat): boolean {
    const usuario = this.usuario();
    if (usuario) return mensaje.sender_id === usuario.id;
    return Boolean(this.nombreInvitado()) && mensaje.sender_id?.startsWith(`guest_${this.nombreInvitado()}_`);
  }

  protected alternar(): void {
    this.abierto.update((valor) => !valor);
  }

  protected alEscribir(evento: CustomEvent<{ value?: string | null }>): void {
    this.texto.set(evento.detail.value ?? '');
  }

  protected enviar(): void {
    const texto = this.texto().trim();
    if (!texto) return;
    if (!this.usuario() && !this.nombreInvitado()) {
      // Primero hay que saber cómo identificar a la persona invitada.
      this.textoPendiente = texto;
      this.pidiendoNombre.set(true);
      return;
    }
    void this.mandar(texto, this.nombreInvitado());
  }

  protected confirmarNombre(): void {
    const nombre = this.nombreTentativo().trim() || 'Anónimo';
    this.nombreInvitado.set(nombre);
    try {
      localStorage.setItem(CLAVE_NOMBRE_INVITADO, nombre);
    } catch {
      // Sin almacenamiento, el apodo dura lo que dura la pestaña.
    }
    this.pidiendoNombre.set(false);
    void this.mandar(this.textoPendiente, nombre);
    this.textoPendiente = '';
  }

  protected cancelarNombre(): void {
    this.pidiendoNombre.set(false);
    this.textoPendiente = '';
  }

  private async mandar(texto: string, nombreInvitado: string): Promise<void> {
    const usuario = this.usuario();
    this.enviando.set(true);
    try {
      const nuevo = await this.supabase.mensajesDeChat.crear({
        conversation_id: this.idConversacion,
        context_type: this.tipoDeContexto(),
        context_id: this.idDeContexto(),
        context_title: this.tituloDeContexto(),
        sender_id: usuario ? usuario.id : `guest_${nombreInvitado}_${Date.now()}`,
        sender_name: usuario ? usuario.full_name || 'Usuario' : nombreInvitado || 'Anónimo',
        text: texto,
        read_by: [],
      });
      // Se agrega en el acto: con el tiempo real apagado no llegaría solo.
      // La notificación a quien publicó la genera un trigger en la base.
      this.agregarMensaje(nuevo);
      this.texto.set('');
    } catch (error) {
      await this.avisos.error(mensajeDeError(error), 'No se pudo enviar el mensaje');
    } finally {
      this.enviando.set(false);
    }
  }

  private agregarMensaje(mensaje: MensajeChat): void {
    this.mensajes.update((lista) => (lista.some((m) => m.id === mensaje.id) ? lista : [...lista, mensaje]));
  }
}

function leerNombreInvitado(): string {
  try {
    return localStorage.getItem(CLAVE_NOMBRE_INVITADO) || '';
  } catch {
    return '';
  }
}
