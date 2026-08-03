import React, { useState } from "react";
import { db } from "@/api/supabaseClient";

import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, Check } from "lucide-react";

export default function SightingDialog({ pet, open, onClose }) {
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const sighting = {
      address,
      note,
      date: new Date().toISOString(),
    };
    const existing = pet.sightings || [];
    await db.entities.LostPet.update(pet.id, {
      sightings: [...existing, sighting],
    });
    queryClient.invalidateQueries({ queryKey: ["lostPets"] });
    setSaving(false);
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">¡Vi a {pet.pet_name}!</DialogTitle>
        </DialogHeader>
        {done ? (
          <div className="py-8 text-center">
            <Check className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="font-medium">¡Gracias por tu avistamiento!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>¿Dónde la viste?</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} required placeholder="Calle y barrio..." />
            </div>
            <div className="space-y-1.5">
              <Label>Nota adicional (opcional)</Label>
              <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ej: Estaba cerca de la plaza..." rows={2} />
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MapPin className="w-4 h-4 mr-2" />}
              Enviar avistamiento
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}