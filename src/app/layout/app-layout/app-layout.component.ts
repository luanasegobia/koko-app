import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonSplitPane,
  IonToolbar,
} from '@ionic/angular';
import { VentanasChatComponent } from '../../compartido/chat/ventanas-chat.component';
import { AuthService } from '../../core/servicios/auth.service';
import { NotificacionesService } from '../../core/servicios/notificaciones.service';
import { TemaService } from '../../core/servicios/tema.service';

interface ElementoDeNavegacion {
  ruta: string;
  etiqueta: string;
  icono: string;
  /** Se puede abrir sin sesión. Tiene que coincidir con las rutas públicas de app.routes.ts. */
  publica?: boolean;
}

const NAVEGACION: ElementoDeNavegacion[] = [
  { ruta: '/', etiqueta: 'Inicio', icono: 'home-outline' },
  { ruta: '/perdidas', etiqueta: 'Mascotas Perdidas', icono: 'search-outline', publica: true },
  { ruta: '/adopcion', etiqueta: 'Adopción', icono: 'heart-outline' },
  { ruta: '/veterinarias', etiqueta: 'Veterinarias', icono: 'medkit-outline', publica: true },
  { ruta: '/identificacion', etiqueta: 'ID Digital', icono: 'qr-code-outline' },
  { ruta: '/denuncias', etiqueta: 'Denuncias', icono: 'shield-half-outline' },
  { ruta: '/casos-urgentes', etiqueta: 'Casos Urgentes', icono: 'hand-left-outline', publica: true },
];

/**
 * Estructura común de las páginas con menú: en pantallas grandes el menú
 * queda fijo a la izquierda (split pane); en el celular se desliza desde el
 * costado con el botón de la cabecera.
 */
@Component({
  selector: 'app-layout',
  imports: [
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle,
    IonRouterOutlet,
    RouterLink,
    RouterLinkActive,
    VentanasChatComponent,
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly tema = inject(TemaService);
  /**
   * Sin sesión el menú muestra solo lo que se puede abrir. Antes mostraba
   * todo: las pantallas privadas mandaban al login al tocarlas, pero ver el
   * menú completo daba la impresión de haber entrado a la app sin cuenta.
   */
  protected readonly navegacion = computed(() =>
    this.auth.autenticado() ? NAVEGACION : NAVEGACION.filter((elemento) => elemento.publica),
  );

  constructor() {
    // Arranca la carga de notificaciones apenas hay layout (y sesión).
    inject(NotificacionesService);
  }
}
