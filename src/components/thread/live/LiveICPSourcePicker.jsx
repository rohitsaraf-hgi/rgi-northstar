import { useState } from 'react';
import { Upload, Package, ListChecks, Check, Sparkles } from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import LiveCoachNote from './LiveCoachNote.jsx';

// Inline form turn — captures HOW the user wants to define their ICP.
// Three branches: drop a CSV (fastest), pick product names, or define manually.
const SOURCES = [
  {
    id: 'csv',
    label: 'Customer list (CSV)',
    icon: Upload,
    desc: "I'll match your customers and derive industries, geo, revenue, and headcount automatically.",
    badge: 'Fastest',
    badgeColor: 'bg-success/15 text-success border-success/30',
  },
  {
    id: 'product',
    label: 'Product name(s)',
    icon: Package,
    desc: "Tell me your products and I'll find their install base, then derive ICP from those companies.",
    badge: null,
  },
  {
    id: 'manual',
    label: 'Define manually',
    icon: ListChecks,
    desc: 'Pick industries, geographies, and thresholds yourself.',
    badge: null,
  },
];

export default function LiveICPSourcePicker({ submitted, selectedSource, onSubmit, onPin }) {
  const [picked, setPicked] = useState(submitted ? selectedSource : 'csv');

  return (
    <LiveFrame
      title="How should I define your ICP?"
      subtitle="Pick the source — I'll guide you from there. The CSV path is fastest because I extract everything in one shot."
      onPin={onPin}
    >
      <LiveCoachNote
        tone="guide"
        headline="Drop a customer list — it's the fastest path."
        body="A CSV captures revealed preferences (what your customers actually look like) instead of assumptions. I'll extract industries, geography, and revenue/employee bands in one shot, and reuse the same file for whitespace classification later."
        more={[
          'Product-based works when you have install-base data — I look up companies that have your product installed and derive ICP from that population. Useful if your customer list is incomplete in CRM.',
          'Manual is the slowest path but gives full control. Pick this only if the AI-derived ICP from a CSV would be misleading (e.g., your top 5 customers are outliers).',
        ]}
        className="mb-3"
      />
      <div className="grid grid-cols-3 gap-2">
        {SOURCES.map((s) => {
          const Icon = s.icon;
          const isPicked = picked === s.id;
          return (
            <button
              key={s.id}
              disabled={submitted}
              onClick={() => setPicked(s.id)}
              className={`text-left p-3 rounded-md border transition-all ${
                isPicked
                  ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border bg-bg/40 hover:border-border-2'
              } ${submitted ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-card'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center">
                  <Icon size={13} className="text-primary" />
                </div>
                {s.badge && (
                  <span
                    className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold border ${s.badgeColor}`}
                  >
                    {s.badge}
                  </span>
                )}
                {isPicked && !s.badge && <Check size={12} className="text-primary" />}
              </div>
              <div className="text-xs font-semibold text-text-primary mb-1">{s.label}</div>
              <div className="text-[11px] text-text-secondary leading-snug">{s.desc}</div>
            </button>
          );
        })}
      </div>

      {!submitted && (
        <div className="flex items-center justify-end mt-3">
          <button
            onClick={() => onSubmit && onSubmit({ source: picked })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors font-medium"
          >
            <Sparkles size={11} />
            Continue with {SOURCES.find((s) => s.id === picked)?.label}
          </button>
        </div>
      )}
      {submitted && (
        <div className="mt-3 px-2 py-1.5 bg-primary/[0.06] border border-primary/20 rounded text-[11px] text-primary inline-flex items-center gap-1.5">
          <Check size={11} />
          Continued with{' '}
          <span className="font-semibold">
            {SOURCES.find((s) => s.id === selectedSource)?.label}
          </span>
        </div>
      )}
    </LiveFrame>
  );
}
