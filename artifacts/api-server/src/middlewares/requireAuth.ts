import type { Request, Response, NextFunction, RequestHandler } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";

function extractNameFromEmail(email: string | null): string {
  if (!email) return "Eco Citizen";
  const localPart = email.split("@")[0];
  // Remove numeric suffixes and special characters for a cleaner name
  const namePart = localPart.split(/[._\d-]/)[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

async function syncUserFromClerk(clerkId: string): Promise<User | null> {
  const clerkUser = await clerkClient.users.getUser(clerkId).catch(() => null);
  if (!clerkUser) return null;

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const displayName = extractNameFromEmail(email);

  const userEmail = email;
  const adminEmail = "shivamverma0328@gmail.com";
  const isAdmin = userEmail === adminEmail;

  const inserted = await db
    .insert(usersTable)
    .values({
      clerkId,
      displayName,
      email,
      avatarUrl: clerkUser.imageUrl ?? null,
      role: isAdmin ? "admin" : "user",
    })
    .onConflictDoUpdate({
      target: usersTable.clerkId,
      set: {
        displayName,
        email,
        role: isAdmin ? "admin" : "user",
        avatarUrl: clerkUser.imageUrl ?? null,
      },
    })
    .returning();

  return inserted[0] ?? null;
}

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const isMockMode = !process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY.includes("MockKey");

  if (isMockMode) {
    req.log.warn("Bypassing authentication: CLERK_SECRET_KEY is missing or mock.");

    // Try to get user info from Clerk header
    let userEmail: string | null = null;
    let clerkId: string | null = null;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const tokenStr = authHeader.split(" ")[1];
      
      if (tokenStr.includes("MOCK_AUTH:")) {
        // Handle MOCK_AUTH:email:token
        const parts = tokenStr.split(":");
        const mockIdx = parts.indexOf("MOCK_AUTH");
        if (mockIdx !== -1 && parts.length > mockIdx + 1) {
          userEmail = parts[mockIdx + 1];
          clerkId = `clerk_${userEmail.split("@")[0]}`;
        }
      } else {
        // Regular Clerk token decode attempt
        try {
          const payload = JSON.parse(Buffer.from(tokenStr.split(".")[1], "base64").toString());
          clerkId = payload.sub || null;
          userEmail = payload.email || payload.email_address || payload.primary_email || null;
        } catch (e) { }
      }
    }

    // FINAL FALLBACK: If we still don't have an email, we can't identify the user.
    if (!userEmail) {
      res.status(401).json({ error: "Could not identify user. Please log in again." });
      return;
    }

    clerkId = clerkId || `clerk_${userEmail.split("@")[0]}`;
    const displayName = extractNameFromEmail(userEmail);
    const adminEmail = "shivamverma0328@gmail.com";
    const isAdmin = userEmail.toLowerCase() === adminEmail.toLowerCase();

    console.log(`[AUTH] Identified User: ${userEmail} (ID: ${clerkId}) - Admin: ${isAdmin}`);

    const [user] = await db
      .insert(usersTable)
      .values({
        clerkId: clerkId,
        displayName: displayName,
        email: userEmail,
        role: isAdmin ? "admin" : "user",
        points: 0,
      })
      .onConflictDoUpdate({
        target: usersTable.clerkId,
        set: { 
          displayName: displayName,
          email: userEmail,
          role: isAdmin ? "admin" : "user",
        },
      })
      .returning();

    req.currentUser = user;
    next();
    return;
  }

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
  if (req.currentUser?.role !== "admin" || req.currentUser?.email !== "shivamverma0328@gmail.com") {
    res.status(403).json({ error: "Admin access required (Authorized Admin Only)" });
    return;
  }
  next();
};
