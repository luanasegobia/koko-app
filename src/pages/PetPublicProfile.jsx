import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PawPrint, Phone, MessageCircle, AlertTriangle, MapPin, Loader2, Check } from "lucide-react";

export default function PetPublicProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split("/");
  const qrId = pathParts[pathParts.length - 1];
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ["publicPet", qrId],
    queryFn: () => base44.entities.Pet.filter({ qr_id: qrId }),
    enabled: !!qrId,
  });

  const pet = pets[0];

  const handleFoundReport = async () => {
    setReporting(true);
    // In a real scenario, this would send a notification to the owner
    setTimeout(() => {
      setReporting(false);
      setReported(true);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <PawPrint className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-heading text-xl font-bold mb-2">Mascota no encontrada</h2>
        <p className="text-muted-foreground">El código QR no corresponde a ninguna mascota registrada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <PawPrint className="w-5 h-5 text-primary" />
          <span className="text-primary font-heading font-bold text-sm">Conectando Huellas · Ficha pública</span>
        </div>
      </div>

      {pet.allergies && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <span className="text-destructive font-medium text-sm">{pet.allergies}</span>
        </div>
      )}

      <Card className="overflow-hidden">
        {pet.photo_url ? (
          <img src={pet.photo_url} alt={pet.name} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 bg-muted flex items-center justify-center">
            <PawPrint className="w-20 h-20 text-muted-foreground/20" />
          </div>
        )}
        <div className="p-5 text-center space-y-3">
          <h1 className="font-heading text-3xl font-bold">{pet.name}</h1>
          <p className="text-muted-foreground">
            {pet.breed || pet.species} · {pet.age_years ? `${pet.age_years} años` : ""} · {pet.sex === "macho" ? "Macho" : "Hembra"}
          </p>
          {pet.description && <p className="text-sm text-foreground/80">{pet.description}</p>}
        </div>
      </Card>

      {pet.owner_name && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {pet.owner_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{pet.owner_name}</p>
              <p className="text-sm text-muted-foreground">Dueño registrado</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        {pet.owner_phone && (
          <Button asChild className="w-full bg-primary hover:bg-primary/90">
            <a href={`tel:${pet.owner_phone}`}><Phone className="w-4 h-4 mr-2" /> Llamar</a>
          </Button>
        )}
        {pet.owner_whatsapp && (
          <Button asChild className="w-full bg-green-600 hover:bg-green-700">
            <a href={`https://wa.me/${pet.owner_whatsapp}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </a>
          </Button>
        )}
      </div>

      <Button
        onClick={handleFoundReport}
        disabled={reporting || reported}
        variant="outline"
        className="w-full border-accent text-accent hover:bg-accent/10"
      >
        {reported ? (
          <><Check className="w-4 h-4 mr-2" /> ¡Dueño notificado!</>
        ) : reporting ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Notificando...</>
        ) : (
          <><MapPin className="w-4 h-4 mr-2" /> Encontré esta mascota</>
        )}
      </Button>
    </div>
  );
}