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
} from 'lucide-react';
import { listOfferings, getOffering, upsertOffering, deleteOffering, subscribeOfferings } from '../data/offerings.js';
import { workflowsForOffering } from '../data/workflows.js';
import { listSignals } from '../data/signals.js';
import { getModelForOffering, PILLARS, SCORING_TIERS } from '../data/scoringModels.js';
import { ManageOfferingDrawer } from '../components/onboarding/StepOfferings.jsx';

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

function ScoringModelSummary({ offering, onOpenBuilder }) {
  const model = getModelForOffering(offering.id);
  if (!model) return null;

  const tierMap = Object.fromEntries(SCORING_TIERS.map((t) => [t.id, t]));
  const total = model.tier_distribution.total || 1;
  const tierEntries = ['A', 'B', 'C', 'D'].map((id) => ({
    ...tierMap[id],
    count: model.tier_distribution[id] || 0,
    pct: ((model.tier_distribution[id] || 0) / total) * 100,
  }));

  return (
    <div className="bg-surface border border-border rounded-md p-4 mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Gauge size={16} className="text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="text-sm font-semibold text-text-primary">{model.name}</h3>
              <span className="text-[10px] font-mono text-text-muted">v{model.version}</span>
              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
                <CheckCircle2 size={9} /> Active
              </span>
            </div>
            <div className="text-[11px] text-text-secondary leading-snug">
              Composite scoring model · DC methodology · auto-built from this offering&rsquo;s config
            </div>
            <div className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
              <Wand2 size={9} />
              Auto-built {model.auto_built_from_offering_at} by {model.created_by}
            </div>
          </div>
        </div>
        <button
          onClick={onOpenBuilder}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
        >
          Open model builder <ArrowRight size={11} />
        </button>
      </div>

      {/* Composite weights bars */}
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
          Composite weights — Fit {model.composite_weights.fit}% · Need {model.composite_weights.need}% · Intent{' '}
          {model.composite_weights.intent}%
        </div>
        <div className="space-y-1.5">
          {['fit', 'need', 'intent'].map((p) => {
            const pillar = PILLARS[p];
            const weight = model.composite_weights[p];
            const dimCount = (model[p].dimensions || []).length;
            const totalPts = (model[p].dimensions || []).reduce((s, d) => s + (d.cap || 0), 0);
            return (
              <div key={p} className="flex items-center gap-2">
                <span className={`text-[11px] font-semibold w-14 ${pillar.color}`}>{pillar.label}</span>
                <div className="flex-1 h-3 bg-bg/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${weight}%`, background: pillar.accent }}
                  />
                </div>
                <span className="text-[10px] font-mono text-text-muted w-32 text-right">
                  {dimCount} dim · {totalPts} pts raw
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier distribution */}
      <div className="mb-2">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
          Tier distribution across {model.accounts_scored.toLocaleString()} accounts
        </div>
        <div className="flex items-stretch gap-0.5 h-7 rounded overflow-hidden">
          {tierEntries.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-center text-[10px] font-bold ${t.color}`}
              style={{ width: `${t.pct}%`, background: t.accent + '33' }}
              title={`${t.count} accounts in tier ${t.label}`}
            >
              {t.pct > 8 && <span>{t.label} · {t.count}</span>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-muted">
          {tierEntries.map((t) => (
            <div key={t.id} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: t.accent }} />
              <span>
                <span className={t.color}>{t.label}</span> {t.count}
              </span>
            </div>
          ))}
          <span className="ml-auto">Last evaluated {model.last_evaluated}</span>
        </div>
      </div>
    </div>
  );
}

function OfferingDetailView({ offering, onBack }) {
  const navigate = useNavigate();
  const signals = listSignals().filter(
    (s) => Array.isArray(s.relevant_offerings) && (s.relevant_offerings.includes(offering.id) || s.relevant_offerings.includes('all')),
  );
  const workflows = workflowsForOffering(offering.id).filter((w) => w.offering_id === offering.id);

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

      {/* Scoring model — embedded summary + builder CTA */}
      <ScoringModelSummary
        offering={offering}
        onOpenBuilder={() => navigate(`/admin/offerings/${offering.id}/model`)}
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
        <div className="bg-surface border border-border rounded-md p-4">
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
        <div className="bg-surface border border-border rounded-md p-4">
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
        <div className="bg-surface border border-border rounded-md p-4">
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
        <div className="bg-surface border border-border rounded-md p-4 col-span-2">
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
