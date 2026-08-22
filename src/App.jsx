import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Outlet, useLocation } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';

import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import LostPets from './pages/LostPets';
import Adoption from './pages/Adoption';
import Veterinaries from './pages/Veterinaries';
import PetID from './pages/PetID';
import PetPublicProfile from './pages/PetPublicProfile';
import AbuseReports from './pages/AbuseReports';
import UrgentCases from './pages/UrgentCases';
import CompleteProfile from './pages/CompleteProfile';
import DonarExito from './pages/DonarExito';
import AdminDashboard from './pages/AdminDashboard';

/**
 * Manda a completar el perfil antes de dejar entrar a las pantallas privadas.
 *
 * Antes esto vivía fuera del router y leía window.location.pathname a mano, con
 * una lista de rutas públicas mantenida a mano que ya estaba desincronizada del
 * mapa de rutas real. Al no pasar por el router, tampoco se recalculaba al
 * navegar del lado del cliente. Ahora envuelve solo a las rutas privadas, así
 * que la pregunta "¿esta ruta necesita perfil?" la responde el propio árbol de
 * rutas y no una lista aparte.
 */
const RutaConPerfilCompleto = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (user && !user.profile_completed) {
    return <Navigate to="/completar-perfil" replace state={{ volverA: location.pathname }} />;
  }
  return <Outlet />;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public routes: pet profile via QR + Stripe success */}
      <Route path="/ficha/:qrId" element={<PetPublicProfile />} />
      <Route path="/donar/exito" element={<DonarExito />} />

      {/* Public routes (no login required) inside layout */}
      <Route element={<AppLayout />}>
        <Route path="/perdidas" element={<LostPets />} />
        <Route path="/casos-urgentes" element={<UrgentCases />} />
        <Route path="/veterinarias" element={<Veterinaries />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        {/* Fuera del gate: es justamente la pantalla que hay que completar. */}
        <Route path="/completar-perfil" element={<CompleteProfile />} />
        <Route element={<RutaConPerfilCompleto />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/adopcion" element={<Adoption />} />
            <Route path="/identificacion" element={<PetID />} />
            <Route path="/denuncias" element={<AbuseReports />} />
            {/* Se eliminó /admin/veterinarias: duplicaba la pestaña del panel
                con otra clave de caché, así que verificar en una dejaba la otra
                desactualizada, y no estaba enlazada desde ningún lado. */}
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App