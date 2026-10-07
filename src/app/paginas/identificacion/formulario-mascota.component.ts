import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
} from '@ionic/angular';
import { SelectorFotoComponent } from '../../compartido/selector-foto/selector-foto.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { Especie, Mascota, Sexo } from '../../core/modelos';
import { SupabaseService } from '../../core/servicios/supabase.service';

/** Alta y edición de la ficha de identificación de una mascota. */
@Component({
  selector: 'app-formulario-mascota',
  imports: [
    ReactiveFormsModule,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonSpinner,
    SelectorFotoComponent,
  ],
  templateUrl: './formulario-mascota.component.html',
})
export class FormularioMascotaComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly fb = inject(FormBuilder);

  readonly registroInicial = input<Mascota | null>(null);
  readonly guardado = output<void>();

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected foto: File | null = null;

  protected readonly formulario = this.fb.nonNullable.group({
    name: ['', Validators.required],
    species: 'perro' as Especie,
    breed: '',
    age_years: [null as number | null, Validators.min(0)],
    sex: 'macho' as Sexo,
    description: '',
    allergies: '',
    owner_name: '',
    owner_phone: '',
    owner_whatsapp: '',
  });

  ngOnInit(): void {
    // Angular asigna los inputs antes de ngOnInit (y antes del primer
    // renderizado): recién acá se puede leer registroInicial al editar.
    const registro = this.registroInicial();
    if (!registro) return;
    this.formulario.patchValue({
      name: registro.name,
      species: registro.species,
      breed: registro.breed ?? '',
      age_years: registro.age_years ?? null,
      sex: registro.sex ?? 'macho',
      description: registro.description ?? '',
      allergies: registro.allergies ?? '',
      owner_name: registro.owner_name ?? '',
      owner_phone: registro.owner_phone ?? '',
      owner_whatsapp: registro.owner_whatsapp ?? '',
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
      const campos: Partial<Mascota> = { ...valores, age_years: valores.age_years || undefined, photo_url };

      const registro = this.registroInicial();
      if (registro) {
        // El qr_id no se toca al editar: ya hay chapitas impresas con ese código.
        await this.supabase.mascotas.actualizar(registro.id, campos);
      } else {
        // crypto.randomUUID no existe fuera de contexto seguro (http://192.168.x.x).
        const qr_id =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID().split('-')[0]
            : Math.random().toString(36).slice(2, 10);
        await this.supabase.mascotas.crear({ ...campos, qr_id });
      }
      this.guardado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }
}
