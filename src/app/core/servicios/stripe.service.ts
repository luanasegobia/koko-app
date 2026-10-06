import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface DatosDeDonacion {
  idDeCaso: string;
  titulo: string;
  monto: number;
  aliasDeDonacion?: string;
}

/**
 * Donaciones con tarjeta. El pago no se monta en la página: se redirige al
 * Checkout alojado por Stripe, que arma la Edge Function create-checkout-session.
 */
@Injectable({ providedIn: 'root' })
export class StripeService {
  private readonly supabase = inject(SupabaseService);

  async crearSesionDeDonacion({ idDeCaso, titulo, monto, aliasDeDonacion }: DatosDeDonacion) {
    const base = window.location.origin;
    return this.supabase.invocarFuncion<{ sessionId: string; url: string }>(
      'create-checkout-session',
      {
        caseId: idDeCaso,
        title: titulo,
        amount: monto,
        donationAlias: aliasDeDonacion,
        successUrl: `${base}/donar/exito?case_id=${idDeCaso}&status=exito`,
        cancelUrl: `${base}/donar/exito?case_id=${idDeCaso}&status=cancelado`,
      },
    );
  }

  async redirigirADonar(datos: DatosDeDonacion): Promise<void> {
    const sesion = await this.crearSesionDeDonacion(datos);
    window.location.href = sesion.url;
  }
}
