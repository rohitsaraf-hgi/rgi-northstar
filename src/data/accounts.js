// Account model — first-class entity that lives across the seller's full
// lifecycle of work on it. Each account has signals (what's happening),
// stage (where it sits in the pipeline), MEDDIC state, stakeholders, and
// a stream of activity + artifacts.
//
// Signals are ranked by recency × strength × stage to drive the /home
// signal-driven inbox.

export const ACCOUNT_STAGES = {
  pipeline: {
    id: 'pipeline',
    label: 'Pipeline',
    short: 'Pipeline',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500',
    description: 'Identified prospect, not yet engaged',
  },
  active: {
    id: 'active',
    label: 'Active Deal',
    short: 'Active',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
    description: 'In discovery, demo, or negotiation',
  },
  customer: {
    id: 'customer',
    label: 'Customer',
    short: 'Customer',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
    description: 'Closed-won, active customer',
  },
  renewal: {
    id: 'renewal',
    label: 'Renewal',
    short: 'Renewal',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    dot: 'bg-rose-500',
    description: 'Within 90 days of renewal',
  },
};

export const SIGNAL_TYPES = {
  intent_surge: {
    id: 'intent_surge',
    label: 'Intent surge',
    icon: 'TrendingUp',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  web_event: {
    id: 'web_event',
    label: 'Web signal',
    icon: 'Globe',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  crm_activity: {
    id: 'crm_activity',
    label: 'CRM activity',
    icon: 'Activity',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  no_touch: {
    id: 'no_touch',
    label: 'No touch',
    icon: 'Clock',
    color: 'text-text-muted',
    bg: 'bg-text-muted/15',
    border: 'border-border',
  },
};

const SIGNAL_STRENGTH = { high: 3, medium: 2, low: 1 };

// Seeded accounts for Alex @ Wiz — 5 accounts at different stages with
// realistic signal mixes. Drives the demo path.
export const ACCOUNTS_BY_OWNER = {
  alex: [
    {
      id: 'acct-jpmc',
      name: 'JPMorgan Chase',
      url: 'jpmorganchase.com',
      logoColor: '#0F4D9F',
      industry: 'Banking and Financial Services',
      fai: { revenue: '$162.4B', employees: '309K', hq: 'New York, NY', stage: 'Public (NYSE)' },
      stage: 'active',
      addedAt: 'Apr 22',
      ownerIds: ['alex'],
      icpFit: 96,
      intentScore: 87,
      combinedScore: 92,
      lastTouch: 'May 9 · demo call (35 min) with Sarah + Priya',
      lastTouchDaysAgo: 4,
      cloud: 'Multi-cloud (AWS + Azure)',
      competitor: 'Palo Alto Prisma Cloud',
      meddic: { confirmed: 4, partial: 1, inferred: 0, unknown: 1, total: 6 },
      stakeholdersCount: 4,
      artifactsCount: 3,
      threadStarter: "Active deal — discovery complete, technical evaluation in progress. New CISO change is a wrinkle we need to navigate.",
      signals: [
        { id: 'sig-jpmc-1', type: 'web_event', strength: 'high', daysAgo: 7, headline: 'New CISO joined Apr 14', detail: 'Sarah Chen posted on LinkedIn: "First priority is unifying our cloud security posture across AWS and Azure."', actionable: true, suggestedPlay: 'account_brief', suggestedPlayLabel: 'Refresh brief — new champion signal' },
        { id: 'sig-jpmc-2', type: 'intent_surge', strength: 'high', daysAgo: 3, headline: 'Active CNAPP RFP signal', detail: '+87pts in 14 days on Zero Trust + CNAPP topics. Highest surge in their book.', actionable: true, suggestedPlay: 'meeting_prep' },
        { id: 'sig-jpmc-3', type: 'crm_activity', strength: 'medium', daysAgo: 4, headline: 'Sarah replied to outbound', detail: 'Replied to your May 5 follow-up. Asked for next demo to include CFO Diana Park.', actionable: true, suggestedPlay: null },
      ],
    },
    {
      id: 'acct-snowflake',
      name: 'Snowflake',
      url: 'snowflake.com',
      logoColor: '#29B5E8',
      industry: 'Computer and Electronic Product Manufacturing',
      fai: { revenue: '$3.4B', employees: '7.6K', hq: 'Bozeman, MT', stage: 'Public (NYSE)' },
      stage: 'pipeline',
      addedAt: 'May 5',
      ownerIds: ['alex'],
      icpFit: 95,
      intentScore: 89,
      combinedScore: 92,
      lastTouch: 'No outbound yet',
      lastTouchDaysAgo: null,
      cloud: 'AWS + Azure + GCP',
      competitor: 'None detected',
      meddic: { confirmed: 0, partial: 0, inferred: 2, unknown: 4, total: 6 },
      stakeholdersCount: 0,
      artifactsCount: 1,
      threadStarter: "Top of pipeline. No CNAPP incumbent + huge multi-cloud footprint + new CISO from Datadog = textbook ICP. Worth a heavy first-touch.",
      signals: [
        { id: 'sig-snow-1', type: 'web_event', strength: 'high', daysAgo: 12, headline: 'CISO hire from Datadog', detail: 'Mike Goldman (ex-Datadog VP Security) joined as CISO Mar 28. Public LinkedIn announcement.', actionable: true, suggestedPlay: 'account_brief' },
        { id: 'sig-snow-2', type: 'intent_surge', strength: 'high', daysAgo: 5, headline: '38 surge topics in 14 days', detail: 'CNAPP, DSPM, cloud cybersecurity, kubernetes security all surging. Pre-IPO security posture push detected.', actionable: true, suggestedPlay: 'account_brief' },
      ],
    },
    {
      id: 'acct-acme',
      name: 'Acme Corp',
      url: 'acme.com',
      logoColor: '#10B981',
      industry: 'Computer and Electronic Product Manufacturing',
      fai: { revenue: '$4.2B', employees: '14.1K', hq: 'Boston, MA', stage: 'Public (NYSE)' },
      stage: 'active',
      addedAt: 'Apr 8',
      ownerIds: ['alex'],
      icpFit: 92,
      intentScore: 78,
      combinedScore: 88,
      lastTouch: 'May 4 · demo call with Sarah Chen + Priya Nair',
      lastTouchDaysAgo: 9,
      cloud: 'Multi-cloud',
      competitor: 'None detected',
      meddic: { confirmed: 4, partial: 1, inferred: 0, unknown: 1, total: 6 },
      stakeholdersCount: 4,
      artifactsCount: 5,
      threadStarter: "Strongest pipeline deal. CFO engaged, multi-threaded across 4 stakeholders. Target close end of August.",
      signals: [
        { id: 'sig-acme-1', type: 'crm_activity', strength: 'high', daysAgo: 1, headline: 'Sarah replied to your email', detail: 'Confirmed enterprise pricing tier discussion next week. Asked for Diana to be on the call.', actionable: true, suggestedPlay: 'email_draft' },
        { id: 'sig-acme-2', type: 'intent_surge', strength: 'medium', daysAgo: 6, headline: 'ICP Drift white paper download', detail: 'Sarah Chen downloaded "ICP Drift: 2026 Benchmarks" on Apr 22.', actionable: false, suggestedPlay: null },
      ],
    },
    {
      id: 'acct-databricks',
      name: 'Databricks',
      url: 'databricks.com',
      logoColor: '#FF3621',
      industry: 'Computer and Electronic Product Manufacturing',
      fai: { revenue: '$2.4B', employees: '7K', hq: 'San Francisco, CA', stage: 'Late-stage Private' },
      stage: 'pipeline',
      addedAt: 'May 2',
      ownerIds: ['alex'],
      icpFit: 95,
      intentScore: 92,
      combinedScore: 94,
      lastTouch: 'No outbound yet',
      lastTouchDaysAgo: null,
      cloud: 'AWS + Azure + GCP',
      competitor: 'Orca Security',
      meddic: { confirmed: 0, partial: 0, inferred: 2, unknown: 4, total: 6 },
      stakeholdersCount: 0,
      artifactsCount: 0,
      threadStarter: 'Pre-IPO security posture push. Orca contract expiring Sept 2026 — displacement window opens in ~3 months.',
      signals: [
        { id: 'sig-dbx-1', type: 'web_event', strength: 'high', daysAgo: 2, headline: '14 product page visits this week', detail: 'Heavy engagement from databricks.com IP range on Wiz product pages. Pre-IPO posture push signal.', actionable: true, suggestedPlay: 'account_brief' },
        { id: 'sig-dbx-2', type: 'intent_surge', strength: 'high', daysAgo: 5, headline: 'Orca contract expiring Sept', detail: 'HG renewal-window signal: Orca install >24 months old, typical renewal cycle ending. Displacement window.', actionable: true, suggestedPlay: 'competitive_battlecard' },
      ],
    },
    {
      id: 'acct-visa',
      name: 'Visa',
      url: 'visa.com',
      logoColor: '#1A1F71',
      industry: 'Banking and Financial Services',
      fai: { revenue: '$36.0B', employees: '28K', hq: 'San Francisco, CA', stage: 'Public (NYSE)' },
      stage: 'customer',
      addedAt: 'Jan 12',
      ownerIds: ['alex'],
      icpFit: 94,
      intentScore: 78,
      combinedScore: 89,
      lastTouch: 'Apr 28 · QBR with Karen Liu (Security Lead)',
      lastTouchDaysAgo: 15,
      cloud: 'AWS-primary',
      competitor: 'Lacework (legacy)',
      meddic: { confirmed: 5, partial: 1, inferred: 0, unknown: 0, total: 6 },
      stakeholdersCount: 6,
      artifactsCount: 8,
      threadStarter: 'Active customer · 14 months in. QBR completed Apr 28, expansion conversation opening on Wiz Defend (CDR).',
      signals: [
        { id: 'sig-visa-1', type: 'intent_surge', strength: 'medium', daysAgo: 4, headline: 'Surge on Wiz Defend topics', detail: 'CDR + runtime security surge detected. Karen Liu mentioned interest at QBR.', actionable: true, suggestedPlay: 'value_hypothesis' },
        { id: 'sig-visa-2', type: 'no_touch', strength: 'low', daysAgo: 15, headline: 'No touch in 15 days', detail: 'Standard cadence is 10–14 day touch. Slightly over threshold — worth a check-in.', actionable: false, suggestedPlay: null },
      ],
    },
    // ===== Additional accounts to demonstrate sidebar cap behavior =====
    {
      id: 'acct-mastercard',
      name: 'Mastercard',
      url: 'mastercard.com',
      logoColor: '#FF5F00',
      industry: 'Banking and Financial Services',
      fai: { revenue: '$25.1B', employees: '32K', hq: 'Purchase, NY', stage: 'Public (NYSE)' },
      stage: 'active',
      addedAt: 'Mar 14',
      ownerIds: ['alex'],
      icpFit: 91,
      intentScore: 81,
      combinedScore: 87,
      lastTouch: 'May 6 · intro call with Anita Reddy (VP Security)',
      lastTouchDaysAgo: 7,
      cloud: 'Multi-cloud',
      competitor: 'None detected',
      meddic: { confirmed: 2, partial: 1, inferred: 1, unknown: 2, total: 6 },
      stakeholdersCount: 2,
      artifactsCount: 1,
      threadStarter: 'Early-stage opportunity. No CNAPP incumbent. Clean entry. Targeting fast technical eval.',
      meeting: { when: 'Wed May 14 · 2:00 PM', label: 'Technical deep dive · 60 min', with: 'Anita Reddy + cloud security team' },
      signals: [
        { id: 'sig-mc-1', type: 'crm_activity', strength: 'medium', daysAgo: 2, headline: 'Meeting confirmed for Wed', detail: 'Anita accepted Wed 2pm technical deep dive. Asked to include their cloud architect.', actionable: false, suggestedPlay: null },
      ],
    },
    {
      id: 'acct-datadog',
      name: 'Datadog',
      url: 'datadoghq.com',
      logoColor: '#632CA6',
      industry: 'Computer and Electronic Product Manufacturing',
      fai: { revenue: '$2.6B', employees: '5K', hq: 'New York, NY', stage: 'Public (NASDAQ)' },
      stage: 'customer',
      addedAt: 'Nov 8 2025',
      ownerIds: ['alex'],
      icpFit: 81,
      intentScore: 58,
      combinedScore: 76,
      lastTouch: 'Apr 30 · QBR + Wiz Defend pricing review',
      lastTouchDaysAgo: 13,
      cloud: 'AWS + GCP',
      competitor: 'Wiz (potential coopetition)',
      meddic: { confirmed: 4, partial: 1, inferred: 1, unknown: 0, total: 6 },
      stakeholdersCount: 5,
      artifactsCount: 6,
      threadStarter: 'Active customer · 6 months. Cloud Security carve-out coexists with their observability stack. Expansion in discussion.',
      meeting: { when: 'Thu May 15 · 10:00 AM', label: 'Defend (CDR) demo · 45 min', with: 'Engineering + SOC leads' },
      signals: [
        { id: 'sig-dd-1', type: 'crm_activity', strength: 'low', daysAgo: 1, headline: 'Calendar accepted', detail: 'Calendar confirmed for Thu Defend demo. Pre-call brief recommended.', actionable: false, suggestedPlay: null },
      ],
    },
    {
      id: 'acct-spotify',
      name: 'Spotify',
      url: 'spotify.com',
      logoColor: '#1DB954',
      industry: 'Media and Entertainment',
      fai: { revenue: '$13.2B', employees: '7.2K', hq: 'Stockholm, Sweden', stage: 'Public (NYSE)' },
      stage: 'renewal',
      addedAt: 'Jun 4 2025',
      ownerIds: ['alex'],
      icpFit: 85,
      intentScore: 64,
      combinedScore: 79,
      lastTouch: 'Apr 18 · renewal kickoff call',
      lastTouchDaysAgo: 25,
      cloud: 'GCP-primary',
      competitor: 'Sysdig Secure',
      meddic: { confirmed: 4, partial: 2, inferred: 0, unknown: 0, total: 6 },
      stakeholdersCount: 4,
      artifactsCount: 9,
      threadStarter: 'Renewal in 47 days. Generally healthy, but procurement asked for a 30-day extension on pricing discussions. Watch closely.',
      signals: [
        { id: 'sig-sp-1', type: 'no_touch', strength: 'medium', daysAgo: 25, headline: 'No touch in 25 days', detail: 'Past 14-day cadence threshold during a renewal cycle. Risk indicator.', actionable: true, suggestedPlay: 'renewal_readiness' },
      ],
    },
    // Pipeline accounts — quiet, no signals (demonstrate "view all" overflow)
    {
      id: 'acct-block',
      name: 'Block',
      url: 'block.xyz',
      logoColor: '#000000',
      industry: 'Banking and Financial Services',
      fai: { revenue: '$21.9B', employees: '12K', hq: 'Oakland, CA', stage: 'Public (NYSE)' },
      stage: 'pipeline',
      addedAt: 'May 10',
      ownerIds: ['alex'],
      icpFit: 90,
      intentScore: 35,
      combinedScore: 72,
      lastTouch: null,
      lastTouchDaysAgo: null,
      cloud: 'AWS',
      competitor: 'None detected',
      meddic: { confirmed: 0, partial: 0, inferred: 1, unknown: 5, total: 6 },
      stakeholdersCount: 0,
      artifactsCount: 0,
      threadStarter: 'Recently added from Opportunity Finder. No signals yet — needs warm-up.',
      signals: [],
    },
    {
      id: 'acct-stripe',
      name: 'Stripe',
      url: 'stripe.com',
      logoColor: '#635BFF',
      industry: 'Banking and Financial Services',
      fai: { revenue: '$1.6B', employees: '7K', hq: 'San Francisco, CA', stage: 'Late-stage Private' },
      stage: 'pipeline',
      addedAt: 'May 11',
      ownerIds: ['alex'],
      icpFit: 88,
      intentScore: 42,
      combinedScore: 73,
      lastTouch: null,
      lastTouchDaysAgo: null,
      cloud: 'AWS-primary',
      competitor: 'None detected',
      meddic: { confirmed: 0, partial: 0, inferred: 1, unknown: 5, total: 6 },
      stakeholdersCount: 0,
      artifactsCount: 0,
      threadStarter: 'Top of pipeline — no CNAPP detected. Awaiting first-touch sequence.',
      signals: [],
    },
    {
      id: 'acct-pinterest',
      name: 'Pinterest',
      url: 'pinterest.com',
      logoColor: '#E60023',
      industry: 'Media and Entertainment',
      fai: { revenue: '$3.1B', employees: '4.4K', hq: 'San Francisco, CA', stage: 'Public (NYSE)' },
      stage: 'pipeline',
      addedAt: 'May 9',
      ownerIds: ['alex'],
      icpFit: 82,
      intentScore: 52,
      combinedScore: 70,
      lastTouch: null,
      lastTouchDaysAgo: null,
      cloud: 'AWS-primary',
      competitor: 'None detected',
      meddic: { confirmed: 0, partial: 0, inferred: 1, unknown: 5, total: 6 },
      stakeholdersCount: 0,
      artifactsCount: 0,
      threadStarter: 'Mid-tier ICP — AWS-only simplifies pitch. Quiet so far.',
      signals: [],
    },
    {
      id: 'acct-cloudflare',
      name: 'Cloudflare',
      url: 'cloudflare.com',
      logoColor: '#F38020',
      industry: 'Computer and Electronic Product Manufacturing',
      fai: { revenue: '$1.4B', employees: '3.8K', hq: 'San Francisco, CA', stage: 'Public (NYSE)' },
      stage: 'customer',
      addedAt: 'Oct 2 2025',
      ownerIds: ['alex'],
      icpFit: 88,
      intentScore: 38,
      combinedScore: 75,
      lastTouch: 'May 1 · standard biweekly check-in',
      lastTouchDaysAgo: 12,
      cloud: 'AWS-primary',
      competitor: 'None detected',
      meddic: { confirmed: 5, partial: 0, inferred: 0, unknown: 1, total: 6 },
      stakeholdersCount: 3,
      artifactsCount: 4,
      threadStarter: 'Healthy customer · 7 months in. Steady usage, no expansion signal yet.',
      signals: [],
    },
  ],
};

export function getAccountsForOwner(ownerId) {
  return ACCOUNTS_BY_OWNER[ownerId] || [];
}

export function getAccountById(id) {
  for (const owner of Object.keys(ACCOUNTS_BY_OWNER)) {
    const a = ACCOUNTS_BY_OWNER[owner].find((x) => x.id === id);
    if (a) return a;
  }
  return null;
}

// Rank accounts by aggregate signal strength (recency × strength × actionable bias)
export function rankBySignal(accounts) {
  const scored = accounts.map((a) => {
    const score = (a.signals || []).reduce((s, sig) => {
      const recencyBoost = sig.daysAgo == null ? 1 : Math.max(0.3, 1 - sig.daysAgo / 14);
      const strengthMult = SIGNAL_STRENGTH[sig.strength] || 1;
      const actionableBoost = sig.actionable ? 1.4 : 0.8;
      return s + recencyBoost * strengthMult * actionableBoost;
    }, 0);
    return { account: a, score };
  });
  return scored.sort((a, b) => b.score - a.score).map((s) => s.account);
}

export function groupByStage(accounts) {
  const groups = { pipeline: [], active: [], customer: [], renewal: [] };
  accounts.forEach((a) => {
    if (groups[a.stage]) groups[a.stage].push(a);
  });
  return groups;
}

// ===== Sidebar curation =====
// "Hot" criteria: ≥1 high-strength signal in last 7d OR any signal in last 48h
function isHot(account) {
  if (!account.signals || account.signals.length === 0) return false;
  return account.signals.some(
    (s) =>
      (s.strength === 'high' && s.daysAgo != null && s.daysAgo <= 7) ||
      (s.daysAgo != null && s.daysAgo <= 2)
  );
}

function hotScore(account) {
  // Higher signal scores rank first within "hot" bucket
  return (account.signals || []).reduce((s, sig) => {
    const recencyBoost = sig.daysAgo == null ? 0.3 : Math.max(0.3, 1 - sig.daysAgo / 14);
    const strengthMult = { high: 3, medium: 2, low: 1 }[sig.strength] || 1;
    return s + recencyBoost * strengthMult;
  }, 0);
}

// Curate up to 8 accounts for the sidebar focus list. Returns 3 buckets
// (pinned, hot, meetings) with caps applied, plus overflow count.
// Same shape at any book size — only the bucket contents change.
export function curateForSidebar(accounts, pinnedIds = []) {
  const pinnedSet = new Set(pinnedIds);

  // Bucket 1: Pinned (manual, max 3)
  const pinned = pinnedIds
    .map((id) => accounts.find((a) => a.id === id))
    .filter(Boolean)
    .slice(0, 3);

  // Bucket 2: Hot (algorithmic, max 3, excludes pinned)
  const hot = accounts
    .filter((a) => !pinnedSet.has(a.id))
    .filter(isHot)
    .sort((a, b) => hotScore(b) - hotScore(a))
    .slice(0, 3);
  const hotIds = new Set(hot.map((a) => a.id));

  // Bucket 3: Meetings this week (calendar-driven, max 2, excludes above)
  const meetings = accounts
    .filter((a) => !pinnedSet.has(a.id) && !hotIds.has(a.id))
    .filter((a) => !!a.meeting)
    .slice(0, 2);

  const visibleIds = new Set([
    ...pinned.map((a) => a.id),
    ...hot.map((a) => a.id),
    ...meetings.map((a) => a.id),
  ]);
  const overflow = accounts.filter((a) => !visibleIds.has(a.id)).length;

  return { pinned, hot, meetings, overflow, total: accounts.length };
}

// ===== Pinning persistence =====
// Pinned accounts persist per persona via localStorage. Simple FIFO at 3 max.
const PIN_STORAGE_KEY = (personaId) => `rgi-pinned-accounts-${personaId}`;

export function getPinnedAccountIds(personaId) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PIN_STORAGE_KEY(personaId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setPinnedAccountIds(personaId, ids) {
  try {
    localStorage.setItem(PIN_STORAGE_KEY(personaId), JSON.stringify(ids));
  } catch { /* no-op */ }
}

export function togglePinned(personaId, accountId) {
  const current = getPinnedAccountIds(personaId);
  let next;
  let replaced = null;
  if (current.includes(accountId)) {
    next = current.filter((id) => id !== accountId);
  } else if (current.length >= 3) {
    // FIFO: drop the oldest (first) pin to make room
    replaced = current[0];
    next = [...current.slice(1), accountId];
  } else {
    next = [...current, accountId];
  }
  setPinnedAccountIds(personaId, next);
  return { pinned: next, isPinned: next.includes(accountId), replaced };
}
