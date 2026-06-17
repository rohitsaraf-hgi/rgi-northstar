import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowDown, ArrowUp, ExternalLink, Building2 } from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { useCompanyDetail } from '../../../context/CompanyDetailContext.jsx';
import { APAC_COMPANIES } from '../../../data/apacTamData.js';

const COLUMNS = [
  { id: 'name', label: 'Company', width: 'min-w-[150px]', sortable: true, sortKey: (r) => r.name },
  { id: 'country', label: 'Country', width: '', sortable: true, sortKey: (r) => r.country },
  { id: 'industry', label: 'Vertical', width: '', sortable: true, sortKey: (r) => r.industry },
  {
    id: 'employees',
    label: 'Employees',
    width: 'text-right',
    sortable: true,
    sortKey: (r) => parseInt(r.employees.replace(/[,]/g, ''), 10),
  },
  {
    id: 'revenue',
    label: 'Revenue',
    width: 'text-right',
    sortable: true,
    sortKey: (r) => parseFloat(r.revenue.replace(/[$,]/g, '').replace('B', '000').replace('M', '')),
  },
  {
    id: 'itSpend',
    label: 'IT Spend',
    width: 'text-right',
    sortable: true,
    sortKey: (r) => parseFloat(r.itSpend.replace(/[$,]/g, '').replace('B', '000').replace('M', '')),
  },
  { id: 'competitor', label: 'Competitor', width: '', sortable: false },
  { id: 'opportunity', label: 'Opportunity', width: '', sortable: false },
];

const OPPORTUNITY_STYLES = {
  Customer: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  'Prospect Whitespace': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  'Expansion Whitespace': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
};

const COMPETITOR_COLORS = {
  ZoomInfo: 'text-amber-700 dark:text-amber-300',
  'Apollo.io': 'text-blue-700 dark:text-blue-300',
  '6sense': 'text-purple-700 dark:text-purple-300',
  Demandbase: 'text-emerald-700 dark:text-emerald-300',
  None: 'text-text-muted',
};

const FILTER_OPTIONS = {
  opportunity: ['All', 'Prospect Whitespace', 'Expansion Whitespace', 'Customer'],
  country: ['All', 'Australia', 'Singapore', 'Japan', 'India', 'Hong Kong', 'Indonesia'],
};

export default function LiveCompanyList({ initialFilter = 'All', initialCountry = 'All', onPin }) {
  const [opportunityFilter, setOpportunityFilter] = useState(initialFilter);
  const [countryFilter, setCountryFilter] = useState(initialCountry);
  const [sort, setSort] = useState({ col: 'revenue', dir: 'desc' });
  const { showToast } = useToast();
  const { openCompany } = useCompanyDetail();

  const rows = useMemo(() => {
    let data = APAC_COMPANIES;
    if (opportunityFilter !== 'All') {
      data = data.filter((r) => r.opportunity === opportunityFilter);
    }
    if (countryFilter !== 'All') {
      data = data.filter((r) => r.country === countryFilter);
    }
    const col = COLUMNS.find((c) => c.id === sort.col);
    if (col?.sortKey) {
      data = [...data].sort((a, b) => {
        const av = col.sortKey(a);
        const bv = col.sortKey(b);
        if (typeof av === 'number') return sort.dir === 'asc' ? av - bv : bv - av;
        return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return data;
  }, [opportunityFilter, countryFilter, sort]);

  const handleSort = (colId) => {
    const col = COLUMNS.find((c) => c.id === colId);
    if (!col?.sortable) return;
    setSort((s) =>
      s.col === colId ? { col: colId, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col: colId, dir: 'desc' }
    );
  };

  return (
    <LiveFrame
      title="APAC SOM — Companies"
      subtitle={`${rows.length} of ${APAC_COMPANIES.length} companies match the current filters. Click any column header to sort, or change the filters above.`}
      onPin={onPin}
      footer="Sortable in conversation: try saying 'sort by IT spend' or 'show only Australia'"
    >
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
          Filter
        </span>
        <select
          value={opportunityFilter}
          onChange={(e) => setOpportunityFilter(e.target.value)}
          className="px-2 py-1 bg-bg border border-border rounded text-xs text-text-primary focus:outline-none focus:border-primary/40"
        >
          {FILTER_OPTIONS.opportunity.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="px-2 py-1 bg-bg border border-border rounded text-xs text-text-primary focus:outline-none focus:border-primary/40"
        >
          {FILTER_OPTIONS.country.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        {(opportunityFilter !== 'All' || countryFilter !== 'All') && (
          <button
            onClick={() => {
              setOpportunityFilter('All');
              setCountryFilter('All');
            }}
            className="text-[10px] text-text-muted hover:text-text-secondary transition-colors"
          >
            Clear
          </button>
        )}
      </div>

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
                      className={`text-left px-3 py-2 font-medium text-text-muted uppercase text-[10px] tracking-wider whitespace-nowrap ${
                        c.sortable ? 'cursor-pointer hover:text-text-primary' : ''
                      } ${c.width}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        {c.sortable && (
                          isSorted ? (
                            sort.dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                          ) : (
                            <ArrowUpDown size={10} className="opacity-30" />
                          )
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => openCompany(r.id)}
                  className="border-t border-border hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Building2 size={12} className="text-text-muted flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-text-primary font-medium truncate">{r.name}</div>
                        <div className="text-[10px] text-text-muted truncate">{r.url}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-text-secondary whitespace-nowrap">{r.country}</td>
                  <td className="px-3 py-2 text-text-secondary whitespace-nowrap">{r.industry}</td>
                  <td className="px-3 py-2 text-right font-mono text-text-primary whitespace-nowrap">{r.employees}</td>
                  <td className="px-3 py-2 text-right font-mono text-text-primary whitespace-nowrap">{r.revenue}</td>
                  <td className="px-3 py-2 text-right font-mono text-text-secondary whitespace-nowrap">{r.itSpend}</td>
                  <td className={`px-3 py-2 whitespace-nowrap ${COMPETITOR_COLORS[r.competitor] || 'text-text-secondary'}`}>
                    {r.competitor}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded border text-[10px] font-medium ${
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
          {rows.length === 0 && (
            <div className="text-center py-8 text-xs text-text-muted">
              No companies match the current filters.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-[10px] text-text-muted">{rows.length} of {APAC_COMPANIES.length} shown · click any row to drill in</div>
        <button
          onClick={() => showToast('Exported to Salesforce as "APAC Whitespace — Q2 2026"')}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-primary hover:bg-primary/10 rounded transition-colors"
        >
          <ExternalLink size={10} />
          Export to Salesforce
        </button>
      </div>
    </LiveFrame>
  );
}
