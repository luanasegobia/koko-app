import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSearchbar } from '@ionic/angular';
import { CabeceraComponent } from '../../compartido/cabecera/cabecera.component';

interface Modulo {
  ruta: string;
  icono: string;
  titulo: string;
  descripcion: string;
  color: string;
  etiqueta: string;
}

const MODULOS: Modulo[] = [
  {
    ruta: '/perdidas',
    icono: 'search',
    titulo: 'Mascotas Perdidas',
    descripcion: 'Reportá y buscá mascotas perdidas con fotos, mapa y alertas por zona.',
    color: 'danger',
    etiqueta: 'Urgente',
  },
  {
    ruta: '/adopcion',
    icono: 'heart',
    titulo: 'Adopción',
    descripcion: 'Encontrá tu compañero ideal. Perfiles, filtros y solicitudes en línea.',
    color: 'primary',
    etiqueta: 'Popular',
  },
  {
    ruta: '/veterinarias',
    icono: 'medkit',
    titulo: 'Veterinarias de Turno',
    descripcion: 'Consultá qué veterinaria está de turno ahora, con mapa y llamada directa.',
    color: 'tertiary',
    etiqueta: '24h',
  },
  {
    ruta: '/identificacion',
    icono: 'qr-code',
    titulo: 'ID Digital (QR / NFC)',
    descripcion: 'Creá la ficha digital de tu mascota. Generá un QR para el collar.',
    color: 'purpura',
    etiqueta: 'Nuevo',
  },
  {
    ruta: '/denuncias',
    icono: 'shield-half',
    titulo: 'Denuncias de Maltrato',
    descripcion: 'Denunciá situaciones de maltrato animal con evidencia y geolocalización.',
    color: 'secondary',
    etiqueta: 'Anónimo',
  },
  {
    ruta: '/casos-urgentes',
    icono: 'hand-left',
    titulo: 'Casos Urgentes',
    descripcion: 'Ayudá a animales en emergencia. Donaciones, traslados y más.',
    color: 'rosa',
    etiqueta: 'Solidario',
  },
];

const ESTADISTICAS = [
  { icono: 'paw', etiqueta: 'Mascotas reunidas', valor: '124+', color: 'primary' },
  { icono: 'heart', etiqueta: 'Adopciones exitosas', valor: '42', color: 'rosa' },
  { icono: 'location', etiqueta: 'Veterinarias activas', valor: '18', color: 'tertiary' },
  { icono: 'flash', etiqueta: 'Casos resueltos', valor: '67', color: 'secondary' },
];

const HUELLAS_FLOTANTES = [
  { x: '8%', y: '18%', tamanio: 26, retraso: 0, opacidad: 0.08, rotacion: -15 },
  { x: '78%', y: '8%', tamanio: 34, retraso: 0.6, opacidad: 0.06, rotacion: 20 },
  { x: '62%', y: '65%', tamanio: 22, retraso: 1.1, opacidad: 0.08, rotacion: -5 },
  { x: '22%', y: '72%', tamanio: 30, retraso: 0.9, opacidad: 0.06, rotacion: 30 },
  { x: '88%', y: '45%', tamanio: 18, retraso: 0.4, opacidad: 0.09, rotacion: -25 },
  { x: '45%', y: '85%', tamanio: 20, retraso: 1.5, opacidad: 0.05, rotacion: 10 },
];

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, IonContent, IonButton, IonIcon, IonSearchbar, CabeceraComponent],
  templateUrl: './inicio.page.html',
  styleUrl: './inicio.page.scss',
})
export class InicioPage {
  private readonly router = inject(Router);

  protected readonly modulos = MODULOS;
  protected readonly estadisticas = ESTADISTICAS;
  protected readonly huellas = HUELLAS_FLOTANTES;
  protected readonly busqueda = signal('');

  protected buscar(): void {
    const texto = this.busqueda().trim();
    if (!texto) return;
    void this.router.navigate(['/perdidas'], { queryParams: { search: texto } });
  }

  protected irAReportar(): void {
    void this.router.navigate(['/perdidas'], { queryParams: { action: 'report' } });
  }

  protected irAAvistamiento(): void {
    void this.router.navigate(['/perdidas'], { queryParams: { action: 'sighting' } });
  }
}
