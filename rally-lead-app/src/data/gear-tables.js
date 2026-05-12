export const GOV_GEAR_SLOTS = [
  { id: "helm", name: "Helm", icon: "\u{1F451}", troop: "Cavalry" },
  { id: "accessory", name: "Accessory", icon: "\u{1F4FF}", troop: "Cavalry" },
  { id: "armor", name: "Armor", icon: "\u{1F6E1}", troop: "Infantry" },
  { id: "pants", name: "Pants", icon: "\u{1F45F}", troop: "Infantry" },
  { id: "ring", name: "Ring", icon: "\u{1F48D}", troop: "Archer" },
  { id: "weapon", name: "Weapon", icon: "\u{1F5E1}", troop: "Archer" },
];

// Per-piece stat total at each tier level (from kingshot.net database)
export const GOV_GEAR_TIERS = [
  { label: "None", total: 0 },
  { label: "Green", total: 9.35 },{ label: "Green \u2605", total: 12.75 },
  { label: "Blue", total: 17.0 },{ label: "Blue \u2605", total: 21.25 },{ label: "Blue \u2605\u2605", total: 25.5 },{ label: "Blue \u2605\u2605\u2605", total: 29.75 },
  { label: "Purple", total: 34.0 },{ label: "Purple \u2605", total: 36.89 },{ label: "Purple \u2605\u2605", total: 39.78 },{ label: "Purple \u2605\u2605\u2605", total: 42.67 },
  { label: "Purple T1", total: 45.56 },{ label: "Purple T1\u2605", total: 48.45 },{ label: "Purple T1\u2605\u2605", total: 51.34 },{ label: "Purple T1\u2605\u2605\u2605", total: 54.23 },
  { label: "Gold", total: 56.78 },{ label: "Gold \u2605", total: 59.33 },{ label: "Gold \u2605\u2605", total: 61.88 },{ label: "Gold \u2605\u2605\u2605", total: 64.43 },
  { label: "Gold T1", total: 66.98 },{ label: "Gold T1\u2605", total: 69.53 },{ label: "Gold T1\u2605\u2605", total: 72.08 },{ label: "Gold T1\u2605\u2605\u2605", total: 74.63 },
  { label: "Gold T2", total: 77.18 },{ label: "Gold T2\u2605", total: 79.73 },{ label: "Gold T2\u2605\u2605", total: 82.28 },{ label: "Gold T2\u2605\u2605\u2605", total: 84.83 },
  { label: "Gold T3", total: 87.38 },{ label: "Gold T3\u2605", total: 89.93 },{ label: "Gold T3\u2605\u2605", total: 92.48 },{ label: "Gold T3\u2605\u2605\u2605", total: 95.0 },
  { label: "Red", total: 97.5 },{ label: "Red \u2605", total: 100.0 },{ label: "Red \u2605\u2605", total: 102.5 },{ label: "Red \u2605\u2605\u2605", total: 105.0 },
];

// Set bonus: 3pc = DEF, 6pc = ATK. Tier name prefix -> bonus %
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

// ═══════════════════════════════════════════
// UPGRADE COST TABLES
// ═══════════════════════════════════════════

// Gov gear upgrade cost per tier step (index matches GOV_GEAR_TIERS)
// Source: kingshot.net/database/governor-gear
// Cost = { satin, threads, artisan } to upgrade TO this tier
export const GOV_GEAR_COSTS = [
  null, // index 0 = None
  { satin: 1500, threads: 15, artisan: 0 },      // Green
  { satin: 3800, threads: 40, artisan: 0 },      // Green★
  { satin: 7000, threads: 70, artisan: 0 },      // Blue
  { satin: 9700, threads: 95, artisan: 0 },      // Blue★
  { satin: 1000, threads: 10, artisan: 45 },     // Blue★★
  { satin: 1000, threads: 10, artisan: 50 },     // Blue★★★
  { satin: 1500, threads: 15, artisan: 60 },     // Purple
  { satin: 1500, threads: 15, artisan: 70 },     // Purple★
  { satin: 6500, threads: 65, artisan: 40 },     // Purple★★
  { satin: 8000, threads: 80, artisan: 50 },     // Purple★★★
  { satin: 10000, threads: 95, artisan: 60 },    // Purple T1
  { satin: 11000, threads: 110, artisan: 70 },   // Purple T1★
  { satin: 13000, threads: 130, artisan: 85 },   // Purple T1★★
  { satin: 15000, threads: 160, artisan: 100 },  // Purple T1★★★
  { satin: 22000, threads: 220, artisan: 40 },   // Gold
  { satin: 23000, threads: 230, artisan: 40 },   // Gold★
  { satin: 25000, threads: 250, artisan: 45 },   // Gold★★
  { satin: 26000, threads: 260, artisan: 45 },   // Gold★★★
  { satin: 28000, threads: 280, artisan: 45 },   // Gold T1
  { satin: 30000, threads: 300, artisan: 55 },   // Gold T1★
  { satin: 32000, threads: 320, artisan: 55 },   // Gold T1★★
  { satin: 35000, threads: 340, artisan: 55 },   // Gold T1★★★
  { satin: 38000, threads: 390, artisan: 55 },   // Gold T2
  { satin: 43000, threads: 430, artisan: 75 },   // Gold T2★
  { satin: 45000, threads: 460, artisan: 80 },   // Gold T2★★
  { satin: 48000, threads: 500, artisan: 85 },   // Gold T2★★★
  { satin: 60000, threads: 600, artisan: 120 },  // Gold T3
  { satin: 70000, threads: 700, artisan: 140 },  // Gold T3★
  { satin: 80000, threads: 800, artisan: 160 },  // Gold T3★★
  { satin: 90000, threads: 900, artisan: 180 },  // Gold T3★★★
  { satin: 108000, threads: 1080, artisan: 220 }, // Red
  { satin: 114000, threads: 1140, artisan: 230 }, // Red★
  { satin: 121000, threads: 1210, artisan: 240 }, // Red★★
  { satin: 128000, threads: 1280, artisan: 250 }, // Red★★★
];

// Charm upgrade cost per level (index = target level)
// Source: kingshot.net/database/governor-charm
// Cost = { guides, designs } to upgrade TO this level
export const CHARM_COSTS = [
  null, // index 0 = no cost
  { guides: 5, designs: 5 },       // Lv 1
  { guides: 40, designs: 15 },     // Lv 2
  { guides: 60, designs: 40 },     // Lv 3
  { guides: 80, designs: 100 },    // Lv 4
  { guides: 100, designs: 200 },   // Lv 5
  { guides: 120, designs: 300 },   // Lv 6
  { guides: 140, designs: 400 },   // Lv 7
  { guides: 200, designs: 400 },   // Lv 8
  { guides: 300, designs: 400 },   // Lv 9
  { guides: 420, designs: 420 },   // Lv 10
  { guides: 560, designs: 420 },   // Lv 11
  { guides: 580, designs: 600 },   // Lv 12
  { guides: 610, designs: 780 },   // Lv 13
  { guides: 645, designs: 960 },   // Lv 14
  { guides: 685, designs: 1140 },  // Lv 15
  { guides: 730, designs: 1320 },  // Lv 16
  { guides: 780, designs: 1500 },  // Lv 17
  { guides: 835, designs: 1680 },  // Lv 18
  { guides: 895, designs: 1860 },  // Lv 19
  { guides: 960, designs: 2040 },  // Lv 20
  { guides: 1030, designs: 2220 }, // Lv 21
  { guides: 1105, designs: 2400 }, // Lv 22
];

// Forgehammer cost per mastery level: level N costs N×10 forgehammers
// Levels 11+ also require mythic gear pieces (level - 10)
// Source: kingshot.net/forgehammer-calculator
export function forgehammerCost(masteryLevel) {
  const hammers = masteryLevel * 10;
  const mythicGears = masteryLevel > 10 ? masteryLevel - 10 : 0;
  return { forgehammers: hammers, mythicGears };
}

// Hero gear enhancement EP cost per level.
// Source: kingshotdata.com/database/hero-gear-enhancement-chart/ and
// kingshotguide.org/data-center/hero-gear-kingshot (cross-verified Apr 2026).
// Exact table for Lv 60-200; interpolation for 1-59 from 7 anchor points.
// Imbuement gates (101, 120, 140, 160, 180, 200) cost 0 EP — they require
// Mithril + Mythic Gear instead, see IMBUEMENT_GATES below.
const EP_LOW_BP = [[1, 10], [10, 55], [20, 105], [30, 160], [40, 270], [50, 470], [60, 680]];
const EP_60_200 = [
  680, 710, 740, 770, 800, 830, 860, 890, 920, 950,              // 60-69
  990, 1030, 1070, 1110, 1150, 1190, 1230, 1270, 1310, 1350,     // 70-79
  1400, 1450, 1500, 1550, 1600, 1650, 1700, 1750, 1800, 1850,    // 80-89
  1900, 1950, 2000, 2050, 2100, 2150, 2200, 2250, 2300, 2350,    // 90-99
  2400, 0, 2500, 2550, 2600, 2650, 2700, 2750, 2800, 2850,       // 100-109 (101=gate)
  2900, 2950, 3000, 3050, 3100, 3150, 3200, 3250, 3300, 3350,    // 110-119
  0, 3500, 3550, 3600, 3650, 3700, 3750, 3800, 3850, 3900,       // 120-129 (120=gate)
  3950, 4000, 4050, 4100, 4150, 4200, 4250, 4300, 4350, 4400,    // 130-139
  0, 4450, 4500, 4550, 4600, 4650, 4700, 4750, 4800, 4850,       // 140-149 (140=gate)
  4900, 4950, 5000, 5050, 5100, 5150, 5200, 5250, 5300, 5350,    // 150-159
  0, 5500, 5600, 5700, 5800, 5900, 6000, 6100, 6200, 6300,       // 160-169 (160=gate)
  6400, 6500, 6600, 6700, 6800, 6900, 7000, 7100, 7200, 7300,    // 170-179
  0, 7500, 7600, 7700, 7800, 7900, 8000, 8100, 8200, 8300,       // 180-189 (180=gate)
  8400, 8500, 8600, 8700, 8800, 8900, 9000, 9100, 9200, 9300,    // 190-199
  0,                                                              // 200 (gate)
];

function epAtLevel(lv) {
  if (lv <= 0) return 0;
  if (lv >= 60 && lv <= 200) return EP_60_200[lv - 60];
  if (lv > 200) return 0;
  for (let i = 1; i < EP_LOW_BP.length; i++) {
    if (lv <= EP_LOW_BP[i][0]) {
      const [x0, y0] = EP_LOW_BP[i - 1], [x1, y1] = EP_LOW_BP[i];
      return y0 + (y1 - y0) * (lv - x0) / (x1 - x0);
    }
  }
  return 680;
}

export function heroGearEPCost(fromLevel, toLevel) {
  let total = 0;
  for (let lv = fromLevel + 1; lv <= toLevel; lv++) total += epAtLevel(lv);
  return Math.round(total);
}

// Imbuement gates — cost Mithril + Mythic Gear, not EP.
// Source: GDKP guide (kingshotguide.net), grindnstrat.com (cross-verified).
export const IMBUEMENT_GATES = {
  101: { mithril: 0,  mythicGear: 2  },
  120: { mithril: 10, mythicGear: 3  },
  140: { mithril: 20, mythicGear: 5  },  // Conquest: affects hero stats only
  160: { mithril: 30, mythicGear: 5  },
  180: { mithril: 40, mythicGear: 10 },  // Conquest: affects hero stats only
  200: { mithril: 50, mythicGear: 10 },
};

export function heroGearGateCost(level) {
  return IMBUEMENT_GATES[level] || null;
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
