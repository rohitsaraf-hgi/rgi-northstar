// Notification Center — bell icon + dropdown.
//
// Spec MACLAUDE.md §7. Surfaces up to 5 recent alerts. Each entry has
// a single action that bridges into the existing JTBD flow.
//
// Critical: the daily guardrail ("1 of 1 alert delivered today") is
// rendered as a footer so the user trusts the system won't spam them.
// This visibility IS the differentiator from typical SaaS notification
// UX — restraint as a feature, not a hidden setting.

import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  TrendingUp,
  Flame,
  AlertCircle,
  Activity,
  Shield,
  ChevronRight,
  X,
} from 'lucide-react';
import { useMACopilot } from '../../context/MarketAnalyzerCopilotContext.jsx';

const ICON_MAP = {
  'trending-up':  TrendingUp,
  flame:          Flame,
  'alert-circle': AlertCircle,
  activity:       Activity,
  bell:           Bell,
};

const ACCENT = {
  rose:   { fg: 'text-rose-700 dark:text-rose-300',       bg: 'bg-rose-500/8'   },
  amber:  { fg: 'text-amber-700 dark:text-amber-300',     bg: 'bg-amber-500/8'  },
  sky:    { fg: 'text-sky-700 dark:text-sky-300',         bg: 'bg-sky-500/8'    },
  violet: { fg: 'text-violet-700 dark:text-violet-300',   bg: 'bg-violet-500/8' },
};

function AlertEntry({ alert, onAction, onDismiss }) {
  const Icon = ICON_MAP[alert.icon] || Bell;
  const accent = ACCENT[alert.accent] || ACCENT.sky;
  return (
    <div className={`group relative px-3 py-2.5 border-b border-border/40 last:border-b-0 hover:bg-surface-2/60 transition-colors ${
      alert.read ? 'opacity-70' : ''
    }`}>
      <div className="flex items-start gap-2.5">
        <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${accent.bg}`}>
          <Icon size={13} className={accent.fg} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            {!alert.read && (
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
            <span className="text-[10px] text-text-muted">
              {alert.daysAgo === 0 ? 'today' : `${alert.daysAgo}d ago`}
            </span>
          </div>
          <div className="text-[12.5px] font-semibold text-text-primary leading-snug mb-0.5">
            {alert.headline}
          </div>
          <div className="text-[11px] text-text-secondary leading-relaxed">
            {alert.detail}
          </div>
          {alert.action && (
            <button
              onClick={() => onAction(alert)}
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-dim transition-colors"
            >
              {alert.action.label} <ChevronRight size={10} />
            </button>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(alert.id);
          }}
          className="flex-shrink-0 p-0.5 rounded text-text-muted hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Dismiss"
        >
          <X size={11} />
        </button>
      </div>
    </div>
  );
}

export default function NotificationCenter({ onAlertAction, openControl }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openControl?.value ?? internalOpen;
  const setOpen = openControl?.set ?? setInternalOpen;
  const { alerts, unreadAlertCount, dismissAlert, guardrail } = useMACopilot();
  const ref = useRef(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return undefined;
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open, setOpen]);

  const recent = alerts.slice(0, 5);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
          open
            ? 'bg-primary/15 text-primary'
            : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
        }`}
        title="Notifications"
      >
        <Bell size={14} />
        {unreadAlertCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold font-mono flex items-center justify-center">
            {unreadAlertCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-bg border border-border rounded-lg shadow-elev z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface/60">
            <div className="text-[11px] uppercase tracking-wider font-bold text-text-secondary">
              Notifications
            </div>
            {unreadAlertCount > 0 && (
              <span className="text-[10px] text-text-muted">{unreadAlertCount} unread</span>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto thin-scrollbar">
            {recent.length === 0 ? (
              <div className="px-3 py-8 text-center text-[12px] text-text-muted italic">
                You're all caught up.
              </div>
            ) : (
              recent.map((a) => (
                <AlertEntry
                  key={a.id}
                  alert={a}
                  onAction={(alert) => {
                    onAlertAction(alert);
                    setOpen(false);
                  }}
                  onDismiss={dismissAlert}
                />
              ))
            )}
          </div>

          {/* Guardrail footer — the spec's "visible restraint" mechanism */}
          <div className="px-3 py-2 border-t border-border bg-emerald-500/5 flex items-start gap-2">
            <Shield size={12} className="flex-shrink-0 text-emerald-700 dark:text-emerald-300 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-300">
                {guardrail.deliveredToday} of {guardrail.dailyCap} daily alert delivered today
              </div>
              <div className="text-[10px] text-text-muted leading-snug">
                {guardrail.helpText}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
