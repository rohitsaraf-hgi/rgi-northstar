// Plays — public data API for tenant sales plays.
//
// As of the unified-config migration, the canonical Play schema lives in
// `configStore.js`. This file is a thin wrapper that preserves the legacy
// named exports (PLAYS, PLAYS_BY_ID, listPlays, getPlay, listPlaysForRole,
// listDefaultPlaysForRole, MOTION_LABELS) and the pin/unpin persistence.

import {
  listPlays as listPlaysFromStore,
  getPlay as getPlayFromStore,
  upsertPlay as upsertPlayInStore,
  deletePlay as deletePlayInStore,
  subscribeConfig,
  inferPlayTypeFromMotion,
  defaultTriggerTypeForMotion,
} from './configStore.js';

// Snapshot view (legacy consumers). Live readers below preferred.
export const PLAYS = listPlaysFromStore();
export const PLAYS_BY_ID = Object.fromEntries(PLAYS.map((p) => [p.id, p]));

// Demo-only fallback: pinned account ids per seeded play. New play seeds
// (from StepPlays.DEFAULT_PLAYS_FOR_TENANT) carry these inline, but
// users who onboarded before this shipped have plays in localStorage
// without the pinnedAccountIds field. getPinnedAccountsForPlay() reads
// from the play object first and falls back to this map, so existing
// demo state still lands populated plays without forcing a reset.
const PINNED_FALLBACK = {
  'play-competitive-takeout': [
    'acct-jpmc',
    'mac-bank-of-america',
    'mac-citi',
    'mac-capital-one',
    'mac-morgan-stanley',
    'mac-deutsche-bank',
    'mac-cisco',
    'mac-oracle',
  ],
  'play-net-new-logo': [
    'acct-stripe',
    'acct-block',
    'mac-databricks',
    'mac-salesforce',
    'mac-adobe',
    'mac-nvidia',
    'mac-uber',
  ],
  'play-high-intent-buyer': [
    'acct-snowflake',
    'acct-datadog',
    'mac-best-buy',
    'mac-target',
    'mac-marriott',
    'mac-visa',
    'mac-mastercard',
  ],
  'play-catalyst-event': [
    'mac-cigna',
    'mac-kaiser',
    'mac-unitedhealth',
    'mac-aig',
    'mac-allstate',
    'mac-prudential',
  ],
  'play-devsec-pull': [
    'acct-databricks',
    'acct-spotify',
    'mac-microsoft',
    'mac-google',
    'mac-meta',
    'mac-netflix',
  ],
};

export function getPinnedAccountsForPlay(play) {
  if (!play) return [];
  if (Array.isArray(play.pinnedAccountIds) && play.pinnedAccountIds.length > 0) {
    return play.pinnedAccountIds;
  }
  return PINNED_FALLBACK[play.id] || [];
}

// Visibility / shareability validator. A play's visibility can't exceed
// the underlying workbook's visibility — an org-visible play that
// references a private workbook would surface accounts to sellers who
// can't see the workbook itself. Caller passes the play draft + the
// workbook object it references (resolved separately so this stays
// dependency-light).
//
// Returns { ok: true } when shareable, or { ok: false, error, severity }
// when not. Drawer UI surfaces the error inline on Save.
export function validatePlayShareability(play, workbook) {
  if (!play) return { ok: true };
  const visibility = play.visibility || 'tenant';
  // Per-seller placeholder is org-visible by definition (it's the same
  // workbook concept for every seller). Skip the check.
  if (workbook?.isPerSellerPlaceholder) return { ok: true };
  if (!workbook) return { ok: true }; // unknown — let it pass; caller decides
  const wbVis = workbook.visibility || 'organization';
  if (visibility === 'tenant' && wbVis === 'private') {
    return {
      ok: false,
      severity: 'error',
      error:
        'This play targets a private workbook. Make the workbook org-visible first, or set the play\'s visibility to Private.',
    };
  }
  if (visibility === 'team' && wbVis === 'private') {
    return {
      ok: false,
      severity: 'error',
      error:
        'This play targets a private workbook but is shared with a team. Either make the workbook org-visible or set the play to Private.',
    };
  }
  return { ok: true };
}

// Motion metadata for UI labeling
export const MOTION_LABELS = {
  displacement: 'Displacement',
  new_logo: 'Net New Logo',
  expansion: 'Expansion',
  renewal: 'Renewal Defense',
  in_market: 'In-Market',
  opportunity_window: 'Catalyst',
};

// Live readers
export function listPlays() {
  return listPlaysFromStore();
}

export function getPlay(id) {
  return getPlayFromStore(id);
}

export function listPlaysForRole(role) {
  const plays = listPlaysFromStore();
  if (!role) return plays;
  return plays.filter((p) => (p.audienceRoles || p.audience_roles || []).includes(role));
}

// Compute a play's *effective* audience by merging the play's explicit
// overrides on top of the referenced offering's Target ICP.
//
// Per the locked model (see docs/sales-copilot-narrative.md):
//   - The offering's Target ICP is the play's baseline audience.
//   - The play stores OVERRIDES in firmoFilters — when a field is empty
//     on the play, the offering's ICP value is used directly.
//   - When the offering's ICP changes (admin adds an industry), every
//     play that hasn't overridden that field auto-inherits the change.
//
// Returns the effective audience plus an `_inherited` map so the play
// editor can render "(inherited)" badges next to inherited fields.
export function getEffectivePlayAudience(play, offering) {
  const icp = offering?.targetIcp || offering?.targetICP || {};
  const offeringIndustries = (icp.industries || [])
    .map((i) => (typeof i === 'string' ? i : i?.name))
    .filter(Boolean);
  const offeringSizeBand = icp.employeeBand || icp.employees || '';
  const offeringRegions = (icp.geography || icp.geos || [])
    .map((g) => (typeof g === 'string' ? g : g?.name))
    .filter(Boolean);

  const ff = play?.firmoFilters || {};
  const playIndustries = Array.isArray(ff.industries) ? ff.industries.filter(Boolean) : [];
  const playSizeBand = ff.sizeBand || '';
  const playRegions = Array.isArray(ff.regions) ? ff.regions.filter(Boolean) : [];

  const industries = playIndustries.length > 0 ? playIndustries : offeringIndustries;
  const sizeBand = playSizeBand || offeringSizeBand;
  const regions = playRegions.length > 0 ? playRegions : offeringRegions;

  return {
    industries,
    sizeBand,
    regions,
    technoFilters: play?.technoFilters || { hasInstalled: [], missingInstall: [], custom: [] },
    audienceFilters: play?.audienceFilters || [],
    _inherited: {
      industries: playIndustries.length === 0,
      sizeBand: !playSizeBand,
      regions: playRegions.length === 0,
    },
  };
}

// True if the play references first-party CRM data — either via the legacy
// CRM signal ids (sig-crm-*) or via spec-driven audienceFilters in the CRM
// Filters group. Callers (sidebar, play card, play detail) use this with a
// crmConnected flag to render a config-broken warning.
export function playReferencesCrm(play) {
  const signalIds = play?.signals || play?.signalIds || [];
  if (signalIds.some((id) => typeof id === 'string' && id.startsWith('sig-crm-'))) return true;
  const audienceFilters = play?.audienceFilters || [];
  if (audienceFilters.some((f) => f.group === 'CRM Filters' || (f.id || '').startsWith('crm_'))) {
    return true;
  }
  return false;
}

// Return plays that should be visible to a given persona, honoring the
// play.visibility setting ('tenant' | 'team' | 'private'). Admins see
// every play in the tenant (including private ones they didn't create).
// Sellers see tenant-wide plays plus team plays for teams they belong to,
// plus any plays explicitly listing their user id.
export function listPlaysVisibleTo(persona) {
  if (!persona) return listPlaysFromStore();
  const plays = listPlaysFromStore();
  if (persona.roleType === 'admin') return plays;
  const personaTeamIds = new Set(persona.teamIds || []);
  return plays.filter((p) => {
    const v = p.visibility || 'tenant';
    if (v === 'tenant') return true;
    if (v === 'private' || v === 'just_me') {
      return (p.userIds || []).includes(persona.id) || p.created_by === persona.id;
    }
    if (v === 'team' || v === 'teams') {
      const playTeams = p.teamIds || [];
      if (playTeams.length === 0) return true; // 'team' with no teams selected → tenant-wide (per drawer note)
      return playTeams.some((t) => personaTeamIds.has(t));
    }
    return true;
  });
}

export function listDefaultPlaysForRole(role) {
  return listPlaysForRole(role).filter((p) => p.is_default_chip);
}

export function upsertPlay(play) {
  return upsertPlayInStore(play);
}

export function deletePlay(id) {
  return deletePlayInStore(id);
}

export function subscribePlays(onChange) {
  return subscribeConfig(onChange);
}

// ----- Pin/unpin persistence per persona (unchanged) -----

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

// -----------------------------------------------------------------------------
// Play type + activation + workflow attachment helpers
//
// A Play is Who × When × What:
//   Who — the workbook (record set)
//   When — admin activation (outbound) OR trigger event (inbound)
//   What — the attached workflow(s)
// -----------------------------------------------------------------------------

export { inferPlayTypeFromMotion, defaultTriggerTypeForMotion };

export function getPlayType(play) {
  return play?.type || inferPlayTypeFromMotion(play?.motion);
}

// Attach a workflow id to a play (dedup). Returns the updated play.
export function attachWorkflowToPlay(playId, workflowId) {
  const play = getPlayFromStore(playId);
  if (!play || !workflowId) return null;
  const existing = play.recommended_workflows || [];
  if (existing.includes(workflowId)) return play;
  const next = { ...play, recommended_workflows: [...existing, workflowId] };
  upsertPlayInStore(next);
  return next;
}

// Detach a workflow id from a play. Returns the updated play.
export function detachWorkflowFromPlay(playId, workflowId) {
  const play = getPlayFromStore(playId);
  if (!play || !workflowId) return null;
  const next = {
    ...play,
    recommended_workflows: (play.recommended_workflows || []).filter((id) => id !== workflowId),
  };
  upsertPlayInStore(next);
  return next;
}

// Set / merge activation config on a play. Pass a partial `patch` object; it
// deep-merges over the existing activation. Returns the updated play.
export function setPlayActivation(playId, patch) {
  const play = getPlayFromStore(playId);
  if (!play) return null;
  const next = {
    ...play,
    activation: { ...(play.activation || {}), ...(patch || {}) },
  };
  upsertPlayInStore(next);
  return next;
}

// Toggle the play type. Also resets/adjusts activation defaults so the play
// lands with a sane mode (admin_activated ↔ trigger).
export function setPlayType(playId, newType) {
  const play = getPlayFromStore(playId);
  if (!play) return null;
  const activation = play.activation || {};
  const nextActivation =
    newType === 'inbound'
      ? {
          ...activation,
          mode: 'trigger',
          triggerType: activation.triggerType || defaultTriggerTypeForMotion(play.motion),
        }
      : {
          ...activation,
          mode: 'admin_activated',
        };
  const next = { ...play, type: newType, activation: nextActivation };
  upsertPlayInStore(next);
  return next;
}

// Motion + play type → recommended workflow template id. Used by the
// empty-state "Attach the recommended workflow" one-click on the play detail
// page. The picker filters by trigger-type compatibility, so the recommended
// workflow must match the play's activation model:
//   - Outbound plays  → workflows with trigger.manual / trigger.scheduled
//   - Inbound plays   → workflows with signal / champion_job_change /
//                       event_fired / crm_field_updated triggers
export function recommendedWorkflowForMotion(motion, playType) {
  if (playType === 'inbound') {
    switch (motion) {
      case 'renewal':             return 'renewal-defense-play';           // signal
      case 'in_market':           return 'wf-tpl-inbound-lead';            // event_fired
      case 'opportunity_window':  return 'wf-tpl-intent-event';            // event_fired
      case 'displacement':        return 'wf-tpl-closed-won-competitor';   // crm_field_updated
      case 'new_logo':            return 'wf-tpl-inbound-lead';
      default:                    return null;
    }
  }
  // Outbound — proactive prospecting motions.
  switch (motion) {
    case 'displacement':          return 'cnapp-displacement-brief';        // existing manual
    case 'new_logo':              return 'wf-tpl-prospecting-agent';
    case 'expansion':             return 'wf-tpl-prospecting-agent';
    case 'renewal':               return 'account-brief-flow';
    default:                      return 'wf-tpl-prospecting-agent';
  }
}

// Individual action catalog — near-term focus per the seller-driven flow.
// Each entry declares its UI + storage shape. Actions are stored on
// play.actions[] with the fields defined below.
export const PLAY_ACTION_TYPES = {
  add_to_sequence: {
    id: 'add_to_sequence',
    label: 'Add to sequence',
    desc: 'Enroll matching contacts in an outbound cadence (Outreach or Salesloft).',
    icon: 'Send',
    fields: [
      { key: 'platform', label: 'Platform', type: 'select', options: ['outreach', 'salesloft'], required: true },
      { key: 'sequence_id', label: 'Sequence', type: 'text', placeholder: 'e.g., EMEA Outbound Q3', required: true },
      { key: 'notes', label: 'Notes (optional)', type: 'text', placeholder: 'e.g., Skip already-enrolled contacts' },
    ],
    requires_approval_by_default: true,
  },
  draft_email: {
    id: 'draft_email',
    label: 'Draft personalized email',
    desc: 'Generate a personalized email draft per matching contact. Rep approves before sending.',
    icon: 'Mail',
    fields: [
      { key: 'purpose', label: 'Email purpose', type: 'text', placeholder: 'e.g., Congratulate on new role and stay in touch', required: true },
      { key: 'tone', label: 'Tone', type: 'select', options: ['consultative', 'executive', 'helpful', 'warm', 'urgent'], required: true },
      { key: 'max_words', label: 'Max words', type: 'number', placeholder: '160' },
    ],
    requires_approval_by_default: true,
  },
  create_task: {
    id: 'create_task',
    label: 'Create CRM follow-up task',
    desc: 'Create a follow-up task on the CRM record for the rep to action.',
    icon: 'ListTodo',
    fields: [
      { key: 'description', label: 'Task description', type: 'text', placeholder: 'e.g., Follow up on inbound demo request', required: true },
      { key: 'due_in_days', label: 'Due in (days)', type: 'number', placeholder: '3', required: true },
    ],
    requires_approval_by_default: false,
  },
};

// Add an action to a play. Returns the updated play.
export function addActionToPlay(playId, action) {
  const play = getPlayFromStore(playId);
  if (!play || !action) return null;
  const now = new Date().toISOString();
  const rnd = Math.floor(Math.random() * 900 + 100);
  const withId = {
    id: action.id || `act_${now.slice(0, 10).replace(/-/g, '')}_${rnd}`,
    type: action.type,
    config: action.config || {},
    requires_approval: action.requires_approval ?? PLAY_ACTION_TYPES[action.type]?.requires_approval_by_default ?? true,
    created_at: action.created_at || now,
  };
  const next = { ...play, actions: [...(play.actions || []), withId] };
  upsertPlayInStore(next);
  return next;
}

// Remove an action by id from a play. Returns the updated play.
export function removeActionFromPlay(playId, actionId) {
  const play = getPlayFromStore(playId);
  if (!play || !actionId) return null;
  const next = { ...play, actions: (play.actions || []).filter((a) => a.id !== actionId) };
  upsertPlayInStore(next);
  return next;
}

// Mock activation — generates a `batches` history so the UI can render a
// realistic batch queue without a real scheduler. `totalRecords` comes from
// the workbook's account count.
//
// Behavior:
//   Batch 1 → running, started at activatedAt
//   Batch 2..N → scheduled, spaced `batchGapMinutes` apart
export function generateMockBatches({ totalRecords, batchSize, batchGapMinutes, activatedAt }) {
  const total = Math.max(1, Math.ceil((totalRecords || 0) / (batchSize || 10)));
  const startMs = activatedAt ? new Date(activatedAt).getTime() : Date.now();
  const batches = [];
  for (let i = 0; i < total; i++) {
    const scheduledMs = startMs + i * (batchGapMinutes || 30) * 60 * 1000;
    const count = i === total - 1
      ? Math.max(0, (totalRecords || 0) - i * batchSize)
      : batchSize;
    batches.push({
      index: i + 1,
      total,
      recordCount: count,
      status: i === 0 ? 'running' : 'scheduled',
      scheduledAt: new Date(scheduledMs).toISOString(),
      completedAt: null,
    });
  }
  return batches;
}

