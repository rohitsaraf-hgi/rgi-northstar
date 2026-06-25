// WorkbookRoutingRoute — admin-only bulk routing screen scoped to a
// single workbook. Lives at /admin/territory/workbook/:workbookId.
//
// Why this exists: in no-CRM mode, admins push Market Analyzer segments
// into Sales Co-Pilot as workbooks. A 500-row segment lands with most
// rows as net-new (no ownerSellerId). The bulk routing flow here lets
// the admin clear the backlog without clicking 500 times.
//
// What you can do here:
//   - See progress (X of Y routed)
//   - Filter to needs-routing
//   - Select rows + bulk-assign to one seller
//   - Auto-route — round-robin across a chosen team, or by region/industry
//   - Per-row reassign (same SellerPicker as the inline cell)

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Users as UsersIcon,
  Filter,
  Globe,
  Building2,
  RotateCw,
  X,
} from 'lucide-react';
import {
  getWorkbook,
  resolveWorkbookRows,
  bulkAssignWorkbookRows,
  autoRouteWorkbookRows,
  assignWorkbookRowOwner,
  getWorkbookRoutingSummary,
  subscribeWorkbookChanges,
  WORKBOOK_KINDS,
} from '../data/workbooks.js';
import { listSellers, getSeller } from '../data/territoryDesign.js';
import { useToast } from '../context/ToastContext.jsx';
import SellerPicker from '../components/workbook/SellerPicker.jsx';

function OwnerCell({ ownerSellerId, onClick }) {
  const seller = ownerSellerId ? getSeller(ownerSellerId) : null;
  if (!seller) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-amber-500/30 bg-amber-500/5 text-[11px] text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 transition-colors"
      >
        <AlertTriangle size={10} /> Unassigned
      </button>
    );
  }
  const initials = (seller.name || '?')
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-border bg-bg/40 hover:bg-surface-2 transition-colors text-left max-w-full"
    >
      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-semibold flex items-center justify-center flex-shrink-0">
        {initials}
      </span>
      <span className="text-[11px] font-medium text-text-primary truncate">{seller.name}</span>
    </button>
  );
}

function AutoRouteMenu({ workbookId, sellers, onApplied }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const accountOwners = sellers.filter((s) => s.role === 'account_owner');
  const csms = sellers.filter((s) => s.role === 'csm');

  const apply = (rule, label) => {
    const result = autoRouteWorkbookRows(workbookId, rule);
    setOpen(false);
    onApplied?.({ ...result, label });
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim"
      >
        <Sparkles size={11} /> Auto-route
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-[320px] bg-bg border border-border rounded-md shadow-elev z-40 overflow-hidden">
          <div className="px-3 py-2 border-b border-border text-[10px] uppercase tracking-wider font-semibold text-text-muted">
            Apply a rule to all unassigned rows
          </div>
          <button
            onClick={() =>
              apply(
                { type: 'round_robin', sellerIds: accountOwners.map((s) => s.id) },
                `Round-robin across ${accountOwners.length} Account Owners`,
              )
            }
            disabled={accountOwners.length === 0}
            className="w-full text-left px-3 py-2 hover:bg-surface-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-start gap-2.5"
          >
            <RotateCw size={12} className="text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-text-primary">Round-robin · Account Owners</div>
              <div className="text-[10px] text-text-muted">
                Distribute evenly across {accountOwners.length} sellers.
              </div>
            </div>
          </button>
          <button
            onClick={() =>
              apply(
                { type: 'round_robin', sellerIds: csms.map((s) => s.id) },
                `Round-robin across ${csms.length} CSMs`,
              )
            }
            disabled={csms.length === 0}
            className="w-full text-left px-3 py-2 hover:bg-surface-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-start gap-2.5 border-t border-border/40"
          >
            <RotateCw size={12} className="text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-text-primary">Round-robin · CSMs</div>
              <div className="text-[10px] text-text-muted">
                Spread net-new across {csms.length} CSMs evenly.
              </div>
            </div>
          </button>
          <button
            onClick={() => {
              const mapping = {};
              for (const s of accountOwners) {
                if (s.region && !mapping[s.region]) mapping[s.region] = s.id;
              }
              apply(
                { type: 'by_region', mapping, fallbackSellerId: accountOwners[0]?.id || null },
                `Routed by region (${Object.keys(mapping).length} regions mapped)`,
              );
            }}
            disabled={accountOwners.length === 0}
            className="w-full text-left px-3 py-2 hover:bg-surface-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-start gap-2.5 border-t border-border/40"
          >
            <Globe size={12} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-text-primary">By region</div>
              <div className="text-[10px] text-text-muted">
                Match row's region to an Account Owner's territory.
              </div>
            </div>
          </button>
          <button
            onClick={() => {
              // Mock industry mapping — first Account Owner per industry seen
              const mapping = {};
              for (const s of accountOwners) {
                // Naïve — in production this maps to seller's named industries
                if (!mapping['Banking and Financial Services'] && (s.region || '').includes('East'))
                  mapping['Banking and Financial Services'] = s.id;
                if (!mapping['Healthcare and Life Sciences'] && (s.region || '').includes('West'))
                  mapping['Healthcare and Life Sciences'] = s.id;
                if (!mapping['Manufacturing']) mapping['Manufacturing'] = s.id;
              }
              apply(
                { type: 'by_industry', mapping, fallbackSellerId: accountOwners[0]?.id || null },
                `Routed by industry (${Object.keys(mapping).length} industries mapped)`,
              );
            }}
            disabled={accountOwners.length === 0}
            className="w-full text-left px-3 py-2 hover:bg-surface-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-start gap-2.5 border-t border-border/40"
          >
            <Building2 size={12} className="text-violet-700 dark:text-violet-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-text-primary">By industry</div>
              <div className="text-[10px] text-text-muted">
                Map verticals to Account Owners (configurable in Routing & Rules).
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default function WorkbookRoutingRoute() {
  const { workbookId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState('unassigned'); // unassigned | all | byOwner
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkPickerOpen, setBulkPickerOpen] = useState(false);
  const [rowPickerFor, setRowPickerFor] = useState(null);

  // Re-render on workbook mutations.
  useEffect(() => {
    return subscribeWorkbookChanges(() => setTick((t) => t + 1));
  }, []);

  const workbook = useMemo(() => getWorkbook(workbookId), [workbookId, tick]);
  const summary = useMemo(() => getWorkbookRoutingSummary(workbookId), [workbookId, tick]);
  const sellers = useMemo(() => listSellers(), [tick]);
  const rows = useMemo(() => (workbook ? resolveWorkbookRows(workbook) : []), [workbook, tick]);

  if (!workbook) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={20} className="mx-auto text-text-muted mb-2" />
          <div className="text-sm font-semibold text-text-primary mb-1">Workbook not found</div>
          <Link to="/admin/territory" className="text-xs text-primary hover:underline">
            ← Back to Territory Design
          </Link>
        </div>
      </div>
    );
  }

  // Routing is only meaningful for PROMOTED_SEGMENT + CUSTOM_CSV.
  // ICP Match / CRM Accounts / Book of Accounts derive ownership upstream.
  const isRoutable =
    workbook.kind === WORKBOOK_KINDS.PROMOTED_SEGMENT ||
    workbook.kind === WORKBOOK_KINDS.CUSTOM_CSV;

  const visibleRows = rows.filter((r) => {
    if (filter === 'unassigned') return !r.ownerSellerId;
    return true;
  });

  const allSelectedOnPage = visibleRows.length > 0 && visibleRows.every((r) => selectedIds.has(r.id || r.url));
  const toggleAll = () => {
    if (allSelectedOnPage) {
      setSelectedIds(new Set());
    } else {
      const next = new Set();
      for (const r of visibleRows) next.add(r.id || r.url);
      setSelectedIds(next);
    }
  };
  const toggleRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkPick = (sellerId) => {
    const result = bulkAssignWorkbookRows(workbookId, {
      rowIds: Array.from(selectedIds),
      ownerSellerId: sellerId,
    });
    setBulkPickerOpen(false);
    setSelectedIds(new Set());
    const sellerName = sellerId ? getSeller(sellerId)?.name || sellerId : 'Unassigned';
    showToast(`${result.updated} accounts → ${sellerName}`, 'success');
  };

  const handleRowPick = (sellerId) => {
    if (!rowPickerFor) return;
    assignWorkbookRowOwner(workbookId, rowPickerFor.id, sellerId);
    setRowPickerFor(null);
  };

  const handleAutoRouteApplied = ({ updated, skipped, label }) => {
    if (typeof updated === 'undefined') {
      showToast('Auto-route failed — no rule applied', 'error');
      return;
    }
    showToast(
      `${label} · ${updated} routed${skipped ? ` · ${skipped} skipped (no rule match)` : ''}`,
      'success',
    );
  };

  const totalRows = rows.length;
  const routed = summary?.totalRows ? summary.totalRows - summary.unassigned : 0;
  const progressPct = totalRows ? Math.round((routed / totalRows) * 100) : 0;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-6 py-5">
        {/* Breadcrumb + back */}
        <div className="mb-3">
          <button
            onClick={() => navigate('/admin/territory')}
            className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors mb-2"
          >
            <ArrowLeft size={11} /> Territory Design
          </button>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">
            Workbook routing · {workbook.kind === WORKBOOK_KINDS.PROMOTED_SEGMENT ? 'Promoted segment' : 'Custom CSV'}
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">
            Route accounts in <span className="text-primary">{workbook.name}</span>
          </h1>
          {workbook.sourceSegmentName && (
            <div className="mt-1 text-xs text-text-secondary">
              Sourced from Market Analyzer · {workbook.sourceSegmentName}
            </div>
          )}
        </div>

        {!isRoutable ? (
          <div className="bg-surface border border-border rounded-md p-6">
            <div className="text-sm font-semibold text-text-primary mb-1">
              This workbook isn't routable
            </div>
            <p className="text-[12px] text-text-secondary">
              Ownership for {workbook.name} is derived from {workbook.kind === WORKBOOK_KINDS.CRM_ACCOUNTS ? 'CRM' : 'the book of accounts'}.
              Routing only applies to Promoted Segment and Custom CSV workbooks in no-CRM mode.
            </p>
          </div>
        ) : (
          <>
            {/* Progress strip */}
            <div className="bg-surface border border-border rounded-md p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Layers size={13} className="text-primary" />
                  <span className="text-sm font-semibold text-text-primary">
                    {routed} of {totalRows} routed
                  </span>
                  <span className="text-[11px] text-text-muted">·</span>
                  <span className="text-[11px] text-text-muted">
                    {summary?.unassigned || 0} still need an owner
                  </span>
                </div>
                <div className="text-[11px] font-mono text-text-muted">{progressPct}%</div>
              </div>
              <div className="h-1.5 bg-bg/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {summary?.byOwner?.length > 0 && (
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mr-1">
                    Routed to:
                  </span>
                  {summary.byOwner.map(({ sellerId, count }) => {
                    const s = getSeller(sellerId);
                    return (
                      <span
                        key={sellerId}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-bg/40 text-[11px] text-text-secondary"
                      >
                        <span className="font-medium text-text-primary">{s?.name || sellerId}</span>
                        <span className="text-text-muted">·</span>
                        <span className="font-mono">{count}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter size={11} className="text-text-muted" />
                <div className="inline-flex rounded-md border border-border overflow-hidden">
                  <button
                    onClick={() => {
                      setFilter('unassigned');
                      setSelectedIds(new Set());
                    }}
                    className={`px-3 py-1.5 text-[11px] font-medium ${
                      filter === 'unassigned'
                        ? 'bg-primary text-white'
                        : 'bg-bg text-text-secondary hover:bg-surface-2'
                    }`}
                  >
                    Needs routing ({summary?.unassigned || 0})
                  </button>
                  <button
                    onClick={() => {
                      setFilter('all');
                      setSelectedIds(new Set());
                    }}
                    className={`px-3 py-1.5 text-[11px] font-medium border-l border-border ${
                      filter === 'all'
                        ? 'bg-primary text-white'
                        : 'bg-bg text-text-secondary hover:bg-surface-2'
                    }`}
                  >
                    All ({totalRows})
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <>
                    <span className="text-[11px] text-text-muted">
                      {selectedIds.size} selected
                    </span>
                    <button
                      onClick={() => setBulkPickerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border bg-bg hover:bg-surface-2 text-text-primary rounded-md"
                    >
                      <UsersIcon size={11} /> Assign selected to…
                    </button>
                  </>
                )}
                <AutoRouteMenu
                  workbookId={workbookId}
                  sellers={sellers}
                  onApplied={handleAutoRouteApplied}
                />
              </div>
            </div>

            {/* Rows table */}
            <div className="bg-surface border border-border rounded-md overflow-hidden">
              <div className="px-3 py-2 border-b border-border bg-bg/30 flex items-center gap-3 text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                <input
                  type="checkbox"
                  checked={allSelectedOnPage}
                  onChange={toggleAll}
                  className="w-3 h-3 rounded border-border"
                />
                <span className="w-[180px]">Account</span>
                <span className="w-[200px]">Industry</span>
                <span className="w-[100px]">Region</span>
                <span className="flex-1">Owner</span>
              </div>
              {visibleRows.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <CheckCircle2 size={20} className="mx-auto text-emerald-500 mb-2" />
                  <div className="text-sm font-semibold text-text-primary mb-1">
                    {filter === 'unassigned' ? 'All accounts routed' : 'No rows in this workbook'}
                  </div>
                  <div className="text-[11px] text-text-muted">
                    {filter === 'unassigned'
                      ? 'Every account in this workbook now has an owner. Sellers will see them on their Workbook.'
                      : 'This workbook is empty.'}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-border/40 max-h-[60vh] overflow-y-auto thin-scrollbar">
                  {visibleRows.map((r) => {
                    const key = r.id || r.url;
                    const checked = selectedIds.has(key);
                    return (
                      <div
                        key={key}
                        className={`px-3 py-2.5 flex items-center gap-3 hover:bg-surface-2 transition-colors ${
                          checked ? 'bg-primary/5' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRow(key)}
                          className="w-3 h-3 rounded border-border"
                        />
                        <div className="w-[180px] flex items-center gap-2 min-w-0">
                          <span
                            className="w-6 h-6 rounded text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: r.logoColor || '#6B7280' }}
                          >
                            {(r.name || '?').slice(0, 1).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[12px] font-medium text-text-primary truncate">
                              {r.name}
                            </div>
                            {r.url && (
                              <div className="text-[10px] text-text-muted truncate font-mono">
                                {r.url}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="w-[200px] text-[11px] text-text-secondary truncate">
                          {r.industry || '—'}
                        </span>
                        <span className="w-[100px] text-[11px] text-text-muted truncate">
                          {r.region || '—'}
                        </span>
                        <div className="flex-1">
                          <OwnerCell
                            ownerSellerId={r.ownerSellerId}
                            onClick={() => setRowPickerFor(r)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bulk picker — centered modal */}
      {bulkPickerOpen && (
        <SellerPicker
          currentOwnerId={null}
          onPick={handleBulkPick}
          onClose={() => setBulkPickerOpen(false)}
        />
      )}

      {/* Per-row picker — also centered modal for simplicity in this flow */}
      {rowPickerFor && (
        <SellerPicker
          currentOwnerId={rowPickerFor.ownerSellerId || null}
          onPick={handleRowPick}
          onClose={() => setRowPickerFor(null)}
        />
      )}
    </div>
  );
}
