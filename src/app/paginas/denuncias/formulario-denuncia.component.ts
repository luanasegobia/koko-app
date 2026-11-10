import { Component, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTextarea,
} from '@ionic/angular';
import { BotonUbicacionComponent } from '../../compartido/boton-ubicacion/boton-ubicacion.component';
import { SelectorFotoComponent } from '../../compartido/selector-foto/selector-foto.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { Coordenadas, TipoDenuncia } from '../../core/modelos';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { copiarAlPortapapeles } from '../../core/utilidades';

/**
 * Alta de una denuncia. El código de seguimiento lo genera la base de datos y
 * es único: con él se puede consultar el estado sin tener cuenta.
 */
@Component({
  selector: 'app-formulario-denuncia',
  imports: [
    ReactiveFormsModule,
    IonInput,
    IonTextarea,
    IonSegment,
    IonSegmentButton,
    IonButton,
    IonIcon,
    IonSpinner,
    BotonUbicacionComponent,
    SelectorFotoComponent,
  ],
  templateUrl: './formulario-denuncia.component.html',
  styles: `
    .exito {
      padding: 24px 0;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;

      > ion-icon {
        font-size: 48px;
      }
    }

    .codigo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--ion-color-primary);
    }

    ion-segment {
      width: 100%;
    }

    ion-spinner {
      width: 18px;
      height: 18px;
      margin-right: 8px;
    }
  `,
})
export class FormularioDenunciaComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly avisos = inject(AvisosService);
  private readonly fb = inject(FormBuilder);

  readonly enviado = output<void>();

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly codigoDeSeguimiento = signal<string | null>(null);
  protected readonly copiado = signal(false);
  protected readonly ubicacion = signal<Coordenadas>({});
  protected archivos: File[] = [];

  protected readonly formulario = this.fb.nonNullable.group({
    type: 'urgente' as TipoDenuncia,
    description: ['', Validators.required],
    address: '',
    reporter_name: '',
    reporter_phone: '',
  });

  protected readonly tipo = toSignal(this.formulario.controls.type.valueChanges, {
    initialValue: this.formulario.controls.type.value,
  });

  protected alElegirArchivos(archivos: File[]): void {
    this.archivos = archivos;
  }

  async enviar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    try {
      const evidence_urls: string[] = [];
      for (const archivo of this.archivos) {
        const subida = await this.supabase.subirArchivo(archivo, {
          tiposPermitidos: ['image/', 'video/'],
          tamanioMaximoMb: 25,
        });
        evidence_urls.push(subida.file_url);
      }

      const valores = this.formulario.getRawValue();
      const anonima = valores.type === 'anonima';
      const denuncia = await this.supabase.denuncias.crear({
        ...valores,
        evidence_urls,
        lat: this.ubicacion().lat,
        lng: this.ubicacion().lng,
        status: 'pendiente',
        reporter_name: anonima ? undefined : valores.reporter_name,
        reporter_phone: anonima ? undefined : valores.reporter_phone,
      });
      this.codigoDeSeguimiento.set(denuncia.tracking_code ?? null);
    } catch (error) {
      const mensaje = mensajeDeError(error);
      this.error.set(mensaje);
      await this.avisos.error(mensaje, 'No se pudo enviar la denuncia');
    } finally {
      this.guardando.set(false);
    }
  }

  async copiarCodigo(): Promise<void> {
    const codigo = this.codigoDeSeguimiento();
    if (!codigo) return;
    if (await copiarAlPortapapeles(codigo)) {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    }
  }
}
