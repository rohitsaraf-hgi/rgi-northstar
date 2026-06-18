import { useEffect, useMemo, useState, useRef } from 'react';
// useRef already imported
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  Package,
  ChevronDown,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Star,
  X,
  Send,
  CircleDot,
  Layers,
  Wand2,
  Swords,
  ArrowRight,
  Table as TableIcon,
  Filter,
  ChevronRight,
  BookOpen,
  Globe,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Building2,
  Upload,
  Database,
  Plug,
  Save,
} from 'lucide-react';
import { usePersona } from '../context/PersonaContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import SetupCoach from '../components/onboarding/SetupCoach.jsx';
import { getCoverageStats } from '../data/territoryDesign.js';
import { getCoachState, subscribeCoach, setCoachExpanded, restoreCoach } from '../data/onboardingCoach.js';
import WorkbookSegmented from '../components/workbook/WorkbookSegmented.jsx';
import SellerWorkbookTable from '../components/workbook/SellerWorkbookTable.jsx';
import IcpPill from '../components/workbook/IcpPill.jsx';
import FilterPanel from '../components/workbook/FilterPanel.jsx';
import { buildPredicates } from '../data/filterRegistry.js';
import { useToast } from '../context/ToastContext.jsx';
import { getAccountsForOwner, SIGNAL_TYPES } from '../data/accounts.js';
import { listOfferings, getOffering, ALL_OFFERINGS_LENS } from '../data/offerings.js';
import { getFitFor, getAllFitFor, tierForScore } from '../data/accountOfferingFit.js';

// Wizard-saved offerings carry ids like `wiz-cnapp` whose fit data lives
// under the canonical key (`cnapp`). resolveFitScore tries the id first,
// then the offering's `key`, then a fallback for product lines that don't
// have a dedicated FITS entry (code → dspm, cdr → workload). Mirrors the
// behavior of WorkbookSegmented's `resolveFit` so flat view doesn't drop
// every row when the lens is set to a wizard-saved offering.
const OFFERING_KEY_FALLBACKS = { code: 'dspm', cdr: 'workload' };
function resolveFitScore(accountId, offeringIdOrKey, offeringRegistry) {
  if (!offeringIdOrKey || offeringIdOrKey === 'all') return null;
  const offering = offeringRegistry?.find((o) => o.id === offeringIdOrKey) || null;
  const keys = [offeringIdOrKey, offering?.key, OFFERING_KEY_FALLBACKS[offering?.key]];
  const tried = new Set();
  for (const k of keys) {
    if (!k || tried.has(k)) continue;
    tried.add(k);
    const f = getFitFor(accountId, k);
    if (f && f.score != null) return f;
  }
  return null;
}
import { SIGNAL_KINDS, SIGNAL_KIND_BY_ID } from '../data/sellerHomeFilters.js';
import {
  RGIF_CATEGORIES,
  RGIF_CATEGORY_BY_ID,
  valueFor,
  buildInsight,
  getRGIF,
} from '../data/workbookRGIF.js';
import {
  readViews,
  subscribeViews,
  getView,
  getDefaultView,
  saveCurrentAsNewView,
  updateViewFilters,
  setDefaultView,
  deleteView,
  addEnrichedColumn,
  removeColumn,
  listViewsBySource,
  BUILTIN_COLUMNS,
} from '../data/workbookViews.js';
import {
  listAvailableWhitespace,
  listAddedFromWhitespace,
  isAccountAdded,
  markAccountAdded,
  subscribeAdded,
} from '../data/whitespaceAccounts.js';
import {
  getIntegrationGovernance,
  isAgentAccessEnabled,
  setIntegrationGovernance,
} from '../data/integrationGovernance.js';
import {
  getUnifiedAccounts,
  getUnifiedCounts,
  filterByTab,
  SOURCE_BADGE,
} from '../data/unifiedWorkbook.js';
import { getPlay, MOTION_LABELS } from '../data/plays.js';

// ----- Helpers -----

function ToneDot({ tone }) {
  const cls =
    tone === 'good'
      ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
      : tone === 'amber'
      ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
      : tone === 'red'
      ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]'
      : 'bg-text-muted';
  return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cls}`} />;
}

function ScoreCell({ score }) {
  if (score == null) return <span className="text-text-muted text-xs">—</span>;
  const cls =
    score >= 75 ? 'text-emerald-700 dark:text-emerald-300' : score >= 40 ? 'text-amber-700 dark:text-amber-300' : 'text-text-muted';
  return <span className={`text-sm font-mono font-semibold ${cls}`}>{score}</span>;
}

function TierBadge({ score }) {
  const tier = score == null ? null : tierForScore(score);
  if (!tier) return <span className="text-[10px] text-text-muted font-mono">—</span>;
  return (
    <div className={`w-9 h-9 rounded-full flex flex-col items-center justify-center border-2 ${tier.bg} ${tier.color} ${tier.border}`}>
      <span className="text-[7px] font-bold uppercase tracking-wider leading-none">TIER</span>
      <span className="text-[10px] font-bold leading-none mt-0.5">{tier.label}</span>
    </div>
  );
}

// ----- Saved view picker -----

// Offering refine — single-select dropdown that narrows the table to a
// specific product's fit. Replaces the old multi-chip lens row. Locked when
// a sales play is active (play already pins offerings).
function OfferingRefine({ activeOfferingId, offerings, onChange, disabled = false }) {
  const active = offerings.find((o) => o.id === activeOfferingId);
  const label = active ? active.name : 'All offerings';
  return (
    <div className="relative">
      <select
        value={activeOfferingId}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`appearance-none pl-7 pr-7 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
          activeOfferingId !== 'all'
            ? 'bg-primary/10 text-primary border-primary/30'
            : 'bg-surface text-text-secondary border-border hover:text-text-primary'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={disabled ? 'Offering is set by the active sales play' : `Fit lens: ${label}`}
      >
        <option value="all">All offerings</option>
        {offerings.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <Package size={11} className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 ${activeOfferingId !== 'all' ? 'text-primary' : 'text-text-muted'}`} />
      <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted" />
    </div>
  );
}

// Source toggle — 4-tab unified source filter at top of workbook.
// All / Tenant Book / Whitespace / Needs Review.
function SourceToggle({ source, onChange, counts, isAdmin = false, bookEmpty = false }) {
  const tabs = [
    {
      id: 'all',
      label: 'All Companies',
      icon: Layers,
      count: counts.all,
      activeClasses: 'bg-text-primary/10 text-text-primary font-semibold',
      countActive: 'bg-text-primary/15 text-text-primary',
    },
    {
      id: 'book',
      label: isAdmin ? 'Tenant Book' : 'My Book',
      icon: BookOpen,
      count: counts.book,
      activeClasses: 'bg-primary/15 text-primary font-semibold',
      countActive: 'bg-primary/20 text-primary',
      disabled: bookEmpty,
      disabledTitle: 'Upload a CSV or connect a CRM to populate your Tenant Book',
    },
    {
      id: 'whitespace',
      label: 'Whitespace',
      icon: Globe,
      count: counts.whitespace,
      activeClasses: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold',
      countActive: 'bg-violet-500/20 text-violet-700 dark:text-violet-300',
    },
    {
      id: 'needs_review',
      label: 'Needs Review',
      icon: AlertCircle,
      count: counts.needsReview,
      activeClasses: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold',
      countActive: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
    },
  ];
  return (
    <div className="inline-flex items-center bg-surface border border-border rounded-md p-0.5 flex-wrap">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = source === t.id;
        return (
          <button
            key={t.id}
            onClick={() => !t.disabled && onChange(t.id)}
            disabled={t.disabled}
            title={t.disabled ? t.disabledTitle : undefined}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${
              isActive
                ? t.activeClasses
                : t.disabled
                ? 'text-text-muted cursor-not-allowed opacity-50'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon size={11} />
            {t.label}
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                isActive ? t.countActive : 'bg-surface-2 text-text-muted'
              }`}
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SavedViewPicker({ personaId, source, currentView, onChangeView, onSaveAs, onDelete, onSetDefault }) {
  const [open, setOpen] = useState(false);
  const [views, setViews] = useState(() => listViewsBySource(personaId, source));
  useEffect(() => subscribeViews(() => setViews(listViewsBySource(personaId, source))), [personaId, source]);
  useEffect(() => setViews(listViewsBySource(personaId, source)), [personaId, source]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface border border-border rounded-md hover:border-primary/30 transition-colors"
      >
        <TableIcon size={11} className="text-text-secondary" />
        <span className="font-semibold text-text-primary">{currentView.name}</span>
        {currentView.isDefault && <Star size={9} className="text-amber-500 fill-amber-500" />}
        <ChevronDown size={11} className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-surface border border-border rounded-md shadow-card z-30 w-80">
          <div className="px-3 py-2 border-b border-border bg-bg/40">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Saved views</div>
            <div className="text-[10px] text-text-muted mt-0.5">
              Filters + columns + sort. Per-rep persistence.
            </div>
          </div>
          <div className="divide-y divide-border/40 max-h-72 overflow-y-auto thin-scrollbar">
            {views.map((v) => {
              const isCurrent = v.id === currentView.id;
              return (
                <div key={v.id} className={`group ${isCurrent ? 'bg-primary/5' : ''}`}>
                  <button
                    onClick={() => {
                      onChangeView(v);
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-surface-2 flex items-center gap-2"
                  >
                    <TableIcon size={11} className={isCurrent ? 'text-primary' : 'text-text-muted'} />
                    <span className={`flex-1 text-xs font-medium truncate ${isCurrent ? 'text-primary' : 'text-text-primary'}`}>
                      {v.name}
                    </span>
                    {v.isDefault && <Star size={9} className="text-amber-500 fill-amber-500" />}
                    <span className="text-[10px] text-text-muted">
                      {v.columns.filter((c) => c.kind === 'enriched').length > 0
                        ? `${v.columns.filter((c) => c.kind === 'enriched').length} enriched`
                        : `${v.columns.length} cols`}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border px-2 py-2 flex items-center gap-1">
            <button
              onClick={() => {
                setOpen(false);
                onSaveAs();
              }}
              className="flex items-center gap-1 px-2 py-1 text-[10px] text-primary hover:bg-primary/5 rounded"
            >
              <Copy size={9} />
              Save current as new view…
            </button>
            {!currentView.isDefault && (
              <button
                onClick={() => {
                  onSetDefault(currentView.id);
                  setOpen(false);
                }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded ml-auto"
              >
                <Star size={9} />
                Set as default
              </button>
            )}
            {!currentView.isDefault && (
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.confirm(`Delete view "${currentView.name}"?`)) {
                    onDelete(currentView.id);
                    setOpen(false);
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-500/5 rounded"
              >
                <Trash2 size={9} />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ----- Save as modal -----

function SaveAsModal({ open, currentView, onClose, onSave }) {
  const [name, setName] = useState('');
  useEffect(() => {
    if (open) setName(`${currentView.name} — copy`);
  }, [open, currentView]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-bg border border-border rounded-md shadow-elev w-full max-w-md"
      >
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Save current view as…</h2>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            Captures all filters, columns, and sort settings. New view is private to you.
          </p>
        </div>
        <div className="px-5 py-4">
          <label className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block mb-1">
            View name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                onSave(name.trim());
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded text-text-primary focus:border-primary/40 focus:outline-none"
          />
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded">
            Cancel
          </button>
          <button
            onClick={() => onSave(name.trim())}
            disabled={!name.trim()}
            className="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save view
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ----- Whitespace preview drawer (slide-in from right) -----

function WhitespacePreviewDrawer({ account, lensOfferingId, onClose, onAddToBook }) {
  if (!account) return null;
  const isLensed = lensOfferingId !== 'all';
  const lensOffering = isLensed ? getOffering(lensOfferingId) : null;
  const primaryFit = isLensed ? getFitFor(account.id, lensOfferingId) : null;
  const allFits = getAllFitFor(account.id);
  const discovery = account.hgDiscoverySignal;
  const rgif = getRGIF(account.id);

  // Best-fit offering for "Open in lens" CTA default
  const sortedFits = Object.entries(allFits).sort((a, b) => (b[1].score ?? 0) - (a[1].score ?? 0));

  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex justify-end">
      <motion.div
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 24, opacity: 0 }}
        className="w-full max-w-xl bg-bg border-l border-border h-full overflow-y-auto thin-scrollbar shadow-elev"
      >
        {/* Header */}
        <div className="sticky top-0 bg-bg/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-start gap-3 z-10">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center text-white text-base font-bold flex-shrink-0"
            style={{ background: account.logoColor }}
          >
            {account.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-base font-semibold text-text-primary">{account.name}</h2>
              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                Whitespace
              </span>
            </div>
            <div className="text-[11px] text-text-secondary">{account.industry} · {account.fai.hq}</div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Why HG surfaced this */}
          {discovery && (
            <div className="bg-violet-500/5 border border-violet-500/30 rounded-md p-3">
              <div className="flex items-start gap-2">
                <Wand2 size={11} className="text-violet-700 dark:text-violet-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-violet-700 dark:text-violet-300 mb-1">
                    Why HG surfaced this
                  </div>
                  <div className="text-xs font-semibold text-text-primary mb-0.5">{discovery.headline}</div>
                  <div className="text-[11px] text-text-secondary leading-relaxed">{discovery.detail}</div>
                  <div className="text-[10px] text-text-muted mt-1.5 font-mono">Source: {discovery.hgSource}</div>
                </div>
              </div>
            </div>
          )}

          {/* Firmographics grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Revenue', value: account.fai.revenue },
              { label: 'Employees', value: account.fai.employees },
              { label: 'HQ', value: account.fai.hq },
              { label: 'Stage', value: account.fai.stage },
              { label: 'Cloud', value: account.cloud },
              { label: 'Incumbent', value: account.competitor },
            ].map((f) => (
              <div key={f.label} className="bg-surface border border-border rounded p-2">
                <div className="text-[9px] uppercase tracking-wider font-semibold text-text-muted">{f.label}</div>
                <div className="text-xs text-text-primary font-medium mt-0.5">{f.value}</div>
              </div>
            ))}
          </div>

          {/* Per-offering fit cards */}
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
              Offering fit · click to open in that lens
            </div>
            <div className="space-y-1.5">
              {sortedFits.map(([oid, fit]) => {
                const o = getOffering(oid);
                if (!o) return null;
                const tier = tierForScore(fit.score);
                return (
                  <button
                    key={oid}
                    onClick={() => onAddToBook(account, oid)}
                    className={`w-full text-left bg-surface border ${o.borderColor} rounded-md p-3 hover:shadow-card transition-all`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Package size={11} className={o.textColor} />
                      <span className="text-xs font-semibold text-text-primary">{o.name}</span>
                      <span className={`ml-auto text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${tier.bg} ${tier.color} ${tier.border}`}>
                        {tier.label} · {fit.score}
                      </span>
                    </div>
                    <ul className="space-y-0.5">
                      {fit.reasons.slice(0, 3).map((r, i) => (
                        <li key={i} className="flex items-start gap-1 text-[11px] text-text-secondary leading-snug">
                          <span className={`mt-1 ${o.textColor}`}>·</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RGIF snapshot */}
          {rgif && (
            <div className="bg-surface border border-border rounded-md p-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
                HG enrichment snapshot
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                <div>
                  <span className="text-text-muted">Total IT spend:</span>{' '}
                  <span className="font-mono text-text-primary">{rgif.spend?.total}</span>
                </div>
                <div>
                  <span className="text-text-muted">Security spend:</span>{' '}
                  <span className="font-mono text-text-primary">{rgif.spend?.security}/yr</span>
                </div>
                <div>
                  <span className="text-text-muted">Security vendors:</span>{' '}
                  <span className="font-mono text-text-primary">{rgif.securityVendors}</span>
                </div>
                <div>
                  <span className="text-text-muted">Spend trend:</span>{' '}
                  <span className="font-mono text-text-primary capitalize">{rgif.spendTrend}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-text-muted">Active intent:</span>{' '}
                  {rgif.intent.length > 0 ? (
                    <span className="text-text-primary">{rgif.intent.slice(0, 4).join(', ')}{rgif.intent.length > 4 ? '…' : ''}</span>
                  ) : (
                    <span className="text-text-muted italic">None</span>
                  )}
                </div>
                <div className="col-span-2">
                  <span className="text-text-muted">Journey stage:</span>{' '}
                  <span className="text-text-primary">{rgif.journey}</span>
                </div>
              </div>
            </div>
          )}

          {/* Add-to-book CTA */}
          <div className="bg-bg/40 border border-dashed border-border rounded-md p-3">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
              Add to my book
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed mb-2.5">
              Adds this account to your Salesforce book under your ownership, with the offering lens you
              select. Becomes available in {' '}
              <code className="font-mono text-text-primary">/home</code> signals + AccountThread.
            </p>
            <button
              onClick={() => onAddToBook(account, isLensed ? lensOfferingId : sortedFits[0]?.[0])}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-dim"
            >
              <Plus size={11} />
              Add {account.name} to book
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ----- Add to Book modal — governance-aware -----

function AddToBookModal({ open, account, defaultOfferingId, onClose, onConfirm, onOpenAdminApps }) {
  const [selectedOfferingId, setSelectedOfferingId] = useState(defaultOfferingId || 'cnapp');
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (open) {
      setSelectedOfferingId(defaultOfferingId || 'cnapp');
      setRunning(false);
      setStep(0);
    }
  }, [open, defaultOfferingId]);

  if (!open || !account) return null;

  const offering = getOffering(selectedOfferingId);
  const sfStatus = getIntegrationGovernance('salesforce');
  const sfEnabled = isAgentAccessEnabled('salesforce');

  const STEPS = [
    { id: 'check', label: 'Verify Salesforce agent access' },
    { id: 'create', label: 'Create Salesforce Account record' },
    { id: 'assign', label: 'Assign owner + territory' },
    { id: 'lens', label: `Tag with ${offering?.name || 'offering'} lens` },
    { id: 'log', label: 'Capture outcome → workflow store' },
  ];

  const runAddToBook = () => {
    if (!sfEnabled) return;
    setRunning(true);
    setStep(0);
    let i = 0;
    const tick = () => {
      i += 1;
      if (i < STEPS.length) {
        setStep(i);
        setTimeout(tick, 500);
      } else {
        setStep(STEPS.length);
        setTimeout(() => {
          onConfirm(account.id, selectedOfferingId);
        }, 400);
      }
    };
    setTimeout(tick, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-bg border border-border rounded-md shadow-elev w-full max-w-lg"
      >
        <div className="px-5 py-4 border-b border-border flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center text-white text-base font-bold flex-shrink-0"
            style={{ background: account.logoColor }}
          >
            {account.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-text-primary">Add {account.name} to your book</h2>
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
              Runs an offering-aware workflow that writes back to Salesforce. Governed by your admin&rsquo;s
              integration agent-access settings.
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Lens selector */}
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
              Which offering are you working this account for?
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {listOfferings().map((o) => {
                const fit = getFitFor(account.id, o.id);
                const tier = fit?.score != null ? tierForScore(fit.score) : null;
                const active = selectedOfferingId === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOfferingId(o.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded border text-left transition-colors ${
                      active ? `${o.bg} ${o.borderColor}` : 'bg-surface border-border hover:border-border-2'
                    }`}
                  >
                    <Package size={11} className={active ? o.textColor : 'text-text-muted'} />
                    <span className={`text-xs font-semibold flex-1 ${active ? o.textColor : 'text-text-primary'}`}>
                      {o.name}
                    </span>
                    {tier && (
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-1 py-0.5 rounded ${tier.bg} ${tier.color}`}>
                        {tier.label} {fit.score}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Governance block */}
          {!sfEnabled ? (
            <div className="bg-rose-500/5 border border-rose-500/30 rounded-md p-3 mb-3">
              <div className="flex items-start gap-2">
                <Lock size={13} className="text-rose-700 dark:text-rose-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-0.5">
                    Salesforce agent access is disabled
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
                    The Add-to-book workflow needs to write a new Account + Owner assignment to Salesforce.
                    Your admin must enable agent access for the Salesforce integration before this can run.
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setIntegrationGovernance('salesforce', { agentAccess: true });
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold rounded hover:bg-emerald-500/15"
                    >
                      <Unlock size={9} />
                      Enable now (admin)
                    </button>
                    <button
                      onClick={onOpenAdminApps}
                      className="inline-flex items-center gap-1 px-2 py-1 border border-border text-[11px] text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded"
                    >
                      Open /admin/apps
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-md p-2.5 mb-3 flex items-center gap-2">
              <Unlock size={11} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0" />
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Salesforce agent access enabled — workflow can run.
              </div>
            </div>
          )}

          {/* Workflow steps */}
          <div className="bg-surface border border-border rounded-md p-3">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
              Add-to-book workflow · 5 steps
            </div>
            <div className="space-y-1.5">
              {STEPS.map((s, i) => {
                const isActive = running && step === i;
                const isDone = running && step > i;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-2 text-[11px] ${
                      isDone ? 'text-emerald-700 dark:text-emerald-300' : isActive ? 'text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 size={11} />
                    ) : isActive ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    ) : (
                      <CircleDot size={11} className="text-text-muted" />
                    )}
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={running}
            className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={runAddToBook}
            disabled={!sfEnabled || running}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {running ? 'Running…' : (
              <>
                <Plus size={11} />
                Add to book
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ----- Activate menu — quick action launcher per workbook row -----

const ACTIVATE_ACTIONS = [
  { id: 'account_brief', label: 'Generate account brief', icon: 'FileText', play: 'account-brief-flow', desc: '8-agent MEDDIC-framed brief' },
  { id: 'email_draft', label: 'Draft outreach email', icon: 'Mail', play: 'email_draft', desc: 'Offering-aware email with provenance' },
  { id: 'persona_discovery', label: 'Find more contacts', icon: 'Users', play: 'persona-discovery-probe', desc: 'Discover missing buying-committee members' },
  { id: 'business_case', label: 'Build business case', icon: 'TrendingUp', play: 'cnapp-displacement-brief', desc: 'One-pager ROI + value proposition' },
];

function ActivateMenu({ account, isBookAccount, lensOffering, onLaunch }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
        title="Activate this account with AI-generated outreach materials"
      >
        <Sparkles size={9} />
        Activate
        <ChevronDown size={9} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute top-full right-0 mt-1 w-64 bg-surface border border-border rounded-md shadow-elev z-30 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-border bg-bg/40">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
              Activate {account.name}
            </div>
            {!isBookAccount && (
              <div className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5">
                Whitespace — add to book first for full activation
              </div>
            )}
          </div>
          {ACTIVATE_ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setOpen(false);
                onLaunch(account, a, lensOffering);
              }}
              className="w-full text-left px-3 py-2 hover:bg-surface-2 flex items-start gap-2 border-b border-border/40 last:border-b-0"
            >
              <Sparkles size={10} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-text-primary">{a.label}</div>
                <div className="text-[10px] text-text-muted">{a.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ----- Tenant book + CRM connection state -----
//
// Drives the workbook's first-entry vs repeat-user experience:
//   - hasBook   = territory book has accounts (CSV uploaded OR CRM connected)
//   - hasCrm    = at least one CRM integration is "connected" (agentAccess on)
//   - isEmptyTenant = neither — show the "Add your book" hero CTA

const DEMO_CONNECTED_CRMS_KEY = 'rgi-demo-connected-crms';

function readDemoConnectedCrms() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DEMO_CONNECTED_CRMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const DEMO_EMPTY_MODE_KEY = 'rgi-demo-empty-mode';

function isDemoEmptyMode() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(DEMO_EMPTY_MODE_KEY) === 'true';
}

function setDemoEmptyMode(enabled) {
  if (typeof window === 'undefined') return;
  if (enabled) {
    window.localStorage.setItem(DEMO_EMPTY_MODE_KEY, 'true');
  } else {
    window.localStorage.removeItem(DEMO_EMPTY_MODE_KEY);
  }
  // Notify subscribers (workbook state hook listens to this)
  window.dispatchEvent(new Event('rgi:demo-empty-mode-changed'));
}

function getWorkbookState() {
  // Demo override — lets RevOps admins preview the first-time state
  // (no book, no CRM) without actually clearing the seeded demo data.
  // Toggled via the small "Demo" pill in the workbook header.
  if (isDemoEmptyMode()) {
    return { hasBook: false, hasCrm: false, isEmptyTenant: true };
  }

  const territoryStats = getCoverageStats();
  const hasBook = (territoryStats.totalBook || 0) > 0;

  // CRM = salesforce or hubspot with agent access OR demo-flagged connected
  const demoConnected = readDemoConnectedCrms();
  const sfGov = getIntegrationGovernance('salesforce');
  const hsGov = getIntegrationGovernance('hubspot');
  const hasCrm =
    sfGov?.agentAccess === true ||
    hsGov?.agentAccess === true ||
    demoConnected.includes('salesforce') ||
    demoConnected.includes('hubspot');

  return {
    hasBook,
    hasCrm,
    isEmptyTenant: !hasBook && !hasCrm,
  };
}

// ----- Empty-book hero CTA — first-entry experience -----

function EmptyBookHero({ onUploadCsv, onConnectCrm, whitespaceCount, onExploreWhitespace }) {
  return (
    <div className="bg-gradient-to-br from-violet-500/5 via-primary/5 to-emerald-500/5 border border-violet-500/20 rounded-lg p-6 mb-5">
      <div className="flex items-start gap-4 max-w-3xl">
        <div className="w-12 h-12 rounded-md bg-violet-500/15 flex items-center justify-center flex-shrink-0">
          <Database size={20} className="text-violet-700 dark:text-violet-300" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-text-primary mb-1">
            Add your book of accounts
          </h2>
          <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
            See your customers and pipeline ranked alongside whitespace. Upload a CSV with{' '}
            <code className="bg-surface-2 text-text-primary px-1 py-0.5 rounded text-[11px] font-mono">
              owner_email, account_name, account_domain
            </code>{' '}
            or connect Salesforce / HubSpot to sync automatically.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onUploadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-violet-600 text-white rounded-md hover:bg-violet-500 transition-colors"
            >
              <Upload size={12} />
              Upload Book CSV
            </button>
            <button
              onClick={onConnectCrm}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-primary/40 text-primary rounded-md hover:bg-primary/5 transition-colors"
            >
              <Plug size={12} />
              Connect CRM
            </button>
            {whitespaceCount > 0 && (
              <button
                onClick={onExploreWhitespace}
                className="ml-2 inline-flex items-center gap-1 text-[11px] text-text-secondary hover:text-primary"
              >
                <Sparkles size={11} className="text-violet-500" />
                <span>Or explore <strong className="text-text-primary">{whitespaceCount.toLocaleString()}</strong> whitespace accounts first</span>
                <ChevronRight size={10} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- Setup Coach trigger pill — surfaces in workbook header for accessibility -----

function SetupCoachPill({ onOpen }) {
  const [state, setState] = useState(() => getCoachState());
  useEffect(() => subscribeCoach(() => setState(getCoachState())), []);

  if (state.allComplete) return null;

  // If coach was dismissed, show a smaller "Resume setup" affordance.
  const remaining = state.totalCount - state.completedCount;

  return (
    <button
      onClick={onOpen}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30 rounded-md hover:bg-violet-500/20 transition-colors"
      title={`${state.completedCount} of ${state.totalCount} setup tasks complete`}
    >
      <Sparkles size={11} />
      <span>Setup</span>
      <span className="font-mono text-[10px] text-violet-700/70 dark:text-violet-300/70">
        {state.completedCount}/{state.totalCount}
      </span>
      <div className="w-10 h-1 bg-violet-500/15 rounded-full overflow-hidden ml-1">
        <div className="h-full bg-violet-500" style={{ width: `${state.percent}%` }} />
      </div>
    </button>
  );
}

// ----- Sync to Salesforce modal (admin only) -----

const LAST_SYNC_KEY = 'rgi-workbook-last-sync';

function getLastSync(personaId) {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(`${LAST_SYNC_KEY}-${personaId}`);
  } catch {
    return null;
  }
}

function setLastSync(personaId, iso) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${LAST_SYNC_KEY}-${personaId}`, iso);
  } catch {
    // ignore
  }
}

// Map an enriched column to a proposed Salesforce custom field name.
function proposeSfField(col) {
  if (col.kind !== 'enriched') return null;
  const slug = String(col.question || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
  return `hg_${slug}__c`;
}

function SyncToCrmModal({ open, personaId, accounts, view, onClose, onConfirm }) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!open) {
      setRunning(false);
      setStep(0);
    }
  }, [open]);

  if (!open) return null;

  const enrichedCols = (view?.columns || []).filter((c) => c.kind === 'enriched');
  const sfStatus = getIntegrationGovernance('salesforce');
  const sfEnabled = isAgentAccessEnabled('salesforce');

  const STEPS = [
    { id: 'verify', label: 'Verify Salesforce agent access (write scope)' },
    { id: 'schema', label: `Create ${enrichedCols.length} custom field${enrichedCols.length === 1 ? '' : 's'} on Account object` },
    { id: 'enrich', label: `Sync enrichment values to ${accounts.length} Accounts` },
    { id: 'whitespace', label: 'Create new Account records for whitespace rows' },
    { id: 'log', label: 'Record sync timestamp + audit entry' },
  ];

  const runSync = () => {
    if (!sfEnabled) return;
    setRunning(true);
    setStep(0);
    let i = 0;
    const tick = () => {
      i += 1;
      if (i < STEPS.length) {
        setStep(i);
        setTimeout(tick, 600);
      } else {
        setStep(STEPS.length);
        const now = new Date().toISOString();
        setLastSync(personaId, now);
        setTimeout(() => onConfirm(now), 400);
      }
    };
    setTimeout(tick, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-bg border border-border rounded-md shadow-elev w-full max-w-2xl max-h-[88vh] flex flex-col"
      >
        <div className="px-5 py-4 border-b border-border flex items-start gap-3">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center flex-shrink-0">
            <Upload size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-text-primary">Sync workbook to Salesforce</h2>
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
              Push enriched signal columns back to Salesforce as Account custom fields. Sellers see the
              enriched data in their CRM views automatically.
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar px-5 py-4">
          {/* Field mapping preview */}
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
              Field mapping · {enrichedCols.length} enriched columns
            </div>
            {enrichedCols.length === 0 ? (
              <div className="bg-bg/40 border border-dashed border-border rounded-md p-4 text-center">
                <Wand2 size={16} className="mx-auto text-text-muted mb-1.5" />
                <div className="text-xs text-text-secondary">
                  No enriched columns yet. Use <span className="font-semibold">Enrich with AI</span> on the
                  workbook to add signal columns, then sync them here.
                </div>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-md overflow-hidden">
                {enrichedCols.map((col) => (
                  <div key={col.id} className="px-3 py-2 border-b border-border/40 last:border-b-0 flex items-start gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Database size={10} className="text-emerald-700 dark:text-emerald-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-text-secondary font-medium truncate">{col.question}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-text-muted">SF custom field:</span>
                        <code className="text-[10px] font-mono text-text-primary bg-bg/40 border border-border rounded px-1.5 py-0.5">
                          Account.{proposeSfField(col)}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accounts in scope */}
          <div className="bg-surface border border-border rounded-md p-3 mb-4">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
              Accounts in scope
            </div>
            <div className="text-xs text-text-secondary leading-relaxed">
              <span className="font-semibold text-text-primary">{accounts.length}</span> accounts will be
              enriched. Existing Salesforce Account records get the new field values; whitespace accounts
              get new Account records created with full enrichment.
            </div>
          </div>

          {/* Governance gate */}
          {!sfEnabled ? (
            <div className="bg-rose-500/5 border border-rose-500/30 rounded-md p-3 mb-3">
              <div className="flex items-start gap-2">
                <Lock size={13} className="text-rose-700 dark:text-rose-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-0.5">
                    Salesforce agent access disabled
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
                    Sync needs <span className="font-mono">crm.account.update</span> +{' '}
                    <span className="font-mono">crm.account.create</span> write scope. Enable in Connected Apps.
                  </p>
                  <button
                    onClick={() => setIntegrationGovernance('salesforce', { agentAccess: true })}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold rounded hover:bg-emerald-500/15"
                  >
                    <Unlock size={9} />
                    Enable now
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-md p-2.5 mb-3 flex items-center gap-2">
              <Unlock size={11} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0" />
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Salesforce agent access enabled · write scope ready.
              </div>
            </div>
          )}

          {/* Workflow steps */}
          <div className="bg-surface border border-border rounded-md p-3">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
              Sync workflow · {STEPS.length} steps
            </div>
            <div className="space-y-1.5">
              {STEPS.map((s, i) => {
                const isActive = running && step === i;
                const isDone = running && step > i;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-2 text-[11px] ${
                      isDone ? 'text-emerald-700 dark:text-emerald-300' : isActive ? 'text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 size={11} />
                    ) : isActive ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    ) : (
                      <CircleDot size={11} className="text-text-muted" />
                    )}
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button onClick={onClose} disabled={running} className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded disabled:opacity-40">
            Cancel
          </button>
          <button
            onClick={runSync}
            disabled={!sfEnabled || running || enrichedCols.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {running ? 'Syncing…' : (
              <>
                <Upload size={11} />
                Sync to Salesforce
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ----- Enrichment modal (full overlay) -----

function EnrichmentModal({ open, accounts, currentView, onClose, onAddColumn, lensOfferingId, source }) {
  const [activeCatId, setActiveCatId] = useState('tech');
  const [prompt, setPrompt] = useState('');
  const [activeChip, setActiveChip] = useState(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultLoading, setResultLoading] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setPrompt('');
      setActiveChip(null);
      setResultOpen(false);
    }
  }, [open]);

  const category = RGIF_CATEGORY_BY_ID[activeCatId];

  const computedResult = useMemo(() => {
    if (!prompt.trim()) return null;
    const valuesByAccount = {};
    for (const a of accounts) {
      valuesByAccount[a.id] = valueFor(a, prompt);
    }
    const insight = buildInsight(prompt, accounts, valuesByAccount, { source });
    const matches = Object.values(valuesByAccount).filter((v) => v.tone === 'good').length;
    const noMatches = Object.values(valuesByAccount).filter((v) => v.tone === 'red').length;
    const mixed = Object.values(valuesByAccount).filter((v) => v.tone === 'amber').length;
    return { valuesByAccount, insight, matches, noMatches, mixed };
  }, [prompt, accounts, source]);

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    setResultOpen(true);
    setResultLoading(true);
    setTimeout(() => setResultLoading(false), 700);
  };

  const handleAdd = () => {
    onAddColumn({ question: prompt.trim(), category: activeCatId });
    setResultOpen(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-bg/95 backdrop-blur-md flex flex-col">
      {/* Top bar */}
      <div className="flex-shrink-0 h-14 border-b border-border bg-bg flex items-center gap-3 px-6">
        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center flex-shrink-0">
          <Wand2 size={16} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-text-primary">Enrich with AI</div>
          <div className="text-[10px] text-text-muted">powered by HG Insights RGIF · across your book</div>
        </div>
        <button
          onClick={onClose}
          className="ml-auto p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body: 2 panes */}
      <div className="flex-1 flex min-h-0">
        {/* Left rail: categories */}
        <div className="w-64 flex-shrink-0 bg-bg border-r border-border flex flex-col">
          <div className="px-3 py-3 border-b border-border">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">RGIF Categories</div>
            <div className="text-[10px] text-text-muted mt-0.5 leading-snug">
              Select a data category to explore relevant questions
            </div>
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar">
            {RGIF_CATEGORIES.map((cat) => {
              const isActive = activeCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCatId(cat.id);
                    setActiveChip(null);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 border-l-2 transition-colors text-left ${
                    isActive
                      ? 'bg-surface border-primary'
                      : 'border-transparent hover:bg-surface-2'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}30` }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {cat.name}
                    </div>
                    <div className="text-[10px] text-text-muted truncate">{cat.desc.split(',')[0]}</div>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-text-muted'}`}>
                    {cat.questions.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: prompt + chips */}
        <div className="flex-1 min-w-0 bg-surface flex flex-col overflow-hidden">
          {/* Category header */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{category.icon}</span>
              <h2 className="text-base font-semibold text-text-primary">{category.name}</h2>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{category.desc}</p>
          </div>

          {/* Prompt area + chips */}
          <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
            {/* Prompt box */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setActiveChip(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                rows={3}
                placeholder={`Ask any question about your accounts using RGIF ${category.name} data…\ne.g. ${category.questions[0]}`}
                className="w-full px-3 py-3 pb-12 text-sm bg-bg border border-border rounded-md text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 resize-none transition-colors"
              />
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-bg/95 border-t border-border rounded-b-md flex items-center px-3 gap-2">
                <span className="text-[10px] text-text-muted flex-1">⌘↵ to submit · click a chip below to fill</span>
                <button
                  onClick={handleSubmit}
                  disabled={!prompt.trim()}
                  className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold bg-primary text-white rounded hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={10} />
                  Run across {accounts.length} accounts
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Suggested questions</div>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Chips */}
            <div className="flex-1 overflow-y-auto thin-scrollbar">
              <div className="flex flex-wrap gap-1.5">
                {category.questions.map((q) => {
                  const isActive = activeChip === q;
                  return (
                    <button
                      key={q}
                      onClick={() => {
                        setPrompt(q);
                        setActiveChip(q);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors ${
                        isActive
                          ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                          : 'bg-bg border-border text-text-secondary hover:border-primary/30 hover:text-text-primary'
                      }`}
                    >
                      <span className="text-[12px] opacity-80">{category.icon}</span>
                      {q}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result overlay */}
      {resultOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-bg border border-border rounded-md shadow-elev w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Wand2 size={14} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-text-muted">"{prompt}"</div>
                <div className="text-sm font-semibold text-text-primary mt-0.5">Territory Analysis</div>
              </div>
              <button onClick={() => setResultOpen(false)} className="text-text-muted hover:text-text-primary p-1">
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto thin-scrollbar p-5 space-y-4">
              {resultLoading || !computedResult ? (
                <div className="flex items-center justify-center py-12 gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
              ) : (
                <>
                  {/* Narrative insight */}
                  <div className="bg-surface border border-primary/30 rounded-md p-3 flex items-start gap-3">
                    <div className="text-xl flex-shrink-0">✦</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">
                        RGIF Intelligence — {category.name}
                      </div>
                      <div
                        className="text-xs text-text-primary leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: computedResult.insight.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }}
                      />
                    </div>
                  </div>

                  {/* Per-account rows */}
                  <div className="bg-surface border border-border rounded-md p-3">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-2">
                      Per-account breakdown · {accounts.length} accounts
                    </div>
                    <div className="space-y-0.5 max-h-64 overflow-y-auto thin-scrollbar">
                      {accounts.map((a) => {
                        const v = computedResult.valuesByAccount[a.id];
                        return (
                          <div key={a.id} className="flex items-center gap-2 py-1 border-b border-border/40 last:border-b-0 text-xs">
                            <div
                              className="w-4 h-4 rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                              style={{ background: a.logoColor }}
                            >
                              {a.name.charAt(0)}
                            </div>
                            <span className="text-text-primary font-medium flex-1 truncate">{a.name}</span>
                            <ToneDot tone={v.tone} />
                            <span className="text-[10px] font-mono text-text-secondary w-36 text-right truncate">{v.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      ✓ {computedResult.matches} match
                    </span>
                    {computedResult.noMatches > 0 && (
                      <span className="text-[10px] font-mono px-2 py-1 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                        ✕ {computedResult.noMatches} no match
                      </span>
                    )}
                    {computedResult.mixed > 0 && (
                      <span className="text-[10px] font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        ~ {computedResult.mixed} partial
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30">
                      HG Insights RGIF
                    </span>
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                      {category.name}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border flex items-center gap-2">
              <button
                onClick={handleAdd}
                disabled={resultLoading || !computedResult}
                className="flex-1 px-3 py-2 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
              >
                <Plus size={11} />
                Add as column across {accounts.length} accounts
              </button>
              <button
                onClick={() => setResultOpen(false)}
                className="px-3 py-2 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ----- Main route -----

export default function WorkbookRoute() {
  const navigate = useNavigate();
  const { personaId, persona } = usePersona();
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Compute persona-derived flag here (before source state) so admins can
  // default to the 'all' tab on first land. isAdmin is also exported below
  // for the rest of the component — this is the canonical computation site.
  const isAdminPersona = persona?.roleType === 'admin';

  // Source state — 4 tabs: all | book | whitespace | needs_review.
  // URL ?source= takes precedence. Admins default to 'all' (All Companies);
  // sellers default to 'book' (My Book).
  const VALID_SOURCES = ['all', 'book', 'whitespace', 'needs_review'];
  const initialSource = VALID_SOURCES.includes(searchParams.get('source'))
    ? searchParams.get('source')
    : isAdminPersona ? 'all' : 'book';
  const [source, setSource] = useState(initialSource);
  // Legacy saved-views are keyed off 'book' | 'whitespace'. Map 4-tab source → 2-state for views compat.
  const viewsSourceKey = source === 'whitespace' ? 'whitespace' : 'book';

  // View mode — segmented (sections per offering) vs flat (single table).
  // URL ?view_mode= takes precedence; sellers default to segmented since
  // their book is always offering-grouped; admins default to segmented as
  // their master pane-of-glass.
  const initialViewMode = searchParams.get('view_mode') === 'flat' ? 'flat' : 'segmented';
  const [viewMode, setViewMode] = useState(initialViewMode);

  // View state
  const initialViewId = searchParams.get('view');
  const initialViewsKey = initialSource === 'whitespace' ? 'whitespace' : 'book';
  const [currentViewId, setCurrentViewId] = useState(() =>
    initialViewId || getDefaultView(personaId, initialViewsKey)?.id,
  );
  const [viewsTick, setViewsTick] = useState(0);
  useEffect(() => subscribeViews(() => setViewsTick((t) => t + 1)), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentView = useMemo(() => getView(personaId, currentViewId), [personaId, currentViewId, viewsTick]);

  // When source changes, swap to that source's default view.
  // Saved views only exist for 'book' and 'whitespace' — 'all' and 'needs_review' reuse 'book' views.
  const handleSourceChange = (next) => {
    if (next === source) return;
    setSource(next);
    const viewsKey = next === 'whitespace' ? 'whitespace' : 'book';
    const def = getDefaultView(personaId, viewsKey);
    if (def) setCurrentViewId(def.id);
  };

  // Keep URL in sync with view id + source + viewMode
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let changed = false;
    if (currentViewId && params.get('view') !== currentViewId) {
      params.set('view', currentViewId);
      changed = true;
    }
    if (params.get('source') !== source) {
      params.set('source', source);
      changed = true;
    }
    if (params.get('view_mode') !== viewMode) {
      params.set('view_mode', viewMode);
      changed = true;
    }
    if (changed) setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentViewId, source, viewMode]);

  // Subscribe to added-from-whitespace changes
  const [addedTick, setAddedTick] = useState(0);
  useEffect(() => subscribeAdded(() => setAddedTick((t) => t + 1)), []);

  // Accounts — unified universe, filtered by tab. Each row carries a `source` field
  // ('matched' | 'crm' | 'hg') so per-row UI can adapt regardless of tab.
  const accounts = useMemo(() => {
    const unified = getUnifiedAccounts(personaId);
    return filterByTab(unified, source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, personaId, addedTick]);

  // Always-current counts for the toggle, independent of filters
  const tabCounts = useMemo(
    () => getUnifiedCounts(personaId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [personaId, addedTick],
  );
  const bookCount = tabCounts.book;
  const whitespaceCount = tabCounts.whitespace;

  // Sales-play filter — sidebar links the workbook to a specific play via
  // ?play=<id>. We resolve the play and overlay its audience criteria
  // (offering lens + signals) on top of the current view's filters.
  const activePlayId = searchParams.get('play') || null;
  const activePlay = useMemo(() => (activePlayId ? getPlay(activePlayId) : null), [activePlayId]);

  // Offerings shown as fit columns in the table. In play-mode, narrow to the
  // play's offerings so the table feels purpose-built for the play instead of
  // showing every product the tenant sells.
  const tableOfferings = useMemo(() => {
    const all = listOfferings();
    if (!activePlay) return all;
    const ids = new Set();
    if (activePlay.offering_id) ids.add(activePlay.offering_id);
    if (Array.isArray(activePlay.offerings)) activePlay.offerings.forEach((id) => ids.add(id));
    if (ids.size === 0) return all;
    const matched = all.filter((o) => ids.has(o.id));
    return matched.length > 0 ? matched : all;
  }, [activePlay]);

  const clearPlayFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('play');
    setSearchParams(params, { replace: true });
  };

  // HG filter state — in-memory only (per session). Filters are stored as
  // serializable specs { id, specId, group, label, value, displayValue }.
  // Predicates are materialized at filter-time via buildPredicates().
  // Intersects with view filters + active play (AND logic).
  const [hgFilters, setHgFilters] = useState([]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const addOrUpdateHgFilter = (filter) => {
    setHgFilters((prev) => {
      const exists = prev.some((f) => f.id === filter.id);
      if (exists) return prev.map((f) => (f.id === filter.id ? filter : f));
      return [...prev, filter];
    });
  };
  const removeHgFilter = (filterId) => {
    setHgFilters((prev) => prev.filter((f) => f.id !== filterId));
  };
  const clearHgFilters = () => setHgFilters([]);
  const hgPredicates = useMemo(() => buildPredicates(hgFilters), [hgFilters]);

  // Apply filters from current view (and overlay sales-play criteria when set)
  const filteredAccounts = useMemo(() => {
    let list = [...accounts];
    const viewFilters = currentView?.filters || {};
    // Play overlays the view's offering + signal filters when present.
    const playOffering =
      activePlay?.offering_id || activePlay?.offerings?.[0] || null;
    const playSignals = Array.isArray(activePlay?.signals) ? activePlay.signals : [];
    const f = {
      ...viewFilters,
      offeringId: playOffering || viewFilters.offeringId,
      signalKinds:
        playSignals.length > 0 ? playSignals : viewFilters.signalKinds,
    };
    // Lookalike list: restrict to a curated set of whitespace accounts
    if (source === 'whitespace' && Array.isArray(f.lookalikeIds) && f.lookalikeIds.length > 0) {
      const allowed = new Set(f.lookalikeIds);
      list = list.filter((a) => allowed.has(a.id));
    }
    if (f.offeringId && f.offeringId !== 'all') {
      const registry = listOfferings();
      list = list.filter((a) => (resolveFitScore(a.id, f.offeringId, registry)?.score ?? 0) >= 50);
    }
    if (Array.isArray(f.signalKinds) && f.signalKinds.length > 0) {
      list = list.filter((a) => {
        const sigs = a.signals || [];
        return f.signalKinds.some((kid) => {
          const k = SIGNAL_KIND_BY_ID[kid];
          if (!k) return false;
          if (kid === 'stale_no_touch') {
            const days = a.lastTouchDaysAgo;
            return days == null || days > 14;
          }
          return sigs.some(k.matches);
        });
      });
    }
    if (f.stage === 'customer') {
      list = list.filter((a) => a.stage === 'customer' || a.stage === 'renewal');
    }
    // HG filters intersect (AND) with everything else.
    if (hgPredicates.length > 0) {
      list = list.filter((a) => hgPredicates.every((pred) => {
        try { return pred(a) === true; } catch { return false; }
      }));
    }
    return list;
  }, [accounts, currentView, activePlay, hgPredicates]);

  // Sort
  const sortedAccounts = useMemo(() => {
    if (!currentView?.sort) return filteredAccounts;
    const { columnId, dir } = currentView.sort;
    const list = [...filteredAccounts];
    list.sort((a, b) => {
      let av = null, bv = null;
      if (columnId === 'opp_score' || columnId === 'tier') {
        av = a.combinedScore; bv = b.combinedScore;
      } else if (columnId === 'fit_lens') {
        const registry = listOfferings();
        const lensId = currentView.filters?.offeringId || 'cnapp';
        const fa = resolveFitScore(a.id, lensId, registry) || getFitFor(a.id, 'cnapp');
        const fb = resolveFitScore(b.id, lensId, registry) || getFitFor(b.id, 'cnapp');
        av = fa.score; bv = fb.score;
      } else if (columnId === 'revenue') {
        av = parseFloat((a.fai.revenue || '').replace(/[^0-9.]/g, ''));
        bv = parseFloat((b.fai.revenue || '').replace(/[^0-9.]/g, ''));
      } else if (columnId === 'employees') {
        av = parseFloat((a.fai.employees || '').replace(/[^0-9.]/g, ''));
        bv = parseFloat((b.fai.employees || '').replace(/[^0-9.]/g, ''));
      } else {
        return 0;
      }
      if (av == null) return 1;
      if (bv == null) return -1;
      return dir === 'desc' ? bv - av : av - bv;
    });
    return list;
  }, [filteredAccounts, currentView]);

  // Modals + drawers
  const [enrichOpen, setEnrichOpen] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [previewAccount, setPreviewAccount] = useState(null);
  const [addToBookAccount, setAddToBookAccount] = useState(null);
  const [addToBookDefaultOffering, setAddToBookDefaultOffering] = useState(null);

  // Admin / seller flags. Sellers get a focused, opinionated view that
  // strips chrome (lens/signal/source/view toggles) and renders the seller
  // table with offering-score columns + competitive/intent/partner insights
  // harvested from the tenant context.
  const isAdmin = persona?.roleType === 'admin';
  const isSeller = !isAdmin;
  const [lastSync, setLastSyncState] = useState(() => getLastSync(personaId));

  // Workbook state — drives first-entry vs repeat-user experience for admins.
  // Subscribe to coach + territory + governance via the coach store (which
  // reaches into both). hasBook + hasCrm gate the empty-hero, the source
  // toggle, and the Sync button. The demo-empty-mode flag lets admins preview
  // the first-time state without clearing seeded data.
  const [workbookState, setWorkbookState] = useState(() => getWorkbookState());
  useEffect(() => {
    const refresh = () => setWorkbookState(getWorkbookState());
    refresh();
    const unsub = subscribeCoach(refresh);
    window.addEventListener('rgi:territory-design-changed', refresh);
    window.addEventListener('rgi:demo-empty-mode-changed', refresh);
    return () => {
      unsub();
      window.removeEventListener('rgi:territory-design-changed', refresh);
      window.removeEventListener('rgi:demo-empty-mode-changed', refresh);
    };
  }, []);

  // Admins landing on an empty tenant (no book, no CRM) auto-default to
  // whitespace — that's the only data they have to look at. Sellers + admins
  // with a populated book keep their saved-view default.
  useEffect(() => {
    if (isAdmin && workbookState.isEmptyTenant && source === 'book') {
      setSource('whitespace');
      const def = getDefaultView(personaId, 'whitespace');
      if (def) setCurrentViewId(def.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, workbookState.isEmptyTenant]);

  const activeOffering = currentView?.filters?.offeringId === 'all'
    ? null
    : getOffering(currentView?.filters?.offeringId);

  // Filter handlers
  const updateLens = (offeringId) => {
    updateViewFilters(personaId, currentView.id, { ...currentView.filters, offeringId });
  };
  const toggleSignalKind = (kindId) => {
    const cur = currentView.filters?.signalKinds || [];
    const next = cur.includes(kindId) ? cur.filter((x) => x !== kindId) : [...cur, kindId];
    updateViewFilters(personaId, currentView.id, { ...currentView.filters, signalKinds: next });
  };

  // Column handlers
  const handleAddEnrichedColumn = ({ question, category }) => {
    addEnrichedColumn(personaId, currentView.id, { question, category });
    showToast(`Added enrichment column · ${question.slice(0, 40)}${question.length > 40 ? '…' : ''}`, 'success');
  };
  const handleRemoveColumn = (columnId) => {
    removeColumn(personaId, currentView.id, columnId);
    showToast('Column removed', 'info');
  };

  // Save as handler
  const handleSaveAs = (name) => {
    const next = saveCurrentAsNewView(personaId, currentView, name);
    setCurrentViewId(next.id);
    setSaveAsOpen(false);
    showToast(`Saved view "${name}"`, 'success');
  };

  // Activate menu — launches a play in the AccountThread with the right context
  const handleLaunchActivate = (account, action, lensOffering) => {
    const offering = lensOffering && lensOffering !== 'all' ? lensOffering : 'cnapp';
    // Whitespace: prompt to add first; for now just navigate as if they're working it
    const playParam = action.play || 'account_brief';
    navigate(`/account/${account.id}?play=${playParam}&offering=${offering}`);
    showToast(`Activating ${action.label.toLowerCase()} on ${account.name}`, 'success');
  };

  // Row click — uses per-row source so mixed-tab views (All) route correctly.
  // HG-only rows open the preview drawer; matched/crm rows open the account thread.
  const handleRowClick = (account) => {
    if (account.source === 'hg') {
      setPreviewAccount(account);
    } else {
      const lens = currentView.filters?.offeringId || 'all';
      navigate(`/account/${account.id}?offering=${lens}`);
    }
  };

  // Add to book flow handlers
  const handleStartAddToBook = (account, offeringId) => {
    setPreviewAccount(null);
    setAddToBookAccount(account);
    setAddToBookDefaultOffering(offeringId || currentView.filters?.offeringId || null);
  };

  const handleConfirmAddToBook = (accountId, offeringId) => {
    markAccountAdded(personaId, accountId);
    const account = addToBookAccount;
    setAddToBookAccount(null);
    showToast(`${account?.name || 'Account'} added to your book · ${getOffering(offeringId)?.name || 'lens'} lens`, 'success');
    // Navigate to the account thread in the chosen lens
    setTimeout(() => navigate(`/account/${accountId}?offering=${offeringId || 'all'}`), 200);
  };

  if (!currentView) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-12 text-center">
        <Layers size={20} className="mx-auto text-text-muted mb-2" />
        <h1 className="text-base font-semibold mb-2">No saved views</h1>
      </div>
    );
  }

  // Render enrichment columns
  const enrichedCols = currentView.columns.filter((c) => c.kind === 'enriched');

  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <div className="flex-shrink-0 border-b border-border bg-bg/95">
        <div className="max-w-7xl mx-auto px-6 py-3">
          {activePlay ? (
            <button
              onClick={clearPlayFilter}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-primary mb-2 transition-colors"
            >
              <ArrowLeft size={11} /> {isAdmin ? 'Master Workbook' : 'Workbook'}
            </button>
          ) : (
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-2 transition-colors"
            >
              <ArrowLeft size={11} /> Home
            </button>
          )}
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {activePlay ? <Swords size={16} className="text-primary" /> : <TableIcon size={16} className="text-primary" />}
                <h1 className="text-xl font-semibold tracking-tight">
                  {activePlay
                    ? activePlay.name
                    : isAdmin ? 'Master Workbook' : 'Workbook'}
                </h1>
                {activePlay ? (
                  <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                    Sales Play
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                    Enrichable
                  </span>
                )}
                {!activePlay && isAdmin && (
                  <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Admin
                  </span>
                )}
                {activePlay?.motion && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-surface-2 text-text-secondary border border-border">
                    {MOTION_LABELS[activePlay.motion] || activePlay.motion}
                  </span>
                )}
              </div>
              <div className="text-xs text-text-secondary">
                {activePlay
                  ? (activePlay.description || `Companies matching the ${activePlay.name} criteria across your tenant book and HG whitespace.`)
                  : isAdmin
                  ? `Enrich the tenant's account universe with HG signals, then sync to Salesforce. Sellers consume enriched signals via Plays.`
                  : 'Your full book · ranked by opportunity · ask anything across rows'}
              </div>
              {isAdmin && lastSync && (
                <div className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                  <CheckCircle2 size={9} className="text-emerald-700 dark:text-emerald-300" />
                  Last sync to Salesforce: {new Date(lastSync).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              )}
              {isAdmin && !activePlay && (
                <IcpPill
                  icp={tenant?.icp}
                  onEdit={() => navigate('/admin/tenant')}
                />
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sellers always work off their book — no source toggle, no
                  view-mode toggle, no offering/signal filter chips. */}
              {isSeller ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-primary/10 text-primary border border-primary/20 font-semibold">
                  <BookOpen size={11} />
                  My Book
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/15">{bookCount}</span>
                </div>
              ) : (
                <>
                  <SourceToggle
                    source={source}
                    onChange={handleSourceChange}
                    counts={tabCounts}
                    isAdmin={isAdmin}
                    bookEmpty={isAdmin && workbookState.isEmptyTenant}
                  />
                  {/* Offering refine — single dropdown to narrow the table to
                      a specific product's fit. Replaces the multi-chip lens row
                      that used to live below. */}
                  <OfferingRefine
                    activeOfferingId={currentView.filters?.offeringId || 'all'}
                    offerings={listOfferings()}
                    onChange={updateLens}
                    disabled={!!activePlay}
                  />
                  {/* View-mode toggle — segmented (per-offering sections) vs flat (single table) */}
                  <div className="inline-flex items-center bg-surface border border-border rounded-md p-0.5">
                    <button
                      onClick={() => setViewMode('segmented')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded transition-colors ${
                        viewMode === 'segmented'
                          ? 'bg-primary/15 text-primary font-semibold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      title="Stack sections per offering"
                    >
                      <Layers size={11} />
                      Segmented
                    </button>
                    <button
                      onClick={() => setViewMode('flat')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded transition-colors ${
                        viewMode === 'flat'
                          ? 'bg-primary/15 text-primary font-semibold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      title="Single flat table"
                    >
                      <TableIcon size={11} />
                      Flat
                    </button>
                  </div>
                </>
              )}
              <SavedViewPicker
                personaId={personaId}
                source={viewsSourceKey}
                currentView={currentView}
                onChangeView={(v) => setCurrentViewId(v.id)}
                onSaveAs={() => setSaveAsOpen(true)}
                onDelete={(id) => {
                  deleteView(personaId, id);
                  const def = getDefaultView(personaId, viewsSourceKey);
                  setCurrentViewId(def?.id);
                }}
                onSetDefault={(id) => setDefaultView(personaId, id)}
              />
              {/* Explicit Save Workbook CTA — same modal as SavedViewPicker's
                  "Save as…" option, but discoverable as a first-class button.
                  Lands in the sidebar's My Workbooks section. */}
              {isAdmin && (
                <button
                  onClick={() => setFilterPanelOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-md transition-colors ${
                    hgFilters.length > 0
                      ? 'bg-primary/10 text-primary border-primary/40'
                      : 'bg-surface text-text-secondary border-border hover:text-primary hover:border-primary/40'
                  }`}
                  title="Add HG filters to refine the company list"
                >
                  <Filter size={11} />
                  Filter
                  {hgFilters.length > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                      {hgFilters.length}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => setSaveAsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border text-text-secondary hover:text-primary hover:border-primary/40 rounded-md transition-colors"
                title="Save current filters + columns + lens as a new Workbook view"
              >
                <Save size={11} />
                Save Workbook
              </button>
              <button
                onClick={() => setEnrichOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-primary to-violet-500 text-white rounded-md hover:opacity-90 transition-opacity shadow-card"
              >
                <Wand2 size={11} />
                Enrich with AI
              </button>
              {/* Sync button — admin-only. Sellers don't sync books to CRM. */}
              {!isSeller && (
                <button
                  onClick={() => {
                    if (!workbookState.hasCrm) {
                      navigate('/admin/apps');
                      return;
                    }
                    setSyncOpen(true);
                  }}
                  disabled={!workbookState.hasCrm}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-opacity shadow-card ${
                    workbookState.hasCrm
                      ? 'bg-gradient-to-r from-emerald-500 to-primary text-white hover:opacity-90'
                      : 'bg-surface border border-border text-text-muted cursor-not-allowed opacity-70 hover:opacity-100 hover:text-primary'
                  }`}
                  title={
                    workbookState.hasCrm
                      ? 'Sync enriched columns back to Salesforce as Account custom fields'
                      : 'Connect a CRM in Integrations to enable Sync'
                  }
                >
                  <Upload size={11} />
                  {workbookState.hasCrm ? 'Sync to Salesforce' : 'Sync · Connect CRM'}
                </button>
              )}
              {/* Setup Coach trigger — always-visible entry to the coach
                  panel. Admin can re-open it any time during onboarding. */}
              {isAdmin && (
                <SetupCoachPill
                  onOpen={() => {
                    restoreCoach();
                    setCoachExpanded(true);
                  }}
                />
              )}
              {/* Demo state toggle — admin-only. Flips between first-time
                  (no book, no CRM) and populated views without disturbing
                  seeded data. */}
              {isAdmin && (
                <button
                  onClick={() => setDemoEmptyMode(!workbookState.isEmptyTenant)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors border ${
                    workbookState.isEmptyTenant
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                      : 'bg-surface text-text-secondary border-border hover:text-primary hover:border-primary/30'
                  }`}
                  title={
                    workbookState.isEmptyTenant
                      ? 'Currently showing first-time admin view. Click to see populated workbook.'
                      : 'Click to preview the first-time admin view (no book, no CRM connected)'
                  }
                >
                  <Sparkles size={11} />
                  Demo · {workbookState.isEmptyTenant ? 'First-time' : 'Populated'}
                </button>
              )}
            </div>
          </div>

          {/* Empty-book hero — first-entry experience for admins post-signup.
              Shown when no territory book AND no CRM connected. Disappears
              once the admin uploads a CSV or connects Salesforce/HubSpot. */}
          {isAdmin && workbookState.isEmptyTenant && (
            <div className="mt-4">
              <EmptyBookHero
                onUploadCsv={() => navigate('/admin/territory')}
                onConnectCrm={() => navigate('/admin/apps')}
                whitespaceCount={whitespaceCount}
                onExploreWhitespace={() => handleSourceChange('whitespace')}
              />
            </div>
          )}

          {/* Value-prop banner — Enrich → Sync → Activate */}
          <div className="mt-3 px-3 py-2 rounded-md bg-gradient-to-r from-primary/5 via-violet-500/5 to-emerald-500/5 border border-border flex items-center gap-3 text-[11px] flex-wrap">
            <Sparkles size={11} className="text-primary flex-shrink-0" />
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Wand2 size={10} className="text-violet-700 dark:text-violet-300" />
              <span><span className="font-semibold text-text-primary">Enrich</span> with HG signals</span>
              <span className="text-text-muted mx-0.5">→</span>
              <Upload size={10} className="text-emerald-700 dark:text-emerald-300" />
              <span><span className="font-semibold text-text-primary">Sync</span> to Salesforce</span>
              <span className="text-text-muted mx-0.5">→</span>
              <Sparkles size={10} className="text-primary" />
              <span><span className="font-semibold text-text-primary">Activate</span> with briefs, emails, contacts</span>
            </div>
            {isAdmin ? (
              <button
                onClick={() => navigate('/admin/plays')}
                className="ml-auto inline-flex items-center gap-1 text-primary hover:underline font-semibold"
              >
                Configure Plays →
              </button>
            ) : (
              <span className="ml-auto text-[10px] text-text-muted italic">
                Powered by HG technographic · intent · IT spend · AI spend data
              </span>
            )}
          </div>

          {/* Filter strip — lens + signal kinds. Hidden for sellers (their
              workbook columns already show per-offering scores + signal
              insights inline) AND for admins (their All Companies view uses
              the source column + sales-play filter for slicing). */}
          {!isSeller && !isAdmin && (
          <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px]">
            <Filter size={10} className="text-text-muted" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Lens:</span>
            <button
              onClick={() => updateLens('all')}
              className={`px-2 py-1 rounded border transition-colors ${
                currentView.filters?.offeringId === 'all'
                  ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              All offerings
            </button>
            {listOfferings().map((o) => {
              const active = currentView.filters?.offeringId === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => updateLens(o.id)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                    active
                      ? `${o.bg} ${o.textColor} ${o.borderColor}`
                      : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Package size={9} />
                  {o.name}
                </button>
              );
            })}
            <span className="text-text-muted">·</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Signals:</span>
            {SIGNAL_KINDS.map((k) => {
              const active = (currentView.filters?.signalKinds || []).includes(k.id);
              return (
                <button
                  key={k.id}
                  onClick={() => toggleSignalKind(k.id)}
                  className={`px-2 py-1 rounded border transition-colors ${
                    active
                      ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                      : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {k.label}
                </button>
              );
            })}
          </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {hgFilters.length > 0 && (
            <div className="mb-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mr-1">
                Filters:
              </span>
              {hgFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterPanelOpen(true)}
                  className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md text-[11px] bg-primary/10 border border-primary/30 text-primary hover:bg-primary/15 transition-colors"
                  title="Click to edit"
                >
                  <span className="text-text-muted text-[9px] uppercase tracking-wider">
                    {f.group}:
                  </span>
                  <span className="font-medium">{f.label}</span>
                  {f.displayValue && (
                    <span className="text-text-secondary font-mono text-[10px]">
                      {f.displayValue}
                    </span>
                  )}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      removeHgFilter(f.id);
                    }}
                    className="ml-0.5 p-0.5 rounded hover:bg-primary/20 text-primary/70 hover:text-primary transition-colors cursor-pointer"
                    title="Remove filter"
                  >
                    <X size={10} />
                  </span>
                </button>
              ))}
              <button
                onClick={clearHgFilters}
                className="ml-1 text-[10px] text-rose-600 hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
          {currentView?.filters?.lookalikeOf && source === 'whitespace' && (
            <div className="mb-2 px-3 py-2 rounded-md bg-violet-500/5 border border-violet-500/30 text-[11px] text-violet-700 dark:text-violet-300 inline-flex items-center gap-2">
              <Wand2 size={11} />
              <span>
                Lookalike list — accounts similar to{' '}
                <span className="font-semibold">{currentView.filters.lookalikeOf}</span>. Add the strongest
                fits to your book.
              </span>
            </div>
          )}
          <div className="text-[11px] text-text-muted mb-2">
            {source === 'all'
              ? 'All Companies · '
              : source === 'whitespace'
              ? 'Whitespace · '
              : source === 'needs_review'
              ? 'Needs Review · '
              : isAdmin ? 'Tenant Book · ' : 'My book · '}
            {sortedAccounts.length} accounts
            {currentView.filters?.offeringId && currentView.filters.offeringId !== 'all' && (
              <> · filtered by {getOffering(currentView.filters.offeringId)?.name} lens</>
            )}
            {enrichedCols.length > 0 && <> · {enrichedCols.length} AI-enriched column{enrichedCols.length === 1 ? '' : 's'}</>}
            {source === 'whitespace' && (
              <> · click a row to preview · <span className="font-mono">Add to book</span> writes to Salesforce via the agent</>
            )}
            {source === 'needs_review' && (
              <> · CRM accounts with no HG match — resolve domain or accept as private</>
            )}
            {source === 'all' && (
              <> · all companies in HG + your CRM · the <span className="font-semibold">Source</span> column shows where each came from</>
            )}
          </div>

          {sortedAccounts.length === 0 ? (
            source === 'needs_review' ? (
              <div className="bg-surface border border-dashed border-amber-500/30 rounded-md p-10 text-center">
                <AlertCircle size={20} className="mx-auto text-amber-500 mb-2" />
                <h3 className="text-sm font-semibold text-text-primary mb-1">Nothing needs review</h3>
                <p className="text-xs text-text-secondary max-w-md mx-auto">
                  Accounts in your CRM with no HG match will land here. Resolve them by accepting the closest match
                  candidate or marking them as private companies.
                </p>
              </div>
            ) : (
              <div className="bg-surface border border-dashed border-border rounded-md p-10 text-center">
                <Layers size={20} className="mx-auto text-text-muted mb-2" />
                <h3 className="text-sm font-semibold text-text-primary mb-1">No accounts match this view</h3>
                <p className="text-xs text-text-secondary mb-3">
                  Try clearing the lens, removing signal filters, or switching to "All accounts" view.
                </p>
                <button onClick={() => updateLens('all')} className="text-xs text-primary hover:underline">
                  Clear lens
                </button>
              </div>
            )
          ) : isSeller ? (
            <SellerWorkbookTable
              accounts={sortedAccounts}
              offerings={tableOfferings}
              onOpenAccount={(a) => navigate(`/account/${a.id}`)}
              onOpenAccountChat={(a) => navigate(`/account/${a.id}?tab=chat`)}
              enrichedCols={enrichedCols}
              onRemoveEnrichedColumn={handleRemoveColumn}
            />
          ) : viewMode === 'segmented' ? (
            <WorkbookSegmented
              accounts={sortedAccounts}
              offerings={listOfferings()}
              source={source}
              onOpenAccount={(a) => navigate(`/account/${a.id}`)}
              onActivate={(a, offeringId) => navigate(`/account/${a.id}?offering=${offeringId}`)}
              onAddToBook={(a, offeringId) => {
                setAddToBookAccount(a);
                setAddToBookDefaultOffering(offeringId);
              }}
              onViewAll={(offeringId) => {
                setViewMode('flat');
                updateLens(offeringId);
              }}
            />
          ) : (
            // Admin flat view: same columns as Alex (seller) plus Source
            // icons + HG Intelligence (AI-synthesized lead-with + co-sell).
            <SellerWorkbookTable
              accounts={sortedAccounts}
              offerings={tableOfferings}
              onOpenAccount={(a) => handleRowClick(a)}
              onOpenAccountChat={(a) => navigate(`/account/${a.id}?tab=chat`)}
              showSourceColumn
              showHgIntelligence
              enrichedCols={enrichedCols}
              onRemoveEnrichedColumn={handleRemoveColumn}
            />
          )}

          <div className="mt-4 text-[11px] text-text-muted max-w-3xl leading-relaxed">
            <strong className="text-text-secondary">How the workbook works:</strong> Click a row to open the
            account in the current offering lens. Use{' '}
            <strong className="text-text-secondary">Enrich with AI</strong> to ask any question across all
            rows — answers become permanent columns. Save your filters + columns as a view for daily reuse.
          </div>
        </div>
      </div>

      {/* Modals */}
      <SaveAsModal
        open={saveAsOpen}
        currentView={currentView}
        onClose={() => setSaveAsOpen(false)}
        onSave={handleSaveAs}
      />
      <EnrichmentModal
        open={enrichOpen}
        accounts={sortedAccounts}
        currentView={currentView}
        onClose={() => setEnrichOpen(false)}
        onAddColumn={handleAddEnrichedColumn}
        lensOfferingId={currentView.filters?.offeringId}
        source={source}
      />
      <FilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={hgFilters}
        onAddOrUpdate={addOrUpdateHgFilter}
        onRemove={removeHgFilter}
        onClearAll={clearHgFilters}
      />
      <AnimatePresence>
        {previewAccount && (
          <WhitespacePreviewDrawer
            account={previewAccount}
            lensOfferingId={currentView.filters?.offeringId || 'all'}
            onClose={() => setPreviewAccount(null)}
            onAddToBook={handleStartAddToBook}
          />
        )}
      </AnimatePresence>
      <AddToBookModal
        open={!!addToBookAccount}
        account={addToBookAccount}
        defaultOfferingId={addToBookDefaultOffering}
        onClose={() => setAddToBookAccount(null)}
        onConfirm={handleConfirmAddToBook}
        onOpenAdminApps={() => {
          setAddToBookAccount(null);
          navigate('/admin/apps');
        }}
      />

      {/* Sync to Salesforce (admin only) */}
      <SyncToCrmModal
        open={syncOpen}
        personaId={personaId}
        accounts={sortedAccounts}
        view={currentView}
        onClose={() => setSyncOpen(false)}
        onConfirm={(now) => {
          setSyncOpen(false);
          setLastSyncState(now);
          showToast(`Synced ${sortedAccounts.length} accounts to Salesforce`, 'success');
        }}
      />

      {/* Setup Coach — floating widget for RevOps admins to complete remaining
          onboarding steps (scoring, CRM/CSV, territory, sellers, SSO). */}
      {persona.roleType === 'admin' && <SetupCoach />}
    </div>
  );
}
