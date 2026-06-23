import { Fragment, useState } from 'react';

// SellerWorkbookTable — opinionated flat table for sellers (Alex's view).
//
// Per the spec: sellers always work off their book. The workbook IS their book.
// No source toggle, no view-mode toggle, no offering / signal filter chips.
//
// Columns:
//   Tier · Account · [Offering Fit ×N] · Employees · Revenue ·
//   Competitive Insights · Intent Insights · Partner Insights
//
// Competitive / Intent / Partner data is harvested from the tenant context
// configured by RevOps (offering.competitors, offering.intentTopics,
// offering.complementaryTech) and matched against the account's RGIF
// (installs + intent). Each cell shows the matches with intensity.

import {
  Sparkles,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  Cpu,
  Swords,
  Handshake,
  Bot,
  DollarSign,
  X,
  Users,
  Building2,
  MapPin,
  GitBranch,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
} from 'lucide-react';
import { getFitFor, tierForScore } from '../../data/accountOfferingFit.js';
import { tuningForOffering } from '../../data/scoringModels.js';

// Offerings created via the wizard carry ids like `wiz-cnapp` whose fit
// data lives under the canonical key (`cnapp`). We try the offering's
// id first, then its `key`, then a key-fallback for product lines that
// don't have a dedicated FITS entry (code → dspm, cdr → workload).
// The resolved score is then multiplied by the offering's attached
// scoring model's `scoreTuning` — swapping models in the offering page
// visibly shifts fit scores across the workbook.
const OFFERING_KEY_FALLBACKS = { code: 'dspm', cdr: 'workload' };
function resolveOfferingFit(accountOrId, offering) {
  // Accept either an account row (preferred — gives access to synthFits
  // when the row was minted by an ICP_MATCH workbook) or a bare id for
  // legacy callers.
  const account = typeof accountOrId === 'string' ? null : accountOrId;
  const accountId = account ? account.id : accountOrId;
  const keys = [offering?.id, offering?.key, OFFERING_KEY_FALLBACKS[offering?.key]];
  const tried = new Set();
  for (const k of keys) {
    if (!k || tried.has(k)) continue;
    tried.add(k);
    const f = getFitFor(accountId, k);
    if (f && f.score != null) {
      const tuning = tuningForOffering(offering?.id, offering);
      const tuned = Math.max(0, Math.min(100, Math.round(f.score * tuning)));
      return { ...f, score: tuned };
    }
  }
  // Fallback to row-attached synthetic fits — populated by the ICP Match
  // workbook generator so its rows still render per-offering scores.
  const synth = account?.synthFits?.[offering?.id];
  if (synth && synth.score != null) {
    return { ...synth, synth: true };
  }
  return null;
}
import { getRGIF, RGIF_CATEGORY_BY_ID, RGIF_CATEGORIES, valueFor } from '../../data/workbookRGIF.js';
import { getHgIntelligence } from '../../data/hgIntelligence.js';
import { useTenant } from '../../context/TenantContext.jsx';
import SourceIcons from './SourceIcons.jsx';
import HgIntelligenceCell from './HgIntelligenceCell.jsx';

// Buying Committee count cell. Shows the number of stakeholders matched
// against the tenant's buying committee at this account. Hover lists the
// roles (when available on the account).
export function BuyingCommitteeCell({ count, roles }) {
  if (count == null || count === 0) {
    return <span className="text-[10px] text-text-muted italic">—</span>;
  }
  return (
    <div
      className="inline-flex items-center gap-1.5"
      title={roles && roles.length > 0 ? roles.join(' · ') : `${count} stakeholders identified`}
    >
      <span className="text-[11px] font-mono font-semibold text-text-primary">{count}</span>
      <span className="text-[9px] text-text-muted uppercase tracking-wider">contacts</span>
    </div>
  );
}

// Subsidiary hierarchy chip. Renders below the company name when the
// account has known subsidiaries. Hover lists them.
export function SubsidiariesIndicator({ subsidiaries, expanded, onToggle }) {
  if (!Array.isArray(subsidiaries) || subsidiaries.length === 0) return null;
  const names = subsidiaries.map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border font-medium transition-colors ${
        expanded
          ? 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/50'
          : 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30 hover:bg-violet-500/20'
      }`}
      title={`Subsidiaries: ${names.join(', ')}`}
    >
      {expanded ? (
        <ChevronDown size={9} className="transition-transform" />
      ) : (
        <ChevronRight size={9} className="transition-transform" />
      )}
      <GitBranch size={8} />
      +{names.length} {names.length === 1 ? 'subsidiary' : 'subsidiaries'}
    </button>
  );
}

// ─── Tone dot for AI-enriched answers ─────────────────────────────────────

function ToneDot({ tone }) {
  const cls =
    tone === 'good'
      ? 'bg-emerald-500'
      : tone === 'amber'
      ? 'bg-amber-500'
      : tone === 'red'
      ? 'bg-rose-500'
      : 'bg-text-muted';
  return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cls}`} />;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

// Convert "Palo Alto Prisma Cloud" → "palo-alto-prisma" for install lookup.
// Conservative slugify: lowercase, remove non-alphanumeric except dash, dedupe dashes.
function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Find install entry for a tenant-context name by trying multiple slug
// variants (full slug, first-2-tokens, single-token prefix).
function findInstall(installs, name) {
  if (!installs || !name) return null;
  const full = slugify(name);
  if (installs[full]?.present) return { key: full, ...installs[full] };
  const tokens = full.split('-');
  for (let n = Math.min(tokens.length, 3); n > 0; n--) {
    const slug = tokens.slice(0, n).join('-');
    if (installs[slug]?.present) return { key: slug, ...installs[slug] };
  }
  // Also try matching install keys that *contain* the first token (loose)
  const first = tokens[0];
  if (first) {
    const match = Object.entries(installs).find(
      ([k, v]) => v?.present && k.includes(first),
    );
    if (match) return { key: match[0], ...match[1] };
  }
  return null;
}

// Intent topic matching — case-insensitive substring against rgif.intent array.
function findIntentMatch(intentList, topicName) {
  if (!intentList || !topicName) return null;
  const lower = topicName.toLowerCase();
  for (const detected of intentList) {
    const d = detected.toLowerCase();
    if (d.includes(lower) || lower.includes(d)) return detected;
  }
  return null;
}

// Heuristic: is this intent topic from TrustRadius? In production this is a
// proper source flag on the intent record. For the demo we keyword-match.
const TRUSTRADIUS_KEYWORDS = ['rfp', 'comparison', 'pricing', 'vendor', 'category', 'buyer'];
function isTrustRadiusIntent(topic) {
  const lower = (topic || '').toLowerCase();
  return TRUSTRADIUS_KEYWORDS.some((kw) => lower.includes(kw));
}

// Map a tenant spend category to the key in rgif.spend. The tenant config
// names categories ("Security (Software)", "Cloud Services", etc.) but the
// account RGIF stores spend keyed by short slugs (security, cloud, iam,
// network). We translate via keyword match.
function resolveSpendValue(spend, categoryName) {
  if (!spend || !categoryName) return null;
  const lower = categoryName.toLowerCase();
  if (lower.includes('security')) return spend.security;
  if (lower.includes('cloud') || lower.includes('infrastructure')) return spend.cloud;
  if (lower.includes('iam') || lower.includes('identity')) return spend.iam;
  if (lower.includes('network')) return spend.network;
  if (lower.includes('application') || lower.includes('appdev') || lower.includes('software')) {
    // Fallback: software-ish categories map to total - infra (rough approximation)
    return spend.software || null;
  }
  return null;
}

function TrendIcon({ trend }) {
  if (trend === 'growing') return <TrendingUp size={9} className="text-emerald-700 dark:text-emerald-300" />;
  if (trend === 'declining') return <TrendingDown size={9} className="text-rose-700 dark:text-rose-300" />;
  return <Minus size={9} className="text-text-muted" />;
}

function IntensityBadge({ intensity }) {
  if (intensity == null) return null;
  const tone =
    intensity >= 8 ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10' :
    intensity >= 5 ? 'text-amber-700 dark:text-amber-300 bg-amber-500/10' :
                     'text-text-muted bg-surface-2';
  return (
    <span className={`text-[9px] font-mono px-1 py-0 rounded ${tone}`}>
      {Number(intensity).toFixed(1)}
    </span>
  );
}

// ─── Per-cell renderers ────────────────────────────────────────────────────

export function SpendCell({ tenantSpendCategories, spend, spendTrend }) {
  if (!tenantSpendCategories || tenantSpendCategories.length === 0) {
    return <span className="text-[10px] text-text-muted italic">No spend categories configured</span>;
  }
  // Only show categories the tenant flagged as primary/adjacent (skip
  // tangential), with a resolved $ value for this account.
  const matches = tenantSpendCategories
    .filter((c) => c.relevance !== 'tangential')
    .map((c) => {
      const value = resolveSpendValue(spend, c.name);
      return value ? { name: c.name, value, relevance: c.relevance } : null;
    })
    .filter(Boolean)
    .slice(0, 3);

  if (matches.length === 0) {
    return <span className="text-[10px] text-text-muted italic">No spend signal</span>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {matches.map((m) => (
        <div key={m.name} className="inline-flex items-center gap-1 text-[10px]">
          <DollarSign size={9} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0" />
          <span className="text-text-secondary truncate max-w-[120px]">{m.name.replace(/\s*\(.+?\)/, '')}</span>
          <span className="text-[10px] font-mono font-semibold text-text-primary">{m.value}</span>
          {m.relevance === 'primary' && (
            <span className="text-[8px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-bold">·</span>
          )}
        </div>
      ))}
      {spendTrend && (
        <div className="inline-flex items-center gap-1 text-[10px] text-text-muted">
          <TrendIcon trend={spendTrend} />
          <span className="italic">trend</span>
        </div>
      )}
    </div>
  );
}

function OfferingScoreCell({ score }) {
  if (score == null) return <span className="text-[10px] text-text-muted">—</span>;
  const tier = tierForScore(score);
  const cls = tier ? tier.color : 'text-text-secondary';
  return <span className={`text-[12px] font-mono font-semibold ${cls}`}>{score}</span>;
}

export function CompetitiveCell({ tenantCompetitors, installs }) {
  if (!tenantCompetitors || tenantCompetitors.length === 0) {
    return <span className="text-[10px] text-text-muted italic">No competitors configured</span>;
  }
  const matches = tenantCompetitors
    .map((c) => {
      const name = typeof c === 'string' ? c : c.name;
      const inst = findInstall(installs, name);
      return inst ? { name, ...inst } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b.intensity || 0) - (a.intensity || 0))
    .slice(0, 3);

  if (matches.length === 0) {
    return <span className="text-[10px] text-text-muted italic">No competitor footprint</span>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {matches.map((m) => (
        <div key={m.key} className="inline-flex items-center gap-1 text-[10px]">
          <span className="text-rose-700 dark:text-rose-300 font-medium truncate max-w-[140px]">{m.name}</span>
          <IntensityBadge intensity={m.intensity} />
          <TrendIcon trend={m.trend} />
        </div>
      ))}
    </div>
  );
}

export function IntentCell({ tenantIntentTopics, intentList }) {
  if (!tenantIntentTopics || tenantIntentTopics.length === 0) {
    return <span className="text-[10px] text-text-muted italic">No intent topics configured</span>;
  }
  const matches = tenantIntentTopics
    .map((t) => {
      const name = typeof t === 'string' ? t : t.name;
      const matched = findIntentMatch(intentList, name);
      return matched ? { topic: name, detected: matched } : null;
    })
    .filter(Boolean)
    .slice(0, 3);

  // Also look for stray TrustRadius-flavor intent topics that aren't in
  // tenant config but show in the account's intent list — these are
  // valuable to surface.
  const trustradiusExtra = (intentList || [])
    .filter((d) => isTrustRadiusIntent(d) && !matches.some((m) => m.detected === d))
    .slice(0, 1);

  if (matches.length === 0 && trustradiusExtra.length === 0) {
    return <span className="text-[10px] text-text-muted italic">No intent detected</span>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {matches.map((m) => (
        <div key={m.topic} className="inline-flex items-center gap-1 text-[10px]">
          <Sparkles size={9} className="text-violet-500 flex-shrink-0" />
          <span className="text-text-secondary truncate max-w-[140px]">{m.detected}</span>
          {isTrustRadiusIntent(m.detected) && <TrBadge />}
        </div>
      ))}
      {trustradiusExtra.map((d) => (
        <div key={d} className="inline-flex items-center gap-1 text-[10px]">
          <Globe size={9} className="text-amber-600 flex-shrink-0" />
          <span className="text-text-secondary truncate max-w-[140px]">{d}</span>
          <TrBadge />
        </div>
      ))}
    </div>
  );
}

function TrBadge() {
  return (
    <span
      className="inline-flex items-center text-[8px] uppercase tracking-wider px-1 py-0 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold"
      title="TrustRadius intent detected"
    >
      TR
    </span>
  );
}

export function PartnerCell({ tenantComplementaryTech, installs }) {
  if (!tenantComplementaryTech || tenantComplementaryTech.length === 0) {
    return <span className="text-[10px] text-text-muted italic">No partner stack configured</span>;
  }
  const matches = tenantComplementaryTech
    .map((t) => {
      const name = typeof t === 'string' ? t : t.name;
      const inst = findInstall(installs, name);
      return inst ? { name, ...inst } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b.intensity || 0) - (a.intensity || 0))
    .slice(0, 3);

  if (matches.length === 0) {
    return <span className="text-[10px] text-text-muted italic">No partner stack detected</span>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {matches.map((m) => (
        <div key={m.key} className="inline-flex items-center gap-1 text-[10px]">
          <span className="text-sky-700 dark:text-sky-300 font-medium truncate max-w-[140px]">{m.name}</span>
          <IntensityBadge intensity={m.intensity} />
          <TrendIcon trend={m.trend} />
        </div>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function SellerWorkbookTable({
  accounts,
  offerings,
  onOpenAccount,
  onOpenAccountChat,
  showSourceColumn = false,
  showHgIntelligence = false,
  enrichedCols = [],
  onRemoveEnrichedColumn,
  // Column-set switch. 'seller' (default) renders Competitive/Intent/
  // Partner/IT Spend — the seller's day-of-the-week context. 'admin-flat'
  // renders BC contacts/IT Spend/HQ/Industry — the across-offering scan
  // an admin wants. Both render Account + per-offering scores + Emp +
  // Revenue regardless.
  columnSet = 'seller',
}) {
  const isAdminFlat = columnSet === 'admin-flat';
  const { tenant } = useTenant();
  // Expand/collapse state for subsidiary rows. Keyed by account id.
  const [expandedSubs, setExpandedSubs] = useState(() => new Set());
  const toggleSubsidiaries = (accountId) => {
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) next.delete(accountId);
      else next.add(accountId);
      return next;
    });
  };
  const tenantSpendCategories = tenant?.spendCategories || [];
  // Aggregate tenant context from all confirmed offerings — these are the
  // signals the seller's RevOps admin configured. Dedupe across offerings.
  const confirmedOfferings = offerings.filter((o) => o.confirmed !== false);
  const allCompetitors = [];
  const allIntentTopics = [];
  const allComplementaryTech = [];
  const seenC = new Set(), seenI = new Set(), seenT = new Set();
  for (const o of confirmedOfferings) {
    (o.competitors || []).forEach((c) => {
      const name = typeof c === 'string' ? c : c.name;
      if (name && !seenC.has(name.toLowerCase())) {
        seenC.add(name.toLowerCase());
        allCompetitors.push(c);
      }
    });
    (o.intentTopics || []).forEach((t) => {
      const name = typeof t === 'string' ? t : t.name;
      if (name && !seenI.has(name.toLowerCase())) {
        seenI.add(name.toLowerCase());
        allIntentTopics.push(t);
      }
    });
    (o.complementaryTech || []).forEach((t) => {
      const name = typeof t === 'string' ? t : t.name;
      if (name && !seenT.has(name.toLowerCase())) {
        seenT.add(name.toLowerCase());
        allComplementaryTech.push(t);
      }
    });
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-md p-10 text-center text-text-muted">
        <div className="text-sm font-semibold text-text-primary mb-1">Your book is empty</div>
        <p className="text-xs">Ask your admin to add accounts to your book via Territory Design.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-md overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-bg/30 border-b border-border">
          <tr className="text-text-muted">
            <th className="text-left text-[9px] uppercase tracking-wider font-semibold px-3 py-2 min-w-[220px]">Account</th>
            {showSourceColumn && (
              <th className="text-left text-[9px] uppercase tracking-wider font-semibold px-2 py-2 w-20">Source</th>
            )}
            {confirmedOfferings.map((o) => (
              <th
                key={o.id}
                className="text-center text-[9px] uppercase tracking-wider font-semibold px-2 py-2 w-16"
                title={`Fit score for ${o.name}`}
              >
                <div className="truncate max-w-[60px] mx-auto">{(o.shortName || o.name).replace(/^Wiz\s+/i, '')}</div>
              </th>
            ))}
            <th className="text-right text-[9px] uppercase tracking-wider font-semibold px-2 py-2 w-16">Emp</th>
            <th className="text-right text-[9px] uppercase tracking-wider font-semibold px-2 py-2 w-20">Revenue</th>
            {isAdminFlat ? (
              <>
                <th className="text-left text-[9px] uppercase tracking-wider font-semibold px-2 py-2 w-28">
                  <Users size={9} className="inline mr-1 text-sky-500" /> Buying Committee
                </th>
                <th className="text-left text-[9px] uppercase tracking-wider font-semibold px-2 py-2 min-w-[150px]">
                  <DollarSign size={9} className="inline mr-1 text-emerald-500" /> IT Spend
                </th>
                <th className="text-left text-[9px] uppercase tracking-wider font-semibold px-2 py-2 w-32">
                  <MapPin size={9} className="inline mr-1 text-text-muted" /> HQ
                </th>
                <th className="text-left text-[9px] uppercase tracking-wider font-semibold px-2 py-2 min-w-[160px]">
                  <Building2 size={9} className="inline mr-1 text-text-muted" /> Industry
                </th>
              </>
            ) : (
              <>
                <th className="text-left text-[9px] uppercase tracking-wider font-semibold px-2 py-2 min-w-[170px]">
                  <Swords size={9} className="inline mr-1 text-rose-500" /> Competitive
                </th>
                <th className="text-left text-[9px] uppercase tracking-wider font-semibold px-2 py-2 min-w-[170px]">
                  <Sparkles size={9} className="inline mr-1 text-violet-500" /> Intent
                </th>
                <th className="text-left text-[9px] uppercase tracking-wider font-semibold px-2 py-2 min-w-[170px]">
                  <Handshake size={9} className="inline mr-1 text-sky-500" /> Partner stack
                </th>
                <th className="text-left text-[9px] uppercase tracking-wider font-semibold px-2 py-2 min-w-[150px]">
                  <DollarSign size={9} className="inline mr-1 text-emerald-500" /> IT Spend
                </th>
              </>
            )}
            {showHgIntelligence && (
              <th className="text-left text-[9px] uppercase tracking-wider font-semibold px-2 py-2 min-w-[260px]">
                <Sparkles size={9} className="inline mr-1 text-violet-500" /> HG Intelligence
              </th>
            )}
            {enrichedCols.map((col) => {
              const cat = RGIF_CATEGORY_BY_ID[col.category] || RGIF_CATEGORIES[0];
              return (
                <th
                  key={col.id}
                  className="text-left text-[9px] uppercase tracking-wider font-semibold px-2 py-2 whitespace-nowrap min-w-[160px] max-w-[220px]"
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[10px]">{cat.icon}</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-primary">✦ Enriched</span>
                    {onRemoveEnrichedColumn && (
                      <button
                        onClick={() => onRemoveEnrichedColumn(col.id)}
                        className="ml-auto text-text-muted hover:text-rose-600 transition-colors"
                        title="Remove column"
                      >
                        <X size={9} />
                      </button>
                    )}
                  </div>
                  <div className="text-[9px] font-normal text-text-muted leading-tight whitespace-normal max-w-[200px]">
                    {col.question}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => {
            const rgif = getRGIF(account.id) || account.rgif || {};
            const installs = rgif.installs;
            const intentList = rgif.intent;
            const spend = rgif.spend;
            const spendTrend = rgif.spendTrend;
            const allScores = confirmedOfferings.map((o) => ({
              offering: o,
              score: resolveOfferingFit(account, o)?.score ?? null,
            }));
            const isExpanded = expandedSubs.has(account.id);
            const subs = Array.isArray(account.subsidiaries) ? account.subsidiaries : [];
            // Total table column count, for the disclosure row's spacer cells.
            const offeringColCount = confirmedOfferings.length;
            const middleColCount = 4; // Emp + Revenue + 4 columns (BC/Spend/HQ/Industry OR Comp/Intent/Partner/Spend) — 4 of them sit after Emp/Revenue
            const trailingCount = (showHgIntelligence ? 1 : 0) + enrichedCols.length;

            return (
              <Fragment key={account.id}>
              <tr
                onClick={() => onOpenAccount?.(account)}
                className="border-b border-border/40 hover:bg-bg/40 cursor-pointer transition-colors"
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {account.logoColor && (
                      <div
                        className="w-7 h-7 rounded text-[11px] font-bold flex items-center justify-center text-white flex-shrink-0"
                        style={{ background: account.logoColor }}
                      >
                        {account.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[13px] font-medium text-text-primary truncate">{account.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAccountChat?.(account);
                          }}
                          className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 transition-colors"
                          title={`Open AI chat for ${account.name}`}
                        >
                          <Bot size={11} />
                        </button>
                        <SubsidiariesIndicator
                          subsidiaries={account.subsidiaries}
                          expanded={isExpanded}
                          onToggle={() => toggleSubsidiaries(account.id)}
                        />
                      </div>
                      {/* In admin-flat mode, industry + HQ live in their own
                          columns. In seller mode keep them inline under the
                          name so the row reads at a glance. */}
                      {!isAdminFlat && (
                        <div className="text-[10px] text-text-muted truncate">
                          {account.industry || '—'}{account.fai?.hq ? ` · ${account.fai.hq}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                {showSourceColumn && (
                  <td className="px-2 py-2">
                    <SourceIcons presentIn={account.presentIn} />
                  </td>
                )}
                {allScores.map(({ offering, score }) => (
                  <td key={offering.id} className="px-2 py-2 text-center">
                    <OfferingScoreCell score={score} />
                  </td>
                ))}
                <td className="px-2 py-2 text-right text-[11px] text-text-secondary font-mono">
                  {account.fai?.employees || '—'}
                </td>
                <td className="px-2 py-2 text-right text-[11px] text-text-secondary font-mono">
                  {account.fai?.revenue || '—'}
                </td>
                {isAdminFlat ? (
                  <>
                    <td className="px-2 py-2">
                      <BuyingCommitteeCell
                        count={account.stakeholdersCount}
                        roles={(account.signals || [])
                          .map((s) => s.headline)
                          .filter((h) => /CISO|VP|Head|Director|Champion/i.test(h || ''))}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <SpendCell
                        tenantSpendCategories={tenantSpendCategories}
                        spend={spend}
                        spendTrend={spendTrend}
                      />
                    </td>
                    <td className="px-2 py-2 text-[11px] text-text-secondary">
                      {account.fai?.hq || '—'}
                    </td>
                    <td className="px-2 py-2 text-[11px] text-text-secondary truncate max-w-[200px]" title={account.industry || ''}>
                      {account.industry || '—'}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-2">
                      <CompetitiveCell tenantCompetitors={allCompetitors} installs={installs} />
                    </td>
                    <td className="px-2 py-2">
                      <IntentCell tenantIntentTopics={allIntentTopics} intentList={intentList} />
                    </td>
                    <td className="px-2 py-2">
                      <PartnerCell tenantComplementaryTech={allComplementaryTech} installs={installs} />
                    </td>
                    <td className="px-2 py-2">
                      <SpendCell
                        tenantSpendCategories={tenantSpendCategories}
                        spend={spend}
                        spendTrend={spendTrend}
                      />
                    </td>
                  </>
                )}
                {showHgIntelligence && (
                  <td className="px-2 py-2 align-top">
                    <HgIntelligenceCell intelligence={getHgIntelligence(account.id)} />
                  </td>
                )}
                {enrichedCols.map((col) => {
                  const v = valueFor(account, col.question);
                  return (
                    <td key={col.id} className="px-2 py-2">
                      <div className="inline-flex items-center gap-1.5">
                        <ToneDot tone={v.tone} />
                        <span
                          className="text-[10px] font-mono text-text-secondary truncate max-w-[180px]"
                          title={v.value}
                        >
                          {v.value}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
              {/* Subsidiary disclosure rows — indented child rows for any
                  subsidiaries the parent has, when the user clicks the
                  "+N subsidiaries" chip. Other columns dim to keep the
                  parent the visual focus. */}
              {isExpanded && subs.map((sub, idx) => {
                const subName = typeof sub === 'string' ? sub : sub.name;
                const subEmp = typeof sub === 'object' ? sub.employees : '';
                return (
                  <tr
                    key={`${account.id}-sub-${idx}`}
                    className="border-b border-border/30 bg-violet-500/[0.03]"
                  >
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1.5 pl-9">
                        <CornerDownRight size={11} className="text-violet-500/70 flex-shrink-0" />
                        <span className="text-[12px] text-text-secondary">{subName}</span>
                      </div>
                    </td>
                    {showSourceColumn && <td className="px-2 py-1.5 text-[10px] text-text-muted">—</td>}
                    {Array.from({ length: offeringColCount }).map((_, i) => (
                      <td key={i} className="px-2 py-1.5 text-center text-[10px] text-text-muted">—</td>
                    ))}
                    <td className="px-2 py-1.5 text-right text-[11px] text-text-secondary font-mono">
                      {subEmp || '—'}
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-text-muted">—</td>
                    {Array.from({ length: middleColCount }).map((_, i) => (
                      <td key={i} className="px-2 py-1.5 text-[10px] text-text-muted">—</td>
                    ))}
                    {Array.from({ length: trailingCount }).map((_, i) => (
                      <td key={i} className="px-2 py-1.5 text-[10px] text-text-muted">—</td>
                    ))}
                  </tr>
                );
              })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
