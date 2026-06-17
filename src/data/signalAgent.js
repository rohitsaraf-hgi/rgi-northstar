// Mock conversational signal-authoring agent.
//
// Pattern-matches on user intent text and proposes a complete signal tree
// (nodes + edges + meta). Real AI agent lives behind this interface — here
// we hand-curate a small library of recipes so the UX is provable end-to-end.

import { cloneTree } from './signalGraph.js';

// ---- Recipe library ----

const ONBOARDING_STALLED = {
  tree: {
    output_node: 'n_out',
    nodes: {
      n_closed_won: { type: 'source.crm', config: { object: 'opportunity', field: 'closed_won_date' } },
      n_recent_close: { type: 'window.relative', config: { window: 'last 90 days' } },
      n_login: { type: 'source.event', config: { source: 'product', event: 'login' } },
      n_no_login: { type: 'window.relative', config: { window: 'no event in last 21 days' } },
      n_mkto: { type: 'source.event', config: { source: 'marketo', event: 'email_response' } },
      n_no_response: { type: 'rule.compare', config: { op: 'is_null', value: '' } },
      n_and: { type: 'rule.logic', config: { op: 'AND' } },
      n_out: { type: 'threshold.boolean', config: { name: 'Onboarding Stalled' } },
    },
    edges: [
      ['n_closed_won', 'n_recent_close'],
      ['n_recent_close', 'n_and'],
      ['n_login', 'n_no_login'],
      ['n_no_login', 'n_and'],
      ['n_mkto', 'n_no_response'],
      ['n_no_response', 'n_and'],
      ['n_and', 'n_out'],
    ],
  },
  name: 'Onboarding Stalled',
  description: 'New customers (closed-won in last 90 days) not engaging in product or last Marketo campaign.',
  output_type: 'boolean',
  narration:
    "I wired this from your CRM (opportunity.closed_won_date) and two event streams (product.login + marketo.email_response). Sources are AND-ed into a boolean output. Suggest adding an ARR threshold to scope to material accounts.",
  suggestions: [
    { label: 'Add ARR > $25k filter', applies: 'arr_filter' },
    { label: 'Tighten no-login window to 14d', applies: 'shorter_window' },
    { label: 'Add Outreach as another no-response source', applies: 'outreach_source' },
  ],
  crossTenantHint: {
    headline: 'Tenants in SaaS see 67% engagement recovery when this signal pairs with an "Onboarding Rescue" play',
    detail: 'Common pattern: AND across 2-3 channels (product + marketing + sales). Median fire rate 12-18% in SaaS.',
  },
};

const SPLUNK_DISPLACEMENT = {
  tree: {
    output_node: 'n_out',
    nodes: {
      n_install: { type: 'source.hg', config: { entity: 'product', value: 'Splunk', field: 'install_age' } },
      n_install_gate: { type: 'rule.compare', config: { op: '>', value: '36 months' } },
      n_spend: { type: 'source.hg', config: { entity: 'category', value: 'IT', field: 'spend_yoy' } },
      n_spend_gate: { type: 'rule.compare', config: { op: '<', value: '0%' } },
      n_and: { type: 'rule.logic', config: { op: 'AND' } },
      n_out: { type: 'threshold.boolean', config: { name: 'Splunk Aging Displacement' } },
    },
    edges: [
      ['n_install', 'n_install_gate'],
      ['n_install_gate', 'n_and'],
      ['n_spend', 'n_spend_gate'],
      ['n_spend_gate', 'n_and'],
      ['n_and', 'n_out'],
    ],
  },
  name: 'Splunk Aging Displacement',
  description: 'Splunk installs >36mo combined with declining IT spend — primary displacement window.',
  output_type: 'boolean',
  narration:
    "Pulling from HG's technographic depth: install age + IT spend year-over-year. 36mo crosses the typical contract-renewal cliff for Splunk. Want a tighter 48mo cohort instead?",
  suggestions: [
    { label: 'Tighten install threshold to 48 months', applies: 'tighter_install' },
    { label: 'Add competitor (Datadog) install signal', applies: 'add_competitor' },
    { label: 'Require recent CISO hire', applies: 'add_ciso_hire' },
  ],
  crossTenantHint: {
    headline: 'Displacement plays median 23% reply rate when fired on install_age >36mo with declining IT spend',
    detail: '4× higher than blind outbound. Effectiveness peaks at 36-42 months, drops past 48mo.',
  },
};

const RENEWAL_RISK = {
  tree: {
    output_node: 'n_out',
    nodes: {
      n_renew: { type: 'source.crm', config: { object: 'account', field: 'renewal_date' } },
      n_renew_window: { type: 'window.relative', config: { window: 'within 90 days' } },
      n_usage: { type: 'source.event', config: { source: 'product', event: 'feature_usage' } },
      n_usage_delta: { type: 'compute.delta', config: { op: 'last 30d vs prior 30d' } },
      n_meeting: { type: 'source.event', config: { source: 'gong', event: 'exec_meeting' } },
      n_no_meeting: { type: 'compute.delta', config: { op: 'stale_for' } },
      n_and: { type: 'rule.logic', config: { op: 'AND' } },
      n_out: { type: 'threshold.boolean', config: { name: 'Renewal Risk' } },
    },
    edges: [
      ['n_renew', 'n_renew_window'],
      ['n_renew_window', 'n_and'],
      ['n_usage', 'n_usage_delta'],
      ['n_usage_delta', 'n_and'],
      ['n_meeting', 'n_no_meeting'],
      ['n_no_meeting', 'n_and'],
      ['n_and', 'n_out'],
    ],
  },
  name: 'Renewal Risk',
  description: 'Accounts within 90 days of renewal with declining usage and no exec meeting in 60d.',
  output_type: 'boolean',
  narration:
    "Combining your renewal window with product usage delta and exec-engagement staleness. This is a classic 3-of-3 risk pattern. Most AMs want this 120 days out — should I widen?",
  suggestions: [
    { label: 'Widen window to 120 days', applies: 'wider_renewal' },
    { label: 'Add support ticket spike as 4th signal', applies: 'add_support' },
    { label: 'Score (0-100) instead of boolean', applies: 'switch_to_score' },
  ],
  crossTenantHint: {
    headline: 'Renewal signals fired 90-120d out give AMs 2.3× more turnaround time vs 60d',
    detail: 'Earlier signals → more save opportunities. Trade-off: more false positives.',
  },
};

const EXPANSION_READY = {
  tree: {
    output_node: 'n_out',
    nodes: {
      n_spend: { type: 'source.hg', config: { entity: 'category', value: 'Cloud', field: 'spend_yoy' } },
      n_spend_delta: { type: 'compute.delta', config: { op: 'YoY %' } },
      n_stack: { type: 'source.hg', config: { entity: 'category', value: 'BI', field: 'install_count' } },
      n_stack_delta: { type: 'compute.delta', config: { op: 'YoY %' } },
      n_champ: { type: 'source.crm', config: { object: 'contact', field: 'is_champion' } },
      n_logic: { type: 'rule.logic', config: { op: 'AND' } },
      n_out: { type: 'threshold.tier', config: { bands: 'A:>20% / B:10-20% / C:0-10% / Out:<0%' } },
    },
    edges: [
      ['n_spend', 'n_spend_delta'],
      ['n_spend_delta', 'n_logic'],
      ['n_stack', 'n_stack_delta'],
      ['n_stack_delta', 'n_logic'],
      ['n_champ', 'n_logic'],
      ['n_logic', 'n_out'],
    ],
  },
  name: 'Expansion Ready',
  description: 'Existing customers with growing cloud spend, expanded tech stack, and a champion in seat.',
  output_type: 'tier',
  narration:
    "This is a tiered output (A/B/C/Out) based on cloud spend trajectory + tech-stack expansion + champion presence. Tier bands are starter — recalibrate them after looking at your closed-won data.",
  suggestions: [
    { label: 'Recalibrate tier bands on closed-won', applies: 'recalibrate' },
    { label: 'Require min ARR > $50k', applies: 'min_arr' },
    { label: 'Add product usage as 4th signal', applies: 'add_usage' },
  ],
  crossTenantHint: {
    headline: 'Champion presence is the single highest-lift feature for expansion in SaaS — 3.1× win rate',
    detail: 'Pair with growing spend + stack for a strong tier-A definition.',
  },
};

const ENGAGEMENT_SCORE = {
  tree: {
    output_node: 'n_out',
    nodes: {
      n_open: { type: 'source.event', config: { source: 'marketo', event: 'email_opened' } },
      n_open_count: { type: 'compute.aggregate', config: { op: 'count', window: 'last 30d' } },
      n_form: { type: 'source.event', config: { source: 'marketo', event: 'form_submitted' } },
      n_form_count: { type: 'compute.aggregate', config: { op: 'count', window: 'last 30d' } },
      n_weighted: { type: 'compute.aggregate', config: { op: 'weighted_sum', window: '1x opens + 5x forms' } },
      n_out: { type: 'threshold.score', config: { scale: '0-100 capped at percentile-95' } },
    },
    edges: [
      ['n_open', 'n_open_count'],
      ['n_form', 'n_form_count'],
      ['n_open_count', 'n_weighted'],
      ['n_form_count', 'n_weighted'],
      ['n_weighted', 'n_out'],
    ],
  },
  name: 'Marketo Engagement Score',
  description: 'Weighted 0-100 score combining email opens and form submissions over 30 days.',
  output_type: 'score',
  narration:
    "Starter weights — 1x opens, 5x forms. The model is sensitive to weights, so iterate on what predicts your closed-won. I'd add content downloads as a third input if Marketo tracks them.",
  suggestions: [
    { label: 'Add content_downloaded as 3rd input', applies: 'add_content' },
    { label: 'Cap at percentile-90 instead of 95', applies: 'tighter_cap' },
    { label: 'Add Outreach reply rate', applies: 'add_outreach' },
  ],
  crossTenantHint: {
    headline: 'Engagement scores with form weight 4-6× opens outperform equal-weighted by 31%',
    detail: 'Form fills are the strongest leading indicator. Opens are noisy.',
  },
};

const RECIPES = [
  {
    id: 'onboarding-stalled',
    keywords: ['onboarding', 'stalled', 'engagement', 'new customer', 'closed-won', 'login', 'not logged'],
    ...ONBOARDING_STALLED,
  },
  {
    id: 'displacement',
    keywords: ['displacement', 'aging', 'install age', 'splunk', 'competitive', 'takeout', '36', '48', 'spend declin'],
    ...SPLUNK_DISPLACEMENT,
  },
  {
    id: 'renewal-risk',
    keywords: ['renewal', 'risk', 'churn', 'usage decline', 'exec meeting', '90 days', '60 days'],
    ...RENEWAL_RISK,
  },
  {
    id: 'expansion-ready',
    keywords: ['expansion', 'upsell', 'champion', 'cloud spend', 'tech stack', 'growing'],
    ...EXPANSION_READY,
  },
  {
    id: 'engagement-score',
    keywords: ['engagement score', 'lead score', 'marketo', 'email opens', 'form submissions', 'pql'],
    ...ENGAGEMENT_SCORE,
  },
];

// ---- Matching ----

function scoreMatch(text, recipe) {
  const t = text.toLowerCase();
  let score = 0;
  for (const kw of recipe.keywords) {
    if (t.includes(kw)) score += 1;
  }
  return score;
}

export function proposeFromIntent(text) {
  if (!text || !text.trim()) {
    return {
      ok: false,
      narration: "Tell me what signal you want to build — describe the data, the conditions, and what should fire.",
    };
  }
  let best = null;
  for (const recipe of RECIPES) {
    const s = scoreMatch(text, recipe);
    if (s > 0 && (!best || s > best.score)) best = { ...recipe, score: s };
  }
  if (!best) {
    return {
      ok: false,
      narration:
        "I couldn't fully parse that. Try mentioning specific data sources (CRM, Marketo, product events) or recognized patterns (displacement, renewal risk, onboarding, expansion, engagement).",
      suggestions: RECIPES.map((r) => ({ label: r.name, applies: r.id })),
    };
  }
  return {
    ok: true,
    recipeId: best.id,
    tree: cloneTree(best.tree),
    meta: {
      name: best.name,
      description: best.description,
      output_type: best.output_type,
    },
    narration: best.narration,
    suggestions: best.suggestions,
    crossTenantHint: best.crossTenantHint,
  };
}

// Apply a named refinement suggestion to a tree. Returns { tree, narration }.
// This is a tiny, hand-curated set — the demo just needs a couple of these to
// feel alive. Real agent would generate refinements dynamically.
export function applyRefinement(tree, suggestionId) {
  const next = cloneTree(tree);
  switch (suggestionId) {
    case 'arr_filter': {
      const arrId = `n_arr_${Date.now().toString(36)}`;
      const gateId = `n_arrgate_${Date.now().toString(36)}`;
      next.nodes[arrId] = { type: 'source.crm', config: { object: 'account', field: 'arr' } };
      next.nodes[gateId] = { type: 'rule.compare', config: { op: '>', value: '$25k' } };
      // Connect to whichever AND/logic node exists
      const logicId = Object.entries(next.nodes).find(
        ([, n]) => n.type === 'rule.logic' && n.config?.op === 'AND',
      )?.[0];
      next.edges.push([arrId, gateId]);
      if (logicId) next.edges.push([gateId, logicId]);
      return { tree: next, narration: 'Added ARR > $25k filter into the AND node.' };
    }
    case 'shorter_window': {
      // Find a "no event in last 21 days" window and tighten to 14.
      for (const [, n] of Object.entries(next.nodes)) {
        if (n.type === 'window.relative' && /21/.test(n.config?.window || '')) {
          n.config = { ...n.config, window: 'no event in last 14 days' };
        }
      }
      return { tree: next, narration: 'Tightened no-login window from 21d → 14d.' };
    }
    case 'tighter_install': {
      for (const [, n] of Object.entries(next.nodes)) {
        if (n.type === 'rule.compare' && n.config?.value === '36 months') {
          n.config = { ...n.config, value: '48 months' };
        }
      }
      return { tree: next, narration: 'Tightened install threshold 36mo → 48mo.' };
    }
    case 'wider_renewal': {
      for (const [, n] of Object.entries(next.nodes)) {
        if (n.type === 'window.relative' && /90/.test(n.config?.window || '')) {
          n.config = { ...n.config, window: 'within 120 days' };
        }
      }
      return { tree: next, narration: 'Widened renewal window 90d → 120d.' };
    }
    default:
      return { tree: next, narration: 'Refinement queued — full implementation lands when the agent is real.' };
  }
}
