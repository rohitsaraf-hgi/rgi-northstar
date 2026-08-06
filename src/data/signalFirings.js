// Signal firings synthesizer.
//
// For the prototype, real signal-detection logic isn't wired end-to-end.
// This module walks the persona's account state (accounts + stakeholders +
// existing account.signals array + play activation state + agent runs) and
// synthesizes a list of firings that reads as if the real detectors had run.
//
// Every consumer reads through listSignalFirings() so we can swap the
// synthesizer for real detectors later without touching UI code.

import { getAccountsForOwner } from './accounts.js';
import { getAccountStakeholders } from './buyingCommittees.js';
import { getSignalDefinition, SIGNAL_CATALOG } from './signalCatalog.js';

// Fixed "today" for the demo so relative dates stay stable.
const TODAY = new Date('2026-08-05');

function daysAgo(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// -----------------------------------------------------------------------------
// Per-account synthesis
// -----------------------------------------------------------------------------
//
// The keys correspond to account.id in ACCOUNTS_BY_OWNER (accounts.js).
// Values are arrays of { signalId, firedAt, context } — signals that
// "fire" on that account right now. Written by hand so the demo tells a
// coherent story per account (single-threaded on JPMC, competitor renewal
// window on Databricks, past-close on Acme, etc.).
//
// Signals not surfaced here still exist in the catalog — they simply
// aren't firing today for the demo persona.

const ACCOUNT_FIRINGS = {
  // JPMC — active CNAPP intent + web activity on the Q3 opp
  'acct-jpmc': [
    {
      signalId: 'topic_intent',
      firedAt: daysAgo(1),
      context: {
        topic: 'Cloud-native application protection',
        score: 82,
      },
    },
    {
      signalId: 'web_activity_7d',
      firedAt: daysAgo(2),
      context: {
        summary: '5 pageviews on /solutions/financial-services and CNAPP pricing',
        page: '/solutions/financial-services + /pricing',
        count: 5,
      },
    },
    {
      signalId: 'competitor_install_detected',
      firedAt: daysAgo(6),
      context: { competitor: 'Palo Alto Prisma Cloud' },
    },
  ],

  // Snowflake — new CISO, high intent, competitor expanding
  'acct-snowflake': [
    {
      signalId: 'trustradius_intent',
      firedAt: daysAgo(3),
      context: {
        productCompared: 'Wiz vs Palo Alto Prisma Cloud',
        session: 'pricing page + comparison table',
      },
    },
    {
      signalId: 'topic_intent',
      firedAt: daysAgo(5),
      context: { topic: 'CNAPP', score: 91 },
    },
    {
      signalId: 'competitor_momentum_increasing',
      firedAt: daysAgo(4),
      context: {
        competitor: 'Palo Alto Prisma Cloud',
        delta: '+ 18 installs · 60d',
        trend: 'expanding across engineering + platform teams',
      },
    },
  ],

  // Acme — late-stage negotiate, competitor lurking + intent
  'acct-acme': [
    {
      signalId: 'competitor_install_detected',
      firedAt: daysAgo(6),
      context: { competitor: 'Palo Alto Prisma Cloud' },
    },
    {
      signalId: 'trustradius_intent',
      firedAt: daysAgo(4),
      context: {
        productCompared: 'Wiz vs Palo Alto Prisma Cloud',
      },
    },
    {
      signalId: 'topic_intent',
      firedAt: daysAgo(2),
      context: { topic: 'CNAPP consolidation', score: 84 },
    },
  ],

  // Databricks — competitor renewal + install + tenant momentum
  'acct-databricks': [
    {
      signalId: 'competitor_renewal_window',
      firedAt: daysAgo(1),
      context: {
        competitor: 'Lacework Polygraph',
        renewalWindowDays: 87,
        installAge: '31 months',
      },
    },
    {
      signalId: 'competitor_install_detected',
      firedAt: daysAgo(10),
      context: { competitor: 'Lacework Polygraph' },
    },
    {
      signalId: 'trustradius_intent',
      firedAt: daysAgo(4),
      context: {
        productCompared: 'CNAPP category · Wiz vs Lacework',
      },
    },
    {
      signalId: 'partner_install_detected',
      firedAt: daysAgo(14),
      context: { partner: 'Snowflake' },
    },
    {
      signalId: 'tenant_product_momentum',
      firedAt: daysAgo(2),
      context: { direction: 'increasing', delta: '+ 24 seats · 30d' },
    },
  ],

  // Visa — closing soon opp, compliance intent + partner install
  'acct-visa': [
    {
      signalId: 'topic_intent',
      firedAt: daysAgo(1),
      context: { topic: 'Compliance automation', score: 78 },
    },
    {
      signalId: 'trustradius_intent',
      firedAt: daysAgo(5),
      context: { productCompared: 'Wiz vs Aqua vs Prisma' },
    },
    {
      signalId: 'partner_install_detected',
      firedAt: daysAgo(11),
      context: { partner: 'ServiceNow' },
    },
  ],

  // Mastercard — marketing engaged + web signals
  'acct-mastercard': [
    {
      signalId: 'marketing_activity_7d',
      firedAt: daysAgo(2),
      context: {
        summary: 'Attended "Financial Services CNAPP" webinar + downloaded compliance guide',
        source: 'Webinar + gated content',
        count: 2,
      },
    },
    {
      signalId: 'web_activity_7d',
      firedAt: daysAgo(4),
      context: {
        summary: '4 pageviews on /use-cases/compliance-automation',
        page: '/use-cases/compliance-automation',
        count: 4,
      },
    },
    {
      signalId: 'topic_intent',
      firedAt: daysAgo(3),
      context: { topic: 'Cloud security posture', score: 74 },
    },
  ],

  // Datadog — sales + web activity + intent
  'acct-datadog': [
    {
      signalId: 'sales_activity_7d',
      firedAt: daysAgo(2),
      context: {
        count: 4,
        type: 'outreach opens',
        summary: '4 outreach opens this week from Head of Platform Security',
      },
    },
    {
      signalId: 'web_activity_7d',
      firedAt: daysAgo(1),
      context: {
        count: 6,
        page: '/pricing + /solutions/cnapp',
        summary: '6 pageviews on /pricing and /solutions/cnapp — high-intent browsing',
      },
    },
    {
      signalId: 'trustradius_intent',
      firedAt: daysAgo(6),
      context: { productCompared: 'Wiz vs Aqua vs Prisma' },
    },
  ],

  // Spotify — tenant product decreasing (retention risk) + competitor momentum up
  'acct-spotify': [
    {
      signalId: 'tenant_product_momentum',
      firedAt: daysAgo(3),
      context: { direction: 'decreasing', delta: '− 12 seats · 45d' },
    },
    {
      signalId: 'competitor_momentum_increasing',
      firedAt: daysAgo(5),
      context: {
        competitor: 'Wiz',
        delta: '+ 8 installs · 30d',
        trend: 'security team piloting alongside',
      },
    },
    {
      signalId: 'sales_activity_7d',
      firedAt: daysAgo(2),
      context: {
        summary: '2 unopened outreach emails to CISO this week',
        count: 2,
      },
    },
  ],

  // Block — marketing + intent, fintech vertical
  'acct-block': [
    {
      signalId: 'marketing_activity_7d',
      firedAt: daysAgo(3),
      context: {
        summary: 'Attended CNAPP webinar + downloaded "Fintech CNAPP" guide',
        source: 'Webinar + gated content',
        count: 3,
      },
    },
    {
      signalId: 'topic_intent',
      firedAt: daysAgo(5),
      context: { topic: 'Fintech security', score: 71 },
    },
    {
      signalId: 'web_activity_7d',
      firedAt: daysAgo(1),
      context: {
        summary: '3 pageviews on /industries/fintech',
        page: '/industries/fintech',
        count: 3,
      },
    },
  ],

  // Stripe — partner install (AWS) + tenant momentum growing
  'acct-stripe': [
    {
      signalId: 'partner_install_detected',
      firedAt: daysAgo(12),
      context: { partner: 'AWS' },
    },
    {
      signalId: 'tenant_product_momentum',
      firedAt: daysAgo(4),
      context: { direction: 'increasing', delta: '+ 40% seat growth · QoQ' },
    },
    {
      signalId: 'topic_intent',
      firedAt: daysAgo(6),
      context: { topic: 'Payment infrastructure security', score: 76 },
    },
  ],

  // Pinterest — web + sales activity, early-cycle
  'acct-pinterest': [
    {
      signalId: 'web_activity_7d',
      firedAt: daysAgo(2),
      context: {
        summary: '3 pageviews on /solutions/consumer-tech',
        page: '/solutions/consumer-tech',
        count: 3,
      },
    },
    {
      signalId: 'sales_activity_7d',
      firedAt: daysAgo(3),
      context: {
        summary: '3 outreach opens from VP Platform Security',
        count: 3,
      },
    },
    {
      signalId: 'topic_intent',
      firedAt: daysAgo(4),
      context: { topic: 'Container security', score: 68 },
    },
  ],

  // Cloudflare — competitor install + competitor churning + partner install
  'acct-cloudflare': [
    {
      signalId: 'competitor_install_detected',
      firedAt: daysAgo(15),
      context: { competitor: 'Orca Security' },
    },
    {
      signalId: 'competitor_momentum_decreasing',
      firedAt: daysAgo(3),
      context: {
        competitor: 'Orca Security',
        delta: '− 9 installs · 45d',
        trend: 'usage declining across security team',
      },
    },
    {
      signalId: 'partner_install_detected',
      firedAt: daysAgo(9),
      context: { partner: 'AWS' },
    },
  ],
};

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

// Return every synthesized firing for a persona's book. Each firing is
// normalized with the catalog metadata attached so consumers don't need
// to look it up separately.
export function listSignalFirings(personaId, { category, sinceDays } = {}) {
  const accounts = getAccountsForOwner(personaId) || [];
  const rows = [];
  for (const account of accounts) {
    const firings = ACCOUNT_FIRINGS[account.id] || [];
    for (const f of firings) {
      const def = getSignalDefinition(f.signalId);
      if (!def) continue;
      if (category && def.category !== category) continue;
      if (sinceDays != null) {
        try {
          const firedMs = new Date(f.firedAt).getTime();
          const cutoff = TODAY.getTime() - sinceDays * 24 * 60 * 60 * 1000;
          if (firedMs < cutoff) continue;
        } catch {
          // fall through — include the firing
        }
      }
      rows.push({
        signalId: f.signalId,
        accountId: account.id,
        accountName: account.name,
        accountLogo: account.logoColor,
        firedAt: f.firedAt,
        context: f.context || {},
        definition: def,
        // Weight — allow per-firing override (e.g., single_threaded when
        // Amount ≥ $50K bumps 40 → 80). Falls back to the catalog weight.
        weight: (f.context && f.context.weight != null) ? f.context.weight : def.weight,
      });
    }
  }
  return rows;
}

// Convenience — return firings for a single account.
export function listFiringsForAccount(accountId, { category } = {}) {
  const rows = [];
  const firings = ACCOUNT_FIRINGS[accountId] || [];
  for (const f of firings) {
    const def = getSignalDefinition(f.signalId);
    if (!def) continue;
    if (category && def.category !== category) continue;
    rows.push({
      signalId: f.signalId,
      accountId,
      firedAt: f.firedAt,
      context: f.context || {},
      definition: def,
      weight: (f.context && f.context.weight != null) ? f.context.weight : def.weight,
    });
  }
  return rows;
}

// Returns which accounts (by id) have at least one firing in the given
// category. Powers the workbook signal-category filter.
export function accountsWithSignalInCategory(personaId, categoryId) {
  const set = new Set();
  const rows = listSignalFirings(personaId, { category: categoryId });
  for (const r of rows) set.add(r.accountId);
  return set;
}

// The catalog itself, re-exported so single-import consumers exist.
export { SIGNAL_CATALOG };
