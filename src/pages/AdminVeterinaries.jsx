import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Stethoscope, MapPin, Phone, Clock, ShieldCheck, ShieldX } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminVeterinaries() {
  const { user } = useAuth();
  const [tab, setTab] = useState("pendientes");
  const queryClient = useQueryClient();

  const { data: vets = [], isLoading } = useQuery({
    queryKey: ["admin-veterinaries"],
    queryFn: () => base44.entities.Veterinary.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Veterinary.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-veterinaries"] }),
  });

  // Solo admins
  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
        <ShieldX className="w-16 h-16 text-destructive" />
        <h2 className="font-heading text-xl font-bold">Acceso restringido</h2>
        <p className="text-muted-foreground">Solo los administradores pueden ver esta sección.</p>
      </div>
    );
  }

  const pendientes = vets.filter(v => !v.is_verified);
  const verificadas = vets.filter(v => v.is_verified);
  const displayed = tab === "pendientes" ? pendientes : verificadas;

  const handleVerify = (vet) => updateMutation.mutate({ id: vet.id, data: { is_verified: true } });
  const handleReject = (vet) => updateMutation.mutate({ id: vet.id, data: { is_verified: false } });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Verificación de Veterinarias</h1>
          <p className="text-muted-foreground mt-1">Revisá y aprobá los profesionales registrados</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendientes.length}</p>
            <p className="text-xs text-amber-600">Pendientes</p>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-center">
            <p className="text-2xl font-bold text-primary">{verificadas.length}</p>
            <p className="text-xs text-primary">Verificadas</p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pendientes">
            Pendientes
            {pendientes.length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendientes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="verificadas">Verificadas</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <Card className="p-12 text-center">
          <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {tab === "pendientes" ? "No hay veterinarias pendientes de verificación." : "No hay veterinarias verificadas aún."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayed.map((vet, i) => (
            <motion.div key={vet.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${vet.is_verified ? "border-primary/30" : "border-amber-300/50 bg-amber-50/30"}`}>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-heading font-bold text-lg">{vet.name}</h3>
                    <Badge className={vet.is_verified ? "bg-primary text-primary-foreground" : "bg-amber-100 text-amber-700 border border-amber-300"}>
                      {vet.is_verified ? (
                        <><ShieldCheck className="w-3 h-3 mr-1" />Verificada</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1" />Pendiente</>
                      )}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{vet.address}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{vet.phone}</span>
                  </div>
                  {vet.registered_by_user_id && (
                    <p className="text-xs text-muted-foreground">ID de usuario registrante: {vet.registered_by_user_id}</p>
                  )}
                  {vet.created_date && (
                    <p className="text-xs text-muted-foreground">Registrada el {new Date(vet.created_date).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {!vet.is_verified ? (
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground"
                      onClick={() => handleVerify(vet)}
                      disabled={updateMutation.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/40 hover:bg-destructive/10"
                      onClick={() => handleReject(vet)}
                      disabled={updateMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Revocar
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}