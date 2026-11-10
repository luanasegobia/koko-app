import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonBadge, IonButton, IonCard, IonIcon, IonInput, IonSpinner } from '@ionic/angular';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { Denuncia } from '../../core/modelos';
import { FechaPipe } from '../../core/pipes/fecha.pipe';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { COLOR_ESTADO_DENUNCIA, ETIQUETA_ESTADO_DENUNCIA } from './denuncias.constantes';

/** Consulta del estado de una denuncia por su código de seguimiento. */
@Component({
  selector: 'app-buscador-seguimiento',
  imports: [ReactiveFormsModule, IonInput, IonButton, IonIcon, IonCard, IonBadge, IonSpinner, FechaPipe],
  template: `
    <div class="pila">
      <form class="buscador" [formGroup]="formulario" (ngSubmit)="buscar()">
        <ion-input
          formControlName="codigo"
          placeholder="Código de seguimiento"
          fill="outline"
          class="monoespaciado"
          aria-label="Código de seguimiento"
          autocapitalize="characters"
        ></ion-input>
        <ion-button type="submit" [disabled]="buscando() || formulario.invalid" aria-label="Buscar">
          @if (buscando()) {
            <ion-spinner name="crescent"></ion-spinner>
          } @else {
            <ion-icon slot="icon-only" name="search"></ion-icon>
          }
        </ion-button>
      </form>

      @if (noEncontrada()) {
        <p class="texto-chico texto-secundario texto-centrado">No se encontró ninguna denuncia con ese código.</p>
      }

      @if (resultado(); as denuncia) {
        <ion-card class="ion-padding resultado">
          <div class="fila">
            <ion-badge [color]="colorEstado[denuncia.status]">{{ etiquetaEstado[denuncia.status] }}</ion-badge>
            <span class="texto-mini texto-secundario monoespaciado">#{{ denuncia.tracking_code }}</span>
          </div>
          <p class="texto-chico">{{ denuncia.description }}</p>
          <div class="fila texto-mini texto-secundario">
            @if (denuncia.address) {
              <span><ion-icon name="location-outline"></ion-icon> {{ denuncia.address }}</span>
            }
            @if (denuncia.created_at) {
              <span><ion-icon name="time-outline"></ion-icon> {{ denuncia.created_at | fecha }}</span>
            }
          </div>
        </ion-card>
      }
    </div>
  `,
  styles: `
    .buscador {
      display: flex;
      gap: 8px;
      align-items: center;

      ion-input {
        flex: 1;
        text-transform: uppercase;
      }

      ion-button {
        margin: 0;
      }
    }

    .resultado {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    ion-spinner {
      width: 18px;
      height: 18px;
    }
  `,
})
export class BuscadorSeguimientoComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly avisos = inject(AvisosService);
  private readonly fb = inject(FormBuilder);

  protected readonly etiquetaEstado = ETIQUETA_ESTADO_DENUNCIA;
  protected readonly colorEstado = COLOR_ESTADO_DENUNCIA;
  protected readonly buscando = signal(false);
  protected readonly resultado = signal<Denuncia | null>(null);
  protected readonly noEncontrada = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
  });

  async buscar(): Promise<void> {
    if (this.formulario.invalid) return;
    this.buscando.set(true);
    this.noEncontrada.set(false);
    this.resultado.set(null);
    try {
      const codigo = this.formulario.controls.codigo.value.trim().toUpperCase();
      const denuncias = await this.supabase.denuncias.filtrar({ tracking_code: codigo });
      if (denuncias.length > 0) this.resultado.set(denuncias[0]);
      else this.noEncontrada.set(true);
    } catch (error) {
      await this.avisos.error(mensajeDeError(error));
    } finally {
      this.buscando.set(false);
    }
  }
}
