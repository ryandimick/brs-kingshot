import { forgehammerCost } from "../../data/gear-tables.js";
import { heroGearPieceStat, GEAR_PIECE_STAT, HERO_GEAR_MASTERY_MAX } from "../../data/hero-tables.js";
import { computeGain } from "../scoring.js";

const PIECE_NAMES = { helm: "Helm", boots: "Boots", chest: "Chest", gloves: "Gloves" };

export function generateForgehammer(simState, _remaining, cs, attackBuffs, garrisonBuffs) {
  const out = [];
  for (const troop of ["Infantry", "Cavalry", "Archer"]) {
    const gearSet = simState.heroGear[troop] || {};
    for (const [pieceId, stat] of Object.entries(GEAR_PIECE_STAT)) {
      const piece = gearSet[pieceId] || { enh: 0, mast: 0 };
      if (piece.mast >= HERO_GEAR_MASTERY_MAX) continue;
      const c = forgehammerCost(piece.mast + 1);

      const cost = { forgehammers: c.forgehammers };
      if (c.mythicGears) cost.mythicGears = c.mythicGears;

      const current  = heroGearPieceStat(piece.enh, piece.mast);
      const upgraded = heroGearPieceStat(piece.enh, piece.mast + 1);
      const delta    = upgraded - current;
      const gain = computeGain({ [stat]: delta }, troop, cs, attackBuffs, garrisonBuffs);

      out.push({
        id: `forgehammer/${troop}/${pieceId}/${piece.mast + 1}`,
        category: "forgehammer",
        name: `${troop} ${PIECE_NAMES[pieceId]} Mastery`,
        desc: `Lv ${piece.mast} → ${piece.mast + 1}`,
        gain,
        cost,
        apply: (state, rem) => {
          if (!state.heroGear[troop]) state.heroGear[troop] = {};
          if (!state.heroGear[troop][pieceId]) state.heroGear[troop][pieceId] = { enh: 0, mast: 0 };
          state.heroGear[troop][pieceId].mast = piece.mast + 1;
          rem.forgehammers -= c.forgehammers;
          if (c.mythicGears) rem.mythicGears -= c.mythicGears;
        },
      });
    }
  }
  return out;
}
