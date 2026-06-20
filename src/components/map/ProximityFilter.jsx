import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { MapPin, LocateFixed, X, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ProximityFilter({ radiusKm, onRadiusChange, userLocation, onLocationFound, onClearLocation }) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onLocationFound([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        setLocating(false);
        setError("No se pudo obtener tu ubicación.");
      },
      { timeout: 10000 }
    );
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="font-medium flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary" /> Filtrar por proximidad
        </Label>
        {userLocation && (
          <Button variant="ghost" size="sm" onClick={onClearLocation} className="text-muted-foreground h-7 px-2">
            <X className="w-3.5 h-3.5 mr-1" /> Limpiar
          </Button>
        )}
      </div>

      {!userLocation ? (
        <Button onClick={handleLocate} disabled={locating} variant="outline" size="sm" className="w-full">
          {locating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LocateFixed className="w-4 h-4 mr-2" />}
          {locating ? "Obteniendo ubicación..." : "Usar mi ubicación"}
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Radio de búsqueda</span>
            <span className="font-bold text-primary">{radiusKm} km</span>
          </div>
          <Slider
            min={0.5} max={20} step={0.5}
            value={[radiusKm]}
            onValueChange={([v]) => onRadiusChange(v)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5 km</span><span>20 km</span>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </Card>
  );
}