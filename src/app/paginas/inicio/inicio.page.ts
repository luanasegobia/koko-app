import { Component, computed, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonFooter, IonIcon } from '@ionic/angular';
import { CabeceraComponent } from '../../compartido/cabecera/cabecera.component';
import { CasoUrgente, Mascota, MascotaPerdida, Veterinaria } from '../../core/modelos';
import { HaceTiempoPipe } from '../../core/pipes/fecha.pipe';
import { AuthService } from '../../core/servicios/auth.service';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { estadoDeVeterinaria } from '../veterinarias/estado-veterinaria';
import { AvatarMascotaComponent } from './avatar-mascota.component';
import { consejosDelMes } from './consejos';

interface Modulo {
  ruta: string;
  icono: string;
  titulo: string;
}

const MODULOS: Modulo[] = [
  { ruta: '/adopcion', icono: 'heart-outline', titulo: 'Adopción' },
  { ruta: '/veterinarias', icono: 'medkit-outline', titulo: 'Veterinario' },
  { ruta: '/identificacion', icono: 'qr-code-outline', titulo: 'ID' },
  { ruta: '/perdidas', icono: 'search-outline', titulo: 'Mascotas perdidas' },
  { ruta: '/casos-urgentes', icono: 'warning-outline', titulo: 'Casos urgentes' },
  { ruta: '/denuncias', icono: 'shield-half-outline', titulo: 'Denuncias' },
];

const SEGUNDOS_ENTRE_CONSEJOS = 7;
const PAUSA_TRAS_TOCAR_MS = 9000;

/** Portada de la app: accesos a los módulos y un resumen de lo que está pasando. */
@Component({
  selector: 'app-inicio',
  imports: [
    RouterLink,
    IonContent,
    IonFooter,
    IonIcon,
    CabeceraComponent,
    AvatarMascotaComponent,
    HaceTiempoPipe,
  ],
  templateUrl: './inicio.page.html',
  styleUrl: './inicio.page.scss',
})
export class InicioPage implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);

  protected readonly modulos = MODULOS;
  protected readonly consejos = consejosDelMes(new Date().getMonth() + 1);
  protected readonly consejoActual = signal(0);

  protected readonly misMascotas = signal<Mascota[]>([]);
  private readonly perdidas = signal<MascotaPerdida[]>([]);
  private readonly casosUrgentes = signal<CasoUrgente[]>([]);
  private readonly veterinarias = signal<Veterinaria[]>([]);

  protected readonly nombre = computed(() => this.auth.usuario()?.full_name?.trim().split(' ')[0] ?? '');

  /** Las publicaciones más nuevas, sin importar el estado: la etiqueta dice si ya apareció. */
  protected readonly perdidasRecientes = computed(() => this.perdidas().slice(0, 8));
  protected readonly reencuentros = computed(() =>
    this.perdidas()
      .filter((mascota) => mascota.status === 'encontrada')
      .slice(0, 3),
  );
  private readonly cantidadPerdidas = computed(
    () => this.perdidas().filter((mascota) => mascota.status === 'perdida').length,
  );
  private readonly cantidadCasosActivos = computed(
    () => this.casosUrgentes().filter((caso) => caso.status === 'activo').length,
  );

  /** Las verificadas que atienden ahora mismo, con las de emergencia primero. */
  protected readonly veterinariasDeGuardia = computed(() =>
    this.veterinarias()
      .filter((veterinaria) => veterinaria.is_verified)
      .map((veterinaria) => ({ veterinaria, estado: estadoDeVeterinaria(veterinaria) }))
      .filter(({ estado }) => estado.abierta)
      .sort((a, b) => Number(b.veterinaria.is_emergency ?? false) - Number(a.veterinaria.is_emergency ?? false))
      .slice(0, 3),
  );

  private readonly pista = viewChild<ElementRef<HTMLDivElement>>('pista');
  private ultimoToque = 0;
  private temporizador: ReturnType<typeof setInterval> | null = null;

  ionViewWillEnter(): void {
    void this.cargar();
    this.iniciarRotacion();
  }

  ionViewWillLeave(): void {
    this.detenerRotacion();
  }

  ngOnDestroy(): void {
    this.detenerRotacion();
  }

  /**
   * Cada bloque se carga por separado: la portada es un resumen, así que si una
   * consulta falla esa sección queda vacía y el resto se muestra igual.
   */
  private async cargar(): Promise<void> {
    const idDeUsuario = this.auth.usuario()?.id;
    const [mascotas, perdidas, casos, veterinarias] = await Promise.allSettled([
      idDeUsuario ? this.supabase.mascotas.filtrar({ created_by_id: idDeUsuario }, '-created_at', 12) : [],
      this.supabase.mascotasPerdidas.listar('-created_at', 100),
      this.supabase.casosUrgentes.listar('-created_at', 100),
      this.supabase.veterinarias.listar(),
    ]);
    if (mascotas.status === 'fulfilled') this.misMascotas.set(mascotas.value);
    if (perdidas.status === 'fulfilled') this.perdidas.set(perdidas.value);
    if (casos.status === 'fulfilled') this.casosUrgentes.set(casos.value);
    if (veterinarias.status === 'fulfilled') this.veterinarias.set(veterinarias.value);

    for (const resultado of [mascotas, perdidas, casos, veterinarias]) {
      if (resultado.status === 'rejected') console.error('No se pudo cargar parte del inicio:', resultado.reason);
    }
  }

  /** El número que acompaña a un módulo, si hay algo para contar. */
  protected insignia(ruta: string): { texto: string; urgente: boolean } | null {
    if (ruta === '/perdidas' && this.cantidadPerdidas() > 0) {
      return { texto: `${this.cantidadPerdidas()} sin aparecer`, urgente: false };
    }
    if (ruta === '/casos-urgentes' && this.cantidadCasosActivos() > 0) {
      const cantidad = this.cantidadCasosActivos();
      return { texto: cantidad === 1 ? '1 activo' : `${cantidad} activos`, urgente: true };
    }
    return null;
  }

  protected detalleDeGuardia(estado: { etiqueta: string; horario?: string }): string {
    return estado.horario ? `${estado.etiqueta} · ${estado.horario}` : estado.etiqueta;
  }

  protected especieEnPalabras(mascota: MascotaPerdida): string {
    const especie = { perro: 'Perro', gato: 'Gato', otro: 'Mascota' }[mascota.species] ?? 'Mascota';
    return mascota.last_seen_address ? `${especie} · ${mascota.last_seen_address}` : especie;
  }

  // ─── Carrusel de consejos ────────────────────────────────────────────────
  protected irAlConsejo(indice: number, porLaPersona = true): void {
    const pista = this.pista()?.nativeElement;
    if (!pista) return;
    if (porLaPersona) this.ultimoToque = Date.now();
    pista.scrollTo({ left: indice * pista.clientWidth, behavior: 'smooth' });
  }

  protected alDesplazar(): void {
    const pista = this.pista()?.nativeElement;
    if (!pista || pista.clientWidth === 0) return;
    this.consejoActual.set(Math.round(pista.scrollLeft / pista.clientWidth));
  }

  protected anotarToque(): void {
    this.ultimoToque = Date.now();
  }

  private iniciarRotacion(): void {
    this.detenerRotacion();
    // Con "reducir movimiento" los consejos no pasan solos.
    if (this.consejos.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    this.temporizador = setInterval(() => {
      // Si la persona tocó el carrusel hace poco, no se le mueve mientras lee.
      if (Date.now() - this.ultimoToque < PAUSA_TRAS_TOCAR_MS) return;
      this.irAlConsejo((this.consejoActual() + 1) % this.consejos.length, false);
    }, SEGUNDOS_ENTRE_CONSEJOS * 1000);
  }

  private detenerRotacion(): void {
    if (this.temporizador) clearInterval(this.temporizador);
    this.temporizador = null;
  }
}
