import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

/**
 * El defecto que cubren estos tests: si la sesión se armara con
 * `session.user.user_metadata` (que NO contiene tipo_cuenta, es_admin ni
 * profile_completed), a una persona ya registrada le reaparecería el
 * onboarding y perdería el acceso al panel de administración.
 */
type ManejadorDeSesion = (evento: string, sesion: unknown) => void;

function supabaseFalso(opciones: { usuario: unknown; perfil: unknown; demoraDePerfilMs?: number }) {
  const estado = { manejador: null as ManejadorDeSesion | null, demora: opciones.demoraDePerfilMs ?? 0 };
  const consulta = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(
      () =>
        new Promise((resolver) =>
          setTimeout(() => resolver({ data: opciones.perfil, error: null }), estado.demora),
        ),
    ),
  };
  const cliente = {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: opciones.usuario } })),
      onAuthStateChange: vi.fn((callback: ManejadorDeSesion) => {
        estado.manejador = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    },
    from: vi.fn(() => consulta),
  };
  return { cliente, estado, consulta };
}

const USUARIO = {
  id: 'u1',
  email: 'ana@ejemplo.com',
  // Metadatos editables por la propia persona: NO deben decidir permisos.
  user_metadata: { full_name: 'Ana', es_admin: true, tipo_cuenta: 'veterinario' },
};

function crearServicio(falso: ReturnType<typeof supabaseFalso>): AuthService {
  TestBed.configureTestingModule({
    providers: [{ provide: SupabaseService, useValue: { cliente: falso.cliente } }],
  });
  return TestBed.inject(AuthService);
}

describe('AuthService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('lee tipo_cuenta, es_admin y profile_completed de la tabla profiles, no de los metadatos', async () => {
    const falso = supabaseFalso({
      usuario: USUARIO,
      perfil: { tipo_cuenta: 'usuario', es_admin: false, profile_completed: true, full_name: 'Ana Gómez' },
    });
    const auth = crearServicio(falso);

    expect(auth.cargando()).toBe(true);
    await auth.listo();

    expect(auth.cargando()).toBe(false);
    expect(auth.autenticado()).toBe(true);
    expect(auth.usuario()).toMatchObject({
      id: 'u1',
      email: 'ana@ejemplo.com',
      full_name: 'Ana Gómez',
      tipo_cuenta: 'usuario',
      es_admin: false,
      profile_completed: true,
    });
    expect(auth.esAdmin()).toBe(false);
  });

  it('sin sesión deja el usuario en null y termina de cargar', async () => {
    const auth = crearServicio(supabaseFalso({ usuario: null, perfil: null }));
    await auth.listo();
    expect(auth.usuario()).toBeNull();
    expect(auth.autenticado()).toBe(false);
    expect(auth.cargando()).toBe(false);
  });

  it('al cerrar sesión desde otro lado, el escucha limpia el usuario', async () => {
    const falso = supabaseFalso({
      usuario: USUARIO,
      perfil: { tipo_cuenta: 'usuario', es_admin: true, profile_completed: true },
    });
    const auth = crearServicio(falso);
    await auth.listo();
    expect(auth.esAdmin()).toBe(true);

    falso.estado.manejador!('SIGNED_OUT', null);
    expect(auth.usuario()).toBeNull();
  });

  it('una carga vieja no pisa a una más nueva', async () => {
    const falso = supabaseFalso({
      usuario: USUARIO,
      perfil: { tipo_cuenta: 'usuario', es_admin: true, profile_completed: true },
      demoraDePerfilMs: 30,
    });
    const auth = crearServicio(falso);

    // Antes de que termine la carga inicial, llega un cierre de sesión.
    falso.estado.manejador!('SIGNED_OUT', null);
    await auth.listo();
    await new Promise((resolver) => setTimeout(resolver, 60));

    // La carga inicial (más vieja) terminó después, pero no puede revivir la sesión.
    expect(auth.usuario()).toBeNull();
  });
});
