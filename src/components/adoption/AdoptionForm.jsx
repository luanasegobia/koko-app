import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mascotaAdopcionSchema } from "@/schemas";
import { db } from "@/api/supabaseClient";
import { mensajeDeError } from "@/lib/mensajeDeError";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, Loader2 } from "lucide-react";

export default function AdoptionForm({ onSuccess, registroInicial = null }) {
  const editando = Boolean(registroInicial);

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(mascotaAdopcionSchema),
    defaultValues: {
      name: registroInicial?.name ?? "",
      species: registroInicial?.species ?? "perro",
      breed: registroInicial?.breed ?? "",
      age_years: registroInicial?.age_years ?? "",
      sex: registroInicial?.sex ?? "macho",
      size: registroInicial?.size ?? "mediano",
      description: registroInicial?.description ?? "",
      vaccinated: registroInicial?.vaccinated ?? false,
      sterilized: registroInicial?.sterilized ?? false,
      contact_name: registroInicial?.contact_name ?? "",
      contact_phone: registroInicial?.contact_phone ?? "",
      location: registroInicial?.location ?? "",
    },
  });

  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (data) => {
    setSaving(true);
    setError(null);
    try {
      let photo_url = registroInicial?.photo_url || "";
      if (photo) {
        const res = await db.storage.subirArchivo(photo);
        photo_url = res.file_url;
      }
      const campos = { ...data, age_years: data.age_years || undefined, photo_url };

      if (editando) {
        await db.entities.AdoptionPet.update(registroInicial.id, campos);
      } else {
        await db.entities.AdoptionPet.create({ ...campos, status: "disponible" });
      }
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
          <Input {...register("breed")} placeholder="Ej: Golden" />
        </div>
        <div className="space-y-1.5">
          <Label>Edad</Label>
          <Input type="number" {...register("age_years")} placeholder="Años" />
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
        <Label>Tamaño</Label>
        <Controller
          name="size"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pequeño">Pequeño</SelectItem>
                <SelectItem value="mediano">Mediano</SelectItem>
                <SelectItem value="grande">Grande</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <Textarea {...register("description")} placeholder="Temperamento, necesidades..." rows={3} />
      </div>
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <Controller
            name="vaccinated"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Label>Vacunado</Label>
        </div>
        <div className="flex items-center gap-2">
          <Controller
            name="sterilized"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Label>Esterilizado</Label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Tu nombre</Label>
          <Input {...register("contact_name")} />
        </div>
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <Input {...register("contact_phone")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Ubicación / Barrio</Label>
        <Input {...register("location")} placeholder="Ej: Barrio Centro, Orán" />
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
        {editando ? "Guardar cambios" : "Publicar"}
      </Button>
    </form>
  );
}
