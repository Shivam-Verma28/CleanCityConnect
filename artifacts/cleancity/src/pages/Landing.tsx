import { Link } from "wouter";
import { useGetOverviewStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Leaf,
  Camera,
  ShieldCheck,
  Gift,
  MapPin,
  ArrowRight,
  Users,
} from "lucide-react";

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-card-border bg-card/70 p-4 backdrop-blur">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground" data-testid={`stat-${label}`}>
          {value}
        </div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { data: stats } = useGetOverviewStats();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Leaf className="h-5 w-5" />
              </span>
              CleanCity Connect
            </Link>
          <div className="flex items-center gap-2">
            <Link href="/map">
              <Button variant="ghost" size="sm" data-testid="button-public-map">
                Live Map
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="sm" data-testid="button-landing-signin">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" data-testid="button-landing-signup">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-card-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Leaf className="h-3.5 w-3.5 text-primary" /> A cleaner city, together
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Spot it. Snap it.{" "}
              <span className="text-primary">Help clean it.</span>
            </h1>
            <p className="max-w-prose text-lg text-muted-foreground">
              CleanCity Connect lets you report garbage hotspots in seconds.
              Verified reports earn you eco points you can redeem for real
              rewards — and your community gets cleaner, faster.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2" data-testid="button-cta-signup">
                  Start reporting <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/map">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  data-testid="button-cta-map"
                >
                  <MapPin className="h-4 w-4" /> Browse the map
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-3">
              <StatTile
                label="Reports"
                value={stats?.totalReports ?? "—"}
                icon={Camera}
              />
              <StatTile
                label="Verified"
                value={stats?.verifiedReports ?? "—"}
                icon={ShieldCheck}
              />
              <StatTile
                label="Citizens"
                value={stats?.contributors ?? "—"}
                icon={Users}
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-tr from-primary/30 via-accent to-transparent blur-2xl" />
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 via-accent to-background p-6">
                  <div className="flex h-full flex-col justify-between rounded-2xl border border-card-border bg-card/80 p-5 shadow-lg backdrop-blur">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                        Pending verification
                      </div>
                      <h3 className="mt-4 text-xl font-bold">
                        Overflowing bin near Park Ave
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Reported by Maya · 12 min ago · 0.4 km away
                      </p>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Leaf className="h-4 w-4" /> +10 pts on verify
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-12 w-12 rounded-md bg-gradient-to-br from-primary/40 to-accent"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-3xl font-bold text-foreground">
            How it works
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
            Three simple steps from spotting a problem to earning your reward.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Camera,
                title: "Snap a photo",
                desc: "Take a picture of the garbage hotspot, drop a pin on the map, and add a quick description.",
              },
              {
                icon: ShieldCheck,
                title: "Get verified",
                desc: "Our community admins review reports daily. Verified reports help dispatch clean-up crews.",
              },
              {
                icon: Gift,
                title: "Earn & redeem",
                desc: "Collect eco points for each verified report and redeem them for vouchers and goodies.",
              },
            ].map((s) => (
              <Card key={s.title} className="border-card-border">
                <CardContent className="space-y-3 p-6">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Built for cleaner communities. CleanCity Connect &copy;{" "}
        {new Date().getFullYear()}
      </footer>
    </div>
  );
}
