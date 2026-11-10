import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonCheckbox,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonTextarea,
  IonToggle,
} from '@ionic/angular';
import { BotonUbicacionComponent } from '../../compartido/boton-ubicacion/boton-ubicacion.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { Coordenadas, HorarioVeterinaria, Veterinaria } from '../../core/modelos';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { DIAS } from './estado-veterinaria';

interface HorarioEditable extends HorarioVeterinaria {
  activo: boolean;
}

// De lunes a domingo, que es como se lee una semana de atención.
const DIAS_DE_ATENCION = [...DIAS.slice(1), DIAS[0]];

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
    IonCheckbox,
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

      <fieldset class="horarios">
        <legend>Horario de atención</legend>
        <p class="texto-mini texto-secundario">
          Marcá los días que atienden. Con esto se calcula si la veterinaria aparece de turno.
        </p>
        @for (horario of horarios(); track horario.day) {
          <div class="dia">
            <ion-checkbox
              labelPlacement="end"
              justify="start"
              [checked]="horario.activo"
              (ionChange)="cambiarHorario(horario.day, { activo: $event.detail.checked })"
            >
              {{ horario.day }}
            </ion-checkbox>
            @if (horario.activo) {
              <div class="horas">
                <input
                  type="time"
                  [value]="horario.open"
                  [attr.aria-label]="'Hora de apertura del ' + horario.day"
                  (change)="cambiarHorario(horario.day, { open: valorDe($event) })"
                />
                <span>a</span>
                <input
                  type="time"
                  [value]="horario.close"
                  [attr.aria-label]="'Hora de cierre del ' + horario.day"
                  (change)="cambiarHorario(horario.day, { close: valorDe($event) })"
                />
              </div>
            } @else {
              <span class="texto-chico texto-secundario">Cerrado</span>
            }
          </div>
        }
      </fieldset>

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

    .horarios {
      margin: 0;
      padding: 12px;
      border: 1px solid var(--ion-border-color);
      border-radius: 12px;

      legend {
        padding: 0 6px;
        font-size: 0.85rem;
        font-weight: 600;
      }

      > p {
        margin-bottom: 8px;
      }
    }

    .dia {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 44px;

      ion-checkbox {
        text-transform: capitalize;
      }
    }

    .horas {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;

      input {
        padding: 6px 8px;
        border: 1px solid var(--ion-border-color);
        border-radius: 8px;
        background: var(--ion-item-background);
        color: var(--ion-text-color);
        font: inherit;
      }
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
  protected readonly horarios = signal<HorarioEditable[]>([]);

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

    // schedule es JSONB sin validar: solo se usa si de verdad es una lista.
    const cargados = Array.isArray(registro.schedule) ? registro.schedule : [];
    this.horarios.set(
      DIAS_DE_ATENCION.map((day) => {
        const cargado = cargados.find((h) => h.day === day);
        return {
          day,
          activo: Boolean(cargado),
          open: cargado?.open || '09:00',
          close: cargado?.close || '18:00',
        };
      }),
    );
  }

  protected valorDe(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }

  protected cambiarHorario(dia: string, cambios: Partial<HorarioEditable>): void {
    this.horarios.update((lista) => lista.map((h) => (h.day === dia ? { ...h, ...cambios } : h)));
  }

  async guardar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const atencion = this.horarios().filter((h) => h.activo);
    // El cálculo de "de turno" compara horas del mismo día, así que un horario
    // que cruza la medianoche no se puede representar.
    const invalido = atencion.find((h) => !h.open || !h.close || h.open >= h.close);
    if (invalido) {
      this.error.set(`Revisá el horario del ${invalido.day}: tiene que cerrar después de abrir.`);
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    try {
      // is_verified queda deliberadamente afuera: lo decide administración.
      await this.supabase.veterinarias.actualizar(this.registroInicial().id, {
        ...this.formulario.getRawValue(),
        // null y no undefined: al serializar, undefined desaparece y "Quitar"
        // dejaba las coordenadas viejas en la base.
        lat: this.ubicacion().lat ?? null,
        lng: this.ubicacion().lng ?? null,
        schedule: atencion.map(({ day, open, close }) => ({ day, open, close })),
      });
      this.guardado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }
}
