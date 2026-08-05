// Home page ranking helpers — turn a persona's signal firings into the two
// data shapes the Daily Brief renders:
//
//   prioritizedAttentionQueue(personaId, opts)
//     → ranked list of (account × top-signal × NBA) rows
//   signalBoard(personaId, opts)
//     → per-category tiles with counts, top accounts, and sub-signal chips
//
// Ranking is grounded in signalCatalog weights; ties are rolled up per
// account so one at-risk account never floods the queue.

import { listSignalFirings } from './signalFirings.js';
import {
  SIGNAL_CATEGORIES,
  SIGNAL_CATEGORY_ORDER,
} from './signalCatalog.js';

// -----------------------------------------------------------------------------
// Attention Queue
// -----------------------------------------------------------------------------

// Roll up firings per account, pick the highest-weight one as the primary,
// keep the rest as "secondary" chips. Only accounts with at least one
// attention-eligible signal appear in the queue.
export function prioritizedAttentionQueue(personaId, { limit = 10 } = {}) {
  const rows = listSignalFirings(personaId);
  if (!rows.length) return [];

  // Group by accountId.
  const byAccount = new Map();
  for (const row of rows) {
    if (!row.definition.attentionEligible) continue;
    const bucket = byAccount.get(row.accountId) || {
      accountId: row.accountId,
      accountName: row.accountName,
      accountLogo: row.accountLogo,
      firings: [],
    };
    bucket.firings.push(row);
    byAccount.set(row.accountId, bucket);
  }

  // For each account, pick the highest-weight firing as primary; keep the
  // rest as secondary (they render as "+N more risks" chips).
  const perAccount = Array.from(byAccount.values()).map((bucket) => {
    const sorted = bucket.firings.slice().sort((a, b) => b.weight - a.weight);
    const primary = sorted[0];
    const secondary = sorted.slice(1);
    return {
      accountId: bucket.accountId,
      accountName: bucket.accountName,
      accountLogo: bucket.accountLogo,
      primary,
      secondary,
      rankScore: primary.weight,
    };
  });

  // Rank by primary weight (tie-broken by secondary count so a busy account
  // ranks above a single-issue account at the same weight).
  perAccount.sort((a, b) => {
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
    return b.secondary.length - a.secondary.length;
  });

  return perAccount.slice(0, limit);
}

// -----------------------------------------------------------------------------
// Signal Board (grouped tiles)
// -----------------------------------------------------------------------------

// Returns one entry per category with a firing. Tiles for categories with
// zero firings are omitted so the board never renders empty. Each tile:
//   { category, count, accountCount, topAccounts[], subSignals[] }
//
//   topAccounts — top 3 unique account chips (deduped, sorted by weight)
//   subSignals  — up to 4 distinct signal-type labels firing within this
//                 category, used as sub-hint chips inside the tile
export function signalBoard(personaId, { topAccountLimit = 3, subSignalLimit = 4 } = {}) {
  const rows = listSignalFirings(personaId);
  if (!rows.length) return [];

  const byCategory = new Map();
  for (const row of rows) {
    const catId = row.definition.category;
    const bucket = byCategory.get(catId) || {
      category: SIGNAL_CATEGORIES[catId],
      count: 0,
      firings: [],
    };
    bucket.count += 1;
    bucket.firings.push(row);
    byCategory.set(catId, bucket);
  }

  // Iterate in the canonical category order so tiles have stable placement.
  const tiles = [];
  for (const catId of SIGNAL_CATEGORY_ORDER) {
    const bucket = byCategory.get(catId);
    if (!bucket) continue;

    // Top accounts — pick unique accounts sorted by highest weight in bucket.
    const bestPerAccount = new Map();
    for (const f of bucket.firings) {
      const existing = bestPerAccount.get(f.accountId);
      if (!existing || f.weight > existing.weight) {
        bestPerAccount.set(f.accountId, f);
      }
    }
    const topAccounts = Array.from(bestPerAccount.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, topAccountLimit)
      .map((f) => ({
        id: f.accountId,
        name: f.accountName,
        logoColor: f.accountLogo,
        signalDescription: f.definition.description,
      }));

    // Sub-signals — up to N distinct signal-type descriptions.
    const seenSignals = new Set();
    const subSignals = [];
    for (const f of bucket.firings) {
      if (seenSignals.has(f.signalId)) continue;
      seenSignals.add(f.signalId);
      subSignals.push(f.definition);
      if (subSignals.length >= subSignalLimit) break;
    }

    tiles.push({
      category: bucket.category,
      count: bucket.count,
      accountCount: bestPerAccount.size,
      topAccounts,
      subSignals,
    });
  }

  return tiles;
}
