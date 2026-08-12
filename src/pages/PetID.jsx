import React, { useState } from "react";
import { db } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import PetForm from "@/components/petid/PetForm";
import PetQRCard from "@/components/petid/PetQRCard";
import AccionesDeDuenio from "@/components/comun/AccionesDeDuenio";

export default function PetID() {
  const [showForm, setShowForm] = useState(false);
  const [enEdicion, setEnEdicion] = useState(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Antes esto era Pet.list(), pero la política de lectura de la tabla es
  // abierta: bajo el título "mis mascotas" se veían las de TODO el mundo, con
  // el teléfono y el WhatsApp de sus dueños, y el QR ajeno. Estaba tapado
  // porque la tabla venía vacía.
  const { data: pets = [], isLoading } = useQuery({
    queryKey: ["misMascotas", user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => db.entities.Pet.filter({ created_by_id: user.id }, "-created_at", 50),
  });

  const refrescar = () => queryClient.invalidateQueries({ queryKey: ["misMascotas", user?.id] });

  const cerrarFormulario = () => {
    setShowForm(false);
    setEnEdicion(null);
    refrescar();
  };

  const eliminar = async (mascota) => {
    await db.entities.Pet.delete(mascota.id);
    refrescar();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Identificación Digital</h1>
          <p className="text-muted-foreground mt-1">Registrá tu mascota y generá un QR para su collar</p>
        </div>
        <Button onClick={() => { setEnEdicion(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Registrar mascota
        </Button>
      </div>

      {/* How it works */}
      <Card className="p-6 bg-purple-500/5 border-purple-500/20">
        <h3 className="font-heading font-bold mb-4">¿Cómo funciona?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "1", text: "Registrá tu mascota con sus datos y foto" },
            { step: "2", text: "Se genera un QR único descargable e imprimible" },
            { step: "3", text: "Quien encuentre tu mascota escanea y te contacta" },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold shrink-0">{item.step}</div>
              <p className="text-sm text-foreground/80">{item.text}</p>
            </div>
          ))}
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : pets.length === 0 ? (
        <Card className="p-12 text-center">
          <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No tenés mascotas registradas todavía.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pets.map((pet, i) => (
            <motion.div key={pet.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative">
              <div className="absolute top-3 right-3 z-10">
                <AccionesDeDuenio
                  registro={pet}
                  etiqueta={`la ficha de ${pet.name}`}
                  onEditar={() => { setEnEdicion(pet); setShowForm(true); }}
                  onEliminar={() => eliminar(pet)}
                />
              </div>
              <PetQRCard pet={pet} />
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(abierto) => { if (!abierto) { setShowForm(false); setEnEdicion(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {enEdicion ? `Editar a ${enEdicion.name}` : "Registrar mascota"}
            </DialogTitle>
          </DialogHeader>
          <PetForm key={enEdicion?.id || "nueva"} registroInicial={enEdicion} onSuccess={cerrarFormulario} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
