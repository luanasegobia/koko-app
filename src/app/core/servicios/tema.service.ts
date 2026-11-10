import { effect, Injectable, signal } from '@angular/core';

export type Tema = 'claro' | 'oscuro';

const CLAVE = 'koko-tema';

function temaInicial(): Tema {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === 'claro' || guardado === 'oscuro') return guardado;
  } catch {
    // Modo incógnito o almacenamiento bloqueado: se usa la preferencia del sistema.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}

/**
 * Modo claro / oscuro.
 *
 * Ionic trae la paleta oscura lista (palettes/dark.class.css): alcanza con
 * ponerle la clase `ion-palette-dark` al documento.
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  readonly tema = signal<Tema>(temaInicial());

  constructor() {
    effect(() => {
      const actual = this.tema();
      document.documentElement.classList.toggle('ion-palette-dark', actual === 'oscuro');
      try {
        localStorage.setItem(CLAVE, actual);
      } catch {
        // Si no se puede guardar, el tema igual funciona durante la sesión.
      }
    });
  }

  alternar(): void {
    this.tema.update((actual) => (actual === 'oscuro' ? 'claro' : 'oscuro'));
  }
}
