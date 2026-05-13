import { Router } from "express";
import { z } from "zod";
import { requireSession } from "../middleware/auth.js";
import { plan } from "../engine/planner.js";
import { computeAttackBuffs, computeGarrisonBuffs } from "../engine/buffs.js";
import { computeInvestments } from "../engine/combat.js";

export const optimizeRouter = Router();

optimizeRouter.use(requireSession);

const resourcesSchema = z.object({
  characterSheet: z.object({}).passthrough(),
  categoryId: z.enum(["govgear", "charm", "forgehammer", "heroXP", "widget"]).optional(),
  budget: z.record(z.number().nonnegative()),
});

// Run the planner kernel against a supplied character sheet + budget.
// Stateless — character sheet is provided in the body, not loaded from
// the profile, so "what-if" scenarios don't require persisting first.
optimizeRouter.post("/resources", (req, res) => {
  const parsed = resourcesSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { characterSheet, categoryId, budget } = parsed.data;
  const options = categoryId ? { categories: [categoryId] } : {};
  const result = plan(characterSheet, budget, options);
  res.json(result);
});

const marginalSchema = z.object({
  characterSheet: z.object({}).passthrough(),
});

// Rank all next upgrades by marginal ROI, ignoring resource budgets.
// Powers the "Optimal Investment" tab.
optimizeRouter.post("/marginal", (req, res) => {
  const parsed = marginalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const cs = parsed.data.characterSheet;
  const attackBuffs = computeAttackBuffs(cs);
  const garrisonBuffs = computeGarrisonBuffs(cs);
  const investments = computeInvestments(cs, attackBuffs, garrisonBuffs);
  res.json({ investments });
});
