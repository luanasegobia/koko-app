import { Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { IonBadge, IonButton, IonIcon, IonPopover } from '@ionic/angular';
import { AuthService } from '../../core/servicios/auth.service';
import { NotificacionesService } from '../../core/servicios/notificaciones.service';
import { PanelNotificacionesComponent } from './panel-notificaciones.component';

/**
 * Campana con el contador de no leídas. Abre el panel en un popover.
 *
 * Cada página tiene su propia cabecera con su campana. Al tocar una
 * notificación se navega a otra página, y en el teléfono Ionic deja la
 * anterior en la pila sin redibujarla: bajar `isOpen` no alcanzaba para que el
 * popover se fuera. Por eso se cierra llamando a dismiss() y, por las dudas,
 * también en cuanto empieza cualquier navegación.
 */
@Component({
  selector: 'app-campana-notificaciones',
  imports: [IonButton, IonIcon, IonBadge, IonPopover, PanelNotificacionesComponent],
  template: `
    @if (auth.autenticado()) {
      <ion-button fill="clear" class="campana" (click)="abrir($event)" aria-label="Notificaciones">
        <ion-icon slot="icon-only" name="notifications-outline"></ion-icon>
        @if (notificaciones.noLeidas() > 0) {
          <ion-badge color="danger" class="globo">
            {{ notificaciones.noLeidas() > 9 ? '9+' : notificaciones.noLeidas() }}
          </ion-badge>
        }
      </ion-button>
      <ion-popover
        [isOpen]="abierto()"
        [event]="evento()"
        (didDismiss)="abierto.set(false)"
        side="bottom"
        alignment="end"
        [arrow]="false"
        [showBackdrop]="false"
      >
        <ng-template>
          <app-panel-notificaciones (cerrar)="cerrar()" />
        </ng-template>
      </ion-popover>
    }
  `,
  styles: `
    .campana {
      position: relative;
    }

    .globo {
      position: absolute;
      top: 2px;
      right: 0;
      font-size: 0.65rem;
      min-width: 18px;
      padding: 2px 4px;
      border-radius: 999px;
    }

    ion-popover {
      --width: 360px;
      --max-width: calc(100vw - 16px);
    }
  `,
})
export class CampanaNotificacionesComponent {
  protected readonly auth = inject(AuthService);
  protected readonly notificaciones = inject(NotificacionesService);
  protected readonly abierto = signal(false);
  protected readonly evento = signal<Event | undefined>(undefined);
  private readonly popover = viewChild(IonPopover);

  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((evento) => {
        if (evento instanceof NavigationStart && this.abierto()) this.cerrar();
      });
  }

  abrir(evento: Event): void {
    this.evento.set(evento);
    this.abierto.set(true);
  }

  protected cerrar(): void {
    this.abierto.set(false);
    void this.popover()?.dismiss();
  }
}
