// Market Analyzer Copilot — main conversational shell.
//
// Holds the four-phase state machine for a JTBD conversation:
//   idle → intent_detected → extracting → analyzing → analysis_complete
//
// The conversation lives in a flat array (`conv`). Active extraction
// is held out-of-array because only one is ever active and renders
// inline below the latest Copilot message. Once an answer lands, we
// push the answer as a user-text bubble (with chips) and either
// advance to the next param or kick off Phase 3.
//
// Cross-JTBD bridging (follow-up `action: bridge`, Monday Monitor
// actions, notification actions, right-panel segment quick-actions)
// all funnel through `startJtbd` so context flows downstream and prior
// Insight Cards stay visible in scroll history.
//
// Engagement layer (Phase 3):
//   - WelcomeState hosts the Monday Monitor digest
//   - RightPanel shows saved segments + tracked competitors + alerts
//   - NotificationCenter (bell in sub-header) exposes the daily guardrail
//   - SegmentDetailView renders as an inline conv item when the user
//     clicks a segment from the right panel or a Monday Monitor signal
//
// State diagram (rough):
//   activeExtraction = { jtbdId, paramIndex, collectedParams, entities }
//   analyzing        = { jtbdId } | null
// — never both set at once.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, RotateCcw, CheckCircle2, X as XIcon } from 'lucide-react';

import { copilotScript } from '../../data/marketAnalyzerCopilot/copilotScript.js';
import { userContext } from '../../data/marketAnalyzerCopilot/userContext.js';
import { getJtbd, JTBDS } from '../../data/marketAnalyzerCopilot/jtbds.js';
import { classifyIntent, extractEntities } from '../../lib/marketAnalyzerCopilot/intentClassifier.js';
import { runAnalysis } from '../../lib/marketAnalyzerCopilot/mockApi.js';
import { useMACopilot } from '../../context/MarketAnalyzerCopilotContext.jsx';

import { CopilotMessage, UserMessage, TypingIndicator } from './Messages.jsx';
import ExtractionPrompt from './ExtractionPrompt.jsx';
import InsightCard from './InsightCard.jsx';
import SoWhatBlock from './SoWhatBlock.jsx';
import FollowUpButtons from './FollowUpButtons.jsx';
import ApiTracePanel from './ApiTracePanel.jsx';
import WelcomeState from './WelcomeState.jsx';
import RightPanel from './RightPanel.jsx';
import NotificationCenter from './NotificationCenter.jsx';
import SegmentDetailView from './SegmentDetailView.jsx';

// ─── Helpers ────────────────────────────────────────────────────────

function applyEntities(param, entities) {
  if (!entities || !entities[param.key]) return param;
  return {
    ...param,
    defaultValue: entities[param.key],
    defaultLabel: 'Detected from your message',
  };
}

function formatChip(param, value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return 'none';
    if (value.length <= 2) return value.join(', ');
    return `${value.slice(0, 2).join(', ')} +${value.length - 2}`;
  }
  const str = String(value);
  return str.length > 60 ? `${str.slice(0, 57)}…` : str;
}

function humanizeKey(key) {
  if (!key) return '';
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function reduceTrace(prev, event) {
  const idx = prev.findIndex((e) => e.id === event.id);
  if (idx === -1) return [...prev, event];
  const copy = prev.slice();
  copy[idx] = event;
  return copy;
}

// Map from a JTBD that triggered the save → default motion + color for
// the saved segment. Keeps the right-panel pill consistent with intent.
const JTBD_TO_MOTION = {
  1: { motion: 'new_logo',     motionColor: 'emerald' },
  4: { motion: 'new_logo',     motionColor: 'emerald' },
  6: { motion: 'displacement', motionColor: 'rose' },
};

// ─── Shell ──────────────────────────────────────────────────────────

export default function CopilotShell() {
  const ma = useMACopilot();

  const [conv, setConv] = useState([]);
  const [activeExtraction, setActiveExtraction] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [pendingInput, setPendingInput] = useState('');
  const [trace, setTrace] = useState([]);
  const [toast, setToast] = useState(null);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on conv change.
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [conv, activeExtraction, analyzing]);

  const append = (item) => setConv((prev) => [...prev, item]);

  // ─── Conversation flow ──────────────────────────────────────────

  function startJtbd(jtbdId, opts = {}) {
    const { entities = {}, prefilledParams = {}, intro } = opts;
    const jtbd = getJtbd(jtbdId);
    if (!jtbd) {
      append({ kind: 'copilot-text', text: copilotScript.confused.text });
      append({ kind: 'jtbd-picker' });
      return;
    }
    append({
      kind: 'copilot-text',
      text: intro || copilotScript.intent.acknowledged(jtbd.title),
    });
    const collected = { ...prefilledParams };
    let firstUnfilled = 0;
    while (
      firstUnfilled < jtbd.parameters.length &&
      collected[jtbd.parameters[firstUnfilled].key] !== undefined
    ) {
      firstUnfilled += 1;
    }
    if (firstUnfilled >= jtbd.parameters.length) {
      runAnalysisFlow(jtbdId, collected);
    } else {
      setActiveExtraction({
        jtbdId,
        paramIndex: firstUnfilled,
        collectedParams: collected,
        entities,
      });
    }
  }

  function openSegmentDetail(segmentId, opts = {}) {
    const detail = ma.getSegmentDetail(segmentId);
    const segment = ma.getSegment(segmentId);
    if (!detail || !segment) {
      setToast({ icon: 'error', text: `Segment ${segmentId} not found.` });
      return;
    }
    if (opts.userMessage) {
      append({ kind: 'user-text', text: opts.userMessage });
    }
    append({
      kind: 'copilot-text',
      text: opts.intro || `Opening **${segment.name}** — your JTBD 7 segment view.`,
    });
    append({ kind: 'segment-detail', segmentId, detail });
  }

  function handleStarterPick(starter) {
    if (!starter.jtbd) return;
    append({ kind: 'user-text', text: starter.promptText });
    startJtbd(starter.jtbd, { entities: extractEntities(starter.promptText) });
  }

  function handleUserSubmit(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    append({ kind: 'user-text', text: trimmed });
    setPendingInput('');
    const jtbdId = classifyIntent(trimmed);
    if (jtbdId) {
      startJtbd(jtbdId, { entities: extractEntities(trimmed) });
    } else {
      append({ kind: 'copilot-text', text: copilotScript.confused.text });
      append({ kind: 'jtbd-picker' });
    }
  }

  function handleExtractionSubmit(value) {
    if (!activeExtraction) return;
    const { jtbdId, paramIndex, collectedParams, entities } = activeExtraction;
    const jtbd = getJtbd(jtbdId);
    const param = jtbd.parameters[paramIndex];
    const newParams = { ...collectedParams, [param.key]: value };
    append({
      kind: 'user-text',
      chips: [{ label: humanizeKey(param.key), value: formatChip(param, value) }],
    });
    if (paramIndex + 1 < jtbd.parameters.length) {
      setActiveExtraction({
        jtbdId,
        paramIndex: paramIndex + 1,
        collectedParams: newParams,
        entities,
      });
    } else {
      setActiveExtraction(null);
      append({ kind: 'copilot-text', text: copilotScript.extraction.finished, dim: true });
      runAnalysisFlow(jtbdId, newParams);
    }
  }

  function handleUseDefault() {
    if (!activeExtraction) return;
    const { jtbdId, paramIndex, entities } = activeExtraction;
    const jtbd = getJtbd(jtbdId);
    const param = applyEntities(jtbd.parameters[paramIndex], entities);
    if (param.defaultValue === undefined) return;
    handleExtractionSubmit(param.defaultValue);
  }

  async function runAnalysisFlow(jtbdId, params) {
    const jtbd = getJtbd(jtbdId);
    setAnalyzing({ jtbdId });
    const result = await runAnalysis(jtbdId, params, (event) => {
      setTrace((prev) => reduceTrace(prev, event));
    });
    setAnalyzing(null);
    append({
      kind: 'result',
      jtbdId,
      jtbdShortTitle: jtbd.shortTitle,
      params,
      ...result,
    });
  }

  function saveSegmentFromJtbd(followUp, fromJtbdId) {
    const fromJtbd = getJtbd(fromJtbdId);
    const motionDefaults = JTBD_TO_MOTION[fromJtbdId] || { motion: 'new_logo', motionColor: 'emerald' };
    const motion = followUp.payload?.motion || motionDefaults.motion;
    const motionColor =
      motion === 'displacement' ? 'rose' :
      motion === 'expansion'    ? 'sky' :
      motion === 'vertical'     ? 'violet' :
                                   'emerald';
    // Find the most recent result item for this JTBD so we can snapshot
    // a realistic account count + trend into the new segment.
    const lastResult = [...conv].reverse().find((c) => c.kind === 'result' && c.jtbdId === fromJtbdId);
    const accountCount = lastResult?.card?.metrics?.find((m) => m.highlight)?.value
      ? Number.parseInt(lastResult.card.metrics.find((m) => m.highlight).value.replace(/[^\d]/g, ''), 10) || 0
      : 0;
    const trend = lastResult?.card?.spendTrend?.dataPoints?.slice(-7);
    const created = ma.addSegment({
      name: followUp.payload?.name || `${fromJtbd.shortTitle} segment · ${userContext.user.firstName}`,
      motion,
      motionColor,
      accountCount: accountCount || lastResult?.card?.metrics?.[0]?.value
        ? Number.parseInt(String(lastResult?.card?.metrics?.[0]?.value || '').replace(/[^\d]/g, ''), 10) || 0
        : 0,
      monthOverMonth: '—',
      monthOverMonthDirection: 'flat',
      spendTrend: trend && trend.length >= 2 ? trend : [10, 10, 10, 10, 10, 10, 10],
      intentActivity: 'pending',
      lastRefreshed: 'just now',
    });
    setToast({ icon: 'success', text: copilotScript.actions.saveSegmentToast(created.name) });
  }

  function handleFollowUpAction(followUp, fromJtbdId) {
    const fromJtbd = getJtbd(fromJtbdId);
    if (followUp.action === 'export') {
      const fmt = followUp.payload?.format || 'pdf';
      setToast({ icon: 'success', text: copilotScript.actions.exportToast(fmt) });
    } else if (followUp.action === 'push') {
      const dest = followUp.payload?.destination || 'Salesforce';
      const destLabel = dest.charAt(0).toUpperCase() + dest.slice(1);
      setToast({ icon: 'success', text: copilotScript.actions.pushToast(destLabel) });
    } else if (followUp.action === 'alert') {
      const type = followUp.payload?.type || 'signal_change';
      setToast({ icon: 'success', text: copilotScript.actions.alertToast(type) });
    } else if (followUp.action === 'bridge') {
      const toJtbdId = followUp.payload?.jtbd;
      const toJtbd = getJtbd(toJtbdId);
      if (!toJtbd) {
        setToast({
          icon: 'error',
          text: `${followUp.label} bridges to JTBD ${toJtbdId} — P1 / not built yet.`,
        });
        return;
      }
      startJtbd(toJtbdId, {
        intro: copilotScript.bridge.crossJtbd(fromJtbd.title, toJtbd.title),
        prefilledParams: followUp.payload?.prefill || {},
      });
    } else if (followUp.action === 'refine' || followUp.action === 'extend') {
      const dim =
        followUp.payload?.dimension ||
        followUp.payload?.value ||
        followUp.payload?.filter ||
        followUp.payload?.feature ||
        'refined view';
      setToast({ icon: 'success', text: copilotScript.actions.refineToast(dim) });
    } else if (followUp.action === 'save-segment') {
      saveSegmentFromJtbd(followUp, fromJtbdId);
    }
  }

  // ─── Engagement-layer handlers ──────────────────────────────────

  function bridgeToJtbdOrSegment(action, fallbackToast) {
    if (action?.segmentId) {
      openSegmentDetail(action.segmentId, { intro: action.intro });
      return;
    }
    if (action?.jtbdBridge) {
      const toJtbd = getJtbd(action.jtbdBridge);
      if (!toJtbd) {
        setToast({
          icon: 'error',
          text:
            fallbackToast ||
            `${action.label} bridges to JTBD ${action.jtbdBridge} — P1 / not built yet.`,
        });
        return;
      }
      startJtbd(action.jtbdBridge, {
        intro: action.intro,
        prefilledParams: action.prefilledParams || {},
      });
    }
  }

  function handleMondayMonitorAction(signal) {
    bridgeToJtbdOrSegment(signal.action);
  }

  function handleAlertAction(alert) {
    ma.markAlertRead(alert.id);
    bridgeToJtbdOrSegment(alert.action);
  }

  function handleSegmentAction({ kind, jtbdId, segment }) {
    if (kind === 'view-detail') {
      openSegmentDetail(segment.id, { userMessage: `Show me "${segment.name}"` });
      return;
    }
    if (kind === 'run-jtbd') {
      const jtbd = getJtbd(jtbdId);
      if (!jtbd) {
        setToast({
          icon: 'error',
          text: `JTBD ${jtbdId} isn't built yet — coming with the P1 set.`,
        });
        return;
      }
      const prefill = {};
      if (jtbdId === 4) prefill.icp = segment.name;
      if (jtbdId === 6) prefill.icpScope = segment.name;
      append({ kind: 'user-text', text: `Run ${jtbd.shortTitle} on "${segment.name}"` });
      startJtbd(jtbdId, {
        intro: `Bridging from your **${segment.name}** segment into ${jtbd.title}.`,
        prefilledParams: prefill,
      });
    }
  }

  function handleCompetitorClick(competitor) {
    setToast({
      icon: 'error',
      text: `Competitive Intelligence on ${competitor.name} is JTBD 2 — ships with the P1 set.`,
    });
  }

  // ─── Reset ──────────────────────────────────────────────────────

  function resetConversation() {
    setConv([]);
    setActiveExtraction(null);
    setAnalyzing(null);
    setPendingInput('');
    inputRef.current?.focus();
  }

  // ─── Active extraction parameter (with entity merge) ────────────

  const activeParam = useMemo(() => {
    if (!activeExtraction) return null;
    const jtbd = getJtbd(activeExtraction.jtbdId);
    const base = jtbd.parameters[activeExtraction.paramIndex];
    return applyEntities(base, activeExtraction.entities);
  }, [activeExtraction]);

  const inputDisabled = !!activeExtraction || !!analyzing;
  const isEmpty = conv.length === 0;

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-bg">
      {/* Sub-header — title + bell + new-analysis */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-border/60 bg-bg/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted">
            Market Analyzer
          </div>
          <span className="text-text-muted/40">/</span>
          <div className="text-sm font-semibold text-text-primary">Copilot</div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter
            onAlertAction={handleAlertAction}
            openControl={{ value: notifOpen, set: setNotifOpen }}
          />
          {!isEmpty && (
            <button
              onClick={resetConversation}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:text-primary border border-border hover:border-primary/40 rounded-md transition-colors"
            >
              <RotateCcw size={11} /> New analysis
            </button>
          )}
        </div>
      </div>

      {/* Body — chat column + right panel side by side */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-6">
            {isEmpty ? (
              <WelcomeState
                firstName={userContext.user.firstName}
                onStarterPick={handleStarterPick}
                onMondayMonitorAction={handleMondayMonitorAction}
              />
            ) : (
              <div className="max-w-3xl mx-auto py-6 space-y-4">
                {conv.map((item, i) => (
                  <ConvItem
                    key={i}
                    item={item}
                    onJtbdPick={(jtbdId) => {
                      append({ kind: 'user-text', text: getJtbd(jtbdId)?.title });
                      startJtbd(jtbdId);
                    }}
                    onFollowUp={(fu, jtbdId) => handleFollowUpAction(fu, jtbdId)}
                    onSegmentAction={handleSegmentAction}
                    onExport={() =>
                      setToast({ icon: 'success', text: copilotScript.actions.exportToast('pdf') })
                    }
                    onShare={() =>
                      setToast({ icon: 'success', text: 'Shareable link copied to clipboard.' })
                    }
                  />
                ))}

                {activeExtraction && activeParam && (
                  <ExtractionPrompt
                    key={`${activeExtraction.jtbdId}-${activeExtraction.paramIndex}`}
                    parameter={activeParam}
                    stepIndex={activeExtraction.paramIndex}
                    totalSteps={getJtbd(activeExtraction.jtbdId).parameters.length}
                    onSubmit={handleExtractionSubmit}
                    onUseDefault={handleUseDefault}
                  />
                )}

                {analyzing && (
                  <TypingIndicator
                    label={copilotScript.analysis.starting(getJtbd(analyzing.jtbdId).shortTitle)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Input bar — pinned bottom of chat column */}
          <div className="border-t border-border bg-bg/95 backdrop-blur-sm px-6 py-3 flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inputDisabled) return;
                  handleUserSubmit(pendingInput);
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={pendingInput}
                  onChange={(e) => setPendingInput(e.target.value)}
                  disabled={inputDisabled}
                  placeholder={
                    inputDisabled
                      ? activeExtraction
                        ? 'Answer the question above to continue…'
                        : 'Working on it…'
                      : 'Ask the Copilot — e.g. "I want to go after Gong\'s install base"'
                  }
                  className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:border-primary disabled:bg-surface-2 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={inputDisabled || !pendingInput.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={12} /> Send
                </button>
              </form>
            </div>
          </div>
        </div>

        <RightPanel
          collapsed={rightPanelCollapsed}
          onToggle={() => setRightPanelCollapsed((v) => !v)}
          onSegmentAction={handleSegmentAction}
          onCompetitorClick={handleCompetitorClick}
          onAlertClick={handleAlertAction}
          onSeeAllAlerts={() => setNotifOpen(true)}
        />
      </div>

      {/* API trace panel — bottom, collapsible */}
      <ApiTracePanel trace={trace} onClear={() => setTrace([])} />

      {/* Toast */}
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

// ─── ConvItem ───────────────────────────────────────────────────────

function ConvItem({ item, onJtbdPick, onFollowUp, onSegmentAction, onExport, onShare }) {
  if (item.kind === 'copilot-text') {
    return <CopilotMessage text={item.text} dim={item.dim} />;
  }
  if (item.kind === 'user-text') {
    return <UserMessage text={item.text} chips={item.chips} />;
  }
  if (item.kind === 'jtbd-picker') {
    return (
      <CopilotMessage>
        <div className="space-y-2">
          <div>Pick one of the things I can run today:</div>
          <div className="flex flex-col gap-1.5 mt-2">
            {JTBDS.map((j) => (
              <button
                key={j.id}
                onClick={() => onJtbdPick(j.id)}
                className="text-left px-3 py-2 rounded-md border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-[13px] text-text-primary"
              >
                <div className="font-semibold">{j.title}</div>
                <div className="text-[11px] text-text-muted">{j.description}</div>
              </button>
            ))}
          </div>
        </div>
      </CopilotMessage>
    );
  }
  if (item.kind === 'result') {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-8 flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <InsightCard
              card={item.card}
              onExport={() => onExport(item.jtbdId)}
              onShare={onShare}
            />
            <SoWhatBlock soWhat={item.soWhat} />
          </div>
        </div>
        <FollowUpButtons
          followUps={item.followUps}
          onAction={(fu) => onFollowUp(fu, item.jtbdId)}
        />
      </div>
    );
  }
  if (item.kind === 'segment-detail') {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <SegmentDetailView detail={item.detail} onAction={onSegmentAction} />
        </div>
      </div>
    );
  }
  return null;
}

// ─── Toast ──────────────────────────────────────────────────────────

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);
  const isError = toast.icon === 'error';
  return (
    <div
      className={`fixed bottom-20 right-6 z-50 px-4 py-2.5 text-sm rounded-lg shadow-elev flex items-center gap-2.5 max-w-md ${
        isError ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
      }`}
    >
      <CheckCircle2 size={14} />
      <span className="leading-snug">{toast.text}</span>
      <button onClick={onDismiss} className="text-white/80 hover:text-white ml-1">
        <XIcon size={12} />
      </button>
    </div>
  );
}
