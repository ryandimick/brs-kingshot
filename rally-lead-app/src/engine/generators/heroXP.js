import { heroGearEPCost, heroGearGateCost } from "../../data/gear-tables";
import { heroGearPieceStat, GEAR_PIECE_STAT } from "../../data/hero-tables";
import { computeGain } from "../scoring";

const PIECE_NAMES = { helm: "Helm", boots: "Boots", chest: "Chest", gloves: "Gloves" };

export function generateHeroXP(simState, _remaining, cs, attackBuffs, garrisonBuffs) {
  const out = [];
  for (const troop of ["Infantry", "Cavalry", "Archer"]) {
    const gearSet = simState.heroGear[troop] || {};
    for (const [pieceId, stat] of Object.entries(GEAR_PIECE_STAT)) {
      const piece = gearSet[pieceId] || { enh: 0, mast: 0 };
      if (piece.enh >= 200) continue;
      const fromLv = piece.enh;
      const toLv = fromLv + Math.min(10, 200 - fromLv);
      const epCost = heroGearEPCost(fromLv, toLv);

      let mithrilCost = 0;
      let mythicCost = 0;
      for (let lv = fromLv + 1; lv <= toLv; lv++) {
        const gate = heroGearGateCost(lv);
        if (gate) {
          mithrilCost += gate.mithril;
          mythicCost  += gate.mythicGear;
        }
      }

      const cost = { ep: epCost };
      if (mithrilCost) cost.mithril = mithrilCost;
      if (mythicCost)  cost.mythicGears = mythicCost;

      const current  = heroGearPieceStat(fromLv, piece.mast);
      const upgraded = heroGearPieceStat(toLv,   piece.mast);
      const delta    = upgraded - current;
      const gain = computeGain({ [stat]: delta }, troop, cs, attackBuffs, garrisonBuffs);

      const gateNote = mithrilCost || mythicCost
        ? ` [gate: ${mithrilCost ? `${mithrilCost} mithril` : ""}${mithrilCost && mythicCost ? " + " : ""}${mythicCost ? `${mythicCost} mythic` : ""}]`
        : "";

      out.push({
        id: `heroXP/${troop}/${pieceId}/${toLv}`,
        category: "heroXP",
        name: `${troop} ${PIECE_NAMES[pieceId]} Enh`,
        desc: `+${toLv - fromLv} (${fromLv} → ${toLv})${gateNote}`,
        gain,
        cost,
        apply: (state, rem) => {
          if (!state.heroGear[troop]) state.heroGear[troop] = {};
          if (!state.heroGear[troop][pieceId]) state.heroGear[troop][pieceId] = { enh: 0, mast: 0 };
          state.heroGear[troop][pieceId].enh = toLv;
          rem.ep -= epCost;
          if (mithrilCost) rem.mithril -= mithrilCost;
          if (mythicCost)  rem.mythicGears -= mythicCost;
        },
      });
    }
  }
  return out;
}
