import React, { useState } from "react";
import { MapPin, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Captura las coordenadas del dispositivo.
 *
 * Los formularios de mascotas perdidas y denuncias pedían una dirección escrita
 * pero nunca capturaban lat/lng, así que la pestaña "Mapa" de esos módulos
 * estaba permanentemente vacía y las alertas por cercanía no tenían con qué
 * calcular distancias.
 */
export default function BotonUbicacion({ valor, onCambio }) {
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);

  const tieneUbicacion = Number.isFinite(valor?.lat) && Number.isFinite(valor?.lng);

  const pedirUbicacion = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no permite compartir la ubicación.");
      return;
    }
    setBuscando(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onCambio({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setBuscando(false);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "No nos diste permiso para acceder a tu ubicación. Podés escribir la dirección a mano."
            : "No pudimos obtener tu ubicación. Podés escribir la dirección a mano."
        );
        setBuscando(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={pedirUbicacion} disabled={buscando}>
          {buscando ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : tieneUbicacion ? (
            <Check className="w-4 h-4 mr-2 text-primary" />
          ) : (
            <MapPin className="w-4 h-4 mr-2" />
          )}
          {tieneUbicacion ? "Ubicación guardada" : "Usar mi ubicación"}
        </Button>
        {tieneUbicacion && (
          <button
            type="button"
            onClick={() => onCambio({ lat: undefined, lng: undefined })}
            className="text-xs text-muted-foreground hover:underline"
          >
            Quitar
          </button>
        )}
      </div>
      {tieneUbicacion && (
        <p className="text-xs text-muted-foreground">
          Se va a mostrar en el mapa ({valor.lat.toFixed(4)}, {valor.lng.toFixed(4)}).
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
