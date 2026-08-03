import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

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
import AdminVeterinaries from './pages/AdminVeterinaries';
import AdminDashboard from './pages/AdminDashboard';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, user } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect to onboarding if profile not completed (skip for public pages and onboarding itself)
  const currentPath = window.location.pathname;
  const publicPaths = ['/ficha/', '/completar-perfil', '/perdidas', '/casos-urgentes', '/veterinarias', '/donar/'];
  const skipOnboarding = publicPaths.some(p => currentPath.startsWith(p));
  if (isAuthenticated && user && !user.profile_completed && !skipOnboarding) {
    return <CompleteProfile />;
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
        <Route path="/completar-perfil" element={<CompleteProfile />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/adopcion" element={<Adoption />} />
          <Route path="/identificacion" element={<PetID />} />
          <Route path="/denuncias" element={<AbuseReports />} />
          <Route path="/admin/veterinarias" element={<AdminVeterinaries />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App