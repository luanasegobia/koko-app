import { ErrorHandler, inject, Injectable, signal } from '@angular/core';
import { ErrorDeConfiguracion } from '../errores';

/** Error que impide seguir usando la app (hoy, solo la configuración faltante). */
@Injectable({ providedIn: 'root' })
export class EstadoDeErrorService {
  readonly errorFatal = signal<Error | null>(null);
}

/**
 * Equivalente al ErrorBoundary de la versión anterior: atrapa los errores que
 * nadie manejó. Si es de configuración, la app muestra la pantalla con los
 * pasos para resolverlo; cualquier otro se registra en consola y la app sigue.
 */
@Injectable()
export class ManejadorDeErrores implements ErrorHandler {
  private readonly estado = inject(EstadoDeErrorService);

  handleError(error: unknown): void {
    // Los rechazos de promesas llegan envueltos en { rejection }.
    const original = (error as { rejection?: unknown })?.rejection ?? error;
    console.error('Error no controlado:', original);
    if (original instanceof ErrorDeConfiguracion) {
      this.estado.errorFatal.set(original);
    }
  }
}
