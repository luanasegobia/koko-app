const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";

export default function PetForm({ onSuccess }) {
  const [form, setForm] = useState({
    name: "", species: "perro", breed: "", age_years: "", sex: "macho",
    description: "", allergies: "", owner_name: "", owner_phone: "", owner_whatsapp: "",
  });
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    let photo_url = "";
    if (photo) {
      const res = await db.integrations.Core.UploadFile({ file: photo });
      photo_url = res.file_url;
    }
    const qr_id = crypto.randomUUID().split("-")[0];
    await db.entities.Pet.create({
      ...form,
      age_years: form.age_years ? Number(form.age_years) : undefined,
      photo_url,
      qr_id,
    });
    setSaving(false);
    onSuccess();
  };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Nombre</Label><Input value={form.name} onChange={e => update("name", e.target.value)} required placeholder="Ej: Luna" /></div>
        <div className="space-y-1.5"><Label>Especie</Label>
          <Select value={form.species} onValueChange={v => update("species", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="perro">Perro</SelectItem><SelectItem value="gato">Gato</SelectItem><SelectItem value="otro">Otro</SelectItem></SelectContent></Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5"><Label>Raza</Label><Input value={form.breed} onChange={e => update("breed", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Edad</Label><Input type="number" value={form.age_years} onChange={e => update("age_years", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Sexo</Label>
          <Select value={form.sex} onValueChange={v => update("sex", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="macho">Macho</SelectItem><SelectItem value="hembra">Hembra</SelectItem></SelectContent></Select>
        </div>
      </div>
      <div className="space-y-1.5"><Label>Descripción</Label><Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} /></div>
      <div className="space-y-1.5"><Label>Alergias</Label><Input value={form.allergies} onChange={e => update("allergies", e.target.value)} placeholder="Ej: Alérgica a la amoxicilina" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Tu nombre</Label><Input value={form.owner_name} onChange={e => update("owner_name", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.owner_phone} onChange={e => update("owner_phone", e.target.value)} /></div>
      </div>
      <div className="space-y-1.5"><Label>WhatsApp</Label><Input value={form.owner_whatsapp} onChange={e => update("owner_whatsapp", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Foto</Label><Input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} /></div>
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
        Registrar mascota
      </Button>
    </form>
  );
}