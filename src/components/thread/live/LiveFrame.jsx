import { Pin, RefreshCw, Sparkles, X } from 'lucide-react';
import { useToast } from '../../../context/ToastContext.jsx';

export function LiveFrame({ title, subtitle, badge, children, onPin, onRefresh, footer }) {
  const { showToast } = useToast();
  return (
    <div className="my-3 bg-surface-2 border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-primary/15 border border-primary/30 rounded text-[9px] uppercase tracking-wider text-primary font-bold">
            <Sparkles size={9} />
            Live
          </div>
          <div className="text-sm font-semibold text-text-primary truncate">{title}</div>
          {badge && (
            <span className="text-[10px] text-text-muted font-mono">{badge}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded hover:bg-bg/60 text-text-muted hover:text-text-secondary transition-colors"
              title="Refresh"
            >
              <RefreshCw size={12} />
            </button>
          )}
          <button
            onClick={() => {
              if (onPin) onPin();
              showToast('Snapshot pinned to artifact trail');
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-text-secondary hover:bg-bg/60 hover:text-text-primary transition-colors font-medium"
            title="Pin a snapshot of this view to the artifact trail"
          >
            <Pin size={11} />
            Pin
          </button>
        </div>
      </div>
      {subtitle && (
        <div className="px-4 pt-3 text-xs text-text-secondary">{subtitle}</div>
      )}
      <div className="p-4">{children}</div>
      {footer && <div className="px-4 py-2 border-t border-border bg-bg/40 text-xs text-text-muted">{footer}</div>}
    </div>
  );
}

export function FilterChip({ label, value, onRemove }) {
  return (
    <div className="inline-flex items-center gap-1.5 pl-2 pr-1 py-0.5 bg-bg border border-border rounded text-xs">
      <span className="text-text-muted">{label}:</span>
      <span className="text-text-primary">{value}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 p-0.5 rounded hover:bg-surface-2 text-text-muted hover:text-danger transition-colors"
          title={`Remove "${label}: ${value}" filter`}
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

export function HBar({ label, value, pct, max = 100, color = 'bg-primary', showCount = true, suffix }) {
  const widthPct = Math.min(100, (pct / max) * 100);
  return (
    <div className="grid grid-cols-[120px_1fr_auto] gap-3 items-center text-xs">
      <div className="text-text-secondary truncate">{label}</div>
      <div className="h-5 bg-bg/60 rounded relative overflow-hidden">
        <div
          className={`h-full ${color} rounded transition-all duration-500`}
          style={{ width: `${widthPct}%` }}
        />
        {showCount && (
          <div className="absolute inset-0 flex items-center px-2 text-[10px] font-mono text-text-primary">
            {value}
          </div>
        )}
      </div>
      <div className="text-text-primary font-mono w-14 text-right">{pct}%{suffix || ''}</div>
    </div>
  );
}
