import { Injectable, signal } from '@angular/core';
import { ContextoChat } from '../modelos';

export interface ChatAbierto {
  idConversacion: string;
  tipoDeContexto: ContextoChat;
  idDeContexto: string;
  tituloDeContexto: string;
}

/** Ventanas de chat flotantes abiertas (como máximo dos a la vez). */
@Injectable({ providedIn: 'root' })
export class GestorChatService {
  readonly abiertos = signal<ChatAbierto[]>([]);

  abrir({
    tipoDeContexto,
    idDeContexto,
    tituloDeContexto,
  }: Omit<ChatAbierto, 'idConversacion'>): void {
    const idConversacion = `${tipoDeContexto}_${idDeContexto}`;
    this.abiertos.update((actuales) => {
      if (actuales.some((chat) => chat.idConversacion === idConversacion)) return actuales;
      return [...actuales, { idConversacion, tipoDeContexto, idDeContexto, tituloDeContexto }].slice(-2);
    });
  }

  cerrar(idConversacion: string): void {
    this.abiertos.update((actuales) => actuales.filter((chat) => chat.idConversacion !== idConversacion));
  }
}
