// API trace panel — the spec's "honesty mechanism" (§8).
//
// Stakeholders see the conversation; engineers see what API chain it
// implies. Color-coded by data source. Pinned to the bottom of the
// Copilot shell, collapsible.
//
// We render in two visual states per entry:
//   started   — pulsing dot + parameters JSON
//   completed — checkmark + parameters JSON + mock result chip

import { useState } from 'react';
import { ChevronUp, ChevronDown, Code2, Trash2 } from 'lucide-react';

const SOURCE_COLOR = {
  firmographic:  { bg: 'bg-primary/10',     text: 'text-primary',                            border: 'border-primary/30',   label: 'Firmographic' },
  technographic: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/30', label: 'Technographic' },
  spend:         { bg: 'bg-amber-500/10',   text: 'text-amber-700 dark:text-amber-300',     border: 'border-amber-500/30',  label: 'Spend' },
  intent:        { bg: 'bg-rose-500/10',    text: 'text-rose-700 dark:text-rose-300',       border: 'border-rose-500/30',   label: 'Intent' },
  fai:           { bg: 'bg-violet-500/10',  text: 'text-violet-700 dark:text-violet-300',   border: 'border-violet-500/30', label: 'FAI' },
  contracts:     { bg: 'bg-teal-500/10',    text: 'text-teal-700 dark:text-teal-300',       border: 'border-teal-500/30',   label: 'Contracts' },
  contacts:      { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-700 dark:text-fuchsia-300', border: 'border-fuchsia-500/30', label: 'Contacts' },
};

function ParamDump({ params }) {
  if (!params || Object.keys(params).length === 0) {
    return <span className="text-text-muted italic">no params</span>;
  }
  return (
    <span className="font-mono text-[10.5px] text-text-secondary">
      {Object.entries(params).map(([k, v], i) => (
        <span key={k}>
          {i > 0 && ', '}
          <span className="text-text-muted">{k}:</span>{' '}
          <span className="text-text-primary">
            {Array.isArray(v) ? `[${v.join(', ')}]` : String(v)}
          </span>
        </span>
      ))}
    </span>
  );
}

function TraceRow({ entry }) {
  const color = SOURCE_COLOR[entry.source] || SOURCE_COLOR.firmographic;
  const isCompleted = entry.status === 'completed';
  return (
    <div className="flex items-start gap-2 py-1.5 px-3 border-b border-border/30 hover:bg-bg/30">
      <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full relative">
        <span
          className={`absolute inset-0 rounded-full ${
            isCompleted ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
          }`}
        />
        <span
          className={`absolute inset-0 rounded-full ${
            isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />
      </div>
      <span
        className={`inline-flex items-center text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border flex-shrink-0 ${color.bg} ${color.text} ${color.border}`}
      >
        {color.label}
      </span>
      <span className="font-mono text-[11px] text-text-primary flex-shrink-0">
        {entry.tool}
      </span>
      <span className="text-[11px] text-text-secondary truncate min-w-0 flex-1">
        — {entry.purpose}
      </span>
      <ParamDump params={entry.params} />
      {isCompleted && entry.mockResult && (
        <span className="text-[10.5px] font-mono font-semibold text-emerald-700 dark:text-emerald-300 flex-shrink-0">
          → {entry.mockResult}
        </span>
      )}
    </div>
  );
}

export default function ApiTracePanel({ trace, onClear }) {
  const [open, setOpen] = useState(false);
  const count = trace?.length || 0;
  return (
    <div className="border-t border-border bg-bg/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-1.5">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 text-[11px] font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          {open ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          <Code2 size={12} />
          API trace
          <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold font-mono">
            {count}
          </span>
        </button>
        {open && count > 0 && (
          <button
            onClick={onClear}
            title="Clear trace log"
            className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-rose-600 transition-colors"
          >
            <Trash2 size={11} /> Clear
          </button>
        )}
      </div>
      {open && (
        <div className="max-h-[180px] overflow-y-auto thin-scrollbar border-t border-border/40 bg-surface">
          {count === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-text-muted italic">
              No API calls yet. Start a conversation to see the Copilot's call chain.
            </div>
          ) : (
            trace.map((entry) => <TraceRow key={`${entry.id}-${entry.status}`} entry={entry} />)
          )}
        </div>
      )}
    </div>
  );
}
