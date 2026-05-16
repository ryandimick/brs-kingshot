import { GOV_GEAR_SLOTS, GOV_GEAR_TIERS, GOV_GEAR_COSTS, getSetBonus } from "../../data/gear-tables.js";
import { computeGain } from "../scoring.js";

export function generateGovGear(simState, _remaining, cs, attackBreakdown, garrisonBreakdown) {
  const out = [];
  for (const slot of GOV_GEAR_SLOTS) {
    const fromIdx = simState.govGearSlots[slot.id] || 0;
    const toIdx = fromIdx + 1;
    if (toIdx >= GOV_GEAR_TIERS.length) continue;
    const c = GOV_GEAR_COSTS[toIdx];
    if (!c) continue;

    const cost = { satin: c.satin, threads: c.threads };
    if (c.artisan) cost.artisan = c.artisan;

    const delta = GOV_GEAR_TIERS[toIdx].total - GOV_GEAR_TIERS[fromIdx].total;
    const baseGain = computeGain({ ATK: delta, DEF: delta }, slot.troop, cs, attackBreakdown, garrisonBreakdown);

    const simSlots = { ...simState.govGearSlots, [slot.id]: toIdx };
    const oldSet = getSetBonus(simState.govGearSlots);
    const newSet = getSetBonus(simSlots);
    const setGain = computeGain(
      { ATK: newSet.atk3 - oldSet.atk3, DEF: newSet.def3 - oldSet.def3 },
      null, cs, attackBreakdown, garrisonBreakdown
    );

    out.push({
      id: `govgear/${slot.id}/${toIdx}`,
      category: "govgear",
      name: `Gov ${slot.name} (${slot.troop})`,
      desc: `${GOV_GEAR_TIERS[fromIdx].label} → ${GOV_GEAR_TIERS[toIdx].label}`,
      gain: baseGain + setGain,
      cost,
      apply: (state, rem) => {
        state.govGearSlots[slot.id] = toIdx;
        rem.satin   -= cost.satin;
        rem.threads -= cost.threads;
        if (cost.artisan) rem.artisan -= cost.artisan;
      },
    });
  }
  return out;
}
