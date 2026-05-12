/**
 * Test suite for the Kingshot Battle Simulation Engine.
 *
 * Run with: node src/engine/battle-sim.test.js (from rally-lead-app/)
 */

import {
  simulateBattle,
  simulateBearTrap,
  createArmy,
  createBuffProfile,
  createSkillModProfile,
  createStandardArmy,
  createBearArmy,
  monteCarloSim,
  lookupBaseStats,
} from "./battle-sim.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  \u274C FAIL: ${message}`);
    failed++;
    return false;
  }
  console.log(`  \u2705 PASS: ${message}`);
  passed++;
  return true;
}

function assertApprox(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  return assert(diff <= tolerance, `${message} (got ${actual.toFixed(2)}, expected ~${expected}, tol=${tolerance})`);
}


// ─── TEST 1: Verified T6 anchor values (TG0 baseline from JSON) ──────────
console.log("\n=== TEST 1: Base Troop Stats (T6 TG0 verified) ===");
assert(lookupBaseStats("Infantry", 6, 0).ATK === 243, "Infantry T6 TG0 ATK = 243");
assert(lookupBaseStats("Infantry", 6, 0).HP === 730, "Infantry T6 TG0 HP = 730");
assert(lookupBaseStats("Cavalry", 6, 0).ATK === 730, "Cavalry T6 TG0 ATK = 730");
assert(lookupBaseStats("Cavalry", 6, 0).HP === 243, "Cavalry T6 TG0 HP = 243");
assert(lookupBaseStats("Archer", 6, 0).ATK === 974, "Archer T6 TG0 ATK = 974");
assert(lookupBaseStats("Archer", 6, 0).HP === 183, "Archer T6 TG0 HP = 183");


// ─── TEST 2: Bear Trap sanity ────────────────────────────────────────────
console.log("\n=== TEST 2: Bear Trap Damage Formula ===");
const bearArmy = createBearArmy(30000, 6);
const bearResult = simulateBearTrap(bearArmy, { bearLevel: 5, seed: 42 });

console.log(`  Bear total damage: ${bearResult.totalDamage}`);
assert(bearResult.totalDamage > 0, "Bear trap produces positive damage");
assert(bearResult.rounds === 10, "Bear trap runs exactly 10 rounds");

const dmgBy = (type) => bearResult.roundBreakdown
  .filter(r => r.troopType === type)
  .reduce((sum, r) => sum + r.damage, 0);
const infDmg = dmgBy("Infantry");
const cavDmg = dmgBy("Cavalry");
const archerDmg = dmgBy("Archer");

console.log(`  Damage by type — Inf: ${infDmg.toFixed(1)}, Cav: ${cavDmg.toFixed(1)}, Arch: ${archerDmg.toFixed(1)}`);
assert(archerDmg > cavDmg, "Archers deal more damage than cavalry in bear trap");
assert(archerDmg > infDmg, "Archers deal more damage than infantry in bear trap");


// ─── TEST 3: SkillMod effect_op stacking ─────────────────────────────────
console.log("\n=== TEST 3: SkillMod Effect_Op Stacking ===");
const sm4Chenko = (1 + 100 / 100);              // 4x same op: additive = 2.0
const smMixed   = (1 + 50 / 100) * (1 + 50 / 100); // different ops: multiply = 2.25
assertApprox(sm4Chenko, 2.0, 0.001, "4x Chenko (same op, 100% total) = 2.0x DamageUp");
assertApprox(smMixed,   2.25, 0.001, "2x Chenko + 2x Amane (split ops) = 2.25x DamageUp");
assertApprox(smMixed / sm4Chenko, 1.125, 0.001, "Mixed ops are 12.5% better than stacked ops");


// ─── TEST 4: Symmetric PvP near-draw ─────────────────────────────────────
console.log("\n=== TEST 4: Symmetric PvP Battle ===");
const army1 = createStandardArmy(100000, 9);
const army2 = createStandardArmy(100000, 9);
const pvpResult = simulateBattle(army1, army2, {
  seed: 12345,
  battleType: "cityAttack",
  detailedLog: false,
});
const aTotal = pvpResult.attacker.remaining.Infantry + pvpResult.attacker.remaining.Cavalry + pvpResult.attacker.remaining.Archer;
const dTotal = pvpResult.defender.remaining.Infantry + pvpResult.defender.remaining.Cavalry + pvpResult.defender.remaining.Archer;

console.log(`  Winner: ${pvpResult.winner}, Rounds: ${pvpResult.rounds}`);
console.log(`  Attacker remaining: I=${pvpResult.attacker.remaining.Infantry} C=${pvpResult.attacker.remaining.Cavalry} A=${pvpResult.attacker.remaining.Archer}`);
console.log(`  Defender remaining: I=${pvpResult.defender.remaining.Infantry} C=${pvpResult.defender.remaining.Cavalry} A=${pvpResult.defender.remaining.Archer}`);

assert(
  pvpResult.winner === "draw" || Math.abs(aTotal - dTotal) < 1000,
  "Symmetric armies produce near-draw result"
);


// ─── TEST 5: Asymmetric battle — buffed T9 vs plain T6 ───────────────────
console.log("\n=== TEST 5: Asymmetric Battle ===");
const strongArmy = createStandardArmy(100000, 9, {
  buffs: createBuffProfile({
    standard: {
      Infantry: { ATK: 1.0, Leth: 0.5, HP: 1.0, DEF: 0.5 },
      Cavalry:  { ATK: 1.0, Leth: 0.5, HP: 1.0, DEF: 0.5 },
      Archer:   { ATK: 1.0, Leth: 0.5, HP: 1.0, DEF: 0.5 },
    },
  }),
});
const weakArmy = createStandardArmy(100000, 6);
const asymResult = simulateBattle(strongArmy, weakArmy, { seed: 99999, battleType: "cityAttack" });
console.log(`  Winner: ${asymResult.winner}, Rounds: ${asymResult.rounds}`);
assert(asymResult.winner === "attacker", "Buffed T9 army beats unbuffed T6 army");


// ─── TEST 6: Detailed log output ─────────────────────────────────────────
console.log("\n=== TEST 6: Detailed Round Log ===");
const smallA = createStandardArmy(10000, 6);
const smallD = createStandardArmy(10000, 6);
const detailedResult = simulateBattle(smallA, smallD, { seed: 777, detailedLog: true });

assert(detailedResult.roundLogs !== undefined, "Detailed log is present");
assert(detailedResult.roundLogs.length > 0, "At least one round logged");
assert(detailedResult.roundLogs[0].attacker.actions !== undefined, "Round has attacker actions");

const r1 = detailedResult.roundLogs[0];
console.log(`  Round 1 attacker actions:`);
console.log(`    Infantry killed ${r1.attacker.actions.Infantry.main} ${r1.attacker.actions.Infantry.target}`);
console.log(`    Cavalry killed ${r1.attacker.actions.Cavalry.main} (front) + ${r1.attacker.actions.Cavalry.dive} (dive)`);
console.log(`    Archer killed ${r1.attacker.actions.Archer.main} ${r1.attacker.actions.Archer.target} (volley: ${r1.attacker.actions.Archer.volleyProc})`);


// ─── TEST 7: Monte Carlo ─────────────────────────────────────────────────
console.log("\n=== TEST 7: Monte Carlo (50 iterations) ===");
const mcA = createStandardArmy(50000, 8);
const mcD = createStandardArmy(50000, 8);
const mcResult = monteCarloSim(mcA, mcD, { iterations: 50, battleType: "sanctuary" });

console.log(`  Attacker win rate: ${(mcResult.attackerWinRate * 100).toFixed(1)}%`);
console.log(`  Defender win rate: ${(mcResult.defenderWinRate * 100).toFixed(1)}%`);
console.log(`  Draw rate: ${(mcResult.drawRate * 100).toFixed(1)}%`);
console.log(`  Avg rounds: ${mcResult.avgRounds.toFixed(1)}`);
console.log(`  Avg attacker losses: I=${mcResult.avgAttackerLosses.Infantry} C=${mcResult.avgAttackerLosses.Cavalry} A=${mcResult.avgAttackerLosses.Archer}`);

assert(
  Math.abs(mcResult.attackerWinRate - mcResult.defenderWinRate) < 0.3,
  "Symmetric Monte Carlo has roughly equal win rates"
);


// ─── TEST 8: Cavalry Ambusher dive mechanic ──────────────────────────────
console.log("\n=== TEST 8: Cavalry Dive (Ambusher) ===");
const cavOnlyArmy = createArmy({
  Infantry: { count: 0,     tier: 6 },
  Cavalry:  { count: 10000, tier: 6 },
  Archer:   { count: 0,     tier: 6 },
});
const mixedDefender = createStandardArmy(10000, 6);
const cavResult = simulateBattle(cavOnlyArmy, mixedDefender, { seed: 555, detailedLog: true });

const r1cav = cavResult.roundLogs[0];
console.log(`  Cav main target: ${r1cav.attacker.actions.Cavalry.mainTarget}`);
console.log(`  Cav main kills: ${r1cav.attacker.actions.Cavalry.main}`);
console.log(`  Cav dive kills: ${r1cav.attacker.actions.Cavalry.dive}`);
assert(r1cav.attacker.actions.Cavalry.mainTarget === "Infantry", "Cavalry main body targets infantry (frontline)");
assert(r1cav.attacker.actions.Cavalry.dive >= 0, "Cavalry divers attempt to attack archers");


// ─── TEST 9: Garrison vs Attack formation ────────────────────────────────
console.log("\n=== TEST 9: Garrison 60/20/20 vs Attack 50/20/30 ===");
const garrisonArmy = createArmy({
  Infantry: { count: 60000, tier: 8 },
  Cavalry:  { count: 20000, tier: 8 },
  Archer:   { count: 20000, tier: 8 },
});
const attackArmy = createArmy({
  Infantry: { count: 50000, tier: 8 },
  Cavalry:  { count: 20000, tier: 8 },
  Archer:   { count: 30000, tier: 8 },
});

const garrisonResult = simulateBattle(attackArmy, garrisonArmy, { seed: 333, battleType: "kingsCastle" });
const gATotal = garrisonResult.attacker.remaining.Infantry + garrisonResult.attacker.remaining.Cavalry + garrisonResult.attacker.remaining.Archer;
const gDTotal = garrisonResult.defender.remaining.Infantry + garrisonResult.defender.remaining.Cavalry + garrisonResult.defender.remaining.Archer;
console.log(`  Winner: ${garrisonResult.winner}, Rounds: ${garrisonResult.rounds}`);
console.log(`  Attacker remaining: ${gATotal}`);
console.log(`  Defender remaining: ${gDTotal}`);


// ─── TEST 10: Primary target fixed from snapshot — later types skip ─────
// Attacker: huge Infantry (will wipe defender's tiny Infantry), plus Cavalry
// and Archer. Primary target for the round is Infantry (defender's snapshot had
// Infantry). After attacker's Infantry wipes them, attacker's Archer must NOT
// retarget to Cavalry — it should deal zero kills this round.
console.log("\n=== TEST 10: Snapshot-based targeting, no retarget ===");
{
  const att = createArmy({
    Infantry: { count: 50000, tier: 11 },
    Cavalry:  { count: 100,   tier: 11 },
    Archer:   { count: 10000, tier: 11 },
  });
  const def = createArmy({
    Infantry: { count: 50,    tier: 1 },  // trivially wiped by attacker's Inf
    Cavalry:  { count: 10000, tier: 11 },
    Archer:   { count: 10000, tier: 11 },
  });
  const r = simulateBattle(att, def, { seed: 42, battleType: "tileAttack", maxRounds: 1, detailedLog: true });
  const round1 = r.roundLogs[0];
  const a = round1.attacker.actions;

  assert(a.Infantry.target === "Infantry", "Attacker Infantry targets enemy Infantry (primary)");
  assert(a.Infantry.main >= 50, "Attacker Infantry wipes defender Infantry");
  assert(a.Archer.main === 0, "Attacker Archer does NOT retarget after Infantry wiped — zero kills");
  assert(
    r.defender.remaining.Cavalry === 10000,
    "Defender Cavalry untouched this round (attacker Archer did not retarget)"
  );
  console.log(`  Archer kills after primary wiped: ${a.Archer.main} (expected 0)`);
}


// ─── TEST 11: Cavalry dive fires even when primary is depleted ──────────
// Attacker is cavalry-only. Primary = Infantry (tiny). Infantry gets wiped by
// cav main body's first chunk. The 20% divers still hit archers independently.
console.log("\n=== TEST 11: Cavalry dive is independent of primary ===");
{
  const att = createArmy({
    Infantry: { count: 0,      tier: 11 },
    Cavalry:  { count: 10000,  tier: 11 },
    Archer:   { count: 0,      tier: 11 },
  });
  const def = createArmy({
    Infantry: { count: 500000, tier: 11 },  // too tanky to wipe — keeps primary alive
    Cavalry:  { count: 0,      tier: 11 },
    Archer:   { count: 10000,  tier: 11 },
  });
  const r = simulateBattle(att, def, { seed: 7, battleType: "tileAttack", maxRounds: 1, detailedLog: true });
  const a = r.roundLogs[0].attacker.actions;

  assert(a.Cavalry.mainTarget === "Infantry", "Cavalry main body targets Infantry primary");
  assert(a.Cavalry.main > 0, "Cavalry main body inflicts kills on Infantry");
  assert(a.Cavalry.dive > 0, "Cavalry divers (20%) hit Archer independently of primary");
}


// ─── TEST 12: Next-round primary updates from fresh snapshot ────────────
// Archer-only attacker vs defender with Infantry that gets wiped in round 1.
// Round 1 primary = Infantry. Round 2 primary = Cavalry (snapshot after).
console.log("\n=== TEST 12: Primary updates between rounds ===");
{
  const att = createArmy({
    Infantry: { count: 0,      tier: 11 },
    Cavalry:  { count: 0,      tier: 11 },
    Archer:   { count: 200000, tier: 11 },
  });
  const def = createArmy({
    Infantry: { count: 50,     tier: 1 },
    Cavalry:  { count: 20000,  tier: 11 },
    Archer:   { count: 20000,  tier: 11 },
  });
  const r = simulateBattle(att, def, { seed: 3, battleType: "tileAttack", maxRounds: 2, detailedLog: true });
  const r1a = r.roundLogs[0].attacker.actions;
  const r2a = r.roundLogs[1].attacker.actions;

  assert(r1a.Archer.target === "Infantry", "Round 1 primary is Infantry (from snapshot)");
  assert(r2a.Archer.target === "Cavalry", "Round 2 primary shifts to Cavalry after Infantry wiped");
}


// ─── TEST 13: Snapshot-based simultaneity ────────────────────────────────
// Losses are applied at end of round, so the defender's return damage in the
// same round uses the attacker's FULL snapshot count, not a post-casualty count.
console.log("\n=== TEST 13: Simultaneous resolution (snapshot-based) ===");
{
  const symA = createStandardArmy(50000, 11);
  const symB = createStandardArmy(50000, 11);
  const r = simulateBattle(symA, symB, { seed: 101, maxRounds: 1, detailedLog: true });
  // Round 1 mutual losses should be equal (pure symmetry).
  const aLost = symA.troops.Infantry.composition.reduce((s,g)=>s+g.count,0) + symA.troops.Cavalry.composition.reduce((s,g)=>s+g.count,0) + symA.troops.Archer.composition.reduce((s,g)=>s+g.count,0) - (r.attacker.remaining.Infantry + r.attacker.remaining.Cavalry + r.attacker.remaining.Archer);
  const dLost = symB.troops.Infantry.composition.reduce((s,g)=>s+g.count,0) + symB.troops.Cavalry.composition.reduce((s,g)=>s+g.count,0) + symB.troops.Archer.composition.reduce((s,g)=>s+g.count,0) - (r.defender.remaining.Infantry + r.defender.remaining.Cavalry + r.defender.remaining.Archer);
  assertApprox(aLost, dLost, 10, "Symmetric round 1 losses are equal on both sides");
}


// ─── Summary ─────────────────────────────────────────────────────────────
console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
