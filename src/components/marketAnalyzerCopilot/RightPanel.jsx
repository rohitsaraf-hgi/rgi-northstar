// Right panel — engagement-layer context (JTBD 7 + tracked competitors
// + recent alerts). Spec MACLAUDE.md §5.
//
// Collapsible. Three sections stacked top to bottom:
//   - Saved ICP Segments (JTBD 7) — clickable cards
//   - Tracked Competitors — delta + click to launch competitive intel
//     (JTBD 2 = P1; falls through to toast for now)
//   - Recent Alerts — last 3 alerts inline, "See all" opens the full
//     notification center via the bell icon

import { useMACopilot } from '../../context/MarketAnalyzerCopilotContext.jsx';
import SavedSegmentCard from './SavedSegmentCard.jsx';
import {
  ChevronsRight,
  ChevronsLeft,
  Bookmark,
  Target,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from 'lucide-react';

const COMPETITOR_TYPE_PILL = {
  competitor: { label: 'Compet.', fg: 'text-rose-700 dark:text-rose-300',       bg: 'bg-rose-500/10',     border: 'border-rose-500/30' },
  partner:    { label: 'Partner', fg: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
};

function SectionHeader({ icon: Icon, label, count, onAction, actionLabel }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <Icon size={11} className="text-text-muted" />
        <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted">
          {label}
        </span>
        {typeof count === 'number' && (
          <span className="text-[10px] font-mono font-semibold text-text-muted">· {count}</span>
        )}
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className="text-[10px] text-text-muted hover:text-primary transition-colors inline-flex items-center gap-0.5"
        >
          {actionLabel} <ArrowRight size={9} />
        </button>
      )}
    </div>
  );
}

function CompetitorRow({ competitor, onClick }) {
  const pill = COMPETITOR_TYPE_PILL[competitor.type] || COMPETITOR_TYPE_PILL.competitor;
  const Icon = competitor.trend === 'up' ? TrendingUp : competitor.trend === 'down' ? TrendingDown : Minus;
  const color =
    competitor.trend === 'up'   ? 'text-emerald-700 dark:text-emerald-300' :
    competitor.trend === 'down' ? 'text-rose-700 dark:text-rose-300' :
                                    'text-text-muted';
  return (
    <button
      onClick={() => onClick(competitor)}
      className="w-full text-left flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-surface-2 transition-colors"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`inline-flex items-center text-[9px] uppercase font-bold px-1 py-0.5 rounded border ${pill.bg} ${pill.fg} ${pill.border} flex-shrink-0`}>
          {pill.label}
        </span>
        <span className="text-[12px] font-semibold text-text-primary truncate">{competitor.name}</span>
      </div>
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold ${color} flex-shrink-0`}>
        <Icon size={10} />
        {competitor.signalDelta30d}
      </span>
    </button>
  );
}

function AlertRow({ alert, onClick }) {
  return (
    <button
      onClick={() => onClick(alert)}
      className="w-full text-left flex items-start gap-2 px-2 py-1.5 rounded hover:bg-surface-2 transition-colors"
    >
      <span
        className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${
          alert.read ? 'bg-text-muted/40' : 'bg-primary'
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] font-medium text-text-primary leading-snug line-clamp-2">
          {alert.headline}
        </div>
        <div className="text-[10px] text-text-muted mt-0.5">
          {alert.daysAgo === 0 ? 'today' : `${alert.daysAgo}d ago`}
        </div>
      </div>
    </button>
  );
}

export default function RightPanel({
  collapsed,
  onToggle,
  onSegmentAction,
  onCompetitorClick,
  onAlertClick,
  onSeeAllAlerts,
}) {
  const { savedSegments, trackedCompetitors, alerts, unreadAlertCount } = useMACopilot();
  const recentAlerts = alerts.slice(0, 3);

  if (collapsed) {
    return (
      <div className="w-10 border-l border-border bg-bg/50 flex flex-col items-center py-3 gap-2 flex-shrink-0">
        <button
          onClick={onToggle}
          className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
          title="Expand context panel"
        >
          <ChevronsLeft size={14} />
        </button>
        <div className="w-6 h-px bg-border" />
        <div title={`${savedSegments.length} saved segments`} className="text-[10px] text-text-muted font-bold">
          {savedSegments.length}
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 border-l border-border bg-bg/40 flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 flex-shrink-0">
        <div className="text-[11px] uppercase tracking-wider font-bold text-text-secondary">Context</div>
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-secondary transition-colors"
          title="Collapse"
        >
          <ChevronsRight size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-3 py-3 space-y-5">
        {/* Saved ICP Segments — JTBD 7 surface */}
        <div>
          <SectionHeader
            icon={Bookmark}
            label="Saved ICP Segments"
            count={savedSegments.length}
          />
          <div className="space-y-2">
            {savedSegments.map((seg) => (
              <SavedSegmentCard key={seg.id} segment={seg} onAction={onSegmentAction} />
            ))}
          </div>
        </div>

        {/* Tracked Competitors */}
        <div>
          <SectionHeader
            icon={Target}
            label="Tracked Competitors"
            count={trackedCompetitors.length}
          />
          <div className="space-y-0.5">
            {trackedCompetitors.map((c) => (
              <CompetitorRow key={c.id} competitor={c} onClick={onCompetitorClick} />
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div>
          <SectionHeader
            icon={Bell}
            label="Recent Alerts"
            count={unreadAlertCount}
            onAction={onSeeAllAlerts}
            actionLabel="See all"
          />
          <div className="space-y-0.5">
            {recentAlerts.length === 0 ? (
              <div className="px-2 py-3 text-center text-[11px] text-text-muted italic">No alerts</div>
            ) : (
              recentAlerts.map((a) => <AlertRow key={a.id} alert={a} onClick={onAlertClick} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
