import { ErrorDeConfiguracion } from '@/api/errores';

/**
 * Validación de las variables de entorno.
 *
 * Es PEREZOSA a propósito: se ejecuta la primera vez que alguien usa el cliente
 * de Supabase, nunca al importar el módulo. Si validáramos al importar, `vite
 * build` se caería en CI (donde no hay credenciales reales) y cualquier test
 * que importe la cadena de módulos necesitaría un .env.
 */

const PASOS_HABITUALES = [
  'Copiá el archivo .env.example a .env.local en la raíz del proyecto.',
  'Pedile a alguien del equipo las claves del proyecto de Supabase compartido, o sacalas del panel: Project Settings → API.',
  'Reiniciá npm run dev: Vite lee los archivos .env solo al arrancar, no los recarga en caliente.',
];

/** Decodifica el payload de un JWT sin validar la firma. Devuelve null si no es un JWT. */
function leerPayloadJwt(token) {
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const relleno = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(relleno));
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
function validarClaveAnonima(clave) {
  if (clave.startsWith('sb_secret_')) {
    throw new ErrorDeConfiguracion(
      'VITE_SUPABASE_ANON_KEY tiene una clave secreta (sb_secret_...). Esa clave saltea todas las políticas de seguridad y nunca puede ir en el navegador.',
      { pasos: ['Usá la clave pública: en el panel de Supabase, Project Settings → API, la que dice "anon" o "publishable".'] }
    );
  }

  // Formato nuevo de claves publicables: no son JWT, no hay más que revisar.
  if (clave.startsWith('sb_publishable_')) return;

  const payload = leerPayloadJwt(clave);
  // Si no es un JWT ni una clave sb_, no la rechazamos: puede ser un formato
  // más nuevo que este código todavía no conoce. Que falle Supabase con su
  // propio mensaje antes que bloquear a alguien por una heurística nuestra.
  if (!payload) return;

  if (payload.role === 'service_role') {
    throw new ErrorDeConfiguracion(
      'VITE_SUPABASE_ANON_KEY tiene la clave service_role. Esa clave saltea todas las políticas de seguridad y nunca puede ir en el navegador.',
      { pasos: ['Usá la clave "anon public": en el panel de Supabase, Project Settings → API.'] }
    );
  }
}

/**
 * Devuelve la configuración validada o tira ErrorDeConfiguracion con pasos
 * concretos para destrabarlo.
 */
export function leerConfiguracion() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  const faltantes = [];
  if (!url) faltantes.push('VITE_SUPABASE_URL');
  if (!anonKey) faltantes.push('VITE_SUPABASE_ANON_KEY');

  if (faltantes.length > 0) {
    throw new ErrorDeConfiguracion(
      `Falta configurar ${faltantes.join(' y ')} en el archivo .env.local.`,
      { pasos: PASOS_HABITUALES }
    );
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('protocolo inválido');
    }
  } catch {
    throw new ErrorDeConfiguracion(
      `VITE_SUPABASE_URL no es una dirección válida: "${url}".`,
      { pasos: ['Tiene que ser la URL completa del proyecto, con https:// adelante y sin barra al final. Por ejemplo: https://knvocftylpunbzycoarx.supabase.co'] }
    );
  }

  validarClaveAnonima(anonKey);

  return { url, anonKey };
}

/** La clave publicable de Stripe es opcional: sin ella las donaciones con tarjeta se deshabilitan. */
export function hayStripeConfigurado() {
  return Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim());
}
