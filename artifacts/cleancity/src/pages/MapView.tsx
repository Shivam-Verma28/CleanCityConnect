import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "wouter";
import { useListMapReports } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Leaf, ArrowLeft } from "lucide-react";

function colorIcon(color: string) {
  return new L.DivIcon({
    className: "",
    html: `<div style="background:${color};width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.25)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const icons = {
  pending: colorIcon("#f59e0b"),
  verified: colorIcon("#16a34a"),
  rejected: colorIcon("#94a3b8"),
};

const fallbackCenter: [number, number] = [20.5937, 78.9629];

export default function MapView() {
  const { data, isLoading } = useListMapReports();

  const center: [number, number] =
    data && data.length > 0 ? [data[0]!.latitude, data[0]!.longitude] : fallbackCenter;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Leaf className="h-5 w-5" />
              </span>
              CleanCity Connect
            </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        </div>
      </header>

      <div className="border-b border-border bg-secondary/30 px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 text-sm">
          <span className="font-semibold">
            {isLoading ? "Loading..." : `${data?.length ?? 0} reports`}
          </span>
          <Legend color="#16a34a" label="Verified" />
          <Legend color="#f59e0b" label="Pending" />
          <Legend color="#94a3b8" label="Rejected" />
        </div>
      </div>

      <div className="flex-1" data-testid="public-map">
        <MapContainer
          center={center}
          zoom={data && data.length > 0 ? 11 : 4}
          style={{ width: "100%", height: "calc(100vh - 130px)" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {data?.map((r) => (
            <Marker
              key={r.id}
              position={[r.latitude, r.longitude]}
              icon={icons[r.status as keyof typeof icons] ?? icons.pending}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">{r.locationLabel}</div>
                  <div className="text-xs capitalize text-muted-foreground">
                    {r.status} &middot; {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-3 w-3 rounded-full"
        style={{ background: color, border: "2px solid white", boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }}
      />
      {label}
    </span>
  );
}
