const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useCallback, useRef } from "react";

function haversineKm([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);

  // Load current user
  useEffect(() => {
    db.auth.me().then(setUser).catch(() => {});
  }, []);

  // Load existing notifications for user
  const loadNotifications = useCallback(async (uid) => {
    if (!uid) return;
    const notifs = await db.entities.AppNotification.filter(
      { user_id: uid },
      "-created_date",
      30
    );
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n) => !n.read).length);
  }, []);

  // Load subscription config
  const loadSubscription = useCallback(async (uid) => {
    if (!uid) return;
    const subs = await db.entities.AlertSubscription.filter({ user_id: uid });
    if (subs.length > 0) setSubscription(subs[0]);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    loadNotifications(user.id);
    loadSubscription(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // 1. New lost pets near user
    const unsubLost = db.entities.LostPet.subscribe(async (event) => {
      if (event.type !== "create") return;
      const pet = event.data;

      const subs = await db.entities.AlertSubscription.filter({ user_id: user.id });
      const sub = subs[0];
      if (!sub || !sub.notify_lost_pets) return;

      if (sub.lat && sub.lng && pet.last_seen_lat && pet.last_seen_lng) {
        const dist = haversineKm(
          [sub.lat, sub.lng],
          [pet.last_seen_lat, pet.last_seen_lng]
        );
        if (dist > (sub.radius_km || 5)) return;
      }

      const notif = await db.entities.AppNotification.create({
        user_id: user.id,
        type: "lost_pet",
        title: `🐾 Mascota perdida cerca tuyo`,
        body: `${pet.pet_name} (${pet.species}) fue reportada perdida en ${pet.last_seen_address || "tu zona"}.`,
        ref_id: event.id,
        link: "/perdidas",
        read: false,
      });
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    // 2. New/updated urgent cases
    const unsubUrgent = db.entities.UrgentCase.subscribe(async (event) => {
      const subs = await db.entities.AlertSubscription.filter({ user_id: user.id });
      const sub = subs[0];
      if (!sub || !sub.notify_urgent_cases) return;

      if (event.type === "create") {
        const notif = await db.entities.AppNotification.create({
          user_id: user.id,
          type: "urgent_case",
          title: `🆘 Nuevo caso urgente`,
          body: event.data.title,
          ref_id: event.id,
          link: "/casos-urgentes",
          read: false,
        });
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + 1);
      } else if (event.type === "update") {
        const notif = await db.entities.AppNotification.create({
          user_id: user.id,
          type: "case_update",
          title: `📢 Actualización en caso urgente`,
          body: `El caso "${event.data.title}" fue actualizado.`,
          ref_id: event.id,
          link: "/casos-urgentes",
          read: false,
        });
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + 1);
      }
    });

    // 3. Real-time: pick up AppNotifications created for this user (e.g. chat replies)
    const unsubNotif = db.entities.AppNotification.subscribe((event) => {
      if (event.type === "create" && event.data?.user_id === user.id) {
        setNotifications((prev) => {
          if (prev.find((n) => n.id === event.id)) return prev;
          return [event.data, ...prev];
        });
        setUnreadCount((c) => c + 1);
      }
    });

    return () => {
      unsubLost();
      unsubUrgent();
      unsubNotif();
    };
  }, [user?.id]);

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) => db.entities.AppNotification.update(n.id, { read: true }))
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [notifications, user?.id]);

  const markRead = useCallback(async (id) => {
    await db.entities.AppNotification.update(id, { read: true });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  return {
    notifications,
    unreadCount,
    user,
    subscription,
    markAllRead,
    markRead,
    reloadSubscription: () => loadSubscription(user?.id),
  };
}