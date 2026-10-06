import { Component, inject, output, signal } from '@angular/core';
import { IonBadge, IonButton, IonIcon } from '@ionic/angular';
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
  protected readonly pestania = signal<'lista' | 'configuracion'>('lista');
  readonly cerrar = output<void>();

  protected icono(tipo: string): { nombre: string; color: string } {
    return ICONO_POR_TIPO[tipo] ?? { nombre: 'notifications', color: 'medium' };
  }

  protected alternarPestania(): void {
    this.pestania.update((actual) => (actual === 'configuracion' ? 'lista' : 'configuracion'));
  }
}
