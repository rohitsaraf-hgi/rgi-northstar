// Mock agent runs log for admin observability. High-level only:
// when, who invoked, surface, status, duration. No deep drill-down.

export const AGENT_RUN_STATUSES = {
  success: { label: 'Success', color: 'text-success', dot: 'bg-success' },
  partial: { label: 'Partial', color: 'text-warning', dot: 'bg-warning' },
  failed:  { label: 'Failed',  color: 'text-danger',  dot: 'bg-danger' },
  pending: { label: 'Awaiting approval', color: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
};

// Most recent first
export const AGENT_RUNS = [
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
