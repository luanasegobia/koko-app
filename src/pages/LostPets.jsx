import React, { useState, useMemo } from "react";
import { db } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Map, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LostPetCard from "@/components/lost/LostPetCard";
import LostPetForm from "@/components/lost/LostPetForm";
import SightingDialog from "@/components/lost/SightingDialog";
import PetMap, { ICONS } from "@/components/map/PetMap";
import ProximityFilter from "@/components/map/ProximityFilter";
import AlertSubscriptionPanel from "@/components/notifications/AlertSubscriptionPanel";

function haversineKm([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LostPets() {
  const { isAuthenticated } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const actionParam = urlParams.get("action");
  const [showForm, setShowForm] = useState(actionParam === "report" || actionParam === "sighting");
  const [openCamera, setOpenCamera] = useState(actionParam === "sighting");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("perdida");
  const [sightingPet, setSightingPet] = useState(null);
  const [view, setView] = useState("lista");
  const [userLocation, setUserLocation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const queryClient = useQueryClient();

  const { data: lostPets = [], isLoading } = useQuery({
    queryKey: ["lostPets"],
    queryFn: () => db.entities.LostPet.list("-created_date", 100),
  });

  const filtered = useMemo(() => {
    return lostPets.filter(p => {
      if (speciesFilter !== "all" && p.species !== speciesFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (userLocation && p.last_seen_lat && p.last_seen_lng) {
        const dist = haversineKm(userLocation, [p.last_seen_lat, p.last_seen_lng]);
        if (dist > radiusKm) return false;
      }
      return true;
    });
  }, [lostPets, speciesFilter, statusFilter, userLocation, radiusKm]);

  const mapMarkers = useMemo(() =>
    filtered.filter(p => p.last_seen_lat && p.last_seen_lng).map(p => ({
      id: p.id,
      lat: p.last_seen_lat,
      lng: p.last_seen_lng,
      icon: p.status === "encontrada" ? ICONS.foundPet : ICONS.lostPet,
      popupContent: (
        <div className="space-y-1 min-w-[180px]">
          {p.photo_url && <img src={p.photo_url} alt={p.pet_name} className="w-full h-24 object-cover rounded mb-2" />}
          <p className="font-bold text-sm">{p.pet_name}</p>
          <p className="text-xs text-gray-500">{p.breed || p.species}</p>
          {p.last_seen_address && <p className="text-xs text-gray-500">📍 {p.last_seen_address}</p>}
          <div className="flex gap-1 pt-1 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${p.status === "encontrada" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {p.status === "encontrada" ? "Encontrada" : "Perdida"}
            </span>
          </div>
          {p.contact_phone && (
            <a href={`tel:${p.contact_phone}`} className="block text-xs text-blue-600 underline mt-1">📞 {p.contact_phone}</a>
          )}
        </div>
      ),
    })), [filtered]);

  const sightingMarkers = useMemo(() =>
    lostPets.flatMap(p =>
      (p.sightings || []).filter(s => s.lat && s.lng).map((s, i) => ({
        id: `${p.id}-s${i}`,
        lat: s.lat,
        lng: s.lng,
        icon: ICONS.sighting,
        popupContent: (
          <div>
            <p className="font-bold text-sm">Avistamiento de {p.pet_name}</p>
            {s.address && <p className="text-xs text-gray-500">📍 {s.address}</p>}
            {s.note && <p className="text-xs mt-1">{s.note}</p>}
          </div>
        ),
      }))
    ), [lostPets]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Mascotas Perdidas</h1>
          <p className="text-muted-foreground mt-1">Ayudá a encontrar mascotas perdidas en Orán</p>
        </div>
        <Button
          onClick={() => isAuthenticated ? setShowForm(true) : db.auth.redirectToLogin(window.location.href)}
          className="bg-destructive hover:bg-destructive/90"
        >
          <Plus className="w-4 h-4 mr-2" /> Reportar mascota perdida
        </Button>
      </div>

      {/* View toggle + filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="lista"><List className="w-4 h-4 mr-1.5" />Lista</TabsTrigger>
            <TabsTrigger value="mapa"><Map className="w-4 h-4 mr-1.5" />Mapa</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 flex-wrap items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Especie" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="perro">Perros</SelectItem>
              <SelectItem value="gato">Gatos</SelectItem>
              <SelectItem value="otro">Otros</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="perdida">Perdidas</SelectItem>
              <SelectItem value="encontrada">Encontradas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Alert subscription */}
      <AlertSubscriptionPanel />

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
          <span className="flex items-center gap-1">🐾 <span className="text-red-500 font-medium">Perdida</span></span>
          <span className="flex items-center gap-1">🐾 <span className="text-green-600 font-medium">Encontrada</span></span>
          <span className="flex items-center gap-1">👁️ <span className="font-medium">Avistamiento</span></span>
          {userLocation && <span className="flex items-center gap-1">📍 <span className="text-purple-600 font-medium">Tu ubicación</span></span>}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : view === "mapa" ? (
        <PetMap
          markers={[...mapMarkers, ...sightingMarkers]}
          userLocation={userLocation}
          radiusKm={userLocation ? radiusKm : undefined}
          height="520px"
          center={userLocation || undefined}
        />
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hay reportes con los filtros seleccionados.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((pet, i) => (
              <motion.div key={pet.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <LostPetCard pet={pet} onSighting={() => setSightingPet(pet)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Report Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Reportar mascota perdida</DialogTitle>
          </DialogHeader>
          <LostPetForm
            openCameraOnMount={openCamera}
            onSuccess={() => { setShowForm(false); setOpenCamera(false); queryClient.invalidateQueries({ queryKey: ["lostPets"] }); }}
          />
        </DialogContent>
      </Dialog>

      {sightingPet && (
        <SightingDialog pet={sightingPet} open={!!sightingPet} onClose={() => setSightingPet(null)} />
      )}
    </div>
  );
}