// Troop base stats — authoritative table loaded from troop-base-stats-data.js
// (an auto-generated mirror of troop-base-stats.json; kept as .js so it works
// in Node ESM and Vite without JSON-import attributes).
// Shape of each row: { type, tier, tg_level, attack, defense, lethality, health }
// Lookup key: (type, tier, tgLevel) → { ATK, DEF, Leth, HP }.

import { TROOP_BASE_STATS_RAW as raw } from "./troop-base-stats-data.js";

export const TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
export const TG_LEVELS = [0, 1, 2, 3, 4, 5];
export const TROOP_TYPES = ["Infantry", "Cavalry", "Archer"];

// Build a fast lookup: TABLE[type][tier][tgLevel] = stat block
const TABLE = { Infantry: {}, Cavalry: {}, Archer: {} };
for (const r of raw) {
  if (!TABLE[r.type][r.tier]) TABLE[r.type][r.tier] = {};
  TABLE[r.type][r.tier][r.tg_level] = {
    ATK: r.attack,
    DEF: r.defense,
    Leth: r.lethality,
    HP: r.health,
  };
}

export function lookupBaseStats(type, tier, tgLevel = 0) {
  const row = TABLE[type]?.[tier]?.[tgLevel];
  if (!row) throw new Error(`No base stats for ${type} T${tier} TG${tgLevel}`);
  return row;
}

export function totalCount(composition) {
  if (!Array.isArray(composition)) return 0;
  let n = 0;
  for (const g of composition) n += Math.max(0, g.count || 0);
  return n;
}

// Weighted-average base stats across a composition. If total count is zero,
// returns a sensible default (T1 TG0) so downstream math still produces
// finite values without special-casing empty troop types.
export function aggregateBaseStats(type, composition) {
  const comp = Array.isArray(composition) ? composition : [];
  const total = totalCount(comp);
  if (total === 0) return lookupBaseStats(type, 1, 0);

  let atk = 0, def = 0, leth = 0, hp = 0;
  for (const g of comp) {
    const c = Math.max(0, g.count || 0);
    if (c === 0) continue;
    const b = lookupBaseStats(type, g.tier, g.tgLevel ?? 0);
    atk  += c * b.ATK;
    def  += c * b.DEF;
    leth += c * b.Leth;
    hp   += c * b.HP;
  }
  return {
    ATK: atk / total,
    DEF: def / total,
    Leth: leth / total,
    HP: hp / total,
  };
}

// Min tier across a composition — used to gate TG3+ troop-generation abilities.
export function minTier(composition) {
  const comp = Array.isArray(composition) ? composition : [];
  let m = Infinity;
  for (const g of comp) {
    if ((g.count || 0) > 0 && g.tier < m) m = g.tier;
  }
  return Number.isFinite(m) ? m : 1;
}
