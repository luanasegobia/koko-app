import { ErrorDeArchivo, ErrorDeConfiguracion, SinPermisoError } from './errores';

/**
 * Traduce cualquier error a una frase que se le pueda mostrar a la persona.
 *
 * Mostrar "PGRST116" no le sirve a nadie, y dejar la promesa rechazada sin
 * atrapar deja el botón girando para siempre. Todos los formularios pasan por
 * acá antes de mostrar un error.
 */
export function mensajeDeError(error: unknown): string {
  if (!error) return 'Ocurrió un error inesperado.';

  if (error instanceof ErrorDeArchivo) return error.message;
  if (error instanceof SinPermisoError) return error.message;
  if (error instanceof ErrorDeConfiguracion) return error.message;

  const conDatos = error as { name?: string; message?: string; codigo?: string; code?: string };

  // Sin conexión, o el servidor no respondió.
  if (conDatos.name === 'TypeError' && /fetch|network/i.test(conDatos.message || '')) {
    return 'No pudimos conectarnos. Revisá tu conexión a internet y probá de nuevo.';
  }

  const codigo = conDatos.codigo || conDatos.code;
  if (codigo === '23505') return 'Ese registro ya existe.';
  if (codigo === '42501') return 'No tenés permiso para hacer esto.';

  return conDatos.message || 'Ocurrió un error inesperado. Probá de nuevo.';
}
