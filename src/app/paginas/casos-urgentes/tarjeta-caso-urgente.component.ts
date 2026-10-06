import { Component, computed, input, output, signal } from '@angular/core';
import { IonBadge, IonButton, IonCard, IonChip, IonIcon, IonProgressBar } from '@ionic/angular';
import { AccionesDeDuenioComponent } from '../../compartido/acciones-de-duenio/acciones-de-duenio.component';
import { ChatRapidoComponent } from '../../compartido/chat/chat-rapido.component';
import { CasoUrgente, EstadoNecesidad } from '../../core/modelos';
import { copiarAlPortapapeles, formatearMonto } from '../../core/utilidades';
import { BotonDonarStripeComponent } from './boton-donar-stripe.component';

const ESTADO: Record<string, { etiqueta: string; color: string }> = {
  activo: { etiqueta: 'Urgente', color: 'danger' },
  en_curso: { etiqueta: 'En curso', color: 'secondary' },
  resuelto: { etiqueta: 'Resuelto', color: 'primary' },
};

const ICONO_NECESIDAD: Record<EstadoNecesidad, string> = { cubierto: '✓', parcial: '◑', pendiente: '✕' };

@Component({
  selector: 'app-tarjeta-caso-urgente',
  imports: [
    IonCard,
    IonBadge,
    IonButton,
    IonIcon,
    IonChip,
    IonProgressBar,
    AccionesDeDuenioComponent,
    ChatRapidoComponent,
    BotonDonarStripeComponent,
  ],
  templateUrl: './tarjeta-caso-urgente.component.html',
  styleUrl: './tarjeta-caso-urgente.component.scss',
})
export class TarjetaCasoUrgenteComponent {
  readonly caso = input.required<CasoUrgente>();
  readonly eliminar = input<() => Promise<unknown>>();
  readonly editar = output<void>();

  protected readonly copiado = signal(false);
  protected readonly iconoNecesidad = ICONO_NECESIDAD;

  protected readonly estado = computed(() => ESTADO[this.caso().status] ?? ESTADO['activo']);

  protected readonly progreso = computed(() => {
    const { goal_amount = 0, raised_amount = 0 } = this.caso();
    return goal_amount > 0 ? Math.min(raised_amount / goal_amount, 1) : 0;
  });

  protected monto(valor: number | null | undefined): string {
    return formatearMonto(valor);
  }

  protected async copiarAlias(): Promise<void> {
    const alias = this.caso().donation_alias;
    if (!alias) return;
    if (await copiarAlPortapapeles(alias)) {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    }
  }
}
