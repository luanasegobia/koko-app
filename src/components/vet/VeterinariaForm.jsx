import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { veterinariaSchema } from "@/schemas";
import { db } from "@/api/supabaseClient";
import { mensajeDeError } from "@/lib/mensajeDeError";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import BotonUbicacion from "@/components/comun/BotonUbicacion";

/**
 * Edición de la propia ficha de veterinaria.
 *
 * El alta sigue ocurriendo dentro del onboarding de tipo de cuenta
 * "veterinario"; lo que faltaba era poder corregir después el horario, el
 * teléfono o los servicios. La política veterinary_update_owner_admin ya lo
 * permitía vía registered_by_user_id: no había interfaz.
 */
export default function VeterinariaForm({ registroInicial, onSuccess }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(veterinariaSchema),
    defaultValues: {
      name: registroInicial?.name ?? "",
      address: registroInicial?.address ?? "",
      phone: registroInicial?.phone ?? "",
      is_emergency: registroInicial?.is_emergency ?? false,
      services: registroInicial?.services ?? "",
      bio: registroInicial?.bio ?? "",
    },
  });

  const [ubicacion, setUbicacion] = useState({
    lat: registroInicial?.lat ?? undefined,
    lng: registroInicial?.lng ?? undefined,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (data) => {
    setSaving(true);
    setError(null);
    try {
      // is_verified queda deliberadamente afuera: lo decide administración.
      await db.entities.Veterinary.update(registroInicial.id, {
        ...data,
        lat: ubicacion.lat,
        lng: ubicacion.lng,
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
        <Label>Nombre de la veterinaria</Label>
        <Input {...register("name")} placeholder="Ej: Veterinaria San Roque" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Dirección</Label>
        <Input {...register("address")} placeholder="Ej: Av. San Martín 450, Orán" />
        {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
        <BotonUbicacion valor={ubicacion} onCambio={setUbicacion} />
      </div>

      <div className="space-y-1.5">
        <Label>Teléfono</Label>
        <Input {...register("phone")} placeholder="3878-..." />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Servicios</Label>
        <Input {...register("services")} placeholder="Ej: Cirugía, vacunación, análisis" />
      </div>

      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <Textarea {...register("bio")} rows={3} placeholder="Contá brevemente qué ofrecen" />
      </div>

      <div className="flex items-center justify-between rounded-xl border p-3">
        <div>
          <Label className="cursor-pointer">Atiende urgencias</Label>
          <p className="text-xs text-muted-foreground">Se muestra destacada para casos urgentes.</p>
        </div>
        <Controller
          name="is_emergency"
          control={control}
          render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">{error}</p>
      )}

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Guardar cambios
      </Button>
    </form>
  );
}
