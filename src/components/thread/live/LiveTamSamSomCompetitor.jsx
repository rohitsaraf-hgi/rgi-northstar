import { Swords, AlertTriangle, Sparkles } from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import LiveCoachNote from './LiveCoachNote.jsx';
import { COMPETITOR_PENETRATION } from '../../../data/tamSamSomData.js';

function Bar({ label, count, pct, color, total }) {
  const w = Math.min(100, pct);
  return (
    <div className="grid grid-cols-[160px_1fr_auto] gap-3 items-center text-xs py-1">
      <div className="text-text-secondary truncate" title={label}>{label}</div>
      <div className="h-4 bg-bg/60 rounded relative overflow-hidden">
        <div className={`h-full ${color} rounded transition-all duration-500`} style={{ width: `${w}%` }} />
        <div className="absolute inset-0 flex items-center px-2 text-[10px] font-mono text-text-primary">{pct}%</div>
      </div>
      <div className="font-mono text-[11px] text-text-primary w-12 text-right">{count}</div>
    </div>
  );
}

export default function LiveTamSamSomCompetitor({ competitor = 'Palo Alto Networks', onPin }) {
  const data = COMPETITOR_PENETRATION['palo-alto'];

  return (
    <LiveFrame
      title={`Competitor penetration — ${competitor}`}
      subtitle="Splits your SOM into competitive-overlap (incumbent threat) and competitive-whitespace (clean entry points)."
      onPin={onPin}
    >
      {/* Headline split */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3 rounded-md border border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={11} className="text-rose-700 dark:text-rose-300" />
            <span className="text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-300 font-bold">
              Competitive overlap
            </span>
          </div>
          <div className="text-xl font-semibold text-text-primary">{data.installed}</div>
          <div className="text-[11px] text-text-muted">{data.pctInstalled}% of SOM · {competitor} incumbent</div>
        </div>
        <div className="p-3 rounded-md border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={11} className="text-emerald-700 dark:text-emerald-300" />
            <span className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-bold">
              Competitive whitespace
            </span>
          </div>
          <div className="text-xl font-semibold text-text-primary">{data.notInstalled}</div>
          <div className="text-[11px] text-text-muted">{data.pctNotInstalled}% of SOM · clean entry</div>
        </div>
      </div>

      {/* Two-playbook coaching */}
      <LiveCoachNote
        tone="win"
        headline="Two distinct playbooks here — pick based on rep maturity."
        body={`Threat (${data.installed} accounts): ${competitor} is incumbent. Longer cycles, harder positioning, but bigger ACVs. Best for senior AEs.\n\nOpportunity (${data.notInstalled} accounts): no security incumbent detected. Shorter cycles, smaller ACVs, cleaner displacement. Best for newer AEs and outbound velocity.`}
        more={[
          `If you're forecasting Q3, lean into the ${data.notInstalled} clean accounts — they close faster. Save the displacement plays for late-Q4 / Q1 pipeline build.`,
          `Watch for accounts where ${competitor} has been installed >5 years — those are renewal-vulnerability windows worth prioritizing.`,
        ]}
        className="mb-4"
      />

      {/* Key player penetration */}
      <div className="mb-1 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
        Key player penetration in your SOM
      </div>
      <div className="space-y-0.5">
        {data.keyPlayers.map((p) => (
          <Bar
            key={p.name}
            label={p.name}
            count={p.count}
            pct={p.pct}
            color="bg-purple-500"
            total={data.totalInScope}
          />
        ))}
      </div>

      <LiveCoachNote
        tone="insight"
        headline="Microsoft 365 saturation (90%+) confirms these are mature IT buyers."
        body="Universal Microsoft 365 + Google Marketing presence tells you these companies have established IT operations and centralized procurement. That's good news — they buy methodically, can absorb new vendors, and have budget. The flip side: they're slower than mid-market and require formal POCs."
        className="mt-3"
      />
    </LiveFrame>
  );
}
