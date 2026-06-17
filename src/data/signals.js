// Tenant-specific signals — Layer 2 of the 4-layer architecture.
//   DATA → SIGNAL → PLAY → SELLER
//
// A signal is a named, typed, per-account value computed from a DAG of:
//   sources (HG / CRM / Event)
//   windows (time-bound filters)
//   computes (math, aggregation)
//   rules (boolean logic, comparisons)
//   thresholds (terminal — casts to boolean | tier | score)
//
// Signals are versioned. Editing a published signal creates a draft v_n+1;
// publishing makes v_n+1 active, plays bound to the signal auto-migrate,
// in-flight play executions complete on the snapshot they started with.

export const SOURCE_FAMILIES = {
  hg: {
    id: 'hg',
    label: 'HG',
    desc: 'HG technographic data — install age, IT spend, intent, tech-stack churn',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  crm: {
    id: 'crm',
    label: 'CRM',
    desc: 'Tenant CRM objects — accounts, contacts, opportunities, activities',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
  },
  event: {
    id: 'event',
    label: 'Event',
    desc: 'Event streams — Marketo, Outreach, Gong, Segment, Amplitude, product telemetry',
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
  },
};

export const OUTPUT_TYPES = {
  boolean: {
    id: 'boolean',
    label: 'Boolean',
    desc: "Fires or doesn't — true/false per account",
  },
  tier: {
    id: 'tier',
    label: 'Tier',
    desc: 'Bucketed bands — A / B / C / Out',
  },
  score: {
    id: 'score',
    label: 'Score',
    desc: 'Continuous 0-100 ranking',
  },
};

export const SIGNAL_STATUSES = {
  draft: {
    id: 'draft',
    label: 'Draft',
    dot: 'bg-text-muted',
    color: 'text-text-secondary',
    bg: 'bg-surface-2',
  },
  active: {
    id: 'active',
    label: 'Active',
    dot: 'bg-emerald-500',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10',
  },
  disabled: {
    id: 'disabled',
    label: 'Disabled',
    dot: 'bg-amber-500',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10',
  },
  deprecated: {
    id: 'deprecated',
    label: 'Deprecated',
    dot: 'bg-text-muted',
    color: 'text-text-muted',
    bg: 'bg-surface-2',
  },
};

export const REFRESH_POLICIES = {
  event_triggered: 'Event-triggered + nightly rollup',
  nightly: 'Nightly rollup only',
  on_demand: 'On-demand only',
};

// Node taxonomy — every node has type, inputs, outputs, config schema.
export const NODE_TYPES = {
  'source.hg': {
    label: 'HG Source',
    family: 'source',
    sourceFamily: 'hg',
    output: 'snapshot|time-series',
    icon: 'Database',
    examples: ['install_age(Splunk)', 'spend_delta(AWS, YoY)', 'intent_score(BI)', 'tech_churn'],
  },
  'source.crm': {
    label: 'CRM Source',
    family: 'source',
    sourceFamily: 'crm',
    output: 'scalar|list',
    icon: 'Database',
    examples: ['account.arr', 'opportunity.stage', 'opportunity.closed_won_date', 'contact.title'],
  },
  'source.event': {
    label: 'Event Source',
    family: 'source',
    sourceFamily: 'event',
    output: 'event-stream',
    icon: 'Database',
    examples: ['marketo.email_response', 'outreach.reply', 'product.login', 'gong.call'],
  },
  'window.relative': {
    label: 'Time Window',
    family: 'window',
    output: 'time-series',
    icon: 'Clock',
    examples: ['last 21 days', 'since renewal - 90d', 'rolling 7d'],
  },
  'compute.aggregate': {
    label: 'Aggregate',
    family: 'compute',
    output: 'scalar',
    icon: 'Sigma',
    examples: ['count', 'sum', 'avg', 'min', 'max', 'percentile'],
  },
  'compute.delta': {
    label: 'Delta',
    family: 'compute',
    output: 'scalar',
    icon: 'TrendingUp',
    examples: ['YoY', 'MoM', 'stale_for'],
  },
  'compute.ratio': {
    label: 'Ratio',
    family: 'compute',
    output: 'scalar',
    icon: 'Divide',
    examples: ['engagement rate', 'spend ratio'],
  },
  'rule.compare': {
    label: 'Compare',
    family: 'rule',
    output: 'boolean',
    icon: 'GitCompare',
    examples: ['> $25k', '= null', 'in list', 'between'],
  },
  'rule.logic': {
    label: 'Logic',
    family: 'rule',
    output: 'boolean',
    icon: 'Filter',
    examples: ['AND', 'OR', 'NOT'],
  },
  'threshold.boolean': {
    label: 'Boolean Output',
    family: 'threshold',
    output: 'boolean',
    isTerminal: true,
    icon: 'CircleDot',
  },
  'threshold.tier': {
    label: 'Tier Output',
    family: 'threshold',
    output: 'tier',
    isTerminal: true,
    icon: 'BarChart3',
  },
  'threshold.score': {
    label: 'Score Output',
    family: 'threshold',
    output: 'score',
    isTerminal: true,
    icon: 'Gauge',
  },
};

// Seed signals — variety of sources, output types, statuses, authors.
// Each tree is a DAG: nodes keyed by id, edges as [from, to] pairs.
export const SIGNALS = [
  {
    id: 'onboarding-stalled',
    name: 'Onboarding Stalled',
    description: 'New customers (closed-won in last 90 days) not engaging in product or last Marketo campaign.',
    output_type: 'boolean',
    status: 'active',
    audience_roles: ['AM', 'CSM'],
    relevant_offerings: ['all'],
    created_by: 'Priya',
    created_by_role: 'RevOps',
    current_version: 3,
    accounts_firing_today: 23,
    total_accounts: 1247,
    last_evaluated: '2 min ago',
    refresh_policy: 'event_triggered',
    vertical_tags: ['saas', 'general'],
    bound_plays: ['onboarding-rescue-flow'],
    tree: {
      output_node: 'n_out',
      nodes: {
        n_closed_won: { type: 'source.crm', config: { object: 'opportunity', field: 'closed_won_date' } },
        n_recent_close: { type: 'window.relative', config: { window: 'last 90 days' } },
        n_login: { type: 'source.event', config: { source: 'product', event: 'login' } },
        n_no_login: { type: 'window.relative', config: { window: 'no event in last 21 days' } },
        n_mkto: { type: 'source.event', config: { source: 'marketo', event: 'email_response' } },
        n_no_response: { type: 'rule.compare', config: { op: 'is_null', value: '' } },
        n_arr: { type: 'source.crm', config: { object: 'account', field: 'arr' } },
        n_arr_gate: { type: 'rule.compare', config: { op: '>', value: '$25k' } },
        n_and: { type: 'rule.logic', config: { op: 'AND' } },
        n_out: { type: 'threshold.boolean', config: { name: 'Onboarding Stalled' } },
      },
      edges: [
        ['n_closed_won', 'n_recent_close'],
        ['n_recent_close', 'n_and'],
        ['n_login', 'n_no_login'],
        ['n_no_login', 'n_and'],
        ['n_mkto', 'n_no_response'],
        ['n_no_response', 'n_and'],
        ['n_arr', 'n_arr_gate'],
        ['n_arr_gate', 'n_and'],
        ['n_and', 'n_out'],
      ],
    },
    versions: [
      { version: 1, published_at: 'March 27, 11:14 AM', published_by: 'Priya', summary: 'Initial — 14-day no-login window, no ARR filter.' },
      { version: 2, published_at: 'April 5, 3:42 PM', published_by: 'Priya', summary: 'Widened no-login window to 21 days based on early findings.' },
      { version: 3, published_at: 'April 18, 9:08 AM', published_by: 'Priya', summary: 'Added ARR > $25k filter to scope to material accounts.' },
    ],
  },
  {
    id: 'splunk-aging-displacement',
    name: 'Splunk Aging Displacement',
    description: 'Splunk installs >36 months old combined with declining IT spend — primary displacement window.',
    output_type: 'boolean',
    status: 'active',
    audience_roles: ['AE'],
    relevant_offerings: ['cnapp', 'workload'],
    created_by: 'Priya',
    created_by_role: 'RevOps',
    current_version: 1,
    accounts_firing_today: 47,
    total_accounts: 1247,
    last_evaluated: '14 min ago',
    refresh_policy: 'event_triggered',
    vertical_tags: ['saas', 'enterprise'],
    bound_plays: ['displacement-flow', 'competitive-takeout-flow'],
    tree: {
      output_node: 'n_out',
      nodes: {
        n_install: { type: 'source.hg', config: { entity: 'product', value: 'Splunk', field: 'install_age' } },
        n_install_gate: { type: 'rule.compare', config: { op: '>', value: '36 months' } },
        n_spend: { type: 'source.hg', config: { entity: 'category', value: 'IT', field: 'spend_yoy' } },
        n_spend_gate: { type: 'rule.compare', config: { op: '<', value: '0%' } },
        n_and: { type: 'rule.logic', config: { op: 'AND' } },
        n_out: { type: 'threshold.boolean', config: { name: 'Splunk Aging Displacement' } },
      },
      edges: [
        ['n_install', 'n_install_gate'],
        ['n_install_gate', 'n_and'],
        ['n_spend', 'n_spend_gate'],
        ['n_spend_gate', 'n_and'],
        ['n_and', 'n_out'],
      ],
    },
    versions: [
      { version: 1, published_at: 'April 2, 10:00 AM', published_by: 'Priya', summary: 'Initial — 36mo threshold, declining IT spend gate.' },
    ],
  },
  {
    id: 'expansion-ready',
    name: 'Expansion Ready',
    description: 'Existing customers with growing AWS spend, expanded tech stack, and a champion still in seat — primed for upsell.',
    output_type: 'tier',
    status: 'active',
    audience_roles: ['AM'],
    relevant_offerings: ['ciem', 'dspm', 'workload'],
    created_by: 'Marcus',
    created_by_role: 'MOps',
    current_version: 2,
    accounts_firing_today: 89,
    total_accounts: 1247,
    last_evaluated: '47 min ago',
    refresh_policy: 'event_triggered',
    vertical_tags: ['saas', 'general'],
    bound_plays: ['expansion-probe-flow'],
    tree: {
      output_node: 'n_out',
      nodes: {
        n_spend: { type: 'source.hg', config: { entity: 'category', value: 'Cloud', field: 'spend_yoy' } },
        n_spend_score: { type: 'compute.delta', config: { op: 'YoY %' } },
        n_stack: { type: 'source.hg', config: { entity: 'category', value: 'BI', field: 'install_count' } },
        n_stack_delta: { type: 'compute.delta', config: { op: 'YoY %' } },
        n_champ: { type: 'source.crm', config: { object: 'contact', field: 'is_champion' } },
        n_logic: { type: 'rule.logic', config: { op: 'AND' } },
        n_out: { type: 'threshold.tier', config: { bands: 'A:>20% / B:10-20% / C:0-10% / Out:<0%' } },
      },
      edges: [
        ['n_spend', 'n_spend_score'],
        ['n_spend_score', 'n_logic'],
        ['n_stack', 'n_stack_delta'],
        ['n_stack_delta', 'n_logic'],
        ['n_champ', 'n_logic'],
        ['n_logic', 'n_out'],
      ],
    },
    versions: [
      { version: 1, published_at: 'March 14, 2:30 PM', published_by: 'Marcus', summary: 'Initial — flat tier cutoffs.' },
      { version: 2, published_at: 'April 22, 11:08 AM', published_by: 'Marcus', summary: 'Recalibrated tier bands after closed-won analysis.' },
    ],
  },
  {
    id: 'marketo-engagement-score',
    name: 'Marketo Engagement Score',
    description: 'Continuous 0-100 score combining email opens, form fills, and content downloads over rolling 30 days.',
    output_type: 'score',
    status: 'disabled',
    relevant_offerings: ['all'],
    disabled_reason: 'Marketo source disconnected — reconnect in Integrations to resume',
    audience_roles: ['AE', 'AM'],
    created_by: 'Marcus',
    created_by_role: 'MOps',
    current_version: 4,
    accounts_firing_today: 0,
    total_accounts: 1247,
    last_evaluated: '3 days ago',
    refresh_policy: 'event_triggered',
    vertical_tags: ['saas', 'general'],
    bound_plays: [],
    tree: {
      output_node: 'n_out',
      nodes: {
        n_open: { type: 'source.event', config: { source: 'marketo', event: 'email_opened' } },
        n_open_count: { type: 'compute.aggregate', config: { op: 'count', window: 'last 30d' } },
        n_form: { type: 'source.event', config: { source: 'marketo', event: 'form_submitted' } },
        n_form_count: { type: 'compute.aggregate', config: { op: 'count', window: 'last 30d' } },
        n_content: { type: 'source.event', config: { source: 'marketo', event: 'content_downloaded' } },
        n_content_count: { type: 'compute.aggregate', config: { op: 'count', window: 'last 30d' } },
        n_weighted: { type: 'compute.aggregate', config: { op: 'weighted_sum', window: '1x opens + 5x forms + 3x content' } },
        n_out: { type: 'threshold.score', config: { scale: '0-100, capped at percentile-95' } },
      },
      edges: [
        ['n_open', 'n_open_count'],
        ['n_form', 'n_form_count'],
        ['n_content', 'n_content_count'],
        ['n_open_count', 'n_weighted'],
        ['n_form_count', 'n_weighted'],
        ['n_content_count', 'n_weighted'],
        ['n_weighted', 'n_out'],
      ],
    },
    versions: [
      { version: 1, published_at: 'February 8', published_by: 'Marcus', summary: 'Initial — equal weights.' },
      { version: 2, published_at: 'February 22', published_by: 'Marcus', summary: 'Form weight raised to 4x.' },
      { version: 3, published_at: 'March 10', published_by: 'Marcus', summary: 'Added content download weight.' },
      { version: 4, published_at: 'April 1', published_by: 'Marcus', summary: 'Final weights and percentile-95 cap.' },
    ],
  },
  {
    id: 'renewal-risk',
    name: 'Renewal Risk (90d window)',
    description: 'Accounts within 90 days of renewal with declining product usage AND no executive sponsor meeting in 60 days.',
    output_type: 'boolean',
    status: 'draft',
    audience_roles: ['AM'],
    relevant_offerings: ['all'],
    created_by: 'Priya',
    created_by_role: 'RevOps',
    current_version: 0,
    accounts_firing_today: null,
    total_accounts: 1247,
    last_evaluated: null,
    refresh_policy: 'event_triggered',
    vertical_tags: ['saas'],
    bound_plays: [],
    tree: {
      output_node: 'n_out',
      nodes: {
        n_renew: { type: 'source.crm', config: { object: 'account', field: 'renewal_date' } },
        n_renew_window: { type: 'window.relative', config: { window: 'within 90 days' } },
        n_usage: { type: 'source.event', config: { source: 'product', event: 'feature_usage' } },
        n_usage_delta: { type: 'compute.delta', config: { op: 'last 30d vs prior 30d' } },
        n_meeting: { type: 'source.event', config: { source: 'gong', event: 'exec_meeting' } },
        n_no_meeting: { type: 'compute.delta', config: { op: 'stale_for' } },
        n_and: { type: 'rule.logic', config: { op: 'AND' } },
        n_out: { type: 'threshold.boolean', config: { name: 'Renewal Risk' } },
      },
      edges: [
        ['n_renew', 'n_renew_window'],
        ['n_renew_window', 'n_and'],
        ['n_usage', 'n_usage_delta'],
        ['n_usage_delta', 'n_and'],
        ['n_meeting', 'n_no_meeting'],
        ['n_no_meeting', 'n_and'],
        ['n_and', 'n_out'],
      ],
    },
    versions: [],
  },
];

// Selectors

export function listSignals() {
  return SIGNALS;
}

export function getSignal(id) {
  return SIGNALS.find((s) => s.id === id) || null;
}

export function listActiveSignals() {
  return SIGNALS.filter((s) => s.status === 'active');
}

export function listSignalsByStatus(status) {
  return SIGNALS.filter((s) => s.status === status);
}

// Source families present in a signal's tree — used for the library card.
export function sourcesInSignal(signal) {
  if (!signal?.tree?.nodes) return [];
  const families = new Set();
  for (const node of Object.values(signal.tree.nodes)) {
    if (node.type?.startsWith('source.')) {
      const fam = node.type.split('.')[1];
      if (SOURCE_FAMILIES[fam]) families.add(fam);
    }
  }
  return Array.from(families);
}

// Coarse node-count breakdown for the detail summary line.
export function nodeBreakdown(signal) {
  if (!signal?.tree?.nodes) return { total: 0, source: 0, window: 0, compute: 0, rule: 0, threshold: 0 };
  const counts = { total: 0, source: 0, window: 0, compute: 0, rule: 0, threshold: 0 };
  for (const node of Object.values(signal.tree.nodes)) {
    counts.total += 1;
    const type = NODE_TYPES[node.type];
    if (type && counts[type.family] != null) counts[type.family] += 1;
  }
  return counts;
}
