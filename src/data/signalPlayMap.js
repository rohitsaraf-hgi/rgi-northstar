// Signal → Recommended Play mapper.
//
// Each signal id maps to a concrete play recommendation with:
//   { title, category, agentId, ctaLabel, rationaleFor(firing), playKey }
//
// Multiple firings that share the same `playKey` merge into ONE card
// (so an account with three coverage firings gets one "Find contacts" card,
// but distinct signals in the same category produce distinct cards).
//
// The rationale is signal-specific and grounded in the firing's context —
// no generic phrases.

import { listFiringsForAccount } from './signalFirings.js';

const PLAY_BY_SIGNAL = {
  // ─── Deal Health ─────────────────────────────────────────────────────
  past_close_date: {
    title: 'Generate deal status brief',
    category: 'Deal Health',
    agentId: 'generate_account_brief',
    ctaLabel: 'Draft brief',
    playKey: 'deal_status_brief',
    rationaleFor: (f) => `Close date passed by ${f.context.pastDueDays}d on ${f.context.oppName || 'the opportunity'} — brief the account team.`,
  },
  closing_in_14_days: {
    title: 'Generate deal status brief',
    category: 'Deal Health',
    agentId: 'generate_account_brief',
    ctaLabel: 'Draft brief',
    playKey: 'deal_status_brief',
    rationaleFor: (f) => `${f.context.oppName || 'Opportunity'} closes in ${f.context.closesInDays}d — no MEDDIC brief yet.`,
  },
  stuck_at_stage: {
    title: 'Generate deal status brief',
    category: 'Deal Health',
    agentId: 'generate_account_brief',
    ctaLabel: 'Draft brief',
    playKey: 'deal_status_brief',
    rationaleFor: (f) => `${f.context.oppName || 'Opportunity'} has been at "${f.context.stage}" for ${f.context.daysAtStage}d — needs a stalled-deal brief.`,
  },

  // ─── Engagement ──────────────────────────────────────────────────────
  no_activity_30d: {
    title: 'Draft re-engagement email',
    category: 'Engagement',
    agentId: 'draft_personalized_email',
    ctaLabel: 'Draft email',
    playKey: 'reengagement_email',
    rationaleFor: (f) => `No activity in ${f.context.lastActivityDaysAgo}d on ${f.context.oppName || 'the open opp'} — send a re-engagement touch.`,
  },
  no_meeting_21d: {
    title: 'Draft re-engagement email',
    category: 'Engagement',
    agentId: 'draft_personalized_email',
    ctaLabel: 'Draft email',
    playKey: 'reengagement_email',
    rationaleFor: (f) => `Last meeting was ${f.context.lastMeetingDaysAgo}d ago — draft a quick-sync ask.`,
  },

  // ─── Relationship Coverage ───────────────────────────────────────────
  single_threaded: {
    title: 'Find buying committee',
    category: 'Relationship Coverage',
    agentId: 'find_buying_personas',
    ctaLabel: 'Find contacts',
    playKey: 'find_committee',
    rationaleFor: (f) => `Single-threaded on ${f.context.oppName || 'the opp'} (${f.context.linkedContact || 'one contact'}) — surface additional stakeholders.`,
  },
  no_economic_buyer: {
    title: 'Find buying committee',
    category: 'Relationship Coverage',
    agentId: 'find_buying_personas',
    ctaLabel: 'Find contacts',
    playKey: 'find_committee',
    rationaleFor: () => 'No VP/C-level linked as Decision Maker — find an economic buyer.',
  },
  no_champion: {
    title: 'Find buying committee',
    category: 'Relationship Coverage',
    agentId: 'find_buying_personas',
    ctaLabel: 'Find contacts',
    playKey: 'find_committee',
    rationaleFor: () => 'No champion identified on the opp — surface an internal advocate.',
  },
  contacts_none_active: {
    title: 'Find buying committee',
    category: 'Relationship Coverage',
    agentId: 'find_buying_personas',
    ctaLabel: 'Find contacts',
    playKey: 'find_committee',
    rationaleFor: () => 'No active contacts on this account — build initial coverage.',
  },

  // ─── Deal Risk ───────────────────────────────────────────────────────
  competitor_mentioned: {
    title: 'Prepare competitive battlecard',
    category: 'Deal Risk',
    agentId: 'competitive_battlecard',
    ctaLabel: 'Draft battlecard',
    playKey: 'battlecard_deal_risk',
    rationaleFor: (f) => `${f.context.competitor} mentioned at stage "${f.context.stage}" (${f.context.source || 'source unknown'}) — prep a counter.`,
  },
  procurement_added_late: {
    title: 'Generate deal risk brief',
    category: 'Deal Risk',
    agentId: 'generate_account_brief',
    ctaLabel: 'Draft brief',
    playKey: 'deal_risk_brief',
    rationaleFor: (f) => `Procurement contact "${f.context.contactName}" added at stage ${f.context.addedAtStage} — deal-risk flag.`,
  },
  late_stage_no_security_review: {
    title: 'Generate deal risk brief',
    category: 'Deal Risk',
    agentId: 'generate_account_brief',
    ctaLabel: 'Draft brief',
    playKey: 'deal_risk_brief',
    rationaleFor: () => 'Late stage with no security review logged — get ahead of it before it slips.',
  },

  // ─── Buyer Intent ────────────────────────────────────────────────────
  trustradius_intent: {
    title: 'Draft peer-comparison outreach',
    category: 'Buyer Intent',
    agentId: 'draft_personalized_email',
    ctaLabel: 'Draft email',
    playKey: 'peer_comparison_email',
    rationaleFor: (f) => `Researching ${f.context.productCompared} on TrustRadius — reach out ASAP with peer reviews from their industry + a case study.`,
  },
  topic_intent: {
    title: 'Draft topic-specific outreach',
    category: 'Buyer Intent',
    agentId: 'draft_personalized_email',
    ctaLabel: 'Draft email',
    playKey: 'topic_intent_email',
    rationaleFor: (f) => `Elevated intent on "${f.context.topic}" (score ${f.context.score}) — lead with education, offer a relevant guide.`,
  },

  // ─── Competitive (HG) ────────────────────────────────────────────────
  competitor_install_detected: {
    title: 'Draft displacement email',
    category: 'Competitive',
    agentId: 'competitive_battlecard',
    ctaLabel: 'Draft displacement email',
    playKey: 'displacement_install',
    rationaleFor: (f) => `${f.context.competitor} installed — lead with your key differentiator vs. ${f.context.competitor}. Get in before onboarding completes.`,
  },
  competitor_momentum_increasing: {
    title: 'Draft displacement email',
    category: 'Competitive',
    agentId: 'competitive_battlecard',
    ctaLabel: 'Draft displacement email',
    playKey: 'displacement_momentum_up',
    rationaleFor: (f) => `${f.context.competitor} usage is expanding here (${f.context.delta || 'increasing'}) — displace before they go deeper. If this is an existing customer, flag as churn risk.`,
  },
  competitor_momentum_decreasing: {
    title: 'Draft migration pitch',
    category: 'Competitive',
    agentId: 'competitive_battlecard',
    ctaLabel: 'Draft migration pitch',
    playKey: 'displacement_momentum_down',
    rationaleFor: (f) => `${f.context.competitor} usage is decreasing (${f.context.delta || 'declining'}) — "we've helped others migrate from ${f.context.competitor}" + a case study. Strike before they re-commit.`,
  },
  competitor_renewal_window: {
    title: 'Launch displacement play',
    category: 'Competitive',
    agentId: 'find_competitor_accounts',
    ctaLabel: 'Launch displacement play',
    playKey: 'displacement_renewal',
    rationaleFor: (f) => `${f.context.competitor} renewal window opens in ${f.context.renewalWindowDays}d — intercept before their renewal conversation starts.`,
  },

  // ─── Account Health ──────────────────────────────────────────────────
  renewal_not_started: {
    title: 'Open a renewal opportunity',
    category: 'Account Health',
    agentId: 'create_crm_tasks',
    ctaLabel: 'Create task',
    playKey: 'renewal_task',
    rationaleFor: (f) => `Contract ends in ${f.context.contractEndDays}d — renewal opp not open yet.`,
  },
  expansion_untapped: {
    title: 'Draft expansion pitch',
    category: 'Account Health',
    agentId: 'draft_personalized_email',
    ctaLabel: 'Draft expansion pitch',
    playKey: 'expansion_pitch',
    rationaleFor: (f) => `Growth signal: ${f.context.growthSignal}. Expansion opp not open — propose an upgrade or add-on.`,
  },
  multi_opp_conflict: {
    title: 'Coordinate multi-owner opps',
    category: 'Account Health',
    agentId: 'create_crm_tasks',
    ctaLabel: 'Create task',
    playKey: 'coordinate_opps',
    rationaleFor: (f) => `Multiple open opps (${f.context.opps}) owned by ${f.context.owners} — coordinate before conflicts surface.`,
  },

  // ─── Partner (HG) ────────────────────────────────────────────────────
  partner_install_detected: {
    title: 'Draft integration email',
    category: 'Partner',
    agentId: 'draft_personalized_email',
    ctaLabel: 'Draft integration email',
    playKey: 'partner_integration',
    rationaleFor: (f) => `${f.context.partner} just installed — lead with the integration story: "You just added ${f.context.partner} — here's how we integrate natively."`,
  },

  // ─── Momentum (HG) ───────────────────────────────────────────────────
  tenant_product_momentum: {
    title: 'Draft growth pitch',
    category: 'Momentum',
    agentId: 'draft_personalized_email',
    ctaLabel: 'Draft growth pitch',
    playKey: 'growth_pitch',
    rationaleFor: (f) => {
      if (f.context.direction === 'increasing') {
        return `Product usage growing (${f.context.delta || 'increasing'}) — lead with "as you grow, here's how we scale with you." Expansion signal for existing customers.`;
      }
      if (f.context.direction === 'decreasing') {
        return `Product usage declining (${f.context.delta || 'decreasing'}) — flag as retention risk and get in before it accelerates.`;
      }
      return `Momentum shift detected (${f.context.delta || 'trending'}).`;
    },
  },

  // ─── 1P Activity ─────────────────────────────────────────────────────
  sales_activity_7d: {
    title: 'View 1P sales activity',
    category: '1P Activity',
    agentId: null,
    ctaLabel: 'View activity',
    playKey: 'view_sales_activity',
    rationaleFor: (f) => f.context.summary || `Sales activity in the last 7d — review the specific interaction.`,
  },
  web_activity_7d: {
    title: 'Draft interest-based outreach',
    category: '1P Activity',
    agentId: 'draft_personalized_email',
    ctaLabel: 'Draft email',
    playKey: 'web_interest_email',
    rationaleFor: (f) => `${f.context.summary || 'Web activity detected'} — draft outreach referencing this. Pair with HG intent for a stronger opener.`,
  },
  marketing_activity_7d: {
    title: 'Draft personalized outreach',
    category: '1P Activity',
    agentId: 'draft_personalized_email',
    ctaLabel: 'Draft email',
    playKey: 'marketing_personalized_email',
    rationaleFor: (f) => `${f.context.summary || 'Marketing activity detected'} — personalize outreach referencing this specific event.`,
  },
  app_usage_7d: {
    title: 'Propose expansion or reference',
    category: '1P Activity',
    agentId: 'draft_personalized_email',
    ctaLabel: 'Propose expansion',
    playKey: 'app_usage_expansion',
    rationaleFor: (f) => `${f.context.summary || 'App usage detected'} — identify power users. If usage + tenant momentum both up, propose an upgrade.`,
  },
};

// Return recommended plays for a specific account, derived from its firings.
// Signals are looked up per-id, deduped by playKey, ranked by summed weight.
export function recommendedPlaysForAccount(accountId, { limit = 3 } = {}) {
  const firings = listFiringsForAccount(accountId);
  if (!firings.length) return [];

  // Group firings by the play they map to (playKey).
  const byPlay = new Map();
  for (const f of firings) {
    const template = PLAY_BY_SIGNAL[f.signalId];
    if (!template) continue;
    const key = template.playKey;
    const bucket = byPlay.get(key) || {
      template,
      firings: [],
      weightSum: 0,
    };
    bucket.firings.push(f);
    bucket.weightSum += f.weight || 0;
    byPlay.set(key, bucket);
  }

  // Build one play card per unique playKey. Rationale uses the
  // highest-weight firing in the bucket for its context.
  const plays = [];
  for (const [key, bucket] of byPlay.entries()) {
    const { template, firings: bucketFirings, weightSum } = bucket;
    const primary = [...bucketFirings].sort((a, b) => (b.weight || 0) - (a.weight || 0))[0];
    plays.push({
      id: `play-${accountId}-${key}`,
      title: template.title,
      category: template.category,
      agentId: template.agentId,
      ctaLabel: template.ctaLabel,
      rationale: template.rationaleFor(primary),
      sourceSignalIds: bucketFirings.map((f) => f.signalId),
      weight: weightSum,
    });
  }

  plays.sort((a, b) => b.weight - a.weight);
  return plays.slice(0, limit);
}

// Highest-weight play for the compressed-row CTA.
export function primaryPlayForAccount(accountId) {
  const plays = recommendedPlaysForAccount(accountId, { limit: 1 });
  return plays[0] || null;
}
