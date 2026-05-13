// Exclusive Gear Enhancement Special — fixed bundle, sequential unlock.
// Source: in-game observation (Ryan), 2026-04-30. Recurrence cadence uncertain.

export default {
  id: "exclusive_gear_enhancement_special",
  name: "Exclusive Gear Enhancement Special",
  category: "growth",
  tags: ["sequential_unlock", "widget"],
  recurrence: {
    cycleDays: 28,
    windows: [{ days: [1, 7] }],
    uncertain: true,
  },
  perWindowCap: 1,
  tierAccessModel: "sequential",
  labelFormat: "percentage",
  source: { author: "ryan", capturedDate: "2026-04-30", confidence: "observed" },
  tiers: [
    {
      id: "tier_499",
      tierName: "Exclusive Gear Enhancement $4.99",
      price: 4.99,
      label: "1400%",
      base: {},
      baseExtras: {
        gems: 2500,
        gen2HeroWidgetChest: 5,
        vipXp: 2500,
        food: 1300000,
        wood: 1300000,
        stone: 240000,
        iron: 60000,
      },
      choice: { kind: "fixed" },
    },
    // Higher tiers locked.
  ],
};
