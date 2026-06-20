const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, Loader2 } from "lucide-react";

export default function AdoptionForm({ onSuccess }) {
  const [form, setForm] = useState({
    name: "", species: "perro", breed: "", age_years: "", sex: "macho",
    size: "mediano", description: "", vaccinated: false, sterilized: false,
    contact_name: "", contact_phone: "", location: "",
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
    await db.entities.AdoptionPet.create({
      ...form,
      age_years: form.age_years ? Number(form.age_years) : undefined,
      photo_url,
      status: "disponible",
    });
    setSaving(false);
    onSuccess();
  };

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Nombre</Label><Input value={form.name} onChange={e => update("name", e.target.value)} required placeholder="Ej: Luna" /></div>
        <div className="space-y-1.5"><Label>Especie</Label>
          <Select value={form.species} onValueChange={v => update("species", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="perro">Perro</SelectItem><SelectItem value="gato">Gato</SelectItem><SelectItem value="otro">Otro</SelectItem></SelectContent></Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5"><Label>Raza</Label><Input value={form.breed} onChange={e => update("breed", e.target.value)} placeholder="Ej: Golden" /></div>
        <div className="space-y-1.5"><Label>Edad</Label><Input type="number" value={form.age_years} onChange={e => update("age_years", e.target.value)} placeholder="Años" /></div>
        <div className="space-y-1.5"><Label>Sexo</Label>
          <Select value={form.sex} onValueChange={v => update("sex", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="macho">Macho</SelectItem><SelectItem value="hembra">Hembra</SelectItem></SelectContent></Select>
        </div>
      </div>
      <div className="space-y-1.5"><Label>Tamaño</Label>
        <Select value={form.size} onValueChange={v => update("size", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pequeño">Pequeño</SelectItem><SelectItem value="mediano">Mediano</SelectItem><SelectItem value="grande">Grande</SelectItem></SelectContent></Select>
      </div>
      <div className="space-y-1.5"><Label>Descripción</Label><Textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Temperamento, necesidades..." rows={3} /></div>
      <div className="flex gap-6">
        <div className="flex items-center gap-2"><Switch checked={form.vaccinated} onCheckedChange={v => update("vaccinated", v)} /><Label>Vacunado</Label></div>
        <div className="flex items-center gap-2"><Switch checked={form.sterilized} onCheckedChange={v => update("sterilized", v)} /><Label>Esterilizado</Label></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Tu nombre</Label><Input value={form.contact_name} onChange={e => update("contact_name", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.contact_phone} onChange={e => update("contact_phone", e.target.value)} /></div>
      </div>
      <div className="space-y-1.5"><Label>Ubicación / Barrio</Label><Input value={form.location} onChange={e => update("location", e.target.value)} placeholder="Ej: Barrio Centro, Orán" /></div>
      <div className="space-y-1.5"><Label>Foto</Label><Input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} /></div>
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
        Publicar
      </Button>
    </form>
  );
}