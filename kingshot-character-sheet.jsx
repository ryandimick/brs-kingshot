import React, { useState, useEffect, useMemo, useCallback } from "react";

// ═══════════════════════════════════════════
// HERO DATABASE — effect_op codes from community research
// ═══════════════════════════════════════════
const HERO_DB = [
  // ── DamageUp heroes (Offense Joiners) ──
  { name: "Chenko", gen: 1, rarity: "Epic", type: "Archer", skill1: { cat: "DamageUp", op: 101, pct: 25, label: "+25% Lethality" }, hasWidget: false },
  { name: "Amadeus", gen: 1, rarity: "Mythic", type: "Infantry", skill1: { cat: "DamageUp", op: 101, pct: 25, label: "+25% Lethality" }, hasWidget: true, widgetType: "offense" },
  { name: "Yeonwoo", gen: 2, rarity: "Epic", type: "Archer", skill1: { cat: "DamageUp", op: 101, pct: 25, label: "+25% Lethality" }, hasWidget: false },
  { name: "Amane", gen: 2, rarity: "Epic", type: "Cavalry", skill1: { cat: "DamageUp", op: 102, pct: 25, label: "+25% Attack" }, hasWidget: false },
  { name: "Margot", gen: 4, rarity: "Mythic", type: "Archer", skill1: { cat: "DamageUp", op: 102, pct: 25, label: "+25% Attack" }, hasWidget: true, widgetType: "offense" },
  { name: "Vivian", gen: 5, rarity: "Mythic", type: "Archer", skill1: { cat: "DamageUp", op: 101, pct: 25, label: "+25% Enemy Dmg Taken" }, hasWidget: true, widgetType: "offense" },
  // ── DefenseUp heroes (Defensive Joiners) ──
  { name: "Gordon", gen: 1, rarity: "Epic", type: "Infantry", skill1: { cat: "DefenseUp", op: 113, pct: 25, label: "+25% Health" }, hasWidget: false },
  { name: "Saul", gen: 1, rarity: "Mythic", type: "Infantry", skill1: { cat: "DefenseUp", op: 112, pct: 15, label: "+15% Defense", op2: 113, pct2: 10, label2: "+10% Health" }, hasWidget: true, widgetType: "defense", dualOp: true },
  { name: "Howard", gen: 1, rarity: "Epic", type: "Infantry", skill1: { cat: "DefenseUp", op: 111, pct: 20, label: "+20% Dmg Reduction" }, hasWidget: false },
  { name: "Quinn", gen: 1, rarity: "Epic", type: "Archer", skill1: { cat: "DefenseUp", op: 111, pct: 20, label: "+20% Dmg Reduction" }, hasWidget: false },
  // ── OppDamageDown heroes ──
  { name: "Fahd", gen: 2, rarity: "Epic", type: "Cavalry", skill1: { cat: "OppDamageDown", op: 201, pct: 20, label: "-20% Enemy Damage" }, hasWidget: false },
  { name: "Eric", gen: 1, rarity: "Epic", type: "Infantry", skill1: { cat: "OppDamageDown", op: 202, pct: 20, label: "-20% Enemy Damage" }, hasWidget: false },
  // ── Hybrid / Special heroes (leader-focused) ──
  { name: "Hilde", gen: 2, rarity: "Mythic", type: "Cavalry", skill1: { cat: "DamageUp", op: 102, pct: 15, label: "+15% Attack", catB: "DefenseUp", opB: 112, pctB: 10, labelB: "+10% Defense" }, hasWidget: true, widgetType: "offense", dualOp: true },
  { name: "Marlin", gen: 1, rarity: "Mythic", type: "Cavalry", skill1: { cat: "DamageUp", op: 101, pct: 20, label: "+20% Lethality" }, hasWidget: true, widgetType: "offense" },
  { name: "Petra", gen: 3, rarity: "Mythic", type: "Cavalry", skill1: { cat: "DamageUp", op: 101, pct: 20, label: "+20% Lethality (chance)" }, hasWidget: true, widgetType: "offense", chanceBased: true },
  { name: "Zoe", gen: 2, rarity: "Mythic", type: "Infantry", skill1: { cat: "DefenseUp", op: 113, pct: 20, label: "+20% Health" }, hasWidget: true, widgetType: "defense" },
  { name: "Jabel", gen: 1, rarity: "Mythic", type: "Cavalry", skill1: { cat: "DamageUp", op: 101, pct: 25, label: "+25% Lethality" }, hasWidget: true, widgetType: "offense" },
  { name: "Thrud", gen: 5, rarity: "Mythic", type: "Cavalry", skill1: { cat: "DamageUp", op: 101, pct: 25, label: "+25% Dmg (Inf/Arch only)" }, hasWidget: true, widgetType: "offense", troopRestriction: ["Infantry", "Archer"] },
  { name: "Rosa", gen: 4, rarity: "Mythic", type: "Infantry", skill1: { cat: "DefenseUp", op: 113, pct: 25, label: "+25% Health" }, hasWidget: true, widgetType: "defense" },
  { name: "Alcar", gen: 4, rarity: "Mythic", type: "Infantry", skill1: { cat: "DefenseUp", op: 112, pct: 25, label: "+25% Defense" }, hasWidget: true, widgetType: "defense" },
  { name: "Long Fei", gen: 5, rarity: "Mythic", type: "Infantry", skill1: { cat: "DefenseUp", op: 112, pct: 25, label: "+25% Defense" }, hasWidget: true, widgetType: "defense" },
  { name: "Jaeger", gen: 3, rarity: "Mythic", type: "Archer", skill1: { cat: "DefenseUp", op: 113, pct: 20, label: "+20% Health" }, hasWidget: true, widgetType: "defense" },
];

const TROOP_TYPES = ["Infantry", "Cavalry", "Archer"];
const STAT_NAMES = ["ATK", "Leth", "HP", "DEF"];
const BASE_STATS = {
  Infantry: { ATK: 243, Leth: 10, HP: 730, DEF: 10 },
  Cavalry: { ATK: 730, Leth: 10, HP: 243, DEF: 10 },
  Archer: { ATK: 974, Leth: 10, HP: 183, DEF: 10 },
};
const TROOP_WEIGHTS = { Infantry: 0.25, Cavalry: 0.20, Archer: 0.55 };

// ═══════════════════════════════════════════
// GOVERNOR GEAR & CHARM LOOKUP TABLES
// ═══════════════════════════════════════════
const GOV_GEAR_SLOTS = [
  { id: "helm", name: "Helm", icon: "\u{1F451}" },
  { id: "accessory", name: "Accessory", icon: "\u{1F4FF}" },
  { id: "armor", name: "Armor", icon: "\u{1F6E1}" },
  { id: "pants", name: "Pants", icon: "\u{1F45F}" },
  { id: "ring", name: "Ring", icon: "\u{1F48D}" },
  { id: "weapon", name: "Weapon", icon: "\u{1F5E1}" },
];

// Per-piece stat total at each tier level (from kingshot.net database)
const GOV_GEAR_TIERS = [
  { label: "None", total: 0 },
  { label: "Green", total: 9.35 },{ label: "Green \u2605", total: 12.75 },
  { label: "Blue", total: 17.0 },{ label: "Blue \u2605", total: 21.25 },{ label: "Blue \u2605\u2605", total: 25.5 },{ label: "Blue \u2605\u2605\u2605", total: 29.75 },
  { label: "Purple", total: 34.0 },{ label: "Purple \u2605", total: 36.89 },{ label: "Purple \u2605\u2605", total: 39.78 },{ label: "Purple \u2605\u2605\u2605", total: 42.67 },
  { label: "Purple T1", total: 45.56 },{ label: "Purple T1\u2605", total: 48.45 },{ label: "Purple T1\u2605\u2605", total: 51.34 },{ label: "Purple T1\u2605\u2605\u2605", total: 54.23 },
  { label: "Gold", total: 56.78 },{ label: "Gold \u2605", total: 59.33 },{ label: "Gold \u2605\u2605", total: 61.88 },{ label: "Gold \u2605\u2605\u2605", total: 64.43 },
  { label: "Gold T1", total: 66.98 },{ label: "Gold T1\u2605", total: 69.53 },{ label: "Gold T1\u2605\u2605", total: 72.08 },{ label: "Gold T1\u2605\u2605\u2605", total: 74.63 },
  { label: "Gold T2", total: 77.18 },{ label: "Gold T2\u2605", total: 79.73 },{ label: "Gold T2\u2605\u2605", total: 82.28 },{ label: "Gold T2\u2605\u2605\u2605", total: 84.83 },
  { label: "Gold T3", total: 87.38 },{ label: "Gold T3\u2605", total: 89.93 },{ label: "Gold T3\u2605\u2605", total: 92.48 },{ label: "Gold T3\u2605\u2605\u2605", total: 95.0 },
  { label: "Red", total: 97.5 },{ label: "Red \u2605", total: 100.0 },{ label: "Red \u2605\u2605", total: 102.5 },{ label: "Red \u2605\u2605\u2605", total: 105.0 },
];

// Set bonus: 3pc = DEF, 6pc = ATK. Tier name prefix -> bonus %
const GOV_GEAR_SET_BONUS = [
  { prefix: "None", bonus: 0 },{ prefix: "Green", bonus: 2.5 },{ prefix: "Blue", bonus: 4.5 },
  { prefix: "Purple T1", bonus: 6 },{ prefix: "Purple", bonus: 5 },
  { prefix: "Gold T3", bonus: 10 },{ prefix: "Gold T2", bonus: 9 },{ prefix: "Gold T1", bonus: 8 },{ prefix: "Gold", bonus: 7 },
  { prefix: "Red T1", bonus: 14 },{ prefix: "Red", bonus: 12 },
];

function getSetBonus(gearSlots) {
  // Find lowest tier among all 6 slots for set bonus calculation
  const indices = Object.values(gearSlots).map(v => v || 0);
  const minIdx = Math.min(...indices);
  if (minIdx <= 0) return { atk3: 0, def3: 0 };
  const tier = GOV_GEAR_TIERS[minIdx];
  if (!tier) return { atk3: 0, def3: 0 };
  // Find matching set bonus
  const lbl = tier.label;
  for (const sb of GOV_GEAR_SET_BONUS) {
    if (lbl.startsWith(sb.prefix) && sb.prefix !== "None") {
      const count6 = indices.filter(i => i >= minIdx).length;
      const count3 = count6 >= 3 ? 1 : 0;
      return { atk3: count6 >= 6 ? sb.bonus : 0, def3: count3 ? sb.bonus : 0 };
    }
  }
  return { atk3: 0, def3: 0 };
}

// Charm levels: each charm gives Leth or HP per troop type. 3 charms per gear slot.
// Total stat at each level (cumulative)
const CHARM_LEVELS = [
  { label: "Lv 0", total: 0 },
  { label: "Lv 1", total: 9 },{ label: "Lv 2", total: 12 },{ label: "Lv 3", total: 16 },
  { label: "Lv 4", total: 19 },{ label: "Lv 5", total: 25 },{ label: "Lv 6", total: 30 },
  { label: "Lv 7", total: 35 },{ label: "Lv 8", total: 40 },{ label: "Lv 9", total: 45 },
  { label: "Lv 10", total: 50 },{ label: "Lv 11", total: 55 },{ label: "Lv 12", total: 59 },
  { label: "Lv 13", total: 63 },{ label: "Lv 14", total: 67 },{ label: "Lv 15", total: 71 },
  { label: "Lv 16", total: 75 },{ label: "Lv 17", total: 79 },{ label: "Lv 18", total: 83 },
  { label: "Lv 19", total: 87 },{ label: "Lv 20", total: 91 },{ label: "Lv 21", total: 95 },
  { label: "Lv 22", total: 99 },
];

// Each gear slot has 3 charms. Each charm gives both Leth AND HP equally at its level.

// ═══════════════════════════════════════════
// STORAGE HELPERS
// ═══════════════════════════════════════════
const STORAGE_KEY = "kingshot-char-v1";

async function loadState() {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    return result ? JSON.parse(result.value) : null;
  } catch { return null; }
}

async function saveState(state) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { console.error("Save failed:", e); }
}

function defaultCharState() {
  return {
    name: "My Governor",
    research: { Infantry: { ATK: 0, Leth: 0, HP: 0, DEF: 0 }, Cavalry: { ATK: 0, Leth: 0, HP: 0, DEF: 0 }, Archer: { ATK: 0, Leth: 0, HP: 0, DEF: 0 } },
    // Governor gear: 6 slots, each stores a tier index into GOV_GEAR_TIERS
    govGearSlots: { helm: 0, accessory: 0, armor: 0, pants: 0, ring: 0, weapon: 0 },
    // Charms: 18 total (3 per gear slot), each stores a level index into CHARM_LEVELS
    // Keyed by troop type, then slot id, then charm index 0-2
    charmLevels: {
      Infantry: { helm: [0,0,0], accessory: [0,0,0], armor: [0,0,0], pants: [0,0,0], ring: [0,0,0], weapon: [0,0,0] },
      Cavalry: { helm: [0,0,0], accessory: [0,0,0], armor: [0,0,0], pants: [0,0,0], ring: [0,0,0], weapon: [0,0,0] },
      Archer: { helm: [0,0,0], accessory: [0,0,0], armor: [0,0,0], pants: [0,0,0], ring: [0,0,0], weapon: [0,0,0] },
    },
    heroGear: { Infantry: { Leth: 0, HP: 0 }, Cavalry: { Leth: 0, HP: 0 }, Archer: { Leth: 0, HP: 0 } },
    pets: { Leth: 0, HP: 0 },
    allianceTech: { ATK: 0, Leth: 0, HP: 0, DEF: 0 },
    skins: { ATK: 0, Leth: 0, HP: 0, DEF: 0 },
    heroes: {},
    troops: { Infantry: 90000, Cavalry: 36000, Archer: 54000 },
    leaderDU: 45,
    joinerSlots: ["Chenko", "Chenko", "Amane", "Amane"],
    marchHeroes: [
      { name: "", level: 1, stars: 0, gear: { helm: { enh: 0, mast: 0 }, gloves: { enh: 0, mast: 0 }, chest: { enh: 0, mast: 0 }, boots: { enh: 0, mast: 0 } }, widgetLv: 0, skills: [0, 0, 0] },
      { name: "", level: 1, stars: 0, gear: { helm: { enh: 0, mast: 0 }, gloves: { enh: 0, mast: 0 }, chest: { enh: 0, mast: 0 }, boots: { enh: 0, mast: 0 } }, widgetLv: 0, skills: [0, 0, 0] },
      { name: "", level: 1, stars: 0, gear: { helm: { enh: 0, mast: 0 }, gloves: { enh: 0, mast: 0 }, chest: { enh: 0, mast: 0 }, boots: { enh: 0, mast: 0 } }, widgetLv: 0, skills: [0, 0, 0] },
    ],
  };
}

// ═══════════════════════════════════════════
// MATH ENGINE
// ═══════════════════════════════════════════
function computeTotalBuffs(cs) {
  const totals = {};
  // Compute governor gear ATK/DEF from slot tiers
  let gearATK = 0, gearDEF = 0;
  const slots = cs.govGearSlots || {};
  for (const slotId of GOV_GEAR_SLOTS.map(s => s.id)) {
    const tierIdx = slots[slotId] || 0;
    const tier = GOV_GEAR_TIERS[tierIdx];
    if (tier) {
      // Each piece gives ATK and DEF equally (total stat applies to both)
      gearATK += tier.total;
      gearDEF += tier.total;
    }
  }
  // Add set bonuses
  const sb = getSetBonus(slots);
  gearATK += sb.atk3;
  gearDEF += sb.def3;
  // Average per piece (the stat column is per-piece, 6 pieces means we just sum them)
  // Actually the "total" column is cumulative per piece, so we just sum all 6 pieces' totals
  // Wait — re-reading the data: the "Total" column is the cumulative stat for ONE piece at that tier.
  // So 6 pieces at Gold★★★ = 6 × 64.43% = 386.58% ATK and DEF total? That seems too high.
  // Actually, governor gear gives a SHARED stat — it's NOT per piece additive to 6x.
  // The stat is applied once globally. Each piece contributes its stat to your total, but they're
  // meant to be read as: one piece at Gold★★★ gives +64.43% ATK and +64.43% DEF? No.
  // Re-reading: "Stat ↑" column shows the incremental gain, "Total" is cumulative.
  // The "Total" for one piece at a tier IS the per-piece contribution.
  // But wait, in-game gov gear: all 6 pieces share the same tier progression.
  // The stat table is for the ENTIRE gear set, not per-piece.
  // So Gold★★★ total = 64.43% ATK AND 64.43% DEF for the whole set.
  // That aligns with what we know — gov gear gives ATK+DEF.
  // But users upgrade individual pieces. Each piece at a tier contributes proportionally.
  // For simplicity: average the 6 pieces' tier totals. No — the table shows per-piece stats.
  // Looking at the data more carefully: Green gives +9.35% stat. That's for ONE piece.
  // 6 green pieces = 6 × 9.35 = 56.1%? That seems high for green.
  // Actually I think the table is for the WHOLE SET at that upgrade level.
  // "Tier & Level" progresses as you upgrade the whole set. So the total is for all 6 pieces combined.
  // Let's use it as: user picks a single tier for their whole set (they keep them balanced).
  // We'll use the HIGHEST tier among all 6 as the effective tier, since set bonus requires matched tiers.
  // Simplification: use the LOWEST tier piece's stat as the base (conservative).
  
  // REVISED: The table represents one gear piece's stat at that tier.
  // Total gov gear stat = sum of all 6 pieces' individual stats.
  // But that would give 6 × 64.43% = 386% at Gold★★★ which is too high.
  // Conclusion: the table is for the ENTIRE set, not per-piece. User picks overall tier.
  // Let's just use the min-tier piece's total as the whole set's stat.
  const pieceTierIndices = GOV_GEAR_SLOTS.map(s => slots[s.id] || 0);
  const minTierIdx = Math.min(...pieceTierIndices);
  const setTier = GOV_GEAR_TIERS[minTierIdx] || GOV_GEAR_TIERS[0];
  const govATK = setTier.total;
  const govDEF = setTier.total;
  // Set bonuses on top
  const setB = getSetBonus(slots);
  const totalGovATK = govATK + setB.atk3;
  const totalGovDEF = govDEF + setB.def3;

  // Compute charm Leth/HP per troop type — each charm gives both equally
  const charmStats = {};
  for (const t of TROOP_TYPES) {
    let charmTotal = 0;
    const tc = cs.charmLevels?.[t] || {};
    for (const slotId of GOV_GEAR_SLOTS.map(s => s.id)) {
      const slotCharms = tc[slotId] || [0, 0, 0];
      for (let ci = 0; ci < 3; ci++) {
        const lvlIdx = slotCharms[ci] || 0;
        const charmData = CHARM_LEVELS[lvlIdx] || CHARM_LEVELS[0];
        charmTotal += charmData.total;
      }
    }
    charmStats[t] = { Leth: charmTotal, HP: charmTotal };
  }

  for (const t of TROOP_TYPES) {
    totals[t] = { ATK: 0, Leth: 0, HP: 0, DEF: 0 };
    for (const s of STAT_NAMES) {
      totals[t][s] += cs.research[t]?.[s] || 0;
      totals[t][s] += cs.allianceTech?.[s] || 0;
      totals[t][s] += cs.skins?.[s] || 0;
    }
    totals[t].ATK += totalGovATK;
    totals[t].DEF += totalGovDEF;
    totals[t].Leth += charmStats[t].Leth + (cs.heroGear[t]?.Leth || 0) + (cs.pets?.Leth || 0);
    totals[t].HP += charmStats[t].HP + (cs.heroGear[t]?.HP || 0) + (cs.pets?.HP || 0);
  }
  return totals;
}

function eff(base, pct) { return base * (1 + pct / 100); }
function offProduct(base, buffs) { return eff(base.ATK, buffs.ATK) * eff(base.Leth, buffs.Leth) / 100; }
function defProduct(base, buffs) { return eff(base.HP, buffs.HP) * eff(base.DEF, buffs.DEF) / 100; }

function computeSkillMod(joinerSlots, leaderDU) {
  const buckets = {};
  // Leader DU goes into op 101
  buckets[101] = (buckets[101] || 0) + (leaderDU || 0);
  for (const heroName of joinerSlots) {
    const hero = HERO_DB.find(h => h.name === heroName);
    if (!hero) continue;
    const s = hero.skill1;
    if (s.cat === "DamageUp") {
      buckets[s.op] = (buckets[s.op] || 0) + s.pct;
      if (s.catB === "DefenseUp") { /* dual-op like Hilde: second part is defense, handled separately */ }
    }
  }
  let du = 1;
  for (const val of Object.values(buckets)) {
    if (val > 0) du *= (1 + val / 100);
  }
  return { du, buckets };
}

function marginal(base, buffs, stat, gain, fn) {
  const before = fn(base, buffs);
  const after = fn(base, { ...buffs, [stat]: buffs[stat] + gain });
  return { abs: after - before, pct: (after - before) / before * 100 };
}

// ═══════════════════════════════════════════
// STYLING
// ═══════════════════════════════════════════
const C = {
  bg: "#060810", s1: "#0c1018", s2: "#111720", s3: "#171e2a",
  brd: "#1c2333", brdH: "#28304a",
  tx: "#a8b0c0", txD: "#5a6275", txB: "#dfe4ee",
  gold: "#c8961a", goldD: "#6b5010", goldG: "#c8961a22",
  grn: "#0ea572", red: "#e64060", blu: "#3878e0", pur: "#9070e0", cyn: "#18c8d8",
  inf: "#4a8ee0", cav: "#9060e8", arch: "#20c898",
};
const tc = { Infantry: C.inf, Cavalry: C.cav, Archer: C.arch };
const M = "'JetBrains Mono', monospace";
const D = "'Orbitron', sans-serif";
const B = "'Rajdhani', sans-serif";

const INVEST = [
  { id: "forgehammer", name: "Forgehammers", desc: "Hero Gear", off: ["Leth"], def: ["HP"], gain: 5, rare: 5, icon: "\u{1F528}", src: "heroGear" },
  { id: "charms", name: "Gov Charms", desc: "Charms", off: ["Leth"], def: ["HP"], gain: 3, rare: 3, icon: "\u{1F48E}", src: "charms" },
  { id: "pets", name: "Pet Marks", desc: "Pets", off: ["Leth"], def: ["HP"], gain: 2, rare: 2, icon: "\u{1F43E}", src: "pets" },
  { id: "govgear", name: "Gov Gear", desc: "ATK & DEF", off: ["ATK"], def: ["DEF"], gain: 4, rare: 2, icon: "\u{2694}\u{FE0F}", src: "govGear" },
  { id: "r_leth", name: "Research Leth", desc: "Battle tree", off: ["Leth"], def: [], gain: 5, rare: 3, icon: "\u{1F4DA}", src: "research" },
  { id: "r_hp", name: "Research HP", desc: "Battle tree", off: [], def: ["HP"], gain: 5, rare: 3, icon: "\u{1F4DA}", src: "research" },
  { id: "r_atk", name: "Research ATK", desc: "Battle tree", off: ["ATK"], def: [], gain: 5, rare: 2, icon: "\u{1F4DA}", src: "research" },
  { id: "r_def", name: "Research DEF", desc: "Battle tree", off: [], def: ["DEF"], gain: 5, rare: 2, icon: "\u{1F4DA}", src: "research" },
];

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function App() {
  const [cs, setCs] = useState(defaultCharState());
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("overview");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expInv, setExpInv] = useState(null);

  useEffect(() => {
    loadState().then(saved => {
      if (saved) setCs(prev => ({ ...defaultCharState(), ...saved }));
      setLoaded(true);
    });
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    await saveState(cs);
    setDirty(false);
    setTimeout(() => setSaving(false), 600);
  }, [cs]);

  const update = useCallback((path, value) => {
    setCs(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return next;
    });
    setDirty(true);
  }, []);

  const numUp = useCallback((path, val) => {
    update(path, Math.max(0, Number(val) || 0));
  }, [update]);

  // Computed
  const totalBuffs = useMemo(() => computeTotalBuffs(cs), [cs]);
  const statProducts = useMemo(() => {
    const r = {};
    for (const t of TROOP_TYPES) {
      const eA = eff(BASE_STATS[t].ATK, totalBuffs[t].ATK);
      const eL = eff(BASE_STATS[t].Leth, totalBuffs[t].Leth);
      const eH = eff(BASE_STATS[t].HP, totalBuffs[t].HP);
      const eD = eff(BASE_STATS[t].DEF, totalBuffs[t].DEF);
      r[t] = { off: eA * eL / 100, def: eH * eD / 100, eA, eL, eH, eD, aRatio: eA / eL, hRatio: eH / eD };
    }
    return r;
  }, [totalBuffs]);

  const sm = useMemo(() => computeSkillMod(cs.joinerSlots, cs.leaderDU), [cs.joinerSlots, cs.leaderDU]);

  const investments = useMemo(() => {
    const res = [];
    for (const inv of INVEST) {
      let tOff = 0, tDef = 0;
      const pt = {};
      for (const t of TROOP_TYPES) {
        const w = TROOP_WEIGHTS[t];
        let og = 0, dg = 0;
        for (const s of inv.off) og += marginal(BASE_STATS[t], totalBuffs[t], s, inv.gain, offProduct).pct;
        for (const s of inv.def) dg += marginal(BASE_STATS[t], totalBuffs[t], s, inv.gain, defProduct).pct;
        pt[t] = { og, dg };
        tOff += og * w;
        tDef += dg * w;
      }
      const comb = tOff * 0.65 + tDef * 0.35;
      const ef = comb / Math.max(inv.rare, 1);
      res.push({ ...inv, tOff, tDef, comb, ef, pt });
    }
    res.sort((a, b) => b.ef - a.ef);
    return res.map((r, i) => ({ ...r, tier: i < 2 ? "S" : i < 4 ? "A" : i < 6 ? "B" : "C" }));
  }, [totalBuffs]);

  if (!loaded) return <div style={{ background: C.bg, color: C.tx, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: B }}>Loading character data...</div>;

  const tierC = { S: C.gold, A: C.grn, B: C.blu, C: C.txD };

  return (
    <div style={{ fontFamily: B, background: C.bg, color: C.tx, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input[type="number"]{font-family:${M};font-size:12px;background:${C.bg};border:1px solid ${C.brd};color:${C.txB};padding:5px 6px;border-radius:4px;width:70px;text-align:right}
        input[type="number"]:focus{outline:none;border-color:${C.gold}}
        input[type="number"]::-webkit-inner-spin-button{opacity:.3}
        select{font-family:${B};font-size:13px;background:${C.s1};border:1px solid ${C.brd};color:${C.txB};padding:5px 8px;border-radius:4px;cursor:pointer}
        select:focus{outline:none;border-color:${C.gold}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.brd};border-radius:3px}
      `}</style>

      {/* HEADER */}
      <div style={{ background: C.s1, borderBottom: `1px solid ${C.brd}`, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: D, fontSize: 16, fontWeight: 800, color: C.gold, letterSpacing: "1.5px" }}>
            KINGSHOT CHARACTER SHEET
          </div>
          <div style={{ fontSize: 11, color: C.txD, marginTop: 1 }}>
            Persistent shadow copy \u00B7 Investment optimizer \u00B7 SkillMod engine
          </div>
        </div>
        <button onClick={save} style={{
          fontFamily: D, fontSize: 10, fontWeight: 700, letterSpacing: "1px",
          padding: "8px 16px", borderRadius: 4, border: "none", cursor: "pointer",
          background: dirty ? C.gold : C.s2, color: dirty ? C.bg : C.txD,
          transition: "all .2s",
        }}>
          {saving ? "SAVED \u2713" : dirty ? "SAVE" : "SAVED"}
        </button>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.brd}`, background: C.s1 }}>
        {[
          { id: "overview", l: "\u{1F3AF} Overview" },
          { id: "research", l: "\u{1F4DA} Research" },
          { id: "gear", l: "\u{1F48E} Gear & Charms" },
          { id: "heroes", l: "\u{2694}\u{FE0F} Heroes & March" },
          { id: "invest", l: "\u{1F4C8} Optimizer" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            fontFamily: B, fontSize: 12, fontWeight: 600, padding: "8px 14px",
            background: "none", border: "none",
            color: tab === t.id ? C.gold : C.txD,
            borderBottom: tab === t.id ? `2px solid ${C.gold}` : "2px solid transparent",
            cursor: "pointer",
          }}>{t.l}</button>
        ))}
      </div>

      <div style={{ padding: "12px 14px 20px" }}>

        {/* ════ OVERVIEW ════ */}
        {tab === "overview" && (
          <div>
            {/* Stat Product Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {TROOP_TYPES.map(t => {
                const sp = statProducts[t];
                const bnOff = sp.aRatio > 2 ? "Leth" : sp.aRatio < 0.5 ? "ATK" : null;
                const bnDef = sp.hRatio > 2 ? "DEF" : sp.hRatio < 0.5 ? "HP" : null;
                return (
                  <div key={t} style={{ background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 8, padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: tc[t], boxShadow: `0 0 6px ${tc[t]}88` }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: tc[t] }}>{t}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 6 }}>
                      <Chip label="ATK\u00D7Leth" value={sp.off.toFixed(1)} />
                      <Chip label="HP\u00D7DEF" value={sp.def.toFixed(1)} />
                    </div>
                    <div style={{ fontSize: 11, fontFamily: M }}>
                      <Rw left="ATK:Leth" right={`${sp.aRatio.toFixed(1)}:1`} warn={sp.aRatio > 2} />
                      <Rw left="HP:DEF" right={`${sp.hRatio.toFixed(1)}:1`} warn={sp.hRatio > 2} />
                    </div>
                    {bnOff && <div style={{ color: C.gold, fontSize: 10, fontWeight: 700, marginTop: 3 }}>\u26A0 Bottleneck: {bnOff}</div>}
                    {bnDef && <div style={{ color: C.gold, fontSize: 10, fontWeight: 700, marginTop: 1 }}>\u26A0 Bottleneck: {bnDef}</div>}
                  </div>
                );
              })}
            </div>

            {/* Buff Summary */}
            <Lbl mt={14}>Total Buff Summary (computed from all sources)</Lbl>
            <Grid cols="80px repeat(4,1fr)">
              <Hc />{STAT_NAMES.map(s => <Hc key={s}>{s}%</Hc>)}
              {TROOP_TYPES.map(t => (
                <React.Fragment key={t}>
                  <Dc style={{ color: tc[t], fontWeight: 700 }}>{t}</Dc>
                  {STAT_NAMES.map(s => <Dc key={s} mono>{totalBuffs[t][s].toFixed(0)}</Dc>)}
                </React.Fragment>
              ))}
            </Grid>

            {/* SkillMod */}
            <Lbl mt={14}>SkillMod Summary</Lbl>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 6, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontFamily: D, fontSize: 20, fontWeight: 800, color: C.grn }}>{sm.du.toFixed(3)}</div>
                <div style={{ fontSize: 9, color: C.txD, marginTop: 2 }}>RAW DAMAGEUP</div>
              </div>
              <div style={{ fontSize: 12 }}>
                <div style={{ color: C.txD }}>Joiners: <span style={{ color: C.txB }}>{cs.joinerSlots.join(", ")}</span></div>
                <div style={{ color: C.txD }}>Leader DU: <span style={{ color: C.txB }}>{cs.leaderDU}%</span></div>
                <div style={{ color: C.txD, marginTop: 2 }}>
                  Buckets: {Object.entries(sm.buckets).map(([k, v]) => <span key={k} style={{ fontFamily: M, marginRight: 8 }}>op{k}: {v}%</span>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ RESEARCH ════ */}
        {tab === "research" && (
          <div>
            <Lbl>Battle Research Buff Percentages</Lbl>
            <div style={{ fontSize: 11, color: C.txD, marginBottom: 10 }}>
              Enter your total % from completed research nodes. Check Battle tree in Academy.
            </div>
            {TROOP_TYPES.map(t => (
              <div key={t} style={{ marginBottom: 12 }}>
                <div style={{ color: tc[t], fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{t}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {STAT_NAMES.map(s => (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 11, color: C.txD, width: 32 }}>{s}</span>
                      <input type="number" value={cs.research[t][s]} onChange={e => numUp(`research.${t}.${s}`, e.target.value)} />
                      <span style={{ fontSize: 10, color: C.txD }}>%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Lbl mt={16}>Alliance Tech (Battle/Territory nodes — all troop types)</Lbl>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {STAT_NAMES.map(s => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: C.txD, width: 32 }}>{s}</span>
                  <input type="number" value={cs.allianceTech[s]} onChange={e => numUp(`allianceTech.${s}`, e.target.value)} />
                  <span style={{ fontSize: 10, color: C.txD }}>%</span>
                </div>
              ))}
            </div>
            <Lbl mt={16}>Skins (City + March skin bonuses — all troops)</Lbl>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {STAT_NAMES.map(s => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: C.txD, width: 32 }}>{s}</span>
                  <input type="number" value={cs.skins[s]} onChange={e => numUp(`skins.${s}`, e.target.value)} />
                  <span style={{ fontSize: 10, color: C.txD }}>%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ GEAR & CHARMS ════ */}
        {tab === "gear" && (
          <div>
            <Lbl>Governor Gear Slots</Lbl>
            <div style={{ fontSize: 11, color: C.txD, marginBottom: 10 }}>
              Pick the tier for each of your 6 gear pieces. Stats and set bonuses compute automatically.
            </div>

            {/* 6 Gear Slots in a 2x3 grid (matches in-game layout) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {GOV_GEAR_SLOTS.map(slot => {
                const tierIdx = cs.govGearSlots?.[slot.id] || 0;
                const tier = GOV_GEAR_TIERS[tierIdx];
                const tierColor = tier.label.startsWith("Red") ? "#e64060" :
                  tier.label.startsWith("Gold") ? "#c8961a" :
                  tier.label.startsWith("Purple") ? "#9060e8" :
                  tier.label.startsWith("Blue") ? "#4a8ee0" :
                  tier.label.startsWith("Green") ? "#20c898" : C.txD;
                return (
                  <div key={slot.id} style={{
                    background: C.s1, border: `1px solid ${tierIdx > 0 ? tierColor + "44" : C.brd}`,
                    borderRadius: 8, padding: "10px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{slot.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.txB, marginBottom: 6 }}>{slot.name}</div>
                    <select
                      value={tierIdx}
                      onChange={e => update(`govGearSlots.${slot.id}`, Number(e.target.value))}
                      style={{ width: "100%", fontSize: 11, padding: "4px 4px", color: tierColor }}
                    >
                      {GOV_GEAR_TIERS.map((t, i) => (
                        <option key={i} value={i}>{t.label} ({t.total}%)</option>
                      ))}
                    </select>
                    {tierIdx > 0 && (
                      <div style={{ fontFamily: M, fontSize: 10, color: tierColor, marginTop: 4 }}>
                        +{tier.total}% ATK/DEF
                      </div>
                    )}

                    {/* 3 Charm slots in a row under each gear piece */}
                    <div style={{ marginTop: 8, borderTop: `1px solid ${C.brd}`, paddingTop: 6 }}>
                      <div style={{ fontSize: 9, color: C.txD, marginBottom: 4, letterSpacing: "0.5px" }}>CHARMS (Leth + HP)</div>
                      <div style={{ display: "flex", gap: 3 }}>
                      {[0, 1, 2].map(ci => {
                        return (
                            <select
                              key={ci}
                              value={(cs.charmLevels?.Infantry?.[slot.id]?.[ci]) || 0}
                              onChange={e => {
                                const val = Number(e.target.value);
                                for (const t of TROOP_TYPES) {
                                  const path = `charmLevels.${t}.${slot.id}`;
                                  const arr = [...(cs.charmLevels?.[t]?.[slot.id] || [0,0,0])];
                                  arr[ci] = val;
                                  update(path, arr);
                                }
                              }}
                              style={{ flex: 1, fontSize: 10, padding: "2px 2px", minWidth: 0 }}
                            >
                              {CHARM_LEVELS.map((cl, i) => (
                                <option key={i} value={i}>{cl.label}{cl.total > 0 ? ` (${cl.total}%)` : ""}</option>
                              ))}
                            </select>
                        );
                      })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Set Bonus Display */}
            {(() => {
              const sb = getSetBonus(cs.govGearSlots || {});
              return (sb.atk3 > 0 || sb.def3 > 0) ? (
                <div style={{
                  marginTop: 10, padding: "8px 12px", background: C.s2,
                  border: `1px solid ${C.gold}33`, borderRadius: 6,
                  display: "flex", gap: 16, fontSize: 12,
                }}>
                  {sb.def3 > 0 && <span style={{ color: C.blu }}>3pc Set: +{sb.def3}% DEF</span>}
                  {sb.atk3 > 0 && <span style={{ color: C.grn }}>6pc Set: +{sb.atk3}% ATK</span>}
                </div>
              ) : null;
            })()}

            <Lbl mt={16}>Pet Refinement (Leth & HP — all troop types)</Lbl>
            <div style={{ display: "flex", gap: 16 }}>
              {["Leth", "HP"].map(s => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12, color: C.txD }}>{s}</span>
                  <input type="number" value={cs.pets[s]} onChange={e => numUp(`pets.${s}`, e.target.value)} />
                  <span style={{ fontSize: 10, color: C.txD }}>%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ HEROES ════ */}
        {tab === "heroes" && (
          <div>
            <Lbl>Rally Leader March (3 Heroes)</Lbl>
            <div style={{ fontSize: 11, color: C.txD, marginBottom: 10 }}>
              Your main march heroes. Gear only applies when YOU lead a rally. Optimal joiners assumed automatically.
            </div>

            {/* 3-column grid, one per hero */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[0, 1, 2].map(hi => {
                const hero = cs.marchHeroes?.[hi] || { name: "", level: 1, stars: 0, gear: { helm: { enh: 0, mast: 0 }, gloves: { enh: 0, mast: 0 }, chest: { enh: 0, mast: 0 }, boots: { enh: 0, mast: 0 } }, widgetLv: 0, skills: [0, 0, 0] };
                const hPath = `marchHeroes.${hi}`;
                const heroColor = hi === 0 ? C.inf : hi === 1 ? C.cav : C.arch;
                const heroLabel = hi === 0 ? "Infantry" : hi === 1 ? "Cavalry" : "Archer";

                const updateHero = (field, val) => {
                  const current = cs.marchHeroes?.[hi] || { name: "", level: 1, stars: 0, gear: { helm: { enh: 0, mast: 0 }, gloves: { enh: 0, mast: 0 }, chest: { enh: 0, mast: 0 }, boots: { enh: 0, mast: 0 } }, widgetLv: 0, skills: [0, 0, 0] };
                  const next = JSON.parse(JSON.stringify(current));
                  const parts = field.split(".");
                  let obj = next;
                  for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
                  obj[parts[parts.length - 1]] = val;
                  const all = [...(cs.marchHeroes || [{}, {}, {}])];
                  all[hi] = next;
                  update("marchHeroes", all);
                };

                const gearPairs = [
                  [{ id: "helm", name: "Helmet", icon: "\u{1F3A9}" }, { id: "gloves", name: "Gloves", icon: "\u{1F9E4}" }],
                  [{ id: "chest", name: "Chest", icon: "\u{1F6E1}" }, { id: "boots", name: "Boots", icon: "\u{1F462}" }],
                ];

                return (
                  <div key={hi} style={{
                    background: C.s1, border: `1px solid ${C.brd}`,
                    borderRadius: 8, padding: "10px", overflow: "hidden",
                  }}>
                    {/* Row 0: Hero type label */}
                    <div style={{
                      textAlign: "center", fontFamily: D, fontSize: 10, fontWeight: 700,
                      color: heroColor, letterSpacing: "1px", marginBottom: 8,
                      paddingBottom: 6, borderBottom: `1px solid ${C.brd}`,
                    }}>
                      {heroLabel} HERO
                    </div>

                    {/* Row 1: Hero name, level, stars */}
                    <div style={{ marginBottom: 8 }}>
                      <select
                        value={hero.name}
                        onChange={e => updateHero("name", e.target.value)}
                        style={{ width: "100%", fontSize: 11, marginBottom: 4 }}
                      >
                        <option value="">Select hero...</option>
                        {HERO_DB.filter(h => h.type === heroLabel || heroLabel === "Any").map(h => (
                          <option key={h.name} value={h.name}>{h.name} (Gen {h.gen})</option>
                        ))}
                        {/* Also show all heroes for flexibility */}
                        <optgroup label="Other types">
                          {HERO_DB.filter(h => h.type !== heroLabel).map(h => (
                            <option key={h.name} value={h.name}>{h.name} ({h.type}, Gen {h.gen})</option>
                          ))}
                        </optgroup>
                      </select>
                      <div style={{ display: "flex", gap: 6 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, color: C.txD, marginBottom: 2 }}>Level</div>
                          <input type="number" min={1} max={80} value={hero.level}
                            onChange={e => updateHero("level", Math.min(80, Math.max(1, Number(e.target.value) || 1)))}
                            style={{ width: "100%" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, color: C.txD, marginBottom: 2 }}>Stars</div>
                          <select value={hero.stars} onChange={e => updateHero("stars", Number(e.target.value))}
                            style={{ width: "100%", fontSize: 11 }}>
                            {[0,1,2,3,4,5].map(s => <option key={s} value={s}>{s === 0 ? "0" : "\u2605".repeat(s)}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Row 2-3: Gear pieces (2 rows × 2 columns) */}
                    {gearPairs.map((pair, ri) => (
                      <div key={ri} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 4 }}>
                        {pair.map(piece => {
                          const g = hero.gear?.[piece.id] || { enh: 0, mast: 0 };
                          return (
                            <div key={piece.id} style={{
                              background: C.bg, border: `1px solid ${C.brd}`,
                              borderRadius: 4, padding: "6px", textAlign: "center",
                            }}>
                              <div style={{ fontSize: 12, marginBottom: 2 }}>{piece.icon}</div>
                              <div style={{ fontSize: 9, color: C.txD, marginBottom: 3 }}>{piece.name}</div>
                              <div style={{ display: "flex", gap: 3 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 8, color: C.txD }}>Enh</div>
                                  <input type="number" min={0} max={200}
                                    value={g.enh}
                                    onChange={e => updateHero(`gear.${piece.id}.enh`, Math.min(200, Math.max(0, Number(e.target.value) || 0)))}
                                    style={{ width: "100%", fontSize: 10, padding: "3px 2px" }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 8, color: C.txD }}>Mast</div>
                                  <input type="number" min={0} max={15}
                                    value={g.mast}
                                    onChange={e => updateHero(`gear.${piece.id}.mast`, Math.min(15, Math.max(0, Number(e.target.value) || 0)))}
                                    style={{ width: "100%", fontSize: 10, padding: "3px 2px" }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}

                    {/* Row 4: Exclusive Widget */}
                    <div style={{
                      background: C.bg, border: `1px solid ${C.brd}`,
                      borderRadius: 4, padding: "6px", textAlign: "center", marginBottom: 4,
                    }}>
                      <div style={{ fontSize: 9, color: C.gold, fontWeight: 700, marginBottom: 3 }}>\u2B50 WIDGET</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <span style={{ fontSize: 9, color: C.txD }}>Level</span>
                        <input type="number" min={0} max={10}
                          value={hero.widgetLv}
                          onChange={e => updateHero("widgetLv", Math.min(10, Math.max(0, Number(e.target.value) || 0)))}
                          style={{ width: 50, fontSize: 11 }} />
                      </div>
                    </div>

                    {/* Row 5: 3 Expedition Skills */}
                    <div style={{
                      background: C.bg, border: `1px solid ${C.brd}`,
                      borderRadius: 4, padding: "6px",
                    }}>
                      <div style={{ fontSize: 9, color: C.txD, textAlign: "center", marginBottom: 4, letterSpacing: "0.5px" }}>EXPEDITION SKILLS</div>
                      <div style={{ display: "flex", gap: 3 }}>
                        {[0, 1, 2].map(si => (
                          <div key={si} style={{ flex: 1, textAlign: "center" }}>
                            <div style={{ fontSize: 8, color: C.txD, marginBottom: 2 }}>Skill {si + 1}</div>
                            <input type="number" min={0} max={5}
                              value={(hero.skills || [0,0,0])[si]}
                              onChange={e => {
                                const sk = [...(hero.skills || [0,0,0])];
                                sk[si] = Math.min(5, Math.max(0, Number(e.target.value) || 0));
                                updateHero("skills", sk);
                              }}
                              style={{ width: "100%", fontSize: 10, padding: "3px 2px" }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Lbl mt={14}>Rally Formation</Lbl>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {TROOP_TYPES.map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: tc[t], fontWeight: 600, fontSize: 12, width: 60 }}>{t}</span>
                  <input type="number" step={1000} value={cs.troops[t]}
                    onChange={e => numUp(`troops.${t}`, e.target.value)} style={{ width: 90 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ OPTIMIZER ════ */}
        {tab === "invest" && (
          <div>
            <div style={{ fontSize: 12, color: C.txD, marginBottom: 12 }}>
              Ranked by efficiency = weighted stat-product gain \u00F7 resource rarity.
              Offense 65% / Survivability 35%. Click any row for per-troop breakdown.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {investments.map(inv => {
                const isExp = expInv === inv.id;
                const barW = Math.min(100, (inv.ef / Math.max(investments[0].ef, .001)) * 100);
                const tCl = tierC[inv.tier];
                return (
                  <div key={inv.id} onClick={() => setExpInv(isExp ? null : inv.id)} style={{
                    background: C.s1, border: `1px solid ${isExp ? tCl : C.brd}`,
                    borderRadius: 6, overflow: "hidden", cursor: "pointer",
                  }}>
                    <div style={{ position: "relative", padding: "10px 12px" }}>
                      <div style={{
                        position: "absolute", top: 0, left: 0, bottom: 0,
                        width: `${barW}%`, background: `linear-gradient(90deg,${tCl}18,${tCl}05)`,
                      }} />
                      <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{
                            fontFamily: D, fontSize: 9, fontWeight: 700, color: tCl,
                            border: `1px solid ${tCl}`, padding: "1px 4px", borderRadius: 3,
                          }}>{inv.tier}</span>
                          <span style={{ fontSize: 14 }}>{inv.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: 13, color: C.txB }}>{inv.name}</span>
                          <span style={{ fontSize: 10, color: C.txD }}>{inv.desc} (+{inv.gain}%)</span>
                          <span style={{ marginLeft: "auto", fontFamily: M, fontSize: 12, fontWeight: 700, color: C.grn }}>
                            {inv.ef.toFixed(3)} eff
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 10, fontSize: 10, fontFamily: M, marginTop: 3 }}>
                          <span style={{ color: C.grn }}>OFF +{inv.tOff.toFixed(2)}%</span>
                          <span style={{ color: C.blu }}>DEF +{inv.tDef.toFixed(2)}%</span>
                          <span style={{ color: C.txD }}>Comb +{inv.comb.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                    {isExp && (
                      <div style={{ padding: "8px 12px 10px", borderTop: `1px solid ${C.brd}` }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
                          {TROOP_TYPES.map(t => (
                            <div key={t} style={{ background: C.bg, borderRadius: 4, padding: "6px 8px", border: `1px solid ${C.brd}` }}>
                              <div style={{ color: tc[t], fontWeight: 600, fontSize: 11, marginBottom: 3 }}>{t}</div>
                              <div style={{ fontFamily: M, fontSize: 10 }}>
                                {inv.pt[t].og > 0 && <div>OFF <span style={{ color: C.grn }}>+{inv.pt[t].og.toFixed(2)}%</span></div>}
                                {inv.pt[t].dg > 0 && <div>DEF <span style={{ color: C.blu }}>+{inv.pt[t].dg.toFixed(2)}%</span></div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: 10, borderTop: `1px solid ${C.brd}`, fontSize: 9, color: C.txD, textAlign: "center", fontFamily: M }}>
        Kills = \u221ATroops \u00D7 ATK\u00D7Leth / DEF\u00D7HP / 100 \u00D7 SkillMod \u00B7 kingshotguides.com
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════
function Lbl({ children, mt = 0 }) {
  return <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: "1px", marginBottom: 6, marginTop: mt }}>{children}</div>;
}
function Chip({ label, value }) {
  return (
    <div style={{ background: C.bg, borderRadius: 4, padding: "5px 6px", border: `1px solid ${C.brd}`, textAlign: "center" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: C.txB }}>{value}</div>
      <div style={{ fontSize: 8, color: C.txD, marginTop: 1 }}>{label}</div>
    </div>
  );
}
function Rw({ left, right, warn }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}>
      <span style={{ color: C.txD }}>{left}</span>
      <span style={{ color: warn ? C.gold : C.txD }}>{right}</span>
    </div>
  );
}
function Grid({ cols, children }) {
  return <div style={{ display: "grid", gridTemplateColumns: cols, gap: "1px", background: C.brd, borderRadius: 5, overflow: "hidden", fontSize: 12 }}>{children}</div>;
}
function Hc({ children }) {
  return <div style={{ background: C.s1, padding: "6px 8px", fontSize: 9, fontWeight: 700, color: C.txD, textAlign: "center", letterSpacing: ".6px", fontFamily: "'Orbitron', sans-serif" }}>{children}</div>;
}
function Dc({ children, mono, style = {} }) {
  return <div style={{ background: C.bg, padding: "6px 8px", textAlign: "center", fontSize: 12, fontFamily: mono ? "'JetBrains Mono', monospace" : undefined, ...style }}>{children}</div>;
}
