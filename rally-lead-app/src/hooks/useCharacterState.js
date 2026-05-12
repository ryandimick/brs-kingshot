import { useState, useEffect, useCallback } from "react";
import { defaultCharState } from "../data/defaults";
import { HERO_DB } from "../data/hero-database";

const STORAGE_KEY = "kingshot-char-v3";
const V2_STORAGE_KEY = "kingshot-char-v2";
const V1_STORAGE_KEY = "kingshot-char-v1";

// Deep merge: defaults provide structure, saved values override leaf values
function deepMerge(defaults, saved) {
  if (!saved || typeof saved !== "object" || typeof defaults !== "object") return saved ?? defaults;
  if (Array.isArray(defaults)) return saved;
  const result = { ...defaults };
  for (const key of Object.keys(saved)) {
    if (key in result && typeof result[key] === "object" && !Array.isArray(result[key]) && typeof saved[key] === "object" && !Array.isArray(saved[key])) {
      result[key] = deepMerge(result[key], saved[key]);
    } else {
      result[key] = saved[key];
    }
  }
  return result;
}

// Migrate v1 (marchHeroes) → v2 (heroGear + heroRoster + attackRally/garrisonLead)
function migrateV1toV2(old) {
  const result = { ...old };
  const TROOP_SLOTS = ["Infantry", "Cavalry", "Archer"];

  if (old.marchHeroes && !old.heroGear) {
    const heroGear = {
      Infantry: { helm: { enh: 0, mast: 0 }, gloves: { enh: 0, mast: 0 }, chest: { enh: 0, mast: 0 }, boots: { enh: 0, mast: 0 } },
      Cavalry: { helm: { enh: 0, mast: 0 }, gloves: { enh: 0, mast: 0 }, chest: { enh: 0, mast: 0 }, boots: { enh: 0, mast: 0 } },
      Archer: { helm: { enh: 0, mast: 0 }, gloves: { enh: 0, mast: 0 }, chest: { enh: 0, mast: 0 }, boots: { enh: 0, mast: 0 } },
    };
    const heroRoster = {};
    const selectedHeroes = ["", "", ""];

    for (let i = 0; i < 3; i++) {
      const hero = old.marchHeroes[i];
      if (!hero) continue;

      // Determine troop type: from HERO_DB if named, else positional
      let troop = TROOP_SLOTS[i];
      if (hero.name) {
        const dbEntry = HERO_DB.find(h => h.name === hero.name);
        if (dbEntry) troop = dbEntry.type;
      }

      // Extract gear into heroGear keyed by troop type
      if (hero.gear) {
        heroGear[troop] = JSON.parse(JSON.stringify(hero.gear));
      }

      // Extract hero identity into roster
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

  // Clean up old fields
  delete result.marchHeroes;
  delete result.joinerSlots;

  return result;
}

// v2 (flat troop counts) → v3 (composition arrays with tier + tgLevel).
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

function loadState() {
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

function persistState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Save failed:", e);
  }
}

export function useCharacterState() {
  const [cs, setCs] = useState(defaultCharState());
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) setCs(() => deepMerge(defaultCharState(), saved));
    setLoaded(true);
  }, []);

  const save = useCallback(() => {
    setSaving(true);
    persistState(cs);
    setDirty(false);
    setTimeout(() => setSaving(false), 600);
  }, [cs]);

  const exportState = useCallback(() => {
    const payload = { version: STORAGE_KEY, exportedAt: new Date().toISOString(), state: cs };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `kingshot-rally-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [cs]);

  const update = useCallback((path, value) => {
    setCs(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) {
        if (obj[parts[i]] == null) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return next;
    });
    setDirty(true);
  }, []);

  const numUp = useCallback((path, val) => {
    update(path, Math.max(0, Number(val) || 0));
  }, [update]);

  // Roster helpers: avoid dot-path issues with hero names containing spaces
  const updateRoster = useCallback((heroName, field, value) => {
    setCs(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next.heroRoster) next.heroRoster = {};
      if (!next.heroRoster[heroName]) {
        next.heroRoster[heroName] = { level: 1, stars: 0, widgetLv: 0, skills: [0, 0, 0] };
      }
      if (field !== null) {
        next.heroRoster[heroName][field] = value;
      }
      return next;
    });
    setDirty(true);
  }, []);

  const removeRoster = useCallback((heroName) => {
    setCs(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (next.heroRoster) delete next.heroRoster[heroName];
      return next;
    });
    setDirty(true);
  }, []);

  return { cs, loaded, dirty, saving, save, update, numUp, updateRoster, removeRoster, exportState };
}
