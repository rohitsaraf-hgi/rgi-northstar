// localStorage-backed workflow store — drafts, published versions, audit log.
// Mirrors signalStore.js pattern. Seed workflows in workflows.js are factory
// defaults; user edits/publishes overlay them at read time.

import { WORKFLOWS } from './workflows.js';

const STORAGE_KEY = 'rgi-workflow-store-v1';
const CHANGE_EVENT = 'rgi:workflow-store-changed';

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
    // ignore
  }
}

function appendAudit(store, entry) {
  return {
    ...store,
    audit: [...store.audit, { ...entry, at: entry.at || new Date().toISOString() }].slice(-200),
  };
}

// ----- Drafts -----

export function saveWorkflowDraft(id, { tree, meta, conversation, by = 'Priya' }) {
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

export function discardWorkflowDraft(id, { by = 'Priya' } = {}) {
  const store = readRaw();
  if (!store.drafts[id]) return;
  const { [id]: _omit, ...rest } = store.drafts;
  const next = { ...store, drafts: rest };
  writeRaw(appendAudit(next, { id, action: 'draft_discarded', by, message: 'Discarded draft' }));
}

export function getWorkflowDraft(id) {
  return readRaw().drafts[id] || null;
}

// ----- Publish -----

export function publishWorkflow(id, payload = {}, { by = 'Priya', summary = 'Published new version' } = {}) {
  const store = readRaw();
  const draft = store.drafts[id];
  const tree = payload.tree || draft?.tree;
  const meta = payload.meta || draft?.meta;
  if (!tree || !meta) {
    return { ok: false, error: 'No draft or payload to publish' };
  }
  const conversation = payload.conversation || draft?.conversation || [];
  const merged = getEffectiveWorkflow(id);
  const nextVersion = (merged?.current_version || 0) + 1;
  const now = new Date().toISOString();

  const publishedEntry = {
    tree,
    meta,
    current_version: nextVersion,
    status: 'active',
    versions: [
      ...(merged?.versions || []),
      { version: nextVersion, published_at: now, published_by: by, summary, conversation },
    ],
  };

  const { [id]: _omit, ...remainingDrafts } = store.drafts;
  const nextStore = {
    ...store,
    drafts: remainingDrafts,
    published: { ...store.published, [id]: publishedEntry },
  };
  writeRaw(appendAudit(nextStore, { id, action: 'published', by, message: `Published v${nextVersion}: ${summary}` }));
  return { ok: true, version: nextVersion };
}

export function disableWorkflow(id, { by = 'Priya', reason = 'Disabled by admin' } = {}) {
  const store = readRaw();
  const merged = getEffectiveWorkflow(id);
  if (!merged) return { ok: false, error: 'Workflow not found' };
  const next = {
    ...store,
    published: {
      ...store.published,
      [id]: {
        ...(store.published[id] || {}),
        tree: merged.tree,
        meta: { ...merged },
        status: 'disabled',
        disabled_reason: reason,
        current_version: merged.current_version,
        versions: merged.versions,
      },
    },
  };
  writeRaw(appendAudit(next, { id, action: 'disabled', by, message: reason }));
  return { ok: true };
}

export function activateWorkflow(id, { by = 'Priya' } = {}) {
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
  writeRaw(appendAudit(next, { id, action: 'activated', by, message: 'Re-activated workflow' }));
  return { ok: true };
}

// ----- Reads -----

function findSeed(id) {
  return WORKFLOWS.find((w) => w.id === id) || null;
}

export function getEffectiveWorkflow(id) {
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
        audience_roles: override?.meta?.audience_roles || [],
        created_by: 'You',
        created_by_role: 'Admin',
        vertical_tags: [],
        bound_signal: override?.meta?.bound_signal || null,
        runs_this_week: 0,
        success_rate_pct: null,
        last_evaluated: null,
        current_version: 0,
        versions: [],
        tree: { nodes: {}, edges: [], output_node: null },
      };
  if (override) {
    return {
      ...base,
      tree: override.tree || base.tree,
      name: override.meta?.name || base.name,
      description: override.meta?.description || base.description,
      audience_roles: override.meta?.audience_roles || base.audience_roles,
      bound_signal: override.meta?.bound_signal ?? base.bound_signal,
      current_version: override.current_version,
      versions: override.versions,
      status: override.status,
      disabled_reason: override.disabled_reason,
      last_evaluated: 'Just now',
    };
  }
  return base;
}

export function getWorkflowDraftPayload(id) {
  return readRaw().drafts[id] || null;
}

export function listEffectiveWorkflows() {
  const store = readRaw();
  const seedIds = new Set(WORKFLOWS.map((w) => w.id));
  const out = [];
  for (const seed of WORKFLOWS) {
    out.push(getEffectiveWorkflow(seed.id));
  }
  for (const id of Object.keys(store.published)) {
    if (!seedIds.has(id)) out.push(getEffectiveWorkflow(id));
  }
  for (const id of Object.keys(store.drafts)) {
    if (!seedIds.has(id) && !store.published[id]) {
      const d = store.drafts[id];
      out.push({
        id,
        name: d.meta?.name || id,
        description: d.meta?.description || '',
        audience_roles: d.meta?.audience_roles || [],
        bound_signal: d.meta?.bound_signal || null,
        created_by: 'You',
        created_by_role: 'Admin',
        vertical_tags: [],
        runs_this_week: 0,
        success_rate_pct: null,
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

export function getWorkflowAuditLog(id) {
  return readRaw().audit.filter((a) => a.id === id);
}

// ----- Cross-store query: workflows bound to a signal -----
//
// Used by the signal detail page to show "which workflows fire when this
// signal evaluates true". Closes the architectural loop.
export function listWorkflowsBoundToSignal(signalId) {
  return listEffectiveWorkflows().filter((w) => w.bound_signal === signalId);
}

// ----- Subscriptions -----

export function subscribeWorkflowStore(onChange) {
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

// ----- ID generation -----

export function nextWorkflowId(name) {
  const slug = String(name || 'workflow')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'workflow';
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slug}-${suffix}`;
}
