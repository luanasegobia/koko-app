import { Component, inject, signal } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { leerConfiguracion } from '../environments/entorno';
import { PantallaConfiguracionComponent } from './compartido/pantalla-configuracion/pantalla-configuracion.component';
import { PantallaErrorComponent } from './compartido/pantalla-error/pantalla-error.component';
import { ErrorDeConfiguracion } from './core/errores';
import { EstadoDeErrorService } from './core/servicios/manejador-de-errores';
import { TemaService } from './core/servicios/tema.service';
import { registrarIconos } from './iconos';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, PantallaConfiguracionComponent, PantallaErrorComponent],
  template: `
    <ion-app>
      @if (errorDeConfiguracion(); as error) {
        <app-pantalla-configuracion [error]="error" />
      } @else if (estadoDeError.errorFatal(); as error) {
        <app-pantalla-error [error]="error" />
      } @else {
        <ion-router-outlet />
      }
    </ion-app>
  `,
})
export class AppComponent {
  protected readonly estadoDeError = inject(EstadoDeErrorService);
  protected readonly errorDeConfiguracion = signal<ErrorDeConfiguracion | null>(null);

  constructor() {
    registrarIconos();
    // Instancia el servicio de tema para que aplique el modo claro/oscuro desde el arranque.
    inject(TemaService);

    // Si falta el .env.local, la app no arranca en blanco: muestra qué falta y
    // cómo resolverlo, antes de que cualquier pantalla intente usar Supabase.
    try {
      leerConfiguracion();
    } catch (error) {
      if (error instanceof ErrorDeConfiguracion) {
        this.errorDeConfiguracion.set(error);
      } else {
        throw error;
      }
    }
  }
}
