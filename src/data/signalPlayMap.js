// Signal → Recommended Play mapper.
//
// Each firing category resolves to a concrete play recommendation with a
// primary CTA. Multiple firings on one account produce multiple play cards,
// deduped by category (so an account with three Coverage signals gets one
// "Find buying committee" card, not three).
//
// Every play card carries:
//   { id, title, category, rationale, agentId, ctaLabel, sourceSignalIds }

import { listFiringsForAccount } from './signalFirings.js';

// Category → play template. The template's rationale gets filled in with
// details from the specific firing(s) on the account.
const PLAY_BY_CATEGORY = {
  deal_health: {
    title: 'Generate deal status brief',
    category: 'Deal Health',
    agentId: 'generate_account_brief',
    ctaLabel: 'Draft brief',
    rationaleFor: (firings) => {
      const stuck = firings.find((f) => f.signalId === 'stuck_at_stage');
      const past = firings.find((f) => f.signalId === 'past_close_date');
      const soon = firings.find((f) => f.signalId === 'closing_in_14_days');
      if (past) return `Close date passed by ${past.context.pastDueDays}d on ${past.context.oppName || 'the opportunity'} — brief the account team.`;
      if (soon) return `${soon.context.oppName || 'Opportunity'} closes in ${soon.context.closesInDays}d — no MEDDIC brief yet.`;
      if (stuck) return `${stuck.context.oppName || 'Opportunity'} has been at "${stuck.context.stage}" for ${stuck.context.daysAtStage}d — needs a stalled-deal brief.`;
      return 'Deal health signal detected on this account.';
    },
  },
  engagement: {
    title: 'Draft outreach email',
    category: 'Engagement',
    agentId: 'draft_personalized_email',
    ctaLabel: 'Draft email',
    rationaleFor: (firings) => {
      const noAct = firings.find((f) => f.signalId === 'no_activity_30d');
      const noMtg = firings.find((f) => f.signalId === 'no_meeting_21d');
      if (noAct) return `No activity in ${noAct.context.lastActivityDaysAgo}d on ${noAct.context.oppName || 'the open opp'} — send a re-engagement touch.`;
      if (noMtg) return `Last meeting was ${noMtg.context.lastMeetingDaysAgo}d ago — draft a quick-sync ask.`;
      return 'Engagement decay detected — send a re-engagement touch.';
    },
  },
  relationship_coverage: {
    title: 'Find buying committee',
    category: 'Relationship Coverage',
    agentId: 'find_buying_personas',
    ctaLabel: 'Find contacts',
    rationaleFor: (firings) => {
      const st = firings.find((f) => f.signalId === 'single_threaded');
      const noEb = firings.find((f) => f.signalId === 'no_economic_buyer');
      const noCh = firings.find((f) => f.signalId === 'no_champion');
      if (st) return `Single-threaded on ${st.context.oppName || 'the opp'} (${st.context.linkedContact || 'one contact'}) — surface additional stakeholders.`;
      if (noEb) return 'No VP/C-level linked as Decision Maker — find an economic buyer.';
      if (noCh) return 'No champion identified on the opp — surface an internal advocate.';
      return 'Coverage gap detected — surface additional buying-committee members.';
    },
  },
  deal_risk: {
    title: 'Prepare competitive battlecard',
    category: 'Deal Risk',
    agentId: 'competitive_battlecard',
    ctaLabel: 'Draft battlecard',
    rationaleFor: (firings) => {
      const cm = firings.find((f) => f.signalId === 'competitor_mentioned');
      const proc = firings.find((f) => f.signalId === 'procurement_added_late');
      const sec = firings.find((f) => f.signalId === 'late_stage_no_security_review');
      if (cm) return `${cm.context.competitor} mentioned at stage "${cm.context.stage}" (${cm.context.source || 'source unknown'}) — prep a counter.`;
      if (proc) return `Procurement contact "${proc.context.contactName}" added at stage ${proc.context.addedAtStage} — deal-risk flag.`;
      if (sec) return 'Late stage with no security review logged — get ahead of it before it slips.';
      return 'Deal-risk signal detected on this account.';
    },
  },
  buyer_intent: {
    title: 'Draft peer-comparison outreach',
    category: 'Buyer Intent',
    agentId: 'draft_personalized_email',
    ctaLabel: 'Draft email',
    rationaleFor: (firings) => {
      const tr = firings.find((f) => f.signalId === 'trustradius_intent');
      const topic = firings.find((f) => f.signalId === 'topic_intent');
      if (tr) return `Researching ${tr.context.productCompared} on TrustRadius — reach out with a peer-comparison angle.`;
      if (topic) return `Elevated intent on "${topic.context.topic}" (score ${topic.context.score}) — reference it in the outreach.`;
      return 'Buyer intent surging — send a topic-specific outreach.';
    },
  },
  competitive: {
    title: 'Enter competitive displacement play',
    category: 'Competitive',
    agentId: 'competitive_battlecard',
    ctaLabel: 'Draft battlecard',
    rationaleFor: (firings) => {
      const cr = firings.find((f) => f.signalId === 'competitor_renewal_window');
      const inst = firings.find((f) => f.signalId === 'competitor_install_detected');
      if (cr) return `${cr.context.competitor} renewal window opens in ${cr.context.renewalWindowDays}d — intercept before renegotiation.`;
      if (inst) return `${inst.context.competitor} installed — position for displacement.`;
      return 'Competitor detected in the install base — position for displacement.';
    },
  },
  account_health: {
    title: 'Open a renewal opportunity',
    category: 'Account Health',
    agentId: 'create_crm_tasks',
    ctaLabel: 'Create task',
    rationaleFor: (firings) => {
      const rn = firings.find((f) => f.signalId === 'renewal_not_started');
      const exp = firings.find((f) => f.signalId === 'expansion_untapped');
      const conf = firings.find((f) => f.signalId === 'multi_opp_conflict');
      if (rn) return `Contract ends in ${rn.context.contractEndDays}d — renewal opp not open yet.`;
      if (exp) return `Growth signal: ${exp.context.growthSignal}. Expansion opp not open.`;
      if (conf) return `Multiple open opps (${conf.context.opps}) owned by ${conf.context.owners} — coordinate.`;
      return 'Account-health signal detected — take action.';
    },
  },
  partner: {
    title: 'Loop in partner co-sell',
    category: 'Partner',
    agentId: 'get_account_context',
    ctaLabel: 'Open account',
    rationaleFor: (firings) => {
      const p = firings.find((f) => f.signalId === 'partner_install_detected');
      if (p) return `${p.context.partner} installed — engage co-sell.`;
      return 'Partner product installed — engage co-sell.';
    },
  },
  momentum: {
    title: 'Review usage trajectory',
    category: 'Momentum',
    agentId: 'get_account_context',
    ctaLabel: 'Open account',
    rationaleFor: (firings) => {
      const m = firings.find((f) => f.signalId === 'tenant_product_momentum');
      if (m) return `Momentum ${m.context.direction} · ${m.context.delta}.`;
      return 'Product-install momentum detected.';
    },
  },
  first_party_activity: {
    title: 'Open 1P activity tab',
    category: '1P Activity',
    agentId: null,
    ctaLabel: 'View activity',
    rationaleFor: (firings) => {
      const s = firings[0];
      return s?.definition?.description || 'Recent 1P activity detected.';
    },
  },
};

// Return recommended plays for a specific account, derived from its firings.
// Buckets by category, dedupes, ranks by category weight sum.
export function recommendedPlaysForAccount(accountId, { limit = 3 } = {}) {
  const firings = listFiringsForAccount(accountId);
  if (!firings.length) return [];

  const byCategory = new Map();
  for (const f of firings) {
    const cat = f.definition.category;
    const bucket = byCategory.get(cat) || { category: cat, firings: [], weightSum: 0 };
    bucket.firings.push(f);
    bucket.weightSum += f.weight || 0;
    byCategory.set(cat, bucket);
  }

  const plays = [];
  for (const [cat, bucket] of byCategory.entries()) {
    const template = PLAY_BY_CATEGORY[cat];
    if (!template) continue;
    plays.push({
      id: `play-${accountId}-${cat}`,
      title: template.title,
      category: template.category,
      agentId: template.agentId,
      ctaLabel: template.ctaLabel,
      rationale: template.rationaleFor(bucket.firings),
      sourceSignalIds: bucket.firings.map((f) => f.signalId),
      weight: bucket.weightSum,
    });
  }

  plays.sort((a, b) => b.weight - a.weight);
  return plays.slice(0, limit);
}

// Which agent should fire for a specific signal? Used by the compressed-row
// top-CTA (picks the highest-weight firing on the account).
export function primaryPlayForAccount(accountId) {
  const plays = recommendedPlaysForAccount(accountId, { limit: 1 });
  return plays[0] || null;
}
