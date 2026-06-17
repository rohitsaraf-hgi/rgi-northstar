// HG-curated starter signal templates per vertical.
//
// Each template is a complete signal definition that a tenant can fork into
// a new draft. Source-node configs that depend on tenant-specific field
// mappings use the `<MAP>` placeholder; the fork flow surfaces these in the
// builder so the admin knows what to fill in.

const SAAS_PQL = {
  id: 'tpl-saas-pql',
  vertical: 'saas',
  name: 'PQL: Power User Conversion',
  description: 'Product-qualified leads in self-serve tier with high feature adoption + demo intent.',
  output_type: 'boolean',
  bound_play_hint: 'Inbound qualification → AE assignment',
  effectiveness_hint: 'Median 18-25% conversion to AE-accepted on this pattern in SaaS',
  tree: {
    output_node: 'n_out',
    nodes: {
      n_signup: { type: 'source.crm', config: { object: 'contact', field: 'signup_tier' } },
      n_signup_gate: { type: 'rule.compare', config: { op: '=', value: 'self_serve' } },
      n_logins: { type: 'source.event', config: { source: 'product', event: 'login' } },
      n_login_count: { type: 'compute.aggregate', config: { op: 'count', window: 'last 14d' } },
      n_login_gate: { type: 'rule.compare', config: { op: '>=', value: '8' } },
      n_demo: { type: 'source.event', config: { source: 'marketo', event: 'demo_requested' } },
      n_demo_recent: { type: 'window.relative', config: { window: 'last 30 days' } },
      n_and: { type: 'rule.logic', config: { op: 'AND' } },
      n_out: { type: 'threshold.boolean', config: { name: 'PQL Conversion' } },
    },
    edges: [
      ['n_signup', 'n_signup_gate'],
      ['n_signup_gate', 'n_and'],
      ['n_logins', 'n_login_count'],
      ['n_login_count', 'n_login_gate'],
      ['n_login_gate', 'n_and'],
      ['n_demo', 'n_demo_recent'],
      ['n_demo_recent', 'n_and'],
      ['n_and', 'n_out'],
    ],
  },
  mapping_notes: [
    'contact.signup_tier — map to your tier field (e.g., plan_type, account_tier)',
    'product.login — confirm your product telemetry source (Segment / Amplitude / custom)',
  ],
};

const SAAS_HEALTH = {
  id: 'tpl-saas-health',
  vertical: 'saas',
  name: 'Customer Health Composite',
  description: 'Composite 0-100 health score combining product usage trajectory, NPS, and CSM flags.',
  output_type: 'score',
  bound_play_hint: 'Risk routing → CSM intervention queue',
  effectiveness_hint: 'Health-grounded plays show 1.7× retention lift vs. cohort baseline',
  tree: {
    output_node: 'n_out',
    nodes: {
      n_usage: { type: 'source.event', config: { source: 'product', event: 'feature_usage' } },
      n_usage_delta: { type: 'compute.delta', config: { op: 'last 30d vs prior 30d' } },
      n_nps: { type: 'source.crm', config: { object: 'account', field: 'latest_nps' } },
      n_csm_flag: { type: 'source.crm', config: { object: 'account', field: 'csm_risk_flag' } },
      n_weighted: { type: 'compute.aggregate', config: { op: 'weighted_sum', window: '3x usage + 2x nps + 5x csm_flag' } },
      n_out: { type: 'threshold.score', config: { scale: '0-100 normalized' } },
    },
    edges: [
      ['n_usage', 'n_usage_delta'],
      ['n_usage_delta', 'n_weighted'],
      ['n_nps', 'n_weighted'],
      ['n_csm_flag', 'n_weighted'],
      ['n_weighted', 'n_out'],
    ],
  },
  mapping_notes: [
    'account.latest_nps — quarterly NPS field on the account object',
    'account.csm_risk_flag — your CSM-maintained risk flag (Vitally, ChurnZero, etc.)',
  ],
};

const FINTECH_COMPLIANCE = {
  id: 'tpl-fintech-compliance',
  vertical: 'fintech',
  name: 'Compliance Risk Tier',
  description: 'Tier accounts by compliance risk: regulatory mentions in calls + audit events + deal stuck.',
  output_type: 'tier',
  bound_play_hint: 'Compliance brief → AE + Legal escalation',
  effectiveness_hint: 'Detecting at tier A → 2.1× faster cycle through legal review',
  tree: {
    output_node: 'n_out',
    nodes: {
      n_call: { type: 'source.event', config: { source: 'gong', event: 'compliance_mentioned' } },
      n_call_count: { type: 'compute.aggregate', config: { op: 'count', window: 'last 60d' } },
      n_audit: { type: 'source.event', config: { source: 'custom', event: 'audit_event_logged' } },
      n_audit_count: { type: 'compute.aggregate', config: { op: 'count', window: 'last 30d' } },
      n_stage: { type: 'source.crm', config: { object: 'opportunity', field: 'days_in_stage' } },
      n_stage_gate: { type: 'rule.compare', config: { op: '>', value: '45' } },
      n_logic: { type: 'rule.logic', config: { op: 'AND' } },
      n_out: { type: 'threshold.tier', config: { bands: 'A:>5 / B:3-5 / C:1-2 / Out:0' } },
    },
    edges: [
      ['n_call', 'n_call_count'],
      ['n_call_count', 'n_logic'],
      ['n_audit', 'n_audit_count'],
      ['n_audit_count', 'n_logic'],
      ['n_stage', 'n_stage_gate'],
      ['n_stage_gate', 'n_logic'],
      ['n_logic', 'n_out'],
    ],
  },
  mapping_notes: [
    'gong.compliance_mentioned — requires Gong tracker for compliance/regulation keywords',
    'custom.audit_event_logged — wire from your audit pipeline (Splunk, custom webhook)',
  ],
};

const FINTECH_HIGH_VALUE_INBOUND = {
  id: 'tpl-fintech-high-value',
  vertical: 'fintech',
  name: 'High-Value Inbound',
  description: 'Inbound leads from financial-services accounts with senior title, scale, and intent.',
  output_type: 'boolean',
  bound_play_hint: 'AE fast-track → priority slot in queue',
  effectiveness_hint: 'High-value flag → 3.8× pipeline-create rate vs. standard inbound',
  tree: {
    output_node: 'n_out',
    nodes: {
      n_industry: { type: 'source.crm', config: { object: 'account', field: 'industry' } },
      n_industry_gate: { type: 'rule.compare', config: { op: 'in', value: 'Banking,Insurance,FinServ' } },
      n_employees: { type: 'source.crm', config: { object: 'account', field: 'employee_count' } },
      n_emp_gate: { type: 'rule.compare', config: { op: '>', value: '1000' } },
      n_title: { type: 'source.crm', config: { object: 'contact', field: 'seniority' } },
      n_title_gate: { type: 'rule.compare', config: { op: 'in', value: 'VP,SVP,C-Level' } },
      n_intent: { type: 'source.hg', config: { entity: 'category', value: 'Risk Management', field: 'intent_score' } },
      n_intent_gate: { type: 'rule.compare', config: { op: '>=', value: '70' } },
      n_and: { type: 'rule.logic', config: { op: 'AND' } },
      n_out: { type: 'threshold.boolean', config: { name: 'High-Value FinServ Inbound' } },
    },
    edges: [
      ['n_industry', 'n_industry_gate'],
      ['n_industry_gate', 'n_and'],
      ['n_employees', 'n_emp_gate'],
      ['n_emp_gate', 'n_and'],
      ['n_title', 'n_title_gate'],
      ['n_title_gate', 'n_and'],
      ['n_intent', 'n_intent_gate'],
      ['n_intent_gate', 'n_and'],
      ['n_and', 'n_out'],
    ],
  },
  mapping_notes: [
    'account.industry — your enriched industry classification (Clearbit, ZoomInfo)',
    'contact.seniority — your seniority enrichment field',
  ],
};

const MFG_CAPEX_WINDOW = {
  id: 'tpl-mfg-capex',
  vertical: 'manufacturing',
  name: 'Capex Window Open',
  description: 'Manufacturing accounts with rising IT capex, recent funding, and aging tech stack.',
  output_type: 'boolean',
  bound_play_hint: 'Capex outreach → exec referral + ROI deck',
  effectiveness_hint: 'Capex-window plays median 22% meeting-book rate in manufacturing',
  tree: {
    output_node: 'n_out',
    nodes: {
      n_capex: { type: 'source.hg', config: { entity: 'category', value: 'IT', field: 'spend_yoy' } },
      n_capex_gate: { type: 'rule.compare', config: { op: '>', value: '12%' } },
      n_funding: { type: 'source.crm', config: { object: 'account', field: 'last_funding_days_ago' } },
      n_funding_gate: { type: 'rule.compare', config: { op: '<', value: '180' } },
      n_install_age: { type: 'source.hg', config: { entity: 'category', value: 'ERP', field: 'install_age' } },
      n_age_gate: { type: 'rule.compare', config: { op: '>', value: '60 months' } },
      n_and: { type: 'rule.logic', config: { op: 'AND' } },
      n_out: { type: 'threshold.boolean', config: { name: 'Capex Window Open' } },
    },
    edges: [
      ['n_capex', 'n_capex_gate'],
      ['n_capex_gate', 'n_and'],
      ['n_funding', 'n_funding_gate'],
      ['n_funding_gate', 'n_and'],
      ['n_install_age', 'n_age_gate'],
      ['n_age_gate', 'n_and'],
      ['n_and', 'n_out'],
    ],
  },
  mapping_notes: [
    'account.last_funding_days_ago — Crunchbase / PitchBook enrichment',
  ],
};

const MFG_PLANT_MODERNIZATION = {
  id: 'tpl-mfg-plant-modernization',
  vertical: 'manufacturing',
  name: 'Plant Modernization Signal',
  description: 'Tier accounts by modernization readiness: IoT install age + cloud spend + expansion intent.',
  output_type: 'tier',
  bound_play_hint: 'Modernization brief → Solutions engineer + ROI calculator',
  effectiveness_hint: 'Tier-A modernization plays show 1.9× larger deal sizes',
  tree: {
    output_node: 'n_out',
    nodes: {
      n_iot: { type: 'source.hg', config: { entity: 'category', value: 'IoT', field: 'install_age' } },
      n_iot_age: { type: 'compute.delta', config: { op: 'YoY %' } },
      n_cloud: { type: 'source.hg', config: { entity: 'category', value: 'Cloud', field: 'spend_yoy' } },
      n_cloud_delta: { type: 'compute.delta', config: { op: 'YoY %' } },
      n_expansion_intent: { type: 'source.hg', config: { entity: 'category', value: 'Manufacturing 4.0', field: 'intent_score' } },
      n_logic: { type: 'rule.logic', config: { op: 'AND' } },
      n_out: { type: 'threshold.tier', config: { bands: 'A:>30 / B:15-30 / C:0-15 / Out:<0' } },
    },
    edges: [
      ['n_iot', 'n_iot_age'],
      ['n_iot_age', 'n_logic'],
      ['n_cloud', 'n_cloud_delta'],
      ['n_cloud_delta', 'n_logic'],
      ['n_expansion_intent', 'n_logic'],
      ['n_logic', 'n_out'],
    ],
  },
  mapping_notes: [],
};

export const VERTICALS = [
  { id: 'saas', label: 'SaaS', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500/10' },
  { id: 'fintech', label: 'Fintech', color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-500/10' },
  { id: 'manufacturing', label: 'Manufacturing', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10' },
];

export const SIGNAL_TEMPLATES = [
  SAAS_PQL,
  SAAS_HEALTH,
  FINTECH_COMPLIANCE,
  FINTECH_HIGH_VALUE_INBOUND,
  MFG_CAPEX_WINDOW,
  MFG_PLANT_MODERNIZATION,
];

export function listTemplates() {
  return SIGNAL_TEMPLATES;
}

export function getTemplate(id) {
  return SIGNAL_TEMPLATES.find((t) => t.id === id) || null;
}

export function listTemplatesByVertical(vertical) {
  if (!vertical || vertical === 'all') return SIGNAL_TEMPLATES;
  return SIGNAL_TEMPLATES.filter((t) => t.vertical === vertical);
}
