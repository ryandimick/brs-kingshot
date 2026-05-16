import { HERO_DB } from "../../data/hero-database.js";
import { widgetExpeditionStats, widgetSkillValue, statFromDesc } from "../../data/hero-tables.js";
import { computeGain } from "../scoring.js";

// Widget upgrade contributes in two layers:
//   1. Expedition stats (Leth, HP) — additive, scoped to the hero's troop type.
//   2. Widget exclusive skill value — multiplicative on the buff %, squad-wide,
//      only active in scenarios matching widget.skill.mode ("rally" → attack,
//      "defender" → garrison).
// Scenarios where the hero is not actually deployed are excluded so the gain
// reflects the lineup the user has configured.
export function generateWidget(simState, _remaining, cs, attackBreakdown, garrisonBreakdown) {
  const out = [];
  const attackHeroes   = cs.attackRally?.selectedHeroes   || [];
  const garrisonHeroes = cs.garrisonLead?.selectedHeroes || [];

  for (const [name, rosterEntry] of Object.entries(simState.heroRoster)) {
    const dbEntry = HERO_DB.find(h => h.name === name);
    if (!dbEntry?.hasWidget) continue;
    const currentLv = rosterEntry.widgetLv || 0;
    if (currentLv >= 10) continue;
    const nextLv = currentLv + 1;
    const fragmentCost = nextLv * 5;

    const inAttack   = attackHeroes.includes(name);
    const inGarrison = garrisonHeroes.includes(name);
    if (!inAttack && !inGarrison) continue;

    const heroTroop = dbEntry.type;

    // Additive expedition-stat deltas (hero's troop only).
    const curExp = widgetExpeditionStats(dbEntry, currentLv);
    const nxtExp = widgetExpeditionStats(dbEntry, nextLv);
    const statGains = {};
    const lethExpGain = nxtExp.Leth - curExp.Leth;
    const hpExpGain   = nxtExp.HP   - curExp.HP;
    if (lethExpGain > 0) statGains.Leth = lethExpGain;
    if (hpExpGain   > 0) statGains.HP   = hpExpGain;

    // Multiplicative widget exclusive skill delta (squad-wide, mode-gated).
    const skillDelta = widgetSkillValue(dbEntry, nextLv) - widgetSkillValue(dbEntry, currentLv);
    const mode = dbEntry.widget?.skill?.mode || "";
    const skillStat = statFromDesc(dbEntry.widget?.skill?.desc) || (mode === "rally" ? "Leth" : "HP");
    const widgetSkillAtk = (skillDelta > 0 && mode === "rally")    ? { [skillStat]: skillDelta } : {};
    const widgetSkillGar = (skillDelta > 0 && mode === "defender") ? { [skillStat]: skillDelta } : {};

    if (Object.keys(statGains).length === 0
        && Object.keys(widgetSkillAtk).length === 0
        && Object.keys(widgetSkillGar).length === 0) continue;

    const scenarios = inAttack && inGarrison ? undefined : inAttack ? "attack-only" : "garrison-only";

    const gain = computeGain(statGains, heroTroop, cs, attackBreakdown, garrisonBreakdown, {
      scenarios, widgetSkillAtk, widgetSkillGar,
    });

    out.push({
      id: `widget/${name}/${nextLv}`,
      category: "widget",
      name: `${name} Widget`,
      desc: `Lv ${currentLv} → ${nextLv}`,
      gain,
      cost: { widgets: fragmentCost },
      apply: (state, rem) => {
        state.heroRoster[name].widgetLv = nextLv;
        rem.widgets -= fragmentCost;
      },
    });
  }
  return out;
}
