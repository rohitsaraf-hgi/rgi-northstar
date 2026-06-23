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
import { getAccountsForOwner } from './accounts.js';
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

function resolveIcpMatchRows() {
  const offerings = OFFERINGS.filter((o) => o.confirmed !== false);
  const companies = getMarketAnalyzerCompanies();
  const scored = companies.map((c) => {
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
    return {
      ...c,
      bestFit: bestScore,
      bestOfferingId,
      // Source stamp so the table can render the origin chip if needed.
      source: 'icp_match',
    };
  });
  // Sort by best-fit desc, drop zero-fit (no scored offerings at all),
  // and cap.
  return scored
    .filter((r) => r.bestFit > 0)
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
    name: "Alex's Book",
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

function permissionCheck(workbook, { personaId, isAdmin }) {
  if (isAdmin) return true;
  // Seller — can see organization-visible workbooks + own private ones.
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
    });
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

// Promote a Market Analyzer segment into a Sales Co-Pilot workbook.
// Snapshot — rows are frozen at promotion time. Re-promote to refresh.
export function promoteSegmentToWorkbook({ segmentId, segmentName, rows, ownerId, ownerName }) {
  const wb = seedWorkbook({
    id: `wb-promoted-${segmentId}-${Date.now()}`,
    kind: WORKBOOK_KINDS.PROMOTED_SEGMENT,
    name: `${segmentName} (from MA)`,
    ownerId,
    ownerName,
    visibility: 'organization',
    rows,
    accountCount: rows.length,
  });
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
