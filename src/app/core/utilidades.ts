import { PuntoLatLng } from './modelos';

/** Distancia en kilómetros entre dos puntos, por la fórmula de Haversine. */
export function distanciaEnKm([lat1, lng1]: PuntoLatLng, [lat2, lng2]: PuntoLatLng): number {
  const radioTierra = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return radioTierra * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Identificador único sin depender de crypto.randomUUID, que no existe fuera de contexto seguro. */
export function idUnico(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // La app es mobile-first: probarla desde el celular contra http://192.168.x.x
  // no es contexto seguro y ahí crypto.randomUUID no está definido.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Escapa texto para insertarlo dentro de HTML armado a mano (por ejemplo, los popups del mapa). */
export function escaparHtml(texto: unknown): string {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Iniciales de un nombre ("Ana Gómez" → "AG"). */
export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .map((palabra) => palabra[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Formatea un monto en pesos argentinos sin decimales. */
export function formatearMonto(valor: number | null | undefined): string {
  return (valor ?? 0).toLocaleString('es-AR');
}

/** Copia texto al portapapeles. Devuelve false si el navegador no lo permite. */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}
