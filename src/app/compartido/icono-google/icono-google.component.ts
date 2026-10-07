import { Component } from '@angular/core';

/**
 * Logo de Google a color, para el botón "Continuar con Google". Son los
 * colores oficiales de la marca, así que viven en un recurso estático
 * (public/icono-google.svg) y no en el tema de la app.
 */
@Component({
  selector: 'app-icono-google',
  template: `<img src="icono-google.svg" alt="" width="20" height="20" />`,
  styles: `
    :host {
      display: inline-flex;
      margin-right: 8px;
    }
  `,
})
export class IconoGoogleComponent {}
