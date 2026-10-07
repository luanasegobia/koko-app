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
 *
 * Es genérico en el tipo del registro: la plantilla que lo usa infiere `T` del
 * `[registro]` y exige que `[eliminar]` reciba ese mismo tipo.
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
export class AccionesDeDuenioComponent<T extends object> {
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly alertController = inject(AlertController);

  /** Registro sobre el que actúan los botones. */
  readonly registro = input.required<T>();
  /** Columna que guarda la autoría (cambia según la tabla). */
  readonly columnaAutor = input('created_by_id');
  readonly etiqueta = input('esta publicación');
  readonly soloAdminPuedeEliminar = input(false);
  /** Sin edición, el menú solo ofrece eliminar (por ejemplo, en las denuncias). */
  readonly tieneEdicion = input(true);
  /**
   * Borra el registro. Se espera para poder mostrar el error si la base lo
   * rechaza. Tiene que ser una referencia estable (una propiedad de la
   * página), no una llamada que arme una función nueva en cada ciclo.
   * Si no se pasa, el menú no ofrece eliminar.
   */
  readonly eliminar = input<(registro: T) => Promise<unknown>>();

  readonly editar = output<void>();

  protected readonly esDuenio = computed(() => {
    const usuario = this.auth.usuario();
    const autor = (this.registro() as Record<string, unknown>)[this.columnaAutor()];
    return Boolean(usuario?.id) && usuario?.id === autor;
  });

  protected readonly puedeEditar = computed(
    () => this.tieneEdicion() && (this.esDuenio() || this.auth.esAdmin()),
  );

  protected readonly puedeEliminar = computed(() => {
    if (!this.eliminar()) return false;
    return this.soloAdminPuedeEliminar()
      ? this.auth.esAdmin()
      : this.esDuenio() || this.auth.esAdmin();
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
    const eliminar = this.eliminar();
    if (!eliminar) return;

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
              await eliminar(this.registro());
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
