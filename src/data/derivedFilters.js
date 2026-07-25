// Tenant-authored derived filters — Tier 3 of the filter taxonomy.
//
// A derived filter is a named boolean composition over primitives from
// filterRegistry.js. Admin authors it in the Filter Studio, publishes it,
// and it appears in the FilterPanel alongside HG-provided primitives.
//
// Composition shape (v1):
//   groups: Array<{
//     op: 'or' | 'and',
//     conditions: Array<{
//       source: 'primitive' | 'derived',
//       id: string,          // primitive id or derived filter id
//       op: 'contains' | 'is' | 'is_not' | '>=' | '<=' | '>' | '<' | 'in',
//       values: any[],       // for 'in' / 'contains'; single value for scalar ops
//     }>
//   }>
// Groups are ANDed together. Inside a group, conditions are joined by group.op.
// A derived filter can reference other derived filters (up to 2 levels deep,
// cycle-checked at author time).

import { FILTER_GROUPS } from './filterRegistry.js';

const STORAGE_KEY = 'rgi-derived-filters-v1';
const CHANGE_EVENT = 'rgi:derived-filters-changed';

// Max composition depth — a derived filter can reference other derived
// filters up to this many hops away.
export const MAX_COMPOSITION_DEPTH = 2;

// Recognized visibility values.
export const VISIBILITY = { TENANT: 'tenant', TEAM: 'team', PRIVATE: 'private' };

// -----------------------------------------------------------------------------
// Seeded derived filters
// -----------------------------------------------------------------------------

const SEED_FILTERS = [
  {
    id: 'df-gtm-persona',
    name: 'GTM Persona',
    description: 'Titles common to GTM-org buyers we sell into. Applied at the contact level.',
    group: 'Person',
    visibility: VISIBILITY.TENANT,
    definedBy: 'Priya Sharma',
    definedAt: '2026-06-14',
    composition: {
      groups: [
        {
          op: 'or',
          conditions: [
            { source: 'primitive', id: 'contact_title', op: 'contains', values: ['marketing', 'sales', 'growth', 'revenue', 'GTM', 'demand'] },
          ],
        },
        {
          op: 'or',
          conditions: [
            { source: 'primitive', id: 'contact_seniority', op: 'in', values: ['Manager', 'Director', 'VP', 'C-Level'] },
          ],
        },
      ],
    },
    matchCount: 4238,
    usage: { plays: 4, workbooks: 2 },
  },
  {
    id: 'df-enterprise-segment',
    name: 'Enterprise segment',
    description: 'The tenant\'s canonical definition of enterprise — 5K+ employees and $1B+ ARR.',
    group: 'Company',
    visibility: VISIBILITY.TENANT,
    definedBy: 'Priya Sharma',
    definedAt: '2026-05-22',
    composition: {
      groups: [
        { op: 'and', conditions: [
          { source: 'primitive', id: 'emp_count', op: '>=', values: [5000] },
          { source: 'primitive', id: 'revenue',    op: '>=', values: ['$1B'] },
        ]},
      ],
    },
    matchCount: 1082,
    usage: { plays: 7, workbooks: 3 },
  },
  {
    id: 'df-at-risk-region',
    name: 'At-risk in region',
    description: 'High-ARR customers in a target region with zero product activity in 30 days. Composed from Enterprise segment.',
    group: 'Company',
    visibility: VISIBILITY.TENANT,
    definedBy: 'Priya Sharma',
    definedAt: '2026-07-05',
    composition: {
      groups: [
        { op: 'and', conditions: [
          // References the Enterprise segment derived filter — demonstrates
          // 2-level composition.
          { source: 'derived',   id: 'df-enterprise-segment' },
          { source: 'primitive', id: 'app_usage_last_30d',   op: '=',  values: [0] },
        ]},
        { op: 'or', conditions: [
          { source: 'primitive', id: 'crm_region', op: 'in', values: ['AMER', 'EMEA'] },
        ]},
      ],
    },
    matchCount: 217,
    usage: { plays: 1, workbooks: 1 },
  },
];

// -----------------------------------------------------------------------------
// Storage (localStorage) + subscription
// -----------------------------------------------------------------------------

function safeParse(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

function readState() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return safeParse(raw);
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

// Read current filter list; seed on first read.
function readFilters() {
  const state = readState();
  if (state && Array.isArray(state.filters)) return state.filters;
  writeState({ filters: SEED_FILTERS });
  return SEED_FILTERS;
}

export function listDerivedFilters() {
  return readFilters();
}

export function getDerivedFilter(id) {
  return readFilters().find((f) => f.id === id) || null;
}

// Auto-generate a stable id from the name if the caller didn't provide one.
function makeId(name) {
  const slug = String(name || 'filter')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'filter';
  return `df-${slug}-${Math.random().toString(36).slice(2, 6)}`;
}

export function upsertDerivedFilter(next) {
  const filters = readFilters();
  const withId = { ...next, id: next.id || makeId(next.name) };
  const idx = filters.findIndex((f) => f.id === withId.id);
  const now = new Date().toISOString().slice(0, 10);
  const stamped = {
    ...withId,
    updatedAt: now,
    definedAt: withId.definedAt || now,
  };
  const nextList = idx >= 0
    ? filters.map((f, i) => (i === idx ? { ...f, ...stamped } : f))
    : [...filters, stamped];
  writeState({ filters: nextList });
  return stamped;
}

export function deleteDerivedFilter(id) {
  const filters = readFilters();
  writeState({ filters: filters.filter((f) => f.id !== id) });
}

export function subscribeDerivedFilters(cb) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

// -----------------------------------------------------------------------------
// Cycle detection
// -----------------------------------------------------------------------------

// Given a candidate filter (id + composition), verify that publishing it
// wouldn't create a reference cycle across derived filters. Returns
// { ok: true } when safe, or { ok: false, path: [ids...] } when it would.
export function hasCycle(candidate, allFiltersOverride) {
  const all = allFiltersOverride || readFilters();
  const byId = Object.fromEntries(all.map((f) => [f.id, f]));
  const targetId = candidate.id;

  // Walk every derived reference in the candidate's composition; if any
  // transitive chain reaches back to targetId, we have a cycle.
  const stack = [{ chain: [targetId], node: candidate }];
  while (stack.length > 0) {
    const { chain, node } = stack.pop();
    const groups = node?.composition?.groups || [];
    for (const g of groups) {
      for (const c of (g.conditions || [])) {
        if (c.source !== 'derived') continue;
        if (c.id === targetId) return { ok: false, path: [...chain, c.id] };
        if (chain.includes(c.id)) return { ok: false, path: [...chain, c.id] };
        if (chain.length >= MAX_COMPOSITION_DEPTH + 1) {
          // Beyond max depth — treat as invalid so we don't lose our footing.
          return { ok: false, path: [...chain, c.id], reason: 'depth_exceeded' };
        }
        const next = byId[c.id];
        if (next) stack.push({ chain: [...chain, c.id], node: next });
      }
    }
  }
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Mock evaluation — used by the composer for the "live match count" preview.
//
// Real evaluation would run against tenant data. Here we synthesize a
// realistic count based on composition breadth: more conditions → fewer
// matches; primitives with wide values → more matches. Deterministic-ish
// so the preview is stable during editing.
// -----------------------------------------------------------------------------

export function evaluateMatchCount(composition) {
  if (!composition || !Array.isArray(composition.groups)) return 0;
  // Base pool — pretend the tenant has ~10,000 records.
  let matches = 10000;
  for (const g of composition.groups) {
    if (!Array.isArray(g.conditions) || g.conditions.length === 0) continue;
    // OR group — widens the pool as more values are added (up to a cap).
    const groupOp = g.op || 'and';
    if (groupOp === 'or') {
      const breadth = g.conditions.reduce((s, c) => s + Math.max(1, (c.values?.length || 1)), 0);
      const factor = Math.min(1, 0.15 + breadth * 0.08);
      matches = Math.round(matches * factor);
    } else {
      // AND group — each condition narrows.
      for (const c of g.conditions) {
        const breadth = Math.max(1, c.values?.length || 1);
        const factor = c.source === 'derived' ? 0.4 : Math.min(0.85, 0.25 + breadth * 0.08);
        matches = Math.round(matches * factor);
      }
    }
  }
  // Floor so it never lands at 0 unless the composition is empty.
  return Math.max(1, matches);
}

// -----------------------------------------------------------------------------
// Primitive catalog surfaced to the Composer
// -----------------------------------------------------------------------------

// Beyond the existing FILTER_REGISTRY (which covers workbook/audience
// primitives), we expose a small extra set — contact + behavior primitives
// that don't currently live in filterRegistry.js — so the Composer can
// build derived filters like "GTM Persona" that reference them.
export const COMPOSER_PRIMITIVES = [
  // Person (contact-level)
  { id: 'contact_title',     group: 'Person',        label: 'Contact title',       type: 'text',   ops: ['contains', 'is', 'is_not'] },
  { id: 'contact_seniority', group: 'Person',        label: 'Seniority level',      type: 'enum',   ops: ['in', 'is', 'is_not'], values: ['IC', 'Manager', 'Director', 'VP', 'C-Level'] },
  { id: 'contact_department',group: 'Person',        label: 'Department',           type: 'text',   ops: ['contains', 'is', 'is_not'] },

  // Company (firmographics)
  { id: 'emp_count',         group: 'Firmographics', label: 'Employee count',       type: 'number', ops: ['>=', '<=', '>', '<'] },
  { id: 'revenue',           group: 'Firmographics', label: 'Revenue',              type: 'text',   ops: ['>=', '<=', 'is'] },
  { id: 'industry',          group: 'Firmographics', label: 'Industry',             type: 'text',   ops: ['is', 'is_not', 'in'] },

  // Behavior / product usage
  { id: 'app_usage_last_30d',group: 'Behavior',      label: 'App usage (last 30d)', type: 'number', ops: ['=', '>=', '<='] },
  { id: 'email_opens_last_14d', group: 'Behavior',   label: 'Email opens (14d)',    type: 'number', ops: ['>=', '<=', '='] },

  // Events
  { id: 'trustradius_compare', group: 'Event',        label: 'TrustRadius comparison', type: 'boolean', ops: ['is'] },
  { id: 'form_fill_type',     group: 'Event',        label: 'Form fill type',       type: 'text',   ops: ['is', 'in'] },

  // CRM (subset)
  { id: 'crm_region',         group: 'CRM',          label: 'CRM region',           type: 'text',   ops: ['is', 'in'] },
  { id: 'opportunity_stage',  group: 'CRM',          label: 'Opportunity stage',    type: 'text',   ops: ['is', 'is_not', 'in'] },

  // Scoring
  { id: 'fit_score',          group: 'Scoring',      label: 'Fit score',            type: 'number', ops: ['>=', '<=', '>'] },
  { id: 'intent_score',       group: 'Scoring',      label: 'Intent score',         type: 'number', ops: ['>=', '<=', '>'] },
];

export function getPrimitiveById(id) {
  return COMPOSER_PRIMITIVES.find((p) => p.id === id) || null;
}

// -----------------------------------------------------------------------------
// Groups the Filter Studio + FilterPanel surface. Extends the existing
// FILTER_GROUPS list with Person / Behavior / Event which don't yet
// exist as top-level buckets in the workbook FilterPanel.
// -----------------------------------------------------------------------------
export const COMPOSER_GROUPS = ['Person', 'Company', 'Firmographics', 'Technographics', 'Intent', 'Event', 'Behavior', 'CRM', 'Scoring'];

// Human-readable summary of a derived filter's composition. Used on the
// Filter Studio cards + FilterPanel "info" chip.
export function summarizeComposition(filter, allFilters = null) {
  const all = allFilters || readFilters();
  const byId = Object.fromEntries(all.map((f) => [f.id, f]));
  const groups = filter?.composition?.groups || [];
  const parts = groups.map((g) => {
    const conds = (g.conditions || []).map((c) => {
      if (c.source === 'derived') {
        const ref = byId[c.id];
        return ref ? ref.name : c.id;
      }
      const prim = getPrimitiveById(c.id);
      const label = prim?.label || c.id;
      const vals = Array.isArray(c.values) ? c.values.join(', ') : '';
      return `${label} ${c.op} ${vals}`;
    });
    const joiner = ` ${(g.op || 'and').toUpperCase()} `;
    return conds.length > 1 ? `(${conds.join(joiner)})` : conds.join('');
  });
  return parts.join(' AND ');
}

// Re-export FILTER_GROUPS so consumers importing from derivedFilters have
// one entry point.
export { FILTER_GROUPS };
