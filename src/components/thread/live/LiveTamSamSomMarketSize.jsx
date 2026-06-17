import { Edit3 } from 'lucide-react';
import { LiveFrame, FilterChip } from './LiveFrame.jsx';
import LiveCoachNote from './LiveCoachNote.jsx';
import { TAM_SAM_SOM_VARIANTS } from '../../../data/tamSamSomData.js';

// Per-variant commentary the AI surfaces alongside the cards. Each entry
// frames the numbers in plain language: what they mean, what to do next.
const COMMENTARY = {
  'global-default': {
    tone: 'insight',
    headline: 'This is the maximum possible market — useful as an upper bound, not a target.',
    body: 'Software spend across all industries globally. Most B2B vendors narrow this 60–80% before ICP filtering, since you only sell to a handful of industries and geos. Tell me your scope or drop a customer list to start narrowing.',
  },
  'fintech-na-tam': {
    tone: 'insight',
    headline: 'Fintech + North America cuts global TAM by 70% — directionally right for B2B fintech.',
    body: "$1.4T is your scope ceiling. The real question is what slice of those 27.8M companies match your ICP — that's what SAM and SOM will answer once you give me an ICP signal.",
  },
  'fintech-na-sized': {
    tone: 'insight',
    headline: 'The SAM-to-SOM compression is your headline insight.',
    body: 'TAM → SAM is 7.3% (well-targeted scope). SAM → SOM is <1% (very tight). The SOM tightening is driven mostly by the $5B+ revenue threshold — relax it to $1B+ and SOM expands ~3x at the cost of precision. Worth testing both before locking the forecast.',
    more: [
      "Companies fitting all three criteria (industry + geo + revenue/employee bands) is rare by design — your ideal customer is a specific shape. The 271 in SOM are the 'best-fit' anchors for forecasting.",
      "If your AE capacity is more than ~50 reps, consider expanding SOM. With <50 reps, this size is right.",
    ],
  },
};

function Card({ label, data, highlight }) {
  return (
    <div
      className={`p-3 rounded-md border transition-colors ${
        highlight
          ? 'border-amber-500/50 bg-amber-500/5'
          : data.dim
          ? 'border-border bg-bg/30'
          : 'border-border bg-bg/40'
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">
        {label}
      </div>
      <div
        className={`text-xl font-semibold tracking-tight ${
          data.dim ? 'text-text-muted' : 'text-text-primary'
        }`}
      >
        {data.spend}
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <div className={`text-xs font-mono ${data.dim ? 'text-text-muted' : 'text-text-secondary'}`}>
          {data.companies}
        </div>
        <div className="text-[10px] text-text-muted">
          {data.companies !== '—' ? 'companies' : ''}
        </div>
      </div>
      <div className="text-[10px] text-text-muted mt-1.5 leading-tight">{data.label}</div>
    </div>
  );
}

export default function LiveTamSamSomMarketSize({
  variant = 'global-default',
  onPin,
  editable,
  editTargetId,
  onEditClick,
}) {
  const data = TAM_SAM_SOM_VARIANTS[variant] || TAM_SAM_SOM_VARIANTS['global-default'];
  const commentary = COMMENTARY[variant];

  return (
    <LiveFrame
      title={`Market sizing — ${data.label}`}
      subtitle="TAM = total spend in scope · SAM = scope ∩ ICP · SOM = SAM ∩ realistic thresholds. Each card recomputes when you change inputs."
      onPin={onPin}
    >
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Card label="TAM" data={data.tam} />
        <Card label="SAM" data={data.sam} />
        <Card label="SOM" data={data.som} highlight={data.som.highlight} />
      </div>

      {commentary && (
        <LiveCoachNote
          tone={commentary.tone}
          headline={commentary.headline}
          body={commentary.body}
          more={commentary.more}
          className="mb-3"
        />
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
            How we're filtering
          </span>
          {editable && editTargetId && (
            <button
              onClick={() => onEditClick && onEditClick(editTargetId)}
              className="text-[10px] text-text-muted hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <Edit3 size={9} />
              Edit inputs
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.filters.map((f) => (
            <FilterChip key={f.id} label={f.label} value={f.value} />
          ))}
        </div>
      </div>
    </LiveFrame>
  );
}
