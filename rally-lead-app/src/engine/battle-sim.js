/**
 * Kingshot Battle Simulation Engine
 * ==================================
 * Pure-JS recreation of Kingshot expedition battle mechanics.
 *
 * Sources:
 *   - kingshotguides.com (Daryl's damage formula, ~95-100% accuracy)
 *   - kingshotsimulator.com (reference implementation)
 *   - Strat Games Sloth combat guide (battle loop reconstruction)
 *   - Official Kingshot Combat FAQ
 *
 * Per-round losses dealt by one attacker troop type against one defender
 * troop type:
 *
 *   Losses = (base_ATK × √attackerCount) × (1 + Atk%) × (1 + Leth%)
 *          ─────────────────────────────────────────────────────────── × SkillMod
 *                    defenderDefStat × defenderHpStat
 *
 *   defenderDefStat = base_DEF × (1 + Def%)
 *   defenderHpStat  = base_HP  × (1 + HP%)
 *
 * Stat-percent pipeline (two layers):
 *   pct = standard_pct + special_pct   (standard additive, special stacks on top)
 *   FinalStat = BaseStat × (1 + standard) × (1 + special)
 *
 * Base stats are aggregated (count-weighted) across a troop-type composition,
 * so mixed tiers / TG levels within a single troop type are supported.
 */

import {
  lookupBaseStats,
  aggregateBaseStats,
  totalCount,
  minTier,
  TROOP_TYPES as TROOP_TYPES_DATA,
} from "../data/troop-base-stats.js";

export { lookupBaseStats, aggregateBaseStats, totalCount };
export const TROOP_TYPES = TROOP_TYPES_DATA;

/**
 * Innate troop abilities — passive effects that trigger every round.
 */
export const TROOP_ABILITIES = {
  // Infantry
  masterBrawler:  { source: "Infantry", target: "Cavalry", type: "damageMod",  value: 0.10 },
  bandsOfSteel:   { source: "Infantry", target: "Cavalry", type: "defenseMod", value: 0.10 },

  // Cavalry
  charge:         { source: "Cavalry",  target: "Archer",  type: "damageMod",  value: 0.10 },
  ambusher:       { source: "Cavalry",  target: "Archer",  type: "bypass",     value: 0.20 },

  // Archer
  rangedStrike:   { source: "Archer",   target: "Infantry", type: "damageMod",    value: 0.10 },
  volley:         { source: "Archer",   target: null,       type: "doubleStrike", chance: 0.10 },
};

/**
 * TG3+ troop generation abilities — unlocked at higher troop tiers.
 * RNG-based procs checked each round.
 */
export const TG3_ABILITIES = {
  shieldForge: { source: "Infantry", type: "damageReduction", chance: 0.25, value: 0.36 },
  arrowForge:  { source: "Archer",   type: "extraDamage",     chance: 0.20, value: 0.50 },
  lanceForge:  { source: "Cavalry",  type: "doubleDamage",    chance: 0.10, value: 1.00 },
};

/**
 * Casualty rate tables by battle location.
 * { dead: fraction killed permanently, injured: fraction sent to infirmary }
 * Remainder = lightly injured (return after battle).
 */
export const CASUALTY_RATES = {
  cityAttack:       { dead: 0.35, injured: 0.10 },
  cityDefense:      { dead: 0.00, injured: 0.35 },
  tileAttack:       { dead: 0.00, injured: 0.35 },
  tileDefense:      { dead: 0.00, injured: 0.35 },
  sanctuary:        { dead: 0.00, injured: 0.30 },
  kingsCastle:      { dead: 0.00, injured: 0.35 },
  hqAndBanners:     { dead: 0.00, injured: 0.35 },
  swordlandCity:    { dead: 0.00, injured: 0.45 },
  swordlandDefense: { dead: 0.00, injured: 0.35 },
  swordlandBuilding:{ dead: 0.00, injured: 0.30 },
  outpostLv4:       { dead: 0.10, injured: 0.35 },
  bearTrap:         { dead: 0.00, injured: 0.00 },
};


// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

function emptyStatBlock() {
  return { ATK: 0, Leth: 0, HP: 0, DEF: 0 };
}

/**
 * Create a buff profile for one side of a battle.
 *
 * Standard (Type A) = additive: gov gear, charms, skins, alliance research,
 *                     personal research, alliance buildings.
 * Special (Type B)  = multiplicative on top of standard: hero abilities,
 *                     widgets, kingdom titles, consumables, debuffs.
 *
 * All values are decimals (0.50 = 50%).
 */
export function createBuffProfile(params = {}) {
  const pull = (layer, troop) => ({
    ATK:  params[layer]?.[troop]?.ATK  ?? 0,
    Leth: params[layer]?.[troop]?.Leth ?? 0,
    HP:   params[layer]?.[troop]?.HP   ?? 0,
    DEF:  params[layer]?.[troop]?.DEF  ?? 0,
  });

  return {
    standard: {
      Infantry: pull("standard", "Infantry"),
      Cavalry:  pull("standard", "Cavalry"),
      Archer:   pull("standard", "Archer"),
    },
    special: {
      Infantry: pull("special", "Infantry"),
      Cavalry:  pull("special", "Cavalry"),
      Archer:   pull("special", "Archer"),
    },
  };
}

/**
 * Create a SkillMod profile from hero/joiner skills.
 *
 * effectOps is a dictionary keyed by effect_op id (e.g., 101, 102). Same ids
 * are added together. Different ids multiply. Values are PERCENTAGES (not decimals).
 */
export function createSkillModProfile(params = {}) {
  return {
    damageUp:       params.damageUp       ?? {},
    oppDefenseDown: params.oppDefenseDown ?? {},
    defenseUp:      params.defenseUp      ?? {},
    oppDamageDown:  params.oppDamageDown  ?? {},
  };
}

/**
 * Create an army configuration for one side of a battle.
 *
 * Each troop type accepts either:
 *   - A composition: { composition: [{ count, tier, tgLevel }, ...] }
 *   - A shorthand:   { count, tier, tgLevel }   (wrapped as a 1-entry composition)
 *
 * tgLevel defaults to 0 (no True Gold) and tier defaults to 10.
 */
function normalizeComposition(input) {
  if (!input) return [];
  if (Array.isArray(input.composition)) {
    return input.composition.map(g => ({
      count: Math.max(0, g.count || 0),
      tier:  g.tier  ?? 10,
      tgLevel: g.tgLevel ?? 0,
    }));
  }
  return [{
    count: Math.max(0, input.count || 0),
    tier:  input.tier  ?? 10,
    tgLevel: input.tgLevel ?? 0,
  }];
}

export function createArmy(params) {
  const troops = {
    Infantry: { composition: normalizeComposition(params.Infantry) },
    Cavalry:  { composition: normalizeComposition(params.Cavalry) },
    Archer:   { composition: normalizeComposition(params.Archer) },
  };

  const lowestTier = Math.min(
    minTier(troops.Infantry.composition),
    minTier(troops.Cavalry.composition),
    minTier(troops.Archer.composition),
  );

  return {
    troops,
    buffs:    params.buffs    ?? createBuffProfile(),
    skillMod: params.skillMod ?? createSkillModProfile(),
    tg3Enabled: params.tg3Enabled ?? (lowestTier >= 7),
    isRally:  params.isRally  ?? false,
  };
}


// ============================================================================
// STAT CALCULATION
// ============================================================================

function applyBuffs(baseStat, standardBuff, specialBuff) {
  return (baseStat * (1 + standardBuff)) * (1 + specialBuff);
}

// Build fully-buffed stats for one side's troop type from its composition.
// Base stats are count-weighted across tier/TG groups, then standard and
// special buff layers are applied per the two-layer pipeline.
function getCombatStats(troopType, composition, buffs) {
  const base = aggregateBaseStats(troopType, composition);
  const std = buffs.standard[troopType];
  const spc = buffs.special[troopType];

  return {
    ATK:  applyBuffs(base.ATK,  std.ATK,  spc.ATK),
    Leth: applyBuffs(base.Leth, std.Leth, spc.Leth),
    HP:   applyBuffs(base.HP,   std.HP,   spc.HP),
    DEF:  applyBuffs(base.DEF,  std.DEF,  spc.DEF),
  };
}


// ============================================================================
// SKILLMOD CALCULATION
// ============================================================================

function calcSkillModComponent(effectOps) {
  const entries = Object.values(effectOps);
  if (entries.length === 0) return 1.0;
  return entries.reduce((product, pct) => product * (1 + pct / 100), 1.0);
}

function calcSkillMod(attackerSkillMod, defenderSkillMod) {
  const damageUp       = calcSkillModComponent(attackerSkillMod.damageUp);
  const oppDefenseDown = calcSkillModComponent(attackerSkillMod.oppDefenseDown);
  const oppDamageDown  = calcSkillModComponent(defenderSkillMod.oppDamageDown);
  const defenseUp      = calcSkillModComponent(defenderSkillMod.defenseUp);

  const denominator = oppDamageDown * defenseUp;
  if (denominator === 0) return damageUp * oppDefenseDown;

  return (damageUp * oppDefenseDown) / denominator;
}


// ============================================================================
// KILL CALCULATION
// ============================================================================

// Per-round losses inflicted on the defender troop type by the attacker.
// Variable names mirror the damage formula directly:
//
//   Losses = (base_ATK × √attackerCount) × (1 + Atk%) × (1 + Leth%)
//          ─────────────────────────────────────────────────────────── × SkillMod × abilityMod
//                   defenderDefStat × defenderHpStat
//
// attackerStats and defenderStats are already fully buffed; i.e.
//   attackerStats.ATK  = base_ATK  × (1 + Atk%)
//   attackerStats.Leth = base_Leth × (1 + Leth%)
//   defenderStats.DEF  = base_DEF  × (1 + Def%)
//   defenderStats.HP   = base_HP   × (1 + HP%)
// so the math reduces to the multiplication/division shown below.
function calcKills(attackerCount, attackerStats, defenderStats, skillMod, abilityMod, defenderTargetCount) {
  if (attackerCount <= 0 || defenderTargetCount <= 0) return 0;

  const defenderDefStat = defenderStats.DEF;
  const defenderHpStat  = defenderStats.HP;
  const denominator = defenderDefStat * defenderHpStat;
  if (denominator <= 0) return defenderTargetCount;

  const attackTerm = Math.sqrt(attackerCount) * attackerStats.ATK * attackerStats.Leth;
  const rawLosses  = (attackTerm / denominator) * skillMod * abilityMod;

  return Math.min(Math.floor(Math.max(0, rawLosses)), defenderTargetCount);
}


// ============================================================================
// TROOP ABILITY MODIFIERS (the RPS triangle)
// ============================================================================

function getInnateDamageMod(attackerType, targetType) {
  if (attackerType === "Infantry" && targetType === "Cavalry")  return 1.10;
  if (attackerType === "Cavalry"  && targetType === "Archer")   return 1.10;
  if (attackerType === "Archer"   && targetType === "Infantry") return 1.10;
  return 1.0;
}

function getInnateDefenseMod(defenderType, attackerType) {
  if (defenderType === "Infantry" && attackerType === "Cavalry") return 1.10;
  return 1.0;
}


// ============================================================================
// RNG HELPERS
// ============================================================================

/**
 * Seeded pseudo-RNG (xoshiro128**). Deterministic replay for tests.
 */
export function createRng(seed) {
  let s = [seed, seed ^ 0xDEADBEEF, seed ^ 0xCAFEBABE, seed ^ 0x12345678];

  function rotl(x, k) {
    return ((x << k) | (x >>> (32 - k))) >>> 0;
  }

  return function () {
    const result = (rotl((s[1] * 5) >>> 0, 7) * 9) >>> 0;
    const t = (s[1] << 9) >>> 0;
    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = rotl(s[3], 11);
    return (result >>> 0) / 4294967296;
  };
}


// ============================================================================
// CORE BATTLE SIMULATION
// ============================================================================

const ATTACK_ORDER = ["Infantry", "Cavalry", "Archer"];
const LINE_ORDER   = ["Infantry", "Cavalry", "Archer"];

function getFrontLine(troops) {
  for (const line of LINE_ORDER) {
    if (troops[line] > 0) return line;
  }
  return null;
}

/**
 * Resolve one side's attacks for a single round.
 *
 * Round rules:
 *  - Both sides snapshot their troop counts at round start. The attacker's
 *    √attackerCount uses the snapshot, so attacker order within a side does
 *    not change the damage output of any individual type.
 *  - Targeting priority is computed ONCE per round from the enemy's round-start
 *    snapshot: Infantry first, then Cavalry (only if snapshot had zero Inf),
 *    then Archer (only if snapshot had zero Inf and zero Cav). All attackers on
 *    that side this round share this single primary target.
 *  - Attackers resolve sequentially within a side (Inf → Cav → Arch). Kills
 *    from earlier types reduce the defender's working count, which caps the
 *    later types' kill output against the same target. If an earlier type
 *    fully wipes the primary, later types DO NOT retarget — they simply skip
 *    their attack this round. The next round's fresh snapshot will shift the
 *    primary if needed.
 *  - Cavalry has one exception: 20% of cavalry (by snapshot count) always dive
 *    to archers regardless of the primary target. Their kill ceiling uses the
 *    archers' working count so dives don't over-kill.
 *
 * enemySnapshot is read-only (for targeting). enemyWorking is mutated in place
 * to reflect cumulative kills within this round (used as per-target kill
 * ceilings). The caller diffs enemyWorking against enemySnapshot (or just uses
 * enemyWorking as the defender's remaining count) to apply losses at end of
 * round.
 */
function resolveOneSide(
  attackerSnapshot, attackerCombat,
  enemySnapshot, enemyWorking, enemyCombat,
  skillMod, tg3Enabled, rng
) {
  const log = {
    Infantry: { main: 0, target: null },
    Cavalry:  { main: 0, dive: 0, mainTarget: null, diveTarget: "Archer" },
    Archer:   { main: 0, target: null, volleyProc: false },
    tg3Procs: { shieldForge: false, arrowForge: false, lanceForge: false },
  };

  let shieldForgeActive = false;
  let arrowForgeActive  = false;
  let lanceForgeActive  = false;

  if (tg3Enabled) {
    shieldForgeActive = rng() < TG3_ABILITIES.shieldForge.chance;
    arrowForgeActive  = rng() < TG3_ABILITIES.arrowForge.chance;
    lanceForgeActive  = rng() < TG3_ABILITIES.lanceForge.chance;
    log.tg3Procs = { shieldForge: shieldForgeActive, arrowForge: arrowForgeActive, lanceForge: lanceForgeActive };
  }

  // Primary target fixed for the whole round from the enemy snapshot.
  const primaryTarget = getFrontLine(enemySnapshot);

  for (const attackerType of ATTACK_ORDER) {
    const attackerCount = attackerSnapshot[attackerType];
    if (attackerCount <= 0) continue;

    const aStats = attackerCombat[attackerType];

    if (attackerType === "Cavalry") {
      // 80% main body targets the primary; 20% divers always go for archers.
      const diverCount = Math.floor(attackerCount * TROOP_ABILITIES.ambusher.value);
      const mainCount  = attackerCount - diverCount;

      // Main body only attacks if the primary still has targets this round.
      if (primaryTarget && mainCount > 0 && enemyWorking[primaryTarget] > 0) {
        const dStats = enemyCombat[primaryTarget];
        let abilityMod = getInnateDamageMod("Cavalry", primaryTarget);
        const defMod = getInnateDefenseMod(primaryTarget, "Cavalry");
        const adjustedDefense = { ...dStats, DEF: dStats.DEF * defMod };

        if (lanceForgeActive) abilityMod *= (1 + TG3_ABILITIES.lanceForge.value);

        let shieldMod = 1.0;
        if (shieldForgeActive && primaryTarget === "Infantry") {
          shieldMod = 1 - TG3_ABILITIES.shieldForge.value;
        }

        const kills = calcKills(mainCount, aStats, adjustedDefense, skillMod * shieldMod, abilityMod, enemyWorking[primaryTarget]);
        enemyWorking[primaryTarget] -= kills;
        log.Cavalry.main = kills;
        log.Cavalry.mainTarget = primaryTarget;
      }

      // Divers fire independently against archers every round.
      if (diverCount > 0 && enemyWorking.Archer > 0) {
        const dStats = enemyCombat.Archer;
        let abilityMod = getInnateDamageMod("Cavalry", "Archer");
        if (lanceForgeActive) abilityMod *= (1 + TG3_ABILITIES.lanceForge.value);

        const diveKills = calcKills(diverCount, aStats, dStats, skillMod, abilityMod, enemyWorking.Archer);
        enemyWorking.Archer -= diveKills;
        log.Cavalry.dive = diveKills;
      }

    } else {
      // Infantry & Archer attack the snapshot-determined primary only. If an
      // earlier type wiped it mid-round, they skip this round (no retarget).
      if (!primaryTarget || enemyWorking[primaryTarget] <= 0) continue;

      const dStats = enemyCombat[primaryTarget];
      let abilityMod = getInnateDamageMod(attackerType, primaryTarget);
      const defMod = getInnateDefenseMod(primaryTarget, attackerType);
      const adjustedDefense = { ...dStats, DEF: dStats.DEF * defMod };

      let shieldMod = 1.0;
      if (shieldForgeActive && primaryTarget === "Infantry") {
        shieldMod = 1 - TG3_ABILITIES.shieldForge.value;
      }

      if (attackerType === "Archer" && arrowForgeActive) {
        abilityMod *= (1 + TG3_ABILITIES.arrowForge.value);
      }

      let kills = calcKills(attackerCount, aStats, adjustedDefense, skillMod * shieldMod, abilityMod, enemyWorking[primaryTarget]);

      let volleyProc = false;
      if (attackerType === "Archer" && rng() < TROOP_ABILITIES.volley.chance) {
        volleyProc = true;
        const remaining = enemyWorking[primaryTarget] - kills;
        if (remaining > 0) {
          const bonusKills = calcKills(attackerCount, aStats, adjustedDefense, skillMod * shieldMod, abilityMod, remaining);
          kills += bonusKills;
        }
      }

      enemyWorking[primaryTarget] -= kills;
      if (enemyWorking[primaryTarget] < 0) enemyWorking[primaryTarget] = 0;

      if (attackerType === "Infantry") {
        log.Infantry.main = kills;
        log.Infantry.target = primaryTarget;
      } else {
        log.Archer.main = kills;
        log.Archer.target = primaryTarget;
        log.Archer.volleyProc = volleyProc;
      }
    }
  }

  return log;
}


/**
 * Run a full battle simulation.
 */
export function simulateBattle(attackerArmy, defenderArmy, options = {}) {
  const {
    maxRounds = 200,
    seed = Date.now(),
    battleType = "cityAttack",
    detailedLog = false,
  } = options;

  const rng = createRng(seed);

  const aCombat = {};
  const dCombat = {};
  for (const type of ATTACK_ORDER) {
    aCombat[type] = getCombatStats(type, attackerArmy.troops[type].composition, attackerArmy.buffs);
    dCombat[type] = getCombatStats(type, defenderArmy.troops[type].composition, defenderArmy.buffs);
  }

  const attackerSkillMod = calcSkillMod(attackerArmy.skillMod, defenderArmy.skillMod);
  const defenderSkillMod = calcSkillMod(defenderArmy.skillMod, attackerArmy.skillMod);

  const aTroops = {
    Infantry: totalCount(attackerArmy.troops.Infantry.composition),
    Cavalry:  totalCount(attackerArmy.troops.Cavalry.composition),
    Archer:   totalCount(attackerArmy.troops.Archer.composition),
  };
  const dTroops = {
    Infantry: totalCount(defenderArmy.troops.Infantry.composition),
    Cavalry:  totalCount(defenderArmy.troops.Cavalry.composition),
    Archer:   totalCount(defenderArmy.troops.Archer.composition),
  };

  const startingAttacker = { ...aTroops };
  const startingDefender = { ...dTroops };

  const roundLogs = [];

  let round = 0;
  while (round < maxRounds) {
    round++;

    const aTotalBefore = aTroops.Infantry + aTroops.Cavalry + aTroops.Archer;
    const dTotalBefore = dTroops.Infantry + dTroops.Cavalry + dTroops.Archer;
    if (aTotalBefore <= 0 || dTotalBefore <= 0) break;

    const aSnapshot = { ...aTroops };
    const dSnapshot = { ...dTroops };

    // Simultaneous resolution: both sides attack using the SAME round-start
    // snapshots. Working copies track cumulative kills within the round so
    // earlier attacker types cap later types' kill output on the same target.
    const defenderAfter = { ...dSnapshot };
    const attackerLog = resolveOneSide(
      aSnapshot, aCombat,
      dSnapshot, defenderAfter, dCombat,
      attackerSkillMod, attackerArmy.tg3Enabled, rng
    );

    const attackerAfter = { ...aSnapshot };
    const defenderLog = resolveOneSide(
      dSnapshot, dCombat,
      aSnapshot, attackerAfter, aCombat,
      defenderSkillMod, defenderArmy.tg3Enabled, rng
    );

    for (const type of ATTACK_ORDER) {
      aTroops[type] = Math.max(0, attackerAfter[type]);
      dTroops[type] = Math.max(0, defenderAfter[type]);
    }

    if (detailedLog) {
      roundLogs.push({
        round,
        attacker: { actions: attackerLog, remaining: { ...aTroops } },
        defender: { actions: defenderLog, remaining: { ...dTroops } },
      });
    }
  }

  const aTotal = aTroops.Infantry + aTroops.Cavalry + aTroops.Archer;
  const dTotal = dTroops.Infantry + dTroops.Cavalry + dTroops.Archer;

  let winner;
  if (aTotal > 0 && dTotal <= 0) winner = "attacker";
  else if (dTotal > 0 && aTotal <= 0) winner = "defender";
  else if (aTotal <= 0 && dTotal <= 0) winner = "draw";
  else winner = "draw";

  const rates = CASUALTY_RATES[battleType] ?? CASUALTY_RATES.cityAttack;

  const attackerCasualties = {};
  const defenderCasualties = {};
  for (const type of ATTACK_ORDER) {
    const aLost = startingAttacker[type] - aTroops[type];
    attackerCasualties[type] = {
      total:   aLost,
      dead:    Math.floor(aLost * rates.dead),
      injured: Math.floor(aLost * rates.injured),
      light:   aLost - Math.floor(aLost * rates.dead) - Math.floor(aLost * rates.injured),
    };

    const dLost = startingDefender[type] - dTroops[type];
    defenderCasualties[type] = {
      total:   dLost,
      dead:    Math.floor(dLost * rates.dead),
      injured: Math.floor(dLost * rates.injured),
      light:   dLost - Math.floor(dLost * rates.dead) - Math.floor(dLost * rates.injured),
    };
  }

  return {
    winner,
    rounds: round,
    seed,
    attacker: {
      starting:   startingAttacker,
      remaining:  { ...aTroops },
      casualties: attackerCasualties,
      skillMod:   attackerSkillMod,
      combatStats: aCombat,
    },
    defender: {
      starting:   startingDefender,
      remaining:  { ...dTroops },
      casualties: defenderCasualties,
      skillMod:   defenderSkillMod,
      combatStats: dCombat,
    },
    ...(detailedLog ? { roundLogs } : {}),
  };
}


// ============================================================================
// BEAR TRAP SIMULATION
// ============================================================================

/**
 * Simulate a Bear Trap battle.
 *   - Fixed 10 rounds
 *   - Bear: 5000 infantry, DEF 10, HP 83.33 each
 *   - Bear deals no return damage
 *   - Bear level adds +5% ATK per level to your troops
 *   - Score = total damage dealt across all 10 rounds
 *   - Archers get +10% Ranged Strike (bear is Infantry)
 */
export function simulateBearTrap(army, options = {}) {
  const { bearLevel = 5, seed = Date.now() } = options;

  const rng = createRng(seed);
  const BEAR_ROUNDS = 10;
  const BEAR_DEFENSE = 10;
  const BEAR_HEALTH = 83.33;

  const bearAttackBonus = bearLevel * 0.05;

  const combatStats = {};
  for (const type of ATTACK_ORDER) {
    const base = aggregateBaseStats(type, army.troops[type].composition);
    const std = army.buffs.standard[type];
    const spc = army.buffs.special[type];
    combatStats[type] = {
      ATK:  applyBuffs(base.ATK,  std.ATK + bearAttackBonus, spc.ATK),
      Leth: applyBuffs(base.Leth, std.Leth, spc.Leth),
    };
  }

  const skillMod = calcSkillMod(army.skillMod, createSkillModProfile());

  let totalDamage = 0;
  const roundBreakdown = [];

  for (let round = 1; round <= BEAR_ROUNDS; round++) {
    let roundDamage = 0;

    for (const type of ATTACK_ORDER) {
      const troopCount = totalCount(army.troops[type].composition);
      if (troopCount <= 0) continue;

      const aStats = combatStats[type];
      let abilityMod = getInnateDamageMod(type, "Infantry"); // bear is infantry

      if (army.tg3Enabled) {
        if (type === "Archer" && rng() < TG3_ABILITIES.arrowForge.chance) {
          abilityMod *= (1 + TG3_ABILITIES.arrowForge.value);
        }
        if (type === "Cavalry" && rng() < TG3_ABILITIES.lanceForge.chance) {
          abilityMod *= (1 + TG3_ABILITIES.lanceForge.value);
        }
      }

      const rawDamage = Math.sqrt(troopCount)
        * (aStats.ATK * aStats.Leth)
        / (BEAR_DEFENSE * BEAR_HEALTH)
        * skillMod
        * abilityMod;

      let volleyDamage = 0;
      if (type === "Archer" && rng() < TROOP_ABILITIES.volley.chance) {
        volleyDamage = rawDamage;
      }

      const typeDamage = rawDamage + volleyDamage;
      roundDamage += typeDamage;

      roundBreakdown.push({ round, troopType: type, damage: typeDamage, volleyProc: volleyDamage > 0 });
    }

    totalDamage += roundDamage;
  }

  return {
    totalDamage: Math.floor(totalDamage),
    rounds: BEAR_ROUNDS,
    bearLevel,
    seed,
    combatStats,
    skillMod,
    roundBreakdown,
  };
}


// ============================================================================
// MONTE CARLO
// ============================================================================

/**
 * Run multiple battle simulations with different seeds.
 * Useful for smoothing RNG variance (Volley, TG3 procs).
 */
export function monteCarloSim(attackerArmy, defenderArmy, options = {}) {
  const { iterations = 100, battleType = "cityAttack", maxRounds = 500 } = options;

  let attackerWins = 0;
  let defenderWins = 0;
  let draws = 0;
  let totalRounds = 0;

  const attackerLossAccum = { Infantry: 0, Cavalry: 0, Archer: 0 };
  const defenderLossAccum = { Infantry: 0, Cavalry: 0, Archer: 0 };

  for (let i = 0; i < iterations; i++) {
    const result = simulateBattle(attackerArmy, defenderArmy, {
      seed: i * 7919 + 42,
      battleType,
      maxRounds,
      detailedLog: false,
    });

    if (result.winner === "attacker") attackerWins++;
    else if (result.winner === "defender") defenderWins++;
    else draws++;

    totalRounds += result.rounds;

    for (const type of ATTACK_ORDER) {
      attackerLossAccum[type] += result.attacker.casualties[type].total;
      defenderLossAccum[type] += result.defender.casualties[type].total;
    }
  }

  return {
    iterations,
    attackerWinRate: attackerWins / iterations,
    defenderWinRate: defenderWins / iterations,
    drawRate: draws / iterations,
    avgRounds: totalRounds / iterations,
    avgAttackerLosses: {
      Infantry: Math.round(attackerLossAccum.Infantry / iterations),
      Cavalry:  Math.round(attackerLossAccum.Cavalry / iterations),
      Archer:   Math.round(attackerLossAccum.Archer / iterations),
    },
    avgDefenderLosses: {
      Infantry: Math.round(defenderLossAccum.Infantry / iterations),
      Cavalry:  Math.round(defenderLossAccum.Cavalry / iterations),
      Archer:   Math.round(defenderLossAccum.Archer / iterations),
    },
  };
}


// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

/** Standard 50/20/30 Inf/Cav/Arch formation. */
export function createStandardArmy(totalTroops, tier = 10, overrides = {}) {
  return createArmy({
    Infantry: { count: Math.floor(totalTroops * 0.50), tier },
    Cavalry:  { count: Math.floor(totalTroops * 0.20), tier },
    Archer:   { count: Math.floor(totalTroops * 0.30), tier },
    ...overrides,
  });
}

/** Bear Hunt 10/10/80 formation. */
export function createBearArmy(totalTroops, tier = 10, overrides = {}) {
  return createArmy({
    Infantry: { count: Math.floor(totalTroops * 0.10), tier },
    Cavalry:  { count: Math.floor(totalTroops * 0.10), tier },
    Archer:   { count: Math.floor(totalTroops * 0.80), tier },
    ...overrides,
  });
}
