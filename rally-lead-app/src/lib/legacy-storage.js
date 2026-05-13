import { HERO_DB } from "../data/hero-catalog";

const STORAGE_KEY = "kingshot-char-v3";
const V2_STORAGE_KEY = "kingshot-char-v2";
const V1_STORAGE_KEY = "kingshot-char-v1";

function migrateV1toV2(old) {
  const result = { ...old };
  const TROOP_SLOTS = ["Infantry", "Cavalry", "Archer"];

  if (old.marchHeroes && !old.heroGear) {
    const heroGear = {
      Infantry: { helm: { enh: 0, mast: 0 }, gloves: { enh: 0, mast: 0 }, chest: { enh: 0, mast: 0 }, boots: { enh: 0, mast: 0 } },
      Cavalry:  { helm: { enh: 0, mast: 0 }, gloves: { enh: 0, mast: 0 }, chest: { enh: 0, mast: 0 }, boots: { enh: 0, mast: 0 } },
      Archer:   { helm: { enh: 0, mast: 0 }, gloves: { enh: 0, mast: 0 }, chest: { enh: 0, mast: 0 }, boots: { enh: 0, mast: 0 } },
    };
    const heroRoster = {};
    const selectedHeroes = ["", "", ""];

    for (let i = 0; i < 3; i++) {
      const hero = old.marchHeroes[i];
      if (!hero) continue;

      let troop = TROOP_SLOTS[i];
      if (hero.name) {
        const dbEntry = HERO_DB.find(h => h.name === hero.name);
        if (dbEntry) troop = dbEntry.type;
      }

      if (hero.gear) {
        heroGear[troop] = JSON.parse(JSON.stringify(hero.gear));
      }

      if (hero.name) {
        heroRoster[hero.name] = {
          level: hero.level || 1,
          stars: hero.stars || 0,
          widgetLv: hero.widgetLv || 0,
          skills: hero.skills || [0, 0, 0],
        };
        selectedHeroes[i] = hero.name;
      }
    }

    result.heroGear = heroGear;
    result.heroRoster = heroRoster;
    result.attackRally = {
      selectedHeroes,
      joinerSlots: old.joinerSlots || ["Chenko", "Chenko", "Amane", "Amane"],
    };
    result.garrisonLead = { selectedHeroes: ["", "", ""] };
  }

  delete result.marchHeroes;
  delete result.joinerSlots;

  return result;
}

function migrateV2toV3(old) {
  const result = { ...old };
  const t = old.troops;
  if (t && typeof t === "object" && (typeof t.Infantry === "number" || typeof t.Cavalry === "number" || typeof t.Archer === "number")) {
    result.troops = {
      Infantry: { composition: [{ count: Number(t.Infantry) || 0, tier: 11, tgLevel: 0 }] },
      Cavalry:  { composition: [{ count: Number(t.Cavalry)  || 0, tier: 11, tgLevel: 0 }] },
      Archer:   { composition: [{ count: Number(t.Archer)   || 0, tier: 11, tgLevel: 0 }] },
    };
  }
  return result;
}

// Pulls a character sheet out of localStorage, applying schema migrations.
// Returns null if nothing is stored. Used to seed a new profile from a
// pre-login local sheet.
export function loadLegacyCharacterSheet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const v2Raw = localStorage.getItem(V2_STORAGE_KEY);
    if (v2Raw) return migrateV2toV3(JSON.parse(v2Raw));
    const v1Raw = localStorage.getItem(V1_STORAGE_KEY);
    if (v1Raw) return migrateV2toV3(migrateV1toV2(JSON.parse(v1Raw)));
    return null;
  } catch {
    return null;
  }
}

// Deep merge: defaults provide structure, saved values override leaf values
export function deepMergeCharacterSheet(defaults, saved) {
  if (!saved || typeof saved !== "object" || typeof defaults !== "object") return saved ?? defaults;
  if (Array.isArray(defaults)) return saved;
  const result = { ...defaults };
  for (const key of Object.keys(saved)) {
    if (key in result && typeof result[key] === "object" && !Array.isArray(result[key]) && typeof saved[key] === "object" && !Array.isArray(saved[key])) {
      result[key] = deepMergeCharacterSheet(result[key], saved[key]);
    } else {
      result[key] = saved[key];
    }
  }
  return result;
}
