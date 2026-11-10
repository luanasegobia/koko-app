import { Component, input } from '@angular/core';

export type TipoDePatita = 'almohadillas' | 'peluda' | 'manchada' | 'dalmata';

/**
 * Patita ilustrada de la marca: la que desfila en la pantalla de bienvenida y
 * asoma en la esquina de las pantallas de acceso.
 *
 * Todas las variantes comparten la misma silueta y solo cambian el relleno y
 * los detalles:
 *
 *   almohadillas  pelaje liso con las almohadillas marcadas
 *   peluda        pelaje liso con mechones en la pata
 *   manchada      manchas grandes sobre la pata
 *   dalmata       almohadillas y manchas del mismo color
 *
 * Los colores del dibujo son fijos a propósito: representan pelajes, no el tema
 * de la app, así que no cambian entre modo claro y oscuro.
 */
@Component({
  selector: 'app-patita',
  template: `
    <svg viewBox="0 0 320 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g [attr.fill]="pelaje()" stroke="#313857" stroke-width="5">
        <rect x="150" y="12" width="180" height="126" rx="42" />
        <ellipse cx="26" cy="62" rx="21" ry="25" transform="rotate(-24 26 62)" />
        <ellipse cx="57" cy="30" rx="23" ry="27" transform="rotate(-9 57 30)" />
        <ellipse cx="93" cy="21" rx="23" ry="27" transform="rotate(6 93 21)" />
        <ellipse cx="126" cy="36" rx="21" ry="25" transform="rotate(20 126 36)" />
        <ellipse cx="88" cy="97" rx="44" ry="35" transform="rotate(-8 88 97)" />
      </g>

      @switch (tipo()) {
        @case ('almohadillas') {
          <g [attr.fill]="detalle()" stroke="#313857" stroke-width="3">
            <ellipse cx="93" cy="102" rx="27" ry="21" transform="rotate(-8 93 102)" />
            <ellipse cx="27" cy="65" rx="11" ry="13" transform="rotate(-24 27 65)" />
            <ellipse cx="58" cy="34" rx="12" ry="14" transform="rotate(-9 58 34)" />
            <ellipse cx="94" cy="25" rx="12" ry="14" transform="rotate(6 94 25)" />
            <ellipse cx="127" cy="40" rx="11" ry="13" transform="rotate(20 127 40)" />
          </g>
        }
        @case ('peluda') {
          <g stroke="#313857" stroke-width="2.5" fill="none" opacity=".55">
            <path d="M170,40 q10,10 0,22" />
            <path d="M195,35 q10,12 0,26" />
            <path d="M220,32 q10,14 0,30" />
            <path d="M245,32 q10,14 0,30" />
            <path d="M270,35 q10,12 0,26" />
          </g>
        }
        @case ('manchada') {
          <g [attr.fill]="detalle()" opacity=".9">
            <ellipse cx="205" cy="45" rx="26" ry="30" />
            <ellipse cx="270" cy="80" rx="30" ry="34" />
            <ellipse cx="52" cy="45" rx="14" ry="17" transform="rotate(-15 52 45)" />
          </g>
        }
        @case ('dalmata') {
          <g [attr.fill]="detalle()">
            <ellipse cx="93" cy="102" rx="24" ry="19" transform="rotate(-8 93 102)" />
            <ellipse cx="27" cy="65" rx="9" ry="11" transform="rotate(-24 27 65)" />
            <ellipse cx="58" cy="34" rx="10" ry="12" transform="rotate(-9 58 34)" />
            <ellipse cx="94" cy="25" rx="10" ry="12" transform="rotate(6 94 25)" />
            <ellipse cx="127" cy="40" rx="9" ry="11" transform="rotate(20 127 40)" />
            <ellipse cx="220" cy="45" rx="16" ry="20" />
            <ellipse cx="275" cy="90" rx="20" ry="24" />
          </g>
        }
      }

      @if (garras()) {
        <g fill="#FAEDCD" stroke="#313857" stroke-width="3">
          <ellipse cx="10" cy="52" rx="7" ry="10" transform="rotate(-30 10 52)" />
          <ellipse cx="138" cy="28" rx="7" ry="10" transform="rotate(28 138 28)" />
        </g>
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
  `,
})
export class PatitaComponent {
  readonly tipo = input<TipoDePatita>('almohadillas');
  readonly pelaje = input('#D9BB93');
  readonly detalle = input('#FFF6E9');
  readonly garras = input(false);
}
