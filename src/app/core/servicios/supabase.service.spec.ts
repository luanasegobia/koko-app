import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorDeArchivo, SinPermisoError } from '../errores';
import {
  BANDERA_TIEMPO_REAL,
  FABRICA_DE_CLIENTE,
  LECTOR_DE_CONFIGURACION,
  SupabaseService,
} from './supabase.service';

/**
 * Cubre los defectos que la migración desde Base44 dejó en la capa de datos,
 * para que no vuelvan:
 *   - la columna de autoría la escribía (o no) el cliente,
 *   - actualizar() con cero filas tiraba un PGRST116 indescifrable,
 *   - eliminar() de algo inexistente explotaba,
 *   - subir una foto reventaba porque la firma no coincidía con las pantallas,
 *   - los eventos de tiempo real nunca se traducían.
 */
const estado = {
  resultado: { data: null as unknown, error: null as { code?: string; message?: string } | null },
  tiempoReal: false,
};

/** Consulta encadenable que registra los métodos usados y resuelve al resultado preparado. */
function consultaFalsa() {
  const consulta: Record<string, unknown> & { llamadas: string[]; payload: unknown } = {
    llamadas: [],
    payload: null,
  };
  for (const metodo of ['select', 'order', 'limit', 'eq', 'is', 'insert', 'update', 'delete']) {
    consulta[metodo] = vi.fn((...argumentos: unknown[]) => {
      consulta.llamadas.push(metodo);
      if (metodo === 'insert' || metodo === 'update') consulta.payload = argumentos[0];
      return consulta;
    });
  }
  consulta['single'] = vi.fn(() => Promise.resolve(estado.resultado));
  consulta['maybeSingle'] = vi.fn(() => Promise.resolve(estado.resultado));
  // Thenable: permite `await consulta` al final de la cadena.
  consulta['then'] = (alCumplir: (v: unknown) => unknown, alFallar?: (e: unknown) => unknown) =>
    Promise.resolve(estado.resultado).then(alCumplir, alFallar);
  return consulta;
}

function clienteFalso() {
  const consulta = consultaFalsa();
  const canal = { on: vi.fn(), subscribe: vi.fn() };
  canal.on.mockReturnValue(canal);
  canal.subscribe.mockReturnValue(canal);
  const subida = vi.fn(async () => ({ error: null }));
  return {
    consulta,
    canal,
    subida,
    from: vi.fn(() => consulta),
    channel: vi.fn(() => canal),
    removeChannel: vi.fn(),
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'usuario-1', email: 'ana@ejemplo.com' } } })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: subida,
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://cdn.ejemplo/foto.jpg' } })),
      })),
    },
  };
}

describe('SupabaseService', () => {
  let cliente: ReturnType<typeof clienteFalso>;
  let crearCliente: ReturnType<typeof vi.fn>;
  let servicio: SupabaseService;

  beforeEach(() => {
    cliente = clienteFalso();
    crearCliente = vi.fn(() => cliente);
    estado.resultado = { data: null, error: null };
    estado.tiempoReal = false;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: LECTOR_DE_CONFIGURACION,
          useValue: () => ({ url: 'https://ejemplo.supabase.co', anonKey: 'clave-anonima' }),
        },
        { provide: BANDERA_TIEMPO_REAL, useValue: () => estado.tiempoReal },
        { provide: FABRICA_DE_CLIENTE, useValue: crearCliente },
      ],
    });
    servicio = TestBed.inject(SupabaseService);
  });

  it('crea el cliente recién en el primer uso, y una sola vez', () => {
    expect(crearCliente).not.toHaveBeenCalled();
    void servicio.cliente;
    void servicio.cliente;
    expect(crearCliente).toHaveBeenCalledTimes(1);
    expect(crearCliente).toHaveBeenCalledWith('https://ejemplo.supabase.co', 'clave-anonima');
  });

  it('listar ordena por la columna pedida, descendente con el prefijo "-"', async () => {
    estado.resultado = { data: [{ id: '1' }], error: null };
    const filas = await servicio.mascotasPerdidas.listar('-created_at', 20);
    expect(cliente.from).toHaveBeenCalledWith('lost_pet');
    expect(cliente.consulta['order']).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(cliente.consulta['limit']).toHaveBeenCalledWith(20);
    expect(filas).toEqual([{ id: '1' }]);
  });

  it('crear nunca manda la autoría ni los campos de la base cuando los pone el servidor', async () => {
    estado.resultado = { data: { id: 'nuevo' }, error: null };
    await servicio.mascotasPerdidas.crear({
      id: 'inventado',
      pet_name: 'Max',
      species: 'perro',
      status: 'perdida',
      created_by_id: 'otra-persona',
      created_at: 'ayer',
    });
    expect(cliente.consulta.payload).toEqual({ pet_name: 'Max', species: 'perro', status: 'perdida' });
  });

  it('crear respeta la autoría elegida por la interfaz en el chat (admite invitados)', async () => {
    estado.resultado = { data: { id: 'm1' }, error: null };
    await servicio.mensajesDeChat.crear({
      conversation_id: 'c',
      context_type: 'lost_pet',
      sender_id: 'guest_ana_1',
      text: 'hola',
    });
    expect((cliente.consulta.payload as { sender_id: string }).sender_id).toBe('guest_ana_1');
  });

  it('actualizar sin filas afectadas avisa que no hay permiso, en vez de un PGRST116', async () => {
    estado.resultado = { data: [], error: null };
    await expect(servicio.casosUrgentes.actualizar('x', { status: 'resuelto' })).rejects.toBeInstanceOf(
      SinPermisoError,
    );
  });

  it('eliminar algo que ya no existe devuelve null sin fallar', async () => {
    estado.resultado = { data: [], error: null };
    await expect(servicio.mascotas.eliminar('x')).resolves.toBeNull();
  });

  it('traduce el código 42501 de PostgREST a SinPermisoError', async () => {
    estado.resultado = { data: null, error: { code: '42501', message: 'insufficient_privilege' } };
    await expect(servicio.denuncias.listar()).rejects.toBeInstanceOf(SinPermisoError);
  });

  it('subirArchivo rechaza lo que no es imagen y lo que pesa demasiado', async () => {
    const pdf = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    await expect(servicio.subirArchivo(pdf)).rejects.toBeInstanceOf(ErrorDeArchivo);

    const grande = new File([new Uint8Array(9 * 1024 * 1024)], 'foto.jpg', { type: 'image/jpeg' });
    await expect(servicio.subirArchivo(grande)).rejects.toThrow(/pesa demasiado/);
  });

  it('subirArchivo guarda en la carpeta de la persona y devuelve la URL pública', async () => {
    const foto = new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
    const resultado = await servicio.subirArchivo(foto);
    const [ruta] = cliente.subida.mock.calls[0] as unknown as [string];
    expect(ruta.startsWith('usuario-1/')).toBe(true);
    expect(ruta.endsWith('.jpg')).toBe(true);
    expect(resultado).toEqual({ file_url: 'https://cdn.ejemplo/foto.jpg' });
  });

  it('suscribir no abre ningún canal con el tiempo real apagado', () => {
    const desuscribir = servicio.notificaciones.suscribir(() => undefined);
    expect(cliente.channel).not.toHaveBeenCalled();
    desuscribir();
  });

  it('suscribir traduce los eventos de Supabase al formato de la app', () => {
    estado.tiempoReal = true;
    const recibido = vi.fn();
    const desuscribir = servicio.notificaciones.suscribir(recibido);

    const manejador = cliente.canal.on.mock.calls[0][2] as (payload: unknown) => void;
    manejador({ eventType: 'INSERT', new: { id: 'n1', title: 'Hola' }, old: {}, table: 'app_notification' });
    manejador({ eventType: 'DELETE', new: {}, old: { id: 'n1' }, table: 'app_notification' });

    expect(recibido).toHaveBeenNthCalledWith(1, {
      tipo: 'create',
      datos: { id: 'n1', title: 'Hola' },
      id: 'n1',
      tabla: 'app_notification',
    });
    expect(recibido).toHaveBeenNthCalledWith(2, expect.objectContaining({ tipo: 'delete', id: 'n1' }));

    desuscribir();
    expect(cliente.removeChannel).toHaveBeenCalledWith(cliente.canal);
  });
});
