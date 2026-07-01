// InsightCard sub-section components.
//
// Each section is rendered conditionally by InsightCard.jsx — if the
// fixture has the matching key on its insightCard, the section appears.
// Sections are designed to read as a stack: metric grid → tiers /
// breakdown → competitor share / industry / spend trend → support
// blocks (lock-in, department entry, decay forecast, spend distribution)
// → signal attribution + confidence (rendered by InsightCard itself).
//
// We use plain SVG for donut + sparkline so we stay off Recharts (per
// the stack decision — Vite + existing tokens, no new deps).

import { TrendingUp, TrendingDown, AlertOctagon, Building2 } from 'lucide-react';

// Map of accent color → Tailwind classes. Used by several sections.
// File-local — not exported, to keep react-refresh happy (a file that
// exports both components and constants breaks fast refresh).
const ACCENT = {
  emerald: { fg: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500',  bgPale: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  sky:     { fg: 'text-sky-700 dark:text-sky-300',         bg: 'bg-sky-500',       bgPale: 'bg-sky-500/10',     border: 'border-sky-500/30' },
  amber:   { fg: 'text-amber-700 dark:text-amber-300',     bg: 'bg-amber-500',     bgPale: 'bg-amber-500/10',   border: 'border-amber-500/30' },
  rose:    { fg: 'text-rose-700 dark:text-rose-300',       bg: 'bg-rose-500',      bgPale: 'bg-rose-500/10',    border: 'border-rose-500/30' },
  violet:  { fg: 'text-violet-700 dark:text-violet-300',   bg: 'bg-violet-500',    bgPale: 'bg-violet-500/10',  border: 'border-violet-500/30' },
  gray:    { fg: 'text-text-secondary',                     bg: 'bg-text-muted/60', bgPale: 'bg-text-muted/10',  border: 'border-text-muted/30' },
};

const ATTR_BADGE = {
  high:   { label: 'High',   classes: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  medium: { label: 'Medium', classes: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  low:    { label: 'Low',    classes: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30' },
};

// ─── Section frame ──────────────────────────────────────────────────

export function Section({ title, children, className = '' }) {
  return (
    <div className={`rounded-lg border border-border bg-bg/30 px-4 py-3 ${className}`}>
      {title && (
        <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-2.5">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Tier list (JTBD 4 + 6) ─────────────────────────────────────────

export function TierList({ tiers }) {
  if (!tiers?.rows?.length) return null;
  const total = tiers.rows.reduce((sum, t) => sum + (t.count || 0), 0);
  return (
    <Section title={tiers.title}>
      <div className="space-y-2.5">
        {tiers.rows.map((tier, i) => {
          const accent = ACCENT[tier.color] || ACCENT.sky;
          const pct = total > 0 ? Math.round((tier.count / total) * 100) : 0;
          return (
            <div
              key={i}
              className={`rounded-md border px-3 py-2 ${
                tier.emphasis ? `${accent.bgPale} ${accent.border}` : 'bg-surface border-border'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`inline-flex items-center text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${accent.bgPale} ${accent.fg} ${accent.border}`}
                  >
                    {tier.name}
                  </span>
                  <span className="text-[11px] text-text-secondary truncate">{tier.criteria}</span>
                </div>
                <div className="text-[13px] font-mono font-semibold text-text-primary flex-shrink-0">
                  {tier.count?.toLocaleString?.() ?? tier.count}
                  <span className="text-text-muted text-[10px] font-medium ml-1">· {pct}%</span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-surface-2 overflow-hidden mb-1.5">
                <div
                  className={`h-full rounded-full ${accent.bg}`}
                  style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                />
              </div>
              {/* Tier extras — show whichever exist on this fixture */}
              {(tier.avgDealSize || tier.winProbability || tier.action) && (
                <div className="flex items-center gap-3 flex-wrap text-[11px] text-text-secondary mb-1">
                  {tier.avgDealSize && (
                    <span>
                      <span className="text-text-muted">avg deal:</span>{' '}
                      <span className="font-mono font-semibold text-text-primary">{tier.avgDealSize}</span>
                    </span>
                  )}
                  {tier.winProbability && (
                    <span>
                      <span className="text-text-muted">win prob:</span>{' '}
                      <span className="font-semibold text-text-primary">{tier.winProbability}</span>
                    </span>
                  )}
                  {tier.action && (
                    <span>
                      <span className="text-text-muted">action:</span>{' '}
                      <span className="text-text-primary">{tier.action}</span>
                    </span>
                  )}
                </div>
              )}
              {tier.messaging && (
                <div className="text-[11.5px] italic text-text-secondary leading-relaxed mt-1 pl-2 border-l-2 border-border-2">
                  "{tier.messaging}"
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ─── Competitor share donut + table (JTBD 1) ────────────────────────

export function CompetitorShareDonut({ share }) {
  if (!share?.slices?.length) return null;
  const size = 110;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  // Pre-compute cumulative offsets in a single reduce so the JSX map
  // stays a pure function of its index (no mutation during render).
  const arcs = share.slices.reduce((acc, s) => {
    const prior = acc.length === 0 ? 0 : acc[acc.length - 1].cumPctAfter;
    acc.push({
      slice: s,
      dash: (s.share / 100) * c,
      offset: -((prior / 100) * c),
      cumPctAfter: prior + s.share,
    });
    return acc;
  }, []);
  return (
    <Section title={share.title}>
      <div className="flex items-center gap-5">
        <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            className="stroke-surface-2"
          />
          {arcs.map((arc, i) => {
            const accent = ACCENT[arc.slice.color] || ACCENT.gray;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                strokeWidth={stroke}
                strokeDasharray={`${arc.dash} ${c - arc.dash}`}
                strokeDashoffset={arc.offset}
                className={accent.bg.replace('bg-', 'stroke-')}
              />
            );
          })}
        </svg>
        <div className="flex-1 min-w-0 space-y-1.5">
          {share.slices.map((s, i) => {
            const accent = ACCENT[s.color] || ACCENT.gray;
            return (
              <div key={i} className="flex items-baseline gap-2 text-[12px]">
                <span className={`w-2 h-2 rounded-full ${accent.bg} flex-shrink-0`} />
                <span className="font-semibold text-text-primary">{s.name}</span>
                <span className="text-text-secondary">{s.share}%</span>
                <span className="text-text-muted font-mono text-[11px] ml-auto">
                  {s.accountCount?.toLocaleString?.() ?? s.accountCount}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

// ─── Industry attractiveness table (JTBD 1) ─────────────────────────

export function IndustryAttractiveness({ table }) {
  if (!table?.rows?.length) return null;
  return (
    <Section title={table.title}>
      <div className="space-y-1">
        <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wider font-bold text-text-muted px-1 pb-1.5 border-b border-border/40">
          <div className="col-span-4">Industry</div>
          <div className="col-span-2 text-right">SOM</div>
          <div className="col-span-3 text-right">Comp. share</div>
          <div className="col-span-3 text-right">Attractive</div>
        </div>
        {table.rows.map((row, i) => {
          const badge = ATTR_BADGE[row.attractiveness] || ATTR_BADGE.medium;
          return (
            <div key={i} className="grid grid-cols-12 gap-2 items-center text-[12px] px-1 py-1.5 hover:bg-bg/40 rounded">
              <div className="col-span-4">
                <div className="font-semibold text-text-primary">{row.industry}</div>
                {row.note && <div className="text-[10.5px] text-text-muted italic">{row.note}</div>}
              </div>
              <div className="col-span-2 text-right font-mono text-text-primary">
                {row.somCount?.toLocaleString?.() ?? row.somCount}
              </div>
              <div className="col-span-3 text-right font-mono text-text-secondary">{row.competitorShare}%</div>
              <div className="col-span-3 text-right">
                <span className={`inline-flex items-center text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${badge.classes}`}>
                  {badge.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ─── Spend trend sparkline (JTBD 1) ─────────────────────────────────

export function SpendTrendSparkline({ trend }) {
  if (!trend?.dataPoints?.length) return null;
  const data = trend.dataPoints;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const w = 100;
  const h = 28;
  const range = Math.max(1, max - min);
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');
  const last = data[data.length - 1];
  const first = data[0];
  const trendUp = last >= first;
  const TrendIcon = trendUp ? TrendingUp : TrendingDown;
  return (
    <Section title={trend.title}>
      <div className="flex items-center gap-4">
        <svg viewBox={`0 0 ${w} ${h}`} className="flex-1 h-10" preserveAspectRatio="none">
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
          <TrendIcon
            size={14}
            className={trendUp ? 'text-emerald-600' : 'text-rose-600'}
          />
          <span className={`text-[13px] font-semibold ${trendUp ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
            {trend.deltaYoY}
          </span>
          <span className="text-[10px] text-text-muted">YoY</span>
        </div>
      </div>
    </Section>
  );
}

// ─── Spend distribution bars (JTBD 4) ───────────────────────────────

export function SpendDistribution({ distribution }) {
  if (!distribution?.bands?.length) return null;
  const total = distribution.bands.reduce((sum, b) => sum + (b.count || 0), 0);
  return (
    <Section title={distribution.title}>
      <div className="space-y-1.5">
        {distribution.bands.map((band, i) => {
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
    </Section>
  );
}

// ─── Decay forecast (JTBD 4) ────────────────────────────────────────

export function DecayForecast({ forecast }) {
  if (!forecast) return null;
  return (
    <Section title={forecast.title}>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="px-3 py-2 rounded-md border border-amber-500/30 bg-amber-500/5">
          <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300">
            Next 6 months
          </div>
          <div className="font-mono font-semibold text-xl text-amber-700 dark:text-amber-300">
            {forecast.next6mo?.toLocaleString?.() ?? forecast.next6mo}
          </div>
          <div className="text-[10.5px] text-text-muted">accounts likely lost</div>
        </div>
        <div className="px-3 py-2 rounded-md border border-rose-500/30 bg-rose-500/5">
          <div className="text-[10px] uppercase tracking-wider font-bold text-rose-700 dark:text-rose-300">
            Next 12 months
          </div>
          <div className="font-mono font-semibold text-xl text-rose-700 dark:text-rose-300">
            {forecast.next12mo?.toLocaleString?.() ?? forecast.next12mo}
          </div>
          <div className="text-[10.5px] text-text-muted">accounts likely lost</div>
        </div>
      </div>
      {forecast.detail && (
        <div className="text-[11px] text-text-secondary italic leading-relaxed">{forecast.detail}</div>
      )}
    </Section>
  );
}

// ─── Lock-in risk (JTBD 6) ──────────────────────────────────────────

export function LockInRisk({ risk }) {
  if (!risk) return null;
  return (
    <Section title={risk.title}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-md bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
          <AlertOctagon size={16} className="text-violet-700 dark:text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-xl font-mono font-semibold text-text-primary">
              {risk.gsiManaged?.toLocaleString?.() ?? risk.gsiManaged}
            </span>
            <span className="text-[11px] text-text-muted">
              GSI-managed · {risk.percentOfImmediate} of Immediate
            </span>
          </div>
          {risk.detail && (
            <div className="text-[11.5px] text-text-secondary leading-relaxed">{risk.detail}</div>
          )}
        </div>
      </div>
    </Section>
  );
}

// ─── Department entry (JTBD 6) ──────────────────────────────────────

export function DepartmentEntry({ entry }) {
  if (!entry?.slices?.length) return null;
  return (
    <Section title={entry.title}>
      <div className="grid grid-cols-3 gap-2">
        {entry.slices.map((slice, i) => {
          const accent = ACCENT[slice.color] || ACCENT.gray;
          const pct = entry.total > 0 ? Math.round((slice.count / entry.total) * 100) : 0;
          return (
            <div key={i} className={`px-3 py-2 rounded-md border ${accent.bgPale} ${accent.border}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Building2 size={11} className={accent.fg} />
                <span className={`text-[10px] uppercase tracking-wider font-bold ${accent.fg}`}>
                  {slice.label}
                </span>
              </div>
              <div className="font-mono font-semibold text-lg text-text-primary">
                {slice.count?.toLocaleString?.() ?? slice.count}
                <span className="text-text-muted text-[10px] font-medium ml-1">· {pct}%</span>
              </div>
              {slice.detail && (
                <div className="text-[10.5px] text-text-muted italic leading-snug mt-0.5">
                  {slice.detail}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
