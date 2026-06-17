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
