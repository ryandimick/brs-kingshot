// ═══════════════════════════════════════════
// HERO DATABASE — from kingshot-hero-data.js (April 2026)
// Sources: kingshotwiki.com, kingshotdata.com, kingshothandbook.com,
//          kingshotguides.com, ldshop.gg, allclash.com
// ═══════════════════════════════════════════

export const HERO_DB = [
  // ── GENERATION 1 ──
  {
    name: "Amadeus", gen: 1, rarity: "Mythic", type: "Infantry",
    baseStats: { ATK: 2128, DEF: 2220, HP: 41624 },
    expeditionBonus: { ATK: 260.2, DEF: 260.2 },
    expeditionSkills: [
      { name: "Battle Ready", desc: "Squads' Lethality", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
      { name: "Way of the Blade", desc: "Squads' Attack", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
      { name: "Unrighteous Strike", desc: "Chance +50% damage", type: "chance", cat: "DamageUp", op: null, procChance: [8,16,24,32,40], magnitude: 50 },
    ],
    talent: { name: "Born Leader", desc: "Lethality and Health for all deployed", values: [3,6,9,12,15], stats: ["Leth","HP"] },
    hasWidget: true, widgetType: "offense",
    widget: { name: "Aegis of Fate", expeditionStats: { Leth: 62.5, HP: 62.5 },
      skill: { name: "Discernment", mode: "rally", desc: "Rally Attack", values: [5,7.5,10,12.5,15] } },
  },
  {
    name: "Helga", gen: 1, rarity: "Mythic", type: "Infantry",
    baseStats: { ATK: 1873, DEF: 2220, HP: 36630 },
    expeditionBonus: { ATK: 200.16, DEF: 200.16 },
    expeditionSkills: [
      { name: "Oath of Guardian", desc: "Chance -50% damage taken", type: "chance", cat: "DefenseUp", op: null, procChance: [8,16,24,32,40], magnitude: 50 },
      { name: "Echoes of Valhalla", desc: "Squads' Attack", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
      { name: "Nature's Balance", desc: "Squads' Lethality", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
    ],
    talent: { name: "Power of the Deer", desc: "Attack and Defense for all deployed", values: [2,4,6,8,10], stats: ["ATK","DEF"] },
    hasWidget: true, widgetType: "offense",
    widget: { name: "Bands of Tyre", expeditionStats: { Leth: 55.5, HP: 55.5 },
      skill: { name: "Zeal", mode: "rally", desc: "Rally Troops Lethality", values: [5,7.5,10,12.5,15] } },
  },
  {
    name: "Jabel", gen: 1, rarity: "Mythic", type: "Cavalry",
    baseStats: { ATK: 2220, DEF: 2220, HP: 22200 },
    expeditionBonus: { ATK: 200.16, DEF: 200.16 },
    expeditionSkills: [
      { name: "Crimson Guard", desc: "Chance -50% damage taken", type: "chance", cat: "DefenseUp", op: null, procChance: [8,16,24,32,40], magnitude: 50 },
      { name: "Knight's Valor", desc: "Chance +dmg on attack", type: "chance", cat: "DamageUp", op: null, procChance: [50,50,50,50,50], magnitude: [10,20,30,40,50] },
      { name: "Paladin's Resolve", desc: "Squads' Lethality", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
    ],
    talent: null,
    hasWidget: true, widgetType: "defense",
    widget: { name: "Greaves of Faith", expeditionStats: { Leth: 55.5, HP: 55.5 },
      skill: { name: "Steadfast Faith", mode: "defender", desc: "Defender Troops' Lethality", values: [5,7.5,10,12.5,15] } },
  },
  {
    name: "Saul", gen: 1, rarity: "Mythic", type: "Archer",
    baseStats: { ATK: 2220, DEF: 2220, HP: 22200 },
    expeditionBonus: { ATK: 200.16, DEF: 200.16 },
    expeditionSkills: [
      { name: "Positional Batter", desc: "Squads' Defense and Health (DUAL)", type: "flat", cat: "DefenseUp", op: 112, op2: 113, values: [15,15,15,15,15], values2: [10,10,10,10,10], dualOp: true },
      { name: "Resourceful", desc: "Construction speed (GROWTH)", type: "growth", cat: "none", op: null, values: [3,6,9,12,15], combatRelevant: false },
      { name: "Battle Cry", desc: "Squads' Lethality", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
    ],
    talent: null,
    hasWidget: true, widgetType: "defense",
    widget: { name: "Saul's Exclusive", expeditionStats: { Leth: 55.5, HP: 55.5 },
      skill: { name: "Garrison Skill", mode: "defender", desc: "Defender Squads' stats", values: [5,7.5,10,12.5,15] } },
  },

  // ── GENERATION 2 ──
  {
    name: "Zoe", gen: 2, rarity: "Mythic", type: "Infantry",
    baseStats: { ATK: 2043, DEF: 2664, HP: 49950 },
    expeditionBonus: { ATK: 240.24, DEF: 240.24 },
    expeditionSkills: [
      { name: "Sundering Wound", desc: "Chance +50% damage per attack", type: "chance", cat: "DamageUp", op: null, procChance: [10,20,30,40,50], magnitude: 50 },
      { name: "Stoic", desc: "Squads' Health", type: "flat", cat: "DefenseUp", op: 113, values: [5,10,15,20,25] },
      { name: "Infinite Arsenal", desc: "Chance -50% enemy Attack", type: "chance", cat: "OppDamageDown", op: null, procChance: [10,20,30,40,50], magnitude: 50 },
    ],
    talent: null,
    hasWidget: true, widgetType: "defense",
    widget: { name: "Zoe's Exclusive", expeditionStats: { Leth: 60.0, HP: 60.0 },
      skill: { name: "Defender Skill", mode: "defender", desc: "Defender Squads' Health", values: [5,7.5,10,12.5,15] } },
  },
  {
    name: "Hilde", gen: 2, rarity: "Mythic", type: "Cavalry",
    baseStats: { ATK: 2664, DEF: 2664, HP: 26640 },
    expeditionBonus: { ATK: 240.24, DEF: 240.24 },
    expeditionSkills: [
      { name: "Noble Path", desc: "Attack and Defense (DUAL)", type: "flat", cat: "DamageUp", op: 102, op2: 112, values: [15,15,15,15,15], values2: [10,10,10,10,10], dualOp: true },
      { name: "Elixir of Strength", desc: "Chance +200% damage", type: "chance", cat: "DamageUp", op: null, procChance: [5,10,15,20,25], magnitude: [120,140,160,180,200] },
      { name: "Trial by Fire", desc: "Chance -50% damage taken", type: "chance", cat: "DefenseUp", op: null, procChance: [8,16,24,32,40], magnitude: 50 },
    ],
    talent: null,
    hasWidget: true, widgetType: "offense",
    widget: { name: "Holy Invocation", expeditionStats: { Leth: 60.0, HP: 60.0 },
      skill: { name: "Fortitude", mode: "defender", desc: "Defender Squads' Health", values: [5,7.5,10,12.5,15] } },
  },
  {
    name: "Marlin", gen: 2, rarity: "Mythic", type: "Archer",
    baseStats: { ATK: 2664, DEF: 2043, HP: 26640 },
    expeditionBonus: { ATK: 240.24, DEF: 240.24 },
    expeditionSkills: [
      { name: "Wild Card", desc: "Chance +50% damage", type: "chance", cat: "DamageUp", op: null, procChance: [8,16,24,32,40], magnitude: 50 },
      { name: "Rumhead", desc: "Chance -50% enemy Lethality", type: "chance", cat: "OppDamageDown", op: null, procChance: [4,8,12,16,20], magnitude: 50 },
      { name: "Dynamo", desc: "Chance +50% damage on attack", type: "chance", cat: "DamageUp", op: null, procChance: [10,20,30,40,50], magnitude: 50 },
    ],
    talent: null,
    hasWidget: true, widgetType: "offense",
    widget: { name: "Admiral's Coat", expeditionStats: { Leth: 60.0, HP: 60.0 },
      skill: { name: "Admiral of the Line", mode: "rally", desc: "Rally Squads' Lethality", values: [5,7.5,10,12.5,15] } },
  },

  // ── GENERATION 3 ──
  {
    name: "Eric", gen: 3, rarity: "Mythic", type: "Infantry",
    baseStats: { ATK: 2445, DEF: 3180, HP: 49950 },
    expeditionBonus: { ATK: 280.28, DEF: 280.28 },
    expeditionSkills: [
      { name: "Exhortation", desc: "Squads' Health", type: "flat", cat: "DefenseUp", op: 113, values: [5,10,15,20,25] },
      { name: "Conviction", desc: "Reduces damage taken", type: "flat", cat: "OppDamageDown", op: 202, values: [4,8,12,16,20] },
      { name: "Courage", desc: "Squads' Attack", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
    ],
    talent: null,
    hasWidget: true, widgetType: "defense",
    widget: { name: "Eric's Exclusive", expeditionStats: { Leth: 65.0, HP: 65.0 },
      skill: { name: "Defender Skill", mode: "defender", desc: "Defender Squads' stats", values: [5,7.5,10,12.5,15] } },
  },
  {
    name: "Petra", gen: 3, rarity: "Mythic", type: "Cavalry",
    baseStats: { ATK: 3180, DEF: 3180, HP: 31800 },
    expeditionBonus: { ATK: 280.28, DEF: 280.28 },
    expeditionSkills: [
      { name: "Change of Fortune", desc: "Chance +50% Attack", type: "chance", cat: "DamageUp", op: null, procChance: [10,20,30,40,50], magnitude: 50 },
      { name: "The Shield", desc: "Chance -50% damage taken", type: "chance", cat: "DefenseUp", op: null, procChance: [8,16,24,32,40], magnitude: 50 },
      { name: "Dichotomy", desc: "Squads' Lethality", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
    ],
    talent: null,
    hasWidget: true, widgetType: "offense",
    widget: { name: "Petra's Exclusive", expeditionStats: { Leth: 65.0, HP: 65.0 },
      skill: { name: "Rally Skill", mode: "rally", desc: "Rally Squads' Lethality", values: [5,7.5,10,12.5,15] } },
  },
  {
    name: "Jaeger", gen: 3, rarity: "Mythic", type: "Archer",
    baseStats: { ATK: 3180, DEF: 2445, HP: 31800 },
    expeditionBonus: { ATK: 280.28, DEF: 280.28 },
    expeditionSkills: [
      { name: "The Tempest", desc: "Chance +40% damage for 3 turns", type: "chance", cat: "DamageUp", op: null, procChance: [4,8,12,16,20], magnitude: 40 },
      { name: "The Resistance", desc: "Chance -50% enemy Lethality", type: "chance", cat: "OppDamageDown", op: null, procChance: [4,8,12,16,20], magnitude: 50 },
      { name: "The Celebration", desc: "Squads' Health", type: "flat", cat: "DefenseUp", op: 113, values: [5,10,15,20,25] },
    ],
    talent: null,
    hasWidget: true, widgetType: "defense",
    widget: { name: "Wanderwail", expeditionStats: { Leth: 65.0, HP: 65.0 },
      skill: { name: "Defender Skill", mode: "defender", desc: "Defender Squads' Health", values: [5,7.5,10,12.5,15] } },
  },

  // ── GENERATION 4 ──
  {
    name: "Alcar", gen: 4, rarity: "Mythic", type: "Infantry",
    baseStats: { ATK: 2928, DEF: 3780, HP: 59580 },
    expeditionBonus: { ATK: 320.32, DEF: 320.32 },
    expeditionSkills: [
      { name: "Shield Wall", desc: "Inf/Arch damage reduction", type: "conditional", cat: "DefenseUp", op: 112, values: [14,28,42,56,70], troopRestriction: ["Infantry","Archer"] },
      { name: "Praetorian Fury", desc: "Infantry damage dealt", type: "flat", cat: "DamageUp", op: 101, values: [20,40,60,80,100], troopRestriction: ["Infantry"] },
      { name: "Exploit Weakness", desc: "Infantry damage + enemy takes more", type: "flat", cat: "DamageUp", op: 101, values: [12,24,36,48,60], troopRestriction: ["Infantry"] },
    ],
    talent: { name: "Glorious Mark", desc: "Friendly Squads' Attack", values: [3,6,9,12,15], stats: ["ATK"] },
    hasWidget: true, widgetType: "defense",
    widget: { name: "Alcar's Exclusive", expeditionStats: { Leth: 70.0, HP: 70.0 },
      skill: { name: "Defender Skill", mode: "defender", desc: "Defender Squads' stats", values: [5,7.5,10,12.5,15] } },
  },
  {
    name: "Margot", gen: 4, rarity: "Mythic", type: "Cavalry",
    baseStats: { ATK: 3780, DEF: 3780, HP: 37800 },
    expeditionBonus: { ATK: 320.32, DEF: 320.32 },
    expeditionSkills: [
      { name: "Dual Blades", desc: "Chance for second attack", type: "chance", cat: "DamageUp", op: null, procChance: [8,16,24,32,40], magnitude: 100 },
      { name: "Parry", desc: "Chance to dodge all damage", type: "chance", cat: "DefenseUp", op: null, procChance: [5,10,15,20,25], magnitude: 100 },
      { name: "Reckless Swords", desc: "Defender Squads' Lethality", type: "flat", cat: "DamageUp", op: 102, values: [5,10,15,20,25] },
    ],
    talent: null,
    hasWidget: true, widgetType: "defense",
    widget: { name: "Margot's Exclusive", expeditionStats: { Leth: 70.0, HP: 70.0 },
      skill: { name: "Defender Skill", mode: "defender", desc: "Defender Squads' stats", values: [5,7.5,10,12.5,15] } },
  },
  {
    name: "Rosa", gen: 4, rarity: "Mythic", type: "Archer",
    baseStats: { ATK: 3780, DEF: 2928, HP: 37800 },
    expeditionBonus: { ATK: 320.32, DEF: 320.32 },
    expeditionSkills: [
      { name: "Cleansing Dance", desc: "Clears debuffs + Squads' Attack", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
      { name: "Distraction", desc: "Reduces enemy Attack Speed", type: "flat", cat: "OppDamageDown", op: null, values: [10,20,30,40,50] },
      { name: "Rose's Thorn", desc: "Squads' Health", type: "flat", cat: "DefenseUp", op: 113, values: [5,10,15,20,25] },
    ],
    talent: null,
    hasWidget: true, widgetType: "offense",
    widget: { name: "Rosa's Exclusive", expeditionStats: { Leth: 70.0, HP: 70.0 },
      skill: { name: "Rally Skill", mode: "rally", desc: "Rally Squads' Lethality", values: [5,7.5,10,12.5,15] } },
  },

  // ── GENERATION 5 ──
  {
    name: "Long Fei", gen: 5, rarity: "Mythic", type: "Infantry",
    baseStats: { ATK: 3780, DEF: 4928, HP: 73926 },
    expeditionBonus: { ATK: 360.36, DEF: 360.36 },
    expeditionSkills: [
      { name: "Unyielding Spirit", desc: "Squads' Defense", type: "flat", cat: "DefenseUp", op: 112, values: [5,10,15,20,25] },
      { name: "Iron Bastion", desc: "Reduces damage taken", type: "flat", cat: "DefenseUp", op: 113, values: [5,10,15,20,25] },
      { name: "Commander's Aura", desc: "Squads' Attack", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
    ],
    talent: null,
    hasWidget: true, widgetType: "defense",
    widget: { name: "Long Fei's Exclusive", expeditionStats: { Leth: 75.0, HP: 75.0 },
      skill: { name: "Defender Skill", mode: "defender", desc: "Defender Squads' stats", values: [5,7.5,10,12.5,15] } },
  },
  {
    name: "Thrud", gen: 5, rarity: "Mythic", type: "Cavalry",
    baseStats: { ATK: 4928, DEF: 4928, HP: 49284 },
    expeditionBonus: { ATK: 360.36, DEF: 360.36 },
    expeditionSkills: [
      { name: "Battle Hunger", desc: "Inf/Arch -15% dmg taken +15% dmg dealt", type: "flat", cat: "DamageUp", op: 101, values: [3,6,9,12,15], troopRestriction: ["Infantry","Archer"] },
      { name: "Reckless Charge", desc: "Cavalry chance +100% damage", type: "chance", cat: "DamageUp", op: null, procChance: [4,8,12,16,20], magnitude: 100, troopRestriction: ["Cavalry"] },
      { name: "Ancestral Guidance", desc: "Every 4 cav attacks +25% dmg/-25% taken", type: "conditional", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
    ],
    talent: null,
    hasWidget: true, widgetType: "offense",
    widget: { name: "Bloodfang", expeditionStats: { Leth: 75.0, HP: 75.0 },
      skill: { name: "Rally Lethality", mode: "rally", desc: "Rally Squads' Lethality", values: [5,7.5,10,12.5,15] } },
  },
  {
    name: "Vivian", gen: 5, rarity: "Mythic", type: "Archer",
    baseStats: { ATK: 4928, DEF: 3780, HP: 49284 },
    expeditionBonus: { ATK: 360.36, DEF: 360.36 },
    expeditionSkills: [
      { name: "Crouching Tiger", desc: "+enemy damage taken", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
      { name: "Focus Fire", desc: "Squads' damage systematically", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
      { name: "Feast of the Pack", desc: "Squads' attack", type: "flat", cat: "DamageUp", op: 102, values: [5,10,15,20,25] },
    ],
    talent: null,
    hasWidget: true, widgetType: "offense",
    widget: { name: "Vivian's Exclusive", expeditionStats: { Leth: 75.0, HP: 75.0 },
      skill: { name: "Rally Skill", mode: "rally", desc: "Rally Squads' Lethality", values: [5,7.5,10,12.5,15] } },
  },

  // ── GENERATION 6 (preliminary) ──
  {
    name: "Triton", gen: 6, rarity: "Mythic", type: "Infantry",
    baseStats: { ATK: 4500, DEF: 5900, HP: 88000 },
    expeditionBonus: { ATK: 400.0, DEF: 400.0 },
    expeditionSkills: [
      { name: "Tidal Defense", desc: "Squads' Defense", type: "flat", cat: "DefenseUp", op: 112, values: [5,10,15,20,25] },
      { name: "Squad Skill Damage", desc: "Squads' skill damage", type: "flat", cat: "DamageUp", op: 101, values: [6,12,18,24,30] },
      { name: "Tidal Health", desc: "Squads' Health", type: "flat", cat: "DefenseUp", op: 113, values: [6,12,18,24,30] },
    ],
    talent: null,
    hasWidget: true, widgetType: "defense",
    widget: { name: "Triton's Exclusive", expeditionStats: { Leth: 80.0, HP: 80.0 },
      skill: { name: "Defender Skill", mode: "defender", desc: "Defender stat boost", values: [5,7.5,10,12.5,15] } },
  },
  {
    name: "Sophia", gen: 6, rarity: "Mythic", type: "Cavalry",
    baseStats: { ATK: 5900, DEF: 5900, HP: 59000 },
    expeditionBonus: { ATK: 400.0, DEF: 400.0 },
    expeditionSkills: [
      { name: "Puppet Master", desc: "+enemy damage taken", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
      { name: "Confusion", desc: "Reduces enemy Attack", type: "chance", cat: "OppDamageDown", op: 201, procChance: [8,16,24,32,40], magnitude: 50 },
      { name: "Dark Pact", desc: "Scales damage on debuffs", type: "conditional", cat: "DamageUp", op: null, values: [5,10,15,20,25] },
    ],
    talent: null,
    hasWidget: true, widgetType: "offense",
    widget: { name: "Sophia's Exclusive", expeditionStats: { Leth: 80.0, HP: 80.0 },
      skill: { name: "Rally Skill", mode: "rally", desc: "TBD", values: [5,7.5,10,12.5,15] } },
  },
  {
    name: "Yang", gen: 6, rarity: "Mythic", type: "Archer",
    baseStats: { ATK: 5900, DEF: 4500, HP: 59000 },
    expeditionBonus: { ATK: 400.0, DEF: 400.0 },
    expeditionSkills: [
      { name: "Avalanche", desc: "Additional attack per attack", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
      { name: "Deadshot", desc: "Critical hit rate", type: "flat", cat: "DamageUp", op: null, values: [3,6,9,12,15] },
      { name: "Combo", desc: "Chance for extra round", type: "chance", cat: "DamageUp", op: null, procChance: [7,14,21,28,35], magnitude: 100 },
    ],
    talent: null,
    hasWidget: true, widgetType: "offense",
    widget: { name: "Yang's Exclusive", expeditionStats: { Leth: 80.0, HP: 80.0 },
      skill: { name: "Rally Skill", mode: "rally", desc: "Rally stat boost", values: [5,7.5,10,12.5,15] } },
  },

  // ── EPIC HEROES (no widgets, 2 expedition skills) ──
  {
    name: "Chenko", gen: 1, rarity: "Epic", type: "Archer",
    baseStats: null, expeditionBonus: null,
    expeditionSkills: [
      { name: "Stand of Arms", desc: "Squads' Lethality", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
      { name: "Quick Draw", desc: "March speed", type: "growth", cat: "none", op: null, values: [10,20,30,40,50], combatRelevant: false },
    ],
    talent: null, hasWidget: false, widget: null,
  },
  {
    name: "Yeonwoo", gen: 2, rarity: "Epic", type: "Archer",
    baseStats: null, expeditionBonus: null,
    expeditionSkills: [
      { name: "Precision Shot", desc: "Squads' Lethality", type: "flat", cat: "DamageUp", op: 101, values: [5,10,15,20,25] },
    ],
    talent: null, hasWidget: false, widget: null,
  },
  {
    name: "Amane", gen: 2, rarity: "Epic", type: "Cavalry",
    baseStats: null, expeditionBonus: null,
    expeditionSkills: [
      { name: "Blade Dance", desc: "Squads' Attack", type: "flat", cat: "DamageUp", op: 102, values: [5,10,15,20,25] },
    ],
    talent: null, hasWidget: false, widget: null,
  },
  {
    name: "Gordon", gen: 1, rarity: "Epic", type: "Infantry",
    baseStats: null, expeditionBonus: null,
    expeditionSkills: [
      { name: "Fortify", desc: "Squads' Health", type: "flat", cat: "DefenseUp", op: 113, values: [5,10,15,20,25] },
    ],
    talent: null, hasWidget: false, widget: null,
  },
  {
    name: "Howard", gen: 1, rarity: "Epic", type: "Infantry",
    baseStats: null, expeditionBonus: null,
    expeditionSkills: [
      { name: "Bulwark", desc: "Damage Reduction", type: "flat", cat: "DefenseUp", op: 111, values: [4,8,12,16,20] },
    ],
    talent: null, hasWidget: false, widget: null,
  },
  {
    name: "Quinn", gen: 1, rarity: "Epic", type: "Archer",
    baseStats: null, expeditionBonus: null,
    expeditionSkills: [
      { name: "Shield Arrow", desc: "Damage Reduction", type: "flat", cat: "DefenseUp", op: 111, values: [4,8,12,16,20] },
    ],
    talent: null, hasWidget: false, widget: null,
  },
  {
    name: "Fahd", gen: 2, rarity: "Epic", type: "Cavalry",
    baseStats: null, expeditionBonus: null,
    expeditionSkills: [
      { name: "Weaken", desc: "Enemy Damage reduction", type: "flat", cat: "OppDamageDown", op: 201, values: [4,8,12,16,20] },
    ],
    talent: null, hasWidget: false, widget: null,
  },
];

export const TROOP_TYPES = ["Infantry", "Cavalry", "Archer"];
export const STAT_NAMES = ["ATK", "Leth", "HP", "DEF"];

// Base stats now come from data/troop-base-stats.json via troop-base-stats.js —
// armies supply tier + TG-level composition and engines aggregate per-type.

// Widget level → fraction of max expedition stats (linear)
export const WIDGET_LEVEL_MULTIPLIER = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

// Widget level → widget skill level (every 2 widget levels = 1 skill level)
export const WIDGET_SKILL_LEVEL = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5];

// Star level → base stat multiplier (+10% per star)
export const STAR_MULTIPLIER = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5];
