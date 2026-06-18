// HgIntelligenceCell — compact table cell that renders an AI-synthesized
// account intelligence summary. Shows the lead-with recommendation +
// entry point inline; clicking opens a popover with the full narrative
// and co-sell/expansion reasoning.

import { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';

function NextTag({ type }) {
  const map = {
    'co-sell': {
      label: 'Co-sell',
      classes: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    },
    expansion: {
      label: 'Expand',
      classes:
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    },
  };
  const m = map[type] || map['co-sell'];
  return (
    <span
      className={`inline-block text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${m.classes}`}
    >
      {m.label}
    </span>
  );
}

export default function HgIntelligenceCell({ intelligence }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  if (!intelligence) {
    return <span className="text-[10px] text-text-muted italic">—</span>;
  }

  const { narrative, lead, next } = intelligence;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="text-left w-full max-w-[260px] group"
        title={narrative}
      >
        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary mb-0.5">
          <Sparkles size={9} className="text-violet-500 flex-shrink-0" />
          <span>Lead with {lead.code}</span>
          <span className="text-text-muted font-normal">·</span>
          <span className="text-text-primary font-medium truncate">{lead.name}</span>
        </div>
        <div className="text-[10px] text-text-secondary leading-tight">
          <ArrowRight size={9} className="inline mr-0.5 text-text-muted" />
          <span className="truncate inline-block max-w-[220px] align-bottom">
            {lead.entryPoint}
          </span>
        </div>
        <div className="text-[10px] text-text-muted mt-0.5 line-clamp-2 group-hover:text-text-secondary transition-colors">
          {narrative}
        </div>
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-30 left-0 top-full mt-1 w-[420px] bg-bg border border-border rounded-md shadow-elev p-4 max-w-[95vw]"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-violet-700 dark:text-violet-300">
              <Sparkles size={11} />
              HG Intelligence
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-0.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary"
            >
              <X size={12} />
            </button>
          </div>

          <p className="text-[12px] text-text-primary leading-relaxed mb-3">
            {narrative}
          </p>

          <div className="border border-primary/30 bg-primary/5 rounded-md p-3 mb-2">
            <div className="text-[9px] uppercase tracking-wider font-bold text-primary mb-1">
              Lead with
            </div>
            <div className="text-sm font-semibold text-text-primary">
              {lead.code} · {lead.name}
            </div>
            <div className="text-[11px] text-text-secondary mt-1">
              <ArrowRight size={10} className="inline mr-1 text-text-muted" />
              {lead.entryPoint}
            </div>
          </div>

          {next && (
            <div className="border border-border bg-surface rounded-md p-3">
              <div className="flex items-center gap-2 mb-1">
                <NextTag type={next.type} />
                <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted">
                  Next
                </span>
              </div>
              <div className="text-sm font-semibold text-text-primary">
                {next.code} · {next.name}
              </div>
              <div className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                {next.reasoning}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
