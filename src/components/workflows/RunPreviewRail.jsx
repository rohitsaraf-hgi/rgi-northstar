import { useMemo, useState, useEffect } from 'react';
import { RefreshCw, Play, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { WORKFLOW_NODE_TYPES, NODE_FAMILIES, MODE_BADGES } from '../../data/workflowNodes.js';
import { SAMPLE_ACCOUNTS } from '../../data/signalEval.js';
import { computeWorkflowDepth } from '../../data/workflowGraph.js';

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

// Simulate workflow execution — topological order, mock latency + token cost per step.
function simulateRun(tree, account) {
  const nodeIds = Object.keys(tree.nodes || {});
  if (nodeIds.length === 0) return { steps: [], totalMs: 0, totalTokens: 0, ok: false, reason: 'Empty workflow' };

  const depth = computeWorkflowDepth(tree);
  // Order by depth, then by id for stable traversal
  const ordered = nodeIds.slice().sort((a, b) => {
    if (depth[a] !== depth[b]) return (depth[a] ?? 0) - (depth[b] ?? 0);
    return a.localeCompare(b);
  });

  const steps = [];
  let totalMs = 0;
  let totalTokens = 0;

  for (const id of ordered) {
    const node = tree.nodes[id];
    const meta = WORKFLOW_NODE_TYPES[node.type];
    if (!meta) {
      steps.push({ id, label: node.type, status: 'error', mode: 'unknown', detail: 'Unknown node type', ms: 0, tokens: 0 });
      continue;
    }
    let status = 'complete';
    let ms = meta.estCostMs || (meta.mode === 'agentic' ? 1800 : 100);
    let tokens = meta.mode === 'agentic' ? (meta.estCostTokens || 1500) : 0;
    let detail = meta.label;

    if (meta.isTrigger) {
      detail = `Triggered · ${node.config?.signal_id || node.config?.invocation || node.config?.interval || meta.label}`;
      ms = 20;
    } else if (meta.family === 'checkpoint') {
      status = 'paused';
      detail = `Awaiting ${node.config?.assignee_role || 'human'} · SLA ${node.config?.sla_hours || 24}h`;
      ms = 0;
    } else if (meta.family === 'wait') {
      status = 'paused';
      const days = node.config?.days;
      const hours = node.config?.hours;
      const until = node.config?.until;
      detail = until ? `Waiting for ${until}` : `Waiting ${days ? `${days}d` : ''}${hours ? ` ${hours}h` : ''}`.trim();
      ms = 0;
    } else if (meta.family === 'logic') {
      detail = `Branch on ${node.config?.on || 'value'} ${node.config?.op || ''} ${node.config?.value || ''}`;
      ms = 50;
    } else if (meta.family === 'api') {
      detail = `${meta.endpoint || node.type}`;
    } else if (meta.family === 'agent') {
      detail = `${meta.label} · ${node.config?.tone || node.config?.scope || node.config?.competitor || ''}`;
    } else if (meta.family === 'output') {
      detail = `Captured · ${node.config?.capture || node.config?.channel || 'outcome'}`;
      ms = 30;
    }

    // Account-based skip simulation for branches — pseudo deterministic
    if (meta.family === 'logic' && node.type === 'logic.branch') {
      const seed = (account.id?.charCodeAt(0) || 0) % 2;
      detail = `${detail} → branch ${seed === 0 ? 'A' : 'B'}`;
    }

    steps.push({
      id,
      label: meta.label,
      family: meta.family,
      mode: meta.mode,
      status,
      detail,
      ms,
      tokens,
    });
    totalMs += ms;
    totalTokens += tokens;
  }

  return { steps, totalMs, totalTokens, ok: true };
}

function StepRow({ step }) {
  const family = NODE_FAMILIES[step.family];
  let icon;
  if (step.status === 'paused') icon = <Clock size={11} className="text-amber-600 dark:text-amber-300" />;
  else if (step.status === 'error') icon = <XCircle size={11} className="text-rose-600 dark:text-rose-300" />;
  else icon = <CheckCircle2 size={11} className="text-emerald-700 dark:text-emerald-300" />;

  return (
    <div className="flex items-start gap-2 px-2 py-1.5 border-b border-border/40 last:border-b-0">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-text-primary truncate">{step.label}</span>
          {family && (
            <span className={`text-[9px] uppercase tracking-wider font-bold px-1 rounded ${family.bg} ${family.color}`}>
              {family.id}
            </span>
          )}
        </div>
        <div className="text-[10px] text-text-secondary font-mono truncate" title={step.detail}>{step.detail}</div>
      </div>
      <div className="flex-shrink-0 text-right text-[9px] font-mono">
        {step.mode === 'agentic' && step.tokens > 0 ? (
          <div className="text-emerald-700 dark:text-emerald-300">{step.tokens.toLocaleString()}t</div>
        ) : step.ms > 0 ? (
          <div className="text-text-muted">{step.ms}ms</div>
        ) : (
          <div className="text-text-muted">—</div>
        )}
      </div>
    </div>
  );
}

export default function RunPreviewRail({ tree, collapsed, onToggle }) {
  const [primaryIdx, setPrimaryIdx] = useState(0);
  const [seed, setSeed] = useState(0);
  const debouncedTree = useDebounced(tree, 600);

  const sampled = useMemo(() => {
    const all = SAMPLE_ACCOUNTS;
    const start = seed % all.length;
    return [all[start], all[(start + 1) % all.length], all[(start + 2) % all.length], all[(start + 3) % all.length]];
  }, [seed]);
  const primary = sampled[primaryIdx];

  const run = useMemo(() => simulateRun(debouncedTree, primary), [debouncedTree, primary]);

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="h-full w-10 bg-bg/40 border-l border-border flex flex-col items-center justify-start py-4 hover:bg-surface-2 transition-colors"
        title="Expand run preview"
      >
        <Play size={14} className="text-emerald-700 dark:text-emerald-300" />
        <span className="rotate-90 mt-10 text-[10px] uppercase tracking-wider text-text-muted whitespace-nowrap origin-left">
          Run preview
        </span>
      </button>
    );
  }

  const totalAgentic = run.steps.filter((s) => s.mode === 'agentic').length;
  const totalDeterministic = run.steps.filter((s) => s.mode === 'deterministic').length;
  const totalPaused = run.steps.filter((s) => s.status === 'paused').length;

  return (
    <div className="h-full bg-bg/40 border-l border-border flex flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Play size={12} className="text-emerald-700 dark:text-emerald-300" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
          Run preview
        </span>
        <button onClick={() => setSeed((s) => s + 1)} className="ml-auto p-1 text-text-muted hover:text-text-secondary transition-colors" title="Re-sample accounts">
          <RefreshCw size={10} />
        </button>
        <button onClick={onToggle} className="text-[10px] text-text-muted hover:text-text-secondary transition-colors" title="Collapse pane">
          →
        </button>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
            Simulated on account
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {sampled.map((a, i) => (
              <button
                key={a.id}
                onClick={() => setPrimaryIdx(i)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors ${
                  primaryIdx === i ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                }`}
              >
                <span
                  className="w-3 h-3 rounded flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                  style={{ background: a.logoColor }}
                >
                  {a.name.charAt(0)}
                </span>
                <span className="truncate">{a.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step trace */}
        <div className="bg-surface border border-border rounded-md overflow-hidden">
          <div className="px-2 py-1.5 border-b border-border bg-bg/30 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
              Execution trace · {run.steps.length} steps
            </span>
          </div>
          {run.steps.length === 0 ? (
            <div className="p-3 text-[11px] text-text-muted italic flex items-start gap-1.5">
              <AlertCircle size={10} className="flex-shrink-0 mt-0.5" />
              <span>Add nodes to simulate execution.</span>
            </div>
          ) : (
            <div>
              {run.steps.map((s) => (
                <StepRow key={s.id} step={s} />
              ))}
            </div>
          )}
        </div>

        {/* Run cost shape */}
        <div className="bg-surface border border-border rounded-md p-3">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
            Run cost shape
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Agentic steps</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-300">{totalAgentic}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Deterministic steps</span>
              <span className="font-mono text-sky-700 dark:text-sky-300">{totalDeterministic}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Paused (checkpoint/wait)</span>
              <span className="font-mono text-amber-700 dark:text-amber-300">{totalPaused}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-1.5 mt-1">
              <span className="text-text-secondary">Est. LLM tokens</span>
              <span className="font-mono text-text-primary font-semibold">{run.totalTokens.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Active compute</span>
              <span className="font-mono text-text-primary font-semibold">{run.totalMs}ms</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-text-muted italic">
            Simulated — real runs measure actual latency + token usage per step.
          </div>
        </div>
      </div>
    </div>
  );
}
