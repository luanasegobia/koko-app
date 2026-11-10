import { describe, expect, it } from 'vitest';
import { ErrorDeConfiguracion } from '../app/core/errores';
import {
  alertasHabilitadas,
  hayStripeConfigurado,
  leerConfiguracion,
  tiempoRealHabilitado,
  VariablesDeEntorno,
} from './entorno';

/** Arma un JWT con el payload pedido. La firma no importa: nunca se valida acá. */
const jwtCon = (payload: object) =>
  `cabecera.${btoa(JSON.stringify(payload)).replace(/=/g, '')}.firma`;

const URL_VALIDA = 'https://knvocftylpunbzycoarx.supabase.co';
const CLAVE_ANONIMA = jwtCon({ role: 'anon', ref: 'knvocftylpunbzycoarx' });

function entorno(parcial: Partial<VariablesDeEntorno> = {}): VariablesDeEntorno {
  return {
    SUPABASE_URL: URL_VALIDA,
    SUPABASE_ANON_KEY: CLAVE_ANONIMA,
    STRIPE_PUBLISHABLE_KEY: '',
    HABILITAR_TIEMPO_REAL: '',
    HABILITAR_ALERTAS: '',
    ...parcial,
  };
}

describe('leerConfiguracion', () => {
  it('devuelve la configuración cuando está completa', () => {
    expect(leerConfiguracion(entorno())).toEqual({ url: URL_VALIDA, anonKey: CLAVE_ANONIMA });
  });

  it('acepta el formato nuevo de clave publicable', () => {
    const clave = 'sb_publishable_BFInWpiGMhWXJNiudycIpA_MnxykSDs';
    expect(() => leerConfiguracion(entorno({ SUPABASE_ANON_KEY: clave }))).not.toThrow();
  });

  it('nombra las dos variables que faltan en un solo mensaje', () => {
    const vacio = entorno({ SUPABASE_URL: '', SUPABASE_ANON_KEY: '' });
    expect(() => leerConfiguracion(vacio)).toThrow(ErrorDeConfiguracion);
    try {
      leerConfiguracion(vacio);
    } catch (error) {
      const configuracion = error as ErrorDeConfiguracion;
      expect(configuracion.message).toContain('SUPABASE_URL');
      expect(configuracion.message).toContain('SUPABASE_ANON_KEY');
      expect(configuracion.pasos.length).toBeGreaterThan(0);
    }
  });

  it('rechaza la clave service_role aunque sea un JWT válido', () => {
    const secreta = jwtCon({ role: 'service_role' });
    expect(() => leerConfiguracion(entorno({ SUPABASE_ANON_KEY: secreta }))).toThrow(/service_role/);
  });

  it('rechaza una clave secreta sb_secret_', () => {
    expect(() => leerConfiguracion(entorno({ SUPABASE_ANON_KEY: 'sb_secret_abc' }))).toThrow(
      /sb_secret_/,
    );
  });

  it('rechaza una URL que no es una dirección', () => {
    expect(() => leerConfiguracion(entorno({ SUPABASE_URL: 'knvocftylpunbzycoarx' }))).toThrow(
      /no es una dirección válida/,
    );
  });

  it('no rechaza una clave con un formato que todavía no conoce', () => {
    expect(() =>
      leerConfiguracion(entorno({ SUPABASE_ANON_KEY: 'formato-futuro-123' })),
    ).not.toThrow();
  });
});

describe('banderas opcionales', () => {
  it('Stripe queda deshabilitado sin clave publicable', () => {
    expect(hayStripeConfigurado(entorno())).toBe(false);
    expect(hayStripeConfigurado(entorno({ STRIPE_PUBLISHABLE_KEY: 'pk_test_1' }))).toBe(true);
  });

  it('el tiempo real y las alertas están apagados salvo que valgan "true"', () => {
    expect(tiempoRealHabilitado(entorno())).toBe(false);
    expect(tiempoRealHabilitado(entorno({ HABILITAR_TIEMPO_REAL: 'true' }))).toBe(true);
    expect(alertasHabilitadas(entorno({ HABILITAR_ALERTAS: 'si' }))).toBe(false);
  });
});
