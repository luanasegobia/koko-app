import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PawPrint } from "lucide-react";

export default function KokoSplashScreen({ onFinish }) {
  const [phase, setPhase] = useState("enter"); // enter | hold | exit

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase("exit"), 2000);
    return () => clearTimeout(holdTimer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {phase !== "exit" && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary"
        >
          {/* Circles decorativas */}
          <motion.div
            className="absolute w-96 h-96 rounded-full bg-white/5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <motion.div
            className="absolute w-64 h-64 rounded-full bg-white/5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          />

          {/* Logo */}
          <motion.div
            className="relative flex flex-col items-center gap-4"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="w-28 h-28 rounded-3xl bg-white flex items-center justify-center shadow-2xl">
              <PawPrint className="w-14 h-14 text-primary" strokeWidth={1.8} />
            </div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <h1 className="text-6xl font-heading font-extrabold text-white tracking-tight">
                Koko
              </h1>
              <p className="text-white/70 text-sm font-body mt-1 tracking-widest uppercase">
                Comunidad mascoteril
              </p>
            </motion.div>
          </motion.div>

          {/* Puntitos de carga */}
          <motion.div
            className="absolute bottom-16 flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-white/50"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}