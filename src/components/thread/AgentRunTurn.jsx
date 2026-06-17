import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  ChevronRight,
  ChevronDown,
  Check,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Send,
  X,
} from 'lucide-react';
import { AGENTS, CAPABILITY_TIERS } from '../../data/agents.js';
import { findPlaybookById } from '../../data/playbooks.js';
import SurfaceBadge from '../shared/SurfaceBadge.jsx';
import LiveAccountBriefV2 from './live/LiveAccountBriefV2.jsx';
import LiveOpportunityFinder from './live/LiveOpportunityFinder.jsx';

function StepIcon({ status }) {
  if (status === 'done') {
    return (
      <div className="w-4 h-4 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
        <Check size={9} className="text-success" />
      </div>
    );
  }
  if (status === 'running') {
    return (
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
        <Loader2 size={11} className="text-primary animate-spin" />
      </div>
    );
  }
  return <div className="w-4 h-4 rounded-full border border-border-2 flex-shrink-0" />;
}

function CapabilityBadge({ capability }) {
  const cfg = CAPABILITY_TIERS[capability];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border}`}
      title={cfg.desc}
    >
      <ShieldCheck size={9} />
      {cfg.label}
    </span>
  );
}

function ArtifactPreview({ artifact }) {
  if (!artifact) return null;
  return (
    <div className="mt-3 border border-border rounded-md bg-bg/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-bg/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
            {artifact.kind || 'Artifact'}
          </span>
          <span className="text-xs font-semibold text-text-primary">{artifact.title}</span>
        </div>
        {artifact.meta && (
          <span className="text-[10px] text-text-muted">{artifact.meta}</span>
        )}
      </div>
      <div className="p-3 space-y-2">
        {artifact.sections?.map((s, i) => (
          <div key={i}>
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-0.5">
              {s.heading}
            </div>
            <div className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
              {s.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgentRunTurn({ turn, onApprove, onDismiss }) {
  const [stepsOpen, setStepsOpen] = useState(false);
  const isPlaybook = !!turn.playbookId;
  const playbook = isPlaybook ? findPlaybookById(turn.playbookId) : null;
  const agent = !isPlaybook && turn.agentId ? AGENTS[turn.agentId] : null;

  const headerLabel = isPlaybook
    ? playbook?.name || turn.playbookId
    : agent?.label || turn.agentId;
  const handleLabel = isPlaybook
    ? `@${(turn.playbookId || '').replace(/-flow$/, '').replace(/-/g, '_')}`
    : `@${turn.agentId}`;

  const allDone = turn.steps?.every((s) => s.status === 'done');
  const isRunning = turn.steps?.some((s) => s.status === 'running');
  const isPending = turn.capability === 'draft' && allDone && !turn.approved;

  const surfaceVariant =
    turn.surface === 'slack'
      ? 'border-purple-500/30 bg-purple-500/5'
      : turn.surface === 'mcp'
      ? 'border-amber-500/30 bg-amber-500/5'
      : 'border-primary/25 bg-primary/[0.04]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 rounded-lg border ${surfaceVariant}`}
    >
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center gap-2 flex-wrap border-b border-border/40">
        <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
          <Bot size={12} className="text-emerald-700 dark:text-emerald-300" />
        </div>
        <span className="text-xs font-semibold text-text-primary">{headerLabel}</span>
        <span className="text-[10px] text-text-muted font-mono">{handleLabel}</span>
        {turn.target && (
          <span className="text-[11px] text-text-secondary">· {turn.target}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {turn.capability && <CapabilityBadge capability={turn.capability} />}
          {turn.surface && <SurfaceBadge surface={turn.surface} size="xs" />}
          {turn.timestamp && (
            <span className="text-[10px] text-text-muted">{turn.timestamp}</span>
          )}
        </div>
      </div>

      {/* Step breadcrumb */}
      <button
        onClick={() => setStepsOpen((v) => !v)}
        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-bg/40 transition-colors text-left"
      >
        {stepsOpen ? (
          <ChevronDown size={12} className="text-text-muted" />
        ) : (
          <ChevronRight size={12} className="text-text-muted" />
        )}
        <span className="text-[11px] text-text-muted font-mono">
          {turn.steps?.length || 0} step{(turn.steps?.length || 0) === 1 ? '' : 's'}
          {turn.runId && ` · ${turn.runId}`}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          {isRunning ? (
            <>
              <Loader2 size={10} className="text-primary animate-spin" />
              <span className="text-[10px] text-primary">Running</span>
            </>
          ) : allDone ? (
            <>
              <Check size={10} className="text-success" />
              <span className="text-[10px] text-success">Complete</span>
            </>
          ) : null}
        </div>
      </button>

      <AnimatePresence>
        {stepsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 space-y-1.5">
              {turn.steps?.map((step, i) => {
                const stepAgent = step.agentId ? AGENTS[step.agentId] : null;
                return (
                  <div key={i} className="flex items-start gap-2 pl-1">
                    <div className="mt-0.5">
                      <StepIcon status={step.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {stepAgent && (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono">
                            @{step.agentId}
                          </span>
                        )}
                        <span className="text-[11px] text-text-secondary font-mono">
                          {step.tool}
                        </span>
                        {step.durationMs != null && step.status === 'done' && (
                          <span className="text-[10px] text-text-muted">
                            · {step.durationMs}ms
                          </span>
                        )}
                      </div>
                      {step.detail && (
                        <div className="text-[11px] text-text-muted leading-snug">
                          {step.detail}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final summary */}
      {turn.summary && allDone && (
        <div className="px-3 pb-3">
          <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {turn.summary}
          </div>
        </div>
      )}

      {/* Artifact — rich-kind artifacts render via specialized components;
          everything else uses the basic sections preview. */}
      {turn.artifact && allDone && (
        <div className="px-3 pb-3">
          {turn.artifact.kind === 'BRIEF_V2' ? (
            <LiveAccountBriefV2 target={turn.artifact.target} />
          ) : turn.artifact.kind === 'OPPORTUNITY_LIST' ? (
            <LiveOpportunityFinder />
          ) : (
            <ArtifactPreview artifact={turn.artifact} />
          )}
        </div>
      )}

      {/* Approval action for Draft capability */}
      {isPending && (
        <div className="px-3 py-2.5 bg-amber-500/[0.06] border-t border-amber-500/20 flex items-center gap-2 flex-wrap">
          <AlertTriangle size={12} className="text-amber-700 dark:text-amber-300 flex-shrink-0" />
          <span className="text-xs text-text-primary flex-1 min-w-0">
            Drafted — awaiting your approval before executing.
          </span>
          <button
            onClick={() => onDismiss && onDismiss(turn.id)}
            className="px-2 py-1 text-[11px] text-text-secondary hover:text-text-primary hover:bg-bg/60 rounded transition-colors flex items-center gap-1"
          >
            <X size={10} />
            Discard
          </button>
          <button
            onClick={() => onApprove && onApprove(turn.id)}
            className="px-2.5 py-1 text-[11px] bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors flex items-center gap-1"
          >
            <Send size={10} />
            Approve & send
          </button>
        </div>
      )}

      {/* Approved confirmation */}
      {turn.approved && (
        <div className="px-3 py-2 bg-success/10 border-t border-success/20 flex items-center gap-2">
          <Check size={11} className="text-success" />
          <span className="text-[11px] text-success font-medium">
            Approved · {turn.approvedDetail || 'sent'}
          </span>
        </div>
      )}
    </motion.div>
  );
}
