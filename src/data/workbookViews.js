// Workbook saved views.
//
// A view is a complete workbook configuration:
//   - filters (offering lens, signal kinds, tier, journey stage)
//   - columns (built-in + enriched)
//   - sort
//   - visibility / sharing (private | tenant | team)
//
// Storage layout:
//   - rgi-workbook-views-{personaId}  — that persona's PRIVATE views
//   - rgi-workbook-views-shared       — global bucket of shared views,
//                                       filtered by visibility on read.
//
// listViewsBySource(personaId, source) returns the union: private views
// owned by the persona, plus shared views the persona has access to
// based on their team membership.

const STORAGE_KEY_PREFIX = 'rgi-workbook-views-';
const SHARED_STORAGE_KEY = 'rgi-workbook-views-shared';
const CHANGE_EVENT = 'rgi:workbook-views-changed';

function keyFor(personaId) {
  return `${STORAGE_KEY_PREFIX}${personaId}`;
}

// Persona → team membership lookup. Admins implicitly see every shared
// view regardless of team. Sellers see tenant-wide views plus views
// shared with teams they belong to plus views explicitly listing them.
// Kept tiny + inline so we don't take a runtime dep on territoryDesign.
const PERSONA_TEAM_MAP = {
  alex: ['account_owners'],
  riley: ['account_owners'],
  jordan: ['csms'],
  maya: ['account_owners'],
  priya: ['account_owners', 'csms', 'sdrs'], // admin — sees all
};
function personaTeamIds(personaId) {
  return PERSONA_TEAM_MAP[personaId] || ['account_owners'];
}

// Built-in column registry — keys reference table column renderers.
export const BUILTIN_COLUMNS = {
  account: { id: 'account', label: 'Account', sortable: true, width: 240 },
  tier: { id: 'tier', label: 'Tier', sortable: true, width: 50 },
  opp_score: { id: 'opp_score', label: 'Opp Score', sortable: true, width: 90 },
  fit_lens: { id: 'fit_lens', label: 'Fit (lens)', sortable: true, width: 90 },
  top_signal: { id: 'top_signal', label: 'Top Signal', sortable: false, width: 220 },
  cloud: { id: 'cloud', label: 'Cloud', sortable: false, width: 130 },
  revenue: { id: 'revenue', label: 'Revenue', sortable: true, width: 90 },
  it_spend: { id: 'it_spend', label: 'IT Spend', sortable: true, width: 90 },
  employees: { id: 'employees', label: 'Employees', sortable: true, width: 90 },
  stage: { id: 'stage', label: 'CRM Stage', sortable: false, width: 160 },
};

// Default column order for a fresh view
export const DEFAULT_COLUMN_IDS = [
  'tier',
  'account',
  'opp_score',
  'fit_lens',
  'top_signal',
  'cloud',
  'revenue',
  'it_spend',
  'stage',
];

function defaultViews() {
  return [
    // ─── Book views ───
    {
      id: 'view-all',
      name: 'All accounts',
      source: 'book',
      system: true,
      isDefault: true,
      filters: { offeringId: 'all', signalKinds: [], tier: 'all' },
      columns: DEFAULT_COLUMN_IDS.map((id) => ({ id, kind: 'builtin' })),
      sort: { columnId: 'opp_score', dir: 'desc' },
      createdAt: '2026-06-01T10:00:00Z',
      updatedAt: '2026-06-01T10:00:00Z',
    },
    {
      id: 'view-cnapp-pipeline',
      name: 'CNAPP pipeline',
      source: 'book',
      system: true,
      isDefault: false,
      filters: { offeringId: 'cnapp', signalKinds: ['active_rfp', 'competitor_displacement'], tier: 'all' },
      columns: [
        ...DEFAULT_COLUMN_IDS.map((id) => ({ id, kind: 'builtin' })),
        { id: 'enrich-pa-decline', kind: 'enriched', question: 'Is Palo Alto Prisma intensity declining at this account?', category: 'tech' },
        { id: 'enrich-cnapp-intent', kind: 'enriched', question: 'Is this account actively researching CNAPP?', category: 'intent' },
      ],
      sort: { columnId: 'fit_lens', dir: 'desc' },
      createdAt: '2026-06-02T14:00:00Z',
      updatedAt: '2026-06-02T14:00:00Z',
    },
    {
      id: 'view-renewal-watch',
      name: 'Renewal watch',
      source: 'book',
      system: true,
      isDefault: false,
      filters: { offeringId: 'all', signalKinds: ['stale_no_touch'], tier: 'all', stage: 'customer' },
      columns: [
        ...DEFAULT_COLUMN_IDS.map((id) => ({ id, kind: 'builtin' })),
        { id: 'enrich-last-engagement', kind: 'enriched', question: 'When was the last meaningful engagement?', category: 'fp' },
      ],
      sort: { columnId: 'opp_score', dir: 'desc' },
      createdAt: '2026-06-03T09:00:00Z',
      updatedAt: '2026-06-03T09:00:00Z',
    },

    // ─── Whitespace views ───
    {
      id: 'view-ws-all',
      name: 'All whitespace',
      source: 'whitespace',
      system: true,
      isDefault: true,
      filters: { offeringId: 'all', signalKinds: [], tier: 'all' },
      columns: DEFAULT_COLUMN_IDS.map((id) => ({ id, kind: 'builtin' })),
      sort: { columnId: 'fit_lens', dir: 'desc' },
      createdAt: '2026-06-04T10:00:00Z',
      updatedAt: '2026-06-04T10:00:00Z',
    },
    {
      id: 'view-ws-cnapp-atier',
      name: 'CNAPP A-tier whitespace',
      source: 'whitespace',
      system: true,
      isDefault: false,
      filters: { offeringId: 'cnapp', signalKinds: [], tier: 'A' },
      columns: [
        ...DEFAULT_COLUMN_IDS.map((id) => ({ id, kind: 'builtin' })),
        { id: 'enrich-ws-pa-decline', kind: 'enriched', question: 'Is Palo Alto Prisma intensity declining at this account?', category: 'tech' },
        { id: 'enrich-ws-cnapp-intent', kind: 'enriched', question: 'Is this account actively researching CNAPP?', category: 'intent' },
      ],
      sort: { columnId: 'fit_lens', dir: 'desc' },
      createdAt: '2026-06-05T14:00:00Z',
      updatedAt: '2026-06-05T14:00:00Z',
    },
    {
      id: 'view-ws-displacement',
      name: 'Displacement-ready whitespace',
      source: 'whitespace',
      system: true,
      isDefault: false,
      filters: { offeringId: 'all', signalKinds: ['competitor_displacement'], tier: 'all' },
      columns: [
        ...DEFAULT_COLUMN_IDS.map((id) => ({ id, kind: 'builtin' })),
        { id: 'enrich-ws-disp', kind: 'enriched', question: 'Is this account ready for competitive displacement?', category: 'scoring' },
      ],
      sort: { columnId: 'fit_lens', dir: 'desc' },
      createdAt: '2026-06-06T09:00:00Z',
      updatedAt: '2026-06-06T09:00:00Z',
    },
  ];
}

// ----- Persistence -----

// IDs of the original seeded views — used to retroactively stamp the
// `system: true` flag on cached localStorage entries from older builds
// (where the flag didn't exist yet).
const SYSTEM_VIEW_IDS = new Set([
  'view-all',
  'view-cnapp-pipeline',
  'view-renewal-watch',
  'view-ws-all',
  'view-ws-cnapp-atier',
  'view-ws-displacement',
]);

function migrateSystemFlag(view) {
  if (view.system === true) return view;
  if (SYSTEM_VIEW_IDS.has(view.id)) return { ...view, system: true };
  return view;
}

export function readViews(personaId) {
  if (typeof window === 'undefined') return defaultViews();
  try {
    const raw = window.localStorage.getItem(keyFor(personaId));
    if (!raw) return defaultViews();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultViews();
    return parsed.map(migrateSystemFlag);
  } catch {
    return defaultViews();
  }
}

export function writeViews(personaId, views) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(keyFor(personaId), JSON.stringify(views));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore quota
  }
}

export function subscribeViews(onChange) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

// ─── Shared views store ──────────────────────────────────────────────

function readSharedViews() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SHARED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSharedViews(views) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(views));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore quota
  }
}

// Visibility check: is this shared view accessible to the given persona?
function sharedViewVisibleTo(view, personaId) {
  const v = view.visibility || 'tenant';
  if (v === 'tenant') return true;
  if (v === 'team') {
    const teams = personaTeamIds(personaId);
    return (view.teamIds || []).some((t) => teams.includes(t));
  }
  if (v === 'users') {
    return (view.userIds || []).includes(personaId);
  }
  return false;
}

// ----- CRUD -----

function genId() {
  return `view-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export function getView(personaId, viewId) {
  const views = readViews(personaId);
  return views.find((v) => v.id === viewId) || views.find((v) => v.isDefault && (v.source || 'book') === 'book') || views[0];
}

export function getDefaultView(personaId, source = 'book') {
  const views = readViews(personaId);
  return views.find((v) => v.isDefault && (v.source || 'book') === source) || views.find((v) => (v.source || 'book') === source) || views[0];
}

// Views filtered to a given source (book | whitespace). Returns the
// union of the persona's PRIVATE views plus SHARED views the persona
// has access to (tenant-wide, team-shared they belong to, or
// explicitly listed for the persona). Shared views are tagged with a
// `shared: true` flag so the sidebar can render a "shared" indicator.
export function listViewsBySource(personaId, source) {
  const personal = readViews(personaId).filter((v) => (v.source || 'book') === source);
  const shared = readSharedViews()
    .filter((v) => (v.source || 'book') === source)
    .filter((v) => v.ownerId !== personaId) // owner already has the private copy
    .filter((v) => sharedViewVisibleTo(v, personaId))
    .map((v) => ({ ...v, shared: true }));
  return [...personal, ...shared];
}

// Save a workbook view. Visibility decides storage routing:
//   - 'private' (default): personal store only
//   - 'tenant': shared store, visible to all personas
//   - 'team':   shared store, visible only to personas in teamIds
//   - 'users':  shared store, visible only to personas in userIds
//
// In all cases we also keep a copy in the OWNER's personal store so they
// see their own view alongside others' shared ones (and can edit / delete
// it without team-wide permissions checks).
export function saveCurrentAsNewView(personaId, currentView, name, sharing = {}) {
  const id = genId();
  const visibility = sharing.visibility || 'private';
  const next = {
    ...currentView,
    id,
    name: name || `${currentView.name} (copy)`,
    source: currentView.source || 'book',
    isDefault: false,
    ownerId: personaId,
    visibility,
    teamIds: sharing.teamIds || [],
    userIds: sharing.userIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // Always write a personal copy for the owner.
  writeViews(personaId, [...readViews(personaId), next]);
  // If shared, also push into the shared store so other personas see it.
  if (visibility !== 'private') {
    writeSharedViews([...readSharedViews(), next]);
  }
  return next;
}

export function updateView(personaId, viewId, patch) {
  const views = readViews(personaId);
  const next = views.map((v) =>
    v.id === viewId ? { ...v, ...patch, updatedAt: new Date().toISOString() } : v,
  );
  writeViews(personaId, next);
}

export function deleteView(personaId, viewId) {
  const views = readViews(personaId);
  const remaining = views.filter((v) => v.id !== viewId);
  // If we deleted the default, mark the first remaining as default
  if (remaining.length > 0 && !remaining.find((v) => v.isDefault)) {
    remaining[0] = { ...remaining[0], isDefault: true };
  }
  writeViews(personaId, remaining);
}

export function setDefaultView(personaId, viewId) {
  const views = readViews(personaId);
  const target = views.find((v) => v.id === viewId);
  if (!target) return;
  const targetSource = target.source || 'book';
  writeViews(
    personaId,
    views.map((v) => ({
      ...v,
      // Only clear isDefault within the same source — each source has its own default
      isDefault: v.id === viewId ? true : (v.source || 'book') === targetSource ? false : v.isDefault,
    })),
  );
}

export function addEnrichedColumn(personaId, viewId, { question, category }) {
  const views = readViews(personaId);
  const targetView = views.find((v) => v.id === viewId);
  if (!targetView) return null;
  const colId = `enrich-${Date.now().toString(36)}`;
  const nextCol = { id: colId, kind: 'enriched', question, category };
  const updatedView = {
    ...targetView,
    columns: [...targetView.columns, nextCol],
    updatedAt: new Date().toISOString(),
  };
  writeViews(
    personaId,
    views.map((v) => (v.id === viewId ? updatedView : v)),
  );
  return colId;
}

export function removeColumn(personaId, viewId, columnId) {
  const views = readViews(personaId);
  const targetView = views.find((v) => v.id === viewId);
  if (!targetView) return;
  const updatedView = {
    ...targetView,
    columns: targetView.columns.filter((c) => c.id !== columnId),
    updatedAt: new Date().toISOString(),
  };
  writeViews(
    personaId,
    views.map((v) => (v.id === viewId ? updatedView : v)),
  );
}

export function updateViewFilters(personaId, viewId, filters) {
  updateView(personaId, viewId, { filters });
}

export function resetToDefaults(personaId) {
  writeViews(personaId, defaultViews());
}
