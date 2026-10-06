import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { CabeceraComponent } from '../../compartido/cabecera/cabecera.component';
import { FiltroProximidadComponent } from '../../compartido/filtro-proximidad/filtro-proximidad.component';
import { MapaComponent, Marcador } from '../../compartido/mapa/mapa.component';
import { PanelSuscripcionAlertasComponent } from '../../compartido/notificaciones/panel-suscripcion-alertas.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { MascotaPerdida, PuntoLatLng } from '../../core/modelos';
import { AuthService } from '../../core/servicios/auth.service';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { distanciaEnKm } from '../../core/utilidades';
import { DialogoAvistamientoComponent } from './dialogo-avistamiento.component';
import { FormularioMascotaPerdidaComponent } from './formulario-mascota-perdida.component';
import { TarjetaMascotaPerdidaComponent } from './tarjeta-mascota-perdida.component';

@Component({
  selector: 'app-perdidas',
  imports: [
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonSearchbar,
    IonSpinner,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    CabeceraComponent,
    FiltroProximidadComponent,
    MapaComponent,
    PanelSuscripcionAlertasComponent,
    TarjetaMascotaPerdidaComponent,
    FormularioMascotaPerdidaComponent,
    DialogoAvistamientoComponent,
  ],
  templateUrl: './perdidas.page.html',
  styleUrl: './perdidas.page.scss',
})
export class PerdidasPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);
  private readonly rutaActiva = inject(ActivatedRoute);

  protected readonly cargando = signal(true);
  protected readonly mascotas = signal<MascotaPerdida[]>([]);

  protected readonly vista = signal<'lista' | 'mapa'>('lista');
  protected readonly filtroEspecie = signal('all');
  protected readonly filtroEstado = signal('perdida');
  protected readonly busqueda = signal('');
  protected readonly ubicacion = signal<PuntoLatLng | null>(null);
  protected readonly radioKm = signal(5);

  protected readonly mostrarFormulario = signal(false);
  protected readonly abrirCamara = signal(false);
  protected readonly enEdicion = signal<MascotaPerdida | null>(null);
  protected readonly mascotaAvistada = signal<MascotaPerdida | null>(null);

  protected readonly filtradas = computed(() => {
    const especie = this.filtroEspecie();
    const estado = this.filtroEstado();
    const texto = this.busqueda().trim().toLowerCase();
    const ubicacion = this.ubicacion();
    const radio = this.radioKm();

    return this.mascotas().filter((mascota) => {
      if (especie !== 'all' && mascota.species !== especie) return false;
      if (estado !== 'all' && mascota.status !== estado) return false;
      if (texto) {
        const campos = [mascota.pet_name, mascota.breed, mascota.last_seen_address, mascota.description];
        if (!campos.some((campo) => campo?.toLowerCase().includes(texto))) return false;
      }
      if (ubicacion && mascota.last_seen_lat && mascota.last_seen_lng) {
        if (distanciaEnKm(ubicacion, [mascota.last_seen_lat, mascota.last_seen_lng]) > radio) return false;
      }
      return true;
    });
  });

  protected readonly marcadores = computed<Marcador[]>(() => {
    const deMascotas: Marcador[] = this.filtradas()
      .filter((m) => m.last_seen_lat && m.last_seen_lng)
      .map((m) => ({
        id: m.id,
        lat: m.last_seen_lat!,
        lng: m.last_seen_lng!,
        icono: m.status === 'encontrada' ? 'mascotaEncontrada' : 'mascotaPerdida',
        popup: {
          imagen: m.photo_url || undefined,
          titulo: m.pet_name,
          subtitulo: m.breed || m.species,
          lineas: m.last_seen_address ? [`📍 ${m.last_seen_address}`] : [],
          etiqueta:
            m.status === 'encontrada'
              ? { texto: 'Encontrada', fondo: '#dcfce7', color: '#15803d' }
              : { texto: 'Perdida', fondo: '#fee2e2', color: '#b91c1c' },
          telefono: m.contact_phone || undefined,
        },
      }));

    const deAvistamientos: Marcador[] = this.mascotas().flatMap((m) =>
      (m.sightings || [])
        .filter((s) => s.lat && s.lng)
        .map((s, i) => ({
          id: `${m.id}-avistamiento-${i}`,
          lat: s.lat!,
          lng: s.lng!,
          icono: 'avistamiento' as const,
          popup: {
            titulo: `Avistamiento de ${m.pet_name}`,
            lineas: [s.address ? `📍 ${s.address}` : '', s.note || ''].filter(Boolean),
          },
        })),
    );

    return [...deMascotas, ...deAvistamientos];
  });

  ngOnInit(): void {
    // Los accesos directos de la portada: ?action=report abre el formulario,
    // ?action=sighting además dispara la cámara; ?search= precarga el buscador.
    const parametros = this.rutaActiva.snapshot.queryParamMap;
    const accion = parametros.get('action');
    if (accion === 'report' || accion === 'sighting') {
      this.abrirCamara.set(accion === 'sighting');
      this.abrirFormulario();
    }
    this.busqueda.set(parametros.get('search') || '');
  }

  ionViewWillEnter(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    try {
      this.mascotas.set(await this.supabase.mascotasPerdidas.listar('-created_at', 100));
    } catch (error) {
      await this.avisos.error(mensajeDeError(error), 'No se pudieron cargar los reportes');
    } finally {
      this.cargando.set(false);
    }
  }

  protected abrirFormulario(mascota: MascotaPerdida | null = null): void {
    if (!this.auth.autenticado()) {
      this.auth.irAlLogin();
      return;
    }
    this.enEdicion.set(mascota);
    this.mostrarFormulario.set(true);
  }

  protected cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
    this.abrirCamara.set(false);
    this.enEdicion.set(null);
  }

  protected alGuardar(): void {
    this.cerrarFormulario();
    void this.cargar();
  }

  protected alRegistrarAvistamiento(): void {
    void this.cargar();
  }

  protected eliminarMascota(mascota: MascotaPerdida): () => Promise<void> {
    return async () => {
      await this.supabase.mascotasPerdidas.eliminar(mascota.id);
      await this.cargar();
    };
  }
}
