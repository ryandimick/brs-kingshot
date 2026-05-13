// UI metadata only — cost tables, EP curves, and imbuement gate math live
// server-side. See rally-lead-api/src/data/gear-tables.js for the full file.

export const GOV_GEAR_SLOTS = [
  { id: "helm", name: "Helm", icon: "\u{1F451}", troop: "Cavalry" },
  { id: "accessory", name: "Accessory", icon: "\u{1F4FF}", troop: "Cavalry" },
  { id: "armor", name: "Armor", icon: "\u{1F6E1}", troop: "Infantry" },
  { id: "pants", name: "Pants", icon: "\u{1F45F}", troop: "Infantry" },
  { id: "ring", name: "Ring", icon: "\u{1F48D}", troop: "Archer" },
  { id: "weapon", name: "Weapon", icon: "\u{1F5E1}", troop: "Archer" },
];

// Per-piece stat total at each tier level
export const GOV_GEAR_TIERS = [
  { label: "None", total: 0 },
  { label: "Green", total: 9.35 },{ label: "Green ★", total: 12.75 },
  { label: "Blue", total: 17.0 },{ label: "Blue ★", total: 21.25 },{ label: "Blue ★★", total: 25.5 },{ label: "Blue ★★★", total: 29.75 },
  { label: "Purple", total: 34.0 },{ label: "Purple ★", total: 36.89 },{ label: "Purple ★★", total: 39.78 },{ label: "Purple ★★★", total: 42.67 },
  { label: "Purple T1", total: 45.56 },{ label: "Purple T1★", total: 48.45 },{ label: "Purple T1★★", total: 51.34 },{ label: "Purple T1★★★", total: 54.23 },
  { label: "Gold", total: 56.78 },{ label: "Gold ★", total: 59.33 },{ label: "Gold ★★", total: 61.88 },{ label: "Gold ★★★", total: 64.43 },
  { label: "Gold T1", total: 66.98 },{ label: "Gold T1★", total: 69.53 },{ label: "Gold T1★★", total: 72.08 },{ label: "Gold T1★★★", total: 74.63 },
  { label: "Gold T2", total: 77.18 },{ label: "Gold T2★", total: 79.73 },{ label: "Gold T2★★", total: 82.28 },{ label: "Gold T2★★★", total: 84.83 },
  { label: "Gold T3", total: 87.38 },{ label: "Gold T3★", total: 89.93 },{ label: "Gold T3★★", total: 92.48 },{ label: "Gold T3★★★", total: 95.0 },
  { label: "Red", total: 97.5 },{ label: "Red ★", total: 100.0 },{ label: "Red ★★", total: 102.5 },{ label: "Red ★★★", total: 105.0 },
];

// Set bonus: 3pc = DEF, 6pc = ATK. Tier-name prefix → bonus %
export const GOV_GEAR_SET_BONUS = [
  { prefix: "None", bonus: 0 },{ prefix: "Green", bonus: 2.5 },{ prefix: "Blue", bonus: 4.5 },
  { prefix: "Purple T1", bonus: 6 },{ prefix: "Purple", bonus: 5 },
  { prefix: "Gold T3", bonus: 10 },{ prefix: "Gold T2", bonus: 9 },{ prefix: "Gold T1", bonus: 8 },{ prefix: "Gold", bonus: 7 },
  { prefix: "Red T1", bonus: 14 },{ prefix: "Red", bonus: 12 },
];

export function getSetBonus(gearSlots) {
  const indices = Object.values(gearSlots).map(v => v || 0);
  const minIdx = Math.min(...indices);
  if (minIdx <= 0) return { atk3: 0, def3: 0 };
  const tier = GOV_GEAR_TIERS[minIdx];
  if (!tier) return { atk3: 0, def3: 0 };
  const lbl = tier.label;
  for (const sb of GOV_GEAR_SET_BONUS) {
    if (lbl.startsWith(sb.prefix) && sb.prefix !== "None") {
      const count6 = indices.filter(i => i >= minIdx).length;
      const count3 = count6 >= 3 ? 1 : 0;
      return { atk3: count6 >= 6 ? sb.bonus : 0, def3: count3 ? sb.bonus : 0 };
    }
  }
  return { atk3: 0, def3: 0 };
}

// Charm levels: each charm gives Leth AND HP equally at its level
export const CHARM_LEVELS = [
  { label: "Lv 0", total: 0 },
  { label: "Lv 1", total: 9 },{ label: "Lv 2", total: 12 },{ label: "Lv 3", total: 16 },
  { label: "Lv 4", total: 19 },{ label: "Lv 5", total: 25 },{ label: "Lv 6", total: 30 },
  { label: "Lv 7", total: 35 },{ label: "Lv 8", total: 40 },{ label: "Lv 9", total: 45 },
  { label: "Lv 10", total: 50 },{ label: "Lv 11", total: 55 },{ label: "Lv 12", total: 59 },
  { label: "Lv 13", total: 63 },{ label: "Lv 14", total: 67 },{ label: "Lv 15", total: 71 },
  { label: "Lv 16", total: 75 },{ label: "Lv 17", total: 79 },{ label: "Lv 18", total: 83 },
  { label: "Lv 19", total: 87 },{ label: "Lv 20", total: 91 },{ label: "Lv 21", total: 95 },
  { label: "Lv 22", total: 99 },
];
