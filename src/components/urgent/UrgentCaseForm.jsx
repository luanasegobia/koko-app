const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Plus, X } from "lucide-react";

export default function UrgentCaseForm({ onSuccess }) {
  const [form, setForm] = useState({
    title: "", description: "", published_by: "", goal_amount: "",
    donation_alias: "",
  });
  const [needs, setNeeds] = useState([""]);
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
    await db.entities.UrgentCase.create({
      ...form,
      goal_amount: form.goal_amount ? Number(form.goal_amount) : 0,
      photo_url,
      needs: needs.filter(n => n.trim()).map(n => ({ label: n, status: "pendiente" })),
      status: "activo",
      raised_amount: 0,
      contributors_count: 0,
    });
    setSaving(false);
    onSuccess();
  };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5"><Label>Título del caso</Label><Input value={form.title} onChange={e => update("title", e.target.value)} required placeholder="Ej: Perrita encontrada en ruta 50" /></div>
      <div className="space-y-1.5"><Label>Descripción</Label><Textarea value={form.description} onChange={e => update("description", e.target.value)} required rows={3} placeholder="Detallá la situación, qué se necesita..." /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Publicado por</Label><Input value={form.published_by} onChange={e => update("published_by", e.target.value)} placeholder="Nombre u organización" /></div>
        <div className="space-y-1.5"><Label>Meta de recaudación ($)</Label><Input type="number" value={form.goal_amount} onChange={e => update("goal_amount", e.target.value)} placeholder="Ej: 45000" /></div>
      </div>
      <div className="space-y-1.5"><Label>Alias para donaciones</Label><Input value={form.donation_alias} onChange={e => update("donation_alias", e.target.value)} placeholder="Ej: rescatistas.oran" /></div>

      <div className="space-y-2">
        <Label>Tipo de ayuda necesaria</Label>
        {needs.map((need, idx) => (
          <div key={idx} className="flex gap-2">
            <Input value={need} onChange={e => { const n = [...needs]; n[idx] = e.target.value; setNeeds(n); }} placeholder="Ej: Traslado, Cirugía, Medicamentos..." />
            {needs.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => setNeeds(needs.filter((_, i) => i !== idx))}><X className="w-4 h-4" /></Button>}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setNeeds([...needs, ""])}><Plus className="w-3 h-3 mr-1" /> Agregar</Button>
      </div>

      <div className="space-y-1.5"><Label>Foto</Label><Input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} /></div>
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
        Publicar caso
      </Button>
    </form>
  );
}