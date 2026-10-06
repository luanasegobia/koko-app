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
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { CabeceraComponent } from '../../compartido/cabecera/cabecera.component';
import { PanelSuscripcionAlertasComponent } from '../../compartido/notificaciones/panel-suscripcion-alertas.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { CasoUrgente } from '../../core/modelos';
import { AuthService } from '../../core/servicios/auth.service';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { FormularioCasoUrgenteComponent } from './formulario-caso-urgente.component';
import { TarjetaCasoUrgenteComponent } from './tarjeta-caso-urgente.component';

@Component({
  selector: 'app-casos-urgentes',
  imports: [
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonBadge,
    IonSpinner,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    CabeceraComponent,
    PanelSuscripcionAlertasComponent,
    TarjetaCasoUrgenteComponent,
    FormularioCasoUrgenteComponent,
  ],
  templateUrl: './casos-urgentes.page.html',
})
export class CasosUrgentesPage {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);

  protected readonly cargando = signal(true);
  protected readonly casos = signal<CasoUrgente[]>([]);
  protected readonly activos = computed(() => this.casos().filter((c) => c.status !== 'resuelto'));
  protected readonly mostrarFormulario = signal(false);
  protected readonly enEdicion = signal<CasoUrgente | null>(null);

  ionViewWillEnter(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    try {
      this.casos.set(await this.supabase.casosUrgentes.listar('-created_at', 50));
    } catch (error) {
      await this.avisos.error(mensajeDeError(error), 'No se pudieron cargar los casos');
    } finally {
      this.cargando.set(false);
    }
  }

  protected abrirFormulario(caso: CasoUrgente | null = null): void {
    if (!this.auth.autenticado()) {
      this.auth.irAlLogin();
      return;
    }
    this.enEdicion.set(caso);
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

  protected eliminarCaso(caso: CasoUrgente): () => Promise<void> {
    return async () => {
      await this.supabase.casosUrgentes.eliminar(caso.id);
      await this.cargar();
    };
  }
}
