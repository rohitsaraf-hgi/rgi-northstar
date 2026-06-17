// Per-persona workspace content: focus items, suggestions, ROI, notifications.

export const FOCUS_ITEMS = {
  maya: [
    {
      id: 'm-f1',
      kind: 'READY_TO_EXPORT',
      label: 'READY TO EXPORT',
      color: 'primary',
      threadId: 'fintech-icp-q2',
      threadName: 'Fintech Mid-Market — model drift resolved, LinkedIn export unblocked',
      context: 'Precision recovered to 0.85 with Priya. 1,132 accounts queued for LinkedIn Audiences.',
      timestamp: '2 hours ago',
      actions: [
        { label: 'Review', kind: 'ghost', threadId: 'fintech-icp-q2' },
        { label: 'Export Now', kind: 'primary', toast: 'Pushing 1,132 accounts to LinkedIn Audiences...' },
      ],
    },
    {
      id: 'm-f2',
      kind: 'NEEDS_INPUT',
      label: 'NEEDS INPUT',
      color: 'danger',
      threadId: 'apac-tam',
      threadName: 'Priya tagged you in APAC thread — new question on segment definition',
      context: 'Priya is asking whether SAM definition includes the modern tech-stack signal. Routing rules depend on the answer.',
      timestamp: '3 hours ago',
      actions: [{ label: 'See Question', kind: 'ghost', threadId: 'apac-tam' }],
    },
    {
      id: 'm-f3',
      kind: 'NEW_SIGNAL',
      label: 'NEW SIGNAL',
      color: 'warning',
      threadId: 'h2-abm-ent',
      threadName: '4 whitespace accounts added to H2 ABM list — ready for review',
      context: 'New net-new accounts: Voltio, Crestline, Northbeam, ParityFi — all match ICP, none in Salesforce.',
      timestamp: 'Today',
      actions: [{ label: 'Review Accounts', kind: 'ghost', threadId: 'h2-abm-ent' }],
    },
  ],
  jordan: [
    {
      id: 'j-f1',
      kind: 'NEEDS_INPUT',
      label: 'NEEDS INPUT',
      color: 'danger',
      threadId: 'meridian-deal',
      threadName: 'Meridian Cloud call in 47 min — brief updated with new stakeholder signal',
      context: 'Two stakeholders updated LinkedIn bios this week. New AI-driven GTM angle to lead with.',
      timestamp: '40 min ago',
      actions: [{ label: 'Open Brief', kind: 'ghost', threadId: 'meridian-deal' }],
    },
    {
      id: 'j-f2',
      kind: 'TRIAGE_READY',
      label: "TODAY'S TRIAGE",
      color: 'primary',
      threadId: 'daily-triage',
      threadName: '12 accounts ranked — 5 renewals, 5 prospects with intent, 2 health risks',
      context: 'Top action: Pulse Health expansion play (no outreach in 22 days, usage +67%).',
      timestamp: '8 min ago',
      actions: [{ label: 'Open Triage', kind: 'primary', threadId: 'daily-triage' }],
    },
    {
      id: 'j-f3',
      kind: 'NEW_SIGNAL',
      label: 'NEW SIGNAL',
      color: 'warning',
      threadId: 'dataflow-new',
      threadName: 'Sarah Chen joined DataFlow Inc as VP RevOps — Very Good ICP fit, not in pipeline',
      context: 'Sarah was a champion at her previous account. DataFlow is net-new for HG.',
      timestamp: 'Today',
      actions: [{ label: 'Open Thread', kind: 'ghost', threadId: 'dataflow-new' }],
    },
  ],
  riley: [], // Day-1 user — no focus items yet
  priya: [
    {
      id: 'p-f1',
      kind: 'ACTION_REQUIRED',
      label: 'ACTION REQUIRED',
      color: 'danger',
      threadId: 'fintech-model-q2',
      threadName: 'Fintech model drift — precision recovered to 0.85 — re-publish before Monday review?',
      context: 'Maya approved the v2.1 segment. Model is ready to push live.',
      timestamp: '2 hours ago',
      actions: [
        { label: 'Review', kind: 'ghost', threadId: 'fintech-model-q2' },
        { label: 'Publish', kind: 'primary', toast: 'Fintech v2.1 published to production' },
      ],
    },
    {
      id: 'p-f2',
      kind: 'READY_TO_EXECUTE',
      label: 'READY TO EXECUTE',
      color: 'primary',
      threadId: 'pacific-nw-routing',
      threadName: 'Pacific NW routing — Jake approved — 34 accounts ready to re-route',
      context: 'Routing change covers PNW SDR territory. Will redirect 34 in-flight inbound leads.',
      timestamp: '1 hour ago',
      actions: [{ label: 'Execute', kind: 'primary', toast: '34 accounts re-routed' }],
    },
    {
      id: 'p-f3',
      kind: 'BLOCKED',
      label: 'BLOCKED',
      color: 'warning',
      threadId: 'hubspot-integration',
      threadName: 'HubSpot token expired — LinkedIn exports blocked',
      context: 'OAuth token expired April 23. Re-auth required to unblock 3 active export jobs.',
      timestamp: 'Today',
      actions: [{ label: 'Fix Integration', kind: 'ghost', toast: 'Re-auth modal would open here' }],
    },
  ],
};

export const DISCOVERY_SUGGESTIONS = {
  maya: {
    icon: 'target',
    badge: 'Whitespace Analysis',
    headline: 'Your Fintech ICP segment is built — the next step most teams take is Whitespace Analysis',
    rationale: 'Find net-new companies that match your ICP but aren\'t in your CRM yet. Run one against your Fintech segment.',
    ctaLabel: 'Start Whitespace Analysis →',
    targetUseCase: 'whitespace',
  },
  jordan: {
    icon: 'trending-up',
    badge: 'Signal-Based',
    headline: '3 other accounts in your book showed the same intent signals as GlobalTech this week',
    rationale: 'Accounts: Vertex Systems, NovaTech Inc, DataBridge Co — all showing "CRM data enrichment" intent. Want to open a prospecting thread for all three?',
    ctaLabel: 'Start Prospecting Thread →',
    targetUseCase: 'signal-prioritization',
  },
  priya: {
    icon: 'cpu',
    badge: 'Inbound Routing',
    headline: 'Inbound Lead Qualification is configured but not activated',
    rationale: 'You have ~200 inbound leads/month being manually reviewed. Activation could reclaim 40 hours/month.',
    ctaLabel: 'Activate Now →',
    targetUseCase: 'inbound-qualification',
  },
  // Riley is a Day-1 user — no suggestions until they have signal history
};

export const QUICK_ACTIONS = {
  maya: [
    { label: 'Start a use case', icon: 'plus', target: '/use-cases' },
    { label: 'Build a new segment', icon: 'compass' },
    { label: 'Run a TAM analysis', icon: 'globe' },
    { label: 'View ROI dashboard', icon: 'bar-chart-3', target: '/roi' },
  ],
  jordan: [
    { label: 'Start a use case', icon: 'plus', target: '/use-cases' },
    { label: 'New prospecting thread', icon: 'target' },
    { label: 'Run a scoring model', icon: 'cpu' },
    { label: 'View ROI dashboard', icon: 'bar-chart-3', target: '/roi' },
  ],
  priya: [
    { label: 'Start a use case', icon: 'plus', target: '/use-cases' },
    { label: 'New prospecting thread', icon: 'target' },
    { label: 'Run a scoring model', icon: 'cpu' },
    { label: 'Check platform health', icon: 'activity' },
    { label: 'View ROI dashboard', icon: 'bar-chart-3', target: '/roi' },
  ],
};

export const ROI_DATA = {
  maya: {
    myValue: {
      stats: [
        { label: 'Hours reclaimed', value: '6.8 hrs' },
        { label: 'Segments built', value: '3' },
        { label: 'Whitespace surfaced', value: '127' },
        { label: 'Artifacts generated', value: '14' },
      ],
      narrative:
        "This week your Fintech ICP segment identified 127 net-new whitespace accounts. 12 are now in active pipeline. The model drift you flagged with Priya is resolved — precision back to 0.85. Your APAC segment has 1,840 scored accounts ready for outreach assignment — unblocking this is your highest-value next action.",
      timeline: [
        { date: 'Apr 25', event: 'Fintech v2.1 approved by Priya, ready to export' },
        { date: 'Apr 24', event: 'Headcount floor tightened, precision recovered to 0.85' },
        { date: 'Apr 23', event: 'Model drift flagged on v2.0 holdout' },
        { date: 'Apr 22', event: 'Q2 ICP refresh built — 4,200 companies' },
        { date: 'Apr 19', event: 'APAC TAM analysis kicked off' },
      ],
    },
  },
  jordan: {
    myValue: {
      stats: [
        { label: 'Hours reclaimed', value: '3.4 hrs' },
        { label: 'Accounts actioned', value: '12' },
        { label: 'Signals caught', value: '7' },
        { label: 'Artifacts generated', value: '9' },
      ],
      narrative:
        "This week you worked 8 accounts using signal-driven plays. 3 replied to signal-triggered outreach — 2x your baseline reply rate. You spent 23 minutes on pre-call prep across 4 calls. Sarah Chen's job change at DataFlow surfaced a net-new opportunity worth ~$80K ACV that wasn't in your pipeline. 4 accounts in your book have unacted intent spikes — want to queue plays for Monday?",
      timeline: [
        { date: 'Apr 25', event: 'Meridian Cloud pre-call brief generated, call at 10 AM' },
        { date: 'Apr 24', event: 'Sarah Chen job-change signal detected at DataFlow' },
        { date: 'Apr 23', event: 'GlobalTech follow-up drafted, queued for review' },
        { date: 'Apr 22', event: '5 accounts re-prioritized via signal scoring' },
      ],
    },
  },
  riley: {
    myValue: {
      stats: [
        { label: 'Hours reclaimed', value: '—' },
        { label: 'Accounts actioned', value: '—' },
        { label: 'Signals caught', value: '—' },
        { label: 'Artifacts generated', value: '—' },
      ],
      narrative:
        "You just joined the platform on April 30. Once you connect Salesforce and run your first Daily Account Triage, this dashboard will start tracking your reclaimed hours, accounts actioned, signals caught, and artifacts generated.",
      timeline: [{ date: 'Apr 30', event: 'Account created — pending Salesforce connection' }],
    },
  },
  priya: {
    myValue: {
      stats: [
        { label: 'Hours reclaimed', value: '11.2 hrs' },
        { label: 'Models maintained', value: '4' },
        { label: 'Routing changes', value: '2' },
        { label: 'Issues resolved', value: '6' },
      ],
      narrative:
        "This week the Fintech model drift was caught early and resolved before it hit production reporting. Pacific NW routing changes are approved and ready to execute — 34 accounts will be re-routed. HubSpot integration is the only outstanding blocker; the OAuth re-auth is a 5-minute fix. Inbound Qualification activation is your highest-leverage next move — 40 hrs/month of manual review savings.",
      timeline: [
        { date: 'Apr 25', event: 'Pacific NW routing approved by Jake' },
        { date: 'Apr 24', event: 'Fintech v2.1 — precision recovered to 0.85' },
        { date: 'Apr 23', event: 'HubSpot token expired, exports blocked' },
        { date: 'Apr 22', event: 'Q2 model drift investigation kicked off' },
      ],
    },
  },
  platformValue: {
    headline: [
      { label: 'Pipeline Influenced', value: '$2.1M', accent: 'primary' },
      { label: 'Net-New Accounts Identified', value: '127', accent: 'success' },
      { label: 'Hours Reclaimed', value: '340', accent: 'warning' },
      { label: 'New Pipeline from Platform', value: '34%', accent: 'primary' },
    ],
    accountsByUseCase: [
      { useCase: 'Whitespace Analysis', count: 127, max: 127 },
      { useCase: 'Signal-Based Prioritization', count: 98, max: 127 },
      { useCase: 'Account Scoring', count: 76, max: 127 },
      { useCase: 'Competitive Displacement', count: 47, max: 127 },
      { useCase: 'AI Sales Plays', count: 34, max: 127 },
      { useCase: 'TAM Analysis', count: 12, max: 127 },
    ],
    funnel: [
      { stage: '127 accounts identified', value: 127, sub: '' },
      { stage: '89 assigned to AEs', value: 89, sub: '70% assignment rate' },
      { stage: '34 opportunities created', value: 34, sub: '38% conversion to oppty' },
      { stage: '6 closed won', value: 6, sub: '$280K ARR' },
      { stage: '28 in active pipeline', value: 28, sub: '$1.82M ARR weighted' },
    ],
    workSmarter: [
      {
        label: 'Time to first meeting',
        before: { value: '14.6 days', tag: 'Baseline' },
        after: { value: '8.2 days', tag: 'Signal-triggered' },
      },
      {
        label: 'Outreach conversion',
        before: { value: '11%', tag: 'Non-assisted' },
        after: { value: '23%', tag: 'AI-assisted' },
      },
    ],
    expansionOpportunities: [
      {
        title: 'Inbound Lead Qualification not activated',
        detail: 'Could score ~200 leads/month and reclaim 40 hrs/month of manual review.',
      },
      {
        title: 'APAC segment built but not actioned',
        detail: '1,840 accounts awaiting outreach assignment. Largest unactioned cohort in the workspace.',
      },
    ],
  },
};

export const NOTIFICATIONS = {
  maya: {
    needsInput: [
      { threadId: 'apac-tam', text: 'Priya asked a clarifying question on SAM definition' },
      { threadId: 'fintech-icp-q2', text: 'Export plan ready for confirmation before push' },
    ],
    inMotion: [
      { threadId: 'h2-abm-ent', text: '4 whitespace accounts surfaced overnight', timestamp: '5:22 AM' },
      { threadId: 'competitive-bombora', text: 'Bombora install map refreshed', timestamp: 'Yesterday' },
      { threadId: 'fintech-icp-q2', text: 'Priya approved v2.1 — exports unblocked', timestamp: '2 hrs ago' },
    ],
    suggested: [
      { text: 'Start Whitespace Analysis on Fintech segment', target: 'whitespace' },
    ],
    digestPreview: {
      time: 'Tomorrow, 8:00 AM',
      title: 'Daily Digest — Saturday April 26',
      bullets: [
        '✅ Fintech Q2 segment exported to LinkedIn (1,132 accounts) and Salesforce Campaign (312 accounts)',
        '🟡 APAC TAM still awaiting your reply to Priya on SAM definition',
        '🆕 H2 ABM list grew by 4 net-new accounts overnight',
        '💡 Suggested next: Run Whitespace on the Enterprise SaaS segment',
      ],
    },
  },
  jordan: {
    needsInput: [
      { threadId: 'meridian-deal', text: 'Pre-call brief updated, call at 10 AM' },
      { threadId: 'globaltech-prospect', text: 'Follow-up draft awaiting review' },
    ],
    inMotion: [
      { threadId: 'dataflow-new', text: 'Sarah Chen job-change signal logged', timestamp: 'Today' },
      { threadId: 'q2-pipeline-prio', text: '5 plays queued for tomorrow', timestamp: 'Yesterday' },
      { threadId: 'meridian-deal', text: 'Stakeholder bio update detected', timestamp: '40 min ago' },
    ],
    suggested: [
      { text: '3 accounts show same intent signals as GlobalTech', target: 'signal-prioritization' },
    ],
    digestPreview: {
      time: 'Tomorrow, 8:00 AM',
      title: 'Daily Digest — Saturday April 26',
      bullets: [
        '☑️ Meridian Cloud call complete — follow-up auto-drafted',
        '🟢 GlobalTech follow-up sent at 8:30 AM',
        '🆕 DataFlow Inc surfaced as net-new opportunity (Sarah Chen signal)',
        '💡 Suggested next: Queue prospecting thread for 3 lookalike accounts',
      ],
    },
  },
  priya: {
    needsInput: [
      { threadId: 'fintech-model-q2', text: 'Fintech v2.1 ready for production publish' },
      { threadId: 'hubspot-integration', text: 'HubSpot OAuth re-auth required' },
    ],
    inMotion: [
      { threadId: 'pacific-nw-routing', text: 'Jake approved routing changes', timestamp: '1 hr ago' },
      { threadId: 'weekly-pipeline-health', text: 'Auto-report generated', timestamp: 'Today' },
      { threadId: 'fintech-model-q2', text: 'Maya approved v2.1 segment', timestamp: '2 hrs ago' },
    ],
    suggested: [
      { text: 'Activate Inbound Lead Qualification — 40 hrs/month savings', target: 'inbound-qualification' },
    ],
    digestPreview: {
      time: 'Tomorrow, 8:00 AM',
      title: 'Daily Digest — Saturday April 26',
      bullets: [
        '✅ Fintech v2.1 published to production',
        '✅ Pacific NW routing changes executed (34 accounts)',
        '🔴 HubSpot integration still blocked — re-auth pending',
        '💡 Suggested next: Activate Inbound Lead Qualification',
      ],
    },
  },
  riley: {
    needsInput: [],
    inMotion: [],
    suggested: [
      { text: 'Run your first Daily Account Triage', target: 'daily-account-triage' },
    ],
    digestPreview: {
      time: 'Tomorrow, 8:00 AM',
      title: 'Daily Digest — first one arrives once you connect Salesforce',
      bullets: [
        '⏳ Connect Salesforce to start receiving signal alerts',
        '⏳ Confirm your territory to populate Today\'s Focus',
        '💡 Suggested first step: Daily Account Triage',
      ],
    },
  },
};

export const TODAY_LABEL = 'Friday, April 25';
