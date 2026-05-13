import { WIDGET_LEVEL_MULTIPLIER, WIDGET_SKILL_LEVEL, STAR_MULTIPLIER } from "./constants.js";

// ═══════════════════════════════════════════
// HERO GEAR ENHANCEMENT → EXPEDITION STAT %
// ═══════════════════════════════════════════
const ENH_BREAKPOINTS = [
  [0, 15], [100, 50], [200, 100],
];

export function heroGearEnhStat(enhLevel) {
  if (enhLevel <= 0) return ENH_BREAKPOINTS[0][1];
  for (let i = 1; i < ENH_BREAKPOINTS.length; i++) {
    if (enhLevel <= ENH_BREAKPOINTS[i][0]) {
      const [x0, y0] = ENH_BREAKPOINTS[i - 1];
      const [x1, y1] = ENH_BREAKPOINTS[i];
      return y0 + (y1 - y0) * (enhLevel - x0) / (x1 - x0);
    }
  }
  return ENH_BREAKPOINTS[ENH_BREAKPOINTS.length - 1][1];
}

// ═══════════════════════════════════════════
// HERO GEAR MASTERY → MULTIPLIER
// ═══════════════════════════════════════════
export const HERO_GEAR_MASTERY_MAX = 20;

export function heroGearMasteryMult(masteryLevel) {
  return 1.0 + Math.min(masteryLevel, HERO_GEAR_MASTERY_MAX) * 0.1;
}

// Piece's Leth/HP stat. Imbuement is routed to ATK/DEF via
// heroGearImbuementTroopBonus() and is NOT multiplied by mastery.
export function heroGearPieceStat(enh, mast) {
  return heroGearEnhStat(enh) * heroGearMasteryMult(mast);
}

// Expedition imbuement → flat +% troop ATK or DEF, routed by piece slot.
// Helm/Chest: ATK at +120, DEF at +160, ATK at +200.
// Gloves/Boots: DEF at +120, ATK at +160, DEF at +200 (flipped at every gate).
// Conquest gates (+140, +180) buff the HERO, not troops, so they're excluded here.
export function heroGearImbuementTroopBonus(enhLevel, pieceId) {
  let atk = 0, def = 0;
  const hc = pieceId === "helm" || pieceId === "chest";  // helm/chest vs gloves/boots
  if (enhLevel >= 120) { if (hc) atk += 20; else def += 20; }
  if (enhLevel >= 160) { if (hc) def += 30; else atk += 30; }
  if (enhLevel >= 200) { if (hc) atk += 50; else def += 50; }
  return { atk, def };
}

// Gear piece → stat mapping
export const GEAR_PIECE_STAT = {
  helm: "Leth",
  boots: "Leth",
  chest: "HP",
  gloves: "HP",
};

// ═══════════════════════════════════════════
// HERO SKILL SCALING
// ═══════════════════════════════════════════
export const SKILL_LEVEL_SCALE = [0, 0.20, 0.40, 0.60, 0.80, 1.00];

// ═══════════════════════════════════════════
// HERO LEVEL / STAR SCALING
// ═══════════════════════════════════════════
export function heroStarMultiplier(starValue) {
  const star = Math.floor(starValue);
  const step = Math.round((starValue - star) * 10);
  const baseMult = STAR_MULTIPLIER[Math.min(star, 5)] || 1.0;
  const nextMult = STAR_MULTIPLIER[Math.min(star + 1, 5)] || baseMult;
  const stepFraction = step / 6;
  return baseMult + (nextMult - baseMult) * stepFraction;
}

// ═══════════════════════════════════════════
// WIDGET STATS
// ═══════════════════════════════════════════
export function widgetExpeditionStats(dbEntry, widgetLevel) {
  if (!dbEntry?.widget?.expeditionStats || widgetLevel <= 0) return { Leth: 0, HP: 0 };
  const mult = WIDGET_LEVEL_MULTIPLIER[widgetLevel] || 0;
  return {
    Leth: (dbEntry.widget.expeditionStats.Leth || 0) * mult,
    HP: (dbEntry.widget.expeditionStats.HP || 0) * mult,
  };
}

export function widgetSkillValue(dbEntry, widgetLevel) {
  if (!dbEntry?.widget?.skill || widgetLevel <= 0) return 0;
  const skillLv = WIDGET_SKILL_LEVEL[widgetLevel] || 0;
  if (skillLv <= 0) return 0;
  return dbEntry.widget.skill.values[skillLv - 1] || 0;
}

// ═══════════════════════════════════════════
// TALENT → PASSIVE BUFFS (star-gated)
// ═══════════════════════════════════════════
export function talentBuff(dbEntry, starValue) {
  if (!dbEntry?.talent) return null;
  const star = Math.floor(starValue);
  if (star <= 0) return null;
  const idx = Math.min(star, 5) - 1;
  return {
    pct: dbEntry.talent.values[idx] || 0,
    stats: dbEntry.talent.stats || [],
  };
}

// ═══════════════════════════════════════════
// AGGREGATES — new signatures for decoupled model
// ═══════════════════════════════════════════

// Hero gear buffs from cs.heroGear (keyed by troop type, no hero lookup needed).
// Returns Leth/HP from the piece stat and ATK/DEF from Expedition imbuements.
export function computeHeroGearBuffs(heroGear) {
  const result = {
    Infantry: { ATK: 0, DEF: 0, Leth: 0, HP: 0 },
    Cavalry:  { ATK: 0, DEF: 0, Leth: 0, HP: 0 },
    Archer:   { ATK: 0, DEF: 0, Leth: 0, HP: 0 },
  };
  for (const troop of ["Infantry", "Cavalry", "Archer"]) {
    const gearSet = heroGear?.[troop] || {};
    for (const [pieceId, stat] of Object.entries(GEAR_PIECE_STAT)) {
      const piece = gearSet[pieceId] || { enh: 0, mast: 0 };
      const val = heroGearPieceStat(piece.enh || 0, piece.mast || 0);
      if (stat === "Leth") result[troop].Leth += val;
      else result[troop].HP += val;
      const imb = heroGearImbuementTroopBonus(piece.enh || 0, pieceId);
      result[troop].ATK += imb.atk;
      result[troop].DEF += imb.def;
    }
  }
  return result;
}

// Widget expedition stats for a lineup → per-troop { Leth, HP }
export function computeWidgetExpeditionBuffs(selectedHeroes, heroRoster, heroDB) {
  const result = {
    Infantry: { Leth: 0, HP: 0 },
    Cavalry: { Leth: 0, HP: 0 },
    Archer: { Leth: 0, HP: 0 },
  };
  for (const name of selectedHeroes) {
    if (!name) continue;
    const rosterEntry = heroRoster?.[name];
    if (!rosterEntry) continue;
    const dbEntry = heroDB.find(h => h.name === name);
    if (!dbEntry?.hasWidget) continue;
    const stats = widgetExpeditionStats(dbEntry, rosterEntry.widgetLv || 0);
    const troop = dbEntry.type;
    if (result[troop]) {
      result[troop].Leth += stats.Leth;
      result[troop].HP += stats.HP;
    }
  }
  return result;
}

// Map a skill description to the stat it buffs.
// Returns one of: "ATK" | "DEF" | "Leth" | "HP" | null.
export function statFromDesc(desc) {
  if (!desc) return null;
  const d = desc.toLowerCase();
  if (d.includes("lethality")) return "Leth";
  if (d.includes("health"))    return "HP";
  if (d.includes("attack"))    return "ATK";
  if (d.includes("defense"))   return "DEF";
  return null;
}

// Widget rally skill per-stat totals (only rally-mode widget skills).
// Widget skills are squad-wide (all troop types), routed by the widget's desc.
export function computeWidgetRallySkill(selectedHeroes, heroRoster, heroDB) {
  const out = { ATK: 0, DEF: 0, Leth: 0, HP: 0 };
  for (const name of selectedHeroes) {
    if (!name) continue;
    const rosterEntry = heroRoster?.[name];
    if (!rosterEntry) continue;
    const dbEntry = heroDB.find(h => h.name === name);
    if (!dbEntry?.widget?.skill || dbEntry.widget.skill.mode !== "rally") continue;
    const val = widgetSkillValue(dbEntry, rosterEntry.widgetLv || 0);
    if (val <= 0) continue;
    const stat = statFromDesc(dbEntry.widget.skill.desc) || "Leth";  // safe default
    out[stat] += val;
  }
  return out;
}

// Widget defender skill per-stat totals (only defender-mode widget skills).
export function computeWidgetDefenderSkill(selectedHeroes, heroRoster, heroDB) {
  const out = { ATK: 0, DEF: 0, Leth: 0, HP: 0 };
  for (const name of selectedHeroes) {
    if (!name) continue;
    const rosterEntry = heroRoster?.[name];
    if (!rosterEntry) continue;
    const dbEntry = heroDB.find(h => h.name === name);
    if (!dbEntry?.widget?.skill || dbEntry.widget.skill.mode !== "defender") continue;
    const val = widgetSkillValue(dbEntry, rosterEntry.widgetLv || 0);
    if (val <= 0) continue;
    const stat = statFromDesc(dbEntry.widget.skill.desc) || "HP";
    out[stat] += val;
  }
  return out;
}

// Hero ExpeditionBonus — per-hero flat ATK/DEF buff to that hero's OWN troop type
// when they're in the lineup. Scales linearly with star progress (stars + slivers),
// with 5★ = full stored value and 0★ = 0. Sliver convention: 4.3 means "4 stars + 3 slivers"
// out of 6 per star, so the normalized progress at 4.3 is (4 + 3/6) / 5 = 0.9.
export function starProgress(starValue) {
  const star = Math.floor(starValue);
  const sliver = Math.round((starValue - star) * 10);
  const fractional = star + Math.min(sliver, 6) / 6;
  return Math.min(fractional, 5) / 5;  // 0 to 1
}

export function computeExpeditionBuffs(selectedHeroes, heroRoster, heroDB) {
  const result = {
    Infantry: { ATK: 0, DEF: 0 },
    Cavalry:  { ATK: 0, DEF: 0 },
    Archer:   { ATK: 0, DEF: 0 },
  };
  for (const name of selectedHeroes) {
    if (!name) continue;
    const rosterEntry = heroRoster?.[name];
    if (!rosterEntry) continue;
    const dbEntry = heroDB.find(h => h.name === name);
    if (!dbEntry?.expeditionBonus) continue;
    const troop = dbEntry.type;
    if (!result[troop]) continue;
    const scale = starProgress(rosterEntry.stars || 0);
    result[troop].ATK += (dbEntry.expeditionBonus.ATK || 0) * scale;
    result[troop].DEF += (dbEntry.expeditionBonus.DEF || 0) * scale;
  }
  return result;
}

// Talent buffs for a lineup → { ATK, Leth, HP, DEF }
export function computeTalentBuffs(selectedHeroes, heroRoster, heroDB) {
  const buffs = { ATK: 0, Leth: 0, HP: 0, DEF: 0 };
  for (const name of selectedHeroes) {
    if (!name) continue;
    const rosterEntry = heroRoster?.[name];
    if (!rosterEntry) continue;
    const dbEntry = heroDB.find(h => h.name === name);
    if (!dbEntry?.talent) continue;
    const tb = talentBuff(dbEntry, rosterEntry.stars || 0);
    if (!tb) continue;
    for (const stat of tb.stats) {
      if (stat in buffs) buffs[stat] += tb.pct;
      if (stat === "Lethality") buffs.Leth += tb.pct;
      if (stat === "Health") buffs.HP += tb.pct;
      if (stat === "Attack") buffs.ATK += tb.pct;
      if (stat === "Defense") buffs.DEF += tb.pct;
    }
  }
  return buffs;
}
