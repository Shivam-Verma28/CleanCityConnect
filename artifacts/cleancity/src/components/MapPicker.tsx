import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, Math.max(map.getZoom(), 14));
    }
  }, [center, map]);
  return null;
}

export default function MapPicker({
  value,
  onChange,
  height = 320,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number }) => void;
  height?: number;
}) {
  const center: [number, number] = value
    ? [value.lat, value.lng]
    : [20.5937, 78.9629];

  return (
    <div
      className="overflow-hidden rounded-xl border border-card-border"
      style={{ height }}
      data-testid="map-picker"
    >
      <MapContainer
        center={center}
        zoom={value ? 14 : 4}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={value ? [value.lat, value.lng] : null} />
        <ClickHandler onPick={(lat, lng) => onChange({ lat, lng })} />
        {value && <Marker icon={markerIcon} position={[value.lat, value.lng]} />}
      </MapContainer>
    </div>
  );
}
