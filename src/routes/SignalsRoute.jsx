import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowLeft,
  Plus,
  Search,
  Clock,
  Database,
  Layers,
  AlertCircle,
  Library,
} from 'lucide-react';
import {
  SOURCE_FAMILIES,
  SIGNAL_STATUSES,
  OUTPUT_TYPES,
  sourcesInSignal,
} from '../data/signals.js';
import { listEffectiveSignals, subscribeSignalStore } from '../data/signalStore.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'draft', label: 'Draft' },
  { id: 'disabled', label: 'Disabled' },
];

function SourceChip({ family }) {
  const cfg = SOURCE_FAMILIES[family];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
}

function StatusChip({ status }) {
  const cfg = SIGNAL_STATUSES[status];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function OutputTypeBadge({ type }) {
  const cfg = OUTPUT_TYPES[type];
  if (!cfg) return null;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-text-secondary bg-bg/40 border border-border">
      → {cfg.label.toLowerCase()}
    </span>
  );
}

function SignalCard({ signal, onOpen }) {
  const sources = sourcesInSignal(signal);
  const firingPct =
    signal.accounts_firing_today != null && signal.total_accounts
      ? Math.round((signal.accounts_firing_today / signal.total_accounts) * 100 * 10) / 10
      : null;
  const isDisabled = signal.status === 'disabled';

  return (
    <motion.button
      onClick={() => onOpen(signal.id)}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full text-left bg-surface border rounded-md p-4 hover:border-primary/30 hover:shadow-card transition-all group ${
        isDisabled ? 'border-amber-500/30' : 'border-border'
      }`}
    >
      {/* Top row: name + status */}
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Sparkles size={13} className="text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary leading-tight truncate group-hover:text-primary transition-colors">
              {signal.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-muted">
              <span>
                v{signal.current_version} · by {signal.created_by} ({signal.created_by_role})
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <OutputTypeBadge type={signal.output_type} />
          <StatusChip status={signal.status} />
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-text-secondary leading-relaxed mb-3 pl-9">
        {signal.description}
      </p>

      {/* Bottom row: sources + stats */}
      <div className="pl-9 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
            Sources:
          </span>
          {sources.length === 0 ? (
            <span className="text-[10px] text-text-muted italic">none</span>
          ) : (
            sources.map((s) => <SourceChip key={s} family={s} />)
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-text-secondary">
          {signal.status === 'active' && signal.accounts_firing_today != null && (
            <span className="flex items-center gap-1">
              <Layers size={10} className="text-text-muted" />
              <span className="font-semibold text-text-primary">
                {signal.accounts_firing_today}
              </span>
              <span className="text-text-muted">firing</span>
              {firingPct != null && (
                <span className="text-text-muted font-mono">({firingPct}%)</span>
              )}
            </span>
          )}
          {signal.bound_plays.length > 0 && (
            <span className="flex items-center gap-1">
              <Library size={10} className="text-text-muted" />
              <span className="font-semibold text-text-primary">
                {signal.bound_plays.length}
              </span>
              <span className="text-text-muted">
                play{signal.bound_plays.length === 1 ? '' : 's'} bound
              </span>
            </span>
          )}
          {signal.last_evaluated && (
            <span className="flex items-center gap-1 text-text-muted">
              <Clock size={10} />
              {signal.last_evaluated}
            </span>
          )}
        </div>
      </div>

      {/* Disabled banner */}
      {isDisabled && signal.disabled_reason && (
        <div className="mt-3 ml-9 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
          <AlertCircle size={11} />
          {signal.disabled_reason}
        </div>
      )}
    </motion.button>
  );
}

function EmptyState({ filterId, onClear }) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-md p-10 text-center">
      <Sparkles size={20} className="mx-auto mb-3 text-text-muted" />
      <h3 className="text-sm font-semibold text-text-primary mb-1">No signals match</h3>
      <p className="text-xs text-text-secondary mb-3">
        {filterId === 'all'
          ? 'Build your first signal to compose plays around it.'
          : `No signals with status "${SIGNAL_STATUSES[filterId]?.label || filterId}".`}
      </p>
      {filterId !== 'all' && (
        <button
          onClick={onClear}
          className="text-xs text-primary hover:underline"
        >
          Show all signals
        </button>
      )}
    </div>
  );
}

export default function SignalsRoute() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [storeTick, setStoreTick] = useState(0);

  useEffect(() => subscribeSignalStore(() => setStoreTick((t) => t + 1)), []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allSignals = useMemo(() => listEffectiveSignals(), [storeTick]);

  const filtered = useMemo(() => {
    let list = allSignals;
    if (filter !== 'all') list = list.filter((s) => s.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.created_by.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allSignals, filter, search]);

  const counts = useMemo(() => {
    const c = { all: allSignals.length, active: 0, draft: 0, disabled: 0 };
    for (const s of allSignals) c[s.status] = (c[s.status] || 0) + 1;
    return c;
  }, [allSignals]);

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Admin Hub
      </button>

      <div className="mb-2 text-xs text-text-muted">Platform & Ops · Signals</div>

      <div className="flex items-end justify-between mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Signal Studio</h1>
        <button
          onClick={() => navigate('/admin/signals/new')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
        >
          <Plus size={12} />
          New signal
        </button>
      </div>

      <p className="text-sm text-text-secondary mb-6 max-w-3xl">
        Tenant-specific business signals composed from HG technographics, your CRM, and event streams.
        Signals power the plays your sellers run — and feed scoring models that rank accounts. Every signal
        is versioned and auto-migrates bound plays forward.
      </p>

      {/* Filter + search row */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-surface border border-border rounded-md p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${
                filter === f.id
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {f.label}
              <span
                className={`text-[10px] font-mono ${
                  filter === f.id ? 'text-primary' : 'text-text-muted'
                }`}
              >
                {counts[f.id] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/admin/signals/templates')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
          title="HG-curated starter templates by vertical"
        >
          <Library size={12} />
          HG Templates
        </button>

        <div className="flex-1 relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search signals..."
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-surface border border-border rounded-md text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState filterId={filter} onClear={() => setFilter('all')} />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <SignalCard key={s.id} signal={s} onOpen={(id) => navigate(`/admin/signals/${id}`)} />
          ))}
        </div>
      )}

      {/* Helper note */}
      <div className="mt-8 text-[11px] text-text-muted leading-relaxed max-w-3xl border-t border-border pt-4">
        <span className="font-semibold text-text-secondary">How signals work:</span> An admin describes the
        business signal in plain language, the system proposes a tree of sources + rules + thresholds, and the
        admin refines visually. Each signal evaluates per account on event triggers (with nightly rollup), and
        its output value is consumed by HG Pulse, signal-conditioned plays, and scoring models downstream.
      </div>
    </div>
  );
}

export { SignalCard, SourceChip, StatusChip, OutputTypeBadge };
