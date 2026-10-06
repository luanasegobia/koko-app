import { Component, model } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { TipoCuenta } from '../../core/modelos';

interface OpcionDeRol {
  valor: TipoCuenta;
  etiqueta: string;
  descripcion: string;
  icono: string;
  color: string;
  insignia?: string;
}

const ROLES: OpcionDeRol[] = [
  {
    valor: 'usuario',
    etiqueta: 'Usuario común',
    descripcion: 'Quiero adoptar, reportar mascotas perdidas o colaborar con casos.',
    icono: 'person-outline',
    color: 'primary',
  },
  {
    valor: 'rescatista',
    etiqueta: 'Rescatista / Organización',
    descripcion:
      'Rescato animales o represento una ONG. Puedo publicar casos solidarios con alias de donación y gestionar su estado.',
    icono: 'paw-outline',
    color: 'secondary',
    insignia: 'Verificado',
  },
  {
    valor: 'organizacion',
    etiqueta: 'Organización / ONG',
    descripcion: 'Represento una organización protectora de animales.',
    icono: 'business-outline',
    color: 'tertiary',
    insignia: 'Verificado',
  },
  {
    valor: 'veterinario',
    etiqueta: 'Veterinario / Clínica',
    descripcion:
      'Soy profesional veterinario o represento una clínica. Mi perfil será revisado para aparecer en el directorio.',
    icono: 'medkit-outline',
    color: 'purpura',
  },
];

/** Elección del tipo de cuenta en el onboarding. Enlace bidireccional: `[(seleccionado)]`. */
@Component({
  selector: 'app-selector-rol',
  imports: [IonIcon],
  template: `
    <div class="lista">
      @for (rol of roles; track rol.valor; let i = $index) {
        <button
          type="button"
          class="opcion aparece"
          [class.seleccionada]="seleccionado() === rol.valor"
          [style.--color-rol]="'var(--ion-color-' + rol.color + ')'"
          [style.--color-rol-rgb]="'var(--ion-color-' + rol.color + '-rgb)'"
          [style.animation-delay]="i * 80 + 'ms'"
          (click)="seleccionado.set(rol.valor)"
        >
          <span class="icono"><ion-icon [name]="rol.icono"></ion-icon></span>
          <span class="texto">
            <span class="etiqueta">
              {{ rol.etiqueta }}
              @if (rol.insignia) {
                <span class="insignia"><ion-icon name="shield-checkmark"></ion-icon> {{ rol.insignia }}</span>
              }
            </span>
            <span class="descripcion">{{ rol.descripcion }}</span>
          </span>
          @if (seleccionado() === rol.valor) {
            <ion-icon class="tilde" name="shield-checkmark" color="primary"></ion-icon>
          }
        </button>
      }
    </div>
  `,
  styles: `
    .lista {
      display: grid;
      gap: 12px;
    }

    .opcion {
      width: 100%;
      text-align: left;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 14px;
      border-radius: 14px;
      border: 2px solid rgba(var(--color-rol-rgb), 0.35);
      background: rgba(var(--color-rol-rgb), 0.05);
      color: var(--ion-text-color);
      font: inherit;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: var(--color-rol);
      }

      &.seleccionada {
        border-color: var(--color-rol);
        background: rgba(var(--color-rol-rgb), 0.12);
        box-shadow: 0 0 0 3px rgba(var(--color-rol-rgb), 0.25);
      }
    }

    .icono {
      flex-shrink: 0;
      display: inline-flex;
      padding: 8px;
      border-radius: 10px;
      background: var(--ion-card-background);
      color: var(--color-rol);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);

      ion-icon {
        font-size: 20px;
      }
    }

    .texto {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .etiqueta {
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .insignia {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(var(--ion-color-success-rgb), 0.15);
      color: var(--ion-color-success-shade);
    }

    .descripcion {
      font-size: 0.85rem;
      color: var(--koko-texto-secundario);
    }

    .tilde {
      flex-shrink: 0;
      font-size: 20px;
      margin-top: 2px;
    }
  `,
})
export class SelectorRolComponent {
  protected readonly roles = ROLES;
  readonly seleccionado = model<TipoCuenta>('usuario');
}
