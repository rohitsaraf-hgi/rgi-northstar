// Territory Design — RevOps admin (Priya) experience for managing the tenant's
// book of accounts WITHOUT requiring a CRM connection.
//
// Three loops:
//   1. Cold Start — CSV upload + entity resolution
//   2. Discovery — ICP-driven whitespace discovery, scoped to confirmed offerings
//   3. Routing — assign discovered accounts to seller owners with workload balance
//
// All state is localStorage-backed with cross-tab events. The "AI" is simulated
// via deterministic rules that operate on the existing offerings + whitespace
// data — so the demo loop is reproducible.

import { WHITESPACE_ACCOUNTS } from './whitespaceAccounts.js';
import { OFFERINGS } from './offerings.js';

// v2 → bumped after the role/team schema migration. v1 state is orphaned
// (held in old key) so browsers with stale data automatically get the new
// seed on next load.
const STORAGE_KEY = 'rgi-territory-design-v2';
const CHANGE_EVENT = 'rgi:territory-design-changed';

// ─── Role + team taxonomy (3 default teams, 3 roles, 1:1 mapping) ───
//
// CSV `owner_role` column accepts one of three values: account_owner | csm | sdr
// Each role auto-maps to the matching team. Synonyms (AE, AM, BDR) are
// normalized on parse. New roles / teams can be added post-onboarding via
// /admin/teams.

export const ROLES = [
  { id: 'account_owner', label: 'Account Owner', teamId: 'account_owners', synonyms: ['ae', 'am', 'account executive', 'account manager', 'account owner'] },
  { id: 'csm',           label: 'CSM',           teamId: 'csms',           synonyms: ['csm', 'customer success', 'customer success manager'] },
  { id: 'sdr',           label: 'SDR',           teamId: 'sdrs',           synonyms: ['sdr', 'bdr', 'sales development', 'business development'] },
];

export const DEFAULT_TEAMS = [
  {
    id: 'account_owners',
    name: 'Account Owners',
    description: 'AEs and Account Managers — own pursuit and post-sale relationships.',
    audience: 'account_owner',
    defaultPlays: ['play-competitive-takeout', 'play-net-new-logo', 'play-high-intent-buyer'],
    defaultAgents: ['account_brief', 'email_outreach', 'find_more_contacts', 'opportunity_finder'],
  },
  {
    id: 'csms',
    name: 'CSMs',
    description: 'Customer Success Managers — drive expansion and renewal across active customers.',
    audience: 'csm',
    defaultPlays: ['play-expansion', 'play-renewal-defense', 'play-catalyst-event'],
    defaultAgents: ['account_brief', 'email_outreach'],
  },
  {
    id: 'sdrs',
    name: 'SDRs',
    description: 'SDRs and BDRs — outbound prospecting against whitespace.',
    audience: 'sdr',
    defaultPlays: ['play-net-new-logo', 'play-high-intent-buyer'],
    defaultAgents: ['account_brief', 'email_outreach', 'find_more_contacts'],
  },
];

// Resolve a raw `owner_role` string to a canonical role id. Returns
// 'account_owner' as a sensible default for unrecognized values.
export function normalizeRole(raw) {
  const lower = (raw || '').toString().trim().toLowerCase();
  for (const role of ROLES) {
    if (role.synonyms.some((s) => lower === s || lower.startsWith(s))) return role.id;
  }
  return 'account_owner';
}

export function teamIdForRole(roleId) {
  return ROLES.find((r) => r.id === roleId)?.teamId || 'account_owners';
}

// ─── Seller roster ─────────────────────────────────────────────────────────
// Currently-invited sellers. Demo seeds 3 active across all 3 teams to
// represent a partial-onboarding state. The CSV upload introduces 5 more
// who appear as STAGED until the admin clicks "Send invitations".

export const SEED_SELLERS = [
  { id: 'erik',  name: 'Erik Larson',  email: 'erik@wiz.io',  role: 'account_owner', teamId: 'account_owners', region: 'US-West', status: 'active', invitedAt: '2026-06-08', acceptedAt: '2026-06-09', stub: false },
  { id: 'lisa',  name: 'Lisa Chen',    email: 'lisa@wiz.io',  role: 'csm',           teamId: 'csms',           region: 'US-All',  status: 'active', invitedAt: '2026-06-08', acceptedAt: '2026-06-09', stub: false },
  { id: 'tariq', name: 'Tariq Brooks', email: 'tariq@wiz.io', role: 'sdr',           teamId: 'sdrs',           region: 'AMER',    status: 'active', invitedAt: '2026-06-08', acceptedAt: '2026-06-09', stub: false },
];

// ─── Staged sellers — discovered from latest CSV upload, awaiting invite ──
// In production, this list is derived live from book rows whose csvOwnerEmail
// isn't yet in SEED_SELLERS. For the demo we seed it explicitly so the
// "Discovered Sellers" panel always has content to demonstrate the invitation
// flow.

export const SEED_STAGED_SELLERS = [
  { email: 'sarah@wiz.io',   name: 'Sarah Kim',     role: 'account_owner', region: 'US-West', accountCount: 2, selectedForInvite: true, status: 'pending' },
  { email: 'mike@wiz.io',    name: 'Mike Patel',    role: 'account_owner', region: 'US-East', accountCount: 4, selectedForInvite: true, status: 'pending' },
  { email: 'james@wiz.io',   name: 'James Wright',  role: 'account_owner', region: 'US-East', accountCount: 2, selectedForInvite: true, status: 'pending' },
  { email: 'priya.a@wiz.io', name: 'Priya Anand',   role: 'sdr',           region: 'AMER',    accountCount: 1, selectedForInvite: true, status: 'pending' },
  { email: 'alex@wiz.io',    name: 'Alex Chen',     role: 'account_owner', region: 'US-West', accountCount: 1, selectedForInvite: true, status: 'pending' },
];

// ─── Seed book (what a freshly uploaded CSV resolves to) ───
// Each row: { rowId, csvOwnerEmail, csvAccountName, csvDomain, resolvedHgId,
//             resolvedConfidence, status, ownerSellerId, source, addedAt }
// status: 'high_confidence' | 'needs_review' | 'unmatched' | 'duplicate'
// source: 'csv' | 'whitespace_routed' | 'manual'
export const SEED_BOOK = [
  { rowId: 'r1',  csvOwnerEmail: 'erik@wiz.io',    csvOwnerRole: 'account_owner', csvAccountName: 'JPMorgan Chase',      csvDomain: 'jpmorganchase.com',  resolvedHgId: 'jpmorgan',     resolvedConfidence: 0.98, status: 'high_confidence', ownerSellerId: 'erik',   source: 'csv', industry: 'Banking and Financial Services',  employees: 293000, revenue: '$155.3B', region: 'US-East', addedAt: '2026-06-10' },
  { rowId: 'r2',  csvOwnerEmail: 'sarah@wiz.io',   csvOwnerRole: 'account_owner', csvAccountName: 'Salesforce Inc',      csvDomain: 'salesforce.com',     resolvedHgId: 'salesforce',   resolvedConfidence: 0.99, status: 'high_confidence', ownerSellerId: null,     source: 'csv', industry: 'Technology',                       employees: 79000,  revenue: '$34.9B',  region: 'US-West', addedAt: '2026-06-10' },
  { rowId: 'r3',  csvOwnerEmail: 'mike@wiz.io',    csvOwnerRole: 'account_owner', csvAccountName: 'Comcast Corp',        csvDomain: 'comcast.com',        resolvedHgId: 'comcast',      resolvedConfidence: 0.97, status: 'high_confidence', ownerSellerId: null,     source: 'csv', industry: 'Telecommunications',               employees: 186000, revenue: '$121.6B', region: 'US-East', addedAt: '2026-06-10' },
  { rowId: 'r4',  csvOwnerEmail: 'lisa@wiz.io',    csvOwnerRole: 'csm',           csvAccountName: 'UnitedHealth Group',  csvDomain: 'unitedhealthgroup.com', resolvedHgId: 'unitedhealth', resolvedConfidence: 0.99, status: 'high_confidence', ownerSellerId: 'lisa', source: 'csv', industry: 'Healthcare',                    employees: 440000, revenue: '$372B',   region: 'US-East', addedAt: '2026-06-10' },
  { rowId: 'r5',  csvOwnerEmail: 'lisa@wiz.io',    csvOwnerRole: 'csm',           csvAccountName: 'Anthem Healthcare',   csvDomain: 'anthem.com',         resolvedHgId: 'anthem',       resolvedConfidence: 0.96, status: 'high_confidence', ownerSellerId: 'lisa',   source: 'csv', industry: 'Healthcare',                       employees: 102000, revenue: '$170.5B', region: 'US-East', addedAt: '2026-06-10' },
  { rowId: 'r6',  csvOwnerEmail: 'james@wiz.io',   csvOwnerRole: 'account_owner', csvAccountName: 'Bank of America',     csvDomain: 'bankofamerica.com',  resolvedHgId: 'bofa',         resolvedConfidence: 0.99, status: 'high_confidence', ownerSellerId: null,     source: 'csv', industry: 'Banking and Financial Services',  employees: 213000, revenue: '$94.9B',  region: 'US-East', addedAt: '2026-06-10' },
  { rowId: 'r7',  csvOwnerEmail: 'erik@wiz.io',    csvOwnerRole: 'account_owner', csvAccountName: 'Adobe Systems',       csvDomain: 'adobe.com',          resolvedHgId: 'adobe',        resolvedConfidence: 0.99, status: 'high_confidence', ownerSellerId: 'erik',   source: 'csv', industry: 'Technology',                       employees: 29000,  revenue: '$19.4B',  region: 'US-West', addedAt: '2026-06-10' },
  { rowId: 'r8',  csvOwnerEmail: 'sarah@wiz.io',   csvOwnerRole: 'account_owner', csvAccountName: 'Snowflake Inc',       csvDomain: 'snowflake.com',      resolvedHgId: 'snowflake',    resolvedConfidence: 0.99, status: 'high_confidence', ownerSellerId: null,     source: 'csv', industry: 'Technology',                       employees: 7000,   revenue: '$2.8B',   region: 'US-West', addedAt: '2026-06-10' },
  { rowId: 'r9',  csvOwnerEmail: 'priya.a@wiz.io', csvOwnerRole: 'sdr',           csvAccountName: 'Lululemon Athletica', csvDomain: 'lululemon.com',      resolvedHgId: 'lululemon',    resolvedConfidence: 0.97, status: 'high_confidence', ownerSellerId: null,     source: 'csv', industry: 'Retail',                          employees: 35000,  revenue: '$9.6B',   region: 'AMER',    addedAt: '2026-06-10' },
  { rowId: 'r10', csvOwnerEmail: 'tariq@wiz.io',   csvOwnerRole: 'sdr',           csvAccountName: 'Zoom Video',          csvDomain: 'zoom.us',            resolvedHgId: 'zoom',         resolvedConfidence: 0.95, status: 'high_confidence', ownerSellerId: 'tariq',  source: 'csv', industry: 'Technology',                       employees: 8400,   revenue: '$4.5B',   region: 'AMER',    addedAt: '2026-06-10' },
  { rowId: 'r11', csvOwnerEmail: 'james@wiz.io',   csvOwnerRole: 'account_owner', csvAccountName: 'Citigroup',           csvDomain: 'citigroup.com',      resolvedHgId: 'citi',         resolvedConfidence: 0.98, status: 'high_confidence', ownerSellerId: null,     source: 'csv', industry: 'Banking and Financial Services',  employees: 240000, revenue: '$75.3B',  region: 'US-East', addedAt: '2026-06-10' },
  { rowId: 'r12', csvOwnerEmail: 'alex@wiz.io',    csvOwnerRole: 'account_owner', csvAccountName: 'Stripe',              csvDomain: 'stripe.com',         resolvedHgId: 'stripe',       resolvedConfidence: 0.99, status: 'high_confidence', ownerSellerId: null,     source: 'csv', industry: 'Financial Technology',             employees: 8000,   revenue: '$14.4B',  region: 'US-West', addedAt: '2026-06-10' },
  // Rows that "needs_review" — demonstrate the AI confidence gradient
  { rowId: 'r13', csvOwnerEmail: 'mike@wiz.io',    csvOwnerRole: 'account_owner', csvAccountName: 'Acme Corp',           csvDomain: 'acme-inc.io',        resolvedHgId: null,           resolvedConfidence: 0.62, status: 'needs_review',    ownerSellerId: null,     source: 'csv', industry: null,                                employees: null,   revenue: null,      region: null,      addedAt: '2026-06-10',
    aiSuggestion: { candidates: ['Acme Corporation Inc.', 'Acme Industries LLC', 'Acme Holdings'], reason: 'Three companies match name pattern. Domain acme-inc.io is not in HG registry — choose the right entity or add to manual entry queue.' } },
  { rowId: 'r14', csvOwnerEmail: 'mike@wiz.io',    csvOwnerRole: 'account_owner', csvAccountName: 'Acme Corporation',    csvDomain: 'acmecorp.com',       resolvedHgId: null,           resolvedConfidence: 0.55, status: 'duplicate',       ownerSellerId: null,     source: 'csv', industry: null,                                employees: null,   revenue: null,      region: null,      addedAt: '2026-06-10',
    aiSuggestion: { mergeWith: 'r13', reason: 'Likely same company as row r13 (Acme Corp / acme-inc.io). Names differ slightly; both rows assigned to same owner. Recommend: merge.' } },
  { rowId: 'r15', csvOwnerEmail: 'unknown@wiz.io', csvOwnerRole: 'account_owner', csvAccountName: 'Northrop Grumman',    csvDomain: 'northropgrumman.com', resolvedHgId: 'northrop',    resolvedConfidence: 0.97, status: 'needs_review',    ownerSellerId: null,     source: 'csv', industry: 'Defense',                          employees: 95000,  revenue: '$36.6B',  region: 'US-East', addedAt: '2026-06-10',
    aiSuggestion: { reason: 'Owner email unknown@wiz.io does not match any invited seller. Suggestions: route to Mike Patel team (US-East, has 4 defense accounts) OR hold as unassigned.' } },
];

// ─── Discovery batches — AI-proposed whitespace pulls ───
// Each batch is an ICP-scoped query that returns candidates from the
// whitespace universe. We seed two example batches; admin can run more from
// the UI.
export const SEED_DISCOVERY_BATCHES = [
  {
    id: 'batch-1',
    name: 'Healthcare · Multi-cloud · CNAPP gap',
    offeringId: 'cnapp',
    status: 'pending_review',
    createdAt: '2026-06-12T08:30:00Z',
    icpFilters: {
      industries: ['Healthcare'],
      employeesMin: 5000,
      employeesMax: null,
      regions: ['US-East', 'US-West'],
      revenueMin: 1000000000, // $1B
      complementaryTech: ['AWS', 'Azure'],
      excludeCompetitors: [],
      requireIntentTopics: [],
    },
    resultIds: ['ws-mass-general', 'ws-blue-cross', 'ws-cleveland-clinic'],
    rationale: 'ICP match for Wiz CNAPP: 5K+ employees healthcare, multi-cloud AWS/Azure footprint, US East/West. Excluded current book. 3 matches found.',
  },
  {
    id: 'batch-2',
    name: 'Banking · Lacework displacement',
    offeringId: 'cnapp',
    status: 'reviewing',
    createdAt: '2026-06-11T16:45:00Z',
    icpFilters: {
      industries: ['Banking and Financial Services'],
      employeesMin: 10000,
      employeesMax: null,
      regions: ['US-East'],
      revenueMin: 5000000000,
      complementaryTech: [],
      excludeCompetitors: [],
      requireIntentTopics: ['CNAPP', 'cloud security RFP'],
    },
    resultIds: ['ws-goldman-sachs', 'ws-wells-fargo'],
    rationale: 'Banking 10K+ employees with Lacework declining trend and active CNAPP intent. Wiz CNAPP displacement window.',
  },
];

// ─── Territory rules — inferred from current book or admin-authored ───
export const SEED_RULES = [
  { id: 'rule-1', priority: 1, description: 'Healthcare → Lisa Chen',                      match: { industry: 'Healthcare' },                                     ownerSellerId: 'lisa',  active: true },
  { id: 'rule-2', priority: 2, description: 'Banking & FinServ → James Wright',            match: { industry: 'Banking and Financial Services' },                 ownerSellerId: 'james', active: true },
  { id: 'rule-3', priority: 3, description: 'US-West Technology · Enterprise (>$1B) → Erik / Sarah / Alex (round-robin)', match: { region: 'US-West', industry: 'Technology', revenueMin: 1000000000 }, ownerSellerIds: ['erik', 'sarah', 'alex'], active: true },
  { id: 'rule-4', priority: 4, description: 'US-East Enterprise (>$1B) → Mike Patel',      match: { region: 'US-East', revenueMin: 1000000000 },                  ownerSellerId: 'mike',  active: true },
  { id: 'rule-5', priority: 5, description: 'Mid-Market (<$1B revenue) → Priya A. / Tariq (round-robin)', match: { revenueMax: 1000000000 },                       ownerSellerIds: ['priya_a', 'tariq'], active: true },
];

const DEFAULT_STATE = {
  sellers: SEED_SELLERS,
  stagedSellers: SEED_STAGED_SELLERS,
  teams: DEFAULT_TEAMS,
  book: SEED_BOOK,
  discoveryBatches: SEED_DISCOVERY_BATCHES,
  rules: SEED_RULES,
  uploadHistory: [
    {
      id: 'upload-1',
      filename: 'wiz-master-book-2026-06.csv',
      uploadedAt: '2026-06-10T14:22:00Z',
      uploadedBy: 'Priya Sharma',
      totalRows: 15,
      resolved: 12,
      needsReview: 2,
      unmatched: 0,
      duplicates: 1,
    },
  ],
  auditLog: [
    { at: '2026-06-12T09:14:00Z', actor: 'Priya Sharma', action: 'rule_created', payload: 'Rule 5: Mid-Market round-robin' },
    { at: '2026-06-10T14:22:00Z', actor: 'Priya Sharma', action: 'csv_uploaded', payload: 'wiz-master-book-2026-06.csv · 15 rows' },
  ],
};

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readState() {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw && safeParse(raw);
  return parsed || DEFAULT_STATE;
}

function writeState(next) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // quota — ignore
  }
}

function update(mutator) {
  const next = mutator(readState());
  if (next) writeState(next);
  return next;
}

// ─── Public API ────────────────────────────────────────────────────────────

export function getTerritoryState() {
  return readState();
}

export function subscribeTerritory(onChange) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

export function resetTerritoryState() {
  writeState(DEFAULT_STATE);
}

// ─── Sellers ───
export function listSellers() {
  return readState().sellers;
}
export function getSeller(id) {
  return readState().sellers.find((s) => s.id === id) || null;
}
export function getSellerByEmail(email) {
  if (!email) return null;
  const lower = email.toLowerCase();
  return readState().sellers.find((s) => s.email.toLowerCase() === lower) || null;
}

// ─── Staged sellers (discovered from CSV, awaiting invitation) ───────────

export function listStagedSellers() {
  return readState().stagedSellers || [];
}

export function updateStagedSeller(email, patch) {
  return update((state) => ({
    ...state,
    stagedSellers: (state.stagedSellers || []).map((s) =>
      s.email.toLowerCase() === email.toLowerCase() ? { ...s, ...patch } : s,
    ),
  }));
}

export function removeStagedSeller(email) {
  return update((state) => ({
    ...state,
    stagedSellers: (state.stagedSellers || []).filter(
      (s) => s.email.toLowerCase() !== email.toLowerCase(),
    ),
  }));
}

// Invite the selected staged sellers — converts them into real sellers with
// status 'invited'. Their book rows automatically resolve their ownerSellerId
// once the seller exists. The "next iteration" wires actual magic-link email
// + Slack DM; for this prototype we just flip status.
export function sendInvitations(emails, { actor = 'Priya Sharma' } = {}) {
  return update((state) => {
    const lowered = emails.map((e) => e.toLowerCase());
    const stagedMap = new Map(state.stagedSellers.map((s) => [s.email.toLowerCase(), s]));

    // Build new seller records from the staged entries.
    const newSellers = [];
    for (const email of lowered) {
      const staged = stagedMap.get(email);
      if (!staged) continue;
      // Use email local-part as a stable id.
      const id = email.split('@')[0].replace(/[^a-z0-9]/g, '_');
      newSellers.push({
        id,
        name: staged.name,
        email: staged.email,
        role: staged.role,
        teamId: teamIdForRole(staged.role),
        region: staged.region || '',
        status: 'invited',
        invitedAt: new Date().toISOString().slice(0, 10),
        acceptedAt: null,
        stub: false,
      });
    }

    // Backfill book rows that reference these owners' emails — set
    // ownerSellerId so workload + book listings populate immediately.
    const sellersByEmail = new Map(
      [...state.sellers, ...newSellers].map((s) => [s.email.toLowerCase(), s.id]),
    );
    const book = state.book.map((row) => {
      if (row.ownerSellerId) return row;
      const sid = sellersByEmail.get((row.csvOwnerEmail || '').toLowerCase());
      return sid ? { ...row, ownerSellerId: sid } : row;
    });

    return {
      ...state,
      sellers: [...state.sellers, ...newSellers],
      stagedSellers: state.stagedSellers.filter((s) => !lowered.includes(s.email.toLowerCase())),
      book,
      auditLog: [
        {
          at: new Date().toISOString(),
          actor,
          action: 'sellers_invited',
          payload: `${newSellers.length} sellers invited via magic link · ${newSellers.map((s) => s.name).join(', ')}`,
        },
        ...state.auditLog,
      ].slice(0, 200),
    };
  });
}

// Invite a single seller manually (not via CSV). Used by the "Invite seller"
// modal on the Users & Sellers page. Validates uniqueness by email and stamps
// the new record with status='invited' + invitedAt = now.
export function inviteSeller({ name, email, role, region }, { actor = 'Priya Sharma' } = {}) {
  return update((state) => {
    const lower = (email || '').trim().toLowerCase();
    if (!lower) return null;
    if (state.sellers.find((s) => s.email.toLowerCase() === lower)) return null; // dupe

    const localPart = lower.split('@')[0].replace(/[^a-z0-9]/g, '_');
    const id = state.sellers.find((s) => s.id === localPart) ? `${localPart}_${Date.now()}` : localPart;

    const newSeller = {
      id,
      name: (name || '').trim() || deriveNameFromEmail(email),
      email: email.trim(),
      role,
      teamId: teamIdForRole(role),
      region: (region || '').trim(),
      status: 'invited',
      invitedAt: new Date().toISOString().slice(0, 10),
      acceptedAt: null,
      stub: false,
    };

    // Also remove any staged-seller entry with the same email so the row
    // doesn't double up.
    const stagedSellers = (state.stagedSellers || []).filter(
      (s) => s.email.toLowerCase() !== lower,
    );

    return {
      ...state,
      sellers: [...state.sellers, newSeller],
      stagedSellers,
      auditLog: [
        {
          at: new Date().toISOString(),
          actor,
          action: 'seller_invited_manually',
          payload: `${newSeller.name} (${newSeller.email}) · ${ROLES.find((r) => r.id === role)?.label}`,
        },
        ...state.auditLog,
      ].slice(0, 200),
    };
  });
}

function deriveNameFromEmail(email) {
  if (!email) return '';
  const local = email.split('@')[0] || '';
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ')
    .trim();
}

// Resend an invitation — flips status timestamp; UI shows toast.
export function resendInvitation(sellerId, { actor = 'Priya Sharma' } = {}) {
  return update((state) => {
    const seller = state.sellers.find((s) => s.id === sellerId);
    if (!seller) return null;
    return {
      ...state,
      sellers: state.sellers.map((s) =>
        s.id === sellerId
          ? { ...s, invitedAt: new Date().toISOString().slice(0, 10), status: 'invited' }
          : s,
      ),
      auditLog: [
        { at: new Date().toISOString(), actor, action: 'invitation_resent', payload: seller.name },
        ...state.auditLog,
      ].slice(0, 200),
    };
  });
}

// ─── Teams ───
export function listTeams() {
  return readState().teams || DEFAULT_TEAMS;
}
export function getTeam(id) {
  return (readState().teams || DEFAULT_TEAMS).find((t) => t.id === id) || null;
}

export function upsertTeam(team, { actor = 'Priya Sharma' } = {}) {
  return update((state) => {
    const teams = state.teams || DEFAULT_TEAMS;
    const idx = teams.findIndex((t) => t.id === team.id);
    const stamped = { ...team, updatedAt: new Date().toISOString() };
    const nextTeams =
      idx >= 0
        ? teams.map((t, i) => (i === idx ? { ...t, ...stamped } : t))
        : [...teams, { ...stamped, createdAt: new Date().toISOString() }];
    return {
      ...state,
      teams: nextTeams,
      auditLog: [
        {
          at: new Date().toISOString(),
          actor,
          action: idx >= 0 ? 'team_updated' : 'team_created',
          payload: team.name,
        },
        ...state.auditLog,
      ].slice(0, 200),
    };
  });
}

export function deleteTeam(id, { actor = 'Priya Sharma' } = {}) {
  return update((state) => {
    const teams = state.teams || DEFAULT_TEAMS;
    const team = teams.find((t) => t.id === id);
    if (!team) return null;
    return {
      ...state,
      teams: teams.filter((t) => t.id !== id),
      // Also unset teamId for any sellers in this team so they don't reference
      // a ghost team.
      sellers: state.sellers.map((s) => ((s.teamId || s.team) === id ? { ...s, teamId: null } : s)),
      auditLog: [
        { at: new Date().toISOString(), actor, action: 'team_deleted', payload: team.name },
        ...state.auditLog,
      ].slice(0, 200),
    };
  });
}

// Assign or move a seller into a specific team
export function assignSellerToTeam(sellerId, teamId, { actor = 'Priya Sharma' } = {}) {
  return update((state) => {
    const seller = state.sellers.find((s) => s.id === sellerId);
    if (!seller) return null;
    return {
      ...state,
      sellers: state.sellers.map((s) =>
        s.id === sellerId ? { ...s, teamId, team: teamId /* legacy compat */ } : s,
      ),
      auditLog: [
        {
          at: new Date().toISOString(),
          actor,
          action: 'seller_assigned_to_team',
          payload: `${seller.name} → ${teamId}`,
        },
        ...state.auditLog,
      ].slice(0, 200),
    };
  });
}

// Clone the book of another seller for a new invitee — useful for ramping
// new sellers with a similar territory. Each cloned row gets a new rowId and
// ownerSellerId pointing at the target.
export function cloneBookFromSeller(sourceSellerId, targetSellerId, { actor = 'Priya Sharma' } = {}) {
  return update((state) => {
    const sourceRows = state.book.filter((r) => r.ownerSellerId === sourceSellerId);
    if (sourceRows.length === 0) return null;
    const sourceSeller = state.sellers.find((s) => s.id === sourceSellerId);
    const targetSeller = state.sellers.find((s) => s.id === targetSellerId);
    if (!targetSeller) return null;

    const clonedRows = sourceRows.map((r) => ({
      ...r,
      rowId: `${r.rowId}-clone-${targetSellerId}-${Date.now()}`,
      ownerSellerId: targetSellerId,
      csvOwnerEmail: targetSeller.email,
      source: 'cloned',
      clonedFromSellerId: sourceSellerId,
      addedAt: new Date().toISOString().slice(0, 10),
    }));

    return {
      ...state,
      book: [...state.book, ...clonedRows],
      auditLog: [
        {
          at: new Date().toISOString(),
          actor,
          action: 'book_cloned',
          payload: `${clonedRows.length} accounts cloned from ${sourceSeller?.name || sourceSellerId} → ${targetSeller.name}`,
        },
        ...state.auditLog,
      ].slice(0, 200),
    };
  });
}

// ─── Book ───
export function listBook() {
  return readState().book;
}
export function getBookRow(rowId) {
  return readState().book.find((r) => r.rowId === rowId) || null;
}
export function listBookForOwner(sellerId) {
  return readState().book.filter((r) => r.ownerSellerId === sellerId);
}
export function listBookByStatus(status) {
  return readState().book.filter((r) => r.status === status);
}

// Update a book row — used for owner reassignment + review actions
export function updateBookRow(rowId, patch, { actor = 'Priya Sharma' } = {}) {
  return update((state) => {
    const idx = state.book.findIndex((r) => r.rowId === rowId);
    if (idx < 0) return null;
    const prev = state.book[idx];
    const next = { ...prev, ...patch };
    const book = [...state.book];
    book[idx] = next;
    return {
      ...state,
      book,
      auditLog: [
        { at: new Date().toISOString(), actor, action: 'book_row_updated', payload: `${prev.csvAccountName}: ${Object.keys(patch).join(', ')}` },
        ...state.auditLog,
      ].slice(0, 200),
    };
  });
}

export function assignOwner(rowId, sellerId, { actor = 'Priya Sharma' } = {}) {
  return updateBookRow(rowId, { ownerSellerId: sellerId, status: 'high_confidence' }, { actor });
}

export function mergeBookRows(keepRowId, mergeRowId, { actor = 'Priya Sharma' } = {}) {
  return update((state) => {
    const book = state.book.filter((r) => r.rowId !== mergeRowId);
    return {
      ...state,
      book,
      auditLog: [
        { at: new Date().toISOString(), actor, action: 'book_rows_merged', payload: `Merged ${mergeRowId} into ${keepRowId}` },
        ...state.auditLog,
      ].slice(0, 200),
    };
  });
}

// ─── Discovery ───
export function listDiscoveryBatches() {
  return readState().discoveryBatches;
}

export function getDiscoveryBatch(id) {
  return readState().discoveryBatches.find((b) => b.id === id) || null;
}

// Run an ICP-driven whitespace query against the seeded WHITESPACE_ACCOUNTS.
// Returns matching whitespace ids; does not persist until createDiscoveryBatch.
export function runIcpQuery(filters) {
  const {
    industries = [],
    employeesMin = null,
    employeesMax = null,
    regions = [],
    revenueMin = null,
    revenueMax = null,
    complementaryTech = [],
    excludeCompetitors = [],
    requireIntentTopics = [],
    offeringId = null,
  } = filters || {};

  const inBookHgIds = new Set(readState().book.map((r) => r.resolvedHgId).filter(Boolean));

  const matches = WHITESPACE_ACCOUNTS.filter((a) => {
    if (inBookHgIds.has(a.id)) return false; // exclude already-in-book

    if (industries.length && !industries.some((ind) => (a.industry || '').toLowerCase().includes(ind.toLowerCase()))) return false;

    // Parse employees from fai.employees if present (e.g., "49K" → 49000)
    const empNum = parseEmployeeBand(a.fai?.employees);
    if (employeesMin && empNum && empNum < employeesMin) return false;
    if (employeesMax && empNum && empNum > employeesMax) return false;

    if (regions.length) {
      const hq = (a.fai?.hq || '').toLowerCase();
      const regionMatch = regions.some((r) => {
        if (r === 'US-East')   return /\b(ny|new york|nj|jersey|boston|ma|massachusetts|connecticut|virginia|atlanta|miami|fl|north carolina|pa|pittsburgh|philadelphia|washington dc|dc)\b/i.test(hq);
        if (r === 'US-West')   return /\b(ca|california|san francisco|los angeles|seattle|wa|washington|oregon|or|nevada|nv|denver|co|salt lake)\b/i.test(hq);
        if (r === 'US-All' || r === 'AMER') return hq.includes(', ') || /usa|united states/.test(hq);
        return false;
      });
      if (!regionMatch) return false;
    }

    const revNum = parseRevenue(a.fai?.revenue);
    if (revenueMin && revNum && revNum < revenueMin) return false;
    if (revenueMax && revNum && revNum > revenueMax) return false;

    if (complementaryTech.length) {
      const clouds = a.rgif?.clouds || [];
      const present = complementaryTech.some((t) => clouds.some((c) => c.toLowerCase().includes(t.toLowerCase())));
      if (!present) return false;
    }

    if (excludeCompetitors.length) {
      const installs = a.rgif?.installs || {};
      const hasCompetitor = excludeCompetitors.some((c) => installs[c]?.present);
      if (hasCompetitor) return false;
    }

    if (requireIntentTopics.length) {
      const intents = a.rgif?.intent || [];
      const hasIntent = requireIntentTopics.some((t) => intents.some((i) => i.toLowerCase().includes(t.toLowerCase())));
      if (!hasIntent) return false;
    }

    if (offeringId) {
      const fitScore = a.fits?.[offeringId]?.score || 0;
      if (fitScore < 50) return false; // floor — drop poor fits
    }

    return true;
  });

  return matches;
}

export function createDiscoveryBatch(filters, name, { actor = 'Priya Sharma' } = {}) {
  const matches = runIcpQuery(filters);
  return update((state) => {
    const batch = {
      id: `batch-${Date.now()}`,
      name: name || 'Untitled discovery',
      offeringId: filters.offeringId || null,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
      icpFilters: filters,
      resultIds: matches.map((a) => a.id),
      rationale: buildRationale(filters, matches.length),
    };
    return {
      ...state,
      discoveryBatches: [batch, ...state.discoveryBatches],
      auditLog: [
        { at: new Date().toISOString(), actor, action: 'discovery_batch_created', payload: `${batch.name} · ${matches.length} matches` },
        ...state.auditLog,
      ].slice(0, 200),
    };
  });
}

export function dismissDiscoveryBatch(batchId, { actor = 'Priya Sharma' } = {}) {
  return update((state) => {
    const batch = state.discoveryBatches.find((b) => b.id === batchId);
    return {
      ...state,
      discoveryBatches: state.discoveryBatches.filter((b) => b.id !== batchId),
      auditLog: [
        { at: new Date().toISOString(), actor, action: 'discovery_batch_dismissed', payload: batch?.name || batchId },
        ...state.auditLog,
      ].slice(0, 200),
    };
  });
}

// ─── Routing — apply territory rules to discovery results ───
export function proposeRouting(accountIds) {
  const state = readState();
  const proposals = accountIds.map((id) => {
    const account = WHITESPACE_ACCOUNTS.find((a) => a.id === id);
    if (!account) return { accountId: id, ownerSellerId: null, ruleId: null, rationale: 'Account not found' };

    // Walk rules by priority; first match wins
    const sorted = [...state.rules].filter((r) => r.active).sort((a, b) => a.priority - b.priority);
    for (const rule of sorted) {
      if (matchesRule(account, rule.match)) {
        if (rule.ownerSellerIds) {
          // Round-robin — pick the seller with the smallest book in this rule's pool
          const counts = rule.ownerSellerIds.map((sid) => ({
            sid,
            count: state.book.filter((r) => r.ownerSellerId === sid).length,
          }));
          counts.sort((a, b) => a.count - b.count);
          const pickSid = counts[0].sid;
          return {
            accountId: id,
            ownerSellerId: pickSid,
            ruleId: rule.id,
            rationale: `Matched rule "${rule.description}". Round-robin picked ${getSeller(pickSid)?.name || pickSid} (currently has ${counts[0].count} accounts — lowest in pool).`,
          };
        }
        return {
          accountId: id,
          ownerSellerId: rule.ownerSellerId,
          ruleId: rule.id,
          rationale: `Matched rule "${rule.description}".`,
        };
      }
    }
    return { accountId: id, ownerSellerId: null, ruleId: null, rationale: 'No territory rule matched. Manual assignment needed.' };
  });
  return proposals;
}

export function commitRouting(proposals, { actor = 'Priya Sharma' } = {}) {
  return update((state) => {
    const newRows = proposals
      .filter((p) => p.ownerSellerId)
      .map((p) => {
        const account = WHITESPACE_ACCOUNTS.find((a) => a.id === p.accountId);
        return {
          rowId: `r-${Date.now()}-${p.accountId}`,
          csvOwnerEmail: getSeller(p.ownerSellerId)?.email || null,
          csvAccountName: account?.name || p.accountId,
          csvDomain: account?.url || null,
          resolvedHgId: p.accountId,
          resolvedConfidence: 1.0,
          status: 'high_confidence',
          ownerSellerId: p.ownerSellerId,
          source: 'whitespace_routed',
          industry: account?.industry || null,
          employees: parseEmployeeBand(account?.fai?.employees),
          revenue: account?.fai?.revenue || null,
          region: account?.fai?.hq || null,
          addedAt: new Date().toISOString().slice(0, 10),
          routedByRuleId: p.ruleId,
          routedRationale: p.rationale,
        };
      });
    return {
      ...state,
      book: [...newRows, ...state.book],
      auditLog: [
        { at: new Date().toISOString(), actor, action: 'whitespace_routed_to_book', payload: `${newRows.length} accounts added to book via territory rules` },
        ...state.auditLog,
      ].slice(0, 200),
    };
  });
}

// ─── Rules ───
export function listRules() {
  return readState().rules;
}
export function updateRule(ruleId, patch, { actor = 'Priya Sharma' } = {}) {
  return update((state) => {
    const rules = state.rules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r));
    return {
      ...state,
      rules,
      auditLog: [
        { at: new Date().toISOString(), actor, action: 'rule_updated', payload: ruleId },
        ...state.auditLog,
      ].slice(0, 200),
    };
  });
}

// ─── Coverage analytics ───
export function getCoverageStats() {
  const state = readState();
  const totalBook = state.book.length;
  const byOwner = {};
  state.book.forEach((r) => {
    if (!r.ownerSellerId) return;
    byOwner[r.ownerSellerId] = (byOwner[r.ownerSellerId] || 0) + 1;
  });
  const ownersWithBook = Object.keys(byOwner).length;
  const avgPerOwner = ownersWithBook ? Math.round(totalBook / ownersWithBook) : 0;
  const maxLoad = Math.max(0, ...Object.values(byOwner));
  const minLoad = ownersWithBook ? Math.min(...Object.values(byOwner)) : 0;
  const imbalance = maxLoad - minLoad;
  const unassigned = state.book.filter((r) => !r.ownerSellerId).length;
  const needsReview = state.book.filter((r) => r.status === 'needs_review' || r.status === 'duplicate').length;
  return { totalBook, byOwner, ownersWithBook, avgPerOwner, maxLoad, minLoad, imbalance, unassigned, needsReview };
}

// ─── Helpers ───

function parseEmployeeBand(str) {
  if (!str) return null;
  const m = str.toString().match(/([\d.]+)\s*([KM]?)/i);
  if (!m) return null;
  const num = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  if (unit === 'M') return Math.round(num * 1_000_000);
  if (unit === 'K') return Math.round(num * 1_000);
  return Math.round(num);
}

function parseRevenue(str) {
  if (!str) return null;
  const m = str.toString().replace(/\$/g, '').match(/([\d.]+)\s*([BM]?)/i);
  if (!m) return null;
  const num = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  if (unit === 'B') return Math.round(num * 1_000_000_000);
  if (unit === 'M') return Math.round(num * 1_000_000);
  return Math.round(num);
}

function matchesRule(account, match) {
  if (!match) return false;
  if (match.industry) {
    const ind = (account.industry || '').toLowerCase();
    if (!ind.includes(match.industry.toLowerCase())) return false;
  }
  if (match.region) {
    const hq = (account.fai?.hq || '').toLowerCase();
    if (match.region === 'US-East'  && !/\b(ny|new york|nj|jersey|boston|ma|massachusetts|connecticut|virginia|atlanta|miami|fl|north carolina|pa|pittsburgh|philadelphia|washington dc|dc)\b/i.test(hq)) return false;
    if (match.region === 'US-West'  && !/\b(ca|california|san francisco|los angeles|seattle|wa|washington|oregon|or|nevada|nv|denver|co|salt lake)\b/i.test(hq)) return false;
  }
  if (match.revenueMin) {
    const rev = parseRevenue(account.fai?.revenue);
    if (!rev || rev < match.revenueMin) return false;
  }
  if (match.revenueMax) {
    const rev = parseRevenue(account.fai?.revenue);
    if (!rev || rev > match.revenueMax) return false;
  }
  return true;
}

function buildRationale(filters, count) {
  const parts = [];
  if (filters.industries?.length) parts.push(`Industry: ${filters.industries.join(', ')}`);
  if (filters.employeesMin) parts.push(`Employees ≥ ${filters.employeesMin.toLocaleString()}`);
  if (filters.regions?.length) parts.push(`Region: ${filters.regions.join(', ')}`);
  if (filters.revenueMin) parts.push(`Revenue ≥ $${(filters.revenueMin / 1_000_000_000).toFixed(1)}B`);
  if (filters.complementaryTech?.length) parts.push(`Tech: ${filters.complementaryTech.join(', ')}`);
  if (filters.offeringId) {
    const off = OFFERINGS.find((o) => o.id === filters.offeringId);
    if (off) parts.push(`Offering fit: ${off.name}`);
  }
  return `${parts.join(' · ')} — ${count} match${count === 1 ? '' : 'es'}.`;
}

// Exposed for the route to render readable filter pills
export function describeFilters(filters) {
  return buildRationale(filters, runIcpQuery(filters).length);
}
