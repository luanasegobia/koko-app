const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PawPrint, Phone, MessageCircle, AlertTriangle, MapPin, Loader2, Check } from "lucide-react";

export default function PetPublicProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split("/");
  const qrId = pathParts[pathParts.length - 1];
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ["publicPet", qrId],
    queryFn: () => db.entities.Pet.filter({ qr_id: qrId }),
    enabled: !!qrId,
  });

  const pet = pets[0];

  const handleFoundReport = async () => {
    setReporting(true);
    // In a real scenario, this would send a notification to the owner
    setTimeout(() => {
      setReporting(false);