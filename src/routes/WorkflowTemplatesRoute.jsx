import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Library, Workflow, TrendingUp, GitFork, AlertCircle } from 'lucide-react';
import { listWorkflowTemplates, WORKFLOW_VERTICALS } from '../data/workflowTemplates.js';
import { workflowSummary, triggerSummary } from '../data/workflows.js';
import { saveWorkflowDraft, nextWorkflowId } from '../data/workflowStore.js';
import { cloneWorkflowTree } from '../data/workflowGraph.js';
import { MODE_BADGES } from '../data/workflowNodes.js';
import { useToast } from '../context/ToastContext.jsx';

function VerticalChip({ vertical, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
        active ? `${vertical.bg} ${vertical.color} font-semibold` : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
      }`}
    >
      {vertical.label}
    </button>
  );
}

function TemplateCard({ template, onFork }) {
  const summary = workflowSummary(template);
  const trigger = triggerSummary(template);
  const verticalCfg = WORKFLOW_VERTICALS.find((v) => v.id === template.vertical);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-md p-4 hover:border-primary/30 hover:shadow-card transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Workflow size={14} className="text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary leading-tight truncate">{template.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {verticalCfg && (
                <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${verticalCfg.bg} ${verticalCfg.color}`}>
                  {verticalCfg.label}
                </span>
              )}
              <span className="text-[10px] text-text-muted">HG-curated</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-text-secondary leading-relaxed mb-3">{template.description}</p>

      <div className="space-y-1.5 mb-3 text-[11px]">
        <div className="flex items-start gap-1.5 text-text-secondary">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold flex-shrink-0">Trigger:</span>
          <span className="leading-snug">{trigger}</span>
        </div>
        {template.bound_play_hint && (
          <div className="flex items-start gap-1.5 text-text-secondary">
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold flex-shrink-0">Use:</span>
            <span className="leading-snug">{template.bound_play_hint}</span>
          </div>
        )}
        {template.effectiveness_hint && (
          <div className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-300">
            <TrendingUp size={10} className="mt-0.5 flex-shrink-0" />
            <span className="leading-snug">{template.effectiveness_hint}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${MODE_BADGES.agentic.bg} ${MODE_BADGES.agentic.color}`}>
          {summary.agentic} agentic
        </span>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${MODE_BADGES.deterministic.bg} ${MODE_BADGES.deterministic.color}`}>
          {summary.deterministic} deterministic
        </span>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${MODE_BADGES.control.bg} ${MODE_BADGES.control.color}`}>
          {summary.control} control
        </span>
        {summary.estTokens > 0 && (
          <span className="text-[10px] font-mono text-text-muted">~{summary.estTokens.toLocaleString()}t/run</span>
        )}
      </div>

      {template.mapping_notes && template.mapping_notes.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1.5 mb-3">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300 font-semibold mb-0.5">
            <AlertCircle size={9} />
            Needs mapping
          </div>
          <ul className="space-y-0.5">
            {template.mapping_notes.map((note, i) => (
              <li key={i} className="text-[10px] text-text-secondary leading-snug">
                · {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <div className="text-[10px] text-text-muted font-mono">{summary.total} nodes</div>
        <button
          onClick={() => onFork(template)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-primary text-white text-[11px] rounded hover:bg-primary-dim transition-colors"
        >
          <GitFork size={10} />
          Fork to draft
        </button>
      </div>
    </motion.div>
  );
}

export default function WorkflowTemplatesRoute() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [vertical, setVertical] = useState('all');

  const templates = useMemo(() => listWorkflowTemplates(), []);
  const filtered = useMemo(
    () => (vertical === 'all' ? templates : templates.filter((t) => t.vertical === vertical)),
    [templates, vertical],
  );

  const handleFork = (template) => {
    const id = nextWorkflowId(template.name);
    const triggerNode = Object.values(template.tree.nodes).find((n) => n.type === 'trigger.signal');
    const meta = {
      name: `${template.name} (Forked)`,
      description: template.description,
      audience_roles: ['AE', 'AM'],
      bound_signal: triggerNode?.config?.signal_id || null,
    };
    saveWorkflowDraft(id, {
      tree: cloneWorkflowTree(template.tree),
      meta,
      conversation: [
        {
          role: 'agent',
          narration: `Forked from HG template "${template.name}". ${
            template.mapping_notes?.length
              ? `Review ${template.mapping_notes.length} mapping note${template.mapping_notes.length === 1 ? '' : 's'} marked in the inspector.`
              : 'Configs are pre-wired — adjust thresholds and identities for your tenant.'
          }`,
          at: new Date().toISOString(),
        },
      ],
    });
    showToast(`Forked "${template.name}" to draft`, 'success');
    navigate(`/admin/workflows/${id}/edit`);
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin/workflows')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Workflow Studio
      </button>

      <div className="mb-2 text-xs text-text-muted">Platform & Ops · Workflows · Templates</div>

      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Library size={18} className="text-emerald-700 dark:text-emerald-300" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">HG Workflow Templates</h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-3xl">
            Starter workflows curated by HG per vertical. Each demonstrates a different mix of agentic and
            deterministic steps. Fork into a draft, adjust configs for your tenant, and publish.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <VerticalChip
          vertical={{ id: 'all', label: `All (${templates.length})`, bg: 'bg-primary/15', color: 'text-primary' }}
          active={vertical === 'all'}
          onClick={() => setVertical('all')}
        />
        {WORKFLOW_VERTICALS.map((v) => {
          const count = templates.filter((t) => t.vertical === v.id).length;
          return (
            <VerticalChip
              key={v.id}
              vertical={{ ...v, label: `${v.label} (${count})` }}
              active={vertical === v.id}
              onClick={() => setVertical(v.id)}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((t) => (
          <TemplateCard key={t.id} template={t} onFork={handleFork} />
        ))}
      </div>

      <div className="mt-8 text-[11px] text-text-muted leading-relaxed max-w-3xl border-t border-border pt-4">
        <span className="font-semibold text-text-secondary">How templates work:</span> Forking creates a new
        draft in your tenant — the template stays immutable. Mode badges show the cost shape at a glance:
        agentic steps have LLM cost, deterministic steps are cheap. Aim for the right mix based on volume.
      </div>
    </div>
  );
}
