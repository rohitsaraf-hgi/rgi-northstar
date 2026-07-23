// Playbook → Sales Copilot v2 migration engine.
//
// Analyzes each legacy playbook (from src/data/legacyPlaybooks.js) and
// suggests a mapping:
//   - Audience-only playbooks (no trigger, no action) → filtered Workbook.
//   - Playbooks with a trigger + action → inbound Sales Play with a
//     matching trigger type and a suggested workflow / action set.
//   - Mixed (action but no trigger) → outbound Sales Play, medium confidence.
//
// Migration state persists in localStorage so the "days remaining" chip is
// stable across reloads.

import { getLegacyPlaybook, LEGACY_PLAYBOOKS } from './legacyPlaybooks.js';
import { createCustomWorkbook } from './workbooks.js';
import { upsertPlay } from './plays.js';

const STORAGE_KEY = 'rgi-playbook-migrations-v1';
const CHANGE_EVENT = 'rgi:playbook-migrations-changed';

// Coexistence window — how long a migrated playbook keeps running alongside
// its new-world equivalent before archiving.
export const COEXISTENCE_DAYS = 30;

// ─── Auto-mapper ─────────────────────────────────────────────────────────

// Map old trigger types to new Sales Play trigger types.
function mapTriggerType(oldType) {
  switch (oldType) {
    case 'crm_field_change':   return 'crm_field_updated';
    case 'external_event':     return 'event_fired';
    case 'contact_event':      return 'champion_job_change';
    default:                   return 'signal';
  }
}

// Suggest a workflow attachment given the old action shape. Pulls from the
// GTM workflow templates (5 canonical templates from the earlier session).
function suggestWorkflowId(action) {
  if (!action) return null;
  const t = (action.type || '').toLowerCase();
  const label = (action.label || '').toLowerCase();
  if (t.includes('email_cadence') || label.includes('renewal')) return 'renewal-defense-play';
  if (t.includes('slack_ping') || label.includes('slack')) return 'wf-tpl-inbound-lead';
  if (t.includes('notify') && label.includes('champion')) return 'wf-tpl-champion-job-change';
  if (t.includes('quarterly') || label.includes('upsell')) return 'wf-tpl-prospecting-agent';
  if (label.includes('outreach')) return 'wf-tpl-prospecting-agent';
  return null;
}

// Rationale string for the preview modal — one line explaining why the
// mapper chose Workbook vs Sales Play.
function rationaleFor(playbook, target) {
  if (target === 'workbook') {
    return 'No trigger or automated action detected — this playbook is a curated list. It maps 1:1 to a filtered Workbook. Reps open the workbook and decide when to act.';
  }
  if (playbook.trigger && playbook.action) {
    return 'Playbook fires on an event and runs an automated action. Maps to an Inbound Sales Play: trigger fires → workflow runs on each matching record within scope.';
  }
  if (playbook.action && !playbook.trigger) {
    return 'Playbook has an automated action but no explicit trigger. Maps to an Outbound Sales Play — admin activates it, and the copilot runs the action across the workbook.';
  }
  return 'Playbook has a trigger but no automated action. Maps to an Inbound Sales Play — you\'ll pick actions during migration.';
}

// Return the suggested mapping for one playbook. Shape:
//   { target: 'workbook' | 'sales_play', playType, confidence, rationale,
//     suggestedName, suggestedWorkbookName, suggestedTriggerType,
//     suggestedWorkflowId }
export function analyzeMapping(playbook) {
  if (!playbook) return null;

  const hasTrigger = Boolean(playbook.trigger);
  const hasAction = Boolean(playbook.action);

  // Case 1: pure list playbook → filtered Workbook
  if (!hasTrigger && !hasAction) {
    return {
      target: 'workbook',
      confidence: 'high',
      rationale: rationaleFor(playbook, 'workbook'),
      suggestedName: `${playbook.name} · Workbook`,
      suggestedWorkbookName: playbook.name,
      suggestedTriggerType: null,
      suggestedWorkflowId: null,
      playType: null,
    };
  }

  // Case 2: has trigger AND action → high-confidence inbound Sales Play
  if (hasTrigger && hasAction) {
    return {
      target: 'sales_play',
      playType: 'inbound',
      confidence: 'high',
      rationale: rationaleFor(playbook, 'sales_play'),
      suggestedName: playbook.name,
      suggestedWorkbookName: `${playbook.name} · Scope`,
      suggestedTriggerType: mapTriggerType(playbook.trigger.type),
      suggestedWorkflowId: suggestWorkflowId(playbook.action),
    };
  }

  // Case 3: has action but no trigger → outbound Sales Play, medium confidence
  if (hasAction && !hasTrigger) {
    return {
      target: 'sales_play',
      playType: 'outbound',
      confidence: 'medium',
      rationale: rationaleFor(playbook, 'sales_play'),
      suggestedName: playbook.name,
      suggestedWorkbookName: `${playbook.name} · Scope`,
      suggestedTriggerType: null,
      suggestedWorkflowId: suggestWorkflowId(playbook.action),
    };
  }

  // Case 4: has trigger but no action → inbound Sales Play, low confidence
  return {
    target: 'sales_play',
    playType: 'inbound',
    confidence: 'low',
    rationale: rationaleFor(playbook, 'sales_play'),
    suggestedName: playbook.name,
    suggestedWorkbookName: `${playbook.name} · Scope`,
    suggestedTriggerType: mapTriggerType(playbook.trigger.type),
    suggestedWorkflowId: null,
  };
}

// ─── Migration state (localStorage) ──────────────────────────────────────

function safeParse(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

function readState() {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return safeParse(raw) || {};
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

export function getMigrationState(playbookId) {
  const s = readState();
  return s[playbookId] || null;
}

export function listMigrations() {
  return readState();
}

// Record a migration decision. `entry` shape:
//   { playbookId, target: 'workbook' | 'sales_play', createdId, migratedAt }
export function recordMigration(playbookId, entry) {
  const s = readState();
  const now = new Date().toISOString();
  s[playbookId] = {
    ...entry,
    playbookId,
    migratedAt: entry.migratedAt || now,
    status: 'migrated',
  };
  writeState(s);
  return s[playbookId];
}

export function undoMigration(playbookId) {
  const s = readState();
  delete s[playbookId];
  writeState(s);
}

export function subscribeMigrations(cb) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

// Days remaining in the coexistence window for a migrated playbook.
// Returns null when there's no active migration.
export function coexistenceDaysRemaining(playbookId) {
  const m = getMigrationState(playbookId);
  if (!m || !m.migratedAt) return null;
  try {
    const migratedAt = new Date(m.migratedAt);
    const now = new Date('2026-07-22'); // demo-fixed "today"
    const elapsed = Math.floor((now - migratedAt) / (1000 * 60 * 60 * 24));
    return Math.max(0, COEXISTENCE_DAYS - elapsed);
  } catch {
    return COEXISTENCE_DAYS;
  }
}

// ─── Perform the actual migration ────────────────────────────────────────

// Apply the mapping — creates a Workbook or Sales Play in the store and
// records the migration state.
export function performMigration(playbookId, mapping, overrides = {}) {
  const playbook = getLegacyPlaybook(playbookId);
  if (!playbook || !mapping) return null;

  if (mapping.target === 'workbook') {
    // Freeze current match count into a static CUSTOM_CSV workbook.
    const name = overrides.name || mapping.suggestedWorkbookName || playbook.name;
    const wb = createCustomWorkbook({
      name,
      rows: [], // no per-account seed here; the count carries via accountCount
      ownerId: 'priya',
      ownerName: playbook.owner || 'Priya Sharma',
      visibility: 'organization',
    });
    // Stamp source + count onto the created workbook.
    wb.accountCount = playbook.matchCount;
    wb.migratedFromPlaybookId = playbookId;
    recordMigration(playbookId, { target: 'workbook', createdId: wb.id });
    return { target: 'workbook', createdId: wb.id, entity: wb };
  }

  // Sales Play case.
  const playId = `play-migrated-${playbookId.replace(/^lpb-/, '')}-${Date.now()}`;
  const playType = mapping.playType || 'inbound';
  const activation = playType === 'inbound'
    ? {
        mode: 'trigger',
        batchSize: 10,
        batchGapMinutes: 30,
        autoRunOnNewRecords: false,
        triggerType: overrides.triggerType || mapping.suggestedTriggerType,
        triggerConfig: {},
        activatedAt: null,
        batches: [],
      }
    : {
        mode: 'admin_activated',
        batchSize: 10,
        batchGapMinutes: 30,
        autoRunOnNewRecords: true,
        triggerType: null,
        triggerConfig: {},
        activatedAt: null,
        batches: [],
      };

  const workflowId = overrides.workflowId ?? mapping.suggestedWorkflowId;
  const play = {
    id: playId,
    name: overrides.name || mapping.suggestedName || playbook.name,
    description: playbook.description || '',
    motion: 'new_logo',
    type: playType,
    status: 'active',
    audience_roles: ['AE', 'AM'],
    offerings: [],
    firmoFilters: { industries: [], sizeBand: '', regions: [] },
    technoFilters: { hasInstalled: [], missingInstall: [], custom: [] },
    audienceFilters: (playbook.filters || []).map((f, i) => ({
      id: `flt_${playbookId}_${i}`,
      group: f.group || 'General',
      label: f.label,
      displayValue: `${f.op} ${f.value}`,
      specId: `legacy_${i}`,
    })),
    signals: [],
    workbookIds: [],
    recommended_workflows: workflowId ? [workflowId] : [],
    actions: [],
    activation,
    source_workbook_id: null,
    source_record_ids: [],
    created_by: playbook.owner || 'Priya Sharma',
    version: 1,
    visibility: 'tenant',
    migratedFromPlaybookId: playbookId,
  };
  upsertPlay(play);
  recordMigration(playbookId, { target: 'sales_play', createdId: playId });
  return { target: 'sales_play', createdId: playId, entity: play };
}

// Aggregate counters for the Admin Hub tile + Migration Center header.
export function migrationCounts() {
  const state = readState();
  const total = LEGACY_PLAYBOOKS.length;
  const migrated = LEGACY_PLAYBOOKS.filter((p) => state[p.id]).length;
  return { total, migrated, remaining: total - migrated };
}
