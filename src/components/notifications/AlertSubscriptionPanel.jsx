import React, { useState, useEffect } from "react";
import { db } from "@/api/supabaseClient";
import AlertSettingsPanel from "./AlertSettingsPanel";

export default function AlertSubscriptionPanel() {
  const [user, setUser] = useState(null);
  const [sub, setSub] = useState(null);

  useEffect(() => {
    db.auth.me().then(async (u) => {
      setUser(u);
      const subs = await db.entities.AlertSubscription.filter({ user_id: u.id });
      if (subs.length > 0) setSub(subs[0]);
    });
  }, []);

  const handleSave = async (data) => {
    const payload = { ...data, user_id: user.id, user_email: user.email };
    if (sub) {
      const updated = await db.entities.AlertSubscription.update(sub.id, payload);
      setSub({ ...sub, ...payload });
    } else {
      const created = await db.entities.AlertSubscription.create(payload);
      setSub(created);
    }
  };

  const handleDelete = async () => {
    if (!sub) return;
    await db.entities.AlertSubscription.delete(sub.id);
    setSub(null);
  };

  return (
    <AlertSettingsPanel subscription={sub} onSave={handleSave} onDelete={handleDelete} />
  );
}