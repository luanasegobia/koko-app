import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface DatosDeDonacion {
  idDeCaso: string;
  monto: number;
}

/**
 * Donaciones con tarjeta. El pago no se monta en la página: se redirige al
 * Checkout alojado por Stripe, que arma la Edge Function create-checkout-session.
 */
@Injectable({ providedIn: 'root' })
export class StripeService {
  private readonly supabase = inject(SupabaseService);

  // Solo viajan el caso y el monto. El título, el alias y las URLs de retorno
  // los resuelve la función del lado del servidor: si los mandara el navegador,
  // cualquiera podría crear un pago con otro texto y otro destino.
  async crearSesionDeDonacion({ idDeCaso, monto }: DatosDeDonacion) {
    return this.supabase.invocarFuncion<{ sessionId: string; url: string }>(
      'create-checkout-session',
      { caseId: idDeCaso, amount: monto },
    );
  }

  async redirigirADonar(datos: DatosDeDonacion): Promise<void> {
    const sesion = await this.crearSesionDeDonacion(datos);
    if (!sesion?.url) throw new Error('No se pudo iniciar el pago');
    window.location.href = sesion.url;
  }
}
