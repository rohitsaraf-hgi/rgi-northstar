import { useNavigate, useParams } from 'react-router-dom';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { ArrowLeft, Workflow, Save, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import {
  emptyWorkflowTree,
  cloneWorkflowTree,
  addWorkflowNode,
  removeWorkflowNode,
  addWorkflowEdge,
  updateWorkflowNodeConfig,
  setWorkflowOutputNode,
  validateWorkflowTree,
} from '../data/workflowGraph.js';
import {
  getEffectiveWorkflow,
  getWorkflowDraftPayload,
  saveWorkflowDraft,
  publishWorkflow,
  nextWorkflowId,
} from '../data/workflowStore.js';
import WorkflowCanvas from '../components/workflows/WorkflowCanvas.jsx';
import WorkflowNodePalette from '../components/workflows/WorkflowNodePalette.jsx';
import WorkflowNodeInspector from '../components/workflows/WorkflowNodeInspector.jsx';
import WorkflowConversationPane from '../components/workflows/WorkflowConversationPane.jsx';
import RunPreviewRail from '../components/workflows/RunPreviewRail.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { proposeWorkflowFromIntent, applyWorkflowRefinement } from '../data/workflowAgent.js';
import { subscribeIntegrationGovernance } from '../data/integrationGovernance.js';

export default function WorkflowBuilderRoute() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();

  const isNew = !id;
  const sourceWorkflow = !isNew ? getEffectiveWorkflow(id) : null;
  const draftPayload = !isNew ? getWorkflowDraftPayload(id) : null;

  const [workflowId, setWorkflowId] = useState(id || null);

  const [tree, setTree] = useState(() => {
    if (draftPayload?.tree) return cloneWorkflowTree(draftPayload.tree);
    if (sourceWorkflow?.tree) return cloneWorkflowTree(sourceWorkflow.tree);
    return emptyWorkflowTree();
  });
  const [meta, setMeta] = useState(() => {
    if (draftPayload?.meta) return { ...draftPayload.meta };
    return {
      name: sourceWorkflow?.name || 'Untitled workflow',
      description: sourceWorkflow?.description || '',
      audience_roles: sourceWorkflow?.audience_roles || ['AE', 'AM'],
      bound_signal: sourceWorkflow?.bound_signal || null,
    };
  });
  const [conversation, setConversation] = useState(() => draftPayload?.conversation || []);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectingFromId, setConnectingFromId] = useState(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  useEffect(() => {
    if (!connectingFromId) return;
    const handler = (e) => {
      if (e.key === 'Escape') setConnectingFromId(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [connectingFromId]);

  // Re-validate when integration agent-access changes elsewhere (e.g., admin
  // toggles in /admin/apps in another tab).
  const [govTick, setGovTick] = useState(0);
  useEffect(() => subscribeIntegrationGovernance(() => setGovTick((t) => t + 1)), []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const validation = useMemo(() => validateWorkflowTree(tree), [tree, govTick]);

  const handleAddNode = useCallback(
    (type) => {
      const { tree: nextTree, id: newId } = addWorkflowNode(tree, type);
      setTree(nextTree);
      setSelectedNodeId(newId);
    },
    [tree],
  );

  const handleDeleteNode = useCallback(
    (nodeId) => {
      setTree((t) => removeWorkflowNode(t, nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      if (connectingFromId === nodeId) setConnectingFromId(null);
    },
    [selectedNodeId, connectingFromId],
  );

  const handleUpdateConfig = useCallback((nodeId, patch) => {
    setTree((t) => updateWorkflowNodeConfig(t, nodeId, patch));
  }, []);

  const handleStartConnect = useCallback((nodeId) => {
    setConnectingFromId(nodeId);
  }, []);

  const handleCompleteConnect = useCallback(
    (toId) => {
      if (!connectingFromId) return;
      const result = addWorkflowEdge(tree, connectingFromId, toId);
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        setTree(result.tree);
        showToast('Edge added', 'success');
      }
      setConnectingFromId(null);
    },
    [connectingFromId, tree, showToast],
  );

  const handleSetOutput = useCallback(
    (nodeId) => {
      setTree((t) => setWorkflowOutputNode(t, nodeId));
      showToast('Set as workflow output', 'success');
    },
    [showToast],
  );

  const handleAppendMessage = useCallback((message) => {
    setConversation((c) => [...c, { ...message, at: new Date().toISOString() }]);
  }, []);

  const handleProposeFromIntent = useCallback(
    (text) => {
      const result = proposeWorkflowFromIntent(text);
      if (!result.ok) {
        setConversation((c) => [
          ...c,
          { role: 'agent_error', narration: result.narration, suggestions: result.suggestions || [], at: new Date().toISOString() },
        ]);
        return;
      }
      setTree(result.tree);
      setMeta((m) => ({ ...m, name: result.meta.name, description: result.meta.description }));
      // If the proposed tree has a signal trigger, capture the bound_signal so it appears in the detail.
      const triggerNode = Object.values(result.tree.nodes).find((n) => n.type === 'trigger.signal');
      if (triggerNode?.config?.signal_id) {
        setMeta((m) => ({ ...m, bound_signal: triggerNode.config.signal_id }));
      }
      setSelectedNodeId(null);
      setConnectingFromId(null);
      setConversation((c) => [
        ...c,
        {
          role: 'agent',
          narration: result.narration,
          suggestions: result.suggestions || [],
          costNote: result.costNote,
          at: new Date().toISOString(),
        },
      ]);
      showToast(`Proposed: ${result.meta.name}`, 'success');
    },
    [showToast],
  );

  const handleApplySuggestion = useCallback(
    (suggestion) => {
      if (!suggestion?.applies) return;
      const result = applyWorkflowRefinement(tree, suggestion.applies);
      setTree(result.tree);
      setConversation((c) => [
        ...c,
        { role: 'user', content: `Apply: ${suggestion.label}`, at: new Date().toISOString() },
        { role: 'agent', narration: result.narration, at: new Date().toISOString() },
      ]);
      showToast(suggestion.label, 'success');
    },
    [tree, showToast],
  );

  const ensureWorkflowId = () => {
    if (workflowId) return workflowId;
    const next = nextWorkflowId(meta.name);
    setWorkflowId(next);
    return next;
  };

  // Keep bound_signal in sync with whatever the trigger.signal config says
  // (so the detail "Bound Signal" tab + signal detail "Bound Workflows" stay correct).
  const effectiveMeta = useMemo(() => {
    const triggerNode = Object.values(tree.nodes || {}).find((n) => n.type === 'trigger.signal');
    const boundFromTrigger = triggerNode?.config?.signal_id || null;
    return { ...meta, bound_signal: boundFromTrigger ?? meta.bound_signal ?? null };
  }, [meta, tree.nodes]);

  const handleSaveDraft = () => {
    const targetId = ensureWorkflowId();
    saveWorkflowDraft(targetId, { tree, meta: effectiveMeta, conversation });
    showToast(`Draft saved · ${Object.keys(tree.nodes).length} nodes`, 'success');
  };

  const handlePublish = () => {
    if (!validation.ok) {
      const errors = validation.issues.filter((i) => i.severity === 'error').length;
      showToast(`Cannot publish — ${errors} validation error${errors === 1 ? '' : 's'}`, 'error');
      return;
    }
    const targetId = ensureWorkflowId();
    const summary =
      typeof window !== 'undefined'
        ? window.prompt('Summary for this version (visible in history):', 'Published from builder')
        : 'Published from builder';
    if (summary === null) return;
    const result = publishWorkflow(
      targetId,
      { tree, meta: effectiveMeta, conversation },
      { summary: summary || 'Published from builder' },
    );
    if (result.ok) {
      showToast(`Published v${result.version}`, 'success');
      navigate(`/admin/workflows/${targetId}`);
    } else {
      showToast(result.error || 'Publish failed', 'error');
    }
  };

  const errorCount = validation.issues.filter((i) => i.severity === 'error').length;
  const warningCount = validation.issues.filter((i) => i.severity === 'warning').length;

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-border bg-bg/95 backdrop-blur-sm px-6 py-3">
        <button
          onClick={() => navigate(sourceWorkflow ? `/admin/workflows/${sourceWorkflow.id}` : '/admin/workflows')}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-2 transition-colors"
        >
          <ArrowLeft size={11} />
          {sourceWorkflow ? sourceWorkflow.name : 'Workflow Studio'}
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Workflow size={16} className="text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={meta.name}
              onChange={(e) => setMeta((m) => ({ ...m, name: e.target.value }))}
              placeholder="Workflow name..."
              className="w-full bg-transparent text-lg font-semibold text-text-primary focus:outline-none border-b border-transparent focus:border-primary/40 transition-colors"
            />
            <input
              type="text"
              value={meta.description}
              onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
              placeholder="Short description..."
              className="w-full bg-transparent text-xs text-text-secondary focus:outline-none mt-0.5"
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 text-[10px]">
              {validation.ok ? (
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold uppercase tracking-wider">
                  <CheckCircle2 size={10} />
                  Valid
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-semibold uppercase tracking-wider">
                  <AlertCircle size={10} />
                  {errorCount} error{errorCount === 1 ? '' : 's'}
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold uppercase tracking-wider">
                  {warningCount} warn
                </span>
              )}
            </div>
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors"
            >
              <Save size={11} />
              Save draft
            </button>
            <button
              onClick={handlePublish}
              disabled={!validation.ok}
              className="px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Validate &amp; Publish
            </button>
          </div>
        </div>
      </div>

      {/* 3-pane workspace */}
      <div className="flex-1 flex min-h-0">
        <div className={`flex-shrink-0 transition-all duration-200 ${leftCollapsed ? 'w-10' : 'w-80'}`}>
          <WorkflowConversationPane
            collapsed={leftCollapsed}
            onToggle={() => setLeftCollapsed((c) => !c)}
            conversation={conversation}
            onAppendMessage={handleAppendMessage}
            onProposeFromIntent={handleProposeFromIntent}
            onApplySuggestion={handleApplySuggestion}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 flex">
            <div className="flex-1 min-w-0">
              <WorkflowCanvas
                tree={tree}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onDeleteNode={handleDeleteNode}
                connectingFromId={connectingFromId}
                onStartConnect={handleStartConnect}
                onCompleteConnect={handleCompleteConnect}
                onCancelConnect={() => setConnectingFromId(null)}
              />
            </div>
            <div className="w-72 flex-shrink-0 border-l border-border bg-surface flex flex-col">
              <WorkflowNodeInspector
                selectedNodeId={selectedNodeId}
                tree={tree}
                onUpdateConfig={handleUpdateConfig}
                onDeleteNode={handleDeleteNode}
                onStartConnect={handleStartConnect}
                onSetOutput={handleSetOutput}
                validationIssues={validation.issues}
              />
              <WorkflowNodePalette onAdd={handleAddNode} />
            </div>
          </div>
        </div>

        <div className={`flex-shrink-0 transition-all duration-200 ${rightCollapsed ? 'w-10' : 'w-72'}`}>
          <RunPreviewRail
            tree={tree}
            collapsed={rightCollapsed}
            onToggle={() => setRightCollapsed((c) => !c)}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-border bg-bg/95 px-6 py-1.5 flex items-center gap-3 text-[10px] text-text-muted">
        <span>{Object.keys(tree.nodes).length} nodes · {tree.edges.length} edges</span>
        <span>·</span>
        <span>
          Output: {tree.output_node ? <span className="font-mono text-text-primary">{tree.output_node}</span> : <span className="italic">none</span>}
        </span>
        <span>·</span>
        <div className="flex items-center gap-1.5">
          <Users size={10} />
          <span>Visible to:</span>
          {['AE', 'AM', 'CSM'].map((role) => {
            const active = meta.audience_roles.includes(role);
            return (
              <button
                key={role}
                onClick={() =>
                  setMeta((m) => ({
                    ...m,
                    audience_roles: active
                      ? m.audience_roles.filter((r) => r !== role)
                      : [...m.audience_roles, role],
                  }))
                }
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  active ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>
        <span className="ml-auto">
          {isNew ? 'New workflow' : `Editing ${sourceWorkflow?.name || ''}`} {workflowId && <span className="font-mono">· {workflowId}</span>}
        </span>
      </div>
    </div>
  );
}
