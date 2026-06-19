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
