const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Heart, Filter, PawPrint, Phone, Check, Syringe, Scissors, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdoptionForm from "@/components/adoption/AdoptionForm";
import { useChatManager } from "@/components/chat/ChatManager";

const sizeLabels = { pequeño: "Pequeño", mediano: "Mediano", grande: "Grande" };
const statusColors = { disponible: "bg-primary/10 text-primary", en_proceso: "bg-accent/10 text-accent", adoptado: "bg-muted text-muted-foreground" };

export default function Adoption() {
  const [showForm, setShowForm] = useState(false);
  const { openChat } = useChatManager();
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ["adoptionPets"],
    queryFn: () => db.entities.AdoptionPet.list("-created_date", 50),
  });