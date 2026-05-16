import { TROOP_TYPES } from "../data/constants.js";
import { offProduct, defProduct, marginal, baseStatsFor, troopCountsFor } from "./combat.js";
import { flattenBreakdown } from "./buffs.js";

// Dynamic troop weights based on √troops × stat_product (true battle contribution)
export function weightsFor(cs, buffs, productFn) {
  const counts = troopCountsFor(cs);
  const bases  = baseStatsFor(cs);
  const contrib = {};
  let total = 0;
  for (const t of TROOP_TYPES) {
    const c = Math.sqrt(Math.max(counts[t] || 0, 1)) * productFn(bases[t], buffs[t]);
    contrib[t] = c;
    total += c;
  }
  const w = {};
  for (const t of TROOP_TYPES) w[t] = total > 0 ? contrib[t] / total : 1 / 3;
  return w;
}

// Per-stat effective displayed-pct gain for one troop, given:
//   - additive bucket increments (`statGains`, scoped to `troopScope`)
//   - squad-wide widget-skill multiplier increments (`widgetSkillDelta`)
// Additive gains are amplified by (1 + widgetSkillPct[stat]/100) because the
// displayed pct = additive × (1 + widgetSkillPct/100); widget-skill deltas
// scale the existing additive bucket of THIS troop (squad-wide effect).
function effectiveStatGains(statGains, troopScope, widgetSkillDelta, breakdown, troop) {
  const out = { ATK: 0, DEF: 0, Leth: 0, HP: 0 };
  const inScope = !troopScope || troopScope === troop;
  if (inScope) {
    for (const [stat, gain] of Object.entries(statGains)) {
      const wsFactor = 1 + (breakdown.widgetSkillPct[stat] || 0) / 100;
      out[stat] = (out[stat] || 0) + gain * wsFactor;
    }
  }
  for (const [stat, delta] of Object.entries(widgetSkillDelta)) {
    const additivePct = breakdown.additive[troop]?.[stat] || 0;
    out[stat] = (out[stat] || 0) + additivePct * (delta / 100);
  }
  return out;
}

// Combined value of an option across attack-rally and garrison-lead lineups.
// Operates on buff *breakdowns* so additive vs multiplicative (widget skill)
// contributions can be scored correctly.
//   statGains:        per-stat additive bucket increments
//   troopScope:       limit additive gains to one troop ("Infantry"/"Cavalry"/"Archer"), or null = all
//   opts.scenarios:   "attack-only" | "garrison-only" | undefined (= both)
//   opts.widgetSkillAtk: per-stat widget-skill multiplier delta applied in attack scenario (squad-wide)
//   opts.widgetSkillGar: per-stat widget-skill multiplier delta applied in garrison scenario (squad-wide)
export function computeGain(statGains, troopScope, cs, attackBreakdown, garrisonBreakdown, opts = {}) {
  const { scenarios, widgetSkillAtk = {}, widgetSkillGar = {} } = opts;
  const atkW = (cs.attackRally?.offenseWeight ?? 75) / 100;
  const garW = (cs.garrisonLead?.offenseWeight ?? 25) / 100;
  const bases = baseStatsFor(cs);

  const attackBuffs = flattenBreakdown(attackBreakdown);
  const garrisonBuffs = flattenBreakdown(garrisonBreakdown);

  const atkOffW = weightsFor(cs, attackBuffs, offProduct);
  const atkDefW = weightsFor(cs, attackBuffs, defProduct);
  const garOffW = weightsFor(cs, garrisonBuffs, offProduct);
  const garDefW = weightsFor(cs, garrisonBuffs, defProduct);

  let val = 0;

  for (const t of TROOP_TYPES) {
    if (scenarios !== "garrison-only") {
      const gains = effectiveStatGains(statGains, troopScope, widgetSkillAtk, attackBreakdown, t);
      for (const [stat, eGain] of Object.entries(gains)) {
        if (eGain === 0) continue;
        if (stat === "ATK" || stat === "Leth")
          val += marginal(bases[t], attackBuffs[t], stat, eGain, offProduct).pct * atkOffW[t] * atkW;
        if (stat === "HP" || stat === "DEF")
          val += marginal(bases[t], attackBuffs[t], stat, eGain, defProduct).pct * atkDefW[t] * (1 - atkW);
      }
    }
    if (scenarios !== "attack-only") {
      const gains = effectiveStatGains(statGains, troopScope, widgetSkillGar, garrisonBreakdown, t);
      for (const [stat, eGain] of Object.entries(gains)) {
        if (eGain === 0) continue;
        if (stat === "ATK" || stat === "Leth")
          val += marginal(bases[t], garrisonBuffs[t], stat, eGain, offProduct).pct * garOffW[t] * garW;
        if (stat === "HP" || stat === "DEF")
          val += marginal(bases[t], garrisonBuffs[t], stat, eGain, defProduct).pct * garDefW[t] * (1 - garW);
      }
    }
  }
  return val;
}

export function affordable(cost, remaining) {
  for (const k in cost) {
    if ((cost[k] || 0) > (remaining[k] || 0)) return false;
  }
  return true;
}

// Cross-resource cost normalization: what fraction of remaining budget does
// this consume, summed across every resource it touches?
export function fractionalCost(cost, remaining) {
  let frac = 0;
  for (const k in cost) {
    const c = cost[k];
    if (!c) continue;
    const r = remaining[k] || 0;
    if (r <= 0) return Infinity;
    frac += c / r;
  }
  return frac;
}

export function efficiency(candidate, remaining) {
  const f = fractionalCost(candidate.cost, remaining);
  return f > 0 ? candidate.gain / f : candidate.gain;
}

export function cloneSimState(cs) {
  return {
    govGearSlots: JSON.parse(JSON.stringify(cs.govGearSlots || {})),
    charmLevels:  JSON.parse(JSON.stringify(cs.charmLevels  || {})),
    heroGear:     JSON.parse(JSON.stringify(cs.heroGear     || {})),
    heroRoster:   JSON.parse(JSON.stringify(cs.heroRoster   || {})),
  };
}

// Sum any number of ResourceBundles into a new bundle. Used by the pack
// resolver to compose base + chosen-option contributions, and by the
// dollar-mode optimizer to accumulate purchases.
export function mergeBundles(...bundles) {
  const out = {};
  for (const b of bundles) {
    if (!b) continue;
    for (const [k, v] of Object.entries(b)) {
      if (typeof v === "number" && v !== 0) out[k] = (out[k] || 0) + v;
    }
  }
  return out;
}
