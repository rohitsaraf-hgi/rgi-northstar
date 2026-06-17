import { useState, useMemo } from 'react';
import { Sliders, Plus, X, Search, Check, ArrowRight, Sparkles } from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import LiveCoachNote from './LiveCoachNote.jsx';

// Real HG intent topics (from /lookup intent_topics) — security/cyber/fintech relevant.
const INTENT_TOPICS = [
  { id: '303A894E101746D09277F1F255CC8A40', label: 'cybersecurity', category: 'security' },
  { id: '3FE0AB5F0A4ECD2858B022178EB9DE67', label: 'Zero Trust', category: 'security' },
  { id: '930E4ACAC7751225BC524B39CBB5AED', label: 'Zero Trust Model', category: 'security' },
  { id: 'C66928848C2664D99CBCABFE12D4871', label: 'Zero Trust Architecture', category: 'security' },
  { id: '2542E6789B273C51BE81F0000A669969', label: 'zero trust network access (ZTNA)', category: 'networking' },
  { id: '1C237C85BCF987972A7EAF20CF39D9F8', label: 'endpoint cybersecurity', category: 'security' },
  { id: '7D8F413650CF68EC03802A8F21463CB', label: 'cybersecurity solutions', category: 'security' },
  { id: '24607A3C733EFE6BEBB87C51287A5726', label: 'cybersecurity threats', category: 'security' },
  { id: '2602297A54D93A062DE40470F5FFE6BD', label: 'cloud cybersecurity', category: 'security' },
  { id: '3FD1447CAF1FBC4619DB76B207821C70', label: 'cybersecurity framework', category: 'security' },
  { id: '1F361EB3E00B2AAD46AADEBE54F35FE4', label: 'cybersecurity regulation', category: 'security' },
  { id: '15867B952E229D5F1C2AFDE308D4EF6E', label: 'cybersecurity audit', category: 'security' },
];

// Real HG products (from /lookup products) — security stack signals.
const TECH_INSTALLS = [
  { id: 35057, label: 'Palo Alto NGFW', vendor: 'Palo Alto Networks' },
  { id: 33166, label: 'Palo Alto Cortex XSIAM', vendor: 'Palo Alto Networks' },
  { id: 16633, label: 'Palo Alto Cortex XDR', vendor: 'Palo Alto Networks' },
  { id: 30667, label: 'Palo Alto Prisma SASE', vendor: 'Palo Alto Networks' },
  { id: 'cs1', label: 'CrowdStrike Falcon', vendor: 'CrowdStrike' },
  { id: 'cs2', label: 'CrowdStrike Falcon Insight', vendor: 'CrowdStrike' },
  { id: 'zs1', label: 'Zscaler Internet Access', vendor: 'Zscaler' },
  { id: 'zs2', label: 'Zscaler Private Access', vendor: 'Zscaler' },
  { id: 'ft1', label: 'Fortinet FortiGate', vendor: 'Fortinet' },
  { id: 'ms1', label: 'Microsoft Defender', vendor: 'Microsoft' },
];

// Default fit dimensions — these mirror HG Customer Fit Score Builder defaults.
const DEFAULT_DIMENSIONS = [
  { id: 'industry', label: 'Industry match', weight: 20, desc: 'Company belongs to an ICP industry (BFS / Insurance / etc.)' },
  { id: 'geo', label: 'Geography match', weight: 10, desc: 'Company HQ is in an ICP geography' },
  { id: 'revenue', label: 'Revenue band match', weight: 15, desc: 'Annual revenue within ICP band' },
  { id: 'employees', label: 'Employee band match', weight: 15, desc: 'Headcount within ICP band' },
  { id: 'tech_install', label: 'Tech install signal', weight: 25, desc: 'Has competitive product or adjacent stack installed' },
  { id: 'intent_surge', label: 'Intent surge', weight: 15, desc: 'Active research signal in last 30 days' },
];

function WeightSlider({ dim, onChange, disabled }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-text-primary">{dim.label}</span>
          <span className="text-[11px] text-text-muted font-mono">{dim.weight}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={50}
          step={5}
          value={dim.weight}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full accent-primary"
        />
        <div className="text-[10px] text-text-muted mt-0.5 leading-snug">{dim.desc}</div>
      </div>
    </div>
  );
}

function ChipPicker({ icon: Icon, title, items, selected, onToggle, disabled, max = 5 }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={12} className="text-primary" />
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">{title}</span>
        <span className="text-[10px] text-text-muted">{selected.length} selected</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {selected.map((id) => {
          const item = items.find((i) => i.id === id);
          if (!item) return null;
          return (
            <span key={id} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-primary/10 border border-primary/30 text-primary rounded text-[11px] font-medium">
              {item.label}
              {!disabled && (
                <button onClick={() => onToggle(id)} className="ml-0.5 p-0.5 rounded hover:bg-primary/20 hover:text-danger">
                  <X size={10} />
                </button>
              )}
            </span>
          );
        })}
        {!disabled && (
          <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 px-2 py-0.5 border border-dashed border-border text-text-muted hover:text-text-secondary hover:border-border-2 rounded text-[11px]">
            <Plus size={10} /> Add
          </button>
        )}
      </div>
      {open && !disabled && (
        <div className="bg-surface border border-border rounded-md p-2 mb-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-bg/40 border border-border rounded mb-2">
            <Search size={11} className="text-text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" autoFocus className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none" />
          </div>
          <div className="max-h-40 overflow-y-auto thin-scrollbar space-y-0.5">
            {filtered.slice(0, 12).map((i) => {
              const isPicked = selected.includes(i.id);
              return (
                <button key={i.id} onClick={() => onToggle(i.id)} className={`w-full text-left px-2 py-1 rounded text-xs flex items-center gap-2 transition-colors ${isPicked ? 'bg-primary/10 text-primary' : 'hover:bg-bg/60 text-text-secondary'}`}>
                  <span className="flex-1">{i.label}</span>
                  {i.category && <span className="text-[9px] text-text-muted uppercase tracking-wider">{i.category}</span>}
                  {isPicked && <Check size={11} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LiveScoringProfileBuilder({ submitted, lockedState, onSubmit, onPin }) {
  const [dimensions, setDimensions] = useState(lockedState?.dimensions || DEFAULT_DIMENSIONS);
  const [intent, setIntent] = useState(lockedState?.intent || ['303A894E101746D09277F1F255CC8A40', '3FE0AB5F0A4ECD2858B022178EB9DE67', '1C237C85BCF987972A7EAF20CF39D9F8']);
  const [tech, setTech] = useState(lockedState?.tech || [35057, 'cs1', 'zs1']);

  const totalWeight = useMemo(() => dimensions.reduce((s, d) => s + d.weight, 0), [dimensions]);
  const isBalanced = totalWeight === 100;

  const updateWeight = (id, weight) => {
    if (submitted) return;
    setDimensions((prev) => prev.map((d) => (d.id === id ? { ...d, weight } : d)));
  };

  const toggle = (key, id) => {
    if (submitted) return;
    if (key === 'intent') setIntent((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    if (key === 'tech') setTech((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const handleSubmit = () => {
    if (!isBalanced) {
      // Auto-normalize to 100
      const norm = dimensions.map((d) => ({ ...d, weight: Math.round((d.weight / totalWeight) * 100) }));
      onSubmit && onSubmit({ dimensions: norm, intent, tech });
    } else {
      onSubmit && onSubmit({ dimensions, intent, tech });
    }
  };

  return (
    <LiveFrame
      title="Build a scoring profile"
      subtitle="Two scores per company: Fit Score (how well they match your ICP) and Intent Score (how much they're researching now). Combined score drives prioritization."
      onPin={onPin}
    >
      <LiveCoachNote
        tone="guide"
        headline="Tech install + Industry are the strongest predictors for security displacement."
        body="In HG's customer-fit benchmark for security vendors, Tech install signals account for ~30% of variance, Industry ~20%, Intent surge ~15%. The defaults below mirror that — adjust if your historical wins skew differently (e.g., add weight to Geo if you only sell US)."
        more={[
          'Weights below 10% are usually noise — better to drop the dimension than dilute the signal.',
          "If you're early in the year and historical wins are sparse, Intent can be over-weighted (chase signal). After ~50 wins, lean back into Tech install + Industry.",
        ]}
        compact
        className="mb-4"
      />

      {/* Weight sliders */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold inline-flex items-center gap-1.5">
            <Sliders size={11} className="text-primary" /> Fit dimension weights
          </span>
          <span className={`text-[11px] font-mono ${isBalanced ? 'text-success' : 'text-warning'}`}>
            Total: {totalWeight}% {isBalanced ? '✓' : '· auto-normalized on submit'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-bg/30 border border-border rounded p-3">
          {dimensions.map((d) => (
            <WeightSlider key={d.id} dim={d} onChange={(w) => updateWeight(d.id, w)} disabled={submitted} />
          ))}
        </div>
      </div>

      {/* Tech installs */}
      <div className="mt-4">
        <ChipPicker
          icon={Sparkles}
          title="Tech install signals (competitor / adjacent stack)"
          items={TECH_INSTALLS}
          selected={tech}
          onToggle={(id) => toggle('tech', id)}
          disabled={submitted}
        />
      </div>

      {/* Intent topics */}
      <div className="mt-2">
        <ChipPicker
          icon={Sparkles}
          title="Intent topics to track (HG taxonomy)"
          items={INTENT_TOPICS}
          selected={intent}
          onToggle={(id) => toggle('intent', id)}
          disabled={submitted}
        />
      </div>

      {!submitted ? (
        <div className="flex items-center justify-end mt-4 pt-3 border-t border-border">
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors font-medium"
          >
            Apply scoring to list
            <ArrowRight size={11} />
          </button>
        </div>
      ) : (
        <div className="mt-3 px-2 py-1.5 bg-primary/[0.06] border border-primary/20 rounded text-[11px] text-primary inline-flex items-center gap-1.5">
          <Check size={11} />
          Scoring profile applied
        </div>
      )}
    </LiveFrame>
  );
}

export { INTENT_TOPICS, TECH_INSTALLS, DEFAULT_DIMENSIONS };
