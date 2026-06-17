// Workbook · RGIF (Research-Grade Insights Framework) enrichment data.
//
// Powers the "Ask anything across my book" experience on /workbook. Each
// category exposes a curated set of canned questions. The valueFor(account, q)
// mapper returns a per-account cell value + a tone (good/amber/red) so the
// table can render a colored dot + the answer string.
//
// In production these come from the HG warehouse (install_global, intent_global,
// spend_absolute, company_locations) via the Python API. Here we hand-curate
// rich enrichment per account so the demo loop is provable end-to-end.

import { getFitFor, getAllFitFor, tierForScore } from './accountOfferingFit.js';
import { OFFERINGS } from './offerings.js';

// ----- Per-account RGIF enrichment -----
//
// One entry per account in Alex's book. Wiz is the tenant — Wiz competitors
// (Palo Alto, Lacework, Orca, etc.) appear as displacement targets; Wiz
// complementary tech (AWS, Snowflake, Okta) appears as install signals.

const ENRICHMENT = {
  'acct-jpmc': {
    installs: {
      'palo-alto-prisma': { present: true, intensity: 8.2, trend: 'declining' },
      'crowdstrike-falcon': { present: true, intensity: 9.1, trend: 'stable' },
      splunk: { present: true, intensity: 8.5, trend: 'declining' },
      okta: { present: true, intensity: 9.0 },
      snowflake: { present: true, intensity: 7.4, trend: 'growing' },
      datadog: { present: false },
      sailpoint: { present: true, intensity: 6.5, trend: 'stable' },
      cyera: { present: false },
    },
    clouds: ['AWS', 'Azure'],
    securityVendors: 14,
    edrVendors: 1,
    spend: { total: '$412M', security: '$48M', cloud: '$180M', iam: '$22M', network: '$15M' },
    spendTrend: 'growing',
    intent: ['CNAPP RFP', 'Cloud security posture', 'Zero Trust', 'Identity governance'],
    journey: 'Evaluation',
    naics: '522110',
    isFortune: true,
    isMultinational: true,
    lastFunding: null,
    crmStage: 'Stage 4 — Solution Validation',
    crmOwner: 'Alex Chen',
    lastEngagement: '4 days ago',
    engagement: { pricing_visits_14d: 7, comparison_research_30d: true },
    events: { last_funding_days_ago: null, ma_activity_last_year: false, breach_last_year: false, ai_spend_growing: false },
  },
  'acct-snowflake': {
    installs: {
      'palo-alto-prisma': { present: false },
      'crowdstrike-falcon': { present: true, intensity: 8.4, trend: 'stable' },
      splunk: { present: false },
      okta: { present: true, intensity: 8.8 },
      snowflake: { present: true, intensity: 10.0 },
      datadog: { present: true, intensity: 8.0, trend: 'stable' },
      sailpoint: { present: false },
      cyera: { present: false },
    },
    clouds: ['AWS', 'Azure', 'GCP'],
    securityVendors: 9,
    edrVendors: 1,
    spend: { total: '$98M', security: '$14M', cloud: '$52M', iam: '$5.2M', network: '$3.8M' },
    spendTrend: 'growing',
    intent: ['CNAPP', 'DSPM', 'cloud cybersecurity', 'kubernetes security'],
    journey: 'Research',
    naics: '511210',
    isFortune: false,
    isMultinational: true,
    lastFunding: null,
    crmStage: 'Stage 1 — Discovery',
    crmOwner: 'Alex Chen',
    lastEngagement: 'No outbound yet',
    engagement: { pricing_visits_14d: 4, comparison_research_30d: true },
    events: { last_funding_days_ago: 200, ma_activity_last_year: false, breach_last_year: false, ai_spend_growing: true },
  },
  'acct-acme': {
    installs: {
      'palo-alto-prisma': { present: false },
      'crowdstrike-falcon': { present: true, intensity: 8.0 },
      splunk: { present: false },
      okta: { present: true, intensity: 9.1 },
      snowflake: { present: false },
      datadog: { present: true, intensity: 7.2 },
      sailpoint: { present: false },
      cyera: { present: false },
    },
    clouds: ['AWS', 'Azure'],
    securityVendors: 7,
    edrVendors: 1,
    spend: { total: '$72M', security: '$10M', cloud: '$28M', iam: '$3.6M', network: '$2.4M' },
    spendTrend: 'stable',
    intent: ['CNAPP', 'Cloud security posture'],
    journey: 'Evaluation',
    naics: '334111',
    isFortune: true,
    isMultinational: false,
    lastFunding: null,
    crmStage: 'Stage 3 — Technical Eval',
    crmOwner: 'Alex Chen',
    lastEngagement: '9 days ago',
    engagement: { pricing_visits_14d: 8, comparison_research_30d: true },
    events: { last_funding_days_ago: null, ma_activity_last_year: false, breach_last_year: false, ai_spend_growing: false },
  },
  'acct-databricks': {
    installs: {
      'palo-alto-prisma': { present: false },
      'crowdstrike-falcon': { present: true, intensity: 7.8 },
      splunk: { present: false },
      okta: { present: true, intensity: 8.4 },
      snowflake: { present: false },
      datadog: { present: true, intensity: 9.0, trend: 'stable' },
      sailpoint: { present: false },
      cyera: { present: false },
      'orca-security': { present: true, intensity: 6.0, trend: 'declining' },
    },
    clouds: ['AWS', 'Azure', 'GCP'],
    securityVendors: 11,
    edrVendors: 1,
    spend: { total: '$58M', security: '$9.2M', cloud: '$24M', iam: '$3.4M', network: '$2.8M' },
    spendTrend: 'growing',
    intent: ['DSPM', 'kubernetes security', 'data security', 'CNAPP'],
    journey: 'Evaluation',
    naics: '511210',
    isFortune: false,
    isMultinational: true,
    lastFunding: 'Pre-IPO',
    crmStage: 'Stage 1 — Discovery',
    crmOwner: 'Alex Chen',
    lastEngagement: 'No outbound yet',
    engagement: { pricing_visits_14d: 9, comparison_research_30d: true },
    events: { last_funding_days_ago: null, ma_activity_last_year: false, breach_last_year: false, ai_spend_growing: true },
  },
  'acct-visa': {
    installs: {
      'palo-alto-prisma': { present: true, intensity: 8.4, trend: 'stable' },
      'crowdstrike-falcon': { present: true, intensity: 9.2 },
      splunk: { present: true, intensity: 7.6, trend: 'declining' },
      okta: { present: true, intensity: 8.6 },
      snowflake: { present: true, intensity: 6.5, trend: 'growing' },
      datadog: { present: false },
      sailpoint: { present: true, intensity: 7.2, trend: 'stable' },
      cyera: { present: false },
    },
    clouds: ['AWS', 'Azure'],
    securityVendors: 16,
    edrVendors: 1,
    spend: { total: '$385M', security: '$52M', cloud: '$160M', iam: '$24M', network: '$18M' },
    spendTrend: 'stable',
    intent: ['CIEM', 'cloud IAM audit', 'identity governance'],
    journey: 'Research',
    naics: '522320',
    isFortune: true,
    isMultinational: true,
    lastFunding: null,
    crmStage: 'Customer — Renewal Pending',
    crmOwner: 'Alex Chen',
    lastEngagement: '12 days ago',
  },
  'acct-mastercard': {
    installs: {
      'palo-alto-prisma': { present: true, intensity: 7.8, trend: 'stable' },
      'crowdstrike-falcon': { present: true, intensity: 8.6 },
      splunk: { present: true, intensity: 8.0, trend: 'declining' },
      okta: { present: true, intensity: 8.3 },
      snowflake: { present: true, intensity: 7.0, trend: 'growing' },
      datadog: { present: false },
      sailpoint: { present: true, intensity: 8.1, trend: 'growing' },
      cyera: { present: false },
    },
    clouds: ['AWS', 'Azure'],
    securityVendors: 14,
    edrVendors: 1,
    spend: { total: '$320M', security: '$42M', cloud: '$140M', iam: '$20M', network: '$14M' },
    spendTrend: 'growing',
    intent: ['CIEM', 'IAM audit', 'over-permissioned access'],
    journey: 'Evaluation',
    naics: '522320',
    isFortune: true,
    isMultinational: true,
    lastFunding: null,
    crmStage: 'Stage 2 — Qualified',
    crmOwner: 'Alex Chen',
    lastEngagement: '6 days ago',
  },
  'acct-datadog': {
    installs: {
      'palo-alto-prisma': { present: false },
      'crowdstrike-falcon': { present: true, intensity: 8.0 },
      splunk: { present: false },
      okta: { present: true, intensity: 8.5 },
      snowflake: { present: false },
      datadog: { present: true, intensity: 10.0 },
      sailpoint: { present: false },
      cyera: { present: false },
    },
    clouds: ['AWS', 'GCP'],
    securityVendors: 8,
    edrVendors: 1,
    spend: { total: '$92M', security: '$13M', cloud: '$40M', iam: '$4.4M', network: '$3.2M' },
    spendTrend: 'growing',
    intent: ['container security', 'kubernetes security'],
    journey: 'Research',
    naics: '511210',
    isFortune: false,
    isMultinational: true,
    lastFunding: null,
    crmStage: 'No open deal',
    crmOwner: 'Alex Chen',
    lastEngagement: '21 days ago',
  },
  'acct-spotify': {
    installs: {
      'palo-alto-prisma': { present: false },
      'crowdstrike-falcon': { present: true, intensity: 7.2 },
      splunk: { present: false },
      okta: { present: true, intensity: 8.0 },
      snowflake: { present: false },
      datadog: { present: true, intensity: 8.4 },
      sailpoint: { present: false },
      cyera: { present: false },
    },
    clouds: ['GCP'],
    securityVendors: 9,
    edrVendors: 1,
    spend: { total: '$76M', security: '$8.8M', cloud: '$30M', iam: '$3.2M', network: '$2.6M' },
    spendTrend: 'stable',
    intent: ['kubernetes security'],
    journey: 'Research',
    naics: '511210',
    isFortune: false,
    isMultinational: true,
    lastFunding: null,
    crmStage: 'No open deal',
    crmOwner: 'Alex Chen',
    lastEngagement: '34 days ago',
  },
  'acct-block': {
    installs: {
      'palo-alto-prisma': { present: false },
      'crowdstrike-falcon': { present: true, intensity: 8.5 },
      splunk: { present: false },
      okta: { present: true, intensity: 8.8 },
      snowflake: { present: true, intensity: 8.2, trend: 'growing' },
      datadog: { present: true, intensity: 7.8 },
      sailpoint: { present: false },
      cyera: { present: false },
    },
    clouds: ['AWS', 'GCP'],
    securityVendors: 11,
    edrVendors: 1,
    spend: { total: '$112M', security: '$15M', cloud: '$48M', iam: '$5.8M', network: '$3.6M' },
    spendTrend: 'growing',
    intent: ['DSPM', 'data security', 'CIEM'],
    journey: 'Research',
    naics: '522210',
    isFortune: false,
    isMultinational: false,
    lastFunding: null,
    crmStage: 'Stage 1 — Discovery',
    crmOwner: 'Alex Chen',
    lastEngagement: '3 days ago',
  },
  'acct-stripe': {
    installs: {
      'palo-alto-prisma': { present: false },
      'crowdstrike-falcon': { present: true, intensity: 9.0 },
      splunk: { present: false },
      okta: { present: true, intensity: 9.4 },
      snowflake: { present: true, intensity: 8.6 },
      datadog: { present: true, intensity: 8.4 },
      sailpoint: { present: false },
      cyera: { present: false },
    },
    clouds: ['AWS', 'GCP'],
    securityVendors: 13,
    edrVendors: 1,
    spend: { total: '$148M', security: '$22M', cloud: '$62M', iam: '$8.4M', network: '$4.8M' },
    spendTrend: 'growing',
    intent: ['CNAPP', 'CIEM', 'DSPM'],
    journey: 'Evaluation',
    naics: '522390',
    isFortune: false,
    isMultinational: true,
    lastFunding: null,
    crmStage: 'Stage 3 — Technical Eval',
    crmOwner: 'Alex Chen',
    lastEngagement: '2 days ago',
  },
  'acct-pinterest': {
    installs: {
      'palo-alto-prisma': { present: false },
      'crowdstrike-falcon': { present: true, intensity: 7.0 },
      splunk: { present: false },
      okta: { present: true, intensity: 7.8 },
      snowflake: { present: false },
      datadog: { present: true, intensity: 7.5 },
      sailpoint: { present: false },
      cyera: { present: false },
    },
    clouds: ['AWS'],
    securityVendors: 8,
    edrVendors: 1,
    spend: { total: '$52M', security: '$6.8M', cloud: '$22M', iam: '$2.6M', network: '$2.1M' },
    spendTrend: 'stable',
    intent: [],
    journey: 'None',
    naics: '511210',
    isFortune: false,
    isMultinational: false,
    lastFunding: null,
    crmStage: 'Customer — Onboarding stalled',
    crmOwner: 'Alex Chen',
    lastEngagement: '23 days ago',
  },
  'acct-cloudflare': {
    installs: {
      'palo-alto-prisma': { present: false },
      'crowdstrike-falcon': { present: true, intensity: 8.4 },
      splunk: { present: false },
      okta: { present: true, intensity: 8.6 },
      snowflake: { present: false },
      datadog: { present: true, intensity: 7.6 },
      sailpoint: { present: false },
      cyera: { present: false },
    },
    clouds: ['AWS', 'Azure', 'GCP'],
    securityVendors: 10,
    edrVendors: 1,
    spend: { total: '$84M', security: '$11M', cloud: '$36M', iam: '$4.2M', network: '$3.0M' },
    spendTrend: 'growing',
    intent: ['kubernetes security', 'cloud edge security'],
    journey: 'Research',
    naics: '511210',
    isFortune: false,
    isMultinational: true,
    lastFunding: null,
    crmStage: 'No open deal',
    crmOwner: 'Alex Chen',
    lastEngagement: '14 days ago',
  },
};

export function getRGIF(accountId) {
  if (ENRICHMENT[accountId]) return ENRICHMENT[accountId];
  return _whitespaceRGIFGetter(accountId) || null;
}

// Wired from main.jsx to avoid circular import.
let _whitespaceRGIFGetter = () => null;
export function wireWhitespaceRGIFGetter(getWhitespaceRGIF) {
  if (typeof getWhitespaceRGIF === 'function') _whitespaceRGIFGetter = getWhitespaceRGIF;
}

// ----- Categories + canned questions -----

export const RGIF_CATEGORIES = [
  {
    id: 'firm',
    icon: '🏢',
    name: 'Firmographics',
    color: '#6366f1',
    desc: 'Company profile, size, industry, locations, corporate structure',
    questions: [
      'What is the company\'s annual revenue?',
      'How many employees does this account have?',
      'Where is this company headquartered?',
      'What industry vertical is this company in?',
      'Is this a Fortune 1000 company?',
      'Is this a multinational company?',
      'What is the NAICS code?',
    ],
  },
  {
    id: 'tech',
    icon: '⚙️',
    name: 'Technographics',
    color: '#3b7ff5',
    desc: 'Product installs, vendor presence, intensity scores, install trends',
    questions: [
      'Do they have Palo Alto Prisma Cloud installed?',
      'Do they have CrowdStrike Falcon installed?',
      'Do they have Splunk installed?',
      'Do they have Okta installed?',
      'Do they have Snowflake installed?',
      'Do they have Datadog installed?',
      'Are they running multi-cloud infrastructure?',
      'How many distinct security vendors does this account have?',
      'Is Palo Alto Prisma intensity declining at this account?',
      'Is Splunk intensity declining at this account?',
      'What cloud platforms are they using?',
    ],
  },
  {
    id: 'spend',
    icon: '💰',
    name: 'IT Spend',
    color: '#0fb87a',
    desc: '12-month forward-looking spend forecasts across 140 IT categories',
    questions: [
      'What is the total IT spend for this account?',
      'How much does this account spend on security tools annually?',
      'What is the cloud infrastructure spend?',
      'What is the identity and access management spend?',
      'What is the network security spend?',
      'Is security spend growing or declining at this account?',
    ],
  },
  {
    id: 'intent',
    icon: '🎯',
    name: 'Intent & Signals',
    color: '#f5a623',
    desc: 'Buyer research behavior, active intent topics, and buyer journey stage',
    questions: [
      'Is this account actively researching CNAPP?',
      'Are they researching DSPM solutions?',
      'Are they researching CIEM / identity governance?',
      'What buyer journey stage are they in?',
      'How many active intent topics does this account have?',
      'Are they researching Wiz competitors?',
    ],
  },
  {
    id: 'scoring',
    icon: '📊',
    name: 'Scoring & Fit',
    color: '#8b67f0',
    desc: 'Per-offering ICP alignment, fit scores, displacement readiness',
    questions: [
      'What is the CNAPP fit score for this account?',
      'What is the CIEM fit score?',
      'What is the DSPM fit score?',
      'What is the best-fit offering for this account?',
      'Is this account ready for competitive displacement?',
      'What is the cross-sell opportunity score?',
    ],
  },
  {
    id: 'fp',
    icon: '🔗',
    name: 'First-Party',
    color: '#0ec4b4',
    desc: 'CRM deal data, engagement history, territory and ownership signals',
    questions: [
      'What is the current CRM deal stage?',
      'Who owns this account?',
      'When was the last meaningful engagement?',
      'What is the next renewal date?',
    ],
  },
  {
    id: 'offerings',
    icon: '📦',
    name: 'Offerings',
    color: '#ec4899',
    desc: 'Multi-offering fit and cross-sell potential across the Wiz portfolio',
    questions: [
      'Which Wiz offering is the strongest fit for this account?',
      'Does this account fit multiple Wiz offerings?',
      'Is this account a CNAPP-first or DSPM-first opportunity?',
      'Is there cross-sell potential beyond the current offering?',
      'Which whitespace accounts have A-tier CNAPP fit?',
      'Which whitespace accounts show displacement-ready competitor signals?',
    ],
  },
];

export const RGIF_CATEGORY_BY_ID = Object.fromEntries(RGIF_CATEGORIES.map((c) => [c.id, c]));

// ----- The NL value mapper -----
//
// Returns { value, tone, raw } per account for a given question. Tones:
//   'good'   — green dot (positive signal)
//   'amber'  — amber dot (mixed)
//   'red'    — red dot (negative or no data)
//   'neutral'— gray dot (informational)

function matchInstalled(rgif, key) {
  const x = rgif?.installs?.[key];
  if (!x) return { value: 'Not installed', tone: 'red' };
  if (!x.present) return { value: 'Not installed', tone: 'red' };
  let trendIcon = '';
  if (x.trend === 'declining') trendIcon = ' ⬇';
  else if (x.trend === 'growing') trendIcon = ' ⬆';
  return { value: `Yes · ${x.intensity}/10${trendIcon}`, tone: x.trend === 'declining' ? 'amber' : 'good' };
}

function valueFor(account, question) {
  const q = question.toLowerCase();
  const rgif = getRGIF(account.id);
  if (!rgif) return { value: 'No data', tone: 'red' };

  // Firmographics
  if (q.includes('revenue')) return { value: account.fai.revenue, tone: 'good', raw: account.fai.revenue };
  if (q.includes('employees')) return { value: account.fai.employees, tone: 'good', raw: account.fai.employees };
  if (q.includes('headquartered') || q.includes('hq')) return { value: account.fai.hq, tone: 'good' };
  if (q.includes('industry') || q.includes('vertical')) return { value: account.industry, tone: 'good' };
  if (q.includes('fortune')) return rgif.isFortune ? { value: 'Yes — Fortune 1000', tone: 'good' } : { value: 'Not in Fortune 1000', tone: 'red' };
  if (q.includes('multinational')) return rgif.isMultinational ? { value: 'Multinational ✓', tone: 'good' } : { value: 'Single-country', tone: 'amber' };
  if (q.includes('naics')) return { value: rgif.naics, tone: 'neutral' };

  // Technographics — installs
  if (q.includes('palo alto')) {
    if (q.includes('declin')) {
      const inst = rgif.installs['palo-alto-prisma'];
      if (!inst?.present) return { value: 'Not installed', tone: 'red' };
      return inst.trend === 'declining' ? { value: `⬇ Declining (${inst.intensity}/10)`, tone: 'amber' } : { value: `Stable (${inst.intensity}/10)`, tone: 'good' };
    }
    return matchInstalled(rgif, 'palo-alto-prisma');
  }
  if (q.includes('crowdstrike')) return matchInstalled(rgif, 'crowdstrike-falcon');
  if (q.includes('splunk')) {
    if (q.includes('declin')) {
      const inst = rgif.installs.splunk;
      if (!inst?.present) return { value: 'Not installed', tone: 'red' };
      return inst.trend === 'declining' ? { value: `⬇ Declining (${inst.intensity}/10)`, tone: 'amber' } : { value: `Stable (${inst.intensity}/10)`, tone: 'good' };
    }
    return matchInstalled(rgif, 'splunk');
  }
  if (q.includes('okta')) return matchInstalled(rgif, 'okta');
  if (q.includes('snowflake')) return matchInstalled(rgif, 'snowflake');
  if (q.includes('datadog')) return matchInstalled(rgif, 'datadog');
  if (q.includes('multi-cloud') || q.includes('multi cloud')) {
    const n = rgif.clouds.length;
    return n >= 2 ? { value: `${n} clouds`, tone: 'good' } : { value: 'Single cloud', tone: 'amber' };
  }
  if (q.includes('cloud platform')) return { value: rgif.clouds.join(', '), tone: 'good' };
  if (q.includes('security vendor')) {
    const n = rgif.securityVendors;
    return { value: `${n} vendors`, tone: n > 12 ? 'amber' : 'good', raw: n };
  }

  // Spend
  if (q.includes('total it spend')) return { value: rgif.spend.total, tone: 'good' };
  if (q.includes('security') && q.includes('spend')) return { value: `${rgif.spend.security}/yr`, tone: 'good' };
  if (q.includes('cloud') && q.includes('spend')) return { value: `${rgif.spend.cloud}/yr`, tone: 'good' };
  if (q.includes('identity') && q.includes('spend') || q.includes('iam')) return { value: `${rgif.spend.iam}/yr`, tone: 'good' };
  if (q.includes('network') && q.includes('spend')) return { value: `${rgif.spend.network}/yr`, tone: 'good' };
  if (q.includes('growing or declin')) {
    return rgif.spendTrend === 'growing' ? { value: 'Growing ↑', tone: 'good' } : rgif.spendTrend === 'declining' ? { value: 'Declining ↓', tone: 'red' } : { value: 'Stable —', tone: 'amber' };
  }

  // Intent
  if (q.includes('cnapp') && q.includes('research')) {
    const hit = rgif.intent.some((t) => /cnapp|cloud security/i.test(t));
    return hit ? { value: 'Active ✓', tone: 'good' } : { value: 'No CNAPP intent', tone: 'red' };
  }
  if (q.includes('dspm')) {
    const hit = rgif.intent.some((t) => /dspm|data security/i.test(t));
    return hit ? { value: 'Active ✓', tone: 'good' } : { value: 'No DSPM intent', tone: 'red' };
  }
  if (q.includes('ciem') || q.includes('identity governance')) {
    const hit = rgif.intent.some((t) => /ciem|identity|iam/i.test(t));
    return hit ? { value: 'Active ✓', tone: 'good' } : { value: 'No CIEM intent', tone: 'red' };
  }
  if (q.includes('buyer journey') || q.includes('stage')) {
    return rgif.journey === 'None' ? { value: 'Not in-market', tone: 'red' } : { value: rgif.journey, tone: rgif.journey === 'Evaluation' ? 'good' : 'amber' };
  }
  if (q.includes('intent topic')) {
    const n = rgif.intent.length;
    return n > 0 ? { value: `${n} active`, tone: 'good', raw: n } : { value: 'No active intent', tone: 'red', raw: 0 };
  }
  if (q.includes('wiz competitor')) {
    const inst = rgif.installs['palo-alto-prisma'];
    const orca = rgif.installs['orca-security'];
    if (orca?.present || inst?.present) return { value: 'Yes — competitor installed', tone: 'amber' };
    return { value: 'No incumbent CNAPP', tone: 'good' };
  }

  // Scoring & Fit
  if (q.includes('cnapp fit')) {
    const f = getFitFor(account.id, 'cnapp');
    return f.score != null ? { value: `${f.score}/100 · ${tierForScore(f.score).label}`, tone: f.score >= 85 ? 'good' : f.score >= 70 ? 'amber' : 'red', raw: f.score } : { value: 'No score', tone: 'red' };
  }
  if (q.includes('ciem fit')) {
    const f = getFitFor(account.id, 'ciem');
    return f.score != null ? { value: `${f.score}/100 · ${tierForScore(f.score).label}`, tone: f.score >= 85 ? 'good' : f.score >= 70 ? 'amber' : 'red', raw: f.score } : { value: 'No score', tone: 'red' };
  }
  if (q.includes('dspm fit')) {
    const f = getFitFor(account.id, 'dspm');
    return f.score != null ? { value: `${f.score}/100 · ${tierForScore(f.score).label}`, tone: f.score >= 85 ? 'good' : f.score >= 70 ? 'amber' : 'red', raw: f.score } : { value: 'No score', tone: 'red' };
  }
  if (q.includes('best-fit offering') || q.includes('strongest fit')) {
    const all = getAllFitFor(account.id);
    const best = Object.entries(all).sort((a, b) => (b[1].score ?? 0) - (a[1].score ?? 0))[0];
    if (!best) return { value: 'No data', tone: 'red' };
    const offering = OFFERINGS.find((o) => o.id === best[0]);
    return { value: `${offering?.name || best[0]} · ${best[1].score}`, tone: 'good', raw: best[1].score };
  }
  if (q.includes('displacement') || q.includes('competitive displacement')) {
    const inst = [rgif.installs['palo-alto-prisma'], rgif.installs.splunk, rgif.installs['orca-security']]
      .filter(Boolean)
      .filter((x) => x.present);
    const declining = inst.filter((x) => x.trend === 'declining');
    if (declining.length > 0) return { value: `Ready ✓ (${declining.length} declining)`, tone: 'good' };
    if (inst.length > 0) return { value: 'Stable competitor', tone: 'amber' };
    return { value: 'No incumbent', tone: 'good' };
  }
  if (q.includes('cross-sell') || q.includes('multi-offering') || q.includes('multi offering')) {
    const all = getAllFitFor(account.id);
    const aTier = Object.values(all).filter((x) => (x.score ?? 0) >= 70).length;
    if (aTier >= 3) return { value: `${aTier} offerings ≥B-tier`, tone: 'good', raw: aTier };
    if (aTier === 2) return { value: '2 offerings — cross-sell ready', tone: 'good', raw: 2 };
    return { value: 'Single-offering account', tone: 'amber', raw: 1 };
  }

  // Offerings
  if (q.includes('cnapp-first') || q.includes('dspm-first') || q.includes('cnapp first') || q.includes('dspm first')) {
    const all = getAllFitFor(account.id);
    const best = Object.entries(all).sort((a, b) => (b[1].score ?? 0) - (a[1].score ?? 0))[0];
    if (!best) return { value: 'No data', tone: 'red' };
    const offering = OFFERINGS.find((o) => o.id === best[0]);
    return { value: `${offering?.name}-first`, tone: 'good' };
  }

  // First-party
  if (q.includes('deal stage') || q.includes('crm stage')) {
    return rgif.crmStage === 'No open deal'
      ? { value: 'No open deal', tone: 'red' }
      : { value: rgif.crmStage, tone: 'good' };
  }
  if (q.includes('owns this account') || q.includes('owner')) return { value: rgif.crmOwner, tone: 'good' };
  if (q.includes('last') && (q.includes('engagement') || q.includes('touch'))) {
    return rgif.lastEngagement === 'No outbound yet' ? { value: 'No outbound yet', tone: 'red' } : { value: rgif.lastEngagement, tone: 'good' };
  }
  if (q.includes('renewal')) {
    return rgif.crmStage.includes('Renewal') ? { value: rgif.crmStage, tone: 'amber' } : { value: 'Not in renewal window', tone: 'neutral' };
  }

  return { value: 'See details', tone: 'neutral' };
}

export { valueFor };

// ----- Narrative insight builder for the result modal -----

export function buildInsight(question, accounts, valuesByAccount, opts = {}) {
  const q = question.toLowerCase();
  const matches = Object.values(valuesByAccount).filter((v) => v.tone === 'good').length;
  const noMatches = Object.values(valuesByAccount).filter((v) => v.tone === 'red').length;
  const mixed = Object.values(valuesByAccount).filter((v) => v.tone === 'amber').length;
  const total = Object.keys(valuesByAccount).length;
  const isWhitespace = opts.source === 'whitespace';
  const bookWord = isWhitespace ? 'whitespace accounts' : 'accounts';
  const tail = isWhitespace
    ? ' These are not in your CRM yet — strong candidates to add to your book.'
    : '';

  if (q.includes('crowdstrike') && !q.includes('declin')) {
    return `**${matches} of ${total} ${bookWord}** have CrowdStrike Falcon installed. Wiz integrates natively with Falcon — position as a **unified cloud security graph** on top of existing endpoint coverage, not a replacement.${tail}`;
  }
  if (q.includes('palo alto') && !q.includes('declin')) {
    const dec = Object.values(valuesByAccount).filter((v) => /Declining/i.test(v.value)).length;
    return `**${matches} ${bookWord}** have Palo Alto Prisma — your primary CNAPP displacement target. ${dec > 0 ? `${dec} are showing declining intensity — those are time-sensitive.` : ''}${tail}`;
  }
  if (q.includes('declin')) {
    const dec = Object.values(valuesByAccount).filter((v) => /Declining/i.test(v.value)).length;
    return `**${dec} ${bookWord}** show declining incumbent installs — your highest-priority displacement targets. Lead with Wiz's **unified graph + no rip-and-replace** story.${tail}`;
  }
  if (q.includes('multi-cloud') || q.includes('multi cloud')) {
    const mc = Object.values(valuesByAccount).filter((v) => /\d+ clouds/.test(v.value)).length;
    return `**${mc} accounts** run multi-cloud. Each cloud has separate native security tooling with **no unified posture layer across boundaries** — that's exactly the gap Wiz CNAPP closes.`;
  }
  if (q.includes('security vendor')) {
    const hi = Object.values(valuesByAccount).filter((v) => {
      const n = parseInt(v.value, 10);
      return n > 12;
    }).length;
    const total12 = Object.values(valuesByAccount).reduce((s, v) => {
      const n = parseInt(v.value, 10);
      return s + (Number.isNaN(n) ? 0 : n);
    }, 0);
    const avg = total > 0 ? Math.round(total12 / total) : 0;
    return `**${hi} accounts** have 12+ security vendors — prime consolidation targets. Average across your book: **${avg} vendors per account**.`;
  }
  if (q.includes('cnapp') && q.includes('research')) {
    return `**${matches} of ${total} accounts** show active CNAPP intent. Combine with declining incumbent signal for highest-conversion outreach.`;
  }
  if (q.includes('dspm')) {
    return `**${matches} accounts** show active DSPM intent. Cross-reference with Snowflake/Databricks installs to prioritize data-platform-heavy accounts.`;
  }
  if (q.includes('ciem') || q.includes('identity governance')) {
    return `**${matches} accounts** are researching CIEM / identity governance. Strong fintech overlap — pair with compliance-driven outreach.`;
  }
  if (q.includes('best-fit') || q.includes('strongest fit')) {
    return `Per-account best-fit offering identified. **Use this to default each account's lens** when you open it — the system picks the highest-scoring offering for context.`;
  }
  if (q.includes('cross-sell') || q.includes('multi-offering') || q.includes('multi offering')) {
    const multi = Object.values(valuesByAccount).filter((v) => (v.raw ?? 0) >= 2).length;
    return `**${multi} accounts** fit 2+ Wiz offerings. These are your cross-sell candidates — close one offering, set the second up in the same motion.`;
  }
  if (q.includes('displacement')) {
    return `**${matches} accounts** are displacement-ready (declining incumbent installs). These are your time-sensitive plays — incumbent renewal cycles are the moment.`;
  }
  if (q.includes('spend')) {
    return `Spend visibility across all ${total} accounts. **Use to size the conversation** — walk in knowing the budget before the first call.`;
  }
  if (q.includes('icp') || q.includes('fit score')) {
    return `Per-account fit score shown. Focus discovery on accounts in the top tier first.`;
  }
  return `**${matches} match · ${noMatches} no · ${mixed} partial** across your book. Click "Add as column" to keep this signal visible in your workbook.`;
}
