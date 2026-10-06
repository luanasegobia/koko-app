import { Component, computed, inject, signal } from '@angular/core';
import { IonBadge, IonContent, IonIcon, IonSegment, IonSegmentButton } from '@ionic/angular';
import { CabeceraComponent } from '../../compartido/cabecera/cabecera.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { CasoUrgente, Denuncia, MascotaAdopcion, MascotaPerdida, Veterinaria } from '../../core/modelos';
import { AuthService } from '../../core/servicios/auth.service';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { AdminCasosComponent } from './admin-casos.component';
import { AdminEstadisticasComponent } from './admin-estadisticas.component';
import { AdminVeterinariasComponent } from './admin-veterinarias.component';

type Pestania = 'estadisticas' | 'veterinarias' | 'casos';

/** Panel de administración: estadísticas, verificación de veterinarias y moderación. */
@Component({
  selector: 'app-admin',
  imports: [
    IonContent,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonBadge,
    CabeceraComponent,
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
  protected readonly auth = inject(AuthService);

  protected readonly pestania = signal<Pestania>('estadisticas');
  protected readonly cargando = signal(true);
  protected readonly actualizando = signal(false);

  protected readonly veterinarias = signal<Veterinaria[]>([]);
  protected readonly mascotasPerdidas = signal<MascotaPerdida[]>([]);
  protected readonly casosUrgentes = signal<CasoUrgente[]>([]);
  protected readonly adopciones = signal<MascotaAdopcion[]>([]);
  protected readonly denuncias = signal<Denuncia[]>([]);

  protected readonly veterinariasPendientes = computed(
    () => this.veterinarias().filter((v) => !v.is_verified).length,
  );

  ionViewWillEnter(): void {
    if (this.auth.esAdmin()) void this.cargarTodo();
  }

  async cargarTodo(): Promise<void> {
    try {
      const [veterinarias, perdidas, urgentes, adopciones, denuncias] = await Promise.all([
        this.supabase.veterinarias.listar(),
        this.supabase.mascotasPerdidas.listar(),
        this.supabase.casosUrgentes.listar(),
        this.supabase.mascotasEnAdopcion.listar(),
        this.supabase.denuncias.listar(),
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

  protected async verificarVeterinaria(veterinaria: Veterinaria, verificada: boolean): Promise<void> {
    await this.actualizar(async () => {
      await this.supabase.veterinarias.actualizar(veterinaria.id, { is_verified: verificada });
      this.veterinarias.set(await this.supabase.veterinarias.listar());
    });
  }

  protected async cambiarEstadoDeCaso(id: string, status: CasoUrgente['status']): Promise<void> {
    await this.actualizar(async () => {
      await this.supabase.casosUrgentes.actualizar(id, { status });
      this.casosUrgentes.set(await this.supabase.casosUrgentes.listar());
    });
  }

  protected async cambiarEstadoDePerdida(id: string, status: MascotaPerdida['status']): Promise<void> {
    await this.actualizar(async () => {
      await this.supabase.mascotasPerdidas.actualizar(id, { status });
      this.mascotasPerdidas.set(await this.supabase.mascotasPerdidas.listar());
    });
  }

  protected async cambiarEstadoDeDenuncia(id: string, status: Denuncia['status']): Promise<void> {
    await this.actualizar(async () => {
      await this.supabase.denuncias.actualizar(id, { status });
      this.denuncias.set(await this.supabase.denuncias.listar());
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
