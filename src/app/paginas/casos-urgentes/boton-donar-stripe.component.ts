import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { hayStripeConfigurado } from '../../../environments/entorno';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { StripeService } from '../../core/servicios/stripe.service';
import { formatearMonto } from '../../core/utilidades';

const MONTO_MINIMO = 100;

/**
 * Donación con tarjeta vía Stripe. Sin la clave publicable configurada el
 * botón queda deshabilitado: la donación por alias bancario sigue intacta.
 */
@Component({
  selector: 'app-boton-donar-stripe',
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonButtons,
    IonIcon,
    IonInput,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSpinner,
  ],
  template: `
    @if (!habilitado) {
      <ion-button fill="outline" color="medium" expand="block" [disabled]="true" title="Todavía no está habilitado el pago con tarjeta">
        <ion-icon slot="start" name="heart-outline"></ion-icon>
        Donar con tarjeta (próximamente)
      </ion-button>
    } @else {
      <ion-button expand="block" (click)="abierto.set(true)">
        <ion-icon slot="start" name="heart"></ion-icon>
        Donar con tarjeta
      </ion-button>

      <ion-modal [isOpen]="abierto()" (didDismiss)="abierto.set(false)" class="modal-chico">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Donar a {{ titulo() }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="abierto.set(false)" aria-label="Cerrar">
                  <ion-icon slot="icon-only" name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <p class="texto-chico texto-secundario descripcion">
              Elegí el monto que querés donar. El pago se procesa de forma segura con Stripe.
            </p>
            <form class="formulario" [formGroup]="formulario" (ngSubmit)="donar()">
              <ion-input
                label="Monto ($)"
                labelPlacement="stacked"
                fill="outline"
                type="number"
                inputmode="numeric"
                [min]="100"
                [step]="100"
                formControlName="monto"
                placeholder="Ej: 5000"
                errorText="El monto mínimo es $100"
              ></ion-input>
              @if (error()) {
                <p class="error-formulario">{{ error() }}</p>
              }
              <ion-button type="submit" expand="block" [disabled]="cargando()">
                @if (cargando()) {
                  <ion-spinner slot="start" name="crescent"></ion-spinner>
                } @else {
                  <ion-icon slot="start" name="heart"></ion-icon>
                }
                Donar {{ montoFormateado() }}
              </ion-button>
            </form>
          </ion-content>
        </ng-template>
      </ion-modal>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    ion-button {
      margin: 0;
    }

    .descripcion {
      margin-bottom: 16px;
    }

    ion-spinner {
      width: 18px;
      height: 18px;
      margin-right: 8px;
    }
  `,
})
export class BotonDonarStripeComponent {
  private readonly stripe = inject(StripeService);
  private readonly fb = inject(FormBuilder);

  readonly idDeCaso = input.required<string>();
  readonly titulo = input.required<string>();
  readonly aliasDeDonacion = input<string>();

  protected readonly habilitado = hayStripeConfigurado();
  protected readonly abierto = signal(false);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');

  protected readonly formulario = this.fb.nonNullable.group({
    monto: [null as number | null, [Validators.required, Validators.min(MONTO_MINIMO)]],
  });

  protected montoFormateado(): string {
    const monto = this.formulario.controls.monto.value;
    return monto ? `$${formatearMonto(monto)}` : '—';
  }

  async donar(): Promise<void> {
    const monto = Number(this.formulario.controls.monto.value);
    if (!monto || monto < MONTO_MINIMO) {
      this.formulario.markAllAsTouched();
      this.error.set(`El monto mínimo es $${MONTO_MINIMO}`);
      return;
    }
    this.cargando.set(true);
    this.error.set('');
    try {
      await this.stripe.redirigirADonar({
        idDeCaso: this.idDeCaso(),
        titulo: this.titulo(),
        monto,
        aliasDeDonacion: this.aliasDeDonacion(),
      });
    } catch (error) {
      this.error.set(mensajeDeError(error));
      this.cargando.set(false);
    }
  }
}
