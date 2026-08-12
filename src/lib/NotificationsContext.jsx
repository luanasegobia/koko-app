import React, { createContext, useContext } from "react";
import { useNotifications } from "@/lib/useNotifications";

/**
 * Estado de notificaciones compartido por toda la app.
 *
 * El Sidebar monta la campana dos veces —una en la barra superior del celular y
 * otra en el panel lateral de escritorio— y las dos están SIEMPRE en el DOM: lo
 * que cambia según el tamaño de pantalla es solo la visibilidad por CSS. Como
 * cada una ejecutaba el hook por su cuenta, había dos sondeos de 30 segundos,
 * dos canales abiertos y escrituras duplicadas de notificaciones.
 *
 * Con el proveedor el hook corre una sola vez y ambas campanas leen el mismo
 * estado, así que además no pueden mostrar cuentas distintas.
 */
const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const valor = useNotifications();
  return <NotificationsContext.Provider value={valor}>{children}</NotificationsContext.Provider>;
}

export function useNotificationsCompartidas() {
  const contexto = useContext(NotificationsContext);
  if (!contexto) {
    throw new Error("useNotificationsCompartidas necesita estar dentro de NotificationsProvider");
  }
  return contexto;
}
