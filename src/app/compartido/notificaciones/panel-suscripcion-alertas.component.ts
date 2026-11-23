import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonCard, IonIcon } from '@ionic/angular';
import { AuthService } from '../../core/servicios/auth.service';
import { NotificacionesService } from '../../core/servicios/notificaciones.service';
import { PanelAlertasComponent } from './panel-alertas.component';

/**
 * Tarjeta de alertas que aparece en Mascotas Perdidas y Casos Urgentes.
 * Ambas páginas son públicas: sin sesión invita a entrar en vez de fallar.
 * Con sesión arranca plegada, para que la lista quede a la vista: la
 * configuración se abre al tocar la cabecera.
 */
@Component({
  selector: 'app-panel-suscripcion-alertas',
  imports: [IonCard, IonButton, IonIcon, RouterLink, PanelAlertasComponent],
  template: `
    @if (!auth.autenticado()) {
      <ion-card class="invitacion">
        <div class="icono"><ion-icon name="notifications-outline"></ion-icon></div>
        <div class="texto">
          <p class="titulo-invitacion">Recibí alertas de tu zona</p>
          <p class="texto-chico texto-secundario">
            Entrá a tu cuenta para que te avisemos cuando haya novedades cerca tuyo.
          </p>
        </div>
        <ion-button fill="outline" size="small" routerLink="/login">Iniciar sesión</ion-button>
      </ion-card>
    } @else {
      <ion-card class="plegable">
        <button
          type="button"
          class="cabecera-alertas"
          [attr.aria-expanded]="abierto()"
          aria-controls="configuracion-alertas"
          (click)="abierto.set(!abierto())"
        >
          <span class="icono"
            ><ion-icon name="notifications-outline" aria-hidden="true"></ion-icon
          ></span>
          <span class="texto">
            <span class="titulo-invitacion">Alertas de tu zona</span>
            <span class="texto-chico texto-secundario">{{ resumen() }}</span>
          </span>
          <ion-icon
            class="flecha"
            [name]="abierto() ? 'chevron-up' : 'chevron-down'"
            aria-hidden="true"
          ></ion-icon>
        </button>
        @if (abierto()) {
          <div id="configuracion-alertas">
            <app-panel-alertas />
          </div>
        }
      </ion-card>
    }
  `,
  styles: `
    .cabecera-alertas {
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      min-height: 64px;
      padding: 12px 18px;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;

      .texto {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .flecha {
        flex: none;
        font-size: 20px;
        color: var(--koko-texto-secundario);
      }

      &:focus-visible {
        outline: 3px solid rgba(var(--ion-color-primary-rgb), 0.55);
        outline-offset: -3px;
      }
    }

    #configuracion-alertas {
      border-top: 1px solid rgba(var(--koko-sombra-rgb), 0.1);
    }

    .invitacion {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 14px;
      padding: 18px;
    }

    .icono {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: rgba(var(--ion-color-primary-rgb), 0.12);
      color: var(--ion-color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      ion-icon {
        font-size: 20px;
      }
    }

    .texto {
      flex: 1;
      min-width: 200px;
    }

    .titulo-invitacion {
      font-family: var(--koko-fuente-titulos);
      font-weight: 600;
    }
  `,
})
export class PanelSuscripcionAlertasComponent {
  protected readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificacionesService);

  protected readonly abierto = signal(false);

  /** Lo que dice la cabecera plegada: si hay alertas activas y dónde. */
  protected readonly resumen = computed(() => {
    const suscripcion = this.notificaciones.suscripcion();
    if (!suscripcion) return 'Activalas para enterarte de lo que pasa cerca tuyo.';
    const zona = suscripcion.location_label?.trim() || 'tu ubicación';
    return `Activas · ${suscripcion.radius_km ?? 5} km alrededor de ${zona}`;
  });
}
