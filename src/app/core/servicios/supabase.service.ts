import { inject, Injectable, InjectionToken } from '@angular/core';
import {
  createClient,
  type PostgrestError,
  type RealtimePostgresChangesPayload,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { leerConfiguracion, tiempoRealHabilitado } from '../../../environments/entorno';

/**
 * Dependencias externas del servicio, expuestas como tokens para poder
 * reemplazarlas en los tests con TestBed (sin tocar la base compartida).
 * Los valores son funciones: la configuración se sigue leyendo de forma
 * perezosa, en el primer uso.
 */
export const LECTOR_DE_CONFIGURACION = new InjectionToken<typeof leerConfiguracion>(
  'LECTOR_DE_CONFIGURACION',
  { providedIn: 'root', factory: () => leerConfiguracion },
);

export const BANDERA_TIEMPO_REAL = new InjectionToken<() => boolean>('BANDERA_TIEMPO_REAL', {
  providedIn: 'root',
  factory: () => tiempoRealHabilitado,
});

export const FABRICA_DE_CLIENTE = new InjectionToken<typeof createClient>('FABRICA_DE_CLIENTE', {
  providedIn: 'root',
  factory: () => createClient,
});
import { ErrorDeArchivo, ErrorDeDatos, SinPermisoError } from '../errores';
import {
  CasoUrgente,
  Denuncia,
  Mascota,
  MascotaAdopcion,
  MascotaPerdida,
  MensajeChat,
  Notificacion,
  RegistroBase,
  SuscripcionAlertas,
  Veterinaria,
} from '../modelos';
import { idUnico } from '../utilidades';

/** Evento de tiempo real ya traducido al formato que esperan los componentes. */
export interface EventoDeEntidad<T> {
  tipo: 'create' | 'update' | 'delete' | string;
  datos: T | null;
  id: string | null;
  tabla: string;
}

/**
 * Cómo se maneja la autoría en cada tabla.
 *
 *   autorDesdeServidor: true  → la columna la completa el DEFAULT de la base
 *                               con auth.uid(). El cliente no la manda nunca.
 *   autorDesdeServidor: false → la interfaz la elige a propósito y el servicio
 *                               no la toca (chat_message admite invitados sin
 *                               sesión; user_id ya está atado por su política).
 */
interface DefinicionDeEntidad {
  tabla: string;
  columnaAutor: string;
  autorDesdeServidor: boolean;
}

/** Campos que la base administra sola y que el cliente nunca debería reenviar. */
const CAMPOS_DE_LA_BASE = ['id', 'created_at', 'updated_at'];

function envolverError(error: PostgrestError, tabla: string, operacion: string): Error {
  // 42501 = insufficient_privilege. PostgREST también devuelve 0 filas cuando
  // una política bloquea la operación, caso que se maneja en cada método.
  if (error.code === '42501') {
    return new SinPermisoError('No tenés permiso para hacer esto.', { tabla, operacion });
  }
  return new ErrorDeDatos(error.message || 'Falló la consulta a la base de datos.', {
    tabla,
    operacion,
    causa: error,
  });
}

/**
 * Traduce el evento de Supabase al formato que esperan los componentes.
 * Supabase entrega `{ eventType: 'INSERT', new, old }`.
 */
function normalizarEvento<T extends RegistroBase>(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
): EventoDeEntidad<T> {
  const tipos: Record<string, EventoDeEntidad<T>['tipo']> = {
    INSERT: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
  };
  const datos = (payload.eventType === 'DELETE' ? payload.old : payload.new) as T | null;
  return {
    tipo: tipos[payload.eventType] || payload.eventType?.toLowerCase(),
    datos: datos || null,
    id: datos?.id ?? null,
    tabla: payload.table,
  };
}

/**
 * Operaciones genéricas sobre una tabla: listar, filtrar, crear, actualizar,
 * eliminar y suscribirse a cambios. Cada entidad de la app es una instancia.
 */
export class ClienteDeEntidad<T extends RegistroBase> {
  constructor(
    private readonly obtenerCliente: () => SupabaseClient,
    private readonly definicion: DefinicionDeEntidad,
    private readonly tiempoRealHabilitado: () => boolean,
  ) {}

  /** `orden` acepta "-columna" para descendente, como "-created_at". */
  async listar(orden = '-created_at', limite = 100): Promise<T[]> {
    const { tabla } = this.definicion;
    const descendente = orden.startsWith('-');
    const columna = descendente ? orden.slice(1) : orden;

    const { data, error } = await this.obtenerCliente()
      .from(tabla)
      .select('*')
      .order(columna, { ascending: !descendente })
      .limit(limite);

    if (error) throw envolverError(error, tabla, 'listar');
    return (data || []) as T[];
  }

  async filtrar(
    condiciones: Partial<Record<keyof T, unknown>>,
    orden = '-created_at',
    limite = 100,
  ): Promise<T[]> {
    const { tabla } = this.definicion;
    if (!condiciones || Object.keys(condiciones).length === 0) {
      throw new ErrorDeDatos(
        'filtrar() necesita al menos una condición; usá listar() para traer todo.',
        { tabla, operacion: 'filtrar' },
      );
    }

    const descendente = orden.startsWith('-');
    const columna = descendente ? orden.slice(1) : orden;

    let consulta = this.obtenerCliente().from(tabla).select('*');
    for (const [clave, valor] of Object.entries(condiciones)) {
      consulta = valor === null ? consulta.is(clave, null) : consulta.eq(clave, valor);
    }

    const { data, error } = await consulta
      .order(columna, { ascending: !descendente })
      .limit(limite);
    if (error) throw envolverError(error, tabla, 'filtrar');
    return (data || []) as T[];
  }

  /** Devuelve null si no existe, en vez de tirar PGRST116. */
  async obtener(id: string): Promise<T | null> {
    const { tabla } = this.definicion;
    const { data, error } = await this.obtenerCliente()
      .from(tabla)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw envolverError(error, tabla, 'obtener');
    return (data as T | null) ?? null;
  }

  async crear(datos: Partial<T>): Promise<T> {
    const { tabla } = this.definicion;
    const campos = this.limpiarCampos(datos);

    const { data, error } = await this.obtenerCliente()
      .from(tabla)
      .insert(campos)
      .select()
      .single();
    if (error) throw envolverError(error, tabla, 'crear');
    return data as T;
  }

  async actualizar(id: string, datos: Partial<T>): Promise<T> {
    const { tabla } = this.definicion;
    const campos = this.limpiarCampos(datos);

    // Sin .single(): cuando una política bloquea la operación, PostgREST
    // devuelve cero filas y .single() tiraría un PGRST116 indescifrable.
    const { data, error } = await this.obtenerCliente()
      .from(tabla)
      .update(campos)
      .eq('id', id)
      .select();
    if (error) throw envolverError(error, tabla, 'actualizar');
    if (!data || data.length === 0) {
      throw new SinPermisoError('No podés modificar esto, o el registro ya no existe.', {
        tabla,
        operacion: 'actualizar',
      });
    }
    return data[0] as T;
  }

  /** Borrar algo que ya no está no es un error: devuelve null y sigue. */
  async eliminar(id: string): Promise<T | null> {
    const { tabla } = this.definicion;
    const { data, error } = await this.obtenerCliente().from(tabla).delete().eq('id', id).select();
    if (error) throw envolverError(error, tabla, 'eliminar');
    return (data?.[0] as T | undefined) ?? null;
  }

  /** Devuelve la función para desuscribirse. Con el tiempo real apagado no abre ningún canal. */
  suscribir(callback: (evento: EventoDeEntidad<T>) => void): () => void {
    if (!this.tiempoRealHabilitado()) {
      return () => undefined;
    }

    const { tabla } = this.definicion;
    const cliente = this.obtenerCliente();
    const canal = cliente
      .channel(`public:${tabla}:${idUnico()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tabla },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) =>
          callback(normalizarEvento<T>(payload)),
      )
      .subscribe();

    return () => {
      void cliente.removeChannel(canal);
    };
  }

  /**
   * Saca los campos que administra la base y, cuando corresponde, la autoría.
   * Si la mandara el cliente, cualquiera podría atribuirle contenido a otra
   * persona: la clave anónima es pública y viaja en el bundle.
   */
  private limpiarCampos(datos: Partial<T>): Record<string, unknown> {
    const campos: Record<string, unknown> = { ...datos };
    for (const campo of CAMPOS_DE_LA_BASE) delete campos[campo];
    if (this.definicion.autorDesdeServidor) delete campos[this.definicion.columnaAutor];
    return campos;
  }
}

export interface OpcionesDeSubida {
  tiposPermitidos?: string[];
  tamanioMaximoMb?: number;
}

/**
 * Punto único de acceso a Supabase.
 *
 * El cliente se crea la PRIMERA VEZ que se lo usa, no al construir el
 * servicio: así la validación del entorno es perezosa, `ng build` funciona en
 * CI sin credenciales y la app puede mostrar una pantalla de ayuda cuando falta
 * el .env.local en vez de quedar en blanco.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly leerConfiguracion = inject(LECTOR_DE_CONFIGURACION);
  private readonly tiempoRealHabilitado = inject(BANDERA_TIEMPO_REAL);
  private readonly crearCliente = inject(FABRICA_DE_CLIENTE);
  private clienteMemorizado: SupabaseClient | null = null;

  get cliente(): SupabaseClient {
    if (!this.clienteMemorizado) {
      const { url, anonKey } = this.leerConfiguracion();
      this.clienteMemorizado = this.crearCliente(url, anonKey);
    }
    return this.clienteMemorizado;
  }

  // Registro explícito de entidades: un error de tipeo falla al compilar, no
  // en el navegador con una consulta a una tabla inexistente.
  readonly mascotas = this.entidad<Mascota>({
    tabla: 'pet',
    columnaAutor: 'created_by_id',
    autorDesdeServidor: true,
  });
  readonly mascotasPerdidas = this.entidad<MascotaPerdida>({
    tabla: 'lost_pet',
    columnaAutor: 'created_by_id',
    autorDesdeServidor: true,
  });
  readonly mascotasEnAdopcion = this.entidad<MascotaAdopcion>({
    tabla: 'adoption_pet',
    columnaAutor: 'created_by_id',
    autorDesdeServidor: true,
  });
  readonly casosUrgentes = this.entidad<CasoUrgente>({
    tabla: 'urgent_case',
    columnaAutor: 'created_by_id',
    autorDesdeServidor: true,
  });
  readonly denuncias = this.entidad<Denuncia>({
    tabla: 'abuse_report',
    columnaAutor: 'created_by_id',
    autorDesdeServidor: true,
  });
  readonly veterinarias = this.entidad<Veterinaria>({
    tabla: 'veterinary',
    columnaAutor: 'registered_by_user_id',
    autorDesdeServidor: true,
  });
  readonly mensajesDeChat = this.entidad<MensajeChat>({
    tabla: 'chat_message',
    columnaAutor: 'sender_id',
    autorDesdeServidor: false,
  });
  readonly notificaciones = this.entidad<Notificacion>({
    tabla: 'app_notification',
    columnaAutor: 'user_id',
    autorDesdeServidor: false,
  });
  readonly suscripcionesDeAlertas = this.entidad<SuscripcionAlertas>({
    tabla: 'alert_subscription',
    columnaAutor: 'user_id',
    autorDesdeServidor: false,
  });

  /** Funciones de la base de datos. Hoy la usa "La vi" para cargar avistamientos. */
  async rpc<T = unknown>(nombre: string, argumentos: Record<string, unknown> = {}): Promise<T> {
    const { data, error } = await this.cliente.rpc(nombre, argumentos);
    if (error) throw envolverError(error, nombre, 'rpc');
    return data as T;
  }

  /** Invoca una Edge Function (por ejemplo, la sesión de pago de Stripe). */
  async invocarFuncion<T = unknown>(nombre: string, cuerpo: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.cliente.functions.invoke(nombre, { body: cuerpo });
    if (error) throw new Error(error.message || `Falló la función ${nombre}.`);
    return data as T;
  }

  /**
   * Sube un archivo al bucket público y devuelve su URL.
   *
   * Guarda en `<id de usuario>/<nombre único>` para que la política
   * storage_delete_owner tenga de dónde agarrarse.
   */
  async subirArchivo(
    archivo: File,
    { tiposPermitidos = ['image/'], tamanioMaximoMb = 8 }: OpcionesDeSubida = {},
  ): Promise<{ file_url: string }> {
    if (!archivo || typeof archivo.name !== 'string') {
      throw new ErrorDeArchivo('No se recibió un archivo válido.');
    }

    const tipo = archivo.type || '';
    if (!tiposPermitidos.some((permitido) => tipo.startsWith(permitido))) {
      throw new ErrorDeArchivo(
        tiposPermitidos.length === 1 && tiposPermitidos[0] === 'image/'
          ? 'El archivo tiene que ser una imagen.'
          : 'Ese tipo de archivo no está permitido.',
      );
    }

    const tamanioMaximo = tamanioMaximoMb * 1024 * 1024;
    if (archivo.size > tamanioMaximo) {
      throw new ErrorDeArchivo(`El archivo pesa demasiado. El máximo son ${tamanioMaximoMb} MB.`);
    }

    const {
      data: { user },
    } = await this.cliente.auth.getUser();
    if (!user) {
      throw new ErrorDeArchivo('Necesitás iniciar sesión para subir archivos.');
    }

    const extension = archivo.name.includes('.')
      ? archivo.name.split('.').pop()!.toLowerCase()
      : 'bin';
    const ruta = `${user.id}/${idUnico()}.${extension}`;

    const { error } = await this.cliente.storage
      .from('public-files')
      .upload(ruta, archivo, { contentType: tipo, upsert: false });
    if (error) throw new ErrorDeArchivo(error.message || 'No se pudo subir el archivo.');

    const { data } = this.cliente.storage.from('public-files').getPublicUrl(ruta);
    return { file_url: data.publicUrl };
  }

  private entidad<T extends RegistroBase>(definicion: DefinicionDeEntidad): ClienteDeEntidad<T> {
    return new ClienteDeEntidad<T>(() => this.cliente, definicion, () => this.tiempoRealHabilitado());
  }
}
