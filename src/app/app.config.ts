import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, RouteReuseStrategy, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import { rutas } from './app.routes';
import { ManejadorDeErrores } from './core/servicios/manejador-de-errores';

export const configuracionDeLaApp: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: ManejadorDeErrores },
    // Ionic reutiliza las páginas al navegar hacia atrás (pila de navegación).
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({ mode: 'md' }),
    provideRouter(rutas, withPreloading(PreloadAllModules)),
  ],
};
