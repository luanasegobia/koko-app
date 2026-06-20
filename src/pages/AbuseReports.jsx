const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useMemo } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShieldAlert, MapPin, Clock, Search as SearchIcon, Map, List, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import AbuseReportForm from "@/components/abuse/AbuseReportForm";
import TrackingLookup from "@/components/abuse/TrackingLookup";
import PetMap, { ICONS } from "@/components/map/PetMap";
import ProximityFilter from "@/components/map/ProximityFilter";

const typeConfig = {
  urgente: { label: "Urgente", color: "bg-destructive text-destructive-foreground", border: "border-destructive/30" },
  regular: { label: "Regular", color: "bg-accent text-accent-foreground", border: "border-accent/30" },
  anonima: { label: "Anónima", color: "bg-blue-500 text-white", border: "border-blue-500/30" },
};
const statusLabels = { pendiente: "Pendiente", en_revision: "En revisión", derivada: "Derivada", resuelta: "Resuelta" };

function haversineKm([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function AbuseReports() {
  const [showForm, setShowForm] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [view, setView] = useState("lista");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userLocation, setUserLocation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["abuseReports"],
    queryFn: () => db.entities.AbuseReport.list("-created_date", 100),
  });

  const filtered = useMemo(() => {
    return reports.filter(r => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (userLocation && r.lat && r.lng) {
        const dist = haversineKm(userLocation, [r.lat, r.lng]);
        if (dist > radiusKm) return false;
      }
      return true;
    });
  }, [reports, typeFilter, statusFilter, userLocation, radiusKm]);

  const mapMarkers = useMemo(() =>
    filtered.filter(r => r.lat && r.lng).map(r => ({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      icon: r.type === "urgente" ? ICONS.abuseUrgent : ICONS.abuse,
      popupContent: (
        <div className="min-w-[180px] space-y-1">
          <div className="flex gap-1 flex-wrap mb-1">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.type === "urgente" ? "bg-red-100 text-red-700" : r.type === "anonima" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
              {typeConfig[r.type]?.label || r.type}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{statusLabels[r.status] || r.status}</span>
          </div>
          <p className="text-xs line-clamp-3">{r.description}</p>
          {r.address && <p className="text-xs text-gray-500">📍 {r.address}</p>}
          {r.created_date && (
            <p className="text-xs text-gray-400">{format(new Date(r.created_date), "d MMM yyyy", { locale: es })}</p>
          )}
          {r.tracking_code && <p className="text-xs font-mono text-gray-400">#{r.tracking_code}</p>}
        </div>
      ),
    })), [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Denuncias de Maltrato</h1>
          <p className="text-muted-foreground mt-1">Denunciá situaciones de maltrato animal</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTracking(true)}>
            <SearchIcon className="w-4 h-4 mr-2" /> Seguir denuncia
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-destructive hover:bg-destructive/90">
            <Plus className="w-4 h-4 mr-2" /> Reportar
          </Button>
        </div>
      </div>

      {/* Info card */}
      <Card className="p-5 bg-accent/5 border-accent/20">
        <p className="text-sm text-foreground/80">
          <strong>Ley 14.346:</strong> El maltrato animal es delito. Las denuncias pueden ser derivadas a{" "}
          <a href="https://denunciasweb.gob.ar" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            denunciasweb.gob.ar
          </a>{" "}
          (Ministerio Público Fiscal).
        </p>
      </Card>

      {/* View toggle + filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="lista"><List className="w-4 h-4 mr-1.5" />Lista</TabsTrigger>
            <TabsTrigger value="mapa"><Map className="w-4 h-4 mr-1.5" />Mapa</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 flex-wrap items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="anonima">Anónima</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="en_revision">En revisión</SelectItem>
              <SelectItem value="derivada">Derivada</SelectItem>
              <SelectItem value="resuelta">Resuelta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Proximity filter */}
      <ProximityFilter
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        userLocation={userLocation}
        onLocationFound={setUserLocation}
        onClearLocation={() => setUserLocation(null)}
      />

      {/* Map legend */}
      {view === "mapa" && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">🆘 <span className="text-red-500 font-medium">Urgente</span></span>
          <span className="flex items-center gap-1">⚠️ <span className="text-orange-500 font-medium">Regular / Anónima</span></span>
          {userLocation && <span className="flex items-center gap-1">📍 <span className="text-purple-600 font-medium">Tu ubicación</span></span>}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : view === "mapa" ? (
        <PetMap
          markers={mapMarkers}
          userLocation={userLocation}
          radiusKm={userLocation ? radiusKm : undefined}
          height="520px"
          center={userLocation || undefined}
        />
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hay denuncias con los filtros seleccionados.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((report, i) => {
            const tc = typeConfig[report.type] || typeConfig.regular;
            return (
              <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`p-5 ${tc.border}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={tc.color}>{tc.label}</Badge>
                        <Badge variant="outline">{statusLabels[report.status] || report.status}</Badge>
                        {report.tracking_code && (
                          <span className="text-xs text-muted-foreground font-mono">#{report.tracking_code}</span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-2">{report.description}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                        {report.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.address}</span>}
                        {report.created_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(report.created_date), "d MMM yyyy", { locale: es })}</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Reportar maltrato animal</DialogTitle>
          </DialogHeader>
          <AbuseReportForm onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ["abuseReports"] }); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={showTracking} onOpenChange={setShowTracking}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Seguir denuncia</DialogTitle>
          </DialogHeader>
          <TrackingLookup />
        </DialogContent>
      </Dialog>
    </div>
  );
}