import { Component, input, output } from '@angular/core';
import { IonBadge, IonButton, IonCard, IonIcon } from '@ionic/angular';
import { AccionesDeDuenioComponent } from '../../compartido/acciones-de-duenio/acciones-de-duenio.component';
import { ChatRapidoComponent } from '../../compartido/chat/chat-rapido.component';
import { MascotaPerdida } from '../../core/modelos';
import { FechaPipe } from '../../core/pipes/fecha.pipe';

@Component({
  selector: 'app-tarjeta-mascota-perdida',
  imports: [IonCard, IonBadge, IonButton, IonIcon, FechaPipe, AccionesDeDuenioComponent, ChatRapidoComponent],
  template: `
    <ion-card class="tarjeta">
      <div class="foto">
        @if (mascota().photo_url) {
          <img [src]="mascota().photo_url" [alt]="mascota().pet_name" />
        } @else {
          <ion-icon name="paw" class="sin-foto"></ion-icon>
        }
        <ion-badge [color]="mascota().status === 'encontrada' ? 'success' : 'danger'" class="estado">
          {{ mascota().status === 'encontrada' ? 'Encontrada' : 'Perdida' }}
        </ion-badge>
        <div class="acciones">
          <app-acciones-de-duenio
            [registro]="$any(mascota())"
            [etiqueta]="'el reporte de ' + mascota().pet_name"
            [eliminar]="eliminar()"
            (editar)="editar.emit()"
          />
        </div>
      </div>

      <div class="cuerpo">
        <div>
          <h3>{{ mascota().pet_name }}</h3>
          <p class="texto-chico texto-secundario">
            {{ mascota().breed || mascota().species }}
            @if (mascota().age_years) {
              · {{ mascota().age_years }} años
            }
          </p>
        </div>
        @if (mascota().last_seen_address) {
          <p class="texto-chico texto-secundario direccion">
            <ion-icon name="location-outline"></ion-icon>
            <span>{{ mascota().last_seen_address }}</span>
          </p>
        }
        @if (mascota().description) {
          <p class="texto-chico recortar-2">{{ mascota().description }}</p>
        }
        <div class="botones">
          @if (mascota().contact_phone) {
            <ion-button fill="outline" size="small" [href]="'tel:' + mascota().contact_phone">
              <ion-icon slot="start" name="call-outline"></ion-icon>
              Llamar
            </ion-button>
          }
          <ion-button size="small" (click)="avistamiento.emit()">
            <ion-icon slot="start" name="eye-outline"></ion-icon>
            La vi
          </ion-button>
        </div>
        @if (mascota().created_at) {
          <p class="texto-mini texto-secundario texto-centrado">
            Reportada {{ mascota().created_at | fecha: "d 'de' MMM, yyyy" }}
          </p>
        }
      </div>

      <app-chat-rapido
        tipoDeContexto="lost_pet"
        [idDeContexto]="mascota().id"
        [tituloDeContexto]="mascota().pet_name"
      />
    </ion-card>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .tarjeta {
      height: 100%;
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(var(--ion-color-danger-rgb), 0.2);
      transition: box-shadow 0.3s;

      &:hover {
        box-shadow: 0 10px 25px -10px rgba(15, 23, 42, 0.3);
      }
    }

    .foto {
      position: relative;
      height: 192px;
      background: rgba(var(--ion-color-medium-rgb), 0.12);
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .sin-foto {
        font-size: 64px;
        color: rgba(var(--ion-color-medium-rgb), 0.4);
      }

      .estado {
        position: absolute;
        top: 12px;
        left: 12px;
      }

      .acciones {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(var(--ion-background-color-rgb), 0.85);
        border-radius: 999px;
        backdrop-filter: blur(4px);
      }
    }

    .cuerpo {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;

      h3 {
        font-size: 1.1rem;
      }
    }

    .direccion {
      display: flex;
      align-items: flex-start;
      gap: 6px;

      ion-icon {
        flex-shrink: 0;
        font-size: 16px;
        margin-top: 2px;
      }
    }

    .botones {
      display: flex;
      gap: 8px;
      padding-top: 4px;

      ion-button {
        flex: 1;
        margin: 0;
      }
    }
  `,
})
export class TarjetaMascotaPerdidaComponent {
  readonly mascota = input.required<MascotaPerdida>();
  readonly eliminar = input<() => Promise<unknown>>();
  readonly avistamiento = output<void>();
  readonly editar = output<void>();
}
