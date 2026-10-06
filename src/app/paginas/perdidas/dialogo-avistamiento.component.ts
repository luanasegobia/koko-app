import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonIcon, IonInput, IonSpinner, IonTextarea } from '@ionic/angular';
import { BotonUbicacionComponent } from '../../compartido/boton-ubicacion/boton-ubicacion.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { Coordenadas, MascotaPerdida } from '../../core/modelos';
import { SupabaseService } from '../../core/servicios/supabase.service';

/**
 * Registro de un avistamiento ("La vi"). Va por la función agregar_avistamiento
 * de la base: la tabla solo deja actualizar a quien publicó, y acá justamente
 * escribe cualquier persona.
 */
@Component({
  selector: 'app-dialogo-avistamiento',
  imports: [ReactiveFormsModule, IonInput, IonTextarea, IonButton, IonIcon, IonSpinner, BotonUbicacionComponent],
  template: `
    @if (listo()) {
      <div class="exito">
        <ion-icon name="checkmark-circle" color="primary"></ion-icon>
        <p><strong>¡Gracias por tu avistamiento!</strong></p>
      </div>
    } @else {
      <form class="formulario" [formGroup]="formulario" (ngSubmit)="enviar()">
        <div class="pila-chica">
          <ion-input
            label="¿Dónde la viste?"
            labelPlacement="stacked"
            fill="outline"
            formControlName="direccion"
            placeholder="Calle y barrio..."
            errorText="Contanos dónde la viste"
          ></ion-input>
          <app-boton-ubicacion [(valor)]="ubicacion" />
        </div>
        <ion-textarea
          label="Nota adicional (opcional)"
          labelPlacement="stacked"
          fill="outline"
          formControlName="nota"
          placeholder="Ej: Estaba cerca de la plaza..."
          [rows]="2"
          [autoGrow]="true"
        ></ion-textarea>
        @if (error()) {
          <p class="error-formulario">{{ error() }}</p>
        }
        <ion-button type="submit" expand="block" [disabled]="guardando()">
          @if (guardando()) {
            <ion-spinner slot="start" name="crescent"></ion-spinner>
          } @else {
            <ion-icon slot="start" name="location-outline"></ion-icon>
          }
          Enviar avistamiento
        </ion-button>
      </form>
    }
  `,
  styles: `
    .exito {
      padding: 32px 0;
      text-align: center;

      ion-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }
    }

    .pila-chica {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    ion-spinner {
      width: 18px;
      height: 18px;
      margin-right: 8px;
    }
  `,
})
export class DialogoAvistamientoComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly fb = inject(FormBuilder);

  readonly mascota = input.required<MascotaPerdida>();
  readonly guardado = output<void>();
  readonly cerrar = output<void>();

  protected readonly guardando = signal(false);
  protected readonly listo = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly ubicacion = signal<Coordenadas>({});

  protected readonly formulario = this.fb.nonNullable.group({
    direccion: ['', Validators.required],
    nota: '',
  });

  async enviar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    try {
      const { direccion, nota } = this.formulario.getRawValue();
      await this.supabase.rpc('agregar_avistamiento', {
        id_mascota: this.mascota().id,
        direccion,
        nota: nota || null,
        // Sin coordenadas el avistamiento igual se guarda; lo que no puede es aparecer en el mapa.
        lat: this.ubicacion().lat ?? null,
        lng: this.ubicacion().lng ?? null,
      });
      this.listo.set(true);
      this.guardado.emit();
      setTimeout(() => this.cerrar.emit(), 1500);
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }
}
