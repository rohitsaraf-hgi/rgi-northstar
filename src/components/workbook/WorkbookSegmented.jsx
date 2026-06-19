// WorkbookSegmented — workbook rendered as N stacked sections, one per
// offering. Each section shows the top accounts that fit that offering's
// ICP, ranked by composite score. Replaces the single flat table when the
// admin selects "Segmented" view mode.
//
// Lightweight by design:
//   - Sections are derived per render — no stored per-section state
//   - Default top-N = 10 per section, with a "View all" CTA that switches
//     to flat mode with the offering's lens applied
//   - Empty state per section when no accounts match the offering's ICP
//   - Section header shows offering accent + count + mini tier distribution

import { Fragment, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Package,
  ArrowRight,
  Sparkles,
  Plus,
  Users,
  Swords,
  Handshake,
  Bot,
  CornerDownRight,
} from 'lucide-react';
import { getFitFor, tierForScore } from '../../data/accountOfferingFit.js';
import { getRGIF } from '../../data/workbookRGIF.js';
import { useTenant } from '../../context/TenantContext.jsx';
import {
  CompetitiveCell,
  IntentCell,
  PartnerCell,
  BuyingCommitteeCell,
  SubsidiariesIndicator,
} from './SellerWorkbookTable.jsx';
import HgIntelligenceCell from './HgIntelligenceCell.jsx';
import { getHgIntelligence } from '../../data/hgIntelligence.js';

const TOP_N_DEFAULT = 10;

// Map an offering to the key used in the FITS lookup table. Legacy offerings
// have id === fits-key (cnapp/ciem/dspm/workload). Wizard-saved offerings
// have ids like 'wiz-cnapp' + a `key` field that maps to the same taxonomy.
// For demo product lines not in FITS (code, cdr) we fall back to the closest
// analog so the demo doesn't look empty.
const KEY_FALLBACKS = {
  code: 'dspm',     // code security ~ data security analog in the demo
  cdr: 'workload',  // cloud detection & response ~ workload protection
};

function resolveFit(accountId, offering) {
  // Try every plausible key in order — id first (works for legacy + custom
  // tenants that happen to use canonical names), then offering.key (works
  // for wizard-saved offerings), then a key-fallback for product lines not
  // present in the demo FITS table.
  const tried = new Set();
  const keys = [offering.id, offering.key, KEY_FALLBACKS[offering.key]];
  for (const k of keys) {
    if (!k || tried.has(k)) continue;
    tried.add(k);
    const f = getFitFor(accountId, k);
    if (f && f.score != null) return f;
  }
  return null;
}

function MiniTierBar({ counts }) {
  const total = counts.A + counts.B + counts.C + counts.D || 1;
  const segs = [
    { id: 'A', count: counts.A, color: '#10b981' },
    { id: 'B', count: counts.B, color: '#3b82f6' },
    { id: 'C', count: counts.C, color: '#f59e0b' },
    { id: 'D', count: counts.D, color: '#94a3b8' },
  ];
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center h-1.5 w-20 rounded-full overflow-hidden bg-bg/60">
        {segs.map((s) => (
          <div
            key={s.id}
            style={{ background: s.color, width: `${(s.count / total) * 100}%` }}
            title={`Tier ${s.id}: ${s.count}`}
          />
        ))}
      </div>
      <span className="text-[10px] text-text-muted font-mono">
        {counts.A}A · {counts.B}B · {counts.C}C
      </span>
    </div>
  );
}

// Each section's row. Columns:
//   Account (with tier badge + subsidiary indicator + AI-chat button)
//   Emp · Revenue · BC contacts · Competitive · Intent · Partner stack ·
//   HG Intelligence
// Fit score is implicit by section, so we surface only the tier badge.
function CompactAccountRow({
  account,
  offering,
  isBook,
  isExpanded,
  onToggleExpand,
  onOpen,
  onActivate,
  onAddToBook,
  onOpenChat,
  tenantCompetitors,
  tenantIntentTopics,
  tenantComplementaryTech,
}) {
  const fit = resolveFit(account.id, offering);
  const score = fit?.score ?? null;
  const tier = score != null ? tierForScore(score) : null;
  const rgif = getRGIF(account.id) || account.rgif || {};
  const installs = rgif.installs;
  const intentList = rgif.intent;

  return (
    <tr
      onClick={() => onOpen?.(account)}
      className="border-b border-border/40 hover:bg-bg/40 cursor-pointer transition-colors"
    >
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          {account.logoColor && (
            <div
              className="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center text-white flex-shrink-0"
              style={{ background: account.logoColor }}
            >
              {account.name?.split(' ')[0]?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {tier && (
                <span
                  className={`inline-flex w-5 h-5 rounded-full items-center justify-center text-[9px] font-bold ${tier.bg} ${tier.color} flex-shrink-0`}
                  title={`Fit: ${score}`}
                >
                  {tier.label}
                </span>
              )}
              <span className="text-[13px] text-text-primary font-medium truncate">{account.name}</span>
              {onOpenChat && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenChat(account);
                  }}
                  className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 transition-colors"
                  title={`Open AI chat for ${account.name}`}
                >
                  <Bot size={11} />
                </button>
              )}
              <SubsidiariesIndicator
                subsidiaries={account.subsidiaries}
                expanded={isExpanded}
                onToggle={onToggleExpand}
              />
            </div>
            <div className="text-[10px] text-text-muted truncate">
              {account.industry || '—'}{account.fai?.hq ? ` · ${account.fai.hq}` : ''}
            </div>
          </div>
        </div>
      </td>
      <td className="px-2 py-2 text-[11px] text-text-secondary text-right w-16 font-mono">
        {account.fai?.employees || '—'}
      </td>
      <td className="px-2 py-2 text-[11px] text-text-secondary text-right w-20 font-mono">
        {account.fai?.revenue || '—'}
      </td>
      <td className="px-2 py-2 w-28">
        <BuyingCommitteeCell count={account.stakeholdersCount} />
      </td>
      <td className="px-2 py-2 min-w-[170px]">
        <CompetitiveCell tenantCompetitors={tenantCompetitors} installs={installs} />
      </td>
      <td className="px-2 py-2 min-w-[170px]">
        <IntentCell tenantIntentTopics={tenantIntentTopics} intentList={intentList} />
      </td>
      <td className="px-2 py-2 min-w-[170px]">
        <PartnerCell tenantComplementaryTech={tenantComplementaryTech} installs={installs} />
      </td>
      <td className="px-2 py-2 align-top min-w-[260px]">
        <HgIntelligenceCell intelligence={getHgIntelligence(account.id)} />
      </td>
    </tr>
  );
}

function OfferingSection({
  offering,
  accounts,
  source,
  onOpenAccount,
  onOpenAccountChat,
  onActivate,
  onAddToBook,
  onViewAll,
  tenantCompetitors,
  tenantIntentTopics,
  tenantComplementaryTech,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [topN] = useState(TOP_N_DEFAULT);
  // Subsidiary expand/collapse, scoped per section so an account expanded
  // in one section doesn't auto-expand in another.
  const [expandedSubs, setExpandedSubs] = useState(() => new Set());
  const toggleSubs = (accountId) => {
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) next.delete(accountId);
      else next.add(accountId);
      return next;
    });
  };

  // Rank accounts by their fit-for-this-offering score; drop anything with
  // null score (didn't match the offering at all). resolveFit handles both
  // legacy offerings (id matches FITS key) and wizard-saved offerings
  // (id like 'wiz-cnapp' with a key field that maps to FITS).
  const ranked = accounts
    .map((a) => ({ account: a, fit: resolveFit(a.id, offering) }))
    .filter((x) => x.fit && x.fit.score != null)
    .sort((a, b) => (b.fit.score ?? 0) - (a.fit.score ?? 0));

  const tierCounts = ranked.reduce(
    (acc, r) => {
      const t = tierForScore(r.fit.score)?.label || 'D';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    },
    { A: 0, B: 0, C: 0, D: 0 },
  );

  const visible = ranked.slice(0, topN);
  const remaining = Math.max(0, ranked.length - topN);

  return (
    <section className={`bg-surface border ${offering.borderColor || 'border-border'} rounded-md overflow-hidden`}>
      {/* Section header */}
      <div className={`flex items-center gap-3 px-4 py-3 ${offering.bg || 'bg-bg/40'} border-b ${offering.borderColor || 'border-border'}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-text-muted hover:text-text-primary flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
        <Package size={14} className={offering.textColor || 'text-text-secondary'} />
        <h3 className={`text-sm font-semibold ${offering.textColor || 'text-text-primary'}`}>
          {offering.name}
        </h3>
        <span className="text-[11px] text-text-muted">
          · {ranked.length} matching {ranked.length === 1 ? 'account' : 'accounts'}
        </span>
        {ranked.length > 0 && <div className="ml-2"><MiniTierBar counts={tierCounts} /></div>}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => onViewAll?.(offering.id)}
            className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5 font-semibold"
          >
            View all in {offering.shortName || offering.name}
            <ArrowRight size={10} />
          </button>
        </div>
      </div>

      {/* Section body */}
      {!collapsed && (
        <>
          {ranked.length === 0 ? (
            <div className="text-center px-4 py-8 text-[12px] text-text-muted">
              No {source === 'book' ? 'book' : source === 'whitespace' ? 'whitespace' : source === 'needs_review' ? 'unmatched' : ''} accounts match
              this offering's ICP yet.
              <div className="text-[11px] text-text-muted/70 mt-1">
                Refine the ICP in <span className="font-mono">/admin/offerings/{offering.id}</span> or enrich the universe to surface more.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-bg/20 text-text-muted">
                  <tr>
                    <th className="text-left text-[10px] uppercase tracking-wider font-semibold px-3 py-2 min-w-[220px]">Account</th>
                    <th className="text-right text-[10px] uppercase tracking-wider font-semibold px-2 py-2 w-16">Emp</th>
                    <th className="text-right text-[10px] uppercase tracking-wider font-semibold px-2 py-2 w-20">Revenue</th>
                    <th className="text-left text-[10px] uppercase tracking-wider font-semibold px-2 py-2 w-28">
                      <Users size={9} className="inline mr-1 text-sky-500" /> BC contacts
                    </th>
                    <th className="text-left text-[10px] uppercase tracking-wider font-semibold px-2 py-2 min-w-[170px]">
                      <Swords size={9} className="inline mr-1 text-rose-500" /> Competitive
                    </th>
                    <th className="text-left text-[10px] uppercase tracking-wider font-semibold px-2 py-2 min-w-[170px]">
                      <Sparkles size={9} className="inline mr-1 text-violet-500" /> Intent
                    </th>
                    <th className="text-left text-[10px] uppercase tracking-wider font-semibold px-2 py-2 min-w-[170px]">
                      <Handshake size={9} className="inline mr-1 text-sky-500" /> Partner stack
                    </th>
                    <th className="text-left text-[10px] uppercase tracking-wider font-semibold px-2 py-2 min-w-[260px]">
                      <Sparkles size={9} className="inline mr-1 text-violet-500" /> HG Intelligence
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => {
                    const isExpanded = expandedSubs.has(r.account.id);
                    const subs = Array.isArray(r.account.subsidiaries) ? r.account.subsidiaries : [];
                    return (
                      <Fragment key={r.account.id}>
                        <CompactAccountRow
                          account={r.account}
                          offering={offering}
                          isBook={r.account.source !== 'hg'}
                          isExpanded={isExpanded}
                          onToggleExpand={() => toggleSubs(r.account.id)}
                          onOpen={onOpenAccount}
                          onOpenChat={onOpenAccountChat}
                          onActivate={onActivate}
                          onAddToBook={onAddToBook}
                          tenantCompetitors={tenantCompetitors}
                          tenantIntentTopics={tenantIntentTopics}
                          tenantComplementaryTech={tenantComplementaryTech}
                        />
                        {isExpanded && subs.map((sub, idx) => {
                          const subName = typeof sub === 'string' ? sub : sub.name;
                          const subEmp = typeof sub === 'object' ? sub.employees : '';
                          return (
                            <tr
                              key={`${r.account.id}-sub-${idx}`}
                              className="border-b border-border/30 bg-violet-500/[0.03]"
                            >
                              <td className="px-3 py-1.5">
                                <div className="flex items-center gap-1.5 pl-8">
                                  <CornerDownRight size={11} className="text-violet-500/70 flex-shrink-0" />
                                  <span className="text-[12px] text-text-secondary">{subName}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1.5 text-right text-[11px] text-text-secondary font-mono">
                                {subEmp || '—'}
                              </td>
                              {/* Revenue · BC · Competitive · Intent · Partner · HG Intelligence */}
                              {Array.from({ length: 6 }).map((_, i) => (
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

              {remaining > 0 && (
                <div className="px-4 py-2 border-t border-border/40 bg-bg/20">
                  <button
                    onClick={() => onViewAll?.(offering.id)}
                    className="text-[11px] text-text-secondary hover:text-primary inline-flex items-center gap-1"
                  >
                    +{remaining} more · view all in {offering.shortName || offering.name}
                    <ArrowRight size={10} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default function WorkbookSegmented({
  accounts,
  offerings,
  source,
  onOpenAccount,
  onOpenAccountChat,
  onActivate,
  onAddToBook,
  onViewAll,
}) {
  // Aggregate tenant context across confirmed offerings so each row's
  // Competitive / Intent / Partner cells get the same matching surface
  // SellerWorkbookTable uses. Dedupe by lowercase name.
  const confirmedOfferings = (offerings || []).filter((o) => o.confirmed !== false);
  const tenantCompetitors = [];
  const tenantIntentTopics = [];
  const tenantComplementaryTech = [];
  {
    const seenC = new Set(), seenI = new Set(), seenT = new Set();
    for (const o of confirmedOfferings) {
      (o.competitors || []).forEach((c) => {
        const name = typeof c === 'string' ? c : c.name;
        if (name && !seenC.has(name.toLowerCase())) {
          seenC.add(name.toLowerCase());
          tenantCompetitors.push(c);
        }
      });
      (o.intentTopics || []).forEach((t) => {
        const name = typeof t === 'string' ? t : t.name;
        if (name && !seenI.has(name.toLowerCase())) {
          seenI.add(name.toLowerCase());
          tenantIntentTopics.push(t);
        }
      });
      (o.complementaryTech || []).forEach((t) => {
        const name = typeof t === 'string' ? t : t.name;
        if (name && !seenT.has(name.toLowerCase())) {
          seenT.add(name.toLowerCase());
          tenantComplementaryTech.push(t);
        }
      });
    }
  }

  if (!offerings || offerings.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <Package size={28} className="mx-auto mb-2 text-text-muted/50" />
        <div className="text-sm font-semibold text-text-primary mb-1">No offerings configured</div>
        <div className="text-[12px]">Confirm offerings in Admin Hub to populate the segmented workbook.</div>
      </div>
    );
  }

  // Sort sections by account count desc so the busiest pipeline rises to the top.
  const sortedOfferings = [...offerings].sort((a, b) => {
    const countA = accounts.filter((acc) => (resolveFit(acc.id, a)?.score ?? 0) > 0).length;
    const countB = accounts.filter((acc) => (resolveFit(acc.id, b)?.score ?? 0) > 0).length;
    return countB - countA;
  });

  return (
    <div className="space-y-3">
      {/* Banner: filters + enrich apply across all sections */}
      <div className="px-3 py-2 rounded-md bg-bg/40 border border-border text-[11px] text-text-secondary flex items-center gap-2 flex-wrap">
        <Sparkles size={11} className="text-violet-500 flex-shrink-0" />
        <span>
          <strong className="text-text-primary">Filters and Enrich-with-AI apply across all sections.</strong>{' '}
          Click <strong>View all in {'{offering}'}</strong> on any section to drop into Flat view with the
          offering lens applied + enriched columns visible.
        </span>
      </div>

      {sortedOfferings.map((offering) => (
        <OfferingSection
          key={offering.id}
          offering={offering}
          accounts={accounts}
          source={source}
          onOpenAccount={onOpenAccount}
          onOpenAccountChat={onOpenAccountChat}
          onActivate={onActivate}
          onAddToBook={onAddToBook}
          onViewAll={onViewAll}
          tenantCompetitors={tenantCompetitors}
          tenantIntentTopics={tenantIntentTopics}
          tenantComplementaryTech={tenantComplementaryTech}
        />
      ))}
    </div>
  );
}
