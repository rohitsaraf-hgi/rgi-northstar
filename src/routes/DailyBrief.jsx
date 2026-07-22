import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sunrise, ArrowRight, ArrowUpRight, CheckCircle2, Clock, AlertTriangle,
  ShieldCheck, Zap, TrendingUp, Globe, Activity, UserCog, Building2,
  Wand2, CalendarClock, ChevronRight, Layers,
} from 'lucide-react';
import { usePersona } from '../context/PersonaContext.jsx';
import {
  groupSignalsForBrief,
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

// Time-window options in the header.
const WINDOWS = [
  { id: 'since_yesterday', label: 'Since yesterday' },
  { id: 'this_week',       label: 'This week' },
  { id: 'this_month',      label: 'This month' },
];

const CATEGORY_ICON = {
  TrendingUp, Globe, UserCog, Building2, Activity,
};

// -----------------------------------------------------------------------------
// Section 1 · What needs you
// -----------------------------------------------------------------------------

function NeedsYouSection({ checkpoints, triggered, meetings }) {
  const empty = checkpoints.length === 0 && triggered.length === 0 && meetings.length === 0;
  if (empty) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center">
          <ShieldCheck size={12} className="text-amber-700 dark:text-amber-300" />
        </div>
        <h2 className="text-sm font-semibold text-text-primary">What needs you</h2>
        <span className="text-[11px] text-text-muted">
          {checkpoints.length + triggered.length + meetings.length} action{(checkpoints.length + triggered.length + meetings.length) === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <NeedsYouCard
          icon={ShieldCheck}
          tone="amber"
          title={`${checkpoints.length} draft${checkpoints.length === 1 ? '' : 's'} waiting for approval`}
          desc={checkpoints.length > 0
            ? `Batch approvals from ${new Set(checkpoints.map((c) => c.workflow_name)).size} play${new Set(checkpoints.map((c) => c.workflow_name)).size === 1 ? '' : 's'}`
            : 'All caught up on approvals'}
          count={checkpoints.length}
          primaryLabel="Review approvals"
          primaryHref="#"
          disabled={checkpoints.length === 0}
        />
        <NeedsYouCard
          icon={Zap}
          tone="rose"
          title={`${triggered.length} signal-triggered play${triggered.length === 1 ? '' : 's'}`}
          desc={triggered.length > 0
            ? 'Copilot queued an outreach — review before it sends'
            : 'No triggered plays right now'}
          count={triggered.length}
          primaryLabel="Review plays"
          primaryHref="#"
          disabled={triggered.length === 0}
        />
        <NeedsYouCard
          icon={CalendarClock}
          tone="sky"
          title={`${meetings.length} meeting${meetings.length === 1 ? '' : 's'} need prep`}
          desc={meetings.length > 0
            ? meetings.map((m) => `${m.accountName} · ${m.whenRelative}`).join(' · ')
            : 'No prep debt today'}
          count={meetings.length}
          primaryLabel="Prep meetings"
          primaryHref="#"
          disabled={meetings.length === 0}
        />
      </div>
    </section>
  );
}

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

function SignalsSection({ groups, workbookLookup, activeWorkbookId }) {
  if (!groups || groups.length === 0) {
    return (
      <section className="mb-6">
        <SectionHeader icon={Zap} title="Signals" hint="What changed on your accounts overnight" />
        <div className="bg-surface border border-dashed border-border rounded-md p-8 text-center text-[11px] text-text-muted">
          No signals fired in your book in the current window.
        </div>
      </section>
    );
  }
  return (
    <section className="mb-6">
      <SectionHeader
        icon={Zap}
        title="Signals"
        hint={`${groups.reduce((s, g) => s + g.count, 0)} account-signals across ${groups.length} categor${groups.length === 1 ? 'y' : 'ies'}`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.map((g) => (
          <SignalTile
            key={g.category.id}
            group={g}
            workbookLookup={workbookLookup}
            activeWorkbookId={activeWorkbookId}
          />
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

function SignalTile({ group, workbookLookup, activeWorkbookId }) {
  const navigate = useNavigate();
  const Icon = CATEGORY_ICON[group.category.icon] || Zap;
  const top = group.accounts.slice(0, 3);
  const overflow = Math.max(0, group.accounts.length - top.length);

  return (
    <div className={`p-3 rounded-md border ${group.category.border} ${group.category.bg} flex flex-col`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-md bg-white/60 dark:bg-black/20 flex items-center justify-center`}>
          <Icon size={13} className={group.category.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold ${group.category.color}`}>{group.category.label}</span>
            <span className={`text-[10px] font-mono font-bold ${group.category.color}`}>+{group.count}</span>
          </div>
          <div className="text-[10px] text-text-muted leading-snug">{group.category.hint}</div>
        </div>
      </div>
      <div className="space-y-1 flex-1">
        {top.map((a) => {
          const badges = (a.workbookIds || [])
            .map((wid) => workbookLookup?.[wid])
            .filter(Boolean);
          return (
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-text-primary truncate">{a.name}</span>
                  {/* Per-row workbook badges — hidden when the page is
                      already scoped to a specific workbook (redundant then). */}
                  {activeWorkbookId === 'all' && badges.length > 0 && (
                    <span className="inline-flex items-center gap-0.5">
                      {badges.slice(0, 3).map((wb) => (
                        <span
                          key={wb.id}
                          title={wb.name}
                          className={`text-[8px] uppercase tracking-wider font-bold px-1 py-0.5 rounded ${
                            wb.isContactList
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                              : 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                          }`}
                        >
                          {workbookBadgeLabel(wb)}
                        </span>
                      ))}
                      {badges.length > 3 && (
                        <span className="text-[8px] text-text-muted">+{badges.length - 3}</span>
                      )}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-text-muted truncate">{a.headline}</div>
              </div>
              {a.daysAgo != null && (
                <span className="text-[9px] font-mono text-text-muted flex-shrink-0">{a.daysAgo}d</span>
              )}
            </button>
          );
        })}
      </div>
      {overflow > 0 && (
        <button
          onClick={() => navigate(`/workbook?signalCategory=${group.category.id}`)}
          className={`mt-2 text-[10px] font-semibold self-start inline-flex items-center gap-1 ${group.category.color} hover:underline`}
        >
          +{overflow} more &middot; view all in workbook
          <ArrowRight size={9} />
        </button>
      )}
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
  const { play, completed, stuck, failed, waitingApproval, runningBatches, scheduledBatches, lastRunAt, totalRuns } = summary;
  const total = completed + stuck + failed + waitingApproval + runningBatches;
  const pct = (n) => (total > 0 ? (n / total) * 100 : 0);
  const playType = play.type || 'outbound';

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

  const now = useMemo(() => new Date('2026-07-22'), []);
  const availableWorkbooks = useMemo(() => listBriefWorkbooks(personaId), [personaId]);
  const workbookLookup = useMemo(() => {
    const map = {};
    for (const w of availableWorkbooks) map[w.id] = w;
    return map;
  }, [availableWorkbooks]);
  const checkpoints = useMemo(() => listPendingCheckpoints(personaId, salesRole), [personaId, salesRole]);
  const triggered = useMemo(() => listSignalTriggeredPlays(personaId), [personaId]);
  const meetings = useMemo(() => listMeetingsNeedingPrep(personaId), [personaId]);
  const signalGroups = useMemo(
    () => groupSignalsForBrief(personaId, { windowDays: 7, workbookId: workbookScope }),
    [personaId, workbookScope],
  );
  const playSummaries = useMemo(
    () => summarizePlayActivity(personaId, salesRole, { workbookId: workbookScope }),
    [personaId, salesRole, workbookScope],
  );
  const summary = useMemo(
    () => summarizeBrief(personaId, salesRole, { workbookId: workbookScope }),
    [personaId, salesRole, workbookScope],
  );

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

      {/* Sections */}
      <NeedsYouSection checkpoints={checkpoints} triggered={triggered} meetings={meetings} />
      <SignalsSection groups={signalGroups} workbookLookup={workbookLookup} activeWorkbookId={workbookScope} />
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

