import { createClient } from '@supabase/supabase-js';
import { leerConfiguracion } from '@/api/entorno';
import { ErrorDeArchivo, ErrorDeDatos, SinPermisoError } from '@/api/errores';

/**
 * El cliente se crea la PRIMERA VEZ que se lo usa, no al importar el módulo.
 *
 * Antes esto era `createClient(import.meta.env.VITE_SUPABASE_URL, ...)` suelto:
 * sin .env.local, `createClient` tiraba mientras se evaluaba el módulo, cosa
 * que ningún ErrorBoundary puede atrapar, y la app quedaba en blanco sin una
 * sola pista. Diferirlo también es lo que permite que `vite build` funcione en
 * CI, donde no hay credenciales.
 */
let clienteMemorizado = null;

export function obtenerCliente() {
  if (!clienteMemorizado) {
    const { url, anonKey } = leerConfiguracion();
    clienteMemorizado = createClient(url, anonKey);
  }
  return clienteMemorizado;
}

/**
 * Fachada perezosa: se usa igual que el cliente de siempre
 * (`supabase.auth`, `supabase.from(...)`, `supabase.channel(...)`), pero no
 * lo instancia hasta el primer acceso.
 */
export const supabase = new Proxy(
  {},
  {
    get: (_objetivo, propiedad) => {
      const cliente = obtenerCliente();
      const valor = cliente[propiedad];
      return typeof valor === 'function' ? valor.bind(cliente) : valor;
    },
  }
);

/**
 * Registro explícito de entidades.
 *
 * Antes esto era un Proxy que derivaba el nombre de la tabla convirtiendo
 * CamelCase a snake_case sobre la marcha. Con eso, un error de tipeo como
 * `db.entities.LostPets` generaba en silencio una consulta a la tabla
 * `lost_pets` y fallaba recién en el navegador. Peor: al no saber nada de cada
 * tabla, no podía completar la columna de autoría, que además no se llama igual
 * en todas.
 *
 *   autorDesdeServidor: true  → la columna la completa el DEFAULT de la base
 *                               con auth.uid(). El cliente no la manda nunca.
 *   autorDesdeServidor: false → la interfaz la elige a propósito y el shim no
 *                               la toca (chat_message admite invitados sin
 *                               sesión; user_id ya está atado por su política).
 */
const ENTIDADES = {
  Pet: { tabla: 'pet', columnaAutor: 'created_by_id', autorDesdeServidor: true },
  LostPet: { tabla: 'lost_pet', columnaAutor: 'created_by_id', autorDesdeServidor: true },
  AdoptionPet: { tabla: 'adoption_pet', columnaAutor: 'created_by_id', autorDesdeServidor: true },
  UrgentCase: { tabla: 'urgent_case', columnaAutor: 'created_by_id', autorDesdeServidor: true },
  AbuseReport: { tabla: 'abuse_report', columnaAutor: 'created_by_id', autorDesdeServidor: true },
  Veterinary: { tabla: 'veterinary', columnaAutor: 'registered_by_user_id', autorDesdeServidor: true },
  ChatMessage: { tabla: 'chat_message', columnaAutor: 'sender_id', autorDesdeServidor: false },
  AppNotification: { tabla: 'app_notification', columnaAutor: 'user_id', autorDesdeServidor: false },
  AlertSubscription: { tabla: 'alert_subscription', columnaAutor: 'user_id', autorDesdeServidor: false },
};

/** Campos que la base administra sola y que el cliente nunca debería reenviar. */
const CAMPOS_DE_LA_BASE = ['id', 'created_at', 'updated_at'];

const PERFIL_VISIBLE =
  'full_name, phone, avatar_url, tipo_cuenta, es_admin, profile_completed, bio, location, organization_name';

function envolverError(error, tabla, operacion) {
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
 * Traduce el evento de Supabase al formato que ya esperaban los componentes.
 *
 * Supabase entrega `{ eventType: 'INSERT', new, old }`; el código heredado de
 * Base44 lee `{ type: 'create', data, id }`. Como nunca se tradujo, todas las
 * suscripciones eran silenciosamente inertes: la condición
 * `event.type === 'create'` jamás daba verdadera.
 */
function normalizarEvento(payload) {
  const tipos = { INSERT: 'create', UPDATE: 'update', DELETE: 'delete' };
  const data = payload.eventType === 'DELETE' ? payload.old : payload.new;
  return {
    type: tipos[payload.eventType] || payload.eventType?.toLowerCase(),
    data: data || null,
    id: data?.id ?? null,
    tabla: payload.table,
  };
}

/** Identificador único sin depender de crypto.randomUUID, que no existe fuera de contexto seguro. */
function idUnico() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // La app es mobile-first: probarla desde el celular contra http://192.168.x.x
  // no es contexto seguro y ahí crypto.randomUUID no está definido.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function clienteDeEntidad({ tabla, columnaAutor, autorDesdeServidor }) {
  return {
    list: async (orderBy = '-created_at', limit = 100) => {
      const descendente = orderBy.startsWith('-');
      const columna = descendente ? orderBy.slice(1) : orderBy;

      const { data, error } = await obtenerCliente()
        .from(tabla)
        .select('*')
        .order(columna, { ascending: !descendente })
        .limit(limit);

      if (error) throw envolverError(error, tabla, 'list');
      return data || [];
    },

    filter: async (condiciones, orderBy = '-created_at', limit = 100) => {
      if (!condiciones || Object.keys(condiciones).length === 0) {
        throw new ErrorDeDatos('filter() necesita al menos una condición; usá list() para traer todo.', {
          tabla,
          operacion: 'filter',
        });
      }

      const descendente = orderBy.startsWith('-');
      const columna = descendente ? orderBy.slice(1) : orderBy;

      let consulta = obtenerCliente().from(tabla).select('*');
      for (const [clave, valor] of Object.entries(condiciones)) {
        consulta = valor === null ? consulta.is(clave, null) : consulta.eq(clave, valor);
      }

      const { data, error } = await consulta.order(columna, { ascending: !descendente }).limit(limit);
      if (error) throw envolverError(error, tabla, 'filter');
      return data || [];
    },

    /** Devuelve null si no existe, en vez de tirar PGRST116 como antes. */
    get: async (id) => {
      const { data, error } = await obtenerCliente().from(tabla).select('*').eq('id', id).maybeSingle();
      if (error) throw envolverError(error, tabla, 'get');
      return data ?? null;
    },

    create: async (payload) => {
      const campos = { ...payload };
      for (const campo of CAMPOS_DE_LA_BASE) delete campos[campo];
      // La autoría la pone el DEFAULT del servidor con auth.uid(). Si la
      // mandara el cliente, cualquiera podría atribuirle contenido a otra
      // persona: la clave anónima es pública y viaja en el bundle.
      if (autorDesdeServidor) delete campos[columnaAutor];

      const { data, error } = await obtenerCliente().from(tabla).insert(campos).select().single();
      if (error) throw envolverError(error, tabla, 'create');
      return data;
    },

    update: async (id, payload) => {
      const campos = { ...payload };
      for (const campo of CAMPOS_DE_LA_BASE) delete campos[campo];
      if (autorDesdeServidor) delete campos[columnaAutor];

      // Sin .single(): cuando una política bloquea la operación, PostgREST
      // devuelve cero filas y .single() tiraba un PGRST116 indescifrable.
      const { data, error } = await obtenerCliente().from(tabla).update(campos).eq('id', id).select();
      if (error) throw envolverError(error, tabla, 'update');
      if (!data || data.length === 0) {
        throw new SinPermisoError('No podés modificar esto, o el registro ya no existe.', {
          tabla,
          operacion: 'update',
        });
      }
      return data[0];
    },

    /** Borrar algo que ya no está no es un error: devuelve null y sigue. */
    delete: async (id) => {
      const { data, error } = await obtenerCliente().from(tabla).delete().eq('id', id).select();
      if (error) throw envolverError(error, tabla, 'delete');
      return data?.[0] ?? null;
    },

    subscribe: (callback) => {
      // El tiempo real está apagado por defecto: la normalización de eventos
      // enciende suscripciones que nunca llegaron a ejecutarse, y eso se valida
      // en una etapa aparte. Con la bandera apagada no se abre ningún canal.
      if (import.meta.env.VITE_HABILITAR_TIEMPO_REAL !== 'true') {
        return () => {};
      }

      const cliente = obtenerCliente();
      const canal = cliente
        .channel(`public:${tabla}:${idUnico()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tabla }, (payload) =>
          callback(normalizarEvento(payload))
        )
        .subscribe();

      return () => {
        cliente.removeChannel(canal);
      };
    },
  };
}

const entidades = new Proxy(
  {},
  {
    get: (_objetivo, nombre) => {
      // Las herramientas de desarrollo y algunas librerías inspeccionan objetos
      // con propiedades internas; no hay que tratarlas como entidades.
      if (typeof nombre !== 'string' || nombre === 'then') return undefined;

      const definicion = ENTIDADES[nombre];
      if (!definicion) {
        throw new ErrorDeDatos(
          `No existe la entidad "${nombre}". Las disponibles son: ${Object.keys(ENTIDADES).join(', ')}.`,
          { operacion: 'entities' }
        );
      }
      return clienteDeEntidad(definicion);
    },
  }
);

export const db = {
  auth: {
    isAuthenticated: async () => {
      const { data } = await obtenerCliente().auth.getSession();
      return !!data.session;
    },

    me: async () => {
      const {
        data: { user },
      } = await obtenerCliente().auth.getUser();
      if (!user) return null;

      const { data: perfil } = await obtenerCliente()
        .from('profiles')
        .select(PERFIL_VISIBLE)
        .eq('id', user.id)
        .maybeSingle();

      return {
        id: user.id,
        email: user.email,
        ...user.user_metadata,
        ...(perfil || {}),
        // Ambos se leen siempre de profiles: user_metadata lo puede editar la
        // propia persona usuaria, así que no sirve para decidir permisos.
        tipo_cuenta: perfil?.tipo_cuenta || 'usuario',
        es_admin: perfil?.es_admin === true,
      };
    },

    logout: async (redirectUrl) => {
      await obtenerCliente().auth.signOut();
      if (redirectUrl) window.location.href = redirectUrl;
    },

    redirectToLogin: (redirectUrl) => {
      window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
    },

    loginViaEmailPassword: async (email, password) => {
      const { data, error } = await obtenerCliente().auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },

    register: async ({ email, password, fullName }) => {
      const { data, error } = await obtenerCliente().auth.signUp({
        email,
        password,
        // handle_new_user copia full_name desde acá al crear el perfil. Sin
        // esto el nombre quedaba en NULL y el chat mostraba "Usuario".
        options: fullName ? { data: { full_name: fullName } } : undefined,
      });
      if (error) throw error;
      return data;
    },

    verifyOtp: async ({ email, otpCode }) => {
      const { data, error } = await obtenerCliente().auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      });
      if (error) throw error;
      return data;
    },

    resendOtp: async (email) => {
      const { error } = await obtenerCliente().auth.resend({ type: 'signup', email });
      if (error) throw error;
      return true;
    },

    loginWithProvider: async (provider, destino) => {
      // Supabase exige una URL absoluta. Antes las pantallas pasaban "/", que
      // por ser truthy saltaba el respaldo y llegaba tal cual como redirectTo.
      const redirectTo = new URL(destino || '/', window.location.origin).href;
      const { data, error } = await obtenerCliente().auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) throw error;
      return data;
    },

    resetPasswordRequest: async (email) => {
      const { error } = await obtenerCliente().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return true;
    },

    resetPassword: async ({ newPassword }) => {
      // Se llega acá con la sesión ya establecida por el enlace del correo.
      const { error } = await obtenerCliente().auth.updateUser({ password: newPassword });
      if (error) throw error;
      return true;
    },

    updateMe: async (datos) => {
      const {
        data: { user },
      } = await obtenerCliente().auth.getUser();
      if (!user) throw new Error('No hay una sesión activa');

      // tipo_cuenta lo elige cada persona en el onboarding. es_admin no se
      // escribe nunca desde el cliente: lo bloquean los permisos por columna
      // y la política de la base de datos.
      const campos = { ...datos };
      delete campos.id;
      delete campos.es_admin;

      const { data: perfil, error } = await obtenerCliente()
        .from('profiles')
        .upsert({ id: user.id, email: user.email, ...campos })
        .select(PERFIL_VISIBLE)
        .single();
      if (error) throw envolverError(error, 'profiles', 'updateMe');

      return { id: user.id, email: user.email, ...perfil };
    },
  },

  entities: entidades,

  /** Funciones de la base de datos. Hoy la usa "La vi" para cargar avistamientos. */
  rpc: async (nombre, argumentos = {}) => {
    const { data, error } = await obtenerCliente().rpc(nombre, argumentos);
    if (error) throw envolverError(error, nombre, 'rpc');
    return data;
  },

  storage: {
    /**
     * Sube un archivo al bucket público y devuelve su URL.
     *
     * Reemplaza a `db.integrations.Core.UploadFile`, que era el nombre que le
     * ponía Base44 y no significa nada acá. Aquella versión recibía un File
     * pero las cinco pantallas le pasaban `{ file }`, así que `file.name` era
     * undefined y TODA subida de foto explotaba.
     *
     * Guarda en `<id de usuario>/<nombre único>` y no en `uploads/`, para que la
     * política storage_delete_owner tenga de dónde agarrarse.
     */
    subirArchivo: async (archivo, { tiposPermitidos = ['image/'], tamanioMaximoMb = 8 } = {}) => {
      if (!archivo || typeof archivo.name !== 'string') {
        throw new ErrorDeArchivo('No se recibió un archivo válido.');
      }

      const tipo = archivo.type || '';
      if (!tiposPermitidos.some((permitido) => tipo.startsWith(permitido))) {
        throw new ErrorDeArchivo(
          tiposPermitidos.length === 1 && tiposPermitidos[0] === 'image/'
            ? 'El archivo tiene que ser una imagen.'
            : 'Ese tipo de archivo no está permitido.'
        );
      }

      const tamanioMaximo = tamanioMaximoMb * 1024 * 1024;
      if (archivo.size > tamanioMaximo) {
        throw new ErrorDeArchivo(
          `El archivo pesa demasiado. El máximo son ${tamanioMaximoMb} MB.`
        );
      }

      const {
        data: { user },
      } = await obtenerCliente().auth.getUser();
      if (!user) {
        throw new ErrorDeArchivo('Necesitás iniciar sesión para subir archivos.');
      }

      const extension = archivo.name.includes('.') ? archivo.name.split('.').pop().toLowerCase() : 'bin';
      const ruta = `${user.id}/${idUnico()}.${extension}`;

      const { error } = await obtenerCliente()
        .storage.from('public-files')
        .upload(ruta, archivo, { contentType: tipo, upsert: false });
      if (error) throw new ErrorDeArchivo(error.message || 'No se pudo subir el archivo.');

      const { data } = obtenerCliente().storage.from('public-files').getPublicUrl(ruta);
      return { file_url: data.publicUrl };
    },
  },
};

export default db;
