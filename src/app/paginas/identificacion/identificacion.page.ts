import { Component, inject, signal } from '@angular/core';
import {
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
import { AccionesDeDuenioComponent } from '../../compartido/acciones-de-duenio/acciones-de-duenio.component';
import { CabeceraComponent } from '../../compartido/cabecera/cabecera.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { Mascota } from '../../core/modelos';
import { AuthService } from '../../core/servicios/auth.service';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { FormularioMascotaComponent } from './formulario-mascota.component';
import { TarjetaQrComponent } from './tarjeta-qr.component';

const PASOS = [
  'Registrá tu mascota con sus datos y foto',
  'Se genera un QR único descargable e imprimible',
  'Quien encuentre tu mascota escanea y te contacta',
];

@Component({
  selector: 'app-identificacion',
  imports: [
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonSpinner,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    CabeceraComponent,
    AccionesDeDuenioComponent,
    FormularioMascotaComponent,
    TarjetaQrComponent,
  ],
  templateUrl: './identificacion.page.html',
  styleUrl: './identificacion.page.scss',
})
export class IdentificacionPage {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);

  protected readonly pasos = PASOS;
  protected readonly cargando = signal(true);
  protected readonly mascotas = signal<Mascota[]>([]);
  protected readonly mostrarFormulario = signal(false);
  protected readonly enEdicion = signal<Mascota | null>(null);

  ionViewWillEnter(): void {
    void this.cargar();
  }

  /** Solo las propias: la política de lectura de la tabla es abierta (la ficha pública la necesita). */
  async cargar(): Promise<void> {
    const usuario = this.auth.usuario();
    if (!usuario) return;
    try {
      this.mascotas.set(
        await this.supabase.mascotas.filtrar({ created_by_id: usuario.id }, '-created_at', 50),
      );
    } catch (error) {
      await this.avisos.error(mensajeDeError(error), 'No se pudieron cargar tus mascotas');
    } finally {
      this.cargando.set(false);
    }
  }

  protected abrirFormulario(mascota: Mascota | null = null): void {
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

  /** Referencia estable: se pasa tal cual a cada tarjeta, sin crear una función por ciclo. */
  protected readonly eliminarMascota = async (mascota: Mascota): Promise<void> => {
    await this.supabase.mascotas.eliminar(mascota.id);
    await this.cargar();
  };
}
