// Pack resolver: converts a PackTier (with potentially nested choices) into
// a flat ResourceBundle of modeled resources the player would actually
// receive, by greedily routing each pick / slot to whichever option most
// improves the planner's gain against the current budget. Also tracks
// unmodeled extras (gems, speedups, etc.) and the chosen option ids for
// display / explainability.
//
// Why greedy: full enumeration of slot configurations explodes (Custom Pet
// Chest $99.99 has thousands of multisets across nested choices). Greedy
// slot-fill matches how a player actually fills these and avoids the blow-up.
// Tradeoff: slot N is locked before slot N+1 is considered. Acceptable for
// v1; bounded enumeration for small slot counts is a future optimization.
//
// Resolver-internal scoring uses plan() with a low iteration cap — we just
// need a relative-gain signal to compare options, not the full ranked plan.

import { plan } from "./planner.js";
import { mergeBundles } from "./scoring.js";

const SCORE_ITERATIONS = 5;

function scoreBundle(cs, budget) {
  const result = plan(cs, budget, { maxIterations: SCORE_ITERATIONS });
  let total = 0;
  for (const u of result.upgrades) total += u.gain;
  return total;
}

function pickBestOption(cs, currentBudget, options) {
  let best = null;
  let bestGain = -Infinity;

  for (const opt of options) {
    let bundle = opt.contents || {};
    let extras = opt.extras || {};
    let subPicks = [];

    if (opt.subChoice) {
      const sub = resolveChoice(
        cs,
        mergeBundles(currentBudget, bundle),
        opt.subChoice
      );
      bundle = mergeBundles(bundle, sub.bundle);
      extras = mergeBundles(extras, sub.extras);
      subPicks = sub.picks;
    }

    const gain = scoreBundle(cs, mergeBundles(currentBudget, bundle));
    if (gain > bestGain) {
      bestGain = gain;
      best = { optionId: opt.id, bundle, extras, subPicks };
    }
  }
  return best || { optionId: null, bundle: {}, extras: {}, subPicks: [] };
}

function resolveChoice(cs, currentBudget, choice) {
  if (!choice || choice.kind === "fixed") {
    return { bundle: {}, extras: {}, picks: [] };
  }
  const options = choice.options || [];
  if (options.length === 0) return { bundle: {}, extras: {}, picks: [] };

  if (choice.kind === "pick1") {
    const p = pickBestOption(cs, currentBudget, options);
    return {
      bundle: p.bundle,
      extras: p.extras,
      picks: [{ optionId: p.optionId, sub: p.subPicks }],
    };
  }

  if (choice.kind === "slots") {
    let accBundle = {};
    let accExtras = {};
    const picks = [];
    const slotCount = choice.slots || 1;
    for (let i = 0; i < slotCount; i++) {
      const p = pickBestOption(cs, mergeBundles(currentBudget, accBundle), options);
      accBundle = mergeBundles(accBundle, p.bundle);
      accExtras = mergeBundles(accExtras, p.extras);
      picks.push({ optionId: p.optionId, sub: p.subPicks });
    }
    return { bundle: accBundle, extras: accExtras, picks };
  }

  return { bundle: {}, extras: {}, picks: [] };
}

// Resolve a single pack tier against a character sheet + current budget.
// Returns:
//   bundle: ResourceBundle of modeled resources received
//   extras: aggregated unmodeled items (gems, speedups, food, etc.)
//   picks:  per-choice option ids selected, for display / explainability
export function resolvePackTier(cs, currentBudget, tier) {
  const baseBundle = tier.base || {};
  const baseExtras = tier.baseExtras || {};
  const choiceResult = resolveChoice(
    cs,
    mergeBundles(currentBudget, baseBundle),
    tier.choice
  );
  return {
    bundle: mergeBundles(baseBundle, choiceResult.bundle),
    extras: mergeBundles(baseExtras, choiceResult.extras),
    picks: choiceResult.picks,
  };
}
