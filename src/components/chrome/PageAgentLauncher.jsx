import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles,
  X,
  Loader2,
  MessageSquare,
  History as HistoryIcon,
  LayoutList,
  Plus,
  Send,
  ChevronRight,
  Compass,
  BarChart3,
  Settings2,
  Check,
  Lightbulb,
} from 'lucide-react';
import { usePageAgentControls } from '../../context/PageAgentContext.jsx';

// ─── Page Agent Launcher ────────────────────────────────────────────
//
// A full-height, content-pushing sidebar that turns each page into a
// "headless" surface you can drive from chat. It supports two kinds of
// page-defined actions:
//
//   • suggestions — one-shot actions: run() mutates the page, returns text.
//   • flows       — guided, multi-step paths. run(ctx) drives the
//                   conversation, surfacing inline UI (forms, sliders,
//                   filter chips) and charts only when needed, then
//                   performs the work (create a project, build an ICP
//                   segment, score, …). This is how NLP + UI combine.
//
// A rail switches between Chat, History, and a categorized Recommendations
// browser. The composer routes free-text to a matching flow (NLP entry).

let _msgSeq = 0;
const nextId = () => `pa-msg-${(_msgSeq += 1)}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function groupByCategory(items) {
  const order = [];
  const map = new Map();
  for (const s of items) {
    const cat = s.category || 'Actions';
    if (!map.has(cat)) {
      map.set(cat, []);
      order.push(cat);
    }
    map.get(cat).push(s);
  }
  return order.map((cat) => ({ cat, items: map.get(cat) }));
}

// Route free-text to a flow by keyword / label match (lightweight NLP).
// The most specific match wins — score by the length of the matched
// keyword so "save this as a segment" beats a generic "segment" keyword.
function matchFlow(text, flows) {
  const q = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const f of flows) {
    const keys = [f.label, ...(f.keywords || [])].map((k) => k.toLowerCase());
    for (const k of keys) {
      const words = k.split(/\s+/);
      const hit = q.includes(k) || words.every((w) => q.includes(w));
      if (hit && k.length > bestScore) {
        best = f;
        bestScore = k.length;
      }
    }
  }
  return best;
}

// ─── Inline UI: a form rendered inside the transcript ───────────────
function InlineForm({ spec, onSubmit }) {
  const [values, setValues] = useState(() => {
    const init = {};
    for (const f of spec.fields) {
      init[f.key] =
        f.default ?? (f.type === 'chips' ? [] : f.type === 'toggle' ? false : '');
    }
    return init;
  });
  const set = (k, v) => setValues((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="border border-primary/30 bg-primary/5 rounded-lg rounded-tl-sm px-3 py-2.5 space-y-2.5">
      {spec.title && (
        <div className="text-[11px] uppercase tracking-wider font-semibold text-primary">
          {spec.title}
        </div>
      )}
      {spec.fields.map((f) => (
        <div key={f.key}>
          {f.label && f.type !== 'toggle' && (
            <div className="text-[11px] font-medium text-text-secondary mb-1">{f.label}</div>
          )}
          {f.type === 'text' && (
            <input
              value={values[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full px-2.5 py-1.5 text-[12px] rounded border border-border bg-surface focus:outline-none focus:border-primary"
            />
          )}
          {f.type === 'textarea' && (
            <textarea
              value={values[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              rows={2}
              className="w-full px-2.5 py-1.5 text-[12px] rounded border border-border bg-surface focus:outline-none focus:border-primary resize-none"
            />
          )}
          {f.type === 'select' && (
            <div className="flex flex-wrap gap-1">
              {f.options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => set(f.key, o.id)}
                  className={`px-2.5 py-1 text-[11.5px] rounded-full border transition-colors ${
                    values[f.key] === o.id
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface border-border text-text-secondary hover:border-primary/40'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
          {f.type === 'chips' && (
            <div className="flex flex-wrap gap-1">
              {f.options.map((o) => {
                const on = (values[f.key] || []).includes(o.id);
                return (
                  <button
                    key={o.id}
                    onClick={() =>
                      set(
                        f.key,
                        on
                          ? values[f.key].filter((x) => x !== o.id)
                          : [...(values[f.key] || []), o.id],
                      )
                    }
                    className={`px-2.5 py-1 text-[11.5px] rounded-full border transition-colors ${
                      on
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface border-border text-text-secondary hover:border-primary/40'
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          )}
          {f.type === 'toggle' && (
            <button
              onClick={() => set(f.key, !values[f.key])}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded border border-border bg-surface"
            >
              <span className="text-[12px] text-text-secondary">{f.label}</span>
              <span
                className={`relative inline-flex w-8 h-4 rounded-full transition-colors flex-shrink-0 ${
                  values[f.key] ? 'bg-primary' : 'bg-border-2'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${
                    values[f.key] ? 'left-4' : 'left-0.5'
                  }`}
                />
              </span>
            </button>
          )}
          {f.type === 'slider' && (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={f.min ?? 0}
                max={f.max ?? 100}
                step={f.step ?? 1}
                value={values[f.key]}
                onChange={(e) => set(f.key, Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-[11px] font-mono text-text-secondary w-8 text-right">
                {values[f.key]}
              </span>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={() => onSubmit(values)}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold bg-primary text-white rounded-md hover:bg-primary-dim transition-colors"
      >
        {spec.submitLabel || 'Continue'}
      </button>
    </div>
  );
}

// ─── Inline UI: a simple horizontal-bar chart with explanation ──────
function ChartBlock({ m }) {
  const max = Math.max(1, ...m.data.map((d) => d.value));
  return (
    <div className="border border-border bg-bg/50 rounded-lg rounded-tl-sm px-3 py-2.5 space-y-2">
      {m.title && (
        <div className="text-[11px] font-semibold text-text-primary">{m.title}</div>
      )}
      <div className="space-y-1.5">
        {m.data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="text-[10.5px] text-text-secondary w-24 truncate flex-shrink-0">
              {d.label}
            </span>
            <div className="flex-1 h-3.5 bg-surface-2 rounded overflow-hidden">
              <div
                className="h-full bg-primary/70 rounded transition-all duration-500"
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-text-muted w-12 text-right flex-shrink-0">
              {m.unit === 'money'
                ? d.display || d.value
                : d.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      {m.explanation && (
        <div className="text-[11.5px] text-text-secondary leading-relaxed pt-1 border-t border-border/60">
          {m.explanation}
        </div>
      )}
      {m.action && (
        <button
          onClick={m.action.run}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold bg-primary text-white rounded-md hover:bg-primary-dim transition-colors"
        >
          <BarChart3 size={12} /> {m.action.label}
        </button>
      )}
    </div>
  );
}

function AgentMessage({ m, onSubmitForm, onTipAction }) {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="text-[12px] text-white bg-primary rounded-lg rounded-tr-sm px-3 py-1.5 max-w-[85%]">
          {m.text}
        </div>
      </div>
    );
  }
  if (m.role === 'thinking') {
    return (
      <div className="flex gap-2">
        <span className="grid place-items-center w-5 h-5 rounded bg-primary/10 text-primary flex-shrink-0 mt-0.5">
          <Sparkles size={11} />
        </span>
        <div className="inline-flex items-center gap-1.5 text-[12px] text-text-muted bg-bg/50 border border-border rounded-lg rounded-tl-sm px-3 py-2">
          <Loader2 size={12} className="animate-spin" />
          {m.text}
        </div>
      </div>
    );
  }
  if (m.role === 'form') {
    return (
      <div className="flex gap-2">
        <span className="grid place-items-center w-5 h-5 rounded bg-primary/10 text-primary flex-shrink-0 mt-0.5">
          <Sparkles size={11} />
        </span>
        <div className="flex-1 min-w-0">
          {m.status === 'open' ? (
            <InlineForm spec={m.spec} onSubmit={(v) => onSubmitForm(m.id, v)} />
          ) : (
            <div className="text-[12px] text-text-secondary bg-bg/50 border border-border rounded-lg rounded-tl-sm px-3 py-2">
              {m.summaryText || 'Submitted.'}
            </div>
          )}
        </div>
      </div>
    );
  }
  if (m.role === 'chart') {
    return (
      <div className="flex gap-2">
        <span className="grid place-items-center w-5 h-5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex-shrink-0 mt-0.5">
          <Sparkles size={11} />
        </span>
        <div className="flex-1 min-w-0">
          <ChartBlock m={m} />
        </div>
      </div>
    );
  }
  if (m.role === 'tip') {
    return (
      <div className="flex gap-2">
        <span className="grid place-items-center w-5 h-5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-300 flex-shrink-0 mt-0.5">
          <Lightbulb size={11} />
        </span>
        <div className="text-[11.5px] text-text-secondary leading-relaxed bg-amber-500/[0.06] border border-amber-500/20 rounded-lg rounded-tl-sm px-3 py-1.5">
          {m.text}
          {m.action && (
            <>
              {' '}
              <button
                onClick={() => onTipAction?.(m.action.id)}
                className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
              >
                {m.action.label}
                <ChevronRight size={11} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <span className="grid place-items-center w-5 h-5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex-shrink-0 mt-0.5">
        <Sparkles size={11} />
      </span>
      <div className="text-[12px] text-text-secondary leading-relaxed bg-bg/50 border border-border rounded-lg rounded-tl-sm px-3 py-2 whitespace-pre-line">
        {m.text}
      </div>
    </div>
  );
}

function RailButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`grid place-items-center w-9 h-9 rounded-lg transition-colors ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-text-muted hover:text-text-primary hover:bg-surface-2'
      }`}
    >
      <Icon size={16} />
    </button>
  );
}

export default function PageAgentLauncher() {
  const { config, open, setOpen } = usePageAgentControls();
  const [view, setView] = useState('chat'); // 'chat' | 'history' | 'recs'
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState('');
  const [quickIds, setQuickIds] = useState([]); // pinned quick-action ids
  const [editingQuick, setEditingQuick] = useState(false);
  const scrollRef = useRef(null);
  const formResolvers = useRef({});
  // Tip cadence: surface a tip every Nth operation, rotating through the
  // goal's pool, so tips stay occasional and varied.
  const tipOpsRef = useRef(1);
  const tipIdxRef = useRef(0);

  // Stable per-page key for persisting the user's quick-action choices.
  const quickKey = `pa-quick:${(config?.title || config?.cta || 'default').replace(/\s+/g, '-')}`;

  useEffect(() => {
    setMessages([]);
    setBusy(false);
    setView('chat');
    setDraft('');
    setEditingQuick(false);
    formResolvers.current = {};
    tipOpsRef.current = 1;
    tipIdxRef.current = 0;
    // Load the user's pinned quick actions, defaulting to the page's
    // one-shot suggestions when nothing has been saved yet.
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(quickKey));
    } catch {
      saved = null;
    }
    setQuickIds(
      Array.isArray(saved) ? saved : (config?.suggestions || []).map((s) => s.id),
    );
    const seed = config?.seedHistory || [];
    setHistory(
      seed.map((h, i) => ({
        id: `seed-${config?.__id}-${i}`,
        title: h.title,
        ts: h.ts || 'Earlier',
        messages: [
          { id: `seed-${config?.__id}-${i}-u`, role: 'user', text: h.title },
          { id: `seed-${config?.__id}-${i}-a`, role: 'agent', text: h.preview },
        ],
      })),
    );
  }, [config?.__id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, view]);

  if (!config) return null;

  const suggestions = config.suggestions || [];
  const flows = config.flows || [];
  const append = (msg) => setMessages((prev) => [...prev, { id: nextId(), ...msg }]);

  // Pool of actions a user can pin as quick actions — guided flows first,
  // then one-shot suggestions. Quick-action chips are the user's subset.
  const actionPool = [
    ...flows.map((f) => ({ ...f, isFlow: true })),
    ...suggestions.map((s) => ({ ...s, isFlow: false })),
  ];
  const quickActions = actionPool.filter((a) => quickIds.includes(a.id));

  const toggleQuick = (id) => {
    setQuickIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(quickKey, JSON.stringify(next));
      } catch {
        /* ignore persistence errors */
      }
      return next;
    });
  };

  // Conversation context handed to a flow's run(). UI surfaces only here.
  const ctx = {
    say: async (text) => {
      const tid = nextId();
      setMessages((prev) => [...prev, { id: tid, role: 'thinking', text: 'Thinking…' }]);
      await wait(520);
      setMessages((prev) =>
        prev.filter((m) => m.id !== tid).concat({ id: nextId(), role: 'agent', text }),
      );
    },
    ask: (spec) =>
      new Promise((resolve) => {
        const fid = nextId();
        formResolvers.current[fid] = { resolve, spec };
        setMessages((prev) => [...prev, { id: fid, role: 'form', spec, status: 'open' }]);
      }),
    chart: async ({ title, data, unit, explanation, action }) => {
      const tid = nextId();
      setMessages((prev) => [...prev, { id: tid, role: 'thinking', text: 'Crunching numbers…' }]);
      await wait(620);
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== tid)
          .concat({ id: nextId(), role: 'chart', title, data, unit, explanation, action }),
      );
    },
  };

  const submitForm = (fid, values) => {
    const entry = formResolvers.current[fid];
    const summaryText = entry?.spec?.summarize
      ? entry.spec.summarize(values)
      : 'Got it.';
    setMessages((prev) =>
      prev.map((m) => (m.id === fid ? { ...m, status: 'submitted', summaryText } : m)),
    );
    delete formResolvers.current[fid];
    entry?.resolve?.(values);
  };

  // Surface a goal-aligned tip only every 3rd operation, rotating through
  // the pool so it neither repeats nor fires after every action.
  const TIP_EVERY = 3;
  const maybeTip = () => {
    const tips = config.tips?.();
    if (!tips || !tips.length) return;
    tipOpsRef.current += 1;
    if (tipOpsRef.current < TIP_EVERY) return;
    tipOpsRef.current = 0;
    const tip = tips[tipIdxRef.current % tips.length];
    tipIdxRef.current += 1;
    append({ role: 'tip', text: tip.text, action: tip.action });
  };

  // Run the action a tip links to — a flow/suggestion by id, or a named
  // page action (e.g. 'open-analysis') the page registered on config.
  const runTipAction = (actionId) => {
    if (busy) return;
    const pooled = actionPool.find((x) => x.id === actionId);
    if (pooled) {
      return pooled.isFlow ? runFlow(pooled) : runSuggestion(pooled);
    }
    const fn = config.actions?.[actionId];
    if (fn) {
      setView('chat');
      fn();
    }
  };

  const runFlow = async (flow, opts = {}) => {
    if (busy) return;
    setView('chat');
    setBusy(true);
    append({ role: 'user', text: opts.userText || flow.label });
    try {
      await flow.run(ctx, { hint: opts.hint });
      maybeTip();
    } catch (err) {
      append({ role: 'agent', text: `Hmm, that didn't go through: ${err.message}` });
    }
    setBusy(false);
  };

  const runSuggestion = (s) => {
    if (busy) return;
    setView('chat');
    setBusy(true);
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', text: s.label },
      { id: nextId(), role: 'thinking', text: s.thinking || 'Working on it…' },
    ]);
    setTimeout(() => {
      let result;
      try {
        result = s.run?.();
      } catch (err) {
        result = `Something went wrong: ${err.message}`;
      }
      const summary = typeof result === 'string' ? result : result?.summary || 'Done.';
      setMessages((prev) =>
        prev.filter((m) => m.role !== 'thinking').concat({ id: nextId(), role: 'agent', text: summary }),
      );
      maybeTip();
      setBusy(false);
    }, 850);
  };

  // Composer: route free text to a flow, else give a helpful fallback.
  const handleSend = () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    const flow = matchFlow(text, flows);
    if (flow) {
      runFlow(flow, { userText: text, hint: text });
      return;
    }
    setView('chat');
    setBusy(true);
    append({ role: 'user', text });
    setTimeout(() => {
      const names = flows.map((f) => `• ${f.label}`).join('\n');
      append({
        role: 'agent',
        text: names
          ? `I can take you down any of these paths:\n${names}\n\nPick one above, or tell me which.`
          : 'Try one of the suggested actions below.',
      });
      setBusy(false);
    }, 600);
  };

  const startNewChat = () => {
    if (messages.length) {
      const firstUser = messages.find((m) => m.role === 'user');
      setHistory((h) => [
        {
          id: nextId(),
          title: firstUser ? firstUser.text : 'Untitled chat',
          ts: 'Just now',
          messages,
        },
        ...h,
      ]);
    }
    setMessages([]);
    setView('chat');
    tipOpsRef.current = 1;
    tipIdxRef.current = 0;
  };

  const openHistoryItem = (item) => {
    setMessages(item.messages || []);
    setView('chat');
  };

  const recGroups = [
    ...(flows.length ? [{ cat: 'Guided paths', items: flows }] : []),
    ...groupByCategory(suggestions),
  ];

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.14 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-4 right-[124px] z-[55] inline-flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full bg-primary text-white shadow-elev hover:bg-primary-dim transition-colors text-xs font-semibold"
            title={config.cta}
          >
            <Sparkles size={13} className="flex-shrink-0" />
            {config.cta}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 452 }}
            exit={{ width: 0 }}
            transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.3 }}
            className="flex-shrink-0 h-full overflow-hidden bg-surface border-l border-border"
          >
            <div className="w-[452px] h-full flex">
              {/* Rail */}
              <div className="w-[52px] flex-shrink-0 h-full border-r border-border bg-bg/40 flex flex-col items-center py-3 gap-1">
                <button
                  onClick={startNewChat}
                  title="New chat"
                  className="grid place-items-center w-9 h-9 rounded-lg bg-primary text-white hover:bg-primary-dim transition-colors mb-1"
                >
                  <Plus size={16} />
                </button>
                <RailButton icon={MessageSquare} label="Chat" active={view === 'chat'} onClick={() => setView('chat')} />
                <RailButton icon={HistoryIcon} label="History" active={view === 'history'} onClick={() => setView('history')} />
                <RailButton icon={LayoutList} label="Recommendations" active={view === 'recs'} onClick={() => setView('recs')} />
              </div>

              {/* Main column */}
              <div className="flex-1 min-w-0 h-full flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-bg/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid place-items-center w-6 h-6 rounded-md bg-primary/10 text-primary flex-shrink-0">
                      <Sparkles size={13} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-text-primary truncate">
                        {view === 'history'
                          ? 'Chat history'
                          : view === 'recs'
                          ? 'Recommendations'
                          : config.title || 'Page Agent'}
                      </div>
                      {config.subtitle && (
                        <div className="text-[10px] text-text-muted truncate">{config.subtitle}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Chat view */}
                {view === 'chat' && (
                  <>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                      {/* Intent-first empty state */}
                      {messages.length === 0 && (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <span className="grid place-items-center w-5 h-5 rounded bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                              <Sparkles size={11} />
                            </span>
                            <div className="text-[12px] text-text-secondary leading-relaxed bg-bg/50 border border-border rounded-lg rounded-tl-sm px-3 py-2">
                              {config.intro || 'What would you like to do?'}
                            </div>
                          </div>
                          {flows.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5 px-0.5">
                                <Compass size={11} /> What do you want to do?
                              </div>
                              <div className="space-y-1.5">
                                {flows.map((f) => {
                                  const Icon = f.icon;
                                  return (
                                    <button
                                      key={f.id}
                                      onClick={() => runFlow(f)}
                                      disabled={busy}
                                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border bg-bg/40 hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-50"
                                    >
                                      <span className="grid place-items-center w-7 h-7 rounded-md bg-primary/10 text-primary flex-shrink-0">
                                        {Icon ? <Icon size={14} /> : <Sparkles size={14} />}
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className="block text-[12.5px] font-medium text-text-primary">{f.label}</span>
                                        {f.description && (
                                          <span className="block text-[11px] text-text-muted leading-snug">{f.description}</span>
                                        )}
                                      </span>
                                      <ChevronRight size={14} className="text-text-muted flex-shrink-0" />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {messages.map((m) => (
                        <AgentMessage key={m.id} m={m} onSubmitForm={submitForm} onTipAction={runTipAction} />
                      ))}
                    </div>

                    {/* Quick actions — user-configurable */}
                    {actionPool.length > 0 && (
                      <div className="px-4 pt-2 pb-1 border-t border-border">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                            {editingQuick ? 'Choose your quick actions' : 'Quick actions'}
                          </div>
                          <button
                            onClick={() => setEditingQuick((v) => !v)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                          >
                            {editingQuick ? (
                              <>
                                <Check size={11} /> Done
                              </>
                            ) : (
                              <>
                                <Settings2 size={11} /> Customize
                              </>
                            )}
                          </button>
                        </div>

                        {editingQuick ? (
                          <div className="flex flex-wrap gap-1.5">
                            {actionPool.map((a) => {
                              const Icon = a.icon;
                              const on = quickIds.includes(a.id);
                              return (
                                <button
                                  key={a.id}
                                  onClick={() => toggleQuick(a.id)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11.5px] font-medium transition-colors ${
                                    on
                                      ? 'bg-primary text-white border-primary'
                                      : 'bg-bg/40 border-border text-text-secondary hover:border-primary/40'
                                  }`}
                                >
                                  {on ? (
                                    <Check size={12} />
                                  ) : (
                                    Icon && <Icon size={12} className="text-primary" />
                                  )}
                                  {a.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : quickActions.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {quickActions.map((a) => {
                              const Icon = a.icon;
                              return (
                                <button
                                  key={a.id}
                                  onClick={() => (a.isFlow ? runFlow(a) : runSuggestion(a))}
                                  disabled={busy}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-bg/40 text-[11.5px] font-medium text-text-secondary hover:text-text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {Icon && <Icon size={12} className="text-primary" />}
                                  {a.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingQuick(true)}
                            className="text-[11.5px] text-text-muted hover:text-primary"
                          >
                            No quick actions pinned — click Customize to add some.
                          </button>
                        )}
                      </div>
                    )}

                    {/* Composer — natural language entry */}
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-bg/40 focus-within:border-primary transition-colors">
                        <input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSend();
                          }}
                          disabled={busy}
                          placeholder="Ask, or describe what you want to do…"
                          className="flex-1 bg-transparent text-[12px] text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed"
                        />
                        <button
                          onClick={handleSend}
                          disabled={busy || !draft.trim()}
                          className="grid place-items-center w-6 h-6 rounded-md bg-primary text-white flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Send size={12} />
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* History view */}
                {view === 'history' && (
                  <div className="flex-1 overflow-y-auto px-3 py-3">
                    <button
                      onClick={startNewChat}
                      className="w-full inline-flex items-center gap-2 px-3 py-2 mb-2 rounded-lg border border-dashed border-border text-[12px] font-medium text-text-secondary hover:text-primary hover:border-primary/40 transition-colors"
                    >
                      <Plus size={13} /> New chat
                    </button>
                    {history.length === 0 ? (
                      <div className="text-[12px] text-text-muted text-center py-8">
                        No past chats yet. Your conversations show up here.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {history.map((item) => {
                          const last = [...(item.messages || [])].reverse().find((m) => m.role === 'agent');
                          return (
                            <button
                              key={item.id}
                              onClick={() => openHistoryItem(item)}
                              className="w-full text-left px-3 py-2 rounded-lg border border-border bg-bg/40 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <MessageSquare size={12} className="text-text-muted flex-shrink-0" />
                                <span className="text-[12px] font-medium text-text-primary truncate flex-1">{item.title}</span>
                                <span className="text-[10px] text-text-muted flex-shrink-0">{item.ts}</span>
                              </div>
                              {last && (
                                <div className="text-[11px] text-text-muted truncate mt-0.5 pl-5">{last.text}</div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations view */}
                {view === 'recs' && (
                  <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
                    {recGroups.map(({ cat, items }) => (
                      <div key={cat}>
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted px-1 mb-1.5">
                          {cat}
                        </div>
                        <div className="space-y-1">
                          {items.map((s) => {
                            const Icon = s.icon;
                            const isFlow = flows.includes(s);
                            return (
                              <button
                                key={s.id}
                                onClick={() => (isFlow ? runFlow(s) : runSuggestion(s))}
                                disabled={busy}
                                className="w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-lg border border-border bg-bg/40 hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="grid place-items-center w-6 h-6 rounded-md bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                                  {Icon ? <Icon size={13} /> : <Sparkles size={13} />}
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-[12px] font-medium text-text-primary">{s.label}</span>
                                  {s.description && (
                                    <span className="block text-[11px] text-text-muted leading-snug mt-0.5">{s.description}</span>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
