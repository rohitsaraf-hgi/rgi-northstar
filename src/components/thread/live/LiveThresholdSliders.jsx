import { useState } from 'react';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import LiveCoachNote from './LiveCoachNote.jsx';

// Inline form turn — adjust SOM thresholds with auto-derived defaults from
// the customer CSV. Sliders show current SOM count live.
const REVENUE_BANDS = [
  { id: '1m', label: '$1M', value: 1 },
  { id: '10m', label: '$10M', value: 10 },
  { id: '50m', label: '$50M', value: 50 },
  { id: '100m', label: '$100M', value: 100 },
  { id: '200m', label: '$200M', value: 200 },
  { id: '500m', label: '$500M', value: 500 },
  { id: '1bn', label: '$1B', value: 1000 },
  { id: '5bn', label: '$5B', value: 5000 },
];

const EMPLOYEE_BANDS = [
  { id: '1', label: '1', value: 1 },
  { id: '50', label: '50', value: 50 },
  { id: '200', label: '200', value: 200 },
  { id: '500', label: '500', value: 500 },
  { id: '1k', label: '1K', value: 1000 },
  { id: '5k', label: '5K', value: 5000 },
  { id: '10k', label: '10K', value: 10000 },
];

function BandStrip({ bands, lowIdx, highIdx, derivedIdx, onChangeLow, onChangeHigh, label, derivedLabel, disabled }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">{label}</span>
        <span className="text-[10px] text-text-muted">
          <Sparkles size={9} className="inline text-primary mr-0.5" />
          Derived: {derivedLabel}
        </span>
      </div>
      <div className="flex items-stretch gap-0.5">
        {bands.map((b, i) => {
          const inRange = i >= lowIdx && i <= highIdx;
          const isDerived = i === derivedIdx;
          return (
            <button
              key={b.id}
              disabled={disabled}
              onClick={() => {
                // Click on a band — if before lowIdx, set as new low. If after highIdx, set as new high.
                // If in-range, toggle which side based on proximity.
                if (i < lowIdx) onChangeLow(i);
                else if (i > highIdx) onChangeHigh(i);
                else if (Math.abs(i - lowIdx) < Math.abs(i - highIdx)) onChangeLow(i);
                else onChangeHigh(i);
              }}
              className={`flex-1 px-1 py-2 rounded text-[10px] font-mono transition-colors relative ${
                inRange
                  ? 'bg-primary/15 text-primary border border-primary/40'
                  : 'bg-bg/40 text-text-muted border border-border hover:border-border-2'
              } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              {b.label}
              {isDerived && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-1.5 text-[11px]">
        <span className="text-text-secondary font-mono">
          {bands[lowIdx]?.label} – {bands[highIdx]?.label}
        </span>
      </div>
    </div>
  );
}

export default function LiveThresholdSliders({
  submitted,
  selectedThresholds,
  onSubmit,
  onPin,
  derivedRevenueIdx = 6, // $1B
  derivedEmployeeIdx = 5, // 5K
}) {
  // Default range: ±1 band around the derived value
  const [revLow, setRevLow] = useState(submitted ? selectedThresholds.revLow : Math.max(0, derivedRevenueIdx - 1));
  const [revHigh, setRevHigh] = useState(submitted ? selectedThresholds.revHigh : REVENUE_BANDS.length - 1);
  const [empLow, setEmpLow] = useState(submitted ? selectedThresholds.empLow : Math.max(0, derivedEmployeeIdx - 1));
  const [empHigh, setEmpHigh] = useState(submitted ? selectedThresholds.empHigh : EMPLOYEE_BANDS.length - 1);

  // Live SOM estimate (mocked — proportional to band tightness)
  const revRange = revHigh - revLow + 1;
  const empRange = empHigh - empLow + 1;
  const tightness = (revRange / REVENUE_BANDS.length) * (empRange / EMPLOYEE_BANDS.length);
  const somCount = Math.max(50, Math.round(800 * tightness));
  const somSpend = `$${(somCount * 0.215).toFixed(1)}B`;

  return (
    <LiveFrame
      title="Tighten your SOM thresholds"
      subtitle="The amber dot is the median from your customer list — a sensible default. Drag the bands to widen or narrow."
      onPin={onPin}
      footer={`Estimated SOM · ${somCount.toLocaleString()} companies · ${somSpend} spend`}
    >
      <LiveCoachNote
        tone="guide"
        headline="Your customers cluster around $1.2B revenue and 12K employees."
        body="Tightening to $1B+ keeps 90% of your historical fit pattern but trims SOM to a focused list. Loosening to $500M+ adds ~38% more SOM at the cost of conversion precision."
        more={[
          "Sub-$1B fintech buyers are more price-sensitive and have shorter sales cycles, but lower ACVs. If you're capacity-constrained on AEs, tighter bands maximize $/rep.",
          "Above $5B, you're in 'lighthouse' territory — slow but reference-account quality. Don't size your forecast off these alone.",
        ]}
        compact
        className="mb-4"
      />
      <div className="space-y-4">
        <BandStrip
          bands={REVENUE_BANDS}
          lowIdx={revLow}
          highIdx={revHigh}
          derivedIdx={derivedRevenueIdx}
          onChangeLow={setRevLow}
          onChangeHigh={setRevHigh}
          label="Annual revenue"
          derivedLabel={REVENUE_BANDS[derivedRevenueIdx]?.label}
          disabled={submitted}
        />
        <BandStrip
          bands={EMPLOYEE_BANDS}
          lowIdx={empLow}
          highIdx={empHigh}
          derivedIdx={derivedEmployeeIdx}
          onChangeLow={setEmpLow}
          onChangeHigh={setEmpHigh}
          label="Employee count"
          derivedLabel={EMPLOYEE_BANDS[derivedEmployeeIdx]?.label}
          disabled={submitted}
        />
      </div>

      {!submitted && (
        <div className="flex items-center justify-end mt-3">
          <button
            onClick={() =>
              onSubmit && onSubmit({
                revLow, revHigh, empLow, empHigh,
                revRange: `${REVENUE_BANDS[revLow].label}–${REVENUE_BANDS[revHigh].label}`,
                empRange: `${EMPLOYEE_BANDS[empLow].label}–${EMPLOYEE_BANDS[empHigh].label}`,
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors font-medium"
          >
            Lock SOM thresholds
            <ArrowRight size={11} />
          </button>
        </div>
      )}
      {submitted && (
        <div className="mt-3 px-2 py-1.5 bg-primary/[0.06] border border-primary/20 rounded text-[11px] text-primary inline-flex items-center gap-1.5">
          <Check size={11} />
          SOM locked · revenue {selectedThresholds.revRange} · employees {selectedThresholds.empRange}
        </div>
      )}
    </LiveFrame>
  );
}
