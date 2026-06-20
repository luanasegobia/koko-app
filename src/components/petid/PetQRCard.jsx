import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCode, Phone, MessageCircle, PawPrint, AlertTriangle, ExternalLink } from "lucide-react";

export default function PetQRCard({ pet }) {
  const publicUrl = `${window.location.origin}/ficha/${pet.qr_id || pet.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`;

  return (
    <Card className="p-5 border-purple-500/20 hover:shadow-lg transition-all">
      <div className="flex gap-4">
        <div className="shrink-0">
          {pet.photo_url ? (
            <img src={pet.photo_url} alt={pet.name} className="w-20 h-20 rounded-xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center">
              <PawPrint className="w-8 h-8 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-lg">{pet.name}</h3>
          <p className="text-muted-foreground text-sm">
            {pet.breed || pet.species} {pet.age_years ? `· ${pet.age_years} años` : ""} {pet.sex ? `· ${pet.sex === "macho" ? "♂" : "♀"}` : ""}
          </p>
          {pet.allergies && (
            <Badge variant="outline" className="mt-2 text-destructive border-destructive/30">
              <AlertTriangle className="w-3 h-3 mr-1" /> {pet.allergies}
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center">
        <img src={qrImageUrl} alt="QR Code" className="w-28 h-28 rounded-lg border" />
        <div className="space-y-2 flex-1 w-full">
          <p className="text-xs text-muted-foreground">Ficha pública:</p>
          <div className="bg-muted rounded-lg px-3 py-2 text-xs font-mono break-all">{publicUrl}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a href={qrImageUrl} download={`qr-${pet.name}.png`}><QrCode className="w-3.5 h-3.5 mr-1" /> Descargar QR</a>
            </Button>
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5 mr-1" /> Ver ficha</a>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}