import {
  Database,
  Clock,
  Sigma,
  TrendingUp,
  Divide,
  GitCompare,
  Filter,
  CircleDot,
  BarChart3,
  Gauge,
  Plus,
} from 'lucide-react';
import { NODE_TYPES, SOURCE_FAMILIES } from '../../data/signals.js';
import { FAMILY_ACCENTS } from './SignalCanvas.jsx';

const NODE_ICONS = {
  Database, Clock, Sigma, TrendingUp, Divide, GitCompare, Filter, CircleDot, BarChart3, Gauge,
};

const SECTIONS = [
  {
    family: 'source',
    label: 'Sources',
    desc: 'Pull data from HG, your CRM, or event streams',
    types: ['source.hg', 'source.crm', 'source.event'],
  },
  {
    family: 'window',
    label: 'Time windows',
    desc: 'Bound upstream data to a time range',
    types: ['window.relative'],
  },
  {
    family: 'compute',
    label: 'Compute',
    desc: 'Math, aggregation, deltas, ratios',
    types: ['compute.aggregate', 'compute.delta', 'compute.ratio'],
  },
  {
    family: 'rule',
    label: 'Rules',
    desc: 'Comparisons and boolean logic',
    types: ['rule.compare', 'rule.logic'],
  },
  {
    family: 'threshold',
    label: 'Outputs (terminal)',
    desc: 'Cast to the signal output — exactly one required',
    types: ['threshold.boolean', 'threshold.tier', 'threshold.score'],
  },
];

function PaletteItem({ type, onAdd }) {
  const meta = NODE_TYPES[type];
  if (!meta) return null;
  const Icon = NODE_ICONS[meta.icon] || CircleDot;
  const accent = FAMILY_ACCENTS[meta.family];
  const sourceFam = meta.sourceFamily ? SOURCE_FAMILIES[meta.sourceFamily] : null;
  return (
    <button
      onClick={() => onAdd(type)}
      className="w-full flex items-start gap-2 px-2 py-1.5 rounded hover:bg-surface-2 transition-colors text-left group"
    >
      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 border ${accent.bg} ${accent.text} ${accent.border}`}>
        <Icon size={11} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-text-primary">{meta.label}</span>
          {sourceFam && (
            <span className={`text-[9px] uppercase tracking-wider font-bold px-1 rounded ${sourceFam.bg} ${sourceFam.color}`}>
              {sourceFam.label}
            </span>
          )}
        </div>
        <div className="text-[10px] text-text-muted truncate font-mono">
          {meta.examples?.slice(0, 2).join(' · ')}
        </div>
      </div>
      <Plus size={11} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
    </button>
  );
}

export default function NodePalette({ onAdd }) {
  return (
    <div className="border-t border-border">
      <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-text-muted font-semibold border-b border-border bg-bg/30">
        Node Palette
      </div>
      <div className="overflow-y-auto thin-scrollbar" style={{ maxHeight: 380 }}>
        {SECTIONS.map((section) => (
          <div key={section.family} className="py-2 border-b border-border/50 last:border-b-0">
            <div className="px-3 mb-1">
              <div className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">
                {section.label}
              </div>
              <div className="text-[9px] text-text-muted">{section.desc}</div>
            </div>
            <div className="px-1 space-y-0.5">
              {section.types.map((t) => (
                <PaletteItem key={t} type={t} onAdd={onAdd} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
