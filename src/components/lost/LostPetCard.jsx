import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Eye, PawPrint } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import QuickChat from "@/components/chat/QuickChat";

export default function LostPetCard({ pet, onSighting }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-destructive/20">
      <div className="relative h-48 bg-muted">
        {pet.photo_url ? (
          <img src={pet.photo_url} alt={pet.pet_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PawPrint className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
          {pet.status === "encontrada" ? "Encontrada" : "Perdida"}
        </Badge>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-heading font-bold text-lg">{pet.pet_name}</h3>
          <p className="text-muted-foreground text-sm">
            {pet.breed || pet.species} {pet.age_years ? `· ${pet.age_years} años` : ""}
          </p>
        </div>
        {pet.last_seen_address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{pet.last_seen_address}</span>
          </div>
        )}
        {pet.description && (
          <p className="text-sm text-foreground/80 line-clamp-2">{pet.description}</p>
        )}
        <div className="flex gap-2 pt-2 flex-wrap">
          {pet.contact_phone && (
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a href={`tel:${pet.contact_phone}`}>
                <Phone className="w-3.5 h-3.5 mr-1" /> Llamar
              </a>
            </Button>
          )}
          <Button size="sm" onClick={onSighting} className="flex-1 bg-primary hover:bg-primary/90">
            <Eye className="w-3.5 h-3.5 mr-1" /> La vi
          </Button>

        </div>
        {pet.created_date && (
          <p className="text-xs text-muted-foreground text-center">
            Reportada {format(new Date(pet.created_date), "d 'de' MMM, yyyy", { locale: es })}
          </p>
        )}
      </div>
      <QuickChat
        contextType="lost_pet"
        contextId={pet.id}
        contextTitle={pet.pet_name}
      />
    </Card>
  );
}