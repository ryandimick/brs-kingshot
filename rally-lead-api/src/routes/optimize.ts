import { Router } from "express";
import { z } from "zod";
import { requireSession } from "../middleware/auth.js";
import { plan } from "../engine/planner.js";
import { computeAttackBuffs, computeGarrisonBuffs } from "../engine/buffs.js";
import { computeInvestments } from "../engine/combat.js";
import { resolvePackTier } from "../engine/pack-resolver.js";
import { mergeBundles } from "../engine/scoring.js";
import { getAllPacks, getPackById } from "../data/pack-catalog.js";

export const optimizeRouter = Router();

optimizeRouter.use(requireSession);

// ─── /optimize/resources ───────────────────────────────────────────────────

const resourcesSchema = z.object({
  characterSheet: z.object({}).passthrough(),
  categoryId: z.enum(["govgear", "charm", "forgehammer", "heroXP", "widget"]).optional(),
  budget: z.record(z.number().nonnegative()),
});

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

// ─── /optimize/marginal ────────────────────────────────────────────────────

const marginalSchema = z.object({
  characterSheet: z.object({}).passthrough(),
});

optimizeRouter.post("/marginal", (req, res) => {
  const parsed = marginalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cs = parsed.data.characterSheet as any;
  const attackBuffs = computeAttackBuffs(cs);
  const garrisonBuffs = computeGarrisonBuffs(cs);
  const investments = computeInvestments(cs, attackBuffs, garrisonBuffs);
  res.json({ investments });
});

// ─── /optimize/pack-roi ────────────────────────────────────────────────────

// Cumulative gain truncated at the user's efficient-cutoff slider.
// Mirrors the same truncation rule the UI will apply on the planner side
// (relative cliff: keep upgrades whose per-step efficiency is >= bestEff * cutoff).
function cumulativeAtCutoff(upgrades: Array<{ gain: number; efficiency?: number }>, cutoffRatio: number): number {
  if (upgrades.length === 0) return 0;
  const bestEff = upgrades[0].efficiency ?? 0;
  let total = 0;
  for (const u of upgrades) {
    if (bestEff > 0 && (u.efficiency ?? 0) < bestEff * cutoffRatio) break;
    total += u.gain;
  }
  return total;
}

const packRoiSchema = z.object({
  characterSheet: z.object({}).passthrough(),
  currentBudget: z.record(z.number().nonnegative()).optional(),
  packId: z.string(),
  tierId: z.string(),
  cutoffRatio: z.number().min(0).max(1).optional(),
});

// Personal ROI for a single pack tier. Resolves the pack against the user's
// current budget (greedy slot/pick routing), runs plan() twice (with and
// without the pack), and returns the cumulative-gain delta at the user's
// chosen efficiency cutoff.
optimizeRouter.post("/pack-roi", (req, res) => {
  const parsed = packRoiSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { characterSheet, currentBudget = {}, packId, tierId, cutoffRatio = 0.5 } = parsed.data;

  const pack = getPackById(packId);
  if (!pack) return res.status(404).json({ error: "pack_not_found" });
  const tier = pack.tiers.find((t: { id: string }) => t.id === tierId);
  if (!tier) return res.status(404).json({ error: "tier_not_found" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cs = characterSheet as any;

  const resolved = resolvePackTier(cs, currentBudget, tier);

  const planWithout = plan(cs, currentBudget);
  const gainWithout = cumulativeAtCutoff(planWithout.upgrades, cutoffRatio);

  const withBudget = mergeBundles(currentBudget, resolved.bundle);
  const planWith = plan(cs, withBudget);
  const gainWith = cumulativeAtCutoff(planWith.upgrades, cutoffRatio);

  const deltaGainPct = Math.max(0, gainWith - gainWithout);

  res.json({
    packId,
    tierId,
    packName: pack.name,
    tierName: tier.tierName,
    price: tier.price,
    routedBundle: resolved.bundle,
    extras: resolved.extras,
    picks: resolved.picks,
    deltaGainPct,
    dollarsPerPct: deltaGainPct > 0 ? tier.price / deltaGainPct : null,
  });
});

// ─── /optimize/dollars ─────────────────────────────────────────────────────

const dollarsSchema = z.object({
  characterSheet: z.object({}).passthrough(),
  currentBudget: z.record(z.number().nonnegative()).optional(),
  dollarBudget: z.number().positive(),
  maxCopiesPerPack: z.number().int().positive().optional(),
  cutoffRatio: z.number().min(0).max(1).optional(),
  packIds: z.array(z.string()).optional(),  // restrict to a subset (e.g., currently-available)
});

// Greedy outer loop: iteratively buy the pack tier with the best %/$ given
// current state. Diminishing returns are automatic — each iteration re-scores
// every candidate against the post-purchase budget.
optimizeRouter.post("/dollars", (req, res) => {
  const parsed = dollarsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const {
    characterSheet,
    currentBudget = {},
    dollarBudget,
    maxCopiesPerPack = 3,
    cutoffRatio = 0.5,
    packIds,
  } = parsed.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cs = characterSheet as any;

  const filter = packIds ? new Set(packIds) : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidates: Array<{ pack: any; tier: any }> = [];
  for (const pack of getAllPacks()) {
    if (filter && !filter.has(pack.id)) continue;
    for (const tier of pack.tiers) candidates.push({ pack, tier });
  }

  let accBudget = { ...currentBudget } as Record<string, number>;
  let accExtras = {} as Record<string, number>;
  let dollarsLeft = dollarBudget;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const purchases: any[] = [];
  const purchaseCounts: Record<string, number> = {};

  const baseline = cumulativeAtCutoff(plan(cs, accBudget).upgrades, cutoffRatio);
  let lastGain = baseline;

  for (let iter = 0; iter < 30; iter++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let bestBuy: { pack: any; tier: any; resolved: ReturnType<typeof resolvePackTier>; deltaGain: number } | null = null;
    let bestPctPerDollar = 0;

    for (const { pack, tier } of candidates) {
      if (tier.price > dollarsLeft) continue;
      const key = `${pack.id}/${tier.id}`;
      if ((purchaseCounts[key] || 0) >= maxCopiesPerPack) continue;

      const resolved = resolvePackTier(cs, accBudget, tier);
      const newBudget = mergeBundles(accBudget, resolved.bundle);
      const newPlan = plan(cs, newBudget);
      const newGain = cumulativeAtCutoff(newPlan.upgrades, cutoffRatio);
      const deltaGain = newGain - lastGain;
      if (deltaGain <= 0) continue;

      const pctPerDollar = deltaGain / tier.price;
      if (pctPerDollar > bestPctPerDollar) {
        bestPctPerDollar = pctPerDollar;
        bestBuy = { pack, tier, resolved, deltaGain };
      }
    }
    if (!bestBuy) break;

    accBudget = mergeBundles(accBudget, bestBuy.resolved.bundle) as Record<string, number>;
    accExtras = mergeBundles(accExtras, bestBuy.resolved.extras) as Record<string, number>;
    dollarsLeft -= bestBuy.tier.price;
    const key = `${bestBuy.pack.id}/${bestBuy.tier.id}`;
    purchaseCounts[key] = (purchaseCounts[key] || 0) + 1;
    purchases.push({
      packId: bestBuy.pack.id,
      packName: bestBuy.pack.name,
      tierId: bestBuy.tier.id,
      tierName: bestBuy.tier.tierName,
      price: bestBuy.tier.price,
      deltaGainPct: bestBuy.deltaGain,
      dollarsPerPct: bestBuy.tier.price / bestBuy.deltaGain,
      routedBundle: bestBuy.resolved.bundle,
      extras: bestBuy.resolved.extras,
    });
    lastGain += bestBuy.deltaGain;
  }

  res.json({
    purchases,
    totalSpent: dollarBudget - dollarsLeft,
    dollarsLeft,
    totalGainPct: lastGain - baseline,
    finalBudget: accBudget,
    cumulativeExtras: accExtras,
  });
});
