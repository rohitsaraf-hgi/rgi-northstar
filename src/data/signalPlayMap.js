// Phase 1 Signal → Recommended Play mapper.
//
// Phase 1 scope (Sales Copilot):
//   Competitive Product Install Detected      → Battlecard + Committee + Email
//   Competitive Product Momentum – Increasing → Battlecard + Committee + Email
//   Competitive Product Momentum – Decreasing → Battlecard + Committee + Email
//   Competitor Renewal Window Opens           → Battlecard + Committee + Email
//   Partner Product Install Detected          → Email
//   Tenant Product Momentum                   → Email
//   TrustRadius Intent                        → Committee + Email
//   Topic Intent                              → Brief + Email
//   Web Activity Detected · 7d                → Brief + Email
//   Marketing Activity Detected · 7d          → Email
//   Sales Activity Detected · 7d              → (no play — signal only, view 1P tab)
//
// Structure: one signal can recommend MULTIPLE plays. Multiple firings on
// one account that recommend the same play merge into ONE card, with the
// rationale drawn from the highest-weight firing.

import { listFiringsForAccount } from './signalFirings.js';

// ─── The 4 Phase 1 play templates ────────────────────────────────────
const PLAY_TEMPLATES = {
  competitive_battlecard: {
    title: 'Generate Competitive Battlecard',
    category: 'Competitive',
    agentId: 'competitive_battlecard',
    ctaLabel: 'Generate battlecard',
  },
  find_buying_committee: {
    title: 'Find Buying Committee',
    category: 'Coverage',
    agentId: 'find_buying_personas',
    ctaLabel: 'Find committee',
  },
  draft_email: {
    title: 'Draft Email',
    category: 'Outreach',
    agentId: 'draft_personalized_email',
    ctaLabel: 'Draft email',
  },
  account_brief: {
    title: 'Account Brief',
    category: 'Brief',
    agentId: 'generate_account_brief',
    ctaLabel: 'Generate brief',
  },
};

// ─── Signal → array of play template ids + rationale per (signal, play) ─
const SIGNAL_PLAY_MAP = {
  competitor_install_detected: {
    plays: ['competitive_battlecard', 'find_buying_committee', 'draft_email'],
    rationales: {
      competitive_battlecard: (f) => `${f.context.competitor} installed — build a differentiator battlecard vs. ${f.context.competitor} before onboarding completes.`,
      find_buying_committee:  (f) => `${f.context.competitor} just landed — identify the security decision-makers to intercept.`,
      draft_email:            (f) => `Draft displacement email leading with your key differentiator vs. ${f.context.competitor}.`,
    },
  },
  competitor_momentum_increasing: {
    plays: ['competitive_battlecard', 'find_buying_committee', 'draft_email'],
    rationales: {
      competitive_battlecard: (f) => `${f.context.competitor} expanding here (${f.context.delta || 'increasing'}) — refresh the battlecard before they go deeper.`,
      find_buying_committee:  (f) => `${f.context.competitor} growing at this account — surface displacement-friendly stakeholders (security, platform, procurement).`,
      draft_email:            (f) => `Run displacement play now — ${f.context.competitor} is expanding (${f.context.delta || 'increasing'}). For existing customers this is a churn-risk signal.`,
    },
  },
  competitor_momentum_decreasing: {
    plays: ['competitive_battlecard', 'find_buying_committee', 'draft_email'],
    rationales: {
      competitive_battlecard: (f) => `${f.context.competitor} usage declining (${f.context.delta || 'decreasing'}) — high-value displacement window. Prep a migration battlecard.`,
      find_buying_committee:  (f) => `${f.context.competitor} declining — find the internal advocate championing a switch.`,
      draft_email:            (f) => `"We've helped others migrate from ${f.context.competitor}" — pair with a case study. Strike before they re-commit.`,
    },
  },
  competitor_renewal_window: {
    plays: ['competitive_battlecard', 'find_buying_committee', 'draft_email'],
    rationales: {
      competitive_battlecard: (f) => `${f.context.competitor} renewal window opens in ${f.context.renewalWindowDays}d — full displacement battlecard needed.`,
      find_buying_committee:  (f) => `${f.context.competitor} renewal in ${f.context.renewalWindowDays}d — map the renewal decision-makers before their internal review starts.`,
      draft_email:            (f) => `Launch displacement play now — ${f.context.competitor} renewal is ${f.context.renewalWindowDays}d out. Get in before their renewal conversation starts.`,
    },
  },
  partner_install_detected: {
    plays: ['draft_email'],
    rationales: {
      draft_email: (f) => `${f.context.partner} just installed — draft an integration email: "You just added ${f.context.partner} — here's how we integrate natively."`,
    },
  },
  tenant_product_momentum: {
    plays: ['draft_email'],
    rationales: {
      draft_email: (f) => {
        if (f.context.direction === 'decreasing') {
          return `Product usage declining (${f.context.delta || 'decreasing'}) — reach out before it accelerates. Retention-risk signal.`;
        }
        return `Product usage growing (${f.context.delta || 'increasing'}) — lead with "as you grow, here's how we scale with you." For existing customers, this is an expansion signal.`;
      },
    },
  },
  trustradius_intent: {
    plays: ['find_buying_committee', 'draft_email'],
    rationales: {
      find_buying_committee: (f) => `Actively comparing ${f.context.productCompared} on TrustRadius — surface the evaluation committee.`,
      draft_email:           (f) => `Draft outreach referencing peer reviews from their industry. Pair with a case study or reference call — they're in an active buying cycle.`,
    },
  },
  topic_intent: {
    plays: ['account_brief', 'draft_email'],
    rationales: {
      account_brief: (f) => `Elevated intent on "${f.context.topic}" (score ${f.context.score}) — generate an intent-anchored brief for the account team.`,
      draft_email:   (f) => `Draft outreach tailored to "${f.context.topic}" — lead with education, offer a relevant guide or "we specialize in this" call.`,
    },
  },
  web_activity_7d: {
    plays: ['account_brief', 'draft_email'],
    rationales: {
      account_brief: (f) => `${f.context.summary || 'Web activity detected'} — generate a brief anchored on this browsing behavior.`,
      draft_email:   (f) => `${f.context.summary || 'Web activity detected'} — draft outreach referencing this. Combine with HG intent signals for a stronger opener.`,
    },
  },
  marketing_activity_7d: {
    plays: ['draft_email'],
    rationales: {
      draft_email: (f) => `${f.context.summary || 'Marketing activity detected'} — personalize outreach referencing this specific event (webinar, form, download).`,
    },
  },
  // Sales Activity — no play, just signal display + navigation cue.
  sales_activity_7d: {
    plays: [],
    rationales: {},
  },
};

// ─── Resolver ────────────────────────────────────────────────────────
export function recommendedPlaysForAccount(accountId, { limit = 6 } = {}) {
  const firings = listFiringsForAccount(accountId);
  if (!firings.length) return [];

  const byPlay = new Map();
  for (const f of firings) {
    const map = SIGNAL_PLAY_MAP[f.signalId];
    if (!map) continue;
    for (const playId of map.plays) {
      const template = PLAY_TEMPLATES[playId];
      if (!template) continue;
      const rationaleFn = map.rationales[playId];
      if (!rationaleFn) continue;
      const bucket = byPlay.get(playId) || {
        playId,
        template,
        candidates: [],
        sourceSignalIds: new Set(),
        weightSum: 0,
      };
      bucket.candidates.push({
        rationale: rationaleFn(f),
        weight: f.weight || 0,
        signalId: f.signalId,
        firing: f,
      });
      bucket.sourceSignalIds.add(f.signalId);
      bucket.weightSum += f.weight || 0;
      byPlay.set(playId, bucket);
    }
  }

  const plays = [];
  for (const [playId, bucket] of byPlay.entries()) {
    const top = [...bucket.candidates].sort((a, b) => b.weight - a.weight)[0];
    plays.push({
      id: `play-${accountId}-${playId}`,
      title: bucket.template.title,
      category: bucket.template.category,
      agentId: bucket.template.agentId,
      ctaLabel: bucket.template.ctaLabel,
      rationale: top.rationale,
      sourceSignalIds: [...bucket.sourceSignalIds],
      weight: bucket.weightSum,
    });
  }

  plays.sort((a, b) => b.weight - a.weight);
  return plays.slice(0, limit);
}

// Highest-weight play for the compressed-row CTA.
// Falls back to null if the account has firings but no Phase 1 plays
// (e.g. sales_activity_7d only) — caller should render a plain "Open account" link.
export function primaryPlayForAccount(accountId) {
  const plays = recommendedPlaysForAccount(accountId, { limit: 1 });
  return plays[0] || null;
}
