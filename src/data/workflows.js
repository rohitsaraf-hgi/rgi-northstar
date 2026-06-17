// Tenant workflows — Layer 3 of the architecture.
//
//   DATA → SIGNAL → WORKFLOW (this layer) → SELLER OUTCOME
//
// A workflow is a DAG of heterogeneous nodes (trigger + agents + API calls +
// logic + checkpoints + waits + outputs) that executes on an account when
// invoked. Trigger types: signal (bound to a signal that fires), manual
// (seller @-mention), or scheduled.
//
// Workflow IDs are kept stable so existing admin config (audience roles,
// pin-to-workbench) keeps working through the surface rename.

import { WORKFLOW_NODE_TYPES } from './workflowNodes.js';

// Seed workflows — variety of mode mixes (pure agentic, hybrid, mostly deterministic).
export const WORKFLOWS = [
  {
    id: 'sales-play-fintech-displacement',
    name: 'Q2 Fintech Displacement Play',
    description:
      'Triggers when Splunk Aging Displacement signal fires. Enriches with HG intent, drafts a 3-touch displacement sequence, routes through AE approval, enrolls in Outreach.',
    status: 'active',
    audience_roles: ['AE'],
    offering_id: 'cnapp',
    created_by: 'Priya',
    created_by_role: 'RevOps',
    current_version: 3,
    runs_this_week: 14,
    success_rate_pct: 34,
    last_evaluated: '2 hr ago',
    vertical_tags: ['fintech', 'saas'],
    bound_signal: 'splunk-aging-displacement',
    tree: {
      output_node: 'n_outcome',
      nodes: {
        n_trigger: { type: 'trigger.signal', config: { signal_id: 'splunk-aging-displacement' } },
        n_install: { type: 'api.hg.install', config: { entity: 'product', value: 'Splunk' } },
        n_intent: { type: 'api.hg.intent', config: { category: 'Observability' } },
        n_battlecard: { type: 'agent.competitive_battlecard', config: { competitor: 'Splunk' } },
        n_email: { type: 'agent.email_draft', config: { tone: 'consultative', cadence: '3-touch' } },
        n_approve: { type: 'checkpoint.approval', config: { assignee_role: 'AE', sla_hours: 24 } },
        n_enroll: { type: 'api.outreach.enroll', config: { sequence: 'EMEA Displacement' } },
        n_outcome: { type: 'output.outcome', config: { capture: 'reply_received, meeting_booked, no_response_14d' } },
      },
      edges: [
        ['n_trigger', 'n_install'],
        ['n_install', 'n_intent'],
        ['n_intent', 'n_battlecard'],
        ['n_battlecard', 'n_email'],
        ['n_email', 'n_approve'],
        ['n_approve', 'n_enroll'],
        ['n_enroll', 'n_outcome'],
      ],
    },
    versions: [
      { version: 1, published_at: 'March 14, 10:00 AM', published_by: 'Priya', summary: 'Initial — 2-touch sequence, no approval gate.' },
      { version: 2, published_at: 'April 5, 11:30 AM', published_by: 'Priya', summary: 'Added battlecard pre-step + AE approval checkpoint.' },
      { version: 3, published_at: 'April 22, 2:14 PM', published_by: 'Priya', summary: 'Routed through Outreach sequence; outcome capture tightened.' },
    ],
  },
  {
    id: 'account-brief-flow',
    name: 'Account Brief',
    description:
      'Manual or signal-triggered 6-step research synthesis — HG firmographics, web research, SEC filings, CRM 360 — rolled into a MEDDIC-framed brief. Gracefully degrades when CRM is not connected.',
    status: 'active',
    audience_roles: ['AE', 'AM'],
    offering_id: 'all',
    created_by: 'Priya',
    created_by_role: 'RevOps',
    current_version: 2,
    runs_this_week: 38,
    success_rate_pct: 82,
    last_evaluated: '14 min ago',
    vertical_tags: ['general'],
    bound_signal: null,
    tree: {
      output_node: 'n_notify',
      nodes: {
        n_trigger: { type: 'trigger.manual', config: { invocation: 'thread' } },
        n_crm: { type: 'api.crm.read', config: { object: 'account', fields: 'industry,arr,stage,renewal_date' } },
        n_install: { type: 'api.hg.install', config: { entity: 'category', value: 'BI' } },
        n_spend: { type: 'api.hg.spend', config: { category: 'IT' } },
        n_research: { type: 'agent.account_research', config: { scope: 'web+sec' } },
        n_personas: { type: 'agent.persona_discovery', config: { titles: 'VP,SVP,C-Level' } },
        n_value: { type: 'agent.value_hypothesis', config: { focus: 'MEDDIC roll-up' } },
        n_notify: { type: 'output.notify', config: { channel: 'thread', format: 'brief' } },
      },
      edges: [
        ['n_trigger', 'n_crm'],
        ['n_trigger', 'n_install'],
        ['n_trigger', 'n_spend'],
        ['n_crm', 'n_research'],
        ['n_install', 'n_research'],
        ['n_spend', 'n_research'],
        ['n_research', 'n_personas'],
        ['n_research', 'n_value'],
        ['n_personas', 'n_notify'],
        ['n_value', 'n_notify'],
      ],
    },
    versions: [
      { version: 1, published_at: 'April 26, 9:00 AM', published_by: 'Priya', summary: 'Initial — 2-agent pipeline.' },
      { version: 2, published_at: 'May 8, 3:42 PM', published_by: 'Priya', summary: '8-agent fan-out with HG firmographics + MEDDIC roll-up.' },
    ],
  },
  {
    id: 'onboarding-rescue-flow',
    name: 'Onboarding Rescue',
    description:
      'Triggered by Onboarding Stalled signal. Pulls product usage detail, drafts personalized re-engagement email, routes through CSM for approval, logs Salesforce follow-up task.',
    status: 'active',
    audience_roles: ['AM', 'CSM'],
    offering_id: 'all',
    created_by: 'Priya',
    created_by_role: 'RevOps',
    current_version: 1,
    runs_this_week: 8,
    success_rate_pct: 67,
    last_evaluated: '1 hr ago',
    vertical_tags: ['saas'],
    bound_signal: 'onboarding-stalled',
    tree: {
      output_node: 'n_outcome',
      nodes: {
        n_trigger: { type: 'trigger.signal', config: { signal_id: 'onboarding-stalled' } },
        n_usage: { type: 'api.crm.read', config: { object: 'account', fields: 'product_usage_summary,feature_adoption' } },
        n_email: { type: 'agent.email_draft', config: { tone: 'helpful', cadence: '1-touch' } },
        n_approve: { type: 'checkpoint.approval', config: { assignee_role: 'CSM', sla_hours: 24 } },
        n_task: { type: 'api.crm.create_task', config: { type: 'follow-up call', due_in_hours: 48 } },
        n_outcome: { type: 'output.outcome', config: { capture: 'replied, engaged, no_response_14d' } },
      },
      edges: [
        ['n_trigger', 'n_usage'],
        ['n_usage', 'n_email'],
        ['n_email', 'n_approve'],
        ['n_approve', 'n_task'],
        ['n_task', 'n_outcome'],
      ],
    },
    versions: [
      { version: 1, published_at: 'April 18, 11:08 AM', published_by: 'Priya', summary: 'Initial — bound to Onboarding Stalled signal v3.' },
    ],
  },
  {
    id: 'renewal-defense-play',
    name: 'Renewal Defense',
    description:
      'Triggered by Renewal Risk signal. Generates renewal brief, branches by ARR tier (>$100k → CSM-owned + exec brief; else AM-owned), drafts touch, waits 7 days, Slack notify if no engagement.',
    status: 'active',
    audience_roles: ['AM', 'CSM'],
    offering_id: 'all',
    created_by: 'Priya',
    created_by_role: 'RevOps',
    current_version: 2,
    runs_this_week: 5,
    success_rate_pct: 58,
    last_evaluated: '3 hr ago',
    vertical_tags: ['saas', 'general'],
    bound_signal: 'renewal-risk',
    tree: {
      output_node: 'n_outcome',
      nodes: {
        n_trigger: { type: 'trigger.signal', config: { signal_id: 'renewal-risk' } },
        n_brief: { type: 'agent.renewal_readiness', config: { include: 'usage,nps,exec_engagement' } },
        n_branch: { type: 'logic.branch', config: { on: 'account.arr', op: '>', value: '$100k' } },
        n_email_high: { type: 'agent.email_draft', config: { tone: 'executive', cadence: '1-touch' } },
        n_email_low: { type: 'agent.email_draft', config: { tone: 'consultative', cadence: '2-touch' } },
        n_wait: { type: 'wait.duration', config: { days: 7 } },
        n_slack: { type: 'api.slack.notify', config: { channel: '#renewal-watch' } },
        n_outcome: { type: 'output.outcome', config: { capture: 'saved, expanded, churned' } },
      },
      edges: [
        ['n_trigger', 'n_brief'],
        ['n_brief', 'n_branch'],
        ['n_branch', 'n_email_high'],
        ['n_branch', 'n_email_low'],
        ['n_email_high', 'n_wait'],
        ['n_email_low', 'n_wait'],
        ['n_wait', 'n_slack'],
        ['n_slack', 'n_outcome'],
      ],
    },
    versions: [
      { version: 1, published_at: 'February 10, 9:30 AM', published_by: 'Priya', summary: 'Initial — single email path.' },
      { version: 2, published_at: 'April 1, 4:15 PM', published_by: 'Priya', summary: 'Added ARR-tier branch + Slack escalation.' },
    ],
  },
  {
    id: 'inbound-qual-workflow',
    name: 'Inbound Lead Qualification',
    description:
      'Auto-scores inbound leads, fast-lanes to AE if score ≥80, otherwise standard SDR queue. Writes back enriched fields to CRM. Deterministic-heavy: cheap and fast.',
    status: 'draft',
    audience_roles: ['AE'],
    offering_id: 'all',
    created_by: 'Marcus',
    created_by_role: 'MOps',
    current_version: 0,
    runs_this_week: 0,
    success_rate_pct: null,
    last_evaluated: null,
    vertical_tags: ['saas', 'fintech'],
    bound_signal: null,
    tree: {
      output_node: 'n_outcome',
      nodes: {
        n_trigger: { type: 'trigger.scheduled', config: { interval: 'on form submission' } },
        n_crm: { type: 'api.crm.read', config: { object: 'lead', fields: 'company,title,country' } },
        n_install: { type: 'api.hg.install', config: { entity: 'category', value: 'BI' } },
        n_intent: { type: 'api.hg.intent', config: { category: 'Observability' } },
        n_score: { type: 'api.custom.webhook', config: { endpoint: 'fit-score-v2', returns: 'score 0-100' } },
        n_branch: { type: 'logic.branch', config: { on: 'fit_score', op: '>=', value: '80' } },
        n_route_fast: { type: 'api.crm.write', config: { field: 'lead_owner', value: 'next_AE_in_queue' } },
        n_route_std: { type: 'api.crm.write', config: { field: 'lead_owner', value: 'SDR_queue' } },
        n_outcome: { type: 'output.outcome', config: { capture: 'AE_accepted, SDR_qualified, disqualified' } },
      },
      edges: [
        ['n_trigger', 'n_crm'],
        ['n_crm', 'n_install'],
        ['n_install', 'n_intent'],
        ['n_intent', 'n_score'],
        ['n_score', 'n_branch'],
        ['n_branch', 'n_route_fast'],
        ['n_branch', 'n_route_std'],
        ['n_route_fast', 'n_outcome'],
        ['n_route_std', 'n_outcome'],
      ],
    },
    versions: [],
  },
  {
    id: 'persona-discovery-probe',
    name: 'Persona Discovery Probe',
    description:
      'Manual play. Finds key personas missing from CRM at a target account, loops per discovered contact to create the CRM record and draft a personalized LinkedIn connect message.',
    status: 'active',
    audience_roles: ['AE', 'AM'],
    offering_id: 'all',
    created_by: 'Priya',
    created_by_role: 'RevOps',
    current_version: 1,
    runs_this_week: 11,
    success_rate_pct: 41,
    last_evaluated: '6 hr ago',
    vertical_tags: ['general'],
    bound_signal: null,
    tree: {
      output_node: 'n_outcome',
      nodes: {
        n_trigger: { type: 'trigger.manual', config: { invocation: 'thread' } },
        n_personas: { type: 'agent.persona_discovery', config: { titles: 'VP,SVP,C-Level', seniority: 'Director+' } },
        n_loop: { type: 'logic.loop', config: { over: 'discovered_contacts' } },
        n_create: { type: 'api.crm.create_task', config: { type: 'enrich + add', due_in_hours: 24 } },
        n_li_draft: { type: 'agent.email_draft', config: { channel: 'linkedin', tone: 'connect' } },
        n_outcome: { type: 'output.outcome', config: { capture: 'connected, accepted, no_response' } },
      },
      edges: [
        ['n_trigger', 'n_personas'],
        ['n_personas', 'n_loop'],
        ['n_loop', 'n_create'],
        ['n_loop', 'n_li_draft'],
        ['n_create', 'n_outcome'],
        ['n_li_draft', 'n_outcome'],
      ],
    },
    versions: [
      { version: 1, published_at: 'April 14, 10:45 AM', published_by: 'Priya', summary: 'Initial — loop creates one record + draft per contact.' },
    ],
  },
  {
    id: 'cnapp-displacement-brief',
    name: 'CNAPP Displacement Brief',
    description:
      'Account brief tailored for CNAPP competitive displacement — pulls competitor install age, current CNAPP RFP signal, drafts a positioning email referencing Palo Alto/Lacework/Orca incumbent pain.',
    status: 'active',
    audience_roles: ['AE'],
    offering_id: 'cnapp',
    created_by: 'Priya',
    created_by_role: 'RevOps',
    current_version: 1,
    runs_this_week: 9,
    success_rate_pct: 41,
    last_evaluated: '20 min ago',
    vertical_tags: ['saas', 'fintech'],
    bound_signal: null,
    tree: {
      output_node: 'n_outcome',
      nodes: {
        n_trigger: { type: 'trigger.manual', config: { invocation: 'thread' } },
        n_install: { type: 'api.hg.install', config: { entity: 'category', value: 'Cloud Security' } },
        n_battlecard: { type: 'agent.competitive_battlecard', config: { competitor: 'Palo Alto Prisma Cloud' } },
        n_email: { type: 'agent.email_draft', config: { tone: 'consultative', cadence: '2-touch', channel: 'email' } },
        n_outcome: { type: 'output.outcome', config: { capture: 'replied, meeting_booked, no_response_14d' } },
      },
      edges: [
        ['n_trigger', 'n_install'],
        ['n_install', 'n_battlecard'],
        ['n_battlecard', 'n_email'],
        ['n_email', 'n_outcome'],
      ],
    },
    versions: [
      { version: 1, published_at: 'April 28, 10:00 AM', published_by: 'Priya', summary: 'Initial — CNAPP-specific displacement brief.' },
    ],
  },
  {
    id: 'ciem-audit-probe',
    name: 'CIEM Audit Probe',
    description:
      'Targets accounts with IAM-audit intent. Pulls current identity stack (Okta/Azure AD), drafts an audit-readiness conversation starter focused on entitlement sprawl.',
    status: 'active',
    audience_roles: ['AE', 'AM'],
    offering_id: 'ciem',
    created_by: 'Priya',
    created_by_role: 'RevOps',
    current_version: 1,
    runs_this_week: 6,
    success_rate_pct: 38,
    last_evaluated: '1 hr ago',
    vertical_tags: ['fintech', 'saas'],
    bound_signal: null,
    tree: {
      output_node: 'n_outcome',
      nodes: {
        n_trigger: { type: 'trigger.manual', config: { invocation: 'thread' } },
        n_install: { type: 'api.hg.install', config: { entity: 'category', value: 'Identity Provider' } },
        n_personas: { type: 'agent.persona_discovery', config: { titles: 'VP Identity,IAM Lead,Security Architect', seniority: 'Director+' } },
        n_email: { type: 'agent.email_draft', config: { tone: 'consultative', cadence: '1-touch', channel: 'email' } },
        n_outcome: { type: 'output.outcome', config: { capture: 'replied, meeting_booked, no_response_14d' } },
      },
      edges: [
        ['n_trigger', 'n_install'],
        ['n_install', 'n_personas'],
        ['n_personas', 'n_email'],
        ['n_email', 'n_outcome'],
      ],
    },
    versions: [
      { version: 1, published_at: 'May 5, 2:00 PM', published_by: 'Priya', summary: 'Initial — identity-stack-aware probe.' },
    ],
  },
  {
    id: 'dspm-rfp-response',
    name: 'DSPM RFP Response Builder',
    description:
      'Triggered when DSPM intent signal fires on a data-platform-heavy account. Pulls data warehouse signals, generates a positioning brief tailored to their stack.',
    status: 'active',
    audience_roles: ['AE'],
    offering_id: 'dspm',
    created_by: 'Priya',
    created_by_role: 'RevOps',
    current_version: 1,
    runs_this_week: 4,
    success_rate_pct: 52,
    last_evaluated: '3 hr ago',
    vertical_tags: ['fintech', 'saas'],
    bound_signal: null,
    tree: {
      output_node: 'n_outcome',
      nodes: {
        n_trigger: { type: 'trigger.manual', config: { invocation: 'thread' } },
        n_install: { type: 'api.hg.install', config: { entity: 'category', value: 'Data Warehouse' } },
        n_research: { type: 'agent.account_research', config: { scope: 'web+sec' } },
        n_value: { type: 'agent.value_hypothesis', config: { focus: 'DSPM-RFP positioning' } },
        n_outcome: { type: 'output.notify', config: { channel: 'thread', format: 'brief' } },
      },
      edges: [
        ['n_trigger', 'n_install'],
        ['n_install', 'n_research'],
        ['n_research', 'n_value'],
        ['n_value', 'n_outcome'],
      ],
    },
    versions: [
      { version: 1, published_at: 'May 9, 11:30 AM', published_by: 'Priya', summary: 'Initial — DSPM positioning generator.' },
    ],
  },
];

// ----- Selectors -----

export function listWorkflows() {
  return WORKFLOWS;
}

export function getWorkflow(id) {
  return WORKFLOWS.find((w) => w.id === id) || null;
}

export function listWorkflowsByStatus(status) {
  return WORKFLOWS.filter((w) => w.status === status);
}

// Workflows triggered by a specific signal (used on signal detail page).
export function workflowsBoundToSignal(signalId) {
  return WORKFLOWS.filter((w) => w.bound_signal === signalId);
}

// Workflows relevant to a specific offering. Workflows tagged 'all' surface for every lens.
export function workflowsForOffering(offeringId) {
  if (!offeringId || offeringId === 'all') return WORKFLOWS;
  return WORKFLOWS.filter((w) => w.offering_id === offeringId || w.offering_id === 'all');
}

// Quick breakdown — used for the library card and cost summary.
export function workflowSummary(workflow) {
  if (!workflow?.tree?.nodes) {
    return { total: 0, agentic: 0, deterministic: 0, control: 0, hasTrigger: false, hasTerminal: false, estTokens: 0 };
  }
  let agentic = 0, deterministic = 0, control = 0, estTokens = 0;
  let hasTrigger = false, hasTerminal = false;
  for (const [id, node] of Object.entries(workflow.tree.nodes)) {
    const meta = WORKFLOW_NODE_TYPES[node.type];
    if (!meta) continue;
    if (meta.mode === 'agentic') {
      agentic += 1;
      estTokens += meta.estCostTokens || 0;
    } else if (meta.mode === 'deterministic') {
      deterministic += 1;
    } else {
      control += 1;
    }
    if (meta.isTrigger) hasTrigger = true;
    if (meta.isTerminal && workflow.tree.output_node === id) hasTerminal = true;
  }
  return {
    total: Object.keys(workflow.tree.nodes).length,
    agentic,
    deterministic,
    control,
    hasTrigger,
    hasTerminal,
    estTokens,
  };
}

// Trigger description for cards.
export function triggerSummary(workflow) {
  const nodes = workflow?.tree?.nodes || {};
  for (const node of Object.values(nodes)) {
    const meta = WORKFLOW_NODE_TYPES[node.type];
    if (meta?.isTrigger) {
      if (node.type === 'trigger.signal') {
        return `Signal: ${node.config?.signal_id || 'unbound'}`;
      }
      if (node.type === 'trigger.manual') return 'Manual · seller invokes';
      if (node.type === 'trigger.scheduled') return `Scheduled · ${node.config?.interval || 'cron'}`;
    }
  }
  return 'No trigger';
}
