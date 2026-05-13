import { HERO_DB } from "../../data/hero-database.js";
import { widgetExpeditionStats, widgetSkillValue } from "../../data/hero-tables.js";
import { offProduct, defProduct, marginal, baseStatsFor } from "../combat.js";
import { weightsFor } from "../scoring.js";

// Widget gain is lineup-scoped (only counts toward the lineup the hero is
// actually deployed in), so it bypasses the generic computeGain helper.
export function generateWidget(simState, _remaining, cs, attackBuffs, garrisonBuffs) {
  const out = [];
  const attackHeroes   = cs.attackRally?.selectedHeroes   || [];
  const garrisonHeroes = cs.garrisonLead?.selectedHeroes || [];
  const bases = baseStatsFor(cs);

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
    const curStats = widgetExpeditionStats(dbEntry, currentLv);
    const nxtStats = widgetExpeditionStats(dbEntry, nextLv);
    let lethGain = nxtStats.Leth - curStats.Leth;
    let hpGain   = nxtStats.HP   - curStats.HP;
    const curSkill = widgetSkillValue(dbEntry, currentLv);
    const nxtSkill = widgetSkillValue(dbEntry, nextLv);
    const skillDelta = nxtSkill - curSkill;
    if (skillDelta > 0 && dbEntry.widget?.skill?.mode === "rally"    && inAttack)   lethGain += skillDelta;
    if (skillDelta > 0 && dbEntry.widget?.skill?.mode === "defender" && inGarrison) hpGain   += skillDelta;

    const statGains = {};
    if (lethGain > 0) statGains.Leth = lethGain;
    if (hpGain   > 0) statGains.HP   = hpGain;
    if (Object.keys(statGains).length === 0) continue;

    let gain = 0;
    if (inAttack) {
      const aW = (cs.attackRally?.offenseWeight ?? 75) / 100;
      const offW = weightsFor(cs, attackBuffs, offProduct);
      const defW = weightsFor(cs, attackBuffs, defProduct);
      for (const [s, g] of Object.entries(statGains)) {
        if (s === "Leth") gain += marginal(bases[heroTroop], attackBuffs[heroTroop], s, g, offProduct).pct * offW[heroTroop] * aW;
        if (s === "HP")   gain += marginal(bases[heroTroop], attackBuffs[heroTroop], s, g, defProduct).pct * defW[heroTroop] * (1 - aW);
      }
    }
    if (inGarrison) {
      const gW = (cs.garrisonLead?.offenseWeight ?? 25) / 100;
      const offW = weightsFor(cs, garrisonBuffs, offProduct);
      const defW = weightsFor(cs, garrisonBuffs, defProduct);
      for (const [s, g] of Object.entries(statGains)) {
        if (s === "Leth") gain += marginal(bases[heroTroop], garrisonBuffs[heroTroop], s, g, offProduct).pct * offW[heroTroop] * gW;
        if (s === "HP")   gain += marginal(bases[heroTroop], garrisonBuffs[heroTroop], s, g, defProduct).pct * defW[heroTroop] * (1 - gW);
      }
    }

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
