import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { alertasHabilitadas } from '../../../environments/entorno';
import { Notificacion, Perfil, SuscripcionAlertas } from '../modelos';
import { distanciaEnKm } from '../utilidades';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

const INTERVALO_SONDEO_MS = 30000;

/**
 * Notificaciones y suscripción a alertas de la persona con sesión.
 *
 * Es un único servicio para toda la app: la campana se muestra en cada página
 * y todas leen el mismo estado, así que no puede haber dos sondeos ni dos
 * cuentas distintas de no leídas.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  readonly notificaciones = signal<Notificacion[]>([]);
  readonly suscripcion = signal<SuscripcionAlertas | null>(null);
  readonly noLeidas = computed(() => this.notificaciones().filter((n) => !n.read).length);

  private readonly idsVistos = new Set<string>();
  private primeraCarga = true;
  private desuscribirTiempoReal: (() => void) | null = null;
  private temporizadorDeSondeo: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const usuario = this.auth.usuario();
      untracked(() => this.alCambiarUsuario(usuario));
    });

    effect(() => {
      const suscripcion = this.suscripcion();
      const usuario = this.auth.usuario();
      untracked(() => this.reiniciarSondeo(usuario, suscripcion));
    });
  }

  async recargar(): Promise<void> {
    const usuario = this.auth.usuario();
    if (!usuario) return;
    try {
      const [suscripciones, notificaciones] = await Promise.all([
        this.supabase.suscripcionesDeAlertas.filtrar({ user_id: usuario.id }),
        this.supabase.notificaciones.filtrar({ user_id: usuario.id }, '-created_at', 50),
      ]);
      this.suscripcion.set(suscripciones[0] || null);
      this.notificaciones.set(notificaciones);

      // En la primera carga se marcan como vistas, para no anunciar como
      // nuevas notificaciones que ya estaban.
      if (this.primeraCarga) {
        notificaciones.forEach((n) => this.idsVistos.add(n.id));
        this.primeraCarga = false;
      }
    } catch (error) {
      // La campana es accesoria: si falla, no puede tumbar la pantalla que la contiene.
      console.error('No se pudieron cargar las notificaciones:', error);
    }
  }

  async marcarTodasLeidas(): Promise<void> {
    const sinLeer = this.notificaciones().filter((n) => !n.read);
    await Promise.all(
      sinLeer.map((n) => this.supabase.notificaciones.actualizar(n.id, { read: true })),
    );
    this.notificaciones.update((lista) => lista.map((n) => ({ ...n, read: true })));
  }

  async marcarLeida(id: string): Promise<void> {
    await this.supabase.notificaciones.actualizar(id, { read: true });
    this.notificaciones.update((lista) => lista.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async guardarSuscripcion(datos: Partial<SuscripcionAlertas>): Promise<void> {
    const usuario = this.auth.usuario();
    if (!usuario) return;
    const cuerpo = { ...datos, user_id: usuario.id, user_email: usuario.email };
    const actual = this.suscripcion();
    if (actual) {
      await this.supabase.suscripcionesDeAlertas.actualizar(actual.id, cuerpo);
      this.suscripcion.set({ ...actual, ...cuerpo });
    } else {
      const creada = await this.supabase.suscripcionesDeAlertas.crear(cuerpo);
      this.suscripcion.set(creada);
    }
  }

  async eliminarSuscripcion(): Promise<void> {
    const actual = this.suscripcion();
    if (!actual) return;
    await this.supabase.suscripcionesDeAlertas.eliminar(actual.id);
    this.suscripcion.set(null);
  }

  private alCambiarUsuario(usuario: Perfil | null): void {
    this.desuscribirTiempoReal?.();
    this.desuscribirTiempoReal = null;

    if (!usuario) {
      this.notificaciones.set([]);
      this.suscripcion.set(null);
      return;
    }

    void this.recargar();

    this.desuscribirTiempoReal = this.supabase.notificaciones.suscribir((evento) => {
      const datos = evento.datos;
      if (!datos || datos.user_id !== usuario.id) return;

      if (evento.tipo === 'create') {
        if (this.idsVistos.has(datos.id)) return;
        this.idsVistos.add(datos.id);
        this.notificaciones.update((lista) => [datos, ...lista]);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(datos.title, { body: datos.body, icon: '/icon-192.png' });
        }
      } else if (evento.tipo === 'update') {
        this.notificaciones.update((lista) =>
          lista.map((n) => (n.id === datos.id ? { ...n, ...datos } : n)),
        );
      }
    });
  }

  /**
   * Sondeo de mascotas perdidas y casos urgentes para generar alertas por
   * cercanía. Apagado por defecto: escribe notificaciones en la base cada 30
   * segundos por cada pestaña abierta.
   */
  private reiniciarSondeo(usuario: Perfil | null, suscripcion: SuscripcionAlertas | null): void {
    if (this.temporizadorDeSondeo) {
      clearInterval(this.temporizadorDeSondeo);
      this.temporizadorDeSondeo = null;
    }
    if (!usuario || !suscripcion || !alertasHabilitadas()) return;

    this.temporizadorDeSondeo = setInterval(() => {
      // La revisión es asíncrona y setInterval no espera su promesa: sin este
      // envoltorio cualquier rechazo quedaría sin atrapar.
      this.revisarNovedades(usuario, suscripcion).catch((error) =>
        console.error('Falló la revisión de alertas:', error),
      );
    }, INTERVALO_SONDEO_MS);
  }

  private async revisarNovedades(usuario: Perfil, suscripcion: SuscripcionAlertas): Promise<void> {
    const limite = new Date(Date.now() - INTERVALO_SONDEO_MS * 1.5);

    if (suscripcion.notify_lost_pets && suscripcion.lat && suscripcion.lng) {
      const recientes = await this.supabase.mascotasPerdidas.listar('-created_at', 20);
      for (const mascota of recientes) {
        if (!mascota.created_at || new Date(mascota.created_at) < limite) continue;
        const clave = `lp-${mascota.id}`;
        if (this.idsVistos.has(clave)) continue;
        this.idsVistos.add(clave);

        let distancia: number | undefined;
        if (mascota.last_seen_lat && mascota.last_seen_lng) {
          distancia = distanciaEnKm(
            [suscripcion.lat, suscripcion.lng],
            [mascota.last_seen_lat, mascota.last_seen_lng],
          );
          if (distancia > (suscripcion.radius_km ?? 5)) continue;
        }

        const textoDistancia = distancia !== undefined ? ` (a ${distancia.toFixed(1)} km)` : '';
        await this.supabase.notificaciones.crear({
          user_id: usuario.id,
          type: 'lost_pet',
          title: `🐾 Mascota perdida cerca${textoDistancia}`,
          body: `${mascota.pet_name} (${mascota.species}) fue reportado/a en ${mascota.last_seen_address || 'tu zona'}.`,
          ref_id: mascota.id,
          read: false,
          distance_km: distancia !== undefined ? Number(distancia.toFixed(1)) : undefined,
        });
      }
    }

    if (suscripcion.notify_urgent_cases) {
      const recientes = await this.supabase.casosUrgentes.listar('-updated_at', 10);
      for (const caso of recientes) {
        if (!caso.updated_at || new Date(caso.updated_at) < limite) continue;
        const clave = `uc-${caso.id}-${caso.updated_at}`;
        if (this.idsVistos.has(clave)) continue;
        this.idsVistos.add(clave);

        const estado =
          caso.status === 'resuelto' ? 'Resuelto ✅' : caso.status === 'en_curso' ? 'En curso' : 'Activo';
        await this.supabase.notificaciones.crear({
          user_id: usuario.id,
          type: 'urgent_case',
          title: `🆘 Actualización: ${caso.title}`,
          body: `El caso urgente fue actualizado. Estado: ${estado}.`,
          ref_id: caso.id,
          read: false,
        });
      }
    }
  }
}
