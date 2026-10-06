import { Routes } from '@angular/router';
import { autenticadoGuard } from './core/guardias/autenticado.guard';
import { perfilCompletoGuard } from './core/guardias/perfil-completo.guard';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';

/**
 * Mapa de rutas de la app. Cada página se carga de forma perezosa
 * (loadComponent): el bundle inicial solo trae lo necesario para arrancar.
 *
 * Las rutas de autenticación y las fichas públicas van fuera del layout (sin
 * menú lateral). Las demás comparten AppLayoutComponent, y dentro de él las
 * privadas exigen sesión iniciada y perfil completo.
 */
export const rutas: Routes = [
  // Autenticación. Las rutas se mantienen en inglés porque los correos de
  // Supabase (recuperación de contraseña) apuntan a /reset-password.
  {
    path: 'login',
    loadComponent: () => import('./paginas/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./paginas/registro/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./paginas/recuperar-contrasena/recuperar-contrasena.page').then(
        (m) => m.RecuperarContrasenaPage,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./paginas/restablecer-contrasena/restablecer-contrasena.page').then(
        (m) => m.RestablecerContrasenaPage,
      ),
  },

  // Públicas sin layout: la ficha que abre el QR y la vuelta de Stripe.
  {
    path: 'ficha/:qrId',
    loadComponent: () =>
      import('./paginas/ficha-publica/ficha-publica.page').then((m) => m.FichaPublicaPage),
  },
  {
    path: 'donar/exito',
    loadComponent: () =>
      import('./paginas/donar-exito/donar-exito.page').then((m) => m.DonarExitoPage),
  },

  // Fuera del gate de perfil: es justamente la pantalla que hay que completar.
  {
    path: 'completar-perfil',
    canActivate: [autenticadoGuard],
    loadComponent: () =>
      import('./paginas/completar-perfil/completar-perfil.page').then(
        (m) => m.CompletarPerfilPage,
      ),
  },

  {
    path: '',
    component: AppLayoutComponent,
    children: [
      // Públicas con layout: no piden sesión.
      {
        path: 'perdidas',
        loadComponent: () => import('./paginas/perdidas/perdidas.page').then((m) => m.PerdidasPage),
      },
      {
        path: 'casos-urgentes',
        loadComponent: () =>
          import('./paginas/casos-urgentes/casos-urgentes.page').then((m) => m.CasosUrgentesPage),
      },
      {
        path: 'veterinarias',
        loadComponent: () =>
          import('./paginas/veterinarias/veterinarias.page').then((m) => m.VeterinariasPage),
      },

      // Privadas: sesión iniciada y perfil completo.
      {
        path: '',
        canActivateChild: [autenticadoGuard, perfilCompletoGuard],
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () => import('./paginas/inicio/inicio.page').then((m) => m.InicioPage),
          },
          {
            path: 'adopcion',
            loadComponent: () =>
              import('./paginas/adopcion/adopcion.page').then((m) => m.AdopcionPage),
          },
          {
            path: 'identificacion',
            loadComponent: () =>
              import('./paginas/identificacion/identificacion.page').then(
                (m) => m.IdentificacionPage,
              ),
          },
          {
            path: 'denuncias',
            loadComponent: () =>
              import('./paginas/denuncias/denuncias.page').then((m) => m.DenunciasPage),
          },
          {
            path: 'admin',
            loadComponent: () => import('./paginas/admin/admin.page').then((m) => m.AdminPage),
          },
        ],
      },
    ],
  },

  {
    path: '**',
    loadComponent: () =>
      import('./paginas/no-encontrada/no-encontrada.page').then((m) => m.NoEncontradaPage),
  },
];
