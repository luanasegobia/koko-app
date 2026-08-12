import { ErrorDeArchivo, ErrorDeConfiguracion, SinPermisoError } from '@/api/errores';

/**
 * Traduce cualquier error a una frase que se le pueda mostrar a la persona.
 *
 * Los formularios no tenían manejo de errores: cuando algo fallaba, la promesa
 * quedaba rechazada sin atrapar, el spinner giraba para siempre y no aparecía
 * ningún mensaje. Cualquier cosa era preferible a eso, pero mostrar
 * "PGRST116" tampoco sirve.
 */
export function mensajeDeError(error) {
  if (!error) return 'Ocurrió un error inesperado.';

  if (error instanceof ErrorDeArchivo) return error.message;
  if (error instanceof SinPermisoError) return error.message;
  if (error instanceof ErrorDeConfiguracion) return error.message;

  // Sin conexión, o el servidor no respondió.
  if (error.name === 'TypeError' && /fetch|network/i.test(error.message || '')) {
    return 'No pudimos conectarnos. Revisá tu conexión a internet y probá de nuevo.';
  }

  const codigo = error.codigo || error.code;
  if (codigo === '23505') return 'Ese registro ya existe.';
  if (codigo === '42501') return 'No tenés permiso para hacer esto.';

  return error.message || 'Ocurrió un error inesperado. Probá de nuevo.';
}
