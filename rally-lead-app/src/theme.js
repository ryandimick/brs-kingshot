export const C = {
  bg: "#060810", s1: "#0c1018", s2: "#111720", s3: "#171e2a",
  brd: "#1c2333", brdH: "#28304a",
  tx: "#d2dae8", txD: "#aab2c5", txB: "#f2f5fc",
  gold: "#c8961a", goldD: "#6b5010", goldG: "#c8961a22",
  grn: "#0ea572", red: "#e64060", blu: "#3878e0", pur: "#9070e0", cyn: "#18c8d8",
  inf: "#4a8ee0", cav: "#9060e8", arch: "#20c898",
};

export const troopColor = { Infantry: C.inf, Cavalry: C.cav, Archer: C.arch };

// Font families
export const FONT_MONO = "'JetBrains Mono', monospace";
export const FONT_DISPLAY = "'Orbitron', sans-serif";
export const FONT_BODY = "'Rajdhani', sans-serif";

export const TIER_COLORS = { S: C.gold, A: C.grn, B: C.blu, C: C.txD };

export function tierColorFromLabel(label) {
  if (label.startsWith("Red")) return "#e64060";
  if (label.startsWith("Gold")) return "#c8961a";
  if (label.startsWith("Purple")) return "#9060e8";
  if (label.startsWith("Blue")) return "#4a8ee0";
  if (label.startsWith("Green")) return "#20c898";
  return C.txD;
}
