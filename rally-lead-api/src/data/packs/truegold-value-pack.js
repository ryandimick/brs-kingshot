// Truegold Value Pack — fixed bundle, sequential unlock. Pack tracker lists
// this as "Truegold Wonders"; in-game label observed as "Truegold Value Pack"
// (treating as same pack pending validation).
// Source: in-game observation (Ryan), Day 8 of cycle.

export default {
  id: "truegold_value_pack",
  name: "Truegold Value Pack",
  category: "growth",
  tags: ["sequential_unlock", "truegold"],
  aliases: ["Truegold Wonders"],
  recurrence: {
    cycleDays: 28,
    windows: [{ days: [8, 13] }, { days: [22, 27] }],
  },
  perWindowCap: 1,
  tierAccessModel: "sequential",
  labelFormat: "percentage",
  source: { author: "ryan", capturedDate: "2026-05-08", confidence: "observed" },
  tiers: [
    {
      id: "tier_499",
      tierName: "Truegold Value $4.99",
      price: 4.99,
      label: "2200%",
      base: {},
      baseExtras: {
        gems: 2500,
        truegold: 30,
        speedup1hGeneral: 8,
        speedup5mGeneral: 96,
        vipXp: 2500,
        food: 10000000,
        wood: 10000000,
        stone: 2000000,
        iron: 500000,
      },
      choice: { kind: "fixed" },
    },
    // Higher tiers locked.
  ],
};
