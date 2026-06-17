import { useState } from 'react';
import { Search, Check, Plus, X, ArrowRight } from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import LiveCoachNote from './LiveCoachNote.jsx';

const SUGGESTED = [
  { id: 'palo-alto', name: 'Palo Alto Networks', segment: 'Security · 153 of SOM (56.5%)' },
  { id: 'crowdstrike', name: 'CrowdStrike', segment: 'Security · 84 of SOM (31%)' },
  { id: 'zscaler', name: 'Zscaler', segment: 'Security · 62 of SOM (23%)' },
  { id: 'fortinet', name: 'Fortinet', segment: 'Security · 71 of SOM (26%)' },
  { id: 'cisco-secure', name: 'Cisco Secure', segment: 'Security · 95 of SOM (35%)' },
];

export default function LiveCompetitorPicker({
  submitted,
  selectedCompetitors,
  defaultSelected = ['palo-alto'],
  onSubmit,
  onPin,
}) {
  const [picked, setPicked] = useState(submitted ? selectedCompetitors : defaultSelected);
  const [query, setQuery] = useState('');

  const toggle = (id) => {
    if (submitted) return;
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const filtered = SUGGESTED.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));

  const pickedNames = picked
    .map((id) => SUGGESTED.find((s) => s.id === id)?.name)
    .filter(Boolean);

  return (
    <LiveFrame
      title="Add competitors"
      subtitle="Pick the products you want to size against. Penetration is computed across your SOM — both threat (overlap) and opportunity (whitespace) views."
      onPin={onPin}
    >
      <LiveCoachNote
        tone="guide"
        headline="For your Fintech NA SOM, top competitors by penetration: Palo Alto (56.5%), Cisco Secure (35%), CrowdStrike (31%)."
        body="I've pre-selected Palo Alto since it has the highest overlap with your customer base — that gives you the cleanest threat-vs-opportunity split. Add 1-2 others if you want comparison; more than 3 and the chart gets noisy."
        more={[
          'Add CrowdStrike if you want to track the fastest-growing competitor — penetration up 8pts in the last 12 months.',
          'Skip Fortinet unless you sell on-prem — their fintech footprint is concentrated in branch-network use cases, not the same buyer.',
        ]}
        compact
        className="mb-3"
      />
      {/* Search */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-bg/40 border border-border rounded mb-3">
        <Search size={12} className="text-text-muted flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products… (e.g. Palo Alto, CrowdStrike)"
          disabled={submitted}
          className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      {/* Suggestions */}
      <div className="space-y-1">
        {filtered.map((s) => {
          const isPicked = picked.includes(s.id);
          return (
            <button
              key={s.id}
              disabled={submitted}
              onClick={() => toggle(s.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded border transition-all flex items-center gap-2 ${
                isPicked
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border bg-bg/40 hover:border-border-2'
              } ${submitted ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-text-primary">{s.name}</div>
                <div className="text-[10px] text-text-muted">{s.segment}</div>
              </div>
              {isPicked ? (
                <Check size={12} className="text-primary" />
              ) : (
                <Plus size={12} className="text-text-muted" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected */}
      {pickedNames.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
            {pickedNames.length} selected
          </div>
          <div className="flex flex-wrap gap-1">
            {pickedNames.map((n) => (
              <span
                key={n}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[11px] font-medium"
              >
                {n}
                {!submitted && (
                  <button
                    onClick={() => toggle(SUGGESTED.find((s) => s.name === n)?.id)}
                    className="hover:text-danger"
                  >
                    <X size={9} />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {!submitted && (
        <div className="flex items-center justify-end mt-3">
          <button
            onClick={() => onSubmit && onSubmit({ competitors: picked, names: pickedNames })}
            disabled={picked.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim disabled:opacity-40 transition-colors font-medium"
          >
            Compute penetration
            <ArrowRight size={11} />
          </button>
        </div>
      )}
      {submitted && (
        <div className="mt-3 px-2 py-1.5 bg-primary/[0.06] border border-primary/20 rounded text-[11px] text-primary inline-flex items-center gap-1.5">
          <Check size={11} />
          Penetration computed for {pickedNames.length} competitor{pickedNames.length === 1 ? '' : 's'}
        </div>
      )}
    </LiveFrame>
  );
}
