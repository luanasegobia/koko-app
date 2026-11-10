import { Component, computed, inject, signal } from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AccionesDeDuenioComponent } from '../../compartido/acciones-de-duenio/acciones-de-duenio.component';
import { CabeceraComponent } from '../../compartido/cabecera/cabecera.component';
import { FiltroProximidadComponent } from '../../compartido/filtro-proximidad/filtro-proximidad.component';
import { MapaComponent, Marcador } from '../../compartido/mapa/mapa.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { Denuncia, PuntoLatLng } from '../../core/modelos';
import { FechaPipe } from '../../core/pipes/fecha.pipe';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { distanciaEnKm } from '../../core/utilidades';
import { BuscadorSeguimientoComponent } from './buscador-seguimiento.component';
import { ETIQUETA_ESTADO_DENUNCIA, TIPO_DENUNCIA } from './denuncias.constantes';
import { FormularioDenunciaComponent } from './formulario-denuncia.component';

@Component({
  selector: 'app-denuncias',
  imports: [
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    FechaPipe,
    CabeceraComponent,
    FiltroProximidadComponent,
    MapaComponent,
    AccionesDeDuenioComponent,
    FormularioDenunciaComponent,
    BuscadorSeguimientoComponent,
  ],
  templateUrl: './denuncias.page.html',
  styleUrl: './denuncias.page.scss',
})
export class DenunciasPage {
  private readonly supabase = inject(SupabaseService);
  private readonly avisos = inject(AvisosService);

  protected readonly tipo = TIPO_DENUNCIA;
  protected readonly etiquetaEstado = ETIQUETA_ESTADO_DENUNCIA;

  protected readonly cargando = signal(true);
  protected readonly denuncias = signal<Denuncia[]>([]);
  protected readonly vista = signal<'lista' | 'mapa'>('lista');
  protected readonly filtroTipo = signal('all');
  protected readonly filtroEstado = signal('all');
  protected readonly ubicacion = signal<PuntoLatLng | null>(null);
  protected readonly radioKm = signal(5);
  protected readonly mostrarFormulario = signal(false);
  protected readonly mostrarSeguimiento = signal(false);

  protected readonly filtradas = computed(() => {
    const tipo = this.filtroTipo();
    const estado = this.filtroEstado();
    const ubicacion = this.ubicacion();
    const radio = this.radioKm();
    return this.denuncias().filter((d) => {
      if (tipo !== 'all' && d.type !== tipo) return false;
      if (estado !== 'all' && d.status !== estado) return false;
      if (ubicacion && d.lat && d.lng && distanciaEnKm(ubicacion, [d.lat, d.lng]) > radio) return false;
      return true;
    });
  });

  protected readonly marcadores = computed<Marcador[]>(() =>
    this.filtradas()
      .filter((d) => d.lat && d.lng)
      .map((d) => ({
        id: d.id,
        lat: d.lat!,
        lng: d.lng!,
        icono: d.type === 'urgente' ? 'denunciaUrgente' : 'denuncia',
        popup: {
          titulo: TIPO_DENUNCIA[d.type]?.etiqueta ?? d.type,
          subtitulo: ETIQUETA_ESTADO_DENUNCIA[d.status] ?? d.status,
          etiqueta:
            d.type === 'urgente'
              ? { texto: 'Urgente', color: 'danger' }
              : d.type === 'anonima'
                ? { texto: 'Anónima', color: 'tertiary' }
                : { texto: 'Regular', color: 'naranja' },
          lineas: [
            d.description.length > 120 ? `${d.description.slice(0, 120)}…` : d.description,
            d.address ? `📍 ${d.address}` : '',
            d.tracking_code ? `#${d.tracking_code}` : '',
          ].filter(Boolean),
        },
      })),
  );

  ionViewWillEnter(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    try {
      this.denuncias.set(await this.supabase.denuncias.listar('-created_at', 100));
    } catch (error) {
      await this.avisos.error(mensajeDeError(error), 'No se pudieron cargar las denuncias');
    } finally {
      this.cargando.set(false);
    }
  }

  protected alEnviar(): void {
    this.mostrarFormulario.set(false);
    void this.cargar();
  }

  /** Eliminar queda solo para administración: que quien denuncia no pueda borrar la evidencia. */
  /** Referencia estable: se pasa tal cual a cada tarjeta, sin crear una función por ciclo. */
  protected readonly eliminarDenuncia = async (denuncia: Denuncia): Promise<void> => {
    await this.supabase.denuncias.eliminar(denuncia.id);
    await this.cargar();
  };
}
