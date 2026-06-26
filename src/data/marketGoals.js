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

// Goal-aligned tips. A pool per goal so the agent can rotate (and stay
// occasional) rather than repeating one line after every operation.
// When a tip suggests an action, it carries an `action` the agent can run
// directly — `id` resolves to a flow/suggestion, or a named page action
// like 'open-analysis'.
const GOAL_TIPS = {
  'product-market': [
    { text: 'Track product-market fit over time —', action: { label: 'save this as a segment', id: 'save-segment' } },
    { text: 'Size the TAM and see product alignment —', action: { label: 'open the detailed analysis', id: 'open-analysis' } },
    { text: 'Concentrated in one sector?', action: { label: 'Carve it into a focused ICP', id: 'create-icp' } },
  ],
  competitor: [
    { text: 'Lead competitive deals on time-to-value — it funds the rip-and-replace.' },
    { text: 'See displacement targets and win themes by incumbent —', action: { label: 'open the detailed analysis', id: 'open-analysis' } },
    { text: 'Found the entrenched accounts?', action: { label: 'Build a segment to work them', id: 'create-icp' } },
  ],
  partnership: [
    { text: 'Cross-reference these accounts with your partner’s install base to find co-sell overlap.' },
    { text: 'Enterprise accounts make the strongest joint targets —', action: { label: 'filter to enterprise', id: 'enterprise' } },
    { text: 'Explore complementary-fit and co-sell ideas —', action: { label: 'open the detailed analysis', id: 'open-analysis' } },
  ],
  whitespace: [
    { text: 'These are net-new logos —', action: { label: 'save them as a segment', id: 'save-segment' } },
    { text: 'See the net-new breakdown by sector —', action: { label: 'open the detailed analysis', id: 'open-analysis' } },
    { text: 'Narrow to the densest gaps first —', action: { label: 'define an ICP', id: 'create-icp' } },
  ],
  outreach: [
    { text: 'Sequence your outreach by fit —', action: { label: 'set up scoring', id: 'build-scoring' } },
    { text: 'Work the highest-spend accounts first —', action: { label: 'rank by IT spend', id: 'top-it-spend' } },
    { text: 'Ready to hand off?', action: { label: 'Save your shortlist as a segment', id: 'save-segment' } },
  ],
};

export function goalTips(goalId) {
  return GOAL_TIPS[goalId] || GOAL_TIPS['product-market'];
}

// Segments-page tip pool. Action ids map to the Segments agent's own
// flows/suggestions (prioritize-segments, coverage-analysis, etc.).
const SEGMENT_TIPS = {
  'product-market': [
    { text: 'Lead with the largest addressable segment —', action: { label: 'prioritize by goal', id: 'prioritize-segments' } },
    { text: 'Make sure fit-scoring covers them —', action: { label: 'analyze coverage', id: 'coverage-analysis' } },
  ],
  competitor: [
    { text: 'Displacement segments convert fastest —', action: { label: 'prioritize them', id: 'prioritize-segments' } },
    { text: 'See size and scoring coverage across the board —', action: { label: 'analyze coverage', id: 'coverage-analysis' } },
  ],
  partnership: [
    { text: 'The widest-reach segment makes the best co-sell —', action: { label: 'find it', id: 'recommend-push' } },
    { text: 'Rank segments by joint potential —', action: { label: 'prioritize', id: 'prioritize-segments' } },
  ],
  whitespace: [
    { text: 'Whitespace is your net-new engine —', action: { label: 'prioritize segments for it', id: 'prioritize-segments' } },
    { text: 'Check where fit-scoring is missing —', action: { label: 'analyze coverage', id: 'coverage-analysis' } },
  ],
  outreach: [
    { text: 'Ready to hand off to sales?', action: { label: 'pick the best segment to push', id: 'recommend-push' } },
    { text: 'Unscored segments rank blind —', action: { label: 'score them', id: 'score-unscored' } },
  ],
};

export function segmentGoalTips(goalId) {
  return SEGMENT_TIPS[goalId] || SEGMENT_TIPS['product-market'];
}

// Scoring-Profiles-page tip pool. Action ids map to that agent's flows
// (build-profile, recommend-profile, coverage-analysis).
const SCORING_TIPS = {
  'product-market': [
    { text: 'Score TAM by firmographic fit —', action: { label: 'build a profile', id: 'build-profile' } },
    { text: 'Not sure which lens to use?', action: { label: 'get a recommendation', id: 'recommend-profile' } },
  ],
  competitor: [
    { text: 'Displacement scoring drives takeout —', action: { label: 'pick the right profile', id: 'recommend-profile' } },
    { text: 'Tune install-age + renewal weights —', action: { label: 'build a profile', id: 'build-profile' } },
  ],
  partnership: [
    { text: 'Score co-sell overlap —', action: { label: 'build a profile', id: 'build-profile' } },
    { text: 'Find a fitting lens for the motion —', action: { label: 'get a recommendation', id: 'recommend-profile' } },
  ],
  whitespace: [
    { text: 'Whitespace needs a net-new fit lens —', action: { label: 'build a profile', id: 'build-profile' } },
    { text: 'See where profiles aren’t applied —', action: { label: 'analyze coverage', id: 'coverage-analysis' } },
  ],
  outreach: [
    { text: 'Sequence by fit —', action: { label: 'build a scoring profile', id: 'build-profile' } },
    { text: 'Which profile fits outreach?', action: { label: 'get a recommendation', id: 'recommend-profile' } },
  ],
};

export function scoringGoalTips(goalId) {
  return SCORING_TIPS[goalId] || SCORING_TIPS['product-market'];
}
