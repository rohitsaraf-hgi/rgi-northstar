import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowDown, ArrowUp, Filter, Pin, Sparkles, BookmarkPlus } from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import LiveCoachNote from './LiveCoachNote.jsx';
import { TAM_SAM_SOM_WHITESPACE } from '../../../data/tamSamSomData.js';
import { useToast } from '../../../context/ToastContext.jsx';

const OPPORTUNITY_STYLES = {
  Customer: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'Expansion Whitespace': 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  'Prospect Whitespace': 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'expansion', label: 'Expansion only', match: 'Expansion Whitespace' },
  { id: 'prospect', label: 'Prospect only', match: 'Prospect Whitespace' },
  { id: 'customer', label: 'Customers' },
];

export default function LiveTamSamSomWhitespaceList({ onPin, showSaveAction, onSave }) {
  const { showToast } = useToast();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('itSpend');
  const [sortDir, setSortDir] = useState('desc');

  const data = TAM_SAM_SOM_WHITESPACE;

  const filtered = useMemo(() => {
    let rows = [...data.companies];
    if (filter === 'expansion') rows = rows.filter((r) => r.opportunity === 'Expansion Whitespace');
    if (filter === 'prospect') rows = rows.filter((r) => r.opportunity === 'Prospect Whitespace');
    if (filter === 'customer') rows = rows.filter((r) => r.opportunity === 'Customer');
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      const av = parseFloat(String(a[sortBy]).replace(/[$,KMB]/g, ''));
      const bv = parseFloat(String(b[sortBy]).replace(/[$,KMB]/g, ''));
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return rows;
  }, [filter, search, sortBy, sortDir, data.companies]);

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

  return (
    <LiveFrame
      title="Whitespace company list"
      subtitle="Each row classifies whether the company is already a customer, an expansion target (subsidiary of one), or net-new prospect whitespace."
      onPin={onPin}
      footer={`${filtered.length} of ${data.totals.all} organizations · ${data.totals.customer} customers · ${data.totals.expansion} expansion · ${data.totals.prospect} prospect`}
    >
      <LiveCoachNote
        tone="win"
        headline="Three distinct plays in this list — sequence them."
        body={`Customers (${data.totals.customer}): expansion conversations — Apple, Microsoft, Nvidia, etc. are already buying. Run renewal-readiness here.\n\nExpansion Whitespace (${data.totals.expansion}): subsidiaries of customers (e.g., Alphabet → Google). Warm intros, fastest closes.\n\nProspect Whitespace (${data.totals.prospect}): true net-new logos. Slowest but biggest opportunity. Sort by IT spend to prioritize.`}
        more={[
          'JPMorgan Chase ($16.9B IT spend) is the largest prospect-whitespace target — and Palo Alto is already incumbent there. That makes it a high-value displacement, not a clean entry. Plan accordingly.',
          'Mastercard and Visa are clean (no Palo Alto) prospect-whitespace plays — easier entry than displacement, but still enterprise-cycle.',
        ]}
        className="mb-3"
      />
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1 px-2 py-1 bg-bg/40 border border-border rounded text-xs flex-1 max-w-xs">
          <Search size={11} className="text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company…"
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                filter === f.id
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-bg/40 border-border text-text-secondary hover:border-border-2'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => showToast('Top 20 pinned to a new list', 'success')}
          className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-[11px] text-text-secondary hover:text-text-primary border border-border rounded hover:border-border-2"
        >
          <Pin size={10} />
          Pin top 20
        </button>
        {showSaveAction && onSave && (
          <button
            onClick={() => onSave({ count: filtered.length })}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-primary text-white rounded hover:bg-primary-dim transition-colors font-medium"
          >
            <BookmarkPlus size={10} />
            Save list to thread
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-bg/40 text-text-muted">
            <tr>
              <th className="text-left px-2 py-1.5 font-semibold">Company</th>
              <th className="text-left px-2 py-1.5 font-semibold">URL</th>
              <th className="text-left px-2 py-1.5 font-semibold">Country</th>
              <th
                className="text-right px-2 py-1.5 font-semibold cursor-pointer"
                onClick={() => toggleSort('employees')}
              >
                <span className="inline-flex items-center gap-1">
                  Employees <SortIcon col="employees" />
                </span>
              </th>
              <th
                className="text-right px-2 py-1.5 font-semibold cursor-pointer"
                onClick={() => toggleSort('revenue')}
              >
                <span className="inline-flex items-center gap-1">
                  Revenue <SortIcon col="revenue" />
                </span>
              </th>
              <th
                className="text-right px-2 py-1.5 font-semibold cursor-pointer"
                onClick={() => toggleSort('itSpend')}
              >
                <span className="inline-flex items-center gap-1">
                  IT Spend <SortIcon col="itSpend" />
                </span>
              </th>
              <th className="text-left px-2 py-1.5 font-semibold">Competitor</th>
              <th className="text-left px-2 py-1.5 font-semibold">Opportunity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-bg/40">
                <td className="px-2 py-1.5 font-medium text-text-primary truncate max-w-[180px]">{r.name}</td>
                <td className="px-2 py-1.5 text-text-secondary font-mono text-[11px]">{r.url}</td>
                <td className="px-2 py-1.5 text-text-secondary text-[11px]">{r.country}</td>
                <td className="px-2 py-1.5 text-right font-mono text-text-secondary">{r.employees}</td>
                <td className="px-2 py-1.5 text-right font-mono text-text-secondary">{r.revenue}</td>
                <td className="px-2 py-1.5 text-right font-mono text-text-secondary">{r.itSpend}</td>
                <td className="px-2 py-1.5 text-text-secondary text-[11px] truncate max-w-[140px]">{r.competitor}</td>
                <td className="px-2 py-1.5">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                      OPPORTUNITY_STYLES[r.opportunity] || ''
                    }`}
                  >
                    {r.opportunity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LiveFrame>
  );
}
