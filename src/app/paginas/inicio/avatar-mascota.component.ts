import { Component, computed, input } from '@angular/core';
import { Especie } from '../../core/modelos';

/**
 * Carita de una mascota: su foto si tiene, o un dibujo según la especie. Los
 * colores del dibujo son de pelaje, no del tema, así que no cambian con el
 * modo oscuro.
 */
@Component({
  selector: 'app-avatar-mascota',
  template: `
    @if (foto()) {
      <img [src]="foto()" [alt]="nombre()" />
    } @else {
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="28" fill="#A0C2D5" opacity=".5" />
        @if (especie() === 'gato') {
          <path
            d="M13 24l1-14 11 7zM43 24l-1-14-11 7z"
            [attr.fill]="pelaje().cara"
            stroke="#313857"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
        } @else {
          <ellipse cx="12" cy="30" rx="6" ry="12" [attr.fill]="pelaje().orejas" transform="rotate(12 12 30)" />
          <ellipse cx="44" cy="30" rx="6" ry="12" [attr.fill]="pelaje().orejas" transform="rotate(-12 44 30)" />
        }
        <circle cx="28" cy="31" r="16" [attr.fill]="pelaje().cara" stroke="#313857" stroke-width="1.6" />
        <circle cx="21.5" cy="29" r="2.2" fill="#313857" />
        <circle cx="34.5" cy="29" r="2.2" fill="#313857" />
        <ellipse cx="28" cy="35" rx="3" ry="2.2" fill="#313857" />
      </svg>
    }
  `,
  styles: `
    :host {
      display: block;
      aspect-ratio: 1;
    }

    img,
    svg {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 50%;
    }

    img {
      object-fit: cover;
    }
  `,
})
export class AvatarMascotaComponent {
  readonly especie = input<Especie | undefined>('perro');
  readonly foto = input<string | null | undefined>(null);
  readonly nombre = input('');

  protected readonly pelaje = computed(() => {
    if (this.especie() === 'gato') return { cara: '#E38B3D', orejas: '#E38B3D' };
    if (this.especie() === 'perro') return { cara: '#E8B67A', orejas: '#9A6B3E' };
    return { cara: '#B9BCC8', orejas: '#7C88AC' };
  });
}
