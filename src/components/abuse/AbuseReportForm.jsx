import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { denunciaSchema } from "@/schemas";
import { db } from "@/api/supabaseClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Loader2, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AbuseReportForm({ onSuccess }) {
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    resolver: zodResolver(denunciaSchema),
    defaultValues: {
      type: "urgente", description: "", address: "",
      reporter_name: "", reporter_phone: "",
    },
  });

  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [trackingCode, setTrackingCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const formType = watch("type");

  const onSubmit = async (data) => {
    setSaving(true);
    let evidence_urls = [];
    for (const file of files) {
      const res = await db.integrations.Core.UploadFile({ file });
      evidence_urls.push(res.file_url);
    }
    const tracking_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await db.entities.AbuseReport.create({
      ...data,
      evidence_urls,
      tracking_code,
      status: "pendiente",
      reporter_name: data.type === "anonima" ? undefined : data.reporter_name,
      reporter_phone: data.type === "anonima" ? undefined : data.reporter_phone,
    });
    setSaving(false);
    setTrackingCode(tracking_code);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (trackingCode) {
    return (
      <div className="py-6 text-center space-y-4">
        <Check className="w-12 h-12 text-primary mx-auto" />
        <h3 className="font-heading font-bold text-lg">Denuncia enviada</h3>
        <p className="text-sm text-muted-foreground">Tu código de seguimiento es:</p>
        <div className="flex items-center justify-center gap-2">
          <span className="font-mono text-2xl font-bold text-primary">{trackingCode}</span>
          <Button variant="ghost" size="icon" onClick={copyCode}>
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Guardá este código para consultar el estado de tu denuncia.</p>
        <Button onClick={onSuccess} className="w-full">Cerrar</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Tipo de situación</Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Tabs value={field.value} onValueChange={field.onChange}>
              <TabsList className="w-full">
                <TabsTrigger value="urgente" className="flex-1">Urgente</TabsTrigger>
                <TabsTrigger value="regular" className="flex-1">Regular</TabsTrigger>
                <TabsTrigger value="anonima" className="flex-1">Anónima</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        />
        {formType === "urgente" && (
          <p className="text-xs text-destructive">Se notifica a proteccionistas y municipio.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <Textarea {...register("description")} placeholder="Describí la situación..." rows={4} />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Ubicación</Label>
        <Input {...register("address")} placeholder="Ej: Av. San Martín, Orán" />
      </div>

      {formType !== "anonima" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tu nombre</Label>
            <Input {...register("reporter_name")} />
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input {...register("reporter_phone")} />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Evidencia (fotos/videos)</Label>
        <Input type="file" accept="image/*,video/*" multiple onChange={e => setFiles(Array.from(e.target.files))} />
      </div>

      <Button type="submit" disabled={saving} className="w-full bg-destructive hover:bg-destructive/90">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
        Enviar denuncia {formType === "urgente" ? "urgente" : ""}
      </Button>
    </form>
  );
}
