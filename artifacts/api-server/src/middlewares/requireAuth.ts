import type { Request, Response, NextFunction, RequestHandler } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

async function syncUserFromClerk(clerkId: string): Promise<User | null> {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);

  if (existing[0]) return existing[0];

  const clerkUser = await clerkClient.users.getUser(clerkId).catch(() => null);
  if (!clerkUser) return null;

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    email?.split("@")[0] ||
    "Eco Citizen";

  // Auto-promote the very first user to admin so the app is usable out of the box.
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable);
  const isFirstUser = (count ?? 0) === 0;

  const inserted = await db
    .insert(usersTable)
    .values({
      clerkId,
      displayName,
      email,
      avatarUrl: clerkUser.imageUrl ?? null,
      role: isFirstUser ? "admin" : "user",
    })
    .returning();

  return inserted[0] ?? null;
}

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await syncUserFromClerk(auth.userId);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.currentUser = user;
    next();
  } catch (err) {
    req.log.error({ err }, "Failed to load current user");
    res.status(500).json({ error: "Failed to load user" });
  }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.currentUser?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
};
