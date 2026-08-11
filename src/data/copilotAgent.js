// Copilot orchestrator — the book-level meta-agent.
//
// Takes a natural-language query, classifies it into one of a handful of
// intent shapes, and dispatches to a tool function that returns a structured
// response object. Renderers in CopilotResponses.jsx pick a component based
// on response.kind.
//
// This is a composer, not a new capability layer — every tool reuses
// existing primitives (listSignalFirings, recommendedPlaysForAccount,
// resolveTargetScope, filter registry).
//
// Query classification is pattern-based for the prototype; can be swapped
// for an LLM classifier later without touching consumers.

import { listSignalFirings, listFiringsForAccount } from './signalFirings.js';
import { recommendedPlaysForAccount } from './signalPlayMap.js';
import { resolveTargetScope } from './targetScope.js';
import { getAccountsForOwner } from './accounts.js';
import { getSignalDefinition, SIGNAL_CATEGORIES } from './signalCatalog.js';

// ─── Signal keyword → catalog id map ────────────────────────────────
// Loose matching so the seller can say "web activity", "webactivity",
// "web-activity", "web hits" all → web_activity_7d.
const SIGNAL_KEYWORDS = [
  { ids: ['web_activity_7d'],                   pattern: /\bweb[\s-]?activity\b/i },
  { ids: ['sales_activity_7d'],                 pattern: /\bsales[\s-]?activity\b/i },
  { ids: ['marketing_activity_7d'],             pattern: /\bmarketing[\s-]?activity\b/i },
  { ids: ['trustradius_intent'],                pattern: /\btrust[\s-]?radius\b/i },
  { ids: ['topic_intent'],                      pattern: /\btopic[\s-]?intent\b/i },
  { ids: ['competitor_install_detected'],       pattern: /\bcompetitor[\s-]?install(?:ed)?\b/i },
  { ids: ['competitor_renewal_window'],         pattern: /\bcompetitor[\s-]?renewal\b/i },
  { ids: ['competitor_momentum_increasing'],    pattern: /\bcompetitor[\s-]?momentum[\s-]?(?:increasing|up|expanding)?\b/i },
  { ids: ['competitor_momentum_decreasing'],    pattern: /\bcompetitor[\s-]?(?:momentum[\s-]?decreasing|churning|declining)\b/i },
  { ids: ['partner_install_detected'],          pattern: /\bpartner[\s-]?install(?:ed)?\b/i },
  { ids: ['tenant_product_momentum'],           pattern: /\btenant[\s-]?product|product[\s-]?momentum\b/i },
  { ids: ['topic_intent'],                      pattern: /\bintent\b/i }, // fallback
  { ids: ['competitor_install_detected',
          'competitor_momentum_increasing',
          'competitor_momentum_decreasing',
          'competitor_renewal_window'],         pattern: /\bcompeti(tor|tive)\b/i }, // any competitive
  { ids: ['web_activity_7d',
          'sales_activity_7d',
          'marketing_activity_7d'],             pattern: /\b1p[\s-]?activity\b/i }, // any 1P
];

function signalIdsForKeyword(query) {
  for (const { ids, pattern } of SIGNAL_KEYWORDS) {
    if (pattern.test(query)) return ids;
  }
  return null;
}

// ─── Account name resolver ──────────────────────────────────────────
// Fuzzy: matches "Databricks" / "databricks" / "data bricks" against
// account.name in the persona's book. Returns the first match or null.
function findAccountByName(personaId, needle) {
  const accounts = getAccountsForOwner(personaId) || [];
  const n = (needle || '').toLowerCase().replace(/[\s-]+/g, '').trim();
  if (!n) return null;
  return accounts.find((a) => {
    const key = a.name.toLowerCase().replace(/[\s-]+/g, '');
    return key === n || key.includes(n) || n.includes(key);
  }) || null;
}

// ─── Helpers for weighted ranking ────────────────────────────────────
function weightSumForAccount(accountId) {
  return listFiringsForAccount(accountId).reduce((s, f) => s + (f.weight || 0), 0);
}

function firingSummary(f) {
  const c = f.context || {};
  const bits = [];
  if (c.competitor) bits.push(c.competitor);
  if (c.partner) bits.push(c.partner);
  if (c.summary) bits.push(c.summary);
  if (c.topic) bits.push(`"${c.topic}"${c.score != null ? ` (score ${c.score})` : ''}`);
  if (c.productCompared) bits.push(c.productCompared);
  if (c.direction) bits.push(`${c.direction}${c.delta ? ' · ' + c.delta : ''}`);
  if (c.renewalWindowDays != null) bits.push(`renewal ${c.renewalWindowDays}d`);
  return bits.join(' · ') || (f.definition?.description || '');
}

// ─── Tools ───────────────────────────────────────────────────────────

// top-N accounts firing a specific signal (or any signal in a category)
function topAccountsWithSignal(personaId, signalIds, { limit = 10 } = {}) {
  const firings = listSignalFirings(personaId).filter((f) => signalIds.includes(f.signalId));
  const byAccount = new Map();
  for (const f of firings) {
    const bucket = byAccount.get(f.accountId) || {
      accountId: f.accountId,
      accountName: f.accountName,
      accountLogo: f.accountLogo,
      matchedFirings: [],
      weightSum: 0,
    };
    bucket.matchedFirings.push(f);
    bucket.weightSum += f.weight || 0;
    byAccount.set(f.accountId, bucket);
  }
  // For each match, also compute the account's total signal weight
  // (context in the "Also firing:" line).
  const rows = [];
  for (const bucket of byAccount.values()) {
    const allFirings = listFiringsForAccount(bucket.accountId);
    const totalWeight = allFirings.reduce((s, f) => s + (f.weight || 0), 0);
    const otherFirings = allFirings.filter((f) => !signalIds.includes(f.signalId));
    rows.push({
      accountId: bucket.accountId,
      accountName: bucket.accountName,
      accountLogo: bucket.accountLogo,
      matchSummary: firingSummary(bucket.matchedFirings[0]),
      matchedAt: bucket.matchedFirings[0].firedAt,
      weight: totalWeight,
      alsoFiring: otherFirings.slice(0, 3).map((f) => ({
        label: SIGNAL_CATEGORIES[f.definition.category]?.label || f.definition.category,
        summary: firingSummary(f),
      })),
    });
  }
  rows.sort((a, b) => b.weight - a.weight);
  return rows.slice(0, limit);
}

// Available signal labels (for graceful "did you mean")
function availableSignalLabels() {
  return [
    'web activity', 'sales activity', 'marketing activity',
    'trustradius', 'topic intent',
    'competitor install', 'competitor renewal', 'competitor momentum',
    'partner install', 'tenant product momentum',
  ];
}

// Rank the whole book by weight sum + time-sensitivity
function rankBookByPriority(personaId, { limit = 10 } = {}) {
  const scope = resolveTargetScope(personaId);
  const rows = [];
  for (const accountId of scope.accountIds || []) {
    const firings = listFiringsForAccount(accountId);
    if (!firings.length) continue;
    // Time-sensitivity multiplier: renewal_window and past-due close accelerate
    const hasRenewal = firings.some((f) => f.signalId === 'competitor_renewal_window');
    const tsMultiplier = hasRenewal ? 1.3 : 1.0;
    const weight = Math.round(firings.reduce((s, f) => s + (f.weight || 0), 0) * tsMultiplier);
    const plays = recommendedPlaysForAccount(accountId, { limit: 3 });
    const topFiring = [...firings].sort((a, b) => (b.weight || 0) - (a.weight || 0))[0];
    // Look up account
    const accounts = getAccountsForOwner(personaId) || [];
    const account = accounts.find((a) => a.id === accountId);
    if (!account) continue;
    rows.push({
      accountId,
      accountName: account.name,
      accountLogo: account.logoColor,
      weight,
      topFiringSummary: firingSummary(topFiring),
      plays: plays.map((p) => ({
        title: p.title,
        ctaLabel: p.ctaLabel,
        agentId: p.agentId,
      })),
    });
  }
  rows.sort((a, b) => b.weight - a.weight);
  return rows.slice(0, limit);
}

// What changed — firings that fired in the last N days.
function whatChangedRecent(personaId, { sinceDays = 3, limit = 10 } = {}) {
  const firings = listSignalFirings(personaId, { sinceDays });
  firings.sort((a, b) => new Date(b.firedAt) - new Date(a.firedAt));
  return firings.slice(0, limit).map((f) => ({
    accountId: f.accountId,
    accountName: f.accountName,
    accountLogo: f.accountLogo,
    signalLabel: f.definition.description,
    category: SIGNAL_CATEGORIES[f.definition.category]?.label || f.definition.category,
    summary: firingSummary(f),
    firedAt: f.firedAt,
    weight: f.weight || 0,
  }));
}

// How is a single account doing
function accountBrief(personaId, account) {
  const firings = listFiringsForAccount(account.id);
  const plays = recommendedPlaysForAccount(account.id, { limit: 4 });
  const totalWeight = firings.reduce((s, f) => s + (f.weight || 0), 0);
  const criticalOrHigh = firings.filter((f) => (f.weight || 0) >= 70).length;
  const headline = plays[0]?.rationale || 'No signals firing on this account today.';
  return {
    accountId: account.id,
    accountName: account.name,
    accountLogo: account.logoColor,
    weight: totalWeight,
    signalCount: firings.length,
    criticalOrHigh,
    headline,
    facts: firings.slice(0, 4).map((f) => ({
      label: f.definition.description,
      summary: firingSummary(f),
    })),
    plays: plays.slice(0, 2).map((p) => ({
      title: p.title,
      ctaLabel: p.ctaLabel,
      agentId: p.agentId,
    })),
  };
}

// Compare two accounts side-by-side
function comparePair(personaId, aName, bName) {
  const a = findAccountByName(personaId, aName);
  const b = findAccountByName(personaId, bName);
  if (!a || !b) return null;
  const brief = (acct) => {
    const firings = listFiringsForAccount(acct.id);
    const plays = recommendedPlaysForAccount(acct.id, { limit: 1 });
    return {
      accountId: acct.id,
      accountName: acct.name,
      accountLogo: acct.logoColor,
      stage: acct.stage || '—',
      combinedScore: acct.combinedScore ?? acct.icpFit ?? null,
      weight: firings.reduce((s, f) => s + (f.weight || 0), 0),
      competitiveSignals: firings
        .filter((f) => f.definition.category === 'competitive')
        .map((f) => ({ label: f.definition.description, summary: firingSummary(f) })),
      intentSignals: firings
        .filter((f) => f.definition.category === 'buyer_intent')
        .map((f) => ({ label: f.definition.description, summary: firingSummary(f) })),
      activitySignals: firings
        .filter((f) => f.definition.category === 'first_party_activity')
        .map((f) => ({ label: f.definition.description, summary: firingSummary(f) })),
      partnerMomentum: firings
        .filter((f) => ['partner', 'momentum'].includes(f.definition.category))
        .map((f) => ({ label: f.definition.description, summary: firingSummary(f) })),
      topPlay: plays[0] || null,
    };
  };
  return { a: brief(a), b: brief(b) };
}

// Prospecting — outside book lookalikes (mock for prototype)
function findLookalikes(personaId, seedName) {
  const seed = findAccountByName(personaId, seedName);
  if (!seed) return null;
  // Synthesized lookalikes universe. In production this would query
  // ICP-Match + technographic filter. For the prototype the list is
  // grounded in what's plausible for the seed's industry.
  const universe = {
    'acct-databricks': {
      dimensions: ['Data platform', 'Fintech vertical', 'Lacework installed', '>2000 emp', 'No CNAPP'],
      results: [
        { name: 'Snowflake Financial',   emp: '3200', hq: 'SF, CA',    installed: 'Lacework Polygraph', weight: 88 },
        { name: 'Bridgewater Data',      emp: '1800', hq: 'CT',        installed: 'Lacework Polygraph', weight: 82 },
        { name: 'Two Sigma Platform',    emp: '1500', hq: 'NY, NY',    installed: 'Lacework Polygraph', weight: 79 },
        { name: 'Palantir Foundry',      emp: '3900', hq: 'Denver, CO', installed: 'Lacework Polygraph', weight: 77 },
        { name: 'DataRobot Cloud',       emp: '1000', hq: 'Boston, MA', installed: 'Lacework Polygraph', weight: 74 },
      ],
    },
    'acct-snowflake': {
      dimensions: ['Data platform', 'Palo Alto installed', '>1000 emp'],
      results: [
        { name: 'Confluent Cloud',       emp: '2600', hq: 'Mountain View, CA', installed: 'Palo Alto Prisma', weight: 83 },
        { name: 'MongoDB Atlas',         emp: '4500', hq: 'NYC',              installed: 'Palo Alto Prisma', weight: 80 },
        { name: 'Cockroach Labs',        emp: '900',  hq: 'NYC',              installed: 'Palo Alto Prisma', weight: 76 },
      ],
    },
  };
  const entry = universe[seed.id];
  if (!entry) {
    return {
      seedName: seed.name,
      dimensions: ['Similar firmographics + technographics'],
      results: [
        { name: `${seed.name}-alike A`,  emp: '2000', hq: '—', installed: '—', weight: 75 },
        { name: `${seed.name}-alike B`,  emp: '1600', hq: '—', installed: '—', weight: 72 },
        { name: `${seed.name}-alike C`,  emp: '1200', hq: '—', installed: '—', weight: 70 },
      ],
      totalFound: 3,
    };
  }
  return {
    seedName: seed.name,
    dimensions: entry.dimensions,
    results: entry.results,
    totalFound: entry.results.length,
  };
}

// ─── Intent classifier ──────────────────────────────────────────────
//
// Order matters — most-specific patterns first.
const INTENTS = [
  {
    name: 'compare_accounts',
    match: /^\s*(?:compare\s+)?(.+?)\s+(?:vs\.?|versus|and|to|compared\s+to)\s+(.+?)\s*$/i,
    check: (m, personaId) => findAccountByName(personaId, m[1]) && findAccountByName(personaId, m[2]),
    handle: (m, personaId) => {
      const pair = comparePair(personaId, m[1], m[2]);
      return { kind: 'comparison', ...pair };
    },
  },
  {
    name: 'how_is_account',
    match: /^\s*(?:how\s+(?:is|about)|what(?:'s|s)?\s+(?:up\s+with|going\s+on\s+with|the\s+status\s+of)|status\s+of|tell\s+me\s+about|brief\s+me\s+on)\s+(.+?)(?:\s+doing|\s+going)?\s*\??\s*$/i,
    check: (m, personaId) => findAccountByName(personaId, m[1]),
    handle: (m, personaId) => {
      const acct = findAccountByName(personaId, m[1]);
      return { kind: 'handoff', ...accountBrief(personaId, acct) };
    },
  },
  {
    name: 'find_lookalikes',
    match: /^\s*(?:find\s+)?(?:lookalikes?|similar\s+accounts?|prospects?\s+like)\s+(?:for\s+|to\s+)?(.+?)\s*$/i,
    check: (m, personaId) => findAccountByName(personaId, m[1]),
    handle: (m, personaId) => {
      const data = findLookalikes(personaId, m[1]);
      return data ? { kind: 'lookalikes', ...data } : { kind: 'text', text: `Couldn't find "${m[1]}" in your book to seed a lookalike search.` };
    },
  },
  {
    name: 'plan_day',
    match: /^\s*(?:plan\s+my\s+day|daily\s+plan|what\s+should\s+i\s+(?:do|work\s+on)(?:\s+today)?|today(?:'s)?\s+plan)\s*\??\s*$/i,
    check: () => true,
    handle: (m, personaId) => {
      const rows = rankBookByPriority(personaId, { limit: 6 });
      return { kind: 'plan', title: 'Daily Plan', rows };
    },
  },
  {
    name: 'what_changed',
    match: /^\s*(?:what(?:'s|s)?\s+(?:changed|new)(?:\s+recently)?|recent\s+activity|this\s+week)\s*\??\s*$/i,
    check: () => true,
    handle: (m, personaId) => {
      const rows = whatChangedRecent(personaId, { sinceDays: 3, limit: 10 });
      return { kind: 'whatChanged', title: 'What changed in the last 3 days', rows };
    },
  },
  {
    name: 'top_signals_generic',
    match: /^\s*top\s+signals?\s*\??\s*$/i,
    check: () => true,
    handle: (m, personaId) => {
      const rows = rankBookByPriority(personaId, { limit: 8 });
      return { kind: 'plan', title: 'Top signals across your book', rows };
    },
  },
  {
    name: 'top_with_signal',
    match: /^\s*(?:(?:show|give\s+me|list|which|what)(?:\s+are)?\s+(?:the\s+)?)?top\s+accounts?\s+(?:with|showing|firing|that\s+have|that\s+are)\s+(.+?)\s*\??\s*$/i,
    check: (m) => signalIdsForKeyword(m[1]) != null,
    handle: (m, personaId) => {
      const ids = signalIdsForKeyword(m[1]);
      if (!ids) return { kind: 'text', text: `That signal isn't in your Phase 1 detectors yet.` };
      const rows = topAccountsWithSignal(personaId, ids, { limit: 10 });
      const label = ids.map((i) => getSignalDefinition(i)?.description).filter(Boolean).slice(0, 2).join(' / ');
      return { kind: 'topN', title: `Accounts with ${label}`, signalIds: ids, rows };
    },
  },
  {
    name: 'which_with_signal',
    match: /^\s*(?:which|what|list|show)\s+accounts?\s+(?:are|have|show(?:ing)?|with|firing)\s+(.+?)\s*\??\s*$/i,
    check: (m) => signalIdsForKeyword(m[1]) != null,
    handle: (m, personaId) => {
      const ids = signalIdsForKeyword(m[1]);
      const rows = topAccountsWithSignal(personaId, ids, { limit: 20 });
      const label = ids.map((i) => getSignalDefinition(i)?.description).filter(Boolean).slice(0, 2).join(' / ');
      return { kind: 'topN', title: `Accounts with ${label}`, signalIds: ids, rows };
    },
  },
];

// ─── Public API ──────────────────────────────────────────────────────
export function classifyAndDispatch(personaId, rawQuery) {
  const query = (rawQuery || '').trim();
  if (!query) return { kind: 'text', text: 'Try: "top accounts with web activity", "plan my day", "how is Databricks doing".' };

  for (const intent of INTENTS) {
    const m = query.match(intent.match);
    if (!m) continue;
    if (!intent.check(m, personaId)) continue;
    try {
      return { intent: intent.name, ...intent.handle(m, personaId) };
    } catch (err) {
      return { kind: 'text', text: `Something went wrong resolving that query: ${err.message}` };
    }
  }

  // Fallback — nothing matched. Offer helpful examples.
  return {
    kind: 'text',
    text: [
      `I didn't understand "${query}".`,
      '',
      'Try:',
      '  · "top accounts with web activity"',
      '  · "which accounts are showing competitor renewal"',
      '  · "how is Databricks doing"',
      '  · "compare Databricks vs Snowflake"',
      '  · "find lookalikes for Databricks"',
      '  · "plan my day"',
      '  · "what changed"',
      '',
      `Detectable signals: ${availableSignalLabels().join(', ')}.`,
    ].join('\n'),
  };
}

// Slash-command shortcuts to canonical queries.
export const SLASH_COMMANDS = [
  { id: 'plan-day',        label: '/plan-day',       query: 'plan my day',        description: 'Top 6 actions for today' },
  { id: 'top-signals',     label: '/top-signals',    query: 'top signals',        description: 'Ranked signal roll-up across the book' },
  { id: 'what-changed',    label: '/what-changed',   query: 'what changed',       description: 'Firings from the last 3 days' },
  { id: 'top-web',         label: '/top-web',        query: 'top accounts with web activity', description: 'Accounts with recent web activity' },
  { id: 'top-competitive', label: '/top-comp',       query: 'top accounts with competitor renewal', description: 'Competitor renewal windows' },
  { id: 'top-intent',      label: '/top-intent',     query: 'top accounts with trustradius intent', description: 'Active TrustRadius comparisons' },
  { id: 'lookalikes',      label: '/lookalikes',     query: 'find lookalikes for ',           description: 'Prospecting via ICP-Match', requiresInput: true },
];
