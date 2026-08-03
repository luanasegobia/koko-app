import React, { useState } from "react";
import { db } from "@/api/supabaseClient";
import { Link, useLocation } from "react-router-dom";
import {
  Search, Heart, Stethoscope, QrCode, ShieldAlert,
  HandHeart, Home, Menu, X, PawPrint, ShieldCheck, LogIn, LogOut } from
"lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
{ path: "/", label: "Inicio", icon: Home },
{ path: "/perdidas", label: "Mascotas Perdidas", icon: Search },
{ path: "/adopcion", label: "Adopción", icon: Heart },
{ path: "/veterinarias", label: "Veterinarias", icon: Stethoscope },
{ path: "/identificacion", label: "ID Digital", icon: QrCode },
{ path: "/denuncias", label: "Denuncias", icon: ShieldAlert },
{ path: "/casos-urgentes", label: "Casos Urgentes", icon: HandHeart }];

export default function Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PawPrint className="w-6 h-6 text-primary" />
          <span className="font-heading font-bold text-sidebar-foreground text-lg">Koko</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-sidebar-foreground">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Overlay */}
      {mobileOpen &&
      <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      }

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-sidebar z-50 transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-sidebar-foreground text-lg leading-tight">Conectando</h1>
                <h1 className="font-heading font-bold text-primary text-lg leading-tight">Huellas</h1>
              </div>
            </div>
            <NotificationBell />
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive ?
                "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20" :
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"}`
                }>
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>);
          })}

          {/* Login / logout */}
          <div className="pt-4 mt-4 border-t border-sidebar-border">
            {user ? (
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs text-sidebar-foreground/50 truncate">{user.full_name || user.email}</div>
                <button
                  onClick={() => { db.auth.logout(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <button
                onClick={() => db.auth.redirectToLogin(window.location.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
              >
                <LogIn className="w-4 h-4" />
                Iniciar sesión
              </button>
            )}
          </div>

          {/* Admin section */}
          {user?.role === "admin" && (
            <div className="pt-4 mt-4 border-t border-sidebar-border">
              <p className="text-xs text-sidebar-foreground/40 font-semibold uppercase tracking-wider px-3 mb-2">Administración</p>
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname.startsWith("/admin")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <ShieldCheck className="w-4.5 h-4.5" />
                Panel Admin
              </Link>
            </div>
          )}
        </nav>
      </aside>
    </>);

}