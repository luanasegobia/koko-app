import { Component, input } from '@angular/core';
import { IonButtons, IonHeader, IonMenuButton, IonTitle, IonToolbar } from '@ionic/angular';
import { CampanaNotificacionesComponent } from '../notificaciones/campana-notificaciones.component';

/**
 * Barra superior de las páginas que viven dentro del layout: botón de menú
 * (solo en pantallas chicas, donde el menú lateral está oculto), título y la
 * campana de notificaciones.
 */
@Component({
  selector: 'app-cabecera',
  imports: [IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, CampanaNotificacionesComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ titulo() }}</ion-title>
        <ion-buttons slot="end">
          <ng-content />
          <app-campana-notificaciones />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class CabeceraComponent {
  readonly titulo = input.required<string>();
}
