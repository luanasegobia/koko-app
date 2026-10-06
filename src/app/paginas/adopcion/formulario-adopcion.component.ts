import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonToggle,
} from '@ionic/angular';
import { SelectorFotoComponent } from '../../compartido/selector-foto/selector-foto.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { Especie, MascotaAdopcion, Sexo, Tamanio } from '../../core/modelos';
import { SupabaseService } from '../../core/servicios/supabase.service';

@Component({
  selector: 'app-formulario-adopcion',
  imports: [
    ReactiveFormsModule,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSpinner,
    SelectorFotoComponent,
  ],
  templateUrl: './formulario-adopcion.component.html',
})
export class FormularioAdopcionComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly fb = inject(FormBuilder);

  readonly registroInicial = input<MascotaAdopcion | null>(null);
  readonly guardado = output<void>();

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected foto: File | null = null;

  protected readonly formulario = this.fb.nonNullable.group({
    name: ['', Validators.required],
    species: 'perro' as Especie,
    breed: '',
    age_years: null as number | null,
    sex: 'macho' as Sexo,
    size: 'mediano' as Tamanio,
    description: '',
    vaccinated: false,
    sterilized: false,
    contact_name: '',
    contact_phone: '',
    location: '',
  });

  constructor() {
    const inicial = this.registroInicial;
    queueMicrotask(() => {
      const registro = inicial();
      if (!registro) return;
      this.formulario.patchValue({
        name: registro.name,
        species: registro.species,
        breed: registro.breed ?? '',
        age_years: registro.age_years ?? null,
        sex: registro.sex ?? 'macho',
        size: registro.size ?? 'mediano',
        description: registro.description ?? '',
        vaccinated: registro.vaccinated ?? false,
        sterilized: registro.sterilized ?? false,
        contact_name: registro.contact_name ?? '',
        contact_phone: registro.contact_phone ?? '',
        location: registro.location ?? '',
      });
    });
  }

  protected get editando(): boolean {
    return this.registroInicial() !== null;
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
      let photo_url = this.registroInicial()?.photo_url || '';
      if (this.foto) {
        const subida = await this.supabase.subirArchivo(this.foto);
        photo_url = subida.file_url;
      }
      const valores = this.formulario.getRawValue();
      const campos: Partial<MascotaAdopcion> = {
        ...valores,
        age_years: valores.age_years || undefined,
        photo_url,
      };

      const registro = this.registroInicial();
      if (registro) {
        await this.supabase.mascotasEnAdopcion.actualizar(registro.id, campos);
      } else {
        await this.supabase.mascotasEnAdopcion.crear({ ...campos, status: 'disponible' });
      }
      this.guardado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }
}
