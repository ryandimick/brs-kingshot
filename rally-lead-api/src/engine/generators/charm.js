import { GOV_GEAR_SLOTS, CHARM_LEVELS, CHARM_COSTS } from "../../data/gear-tables.js";
import { TROOP_TYPES } from "../../data/constants.js";
import { computeGain } from "../scoring.js";

export function generateCharm(simState, _remaining, cs, attackBreakdown, garrisonBreakdown) {
  const out = [];
  for (const slot of GOV_GEAR_SLOTS) {
    for (let ci = 0; ci < 3; ci++) {
      const currentLv = simState.charmLevels?.[slot.troop]?.[slot.id]?.[ci] || 0;
      const nextLv = currentLv + 1;
      if (nextLv >= CHARM_LEVELS.length) continue;
      const c = CHARM_COSTS[nextLv];
      if (!c) continue;

      const delta = CHARM_LEVELS[nextLv].total - CHARM_LEVELS[currentLv].total;
      const gain = computeGain({ Leth: delta, HP: delta }, slot.troop, cs, attackBreakdown, garrisonBreakdown);

      out.push({
        id: `charm/${slot.id}/${ci}/${nextLv}`,
        category: "charm",
        name: `${slot.name} Charm ${ci + 1} (${slot.troop})`,
        desc: `${CHARM_LEVELS[currentLv].label} → ${CHARM_LEVELS[nextLv].label}`,
        gain,
        cost: { guides: c.guides, designs: c.designs },
        apply: (state, rem) => {
          // Charms are set uniformly across troop types
          for (const t of TROOP_TYPES) {
            if (!state.charmLevels[t]) state.charmLevels[t] = {};
            if (!state.charmLevels[t][slot.id]) state.charmLevels[t][slot.id] = [0, 0, 0];
            state.charmLevels[t][slot.id][ci] = nextLv;
          }
          rem.guides  -= c.guides;
          rem.designs -= c.designs;
        },
      });
    }
  }
  return out;
}
