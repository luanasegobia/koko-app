import { AfterViewInit, Component, inject, input, output, signal, viewChild } from '@angular/core';
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
import { BotonUbicacionComponent } from '../../compartido/boton-ubicacion/boton-ubicacion.component';
import { SelectorFotoComponent } from '../../compartido/selector-foto/selector-foto.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { Coordenadas, Especie, MascotaPerdida } from '../../core/modelos';
import { SupabaseService } from '../../core/servicios/supabase.service';

/** Alta y edición de un reporte de mascota perdida. `registroInicial` llega al editar. */
@Component({
  selector: 'app-formulario-mascota-perdida',
  imports: [
    ReactiveFormsModule,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonSpinner,
    BotonUbicacionComponent,
    SelectorFotoComponent,
  ],
  templateUrl: './formulario-mascota-perdida.component.html',
})
export class FormularioMascotaPerdidaComponent implements AfterViewInit {
  private readonly supabase = inject(SupabaseService);
  private readonly fb = inject(FormBuilder);

  readonly registroInicial = input<MascotaPerdida | null>(null);
  readonly abrirCamaraAlMontar = input(false);
  readonly guardado = output<void>();

  private readonly selectorFoto = viewChild(SelectorFotoComponent);

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly ubicacion = signal<Coordenadas>({});
  protected foto: File | null = null;

  protected readonly formulario = this.fb.nonNullable.group({
    pet_name: ['', Validators.required],
    species: 'perro' as Especie,
    breed: '',
    age_years: null as number | null,
    description: '',
    last_seen_address: '',
    contact_phone: '',
    contact_whatsapp: '',
  });

  constructor() {
    // Al editar, el formulario arranca con los datos del reporte.
    const inicial = this.registroInicial;
    queueMicrotask(() => {
      const registro = inicial();
      if (!registro) return;
      this.formulario.patchValue({
        pet_name: registro.pet_name,
        species: registro.species,
        breed: registro.breed ?? '',
        age_years: registro.age_years ?? null,
        description: registro.description ?? '',
        last_seen_address: registro.last_seen_address ?? '',
        contact_phone: registro.contact_phone ?? '',
        contact_whatsapp: registro.contact_whatsapp ?? '',
      });
      this.ubicacion.set({
        lat: registro.last_seen_lat ?? undefined,
        lng: registro.last_seen_lng ?? undefined,
      });
    });
  }

  ngAfterViewInit(): void {
    if (this.abrirCamaraAlMontar()) {
      setTimeout(() => this.selectorFoto()?.abrir(), 300);
    }
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
      // Al editar sin cambiar la imagen, se conserva la que ya estaba.
      let photo_url = this.registroInicial()?.photo_url || '';
      if (this.foto) {
        const subida = await this.supabase.subirArchivo(this.foto);
        photo_url = subida.file_url;
      }

      const valores = this.formulario.getRawValue();
      const campos: Partial<MascotaPerdida> = {
        ...valores,
        age_years: valores.age_years || undefined,
        last_seen_lat: this.ubicacion().lat,
        last_seen_lng: this.ubicacion().lng,
        photo_url,
      };

      const registro = this.registroInicial();
      if (registro) {
        await this.supabase.mascotasPerdidas.actualizar(registro.id, campos);
      } else {
        await this.supabase.mascotasPerdidas.crear({ ...campos, status: 'perdida' });
      }
      this.guardado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      // En el finally y no en el camino feliz: si algo falla, el botón no queda girando.
      this.guardando.set(false);
    }
  }
}
