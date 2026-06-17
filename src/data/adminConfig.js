// Admin-controlled governance overrides for agents and playbooks.
//
// Agents:
//   - sellerVisible: whether sellers can invoke this atomic agent (default: true)
//   - capabilityCap:  global cap that downgrades the agent's ceiling (default: agent.ceiling)
//
// Playbooks:
//   - status:             'draft' | 'published'  (existing 'live' is treated as 'published')
//   - audienceRoles:      array of role codes: 'AE' | 'AM' | 'CSM'  (default: all)
//   - pinnedToWorkbench:  whether to surface on seller Workbench  (default: false)
//
// Overrides persist in localStorage under a single key so multiple tabs stay
// in sync via the `storage` event. Mutations also dispatch a same-tab event
// (`rgi:admin-config-changed`) so React components in the active tab re-read
// the merged config without a full reload.

import { AGENTS } from './agents.js';
import { AUTHORED_PLAYBOOKS } from './playbooks.js';

const STORAGE_KEY = 'rgi-admin-config';
const CHANGE_EVENT = 'rgi:admin-config-changed';

export const SELLER_ROLES = ['AE', 'AM', 'CSM'];

function emptyConfig() {
  return { agents: {}, playbooks: {} };
}

function readRaw() {
  if (typeof window === 'undefined') return emptyConfig();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyConfig();
    const parsed = JSON.parse(raw);
    return {
      agents: parsed.agents && typeof parsed.agents === 'object' ? parsed.agents : {},
      playbooks: parsed.playbooks && typeof parsed.playbooks === 'object' ? parsed.playbooks : {},
    };
  } catch {
    return emptyConfig();
  }
}

function writeRaw(next) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Storage quota / private-mode — silently ignore for the demo.
  }
}

// ----- Agent reads -----

export function getAgentConfig(agentId) {
  const agent = AGENTS[agentId];
  if (!agent) return null;
  const overrides = readRaw().agents[agentId] || {};
  return {
    sellerVisible: overrides.sellerVisible ?? true,
    capabilityCap: overrides.capabilityCap ?? agent.ceiling,
  };
}

export function setAgentConfig(agentId, patch) {
  const current = readRaw();
  const existing = current.agents[agentId] || {};
  const next = {
    ...current,
    agents: {
      ...current.agents,
      [agentId]: { ...existing, ...patch },
    },
  };
  writeRaw(next);
}

// ----- Playbook reads -----

function defaultPlaybookConfig(playbook) {
  const status = playbook.status === 'live' ? 'published' : playbook.status === 'draft' ? 'draft' : 'published';
  return {
    status,
    audienceRoles: [...SELLER_ROLES],
    pinnedToWorkbench: false,
  };
}

export function getPlaybookConfig(playbookId) {
  const playbook = AUTHORED_PLAYBOOKS.find((p) => p.id === playbookId);
  if (!playbook) return null;
  const defaults = defaultPlaybookConfig(playbook);
  const overrides = readRaw().playbooks[playbookId] || {};
  return {
    status: overrides.status ?? defaults.status,
    audienceRoles: Array.isArray(overrides.audienceRoles) ? overrides.audienceRoles : defaults.audienceRoles,
    pinnedToWorkbench: overrides.pinnedToWorkbench ?? defaults.pinnedToWorkbench,
    firstPublishedAt: overrides.firstPublishedAt ?? null,
  };
}

export function setPlaybookConfig(playbookId, patch) {
  const current = readRaw();
  const existing = current.playbooks[playbookId] || {};
  // Capture first-published timestamp so we can compute time-to-adoption later.
  let extra = {};
  if (patch.status === 'published' && !existing.firstPublishedAt) {
    extra = { firstPublishedAt: new Date().toISOString() };
  }
  const next = {
    ...current,
    playbooks: {
      ...current.playbooks,
      [playbookId]: { ...existing, ...patch, ...extra },
    },
  };
  writeRaw(next);
}

// ----- Subscriptions -----

// Subscribe to admin-config changes from either this tab or another tab.
// Returns an unsubscribe function.
export function subscribeAdminConfig(onChange) {
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

// ----- Aggregate selectors -----

const TIER_RANK = { suggest: 0, draft: 1, act: 2 };

function lowerTier(a, b) {
  return TIER_RANK[a] <= TIER_RANK[b] ? a : b;
}

// Returns the effective capability cap (after admin override) for an agent.
export function effectiveAgentCap(agentId) {
  const agent = AGENTS[agentId];
  if (!agent) return 'suggest';
  const cfg = getAgentConfig(agentId);
  return lowerTier(agent.ceiling, cfg.capabilityCap);
}

// Sellers' allow-list of atomic agents: visibility + module gate.
export function listSellerVisibleAgents({ modulesOwned }) {
  return Object.values(AGENTS).filter((a) => {
    if (!modulesOwned.includes(a.requiredModule)) return false;
    const cfg = getAgentConfig(a.id);
    return cfg.sellerVisible;
  });
}

// Sellers' allow-list of playbooks: published + audience-includes-role + module gate.
export function listAvailablePlaybooksForSeller({ modulesOwned, salesRole }) {
  return AUTHORED_PLAYBOOKS.filter((p) => {
    if (!Array.isArray(p.pipeline) || p.pipeline.length === 0) return false;
    const everyModuleOwned = p.pipeline.every((node) => {
      const a = AGENTS[node.agent];
      return a && modulesOwned.includes(a.requiredModule);
    });
    if (!everyModuleOwned) return false;
    const cfg = getPlaybookConfig(p.id);
    if (cfg.status !== 'published') return false;
    if (salesRole && !cfg.audienceRoles.includes(salesRole)) return false;
    return true;
  });
}

// Pinned-to-Workbench playbooks for a seller role.
export function listPinnedPlaybooksForSeller({ modulesOwned, salesRole }) {
  return listAvailablePlaybooksForSeller({ modulesOwned, salesRole }).filter((p) => {
    const cfg = getPlaybookConfig(p.id);
    return cfg.pinnedToWorkbench;
  });
}

// ----- Adoption metrics -----

// Rough per-agent activation rate = (active users who invoked the agent in any
// playbook) / (total seats). We seed totalSeats here; replace with a real
// integration count when wired.
const TOTAL_SEATS = 47;

export function getAdoptionMetrics() {
  const playbookMetrics = AUTHORED_PLAYBOOKS.map((p) => {
    const cfg = getPlaybookConfig(p.id);
    return {
      id: p.id,
      name: p.name,
      status: cfg.status,
      audienceRoles: cfg.audienceRoles,
      pinnedToWorkbench: cfg.pinnedToWorkbench,
      activeUsers: p.activeUsers || 0,
      runsThisWeek: p.runsThisWeek || 0,
      usageRate: p.activeUsers ? Math.round((p.activeUsers / TOTAL_SEATS) * 100) : 0,
    };
  });

  // Build a quick agent-usage index from playbook pipelines + their active users
  // (this is a demo proxy — real metrics would come from runs telemetry).
  const agentUsers = {};
  for (const p of AUTHORED_PLAYBOOKS) {
    if (!Array.isArray(p.pipeline)) continue;
    for (const node of p.pipeline) {
      agentUsers[node.agent] = Math.max(agentUsers[node.agent] || 0, p.activeUsers || 0);
    }
  }

  const agentMetrics = Object.values(AGENTS).map((a) => {
    const cfg = getAgentConfig(a.id);
    const users = agentUsers[a.id] || 0;
    return {
      id: a.id,
      label: a.label,
      sellerVisible: cfg.sellerVisible,
      capabilityCap: cfg.capabilityCap,
      activeUsers: users,
      activationRate: Math.round((users / TOTAL_SEATS) * 100),
    };
  });

  const publishedCount = playbookMetrics.filter((p) => p.status === 'published').length;
  const pinnedCount = playbookMetrics.filter((p) => p.pinnedToWorkbench).length;
  const visibleAgentCount = agentMetrics.filter((a) => a.sellerVisible).length;

  return {
    totalSeats: TOTAL_SEATS,
    visibleAgentCount,
    totalAgentCount: agentMetrics.length,
    publishedCount,
    totalPlaybookCount: playbookMetrics.length,
    pinnedCount,
    topPlaybooks: [...playbookMetrics].sort((a, b) => b.runsThisWeek - a.runsThisWeek).slice(0, 4),
    coldAgents: agentMetrics.filter((a) => a.sellerVisible && a.activationRate < 10).slice(0, 4),
    agentMetrics,
    playbookMetrics,
  };
}
