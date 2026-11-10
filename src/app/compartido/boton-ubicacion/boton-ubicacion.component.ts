import { Component, computed, inject, model, signal } from '@angular/core';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular';
import { Coordenadas } from '../../core/modelos';
import { GeolocalizacionService } from '../../core/servicios/geolocalizacion.service';

/**
 * Captura las coordenadas del dispositivo para un formulario. Sin esto, la
 * pestaña "Mapa" quedaría vacía y las alertas por cercanía no tendrían con qué
 * calcular distancias.
 *
 * Se usa con enlace bidireccional: `[(valor)]="ubicacion"`.
 */
@Component({
  selector: 'app-boton-ubicacion',
  imports: [IonButton, IonIcon, IonSpinner],
  template: `
    <div class="fila">
      <ion-button
        type="button"
        fill="outline"
        size="small"
        [disabled]="buscando()"
        (click)="pedirUbicacion()"
      >
        @if (buscando()) {
          <ion-spinner slot="start" name="crescent"></ion-spinner>
        } @else if (tieneUbicacion()) {
          <ion-icon slot="start" name="checkmark" color="primary"></ion-icon>
        } @else {
          <ion-icon slot="start" name="location-outline"></ion-icon>
        }
        {{ tieneUbicacion() ? 'Ubicación guardada' : 'Usar mi ubicación' }}
      </ion-button>
      @if (tieneUbicacion()) {
        <ion-button type="button" fill="clear" size="small" color="medium" (click)="quitar()">
          Quitar
        </ion-button>
      }
    </div>
    @if (tieneUbicacion()) {
      <p class="texto-mini texto-secundario">
        Se va a mostrar en el mapa ({{ valor().lat!.toFixed(4) }}, {{ valor().lng!.toFixed(4) }}).
      </p>
    }
    @if (error()) {
      <p class="texto-mini" style="color: var(--ion-color-danger)">{{ error() }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    ion-spinner {
      width: 16px;
      height: 16px;
      margin-right: 6px;
    }
  `,
})
export class BotonUbicacionComponent {
  private readonly geolocalizacion = inject(GeolocalizacionService);

  readonly valor = model<Coordenadas>({});
  protected readonly buscando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly tieneUbicacion = computed(
    () => Number.isFinite(this.valor().lat) && Number.isFinite(this.valor().lng),
  );

  async pedirUbicacion(): Promise<void> {
    this.buscando.set(true);
    this.error.set(null);
    try {
      const posicion = await this.geolocalizacion.obtenerPosicion({ altaPrecision: true });
      this.valor.set({ lat: posicion.lat, lng: posicion.lng });
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.buscando.set(false);
    }
  }

  quitar(): void {
    this.valor.set({ lat: undefined, lng: undefined });
  }
}
