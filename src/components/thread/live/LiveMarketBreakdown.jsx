import { useState } from 'react';
import { ChevronDown, Lightbulb } from 'lucide-react';
import { LiveFrame, HBar } from './LiveFrame.jsx';
import { APAC_BREAKDOWNS } from '../../../data/apacTamData.js';

const DIMENSIONS = [
  { id: 'country', label: 'Country' },
  { id: 'industry', label: 'Industry sub-vertical' },
  { id: 'revenue', label: 'Revenue band' },
  { id: 'employees', label: 'Employee count' },
];

export default function LiveMarketBreakdown({ initialDimension = 'country', onPin }) {
  const [dim, setDim] = useState(initialDimension);
  const [open, setOpen] = useState(false);
  const data = APAC_BREAKDOWNS[dim];
  const max = Math.max(...data.rows.map((r) => r.pct));

  return (
    <LiveFrame
      title="SOM Breakdown"
      subtitle={`Distribution of 1,840 companies in your APAC SOM, broken down by ${data.dimension.toLowerCase()}.`}
      onPin={onPin}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
          Segmenting by
        </div>
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-bg border border-border rounded text-xs text-text-primary hover:border-border-2 transition-colors"
          >
            {data.dimension}
            <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 bg-surface-2 border border-border rounded-md overflow-hidden shadow-xl z-20 min-w-[180px]">
              {DIMENSIONS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setDim(d.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-bg/60 transition-colors ${
                    dim === d.id ? 'text-primary' : 'text-text-secondary'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {data.rows.map((row) => (
          <HBar
            key={row.label}
            label={row.label}
            value={`${row.companies.toLocaleString()} companies · ${row.spend}`}
            pct={row.pct}
            max={max}
            color="bg-primary/70"
          />
        ))}
      </div>

      <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/15 rounded-md">
        <Lightbulb size={12} className="text-primary mt-0.5 flex-shrink-0" />
        <div className="text-xs text-text-secondary leading-relaxed">{data.insight}</div>
      </div>
    </LiveFrame>
  );
}
