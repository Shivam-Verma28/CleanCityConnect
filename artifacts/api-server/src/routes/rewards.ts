import { Router, type IRouter, type Response } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, rewardsTable, redemptionsTable, usersTable } from "@workspace/db";
import {
  ListRewardsResponse,
  ListMyRedemptionsResponse,
  RedeemRewardBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/rewards/catalog", async (_req, res: Response) => {
  const rows = await db
    .select()
    .from(rewardsTable)
    .where(eq(rewardsTable.available, true))
    .orderBy(rewardsTable.pointsCost);

  res.json(ListRewardsResponse.parse(rows));
});

router.get("/rewards/redemptions", requireAuth, async (req, res: Response) => {
  const rows = await db
    .select()
    .from(redemptionsTable)
    .where(eq(redemptionsTable.userId, req.currentUser!.id))
    .orderBy(desc(redemptionsTable.createdAt));

  res.json(
    ListMyRedemptionsResponse.parse(
      rows.map((r) => ({
        id: r.id,
        rewardId: r.rewardId,
        rewardName: r.rewardName,
        pointsSpent: r.pointsSpent,
        code: r.code,
        createdAt: r.createdAt.toISOString(),
      })),
    ),
  );
});

function generateCode(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ECO-${part()}-${part()}`;
}

router.post("/rewards/redemptions", requireAuth, async (req, res: Response) => {
  const parsed = RedeemRewardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid redemption payload" });
    return;
  }

  const result = await db.transaction(async (tx) => {
    const [reward] = await tx
      .select()
      .from(rewardsTable)
      .where(eq(rewardsTable.id, parsed.data.rewardId))
      .limit(1);
    if (!reward || !reward.available) {
      return { error: "Reward not available" as const };
    }

    const [user] = await tx
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.currentUser!.id))
      .limit(1);
    if (!user || user.points < reward.pointsCost) {
      return { error: "Insufficient points" as const };
    }

    await tx
      .update(usersTable)
      .set({ points: sql`${usersTable.points} - ${reward.pointsCost}` })
      .where(eq(usersTable.id, user.id));

    const [redemption] = await tx
      .insert(redemptionsTable)
      .values({
        userId: user.id,
        rewardId: reward.id,
        rewardName: reward.name,
        pointsSpent: reward.pointsCost,
        code: generateCode(),
      })
      .returning();

    return { redemption: redemption! };
  });

  if ("error" in result) {
    res.status(400).json({ error: result.error });
    return;
  }

  const r = result.redemption;
  res.status(201).json({
    id: r.id,
    rewardId: r.rewardId,
    rewardName: r.rewardName,
    pointsSpent: r.pointsSpent,
    code: r.code,
    createdAt: r.createdAt.toISOString(),
  });
});

export default router;
