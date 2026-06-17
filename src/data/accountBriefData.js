// Account Brief V2 fixtures — Acme Corp is the rich demo target.
// Lens: HG Insights selling Market Analyzer + Sales Copilot + Data Studio to
// a B2B SaaS GTM organization. Every external signal is interpreted through
// the lens of "would this make Acme buy HG's products?"

export const SELLER_CONTEXT = {
  name: 'HG Insights',
  products: ['Market Analyzer', 'Sales Copilot', 'Data Studio'],
  productLens: [
    'GTM tooling consolidation',
    'ICP scoring drift',
    'Whitespace identification',
    'Account intelligence',
    'Intent + tech install signal',
  ],
  painThesis:
    'GTM teams scaling past $1B revenue hit a wall: spreadsheet-driven account scoring decays, marketing and sales lose ICP alignment, and rep capacity is wasted on poor-fit accounts. HG consolidates 3-5 GTM data tools into one platform with a single ICP layer feeding both Marketing and Sales.',
};

// ===== Acme Corp — full fixture =====
const acmeFull = {
  account: {
    name: 'Acme Corp',
    url: 'acme.com',
    hq: 'Boston, MA',
    fai: {
      revenue: '$4.2B',
      revenueGrowth: '+14% YoY',
      headcount: '14,100',
      headcountGrowth: '+1,700 in 12mo',
      stage: 'Public (NYSE)',
      lastFunding: '—',
      hgIcpFit: 92,
    },
    parent: 'Acme Holdings',
    subsidiaries: 4,
  },

  painMatch: {
    headline:
      "Acme is a strong fit for HG. Q3 earnings called out 'GTM platform sprawl' as a margin headwind, the new CRO came from Snowflake (textbook HG buyer profile), and they have 12 open RevOps + Sales Ops roles. All three signals match HG's core thesis: GTM consolidation at scale.",
    bullets: [
      { evidence: 'SEC 10-Q Q3 2026 (filed Apr 28) — MD&A flags "tooling consolidation" as Q4 priority', source: 'SEC' },
      { evidence: 'CRO Marcus Liu joined from Snowflake (LinkedIn, Mar 14)', source: 'Web' },
      { evidence: '12 open RevOps + Sales Ops roles — strongest hiring signal in their book', source: 'Web · Jobs' },
      { evidence: 'Two competing GTM tools detected (ZoomInfo + 6sense) — consolidation opportunity', source: 'HG technographic' },
      { evidence: 'Active intent surge on "GTM platform consolidation" (+34pts in 14 days)', source: 'HG intent' },
    ],
  },

  businessSignals: [
    {
      dim: 'Revenue',
      value: '$4.2B',
      change: '+14% YoY',
      direction: 'up',
      note: 'Last 4 quarters: $3.6B → $3.8B → $4.0B → $4.2B. Acceleration in Q3.',
      productLensNote: 'Above $3B is where HG sees highest renewal expansion rates.',
    },
    {
      dim: 'Headcount',
      value: '14,100',
      change: '+1,700 (12mo)',
      direction: 'up',
      note: 'Mostly engineering (+800) and GTM (+540). GTM hiring is the strongest signal.',
      productLensNote: 'Sales Ops + RevOps team grew from 8 → 22 in 12 months. They have buyers.',
    },
    {
      dim: 'Geographic expansion',
      value: 'Dublin + Singapore',
      change: 'Both opened in 2026',
      direction: 'up',
      note: 'Dublin office (Jan) + Singapore office (Mar). International ARR up 28%.',
      productLensNote: 'Multi-region GTM = need for unified ICP across geos. HG strength.',
    },
    {
      dim: 'GTM department growth',
      value: '+68% headcount',
      change: 'RevOps + Sales Ops',
      direction: 'up',
      note: 'GTM tech budget up 22% YoY per earnings call commentary.',
      productLensNote: 'Strongest single signal — they are buying GTM tools right now.',
    },
    {
      dim: 'Profitability',
      value: '14.2% op margin',
      change: '-0.6pp YoY',
      direction: 'down',
      note: 'Margin compression flagged in Q3 — partly attributed to "GTM tooling complexity."',
      productLensNote: 'CFO will be receptive to consolidation pitch. Directly stated.',
    },
  ],

  account360Connected: {
    champion: {
      name: 'Sarah Chen',
      title: 'VP Revenue Operations',
      tenure: 'Joined Apr 2024 from Datadog',
      strength: 'Confirmed',
      note: 'Was an HG champion at Datadog ($340K ACV). Already familiar with the platform.',
    },
    multiThreaded: {
      value: true,
      count: 4,
      stakeholders: [
        { name: 'Sarah Chen', role: 'VP RevOps', engagement: 'Champion' },
        { name: 'Diana Park', role: 'CFO', engagement: 'Economic Buyer' },
        { name: 'Marcus Liu', role: 'CRO', engagement: 'Executive Sponsor' },
        { name: 'Priya Nair', role: 'Director Sales Ops', engagement: 'User' },
      ],
    },
    recentActivity: [
      { date: 'May 4', event: 'Demo call — 35 min with Sarah + Priya', sentiment: 'Positive' },
      { date: 'Apr 22', event: 'White paper download (ICP Drift)', sentiment: 'Neutral' },
      { date: 'Apr 15', event: 'Pricing page visits — 12 sessions over 8 days', sentiment: 'Positive' },
      { date: 'Apr 8', event: 'Discovery — Sarah + Diana', sentiment: 'Positive' },
    ],
    openConcerns: [
      { kind: 'pricing', detail: 'Diana asked about enterprise pricing tier — sent on May 6' },
      { kind: 'timeline', detail: 'Wants to close before Sept fiscal year — 4 months out' },
      { kind: 'integration', detail: 'Open question on Marketo bidirectional sync' },
    ],
    firstParty: {
      amplitude: '12 product page visits, 1 white paper download, 4 demo requests',
      marketo: 'In "Enterprise Nurture" campaign · 8/12 emails opened · 3 link clicks',
      segment: '14 sessions in last 30d · 3.4 avg pages/session',
    },
  },

  meddic: [
    {
      dim: 'Metrics',
      letter: 'M',
      status: 'Inferred',
      evidence: 'Q3 earnings: GTM tooling = $4.8M annual. HG can consolidate to $1.4M = $3.4M savings + 12% productivity lift (HG benchmark).',
      source: 'SEC + HG benchmark',
    },
    {
      dim: 'Economic Buyer',
      letter: 'E',
      status: 'Confirmed',
      evidence: 'Diana Park, CFO — directly engaged in the May 6 pricing conversation. Owns GTM tech budget per earnings call commentary.',
      source: 'CRM + SEC',
    },
    {
      dim: 'Decision Criteria',
      letter: 'D',
      status: 'Confirmed',
      evidence: 'Consolidation savings, time-to-value < 90 days, native Salesforce + Marketo integration, multi-region ICP support.',
      source: 'CRM (May 4 demo call notes)',
    },
    {
      dim: 'Decision Process',
      letter: 'D',
      status: 'Partial',
      evidence: 'Demo done, security review pending. Procurement step undefined. Diana = final approval. Target close: late August.',
      source: 'CRM',
    },
    {
      dim: 'Identify Pain',
      letter: 'I',
      status: 'Confirmed',
      evidence: 'GTM tooling sprawl explicitly named in Q3 earnings as a margin headwind. Sarah confirmed pain in demo: "ICP drift between marketing and sales costs us deals every quarter."',
      source: 'SEC + CRM',
    },
    {
      dim: 'Champion',
      letter: 'C',
      status: 'Confirmed',
      evidence: 'Sarah Chen — high engagement (5 touches in 30 days), previously championed HG at Datadog. Confidence: high.',
      source: 'CRM + LinkedIn',
    },
  ],

  recommendedAction: {
    headline:
      "Schedule a multi-stakeholder ROI call with Sarah, Diana, and Marcus — bring the GTM consolidation business case anchored on Q3 earnings.",
    bullets: [
      "Lead with Q3 earnings line: 'tooling consolidation' as Q4 priority — high-credibility opener",
      'Bring ROI model: $3.4M annual savings (ZoomInfo + 6sense displacement) vs HG enterprise pricing',
      'Skip pricing details until Diana joins the call — she controls the budget',
      'Target close: end of August (their fiscal year ends Sept 30)',
      'Risk: Marketo bidirectional sync still open — get technical PMG involved this week',
    ],
  },
};

// ===== Acme — CRM-disconnected variant =====
const acmeCRMMissing = {
  ...acmeFull,
  // CRM 360 becomes a stub with inferred fallbacks
  account360Connected: null,
  account360Inferred: {
    likelyChampions: [
      { name: 'Sarah Chen', title: 'VP Revenue Operations', confidence: 'high', source: 'LinkedIn — joined from Datadog where she championed HG' },
      { name: 'Priya Nair', title: 'Director Sales Operations', confidence: 'medium', source: 'LinkedIn' },
      { name: 'Marcus Liu', title: 'CRO', confidence: 'medium', source: 'LinkedIn — joined from Snowflake' },
    ],
    likelyEconomicBuyer: { name: 'Diana Park', title: 'CFO', source: 'Earnings call attribution' },
    note: 'No CRM activity visible. Champion + engagement signals shown are inferred from public sources only.',
  },
  // MEDDIC gets degraded — sections that needed CRM become Unknown
  meddic: acmeFull.meddic.map((d) => {
    if (['Champion', 'Decision Process', 'Decision Criteria'].includes(d.dim)) {
      return {
        ...d,
        status: d.dim === 'Champion' ? 'Inferred' : 'Unknown',
        evidence: d.dim === 'Champion'
          ? 'Sarah Chen (VP RevOps) likely — joined from Datadog where she was an HG champion. Public signals only.'
          : '— Connect Salesforce to populate',
        source: d.dim === 'Champion' ? 'LinkedIn' : '🔌 CRM required',
      };
    }
    return d;
  }),
  recommendedAction: {
    headline: 'Identify the champion first — reach out to Sarah Chen via warm intro (ex-Datadog) before sourcing other stakeholders.',
    bullets: [
      'Sarah Chen at Acme = high-confidence champion target (ex-Datadog HG buyer)',
      'Reference Q3 earnings line on tooling consolidation — high-credibility opener',
      'Once meeting is set, connect Salesforce to unlock the rest of MEDDIC',
      'Then validate Diana Park as Economic Buyer (CFO; owns GTM budget per earnings call)',
    ],
  },
};

// Get the brief data for a target. Returns the Acme fixture for "Acme" /
// "Acme Corp"; a degraded variant for anything else (still complete enough
// to demo).
export function getAccountBriefData(target, { hasCRM = true } = {}) {
  const normalized = (target || '').toLowerCase();
  const isAcme = normalized.includes('acme');
  const base = isAcme ? acmeFull : { ...acmeFull, account: { ...acmeFull.account, name: target || 'Target Account', url: '—' } };
  return hasCRM ? base : { ...(isAcme ? acmeCRMMissing : { ...acmeCRMMissing, account: { ...acmeCRMMissing.account, name: target || 'Target Account', url: '—' } }) };
}

export const MEDDIC_STATUS_TIERS = {
  Confirmed: { label: 'Confirmed', short: 'CONF', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
  Inferred: { label: 'Inferred', short: 'INF', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/30', dot: 'bg-blue-500' },
  Partial: { label: 'Partial', short: 'PART', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/30', dot: 'bg-amber-500' },
  Unknown: { label: 'Unknown', short: 'UNK', color: 'text-text-muted', bg: 'bg-text-muted/15', border: 'border-border', dot: 'bg-text-muted' },
};

export const MEDDIC_STATUS_CYCLE = ['Unknown', 'Inferred', 'Partial', 'Confirmed'];
