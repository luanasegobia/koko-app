import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { casoUrgenteSchema } from "@/schemas";
import { db } from "@/api/supabaseClient";
import { mensajeDeError } from "@/lib/mensajeDeError";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Plus, X } from "lucide-react";

export default function UrgentCaseForm({ onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(casoUrgenteSchema),
    defaultValues: {
      title: "", description: "", published_by: "", goal_amount: "",
      donation_alias: "",
    },
  });

  const [needs, setNeeds] = useState([""]);
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (data) => {
    setSaving(true);
    setError(null);
    try {
      let photo_url = "";
      if (photo) {
        const res = await db.storage.subirArchivo(photo);
        photo_url = res.file_url;
      }
      await db.entities.UrgentCase.create({
        ...data,
        goal_amount: data.goal_amount || 0,
        photo_url,
        needs: needs.filter(n => n.trim()).map(n => ({ label: n, status: "pendiente" })),
        status: "activo",
        raised_amount: 0,
        contributors_count: 0,
      });
      onSuccess();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Título del caso</Label>
        <Input {...register("title")} placeholder="Ej: Perrita encontrada en ruta 50" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <Textarea {...register("description")} rows={3} placeholder="Detallá la situación, qué se necesita..." />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Publicado por</Label>
          <Input {...register("published_by")} placeholder="Nombre u organización" />
        </div>
        <div className="space-y-1.5">
          <Label>Meta de recaudación ($)</Label>
          <Input type="number" {...register("goal_amount")} placeholder="Ej: 45000" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Alias para donaciones</Label>
        <Input {...register("donation_alias")} placeholder="Ej: rescatistas.oran" />
      </div>

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

      <div className="space-y-1.5">
        <Label>Foto</Label>
        <Input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} />
      </div>
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">{error}</p>
      )}
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
        Publicar caso
      </Button>
    </form>
  );
}
