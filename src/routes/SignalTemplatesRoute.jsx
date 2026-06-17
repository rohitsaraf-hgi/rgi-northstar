import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Library, Sparkles, TrendingUp, GitFork, Layers, AlertCircle } from 'lucide-react';
import { listTemplates, VERTICALS, getTemplate } from '../data/signalTemplates.js';
import { OUTPUT_TYPES, SOURCE_FAMILIES, nodeBreakdown, sourcesInSignal } from '../data/signals.js';
import { saveDraft, nextSignalId } from '../data/signalStore.js';
import { cloneTree } from '../data/signalGraph.js';
import { OutputTypeBadge, SourceChip } from './SignalsRoute.jsx';
import { useToast } from '../context/ToastContext.jsx';

function VerticalChip({ vertical, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
        active
          ? `${vertical.bg} ${vertical.color} font-semibold`
          : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
      }`}
    >
      {vertical.label}
    </button>
  );
}

function TemplateCard({ template, onFork }) {
  const sources = sourcesInSignal(template);
  const counts = nodeBreakdown(template);
  const verticalCfg = VERTICALS.find((v) => v.id === template.vertical);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-md p-4 hover:border-primary/30 hover:shadow-card transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary leading-tight truncate">
              {template.name}
            </h3>
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
        <OutputTypeBadge type={template.output_type} />
      </div>

      <p className="text-xs text-text-secondary leading-relaxed mb-3">{template.description}</p>

      <div className="space-y-1.5 mb-3 text-[11px]">
        {template.bound_play_hint && (
          <div className="flex items-start gap-1.5 text-text-secondary">
            <Layers size={10} className="text-text-muted mt-0.5 flex-shrink-0" />
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
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Sources:</span>
        {sources.map((s) => (
          <SourceChip key={s} family={s} />
        ))}
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
        <div className="text-[10px] text-text-muted font-mono">
          {counts.total} nodes · {counts.source} src · {counts.rule + counts.compute} ops
        </div>
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

export default function SignalTemplatesRoute() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [vertical, setVertical] = useState('all');

  const templates = useMemo(() => listTemplates(), []);
  const filtered = useMemo(
    () => (vertical === 'all' ? templates : templates.filter((t) => t.vertical === vertical)),
    [templates, vertical],
  );

  const handleFork = (template) => {
    const id = nextSignalId(template.name);
    const meta = {
      name: `${template.name} (Forked)`,
      description: template.description,
      output_type: template.output_type,
      audience_roles: ['AE', 'AM'],
    };
    saveDraft(id, {
      tree: cloneTree(template.tree),
      meta,
      conversation: [
        {
          role: 'agent',
          narration: `Forked from HG template "${template.name}". ${
            template.mapping_notes?.length
              ? `Review ${template.mapping_notes.length} source mapping${template.mapping_notes.length === 1 ? '' : 's'} marked in the inspector.`
              : 'Sources are pre-wired — adjust thresholds for your data.'
          }`,
          at: new Date().toISOString(),
        },
      ],
    });
    showToast(`Forked "${template.name}" to draft`, 'success');
    navigate(`/admin/signals/${id}/edit`);
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin/signals')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Signal Studio
      </button>

      <div className="mb-2 text-xs text-text-muted">Platform & Ops · Signals · Templates</div>

      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Library size={18} className="text-emerald-700 dark:text-emerald-300" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">HG Template Gallery</h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-3xl">
            Starter signals curated by HG per vertical. Fork into a draft, map the placeholders to your CRM
            fields and event sources, adjust thresholds, and publish. Effectiveness benchmarks come from
            anonymized cross-tenant patterns.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <VerticalChip
          vertical={{ id: 'all', label: `All (${templates.length})`, bg: 'bg-primary/15', color: 'text-primary' }}
          active={vertical === 'all'}
          onClick={() => setVertical('all')}
        />
        {VERTICALS.map((v) => {
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
        draft in your tenant — the template itself stays untouched and immutable. You can publish, version,
        and bind plays to your fork independently. HG ships new templates monthly based on patterns that
        prove out across the customer base.
      </div>
    </div>
  );
}
