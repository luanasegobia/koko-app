import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, PawPrint } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import KokoSplashScreen from "@/components/KokoSplashScreen";
import { motion } from "framer-motion";

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
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  return (
    <>
      {!splashDone && <KokoSplashScreen onFinish={() => setSplashDone(true)} />}

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/10 via-background to-accent/10">
        {/* Top brand section */}
        <motion.div
          className="flex flex-col items-center justify-center pt-16 pb-8 px-4"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: splashDone ? 1 : 0, y: splashDone ? 0 : -30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
            <PawPrint className="w-10 h-10 text-white" strokeWidth={1.8} />
          </div>
          <h1 className="text-4xl font-heading font-extrabold text-foreground tracking-tight">
            Koko
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-body">
            Comunidad mascoteril
          </p>
        </motion.div>

        {/* Form card */}
        <motion.div
          className="flex-1 flex items-start justify-center px-4 pb-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: splashDone ? 1 : 0, y: splashDone ? 0 : 40 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        >
          <div className="w-full max-w-md">
            <div className="bg-card rounded-3xl shadow-xl border border-border p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-heading font-bold text-foreground">
                  Bienvenido de vuelta
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Iniciá sesión para continuar
                </p>
              </div>

              {/* Google */}
              <Button
                variant="outline"
                className="w-full h-12 text-sm font-medium mb-5 border-border hover:bg-muted/60"
                onClick={handleGoogle}
              >
                <GoogleIcon className="w-5 h-5 mr-2" />
                Continuar con Google
              </Button>

              {/* Divider */}
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">o con email</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-muted/40 border-border focus:bg-card"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Contraseña
                    </Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-muted/40 border-border focus:bg-card"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 font-semibold rounded-xl mt-2 shadow-md shadow-primary/20"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    "Ingresar"
                  )}
                </Button>
              </form>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-5">
              ¿No tenés cuenta?{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Registrate
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}