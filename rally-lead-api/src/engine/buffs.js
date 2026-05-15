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

// Notes on layering:
//   - bonusOverview is the user's manual snapshot of the in-game Bonus Overview
//     screen (Research + Alliance Tech + Outposts + Skins + Gov Gear + Charms + Pets).
//     Pets are inside that total, so we do NOT add pets again here.
//   - Hero gear (enhancement Leth/HP and imbuement ATK/DEF) is NOT included in
//     the in-game Bonus Overview panel, so the app adds it on top.
//   - Hero expeditionBonus, widget expedition stats, widget skills, talents, and
//     flat/conditional DamageUp/DefenseUp skills are lineup-dependent and are
//     added on top of bonusOverview.
export function computeBuffsForLineup(cs, selectedHeroes, widgetMode, joinerSlots = []) {
  const totals = {};
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
    totals[t] = { ATK: 0, Leth: 0, HP: 0, DEF: 0 };
    for (const s of STAT_NAMES) {
      totals[t][s] += (boSquads[s] || 0) + (bo[t]?.[s] || 0);
    }
    const hg = heroGearBuffs[t] || { ATK: 0, DEF: 0, Leth: 0, HP: 0 };
    const wb = widgetBuffs[t] || { Leth: 0, HP: 0 };
    const eb = expBuffs[t] || { ATK: 0, DEF: 0 };

    // Widget skills are squad-wide (apply to every troop), routed by desc.
    totals[t].ATK  += talentBuffs.ATK  + hg.ATK  + eb.ATK  + widgetSkillBuffs.ATK  + skillFlat.ATK;
    totals[t].DEF  += talentBuffs.DEF  + hg.DEF  + eb.DEF  + widgetSkillBuffs.DEF  + skillFlat.DEF;
    totals[t].Leth += talentBuffs.Leth + hg.Leth + wb.Leth + widgetSkillBuffs.Leth + skillFlat.Leth;
    totals[t].HP   += talentBuffs.HP   + hg.HP   + wb.HP   + widgetSkillBuffs.HP   + skillFlat.HP;
  }
  return totals;
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

// Battle Report breakdown: separates the additive sum (BO + hero gear + widget
// expedition + talents + flat skills) from the widget exclusive skill, which
// is multiplicative-on-percentage in the in-game model:
//   displayed_pct = additive × (1 + widgetSkillPct/100)
// Widget skills are squad-wide so widgetSkillPct is a single per-stat object
// (not per-troop). The legacy computeBuffsForLineup folds widgetSkill back
// into additive and is kept for the optimizer / stat-product math.
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
