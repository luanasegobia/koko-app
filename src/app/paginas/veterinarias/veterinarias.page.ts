import { Component, computed, inject, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AccionesDeDuenioComponent } from '../../compartido/acciones-de-duenio/acciones-de-duenio.component';
import { CabeceraComponent } from '../../compartido/cabecera/cabecera.component';
import { MapaComponent, Marcador } from '../../compartido/mapa/mapa.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { Veterinaria } from '../../core/modelos';
import { AuthService } from '../../core/servicios/auth.service';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { EstadoDeVeterinaria, estadoDeVeterinaria } from './estado-veterinaria';
import { FormularioVeterinariaComponent } from './formulario-veterinaria.component';

interface VeterinariaConEstado {
  veterinaria: Veterinaria;
  estado: EstadoDeVeterinaria;
}

const COLOR_ETIQUETA: Record<EstadoDeVeterinaria['color'], { fondo: string; color: string }> = {
  danger: { fondo: '#fee2e2', color: '#b91c1c' },
  success: { fondo: '#dcfce7', color: '#15803d' },
  medium: { fondo: '#e5e7eb', color: '#4b5563' },
};

@Component({
  selector: 'app-veterinarias',
  imports: [
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    CabeceraComponent,
    MapaComponent,
    AccionesDeDuenioComponent,
    FormularioVeterinariaComponent,
  ],
  templateUrl: './veterinarias.page.html',
  styleUrl: './veterinarias.page.scss',
})
export class VeterinariasPage {
  private readonly supabase = inject(SupabaseService);
  private readonly avisos = inject(AvisosService);
  protected readonly auth = inject(AuthService);

  protected readonly cargando = signal(true);
  protected readonly veterinarias = signal<Veterinaria[]>([]);
  protected readonly vista = signal<'lista' | 'mapa'>('lista');
  protected readonly enEdicion = signal<Veterinaria | null>(null);

  /** Solo las verificadas, con emergencias primero y abiertas antes que cerradas. */
  protected readonly ordenadas = computed<VeterinariaConEstado[]>(() =>
    this.veterinarias()
      .filter((v) => v.is_verified)
      .map((veterinaria) => ({ veterinaria, estado: estadoDeVeterinaria(veterinaria) }))
      .sort((a, b) => {
        if (a.veterinaria.is_emergency && !b.veterinaria.is_emergency) return -1;
        if (!a.veterinaria.is_emergency && b.veterinaria.is_emergency) return 1;
        if (a.estado.abierta && !b.estado.abierta) return -1;
        if (!a.estado.abierta && b.estado.abierta) return 1;
        return 0;
      }),
  );

  protected readonly cantidadEmergencia = computed(
    () => this.ordenadas().filter((v) => v.veterinaria.is_emergency).length,
  );
  protected readonly cantidadAbiertas = computed(
    () => this.ordenadas().filter((v) => !v.veterinaria.is_emergency && v.estado.abierta).length,
  );
  protected readonly cantidadCerradas = computed(
    () => this.ordenadas().filter((v) => !v.veterinaria.is_emergency && !v.estado.abierta).length,
  );

  protected readonly marcadores = computed<Marcador[]>(() =>
    this.ordenadas()
      .filter(({ veterinaria }) => veterinaria.lat && veterinaria.lng)
      .map(({ veterinaria, estado }) => ({
        id: veterinaria.id,
        lat: veterinaria.lat!,
        lng: veterinaria.lng!,
        icono: veterinaria.is_emergency || estado.abierta ? 'veterinariaAbierta' : 'veterinaria',
        popup: {
          titulo: veterinaria.name,
          etiqueta: { texto: estado.etiqueta, ...COLOR_ETIQUETA[estado.color] },
          lineas: [
            `📍 ${veterinaria.address}`,
            estado.horario ? `🕐 ${estado.horario}` : '',
            estado.proximaApertura ? `⏰ ${estado.proximaApertura}` : '',
          ].filter(Boolean),
          telefono: veterinaria.phone,
        },
      })),
  );

  ionViewWillEnter(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    try {
      this.veterinarias.set(await this.supabase.veterinarias.listar());
    } catch (error) {
      await this.avisos.error(mensajeDeError(error), 'No se pudieron cargar las veterinarias');
    } finally {
      this.cargando.set(false);
    }
  }

  protected alGuardar(): void {
    this.enEdicion.set(null);
    void this.cargar();
  }

  protected eliminarVeterinaria(veterinaria: Veterinaria): () => Promise<void> {
    return async () => {
      await this.supabase.veterinarias.eliminar(veterinaria.id);
      await this.cargar();
    };
  }
}
