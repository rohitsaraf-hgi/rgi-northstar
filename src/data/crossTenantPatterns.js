// Anonymized cross-tenant patterns surface — Phase 3.9.
//
// These patterns are observed across the customer base (median fire rates,
// effectiveness benchmarks, threshold ranges) and never expose tenant logic
// or tenant names. Real catalog accrues post-launch; this is a hand-curated
// static set for the prototype UX.

import { NODE_TYPES } from './signals.js';

// Detect whether a tree's source/structure shape matches a known pattern.
// Returns the matching pattern object or null.

function hasSource(tree, predicate) {
  return Object.values(tree.nodes || {}).some(
    (n) => NODE_TYPES[n.type]?.family === 'source' && predicate(n),
  );
}

const PATTERNS = [
  {
    id: 'displacement',
    detect: (tree) =>
      hasSource(tree, (n) => n.type === 'source.hg' && /install/i.test(n.config?.field || '')) &&
      hasSource(tree, (n) => n.type === 'source.hg' && /spend/i.test(n.config?.field || '')),
    headline: 'Displacement pattern detected',
    insight: 'Tenants pairing install_age with spend trajectory see 23% median reply rate on displacement plays — 4× cold outbound baseline.',
    benchmarks: [
      { label: 'Effective install threshold', value: '36–42 months' },
      { label: 'Median fire rate', value: '3–8% of book' },
      { label: 'Reply rate when fired', value: '18–28%' },
    ],
    advice: 'Add a recent leadership-change signal to lift reply rate another ~6 pts in fintech.',
  },
  {
    id: 'onboarding',
    detect: (tree) =>
      hasSource(tree, (n) => n.type === 'source.crm' && /closed_won/i.test(n.config?.field || '')) &&
      hasSource(tree, (n) => n.type === 'source.event' && /login|usage/i.test(n.config?.event || '')) &&
      hasSource(tree, (n) => n.type === 'source.event' && /marketo|email/i.test(`${n.config?.source} ${n.config?.event}`)),
    headline: 'Onboarding-engagement pattern detected',
    insight: 'AND across product + marketing engagement (the 2-of-2 pattern) recovers 67% of stalled new customers when paired with an outreach play.',
    benchmarks: [
      { label: 'Typical post-close window', value: '60–90 days' },
      { label: 'Effective no-login window', value: '14–21 days' },
      { label: 'Median ARR floor (SaaS)', value: '$10k–$50k' },
    ],
    advice: 'Tenants typically gate by ARR > $25k to avoid noise from PLG accounts.',
  },
  {
    id: 'renewal',
    detect: (tree) =>
      hasSource(tree, (n) => n.type === 'source.crm' && /renewal/i.test(n.config?.field || '')) &&
      hasSource(tree, (n) => n.type === 'source.event' && /usage|gong|exec/i.test(`${n.config?.source} ${n.config?.event}`)),
    headline: 'Renewal-risk pattern detected',
    insight: 'Surfaced 90-120 days out, this pattern gives AMs 2.3× more turnaround time vs. 60-day signals — at the cost of ~20% more false positives.',
    benchmarks: [
      { label: 'Best window (median)', value: '90 days' },
      { label: 'Save rate when fired early', value: '38–52%' },
      { label: 'Bound play depth', value: '3-step (call → exec brief → save plan)' },
    ],
    advice: 'Add a support-ticket spike signal as a 4th input to catch friction the calendar misses.',
  },
  {
    id: 'expansion',
    detect: (tree) =>
      hasSource(tree, (n) => n.type === 'source.hg' && /spend/i.test(n.config?.field || '')) &&
      hasSource(tree, (n) => n.type === 'source.crm' && /champion|contact/i.test(n.config?.field || '')),
    headline: 'Expansion pattern detected',
    insight: 'Champion presence is the single highest-lift feature for expansion in SaaS — 3.1× win rate vs. accounts without a confirmed champion.',
    benchmarks: [
      { label: 'Tier A threshold (typical)', value: '>20% spend YoY + champion' },
      { label: 'Avg expansion ARR multiplier', value: '1.4–1.9×' },
      { label: 'Time to expansion close', value: '45–80 days' },
    ],
    advice: 'Pair this signal with a "Recent product launch" play for 25% higher meeting-book rate.',
  },
  {
    id: 'engagement_score',
    detect: (tree) => {
      const sources = Object.values(tree.nodes || {}).filter(
        (n) => n.type === 'source.event' && /marketo|outreach|email|form/i.test(`${n.config?.source} ${n.config?.event}`),
      );
      return sources.length >= 2;
    },
    headline: 'Engagement scoring pattern detected',
    insight: 'Engagement scores with form weight 4-6× opens outperform equal-weighted by 31% on closed-won prediction.',
    benchmarks: [
      { label: 'Opens weight (typical)', value: '1×' },
      { label: 'Forms weight (typical)', value: '4–6×' },
      { label: 'Content weight (typical)', value: '3×' },
      { label: 'Effective cap', value: 'percentile-95' },
    ],
    advice: 'Add a recency decay so opens older than 14 days lose weight.',
  },
];

export function detectPattern(tree) {
  if (!tree?.nodes || Object.keys(tree.nodes).length === 0) return null;
  for (const p of PATTERNS) {
    try {
      if (p.detect(tree)) return p;
    } catch {
      // Skip pattern on error.
    }
  }
  return null;
}
