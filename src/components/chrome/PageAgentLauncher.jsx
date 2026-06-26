import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, ArrowUp, Loader2 } from 'lucide-react';
import { usePageAgentControls } from '../../context/PageAgentContext.jsx';

// ─── Page Agent Launcher ────────────────────────────────────────────
//
// Rendered once in AppShell. Reads whatever agent the current page has
// registered and shows a floating CTA pill + a conversational panel of
// suggested actions. Each suggestion runs a page-defined `run()` that
// mocks the agent modifying the page; we wrap it in a short "thinking"
// beat so it reads like real work.

let _msgSeq = 0;
const nextId = () => `pa-msg-${(_msgSeq += 1)}`;

export default function PageAgentLauncher() {
  const { config, open, setOpen } = usePageAgentControls();
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  // Reset the transcript whenever the page (agent) changes.
  useEffect(() => {
    setMessages([]);
    setBusy(false);
  }, [config?.__id]);

  // Keep the transcript pinned to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  if (!config) return null;

  const runSuggestion = (s) => {
    if (busy) return;
    setBusy(true);
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', text: s.label },
      { id: nextId(), role: 'thinking', text: s.thinking || 'Working on it…' },
    ]);

    // Short beat so the action reads like the agent is doing work, then
    // apply the page mutation and report back.
    setTimeout(() => {
      let result;
      try {
        result = s.run?.();
      } catch (err) {
        result = `Something went wrong: ${err.message}`;
      }
      const summary =
        typeof result === 'string'
          ? result
          : result?.summary || 'Done.';
      setMessages((prev) => {
        const next = prev.filter((m) => m.role !== 'thinking');
        return [...next, { id: nextId(), role: 'agent', text: summary }];
      });
      setBusy(false);
    }, 850);
  };

  const suggestions = config.suggestions || [];

  return (
    <>
      {/* Collapsed CTA pill — anchored bottom-right, left of Demo controls */}
      <motion.button
        layout
        onClick={() => setOpen(!open)}
        className={`fixed bottom-4 right-[124px] z-[55] inline-flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full bg-primary text-white shadow-elev hover:bg-primary-dim transition-colors text-xs font-semibold ${
          open ? 'ring-2 ring-primary/40' : ''
        }`}
        title={config.cta}
      >
        <Sparkles size={13} className="flex-shrink-0" />
        {config.cta}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="fixed bottom-16 right-[124px] z-[55] w-[360px] max-w-[92vw] bg-surface border border-border rounded-xl shadow-elev overflow-hidden flex flex-col"
            style={{ maxHeight: 'min(620px, 80vh)' }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-bg/40">
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid place-items-center w-6 h-6 rounded-md bg-primary/10 text-primary flex-shrink-0">
                  <Sparkles size={13} />
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-text-primary truncate">
                    {config.title || 'Page Agent'}
                  </div>
                  {config.subtitle && (
                    <div className="text-[10px] text-text-muted truncate">
                      {config.subtitle}
                    </div>
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

            {/* Transcript */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
              {/* Intro */}
              <div className="flex gap-2">
                <span className="grid place-items-center w-5 h-5 rounded bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                  <Sparkles size={11} />
                </span>
                <div className="text-[12px] text-text-secondary leading-relaxed bg-bg/50 border border-border rounded-lg rounded-tl-sm px-3 py-2">
                  {config.intro ||
                    'Pick a task below and I’ll take care of it right here on the page.'}
                </div>
              </div>

              {messages.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="text-[12px] text-white bg-primary rounded-lg rounded-tr-sm px-3 py-1.5 max-w-[80%]">
                      {m.text}
                    </div>
                  </div>
                ) : m.role === 'thinking' ? (
                  <div key={m.id} className="flex gap-2">
                    <span className="grid place-items-center w-5 h-5 rounded bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                      <Sparkles size={11} />
                    </span>
                    <div className="inline-flex items-center gap-1.5 text-[12px] text-text-muted bg-bg/50 border border-border rounded-lg rounded-tl-sm px-3 py-2">
                      <Loader2 size={12} className="animate-spin" />
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-2">
                    <span className="grid place-items-center w-5 h-5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex-shrink-0 mt-0.5">
                      <Sparkles size={11} />
                    </span>
                    <div className="text-[12px] text-text-secondary leading-relaxed bg-bg/50 border border-border rounded-lg rounded-tl-sm px-3 py-2 whitespace-pre-line">
                      {m.text}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="px-4 pt-2 pb-1 border-t border-border">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
                  Suggested actions
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => runSuggestion(s)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-bg/40 text-[11.5px] font-medium text-text-secondary hover:text-text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {Icon && <Icon size={12} className="text-primary" />}
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Faux input — prototype affordance */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-bg/40 text-text-muted">
                <input
                  disabled
                  placeholder="Ask anything about this page…"
                  className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-text-muted cursor-not-allowed"
                />
                <span className="grid place-items-center w-6 h-6 rounded-md bg-surface-2 text-text-muted flex-shrink-0">
                  <ArrowUp size={13} />
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
