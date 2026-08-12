/**
 * Errores tipados de la capa de datos.
 *
 * Existen para que la interfaz pueda distinguir "falta configurar el entorno"
 * de "se cayó la red" de "la base de datos no te deja hacer esto". Antes todo
 * llegaba como un error crudo de PostgREST con códigos como PGRST116, que no
 * le dicen nada ni a quien desarrolla ni a quien usa la app.
 */

/** Falta o está mal el archivo .env.local. Lo atrapa el ErrorBoundary. */
export class ErrorDeConfiguracion extends Error {
  constructor(mensaje, { pasos = [] } = {}) {
    super(mensaje);
    this.name = 'ErrorDeConfiguracion';
    /** Pasos concretos para destrabarlo, que el ErrorBoundary muestra en pantalla. */
    this.pasos = pasos;
  }
}

/** Falló una consulta a la base de datos. */
export class ErrorDeDatos extends Error {
  constructor(mensaje, { tabla, operacion, causa } = {}) {
    super(mensaje);
    this.name = 'ErrorDeDatos';
    this.tabla = tabla;
    this.operacion = operacion;
    /** El error original de PostgREST, para poder mirarlo en la consola. */
    this.causa = causa;
    this.codigo = causa?.code;
  }
}

/**
 * La operación no devolvió filas porque las políticas de seguridad la
 * bloquearon (o porque el registro ya no existe). Es un caso esperable,
 * no una falla del sistema.
 */
export class SinPermisoError extends Error {
  constructor(mensaje = 'No tenés permiso para hacer esto.', { tabla, operacion } = {}) {
    super(mensaje);
    this.name = 'SinPermisoError';
    this.tabla = tabla;
    this.operacion = operacion;
  }
}

/** El archivo que se quiso subir no cumple con el tipo o el tamaño permitido. */
export class ErrorDeArchivo extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorDeArchivo';
  }
}
