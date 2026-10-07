import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonIcon, IonInput, IonItem, IonLabel, IonSpinner, IonTextarea, IonToggle } from '@ionic/angular';
import { BotonUbicacionComponent } from '../../compartido/boton-ubicacion/boton-ubicacion.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { Coordenadas, Veterinaria } from '../../core/modelos';
import { SupabaseService } from '../../core/servicios/supabase.service';

/**
 * Edición de la propia ficha de veterinaria. El alta ocurre en el onboarding
 * de tipo de cuenta "veterinario"; acá se corrigen horario, teléfono o servicios.
 */
@Component({
  selector: 'app-formulario-veterinaria',
  imports: [
    ReactiveFormsModule,
    IonInput,
    IonTextarea,
    IonToggle,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSpinner,
    BotonUbicacionComponent,
  ],
  template: `
    <form class="formulario" [formGroup]="formulario" (ngSubmit)="guardar()">
      <ion-input
        label="Nombre de la veterinaria"
        labelPlacement="stacked"
        fill="outline"
        formControlName="name"
        placeholder="Ej: Veterinaria San Roque"
        errorText="El nombre es obligatorio"
      ></ion-input>

      <div class="pila-chica">
        <ion-input
          label="Dirección"
          labelPlacement="stacked"
          fill="outline"
          formControlName="address"
          placeholder="Ej: Av. San Martín 450, Orán"
          errorText="La dirección es obligatoria"
        ></ion-input>
        <app-boton-ubicacion [(valor)]="ubicacion" />
      </div>

      <ion-input
        label="Teléfono"
        labelPlacement="stacked"
        fill="outline"
        type="tel"
        formControlName="phone"
        placeholder="3878-..."
        errorText="El teléfono es obligatorio"
      ></ion-input>

      <ion-input
        label="Servicios"
        labelPlacement="stacked"
        fill="outline"
        formControlName="services"
        placeholder="Ej: Cirugía, vacunación, análisis"
      ></ion-input>

      <ion-textarea
        label="Descripción"
        labelPlacement="stacked"
        fill="outline"
        formControlName="bio"
        placeholder="Contá brevemente qué ofrecen"
        [rows]="3"
        [autoGrow]="true"
      ></ion-textarea>

      <ion-item lines="none" class="urgencias">
        <ion-label>
          <h3>Atiende urgencias</h3>
          <p>Se muestra destacada para casos urgentes.</p>
        </ion-label>
        <ion-toggle slot="end" formControlName="is_emergency" aria-label="Atiende urgencias"></ion-toggle>
      </ion-item>

      @if (error()) {
        <p class="error-formulario">{{ error() }}</p>
      }

      <ion-button type="submit" expand="block" [disabled]="guardando()">
        @if (guardando()) {
          <ion-spinner slot="start" name="crescent"></ion-spinner>
        } @else {
          <ion-icon slot="start" name="save-outline"></ion-icon>
        }
        Guardar cambios
      </ion-button>
    </form>
  `,
  styles: `
    .pila-chica {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .urgencias {
      --background: transparent;
      --padding-start: 12px;
      border: 1px solid var(--ion-border-color);
      border-radius: 12px;
    }

    ion-spinner {
      width: 18px;
      height: 18px;
      margin-right: 8px;
    }
  `,
})
export class FormularioVeterinariaComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly fb = inject(FormBuilder);

  readonly registroInicial = input.required<Veterinaria>();
  readonly guardado = output<void>();

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly ubicacion = signal<Coordenadas>({});

  protected readonly formulario = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    phone: ['', Validators.required],
    is_emergency: false,
    services: '',
    bio: '',
  });

  ngOnInit(): void {
    // Angular asigna los inputs antes de ngOnInit (y antes del primer
    // renderizado): recién acá se puede leer registroInicial al editar.
    const registro = this.registroInicial();
    this.formulario.patchValue({
      name: registro.name,
      address: registro.address,
      phone: registro.phone,
      is_emergency: registro.is_emergency ?? false,
      services: registro.services ?? '',
      bio: registro.bio ?? '',
    });
    this.ubicacion.set({ lat: registro.lat ?? undefined, lng: registro.lng ?? undefined });
  }

  async guardar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    try {
      // is_verified queda deliberadamente afuera: lo decide administración.
      await this.supabase.veterinarias.actualizar(this.registroInicial().id, {
        ...this.formulario.getRawValue(),
        lat: this.ubicacion().lat,
        lng: this.ubicacion().lng,
      });
      this.guardado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }
}
