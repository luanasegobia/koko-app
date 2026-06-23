const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Bell, LocateFixed, Loader2, Check, BellOff } from "lucide-react";

export default function AlertSubscriptionPanel() {
  const [user, setUser] = useState(null);
  const [sub, setSub] = useState(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    lat: null, lng: null, radius_km: 5,
    notify_lost_pets: true, notify_urgent_cases: true, notify_sightings: false,
  });

  useEffect(() => {
    db.auth.me().then(async (u) => {
      setUser(u);
      const subs = await db.entities.AlertSubscription.filter({ user_id: u.id });
      if (subs.length > 0) {
        setSub(subs[0]);
        setForm({ ...subs[0] });
      }
    });
  }, []);

  return <div>AlertSubscriptionPanel</div>;
}