import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Wand2, Bot, User, TrendingUp, AlertCircle } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  'Onboarding stalled — new customers (closed-won last 90d) who haven\'t logged in for 21d AND haven\'t responded to last Marketo campaign.',
  'Splunk install older than 36 months AND IT spend declining year-over-year.',
  'Accounts with renewal in next 90 days, declining product usage, no exec meeting in 60d.',
  'Existing customers with growing cloud spend, expanded tech stack, and a champion still in seat.',
  'Marketo engagement score combining email opens and form fills over rolling 30 days.',
];

function MessageBubble({ role, content, narration, suggestions, crossTenantHint, onApplySuggestion }) {
  const isUser = role === 'user';
  const isError = role === 'agent_error';
  if (isUser) {
    return (
      <div className="flex items-start gap-2">
        <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User size={10} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-text-primary leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <div className={`w-5 h-5 rounded-full ${isError ? 'bg-rose-500/15' : 'bg-emerald-500/15'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Bot size={10} className={isError ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'} />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className={`text-[11px] leading-relaxed ${isError ? 'text-rose-700 dark:text-rose-300' : 'text-text-primary'}`}>
          {narration || content}
        </div>
        {crossTenantHint && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded p-2 space-y-0.5">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300">
              <TrendingUp size={9} />
              Cross-tenant insight
            </div>
            <div className="text-[10px] text-text-primary leading-snug">{crossTenantHint.headline}</div>
            <div className="text-[10px] text-text-muted leading-snug">{crossTenantHint.detail}</div>
          </div>
        )}
        {suggestions && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onApplySuggestion && onApplySuggestion(s)}
                className="text-[10px] px-1.5 py-0.5 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConversationPane({
  collapsed,
  onToggle,
  conversation,
  onAppendMessage,
  onProposeFromIntent,
  onApplySuggestion,
}) {
  const [draft, setDraft] = useState('');
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [conversation?.length]);

  const submit = () => {
    if (!draft.trim()) return;
    const text = draft.trim();
    setDraft('');
    onAppendMessage({ role: 'user', content: text });
    onProposeFromIntent(text);
  };

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="h-full w-10 bg-bg/40 border-r border-border flex flex-col items-center justify-start py-4 hover:bg-surface-2 transition-colors"
        title="Expand conversation pane"
      >
        <Sparkles size={14} className="text-emerald-700 dark:text-emerald-300" />
        <span className="rotate-90 mt-12 text-[10px] uppercase tracking-wider text-text-muted whitespace-nowrap origin-left">
          Conversation
        </span>
      </button>
    );
  }

  const isEmpty = !conversation || conversation.length === 0;

  return (
    <div className="h-full bg-bg/40 border-r border-border flex flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Sparkles size={12} className="text-emerald-700 dark:text-emerald-300" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
          Conversation
        </span>
        <button
          onClick={onToggle}
          className="ml-auto text-[10px] text-text-muted hover:text-text-secondary transition-colors"
          title="Collapse pane"
        >
          ←
        </button>
      </div>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-3">
        {isEmpty && (
          <>
            <div className="text-[11px] text-text-secondary leading-relaxed">
              Describe the signal in plain language and the agent will propose a tree.
              You can also edit the canvas directly — both modalities work together.
            </div>

            <div className="bg-surface border border-border rounded-md p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Wand2 size={10} className="text-emerald-700 dark:text-emerald-300" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                  Try one of these
                </span>
              </div>
              <div className="space-y-1">
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setDraft(ex)}
                    className="w-full text-left text-[11px] text-text-secondary hover:text-primary transition-colors leading-snug"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-text-muted italic leading-relaxed">
              Recipes are hand-curated for the prototype. Real agent parses arbitrary intent in production.
            </div>
          </>
        )}
        {!isEmpty &&
          conversation.map((m, i) => (
            <MessageBubble
              key={i}
              role={m.role}
              content={m.content}
              narration={m.narration}
              suggestions={m.suggestions}
              crossTenantHint={m.crossTenantHint}
              onApplySuggestion={onApplySuggestion}
            />
          ))}
      </div>

      <div className="border-t border-border p-2">
        <div className="flex items-end gap-1.5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Describe what you want the signal to do..."
            className="flex-1 px-2 py-1.5 text-[11px] bg-surface border border-border rounded text-text-primary placeholder:text-text-muted resize-none focus:border-primary/40 focus:outline-none"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="p-1.5 bg-primary text-white rounded hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Send to agent"
          >
            <Send size={11} />
          </button>
        </div>
        <div className="mt-1 text-[9px] text-text-muted flex items-center gap-1">
          <AlertCircle size={8} />
          Enter to send · Shift+Enter for newline
        </div>
      </div>
    </div>
  );
}
