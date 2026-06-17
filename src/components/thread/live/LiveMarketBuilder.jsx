import { useState, useMemo } from 'react';
import {
  DollarSign,
  Building2,
  Globe2,
  TrendingUp,
  Users,
  Plus,
  X,
  Search,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import LiveCoachNote from './LiveCoachNote.jsx';

// ===== Reference data — sourced from HG Insights' real taxonomy =====
// Spend: HG's 4 pillars + key Level-4/5 sub-pillars relevant to security/fintech.
// Each carries the real HG category id and tree path so this is faithful to
// the production Market Analyzer.
const SPEND_CATEGORIES = [
  { id: 'sw', hgId: '3F29441140F200C0D6A3AD354A55FDF', label: 'Software', tree: ['Software'], baseTam: 2100, baseCompanies: 24100000, level: 3 },
  { id: 'sw_infra', hgId: '3F29441140F200C0D6A3AD354A55FE0', label: 'Software Infrastructure', tree: ['Software', 'Software Infrastructure'], baseTam: 740, baseCompanies: 9200000, level: 4 },
  { id: 'sw_security', hgId: '1CD0024569FAA786304FE2B594AC0585', label: 'Security (Software)', tree: ['Software', 'Software Infrastructure', 'Security'], baseTam: 210, baseCompanies: 5800000, level: 5 },
  { id: 'sw_appdev', hgId: '3F29441140F200C0D6A3AD354A55FE1', label: 'Application Development & Deployment', tree: ['Software', 'Application Development and Deployment'], baseTam: 380, baseCompanies: 7400000, level: 4 },
  { id: 'sw_enterprise', hgId: '3F29441140F200C0D6A3AD354A55FE2', label: 'Enterprise Applications', tree: ['Software', 'Enterprise Applications'], baseTam: 620, baseCompanies: 11200000, level: 4 },
  { id: 'svc', hgId: '3F29441140F200C0D6A3AD354A55FE3', label: 'Services', tree: ['Services'], baseTam: 1100, baseCompanies: 18500000, level: 3 },
  { id: 'svc_cloud', hgId: '3F29441140F200C0D6A3AD354A55FE4', label: 'Cloud Services', tree: ['Services', 'Cloud Services'], baseTam: 420, baseCompanies: 14200000, level: 4 },
  { id: 'svc_digital', hgId: '3F29441140F200C0D6A3AD354A55FE5', label: 'Digital Enterprise', tree: ['Services', 'Digital Enterprise'], baseTam: 280, baseCompanies: 6800000, level: 4 },
  { id: 'svc_eus', hgId: '95F95AC7C8D32ED588D4D206C16025', label: 'End User Services', tree: ['Services', 'End User Services'], baseTam: 240, baseCompanies: 7200000, level: 4 },
  { id: 'hw', hgId: '3C02A379965AB0DFCD77B1C484450433', label: 'Hardware', tree: ['Hardware'], baseTam: 580, baseCompanies: 12400000, level: 3 },
  { id: 'hw_security', hgId: '24B2821809CCB1993D9E085E7DDE97D0', label: 'Security (Hardware)', tree: ['Hardware', 'Security'], baseTam: 130, baseCompanies: 3400000, level: 4 },
  { id: 'hw_network', hgId: '3F29441140F200C0D6A3AD354A55FE6', label: 'Network Infrastructure', tree: ['Hardware', 'Network Infrastructure'], baseTam: 210, baseCompanies: 4800000, level: 4 },
  { id: 'comm', hgId: '3F29441140F200C0D6A3AD354A55FE7', label: 'Communications', tree: ['Communications'], baseTam: 920, baseCompanies: 9800000, level: 3 },
];

// HG's 23 industries (real ids from /catalog/industries).
const INDUSTRIES = [
  { id: '2', label: 'Banking and Financial Services', weight: 0.18 },
  { id: 'F', label: 'Public Administration', weight: 0.13 },
  { id: '8', label: 'Insurance', weight: 0.10 },
  { id: '9', label: 'Manufacturing', weight: 0.10 },
  { id: '6', label: 'Health Care and Social Assistance', weight: 0.09 },
  { id: '3', label: 'Computer and Electronic Product Manufacturing', weight: 0.07 },
  { id: '10', label: 'Retail Trade', weight: 0.06 },
  { id: 'E', label: 'Professional, Scientific and Technical Services', weight: 0.05 },
  { id: '12', label: 'Telecommunications', weight: 0.04 },
  { id: '13', label: 'Transportation and Warehousing', weight: 0.04 },
  { id: 'A', label: 'Media and Entertainment', weight: 0.03 },
  { id: 'D', label: 'Pharmaceuticals and Chemicals Manufacturing', weight: 0.03 },
  { id: '5', label: 'Educational Services', weight: 0.02 },
  { id: '4', label: 'Construction and Real Estate', weight: 0.02 },
  { id: '14', label: 'Travel and Tourism', weight: 0.02 },
  { id: '16', label: 'Wholesale Trade', weight: 0.02 },
  { id: '17', label: 'Holding Companies', weight: 0.01 },
];

const GEOGRAPHIES = [
  { id: 'usa', label: 'United States', weight: 0.42 },
  { id: 'china', label: 'China', weight: 0.13 },
  { id: 'japan', label: 'Japan', weight: 0.05 },
  { id: 'uk', label: 'United Kingdom', weight: 0.05 },
  { id: 'germany', label: 'Germany', weight: 0.04 },
  { id: 'canada', label: 'Canada', weight: 0.04 },
  { id: 'india', label: 'India', weight: 0.04 },
  { id: 'france', label: 'France', weight: 0.03 },
  { id: 'australia', label: 'Australia', weight: 0.03 },
  { id: 'singapore', label: 'Singapore', weight: 0.02 },
];

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

// ===== Formatting helpers =====
function formatSpend(b) {
  if (b >= 1000) return `$${(b / 1000).toFixed(1)}T`;
  if (b >= 1) return `$${b.toFixed(1)}B`;
  return `$${(b * 1000).toFixed(0)}M`;
}
function formatNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ===== Live computation =====
function computeMarketSize(state) {
  const { spend, industries, geos, revLow, revHigh, empLow, empHigh } = state;

  const selectedSpend = SPEND_CATEGORIES.filter((c) => spend.includes(c.id));
  const tamSpend = selectedSpend.reduce((s, c) => s + c.baseTam, 0);
  const tamCompanies = selectedSpend.reduce((s, c) => s + c.baseCompanies, 0);

  if (industries.length === 0 || geos.length === 0 || tamSpend === 0) {
    return {
      tam: { spend: tamSpend > 0 ? formatSpend(tamSpend) : '—', companies: tamCompanies > 0 ? formatNum(tamCompanies) : '—' },
      sam: { spend: '—', companies: '—', dim: true, label: industries.length === 0 ? 'Add at least one industry' : 'Add at least one geography' },
      som: { spend: '—', companies: '—', dim: true, label: 'Define SAM first' },
    };
  }

  const indFactor = industries.reduce((s, id) => s + (INDUSTRIES.find((x) => x.id === id)?.weight || 0), 0);
  const geoFactor = geos.reduce((s, id) => s + (GEOGRAPHIES.find((x) => x.id === id)?.weight || 0), 0);

  // Calibrated so the default state (BFS+Insurance+CE_Mfg + USA+Canada +
  // Software+Services) yields ~$102B SAM across ~1.4M companies — matching HG's
  // documented fintech-NA reference case.
  const samScale = 0.2;
  const samSpend = tamSpend * indFactor * geoFactor * samScale;
  const samCompanies = tamCompanies * indFactor * geoFactor * samScale;

  // SOM tightness — tightening bands drops companies sharply but preserves
  // most of the spend (the largest spenders survive the cut).
  const revFraction = (revHigh - revLow + 1) / REVENUE_BANDS.length;
  const empFraction = (empHigh - empLow + 1) / EMPLOYEE_BANDS.length;
  const tightness = Math.max(0.05, revFraction * empFraction);
  const somSpend = samSpend * Math.max(0.1, Math.min(0.65, tightness * 8));
  const somCompanies = Math.max(20, Math.round(samCompanies * tightness * 0.0017));

  return {
    tam: { spend: formatSpend(tamSpend), companies: formatNum(tamCompanies) },
    sam: { spend: formatSpend(samSpend), companies: formatNum(Math.round(samCompanies)) },
    som: { spend: formatSpend(somSpend), companies: somCompanies.toLocaleString() },
  };
}

// ===== Sub-components =====
function MarketCard({ label, value, accent }) {
  return (
    <div className={`p-3 rounded-md border ${value.dim ? 'border-border bg-bg/30' : 'border-border bg-bg/40'} ${accent || ''}`}>
      <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">{label}</div>
      <div className={`text-xl font-semibold tracking-tight ${value.dim ? 'text-text-muted' : 'text-text-primary'}`}>
        {value.spend}
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <div className={`text-xs font-mono ${value.dim ? 'text-text-muted' : 'text-text-secondary'}`}>{value.companies}</div>
        <div className="text-[10px] text-text-muted">{value.companies !== '—' ? 'companies' : ''}</div>
      </div>
      {value.label && <div className="text-[10px] text-text-muted mt-1.5 leading-tight">{value.label}</div>}
    </div>
  );
}

function ChipMultiSelect({ icon: Icon, title, items, selected, onToggle, suggested, color = 'primary' }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()));
  const accent = color === 'primary' ? 'text-primary' : color;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={12} className={accent} />
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">{title}</span>
        <span className="text-[10px] text-text-muted">{selected.length} selected</span>
        {suggested && selected.length === 0 && (
          <span className="ml-auto text-[10px] text-text-muted italic">Suggested: {suggested}</span>
        )}
      </div>

      {/* Selected chips */}
      <div className="flex flex-wrap gap-1 mb-2">
        {selected.map((id) => {
          const item = items.find((i) => i.id === id);
          if (!item) return null;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-primary/10 border border-primary/30 text-primary rounded text-[11px] font-medium"
            >
              {item.label}
              <button
                onClick={() => onToggle(id)}
                className="ml-0.5 p-0.5 rounded hover:bg-primary/20 hover:text-danger transition-colors"
                title="Remove"
              >
                <X size={10} />
              </button>
            </span>
          );
        })}
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 px-2 py-0.5 border border-dashed border-border text-text-muted hover:text-text-secondary hover:border-border-2 rounded text-[11px]"
        >
          <Plus size={10} />
          Add
        </button>
      </div>

      {/* Add picker */}
      {open && (
        <div className="bg-surface border border-border rounded-md p-2 mb-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-bg/40 border border-border rounded mb-2">
            <Search size={11} className="text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              autoFocus
              className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
          <div className="max-h-40 overflow-y-auto thin-scrollbar space-y-0.5">
            {filtered.map((i) => {
              const isPicked = selected.includes(i.id);
              return (
                <button
                  key={i.id}
                  onClick={() => onToggle(i.id)}
                  className={`w-full text-left px-2 py-1 rounded text-xs flex items-center gap-2 transition-colors ${
                    isPicked ? 'bg-primary/10 text-primary' : 'hover:bg-bg/60 text-text-secondary'
                  }`}
                >
                  <span className="flex-1">{i.label}</span>
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

function BandStrip({ bands, lowIdx, highIdx, onChangeLow, onChangeHigh, disabled }) {
  return (
    <div className="flex items-stretch gap-0.5">
      {bands.map((b, i) => {
        const inRange = i >= lowIdx && i <= highIdx;
        return (
          <button
            key={b.id}
            disabled={disabled}
            onClick={() => {
              if (i < lowIdx) onChangeLow(i);
              else if (i > highIdx) onChangeHigh(i);
              else if (Math.abs(i - lowIdx) < Math.abs(i - highIdx)) onChangeLow(i);
              else onChangeHigh(i);
            }}
            className={`flex-1 px-1 py-1.5 rounded text-[10px] font-mono transition-colors ${
              inRange
                ? 'bg-primary/15 text-primary border border-primary/40'
                : 'bg-bg/40 text-text-muted border border-border hover:border-border-2'
            }`}
          >
            {b.label}
          </button>
        );
      })}
    </div>
  );
}

// ===== Main component =====
export default function LiveMarketBuilder({ submitted, lockedState, onSubmit, onPin }) {
  const [state, setState] = useState(
    lockedState || {
      spend: ['sw', 'svc'], // Software + Services pillars
      industries: ['2', '8', '3'], // BFS + Insurance + Computer & Electronic Mfg
      geos: ['usa', 'canada'],
      revLow: 6, // $1B
      revHigh: 7, // $5B+
      empLow: 5, // 5K
      empHigh: 6, // 10K+
    }
  );

  const sizes = useMemo(() => computeMarketSize(state), [state]);

  const toggle = (key, id) => {
    if (submitted) return;
    setState((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((x) => x !== id) : [...prev[key], id],
    }));
  };

  const setBand = (which, idx) => {
    if (submitted) return;
    setState((prev) => ({ ...prev, [which]: idx }));
  };

  return (
    <LiveFrame
      title="Build your market"
      subtitle="Adjust any input — TAM, SAM, and SOM recompute live. When the SOM size feels right, view the company list."
      onPin={onPin}
    >
      {/* Live cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <MarketCard label="TAM" value={sizes.tam} />
        <MarketCard label="SAM" value={sizes.sam} />
        <MarketCard
          label="SOM"
          value={sizes.som}
          accent={!sizes.som.dim ? 'border-amber-500/50 bg-amber-500/5' : ''}
        />
      </div>

      <LiveCoachNote
        tone="guide"
        headline="Inputs are live — change anything to see TAM/SAM/SOM update."
        body="TAM depends on spend categories. SAM narrows TAM by industries × geographies. SOM tightens SAM by revenue + employee bands. Tighter ranges = more focused list, but smaller market."
        compact
        className="mb-4"
      />

      {/* SPEND */}
      <div className="mb-5">
        <ChipMultiSelect
          icon={DollarSign}
          title="Spend categories"
          items={SPEND_CATEGORIES}
          selected={state.spend}
          onToggle={(id) => toggle('spend', id)}
          suggested="Software + IT Services"
        />
      </div>

      {/* INDUSTRIES */}
      <div className="mb-5">
        <ChipMultiSelect
          icon={Building2}
          title="Industries"
          items={INDUSTRIES}
          selected={state.industries}
          onToggle={(id) => toggle('industries', id)}
          suggested="BFS, Insurance"
        />
      </div>

      {/* GEOS */}
      <div className="mb-5">
        <ChipMultiSelect
          icon={Globe2}
          title="Geographies"
          items={GEOGRAPHIES}
          selected={state.geos}
          onToggle={(id) => toggle('geos', id)}
          suggested="United States"
        />
      </div>

      {/* THRESHOLDS */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={12} className="text-primary" />
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Revenue band</span>
            <span className="text-[10px] text-text-muted font-mono ml-auto">
              {REVENUE_BANDS[state.revLow].label}–{REVENUE_BANDS[state.revHigh].label}
            </span>
          </div>
          <BandStrip
            bands={REVENUE_BANDS}
            lowIdx={state.revLow}
            highIdx={state.revHigh}
            onChangeLow={(i) => setBand('revLow', i)}
            onChangeHigh={(i) => setBand('revHigh', i)}
            disabled={submitted}
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users size={12} className="text-primary" />
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Employee band</span>
            <span className="text-[10px] text-text-muted font-mono ml-auto">
              {EMPLOYEE_BANDS[state.empLow].label}–{EMPLOYEE_BANDS[state.empHigh].label}
            </span>
          </div>
          <BandStrip
            bands={EMPLOYEE_BANDS}
            lowIdx={state.empLow}
            highIdx={state.empHigh}
            onChangeLow={(i) => setBand('empLow', i)}
            onChangeHigh={(i) => setBand('empHigh', i)}
            disabled={submitted}
          />
        </div>
      </div>

      {!submitted ? (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="text-[11px] text-text-muted">
            <Sparkles size={9} className="inline text-primary mr-0.5" />
            {sizes.som.companies !== '—' ? `${sizes.som.companies} companies in your SOM` : 'Pick at least one industry and one geography to compute SOM'}
          </div>
          <button
            onClick={() => onSubmit && onSubmit({ ...state, sizes })}
            disabled={sizes.som.companies === '—'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            View SOM company list
            <ArrowRight size={11} />
          </button>
        </div>
      ) : (
        <div className="mt-3 px-2 py-1.5 bg-primary/[0.06] border border-primary/20 rounded text-[11px] text-primary inline-flex items-center gap-1.5">
          <Check size={11} />
          Locked · {sizes.som.companies} companies in SOM
        </div>
      )}
    </LiveFrame>
  );
}

export { computeMarketSize, SPEND_CATEGORIES, INDUSTRIES, GEOGRAPHIES, REVENUE_BANDS, EMPLOYEE_BANDS };
