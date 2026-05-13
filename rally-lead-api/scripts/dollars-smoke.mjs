// Exercises the engine paths behind /optimize/pack-roi and /optimize/dollars
// without going through the HTTP layer (so we don't need a Clerk session).
// Run with: node scripts/dollars-smoke.mjs

import { performance } from "node:perf_hooks";
import { plan } from "../src/engine/planner.js";
import { resolvePackTier } from "../src/engine/pack-resolver.js";
import { mergeBundles } from "../src/engine/scoring.js";
import { getAllPacks, getPackById } from "../src/data/pack-catalog.js";

// "Mid-game investor" — some upgrades done, plenty of headroom across systems.
const cs = {
  govGearSlots: { helm: 4, accessory: 3, armor: 4, pants: 3, ring: 4, weapon: 3 },
  charmLevels: {
    Infantry: { armor: [2, 2, 2], pants: [2, 2, 2] },
    Cavalry:  { helm:  [2, 2, 2], accessory: [2, 2, 2] },
    Archer:   { ring:  [2, 2, 2], weapon: [2, 2, 2] },
  },
  heroGear: {
    Infantry: { helm: { enh: 30, mast: 2 }, chest: { enh: 30, mast: 2 }, boots: { enh: 20, mast: 1 }, gloves: { enh: 20, mast: 1 } },
    Cavalry:  { helm: { enh: 30, mast: 2 }, chest: { enh: 30, mast: 2 }, boots: { enh: 20, mast: 1 }, gloves: { enh: 20, mast: 1 } },
    Archer:   { helm: { enh: 30, mast: 2 }, chest: { enh: 30, mast: 2 }, boots: { enh: 20, mast: 1 }, gloves: { enh: 20, mast: 1 } },
  },
  heroRoster: {},
  attackRally:  { selectedHeroes: [], joinerSlots: [], offenseWeight: 75 },
  garrisonLead: { selectedHeroes: [], offenseWeight: 25 },
  troops: {
    Infantry: { composition: [{ count: 300000, tier: 11, tgLevel: 0 }] },
    Cavalry:  { composition: [{ count: 200000, tier: 11, tgLevel: 0 }] },
    Archer:   { composition: [{ count: 250000, tier: 11, tgLevel: 0 }] },
  },
};

function cumulativeAtCutoff(upgrades, cutoffRatio) {
  if (upgrades.length === 0) return 0;
  const bestEff = upgrades[0].efficiency ?? 0;
  let total = 0;
  for (const u of upgrades) {
    if (bestEff > 0 && (u.efficiency ?? 0) < bestEff * cutoffRatio) break;
    total += u.gain;
  }
  return total;
}

const cutoffRatio = 0.3;
const currentBudget = {};

// ── Pack-ROI: score one tier ───────────────────────────────────────────
console.log("=== /optimize/pack-roi simulation ===");
const tHopeStart = performance.now();
{
  const pack = getPackById("hope_market");
  const tier = pack.tiers.find(t => t.id === "midnight_hope"); // $9.99
  const resolved = resolvePackTier(cs, currentBudget, tier);
  const gWithout = cumulativeAtCutoff(plan(cs, currentBudget).upgrades, cutoffRatio);
  const gWith = cumulativeAtCutoff(
    plan(cs, mergeBundles(currentBudget, resolved.bundle)).upgrades,
    cutoffRatio,
  );
  const delta = Math.max(0, gWith - gWithout);
  console.log(`  Hope Market — Midnight's Hope ($9.99):`);
  console.log(`    routed bundle: ${JSON.stringify(resolved.bundle)}`);
  console.log(`    picks:         ${JSON.stringify(resolved.picks)}`);
  console.log(`    deltaGainPct:  ${delta.toFixed(4)}%`);
  console.log(`    $/% :          ${delta > 0 ? (tier.price / delta).toFixed(2) : "—"}`);
}
console.log(`  elapsed: ${(performance.now() - tHopeStart).toFixed(0)}ms\n`);

// ── Dollars: full optimizer with a $50 budget ──────────────────────────
console.log("=== /optimize/dollars simulation ($50 budget) ===");
const tDollarsStart = performance.now();
{
  const dollarBudget = 50;
  const maxCopiesPerPack = 3;
  const candidates = [];
  for (const p of getAllPacks()) for (const t of p.tiers) candidates.push({ pack: p, tier: t });

  let accBudget = { ...currentBudget };
  let dollarsLeft = dollarBudget;
  const purchaseCounts = {};
  const purchases = [];

  const baseline = cumulativeAtCutoff(plan(cs, accBudget).upgrades, cutoffRatio);
  let lastGain = baseline;

  for (let iter = 0; iter < 30; iter++) {
    let best = null, bestPpd = 0;
    for (const { pack, tier } of candidates) {
      if (tier.price > dollarsLeft) continue;
      const k = `${pack.id}/${tier.id}`;
      if ((purchaseCounts[k] || 0) >= maxCopiesPerPack) continue;
      const resolved = resolvePackTier(cs, accBudget, tier);
      const newGain = cumulativeAtCutoff(
        plan(cs, mergeBundles(accBudget, resolved.bundle)).upgrades, cutoffRatio,
      );
      const dg = newGain - lastGain;
      if (dg <= 0) continue;
      const ppd = dg / tier.price;
      if (ppd > bestPpd) { bestPpd = ppd; best = { pack, tier, resolved, dg }; }
    }
    if (!best) break;
    accBudget = mergeBundles(accBudget, best.resolved.bundle);
    dollarsLeft -= best.tier.price;
    const k = `${best.pack.id}/${best.tier.id}`;
    purchaseCounts[k] = (purchaseCounts[k] || 0) + 1;
    purchases.push({ pack: best.pack.name, tier: best.tier.tierName, price: best.tier.price, dg: best.dg });
    lastGain += best.dg;
  }

  console.log(`  baseline cumulative gain (no purchase): +${baseline.toFixed(3)}%`);
  console.log(`  purchases (in order):`);
  for (const p of purchases) {
    console.log(`    $${p.price.toFixed(2).padStart(6)}  ${p.pack.padEnd(22)} ${p.tier.padEnd(30)} +${p.dg.toFixed(3)}%`);
  }
  console.log(`  total spent: $${(dollarBudget - dollarsLeft).toFixed(2)} / $${dollarBudget}`);
  console.log(`  total gain:  +${(lastGain - baseline).toFixed(3)}%`);
}
console.log(`  elapsed: ${(performance.now() - tDollarsStart).toFixed(0)}ms`);
