import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
import AdminVeterinaries from './pages/AdminVeterinaries';
import AdminDashboard from './pages/AdminDashboard';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, user } = useAuth();