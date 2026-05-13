// Smoke test for pack catalog expansion. Verifies that:
//   1. All packs load
//   2. scaleFrom resolves correctly across linear-scaling tiers
//   3. subChoice contents scale with the parent (Pet Advancement chest)
// Run with:  node scripts/catalog-smoke.mjs
import { getAllPacks } from "../src/data/pack-catalog.js";

const packs = getAllPacks();
console.log(`Loaded ${packs.length} packs:\n`);
for (const p of packs) {
  console.log(`  ${p.id.padEnd(40)} ${p.tiers.length} tier(s)`);
}

// Spot check: Custom Pet Chest "legendary" ($99.99 / 20× scale)
const cpc = packs.find(p => p.id === "custom_pet_chest");
const leg = cpc.tiers.find(t => t.id === "legendary");
console.log("\nCustom Pet Chest LEGENDARY ($99.99 / 20×):");
console.log("  baseExtras:", leg.baseExtras);
const petAdv = leg.choice.options.find(o => o.id === "pet_advancement");
console.log("  Pet Advancement subChoice options:");
for (const opt of petAdv.subChoice.options) {
  console.log(`    ${opt.id}: ${JSON.stringify(opt.contents)}`);
}

// Spot check: Hope Market $19.99 "Moonlit Aspiration" (4×) Hero Gear option
const hm = packs.find(p => p.id === "hope_market");
const moonlit = hm.tiers.find(t => t.id === "moonlit_aspiration");
const heroGear = moonlit.choice.options.find(o => o.id === "hero_gear");
console.log("\nHope Market MOONLIT ASPIRATION ($19.99 / 4×) Hero Gear option:");
console.log(`  contents:`, heroGear.contents);
console.log(`  extras:`, heroGear.extras);
console.log(`  expected: ep: 6000 (4 × 1500), luckyHeroGearChest: 24 (4 × 6)`);
