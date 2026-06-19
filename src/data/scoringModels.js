// Scoring models — embedded version of the DC scoring methodology.
//
// Structure follows the methodology exactly:
//   - 3 pillars: Fit (50%), Need (35%), Intent (15%)
//   - Standard dimensions per pillar with caps from the skill spec
//   - Composite weights + A/B/C/D tier thresholds
//   - Inputs (NAICS, products, intent topics) auto-derived from the offering config
//
// In production these models would generate SQL against ClickHouse via the
// hg-gtm-tools Python API. Here we curate the structure + mock the tier
// distribution + per-pillar breakdowns so the embedded surface is provable.

import { OFFERINGS } from './offerings.js';

// Pillar metadata
export const PILLARS = {
  fit: {
    id: 'fit',
    label: 'Fit',
    description: 'Is this the right kind of company?',
    weight_default: 50,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    accent: '#10b981',
  },
  need: {
    id: 'need',
    label: 'Need',
    description: 'Does their tech stack show a need?',
    weight_default: 35,
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    accent: '#0ea5e9',
  },
  intent: {
    id: 'intent',
    label: 'Intent',
    description: 'Are they actively researching?',
    weight_default: 15,
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    accent: '#8b5cf6',
  },
};

// Tier metadata
export const SCORING_TIERS = [
  { id: 'A', threshold: 75, label: 'A', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', accent: '#10b981' },
  { id: 'B', threshold: 55, label: 'B', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500/15', border: 'border-sky-500/40', accent: '#0ea5e9' },
  { id: 'C', threshold: 35, label: 'C', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/40', accent: '#f59e0b' },
  { id: 'D', threshold: 15, label: 'D', color: 'text-text-muted', bg: 'bg-surface-2', border: 'border-border', accent: '#94a3b8' },
];

// Auto-derive inputs from an offering's config.
function deriveDimensionsFromOffering(offering) {
  return {
    fit: [
      {
        id: 'company-size',
        name: 'Company Size',
        cap: 30,
        rule: 'Bell-curve on the sweet spot. Employees + revenue scored independently, best-of selected. Below floor → 0 pts; above ceiling → reduced pts (longer cycles).',
        autoBuilt: true,
        autoBuiltFrom: 'offering.targetICP.employees',
        inputs: [
          { label: 'Sweet-spot employees', value: offering.targetICP.employees, source: 'offering' },
          { label: 'Floor', value: '500 employees' },
          { label: 'Ceiling', value: '50,000 (slightly reduced)' },
          { label: 'Revenue sub-dim', value: '$100M – $10B' },
        ],
      },
      {
        id: 'industry-fit',
        name: 'Industry Fit',
        cap: 30,
        rule: 'Tier-1 / Tier-2 / Tier-3 NAICS codes. Tier-1 verticals get max points; broad industry parent codes get partial points.',
        autoBuilt: true,
        autoBuiltFrom: 'offering.targetICP.industries',
        inputs: offering.targetICP.industries.map((industry, i) => ({
          label: i === 0 ? 'Tier 1' : i === 1 ? 'Tier 2' : 'Tier 3',
          value: industry,
          source: 'offering',
        })),
      },
      {
        id: 'it-spend',
        name: 'IT Spend (Bonus)',
        cap: 15,
        rule: 'Bonus dimension — companies without spend data are not penalized. Maps spend intensity in target categories to points.',
        autoBuilt: true,
        autoBuiltFrom: 'offering.complementaryTech',
        inputs: [
          { label: 'Spend categories', value: 'Cloud · Security · IT Infrastructure', source: 'offering' },
          { label: 'Threshold', value: '$1M+ annual cloud spend = full points' },
        ],
      },
      {
        id: 'complexity-signals',
        name: 'Complexity Signals',
        cap: 25,
        rule: 'Regulation, multinational footprint, Fortune/Forbes presence, IT spend intensity. Indicates platform-buying capability.',
        autoBuilt: false,
        autoBuiltFrom: null,
        inputs: [
          { label: 'Multinational', value: '+8 pts if HQ in US + entities in 3+ countries' },
          { label: 'Fortune/Forbes 1000', value: '+6 pts' },
          { label: 'Regulated industry', value: '+6 pts (Banking, Healthcare, Government)' },
          { label: 'High IT spend intensity', value: '+5 pts (>5% of revenue)' },
        ],
      },
    ],
    fitDisqualifiers: [
      { rule: 'Employees < 200', whenNull: 'skip' },
      { rule: 'Revenue < $50M', whenNull: 'skip' },
      { rule: 'Industry in {Restaurants, Personal Services}', whenNull: 'skip' },
    ],
    need: [
      {
        id: 'vendor-ecosystem',
        name: 'Vendor Ecosystem',
        cap: 15,
        rule: 'Existing Wiz products at the account → cross-sell signal. Each product detected = +3 pts.',
        autoBuilt: false,
        autoBuiltFrom: null,
        inputs: [{ label: 'Wiz products tracked', value: 'CNAPP, CIEM, DSPM, Workload Protection' }],
      },
      {
        id: 'displacement-targets',
        name: 'Displacement Targets',
        cap: 35,
        rule: 'Competitor products grouped into Enterprise / Mid-market / Adjacent tiers. Sub-group caps prevent any single tier from dominating.',
        autoBuilt: true,
        autoBuiltFrom: 'offering.competitors',
        inputs: [
          { label: 'Enterprise tier', value: offering.competitors.slice(0, 2).join(', '), points: '15 pts', source: 'offering' },
          { label: 'Mid-market tier', value: offering.competitors.slice(2, 4).join(', ') || '(none)', points: '12 pts', source: 'offering' },
          { label: 'Adjacent tier', value: offering.competitors.slice(4).join(', ') || '(none)', points: '8 pts', source: 'offering' },
        ],
      },
      {
        id: 'tech-demand',
        name: 'Tech Demand Signals',
        cap: 15,
        rule: 'Systems generating workload that this offering addresses. Each category present = +3 pts.',
        autoBuilt: true,
        autoBuiltFrom: 'offering.complementaryTech',
        inputs: offering.complementaryTech.slice(0, 5).map((t) => ({
          label: t,
          value: '+3 pts if detected',
          source: 'offering',
        })),
      },
      {
        id: 'tech-sophistication',
        name: 'Tech Sophistication',
        cap: 10,
        rule: 'Cloud platforms, iPaaS, compliance tools — readiness signals indicating maturity.',
        autoBuilt: false,
        autoBuiltFrom: null,
        inputs: [
          { label: 'Multi-cloud (AWS + Azure + GCP)', value: '+4 pts' },
          { label: 'iPaaS (MuleSoft / Boomi / Workato)', value: '+3 pts' },
          { label: 'Compliance tool detected', value: '+3 pts' },
        ],
      },
      {
        id: 'fragmentation',
        name: 'Fragmentation',
        cap: 10,
        rule: 'Multiple overlapping tools in the offering category = consolidation pain. 2 tools = 4 pts · 3 = 7 pts · 4+ = 10 pts.',
        autoBuilt: false,
        autoBuiltFrom: null,
        inputs: [{ label: 'Tools per category', value: 'count distinct products in cloud-sec, IAM, data-sec, runtime' }],
      },
      {
        id: 'stack-momentum',
        name: 'Stack Momentum',
        cap: 15,
        rule: 'Positive: new installs of complementary tech in last 12 months. Negative: competitor installs in last 12 months (penalty).',
        autoBuilt: true,
        autoBuiltFrom: 'offering.complementaryTech + competitors',
        inputs: [
          { label: 'General IT momentum', value: '+5 pts if any new installs 12mo' },
          { label: 'Relevant tech installs', value: '+8 pts (capped)', source: 'offering' },
          { label: 'Competitor install penalty', value: '−6 pts max', source: 'offering' },
        ],
      },
    ],
    intent: [
      {
        id: 'direct-product-intent',
        name: 'Direct Product Intent',
        cap: 35,
        rule: 'Tenant\'s own product names as intent topics. Level × journey multipliers apply (High+Evaluating = 1.0x, Low = 0.3x).',
        autoBuilt: true,
        autoBuiltFrom: 'offering.intentTopics',
        inputs: offering.intentTopics.slice(0, 4).map((t) => ({
          label: t,
          value: 'max 35 pts after multipliers',
          source: 'offering',
        })),
      },
      {
        id: 'category-intent',
        name: 'Category Intent',
        cap: 30,
        rule: 'Tiered: core (6 pts each), adjacent (4 pts), broad (2 pts). Capped at dimension max.',
        autoBuilt: true,
        autoBuiltFrom: 'offering.intentTopics + painPoints',
        inputs: [
          { label: 'Core categories', value: offering.intentTopics.slice(0, 3).join(', '), points: '6 pts each', source: 'offering' },
          { label: 'Adjacent', value: offering.intentTopics.slice(3, 5).join(', ') || '(derive)', points: '4 pts each', source: 'offering' },
          { label: 'Broad', value: 'cloud · DevOps · security strategy', points: '2 pts each' },
        ],
      },
      {
        id: 'competitor-intent',
        name: 'Competitor Intent',
        cap: 20,
        rule: 'Competitor product/vendor names as intent topics. Strong signal of in-market research.',
        autoBuilt: true,
        autoBuiltFrom: 'offering.competitors',
        inputs: offering.competitors.slice(0, 4).map((c) => ({
          label: c,
          value: 'tracked',
          source: 'offering',
        })),
      },
      {
        id: 'buyer-activity',
        name: 'Buyer Activity',
        cap: 15,
        rule: 'TrustRadius page views — pricing (5 pts), comparison (4 pts), competitor (3 pts), reviews (3 pts), listing (2 pts), category (1 pt).',
        autoBuilt: false,
        autoBuiltFrom: null,
        inputs: [
          { label: 'Pricing page view', value: '5 pts' },
          { label: 'Comparison view', value: '4 pts' },
          { label: 'Competitor view', value: '3 pts' },
          { label: 'Review view', value: '3 pts' },
        ],
      },
    ],
  };
}

// Mock tier distribution per offering (so we have something interesting to show).
const TIER_DISTRIBUTIONS = {
  cnapp: { A: 47, B: 89, C: 320, D: 791, total: 1247 },
  ciem: { A: 23, B: 67, C: 198, D: 959, total: 1247 },
  dspm: { A: 14, B: 41, C: 167, D: 1025, total: 1247 },
  workload: { A: 18, B: 54, C: 220, D: 955, total: 1247 },
};

// Build one model per offering at module load.
// Each model carries a `scoreTuning` factor. resolveFit (in
// accountOfferingFit) multiplies the canonical FITS score by this tuning
// factor and caps at 100, so swapping the model attached to an offering
// visibly shifts every fit score in the workbook for that offering.
// Standard model = 1.0. Conservative tightens (0.85). Aggressive loosens
// (1.15). Tuning is part of the model spec — editing the attached model's
// tuning propagates to every account × offering pair on next render.
function buildModels() {
  const models = [];
  OFFERINGS.forEach((offering, idx) => {
    const dims = deriveDimensionsFromOffering(offering);
    const baseVersion = idx === 0 ? 2 : 1;

    const variants = [
      {
        suffix: 'fit-model',
        nameSuffix: 'Fit Model',
        description: `Scores accounts on fit for ${offering.name}. Composite of firmographic fit, technographic need, and intent research signals. The auto-built default for this offering.`,
        scoreTuning: 1.0,
        tierThresholds: { A: 75, B: 55, C: 35, D: 15 },
        compositeWeights: { fit: 50, need: 35, intent: 15 },
      },
      {
        suffix: 'fit-model-conservative',
        nameSuffix: 'Fit Model · Conservative',
        description: `Stricter scoring of fit for ${offering.name}. Higher tier thresholds, lower tuning. Use when you want only the most surgical match list.`,
        scoreTuning: 0.85,
        tierThresholds: { A: 80, B: 65, C: 45, D: 20 },
        compositeWeights: { fit: 60, need: 30, intent: 10 },
      },
      {
        suffix: 'fit-model-aggressive',
        nameSuffix: 'Fit Model · Aggressive',
        description: `Broader scoring of fit for ${offering.name}. Lower tier thresholds, higher tuning. Use when you want to widen the funnel for top-of-funnel motion.`,
        scoreTuning: 1.15,
        tierThresholds: { A: 70, B: 50, C: 30, D: 10 },
        compositeWeights: { fit: 40, need: 35, intent: 25 },
      },
    ];

    variants.forEach((v, vIdx) => {
      models.push({
        id: `${offering.id}-${v.suffix}`,
        offering_id: offering.id, // canonical/default offering association
        name: `${offering.name} ${v.nameSuffix}`,
        description: v.description,
        version: vIdx === 0 ? baseVersion : 1,
        status: 'active',
        scoreTuning: v.scoreTuning,
        is_default: vIdx === 0,
        created_by: vIdx === 0 ? 'Marcus' : 'Priya',
        created_by_role: vIdx === 0 ? 'MOps' : 'RevOps',
        auto_built_from_offering_at:
          vIdx === 0
            ? idx === 0
              ? 'April 28, 2026 · 2:30 PM'
              : 'May 5, 2026 · 11:08 AM'
            : 'June 14, 2026 · 9:42 AM',
        last_evaluated: vIdx === 0 ? (idx === 0 ? '2 hr ago' : '8 hr ago') : '3 days ago',
        accounts_scored: 1247,
        tier_distribution: TIER_DISTRIBUTIONS[offering.id] || TIER_DISTRIBUTIONS.cnapp,
        composite_weights: v.compositeWeights,
        tier_thresholds: v.tierThresholds,
        fit: { shared_across_offerings: true, dimensions: dims.fit, disqualifiers: dims.fitDisqualifiers },
        need: { dimensions: dims.need },
        intent: { dimensions: dims.intent },
        versions: [
          {
            version: 1,
            published_at: 'April 14, 10:00 AM',
            published_by: vIdx === 0 ? 'Marcus' : 'Priya',
            summary:
              vIdx === 0
                ? 'Initial auto-build from offering config.'
                : `Variant created by admin for ${v.nameSuffix.toLowerCase()} motion.`,
          },
        ],
      });
    });
  });
  return models;
}

export const SCORING_MODELS = buildModels();

// ----- Queries -----

export function listScoringModels() {
  return SCORING_MODELS;
}

export function getScoringModel(modelId) {
  return SCORING_MODELS.find((m) => m.id === modelId) || null;
}

// Resolve the active scoring model for an offering. Admin can override
// the default by setting offering.scoringModelId — if a matching model
// exists, it wins. Otherwise we fall back to the auto-built default
// (the `is_default` model for this offering, or whichever model lists
// itself as offering_id=offeringId).
export function getModelForOffering(offeringId, offering = null) {
  if (offering?.scoringModelId) {
    const picked = SCORING_MODELS.find((m) => m.id === offering.scoringModelId);
    if (picked) return picked;
  }
  return (
    SCORING_MODELS.find((m) => m.offering_id === offeringId && m.is_default) ||
    SCORING_MODELS.find((m) => m.offering_id === offeringId) ||
    null
  );
}

// Models that can be attached to a given offering. By default we list the
// models that auto-bind to that offering (its variant family), but the
// admin can also attach a cross-offering model — useful when an offering
// reuses another's scoring shape. The picker shows all available models.
export function listModelsForOfferingPicker(offeringId) {
  const own = SCORING_MODELS.filter((m) => m.offering_id === offeringId);
  const others = SCORING_MODELS.filter((m) => m.offering_id !== offeringId);
  return [...own, ...others];
}

// Tuning factor for the currently attached model — used by the fit
// resolver to multiply canonical FITS scores.
export function tuningForOffering(offeringId, offering = null) {
  const model = getModelForOffering(offeringId, offering);
  return model?.scoreTuning ?? 1.0;
}

// Sum dimension caps to compute a "raw" maximum per pillar.
export function pillarMaxPoints(pillar) {
  return (pillar?.dimensions || []).reduce((s, d) => s + (d.cap || 0), 0);
}

// Sample-account-level breakdown — produces per-pillar synthetic scores using
// the curated fit data in accountOfferingFit.js as the basis. Pure UI affordance.
export function scoreAccountThroughModel(model, accountFitScore) {
  // accountFitScore is the 0-100 score from accountOfferingFit.js. We decompose
  // it into per-pillar contributions roughly proportional to composite weights.
  if (accountFitScore == null) return null;
  const w = model.composite_weights;
  // Synthesize sub-scores that round to the composite.
  const fitContribution = Math.round((accountFitScore * w.fit) / 100);
  const needContribution = Math.round((accountFitScore * w.need) / 100);
  const intentContribution = Math.round((accountFitScore * w.intent) / 100);

  const fitRaw = Math.min(100, Math.round(accountFitScore * 1.0 + (Math.random() * 6 - 3)));
  const needRaw = Math.min(100, Math.max(0, Math.round(accountFitScore * 0.95 + (Math.random() * 8 - 4))));
  const intentRaw = Math.min(100, Math.max(0, Math.round(accountFitScore * 1.05 + (Math.random() * 10 - 5))));

  const total = fitContribution + needContribution + intentContribution;
  const tier =
    total >= model.tier_thresholds.A
      ? 'A'
      : total >= model.tier_thresholds.B
      ? 'B'
      : total >= model.tier_thresholds.C
      ? 'C'
      : 'D';

  return {
    composite: total,
    tier,
    fit: { raw: fitRaw, weighted: fitContribution },
    need: { raw: needRaw, weighted: needContribution },
    intent: { raw: intentRaw, weighted: intentContribution },
  };
}
