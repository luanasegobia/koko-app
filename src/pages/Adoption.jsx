import React, { useState } from "react";
import { db } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Heart, Filter, PawPrint, Phone, Syringe, Scissors, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdoptionForm from "@/components/adoption/AdoptionForm";
import { useChatManager } from "@/components/chat/ChatManager";

const sizeLabels = { pequeño: "Pequeño", mediano: "Mediano", grande: "Grande" };
const statusColors = { disponible: "bg-primary/10 text-primary", en_proceso: "bg-accent/10 text-accent", adoptado: "bg-muted text-muted-foreground" };

export default function Adoption() {
  const [showForm, setShowForm] = useState(false);
  const { openChat } = useChatManager();
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ["adoptionPets"],
    queryFn: () => db.entities.AdoptionPet.list("-created_date", 50),
  });

  const filtered = pets.filter(p => {
    if (speciesFilter !== "all" && p.species !== speciesFilter) return false;
    if (sizeFilter !== "all" && p.size !== sizeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Adopción</h1>
          <p className="text-muted-foreground mt-1">Encontrá a tu nuevo compañero</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Publicar en adopción
        </Button>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
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
        <Select value={sizeFilter} onValueChange={setSizeFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Tamaño" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pequeño">Pequeño</SelectItem>
            <SelectItem value="mediano">Mediano</SelectItem>
            <SelectItem value="grande">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hay mascotas en adopción por el momento.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((pet, i) => (
              <motion.div key={pet.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-primary/20">
                  <div className="relative h-48 bg-muted">
                    {pet.photo_url ? (
                      <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PawPrint className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                    <Badge className={`absolute top-3 left-3 ${statusColors[pet.status] || statusColors.disponible}`}>
                      {pet.status === "en_proceso" ? "En proceso" : pet.status === "adoptado" ? "Adoptado" : "Disponible"}
                    </Badge>
                    {pet.sex && (
                      <Badge variant="outline" className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm">
                        {pet.sex === "macho" ? "♂ Macho" : "♀ Hembra"}
                      </Badge>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-heading font-bold text-lg">{pet.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {pet.breed || pet.species} {pet.age_years ? `· ${pet.age_years} años` : ""} {pet.size ? `· ${sizeLabels[pet.size]}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {pet.vaccinated && <Badge variant="secondary" className="text-xs"><Syringe className="w-3 h-3 mr-1" />Vacunado</Badge>}
                      {pet.sterilized && <Badge variant="secondary" className="text-xs"><Scissors className="w-3 h-3 mr-1" />Esterilizado</Badge>}
                    </div>
                    {pet.description && <p className="text-sm text-foreground/80 line-clamp-2">{pet.description}</p>}
                    <div className="flex gap-2">
                      {pet.contact_phone && (
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <a href={`tel:${pet.contact_phone}`}><Phone className="w-3.5 h-3.5 mr-1" /> Contactar</a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openChat({ contextType: "adoption", contextId: pet.id, contextTitle: pet.name })}
                      >
                        <MessageCircle className="w-3.5 h-3.5 mr-1" /> Chat
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Publicar mascota en adopción</DialogTitle>
          </DialogHeader>
          <AdoptionForm onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ["adoptionPets"] }); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}