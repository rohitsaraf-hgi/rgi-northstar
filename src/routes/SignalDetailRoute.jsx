import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  ArrowLeft,
  Edit3,
  Clock,
  AlertCircle,
  History,
  Layers,
  CircleDot,
  Database,
  Filter,
  GitCompare,
  Sigma,
  TrendingUp,
  Gauge,
  BarChart3,
  Divide,
  Users,
  FileText,
} from 'lucide-react';
import {
  SIGNAL_STATUSES,
  OUTPUT_TYPES,
  NODE_TYPES,
  REFRESH_POLICIES,
  sourcesInSignal,
  nodeBreakdown,
} from '../data/signals.js';
import { getEffectiveSignal, getAuditLog, subscribeSignalStore, disableSignal, activateSignal } from '../data/signalStore.js';
import { listWorkflowsBoundToSignal, subscribeWorkflowStore } from '../data/workflowStore.js';
import { StatusChip, OutputTypeBadge, SourceChip } from './SignalsRoute.jsx';
import { useToast } from '../context/ToastContext.jsx';

const NODE_ICONS = {
  Database,
  Clock,
  Sigma,
  TrendingUp,
  Divide,
  GitCompare,
  Filter,
  CircleDot,
  BarChart3,
  Gauge,
};

const FAMILY_ACCENTS = {
  source: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
  window: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  compute: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
  rule: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
  threshold: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
};

const TABS = [
  { id: 'definition', label: 'Definition' },
  { id: 'history', label: 'History' },
  { id: 'bound', label: 'Bound Workflows' },
  { id: 'audit', label: 'Audit log' },
];

function AuditTab({ signalId }) {
  const log = getAuditLog(signalId);
  if (log.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-md p-8 text-center">
        <FileText size={18} className="mx-auto mb-2 text-text-muted" />
        <h3 className="text-sm font-semibold text-text-primary mb-1">No audit events yet</h3>
        <p className="text-xs text-text-secondary">
          Each save, publish, disable, and re-activate action will be logged here.
        </p>
      </div>
    );
  }
  // Newest first
  const entries = [...log].reverse();
  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden">
      {entries.map((e, i) => {
        const when = new Date(e.at);
        const whenStr = `${when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
        return (
          <div
            key={i}
            className={`px-4 py-2.5 ${i === 0 ? '' : 'border-t border-border'} flex items-start gap-3`}
          >
            <div className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-surface-2 text-text-secondary flex-shrink-0 w-20 text-center">
              {e.action.replace(/_/g, ' ')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-text-primary leading-snug">{e.message}</div>
              <div className="text-[10px] text-text-muted mt-0.5">
                by {e.by} · {whenStr}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Read-only summary of one node — used in the tree summary list.
function NodeRow({ id, node, isTerminal }) {
  const type = NODE_TYPES[node.type];
  if (!type) {
    return (
      <div className="text-[11px] text-text-muted italic">
        Unknown node type: {node.type}
      </div>
    );
  }
  const Icon = NODE_ICONS[type.icon] || CircleDot;
  const accent = FAMILY_ACCENTS[type.family] || 'bg-surface-2 text-text-secondary border-border';
  const configSummary = Object.entries(node.config || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');
  return (
    <div className="flex items-start gap-2 py-1.5">
      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 border ${accent}`}>
        <Icon size={11} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-text-primary">{type.label}</span>
          <span className="text-[10px] text-text-muted font-mono">{id}</span>
          {isTerminal && (
            <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              terminal
            </span>
          )}
        </div>
        {configSummary && (
          <div className="text-[11px] text-text-secondary font-mono truncate">
            {configSummary}
          </div>
        )}
      </div>
    </div>
  );
}

function DefinitionTab({ signal }) {
  const sources = sourcesInSignal(signal);
  const counts = nodeBreakdown(signal);
  const outputCfg = OUTPUT_TYPES[signal.output_type];
  const terminal = signal.tree?.output_node;
  const nodeEntries = Object.entries(signal.tree?.nodes || {});

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* Left: metadata + tree summary */}
      <div className="col-span-2 space-y-5">
        {/* Sources / output / refresh / audience grid */}
        <div className="bg-surface border border-border rounded-md p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            Configuration
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Sources</div>
              <div className="flex items-center gap-1 flex-wrap">
                {sources.length === 0 ? (
                  <span className="text-text-muted italic">none</span>
                ) : (
                  sources.map((s) => <SourceChip key={s} family={s} />)
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Output</div>
              <div className="text-text-primary">
                {outputCfg?.label}{' '}
                <span className="text-text-muted">— {outputCfg?.desc}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Refresh policy</div>
              <div className="text-text-primary">
                {REFRESH_POLICIES[signal.refresh_policy] || signal.refresh_policy}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
                Audience
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {signal.audience_roles.length === 0 ? (
                  <span className="text-text-muted italic">no roles</span>
                ) : (
                  signal.audience_roles.map((r) => (
                    <span
                      key={r}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-text-secondary border border-border"
                    >
                      {r}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Vertical tags</div>
              <div className="flex items-center gap-1 flex-wrap">
                {signal.vertical_tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg/40 text-text-secondary border border-border"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Author</div>
              <div className="text-text-primary">
                {signal.created_by}{' '}
                <span className="text-text-muted">({signal.created_by_role})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tree node summary (visual canvas is Phase 3.2) */}
        <div className="bg-surface border border-border rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Tree — {counts.total} nodes
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-text-muted">
              <span>
                <span className="text-text-secondary font-semibold">{counts.source}</span> source
              </span>
              <span>·</span>
              <span>
                <span className="text-text-secondary font-semibold">{counts.window}</span> window
              </span>
              <span>·</span>
              <span>
                <span className="text-text-secondary font-semibold">{counts.compute}</span> compute
              </span>
              <span>·</span>
              <span>
                <span className="text-text-secondary font-semibold">{counts.rule}</span> rule
              </span>
              <span>·</span>
              <span>
                <span className="text-text-secondary font-semibold">{counts.threshold}</span> threshold
              </span>
            </div>
          </div>
          <div className="divide-y divide-border/50">
            {nodeEntries.map(([id, node]) => (
              <NodeRow key={id} id={id} node={node} isTerminal={id === terminal} />
            ))}
          </div>
          <div className="mt-3 text-[10px] text-text-muted italic">
            Visual canvas with drag/drop authoring lands in Phase 3.2 (Builder shell).
          </div>
        </div>
      </div>

      {/* Right: stats */}
      <div className="space-y-3">
        <div className="bg-surface border border-border rounded-md p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            Current state
          </h3>
          {signal.status === 'active' ? (
            <>
              <div className="mb-3">
                <div className="text-2xl font-semibold text-text-primary leading-none">
                  {signal.accounts_firing_today}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted mt-1">
                  Accounts firing today
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  of {signal.total_accounts.toLocaleString()} evaluated
                </div>
              </div>
              <div className="text-[11px] text-text-secondary flex items-center gap-1">
                <Clock size={10} className="text-text-muted" />
                Last evaluated {signal.last_evaluated}
              </div>
            </>
          ) : signal.status === 'disabled' ? (
            <div className="text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
              <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
              <span>{signal.disabled_reason || 'Signal disabled — see admin for details.'}</span>
            </div>
          ) : signal.status === 'draft' ? (
            <div className="text-[11px] text-text-secondary leading-relaxed">
              Draft — not yet evaluated on the book. Publish to begin evaluation.
            </div>
          ) : (
            <div className="text-[11px] text-text-muted italic">Superseded by a newer signal.</div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-md p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            Lineage
          </h3>
          <div className="text-[11px] text-text-secondary space-y-1.5">
            <div className="flex items-center justify-between">
              <span>Current version</span>
              <span className="font-mono font-semibold text-text-primary">
                v{signal.current_version}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total versions</span>
              <span className="font-mono text-text-primary">{signal.versions.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Plays bound</span>
              <span className="font-mono text-text-primary">{signal.bound_plays.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryTab({ signal }) {
  if (signal.versions.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-md p-8 text-center">
        <History size={18} className="mx-auto mb-2 text-text-muted" />
        <h3 className="text-sm font-semibold text-text-primary mb-1">No published versions yet</h3>
        <p className="text-xs text-text-secondary">
          This signal is a draft. Publish to create v1 and begin evaluation.
        </p>
      </div>
    );
  }
  // Show newest first.
  const versions = [...signal.versions].reverse();
  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden">
      {versions.map((v, i) => (
        <div
          key={v.version}
          className={`px-4 py-3 ${i === 0 ? '' : 'border-t border-border'} flex items-start gap-3`}
        >
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
              v.version === signal.current_version
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'bg-surface-2 text-text-secondary'
            }`}
          >
            <span className="text-[10px] font-mono font-bold">v{v.version}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-text-primary">
                Version {v.version}
              </span>
              {v.version === signal.current_version && (
                <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  current
                </span>
              )}
              <span className="ml-auto text-[10px] text-text-muted">
                {v.published_at} · {v.published_by}
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{v.summary}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BoundPlaysTab({ signal, onOpenPlay }) {
  const boundWorkflows = listWorkflowsBoundToSignal(signal.id);
  if (boundWorkflows.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-md p-8 text-center">
        <Layers size={18} className="mx-auto mb-2 text-text-muted" />
        <h3 className="text-sm font-semibold text-text-primary mb-1">No workflows bound to this signal yet</h3>
        <p className="text-xs text-text-secondary mb-3">
          Open Workflow Studio and bind a workflow trigger to this signal — it will then fire automatically
          when this signal evaluates true on an account.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {boundWorkflows.map((wf) => (
        <button
          key={wf.id}
          onClick={() => onOpenPlay(wf.id)}
          className="w-full text-left bg-surface border border-border rounded-md p-3 hover:border-primary/30 transition-colors flex items-center gap-3"
        >
          <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center">
            <Sparkles size={13} className="text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-text-primary truncate">{wf.name}</div>
              {wf.status === 'active' && (
                <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  active
                </span>
              )}
            </div>
            <div className="text-[10px] text-text-muted font-mono">{wf.id}</div>
            <div className="text-[10px] text-text-secondary truncate mt-0.5">{wf.description}</div>
          </div>
          <ArrowLeft size={11} className="rotate-180 text-text-muted" />
        </button>
      ))}
    </div>
  );
}

export default function SignalDetailRoute() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const [storeTick, setStoreTick] = useState(0);

  useEffect(() => subscribeSignalStore(() => setStoreTick((t) => t + 1)), []);
  useEffect(() => subscribeWorkflowStore(() => setStoreTick((t) => t + 1)), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const signal = useMemo(() => getEffectiveSignal(id), [id, storeTick]);

  const [tab, setTab] = useState('definition');

  const handleDisable = () => {
    const result = disableSignal(id);
    if (result.ok) showToast('Signal disabled', 'info');
    else showToast(result.error || 'Could not disable', 'error');
  };
  const handleActivate = () => {
    const result = activateSignal(id);
    if (result.ok) showToast('Signal re-activated', 'success');
    else showToast(result.error || 'Could not activate', 'error');
  };

  if (!signal) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-8">
        <button
          onClick={() => navigate('/admin/signals')}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
        >
          <ArrowLeft size={11} />
          Signal Studio
        </button>
        <div className="bg-surface border border-dashed border-border rounded-md p-10 text-center">
          <AlertCircle size={20} className="mx-auto mb-2 text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">Signal not found</h3>
          <p className="text-xs text-text-secondary">
            The signal you tried to open doesn&rsquo;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin/signals')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Signal Studio
      </button>

      <div className="mb-2 text-xs text-text-muted">
        Platform & Ops · Signals · <span className="text-text-secondary">{signal.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles size={18} className="text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-semibold tracking-tight">{signal.name}</h1>
              <StatusChip status={signal.status} />
              <OutputTypeBadge type={signal.output_type} />
            </div>
            <p className="text-sm text-text-secondary leading-relaxed max-w-3xl">
              {signal.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {signal.status === 'active' && (
            <button
              onClick={handleDisable}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10 text-xs rounded-md transition-colors"
            >
              Disable
            </button>
          )}
          {signal.status === 'disabled' && (
            <button
              onClick={handleActivate}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 text-xs rounded-md transition-colors"
            >
              Re-activate
            </button>
          )}
          <button
            onClick={() => navigate(`/admin/signals/${signal.id}/edit`)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors"
          >
            <Edit3 size={11} />
            Edit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-5 flex items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-primary text-text-primary font-semibold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
            {t.id === 'history' && (
              <span className="ml-1 text-text-muted font-mono">{signal.versions.length}</span>
            )}
            {t.id === 'bound' && (
              <span className="ml-1 text-text-muted font-mono">{listWorkflowsBoundToSignal(signal.id).length}</span>
            )}
            {t.id === 'audit' && (
              <span className="ml-1 text-text-muted font-mono">{getAuditLog(signal.id).length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'definition' && <DefinitionTab signal={signal} />}
      {tab === 'history' && <HistoryTab signal={signal} />}
      {tab === 'bound' && (
        <BoundPlaysTab
          signal={signal}
          onOpenPlay={(workflowId) => navigate(`/admin/workflows/${workflowId}`)}
        />
      )}
      {tab === 'audit' && <AuditTab signalId={signal.id} />}
    </div>
  );
}
