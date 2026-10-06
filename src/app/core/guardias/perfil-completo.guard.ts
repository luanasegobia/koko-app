import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../servicios/auth.service';

/**
 * Manda a completar el perfil antes de dejar entrar a las pantallas privadas.
 * La pregunta "¿esta ruta necesita perfil?" la responde el árbol de rutas, no
 * una lista aparte.
 */
export const perfilCompletoGuard: CanActivateFn & CanActivateChildFn = async (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.listo();
  const usuario = auth.usuario();
  if (usuario && !usuario.profile_completed) {
    return router.createUrlTree(['/completar-perfil'], { queryParams: { volverA: estado.url } });
  }
  return true;
};
