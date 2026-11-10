import { Component, input } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';

/** Marco común de las pantallas de registro, recuperación y cambio de contraseña. */
@Component({
  selector: 'app-layout-auth',
  imports: [IonContent, IonIcon],
  template: `
    <ion-content class="ion-padding">
      <div class="envoltorio">
        <div class="cabecera">
          <div class="icono">
            <ion-icon [name]="icono()" aria-hidden="true"></ion-icon>
          </div>
          <h1>{{ titulo() }}</h1>
          @if (subtitulo()) {
            <p class="subtitulo">{{ subtitulo() }}</p>
          }
        </div>
        <div class="tarjeta">
          <ng-content />
        </div>
        <p class="pie">
          <ng-content select="[pie]" />
        </p>
      </div>
    </ion-content>
  `,
  styles: `
    :host {
      display: contents;
    }

    .envoltorio {
      max-width: 440px;
      margin: 0 auto;
      padding: 40px 0;
    }

    .cabecera {
      text-align: center;
      margin-bottom: 32px;
    }

    .icono {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 18px;
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      margin-bottom: 16px;

      ion-icon {
        font-size: 28px;
      }
    }

    h1 {
      font-size: 1.75rem;
    }

    .subtitulo {
      color: var(--koko-texto-secundario);
      margin-top: 8px;
    }

    .tarjeta {
      background: var(--ion-card-background);
      border: 1px solid var(--ion-border-color);
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 1px 3px rgba(var(--koko-sombra-rgb), 0.06);
    }

    .pie {
      text-align: center;
      font-size: 0.9rem;
      color: var(--koko-texto-secundario);
      margin-top: 24px;

      &:empty {
        display: none;
      }
    }
  `,
})
export class LayoutAuthComponent {
  readonly icono = input.required<string>();
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
}
