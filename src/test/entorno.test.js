import { describe, it, expect, afterEach, vi } from 'vitest';
import { leerConfiguracion, hayStripeConfigurado } from '@/api/entorno';
import { ErrorDeConfiguracion } from '@/api/errores';

/** Arma un JWT con el payload pedido. La firma no importa: nunca se valida acá. */
const jwtCon = (payload) =>
  `cabecera.${btoa(JSON.stringify(payload)).replace(/=/g, '')}.firma`;

const URL_VALIDA = 'https://knvocftylpunbzycoarx.supabase.co';
const CLAVE_ANONIMA = jwtCon({ role: 'anon', ref: 'knvocftylpunbzycoarx' });

function configurar({ url = URL_VALIDA, clave = CLAVE_ANONIMA } = {}) {
  vi.stubEnv('VITE_SUPABASE_URL', url);
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', clave);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('leerConfiguracion', () => {
  it('devuelve la configuración cuando está completa', () => {
    configurar();
    expect(leerConfiguracion()).toEqual({ url: URL_VALIDA, anonKey: CLAVE_ANONIMA });
  });

  it('acepta el formato nuevo de clave publicable', () => {
    configurar({ clave: 'sb_publishable_BFInWpiGMhWXJNiudycIpA_MnxykSDs' });
    expect(() => leerConfiguracion()).not.toThrow();
  });

  it('nombra las dos variables que faltan en un solo mensaje', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    expect(() => leerConfiguracion()).toThrow(ErrorDeConfiguracion);
    try {
      leerConfiguracion();
    } catch (e) {
      expect(e.message).toContain('VITE_SUPABASE_URL');
      expect(e.message).toContain('VITE_SUPABASE_ANON_KEY');
      // Sin pasos accionables el mensaje no sirve de nada.
      expect(e.pasos.length).toBeGreaterThan(0);
    }
  });

  it('avisa cuando falta solo una', () => {
    configurar();
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    expect(() => leerConfiguracion()).toThrow(/VITE_SUPABASE_ANON_KEY/);
  });

  it('rechaza una URL que no se puede parsear', () => {
    configurar({ url: 'knvocftylpunbzycoarx' });
    expect(() => leerConfiguracion()).toThrow(/no es una dirección válida/);
  });

  // Lo más importante de este archivo: la clave de servidor saltea toda la RLS
  // y viaja dentro del bundle. En una base compartida por tres personas, pegarla
  // por error la deja abierta para cualquiera.
  it('rechaza la clave service_role', () => {
    configurar({ clave: jwtCon({ role: 'service_role' }) });
    expect(() => leerConfiguracion()).toThrow(/service_role/);
  });

  it('rechaza el formato nuevo de clave secreta', () => {
    configurar({ clave: 'sb_secret_algo_muy_secreto' });
    expect(() => leerConfiguracion()).toThrow(ErrorDeConfiguracion);
  });

  it('no rechaza un formato de clave que todavía no conoce', () => {
    // Mejor dejar que falle Supabase con su propio mensaje que bloquear a
    // alguien por una heurística nuestra que quedó vieja.
    configurar({ clave: 'formato-futuro-desconocido' });
    expect(() => leerConfiguracion()).not.toThrow();
  });
});

describe('hayStripeConfigurado', () => {
  it('es falso cuando la variable está vacía', () => {
    vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', '');
    expect(hayStripeConfigurado()).toBe(false);
  });

  it('es verdadero cuando hay una clave', () => {
    vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_123');
    expect(hayStripeConfigurado()).toBe(true);
  });
});
