import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import ErrorBoundary from '@/components/ErrorBoundary'
import '@/index.css'

// El ErrorBoundary va por fuera de App (y por lo tanto de AuthProvider) para
// poder atrapar también los errores de configuración, que ocurren durante la
// primera consulta a Supabase.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
