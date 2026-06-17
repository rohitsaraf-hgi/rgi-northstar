import { useMemo, useState } from 'react';
import {
  Search, ArrowUpDown, ArrowDown, ArrowUp, Filter, BookmarkPlus, Bot, Download, Sparkles,
  ExternalLink, Building2, Cloud, Swords, Activity, Compass,
} from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import LiveCoachNote from './LiveCoachNote.jsx';
import { OPPORTUNITY_POOL, rankOpportunities, getOppTier } from '../../../data/opportunityFinderData.js';
import { useTenant } from '../../../context/TenantContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { searchResourcesForAgent } from '../../../data/researchResources.js';

const TIER_STYLES = {
  A: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  B: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  C: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  D: 'bg-text-muted/15 text-text-muted border-border',
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'tier_a', label: 'A-tier' },
  { id: 'displacement', label: 'Displacement' },
  { id: 'clean_entry', label: 'Clean entry' },
  { id: 'bfs', label: 'BFS only' },
];

function TierBadge({ tier }) {
  return (
    <span className={`inline-flex items-center justify-center w-6 h-5 rounded text-[10px] font-bold border ${TIER_STYLES[tier]}`}>
      {tier}
    </span>
  );
}

function ScoreBar({ score, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-bg/60 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[11px] font-mono text-text-primary w-6 text-right">{score}</span>
    </div>
  );
}

export default function LiveOpportunityFinder({ onPin }) {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('combined');
  const [sortDir, setSortDir] = useState('desc');
  const [expanded, setExpanded] = useState(null);

  const ranked = useMemo(() => rankOpportunities(OPPORTUNITY_POOL, tenant).slice(0, 20), [tenant]);
  const cited = useMemo(
    () =>
      searchResourcesForAgent({
        tenantId: tenant.id,
        contextTags: tenant.competitors?.slice(0, 3).map((c) => c.name) || [],
        limit: 2,
      }),
    [tenant]
  );

  const filtered = useMemo(() => {
    let rows = [...ranked];
    if (filter === 'tier_a') rows = rows.filter((r) => getOppTier(r.combined) === 'A');
    if (filter === 'displacement') rows = rows.filter((r) => r.competitor && r.competitor !== 'None detected');
    if (filter === 'clean_entry') rows = rows.filter((r) => !r.competitor || r.competitor === 'None detected');
    if (filter === 'bfs') rows = rows.filter((r) => r.industry === 'Banking and Financial Services');
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.industry.toLowerCase().includes(q));
    }
    rows.sort((a, b) => {
      const av = ['combined', 'fit', 'intentSurge'].includes(sortBy)
        ? a[sortBy]
        : parseFloat(String(a[sortBy]).replace(/[$,KMB]/g, ''));
      const bv = ['combined', 'fit', 'intentSurge'].includes(sortBy)
        ? b[sortBy]
        : parseFloat(String(b[sortBy]).replace(/[$,KMB]/g, ''));
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return rows;
  }, [filter, search, sortBy, sortDir, ranked]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ col }) =>
    sortBy === col ? (
      sortDir === 'desc' ? <ArrowDown size={9} /> : <ArrowUp size={9} />
    ) : (
      <ArrowUpDown size={9} className="text-text-muted/60" />
    );

  const tierCounts = ranked.reduce((acc, r) => {
    acc[getOppTier(r.combined)] = (acc[getOppTier(r.combined)] || 0) + 1;
    return acc;
  }, {});
  const displacement = ranked.filter((r) => r.competitor && r.competitor !== 'None detected').length;
  const cleanEntry = 20 - displacement;

  return (
    <LiveFrame
      title="Opportunity Finder — Top 20"
      subtitle={`Ranked by ICP fit × intent surge × competitor overlap. Tenant: ${tenant.name}.`}
      onPin={onPin}
      footer={`${ranked.length} accounts · ${tierCounts.A || 0} A-tier · ${displacement} displacement · ${cleanEntry} clean entry`}
    >
      <LiveCoachNote
        tone="win"
        headline={`${tierCounts.A || 0} A-tier accounts ready for outreach this week.`}
        body={`Mix of plays: ${displacement} require displacement (slower cycles, bigger ACVs) and ${cleanEntry} are clean entries (faster, cleaner). Top 3 picks all match ${tenant.icp.industries[0]?.name}, all in active research on ${tenant.intentTopics[0]?.name}.`}
        more={[
          `Ranking uses your ICP weights: ${tenant.icp.industries.slice(0, 3).map((i) => `${i.name} (${(i.weight * 100).toFixed(0)}%)`).join(', ')}.`,
          'Each row expands to show specific reasons-to-believe — quote them directly in outbound to anchor the conversation.',
        ]}
        className="mb-3"
      />

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-1 px-2 py-1 bg-bg/40 border border-border rounded text-xs flex-1 max-w-xs">
          <Search size={11} className="text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or industry…"
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={10} className="text-text-muted" />
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                filter === f.id ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-bg/40 border-border text-text-secondary hover:border-border-2'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => showToast('Saved as a list artifact in this thread', 'success')}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-text-secondary hover:text-text-primary border border-border rounded hover:border-border-2"
          >
            <BookmarkPlus size={10} />
            Save list
          </button>
          <button
            onClick={() => showToast('Exported 20 accounts as CSV', 'success')}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-text-secondary hover:text-text-primary border border-border rounded hover:border-border-2"
          >
            <Download size={10} />
            Export
          </button>
          <button
            onClick={() => showToast('Triggered CRM Enrichment for top 20', 'success')}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
          >
            <Bot size={10} />
            Enrich CRM
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-bg/40 text-text-muted">
            <tr>
              <th className="text-left px-2 py-1.5 font-semibold w-10">#</th>
              <th className="text-left px-2 py-1.5 font-semibold w-10">Tier</th>
              <th className="text-left px-2 py-1.5 font-semibold">Company</th>
              <th className="text-left px-2 py-1.5 font-semibold">Cloud</th>
              <th className="text-left px-2 py-1.5 font-semibold">Competitor</th>
              <th className="text-left px-2 py-1.5 font-semibold cursor-pointer" onClick={() => toggleSort('fit')}>
                <span className="inline-flex items-center gap-1">Fit <SortIcon col="fit" /></span>
              </th>
              <th className="text-left px-2 py-1.5 font-semibold cursor-pointer" onClick={() => toggleSort('intentSurge')}>
                <span className="inline-flex items-center gap-1">Intent <SortIcon col="intentSurge" /></span>
              </th>
              <th className="text-right px-2 py-1.5 font-semibold cursor-pointer" onClick={() => toggleSort('combined')}>
                <span className="inline-flex items-center gap-1">Score <SortIcon col="combined" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <>
                <tr
                  key={r.id}
                  className={`border-t border-border hover:bg-bg/40 cursor-pointer ${expanded === r.id ? 'bg-primary/[0.04]' : ''}`}
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                >
                  <td className="px-2 py-1.5 font-mono text-text-muted text-[10px]">{i + 1}</td>
                  <td className="px-2 py-1.5"><TierBadge tier={getOppTier(r.combined)} /></td>
                  <td className="px-2 py-1.5">
                    <div className="font-medium text-text-primary">{r.name}</div>
                    <div className="text-[10px] text-text-muted">{r.industry.split(' ').slice(0, 3).join(' ')} · {r.revenue}</div>
                  </td>
                  <td className="px-2 py-1.5 text-[10px] text-text-secondary">{r.cloud}</td>
                  <td className="px-2 py-1.5 text-[10px] text-text-secondary truncate max-w-[140px]">
                    {r.competitor === 'None detected' ? (
                      <span className="text-emerald-700 dark:text-emerald-300 font-medium">None — clean entry</span>
                    ) : (
                      <span>{r.competitor}</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5"><ScoreBar score={r.fit} color="bg-blue-500" /></td>
                  <td className="px-2 py-1.5"><ScoreBar score={r.intentSurge} color="bg-amber-500" /></td>
                  <td className="px-2 py-1.5 text-right font-mono font-semibold text-text-primary">{r.combined}</td>
                </tr>
                {expanded === r.id && (
                  <tr className="bg-primary/[0.02]">
                    <td colSpan={8} className="px-3 py-3 border-t border-border">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1 inline-flex items-center gap-1">
                            <Sparkles size={9} className="text-primary" /> Why this account
                          </div>
                          <ul className="space-y-1">
                            {r.reasons.map((reason, idx) => (
                              <li key={idx} className="text-[11px] text-text-secondary leading-relaxed flex items-start gap-1">
                                <span className="text-primary">→</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1 inline-flex items-center gap-1">
                            <Activity size={9} className="text-amber-700 dark:text-amber-300" /> Intent surging on
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {r.intentTopics.map((t) => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded font-medium">{t}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1 inline-flex items-center gap-1">
                            <Cloud size={9} className="text-blue-700 dark:text-blue-300" /> HG-detected stack
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {r.hgInstalls.map((t) => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded font-medium">{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                        <div className="text-[11px] text-text-muted">
                          <Building2 size={9} className="inline mr-1" />
                          {r.employees} employees · {r.country}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://${r.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-text-secondary hover:text-primary inline-flex items-center gap-0.5"
                          >
                            {r.url} <ExternalLink size={9} />
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showToast(`@account_brief ${r.name} queued — open in a new thread`, 'info');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-primary text-white rounded hover:bg-primary-dim"
                          >
                            <Compass size={9} /> Run Account Brief
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cited resources from the tenant's library */}
      {cited.length > 0 && (
        <div className="mt-3 px-3 py-2.5 bg-sky-500/[0.05] border border-sky-500/30 rounded">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={11} className="text-sky-700 dark:text-sky-300" />
            <span className="text-[10px] uppercase tracking-wider text-sky-700 dark:text-sky-300 font-bold">Resources cited</span>
            <span className="text-[10px] text-text-muted">via kb_resource_search</span>
          </div>
          <div className="space-y-1">
            {cited.map((r) => (
              <div key={r.id} className="flex items-start gap-2 text-[11px]">
                <span className="text-sky-700 dark:text-sky-300 font-mono pt-0.5">→</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-text-primary">{r.title}</span>
                  <span className="text-text-muted"> — {r.summary}</span>
                </div>
                <span className="text-[10px] text-text-muted whitespace-nowrap">added by {r.owner}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </LiveFrame>
  );
}
