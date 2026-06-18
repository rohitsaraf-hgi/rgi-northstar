// Unified workbook source resolver.
// Combines tenant CRM/book accounts with HG whitespace into one universe view,
// stamping each row with a `source` field so the admin workbook can show
// a Source column and filter by All / Tenant Book / Whitespace / Needs Review.
//
// Source values:
//   'matched' — in CRM/book AND HG (the gold path; gets enriched on Sync)
//   'crm'     — in CRM/book but HG has no match (data-quality / private co)
//   'hg'      — in HG whitespace only (net-new opportunity)

import { getAccountsForOwner } from './accounts.js';
import {
  WHITESPACE_ACCOUNTS,
  listAvailableWhitespace,
  listAddedAccountIds,
} from './whitespaceAccounts.js';
import { getRGIF } from './workbookRGIF.js';

// Mock CRM-only accounts: in the tenant book (via CSV upload or CRM sync)
// but no HG match. Real life: small private companies, mis-spelled domains,
// recently-renamed entities. These populate the "Needs Review" tab so admins
// can act on resolution.
export const CRM_ONLY_ACCOUNTS = [
  {
    id: 'crm-only-elara-bio',
    name: 'Elara Biosciences',
    url: 'elarabio.com',
    logoColor: '#7c3aed',
    industry: 'Biotechnology',
    fai: { revenue: 'Private', employees: '~180', hq: 'Cambridge, MA', stage: 'Private (Series C)' },
    stage: 'pipeline',
    ownerIds: ['alex'],
    cloud: null,
    competitor: null,
    needsReviewReason: 'No HG match — domain may be new or company is below HG coverage threshold.',
  },
  {
    id: 'crm-only-northwind-energy',
    name: 'Northwind Energy Holdings',
    url: 'northwindenergyhldg.com',
    logoColor: '#0ea5e9',
    industry: 'Energy',
    fai: { revenue: 'Private', employees: '~420', hq: 'Houston, TX', stage: 'Private' },
    stage: 'prospect',
    ownerIds: ['alex'],
    cloud: null,
    competitor: null,
    needsReviewReason: 'Possible duplicate or renamed entity — review domain match candidates.',
  },
  {
    id: 'crm-only-virelia-medical',
    name: 'Virelia Medical Devices',
    url: 'virelia-med.com',
    logoColor: '#ec4899',
    industry: 'Medical Devices',
    fai: { revenue: 'Private', employees: '~95', hq: 'Minneapolis, MN', stage: 'Private (Series B)' },
    stage: 'prospect',
    ownerIds: ['alex'],
    cloud: null,
    competitor: null,
    needsReviewReason: 'No HG firmographic record — small private company.',
  },
];

// Mock presence in each CRM/data system. In production this comes from
// integration sync state. The mock distributes accounts realistically:
//   - matched accounts: HG + Salesforce (most common CRM pattern)
//   - a subset of matched also in HubSpot (marketing-led / dual-CRM tenants)
//   - crm-only: Salesforce only (no HG match yet)
//   - hg-only (whitespace): HG only
function presenceFor(account, source) {
  const idHash = (account.id || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const alsoInHubSpot = idHash % 4 === 0; // ~25% of matched accounts also in HubSpot
  if (source === 'matched') return { hg: true, salesforce: true, hubspot: alsoInHubSpot };
  if (source === 'crm') return { hg: false, salesforce: true, hubspot: false };
  if (source === 'hg') return { hg: true, salesforce: false, hubspot: false };
  return { hg: false, salesforce: false, hubspot: false };
}

function stampSource(account, source) {
  return { ...account, source, presentIn: presenceFor(account, source) };
}

// Returns every book account stamped with its source.
// 'matched' if HG has enrichment for it, 'crm' otherwise.
export function getBookAccountsWithSource(ownerId = 'alex') {
  const book = getAccountsForOwner(ownerId);
  const stamped = book.map((a) => {
    const hgMatched = !!getRGIF(a.id);
    return stampSource(a, hgMatched ? 'matched' : 'crm');
  });
  return [...stamped, ...CRM_ONLY_ACCOUNTS.map((a) => stampSource(a, 'crm'))];
}

// Returns whitespace accounts (HG-only) for a persona, stamped with source.
// Excludes accounts the rep has already added to their book.
export function getWhitespaceAccountsWithSource(personaId) {
  return listAvailableWhitespace(personaId).map((a) => stampSource(a, 'hg'));
}

// All accounts in the unified universe: book + whitespace, deduped by id.
// Book wins over whitespace if the same id appears in both (matched promotion).
export function getUnifiedAccounts(personaId, ownerId = 'alex') {
  const book = getBookAccountsWithSource(ownerId);
  const bookIds = new Set(book.map((a) => a.id));
  const whitespace = getWhitespaceAccountsWithSource(personaId).filter(
    (a) => !bookIds.has(a.id),
  );
  return [...book, ...whitespace];
}

// Counts for each tab — used by the SourceToggle.
export function getUnifiedCounts(personaId, ownerId = 'alex') {
  const all = getUnifiedAccounts(personaId, ownerId);
  return {
    all: all.length,
    book: all.filter((a) => a.source === 'matched' || a.source === 'crm').length,
    whitespace: all.filter((a) => a.source === 'hg').length,
    needsReview: all.filter((a) => a.source === 'crm').length,
  };
}

// Filter the unified list by tab.
export function filterByTab(accounts, tab) {
  switch (tab) {
    case 'all':
      return accounts;
    case 'book':
      return accounts.filter((a) => a.source === 'matched' || a.source === 'crm');
    case 'whitespace':
      return accounts.filter((a) => a.source === 'hg');
    case 'needs_review':
      return accounts.filter((a) => a.source === 'crm');
    default:
      return accounts;
  }
}

// Display-friendly source label + style.
export const SOURCE_BADGE = {
  matched: {
    label: 'Both',
    full: 'CRM + HG',
    classes:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
  },
  crm: {
    label: 'CRM',
    full: 'CRM only',
    classes:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  },
  hg: {
    label: 'HG',
    full: 'HG only',
    classes:
      'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30',
  },
};
