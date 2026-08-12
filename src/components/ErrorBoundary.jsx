import React from 'react';
import { AlertTriangle, PawPrint, RefreshCw, Settings } from 'lucide-react';
import { ErrorDeConfiguracion } from '@/api/errores';

/**
 * Excepción deliberada a la regla de "solo componentes funcionales" de
 * .agents/AGENTS.md §4: React no expone `componentDidCatch` en hooks, así que
 * un límite de errores TIENE que ser una clase. Es el único componente de
 * clase del proyecto.
 *
 * Va montado por fuera de AuthProvider en main.jsx, para poder atrapar también
 * los errores que ocurren mientras se inicializa la sesión.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error no controlado:', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (error instanceof ErrorDeConfiguracion) {
      return <PantallaDeConfiguracion error={error} />;
    }
    return <PantallaDeError error={error} />;
  }
}

function PantallaDeConfiguracion({ error }) {
  return (
    <Marco>
      <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-5">
        <Settings className="w-7 h-7 text-amber-600" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-slate-900 mb-2">
        Falta configurar el proyecto
      </h1>
      <p className="text-slate-600 mb-6">{error.message}</p>

      {error.pasos?.length > 0 && (
        <ol className="space-y-3 mb-6">
          {error.pasos.map((paso, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-700">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="pt-0.5">{paso}</span>
            </li>
          ))}
        </ol>
      )}

      <p className="text-xs text-slate-500 border-t border-slate-200 pt-4">
        El archivo <code className="font-mono text-slate-700">.env.local</code> nunca se sube al
        repositorio. Si es tu primera vez, mirá el README.
      </p>
    </Marco>
  );
}

function PantallaDeError({ error }) {
  return (
    <Marco>
      <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-5">
        <AlertTriangle className="w-7 h-7 text-red-600" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-slate-900 mb-2">Algo salió mal</h1>
      <p className="text-slate-600 mb-6">
        Se produjo un error inesperado y la aplicación no pudo seguir. Probá recargar la página.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Recargar
      </button>

      {import.meta.env.DEV && (
        <pre className="mt-6 p-3 rounded-xl bg-slate-100 text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap border-t border-slate-200">
          {error?.stack || String(error)}
        </pre>
      )}
    </Marco>
  );
}

function Marco({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8">
        <div className="flex items-center gap-2 mb-6 text-slate-400">
          <PawPrint className="w-5 h-5" />
          <span className="font-heading font-semibold text-sm">Koko</span>
        </div>
        {children}
      </div>
    </div>
  );
}

export default ErrorBoundary;
