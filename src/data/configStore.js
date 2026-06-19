// configStore.js
//
// Canonical store for the three core tenant-config objects — Offerings, Plays,
// and Scoring Models. The wizard (src/components/onboarding/Step*) and the
// admin surfaces (src/routes/OfferingsRoute, PlaysRoute, ScoringModelBuilder)
// both read + write here, so the schema is identical regardless of where a
// user lands.
//
// Persistence: localStorage. Cross-tab + same-tab updates via window event.
//
// ─────────────────────────────────────────────────────────────────────────
//  CANONICAL SCHEMAS — these are the contracts engineering will implement.
// ─────────────────────────────────────────────────────────────────────────
//
//  Offering {
//    id:                  string
//    key:                 string                   // canonical type: cnapp | code | cdr | custom
//    name:                string                   // e.g. "Wiz Cloud Security Platform"
//    shortName:           string                   // e.g. "CNAPP"
//    description:         string
//    products: Array<{
//      id:                string
//      name:              string
//      description:       string
//      source:            'derived' | 'manual'     // derived = AI-extracted from tenant site
//    }>
//    painPoints:          Array<string>
//    intentTopics:        Array<string>
//    competitors: Array<{
//      id:                string
//      name:              string
//      vendor?:           string
//      threat?:           'incumbent' | 'rising' | 'declining' | 'direct' | 'adjacent' | 'emerging'
//    }>
//    complementaryTech:   Array<string>
//    targetIcp: {
//      industries:        Array<string>
//      employeeBand:      string                   // e.g. "1,000–10K+"
//      revenueBand:       string                   // e.g. "$1B–$10B+"
//      geography:         Array<string>
//    }
//    gtmMotions:          Array<'displacement' | 'new_logo' | 'expansion'>
//    groupingRationale:   string                   // LLM explanation, editable
//    confirmed:           boolean
//    createdAt:           ISODate
//    updatedAt:           ISODate
//
//    // Legacy display fields — kept for backward compat with existing UI
//    color?:              string
//    bg?:                 string
//    textColor?:          string
//    borderColor?:        string
//    activeAccounts?:     number
//    avgDealSize?:        string
//    salesMotion?:        string
//    fullName?:           string                   // long-form name (auto = name)
//  }
//
//  Play {
//    id:                  string
//    name:                string
//    motion:              'displacement' | 'new_logo' | 'in_market' | 'opportunity_window' | 'expansion' | 'renewal'
//    description:         string
//    offerings:           Array<offeringId>        // multi-attach
//    audienceRoles:       Array<'AE' | 'AM' | 'CSM' | 'BDR' | 'SDR'>
//    firmoFilters: {
//      industries:        Array<string>
//      sizeBand:          string
//      regions:           Array<string>
//    }
//    technoFilters: {
//      hasInstalled:      Array<string>
//      missingInstall:    Array<string>
//      custom:            Array<string>
//    }
//    signalIds:           Array<string>             // ranking signals composing this play
//    signalPreview:       Array<string>             // human-readable preview for UI
//    estimatedMatches:    number
//    status:              'draft' | 'active' | 'paused'
//    confirmed:           boolean
//    createdAt:           ISODate
//    updatedAt:           ISODate
//
//    // Legacy display fields kept for backward compat
//    offering_id?:        offeringId                // = offerings[0]
//    surface_scope?:      'book' | 'whitespace' | 'both'
//    is_default_chip?:    boolean
//    recommended_workflows?: Array<workflowId>
//    eligibility?:        { min_offering_fit?: number }
//    version?:            number
//    created_by?:         string
//  }
//
//  ScoringModel {
//    // ScoringModel keeps its original shape (defined in src/data/scoringModels.js)
//    // PLUS:
//    liveStatus:          'draft' | 'live'          // explicit go-live gate
//    liveAt:              ISODate | null            // when it went live
//  }
//
// ─────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'rgi-config-store-v1';
const CHANGE_EVENT = 'rgi:config-store-changed';

// Default seeds — only used on first load. Pulled in lazily from the
// legacy data files so we don't double-import.
import { OFFERINGS as LEGACY_OFFERINGS } from './offerings.legacy.js';
import { PLAYS as LEGACY_PLAYS, SEEDED_PLAY_IDS } from './plays.legacy.js';

const NOW = () => new Date().toISOString();

// ─── Offering migration ────────────────────────────────────────────────────
//
// Maps a legacy offering (rich palette + sales metadata, flat painPoints) onto
// the canonical schema. The legacy file ships as `offerings.legacy.js`; this
// adapter is the single place where the shape transformation lives.

function inferOfferingKey(legacy) {
  const haystack = `${legacy.id} ${legacy.name || ''}`.toLowerCase();
  if (haystack.includes('cnapp') || haystack.includes('cspm')) return 'cnapp';
  if (haystack.includes('code') || haystack.includes('iac')) return 'code';
  if (haystack.includes('cdr') || haystack.includes('defend') || haystack.includes('workload')) return 'cdr';
  if (haystack.includes('ciem')) return 'ciem';
  if (haystack.includes('dspm')) return 'dspm';
  return 'custom';
}

function adaptLegacyOffering(legacy) {
  return {
    id: legacy.id,
    key: inferOfferingKey(legacy),
    name: legacy.name,
    shortName: legacy.name?.replace(/^Wiz /, '') || legacy.name,
    description: legacy.description || '',
    products: [
      {
        id: legacy.id,
        name: legacy.name,
        description: legacy.description || '',
        source: 'derived',
      },
    ],
    painPoints: legacy.painPoints || [],
    intentTopics: legacy.intentTopics || [],
    competitors: (legacy.competitors || []).map((c, i) =>
      typeof c === 'string'
        ? { id: `${legacy.id}-c-${i}`, name: c, vendor: c, threat: 'direct' }
        : c,
    ),
    complementaryTech: legacy.complementaryTech || [],
    targetIcp: {
      industries: legacy.targetICP?.industries || [],
      employeeBand: legacy.targetICP?.employees || '',
      revenueBand: legacy.targetICP?.revenue || '',
      geography: legacy.targetICP?.geography || ['United States'],
    },
    gtmMotions: ['displacement', 'new_logo', 'expansion'],
    groupingRationale: legacy.salesMotion ? `Sales motion: ${legacy.salesMotion}` : '',
    confirmed: true,
    createdAt: NOW(),
    updatedAt: NOW(),

    // Legacy display fields preserved — needed by scoringModels.js,
    // ScoringModelBuilderRoute.jsx, OfferingsRoute detail view, etc.
    // These accesses happen at module init time (buildModels) so they MUST
    // be present or the entire JS bundle fails to execute.
    color: legacy.color,
    bg: legacy.bg,
    textColor: legacy.textColor,
    borderColor: legacy.borderColor,
    activeAccounts: legacy.activeAccounts,
    avgDealSize: legacy.avgDealSize,
    salesMotion: legacy.salesMotion,
    fullName: legacy.fullName || legacy.name,
    targetICP: legacy.targetICP || {
      employees: '',
      industries: [],
      cloudPosture: '',
    },
  };
}

// ─── Play migration ────────────────────────────────────────────────────────

function adaptLegacyPlay(legacy) {
  return {
    id: legacy.id,
    name: legacy.name,
    motion: legacy.motion,
    description: legacy.description || '',
    offerings: legacy.offering_id ? [legacy.offering_id] : [],
    audienceRoles: legacy.audience_roles || ['AE'],
    firmoFilters: legacy.firmoFilters || { industries: [], sizeBand: '', regions: [] },
    technoFilters: legacy.technoFilters || { hasInstalled: [], missingInstall: [], custom: [] },
    signalIds: legacy.signals || [],
    signalPreview: (legacy.signals || []).slice(0, 4),
    estimatedMatches: 0,
    status: legacy.status || 'draft',
    confirmed: legacy.status === 'active',
    createdAt: NOW(),
    updatedAt: NOW(),

    // Legacy display fields preserved
    offering_id: legacy.offering_id,
    surface_scope: legacy.surface_scope,
    is_default_chip: legacy.is_default_chip,
    recommended_workflows: legacy.recommended_workflows || [],
    eligibility: legacy.eligibility,
    version: legacy.version,
    created_by: legacy.created_by,
  };
}

// ─── State helpers ─────────────────────────────────────────────────────────

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function freshState() {
  return {
    offerings: LEGACY_OFFERINGS.map(adaptLegacyOffering),
    plays: LEGACY_PLAYS.map(adaptLegacyPlay),
    scoringModelStatus: {}, // { [modelId]: { liveStatus, liveAt } }
    initializedAt: NOW(),
  };
}

// Apply backward-compat field synthesis to every offering + play on read.
// This self-heals localStorage written by older versions of the wizard or
// by an earlier broken deploy. Idempotent.
// Map of seeded play id → canonical seed object. Used by a one-time
// migration that overwrites stale firmoFilters/technoFilters in cached
// localStorage from older builds (which seeded out-of-ICP industries).
const LEGACY_PLAYS_BY_ID = Object.fromEntries(LEGACY_PLAYS.map((p) => [p.id, p]));

// Schema version for the plays slice. Bump when seed audience values
// change in a way that should overwrite cached state once. After the
// migration runs, admin edits persist normally.
// v3: stripped industries/regions from seeded plays so they inherit
//     offering Target ICP via getEffectivePlayAudience().
const PLAYS_SCHEMA_VERSION = 3;

function migrateStaleState(parsed) {
  const needsPlaysReseed = (parsed.playsSchemaVersion || 0) < PLAYS_SCHEMA_VERSION;
  return {
    ...parsed,
    offerings: (parsed.offerings || []).map(ensureLegacyOfferingFields),
    plays: (parsed.plays || [])
      .filter((p) => SEEDED_PLAY_IDS.has(p.id))
      .map((p) => {
        if (!needsPlaysReseed) return ensureLegacyPlayFields(p);
        const canonical = LEGACY_PLAYS_BY_ID[p.id];
        const merged = canonical
          ? {
              ...p,
              firmoFilters: canonical.firmoFilters || p.firmoFilters,
              technoFilters: canonical.technoFilters || p.technoFilters,
              visibility: p.visibility || canonical.visibility || 'tenant',
            }
          : p;
        return ensureLegacyPlayFields(merged);
      }),
    playsSchemaVersion: PLAYS_SCHEMA_VERSION,
    scoringModelStatus: parsed.scoringModelStatus || {},
  };
}

function readState() {
  if (typeof window === 'undefined') return freshState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw && safeParse(raw);
  if (!parsed || !parsed.offerings || !parsed.plays) {
    const next = freshState();
    writeState(next);
    return next;
  }
  return migrateStaleState(parsed);
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

// ─── Public API: Offerings ─────────────────────────────────────────────────

export function listOfferings() {
  return readState().offerings;
}

export function getOffering(id) {
  return readState().offerings.find((o) => o.id === id) || null;
}

// Ensure every play passing through the store carries the legacy field
// mirrors that older consumers (PlaysRoute, WorkflowStudio, SellerHome, etc.)
// expect. Without these fallbacks, .join() / .map() calls on undefined
// throw at render time. Idempotent — safe to apply on every read + write.
function ensureLegacyPlayFields(play) {
  return {
    ...play,
    audience_roles: play.audience_roles || play.audienceRoles || ['AE'],
    signals: play.signals || play.signalIds || [],
    surface_scope: play.surface_scope || 'both',
    is_default_chip: play.is_default_chip ?? play.confirmed ?? false,
    recommended_workflows: play.recommended_workflows || [],
    eligibility: play.eligibility || {},
    version: play.version || 1,
    created_by: play.created_by || 'AI',
    offering_id: play.offering_id || play.offerings?.[0] || null,
    visibility: play.visibility || 'tenant',
    teamIds: play.teamIds || [],
    userIds: play.userIds || [],
    audienceFilters: Array.isArray(play.audienceFilters) ? play.audienceFilters : [],
  };
}

// Palette defaults by offering key so wizard-saved offerings (which don't
// carry the legacy palette fields) still get sensible color treatments and
// don't crash consumers that do `.replace()` etc. on these strings.
const PALETTE_BY_KEY = {
  cnapp:  { color: '#0ea5e9', bg: 'bg-sky-500/10',     textColor: 'text-sky-700 dark:text-sky-300',         borderColor: 'border-sky-500/30' },
  ciem:   { color: '#8b5cf6', bg: 'bg-violet-500/10',  textColor: 'text-violet-700 dark:text-violet-300',   borderColor: 'border-violet-500/30' },
  dspm:   { color: '#10b981', bg: 'bg-emerald-500/10', textColor: 'text-emerald-700 dark:text-emerald-300', borderColor: 'border-emerald-500/30' },
  code:   { color: '#8b5cf6', bg: 'bg-violet-500/10',  textColor: 'text-violet-700 dark:text-violet-300',   borderColor: 'border-violet-500/30' },
  cdr:    { color: '#f43f5e', bg: 'bg-rose-500/10',    textColor: 'text-rose-700 dark:text-rose-300',       borderColor: 'border-rose-500/30' },
  workload: { color: '#f59e0b', bg: 'bg-amber-500/10', textColor: 'text-amber-700 dark:text-amber-300',     borderColor: 'border-amber-500/30' },
  custom: { color: '#64748b', bg: 'bg-slate-500/10',   textColor: 'text-slate-700 dark:text-slate-300',     borderColor: 'border-slate-500/30' },
};

// Ensure every offering passing through the store carries the legacy
// display + structural fields so module-init-time consumers (scoringModels.js,
// ScoringModelBuilderRoute.jsx, OfferingsRoute, AccountThread, etc.) don't
// crash. Wizard-saved offerings often miss the palette fields — we fill
// them from a key-based default.
function ensureLegacyOfferingFields(offering) {
  const tg = offering.targetIcp || {};
  const legacyTargetICP =
    offering.targetICP || {
      employees: tg.employeeBand || '',
      industries: tg.industries || [],
      cloudPosture: '',
      revenue: tg.revenueBand || '',
      geography: tg.geography || [],
    };
  const palette = PALETTE_BY_KEY[offering.key] || PALETTE_BY_KEY.custom;
  return {
    ...offering,
    targetICP: legacyTargetICP,
    fullName: offering.fullName || offering.name,
    color:       offering.color       || palette.color,
    bg:          offering.bg          || palette.bg,
    textColor:   offering.textColor   || palette.textColor,
    borderColor: offering.borderColor || palette.borderColor,
    activeAccounts: offering.activeAccounts ?? 0,
    avgDealSize: offering.avgDealSize || '—',
    salesMotion: offering.salesMotion || offering.groupingRationale || 'AI-derived from offering config',
  };
}

export function upsertOffering(offering) {
  const safe = ensureLegacyOfferingFields(offering);
  return update((state) => {
    const idx = state.offerings.findIndex((o) => o.id === safe.id);
    const stamped = { ...safe, updatedAt: NOW() };
    const offerings =
      idx >= 0
        ? state.offerings.map((o, i) => (i === idx ? { ...o, ...stamped } : o))
        : [...state.offerings, { ...stamped, createdAt: NOW() }];
    return { ...state, offerings };
  });
}

export function deleteOffering(id) {
  return update((state) => ({
    ...state,
    offerings: state.offerings.filter((o) => o.id !== id),
  }));
}

export function replaceOfferings(offerings) {
  return update((state) => ({
    ...state,
    offerings: offerings.map((o) => ({ ...ensureLegacyOfferingFields(o), updatedAt: NOW() })),
  }));
}

// ─── Public API: Plays ─────────────────────────────────────────────────────

export function listPlays() {
  return readState().plays;
}

export function getPlay(id) {
  return readState().plays.find((p) => p.id === id) || null;
}

export function upsertPlay(play) {
  const safe = ensureLegacyPlayFields(play);
  return update((state) => {
    const idx = state.plays.findIndex((p) => p.id === safe.id);
    const stamped = { ...safe, updatedAt: NOW() };
    const plays =
      idx >= 0
        ? state.plays.map((p, i) => (i === idx ? { ...p, ...stamped } : p))
        : [...state.plays, { ...stamped, createdAt: NOW() }];
    return { ...state, plays };
  });
}

export function deletePlay(id) {
  return update((state) => ({ ...state, plays: state.plays.filter((p) => p.id !== id) }));
}

export function replacePlays(plays) {
  return update((state) => ({
    ...state,
    plays: plays.map((p) => ({ ...ensureLegacyPlayFields(p), updatedAt: NOW() })),
  }));
}

// ─── Public API: Scoring Model live/draft status ──────────────────────────

export function getScoringModelStatus(modelId) {
  const entry = readState().scoringModelStatus[modelId];
  return entry || { liveStatus: 'live', liveAt: null }; // legacy models default to live
}

export function setScoringModelLive(modelId) {
  return update((state) => ({
    ...state,
    scoringModelStatus: {
      ...state.scoringModelStatus,
      [modelId]: { liveStatus: 'live', liveAt: NOW() },
    },
  }));
}

export function setScoringModelDraft(modelId) {
  return update((state) => ({
    ...state,
    scoringModelStatus: {
      ...state.scoringModelStatus,
      [modelId]: { liveStatus: 'draft', liveAt: null },
    },
  }));
}

// ─── Subscribe ─────────────────────────────────────────────────────────────

export function subscribeConfig(onChange) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  const storageHandler = (e) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

export function resetConfig() {
  writeState(freshState());
}
