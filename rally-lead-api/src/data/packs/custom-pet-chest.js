// Custom Pet Chest — 3 slots × pick-1-of-4 with repeats. The "Pet Advancement"
// option grants chests; each chest is itself pick-1-of-3 (7 Growth Manual /
// 2 Nutrient Potion / 1 Promotion Medallion).
// Source: in-game observation (Ryan), 2026-04-30. Recurrence cadence uncertain.

export default {
  id: "custom_pet_chest",
  name: "Custom Pet Chest",
  category: "custom_family",
  tags: ["custom_family", "pets"],
  recurrence: {
    cycleDays: 28,
    windows: [{ days: [1, 7] }],
    uncertain: true,
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
          { id: "pet_food",        label: "Pet Food",
            contents: { petFood: 3000 },         extras: {} },
          { id: "pet_advancement", label: "Pet Advancement",
            contents: {},                         extras: {},
            // Each chest opens as a pick-1-of-3. 3 chests per pack slot.
            subChoice: {
              kind: "slots", slots: 3, repeats: true,
              options: [
                { id: "growth_manual",     label: "Growth Manual",
                  contents: { petGrowthManual: 7 },     extras: {} },
                { id: "nutrient_potion",   label: "Nutrient Potion",
                  contents: { petNutrientPotion: 2 },   extras: {} },
                { id: "promotion_medallion", label: "Promotion Medallion",
                  contents: { petPromotionMedallion: 1 }, extras: {} },
              ],
            },
          },
          { id: "taming_common",   label: "Common Taming Mark",
            contents: { tamingMarkCommon: 10 },   extras: {} },
          { id: "taming_advanced", label: "Advanced Taming Mark",
            contents: { tamingMarkAdvanced: 1 },  extras: {} },
        ],
      },
    },
    { id: "uncommon",  tierName: "Uncommon Custom Chest",  price:  9.99, scaleFrom: "common", factor: 2 },
    { id: "rare",      tierName: "Rare Custom Chest",      price: 19.99, scaleFrom: "common", factor: 4 },
    { id: "epic",      tierName: "Epic Custom Chest",      price: 49.99, scaleFrom: "common", factor: 10 },
    { id: "legendary", tierName: "Legendary Custom Chest", price: 99.99, scaleFrom: "common", factor: 20 },
  ],
};
