// Workbooks — first-class plural workbook objects.
//
// A workbook is a named, scoped table of accounts. Sales Co-Pilot no longer
// lives on "the workbook" — it lives on "the user's chosen workbook"
// out of a set the platform exposes per persona.
//
// Kinds (the source determines refresh + scope):
//   ICP_MATCH         — auto-generated from tenant ICP, top N HG companies by
//                       max-fit across confirmed offerings. Always present
//                       once an ICP is captured.
//   CRM_ACCOUNTS      — every account in the connected CRM (tenant-wide).
//                       Only exists when a CRM is connected.
//   MY_BOOK           — accounts owned by the viewing seller. Only exists
//                       when the seller has assigned accounts.
//   CUSTOM_CSV        — admin- or seller-uploaded CSV. Static rows.
//   PROMOTED_SEGMENT  — snapshot of a Market Analyzer segment "promoted" into
//                       Sales Co-Pilot. Static rows, one-way (re-promote to
//                       refresh).
//
// Visibility:
//   organization — every member of the tenant can see + use
//   private      — only the owner sees it
//   role:admin   — only admins see it (e.g. CRM_ACCOUNTS by default)
//
// Permission rules for what a persona sees:
//   Admin   — every workbook in the tenant
//   Seller  — ICP_MATCH, own MY_BOOK, own CUSTOM_CSV, organization-visible
//             CUSTOM_CSV + PROMOTED_SEGMENT. Not other sellers' books.

import { OFFERINGS } from './offerings.js';
import { getFitFor } from './accountOfferingFit.js';
import { getMarketAnalyzerCompanies } from './marketAnalyzerCompanies.js';
import { ACCOUNTS_BY_OWNER, getAccountsForOwner } from './accounts.js';
import { CRM_ONLY_ACCOUNTS } from './unifiedWorkbook.js';

export const WORKBOOK_KINDS = {
  ICP_MATCH: 'ICP_MATCH',
  CRM_ACCOUNTS: 'CRM_ACCOUNTS',
  MY_BOOK: 'MY_BOOK',
  CUSTOM_CSV: 'CUSTOM_CSV',
  PROMOTED_SEGMENT: 'PROMOTED_SEGMENT',
};

export const WORKBOOK_KIND_META = {
  ICP_MATCH: {
    label: 'ICP Match',
    description: 'HG companies matching your tenant ICP, ranked by best fit across offerings.',
    refresh: 'live',
    tone: 'violet',
    icon: 'Sparkles',
  },
  CRM_ACCOUNTS: {
    label: 'CRM Accounts',
    description: 'All accounts in your connected CRM.',
    refresh: 'live',
    tone: 'sky',
    icon: 'Plug',
  },
  MY_BOOK: {
    label: 'My Book',
    description: 'Accounts assigned to you.',
    refresh: 'derived',
    tone: 'primary',
    icon: 'BookOpen',
  },
  CUSTOM_CSV: {
    label: 'Custom · CSV',
    description: 'Uploaded list. Re-upload to refresh.',
    refresh: 'static',
    tone: 'emerald',
    icon: 'Upload',
  },
  PROMOTED_SEGMENT: {
    label: 'From Market Analyzer',
    description: 'Snapshot of an MA segment promoted into Sales Co-Pilot.',
    refresh: 'snapshot',
    tone: 'amber',
    icon: 'Layers',
  },
};

// ICP_MATCH ranking constants — see brainstorm: max-fit across offerings,
// cap at top 1000.
const ICP_MATCH_CAP = 1000;

// ─── Row-source resolvers ──────────────────────────────────────────────
//
// Each kind returns an array of "account-shaped" rows. The Workbook table
// already knows how to render this shape, so the rest of the workbook
// machinery (sorting, columns, enrichment) needs no changes.

// Deterministic synthesizer — used only when a company has no curated
// fit score for any offering. For the prototype this gives every ICP
// Match row a plausible best-fit score (40–95) anchored on industry +
// size + a stable hash, so the workbook always demonstrates the
// ranking. In production this comes from the real scoring service.
const INDUSTRY_WEIGHTS = [
  { match: /bank|financ/i, weight: 22 },
  { match: /tech|software|comput|electron/i, weight: 20 },
  { match: /health|pharma|insur/i, weight: 16 },
  { match: /retail|consumer/i, weight: 10 },
  { match: /telecom|media/i, weight: 12 },
  { match: /energy|manufactur/i, weight: 8 },
];

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function parseEmployees(str) {
  if (!str) return 0;
  const m = String(str).match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const suffix = (m[2] || '').toUpperCase();
  if (suffix === 'K') return n * 1_000;
  if (suffix === 'M') return n * 1_000_000;
  return n;
}

function synthesizeBestFit(company, offerings) {
  // Base score 40, plus industry weight, plus size signal, plus stable
  // per-company variance. Capped to 95 so it always looks realistic.
  let base = 40;
  const industry = company.industry || '';
  const ind = INDUSTRY_WEIGHTS.find((w) => w.match.test(industry));
  if (ind) base += ind.weight;
  const emp = parseEmployees(company.fai?.employees);
  if (emp >= 100_000) base += 15;
  else if (emp >= 10_000) base += 12;
  else if (emp >= 1_000) base += 8;
  else if (emp >= 200) base += 4;
  // Per-offering synthetic scores — small offset per offering off the
  // base so different offerings produce different rankings for the same
  // company. Stable via hash.
  const synthFits = {};
  let bestScore = 0;
  let bestOfferingId = null;
  for (const o of offerings) {
    const offset = (hashString((company.id || company.name || '') + o.id) % 30) - 12;
    const s = Math.max(0, Math.min(95, Math.round(base + offset)));
    synthFits[o.id] = { score: s, reasons: ['Synthesized — heuristic fit based on industry + size'] };
    if (s > bestScore) {
      bestScore = s;
      bestOfferingId = o.id;
    }
  }
  return { bestFit: bestScore, bestOfferingId, synthFits };
}

function resolveIcpMatchRows() {
  const offerings = OFFERINGS.filter((o) => o.confirmed !== false);
  const companies = getMarketAnalyzerCompanies();
  const scored = companies.map((c) => {
    // Prefer curated scores when present.
    let bestScore = 0;
    let bestOfferingId = null;
    for (const o of offerings) {
      const fit = getFitFor(c.id, o.id);
      const score = fit?.score ?? 0;
      if (score > bestScore) {
        bestScore = score;
        bestOfferingId = o.id;
      }
    }
    // Fall back to synthesizer when nothing curated exists. The
    // synthFits map is attached to the row so the per-offering score
    // columns in the table can render values (read via the table's
    // resolveOfferingFit fallback chain).
    let synthFits = null;
    if (bestScore === 0) {
      const synth = synthesizeBestFit(c, offerings);
      bestScore = synth.bestFit;
      bestOfferingId = synth.bestOfferingId;
      synthFits = synth.synthFits;
    }
    return {
      ...c,
      bestFit: bestScore,
      bestOfferingId,
      synthFits,
      source: 'icp_match',
    };
  });
  return scored
    .sort((a, b) => (b.bestFit || 0) - (a.bestFit || 0))
    .slice(0, ICP_MATCH_CAP);
}

function resolveCrmAccountsRows() {
  // For the prototype the "CRM Accounts" workbook is the union of every
  // account_owner's book + the CRM-only stubs (rows that came from the
  // CRM but didn't match HG). In production this hits the CRM sync.
  const everyOwnerBook = getAccountsForOwner('alex'); // seed has one owner
  const stamped = everyOwnerBook.map((a) => ({ ...a, source: 'crm' }));
  const orphans = CRM_ONLY_ACCOUNTS.map((a) => ({ ...a, source: 'crm' }));
  return [...stamped, ...orphans];
}

function resolveMyBookRows(ownerId) {
  const book = getAccountsForOwner(ownerId);
  return book.map((a) => ({ ...a, source: 'crm' }));
}

function resolveCustomCsvRows(workbook) {
  // Static rows stored on the workbook object itself when it was created.
  return workbook.rows || [];
}

function resolvePromotedSegmentRows(workbook) {
  return workbook.rows || [];
}

export function resolveWorkbookRows(workbook) {
  if (!workbook) return [];
  switch (workbook.kind) {
    case WORKBOOK_KINDS.ICP_MATCH:
      return resolveIcpMatchRows();
    case WORKBOOK_KINDS.CRM_ACCOUNTS:
      return resolveCrmAccountsRows();
    case WORKBOOK_KINDS.MY_BOOK:
      return resolveMyBookRows(workbook.ownerId);
    case WORKBOOK_KINDS.CUSTOM_CSV:
      return resolveCustomCsvRows(workbook);
    case WORKBOOK_KINDS.PROMOTED_SEGMENT:
      return resolvePromotedSegmentRows(workbook);
    default:
      return [];
  }
}

// ─── Seed registry ────────────────────────────────────────────────────
//
// Each tenant gets a base set of system workbooks. Custom CSV + promoted
// segments are user-created (we'll seed two examples so the picker isn't
// empty in the demo).

const NOW = '2026-06-23';

// Helper — derive an accountCount for the seed without resolving rows
// eagerly. Resolved lazily by the caller via resolveWorkbookRows().
function seedWorkbook({ id, kind, name, ownerId = null, ownerName = null, visibility = 'organization', accountCount = 0, rows = null }) {
  return {
    id,
    kind,
    name,
    ownerId,
    ownerName,
    visibility,
    createdAt: NOW,
    updatedAt: NOW,
    accountCount,
    rows,
    archived: false,
  };
}

export const SEED_WORKBOOKS = [
  seedWorkbook({
    id: 'wb-icp-match',
    kind: WORKBOOK_KINDS.ICP_MATCH,
    name: 'ICP Match',
    visibility: 'organization',
    // accountCount is filled in by listWorkbooksForPersona at read time
  }),
  seedWorkbook({
    id: 'wb-crm-accounts',
    kind: WORKBOOK_KINDS.CRM_ACCOUNTS,
    name: 'CRM Accounts',
    visibility: 'organization',
  }),
  seedWorkbook({
    id: 'wb-my-book-alex',
    kind: WORKBOOK_KINDS.MY_BOOK,
    // Display name is consistent regardless of viewer — each seller's
    // dropdown shows "Book of Accounts" for their own book. Admins
    // don't see other sellers' books at all (see permissionCheck).
    name: 'Book of Accounts',
    ownerId: 'alex',
    ownerName: 'Alex Chen',
    visibility: 'private',
  }),
  // Example custom CSV — admin-uploaded org-visible book of Q3 targets.
  seedWorkbook({
    id: 'wb-custom-q3-takeout',
    kind: WORKBOOK_KINDS.CUSTOM_CSV,
    name: 'Q3 Competitive Takeout · Banking',
    ownerId: 'priya',
    ownerName: 'Priya Sharma',
    visibility: 'organization',
    rows: [], // will be populated lazily; the picker shows count via accountCount
    accountCount: 24,
  }),
];

// Mutable list — new uploads / promotions push here.
const WORKBOOKS = [...SEED_WORKBOOKS];

// CRM-connection awareness — drives whether CRM_ACCOUNTS + MY_BOOK
// workbooks should be exposed. In the prototype we let the caller pass
// this in (resolved via integrationGovernance or DemoContext).
function shouldShowCrm(kind, { crmConnected }) {
  if (kind === WORKBOOK_KINDS.CRM_ACCOUNTS) return crmConnected;
  if (kind === WORKBOOK_KINDS.MY_BOOK) return crmConnected;
  return true;
}

// Promoted workbooks are admin-only until at least one row has been
// routed (ownerSellerId set). The moment routing happens the workbook
// auto-promotes to org-visible so sellers can pick it up.
function isPromotedWorkbookReadyForSellers(workbook) {
  if (workbook.kind !== WORKBOOK_KINDS.PROMOTED_SEGMENT) return true;
  const rows = Array.isArray(workbook.rows) ? workbook.rows : [];
  return rows.some((r) => r?.ownerSellerId);
}

function permissionCheck(workbook, { personaId, isAdmin }) {
  // Book of Accounts is strictly per-owner — even admins only see their
  // own book. Each user's Book of Accounts is their own slice; admins
  // don't browse other sellers' books here (Territory Design is where
  // admins route + inspect other sellers' books).
  if (workbook.kind === WORKBOOK_KINDS.MY_BOOK) {
    return workbook.ownerId === personaId;
  }
  if (isAdmin) return true;
  // Seller — can see organization-visible workbooks + own private ones.
  // Promoted workbooks are gated on at least one routed row.
  if (workbook.visibility === 'admin_only') return false;
  if (
    workbook.kind === WORKBOOK_KINDS.PROMOTED_SEGMENT &&
    !isPromotedWorkbookReadyForSellers(workbook)
  ) {
    return false;
  }
  if (workbook.visibility === 'organization') return true;
  if (workbook.visibility === 'private' && workbook.ownerId === personaId) return true;
  return false;
}

// ─── Public queries ───────────────────────────────────────────────────

export function listWorkbooksForPersona({ personaId, isAdmin = false, crmConnected = false } = {}) {
  return WORKBOOKS.filter((wb) => !wb.archived)
    .filter((wb) => shouldShowCrm(wb.kind, { crmConnected }))
    .filter((wb) => permissionCheck(wb, { personaId, isAdmin }))
    .map((wb) => {
      // Hydrate accountCount lazily for system workbooks so the picker shows
      // accurate counts without forcing the caller to resolve rows for every
      // workbook in the list.
      if (wb.kind === WORKBOOK_KINDS.ICP_MATCH && wb.accountCount === 0) {
        return { ...wb, accountCount: resolveIcpMatchRows().length };
      }
      if (wb.kind === WORKBOOK_KINDS.CRM_ACCOUNTS && wb.accountCount === 0) {
        return { ...wb, accountCount: resolveCrmAccountsRows().length };
      }
      if (wb.kind === WORKBOOK_KINDS.MY_BOOK && wb.accountCount === 0) {
        return { ...wb, accountCount: resolveMyBookRows(wb.ownerId).length };
      }
      return wb;
    })
    // Hide empty Book of Accounts rows — a persona without any owned
    // accounts shouldn't see a "0 accounts" entry cluttering the dropdown.
    .filter((wb) => !(wb.kind === WORKBOOK_KINDS.MY_BOOK && wb.accountCount === 0));
}

export function getWorkbook(id) {
  return WORKBOOKS.find((wb) => wb.id === id) || null;
}

// Default workbook per persona — what /workbook (no id) redirects to.
// Admin → ICP Match. Seller → My Book if non-empty, else ICP Match.
export function getDefaultWorkbookForPersona({ personaId, isAdmin = false, crmConnected = false }) {
  const list = listWorkbooksForPersona({ personaId, isAdmin, crmConnected });
  if (!isAdmin) {
    const myBook = list.find((wb) => wb.kind === WORKBOOK_KINDS.MY_BOOK && wb.ownerId === personaId);
    if (myBook && myBook.accountCount > 0) return myBook;
  }
  return (
    list.find((wb) => wb.kind === WORKBOOK_KINDS.ICP_MATCH) ||
    list[0] ||
    null
  );
}

// Create a new Custom CSV workbook from an uploaded file. The caller
// pre-parses the CSV into account-shaped rows.
export function createCustomWorkbook({ name, rows, ownerId, ownerName, visibility = 'private' }) {
  const wb = seedWorkbook({
    id: `wb-custom-${Date.now()}`,
    kind: WORKBOOK_KINDS.CUSTOM_CSV,
    name,
    ownerId,
    ownerName,
    visibility,
    rows,
    accountCount: rows.length,
  });
  WORKBOOKS.unshift(wb);
  return wb;
}

// True when a workbook with this name already exists (case-insensitive,
// trimmed). Used by the push-segment modal to enforce uniqueness so the
// switcher dropdown never shows two identically-named workbooks.
export function isWorkbookNameTaken(name) {
  if (!name) return false;
  const target = String(name).trim().toLowerCase();
  return WORKBOOKS.some((w) => !w.archived && (w.name || '').trim().toLowerCase() === target);
}

// Build a domain → existing-tenant-account index used by the segment
// push merge logic. In production this is a single tenant query; for the
// prototype we union every owner's book + CRM-only orphans. Domain is
// normalized (lowercase, strip 'www.', trailing slash) for forgiving
// matches when MA seed data and book seed data drift.
function normalizeDomain(d) {
  if (!d) return null;
  return String(d).trim().toLowerCase().replace(/^www\./, '').replace(/\/+$/, '');
}
function getTenantAccountIndex() {
  const index = new Map();
  for (const ownerId of Object.keys(ACCOUNTS_BY_OWNER || {})) {
    for (const a of ACCOUNTS_BY_OWNER[ownerId] || []) {
      const d = normalizeDomain(a.url);
      if (d) index.set(d, { ...a, ownerSellerId: ownerId });
    }
  }
  for (const a of CRM_ONLY_ACCOUNTS) {
    const d = normalizeDomain(a.url);
    if (d) index.set(d, { ...a, ownerSellerId: a.ownerIds?.[0] || null });
  }
  return index;
}

// Promote a Market Analyzer segment into a Sales Co-Pilot workbook.
// Snapshot — rows are frozen at promotion time. Returns the new
// workbook on success, or { error } if the name is already taken.
//
// Merge-by-domain semantics:
//   - For each row, look up an existing tenant account by domain (url).
//   - If matched: stamp `existingAccountId` + `ownerSellerId` on the row
//     so the workbook references the canonical account. Owner stays.
//   - If not matched: row is "net-new" and will need routing via
//     Territory Design. ownerSellerId = null.
// The resulting workbook carries a merge summary so the SC header can
// render "247 accounts · 47 already in book · 200 net-new need routing".
//
// Visibility for PROMOTED_SEGMENT workbooks defaults to `admin_only`.
// listWorkbooksForPersona flips it to org-visible the moment any row
// has an owner assigned.
export function promoteSegmentToWorkbook({
  segmentId,
  segmentName,
  name,
  rows,
  ownerId,
  ownerName,
  visibility = 'admin_only',
}) {
  const effectiveName = (name && name.trim()) || `${segmentName} (from MA)`;
  if (isWorkbookNameTaken(effectiveName)) {
    return { error: 'name_taken', triedName: effectiveName };
  }
  // Merge by domain — link to existing tenant accounts where possible.
  const tenantIndex = getTenantAccountIndex();
  let mergedCount = 0;
  let netNewCount = 0;
  const mergedRows = rows.map((row) => {
    const d = normalizeDomain(row.url);
    const existing = d ? tenantIndex.get(d) : null;
    if (existing) {
      mergedCount += 1;
      return {
        ...row,
        existingAccountId: existing.id,
        ownerSellerId: existing.ownerSellerId || null,
        // Keep the canonical name + logo so the workbook table looks
        // consistent with My Book / CRM Accounts.
        name: existing.name || row.name,
        logoColor: existing.logoColor || row.logoColor,
      };
    }
    netNewCount += 1;
    return {
      ...row,
      existingAccountId: null,
      ownerSellerId: null,
    };
  });
  const wb = {
    ...seedWorkbook({
      id: `wb-promoted-${segmentId}-${Date.now()}`,
      kind: WORKBOOK_KINDS.PROMOTED_SEGMENT,
      name: effectiveName,
      ownerId,
      ownerName,
      visibility,
      rows: mergedRows,
      accountCount: mergedRows.length,
    }),
    sourceSegmentId: segmentId,
    sourceSegmentName: segmentName,
    promotedAt: new Date().toISOString(),
    promotedBy: ownerName || ownerId || null,
    // Merge summary — used by the workbook header to surface routing
    // load. needsRoutingCount = net-new accounts that don't yet have
    // an owner assigned.
    mergeSummary: {
      totalRows: mergedRows.length,
      mergedCount,
      netNewCount,
      needsRoutingCount: netNewCount,
    },
  };
  WORKBOOKS.unshift(wb);
  return wb;
}

export function archiveWorkbook(id) {
  const wb = WORKBOOKS.find((w) => w.id === id);
  if (wb) wb.archived = true;
}

// Tier metadata used by the picker UI.
export function getWorkbookKindMeta(kind) {
  return WORKBOOK_KIND_META[kind] || {};
}

// ─── Per-seller book placeholder ──────────────────────────────────────
//
// Plays can target "each seller's own Book of Accounts" instead of a
// specific workbook id. The placeholder lives on the play as
// workbookIds: [PER_SELLER_BOOK_ID]; at render time the workbook
// resolver substitutes the viewing persona's MY_BOOK id.
//
// Only meaningful when CRM is connected — the admin picker hides this
// option in no-CRM mode since Book of Accounts is CRM-derived.
export const PER_SELLER_BOOK_ID = 'wb-my-book-tenant';

export const PER_SELLER_BOOK_META = {
  id: PER_SELLER_BOOK_ID,
  kind: WORKBOOK_KINDS.MY_BOOK,
  name: 'Each seller\'s Book of Accounts',
  description: 'Runs per-seller. Every AE works this play on their own book.',
  visibility: 'organization',
  isPerSellerPlaceholder: true,
};

// Resolve play's workbookIds → an effective workbook id list for a
// specific viewer. The only translation today: PER_SELLER_BOOK_ID →
// wb-my-book-<personaId>. Unknown ids pass through unchanged so the
// caller can fall back to existing logic.
export function resolveEffectiveWorkbookIdsForPlay(play, personaId) {
  const ids = Array.isArray(play?.workbookIds) ? play.workbookIds : [];
  return ids.map((id) => {
    if (id === PER_SELLER_BOOK_ID) {
      // Convention: each seller's book is seeded as wb-my-book-<personaId>.
      // If that workbook doesn't exist yet (seller not seeded), the
      // upstream getWorkbook() will return null and the route will fall
      // back to ICP Match.
      return `wb-my-book-${personaId}`;
    }
    return id;
  });
}

// ─── Row routing (no-CRM mode) ─────────────────────────────────────────
//
// In no-CRM mode admins assign owners to workbook rows manually — either
// inline (one row at a time) or via the bulk routing screen at
// /admin/territory/workbook/:id. These helpers mutate the workbook's
// rows + mergeSummary in place and emit a change event so subscribers
// re-read. Only PROMOTED_SEGMENT and CUSTOM_CSV workbooks have routable
// rows; system workbooks (ICP Match, CRM Accounts, Book of Accounts)
// derive ownership from CRM/book and are immutable here.

const WORKBOOK_CHANGE_EVENT = 'rgi-workbook-changed';

function emitWorkbookChange(workbookId) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent(WORKBOOK_CHANGE_EVENT, { detail: { workbookId } }),
    );
  } catch {
    // ignore — non-browser environments
  }
}

export function subscribeWorkbookChanges(cb) {
  if (typeof window === 'undefined') return () => {};
  const handler = (e) => cb(e.detail?.workbookId);
  window.addEventListener(WORKBOOK_CHANGE_EVENT, handler);
  return () => window.removeEventListener(WORKBOOK_CHANGE_EVENT, handler);
}

// Stable row id for assignment APIs. Rows from promoteSegmentToWorkbook
// always carry `id`; CSV rows we create elsewhere get `id` too. Fall back
// to url+name composite for older seed data.
function rowKey(row) {
  return row?.id || `${row?.url || ''}::${row?.name || ''}`;
}

function isRoutableKind(kind) {
  return kind === WORKBOOK_KINDS.PROMOTED_SEGMENT || kind === WORKBOOK_KINDS.CUSTOM_CSV;
}

function recomputeMergeSummary(workbook) {
  const rows = Array.isArray(workbook.rows) ? workbook.rows : [];
  const merged = rows.filter((r) => r?.existingAccountId).length;
  const routed = rows.filter((r) => r?.ownerSellerId).length;
  const needsRouting = rows.length - routed;
  return {
    totalRows: rows.length,
    mergedCount: merged,
    netNewCount: rows.length - merged,
    routedCount: routed,
    needsRoutingCount: needsRouting,
  };
}

// Single-row owner assignment. Pass ownerSellerId=null to unassign.
export function assignWorkbookRowOwner(workbookId, rowId, ownerSellerId) {
  const wb = WORKBOOKS.find((w) => w.id === workbookId);
  if (!wb || !isRoutableKind(wb.kind)) {
    return { error: 'not_routable', workbookId };
  }
  const rows = Array.isArray(wb.rows) ? wb.rows : [];
  let touched = false;
  wb.rows = rows.map((r) => {
    if (rowKey(r) !== rowId) return r;
    touched = true;
    return { ...r, ownerSellerId: ownerSellerId || null };
  });
  if (!touched) return { error: 'row_not_found', workbookId, rowId };
  wb.mergeSummary = recomputeMergeSummary(wb);
  emitWorkbookChange(workbookId);
  return { workbook: wb };
}

// Bulk owner assignment — same ownerSellerId across many rows.
export function bulkAssignWorkbookRows(workbookId, { rowIds, ownerSellerId }) {
  const wb = WORKBOOKS.find((w) => w.id === workbookId);
  if (!wb || !isRoutableKind(wb.kind)) {
    return { error: 'not_routable', workbookId };
  }
  const ids = new Set(rowIds || []);
  if (ids.size === 0) return { workbook: wb, updated: 0 };
  let updated = 0;
  wb.rows = (wb.rows || []).map((r) => {
    if (!ids.has(rowKey(r))) return r;
    updated += 1;
    return { ...r, ownerSellerId: ownerSellerId || null };
  });
  wb.mergeSummary = recomputeMergeSummary(wb);
  emitWorkbookChange(workbookId);
  return { workbook: wb, updated };
}

// Rule-based auto-routing across rows that still need an owner. Rules:
//   - { type: 'round_robin', sellerIds }
//   - { type: 'by_region', mapping: { [region]: sellerId }, fallbackSellerId? }
//   - { type: 'by_industry', mapping: { [industry]: sellerId }, fallbackSellerId? }
// Returns { updated, skipped } so the UI can surface "200 of 247 routed,
// 47 skipped (no rule match)".
export function autoRouteWorkbookRows(workbookId, rule) {
  const wb = WORKBOOKS.find((w) => w.id === workbookId);
  if (!wb || !isRoutableKind(wb.kind)) {
    return { error: 'not_routable', workbookId };
  }
  const rows = wb.rows || [];
  let updated = 0;
  let skipped = 0;
  let rrIndex = 0;
  const rrIds = Array.isArray(rule?.sellerIds) ? rule.sellerIds : [];

  wb.rows = rows.map((r) => {
    if (r.ownerSellerId) return r; // already routed — leave alone
    let next = null;
    if (rule?.type === 'round_robin' && rrIds.length > 0) {
      next = rrIds[rrIndex % rrIds.length];
      rrIndex += 1;
    } else if (rule?.type === 'by_region') {
      next = rule.mapping?.[r.region] || rule.fallbackSellerId || null;
    } else if (rule?.type === 'by_industry') {
      next = rule.mapping?.[r.industry] || rule.fallbackSellerId || null;
    }
    if (next) {
      updated += 1;
      return { ...r, ownerSellerId: next };
    }
    skipped += 1;
    return r;
  });
  wb.mergeSummary = recomputeMergeSummary(wb);
  emitWorkbookChange(workbookId);
  return { workbook: wb, updated, skipped };
}

// Read helper — returns the routing breakdown grouped by owner. Used by
// the bulk routing screen to show "Sarah Kim · 47 accounts queued".
export function getWorkbookRoutingSummary(workbookId) {
  const wb = WORKBOOKS.find((w) => w.id === workbookId);
  if (!wb) return null;
  const rows = wb.rows || [];
  const byOwner = new Map();
  let unassigned = 0;
  for (const r of rows) {
    if (!r.ownerSellerId) {
      unassigned += 1;
      continue;
    }
    byOwner.set(r.ownerSellerId, (byOwner.get(r.ownerSellerId) || 0) + 1);
  }
  return {
    workbook: wb,
    totalRows: rows.length,
    unassigned,
    byOwner: Array.from(byOwner.entries()).map(([sellerId, count]) => ({ sellerId, count })),
  };
}
