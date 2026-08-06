import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sunrise, ArrowRight, ArrowUpRight, CheckCircle2, Clock, AlertTriangle,
  ShieldCheck, Zap, TrendingUp, TrendingDown, Globe, Activity, UserCog, Building2,
  Wand2, CalendarClock, ChevronRight, ChevronDown, Layers, Repeat, Circle, Sparkles,
  Users, Sword, Handshake, Bell,
} from 'lucide-react';
import { usePersona } from '../context/PersonaContext.jsx';
import {
  summarizePlayActivity,
  summarizeBrief,
  listMeetingsNeedingPrep,
  listBriefWorkbooks,
} from '../data/dailyBrief.js';
import {
  listPendingCheckpoints,
  listSignalTriggeredPlays,
  relativeTime,
} from '../data/sellerInbox.js';
import { prioritizedAttentionQueue, signalBoard } from '../data/homeRanking.js';
import {
  resolveTargetScope,
  listScopeOptions,
  setTargetWorkbook,
  clearTargetWorkbook,
  subscribeTargetScope,
} from '../data/targetScope.js';
import { listSignalFirings } from '../data/signalFirings.js';
import { getAccountById } from '../data/accounts.js';
import TargetAccountCard from '../components/home/TargetAccountCard.jsx';

// Time-window options in the header.
const WINDOWS = [
  { id: 'since_yesterday', label: 'Since yesterday' },
  { id: 'this_week',       label: 'This week' },
  { id: 'this_month',      label: 'This month' },
];

// Icon lookup — the signalCatalog category-icon names map onto lucide
// components here. Extended to cover every one of the 9 board categories.
const CATEGORY_ICON = {
  TrendingUp,
  TrendingDown,
  Globe,
  UserCog,
  Building2,
  Activity,
  Sparkles,
  Users,
  Sword,
  Handshake,
  AlertTriangle,
};

// -----------------------------------------------------------------------------
// Section 1 · Attention Queue — grounded in the 24-signal catalog + weights
//
// Each row = one account × its highest-weight signal + a primary NBA button.
// Secondary signals surface as "+N more risks" chips. Copilot approvals +
// meeting-prep debt appear as sentinel rows at the top of the queue when
// present.
// -----------------------------------------------------------------------------

function AttentionQueueSection({ queue, checkpoints, triggered, meetings }) {
  const navigate = useNavigate();
  const sentinels = [];
  if (checkpoints.length > 0) {
    sentinels.push({
      key: 'sentinel-approvals',
      icon: ShieldCheck,
      tone: 'amber',
      title: `${checkpoints.length} draft${checkpoints.length === 1 ? '' : 's'} waiting for your approval`,
      desc: `From ${new Set(checkpoints.map((c) => c.workflow_name)).size} play${new Set(checkpoints.map((c) => c.workflow_name)).size === 1 ? '' : 's'} the copilot ran overnight`,
      ctaLabel: 'Review approvals',
      onClick: () => navigate('/admin/plays'),
    });
  }
  if (triggered.length > 0) {
    sentinels.push({
      key: 'sentinel-triggered',
      icon: Zap,
      tone: 'rose',
      title: `${triggered.length} signal-triggered play${triggered.length === 1 ? '' : 's'} queued`,
      desc: 'Copilot detected a trigger event — review the play run before it lands',
      ctaLabel: 'Review plays',
      onClick: () => navigate('/admin/plays'),
    });
  }
  if (meetings.length > 0) {
    sentinels.push({
      key: 'sentinel-meetings',
      icon: CalendarClock,
      tone: 'sky',
      title: `${meetings.length} meeting${meetings.length === 1 ? '' : 's'} without a brief`,
      desc: meetings.map((m) => `${m.accountName} · ${m.whenRelative}`).join(' · '),
      ctaLabel: 'Prep meetings',
      onClick: () => navigate('/workbook'),
    });
  }

  const empty = sentinels.length === 0 && queue.length === 0;
  if (empty) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center">
          <ShieldCheck size={12} className="text-amber-700 dark:text-amber-300" />
        </div>
        <h2 className="text-sm font-semibold text-text-primary">Needs your attention</h2>
        <span className="text-[11px] text-text-muted">
          {sentinels.length + queue.length} item{(sentinels.length + queue.length) === 1 ? '' : 's'} · ranked by urgency
        </span>
      </div>

      {sentinels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          {sentinels.map((s) => <SentinelCard key={s.key} {...s} />)}
        </div>
      )}

      {queue.length > 0 && (
        <div className="bg-surface border border-border rounded-md divide-y divide-border overflow-hidden">
          {queue.map((row) => <AttentionRow key={row.accountId} row={row} />)}
        </div>
      )}
    </section>
  );
}

function SentinelCard({ icon: Icon, tone, title, desc, ctaLabel, onClick }) {
  const toneMap = {
    amber: { border: 'border-amber-500/30 bg-amber-500/5', color: 'text-amber-700 dark:text-amber-300' },
    rose:  { border: 'border-rose-500/30 bg-rose-500/5',   color: 'text-rose-700 dark:text-rose-300' },
    sky:   { border: 'border-sky-500/30 bg-sky-500/5',     color: 'text-sky-700 dark:text-sky-300' },
  }[tone] || { border: 'border-border bg-surface', color: 'text-text-secondary' };
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-md border transition-all hover:brightness-105 ${toneMap.border}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="w-7 h-7 rounded-md bg-white/50 dark:bg-black/20 flex items-center justify-center flex-shrink-0">
          <Icon size={13} className={toneMap.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-text-primary leading-snug">{title}</div>
          <div className="text-[10px] text-text-secondary leading-snug mt-0.5">{desc}</div>
        </div>
      </div>
      <div className={`text-[11px] font-semibold flex items-center gap-1 ${toneMap.color}`}>
        {ctaLabel}
        <ArrowRight size={10} />
      </div>
    </button>
  );
}

// One row per attention-eligible account. Primary signal drives the CTA;
// secondary signals surface as "+N more" chips with a hover tooltip.
function AttentionRow({ row }) {
  const navigate = useNavigate();
  const { accountId, accountName, accountLogo, primary, secondary } = row;
  const category = primary.definition.category;
  const nbaVerb = primary.definition.nba?.verb || 'Take action';
  const secondaryTitles = secondary.map((s) => s.definition.description).join('\n');

  const handlePrimaryAction = (e) => {
    e.stopPropagation();
    // Route by NBA agent — content drafts go to the account chat; discovery
    // opens the wizard; the rest jump to the account card where the rep
    // can pick up in context.
    const agent = primary.definition.nba?.agent;
    if (agent === 'find_buying_personas') {
      navigate(`/plays/new?workbook=wb-icp-match&records=${accountId}`);
      return;
    }
    if (agent === 'draft_personalized_email' || agent === 'generate_account_brief') {
      navigate(`/account/${accountId}?agent=${agent}`);
      return;
    }
    navigate(`/account/${accountId}`);
  };

  return (
    <div
      onClick={() => navigate(`/account/${accountId}`)}
      className="flex items-center gap-3 px-4 py-3 hover:bg-bg/40 transition-colors cursor-pointer"
    >
      <div
        className="w-8 h-8 rounded text-[11px] font-bold text-white flex items-center justify-center flex-shrink-0"
        style={{ background: accountLogo || '#64748b' }}
      >
        {(accountName || '?').split(' ').map((w) => w[0]).slice(0, 2).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-text-primary truncate">{accountName}</span>
          <CategoryPill categoryId={category} />
        </div>
        <div className="text-[11px] text-text-secondary leading-snug truncate mt-0.5">
          {primary.definition.description}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono text-text-muted">
            weight {primary.weight}
          </span>
          {secondary.length > 0 && (
            <span
              className="text-[10px] text-text-muted italic"
              title={secondaryTitles}
            >
              · +{secondary.length} more risk{secondary.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={handlePrimaryAction}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold bg-primary text-white rounded hover:bg-primary-dim transition-colors flex-shrink-0"
      >
        {nbaVerb}
        <ArrowRight size={10} />
      </button>
    </div>
  );
}

// Small colored pill for the signal category — used on Attention rows and
// (indirectly) on the Signal Board tile headers.
function CategoryPill({ categoryId }) {
  const cats = {
    deal_health: { label: 'Deal Health', bg: 'bg-rose-500/10', color: 'text-rose-700 dark:text-rose-300' },
    engagement: { label: 'Engagement', bg: 'bg-amber-500/10', color: 'text-amber-700 dark:text-amber-300' },
    relationship_coverage: { label: 'Coverage', bg: 'bg-orange-500/10', color: 'text-orange-700 dark:text-orange-300' },
    deal_risk: { label: 'Deal Risk', bg: 'bg-red-500/10', color: 'text-red-700 dark:text-red-300' },
    buyer_intent: { label: 'Buyer Intent', bg: 'bg-emerald-500/10', color: 'text-emerald-700 dark:text-emerald-300' },
    account_health: { label: 'Account Health', bg: 'bg-violet-500/10', color: 'text-violet-700 dark:text-violet-300' },
    competitive: { label: 'Competitive', bg: 'bg-rose-500/10', color: 'text-rose-700 dark:text-rose-300' },
    partner: { label: 'Partner', bg: 'bg-sky-500/10', color: 'text-sky-700 dark:text-sky-300' },
    momentum: { label: 'Momentum', bg: 'bg-blue-500/10', color: 'text-blue-700 dark:text-blue-300' },
    first_party_activity: { label: '1P Activity', bg: 'bg-sky-500/10', color: 'text-sky-700 dark:text-sky-300' },
  }[categoryId] || { label: categoryId, bg: 'bg-surface-2', color: 'text-text-secondary' };
  return (
    <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${cats.bg} ${cats.color}`}>
      {cats.label}
    </span>
  );
}

// Kept for backwards-compat with any external consumer — no-op now.
function NeedsYouCard({ icon: Icon, tone, title, desc, count, primaryLabel, disabled }) {
  const toneMap = {
    amber: 'border-amber-500/30 bg-amber-500/5',
    rose:  'border-rose-500/30 bg-rose-500/5',
    sky:   'border-sky-500/30 bg-sky-500/5',
  };
  const iconColor = {
    amber: 'text-amber-700 dark:text-amber-300',
    rose:  'text-rose-700 dark:text-rose-300',
    sky:   'text-sky-700 dark:text-sky-300',
  };
  const stateCls = disabled
    ? 'border-border bg-bg/40 opacity-60'
    : toneMap[tone] || 'border-border bg-surface';

  return (
    <div className={`p-3 rounded-md border transition-all ${stateCls}`}>
      <div className="flex items-start gap-2 mb-2">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
          disabled ? 'bg-surface-2' : `bg-white/50 dark:bg-black/20`
        }`}>
          <Icon size={13} className={disabled ? 'text-text-muted' : iconColor[tone]} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-text-primary leading-snug">{title}</div>
          <div className="text-[10px] text-text-secondary leading-snug mt-0.5">{desc}</div>
        </div>
        {count > 0 && !disabled && (
          <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${iconColor[tone]} bg-white/60 dark:bg-black/30`}>
            {count}
          </span>
        )}
      </div>
      {!disabled && (
        <button className={`w-full text-[11px] font-semibold px-2 py-1.5 rounded transition-colors border ${
          tone === 'amber' ? 'border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15' :
          tone === 'rose' ? 'border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/15' :
          'border-sky-500/30 text-sky-700 dark:text-sky-300 hover:bg-sky-500/15'
        }`}>
          {primaryLabel}
          <ArrowRight size={10} className="inline ml-1" />
        </button>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Section 2 · Signals grouped by type
// -----------------------------------------------------------------------------

function SignalsSection({ tiles }) {
  if (!tiles || tiles.length === 0) {
    return (
      <section className="mb-6">
        <SectionHeader icon={Zap} title="Signal Board" hint="What changed on your accounts overnight" />
        <div className="bg-surface border border-dashed border-border rounded-md p-8 text-center text-[11px] text-text-muted">
          No signals fired in your book in the current window.
        </div>
      </section>
    );
  }
  const totalFirings = tiles.reduce((s, t) => s + t.count, 0);
  return (
    <section className="mb-6">
      <SectionHeader
        icon={Zap}
        title="Signal Board"
        hint={`${totalFirings} firing${totalFirings === 1 ? '' : 's'} across ${tiles.length} categor${tiles.length === 1 ? 'y' : 'ies'} — grounded in the account-signals catalog`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tiles.map((t) => (
          <SignalTile key={t.category.id} tile={t} />
        ))}
      </div>
    </section>
  );
}

// Short badge label for the per-row workbook chip. Falls back to the first
// three characters of the workbook name if we don't have a curated shorthand.
function workbookBadgeLabel(wb) {
  if (!wb) return '';
  const n = (wb.name || '').toLowerCase();
  if (n.includes('icp match')) return 'ICP';
  if (n.includes('q3')) return 'Q3';
  if (n.includes('book of accounts') || n === 'book') return 'Book';
  if (wb.isContactList) return 'Contacts';
  if (n.startsWith('saved list')) return 'Saved';
  return (wb.name || '').split(/\s+/).slice(0, 1).join('').slice(0, 6);
}

function SignalTile({ tile }) {
  const navigate = useNavigate();
  const Icon = CATEGORY_ICON[tile.category.icon] || Zap;
  const remaining = Math.max(0, tile.accountCount - tile.topAccounts.length);

  return (
    <div className={`p-3 rounded-md border ${tile.category.border} ${tile.category.bg} flex flex-col`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-md bg-white/60 dark:bg-black/20 flex items-center justify-center">
          <Icon size={13} className={tile.category.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold ${tile.category.color}`}>{tile.category.label}</span>
            <span className={`text-[10px] font-mono font-bold ${tile.category.color}`}>{tile.count}</span>
          </div>
          <div className="text-[10px] text-text-muted leading-snug">{tile.category.hint}</div>
        </div>
      </div>

      {/* Sub-signal chips — the specific signal types firing in this category. */}
      {tile.subSignals?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tile.subSignals.map((sig) => (
            <span
              key={sig.id}
              title={sig.description}
              className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-white/60 dark:bg-black/20 ${tile.category.color}`}
            >
              {sig.id.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-1 flex-1">
        {tile.topAccounts.map((a) => (
          <button
            key={a.id}
            onClick={() => navigate(`/account/${a.id}`)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-white/50 dark:bg-black/20 hover:bg-white/70 dark:hover:bg-black/30 transition-colors text-left"
          >
            <div
              className="w-6 h-6 rounded text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0"
              style={{ background: a.logoColor || '#64748b' }}
            >
              {(a.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-text-primary truncate">{a.name}</div>
              <div className="text-[10px] text-text-muted truncate">{a.signalDescription}</div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate(`/workbook?signalCategory=${tile.category.id}`)}
        className={`mt-2 text-[10px] font-semibold self-start inline-flex items-center gap-1 ${tile.category.color} hover:underline`}
      >
        {remaining > 0
          ? <>+{remaining} more &middot; view all in workbook</>
          : <>View all in workbook</>}
        <ArrowRight size={9} />
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Section 3 · Sales Play activity
// -----------------------------------------------------------------------------

function PlayActivitySection({ summaries }) {
  if (!summaries || summaries.length === 0) {
    return (
      <section className="mb-6">
        <SectionHeader icon={Wand2} title="Sales Play activity" hint="Copilot execution across your book" />
        <div className="bg-surface border border-dashed border-border rounded-md p-8 text-center text-[11px] text-text-muted">
          No plays have run in this window. Activate a play from the workbook to see execution surface here.
        </div>
      </section>
    );
  }
  return (
    <section className="mb-6">
      <SectionHeader
        icon={Wand2}
        title="Sales Play activity"
        hint={`${summaries.length} play${summaries.length === 1 ? '' : 's'} active · what the copilot ran overnight`}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {summaries.map((s) => <PlayActivityCard key={s.play.id} summary={s} />)}
      </div>
    </section>
  );
}

function PlayActivityCard({ summary }) {
  const navigate = useNavigate();
  const { play, completed, stuck, failed, waitingApproval, runningBatches, scheduledBatches, lastRunAt, totalRuns, audienceMode, addedSinceCount, droppedSinceCount } = summary;
  const total = completed + stuck + failed + waitingApproval + runningBatches;
  const pct = (n) => (total > 0 ? (n / total) * 100 : 0);
  const playType = play.type || 'outbound';
  const isDynamic = audienceMode === 'dynamic';

  return (
    <div className="bg-surface border border-border rounded-md p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-semibold text-text-primary">{play.name}</span>
            <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${
              playType === 'inbound'
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
            }`}>
              {playType}
            </span>
            <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${
              isDynamic
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-surface-2 text-text-secondary border-border'
            }`} title={isDynamic ? 'Audience re-evaluates on a cadence — new matches enter automatically' : 'Audience frozen at play creation'}>
              {isDynamic ? <Repeat size={9} /> : <Circle size={9} />}
              {isDynamic ? 'Dynamic' : 'Static'}
            </span>
          </div>
          <div className="text-[10px] text-text-muted">
            {totalRuns > 0
              ? <>{totalRuns} run{totalRuns === 1 ? '' : 's'} · last {lastRunAt ? relativeTime(lastRunAt) : 'recently'}</>
              : <>Batch scope · {scheduledBatches + runningBatches} batch{(scheduledBatches + runningBatches) === 1 ? '' : 'es'} in flight</>}
          </div>
        </div>
        <button
          onClick={() => navigate(`/admin/plays/${play.id}`)}
          className="text-text-muted hover:text-primary transition-colors flex-shrink-0"
          title="Open play detail"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Dynamic-audience delta strip — only appears when new/dropped records
          arrived in the last 24h. Clicking jumps to the play's Audience state
          section for review. */}
      {isDynamic && (addedSinceCount > 0 || droppedSinceCount > 0) && (
        <button
          onClick={() => navigate(`/admin/plays/${play.id}#audience`)}
          className="w-full text-left mt-2 mb-1 px-2 py-1.5 rounded border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors flex items-center gap-2"
        >
          <Repeat size={10} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0" />
          <div className="flex-1 min-w-0 text-[11px] text-emerald-700 dark:text-emerald-300">
            {addedSinceCount > 0 && (
              <>
                <span className="font-mono font-bold">+{addedSinceCount}</span> new record{addedSinceCount === 1 ? '' : 's'} since yesterday
              </>
            )}
            {addedSinceCount > 0 && droppedSinceCount > 0 && <span className="text-text-muted"> · </span>}
            {droppedSinceCount > 0 && (
              <>
                <span className="font-mono font-bold">{droppedSinceCount}</span> dropped
              </>
            )}
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 flex-shrink-0">
            Review →
          </span>
        </button>
      )}

      {/* Outcome bar — stacked segments */}
      <div className="mt-3 mb-1.5">
        <div className="h-2 w-full flex rounded-full overflow-hidden bg-surface-2">
          {completed > 0 && (
            <div className="h-full bg-emerald-500" style={{ width: `${pct(completed)}%` }} title={`${completed} completed`} />
          )}
          {runningBatches > 0 && (
            <div className="h-full bg-emerald-400/70" style={{ width: `${pct(runningBatches)}%` }} title={`${runningBatches} running`} />
          )}
          {waitingApproval > 0 && (
            <div className="h-full bg-amber-500" style={{ width: `${pct(waitingApproval)}%` }} title={`${waitingApproval} waiting`} />
          )}
          {stuck > 0 && (
            <div className="h-full bg-orange-500" style={{ width: `${pct(stuck)}%` }} title={`${stuck} stuck`} />
          )}
          {failed > 0 && (
            <div className="h-full bg-rose-500" style={{ width: `${pct(failed)}%` }} title={`${failed} failed`} />
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mt-2 text-[11px] flex-wrap">
        <StatChip color="emerald" icon={CheckCircle2} label="completed" value={completed + runningBatches} />
        {waitingApproval > 0 && <StatChip color="amber" icon={ShieldCheck} label="waiting review" value={waitingApproval} />}
        {stuck > 0 && <StatChip color="orange" icon={Clock} label="stuck" value={stuck} />}
        {failed > 0 && <StatChip color="rose" icon={AlertTriangle} label="failed" value={failed} />}
      </div>

      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 flex-wrap">
        {waitingApproval > 0 && (
          <button
            onClick={() => navigate(`/admin/plays/${play.id}`)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 rounded transition-colors"
          >
            <ShieldCheck size={10} />
            Review {waitingApproval} approval{waitingApproval === 1 ? '' : 's'}
          </button>
        )}
        <button
          onClick={() => navigate(`/admin/plays/${play.id}`)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-text-secondary border border-border hover:bg-surface-2 rounded transition-colors"
        >
          Open play detail
          <ArrowUpRight size={10} />
        </button>
      </div>
    </div>
  );
}

function StatChip({ color, icon: Icon, label, value }) {
  const cls = {
    emerald: 'text-emerald-700 dark:text-emerald-300',
    amber:   'text-amber-700 dark:text-amber-300',
    orange:  'text-orange-700 dark:text-orange-300',
    rose:    'text-rose-700 dark:text-rose-300',
  }[color] || 'text-text-secondary';
  return (
    <span className={`inline-flex items-center gap-1 ${cls}`}>
      <Icon size={11} />
      <span className="font-mono font-bold">{value}</span>
      <span className="text-text-muted">{label}</span>
    </span>
  );
}

// -----------------------------------------------------------------------------
// Header + shell
// -----------------------------------------------------------------------------

function SectionHeader({ icon: Icon, title, hint }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
        <Icon size={12} className="text-primary" />
      </div>
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      {hint && <span className="text-[11px] text-text-muted">{hint}</span>}
    </div>
  );
}

function formatBriefDate(date) {
  try {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function DailyBrief() {
  const navigate = useNavigate();
  const { personaId, persona } = usePersona();
  const salesRole = persona?.salesRole;
  const [windowId] = useState('since_yesterday');
  const [workbookScope, setWorkbookScope] = useState('all');
  const [scopePickerOpen, setScopePickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  // Target-scope subscription so a workbook flag change refreshes Home.
  const [scopeTick, setScopeTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    const unsub = subscribeTargetScope(() => setScopeTick((t) => t + 1));
    return unsub;
  }, []);

  const now = useMemo(() => new Date('2026-08-05'), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const targetScope = useMemo(() => resolveTargetScope(personaId), [personaId, scopeTick]);
  const scopeOptions = useMemo(() => listScopeOptions(personaId), [personaId]);
  const targetAccounts = useMemo(() => {
    return targetScope.accountIds
      .map((id) => getAccountById(id))
      .filter(Boolean);
  }, [targetScope.accountIds]);
  // Rank target accounts by total signal weight (highest first).
  const rankedAccounts = useMemo(() => {
    const scored = targetAccounts.map((a) => {
      const firings = listSignalFirings(personaId).filter((f) => f.accountId === a.id);
      const weightSum = firings.reduce((s, f) => s + (f.weight || 0), 0);
      return { account: a, weightSum, firingCount: firings.length };
    });
    scored.sort((a, b) => {
      if (b.weightSum !== a.weightSum) return b.weightSum - a.weightSum;
      return b.firingCount - a.firingCount;
    });
    return scored;
  }, [targetAccounts, personaId]);

  const availableWorkbooks = useMemo(() => listBriefWorkbooks(personaId), [personaId]);
  const workbookLookup = useMemo(() => {
    const map = {};
    for (const w of availableWorkbooks) map[w.id] = w;
    return map;
  }, [availableWorkbooks]);
  const checkpoints = useMemo(() => listPendingCheckpoints(personaId, salesRole), [personaId, salesRole]);
  const triggered = useMemo(() => listSignalTriggeredPlays(personaId), [personaId]);
  const meetings = useMemo(() => listMeetingsNeedingPrep(personaId), [personaId]);
  const attentionQueue = useMemo(
    () => prioritizedAttentionQueue(personaId, { limit: 10 }),
    [personaId],
  );
  const signalTiles = useMemo(() => signalBoard(personaId), [personaId]);
  const playSummaries = useMemo(
    () => summarizePlayActivity(personaId, salesRole, { workbookId: workbookScope }),
    [personaId, salesRole, workbookScope],
  );
  const summary = useMemo(
    () => summarizeBrief(personaId, salesRole, { workbookId: workbookScope }),
    [personaId, salesRole, workbookScope],
  );

  // Filter accounts by search query.
  const searchedAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rankedAccounts;
    return rankedAccounts.filter((r) =>
      (r.account.name || '').toLowerCase().includes(q)
      || (r.account.url || '').toLowerCase().includes(q)
    );
  }, [rankedAccounts, searchQuery]);

  const topAccounts = searchedAccounts.slice(0, 5);
  const restAccounts = searchedAccounts.slice(5, 5 + visibleCount);
  const hasMore = searchedAccounts.length > 5 + visibleCount;

  const handlePickScope = (opt) => {
    if (opt.id === '__crm_territory__') {
      clearTargetWorkbook(personaId);
    } else {
      setTargetWorkbook(personaId, opt.id);
    }
    setScopePickerOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center flex-shrink-0">
            <Sunrise size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-text-muted mb-0.5">Daily Brief · {formatBriefDate(now)}</div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Good morning, {persona?.name?.split(' ')[0] || 'Rep'}.
            </h1>
            <div className="text-sm text-text-secondary mt-1">
              {summary.needsYou > 0 ? (
                <>
                  <span className="font-semibold text-text-primary">{summary.needsYou}</span> item{summary.needsYou === 1 ? '' : 's'} need you
                </>
              ) : (
                <>All caught up on approvals</>
              )}
              {summary.signalAccountCount > 0 && (
                <> &middot; <span className="font-semibold text-text-primary">{summary.signalAccountCount}</span> account{summary.signalAccountCount === 1 ? '' : 's'} moved</>
              )}
              {summary.runningPlays > 0 && (
                <> &middot; <span className="font-semibold text-text-primary">{summary.runningPlays}</span> play{summary.runningPlays === 1 ? '' : 's'} active</>
              )}
            </div>
          </div>

          {/* Time-window toggle */}
          <div className="inline-flex items-center bg-surface border border-border rounded-md p-0.5 flex-shrink-0">
            {WINDOWS.map((w) => (
              <button
                key={w.id}
                onClick={() => {}}
                disabled={w.id !== 'since_yesterday'}
                title={w.id === 'since_yesterday' ? '' : 'Coming soon'}
                className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                  w.id === windowId
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-text-muted hover:text-text-primary disabled:cursor-not-allowed disabled:hover:text-text-muted'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Workbook scoper — visible when the rep has multiple workbooks.
          Narrows every section below to accounts / plays inside the chosen
          workbook. */}
      {availableWorkbooks.length > 1 && (
        <div className="mb-5 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted flex items-center gap-1">
            <Layers size={10} />
            Scope
          </span>
          <button
            onClick={() => setWorkbookScope('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] transition-colors inline-flex items-center gap-1.5 ${
              workbookScope === 'all'
                ? 'bg-primary/15 text-primary font-semibold border border-primary/30'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            All workbooks
            <span className="text-[10px] font-mono opacity-70">
              {availableWorkbooks.reduce((s, w) => s + (w.accountCount || 0), 0)}
            </span>
          </button>
          {availableWorkbooks.map((wb) => (
            <button
              key={wb.id}
              onClick={() => setWorkbookScope(wb.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-colors inline-flex items-center gap-1.5 ${
                workbookScope === wb.id
                  ? 'bg-primary/15 text-primary font-semibold border border-primary/30'
                  : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
              }`}
              title={wb.isContactList ? 'Contact-list workbook' : 'Company workbook'}
            >
              {wb.isContactList ? (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
              )}
              <span className="truncate max-w-[180px]">{wb.name}</span>
              <span className="text-[10px] font-mono opacity-70">{wb.accountCount || 0}</span>
            </button>
          ))}
        </div>
      )}

      {/* Target scope chip — sticky at top of Home. Priority chain:
          CRM territory → flagged workbook → Book of Accounts. */}
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
            <Layers size={10} />
            Target
          </div>
          <div className="relative">
            <button
              onClick={() => setScopePickerOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-md text-xs hover:border-primary/30 transition-colors"
            >
              <span className="font-semibold text-text-primary">{targetScope.workbookName}</span>
              <span className="text-text-muted font-mono">{targetScope.accountCount}</span>
              <ChevronDown size={12} className="text-text-muted" />
            </button>
            {scopePickerOpen && (
              <div className="absolute left-0 top-full mt-1 min-w-[240px] bg-surface border border-border rounded-md shadow-modal z-20 py-1 max-h-80 overflow-y-auto">
                {scopeOptions.length === 0 && (
                  <div className="px-3 py-2 text-[11px] text-text-muted italic">No scope options available.</div>
                )}
                {scopeOptions.map((opt) => {
                  const active =
                    (opt.id === '__crm_territory__' && targetScope.source === 'crm_territory')
                    || (opt.id === targetScope.workbookId);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handlePickScope(opt)}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-2 transition-colors ${active ? 'font-semibold text-primary' : 'text-text-secondary'}`}
                    >
                      <div className="flex items-center gap-2">
                        {active && <CheckCircle2 size={11} className="text-primary" />}
                        {!active && <div className="w-2.5 h-2.5" />}
                        <span>{opt.label}</span>
                        {opt.isPseudo && (
                          <span className="ml-auto text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            CRM
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
                <div className="border-t border-border mt-1 pt-1 px-3 py-1.5 text-[10px] text-text-muted leading-snug">
                  Only accounts in the selected scope appear on Home. Signals + plays follow scope automatically.
                </div>
              </div>
            )}
          </div>
          <span className="text-[11px] text-text-muted">
            {targetScope.source === 'crm_territory' ? 'From CRM territory' : targetScope.source === 'workbook' ? 'Workbook-flagged' : 'Default'}
          </span>
        </div>
        <div className="text-[11px] text-text-muted">
          {rankedAccounts.filter((r) => r.firingCount > 0).length} need attention · {rankedAccounts.reduce((s, r) => s + r.firingCount, 0)} signals
        </div>
      </div>

      {/* Sentinel row — approvals / triggered plays / meetings needing prep */}
      <AttentionQueueSection
        queue={[]} /* rows now live inline on each account card */
        checkpoints={checkpoints}
        triggered={triggered}
        meetings={meetings}
      />

      {/* Priority accounts — top 5 full cards */}
      {topAccounts.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-rose-500/10 flex items-center justify-center">
              <Zap size={12} className="text-rose-700 dark:text-rose-300" />
            </div>
            <h2 className="text-sm font-semibold text-text-primary">Priority accounts</h2>
            <span className="text-[11px] text-text-muted">
              Top {topAccounts.length} by signal weight
            </span>
          </div>
          <div className="space-y-3">
            {topAccounts.map((r) => (
              <TargetAccountCard key={r.account.id} account={r.account} mode="full" />
            ))}
          </div>
        </section>
      )}

      {/* All target accounts — compressed rows below with search + load-more */}
      {(restAccounts.length > 0 || searchQuery) && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <Building2 size={12} className="text-primary" />
              </div>
              <h2 className="text-sm font-semibold text-text-primary">All target accounts</h2>
              <span className="text-[11px] text-text-muted">
                {searchedAccounts.length} account{searchedAccounts.length === 1 ? '' : 's'}
              </span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search accounts..."
              className="px-2.5 py-1 text-xs bg-surface border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/40 w-56"
            />
          </div>
          {restAccounts.length === 0 && searchQuery ? (
            <div className="bg-surface border border-dashed border-border rounded-md p-6 text-center text-[11px] text-text-muted">
              No accounts match &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-md overflow-hidden">
              {restAccounts.map((r) => (
                <TargetAccountCard key={r.account.id} account={r.account} mode="compressed" />
              ))}
            </div>
          )}
          {hasMore && (
            <button
              onClick={() => setVisibleCount((v) => v + 20)}
              className="mt-3 w-full py-2 text-[11px] font-semibold text-primary border border-border rounded-md hover:bg-surface-2 transition-colors"
            >
              Load {Math.min(20, searchedAccounts.length - 5 - visibleCount)} more accounts
            </button>
          )}
        </section>
      )}

      {/* Signal Board — kept but pushed below the target-account feed as a
          zoomed-out complement. */}
      <SignalsSection tiles={signalTiles} />

      <PlayActivitySection summaries={playSummaries} />

      {/* Footer callout */}
      <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-[11px] text-text-muted flex-wrap gap-2">
        <div>
          The Brief refreshes as signals fire and plays run. Deltas are since <span className="font-semibold text-text-secondary">yesterday</span>.
        </div>
        <button
          onClick={() => navigate('/workbook')}
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          Open the workbook
          <ArrowRight size={10} />
        </button>
      </div>
    </div>
  );
}

