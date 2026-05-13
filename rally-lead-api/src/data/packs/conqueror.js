// Conqueror — fixed bundle, sequential unlock. Only $4.99 tier captured;
// higher tiers locked behind purchase. Per Ryan: percentage label decreases
// as tier price increases.
// Source: in-game observation (Ryan), 2026-04-30.

export default {
  id: "conqueror",
  name: "Conqueror",
  category: "growth",
  tags: ["sequential_unlock"],
  recurrence: {
    cycleDays: 28,
    windows: [{ days: [4, 6] }, { days: [11, 13] }, { days: [18, 20] }, { days: [25, 27] }],
  },
  perWindowCap: 1,
  tierAccessModel: "sequential",
  labelFormat: "percentage",
  source: { author: "ryan", capturedDate: "2026-04-30", confidence: "observed" },
  tiers: [
    {
      id: "tier_499",
      tierName: "Conqueror $4.99",
      price: 4.99,
      label: "2090%",
      base: {},
      baseExtras: {
        gems: 2500,
        advancedTeleporter: 1,
        randomTeleporter: 1,
        quickMarch1: 4,
        expedition: 2,
        counterRecon2h: 1,
        speedup1hHealing: 25,
        speedup5mHealing: 120,
        vipXp: 2500,
        food: 4000000,
        wood: 4000000,
        stone: 800000,
        iron: 200000,
      },
      choice: { kind: "fixed" },
    },
    // Higher tiers: TBD — locked behind $4.99 purchase per sequential unlock model.
  ],
};
