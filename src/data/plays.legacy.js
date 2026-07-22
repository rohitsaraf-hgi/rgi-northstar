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
    // firmoFilters intentionally left empty — play inherits the offering's
    // Target ICP at filter time via getEffectivePlayAudience(). Admin can
    // explicitly narrow further in the play editor; those narrowings are
    // stored here as overrides.
    firmoFilters: { industries: [], sizeBand: '1,000+ employees', regions: [] },
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
    type: 'outbound',
    activation: {
      mode: 'admin_activated',
      batchSize: 10,
      batchGapMinutes: 30,
      autoRunOnNewRecords: true,
      triggerType: null,
      triggerConfig: {},
      activatedAt: null,
      batches: [],
    },
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
    // firmoFilters left empty so the play inherits the offering's Target
    // ICP at filter time. Admin can narrow further via the play editor.
    firmoFilters: { industries: [], sizeBand: '500+ employees', regions: [] },
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
    recommended_workflows: ['wf-tpl-prospecting-agent', 'account-brief-flow'],
    type: 'outbound',
    activation: {
      mode: 'admin_activated',
      batchSize: 10,
      batchGapMinutes: 30,
      autoRunOnNewRecords: true,
      triggerType: null,
      triggerConfig: {},
      activatedAt: null,
      batches: [],
    },
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
    // firmoFilters intentionally left empty — play inherits the offering's
    // Target ICP at filter time via getEffectivePlayAudience(). Admin can
    // explicitly narrow further in the play editor; those narrowings are
    // stored here as overrides.
    firmoFilters: { industries: [], sizeBand: '', regions: [] },
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
    type: 'outbound',
    activation: {
      mode: 'admin_activated',
      batchSize: 10,
      batchGapMinutes: 30,
      autoRunOnNewRecords: true,
      triggerType: null,
      triggerConfig: {},
      activatedAt: null,
      batches: [],
    },
    created_by: 'Priya',
    version: 1,
    visibility: 'tenant',
  },
  // Inbound seed — champion job change firing on LinkedIn signal.
  {
    id: 'play-champion-move',
    name: 'Champion Job Change',
    description: 'When a tracked champion changes jobs, protect the existing deal and open a new opportunity at their new company.',
    motion: 'opportunity_window',
    status: 'active',
    offering_id: 'cnapp',
    audience_roles: ['AE', 'AM'],
    surface_scope: 'both',
    is_default_chip: true,
    eligibility: {},
    firmoFilters: { industries: [], sizeBand: '', regions: [] },
    technoFilters: { hasInstalled: [], missingInstall: [], custom: [] },
    signals: ['sig-champion-move'],
    recommended_workflows: ['wf-tpl-champion-job-change'],
    type: 'inbound',
    activation: {
      mode: 'trigger',
      batchSize: 10,
      batchGapMinutes: 30,
      autoRunOnNewRecords: false,
      triggerType: 'champion_job_change',
      triggerConfig: { source: 'LinkedIn · verified change', min_seniority: 'Director+' },
      activatedAt: null,
      batches: [],
    },
    created_by: 'Priya',
    version: 1,
    visibility: 'tenant',
  },
  // Inbound seed — renewal risk trigger.
  {
    id: 'play-renewal-defense',
    name: 'Renewal Defense',
    description: 'Triggered when Renewal Risk fires on an account. Generates renewal readiness brief and drafts a save email for AM approval.',
    motion: 'renewal',
    status: 'active',
    offering_id: 'cnapp',
    audience_roles: ['AM', 'CSM'],
    surface_scope: 'book',
    is_default_chip: true,
    eligibility: {},
    firmoFilters: { industries: [], sizeBand: '', regions: [] },
    technoFilters: { hasInstalled: ['Wiz Cloud Security Platform'], missingInstall: [], custom: [] },
    signals: ['sig-renewal-risk'],
    recommended_workflows: ['renewal-defense-play'],
    type: 'inbound',
    activation: {
      mode: 'trigger',
      batchSize: 10,
      batchGapMinutes: 30,
      autoRunOnNewRecords: false,
      triggerType: 'signal',
      triggerConfig: { signal_id: 'renewal-risk' },
      activatedAt: null,
      batches: [],
    },
    created_by: 'Priya',
    version: 1,
    visibility: 'tenant',
  },
  // ────────────────────────────────────────────────────────────────────
  // Alex's seeded outbound plays — demonstrate the three shapes of a
  // play run on the Daily Brief:
  //   1. Workflow-only  — a single attached workflow (Account Brief)
  //   2. Actions-only   — no workflow; individual actions on a contact
  //                       workbook (Draft email → Add to sequence)
  //   3. Combined       — multi-step workflow + subsequent actions
  // Each ships with activation.activatedAt + a batches[] history so the
  // outcome bars have real data on cold-load.
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'play-account-brief-batch',
    name: 'Account Brief · ICP Batch',
    description: 'Generate a full account brief for every company in ICP Match. One-shot batch that primes reps for their outreach the next morning.',
    motion: 'new_logo',
    status: 'active',
    offering_id: 'cnapp',
    audience_roles: ['AE'],
    surface_scope: 'both',
    is_default_chip: true,
    eligibility: {},
    firmoFilters: { industries: [], sizeBand: '', regions: [] },
    technoFilters: { hasInstalled: [], missingInstall: [], custom: [] },
    signals: [],
    recommended_workflows: ['account-brief-flow'],
    workbookIds: ['wb-icp-match'],
    source_workbook_id: 'wb-icp-match',
    type: 'outbound',
    activation: {
      mode: 'admin_activated',
      batchSize: 10,
      batchGapMinutes: 30,
      autoRunOnNewRecords: true,
      triggerType: null,
      triggerConfig: {},
      activatedAt: '2026-07-21T14:30:00Z',
      batches: [
        { index: 1, total: 5, recordCount: 10, status: 'completed', scheduledAt: '2026-07-21T14:30:00Z', completedAt: '2026-07-21T14:38:00Z' },
        { index: 2, total: 5, recordCount: 10, status: 'completed', scheduledAt: '2026-07-21T15:00:00Z', completedAt: '2026-07-21T15:07:00Z' },
        { index: 3, total: 5, recordCount: 10, status: 'completed', scheduledAt: '2026-07-21T15:30:00Z', completedAt: '2026-07-21T15:39:00Z' },
        { index: 4, total: 5, recordCount: 10, status: 'running',   scheduledAt: '2026-07-22T09:00:00Z' },
        { index: 5, total: 5, recordCount: 8,  status: 'scheduled', scheduledAt: '2026-07-22T09:30:00Z' },
      ],
    },
    actions: [],
    source_record_ids: [],
    created_by: 'Alex',
    version: 1,
    visibility: 'private',
  },
  {
    id: 'play-contact-outreach-jul',
    name: 'Contact Outreach · July Saved',
    description: 'For every contact in the Saved Contacts · July workbook: draft a personalized email and enroll them in an Outreach sequence.',
    motion: 'new_logo',
    status: 'active',
    offering_id: 'cnapp',
    audience_roles: ['AE'],
    surface_scope: 'both',
    is_default_chip: true,
    eligibility: {},
    firmoFilters: { industries: [], sizeBand: '', regions: [] },
    technoFilters: { hasInstalled: [], missingInstall: [], custom: [] },
    signals: [],
    recommended_workflows: [],
    workbookIds: ['wb-contacts-alex-jul'],
    source_workbook_id: 'wb-contacts-alex-jul',
    type: 'outbound',
    activation: {
      mode: 'admin_activated',
      batchSize: 5,
      batchGapMinutes: 15,
      autoRunOnNewRecords: false,
      triggerType: null,
      triggerConfig: {},
      activatedAt: '2026-07-22T09:00:00Z',
      batches: [
        { index: 1, total: 1, recordCount: 4, status: 'completed', scheduledAt: '2026-07-22T09:00:00Z', completedAt: '2026-07-22T09:12:00Z' },
      ],
    },
    actions: [
      {
        id: 'act-cout-draft',
        type: 'draft_email',
        config: { purpose: 'Reference their role + our CNAPP consolidation angle', tone: 'consultative', max_words: '150' },
        requires_approval: true,
        created_at: '2026-07-21T09:00:00Z',
      },
      {
        id: 'act-cout-enroll',
        type: 'add_to_sequence',
        config: { platform: 'outreach', sequence_id: 'CNAPP Q3 Outbound', notes: 'Only enroll after rep approves email draft' },
        requires_approval: true,
        created_at: '2026-07-21T09:00:00Z',
      },
    ],
    source_record_ids: ['sk-jpmc-1', 'sk-jpmc-2', 'sk-dbx-1', 'sk-visa-1'],
    created_by: 'Alex',
    version: 1,
    visibility: 'private',
  },
  {
    id: 'play-full-prospecting-q3',
    name: 'Q3 Prospecting · Banking',
    description: 'Full outbound motion for Q3 Banking targets: brief each account, find the buying committee, draft a personalized email per key persona, then enroll them in Outreach.',
    motion: 'new_logo',
    status: 'active',
    offering_id: 'cnapp',
    audience_roles: ['AE'],
    surface_scope: 'both',
    is_default_chip: true,
    eligibility: {},
    firmoFilters: { industries: ['Banking & Financial Services'], sizeBand: '1,000+ employees', regions: [] },
    technoFilters: { hasInstalled: [], missingInstall: [], custom: [] },
    signals: [],
    recommended_workflows: ['wf-tpl-prospecting-agent'],
    workbookIds: ['wb-custom-q3-takeout'],
    source_workbook_id: 'wb-custom-q3-takeout',
    type: 'outbound',
    activation: {
      mode: 'admin_activated',
      batchSize: 2,
      batchGapMinutes: 30,
      autoRunOnNewRecords: false,
      triggerType: null,
      triggerConfig: {},
      activatedAt: '2026-07-22T08:00:00Z',
      batches: [
        { index: 1, total: 3, recordCount: 2, status: 'completed', scheduledAt: '2026-07-22T08:00:00Z', completedAt: '2026-07-22T08:14:00Z' },
        { index: 2, total: 3, recordCount: 2, status: 'running',   scheduledAt: '2026-07-22T08:30:00Z' },
        { index: 3, total: 3, recordCount: 1, status: 'scheduled', scheduledAt: '2026-07-22T09:00:00Z' },
      ],
    },
    actions: [],
    source_record_ids: [],
    created_by: 'Alex',
    version: 1,
    visibility: 'private',
  },
];

// Allowlist used by configStore.migrateStaleState to prune plays from
// older builds that seeded a broader catalog. Anything not in this set
// is dropped on read so the demo stays consistent.
export const SEEDED_PLAY_IDS = new Set([
  'play-competitive-takeout',
  'play-net-new-logo',
  'play-expansion',
  'play-champion-move',
  'play-renewal-defense',
  'play-account-brief-batch',
  'play-contact-outreach-jul',
  'play-full-prospecting-q3',
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
