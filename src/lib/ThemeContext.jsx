import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Modo claro / oscuro.
 *
 * Los tokens de color del tema oscuro ya estaban completos en index.css y
 * Tailwind estaba configurado con darkMode: "class", pero nada le ponía nunca
 * la clase `dark` al documento: el tema era inalcanzable, junto con la quincena
 * de clases `dark:` escritas a mano en los componentes.
 */
const ThemeContext = createContext(null);
const CLAVE = "koko-tema";

function temaInicial() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === "claro" || guardado === "oscuro") return guardado;
  } catch {
    // Modo incógnito o almacenamiento bloqueado: se usa la preferencia del sistema.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "oscuro");
    try {
      localStorage.setItem(CLAVE, tema);
    } catch {
      // Si no se puede guardar, el tema igual funciona durante la sesión.
    }
  }, [tema]);

  const alternarTema = () => setTema((actual) => (actual === "oscuro" ? "claro" : "oscuro"));

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const contexto = useContext(ThemeContext);
  if (!contexto) throw new Error("useTheme necesita estar dentro de ThemeProvider");
  return contexto;
}
