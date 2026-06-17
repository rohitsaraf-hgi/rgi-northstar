import { useState } from 'react';
import { Upload, FileSpreadsheet, Check, Sparkles, ArrowRight, X } from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import LiveCoachNote from './LiveCoachNote.jsx';

// Inline form turn — drop a CSV (or pick a sample). Shows derived-fields preview
// the moment a file is "selected", so the user sees what the AI will extract
// before they commit.
const SAMPLE_FILES = [
  {
    id: 'fintech-na',
    name: 'fintech-customers-na.csv',
    rows: 50,
    matched: 47,
    derived: {
      industries: ['Banking & Financial Services', 'Insurance', 'Computer & Electronic Mfg'],
      geographies: ['United States of America', 'Canada'],
      revenue: { p50: '$1.2B', p25: '$380M', p75: '$3.4B' },
      employees: { p50: '12K', p25: '3.4K', p75: '38K' },
    },
  },
];

function DerivedFieldRow({ label, children }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 items-start text-[11px] py-1">
      <div className="text-text-muted uppercase tracking-wider font-semibold text-[10px] pt-0.5">
        {label}
      </div>
      <div className="text-text-secondary">{children}</div>
    </div>
  );
}

function DerivedPreview({ derived }) {
  return (
    <div className="bg-bg/40 border border-border rounded p-2 space-y-1">
      <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1 flex items-center gap-1">
        <Sparkles size={9} className="text-primary" />
        Derived from your customers
      </div>
      <DerivedFieldRow label="Industries">
        <div className="flex flex-wrap gap-1">
          {derived.industries.map((i) => (
            <span key={i} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-medium">
              {i}
            </span>
          ))}
        </div>
      </DerivedFieldRow>
      <DerivedFieldRow label="Geo">
        <div className="flex flex-wrap gap-1">
          {derived.geographies.map((g) => (
            <span key={g} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-medium">
              {g}
            </span>
          ))}
        </div>
      </DerivedFieldRow>
      <DerivedFieldRow label="Revenue">
        <span className="font-mono text-text-primary">{derived.revenue.p50}</span>
        <span className="text-text-muted ml-1">median · {derived.revenue.p25}–{derived.revenue.p75} IQR</span>
      </DerivedFieldRow>
      <DerivedFieldRow label="Employees">
        <span className="font-mono text-text-primary">{derived.employees.p50}</span>
        <span className="text-text-muted ml-1">median · {derived.employees.p25}–{derived.employees.p75} IQR</span>
      </DerivedFieldRow>
    </div>
  );
}

export default function LiveCSVDropzone({ submitted, onSubmit, onPin, defaultSampleId = 'fintech-na' }) {
  const [picked, setPicked] = useState(defaultSampleId);
  const [dragOver, setDragOver] = useState(false);
  const sample = SAMPLE_FILES.find((s) => s.id === picked) || SAMPLE_FILES[0];

  return (
    <LiveFrame
      title="Drop your customer list"
      subtitle="CSV with company names + URLs. I'll match against my company graph and pull firmographics. This same file will be reused for whitespace classification later — no need to upload twice."
      onPin={onPin}
    >
      <LiveCoachNote
        tone="guide"
        headline="Match rate ≥85% means your CSV columns are clean."
        body="Required: company name. Recommended: URL, country, DUNS, CRM ID. The more identity columns you provide, the higher the match rate — and the more confident I can be about derived ICP fields."
        more={[
          "If match rate falls below 70%, I'll flag the unmatched rows so you can fix them — usually missing URLs or non-standard country codes.",
          "Sub-$5M companies have weaker firmographic coverage in my graph. If your customers cluster there, expect lower match rates and consider supplementing with DUNS.",
        ]}
        compact
        className="mb-3"
      />
      {/* Dropzone (visual only — picker selects a fixture) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        className={`border-2 border-dashed rounded-md px-4 py-6 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border bg-bg/40'
        }`}
      >
        <Upload size={20} className="mx-auto text-text-muted mb-2" />
        <div className="text-xs text-text-secondary">
          Drop a CSV, or use the sample below
        </div>
        <div className="text-[10px] text-text-muted mt-1">
          Required: company name. Recommended: URL, country, DUNS, CRM ID
        </div>
      </div>

      {/* Sample picker (the demo "uploads" this) */}
      <div className="mt-3 bg-surface border border-border rounded-md overflow-hidden">
        <div className="px-3 py-2 flex items-center gap-2 border-b border-border bg-bg/40">
          <FileSpreadsheet size={12} className="text-success" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-text-primary truncate">{sample.name}</div>
            <div className="text-[10px] text-text-muted">
              {sample.rows} rows · {sample.matched} matched ({Math.round((sample.matched / sample.rows) * 100)}%)
            </div>
          </div>
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-success/15 text-success rounded font-bold">
            Sample
          </span>
        </div>
        <div className="p-3">
          <DerivedPreview derived={sample.derived} />
        </div>
      </div>

      {!submitted && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] text-text-muted">
            Drop a real CSV anytime — for the demo we'll use the sample
          </span>
          <button
            onClick={() => onSubmit && onSubmit({ filename: sample.name, derived: sample.derived, matched: sample.matched })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors font-medium"
          >
            Use this list
            <ArrowRight size={11} />
          </button>
        </div>
      )}
      {submitted && (
        <div className="mt-3 px-2 py-1.5 bg-primary/[0.06] border border-primary/20 rounded text-[11px] text-primary inline-flex items-center gap-1.5">
          <Check size={11} />
          List loaded · {sample.matched} of {sample.rows} matched
        </div>
      )}
    </LiveFrame>
  );
}
