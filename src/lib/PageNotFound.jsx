import { useLocation, Link } from 'react-router-dom';
import { PawPrint, Home } from 'lucide-react';

/**
 * Se eliminó el bloque "Admin Note", que le decía a cualquier persona
 * administradora: "esto puede significar que la IA todavía no implementó esta
 * página; pedísela por el chat". Era un mensaje del constructor de Base44 que
 * quedó suelto y que no tiene ningún sentido acá.
 *
 * Con él se fue también la consulta a db.auth.me() que existía solo para
 * decidir si mostrarlo.
 */
export default function PageNotFound() {
  const location = useLocation();
  const ruta = location.pathname;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <PawPrint className="w-5 h-5" />
            <span className="font-heading font-semibold text-sm">Koko</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-7xl font-light text-muted-foreground/40">404</h1>
            <div className="h-0.5 w-16 bg-border mx-auto"></div>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              No encontramos esta página
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              La dirección <span className="font-mono text-sm">{ruta}</span> no existe o cambió de
              lugar.
            </p>
          </div>

          <div className="pt-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Home className="w-4 h-4" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
