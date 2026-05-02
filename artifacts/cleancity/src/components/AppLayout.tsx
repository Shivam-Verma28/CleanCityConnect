import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { UserButton, Show } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Menu, X, MapPin, LayoutDashboard, Camera, Gift, Shield } from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/report", label: "Report", icon: Camera },
  { href: "/map", label: "Map", icon: MapPin },
  { href: "/app/rewards", label: "Rewards", icon: Gift },
  { href: "/app/admin", label: "Admin", icon: Shield, adminOnly: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: me } = useGetMe();
  const isAdmin = me?.role === "admin" && me?.email === "shivamverma0328@gmail.com";

  const visibleItems = navItems.filter((i) => !i.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link href="/app" className="flex items-center gap-2 font-semibold text-foreground">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Leaf className="h-5 w-5" />
              </span>
              <span className="hidden sm:inline">CleanCity Connect</span>
            </Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {visibleItems.map((item) => {
              const active = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Show when="signed-in">
              {typeof me?.points === "number" && (
                <Badge
                  variant="secondary"
                  className="hidden gap-1 rounded-full px-3 py-1 text-sm font-semibold sm:inline-flex"
                  data-testid="badge-points"
                >
                  <Leaf className="h-3.5 w-3.5 text-primary" />
                  {me.points} pts
                </Badge>
              )}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9 ring-2 ring-primary/30",
                  },
                }}
              />
            </Show>
            <Show when="signed-out">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" data-testid="button-signin">
                  Sign in
                </Button>
              </Link>
            </Show>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              data-testid="button-menu-toggle"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-border bg-background md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 p-3">
              {visibleItems.map((item) => {
                const active = location === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">{children}</main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>
          Built for cleaner communities. CleanCity Connect &copy;{" "}
          {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
