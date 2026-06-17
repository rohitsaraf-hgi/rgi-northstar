// Workbench artifact library — tenant-scoped artifacts produced by the three
// default plays (Market Analysis, Account Brief, Opportunity Finder).
//
// Pre-seeded with realistic entries per tenant so the Library view feels
// populated immediately. The "saveLocation" field is the user-visible label
// for where the file lives on their machine (no real filesystem write).

export const ARTIFACT_KINDS = {
  BRIEF: { label: 'Brief', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
  LIST: { label: 'List', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  REPORT: { label: 'Report', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  DECK: { label: 'Deck', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-500/15', border: 'border-rose-500/30' },
  EMAIL: { label: 'Email', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  MARKET: { label: 'Market', color: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30' },
};

const LIBRARY_BY_TENANT = {
  wiz: [
    { id: 'art-wiz-1', name: 'JPMorgan Chase — Account Brief.html', kind: 'BRIEF', play: 'Account Brief', createdAt: 'May 12 · 10:14 AM', size: '142 KB', threadId: 'demo', owner: 'Alex Chen', shared: true, fileFormat: 'HTML', tags: ['BFS', 'A-tier', 'Zero Trust'] },
    { id: 'art-wiz-2', name: 'Top 20 Opportunities — Wiz — May.csv', kind: 'LIST', play: 'Opportunity Finder', createdAt: 'May 12 · 9:48 AM', size: '14 KB', threadId: 'demo', owner: 'Alex Chen', shared: false, fileFormat: 'CSV', tags: ['Top 20', 'CNAPP', 'Multi-cloud'] },
    { id: 'art-wiz-3', name: 'Wiz Market Analysis — BFS NA — May.pdf', kind: 'MARKET', play: 'Market Analysis', createdAt: 'May 11 · 4:22 PM', size: '380 KB', threadId: 'demo', owner: 'Alex Chen', shared: true, fileFormat: 'PDF', tags: ['BFS', 'NA', 'TAM/SAM/SOM'] },
    { id: 'art-wiz-4', name: 'Databricks — Account Brief.html', kind: 'BRIEF', play: 'Account Brief', createdAt: 'May 10 · 2:08 PM', size: '128 KB', threadId: 'demo', owner: 'Alex Chen', shared: false, fileFormat: 'HTML', tags: ['Tech', 'A-tier', 'Orca displacement'] },
    { id: 'art-wiz-5', name: 'Q3 ROI Deck — Wiz vs Prisma.pptx', kind: 'DECK', play: 'Manual', createdAt: 'May 10 · 11:30 AM', size: '2.4 MB', threadId: null, owner: 'Alex Chen', shared: true, fileFormat: 'PPTX', tags: ['Battle deck', 'Prisma'] },
    { id: 'art-wiz-6', name: 'Snowflake — Outbound Email Sequence.txt', kind: 'EMAIL', play: 'Manual', createdAt: 'May 9 · 5:40 PM', size: '8 KB', threadId: null, owner: 'Alex Chen', shared: false, fileFormat: 'TXT', tags: ['Outbound', 'Snowflake'] },
    { id: 'art-wiz-7', name: 'Cloud Security Buyer Persona — CISO.pdf', kind: 'REPORT', play: 'Manual', createdAt: 'May 8 · 3:11 PM', size: '1.1 MB', threadId: null, owner: 'Alex Chen', shared: true, fileFormat: 'PDF', tags: ['CISO', 'Persona'] },
  ],
  hg: [
    { id: 'art-hg-1', name: 'Acme Corp — Account Brief.html', kind: 'BRIEF', play: 'Account Brief', createdAt: 'May 12 · 9:32 AM', size: '136 KB', threadId: 'demo', owner: 'Riley Cooper', shared: true, fileFormat: 'HTML', tags: ['Mid-market', 'A-tier'] },
    { id: 'art-hg-2', name: 'Fintech NA — SOM Companies — May.csv', kind: 'LIST', play: 'Market Analysis', createdAt: 'May 8 · 11:01 AM', size: '12 KB', threadId: 'demo', owner: 'Maya Patel', shared: true, fileFormat: 'CSV', tags: ['Fintech', 'NA', 'SOM'] },
    { id: 'art-hg-3', name: 'APAC Expansion — Board Memo.pdf', kind: 'REPORT', play: 'Manual', createdAt: 'May 1 · 8:14 AM', size: '780 KB', threadId: 'apac-tam', owner: 'Maya Patel', shared: true, fileFormat: 'PDF', tags: ['APAC', 'Board'] },
    { id: 'art-hg-4', name: 'Meridian Cloud — Pre-Call Brief.html', kind: 'BRIEF', play: 'Account Brief', createdAt: 'Apr 28 · 4:30 PM', size: '98 KB', threadId: 'meridian-deal', owner: 'Jordan Chen', shared: false, fileFormat: 'HTML', tags: ['Active deal', 'Pre-call'] },
  ],
};

export function getLibraryForTenant(tenantId) {
  return LIBRARY_BY_TENANT[tenantId] || [];
}

export function getDefaultSaveLocation(tenantId) {
  return `~/RGI/${tenantId}/`;
}
