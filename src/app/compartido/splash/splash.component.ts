import { Component, OnDestroy, OnInit, output, signal } from '@angular/core';
import { PatitaComponent, TipoDePatita } from '../patita/patita.component';

interface PatitaDelDesfile {
  tipo: TipoDePatita;
  pelaje: string;
  detalle?: string;
  garras?: boolean;
}

// Las siete patitas que entran desde la derecha, de arriba hacia abajo.
const PATITAS: PatitaDelDesfile[] = [
  { tipo: 'almohadillas', pelaje: '#E38B3D', detalle: '#FFF6E9', garras: true },
  { tipo: 'peluda', pelaje: '#7C88AC' },
  { tipo: 'almohadillas', pelaje: '#DEDCE1', detalle: '#FFFFFF' },
  { tipo: 'almohadillas', pelaje: '#2B2B30', detalle: '#FFFFFF' },
  { tipo: 'manchada', pelaje: '#FBEFE9', detalle: '#8B6F72' },
  { tipo: 'dalmata', pelaje: '#FFFFFF', detalle: '#1E1E1E' },
  { tipo: 'almohadillas', pelaje: '#D9BB93', detalle: '#FFF6E9', garras: true },
];

/** Pantalla de bienvenida animada que se muestra al abrir el login. */
@Component({
  selector: 'app-splash',
  imports: [PatitaComponent],
  template: `
    <div class="splash" [class.saliendo]="saliendo()">
      <div class="patitas">
        @for (patita of patitas; track $index) {
          <app-patita
            class="patita"
            [tipo]="patita.tipo"
            [pelaje]="patita.pelaje"
            [detalle]="patita.detalle ?? '#FFF6E9'"
            [garras]="patita.garras ?? false"
          />
        }
      </div>

      <div class="marca">
        <h1>KOKO</h1>
        <p class="lema">Comunidad Mascotera</p>
        <div class="barra"></div>
      </div>

      <p class="pie">Hecho con cariño para las patitas</p>
    </div>
  `,
  styleUrl: './splash.component.scss',
})
export class SplashComponent implements OnInit, OnDestroy {
  readonly terminado = output<void>();
  protected readonly patitas = PATITAS;
  protected readonly saliendo = signal(false);
  private temporizadores: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    // Con "reducir movimiento" activado todo aparece ya en su lugar y dura menos.
    const sinMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const espera = sinMovimiento ? 1200 : 2800;
    this.temporizadores.push(setTimeout(() => this.saliendo.set(true), espera));
    this.temporizadores.push(setTimeout(() => this.terminado.emit(), espera + 500));
  }

  ngOnDestroy(): void {
    this.temporizadores.forEach(clearTimeout);
  }
}
