import React, { useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import KokoSplashScreen from "@/components/KokoSplashScreen";
import { PatitaEsquina } from "@/components/PatitaKoko";
import { motion } from "framer-motion";

// Campo relleno del diseño: fondo de color y texto crema, sin borde.
const CAMPO =
  "h-auto rounded-2xl border-0 bg-primary px-[18px] py-[15px] text-[15px] font-semibold text-primary-foreground shadow-none placeholder:font-medium placeholder:text-primary-foreground/75 focus-visible:ring-[3px] focus-visible:ring-foreground/25 md:text-[15px]";
const ETIQUETA =
  "mb-[7px] ml-1 block text-xs font-bold uppercase tracking-[.08em] text-foreground";

export default function Login() {
  const [splashDone, setSplashDone] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await db.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    // Sin argumento: loginWithProvider arma la URL absoluta que exige Supabase.
    // Antes se pasaba "/", que por ser truthy salteaba el respaldo y llegaba
    // como redirectTo relativo, que Supabase rechaza.
    db.auth.loginWithProvider("google");
  };

  return (
    <>
      {!splashDone && <KokoSplashScreen onFinish={() => setSplashDone(true)} />}

      <div className="relative flex min-h-screen justify-center overflow-hidden bg-background">
        <PatitaEsquina />

        <motion.div
          className="relative z-[1] flex min-h-screen w-full max-w-md flex-col"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: splashDone ? 1 : 0, y: splashDone ? 0 : 24 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Encabezado */}
          <div className="px-[34px] pb-2.5 pt-[74px]">
            <p className="mb-2.5 text-xs font-bold uppercase tracking-[.3em] text-primary">
              Koko · Comunidad Mascotera
            </p>
            <h1 className="font-heading text-3xl font-semibold leading-[1.15] tracking-[.01em] text-foreground">
              Bienvenidos a KOKO
            </h1>
            <p className="mt-3 text-sm font-medium leading-[1.4] text-foreground/75">
              Iniciá sesión para compartir fotos, encontrar hogares y conectar con
              otros amantes de las mascotas.
            </p>
          </div>

          {/* Formulario */}
          <div className="flex flex-1 flex-col px-[34px] pt-[26px]">
            {error && (
              <div className="mb-4 rounded-2xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="email" className={ETIQUETA}>
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="tunombre@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={CAMPO}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className={ETIQUETA}>
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={CAMPO}
                  required
                />
              </div>

              <Link
                to="/forgot-password"
                className="-mt-1.5 self-end text-[12.5px] font-semibold text-foreground/70 hover:text-foreground hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>

              <Button
                type="submit"
                variant="secondary"
                className="mt-2 h-auto w-full rounded-2xl p-4 font-heading text-base font-semibold tracking-[.03em] shadow-[0_10px_20px_hsl(var(--secondary)/0.55)] transition-transform hover:-translate-y-0.5 hover:bg-secondary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>

            <div className="mb-1 mt-[18px] flex items-center gap-2.5 text-xs font-semibold text-foreground/50 before:h-px before:flex-1 before:bg-foreground/35 after:h-px after:flex-1 after:bg-foreground/35">
              o continuá con
            </div>

            <Button
              type="button"
              variant="outline"
              className="mt-4 h-auto w-full rounded-2xl border-[1.6px] border-primary bg-transparent p-[13px] text-sm font-semibold text-foreground shadow-none hover:bg-primary/10 hover:text-foreground"
              onClick={handleGoogle}
            >
              <GoogleIcon className="mr-2 h-5 w-5" />
              Continuar con Google
            </Button>
          </div>

          <p className="px-6 pb-[92px] pt-5 text-center sm:pb-[34px] text-[13px] font-semibold text-foreground">
            ¿Todavía no tenés cuenta?{" "}
            <Link to="/register" className="font-bold text-primary hover:underline">
              Registrate
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}
