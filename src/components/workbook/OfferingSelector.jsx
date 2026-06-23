// OfferingSelector — single control replacing the old Segmented/Flat toggle.
//
// Concept:
//   selected = []   →  "All offerings" (Flat table, one row per company,
//                       fit scores for every offering as columns)
//   selected = [a]  →  Segmented view scoped to one offering
//   selected = [a,b,…] → Segmented view scoped to those offerings
//
// Behaviour:
//   - Picking "All offerings" clears the per-offering selection
//   - Picking an individual offering toggles it in/out; "All offerings"
//     deselects automatically when one or more individuals are picked
//   - Used by both admins and sellers

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Layers, Package } from 'lucide-react';

export default function OfferingSelector({ offerings, selected, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Close on outside-click. Keep handler stable; mount/unmount on open.
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isAll = !Array.isArray(selected) || selected.length === 0;
  const selectedCount = isAll ? 0 : selected.length;

  // Display label: "All offerings" / "<offering name>" / "N offerings"
  let label;
  if (isAll) {
    label = 'All offerings';
  } else if (selectedCount === 1) {
    const o = offerings.find((x) => x.id === selected[0]);
    label = o?.shortName || o?.name || '1 offering';
  } else {
    label = `${selectedCount} offerings`;
  }

  const toggleOne = (id) => {
    const set = new Set(selected || []);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    // If user has selected every offering, treat it as "All" (empty array)
    if (set.size === offerings.length || set.size === 0) {
      onChange([]);
    } else {
      onChange(Array.from(set));
    }
  };

  const pickAll = () => {
    onChange([]);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${
          disabled
            ? 'bg-surface border-border text-text-muted opacity-60 cursor-not-allowed'
            : isAll
            ? 'bg-surface border-border text-text-secondary hover:border-primary/40 hover:text-text-primary'
            : 'bg-primary/10 border-primary/30 text-primary font-semibold'
        }`}
        title={isAll ? 'Showing all offerings as columns (flat view)' : 'Showing a segmented view of selected offerings'}
      >
        {isAll ? <Layers size={11} /> : <Package size={11} />}
        <span className="truncate max-w-[180px]">{label}</span>
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-bg border border-border rounded-md shadow-elev z-30 overflow-hidden">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-text-muted border-b border-border/60">
            View by offering
          </div>
          {/* "All offerings" — equivalent to the old Flat view */}
          <button
            type="button"
            onClick={pickAll}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2 transition-colors ${
              isAll ? 'bg-primary/5' : ''
            }`}
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                isAll ? 'bg-primary border-primary text-white' : 'border-border'
              }`}
            >
              {isAll && <Check size={10} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-text-primary">All offerings</div>
              <div className="text-[10px] text-text-muted">Flat table · fit score per offering as columns</div>
            </div>
            <Layers size={11} className="text-text-muted flex-shrink-0" />
          </button>
          <div className="border-t border-border/60 px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-text-muted bg-bg/30">
            Or segment by
          </div>
          <div className="max-h-72 overflow-y-auto thin-scrollbar">
            {offerings.map((o) => {
              const checked = !isAll && selected.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggleOne(o.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2 transition-colors ${
                    checked ? 'bg-primary/5' : ''
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      checked ? 'bg-primary border-primary text-white' : 'border-border'
                    }`}
                  >
                    {checked && <Check size={10} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-text-primary truncate">
                      {o.name}
                    </div>
                    {o.category && (
                      <div className="text-[10px] text-text-muted truncate">{o.category}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
