// UI helpers only — widget formulas, skill scaling, talent buffs, and
// rally/defender skill aggregation live server-side. See
// rally-lead-api/src/data/hero-tables.js for the full file.

export const HERO_GEAR_MASTERY_MAX = 20;

// Gear piece → stat label mapping (for the Hero Gear tab display)
export const GEAR_PIECE_STAT = {
  helm: "Leth",
  boots: "Leth",
  chest: "HP",
  gloves: "HP",
};

// Stat-per-piece curve. Used by HeroGearTab to render the contribution of
// a given enhancement + mastery level. The curve is publicly documented at
// kingshotdata.com so we don't gain meaningful IP protection by hiding it,
// and the UI relies on it for live display.
const ENH_BREAKPOINTS = [
  [0, 15], [100, 50], [200, 100],
];

function heroGearEnhStat(enhLevel) {
  if (enhLevel <= 0) return ENH_BREAKPOINTS[0][1];
  for (let i = 1; i < ENH_BREAKPOINTS.length; i++) {
    if (enhLevel <= ENH_BREAKPOINTS[i][0]) {
      const [x0, y0] = ENH_BREAKPOINTS[i - 1];
      const [x1, y1] = ENH_BREAKPOINTS[i];
      return y0 + (y1 - y0) * (enhLevel - x0) / (x1 - x0);
    }
  }
  return ENH_BREAKPOINTS[ENH_BREAKPOINTS.length - 1][1];
}

function heroGearMasteryMult(masteryLevel) {
  return 1.0 + Math.min(masteryLevel, HERO_GEAR_MASTERY_MAX) * 0.1;
}

export function heroGearPieceStat(enh, mast) {
  return heroGearEnhStat(enh) * heroGearMasteryMult(mast);
}
