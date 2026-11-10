import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

/** Mensajes breves al pie de la pantalla (toasts de Ionic). */
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private readonly toastController = inject(ToastController);

  async exito(mensaje: string, titulo?: string): Promise<void> {
    await this.mostrar(mensaje, titulo, 'success');
  }

  async error(mensaje: string, titulo?: string): Promise<void> {
    await this.mostrar(mensaje, titulo, 'danger');
  }

  async informacion(mensaje: string, titulo?: string): Promise<void> {
    await this.mostrar(mensaje, titulo, 'dark');
  }

  private async mostrar(mensaje: string, titulo: string | undefined, color: string): Promise<void> {
    const toast = await this.toastController.create({
      header: titulo,
      message: mensaje,
      duration: 3500,
      position: 'bottom',
      color,
      buttons: [{ text: 'Cerrar', role: 'cancel' }],
    });
    await toast.present();
  }
}
