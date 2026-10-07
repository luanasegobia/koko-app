import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-no-encontrada',
  imports: [IonContent, IonButton, IonIcon, RouterLink],
  template: `
    <ion-content class="ion-padding">
      <div class="centro">
        <div class="contenido">
          <div class="marca">
            <ion-icon name="paw"></ion-icon>
            <span>Koko</span>
          </div>
          <p class="codigo">404</p>
          <div class="linea"></div>
          <h2>No encontramos esta página</h2>
          <p class="texto-secundario">
            La dirección <span class="monoespaciado texto-chico">{{ ruta }}</span> no existe o cambió
            de lugar.
          </p>
          <ion-button routerLink="/">
            <ion-icon slot="start" name="home-outline"></ion-icon>
            Volver al inicio
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: `
    ion-content {
      --background: linear-gradient(
        135deg,
        rgba(var(--ion-color-primary-rgb), 0.1),
        var(--ion-background-color) 50%,
        rgba(var(--ion-color-secondary-rgb), 0.1)
      );
    }

    .centro {
      min-height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .contenido {
      max-width: 440px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .marca {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--koko-texto-secundario);
      font-family: var(--koko-fuente-titulos);
      font-weight: 600;
      font-size: 0.9rem;

      ion-icon {
        font-size: 20px;
      }
    }

    .codigo {
      font-size: 4.5rem;
      font-weight: 300;
      line-height: 1;
      color: rgba(var(--ion-color-medium-rgb), 0.4);
    }

    .linea {
      width: 64px;
      height: 2px;
      background: var(--ion-border-color);
    }

    h2 {
      font-size: 1.5rem;
    }
  `,
})
export class NoEncontradaPage {
  protected readonly ruta = inject(Router).url;
}
