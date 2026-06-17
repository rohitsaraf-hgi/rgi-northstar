// HG-curated starter workflow templates per vertical.

const SAAS_PQL_ACTIVATION = {
  id: 'wf-tpl-saas-pql',
  vertical: 'saas',
  name: 'PQL Activation Routing',
  description: 'Score every PQL on the fly, branch by score, route to AE fast lane or SDR queue with HG enrichment.',
  bound_play_hint: 'Inbound qualification → AE handoff',
  effectiveness_hint: '100% deterministic — runs at high volume with zero LLM cost',
  tree: {
    output_node: 'n_outcome',
    nodes: {
      n_trigger: { type: 'trigger.scheduled', config: { interval: 'on PQL event' } },
      n_crm: { type: 'api.crm.read', config: { object: 'lead', fields: 'company,title,plan_type' } },
      n_install: { type: 'api.hg.install', config: { entity: 'category', value: 'BI' } },
      n_score: { type: 'api.custom.webhook', config: { endpoint: 'pql-score-v3', returns: 'score 0-100' } },
      n_branch: { type: 'logic.branch', config: { on: 'pql_score', op: '>=', value: '75' } },
      n_fast: { type: 'api.crm.write', config: { field: 'lead_owner', value: 'next_AE' } },
      n_std: { type: 'api.crm.write', config: { field: 'lead_owner', value: 'SDR_queue' } },
      n_outcome: { type: 'output.outcome', config: { capture: 'AE_accepted, SDR_qualified, disqualified' } },
    },
    edges: [
      ['n_trigger', 'n_crm'],
      ['n_crm', 'n_install'],
      ['n_install', 'n_score'],
      ['n_score', 'n_branch'],
      ['n_branch', 'n_fast'],
      ['n_branch', 'n_std'],
      ['n_fast', 'n_outcome'],
      ['n_std', 'n_outcome'],
    ],
  },
  mapping_notes: ['custom.webhook endpoint — point to your scoring model'],
};

const SAAS_RENEWAL_SAVE = {
  id: 'wf-tpl-saas-renewal',
  vertical: 'saas',
  name: 'Renewal Save Play',
  description: 'When Renewal Risk fires, brief the AM, draft a save email, get approval, wait, escalate to Slack if no engagement.',
  bound_play_hint: 'Renewal risk → AM intervention',
  effectiveness_hint: '52% save rate on accounts >$50k ARR with 90d window',
  tree: {
    output_node: 'n_outcome',
    nodes: {
      n_trigger: { type: 'trigger.signal', config: { signal_id: 'renewal-risk' } },
      n_brief: { type: 'agent.renewal_readiness', config: { include: 'usage,nps,exec_engagement' } },
      n_email: { type: 'agent.email_draft', config: { tone: 'consultative', cadence: '1-touch', channel: 'email' } },
      n_approve: { type: 'checkpoint.approval', config: { assignee_role: 'AM', sla_hours: 24 } },
      n_wait: { type: 'wait.duration', config: { days: 7 } },
      n_slack: { type: 'api.slack.notify', config: { channel: '#renewal-watch' } },
      n_outcome: { type: 'output.outcome', config: { capture: 'saved, expanded, churned' } },
    },
    edges: [
      ['n_trigger', 'n_brief'],
      ['n_brief', 'n_email'],
      ['n_email', 'n_approve'],
      ['n_approve', 'n_wait'],
      ['n_wait', 'n_slack'],
      ['n_slack', 'n_outcome'],
    ],
  },
  mapping_notes: [],
};

const FINTECH_COMPLIANCE_BRIEF = {
  id: 'wf-tpl-fintech-compliance',
  vertical: 'fintech',
  name: 'Compliance Brief & Escalation',
  description: 'When Compliance Risk Tier fires, build compliance brief, route through legal review, notify deal team.',
  bound_play_hint: 'Compliance → Legal + AE escalation',
  effectiveness_hint: '2.1× faster cycle through legal review when flagged early',
  tree: {
    output_node: 'n_notify',
    nodes: {
      n_trigger: { type: 'trigger.signal', config: { signal_id: 'compliance-risk' } },
      n_crm: { type: 'api.crm.read', config: { object: 'opportunity', fields: 'stage,owner,compliance_review_status' } },
      n_research: { type: 'agent.account_research', config: { scope: 'web+sec' } },
      n_review: { type: 'checkpoint.review', config: { audience: 'Legal team', sla_hours: 48 } },
      n_notify: { type: 'output.notify', config: { channel: 'slack', format: 'brief' } },
    },
    edges: [
      ['n_trigger', 'n_crm'],
      ['n_crm', 'n_research'],
      ['n_research', 'n_review'],
      ['n_review', 'n_notify'],
    ],
  },
  mapping_notes: ['opportunity.compliance_review_status — your custom CRM field for tracking review state'],
};

const FINTECH_HIGH_VALUE = {
  id: 'wf-tpl-fintech-high-value',
  vertical: 'fintech',
  name: 'High-Value Inbound Fast-Lane',
  description: 'High-Value FinServ Inbound signal → AE fast-lane assignment + immediate Slack page + outreach prep.',
  bound_play_hint: 'High-value lead → AE fast-track',
  effectiveness_hint: '3.8× pipeline-create rate vs standard inbound routing',
  tree: {
    output_node: 'n_outcome',
    nodes: {
      n_trigger: { type: 'trigger.signal', config: { signal_id: 'high-value-finserv-inbound' } },
      n_crm: { type: 'api.crm.read', config: { object: 'lead', fields: 'company,arr_estimate,industry' } },
      n_assign: { type: 'api.crm.write', config: { field: 'lead_owner', value: 'finserv_AE_pool' } },
      n_slack: { type: 'api.slack.notify', config: { channel: '@finserv_AE_pool', message: 'High-value lead: {{lead.company}}' } },
      n_email: { type: 'agent.email_draft', config: { tone: 'executive', cadence: '1-touch', channel: 'email' } },
      n_outcome: { type: 'output.outcome', config: { capture: 'AE_accepted, meeting_booked, no_response_7d' } },
    },
    edges: [
      ['n_trigger', 'n_crm'],
      ['n_crm', 'n_assign'],
      ['n_assign', 'n_slack'],
      ['n_slack', 'n_email'],
      ['n_email', 'n_outcome'],
    ],
  },
  mapping_notes: [],
};

const MFG_CAPEX_OUTREACH = {
  id: 'wf-tpl-mfg-capex',
  vertical: 'manufacturing',
  name: 'Capex Window Outreach',
  description: 'Capex Window signal → persona discovery → exec brief + ROI email → AE approval → Outreach sequence enroll.',
  bound_play_hint: 'Capex window → exec outreach',
  effectiveness_hint: '22% meeting-book rate when fired within 60 days of funding event',
  tree: {
    output_node: 'n_outcome',
    nodes: {
      n_trigger: { type: 'trigger.signal', config: { signal_id: 'capex-window-open' } },
      n_personas: { type: 'agent.persona_discovery', config: { titles: 'VP IT,CTO,CIO', seniority: 'VP+' } },
      n_value: { type: 'agent.value_hypothesis', config: { focus: 'ROI on modernization' } },
      n_email: { type: 'agent.email_draft', config: { tone: 'executive', cadence: '2-touch', channel: 'email' } },
      n_approve: { type: 'checkpoint.approval', config: { assignee_role: 'AE', sla_hours: 24 } },
      n_enroll: { type: 'api.outreach.enroll', config: { sequence: 'Capex Modernization' } },
      n_outcome: { type: 'output.outcome', config: { capture: 'replied, meeting_booked, no_response_14d' } },
    },
    edges: [
      ['n_trigger', 'n_personas'],
      ['n_personas', 'n_value'],
      ['n_value', 'n_email'],
      ['n_email', 'n_approve'],
      ['n_approve', 'n_enroll'],
      ['n_enroll', 'n_outcome'],
    ],
  },
  mapping_notes: [],
};

const MFG_MODERNIZATION_BRIEF = {
  id: 'wf-tpl-mfg-modernization',
  vertical: 'manufacturing',
  name: 'Plant Modernization Brief',
  description: 'Manual play. Generates a modernization-readiness brief from HG IoT + Cloud spend + tech-stack analysis.',
  bound_play_hint: 'Manual brief → solutions engineer prep',
  effectiveness_hint: '1.9× larger average deal size when SE is engaged with this brief',
  tree: {
    output_node: 'n_notify',
    nodes: {
      n_trigger: { type: 'trigger.manual', config: { invocation: 'account header CTA' } },
      n_iot: { type: 'api.hg.install', config: { entity: 'category', value: 'IoT' } },
      n_cloud: { type: 'api.hg.spend', config: { category: 'Cloud' } },
      n_research: { type: 'agent.account_research', config: { scope: 'web+sec' } },
      n_value: { type: 'agent.value_hypothesis', config: { focus: 'Manufacturing 4.0' } },
      n_notify: { type: 'output.notify', config: { channel: 'thread', format: 'brief' } },
    },
    edges: [
      ['n_trigger', 'n_iot'],
      ['n_trigger', 'n_cloud'],
      ['n_iot', 'n_research'],
      ['n_cloud', 'n_research'],
      ['n_research', 'n_value'],
      ['n_value', 'n_notify'],
    ],
  },
  mapping_notes: [],
};

export const WORKFLOW_VERTICALS = [
  { id: 'saas', label: 'SaaS', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500/10' },
  { id: 'fintech', label: 'Fintech', color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-500/10' },
  { id: 'manufacturing', label: 'Manufacturing', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10' },
];

export const WORKFLOW_TEMPLATES = [
  SAAS_PQL_ACTIVATION,
  SAAS_RENEWAL_SAVE,
  FINTECH_COMPLIANCE_BRIEF,
  FINTECH_HIGH_VALUE,
  MFG_CAPEX_OUTREACH,
  MFG_MODERNIZATION_BRIEF,
];

export function listWorkflowTemplates() {
  return WORKFLOW_TEMPLATES;
}

export function getWorkflowTemplate(id) {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id) || null;
}
