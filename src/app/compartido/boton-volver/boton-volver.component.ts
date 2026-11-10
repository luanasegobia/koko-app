import { Component, inject, input } from '@angular/core';
import { IonIcon, IonRouterOutlet, NavController } from '@ionic/angular';

/**
 * Enlace "Volver" para las pantallas que viven fuera del layout y no tienen
 * menú: sin esto, la única salida era el botón atrás del navegador o recargar.
 *
 * Si se llegó navegando dentro de la app, vuelve a la pantalla anterior. Si la
 * pantalla se abrió directo (un enlace, un QR, una recarga) no hay a dónde
 * volver, así que va al destino por defecto.
 */
@Component({
  selector: 'app-boton-volver',
  imports: [IonIcon],
  template: `
    <button type="button" class="volver" (click)="volver()">
      <ion-icon name="arrow-back" aria-hidden="true"></ion-icon>
      {{ texto() }}
    </button>
  `,
  styles: `
    :host {
      display: block;
    }

    .volver {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 44px;
      padding: 0 4px;
      border: 0;
      background: none;
      color: var(--ion-text-color);
      font: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      opacity: 0.75;
      cursor: pointer;

      &:hover,
      &:focus-visible {
        opacity: 1;
      }

      ion-icon {
        font-size: 18px;
      }
    }
  `,
})
export class BotonVolverComponent {
  private readonly navegacion = inject(NavController);
  // Opcional: en un test o fuera de un ion-router-outlet no existe.
  private readonly salida = inject(IonRouterOutlet, { optional: true });

  /** A dónde ir cuando no hay una pantalla anterior dentro de la app. */
  readonly porDefecto = input.required<string>();
  readonly texto = input('Volver');

  protected volver(): void {
    if (this.salida?.canGoBack()) {
      this.navegacion.back();
      return;
    }
    void this.navegacion.navigateBack(this.porDefecto());
  }
}
