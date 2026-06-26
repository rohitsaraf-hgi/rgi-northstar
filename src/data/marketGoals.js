// Market-analysis goals.
//
// "Analyze my market" starts by asking what the user is trying to achieve,
// then tailors both the chat read-out and the detailed-analysis dashboard
// to that goal. Goals are persona-scoped — Strategist / C-Suite users
// think in market / competitor / partnership terms, while RevOps users
// think in whitespace / outreach terms — but every goal stays reachable.

export const MARKET_GOALS = [
  {
    id: 'product-market',
    label: 'Analyze market for my product',
    persona: 'strategist',
    short: 'Product market',
  },
  {
    id: 'competitor',
    label: 'Competitor market analysis',
    persona: 'strategist',
    short: 'Competitive',
  },
  {
    id: 'partnership',
    label: 'Explore a partnership',
    persona: 'strategist',
    short: 'Partnership',
    requiresDetail: true,
    detailLabel: 'Which company or product?',
    detailPlaceholder: 'e.g. Snowflake · CrowdStrike Falcon',
  },
  {
    id: 'whitespace',
    label: 'Whitespace analysis',
    persona: 'revops',
    short: 'Whitespace',
  },
  {
    id: 'outreach',
    label: 'Prioritize companies for outreach',
    persona: 'revops',
    short: 'Outreach',
  },
];

export const MARKET_GOALS_BY_ID = Object.fromEntries(MARKET_GOALS.map((g) => [g.id, g]));

// RevOps (admin) leads with whitespace/outreach; everyone else leads with
// the strategist set. The other group's goals follow so nothing is hidden.
export function goalsForPersona(persona) {
  const group = persona?.roleType === 'admin' ? 'revops' : 'strategist';
  const mine = MARKET_GOALS.filter((g) => g.persona === group);
  const others = MARKET_GOALS.filter((g) => g.persona !== group);
  return [...mine, ...others];
}

export function defaultGoalForPersona(persona) {
  return goalsForPersona(persona)[0]?.id;
}

// One-line read-out used in the chat chart, framed by the chosen goal.
export function goalChartBlurb(goalId, { topLabel, topVal, total, detail }) {
  const where = topLabel || 'your top sector';
  switch (goalId) {
    case 'competitor':
      return `Incumbents are most entrenched in ${where} (${topVal} of ${total}). Open the detailed analysis for displacement targets and win themes by competitor.`;
    case 'partnership':
      return `${detail ? `A ${detail} partnership` : 'A partnership'} would extend reach into ${where}, your densest sector. Open the detailed analysis for complementary fit and co-sell targets.`;
    case 'whitespace':
      return `${where} holds the most uncovered, net-new accounts. Open the detailed analysis for the whitespace breakdown and coverage gaps.`;
    case 'outreach':
      return `${where} is the richest vein for outreach (${topVal} accounts). Open the detailed analysis for a prioritized, scored target list.`;
    case 'product-market':
    default:
      return `${where} is your biggest pocket (${topVal} of ${total}) — strongest product-market fit. Open the detailed analysis for TAM concentration, product alignment, and where to play.`;
  }
}

// A short, goal-aligned tip surfaced after an operation (filter, score,
// save, …) so every action nudges the user toward their objective.
export function goalTip(goalId) {
  switch (goalId) {
    case 'competitor':
      return 'Tip: add a competitor (technographic) filter, then queue a displacement play for the matches.';
    case 'partnership':
      return 'Tip: cross-reference these accounts with your partner’s install base to find co-sell overlap.';
    case 'whitespace':
      return 'Tip: these are net-new logos — save them as a segment and route owners before your next cycle.';
    case 'outreach':
      return 'Tip: apply a scoring profile and sort by Fit Score to sequence outreach to the hottest accounts first.';
    case 'product-market':
    default:
      return 'Tip: save this as a segment to track product-market fit, then size the TAM in the detailed analysis.';
  }
}
