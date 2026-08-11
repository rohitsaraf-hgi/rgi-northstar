// Daily Plan generator + persistent pin.
//
// A day plan is a persona's ranked action list for the day. When pinned,
// it replaces the auto-ranked "Priority accounts" section on Home
// (per design decision D-ii).

import { resolveTargetScope } from './targetScope.js';
import { listFiringsForAccount } from './signalFirings.js';
import { recommendedPlaysForAccount } from './signalPlayMap.js';
import { getAccountsForOwner } from './accounts.js';

const PINNED_PLAN_KEY = 'rgi-copilot-pinned-plan';
const subscribers = new Set();

function notify() {
  for (const cb of subscribers) {
    try { cb(); } catch { /* isolate subscriber errors */ }
  }
}

// Generate today's plan for a persona.
// Ranks accounts by weight × time-sensitivity; picks top N with plays.
export function generateDayPlan(personaId, { limit = 6 } = {}) {
  const scope = resolveTargetScope(personaId);
  const accounts = getAccountsForOwner(personaId) || [];
  const accountsById = new Map(accounts.map((a) => [a.id, a]));

  const rows = [];
  for (const accountId of scope.accountIds || []) {
    const firings = listFiringsForAccount(accountId);
    if (!firings.length) continue;
    const account = accountsById.get(accountId);
    if (!account) continue;

    // Time-sensitivity: competitor renewal accelerates (renewals matter today)
    const hasRenewal = firings.some((f) => f.signalId === 'competitor_renewal_window');
    const tsMultiplier = hasRenewal ? 1.3 : 1.0;
    const weight = Math.round(
      firings.reduce((s, f) => s + (f.weight || 0), 0) * tsMultiplier
    );

    const plays = recommendedPlaysForAccount(accountId, { limit: 3 });
    if (!plays.length) continue;

    // Headline — the highest-weight firing gets its rationale as the reason.
    const primaryPlay = plays[0];
    rows.push({
      accountId,
      accountName: account.name,
      accountLogo: account.logoColor,
      weight,
      hasRenewal,
      headline: primaryPlay.rationale,
      plays: plays.map((p) => ({
        title: p.title,
        ctaLabel: p.ctaLabel,
        agentId: p.agentId,
      })),
      completed: false,
    });
  }

  rows.sort((a, b) => b.weight - a.weight);
  return {
    generatedAt: new Date().toISOString(),
    scopeSource: scope.source,
    scopeLabel: scope.workbookName || 'Book of Accounts',
    rows: rows.slice(0, limit),
  };
}

// ─── Pin store ───────────────────────────────────────────────────────
export function getPinnedPlan(personaId) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${PINNED_PLAN_KEY}-${personaId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function pinDayPlan(personaId, plan) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`${PINNED_PLAN_KEY}-${personaId}`, JSON.stringify(plan));
  notify();
}

export function unpinDayPlan(personaId) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(`${PINNED_PLAN_KEY}-${personaId}`);
  notify();
}

// Toggle a row's checked state within the pinned plan and persist.
export function toggleDayPlanRow(personaId, accountId) {
  const plan = getPinnedPlan(personaId);
  if (!plan) return;
  const next = {
    ...plan,
    rows: plan.rows.map((r) =>
      r.accountId === accountId ? { ...r, completed: !r.completed } : r
    ),
  };
  pinDayPlan(personaId, next);
}

export function subscribeDayPlan(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}
