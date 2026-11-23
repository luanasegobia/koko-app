import { Component, computed, inject, signal } from '@angular/core';
import {
  AlertController,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { CabeceraComponent } from '../../compartido/cabecera/cabecera.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import {
  CasoUrgente,
  Denuncia,
  MascotaAdopcion,
  MascotaPerdida,
  Veterinaria,
} from '../../core/modelos';
import { AuthService } from '../../core/servicios/auth.service';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { AdminCasosComponent } from './admin-casos.component';
import { AdminEstadisticasComponent } from './admin-estadisticas.component';
import { FormularioVeterinariaComponent } from '../veterinarias/formulario-veterinaria.component';
import { AdminVeterinariasComponent } from './admin-veterinarias.component';

type Pestania = 'estadisticas' | 'veterinarias' | 'casos';

/** Panel de administración: estadísticas, verificación de veterinarias y moderación. */
/**
 * El panel cuenta y lista todo lo cargado, no solo lo último. Con el límite por
 * defecto (100) los totales quedaban mal y una veterinaria o una denuncia
 * pendiente más vieja no se podía alcanzar. 1000 es el máximo de filas que
 * devuelve la API de Supabase por consulta; si algún día se supera, hay que
 * pasar a contar del lado del servidor y paginar.
 */
const LIMITE_DEL_PANEL = 1000;

@Component({
  selector: 'app-admin',
  imports: [
    IonContent,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonBadge,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    CabeceraComponent,
    FormularioVeterinariaComponent,
    AdminEstadisticasComponent,
    AdminVeterinariasComponent,
    AdminCasosComponent,
  ],
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.scss',
})
export class AdminPage {
  private readonly supabase = inject(SupabaseService);
  private readonly avisos = inject(AvisosService);
  private readonly alertController = inject(AlertController);
  protected readonly auth = inject(AuthService);

  protected readonly pestania = signal<Pestania>('estadisticas');
  protected readonly cargando = signal(true);
  protected readonly actualizando = signal(false);

  protected readonly veterinarias = signal<Veterinaria[]>([]);
  protected readonly mascotasPerdidas = signal<MascotaPerdida[]>([]);
  protected readonly casosUrgentes = signal<CasoUrgente[]>([]);
  protected readonly adopciones = signal<MascotaAdopcion[]>([]);
  protected readonly denuncias = signal<Denuncia[]>([]);

  /** La ficha abierta en el formulario: 'nueva' para dar de alta, o la que se edita. */
  protected readonly fichaAbierta = signal<Veterinaria | 'nueva' | null>(null);
  protected readonly fichaEnEdicion = computed(() => {
    const ficha = this.fichaAbierta();
    return ficha === 'nueva' ? null : ficha;
  });
  protected readonly tituloDeFicha = computed(() => {
    const ficha = this.fichaEnEdicion();
    return ficha ? `Editar ${ficha.name}` : 'Agregar veterinaria';
  });

  protected readonly veterinariasPendientes = computed(
    () => this.veterinarias().filter((v) => !v.is_verified).length,
  );

  ionViewWillEnter(): void {
    if (this.auth.esAdmin()) void this.cargarTodo();
  }

  async cargarTodo(): Promise<void> {
    try {
      const [veterinarias, perdidas, urgentes, adopciones, denuncias] = await Promise.all([
        this.supabase.veterinarias.listar('-created_at', LIMITE_DEL_PANEL),
        this.supabase.mascotasPerdidas.listar('-created_at', LIMITE_DEL_PANEL),
        this.supabase.casosUrgentes.listar('-created_at', LIMITE_DEL_PANEL),
        this.supabase.mascotasEnAdopcion.listar('-created_at', LIMITE_DEL_PANEL),
        this.supabase.denuncias.listar('-created_at', LIMITE_DEL_PANEL),
      ]);
      this.veterinarias.set(veterinarias);
      this.mascotasPerdidas.set(perdidas);
      this.casosUrgentes.set(urgentes);
      this.adopciones.set(adopciones);
      this.denuncias.set(denuncias);
    } catch (error) {
      await this.avisos.error(mensajeDeError(error), 'No se pudo cargar el panel');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async verificarVeterinaria(
    veterinaria: Veterinaria,
    verificada: boolean,
  ): Promise<void> {
    await this.actualizar(async () => {
      await this.supabase.veterinarias.actualizar(veterinaria.id, { is_verified: verificada });
      this.veterinarias.set(
        await this.supabase.veterinarias.listar('-created_at', LIMITE_DEL_PANEL),
      );
    });
  }

  /**
   * Al dar de alta, la base la guarda sin verificar (es la regla para todas las
   * altas); como la carga administración, se verifica en el mismo paso.
   */
  protected async alGuardarVeterinaria(guardada: Veterinaria): Promise<void> {
    const eraNueva = this.fichaAbierta() === 'nueva';
    this.fichaAbierta.set(null);
    await this.actualizar(async () => {
      if (eraNueva) await this.supabase.veterinarias.actualizar(guardada.id, { is_verified: true });
      this.veterinarias.set(
        await this.supabase.veterinarias.listar('-created_at', LIMITE_DEL_PANEL),
      );
    });
    await this.avisos.exito(
      eraNueva ? `${guardada.name} ya aparece en el directorio.` : 'Cambios guardados.',
    );
  }

  protected async eliminarVeterinaria(veterinaria: Veterinaria): Promise<void> {
    const alerta = await this.alertController.create({
      header: `¿Eliminar ${veterinaria.name}?`,
      message: 'Deja de aparecer en el directorio. Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.actualizar(async () => {
              await this.supabase.veterinarias.eliminar(veterinaria.id);
              this.veterinarias.set(
                await this.supabase.veterinarias.listar('-created_at', LIMITE_DEL_PANEL),
              );
            });
          },
        },
      ],
    });
    await alerta.present();
  }

  protected async cambiarEstadoDeCaso(id: string, status: CasoUrgente['status']): Promise<void> {
    await this.actualizar(async () => {
      await this.supabase.casosUrgentes.actualizar(id, { status });
      this.casosUrgentes.set(
        await this.supabase.casosUrgentes.listar('-created_at', LIMITE_DEL_PANEL),
      );
    });
  }

  protected async cambiarEstadoDePerdida(
    id: string,
    status: MascotaPerdida['status'],
  ): Promise<void> {
    await this.actualizar(async () => {
      await this.supabase.mascotasPerdidas.actualizar(id, { status });
      this.mascotasPerdidas.set(
        await this.supabase.mascotasPerdidas.listar('-created_at', LIMITE_DEL_PANEL),
      );
    });
  }

  protected async cambiarEstadoDeDenuncia(id: string, status: Denuncia['status']): Promise<void> {
    await this.actualizar(async () => {
      await this.supabase.denuncias.actualizar(id, { status });
      this.denuncias.set(await this.supabase.denuncias.listar('-created_at', LIMITE_DEL_PANEL));
    });
  }

  /** Ejecuta una mutación mostrando el estado "actualizando" y el error si lo hubiera. */
  private async actualizar(operacion: () => Promise<void>): Promise<void> {
    this.actualizando.set(true);
    try {
      await operacion();
    } catch (error) {
      await this.avisos.error(mensajeDeError(error), 'No se pudo guardar el cambio');
    } finally {
      this.actualizando.set(false);
    }
  }
}
