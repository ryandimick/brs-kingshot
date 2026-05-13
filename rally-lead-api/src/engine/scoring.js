import { TROOP_TYPES } from "../data/constants.js";
import { offProduct, defProduct, marginal, baseStatsFor, troopCountsFor } from "./combat.js";

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

// Combined value of a stat gain across attack-rally and garrison-lead lineups
export function computeGain(statGains, troopScope, cs, attackBuffsSim, garrisonBuffsSim) {
  const atkW = (cs.attackRally?.offenseWeight ?? 75) / 100;
  const garW = (cs.garrisonLead?.offenseWeight ?? 25) / 100;
  const atkOffW = weightsFor(cs, attackBuffsSim, offProduct);
  const atkDefW = weightsFor(cs, attackBuffsSim, defProduct);
  const garOffW = weightsFor(cs, garrisonBuffsSim, offProduct);
  const garDefW = weightsFor(cs, garrisonBuffsSim, defProduct);
  const bases = baseStatsFor(cs);
  let atkVal = 0, garVal = 0;

  for (const t of TROOP_TYPES) {
    if (troopScope && troopScope !== t) continue;
    for (const [stat, gain] of Object.entries(statGains)) {
      if (stat === "ATK" || stat === "Leth") {
        atkVal += marginal(bases[t], attackBuffsSim[t], stat, gain, offProduct).pct * atkOffW[t] * atkW;
        garVal += marginal(bases[t], garrisonBuffsSim[t], stat, gain, offProduct).pct * garOffW[t] * garW;
      }
      if (stat === "HP" || stat === "DEF") {
        atkVal += marginal(bases[t], attackBuffsSim[t], stat, gain, defProduct).pct * atkDefW[t] * (1 - atkW);
        garVal += marginal(bases[t], garrisonBuffsSim[t], stat, gain, defProduct).pct * garDefW[t] * (1 - garW);
      }
    }
  }
  return atkVal + garVal;
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
