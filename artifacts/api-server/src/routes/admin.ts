import { Router, type IRouter, type Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, reportsTable, usersTable } from "@workspace/db";
import {
  AdminDecideReportBody,
  AdminListReportsResponse,
  AdminListUsersResponse,
  AdminSetUserRoleBody,
  AdminDecideReportResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(requireAuth, requireAdmin);

router.get("/reports", async (req, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const baseQuery = db
    .select({
      id: reportsTable.id,
      imagePath: reportsTable.imagePath,
      locationLabel: reportsTable.locationLabel,
      latitude: reportsTable.latitude,
      longitude: reportsTable.longitude,
      description: reportsTable.description,
      status: reportsTable.status,
      pointsAwarded: reportsTable.pointsAwarded,
      adminNote: reportsTable.adminNote,
      createdAt: reportsTable.createdAt,
      decidedAt: reportsTable.decidedAt,
      reporterId: usersTable.id,
      reporterName: usersTable.displayName,
      reporterEmail: usersTable.email,
    })
    .from(reportsTable)
    .innerJoin(usersTable, eq(reportsTable.userId, usersTable.id));

  const rows = await (status
    ? baseQuery.where(eq(reportsTable.status, status))
    : baseQuery
  ).orderBy(desc(reportsTable.createdAt));

  res.json(
    AdminListReportsResponse.parse(
      rows.map((r) => ({
        id: r.id,
        imagePath: r.imagePath,
        locationLabel: r.locationLabel,
        latitude: r.latitude,
        longitude: r.longitude,
        description: r.description,
        status: r.status,
        pointsAwarded: r.pointsAwarded,
        adminNote: r.adminNote,
        createdAt: r.createdAt.toISOString(),
        decidedAt: r.decidedAt ? r.decidedAt.toISOString() : null,
        reporterId: r.reporterId,
        reporterName: r.reporterName,
        reporterEmail: r.reporterEmail,
      })),
    ),
  );
});

router.post("/reports/:id/decision", async (req, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = AdminDecideReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid decision payload" });
    return;
  }

  const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, id)).limit(1);
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  const decision = parsed.data.decision;
  const pointsAwarded =
    decision === "verified"
      ? typeof parsed.data.pointsAwarded === "number"
        ? parsed.data.pointsAwarded
        : 10
      : 0;

  await db.transaction(async (tx) => {
    await tx
      .update(reportsTable)
      .set({
        status: decision,
        pointsAwarded,
        adminNote: parsed.data.adminNote ?? null,
        decidedAt: new Date(),
        decidedByUserId: req.currentUser!.id,
      })
      .where(eq(reportsTable.id, id));

    if (decision === "verified" && report.status !== "verified") {
      await tx
        .update(usersTable)
        .set({ points: sql`${usersTable.points} + ${pointsAwarded}` })
        .where(eq(usersTable.id, report.userId));
    } else if (decision !== "verified" && report.status === "verified") {
      await tx
        .update(usersTable)
        .set({
          points: sql`GREATEST(${usersTable.points} - ${report.pointsAwarded}, 0)`,
        })
        .where(eq(usersTable.id, report.userId));
    }
  });

  const [updated] = await db
    .select({
      id: reportsTable.id,
      imagePath: reportsTable.imagePath,
      locationLabel: reportsTable.locationLabel,
      latitude: reportsTable.latitude,
      longitude: reportsTable.longitude,
      description: reportsTable.description,
      status: reportsTable.status,
      pointsAwarded: reportsTable.pointsAwarded,
      adminNote: reportsTable.adminNote,
      createdAt: reportsTable.createdAt,
      decidedAt: reportsTable.decidedAt,
      reporterId: usersTable.id,
      reporterName: usersTable.displayName,
      reporterEmail: usersTable.email,
    })
    .from(reportsTable)
    .innerJoin(usersTable, eq(reportsTable.userId, usersTable.id))
    .where(eq(reportsTable.id, id))
    .limit(1);

  res.json(
    AdminDecideReportResponse.parse({
      id: updated!.id,
      imagePath: updated!.imagePath,
      locationLabel: updated!.locationLabel,
      latitude: updated!.latitude,
      longitude: updated!.longitude,
      description: updated!.description,
      status: updated!.status,
      pointsAwarded: updated!.pointsAwarded,
      adminNote: updated!.adminNote,
      createdAt: updated!.createdAt.toISOString(),
      decidedAt: updated!.decidedAt ? updated!.decidedAt.toISOString() : null,
      reporterId: updated!.reporterId,
      reporterName: updated!.reporterName,
      reporterEmail: updated!.reporterEmail,
    }),
  );
});

router.get("/users", async (_req, res: Response) => {
  const rows = await db
    .select({
      id: usersTable.id,
      displayName: usersTable.displayName,
      email: usersTable.email,
      role: usersTable.role,
      points: usersTable.points,
      createdAt: usersTable.createdAt,
      total: sql<number>`(select count(*) from ${reportsTable} where ${reportsTable.userId} = ${usersTable.id})::int`,
      verified: sql<number>`(select count(*) from ${reportsTable} where ${reportsTable.userId} = ${usersTable.id} and ${reportsTable.status} = 'verified')::int`,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.points));

  res.json(
    AdminListUsersResponse.parse(
      rows.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        email: u.email,
        role: u.role,
        points: u.points,
        totalReports: u.total,
        verifiedReports: u.verified,
        createdAt: u.createdAt.toISOString(),
      })),
    ),
  );
});

router.post("/users/:id/role", async (req, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = AdminSetUserRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid role payload" });
    return;
  }

  await db.update(usersTable).set({ role: parsed.data.role }).where(eq(usersTable.id, id));

  const [u] = await db
    .select({
      id: usersTable.id,
      displayName: usersTable.displayName,
      email: usersTable.email,
      role: usersTable.role,
      points: usersTable.points,
      createdAt: usersTable.createdAt,
      total: sql<number>`(select count(*) from ${reportsTable} where ${reportsTable.userId} = ${usersTable.id})::int`,
      verified: sql<number>`(select count(*) from ${reportsTable} where ${reportsTable.userId} = ${usersTable.id} and ${reportsTable.status} = 'verified')::int`,
    })
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!u) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: u.id,
    displayName: u.displayName,
    email: u.email,
    role: u.role,
    points: u.points,
    totalReports: u.total,
    verifiedReports: u.verified,
    createdAt: u.createdAt.toISOString(),
  });
});

export default router;
