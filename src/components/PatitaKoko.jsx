import React from "react";

/**
 * Patita ilustrada de la marca: la que desfila en la pantalla de bienvenida y
 * asoma en la esquina de las pantallas de acceso.
 *
 * La geometría sale del diseño de referencia (docs/koko_splash_login). Todas las
 * variantes comparten la misma silueta y solo cambian el relleno y los detalles.
 *
 *   tipo="almohadillas"  pelaje liso con las almohadillas marcadas
 *   tipo="peluda"        pelaje liso con mechones en la pata
 *   tipo="manchada"      manchas grandes sobre la pata
 *   tipo="dalmata"       almohadillas y manchas del mismo color
 */
const CONTORNO = "#313857";
const CREMA = "#FAEDCD";

function Silueta() {
  return (
    <>
      <rect x="150" y="12" width="180" height="126" rx="42" />
      <ellipse cx="26" cy="62" rx="21" ry="25" transform="rotate(-24 26 62)" />
      <ellipse cx="57" cy="30" rx="23" ry="27" transform="rotate(-9 57 30)" />
      <ellipse cx="93" cy="21" rx="23" ry="27" transform="rotate(6 93 21)" />
      <ellipse cx="126" cy="36" rx="21" ry="25" transform="rotate(20 126 36)" />
      <ellipse cx="88" cy="97" rx="44" ry="35" transform="rotate(-8 88 97)" />
    </>
  );
}

function Detalle({ tipo, color }) {
  if (tipo === "almohadillas") {
    return (
      <g fill={color} stroke={CONTORNO} strokeWidth="3">
        <ellipse cx="93" cy="102" rx="27" ry="21" transform="rotate(-8 93 102)" />
        <ellipse cx="27" cy="65" rx="11" ry="13" transform="rotate(-24 27 65)" />
        <ellipse cx="58" cy="34" rx="12" ry="14" transform="rotate(-9 58 34)" />
        <ellipse cx="94" cy="25" rx="12" ry="14" transform="rotate(6 94 25)" />
        <ellipse cx="127" cy="40" rx="11" ry="13" transform="rotate(20 127 40)" />
      </g>
    );
  }
  if (tipo === "peluda") {
    return (
      <g stroke={CONTORNO} strokeWidth="2.5" fill="none" opacity=".55">
        <path d="M170,40 q10,10 0,22" />
        <path d="M195,35 q10,12 0,26" />
        <path d="M220,32 q10,14 0,30" />
        <path d="M245,32 q10,14 0,30" />
        <path d="M270,35 q10,12 0,26" />
      </g>
    );
  }
  if (tipo === "manchada") {
    return (
      <g fill={color} opacity=".9">
        <ellipse cx="205" cy="45" rx="26" ry="30" />
        <ellipse cx="270" cy="80" rx="30" ry="34" />
        <ellipse cx="52" cy="45" rx="14" ry="17" transform="rotate(-15 52 45)" />
      </g>
    );
  }
  if (tipo === "dalmata") {
    return (
      <g fill={color}>
        <ellipse cx="93" cy="102" rx="24" ry="19" transform="rotate(-8 93 102)" />
        <ellipse cx="27" cy="65" rx="9" ry="11" transform="rotate(-24 27 65)" />
        <ellipse cx="58" cy="34" rx="10" ry="12" transform="rotate(-9 58 34)" />
        <ellipse cx="94" cy="25" rx="10" ry="12" transform="rotate(6 94 25)" />
        <ellipse cx="127" cy="40" rx="9" ry="11" transform="rotate(20 127 40)" />
        <ellipse cx="220" cy="45" rx="16" ry="20" />
        <ellipse cx="275" cy="90" rx="20" ry="24" />
      </g>
    );
  }
  return null;
}

export default function PatitaKoko({
  tipo = "almohadillas",
  pelaje = "#D9BB93",
  detalle = "#FFF6E9",
  garras = false,
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 320 150"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`block overflow-visible ${className}`}
    >
      <g fill={pelaje} stroke={CONTORNO} strokeWidth="5">
        <Silueta />
      </g>
      <Detalle tipo={tipo} color={detalle} />
      {garras && (
        <g fill={CREMA} stroke={CONTORNO} strokeWidth="3">
          <ellipse cx="10" cy="52" rx="7" ry="10" transform="rotate(-30 10 52)" />
          <ellipse cx="138" cy="28" rx="7" ry="10" transform="rotate(28 138 28)" />
        </g>
      )}
    </svg>
  );
}

/** La patita que asoma desde la esquina inferior de las pantallas de acceso. */
export function PatitaEsquina() {
  return (
    <div className="pointer-events-none absolute -bottom-[30px] -right-10 z-0 w-[190px] rotate-[8deg] opacity-90">
      <PatitaKoko garras className="h-auto w-full" />
    </div>
  );
}
