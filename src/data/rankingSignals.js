// Atomic ranking signals — the building blocks Plays reference.
//
// A signal is a single check that either fires or doesn't on an account, with
// a weight that contributes to the account's ranking within a Play.
//
// Plays = business motions (Competitive Takeout, Net New Logo, etc.)
// Signals = the "why this account is here / ranked X" mechanism.
//
// Sellers see signal names as provenance chips on each ranked account row,
// which gives them the story to craft outreach against.

import { getRGIF } from './workbookRGIF.js';
import { getFitFor } from './accountOfferingFit.js';
import { getAccountStakeholders } from './buyingCommittees.js';

// ----- Signal categories — used to group signals in the UI -----

export const SIGNAL_CATEGORIES = {
  intent: { label: 'Intent', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10' },
  install: { label: 'Tech stack', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500/10' },
  engagement: { label: 'Engagement', color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-500/10' },
  event: { label: 'Catalyst', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10' },
  firmo: { label: 'Firmographic', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-500/10' },
  crm: { label: 'CRM', color: 'text-text-secondary', bg: 'bg-surface-2' },
};

// ----- Signal registry -----
//
// Each signal: { id, name, category, kind (hg|crm), weight, description, check }
// `check` is the same primitive shape Phase 13 used in `conditions.blocks`, so
// the evaluator can reuse the same primitive checkers.

export const RANKING_SIGNALS = [
  // ─── Intent signals (third-party) ───
  {
    id: 'sig-cnapp-intent-active',
    name: 'Active CNAPP intent',
    category: 'intent',
    kind: 'hg',
    weight: 12,
    description: 'Account is actively researching CNAPP solutions.',
    check: { type: 'intent_active', config: { topic: 'CNAPP' } },
  },
  {
    id: 'sig-ciem-intent-active',
    name: 'Active CIEM intent',
    category: 'intent',
    kind: 'hg',
    weight: 12,
    description: 'Account is actively researching CIEM / identity governance.',
    check: { type: 'intent_active', config: { topic: 'CIEM' } },
  },
  {
    id: 'sig-dspm-intent-active',
    name: 'Active DSPM intent',
    category: 'intent',
    kind: 'hg',
    weight: 12,
    description: 'Account is actively researching DSPM / data security.',
    check: { type: 'intent_active', config: { topic: 'DSPM' } },
  },
  {
    id: 'sig-workload-intent-active',
    name: 'Active container security intent',
    category: 'intent',
    kind: 'hg',
    weight: 10,
    description: 'Account is researching Kubernetes / runtime / container security.',
    check: { type: 'intent_active', config: { topic: 'kubernetes security' } },
  },
  {
    id: 'sig-intent-surge',
    name: 'Intent surge — 3+ topics',
    category: 'intent',
    kind: 'hg',
    weight: 8,
    description: '3+ active intent topics in last 30 days — heavy in-market signal.',
    check: { type: 'intent_surge', config: { count: 3 } },
  },

  // ─── Install / tech stack signals ───
  {
    id: 'sig-palo-alto-installed',
    name: 'Palo Alto Prisma installed',
    category: 'install',
    kind: 'hg',
    weight: 6,
    description: 'Account has Palo Alto Prisma Cloud as their CNAPP incumbent.',
    check: { type: 'install_exists', config: { product: 'palo-alto-prisma' } },
  },
  {
    id: 'sig-palo-alto-aging',
    name: 'Palo Alto Prisma aging (>30mo)',
    category: 'install',
    kind: 'hg',
    weight: 14,
    description: 'Palo Alto install >30 months — renewal cliff approaches, displacement window opens.',
    check: { type: 'install_age', config: { product: 'palo-alto-prisma', operator: '>', value: 30, unit: 'mo' } },
  },
  {
    id: 'sig-palo-alto-declining',
    name: 'Palo Alto intensity declining',
    category: 'install',
    kind: 'hg',
    weight: 14,
    description: 'Palo Alto usage intensity dropping — incumbent dissatisfaction.',
    check: { type: 'install_trend', config: { product: 'palo-alto-prisma', trend: 'declining' } },
  },
  {
    id: 'sig-lacework-installed',
    name: 'Lacework installed',
    category: 'install',
    kind: 'hg',
    weight: 6,
    description: 'Account has Lacework as their CNAPP incumbent.',
    check: { type: 'install_exists', config: { product: 'lacework' } },
  },
  {
    id: 'sig-orca-installed',
    name: 'Orca Security installed',
    category: 'install',
    kind: 'hg',
    weight: 6,
    description: 'Account has Orca Security as their CNAPP incumbent.',
    check: { type: 'install_exists', config: { product: 'orca-security' } },
  },
  {
    id: 'sig-aqua-aging',
    name: 'Aqua Security aging (>24mo)',
    category: 'install',
    kind: 'hg',
    weight: 12,
    description: 'Aqua install >24mo — container security displacement window.',
    check: { type: 'install_age', config: { product: 'aqua-security', operator: '>', value: 24, unit: 'mo' } },
  },
  {
    id: 'sig-no-cnapp-incumbent',
    name: 'No CNAPP incumbent',
    category: 'install',
    kind: 'hg',
    weight: 10,
    description: 'Greenfield — no installed CNAPP vendor detected.',
    check: { type: 'no_competitor', config: { category: 'CNAPP' } },
  },
  {
    id: 'sig-multi-cloud',
    name: 'Multi-cloud',
    category: 'install',
    kind: 'hg',
    weight: 7,
    description: 'Account runs 2+ cloud platforms — CNAPP relevance.',
    check: { type: 'cloud_multi', config: {} },
  },
  {
    id: 'sig-data-platform-installed',
    name: 'Data platform installed (Snowflake/Databricks)',
    category: 'install',
    kind: 'hg',
    weight: 9,
    description: 'Snowflake or similar data platform present — DSPM relevance.',
    check: { type: 'install_exists', config: { product: 'snowflake' } },
  },
  {
    id: 'sig-kubernetes-stack',
    name: 'Kubernetes-heavy stack',
    category: 'install',
    kind: 'hg',
    weight: 9,
    description: 'Datadog + multi-cloud signals indicating Kubernetes adoption.',
    check: { type: 'install_exists', config: { product: 'datadog' } },
  },

  // ─── Engagement signals — direct buyer behavior ───
  {
    id: 'sig-pricing-visits',
    name: 'Pricing page visits',
    category: 'engagement',
    kind: 'hg',
    weight: 11,
    description: 'Account visited Wiz pricing pages 5+ times in last 14 days — strong purchase intent.',
    check: { type: 'pricing_visits', config: { count_in_days: 14, min_visits: 5 } },
  },
  {
    id: 'sig-comparison-research',
    name: 'Comparison / vendor evaluation research',
    category: 'engagement',
    kind: 'hg',
    weight: 9,
    description: 'Active comparison-page activity across CNAPP vendors.',
    check: { type: 'comparison_research', config: { count_in_days: 30 } },
  },

  // ─── Event / catalyst signals — change moments ───
  {
    id: 'sig-new-ciso',
    name: 'New CISO (last 90d)',
    category: 'event',
    kind: 'hg',
    weight: 13,
    description: 'New CISO in seat in last 90 days — first 90 days = posture refresh window.',
    check: { type: 'exec_change', config: { title: 'CISO', within_days: 90 } },
  },
  {
    id: 'sig-funding-raised',
    name: 'Funding raised (last 12mo)',
    category: 'event',
    kind: 'hg',
    weight: 10,
    description: 'Account closed a funding round in last 12 months — fresh budget for tools.',
    check: { type: 'funding_recent', config: { within_days: 365 } },
  },
  {
    id: 'sig-ma-activity',
    name: 'M&A activity',
    category: 'event',
    kind: 'hg',
    weight: 10,
    description: 'Recent merger or acquisition — security consolidation catalyst.',
    check: { type: 'ma_activity', config: { within_days: 365 } },
  },
  {
    id: 'sig-breach-incident',
    name: 'Recent breach / security incident',
    category: 'event',
    kind: 'hg',
    weight: 14,
    description: 'Public breach or incident in last 12 months — security overhaul mandate.',
    check: { type: 'breach_recent', config: { within_days: 365 } },
  },

  // ─── Spend signals ───
  {
    id: 'sig-it-spend-growing',
    name: 'IT spend growing',
    category: 'firmo',
    kind: 'hg',
    weight: 6,
    description: 'IT spend trend is growing YoY.',
    check: { type: 'spend_trend', config: { trend: 'growing' } },
  },
  {
    id: 'sig-ai-spend-growing',
    name: 'AI / Cloud spend surging',
    category: 'firmo',
    kind: 'hg',
    weight: 8,
    description: 'AI or cloud infrastructure spend growing significantly — modernization budget.',
    check: { type: 'ai_spend_growing', config: {} },
  },
  {
    id: 'sig-fortune-1000',
    name: 'Fortune 1000',
    category: 'firmo',
    kind: 'hg',
    weight: 3,
    description: 'Account is a Fortune 1000 enterprise — platform-buying capability.',
    check: { type: 'fortune', config: {} },
  },

  // ─── CRM (first-party) signals — book accounts only ───
  {
    id: 'sig-crm-existing-customer',
    name: 'Existing customer',
    category: 'crm',
    kind: 'crm',
    weight: 12,
    description: 'Account is a paying Wiz customer — cross-sell + expansion eligible.',
    check: { type: 'crm_existing_customer', config: {} },
  },
  {
    id: 'sig-crm-active-deal',
    name: 'Active deal stage',
    category: 'crm',
    kind: 'crm',
    weight: 9,
    description: 'Account is in an active deal stage (Qualified, Tech Eval, Solution Validation).',
    check: { type: 'crm_stage', config: { stages: ['active', 'qualified', 'evaluation'] } },
  },
  {
    id: 'sig-crm-stale-activity',
    name: 'Stale — no activity 21d+',
    category: 'crm',
    kind: 'crm',
    weight: 8,
    description: 'No CRM activity logged in 21+ days — engagement needs refresh.',
    check: { type: 'crm_last_activity', config: { operator: '>', days: 21 } },
  },
  {
    id: 'sig-crm-has-champion',
    name: 'Champion identified',
    category: 'crm',
    kind: 'crm',
    weight: 11,
    description: 'Internal champion identified in account — high-value relationship.',
    check: { type: 'crm_has_champion', config: {} },
  },
  {
    id: 'sig-crm-renewal-window',
    name: 'Renewal within 90 days',
    category: 'crm',
    kind: 'crm',
    weight: 10,
    description: 'Account renewal date within next 90 days.',
    check: { type: 'crm_renewal_window', config: { days: 90 } },
  },
];

export const SIGNALS_BY_ID = Object.fromEntries(RANKING_SIGNALS.map((s) => [s.id, s]));

export function getSignalDef(id) {
  return SIGNALS_BY_ID[id] || null;
}

export function listSignalsByKind(kind) {
  return RANKING_SIGNALS.filter((s) => s.kind === kind);
}

export function listSignalsByCategory(category) {
  return RANKING_SIGNALS.filter((s) => s.category === category);
}

// ----- Signal evaluator -----
//
// Checks a single signal against an account. Returns true/false.
// Whitespace accounts skip CRM signals automatically.

function normVerticals(industry) {
  if (!industry) return [];
  const i = industry.toLowerCase();
  const out = [];
  if (i.includes('bank') || i.includes('financ') || i.includes('fintech')) out.push('Banking', 'Financial Services', 'Fintech');
  if (i.includes('insur')) out.push('Insurance', 'Financial Services');
  if (i.includes('software') || i.includes('saas')) out.push('Software & SaaS', 'Technology');
  if (i.includes('healthcare') || i.includes('pharma') || i.includes('health')) out.push('Healthcare');
  if (i.includes('retail') || i.includes('ecomm')) out.push('Retail', 'Consumer');
  if (i.includes('manufact') || i.includes('automotive')) out.push('Manufacturing');
  if (i.includes('ai') || i.includes('crypto')) out.push('AI', 'Technology');
  return out;
}

export function checkSignal(signal, account, { isBookAccount } = {}) {
  if (!signal) return false;
  // CRM signals don't apply to whitespace
  if (signal.kind === 'crm' && !isBookAccount) return false;

  const check = signal.check;
  const cfg = check?.config || {};
  const rgif = getRGIF(account.id);

  switch (check?.type) {
    case 'install_exists': {
      return !!rgif?.installs?.[cfg.product]?.present;
    }
    case 'install_age': {
      const ent = rgif?.installs?.[cfg.product];
      if (!ent?.present) return false;
      const ageMonths = Math.round((ent.intensity ?? 0) * 4);
      const op = cfg.operator || '>';
      const val = cfg.value || 0;
      if (op === '>') return ageMonths > val;
      if (op === '<') return ageMonths < val;
      if (op === '>=') return ageMonths >= val;
      if (op === '<=') return ageMonths <= val;
      return false;
    }
    case 'install_trend': {
      const ent = rgif?.installs?.[cfg.product];
      return ent?.present && ent.trend === (cfg.trend || 'declining');
    }
    case 'intent_active': {
      const topic = (cfg.topic || '').toLowerCase();
      return (rgif?.intent || []).some((t) => t.toLowerCase().includes(topic));
    }
    case 'intent_surge': {
      return (rgif?.intent || []).length >= (cfg.count || 3);
    }
    case 'cloud_multi': {
      return (rgif?.clouds || []).length >= 2;
    }
    case 'pricing_visits': {
      const visits = rgif?.engagement?.pricing_visits_14d ?? 0;
      return visits >= (cfg.min_visits || 5);
    }
    case 'comparison_research': {
      return !!rgif?.engagement?.comparison_research_30d;
    }
    case 'exec_change': {
      const title = (cfg.title || 'CISO').toLowerCase();
      if (account.hgDiscoverySignal && new RegExp(title, 'i').test(account.hgDiscoverySignal.headline)) return true;
      if (account.hgDiscoverySignal && /new (ciso|cto|cio|head of|vp)/i.test(account.hgDiscoverySignal.headline)) return true;
      const sigs = account.signals || [];
      return sigs.some((s) => new RegExp(`new ${title}|${title} hire|${title} joined`, 'i').test(`${s.headline} ${s.detail || ''}`));
    }
    case 'funding_recent': {
      const days = rgif?.events?.last_funding_days_ago;
      return days != null && days <= (cfg.within_days || 365);
    }
    case 'ma_activity': {
      return !!rgif?.events?.ma_activity_last_year;
    }
    case 'breach_recent': {
      return !!rgif?.events?.breach_last_year;
    }
    case 'spend_trend': {
      return rgif?.spendTrend === (cfg.trend || 'growing');
    }
    case 'ai_spend_growing': {
      return !!rgif?.events?.ai_spend_growing;
    }
    case 'fortune': {
      return !!rgif?.isFortune;
    }
    case 'no_competitor': {
      const competitor = (account.competitor || '').toLowerCase();
      return !competitor || /none/i.test(competitor);
    }
    case 'crm_existing_customer': {
      if (!isBookAccount) return false;
      return account.stage === 'customer' || account.stage === 'renewal';
    }
    case 'crm_active_deal':
    case 'crm_stage': {
      if (!isBookAccount) return false;
      const stages = (cfg.stages || []).map((s) => s.toLowerCase());
      const stage = (account.stage || '').toLowerCase();
      return stages.some((s) => stage.includes(s) || s.includes(stage));
    }
    case 'crm_last_activity': {
      if (!isBookAccount) return false;
      const days = account.lastTouchDaysAgo;
      if (days == null) return cfg.operator === '>' ? true : false;
      const op = cfg.operator || '>';
      const val = cfg.days || 30;
      if (op === '>') return days > val;
      if (op === '<') return days < val;
      return false;
    }
    case 'crm_has_champion': {
      if (!isBookAccount) return false;
      return (getAccountStakeholders(account.id) || []).some((s) => s.isChampion);
    }
    case 'crm_renewal_window': {
      if (!isBookAccount) return false;
      return account.stage === 'renewal' || account.stage === 'customer';
    }
    default:
      return false;
  }
}

// Evaluate which signals from a list are firing on an account.
// Returns array of firing signals (subset of input).
export function firingSignalsForAccount(signalIds, account, { isBookAccount } = {}) {
  const firing = [];
  for (const id of signalIds) {
    const s = getSignalDef(id);
    if (!s) continue;
    if (checkSignal(s, account, { isBookAccount })) firing.push(s);
  }
  return firing;
}

// Compute ranking weight from firing signals.
export function signalWeightSum(firingSignals) {
  return firingSignals.reduce((s, sig) => s + (sig.weight || 0), 0);
}
