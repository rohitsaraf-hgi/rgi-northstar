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
import { Pin, Package, ChevronDown, Wand2, Search, Save } from 'lucide-react';
import { useTenant } from '../context/TenantContext.jsx';
import { usePersona } from '../context/PersonaContext.jsx';
import { getAgentConfig, getPlaybookConfig, subscribeAdminConfig } from '../data/adminConfig.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAIThinking } from '../context/AIThinkingContext.jsx';
import { listOfferings, getOffering } from '../data/offerings.js';
import { getFitFor, getAllFitFor, tierForScore, bestOfferingFor } from '../data/accountOfferingFit.js';
import { getHgIntelligence, OFFERING_CODES } from '../data/hgIntelligence.js';
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

function OverviewTab({ account, onChangeLens, onFindLookalikes }) {
  // Per the spec: Overview shows what's happening, the pain points this
  // account is facing, which offerings to lead with, and the agentic
  // lookalikes callout at the bottom. Defensive null checks throughout
  // so a missing HG_INTELLIGENCE entry or offering-id mismatch never
  // crashes the tab.

  const intel = getHgIntelligence(account.id);

  // Resolve the lead / next offerings against the tenant's offering
  // catalog. Falls through OFFERING_CODES → offering.key → offering.id
  // so wizard-saved offerings (wiz-cnapp, wiz-code, wiz-defend) resolve
  // alongside legacy ids.
  const resolveOfferingByCode = (code) => {
    if (!code) return null;
    const key = OFFERING_CODES?.[code]?.key;
    const offerings = listOfferings();
    return (
      offerings.find((o) => o.key === key || o.id === key) ||
      offerings.find((o) => o.id === code) ||
      null
    );
  };
  const leadOffering = resolveOfferingByCode(intel?.lead?.code);
  const nextOffering = resolveOfferingByCode(intel?.next?.code);

  // Pain points — pulled from the lead offering's painPoints. Tenant
  // config is authored as an array of strings; fall back to the
  // narrative if no offering painPoints exist.
  const painPoints = Array.isArray(leadOffering?.painPoints)
    ? leadOffering.painPoints
    : [];

  return (
    <div className="space-y-4">
      {/* What's happening + Lead with + Co-sell follow-on */}
      {intel ? (
        <div className="bg-gradient-to-br from-violet-500/5 via-primary/5 to-emerald-500/5 border border-violet-500/30 rounded-md p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-violet-500/15 flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-violet-700 dark:text-violet-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-violet-700 dark:text-violet-300 mb-0.5">
                What's happening at {account.name}
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                {intel.narrative}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            {/* Lead with */}
            {intel.lead && (
              <div className="bg-surface/80 border border-border rounded p-3">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                  Lead with
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  {leadOffering && (
                    <span className={`w-5 h-5 rounded ${leadOffering.bg || 'bg-primary/10'} flex items-center justify-center flex-shrink-0`}>
                      <Package size={11} className={leadOffering.textColor || 'text-primary'} />
                    </span>
                  )}
                  <span className="text-[13px] font-semibold text-text-primary truncate">
                    {intel.lead.name}
                  </span>
                </div>
                {intel.lead.entryPoint && (
                  <div className="text-[11px] text-text-secondary leading-snug">
                    Entry point:{' '}
                    <span className="font-medium text-text-primary">{intel.lead.entryPoint}</span>
                  </div>
                )}
                {leadOffering && onChangeLens && (
                  <button
                    onClick={() => onChangeLens(leadOffering.id)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                  >
                    Open this offering's lens <ArrowRight size={9} />
                  </button>
                )}
              </div>
            )}

            {/* Next — co-sell or expansion */}
            {intel.next && (
              <div className="bg-surface/80 border border-border rounded p-3">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1 inline-flex items-center gap-1.5">
                  {intel.next.type === 'expansion' ? 'Expansion follow-on' : 'Co-sell follow-on'}
                  <span
                    className={`text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded border ${
                      intel.next.type === 'expansion'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
                    }`}
                  >
                    {intel.next.type === 'expansion' ? 'Expand' : 'Co-sell'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  {nextOffering && (
                    <span className={`w-5 h-5 rounded ${nextOffering.bg || 'bg-primary/10'} flex items-center justify-center flex-shrink-0`}>
                      <Package size={11} className={nextOffering.textColor || 'text-primary'} />
                    </span>
                  )}
                  <span className="text-[13px] font-semibold text-text-primary truncate">
                    {intel.next.name}
                  </span>
                </div>
                {intel.next.reasoning && (
                  <div className="text-[11px] text-text-secondary leading-snug">
                    {intel.next.reasoning}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-dashed border-border rounded-md p-6 text-center text-[12px] text-text-muted">
          AI intelligence for this account is generating. Refresh in a moment, or run an Account Brief from the Account AI tab.
        </div>
      )}

      {/* Pain points this account is facing */}
      {painPoints.length > 0 && (
        <div className="bg-surface border border-border rounded-md p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle size={12} className="text-amber-700 dark:text-amber-300" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-text-secondary">
              Pain points {account.name} is facing
            </h3>
            {leadOffering && (
              <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${leadOffering.bg || 'bg-primary/10'} ${leadOffering.textColor || 'text-primary'}`}>
                {leadOffering.name.replace(/^Wiz\s+/i, '')}
              </span>
            )}
          </div>
          <ul className="space-y-1.5">
            {painPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-text-secondary leading-snug">
                <span className="text-amber-700 dark:text-amber-300 mt-0.5">·</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Find lookalikes — agentic callout */}
      {onFindLookalikes && (
        <div className="bg-gradient-to-r from-primary/5 to-violet-500/5 border border-primary/20 rounded-md p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center flex-shrink-0">
            <Search size={15} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-text-primary mb-0.5">
              Find more accounts like {account.name}
            </div>
            <div className="text-[11px] text-text-secondary leading-relaxed">
              An agent will search HG's universe for whitespace accounts that mirror {account.name}'s
              industry, cloud, tech stack, size, and intent — and save the result as a workbook.
            </div>
          </div>
          <button
            onClick={onFindLookalikes}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-dim"
          >
            <Wand2 size={11} />
            Find lookalikes
          </button>
        </div>
      )}
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

function ArtifactsTab({ account, turns }) {
  // Pull artifacts from turns
  const artifacts = useMemo(() => turns.filter((t) => t.artifact).map((t) => t.artifact), [turns]);
  return (
    <div className="bg-surface border border-border rounded-md">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-text-primary">Artifacts</div>
          <div className="text-[11px] text-text-muted mt-0.5">Everything generated for {account.name}.</div>
        </div>
        <span className="text-[10px] text-text-muted">{artifacts.length} this thread</span>
      </div>
      {artifacts.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-text-muted">
          No artifacts yet. Run a play from the Plays tab to generate one.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {artifacts.map((a, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-bg/40 border border-border flex items-center justify-center flex-shrink-0">
                <Layers size={11} className="text-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-text-primary truncate">{a.title}</div>
                <div className="text-[10px] text-text-muted">{a.meta || a.kind}</div>
              </div>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold">
                {a.kind}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
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
// Tabs reduced to three primary surfaces:
//   1. Account AI (chat, default landing)
//   2. Contacts (stakeholders + Find new contacts in HG/CRM)
//   3. Overview (pain points, lead-with offering recommendation, signals,
//      recommended plays, find lookalikes)
//
// Activity / MEDDIC / Plays / Artifacts collapsed: Plays content lives in
// Overview as "Recommended plays"; MEDDIC, Activity, and Artifacts are
// available via the Account Brief artifact + chat history.
const TABS = [
  { id: 'chat', label: 'Account AI', icon: Sparkles },
  { id: 'stakeholders', label: 'Contacts', icon: UsersIcon },
  { id: 'overview', label: 'Overview', icon: Layers },
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
    const valid = ['chat', 'stakeholders', 'overview'];
    const legacyMap = {
      activity: 'overview',
      meddic: 'overview',
      plays: 'overview',
      artifacts: 'chat',
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
                <span>{account.artifactsCount} artifacts</span>
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
            />
          )}
          {tab === 'stakeholders' && (
            <StakeholdersTab account={account} onRunPlay={runPlay} />
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
