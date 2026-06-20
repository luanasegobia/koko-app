const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, Camera } from "lucide-react";

export default function LostPetForm({ onSuccess, openCameraOnMount = false }) {
  const [form, setForm] = useState({
    pet_name: "", species: "perro", breed: "", age_years: "",
    description: "", last_seen_address: "", contact_phone: "", contact_whatsapp: "",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (openCameraOnMount && cameraInputRef.current) {
      setTimeout(() => cameraInputRef.current.click(), 300);
    }
  }, [openCameraOnMount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    let photo_url = "";
    if (photo) {
      const res = await db.integrations.Core.UploadFile({ file: photo });
      photo_url = res.file_url;
    }
    await db.entities.LostPet.create({
      ...form,
      age_years: form.age_years ? Number(form.age_years) : undefined,
      photo_url,
      status: "perdida",
    });
    setSaving(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Nombre</Label>
          <Input value={form.pet_name} onChange={e => setForm({ ...form, pet_name: e.target.value })} required placeholder="Ej: Max" />
        </div>
        <div className="space-y-1.5">
          <Label>Especie</Label>
          <Select value={form.species} onValueChange={v => setForm({ ...form, species: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="perro">Perro</SelectItem>
              <SelectItem value="gato">Gato</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Raza</Label>
          <Input value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} placeholder="Ej: Labrador" />
        </div>
        <div className="space-y-1.5">
          <Label>Edad (años)</Label>
          <Input type="number" value={form.age_years} onChange={e => setForm({ ...form, age_years: e.target.value })} placeholder="Ej: 2" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Descripción y señas particulares</Label>
        <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Color, tamaño, collar..." rows={3} />
      </div>
      <div className="space-y-1.5">
        <Label>Última ubicación vista</Label>
        <Input value={form.last_seen_address} onChange={e => setForm({ ...form, last_seen_address: e.target.value })} placeholder="Ej: Av. San Martín y Belgrano, Orán" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <Input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} placeholder="3878-..." />
        </div>
        <div className="space-y-1.5">
          <Label>WhatsApp</Label>
          <Input value={form.contact_whatsapp} onChange={e => setForm({ ...form, contact_whatsapp: e.target.value })} placeholder="3878-..." />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Foto</Label>
        <div className="flex flex-col gap-2">
          {photoPreview && (
            <img src={photoPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border" />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => cameraInputRef.current.click()}
            >
              <Camera className="w-4 h-4 mr-2" />
              {photoPreview ? "Cambiar foto" : "Sacar foto"}
            </Button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  setPhoto(file);
                  setPhotoPreview(URL.createObjectURL(file));
                }
              }}
            />
          </div>
        </div>
      </div>
      <Button type="submit" disabled={saving} className="w-full bg-destructive hover:bg-destructive/90">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
        Publicar reporte
      </Button>
    </form>
  );
}