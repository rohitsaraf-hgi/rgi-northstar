// Artifact trail for hero threads (right panel context rail).

export const ARTIFACT_TYPES = {
  LIST: { label: 'LIST', icon: 'list-checks', color: 'text-blue-700 dark:text-blue-300' },
  SEGMENT: { label: 'SEGMENT', icon: 'layers', color: 'text-purple-700 dark:text-purple-300' },
  BRIEF: { label: 'BRIEF', icon: 'file-text', color: 'text-blue-700 dark:text-blue-300' },
  DRAFT: { label: 'DRAFT', icon: 'mail', color: 'text-amber-700 dark:text-amber-300' },
  ANALYSIS: { label: 'ANALYSIS', icon: 'bar-chart-3', color: 'text-emerald-700 dark:text-emerald-300' },
  DECISION: { label: 'DECISION', icon: 'check-circle-2', color: 'text-success' },
  REPORT: { label: 'REPORT', icon: 'clipboard-list', color: 'text-cyan-700 dark:text-cyan-300' },
  LIVE_VIEW: { label: 'LIVE VIEW', icon: 'sparkles', color: 'text-primary' },
};

export const THREAD_ARTIFACTS = {
  'fintech-icp-q2': [
    { id: 'a1', type: 'SEGMENT', name: 'Fintech Mid-Market — Q2 Refresh', timestamp: 'April 22, 9:15 AM', version: 'v2.0' },
    { id: 'a2', type: 'ANALYSIS', name: 'Drift Analysis — v2.0 vs v1', timestamp: 'April 23, 11:31 AM', version: 'v1' },
    { id: 'a3', type: 'SEGMENT', name: 'Fintech Mid-Market — v2.1 (approved)', timestamp: 'April 24, 3:43 PM', version: 'v2.1' },
    { id: 'a4', type: 'DECISION', name: 'v2.1 Approval — Priya Sharma', timestamp: 'April 24, 3:42 PM', version: 'v1', surface: 'slack' },
    { id: 'a5', type: 'DRAFT', name: 'Q2 Export Plan', timestamp: 'April 25, 8:43 AM', version: 'v1' },
  ],
  'apac-tam': [
    { id: 'a1', type: 'LIVE_VIEW', name: 'APAC Market Size — Fintech, >500 employees', timestamp: 'April 19, 2:11 PM', version: 'v1' },
    { id: 'a2', type: 'LIVE_VIEW', name: 'SOM Country Breakdown', timestamp: 'April 19, 2:14 PM', version: 'v1' },
    { id: 'a3', type: 'LIVE_VIEW', name: 'Competitor Presence — APAC SOM', timestamp: 'April 22, 10:03 AM', version: 'v1' },
    { id: 'a4', type: 'LIVE_VIEW', name: 'APAC SOM — Top Companies', timestamp: 'April 22, 10:08 AM', version: 'v1' },
    { id: 'a5', type: 'BRIEF', name: 'Phased Launch Recommendation — AU/SG First', timestamp: 'April 22, 10:09 AM', version: 'v1' },
    { id: 'a-cc-memo', type: 'BRIEF', name: 'Q2 Board Memo — APAC Expansion', timestamp: 'Today, 8:14 AM', version: 'v1', surface: 'mcp' },
    { id: 'a-memo-v2', type: 'BRIEF', name: 'Q2 Board Memo — APAC Expansion (v2)', timestamp: 'Today, 8:33 AM', version: 'v2' },
  ],
  'daily-triage': [
    { id: 'a1', type: 'LIVE_VIEW', name: 'Top 12 — Daily Triage', timestamp: 'April 25, 8:08 AM', version: 'v1' },
    { id: 'a2', type: 'LIVE_VIEW', name: 'Filtered: Renewals only', timestamp: 'April 25, 8:11 AM', version: 'v1' },
    {
      id: 'list-stale-renewals',
      type: 'LIST',
      name: 'Stale Renewal Risks',
      meta: '5 accounts · auto-recomputes · weekly Monday nudge',
      timestamp: 'April 25, 8:16 AM',
      version: 'v1',
      rerunable: true,
    },
    { id: 'a4', type: 'DRAFT', name: 'Outreach Sequence — Pulse / FinLine / Crowdcube (9 emails)', timestamp: 'April 25, 8:18 AM', version: 'v1' },
  ],
  'champion-tracker': [
    { id: 'a1', type: 'LIVE_VIEW', name: 'All Champions — 12', timestamp: 'April 25, 9:03 AM', version: 'v1' },
    {
      id: 'list-champion-watch',
      type: 'LIST',
      name: 'Champion Watch — Q2',
      meta: '12 champions · auto-recomputes · monthly nudge',
      timestamp: 'April 25, 9:07 AM',
      version: 'v1',
      rerunable: true,
    },
  ],
  'meridian-deal': [
    { id: 'a1', type: 'BRIEF', name: 'Meridian Cloud Pre-Call Brief', timestamp: 'April 25, 8:43 AM', version: 'v3' },
    { id: 'a2', type: 'BRIEF', name: 'Stakeholder Map — Meridian', timestamp: 'April 22', version: 'v2' },
    { id: 'a3', type: 'DRAFT', name: 'Meridian Cloud Follow-Up', timestamp: 'April 25, 9:03 AM', version: 'v1' },
    { id: 'a4', type: 'ANALYSIS', name: 'Last Call Transcript Summary', timestamp: 'April 18', version: 'v1' },
  ],
  'whitespace-fintech': [
    { id: 'a1', type: 'LIVE_VIEW', name: 'Initial whitespace — 20 companies', timestamp: 'April 25, 9:43 AM', version: 'v1' },
    { id: 'a2', type: 'LIVE_VIEW', name: 'Filtered: High propensity + Has signals', timestamp: 'April 25, 9:48 AM', version: 'v1' },
    {
      id: 'list-q2-fintech-hot',
      type: 'LIST',
      name: 'Q2 Fintech Hot Targets',
      meta: '5 displacement candidates · auto-recomputes',
      timestamp: 'April 25, 9:50 AM',
      version: 'v1',
      rerunable: true,
    },
  ],
  'h2-abm-ent': [
    { id: 'a1', type: 'SEGMENT', name: 'Enterprise SaaS Whitespace — Initial', timestamp: 'April 12', version: 'v1' },
    { id: 'a2', type: 'ANALYSIS', name: 'Net-New Accounts — Apr 24 batch', timestamp: 'April 24', version: 'v1' },
  ],
  'competitive-bombora': [
    { id: 'a1', type: 'ANALYSIS', name: 'Bombora Install Map — Initial', timestamp: 'April 17', version: 'v1' },
    { id: 'a2', type: 'SEGMENT', name: 'Bombora Displacement Targets', timestamp: 'April 25', version: 'v1' },
  ],
  'build-playbook-healthcare': [
    { id: 'a1', type: 'REPORT', name: 'Healthcare Play — Pre-Publish Simulation', timestamp: 'April 25, 11:26 AM', version: 'v1' },
    { id: 'a2', type: 'DECISION', name: 'Healthcare Displacement Play — v1.0 published', timestamp: 'April 25, 11:28 AM', version: 'v1' },
  ],
  'fintech-model-q2': [
    { id: 'a1', type: 'REPORT', name: 'Q2 Drift Investigation', timestamp: 'April 23', version: 'v1' },
    { id: 'a2', type: 'ANALYSIS', name: 'Holdout Performance Comparison', timestamp: 'April 23', version: 'v1' },
    { id: 'a3', type: 'DECISION', name: 'v2.1 Production Approval (pending)', timestamp: 'April 24', version: 'draft' },
    { id: 'a4', type: 'REPORT', name: 'Pre-Publish Validation Report', timestamp: 'April 25', version: 'v1' },
  ],
  'pacific-nw-routing': [
    { id: 'a1', type: 'ANALYSIS', name: 'PNW Territory Coverage Gap', timestamp: 'April 15', version: 'v1' },
    { id: 'a2', type: 'BRIEF', name: 'Routing Rule Change Proposal', timestamp: 'April 18', version: 'v2' },
    { id: 'a3', type: 'DECISION', name: 'PNW Routing — Approved by Jake', timestamp: 'April 25', version: 'v1' },
  ],
  'globaltech-prospect': [
    { id: 'a1', type: 'BRIEF', name: 'GlobalTech Account Brief', timestamp: 'April 20', version: 'v1' },
    { id: 'a2', type: 'DRAFT', name: 'GlobalTech Follow-Up', timestamp: 'April 25', version: 'v2' },
  ],
  'dataflow-new': [
    { id: 'a1', type: 'BRIEF', name: 'DataFlow Inc — Opportunity Brief', timestamp: 'Today', version: 'v1' },
  ],
  'q2-pipeline-prio': [
    { id: 'a1', type: 'ANALYSIS', name: 'Daily Signal Scan — Apr 25', timestamp: 'Today', version: 'v1' },
    { id: 'a2', type: 'BRIEF', name: 'Top 5 Plays — Today', timestamp: 'Today', version: 'v1' },
    { id: 'a3', type: 'DRAFT', name: 'Vertex Systems Outreach', timestamp: 'Yesterday', version: 'v1' },
    { id: 'a4', type: 'DRAFT', name: 'NovaTech Outreach', timestamp: 'Yesterday', version: 'v1' },
    { id: 'a5', type: 'DRAFT', name: 'DataBridge Outreach', timestamp: 'Yesterday', version: 'v1' },
    { id: 'a6', type: 'REPORT', name: 'Weekly Reply Rate Report', timestamp: 'Wednesday', version: 'v1' },
  ],
  'hubspot-integration': [
    { id: 'a1', type: 'REPORT', name: 'HubSpot Integration Status', timestamp: 'Today', version: 'v1' },
  ],
  'weekly-pipeline-health': [
    { id: 'a1', type: 'REPORT', name: 'Weekly Pipeline Health — Apr 25', timestamp: 'Today', version: 'v1' },
    { id: 'a2', type: 'ANALYSIS', name: 'Model Performance Trends', timestamp: 'Today', version: 'v1' },
  ],
};

export const THREAD_TIMELINES = {
  'fintech-icp-q2': [
    { date: 'Today 8:42 AM', event: 'Export plan drafted — awaiting confirmation' },
    { date: 'April 24', event: 'Priya approved v2.1 segment' },
    { date: 'April 23', event: 'Drift investigation — recommendation: tighten headcount floor' },
    { date: 'April 22', event: 'Q2 refresh built — 4,200 companies' },
    { date: 'April 22', event: 'Thread created' },
  ],
  'apac-tam': [
    { date: 'Today 4:21 PM', event: 'Replied to Priya on SAM definition' },
    { date: 'April 24', event: 'Priya joined as contributor' },
    { date: 'April 22', event: 'Company list generated — 12 of 1,840 surfaced' },
    { date: 'April 22', event: 'Competitor presence analyzed — ZoomInfo dominant, Apollo growing' },
    { date: 'April 19', event: 'SOM country breakdown — AU/SG drive 63%' },
    { date: 'April 19', event: 'Initial APAC TAM/SAM/SOM sized — 1,840 in SOM' },
    { date: 'April 19', event: 'Thread created' },
  ],
  'daily-triage': [
    { date: 'Today 8:18 AM', event: 'Top 3 action plays drafted' },
    { date: 'Today 8:16 AM', event: 'Pinned "Stale Renewal Risks" — recurring Monday nudge set' },
    { date: 'Today 8:15 AM', event: 'Filter applied: Last touched + Renewal window' },
    { date: 'Today 8:14 AM', event: 'Filter panel opened for refinement' },
    { date: 'Today 8:08 AM', event: 'Daily triage initiated — 247 accounts scanned' },
  ],
  'meridian-deal': [
    { date: 'Today 8:42 AM', event: 'Brief updated — stakeholder signal' },
    { date: 'April 24', event: 'Follow-up draft sent via Outreach' },
    { date: 'April 23', event: 'Call logged (Salesforce sync)' },
    { date: 'April 22', event: 'Stakeholder added: Marcus Reed (CFO)' },
    { date: 'April 18', event: 'Thread created' },
  ],
};

export const PARTICIPANT_PROFILES = {
  maya: { id: 'maya', name: 'Maya Patel', role: 'Marketing Strategist', initials: 'MP', color: '#A855F7' },
  jordan: { id: 'jordan', name: 'Jordan Chen', role: 'Account Executive', initials: 'JC', color: '#F97316' },
  priya: { id: 'priya', name: 'Priya Sharma', role: 'RevOps Manager', initials: 'PS', color: '#3B82F6' },
};
