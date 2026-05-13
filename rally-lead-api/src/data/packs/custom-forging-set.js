// Custom Forging Set — 3 slots × pick-1-of-2 with repeats. Charm-system specialization.
// Source: $4.99 directly observed (Ryan, 2026-04-30); $99.99 slot value 260 confirmed,
//          intermediate tiers extrapolated from linear scaling.

export default {
  id: "custom_forging_set",
  name: "Custom Forging Set",
  category: "custom_family",
  tags: ["custom_family", "charms"],
  recurrence: { cycleDays: 28, windows: [{ days: [7, 8] }, { days: [21, 22] }] },
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
          { id: "guides",  label: "Charm Guides",  contents: { guides: 13 },  extras: {} },
          { id: "designs", label: "Charm Designs", contents: { designs: 13 }, extras: {} },
        ],
      },
    },
    { id: "uncommon",  tierName: "Uncommon Custom Chest",  price:  9.99, scaleFrom: "common", factor: 2 },
    { id: "rare",      tierName: "Rare Custom Chest",      price: 19.99, scaleFrom: "common", factor: 4 },
    { id: "epic",      tierName: "Epic Custom Chest",      price: 49.99, scaleFrom: "common", factor: 10 },
    { id: "legendary", tierName: "Legendary Custom Chest", price: 99.99, scaleFrom: "common", factor: 20 },
  ],
};
