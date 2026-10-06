import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { PuntoLatLng } from '../../core/modelos';
import { escaparHtml } from '../../core/utilidades';

/** Contenido del globo que se abre al tocar un marcador. Se escapa antes de insertarlo. */
export interface PopupDeMarcador {
  imagen?: string;
  titulo: string;
  subtitulo?: string;
  lineas?: string[];
  etiqueta?: { texto: string; fondo: string; color: string };
  telefono?: string;
}

export type ClaveDeIcono =
  | 'mascotaPerdida'
  | 'mascotaEncontrada'
  | 'avistamiento'
  | 'denuncia'
  | 'denunciaUrgente'
  | 'veterinaria'
  | 'veterinariaAbierta'
  | 'usuario';

export interface Marcador {
  id: string;
  lat: number;
  lng: number;
  icono: ClaveDeIcono;
  popup?: PopupDeMarcador;
}

/** Pin de color con un emoji adentro. */
function crearIcono(color: string, emoji: string, tamanio = 36): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${tamanio}" height="${tamanio * 1.2}" viewBox="0 0 36 43">
      <filter id="sombra" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
      </filter>
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 25 18 25S36 31.5 36 18C36 8.06 27.94 0 18 0z"
            fill="${color}" filter="url(#sombra)"/>
      <circle cx="18" cy="18" r="11" fill="white" opacity="0.25"/>
      <text x="18" y="23" font-size="13" text-anchor="middle" font-family="sans-serif">${emoji}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [tamanio, tamanio * 1.2],
    iconAnchor: [tamanio / 2, tamanio * 1.2],
    popupAnchor: [0, -tamanio * 1.2],
  });
}

const ICONOS: Record<ClaveDeIcono, L.DivIcon> = {
  mascotaPerdida: crearIcono('#ef4444', '🐾'),
  mascotaEncontrada: crearIcono('#22c55e', '🐾'),
  avistamiento: crearIcono('#f59e0b', '👁️', 28),
  denuncia: crearIcono('#f97316', '⚠️'),
  denunciaUrgente: crearIcono('#dc2626', '🆘'),
  veterinaria: crearIcono('#3b82f6', '🏥'),
  veterinariaAbierta: crearIcono('#10b981', '🏥'),
  usuario: crearIcono('#8b5cf6', '📍', 28),
};

/** Centro por defecto: Orán, Salta. */
const CENTRO_ORAN: PuntoLatLng = [-23.137, -64.328];

function armarPopup(popup: PopupDeMarcador): string {
  const partes: string[] = [];
  if (popup.imagen) partes.push(`<img src="${escaparHtml(popup.imagen)}" alt="" />`);
  partes.push(`<p class="popup-titulo">${escaparHtml(popup.titulo)}</p>`);
  if (popup.subtitulo) partes.push(`<p class="popup-detalle">${escaparHtml(popup.subtitulo)}</p>`);
  if (popup.etiqueta) {
    partes.push(
      `<span class="popup-etiqueta" style="background:${escaparHtml(popup.etiqueta.fondo)};color:${escaparHtml(popup.etiqueta.color)}">${escaparHtml(popup.etiqueta.texto)}</span>`,
    );
  }
  for (const linea of popup.lineas ?? []) {
    partes.push(`<p class="popup-detalle">${escaparHtml(linea)}</p>`);
  }
  if (popup.telefono) {
    const telefono = escaparHtml(popup.telefono);
    partes.push(`<a href="tel:${telefono}">📞 ${telefono}</a>`);
  }
  return `<div style="min-width:180px">${partes.join('')}</div>`;
}

/**
 * Mapa de OpenStreetMap con Leaflet. Recibe los marcadores ya armados por
 * cada página y, opcionalmente, la ubicación de la persona con su radio.
 */
@Component({
  selector: 'app-mapa',
  template: `<div #contenedor class="mapa" [style.height]="altura()"></div>`,
  styles: `
    :host {
      display: block;
    }

    .mapa {
      width: 100%;
      border-radius: var(--koko-radio);
      overflow: hidden;
      border: 1px solid var(--ion-border-color);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    }
  `,
})
export class MapaComponent implements AfterViewInit, OnDestroy {
  readonly marcadores = input<Marcador[]>([]);
  readonly centro = input<PuntoLatLng | null>(null);
  readonly zoom = input(14);
  readonly altura = input('420px');
  readonly radioKm = input<number | null>(null);
  readonly ubicacionUsuario = input<PuntoLatLng | null>(null);
  readonly marcadorTocado = output<Marcador>();

  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('contenedor');
  private readonly listo = signal(false);
  private mapa: L.Map | null = null;
  private capaDeMarcadores = L.layerGroup();
  private capaDeUsuario = L.layerGroup();

  constructor() {
    effect(() => {
      if (!this.listo()) return;
      const marcadores = this.marcadores();
      untracked(() => this.dibujarMarcadores(marcadores));
    });

    effect(() => {
      if (!this.listo()) return;
      const ubicacion = this.ubicacionUsuario();
      const radio = this.radioKm();
      untracked(() => this.dibujarUsuario(ubicacion, radio));
    });

    effect(() => {
      if (!this.listo()) return;
      const centro = this.centro();
      const zoom = this.zoom();
      untracked(() => {
        if (centro) this.mapa?.flyTo(centro, zoom, { duration: 1 });
      });
    });
  }

  ngAfterViewInit(): void {
    this.mapa = L.map(this.contenedor().nativeElement, {
      center: this.centro() ?? CENTRO_ORAN,
      zoom: this.zoom(),
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.mapa);
    this.capaDeUsuario.addTo(this.mapa);
    this.capaDeMarcadores.addTo(this.mapa);
    this.listo.set(true);

    // Dentro de ion-content el tamaño definitivo llega un instante después.
    setTimeout(() => this.mapa?.invalidateSize(), 150);
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
    this.mapa = null;
  }

  private dibujarMarcadores(marcadores: Marcador[]): void {
    this.capaDeMarcadores.clearLayers();
    for (const marcador of marcadores) {
      const pin = L.marker([marcador.lat, marcador.lng], { icon: ICONOS[marcador.icono] });
      if (marcador.popup) pin.bindPopup(armarPopup(marcador.popup), { maxWidth: 260 });
      pin.on('click', () => this.marcadorTocado.emit(marcador));
      pin.addTo(this.capaDeMarcadores);
    }
  }

  private dibujarUsuario(ubicacion: PuntoLatLng | null, radioKm: number | null): void {
    this.capaDeUsuario.clearLayers();
    if (!ubicacion) return;
    if (radioKm) {
      L.circle(ubicacion, {
        radius: radioKm * 1000,
        color: '#8b5cf6',
        fillColor: '#8b5cf6',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '6 4',
      }).addTo(this.capaDeUsuario);
    }
    L.marker(ubicacion, { icon: ICONOS.usuario })
      .bindPopup('<strong>Tu ubicación</strong>')
      .addTo(this.capaDeUsuario);
  }
}
