// In-game gift pack offerings — quantity granted per single pick.
// Each pack tier lets the buyer choose 3 items (with repetition allowed)
// from the menu below. Source: in-game pack screenshots (2026-04).
//
// Cost ratios drift slightly across tiers because not every item scales 2×
// at the $100 tier — Charm Design / Charm Guide are skimped (1.83×).
// Pick a `BASELINE_TIER` below to fix the cross-rate used by the rest of
// the app (default: $5 — the most cost-efficient tier per item).

export const PACK_TIERS = {
  "$5":   { picks: 3, costUSD: 5 },
  "$50":  { picks: 3, costUSD: 50 },
  "$100": { picks: 3, costUSD: 100 },
};

// Quantity per ONE pick at each tier. Items not offered at a tier are absent.
export const PACK_OFFERS = {
  truegold:        { "$5": 14,    "$50": 140,    "$100": 280 },     // assumed 2×
  speedup1h:       { "$5": 16,    "$50": 160,    "$100": 320 },     // assumed 2×
  heroGearChest:   { "$5": 5,     "$50": 45,     "$100": 90 },      // assumed 2×
  forgehammer:     { "$5": 5,     "$50": 45,     "$100": 90 },
  artisanVision:   { "$5": 14,    "$50": 120,    "$100": 240 },
  gildedThreads:   { "$5": 70,    "$50": 600,    "$100": 1200 },
  satin:           { "$5": 7000,  "$50": 60000,  "$100": 120000 },
  charmDesign:     { "$5": 12,    "$50": 120,    "$100": 220 },     // 1.83× at $100
  charmGuide:      { "$5": 12,    "$50": 120,    "$100": 220 },     // 1.83× at $100
};

// Friendly labels for display.
export const PACK_ITEM_LABELS = {
  truegold:      "Truegold",
  speedup1h:     "1h Speedup",
  heroGearChest: "Hero Gear Chest",
  forgehammer:   "Forgehammer",
  artisanVision: "Artisan's Vision",
  gildedThreads: "Gilded Threads",
  satin:         "Satin",
  charmDesign:   "Charm Design",
  charmGuide:    "Charm Guide",
};

// Default tier used to convert item costs to USD. Change to "$50" or "$100"
// if you'd rather price against the larger packs.
export const BASELINE_TIER = "$5";

// Items the user has in abundance and shouldn't be priced when scoring upgrades.
// Edit this set as your inventory shifts. Items in here contribute $0 to USD
// cost calculations — the upgrade is treated as already paid for these inputs.
export const MARGINAL_FREE_ITEMS = new Set([
  "artisanVision",   // user reports plenty
  "charmGuide",      // user reports plenty
  "mythicGear",      // earned in-game; user OK pricing mastery upgrades on FH alone
]);

// Items that have NO USD price at all (not offered in any tracked pack).
// Upgrades requiring these can't be priced; the optimizer shows them with no
// usdCost and falls back to in-game-only ranking.
export const NO_USD_PRICE_ITEMS = new Set([
  "heroXPCloth",     // not in tracked packs
  "widgetFragment",  // not in tracked packs
]);

// USD value of one pick at the given tier.
export function usdPerPick(tier = BASELINE_TIER) {
  const t = PACK_TIERS[tier];
  if (!t) return null;
  return t.costUSD / t.picks;
}

// Cost in USD of one unit of `item` at the chosen tier.
// Returns null if the item isn't offered at that tier.
export function unitCostUSD(item, tier = BASELINE_TIER) {
  const offer = PACK_OFFERS[item];
  if (!offer || offer[tier] == null) return null;
  return usdPerPick(tier) / offer[tier];
}

// USD cost for `qty` units of `item` at the chosen tier.
export function costUSD(item, qty, tier = BASELINE_TIER) {
  const u = unitCostUSD(item, tier);
  return u == null ? null : u * qty;
}

// Cross-rate: how many of `itemB` equal 1 of `itemA` at the chosen tier?
// e.g. exchangeRate("forgehammer", "charmDesign", "$5") → 2.4 designs per FH
export function exchangeRate(itemA, itemB, tier = BASELINE_TIER) {
  const a = PACK_OFFERS[itemA]?.[tier];
  const b = PACK_OFFERS[itemB]?.[tier];
  if (a == null || b == null) return null;
  return b / a;
}

// Marginal USD cost of a resource bundle.
// `bundle` is { satin, threads, artisan, forgehammers, designs, guides,
//               mythicGears, epCost, widgetFragments } with any subset.
// Items in MARGINAL_FREE_ITEMS contribute $0. Items in NO_USD_PRICE_ITEMS
// cause the function to return null (the upgrade can't be fully priced).
const RESOURCE_TO_PACK_KEY = {
  satin: "satin",
  threads: "gildedThreads",
  artisan: "artisanVision",
  forgehammers: "forgehammer",
  designs: "charmDesign",
  guides: "charmGuide",
  mythicGears: "mythicGear",
  epCost: "heroXPCloth",
  widgetFragments: "widgetFragment",
};

export function marginalCostUSD(bundle, tier = BASELINE_TIER) {
  let total = 0;
  for (const [resource, qty] of Object.entries(bundle || {})) {
    if (!qty) continue;
    const packKey = RESOURCE_TO_PACK_KEY[resource];
    if (!packKey) continue;
    if (NO_USD_PRICE_ITEMS.has(packKey)) return null;
    if (MARGINAL_FREE_ITEMS.has(packKey)) continue;
    const u = unitCostUSD(packKey, tier);
    if (u == null) return null;  // item not offered at this tier
    total += u * qty;
  }
  return total;
}
