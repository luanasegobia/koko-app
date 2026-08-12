import React, { useState } from "react";
import { db } from "@/api/supabaseClient";
import { mensajeDeError } from "@/lib/mensajeDeError";

import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, Check } from "lucide-react";
import BotonUbicacion from "@/components/comun/BotonUbicacion";

export default function SightingDialog({ pet, open, onClose }) {
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [ubicacion, setUbicacion] = useState({ lat: undefined, lng: undefined });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Antes esto era LostPet.update(), pero esa tabla solo deja actualizar a
      // quien publicó. O sea que la única persona habilitada a avisar que vio a
      // la mascota era su propia dueña, justo al revés de para qué existe la
      // función. Y como no había try/catch, el diálogo mostraba el tilde de
      // éxito mientras la operación fallaba en silencio.
      await db.rpc("agregar_avistamiento", {
        id_mascota: pet.id,
        direccion: address,
        nota: note || null,
        // Sin coordenadas el avistamiento igual se guarda y se ve en la
        // tarjeta; lo que no puede es aparecer en el mapa.
        lat: ubicacion.lat ?? null,
        lng: ubicacion.lng ?? null,
      });
      queryClient.invalidateQueries({ queryKey: ["lostPets"] });
      setDone(true);
      setTimeout(() => { setDone(false); onClose(); }, 1500);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setSaving(false);
    }
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
              <BotonUbicacion valor={ubicacion} onCambio={setUbicacion} />
            </div>
            <div className="space-y-1.5">
              <Label>Nota adicional (opcional)</Label>
              <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ej: Estaba cerca de la plaza..." rows={2} />
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">{error}</p>
            )}
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