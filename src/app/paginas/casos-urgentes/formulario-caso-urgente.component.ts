import { Component, inject, input, output, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonIcon, IonInput, IonSpinner, IonTextarea } from '@ionic/angular';
import { SelectorFotoComponent } from '../../compartido/selector-foto/selector-foto.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { CasoUrgente, NecesidadCaso } from '../../core/modelos';
import { SupabaseService } from '../../core/servicios/supabase.service';

/** Alta y edición de un caso urgente. Las necesidades son un FormArray dinámico. */
@Component({
  selector: 'app-formulario-caso-urgente',
  imports: [ReactiveFormsModule, IonInput, IonTextarea, IonButton, IonIcon, IonSpinner, SelectorFotoComponent],
  templateUrl: './formulario-caso-urgente.component.html',
  styles: `
    .necesidad {
      display: flex;
      gap: 8px;
      align-items: center;

      ion-input {
        flex: 1;
      }

      ion-button {
        margin: 0;
      }
    }

    .agregar {
      align-self: flex-start;
      margin: 0;
    }

    ion-spinner {
      width: 18px;
      height: 18px;
      margin-right: 8px;
    }
  `,
})
export class FormularioCasoUrgenteComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly fb = inject(FormBuilder);

  readonly registroInicial = input<CasoUrgente | null>(null);
  readonly guardado = output<void>();

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected foto: File | null = null;

  protected readonly formulario = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    published_by: '',
    goal_amount: null as number | null,
    donation_alias: '',
    necesidades: this.fb.array<FormControl<string>>([this.fb.nonNullable.control('')]),
  });

  constructor() {
    const inicial = this.registroInicial;
    queueMicrotask(() => {
      const registro = inicial();
      if (!registro) return;
      this.formulario.patchValue({
        title: registro.title,
        description: registro.description,
        published_by: registro.published_by ?? '',
        goal_amount: registro.goal_amount ?? null,
        donation_alias: registro.donation_alias ?? '',
      });
      this.necesidades.clear();
      for (const necesidad of registro.needs?.length ? registro.needs : [{ label: '' }]) {
        this.necesidades.push(this.fb.nonNullable.control(necesidad.label ?? ''));
      }
    });
  }

  protected get necesidades(): FormArray<FormControl<string>> {
    return this.formulario.controls.necesidades;
  }

  protected get editando(): boolean {
    return this.registroInicial() !== null;
  }

  protected agregarNecesidad(): void {
    this.necesidades.push(this.fb.nonNullable.control(''));
  }

  protected quitarNecesidad(indice: number): void {
    this.necesidades.removeAt(indice);
  }

  protected alElegirFoto(archivos: File[]): void {
    this.foto = archivos[0] ?? null;
  }

  async guardar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    try {
      const registro = this.registroInicial();
      let photo_url = registro?.photo_url || '';
      if (this.foto) {
        const subida = await this.supabase.subirArchivo(this.foto);
        photo_url = subida.file_url;
      }

      // Al editar se conserva el estado de cada necesidad ya cargada.
      const estadoPrevio = new Map((registro?.needs || []).map((n) => [n.label, n.status]));
      const { necesidades, ...valores } = this.formulario.getRawValue();
      const needs: NecesidadCaso[] = necesidades
        .map((texto) => texto.trim())
        .filter(Boolean)
        .map((label) => ({ label, status: estadoPrevio.get(label) || 'pendiente' }));

      const campos: Partial<CasoUrgente> = {
        ...valores,
        goal_amount: valores.goal_amount || 0,
        photo_url,
        needs,
      };

      if (registro) {
        // raised_amount y contributors_count no se tocan: los lleva la cuenta de donaciones.
        await this.supabase.casosUrgentes.actualizar(registro.id, campos);
      } else {
        await this.supabase.casosUrgentes.crear({
          ...campos,
          status: 'activo',
          raised_amount: 0,
          contributors_count: 0,
        });
      }
      this.guardado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }
}
