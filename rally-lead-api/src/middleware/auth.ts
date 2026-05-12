import type { Request, Response, NextFunction } from "express";
import { requireAuth, getAuth } from "@clerk/express";

const clerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY
);

const enforce = requireAuth();

export function requireSession(req: Request, res: Response, next: NextFunction) {
  if (!clerkConfigured) {
    return res.status(503).json({ error: "auth_not_configured" });
  }
  return enforce(req, res, next);
}

export function getUserId(req: Request): string {
  const auth = getAuth(req);
  if (!auth.userId) {
    throw new Error("Missing userId — requireSession should run before this");
  }
  return auth.userId;
}
