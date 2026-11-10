import { Component, computed, input } from '@angular/core';
import { IonCard, IonIcon, IonSkeletonText } from '@ionic/angular';
import { CasoUrgente, Denuncia, MascotaAdopcion, MascotaPerdida, Veterinaria } from '../../core/modelos';

interface Estadistica {
  icono: string;
  etiqueta: string;
  valor: number;
  detalle: string;
  color: string;
}

interface Desglose {
  icono: string;
  color: string;
  titulo: string;
  filas: { etiqueta: string; valor: number }[];
}

@Component({
  selector: 'app-admin-estadisticas',
  imports: [IonCard, IonIcon, IonSkeletonText],
  template: `
    @if (cargando()) {
      <div class="cuadricula-estadisticas">
        @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
          <ion-card class="ion-padding"><ion-skeleton-text [animated]="true" style="height: 64px"></ion-skeleton-text></ion-card>
        }
      </div>
    } @else {
      <div class="pila-grande">
        <div class="cuadricula-estadisticas">
          @for (dato of estadisticas(); track dato.etiqueta; let i = $index) {
            <ion-card class="dato aparece" [style.animation-delay]="i * 50 + 'ms'" [style.border-left-color]="'var(--ion-color-' + dato.color + ')'">
              <div class="icono"><ion-icon [name]="dato.icono"></ion-icon></div>
              <div>
                <p class="valor">{{ dato.valor }}</p>
                <p class="texto-chico"><strong>{{ dato.etiqueta }}</strong></p>
                <p class="texto-mini texto-secundario">{{ dato.detalle }}</p>
              </div>
            </ion-card>
          }
        </div>

        <div class="cuadricula-tarjetas">
          @for (bloque of desgloses(); track bloque.titulo) {
            <ion-card class="ion-padding desglose">
              <h3>
                <ion-icon [name]="bloque.icono" [color]="bloque.color"></ion-icon>
                {{ bloque.titulo }}
              </h3>
              @for (fila of bloque.filas; track fila.etiqueta) {
                <div class="fila-desglose texto-chico">
                  <span class="texto-secundario">{{ fila.etiqueta }}</span>
                  <strong>{{ fila.valor }}</strong>
                </div>
              }
            </ion-card>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .pila-grande {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .cuadricula-estadisticas {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;

      @media (min-width: 1024px) {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .dato {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px;
      border-left: 4px solid var(--ion-color-medium);

      .icono {
        flex-shrink: 0;
        padding: 12px;
        border-radius: 12px;
        background: rgba(var(--ion-color-medium-rgb), 0.12);
        display: flex;

        ion-icon {
          font-size: 24px;
        }
      }

      .valor {
        font-family: var(--koko-fuente-titulos);
        font-size: 1.75rem;
        font-weight: 700;
        line-height: 1.1;
      }
    }

    .desglose {
      display: flex;
      flex-direction: column;
      gap: 8px;

      h3 {
        font-size: 1rem;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }
    }

    .fila-desglose {
      display: flex;
      justify-content: space-between;
    }
  `,
})
export class AdminEstadisticasComponent {
  readonly veterinarias = input.required<Veterinaria[]>();
  readonly mascotasPerdidas = input.required<MascotaPerdida[]>();
  readonly casosUrgentes = input.required<CasoUrgente[]>();
  readonly adopciones = input.required<MascotaAdopcion[]>();
  readonly denuncias = input.required<Denuncia[]>();
  readonly cargando = input(false);

  protected readonly estadisticas = computed<Estadistica[]>(() => {
    const perdidas = this.mascotasPerdidas();
    const adopciones = this.adopciones();
    const casos = this.casosUrgentes();
    const denuncias = this.denuncias();
    const veterinarias = this.veterinarias();
    return [
      {
        icono: 'paw',
        etiqueta: 'Mascotas Perdidas',
        valor: perdidas.length,
        detalle: `${perdidas.filter((p) => p.status === 'encontrada').length} encontradas`,
        color: 'danger',
      },
      {
        icono: 'heart',
        etiqueta: 'En Adopción',
        valor: adopciones.length,
        detalle: `${adopciones.filter((a) => a.status === 'adoptado').length} adoptadas`,
        color: 'rosa',
      },
      {
        icono: 'hand-left',
        etiqueta: 'Casos Urgentes',
        valor: casos.length,
        detalle: `${casos.filter((c) => c.status === 'activo').length} activos`,
        color: 'secondary',
      },
      {
        icono: 'shield-half',
        etiqueta: 'Denuncias',
        valor: denuncias.length,
        detalle: `${denuncias.filter((d) => d.status === 'pendiente').length} pendientes`,
        color: 'danger',
      },
      {
        icono: 'medkit',
        etiqueta: 'Veterinarias',
        valor: veterinarias.length,
        detalle: `${veterinarias.filter((v) => v.is_verified).length} verificadas`,
        color: 'purpura',
      },
      {
        icono: 'time',
        etiqueta: 'Vets pendientes',
        valor: veterinarias.filter((v) => !v.is_verified).length,
        detalle: 'aguardan verificación',
        color: 'warning',
      },
      {
        icono: 'checkmark-circle',
        etiqueta: 'Casos resueltos',
        valor: casos.filter((c) => c.status === 'resuelto').length,
        detalle: 'casos urgentes cerrados',
        color: 'primary',
      },
      {
        icono: 'warning',
        etiqueta: 'Denuncias en revisión',
        valor: denuncias.filter((d) => d.status === 'en_revision').length,
        detalle: 'siendo procesadas',
        color: 'secondary',
      },
    ];
  });

  protected readonly desgloses = computed<Desglose[]>(() => {
    const perdidas = this.mascotasPerdidas();
    const casos = this.casosUrgentes();
    const denuncias = this.denuncias();
    return [
      {
        icono: 'paw',
        color: 'danger',
        titulo: 'Mascotas Perdidas',
        filas: [
          { etiqueta: 'Perros', valor: perdidas.filter((p) => p.species === 'perro').length },
          { etiqueta: 'Gatos', valor: perdidas.filter((p) => p.species === 'gato').length },
          { etiqueta: 'Otros', valor: perdidas.filter((p) => p.species === 'otro').length },
          { etiqueta: 'Activas (perdidas)', valor: perdidas.filter((p) => p.status === 'perdida').length },
        ],
      },
      {
        icono: 'hand-left',
        color: 'secondary',
        titulo: 'Casos Urgentes',
        filas: [
          { etiqueta: 'Activos', valor: casos.filter((c) => c.status === 'activo').length },
          { etiqueta: 'En curso', valor: casos.filter((c) => c.status === 'en_curso').length },
          { etiqueta: 'Resueltos', valor: casos.filter((c) => c.status === 'resuelto').length },
        ],
      },
      {
        icono: 'shield-half',
        color: 'danger',
        titulo: 'Denuncias',
        filas: [
          { etiqueta: 'Pendientes', valor: denuncias.filter((d) => d.status === 'pendiente').length },
          { etiqueta: 'En revisión', valor: denuncias.filter((d) => d.status === 'en_revision').length },
          { etiqueta: 'Derivadas', valor: denuncias.filter((d) => d.status === 'derivada').length },
          { etiqueta: 'Resueltas', valor: denuncias.filter((d) => d.status === 'resuelta').length },
        ],
      },
    ];
  });
}
