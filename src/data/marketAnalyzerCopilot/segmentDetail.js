// JTBD 7 — Segment Detail View fixtures (one per saved segment).
//
// Per MACLAUDE.md v0.2 §5: "Clicking a segment opens the Segment Detail
// View which is itself a full JTBD 7 Insight Card showing composition
// shifts, intent activity, score distribution."
//
// Indexed by segment id — looked up when the user clicks a card in the
// right panel or a save-segment toast. New segments saved via the
// save-segment follow-up land here with a default detail shape.

export const SEGMENT_DETAILS = {
  s1: {
    segmentId: 's1',
    name: 'Mid-market SaaS NA — new logo',
    motion: 'new_logo',
    motionColor: 'emerald',
    headlineMetrics: [
      { label: 'Accounts',         value: '4,200', subtitle: '+126 net since last refresh' },
      { label: 'MoM delta',         value: '+3%',   subtitle: 'rising — fastest of your segments', highlight: true },
      { label: 'Intent activity',  value: 'Rising', subtitle: '12 new high-intent accounts this week' },
    ],
    compositionShifts: {
      title: 'Composition shifts (last 30 days)',
      entrants: 168,
      dropouts: 42,
      reasons: [
        { label: 'New entrants — crossed employee threshold', count: 102, color: 'emerald' },
        { label: 'New entrants — Salesforce install verified', count: 66,  color: 'sky' },
        { label: 'Dropouts — exited geo (acquired / moved)',   count: 28,  color: 'amber' },
        { label: 'Dropouts — competitor installed',             count: 14,  color: 'rose' },
      ],
    },
    scoreDistribution: {
      title: 'ICP fit score distribution',
      bands: [
        { label: 'P1 (90–100)', count: 480,  color: 'emerald' },
        { label: 'P2 (70–89)',  count: 1640, color: 'sky' },
        { label: 'P3 (50–69)',  count: 1480, color: 'amber' },
        { label: 'P4 (<50)',    count: 600,  color: 'gray' },
      ],
    },
    spendTrend: {
      title: 'Aggregate category spend (7-week trend, indexed)',
      period: '7w',
      dataPoints: [142, 148, 151, 156, 159, 163, 168],
      deltaYoY: '+18%',
    },
    soWhat: {
      opportunity: {
        headline: 'P1 + P2 = 2,120 accounts worth working this quarter.',
        detail: '480 P1 accounts plus 1,640 P2 covers 50% of the segment — enough volume for AE-led outreach without slipping into low-fit territory.',
      },
      risk: {
        headline: '14 accounts installed a competitor in the last 30 days.',
        detail: 'Decay rate is modest but not zero — competitor displacement is starting to nibble the new-logo pool. Track monthly.',
      },
      action: {
        headline: 'Run prioritization on the P1 bucket to lock the top 100.',
        detail: 'Use Account Prioritization to rank the 480 P1 accounts by fit + intent + spend, then push the top 100 to AE queues.',
      },
    },
  },
  s2: {
    segmentId: 's2',
    name: 'EMEA enterprise — expansion',
    motion: 'expansion',
    motionColor: 'sky',
    headlineMetrics: [
      { label: 'Accounts',         value: '1,980', subtitle: '–20 net since last refresh' },
      { label: 'MoM delta',         value: '-1%',   subtitle: 'mostly stable, slight contraction' },
      { label: 'Intent activity',  value: 'Stable', subtitle: 'no signal change in last 7 days', highlight: true },
    ],
    compositionShifts: {
      title: 'Composition shifts (last 30 days)',
      entrants: 38,
      dropouts: 58,
      reasons: [
        { label: 'New entrants — annual revenue threshold met', count: 38, color: 'emerald' },
        { label: 'Dropouts — exited employee band',             count: 22, color: 'amber' },
        { label: 'Dropouts — moved to expansion-blocked tier',  count: 36, color: 'rose' },
      ],
    },
    scoreDistribution: {
      title: 'Expansion fit score distribution',
      bands: [
        { label: 'P1 (90–100)', count: 220,  color: 'emerald' },
        { label: 'P2 (70–89)',  count: 880,  color: 'sky' },
        { label: 'P3 (50–69)',  count: 620,  color: 'amber' },
        { label: 'P4 (<50)',    count: 260,  color: 'gray' },
      ],
    },
    spendTrend: {
      title: 'Aggregate category spend (7-week trend, indexed)',
      period: '7w',
      dataPoints: [220, 218, 222, 219, 215, 213, 211],
      deltaYoY: '-4%',
    },
    soWhat: {
      opportunity: {
        headline: 'P1 expansion pool (220 accounts) is your QBR list.',
        detail: 'Tightest cohort — highest expansion-fit and most actionable inside an existing CSM relationship.',
      },
      risk: {
        headline: '36 accounts moved to expansion-blocked tier this month.',
        detail: 'They\'re still in ICP but a procurement / contract trigger reclassified them. Investigate before next QBR cycle.',
      },
      action: {
        headline: 'Re-run with relaxed employee band to capture growing accounts.',
        detail: 'You dropped 22 accounts on employee band alone — likely fast-growing customers worth re-including.',
      },
    },
  },
  s3: {
    segmentId: 's3',
    name: 'FinServ high-spend — displacement',
    motion: 'displacement',
    motionColor: 'rose',
    headlineMetrics: [
      { label: 'Accounts',         value: '680', subtitle: '–42 net since last refresh', highlight: true },
      { label: 'MoM delta',         value: '-6%', subtitle: 'declining — spend tier reclassification' },
      { label: 'Intent activity',  value: 'Declining', subtitle: 'fewer evaluating accounts this month' },
    ],
    compositionShifts: {
      title: 'Composition shifts (last 30 days)',
      entrants: 18,
      dropouts: 60,
      reasons: [
        { label: 'New entrants — net-new spend-tier qualifiers', count: 18, color: 'emerald' },
        { label: 'Dropouts — reclassified to Medium spend tier', count: 42, color: 'amber' },
        { label: 'Dropouts — competitor installed (displaced)',  count: 18, color: 'rose' },
      ],
    },
    scoreDistribution: {
      title: 'Displacement fit score distribution',
      bands: [
        { label: 'P1 (90–100)', count: 80,  color: 'emerald' },
        { label: 'P2 (70–89)',  count: 240, color: 'sky' },
        { label: 'P3 (50–69)',  count: 260, color: 'amber' },
        { label: 'P4 (<50)',    count: 100, color: 'gray' },
      ],
    },
    spendTrend: {
      title: 'Aggregate category spend (7-week trend, indexed)',
      period: '7w',
      dataPoints: [89, 87, 84, 82, 79, 76, 72],
      deltaYoY: '-19%',
    },
    soWhat: {
      opportunity: {
        headline: 'The 80 P1 accounts still represent your highest-value displacement bucket.',
        detail: 'Even with shrinking segment size, top-fit FinServ targets remain — large deal sizes offset volume loss.',
      },
      risk: {
        headline: 'Segment is decaying fast — down 6% MoM, 19% YoY.',
        detail: 'Spend tier reclassification suggests the FinServ buyer base is consolidating IT vendors. Worth questioning whether this motion is still viable at scale.',
      },
      action: {
        headline: 'Either widen the spend tier definition or sunset this segment.',
        detail: 'Rebuild with 80% of current spend threshold to recover volume, OR retire the segment and consolidate into "EMEA enterprise — expansion".',
      },
    },
  },
};

// Default detail shape used for segments saved via the save-segment
// follow-up — gives them a viable detail view immediately, without
// requiring the user to wait for a "refresh" to populate data.
export function defaultSegmentDetail(segment) {
  return {
    segmentId: segment.id,
    name: segment.name,
    motion: segment.motion,
    motionColor: segment.motionColor,
    headlineMetrics: [
      { label: 'Accounts',        value: segment.accountCount?.toLocaleString?.() ?? String(segment.accountCount), subtitle: 'snapshot at save time' },
      { label: 'MoM delta',       value: 'Awaiting refresh', subtitle: 'first refresh in ~24h' },
      { label: 'Intent activity', value: 'Pending',           subtitle: 'first scan queued' },
    ],
    compositionShifts: {
      title: 'Composition shifts',
      entrants: 0,
      dropouts: 0,
      reasons: [
        { label: 'No shifts yet — segment was just saved', count: 0, color: 'gray' },
      ],
    },
    scoreDistribution: null,
    spendTrend: null,
    soWhat: {
      opportunity: {
        headline: 'Segment saved — first refresh queued.',
        detail: 'Composition shifts, score distribution, and spend trend populate after the first MoM refresh (typically within 24h).',
      },
      risk: null,
      action: {
        headline: 'Add a watchlist alert.',
        detail: 'Set an alert for composition shifts ≥5% so you\'re notified the first time this segment moves.',
      },
    },
  };
}
