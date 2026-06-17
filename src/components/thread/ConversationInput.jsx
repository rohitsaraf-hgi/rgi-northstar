import { useState, useRef, useMemo, useEffect } from 'react';
import { Send, Paperclip, Mic, Sparkles, Zap, Bot } from 'lucide-react';
import { useDemo } from '../../context/DemoContext.jsx';
import { usePersona } from '../../context/PersonaContext.jsx';
import { AGENTS, AGENT_CATEGORIES, CAPABILITY_TIERS } from '../../data/agents.js';
import {
  listSellerVisibleAgents,
  listAvailablePlaybooksForSeller,
  subscribeAdminConfig,
} from '../../data/adminConfig.js';

// Autocomplete picks up the last @-token typed in the input. We surface BOTH
// agentic playbooks (composed) and individual atomic agents the seller can
// invoke given their tier + modules owned. Admin-config gates apply:
//   - Atomic agents must have sellerVisible=true
//   - Playbooks must be published AND target the seller's salesRole
function buildPickerEntries({ modulesOwned, salesRole, roleType }) {
  // Admins bypass the seller-visibility + role-targeting gates so they can
  // preview the full surface area. Module gate still applies.
  const isAdmin = roleType === 'admin';
  const agents = isAdmin
    ? Object.values(AGENTS).filter((a) => modulesOwned.includes(a.requiredModule))
    : listSellerVisibleAgents({ modulesOwned });
  const playbooks = listAvailablePlaybooksForSeller({
    modulesOwned,
    salesRole: isAdmin ? null : salesRole,
  });

  const playbookEntries = playbooks.map((p) => ({
    kind: 'playbook',
    handle: p.id.replace(/-flow$/, '').replace(/-/g, '_'),
    label: p.name,
    desc: p.description,
    category: 'playbook',
    pipeline: p.pipeline,
  }));
  const agentEntries = agents.map((a) => ({
    kind: 'agent',
    handle: a.id,
    label: a.label,
    desc: a.desc,
    category: a.category,
    ceiling: a.ceiling,
  }));
  return [...playbookEntries, ...agentEntries];
}

function findActiveAtToken(value, caretPos) {
  const before = value.slice(0, caretPos);
  const lastAt = before.lastIndexOf('@');
  if (lastAt < 0) return null;
  // Must be at start or preceded by whitespace
  if (lastAt > 0 && !/\s/.test(value[lastAt - 1])) return null;
  const fragment = before.slice(lastAt + 1);
  if (/\s/.test(fragment)) return null;
  return { start: lastAt, query: fragment.toLowerCase() };
}

function PickerRow({ entry, active, onSelect }) {
  const cat = AGENT_CATEGORIES[entry.category];
  const cap = entry.ceiling ? CAPABILITY_TIERS[entry.ceiling] : null;
  const isPlaybook = entry.kind === 'playbook';
  return (
    <button
      onClick={() => onSelect(entry)}
      onMouseDown={(e) => e.preventDefault()}
      className={`w-full text-left px-2.5 py-1.5 flex items-center gap-2 transition-colors ${
        active ? 'bg-primary/10' : 'hover:bg-surface-2'
      }`}
    >
      <Bot
        size={12}
        className={isPlaybook ? 'text-emerald-700 dark:text-emerald-300' : 'text-text-muted'}
      />
      <span className="text-[11px] font-mono text-text-primary">@{entry.handle}</span>
      <span className="text-[11px] text-text-secondary truncate flex-1">{entry.label}</span>
      <div className="flex items-center gap-1">
        {isPlaybook && (
          <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
            Playbook · {entry.pipeline.length} steps
          </span>
        )}
        {!isPlaybook && cat && (
          <span className={`text-[9px] uppercase tracking-wider px-1 py-0.5 rounded ${cat.bg} ${cat.color} font-bold`}>
            {cat.label}
          </span>
        )}
        {!isPlaybook && cap && (
          <span className={`text-[9px] uppercase tracking-wider px-1 py-0.5 rounded ${cap.bg} ${cap.color} font-bold border ${cap.border}`}>
            {cap.label}
          </span>
        )}
      </div>
    </button>
  );
}

export default function ConversationInput({ onSend, suggestions = [], disabled = false }) {
  const [value, setValue] = useState('');
  const [agentMode, setAgentMode] = useState(false);
  const [caretPos, setCaretPos] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const textareaRef = useRef(null);
  const { hasTier, config } = useDemo();
  const { persona } = usePersona();
  const agentEnabled = hasTier('enterprise');

  // Re-derive picker entries when admin-config changes (publish/unpublish/etc).
  const [configTick, setConfigTick] = useState(0);
  useEffect(() => {
    return subscribeAdminConfig(() => setConfigTick((t) => t + 1));
  }, []);

  const allEntries = useMemo(
    () =>
      buildPickerEntries({
        modulesOwned: config.modulesOwned,
        salesRole: persona.salesRole,
        roleType: persona.roleType,
      }),
    // configTick triggers re-evaluation on admin-config change
    [config.modulesOwned, persona.salesRole, persona.roleType, configTick]
  );

  const activeToken = findActiveAtToken(value, caretPos);
  const filtered = useMemo(() => {
    if (!activeToken) return [];
    if (!activeToken.query) return allEntries.slice(0, 8);
    return allEntries
      .filter(
        (e) =>
          e.handle.startsWith(activeToken.query) ||
          e.label.toLowerCase().includes(activeToken.query)
      )
      .slice(0, 8);
  }, [activeToken, allEntries]);

  const pickerOpen = !!activeToken && filtered.length > 0;

  const submit = () => {
    const v = value.trim();
    if (!v || disabled) return;
    onSend(v);
    setValue('');
    setCaretPos(0);
  };

  const insertHandle = (entry) => {
    if (!activeToken) return;
    const before = value.slice(0, activeToken.start);
    const after = value.slice(caretPos);
    const next = `${before}@${entry.handle} ${after}`;
    setValue(next);
    const newPos = before.length + entry.handle.length + 2;
    setCaretPos(newPos);
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (ta) {
        ta.focus();
        ta.setSelectionRange(newPos, newPos);
      }
    });
  };

  const handleKeyDown = (e) => {
    if (pickerOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && filtered[activeIdx])) {
        e.preventDefault();
        insertHandle(filtered[activeIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setCaretPos(0); // close picker
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const placeholder = agentMode && agentEnabled
    ? 'Tell the agent what to do — it will execute and confirm...'
    : 'Type @ to invoke an agent · or ask anything about this thread...';

  return (
    <div className="border-t border-border bg-bg/95 backdrop-blur-sm p-4">
      <div className="relative">
        {pickerOpen && (
          <div className="absolute bottom-full mb-2 left-0 right-0 max-w-md bg-surface border border-border rounded-md shadow-card overflow-hidden z-30">
            <div className="px-2.5 py-1.5 border-b border-border bg-bg/40 flex items-center gap-1.5">
              <Bot size={11} className="text-emerald-700 dark:text-emerald-300" />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                Agents · Playbooks
              </span>
              <span className="text-[10px] text-text-muted ml-auto font-mono">
                ↑↓ select · Tab to insert
              </span>
            </div>
            <div className="max-h-72 overflow-y-auto thin-scrollbar py-1">
              {filtered.map((entry, i) => (
                <PickerRow
                  key={`${entry.kind}-${entry.handle}`}
                  entry={entry}
                  active={i === activeIdx}
                  onSelect={(e) => insertHandle(e)}
                />
              ))}
            </div>
          </div>
        )}

        <div
          className={`bg-surface border rounded-xl px-4 py-3 transition-colors ${
            agentMode && agentEnabled
              ? 'border-amber-500/40 focus-within:border-amber-500/60'
              : 'border-border focus-within:border-primary/40'
          }`}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setCaretPos(e.target.selectionStart);
              setActiveIdx(0);
            }}
            onKeyUp={(e) => setCaretPos(e.currentTarget.selectionStart)}
            onClick={(e) => setCaretPos(e.currentTarget.selectionStart)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none min-h-[24px] max-h-32"
            style={{ height: 'auto' }}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <button className="p-1.5 text-text-muted hover:text-text-secondary rounded transition-colors">
                <Paperclip size={14} />
              </button>
              <button className="p-1.5 text-text-muted hover:text-text-secondary rounded transition-colors">
                <Mic size={14} />
              </button>
              <div className="text-[10px] text-text-muted ml-1 flex items-center gap-1">
                <Sparkles size={9} />
                <span>Type @ to call an agent or playbook</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => agentEnabled && setAgentMode((m) => !m)}
                disabled={!agentEnabled}
                title={
                  agentEnabled
                    ? agentMode
                      ? 'Agent Mode is ON — AI will execute autonomously'
                      : 'Turn on Agent Mode'
                    : 'Agent Mode available on Enterprise — AI executes actions autonomously with your approval'
                }
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                  !agentEnabled
                    ? 'bg-bg/40 text-text-muted cursor-not-allowed border border-border'
                    : agentMode
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'border border-border text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                }`}
              >
                <Zap size={11} />
                Agent Mode
                {agentEnabled && agentMode && <span className="ml-0.5">ON</span>}
              </button>
              <button
                onClick={submit}
                disabled={disabled || !value.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Send
                <Send size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSend(s)}
              disabled={disabled}
              className="px-2.5 py-1 text-xs text-text-secondary bg-surface border border-border rounded hover:border-border-2 hover:text-text-primary transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
