import { useEffect, useMemo, useState } from 'react';
import { getScoringModelStatus, setScoringModelLive, setScoringModelDraft, subscribeConfig } from '../data/configStore.js';
import { markTaskComplete } from '../data/onboardingCoach.js';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Gauge,
  Package,
  CheckCircle2,
  ChevronRight,
  Wand2,
  Info,
  Layers,
  Target,
  TrendingUp,
  XCircle,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { getOffering } from '../data/offerings.js';
import {
  getModelForOffering,
  PILLARS,
  SCORING_TIERS,
  pillarMaxPoints,
  scoreAccountThroughModel,
} from '../data/scoringModels.js';
import { SAMPLE_ACCOUNTS } from '../data/signalEval.js';
import { getFitFor } from '../data/accountOfferingFit.js';
import { useToast } from '../context/ToastContext.jsx';

// ----- Left pane: Pillar tree -----

// Live/draft status chip. Reads from configStore so changes propagate to
// every place the chip is rendered (workbook header, offering detail, etc.).
function LiveStatusChip({ modelId }) {
  const status = useLiveStatus(modelId);
  if (status.liveStatus === 'live') {
    return (
      <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
        <CheckCircle2 size={9} /> Live
      </span>
    );
  }
  return (
    <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
      <AlertCircle size={9} /> Draft
    </span>
  );
}

// Promote draft → live, or revert live → draft. Going live also marks the
// coach's "confirm_scoring_models" task complete.
function GoLiveButton({ modelId, onLive }) {
  const status = useLiveStatus(modelId);
  if (status.liveStatus === 'live') {
    return (
      <button
        onClick={() => setScoringModelDraft(modelId)}
        className="px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary text-xs rounded-md transition-colors inline-flex items-center gap-1.5"
        title="Revert to draft (model stops scoring new accounts)"
      >
        Revert to draft
      </button>
    );
  }
  return (
    <button
      onClick={() => {
        setScoringModelLive(modelId);
        markTaskComplete('confirm_scoring_models');
        if (onLive) onLive();
      }}
      className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-md hover:bg-emerald-500 transition-colors inline-flex items-center gap-1.5 font-semibold"
    >
      <CheckCircle2 size={11} /> Go live
    </button>
  );
}

function PillarSection({ pillar, dims, selectedDimId, onSelect, weight }) {
  const meta = PILLARS[pillar];
  const total = dims.reduce((s, d) => s + d.cap, 0);
  return (
    <div className="mb-4">
      <div className={`flex items-center gap-2 px-2 py-1.5 rounded ${meta.bg} mb-1`}>
        <span className={`text-[10px] uppercase tracking-wider font-bold ${meta.color}`}>{meta.label}</span>
        <span className={`text-[10px] font-mono ${meta.color}`}>{weight}%</span>
        <span className="ml-auto text-[10px] font-mono text-text-muted">
          {dims.length} dim · {total} pts
        </span>
      </div>
      <div className="space-y-0.5">
        {dims.map((d) => {
          const active = selectedDimId === d.id;
          return (
            <button
              key={d.id}
              onClick={() => onSelect({ pillar, dimId: d.id })}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                active ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              }`}
            >
              <span className="flex-1 text-[11px] font-medium truncate">{d.name}</span>
              {d.autoBuilt && (
                <Wand2 size={9} className="text-emerald-700 dark:text-emerald-300" title="Auto-built from offering config" />
              )}
              <span className={`text-[10px] font-mono ${active ? 'text-primary' : 'text-text-muted'}`}>
                {d.cap}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PillarTreePane({ model, selected, onSelect, onSelectDisqualifiers }) {
  return (
    <div className="h-full bg-bg/40 border-r border-border flex flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Layers size={12} className="text-emerald-700 dark:text-emerald-300" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
          Pillars
        </span>
      </div>
      <div className="flex-1 overflow-y-auto thin-scrollbar p-3">
        <PillarSection
          pillar="fit"
          dims={model.fit.dimensions}
          selectedDimId={selected?.pillar === 'fit' ? selected.dimId : null}
          onSelect={onSelect}
          weight={model.composite_weights.fit}
        />
        <button
          onClick={onSelectDisqualifiers}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-[11px] transition-colors mb-4 ${
            selected?.pillar === 'disqualifiers'
              ? 'bg-primary/10 text-primary'
              : 'text-text-muted hover:bg-surface-2 hover:text-text-secondary'
          }`}
        >
          <XCircle size={11} />
          <span className="flex-1 italic">Fit disqualifiers</span>
          <span className="text-[10px] font-mono">{model.fit.disqualifiers?.length || 0}</span>
        </button>

        <PillarSection
          pillar="need"
          dims={model.need.dimensions}
          selectedDimId={selected?.pillar === 'need' ? selected.dimId : null}
          onSelect={onSelect}
          weight={model.composite_weights.need}
        />
        <PillarSection
          pillar="intent"
          dims={model.intent.dimensions}
          selectedDimId={selected?.pillar === 'intent' ? selected.dimId : null}
          onSelect={onSelect}
          weight={model.composite_weights.intent}
        />
      </div>
    </div>
  );
}

// ----- Center pane: Dimension editor -----

function DimensionInputRow({ input }) {
  const fromOffering = input.source === 'offering';
  return (
    <div className={`px-2.5 py-1.5 rounded border flex items-start gap-2 ${
      fromOffering ? 'bg-violet-500/5 border-violet-500/20' : 'bg-bg/40 border-border'
    }`}>
      <div className="flex-shrink-0 mt-0.5">
        {fromOffering ? (
          <Wand2 size={10} className="text-violet-700 dark:text-violet-300" title="Auto-derived from offering config" />
        ) : (
          <Info size={10} className="text-text-muted" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">{input.label}</span>
          {input.points && (
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">{input.points}</span>
          )}
        </div>
        <div className="text-[11px] text-text-primary font-mono leading-snug">{input.value}</div>
      </div>
    </div>
  );
}

function DimensionEditor({ pillar, dim, offering }) {
  const meta = PILLARS[pillar];
  return (
    <div className="p-5 overflow-y-auto thin-scrollbar h-full">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-9 h-9 rounded-md ${meta.bg} flex items-center justify-center flex-shrink-0`}>
          <Target size={16} className={meta.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">{dim.name}</h2>
            <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>
              {meta.label}
            </span>
            <span className="text-[11px] font-mono text-text-muted">cap {dim.cap} pts</span>
            {dim.autoBuilt && (
              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300 inline-flex items-center gap-1">
                <Wand2 size={9} /> Auto-built
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{dim.rule}</p>
          {dim.autoBuiltFrom && (
            <div className="text-[10px] text-text-muted mt-1 font-mono">Derived from: {dim.autoBuiltFrom}</div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
          Inputs · {dim.inputs?.length || 0}
        </div>
        <div className="space-y-1.5">
          {dim.inputs?.map((input, i) => (
            <DimensionInputRow key={i} input={input} />
          ))}
        </div>
      </div>

      <div className="mt-6 px-3 py-2.5 rounded-md bg-bg/40 border border-dashed border-border">
        <div className="flex items-start gap-1.5">
          <Info size={11} className="text-text-muted flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-text-secondary leading-snug">
            <span className="font-semibold text-text-primary">DC methodology:</span> dimensions like this one
            are evaluated server-side against ClickHouse warehouse data (
            <code className="font-mono text-text-primary">install_global</code>,{' '}
            <code className="font-mono text-text-primary">intent_global</code>,{' '}
            <code className="font-mono text-text-primary">company_locations</code>). Sub-group caps prevent
            any single category from dominating the pillar.
          </div>
        </div>
      </div>
    </div>
  );
}

function DisqualifiersEditor({ model }) {
  return (
    <div className="p-5 overflow-y-auto thin-scrollbar h-full">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-md bg-rose-500/10 flex items-center justify-center flex-shrink-0">
          <XCircle size={16} className="text-rose-700 dark:text-rose-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-text-primary">Fit Disqualifiers</h2>
          <p className="text-xs text-text-secondary leading-relaxed mt-1">
            Hard filters applied before scoring. Companies matching any rule are excluded from the scored
            book entirely. <code className="font-mono">whenNull: "skip"</code> means missing data does not
            disqualify.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {model.fit.disqualifiers?.map((d, i) => (
          <div key={i} className="px-2.5 py-2 rounded border border-rose-500/20 bg-rose-500/5 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded bg-rose-500/10">
              Exclude if
            </span>
            <span className="text-xs font-mono text-text-primary flex-1">{d.rule}</span>
            <span className="text-[10px] text-text-muted font-mono">whenNull: {d.whenNull}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----- Right pane: Test rail -----

function TestRail({ model, offering, refreshTick, onRefresh }) {
  const sampleEntries = SAMPLE_ACCOUNTS.slice(0, 4).map((acct) => {
    const fit = getFitFor(acct.id, offering.id);
    const breakdown = scoreAccountThroughModel(model, fit.score);
    return { account: acct, breakdown };
  });
  // eslint-disable-next-line no-unused-vars
  const _depKey = refreshTick;
  const aCount = sampleEntries.filter((e) => e.breakdown?.tier === 'A').length;
  const bCount = sampleEntries.filter((e) => e.breakdown?.tier === 'B').length;

  return (
    <div className="h-full bg-bg/40 border-l border-border flex flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Sparkles size={12} className="text-emerald-700 dark:text-emerald-300" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Test rail</span>
        <button
          onClick={onRefresh}
          className="ml-auto p-1 text-text-muted hover:text-text-secondary transition-colors"
          title="Re-evaluate sample"
        >
          <RefreshCw size={10} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-3">
        <div className="text-[11px] text-text-secondary leading-relaxed">
          Sample of 4 accounts scored through this model. Each card shows the composite, the tier, and
          per-pillar contributions.
        </div>

        <div className="space-y-2">
          {sampleEntries.map(({ account, breakdown }) => {
            if (!breakdown) return null;
            const tier = SCORING_TIERS.find((t) => t.id === breakdown.tier);
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface border border-border rounded-md p-2.5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: account.logoColor }}
                  >
                    {account.name.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-text-primary truncate flex-1">{account.name}</span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${tier.bg} ${tier.color} ${tier.border} border`}>
                    {tier.label} · {breakdown.composite}
                  </span>
                </div>

                <div className="space-y-1">
                  {['fit', 'need', 'intent'].map((p) => {
                    const pillar = PILLARS[p];
                    const max = (model[p]?.dimensions || []).reduce((s, d) => s + d.cap, 0) || 100;
                    const pillarPct = breakdown[p].raw;
                    const contributionPct = (breakdown[p].weighted / breakdown.composite) * 100;
                    return (
                      <div key={p} className="flex items-center gap-1.5">
                        <span className={`text-[10px] uppercase tracking-wider font-bold w-12 ${pillar.color}`}>
                          {pillar.label.slice(0, 3)}
                        </span>
                        <div className="flex-1 h-1.5 bg-bg/60 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pillarPct}%`, background: pillar.accent }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-text-muted w-20 text-right">
                          {breakdown[p].raw}/100 · +{breakdown[p].weighted}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Distribution preview */}
        <div className="bg-surface border border-border rounded-md p-3">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
            Sample tier mix
          </div>
          <div className="text-[11px] text-text-secondary">
            {aCount} A · {bCount} B · {sampleEntries.length - aCount - bCount} lower in 4-account sample
          </div>
          <div className="text-[10px] text-text-muted mt-2 italic">
            Real model evaluates all {model.accounts_scored.toLocaleString()} accounts nightly via
            ClickHouse pipeline.
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- Auto-build CTA modal -----

function AutoBuildModal({ offering, model, onClose, onApply }) {
  // Show the mapping from offering config → model dimensions
  const mappings = [
    {
      from: 'offering.targetICP.employees',
      to: 'Fit · Company Size · sweet spot',
      preview: offering.targetICP.employees,
    },
    {
      from: 'offering.targetICP.industries',
      to: 'Fit · Industry Fit · NAICS tiers',
      preview: offering.targetICP.industries.join(', '),
    },
    {
      from: 'offering.competitors',
      to: 'Need · Displacement Targets · grouped',
      preview: offering.competitors.slice(0, 3).join(', ') + (offering.competitors.length > 3 ? '…' : ''),
    },
    {
      from: 'offering.complementaryTech',
      to: 'Need · Tech Demand Signals',
      preview: offering.complementaryTech.slice(0, 4).join(', '),
    },
    {
      from: 'offering.complementaryTech',
      to: 'Need · Stack Momentum · relevantTech',
      preview: offering.complementaryTech.slice(0, 4).join(', '),
    },
    {
      from: 'offering.intentTopics',
      to: 'Intent · Direct Product Intent',
      preview: offering.intentTopics.slice(0, 4).join(', '),
    },
    {
      from: 'offering.intentTopics',
      to: 'Intent · Category Intent · core/adjacent/broad tiers',
      preview: offering.intentTopics.slice(0, 4).join(', '),
    },
    {
      from: 'offering.competitors',
      to: 'Intent · Competitor Intent',
      preview: offering.competitors.slice(0, 4).join(', '),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg border border-border rounded-lg shadow-elev max-w-2xl w-full max-h-[80vh] flex flex-col"
      >
        <div className="px-5 py-4 border-b border-border flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-violet-500/10 flex items-center justify-center flex-shrink-0">
            <Wand2 size={16} className="text-violet-700 dark:text-violet-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold tracking-tight">Auto-build from offering</h2>
            <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
              Map this offering&rsquo;s config to scoring-model dimensions. You can edit any dimension after
              applying.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-secondary"
            title="Close"
          >
            <XCircle size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar p-5">
          <div className="space-y-1.5">
            {mappings.map((m, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 bg-surface border border-border rounded">
                <CheckCircle2 size={11} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    <code className="font-mono text-violet-700 dark:text-violet-300">{m.from}</code>
                    <ChevronRight size={9} className="text-text-muted" />
                    <span className="text-text-primary font-semibold">{m.to}</span>
                  </div>
                  <div className="text-[10px] text-text-secondary mt-0.5 font-mono truncate">{m.preview}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
            <AlertCircle size={11} className="inline -mt-0.5 mr-1" />
            Dimensions like <span className="font-mono">Complexity Signals</span>,{' '}
            <span className="font-mono">Tech Sophistication</span>, <span className="font-mono">Fragmentation</span>,
            and <span className="font-mono">Buyer Activity</span> use methodology defaults and cannot be auto-derived
            from offering config alone. You can tune these manually after applying.
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
          >
            <Wand2 size={11} />
            Apply auto-build
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ----- Composite weights + tier thresholds bar -----

function CompositeBar({ model, onWeightChange, onThresholdChange }) {
  return (
    <div className="bg-surface border border-border rounded-md p-3 mb-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Composite weights */}
        <div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
            Composite weights · must sum to 100%
          </div>
          <div className="space-y-1.5">
            {['fit', 'need', 'intent'].map((p) => {
              const meta = PILLARS[p];
              return (
                <div key={p} className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold w-12 ${meta.color}`}>{meta.label}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={model.composite_weights[p]}
                    onChange={(e) => onWeightChange(p, parseInt(e.target.value, 10))}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-[11px] font-mono text-text-primary w-10 text-right">
                    {model.composite_weights[p]}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tier thresholds */}
        <div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
            Tier thresholds · composite score cutoffs
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {SCORING_TIERS.map((t) => (
              <div key={t.id} className={`px-2 py-1.5 rounded border ${t.bg} ${t.border} flex flex-col`}>
                <div className={`text-[10px] uppercase tracking-wider font-bold ${t.color}`}>Tier {t.label}</div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={model.tier_thresholds[t.id] || 0}
                  onChange={(e) => onThresholdChange(t.id, parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-transparent text-[12px] font-mono font-semibold text-text-primary focus:outline-none"
                />
                <div className="text-[9px] text-text-muted">≥ score</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- Main route -----

function useLiveStatus(modelId) {
  const [status, setStatus] = useState(() => getScoringModelStatus(modelId));
  useEffect(() => {
    const unsub = subscribeConfig(() => setStatus(getScoringModelStatus(modelId)));
    return unsub;
  }, [modelId]);
  return status;
}

export default function ScoringModelBuilderRoute() {
  const navigate = useNavigate();
  const { id: offeringId } = useParams();
  const { showToast } = useToast();

  const offering = getOffering(offeringId);
  const baseModel = getModelForOffering(offeringId);

  // Local mutable copy so weight/threshold edits don't mutate the source.
  const [model, setModel] = useState(baseModel);
  const [selected, setSelected] = useState(
    baseModel ? { pillar: 'fit', dimId: baseModel.fit.dimensions[0]?.id } : null,
  );
  const [autoBuildOpen, setAutoBuildOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  if (!offering || !model) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-8">
        <button
          onClick={() => navigate('/admin/offerings')}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
        >
          <ArrowLeft size={11} />
          Offerings
        </button>
        <div className="bg-surface border border-dashed border-border rounded-md p-10 text-center">
          <Gauge size={20} className="mx-auto mb-2 text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">No model for this offering</h3>
        </div>
      </div>
    );
  }

  const handleSelect = (sel) => setSelected(sel);
  const handleSelectDisqualifiers = () => setSelected({ pillar: 'disqualifiers' });

  const handleWeightChange = (pillar, value) => {
    setModel((m) => ({ ...m, composite_weights: { ...m.composite_weights, [pillar]: value } }));
  };
  const handleThresholdChange = (tier, value) => {
    setModel((m) => ({ ...m, tier_thresholds: { ...m.tier_thresholds, [tier]: value } }));
  };

  const weightSum =
    model.composite_weights.fit + model.composite_weights.need + model.composite_weights.intent;

  const handleApplyAutoBuild = () => {
    setAutoBuildOpen(false);
    setRefreshTick((t) => t + 1);
    showToast(`Re-auto-built ${model.name} from offering config`, 'success');
  };

  // Selected pane content
  let centerContent;
  if (selected?.pillar === 'disqualifiers') {
    centerContent = <DisqualifiersEditor model={model} />;
  } else if (selected) {
    const pillar = model[selected.pillar];
    const dim = pillar?.dimensions?.find((d) => d.id === selected.dimId);
    if (dim) {
      centerContent = <DimensionEditor pillar={selected.pillar} dim={dim} offering={offering} />;
    }
  }

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-border bg-bg/95 backdrop-blur-sm px-6 py-3">
        <button
          onClick={() => navigate(`/admin/offerings/${offering.id}`)}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-2 transition-colors"
        >
          <ArrowLeft size={11} />
          {offering.name}
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Gauge size={16} className="text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-text-primary">{model.name}</h1>
              <span className="text-[10px] font-mono text-text-muted">v{model.version}</span>
              <LiveStatusChip modelId={model.id} />
              <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${offering.bg} ${offering.textColor} flex items-center gap-1`}>
                <Package size={9} /> {offering.name}
              </span>
            </div>
            <div className="text-xs text-text-secondary mt-0.5">
              DC methodology · Fit shared across Wiz offerings · Need & Intent specific to {offering.name}
            </div>
          </div>

          <button
            onClick={() => setAutoBuildOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-violet-500/30 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10 text-xs rounded-md transition-colors"
          >
            <Wand2 size={11} />
            Auto-build from offering
          </button>
          <GoLiveButton modelId={model.id} onLive={() => showToast(`${model.name} is now live — scoring all accounts`, 'success')} />
          <button
            onClick={() => showToast('Save flow lands in next phase — config persists in memory for now', 'info')}
            className="px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary text-xs rounded-md transition-colors"
          >
            Save changes
          </button>
        </div>

        {weightSum !== 100 && (
          <div className="mt-2 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-700 dark:text-amber-300 inline-flex items-center gap-1.5">
            <AlertCircle size={10} />
            Composite weights sum to {weightSum}% — should be 100%.
          </div>
        )}
      </div>

      {/* 3-pane workspace */}
      <div className="flex-1 flex min-h-0">
        <div className="w-72 flex-shrink-0">
          <PillarTreePane
            model={model}
            selected={selected}
            onSelect={handleSelect}
            onSelectDisqualifiers={handleSelectDisqualifiers}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="px-5 pt-4 flex-shrink-0">
            <CompositeBar
              model={model}
              onWeightChange={handleWeightChange}
              onThresholdChange={handleThresholdChange}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">{centerContent}</div>
        </div>

        <div className="w-80 flex-shrink-0">
          <TestRail
            model={model}
            offering={offering}
            refreshTick={refreshTick}
            onRefresh={() => setRefreshTick((t) => t + 1)}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-border bg-bg/95 px-6 py-1.5 flex items-center gap-3 text-[10px] text-text-muted">
        <span>
          {model.fit.dimensions.length + model.need.dimensions.length + model.intent.dimensions.length} dimensions
        </span>
        <span>·</span>
        <span>
          {pillarMaxPoints(model.fit) + pillarMaxPoints(model.need) + pillarMaxPoints(model.intent)} raw pts
        </span>
        <span>·</span>
        <span>Auto-built {model.auto_built_from_offering_at}</span>
        <span className="ml-auto">DC methodology · Fit shared · Need + Intent per offering</span>
      </div>

      {autoBuildOpen && (
        <AutoBuildModal
          offering={offering}
          model={model}
          onClose={() => setAutoBuildOpen(false)}
          onApply={handleApplyAutoBuild}
        />
      )}
    </div>
  );
}
