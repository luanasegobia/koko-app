import { Component, input } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { ErrorDeConfiguracion } from '../../core/errores';

/** Se muestra cuando falta o está mal el .env.local, con los pasos para resolverlo. */
@Component({
  selector: 'app-pantalla-configuracion',
  imports: [IonContent, IonIcon],
  template: `
    <ion-content class="ion-padding">
      <div class="marco">
        <div class="marca">
          <ion-icon name="paw"></ion-icon>
          <span>Koko</span>
        </div>
        <div class="icono icono-ambar">
          <ion-icon name="settings-outline"></ion-icon>
        </div>
        <h1>Falta configurar el proyecto</h1>
        <p class="mensaje">{{ error().message }}</p>

        @if (error().pasos.length > 0) {
          <ol class="pasos">
            @for (paso of error().pasos; track $index) {
              <li>
                <span class="numero">{{ $index + 1 }}</span>
                <span>{{ paso }}</span>
              </li>
            }
          </ol>
        }

        <p class="nota">
          El archivo <code>.env.local</code> nunca se sube al repositorio. Si es tu primera
          vez, mirá el README.
        </p>
      </div>
    </ion-content>
  `,
  styleUrl: './pantalla-configuracion.component.scss',
})
export class PantallaConfiguracionComponent {
  readonly error = input.required<ErrorDeConfiguracion>();
}
