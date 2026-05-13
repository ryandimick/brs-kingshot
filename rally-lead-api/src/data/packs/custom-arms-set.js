// Custom Arms Set — 3 slots × pick-1-of-3 with repeats. 5 tiers, linear scaling.
// Source: in-game observation (Ryan), 2026-04-30.

export default {
  id: "custom_arms_set",
  name: "Custom Arms Set",
  category: "custom_family",
  tags: ["custom_family", "hero_gear"],
  recurrence: {
    cycleDays: 28,
    windows: [{ days: [4, 5] }, { days: [11, 12] }, { days: [18, 19] }, { days: [25, 26] }],
  },
  perWindowCap: 1,
  tierAccessModel: "independent",
  labelFormat: "percentage",
  label: "1800%",
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
          { id: "ep",           label: "Hero Gear XP",     contents: { ep: 600 },             extras: {} },
          { id: "gear_chest",   label: "Hero Gear Chests", contents: {},                       extras: { luckyHeroGearChest: 4 } },
          { id: "forgehammers", label: "Forgehammers",     contents: { forgehammers: 4 },     extras: {} },
        ],
      },
    },
    { id: "uncommon",  tierName: "Uncommon Custom Chest",  price:  9.99, scaleFrom: "common", factor: 2 },
    { id: "rare",      tierName: "Rare Custom Chest",      price: 19.99, scaleFrom: "common", factor: 4 },
    { id: "epic",      tierName: "Epic Custom Chest",      price: 49.99, scaleFrom: "common", factor: 10 },
    { id: "legendary", tierName: "Legendary Custom Chest", price: 99.99, scaleFrom: "common", factor: 20 },
  ],
};
