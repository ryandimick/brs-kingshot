import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireSession, getUserId } from "../middleware/auth.js";

export const profilesRouter = Router();

profilesRouter.use(requireSession);

profilesRouter.get("/", async (req, res) => {
  const userId = getUserId(req);
  const profiles = await prisma.profile.findMany({
    where: { clerkUserId: userId },
    orderBy: { createdAt: "asc" },
  });
  res.json({ profiles });
});

const createSchema = z.object({
  name: z.string().min(1).max(64),
  kingshotPlayerId: z.string().min(1).max(64),
  characterSheet: z.unknown(),
  cycleAnchor: z.string().datetime(),
});

profilesRouter.post("/", async (req, res) => {
  const userId = getUserId(req);
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  // Trust-on-first-use: any unclaimed Kingshot player id can be claimed once.
  const existing = await prisma.profile.findUnique({
    where: { kingshotPlayerId: parsed.data.kingshotPlayerId },
  });
  if (existing) {
    return res.status(409).json({ error: "kingshot_player_id_taken" });
  }

  const profile = await prisma.profile.create({
    data: {
      clerkUserId: userId,
      name: parsed.data.name,
      kingshotPlayerId: parsed.data.kingshotPlayerId,
      characterSheet: parsed.data.characterSheet as object,
      cycleAnchor: new Date(parsed.data.cycleAnchor),
    },
  });
  res.status(201).json({ profile });
});

profilesRouter.get("/:id", async (req, res) => {
  const userId = getUserId(req);
  const profile = await prisma.profile.findUnique({
    where: { id: req.params.id },
  });
  if (!profile || profile.clerkUserId !== userId) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json({ profile });
});

const updateSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  characterSheet: z.unknown().optional(),
  cycleAnchor: z.string().datetime().optional(),
});

profilesRouter.put("/:id", async (req, res) => {
  const userId = getUserId(req);
  const profile = await prisma.profile.findUnique({
    where: { id: req.params.id },
  });
  if (!profile || profile.clerkUserId !== userId) {
    return res.status(404).json({ error: "not_found" });
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const updated = await prisma.profile.update({
    where: { id: req.params.id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.characterSheet !== undefined
        ? { characterSheet: parsed.data.characterSheet as object }
        : {}),
      ...(parsed.data.cycleAnchor !== undefined
        ? { cycleAnchor: new Date(parsed.data.cycleAnchor) }
        : {}),
    },
  });
  res.json({ profile: updated });
});
