import React, { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mascotaPerdidaSchema } from "@/schemas";
import { db } from "@/api/supabaseClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, Camera } from "lucide-react";

export default function LostPetForm({ onSuccess, openCameraOnMount = false }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(mascotaPerdidaSchema),
    defaultValues: {
      pet_name: "", species: "perro", breed: "", age_years: "",
      description: "", last_seen_address: "", contact_phone: "", contact_whatsapp: "",
    },
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

  const onSubmit = async (data) => {
    setSaving(true);
    let photo_url = "";
    if (photo) {
      const res = await db.integrations.Core.UploadFile({ file: photo });
      photo_url = res.file_url;
    }
    await db.entities.LostPet.create({
      ...data,
      age_years: data.age_years || undefined,
      photo_url,
      status: "perdida",
    });
    setSaving(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Nombre</Label>
          <Input {...register("pet_name")} placeholder="Ej: Max" />
          {errors.pet_name && <p className="text-xs text-destructive">{errors.pet_name.message}</p>}
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Raza</Label>
          <Input {...register("breed")} placeholder="Ej: Labrador" />
        </div>
        <div className="space-y-1.5">
          <Label>Edad (años)</Label>
          <Input type="number" {...register("age_years")} placeholder="Ej: 2" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Descripción y señas particulares</Label>
        <Textarea {...register("description")} placeholder="Color, tamaño, collar..." rows={3} />
      </div>
      <div className="space-y-1.5">
        <Label>Última ubicación vista</Label>
        <Input {...register("last_seen_address")} placeholder="Ej: Av. San Martín y Belgrano, Orán" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <Input {...register("contact_phone")} placeholder="3878-..." />
        </div>
        <div className="space-y-1.5">
          <Label>WhatsApp</Label>
          <Input {...register("contact_whatsapp")} placeholder="3878-..." />
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