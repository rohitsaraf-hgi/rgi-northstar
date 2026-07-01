// Market Analyzer Copilot — JTBD definitions + insight card fixtures.
//
// Source of truth: MACLAUDE.md v0.2 — 7-JTBD canonical set.
// Implemented today (P0): #1 Market Sizing, #4 Whitespace, #6 Displacement.
// Deferred (P1/P2): #2 Competitive Intelligence, #3 Partnership Mapping,
//                   #5 Account Prioritization, #7 ICP Segmentation library.
//
// Numbers stay consistent across JTBDs — a SAM of 18,200 in #1 = the
// ICP universe metric in #4. Don't introduce drift; the demo's
// credibility depends on it.
//
// Each JTBD includes:
//   id, title, persona, triggerPhrases     ← Phase 1 (intent classification)
//   parameters[]                            ← Phase 2 (extraction dialogue)
//   apiCallChain[]                          ← Phase 3 (mock API trace)
//   insightCard{}                           ← Phase 3 (rendered output)
//   soWhat{} + followUps[]                  ← Phase 4 (so what + actions)
//
// insightCard is open-ended — InsightCard.jsx renders whichever
// sections are present (metrics, tiers, competitorShare, etc.). New
// fixture shapes don't require component changes if they reuse an
// existing section key.

// ─── JTBD 1 — Market Sizing (TAM / SAM / SOM) ─────────────────────────

export const jtbd1 = {
  id: 1,
  persona: 'strategist',
  title: 'Market Sizing — TAM / SAM / SOM',
  shortTitle: 'Market Sizing',
  description: 'Size the addressable market by $ spend, account counts, competitor share and industry attractiveness.',
  triggerPhrases: [
    'size the market', 'analyze the market', 'market for', 'tam', 'sam', 'som',
    'how big is the market', 'market size', 'market analysis',
    'addressable market', 'opportunity size', 'product category market',
  ],
  parameters: [
    {
      key: 'category',
      promptText: 'What product or category are we sizing?',
      required: true,
      inputType: 'text',
      placeholder: 'e.g. Revenue Intelligence, CNAPP, Observability',
      defaultValue: 'Revenue Intelligence',
    },
    {
      key: 'industries',
      promptText: 'Which industries? (select up to 5)',
      required: true,
      inputType: 'multi-select',
      options: ['SaaS', 'FinTech', 'Healthcare', 'Manufacturing', 'Retail', 'Energy', 'Telecom', 'Media'],
      defaultValue: ['SaaS', 'FinTech', 'Healthcare', 'Manufacturing'],
    },
    {
      key: 'geography',
      promptText: 'Which geographies?',
      required: true,
      inputType: 'multi-select',
      options: ['North America', 'EMEA', 'APAC', 'LATAM', 'Global'],
      defaultValue: ['North America'],
    },
    {
      key: 'employeeMin',
      promptText: 'Minimum employee count for SOM?',
      required: true,
      inputType: 'single-select',
      options: ['50+', '200+', '500+', '1000+', '5000+'],
      defaultValue: '500+',
    },
    {
      key: 'revenueMin',
      promptText: 'Minimum annual revenue for SOM?',
      required: true,
      inputType: 'single-select',
      options: ['$10M+', '$50M+', '$100M+', '$500M+', '$1B+'],
      defaultValue: '$50M+',
    },
    {
      key: 'competitors',
      promptText: 'Specific competitors to overlay? (default: top 3 in category)',
      required: false,
      inputType: 'multi-select',
      options: ['Gong', 'Clari', 'Chorus', 'Outreach', 'Salesloft', '6sense'],
      defaultValue: ['Gong', 'Clari', 'Chorus'],
    },
  ],
  apiCallChain: [
    { tool: 'hg.list_intent_topics', source: 'intent',        purpose: 'Resolve category to HG taxonomy', mockDelay: 400, mockResult: '14 topics mapped' },
    { tool: 'hg.search_companies',   source: 'firmographic',  purpose: 'SAM count (industry + geo)',      mockDelay: 700, mockResult: '18,200 accounts' },
    { tool: 'hg.search_companies',   source: 'firmographic',  purpose: 'SOM (+ employee + revenue)',      mockDelay: 600, mockResult: '3,640 accounts' },
    { tool: 'hg.company_spend',      source: 'spend',         purpose: 'Aggregate $ TAM',                 mockDelay: 900, mockResult: '$2.4B' },
    { tool: 'hg.search_companies',   source: 'technographic', purpose: 'Competitor share within SOM',     mockDelay: 700, mockResult: '4 vendors' },
    { tool: 'hg.intent_category',    source: 'intent',        purpose: 'In-market subset of SOM',         mockDelay: 500, mockResult: '1,820 in-market' },
  ],
  insightCard: {
    title: 'Market Sizing: {category} · {geography}',
    metrics: [
      { label: 'TAM (IT spend)',  value: '$2.4B',  subtitle: 'total IT spend in category', highlight: true },
      { label: 'SAM (companies)', value: '18,200', subtitle: 'in {industries} · {geography}' },
      { label: 'SOM (companies)', value: '3,640',  subtitle: 'meeting {employeeMin} employees + {revenueMin}' },
    ],
    competitorShare: {
      title: 'Competitor share within SOM',
      total: 3640,
      slices: [
        { name: 'Gong',     share: 38, accountCount: 1380, color: 'rose' },
        { name: 'Clari',    share: 22, accountCount: 800,  color: 'amber' },
        { name: 'Chorus',   share: 12, accountCount: 440,  color: 'sky' },
        { name: 'Other',    share: 28, accountCount: 1020, color: 'gray' },
      ],
    },
    industryAttractiveness: {
      title: 'Industry attractiveness',
      rows: [
        { industry: 'SaaS',          somCount: 1400, competitorShare: 42, attractiveness: 'high',   note: 'large pocket; competitive' },
        { industry: 'FinTech',       somCount: 820,  competitorShare: 31, attractiveness: 'high',   note: 'high spend, mid-saturation' },
        { industry: 'Healthcare',    somCount: 680,  competitorShare: 18, attractiveness: 'medium', note: 'attackable — low saturation' },
        { industry: 'Manufacturing', somCount: 740,  competitorShare: 55, attractiveness: 'low',    note: 'displacement-first' },
      ],
    },
    spendTrend: {
      title: 'Category spend trend (12mo, indexed)',
      period: '12mo',
      dataPoints: [195, 198, 202, 207, 210, 215, 219, 224, 228, 231, 234, 240],
      deltaYoY: '+23%',
    },
    signals: ['HG Install Data', 'Firmographic Filter', 'IT Spend Signal', 'Intent Activity'],
    confidence: 'high',
  },
  soWhat: {
    opportunity: {
      headline: 'Healthcare is your most attackable pocket.',
      detail: '680 SOM accounts with only 18% competitor share — the highest opportunity-to-saturation ratio in the set.',
    },
    risk: {
      headline: 'Manufacturing is a displacement market, not greenfield.',
      detail: 'It looks large at 740 SOM accounts, but competitors hold 55%. Entering means displacement-first GTM, not new-logo acquisition.',
    },
    action: {
      headline: 'Lead the board with $ TAM and the SaaS + FinTech pocket.',
      detail: '1,400 + 820 SOM = 2,220 of 3,640 total. Frame as "$2.4B addressable spend, 60% of SOM in two attractive verticals" — not as a TAM percentage.',
    },
  },
  followUps: [
    { id: 'fu1-1', label: 'Drill into Healthcare opportunity',     action: 'refine',       payload: { dimension: 'industry', value: 'Healthcare' }, primary: true },
    { id: 'fu1-2', label: 'Build whitespace list in this market',  action: 'bridge',       payload: { jtbd: 4 } },
    { id: 'fu1-3', label: 'Show in-market accounts (SOM + intent)', action: 'bridge',      payload: { jtbd: 5 } },
    { id: 'fu1-4', label: 'Export as board slide',                 action: 'export',       payload: { format: 'pdf' } },
    { id: 'fu1-5', label: 'Save as ICP Segment',                   action: 'save-segment', payload: {} },
  ],
};

// ─── JTBD 4 — Whitespace Analysis ─────────────────────────────────────

export const jtbd4 = {
  id: 4,
  persona: 'revops',
  title: 'Whitespace Analysis',
  shortTitle: 'Whitespace',
  description: 'Find ICP accounts not in your CRM and not running a competitor — true net-new logo opportunity.',
  triggerPhrases: [
    'whitespace', 'white space', 'greenfield', 'open accounts', 'no competitor',
    'untapped', 'fresh accounts', 'open market', 'unworked accounts',
    'not in my crm', 'new logo opportunity',
  ],
  parameters: [
    {
      key: 'icp',
      promptText: 'Confirm or adjust your ICP — I\'ll use your saved one.',
      required: true,
      inputType: 'text',
      placeholder: 'e.g. Mid-market & Enterprise SaaS · NA · 200–5000 employees',
      defaultValue: 'Revenue Intelligence buyers · NA · 200–5000 employees · Salesforce installed',
      defaultLabel: 'Saved ICP',
    },
    {
      key: 'crmSource',
      promptText: 'Which CRM should I check for existing accounts?',
      required: true,
      inputType: 'single-select',
      options: ['Salesforce', 'HubSpot', 'Both'],
      defaultValue: 'Salesforce',
    },
    {
      key: 'excludedCompetitors',
      promptText: 'Which competitors should disqualify an account as whitespace?',
      required: true,
      inputType: 'multi-select',
      options: ['Gong', 'Clari', 'Chorus', 'Outreach', 'Salesloft', '6sense'],
      defaultValue: ['Gong', 'Clari', 'Chorus'],
    },
    {
      key: 'positiveSignals',
      promptText: 'Positive signals to prioritize within whitespace?',
      required: false,
      inputType: 'multi-select',
      options: ['High IT spend', 'Active intent', 'Recent funding', 'Headcount growth'],
      defaultValue: ['High IT spend', 'Active intent'],
    },
    {
      key: 'listSize',
      promptText: 'List size cap?',
      required: false,
      inputType: 'single-select',
      options: ['100', '500', '1000', '5000'],
      defaultValue: '500',
    },
  ],
  apiCallChain: [
    { tool: 'hg.search_companies',     source: 'firmographic',  purpose: 'ICP universe count',           mockDelay: 700, mockResult: '18,200 accounts' },
    { tool: 'mock.crm_exclusion',      source: 'contacts',      purpose: 'Remove accounts already in CRM', mockDelay: 500, mockResult: '12,400 not in CRM' },
    { tool: 'hg.search_companies',     source: 'technographic', purpose: 'Exclude competitor installs',  mockDelay: 600, mockResult: '7,800 whitespace' },
    { tool: 'hg.company_spend',        source: 'spend',         purpose: 'Category spend per account',   mockDelay: 900, mockResult: 'spend tiered' },
    { tool: 'hg.intent_category',      source: 'intent',        purpose: 'Tier 1 intent overlay',        mockDelay: 500, mockResult: '1,200 hot' },
  ],
  insightCard: {
    title: 'Whitespace · {icp}',
    metrics: [
      { label: 'ICP universe',     value: '18,200', subtitle: 'matching your saved ICP' },
      { label: 'Not in {crmSource}', value: '12,400', subtitle: 'net-new logo opportunity' },
      { label: 'True whitespace',  value: '7,800',  subtitle: 'not in CRM + no competitor installed', highlight: true },
    ],
    tiers: {
      title: 'Whitespace tiers',
      rows: [
        { name: 'Tier 1 — Hot',     criteria: 'Whitespace + active intent',                  count: 1200, color: 'emerald', action: 'Immediate AE-led outreach', emphasis: true },
        { name: 'Tier 2 — Warm',    criteria: 'Whitespace + high spend + ICP fit ≥ 70',      count: 2800, color: 'sky',     action: 'SDR sequence' },
        { name: 'Tier 3 — Nurture', criteria: 'Whitespace + moderate fit',                   count: 3800, color: 'amber',   action: 'Drip / revisit in 90d' },
      ],
    },
    spendDistribution: {
      title: 'Spend distribution across whitespace',
      bands: [
        { label: 'High ($1M+ IT spend)',   count: 1800, color: 'emerald' },
        { label: 'Medium ($250K–$1M)',     count: 3400, color: 'sky' },
        { label: 'Low (< $250K)',          count: 2600, color: 'amber' },
      ],
    },
    decayForecast: {
      title: 'Whitespace decay forecast',
      detail: 'Accounts projected to install a competitor and exit your whitespace pool.',
      next6mo: 940,
      next12mo: 1820,
    },
    signals: ['HG Install Data', 'Firmographic Filter', 'IT Spend Signal', 'Intent Activity'],
    confidence: 'high',
  },
  soWhat: {
    opportunity: {
      headline: 'Tier 1\'s 1,200 accounts are your whole-quarter focus.',
      detail: 'At 2–4% conversion, that yields 24–48 meetings from one tier — enough to fill an AE\'s pipeline target for the quarter.',
    },
    risk: {
      headline: 'Whitespace decays. 940 accounts will be gone in 6 months.',
      detail: 'Decay forecast shows competitors will install in 940 accounts inside 6 months and 1,820 in 12 months. Every quarter you delay measurably shrinks the addressable list.',
    },
    action: {
      headline: 'Warm Tier 2 in parallel — prevents the Q4 cliff.',
      detail: 'Enroll Tier 2 in lighter-touch automation now. When Tier 1 is fully worked, Tier 2 is already warm — you avoid the pipeline trough that comes from sequential rather than parallel tier work.',
    },
  },
  followUps: [
    { id: 'fu4-1', label: 'Push Tier 1 to Salesforce AE queue', action: 'export',       payload: { destination: 'salesforce', tier: 1 }, primary: true },
    { id: 'fu4-2', label: 'Enroll Tier 2 in Outreach',          action: 'export',       payload: { destination: 'outreach', tier: 2 } },
    { id: 'fu4-3', label: 'Find contacts for Tier 1',           action: 'extend',       payload: { feature: 'contact-search' } },
    { id: 'fu4-4', label: 'Save as ICP Segment',                action: 'save-segment', payload: {} },
    { id: 'fu4-5', label: 'Set whitespace decay alert',         action: 'alert',        payload: { type: 'whitespace_decay' } },
  ],
};

// ─── JTBD 6 — Displacement Targeting ──────────────────────────────────

export const jtbd6 = {
  id: 6,
  persona: 'revops',
  title: 'Displacement Targeting',
  shortTitle: 'Displacement',
  description: 'Identify a competitor\'s install base ready to switch — filtered by install age, usage intensity, and substitute intent.',
  triggerPhrases: [
    'go after', 'displace', "competitor's install base", 'displacement',
    'win against', 'steal accounts from', 'replace gong', 'switch from',
    'displacement campaign', 'rip and replace',
  ],
  parameters: [
    {
      key: 'competitor',
      promptText: 'Which competitor are we targeting?',
      required: true,
      inputType: 'single-select',
      options: ['Gong', 'Clari', 'Chorus', 'Outreach', 'Salesloft', '6sense'],
      defaultValue: 'Gong',
      defaultLabel: 'Detected from your message',
    },
    {
      key: 'icpScope',
      promptText: 'Full ICP or a saved segment?',
      required: false,
      inputType: 'single-select',
      options: ['Full ICP', 'Mid-market SaaS NA — new logo', 'EMEA enterprise — expansion', 'FinServ high-spend'],
      defaultValue: 'Mid-market SaaS NA — new logo',
    },
    {
      key: 'installAge',
      promptText: 'Minimum install age? (12mo standard — past first renewal)',
      required: false,
      inputType: 'single-select',
      options: ['6mo', '12mo', '18mo', '24mo'],
      defaultValue: '12mo',
    },
    {
      key: 'intensityFilter',
      promptText: 'Filter to accounts with declining usage intensity?',
      required: false,
      inputType: 'single-select',
      options: ['Yes — boost tier ranking when present', 'No — install age only'],
      defaultValue: 'Yes — boost tier ranking when present',
    },
    {
      key: 'intentTopic',
      promptText: 'Intent topic for substitute evaluation?',
      required: false,
      inputType: 'text',
      placeholder: 'e.g. Revenue Intelligence, Conversation Intelligence',
      defaultValue: 'Revenue Intelligence (category-level)',
    },
    {
      key: 'generateMessaging',
      promptText: 'Generate per-tier messaging templates?',
      required: false,
      inputType: 'single-select',
      options: ['Yes', 'No'],
      defaultValue: 'Yes',
    },
  ],
  apiCallChain: [
    { tool: 'hg.search_companies',     source: 'technographic', purpose: 'Competitor base within ICP',         mockDelay: 700, mockResult: '3,840 accounts' },
    { tool: 'hg.company_technographic',source: 'technographic', purpose: 'firstVerifiedDate + intensity trend',mockDelay: 900, mockResult: '2,610 aged' },
    { tool: 'hg.company_intent',       source: 'intent',        purpose: 'Active substitute intent',           mockDelay: 600, mockResult: '620 evaluating' },
    { tool: 'hg.company_fai',          source: 'fai',           purpose: 'Department ownership',               mockDelay: 700, mockResult: '180 IT-owned' },
    { tool: 'hg.company_spend',        source: 'spend',         purpose: 'Deal size proxy',                    mockDelay: 600, mockResult: 'tiered' },
    { tool: 'hg.company_contracts',    source: 'contracts',     purpose: 'GSI lock-in flag',                   mockDelay: 500, mockResult: '78 locked' },
  ],
  insightCard: {
    title: '{competitor} Displacement · {icpScope}',
    metrics: [
      { label: '{competitor} accounts in ICP',  value: '3,840', subtitle: 'total competitor base' },
      { label: 'Install age ≥ {installAge}',    value: '2,610', subtitle: 'past first renewal' },
      { label: 'Displacement-ready',            value: '620',   subtitle: 'aged + declining + intent', highlight: true },
    ],
    tiers: {
      title: 'Displacement tiers',
      rows: [
        {
          name: 'Immediate',
          criteria: 'Age >24mo + intensity declining + active intent',
          count: 180,
          color: 'rose',
          emphasis: true,
          avgDealSize: '$48K',
          winProbability: 'High',
          messaging:
            'Lead with adoption pain. "Teams like yours using {competitor} for 2+ years often see engagement drop at this stage." Pair with a value-audit offer.',
        },
        {
          name: 'Near-term',
          criteria: 'Age 18–24mo + intensity declining',
          count: 440,
          color: 'amber',
          avgDealSize: '$52K',
          winProbability: 'Medium',
          messaging:
            'Don\'t lead with pain — they don\'t feel it yet. Offer a benchmarking report: "See how peers at your stage use Revenue Intelligence." Plant the seed before renewal pain hits.',
        },
        {
          name: 'Pipeline',
          criteria: 'Age 12–18mo only',
          count: 1990,
          color: 'sky',
          avgDealSize: '$45K',
          winProbability: 'Low–medium',
          messaging:
            'Monitoring only. Mass outreach feels cold without a pain signal. Set alerts and graduate accounts to Near-term as intensity or intent signals develop.',
        },
      ],
    },
    lockInRisk: {
      title: 'Contract / GSI lock-in risk',
      gsiManaged: 78,
      percentOfImmediate: '43%',
      detail: '78 Immediate accounts are managed by a GSI (Accenture, Deloitte, EY) — adds friction to displacement. Plan for a parallel GSI conversation.',
    },
    departmentEntry: {
      title: 'Department ownership (entry point per Immediate)',
      total: 180,
      slices: [
        { label: 'IT-owned',       count: 64,  color: 'sky',    detail: 'CIO / VP Eng is the budget owner' },
        { label: 'Business-owned', count: 116, color: 'emerald', detail: 'CRO / VP Sales is the budget owner — your champion' },
        { label: 'Mixed',          count: 0,   color: 'gray',   detail: 'rare in this tier' },
      ],
    },
    signals: ['HG Install Data', 'Install Age (Tech Age)', 'Intent Activity', 'FAI Dissatisfaction', 'IT Spend Signal'],
    confidence: 'high',
  },
  soWhat: {
    opportunity: {
      headline: 'The 180 Immediate accounts deserve a named-account motion.',
      detail: 'Active pain + active substitute evaluation = the highest-conviction displacement bucket. Worth a custom campaign and AE-owned execution, not SDR mass-mail.',
    },
    risk: {
      headline: 'Do not mass-market the 1,990 Pipeline tier.',
      detail: 'They have install age but no current pain signal. Cold outreach will land flat and train the channel to ignore you. Monitor for signal changes instead.',
    },
    action: {
      headline: '116 Immediate accounts have the buyer on your side.',
      detail: 'In 116 of the 180 Immediate accounts, the competitor is owned by the CRO / VP Sales — not IT. They are not defending {competitor}. Lead with these, your champion is already in the budget seat.',
    },
  },
  followUps: [
    { id: 'fu6-1', label: 'Launch displacement campaign — push to Salesforce', action: 'export',       payload: { destination: 'salesforce' }, primary: true },
    { id: 'fu6-2', label: 'Generate messaging templates per tier',             action: 'extend',       payload: { feature: 'messaging' } },
    { id: 'fu6-3', label: 'Find champion contacts (business unit)',            action: 'extend',       payload: { feature: 'contact-search' } },
    { id: 'fu6-4', label: 'Set monthly tier-movement alert',                   action: 'alert',        payload: { type: 'tier_movement' } },
    { id: 'fu6-5', label: 'Save as displacement segment',                      action: 'save-segment', payload: { motion: 'displacement' } },
  ],
};

// ─── Registry + helpers ───────────────────────────────────────────────

export const JTBDS = [jtbd1, jtbd4, jtbd6];

export const JTBDS_BY_ID = JTBDS.reduce((acc, j) => {
  acc[j.id] = j;
  return acc;
}, {});

export function getJtbd(id) {
  return JTBDS_BY_ID[id] || null;
}

// All 7 JTBDs in the v0.2 canonical spec — including P1/P2 not yet
// implemented. Welcome state surfaces these as "coming soon" cards.
export const FULL_JTBD_INDEX = [
  { id: 1, title: 'Market Sizing — TAM / SAM / SOM',         persona: 'strategist', built: true,  priority: 'P0' },
  { id: 2, title: 'Competitive Intelligence',                persona: 'strategist', built: false, priority: 'P1' },
  { id: 3, title: 'Partnership & Ecosystem Mapping',         persona: 'strategist', built: false, priority: 'P2' },
  { id: 4, title: 'Whitespace Analysis',                     persona: 'revops',     built: true,  priority: 'P0' },
  { id: 5, title: 'Account Prioritization',                  persona: 'revops',     built: false, priority: 'P1' },
  { id: 6, title: 'Displacement Targeting',                  persona: 'revops',     built: true,  priority: 'P0' },
  { id: 7, title: 'ICP Segmentation (persistent library)',   persona: 'revops',     built: false, priority: 'P1' },
];
