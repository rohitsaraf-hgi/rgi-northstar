// JTBD 7 — Segment Detail View.
//
// Spec MACLAUDE.md §5 + Appendix B note: "JTBD 7 has a unique surface
// — the Segment Detail View. Unlike other JTBDs which produce one
// Insight Card per analysis, JTBD 7 has a persistent dashboard view
// per saved segment."
//
// We render it as an inline conversation item so it stays in scroll
// history alongside other Insight Cards. Visually it borrows the
// Insight Card chrome but flags itself with a distinct purple accent
// (matching the JTBD 7 motion-segment pill) so users recognize it as
// the segment library surface, not an analysis run.

import {
  ArrowRight,
  Bookmark,
  Eye,
  Play,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import SoWhatBlock from './SoWhatBlock.jsx';

const ACCENT = {
  emerald: { fg: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500',  bgPale: 'bg-emerald-500/10', border: 'border-emerald-500/40' },
  sky:     { fg: 'text-sky-700 dark:text-sky-300',         bg: 'bg-sky-500',       bgPale: 'bg-sky-500/10',     border: 'border-sky-500/40' },
  amber:   { fg: 'text-amber-700 dark:text-amber-300',     bg: 'bg-amber-500',     bgPale: 'bg-amber-500/10',   border: 'border-amber-500/40' },
  rose:    { fg: 'text-rose-700 dark:text-rose-300',       bg: 'bg-rose-500',      bgPale: 'bg-rose-500/10',    border: 'border-rose-500/40' },
  violet:  { fg: 'text-violet-700 dark:text-violet-300',   bg: 'bg-violet-500',    bgPale: 'bg-violet-500/10',  border: 'border-violet-500/40' },
  gray:    { fg: 'text-text-secondary',                     bg: 'bg-text-muted/60', bgPale: 'bg-text-muted/10',  border: 'border-text-muted/40' },
};

function MetricCell({ metric }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border ${
        metric.highlight ? 'bg-violet-500/8 border-violet-500/30' : 'bg-surface border-border'
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted">
        {metric.label}
      </div>
      <div className={`mt-1 font-mono font-semibold tracking-tight ${
        metric.highlight ? 'text-violet-700 dark:text-violet-300 text-2xl' : 'text-text-primary text-xl'
      }`}>
        {metric.value}
      </div>
      <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">{metric.subtitle}</div>
    </div>
  );
}

function CompositionShifts({ shifts }) {
  if (!shifts?.reasons?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-bg/30 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-2">
        {shifts.title}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="px-3 py-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/5">
          <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300">
            Entrants
          </div>
          <div className="font-mono font-semibold text-lg text-emerald-700 dark:text-emerald-300">
            +{shifts.entrants}
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-md border border-rose-500/30 bg-rose-500/5">
          <div className="text-[10px] uppercase tracking-wider font-bold text-rose-700 dark:text-rose-300">
            Dropouts
          </div>
          <div className="font-mono font-semibold text-lg text-rose-700 dark:text-rose-300">
            -{shifts.dropouts}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        {shifts.reasons.map((r, i) => {
          const accent = ACCENT[r.color] || ACCENT.gray;
          return (
            <div key={i} className="flex items-center justify-between gap-2 text-[11.5px] py-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full ${accent.bg} flex-shrink-0`} />
                <span className="text-text-secondary truncate">{r.label}</span>
              </div>
              <span className="font-mono text-text-primary font-semibold flex-shrink-0">
                {r.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreDistribution({ dist }) {
  if (!dist?.bands?.length) return null;
  const total = dist.bands.reduce((sum, b) => sum + (b.count || 0), 0);
  return (
    <div className="rounded-lg border border-border bg-bg/30 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-2">
        {dist.title}
      </div>
      <div className="space-y-1.5">
        {dist.bands.map((band, i) => {
          const accent = ACCENT[band.color] || ACCENT.sky;
          const pct = total > 0 ? Math.round((band.count / total) * 100) : 0;
          return (
            <div key={i}>
              <div className="flex items-baseline justify-between text-[12px] mb-0.5">
                <span className="text-text-secondary">{band.label}</span>
                <span className="font-mono text-text-primary">
                  {band.count?.toLocaleString?.() ?? band.count}{' '}
                  <span className="text-text-muted">· {pct}%</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div className={`h-full rounded-full ${accent.bg}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpendTrend({ trend }) {
  if (!trend?.dataPoints?.length) return null;
  const data = trend.dataPoints;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const w = 100;
  const h = 24;
  const range = Math.max(1, max - min);
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');
  const trendUp = data[data.length - 1] >= data[0];
  const TrendIcon = trendUp ? TrendingUp : TrendingDown;
  return (
    <div className="rounded-lg border border-border bg-bg/30 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-2">
        {trend.title}
      </div>
      <div className="flex items-center gap-4">
        <svg viewBox={`0 0 ${w} ${h}`} className="flex-1 h-8" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="rgb(var(--color-primary))"
            strokeWidth="1.5"
            points={points}
            vectorEffect="non-scaling-stroke"
          />
          <polygon
            fill="rgb(var(--color-primary) / 0.12)"
            points={`0,${h} ${points} ${w},${h}`}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <TrendIcon size={13} className={trendUp ? 'text-emerald-600' : 'text-rose-600'} />
          <span className={`text-[12px] font-semibold ${trendUp ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
            {trend.deltaYoY}
          </span>
        </div>
      </div>
    </div>
  );
}

const MOTION_PILL = {
  new_logo:     { label: 'New logo motion',     accent: 'emerald' },
  expansion:    { label: 'Expansion motion',    accent: 'sky' },
  displacement: { label: 'Displacement motion', accent: 'rose' },
  vertical:     { label: 'Vertical play',       accent: 'violet' },
};

export default function SegmentDetailView({ detail, onAction }) {
  if (!detail) return null;
  const motion = MOTION_PILL[detail.motion] || MOTION_PILL.new_logo;
  const accent = ACCENT[motion.accent] || ACCENT.emerald;
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-violet-500/30 bg-surface overflow-hidden shadow-card">
        {/* Header — violet accent distinguishes segment view from analysis */}
        <div
          className="px-5 py-3 flex items-center justify-between text-white"
          style={{ background: 'linear-gradient(135deg, #6B4FA0 0%, #4F7FFF 100%)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Bookmark size={14} className="flex-shrink-0 opacity-80" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-bold opacity-80">
                ICP Segment · JTBD 7
              </div>
              <div className="font-semibold text-sm tracking-tight truncate">{detail.name}</div>
            </div>
          </div>
          <span className={`inline-flex items-center text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${accent.bgPale} ${accent.fg} ${accent.border} flex-shrink-0`}>
            {motion.label}
          </span>
        </div>

        <div className="p-5 space-y-3">
          {Array.isArray(detail.headlineMetrics) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {detail.headlineMetrics.map((m, i) => (
                <MetricCell key={i} metric={m} />
              ))}
            </div>
          )}
          <CompositionShifts shifts={detail.compositionShifts} />
          {(detail.scoreDistribution || detail.spendTrend) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {detail.scoreDistribution && <ScoreDistribution dist={detail.scoreDistribution} />}
              {detail.spendTrend && <SpendTrend trend={detail.spendTrend} />}
            </div>
          )}
        </div>
      </div>

      {detail.soWhat && <SoWhatBlock soWhat={detail.soWhat} />}

      {/* Quick actions — bridge into other JTBDs from the segment context */}
      <div className="flex flex-wrap gap-2 ml-11">
        <button
          onClick={() => onAction({ kind: 'run-jtbd', jtbdId: 5, segment: { id: detail.segmentId, name: detail.name } })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-primary text-white hover:bg-primary-dim transition-colors"
        >
          <Play size={11} /> Run prioritization within this segment <ArrowRight size={10} className="opacity-70" />
        </button>
        <button
          onClick={() => onAction({ kind: 'run-jtbd', jtbdId: 6, segment: { id: detail.segmentId, name: detail.name } })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-surface text-text-secondary border border-border hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Play size={11} /> Plan displacement within this segment <ArrowRight size={10} className="opacity-70" />
        </button>
        <button
          onClick={() => onAction({ kind: 'run-jtbd', jtbdId: 4, segment: { id: detail.segmentId, name: detail.name } })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-surface text-text-secondary border border-border hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Eye size={11} /> Find whitespace inside this segment <ArrowRight size={10} className="opacity-70" />
        </button>
      </div>
    </div>
  );
}

// Small helper to render the trend direction icon when motion direction
// isn't tied to up/down (e.g., 'stable'). Imported by parent so the
// motion arrow stays consistent across views.
export function MomTrendIcon({ direction }) {
  if (direction === 'up') return <TrendingUp size={11} />;
  if (direction === 'down') return <TrendingDown size={11} />;
  return <Minus size={11} />;
}
