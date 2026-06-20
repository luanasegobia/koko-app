import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/lib/useNotifications";
import NotificationPanel from "./NotificationPanel";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const notif = useNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-sidebar-foreground hover:bg-sidebar-accent">
          <Bell className="w-5 h-5" />
          {notif.unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {notif.unreadCount > 9 ? "9+" : notif.unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-[360px] p-0 shadow-xl"
        sideOffset={8}
      >
        <NotificationPanel {...notif} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}