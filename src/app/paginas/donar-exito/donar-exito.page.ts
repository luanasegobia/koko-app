import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton, IonCard, IonContent, IonIcon } from '@ionic/angular';
import { map } from 'rxjs';

/**
 * Solo confirma visualmente el resultado del pago. El contador real de
 * recaudación lo tiene que escribir un webhook de Stripe con la clave de
 * servicio: queda pendiente para cuando se habiliten las donaciones con tarjeta.
 */
@Component({
  selector: 'app-donar-exito',
  imports: [IonContent, IonCard, IonButton, IonIcon, RouterLink],
  template: `
    <ion-content class="ion-padding">
      <div class="centro">
        <ion-card class="tarjeta">
          @switch (estado()) {
            @case ('exito') {
              <ion-icon name="checkmark-circle" color="primary"></ion-icon>
              <h1>¡Gracias por tu donación!</h1>
              <p class="texto-secundario">
                Tu colaboración ayuda a cambiar la vida de un animal que lo necesita.
              </p>
            }
            @case ('cancelado') {
              <ion-icon name="close-circle" color="medium"></ion-icon>
              <h1>Donación cancelada</h1>
              <p class="texto-secundario">
                No se realizó ningún cargo. Si querés intentarlo de nuevo, volvé al caso urgente.
              </p>
            }
            @default {
              <ion-icon name="heart" color="medium"></ion-icon>
              <h1>Página no válida</h1>
              <p class="texto-secundario">Esta página solo es accesible desde un proceso de pago.</p>
            }
          }
          <div class="acciones">
            <ion-button fill="outline" color="medium" routerLink="/casos-urgentes">Volver a casos urgentes</ion-button>
            <ion-button routerLink="/">Ir al inicio</ion-button>
          </div>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: `
    .centro {
      min-height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tarjeta {
      max-width: 440px;
      width: 100%;
      padding: 32px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;

      > ion-icon {
        font-size: 64px;
      }

      h1 {
        font-size: 1.5rem;
      }
    }

    .acciones {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      width: 100%;
      padding-top: 8px;
    }
  `,
})
export class DonarExitoPage {
  private readonly rutaActiva = inject(ActivatedRoute);
  protected readonly estado = toSignal(
    this.rutaActiva.queryParamMap.pipe(map((parametros) => parametros.get('status'))),
  );
}
