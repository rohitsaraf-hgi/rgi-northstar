import { useNavigate, useParams } from 'react-router-dom';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { ArrowLeft, Sparkles, Save, CheckCircle2, AlertCircle, Users, TrendingUp, X } from 'lucide-react';
import { OUTPUT_TYPES } from '../data/signals.js';
import {
  emptyTree,
  cloneTree,
  addNode,
  removeNode,
  addEdge,
  updateNodeConfig,
  setOutputNode,
  validateTree,
} from '../data/signalGraph.js';
import {
  getEffectiveSignal,
  getDraftPayload,
  saveDraft,
  publishSignal,
  nextSignalId,
} from '../data/signalStore.js';
import { proposeFromIntent, applyRefinement } from '../data/signalAgent.js';
import { detectPattern } from '../data/crossTenantPatterns.js';
import SignalCanvas from '../components/signals/SignalCanvas.jsx';
import NodePalette from '../components/signals/NodePalette.jsx';
import NodeInspector from '../components/signals/NodeInspector.jsx';
import ConversationPane from '../components/signals/ConversationPane.jsx';
import PreviewRail from '../components/signals/PreviewRail.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function SignalBuilderRoute() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();

  const isNew = !id;
  const sourceSignal = !isNew ? getEffectiveSignal(id) : null;
  const draftPayload = !isNew ? getDraftPayload(id) : null;

  // Track the signal id we publish under. For a new signal, generate one on
  // first save based on the current name.
  const [signalId, setSignalId] = useState(id || null);

  const [tree, setTree] = useState(() => {
    if (draftPayload?.tree) return cloneTree(draftPayload.tree);
    if (sourceSignal?.tree) return cloneTree(sourceSignal.tree);
    return emptyTree();
  });
  const [meta, setMeta] = useState(() => {
    if (draftPayload?.meta) return { ...draftPayload.meta };
    return {
      name: sourceSignal?.name || 'Untitled signal',
      description: sourceSignal?.description || '',
      output_type: sourceSignal?.output_type || 'boolean',
      audience_roles: sourceSignal?.audience_roles || ['AE', 'AM'],
    };
  });
  const [conversation, setConversation] = useState(() => draftPayload?.conversation || []);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectingFromId, setConnectingFromId] = useState(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Esc cancels connect mode.
  useEffect(() => {
    if (!connectingFromId) return;
    const handler = (e) => {
      if (e.key === 'Escape') setConnectingFromId(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [connectingFromId]);

  const validation = useMemo(() => validateTree(tree), [tree]);
  const pattern = useMemo(() => detectPattern(tree), [tree]);
  const [dismissedPatternId, setDismissedPatternId] = useState(null);
  const showPatternBanner = pattern && dismissedPatternId !== pattern.id;

  const handleAddNode = useCallback(
    (type) => {
      const { tree: nextTree, id: newId } = addNode(tree, type);
      setTree(nextTree);
      setSelectedNodeId(newId);
    },
    [tree],
  );

  const handleDeleteNode = useCallback(
    (nodeId) => {
      setTree((t) => removeNode(t, nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      if (connectingFromId === nodeId) setConnectingFromId(null);
    },
    [selectedNodeId, connectingFromId],
  );

  const handleUpdateConfig = useCallback((nodeId, patch) => {
    setTree((t) => updateNodeConfig(t, nodeId, patch));
  }, []);

  const handleStartConnect = useCallback((nodeId) => {
    setConnectingFromId(nodeId);
  }, []);

  const handleCompleteConnect = useCallback(
    (toId) => {
      if (!connectingFromId) return;
      const result = addEdge(tree, connectingFromId, toId);
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

  const handleSetOutput = useCallback((nodeId) => {
    setTree((t) => setOutputNode(t, nodeId));
    showToast('Set as signal output', 'success');
  }, [showToast]);

  const handleAppendMessage = useCallback((message) => {
    setConversation((c) => [...c, { ...message, at: new Date().toISOString() }]);
  }, []);

  const handleProposeFromIntent = useCallback(
    (text) => {
      const result = proposeFromIntent(text);
      if (!result.ok) {
        setConversation((c) => [
          ...c,
          { role: 'agent_error', narration: result.narration, suggestions: result.suggestions || [], at: new Date().toISOString() },
        ]);
        return;
      }
      // Replace tree + meta. We keep history of prior tree in conversation so it's recoverable.
      setTree(result.tree);
      setMeta((m) => ({ ...m, ...result.meta }));
      setSelectedNodeId(null);
      setConnectingFromId(null);
      setConversation((c) => [
        ...c,
        {
          role: 'agent',
          narration: result.narration,
          suggestions: result.suggestions || [],
          crossTenantHint: result.crossTenantHint,
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
      const result = applyRefinement(tree, suggestion.applies);
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

  const ensureSignalId = () => {
    if (signalId) return signalId;
    const next = nextSignalId(meta.name);
    setSignalId(next);
    return next;
  };

  const handleSaveDraft = () => {
    const targetId = ensureSignalId();
    saveDraft(targetId, { tree, meta, conversation });
    showToast(`Draft saved · ${Object.keys(tree.nodes).length} nodes`, 'success');
  };

  const handlePublish = () => {
    if (!validation.ok) {
      const errors = validation.issues.filter((i) => i.severity === 'error').length;
      showToast(`Cannot publish — ${errors} validation error${errors === 1 ? '' : 's'}`, 'error');
      return;
    }
    const targetId = ensureSignalId();
    // Capture a brief summary from the user — default to a sensible message
    // when they cancel the prompt.
    const summary =
      typeof window !== 'undefined'
        ? window.prompt('Summary for this version (visible in history):', 'Published from builder')
        : 'Published from builder';
    if (summary === null) return; // User cancelled
    const result = publishSignal(
      targetId,
      { tree, meta, conversation },
      { summary: summary || 'Published from builder' },
    );
    if (result.ok) {
      showToast(`Published v${result.version}`, 'success');
      navigate(`/admin/signals/${targetId}`);
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
          onClick={() => navigate(sourceSignal ? `/admin/signals/${sourceSignal.id}` : '/admin/signals')}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-2 transition-colors"
        >
          <ArrowLeft size={11} />
          {sourceSignal ? sourceSignal.name : 'Signal Studio'}
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={meta.name}
              onChange={(e) => setMeta((m) => ({ ...m, name: e.target.value }))}
              placeholder="Signal name..."
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
                  {warningCount} warning{warningCount === 1 ? '' : 's'}
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

      {/* Cross-tenant pattern banner */}
      {showPatternBanner && (
        <div className="flex-shrink-0 border-b border-emerald-500/20 bg-emerald-500/5 px-6 py-2 flex items-start gap-3">
          <TrendingUp size={14} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300">
                Cross-tenant insight
              </span>
              <span className="text-xs font-semibold text-text-primary">{pattern.headline}</span>
            </div>
            <div className="text-[11px] text-text-secondary leading-relaxed">{pattern.insight}</div>
            <div className="mt-1.5 flex items-center gap-4 flex-wrap">
              {pattern.benchmarks.map((b, i) => (
                <div key={i} className="text-[10px]">
                  <span className="text-text-muted">{b.label}:</span>{' '}
                  <span className="font-mono text-text-secondary">{b.value}</span>
                </div>
              ))}
            </div>
            {pattern.advice && (
              <div className="mt-1 text-[10px] text-emerald-700 dark:text-emerald-300 italic">
                💡 {pattern.advice}
              </div>
            )}
          </div>
          <button
            onClick={() => setDismissedPatternId(pattern.id)}
            className="text-text-muted hover:text-text-secondary p-0.5 flex-shrink-0"
            title="Dismiss"
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* 3-pane workspace */}
      <div className="flex-1 flex min-h-0">
        {/* Left — Conversation */}
        <div className={`flex-shrink-0 transition-all duration-200 ${leftCollapsed ? 'w-10' : 'w-80'}`}>
          <ConversationPane
            collapsed={leftCollapsed}
            onToggle={() => setLeftCollapsed((c) => !c)}
            conversation={conversation}
            onAppendMessage={handleAppendMessage}
            onProposeFromIntent={handleProposeFromIntent}
            onApplySuggestion={handleApplySuggestion}
          />
        </div>

        {/* Center — Canvas + Palette + Inspector */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 flex">
            <div className="flex-1 min-w-0">
              <SignalCanvas
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
              <NodeInspector
                selectedNodeId={selectedNodeId}
                tree={tree}
                onUpdateConfig={handleUpdateConfig}
                onDeleteNode={handleDeleteNode}
                onStartConnect={handleStartConnect}
                onSetOutput={handleSetOutput}
                validationIssues={validation.issues}
              />
              <NodePalette onAdd={handleAddNode} />
            </div>
          </div>
        </div>

        {/* Right — Preview rail */}
        <div className={`flex-shrink-0 transition-all duration-200 ${rightCollapsed ? 'w-10' : 'w-72'}`}>
          <PreviewRail
            tree={tree}
            outputType={meta.output_type}
            collapsed={rightCollapsed}
            onToggle={() => setRightCollapsed((c) => !c)}
          />
        </div>
      </div>

      {/* Status footer */}
      <div className="flex-shrink-0 border-t border-border bg-bg/95 px-6 py-1.5 flex items-center gap-3 text-[10px] text-text-muted">
        <span>
          {Object.keys(tree.nodes).length} nodes · {tree.edges.length} edges
        </span>
        <span>·</span>
        <span>
          Output: {tree.output_node ? <span className="font-mono text-text-primary">{tree.output_node}</span> : <span className="italic">none</span>} → {OUTPUT_TYPES[meta.output_type]?.label}
        </span>
        <span>·</span>
        <select
          value={meta.output_type}
          onChange={(e) => setMeta((m) => ({ ...m, output_type: e.target.value }))}
          className="bg-transparent text-[10px] text-text-secondary border-none focus:outline-none cursor-pointer hover:text-text-primary"
          title="Change output type"
        >
          {Object.values(OUTPUT_TYPES).map((t) => (
            <option key={t.id} value={t.id}>
              Output: {t.label}
            </option>
          ))}
        </select>
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
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
                title={active ? `${role} can see this signal — click to hide` : `${role} cannot see this signal — click to show`}
              >
                {role}
              </button>
            );
          })}
        </div>
        <span className="ml-auto">
          {isNew ? 'New signal' : `Editing ${sourceSignal?.name || ''}`} {signalId && <span className="font-mono">· {signalId}</span>}
        </span>
      </div>
    </div>
  );
}
