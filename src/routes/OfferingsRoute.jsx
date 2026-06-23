import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  ArrowLeft,
  Target,
  AlertTriangle,
  Sparkles,
  Layers,
  TrendingUp,
  Users,
  Shield,
  Plus,
  Gauge,
  ArrowRight,
  CheckCircle2,
  Wand2,
  Edit2,
  Trash2,
  X,
  Lock,
} from 'lucide-react';
import { listOfferings, getOffering, upsertOffering, deleteOffering, subscribeOfferings } from '../data/offerings.js';
import { workflowsForOffering } from '../data/workflows.js';
import { listSignals } from '../data/signals.js';
import {
  listSystemDefaultProfiles,
  listCustomProfiles,
  getProfileForOffering,
} from '../data/marketAnalyzer.js';
import { ManageOfferingDrawer } from '../components/onboarding/StepOfferings.jsx';
import { useDemo } from '../context/DemoContext.jsx';

function OfferingCard({ offering, onOpen, onEdit, onDelete }) {
  const signals = listSignals().filter(
    (s) => Array.isArray(s.relevant_offerings) && (s.relevant_offerings.includes(offering.id) || s.relevant_offerings.includes('all')),
  );
  const workflows = workflowsForOffering(offering.id).filter((w) => w.offering_id === offering.id);
  return (
    <motion.button
      onClick={() => onOpen(offering.id)}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full text-left bg-surface border ${offering.borderColor} rounded-md p-4 hover:shadow-card transition-all group`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-md ${offering.bg} flex items-center justify-center flex-shrink-0`}
        >
          <Package size={16} className={offering.textColor} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold text-text-primary leading-tight group-hover:${offering.textColor.replace('text-', 'text-')} transition-colors`}>
            {offering.name}
          </h3>
          <div className="text-[10px] text-text-muted mt-0.5">{offering.fullName}</div>
        </div>
      </div>

      <p className="text-xs text-text-secondary leading-relaxed mb-3">{offering.description}</p>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="px-2 py-1.5 bg-bg/40 border border-border rounded">
          <div className="text-[9px] uppercase tracking-wider text-text-muted font-semibold">Active</div>
          <div className="text-sm font-semibold text-text-primary">{offering.activeAccounts}</div>
        </div>
        <div className="px-2 py-1.5 bg-bg/40 border border-border rounded">
          <div className="text-[9px] uppercase tracking-wider text-text-muted font-semibold">Avg deal</div>
          <div className="text-sm font-semibold text-text-primary">{offering.avgDealSize}</div>
        </div>
        <div className="px-2 py-1.5 bg-bg/40 border border-border rounded">
          <div className="text-[9px] uppercase tracking-wider text-text-muted font-semibold">Workflows</div>
          <div className="text-sm font-semibold text-text-primary">{workflows.length}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {offering.competitors.slice(0, 3).map((c) => {
          const label = typeof c === 'string' ? c : c.name;
          return (
            <span key={label} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              vs. {label}
            </span>
          );
        })}
        {offering.competitors.length > 3 && (
          <span className="text-[10px] text-text-muted">+{offering.competitors.length - 3} more</span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
        <div className="text-[10px] text-text-muted">
          {signals.length} relevant signals · {offering.complementaryTech.length} complementary tech
        </div>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onEdit();
                  }
                }}
                className="text-[11px] text-text-secondary hover:text-primary inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-bg/40 cursor-pointer"
                title="Edit offering"
              >
                <Edit2 size={11} /> Edit
              </span>
            )}
            {onDelete && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDelete();
                  }
                }}
                className="text-[11px] text-text-muted hover:text-rose-600 inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-rose-500/10 cursor-pointer"
                title="Delete offering"
              >
                <Trash2 size={11} /> Delete
              </span>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}

// Scoring profile section — branches by MA entitlement.
//
// With MA: full picker (system defaults + custom profiles), "Manage profiles"
// button, dimensions chip row.
//
// Without MA: collapsed to a read-only default profile card. The only knob
// admins have is editing offering attributes — so we surface the mapping
// (which attribute feeds which dimension), call out locked capabilities,
// and reposition the upsell card as a tier-upgrade pitch.

const ATTRIBUTE_TO_DIMENSION = [
  {
    attribute: 'Target ICP — industries',
    dimension: 'Industry Fit',
    scrollTo: 'target-icp',
  },
  {
    attribute: 'Target ICP — company size + revenue',
    dimension: 'Company Size',
    scrollTo: 'target-icp',
  },
  {
    attribute: 'Competitors / displacement targets',
    dimension: 'Displacement Targets · Competitor Intent',
    scrollTo: 'competitors',
  },
  {
    attribute: 'Complementary tech stack',
    dimension: 'Tech Demand',
    scrollTo: 'complementary-tech',
  },
  {
    attribute: 'Intent topics',
    dimension: 'Direct Product Intent · Category Intent',
    scrollTo: 'intent-topics',
  },
];

const LOCKED_CAPABILITIES = [
  {
    label: 'Custom dimensions',
    description: 'Add or remove scoring dimensions per GTM motion.',
  },
  {
    label: 'Weight tuning',
    description: 'Re-balance Fit / Need / Intent contributions.',
  },
  {
    label: 'Threshold customization',
    description: 'Move A / B / C / D cutoffs to match your funnel.',
  },
];

function MaUpsellCard({ navigate, variant = 'card' }) {
  if (variant === 'inline') {
    return (
      <div className="mt-3 px-3 py-2.5 rounded bg-gradient-to-r from-violet-500/5 to-primary/5 border border-violet-500/20 text-[11px] text-text-secondary flex items-center gap-2">
        <Sparkles size={11} className="text-violet-700 dark:text-violet-300 flex-shrink-0" />
        <span className="flex-1">
          Want full control? <strong className="text-text-primary">Market Analyzer</strong> unlocks
          custom dimensions, weights, and thresholds.{' '}
          <button
            onClick={() => navigate('/platform')}
            className="text-violet-700 dark:text-violet-300 font-semibold hover:underline"
          >
            See Market Analyzer →
          </button>
        </span>
      </div>
    );
  }
  return (
    <div className="mt-4 p-4 rounded-md bg-gradient-to-br from-violet-500/5 via-primary/5 to-emerald-500/5 border border-violet-500/30">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-violet-500/15 flex items-center justify-center flex-shrink-0">
          <Sparkles size={16} className="text-violet-700 dark:text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-sm font-semibold text-text-primary">
              You're using the default scoring tier
            </h3>
            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-text-muted/15 text-text-secondary border border-border">
              Basic
            </span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
            Default profiles give you directional fit scores derived from each offering's
            configuration. To tighten scoring per GTM motion or business rules, upgrade to{' '}
            <strong className="text-text-primary">Market Analyzer</strong> — author custom profiles,
            tune dimensions and weights, and apply scoring across both your book and the broader
            HG universe.
          </p>
          <button
            onClick={() => navigate('/platform')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 text-white rounded-md hover:bg-violet-500 transition-colors"
          >
            See Market Analyzer <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

function LockedCapabilityTile({ label, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left px-3 py-2.5 rounded border border-dashed border-border bg-bg/30 hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors group"
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <Lock size={10} className="text-text-muted group-hover:text-violet-700 dark:group-hover:text-violet-300 flex-shrink-0" />
        <span className="text-[11px] font-semibold text-text-secondary group-hover:text-text-primary">
          {label}
        </span>
      </div>
      <div className="text-[10px] text-text-muted leading-snug">{description}</div>
      <div className="text-[9px] uppercase tracking-wider font-bold text-violet-700 dark:text-violet-300 mt-1">
        Market Analyzer
      </div>
    </button>
  );
}

function WhatDrivesScoreGrid({ rows, onJump }) {
  return (
    <div className="mt-4 rounded-md border border-border bg-bg/30 overflow-hidden">
      <div className="px-3 py-2 border-b border-border/60 flex items-center gap-1.5">
        <Wand2 size={11} className="text-text-muted" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
          What drives this score?
        </span>
        <span className="text-[10px] text-text-muted ml-auto italic">
          Edit any attribute below — we'll prompt to recalculate
        </span>
      </div>
      <div className="divide-y divide-border/40">
        {rows.map((row) => (
          <button
            key={row.attribute}
            onClick={() => onJump?.(row.scrollTo)}
            className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-surface-2 transition-colors group"
          >
            <div className="text-[11px] text-text-secondary flex-1 truncate">{row.attribute}</div>
            <ArrowRight size={10} className="text-text-muted group-hover:text-primary flex-shrink-0" />
            <div className="text-[11px] font-semibold text-text-primary truncate max-w-[260px]">
              {row.dimension}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScoringProfileSection({
  offering,
  onChangeProfile,
  hasMarketAnalyzer,
  lastRecalculated,
  onJumpToAttribute,
}) {
  const navigate = useNavigate();
  const systemDefault = listSystemDefaultProfiles().find((p) => p.offeringId === offering.id);
  const customProfiles = listCustomProfiles();
  const active = getProfileForOffering(offering) || systemDefault;
  if (!active) return null;

  const isSystem = active.kind === 'system';

  // ─── No-MA tier: collapsed read-only default + attribute mapping ───
  if (!hasMarketAnalyzer) {
    return (
      <div className="bg-surface border border-border rounded-md p-4 mb-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-md bg-sky-500/10 flex items-center justify-center flex-shrink-0">
            <Gauge size={16} className="text-sky-700 dark:text-sky-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                Default scoring profile
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-text-muted/15 text-text-secondary border border-border">
                Read-only · auto-derived
              </span>
            </div>
            <div className="text-sm font-semibold text-text-primary mb-1">{active.name}</div>
            <p className="text-[11px] text-text-secondary leading-snug">{active.description}</p>
            <div className="text-[10px] text-text-muted mt-1 flex items-center gap-1.5 flex-wrap">
              <CheckCircle2 size={9} className="text-emerald-700 dark:text-emerald-300" />
              <span>
                Last recalculated <strong className="text-text-secondary">{lastRecalculated}</strong>
                {' · '}1,247 accounts scored across your book
              </span>
            </div>
          </div>
        </div>

        {/* Dimensions (read-only) */}
        <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-border/60">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mr-1">
            Dimensions
          </span>
          {(active.dimensions || []).map((d) => (
            <span
              key={d}
              className="text-[10px] px-1.5 py-0.5 rounded bg-bg/40 text-text-secondary border border-border/60"
            >
              {d}
            </span>
          ))}
        </div>

        {/* What drives this score */}
        <WhatDrivesScoreGrid rows={ATTRIBUTE_TO_DIMENSION} onJump={onJumpToAttribute} />

        {/* Locked capabilities */}
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
            Advanced controls
          </div>
          <div className="grid grid-cols-3 gap-2">
            {LOCKED_CAPABILITIES.map((cap) => (
              <LockedCapabilityTile
                key={cap.label}
                label={cap.label}
                description={cap.description}
                onClick={() => navigate('/platform')}
              />
            ))}
          </div>
        </div>

        {/* Upsell card */}
        <MaUpsellCard navigate={navigate} variant="card" />
      </div>
    );
  }

  // ─── MA tier: full picker ──────────────────────────────────────────
  return (
    <div className="bg-surface border border-border rounded-md p-4 mb-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-md bg-sky-500/10 flex items-center justify-center flex-shrink-0">
            <Gauge size={16} className="text-sky-700 dark:text-sky-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                Scoring profile
              </span>
              <select
                value={active.id}
                onChange={(e) => onChangeProfile?.(e.target.value)}
                className="text-sm font-semibold text-text-primary bg-surface border border-border rounded px-2 py-1 hover:border-primary/40 focus:outline-none focus:border-primary cursor-pointer max-w-[420px]"
                title="Switch the scoring profile attached to this offering — workbook fit scores update on save."
              >
                {systemDefault && (
                  <optgroup label="System defaults">
                    <option key={systemDefault.id} value={systemDefault.id}>
                      {systemDefault.name}
                    </option>
                  </optgroup>
                )}
                {customProfiles.length > 0 && (
                  <optgroup label="Your profiles (Market Analyzer)">
                    {customProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              {isSystem ? (
                <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-text-muted/15 text-text-secondary border border-border flex items-center gap-0.5">
                  System default · read-only
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
                  <CheckCircle2 size={9} /> Custom · active
                </span>
              )}
            </div>
            <div className="text-[11px] text-text-secondary leading-snug">{active.description}</div>
            <div className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
              <Wand2 size={9} />
              <span>
                Workbook fit scores for this offering follow this profile. Authoring lives in{' '}
                <button
                  onClick={() => navigate('/market-analyzer/scoring-profiles')}
                  className="text-primary hover:underline font-semibold"
                >
                  Market Analyzer → Scoring Profiles
                </button>
                .
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/market-analyzer/scoring-profiles')}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
        >
          Manage profiles <ArrowRight size={11} />
        </button>
      </div>

      {/* Dimensions chip row */}
      <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-border/60">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mr-1">
          Dimensions
        </span>
        {(active.dimensions || []).map((d) => (
          <span
            key={d}
            className="text-[10px] px-1.5 py-0.5 rounded bg-bg/40 text-text-secondary border border-border/60"
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

// Attributes that feed scoring. When admin edits any of these and the
// signature changes, we surface a recalc banner.
const SCORING_RELEVANT_KEYS = ['targetICP', 'gtmMotion', 'competitors', 'complementaryTech', 'intentTopics'];

function offeringScoringSignature(offering) {
  return JSON.stringify(
    SCORING_RELEVANT_KEYS.reduce((acc, k) => ({ ...acc, [k]: offering?.[k] ?? null }), {}),
  );
}

function OfferingDetailView({ offering, onBack }) {
  const navigate = useNavigate();
  const { hasModule } = useDemo();
  const hasMarketAnalyzer = hasModule('market_analyzer');
  const signals = listSignals().filter(
    (s) => Array.isArray(s.relevant_offerings) && (s.relevant_offerings.includes(offering.id) || s.relevant_offerings.includes('all')),
  );
  const workflows = workflowsForOffering(offering.id).filter((w) => w.offering_id === offering.id);

  // Recalc banner state — fires when a scoring-relevant attribute on the
  // offering changes. The signature ref captures the *last recalculated*
  // shape; any drift surfaces the banner.
  const [lastRecalculated, setLastRecalculated] = useState('2 hours ago');
  const [recalcSignature, setRecalcSignature] = useState(() => offeringScoringSignature(offering));
  const currentSignature = offeringScoringSignature(offering);
  const needsRecalc = currentSignature !== recalcSignature;

  const handleRecalculate = () => {
    setRecalcSignature(currentSignature);
    setLastRecalculated('just now');
    window.alert(
      `Recalculating fit scores across your book using the updated ${offering.name} configuration. (Mock — in production this kicks off a background job.)`,
    );
  };

  const jumpToAttribute = (anchorId) => {
    const el = document.getElementById(anchorId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Offerings
      </button>

      <div className="mb-2 text-xs text-text-muted">Platform & Ops · Offerings · {offering.name}</div>

      <div className="flex items-start gap-3 mb-6">
        <div className={`w-12 h-12 rounded-md ${offering.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Package size={22} className={offering.textColor} />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{offering.name}</h1>
          <div className="text-sm text-text-muted">{offering.fullName}</div>
          <p className="text-sm text-text-secondary mt-2 max-w-3xl leading-relaxed">{offering.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-surface border border-border rounded-md p-3">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Active accounts</div>
          <div className="text-2xl font-semibold text-text-primary">{offering.activeAccounts}</div>
        </div>
        <div className="bg-surface border border-border rounded-md p-3">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Avg deal size</div>
          <div className="text-2xl font-semibold text-text-primary">{offering.avgDealSize}</div>
        </div>
        <div className="bg-surface border border-border rounded-md p-3">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Relevant signals</div>
          <div className="text-2xl font-semibold text-text-primary">{signals.length}</div>
        </div>
        <div className="bg-surface border border-border rounded-md p-3">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Offering-specific workflows</div>
          <div className="text-2xl font-semibold text-text-primary">{workflows.length}</div>
        </div>
      </div>

      {/* Recalc banner — surfaces when scoring-relevant attributes
          (ICP, GTM motion, competitors, complementary tech, intent topics)
          have changed since the last recalculation. The only explicit
          scoring action a non-MA admin has. */}
      {needsRecalc && (
        <div className="mb-4 px-4 py-3 rounded-md bg-amber-500/10 border border-amber-500/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={14} className="text-amber-700 dark:text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-text-primary">
              Offering attributes changed
            </div>
            <div className="text-[11px] text-text-secondary leading-snug">
              ICP, competitors, or intent topics were updated since the last scoring run.
              Recalculate to refresh fit scores across your book.
            </div>
          </div>
          <button
            onClick={() => setRecalcSignature(currentSignature)}
            className="text-[11px] text-text-muted hover:text-text-secondary"
          >
            Later
          </button>
          <button
            onClick={handleRecalculate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-md hover:bg-amber-500 transition-colors flex-shrink-0"
          >
            <Sparkles size={11} /> Recalculate scores
          </button>
        </div>
      )}

      {/* Scoring profile section — branches by MA entitlement. */}
      <ScoringProfileSection
        offering={offering}
        hasMarketAnalyzer={hasMarketAnalyzer}
        lastRecalculated={lastRecalculated}
        onJumpToAttribute={jumpToAttribute}
        onChangeProfile={(profileId) => {
          upsertOffering({ ...offering, scoringProfileId: profileId });
        }}
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Pain points */}
        <div className="bg-surface border border-border rounded-md p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle size={12} className="text-amber-700 dark:text-amber-300" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted">Pain points solved</h3>
          </div>
          <ul className="space-y-1.5">
            {offering.painPoints.map((p) => (
              <li key={p} className="flex items-start gap-2 text-xs text-text-secondary leading-snug">
                <span className="text-amber-700 dark:text-amber-300 mt-1">·</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Intent topics */}
        <div id="intent-topics" className="bg-surface border border-border rounded-md p-4 scroll-mt-20">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles size={12} className="text-emerald-700 dark:text-emerald-300" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted">Intent topics tracked</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {offering.intentTopics.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-mono">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Complementary tech */}
        <div id="complementary-tech" className="bg-surface border border-border rounded-md p-4 scroll-mt-20">
          <div className="flex items-center gap-1.5 mb-3">
            <Layers size={12} className="text-sky-700 dark:text-sky-300" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted">Complementary tech</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {offering.complementaryTech.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-mono">
                {t}
              </span>
            ))}
          </div>
          <div className="text-[10px] text-text-muted mt-2 leading-snug">
            Accounts with this stack score higher for {offering.name}.
          </div>
        </div>

        {/* Competitors */}
        <div id="competitors" className="bg-surface border border-border rounded-md p-4 scroll-mt-20">
          <div className="flex items-center gap-1.5 mb-3">
            <Shield size={12} className="text-rose-700 dark:text-rose-300" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted">Competitors / displacement targets</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {offering.competitors.map((c, i) => {
              const label = typeof c === 'string' ? c : c.name;
              const key = typeof c === 'string' ? c : c.id || `${c.name}-${i}`;
              return (
                <span key={key} className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                  vs. {label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Target ICP */}
        <div id="target-icp" className="bg-surface border border-border rounded-md p-4 col-span-2 scroll-mt-20">
          <div className="flex items-center gap-1.5 mb-3">
            <Target size={12} className="text-primary" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted">Target ICP</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Employees</div>
              <div className="text-text-primary">{offering.targetICP.employees}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Industries</div>
              <div className="text-text-primary">{offering.targetICP.industries.join(', ')}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Cloud posture</div>
              <div className="text-text-primary">{offering.targetICP.cloudPosture}</div>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-text-muted leading-snug">
            Sales motion: <span className="font-mono text-text-secondary">{offering.salesMotion}</span>
          </div>
        </div>
      </div>

      {/* Linked workflows */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted inline-flex items-center gap-2">
            <Sparkles size={11} className="text-emerald-700 dark:text-emerald-300" />
            Offering-specific workflows
            <span className="ml-1 text-[10px] text-text-muted font-mono">{workflows.length}</span>
          </h2>
          <button
            onClick={() => navigate('/admin/workflows')}
            className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
          >
            View all workflows →
          </button>
        </div>
        {workflows.length === 0 ? (
          <div className="bg-surface border border-dashed border-border rounded-md p-4 text-[11px] text-text-muted italic">
            No offering-specific workflows yet. Authored workflows can be tagged with this offering in Workflow Studio.
          </div>
        ) : (
          <div className="space-y-2">
            {workflows.map((w) => (
              <button
                key={w.id}
                onClick={() => navigate(`/admin/workflows/${w.id}`)}
                className="w-full text-left bg-surface border border-border rounded-md p-3 hover:border-primary/30 transition-colors flex items-center gap-3"
              >
                <div className={`w-7 h-7 rounded-md ${offering.bg} flex items-center justify-center flex-shrink-0`}>
                  <Sparkles size={13} className={offering.textColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text-primary truncate">{w.name}</div>
                  <div className="text-[10px] text-text-muted truncate">{w.description}</div>
                </div>
                <div className="text-[10px] text-text-muted font-mono">{w.runs_this_week} runs/wk</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-[11px] text-text-muted leading-relaxed max-w-3xl border-t border-border pt-4">
        <span className="font-semibold text-text-secondary">How offerings drive the platform:</span> Each
        offering becomes a scoring lens for accounts (different fit score per offering), a filter for the
        signals sellers see, and a routing key for which workflows surface where. Sellers pick an offering
        lens on their home and the system curates everything around it.
      </div>
    </div>
  );
}

export default function OfferingsRoute() {
  const navigate = useNavigate();
  const { id } = useParams();

  if (id) {
    const offering = getOffering(id);
    if (!offering) {
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
            <Package size={20} className="mx-auto mb-2 text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary mb-1">Offering not found</h3>
          </div>
        </div>
      );
    }
    return <OfferingDetailView offering={offering} onBack={() => navigate('/admin/offerings')} />;
  }

  return <OfferingsListView />;
}

function OfferingsListView() {
  const navigate = useNavigate();
  const [, setTick] = useState(0);
  const [editing, setEditing] = useState(null); // offering object | 'new' | null
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => subscribeOfferings(() => setTick((t) => t + 1)), []);

  const offerings = listOfferings();

  function handleSave(draft) {
    upsertOffering(draft);
    setEditing(null);
  }

  function handleDelete(id) {
    deleteOffering(id);
    setConfirmDelete(null);
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Admin Hub
      </button>

      <div className="mb-2 text-xs text-text-muted">Platform & Ops · Offerings</div>

      <div className="flex items-end justify-between mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Offerings</h1>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
        >
          <Plus size={12} />
          New offering
        </button>
      </div>

      <p className="text-sm text-text-secondary mb-6 max-w-3xl">
        Each offering is a distinct product or solution — configured the same way as in the onboarding wizard.
        Edit, add, or remove offerings; changes propagate to scoring models, plays, the workbook lens, and seller workspaces.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {offerings.map((o) => (
          <OfferingCard
            key={o.id}
            offering={o}
            onOpen={(id) => navigate(`/admin/offerings/${id}`)}
            onEdit={() => setEditing(o)}
            onDelete={() => setConfirmDelete(o.id)}
          />
        ))}
      </div>

      <div className="mt-8 text-[11px] text-text-muted leading-relaxed max-w-3xl border-t border-border pt-4">
        <span className="font-semibold text-text-secondary">Why offerings matter:</span> A single account
        can score differently for each offering — Acme Corp is A-tier for CNAPP and C-tier for DSPM, so the
        sales motion should differ. Sellers pick an offering lens to focus their morning; signals and plays
        are filtered to that lens. RevOps configures offerings once; the whole platform stacks on top.
      </div>

      <AnimatePresence>
        {editing && (
          <ManageOfferingDrawer
            offering={editing === 'new' ? null : editing}
            onSave={handleSave}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-surface border border-border rounded-lg p-5 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-text-primary mb-1">Delete this offering?</h3>
              <p className="text-[12px] text-text-secondary mb-4">
                Any plays, scoring models, or saved views attached to this offering will lose their anchor.
                You can recreate the offering from this page or the onboarding wizard at any time.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-[12px] px-3 py-1.5 rounded border border-border text-text-secondary hover:border-primary/30"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="text-[12px] px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-500 font-semibold"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
