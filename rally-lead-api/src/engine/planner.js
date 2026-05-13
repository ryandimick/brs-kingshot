import { computeBuffsForLineup } from "./buffs.js";
import { affordable, efficiency, cloneSimState } from "./scoring.js";
import { generateGovGear } from "./generators/govgear.js";
import { generateCharm } from "./generators/charm.js";
import { generateForgehammer } from "./generators/forgehammer.js";
import { generateHeroXP } from "./generators/heroXP.js";
import { generateWidget } from "./generators/widget.js";

const GENERATORS = {
  govgear:     generateGovGear,
  charm:       generateCharm,
  forgehammer: generateForgehammer,
  heroXP:      generateHeroXP,
  widget:      generateWidget,
};

export const PLANNER_CATEGORIES = [
  { id: "govgear", label: "Gov Gear", resources: [
    { key: "satin", label: "Satin", default: 0 },
    { key: "threads", label: "Gilded Threads", default: 0 },
    { key: "artisan", label: "Artisan's Vision", default: 0 },
  ]},
  { id: "charm", label: "Gov Charms", resources: [
    { key: "guides", label: "Charm Guides", default: 0 },
    { key: "designs", label: "Charm Designs", default: 0 },
  ]},
  { id: "forgehammer", label: "Forgehammers", resources: [
    { key: "forgehammers", label: "Forgehammers", default: 0 },
    { key: "mythicGears", label: "Mythic Gears", default: 0 },
  ]},
  { id: "heroXP", label: "Gear XP", resources: [
    { key: "ep", label: "Enhancement Points", default: 0 },
    { key: "mithril", label: "Mithril", default: 0 },
    { key: "mythicGears", label: "Mythic Gears", default: 0 },
  ]},
  { id: "widget", label: "Hero Widgets", resources: [
    { key: "widgets", label: "Widget Fragments", default: 0 },
  ]},
];

/**
 * Cross-category planner kernel. Iteratively picks the most efficient
 * affordable upgrade (greedy by fractional-budget cost), applies it, and
 * repeats. Returns the full ranked plan; UI/wrapper code truncates to a
 * "high-ROI prefix" if efficient-mode is desired.
 *
 * options.categories    array of category ids to consider (defaults to all)
 * options.maxIterations safety cap (default 200)
 */
export function plan(cs, budget, options = {}) {
  const {
    categories = Object.keys(GENERATORS),
    maxIterations = 200,
  } = options;

  const simState = cloneSimState(cs);
  const remaining = { ...budget };
  const upgrades = [];

  const attackHeroes   = cs.attackRally?.selectedHeroes   || [];
  const garrisonHeroes = cs.garrisonLead?.selectedHeroes || [];

  for (let i = 0; i < maxIterations; i++) {
    const simCs = { ...cs, ...simState };
    const attackBuffs   = computeBuffsForLineup(simCs, attackHeroes,   "rally");
    const garrisonBuffs = computeBuffsForLineup(simCs, garrisonHeroes, "defender");

    const candidates = [];
    for (const cat of categories) {
      const gen = GENERATORS[cat];
      if (!gen) continue;
      candidates.push(...gen(simState, remaining, cs, attackBuffs, garrisonBuffs));
    }

    const viable = candidates.filter(c => c.gain > 0 && affordable(c.cost, remaining));
    if (viable.length === 0) break;

    let best = viable[0];
    let bestEff = efficiency(best, remaining);
    for (let j = 1; j < viable.length; j++) {
      const e = efficiency(viable[j], remaining);
      if (e > bestEff) { best = viable[j]; bestEff = e; }
    }

    best.apply(simState, remaining);
    const prevCum = upgrades.length > 0 ? upgrades[upgrades.length - 1].cumulativeGain : 0;
    upgrades.push({
      id:             best.id,
      category:       best.category,
      name:           best.name,
      desc:           best.desc,
      gain:           best.gain,
      cost:           best.cost,
      efficiency:     bestEff,
      cumulativeGain: prevCum + best.gain,
    });
  }

  return { upgrades, remaining };
}

// Backward-compat shim — existing ScenarioPlannerTab calls this.
export function runScenarioPlanner(cs, categoryId, budget) {
  return plan(cs, budget, { categories: [categoryId] });
}
