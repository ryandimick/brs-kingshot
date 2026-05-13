// Standalone smoke test for the planner kernel. Lives in the API project
// so its relative imports resolve. Run with:  node scripts/engine-smoke.mjs
import { plan } from "../src/engine/planner.js";

// Minimal sheet — exercise the planner with a small gov-gear budget
const cs = {
  govGearSlots: {},
  charmLevels: {},
  heroGear: {},
  heroRoster: {},
  attackRally: { selectedHeroes: [], offenseWeight: 75 },
  garrisonLead: { selectedHeroes: [], offenseWeight: 25 },
  troops: {
    Infantry: { composition: [{ count: 100000, tier: 11, tgLevel: 0 }] },
    Cavalry:  { composition: [{ count: 50000,  tier: 11, tgLevel: 0 }] },
    Archer:   { composition: [{ count: 80000,  tier: 11, tgLevel: 0 }] },
  },
};

const result = plan(cs, { satin: 100000, threads: 1000 }, { categories: ["govgear"] });
console.log("upgrades:", result.upgrades.length);
console.log("first 3:", result.upgrades.slice(0, 3).map(u => ({ name: u.name, gain: u.gain.toFixed(3) })));
console.log("remaining:", result.remaining);
