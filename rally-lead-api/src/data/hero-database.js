// Merged hero database — the eventual single source of truth for heroes.
//
// Inputs (both left untouched):
//   - constants.js HERO_DB — authoritative for SKILLS (names + mechanics:
//     op codes, values, procChance, magnitudes) and for WIDGET TYPE
//     (offense / defense categorization).
//   - heroes-catalog — authoritative for ROSTER + TROOP TYPE.
//
// Merge rules applied per-hero:
//   - Base shape: HERO_DB entry if present, otherwise a stub from catalog.
//   - `type` (troop): catalog wins. Flips Amane→Archer, Chenko→Cavalry,
//     Gordon→Cavalry vs HERO_DB.
//   - `widgetType`, `hasWidget`, `widget.*`: HERO_DB wins. Preserves Hilde
//     and Vivian as offense (rally) widgets even though catalog says defender.
//   - `expeditionSkills`: HERO_DB wins (we keep the mechanical definitions).
//     Catalog skill descriptions are attached as `catalogDesc` for reference
//     where a name match exists.
//   - Name reconciliation: catalog "Longfei" → "Long Fei" (HERO_DB spelling).
//   - Catalog-only heroes without mechanical data (Diana, Edwin, Forrest,
//     Olive, Seth) are included as lean stubs so lineup UIs can list them.
//   - HERO_DB-only Gen 6 entries (Sophia, Triton, Yang) are excluded until
//     the catalog is updated to include them.

// Raw HERO_DB from constants.js is treated as the mechanical-data source.
// We re-export the MERGED list as HERO_DB so consumers can swap their import
// path without touching any other code.
import { HERO_DB as HERO_DB_SOURCE } from "./constants.js";
import { HEROES_CATALOG } from "./heroes-catalog.js";

// Catalog-name → HERO_DB-name overrides (catalog uses the JSON spelling).
const NAME_MAP = {
  Longfei: "Long Fei",
};

const SOURCE_BY_NAME = Object.fromEntries(HERO_DB_SOURCE.map(h => [h.name, h]));

function attachCatalogDescriptions(expeditionSkills, catalogSkills) {
  if (!Array.isArray(expeditionSkills) || !Array.isArray(catalogSkills)) return expeditionSkills;
  const byLoweredName = new Map();
  for (const cs of catalogSkills) {
    if (cs.name) byLoweredName.set(cs.name.toLowerCase(), cs);
  }
  return expeditionSkills.map(s => {
    const cs = byLoweredName.get((s.name || "").toLowerCase());
    return cs ? { ...s, catalogDesc: cs.desc } : s;
  });
}

function stubFromCatalog(cat, canonicalName) {
  return {
    name: canonicalName,
    gen: null,
    rarity: "Epic",
    type: cat.troop,
    baseStats: null,
    expeditionBonus: null,
    expeditionSkills: [],
    talent: null,
    hasWidget: Boolean(cat.widget?.type),
    widget: null,
    catalogSkillNames: cat.skills.map(s => s.name),
  };
}

function mergeOne(cat) {
  const canonicalName = NAME_MAP[cat.name] || cat.name;
  const source = SOURCE_BY_NAME[canonicalName];
  if (!source) {
    return stubFromCatalog(cat, canonicalName);
  }
  // Deep-ish clone of the HERO_DB entry (sufficient for downstream consumers
  // that treat the DB as read-only).
  const merged = JSON.parse(JSON.stringify(source));
  merged.type = cat.troop; // catalog wins for troop type
  merged.expeditionSkills = attachCatalogDescriptions(merged.expeditionSkills, cat.skills);
  return merged;
}

export const HERO_DB = HEROES_CATALOG.map(mergeOne);

const BY_NAME = Object.fromEntries(HERO_DB.map(h => [h.name, h]));
export function getHero(name) {
  return BY_NAME[name] || null;
}

export function heroesByTroop(troop) {
  return HERO_DB.filter(h => h.type === troop);
}
