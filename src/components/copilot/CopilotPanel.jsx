import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Sparkles, Send } from 'lucide-react';
import {
  listTurns, addTurn, clearHistory, subscribeCopilotStore,
  makeUserTurn, makeCopilotTurn,
} from '../../data/copilotStore.js';
import { classifyAndDispatch } from '../../data/copilotAgent.js';
import { CopilotResponse } from './CopilotResponses.jsx';

// Fixed right-rail chat panel. Slides in from the right on open.
// Preserves conversation across mount/unmount (localStorage-backed).
export default function CopilotPanel({ isOpen, onClose, personaId }) {
  const [turns, setTurns] = useState(() => listTurns(personaId));
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Keep in sync with the store (other components can add turns too).
  useEffect(() => {
    const unsub = subscribeCopilotStore(() => setTurns(listTurns(personaId)));
    return unsub;
  }, [personaId]);

  // Refresh turns when persona changes.
  useEffect(() => {
    setTurns(listTurns(personaId));
  }, [personaId]);

  // Auto-scroll to bottom on new turn / thinking state change.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, isThinking]);

  // Focus input on open.
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Escape closes panel.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const submit = useCallback((query) => {
    const q = (query || '').trim();
    if (!q) return;
    addTurn(personaId, makeUserTurn(q));
    setIsThinking(true);
    // Small artificial delay so the panel reads like "thinking" — feels
    // authentic and gives auto-scroll time to settle.
    setTimeout(() => {
      const response = classifyAndDispatch(personaId, q);
      addTurn(personaId, makeCopilotTurn(response));
      setIsThinking(false);
    }, 350);
  }, [personaId]);

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    submit(inputValue);
    setInputValue('');
  };

  const handleClear = () => {
    clearHistory(personaId);
  };

  // External submit hook — CopilotBar routes queries into the panel via
  // a window event so we don't need to prop-drill.
  useEffect(() => {
    const onExternal = (e) => {
      submit(e.detail?.query);
    };
    window.addEventListener('rgi-copilot-submit', onExternal);
    return () => window.removeEventListener('rgi-copilot-submit', onExternal);
  }, [submit]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
          className="fixed top-0 right-0 h-screen bg-surface border-l border-border shadow-xl z-40 flex flex-col"
          style={{ width: 'min(520px, 90vw)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                <Sparkles size={13} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary">Sales Copilot</div>
                <div className="text-[10px] text-text-muted">Book-level meta-agent</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {turns.length > 0 && (
                <button
                  onClick={handleClear}
                  className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
                  title="Clear history"
                >
                  <Trash2 size={13} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
                title="Close (Esc)"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Conversation scroll area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {turns.length === 0 && !isThinking && (
              <EmptyState onExample={submit} />
            )}
            {turns.map((turn) => (
              <TurnRow key={turn.id} turn={turn} personaId={personaId} />
            ))}
            {isThinking && (
              <div className="flex items-center gap-2 text-[11px] text-text-muted italic">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
                <span className="ml-1">Thinking...</span>
              </div>
            )}
          </div>

          {/* Composer */}
          <form onSubmit={handleSubmit} className="border-t border-border px-3 py-2.5 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your accounts, or type / for commands..."
              className="flex-1 bg-bg/40 border border-border rounded px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isThinking}
              className="p-1.5 rounded bg-primary text-white hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Send"
            >
              <Send size={14} />
            </button>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ─── Turn row (user vs copilot) ──────────────────────────────────────
function TurnRow({ turn, personaId }) {
  if (turn.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-primary/10 border border-primary/20 rounded-lg rounded-br-sm px-3 py-2">
          <div className="text-sm text-text-primary">{turn.query}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles size={11} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <CopilotResponse response={turn.response} personaId={personaId} />
      </div>
    </div>
  );
}

// ─── Empty state — quick-start examples ──────────────────────────────
function EmptyState({ onExample }) {
  const examples = [
    'Plan my day',
    'Top accounts with web activity',
    'Which accounts are showing competitor renewal',
    'How is Databricks doing',
    'Find lookalikes for Databricks',
    'Compare Databricks vs Snowflake',
    'What changed',
  ];
  return (
    <div className="text-center py-6">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-violet-500 mx-auto mb-2 flex items-center justify-center">
        <Sparkles size={18} className="text-white" />
      </div>
      <div className="text-sm font-semibold text-text-primary mb-1">
        Ask about your book of accounts
      </div>
      <div className="text-[11px] text-text-muted mb-4 leading-snug">
        Rankings, comparisons, prospecting, and daily plans grounded<br />in your target scope.
      </div>
      <div className="flex flex-col gap-1.5 items-stretch max-w-[280px] mx-auto">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => onExample(ex)}
            className="text-left px-3 py-1.5 text-[11px] text-text-secondary bg-surface-2 hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/40 rounded transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
