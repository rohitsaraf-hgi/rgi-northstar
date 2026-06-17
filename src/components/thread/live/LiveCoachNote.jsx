import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Lightbulb, AlertTriangle, TrendingUp } from 'lucide-react';

// Inline AI coaching/commentary embedded inside live result and form turns.
// Headline + body are always visible. Optional `more` content expands on
// click — used for deeper rationale or alternatives. Tone-aware: 'guide'
// for proactive recommendations, 'insight' for chart explanations,
// 'caution' for things to watch out for.

const TONES = {
  guide: {
    icon: Lightbulb,
    label: 'AI guide',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/[0.06]',
    iconColor: 'text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-500/15',
    headline: 'text-text-primary',
  },
  insight: {
    icon: Sparkles,
    label: 'AI insight',
    border: 'border-primary/30',
    bg: 'bg-primary/[0.04]',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/15',
    headline: 'text-text-primary',
  },
  caution: {
    icon: AlertTriangle,
    label: 'Watch out',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/[0.05]',
    iconColor: 'text-rose-700 dark:text-rose-300',
    iconBg: 'bg-rose-500/15',
    headline: 'text-text-primary',
  },
  win: {
    icon: TrendingUp,
    label: 'Best move',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/[0.05]',
    iconColor: 'text-emerald-700 dark:text-emerald-300',
    iconBg: 'bg-emerald-500/15',
    headline: 'text-text-primary',
  },
};

export default function LiveCoachNote({
  tone = 'insight',
  headline,
  body,
  more,
  className = '',
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const cfg = TONES[tone] || TONES.insight;
  const Icon = cfg.icon;

  return (
    <div className={`rounded-md border ${cfg.border} ${cfg.bg} ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'} ${className}`}>
      <div className="flex items-start gap-2">
        <div className={`w-5 h-5 rounded ${cfg.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Icon size={11} className={cfg.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[9px] uppercase tracking-wider font-bold ${cfg.iconColor}`}>{cfg.label}</span>
          </div>
          {headline && (
            <div className={`text-xs font-semibold ${cfg.headline} leading-snug`}>{headline}</div>
          )}
          {body && (
            <div className="text-[11px] text-text-secondary leading-relaxed mt-1 whitespace-pre-line">{body}</div>
          )}
          {more && more.length > 0 && (
            <>
              {open && (
                <div className="mt-2 space-y-1.5 text-[11px] text-text-secondary leading-relaxed border-l-2 border-border pl-2">
                  {more.map((m, i) => (
                    <p key={i}>{m}</p>
                  ))}
                </div>
              )}
              <button
                onClick={() => setOpen((v) => !v)}
                className={`mt-1.5 text-[10px] inline-flex items-center gap-0.5 hover:underline ${cfg.iconColor}`}
              >
                {open ? (
                  <>
                    <ChevronUp size={10} /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown size={10} /> Why this matters
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
