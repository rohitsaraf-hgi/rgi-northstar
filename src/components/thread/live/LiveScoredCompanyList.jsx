import { useState, useMemo } from 'react';
import {
  Search, ArrowUpDown, ArrowDown, ArrowUp, Pin, Download, Bot, ExternalLink, Sparkles, Filter,
} from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import LiveCoachNote from './LiveCoachNote.jsx';
import { TAM_SAM_SOM_WHITESPACE, SCORE_TIERS, getTier } from '../../../data/tamSamSomData.js';
import { useToast } from '../../../context/ToastContext.jsx';

const OPPORTUNITY_STYLES = {
  Customer: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'Expansion Whitespace': 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  'Prospect Whitespace': 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
};

function ScoreBar({ score, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-bg/60 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[11px] font-mono text-text-primary w-6 text-right">{score}</span>
    </div>
  );
}

function TierBadge({ tier }) {
  const cfg = SCORE_TIERS[tier];
  return (
    <span className={`inline-flex items-center justify-center w-6 h-5 rounded text-[10px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'tier_a', label: 'A-tier' },
  { id: 'tier_ab', label: 'A + B' },
  { id: 'expansion', label: 'Expansion' },
  { id: 'prospect', label: 'Prospect' },
];

export default function LiveScoredCompanyList({ scoringWeights, onPin, onEnrich, onExport, listSavedId }) {
  const { showToast } = useToast();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('combined');
  const [sortDir, setSortDir] = useState('desc');

  // Compute combined score using user weights
  const data = useMemo(() => {
    const weights = scoringWeights?.dimensions || [];
    const totalWeight = weights.reduce((s, d) => s + d.weight, 0) || 100;
    // For demo: combined ≈ fit * (sumFitWeights / total) + intent * (sumIntentWeights / total)
    const fitWeightSum = weights
      .filter((d) => ['industry', 'geo', 'revenue', 'employees', 'tech_install'].includes(d.id))
      .reduce((s, d) => s + d.weight, 0);
    const intentWeightSum = weights.find((d) => d.id === 'intent_surge')?.weight || 0;
    const fitFactor = fitWeightSum / totalWeight;
    const intentFactor = intentWeightSum / totalWeight;

    return TAM_SAM_SOM_WHITESPACE.companies.map((c) => ({
      ...c,
      combined: Math.round(c.fit * fitFactor + c.intent * intentFactor),
    }));
  }, [scoringWeights]);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (filter === 'tier_a') rows = rows.filter((r) => getTier(r.combined) === 'A');
    if (filter === 'tier_ab') rows = rows.filter((r) => ['A', 'B'].includes(getTier(r.combined)));
    if (filter === 'expansion') rows = rows.filter((r) => r.opportunity === 'Expansion Whitespace');
    if (filter === 'prospect') rows = rows.filter((r) => r.opportunity === 'Prospect Whitespace');
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));
    }
    rows.sort((a, b) => {
      const av = ['combined', 'fit', 'intent'].includes(sortBy)
        ? a[sortBy]
        : parseFloat(String(a[sortBy]).replace(/[$,KMB]/g, ''));
      const bv = ['combined', 'fit', 'intent'].includes(sortBy)
        ? b[sortBy]
        : parseFloat(String(b[sortBy]).replace(/[$,KMB]/g, ''));
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return rows;
  }, [filter, search, sortBy, sortDir, data]);

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

  // Headline counts
  const tierCounts = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    data.forEach((r) => {
      counts[getTier(r.combined)]++;
    });
    return counts;
  }, [data]);

  return (
    <LiveFrame
      title="Scored company list"
      subtitle={`Fit + Intent + Combined Tier per company. ${data.length} companies in scope · ${tierCounts.A} A-tier · ${tierCounts.B} B-tier.`}
      onPin={onPin}
      footer={listSavedId ? `Saved as artifact · ${listSavedId}` : 'Pin to save as a thread artifact'}
    >
      <LiveCoachNote
        tone="win"
        headline={`${tierCounts.A} A-tier accounts: ready for outreach this week.`}
        body={`A-tier (combined ≥80) means strong ICP fit AND active intent — these are your fastest-closing, highest-conviction targets. Top 3: JPMorgan Chase, Visa, Mastercard — all BFS, all in active research, none have your competitor incumbent.\n\nB-tier (65–79) is ${tierCounts.B} accounts — solid fit, needs a nurture motion or trigger event. C-tier and below are noise unless you're building long-term pipeline.`}
        more={[
          'Score is sensitive to your weights — re-open the scoring profile to test "tech-install heavy" vs "intent-heavy" and see which produces a top 20 you trust most.',
          'Tier thresholds (80/65/50) are the HG defaults. Loosen if you need volume; tighten for SDR-attached high-touch.',
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
            placeholder="Search…"
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
            onClick={() => onExport && onExport(filtered)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-text-secondary hover:text-text-primary border border-border rounded hover:border-border-2"
          >
            <Download size={10} />
            Export to CRM
          </button>
          <button
            onClick={() => onEnrich && onEnrich(filtered)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
          >
            <Bot size={10} />
            Mark for Enrichment
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-bg/40 text-text-muted">
            <tr>
              <th className="text-left px-2 py-1.5 font-semibold">Tier</th>
              <th className="text-left px-2 py-1.5 font-semibold">Company</th>
              <th className="text-left px-2 py-1.5 font-semibold">Industry</th>
              <th className="text-right px-2 py-1.5 font-semibold cursor-pointer" onClick={() => toggleSort('itSpend')}>
                <span className="inline-flex items-center gap-1">IT Spend <SortIcon col="itSpend" /></span>
              </th>
              <th className="text-left px-2 py-1.5 font-semibold cursor-pointer" onClick={() => toggleSort('fit')}>
                <span className="inline-flex items-center gap-1">Fit <SortIcon col="fit" /></span>
              </th>
              <th className="text-left px-2 py-1.5 font-semibold cursor-pointer" onClick={() => toggleSort('intent')}>
                <span className="inline-flex items-center gap-1">Intent <SortIcon col="intent" /></span>
              </th>
              <th className="text-right px-2 py-1.5 font-semibold cursor-pointer" onClick={() => toggleSort('combined')}>
                <span className="inline-flex items-center gap-1">Combined <SortIcon col="combined" /></span>
              </th>
              <th className="text-left px-2 py-1.5 font-semibold">Opportunity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-bg/40">
                <td className="px-2 py-1.5"><TierBadge tier={getTier(r.combined)} /></td>
                <td className="px-2 py-1.5 font-medium text-text-primary truncate max-w-[160px]">{r.name}</td>
                <td className="px-2 py-1.5 text-text-secondary text-[10px] truncate max-w-[140px]">{r.industry}</td>
                <td className="px-2 py-1.5 text-right font-mono text-text-secondary">{r.itSpend}</td>
                <td className="px-2 py-1.5"><ScoreBar score={r.fit} color="bg-blue-500" /></td>
                <td className="px-2 py-1.5"><ScoreBar score={r.intent} color="bg-amber-500" /></td>
                <td className="px-2 py-1.5 text-right font-mono font-semibold text-text-primary">{r.combined}</td>
                <td className="px-2 py-1.5">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${OPPORTUNITY_STYLES[r.opportunity] || ''}`}>
                    {r.opportunity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-[11px] text-text-muted">
        <span>
          Showing {filtered.length} of {data.length} · Sorted by{' '}
          <span className="font-mono text-text-secondary">{sortBy}</span> {sortDir === 'desc' ? '↓' : '↑'}
        </span>
        <span className="inline-flex items-center gap-1">
          <Sparkles size={10} className="text-primary" />
          Intent topics tracked: Zero Trust, cybersecurity, endpoint
        </span>
      </div>
    </LiveFrame>
  );
}
