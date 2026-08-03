import React, { useState } from "react";
import { db } from "@/api/supabaseClient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HandHeart, PawPrint, ShieldAlert, MapPin, User } from "lucide-react";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const urgentStatusLabels = { activo: "Activo", en_curso: "En curso", resuelto: "Resuelto" };
const urgentStatusColors = {
  activo: "bg-green-100 text-green-700 border-green-300",
  en_curso: "bg-blue-100 text-blue-700 border-blue-300",
  resuelto: "bg-muted text-muted-foreground",
};
const lostStatusColors = {
  perdida: "bg-destructive/10 text-destructive border-destructive/30",
  encontrada: "bg-primary/10 text-primary border-primary/30",
};
const reportStatusLabels = { pendiente: "Pendiente", en_revision: "En revisión", derivada: "Derivada", resuelta: "Resuelta" };
const reportStatusColors = {
  pendiente: "bg-amber-100 text-amber-700 border-amber-300",
  en_revision: "bg-blue-100 text-blue-700 border-blue-300",
  derivada: "bg-purple-100 text-purple-700 border-purple-300",
  resuelta: "bg-muted text-muted-foreground",
};

export default function AdminCases({ urgentCases, lostPets, reports, isLoading, onUpdateCase, onUpdateLost, isCasePending, isLostPending }) {
  const [tab, setTab] = useState("urgentes");

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="urgentes">
            Casos Urgentes
            <span className="ml-1.5 text-xs text-muted-foreground">({urgentCases.length})</span>
          </TabsTrigger>
          <TabsTrigger value="perdidas">
            Mascotas Perdidas
            <span className="ml-1.5 text-xs text-muted-foreground">({lostPets.length})</span>
          </TabsTrigger>
          <TabsTrigger value="denuncias">
            Denuncias
            {reports.filter(r => r.status === "pendiente").length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {reports.filter(r => r.status === "pendiente").length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "urgentes" && (
        <div className="space-y-3">
          {urgentCases.length === 0 ? (
            <Card className="p-12 text-center"><HandHeart className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No hay casos urgentes.</p></Card>
          ) : urgentCases.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {c.photo_url && <img src={c.photo_url} alt={c.title} className="w-20 h-20 object-cover rounded-lg shrink-0" />}
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading font-semibold">{c.title}</h3>
                    <Badge className={`border text-xs ${urgentStatusColors[c.status]}`}>{urgentStatusLabels[c.status]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                  {c.published_by && <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{c.published_by}</p>}
                  {c.created_date && <p className="text-xs text-muted-foreground">{format(new Date(c.created_date), "d MMM yyyy", { locale: es })}</p>}
                </div>
                <div className="shrink-0">
                  <Select value={c.status} onValueChange={(val) => onUpdateCase(c.id, { status: val })} disabled={isCasePending}>
                    <SelectTrigger className="w-36 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="en_curso">En curso</SelectItem>
                      <SelectItem value="resuelto">Resuelto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "perdidas" && (
        <div className="space-y-3">
          {lostPets.length === 0 ? (
            <Card className="p-12 text-center"><PawPrint className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No hay mascotas reportadas.</p></Card>
          ) : lostPets.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {p.photo_url && <img src={p.photo_url} alt={p.pet_name} className="w-20 h-20 object-cover rounded-lg shrink-0" />}
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading font-semibold">{p.pet_name}</h3>
                    <Badge className={`border text-xs ${lostStatusColors[p.status]}`}>{p.status === "perdida" ? "Perdida" : "Encontrada"}</Badge>
                    <Badge variant="outline" className="text-xs">{p.species}</Badge>
                  </div>
                  {p.last_seen_address && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{p.last_seen_address}</p>}
                  {p.created_date && <p className="text-xs text-muted-foreground">{format(new Date(p.created_date), "d MMM yyyy", { locale: es })}</p>}
                </div>
                <div className="shrink-0">
                  <Select value={p.status} onValueChange={(val) => onUpdateLost(p.id, { status: val })} disabled={isLostPending}>
                    <SelectTrigger className="w-36 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perdida">Perdida</SelectItem>
                      <SelectItem value="encontrada">Encontrada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "denuncias" && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <Card className="p-12 text-center"><ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No hay denuncias registradas.</p></Card>
          ) : reports.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`border text-xs ${reportStatusColors[r.status]}`}>{reportStatusLabels[r.status]}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{r.type}</Badge>
                    {r.tracking_code && <span className="text-xs font-mono text-muted-foreground">#{r.tracking_code}</span>}
                  </div>
                  <p className="text-sm text-foreground/80 line-clamp-3">{r.description}</p>
                  {r.address && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{r.address}</p>}
                  {r.reporter_name && <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{r.reporter_name} {r.reporter_phone && `· ${r.reporter_phone}`}</p>}
                  {r.created_date && <p className="text-xs text-muted-foreground">{format(new Date(r.created_date), "d MMM yyyy", { locale: es })}</p>}
                  {r.evidence_urls?.length > 0 && (
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {r.evidence_urls.slice(0, 3).map((url, j) => (
                        <a key={j} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="evidencia" className="w-14 h-14 object-cover rounded-md border" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  <Select
                    value={r.status}
                    onValueChange={(val) => db.entities.AbuseReport.update(r.id, { status: val })}
                  >
                    <SelectTrigger className="w-36 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="en_revision">En revisión</SelectItem>
                      <SelectItem value="derivada">Derivada</SelectItem>
                      <SelectItem value="resuelta">Resuelta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}