// Monday Monitor — weekly proactive digest shown in the welcome state.
//
// Source: MACLAUDE.md v0.2 §7. Four signal types — each card has an
// action that bridges to a JTBD with pre-populated context, completing
// Scenario C (Monday Monitor → proactive flow).
//
// jtbdBridge wiring:
//   competitor_momentum → JTBD 6 (Displacement) with competitor prefilled
//   intent_surge        → JTBD 5 (Account Prioritization, P1 — toast for now)
//   whitespace_decay    → JTBD 4 (Whitespace) with excluded competitor prefilled
//   segment_composition_shift → JTBD 7 (Segment Detail, opens the segment)

export const mondayMonitor = {
  weekOf: '2026-06-22',
  signalChanges: [
    {
      id: 'mm1',
      type: 'competitor_momentum',
      icon: 'trending-up',
      accent: 'rose',
      headline: 'Gong added 47 new installs in your ICP this week (+3% MoM)',
      detail: 'Concentrated in mid-market SaaS (200–500 employees) — the same pocket as your "Mid-market SaaS NA — new logo" segment.',
      action: {
        label: 'Build displacement list',
        jtbdBridge: 6,
        prefilledParams: { competitor: 'Gong', icpScope: 'Mid-market SaaS NA — new logo' },
        intro:
          'Monday Monitor flagged Gong momentum. Starting a displacement analysis with Gong + your Mid-market SaaS NA segment pre-loaded — confirm the install age and we\'ll go.',
      },
    },
    {
      id: 'mm2',
      type: 'intent_surge',
      icon: 'flame',
      accent: 'amber',
      headline: '12 accounts in "Mid-market SaaS NA" show new high-intent signals',
      detail: 'Topic: "Revenue Intelligence" · Evaluating stage · all 12 surfaced in the last 7 days.',
      action: {
        label: 'See hot accounts',
        jtbdBridge: 5,
        intro: 'Bridging to Account Prioritization for the 12 hot accounts.',
        // JTBD 5 is P1 — falls through to a toast in handleFollowUpAction
      },
    },
    {
      id: 'mm3',
      type: 'whitespace_decay',
      icon: 'alert-circle',
      accent: 'sky',
      headline: '3 Tier 1 whitespace accounts installed Gong last week',
      detail: 'Acme Corp · BetaCo · GammaInc — they\'ve aged out of whitespace and moved into displacement candidates.',
      action: {
        label: 'Find replacements',
        jtbdBridge: 4,
        prefilledParams: { excludedCompetitors: ['Gong', 'Clari', 'Chorus'] },
        intro:
          'Refreshing your whitespace with Gong/Clari/Chorus excluded so we surface 3 fresh Tier 1 candidates to replace the lost accounts.',
      },
    },
    {
      id: 'mm4',
      type: 'segment_composition_shift',
      icon: 'activity',
      accent: 'violet',
      headline: '"FinServ high-spend" shrank 6% MoM (–42 accounts)',
      detail: '42 accounts dropped out as their spend tier reclassified into Medium. Composition shift worth investigating.',
      action: {
        label: 'Investigate segment',
        segmentId: 's3',
        // No jtbdBridge — opens the JTBD 7 Segment Detail View directly
        intro: 'Opening the segment detail for FinServ high-spend.',
      },
    },
  ],
};
