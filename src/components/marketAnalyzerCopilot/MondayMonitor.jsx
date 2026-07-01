// Monday Monitor — proactive weekly digest at the top of the welcome state.
//
// Spec MACLAUDE.md §7 + Scenario C: this is the first card the user
// sees Monday morning. Four signal-change cards, each with a single
// CTA that bridges to a JTBD with parameters pre-populated from the
// alert context.
//
// Dismissable for the session — once collapsed, the welcome state hides
// it and shows just the starter cards.

import { useState } from 'react';
import {
  TrendingUp,
  Flame,
  AlertCircle,
  Activity,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import { mondayMonitor } from '../../data/marketAnalyzerCopilot/mondayMonitor.js';

const ICON_MAP = {
  'trending-up': TrendingUp,
  flame:         Flame,
  'alert-circle': AlertCircle,
  activity:      Activity,
};

const ACCENT = {
  rose:   { fg: 'text-rose-700 dark:text-rose-300',       border: 'border-rose-500/40',   bg: 'bg-rose-500/8'   },
  amber:  { fg: 'text-amber-700 dark:text-amber-300',     border: 'border-amber-500/40',  bg: 'bg-amber-500/8'  },
  sky:    { fg: 'text-sky-700 dark:text-sky-300',         border: 'border-sky-500/40',    bg: 'bg-sky-500/8'    },
  violet: { fg: 'text-violet-700 dark:text-violet-300',   border: 'border-violet-500/40', bg: 'bg-violet-500/8' },
};

function SignalCard({ signal, onAction }) {
  const Icon = ICON_MAP[signal.icon] || TrendingUp;
  const accent = ACCENT[signal.accent] || ACCENT.sky;
  return (
    <div className={`rounded-lg border ${accent.border} ${accent.bg} px-4 py-3 flex items-start gap-3`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-white/60 dark:bg-black/20 border ${accent.border}`}>
        <Icon size={14} className={accent.fg} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-text-primary leading-snug">{signal.headline}</div>
        <div className="text-[11.5px] text-text-secondary mt-0.5 leading-relaxed">{signal.detail}</div>
        <button
          onClick={() => onAction(signal)}
          className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md border ${accent.border} ${accent.fg} hover:bg-white/40 dark:hover:bg-black/30 transition-colors`}
        >
          {signal.action.label}
          <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

export default function MondayMonitor({ onAction }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-sky-500/5 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-violet-500/15 flex items-center justify-center">
            <Sparkles size={12} className="text-violet-700 dark:text-violet-300" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-violet-700 dark:text-violet-300">
              Monday Monitor
            </div>
            <div className="text-[12px] text-text-secondary">
              Week of {mondayMonitor.weekOf} · 4 signal changes worth your attention
            </div>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
          title="Dismiss for this session"
        >
          <X size={13} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {mondayMonitor.signalChanges.map((sig) => (
          <SignalCard key={sig.id} signal={sig} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}
