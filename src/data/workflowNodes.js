// Workflow node taxonomy — Layer 3 of the architecture.
//
// Workflows are DAGs that EXECUTE actions on an account (vs. signals which
// COMPUTE values). Every workflow has exactly one trigger and at least one
// terminal output (outcome logger or notify).
//
// Each node has a `mode`:
//   - 'agentic'        — invokes a Phoenix LLM agent (has token cost)
//   - 'deterministic'  — fixed compute or API call (no LLM cost)
//   - 'control'        — flow control (trigger / logic / wait / checkpoint / output)

export const NODE_FAMILIES = {
  trigger: {
    id: 'trigger',
    label: 'Trigger',
    desc: 'How the workflow gets invoked',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    stroke: '#f43f5e',
  },
  agent: {
    id: 'agent',
    label: 'Agent',
    desc: 'Phoenix LLM step — drafts, research, reasoning',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    stroke: '#10b981',
  },
  api: {
    id: 'api',
    label: 'API',
    desc: 'Deterministic external call — HG, CRM, Outreach, Marketo, Slack',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    stroke: '#0ea5e9',
  },
  logic: {
    id: 'logic',
    label: 'Logic',
    desc: 'Branch, match, loop',
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    stroke: '#8b5cf6',
  },
  checkpoint: {
    id: 'checkpoint',
    label: 'Checkpoint',
    desc: 'Human-in-loop approval/review',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    stroke: '#f59e0b',
  },
  wait: {
    id: 'wait',
    label: 'Wait',
    desc: 'Async delay / event-wait',
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    stroke: '#64748b',
  },
  output: {
    id: 'output',
    label: 'Output',
    desc: 'Terminal — log outcome (feeds the loop) or notify',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    stroke: '#10b981',
  },
};

// Node type registry. Each entry: { label, family, mode, icon, output, isTerminal? }
export const WORKFLOW_NODE_TYPES = {
  // ---- Triggers ----
  'trigger.signal': {
    label: 'Signal Trigger',
    family: 'trigger',
    mode: 'control',
    icon: 'Zap',
    desc: 'Workflow activates when a bound signal fires on an account',
    isTrigger: true,
  },
  'trigger.manual': {
    label: 'Manual Trigger',
    family: 'trigger',
    mode: 'control',
    icon: 'Hand',
    desc: 'Seller invokes via @-mention or click',
    isTrigger: true,
  },
  'trigger.scheduled': {
    label: 'Scheduled Trigger',
    family: 'trigger',
    mode: 'control',
    icon: 'Clock',
    desc: 'Runs on a cron schedule',
    isTrigger: true,
  },
  'trigger.champion_job_change': {
    label: 'Champion Job Change',
    family: 'trigger',
    mode: 'control',
    icon: 'UserCog',
    desc: 'Fires when a tracked contact changes job — surfaces old and new company/title in the run context',
    isTrigger: true,
    triggerData: [
      'contact_id', 'contact_name', 'contact_email',
      'old_company_name', 'old_company_id',
      'new_company_name', 'new_company_domain', 'new_title',
      'related_opportunity_id',
    ],
  },
  'trigger.event_fired': {
    label: 'Event Fired',
    family: 'trigger',
    mode: 'control',
    icon: 'Activity',
    desc: 'Fires on a first-party or third-party event (TrustRadius, webinar attended, form fill, demo request)',
    isTrigger: true,
    triggerData: [
      'event_type', 'event_source', 'event_data',
      'account_id', 'contact_id',
      'lead_email', 'lead_name', 'lead_company_domain', 'lead_form_data',
    ],
  },
  'trigger.crm_field_updated': {
    label: 'CRM Field Updated',
    family: 'trigger',
    mode: 'control',
    icon: 'Edit',
    desc: 'Fires when a CRM record field transitions to a target value (e.g., Opportunity.Stage → Closed Won)',
    isTrigger: true,
    triggerData: [
      'opportunity_id', 'account_id', 'account_name',
      'products_sold', 'competitor_mentioned', 'close_date', 'arr',
    ],
  },

  // ---- Phoenix agents (agentic) ----
  'agent.email_draft': {
    label: 'Email Draft',
    family: 'agent',
    mode: 'agentic',
    icon: 'Mail',
    agentId: 'email_draft',
    desc: 'Drafts personalized outreach email',
    estCostTokens: 1200,
  },
  'agent.competitive_battlecard': {
    label: 'Competitive Battlecard',
    family: 'agent',
    mode: 'agentic',
    icon: 'Sword',
    agentId: 'competitive_battlecard',
    desc: 'Pulls competitor positioning + objection handling',
    estCostTokens: 2400,
  },
  'agent.persona_discovery': {
    label: 'Persona Discovery',
    family: 'agent',
    mode: 'agentic',
    icon: 'Users',
    agentId: 'persona_discovery',
    desc: 'Finds key personas missing from CRM',
    estCostTokens: 1800,
  },
  'agent.meeting_prep': {
    label: 'Meeting Prep',
    family: 'agent',
    mode: 'agentic',
    icon: 'Calendar',
    agentId: 'meeting_prep',
    desc: 'Builds a pre-call brief',
    estCostTokens: 2000,
  },
  'agent.value_hypothesis': {
    label: 'Value Hypothesis',
    family: 'agent',
    mode: 'agentic',
    icon: 'Sparkles',
    agentId: 'value_hypothesis',
    desc: 'Generates account-specific value prop',
    estCostTokens: 1600,
  },
  'agent.renewal_readiness': {
    label: 'Renewal Readiness',
    family: 'agent',
    mode: 'agentic',
    icon: 'Handshake',
    agentId: 'renewal_readiness',
    desc: 'Composes renewal brief with risk signals',
    estCostTokens: 2200,
  },
  'agent.account_research': {
    label: 'Account Research',
    family: 'agent',
    mode: 'agentic',
    icon: 'FileSearch',
    agentId: 'account_research',
    desc: 'Web + SEC research synthesis',
    estCostTokens: 3500,
  },

  // ---- GTM Workflow atomic agents (Sales_Copilot_GTM_Workflows_Requirements.md) ----
  // Write agents (is_reversible: false, approval gate on by default)
  'agent.upsert_crm_account': {
    label: 'Upsert CRM account',
    family: 'agent',
    mode: 'agentic',
    icon: 'Building2',
    agentId: 'upsert_crm_account',
    desc: 'Creates or resolves a CRM account by domain match (idempotent)',
    estCostMs: 340,
    writeScope: ['sfdc.account.upsert'],
  },
  'agent.update_crm_contact_fields': {
    label: 'Update CRM contact fields',
    family: 'agent',
    mode: 'agentic',
    icon: 'UserCog',
    agentId: 'update_crm_contact_fields',
    desc: 'Patches specific fields on an existing CRM contact record',
    estCostMs: 210,
    writeScope: ['sfdc.contact.update'],
  },
  'agent.add_contacts_to_crm': {
    label: 'Add contacts to CRM',
    family: 'agent',
    mode: 'agentic',
    icon: 'UserPlus',
    agentId: 'add_contacts_to_crm',
    desc: 'Bulk-creates CRM contacts; skips duplicates by email',
    estCostMs: 640,
    writeScope: ['sfdc.contact.create'],
  },
  'agent.update_account_status': {
    label: 'Update account status',
    family: 'agent',
    mode: 'agentic',
    icon: 'BadgeCheck',
    agentId: 'update_account_status',
    desc: 'Sets a CRM picklist status on one or more accounts',
    estCostMs: 480,
    writeScope: ['sfdc.account.update'],
  },
  'agent.update_contact_status': {
    label: 'Update contact status',
    family: 'agent',
    mode: 'agentic',
    icon: 'BadgeCheck',
    agentId: 'update_contact_status',
    desc: 'Sets a CRM picklist status on one or more contacts',
    estCostMs: 520,
    writeScope: ['sfdc.contact.update'],
  },
  'agent.add_contacts_to_sequence': {
    label: 'Add contacts to sequence',
    family: 'agent',
    mode: 'agentic',
    icon: 'Send',
    agentId: 'add_contacts_to_sequence',
    desc: 'Enrolls contacts in an outbound cadence',
    estCostMs: 620,
    writeScope: ['outreach.sequence.enroll'],
  },
  'agent.create_crm_tasks': {
    label: 'Create CRM tasks',
    family: 'agent',
    mode: 'agentic',
    icon: 'ListTodo',
    agentId: 'create_crm_tasks',
    desc: 'Bulk-creates follow-up tasks against accounts, contacts, or opportunities',
    estCostMs: 520,
    writeScope: ['sfdc.task.create'],
  },
  'agent.update_opportunity_field': {
    label: 'Update opportunity field',
    family: 'agent',
    mode: 'agentic',
    icon: 'Edit',
    agentId: 'update_opportunity_field',
    desc: 'Updates a single field on a CRM opportunity',
    estCostMs: 220,
    writeScope: ['sfdc.opportunity.update'],
  },

  // Read / Generate agents
  'agent.get_engagement_history': {
    label: 'Get engagement history',
    family: 'agent',
    mode: 'agentic',
    icon: 'History',
    agentId: 'get_engagement_history',
    desc: 'Pulls last-N-days of interactions for a contact',
    estCostMs: 360,
  },
  'agent.draft_personalized_email': {
    label: 'Draft personalized email',
    family: 'agent',
    mode: 'agentic',
    icon: 'Mail',
    agentId: 'draft_personalized_email',
    desc: 'Personalized email draft using engagement history + purpose',
    estCostTokens: 1400,
    writeScope: ['gmail.send', 'outreach.send'],
  },
  'agent.get_book_of_accounts': {
    label: 'Get book of accounts',
    family: 'agent',
    mode: 'agentic',
    icon: 'Bookmark',
    agentId: 'get_book_of_accounts',
    desc: 'Returns a rep\'s top accounts filtered by fit tier / ARR',
    estCostMs: 460,
  },
  'agent.generate_account_brief': {
    label: 'Generate account brief',
    family: 'agent',
    mode: 'agentic',
    icon: 'FileText',
    agentId: 'generate_account_brief',
    desc: 'Concise per-account brief tuned to the calling motion',
    estCostTokens: 1800,
  },
  'agent.find_buying_personas': {
    label: 'Find buying personas',
    family: 'agent',
    mode: 'agentic',
    icon: 'Users',
    agentId: 'find_buying_personas',
    desc: 'Finds contacts matching admin-defined persona criteria via HG Contact Discovery',
    estCostMs: 1000,
  },
  'agent.enrich_lead': {
    label: 'Enrich lead',
    family: 'agent',
    mode: 'agentic',
    icon: 'Sparkles',
    agentId: 'enrich_lead',
    desc: 'Firmographic + technographic + HG signal enrichment on an inbound lead',
    estCostMs: 1200,
  },
  'agent.score_account': {
    label: 'Score account',
    family: 'agent',
    mode: 'agentic',
    icon: 'Target',
    agentId: 'score_account',
    desc: 'Runs the tenant fit-score model on an account or enriched lead',
    estCostMs: 340,
  },
  'agent.get_account_context': {
    label: 'Get account context',
    family: 'agent',
    mode: 'agentic',
    icon: 'FileSearch',
    agentId: 'get_account_context',
    desc: 'Unified snapshot — CRM, opps, HG signals, ICP attributes',
    estCostMs: 860,
  },
  'agent.find_competitor_accounts': {
    label: 'Find competitor accounts',
    family: 'agent',
    mode: 'agentic',
    icon: 'Sword',
    agentId: 'find_competitor_accounts',
    desc: 'Finds accounts using specific competitor products (HG technographic), filtered to rep territory',
    estCostMs: 860,
  },
  'agent.get_trigger_event_details': {
    label: 'Get trigger event details',
    family: 'agent',
    mode: 'agentic',
    icon: 'Activity',
    agentId: 'get_trigger_event_details',
    desc: 'Resolves the event payload for an event-fired trigger',
    estCostMs: 220,
  },
  'agent.notify_rep': {
    label: 'Notify rep',
    family: 'agent',
    mode: 'agentic',
    icon: 'Bell',
    agentId: 'notify_rep',
    desc: 'Sends an in-app / Slack notification to the rep with workflow summary + links',
    estCostMs: 360,
    writeScope: ['slack.message.send'],
  },

  // ---- API calls (deterministic) ----
  'api.hg.install': {
    label: 'HG · Install snapshot',
    family: 'api',
    mode: 'deterministic',
    icon: 'Database',
    endpoint: 'hg.installs.fetch',
    desc: 'Fetch current install + age for a product/category',
    estCostMs: 180,
  },
  'api.hg.spend': {
    label: 'HG · Spend categories',
    family: 'api',
    mode: 'deterministic',
    icon: 'Database',
    endpoint: 'hg.spend.fetch',
    desc: 'Fetch IT spend trajectory by category',
    estCostMs: 220,
  },
  'api.hg.intent': {
    label: 'HG · Intent topics',
    family: 'api',
    mode: 'deterministic',
    icon: 'Database',
    endpoint: 'hg.intent.fetch',
    desc: 'Fetch recent intent surges for an account',
    estCostMs: 160,
  },
  'api.crm.read': {
    label: 'CRM · Read fields',
    family: 'api',
    mode: 'deterministic',
    icon: 'Database',
    endpoint: 'crm.read',
    desc: 'Read account / contact / opportunity fields',
    estCostMs: 140,
  },
  'api.crm.write': {
    label: 'CRM · Update record',
    family: 'api',
    mode: 'deterministic',
    icon: 'Edit',
    endpoint: 'crm.update',
    desc: 'Write back to a CRM record (stage, custom field, etc.)',
    estCostMs: 220,
    writeScope: ['sfdc.account.update', 'sfdc.opportunity.update'],
  },
  'api.crm.create_task': {
    label: 'CRM · Create task',
    family: 'api',
    mode: 'deterministic',
    icon: 'ListTodo',
    endpoint: 'crm.task.create',
    desc: 'Log a task for the owner to follow up',
    estCostMs: 260,
    writeScope: ['sfdc.task.create'],
  },
  'api.outreach.enroll': {
    label: 'Outreach · Enroll sequence',
    family: 'api',
    mode: 'deterministic',
    icon: 'Send',
    endpoint: 'outreach.sequence.enroll',
    desc: 'Add contact(s) to an Outreach sequence',
    estCostMs: 380,
    writeScope: ['outreach.sequence.enroll'],
  },
  'api.marketo.trigger': {
    label: 'Marketo · Trigger campaign',
    family: 'api',
    mode: 'deterministic',
    icon: 'Send',
    endpoint: 'marketo.campaign.trigger',
    desc: 'Add account to a Marketo program',
    estCostMs: 320,
    writeScope: ['marketo.campaign.trigger'],
  },
  'api.slack.notify': {
    label: 'Slack · Notify',
    family: 'api',
    mode: 'deterministic',
    icon: 'Bell',
    endpoint: 'slack.message.send',
    desc: 'Post a message to a channel or DM',
    estCostMs: 200,
    writeScope: ['slack.message.send'],
  },
  'api.custom.webhook': {
    label: 'Custom Webhook',
    family: 'api',
    mode: 'deterministic',
    icon: 'Webhook',
    endpoint: 'custom.webhook',
    desc: 'POST to a tenant-defined endpoint',
    estCostMs: 400,
  },

  // ---- Logic ----
  'logic.branch': {
    label: 'Branch (if/else)',
    family: 'logic',
    mode: 'control',
    icon: 'GitBranch',
    desc: 'Routes execution based on a condition',
  },
  'logic.match': {
    label: 'Match (switch)',
    family: 'logic',
    mode: 'control',
    icon: 'GitMerge',
    desc: 'Routes by matching upstream value to a case',
  },
  'logic.loop': {
    label: 'Loop (for each)',
    family: 'logic',
    mode: 'control',
    icon: 'Repeat',
    desc: 'Iterates child steps over a list (e.g., per contact)',
  },

  // ---- Checkpoint (human-in-loop) ----
  'checkpoint.approval': {
    label: 'Approval Checkpoint',
    family: 'checkpoint',
    mode: 'control',
    icon: 'CheckSquare',
    desc: 'Pauses for approval before continuing — assignee + SLA configurable',
  },
  'checkpoint.review': {
    label: 'Review Checkpoint',
    family: 'checkpoint',
    mode: 'control',
    icon: 'Eye',
    desc: 'Notification-only pause; auto-continues after SLA',
  },
  'checkpoint.batch_approval': {
    label: 'Batch Approval',
    family: 'checkpoint',
    mode: 'control',
    icon: 'ListChecks',
    desc: 'Rep reviews all items in a batch at once — approve all, reject all, or per-item accept/reject',
  },

  // ---- Wait ----
  'wait.duration': {
    label: 'Wait · Duration',
    family: 'wait',
    mode: 'control',
    icon: 'Clock',
    desc: 'Park the workflow for N hours/days',
  },
  'wait.event': {
    label: 'Wait · Event',
    family: 'wait',
    mode: 'control',
    icon: 'Hourglass',
    desc: 'Resume when a specific event occurs (or timeout)',
  },

  // ---- Outputs (terminal) ----
  'output.outcome': {
    label: 'Outcome Logger',
    family: 'output',
    mode: 'control',
    icon: 'CircleCheck',
    isTerminal: true,
    desc: 'Capture outcome (sent, booked, no-response) — feeds the data flywheel',
  },
  'output.notify': {
    label: 'Notify',
    family: 'output',
    mode: 'control',
    icon: 'Bell',
    isTerminal: true,
    desc: 'Terminal notification (Slack / email / in-app)',
  },
};

// Helpers
export function nodeFamily(type) {
  return WORKFLOW_NODE_TYPES[type]?.family || 'agent';
}

export function isTerminal(type) {
  return Boolean(WORKFLOW_NODE_TYPES[type]?.isTerminal);
}

export function isTrigger(type) {
  return Boolean(WORKFLOW_NODE_TYPES[type]?.isTrigger);
}

export function nodeMode(type) {
  return WORKFLOW_NODE_TYPES[type]?.mode || 'agentic';
}

// Resolves the atomic-agent contract that backs a given node type.
// Returns the AGENTS[agentId] entry when the node type references an agent,
// otherwise null. Used by the inspector and canvas to render approval-gate
// badges and populate the InputMappingPanel with the agent's declared inputs.
//
// Import kept dynamic to avoid a hard circular ref between agents.js and this
// file. Callers pass in the AGENTS map to keep the helper pure.
export function contractForNodeType(type, AGENTS) {
  const meta = WORKFLOW_NODE_TYPES[type];
  if (!meta?.agentId || !AGENTS) return null;
  return AGENTS[meta.agentId] || null;
}

// Approval gate rule (spec §1.2): non-reversible agents surface an approval
// toggle in the builder. This helper is the single source of truth so the
// canvas, inspector, and RunPreviewRail agree.
export function nodeRequiresApprovalGate(type, AGENTS, nodeConfig) {
  // Explicit per-node override wins.
  if (nodeConfig?.approval_required === true) return true;
  if (nodeConfig?.approval_required === false) return false;
  const contract = contractForNodeType(type, AGENTS);
  if (contract?.is_reversible === false) return contract.requires_approval_by_default !== false;
  // Non-agent writes: infer from writeScope presence on the node type.
  const meta = WORKFLOW_NODE_TYPES[type];
  if (Array.isArray(meta?.writeScope) && meta.writeScope.length > 0) return true;
  return false;
}

// Returns the field names available in the run context from a specific
// trigger type (used by the InputMappingPanel to populate the "trigger.data.*"
// options in an input-mapping dropdown).
export function triggerDataFields(type) {
  const meta = WORKFLOW_NODE_TYPES[type];
  if (!meta?.isTrigger) return [];
  if (Array.isArray(meta.triggerData)) return meta.triggerData;
  // Legacy triggers — best-effort default set so existing workflows still show
  // sensible bindings in the mapping panel.
  if (type === 'trigger.signal') return ['account_id', 'signal_id', 'signal_score'];
  if (type === 'trigger.manual') return ['account_id', 'contact_id', 'rep_id'];
  if (type === 'trigger.scheduled') return ['rep_id', 'run_at'];
  return [];
}

export const MODE_BADGES = {
  agentic: { label: 'Agentic', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10' },
  deterministic: { label: 'Deterministic', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500/10' },
  control: { label: 'Control', color: 'text-text-secondary', bg: 'bg-surface-2' },
};

export const WORKFLOW_STATUSES = {
  draft: { id: 'draft', label: 'Draft', dot: 'bg-text-muted', color: 'text-text-secondary', bg: 'bg-surface-2' },
  active: { id: 'active', label: 'Active', dot: 'bg-emerald-500', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10' },
  disabled: { id: 'disabled', label: 'Disabled', dot: 'bg-amber-500', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10' },
  paused: { id: 'paused', label: 'Paused', dot: 'bg-amber-500', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10' },
  deprecated: { id: 'deprecated', label: 'Deprecated', dot: 'bg-text-muted', color: 'text-text-muted', bg: 'bg-surface-2' },
};
