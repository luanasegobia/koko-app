/**
 * Errores tipados de la capa de datos.
 *
 * Existen para que la interfaz pueda distinguir "falta configurar el entorno"
 * de "se cayó la red" de "la base de datos no te deja hacer esto". Sin ellos,
 * todo llegaría como un error crudo de PostgREST con códigos como PGRST116, que
 * no le dicen nada ni a quien desarrolla ni a quien usa la app.
 */

/** Falta o está mal el archivo .env.local. Lo muestra la pantalla de configuración. */
export class ErrorDeConfiguracion extends Error {
  /** Pasos concretos para destrabarlo, que se muestran en pantalla. */
  readonly pasos: string[];

  constructor(mensaje: string, { pasos = [] }: { pasos?: string[] } = {}) {
    super(mensaje);
    this.name = 'ErrorDeConfiguracion';
    this.pasos = pasos;
  }
}

/** Falló una consulta a la base de datos. */
export class ErrorDeDatos extends Error {
  readonly tabla?: string;
  readonly operacion?: string;
  /** El error original de PostgREST, para poder mirarlo en la consola. */
  readonly causa?: { code?: string; message?: string };
  readonly codigo?: string;

  constructor(
    mensaje: string,
    {
      tabla,
      operacion,
      causa,
    }: { tabla?: string; operacion?: string; causa?: { code?: string; message?: string } } = {},
  ) {
    super(mensaje);
    this.name = 'ErrorDeDatos';
    this.tabla = tabla;
    this.operacion = operacion;
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
  readonly tabla?: string;
  readonly operacion?: string;

  constructor(
    mensaje = 'No tenés permiso para hacer esto.',
    { tabla, operacion }: { tabla?: string; operacion?: string } = {},
  ) {
    super(mensaje);
    this.name = 'SinPermisoError';
    this.tabla = tabla;
    this.operacion = operacion;
  }
}

/** El archivo que se quiso subir no cumple con el tipo o el tamaño permitido. */
export class ErrorDeArchivo extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorDeArchivo';
  }
}
