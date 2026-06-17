import { useState } from 'react';
import { LiveFrame, FilterChip } from './LiveFrame.jsx';
import { APAC_MARKET_SIZE } from '../../../data/apacTamData.js';

const VARIANTS = APAC_MARKET_SIZE;

export default function LiveMarketSize({ variant = 'initial', highlight = 'som', onFilterRemove, onPin }) {
  const [activeVariant, setActiveVariant] = useState(variant);
  const data = VARIANTS[activeVariant] || VARIANTS.initial;

  const handleRemove = (filter) => {
    if (onFilterRemove) {
      onFilterRemove(filter);
    } else {
      // Local fallback: switch to the no-employees variant if employees filter removed
      if (filter.id === 'employees') setActiveVariant('noEmployeesFilter');
    }
  };

  const cards = [
    { key: 'tam', label: 'TAM', sub: data.tam.label, ...data.tam },
    { key: 'sam', label: 'SAM', sub: data.sam.label, ...data.sam },
    { key: 'som', label: 'SOM', sub: data.som.label, ...data.som },
  ];

  return (
    <LiveFrame
      title="Market Size — APAC Fintech"
      subtitle="Computed across 14,200 companies in 5 APAC markets. Updates as you refine filters."
      onPin={onPin}
      footer={`Credit usage · ${data.creditUsage.used.toLocaleString()} / ${data.creditUsage.total.toLocaleString()}`}
    >
      <div className="grid grid-cols-3 gap-2 mb-4">
        {cards.map((c) => {
          const isHighlight = c.key === highlight;
          return (
            <div
              key={c.key}
              className={`p-3 rounded-md border transition-colors ${
                isHighlight ? 'border-primary/50 bg-primary/5' : 'border-border bg-bg/40'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                {c.label}
              </div>
              <div className="text-xl font-semibold text-text-primary tracking-tight">{c.spend}</div>
              <div className="flex items-baseline gap-2 mt-1">
                <div className="text-xs font-mono text-text-secondary">{c.companies}</div>
                <div className="text-[10px] text-text-muted">companies</div>
              </div>
              <div className="text-[10px] text-text-muted mt-1.5 leading-tight">{c.sub}</div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
          How we're filtering your data
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.filters.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              value={f.value}
              onRemove={f.removable ? () => handleRemove(f) : undefined}
            />
          ))}
        </div>
      </div>
    </LiveFrame>
  );
}
