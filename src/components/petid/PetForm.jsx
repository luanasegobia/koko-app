import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mascotaSchema } from "@/schemas";
import { db } from "@/api/supabaseClient";
import { mensajeDeError } from "@/lib/mensajeDeError";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";

export default function PetForm({ onSuccess }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(mascotaSchema),
    defaultValues: {
      name: "", species: "perro", breed: "", age_years: "",
      sex: "macho", description: "", allergies: "",
      owner_name: "", owner_phone: "", owner_whatsapp: "",
    },
  });

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
      // crypto.randomUUID no existe fuera de contexto seguro, y la app se prueba
      // desde el celular contra http://192.168.x.x.
      const qr_id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID().split("-")[0]
          : Math.random().toString(36).slice(2, 10);
      await db.entities.Pet.create({
        ...data,
        age_years: data.age_years || undefined,
        photo_url,
        qr_id,
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Nombre</Label>
          <Input {...register("name")} placeholder="Ej: Luna" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Especie</Label>
          <Controller
            name="species"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="perro">Perro</SelectItem>
                  <SelectItem value="gato">Gato</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Raza</Label>
          <Input {...register("breed")} />
        </div>
        <div className="space-y-1.5">
          <Label>Edad</Label>
          <Input type="number" {...register("age_years")} />
        </div>
        <div className="space-y-1.5">
          <Label>Sexo</Label>
          <Controller
            name="sex"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="hembra">Hembra</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <Textarea {...register("description")} rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label>Alergias</Label>
        <Input {...register("allergies")} placeholder="Ej: Alérgica a la amoxicilina" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Tu nombre</Label>
          <Input {...register("owner_name")} />
        </div>
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <Input {...register("owner_phone")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>WhatsApp</Label>
        <Input {...register("owner_whatsapp")} />
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
        Registrar mascota
      </Button>
    </form>
  );
}
