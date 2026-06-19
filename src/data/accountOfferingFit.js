// Per-account, per-offering fit scores with reasoning traces.
//
// Lives alongside accounts.js so we don't have to rewrite the entire account
// dataset. In production these would come from the per-offering scoring model
// pipeline. Here we curate so the demo loop is provable.

// Curated fit per account, per offering. Each entry: { score, reasons: [...] }
// where reasons surface why the score is what it is (the "why" Alex sees on
// the provenance card).
//
// Keyed by accountId → offeringId → { score, reasons[] }
const FITS = {
  'acct-jpmc': {
    cnapp: {
      score: 96,
      reasons: [
        'Multi-cloud AWS + Azure footprint',
        'Active CNAPP RFP signal — 87pt surge in 14 days',
        'New CISO with public posture-unification mandate',
        'No CNAPP incumbent detected',
      ],
    },
    ciem: {
      score: 78,
      reasons: ['Heavy AWS IAM footprint', 'No identity-governance signals yet', 'Likely cross-sell after CNAPP lands'],
    },
    dspm: {
      score: 62,
      reasons: ['No Snowflake/Databricks footprint detected', 'Compliance-driven — could surface later'],
    },
    workload: {
      score: 54,
      reasons: ['Kubernetes presence unconfirmed', 'Banking — less container-forward'],
    },
  },
  'acct-snowflake': {
    cnapp: {
      score: 95,
      reasons: [
        'Multi-cloud AWS + Azure + GCP',
        'New CISO from Datadog — security maturity bias',
        'No CNAPP incumbent',
        'Pre-IPO posture push (38 surge topics)',
      ],
    },
    ciem: {
      score: 72,
      reasons: ['SaaS-heavy identity surface', 'No active IAM-audit signal'],
    },
    dspm: {
      score: 91,
      reasons: [
        'Data warehouse — primary product is data',
        'Pre-IPO compliance posture is critical',
        'DSPM in their surge topic list',
      ],
    },
    workload: {
      score: 47,
      reasons: ['Snowpark/Kubernetes presence is light', 'Runtime-defense not in current buying cycle'],
    },
  },
  'acct-acme': {
    cnapp: {
      score: 92,
      reasons: [
        'Multi-cloud confirmed',
        'CFO engaged on enterprise pricing',
        'Strong MEDDIC progression',
      ],
    },
    ciem: {
      score: 68,
      reasons: ['Okta confirmed as IDP', 'Cross-sell potential after CNAPP'],
    },
    dspm: {
      score: 41,
      reasons: ['No data-platform install detected', 'Lower fit for current motion'],
    },
    workload: {
      score: 55,
      reasons: ['Some Kubernetes signals', 'Not a champion-led motion here'],
    },
  },
  'acct-databricks': {
    cnapp: {
      score: 78,
      reasons: [
        'Multi-cloud AWS + Azure + GCP',
        'Orca contract expiring Sept — displacement window',
        'But Agent Bricks launch pulls focus toward runtime — CNAPP is the secondary motion',
      ],
    },
    ciem: {
      score: 64,
      reasons: ['Identity surface present but no active signal'],
    },
    dspm: {
      score: 94,
      reasons: [
        'Data platform vendor — DSPM is their domain',
        'Pre-IPO compliance need',
        'Likely champion among customer-success engineers',
      ],
    },
    workload: {
      score: 92,
      reasons: [
        '100k+ AI agents in production — runtime defense is the natural lead',
        'Unity AI Gateway needs an infrastructure security layer',
        'FedRAMP High pursuit forces the compliance clock',
      ],
    },
  },
  'acct-visa': {
    cnapp: {
      score: 94,
      reasons: ['Existing customer — CNAPP renewal in pipeline', 'Multi-cloud confirmed'],
    },
    ciem: {
      score: 87,
      reasons: ['Banking — heavy IAM compliance need', 'Existing Wiz relationship aids cross-sell'],
    },
    dspm: {
      score: 71,
      reasons: ['Compliance-heavy — DSPM fits regulatory motion'],
    },
    workload: {
      score: 58,
      reasons: ['Some Kubernetes adoption', 'Lower priority lens for this account'],
    },
  },
  'acct-mastercard': {
    cnapp: { score: 88, reasons: ['Banking regulated workload', 'AWS-heavy', 'Renewal cycle aligns'] },
    ciem: { score: 92, reasons: ['Active IAM-audit RFP', 'Banking compliance', 'Champion identified'] },
    dspm: { score: 76, reasons: ['Heavy data platform spend', 'Regulatory compliance match'] },
    workload: { score: 49, reasons: ['Container adoption is low'] },
  },
  'acct-datadog': {
    cnapp: { score: 82, reasons: ['SaaS-heavy', 'Self-aware on security tooling'] },
    ciem: { score: 71, reasons: ['Standard SaaS identity stack'] },
    dspm: { score: 68, reasons: ['Some data-platform adoption'] },
    workload: { score: 91, reasons: ['Kubernetes vendor — runtime security is core', 'Devops champion likely'] },
  },
  'acct-spotify': {
    cnapp: { score: 78, reasons: ['GCP-primary cloud', 'Mid-sized cloud spend'] },
    ciem: { score: 64, reasons: ['Identity surface modest'] },
    dspm: { score: 72, reasons: ['User-data heavy', 'Compliance posture push'] },
    workload: { score: 84, reasons: ['Kubernetes-native', 'Heavy CI/CD adoption'] },
  },
  'acct-block': {
    cnapp: { score: 73, reasons: ['AWS-only simplifies CNAPP buy', 'Posture refresh on roadmap but not in flight'] },
    ciem: { score: 81, reasons: ['Fintech identity compliance', 'Recent breach industry-wide drives push'] },
    dspm: { score: 64, reasons: ['Heavy data platform — Snowflake confirmed', 'Compliance owned by GRC, not security'] },
    workload: { score: 89, reasons: ['Crypto + Cash App + Square — multi-product runtime exposure', 'Recent fraud telemetry investments'] },
  },
  'acct-stripe': {
    cnapp: { score: 71, reasons: ['Cloud security posture exists but engineering-owned, not security-led', 'Slower CNAPP buying motion'] },
    ciem: { score: 76, reasons: ['Fintech IAM compliance critical', 'Standard Okta + custom IAM stack'] },
    dspm: { score: 92, reasons: ['Shift-left DevSec culture is gold-standard', 'Heavy IaC + supply-chain posture', 'Code Security is the natural lead'] },
    workload: { score: 58, reasons: ['Kubernetes adoption is moderate', 'Runtime defense is a later motion'] },
  },
  'acct-pinterest': {
    cnapp: { score: 86, reasons: ['AWS-heavy posture push', 'Recent CISO hire signals refresh'] },
    ciem: { score: 62, reasons: ['Standard SaaS IAM'] },
    dspm: { score: 44, reasons: ['Light data-platform footprint', 'Consumer-data compliance is mature already'] },
    workload: { score: 56, reasons: ['Container adoption growing but not yet a runtime-security buyer'] },
  },
  'acct-cloudflare': {
    cnapp: { score: 88, reasons: ['Workers AI + R2 growth turns Cloudflare into a workload provider', 'Multi-cloud confirmed', 'Edge platform — strong security culture'] },
    ciem: { score: 74, reasons: ['Standard SaaS IAM with growth'] },
    dspm: { score: 42, reasons: ['Less data-warehouse adoption', 'Edge-first architecture limits DSPM relevance'] },
    workload: { score: 81, reasons: ['Kubernetes + edge runtime', 'DevSecOps focus'] },
  },
};

export const SCORE_TIERS = {
  A: { min: 85, label: 'A', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40' },
  B: { min: 70, label: 'B', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500/15', border: 'border-sky-500/40' },
  C: { min: 50, label: 'C', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/40' },
  Out: { min: 0, label: 'Out', color: 'text-text-muted', bg: 'bg-surface-2', border: 'border-border' },
};

export function tierForScore(score) {
  if (score == null) return SCORE_TIERS.Out;
  if (score >= 85) return SCORE_TIERS.A;
  if (score >= 70) return SCORE_TIERS.B;
  if (score >= 50) return SCORE_TIERS.C;
  return SCORE_TIERS.Out;
}

// Per-account, per-offering fit. Returns { score, reasons }.
// Falls through to whitespace pool if not in the CRM book.
export function getFitFor(accountId, offeringId) {
  const bookFit = FITS[accountId]?.[offeringId];
  if (bookFit) return bookFit;
  // Whitespace fallback — wired at module init time below to avoid circular
  // import at parse time.
  return _whitespaceFitGetter(accountId, offeringId) || { score: null, reasons: [] };
}

// All fit scores for an account, keyed by offeringId. Falls through to whitespace.
export function getAllFitFor(accountId) {
  if (FITS[accountId]) return FITS[accountId];
  return _allWhitespaceFitsGetter(accountId) || {};
}

// Wire these from index.js or app bootstrap to avoid circular imports.
// If unwired they return null/{} which is a safe no-op fallback.
let _whitespaceFitGetter = () => null;
let _allWhitespaceFitsGetter = () => ({});
export function wireWhitespaceFitGetters({ getWhitespaceFit, getAllWhitespaceFitsFor }) {
  if (typeof getWhitespaceFit === 'function') _whitespaceFitGetter = getWhitespaceFit;
  if (typeof getAllWhitespaceFitsFor === 'function') _allWhitespaceFitsGetter = getAllWhitespaceFitsFor;
}

// Best-fit offering for an account — highest score across all offerings.
export function bestOfferingFor(accountId) {
  const fits = FITS[accountId] || {};
  let best = null;
  for (const [offeringId, fit] of Object.entries(fits)) {
    if (!best || (fit.score ?? 0) > (best.score ?? 0)) {
      best = { offeringId, ...fit };
    }
  }
  return best;
}
