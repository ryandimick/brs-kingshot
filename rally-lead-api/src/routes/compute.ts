import { Router } from "express";
import { z } from "zod";
import { requireSession } from "../middleware/auth.js";
import { computeAttackBuffs, computeGarrisonBuffs } from "../engine/buffs.js";
import { computeStatProducts, computeSkillMod, optimizeLineup } from "../engine/combat.js";

export const computeRouter = Router();

computeRouter.use(requireSession);

const stateSchema = z.object({
  characterSheet: z.object({}).passthrough(),
});

// All derived display state for a character sheet in one round-trip:
// buffs / stat products / skill mods for both attack-rally and garrison-lead
// scenarios. Called by the React app whenever the sheet changes (debounced).
computeRouter.post("/state", (req, res) => {
  const parsed = stateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cs = parsed.data.characterSheet as any;

  const attackBuffs   = computeAttackBuffs(cs);
  const garrisonBuffs = computeGarrisonBuffs(cs);
  const attackStatProducts   = computeStatProducts(attackBuffs, cs);
  const garrisonStatProducts = computeStatProducts(garrisonBuffs, cs);
  const attackSkillMod = computeSkillMod(
    cs.attackRally?.selectedHeroes || [],
    cs.heroRoster || {},
    cs.attackRally?.joinerSlots || []
  );
  const garrisonSkillMod = computeSkillMod(
    cs.garrisonLead?.selectedHeroes || [],
    cs.heroRoster || {},
    []
  );

  const attackOptimalLineup = optimizeLineup(cs, "attack");
  const garrisonOptimalLineup = optimizeLineup(cs, "garrison");

  res.json({
    attackBuffs,
    garrisonBuffs,
    attackStatProducts,
    garrisonStatProducts,
    attackSkillMod,
    garrisonSkillMod,
    attackOptimalLineup,
    garrisonOptimalLineup,
  });
});
