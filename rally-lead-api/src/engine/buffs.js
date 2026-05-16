import { TROOP_TYPES, STAT_NAMES } from "../data/constants.js";
import { HERO_DB } from "../data/hero-database.js";
import {
  computeHeroGearBuffs,
  computeWidgetExpeditionBuffs,
  computeWidgetRallySkill,
  computeWidgetDefenderSkill,
  computeTalentBuffs,
  computeExpeditionBuffs,
} from "../data/hero-tables.js";
import { computeSkillFlatBuffs } from "./combat.js";

// Returns the flattened in-game DISPLAYED buff % per troop / per stat:
//   displayed = additive_sum × (1 + widget_skill_pct/100)
// where additive_sum = Bonus Overview (Research + Alliance Tech + Outposts +
// Skins + Gov Gear + Charms + Pets, all already inside the in-game BO total)
// + hero gear (enhancement Leth/HP + imbuement ATK/DEF, NOT in the in-game BO)
// + hero widget expedition stats + talents + flat/conditional DamageUp/DefenseUp
// skills. The widget exclusive skill is applied multiplicatively on the
// percentage, not folded into the additive bucket — matches the in-game UI.
// Consumers: stat products, lineup optimizer, investment scoring.
export function computeBuffsForLineup(cs, selectedHeroes, widgetMode, joinerSlots = []) {
  const { additive, widgetSkillPct } = computeBuffBreakdownForLineup(cs, selectedHeroes, widgetMode, joinerSlots);
  const result = {};
  for (const t of TROOP_TYPES) {
    result[t] = { ATK: 0, Leth: 0, HP: 0, DEF: 0 };
    for (const s of STAT_NAMES) {
      const a = additive[t]?.[s] || 0;
      const ws = widgetSkillPct[s] || 0;
      result[t][s] = a * (1 + ws / 100);
    }
  }
  return result;
}

export function computeAttackBuffs(cs) {
  return computeBuffsForLineup(
    cs,
    cs.attackRally?.selectedHeroes || [],
    "rally",
    cs.attackRally?.joinerSlots || []
  );
}

export function computeGarrisonBuffs(cs) {
  return computeBuffsForLineup(
    cs,
    cs.garrisonLead?.selectedHeroes || [],
    "defender",
    []
  );
}

// Battle Report breakdown: returns the additive sum and the widget exclusive
// skill as separate components so the UI can apply additional multiplicative
// layers (e.g. the +20% squad-buff toggle):
//   displayed_pct = additive × (1 + widgetSkillPct/100) × (1 + squad/100)
// Widget skills are squad-wide so widgetSkillPct is a single per-stat object
// (not per-troop). The flattened computeBuffsForLineup above is the same
// formula minus the squad toggle, and is what stat products / optimizer use.
export function computeBuffBreakdownForLineup(cs, selectedHeroes, widgetMode, joinerSlots = []) {
  const additive = {};
  const bo = cs.bonusOverview || {};
  const boSquads = bo.squads || {};

  const heroGearBuffs = computeHeroGearBuffs(cs.heroGear || {});
  const widgetBuffs = computeWidgetExpeditionBuffs(selectedHeroes, cs.heroRoster || {}, HERO_DB);
  const widgetSkillBuffs = widgetMode === "rally"
    ? computeWidgetRallySkill(selectedHeroes, cs.heroRoster || {}, HERO_DB)
    : computeWidgetDefenderSkill(selectedHeroes, cs.heroRoster || {}, HERO_DB);
  const talentBuffs = computeTalentBuffs(selectedHeroes, cs.heroRoster || {}, HERO_DB);
  const expBuffs = computeExpeditionBuffs(selectedHeroes, cs.heroRoster || {}, HERO_DB);
  const skillFlat = computeSkillFlatBuffs(selectedHeroes, cs.heroRoster || {}, joinerSlots);

  for (const t of TROOP_TYPES) {
    additive[t] = { ATK: 0, Leth: 0, HP: 0, DEF: 0 };
    for (const s of STAT_NAMES) {
      additive[t][s] += (boSquads[s] || 0) + (bo[t]?.[s] || 0);
    }
    const hg = heroGearBuffs[t] || { ATK: 0, DEF: 0, Leth: 0, HP: 0 };
    const wb = widgetBuffs[t] || { Leth: 0, HP: 0 };
    const eb = expBuffs[t] || { ATK: 0, DEF: 0 };

    // Widget exclusive skill is intentionally EXCLUDED here.
    additive[t].ATK  += talentBuffs.ATK  + hg.ATK  + eb.ATK  + skillFlat.ATK;
    additive[t].DEF  += talentBuffs.DEF  + hg.DEF  + eb.DEF  + skillFlat.DEF;
    additive[t].Leth += talentBuffs.Leth + hg.Leth + wb.Leth + skillFlat.Leth;
    additive[t].HP   += talentBuffs.HP   + hg.HP   + wb.HP   + skillFlat.HP;
  }

  return {
    additive,
    widgetSkillPct: {
      ATK:  widgetSkillBuffs.ATK  || 0,
      DEF:  widgetSkillBuffs.DEF  || 0,
      Leth: widgetSkillBuffs.Leth || 0,
      HP:   widgetSkillBuffs.HP   || 0,
    },
  };
}

export function computeAttackBuffBreakdown(cs) {
  return computeBuffBreakdownForLineup(
    cs,
    cs.attackRally?.selectedHeroes || [],
    "rally",
    cs.attackRally?.joinerSlots || []
  );
}

export function computeGarrisonBuffBreakdown(cs) {
  return computeBuffBreakdownForLineup(
    cs,
    cs.garrisonLead?.selectedHeroes || [],
    "defender",
    []
  );
}

// Flatten a { additive, widgetSkillPct } breakdown into per-troop displayed
// pct values: displayed[t][s] = additive[t][s] × (1 + widgetSkillPct[s]/100).
// Equivalent to the result of computeBuffsForLineup, but operates on a
// breakdown you already have in hand (avoids recomputing).
export function flattenBreakdown(breakdown) {
  const result = {};
  for (const t of TROOP_TYPES) {
    result[t] = { ATK: 0, Leth: 0, HP: 0, DEF: 0 };
    for (const s of STAT_NAMES) {
      const a = breakdown.additive[t]?.[s] || 0;
      const ws = breakdown.widgetSkillPct[s] || 0;
      result[t][s] = a * (1 + ws / 100);
    }
  }
  return result;
}
