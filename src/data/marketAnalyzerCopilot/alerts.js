// Notification center alert templates.
//
// Source: MACLAUDE.md v0.2 §7. The bell icon dropdown surfaces these.
// "Guardrail visible in UI" — we render '1 of 1 daily alert delivered
// today' as a footer so the restraint policy is visible to the user.
//
// Each alert has a render shape (type → icon/accent/copy) and an action
// payload that bridges into the existing handleFollowUpAction flow.

export const ALERT_TEMPLATES = {
  competitor_momentum: {
    icon: 'trending-up',
    accent: 'rose',
    headline: 'Gong added 47 new installs in your ICP this week',
    detail: 'Mid-market SaaS — same pocket as your "Mid-market SaaS NA" segment',
    action: { label: 'Build displacement', jtbdBridge: 6, prefilledParams: { competitor: 'Gong' } },
  },
  whitespace_decay: {
    icon: 'alert-circle',
    accent: 'amber',
    headline: '3 Tier 1 whitespace accounts installed a competitor',
    detail: 'Acme · BetaCo · GammaInc — refresh whitespace to surface replacements',
    action: { label: 'Refresh whitespace', jtbdBridge: 4 },
  },
  segment_composition_shift: {
    icon: 'activity',
    accent: 'violet',
    headline: '"FinServ high-spend" segment shrank 6% MoM',
    detail: '42 accounts dropped out — open the segment to investigate',
    action: { label: 'Open segment', segmentId: 's3' },
  },
  intent_surge: {
    icon: 'flame',
    accent: 'sky',
    headline: '12 accounts in "Mid-market SaaS NA" showed new intent',
    detail: 'Topic: Revenue Intelligence · Evaluating',
    action: { label: 'Prioritize', jtbdBridge: 5 },
  },
};

// Daily guardrail: we cap delivered notifications at 1/day. The
// notification center exposes this state so the user trusts the system
// won't spam them. For the prototype we report a static "1 of 1
// delivered today" — production would compute from a real counter.
export const NOTIFICATION_GUARDRAIL = {
  dailyCap: 1,
  deliveredToday: 1,
  helpText: 'I deliver at most 1 proactive alert per day so this doesn\'t become noise.',
};
