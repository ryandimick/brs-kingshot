// Pack catalog: schema, expansion, and aggregation.
//
// Each pack module under ./packs/ exports default a PackFamily object:
//
//   PackFamily {
//     id, name, category, tags,
//     recurrence:  { cycleDays, windows: [{ days: [start, end] }, ...], uncertain? },
//     perWindowCap, tierAccessModel: "independent" | "sequential",
//     labelFormat: "percentage" | "categorical",
//     label?, source: { author, capturedDate, confidence },
//     tiers: [Tier],
//   }
//
//   Tier — either fully expanded or { scaleFrom, factor } shorthand for
//   inheriting from another tier in the same pack:
//
//     Tier (full) {
//       id, tierName, price, label?,
//       base:       ResourceBundle,           // modeled planner resources
//       baseExtras: { [unmodeled-key]: qty }, // gems, speedups, food, etc.
//       choice:     ChoiceSpec,
//     }
//     Tier (shorthand) {
//       id, tierName, price, scaleFrom: "<other-tier-id>", factor: number
//     }
//
//   ChoiceSpec one of:
//     { kind: "fixed" }
//     { kind: "pick1", options: ChoiceOption[] }
//     { kind: "slots", slots: number, repeats: boolean, options: ChoiceOption[] }
//
//   ChoiceOption {
//     id, label,
//     contents:  ResourceBundle,
//     extras:    { [unmodeled-key]: qty },
//     subChoice?: ChoiceSpec  // e.g. each Pet Advancement chest is pick-1-of-3
//   }

import hopeMarket from "./packs/hope-market.js";
import customArmsSet from "./packs/custom-arms-set.js";
import customPetChest from "./packs/custom-pet-chest.js";
import customForgingSet from "./packs/custom-forging-set.js";
import customSelection from "./packs/custom-selection.js";
import conqueror from "./packs/conqueror.js";
import exclusiveGearEnh from "./packs/exclusive-gear-enhancement-special.js";
import truegoldValue from "./packs/truegold-value-pack.js";

const RAW_PACKS = [
  hopeMarket,
  customArmsSet,
  customPetChest,
  customForgingSet,
  customSelection,
  conqueror,
  exclusiveGearEnh,
  truegoldValue,
];

// ─── Expansion ───────────────────────────────────────────────────────────

function multiplyBundle(bundle, factor) {
  if (!bundle) return {};
  const out = {};
  for (const [k, v] of Object.entries(bundle)) {
    if (typeof v === "number") out[k] = v * factor;
  }
  return out;
}

function expandChoice(choice, factor) {
  if (!choice) return { kind: "fixed" };
  if (choice.kind === "fixed") return { kind: "fixed" };
  const options = (choice.options || []).map(opt => ({
    ...opt,
    contents: multiplyBundle(opt.contents || {}, factor),
    extras: multiplyBundle(opt.extras || {}, factor),
    // subChoice options scale with the parent (each chest yields scaled materials)
    subChoice: opt.subChoice ? expandChoice(opt.subChoice, factor) : undefined,
  }));
  return { ...choice, options };
}

function expandTier(tier, tiersById) {
  if (!tier.scaleFrom) return tier;
  const basis = tiersById[tier.scaleFrom];
  if (!basis) {
    throw new Error(`Tier "${tier.id}" references unknown scaleFrom "${tier.scaleFrom}"`);
  }
  // Recursively expand the basis first if it also has scaleFrom.
  const basisExpanded = basis.scaleFrom ? expandTier(basis, tiersById) : basis;
  return {
    id: tier.id,
    tierName: tier.tierName,
    price: tier.price,
    label: tier.label ?? basisExpanded.label,
    base:       multiplyBundle(basisExpanded.base       || {}, tier.factor),
    baseExtras: multiplyBundle(basisExpanded.baseExtras || {}, tier.factor),
    choice:     expandChoice(basisExpanded.choice, tier.factor),
  };
}

function expandPack(pack) {
  const tiersById = Object.fromEntries(pack.tiers.map(t => [t.id, t]));
  const expandedTiers = pack.tiers.map(t => expandTier(t, tiersById));
  return { ...pack, tiers: expandedTiers };
}

// ─── Public API ──────────────────────────────────────────────────────────

let cached = null;
export function getAllPacks() {
  if (!cached) cached = RAW_PACKS.map(expandPack);
  return cached;
}

export function getPackById(id) {
  return getAllPacks().find(p => p.id === id) || null;
}
