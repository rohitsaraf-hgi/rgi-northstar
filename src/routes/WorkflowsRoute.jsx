import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Workflow,
  ArrowLeft,
  Plus,
  Search,
  Clock,
  Layers,
  AlertCircle,
  Library,
  Bot,
  Database,
  Zap,
  Hand,
  TrendingUp,
} from 'lucide-react';
import { workflowSummary, triggerSummary } from '../data/workflows.js';
import { listEffectiveWorkflows, subscribeWorkflowStore } from '../data/workflowStore.js';
import { WORKFLOW_STATUSES, MODE_BADGES } from '../data/workflowNodes.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'draft', label: 'Draft' },
  { id: 'disabled', label: 'Disabled' },
  { id: 'paused', label: 'Paused' },
];

function StatusChip({ status }) {
  const cfg = WORKFLOW_STATUSES[status];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ModeChip({ mode, count }) {
  if (!count) return null;
  const cfg = MODE_BADGES[mode];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
      {count} {cfg.label.toLowerCase()}
    </span>
  );
}

function TriggerIcon({ workflow }) {
  const nodes = workflow?.tree?.nodes || {};
  for (const node of Object.values(nodes)) {
    if (node.type === 'trigger.signal') return <Zap size={11} className="text-rose-700 dark:text-rose-300" />;
    if (node.type === 'trigger.manual') return <Hand size={11} className="text-text-secondary" />;
    if (node.type === 'trigger.scheduled') return <Clock size={11} className="text-text-secondary" />;
  }
  return null;
}

export { StatusChip, ModeChip };

function WorkflowCard({ workflow, onOpen }) {
  const summary = workflowSummary(workflow);
  const trigger = triggerSummary(workflow);
  const isPaused = workflow.status === 'paused' || workflow.status === 'disabled';

  return (
    <motion.button
      onClick={() => onOpen(workflow.id)}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full text-left bg-surface border rounded-md p-4 hover:border-primary/30 hover:shadow-card transition-all group ${
        isPaused ? 'border-amber-500/30' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Workflow size={13} className="text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary leading-tight truncate group-hover:text-primary transition-colors">
              {workflow.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-muted">
              <span>v{workflow.current_version} · by {workflow.created_by} ({workflow.created_by_role})</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusChip status={workflow.status} />
        </div>
      </div>

      <p className="text-xs text-text-secondary leading-relaxed mb-3 pl-9">{workflow.description}</p>

      <div className="pl-9 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold flex items-center gap-1">
            <TriggerIcon workflow={workflow} />
            {trigger}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-text-secondary flex-wrap">
          <ModeChip mode="agentic" count={summary.agentic} />
          <ModeChip mode="deterministic" count={summary.deterministic} />
          {workflow.status === 'active' && workflow.runs_this_week > 0 && (
            <span className="flex items-center gap-1">
              <TrendingUp size={10} className="text-text-muted" />
              <span className="font-semibold text-text-primary">{workflow.runs_this_week}</span>
              <span className="text-text-muted">runs/wk</span>
            </span>
          )}
          {workflow.success_rate_pct != null && (
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
              {workflow.success_rate_pct}% success
            </span>
          )}
          {workflow.last_evaluated && (
            <span className="flex items-center gap-1 text-text-muted">
              <Clock size={10} />
              {workflow.last_evaluated}
            </span>
          )}
        </div>
      </div>

      {workflow.bound_signal && (
        <div className="mt-3 ml-9 px-2 py-1 bg-rose-500/5 border border-rose-500/20 rounded text-[10px] text-rose-700 dark:text-rose-300 inline-flex items-center gap-1.5">
          <Zap size={9} />
          Triggered by signal: <span className="font-mono">{workflow.bound_signal}</span>
        </div>
      )}
    </motion.button>
  );
}

function EmptyState({ filterId, onClear }) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-md p-10 text-center">
      <Workflow size={20} className="mx-auto mb-3 text-text-muted" />
      <h3 className="text-sm font-semibold text-text-primary mb-1">No workflows match</h3>
      <p className="text-xs text-text-secondary mb-3">
        {filterId === 'all'
          ? 'Compose your first workflow — bind it to a signal for the full loop.'
          : `No workflows with status "${WORKFLOW_STATUSES[filterId]?.label || filterId}".`}
      </p>
      {filterId !== 'all' && (
        <button onClick={onClear} className="text-xs text-primary hover:underline">
          Show all workflows
        </button>
      )}
    </div>
  );
}

export default function WorkflowsRoute() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [storeTick, setStoreTick] = useState(0);

  useEffect(() => subscribeWorkflowStore(() => setStoreTick((t) => t + 1)), []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const all = useMemo(() => listEffectiveWorkflows(), [storeTick]);

  const filtered = useMemo(() => {
    let list = all;
    if (filter !== 'all') list = list.filter((w) => w.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.created_by.toLowerCase().includes(q),
      );
    }
    return list;
  }, [all, filter, search]);

  const counts = useMemo(() => {
    const c = { all: all.length };
    for (const w of all) c[w.status] = (c[w.status] || 0) + 1;
    return c;
  }, [all]);

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Admin Hub
      </button>

      <div className="mb-2 text-xs text-text-muted">Platform & Ops · Workflows</div>

      <div className="flex items-end justify-between mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Workflow Studio</h1>
        <button
          onClick={() => navigate('/admin/workflows/new')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
        >
          <Plus size={12} />
          New workflow
        </button>
      </div>

      <p className="text-sm text-text-secondary mb-6 max-w-3xl">
        Compose agentic and deterministic steps into workflows your sellers can run. Trigger from a signal,
        from a manual @-mention, or on a schedule. Mix Phoenix agents with API calls to HG, CRM, Outreach,
        and Marketo. Every workflow logs outcomes — that&rsquo;s the data flywheel.
      </p>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-surface border border-border rounded-md p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${
                filter === f.id ? 'bg-primary/15 text-primary font-semibold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {f.label}
              <span className={`text-[10px] font-mono ${filter === f.id ? 'text-primary' : 'text-text-muted'}`}>
                {counts[f.id] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/admin/workflows/templates')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
        >
          <Library size={12} />
          HG Templates
        </button>

        <div className="flex-1 relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows..."
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-surface border border-border rounded-md text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState filterId={filter} onClear={() => setFilter('all')} />
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <WorkflowCard key={w.id} workflow={w} onOpen={(id) => navigate(`/admin/workflows/${id}`)} />
          ))}
        </div>
      )}

      <div className="mt-8 text-[11px] text-text-muted leading-relaxed max-w-3xl border-t border-border pt-4">
        <span className="font-semibold text-text-secondary">How workflows work:</span> Each workflow is a DAG
        of heterogeneous nodes — Phoenix agents (LLM-powered), API calls to HG/CRM/Outreach/Marketo
        (deterministic), branches, checkpoints, waits, and outcome loggers. Bind a workflow to a signal so it
        runs automatically when accounts cross the threshold; or expose it as a manual @-mention for
        sellers. Outcomes captured here feed the per-tenant scoring model.
      </div>
    </div>
  );
}
