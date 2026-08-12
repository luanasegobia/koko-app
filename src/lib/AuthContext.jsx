import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { db, supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Contador de generación: si llegan dos recargas encimadas (por ejemplo, la
  // inicial y un SIGNED_IN), la más vieja no puede pisar a la más nueva.
  const generacion = useRef(0);

  /**
   * El perfil SIEMPRE se lee de la tabla profiles.
   *
   * Antes, el escucha de sesión armaba el usuario con
   * `{ ...session.user.user_metadata }`, que no contiene tipo_cuenta, es_admin
   * ni profile_completed, y pisaba lo que ya se había cargado bien. Según qué
   * ganara la carrera, a una persona ya registrada le reaparecía el onboarding
   * y perdía el acceso al panel de administración.
   */
  const cargarPerfil = useCallback(async () => {
    const miGeneracion = ++generacion.current;
    try {
      const perfil = await db.auth.me();
      if (miGeneracion !== generacion.current) return null;

      setUser(perfil);
      setIsAuthenticated(Boolean(perfil));
      return perfil;
    } catch (error) {
      if (miGeneracion !== generacion.current) return null;
      console.error('No se pudo cargar la sesión:', error);
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      if (miGeneracion === generacion.current) {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    }
  }, []);

  useEffect(() => {
    cargarPerfil();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento, session) => {
      // Nunca `async` acá dentro: llamar a otro método del cliente dentro de
      // este callback bloquea la sesión en supabase-js v2. Por eso se difiere.
      if (evento === 'TOKEN_REFRESHED') return;

      if (!session) {
        generacion.current++;
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        return;
      }

      setTimeout(cargarPerfil, 0);
    });

    return () => subscription.unsubscribe();
  }, [cargarPerfil]);

  const logout = async (shouldRedirect = true) => {
    await db.auth.logout(shouldRedirect ? window.location.href : null);
  };

  const navigateToLogin = () => {
    db.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth: cargarPerfil,
        reloadUser: cargarPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
