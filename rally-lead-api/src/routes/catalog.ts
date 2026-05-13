import { Router } from "express";
import { requireSession } from "../middleware/auth.js";
import { getAllPacks } from "../data/pack-catalog.js";

export const catalogRouter = Router();

catalogRouter.use(requireSession);

// Returns the full pack catalog with all tiers expanded (scaleFrom resolved).
catalogRouter.get("/packs", (_req, res) => {
  res.json({ packs: getAllPacks() });
});
