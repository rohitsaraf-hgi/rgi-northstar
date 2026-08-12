// First-Party Signal Studio — tenant-authored CRM signals.
//
// The tenant admin (webops / Priya) defines a signal as:
//   - a set of rules over CRM attributes (Account / Opportunity / Contact / Activity)
//   - an action (Generate Brief, Draft Email, Find Committee, etc.)
//   - metadata (name, description, severity, weight)
//
// Rules are expressed against the CRM_ATTRIBUTES catalog — the platform's
// abstraction layer over the fields it pulls from CRM. Rules compose via
// AND/OR logic (simple mode for Phase 1).
//
// The NL classifier turns "open opportunities" or "no activity in 30 days"
// into rule chips. It's pattern-based for the prototype; can be swapped for
// an LLM call without changing consumers.
//
// Storage is localStorage-backed with subscribe/notify.

// ─── CRM Attribute Catalog ──────────────────────────────────────────
// The abstraction over CRM fields. Each attribute knows its type +
// which operators make sense for it.
//
// Operators — a stable set the UI can render dropdowns against:
//   is, is_not, contains, not_contains, is_empty, is_not_empty,
//   greater_than, less_than, between, in, not_in,
//   before, after, in_last_n_days, in_next_n_days, older_than_n_days

export const CRM_OBJECTS = [
  { id: 'account',     label: 'Account',     description: 'Fields on the account object' },
  { id: 'opportunity', label: 'Opportunity', description: 'Fields on open + closed opps' },
  { id: 'contact',     label: 'Contact',     description: 'Fields on people at the account' },
  { id: 'activity',    label: 'Activity',    description: 'Rolled-up engagement across contacts + opps' },
];

const OPS = {
  STRING:   ['is', 'is_not', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
  ENUM:     ['is', 'is_not', 'in', 'not_in', 'is_empty', 'is_not_empty'],
  NUMBER:   ['is', 'is_not', 'greater_than', 'less_than', 'between', 'is_empty', 'is_not_empty'],
  DATE:     ['before', 'after', 'between', 'in_last_n_days', 'in_next_n_days', 'older_than_n_days', 'is_empty', 'is_not_empty'],
  BOOLEAN:  ['is'],
};

// Operator label overrides — display text for the dropdowns.
export const OPERATOR_LABELS = {
  is: 'is',
  is_not: 'is not',
  contains: 'contains',
  not_contains: 'does not contain',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
  greater_than: '>',
  less_than: '<',
  between: 'between',
  in: 'is one of',
  not_in: 'is not one of',
  before: 'before',
  after: 'after',
  in_last_n_days: 'in last N days',
  in_next_n_days: 'in next N days',
  older_than_n_days: 'older than N days',
};

export const CRM_ATTRIBUTES = [
  // ─── Account ───────────────────────────────────────────────────────
  { id: 'account.industry',            object: 'account',     field: 'industry',            label: 'Industry',            type: 'enum',    operators: OPS.ENUM,    options: ['Financial Services', 'SaaS', 'Healthcare', 'Retail', 'Manufacturing', 'Fintech', 'Media'] },
  { id: 'account.revenue_band',        object: 'account',     field: 'revenue_band',        label: 'Revenue band',        type: 'enum',    operators: OPS.ENUM,    options: ['<$10M', '$10M-$50M', '$50M-$250M', '$250M-$1B', '>$1B'] },
  { id: 'account.employees',           object: 'account',     field: 'employees',           label: 'Employees',           type: 'number',  operators: OPS.NUMBER },
  { id: 'account.arr',                 object: 'account',     field: 'arr',                 label: 'ARR ($)',             type: 'number',  operators: OPS.NUMBER },
  { id: 'account.tier',                object: 'account',     field: 'tier',                label: 'Tier',                type: 'enum',    operators: OPS.ENUM,    options: ['Enterprise', 'Commercial', 'Mid-Market', 'SMB'] },
  { id: 'account.health_score',        object: 'account',     field: 'health_score',        label: 'Health score',        type: 'number',  operators: OPS.NUMBER },
  { id: 'account.contract_end_date',   object: 'account',     field: 'contract_end_date',   label: 'Contract end date',   type: 'date',    operators: OPS.DATE },
  { id: 'account.owner_id',            object: 'account',     field: 'owner_id',            label: 'Account owner',       type: 'string',  operators: OPS.STRING },
  { id: 'account.hq_country',          object: 'account',     field: 'hq_country',          label: 'HQ country',          type: 'string',  operators: OPS.STRING },

  // ─── Opportunity ───────────────────────────────────────────────────
  { id: 'opportunity.stage',           object: 'opportunity', field: 'stage',               label: 'Opp stage',           type: 'enum',    operators: OPS.ENUM,    options: ['Discovery', 'Qualify', 'Propose', 'Commit', 'Negotiate', 'Closed Won', 'Closed Lost'] },
  { id: 'opportunity.amount',          object: 'opportunity', field: 'amount',              label: 'Opp amount ($)',      type: 'number',  operators: OPS.NUMBER },
  { id: 'opportunity.close_date',      object: 'opportunity', field: 'close_date',          label: 'Close date',          type: 'date',    operators: OPS.DATE },
  { id: 'opportunity.days_at_stage',   object: 'opportunity', field: 'days_at_stage',       label: 'Days at current stage', type: 'number', operators: OPS.NUMBER },
  { id: 'opportunity.forecast_category', object: 'opportunity', field: 'forecast_category', label: 'Forecast category',   type: 'enum',    operators: OPS.ENUM,    options: ['Pipeline', 'Best Case', 'Commit', 'Closed', 'Omitted'] },
  { id: 'opportunity.opp_type',        object: 'opportunity', field: 'opp_type',            label: 'Opp type',            type: 'enum',    operators: OPS.ENUM,    options: ['New Business', 'Renewal', 'Expansion'] },
  { id: 'opportunity.competitor_mentioned', object: 'opportunity', field: 'competitor_mentioned', label: 'Competitor mentioned', type: 'string', operators: OPS.STRING },

  // ─── Contact ───────────────────────────────────────────────────────
  { id: 'contact.role',                object: 'contact',     field: 'role',                label: 'Role',                type: 'enum',    operators: OPS.ENUM,    options: ['Decision Maker', 'Champion', 'Economic Buyer', 'Technical Evaluator', 'End User', 'Procurement'] },
  { id: 'contact.title_seniority',     object: 'contact',     field: 'title_seniority',     label: 'Title seniority',     type: 'enum',    operators: OPS.ENUM,    options: ['C-level', 'VP', 'Director', 'Manager', 'IC'] },
  { id: 'contact.engagement_score',    object: 'contact',     field: 'engagement_score',    label: 'Engagement score',    type: 'number',  operators: OPS.NUMBER },
  { id: 'contact.is_champion',         object: 'contact',     field: 'is_champion',         label: 'Is champion',         type: 'boolean', operators: OPS.BOOLEAN },

  // ─── Activity ──────────────────────────────────────────────────────
  { id: 'activity.last_activity_date', object: 'activity',    field: 'last_activity_date',  label: 'Last activity date',  type: 'date',    operators: OPS.DATE },
  { id: 'activity.last_meeting_date',  object: 'activity',    field: 'last_meeting_date',   label: 'Last meeting date',   type: 'date',    operators: OPS.DATE },
  { id: 'activity.activity_count_30d', object: 'activity',    field: 'activity_count_30d',  label: 'Activity count (last 30d)', type: 'number', operators: OPS.NUMBER },
  { id: 'activity.emails_opened_7d',   object: 'activity',    field: 'emails_opened_7d',    label: 'Emails opened (last 7d)', type: 'number', operators: OPS.NUMBER },
];

// Lookup helper.
export function getAttribute(id) {
  return CRM_ATTRIBUTES.find((a) => a.id === id) || null;
}

// Grouped for rendering pickers.
export function groupedAttributes() {
  const groups = {};
  for (const attr of CRM_ATTRIBUTES) {
    (groups[attr.object] ||= []).push(attr);
  }
  return CRM_OBJECTS.map((o) => ({
    ...o,
    attributes: groups[o.id] || [],
  }));
}

// ─── Signal Actions ─────────────────────────────────────────────────
export const SIGNAL_ACTIONS = [
  { id: 'generate_account_brief',   label: 'Generate Account Brief',   description: 'Kicks off an AI-generated deal / account brief in the account thread.',        icon: 'FileText' },
  { id: 'draft_personalized_email', label: 'Draft Email',              description: 'Composes a signal-anchored outreach email for seller review.',                 icon: 'Mail' },
  { id: 'find_buying_personas',     label: 'Find Buying Committee',    description: 'Surfaces missing stakeholders based on ICP + org chart data.',                  icon: 'Users' },
  { id: 'add_to_outreach',          label: 'Add to Outreach cadence',  description: 'Pushes matching accounts into a designated Outreach.io / SalesLoft cadence.',   icon: 'Send' },
  { id: 'create_crm_tasks',         label: 'Add CRM Task',             description: 'Creates a Salesforce task on the account for the AE with a due date.',          icon: 'ListTodo' },
  { id: 'flag_for_review',          label: 'Flag for CS Review',       description: 'Marks the account for the CSM queue — no action taken yet.',                    icon: 'Flag' },
];

export function getAction(id) {
  return SIGNAL_ACTIONS.find((a) => a.id === id) || null;
}

// ─── Categories + Severities ────────────────────────────────────────
export const SIGNAL_CATEGORIES = [
  { id: 'pipeline',     label: 'Pipeline health', color: 'text-blue-700 dark:text-blue-300',    bg: 'bg-blue-500/10' },
  { id: 'engagement',   label: 'Engagement',      color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10' },
  { id: 'renewal',      label: 'Renewal',         color: 'text-rose-700 dark:text-rose-300',    bg: 'bg-rose-500/10' },
  { id: 'expansion',    label: 'Expansion',       color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-500/10' },
  { id: 'buyer_intent', label: 'Buyer intent',    color: 'text-amber-700 dark:text-amber-300',  bg: 'bg-amber-500/10' },
  { id: 'custom',       label: 'Custom',          color: 'text-text-secondary',                 bg: 'bg-bg/40' },
];

export const SEVERITIES = [
  { id: 'critical', label: 'Critical', weight: 90 },
  { id: 'high',     label: 'High',     weight: 70 },
  { id: 'medium',   label: 'Medium',   weight: 50 },
  { id: 'info',     label: 'Info',     weight: 30 },
];

// ─── NL → Rules classifier ──────────────────────────────────────────
// Pattern-based for the prototype. Each pattern maps a phrase to one or
// more rule chips. Returns { rules, logic, category, severity, name }
// with best-guess defaults so the admin can refine.

function mkRule(field, operator, value) {
  return { id: `r_${Math.random().toString(36).slice(2, 8)}`, field, operator, value };
}

const NL_PATTERNS = [
  {
    name: 'open opportunities',
    match: /\bopen\s+(opportunit(?:y|ies)|deals?|opps?)\b/i,
    build: () => ({
      name: 'Open opportunities',
      description: 'Accounts with at least one open opportunity',
      category: 'pipeline',
      severity: 'medium',
      logic: 'AND',
      rules: [
        mkRule('opportunity.stage', 'not_in', ['Closed Won', 'Closed Lost']),
      ],
    }),
  },
  {
    name: 'no activity in N days',
    match: /\bno\s+activity\s+(?:in|since|for)?\s*(?:the\s+)?(?:last\s+)?(\d+)\s+days?\b/i,
    build: (m) => {
      const n = parseInt(m[1], 10) || 30;
      return {
        name: `No activity in ${n} days`,
        description: `Accounts where the last CRM-logged activity is older than ${n} days`,
        category: 'engagement',
        severity: 'high',
        logic: 'AND',
        rules: [mkRule('activity.last_activity_date', 'older_than_n_days', n)],
      };
    },
  },
  {
    name: 'past due close date',
    match: /\bpast\s+due\s+(?:close\s+date)?\b|\bclose\s+date\s+passed\b/i,
    build: () => ({
      name: 'Past-due close date',
      description: 'Open opportunities where the forecast close date has passed',
      category: 'pipeline',
      severity: 'critical',
      logic: 'AND',
      rules: [
        mkRule('opportunity.stage', 'not_in', ['Closed Won', 'Closed Lost']),
        mkRule('opportunity.close_date', 'before', 'today'),
      ],
    }),
  },
  {
    name: 'stuck at stage',
    match: /\bstuck\s+(?:at|in)\s+(?:the\s+)?stage\b|\bstalled\s+(?:opportunit|deals?)/i,
    build: () => ({
      name: 'Stuck at stage',
      description: 'Opportunities that have been at the same stage for more than 30 days',
      category: 'pipeline',
      severity: 'high',
      logic: 'AND',
      rules: [
        mkRule('opportunity.stage', 'not_in', ['Closed Won', 'Closed Lost']),
        mkRule('opportunity.days_at_stage', 'greater_than', 30),
      ],
    }),
  },
  {
    name: 'high value stuck',
    match: /\bhigh[\s-]?(?:value|dollar)\s+(?:opportunit|deals?)/i,
    build: () => ({
      name: 'High-value deals at risk',
      description: 'Open opportunities > $50K stuck for 30+ days',
      category: 'pipeline',
      severity: 'critical',
      logic: 'AND',
      rules: [
        mkRule('opportunity.stage', 'not_in', ['Closed Won', 'Closed Lost']),
        mkRule('opportunity.amount', 'greater_than', 50000),
        mkRule('opportunity.days_at_stage', 'greater_than', 30),
      ],
    }),
  },
  {
    name: 'renewal in N days',
    match: /\brenewal(?:s)?\s+(?:in|within)?\s*(?:the\s+)?(?:next\s+)?(\d+)\s+days?\b/i,
    build: (m) => {
      const n = parseInt(m[1], 10) || 90;
      return {
        name: `Renewals within ${n} days`,
        description: `Accounts whose contract end date falls within the next ${n} days`,
        category: 'renewal',
        severity: 'high',
        logic: 'AND',
        rules: [mkRule('account.contract_end_date', 'in_next_n_days', n)],
      };
    },
  },
  {
    name: 'buyers active in product',
    match: /\bbuyers?\s+(?:active|engaged?)\s+in\s+(?:the\s+)?product\b|\bproduct\s+active/i,
    build: () => ({
      name: 'Buyers active in the product',
      description: 'Contacts on the account are actively using the product',
      category: 'expansion',
      severity: 'medium',
      logic: 'AND',
      rules: [
        mkRule('contact.engagement_score', 'greater_than', 70),
        mkRule('contact.title_seniority', 'in', ['C-level', 'VP', 'Director']),
      ],
    }),
  },
  {
    name: 'competitor mentioned',
    match: /\bcompetitor\s+(?:mentioned|detected|flagged)\b/i,
    build: () => ({
      name: 'Competitor mentioned on opp',
      description: 'Opportunities where a competitor is flagged in the opp record',
      category: 'buyer_intent',
      severity: 'high',
      logic: 'AND',
      rules: [
        mkRule('opportunity.stage', 'not_in', ['Closed Won', 'Closed Lost']),
        mkRule('opportunity.competitor_mentioned', 'is_not_empty', null),
      ],
    }),
  },
  {
    name: 'no champion',
    match: /\bno\s+champion\b|\bmissing\s+champion\b/i,
    build: () => ({
      name: 'No champion identified',
      description: 'Open opportunities with no contact tagged as champion',
      category: 'engagement',
      severity: 'medium',
      logic: 'AND',
      rules: [
        mkRule('opportunity.stage', 'not_in', ['Closed Won', 'Closed Lost']),
        mkRule('contact.is_champion', 'is', false),
      ],
    }),
  },
  {
    name: 'expansion signal',
    match: /\bexpansion\b|\bupsell\b|\bcross[\s-]?sell\b/i,
    build: () => ({
      name: 'Expansion opportunity',
      description: 'Existing customers showing usage growth without an expansion opp',
      category: 'expansion',
      severity: 'medium',
      logic: 'AND',
      rules: [
        mkRule('account.health_score', 'greater_than', 70),
        mkRule('opportunity.opp_type', 'is_not', 'Expansion'),
      ],
    }),
  },
];

// Public: turn a natural-language prompt into a draft signal.
export function classifyNaturalLanguage(prompt) {
  const q = (prompt || '').trim();
  if (!q) return null;
  for (const p of NL_PATTERNS) {
    const m = q.match(p.match);
    if (m) return p.build(m);
  }
  // Fallback — produce a single placeholder rule so the admin sees the
  // structure and can refine.
  return {
    name: q.length > 60 ? q.slice(0, 57) + '...' : q,
    description: `Custom signal derived from: "${q}"`,
    category: 'custom',
    severity: 'medium',
    logic: 'AND',
    rules: [
      mkRule('opportunity.stage', 'not_in', ['Closed Won', 'Closed Lost']),
    ],
    fallback: true,
  };
}

// ─── Store (localStorage-backed) ────────────────────────────────────
const STORAGE_KEY = 'rgi-first-party-signals';
const subscribers = new Set();
const notify = () => subscribers.forEach((cb) => { try { cb(); } catch { /* isolate */ } });

// Seed data — canonical examples that render on first load.
function seedSignals() {
  const now = new Date('2026-08-11').toISOString();
  return [
    {
      id: 'sig_seed_open_opps',
      name: 'Open opportunities',
      description: 'Any account with at least one open opportunity in an active stage',
      status: 'live',
      logic: 'AND',
      rules: [mkRule('opportunity.stage', 'not_in', ['Closed Won', 'Closed Lost'])],
      action: 'generate_account_brief',
      category: 'pipeline',
      severity: 'medium',
      weight: 50,
      firingCountLast7d: 47,
      createdAt: now,
      updatedAt: now,
      ownerId: 'priya',
      ownerName: 'Priya Rao',
    },
    {
      id: 'sig_seed_no_activity_30',
      name: 'No activity in 30 days',
      description: 'Accounts where the last CRM activity is older than 30 days',
      status: 'live',
      logic: 'AND',
      rules: [mkRule('activity.last_activity_date', 'older_than_n_days', 30)],
      action: 'draft_personalized_email',
      category: 'engagement',
      severity: 'high',
      weight: 70,
      firingCountLast7d: 23,
      createdAt: now,
      updatedAt: now,
      ownerId: 'priya',
      ownerName: 'Priya Rao',
    },
    {
      id: 'sig_seed_renewal_90',
      name: 'Renewals within 90 days',
      description: 'Contracts ending in the next 90 days without a renewal opp open',
      status: 'draft',
      logic: 'AND',
      rules: [
        mkRule('account.contract_end_date', 'in_next_n_days', 90),
        mkRule('opportunity.opp_type', 'is_not', 'Renewal'),
      ],
      action: 'create_crm_tasks',
      category: 'renewal',
      severity: 'critical',
      weight: 90,
      firingCountLast7d: 0,
      createdAt: now,
      updatedAt: now,
      ownerId: 'priya',
      ownerName: 'Priya Rao',
    },
  ];
}

function readAll() {
  if (typeof window === 'undefined') return seedSignals();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = seedSignals();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return seedSignals();
  }
}

function writeAll(list) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  notify();
}

export function listSignals() {
  return readAll();
}

export function getSignal(id) {
  return readAll().find((s) => s.id === id) || null;
}

export function upsertSignal(signal) {
  const now = new Date('2026-08-11').toISOString();
  const list = readAll();
  const id = signal.id || `sig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const idx = list.findIndex((s) => s.id === id);
  const next = {
    ...signal,
    id,
    updatedAt: now,
    createdAt: signal.createdAt || now,
    ownerId: signal.ownerId || 'priya',
    ownerName: signal.ownerName || 'Priya Rao',
    firingCountLast7d: signal.firingCountLast7d ?? 0,
  };
  const newList = idx === -1 ? [next, ...list] : list.map((s, i) => (i === idx ? next : s));
  writeAll(newList);
  return next;
}

export function deleteSignal(id) {
  writeAll(readAll().filter((s) => s.id !== id));
}

export function subscribeSignals(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

// ─── Live match preview (mocked count) ──────────────────────────────
// In production this would evaluate rules against the CRM extract. For the
// prototype we synthesize a plausible count grounded in the rules — enough
// signals × severity variance so the UI reads as real.
export function estimateMatchCount(signal) {
  if (!signal?.rules?.length) return 0;
  // Base count varies by rule types + severity so different signals feel distinct.
  const baseByOp = {
    'older_than_n_days': 28,
    'in_next_n_days':    14,
    'not_in':            180,
    'greater_than':       35,
    'less_than':          22,
    'is_not_empty':       12,
    'is':                 24,
    'is_not':             41,
    'contains':           31,
    'before':             18,
    'after':              47,
    'in':                 55,
  };
  let count = 200;
  for (const r of signal.rules) {
    const contribution = baseByOp[r.operator] || 30;
    // Each additional rule narrows the set (AND) or expands it (OR).
    if (signal.logic === 'OR') count = Math.round(count * 1.15 + contribution * 0.5);
    else count = Math.round(count * (contribution / 60));
  }
  // Clamp to a realistic range for a demo tenant.
  return Math.max(3, Math.min(count, 340));
}

// Rules-summary helper — one-line label for lists / cards.
export function summarizeRules(signal) {
  if (!signal?.rules?.length) return '(no rules)';
  const parts = signal.rules.map((r) => {
    const attr = getAttribute(r.field);
    const label = attr?.label || r.field;
    const op = OPERATOR_LABELS[r.operator] || r.operator;
    const val = r.value == null
      ? ''
      : Array.isArray(r.value)
        ? r.value.slice(0, 2).join(', ') + (r.value.length > 2 ? ` +${r.value.length - 2}` : '')
        : String(r.value);
    return `${label} ${op}${val ? ' ' + val : ''}`;
  });
  const joiner = signal.logic === 'OR' ? ' OR ' : ' AND ';
  return parts.join(joiner);
}
