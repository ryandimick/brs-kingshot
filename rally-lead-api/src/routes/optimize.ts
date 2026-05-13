import { Router } from "express";
import { z } from "zod";
import { requireSession } from "../middleware/auth.js";
import { plan } from "../engine/planner.js";

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
