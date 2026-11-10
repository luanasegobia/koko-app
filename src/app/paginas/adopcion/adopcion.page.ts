import { Component, computed, inject, signal } from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AccionesDeDuenioComponent } from '../../compartido/acciones-de-duenio/acciones-de-duenio.component';
import { CabeceraComponent } from '../../compartido/cabecera/cabecera.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { MascotaAdopcion } from '../../core/modelos';
import { AvisosService } from '../../core/servicios/avisos.service';
import { GestorChatService } from '../../core/servicios/gestor-chat.service';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { FormularioAdopcionComponent } from './formulario-adopcion.component';

const ETIQUETA_TAMANIO: Record<string, string> = { pequeño: 'Pequeño', mediano: 'Mediano', grande: 'Grande' };
const ESTADO: Record<string, { etiqueta: string; color: string }> = {
  disponible: { etiqueta: 'Disponible', color: 'primary' },
  en_proceso: { etiqueta: 'En proceso', color: 'secondary' },
  adoptado: { etiqueta: 'Adoptado', color: 'medium' },
};

@Component({
  selector: 'app-adopcion',
  imports: [
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonBadge,
    IonChip,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    CabeceraComponent,
    AccionesDeDuenioComponent,
    FormularioAdopcionComponent,
  ],
  templateUrl: './adopcion.page.html',
  styleUrl: './adopcion.page.scss',
})
export class AdopcionPage {
  private readonly supabase = inject(SupabaseService);
  private readonly avisos = inject(AvisosService);
  private readonly gestorChat = inject(GestorChatService);

  protected readonly cargando = signal(true);
  protected readonly mascotas = signal<MascotaAdopcion[]>([]);
  protected readonly filtroEspecie = signal('all');
  protected readonly filtroTamanio = signal('all');
  protected readonly mostrarFormulario = signal(false);
  protected readonly enEdicion = signal<MascotaAdopcion | null>(null);

  protected readonly filtradas = computed(() => {
    const especie = this.filtroEspecie();
    const tamanio = this.filtroTamanio();
    return this.mascotas().filter((m) => {
      if (especie !== 'all' && m.species !== especie) return false;
      if (tamanio !== 'all' && m.size !== tamanio) return false;
      return true;
    });
  });

  ionViewWillEnter(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    try {
      this.mascotas.set(await this.supabase.mascotasEnAdopcion.listar('-created_at', 50));
    } catch (error) {
      await this.avisos.error(mensajeDeError(error), 'No se pudieron cargar las publicaciones');
    } finally {
      this.cargando.set(false);
    }
  }

  protected etiquetaTamanio(tamanio?: string): string {
    return tamanio ? ETIQUETA_TAMANIO[tamanio] ?? tamanio : '';
  }

  protected estado(mascota: MascotaAdopcion): { etiqueta: string; color: string } {
    return ESTADO[mascota.status] ?? ESTADO['disponible'];
  }

  protected abrirFormulario(mascota: MascotaAdopcion | null = null): void {
    this.enEdicion.set(mascota);
    this.mostrarFormulario.set(true);
  }

  protected cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
    this.enEdicion.set(null);
  }

  protected alGuardar(): void {
    this.cerrarFormulario();
    void this.cargar();
  }

  protected abrirChat(mascota: MascotaAdopcion): void {
    this.gestorChat.abrir({ tipoDeContexto: 'adoption', idDeContexto: mascota.id, tituloDeContexto: mascota.name });
  }

  /** Referencia estable: se pasa tal cual a cada tarjeta, sin crear una función por ciclo. */
  protected readonly eliminarMascota = async (mascota: MascotaAdopcion): Promise<void> => {
    await this.supabase.mascotasEnAdopcion.eliminar(mascota.id);
    await this.cargar();
  };
}
