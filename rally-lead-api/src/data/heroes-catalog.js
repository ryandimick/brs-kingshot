// Canonical hero roster — loaded from heroes.json (mirrored as heroes-data.js
// for Node+Vite compatibility). This is the source of truth for which heroes
// exist, their troop type, widget type/effect, and skill names/descriptions.
//
// Mechanical values (skill op codes, procChance, magnitudes, widget numeric
// stats) are NOT in this file — they live on each HERO_DB entry in constants.js
// and are layered on top during SkillMod / buff computation.

import { HEROES_RAW } from "./heroes-data.js";

export const HERO_TROOP_TYPES = ["Infantry", "Cavalry", "Archer"];

// Widget effect values observed in the roster: "", "attack", "lethality",
// "defense", "health". Widget type values: "", "rally", "defender".
export const WIDGET_TYPES   = ["", "rally", "defender"];
export const WIDGET_EFFECTS = ["", "attack", "lethality", "defense", "health"];

function normalizeHero(name, raw) {
  return {
    name,
    troop: raw.troop_type,
    widget: {
      type:   raw.widget?.widget_type   ?? "",
      effect: raw.widget?.widget_effect ?? "",
    },
    skills: (raw.skills || []).map(s => ({
      num:   typeof s.skill_num === "number" ? s.skill_num : Number(s.skill_num) || 0,
      name:  s.skill_name ?? "",
      desc:  s.skill_description ?? "",
      troop: s.troop_type ?? raw.troop_type,
    })),
  };
}

export const HEROES_CATALOG = Object.entries(HEROES_RAW).map(
  ([name, raw]) => normalizeHero(name, raw)
);

const CATALOG_BY_NAME = Object.fromEntries(
  HEROES_CATALOG.map(h => [h.name, h])
);

export function getHero(name) {
  return CATALOG_BY_NAME[name] || null;
}

export function heroesByTroop(troop) {
  return HEROES_CATALOG.filter(h => h.troop === troop);
}

export function heroesWithWidget() {
  return HEROES_CATALOG.filter(h => h.widget.type);
}
