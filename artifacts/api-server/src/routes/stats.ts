import { Router, type IRouter, type Response } from "express";
import { desc, eq, sql, and, gte } from "drizzle-orm";
import { db, reportsTable, usersTable } from "@workspace/db";
import { GetOverviewStatsResponse, GetAdminStatsResponse } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/stats/overview", async (_req, res: Response) => {
  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      verified: sql<number>`count(*) filter (where ${reportsTable.status} = 'verified')::int`,
      pending: sql<number>`count(*) filter (where ${reportsTable.status} = 'pending')::int`,
      points: sql<number>`coalesce(sum(${reportsTable.pointsAwarded}), 0)::int`,
      contributors: sql<number>`count(distinct ${reportsTable.userId})::int`,
    })
    .from(reportsTable);

  res.json(
    GetOverviewStatsResponse.parse({
      totalReports: counts?.total ?? 0,
      verifiedReports: counts?.verified ?? 0,
      pendingReports: counts?.pending ?? 0,
      totalPointsAwarded: counts?.points ?? 0,
      contributors: counts?.contributors ?? 0,
    }),
  );
});

router.get("/stats/admin", requireAuth, requireAdmin, async (_req, res: Response) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [pending] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(reportsTable)
    .where(eq(reportsTable.status, "pending"));

  const [verifiedToday] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(reportsTable)
    .where(and(eq(reportsTable.status, "verified"), gte(reportsTable.decidedAt, startOfDay)));

  const [rejectedToday] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(reportsTable)
    .where(and(eq(reportsTable.status, "rejected"), gte(reportsTable.decidedAt, startOfDay)));

  const [users] = await db.select({ n: sql<number>`count(*)::int` }).from(usersTable);

  const top = await db
    .select({
      id: usersTable.id,
      displayName: usersTable.displayName,
      points: usersTable.points,
      verified: sql<number>`(select count(*) from ${reportsTable} where ${reportsTable.userId} = ${usersTable.id} and ${reportsTable.status} = 'verified')::int`,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.points))
    .limit(5);

  res.json(
    GetAdminStatsResponse.parse({
      pendingCount: pending?.n ?? 0,
      verifiedToday: verifiedToday?.n ?? 0,
      rejectedToday: rejectedToday?.n ?? 0,
      totalUsers: users?.n ?? 0,
      topReporters: top.map((t) => ({
        id: t.id,
        displayName: t.displayName,
        points: t.points,
        verifiedReports: t.verified,
      })),
    }),
  );
});

export default router;
