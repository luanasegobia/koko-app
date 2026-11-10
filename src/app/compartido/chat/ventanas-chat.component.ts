import { Component, inject } from '@angular/core';
import { GestorChatService } from '../../core/servicios/gestor-chat.service';
import { VentanaChatComponent } from './ventana-chat.component';

/** Contenedor fijo abajo a la derecha con las ventanas de chat abiertas. */
@Component({
  selector: 'app-ventanas-chat',
  imports: [VentanaChatComponent],
  template: `
    <div class="ventanas">
      @for (chat of gestor.abiertos(); track chat.idConversacion) {
        <app-ventana-chat [chat]="chat" (cerrar)="gestor.cerrar(chat.idConversacion)" />
      }
    </div>
  `,
  styles: `
    .ventanas {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 1000;
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }
  `,
})
export class VentanasChatComponent {
  protected readonly gestor = inject(GestorChatService);
}
