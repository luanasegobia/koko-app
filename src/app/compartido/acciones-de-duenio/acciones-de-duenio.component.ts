import { Component, computed, inject, input, output } from '@angular/core';
import { ActionSheetController, AlertController, IonButton, IonIcon } from '@ionic/angular';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { AuthService } from '../../core/servicios/auth.service';
import { AvisosService } from '../../core/servicios/avisos.service';

/**
 * Menú de "⋯" con Editar y Eliminar sobre una publicación propia. Es el mismo
 * patrón para los seis módulos.
 *
 * Los permisos que decide acá son solo de interfaz: quien manda es la política
 * de la base de datos. Esto evita mostrar botones que van a fallar.
 */
@Component({
  selector: 'app-acciones-de-duenio',
  imports: [IonButton, IonIcon],
  template: `
    @if (puedeEditar() || puedeEliminar()) {
      <ion-button
        fill="clear"
        size="small"
        color="medium"
        [attr.aria-label]="'Acciones sobre ' + etiqueta()"
        (click)="abrirMenu($event)"
      >
        <ion-icon slot="icon-only" name="ellipsis-vertical"></ion-icon>
      </ion-button>
    }
  `,
})
export class AccionesDeDuenioComponent {
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly alertController = inject(AlertController);

  /** Registro sobre el que actúan los botones. */
  readonly registro = input.required<Record<string, unknown>>();
  /** Columna que guarda la autoría (cambia según la tabla). */
  readonly columnaAutor = input('created_by_id');
  readonly etiqueta = input('esta publicación');
  readonly soloAdminPuedeEliminar = input(false);
  /** Si no se pasa, el menú no ofrece eliminar. Se espera para poder mostrar el error. */
  readonly eliminar = input<() => Promise<unknown>>();

  readonly editar = output<void>();
  /** Se emite cuando se pidió editar y hay quien escuche. */
  readonly tieneEdicion = input(true);

  protected readonly esDuenio = computed(() => {
    const usuario = this.auth.usuario();
    return Boolean(usuario?.id) && usuario!.id === this.registro()[this.columnaAutor()];
  });

  protected readonly puedeEditar = computed(
    () => this.tieneEdicion() && (this.esDuenio() || this.auth.esAdmin()),
  );

  protected readonly puedeEliminar = computed(() => {
    if (!this.eliminar()) return false;
    return this.soloAdminPuedeEliminar() ? this.auth.esAdmin() : this.esDuenio() || this.auth.esAdmin();
  });

  async abrirMenu(evento: Event): Promise<void> {
    evento.stopPropagation();

    const botones = [];
    if (this.puedeEditar()) {
      botones.push({ text: 'Editar', icon: 'create-outline', handler: () => this.editar.emit() });
    }
    if (this.puedeEliminar()) {
      botones.push({
        text: 'Eliminar',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => void this.confirmarEliminacion(),
      });
    }
    botones.push({ text: 'Cancelar', role: 'cancel' });

    const hoja = await this.actionSheetController.create({
      header: `Acciones sobre ${this.etiqueta()}`,
      buttons: botones,
    });
    await hoja.present();
  }

  private async confirmarEliminacion(): Promise<void> {
    const alerta = await this.alertController.create({
      header: `¿Eliminar ${this.etiqueta()}?`,
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          // Devolver false mantiene la alerta abierta: así un error de
          // permisos no pasa desapercibido.
          handler: async () => {
            try {
              await this.eliminar()!();
              return true;
            } catch (error) {
              await this.avisos.error(mensajeDeError(error), 'No se pudo eliminar');
              return false;
            }
          },
        },
      ],
    });
    await alerta.present();
  }
}
