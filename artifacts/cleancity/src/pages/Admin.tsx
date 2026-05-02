import { useState } from "react";
import {
  useGetMe,
  useAdminListReports,
  useAdminListUsers,
  useAdminDecideReport,
  useAdminSetUserRole,
  useGetAdminStats,
  getAdminListReportsQueryKey,
  getAdminListUsersQueryKey,
  getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  XCircle,
  Clock,
  Users,
  Trophy,
  Loader2,
  ShieldAlert,
  Maximize2,
} from "lucide-react";
import ReportImage from "@/components/ReportImage";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { data: me, isLoading: meLoading } = useGetMe();
  const isAdmin = me?.role === "admin" && me?.email === "shivamverma0328@gmail.com";

  if (meLoading) {
    return (
      <AppLayout>
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <Card className="mx-auto max-w-lg">
          <CardContent className="space-y-3 py-10 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
            <h2 className="text-xl font-semibold">Admin access only</h2>
            <p className="text-sm text-muted-foreground">
              You need admin permissions to view this page. If you should be an
              admin, ask another admin to promote your account.
            </p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
          <p className="text-muted-foreground">
            Verify reports, manage users, and keep an eye on community activity.
          </p>
        </div>

        <AdminStatsRow />

        <Tabs defaultValue="reports">
          <TabsList>
            <TabsTrigger value="reports" data-testid="tab-reports">
              Reports
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              Users
            </TabsTrigger>
          </TabsList>
          <TabsContent value="reports" className="pt-4">
            <ReportsPanel />
          </TabsContent>
          <TabsContent value="users" className="pt-4">
            <UsersPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function AdminStatsRow() {
  const { data } = useGetAdminStats();
  const stats = [
    { label: "Pending", value: data?.pendingCount ?? 0, Icon: Clock },
    { label: "Verified today", value: data?.verifiedToday ?? 0, Icon: ShieldCheck },
    { label: "Rejected today", value: data?.rejectedToday ?? 0, Icon: XCircle },
    { label: "Citizens", value: data?.totalUsers ?? 0, Icon: Users },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <s.Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {s.label}
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </div>
          </CardContent>
        </Card>
      ))}
      {(data?.topReporters?.length ?? 0) > 0 && (
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-primary" />
              Top reporters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {data!.topReporters.map((u, i) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-xl border border-card-border bg-card px-4 py-2"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium">{u.displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      {u.points} pts &middot; {u.verifiedReports} verified
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReportsPanel() {
  const [status, setStatus] = useState<"all" | "pending" | "verified" | "rejected">(
    "pending",
  );
  const { data, isLoading } = useAdminListReports({
    status: status === "all" ? undefined : status,
  });
  const qc = useQueryClient();
  const { mutateAsync, isPending } = useAdminDecideReport();
  const { toast } = useToast();
  const [decision, setDecision] = useState<{
    id: number;
    name: string;
    decision: "verified" | "rejected";
  } | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [points, setPoints] = useState("10");

  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(
    null,
  );

  async function applyDecision() {
    if (!decision) return;
    try {
      await mutateAsync({
        id: decision.id,
        data: {
          decision: decision.decision,
          adminNote: adminNote || undefined,
          pointsAwarded:
            decision.decision === "verified" ? Number(points) || 0 : 0,
        },
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: getAdminListReportsQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() }),
      ]);
      toast({
        title: `Report ${decision.decision}`,
        description: `Marked report from ${decision.name} as ${decision.decision}.`,
      });
      setDecision(null);
      setAdminNote("");
      setPoints("10");
    } catch (err) {
      toast({
        title: "Failed to update",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Reports</CardTitle>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-40" data-testid="select-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && data?.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No reports in this view.
          </p>
        )}
        {data?.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-start gap-4 rounded-xl border border-card-border bg-card p-4"
            data-testid={`admin-report-${r.id}`}
          >
            <div
              className="group relative cursor-zoom-in"
              onClick={() => setPreviewImage({ url: r.imagePath, alt: r.locationLabel })}
            >
              <ReportImage
                path={r.imagePath}
                alt={r.locationLabel}
                className="h-24 w-32 flex-shrink-0 rounded-lg object-cover transition-opacity group-hover:opacity-90"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-full bg-black/50 p-2 text-white backdrop-blur-sm">
                  <Maximize2 className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{r.locationLabel}</h3>
                <Badge variant="outline" className="capitalize">
                  {r.status}
                </Badge>
                {r.pointsAwarded > 0 && (
                  <Badge variant="secondary">+{r.pointsAwarded} pts</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Reported by {r.reporterName}
                {r.reporterEmail ? ` · ${r.reporterEmail}` : ""}
              </p>
              <p className="mt-1 text-sm">{r.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)} &middot;{" "}
                {new Date(r.createdAt).toLocaleString()}
              </p>
              {r.adminNote && (
                <p className="mt-2 rounded-md bg-secondary px-3 py-2 text-xs">
                  <strong>Note:</strong> {r.adminNote}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() =>
                  setDecision({
                    id: r.id,
                    name: r.reporterName,
                    decision: "verified",
                  })
                }
                disabled={r.status === "verified"}
                data-testid={`button-verify-${r.id}`}
                className="gap-1"
              >
                <ShieldCheck className="h-4 w-4" /> Verify
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  setDecision({
                    id: r.id,
                    name: r.reporterName,
                    decision: "rejected",
                    })
                }
                disabled={r.status === "rejected"}
                data-testid={`button-reject-${r.id}`}
                className="gap-1"
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </div>
          </div>
        ))}
      </CardContent>

      {/* Report Decision Dialog */}
      <Dialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.decision === "verified" ? "Verify" : "Reject"} report
            </DialogTitle>
            <DialogDescription>
              {decision?.decision === "verified"
                ? "Award points and optionally leave a note for the reporter."
                : "Add an optional note explaining why this report is being rejected."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {decision?.decision === "verified" && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Points to award
                </label>
                <Input
                  type="number"
                  min="0"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  data-testid="input-points"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Note (optional)
              </label>
              <Input
                placeholder="e.g. Crew dispatched"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                data-testid="input-admin-note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
              onClick={applyDecision}
              disabled={isPending}
              className="gap-1"
              data-testid="button-confirm-decision"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={(o) => !o && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {previewImage && (
            <div className="relative aspect-video w-full bg-black/5 flex items-center justify-center">
              <ReportImage
                path={previewImage.url}
                alt={previewImage.alt}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}


function UsersPanel() {
  const { data, isLoading } = useAdminListUsers();
  const qc = useQueryClient();
  const { mutateAsync, isPending } = useAdminSetUserRole();
  const { toast } = useToast();

  async function toggleRole(id: number, currentRole: string) {
    const next = currentRole === "admin" ? "user" : "admin";
    try {
      await mutateAsync({ id, data: { role: next } });
      await qc.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
      toast({ title: `User is now a${next === "admin" ? "n admin" : " regular user"}` });
    } catch (err) {
      toast({
        title: "Couldn't change role",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {data?.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-card-border bg-card p-3"
            data-testid={`admin-user-${u.id}`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{u.displayName}</span>
                {u.role === "admin" && (
                  <Badge variant="secondary" className="gap-1">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {u.email ?? "no email"} &middot; {u.points} pts &middot;{" "}
                {u.verifiedReports} verified / {u.totalReports} total
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => toggleRole(u.id, u.role)}
              data-testid={`button-toggle-role-${u.id}`}
            >
              {u.role === "admin" ? "Demote to user" : "Promote to admin"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
