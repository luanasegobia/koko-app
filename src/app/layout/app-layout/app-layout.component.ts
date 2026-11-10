import { Component, inject } from '@angular/core';
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
}

const NAVEGACION: ElementoDeNavegacion[] = [
  { ruta: '/', etiqueta: 'Inicio', icono: 'home-outline' },
  { ruta: '/perdidas', etiqueta: 'Mascotas Perdidas', icono: 'search-outline' },
  { ruta: '/adopcion', etiqueta: 'Adopción', icono: 'heart-outline' },
  { ruta: '/veterinarias', etiqueta: 'Veterinarias', icono: 'medkit-outline' },
  { ruta: '/identificacion', etiqueta: 'ID Digital', icono: 'qr-code-outline' },
  { ruta: '/denuncias', etiqueta: 'Denuncias', icono: 'shield-half-outline' },
  { ruta: '/casos-urgentes', etiqueta: 'Casos Urgentes', icono: 'hand-left-outline' },
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
  protected readonly navegacion = NAVEGACION;

  constructor() {
    // Arranca la carga de notificaciones apenas hay layout (y sesión).
    inject(NotificacionesService);
  }
}
