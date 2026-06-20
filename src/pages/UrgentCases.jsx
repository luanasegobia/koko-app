const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, HandHeart, Copy, Check, Bell } from "lucide-react";
import { motion } from "framer-motion";
import UrgentCaseForm from "@/components/urgent/UrgentCaseForm";
import AlertSubscriptionPanel from "@/components/notifications/AlertSubscriptionPanel";
import QuickChat from "@/components/chat/QuickChat";

const statusConfig = { activo: { label: "Urgente", color: "bg-destructive text-destructive-foreground" }, en_curso: { label: "En curso", color: "bg-accent text-accent-foreground" }, resuelto: { label: "Resuelto", color: "bg-primary text-primary-foreground" } };
const needStatusIcon = { cubierto: "✓", parcial: "◑", pendiente: "✕" };
const needStatusColor = { cubierto: "text-primary", parcial: "text-accent", pendiente: "text-destructive" };

export default function UrgentCases() {
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["urgentCases"],
    queryFn: () => db.entities.UrgentCase.list("-created_date", 50),
  });

  const activeCases = cases.filter(c => c.status !== "resuelto");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">Casos Urgentes</h1>
            <p className="text-muted-foreground mt-1">Ayudá a animales en emergencia</p>
          </div>
          {activeCases.length > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">{activeCases.length} activos</Badge>
          )}
        </div>
        <Button onClick={() => isAuthenticated ? setShowForm(true) : db.auth.redirectToLogin(window.location.href)}>
          <Plus className="w-4 h-4 mr-2" /> Publicar nuevo caso
        </Button>
      </div>

      {/* Alert subscription */}
      <AlertSubscriptionPanel />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <Card className="p-12 text-center">
          <HandHeart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hay casos urgentes por el momento.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {cases.map((c, i) => (
            <UrgentCaseCard key={c.id} caseData={c} index={i} />
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Publicar caso urgente</DialogTitle>
          </DialogHeader>
          <UrgentCaseForm onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ["urgentCases"] }); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UrgentCaseCard({ caseData: c, index }) {
  const [copied, setCopied] = useState(false);
  const sc = statusConfig[c.status] || statusConfig.activo;
  const progress = c.goal_amount > 0 ? Math.min((c.raised_amount / c.goal_amount) * 100, 100) : 0;

  const copyAlias = () => {
    navigator.clipboard.writeText(c.donation_alias);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card className="p-5 space-y-4 hover:shadow-lg transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-heading font-bold text-lg">{c.title}</h3>
              <Badge className={sc.color}>{sc.label}</Badge>
            </div>
            {c.published_by && <p className="text-xs text-muted-foreground">Publicado por <strong>{c.published_by}</strong></p>}
          </div>
          {c.photo_url && <img src={c.photo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />}
        </div>

        <p className="text-sm text-foreground/80">{c.description}</p>

        {c.goal_amount > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Recaudado</span>
              <span className="font-bold">${c.raised_amount?.toLocaleString("es-AR") || 0} de ${c.goal_amount?.toLocaleString("es-AR")}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{Math.round(progress)}% alcanzado · {c.contributors_count || 0} personas colaboraron</p>
          </div>
        )}

        {c.needs?.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Ayuda necesaria</p>
            <div className="flex flex-wrap gap-2">
              {c.needs.map((need, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  <span className={`mr-1 ${needStatusColor[need.status]}`}>{needStatusIcon[need.status]}</span>
                  {need.label} {need.status === "parcial" ? "— parcial" : ""}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {c.donation_alias && (
          <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Alias para colaborar</p>
              <p className="font-mono font-bold">{c.donation_alias}</p>
            </div>
            <Button variant="outline" size="sm" onClick={copyAlias}>
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              <span className="ml-1">{copied ? "Copiado" : "Copiar"}</span>
            </Button>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="flex-1">
            <HandHeart className="w-4 h-4 mr-1" /> Ofrecer ayuda
          </Button>
          <Button variant="outline" className="flex-1">
            <Bell className="w-4 h-4 mr-1" /> Seguir caso
          </Button>
        </div>
        <QuickChat
          contextType="urgent_case"
          contextId={c.id}
          contextTitle={c.title}
          contextOwnerId={c.created_by_id}
        />
      </Card>
    </motion.div>
  );
}