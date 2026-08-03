import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Loader2, LocateFixed, Trash2, Save } from "lucide-react";

export default function AlertSettingsPanel({ subscription, onSave, onDelete }) {
  const [form, setForm] = useState({
    lat: subscription?.lat || "",
    lng: subscription?.lng || "",
    radius_km: subscription?.radius_km || 5,
    location_label: subscription?.location_label || "",
    notify_lost_pets: subscription?.notify_lost_pets ?? true,
    notify_urgent_cases: subscription?.notify_urgent_cases ?? true,
  });
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (subscription) {
      setForm({
        lat: subscription.lat || "",
        lng: subscription.lng || "",
        radius_km: subscription.radius_km || 5,
        location_label: subscription.location_label || "",
        notify_lost_pets: subscription.notify_lost_pets ?? true,
        notify_urgent_cases: subscription.notify_urgent_cases ?? true,
      });
    }
  }, [subscription]);

  const locate = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  };

  const requestBrowserNotif = () => {
    if (Notification.permission === "default") Notification.requestPermission();
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, lat: Number(form.lat), lng: Number(form.lng) });
    requestBrowserNotif();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 380 }}>
      <p className="text-xs text-muted-foreground">
        Recibí alertas cuando haya novedades cerca de tu zona.
      </p>

      {/* Location */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Zona de alertas</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Etiqueta (ej: Mi casa)"
            value={form.location_label}
            onChange={e => setForm(f => ({ ...f, location_label: e.target.value }))}
            className="flex-1 h-8 text-sm"
          />
          <Button variant="outline" size="sm" onClick={locate} disabled={locating} className="h-8 px-2">
            {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
          </Button>
        </div>
        {form.lat && form.lng && (
          <p className="text-xs text-muted-foreground">
            📍 {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}
          </p>
        )}
      </div>

      {/* Radius */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs font-medium">Radio de alerta</Label>
          <span className="text-xs font-bold text-primary">{form.radius_km} km</span>
        </div>
        <Slider
          min={1} max={30} step={1}
          value={[form.radius_km]}
          onValueChange={([v]) => setForm(f => ({ ...f, radius_km: v }))}
        />
      </div>

      {/* Toggles */}
      <div className="space-y-2.5">
        <Label className="text-xs font-medium">Tipos de alerta</Label>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">🐾</span>
            <Label className="text-sm font-normal">Mascotas perdidas</Label>
          </div>
          <Switch checked={form.notify_lost_pets} onCheckedChange={v => setForm(f => ({ ...f, notify_lost_pets: v }))} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">🆘</span>
            <Label className="text-sm font-normal">Casos urgentes</Label>
          </div>
          <Switch checked={form.notify_urgent_cases} onCheckedChange={v => setForm(f => ({ ...f, notify_urgent_cases: v }))} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button onClick={handleSave} disabled={saving || !form.lat} size="sm" className="flex-1">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
          {saved ? "¡Guardado!" : "Guardar alertas"}
        </Button>
        {subscription && (
          <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive border-destructive/30 hover:bg-destructive/10">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}