import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationCancellationCode,
  NavigationEnd,
  NavigationError,
  Router,
} from '@angular/router';
import { IonApp, IonRouterOutlet, IonSpinner } from '@ionic/angular';
import { filter, map, take } from 'rxjs';
import { leerConfiguracion } from '../environments/entorno';
import { PantallaConfiguracionComponent } from './compartido/pantalla-configuracion/pantalla-configuracion.component';
import { PantallaErrorComponent } from './compartido/pantalla-error/pantalla-error.component';
import { ErrorDeConfiguracion } from './core/errores';
import { EstadoDeErrorService } from './core/servicios/manejador-de-errores';
import { TemaService } from './core/servicios/tema.service';
import { registrarIconos } from './iconos';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, IonSpinner, PantallaConfiguracionComponent, PantallaErrorComponent],
  template: `
    <ion-app>
      @if (errorDeConfiguracion(); as error) {
        <app-pantalla-configuracion [error]="error" />
      } @else if (estadoDeError.errorFatal(); as error) {
        <app-pantalla-error [error]="error" />
      } @else {
        <ion-router-outlet />
        @if (arrancando()) {
          <div class="arranque" role="status" aria-label="Cargando">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
          </div>
        }
      }
    </ion-app>
  `,
  styles: `
    .arranque {
      position: fixed;
      inset: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ion-background-color);
    }
  `,
})
export class AppComponent {
  protected readonly estadoDeError = inject(EstadoDeErrorService);
  protected readonly errorDeConfiguracion = signal<ErrorDeConfiguracion | null>(null);

  /**
   * Verdadero hasta que termina la primera navegación. Las guardias esperan a
   * que se lea la sesión (getUser más la consulta a profiles) y, mientras
   * tanto, el outlet está vacío: sin esto se veía una pantalla en blanco.
   * Una redirección de una guardia (por ejemplo, al login) no cuenta como
   * final: el spinner sigue hasta que se muestra la página de destino.
   */
  protected readonly arrancando = toSignal(
    inject(Router).events.pipe(
      filter(
        (evento) =>
          evento instanceof NavigationEnd ||
          evento instanceof NavigationError ||
          (evento instanceof NavigationCancel &&
            evento.code !== NavigationCancellationCode.Redirect),
      ),
      take(1),
      map(() => false),
    ),
    { initialValue: true },
  );

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
