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
