// Scoring Models list view — admin's canonical view of all scoring models
// (live + draft) across all offerings. The relationship between models and
// offerings is fluid: a model can be attached to 0, 1, or many offerings.
// Default state: each offering has its own model (auto-built during
// onboarding); admin can clone, detach, rename, or build global models.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Gauge,
  Plus,
  CheckCircle2,
  AlertCircle,
  Package,
  Sparkles,
} from 'lucide-react';
import { SCORING_MODELS } from '../data/scoringModels.js';
import { listOfferings } from '../data/offerings.js';
import { getScoringModelStatus, subscribeConfig } from '../data/configStore.js';

function ModelCard({ model, offerings, onOpen }) {
  const status = getScoringModelStatus(model.id);
  const isLive = status.liveStatus === 'live';

  // A scoring model can attach to multiple offerings via offeringIds[].
  // Fall back to legacy offering_id (singular) for older models.
  const attachedOfferingIds = model.offeringIds && model.offeringIds.length > 0
    ? model.offeringIds
    : (model.offering_id ? [model.offering_id] : []);
  const attachedOfferings = attachedOfferingIds
    .map((id) => offerings.find((o) => o.id === id))
    .filter(Boolean);

  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full text-left bg-surface border border-border rounded-md p-4 hover:border-primary/30 hover:shadow-card transition-all group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Gauge size={16} className="text-emerald-700 dark:text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="text-sm font-semibold text-text-primary">{model.name}</h3>
            <span className="text-[10px] font-mono text-text-muted">v{model.version}</span>
            {isLive ? (
              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
                <CheckCircle2 size={9} /> Live
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
                <AlertCircle size={9} /> Draft
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary leading-snug mt-1 line-clamp-2">{model.description}</p>
        </div>
        <ArrowRight size={13} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {attachedOfferings.length === 0 ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-text-muted border border-border italic">
            Not attached to any offering (global model)
          </span>
        ) : (
          attachedOfferings.map((o) => (
            <span
              key={o.id}
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${o.bg || 'bg-primary/10'} ${o.textColor || 'text-primary'}`}
            >
              <Package size={9} className="inline -mt-0.5 mr-0.5" />
              {o.shortName || o.name}
            </span>
          ))
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div className="px-2 py-1 bg-bg/40 border border-border rounded">
          <div className="text-[9px] uppercase tracking-wider text-text-muted font-semibold">Composite</div>
          <div className="font-mono text-text-primary">
            F{model.composite_weights.fit}/N{model.composite_weights.need}/I{model.composite_weights.intent}
          </div>
        </div>
        <div className="px-2 py-1 bg-bg/40 border border-border rounded">
          <div className="text-[9px] uppercase tracking-wider text-text-muted font-semibold">Scored</div>
          <div className="font-mono text-text-primary">{model.accounts_scored?.toLocaleString() || '—'}</div>
        </div>
        <div className="px-2 py-1 bg-bg/40 border border-border rounded">
          <div className="text-[9px] uppercase tracking-wider text-text-muted font-semibold">Updated</div>
          <div className="font-mono text-text-primary">{model.last_evaluated || '—'}</div>
        </div>
      </div>
    </motion.button>
  );
}

export default function ScoringModelsListRoute() {
  const navigate = useNavigate();
  const [, setTick] = useState(0);

  useEffect(() => subscribeConfig(() => setTick((t) => t + 1)), []);

  const offerings = listOfferings();
  const models = SCORING_MODELS;

  const liveCount = models.filter((m) => getScoringModelStatus(m.id).liveStatus === 'live').length;
  const draftCount = models.length - liveCount;

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Admin Hub
      </button>

      <div className="mb-2 text-xs text-text-muted flex items-center gap-1.5">
        <Sparkles size={10} className="text-violet-500" />
        AI-prepared · Platform & Ops · Scoring Models
      </div>

      <div className="flex items-end justify-between mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Scoring Models</h1>
        <button
          onClick={() => alert('New model authoring opens in the next iteration — for now, models are auto-built per offering. Clone existing models from their detail view.')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
        >
          <Plus size={12} />
          New model
        </button>
      </div>

      <p className="text-sm text-text-secondary mb-6 max-w-3xl">
        Models score accounts on Fit / Need / Intent using the DC methodology. By default each offering has its own
        auto-built model — but the relationship is <strong>fluid</strong>: a model can apply to one offering, multiple
        offerings, or none (global model). Make models live to start scoring; revert to draft to pause.
      </p>

      <div className="flex items-center gap-3 mb-6 text-[11px]">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 size={10} /> {liveCount} live
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          <AlertCircle size={10} /> {draftCount} draft
        </span>
        <span className="text-text-muted">·</span>
        <span className="text-text-secondary">{offerings.length} offerings · {models.length} models</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {models.map((m) => (
          <ModelCard
            key={m.id}
            model={m}
            offerings={offerings}
            onOpen={() => {
              const off = m.offeringIds?.[0] || m.offering_id;
              if (off) navigate(`/admin/offerings/${off}/model`);
            }}
          />
        ))}
      </div>

      <div className="mt-8 text-[11px] text-text-muted leading-relaxed max-w-3xl border-t border-border pt-4">
        <span className="font-semibold text-text-secondary">Why fluid models matter:</span> An offering and a scoring
        model start aligned but can drift. You might want a "Strict Enterprise" variant for the same offering, or a
        single "ABM" model that scores accounts across all offerings uniformly. The model and the offering are
        independent objects — connect them as you need.
      </div>
    </div>
  );
}
