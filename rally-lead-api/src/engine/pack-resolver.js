// Pack resolver: converts a PackTier (with potentially nested choices) into
// a flat ResourceBundle of modeled resources the player would actually
// receive, by greedily routing each pick / slot to whichever option most
// improves the planner's gain against the current budget.
//
// Why "greedy slot-fill" rather than enumerating all option combinations:
//   - Custom Arms Set ($99.99): 3 slots × 3 options × repeats = 10 multisets
//   - Custom Pet Chest ($99.99): 3 slots × 4 options × nested 3 × 3 picks
//     gives ~10K combinations — explosive.
// Greedy picks the best option each slot in sequence, given resources
// already accumulated in earlier slots. That matches how a player actually
// fills these out and avoids the combinatorial blow-up. Tradeoff: slot N
// is locked in before slot N+1 is considered, so we lose some optimality
// in pathological cases. Acceptable for v1; we can add bounded enumeration
// for small slot counts later.
//
// Scoring uses plan() with a capped iteration count — we don't need the
// full ranked plan, just enough total-gain signal to compare options.

import { plan } from "./planner.js";
import { mergeBundles } from "./scoring.js";

const SCORE_ITERATIONS = 30;

function scoreBundle(cs, budget) {
  const result = plan(cs, budget, { maxIterations: SCORE_ITERATIONS });
  let total = 0;
  for (const u of result.upgrades) total += u.gain;
  return total;
}

// Pick the best option from a list given currentBudget. Returns the
// modeled-resource bundle the option contributes (including any subChoice
// resolution).
function pickBestOption(cs, currentBudget, options) {
  let bestResources = {};
  let bestGain = -Infinity;

  for (const opt of options) {
    let resources = opt.contents || {};
    if (opt.subChoice) {
      const sub = resolveChoice(
        cs,
        mergeBundles(currentBudget, resources),
        opt.subChoice
      );
      resources = mergeBundles(resources, sub);
    }
    const gain = scoreBundle(cs, mergeBundles(currentBudget, resources));
    if (gain > bestGain) {
      bestGain = gain;
      bestResources = resources;
    }
  }
  return bestResources;
}

function resolveChoice(cs, currentBudget, choice) {
  if (!choice || choice.kind === "fixed") return {};
  const options = choice.options || [];
  if (options.length === 0) return {};

  if (choice.kind === "pick1") {
    return pickBestOption(cs, currentBudget, options);
  }

  if (choice.kind === "slots") {
    let accumulated = {};
    const slotCount = choice.slots || 1;
    for (let i = 0; i < slotCount; i++) {
      const optResources = pickBestOption(
        cs,
        mergeBundles(currentBudget, accumulated),
        options
      );
      accumulated = mergeBundles(accumulated, optResources);
    }
    return accumulated;
  }

  return {};
}

// Resolve a single pack tier against a character sheet + current budget.
// Returns the modeled-resource bundle the player receives from one purchase
// (base contents + greedy-routed choice contents). Unmodeled extras
// (gems, speedups, etc.) live on the tier's baseExtras / option.extras and
// are surfaced by the caller for display — they don't enter the bundle.
export function resolvePackTier(cs, currentBudget, tier) {
  const baseBundle = tier.base || {};
  const choiceBundle = resolveChoice(
    cs,
    mergeBundles(currentBudget, baseBundle),
    tier.choice
  );
  return mergeBundles(baseBundle, choiceBundle);
}
