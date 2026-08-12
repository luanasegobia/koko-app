import React from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useNotificationsCompartidas } from "@/lib/NotificationsContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AlertSettingsPanel from "./AlertSettingsPanel";

/**
 * Este componente reimplementaba a mano lo que useNotifications ya hacía, contra
 * la misma tabla y con estado propio, así que ambos podían quedar
 * desincronizados.
 *
 * Además llamaba a db.auth.me() y accedía a u.id sin protección: como se monta
 * en páginas PÚBLICAS (/perdidas y /casos-urgentes), cualquier visitante sin
 * sesión producía un TypeError. El test existente lo tapaba porque simulaba
 * siempre una sesión iniciada.
 */
export default function AlertSubscriptionPanel() {
  const { isAuthenticated } = useAuth();
  const { subscription, saveSubscription, deleteSubscription } = useNotificationsCompartidas();

  if (!isAuthenticated) {
    return (
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-heading font-semibold">Recibí alertas de tu zona</p>
            <p className="text-sm text-muted-foreground">
              Entrá a tu cuenta para que te avisemos cuando haya novedades cerca tuyo.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link to="/login">Iniciar sesión</Link>
        </Button>
      </Card>
    );
  }

  return (
    <AlertSettingsPanel
      subscription={subscription}
      onSave={saveSubscription}
      onDelete={deleteSubscription}
    />
  );
}
