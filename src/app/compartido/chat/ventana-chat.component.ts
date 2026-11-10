import {
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { IonButton, IonIcon, IonInput, IonSpinner } from '@ionic/angular';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { MensajeChat } from '../../core/modelos';
import { HaceTiempoPipe } from '../../core/pipes/fecha.pipe';
import { AuthService } from '../../core/servicios/auth.service';
import { AvisosService } from '../../core/servicios/avisos.service';
import { ChatAbierto } from '../../core/servicios/gestor-chat.service';
import { SupabaseService } from '../../core/servicios/supabase.service';

const NOMBRE_DE_CONTEXTO = {
  lost_pet: 'Mascota perdida',
  urgent_case: 'Caso urgente',
  adoption: 'Adopción',
} as const;

/** Ventana de chat flotante (abajo a la derecha), para coordinar con sesión iniciada. */
@Component({
  selector: 'app-ventana-chat',
  imports: [IonButton, IonIcon, IonInput, IonSpinner, HaceTiempoPipe],
  templateUrl: './ventana-chat.component.html',
  styleUrl: './ventana-chat.component.scss',
})
export class VentanaChatComponent implements OnInit, OnDestroy {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);

  readonly chat = input.required<ChatAbierto>();
  readonly cerrar = output<void>();

  protected readonly usuario = this.auth.usuario;
  protected readonly mensajes = signal<MensajeChat[]>([]);
  protected readonly texto = signal('');
  protected readonly enviando = signal(false);
  private readonly lista = viewChild<ElementRef<HTMLDivElement>>('lista');
  private desuscribir: (() => void) | null = null;

  constructor() {
    effect(() => {
      this.mensajes();
      const elemento = this.lista()?.nativeElement;
      if (elemento) setTimeout(() => (elemento.scrollTop = elemento.scrollHeight), 0);
    });
  }

  ngOnInit(): void {
    const { idConversacion } = this.chat();
    this.supabase.mensajesDeChat
      .filtrar({ conversation_id: idConversacion }, 'created_at', 100)
      .then((lista) => this.mensajes.set(lista))
      .catch((error) => console.error('No se pudo cargar el chat:', error));

    this.desuscribir = this.supabase.mensajesDeChat.suscribir((evento) => {
      if (evento.datos?.conversation_id !== idConversacion) return;
      if (evento.tipo === 'create') this.agregarMensaje(evento.datos);
    });
  }

  ngOnDestroy(): void {
    this.desuscribir?.();
  }

  protected nombreDeContexto(): string {
    return NOMBRE_DE_CONTEXTO[this.chat().tipoDeContexto];
  }

  protected esMio(mensaje: MensajeChat): boolean {
    return mensaje.sender_id === this.usuario()?.id;
  }

  protected alEscribir(evento: CustomEvent<{ value?: string | null }>): void {
    this.texto.set(evento.detail.value ?? '');
  }

  protected async enviar(): Promise<void> {
    const texto = this.texto().trim();
    const usuario = this.usuario();
    if (!texto || !usuario) return;

    const { idConversacion, tipoDeContexto, idDeContexto, tituloDeContexto } = this.chat();
    this.enviando.set(true);
    try {
      const nuevo = await this.supabase.mensajesDeChat.crear({
        conversation_id: idConversacion,
        context_type: tipoDeContexto,
        context_id: idDeContexto,
        context_title: tituloDeContexto,
        sender_id: usuario.id,
        sender_name: usuario.full_name || 'Usuario',
        text: texto,
        read_by: [usuario.id],
      });
      // El mensaje propio se agrega en el acto: el tiempo real está apagado por defecto.
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
