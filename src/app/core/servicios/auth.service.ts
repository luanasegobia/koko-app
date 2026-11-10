import { computed, inject, Injectable, signal } from '@angular/core';
import { ErrorDeConfiguracion } from '../errores';
import { Perfil } from '../modelos';
import { SupabaseService } from './supabase.service';

const PERFIL_VISIBLE =
  'full_name, phone, avatar_url, tipo_cuenta, es_admin, profile_completed, bio, location, organization_name';

/**
 * Estado de sesión compartido por toda la app, expuesto como signals.
 *
 * El perfil SIEMPRE se lee de la tabla profiles: user_metadata lo puede editar
 * la propia persona usuaria, así que no sirve para decidir permisos
 * (tipo_cuenta, es_admin, profile_completed).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);

  readonly usuario = signal<Perfil | null>(null);
  readonly cargando = signal(true);
  readonly autenticado = computed(() => this.usuario() !== null);
  readonly esAdmin = computed(() => this.usuario()?.es_admin === true);

  // Contador de generación: si llegan dos recargas encimadas (por ejemplo, la
  // inicial y un SIGNED_IN), la más vieja no puede pisar a la más nueva.
  private generacion = 0;

  private resolverListo!: () => void;
  private readonly promesaListo = new Promise<void>((resolver) => {
    this.resolverListo = resolver;
  });

  constructor() {
    this.iniciar();
  }

  /** Se resuelve cuando terminó la primera carga de sesión. Lo esperan las guardias de ruta. */
  listo(): Promise<void> {
    return this.promesaListo;
  }

  /** Vuelve a leer el perfil desde la base (por ejemplo, después del onboarding). */
  async recargarUsuario(): Promise<Perfil | null> {
    return this.cargarPerfil();
  }

  async iniciarSesion(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.cliente.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async registrar({
    email,
    password,
    nombre,
  }: {
    email: string;
    password: string;
    nombre?: string;
  }): Promise<void> {
    const { error } = await this.supabase.cliente.auth.signUp({
      email,
      password,
      // handle_new_user copia full_name desde acá al crear el perfil. Sin
      // esto el nombre queda en NULL y el chat muestra "Usuario".
      options: nombre ? { data: { full_name: nombre } } : undefined,
    });
    if (error) throw error;
  }

  async verificarCodigo(email: string, codigo: string): Promise<void> {
    const { error } = await this.supabase.cliente.auth.verifyOtp({
      email,
      token: codigo,
      type: 'signup',
    });
    if (error) throw error;
  }

  async reenviarCodigo(email: string): Promise<void> {
    const { error } = await this.supabase.cliente.auth.resend({ type: 'signup', email });
    if (error) throw error;
  }

  async iniciarConProveedor(proveedor: 'google', destino?: string): Promise<void> {
    // Supabase exige una URL absoluta.
    const redirectTo = new URL(destino || '/', window.location.origin).href;
    const { error } = await this.supabase.cliente.auth.signInWithOAuth({
      provider: proveedor,
      options: { redirectTo },
    });
    if (error) throw error;
  }

  async pedirRestablecerContrasena(email: string): Promise<void> {
    const { error } = await this.supabase.cliente.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  /** Se llega acá con la sesión ya establecida por el enlace del correo. */
  async cambiarContrasena(nueva: string): Promise<void> {
    const { error } = await this.supabase.cliente.auth.updateUser({ password: nueva });
    if (error) throw error;
  }

  /** Escucha un evento puntual de la sesión (por ejemplo, PASSWORD_RECOVERY). Devuelve la función para desuscribirse. */
  alCambiarSesion(callback: (evento: string) => void): () => void {
    const {
      data: { subscription },
    } = this.supabase.cliente.auth.onAuthStateChange((evento) => callback(evento));
    return () => subscription.unsubscribe();
  }

  async actualizarPerfil(datos: Partial<Perfil>): Promise<Perfil> {
    const {
      data: { user },
    } = await this.supabase.cliente.auth.getUser();
    if (!user) throw new Error('No hay una sesión activa');

    // tipo_cuenta lo elige cada persona en el onboarding. es_admin no se
    // escribe nunca desde el cliente: lo bloquean los permisos por columna
    // y la política de la base de datos.
    const campos: Record<string, unknown> = { ...datos };
    delete campos['id'];
    delete campos['es_admin'];

    const { data: perfil, error } = await this.supabase.cliente
      .from('profiles')
      .upsert({ id: user.id, email: user.email, ...campos })
      .select(PERFIL_VISIBLE)
      .single();
    if (error) throw error;

    return { id: user.id, email: user.email, ...(perfil as Partial<Perfil>) } as Perfil;
  }

  /** Cierra la sesión y recarga la página para dejar todo el estado limpio. */
  async cerrarSesion(redirigirA: string | null = window.location.href): Promise<void> {
    await this.supabase.cliente.auth.signOut();
    if (redirigirA) window.location.href = redirigirA;
  }

  irAlLogin(volverA: string = window.location.href): void {
    window.location.href = `/login?redirect=${encodeURIComponent(volverA)}`;
  }

  private iniciar(): void {
    try {
      void this.cargarPerfil();

      this.supabase.cliente.auth.onAuthStateChange((evento, sesion) => {
        // Nunca `async` acá dentro: llamar a otro método del cliente dentro de
        // este callback bloquea la sesión en supabase-js v2. Por eso se difiere.
        if (evento === 'TOKEN_REFRESHED') return;

        if (!sesion) {
          this.generacion++;
          this.usuario.set(null);
          this.terminarCarga();
          return;
        }

        setTimeout(() => void this.cargarPerfil(), 0);
      });
    } catch (error) {
      // Sin .env.local el cliente no se puede crear. La pantalla de
      // configuración ya lo explica; acá solo se evita dejar la app colgada.
      if (!(error instanceof ErrorDeConfiguracion)) console.error(error);
      this.usuario.set(null);
      this.terminarCarga();
    }
  }

  private async cargarPerfil(): Promise<Perfil | null> {
    const miGeneracion = ++this.generacion;
    try {
      const perfil = await this.obtenerPerfil();
      if (miGeneracion !== this.generacion) return null;
      this.usuario.set(perfil);
      return perfil;
    } catch (error) {
      if (miGeneracion !== this.generacion) return null;
      console.error('No se pudo cargar la sesión:', error);
      this.usuario.set(null);
      return null;
    } finally {
      if (miGeneracion === this.generacion) this.terminarCarga();
    }
  }

  private async obtenerPerfil(): Promise<Perfil | null> {
    const {
      data: { user },
    } = await this.supabase.cliente.auth.getUser();
    if (!user) return null;

    const { data: perfil } = await this.supabase.cliente
      .from('profiles')
      .select(PERFIL_VISIBLE)
      .eq('id', user.id)
      .maybeSingle();

    const datosDePerfil = (perfil || {}) as Partial<Perfil>;
    return {
      id: user.id,
      email: user.email,
      ...(user.user_metadata as Partial<Perfil>),
      ...datosDePerfil,
      // Ambos se leen siempre de profiles: user_metadata no sirve para decidir permisos.
      tipo_cuenta: datosDePerfil.tipo_cuenta || 'usuario',
      es_admin: datosDePerfil.es_admin === true,
    };
  }

  private terminarCarga(): void {
    this.cargando.set(false);
    this.resolverListo();
  }
}
