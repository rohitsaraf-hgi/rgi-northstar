// Play evaluator — checks which signals fire on an account for a given play,
// and ranks accounts by cumulative signal weight × offering fit.
//
// Returns firing signals so the seller's home can render provenance chips with
// their human-readable names ("New CISO", "Pricing visits", "Palo Alto aging").

import { getFitFor } from './accountOfferingFit.js';
import { firingSignalsForAccount, signalWeightSum } from './rankingSignals.js';

// Check eligibility — basic gating before a play even considers an account.
function passesEligibility(play, account, { isBookAccount }) {
  const e = play.eligibility || {};
  if (e.min_offering_fit) {
    const fit = getFitFor(account.id, play.offering_id);
    if ((fit?.score ?? 0) < e.min_offering_fit) return false;
  }
  // Future: industry filter, must-be-customer, etc.
  return true;
}

// Evaluate a play against an account.
// Returns:
//   {
//     matches: bool,     // at least 1 signal firing AND passes eligibility
//     firingSignals: [signal, ...],
//     score: number,     // cumulative weight × fit
//     fitScore: number,
//     weightSum: number,
//   }
export function evaluatePlay(play, account, { isBookAccount } = {}) {
  // Eligibility first
  if (!passesEligibility(play, account, { isBookAccount })) {
    return { matches: false, firingSignals: [], score: 0, fitScore: 0, weightSum: 0 };
  }

  const firingSignals = firingSignalsForAccount(play.signals || [], account, { isBookAccount });
  const weightSum = signalWeightSum(firingSignals);

  const fit = getFitFor(account.id, play.offering_id);
  const fitScore = fit?.score ?? 0;

  // Score = signal weight + a moderate boost from offering fit (so a strong fit
  // with a few signals beats a weak fit with many signals). Tuned for the demo.
  const score = Math.round(weightSum * 5 + fitScore * 0.5);

  return {
    matches: firingSignals.length > 0,
    firingSignals,
    score,
    fitScore,
    weightSum,
  };
}

// Rank accounts for a play across a pool. `accounts` = [{ account, isBookAccount }].
export function rankAccountsForPlay(play, accounts) {
  const results = [];
  for (const { account, isBookAccount } of accounts) {
    // Respect surface scope
    if (play.surface_scope === 'book' && !isBookAccount) continue;
    if (play.surface_scope === 'whitespace' && isBookAccount) continue;

    const r = evaluatePlay(play, account, { isBookAccount });
    if (r.matches) {
      results.push({ account, isBookAccount, ...r });
    }
  }
  return results.sort((a, b) => b.score - a.score);
}

// Counts per play for chip badges.
export function countMatchesPerPlay(plays, accounts) {
  const counts = {};
  for (const play of plays) {
    let book = 0;
    let ws = 0;
    for (const { account, isBookAccount } of accounts) {
      if (play.surface_scope === 'book' && !isBookAccount) continue;
      if (play.surface_scope === 'whitespace' && isBookAccount) continue;
      const r = evaluatePlay(play, account, { isBookAccount });
      if (r.matches) {
        if (isBookAccount) book += 1;
        else ws += 1;
      }
    }
    counts[play.id] = { book, whitespace: ws, total: book + ws };
  }
  return counts;
}

// For the SellerHome provenance chips — return firing signals shaped as the UI expects.
// (Each entry is just the signal def itself — caller uses signal.name.)
export function provenanceFromFiringSignals(firingSignals, max = 4) {
  return firingSignals
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .slice(0, max);
}
