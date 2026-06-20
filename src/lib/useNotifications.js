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
  const [subscription, setSubscription] = useState(null);
  const [user, setUser] = useState(null);
  const seenIdsRef = useRef(new Set());
  const isFirstLoad = useRef(true);

  // Load current user
  useEffect(() => {
    db.auth.me().then(setUser).catch(() => {});
  }, []);

  // Load subscription and notifications
  const loadData = useCallback(async () => {
    if (!user) return;
    const [subs, notifs] = await Promise.all([
      db.entities.AlertSubscription.filter({ user_id: user.id }),
      db.entities.AppNotification.filter({ user_id: user.id }, "-created_date", 50),
    ]);
    setSubscription(subs[0] || null);
    setNotifications(notifs);
    setUnreadCount(notifs.filter(n => !n.read).length);

    // Seed seen IDs on first load to avoid false "new" notifications
    if (isFirstLoad.current) {
      notifs.forEach(n => seenIdsRef.current.add(n.id));
      isFirstLoad.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;
    const unsub = db.entities.AppNotification.subscribe((event) => {
      if (event.type === "create" && event.data.user_id === user.id) {
        if (!seenIdsRef.current.has(event.id)) {
          seenIdsRef.current.add(event.id);
          setNotifications(prev => [event.data, ...prev]);
          setUnreadCount(prev => prev + 1);
          // Browser notification if permitted
          if (Notification.permission === "granted") {
            new Notification(event.data.title, { body: event.data.body, icon: "/favicon.ico" });
          }
        }
      } else if (event.type === "update" && event.data.user_id === user.id) {
        setNotifications(prev => prev.map(n => n.id === event.id ? { ...n, ...event.data } : n));
        loadData(); // recount unread
      }
    });
    return unsub;
  }, [user, loadData]);

  // Poll for new LostPets and UrgentCases and create notifications
  useEffect(() => {
    if (!user || !subscription) return;
    const POLL_MS = 30000;

    const check = async () => {
      const since = new Date(Date.now() - POLL_MS * 1.5).toISOString();

      // Check lost pets
      if (subscription.notify_lost_pets && subscription.lat && subscription.lng) {
        const recent = await db.entities.LostPet.list("-created_date", 20);
        for (const pet of recent) {
          if (!pet.created_date || new Date(pet.created_date) < new Date(Date.now() - POLL_MS * 1.5)) continue;
          if (seenIdsRef.current.has(`lp-${pet.id}`)) continue;
          seenIdsRef.current.add(`lp-${pet.id}`);

          let distText = "";
          if (pet.last_seen_lat && pet.last_seen_lng) {
            const dist = haversineKm([subscription.lat, subscription.lng], [pet.last_seen_lat, pet.last_seen_lng]);
            if (dist > subscription.radius_km) continue;
            distText = ` (a ${dist.toFixed(1)} km)`;
          }

          await db.entities.AppNotification.create({
            user_id: user.id,
            type: "lost_pet",
            title: `🐾 Mascota perdida cerca${distText}`,
            body: `${pet.pet_name} (${pet.species}) fue reportado/a en ${pet.last_seen_address || "tu zona"}.`,
            ref_id: pet.id,
            read: false,
            distance_km: distText ? parseFloat(distText.match(/[\d.]+/)[0]) : undefined,
          });
        }
      }

      // Check urgent cases
      if (subscription.notify_urgent_cases) {
        const recent = await db.entities.UrgentCase.list("-updated_date", 10);
        for (const uc of recent) {
          if (!uc.updated_date || new Date(uc.updated_date) < new Date(Date.now() - POLL_MS * 1.5)) continue;
          const key = `uc-${uc.id}-${uc.updated_date}`;
          if (seenIdsRef.current.has(key)) continue;
          seenIdsRef.current.add(key);

          await db.entities.AppNotification.create({
            user_id: user.id,
            type: "urgent_case",
            title: `🆘 Actualización: ${uc.title}`,
            body: `El caso urgente fue actualizado. Estado: ${uc.status === "resuelto" ? "Resuelto ✅" : uc.status === "en_curso" ? "En curso" : "Activo"}.`,
            ref_id: uc.id,
            read: false,
          });
        }
      }
    };

    const interval = setInterval(check, POLL_MS);
    return () => clearInterval(interval);
  }, [user, subscription]);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => db.entities.AppNotification.update(n.id, { read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [notifications]);

  const markRead = useCallback(async (id) => {
    await db.entities.AppNotification.update(id, { read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const saveSubscription = useCallback(async (data) => {
    if (!user) return;
    const payload = { ...data, user_id: user.id, user_email: user.email };
    if (subscription) {
      const updated = await db.entities.AlertSubscription.update(subscription.id, payload);
      setSubscription({ ...subscription, ...payload });
    } else {
      const created = await db.entities.AlertSubscription.create(payload);
      setSubscription(created);
    }
  }, [user, subscription]);

  const deleteSubscription = useCallback(async () => {
    if (!subscription) return;
    await db.entities.AlertSubscription.delete(subscription.id);
    setSubscription(null);
  }, [subscription]);

  return {
    notifications,
    unreadCount,
    subscription,
    user,
    markAllRead,
    markRead,
    saveSubscription,
    deleteSubscription,
    reload: loadData,
  };
}