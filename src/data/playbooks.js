// Playbooks the admin (Priya) has authored for OTHER personas to consume.
// Lifecycle states: Live (active and consumable), Draft (built but not
// activated), Paused (deactivated but not deleted), Archived (removed
// from sellers' view but retained for history).

export const PLAYBOOK_TYPES = {
  'Sales Play': {
    label: 'Sales Play',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-500/10',
    icon: 'play',
    consumedBy: 'AEs',
  },
  'Scoring Model': {
    label: 'Scoring Model',
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-500/10',
    icon: 'cpu',
    consumedBy: 'Marketing + AEs',
  },
  'Routing Configuration': {
    label: 'Routing Config',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-500/10',
    icon: 'git-branch',
    consumedBy: 'Inbound system',
  },
  Workflow: {
    label: 'Workflow',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10',
    icon: 'workflow',
    consumedBy: 'Auto-triggered',
  },
  'Account List': {
    label: 'Account List',
    color: 'text-cyan-700 dark:text-cyan-300',
    bg: 'bg-cyan-500/10',
    icon: 'list-checks',
    consumedBy: 'AEs',
  },
};

export const AUTHORED_PLAYBOOKS = [
  {
    id: 'sales-play-fintech-displacement',
    name: 'Q2 Fintech Displacement Play',
    type: 'Sales Play',
    description:
      'Activates when seller has fintech account with ZoomInfo or 6sense install. Pulls latest intent signals, drafts displacement outreach.',
    status: 'live',
    runsThisWeek: 14,
    activeUsers: 6,
    activeUserNames: ['Jordan Chen', 'Marcus Kim', '+4'],
    lastEdited: 'April 22',
    performance: '+34% reply rate vs control',
    performanceTrend: 'up',
    builtBy: { name: 'Priya Sharma', initials: 'PS', color: '#3B82F6' },
    publishedAt: 'April 22, 2:14 PM',
    audience: 'AEs in Fintech and Enterprise SaaS territories',
    triggers: [
      { kind: 'install', detail: 'Account has ZoomInfo OR 6sense installed' },
      { kind: 'icp', detail: 'Account matches Fintech Mid-Market segment' },
      { kind: 'signal', detail: 'Active competitor intent topic in last 30 days' },
    ],
    actions: [
      { kind: 'draft', detail: 'AI drafts 3-touch displacement sequence per account' },
      { kind: 'enrich', detail: 'Pulls latest install verification + intent score' },
      { kind: 'route', detail: "Adds to seller's Daily Triage if propensity > 70" },
    ],
    impact: {
      totalRuns: 14,
      totalDeals: 8,
      totalPipeline: '$1.2M',
      replyRate: '34%',
      vsBaseline: '+22pp vs unassisted',
    },
    usageByUser: [
      { name: 'Jordan Chen', initials: 'JC', color: '#F97316', role: 'AE', runs: 8, deals: 3, pipeline: '$420K', replyRate: 38 },
      { name: 'Marcus Kim', initials: 'MK', color: '#3B82F6', role: 'AE', runs: 4, deals: 2, pipeline: '$310K', replyRate: 36 },
      { name: 'James Chen', initials: 'JC', color: '#10B981', role: 'AE', runs: 2, deals: 1, pipeline: '$180K', replyRate: 30 },
      { name: 'Alex Rodriguez', initials: 'AR', color: '#A855F7', role: 'AE', runs: 0, deals: 0, pipeline: '—', replyRate: 0 },
    ],
    performanceHistory: [
      { period: 'Wk 1', runs: 4, replyRate: 28 },
      { period: 'Wk 2', runs: 8, replyRate: 31 },
      { period: 'Wk 3', runs: 11, replyRate: 33 },
      { period: 'Wk 4', runs: 14, replyRate: 34 },
    ],
    versions: [
      {
        version: 'v1.2',
        date: 'April 22',
        author: 'Priya Sharma',
        summary: 'Tightened ICP filter — added headcount ≥ 220 floor. Added 6sense to trigger conditions.',
        current: true,
      },
      {
        version: 'v1.1',
        date: 'April 12',
        author: 'Priya Sharma',
        summary: 'Added 3rd touch (Day 7 async option). Refined value prop on Day 0 email.',
      },
      {
        version: 'v1.0',
        date: 'March 28',
        author: 'Priya Sharma',
        summary: 'Initial publish. Single-touch ZoomInfo displacement only.',
      },
    ],
  },
  {
    id: 'scoring-fintech-v21',
    name: 'Customer Fit — Fintech v2.1',
    type: 'Scoring Model',
    description:
      'Latest fintech ICP scoring model — published April 24 after drift investigation. Headcount floor tightened, CDP signal demoted.',
    status: 'live',
    runsThisWeek: 247,
    activeUsers: 12,
    activeUserNames: ['Maya Patel', 'Marcus Kim', '+10'],
    lastEdited: 'April 24',
    performance: 'Precision 0.85 · Recall 0.81',
    performanceTrend: 'up',
    builtBy: { name: 'Priya Sharma', initials: 'PS', color: '#3B82F6' },
    publishedAt: 'April 24, 3:42 PM',
    audience: 'Marketing strategists + AEs scoring fintech accounts',
    triggers: [{ kind: 'on-demand', detail: 'Run on any account or company list' }],
    actions: [
      { kind: 'score', detail: 'Returns Customer Fit score 0–100 with tier (Very Good / Good / Medium / Low)' },
      { kind: 'explain', detail: 'Top contributing features per account' },
    ],
    impact: {
      totalRuns: 247,
      totalDeals: 18,
      totalPipeline: '$3.4M',
      replyRate: '—',
      vsBaseline: '+11% precision vs v1.0',
    },
    usageByUser: [
      { name: 'Maya Patel', initials: 'MP', color: '#A855F7', role: 'Strategist', runs: 89, deals: 0, pipeline: '—', replyRate: null, usageNote: 'Segment refresh + scoring' },
      { name: 'Marcus Kim', initials: 'MK', color: '#3B82F6', role: 'AE', runs: 42, deals: 8, pipeline: '$1.4M', replyRate: 32 },
      { name: 'Jordan Chen', initials: 'JC', color: '#F97316', role: 'AE', runs: 38, deals: 5, pipeline: '$890K', replyRate: 34 },
      { name: 'Alex Rodriguez', initials: 'AR', color: '#A855F7', role: 'AE', runs: 27, deals: 2, pipeline: '$320K', replyRate: 28 },
    ],
    performanceHistory: [
      { period: 'Wk 1', runs: 0, replyRate: 0, precision: 78 },
      { period: 'Wk 2', runs: 145, replyRate: 0, precision: 78 },
      { period: 'Wk 3', runs: 198, replyRate: 0, precision: 82 },
      { period: 'Wk 4', runs: 247, replyRate: 0, precision: 85 },
    ],
    versions: [
      { version: 'v2.1', date: 'April 24', author: 'Priya Sharma', summary: 'Tightened headcount floor to 220, demoted CDP signal weight. Approved by Maya.', current: true },
      { version: 'v2.0', date: 'April 22', author: 'Priya Sharma', summary: 'Q2 refresh — added Q1 closed-won signal. Drift detected on holdout.' },
      { version: 'v1.0', date: 'January 15', author: 'Priya Sharma', summary: 'Initial Q1 model.' },
    ],
  },
  {
    id: 'routing-pacific-nw',
    name: 'Pacific NW Routing Rules',
    type: 'Routing Configuration',
    description: 'Inbound lead routing for Pacific NW territory — re-routes based on company size + product interest.',
    status: 'live',
    runsThisWeek: 89,
    activeUsers: 4,
    activeUserNames: ['Inbound system'],
    lastEdited: 'April 25',
    performance: '34 leads routed, 0 mis-routes',
    performanceTrend: 'flat',
    builtBy: { name: 'Priya Sharma', initials: 'PS', color: '#3B82F6' },
    publishedAt: 'April 25, 9:30 AM',
    audience: 'Inbound system + 4 PNW SDRs',
    triggers: [
      { kind: 'inbound', detail: 'New inbound lead from Pacific NW IP geography or self-declared region' },
    ],
    actions: [
      { kind: 'route', detail: 'Match by company size + product interest, assign to matching SDR' },
      { kind: 'notify', detail: 'Slack notification to assigned rep within 90 seconds' },
    ],
    impact: {
      totalRuns: 89,
      totalDeals: 0,
      totalPipeline: '—',
      replyRate: 'N/A',
      vsBaseline: 'Mis-route rate 0% (down from 8%)',
    },
    usageByUser: [
      { name: 'Inbound System', initials: 'SYS', color: '#6B7280', role: 'Auto', runs: 89, deals: 0, pipeline: '—', replyRate: null, usageNote: 'Auto-triggered' },
    ],
    performanceHistory: [
      { period: 'Wk 1', runs: 18, replyRate: 0 },
      { period: 'Wk 2', runs: 22, replyRate: 0 },
      { period: 'Wk 3', runs: 26, replyRate: 0 },
      { period: 'Wk 4', runs: 23, replyRate: 0 },
    ],
    versions: [
      { version: 'v3.0', date: 'April 25', author: 'Priya Sharma', summary: 'Reassigned 34 in-flight leads to corrected reps. Approved by Jake (RVP).', current: true },
      { version: 'v2.0', date: 'February 12', author: 'Priya Sharma', summary: 'Added size-based weighting.' },
      { version: 'v1.0', date: 'October 2025', author: 'Priya Sharma', summary: 'Initial PNW routing rules.' },
    ],
  },
  {
    id: 'inbound-qual-workflow',
    name: 'Inbound Lead Qualification',
    type: 'Workflow',
    description:
      'Auto-scores every inbound lead, triggers fast-lane routing if Very Good fit. Built but not yet activated — pending HubSpot re-auth.',
    status: 'draft',
    runsThisWeek: 0,
    activeUsers: 0,
    activeUserNames: [],
    lastEdited: 'April 18',
    performance: 'Pending activation',
    performanceTrend: null,
    blockReason: 'HubSpot OAuth required',
    builtBy: { name: 'Priya Sharma', initials: 'PS', color: '#3B82F6' },
    publishedAt: null,
    audience: 'Auto-triggered, no manual users',
    pipeline: [
      { agent: 'corporate_linkage', capability: 'suggest' },
      { agent: 'intent_signal', capability: 'suggest' },
      { agent: 'account_research', capability: 'suggest' },
      { agent: 'email_draft', capability: 'draft' },
    ],
    audiencePolicies: [
      { key: 'tenured_ae', label: 'AEs ≥90d tenure', overrides: {} },
      { key: 'new_ae', label: 'AEs <90d tenure', overrides: { email_draft: 'draft' } },
    ],
    delivery: { channel: 'thread' },
    triggers: [{ kind: 'inbound', detail: 'Any new lead from form submission, demo request, or chat' }],
    actions: [
      { kind: 'score', detail: 'Score using Customer Fit — Fintech v2.1 model' },
      { kind: 'route', detail: 'Fast-lane to AE if Very Good (90+) within 60s; otherwise standard SDR queue' },
      { kind: 'enrich', detail: 'Pull firmographics + intent from HG + write back to CRM' },
    ],
    impact: {
      totalRuns: 0,
      totalDeals: 0,
      totalPipeline: '—',
      replyRate: '—',
      vsBaseline: 'Estimated 40 hrs/month saved on manual review',
    },
    usageByUser: [],
    performanceHistory: [],
    versions: [
      { version: 'v0.9 (draft)', date: 'April 18', author: 'Priya Sharma', summary: 'Workflow built and tested in staging. Awaiting HubSpot OAuth re-auth before activation.', current: true },
    ],
  },
  {
    id: 'apac-target-list',
    name: 'APAC Target Account List — Q2',
    type: 'Account List',
    description: '1,840 scored APAC fintech accounts in SOM. Paused pending Maya\'s SAM definition clarification.',
    status: 'paused',
    runsThisWeek: 0,
    activeUsers: 0,
    activeUserNames: [],
    lastEdited: 'April 19',
    performance: 'Paused — 12 of 1,840 actioned before pause',
    performanceTrend: null,
    pausedReason: 'Maya raised a SAM definition question — paused until clarified',
    pausedAt: 'April 24, 4:30 PM',
    builtBy: { name: 'Priya Sharma', initials: 'PS', color: '#3B82F6' },
    publishedAt: 'April 19, 5:20 PM',
    audience: 'AEs in APAC territories + Marketing for ABM',
    triggers: [{ kind: 'static', detail: 'Static list — refreshes manually on re-run' }],
    actions: [
      { kind: 'export', detail: 'Push to Salesforce Campaigns + LinkedIn Audiences' },
      { kind: 'tag', detail: 'Tag accounts as "APAC Q2 Outbound" in CRM' },
    ],
    impact: {
      totalRuns: 8,
      totalDeals: 1,
      totalPipeline: '$185K',
      replyRate: '—',
      vsBaseline: 'Identified 1,840 net-new accounts not in CRM',
    },
    usageByUser: [
      { name: 'Maya Patel', initials: 'MP', color: '#A855F7', role: 'Strategist', runs: 5, deals: 0, pipeline: '—', replyRate: null, usageNote: 'Whitespace seeding' },
      { name: 'Alex Rodriguez', initials: 'AR', color: '#A855F7', role: 'AE', runs: 3, deals: 1, pipeline: '$185K', replyRate: 22 },
    ],
    performanceHistory: [
      { period: 'Wk 1', runs: 4, replyRate: 0 },
      { period: 'Wk 2', runs: 4, replyRate: 0 },
      { period: 'Wk 3', runs: 0, replyRate: 0 },
      { period: 'Wk 4', runs: 0, replyRate: 0 },
    ],
    versions: [
      { version: 'v1.0', date: 'April 19', author: 'Priya Sharma', summary: 'Initial publish based on APAC TAM analysis. 1,840 accounts in SOM.', current: true },
    ],
  },
  {
    id: 'account-brief-flow',
    name: 'Account Brief',
    type: 'Workflow',
    description:
      "Tenant-contextualized account intelligence — 8-agent pipeline that combines HG firmographics, web research, SEC filings, and CRM 360 into a MEDDIC-framed brief. Gracefully degrades when CRM isn't connected.",
    status: 'live',
    runsThisWeek: 38,
    activeUsers: 11,
    activeUserNames: ['Jordan Chen', 'Riley Cooper', '+9'],
    lastEdited: 'May 8',
    performance: 'Avg run 6.4s · 100% success rate',
    performanceTrend: 'up',
    builtBy: { name: 'Priya Sharma', initials: 'PS', color: '#3B82F6' },
    publishedAt: 'April 26, 11:00 AM',
    audience: 'All AEs (auto-published to seller workspaces)',
    pipeline: [
      { agent: 'corporate_linkage', capability: 'suggest' },
      { agent: 'technographic', capability: 'suggest' },
      { agent: 'spend_intelligence', capability: 'suggest' },
      { agent: 'intent_signal', capability: 'suggest' },
      { agent: 'web_research', capability: 'suggest' },
      { agent: 'sec_financials', capability: 'suggest' },
      { agent: 'crm_360', capability: 'suggest' },
      { agent: 'kb_resource_search', capability: 'suggest' },
      { agent: 'meddic_compose', capability: 'suggest' },
    ],
    audiencePolicies: [
      { key: 'all_ae', label: 'All AEs', overrides: {} },
    ],
    delivery: { channel: 'thread' },
    triggers: [
      { kind: 'on-demand', detail: 'Seller invokes @account_brief in any thread' },
      { kind: 'background', detail: 'Auto-runs when account stage advances to Discovery' },
    ],
    actions: [
      { kind: 'enrich', detail: 'Pulls HG firmographics + technographics + intent + IT spend' },
      { kind: 'research', detail: 'Web news, leadership signals, hiring, SEC filings' },
      { kind: 'analyze', detail: 'CRM 360 — champion, multi-thread, activity, first-party signals' },
      { kind: 'compose', detail: 'MEDDIC roll-up with per-dimension evidence status' },
    ],
    impact: {
      totalRuns: 38,
      totalDeals: 0,
      totalPipeline: '—',
      replyRate: '—',
      vsBaseline: 'Saves ~28 minutes per account vs. manual research',
    },
    usageByUser: [
      { name: 'Jordan Chen', initials: 'JC', color: '#F97316', role: 'AE', runs: 14, deals: 0, pipeline: '—', replyRate: null },
      { name: 'Riley Cooper', initials: 'RC', color: '#10B981', role: 'AE', runs: 9, deals: 0, pipeline: '—', replyRate: null, usageNote: 'New AE — high adoption' },
      { name: 'Marcus Kim', initials: 'MK', color: '#3B82F6', role: 'AE', runs: 8, deals: 0, pipeline: '—', replyRate: null },
      { name: 'James Chen', initials: 'JC', color: '#10B981', role: 'AE', runs: 7, deals: 0, pipeline: '—', replyRate: null },
    ],
    performanceHistory: [
      { period: 'Wk 1', runs: 4, replyRate: 0 },
      { period: 'Wk 2', runs: 12, replyRate: 0 },
      { period: 'Wk 3', runs: 22, replyRate: 0 },
      { period: 'Wk 4', runs: 38, replyRate: 0 },
    ],
    versions: [
      { version: 'v2.0', date: 'May 8', author: 'Priya Sharma', summary: 'Restructured: 8-agent pipeline with web/SEC/CRM 360 + MEDDIC roll-up. Tenant-contextualized.', current: true },
      { version: 'v1.1', date: 'April 28', author: 'Priya Sharma', summary: 'Added Value Hypothesis as a final compose step.' },
      { version: 'v1.0', date: 'April 26', author: 'Priya Sharma', summary: 'Initial publish — 2-agent pipeline.' },
    ],
  },
  {
    id: 'opportunity-finder-flow',
    name: 'Opportunity Finder',
    type: 'Workflow',
    description:
      "Finds the top 20 accounts matching the tenant's ICP, ranked by intent surge + competitor presence. Powers the Workbench 'Growth play' tile. Cold-start friendly — no CRM required.",
    status: 'live',
    runsThisWeek: 14,
    activeUsers: 8,
    activeUserNames: ['Alex Chen', 'Jordan Chen', 'Maya Patel'],
    lastEdited: 'May 12',
    performance: 'Avg run 7.2s · 100% success',
    performanceTrend: 'up',
    builtBy: { name: 'Priya Sharma', initials: 'PS', color: '#3B82F6' },
    publishedAt: 'May 10, 9:00 AM',
    audience: 'All sellers in tenant',
    pipeline: [
      { agent: 'corporate_linkage', capability: 'suggest' },
      { agent: 'technographic', capability: 'suggest' },
      { agent: 'intent_signal', capability: 'suggest' },
      { agent: 'spend_intelligence', capability: 'suggest' },
      { agent: 'kb_resource_search', capability: 'suggest' },
      { agent: 'meddic_compose', capability: 'suggest' },
    ],
    audiencePolicies: [{ key: 'all_sellers', label: 'All sellers', overrides: {} }],
    delivery: { channel: 'thread' },
    triggers: [
      { kind: 'on-demand', detail: 'Seller activates "Opportunity Finder" from Workbench' },
      { kind: 'schedule', detail: 'Weekly refresh (Monday 6:00 AM) — delta highlighted' },
    ],
    actions: [
      { kind: 'analyze', detail: "Reads tenant ICP from TenantContext" },
      { kind: 'rank', detail: 'Scores ~200 candidates by combined Fit + Intent + Competitor overlap' },
      { kind: 'compose', detail: 'Top 20 with reasons-to-believe per account' },
    ],
    impact: {
      totalRuns: 14,
      totalDeals: 0,
      totalPipeline: '—',
      replyRate: '—',
      vsBaseline: 'Replaces ~3 hours of manual ICP filtering per run',
    },
    usageByUser: [
      { name: 'Alex Chen', initials: 'AC', color: '#0EA5E9', role: 'AE', runs: 4, deals: 0, pipeline: '—', replyRate: null, usageNote: 'PLG-onboarded' },
      { name: 'Jordan Chen', initials: 'JC', color: '#F97316', role: 'AE', runs: 6, deals: 0, pipeline: '—', replyRate: null },
      { name: 'Maya Patel', initials: 'MP', color: '#A855F7', role: 'Strategist', runs: 4, deals: 0, pipeline: '—', replyRate: null },
    ],
    performanceHistory: [
      { period: 'Wk 1', runs: 2, replyRate: 0 },
      { period: 'Wk 2', runs: 6, replyRate: 0 },
      { period: 'Wk 3', runs: 14, replyRate: 0 },
    ],
    versions: [
      { version: 'v1.0', date: 'May 10', author: 'Priya Sharma', summary: 'Initial publish — 5-agent pipeline + curated company pool.', current: true },
    ],
  },
  {
    id: 'crm-enrichment-flow',
    name: 'CRM Enrichment',
    type: 'Workflow',
    description:
      "Takes a saved company list and enriches the user's CRM with HG firmographics, tech installs, intent surge, and the user's Fit/Intent/Combined scores. The list lives in the thread; the writeback lands in Salesforce or HubSpot.",
    status: 'live',
    runsThisWeek: 6,
    activeUsers: 4,
    activeUserNames: ['Maya Patel', 'Marcus Kim', '+2'],
    lastEdited: 'May 2',
    performance: 'Avg run 18s · 100% write success on Salesforce; HubSpot blocked (re-auth)',
    performanceTrend: 'flat',
    builtBy: { name: 'Priya Sharma', initials: 'PS', color: '#3B82F6' },
    publishedAt: 'May 2, 10:30 AM',
    audience: 'Marketing strategists + AEs (Salesforce only until HubSpot re-auths)',
    pipeline: [
      { agent: 'corporate_linkage', capability: 'suggest' },
      { agent: 'technographic', capability: 'suggest' },
      { agent: 'spend_intelligence', capability: 'suggest' },
      { agent: 'intent_signal', capability: 'suggest' },
      { agent: 'crm_enrichment', capability: 'act' },
    ],
    audiencePolicies: [
      { key: 'all', label: 'All seats', overrides: {} },
      { key: 'new_user', label: 'New seats (<30d)', overrides: { crm_enrichment: 'draft' } },
    ],
    delivery: { channel: 'thread' },
    triggers: [
      { kind: 'on-demand', detail: 'Seller invokes from a saved list ("Mark for Enrichment")' },
      { kind: 'schedule', detail: 'Weekly refresh of standing lists (Monday 6:00 AM)' },
    ],
    actions: [
      { kind: 'enrich', detail: 'Pulls HG firmographics + tech installs + intent surge per company' },
      { kind: 'score', detail: "Applies the user's Fit + Intent scoring profile" },
      { kind: 'write', detail: 'Updates Salesforce / HubSpot account fields with structured data' },
    ],
    impact: {
      totalRuns: 12,
      totalDeals: 0,
      totalPipeline: '—',
      replyRate: '—',
      vsBaseline: 'Saves ~14 minutes per account vs. manual enrichment + scoring',
    },
    usageByUser: [
      { name: 'Maya Patel', initials: 'MP', color: '#A855F7', role: 'Strategist', runs: 4, deals: 0, pipeline: '—', replyRate: null },
      { name: 'Marcus Kim', initials: 'MK', color: '#3B82F6', role: 'AE', runs: 4, deals: 0, pipeline: '—', replyRate: null },
    ],
    performanceHistory: [
      { period: 'Wk 1', runs: 2, replyRate: 0 },
      { period: 'Wk 2', runs: 4, replyRate: 0 },
      { period: 'Wk 3', runs: 6, replyRate: 0 },
    ],
    versions: [
      { version: 'v1.0', date: 'May 2', author: 'Priya Sharma', summary: 'Initial publish — Salesforce-only writeback. HubSpot pending OAuth re-auth.', current: true },
    ],
  },
  {
    id: 'renewal-readiness-flow',
    name: 'Renewal Readiness Sweep',
    type: 'Workflow',
    description:
      'Background sweep that runs every Monday — scores expansion + renewal readiness for accounts within 90 days of renewal and posts a digest to the AE\'s thread + Slack DM.',
    status: 'live',
    runsThisWeek: 4,
    activeUsers: 6,
    activeUserNames: ['Jordan Chen', 'Marcus Kim', '+4'],
    lastEdited: 'April 24',
    performance: 'Avg 6 accounts/run · 0 misses last 4 weeks',
    performanceTrend: 'flat',
    builtBy: { name: 'Priya Sharma', initials: 'PS', color: '#3B82F6' },
    publishedAt: 'April 8, 9:00 AM',
    audience: 'AEs with active renewal book',
    pipeline: [
      { agent: 'intent_signal', capability: 'suggest' },
      { agent: 'renewal_readiness', capability: 'draft' },
      { agent: 'follow_up_drafting', capability: 'draft' },
    ],
    audiencePolicies: [
      { key: 'tenured_ae', label: 'AEs ≥90d tenure', overrides: {} },
      { key: 'new_ae', label: 'AEs <90d tenure', overrides: { follow_up_drafting: 'suggest' } },
    ],
    delivery: { channel: 'slack-dm' },
    triggers: [
      { kind: 'schedule', detail: 'Every Monday at 7:00 AM local' },
      { kind: 'signal', detail: 'Account renewal date within 90 days' },
    ],
    actions: [
      { kind: 'analyze', detail: 'Scans intent surge for renewal/competitor topics' },
      { kind: 'score', detail: 'Computes renewal readiness 0–100' },
      { kind: 'draft', detail: 'Drafts a renewal touchpoint email per flagged account' },
    ],
    impact: {
      totalRuns: 16,
      totalDeals: 4,
      totalPipeline: '$680K',
      replyRate: '—',
      vsBaseline: '+18% net retention vs unassisted comparison set',
    },
    usageByUser: [
      { name: 'Jordan Chen', initials: 'JC', color: '#F97316', role: 'AE', runs: 4, deals: 2, pipeline: '$240K', replyRate: null },
      { name: 'Marcus Kim', initials: 'MK', color: '#3B82F6', role: 'AE', runs: 4, deals: 1, pipeline: '$180K', replyRate: null },
    ],
    performanceHistory: [
      { period: 'Wk 1', runs: 4, replyRate: 0 },
      { period: 'Wk 2', runs: 4, replyRate: 0 },
      { period: 'Wk 3', runs: 4, replyRate: 0 },
      { period: 'Wk 4', runs: 4, replyRate: 0 },
    ],
    versions: [
      { version: 'v1.1', date: 'April 24', author: 'Priya Sharma', summary: 'Added new-AE downgrade for follow-up drafting.', current: true },
      { version: 'v1.0', date: 'April 8', author: 'Priya Sharma', summary: 'Initial weekly sweep.' },
    ],
  },
];

// Compact health metrics for the top of Priya's home view
export const CONFIG_HEALTH = {
  users: { value: 47, label: 'Active users', sub: '4 invited this week' },
  credits: { value: '$318K', label: 'Credits remaining', sub: 'of $1M Q2 pool · 32% used' },
  models: { value: 4, label: 'Live models', sub: '1 pending publish' },
  integrations: {
    value: '5 / 6',
    label: 'Integrations green',
    sub: 'HubSpot needs re-auth',
    accent: 'warning',
  },
};

export const RECENT_ACTIVITY = [
  { id: 'a1', timestamp: '12 min ago', actor: 'Jordan Chen', actorInitials: 'JC', actorColor: '#F97316', action: 'pinned', target: 'Stale Renewal Risks', targetType: 'list' },
  { id: 'a2', timestamp: '1 hr ago', actor: 'Maya Patel', actorInitials: 'MP', actorColor: '#A855F7', action: 'published', target: 'Customer Fit — Fintech v2.1', targetType: 'model' },
  { id: 'a3', timestamp: '2 hrs ago', actor: 'Jake Robinson', actorInitials: 'JR', actorColor: '#10B981', action: 'approved', target: 'Pacific NW Routing changes', targetType: 'config' },
  { id: 'a4', timestamp: 'Today, 8:42 AM', actor: 'System', actorInitials: 'SYS', actorColor: '#6B7280', action: 'flagged', target: 'HubSpot OAuth token expired', targetType: 'integration' },
  { id: 'a5', timestamp: 'Yesterday', actor: 'You', actorInitials: 'PS', actorColor: '#3B82F6', action: 'invited', target: '4 users (Q2 onboarding cohort)', targetType: 'users' },
  { id: 'a6', timestamp: 'Yesterday', actor: 'Maya Patel', actorInitials: 'MP', actorColor: '#A855F7', action: 'requested approval', target: 'Fintech v2.1 production publish', targetType: 'model' },
  { id: 'a7', timestamp: '2 days ago', actor: 'You', actorInitials: 'PS', actorColor: '#3B82F6', action: 'edited', target: 'Q2 Fintech Displacement Play', targetType: 'playbook' },
];

export function findPlaybookById(id) {
  return AUTHORED_PLAYBOOKS.find((p) => p.id === id) || null;
}

// Agentic playbooks are a subset that have an executable agent pipeline.
// The Workflow Studio reads from this list; sellers' @-autocomplete also
// surfaces the playbooks (alongside individual atomic agents).
export function listAgenticPlaybooks() {
  return AUTHORED_PLAYBOOKS.filter((p) => Array.isArray(p.pipeline) && p.pipeline.length > 0);
}

export function findAgenticPlaybookByHandle(handle) {
  // Convert "account_brief" handle → playbook id "account-brief-flow" etc.
  // We match by id starting with handle-with-dashes.
  const dashed = handle.replace(/_/g, '-');
  return AUTHORED_PLAYBOOKS.find(
    (p) => Array.isArray(p.pipeline) && (p.id === dashed || p.id.startsWith(`${dashed}-`))
  ) || null;
}
