import { useState } from "react";
import { useLocation } from "wouter";
import {
  useCreateReport,
  getListMyReportsQueryKey,
  getGetMeQueryKey,
  getListMapReportsQueryKey,
  getGetOverviewStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Crosshair } from "lucide-react";
import PhotoUploader from "@/components/PhotoUploader";
import MapPicker from "@/components/MapPicker";
import { useToast } from "@/hooks/use-toast";

export default function NewReport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { mutateAsync, isPending } = useCreateReport();

  const [imagePath, setImagePath] = useState<string | null>(null);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [description, setDescription] = useState("");
  const [locating, setLocating] = useState(false);

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        toast({
          title: "Couldn't get location",
          description: err.message,
          variant: "destructive",
        });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!imagePath) {
      toast({ title: "Please upload a photo first", variant: "destructive" });
      return;
    }
    if (!pin) {
      toast({ title: "Drop a pin on the map", variant: "destructive" });
      return;
    }
    if (!locationLabel.trim() || !description.trim()) {
      toast({
        title: "Fill in the location label and description",
        variant: "destructive",
      });
      return;
    }
    try {
      await mutateAsync({
        data: {
          imagePath,
          locationLabel: locationLabel.trim(),
          description: description.trim(),
          latitude: pin.lat,
          longitude: pin.lng,
        },
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: getListMyReportsQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() }),
        qc.invalidateQueries({ queryKey: getListMapReportsQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetOverviewStatsQueryKey() }),
      ]);
      toast({
        title: "Report submitted!",
        description: "An admin will review it shortly.",
      });
      setLocation("/app");
    } catch (err) {
      toast({
        title: "Could not submit report",
        description: err instanceof Error ? err.message : "Try again later",
        variant: "destructive",
      });
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New report</h1>
          <p className="text-muted-foreground">
            Help your neighborhood by reporting garbage hotspots. Verified
            reports earn you eco points.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Photo</CardTitle>
              <CardDescription>
                A clear picture helps admins verify the report quickly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoUploader value={imagePath} onChange={setImagePath} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>2. Location</CardTitle>
                <CardDescription>
                  Tap the map to drop a pin, or use your current location.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={useMyLocation}
                disabled={locating}
                className="gap-2"
                data-testid="button-use-location"
              >
                {locating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Crosshair className="h-4 w-4" />
                )}
                Use my location
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <MapPicker value={pin} onChange={setPin} height={320} />
              {pin && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                </p>
              )}
              <div>
                <Label htmlFor="locationLabel">Location label</Label>
                <Input
                  id="locationLabel"
                  placeholder="e.g. Corner of 5th & Maple"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  data-testid="input-location-label"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Description</CardTitle>
              <CardDescription>
                What did you see? Bin overflow? Illegal dumping?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                placeholder="Describe what you saw and why it needs attention..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="input-description"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/app")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              className="gap-2"
              data-testid="button-submit-report"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit report
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
