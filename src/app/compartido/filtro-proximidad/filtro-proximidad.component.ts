import { Component, inject, model, signal } from '@angular/core';
import { IonButton, IonCard, IonIcon, IonRange, IonSpinner } from '@ionic/angular';
import { PuntoLatLng } from '../../core/modelos';
import { GeolocalizacionService } from '../../core/servicios/geolocalizacion.service';

/**
 * Filtro por cercanía: pide la ubicación y deja elegir el radio en km.
 * Se usa con enlace bidireccional: `[(radioKm)]` y `[(ubicacion)]`.
 */
@Component({
  selector: 'app-filtro-proximidad',
  imports: [IonCard, IonButton, IonIcon, IonRange, IonSpinner],
  template: `
    <ion-card class="ion-padding">
      <div class="encabezado">
        <span class="titulo-filtro">
          <ion-icon name="location" color="primary"></ion-icon>
          Filtrar por proximidad
        </span>
        @if (ubicacion()) {
          <ion-button fill="clear" size="small" color="medium" (click)="limpiar()">
            <ion-icon slot="start" name="close"></ion-icon>
            Limpiar
          </ion-button>
        }
      </div>

      @if (!ubicacion()) {
        <ion-button expand="block" fill="outline" size="small" [disabled]="buscando()" (click)="localizar()">
          @if (buscando()) {
            <ion-spinner slot="start" name="crescent"></ion-spinner>
          } @else {
            <ion-icon slot="start" name="locate"></ion-icon>
          }
          {{ buscando() ? 'Obteniendo ubicación...' : 'Usar mi ubicación' }}
        </ion-button>
      } @else {
        <div class="radio">
          <span class="texto-secundario texto-chico">Radio de búsqueda</span>
          <strong class="valor">{{ radioKm() }} km</strong>
        </div>
        <ion-range
          [min]="0.5"
          [max]="20"
          [step]="0.5"
          [value]="radioKm()"
          (ionInput)="cambiarRadio($event)"
          aria-label="Radio de búsqueda en kilómetros"
        >
          <span slot="start" class="texto-mini texto-secundario">0.5 km</span>
          <span slot="end" class="texto-mini texto-secundario">20 km</span>
        </ion-range>
      }
      @if (error()) {
        <p class="texto-mini" style="color: var(--ion-color-danger)">{{ error() }}</p>
      }
    </ion-card>
  `,
  styles: `
    .encabezado {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .titulo-filtro {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      font-size: 0.95rem;
    }

    .radio {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .valor {
      color: var(--ion-color-primary);
    }

    ion-range {
      --bar-height: 4px;
      --knob-size: 20px;
      padding-top: 4px;
      padding-bottom: 0;
    }

    ion-spinner {
      width: 16px;
      height: 16px;
      margin-right: 6px;
    }
  `,
})
export class FiltroProximidadComponent {
  private readonly geolocalizacion = inject(GeolocalizacionService);

  readonly radioKm = model(5);
  readonly ubicacion = model<PuntoLatLng | null>(null);
  protected readonly buscando = signal(false);
  protected readonly error = signal<string | null>(null);

  async localizar(): Promise<void> {
    this.buscando.set(true);
    this.error.set(null);
    try {
      const posicion = await this.geolocalizacion.obtenerPosicion();
      this.ubicacion.set([posicion.lat, posicion.lng]);
    } catch {
      this.error.set('No se pudo obtener tu ubicación.');
    } finally {
      this.buscando.set(false);
    }
  }

  limpiar(): void {
    this.ubicacion.set(null);
  }

  protected cambiarRadio(evento: CustomEvent<{ value: number | { lower: number; upper: number } }>): void {
    const valor = evento.detail.value;
    this.radioKm.set(typeof valor === 'number' ? valor : valor.lower);
  }
}
