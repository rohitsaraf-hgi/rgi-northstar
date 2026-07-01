// Market Analyzer Copilot — user context fixture.
//
// Source of truth: MACLAUDE.md v0.2 Appendix C.
//
// Used to:
//   - greet the user in the welcome state
//   - pre-populate extraction prompts (saved ICP, default geo)
//   - power the right panel persistent context (saved segments,
//     tracked competitors, alerts) when the engagement layer ships
//
// Numbers must stay consistent with JTBD fixtures.

export const userContext = {
  user: {
    name: 'Rohit Saraf',
    firstName: 'Rohit',
    role: 'Director of Product Management',
    company: 'HG Insights',
    initials: 'RS',
  },
  defaultIcp: {
    label: 'Revenue Intelligence buyers',
    industries: ['SaaS', 'FinTech', 'MarTech'],
    employeeRange: '200-5000',
    revenueRange: '$50M–$2B',
    geographies: ['United States', 'Canada'],
    prerequisiteTech: ['Salesforce'],
  },
  // JTBD 7 — persistent ICP segment library. Each segment is keyed to
  // a business motion. spendTrend powers a 7-point sparkline in the
  // engagement-layer Saved Segments panel.
  savedSegments: [
    {
      id: 's1',
      name: 'Mid-market SaaS NA — new logo',
      motion: 'new_logo',
      motionColor: 'emerald',
      accountCount: 4200,
      monthOverMonth: '+3%',
      monthOverMonthDirection: 'up',
      spendTrend: [142, 148, 151, 156, 159, 163, 168],
      intentActivity: 'rising',
      lastRefreshed: '2026-06-25',
    },
    {
      id: 's2',
      name: 'EMEA enterprise — expansion',
      motion: 'expansion',
      motionColor: 'sky',
      accountCount: 1980,
      monthOverMonth: '-1%',
      monthOverMonthDirection: 'down',
      spendTrend: [220, 218, 222, 219, 215, 213, 211],
      intentActivity: 'stable',
      lastRefreshed: '2026-06-24',
    },
    {
      id: 's3',
      name: 'FinServ high-spend — displacement',
      motion: 'displacement',
      motionColor: 'rose',
      accountCount: 680,
      monthOverMonth: '-6%',
      monthOverMonthDirection: 'down',
      spendTrend: [89, 87, 84, 82, 79, 76, 72],
      intentActivity: 'declining',
      lastRefreshed: '2026-06-22',
    },
  ],
  trackedCompetitors: [
    { id: 'c1', name: 'Gong',     type: 'competitor', signalDelta30d: '+18%', trend: 'up'   },
    { id: 'c2', name: 'Clari',    type: 'competitor', signalDelta30d: '+7%',  trend: 'up'   },
    { id: 'c3', name: 'Chorus',   type: 'competitor', signalDelta30d: '-2%',  trend: 'down' },
    { id: 'c4', name: 'Outreach', type: 'partner',    signalDelta30d: '+24%', trend: 'up'   },
  ],
  alerts: [
    { id: 'a1', type: 'competitor_momentum',      read: false, daysAgo: 0 },
    { id: 'a2', type: 'whitespace_decay',         read: false, daysAgo: 1 },
    { id: 'a3', type: 'segment_composition_shift', read: false, daysAgo: 2 },
    { id: 'a4', type: 'intent_surge',             read: true,  daysAgo: 3 },
  ],
};
