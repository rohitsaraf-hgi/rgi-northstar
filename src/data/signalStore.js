// localStorage-backed signal store — drafts, published versions, audit log.
//
// Layered on top of the immutable seed signals in signals.js:
//   - Seed signals act as factory defaults (read-only).
//   - User edits / publishes overlay seed signals (merged at read time).
//   - Brand-new signals live entirely in the store.
//
// Storage shape:
//   {
//     drafts:    { [id]: { tree, meta, conversation, last_edited_at } },
//     published: { [id]: { tree, meta, versions[], current_version, status, ... } },
//     audit:     [ { id, action, by, at, message } ]
//   }
//
// Mutations dispatch a same-tab event so React components re-read state
// without a full reload.

import { SIGNALS } from './signals.js';

const STORAGE_KEY = 'rgi-signal-store-v1';
const CHANGE_EVENT = 'rgi:signal-store-changed';

function emptyStore() {
  return { drafts: {}, published: {}, audit: [] };
}

function readRaw() {
  if (typeof window === 'undefined') return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    return {
      drafts: parsed.drafts && typeof parsed.drafts === 'object' ? parsed.drafts : {},
      published: parsed.published && typeof parsed.published === 'object' ? parsed.published : {},
      audit: Array.isArray(parsed.audit) ? parsed.audit : [],
    };
  } catch {
    return emptyStore();
  }
}

function writeRaw(next) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Storage quota / private mode — silently ignore for the demo.
  }
}

function appendAudit(store, entry) {
  return {
    ...store,
    audit: [...store.audit, { ...entry, at: entry.at || new Date().toISOString() }].slice(-200),
  };
}

// ----- Drafts -----

export function saveDraft(id, { tree, meta, conversation, by = 'Priya' }) {
  const store = readRaw();
  const existing = store.drafts[id] || {};
  const next = {
    ...store,
    drafts: {
      ...store.drafts,
      [id]: {
        tree,
        meta,
        conversation: conversation || existing.conversation || [],
        last_edited_at: new Date().toISOString(),
      },
    },
  };
  writeRaw(appendAudit(next, { id, action: 'draft_saved', by, message: `Saved draft of "${meta.name}"` }));
}

export function discardDraft(id, { by = 'Priya' } = {}) {
  const store = readRaw();
  if (!store.drafts[id]) return;
  const { [id]: _omit, ...rest } = store.drafts;
  const next = { ...store, drafts: rest };
  writeRaw(appendAudit(next, { id, action: 'draft_discarded', by, message: `Discarded draft` }));
}

export function getDraft(id) {
  return readRaw().drafts[id] || null;
}

// ----- Publish -----

// Publish takes the current draft (or supplied payload) and promotes it to
// the published state, appending a version entry and clearing the draft.
export function publishSignal(id, payload = {}, { by = 'Priya', summary = 'Published new version' } = {}) {
  const store = readRaw();
  const draft = store.drafts[id];
  const tree = payload.tree || draft?.tree;
  const meta = payload.meta || draft?.meta;
  if (!tree || !meta) {
    return { ok: false, error: 'No draft or payload to publish' };
  }
  const conversation = payload.conversation || draft?.conversation || [];

  // Read existing published (seed merged) to compute next version.
  const merged = getEffectiveSignal(id);
  const nextVersion = (merged?.current_version || 0) + 1;
  const now = new Date().toISOString();

  const publishedEntry = {
    tree,
    meta,
    current_version: nextVersion,
    status: 'active',
    versions: [
      ...(merged?.versions || []),
      {
        version: nextVersion,
        published_at: now,
        published_by: by,
        summary,
        conversation,
      },
    ],
  };

  // Drop the draft now that it's published.
  const { [id]: _omit, ...remainingDrafts } = store.drafts;

  const nextStore = {
    ...store,
    drafts: remainingDrafts,
    published: { ...store.published, [id]: publishedEntry },
  };
  writeRaw(appendAudit(nextStore, { id, action: 'published', by, message: `Published v${nextVersion}: ${summary}` }));
  return { ok: true, version: nextVersion };
}

export function disableSignal(id, { by = 'Priya', reason = 'Disabled by admin' } = {}) {
  const store = readRaw();
  const merged = getEffectiveSignal(id);
  if (!merged) return { ok: false, error: 'Signal not found' };
  const next = {
    ...store,
    published: {
      ...store.published,
      [id]: { ...(store.published[id] || {}), tree: merged.tree, meta: { ...merged }, status: 'disabled', disabled_reason: reason, current_version: merged.current_version, versions: merged.versions },
    },
  };
  writeRaw(appendAudit(next, { id, action: 'disabled', by, message: reason }));
  return { ok: true };
}

export function activateSignal(id, { by = 'Priya' } = {}) {
  const store = readRaw();
  const entry = store.published[id];
  if (!entry) return { ok: false, error: 'No published entry' };
  const next = {
    ...store,
    published: {
      ...store.published,
      [id]: { ...entry, status: 'active', disabled_reason: undefined },
    },
  };
  writeRaw(appendAudit(next, { id, action: 'activated', by, message: 'Re-activated signal' }));
  return { ok: true };
}

// ----- Reads (merge seed + store) -----

function findSeed(id) {
  return SIGNALS.find((s) => s.id === id) || null;
}

// Merge a seed signal with any store override.
export function getEffectiveSignal(id) {
  const store = readRaw();
  const seed = findSeed(id);
  const override = store.published[id];
  if (!seed && !override) return null;
  const base = seed
    ? { ...seed }
    : {
        id,
        name: override?.meta?.name || id,
        description: override?.meta?.description || '',
        output_type: override?.meta?.output_type || 'boolean',
        audience_roles: override?.meta?.audience_roles || [],
        created_by: 'Tenant',
        created_by_role: 'Admin',
        vertical_tags: [],
        bound_plays: [],
        refresh_policy: 'event_triggered',
        total_accounts: 1247,
        accounts_firing_today: null,
        last_evaluated: null,
        current_version: 0,
        versions: [],
        tree: { nodes: {}, edges: [], output_node: null },
      };
  if (override) {
    return {
      ...base,
      tree: override.tree || base.tree,
      output_type: override.meta?.output_type || base.output_type,
      audience_roles: override.meta?.audience_roles || base.audience_roles,
      name: override.meta?.name || base.name,
      description: override.meta?.description || base.description,
      current_version: override.current_version,
      versions: override.versions,
      status: override.status,
      disabled_reason: override.disabled_reason,
      last_evaluated: 'Just now',
    };
  }
  return base;
}

export function getDraftPayload(id) {
  return readRaw().drafts[id] || null;
}

export function listEffectiveSignals() {
  const store = readRaw();
  const seedIds = new Set(SIGNALS.map((s) => s.id));
  const out = [];
  // Seeds first (with overrides applied)
  for (const seed of SIGNALS) {
    out.push(getEffectiveSignal(seed.id));
  }
  // Then any user-only signals (in store but not seed)
  for (const id of Object.keys(store.published)) {
    if (!seedIds.has(id)) out.push(getEffectiveSignal(id));
  }
  // Then drafts that have no published equivalent (brand new signals never published)
  for (const id of Object.keys(store.drafts)) {
    if (!seedIds.has(id) && !store.published[id]) {
      const d = store.drafts[id];
      out.push({
        id,
        name: d.meta?.name || id,
        description: d.meta?.description || '',
        output_type: d.meta?.output_type || 'boolean',
        audience_roles: d.meta?.audience_roles || [],
        created_by: 'You',
        created_by_role: 'Admin',
        vertical_tags: [],
        bound_plays: [],
        refresh_policy: 'event_triggered',
        total_accounts: 1247,
        accounts_firing_today: null,
        last_evaluated: null,
        current_version: 0,
        versions: [],
        tree: d.tree || { nodes: {}, edges: [], output_node: null },
        status: 'draft',
      });
    }
  }
  return out;
}

export function getAuditLog(id) {
  return readRaw().audit.filter((a) => a.id === id);
}

// ----- Subscriptions -----

export function subscribeSignalStore(onChange) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onChange();
  const storageHandler = (e) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

// ----- ID generation for new signals -----

export function nextSignalId(name) {
  const slug = String(name || 'signal')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'signal';
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slug}-${suffix}`;
}
