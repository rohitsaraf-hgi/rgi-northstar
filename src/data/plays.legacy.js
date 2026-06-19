// Plays — business motions. RevOps configures Plays; sellers pick them on home.
//
// New mental model (Phase 14):
//   Play  = the business motion (Competitive Takeout, Net New Logo, Expansion…)
//   Signal = the atomic ranking + explanation primitive (lives in rankingSignals.js)
//
// A Play references a set of Signal IDs. An account appears in the Play if at
// least one of its signals fires. Ranking = sum of firing signal weights ×
// offering fit. Each row's provenance lists the firing signal names so the
// seller knows the "why" for outreach.

// ----- Seed plays — 6 business motions -----

export const PLAYS = [
  {
    id: 'play-competitive-takeout',
    name: 'Competitive Takeout',
    description: 'Displace incumbent CNAPP vendors at accounts where their renewal cliff is approaching.',
    motion: 'displacement',
    status: 'active',
    offering_id: 'cnapp',
    audience_roles: ['AE'],
    surface_scope: 'both',
    is_default_chip: true,
    eligibility: { min_offering_fit: 60 },
    // Audience defaults tracking the tenant ICP. The wizard / play editor
    // can narrow further; soft-warn if anyone reaches outside this set.
    firmoFilters: {
      industries: ['Banking and Financial Services', 'Computer and Electronic Product Manufacturing'],
      sizeBand: '1,000+ employees',
      regions: ['United States'],
    },
    technoFilters: {
      hasInstalled: ['Palo Alto Prisma Cloud', 'Lacework Polygraph', 'Orca Security'],
      missingInstall: [],
      custom: ['Install age ≥ 24 months'],
    },
    signals: [
      'sig-palo-alto-installed',
      'sig-palo-alto-aging',
      'sig-palo-alto-declining',
      'sig-lacework-installed',
      'sig-orca-installed',
      'sig-aqua-aging',
      'sig-cnapp-intent-active',
      'sig-comparison-research',
      'sig-new-ciso',
    ],
    recommended_workflows: ['cnapp-displacement-brief', 'sales-play-fintech-displacement'],
    created_by: 'Priya',
    version: 2,
    visibility: 'tenant',
  },
  {
    id: 'play-net-new-logo',
    name: 'Net New Logo',
    description: 'High-fit prospects with no incumbent and active in-market signals — pure pursuit territory.',
    motion: 'new_logo',
    status: 'active',
    offering_id: 'cnapp',
    audience_roles: ['AE'],
    surface_scope: 'whitespace',
    is_default_chip: true,
    eligibility: { min_offering_fit: 70 },
    firmoFilters: {
      industries: ['Banking and Financial Services', 'Computer and Electronic Product Manufacturing'],
      sizeBand: '500+ employees',
      regions: ['United States'],
    },
    technoFilters: {
      hasInstalled: [],
      missingInstall: ['Palo Alto Prisma Cloud', 'Lacework', 'Orca Security'],
      custom: ['Multi-cloud: AWS + (Azure or GCP)'],
    },
    signals: [
      'sig-no-cnapp-incumbent',
      'sig-cnapp-intent-active',
      'sig-multi-cloud',
      'sig-new-ciso',
      'sig-funding-raised',
      'sig-ai-spend-growing',
      'sig-pricing-visits',
      'sig-intent-surge',
    ],
    recommended_workflows: ['account-brief-flow', 'cnapp-displacement-brief'],
    created_by: 'Priya',
    version: 1,
    visibility: 'tenant',
  },
  {
    id: 'play-expansion',
    name: 'Expansion / Cross-sell',
    description: 'Existing CNAPP customers with strong fit for CIEM / DSPM / Workload — natural upsell motion.',
    motion: 'expansion',
    status: 'active',
    offering_id: 'ciem',
    audience_roles: ['AM'],
    surface_scope: 'book',
    is_default_chip: true,
    eligibility: { min_offering_fit: 60 },
    firmoFilters: {
      industries: ['Banking and Financial Services', 'Computer and Electronic Product Manufacturing'],
      sizeBand: '1,000+ employees',
      regions: ['United States'],
    },
    technoFilters: {
      hasInstalled: ['Wiz Cloud Security Platform'],
      missingInstall: [],
      custom: ['Existing customer ≥ 90 days', 'Champion present'],
    },
    signals: [
      'sig-crm-existing-customer',
      'sig-crm-has-champion',
      'sig-ciem-intent-active',
      'sig-dspm-intent-active',
      'sig-it-spend-growing',
      'sig-data-platform-installed',
    ],
    recommended_workflows: ['ciem-audit-probe', 'dspm-rfp-response'],
    created_by: 'Priya',
    version: 1,
    visibility: 'tenant',
  },
];

// Allowlist used by configStore.migrateStaleState to prune plays from
// older builds that seeded a broader catalog. Anything not in this set
// is dropped on read so the demo stays consistent.
export const SEEDED_PLAY_IDS = new Set([
  'play-competitive-takeout',
  'play-net-new-logo',
  'play-expansion',
]);

export const PLAYS_BY_ID = Object.fromEntries(PLAYS.map((p) => [p.id, p]));

// Motion metadata (just for UI labeling)
export const MOTION_LABELS = {
  displacement: 'Displacement',
  new_logo: 'Net New Logo',
  expansion: 'Expansion',
  renewal: 'Renewal Defense',
  in_market: 'In-Market',
  opportunity_window: 'Catalyst',
};

export function listPlays() {
  return PLAYS;
}

export function getPlay(id) {
  return PLAYS_BY_ID[id] || null;
}

export function listPlaysForRole(role) {
  if (!role) return PLAYS;
  return PLAYS.filter((p) => p.audience_roles.includes(role));
}

export function listDefaultPlaysForRole(role) {
  return listPlaysForRole(role).filter((p) => p.is_default_chip);
}

// ----- Pin/unpin persistence per persona -----

const PIN_KEY_PREFIX = 'rgi-pinned-plays-';
const PIN_CHANGE_EVENT = 'rgi:pinned-plays-changed';

function pinKey(personaId) {
  return `${PIN_KEY_PREFIX}${personaId}`;
}

export function getPinnedPlayIds(personaId) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(pinKey(personaId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setPinnedPlayIds(personaId, ids) {
  if (typeof window === 'undefined') return;
  try {
    if (ids == null) {
      window.localStorage.removeItem(pinKey(personaId));
    } else {
      window.localStorage.setItem(pinKey(personaId), JSON.stringify(ids));
    }
    window.dispatchEvent(new Event(PIN_CHANGE_EVENT));
  } catch {
    // ignore
  }
}

export function subscribePinnedPlays(onChange) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onChange();
  window.addEventListener(PIN_CHANGE_EVENT, handler);
  return () => window.removeEventListener(PIN_CHANGE_EVENT, handler);
}

export function effectivePinnedPlayIds(personaId, role) {
  const override = getPinnedPlayIds(personaId);
  if (override != null) return override;
  return listDefaultPlaysForRole(role).map((p) => p.id);
}
