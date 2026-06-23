// WorkbookSwitcher — breadcrumb dropdown that swaps the active workbook.
//
// Renders inline as the second crumb after "Workbook · ". Click opens a
// grouped menu of workbooks the persona can see, with chips for source-
// type and account count. Bottom of the menu offers "+ New workbook"
// actions (upload CSV / connect CRM).

import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Sparkles,
  Plug,
  BookOpen,
  Upload,
  Layers,
  Plus,
  Check,
  Database,
} from 'lucide-react';
import {
  WORKBOOK_KINDS,
  WORKBOOK_KIND_META,
} from '../../data/workbooks.js';

const ICON_BY_NAME = {
  Sparkles,
  Plug,
  BookOpen,
  Upload,
  Layers,
};

function KindIcon({ kind, size = 11 }) {
  const meta = WORKBOOK_KIND_META[kind];
  const Icon = ICON_BY_NAME[meta?.icon] || Database;
  const tone = meta?.tone || 'text-text-muted';
  const colorClass = {
    violet: 'text-violet-700 dark:text-violet-300',
    sky: 'text-sky-700 dark:text-sky-300',
    primary: 'text-primary',
    emerald: 'text-emerald-700 dark:text-emerald-300',
    amber: 'text-amber-700 dark:text-amber-300',
  }[tone] || 'text-text-muted';
  return <Icon size={size} className={`flex-shrink-0 ${colorClass}`} />;
}

function KindBadge({ kind }) {
  const meta = WORKBOOK_KIND_META[kind];
  if (!meta) return null;
  const toneCls = {
    violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
    sky: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    primary: 'bg-primary/10 text-primary border-primary/30',
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  }[meta.tone] || 'bg-text-muted/10 text-text-secondary border-border';
  return (
    <span className={`text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded border ${toneCls}`}>
      {meta.label}
    </span>
  );
}

// Group workbooks by kind for the dropdown sections.
const GROUP_ORDER = [
  WORKBOOK_KINDS.MY_BOOK,
  WORKBOOK_KINDS.ICP_MATCH,
  WORKBOOK_KINDS.CRM_ACCOUNTS,
  WORKBOOK_KINDS.CUSTOM_CSV,
  WORKBOOK_KINDS.PROMOTED_SEGMENT,
];

export default function WorkbookSwitcher({
  workbooks,
  activeWorkbook,
  onPick,
  onUploadCsv,
  onConnectCrm,
  crmConnected = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Build groups in the canonical order; only render groups that have entries.
  const grouped = GROUP_ORDER.map((kind) => ({
    kind,
    items: workbooks.filter((w) => w.kind === kind),
  })).filter((g) => g.items.length > 0);

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-surface-2 transition-colors group"
        title="Switch workbook"
      >
        {activeWorkbook ? (
          <>
            <KindIcon kind={activeWorkbook.kind} size={13} />
            <span className="text-sm font-semibold text-text-primary truncate max-w-[260px]">
              {activeWorkbook.name}
            </span>
            <span className="text-[10px] font-mono text-text-muted">
              {activeWorkbook.accountCount?.toLocaleString?.() || 0}
            </span>
          </>
        ) : (
          <span className="text-sm font-semibold text-text-primary">Workbook</span>
        )}
        <ChevronDown size={11} className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-[420px] bg-bg border border-border rounded-md shadow-elev z-40 overflow-hidden">
          <div className="max-h-[420px] overflow-y-auto thin-scrollbar">
            {grouped.map((group) => {
              const meta = WORKBOOK_KIND_META[group.kind];
              return (
                <div key={group.kind}>
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-text-muted bg-bg/30 border-b border-border/40">
                    {meta?.label || group.kind}
                  </div>
                  {group.items.map((w) => {
                    const active = activeWorkbook?.id === w.id;
                    return (
                      <button
                        key={w.id}
                        onClick={() => {
                          onPick(w);
                          setOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-surface-2 transition-colors ${
                          active ? 'bg-primary/5' : ''
                        }`}
                      >
                        <KindIcon kind={w.kind} size={12} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-text-primary truncate">
                            {w.name}
                          </div>
                          {w.ownerName && w.kind !== WORKBOOK_KINDS.ICP_MATCH && w.kind !== WORKBOOK_KINDS.CRM_ACCOUNTS && (
                            <div className="text-[10px] text-text-muted truncate">
                              Owner: {w.ownerName} ·{' '}
                              {w.visibility === 'organization' ? 'Org-visible' : 'Private'}
                            </div>
                          )}
                          {meta?.description && (w.kind === WORKBOOK_KINDS.ICP_MATCH || w.kind === WORKBOOK_KINDS.CRM_ACCOUNTS) && (
                            <div className="text-[10px] text-text-muted truncate">{meta.description}</div>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-text-muted flex-shrink-0">
                          {w.accountCount?.toLocaleString?.() || 0}
                        </span>
                        {active && <Check size={11} className="text-primary flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* "+ New workbook" footer */}
          <div className="border-t border-border bg-surface/40">
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-text-muted">
              Add a workbook
            </div>
            <button
              onClick={() => {
                onUploadCsv?.();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-surface-2 transition-colors"
            >
              <Upload size={12} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-text-primary">Upload CSV</div>
                <div className="text-[10px] text-text-muted truncate">Bring your own list as a static workbook.</div>
              </div>
              <Plus size={11} className="text-text-muted flex-shrink-0" />
            </button>
            {!crmConnected && (
              <button
                onClick={() => {
                  onConnectCrm?.();
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-surface-2 transition-colors border-t border-border/40"
              >
                <Plug size={12} className="text-sky-700 dark:text-sky-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-text-primary">Connect CRM</div>
                  <div className="text-[10px] text-text-muted truncate">Unlock CRM Accounts + per-seller books.</div>
                </div>
                <Plus size={11} className="text-text-muted flex-shrink-0" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
