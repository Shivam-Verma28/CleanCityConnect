import { Link } from "wouter";
import {
  useGetMe,
  useListMyReports,
  useListMyRedemptions,
} from "@workspace/api-client-react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Camera,
  Leaf,
  ShieldCheck,
  Clock,
  Gift,
  ArrowRight,
  XCircle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import ReportImage from "@/components/ReportImage";

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }
  > = {
    pending: {
      label: "Pending",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
      Icon: Clock,
    },
    verified: {
      label: "Verified",
      className: "bg-primary/15 text-primary",
      Icon: CheckCircle2,
    },
    rejected: {
      label: "Rejected",
      className: "bg-destructive/15 text-destructive",
      Icon: XCircle,
    },
  };
  const cfg = map[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
    Icon: HelpCircle,
  };
  const { Icon } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.className}`}
      data-testid={`status-${status}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  Icon,
  hint,
}: {
  label: string;
  value: string | number;
  Icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: me, isLoading: meLoading } = useGetMe();
  const { data: reports, isLoading: reportsLoading } = useListMyReports();
  const { data: redemptions } = useListMyRedemptions();

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {meLoading ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                <>Hi, {me?.displayName?.split(" ")[0] ?? "there"} 👋</>
              )}
            </h1>
            <p className="text-muted-foreground">
              Thanks for keeping your community clean.
            </p>
          </div>
          <Link href="/app/report">
            <Button size="lg" className="gap-2" data-testid="button-new-report">
              <Camera className="h-4 w-4" /> New report
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Eco points"
            value={me?.points ?? 0}
            Icon={Leaf}
            hint="Earn 10 pts per verified report"
          />
          <StatCard
            label="Verified"
            value={me?.verifiedReports ?? 0}
            Icon={ShieldCheck}
          />
          <StatCard
            label="Pending"
            value={me?.pendingReports ?? 0}
            Icon={Clock}
          />
          <StatCard
            label="Total reports"
            value={me?.totalReports ?? 0}
            Icon={Camera}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your reports</CardTitle>
              <Link href="/app/report">
                <Button variant="ghost" size="sm" className="gap-1">
                  Add new <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportsLoading && (
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </>
              )}
              {!reportsLoading && (!reports || reports.length === 0) && (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    You haven't reported anything yet. Snap your first photo!
                  </p>
                </div>
              )}
              {reports?.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-4 rounded-xl border border-card-border bg-card p-3"
                  data-testid={`report-row-${r.id}`}
                >
                  <ReportImage
                    path={r.imagePath}
                    alt={r.locationLabel}
                    className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-foreground">
                        {r.locationLabel}
                      </h3>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {r.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {r.pointsAwarded > 0 && (
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        <Leaf className="h-3 w-3" />+{r.pointsAwarded}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent rewards</CardTitle>
              <Link href="/app/rewards">
                <Button variant="ghost" size="sm" className="gap-1">
                  Browse <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {(!redemptions || redemptions.length === 0) && (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <Gift className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No rewards redeemed yet. Earn points and treat yourself!
                  </p>
                </div>
              )}
              {redemptions?.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-card-border bg-card p-3"
                  data-testid={`redemption-${r.id}`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">{r.rewardName}</h4>
                    <Badge variant="secondary">{r.pointsSpent} pts</Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    Code: {r.code}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
