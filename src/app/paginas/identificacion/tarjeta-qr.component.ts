import { Component, computed, effect, input, signal, untracked } from '@angular/core';
import { IonBadge, IonButton, IonCard, IonIcon } from '@ionic/angular';
import QRCode from 'qrcode';
import { Mascota } from '../../core/modelos';

/**
 * Ficha de una mascota con su código QR. El código se genera en el navegador:
 * la URL pública nunca sale hacia un servicio externo.
 */
@Component({
  selector: 'app-tarjeta-qr',
  imports: [IonCard, IonBadge, IonButton, IonIcon],
  template: `
    <ion-card class="tarjeta">
      <div class="cabecera">
        @if (mascota().photo_url) {
          <img [src]="mascota().photo_url" [alt]="mascota().name" class="foto" />
        } @else {
          <div class="foto sin-foto"><ion-icon name="paw"></ion-icon></div>
        }
        <div class="datos">
          <h3>{{ mascota().name }}</h3>
          <p class="texto-chico texto-secundario">
            {{ mascota().breed || mascota().species }}
            @if (mascota().age_years) { · {{ mascota().age_years }} años }
            @if (mascota().sex) { · {{ mascota().sex === 'macho' ? '♂' : '♀' }} }
          </p>
          @if (mascota().allergies) {
            <ion-badge color="danger" class="alergias">
              <ion-icon name="warning-outline"></ion-icon> {{ mascota().allergies }}
            </ion-badge>
          }
        </div>
      </div>

      <div class="qr-fila">
        @if (imagenQr(); as imagen) {
          <img [src]="imagen" [alt]="'Código QR de ' + mascota().name" class="qr" />
        } @else {
          <div class="qr cargando-qr"></div>
        }
        <div class="enlaces">
          <p class="texto-mini texto-secundario">Ficha pública:</p>
          <div class="url monoespaciado texto-mini">{{ urlPublica() }}</div>
          <div class="botones">
            <ion-button fill="outline" size="small" [href]="imagenQr() || undefined" [download]="'qr-' + mascota().name + '.png'" [disabled]="!imagenQr()">
              <ion-icon slot="start" name="download-outline"></ion-icon>
              Descargar QR
            </ion-button>
            <ion-button fill="outline" size="small" [href]="urlPublica()" target="_blank" rel="noopener noreferrer">
              <ion-icon slot="start" name="open-outline"></ion-icon>
              Ver ficha
            </ion-button>
          </div>
        </div>
      </div>
    </ion-card>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .tarjeta {
      height: 100%;
      padding: 20px;
      padding-right: 48px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      border: 1px solid rgba(var(--ion-color-purpura-rgb), 0.2);
      transition: box-shadow 0.3s;

      &:hover {
        box-shadow: 0 10px 25px -10px rgba(var(--koko-sombra-rgb), 0.3);
      }
    }

    .cabecera {
      display: flex;
      gap: 16px;
    }

    .foto {
      flex-shrink: 0;
      width: 80px;
      height: 80px;
      border-radius: 14px;
      object-fit: cover;

      &.sin-foto {
        background: rgba(var(--ion-color-medium-rgb), 0.12);
        display: flex;
        align-items: center;
        justify-content: center;

        ion-icon {
          font-size: 32px;
          color: rgba(var(--ion-color-medium-rgb), 0.5);
        }
      }
    }

    .datos {
      flex: 1;
      min-width: 0;

      h3 {
        font-size: 1.1rem;
      }
    }

    .alergias {
      margin-top: 8px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: normal;
    }

    .qr-fila {
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: center;

      @media (min-width: 640px) {
        flex-direction: row;
      }
    }

    .qr {
      flex-shrink: 0;
      width: 112px;
      height: 112px;
      border-radius: 10px;
      border: 1px solid var(--ion-border-color);
      background: var(--koko-fondo-qr);

      &.cargando-qr {
        background: rgba(var(--ion-color-medium-rgb), 0.15);
        animation: pulso 1.5s ease-in-out infinite;
      }
    }

    .enlaces {
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .url {
      background: rgba(var(--ion-color-medium-rgb), 0.12);
      border-radius: 10px;
      padding: 8px 12px;
      word-break: break-all;
    }

    .botones {
      display: flex;
      gap: 8px;

      ion-button {
        flex: 1;
        margin: 0;
      }
    }

    @keyframes pulso {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `,
})
export class TarjetaQrComponent {
  readonly mascota = input.required<Mascota>();
  protected readonly imagenQr = signal<string | null>(null);
  protected readonly urlPublica = computed(
    () => `${window.location.origin}/ficha/${this.mascota().qr_id || this.mascota().id}`,
  );

  constructor() {
    effect(() => {
      const url = this.urlPublica();
      untracked(() => {
        this.imagenQr.set(null);
        QRCode.toDataURL(url, { width: 400, margin: 1 })
          .then((imagen) => {
            // Si cambió la URL mientras se generaba, se descarta.
            if (this.urlPublica() === url) this.imagenQr.set(imagen);
          })
          .catch((error) => console.error('No se pudo generar el QR:', error));
      });
    });
  }
}
