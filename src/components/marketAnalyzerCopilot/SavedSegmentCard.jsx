// JTBD 7 Saved Segment card — used in the right panel.
//
// Spec MACLAUDE.md §6 "Saved Segment Card visual spec":
//   - motion tag (small colored pill, top-left)
//   - headline: segment name
//   - body: account count + MoM delta (↑/↓ with %) + spend-trend mini-sparkline
//   - footer: last refreshed + hover actions
//
// Hover actions: Run Whitespace (JTBD 4), Run Displacement (JTBD 6),
// View Detail (JTBD 7 segment detail view). Each emits the action via
// onAction so the parent (right panel → CopilotShell) can route it.

import { TrendingUp, TrendingDown, Minus, Eye, Play } from 'lucide-react';

const MOTION_PILL = {
  new_logo:     { label: 'New logo',     bg: 'bg-emerald-500/15', fg: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/40' },
  expansion:    { label: 'Expansion',    bg: 'bg-sky-500/15',     fg: 'text-sky-700 dark:text-sky-300',         border: 'border-sky-500/40' },
  displacement: { label: 'Displacement', bg: 'bg-rose-500/15',    fg: 'text-rose-700 dark:text-rose-300',       border: 'border-rose-500/40' },
  vertical:     { label: 'Vertical play',bg: 'bg-violet-500/15',  fg: 'text-violet-700 dark:text-violet-300',   border: 'border-violet-500/40' },
};

function MomBadge({ delta, direction }) {
  if (!delta || delta === '—') {
    return <span className="text-[10px] text-text-muted">— pending</span>;
  }
  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const color =
    direction === 'up'   ? 'text-emerald-700 dark:text-emerald-300' :
    direction === 'down' ? 'text-rose-700 dark:text-rose-300' :
                            'text-text-muted';
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${color}`}>
      <Icon size={10} />
      {delta}
    </span>
  );
}

function Sparkline({ data, direction }) {
  if (!Array.isArray(data) || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const w = 60;
  const h = 16;
  const range = Math.max(1, max - min);
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');
  const stroke =
    direction === 'up'   ? 'stroke-emerald-500' :
    direction === 'down' ? 'stroke-rose-500' :
                            'stroke-text-muted';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`w-14 h-4 ${stroke}`} preserveAspectRatio="none">
      <polyline fill="none" strokeWidth="1.5" points={points} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function SavedSegmentCard({ segment, onAction }) {
  const motion = MOTION_PILL[segment.motion] || MOTION_PILL.new_logo;
  return (
    <div
      className={`group rounded-lg border bg-surface px-3 py-2.5 hover:border-primary/40 transition-colors ${
        segment.isNew ? 'border-primary/40 ring-2 ring-primary/20' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={`inline-flex items-center text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${motion.bg} ${motion.fg} ${motion.border}`}>
          {motion.label}
        </span>
        {segment.isNew && (
          <span className="text-[9px] uppercase tracking-wider font-bold text-primary">Just saved</span>
        )}
      </div>
      <div className="text-[13px] font-semibold text-text-primary leading-snug mb-1.5 line-clamp-2">
        {segment.name}
      </div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-mono font-semibold text-text-primary">
            {segment.accountCount?.toLocaleString?.() ?? segment.accountCount}
          </span>
          <span className="text-[10px] text-text-muted">accounts</span>
        </div>
        <MomBadge delta={segment.monthOverMonth} direction={segment.monthOverMonthDirection} />
      </div>
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-text-muted">Refreshed {segment.lastRefreshed}</div>
        <Sparkline data={segment.spendTrend} direction={segment.monthOverMonthDirection} />
      </div>
      {/* Hover actions — appear on hover, take no layout space when hidden */}
      <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onAction({ kind: 'view-detail', segment })}
          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/10 rounded transition-colors"
          title="View JTBD 7 Segment Detail"
        >
          <Eye size={10} /> Detail
        </button>
        <button
          onClick={() => onAction({ kind: 'run-jtbd', jtbdId: 4, segment })}
          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 rounded transition-colors"
          title="Refresh whitespace within this segment"
        >
          <Play size={10} /> Whitespace
        </button>
        <button
          onClick={() => onAction({ kind: 'run-jtbd', jtbdId: 6, segment })}
          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
          title="Plan a displacement within this segment"
        >
          <Play size={10} /> Displace
        </button>
      </div>
    </div>
  );
}
