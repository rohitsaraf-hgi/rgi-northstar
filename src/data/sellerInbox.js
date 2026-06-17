// Seller inbox data — drives the new Awaiting You + Recent Outcomes sections
// on SellerHome.
//
// In production these would be materialized from real workflow-run state:
//   - pending checkpoints = workflow_runs where current node is checkpoint.approval
//     and assignee_role matches the seller's role
//   - signal-triggered plays = signals firing today × workflows with that bound_signal
//     × workflows visible to this seller's audience_roles
//   - recent outcomes = workflow_runs that recently hit output.outcome
//
// For the prototype we curate the data per persona so the demo loop is provable.

const NOW = new Date();
function hoursAgo(h) {
  return new Date(NOW.getTime() - h * 3600 * 1000).toISOString();
}

// Each entry is keyed by personaId. The inbox is intentionally richest for the
// AE personas (Riley, Jordan) since that's the primary daily-active surface.

const PENDING_CHECKPOINTS_BY_PERSONA = {
  riley: [
    {
      id: 'chk-1',
      workflow_id: 'sales-play-fintech-displacement',
      workflow_name: 'Q2 Fintech Displacement Play',
      step_label: 'AE approval — review draft before Outreach enrollment',
      account_id: 'acct-acme',
      account_name: 'Acme Corp',
      account_logo: '#0ea5e9',
      assignee_role: 'AE',
      bound_signal_id: 'splunk-aging-displacement',
      bound_signal_label: 'Splunk Aging Displacement',
      fired_at: hoursAgo(3),
      sla_hours: 24,
      preview: {
        title: 'Subject: Splunk @ 38mo — a quick observation on your stack',
        snippet: 'Hi Sarah, noticed your Splunk install is approaching its third renewal window. With AWS spend up 22% YoY, you may be re-evaluating observability...',
      },
    },
    {
      id: 'chk-2',
      workflow_id: 'persona-discovery-probe',
      workflow_name: 'Persona Discovery Probe',
      step_label: 'AE approval — confirm contact list before CRM enrichment',
      account_id: 'acct-databricks',
      account_name: 'Databricks',
      account_logo: '#10b981',
      assignee_role: 'AE',
      bound_signal_id: null,
      fired_at: hoursAgo(18),
      sla_hours: 24,
      preview: {
        title: '4 personas discovered',
        snippet: 'Found Diana Chen (VP Engineering), Marcus Wei (Director Platform), Priya Shah (CISO), Jamal Brooks (VP IT)',
      },
    },
  ],
  jordan: [
    {
      id: 'chk-3',
      workflow_id: 'sales-play-fintech-displacement',
      workflow_name: 'Q2 Fintech Displacement Play',
      step_label: 'AE approval — review draft before Outreach enrollment',
      account_id: 'acct-stripe',
      account_name: 'Stripe',
      account_logo: '#635bff',
      assignee_role: 'AE',
      bound_signal_id: 'splunk-aging-displacement',
      bound_signal_label: 'Splunk Aging Displacement',
      fired_at: hoursAgo(6),
      sla_hours: 24,
      preview: {
        title: 'Subject: Splunk renewal cliff — quick observation',
        snippet: 'Hi Patrick, noticed Splunk @ 41 months and IT spend trending down YoY...',
      },
    },
  ],
  alex: [
    {
      id: 'chk-4',
      workflow_id: 'onboarding-rescue-flow',
      workflow_name: 'Onboarding Rescue',
      step_label: 'CSM approval — review re-engagement draft',
      account_id: 'acct-pinterest',
      account_name: 'Pinterest',
      account_logo: '#e60023',
      assignee_role: 'CSM',
      bound_signal_id: 'onboarding-stalled',
      bound_signal_label: 'Onboarding Stalled',
      fired_at: hoursAgo(2),
      sla_hours: 24,
      preview: {
        title: 'Subject: Quick check on your Wiz rollout',
        snippet: 'Hi Aisha, noticed onboarding has paused — wanted to flag a few resources that may help...',
      },
    },
  ],
};

const TRIGGERED_PLAYS_BY_PERSONA = {
  riley: [
    {
      id: 'tp-1',
      workflow_id: 'sales-play-fintech-displacement',
      workflow_name: 'Splunk Aging Displacement',
      account_id: 'acct-datadog',
      account_name: 'Datadog',
      account_logo: '#632ca6',
      signal_id: 'splunk-aging-displacement',
      signal_label: 'Splunk Aging Displacement',
      evidence: 'Splunk 41mo · IT spend -18% YoY',
      fired_at: hoursAgo(1),
      est_tokens: 6000,
    },
    {
      id: 'tp-2',
      workflow_id: 'persona-discovery-probe',
      workflow_name: 'Persona Discovery Probe',
      account_id: 'acct-snowflake',
      account_name: 'Snowflake',
      account_logo: '#29b5e8',
      signal_id: null,
      signal_label: 'Manual — Champion left 30 days ago',
      evidence: 'No new champion identified in CRM',
      fired_at: hoursAgo(8),
      est_tokens: 9000,
    },
    {
      id: 'tp-3',
      workflow_id: 'account-brief-flow',
      workflow_name: 'Account Brief',
      account_id: 'acct-cloudflare',
      account_name: 'Cloudflare',
      account_logo: '#f48120',
      signal_id: null,
      signal_label: 'Manual — Meeting in 2 days',
      evidence: 'No brief generated yet for this account',
      fired_at: hoursAgo(14),
      est_tokens: 7100,
    },
  ],
  jordan: [
    {
      id: 'tp-4',
      workflow_id: 'sales-play-fintech-displacement',
      workflow_name: 'Splunk Aging Displacement',
      account_id: 'acct-jpmc',
      account_name: 'JPMorgan Chase',
      account_logo: '#0F4D9F',
      signal_id: 'splunk-aging-displacement',
      signal_label: 'Splunk Aging Displacement',
      evidence: 'Splunk 47mo · IT spend -8% YoY',
      fired_at: hoursAgo(2),
      est_tokens: 6000,
    },
    {
      id: 'tp-5',
      workflow_id: 'persona-discovery-probe',
      workflow_name: 'Persona Discovery Probe',
      account_id: 'acct-visa',
      account_name: 'Visa',
      account_logo: '#1a1f71',
      signal_id: null,
      signal_label: 'Manual — Expansion conversation pending',
      evidence: 'Need additional decision-makers identified',
      fired_at: hoursAgo(20),
      est_tokens: 9000,
    },
  ],
  alex: [
    {
      id: 'tp-6',
      workflow_id: 'onboarding-rescue-flow',
      workflow_name: 'Onboarding Rescue',
      account_id: 'acct-block',
      account_name: 'Block',
      account_logo: '#000000',
      signal_id: 'onboarding-stalled',
      signal_label: 'Onboarding Stalled',
      evidence: 'No product login 24d · no Marketo response',
      fired_at: hoursAgo(4),
      est_tokens: 1200,
    },
  ],
};

const RECENT_OUTCOMES_BY_PERSONA = {
  riley: [
    {
      id: 'oc-1',
      workflow_id: 'sales-play-fintech-displacement',
      workflow_name: 'Splunk Aging Displacement',
      account_id: 'acct-mastercard',
      account_name: 'Mastercard',
      account_logo: '#eb001b',
      outcome: 'replied',
      outcome_label: 'Reply received',
      outcome_detail: '"Worth a 30-min chat next week — send some times"',
      completed_at: hoursAgo(46),
      run_duration_hours: 49,
    },
    {
      id: 'oc-2',
      workflow_id: 'account-brief-flow',
      workflow_name: 'Account Brief',
      account_id: 'acct-spotify',
      account_name: 'Spotify',
      account_logo: '#1db954',
      outcome: 'completed',
      outcome_label: 'Brief delivered',
      outcome_detail: '6 personas mapped · MEDDIC roll-up · 3 talking points',
      completed_at: hoursAgo(72),
      run_duration_hours: 0.1,
    },
    {
      id: 'oc-3',
      workflow_id: 'persona-discovery-probe',
      workflow_name: 'Persona Discovery Probe',
      account_id: 'acct-pinterest',
      account_name: 'Pinterest',
      account_logo: '#e60023',
      outcome: 'enriched',
      outcome_label: '4 contacts added',
      outcome_detail: 'Diana Chen, Aisha Patel, Marcus Wei, Priya Shah',
      completed_at: hoursAgo(96),
      run_duration_hours: 0.2,
    },
    {
      id: 'oc-4',
      workflow_id: 'sales-play-fintech-displacement',
      workflow_name: 'Splunk Aging Displacement',
      account_id: 'acct-visa',
      account_name: 'Visa',
      account_logo: '#1a1f71',
      outcome: 'no_response',
      outcome_label: 'No response · 14 days',
      outcome_detail: 'Marked stale — consider follow-up touch',
      completed_at: hoursAgo(120),
      run_duration_hours: 336,
    },
    {
      id: 'oc-5',
      workflow_id: 'onboarding-rescue-flow',
      workflow_name: 'Onboarding Rescue',
      account_id: 'acct-block',
      account_name: 'Block',
      account_logo: '#000000',
      outcome: 'recovered',
      outcome_label: 'Engagement recovered',
      outcome_detail: 'Last login resumed · 3 features tried in 5 days',
      completed_at: hoursAgo(168),
      run_duration_hours: 168,
    },
  ],
  jordan: [
    {
      id: 'oc-6',
      workflow_id: 'sales-play-fintech-displacement',
      workflow_name: 'Splunk Aging Displacement',
      account_id: 'acct-jpmc',
      account_name: 'JPMorgan Chase',
      account_logo: '#0F4D9F',
      outcome: 'meeting_booked',
      outcome_label: 'Meeting booked',
      outcome_detail: 'Cathy Liu, VP Observability · Thursday 2pm',
      completed_at: hoursAgo(22),
      run_duration_hours: 30,
    },
  ],
  alex: [
    {
      id: 'oc-7',
      workflow_id: 'onboarding-rescue-flow',
      workflow_name: 'Onboarding Rescue',
      account_id: 'acct-stripe',
      account_name: 'Stripe',
      account_logo: '#635bff',
      outcome: 'recovered',
      outcome_label: 'Engagement recovered',
      outcome_detail: 'CSM call booked · feature adoption resumed',
      completed_at: hoursAgo(48),
      run_duration_hours: 96,
    },
  ],
};

// ----- Queries -----

export function listPendingCheckpoints(personaId, salesRole) {
  const all = PENDING_CHECKPOINTS_BY_PERSONA[personaId] || [];
  if (!salesRole) return all;
  return all.filter((c) => c.assignee_role === salesRole);
}

export function listSignalTriggeredPlays(personaId) {
  return TRIGGERED_PLAYS_BY_PERSONA[personaId] || [];
}

export function listRecentOutcomes(personaId, { limit = 6 } = {}) {
  const list = RECENT_OUTCOMES_BY_PERSONA[personaId] || [];
  return list.slice(0, limit);
}

// Aggregated inbox counts for the greeting bar and sidebar badges.
export function inboxCounts(personaId, salesRole) {
  const checkpoints = listPendingCheckpoints(personaId, salesRole).length;
  const plays = listSignalTriggeredPlays(personaId).length;
  const outcomes = listRecentOutcomes(personaId).length;
  return { checkpoints, plays, outcomes, awaiting: checkpoints + plays };
}

// ----- Outcome metadata for visual treatment -----

export const OUTCOME_TREATMENTS = {
  replied: { label: 'Reply received', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10', tone: 'success' },
  meeting_booked: { label: 'Meeting booked', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10', tone: 'success' },
  enriched: { label: 'Contacts added', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500/10', tone: 'info' },
  recovered: { label: 'Engagement recovered', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10', tone: 'success' },
  completed: { label: 'Completed', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500/10', tone: 'info' },
  enrolled: { label: 'Sequence enrolled', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500/10', tone: 'info' },
  no_response: { label: 'No response', color: 'text-text-muted', bg: 'bg-surface-2', tone: 'neutral' },
  churned: { label: 'Account churned', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-500/10', tone: 'negative' },
};

// Format a relative timestamp for display
export function relativeTime(isoString) {
  const then = new Date(isoString);
  const diffMs = NOW.getTime() - then.getTime();
  const hours = Math.floor(diffMs / (3600 * 1000));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
