import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

/**
 * El defecto que cubren estos tests: el escucha de sesión armaba el usuario con
 * `{ ...session.user.user_metadata }`, que NO contiene tipo_cuenta, es_admin ni
 * profile_completed, y pisaba lo que ya se había cargado bien desde la tabla
 * profiles. Según quién ganara la carrera, a una persona ya registrada le
 * reaparecía el onboarding y perdía el acceso al panel de administración.
 */

const { meMock, onAuthStateChangeMock, estado } = vi.hoisted(() => {
  const estado = { manejador: null, desuscribir: vi.fn() };
  return {
    meMock: vi.fn(),
    onAuthStateChangeMock: vi.fn((cb) => {
      estado.manejador = cb;
      return { data: { subscription: { unsubscribe: estado.desuscribir } } };
    }),
    estado,
  };
});

vi.mock('@/api/supabaseClient', () => ({
  db: { auth: { me: meMock, logout: vi.fn(), redirectToLogin: vi.fn() } },
  supabase: { auth: { onAuthStateChange: onAuthStateChangeMock } },
}));

const { AuthProvider, useAuth } = await import('@/lib/AuthContext');

const PERFIL_COMPLETO = {
  id: 'u1',
  email: 'ana@ejemplo.com',
  tipo_cuenta: 'usuario',
  es_admin: true,
  profile_completed: true,
};

function Sonda() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <span>cargando</span>;
  return (
    <div>
      <span data-testid="autenticada">{String(isAuthenticated)}</span>
      <span data-testid="admin">{String(user?.es_admin)}</span>
      <span data-testid="perfil-completo">{String(user?.profile_completed)}</span>
    </div>
  );
}

const sesionFalsa = { user: { id: 'u1', email: 'ana@ejemplo.com', user_metadata: { full_name: 'Ana' } } };

beforeEach(() => {
  vi.clearAllMocks();
  estado.manejador = null;
  meMock.mockResolvedValue(PERFIL_COMPLETO);
});

describe('AuthProvider', () => {
  it('carga el perfil desde la tabla profiles', async () => {
    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('admin')).toHaveTextContent('true'));
    expect(screen.getByTestId('perfil-completo')).toHaveTextContent('true');
    expect(screen.getByTestId('autenticada')).toHaveTextContent('true');
  });

  it('un SIGNED_IN no pisa es_admin ni profile_completed con user_metadata', async () => {
    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('admin')).toHaveTextContent('true'));

    await act(async () => {
      estado.manejador('SIGNED_IN', sesionFalsa);
      // El escucha difiere la carga con setTimeout para no bloquear la sesión.
      await new Promise((r) => setTimeout(r, 0));
    });

    // Este es el caso exacto que rompía: user_metadata solo trae full_name.
    await waitFor(() => {
      expect(screen.getByTestId('admin')).toHaveTextContent('true');
      expect(screen.getByTestId('perfil-completo')).toHaveTextContent('true');
    });
  });

  it('ignora TOKEN_REFRESHED para no recargar el perfil de más', async () => {
    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('admin')).toHaveTextContent('true'));
    const llamadasIniciales = meMock.mock.calls.length;

    await act(async () => {
      estado.manejador('TOKEN_REFRESHED', sesionFalsa);
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(meMock.mock.calls.length).toBe(llamadasIniciales);
  });

  it('al cerrar sesión limpia el usuario', async () => {
    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('autenticada')).toHaveTextContent('true'));

    await act(async () => {
      estado.manejador('SIGNED_OUT', null);
    });

    await waitFor(() => expect(screen.getByTestId('autenticada')).toHaveTextContent('false'));
  });

  it('una carga vieja no pisa a una nueva', async () => {
    // Dos recargas encimadas: la primera tarda y devuelve datos viejos, la
    // segunda responde enseguida con los nuevos. Sin el contador de generación,
    // la respuesta vieja llegaba última y ganaba.
    let resolverVieja;
    meMock.mockImplementationOnce(
      () => new Promise((resolve) => { resolverVieja = () => resolve({ ...PERFIL_COMPLETO, es_admin: false }); })
    );
    meMock.mockResolvedValue(PERFIL_COMPLETO);

    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>
    );

    await act(async () => {
      estado.manejador('SIGNED_IN', sesionFalsa);
      await new Promise((r) => setTimeout(r, 0));
    });
    await waitFor(() => expect(screen.getByTestId('admin')).toHaveTextContent('true'));

    await act(async () => {
      resolverVieja();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(screen.getByTestId('admin')).toHaveTextContent('true');
  });

  it('si falla la carga no deja la app colgada cargando', async () => {
    meMock.mockRejectedValue(new Error('sin red'));
    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('autenticada')).toHaveTextContent('false'));
  });
});
