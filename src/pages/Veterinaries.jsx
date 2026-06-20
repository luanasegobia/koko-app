const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stethoscope, Phone, MapPin, Clock, AlertCircle, Map, List, Zap } from "lucide-react";
import { motion } from "framer-motion";
import PetMap, { ICONS } from "@/components/map/PetMap";

function getVetStatus(vet) {
  if (vet.is_emergency) {
    return {
      label: "Emergencia 24h",
      badge: "bg-red-500 text-white border-red-600",
      cardBorder: "border-l-4 border-l-red-500",
      cardBg: "bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-950/20",
      dot: "bg-red-500",
      dotPulse: true,
      isOpen: true,
      icon: Zap,
      iconColor: "text-red-500"
    };
  }

  const now = new Date();
  const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const today = days[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const todaySchedule = vet.schedule?.find(s => s.day === today);
  if (todaySchedule && currentTime >= todaySchedule.open && currentTime <= todaySchedule.close) {
    return {
      label: "De turno",
      badge: "bg-emerald-500 text-white border-emerald-600",
      cardBorder: "border-l-4 border-l-emerald-500",
      cardBg: "bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20",
      dot: "bg-emerald-500",
      dotPulse: true,
      isOpen: true,
      hours: `${todaySchedule.open} – ${todaySchedule.close}`,
      icon: Clock,
      iconColor: "text-emerald-500"
    };
  }

  for (let i = 0; i < 7; i++) {
    const dayIndex = (now.getDay() + i) % 7;
    const dayName = days[dayIndex];
    const sched = vet.schedule?.find(s => s.day === dayName);
    if (sched) {
      if (i === 0 && currentTime < sched.open) {
        return {
          label: "Cerrada",
          badge: "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300",
          cardBorder: "border-l-4 border-l-slate-300",
          cardBg: "",
          dot: "bg-slate-400",
          dotPulse: false,
          isOpen: false,
          nextOpen: `Abre hoy ${sched.open}`,
          icon: Clock,
          iconColor: "text-slate-400"
        };
      }
      if (i > 0) {
        return {
          label: "Cerrada",
          badge: "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300",
          cardBorder: "border-l-4 border-l-slate-300",
          cardBg: "",
          dot: "bg-slate-400",
          dotPulse: false,
          isOpen: false,
          nextOpen: `Abre ${dayName} ${sched.open}`,
          icon: Clock,
          iconColor: "text-slate-400"
        };
      }
    }
  }

  return {
    label: "Cerrada",
    badge: "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300",
    cardBorder: "border-l-4 border-l-slate-300",
    cardBg: "",
    dot: "bg-slate-400",
    dotPulse: false,
    isOpen: false,
    icon: Clock,
    iconColor: "text-slate-400"
  };
}

function StatusDot({ status }) {
  return (
    <span className="relative flex items-center justify-center w-3 h-3">
      {status.dotPulse && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.dot} opacity-50`} />
      )}
      <span className={`relative inline-flex rounded-full w-2.5 h-2.5 ${status.dot}`} />
    </span>
  );
}

export default function Veterinaries() {
  const [view, setView] = useState("lista");

  const { data: vets = [], isLoading } = useQuery({
    queryKey: ["veterinaries"],
    queryFn: () => db.entities.Veterinary.list(),
  });

  const verified = useMemo(() => vets.filter(v => v.is_verified), [vets]);

  const sorted = useMemo(() => [...verified].sort((a, b) => {
    if (a.is_emergency && !b.is_emergency) return -1;
    if (!a.is_emergency && b.is_emergency) return 1;
    const sa = getVetStatus(a);
    const sb = getVetStatus(b);
    if (sa.isOpen && !sb.isOpen) return -1;
    if (!sa.isOpen && sb.isOpen) return 1;
    return 0;
  }), [vets]);

  const mapMarkers = useMemo(() =>
    verified.filter(v => v.lat && v.lng).map(v => {
      const status = getVetStatus(v);
      return {
        id: v.id,
        lat: v.lat,
        lng: v.lng,
        icon: v.is_emergency || status.isOpen ? ICONS.vetOpen : ICONS.vet,
        popupContent: (
          <div className="min-w-[200px] space-y-2">
            <p className="font-bold text-sm">{v.name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium border ${status.badge}`}>
              {status.label}
            </span>
            <p className="text-xs text-gray-500 flex items-center gap-1">📍 {v.address}</p>
            {status.hours && <p className="text-xs text-gray-500">🕐 {status.hours}</p>}
            {status.nextOpen && <p className="text-xs text-gray-400">⏰ {status.nextOpen}</p>}
            <a href={`tel:${v.phone}`} className="block text-xs text-blue-600 underline">📞 {v.phone}</a>
          </div>
        ),
      };
    }), [vets]);

  // Legend counts
  const emergencyCount = sorted.filter(v => v.is_emergency).length;
  const openCount = sorted.filter(v => !v.is_emergency && getVetStatus(v).isOpen).length;
  const closedCount = sorted.filter(v => !v.is_emergency && !getVetStatus(v).isOpen).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Veterinarias de Turno</h1>
          <p className="text-muted-foreground mt-1">Consultá qué veterinaria está de turno ahora en Orán</p>
        </div>
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="lista"><List className="w-4 h-4 mr-1.5" />Lista</TabsTrigger>
            <TabsTrigger value="mapa"><Map className="w-4 h-4 mr-1.5" />Mapa</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Status legend / counter pills */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-full px-4 py-1.5">
          <span className="relative flex w-2.5 h-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-50" />
            <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-red-500" />
          </span>
          <span className="text-sm font-semibold text-red-600 dark:text-red-400">Emergencia 24h</span>
          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{emergencyCount}</span>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-full px-4 py-1.5">
          <span className="relative flex w-2.5 h-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-50" />
            <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-emerald-500" />
          </span>
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">De turno ahora</span>
          <span className="bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{openCount}</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-1.5">
          <span className="inline-flex rounded-full w-2.5 h-2.5 bg-slate-400" />
          <span className="text-sm font-semibold text-slate-500">Cerradas</span>
          <span className="bg-slate-400 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{closedCount}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : view === "mapa" ? (
        <div className="space-y-4">
          <PetMap markers={mapMarkers} height="520px" zoom={14} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sorted.map(vet => {
              const status = getVetStatus(vet);
              return (
                <Card key={vet.id} className={`p-3 flex items-center justify-between gap-2 ${status.cardBorder} ${status.cardBg}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusDot status={status} />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{vet.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{vet.address}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild className="shrink-0">
                    <a href={`tel:${vet.phone}`}><Phone className="w-4 h-4" /></a>
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <Card className="p-12 text-center">
          <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hay veterinarias registradas.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((vet, i) => {
            const status = getVetStatus(vet);
            const StatusIcon = status.icon;
            return (
              <motion.div
                key={vet.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className={`overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${status.cardBorder} ${status.cardBg}`}>
                  <div className="flex-1 p-5 space-y-2">
                    {/* Name + badge */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <StatusDot status={status} />
                        <h3 className="font-heading font-bold text-lg">{vet.name}</h3>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.badge}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      {vet.is_verified && (
                        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">✓ Verificada</span>
                      )}
                    </div>

                    {/* Info row */}
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                      {vet.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {vet.address}
                        </span>
                      )}
                      {status.hours && (
                        <span className={`flex items-center gap-1 font-medium ${status.iconColor}`}>
                          <Clock className="w-3.5 h-3.5" />
                          {status.hours}
                        </span>
                      )}
                      {status.nextOpen && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          {status.nextOpen}
                        </span>
                      )}
                      {vet.is_emergency && (
                        <span className="flex items-center gap-1 text-red-500 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Siempre disponible
                        </span>
                      )}
                    </div>

                    {vet.services && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{vet.services}</p>
                    )}
                  </div>

                  {/* Call button */}
                  <div className="px-5 pb-5 sm:py-5 sm:pl-0">
                    <Button
                      className={status.isOpen
                        ? vet.is_emergency
                          ? "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/30"
                          : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                        : ""}
                      variant={status.isOpen ? "default" : "outline"}
                      size="sm"
                      asChild
                    >
                      <a href={`tel:${vet.phone}`}>
                        <Phone className="w-4 h-4 mr-1.5" />
                        Llamar
                      </a>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}