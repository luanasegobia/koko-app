import { Component, input } from '@angular/core';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { isDevMode } from '@angular/core';

/** Pantalla genérica para un error que impide seguir. */
@Component({
  selector: 'app-pantalla-error',
  imports: [IonContent, IonIcon, IonButton],
  template: `
    <ion-content class="ion-padding">
      <div class="marco">
        <div class="marca">
          <ion-icon name="paw"></ion-icon>
          <span>Koko</span>
        </div>
        <div class="icono icono-rojo">
          <ion-icon name="warning-outline"></ion-icon>
        </div>
        <h1>Algo salió mal</h1>
        <p class="mensaje">
          Se produjo un error inesperado y la aplicación no pudo seguir. Probá recargar la
          página.
        </p>
        <ion-button color="dark" (click)="recargar()">
          <ion-icon slot="start" name="refresh"></ion-icon>
          Recargar
        </ion-button>
        @if (enDesarrollo) {
          <pre class="detalle">{{ error().stack || error().message }}</pre>
        }
      </div>
    </ion-content>
  `,
  styleUrl: '../pantalla-configuracion/pantalla-configuracion.component.scss',
})
export class PantallaErrorComponent {
  readonly error = input.required<Error>();
  protected readonly enDesarrollo = isDevMode();

  recargar(): void {
    window.location.reload();
  }
}
