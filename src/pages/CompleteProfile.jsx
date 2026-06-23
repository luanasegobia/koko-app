import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { PawPrint, ArrowRight, Loader2, Clock } from "lucide-react";
import RoleSelector from "@/components/onboarding/RoleSelector";

export default function CompleteProfile() {
  const { reloadUser } = useAuth();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("usuario");
  const [form, setForm] = useState({
    organization_name: "",
    bio: "",
    phone: "",
    location: "",
    // Campos veterinario
    vet_clinic_name: "",
    vet_address: "",
    vet_phone: "",
    vet_services: "",
  });
  const [saving, setSaving] = useState(false);

  const handleNext = () => setStep(2);

  const handleSave = async () => {
    setSaving(true);
    const data = {
      role,
      profile_completed: true,
      bio: form.bio,
      phone: form.phone,
      location: form.location,
    };
    if (role === "organizacion") data.organization_name = form.organization_name;

    await base44.auth.updateMe(data);

    // Si es veterinario, crear registro en Veterinary pendiente de verificación
    if (role === "veterinario") {
      const me = await base44.auth.me();
      await base44.entities.Veterinary.create({
        name: form.vet_clinic_name,
        address: form.vet_address,
        phone: form.vet_phone || form.phone,
        is_verified: false,
        registered_by_user_id: me.id,
        services: form.vet_services,
        bio: form.bio,
      });
    }

    await reloadUser?.();
    window.location.href = "/";
  };

  const isVet = role === "veterinario";

  const canSubmit = () => {
    if (role === "organizacion" && !form.organization_name) return false;
    if (isVet && (!form.vet_clinic_name || !form.vet_address)) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
            <PawPrint className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold">¡Bienvenido/a!</h1>
          <p className="text-muted-foreground mt-1">Contanos un poco sobre vos para personalizar tu experiencia</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-2">
            <div className="flex gap-2 mb-2">
              {[1, 2].map(s => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
            <CardTitle className="text-lg font-heading">
              {step === 1 ? "¿Cuál es tu rol?" : isVet ? "Datos de tu clínica / consultorio" : "Datos de contacto"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {step === 1 ? (
              <>
                <RoleSelector selected={role} onSelect={setRole} />
                <Button className="w-full" onClick={handleNext}>
                  Continuar <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            ) : isVet ? (
              <>
                {/* Aviso de verificación */}
                <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Tu perfil será <strong>revisado por un administrador</strong> antes de aparecer en el directorio público.</span>
                </div>

                <div className="space-y-1">
                  <Label>Nombre de la clínica / consultorio *</Label>
                  <Input
                    placeholder="Ej: Clínica Veterinaria San Roque"
                    value={form.vet_clinic_name}
                    onChange={e => setForm(f => ({ ...f, vet_clinic_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Dirección *</Label>
                  <Input
                    placeholder="Ej: Av. Libertad 450, Orán"
                    value={form.vet_address}
                    onChange={e => setForm(f => ({ ...f, vet_address: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Teléfono de la clínica</Label>
                  <Input
                    placeholder="+54 9 387 ..."
                    value={form.vet_phone}
                    onChange={e => setForm(f => ({ ...f, vet_phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Servicios que brindás <span className="text-muted-foreground">(opcional)</span></Label>
                  <Textarea
                    placeholder="Ej: consultas generales, cirugías, vacunación, odontología, guardia 24h, ecografías..."
                    rows={3}
                    value={form.vet_services}
                    onChange={e => setForm(f => ({ ...f, vet_services: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Descripción / bio <span className="text-muted-foreground">(opcional)</span></Label>
                  <Textarea
                    placeholder="Años de experiencia, especialidades, presentación..."
                    rows={2}
                    value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Atrás</Button>
                  <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={saving || !canSubmit()}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Enviar para revisión
                  </Button>
                </div>
              </>
            ) : (
              <>
                {role === "organizacion" && (
                  <div className="space-y-1">
                    <Label>Nombre de la organización *</Label>
                    <Input
                      placeholder="Ej: Rescate Animal Buenos Aires"
                      value={form.organization_name}
                      onChange={e => setForm(f => ({ ...f, organization_name: e.target.value }))}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label>Teléfono / WhatsApp</Label>
                  <Input
                    placeholder="+54 9 11 ..."
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Zona / Barrio</Label>
                  <Input
                    placeholder="Ej: Palermo, CABA"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Bio breve <span className="text-muted-foreground">(opcional)</span></Label>
                  <Textarea
                    placeholder="Contanos algo sobre vos..."
                    rows={3}
                    value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Atrás</Button>
                  <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={saving || !canSubmit()}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Comenzar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}