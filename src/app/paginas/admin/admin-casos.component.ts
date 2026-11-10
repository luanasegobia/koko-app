import { Component, computed, input, output, signal } from '@angular/core';
import {
  IonBadge,
  IonCard,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
} from '@ionic/angular';
import { CasoUrgente, Denuncia, MascotaPerdida } from '../../core/modelos';
import { FechaPipe } from '../../core/pipes/fecha.pipe';

export interface CambioDeEstado<T extends string> {
  id: string;
  status: T;
}

const ESTADO_CASO: Record<string, { etiqueta: string; color: string }> = {
  activo: { etiqueta: 'Activo', color: 'success' },
  en_curso: { etiqueta: 'En curso', color: 'tertiary' },
  resuelto: { etiqueta: 'Resuelto', color: 'medium' },
};

const ESTADO_DENUNCIA: Record<string, { etiqueta: string; color: string }> = {
  pendiente: { etiqueta: 'Pendiente', color: 'warning' },
  en_revision: { etiqueta: 'En revisión', color: 'tertiary' },
  derivada: { etiqueta: 'Derivada', color: 'purpura' },
  resuelta: { etiqueta: 'Resuelta', color: 'medium' },
};

/** Moderación: cambiar el estado de casos urgentes, mascotas perdidas y denuncias. */
@Component({
  selector: 'app-admin-casos',
  imports: [IonCard, IonBadge, IonIcon, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonSpinner, FechaPipe],
  templateUrl: './admin-casos.component.html',
  styleUrl: './admin-casos.component.scss',
})
export class AdminCasosComponent {
  readonly casosUrgentes = input.required<CasoUrgente[]>();
  readonly mascotasPerdidas = input.required<MascotaPerdida[]>();
  readonly denuncias = input.required<Denuncia[]>();
  readonly cargando = input(false);
  readonly actualizando = input(false);

  readonly cambiarCaso = output<CambioDeEstado<CasoUrgente['status']>>();
  readonly cambiarPerdida = output<CambioDeEstado<MascotaPerdida['status']>>();
  readonly cambiarDenuncia = output<CambioDeEstado<Denuncia['status']>>();

  protected readonly pestania = signal<'urgentes' | 'perdidas' | 'denuncias'>('urgentes');
  protected readonly estadoCaso = ESTADO_CASO;
  protected readonly estadoDenuncia = ESTADO_DENUNCIA;
  protected readonly denunciasPendientes = computed(
    () => this.denuncias().filter((d) => d.status === 'pendiente').length,
  );
}
