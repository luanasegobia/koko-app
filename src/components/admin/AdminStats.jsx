import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { PawPrint, Heart, Stethoscope, HandHeart, ShieldAlert, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className={`border-l-4 ${color}`}>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-muted">
            <Icon className="w-6 h-6 text-foreground/70" />
          </div>
          <div>
            <p className="text-3xl font-bold font-heading">{value}</p>
            <p className="text-sm font-medium text-foreground/80">{label}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AdminStats({ vets, lostPets, urgentCases, adoptions, reports, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-5 animate-pulse">
            <div className="h-16 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      icon: PawPrint, label: "Mascotas Perdidas", value: lostPets.length,
      sub: `${lostPets.filter(p => p.status === "encontrada").length} encontradas`,
      color: "border-l-destructive", delay: 0,
    },
    {
      icon: Heart, label: "En Adopción", value: adoptions.length,
      sub: `${adoptions.filter(a => a.status === "adoptado").length} adoptadas`,
      color: "border-l-pink-400", delay: 0.05,
    },
    {
      icon: HandHeart, label: "Casos Urgentes", value: urgentCases.length,
      sub: `${urgentCases.filter(c => c.status === "activo").length} activos`,
      color: "border-l-accent", delay: 0.1,
    },
    {
      icon: ShieldAlert, label: "Denuncias", value: reports.length,
      sub: `${reports.filter(r => r.status === "pendiente").length} pendientes`,
      color: "border-l-red-500", delay: 0.15,
    },
    {
      icon: Stethoscope, label: "Veterinarias", value: vets.length,
      sub: `${vets.filter(v => v.is_verified).length} verificadas`,
      color: "border-l-purple-400", delay: 0.2,
    },
    {
      icon: Clock, label: "Vets pendientes", value: vets.filter(v => !v.is_verified).length,
      sub: "aguardan verificación",
      color: "border-l-amber-400", delay: 0.25,
    },
    {
      icon: CheckCircle2, label: "Casos resueltos", value: urgentCases.filter(c => c.status === "resuelto").length,
      sub: "casos urgentes cerrados",
      color: "border-l-primary", delay: 0.3,
    },
    {
      icon: AlertTriangle, label: "Denuncias en revisión", value: reports.filter(r => r.status === "en_revision").length,
      sub: "siendo procesadas",
      color: "border-l-orange-400", delay: 0.35,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lost pets breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-destructive" /> Mascotas Perdidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Perros", value: lostPets.filter(p => p.species === "perro").length },
              { label: "Gatos", value: lostPets.filter(p => p.species === "gato").length },
              { label: "Otros", value: lostPets.filter(p => p.species === "otro").length },
              { label: "Activas (perdidas)", value: lostPets.filter(p => p.status === "perdida").length },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Urgent cases breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <HandHeart className="w-4 h-4 text-accent" /> Casos Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Activos", value: urgentCases.filter(c => c.status === "activo").length },
              { label: "En curso", value: urgentCases.filter(c => c.status === "en_curso").length },
              { label: "Resueltos", value: urgentCases.filter(c => c.status === "resuelto").length },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Reports breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" /> Denuncias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Pendientes", value: reports.filter(r => r.status === "pendiente").length },
              { label: "En revisión", value: reports.filter(r => r.status === "en_revision").length },
              { label: "Derivadas", value: reports.filter(r => r.status === "derivada").length },
              { label: "Resueltas", value: reports.filter(r => r.status === "resuelta").length },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}