import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, CheckCheck, Settings, PawPrint, AlertTriangle, Eye, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import AlertSettingsPanel from "./AlertSettingsPanel";

const typeIcon = {
  lost_pet: <PawPrint className="w-4 h-4 text-destructive" />,
  urgent_case: <AlertTriangle className="w-4 h-4 text-orange-500" />,
  sighting: <Eye className="w-4 h-4 text-amber-500" />,
  abuse_report: <ShieldAlert className="w-4 h-4 text-red-600" />,
};

const typeBg = {
  lost_pet: "bg-destructive/8",
  urgent_case: "bg-orange-500/8",
  sighting: "bg-amber-500/8",
  abuse_report: "bg-red-600/8",
};

export default function NotificationPanel({
  notifications, unreadCount, subscription, markAllRead, markRead, saveSubscription, deleteSubscription, onClose,
}) {
  const [tab, setTab] = useState("notifs");

  return (
    <div className="flex flex-col" style={{ maxHeight: 480 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="font-heading font-bold text-sm">Notificaciones</span>
          {unreadCount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0">{unreadCount}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs h-7 px-2 text-muted-foreground">
              <CheckCheck className="w-3.5 h-3.5 mr-1" /> Todo leído
            </Button>
          )}
          <Button
            variant={tab === "settings" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setTab(t => t === "settings" ? "notifs" : "settings")}
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {tab === "settings" ? (
        <AlertSettingsPanel subscription={subscription} onSave={saveSubscription} onDelete={deleteSubscription} />
      ) : (
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <BellOff className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Sin notificaciones</p>
              {!subscription && (
                <p className="text-xs text-muted-foreground px-4">
                  Activá las alertas desde <Button variant="link" size="sm" className="text-xs p-0 h-auto" onClick={() => setTab("settings")}>⚙ Configuración</Button>
                </p>
              )}
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors flex gap-3 items-start ${!n.read ? typeBg[n.type] || "bg-primary/5" : ""}`}
              >
                <div className="mt-0.5 shrink-0">{typeIcon[n.type] || <Bell className="w-4 h-4" />}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.read ? "font-semibold" : "font-normal"}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                  {n.created_date && (
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.created_date), { addSuffix: true, locale: es })}
                    </p>
                  )}
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}