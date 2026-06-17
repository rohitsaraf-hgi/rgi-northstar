import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Globe,
  Activity,
  Clock,
  ArrowRight,
  Compass,
  Target,
  Plus,
  FileSearch,
  CheckCircle2,
  Search,
  Filter,
  ChevronDown,
  Zap,
  Inbox,
  CheckSquare,
  Workflow,
  XCircle,
  Hourglass,
  Package,
  Layers,
  Info,
  Play,
  Table as TableIcon,
  Wand2,
} from 'lucide-react';
import { useTenant } from '../context/TenantContext.jsx';
import { usePersona } from '../context/PersonaContext.jsx';
import { getAccountsForOwner, rankBySignal, groupByStage, ACCOUNT_STAGES, SIGNAL_TYPES } from '../data/accounts.js';
import {
  listPendingCheckpoints,
  listSignalTriggeredPlays,
  listRecentOutcomes,
  inboxCounts,
  OUTCOME_TREATMENTS,
  relativeTime,
} from '../data/sellerInbox.js';
import { listOfferings, getOffering, ALL_OFFERINGS_LENS } from '../data/offerings.js';
import { getFitFor, getAllFitFor, tierForScore, bestOfferingFor } from '../data/accountOfferingFit.js';
import { workflowsForOffering, getWorkflow } from '../data/workflows.js';
import {
  listPlaysForRole,
  effectivePinnedPlayIds,
  setPinnedPlayIds,
  subscribePinnedPlays,
  getPlay,
} from '../data/plays.js';
import {
  rankAccountsForPlay,
  countMatchesPerPlay,
  provenanceFromFiringSignals,
} from '../data/playEvaluator.js';
import { SIGNAL_CATEGORIES } from '../data/rankingSignals.js';
import {
  listAvailableWhitespace,
  listAddedFromWhitespace,
  markAccountAdded,
  subscribeAdded,
} from '../data/whitespaceAccounts.js';
import {
  readFilterState,
  writeFilterState,
} from '../data/sellerHomeFilters.js';
import { isAgentAccessEnabled, setIntegrationGovernance } from '../data/integrationGovernance.js';
import { useToast } from '../context/ToastContext.jsx';

const SIGNAL_ICONS = {
  intent_surge: TrendingUp,
  web_event: Globe,
  crm_activity: Activity,
  no_touch: Clock,
};

function SignalIcon({ type, size = 11 }) {
  const Icon = SIGNAL_ICONS[type] || Sparkles;
  const cfg = SIGNAL_TYPES[type];
  return <Icon size={size} className={cfg?.color || 'text-text-muted'} />;
}

function StageBadge({ stage, size = 'sm' }) {
  const cfg = ACCOUNT_STAGES[stage];
  if (!cfg) return null;
  const padding = size === 'xs' ? 'px-1 py-0' : 'px-1.5 py-0.5';
  const textSize = size === 'xs' ? 'text-[9px]' : 'text-[10px]';
  return (
    <span className={`inline-flex items-center gap-1 ${padding} rounded font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border} ${textSize}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.short}
    </span>
  );
}

// ----- Plays filter bar — primary seller filter mechanism -----

function PlayChip({ play, active, counts, onClick }) {
  const offering = getOffering(play.offering_id);
  const styles = active
    ? `${offering?.bg || 'bg-primary/10'} ${offering?.textColor || 'text-primary'} ${offering?.borderColor || 'border-primary/40'}`
    : 'bg-surface border-border text-text-secondary hover:text-text-primary';
  const total = counts?.total ?? 0;
  const book = counts?.book ?? 0;
  const ws = counts?.whitespace ?? 0;
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1.5 text-xs rounded-md transition-colors border flex items-center gap-1.5 ${styles}`}
      title={`${play.description}\n\n${book} in book · ${ws} in whitespace`}
    >
      <Wand2 size={11} className={offering?.textColor || (active ? 'text-primary' : 'text-text-muted')} />
      <span className="font-semibold">{play.name}</span>
      <span className={`text-[10px] font-mono ${active ? 'opacity-80' : 'text-text-muted'}`}>
        {book > 0 && ws > 0 ? `${book}+${ws}` : total}
      </span>
    </button>
  );
}

function PlaysFilterBar({ pinnedPlays, activePlayId, playCounts, onSelectPlay, onClear, onManagePins }) {
  return (
    <div className="bg-surface border border-border rounded-md p-3 mb-5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mr-1 flex items-center gap-1">
          <Wand2 size={10} />
          Plays:
        </span>
        <button
          onClick={() => onSelectPlay(null)}
          className={`px-2.5 py-1.5 text-xs rounded-md transition-colors border flex items-center gap-1.5 ${
            !activePlayId
              ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
              : 'bg-surface border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          All accounts
        </button>
        {pinnedPlays.map((p) => (
          <PlayChip
            key={p.id}
            play={p}
            active={activePlayId === p.id}
            counts={playCounts[p.id]}
            onClick={() => onSelectPlay(p.id)}
          />
        ))}
        {activePlayId && (
          <button
            onClick={onClear}
            className="text-[10px] text-text-muted hover:text-text-secondary inline-flex items-center gap-1"
          >
            Clear <XCircle size={9} />
          </button>
        )}
        <button
          onClick={onManagePins}
          className="ml-auto text-[10px] text-text-muted hover:text-text-secondary inline-flex items-center gap-1"
          title="Pin plays to your chip strip"
        >
          + Manage chips
        </button>
      </div>
    </div>
  );
}

// Quick pin manager — popover/modal with all plays + checkboxes
function ManagePinsModal({ open, personaId, role, currentPinned, onClose, onSave }) {
  const [selected, setSelected] = useState([]);
  useEffect(() => {
    if (open) setSelected(currentPinned);
  }, [open, currentPinned]);
  if (!open) return null;
  const allPlays = listPlaysForRole(role);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-bg border border-border rounded-md shadow-elev w-full max-w-lg"
      >
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Manage your chip strip</h2>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            Pick which plays show as chips on your home. Admin defaults are starred — your selection
            overrides them.
          </p>
        </div>
        <div className="px-5 py-3 max-h-96 overflow-y-auto thin-scrollbar space-y-1">
          {allPlays.map((p) => {
            const offering = getOffering(p.offering_id);
            const isOn = selected.includes(p.id);
            return (
              <label
                key={p.id}
                className="flex items-start gap-2 px-2 py-1.5 hover:bg-surface-2 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => {
                    setSelected((cur) => (isOn ? cur.filter((x) => x !== p.id) : [...cur, p.id]));
                  }}
                  className="mt-0.5 accent-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Wand2 size={10} className={offering?.textColor || 'text-text-muted'} />
                    <span className="text-xs font-semibold text-text-primary">{p.name}</span>
                    {p.is_default_chip && (
                      <span title="Admin default">
                        <Sparkles size={9} className="text-amber-500" />
                      </span>
                    )}
                    {offering && (
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-1 rounded ${offering.bg} ${offering.textColor}`}>
                        {offering.name.replace('Wiz ', '')}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-text-muted leading-snug">{p.description}</div>
                </div>
              </label>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded">
            Cancel
          </button>
          <button
            onClick={() => onSave(null)}
            className="px-3 py-1.5 text-xs border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded"
            title="Reset to admin defaults"
          >
            Reset to defaults
          </button>
          <button
            onClick={() => onSave(selected)}
            className="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary-dim"
          >
            Save pins
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ----- Play match card — used when a play is selected. Renders book + whitespace consistently. -----

function PlayMatchCard({ account, isBookAccount, play, firingSignals, score, onOpen, onAddToBook, onRunWorkflow, index }) {
  const offering = getOffering(play.offering_id);
  const fit = getFitFor(account.id, play.offering_id);
  const tier = fit?.score != null ? tierForScore(fit.score) : null;
  const provenance = provenanceFromFiringSignals(firingSignals || [], 4);

  const recommendedWorkflows = (play.recommended_workflows || [])
    .map((wid) => getWorkflow(wid))
    .filter(Boolean)
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 5) * 0.03 }}
      className={`bg-surface border ${offering?.borderColor || 'border-border'} rounded-md p-4 hover:border-border-2 transition-colors`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: account.logoColor }}
        >
          {account.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          {/* Header row: name + source badge + fit tier + score */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <button
              onClick={() => onOpen(account)}
              className="text-sm font-semibold text-text-primary hover:text-primary transition-colors"
            >
              {account.name}
            </button>
            {isBookAccount ? (
              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
                In book
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                Whitespace
              </span>
            )}
            {tier && (
              <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${tier.bg} ${tier.color} ${tier.border} border`}>
                {tier.label} · {fit.score}
              </span>
            )}
            <span className="ml-auto text-[10px] text-text-muted font-mono" title="Play match score (match strength × offering fit)">
              ↑ {score}
            </span>
          </div>

          {/* Sub-header: industry + size */}
          <div className="text-[11px] text-text-muted mb-2">
            {account.industry} · {account.fai?.revenue} · {account.fai?.employees} employees
          </div>

          {/* Provenance — matched conditions */}
          {provenance.length > 0 && (
            <div className="flex items-start gap-1.5 flex-wrap mb-3">
              <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted mt-1 mr-1">
                Signals firing:
              </span>
              {provenance.map((sig) => {
                const cat = SIGNAL_CATEGORIES[sig.category];
                return (
                  <span
                    key={sig.id}
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${cat?.bg || 'bg-bg/40'} ${cat?.color || 'text-text-secondary'} border-current/20`}
                    title={`${sig.description} · weight ${sig.weight}`}
                  >
                    {sig.name}
                  </span>
                );
              })}
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-border/60">
            {isBookAccount ? (
              <button
                onClick={() => onOpen(account)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white text-[11px] rounded hover:bg-primary-dim font-medium"
              >
                Open thread <ArrowRight size={9} />
              </button>
            ) : (
              <button
                onClick={() => onAddToBook(account)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-500 text-white text-[11px] rounded hover:bg-violet-600 font-medium"
              >
                <Plus size={9} />
                Add to book
              </button>
            )}
            {recommendedWorkflows.map((w) => (
              <button
                key={w.id}
                onClick={() => onRunWorkflow(w.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 border border-border text-[11px] text-text-secondary hover:text-text-primary hover:border-border-2 rounded"
                title={w.description}
              >
                <Play size={9} />
                {w.name}
              </button>
            ))}
            {offering && (
              <span className={`ml-auto text-[10px] ${offering.textColor}`}>
                Offering: {offering.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ----- Provenance account card -----

function FitScoreBadge({ score, offeringId }) {
  if (score == null) return null;
  const tier = tierForScore(score);
  const offering = getOffering(offeringId);
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${tier.bg} ${tier.color} ${tier.border}`}
      title={offering ? `${offering.name} fit score` : 'Fit score'}
    >
      {offering && <Package size={9} />}
      <span>{tier.label}</span>
      <span className="font-mono opacity-80">{score}</span>
    </span>
  );
}

function ProvenanceAccountCard({ account, lensOfferingId, onOpen, onAction, index }) {
  const [whyOpen, setWhyOpen] = useState(false);

  // Resolve "active offering" — explicit lens, or auto best-fit if 'all'.
  const isAllLens = lensOfferingId === 'all';
  const allFits = getAllFitFor(account.id);
  const best = bestOfferingFor(account.id);
  const activeOfferingId = isAllLens ? best?.offeringId : lensOfferingId;
  const fit = activeOfferingId ? getFitFor(account.id, activeOfferingId) : { score: null, reasons: [] };
  const offering = activeOfferingId ? getOffering(activeOfferingId) : null;

  // Recommended workflows for this lens.
  const recommendations = useMemo(() => {
    const offeringWorkflows = workflowsForOffering(activeOfferingId || 'all');
    // Prioritize offering-specific over 'all'
    const specific = offeringWorkflows.filter((w) => w.offering_id === activeOfferingId);
    const generic = offeringWorkflows.filter((w) => w.offering_id === 'all');
    return [...specific, ...generic].slice(0, 2);
  }, [activeOfferingId]);

  const topSignal = account.signals?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 5) * 0.03 }}
      className={`bg-surface border ${offering?.borderColor || 'border-border'} rounded-md p-4 hover:border-border-2 transition-colors`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: account.logoColor }}
        >
          {account.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <button
              onClick={() => onOpen(account)}
              className="text-sm font-semibold text-text-primary hover:text-primary transition-colors"
            >
              {account.name}
            </button>
            <StageBadge stage={account.stage} size="xs" />
            {offering && fit.score != null && <FitScoreBadge score={fit.score} offeringId={offering.id} />}
            <span className="text-[10px] text-text-muted">·</span>
            <span className="text-[10px] text-text-muted">
              {account.fai.revenue} · {account.fai.employees}
            </span>
          </div>

          {/* Lens line — "why this account, for this lens" */}
          {offering && (
            <div className={`text-[11px] mb-2 ${offering.textColor}`}>
              <span className="font-semibold">{offering.name}</span>
              <span className="text-text-secondary"> · {fit.reasons[0]}</span>
              {fit.reasons.length > 1 && (
                <button
                  onClick={() => setWhyOpen((v) => !v)}
                  className="text-text-muted hover:text-text-primary ml-1.5 inline-flex items-center gap-0.5"
                >
                  · {fit.reasons.length - 1} more
                  <ChevronDown size={9} className={`transition-transform ${whyOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          )}

          {/* Expanded reasons */}
          {whyOpen && fit.reasons.length > 1 && (
            <div className={`mb-2 pl-2 border-l-2 ${offering.borderColor || 'border-border'} space-y-0.5`}>
              {fit.reasons.slice(1).map((r) => (
                <div key={r} className="text-[11px] text-text-secondary leading-snug">
                  · {r}
                </div>
              ))}
            </div>
          )}

          {/* Top signal — the headline */}
          {topSignal && (
            <div className="flex items-start gap-1.5 mb-2">
              <SignalIcon type={topSignal.type} size={12} />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-text-primary">{topSignal.headline}</span>
                <span className="text-[10px] text-text-muted ml-1.5">· {topSignal.daysAgo}d ago</span>
                <div className="text-[11px] text-text-secondary leading-snug mt-0.5">{topSignal.detail}</div>
              </div>
            </div>
          )}

          {/* Other signals (compact chips) */}
          {account.signals?.length > 1 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {account.signals.slice(1, 3).map((s) => (
                <span
                  key={s.id}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${SIGNAL_TYPES[s.type]?.bg} ${SIGNAL_TYPES[s.type]?.color} ${SIGNAL_TYPES[s.type]?.border}`}
                >
                  <SignalIcon type={s.type} size={9} />
                  {s.headline}
                </span>
              ))}
            </div>
          )}

          {/* Recommended next */}
          {recommendations.length > 0 && (
            <div className="border-t border-border/60 pt-2.5 mt-2">
              <div className="flex items-center gap-1 mb-1.5">
                <Sparkles size={10} className="text-emerald-700 dark:text-emerald-300" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                  What next
                </span>
                {offering && (
                  <span className="text-[10px] text-text-muted">
                    · for {offering.name}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onOpen(account)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white text-[11px] rounded hover:bg-primary-dim font-medium"
                >
                  Open thread <ArrowRight size={9} />
                </button>
                {recommendations.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => onAction(account, w.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 border border-border text-[11px] text-text-secondary hover:text-text-primary hover:border-border-2 rounded"
                    title={w.description}
                  >
                    <Play size={9} />
                    {w.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer line */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-text-muted">
            <span>
              Last touch:{' '}
              <span className="text-text-secondary font-medium">{account.lastTouch || 'never'}</span>
            </span>
            {isAllLens && Object.keys(allFits).length > 1 && (
              <>
                <span>·</span>
                <span title="Other offering fits for this account">
                  Also fits:{' '}
                  {Object.entries(allFits)
                    .filter(([oid]) => oid !== activeOfferingId)
                    .filter(([, f]) => f.score >= 70)
                    .map(([oid, f]) => {
                      const o = getOffering(oid);
                      return o ? `${o.name} ${f.score}` : null;
                    })
                    .filter(Boolean)
                    .slice(0, 2)
                    .join(' · ')}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ----- AWAITING YOU section (unchanged from previous build) -----

function CheckpointCard({ checkpoint, onOpen, onApprove }) {
  const hoursLeft = Math.max(
    0,
    checkpoint.sla_hours - Math.floor((Date.now() - new Date(checkpoint.fired_at).getTime()) / 3600000),
  );
  const urgent = hoursLeft < 6;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-surface border rounded-md p-3 hover:shadow-card transition-all ${
        urgent ? 'border-amber-500/40' : 'border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <CheckSquare size={15} className="text-amber-700 dark:text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
              Approval needed
            </span>
            <span className="text-xs font-semibold text-text-primary">{checkpoint.workflow_name}</span>
            <span className="text-[10px] text-text-muted">·</span>
            <div className="flex items-center gap-1">
              <div
                className="w-3.5 h-3.5 rounded flex items-center justify-center text-white text-[8px] font-bold"
                style={{ background: checkpoint.account_logo }}
              >
                {checkpoint.account_name.charAt(0)}
              </div>
              <span className="text-xs text-text-secondary">{checkpoint.account_name}</span>
            </div>
          </div>
          <div className="text-[11px] text-text-secondary leading-snug mb-2">{checkpoint.step_label}</div>

          {checkpoint.bound_signal_id && (
            <div className="flex items-center gap-1 text-[10px] text-rose-700 dark:text-rose-300 mb-2">
              <Zap size={9} />
              Triggered by signal: <span className="font-mono">{checkpoint.bound_signal_label}</span>
            </div>
          )}

          {checkpoint.preview && (
            <div className="bg-bg/40 border border-border rounded p-2 mb-2">
              <div className="text-[11px] font-semibold text-text-primary truncate">{checkpoint.preview.title}</div>
              <div className="text-[10px] text-text-secondary line-clamp-2 leading-snug mt-0.5">
                {checkpoint.preview.snippet}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onApprove(checkpoint)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white text-[11px] rounded hover:bg-primary-dim font-medium"
            >
              <CheckCircle2 size={9} />
              Approve & continue
            </button>
            <button
              onClick={() => onOpen(checkpoint)}
              className="inline-flex items-center gap-1 px-2.5 py-1 border border-border text-[11px] text-text-secondary hover:text-text-primary hover:border-border-2 rounded"
            >
              Review draft <ArrowRight size={9} />
            </button>
            <span
              className={`ml-auto text-[10px] flex items-center gap-1 ${
                urgent ? 'text-amber-700 dark:text-amber-300 font-semibold' : 'text-text-muted'
              }`}
            >
              <Hourglass size={9} />
              {hoursLeft}h left · {relativeTime(checkpoint.fired_at)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TriggeredPlayCard({ play, onRun, onPreview }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-md p-3 hover:shadow-card transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Workflow size={15} className="text-emerald-700 dark:text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              Ready to run
            </span>
            <span className="text-xs font-semibold text-text-primary">{play.workflow_name}</span>
            <span className="text-[10px] text-text-muted">·</span>
            <div className="flex items-center gap-1">
              <div
                className="w-3.5 h-3.5 rounded flex items-center justify-center text-white text-[8px] font-bold"
                style={{ background: play.account_logo }}
              >
                {play.account_name.charAt(0)}
              </div>
              <span className="text-xs text-text-secondary">{play.account_name}</span>
            </div>
          </div>

          {play.signal_id ? (
            <div className="flex items-center gap-1 text-[10px] text-rose-700 dark:text-rose-300 mb-1">
              <Zap size={9} />
              Signal: <span className="font-mono">{play.signal_label}</span>
            </div>
          ) : (
            <div className="text-[10px] text-text-muted mb-1">{play.signal_label}</div>
          )}

          <div className="text-[11px] text-text-secondary font-mono leading-snug mb-2">{play.evidence}</div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onRun(play)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white text-[11px] rounded hover:bg-primary-dim font-medium"
            >
              <Sparkles size={9} />
              Run play
            </button>
            <button
              onClick={() => onPreview(play)}
              className="inline-flex items-center gap-1 px-2.5 py-1 border border-border text-[11px] text-text-secondary hover:text-text-primary hover:border-border-2 rounded"
            >
              Open account <ArrowRight size={9} />
            </button>
            <span className="ml-auto text-[10px] text-text-muted flex items-center gap-1">
              <Clock size={9} />
              Fired {relativeTime(play.fired_at)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AwaitingYouSection({ checkpoints, plays, onApprove, onOpenCheckpoint, onRunPlay, onOpenAccount }) {
  const empty = checkpoints.length === 0 && plays.length === 0;
  if (empty) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted inline-flex items-center gap-2">
            <Inbox size={11} className="text-primary" />
            Awaiting you
          </h2>
        </div>
        <div className="bg-surface border border-dashed border-border rounded-md p-6 text-center">
          <CheckCircle2 size={18} className="mx-auto mb-2 text-emerald-700 dark:text-emerald-300" />
          <div className="text-sm font-semibold text-text-primary mb-1">Inbox zero</div>
          <p className="text-xs text-text-secondary">
            No checkpoints or signal-triggered plays waiting on you.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted inline-flex items-center gap-2">
          <Inbox size={11} className="text-primary" />
          Awaiting you
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-mono">
            {checkpoints.length + plays.length}
          </span>
        </h2>
      </div>

      <div className="space-y-2">
        {checkpoints.map((c) => (
          <CheckpointCard key={c.id} checkpoint={c} onApprove={onApprove} onOpen={onOpenCheckpoint} />
        ))}
        {plays.map((p) => (
          <TriggeredPlayCard key={p.id} play={p} onRun={onRunPlay} onPreview={onOpenAccount} />
        ))}
      </div>
    </div>
  );
}

// ----- Recent outcomes (unchanged) -----

function OutcomeIcon({ tone }) {
  if (tone === 'success') return <CheckCircle2 size={14} className="text-emerald-700 dark:text-emerald-300" />;
  if (tone === 'info') return <Sparkles size={14} className="text-sky-700 dark:text-sky-300" />;
  if (tone === 'negative') return <XCircle size={14} className="text-rose-700 dark:text-rose-300" />;
  return <Clock size={14} className="text-text-muted" />;
}

function OutcomeRow({ outcome, onOpen }) {
  const treatment = OUTCOME_TREATMENTS[outcome.outcome] || OUTCOME_TREATMENTS.completed;
  return (
    <button
      onClick={() => onOpen(outcome)}
      className="w-full text-left flex items-start gap-3 px-3 py-2.5 hover:bg-surface-2 transition-colors border-b border-border/40 last:border-b-0"
    >
      <div className={`w-7 h-7 rounded-md ${treatment.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <OutcomeIcon tone={treatment.tone} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${treatment.bg} ${treatment.color}`}>
            {treatment.label}
          </span>
          <span className="text-xs font-semibold text-text-primary">{outcome.workflow_name}</span>
          <span className="text-[10px] text-text-muted">·</span>
          <div className="flex items-center gap-1">
            <div
              className="w-3.5 h-3.5 rounded flex items-center justify-center text-white text-[8px] font-bold"
              style={{ background: outcome.account_logo }}
            >
              {outcome.account_name.charAt(0)}
            </div>
            <span className="text-xs text-text-secondary">{outcome.account_name}</span>
          </div>
          <span className="ml-auto text-[10px] text-text-muted">{relativeTime(outcome.completed_at)}</span>
        </div>
        {outcome.outcome_detail && (
          <div className="text-[11px] text-text-secondary leading-snug">{outcome.outcome_detail}</div>
        )}
      </div>
    </button>
  );
}

function RecentOutcomesSection({ outcomes, onOpen }) {
  if (outcomes.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted inline-flex items-center gap-2">
          <TrendingUp size={11} className="text-primary" />
          Recent outcomes
          <span className="ml-1 text-[10px] text-text-muted normal-case">last 7 days</span>
        </h2>
      </div>
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        {outcomes.map((o) => (
          <OutcomeRow key={o.id} outcome={o} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

// ----- AccountChip + StageColumn (unchanged book grid) -----

function AccountChip({ account, onOpen }) {
  const hasNewSignal = account.signals?.some((s) => s.daysAgo != null && s.daysAgo < 7);
  return (
    <button
      onClick={() => onOpen(account)}
      className="text-left p-3 bg-surface border border-border rounded-md hover:border-primary/30 hover:shadow-card transition-all"
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-7 h-7 rounded flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
          style={{ background: account.logoColor }}
        >
          {account.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-primary truncate">{account.name}</span>
            {hasNewSignal && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" title="New signal" />}
          </div>
          <div className="text-[10px] text-text-muted truncate">{account.fai.revenue} · {account.fai.employees}</div>
          <div className="text-[10px] text-text-muted mt-0.5">
            {account.signals?.length || 0} signal{account.signals?.length === 1 ? '' : 's'} · score {account.combinedScore}
          </div>
        </div>
      </div>
    </button>
  );
}

const STAGE_COLUMN_CAP = 6;

function StageColumn({ stage, accounts, onOpen }) {
  const cfg = ACCOUNT_STAGES[stage];
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? accounts : accounts.slice(0, STAGE_COLUMN_CAP);
  const hidden = Math.max(0, accounts.length - STAGE_COLUMN_CAP);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">{cfg.label}</span>
        <span className="text-[10px] text-text-muted">{accounts.length}</span>
      </div>
      <div className="space-y-1.5">
        {accounts.length === 0 ? (
          <div className="text-[11px] text-text-muted italic px-3 py-3 border border-dashed border-border rounded text-center">
            No accounts in {cfg.short}
          </div>
        ) : (
          <>
            {visible.map((a) => <AccountChip key={a.id} account={a} onOpen={onOpen} />)}
            {hidden > 0 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full text-[11px] text-primary hover:underline inline-flex items-center justify-center gap-1 py-1.5 border border-dashed border-border rounded"
              >
                {expanded ? 'Show less' : `+ ${hidden} more in ${cfg.short}`}
                {!expanded && <ChevronDown size={9} />}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ----- Main route -----

export default function SellerHome() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { personaId, persona } = usePersona();
  const { showToast } = useToast();

  // ----- Play-driven filter state -----
  // URL-aware: ?play=<id> selects a play. Otherwise default = no play selected (All accounts).
  const [activePlayId, setActivePlayId] = useState(() => readFilterState(personaId)?.playId || null);
  useEffect(() => {
    setActivePlayId(readFilterState(personaId)?.playId || null);
  }, [personaId]);
  const setActivePlay = (id) => {
    setActivePlayId(id);
    writeFilterState(personaId, { ...readFilterState(personaId), playId: id });
  };

  // Pinned plays (rep can override admin defaults)
  const [pinsTick, setPinsTick] = useState(0);
  useEffect(() => subscribePinnedPlays(() => setPinsTick((t) => t + 1)), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pinnedPlays = useMemo(() => {
    const ids = effectivePinnedPlayIds(personaId, persona.salesRole);
    return ids.map((id) => getPlay(id)).filter(Boolean);
  }, [personaId, persona.salesRole, pinsTick]);

  const activePlay = activePlayId ? getPlay(activePlayId) : null;
  const activeOffering = activePlay ? getOffering(activePlay.offering_id) : null;

  // Inbox queries
  const pendingCheckpoints = useMemo(
    () => listPendingCheckpoints(personaId, persona.salesRole),
    [personaId, persona.salesRole],
  );
  const triggeredPlays = useMemo(() => listSignalTriggeredPlays(personaId), [personaId]);
  const recentOutcomes = useMemo(() => listRecentOutcomes(personaId), [personaId]);
  const counts = useMemo(() => inboxCounts(personaId, persona.salesRole), [personaId, persona.salesRole]);

  // ----- Unified account pool (book + whitespace) -----
  const [whitespaceTick, setWhitespaceTick] = useState(0);
  useEffect(() => subscribeAdded(() => setWhitespaceTick((t) => t + 1)), []);

  const accounts = useMemo(() => getAccountsForOwner('alex'), []);
  // For now non-PLG personas share Alex's book for the demo

  // Pool used for play evaluation: book + whitespace combined
  const evalPool = useMemo(() => {
    const book = accounts.map((a) => ({ account: a, isBookAccount: true }));
    const added = listAddedFromWhitespace(personaId).map((a) => ({ account: a, isBookAccount: true }));
    const ws = listAvailableWhitespace(personaId).map((a) => ({ account: a, isBookAccount: false }));
    return [...book, ...added, ...ws];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, personaId, whitespaceTick]);

  // Play match counts (for chip badges)
  const playCounts = useMemo(() => countMatchesPerPlay(pinnedPlays, evalPool), [pinnedPlays, evalPool]);

  // Ranked accounts for the selected play
  const playRankedAccounts = useMemo(() => {
    if (!activePlay) return null;
    return rankAccountsForPlay(activePlay, evalPool).slice(0, 12);
  }, [activePlay, evalPool]);

  // Fallback when no play selected — top of book by combined score (legacy behavior)
  const noPlayTopAccounts = useMemo(() => {
    if (activePlay) return [];
    return [...accounts].sort((a, b) => (b.combinedScore ?? 0) - (a.combinedScore ?? 0)).slice(0, 6);
  }, [accounts, activePlay]);

  const [search, setSearch] = useState('');
  const [bookFilter, setBookFilter] = useState('all');

  const filteredBook = useMemo(() => {
    let rows = [...accounts];
    if (bookFilter === 'with_signals') rows = rows.filter((a) => (a.signals || []).length > 0);
    if (bookFilter === 'a_tier') rows = rows.filter((a) => a.combinedScore >= 80);
    if (bookFilter === 'bfs') rows = rows.filter((a) => a.industry === 'Banking and Financial Services');
    if (bookFilter === 'no_touch') rows = rows.filter((a) => a.lastTouchDaysAgo == null || a.lastTouchDaysAgo > 14);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((a) => a.name.toLowerCase().includes(q) || a.industry.toLowerCase().includes(q));
    }
    return rows;
  }, [accounts, bookFilter, search]);

  const grouped = useMemo(() => groupByStage(filteredBook), [filteredBook]);

  const handleOpen = (account) => navigate(`/account/${account.id}`);
  const handleAction = (account, workflowId) => navigate(`/account/${account.id}?play=${workflowId}`);
  const handleApprove = (checkpoint) => {
    showToast(`Approved · ${checkpoint.workflow_name} continues on ${checkpoint.account_name}`, 'success');
    navigate(`/account/${checkpoint.account_id}`);
  };
  const handleOpenCheckpoint = (checkpoint) => navigate(`/account/${checkpoint.account_id}`);
  const handleRunPlay = (play) => {
    showToast(`Running ${play.workflow_name} on ${play.account_name}`, 'success');
    navigate(`/account/${play.account_id}?play=${play.workflow_id}`);
  };
  const handleOpenOutcome = (outcome) => navigate(`/account/${outcome.account_id}`);

  // Greeting digest
  const playMatchCount = playRankedAccounts?.length ?? 0;
  const playBookCount = playRankedAccounts?.filter((r) => r.isBookAccount).length ?? 0;
  const playWsCount = playMatchCount - playBookCount;
  const [pinsModalOpen, setPinsModalOpen] = useState(false);

  // Add-to-book — runs governance-aware addition from a whitespace row
  const handleAddToBook = (account) => {
    if (!isAgentAccessEnabled('salesforce')) {
      // Auto-enable for demo simplicity; in real product, surface modal
      setIntegrationGovernance('salesforce', { agentAccess: true });
    }
    markAccountAdded(personaId, account.id);
    showToast(`${account.name} added to your book`, 'success');
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      {/* Greeting */}
      <div className="mb-6">
        <div className="text-xs text-text-muted mb-1">Today · {tenant.name}</div>
        <h1 className="text-2xl font-semibold tracking-tight">Good morning, {persona.name.split(' ')[0]}.</h1>
        <p className="text-sm text-text-secondary mt-1">
          {activePlay ? (
            <>
              Running play <span className={`font-semibold ${activeOffering?.textColor || 'text-text-primary'}`}>{activePlay.name}</span>
              . <span className="font-semibold text-text-primary">{playMatchCount}</span> matching account{playMatchCount === 1 ? '' : 's'}
              {playWsCount > 0 && (
                <span className="text-text-muted">
                  {' '}· <span className="text-text-primary font-semibold">{playBookCount}</span> in book + <span className="text-violet-700 dark:text-violet-300 font-semibold">{playWsCount}</span> whitespace
                </span>
              )}
              .{counts.awaiting > 0 && (
                <span className="text-text-muted">{' '}{counts.awaiting} also waiting on you.</span>
              )}
            </>
          ) : counts.awaiting > 0 ? (
            <>
              <span className="font-semibold text-text-primary">
                {counts.awaiting} thing{counts.awaiting === 1 ? '' : 's'} waiting on you
              </span>
              {counts.checkpoints > 0 && (
                <span className="text-text-muted">
                  {' · '}{counts.checkpoints} checkpoint{counts.checkpoints === 1 ? '' : 's'} to approve
                </span>
              )}
              . Pick a play below to surface accounts across your book + whitespace.
            </>
          ) : (
            <>Pick a play below to surface accounts across your book + whitespace.</>
          )}
        </p>
      </div>

      {/* Plays filter chip strip */}
      <PlaysFilterBar
        pinnedPlays={pinnedPlays}
        activePlayId={activePlayId}
        playCounts={playCounts}
        onSelectPlay={setActivePlay}
        onClear={() => setActivePlay(null)}
        onManagePins={() => setPinsModalOpen(true)}
      />

      {/* Awaiting You */}
      <AwaitingYouSection
        checkpoints={pendingCheckpoints}
        plays={triggeredPlays}
        onApprove={handleApprove}
        onOpenCheckpoint={handleOpenCheckpoint}
        onRunPlay={handleRunPlay}
        onOpenAccount={(p) => navigate(`/account/${p.account_id}`)}
      />

      {/* Play results — book + whitespace combined */}
      {activePlay ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted inline-flex items-center gap-2">
              <Wand2 size={11} className="text-primary" />
              {activePlay.name} · matching accounts
              {activeOffering && (
                <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${activeOffering.bg} ${activeOffering.textColor} normal-case`}>
                  {activeOffering.name}
                </span>
              )}
            </h2>
            <span className="text-[10px] text-text-muted">
              {playBookCount} book · {playWsCount} whitespace
            </span>
          </div>
          {playMatchCount === 0 ? (
            <div className="bg-surface border border-dashed border-border rounded-md p-8 text-center">
              <Layers size={18} className="mx-auto mb-2 text-text-muted" />
              <div className="text-sm font-semibold text-text-primary mb-1">No accounts match {activePlay.name}</div>
              <p className="text-xs text-text-secondary mb-3 max-w-md mx-auto leading-relaxed">
                The trigger conditions are too tight against your current book + whitespace. Ask Priya to
                loosen the play, or pick a different one.
              </p>
              <button onClick={() => setActivePlay(null)} className="text-xs text-primary hover:underline">
                Show all accounts
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {playRankedAccounts.map((entry, i) => (
                <PlayMatchCard
                  key={entry.account.id}
                  account={entry.account}
                  isBookAccount={entry.isBookAccount}
                  play={activePlay}
                  firingSignals={entry.firingSignals}
                  score={entry.score}
                  onOpen={handleOpen}
                  onAddToBook={handleAddToBook}
                  onRunWorkflow={(workflowId) => navigate(`/account/${entry.account.id}?play=${workflowId}&offering=${activePlay.offering_id}`)}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted inline-flex items-center gap-2">
              <Sparkles size={11} className="text-primary" />
              Top accounts this week
            </h2>
            <span className="text-[10px] text-text-muted">{noPlayTopAccounts.length} accounts</span>
          </div>
          <div className="space-y-2">
            {noPlayTopAccounts.map((a, i) => (
              <ProvenanceAccountCard
                key={a.id}
                account={a}
                lensOfferingId="all"
                onOpen={handleOpen}
                onAction={handleAction}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

      <ManagePinsModal
        open={pinsModalOpen}
        personaId={personaId}
        role={persona.salesRole}
        currentPinned={pinnedPlays.map((p) => p.id)}
        onClose={() => setPinsModalOpen(false)}
        onSave={(ids) => {
          setPinnedPlayIds(personaId, ids);
          setPinsModalOpen(false);
          showToast(ids == null ? 'Reset to admin default pins' : `Pinned ${ids.length} plays`, 'success');
        }}
      />

      {/* Recent outcomes */}
      <RecentOutcomesSection outcomes={recentOutcomes} onOpen={handleOpenOutcome} />

      {/* Full book by stage */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted inline-flex items-center gap-2">
            <Target size={11} className="text-primary" />
            My book · {accounts.length} accounts
            {filteredBook.length !== accounts.length && (
              <span className="text-text-secondary normal-case font-normal"> · {filteredBook.length} matching</span>
            )}
          </h2>
          <button onClick={() => navigate('/workbench')} className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
            <Plus size={10} /> Add accounts via Opportunity Finder
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-bg/40 border border-border rounded text-xs flex-1 max-w-xs">
            <Search size={11} className="text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search accounts or industry…"
              className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter size={10} className="text-text-muted" />
            {[
              { id: 'all', label: 'All' },
              { id: 'with_signals', label: 'With signals' },
              { id: 'a_tier', label: 'A-tier' },
              { id: 'bfs', label: 'BFS only' },
              { id: 'no_touch', label: 'Stale > 14d' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setBookFilter(f.id)}
                className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                  bookFilter === f.id ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-bg/40 border-border text-text-secondary hover:border-border-2'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <StageColumn stage="pipeline" accounts={grouped.pipeline} onOpen={handleOpen} />
          <StageColumn stage="active" accounts={grouped.active} onOpen={handleOpen} />
          <StageColumn stage="customer" accounts={grouped.customer} onOpen={handleOpen} />
          <StageColumn stage="renewal" accounts={grouped.renewal} onOpen={handleOpen} />
        </div>
      </div>

      {/* Workbook entry point */}
      <div className="mb-4 bg-gradient-to-r from-primary/5 to-violet-500/5 border border-primary/20 rounded-md p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center flex-shrink-0">
              <TableIcon size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-text-primary mb-0.5 flex items-center gap-2">
                Want to explore your book?
                <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                  Enrichable
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
                Open the workbook view to see all {accounts.length} accounts as a table.
                Ask anything across rows using HG&rsquo;s RGIF data — installs, IT spend, intent, fit
                — and save your filters + AI-enriched columns as a view.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/workbook')}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-primary to-violet-500 text-white rounded-md hover:opacity-90 transition-opacity"
          >
            Open workbook
            <ArrowRight size={11} />
          </button>
        </div>
      </div>

      {/* Pipeline-building */}
      <div className="bg-surface border border-border rounded-md p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-semibold text-text-primary inline-flex items-center gap-1.5">
              <Compass size={11} className="text-primary" />
              Need more accounts?
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">
              Pipeline-building plays surface new high-fit accounts that aren&rsquo;t yet in your book.
            </div>
          </div>
          <button onClick={() => navigate('/workbench')} className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
            See all plays <ArrowRight size={10} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/workbench')}
            className="text-left p-3 border border-border rounded-md hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileSearch size={13} className="text-primary" />
              <span className="text-xs font-semibold text-text-primary">Opportunity Finder</span>
              <ArrowRight size={10} className="text-text-muted ml-auto group-hover:text-primary" />
            </div>
            <div className="text-[11px] text-text-muted">
              Top 20 accounts matching {tenant.name}&rsquo;s ICP, ranked by intent surge × competitor overlap.
            </div>
          </button>
          <button
            onClick={() => navigate('/workbench')}
            className="text-left p-3 border border-border rounded-md hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Target size={13} className="text-primary" />
              <span className="text-xs font-semibold text-text-primary">Market Analysis</span>
              <ArrowRight size={10} className="text-text-muted ml-auto group-hover:text-primary" />
            </div>
            <div className="text-[11px] text-text-muted">
              Size your market — TAM/SAM/SOM, pre-filled from your ICP. Identify whitespace pools.
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
