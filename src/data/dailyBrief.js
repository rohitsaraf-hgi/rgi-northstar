// Daily Brief data helpers.
//
// The Brief is a landing page that reframes existing per-account state
// into three sections:
//   1. What needs you — pending approvals + triggered plays + meeting prep
//   2. Signals grouped by type — with counts + top account chips
//   3. Sales Play activity — per-play cards with outcome bars
//
// This file derives everything from existing stores (no new persistence).

import { getAccountsForOwner, SIGNAL_TYPES } from './accounts.js';
import { listPlays } from './plays.js';
import { runStats, runsForPlaybook } from './agentRuns.js';
import {
  listPendingCheckpoints,
  listSignalTriggeredPlays,
} from './sellerInbox.js';
import {
  listWorkbooksForPersona,
  resolveWorkbookRows,
  WORKBOOK_KINDS,
} from './workbooks.js';

// Meeting-prep mock — synthesized per persona so the "meetings needing prep"
// row on the Brief lands populated. Kept minimal for the demo.
const MEETINGS_BY_PERSONA = {
  alex: [
    {
      id: 'mtg-1',
      accountId: 'acct-jpmc',
      accountName: 'JPMorgan Chase',
      attendees: 'Sarah Chen (CISO) + Diana Park (VP)',
      when: 'today · 2:00 PM',
      whenRelative: 'in 4 hours',
      duration: '45 min',
      hasPrepBrief: false,
    },
  ],
  riley: [
    {
      id: 'mtg-2',
      accountId: 'acct-databricks',
      accountName: 'Databricks',
      attendees: 'Tim Chen (Head of Platform Security)',
      when: 'today · 4:30 PM',
      whenRelative: 'in 6 hours',
      duration: '30 min',
      hasPrepBrief: false,
    },
    {
      id: 'mtg-3',
      accountId: 'acct-acme',
      accountName: 'Acme Corp',
      attendees: 'Sarah Chen + Marcus Reeve',
      when: 'tomorrow · 10:00 AM',
      whenRelative: 'in 20 hours',
      duration: '60 min',
      hasPrepBrief: true,
    },
  ],
  jordan: [],
  priya: [],
};

export function listMeetingsNeedingPrep(personaId) {
  const all = MEETINGS_BY_PERSONA[personaId] || [];
  // Prep needed = no brief yet + happening within the next 24h.
  return all.filter((m) => !m.hasPrepBrief);
}

// -----------------------------------------------------------------------------
// Signal grouping
// -----------------------------------------------------------------------------

// Signal categories displayed as tiles on the Brief. We fold the existing
// SIGNAL_TYPES (intent_surge / web_event / crm_activity / no_touch) plus two
// synthesized categories (champion_move, firmographic_event) derived from
// signal headlines/details.
export const BRIEF_SIGNAL_CATEGORIES = {
  intent_surge: {
    id: 'intent_surge',
    label: 'Intent surge',
    hint: 'TrustRadius comparisons, G2 category shifts',
    icon: 'TrendingUp',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  web_event: {
    id: 'web_event',
    label: 'Website activity',
    hint: 'Pricing, docs, integrations pages',
    icon: 'Globe',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  champion_move: {
    id: 'champion_move',
    label: 'Champion movement',
    hint: 'Tracked contacts changing jobs',
    icon: 'UserCog',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
  firmographic_event: {
    id: 'firmographic_event',
    label: 'Firmographic events',
    hint: 'Funding, exec hires, restructuring',
    icon: 'Building2',
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
  },
  crm_activity: {
    id: 'crm_activity',
    label: 'CRM changes',
    hint: 'Stage moves, new contacts, opp updates',
    icon: 'Activity',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
};

// Best-effort classifier — pick a category for a raw signal based on its
// type + headline keywords. Signals with type='no_touch' are excluded from
// the Brief (they're a stale-indicator, not a positive event to surface).
function classifySignal(sig) {
  if (!sig) return null;
  const text = `${sig.headline || ''} ${sig.detail || ''}`.toLowerCase();
  if (sig.type === 'no_touch') return null;
  if (/champion|job change|left|departed|joined/.test(text)) return 'champion_move';
  if (/funding|raised|series [a-h]|acquisition|layoff|new (ciso|cto|cio|cfo|vp)/.test(text)) return 'firmographic_event';
  if (sig.type === 'intent_surge') return 'intent_surge';
  if (sig.type === 'web_event') return 'web_event';
  if (sig.type === 'crm_activity') return 'crm_activity';
  return sig.type || 'crm_activity';
}

// Return the list of workbooks a persona sees in the picker, plus counts
// used by the scoper chip row on the Brief. `CONTACT_LIST` workbooks are
// included but marked so the UI can render them differently.
export function listBriefWorkbooks(personaId) {
  const wbs = listWorkbooksForPersona({ personaId, isAdmin: false, crmConnected: true });
  return wbs.map((w) => ({
    id: w.id,
    name: w.name,
    kind: w.kind,
    isContactList: w.kind === WORKBOOK_KINDS.CONTACT_LIST,
    accountCount: w.accountCount ?? (w.rows?.length || 0),
  }));
}

// Which workbooks contain a given account id? Reads through every workbook
// visible to the persona and checks membership. Contact-list workbooks
// contribute via each contact row's companyAccountId back-pointer.
function buildAccountWorkbookMemberships(personaId) {
  const wbs = listWorkbooksForPersona({ personaId, isAdmin: false, crmConnected: true });
  const map = new Map(); // accountId → Set(workbookId)
  for (const wb of wbs) {
    try {
      const rows = resolveWorkbookRows(wb);
      if (wb.kind === WORKBOOK_KINDS.CONTACT_LIST) {
        for (const c of rows) {
          const aid = c.companyAccountId;
          if (!aid) continue;
          if (!map.has(aid)) map.set(aid, new Set());
          map.get(aid).add(wb.id);
        }
      } else {
        for (const r of rows) {
          const aid = r.id || r.accountId;
          if (!aid) continue;
          if (!map.has(aid)) map.set(aid, new Set());
          map.get(aid).add(wb.id);
        }
      }
    } catch {
      // Skip any workbook that fails to resolve.
    }
  }
  return map;
}

// Public wrapper — returns a plain map so consumers can render badges
// per row without caring about the underlying Set semantics.
export function getWorkbookMemberships(personaId) {
  const map = buildAccountWorkbookMemberships(personaId);
  const out = {};
  for (const [aid, set] of map.entries()) {
    out[aid] = Array.from(set);
  }
  return out;
}

// Narrow a list of accounts to those in the given workbook. If workbookId is
// falsy or 'all', the list is passed through unchanged.
function filterAccountsByWorkbook(accounts, personaId, workbookId) {
  if (!workbookId || workbookId === 'all') return accounts;
  const memberships = buildAccountWorkbookMemberships(personaId);
  return accounts.filter((a) => memberships.get(a.id)?.has(workbookId));
}

// Group the persona's accounts by signal category. Only signals within
// `windowDays` are counted (default 7). Each entry:
//   { category, count, accounts: [{ id, name, headline, daysAgo, logoColor,
//                                   workbookIds: string[] }] }
// The optional `workbookId` scoper narrows the account universe first.
export function groupSignalsForBrief(personaId, { windowDays = 7, workbookId = 'all' } = {}) {
  let accounts = getAccountsForOwner(personaId) || [];
  accounts = filterAccountsByWorkbook(accounts, personaId, workbookId);
  const memberships = buildAccountWorkbookMemberships(personaId);
  const buckets = {};
  for (const key of Object.keys(BRIEF_SIGNAL_CATEGORIES)) {
    buckets[key] = { category: BRIEF_SIGNAL_CATEGORIES[key], count: 0, accounts: [] };
  }
  for (const account of accounts) {
    const sigs = (account.signals || []).filter((s) => (s.daysAgo ?? 99) <= windowDays);
    // Pick the account's strongest signal per category (dedup — one account
    // shouldn't count twice in the same bucket).
    const seenCats = new Set();
    for (const sig of sigs) {
      const cat = classifySignal(sig);
      if (!cat || !buckets[cat] || seenCats.has(cat)) continue;
      seenCats.add(cat);
      buckets[cat].count += 1;
      buckets[cat].accounts.push({
        id: account.id,
        name: account.name,
        logoColor: account.logoColor,
        headline: sig.headline,
        detail: sig.detail,
        daysAgo: sig.daysAgo,
        strength: sig.strength,
        workbookIds: Array.from(memberships.get(account.id) || []),
      });
    }
  }
  return Object.values(buckets).filter((b) => b.count > 0);
}

// -----------------------------------------------------------------------------
// Sales Play activity aggregation
// -----------------------------------------------------------------------------

// Compose per-play activity for the Brief. For each active play, pull:
//   - Recent runs (from AGENT_RUNS via runsForPlaybook)
//   - Pending approval count (checkpoints referencing the play)
//   - Aggregate outcome: completed / waiting_approval / stuck / failed
//
// The mapping from AGENT_RUNS.status to Brief buckets:
//   'success'  → completed
//   'partial'  → stuck  (needs rep attention but not failed)
//   'failed'   → failed
//   'pending'  → waiting_approval
//
// Plays without any runs are omitted from the Brief (nothing to show).
export function summarizePlayActivity(personaId, salesRole, { limit = 8, workbookId = 'all' } = {}) {
  const plays = listPlays();
  const checkpoints = listPendingCheckpoints(personaId, salesRole);
  // If a workbook scoper is active, only surface plays whose workbookIds
  // include it (spec §: plays operate on a workbook).
  const scopedPlays = (workbookId && workbookId !== 'all')
    ? plays.filter((p) => Array.isArray(p.workbookIds) && p.workbookIds.includes(workbookId))
    : plays;
  const summaries = [];

  for (const play of scopedPlays) {
    // A play surfaces on the Brief when either (a) it has recent agent runs
    // for one of its attached workflows, or (b) it has been activated and
    // has batches (batch queue running).
    const workflowIds = play.recommended_workflows || [];
    let runs = [];
    for (const wid of workflowIds) {
      runs = runs.concat(runsForPlaybook(wid, 20));
    }

    // Sort by most-recent timestamp.
    runs.sort((a, b) => (new Date(b.timestamp)) - (new Date(a.timestamp)));

    const completed = runs.filter((r) => r.status === 'success').length;
    const stuck = runs.filter((r) => r.status === 'partial').length;
    const failed = runs.filter((r) => r.status === 'failed').length;

    // Checkpoints tied to this play (bound_signal or workflow_id match).
    const waitingApproval = checkpoints.filter((c) => {
      if (workflowIds.includes(c.workflow_id)) return true;
      if (play.bound_signal && c.bound_signal_id === play.bound_signal) return true;
      return false;
    }).length;

    // Activation batches — treat scheduled batches as work-in-flight.
    const activation = play.activation || {};
    const scheduledBatches = (activation.batches || []).filter((b) => b.status === 'scheduled').length;
    const runningBatches = (activation.batches || []).filter((b) => b.status === 'running').length;

    const totalWork = completed + stuck + failed + waitingApproval + runningBatches;
    if (totalWork === 0 && scheduledBatches === 0) continue;

    summaries.push({
      play,
      completed,
      stuck,
      failed,
      waitingApproval,
      runningBatches,
      scheduledBatches,
      lastRunAt: runs[0]?.timestamp || activation.activatedAt || null,
      totalRuns: runs.length,
      recentRuns: runs.slice(0, 3),
    });
  }

  // Sort by activity volume (largest first) so the busy plays land at top.
  summaries.sort((a, b) => {
    const av = a.completed + a.stuck + a.failed + a.waitingApproval + a.runningBatches;
    const bv = b.completed + b.stuck + b.failed + b.waitingApproval + b.runningBatches;
    return bv - av;
  });

  return summaries.slice(0, limit);
}

// Tiny wrapper so the Brief header can render a one-line summary
// like "12 accounts moved · 3 plays running · 5 items need you".
// Honors the workbook scoper when provided.
export function summarizeBrief(personaId, salesRole, { workbookId = 'all' } = {}) {
  const groups = groupSignalsForBrief(personaId, { workbookId });
  const signalAccountCount = new Set(
    groups.flatMap((g) => g.accounts.map((a) => a.id)),
  ).size;
  const plays = summarizePlayActivity(personaId, salesRole, { workbookId });
  const runningPlays = plays.filter((p) => p.runningBatches > 0 || p.totalRuns > 0).length;
  const checkpoints = listPendingCheckpoints(personaId, salesRole).length;
  const triggered = listSignalTriggeredPlays(personaId).length;
  const meetings = listMeetingsNeedingPrep(personaId).length;
  return {
    signalAccountCount,
    runningPlays,
    needsYou: checkpoints + triggered + meetings,
    checkpoints,
    triggered,
    meetings,
  };
}

// Re-export SIGNAL_TYPES so consumers don't have to import from accounts.js.
export { SIGNAL_TYPES };

// Helper to bring a helper on runStats when the caller needs it.
export { runStats };
