import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonFooter, IonIcon } from '@ionic/angular';
import { CabeceraComponent } from '../../compartido/cabecera/cabecera.component';
import { CasoUrgente, MascotaPerdida } from '../../core/modelos';
import { HaceTiempoPipe } from '../../core/pipes/fecha.pipe';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { AvatarMascotaComponent } from './avatar-mascota.component';
import { Consejo, consejosDelMes } from './consejos';
import { GuiaConsejoComponent } from './guia-consejo.component';

interface Modulo {
  ruta: string;
  icono: string;
  titulo: string;
}

const MODULOS: Modulo[] = [
  { ruta: '/adopcion', icono: 'heart-outline', titulo: 'Adopción' },
  { ruta: '/veterinarias', icono: 'medkit-outline', titulo: 'Veterinario' },
  { ruta: '/identificacion', icono: 'id-card-outline', titulo: 'Mis mascotas' },
  { ruta: '/perdidas', icono: 'search-outline', titulo: 'Mascotas perdidas' },
  { ruta: '/casos-urgentes', icono: 'warning-outline', titulo: 'Casos urgentes' },
  { ruta: '/denuncias', icono: 'shield-half-outline', titulo: 'Denuncias' },
];

/** Portada de la app: accesos a los módulos, consejos de la época y las últimas mascotas perdidas. */
@Component({
  selector: 'app-inicio',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    IonContent,
    IonFooter,
    IonIcon,
    GuiaConsejoComponent,
    CabeceraComponent,
    AvatarMascotaComponent,
    HaceTiempoPipe,
  ],
  templateUrl: './inicio.page.html',
  styleUrl: './inicio.page.scss',
})
export class InicioPage {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  protected readonly modulos = MODULOS;
  protected readonly consejos = consejosDelMes(new Date().getMonth() + 1);
  protected readonly consejoActual = signal(0);
  /** El consejo cuya guía completa está abierta, si hay alguna. */
  protected readonly guiaAbierta = signal<Consejo | null>(null);

  private readonly perdidas = signal<MascotaPerdida[]>([]);
  private readonly casosUrgentes = signal<CasoUrgente[]>([]);

  /** Las publicaciones más nuevas, sin importar el estado: la etiqueta dice si ya apareció. */
  protected readonly perdidasRecientes = computed(() => this.perdidas().slice(0, 8));
  private readonly cantidadPerdidas = computed(
    () => this.perdidas().filter((mascota) => mascota.status === 'perdida').length,
  );
  private readonly cantidadCasosActivos = computed(
    () => this.casosUrgentes().filter((caso) => caso.status === 'activo').length,
  );

  private readonly pista = viewChild<ElementRef<HTMLDivElement>>('pista');

  ionViewWillEnter(): void {
    void this.cargar();
  }

  ionViewWillLeave(): void {
    this.cerrarGuia();
  }

  /**
   * Cada bloque se carga por separado: la portada es un resumen, así que si una
   * consulta falla esa sección queda vacía y el resto se muestra igual.
   */
  private async cargar(): Promise<void> {
    const [perdidas, casos] = await Promise.allSettled([
      this.supabase.mascotasPerdidas.listar('-created_at', 100),
      this.supabase.casosUrgentes.listar('-created_at', 100),
    ]);
    if (perdidas.status === 'fulfilled') this.perdidas.set(perdidas.value);
    if (casos.status === 'fulfilled') this.casosUrgentes.set(casos.value);

    for (const resultado of [perdidas, casos]) {
      if (resultado.status === 'rejected')
        console.error('No se pudo cargar parte del inicio:', resultado.reason);
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

  protected descripcion(mascota: MascotaPerdida): string {
    const especie = { perro: 'Perro', gato: 'Gato', otro: 'Mascota' }[mascota.species] ?? 'Mascota';
    return mascota.breed ? `${especie} · ${mascota.breed}` : especie;
  }

  /** "Barrio · hace 2 horas", o solo el tiempo si la publicación no dice dónde. */
  protected lugarYTiempo(mascota: MascotaPerdida, hace: string): string {
    return mascota.last_seen_address ? `${mascota.last_seen_address} · ${hace}` : hace;
  }

  // ─── Carrusel de consejos ────────────────────────────────────────────────
  /** Lo que avanza la pista para pasar de una tarjeta a la siguiente. */
  private pasoDeLaPista(pista: HTMLDivElement): number {
    const [primera, segunda] = Array.from(pista.children) as HTMLElement[];
    if (!primera) return 0;
    return segunda ? segunda.offsetLeft - primera.offsetLeft : primera.offsetWidth;
  }

  protected irAlConsejo(indice: number): void {
    const pista = this.pista()?.nativeElement;
    if (!pista) return;
    pista.scrollTo({ left: indice * this.pasoDeLaPista(pista), behavior: 'smooth' });
  }

  protected alDesplazar(): void {
    const pista = this.pista()?.nativeElement;
    if (!pista) return;
    const paso = this.pasoDeLaPista(pista);
    if (paso === 0) return;
    // La última tarjeta no llega a alinearse a la izquierda: al tocar el final cuenta como actual.
    const alFinal = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 2;
    const indice = alFinal ? this.consejos.length - 1 : Math.round(pista.scrollLeft / paso);
    this.consejoActual.set(Math.min(indice, this.consejos.length - 1));
  }

  // ─── Guía completa ───────────────────────────────────────────────────────
  protected abrirGuia(consejo: Consejo): void {
    this.guiaAbierta.set(consejo);
  }

  protected cerrarGuia(): void {
    this.guiaAbierta.set(null);
  }

  /** El botón al pie de la guía: la cierra y, si el consejo apunta a un módulo, va ahí. */
  protected seguirDesdeLaGuia(consejo: Consejo): void {
    this.cerrarGuia();
    if (consejo.boton.ruta) void this.router.navigateByUrl(consejo.boton.ruta);
  }
}
