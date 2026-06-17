import { useState } from 'react';
import { MousePointerClick } from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import LiveCoachNote from './LiveCoachNote.jsx';
import { TAM_SAM_SOM_BREAKDOWNS } from '../../../data/tamSamSomData.js';

// Per-segment AI commentary keyed by section + label. Click a bar to surface
// the AI's interpretation of that specific slice — what it means and what to
// do with it.
const SEGMENT_NOTES = {
  geography: {
    'United States': {
      tone: 'win',
      headline: '92% of your SOM concentrates here.',
      body: 'United States is the natural anchor — both the largest fintech market and the deepest data coverage in HG. Most of your historical wins are here. Start outbound here, expand to Canada once you have repeatable motion.',
    },
    Canada: {
      tone: 'insight',
      headline: 'Small but high-quality — $5.2B SOM with 9% of fintech IT spend.',
      body: "Canadian fintech is concentrated in Toronto/Montreal. Same buyer titles as US, but procurement cycles are 30–40% longer. Don't chase Canada until your US motion is producing predictable pipeline.",
    },
  },
  industry: {
    'Banking & Financial Services': {
      tone: 'win',
      headline: 'BFS dominates at 54% of your SOM — focus here first.',
      body: "Banking is your highest-spend, most-mature buyer. Security spend per company is 3-4x other fintech subverticals. Your historical conversion patterns suggest BFS deals are 1.4x bigger and 22% faster than insurance equivalents.",
    },
    Insurance: {
      tone: 'insight',
      headline: 'Insurance is your second-largest segment but lags BFS in security maturity.',
      body: "Insurance buyers are catching up fast — regulatory pressure (NAIC, state-level cyber requirements) is driving spend growth. Expect longer education cycles but smoother ROI conversations once value is established.",
    },
    'Computer & Electronic Mfg': {
      tone: 'caution',
      headline: 'This is mostly fintech-adjacent, not core fintech.',
      body: "Companies in this segment tend to be payment-processing hardware vendors and POS providers — they look fintech-like but buy security differently. Validate fit before mass outreach. May be better classified as a separate segment.",
    },
    'Professional, Scientific & Tech': {
      tone: 'insight',
      headline: 'Smallest slice but high-value when present.',
      body: "Mostly fintech consultancies, payment-processor service partners, and crypto-native SaaS. Lower volume but they tend to have outsized influence — winning a few here can drive referrals into BFS proper.",
    },
  },
  revenue: {
    '$5B+': {
      tone: 'win',
      headline: '92% of your SOM spend sits here — these are your forecast anchors.',
      body: 'Above $5B revenue, fintech buyers have dedicated security teams, established budgets, and predictable buying cycles. Long sales cycles (8–12 months) but high deal value (avg $480K ACV). Forecasting works here.',
    },
    '$1B–$5B': {
      tone: 'insight',
      headline: 'A small slice today, but worth testing.',
      body: "Mid-market fintech ($1–5B revenue) is harder to forecast — security spend is more volatile and decisions are often made by IT generalists, not dedicated security teams. Test a few accounts before scaling outbound.",
    },
  },
  employees: {
    '10K+': {
      tone: 'win',
      headline: 'All your SOM is concentrated here — by design.',
      body: '10K+ employees correlates almost 1:1 with $5B+ revenue in fintech. This single-band concentration means tightening employee thresholds further would cut SOM dramatically without adding precision. Leave as-is.',
    },
  },
};

function HBar({ section, label, value, max, color = 'bg-primary', onClick, selected }) {
  const pct = Math.min(100, (value / max) * 100);
  const note = SEGMENT_NOTES[section]?.[label];
  const clickable = !!note;
  return (
    <button
      onClick={() => clickable && onClick && onClick(section, label)}
      disabled={!clickable}
      className={`grid grid-cols-[140px_1fr_auto] gap-3 items-center text-xs py-1 px-1 rounded w-full transition-colors ${
        clickable ? 'hover:bg-primary/[0.04] cursor-pointer' : 'cursor-default'
      } ${selected ? 'bg-primary/[0.06] ring-1 ring-primary/30' : ''}`}
      title={clickable ? 'Click to see what this segment means' : undefined}
    >
      <div className="text-text-secondary truncate text-left" title={label}>
        {label}
      </div>
      <div className="h-4 bg-bg/60 rounded relative overflow-hidden">
        <div className={`h-full ${color} rounded transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <div className="font-mono text-[11px] text-text-primary w-14 text-right">${value}B</div>
    </button>
  );
}

function Section({ title, section, rows, color, onSelect, selected }) {
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">{title}</div>
      <div className="space-y-0.5">
        {rows.map((r) => (
          <HBar
            key={r.label}
            section={section}
            label={r.label}
            value={r.value}
            max={max}
            color={color}
            onClick={onSelect}
            selected={selected?.section === section && selected?.label === r.label}
          />
        ))}
      </div>
    </div>
  );
}

export default function LiveTamSamSomBreakdown({ variant = 'fintech-na-sized', onPin }) {
  const [selected, setSelected] = useState(null);
  const data = TAM_SAM_SOM_BREAKDOWNS[variant];
  if (!data) return null;

  const note = selected ? SEGMENT_NOTES[selected.section]?.[selected.label] : null;

  return (
    <LiveFrame
      title="Market size by dimension"
      subtitle="Same underlying SOM ($58.3B), sliced four ways."
      onPin={onPin}
    >
      <div className="text-[11px] text-text-muted mb-3 inline-flex items-center gap-1.5">
        <MousePointerClick size={11} className="text-primary" />
        Click any bar — I'll explain what that segment means and what to do with it.
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Section title="By geography" section="geography" rows={data.geography} color="bg-blue-500" onSelect={(s, l) => setSelected({ section: s, label: l })} selected={selected} />
        <Section title="By industry" section="industry" rows={data.industry} color="bg-purple-500" onSelect={(s, l) => setSelected({ section: s, label: l })} selected={selected} />
        <Section title="By revenue band" section="revenue" rows={data.revenue} color="bg-emerald-500" onSelect={(s, l) => setSelected({ section: s, label: l })} selected={selected} />
        <Section title="By employee band" section="employees" rows={data.employees} color="bg-rose-500" onSelect={(s, l) => setSelected({ section: s, label: l })} selected={selected} />
      </div>

      {/* Headline takeaway, always visible */}
      <LiveCoachNote
        tone="insight"
        headline="BFS + USA + $5B+ revenue is where to start."
        body="Three concentrations are doing most of the work: BFS makes up 54% of SOM, USA is 92%, and $5B+ revenue is 92%. Start outbound here — it's both the biggest pool and the highest-fit pool."
        className="mt-4"
      />

      {/* Per-segment commentary surfaced on click */}
      {note && (
        <LiveCoachNote
          tone={note.tone}
          headline={note.headline}
          body={note.body}
          className="mt-2"
        />
      )}
    </LiveFrame>
  );
}
