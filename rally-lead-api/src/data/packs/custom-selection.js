// Custom Selection — 3 slots × pick-1-of-4 with repeats. Speedup-focused.
// Source: $4.99 observed (Ryan, Day 15); higher tiers extrapolated.

export default {
  id: "custom_selection",
  name: "Custom Selection",
  category: "custom_family",
  tags: ["custom_family", "speedups"],
  recurrence: { cycleDays: 28, windows: [{ days: [1, 3] }, { days: [15, 17] }] },
  perWindowCap: 1,
  tierAccessModel: "independent",
  labelFormat: "categorical",
  label: "Best Deals",
  source: { author: "ryan", capturedDate: "2026-04-30", confidence: "observed" },
  tiers: [
    {
      id: "common",
      tierName: "Common Custom Chest",
      price: 4.99,
      base: {},
      baseExtras: { customResourceChestLv1: 2000, goldKey: 1, vipXp: 2500 },
      choice: {
        kind: "slots", slots: 3, repeats: true,
        options: [
          { id: "truegold",     label: "Truegold",
            contents: {}, extras: { truegold: 12 } },
          { id: "speedup_cons", label: "Construction Speedup",
            contents: {}, extras: { speedup1hConstruction: 11 } },
          { id: "speedup_res",  label: "Research Speedup",
            contents: {}, extras: { speedup1hResearch: 11 } },
          { id: "speedup_tra",  label: "Training Speedup",
            contents: {}, extras: { speedup1hTraining: 11 } },
        ],
      },
    },
    { id: "uncommon",  tierName: "Uncommon Custom Chest",  price:  9.99, scaleFrom: "common", factor: 2 },
    { id: "rare",      tierName: "Rare Custom Chest",      price: 19.99, scaleFrom: "common", factor: 4 },
    { id: "epic",      tierName: "Epic Custom Chest",      price: 49.99, scaleFrom: "common", factor: 10 },
    { id: "legendary", tierName: "Legendary Custom Chest", price: 99.99, scaleFrom: "common", factor: 20 },
  ],
};
