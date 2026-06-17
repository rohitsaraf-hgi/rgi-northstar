import { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Building2,
  ZapOff,
  Zap,
  Lightbulb,
  SlidersHorizontal,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LiveFrame, FilterChip } from './LiveFrame.jsx';
import { JORDAN_BOOK, TRIAGE_FILTERS, TRIAGE_VARIANTS } from '../../../data/accountData.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { useCompanyDetail } from '../../../context/CompanyDetailContext.jsx';

const INTENT_STYLES = {
  'Very High': 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  High: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  Medium: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  Low: 'bg-text-muted/15 text-text-muted',
};

const STATUS_STYLES = {
  Customer: 'text-emerald-700 dark:text-emerald-300',
  Prospect: 'text-purple-700 dark:text-purple-300',
  'At Risk': 'text-danger',
  Lost: 'text-text-muted',
};

const COLUMNS = [
  { id: 'name', label: 'Account', sortable: true, sortKey: (r) => r.name },
  { id: 'tier', label: 'Tier', sortable: true, sortKey: (r) => r.tier },
  { id: 'intent', label: 'Intent', sortable: true, sortKey: (r) => r.intentScore, align: 'center' },
  { id: 'arr', label: 'ARR', sortable: true, sortKey: (r) => r.arr, align: 'right' },
  { id: 'lastTouch', label: 'Last touch', sortable: true, sortKey: (r) => r.lastTouchDays ?? 9999 },
  { id: 'whyNow', label: 'Why now', sortable: false },
  { id: 'action', label: 'Action', sortable: false },
];

function FilterPanel({ initialFilters = [], onApply }) {
  const [selections, setSelections] = useState(() => {
    const map = {};
    for (const f of initialFilters) map[f.id] = f.value;
    return map;
  });

  const setSelection = (id, value) => {
    setSelections((s) => ({ ...s, [id]: s[id] === value ? null : value }));
  };

  const apply = () => {
    const filters = Object.entries(selections)
      .filter(([, v]) => v != null)
      .map(([id, value]) => ({
        id,
        label: TRIAGE_FILTERS[id].label,
        value,
      }));
    onApply(filters);
  };

  const reset = () => setSelections({});

  return (
    <div className="bg-bg/40 border border-border rounded-md p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
          <SlidersHorizontal size={12} />
          Refine with filters
        </div>
        <button
          onClick={reset}
          className="text-[10px] text-text-muted hover:text-text-secondary transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        {Object.entries(TRIAGE_FILTERS).map(([key, group]) => (
          <div key={key}>
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
              {group.label}
            </div>
            <div className="flex flex-wrap gap-1">
              {group.options.map((opt) => {
                const selected = selections[key] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setSelection(key, opt)}
                    className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                      selected
                        ? 'bg-primary/15 border-primary/40 text-primary'
                        : 'bg-surface border-border text-text-secondary hover:border-border-2'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
        <button
          onClick={apply}
          className="px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors flex items-center gap-1.5"
        >
          <Filter size={11} />
          Apply
        </button>
      </div>
    </div>
  );
}

function IntentBadge({ intent, score }) {
  const cls = INTENT_STYLES[intent] || INTENT_STYLES.Low;
  const isHot = intent === 'Very High' || intent === 'High';
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${cls}`}>
      {isHot ? <Zap size={9} /> : <ZapOff size={9} />}
      {intent}
    </span>
  );
}

export default function LiveAccountTriageList({
  variant = 'default',
  expandedFilters = false,
  onPin,
}) {
  const { showToast } = useToast();
  const { openCompany } = useCompanyDetail();
  const [filtersOpen, setFiltersOpen] = useState(expandedFilters);
  const [activeFilters, setActiveFilters] = useState(() => TRIAGE_VARIANTS[variant]?.activeFilters || []);
  const [variantKey, setVariantKey] = useState(variant);
  const [sort, setSort] = useState({ col: 'whyNow', dir: 'desc' });
  const [recomputing, setRecomputing] = useState(false);

  const data = TRIAGE_VARIANTS[variantKey] || TRIAGE_VARIANTS.default;

  const accountObjs = useMemo(() => {
    const map = new Map(JORDAN_BOOK.map((a) => [a.id, a]));
    let rows = data.accounts.map((id) => map.get(id)).filter(Boolean);
    const col = COLUMNS.find((c) => c.id === sort.col);
    if (col?.sortKey) {
      rows = [...rows].sort((a, b) => {
        const av = col.sortKey(a);
        const bv = col.sortKey(b);
        if (typeof av === 'number') return sort.dir === 'asc' ? av - bv : bv - av;
        return sort.dir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    } else {
      // Default — preserve the order in the variant (which is already AI-ranked by score)
      rows = data.accounts.map((id) => map.get(id)).filter(Boolean);
    }
    return rows;
  }, [data, sort]);

  const handleSort = (colId) => {
    const col = COLUMNS.find((c) => c.id === colId);
    if (!col?.sortable) return;
    setSort((s) => (s.col === colId ? { col: colId, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col: colId, dir: 'desc' }));
  };

  const removeFilter = (filter) => {
    showToast(`Filter removed: ${filter.label} = ${filter.value}`, 'info');
    setActiveFilters((prev) => prev.filter((f) => f.id !== filter.id));
    // Roll back to default if all filters removed
    setVariantKey('default');
  };

  const applyFilters = (filters) => {
    setActiveFilters(filters);
    setRecomputing(true);
    setFiltersOpen(false);
    setTimeout(() => {
      // Pick variant based on what filters were applied
      const hasLastTouchAndRenewal =
        filters.find((f) => f.id === 'lastTouch') && filters.find((f) => f.id === 'renewalWindow');
      const hasRenewalOnly =
        !filters.find((f) => f.id === 'lastTouch') && filters.find((f) => f.id === 'renewalWindow');
      if (hasLastTouchAndRenewal) setVariantKey('staleHighValue');
      else if (hasRenewalOnly) setVariantKey('renewalsOnly');
      else setVariantKey('default');
      setRecomputing(false);
      showToast(`Re-ranked with ${filters.length} filter${filters.length !== 1 ? 's' : ''}`);
    }, 700);
  };

  return (
    <LiveFrame
      title={data.title}
      subtitle="Ranked by AI across signal strength, deal stage, recency, and ICP fit. Sortable in conversation: try saying 'sort by intent' or 'show only renewals'."
      onPin={onPin}
      footer={`${accountObjs.length} of 247 accounts in your book · ${activeFilters.length} filter${activeFilters.length !== 1 ? 's' : ''} active`}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {activeFilters.length === 0 ? (
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
              No filters · ranked by score
            </span>
          ) : (
            <>
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                Active filters
              </span>
              {activeFilters.map((f) => (
                <FilterChip
                  key={f.id}
                  label={f.label}
                  value={f.value}
                  onRemove={() => removeFilter(f)}
                />
              ))}
            </>
          )}
        </div>
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-border rounded text-text-secondary hover:bg-bg/40 hover:text-text-primary transition-colors"
        >
          <SlidersHorizontal size={11} />
          {filtersOpen ? 'Hide filters' : 'Refine with filters'}
          {filtersOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      {filtersOpen && (
        <FilterPanel initialFilters={activeFilters} onApply={applyFilters} />
      )}

      {recomputing ? (
        <div className="py-12 flex items-center justify-center gap-2 text-xs text-text-secondary">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Re-ranking accounts...
        </div>
      ) : (
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
                              sort.dir === 'asc' ? (
                                <ArrowUp size={10} />
                              ) : (
                                <ArrowDown size={10} />
                              )
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
                {accountObjs.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => openCompany(a.id)}
                    className="border-t border-border hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Building2 size={12} className="text-text-muted flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-text-primary font-medium truncate">{a.name}</div>
                          <div className="text-[10px] text-text-muted truncate">{a.industry}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-text-secondary">{a.tier}</div>
                      <div className={`text-[10px] ${STATUS_STYLES[a.status] || ''}`}>{a.status}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <IntentBadge intent={a.intent} score={a.intentScore} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-text-primary whitespace-nowrap">
                      {a.arrLabel}
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                      {a.lastTouchLabel}
                      {a.renewalIn && (
                        <div className="text-[10px] text-warning mt-0.5">Renewal in {a.renewalIn}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 max-w-[280px]">
                      <div className="text-text-primary leading-snug">{a.whyNow}</div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(`Opening: ${a.primaryAction} · ${a.name}`, 'info');
                        }}
                        className="text-primary hover:text-white hover:bg-primary px-2 py-1 rounded text-[11px] font-medium transition-colors"
                      >
                        {a.primaryAction} →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 mt-3 p-3 bg-primary/5 border border-primary/15 rounded-md">
        <Lightbulb size={12} className="text-primary mt-0.5 flex-shrink-0" />
        <div className="text-xs text-text-secondary leading-relaxed">{data.aiNote}</div>
      </div>
    </LiveFrame>
  );
}
