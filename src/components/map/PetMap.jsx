import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom colored SVG icons
function createIcon(color, emoji, size = 36) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.2}" viewBox="0 0 36 43">
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
      </filter>
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 25 18 25S36 31.5 36 18C36 8.06 27.94 0 18 0z" 
            fill="${color}" filter="url(#shadow)"/>
      <circle cx="18" cy="18" r="11" fill="white" opacity="0.25"/>
      <text x="18" y="23" font-size="13" text-anchor="middle" font-family="sans-serif">${emoji}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size * 1.2],
    iconAnchor: [size / 2, size * 1.2],
    popupAnchor: [0, -size * 1.2],
  });
}

export const ICONS = {
  lostPet:    createIcon("#ef4444", "🐾"),
  foundPet:   createIcon("#22c55e", "🐾"),
  sighting:   createIcon("#f59e0b", "👁️", 28),
  abuse:      createIcon("#f97316", "⚠️"),
  abuseUrgent: createIcon("#dc2626", "🆘"),
  vet:        createIcon("#3b82f6", "🏥"),
  vetOpen:    createIcon("#10b981", "🏥"),
  user:       createIcon("#8b5cf6", "📍", 28),
};

// Component to re-center map
function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || map.getZoom(), { duration: 1 });
  }, [center, zoom]);
  return null;
}

// Oран default center
const ORAN_CENTER = [-23.137, -64.328];

export default function PetMap({
  markers = [],
  center,
  zoom = 14,
  height = "420px",
  radiusKm,
  userLocation,
  onMarkerClick,
  children,
}) {
  return (
    <div style={{ height, width: "100%" }} className="rounded-xl overflow-hidden border border-border shadow-md">
      <MapContainer
        center={center || ORAN_CENTER}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {center && <FlyTo center={center} zoom={zoom} />}

        {/* User location radius */}
        {userLocation && radiusKm && (
          <Circle
            center={userLocation}
            radius={radiusKm * 1000}
            pathOptions={{ color: "#8b5cf6", fillColor: "#8b5cf6", fillOpacity: 0.08, weight: 1.5, dashArray: "6 4" }}
          />
        )}
        {userLocation && (
          <Marker position={userLocation} icon={ICONS.user}>
            <Popup><strong>Tu ubicación</strong></Popup>
          </Marker>
        )}

        {markers.map((m, i) => (
          <Marker
            key={m.id || i}
            position={[m.lat, m.lng]}
            icon={m.icon || ICONS.lostPet}
            eventHandlers={{ click: () => onMarkerClick && onMarkerClick(m) }}
          >
            <Popup maxWidth={260}>
              {m.popupContent}
            </Popup>
          </Marker>
        ))}

        {children}
      </MapContainer>
    </div>
  );
}