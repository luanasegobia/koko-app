import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Estos tests cubren exactamente los defectos que la migración desde Base44
 * dejó en la capa de datos, para que no vuelvan:
 *   - la columna de autoría la escribía (o no) el cliente,
 *   - update() con cero filas tiraba un PGRST116 indescifrable,
 *   - delete() de algo inexistente explotaba,
 *   - subir una foto reventaba porque la firma no coincidía con las pantallas,
 *   - los eventos de tiempo real nunca se traducían.
 *
 * Nada de esto toca la base compartida: crearía filas basura que verían las tres
 * personas del equipo y volvería los tests no determinísticos.
 */

const { createClientMock, estado } = vi.hoisted(() => {
  const estado = { resultado: { data: null, error: null }, ultima: null, cliente: null };
  return { createClientMock: vi.fn(() => estado.cliente), estado };
});

vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }));

/** Consulta encadenable que registra los métodos usados y resuelve al resultado preparado. */
function consultaFalsa() {
  const consulta = { llamadas: [], payload: null };
  for (const metodo of ['select', 'order', 'limit', 'eq', 'is', 'insert', 'update', 'delete']) {
    consulta[metodo] = vi.fn((...args) => {
      consulta.llamadas.push(metodo);
      if (metodo === 'insert' || metodo === 'update') consulta.payload = args[0];
      return consulta;
    });
  }
  consulta.single = vi.fn(() => Promise.resolve(estado.resultado));
  consulta.maybeSingle = vi.fn(() => Promise.resolve(estado.resultado));
  // Thenable: permite `await consulta` al final de la cadena, como hacen
  // update() y delete(), que a propósito no cierran con .single().
  consulta.then = (alCumplir, alFallar) =>
    Promise.resolve(estado.resultado).then(alCumplir, alFallar);
  return consulta;
}

// Se cargan dentro de beforeEach, después de vi.resetModules(): si se importaran
// arriba, las clases de error serían de otra copia del módulo y todo `instanceof`
// daría falso aunque el error sea el correcto.
let db;
let ErrorDeArchivo, ErrorDeDatos, SinPermisoError;

beforeEach(async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://ejemplo.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_deprueba');
  vi.stubEnv('VITE_HABILITAR_TIEMPO_REAL', '');

  estado.resultado = { data: null, error: null };
  estado.cliente = {
    from: vi.fn(() => {
      estado.ultima = consultaFalsa();
      return estado.ultima;
    }),
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'usuario-1', email: 'a@b.c' } } })) },
    channel: vi.fn(),
    removeChannel: vi.fn(),
    storage: { from: vi.fn() },
    rpc: vi.fn(async () => estado.resultado),
  };

  // El cliente queda memorizado en el módulo, así que hay que recargarlo.
  vi.resetModules();
  ({ db } = await import('@/api/supabaseClient'));
  ({ ErrorDeArchivo, ErrorDeDatos, SinPermisoError } = await import('@/api/errores'));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('db.entities — registro de entidades', () => {
  it('tira un error claro ante una entidad que no existe', () => {
    // Antes, `LostPets` en plural generaba en silencio una consulta a la tabla
    // `lost_pets` y fallaba recién contra el servidor.
    expect(() => db.entities.LostPets).toThrow(ErrorDeDatos);
    expect(() => db.entities.LostPets).toThrow(/No existe la entidad/);
  });

  it('mapea cada entidad a su tabla', async () => {
    estado.resultado = { data: [], error: null };
    await db.entities.LostPet.list();
    expect(estado.cliente.from).toHaveBeenCalledWith('lost_pet');

    await db.entities.AdoptionPet.list();
    expect(estado.cliente.from).toHaveBeenCalledWith('adoption_pet');
  });
});

describe('create', () => {
  it('descarta la columna de autoría para que la ponga el servidor', async () => {
    estado.resultado = { data: { id: 'x' }, error: null };
    await db.entities.LostPet.create({ pet_name: 'Max', created_by_id: 'usuario-ajeno' });

    expect(estado.ultima.payload).toEqual({ pet_name: 'Max' });
    expect(estado.ultima.payload.created_by_id).toBeUndefined();
  });

  it('usa el nombre de columna propio de cada tabla', async () => {
    estado.resultado = { data: { id: 'x' }, error: null };
    await db.entities.Veterinary.create({ name: 'Vet', registered_by_user_id: 'ajeno' });
    expect(estado.ultima.payload.registered_by_user_id).toBeUndefined();
  });

  it('respeta sender_id, porque el chat admite invitados sin sesión', async () => {
    estado.resultado = { data: { id: 'x' }, error: null };
    await db.entities.ChatMessage.create({ text: 'hola', sender_id: 'guest_Ana_123' });
    expect(estado.ultima.payload.sender_id).toBe('guest_Ana_123');
  });

  it('descarta los campos que administra la base', async () => {
    estado.resultado = { data: { id: 'x' }, error: null };
    await db.entities.Pet.create({ name: 'Luna', id: 'falso', created_at: '2020-01-01' });
    expect(estado.ultima.payload).toEqual({ name: 'Luna' });
  });
});

describe('update', () => {
  it('convierte "cero filas" en un error entendible', async () => {
    // Es lo que devuelve PostgREST cuando una política de seguridad bloquea la
    // operación. Con .single() esto era un PGRST116 sin traducción posible.
    estado.resultado = { data: [], error: null };
    await expect(db.entities.LostPet.update('id-1', { status: 'encontrada' })).rejects.toThrow(
      SinPermisoError
    );
  });

  it('devuelve la fila cuando sí se pudo modificar', async () => {
    estado.resultado = { data: [{ id: 'id-1', status: 'encontrada' }], error: null };
    const fila = await db.entities.LostPet.update('id-1', { status: 'encontrada' });
    expect(fila.status).toBe('encontrada');
  });

  it('no reenvía la columna de autoría', async () => {
    estado.resultado = { data: [{ id: 'id-1' }], error: null };
    await db.entities.LostPet.update('id-1', { status: 'encontrada', created_by_id: 'ajeno' });
    expect(estado.ultima.payload.created_by_id).toBeUndefined();
  });
});

describe('delete', () => {
  it('borrar algo que ya no existe devuelve null en vez de explotar', async () => {
    estado.resultado = { data: [], error: null };
    await expect(db.entities.LostPet.delete('inexistente')).resolves.toBeNull();
  });

  it('devuelve la fila borrada', async () => {
    estado.resultado = { data: [{ id: 'id-1' }], error: null };
    await expect(db.entities.LostPet.delete('id-1')).resolves.toEqual({ id: 'id-1' });
  });
});

describe('get', () => {
  it('devuelve null si no existe, sin tirar', async () => {
    estado.resultado = { data: null, error: null };
    await expect(db.entities.LostPet.get('inexistente')).resolves.toBeNull();
  });
});

describe('filter', () => {
  it('no acepta condiciones vacías', async () => {
    // Sin esta guarda, filter({}) traía la tabla entera pareciendo una búsqueda.
    await expect(db.entities.LostPet.filter({})).rejects.toThrow(ErrorDeDatos);
  });

  it('aplica cada condición', async () => {
    estado.resultado = { data: [], error: null };
    await db.entities.LostPet.filter({ status: 'perdida' });
    expect(estado.ultima.eq).toHaveBeenCalledWith('status', 'perdida');
  });
});

describe('errores', () => {
  it('traduce 42501 a falta de permiso', async () => {
    estado.resultado = { data: null, error: { code: '42501', message: 'permission denied' } };
    await expect(db.entities.LostPet.list()).rejects.toThrow(SinPermisoError);
  });

  it('conserva el error original para poder diagnosticarlo', async () => {
    estado.resultado = { data: null, error: { code: '42703', message: 'column does not exist' } };
    try {
      await db.entities.LostPet.list();
      throw new Error('tendría que haber fallado');
    } catch (e) {
      expect(e).toBeInstanceOf(ErrorDeDatos);
      expect(e.tabla).toBe('lost_pet');
      expect(e.operacion).toBe('list');
      expect(e.codigo).toBe('42703');
    }
  });
});

describe('subscribe', () => {
  it('con el tiempo real apagado no abre ningún canal', () => {
    const cancelar = db.entities.AppNotification.subscribe(() => {});
    expect(estado.cliente.channel).not.toHaveBeenCalled();
    expect(() => cancelar()).not.toThrow();
  });

  it('traduce los eventos de Supabase al formato que esperan los componentes', async () => {
    vi.stubEnv('VITE_HABILITAR_TIEMPO_REAL', 'true');
    vi.resetModules();
    const { db: dbConTiempoReal } = await import('@/api/supabaseClient');

    let manejador;
    const canal = {
      on: vi.fn((_evento, _filtro, cb) => {
        manejador = cb;
        return canal;
      }),
      subscribe: vi.fn(() => canal),
    };
    estado.cliente.channel = vi.fn(() => canal);

    const recibidos = [];
    const cancelar = dbConTiempoReal.entities.AppNotification.subscribe((e) => recibidos.push(e));

    // Supabase entrega { eventType, new, old }; el código lee { type, data, id }.
    // Sin traducir, la condición `event.type === "create"` nunca daba verdadera
    // y todas las suscripciones eran inertes.
    manejador({ eventType: 'INSERT', new: { id: 1, titulo: 'hola' }, table: 'app_notification' });
    manejador({ eventType: 'UPDATE', new: { id: 2 }, table: 'app_notification' });
    manejador({ eventType: 'DELETE', old: { id: 3 }, table: 'app_notification' });

    expect(recibidos).toEqual([
      { type: 'create', data: { id: 1, titulo: 'hola' }, id: 1, tabla: 'app_notification' },
      { type: 'update', data: { id: 2 }, id: 2, tabla: 'app_notification' },
      { type: 'delete', data: { id: 3 }, id: 3, tabla: 'app_notification' },
    ]);

    cancelar();
    expect(estado.cliente.removeChannel).toHaveBeenCalledWith(canal);
  });
});

describe('db.storage.subirArchivo', () => {
  const archivo = (nombre, tipo, tamanio) => ({ name: nombre, type: tipo, size: tamanio });

  beforeEach(() => {
    estado.cliente.storage.from = vi.fn(() => ({
      upload: vi.fn(async () => ({ error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://ejemplo/foto.jpg' } })),
    }));
  });

  it('sube una imagen válida y devuelve la URL', async () => {
    const res = await db.storage.subirArchivo(archivo('foto.jpg', 'image/jpeg', 1000));
    expect(res.file_url).toBe('https://ejemplo/foto.jpg');
  });

  it('guarda dentro de una carpeta por usuario, para que la política de borrado aplique', async () => {
    const bucket = estado.cliente.storage.from();
    estado.cliente.storage.from = vi.fn(() => bucket);
    await db.storage.subirArchivo(archivo('foto.jpg', 'image/jpeg', 1000));
    expect(bucket.upload.mock.calls[0][0]).toMatch(/^usuario-1\//);
  });

  it('rechaza un tipo de archivo que no corresponde', async () => {
    await expect(
      db.storage.subirArchivo(archivo('documento.pdf', 'application/pdf', 1000))
    ).rejects.toThrow(ErrorDeArchivo);
  });

  it('rechaza un archivo demasiado grande antes de tocar la red', async () => {
    await expect(
      db.storage.subirArchivo(archivo('foto.jpg', 'image/jpeg', 20 * 1024 * 1024))
    ).rejects.toThrow(/pesa demasiado/);
  });

  it('acepta video cuando quien llama lo habilita', async () => {
    await expect(
      db.storage.subirArchivo(archivo('video.mp4', 'video/mp4', 1000), {
        tiposPermitidos: ['image/', 'video/'],
        tamanioMaximoMb: 25,
      })
    ).resolves.toBeTruthy();
  });

  it('rechaza lo que no sea un archivo', async () => {
    // Las cinco pantallas pasaban { file }, y la versión anterior hacía
    // file.name.split('.') sobre undefined: TODA subida de foto explotaba.
    await expect(db.storage.subirArchivo({ file: archivo('a.jpg', 'image/jpeg', 10) })).rejects.toThrow(
      ErrorDeArchivo
    );
    await expect(db.storage.subirArchivo(null)).rejects.toThrow(ErrorDeArchivo);
  });

  it('pide sesión iniciada', async () => {
    estado.cliente.auth.getUser = vi.fn(async () => ({ data: { user: null } }));
    await expect(db.storage.subirArchivo(archivo('foto.jpg', 'image/jpeg', 1000))).rejects.toThrow(
      /iniciar sesión/
    );
  });
});
