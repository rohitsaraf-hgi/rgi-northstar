import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Globe,
  Activity,
  Clock,
  Building2,
  Users as UsersIcon,
  FileText,
  Compass,
  MessageSquare,
  Mail,
  Layers,
  ListChecks,
  Crown,
  ChevronRight,
  ExternalLink,
  Plus,
  Send,
  AlertTriangle,
  Cloud,
  Swords,
  CheckCircle2,
  Lightbulb,
  CircleSlash2,
  MinusCircle,
} from 'lucide-react';
import { getAccountById, ACCOUNT_STAGES, SIGNAL_TYPES, togglePinned, getPinnedAccountIds } from '../data/accounts.js';
import { Pin, Package, ChevronDown, Wand2, Search, Save, ArrowRight, FileStack, Swords as SwordsIcon, BarChart3, X } from 'lucide-react';
import { getArtifactsForAccount, getArtifactCountForAccount, ARTIFACT_KINDS } from '../data/accountArtifacts.js';
import { useTenant } from '../context/TenantContext.jsx';
import { usePersona } from '../context/PersonaContext.jsx';
import { getAgentConfig, getPlaybookConfig, subscribeAdminConfig } from '../data/adminConfig.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAIThinking } from '../context/AIThinkingContext.jsx';
import { listOfferings, getOffering } from '../data/offerings.js';
import { getFitFor, getAllFitFor, tierForScore, bestOfferingFor } from '../data/accountOfferingFit.js';
import { getHgIntelligence, OFFERING_CODES, resolveAccountOverview } from '../data/hgIntelligence.js';
import { workflowsForOffering, listWorkflows } from '../data/workflows.js';
import { listSignals } from '../data/signals.js';
import { analyzeAccountCoverage, PRIORITY_TREATMENTS, getAccountStakeholders } from '../data/buyingCommittees.js';
import { composeOfferingEmail } from '../data/offeringEmailTemplates.js';
import { readFilterState } from '../data/sellerHomeFilters.js';
import { getWhitespaceAccount } from '../data/whitespaceAccounts.js';
import { findLookalikes } from '../data/lookalike.js';
import { saveCurrentAsNewView, readViews } from '../data/workbookViews.js';
import {
  parseAgentInvocation,
  buildAgentTurn,
  planAgentRun,
  approveAgentTurn,
  discardAgentTurn,
} from '../lib/agentEngine.js';
import ConversationInput from '../components/thread/ConversationInput.jsx';
import ConversationTurn from '../components/thread/ConversationTurn.jsx';
import LiveAccountBriefV2 from '../components/thread/live/LiveAccountBriefV2.jsx';
import { CONVERSATIONS, AI_RESPONSE_TEMPLATES } from '../data/conversations.js';

const SIGNAL_ICONS = { intent_surge: TrendingUp, web_event: Globe, crm_activity: Activity, no_touch: Clock };
const MEDDIC_ICONS = { Confirmed: CheckCircle2, Inferred: Lightbulb, Partial: MinusCircle, Unknown: CircleSlash2 };

function StageBadge({ stage }) {
  const cfg = ACCOUNT_STAGES[stage];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border} text-[10px]`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ----- Offering lens chip + dropdown -----

function OfferingLensChip({ accountId, currentOfferingId, onChange }) {
  const [open, setOpen] = useState(false);
  const offerings = listOfferings();
  const allFits = getAllFitFor(accountId);

  const isAll = currentOfferingId === 'all';
  const current = isAll ? null : getOffering(currentOfferingId);
  const currentFit = isAll ? null : getFitFor(accountId, currentOfferingId);
  const tier = currentFit?.score != null ? tierForScore(currentFit.score) : null;
  const sortedOfferings = [...offerings].sort((a, b) => (allFits[b.id]?.score ?? 0) - (allFits[a.id]?.score ?? 0));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors text-xs ${
          current
            ? `${current.bg} ${current.textColor} ${current.borderColor}`
            : 'bg-primary/10 text-primary border-primary/30'
        }`}
        title="Offering lens — drives plays, drafts, stakeholders"
      >
        <Package size={11} />
        <span className="font-semibold">{current ? current.name : 'All offerings'}</span>
        {tier && (
          <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-1 py-0.5 rounded ${tier.bg} ${tier.color} ${tier.border} border`}>
            {tier.label} {currentFit.score}
          </span>
        )}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-surface border border-border rounded-md shadow-card z-30 w-80">
          <div className="px-3 py-2 border-b border-border bg-bg/40">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Choose offering lens</div>
            <div className="text-[10px] text-text-muted mt-0.5">
              Lens drives plays, drafts, signals, and stakeholders shown for this account.
            </div>
          </div>
          <button
            onClick={() => {
              onChange('all');
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 hover:bg-surface-2 flex items-center gap-2 transition-colors ${
              isAll ? 'bg-primary/5' : ''
            }`}
          >
            <Package size={12} className="text-primary" />
            <span className="text-xs font-semibold text-text-primary flex-1">All offerings</span>
            {isAll && <span className="text-[10px] uppercase tracking-wider font-bold text-primary">Current</span>}
          </button>
          <div className="divide-y divide-border/40">
            {sortedOfferings.map((o) => {
              const fit = allFits[o.id];
              const t = fit?.score != null ? tierForScore(fit.score) : null;
              const isCurrent = o.id === currentOfferingId;
              return (
                <button
                  key={o.id}
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-surface-2 flex items-center gap-2 transition-colors ${
                    isCurrent ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded ${o.bg} flex items-center justify-center flex-shrink-0`}>
                    <Package size={11} className={o.textColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-text-primary truncate">{o.name}</div>
                    <div className="text-[10px] text-text-muted truncate">{o.fullName}</div>
                  </div>
                  {t && (
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${t.bg} ${t.color} ${t.border} border`}>
                      {t.label} {fit.score}
                    </span>
                  )}
                  {isCurrent && <span className="text-[10px] uppercase tracking-wider font-bold text-primary">·</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FAIPill({ label, value }) {
  return (
    <div className="px-2.5 py-1.5 bg-bg/40 border border-border rounded">
      <div className="text-[9px] uppercase tracking-wider text-text-muted font-semibold">{label}</div>
      <div className="text-xs font-semibold text-text-primary">{value}</div>
    </div>
  );
}

function SignalRow({ signal, onRunPlay }) {
  const Icon = SIGNAL_ICONS[signal.type] || Sparkles;
  const cfg = SIGNAL_TYPES[signal.type];
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-border/60 last:border-0">
      <div className={`w-7 h-7 rounded ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon size={12} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-text-primary">{signal.headline}</span>
          <span className="text-[10px] text-text-muted">{signal.daysAgo}d ago</span>
          <span className={`text-[9px] uppercase tracking-wider font-bold ${cfg.color}`}>{cfg.label}</span>
          {signal.strength === 'high' && (
            <span className="text-[9px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300">High</span>
          )}
        </div>
        <div className="text-[11px] text-text-secondary leading-snug mt-0.5">{signal.detail}</div>
        {signal.suggestedPlay && (
          <button
            onClick={() => onRunPlay(signal.suggestedPlay)}
            className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary text-[11px] rounded hover:bg-primary/20"
          >
            <Sparkles size={9} /> {signal.suggestedPlayLabel || `Run @${signal.suggestedPlay}`}
          </button>
        )}
      </div>
    </div>
  );
}

function MeddicGauge({ meddic }) {
  const pct = Math.round(((meddic.confirmed + meddic.inferred * 0.6 + meddic.partial * 0.3) / meddic.total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-bg/60 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-mono text-text-primary">{meddic.confirmed}/{meddic.total} confirmed</span>
    </div>
  );
}

// ===== TAB CONTENT COMPONENTS =====
// ----- Why this offering card -----

function WhyOfferingCard({ account, offeringId, onChangeLens }) {
  const offering = getOffering(offeringId);
  const fit = getFitFor(account.id, offeringId);
  if (!offering || fit.score == null) return null;
  const tier = tierForScore(fit.score);
  return (
    <div className={`bg-surface border ${offering.borderColor} rounded-md p-4`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-md ${offering.bg} flex items-center justify-center flex-shrink-0`}>
          <Package size={16} className={offering.textColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] uppercase tracking-wider font-bold ${offering.textColor}`}>
              {offering.name} fit
            </span>
            <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${tier.bg} ${tier.color} ${tier.border} border`}>
              Tier {tier.label} · {fit.score}
            </span>
            <span className="text-[10px] text-text-muted">·</span>
            <button
              onClick={onChangeLens}
              className="text-[10px] text-primary hover:underline"
            >
              Switch lens
            </button>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
            Why this for {account.name}
          </div>
          <ul className="space-y-1">
            {fit.reasons.map((r, i) => (
              <li key={i} className={`flex items-start gap-1.5 text-xs text-text-secondary leading-snug`}>
                <span className={`mt-1 ${offering.textColor}`}>·</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function OtherOfferingFitsCard({ accountId, currentOfferingId, onChangeLens }) {
  const allFits = getAllFitFor(accountId);
  const others = Object.entries(allFits)
    .filter(([oid]) => oid !== currentOfferingId)
    .map(([oid, fit]) => ({ ...fit, offering: getOffering(oid) }))
    .filter((e) => e.offering && (e.score ?? 0) >= 50)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  if (others.length === 0) return null;

  return (
    <div className="bg-bg/40 border border-dashed border-border rounded-md p-3">
      <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
        This account also fits
      </div>
      <div className="space-y-1.5">
        {others.map((e) => {
          const tier = tierForScore(e.score);
          return (
            <button
              key={e.offering.id}
              onClick={() => onChangeLens(e.offering.id)}
              className="w-full flex items-center gap-2 text-left hover:bg-surface-2 px-1.5 py-1 rounded transition-colors"
            >
              <Package size={10} className={e.offering.textColor} />
              <span className="text-xs font-medium text-text-primary flex-1 truncate">{e.offering.name}</span>
              <span className={`text-[10px] uppercase tracking-wider font-bold px-1 py-0.5 rounded ${tier.bg} ${tier.color}`}>
                {tier.label} {e.score}
              </span>
              <ChevronRight size={9} className="text-text-muted" />
            </button>
          );
        })}
      </div>
      <div className="text-[10px] text-text-muted mt-2 leading-snug">
        Pivot lens to see signals + plays + stakeholders tailored to a different offering.
      </div>
    </div>
  );
}

function offeringFilterSignals(signals, offeringId) {
  if (!offeringId || offeringId === 'all') return signals;
  // Find platform-defined signals where relevant_offerings includes this offering.
  // For account-level signals (sig.headline-based), we match on keywords.
  const offering = getOffering(offeringId);
  if (!offering) return signals;
  const keywords = [
    offeringId.toLowerCase(),
    ...(offering.intentTopics || []).map((t) => t.toLowerCase()),
    ...(offering.competitors || []).map((c) => c.toLowerCase()),
    ...(offering.complementaryTech || []).map((c) => c.toLowerCase()),
  ];
  return signals.filter((s) => {
    const text = `${s.headline || ''} ${s.detail || ''}`.toLowerCase();
    return keywords.some((kw) => text.includes(kw));
  });
}

function recommendedPlaysForOffering(offeringId) {
  // Pull workflows that match this offering (offering_id === offeringId OR 'all').
  const workflows = workflowsForOffering(offeringId);
  // Prioritize offering-specific over generic 'all'.
  const specific = workflows.filter((w) => w.offering_id === offeringId);
  const generic = workflows.filter((w) => w.offering_id === 'all');
  return [...specific, ...generic].slice(0, 4);
}

// ----- Lookalikes drawer — Phase 12 -----

function LookalikesDrawer({ open, sourceAccount, onClose, onSaveAsList, onOpenAccount }) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [listName, setListName] = useState('');

  useEffect(() => {
    if (!open || !sourceAccount) return;
    setLoading(true);
    setListName(`Like ${sourceAccount.name}`);
    setResults([]);
    // Simulate agent thinking
    const t = setTimeout(() => {
      const r = findLookalikes(sourceAccount, { limit: 10 });
      setResults(r);
      setLoading(false);
    }, 700);
    return () => clearTimeout(t);
  }, [open, sourceAccount]);

  if (!open || !sourceAccount) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex justify-end">
      <motion.div
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full max-w-2xl bg-bg border-l border-border h-full overflow-y-auto thin-scrollbar shadow-elev"
      >
        <div className="sticky top-0 bg-bg/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-start gap-3 z-10">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center flex-shrink-0">
            <Search size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-base font-semibold text-text-primary">Find lookalikes</h2>
              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                HG universe
              </span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Whitespace accounts similar to <span className="font-semibold text-text-primary">{sourceAccount.name}</span> by
              industry, cloud, tech stack, size, intent, and best-fit offering.
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {loading ? (
            <div className="bg-surface border border-border rounded-md p-8 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.15s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.3s' }} />
              </div>
              <div className="text-xs text-text-secondary">Querying HG universe for similar accounts…</div>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-surface border border-dashed border-border rounded-md p-8 text-center">
              <Search size={18} className="mx-auto text-text-muted mb-2" />
              <div className="text-sm font-semibold text-text-primary mb-1">No strong lookalikes</div>
              <div className="text-[11px] text-text-secondary">Try a different source account.</div>
            </div>
          ) : (
            <>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                {results.length} matches · ranked by similarity score
              </div>
              {results.map((r) => (
                <div
                  key={r.account.id}
                  className="bg-surface border border-border rounded-md p-3 hover:border-primary/30 transition-colors"
                >
                  <button
                    onClick={() => onOpenAccount(r.account)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                        style={{ background: r.account.logoColor }}
                      >
                        {r.account.name.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-text-primary truncate flex-1">{r.account.name}</span>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Similarity</span>
                      <span
                        className={`text-[12px] font-mono font-semibold ${
                          r.score >= 75 ? 'text-emerald-700 dark:text-emerald-300' : r.score >= 55 ? 'text-sky-700 dark:text-sky-300' : 'text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {r.score}
                      </span>
                    </div>
                    <div className="text-[10px] text-text-muted truncate ml-9 mb-1">
                      {r.account.industry} · {r.account.fai?.hq} · {r.account.cloud}
                    </div>
                    {r.reasons.length > 0 && (
                      <div className="ml-9 flex flex-wrap gap-1">
                        {r.reasons.slice(0, 4).map((reason, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/5 border border-violet-500/20 text-violet-700 dark:text-violet-300"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Breakdown bar */}
                    <div className="mt-2 ml-9 flex items-center gap-0.5 h-1.5 bg-bg/60 rounded-full overflow-hidden">
                      {r.breakdown.map((b, i) => (
                        <div
                          key={i}
                          className="h-full"
                          style={{
                            width: `${b.points}%`,
                            background:
                              b.dim === 'industry'
                                ? '#3b7ff5'
                                : b.dim === 'cloud'
                                ? '#10b981'
                                : b.dim === 'stack'
                                ? '#8b5cf6'
                                : b.dim === 'size'
                                ? '#f59e0b'
                                : b.dim === 'intent'
                                ? '#ec4899'
                                : '#0ea5e9',
                            opacity: b.points > 0 ? 0.9 : 0.15,
                          }}
                          title={`${b.dim}: ${b.points} pts — ${b.label}`}
                        />
                      ))}
                    </div>
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Save as list footer */}
        {!loading && results.length > 0 && (
          <div className="sticky bottom-0 bg-bg/95 backdrop-blur-sm border-t border-border px-5 py-3">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
              Save these accounts as a whitespace list
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs bg-surface border border-border rounded text-text-primary focus:border-primary/40 focus:outline-none"
                placeholder="List name…"
              />
              <button
                onClick={() => onSaveAsList(listName, results)}
                disabled={!listName.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save size={11} />
                Save as workbook view
              </button>
            </div>
            <div className="text-[10px] text-text-muted mt-1.5">
              Opens in /workbook as a whitespace view, pre-filtered to these accounts.
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Account Card v2 — Overview
//
// Spec source: /docs — Account Card Overview.
// The rep opening an account is answering three questions:
//   1. Is now the moment?     → Why Now (narrative + trigger chips)
//   2. Do I believe it?       → Key Highlights (3–5 signal tiles)
//   3. What do I do?          → Lead With (offering + entry + opener)
//                                + Co-sell Follow-on (secondary)
//
// Sections render conditionally — an account without triggers hides
// Why Now, an account without pain hides Pain Points, etc. The old
// "AI intelligence is generating" empty state stays for accounts with
// no intelligence record at all.
// ────────────────────────────────────────────────────────────────────

function ConfidenceChip({ confidence }) {
  const map = {
    high:   { color: 'bg-emerald-500', label: 'High confidence' },
    medium: { color: 'bg-amber-500',   label: 'Medium confidence' },
    low:    { color: 'bg-rose-500',    label: 'Low confidence' },
  };
  const cfg = map[confidence] || map.medium;
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] text-text-muted">
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.color}`} />
      {cfg.label}
    </span>
  );
}

const TRIGGER_KIND_STYLE = {
  tech_change:     { bg: 'bg-sky-500/10',     text: 'text-sky-700 dark:text-sky-300',         border: 'border-sky-500/30' },
  news:            { bg: 'bg-violet-500/10',  text: 'text-violet-700 dark:text-violet-300',   border: 'border-violet-500/30' },
  funding:         { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/30' },
  hiring:          { bg: 'bg-amber-500/10',   text: 'text-amber-700 dark:text-amber-300',     border: 'border-amber-500/30' },
  intent:          { bg: 'bg-rose-500/10',    text: 'text-rose-700 dark:text-rose-300',       border: 'border-rose-500/30' },
  spend_delta:     { bg: 'bg-amber-500/10',   text: 'text-amber-700 dark:text-amber-300',     border: 'border-amber-500/30' },
  competitor_move: { bg: 'bg-rose-500/10',    text: 'text-rose-700 dark:text-rose-300',       border: 'border-rose-500/30' },
  derived:         { bg: 'bg-primary/8',      text: 'text-text-secondary',                     border: 'border-border' },
};

function TriggerChip({ trigger }) {
  const s = TRIGGER_KIND_STYLE[trigger.kind] || TRIGGER_KIND_STYLE.derived;
  return (
    <span
      className={`inline-flex items-center text-[10.5px] font-medium px-2 py-0.5 rounded border ${s.bg} ${s.text} ${s.border}`}
      title={trigger.detectedAt || undefined}
    >
      {trigger.label}
    </span>
  );
}

function WhyNowSection({ accountName, whyNow }) {
  if (!whyNow) return null;
  return (
    <div className="bg-gradient-to-br from-violet-500/5 via-primary/5 to-emerald-500/5 border border-violet-500/30 rounded-md p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-violet-500/15 flex items-center justify-center flex-shrink-0">
          <Sparkles size={16} className="text-violet-700 dark:text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="text-[10px] uppercase tracking-wider font-bold text-violet-700 dark:text-violet-300">
              Why now · {accountName}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {whyNow.freshness && (
                <span className="text-[10.5px] text-text-muted">{whyNow.freshness}</span>
              )}
              <ConfidenceChip confidence={whyNow.confidence} />
            </div>
          </div>
          <p className="text-[13px] text-text-secondary leading-relaxed">{whyNow.narrative}</p>
          {Array.isArray(whyNow.triggers) && whyNow.triggers.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted mr-0.5">
                Triggered by
              </span>
              {whyNow.triggers.map((t) => (
                <TriggerChip key={t.id} trigger={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadWithSection({ leadWith, coSell, onChangeLens, onCopyOpener, onRegenerateOpener }) {
  if (!leadWith) return null;
  const leadOffering = leadWith.offering;
  const nextOffering = coSell?.offering;
  return (
    <div className={`grid gap-2 ${coSell ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
      {/* Lead With — primary card */}
      <div className="bg-surface border-2 border-primary/30 rounded-md p-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10px] uppercase tracking-wider font-bold text-primary inline-flex items-center gap-1.5">
            <Crown size={11} />
            Lead with
          </div>
          {leadOffering && onChangeLens && (
            <button
              onClick={() => onChangeLens(leadOffering.id)}
              className="inline-flex items-center gap-1 text-[10.5px] text-primary hover:underline font-semibold"
            >
              Open lens <ArrowRight size={9} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          {leadOffering && (
            <span className={`w-5 h-5 rounded ${leadOffering.bg || 'bg-primary/10'} flex items-center justify-center flex-shrink-0`}>
              <Package size={11} className={leadOffering.textColor || 'text-primary'} />
            </span>
          )}
          <span className="text-[14px] font-semibold text-text-primary truncate">
            {leadWith.offeringName}
          </span>
        </div>
        {leadWith.entryPoint && (
          <div className="text-[11px] text-text-secondary leading-snug mb-2">
            Entry point: <span className="font-medium text-text-primary">{leadWith.entryPoint}</span>
          </div>
        )}
        {leadWith.rationaleLine && (
          <div className="text-[11.5px] text-text-secondary italic leading-snug mb-2.5">
            {leadWith.rationaleLine}
          </div>
        )}
        {leadWith.opener && (
          <div className="mt-2 pt-2.5 border-t border-border/60">
            <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1 flex items-center justify-between">
              <span>Opener you can say</span>
              <span className="flex items-center gap-2">
                <button
                  onClick={() => onCopyOpener?.(leadWith.opener)}
                  className="text-[10px] font-semibold text-text-muted hover:text-primary transition-colors"
                >
                  Copy
                </button>
                <button
                  onClick={onRegenerateOpener}
                  className="text-[10px] font-semibold text-text-muted hover:text-primary transition-colors"
                >
                  Regenerate
                </button>
              </span>
            </div>
            <div className="text-[12px] text-text-primary leading-relaxed font-medium">
              {leadWith.opener}
            </div>
          </div>
        )}
      </div>

      {/* Co-sell follow-on — secondary card */}
      {coSell && (
        <div className="bg-surface border border-border rounded-md p-3.5">
          <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1.5 inline-flex items-center gap-1.5">
            {coSell.type === 'expansion' ? 'Expansion follow-on' : 'Co-sell follow-on'}
            <span
              className={`text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded border ${
                coSell.type === 'expansion'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
              }`}
            >
              {coSell.type === 'expansion' ? 'Expand' : 'Co-sell'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            {nextOffering && (
              <span className={`w-5 h-5 rounded ${nextOffering.bg || 'bg-primary/10'} flex items-center justify-center flex-shrink-0`}>
                <Package size={11} className={nextOffering.textColor || 'text-primary'} />
              </span>
            )}
            <span className="text-[13px] font-semibold text-text-primary truncate">
              {coSell.offeringName}
            </span>
          </div>
          {coSell.rationaleLine && (
            <div className="text-[11px] text-text-secondary leading-snug">
              {coSell.rationaleLine}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KeyHighlightsSection({ highlights }) {
  if (!Array.isArray(highlights) || highlights.length === 0) return null;
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Lightbulb size={12} className="text-primary" />
        <h3 className="text-xs uppercase tracking-wider font-semibold text-text-secondary">
          Key highlights
        </h3>
        <span className="text-[10.5px] text-text-muted">· evidence for the wedge</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {highlights.map((h) => (
          <div key={h.id} className="p-3 rounded border border-border bg-bg/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[9.5px] uppercase tracking-wider font-bold text-text-muted truncate">
                {h.category}
              </span>
              {h.magnitude && (
                <span className="text-[10px] font-mono font-semibold text-primary flex-shrink-0">
                  {h.magnitude}
                </span>
              )}
            </div>
            <div className="text-[12.5px] font-semibold text-text-primary leading-snug mb-0.5">
              {h.headline}
            </div>
            <div className="text-[11px] text-text-secondary leading-relaxed">{h.detail}</div>
          </div>
        ))}
      </div>
      {highlights.length < 3 && (
        <div className="mt-2 text-[10.5px] text-text-muted italic">
          HG is still gathering signal on this account — additional highlights will appear as data lands.
        </div>
      )}
    </div>
  );
}

function PainPointsSection({ accountName, painPoints, offeringLookup }) {
  if (!Array.isArray(painPoints) || painPoints.length === 0) return null;
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <AlertTriangle size={12} className="text-amber-700 dark:text-amber-300" />
        <h3 className="text-xs uppercase tracking-wider font-semibold text-text-secondary">
          Pain points {accountName} is facing
        </h3>
        <span className="text-[10.5px] text-text-muted">· tagged by offering that addresses it</span>
      </div>
      <ul className="space-y-1.5">
        {painPoints.map((p, i) => (
          <li key={i} className="flex items-start gap-2 text-[12px] text-text-secondary leading-snug">
            <span className="text-amber-700 dark:text-amber-300 mt-0.5">·</span>
            <span className="flex-1 min-w-0">
              {p.text}
              {Array.isArray(p.addressedBy) && p.addressedBy.length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 flex-wrap">
                  {p.addressedBy.map((code) => {
                    const offering = offeringLookup(code);
                    if (!offering) return null;
                    const shortName = offering.name.replace(/^Wiz\s+/i, '');
                    return (
                      <span
                        key={code}
                        className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${offering.bg || 'bg-primary/10'} ${offering.textColor || 'text-primary'}`}
                      >
                        {shortName}
                      </span>
                    );
                  })}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NextActionsSection({ onFindLookalikes, onDraftOutreach, onGoToContacts, accountName }) {
  return (
    <div className="bg-surface border border-border rounded-md p-3">
      <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-2">
        Suggested next actions
      </div>
      <div className="flex flex-wrap gap-2">
        {onDraftOutreach && (
          <button
            onClick={onDraftOutreach}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded hover:bg-primary-dim transition-colors"
          >
            <Mail size={11} /> Draft outreach <ArrowRight size={10} className="opacity-70" />
          </button>
        )}
        {onFindLookalikes && (
          <button
            onClick={onFindLookalikes}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface text-text-secondary border border-border hover:border-primary/40 hover:text-primary rounded transition-colors"
          >
            <Wand2 size={11} /> Find accounts like {accountName} <ArrowRight size={10} className="opacity-70" />
          </button>
        )}
        {onGoToContacts && (
          <button
            onClick={onGoToContacts}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface text-text-secondary border border-border hover:border-primary/40 hover:text-primary rounded transition-colors"
          >
            <UsersIcon size={11} /> Book stakeholder intro <ArrowRight size={10} className="opacity-70" />
          </button>
        )}
      </div>
    </div>
  );
}

function OverviewTab({
  account,
  onChangeLens,
  onFindLookalikes,
  onDraftOutreach,
  onGoToContacts,
}) {
  const intel = getHgIntelligence(account.id);
  const toastCtx = useToast?.();

  // Resolve offerings — falls through OFFERING_CODES → offering.key →
  // offering.id so wizard-saved offerings resolve alongside legacy ids.
  const offerings = useMemo(() => listOfferings(), []);
  const resolveOfferingByCode = (code) => {
    if (!code) return null;
    const key = OFFERING_CODES?.[code]?.key;
    return (
      offerings.find((o) => o.key === key || o.id === key) ||
      offerings.find((o) => o.id === code) ||
      null
    );
  };
  const leadOffering = resolveOfferingByCode(intel?.lead?.code);
  const nextOffering = resolveOfferingByCode(intel?.next?.code);

  const overview = useMemo(
    () =>
      resolveAccountOverview({
        intel,
        account,
        leadOffering,
        nextOffering,
      }),
    [intel, account, leadOffering, nextOffering],
  );

  // No intelligence at all → show the empty state (same as before).
  if (!overview) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-md p-6 text-center text-[12px] text-text-muted">
        AI intelligence for this account is generating. Refresh in a moment, or run an Account Brief from the Account AI tab.
      </div>
    );
  }

  const handleCopyOpener = (text) => {
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    toastCtx?.showToast?.('Opener copied to clipboard');
  };
  const handleRegenerateOpener = () => {
    toastCtx?.showToast?.('Regeneration will hit the LLM in v2 — showing authored opener for the demo');
  };

  return (
    <div className="space-y-3">
      <WhyNowSection accountName={account.name} whyNow={overview.whyNow} />
      <LeadWithSection
        leadWith={overview.leadWith}
        coSell={overview.coSell}
        onChangeLens={onChangeLens}
        onCopyOpener={handleCopyOpener}
        onRegenerateOpener={handleRegenerateOpener}
      />
      <KeyHighlightsSection highlights={overview.highlights} />
      <PainPointsSection
        accountName={account.name}
        painPoints={overview.painPoints}
        offeringLookup={resolveOfferingByCode}
      />
      <NextActionsSection
        accountName={account.name}
        onFindLookalikes={onFindLookalikes}
        onDraftOutreach={onDraftOutreach}
        onGoToContacts={onGoToContacts}
      />
    </div>
  );
}

function ActivityTab({ account, turns }) {
  // Synthesized activity timeline: signals + thread turns + last touch + artifacts
  const items = useMemo(() => {
    const events = [];
    // Add signals as events
    (account.signals || []).forEach((s) => {
      events.push({ kind: 'signal', signal: s, daysAgo: s.daysAgo, id: s.id });
    });
    // Last touch
    if (account.lastTouch) {
      events.push({ kind: 'touch', detail: account.lastTouch, daysAgo: account.lastTouchDaysAgo, id: 'last-touch' });
    }
    // Thread turns (agent runs are interesting events)
    turns.filter((t) => t.role === 'agent' || t.artifact).forEach((t, i) => {
      events.push({ kind: 'agent_run', turn: t, daysAgo: 0, id: t.id });
    });
    return events.sort((a, b) => (a.daysAgo ?? 999) - (b.daysAgo ?? 999));
  }, [account, turns]);

  return (
    <div className="bg-surface border border-border rounded-md">
      <div className="px-4 py-3 border-b border-border">
        <div className="text-xs font-semibold text-text-primary">Activity timeline</div>
        <div className="text-[11px] text-text-muted mt-0.5">All signals, touches, and agent runs in chronological order.</div>
      </div>
      <div className="divide-y divide-border">
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-muted">No activity yet.</div>
        ) : (
          items.map((item) => {
            if (item.kind === 'signal') {
              const Icon = SIGNAL_ICONS[item.signal.type] || Sparkles;
              const cfg = SIGNAL_TYPES[item.signal.type];
              return (
                <div key={item.id} className="px-4 py-3 flex items-start gap-3">
                  <div className={`w-6 h-6 rounded ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={11} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-text-primary">{item.signal.headline}</span>
                      <span className="text-[10px] text-text-muted">{item.signal.daysAgo}d ago</span>
                    </div>
                    <div className="text-[11px] text-text-secondary leading-snug mt-0.5">{item.signal.detail}</div>
                  </div>
                </div>
              );
            }
            if (item.kind === 'touch') {
              return (
                <div key={item.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <UsersIcon size={11} className="text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-text-primary">Touchpoint</span>
                      <span className="text-[10px] text-text-muted">{item.daysAgo != null ? `${item.daysAgo}d ago` : '—'}</span>
                    </div>
                    <div className="text-[11px] text-text-secondary leading-snug mt-0.5">{item.detail}</div>
                  </div>
                </div>
              );
            }
            // agent_run
            return (
              <div key={item.id} className="px-4 py-3 flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={11} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-text-primary">Agent run</span>
                    <span className="text-[10px] text-text-muted">{item.turn.runId}</span>
                  </div>
                  <div className="text-[11px] text-text-secondary leading-snug mt-0.5">
                    {item.turn.playbookId || item.turn.agentId} → {item.turn.target}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function MeddicTab({ account, offeringId }) {
  const offering = offeringId && offeringId !== 'all' ? getOffering(offeringId) : null;
  // For demo, render a static summary that points to the brief for the editable table
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      {offering && (
        <div className={`mb-3 px-2.5 py-1.5 rounded-md border ${offering.borderColor} ${offering.bg} text-[11px] ${offering.textColor} inline-flex items-center gap-1.5`}>
          <Package size={10} />
          Currently exploring: <span className="font-semibold">{offering.name}</span>
          <span className="text-text-muted">·</span>
          <span className="text-text-muted">Competitor focus: {offering.competitors.slice(0, 2).join(', ')}</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-semibold text-text-primary">MEDDIC framework</div>
          <div className="text-[11px] text-text-muted mt-0.5">Auto-populated from upstream agents. Run Account Brief to refresh.</div>
        </div>
        <MeddicGauge meddic={account.meddic} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { letter: 'M', label: 'Metrics', status: account.meddic.confirmed >= 1 ? 'Confirmed' : 'Unknown' },
          { letter: 'E', label: 'Economic Buyer', status: account.meddic.confirmed >= 2 ? 'Confirmed' : 'Inferred' },
          { letter: 'D', label: 'Decision Criteria', status: account.meddic.confirmed >= 3 ? 'Confirmed' : 'Partial' },
          { letter: 'D', label: 'Decision Process', status: account.meddic.partial >= 1 ? 'Partial' : 'Unknown' },
          { letter: 'I', label: 'Identify Pain', status: account.meddic.confirmed >= 4 ? 'Confirmed' : 'Inferred' },
          { letter: 'C', label: 'Champion', status: account.meddic.unknown >= 1 ? 'Unknown' : 'Confirmed' },
        ].map((dim, i) => {
          const Icon = MEDDIC_ICONS[dim.status];
          const colorMap = {
            Confirmed: 'text-emerald-700 dark:text-emerald-300',
            Inferred: 'text-blue-700 dark:text-blue-300',
            Partial: 'text-amber-700 dark:text-amber-300',
            Unknown: 'text-text-muted',
          };
          return (
            <div key={i} className="flex items-center gap-2 p-2 bg-bg/40 border border-border rounded">
              <span className="font-mono text-sm font-bold text-text-primary w-5">{dim.letter}</span>
              <span className="text-xs text-text-secondary flex-1">{dim.label}</span>
              <Icon size={12} className={colorMap[dim.status]} />
              <span className={`text-[10px] uppercase tracking-wider font-bold ${colorMap[dim.status]}`}>{dim.status}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-border text-[11px] text-text-muted">
        <Sparkles size={9} className="inline text-primary mr-1" />
        Run <span className="font-mono">@account_brief</span> in the Chat tab to populate the full editable MEDDIC table.
      </div>
    </div>
  );
}

// Map a Plays-tab tile id to its admin-config gate. `account_brief` is a
// playbook (account-brief-flow); the rest are atomic agents whose ids match
// the tile id.
function isPlayAdminEnabled(playId, salesRole) {
  if (playId === 'account_brief') {
    const cfg = getPlaybookConfig('account-brief-flow');
    if (!cfg || cfg.status !== 'published') return false;
    if (salesRole && !cfg.audienceRoles.includes(salesRole)) return false;
    return true;
  }
  const cfg = getAgentConfig(playId);
  return !!cfg?.sellerVisible;
}

const ALL_PLAYS = [
  { id: 'account_brief', label: 'Account Brief', desc: '8-agent MEDDIC brief', icon: FileText, accent: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-500/10' },
  { id: 'email_draft', label: 'Email Draft', desc: 'Personalized outbound', icon: Mail, accent: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10' },
  { id: 'meeting_prep', label: 'Meeting Prep', desc: 'Pre-call briefing', icon: CheckCircle2, accent: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10' },
  { id: 'competitive_battlecard', label: 'Competitive Battlecard', desc: 'Positioning guide', icon: Swords, accent: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-500/10' },
  { id: 'value_hypothesis', label: 'Value Hypothesis', desc: 'ROI + value pillars', icon: TrendingUp, accent: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-500/10' },
  { id: 'follow_up_drafting', label: 'Follow-up Sequence', desc: '3-touch sequence', icon: MessageSquare, accent: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-500/10' },
];

function PlaysTab({ onRunPlay, runHistory, salesRole, offeringId, onChangeLens }) {
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeAdminConfig(() => setTick((t) => t + 1)), []);
  const visiblePlays = useMemo(() => {
    void tick;
    return ALL_PLAYS.filter((p) => isPlayAdminEnabled(p.id, salesRole));
  }, [tick, salesRole]);

  // Offering-tagged workflows from the Workflow Studio (workflows.js).
  const offeringWorkflows = useMemo(() => {
    const all = workflowsForOffering(offeringId);
    const specific = all.filter((w) => w.offering_id === offeringId);
    const generic = all.filter((w) => w.offering_id === 'all');
    return { specific, generic };
  }, [offeringId]);

  const activeOffering = offeringId && offeringId !== 'all' ? getOffering(offeringId) : null;

  return (
    <div className="space-y-3">
      {/* Offering lens filter strip */}
      <div className="bg-surface border border-border rounded-md p-3">
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Lens:</span>
          <button
            onClick={() => onChangeLens?.('all')}
            className={`px-2 py-1 rounded border transition-colors ${
              offeringId === 'all' || !offeringId
                ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                : 'bg-surface border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            All offerings
          </button>
          {listOfferings().map((o) => {
            const active = offeringId === o.id;
            const count = o.id === offeringId ? offeringWorkflows.specific.length : 0;
            return (
              <button
                key={o.id}
                onClick={() => onChangeLens?.(o.id)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                  active ? `${o.bg} ${o.textColor} ${o.borderColor}` : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                <Package size={9} />
                {o.name.replace('Wiz ', '')}
                {active && count > 0 && (
                  <span className="text-[10px] font-mono opacity-80">· {count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Offering-specific workflows (Workflow Studio) */}
      {activeOffering && offeringWorkflows.specific.length > 0 && (
        <div className="bg-surface border border-border rounded-md">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-xs font-semibold text-text-primary inline-flex items-center gap-1.5">
              <Sparkles size={11} className={activeOffering.textColor} />
              {activeOffering.name} — workflows
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">
              Offering-tagged workflows authored in Workflow Studio. Account context pre-fills.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-0">
            {offeringWorkflows.specific.map((w) => (
              <button
                key={w.id}
                onClick={() => onRunPlay(w.id)}
                className="text-left p-3 border-r border-b border-border last:border-r-0 hover:bg-bg/40 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded ${activeOffering.bg} flex items-center justify-center flex-shrink-0`}>
                    <Sparkles size={11} className={activeOffering.textColor} />
                  </div>
                  <span className="text-xs font-semibold text-text-primary">{w.name}</span>
                  <ChevronRight size={11} className="text-text-muted ml-auto group-hover:text-primary" />
                </div>
                <div className="text-[10px] text-text-muted ml-8 line-clamp-2">{w.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-md">
        <div className="px-4 py-3 border-b border-border">
          <div className="text-xs font-semibold text-text-primary">Available plays (legacy)</div>
          <div className="text-[11px] text-text-muted mt-0.5">
            {visiblePlays.length === ALL_PLAYS.length
              ? 'Generic plays — account context pre-fills, lens-agnostic.'
              : `${visiblePlays.length} of ${ALL_PLAYS.length} plays available · others hidden by your RevOps admin.`}
          </div>
        </div>
        {visiblePlays.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            No plays published for your role yet. Ask your admin to publish a playbook.
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-0">
          {visiblePlays.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => onRunPlay(p.id)}
                className="text-left p-3 border-r border-b border-border last:border-r-0 hover:bg-bg/40 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded ${p.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={12} className={p.accent} />
                  </div>
                  <span className="text-xs font-semibold text-text-primary">{p.label}</span>
                  <ChevronRight size={11} className="text-text-muted ml-auto group-hover:text-primary" />
                </div>
                <div className="text-[10px] text-text-muted ml-8">{p.desc}</div>
              </button>
            );
          })}
        </div>
        )}
      </div>

      {runHistory.length > 0 && (
        <div className="bg-surface border border-border rounded-md">
          <div className="px-4 py-3 border-b border-border text-xs font-semibold text-text-primary">
            Play history · {runHistory.length}
          </div>
          <div className="divide-y divide-border">
            {runHistory.map((r) => (
              <div key={r.id} className="px-4 py-2 flex items-center gap-2 text-xs">
                <Sparkles size={11} className="text-primary" />
                <span className="font-mono text-[11px] text-text-muted">{r.id}</span>
                <span className="text-text-primary font-medium">{r.label}</span>
                <span className="text-text-muted ml-auto text-[11px]">{r.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ----- Stakeholders tab — buying committee gap analysis per offering -----

function PriorityChip({ priority }) {
  const treatment = PRIORITY_TREATMENTS[priority];
  if (!treatment) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border ${treatment.bg} ${treatment.color} ${treatment.border}`}>
      {treatment.label}
    </span>
  );
}

function StakeholdersTab({ account, onRunPlay }) {
  // Contacts — show the list of known stakeholders for this account
  // (sourced from CRM) plus a "Discover new contacts" agentic CTA.
  // No offering-specific committee mapping here — that lives behind
  // the persona-discovery agent run.
  const stakeholders = useMemo(() => {
    try {
      return getAccountStakeholders(account.id) || [];
    } catch {
      return [];
    }
  }, [account.id]);

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-surface border border-border rounded-md p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <UsersIcon size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-text-primary mb-0.5">
              Contacts at {account.name}
            </h3>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Known stakeholders synced from your CRM.{' '}
              {stakeholders.length === 0
                ? 'No contacts yet — discover stakeholders with an agent run.'
                : `${stakeholders.length} contact${stakeholders.length === 1 ? '' : 's'} on file.`}
            </p>
          </div>
          {onRunPlay && (
            <button
              onClick={() => onRunPlay('persona-discovery-probe')}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary to-violet-500 text-white text-xs font-semibold rounded-md hover:opacity-90 shadow-card"
            >
              <Sparkles size={11} />
              Discover new contacts
            </button>
          )}
        </div>
      </div>

      {/* Contacts list */}
      {stakeholders.length > 0 ? (
        <div className="bg-surface border border-border rounded-md overflow-hidden">
          <div className="divide-y divide-border">
            {stakeholders.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-[11px] flex items-center justify-center font-semibold flex-shrink-0">
                  {(s.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-text-primary truncate">
                      {s.name}
                    </span>
                    {s.isChampion && (
                      <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-0.5">
                        <Crown size={8} /> Champion
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-text-secondary truncate">{s.title}</div>
                </div>
                <div className="text-[11px] text-text-muted font-mono flex-shrink-0 truncate max-w-[200px]">
                  {s.email}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-dashed border-border rounded-md p-8 text-center">
          <UsersIcon size={20} className="mx-auto text-text-muted/60 mb-2" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">No contacts in CRM yet</h3>
          <p className="text-[12px] text-text-secondary max-w-md mx-auto leading-relaxed mb-3">
            Discover key stakeholders at {account.name} by running the persona discovery agent. It pulls
            candidate contacts from HG's universe, scored against your offering's buying committee.
          </p>
          {onRunPlay && (
            <button
              onClick={() => onRunPlay('persona-discovery-probe')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-primary to-violet-500 text-white text-xs font-semibold rounded-md hover:opacity-90"
            >
              <Sparkles size={11} />
              Discover contacts with AI
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Map ARTIFACT_KINDS.tone → Tailwind classes (border + bg + text). Kept
// out of accountArtifacts.js so the data module stays presentation-free.
const ARTIFACT_TONE_CLS = {
  primary: 'bg-primary/10 text-primary border-primary/30',
  rose: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
  sky: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
};

const ARTIFACT_KIND_ICON = {
  BRIEF: FileText,
  BATTLECARD: SwordsIcon,
  ONE_PAGER: FileText,
  ROI: BarChart3,
  EMAIL: Mail,
  LOOKALIKE: Layers,
  STAKEHOLDER_MAP: UsersIcon,
};

function ArtifactPreviewDrawer({ artifact, onClose }) {
  if (!artifact) return null;
  const meta = ARTIFACT_KINDS[artifact.kind];
  const Icon = ARTIFACT_KIND_ICON[artifact.kind] || FileText;
  const toneCls = ARTIFACT_TONE_CLS[meta?.tone] || ARTIFACT_TONE_CLS.primary;
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-[640px] max-w-[95vw] bg-bg border-l border-border shadow-elev flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <Icon size={14} className="text-primary flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-text-primary truncate">{artifact.title}</div>
              <div className="text-[11px] text-text-muted truncate">
                {artifact.generatedBy} · {artifact.generatedAtLabel}{artifact.version ? ` · ${artifact.version}` : ''}
              </div>
            </div>
            <span className={`ml-2 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${toneCls}`}>
              {meta?.label || artifact.kind}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto thin-scrollbar px-6 py-5">
          <div
            className="artifact-content text-[13px] text-text-secondary leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-text-primary [&_h2]:mb-2 [&_h3]:text-[12px] [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:text-text-muted [&_h3]:mt-4 [&_h3]:mb-1.5 [&_p]:mb-2 [&_p.muted]:text-[11px] [&_p.muted]:text-text-muted [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_li]:mb-0.5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-text-primary [&_blockquote]:my-2 [&_strong]:text-text-primary"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: artifact.html || '<p class="muted">No preview available.</p>' }}
          />
        </div>
        <div className="border-t border-border bg-surface/40 px-5 py-3 flex items-center justify-end gap-2">
          <button className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary">
            Copy link
          </button>
          <button className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim">
            Open full view
          </button>
        </div>
      </div>
    </div>
  );
}

function ArtifactsTab({ account, turns }) {
  const [previewArtifact, setPreviewArtifact] = useState(null);

  // Merge: seeded per-account artifacts + chat-generated turns. Seeded
  // ones already have rich html; chat-generated ones get rendered as
  // simpler rows pointing back to the chat.
  const artifacts = useMemo(() => {
    const seeded = getArtifactsForAccount(account.id);
    const fromChat = turns
      .filter((t) => t.artifact)
      .map((t, i) => ({
        id: `chat-${t.id || i}`,
        kind: (t.artifact.kind || 'BRIEF').toUpperCase(),
        title: t.artifact.title || 'Chat artifact',
        description: t.artifact.meta || 'Generated from a chat turn',
        generatedBy: 'Account AI',
        generatedAtLabel: 'In this conversation',
        version: t.artifact.version || 'v1',
        html: t.artifact.html || null,
        _fromChat: true,
      }));
    return [...seeded, ...fromChat];
  }, [account.id, turns]);

  return (
    <>
      <div className="bg-surface border border-border rounded-md">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-text-primary">Artifacts</div>
            <div className="text-[11px] text-text-muted mt-0.5">
              Briefs, battlecards, one-pagers, and other AI outputs generated for {account.name}.
            </div>
          </div>
          <span className="text-[10px] text-text-muted">{artifacts.length} total</span>
        </div>
        {artifacts.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <FileStack size={20} className="mx-auto text-text-muted mb-2" />
            <div className="text-sm font-semibold text-text-primary mb-1">No artifacts yet</div>
            <div className="text-[11px] text-text-muted max-w-md mx-auto">
              Run an Account Brief, Battlecard, or One-pager from the Account AI tab and they'll
              show up here as a permanent history.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {artifacts.map((a) => {
              const meta = ARTIFACT_KINDS[a.kind] || ARTIFACT_KINDS.BRIEF;
              const Icon = ARTIFACT_KIND_ICON[a.kind] || FileText;
              const toneCls = ARTIFACT_TONE_CLS[meta?.tone] || ARTIFACT_TONE_CLS.primary;
              return (
                <button
                  key={a.id}
                  onClick={() => setPreviewArtifact(a)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-2 transition-colors text-left group"
                >
                  <div className={`w-8 h-8 rounded border flex items-center justify-center flex-shrink-0 ${toneCls}`}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-semibold text-text-primary truncate">
                        {a.title}
                      </span>
                      {a.version && (
                        <span className="text-[10px] font-mono text-text-muted flex-shrink-0">
                          {a.version}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-text-muted truncate">
                      {a.description}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {a.generatedBy} · {a.generatedAtLabel}
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${toneCls} flex-shrink-0`}>
                    {meta?.label || a.kind}
                  </span>
                  <ChevronRight size={12} className="text-text-muted group-hover:text-text-primary flex-shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {previewArtifact && (
          <ArtifactPreviewDrawer
            artifact={previewArtifact}
            onClose={() => setPreviewArtifact(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function StubTab({ label, icon: Icon, hint }) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-md p-8 text-center">
      <Icon size={20} className="mx-auto text-text-muted mb-2" />
      <div className="text-sm font-semibold text-text-primary mb-1">{label} · v1 stub</div>
      <div className="text-[11px] text-text-muted leading-relaxed max-w-md mx-auto">{hint}</div>
    </div>
  );
}

// ===== MAIN ROUTE =====
//
// Tabs — four primary surfaces:
//   1. Account AI (chat, default landing)
//   2. Contacts (stakeholders + Find new contacts in HG/CRM)
//   3. Overview (pain points, lead-with offering recommendation, signals,
//      recommended plays, find lookalikes)
//   4. Artifacts (history of agentic outputs — briefs, battlecards,
//      one-pagers, ROI models — generated against this account)
//
// Activity / MEDDIC / Plays collapsed: Plays content lives in Overview as
// "Recommended plays"; MEDDIC + Activity are available via the Account
// Brief artifact + chat history.
const TABS = [
  { id: 'chat', label: 'Account AI', icon: Sparkles },
  { id: 'stakeholders', label: 'Contacts', icon: UsersIcon },
  { id: 'overview', label: 'Overview', icon: Layers },
  { id: 'artifacts', label: 'Artifacts', icon: FileStack },
];

export default function AccountThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tenant } = useTenant();
  const { persona } = usePersona();
  const { showToast } = useToast();
  const { simulateThinking } = useAIThinking();

  // Resolve account — book first, then whitespace pool (for newly-added accounts).
  const account = useMemo(() => {
    if (!id) return null;
    const book = getAccountById(id);
    if (book) return book;
    return getWhitespaceAccount(id);
  }, [id]);

  // ----- Offering lens state -----
  // Priority: URL ?offering= > home filter localStorage > best-fit for this
  // account > 'all'. Synced back to URL on change.
  const lensFromUrl = searchParams.get('offering');
  const homeFilterLens = (() => {
    try {
      return readFilterState(persona.id)?.offeringId || null;
    } catch {
      return null;
    }
  })();
  const bestFit = account ? bestOfferingFor(account.id) : null;
  const defaultLens =
    lensFromUrl || (homeFilterLens && homeFilterLens !== 'all' ? homeFilterLens : null) || bestFit?.offeringId || 'all';
  const [offeringId, setOfferingId] = useState(defaultLens);
  // If URL changes externally, react to it
  useEffect(() => {
    if (lensFromUrl && lensFromUrl !== offeringId) setOfferingId(lensFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lensFromUrl]);
  const handleChangeLens = (next) => {
    setOfferingId(next);
    const params = new URLSearchParams(searchParams);
    if (next && next !== 'all') params.set('offering', next);
    else params.delete('offering');
    // Use replaceState directly to avoid losing the play param if it's mid-flight
    const newSearch = params.toString();
    if (typeof window !== 'undefined') {
      const url = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`;
      window.history.replaceState({}, '', url);
    }
  };

  // Initial tab from URL — lets the seller workbook deep-link via ?tab=chat.
  const initialTab = (() => {
    const t = searchParams.get('tab');
    // Honor legacy tab ids by mapping to the new three-tab set so old
    // links/URLs don't dead-end.
    const valid = ['chat', 'stakeholders', 'overview', 'artifacts'];
    const legacyMap = {
      activity: 'overview',
      meddic: 'overview',
      plays: 'overview',
    };
    if (valid.includes(t)) return t;
    if (legacyMap[t]) return legacyMap[t];
    return 'chat';
  })();
  const [tab, setTab] = useState(initialTab);
  const [turns, setTurns] = useState([]);
  const [runHistory, setRunHistory] = useState([]);
  const [isPinned, setIsPinned] = useState(false);
  const [lookalikesOpen, setLookalikesOpen] = useState(false);
  const scrollRef = useRef(null);
  const autoFiredRef = useRef(false);

  useEffect(() => {
    if (!id || !persona.plgUser) return;
    setIsPinned(getPinnedAccountIds(persona.id).includes(id));
  }, [id, persona.id, persona.plgUser]);

  const handlePinToggle = () => {
    if (!account) return;
    const { isPinned: nowPinned, replaced } = togglePinned(persona.id, account.id);
    setIsPinned(nowPinned);
    // Notify the Sidebar to re-read
    window.dispatchEvent(new Event('rgi:pins-changed'));
    if (nowPinned) {
      showToast(replaced ? 'Pinned · replaced oldest pin' : 'Pinned to sidebar', 'success');
    } else {
      showToast('Unpinned', 'info');
    }
  };

  // Auto-fire a play if ?play=X is in the URL
  useEffect(() => {
    if (autoFiredRef.current) return;
    const play = searchParams.get('play');
    if (play && account) {
      autoFiredRef.current = true;
      setTab('chat');
      setTimeout(() => runPlay(play), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, account]);

  // Auto-scroll chat
  useEffect(() => {
    if (tab === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, tab]);

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-12 text-center">
        <AlertTriangle size={20} className="mx-auto text-warning mb-2" />
        <h1 className="text-base font-semibold mb-2">Account not found</h1>
        <button onClick={() => navigate('/home')} className="text-primary text-xs hover:underline">
          ← Back to home
        </button>
      </div>
    );
  }

  // Run a play in this account context. Account name is auto-filled.
  const runPlay = (playId) => {
    // Map play id to either an agent or playbook
    const playbookMap = {
      account_brief: 'account-brief-flow',
    };
    const playbookId = playbookMap[playId] || null;
    const agentId = playbookId ? null : playId;

    const userTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      timestamp: 'Just now',
      content: `@${playId} ${account.name}`,
    };
    const agentTurn = buildAgentTurn({
      agentId,
      playbookId,
      target: account.name,
      surface: 'thread',
      invokedBy: { name: persona.name, initials: persona.initials, color: persona.avatarColor },
      audience: persona.isNew ? 'new_ae' : 'tenured_ae',
      personaPolicy: persona.agentPolicy,
    });
    setTurns((prev) => [...prev, userTurn, agentTurn]);
    setRunHistory((prev) => [
      ...prev,
      { id: agentTurn.runId, label: TABS_LABEL_FOR_PLAY[playId] || playId, timestamp: 'Just now' },
    ]);
    setTab('chat');
    const updates = planAgentRun(agentTurn);
    updates.forEach(([delay, mutate]) => {
      setTimeout(() => setTurns((prev) => mutate(prev)), delay);
    });
  };

  const handleSend = async (text) => {
    const userTurn = { id: `u-${Date.now()}`, role: 'user', timestamp: 'Just now', content: text };
    setTurns((prev) => [...prev, userTurn]);

    // @ invocation?
    const inv = parseAgentInvocation(text);
    if (inv) {
      const agentTurn = buildAgentTurn({
        agentId: inv.agentId,
        playbookId: inv.playbookId,
        // If user didn't specify a target, use the account name automatically
        target: inv.target === 'this account' ? account.name : inv.target,
        surface: 'thread',
        invokedBy: { name: persona.name, initials: persona.initials, color: persona.avatarColor },
        audience: persona.isNew ? 'new_ae' : 'tenured_ae',
        personaPolicy: persona.agentPolicy,
      });
      setTurns((prev) => [...prev, agentTurn]);
      setRunHistory((prev) => [
        ...prev,
        { id: agentTurn.runId, label: inv.handle, timestamp: 'Just now' },
      ]);
      const updates = planAgentRun(agentTurn);
      updates.forEach(([delay, mutate]) => {
        setTimeout(() => setTurns((prev) => mutate(prev)), delay);
      });
      return;
    }

    // Generic AI response
    await simulateThinking();
    const template = AI_RESPONSE_TEMPLATES[Math.floor(Math.random() * AI_RESPONSE_TEMPLATES.length)];
    setTurns((prev) => [...prev, { id: `a-${Date.now()}`, role: 'ai', timestamp: 'Just now', content: template }]);
  };

  const handleAgentApprove = (turnId) => setTurns((prev) => approveAgentTurn(prev, turnId));
  const handleAgentDismiss = (turnId) => setTurns((prev) => discardAgentTurn(prev, turnId));

  const cfg = ACCOUNT_STAGES[account.stage];

  return (
    <div className="h-full flex flex-col">
      {/* Account header */}
      <div className="border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <button onClick={() => navigate('/home')} className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-2">
            <ArrowLeft size={11} /> Home
          </button>
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-md flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ background: account.logoColor }}
            >
              {account.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-semibold tracking-tight">{account.name}</h1>
                <button
                  onClick={handlePinToggle}
                  title={isPinned ? 'Unpin from sidebar' : 'Pin to sidebar (max 3)'}
                  className={`p-1 rounded transition-colors ${
                    isPinned
                      ? 'text-primary bg-primary/10 hover:bg-primary/20'
                      : 'text-text-muted hover:text-primary hover:bg-bg/60'
                  }`}
                >
                  <Pin size={13} className={isPinned ? 'fill-current' : ''} />
                </button>
                <StageBadge stage={account.stage} />
                <OfferingLensChip
                  accountId={account.id}
                  currentOfferingId={offeringId}
                  onChange={handleChangeLens}
                />
                <span className="text-[10px] text-text-muted">·</span>
                <a href={`https://${account.url}`} target="_blank" rel="noreferrer" className="text-[11px] text-text-secondary hover:text-primary inline-flex items-center gap-0.5">
                  {account.url} <ExternalLink size={9} />
                </a>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <FAIPill label="Revenue" value={account.fai.revenue} />
                <FAIPill label="Employees" value={account.fai.employees} />
                <FAIPill label="HQ" value={account.fai.hq} />
                <FAIPill label="Industry" value={account.industry.split(' ').slice(0, 3).join(' ')} />
                {/* Per-offering fit scores replace the old Cloud / ICP fit /
                    Combined tiles — sellers care about how this account
                    scores across the products they sell, not the legacy
                    composite. Fallback chain mirrors the workbook table so
                    wizard-saved offering ids (wiz-cnapp, wiz-code,
                    wiz-defend) still resolve to curated FITS keyed by
                    canonical product line (cnapp, dspm, workload). */}
                {listOfferings()
                  .filter((o) => o.confirmed !== false)
                  .map((o) => {
                    const KEY_FALLBACKS = { code: 'dspm', cdr: 'workload' };
                    const fit =
                      getFitFor(account.id, o.id) ||
                      getFitFor(account.id, o.key) ||
                      getFitFor(account.id, KEY_FALLBACKS[o.key]);
                    const score = fit?.score ?? null;
                    const tier = score != null ? tierForScore(score) : null;
                    const display = score != null ? `${tier?.label || ''} ${score}`.trim() : '—';
                    return (
                      <FAIPill
                        key={o.id}
                        label={(o.shortName || o.name).replace(/^Wiz\s+/i, '')}
                        value={display}
                      />
                    );
                  })}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-text-muted">
                <span>{account.signals?.length || 0} signals</span>
                <span>·</span>
                <span>{account.stakeholdersCount} stakeholders</span>
                <span>·</span>
                <span>
                  {(getArtifactCountForAccount(account.id) || account.artifactsCount || 0)} artifacts
                </span>
                <span>·</span>
                <span>Last touch: <span className="text-text-secondary">{account.lastTouch || 'none'}</span></span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 mt-4 border-b border-border -mb-px">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-2 text-xs font-medium inline-flex items-center gap-1.5 border-b-2 transition-colors ${
                    tab === t.id ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-text-secondary'
                  }`}
                >
                  <Icon size={11} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-5">
          {tab === 'overview' && (
            <OverviewTab
              account={account}
              onChangeLens={handleChangeLens}
              onFindLookalikes={() => setLookalikesOpen(true)}
              onDraftOutreach={() => setTab('chat')}
              onGoToContacts={() => setTab('stakeholders')}
            />
          )}
          {tab === 'stakeholders' && (
            <StakeholdersTab account={account} onRunPlay={runPlay} />
          )}
          {tab === 'artifacts' && (
            <ArtifactsTab account={account} turns={turns} />
          )}
          {tab === 'chat' && (
            <div className="flex flex-col h-full">
              <div ref={scrollRef} className="flex-1 overflow-y-auto pb-3 min-h-[300px]">
                {turns.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles size={20} className="mx-auto text-primary mb-2" />
                    <div className="text-sm font-semibold text-text-primary mb-1">Conversation about {account.name}</div>
                    <div className="text-[11px] text-text-muted max-w-md mx-auto">
                      Type @ to invoke a play or agent · or just ask anything. Account context auto-fills.
                    </div>
                  </div>
                ) : (
                  turns.map((t) => (
                    <ConversationTurn
                      key={t.id}
                      turn={t}
                      onAgentApprove={handleAgentApprove}
                      onAgentDismiss={handleAgentDismiss}
                    />
                  ))
                )}
              </div>
              <div className="-mx-8 -mb-5">
                <ConversationInput onSend={handleSend} suggestions={[
                  'Run Account Brief',
                  'Draft a follow-up email',
                  `What changed at ${account.name} this week?`,
                ]} disabled={false} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lookalikes drawer (Phase 12) */}
      <AnimatePresence>
        {lookalikesOpen && (
          <LookalikesDrawer
            open={lookalikesOpen}
            sourceAccount={account}
            onClose={() => setLookalikesOpen(false)}
            onOpenAccount={(a) => {
              // Open whitespace preview drawer in /workbook (via deep-link with source toggle)
              setLookalikesOpen(false);
              navigate(`/workbook?source=whitespace`);
            }}
            onSaveAsList={(name, results) => {
              // Create a new whitespace view in the workbook with these account IDs
              // pre-filtered. For prototype, we save a view with a special "lookalike-of"
              // filter that the workbook respects.
              const accountIds = results.map((r) => r.account.id);
              const stash = {
                id: undefined,
                name,
                source: 'whitespace',
                isDefault: false,
                filters: {
                  offeringId: offeringId || 'all',
                  signalKinds: [],
                  tier: 'all',
                  lookalikeIds: accountIds,
                  lookalikeOf: account.name,
                },
                columns: [
                  { id: 'tier', kind: 'builtin' },
                  { id: 'account', kind: 'builtin' },
                  { id: 'opp_score', kind: 'builtin' },
                  { id: 'fit_lens', kind: 'builtin' },
                  { id: 'top_signal', kind: 'builtin' },
                  { id: 'cloud', kind: 'builtin' },
                  { id: 'revenue', kind: 'builtin' },
                  { id: 'employees', kind: 'builtin' },
                  { id: 'stage', kind: 'builtin' },
                ],
                sort: { columnId: 'fit_lens', dir: 'desc' },
              };
              const saved = saveCurrentAsNewView(persona.id, stash, name);
              setLookalikesOpen(false);
              showToast(`Saved "${name}" as whitespace view · ${accountIds.length} accounts`, 'success');
              navigate(`/workbook?source=whitespace&view=${saved.id}`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const TABS_LABEL_FOR_PLAY = {
  account_brief: 'Account Brief',
  email_draft: 'Email Draft',
  meeting_prep: 'Meeting Prep',
  competitive_battlecard: 'Competitive Battlecard',
  value_hypothesis: 'Value Hypothesis',
  follow_up_drafting: 'Follow-up Sequence',
};
