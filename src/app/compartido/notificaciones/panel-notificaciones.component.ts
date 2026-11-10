import { Component, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonBadge, IonButton, IonIcon } from '@ionic/angular';
import { Notificacion } from '../../core/modelos';
import { HaceTiempoPipe } from '../../core/pipes/fecha.pipe';
import { NotificacionesService } from '../../core/servicios/notificaciones.service';
import { PanelAlertasComponent } from './panel-alertas.component';

const ICONO_POR_TIPO: Record<string, { nombre: string; color: string }> = {
  lost_pet: { nombre: 'paw', color: 'danger' },
  urgent_case: { nombre: 'warning', color: 'warning' },
  sighting: { nombre: 'eye', color: 'secondary' },
  abuse_report: { nombre: 'shield-half', color: 'danger' },
  chat_reply: { nombre: 'chatbubble-ellipses', color: 'primary' },
  case_update: { nombre: 'information-circle', color: 'tertiary' },
};

/** Contenido del desplegable de la campana: lista de notificaciones o configuración de alertas. */
@Component({
  selector: 'app-panel-notificaciones',
  imports: [IonButton, IonIcon, IonBadge, HaceTiempoPipe, PanelAlertasComponent],
  templateUrl: './panel-notificaciones.component.html',
  styleUrl: './panel-notificaciones.component.scss',
})
export class PanelNotificacionesComponent {
  protected readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);
  protected readonly pestania = signal<'lista' | 'configuracion'>('lista');
  readonly cerrar = output<void>();

  /**
   * Marca la notificación como leída y lleva a la pantalla a la que apunta.
   * Antes solo la marcaba: cada notificación trae su `link`, pero nadie lo
   * usaba, así que tocarla no llevaba a ningún lado.
   */
  protected abrir(notificacion: Notificacion): void {
    if (!notificacion.read) void this.notificaciones.marcarLeida(notificacion.id);

    // Solo rutas internas de la app: el link sale de la base, y una dirección
    // externa o un "//sitio" no tienen por qué abrirse desde acá.
    const destino = notificacion.link;
    if (!destino || !destino.startsWith('/') || destino.startsWith('//')) return;

    this.cerrar.emit();
    void this.router.navigateByUrl(destino);
  }

  protected icono(tipo: string): { nombre: string; color: string } {
    return ICONO_POR_TIPO[tipo] ?? { nombre: 'notifications', color: 'medium' };
  }

  protected alternarPestania(): void {
    this.pestania.update((actual) => (actual === 'configuracion' ? 'lista' : 'configuracion'));
  }
}
