import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Activity,
  TrendingUp,
  ArrowRight,
  User,
  RefreshCw,
  Zap,
  Plus,
  Sparkles,
  X,
  Check,
} from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import Avatar from '../../shared/Avatar.jsx';
import ProspectFilterPanel from './ProspectFilterPanel.jsx';
import { FINTECH_WHITESPACE_COMPANIES, WHITESPACE_VARIANTS, QUICK_FILTERS } from '../../../data/fintechWhitespaceData.js';
import { FILTER_PRESETS, rowMatchesFilters, summarize } from '../../../data/prospectFilters.js';
import { useCompanyDetail } from '../../../context/CompanyDetailContext.jsx';

const COLUMNS = [
  { id: 'name', label: 'Company', sortable: true, sortKey: (r) => r.name },
  { id: 'status', label: 'Status', sortable: true, sortKey: (r) => r.status },
  { id: 'revenue', label: 'Revenue', sortable: true, sortKey: (r) => r.revenue, align: 'right' },
  { id: 'employees', label: 'Employees', sortable: true, sortKey: (r) => r.employees, align: 'right' },
  { id: 'location', label: 'Location', sortable: true, sortKey: (r) => r.location },
  { id: 'propensity', label: 'Propensity', sortable: true, sortKey: (r) => r.propensity, align: 'left' },
  { id: 'signals', label: 'Signals', sortable: true, sortKey: (r) => r.signalsCount, align: 'center' },
  { id: 'intent', label: 'Intent', sortable: false },
  { id: 'owner', label: 'Owner', sortable: false },
];

const STATUS_STYLES = {
  Customer: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Prospect: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  'At Risk': 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

function StatusPill({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.Prospect;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${cls}`}>
      {status}
    </span>
  );
}

function PropensityCell({ score }) {
  const tone =
    score >= 80
      ? 'bg-emerald-500'
      : score >= 65
      ? 'bg-blue-500'
      : score >= 50
      ? 'bg-amber-500'
      : 'bg-text-muted';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
        <div className={`h-full ${tone} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono text-text-primary w-7">{score}</span>
    </div>
  );
}

function IntentChips({ topics }) {
  if (!topics || topics.length === 0)
    return <span className="text-text-muted text-xs">—</span>;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {topics.map((t) => {
        const isCompetitor = t.kind === 'competitor';
        return (
          <span
            key={t.name}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
              isCompetitor
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCompetitor ? 'bg-rose-500' : 'bg-blue-500'
              }`}
            />
            {t.name}
            <span className="font-mono">{t.score}</span>
            <ArrowRight size={9} />
          </span>
        );
      })}
    </div>
  );
}

export default function LiveProspectList({ variant = 'initial', onPin, openFiltersOnMount = false, presetKey }) {
  const { openCompany } = useCompanyDetail();
  const data = WHITESPACE_VARIANTS[variant] || WHITESPACE_VARIANTS.initial;
  const map = useMemo(() => new Map(FINTECH_WHITESPACE_COMPANIES.map((c) => [c.id, c])), []);
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ col: 'propensity', dir: 'desc' });
  const [filtersOpen, setFiltersOpen] = useState(openFiltersOnMount);
  const [activeFilters, setActiveFilters] = useState(() =>
    presetKey ? FILTER_PRESETS[presetKey] || [] : []
  );

  // If the AI re-renders with a new preset, sync filters
  useEffect(() => {
    if (presetKey) setActiveFilters(FILTER_PRESETS[presetKey] || []);
  }, [presetKey]);

  const rows = useMemo(() => {
    let r = data.ids.map((id) => map.get(id)).filter(Boolean);

    // Apply filter panel filters
    r = r.filter((row) => rowMatchesFilters(row, activeFilters));

    if (activeQuickFilter === 'high-propensity') r = r.filter((x) => x.propensity >= 80);
    else if (activeQuickFilter === 'has-signals') r = r.filter((x) => x.signalsCount > 0);
    else if (activeQuickFilter === 'account-intent') r = r.filter((x) => x.intentTopics.length > 0);
    else if (activeQuickFilter === 'my-accounts')
      r = r.filter((x) => x.owner?.name === 'Sarah Miller');

    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (x) => x.name.toLowerCase().includes(q) || x.industry.toLowerCase().includes(q)
      );
    }

    const col = COLUMNS.find((c) => c.id === sort.col);
    if (col?.sortKey) {
      r = [...r].sort((a, b) => {
        const av = col.sortKey(a) ?? 0;
        const bv = col.sortKey(b) ?? 0;
        if (typeof av === 'number') return sort.dir === 'asc' ? av - bv : bv - av;
        return sort.dir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }
    return r;
  }, [data, map, activeQuickFilter, search, sort, activeFilters]);

  const handleSort = (colId) => {
    const col = COLUMNS.find((c) => c.id === colId);
    if (!col?.sortable) return;
    setSort((s) =>
      s.col === colId ? { col: colId, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col: colId, dir: 'desc' }
    );
  };

  const removeFilter = (filter) => {
    setActiveFilters((prev) => prev.filter((f) => !(f.id === filter.id && f.value === filter.value)));
  };

  const aiAppliedCount = activeFilters.filter((f) => f.appliedBy === 'ai').length;
  const stats = summarize(rows);

  return (
    <LiveFrame
      title={data.title}
      subtitle="Click any company to drill in. Refine via natural language above, the quick chips, or open the full Filters panel — all stay in sync."
      onPin={onPin}
      footer={`${stats.total} match · ${stats.inCrm} in CRM · ${stats.netNew} net new · ${activeFilters.length} filter${activeFilters.length !== 1 ? 's' : ''} active`}
    >
      {/* AI applied summary banner */}
      {aiAppliedCount > 0 && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-primary/8 border border-primary/20 rounded-md">
          <Sparkles size={12} className="text-primary flex-shrink-0" />
          <span className="text-xs text-text-secondary flex-1">
            <span className="text-primary font-semibold">AI applied {aiAppliedCount} condition{aiAppliedCount !== 1 ? 's' : ''}</span> — {stats.total} compan{stats.total !== 1 ? 'ies' : 'y'} matched · click any chip to remove or use the filter panel
          </span>
        </div>
      )}

      {/* AI search bar */}
      <div className="bg-bg/40 border border-border rounded-lg flex items-center gap-2 px-3 py-2 mb-3">
        <Search size={14} className="text-primary flex-shrink-0" />
        <span className="text-xs text-text-secondary flex-1 truncate font-mono">
          {data.activeQuery}
        </span>
        <kbd className="text-[10px] px-1.5 py-0.5 bg-surface border border-border rounded font-mono text-text-muted">
          ⌘K
        </kbd>
        <button
          onClick={() => setFiltersOpen(true)}
          className={`text-xs px-2 py-0.5 border rounded flex items-center gap-1 transition-colors ${
            activeFilters.length > 0
              ? 'border-primary/40 text-primary bg-primary/10'
              : 'border-border text-text-muted hover:text-text-secondary hover:border-border-2'
          }`}
        >
          <SlidersHorizontal size={11} />
          Filters
          {activeFilters.length > 0 && (
            <span className="text-[10px] font-bold ml-0.5">{activeFilters.length}</span>
          )}
        </button>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mr-1">
            Active
          </span>
          {activeFilters.map((f, i) => (
            <span
              key={`${f.id}-${f.value}-${i}`}
              className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 border rounded text-[11px] ${
                f.appliedBy === 'ai'
                  ? 'bg-primary/10 border-primary/30 text-text-primary'
                  : 'bg-surface border-border text-text-primary'
              }`}
            >
              {f.appliedBy === 'ai' && <Sparkles size={9} className="text-primary" />}
              <span className="text-text-muted capitalize">{f.id}:</span>
              <span>{f.value}</span>
              <button
                onClick={() => removeFilter(f)}
                className="ml-0.5 p-0.5 rounded hover:bg-surface-2 text-text-muted hover:text-danger transition-colors"
              >
                <X size={9} />
              </button>
            </span>
          ))}
          <button
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 border border-dashed border-border-2 rounded text-[11px] text-text-secondary hover:text-text-primary hover:border-primary/40 transition-colors"
          >
            <Plus size={9} />
            Add filter
          </button>
        </div>
      )}

      {/* Quick filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mr-1">
          Quick
        </span>
        {QUICK_FILTERS.map((qf) => {
          const isActive = activeQuickFilter === qf.id;
          return (
            <button
              key={qf.id}
              onClick={() => setActiveQuickFilter(isActive ? null : qf.id)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] border transition-colors ${
                isActive
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-surface border-border text-text-secondary hover:border-border-2'
              }`}
            >
              {qf.label}
            </button>
          );
        })}
      </div>

      {/* Inline search */}
      <div className="relative mb-3">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search within results..."
          className="w-full bg-bg/40 border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary/40"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted font-mono">
          {rows.length} results
        </span>
      </div>

      {/* Table */}
      <div className="border border-border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-bg/40">
              <tr>
                {COLUMNS.map((c) => {
                  const isSorted = sort.col === c.id;
                  return (
                    <th
                      key={c.id}
                      onClick={() => handleSort(c.id)}
                      className={`px-3 py-2 font-medium text-text-muted uppercase text-[10px] tracking-wider whitespace-nowrap text-${
                        c.align || 'left'
                      } ${c.sortable ? 'cursor-pointer hover:text-text-primary' : ''}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        {c.sortable &&
                          (isSorted ? (
                            sort.dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                          ) : (
                            <ArrowUpDown size={10} className="opacity-30" />
                          ))}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => openCompany(c.id)}
                  className="border-t border-border hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                        style={{ background: c.logoColor, color: c.logoText }}
                      >
                        {c.initials.slice(0, 4)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-text-primary font-medium truncate">{c.name}</div>
                        <div className="text-[10px] text-text-muted truncate">{c.industry}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-text-primary whitespace-nowrap">
                    {c.revenueLabel}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-text-primary whitespace-nowrap">
                    {c.employeesLabel}
                  </td>
                  <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">{c.location}</td>
                  <td className="px-3 py-2.5">
                    <PropensityCell score={c.propensity} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {c.signalsCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-300">
                        <Activity size={11} />
                        <span className="font-mono">{c.signalsCount}</span>
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <IntentChips topics={c.intentTopics} />
                  </td>
                  <td className="px-3 py-2.5">
                    {c.owner ? (
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <Avatar
                          name={c.owner.name}
                          initials={c.owner.initials}
                          color={c.owner.color}
                          size={20}
                        />
                        <span className="text-text-secondary text-[11px]">{c.owner.name}</span>
                      </div>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="text-center py-8 text-xs text-text-muted">
                    No companies match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-start gap-2 mt-3 p-3 bg-primary/5 border border-primary/15 rounded-md">
        <TrendingUp size={12} className="text-primary mt-0.5 flex-shrink-0" />
        <div className="text-xs text-text-secondary leading-relaxed">{data.aiNote}</div>
      </div>

      <ProspectFilterPanel
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        activeFilters={activeFilters}
        onChange={setActiveFilters}
      />
    </LiveFrame>
  );
}
