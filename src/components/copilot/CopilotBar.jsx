import { useEffect, useRef, useState } from 'react';
import { Sparkles, MessageSquare, Send, ChevronDown } from 'lucide-react';
import { listTurns } from '../../data/copilotStore.js';
import { SLASH_COMMANDS } from '../../data/copilotAgent.js';

// Sticky top input bar on Home. Emits `rgi-copilot-submit` window events
// so the CopilotPanel can pick them up without prop-drilling.
//
// Chips visible at rest (no conversation yet). After a first turn, they
// collapse into a `/` menu (per design decision C — collapse after use).
export default function CopilotBar({ personaId, onOpen }) {
  const [inputValue, setInputValue] = useState('');
  const [slashOpen, setSlashOpen] = useState(false);
  const [turnCount, setTurnCount] = useState(() => listTurns(personaId).length);
  const inputRef = useRef(null);
  const slashRef = useRef(null);

  // Refresh turn count on persona change (chips vs / menu decision hinges on it).
  useEffect(() => {
    setTurnCount(listTurns(personaId).length);
    const onStorage = () => setTurnCount(listTurns(personaId).length);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [personaId]);

  // Close slash menu on outside click / Escape.
  useEffect(() => {
    if (!slashOpen) return;
    const onClick = (e) => {
      if (!slashRef.current?.contains(e.target)) setSlashOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setSlashOpen(false); };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [slashOpen]);

  const dispatch = (query) => {
    if (!query?.trim()) return;
    onOpen?.();
    // Give the panel a tick to mount before firing the event.
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('rgi-copilot-submit', { detail: { query } }));
      setTurnCount((c) => c + 2); // user turn + copilot turn
    }, 30);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(inputValue);
    setInputValue('');
  };

  const handleChipClick = (query) => {
    dispatch(query);
  };

  const handleSlashClick = (cmd) => {
    if (cmd.requiresInput) {
      setInputValue(cmd.query);
      setSlashOpen(false);
      inputRef.current?.focus();
    } else {
      dispatch(cmd.query);
      setSlashOpen(false);
    }
  };

  // "Fresh" state = no prior turns → show quick chips
  const showChips = turnCount === 0;

  // Quick chips shown at rest — the four highest-value shortcuts.
  const chips = [
    { label: 'Plan my day', query: 'plan my day' },
    { label: 'Top signals', query: 'top signals' },
    { label: 'What changed', query: 'what changed' },
    { label: 'Find lookalikes', query: 'find lookalikes for ', requiresInput: true },
  ];

  return (
    <div className="sticky top-0 z-20 bg-bg/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto px-6 py-3">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpen?.()}
            className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-opacity"
            title="Open Sales Copilot"
          >
            <Sparkles size={14} className="text-white" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (e.target.value.startsWith('/')) setSlashOpen(true);
                else setSlashOpen(false);
              }}
              onFocus={() => onOpen?.()}
              placeholder="Ask about your accounts, find lookalikes, or type / for commands..."
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Slash menu button (visible after first turn) */}
          {!showChips && (
            <div ref={slashRef} className="relative">
              <button
                type="button"
                onClick={() => setSlashOpen(!slashOpen)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-2 transition-colors"
                title="Slash commands"
              >
                <span className="font-mono">/</span>
                <ChevronDown size={10} />
              </button>
              {slashOpen && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-surface border border-border rounded shadow-lg z-30 py-1">
                  {SLASH_COMMANDS.map((cmd) => (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={() => handleSlashClick(cmd)}
                      className="w-full text-left px-3 py-1.5 hover:bg-surface-2 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-primary">{cmd.label}</span>
                        {cmd.requiresInput && <span className="text-[9px] text-text-muted">requires input</span>}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">{cmd.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary text-white rounded hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={11} />
            Ask
          </button>
        </form>

        {/* Chips at rest, collapsed after first turn */}
        {showChips && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-text-muted mr-1">Quick:</span>
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  if (chip.requiresInput) {
                    setInputValue(chip.query);
                    inputRef.current?.focus();
                    onOpen?.();
                  } else {
                    handleChipClick(chip.query);
                  }
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-text-secondary bg-surface-2 border border-border rounded-full hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
