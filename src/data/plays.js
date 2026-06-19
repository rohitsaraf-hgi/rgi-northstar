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
