import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonCard, IonIcon } from '@ionic/angular';
import { AuthService } from '../../core/servicios/auth.service';
import { PanelAlertasComponent } from './panel-alertas.component';

/**
 * Tarjeta de alertas que aparece en Mascotas Perdidas y Casos Urgentes.
 * Ambas páginas son públicas: sin sesión invita a entrar en vez de fallar.
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
      <ion-card>
        <app-panel-alertas />
      </ion-card>
    }
  `,
  styles: `
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
}
