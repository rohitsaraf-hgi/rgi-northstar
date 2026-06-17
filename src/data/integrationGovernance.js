// Integration → agent-access governance.
//
// Each integration in /admin/apps is a surface that humans use today (Slack
// approvals, CRM sync, Marketo campaigns, etc.). Phoenix agents and workflow
// API call nodes need a separate, explicit grant to use those same integrations.
// This module is that separate grant.
//
// Storage: localStorage. Mutations dispatch a same-tab change event so
// React surfaces re-derive without a full reload.

const STORAGE_KEY = 'rgi-integration-governance-v1';
const CHANGE_EVENT = 'rgi:integration-governance-changed';

// ----- Tool catalogs per integration -----
//
// What an agent can actually do once admin enables access. Each tool has a
// scope ('read' or 'write') so the UI can render the right risk treatment.

export const INTEGRATION_TOOLS = {
  salesforce: [
    { id: 'crm.account.read', label: 'Read account fields', scope: 'read' },
    { id: 'crm.contact.read', label: 'Read contact fields', scope: 'read' },
    { id: 'crm.opportunity.read', label: 'Read opportunity fields', scope: 'read' },
    { id: 'crm.account.update', label: 'Update account record', scope: 'write' },
    { id: 'crm.contact.create', label: 'Create contact', scope: 'write' },
    { id: 'crm.task.create', label: 'Create follow-up task', scope: 'write' },
  ],
  hubspot: [
    { id: 'crm.account.read', label: 'Read company fields', scope: 'read' },
    { id: 'crm.contact.read', label: 'Read contact fields', scope: 'read' },
    { id: 'crm.account.update', label: 'Update company record', scope: 'write' },
    { id: 'crm.contact.create', label: 'Create contact', scope: 'write' },
    { id: 'crm.task.create', label: 'Create follow-up task', scope: 'write' },
  ],
  outreach: [
    { id: 'outreach.sequence.list', label: 'List sequences', scope: 'read' },
    { id: 'outreach.sequence.enroll', label: 'Enroll prospects in sequence', scope: 'write' },
    { id: 'outreach.prospect.create', label: 'Create prospect', scope: 'write' },
  ],
  marketo: [
    { id: 'marketo.campaign.list', label: 'List campaigns', scope: 'read' },
    { id: 'marketo.campaign.trigger', label: 'Trigger campaign for account', scope: 'write' },
    { id: 'marketo.lead.create', label: 'Create lead', scope: 'write' },
  ],
  slack: [
    { id: 'slack.channel.list', label: 'List channels accessible to bot', scope: 'read' },
    { id: 'slack.message.send', label: 'Send messages to channels / DMs', scope: 'write' },
  ],
  teams: [
    { id: 'teams.channel.list', label: 'List Teams channels', scope: 'read' },
    { id: 'teams.message.send', label: 'Send messages to Teams channels', scope: 'write' },
  ],
  email: [
    { id: 'email.send', label: 'Send transactional emails via SMTP', scope: 'write' },
  ],
  segment: [
    { id: 'segment.events.stream', label: 'Read event stream', scope: 'read' },
  ],
  amplitude: [
    { id: 'amplitude.events.stream', label: 'Read event stream', scope: 'read' },
  ],
  snowflake: [
    { id: 'snowflake.query', label: 'Run read-only queries against Data Share', scope: 'read' },
  ],
  webhooks: [
    { id: 'webhooks.fire', label: 'Fire outbound webhook events', scope: 'write' },
  ],
  api: [
    { id: 'api.call', label: 'Make platform API calls on behalf of agents', scope: 'read' },
  ],
  mcp: [
    { id: 'mcp.tools', label: 'Expose tools through MCP server', scope: 'read' },
  ],
};

// ----- Workflow node → integration mapping -----
//
// Given a workflow node type and (where relevant) its config, returns the
// integration ID it depends on. Used for inspector dependency warnings +
// publish validation.

export function integrationForWorkflowNode(node) {
  if (!node?.type) return null;
  const t = node.type;

  // HG-native — always available, no per-tenant integration required
  if (t.startsWith('api.hg.')) return 'hg_native';

  // CRM
  if (t.startsWith('api.crm.')) return 'salesforce'; // primary CRM — could be hubspot

  // External services
  if (t === 'api.outreach.enroll') return 'outreach';
  if (t === 'api.marketo.trigger') return 'marketo';
  if (t === 'api.slack.notify') return 'slack';
  if (t === 'api.custom.webhook') return 'webhooks';

  // Event sources depend on which event source is configured
  if (t === 'source.event') {
    const src = node.config?.source;
    if (src === 'marketo') return 'marketo';
    if (src === 'outreach') return 'outreach';
    if (src === 'segment') return 'segment';
    if (src === 'amplitude') return 'amplitude';
    if (src === 'gong') return 'gong'; // not yet in integration registry — would need to add
    if (src === 'product') return 'segment'; // assume product telemetry routes via Segment
    return null;
  }

  // CRM signal source
  if (t === 'source.crm') return 'salesforce';

  // Phoenix agents themselves don't need integration grants — only their downstream effects do
  if (t.startsWith('agent.')) return null;

  // Triggers, logic, checkpoint, wait, output — no integration dependency
  return null;
}

// HG-native is always available; treat as always-granted so we don't false-fail.
const ALWAYS_GRANTED = new Set(['hg_native']);

// ----- Persistence -----

function emptyStore() {
  return {};
}

function readRaw() {
  if (typeof window === 'undefined') return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : emptyStore();
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
    // ignore quota errors
  }
}

// ----- Access audit -----
//
// Every governance change is captured here so admins can answer "who granted
// what to which integration when". Same shape as signal/workflow store audit
// entries to keep the surface consistent.

const AUDIT_KEY = '_audit';
const AUDIT_LIMIT = 200;

function appendAccessAudit(store, entry) {
  const next = { ...store };
  const audit = Array.isArray(next[AUDIT_KEY]) ? next[AUDIT_KEY] : [];
  next[AUDIT_KEY] = [...audit, { ...entry, at: entry.at || new Date().toISOString() }].slice(
    -AUDIT_LIMIT,
  );
  return next;
}

export function listAccessAuditLog({ integrationId = null, limit = 50 } = {}) {
  const store = readRaw();
  const audit = Array.isArray(store[AUDIT_KEY]) ? store[AUDIT_KEY] : [];
  const filtered = integrationId ? audit.filter((a) => a.integrationId === integrationId) : audit;
  return [...filtered].reverse().slice(0, limit);
}

export function clearAccessAuditLog() {
  const store = readRaw();
  const next = { ...store };
  delete next[AUDIT_KEY];
  writeRaw(next);
}

// ----- Default agent-access state -----
//
// For the demo, most connected integrations default to AGENT ACCESS = ON, but
// Salesforce defaults to OFF so the inspector dependency warning is visible
// out of the box and the admin can experience the toggle moment.

const DEFAULTS = {
  slack: { agentAccess: true, enabledTools: null /* null = all */ },
  email: { agentAccess: true, enabledTools: null },
  teams: { agentAccess: false, enabledTools: null },
  salesforce: { agentAccess: false, enabledTools: null },
  hubspot: { agentAccess: false, enabledTools: null },
  outreach: { agentAccess: true, enabledTools: null },
  marketo: { agentAccess: true, enabledTools: null },
  snowflake: { agentAccess: true, enabledTools: null },
  segment: { agentAccess: true, enabledTools: null },
  amplitude: { agentAccess: false, enabledTools: null },
  webhooks: { agentAccess: false, enabledTools: null },
  api: { agentAccess: true, enabledTools: null },
  mcp: { agentAccess: true, enabledTools: null },
};

// ----- Public API -----

export function getIntegrationGovernance(integrationId) {
  if (!integrationId) return null;
  if (ALWAYS_GRANTED.has(integrationId)) {
    return { agentAccess: true, enabledTools: null, alwaysGranted: true };
  }
  const stored = readRaw()[integrationId];
  const base = DEFAULTS[integrationId] || { agentAccess: false, enabledTools: null };
  return {
    agentAccess: stored?.agentAccess ?? base.agentAccess,
    enabledTools: stored?.enabledTools ?? base.enabledTools,
    alwaysGranted: false,
  };
}

export function setIntegrationGovernance(integrationId, patch, { by = 'Priya' } = {}) {
  if (!integrationId || ALWAYS_GRANTED.has(integrationId)) return;
  const store = readRaw();
  const current = store[integrationId] || DEFAULTS[integrationId] || {};
  const previousAccess = current.agentAccess ?? DEFAULTS[integrationId]?.agentAccess ?? false;
  const merged = { ...current, ...patch };

  let next = { ...store, [integrationId]: merged };

  // Audit: log any actual transition of agentAccess.
  if (patch.agentAccess !== undefined && patch.agentAccess !== previousAccess) {
    next = appendAccessAudit(next, {
      integrationId,
      action: patch.agentAccess ? 'agent_access_enabled' : 'agent_access_disabled',
      by,
      message: patch.agentAccess
        ? `Granted agent access to ${integrationId}`
        : `Revoked agent access from ${integrationId}`,
      from: previousAccess,
      to: patch.agentAccess,
    });
  }

  // Audit: if enabledTools is explicitly set (per-tool granularity later), log it too.
  if (
    patch.enabledTools !== undefined &&
    JSON.stringify(patch.enabledTools) !== JSON.stringify(current.enabledTools)
  ) {
    next = appendAccessAudit(next, {
      integrationId,
      action: 'tools_modified',
      by,
      message: `Modified tool exposure for ${integrationId}`,
      tools: patch.enabledTools,
    });
  }

  writeRaw(next);
}

export function isAgentAccessEnabled(integrationId) {
  if (!integrationId) return true; // no integration dependency
  return getIntegrationGovernance(integrationId)?.agentAccess ?? false;
}

export function listIntegrationTools(integrationId) {
  return INTEGRATION_TOOLS[integrationId] || [];
}

// Convenience for the workflow builder: returns { ok, integration, reason }
// describing whether a node can execute as-configured. Reason is human-readable.
export function checkNodeIntegrationAccess(node, integrationStatus) {
  const integrationId = integrationForWorkflowNode(node);
  if (!integrationId || ALWAYS_GRANTED.has(integrationId)) {
    return { ok: true, integrationId: null };
  }
  // integrationStatus is an optional 'connected' / 'action_required' / 'not_connected'
  // passed in by the caller. If supplied we can give richer guidance.
  if (integrationStatus === 'not_connected') {
    return { ok: false, integrationId, reason: 'Integration not connected — connect in /admin/apps first.' };
  }
  if (integrationStatus === 'action_required') {
    return { ok: false, integrationId, reason: 'Integration needs re-auth — fix in /admin/apps to restore agent access.' };
  }
  if (!isAgentAccessEnabled(integrationId)) {
    return {
      ok: false,
      integrationId,
      reason: `Agent access for ${integrationId} is disabled — enable in /admin/apps before running.`,
    };
  }
  return { ok: true, integrationId };
}

// ----- Subscriptions -----

export function subscribeIntegrationGovernance(onChange) {
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

// Aggregate: how many integrations have agent access enabled.
export function agentEnabledIntegrationCount(allIntegrationIds) {
  return allIntegrationIds.filter((id) => isAgentAccessEnabled(id)).length;
}
