// Legacy Playbooks — seed fixtures representing what a customer coming from
// Sales Copilot v1 has today. A "Playbook" was: audience filters + (optional)
// trigger + (optional) action, all bundled together. In v2 this concept
// unbundles into Workbook (who) × Sales Play (when + what).
//
// Each entry ships with everything the Migration Center needs to render a
// side-by-side preview: filters, optional trigger, optional action, and a
// mock live match count.

export const LEGACY_PLAYBOOK_STATUSES = {
  active:   { label: 'Active',   color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  paused:   { label: 'Paused',   color: 'text-amber-700 dark:text-amber-300',     bg: 'bg-amber-500/10',    border: 'border-amber-500/30' },
  draft:    { label: 'Draft',    color: 'text-text-secondary',                    bg: 'bg-surface-2',       border: 'border-border' },
};

// Filter chip shape — mirrors the audience UI in the screenshots.
// group: 'Person' | 'Company' | 'CRM' | 'Product' | 'Signal'
// op:    'is' | 'is not' | 'greater than' | 'less than' | 'within' | 'is empty' | 'contains' | '='
function chip(group, label, op, value) {
  return { group, label, op, value };
}

export const LEGACY_PLAYBOOKS = [
  // ────────────────────────────────────────────────────────────────────
  // Archetype 1 · Audience-only Playbooks → suggested map: Workbook
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'lpb-at-risk-churn',
    name: 'At-risk enterprise customers',
    description: 'High-ARR customers with zero product usage in the last 30 days. CSMs comb this list every Monday.',
    status: 'active',
    owner: 'Priya Sharma',
    createdAt: '2024-11-08',
    filters: [
      chip('Person', 'Person activity type', 'is', 'App Usage'),
      chip('Person', 'Person activity time', 'less than', '30 days ago'),
      chip('Person', 'Number of matches',    '=',       0),
      chip('Company', 'Company customer fit', 'is', 'very good'),
      chip('CRM',    'Salesforce Account Current ARR', 'greater than', '$500K'),
    ],
    trigger: null,
    action: null,
    matchCount: 5386,
    // For the auto-mapper: no trigger + no action = pure-list playbook.
    surface: 'list',
  },
  {
    id: 'lpb-cold-prospects',
    name: 'Cold prospects — 60 day no-touch',
    description: 'Prospects that have not been touched in 60 days but are still in an open opportunity stage. AE-owned re-engagement queue.',
    status: 'active',
    owner: 'Priya Sharma',
    createdAt: '2025-02-14',
    filters: [
      chip('CRM',    'Opportunity stage',   'is not',   'Closed'),
      chip('CRM',    'Last activity date',  'less than', '60 days ago'),
      chip('Company', 'Company customer fit', 'is', 'good or better'),
    ],
    trigger: null,
    action: null,
    matchCount: 148,
    surface: 'list',
  },

  // ────────────────────────────────────────────────────────────────────
  // Archetype 2 · Playbooks with trigger + action → suggested map: Sales Play
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'lpb-renewal-window-us',
    name: 'Salesforce CRM renewal window — US',
    description: 'US customers on Salesforce CRM whose renewal date lands within the next 3 months. Kicks off the renewal-defense email cadence.',
    status: 'active',
    owner: 'Priya Sharma',
    createdAt: '2025-01-22',
    filters: [
      chip('Product', 'Product Name', 'is', 'Salesforce CRM'),
      chip('Product', 'Estimated Renewal Date', 'within', 'next 3 months'),
      chip('Company', 'Country Name', 'is', 'United States of America'),
    ],
    trigger: { type: 'crm_field_change', label: 'Renewal Date crosses 90-day threshold' },
    action:  { type: 'email_cadence',    label: 'Send renewal-defense email + create AM task' },
    matchCount: 13,
    surface: 'triggered',
  },
  {
    id: 'lpb-high-intent-inbound',
    name: 'High-intent TrustRadius researchers',
    description: 'Accounts running comparison research on TrustRadius against our category. AE gets a Slack ping + a pre-drafted outreach.',
    status: 'active',
    owner: 'Priya Sharma',
    createdAt: '2025-04-03',
    filters: [
      chip('Signal', 'TrustRadius product comparison', 'is', 'true'),
      chip('Signal', 'Category',                       'is', 'Cloud Security'),
      chip('Company', 'Company employee count', 'greater than', 1000),
    ],
    trigger: { type: 'external_event', label: 'TrustRadius comparison event fired' },
    action:  { type: 'slack_ping_plus_email', label: 'Slack the AE + draft outreach email' },
    matchCount: 42,
    surface: 'triggered',
  },
  {
    id: 'lpb-champion-movement',
    name: 'Champion job change tracker',
    description: 'Alerts CSMs when a known champion contact changes jobs — protect the deal, open a warm outreach at their new employer.',
    status: 'active',
    owner: 'Priya Sharma',
    createdAt: '2025-03-11',
    filters: [
      chip('Person', 'Person is champion', 'is', 'true'),
      chip('Person', 'Person LinkedIn employer', 'has changed', 'in last 14 days'),
    ],
    trigger: { type: 'contact_event', label: 'LinkedIn employer change verified' },
    action:  { type: 'notify_plus_task', label: 'Slack the CSM + create follow-up task on new company' },
    matchCount: 6,
    surface: 'triggered',
  },
  {
    id: 'lpb-expansion-cross-sell',
    name: 'Expansion — CIEM cross-sell',
    description: 'Existing Wiz CNAPP customers who have not adopted CIEM. AM plays a targeted upsell motion each quarter.',
    status: 'paused',
    owner: 'Priya Sharma',
    createdAt: '2024-12-19',
    filters: [
      chip('Product', 'Product Name', 'is', 'Wiz CNAPP'),
      chip('Product', 'Missing product', 'is', 'Wiz CIEM'),
      chip('Company', 'Customer since', 'greater than', '90 days ago'),
      chip('Company', 'Company customer fit', 'is', 'very good'),
    ],
    trigger: null,
    action:  { type: 'quarterly_review', label: 'Enroll in CIEM upsell sequence · AM-owned' },
    matchCount: 71,
    // Mixed: has an action but no explicit trigger. Auto-mapper should flag as
    // Sales Play (outbound, admin-activated) with medium confidence.
    surface: 'mixed',
  },
];

export const LEGACY_PLAYBOOKS_BY_ID = Object.fromEntries(LEGACY_PLAYBOOKS.map((p) => [p.id, p]));

export function listLegacyPlaybooks() {
  return LEGACY_PLAYBOOKS;
}

export function getLegacyPlaybook(id) {
  return LEGACY_PLAYBOOKS_BY_ID[id] || null;
}

// Total matches across all legacy playbooks — surfaced on the Admin Hub
// migration tile.
export function legacyPlaybookMatchTotal() {
  return LEGACY_PLAYBOOKS.reduce((s, p) => s + (p.matchCount || 0), 0);
}
