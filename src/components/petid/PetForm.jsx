import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mascotaSchema } from "@/schemas";
import { db } from "@/api/supabaseClient";

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

  const onSubmit = async (data) => {
    setSaving(true);
    let photo_url = "";
    if (photo) {
      const res = await db.integrations.Core.UploadFile({ file: photo });
      photo_url = res.file_url;
    }
    const qr_id = crypto.randomUUID().split("-")[0];
    await db.entities.Pet.create({
      ...data,
      age_years: data.age_years || undefined,
      photo_url,
      qr_id,
    });
    setSaving(false);
    onSuccess();
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
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
        Registrar mascota
      </Button>
    </form>
  );
}
