import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../servicios/auth.service';

/**
 * Deja pasar solo con sesión iniciada. Espera a que termine la primera carga
 * de sesión para no mandar al login a alguien que sí está autenticado.
 */
export const autenticadoGuard: CanActivateFn & CanActivateChildFn = async (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.listo();
  if (auth.autenticado()) return true;

  return router.createUrlTree(['/login'], { queryParams: { redirect: estado.url } });
};
