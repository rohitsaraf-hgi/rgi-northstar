import { useMemo, useState } from 'react';
import { X, Workflow, Search, Sparkles, Zap, Hand, Clock, ArrowRight, Library } from 'lucide-react';
import { listWorkflows } from '../../data/workflows.js';
import { listWorkflowTemplates } from '../../data/workflowTemplates.js';
import { WORKFLOW_NODE_TYPES } from '../../data/workflowNodes.js';
import { getPlayType } from '../../data/plays.js';

// Trigger-type compatibility rules (spec §):
//   Outbound plays are admin-activated → need workflows that run on manual /
//   scheduled invocation (no external event).
//   Inbound plays fire on an event → need workflows whose trigger matches
//   the play's chosen trigger type.
function workflowTriggerFor(workflow) {
  const nodes = workflow?.tree?.nodes || {};
  for (const node of Object.values(nodes)) {
    const meta = WORKFLOW_NODE_TYPES[node.type];
    if (meta?.isTrigger) return node.type;
  }
  return null;
}

function isWorkflowCompatibleWith(workflow, play) {
  const trigger = workflowTriggerFor(workflow);
  if (!trigger) return false;
  const playType = getPlayType(play);
  if (playType === 'outbound') {
    return trigger === 'trigger.manual' || trigger === 'trigger.scheduled';
  }
  // inbound — match the play's chosen trigger, or accept trigger.signal if
  // the play hasn't picked one yet.
  const playTrigger = play?.activation?.triggerType || 'signal';
  const map = {
    signal: ['trigger.signal'],
    champion_job_change: ['trigger.champion_job_change'],
    event_fired: ['trigger.event_fired'],
    crm_field_updated: ['trigger.crm_field_updated'],
  };
  return (map[playTrigger] || ['trigger.signal']).includes(trigger);
}

function triggerChip(triggerType) {
  const meta = {
    'trigger.manual':               { label: 'Manual',           Icon: Hand,   color: 'text-text-secondary', bg: 'bg-surface-2' },
    'trigger.scheduled':            { label: 'Scheduled',        Icon: Clock,  color: 'text-text-secondary', bg: 'bg-surface-2' },
    'trigger.signal':               { label: 'Signal',           Icon: Zap,    color: 'text-rose-700 dark:text-rose-300',   bg: 'bg-rose-500/10' },
    'trigger.champion_job_change':  { label: 'Champion moves',   Icon: Zap,    color: 'text-rose-700 dark:text-rose-300',   bg: 'bg-rose-500/10' },
    'trigger.event_fired':          { label: 'Event',            Icon: Zap,    color: 'text-rose-700 dark:text-rose-300',   bg: 'bg-rose-500/10' },
    'trigger.crm_field_updated':    { label: 'CRM field update', Icon: Zap,    color: 'text-rose-700 dark:text-rose-300',   bg: 'bg-rose-500/10' },
  }[triggerType] || { label: 'Unknown', Icon: Zap, color: 'text-text-muted', bg: 'bg-surface-2' };
  return meta;
}

function WorkflowCard({ workflow, isTemplate, isRecommended, onAttach }) {
  const triggerType = workflowTriggerFor(workflow);
  const chip = triggerChip(triggerType);
  const ChipIcon = chip.Icon;
  return (
    <button
      onClick={() => onAttach(workflow)}
      className={`w-full text-left rounded-md border transition-all p-3 group ${
        isRecommended ? 'border-primary/40 bg-primary/5 hover:border-primary/60' : 'border-border bg-surface hover:border-primary/30 hover:bg-surface-2'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Workflow size={14} className="text-emerald-700 dark:text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-text-primary truncate">{workflow.name}</span>
            {isRecommended && (
              <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-primary/15 text-primary inline-flex items-center gap-0.5">
                <Sparkles size={8} />
                Recommended
              </span>
            )}
            {isTemplate && (
              <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                Template
              </span>
            )}
            <span className={`text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded ${chip.bg} ${chip.color} inline-flex items-center gap-0.5`}>
              <ChipIcon size={8} />
              {chip.label}
            </span>
          </div>
          <p className="text-[11px] text-text-secondary leading-snug mt-1 line-clamp-2">
            {workflow.description}
          </p>
        </div>
        <ArrowRight size={12} className="text-text-muted mt-1 flex-shrink-0 group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
}

export default function PlayWorkflowPicker({ play, recommendedWorkflowId, onAttach, onClose }) {
  const [search, setSearch] = useState('');

  const workflows = useMemo(() => listWorkflows(), []);
  const templates = useMemo(() => listWorkflowTemplates(), []);

  // Anything already attached shouldn't appear in the picker.
  const alreadyAttached = new Set(play?.recommended_workflows || []);

  const filterAndSearch = (list) => {
    return list
      .filter((w) => !alreadyAttached.has(w.id))
      .filter((w) => isWorkflowCompatibleWith(w, play))
      .filter((w) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (
          (w.name || '').toLowerCase().includes(q) ||
          (w.description || '').toLowerCase().includes(q)
        );
      });
  };

  const templateResults = filterAndSearch(templates);
  const workflowResults = filterAndSearch(workflows);

  // Recommended entry — surface at the top of the templates group.
  const recommended = recommendedWorkflowId
    ? [...templates, ...workflows].find((w) => w.id === recommendedWorkflowId && !alreadyAttached.has(w.id))
    : null;

  const playType = getPlayType(play);
  const triggerLabel = playType === 'inbound'
    ? (play?.activation?.triggerType || 'signal').replace(/_/g, ' ')
    : 'admin activation';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <div className="bg-bg border border-border rounded-lg shadow-modal max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <Workflow size={15} className="text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Attach a workflow to &ldquo;{play.name}&rdquo;</h2>
              <p className="text-[11px] text-text-muted">
                Showing workflows compatible with <span className="font-semibold text-text-secondary">{playType}</span> &middot; trigger: <span className="font-mono">{triggerLabel}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-2 rounded transition-colors text-text-secondary"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-shrink-0 px-5 py-2 border-b border-border">
          <div className="relative">
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

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {recommended && !search && (
            <div>
              <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wider text-primary font-semibold">
                <Sparkles size={10} />
                For this play&rsquo;s motion
              </div>
              <WorkflowCard workflow={recommended} isTemplate isRecommended onAttach={onAttach} />
            </div>
          )}

          {templateResults.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                <Library size={10} />
                HG templates ({templateResults.length})
              </div>
              <div className="space-y-2">
                {templateResults
                  .filter((w) => w.id !== recommended?.id)
                  .map((w) => (
                    <WorkflowCard key={w.id} workflow={w} isTemplate onAttach={onAttach} />
                  ))}
              </div>
            </div>
          )}

          {workflowResults.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                <Workflow size={10} />
                Your workflows ({workflowResults.length})
              </div>
              <div className="space-y-2">
                {workflowResults.map((w) => (
                  <WorkflowCard key={w.id} workflow={w} onAttach={onAttach} />
                ))}
              </div>
            </div>
          )}

          {templateResults.length === 0 && workflowResults.length === 0 && !recommended && (
            <div className="text-center py-10 text-text-muted">
              <Workflow size={20} className="mx-auto mb-2" />
              <p className="text-xs">
                {search
                  ? 'No workflows match your search.'
                  : `No compatible workflows for this ${playType} play. Change the trigger type or create a new workflow.`}
              </p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-[10px] text-text-muted leading-snug max-w-md">
            The workflow will run automatically when this play activates (outbound) or when its trigger fires (inbound).
          </p>
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
