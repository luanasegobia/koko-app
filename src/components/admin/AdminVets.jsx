import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Stethoscope, MapPin, Phone, Clock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminVets({ vets, isLoading, onVerify, onRevoke, isPending }) {
  const [tab, setTab] = useState("pendientes");

  const pendientes = vets.filter(v => !v.is_verified);
  const verificadas = vets.filter(v => v.is_verified);
  const displayed = tab === "pendientes" ? pendientes : verificadas;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-center">
          <p className="text-2xl font-bold text-amber-600">{pendientes.length}</p>
          <p className="text-xs text-amber-600">Pendientes</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 text-center">
          <p className="text-2xl font-bold text-primary">{verificadas.length}</p>
          <p className="text-xs text-primary">Verificadas</p>
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
            {tab === "pendientes" ? "No hay veterinarias pendientes." : "No hay veterinarias verificadas aún."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayed.map((vet, i) => (
            <motion.div key={vet.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${vet.is_verified ? "border-primary/30" : "border-amber-300/50 bg-amber-50/30"}`}>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-heading font-bold text-lg">{vet.name}</h3>
                    <Badge className={vet.is_verified ? "bg-primary text-primary-foreground" : "bg-amber-100 text-amber-700 border border-amber-300"}>
                      {vet.is_verified ? <><ShieldCheck className="w-3 h-3 mr-1" />Verificada</> : <><Clock className="w-3 h-3 mr-1" />Pendiente</>}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{vet.address}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{vet.phone}</span>
                  </div>
                  {vet.bio && <p className="text-sm text-foreground/70">{vet.bio}</p>}
                  {vet.services && <p className="text-xs text-muted-foreground">Servicios: {vet.services}</p>}
                  {vet.created_date && (
                    <p className="text-xs text-muted-foreground">
                      Registrada el {new Date(vet.created_date).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {!vet.is_verified ? (
                    <Button size="sm" className="bg-primary" onClick={() => onVerify(vet)} disabled={isPending}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => onRevoke(vet)} disabled={isPending}>
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