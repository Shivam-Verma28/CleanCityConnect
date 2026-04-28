import { Router, type IRouter, type Response } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, reportsTable } from "@workspace/db";
import { GetMeResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/me", requireAuth, async (req, res: Response) => {
  const user = req.currentUser!;

  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      verified: sql<number>`count(*) filter (where ${reportsTable.status} = 'verified')::int`,
      pending: sql<number>`count(*) filter (where ${reportsTable.status} = 'pending')::int`,
    })
    .from(reportsTable)
    .where(eq(reportsTable.userId, user.id));

  res.json(
    GetMeResponse.parse({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      points: user.points,
      totalReports: counts?.total ?? 0,
      verifiedReports: counts?.verified ?? 0,
      pendingReports: counts?.pending ?? 0,
    }),
  );
});

export default router;
