import { Component, computed, input, output, signal } from '@angular/core';
import { IonBadge, IonButton, IonCard, IonIcon, IonSegment, IonSegmentButton, IonSpinner } from '@ionic/angular';
import { Veterinaria } from '../../core/modelos';
import { FechaPipe } from '../../core/pipes/fecha.pipe';

@Component({
  selector: 'app-admin-veterinarias',
  imports: [IonCard, IonBadge, IonButton, IonIcon, IonSegment, IonSegmentButton, IonSpinner, FechaPipe],
  templateUrl: './admin-veterinarias.component.html',
  styles: `
    .contadores {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .contador {
      padding: 8px 16px;
      border-radius: 12px;
      text-align: center;
      border: 1px solid;

      .numero {
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 1.2;
      }

      &.ambar {
        background: rgba(var(--ion-color-warning-rgb), 0.1);
        border-color: rgba(var(--ion-color-warning-rgb), 0.4);
        color: var(--ion-color-warning-shade);
      }

      &.verde {
        background: rgba(var(--ion-color-primary-rgb), 0.06);
        border-color: rgba(var(--ion-color-primary-rgb), 0.25);
        color: var(--ion-color-primary);
      }
    }

    ion-segment {
      @media (min-width: 640px) {
        width: auto;
        align-self: flex-start;
      }

      ion-segment-button {
        text-transform: none;
        flex-direction: row;
        gap: 6px;
      }
    }

    .lista {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .tarjeta {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px;
      border: 1px solid rgba(var(--ion-color-warning-rgb), 0.4);
      background: rgba(var(--ion-color-warning-rgb), 0.04);

      &.verificada {
        border-color: rgba(var(--ion-color-primary-rgb), 0.3);
        background: var(--ion-card-background);
      }

      @media (min-width: 640px) {
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
      }
    }

    .info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;

      h3 {
        font-size: 1.1rem;
      }
    }

    .detalles {
      gap: 6px 16px;

      span {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
    }
  `,
})
export class AdminVeterinariasComponent {
  readonly veterinarias = input.required<Veterinaria[]>();
  readonly cargando = input(false);
  readonly actualizando = input(false);
  readonly aprobar = output<Veterinaria>();
  readonly revocar = output<Veterinaria>();

  protected readonly pestania = signal<'pendientes' | 'verificadas'>('pendientes');
  protected readonly pendientes = computed(() => this.veterinarias().filter((v) => !v.is_verified));
  protected readonly verificadas = computed(() => this.veterinarias().filter((v) => v.is_verified));
  protected readonly mostradas = computed(() =>
    this.pestania() === 'pendientes' ? this.pendientes() : this.verificadas(),
  );
}
