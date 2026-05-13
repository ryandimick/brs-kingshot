import { TROOP_TYPES } from "../data/constants.js";
import { HERO_DB } from "../data/hero-database.js";
import { aggregateBaseStats, totalCount } from "../data/troop-base-stats.js";
import { GOV_GEAR_SLOTS, GOV_GEAR_TIERS, CHARM_LEVELS, GOV_GEAR_COSTS, CHARM_COSTS, forgehammerCost, heroGearEPCost, getSetBonus } from "../data/gear-tables.js";
import { heroGearPieceStat, GEAR_PIECE_STAT, HERO_GEAR_MASTERY_MAX, widgetExpeditionStats, widgetSkillValue, statFromDesc } from "../data/hero-tables.js";
import { marginalCostUSD } from "../data/pack-economy.js";
import { computeBuffsForLineup } from "./buffs.js";

// Resolve count-weighted base stats for each troop type from cs.troops[*].composition.
// Returns { Infantry: {ATK,Leth,HP,DEF}, Cavalry: {...}, Archer: {...} }.
export function baseStatsFor(cs) {
  const out = {};
  const troops = cs?.troops || {};
  for (const t of TROOP_TYPES) {
    out[t] = aggregateBaseStats(t, troops[t]?.composition);
  }
  return out;
}

export function troopCountsFor(cs) {
  const out = {};
  const troops = cs?.troops || {};
  for (const t of TROOP_TYPES) out[t] = totalCount(troops[t]?.composition);
  return out;
}

export function eff(base, pct) {
  return base * (1 + pct / 100);
}

export function offProduct(base, buffs) {
  return eff(base.ATK, buffs.ATK) * eff(base.Leth, buffs.Leth) / 100;
}

export function defProduct(base, buffs) {
  return eff(base.HP, buffs.HP) * eff(base.DEF, buffs.DEF) / 100;
}

// Flat/conditional DamageUp & DefenseUp skills are additive % buffs to specific stats,
// routed by parsing the skill desc (e.g. "Squads' Lethality" → Leth). Chance skills
// and all OppDamageDown skills stay in the multiplicative SkillMod layer below.
function skillStatFromCat(skill) {
  const descStat = statFromDesc(skill.desc);
  if (descStat) return descStat;
  // Fallback when desc doesn't name a stat explicitly:
  if (skill.cat === "DamageUp")   return "Leth";  // offensive catch-all
  if (skill.cat === "DefenseUp")  return "DEF";
  return null;
}

export function computeSkillFlatBuffs(selectedHeroes, heroRoster, joinerSlots = []) {
  const flat = { ATK: 0, DEF: 0, Leth: 0, HP: 0 };

  function addFlat(skill, skillLv) {
    if (!skill || skillLv <= 0) return;
    if (skill.combatRelevant === false || skill.type === "growth") return;
    if (skill.type !== "flat" && skill.type !== "conditional") return;
    if (skill.cat !== "DamageUp" && skill.cat !== "DefenseUp") return;  // OppDamageDown stays multiplicative
    const val = skill.values ? skill.values[skillLv - 1] || 0 : 0;
    if (val <= 0) return;
    const stat = skillStatFromCat(skill);
    if (stat && stat in flat) flat[stat] += val;

    if (skill.dualOp && skill.values2) {
      const v2 = skill.values2[skillLv - 1] || 0;
      if (v2 > 0) {
        // Dual-op: typically DamageUp on main stat, DefenseUp on the secondary (op2>=111).
        const dualStat = skill.cat === "DamageUp" && skill.op2 >= 111 ? "DEF" : stat;
        if (dualStat && dualStat in flat) flat[dualStat] += v2;
      }
    }
  }

  for (const name of selectedHeroes) {
    if (!name) continue;
    const rosterEntry = heroRoster?.[name];
    const dbEntry = HERO_DB.find(h => h.name === name);
    if (!dbEntry?.expeditionSkills) continue;
    const skillLevels = rosterEntry?.skills || [0, 0, 0];
    dbEntry.expeditionSkills.forEach((s, i) => addFlat(s, skillLevels[i] || 0));
  }
  for (const heroName of joinerSlots) {
    const hero = HERO_DB.find(h => h.name === heroName);
    if (!hero?.expeditionSkills) continue;
    addFlat(hero.expeditionSkills[0], 5);
  }
  return flat;
}

export function computeSkillMod(selectedHeroes, heroRoster, joinerSlots) {
  const buckets = {};

  function addSkill(skill, skillLv) {
    if (!skill || skillLv <= 0) return;
    if (skill.combatRelevant === false || skill.type === "growth") return;

    if (skill.type === "flat" || skill.type === "conditional") {
      // Flat/conditional DamageUp & DefenseUp are handled as additive flat % buffs
      // in computeSkillFlatBuffs. Only OppDamageDown stays multiplicative here.
      if (skill.cat !== "OppDamageDown") return;
      if (!skill.op) return;
      const val = skill.values ? skill.values[skillLv - 1] || 0 : 0;
      if (val <= 0) return;
      buckets[`odd_${skill.op}`] = (buckets[`odd_${skill.op}`] || 0) + val;

      if (skill.dualOp && skill.op2) {
        const val2 = skill.values2 ? skill.values2[skillLv - 1] || 0 : 0;
        if (val2 > 0) buckets[`odd_${skill.op2}`] = (buckets[`odd_${skill.op2}`] || 0) + val2;
      }
    } else if (skill.type === "chance") {
      const procPct = skill.procChance ? skill.procChance[skillLv - 1] || 0 : 0;
      const mag = Array.isArray(skill.magnitude) ? skill.magnitude[skillLv - 1] || 0 : skill.magnitude || 0;
      if (procPct <= 0 || mag <= 0) return;
      const ev = (procPct / 100) * mag;
      if (skill.cat === "DamageUp")          buckets["chance_du"]  = (buckets["chance_du"]  || 0) + ev;
      else if (skill.cat === "DefenseUp")    buckets["chance_def"] = (buckets["chance_def"] || 0) + ev;
      else if (skill.cat === "OppDamageDown") buckets["chance_odd"] = (buckets["chance_odd"] || 0) + ev;
    }
  }

  for (const name of selectedHeroes) {
    if (!name) continue;
    const rosterEntry = heroRoster?.[name];
    const dbEntry = HERO_DB.find(h => h.name === name);
    if (!dbEntry?.expeditionSkills) continue;
    const skillLevels = rosterEntry?.skills || [0, 0, 0];
    dbEntry.expeditionSkills.forEach((skill, i) => addSkill(skill, skillLevels[i] || 0));
  }
  for (const heroName of joinerSlots) {
    const hero = HERO_DB.find(h => h.name === heroName);
    if (!hero?.expeditionSkills) continue;
    addSkill(hero.expeditionSkills[0], 5);
  }

  // du now only reflects chance-based DamageUp
  let du = buckets["chance_du"] > 0 ? 1 + buckets["chance_du"] / 100 : 1;
  let defUp = buckets["chance_def"] > 0 ? 1 + buckets["chance_def"] / 100 : 1;
  let oddDown = 1;
  for (const [key, val] of Object.entries(buckets)) {
    if (key.startsWith("odd_") && val > 0) oddDown *= (1 + val / 100);
  }
  if (buckets["chance_odd"] > 0) oddDown *= (1 + buckets["chance_odd"] / 100);

  return { du, defUp, oddDown, buckets };
}

// ═══════════════════════════════════════════
// LINEUP OPTIMIZER
// ═══════════════════════════════════════════
// Finds the best 3-hero lineup (1 per troop slot) from the roster.
// Scores each combo using actual stat product output from the full buff pipeline.
// mode: "attack" weights offense 65/defense 35, "garrison" inverts to 35/65.

export function optimizeLineup(cs, mode) {
  const roster = cs.heroRoster || {};
  const rosterNames = Object.keys(roster);
  if (rosterNames.length === 0) return ["", "", ""];

  const config = mode === "attack" ? cs.attackRally : cs.garrisonLead;
  const joinerSlots = mode === "attack" ? (config?.joinerSlots || []) : [];
  const widgetMode = mode === "attack" ? "rally" : "defender";
  const offPct = config?.offenseWeight ?? (mode === "attack" ? 75 : 25);
  const offWeight = offPct / 100;
  const defWeight = 1 - offWeight;

  const SLOTS = ["Infantry", "Cavalry", "Archer"];

  // Build candidates per slot
  const candidates = SLOTS.map(troop => {
    const heroes = rosterNames.filter(name => {
      const db = HERO_DB.find(h => h.name === name);
      return db?.type === troop;
    });
    heroes.push(""); // allow empty slot
    return heroes;
  });

  let bestScore = -Infinity;
  let bestLineup = ["", "", ""];

  for (const inf of candidates[0]) {
    for (const cav of candidates[1]) {
      for (const arch of candidates[2]) {
        const lineup = [inf, cav, arch];

        // Compute actual buffs for this lineup
        const buffs = computeBuffsForLineup(cs, lineup, widgetMode);
        const sm = computeSkillMod(lineup, roster, joinerSlots);

        // Total battle damage = sum of (√troops × stat_product) across troop types
        // This is the proper weighting from the army_factor formula.
        const counts = troopCountsFor(cs);
        const bases  = baseStatsFor(cs);
        let offScore = 0, defScore = 0;
        for (const t of TROOP_TYPES) {
          const sqrtTroops = Math.sqrt(Math.max(counts[t] || 0, 1));
          const off = eff(bases[t].ATK, buffs[t].ATK) * eff(bases[t].Leth, buffs[t].Leth) / 100;
          const def = eff(bases[t].HP, buffs[t].HP) * eff(bases[t].DEF, buffs[t].DEF) / 100;
          offScore += sqrtTroops * off;
          defScore += sqrtTroops * def;
        }
        offScore *= sm.du;
        defScore *= sm.defUp * sm.oddDown;
        const score = offScore * offWeight + defScore * defWeight;

        if (score > bestScore) {
          bestScore = score;
          bestLineup = lineup;
        }
      }
    }
  }

  return bestLineup;
}

export function marginal(base, buffs, stat, gain, fn) {
  const before = fn(base, buffs);
  const after = fn(base, { ...buffs, [stat]: buffs[stat] + gain });
  return { abs: after - before, pct: (after - before) / before * 100 };
}

export function computeStatProducts(totalBuffs, cs) {
  const bases = baseStatsFor(cs);
  const r = {};
  for (const t of TROOP_TYPES) {
    const eA = eff(bases[t].ATK, totalBuffs[t].ATK);
    const eL = eff(bases[t].Leth, totalBuffs[t].Leth);
    const eH = eff(bases[t].HP, totalBuffs[t].HP);
    const eD = eff(bases[t].DEF, totalBuffs[t].DEF);
    r[t] = { off: eA * eL / 100, def: eH * eD / 100, eA, eL, eH, eD, aRatio: eA / eL, hRatio: eH / eD };
  }
  return r;
}

// ═══════════════════════════════════════════
// SPECIFIC INVESTMENT OPTIONS
// ═══════════════════════════════════════════

const PIECE_NAMES = { helm: "Helm", boots: "Boots", chest: "Chest", gloves: "Gloves" };
const TROOP_LABELS = ["Infantry", "Cavalry", "Archer"];

// Compute dynamic troop weights from actual damage contribution.
// Weight = (√troops_i × stat_product_i) / Σ(√troops_j × stat_product_j)
// This reflects each troop type's real share of total battle output.
function computeTroopWeights(cs, buffs, productFn) {
  const counts = troopCountsFor(cs);
  const bases  = baseStatsFor(cs);
  const contributions = {};
  let total = 0;
  for (const t of TROOP_TYPES) {
    const troopCount = Math.max(counts[t] || 0, 1);
    const product = productFn(bases[t], buffs[t]);
    const contribution = Math.sqrt(troopCount) * product;
    contributions[t] = contribution;
    total += contribution;
  }
  const weights = {};
  for (const t of TROOP_TYPES) {
    weights[t] = total > 0 ? contributions[t] / total : 1 / 3;
  }
  return weights;
}

// Score an option against a single buff set using dynamic weights
function _scoreVs(statGains, buffs, troopScope, cs) {
  const offWeights = computeTroopWeights(cs, buffs, offProduct);
  const defWeights = computeTroopWeights(cs, buffs, defProduct);
  const bases = baseStatsFor(cs);
  let tOff = 0, tDef = 0;
  for (const t of TROOP_TYPES) {
    if (!troopScope || troopScope === t) {
      for (const [stat, gain] of Object.entries(statGains)) {
        if (stat === "ATK" || stat === "Leth") tOff += marginal(bases[t], buffs[t], stat, gain, offProduct).pct * offWeights[t];
        if (stat === "HP" || stat === "DEF") tDef += marginal(bases[t], buffs[t], stat, gain, defProduct).pct * defWeights[t];
      }
    }
  }
  return { tOff, tDef };
}

// Score against both attack + garrison buffs, with per-scenario offense/defense weights
function scoreOption(statGains, attackBuffs, garrisonBuffs, troopScope, cs, scenarios) {
  const atkWeight = cs.attackRally?.offenseWeight ?? 75;
  const garWeight = cs.garrisonLead?.offenseWeight ?? 25;

  let atkComb = 0, garComb = 0;

  if (scenarios !== "garrison-only") {
    const a = _scoreVs(statGains, attackBuffs, troopScope, cs);
    atkComb = a.tOff * (atkWeight / 100) + a.tDef * (1 - atkWeight / 100);
  }
  if (scenarios !== "attack-only") {
    const g = _scoreVs(statGains, garrisonBuffs, troopScope, cs);
    garComb = g.tOff * (garWeight / 100) + g.tDef * (1 - garWeight / 100);
  }

  // Per-troop breakdown (combined across both scenarios)
  const bases = baseStatsFor(cs);
  const pt = {};
  for (const t of TROOP_TYPES) {
    let og = 0, dg = 0;
    if (!troopScope || troopScope === t) {
      for (const [stat, gain] of Object.entries(statGains)) {
        if (stat === "ATK" || stat === "Leth") {
          if (scenarios !== "garrison-only") og += marginal(bases[t], attackBuffs[t], stat, gain, offProduct).pct;
          if (scenarios !== "attack-only") og += marginal(bases[t], garrisonBuffs[t], stat, gain, offProduct).pct;
        }
        if (stat === "HP" || stat === "DEF") {
          if (scenarios !== "garrison-only") dg += marginal(bases[t], attackBuffs[t], stat, gain, defProduct).pct;
          if (scenarios !== "attack-only") dg += marginal(bases[t], garrisonBuffs[t], stat, gain, defProduct).pct;
        }
      }
    }
    pt[t] = { og, dg };
  }

  const comb = atkComb + garComb;
  return { atkComb, garComb, comb, pt };
}

export function computeInvestments(cs, attackBuffs, garrisonBuffs) {
  const options = [];
  const currentSlots = cs.govGearSlots || {};
  const currentSetBonus = getSetBonus(currentSlots);

  // ── Gov Gear ──
  for (const slot of GOV_GEAR_SLOTS) {
    const currentIdx = currentSlots[slot.id] || 0;
    const nextIdx = currentIdx + 1;
    if (nextIdx >= GOV_GEAR_TIERS.length) continue;
    const currentTier = GOV_GEAR_TIERS[currentIdx];
    const nextTier = GOV_GEAR_TIERS[nextIdx];
    const pieceDelta = nextTier.total - currentTier.total;

    const simSlots = { ...currentSlots, [slot.id]: nextIdx };
    const newSetBonus = getSetBonus(simSlots);
    const setAtkDelta = newSetBonus.atk3 - currentSetBonus.atk3;
    const setDefDelta = newSetBonus.def3 - currentSetBonus.def3;

    const cost = GOV_GEAR_COSTS[nextIdx];
    const hasSetChange = setAtkDelta > 0 || setDefDelta > 0;
    const setNote = hasSetChange ? ` [SET +${setAtkDelta > 0 ? setAtkDelta + "% ATK" : ""}${setAtkDelta > 0 && setDefDelta > 0 ? " +" : ""}${setDefDelta > 0 ? setDefDelta + "% DEF" : ""}]` : "";

    const pieceScore = scoreOption({ ATK: pieceDelta, DEF: pieceDelta }, attackBuffs, garrisonBuffs, slot.troop, cs);
    const setScore = hasSetChange ? scoreOption({ ATK: setAtkDelta, DEF: setDefDelta }, attackBuffs, garrisonBuffs, null, cs) : { comb: 0, pt: {} };

    const pt = {};
    for (const t of TROOP_TYPES) {
      pt[t] = {
        og: (pieceScore.pt[t]?.og || 0) + (setScore.pt[t]?.og || 0),
        dg: (pieceScore.pt[t]?.dg || 0) + (setScore.pt[t]?.dg || 0),
      };
    }
    const atkComb = (pieceScore.atkComb || 0) + (setScore.atkComb || 0);
    const garComb = (pieceScore.garComb || 0) + (setScore.garComb || 0);
    const comb = atkComb + garComb;
    const costValue = cost ? (cost.artisan || cost.threads) : 1;

    options.push({
      id: `govgear_${slot.id}`,
      name: `Gov ${slot.name} (${slot.troop})`,
      desc: `${currentTier.label} \u2192 ${nextTier.label}${setNote}`,
      icon: slot.icon,
      costLabel: cost ? `${(cost.artisan || cost.threads).toLocaleString()} ${cost.artisan ? "Artisan" : "Threads"}` : "",
      costValue,
      costType: "govgear",
      resourceCosts: cost ? { satin: cost.satin, threads: cost.threads, artisan: cost.artisan } : {},
      atkComb, garComb, comb, pt,
      efficiency: costValue > 0 ? comb / costValue : 0,
      _preScored: true,
    });
  }

  // ── Hero Gear Mastery — keyed by troop type ──
  for (const troop of TROOP_LABELS) {
    const gearSet = cs.heroGear?.[troop] || {};
    for (const [pieceId, stat] of Object.entries(GEAR_PIECE_STAT)) {
      const piece = gearSet[pieceId] || { enh: 0, mast: 0 };
      if (piece.mast >= HERO_GEAR_MASTERY_MAX) continue;
      const current = heroGearPieceStat(piece.enh, piece.mast);
      const upgraded = heroGearPieceStat(piece.enh, piece.mast + 1);
      const gain = upgraded - current;
      if (gain <= 0) continue;
      const cost = forgehammerCost(piece.mast + 1);
      options.push({
        id: `mastery_${troop}_${pieceId}`,
        name: `${troop} ${PIECE_NAMES[pieceId]} Mastery`,
        desc: `Lv ${piece.mast} \u2192 ${piece.mast + 1} (${stat === "Leth" ? "Leth" : "HP"})`,
        icon: "\u{1F528}",
        statGains: { [stat]: gain },
        troopScope: troop,
        costLabel: `${cost.forgehammers} FH${cost.mythicGears ? ` + ${cost.mythicGears} MG` : ""}`,
        costValue: cost.forgehammers,
        costType: "forgehammer",
        resourceCosts: { forgehammers: cost.forgehammers, mythicGears: cost.mythicGears || 0 },
      });
    }
  }

  // ── Hero Gear Enhancement (+10 XP levels) — keyed by troop type ──
  for (const troop of TROOP_LABELS) {
    const gearSet = cs.heroGear?.[troop] || {};
    for (const [pieceId, stat] of Object.entries(GEAR_PIECE_STAT)) {
      const piece = gearSet[pieceId] || { enh: 0, mast: 0 };
      if (piece.enh >= 200) continue;
      const step = Math.min(10, 200 - piece.enh);
      const current = heroGearPieceStat(piece.enh, piece.mast);
      const upgraded = heroGearPieceStat(piece.enh + step, piece.mast);
      const gain = upgraded - current;
      if (gain <= 0) continue;
      const epCost = heroGearEPCost(piece.enh, piece.enh + step);
      options.push({
        id: `enh_${troop}_${pieceId}`,
        name: `${troop} ${PIECE_NAMES[pieceId]} Enh`,
        desc: `+${step} (${piece.enh} \u2192 ${piece.enh + step}, ${stat === "Leth" ? "Leth" : "HP"})`,
        icon: "\u2B06\uFE0F",
        statGains: { [stat]: gain },
        troopScope: troop,
        costLabel: `${epCost.toLocaleString()} EP`,
        costValue: epCost,
        costType: "heroXP",
        resourceCosts: { epCost },  // not in tracked packs → no USD price
      });
    }
  }

  // ── Gov Charms ──
  for (const slot of GOV_GEAR_SLOTS) {
    for (let ci = 0; ci < 3; ci++) {
      const currentLv = cs.charmLevels?.[slot.troop]?.[slot.id]?.[ci] || 0;
      const nextLv = currentLv + 1;
      if (nextLv >= CHARM_LEVELS.length) continue;
      const gain = CHARM_LEVELS[nextLv].total - CHARM_LEVELS[currentLv].total;
      if (gain <= 0) continue;
      const cost = CHARM_COSTS[nextLv];
      options.push({
        id: `charm_${slot.id}_${ci}`,
        name: `${slot.name} Charm ${ci + 1} (${slot.troop})`,
        desc: `${CHARM_LEVELS[currentLv].label} \u2192 ${CHARM_LEVELS[nextLv].label} (Leth+HP)`,
        icon: "\u{1F48E}",
        statGains: { Leth: gain, HP: gain },
        troopScope: slot.troop,
        costLabel: cost ? `${cost.designs.toLocaleString()} Designs` : "",
        costValue: cost ? cost.designs : 1,
        costType: "charm",
        resourceCosts: cost ? { designs: cost.designs, guides: cost.guides } : {},
      });
    }
  }

  // ── Hero Widgets — iterate roster, scope to lineup(s) hero is in ──
  const attackHeroes = cs.attackRally?.selectedHeroes || [];
  const garrisonHeroes = cs.garrisonLead?.selectedHeroes || [];

  for (const [name, rosterEntry] of Object.entries(cs.heroRoster || {})) {
    const dbEntry = HERO_DB.find(h => h.name === name);
    if (!dbEntry?.hasWidget) continue;
    const currentLv = rosterEntry.widgetLv || 0;
    if (currentLv >= 10) continue;
    const nextLv = currentLv + 1;
    const heroTroop = dbEntry.type;
    const inAttack = attackHeroes.includes(name);
    const inGarrison = garrisonHeroes.includes(name);
    if (!inAttack && !inGarrison) continue; // widget only matters if hero is in a lineup

    const currentStats = widgetExpeditionStats(dbEntry, currentLv);
    const nextStats = widgetExpeditionStats(dbEntry, nextLv);
    const lethGain = nextStats.Leth - currentStats.Leth;
    const hpGain = nextStats.HP - currentStats.HP;
    const currentSkillVal = widgetSkillValue(dbEntry, currentLv);
    const nextSkillVal = widgetSkillValue(dbEntry, nextLv);
    const skillDelta = nextSkillVal - currentSkillVal;
    const widgetMode = dbEntry.widget?.skill?.mode || "";

    // Build stat gains: expedition stats always, skill only in matching scenario
    const statGains = {};
    let totalLeth = lethGain, totalHP = hpGain;
    if (skillDelta > 0 && widgetMode === "rally" && inAttack) totalLeth += skillDelta;
    if (skillDelta > 0 && widgetMode === "defender" && inGarrison) totalHP += skillDelta;
    if (totalLeth > 0) statGains.Leth = totalLeth;
    if (totalHP > 0) statGains.HP = totalHP;
    if (Object.keys(statGains).length === 0) continue;

    const fragmentCost = nextLv * 5;
    const scenarios = inAttack && inGarrison ? undefined : inAttack ? "attack-only" : "garrison-only";
    const scenarioLabel = inAttack && inGarrison ? "ATK+GAR" : inAttack ? "ATK" : "GAR";
    const skillNote = skillDelta > 0 ? ` +${skillDelta}% ${widgetMode}` : "";

    options.push({
      id: `widget_${name}`,
      name: `${name} Widget`,
      desc: `Lv ${currentLv} \u2192 ${nextLv} (${heroTroop}${skillNote}) [${scenarioLabel}]`,
      icon: "\u2B50",
      statGains,
      troopScope: heroTroop,
      costLabel: `${fragmentCost} Widgets`,
      costValue: fragmentCost,
      costType: "widget",
      resourceCosts: { widgetFragments: fragmentCost },  // no USD price
      scenarios,
    });
  }

  // Score and rank
  const results = options.map(opt => {
    if (opt._preScored) return opt;
    const score = scoreOption(opt.statGains, attackBuffs, garrisonBuffs, opt.troopScope || null, cs, opt.scenarios);
    const efficiency = opt.costValue > 0 ? score.comb / opt.costValue : 0;
    return { ...opt, ...score, efficiency };
  });

  // Attach USD cost / efficiency using the configured pack baseline tier.
  // Items not offered in any tracked pack (mythic gear, hero XP cloths, widget
  // fragments) leave usdCost null and usdEff null.
  for (const r of results) {
    const usd = marginalCostUSD(r.resourceCosts || {});
    r.usdCost = usd;
    r.usdEff = (usd != null && usd > 0) ? r.comb / usd : null;
  }

  // Sort by absolute combined gain. Costs are in different currencies (Artisan,
  // Designs, Forgehammers, EP, Widgets) so gain/cost isn't comparable across types.
  // The Scenario Planner handles budget-constrained allocation separately.
  results.sort((a, b) => b.comb - a.comb);

  const tierCuts = [3, 8, 15];
  return results.map((r, i) => ({
    ...r,
    tier: i < tierCuts[0] ? "S" : i < tierCuts[1] ? "A" : i < tierCuts[2] ? "B" : "C",
  }));
}
