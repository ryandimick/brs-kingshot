import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

const clerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY
);

// API-style auth gate: returns JSON 401 for unauthenticated requests.
// (We deliberately avoid Clerk's requireAuth() because it 302-redirects
// to a sign-in / dev-handshake URL, which is wrong for an API.)
export function requireSession(req: Request, res: Response, next: NextFunction) {
  if (!clerkConfigured) {
    return res.status(503).json({ error: "auth_not_configured" });
  }
  const auth = getAuth(req);
  if (!auth.userId) {
    return res.status(401).json({ error: "unauthenticated" });
  }
  return next();
}

export function getUserId(req: Request): string {
  const auth = getAuth(req);
  if (!auth.userId) {
    throw new Error("Missing userId — requireSession should run before this");
  }
  return auth.userId;
}
