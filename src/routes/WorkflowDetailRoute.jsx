import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  Workflow,
  ArrowLeft,
  Edit3,
  Clock,
  AlertCircle,
  History,
  Layers,
  Zap,
  Hand,
  CircleCheck,
  Bot,
  Database,
  GitBranch,
  Hourglass,
  CheckSquare,
  Mail,
  Send,
  Bell,
  FileText,
  Sparkles,
  Sword,
  Users,
  Calendar,
  Handshake,
  FileSearch,
  Webhook,
  Repeat,
  GitMerge,
  Eye,
  Edit,
  ListTodo,
} from 'lucide-react';
import { workflowSummary, triggerSummary } from '../data/workflows.js';
import {
  WORKFLOW_NODE_TYPES,
  NODE_FAMILIES,
  MODE_BADGES,
} from '../data/workflowNodes.js';
import {
  getEffectiveWorkflow,
  getWorkflowAuditLog,
  subscribeWorkflowStore,
  disableWorkflow,
  activateWorkflow,
} from '../data/workflowStore.js';
import { StatusChip } from './WorkflowsRoute.jsx';
import { getSignal } from '../data/signals.js';
import { useToast } from '../context/ToastContext.jsx';

const NODE_ICONS = {
  Database, Edit, ListTodo, Send, Bell, Webhook,
  GitBranch, GitMerge, Repeat,
  CheckSquare, Eye,
  Clock, Hourglass,
  CircleCheck,
  Zap, Hand,
  Mail, Sword, Users, Calendar, Sparkles, Handshake, FileSearch, Bot,
};

const TABS = [
  { id: 'definition', label: 'Definition' },
  { id: 'history', label: 'History' },
  { id: 'bound', label: 'Bound Signal' },
  { id: 'audit', label: 'Audit log' },
];

function NodeRow({ id, node, isTerminal, isOutput }) {
  const meta = WORKFLOW_NODE_TYPES[node.type];
  if (!meta) {
    return (
      <div className="text-[11px] text-text-muted italic">Unknown node type: {node.type}</div>
    );
  }
  const family = NODE_FAMILIES[meta.family];
  const Icon = NODE_ICONS[meta.icon] || Bot;
  const cfgEntries = Object.entries(node.config || {});
  const summary = cfgEntries.map(([k, v]) => `${k}: ${v}`).join(' · ');
  const modeBadge = MODE_BADGES[meta.mode];

  return (
    <div className="flex items-start gap-2 py-1.5">
      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 border ${family?.bg} ${family?.color} ${family?.border}`}>
        <Icon size={11} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-text-primary">{meta.label}</span>
          <span className="text-[10px] text-text-muted font-mono">{id}</span>
          <span className={`text-[9px] uppercase tracking-wider font-bold px-1 rounded ${modeBadge.bg} ${modeBadge.color}`}>
            {modeBadge.label}
          </span>
          {isOutput && (
            <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              terminal
            </span>
          )}
        </div>
        {summary && (
          <div className="text-[11px] text-text-secondary font-mono truncate">{summary}</div>
        )}
      </div>
    </div>
  );
}

function DefinitionTab({ workflow }) {
  const summary = workflowSummary(workflow);
  const trigger = triggerSummary(workflow);
  const nodeEntries = Object.entries(workflow.tree?.nodes || {});
  const terminal = workflow.tree?.output_node;

  return (
    <div className="grid grid-cols-3 gap-5">
      <div className="col-span-2 space-y-5">
        {/* Config grid */}
        <div className="bg-surface border border-border rounded-md p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Configuration</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Trigger</div>
              <div className="text-text-primary">{trigger}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Audience</div>
              <div className="flex items-center gap-1 flex-wrap">
                {workflow.audience_roles.length === 0 ? (
                  <span className="text-text-muted italic">no roles</span>
                ) : (
                  workflow.audience_roles.map((r) => (
                    <span key={r} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-text-secondary border border-border">
                      {r}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Verticals</div>
              <div className="flex items-center gap-1 flex-wrap">
                {workflow.vertical_tags.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg/40 text-text-secondary border border-border">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Author</div>
              <div className="text-text-primary">
                {workflow.created_by} <span className="text-text-muted">({workflow.created_by_role})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tree summary */}
        <div className="bg-surface border border-border rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Workflow tree — {summary.total} nodes
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-text-muted">
              <span><span className="text-emerald-700 dark:text-emerald-300 font-semibold">{summary.agentic}</span> agentic</span>
              <span>·</span>
              <span><span className="text-sky-700 dark:text-sky-300 font-semibold">{summary.deterministic}</span> deterministic</span>
              <span>·</span>
              <span><span className="text-text-secondary font-semibold">{summary.control}</span> control</span>
            </div>
          </div>
          <div className="divide-y divide-border/50">
            {nodeEntries.map(([id, node]) => (
              <NodeRow key={id} id={id} node={node} isOutput={id === terminal} />
            ))}
          </div>
          <div className="mt-3 text-[10px] text-text-muted italic">
            Visual canvas with drag/drop authoring lands in Phase 4.2.
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-surface border border-border rounded-md p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Performance</h3>
          {workflow.status === 'active' ? (
            <>
              <div className="mb-3">
                <div className="text-2xl font-semibold text-text-primary leading-none">
                  {workflow.runs_this_week}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted mt-1">
                  Runs this week
                </div>
              </div>
              {workflow.success_rate_pct != null && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {workflow.success_rate_pct}%
                  </span>
                  <span className="text-[10px] text-text-secondary">success rate</span>
                </div>
              )}
              <div className="text-[11px] text-text-secondary flex items-center gap-1">
                <Clock size={10} className="text-text-muted" />
                Last run {workflow.last_evaluated}
              </div>
            </>
          ) : workflow.status === 'draft' ? (
            <div className="text-[11px] text-text-secondary leading-relaxed">
              Draft — never run on real accounts. Publish to activate.
            </div>
          ) : (
            <div className="text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
              <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
              <span>Not actively running.</span>
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-md p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Cost shape</h3>
          <div className="text-[11px] text-text-secondary space-y-1.5">
            <div className="flex items-center justify-between">
              <span>Agentic steps</span>
              <span className="font-mono text-text-primary">{summary.agentic}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Deterministic steps</span>
              <span className="font-mono text-text-primary">{summary.deterministic}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Est. tokens / run</span>
              <span className="font-mono text-text-primary">~{summary.estTokens.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-md p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Lineage</h3>
          <div className="text-[11px] text-text-secondary space-y-1.5">
            <div className="flex items-center justify-between">
              <span>Current version</span>
              <span className="font-mono font-semibold text-text-primary">v{workflow.current_version}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total versions</span>
              <span className="font-mono text-text-primary">{workflow.versions.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryTab({ workflow }) {
  if (workflow.versions.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-md p-8 text-center">
        <History size={18} className="mx-auto mb-2 text-text-muted" />
        <h3 className="text-sm font-semibold text-text-primary mb-1">No published versions yet</h3>
        <p className="text-xs text-text-secondary">
          This workflow is a draft. Publish to create v1.
        </p>
      </div>
    );
  }
  const versions = [...workflow.versions].reverse();
  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden">
      {versions.map((v, i) => (
        <div key={v.version} className={`px-4 py-3 ${i === 0 ? '' : 'border-t border-border'} flex items-start gap-3`}>
          <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
            v.version === workflow.current_version
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'bg-surface-2 text-text-secondary'
          }`}>
            <span className="text-[10px] font-mono font-bold">v{v.version}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-text-primary">Version {v.version}</span>
              {v.version === workflow.current_version && (
                <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  current
                </span>
              )}
              <span className="ml-auto text-[10px] text-text-muted">{v.published_at} · {v.published_by}</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{v.summary}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BoundSignalTab({ workflow, onOpenSignal }) {
  if (!workflow.bound_signal) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-md p-8 text-center">
        <Zap size={18} className="mx-auto mb-2 text-text-muted" />
        <h3 className="text-sm font-semibold text-text-primary mb-1">No bound signal</h3>
        <p className="text-xs text-text-secondary mb-2">
          This workflow is triggered manually or on a schedule. Bind a signal to make it fire automatically.
        </p>
        <div className="text-[10px] text-text-muted italic">Signal binding flow lands in Phase 4.8.</div>
      </div>
    );
  }
  const signal = getSignal(workflow.bound_signal);
  return (
    <button
      onClick={() => onOpenSignal(workflow.bound_signal)}
      className="w-full text-left bg-surface border border-border rounded-md p-4 hover:border-primary/30 transition-colors flex items-start gap-3"
    >
      <div className="w-9 h-9 rounded-md bg-rose-500/10 flex items-center justify-center flex-shrink-0">
        <Zap size={16} className="text-rose-700 dark:text-rose-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-primary mb-0.5">{signal?.name || workflow.bound_signal}</div>
        <div className="text-[10px] text-text-muted font-mono mb-1">{workflow.bound_signal}</div>
        {signal && (
          <p className="text-xs text-text-secondary leading-relaxed">{signal.description}</p>
        )}
        <div className="mt-2 text-[10px] text-text-secondary">
          Workflow auto-fires when this signal evaluates true on an account.
        </div>
      </div>
    </button>
  );
}

function AuditTab({ workflowId }) {
  const log = getWorkflowAuditLog(workflowId);
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
  const entries = [...log].reverse();
  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden">
      {entries.map((e, i) => {
        const when = new Date(e.at);
        const whenStr = `${when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
        return (
          <div key={i} className={`px-4 py-2.5 ${i === 0 ? '' : 'border-t border-border'} flex items-start gap-3`}>
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

export default function WorkflowDetailRoute() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const [storeTick, setStoreTick] = useState(0);
  useEffect(() => subscribeWorkflowStore(() => setStoreTick((t) => t + 1)), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const workflow = useMemo(() => getEffectiveWorkflow(id), [id, storeTick]);
  const [tab, setTab] = useState('definition');

  const handleDisable = () => {
    const r = disableWorkflow(id);
    if (r.ok) showToast('Workflow disabled', 'info');
    else showToast(r.error || 'Could not disable', 'error');
  };
  const handleActivate = () => {
    const r = activateWorkflow(id);
    if (r.ok) showToast('Workflow re-activated', 'success');
    else showToast(r.error || 'Could not activate', 'error');
  };

  if (!workflow) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-8">
        <button
          onClick={() => navigate('/admin/workflows')}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
        >
          <ArrowLeft size={11} />
          Workflow Studio
        </button>
        <div className="bg-surface border border-dashed border-border rounded-md p-10 text-center">
          <AlertCircle size={20} className="mx-auto mb-2 text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">Workflow not found</h3>
          <p className="text-xs text-text-secondary">
            The workflow you tried to open doesn&rsquo;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const summary = workflowSummary(workflow);

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin/workflows')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Workflow Studio
      </button>

      <div className="mb-2 text-xs text-text-muted">
        Platform & Ops · Workflows · <span className="text-text-secondary">{workflow.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Workflow size={18} className="text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-semibold tracking-tight">{workflow.name}</h1>
              <StatusChip status={workflow.status} />
            </div>
            <p className="text-sm text-text-secondary leading-relaxed max-w-3xl">{workflow.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {workflow.status === 'active' && (
            <button
              onClick={handleDisable}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10 text-xs rounded-md transition-colors"
            >
              Disable
            </button>
          )}
          {workflow.status === 'disabled' && (
            <button
              onClick={handleActivate}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 text-xs rounded-md transition-colors"
            >
              Re-activate
            </button>
          )}
          <button
            onClick={() => navigate(`/admin/workflows/${workflow.id}/edit`)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors"
          >
            <Edit3 size={11} />
            Edit
          </button>
        </div>
      </div>

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
              <span className="ml-1 text-text-muted font-mono">{workflow.versions.length}</span>
            )}
            {t.id === 'bound' && workflow.bound_signal && (
              <span className="ml-1 text-text-muted font-mono">1</span>
            )}
            {t.id === 'audit' && (
              <span className="ml-1 text-text-muted font-mono">{getWorkflowAuditLog(workflow.id).length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'definition' && <DefinitionTab workflow={workflow} />}
      {tab === 'history' && <HistoryTab workflow={workflow} />}
      {tab === 'bound' && (
        <BoundSignalTab
          workflow={workflow}
          onOpenSignal={(sigId) => navigate(`/admin/signals/${sigId}`)}
        />
      )}
      {tab === 'audit' && <AuditTab workflowId={workflow.id} />}
    </div>
  );
}
