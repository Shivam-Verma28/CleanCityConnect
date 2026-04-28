import { useState } from "react";
import {
  useListRewards,
  useListMyRedemptions,
  useRedeemReward,
  useGetMe,
  getGetMeQueryKey,
  getListMyRedemptionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Gift, Leaf, Loader2, Coffee, Bus, ShoppingBag, TreePine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  food: Coffee,
  transport: Bus,
  shopping: ShoppingBag,
  eco: TreePine,
  general: Gift,
};

export default function Rewards() {
  const { data: rewards, isLoading } = useListRewards();
  const { data: redemptions } = useListMyRedemptions();
  const { data: me } = useGetMe();
  const points = me?.points ?? 0;
  const { toast } = useToast();
  const qc = useQueryClient();
  const { mutateAsync, isPending } = useRedeemReward();

  const [confirming, setConfirming] = useState<{
    id: number;
    name: string;
    pointsCost: number;
  } | null>(null);

  async function confirm() {
    if (!confirming) return;
    try {
      await mutateAsync({ data: { rewardId: confirming.id } });
      await Promise.all([
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() }),
        qc.invalidateQueries({ queryKey: getListMyRedemptionsQueryKey() }),
      ]);
      toast({
        title: "Redeemed!",
        description: `You redeemed ${confirming.name}.`,
      });
      setConfirming(null);
    } catch (err) {
      toast({
        title: "Could not redeem",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rewards</h1>
            <p className="text-muted-foreground">
              Spend your eco points on goodies from local partners.
            </p>
          </div>
          <Badge
            variant="secondary"
            className="gap-2 rounded-full px-4 py-2 text-base font-semibold"
            data-testid="badge-balance"
          >
            <Leaf className="h-4 w-4 text-primary" /> {points} pts available
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse bg-muted" />
          ))}
          {rewards?.map((r) => {
            const Icon = categoryIcons[r.category] ?? Gift;
            const canAfford = points >= r.pointsCost;
            return (
              <Card key={r.id} data-testid={`reward-${r.id}`}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="gap-1 text-sm">
                      <Leaf className="h-3 w-3 text-primary" />
                      {r.pointsCost}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{r.name}</h3>
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!canAfford}
                    onClick={() =>
                      setConfirming({
                        id: r.id,
                        name: r.name,
                        pointsCost: r.pointsCost,
                      })
                    }
                    data-testid={`button-redeem-${r.id}`}
                  >
                    {canAfford ? "Redeem" : `Need ${r.pointsCost - points} more`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          {!isLoading && rewards?.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="py-12 text-center text-muted-foreground">
                No rewards available right now. Check back later!
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your redemptions</CardTitle>
          </CardHeader>
          <CardContent>
            {(!redemptions || redemptions.length === 0) ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No redemptions yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {redemptions.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                    data-testid={`history-${r.id}`}
                  >
                    <div>
                      <div className="font-medium text-foreground">
                        {r.rewardName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <code className="rounded-md bg-muted px-2 py-1 font-mono text-sm">
                        {r.code}
                      </code>
                      <Badge variant="secondary">−{r.pointsSpent} pts</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem {confirming?.name}?</DialogTitle>
            <DialogDescription>
              {confirming?.pointsCost} eco points will be deducted from your
              balance. You'll get a unique redemption code.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm redeem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
