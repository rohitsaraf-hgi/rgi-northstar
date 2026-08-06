// Target scope — which accounts the seller cares about right now.
//
// The Home page is scoped to these accounts, not the rep's whole book.
// Priority chain:
//   1. CRM territory  (if a CRM is connected and the rep has assigned accounts)
//   2. Flagged workbook (rep marked one of their workbooks as "target")
//   3. Book of Accounts (per-seller MY_BOOK) — the default fallback
//
// Persona preference is persisted in localStorage so the rep's target
// selection survives reloads.

import { getAccountsForOwner } from './accounts.js';
import {
  listWorkbooksForPersona,
  resolveWorkbookRows,
  WORKBOOK_KINDS,
  PER_SELLER_BOOK_ID,
} from './workbooks.js';
import { getIntegrationGovernance } from './integrationGovernance.js';

const STORAGE_KEY_PREFIX = 'rgi-target-workbook-';
const CHANGE_EVENT = 'rgi:target-scope-changed';

function keyFor(personaId) {
  return `${STORAGE_KEY_PREFIX}${personaId}`;
}

// Check whether a CRM is connected + agent access is granted. Mirrors
// the check in WorkbookRoute's detectCrmConnected but lives here so
// the resolver is self-contained.
function isCrmConnected() {
  try {
    const sf = getIntegrationGovernance('salesforce');
    const hs = getIntegrationGovernance('hubspot');
    return sf?.agentAccess === true || hs?.agentAccess === true;
  } catch {
    return false;
  }
}

// ─── Persona preferences (localStorage) ──────────────────────────────────

export function getFlaggedTargetWorkbook(personaId) {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(keyFor(personaId)) || null;
  } catch {
    return null;
  }
}

export function setTargetWorkbook(personaId, workbookId) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(keyFor(personaId), workbookId);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // quota — ignore
  }
}

export function clearTargetWorkbook(personaId) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(keyFor(personaId));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore
  }
}

export function subscribeTargetScope(cb) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

// ─── The resolver ────────────────────────────────────────────────────────

// Returns the effective target scope for the persona. Shape:
//   {
//     source: 'crm_territory' | 'workbook' | 'book' | 'empty',
//     workbookId: string | null,
//     workbookName: string,
//     accountIds: string[],
//     accountCount: number,
//     crmConnected: boolean,
//     canOverride: boolean, // whether the rep can pick a different scope
//   }
export function resolveTargetScope(personaId) {
  const crmConnected = isCrmConnected();
  const flaggedWbId = getFlaggedTargetWorkbook(personaId);
  const workbooks = listWorkbooksForPersona({
    personaId,
    isAdmin: false,
    crmConnected: true, // list even CRM-gated books so the rep can see them
  });

  // 1. CRM territory takes priority when connected AND the rep hasn't
  //    explicitly overridden with a flagged workbook.
  if (crmConnected && !flaggedWbId) {
    const bookAccounts = getAccountsForOwner(personaId) || [];
    const accountIds = bookAccounts.map((a) => a.id);
    return {
      source: 'crm_territory',
      workbookId: null,
      workbookName: 'CRM territory',
      accountIds,
      accountCount: accountIds.length,
      crmConnected,
      canOverride: true,
    };
  }

  // 2. Flagged workbook — if the rep explicitly picked one, use it.
  if (flaggedWbId) {
    const wb = workbooks.find((w) => w.id === flaggedWbId);
    if (wb) {
      const rows = resolveWorkbookRows(wb);
      const accountIds = rows
        .map((r) => (wb.kind === WORKBOOK_KINDS.CONTACT_LIST ? r.companyAccountId : (r.id || r.accountId)))
        .filter(Boolean);
      return {
        source: 'workbook',
        workbookId: wb.id,
        workbookName: wb.name,
        accountIds,
        accountCount: accountIds.length,
        crmConnected,
        canOverride: true,
      };
    }
    // Flagged workbook no longer exists — fall through to default.
  }

  // 3. Book of Accounts (per-seller MY_BOOK) — default fallback.
  const myBook = workbooks.find(
    (w) => w.kind === WORKBOOK_KINDS.MY_BOOK && (w.ownerId === personaId || w.id === PER_SELLER_BOOK_ID),
  );
  if (myBook) {
    const rows = resolveWorkbookRows(myBook);
    const accountIds = rows.map((r) => r.id || r.accountId).filter(Boolean);
    if (accountIds.length > 0) {
      return {
        source: 'book',
        workbookId: myBook.id,
        workbookName: myBook.name || 'Book of Accounts',
        accountIds,
        accountCount: accountIds.length,
        crmConnected,
        canOverride: true,
      };
    }
  }

  // Ultimate fallback — pull accounts owned by this persona directly.
  const bookAccounts = getAccountsForOwner(personaId) || [];
  const accountIds = bookAccounts.map((a) => a.id);
  return {
    source: accountIds.length > 0 ? 'book' : 'empty',
    workbookId: null,
    workbookName: accountIds.length > 0 ? 'Book of Accounts' : 'No target scope',
    accountIds,
    accountCount: accountIds.length,
    crmConnected,
    canOverride: true,
  };
}

// Which workbooks can the rep pick from as their target? Returns a
// display-friendly list including a CRM-territory option when connected
// and a synthetic "Book of Accounts" entry.
export function listScopeOptions(personaId) {
  const crmConnected = isCrmConnected();
  const workbooks = listWorkbooksForPersona({
    personaId,
    isAdmin: false,
    crmConnected: true,
  });
  const opts = [];
  if (crmConnected) {
    opts.push({ id: '__crm_territory__', label: 'CRM territory', kind: 'CRM_TERRITORY', isPseudo: true });
  }
  for (const w of workbooks) {
    opts.push({ id: w.id, label: w.name, kind: w.kind, isPseudo: false });
  }
  return opts;
}
