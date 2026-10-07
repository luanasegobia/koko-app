import { ErrorDeConfiguracion } from '../app/core/errores';
import { ENTORNO_LOCAL } from './entorno.local';

/**
 * Validación de las variables de entorno.
 *
 * Es PEREZOSA a propósito: se ejecuta la primera vez que alguien usa el cliente
 * de Supabase, nunca al importar el módulo. Si validáramos al importar, `ng
 * build` se caería en CI (donde no hay credenciales reales) y cualquier test que
 * importe la cadena de módulos necesitaría un .env.
 *
 * Los valores llegan desde `entorno.local.ts`, que genera
 * `scripts/generar-entorno.mjs` a partir de `.env.local`.
 */
export interface VariablesDeEntorno {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  HABILITAR_TIEMPO_REAL: string;
  HABILITAR_ALERTAS: string;
}

const PASOS_HABITUALES = [
  'Copiá el archivo .env.example a .env.local en la raíz del proyecto.',
  'Pedile a alguien del equipo las claves del proyecto de Supabase compartido, o sacalas del panel: Project Settings → API.',
  'Reiniciá npm run dev: el archivo .env.local se lee solo al arrancar, no se recarga en caliente.',
];

/** Decodifica el payload de un JWT sin validar la firma. Devuelve null si no es un JWT. */
function leerPayloadJwt(token: string): Record<string, unknown> | null {
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const relleno = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(relleno)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Rechaza las claves de servidor. La `service_role` (o una `sb_secret_`)
 * saltea TODAS las políticas de seguridad, y además viaja al navegador dentro
 * del bundle. Pegarla por error en un proyecto compartido deja la base
 * completamente abierta para todo el equipo, así que se corta acá.
 */
function validarClaveAnonima(clave: string): void {
  if (clave.startsWith('sb_secret_')) {
    throw new ErrorDeConfiguracion(
      'SUPABASE_ANON_KEY tiene una clave secreta (sb_secret_...). Esa clave saltea todas las políticas de seguridad y nunca puede ir en el navegador.',
      {
        pasos: [
          'Usá la clave pública: en el panel de Supabase, Project Settings → API, la que dice "anon" o "publishable".',
        ],
      },
    );
  }

  // Formato nuevo de claves publicables: no son JWT, no hay más que revisar.
  if (clave.startsWith('sb_publishable_')) return;

  const payload = leerPayloadJwt(clave);
  // Si no es un JWT ni una clave sb_, no la rechazamos: puede ser un formato
  // más nuevo que este código todavía no conoce. Que falle Supabase con su
  // propio mensaje antes que bloquear a alguien por una heurística nuestra.
  if (!payload) return;

  if (payload['role'] === 'service_role') {
    throw new ErrorDeConfiguracion(
      'SUPABASE_ANON_KEY tiene la clave service_role. Esa clave saltea todas las políticas de seguridad y nunca puede ir en el navegador.',
      { pasos: ['Usá la clave "anon public": en el panel de Supabase, Project Settings → API.'] },
    );
  }
}

/**
 * Devuelve la configuración validada o tira ErrorDeConfiguracion con pasos
 * concretos para destrabarlo.
 */
export function leerConfiguracion(
  entorno: VariablesDeEntorno = ENTORNO_LOCAL,
): { url: string; anonKey: string } {
  const url = entorno.SUPABASE_URL?.trim();
  const anonKey = entorno.SUPABASE_ANON_KEY?.trim();

  const faltantes: string[] = [];
  if (!url) faltantes.push('SUPABASE_URL');
  if (!anonKey) faltantes.push('SUPABASE_ANON_KEY');

  if (faltantes.length > 0) {
    throw new ErrorDeConfiguracion(
      `Falta configurar ${faltantes.join(' y ')} en el archivo .env.local.`,
      { pasos: PASOS_HABITUALES },
    );
  }

  try {
    const parseada = new URL(url);
    if (parseada.protocol !== 'https:' && parseada.protocol !== 'http:') {
      throw new Error('protocolo inválido');
    }
  } catch {
    throw new ErrorDeConfiguracion(`SUPABASE_URL no es una dirección válida: "${url}".`, {
      pasos: [
        'Tiene que ser la URL completa del proyecto, con https:// adelante y sin barra al final. Por ejemplo: https://knvocftylpunbzycoarx.supabase.co',
      ],
    });
  }

  validarClaveAnonima(anonKey);

  return { url, anonKey };
}

/** La clave publicable de Stripe es opcional: sin ella las donaciones con tarjeta se deshabilitan. */
export function hayStripeConfigurado(entorno: VariablesDeEntorno = ENTORNO_LOCAL): boolean {
  return Boolean(entorno.STRIPE_PUBLISHABLE_KEY?.trim());
}

/** Chat y notificaciones en vivo. Apagado por defecto. */
export function tiempoRealHabilitado(entorno: VariablesDeEntorno = ENTORNO_LOCAL): boolean {
  return entorno.HABILITAR_TIEMPO_REAL === 'true';
}

/** Sondeo de alertas por cercanía. Apagado por defecto. */
export function alertasHabilitadas(entorno: VariablesDeEntorno = ENTORNO_LOCAL): boolean {
  return entorno.HABILITAR_ALERTAS === 'true';
}
