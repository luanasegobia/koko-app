import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const typeIcons = {
  lost_pet: "🐾",
  urgent_case: "🆘",
  sighting: "👁️",
  case_update: "📢",
  chat_reply: "💬",
};

export default function NotificationList({ notifications, onMarkAllRead, onMarkRead, onClose }) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="font-heading font-bold text-sm">Notificaciones</span>
          {unread > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-xs h-5 px-1.5">
              {unread}
            </Badge>
          )}
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="text-xs h-7 px-2 text-muted-foreground">
            <CheckCheck className="w-3.5 h-3.5 mr-1" /> Marcar todo leído
          </Button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Sin notificaciones por el momento
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                onClick={() => {
                  if (!n.read) onMarkRead(n.id);
                  onClose();
                }}
              >
                {/* Icon */}
                <span className="text-xl mt-0.5 shrink-0">{typeIcons[n.type] || "🔔"}</span>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-tight ${!n.read ? "font-semibold" : "font-medium"}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body || n.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {n.created_date && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_date), { addSuffix: true, locale: es })}
                      </span>
                    )}
                    {n.link && (
                      <Link
                        to={n.link}
                        className="text-xs text-primary flex items-center gap-0.5 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
                {/* Unread dot */}
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </>
  );
}