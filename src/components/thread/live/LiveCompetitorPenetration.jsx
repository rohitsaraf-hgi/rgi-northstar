import { useState } from 'react';
import { Lightbulb, TrendingUp } from 'lucide-react';
import { LiveFrame, HBar } from './LiveFrame.jsx';
import { APAC_COMPETITORS } from '../../../data/apacTamData.js';

function PenetrationView({ data }) {
  const max = Math.max(...data.competitors.map((c) => c.pct));
  return (
    <>
      <div className="space-y-2 mb-4">
        {data.competitors.map((c) => (
          <div key={c.name} className="grid grid-cols-[160px_1fr_auto] gap-3 items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-text-secondary truncate">{c.name}</span>
            </div>
            <div className="h-5 bg-bg/60 rounded relative overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{ width: `${(c.pct / max) * 100}%`, background: c.color, opacity: 0.7 }}
              />
              <div className="absolute inset-0 flex items-center px-2 text-[10px] font-mono text-text-primary">
                {c.companies.toLocaleString()} companies
              </div>
            </div>
            <div className="text-text-primary font-mono w-12 text-right">{c.pct}%</div>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/15 rounded-md">
        <Lightbulb size={12} className="text-primary mt-0.5 flex-shrink-0" />
        <div className="text-xs text-text-secondary leading-relaxed">{data.insight}</div>
      </div>
    </>
  );
}

function TrendView({ data }) {
  const months = data.series[0].points.map((p) => p.month);
  return (
    <>
      <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-3">
        Penetration trend · {data.period}
      </div>
      <div className="relative h-44 bg-bg/40 border border-border rounded-md p-3 mb-4">
        <svg className="w-full h-full" viewBox="0 0 400 140" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((p) => (
            <line
              key={p}
              x1="0"
              x2="400"
              y1={140 - (p * 140) / 50}
              y2={140 - (p * 140) / 50}
              stroke="#2A2D38"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
          ))}
          {/* Series */}
          {data.series.map((series) => {
            const points = series.points
              .map((pt, i) => {
                const x = (i / (series.points.length - 1)) * 400;
                const y = 140 - (pt.pct * 140) / 50;
                return `${x},${y}`;
              })
              .join(' ');
            return (
              <g key={series.name}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={series.color}
                  strokeWidth="2"
                />
                {series.points.map((pt, i) => {
                  const x = (i / (series.points.length - 1)) * 400;
                  const y = 140 - (pt.pct * 140) / 50;
                  return (
                    <circle key={i} cx={x} cy={y} r="3" fill={series.color} />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {data.series.map((s) => {
          const start = s.points[0].pct;
          const end = s.points[s.points.length - 1].pct;
          const change = ((end - start) / start) * 100;
          return (
            <div key={s.name} className="bg-bg/40 border border-border rounded-md p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-text-secondary">{s.name}</span>
              </div>
              <div className="text-lg font-semibold text-text-primary">{end}%</div>
              <div className="text-[10px] text-text-muted">
                {change > 0 ? '+' : ''}{change.toFixed(0)}% vs Apr 2025
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-start gap-2 p-3 bg-warning/5 border border-warning/20 rounded-md">
        <TrendingUp size={12} className="text-warning mt-0.5 flex-shrink-0" />
        <div className="text-xs text-text-secondary leading-relaxed">{data.insight}</div>
      </div>
    </>
  );
}

export default function LiveCompetitorPenetration({ view: initialView = 'penetration', onPin }) {
  const [view, setView] = useState(initialView);

  return (
    <LiveFrame
      title="Competitor Presence"
      subtitle={APAC_COMPETITORS.initial.market}
      onPin={onPin}
    >
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        <button
          onClick={() => setView('penetration')}
          className={`px-3 py-1.5 text-xs transition-colors border-b -mb-px ${
            view === 'penetration'
              ? 'text-text-primary border-primary'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          Penetration
        </button>
        <button
          onClick={() => setView('trend')}
          className={`px-3 py-1.5 text-xs transition-colors border-b -mb-px ${
            view === 'trend'
              ? 'text-text-primary border-primary'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          Trend (12 mo)
        </button>
      </div>

      {view === 'penetration' ? (
        <PenetrationView data={APAC_COMPETITORS.initial} />
      ) : (
        <TrendView data={APAC_COMPETITORS.trend} />
      )}
    </LiveFrame>
  );
}
