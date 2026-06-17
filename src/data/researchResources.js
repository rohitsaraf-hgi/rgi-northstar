// Research Resources — knowledge that sellers contribute to the tenant.
// Resources can be URLs, uploaded files, or typed notes. Each is tagged with
// HG intent topics so agent workflows can pull contextually-relevant ones.
//
// "Used by agents" toggle: when ON, the resource is included in agent runs'
// kb_resource_search step and cited in the output by title.

export const RESOURCE_TYPES = {
  url: { label: 'Web', icon: 'globe' },
  pdf: { label: 'PDF', icon: 'file-text' },
  doc: { label: 'Doc', icon: 'file' },
  transcript: { label: 'Transcript', icon: 'mic' },
  note: { label: 'Note', icon: 'pencil' },
};

const RESOURCES_BY_TENANT = {
  wiz: [
    {
      id: 'res-wiz-1',
      type: 'transcript',
      title: 'JPMorgan Q3 2026 Earnings Call — Cloud Security mentions',
      source: 'jpmorganchase.com/investor-relations',
      summary: 'Jamie Dimon flagged "GTM cloud security consolidation" as a Q4 priority. CFO mentioned $280M cloud spend rising 14%.',
      tags: ['BFS', 'JPMorgan', 'CNAPP', 'cloud cybersecurity'],
      owner: 'Alex Chen',
      shared: true,
      usedByAgents: true,
      addedAt: 'May 12 · 8:14 AM',
      lastCitedIn: 'Account Brief — JPMorgan Chase',
      citationCount: 3,
    },
    {
      id: 'res-wiz-2',
      type: 'pdf',
      title: 'Wiz vs Palo Alto Prisma Cloud — Battle Card v3.2',
      source: 'wiz-internal-drive/battlecards/prisma-v3.2.pdf',
      summary: 'Latest battle card. Key wedge points: pricing transparency, agentless deployment, dev-friendly UI. 4-page PDF.',
      tags: ['Palo Alto Prisma Cloud', 'Battle card', 'Displacement'],
      owner: 'Marketing — Sara Liu',
      shared: true,
      usedByAgents: true,
      addedAt: 'May 10 · 11:30 AM',
      lastCitedIn: 'Account Brief — Nvidia',
      citationCount: 8,
    },
    {
      id: 'res-wiz-3',
      type: 'url',
      title: 'FedRAMP Authorization — Wiz Federal Cloud',
      source: 'wiz.io/federal/fedramp-status',
      summary: 'Live status page for Wiz Federal Cloud FedRAMP authorization. Currently In Process at Moderate level.',
      tags: ['Public Administration', 'FedRAMP', 'Compliance'],
      owner: 'Compliance — Mark Davies',
      shared: true,
      usedByAgents: true,
      addedAt: 'May 9 · 3:22 PM',
      lastCitedIn: null,
      citationCount: 0,
    },
    {
      id: 'res-wiz-4',
      type: 'note',
      title: 'Lacework retention struggles — competitive intel from RSA',
      source: 'Internal note',
      summary: 'Heard from 3 customers at RSA that Lacework is losing logos to Wiz + Orca. Renewal cycles 60d+ overdue. Diligence team confirmed via channel partners.',
      tags: ['Lacework', 'Competitive intel', 'Displacement'],
      owner: 'Alex Chen',
      shared: true,
      usedByAgents: true,
      addedAt: 'May 8 · 6:11 PM',
      lastCitedIn: 'Opportunity Finder — Wiz',
      citationCount: 2,
    },
    {
      id: 'res-wiz-5',
      type: 'pdf',
      title: 'Forrester Wave: CNAPP Q2 2026 — Wiz Leader Position',
      source: 'forrester.com/wave-cnapp-q2-2026',
      summary: 'Forrester names Wiz a Leader in CNAPP. Strongest in current offering across CSPM, CWPP, KSPM dimensions.',
      tags: ['CNAPP', 'Analyst report', 'Forrester'],
      owner: 'Marketing — Sara Liu',
      shared: true,
      usedByAgents: true,
      addedAt: 'May 7 · 9:00 AM',
      lastCitedIn: 'Account Brief — Databricks',
      citationCount: 5,
    },
    {
      id: 'res-wiz-6',
      type: 'doc',
      title: 'CISO Buyer Persona — Cloud Security 2026',
      source: 'docs/personas/ciso-cloud-2026.md',
      summary: 'Detailed buyer persona for CISOs in cloud-native enterprises. Includes typical pain points, budget cycles, decision criteria.',
      tags: ['CISO', 'Persona', 'Cloud Security'],
      owner: 'Sales Enablement — Tom Park',
      shared: true,
      usedByAgents: true,
      addedAt: 'May 5 · 2:40 PM',
      lastCitedIn: 'Account Brief — Visa',
      citationCount: 4,
    },
    {
      id: 'res-wiz-7',
      type: 'transcript',
      title: 'My discovery call with Snowflake (Apr 30)',
      source: 'My notes',
      summary: 'Discovery call with Snowflake security lead. Key takeaways: multi-cloud spread (AWS+Azure+GCP), no CNAPP currently, IPO-driven posture push.',
      tags: ['Snowflake', 'Discovery', 'Multi-cloud'],
      owner: 'Alex Chen',
      shared: false,
      usedByAgents: false,
      addedAt: 'Apr 30 · 5:14 PM',
      lastCitedIn: null,
      citationCount: 0,
    },
    {
      id: 'res-wiz-8',
      type: 'url',
      title: 'Datadog DASH 2025 Keynote — Cloud Security mentions',
      source: 'youtube.com/datadog-dash-2025',
      summary: 'Datadog CEO mentioned cloud security as a Q1 2026 product focus. Could shift competitive landscape for adjacent observability buyers.',
      tags: ['Datadog', 'Competitive intel', 'Adjacent'],
      owner: 'Marketing — Sara Liu',
      shared: true,
      usedByAgents: false,
      addedAt: 'Apr 22 · 10:00 AM',
      lastCitedIn: null,
      citationCount: 0,
    },
  ],
  hg: [
    {
      id: 'res-hg-1',
      type: 'pdf',
      title: 'GTM Tooling Consolidation — Customer ROI Study',
      source: 'hg-internal/roi-studies/gtm-consolidation.pdf',
      summary: 'Average HG customer saves $3.4M annually by consolidating ZoomInfo + 6sense. Based on 22 customer interviews.',
      tags: ['ZoomInfo', '6sense', 'Consolidation', 'ROI'],
      owner: 'Maya Patel',
      shared: true,
      usedByAgents: true,
      addedAt: 'May 8 · 10:00 AM',
      lastCitedIn: 'Account Brief — Acme Corp',
      citationCount: 6,
    },
    {
      id: 'res-hg-2',
      type: 'note',
      title: 'RevOps Director Buying Patterns — Q1 2026 cohort',
      source: 'Internal note',
      summary: 'Observed pattern: RevOps Directors hired post-Q4 typically have 60-90 days of "tool audit" before any new buy. Plan outbound accordingly.',
      tags: ['RevOps', 'Buying patterns', 'Sales tactics'],
      owner: 'Jordan Chen',
      shared: true,
      usedByAgents: true,
      addedAt: 'May 1 · 4:22 PM',
      lastCitedIn: 'Opportunity Finder — Q2',
      citationCount: 2,
    },
  ],
};

export function getResourcesForTenant(tenantId) {
  return RESOURCES_BY_TENANT[tenantId] || [];
}

// Resources cited during an agent run — returns the top-N agent-enabled
// resources whose tags match any of the given context tags. Used by
// kb_resource_search step in account-brief-flow / opportunity-finder-flow.
export function searchResourcesForAgent({ tenantId, contextTags = [], limit = 3 }) {
  const pool = (RESOURCES_BY_TENANT[tenantId] || []).filter((r) => r.usedByAgents);
  if (contextTags.length === 0) return pool.slice(0, limit);
  const scored = pool.map((r) => {
    const overlap = r.tags.filter((t) => contextTags.some((c) => c.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(c.toLowerCase()))).length;
    return { resource: r, overlap };
  });
  return scored
    .filter((s) => s.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((s) => s.resource);
}
