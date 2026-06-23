import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, QrCode, PawPrint, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import PetForm from "@/components/petid/PetForm";
import PetQRCard from "@/components/petid/PetQRCard";

export default function PetID() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ["myPets"],
    queryFn: () => base44.entities.Pet.list("-created_date", 50),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Identificación Digital</h1>
          <p className="text-muted-foreground mt-1">Registrá tu mascota y generá un QR para su collar</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
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
            <motion.div key={pet.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <PetQRCard pet={pet} />
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Registrar mascota</DialogTitle>
          </DialogHeader>
          <PetForm onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ["myPets"] }); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}