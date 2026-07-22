// Mock agent runs log for admin observability. High-level only:
// when, who invoked, surface, status, duration. No deep drill-down.

export const AGENT_RUN_STATUSES = {
  success: { label: 'Success', color: 'text-success', dot: 'bg-success' },
  partial: { label: 'Partial', color: 'text-warning', dot: 'bg-warning' },
  failed:  { label: 'Failed',  color: 'text-danger',  dot: 'bg-danger' },
  pending: { label: 'Awaiting approval', color: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
};

// Common invoker shorthand for Alex's seeded runs so the Daily Brief
// outcome bars have hydrated data on cold load.
const ALEX_INVOKER = { name: 'Alex Chen', initials: 'AC', color: '#0ea5e9', role: 'AE' };
const AUTO_INVOKER = { name: 'System (batch)', initials: 'SYS', color: '#6B7280', role: 'Auto' };

// Runs seeded to demonstrate the three plays on Alex's Brief:
//   - account-brief-flow          (Play 1 · ICP Batch)  — 30 accounts
//   - wf-tpl-prospecting-agent    (Play 3 · Q3 Banking) — 5 accounts
const ALEX_PLAY_RUNS = [
  // Play 1 — Account Brief · ICP Batch (30 records across 3 completed batches)
  ...[
    ['JPMorgan Chase', 'success', 3420],
    ['Snowflake', 'success', 3800],
    ['Databricks', 'success', 4110],
    ['Acme Corp', 'success', 3620],
    ['Visa', 'success', 3510],
    ['Mastercard', 'success', 3720],
    ['Datadog', 'success', 4020],
    ['Stripe', 'success', 3910],
    ['Block', 'success', 3850],
    ['Cloudflare', 'success', 4130],
    ['Bank of America', 'success', 3990],
    ['Citi', 'success', 3620],
    ['Capital One', 'success', 3410],
    ['Morgan Stanley', 'success', 3730],
    ['Deutsche Bank', 'success', 3820],
    ['Cisco', 'partial', 5220],       // partial — persona discovery gap
    ['Oracle', 'partial', 5410],      // partial — CRM missing champion
    ['Spotify', 'partial', 4820],     // partial — enrichment thin
    ['Best Buy', 'success', 3540],
    ['Target', 'success', 3450],
    ['Marriott', 'success', 3620],
    ['Cigna', 'success', 3810],
    ['Kaiser', 'success', 3920],
    ['UnitedHealth', 'success', 3840],
    ['Netflix', 'success', 3910],
    ['Microsoft', 'success', 3720],
    ['Google', 'success', 3820],
    ['Meta', 'partial', 5150],        // partial — champion recently left
    ['NVIDIA', 'failed', 8420],       // failed — no HG intelligence match
    ['Uber', 'success', 3610],
  ].map(([target, status, durationMs], i) => ({
    id: `run-alex-ab-${i + 1}`,
    playbookId: 'account-brief-flow',
    invokedBy: i % 5 === 0 ? ALEX_INVOKER : AUTO_INVOKER,
    surface: 'batch',
    target,
    status,
    durationMs,
    timestamp: `${Math.max(1, Math.floor(i / 3))} hr ago`,
    stepCount: 3,
  })),
  // Play 3 — Q3 Prospecting · Banking (5 records across 1 completed + 1 running batch)
  ...[
    ['JPMorgan Chase', 'success', 12420, 5],
    ['Visa', 'success', 11890, 5],
    ['Mastercard', 'partial', 14320, 5],   // partial — one persona missing
    ['Stripe', 'pending', 10240, 5],       // pending — email draft awaiting approval
    ['Block', 'pending', 9820, 5],         // pending — email draft awaiting approval
  ].map(([target, status, durationMs, stepCount], i) => ({
    id: `run-alex-pros-${i + 1}`,
    playbookId: 'wf-tpl-prospecting-agent',
    invokedBy: ALEX_INVOKER,
    surface: 'batch',
    target,
    status,
    durationMs,
    timestamp: i < 2 ? `${(i + 1) * 20} min ago` : `${5 + i * 5} min ago`,
    stepCount,
  })),
];

// Most recent first
export const AGENT_RUNS = [
  ...ALEX_PLAY_RUNS,
  {
    id: 'run-2901',
    playbookId: 'account-brief-flow',
    invokedBy: { name: 'Riley Cooper', initials: 'RC', color: '#10B981', role: 'AE' },
    surface: 'thread',
    target: 'Acme Corp',
    status: 'success',
    durationMs: 4200,
    timestamp: 'Just now',
    stepCount: 3,
  },
  {
    id: 'run-2900',
    playbookId: 'account-brief-flow',
    invokedBy: { name: 'Jordan Chen', initials: 'JC', color: '#F97316', role: 'AE' },
    surface: 'thread',
    target: 'Meridian Labs',
    status: 'success',
    durationMs: 3980,
    timestamp: '12 min ago',
    stepCount: 3,
  },
  {
    id: 'run-2899',
    playbookId: 'renewal-readiness-flow',
    invokedBy: { name: 'System (schedule)', initials: 'SYS', color: '#6B7280', role: 'Auto' },
    surface: 'slack-dm',
    target: 'Jordan\'s renewal book (4 accounts)',
    status: 'success',
    durationMs: 18400,
    timestamp: '1 hr ago',
    stepCount: 3,
  },
  {
    id: 'run-2898',
    playbookId: 'account-brief-flow',
    invokedBy: { name: 'Marcus Kim', initials: 'MK', color: '#3B82F6', role: 'AE' },
    surface: 'thread',
    target: 'Dataflow Inc',
    status: 'success',
    durationMs: 4380,
    timestamp: '2 hrs ago',
    stepCount: 3,
  },
  {
    id: 'run-2897',
    playbookId: 'account-brief-flow',
    invokedBy: { name: 'Riley Cooper', initials: 'RC', color: '#10B981', role: 'AE' },
    surface: 'slack-channel',
    target: 'Helio Systems',
    status: 'success',
    durationMs: 4040,
    timestamp: '3 hrs ago',
    stepCount: 3,
  },
  {
    id: 'run-2896',
    playbookId: 'account-brief-flow',
    invokedBy: { name: 'Jordan Chen', initials: 'JC', color: '#F97316', role: 'AE' },
    surface: 'thread',
    target: 'Quanta Health',
    status: 'success',
    durationMs: 4620,
    timestamp: '4 hrs ago',
    stepCount: 3,
  },
  {
    id: 'run-2895',
    playbookId: 'renewal-readiness-flow',
    invokedBy: { name: 'System (schedule)', initials: 'SYS', color: '#6B7280', role: 'Auto' },
    surface: 'slack-dm',
    target: 'Marcus\'s renewal book (3 accounts)',
    status: 'success',
    durationMs: 16800,
    timestamp: 'Yesterday, 7:00 AM',
    stepCount: 3,
  },
  {
    id: 'run-2894',
    playbookId: 'account-brief-flow',
    invokedBy: { name: 'James Chen', initials: 'JC', color: '#10B981', role: 'AE' },
    surface: 'thread',
    target: 'Northwind Traders',
    status: 'success',
    durationMs: 4180,
    timestamp: 'Yesterday',
    stepCount: 3,
  },
  {
    id: 'run-2893',
    playbookId: 'account-brief-flow',
    invokedBy: { name: 'Riley Cooper', initials: 'RC', color: '#10B981', role: 'AE' },
    surface: 'thread',
    target: 'Stelio Networks',
    status: 'partial',
    durationMs: 6800,
    timestamp: 'Yesterday',
    stepCount: 3,
    note: 'Tech install data missing for target — proceeded without',
  },
  {
    id: 'run-2892',
    playbookId: 'account-brief-flow',
    invokedBy: { name: 'Marcus Kim', initials: 'MK', color: '#3B82F6', role: 'AE' },
    surface: 'thread',
    target: 'Vortex Energy',
    status: 'success',
    durationMs: 4260,
    timestamp: '2 days ago',
    stepCount: 3,
  },
  {
    id: 'run-2891',
    playbookId: 'renewal-readiness-flow',
    invokedBy: { name: 'System (schedule)', initials: 'SYS', color: '#6B7280', role: 'Auto' },
    surface: 'slack-dm',
    target: 'James\'s renewal book (5 accounts)',
    status: 'success',
    durationMs: 19200,
    timestamp: '7 days ago',
    stepCount: 3,
  },
];

export function runsForPlaybook(playbookId, limit = 25) {
  return AGENT_RUNS.filter((r) => r.playbookId === playbookId).slice(0, limit);
}

export function recentRuns(limit = 25) {
  return AGENT_RUNS.slice(0, limit);
}

export function runStats(playbookId) {
  const runs = AGENT_RUNS.filter((r) => r.playbookId === playbookId);
  if (runs.length === 0) return { total: 0, success: 0, partial: 0, failed: 0, avgMs: 0, successRate: 0 };
  const success = runs.filter((r) => r.status === 'success').length;
  const partial = runs.filter((r) => r.status === 'partial').length;
  const failed = runs.filter((r) => r.status === 'failed').length;
  const avgMs = Math.round(runs.reduce((s, r) => s + (r.durationMs || 0), 0) / runs.length);
  const successRate = Math.round(((success + partial * 0.5) / runs.length) * 100);
  return { total: runs.length, success, partial, failed, avgMs, successRate };
}
