import { Router, type IRouter, type Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db, reportsTable } from "@workspace/db";
import {
  CreateReportBody,
  ListMyReportsResponse,
  ListMapReportsResponse,
  GetReportResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/reports", requireAuth, async (req, res: Response) => {
  const rows = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.userId, req.currentUser!.id))
    .orderBy(desc(reportsTable.createdAt));

  res.json(
    ListMyReportsResponse.parse(
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
      })),
    ),
  );
});

router.post("/reports", requireAuth, async (req, res: Response) => {
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid report payload" });
    return;
  }

  const inserted = await db
    .insert(reportsTable)
    .values({
      userId: req.currentUser!.id,
      imagePath: parsed.data.imagePath,
      locationLabel: parsed.data.locationLabel,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      description: parsed.data.description,
    })
    .returning();

  const r = inserted[0]!;
  res.status(201).json(
    GetReportResponse.parse({
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
    }),
  );
});

router.get("/reports/map", async (_req, res: Response) => {
  const rows = await db
    .select({
      id: reportsTable.id,
      latitude: reportsTable.latitude,
      longitude: reportsTable.longitude,
      status: reportsTable.status,
      locationLabel: reportsTable.locationLabel,
      createdAt: reportsTable.createdAt,
    })
    .from(reportsTable)
    .orderBy(desc(reportsTable.createdAt))
    .limit(500);

  res.json(
    ListMapReportsResponse.parse(
      rows.map((r) => ({
        id: r.id,
        latitude: r.latitude,
        longitude: r.longitude,
        status: r.status,
        locationLabel: r.locationLabel,
        createdAt: r.createdAt.toISOString(),
      })),
    ),
  );
});

router.get("/reports/:id", async (req, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [r] = await db.select().from(reportsTable).where(eq(reportsTable.id, id)).limit(1);
  if (!r) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(
    GetReportResponse.parse({
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
    }),
  );
});

export default router;
