// Hope Market — pick-1-of-4 per purchase. 5 tiers, linear scaling (1×/2×/4×/10×/20×).
// Source: in-game observation (Ryan), 2026-04-30.

export default {
  id: "hope_market",
  name: "Hope Market",
  category: "marketplace",
  tags: ["popular", "linear_scaling"],
  recurrence: { cycleDays: 28, windows: [{ days: [5, 7] }, { days: [19, 21] }] },
  perWindowCap: 1,
  tierAccessModel: "independent",
  labelFormat: "categorical",
  label: "Best Deals",
  source: { author: "ryan", capturedDate: "2026-04-30", confidence: "observed" },
  tiers: [
    {
      id: "kindling_light",
      tierName: "Kindling Light Pack",
      price: 4.99,
      base: {},
      baseExtras: {
        gems: 2500,
        food: 5000000,
        wood: 5000000,
        stone: 1000000,
        iron: 250000,
        vipXp: 2500,
      },
      choice: {
        kind: "pick1",
        options: [
          { id: "truegold",  label: "Truegold",
            contents: {},
            extras: { truegold: 20, speedup1hGeneral: 8, speedup5mGeneral: 96 } },
          { id: "gov_gear",  label: "Governor Gear",
            contents: { threads: 120, satin: 12000 },
            extras: {} },
          { id: "artisan",   label: "Artisan's Vision",
            contents: { artisan: 50 },
            extras: {} },
          { id: "hero_gear", label: "Hero Gear",
            contents: { ep: 1500 },
            extras: { luckyHeroGearChest: 6 } },
        ],
      },
    },
    { id: "midnight_hope",     tierName: "Midnight's Hope Pack",     price:  9.99, scaleFrom: "kindling_light", factor: 2 },
    { id: "moonlit_aspiration",tierName: "Moonlit Aspiration Pack",  price: 19.99, scaleFrom: "kindling_light", factor: 4 },
    { id: "morning_star",      tierName: "Morning Star's Vow Pack",  price: 49.99, scaleFrom: "kindling_light", factor: 10 },
    { id: "morning_glow",      tierName: "Morning Glow Pack",        price: 99.99, scaleFrom: "kindling_light", factor: 20 },
  ],
};
