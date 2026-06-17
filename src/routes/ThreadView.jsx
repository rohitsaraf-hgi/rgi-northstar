import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { THREADS } from '../data/threads.js';
import { CONVERSATIONS, AI_RESPONSE_TEMPLATES, RERUN_TURNS } from '../data/conversations.js';
import {
  getRuntimeThread,
  getRuntimeConversation,
  getRuntimeRailState,
  setRuntimeRailState,
} from '../data/runtimeThreads.js';
import { detectStage, runStage } from '../data/tamSamSomScript.js';
import { useAIThinking } from '../context/AIThinkingContext.jsx';
import ThreadHeader from '../components/thread/ThreadHeader.jsx';
import ConversationTurn from '../components/thread/ConversationTurn.jsx';
import ConversationInput from '../components/thread/ConversationInput.jsx';
import ContextRail from '../components/thread/ContextRail.jsx';
import PromoteModal from '../components/thread/PromoteModal.jsx';
import ApprovalBanner from '../components/thread/ApprovalBanner.jsx';
import CapabilityBoundaryCard from '../components/thread/CapabilityBoundaryCard.jsx';
import { USE_CASE_MODULE_MAP } from '../data/modules.js';
import { useDemo } from '../context/DemoContext.jsx';
import { usePersona } from '../context/PersonaContext.jsx';
import {
  parseAgentInvocation,
  buildAgentTurn,
  planAgentRun,
  approveAgentTurn,
  discardAgentTurn,
} from '../lib/agentEngine.js';

const SUGGESTION_CHIPS = {
  'fintech-icp-q2': [
    'Confirm export plan',
    'Re-score with looser headcount band',
    'Generate executive summary',
  ],
  'apac-tam': [
    'Reply to Priya on SAM definition',
    'Add EMEA comparison',
    'Generate phased launch brief',
  ],
  'meridian-deal': [
    'Refresh stakeholder signals',
    'Generate outreach sequence',
    'Export to Salesforce',
    'Share this thread',
  ],
};

const DEFAULT_SUGGESTIONS = [
  'Refresh data',
  'Generate summary',
  'Export findings',
  'Share thread',
];

function buildStarterTurn(thread) {
  return {
    id: 'starter',
    role: 'ai',
    timestamp: 'Just now',
    content: `This thread is ready. ${thread.summary || ''} What would you like to do first?`,
  };
}

// For TAM/SAM/SOM adaptive forms, freeze the user's selection into the live
// component's props so when the form re-renders (after submit) it shows the
// locked-state UI with the right selection.
function freezeFormProps(formType, payload) {
  switch (formType) {
    case 'CSVDropzone':
      return { submitted: true };
    case 'CompetitorPicker':
      return { submitted: true, selectedCompetitors: payload.competitors };
    case 'ICPSourcePicker':
      return { submitted: true, selectedSource: payload.source };
    case 'SpendCategoryPicker':
      return { submitted: true, selectedCategories: payload.categories };
    case 'ThresholdSliders':
      return { submitted: true, selectedThresholds: payload };
    case 'MarketBuilder':
      return { submitted: true, lockedState: payload };
    case 'ScoringProfileBuilder':
      return { submitted: true, lockedState: payload };
    default:
      return { submitted: true };
  }
}

// Map a form type to the script stage that handles its submission.
function formStageFor(formType) {
  switch (formType) {
    case 'CSVDropzone':
      return 'csvSubmitted';
    case 'CompetitorPicker':
      return 'competitorSubmitted';
    case 'MarketBuilder':
      return 'marketLocked';
    case 'ScoringProfileBuilder':
      return 'scoringApplied';
    case 'TamSamSomWhitespaceList.save':
    case 'ScoredCompanyList.save':
      return 'saveList';
    case 'ScoredCompanyList.export':
      return 'exportToCrm';
    default:
      return null;
  }
}

export default function ThreadView({ collaborative = false, ownerPersonaId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const thread = THREADS[id] || getRuntimeThread(id);
  const { simulateThinking } = useAIThinking();
  const { persona } = usePersona();
  const { config: demoConfig } = useDemo();

  const isAdaptive = thread?.adaptive === true;

  const initialTurns = useMemo(() => {
    if (!thread) return [];
    return CONVERSATIONS[id] || getRuntimeConversation(id) || [buildStarterTurn(thread)];
  }, [id, thread]);

  const [turns, setTurns] = useState(initialTurns);
  const [railState, setRailState] = useState(() => (isAdaptive ? getRuntimeRailState(id) || {} : {}));
  const [isResponding, setIsResponding] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [isCollab, setIsCollab] = useState(collaborative);
  const scrollRef = useRef(null);

  useEffect(() => {
    setTurns(initialTurns);
    setIsCollab(collaborative);
    if (isAdaptive) {
      setRailState(getRuntimeRailState(id) || {});
    }
  }, [id, initialTurns, collaborative, isAdaptive]);

  // Persist rail state to runtime store whenever it changes
  useEffect(() => {
    if (isAdaptive && id) setRuntimeRailState(id, railState);
  }, [railState, id, isAdaptive]);

  // Auto-invoke on mount — fires when the thread was created with an
  // autoInvoke directive (e.g., from the Workbench Opportunity Finder tile).
  // Builds an agent turn and schedules step updates exactly like a manually
  // typed @-invocation.
  const autoInvokeFiredRef = useRef(false);
  useEffect(() => {
    if (autoInvokeFiredRef.current) return;
    if (!thread?.autoInvoke) return;
    autoInvokeFiredRef.current = true;
    const { playbookId, agentId, target } = thread.autoInvoke;
    const userTurn = {
      id: `u-auto-${Date.now()}`,
      role: 'user',
      timestamp: 'Just now',
      content: `@${(playbookId || agentId || '').replace(/-flow$/, '').replace(/-/g, '_')} ${target || ''}`.trim(),
    };
    const agentTurn = buildAgentTurn({
      agentId,
      playbookId,
      target: target || 'Top 20',
      surface: 'thread',
      invokedBy: { name: persona.name, initials: persona.initials, color: persona.avatarColor },
      audience: persona.isNew ? 'new_ae' : 'tenured_ae',
      personaPolicy: persona.agentPolicy,
    });
    setTurns((prev) => [...prev, userTurn, agentTurn]);
    const updates = planAgentRun(agentTurn);
    updates.forEach(([delay, mutate]) => {
      setTimeout(() => setTurns((prev) => mutate(prev)), delay);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id]);

  // Rerun-on-mount: when navigated with ?rerun=<assetId>, append the rerun
  // turns to demonstrate that saved LISTs are recomputed, not snapshots.
  useEffect(() => {
    const rerunAssetId = searchParams.get('rerun');
    if (!rerunAssetId) return;
    const rerunTurns = RERUN_TURNS[rerunAssetId];
    if (!rerunTurns) return;

    let cancelled = false;
    (async () => {
      setTurns((prev) => [...prev, rerunTurns[0]]);
      setIsResponding(true);
      await simulateThinking(900, 1300);
      if (cancelled) return;
      setTurns((prev) => [...prev, rerunTurns[1]]);
      setIsResponding(false);
      const next = new URLSearchParams(searchParams);
      next.delete('rerun');
      setSearchParams(next, { replace: true });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, searchParams.get('rerun')]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, isResponding]);

  if (!thread) {
    return (
      <div className="p-8 text-text-secondary">
        Thread not found.{' '}
        <button onClick={() => navigate('/workspace')} className="text-primary hover:underline">
          Back to workspace
        </button>
      </div>
    );
  }

  const audienceKey = persona.isNew ? 'new_ae' : 'tenured_ae';

  // ===== Adaptive thread: advance the script =====
  const advanceStage = async (stageId, payload = {}, opts = {}) => {
    const result = runStage(stageId, payload);
    if (!result) return;

    // If the stage has a synthesized user text (form-submit narration), append it
    if (result.userText && opts.includeUserText) {
      const userTurn = {
        id: `u-${Date.now()}`,
        role: 'user',
        timestamp: 'Just now',
        content: result.userText,
      };
      setTurns((prev) => [...prev, userTurn]);
    }

    setIsResponding(true);
    await simulateThinking(900, 1400);

    setTurns((prev) => [...prev, ...result.aiTurns]);
    if (result.railState && Object.keys(result.railState).length > 0) {
      setRailState((prev) => ({ ...prev, ...result.railState }));
    }
    setIsResponding(false);
  };

  const handleSend = async (text) => {
    const userTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      timestamp: 'Just now',
      content: text,
    };
    setTurns((prev) => [...prev, userTurn]);

    // Agent invocation? Skip the AI template and run the agent engine instead.
    const invocation = parseAgentInvocation(text);
    if (invocation) {
      const agentTurn = buildAgentTurn({
        agentId: invocation.agentId,
        playbookId: invocation.playbookId,
        target: invocation.target,
        surface: thread.type === 'channel' ? (thread.origin?.startsWith('slack') ? 'slack' : 'mcp') : 'thread',
        invokedBy: { name: persona.name, initials: persona.initials, color: persona.avatarColor },
        audience: audienceKey,
        personaPolicy: persona.agentPolicy,
      });
      setTurns((prev) => [...prev, agentTurn]);

      const updates = planAgentRun(agentTurn);
      updates.forEach(([delay, mutate]) => {
        setTimeout(() => {
          setTurns((prev) => mutate(prev));
        }, delay);
      });
      return;
    }

    // Adaptive thread: try to detect a script stage from the user's text
    if (isAdaptive) {
      const stageId = detectStage(text, railState);
      if (stageId === 'enrichment') {
        // Special: enrichment runs the @crm_enrichment playbook via agent engine
        const agentTurn = buildAgentTurn({
          playbookId: 'crm-enrichment-flow',
          target: 'Saved SOM list',
          surface: 'thread',
          invokedBy: { name: persona.name, initials: persona.initials, color: persona.avatarColor },
          audience: 'all',
          personaPolicy: persona.agentPolicy,
        });
        setTurns((prev) => [...prev, agentTurn]);
        const updates = planAgentRun(agentTurn);
        updates.forEach(([delay, mutate]) => {
          setTimeout(() => setTurns((prev) => mutate(prev)), delay);
        });
        return;
      }
      if (stageId) {
        await advanceStage(stageId, { text });
        return;
      }
    }

    // Generic fallback
    setIsResponding(true);
    await simulateThinking();

    const template = AI_RESPONSE_TEMPLATES[Math.floor(Math.random() * AI_RESPONSE_TEMPLATES.length)];
    const aiTurn = {
      id: `a-${Date.now()}`,
      role: 'ai',
      timestamp: 'Just now',
      content: template,
    };
    setTurns((prev) => [...prev, aiTurn]);
    setIsResponding(false);
  };

  // ===== Form-turn submit + action handler =====
  const handleLiveSubmit = async (formTurnId, formType, payload) => {
    // Action types (save/export/enrich on lists) — don't lock the source turn,
    // it stays interactive. Just advance the script.
    const isAction = formType.includes('.');

    // Special: Enrichment fires the crm_enrichment playbook via the agent engine.
    if (formType.endsWith('.enrich')) {
      const agentTurn = buildAgentTurn({
        playbookId: 'crm-enrichment-flow',
        target: `Saved SOM list (${payload?.length || 15} accounts)`,
        surface: 'thread',
        invokedBy: { name: persona.name, initials: persona.initials, color: persona.avatarColor },
        audience: 'all',
        personaPolicy: persona.agentPolicy,
      });
      const userTurn = {
        id: `u-${Date.now()}`,
        role: 'user',
        timestamp: 'Just now',
        content: 'Mark for CRM Enrichment',
      };
      setTurns((prev) => [...prev, userTurn, agentTurn]);
      const updates = planAgentRun(agentTurn);
      updates.forEach(([delay, mutate]) => {
        setTimeout(() => setTurns((prev) => mutate(prev)), delay);
      });
      return;
    }

    if (!isAction) {
      // Lock the form turn into its submitted state.
      setTurns((prev) =>
        prev.map((t) =>
          t.id === formTurnId
            ? {
                ...t,
                live: {
                  ...t.live,
                  props: { ...(t.live?.props || {}), ...freezeFormProps(formType, payload) },
                },
              }
            : t
        )
      );
    }

    const stageId = formStageFor(formType);
    if (stageId) {
      await advanceStage(stageId, payload, { includeUserText: true });
    }
  };

  // Scroll the conversation to a specific turn (used by the right-rail "View" jumps).
  const handleJumpToTurn = (turnId) => {
    const el = document.getElementById(`turn-${turnId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ===== Existing handlers =====
  const handleAgentApprove = (turnId) => {
    setTurns((prev) => approveAgentTurn(prev, turnId));
  };
  const handleAgentDismiss = (turnId) => {
    setTurns((prev) => discardAgentTurn(prev, turnId));
  };

  const handleFilterRemove = async (filter) => {
    const systemTurn = {
      id: `s-${Date.now()}`,
      role: 'system',
      content: `Filter removed: ${filter.label} = ${filter.value}`,
    };
    setTurns((prev) => [...prev, systemTurn]);
    setIsResponding(true);

    await simulateThinking(900, 1300);

    const liveProps =
      filter.id === 'employees'
        ? { variant: 'noEmployeesFilter', highlight: 'sam' }
        : { variant: 'initial', highlight: 'som' };

    const aiTurn = {
      id: `a-${Date.now()}`,
      role: 'ai',
      timestamp: 'Just now',
      content:
        filter.id === 'employees'
          ? 'Recomputed without the headcount filter. SAM grows from 3,840 to 5,210 companies (+36%) and SOM expands to 2,480. Most of the lift comes from sub-500 fintechs in SG and HK that you were previously excluding. Worth a look — but those companies tend to convert at a lower rate in our NA data.'
          : `Updated. The "${filter.label}" filter is removed and the market sizing has been recomputed.`,
      live: { type: 'MarketSize', props: liveProps },
    };
    setTurns((prev) => [...prev, aiTurn]);
    setIsResponding(false);
  };

  const handlePinLive = (live) => {
    // Visual-only feedback. The toast fires from the component's pin button.
  };

  const handlePromoteConfirm = () => {
    setIsCollab(true);
    navigate(`/collaborate/${id}`);
  };

  // Suggestions: derive from the latest AI turn that carries them, otherwise
  // fall back to the static map / defaults.
  const suggestions = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      const t = turns[i];
      if (t.role === 'ai' && Array.isArray(t.suggestions) && t.suggestions.length > 0) {
        return t.suggestions;
      }
    }
    return SUGGESTION_CHIPS[id] || DEFAULT_SUGGESTIONS;
  }, [turns, id]);

  const stageMap = thread ? USE_CASE_MODULE_MAP[thread.useCaseId] : null;
  const scoreRequiredModule = stageMap?.stages[2];
  const showCapabilityBoundary =
    !isAdaptive &&
    scoreRequiredModule &&
    !demoConfig.modulesOwned.includes(scoreRequiredModule);

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0 border-r border-border">
        <ThreadHeader thread={thread} onPromote={() => setPromoteOpen(true)} />

        {thread.pendingApproval && <ApprovalBanner approval={thread.pendingApproval} />}

        {isCollab && (
          <div className="px-6 py-2.5 bg-primary/10 border-b border-primary/20 flex items-center gap-2 text-xs">
            <span className="text-base">🤝</span>
            <span className="text-text-primary font-medium">Collaborative Workspace</span>
            <span className="text-text-secondary">·</span>
            <span className="text-text-secondary">{thread.participants.length} participants</span>
            <span className="text-text-secondary">·</span>
            {thread.participants.map((pid, i) => {
              const labels = { maya: 'Maya Patel', priya: 'Priya Sharma', jordan: 'Jordan Chen' };
              const isOwner = pid === thread.owner;
              return (
                <span key={pid} className="text-text-secondary">
                  {labels[pid]} ({isOwner ? 'Owner' : 'Contributor'}){i < thread.participants.length - 1 ? ',' : ''}
                </span>
              );
            })}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto">
            {turns.map((turn) => (
              <ConversationTurn
                key={turn.id}
                turn={turn}
                collaborative={isCollab}
                onPinLive={handlePinLive}
                onFilterRemove={handleFilterRemove}
                onAgentApprove={handleAgentApprove}
                onAgentDismiss={handleAgentDismiss}
                onLiveSubmit={handleLiveSubmit}
                onEditClick={handleJumpToTurn}
              />
            ))}
            {isResponding && (
              <div className="mb-6 pl-3 border-l-2 border-primary/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-primary/15 rounded-md flex items-center justify-center">
                    <Sparkles size={11} className="text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-text-primary">RGI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
                </div>
              </div>
            )}
            {!isResponding && showCapabilityBoundary && (
              <CapabilityBoundaryCard
                moduleId={scoreRequiredModule}
                label="the Score stage"
                dismissText="Continue without scoring"
              />
            )}
          </div>
        </div>

        <ConversationInput onSend={handleSend} suggestions={suggestions} disabled={isResponding} />
      </div>

      {!isAdaptive && (
        <div className="w-[340px] flex-shrink-0">
          <ContextRail thread={thread} collaborative={isCollab} />
        </div>
      )}

      <PromoteModal
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        thread={thread}
        onConfirm={handlePromoteConfirm}
        ownerPersonaId={thread.persona}
      />
    </div>
  );
}
