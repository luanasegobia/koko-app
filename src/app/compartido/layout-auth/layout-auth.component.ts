import { Component, input } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { BotonVolverComponent } from '../boton-volver/boton-volver.component';
import { PatitaComponent } from '../patita/patita.component';

/** Marco común de las pantallas de registro, recuperación y cambio de contraseña. */
@Component({
  selector: 'app-layout-auth',
  imports: [IonContent, IonIcon, PatitaComponent, BotonVolverComponent],
  template: `
    <ion-content class="ion-padding">
      <div slot="fixed" class="patita-esquina">
        <app-patita [garras]="true" />
      </div>

      <div class="envoltorio">
        <app-boton-volver class="volver" [porDefecto]="volverA()" />
        <div class="cabecera">
          <p class="antetitulo">
            <ion-icon [name]="icono()" aria-hidden="true"></ion-icon>
            Koko · Comunidad Mascotera
          </p>
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

    ion-content {
      --background: var(--ion-background-color);
    }

    .patita-esquina {
      right: -40px;
      bottom: -30px;
      width: 190px;
      opacity: 0.9;
      transform: rotate(8deg);
      pointer-events: none;
    }

    .envoltorio {
      position: relative;
      max-width: 440px;
      margin: 0 auto;
      padding: 12px 0 40px;
    }

    .volver {
      margin-bottom: 12px;
    }

    .cabecera {
      margin-bottom: 28px;
      padding: 0 8px;
    }

    .antetitulo {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--ion-color-primary);

      ion-icon {
        flex-shrink: 0;
        font-size: 16px;
      }
    }

    h1 {
      font-size: 30px;
      font-weight: 600;
      line-height: 1.15;
      letter-spacing: 0.01em;
    }

    .subtitulo {
      margin-top: 12px;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
      opacity: 0.75;
    }

    .tarjeta {
      background: var(--ion-card-background);
      border: 1px solid var(--ion-border-color);
      border-radius: 24px;
      padding: 28px;
      box-shadow: 0 1px 3px rgba(var(--koko-sombra-rgb), 0.06);
    }

    .pie {
      text-align: center;
      font-size: 13px;
      font-weight: 600;
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
  /** A dónde lleva "Volver" cuando la pantalla se abrió directo, sin una anterior. */
  readonly volverA = input('/login');
}
