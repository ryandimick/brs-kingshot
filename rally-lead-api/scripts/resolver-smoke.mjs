// Smoke test for pack-resolver. Verifies routing across each archetype:
//   - fixed (Conqueror $4.99) — bundle = base, no routing
//   - pick1 (Hope Market $4.99) — picks 1 of 4
//   - slots (Custom Arms Set $4.99) — 3 picks of 3 options
//   - nested subChoice (Custom Pet Chest $4.99 → Pet Advancement → chests)
//
// Also sanity-checks bottleneck routing: a user with no mithril but a need
// for it should route Hope Market's Hero Gear option (which gives EP not
// mithril) over Truegold (unmodeled).
//
// Run with: node scripts/resolver-smoke.mjs

import { resolvePackTier } from "../src/engine/pack-resolver.js";
import { getAllPacks, getPackById } from "../src/data/pack-catalog.js";

// Build a realistic-ish character sheet: some troops, no upgrades yet.
const cs = {
  govGearSlots: {},
  charmLevels: {},
  heroGear: {},
  heroRoster: {},
  attackRally: { selectedHeroes: [], joinerSlots: [], offenseWeight: 75 },
  garrisonLead: { selectedHeroes: [], offenseWeight: 25 },
  troops: {
    Infantry: { composition: [{ count: 200000, tier: 11, tgLevel: 0 }] },
    Cavalry:  { composition: [{ count: 100000, tier: 11, tgLevel: 0 }] },
    Archer:   { composition: [{ count: 160000, tier: 11, tgLevel: 0 }] },
  },
};

const emptyBudget = {};

function show(label, tierId, packId) {
  const pack = getPackById(packId);
  const tier = pack.tiers.find(t => t.id === tierId);
  const bundle = resolvePackTier(cs, emptyBudget, tier);
  console.log(`\n${label}`);
  console.log(`  ${pack.name} — ${tier.tierName} ($${tier.price})`);
  console.log(`  choice.kind: ${tier.choice?.kind}`);
  console.log(`  routed bundle:`, bundle);
}

console.log("Loaded packs:", getAllPacks().map(p => p.id).join(", "));

show("FIXED:",    "tier_499",       "conqueror");
show("PICK1:",    "kindling_light", "hope_market");
show("SLOTS:",    "common",         "custom_arms_set");
show("NESTED:",   "common",         "custom_pet_chest");

// Bottleneck test: forgehammers-heavy starting budget. Custom Arms Set
// (forgehammers / EP / gear chests) should route AWAY from forgehammers
// since the user is already swimming in them.
console.log("\n--- bottleneck test: budget already has 1000 forgehammers ---");
const flushBudget = { forgehammers: 1000 };
const arms = getPackById("custom_arms_set");
const commonTier = arms.tiers.find(t => t.id === "common");
console.log("  routed:", resolvePackTier(cs, flushBudget, commonTier));
