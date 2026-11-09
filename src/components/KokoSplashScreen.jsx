import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import PatitaKoko from "@/components/PatitaKoko";

// Las siete patitas que entran desde la derecha, de arriba hacia abajo.
const PATITAS = [
  { tipo: "almohadillas", pelaje: "#E38B3D", detalle: "#FFF6E9", garras: true },
  { tipo: "peluda", pelaje: "#7C88AC" },
  { tipo: "almohadillas", pelaje: "#DEDCE1", detalle: "#FFFFFF" },
  { tipo: "almohadillas", pelaje: "#2B2B30", detalle: "#FFFFFF" },
  { tipo: "manchada", pelaje: "#FBEFE9", detalle: "#8B6F72" },
  { tipo: "dalmata", pelaje: "#FFFFFF", detalle: "#1E1E1E" },
  { tipo: "almohadillas", pelaje: "#D9BB93", detalle: "#FFF6E9", garras: true },
];

export default function KokoSplashScreen({ onFinish }) {
  const [phase, setPhase] = useState("enter"); // enter | exit
  // Con "reducir movimiento" activado todo aparece ya en su lugar y dura menos.
  const sinMovimiento = useReducedMotion();

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase("exit"), sinMovimiento ? 1200 : 2800);
    return () => clearTimeout(holdTimer);
  }, [sinMovimiento]);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {phase !== "exit" && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background"
        >
          {/* Columna de patitas */}
          <div className="absolute top-0 -right-[7vh] z-[1] flex h-full w-[min(28.3vh,62vw)] flex-col justify-between py-[18px]">
            {PATITAS.map((patita, i) => (
              <motion.div
                key={i}
                className="h-[14%] w-full"
                initial={sinMovimiento ? false : { opacity: 0, x: 140, rotate: -6 }}
                animate={{ opacity: 1, x: 0, rotate: -6 }}
                transition={{ duration: 0.7, delay: 0.05 + i * 0.1, ease: [0.2, 0.8, 0.25, 1] }}
              >
                <PatitaKoko {...patita} className="h-full w-full" />
              </motion.div>
            ))}
          </div>

          {/* Marca */}
          <div className="relative z-[2] flex w-[60%] flex-1 flex-col items-start justify-center pl-[42px] md:pl-[12vw]">
            <motion.h1
              className="font-heading text-[64px] font-bold leading-none text-foreground md:text-8xl"
              initial={sinMovimiento ? false : { opacity: 0, letterSpacing: ".5em", scale: 0.6, y: 14 }}
              animate={{
                opacity: [0, 1, 1],
                letterSpacing: [".5em", ".02em", ".06em"],
                scale: [0.6, 1.08, 1],
                y: [14, 0, 0],
              }}
              transition={{ duration: 1.1, delay: 0.15, times: [0, 0.55, 1], ease: [0.2, 0.9, 0.25, 1] }}
            >
              KOKO
            </motion.h1>

            <motion.p
              className="ml-1 mt-3.5 font-body text-base font-semibold uppercase tracking-[.28em] text-foreground"
              initial={sinMovimiento ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 0.85, y: 0 }}
              transition={{ duration: 0.7, delay: 0.95, ease: "easeOut" }}
            >
              Comunidad Mascotera
            </motion.p>

            <motion.div
              className="ml-1 mt-[22px] h-[5px] w-[46px] origin-left rounded bg-foreground"
              initial={sinMovimiento ? false : { opacity: 0, scaleX: 0 }}
              animate={{ opacity: 0.55, scaleX: 1 }}
              transition={{ duration: 0.5, delay: 1.25, ease: "easeOut" }}
            />
          </div>

          <motion.p
            className="relative z-[2] pb-[38px] text-center text-[11px] font-semibold uppercase tracking-[.18em] text-foreground"
            initial={sinMovimiento ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5, ease: "easeOut" }}
          >
            Hecho con cariño para las patitas
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
