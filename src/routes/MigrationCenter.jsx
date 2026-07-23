import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Layers, Wand2, Repeat, Bell,
  X, Sparkles, AlertTriangle, Circle, Zap, Clock, Undo2, ChevronRight,
  Info, Table,
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import {
  listLegacyPlaybooks,
  LEGACY_PLAYBOOK_STATUSES,
} from '../data/legacyPlaybooks.js';
import {
  analyzeMapping,
  performMigration,
  getMigrationState,
  undoMigration,
  subscribeMigrations,
  coexistenceDaysRemaining,
  migrationCounts,
  COEXISTENCE_DAYS,
} from '../data/playbookMigration.js';

// -----------------------------------------------------------------------------
// Confidence chip
// -----------------------------------------------------------------------------
function ConfidenceChip({ level }) {
  const cfg = {
    high:   { label: 'High confidence',   bg: 'bg-emerald-500/10', color: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/30', Icon: CheckCircle2 },
    medium: { label: 'Needs review',      bg: 'bg-amber-500/10',   color: 'text-amber-700 dark:text-amber-300',     border: 'border-amber-500/30',   Icon: Info },
    low:    { label: 'Needs configuring', bg: 'bg-rose-500/10',    color: 'text-rose-700 dark:text-rose-300',       border: 'border-rose-500/30',    Icon: AlertTriangle },
  }[level] || { label: level, bg: 'bg-surface-2', color: 'text-text-secondary', border: 'border-border', Icon: Circle };
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon size={9} />
      {cfg.label}
    </span>
  );
}

// -----------------------------------------------------------------------------
// Target chip — Workbook vs Sales Play (with type)
// -----------------------------------------------------------------------------
function TargetChip({ mapping }) {
  if (!mapping) return null;
  if (mapping.target === 'workbook') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30">
        <Table size={9} />
        Workbook
      </span>
    );
  }
  const isInbound = mapping.playType === 'inbound';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${
      isInbound ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
    }`}>
      {isInbound ? <Bell size={9} /> : <Repeat size={9} />}
      {isInbound ? 'Inbound' : 'Outbound'} Sales Play
    </span>
  );
}

// -----------------------------------------------------------------------------
// One playbook row
// -----------------------------------------------------------------------------
function PlaybookCard({ playbook, mapping, migrationState, onPreview, onQuickMigrate, onUndo }) {
  const statusCfg = LEGACY_PLAYBOOK_STATUSES[playbook.status];
  const isMigrated = Boolean(migrationState);
  const days = isMigrated ? coexistenceDaysRemaining(playbook.id) : null;

  return (
    <div className={`bg-surface border rounded-md p-4 transition-colors ${
      isMigrated ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border hover:border-primary/30'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-text-primary">{playbook.name}</span>
            {statusCfg && (
              <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                {statusCfg.label}
              </span>
            )}
            {isMigrated ? (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 size={9} />
                Migrated
              </span>
            ) : (
              <>
                <ArrowRight size={11} className="text-text-muted" />
                <TargetChip mapping={mapping} />
                <ConfidenceChip level={mapping.confidence} />
              </>
            )}
          </div>
          <p className="text-[11px] text-text-secondary leading-snug max-w-2xl">{playbook.description}</p>
        </div>
      </div>

      {/* Filter chips — compact preview */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(playbook.filters || []).slice(0, 4).map((f, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-bg/60 border border-border">
            <span className="text-text-muted font-mono">{f.group}</span>
            <span className="text-text-secondary">{f.label}</span>
            <span className="text-text-muted">{f.op}</span>
            <span className="text-text-primary font-semibold">{String(f.value)}</span>
          </span>
        ))}
        {(playbook.filters || []).length > 4 && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-text-muted">
            +{(playbook.filters || []).length - 4} more
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-3 flex-wrap text-[11px]">
        <span className="inline-flex items-center gap-1 text-text-muted">
          <Layers size={11} />
          <span className="font-mono font-bold text-text-primary">{playbook.matchCount.toLocaleString()}</span>
          matches today
        </span>
        {playbook.trigger && (
          <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-300">
            <Zap size={11} />
            {playbook.trigger.label}
          </span>
        )}
        {playbook.action && (
          <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-300">
            <Wand2 size={11} />
            {playbook.action.label}
          </span>
        )}
        {isMigrated && days != null && (
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 ml-auto">
            <Clock size={11} />
            {days}d coexistence remaining
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        {isMigrated ? (
          <>
            <button
              onClick={onUndo}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded transition-colors"
            >
              <Undo2 size={11} />
              Undo migration
            </button>
            <span className="text-[10px] text-text-muted italic">
              Legacy playbook still runs for {days ?? COEXISTENCE_DAYS} more days.
            </span>
          </>
        ) : (
          <>
            <button
              onClick={onPreview}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded transition-colors"
            >
              Preview mapping
              <ChevronRight size={11} />
            </button>
            <button
              onClick={onQuickMigrate}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-primary text-white rounded hover:bg-primary-dim transition-colors"
            >
              <Sparkles size={11} />
              Migrate as {mapping.target === 'workbook' ? 'Workbook' : 'Sales Play'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Side-by-side preview modal
// -----------------------------------------------------------------------------
function PreviewModal({ playbook, mapping, onClose, onConfirm }) {
  const [name, setName] = useState(mapping.suggestedName || playbook.name);
  const [triggerType, setTriggerType] = useState(mapping.suggestedTriggerType);
  const [workflowId, setWorkflowId] = useState(mapping.suggestedWorkflowId);

  if (!playbook || !mapping) return null;

  const handleConfirm = () => {
    onConfirm({ name, triggerType, workflowId });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <div className="bg-bg border border-border rounded-lg shadow-modal max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <ArrowRight size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Migrate playbook</h2>
              <p className="text-[11px] text-text-muted">
                Review the mapping side-by-side before we create the {mapping.target === 'workbook' ? 'workbook' : 'Sales Play'}.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-2 rounded transition-colors text-text-secondary">
            <X size={14} />
          </button>
        </div>

        {/* Rationale */}
        <div className="flex-shrink-0 px-5 py-2 border-b border-border bg-primary/5">
          <div className="flex items-start gap-2">
            <Info size={12} className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-text-secondary leading-snug">{mapping.rationale}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 divide-x divide-border">
          {/* LEFT — old Playbook */}
          <div className="px-5 py-4 space-y-3">
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Before · Playbook</div>
            <div>
              <div className="text-sm font-semibold text-text-primary">{playbook.name}</div>
              <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">{playbook.description}</div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">Audience filters</div>
              <div className="space-y-1">
                {(playbook.filters || []).map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-bg/60 border border-border text-[10px]">
                    <span className="font-mono text-text-muted">{f.group}</span>
                    <span className="text-text-secondary">{f.label}</span>
                    <span className="text-text-muted">{f.op}</span>
                    <span className="text-text-primary font-semibold">{String(f.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {playbook.trigger && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Trigger</div>
                <div className="px-2 py-1 rounded bg-rose-500/5 border border-rose-500/30 text-[11px] text-rose-700 dark:text-rose-300 inline-flex items-center gap-1">
                  <Zap size={10} />
                  {playbook.trigger.label}
                </div>
              </div>
            )}

            {playbook.action && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Action</div>
                <div className="px-2 py-1 rounded bg-sky-500/5 border border-sky-500/30 text-[11px] text-sky-700 dark:text-sky-300 inline-flex items-center gap-1">
                  <Wand2 size={10} />
                  {playbook.action.label}
                </div>
              </div>
            )}

            <div className="pt-2 mt-2 border-t border-border text-[11px] text-text-muted">
              <span className="font-mono font-bold text-text-primary">{playbook.matchCount.toLocaleString()}</span> matches today
            </div>
          </div>

          {/* RIGHT — new mapping */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">After ·</div>
              <TargetChip mapping={mapping} />
              <ConfidenceChip level={mapping.confidence} />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 mt-1 text-sm bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:border-primary/40"
              />
            </div>

            {mapping.target === 'sales_play' && mapping.playType === 'inbound' && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Trigger type</label>
                <select
                  value={triggerType || 'signal'}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full px-2 py-1.5 mt-1 text-xs bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary/40"
                >
                  <option value="signal">Ranking signal fires</option>
                  <option value="champion_job_change">Champion changes jobs</option>
                  <option value="event_fired">External event (TrustRadius, webinar, form)</option>
                  <option value="crm_field_updated">CRM field updated</option>
                </select>
              </div>
            )}

            {mapping.target === 'sales_play' && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Attached workflow</label>
                <input
                  type="text"
                  value={workflowId || ''}
                  onChange={(e) => setWorkflowId(e.target.value)}
                  placeholder="Pick during migration or leave empty"
                  className="w-full px-3 py-2 mt-1 text-xs bg-surface border border-border rounded-md text-text-primary font-mono focus:outline-none focus:border-primary/40"
                />
                {mapping.suggestedWorkflowId && (
                  <div className="mt-1 text-[10px] text-emerald-700 dark:text-emerald-300">
                    Suggested: <span className="font-mono">{mapping.suggestedWorkflowId}</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Preserved from playbook</div>
              <div className="px-2 py-1.5 rounded border border-border bg-bg/40 text-[10px] text-text-secondary leading-snug">
                {(playbook.filters || []).length} audience filter{(playbook.filters || []).length === 1 ? '' : 's'} carry over as {mapping.target === 'workbook' ? 'filter chips on the workbook' : 'audience filters on the Sales Play'}. Match count stays at <span className="font-mono font-bold text-text-primary">{playbook.matchCount.toLocaleString()}</span>.
              </div>
            </div>

            <div className="pt-2 mt-2 border-t border-border">
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Coexistence</div>
              <div className="text-[10px] text-text-secondary leading-snug">
                The legacy playbook keeps running alongside the new {mapping.target === 'workbook' ? 'workbook' : 'Sales Play'} for <span className="font-semibold text-text-primary">{COEXISTENCE_DAYS} days</span>. You can undo the migration during that window.
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-[10px] text-text-muted leading-snug">
            Nothing changes for reps until you migrate. You can undo within {COEXISTENCE_DAYS} days.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
            >
              <CheckCircle2 size={11} />
              Migrate now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Route shell
// -----------------------------------------------------------------------------
export default function MigrationCenter() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [migrationsTick, setMigrationsTick] = useState(0);
  const [previewing, setPreviewing] = useState(null); // { playbook, mapping }

  useEffect(() => subscribeMigrations(() => setMigrationsTick((t) => t + 1)), []);

  const playbooks = useMemo(() => listLegacyPlaybooks(), []);
  const mappings = useMemo(
    () => Object.fromEntries(playbooks.map((p) => [p.id, analyzeMapping(p)])),
    [playbooks],
  );
  // migrationsTick is a change-tick from subscribeMigrations — using it as a
  // dep intentionally so these re-derive when localStorage changes. Not a
  // "real" dep but keeping it prevents stale renders.
  const migrationStates = useMemo(
    () => Object.fromEntries(playbooks.map((p) => [p.id, getMigrationState(p.id)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playbooks, migrationsTick],
  );
  const counts = useMemo(
    () => migrationCounts(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [migrationsTick],
  );

  const handleQuickMigrate = (playbook, mapping) => {
    const result = performMigration(playbook.id, mapping);
    if (result?.target === 'workbook') {
      showToast(`Migrated "${playbook.name}" to Workbook`, 'success');
    } else if (result?.target === 'sales_play') {
      showToast(`Migrated "${playbook.name}" to Sales Play`, 'success');
    }
  };

  const handlePreviewConfirm = (overrides) => {
    if (!previewing) return;
    const { playbook, mapping } = previewing;
    performMigration(playbook.id, mapping, overrides);
    showToast(`Migrated "${playbook.name}"`, 'success');
    setPreviewing(null);
  };

  const handleUndo = (playbook) => {
    undoMigration(playbook.id);
    showToast(`Undid migration for "${playbook.name}"`, 'info');
  };

  const handleMigrateAllSuggested = () => {
    let migrated = 0;
    for (const p of playbooks) {
      if (migrationStates[p.id]) continue;
      const m = mappings[p.id];
      if (m && m.confidence === 'high') {
        performMigration(p.id, m);
        migrated += 1;
      }
    }
    showToast(migrated > 0
      ? `Migrated ${migrated} high-confidence playbook${migrated === 1 ? '' : 's'}`
      : 'No high-confidence playbooks left to migrate',
      migrated > 0 ? 'success' : 'info');
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Admin Hub
      </button>
      <div className="mb-2 text-xs text-text-muted">Platform & Ops · Migration Center</div>

      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center flex-shrink-0">
            <ArrowRight size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Migrate legacy playbooks</h1>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
              Playbooks curated the list. Sales Plays curate the list <span className="italic">and</span> run the play.
              We&rsquo;ve pre-mapped every playbook — approve, edit, or skip. Nothing changes for your reps until you&rsquo;re ready.
            </p>
          </div>
        </div>
        {counts.remaining > 0 && (
          <button
            onClick={handleMigrateAllSuggested}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary-dim transition-colors shadow-sm flex-shrink-0"
          >
            <Sparkles size={11} />
            Migrate all high-confidence
          </button>
        )}
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <SummaryCard label="Playbooks" value={counts.total} accent="text-text-primary" />
        <SummaryCard label="Migrated" value={counts.migrated} accent="text-emerald-700 dark:text-emerald-300" />
        <SummaryCard label="Remaining" value={counts.remaining} accent={counts.remaining > 0 ? 'text-primary' : 'text-text-muted'} />
      </div>

      {/* Playbook cards */}
      <div className="space-y-3">
        {playbooks.map((p) => (
          <PlaybookCard
            key={p.id}
            playbook={p}
            mapping={mappings[p.id]}
            migrationState={migrationStates[p.id]}
            onPreview={() => setPreviewing({ playbook: p, mapping: mappings[p.id] })}
            onQuickMigrate={() => handleQuickMigrate(p, mappings[p.id])}
            onUndo={() => handleUndo(p)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-border text-[11px] text-text-muted leading-relaxed max-w-3xl">
        <span className="font-semibold text-text-secondary">How the mapping works:</span>{' '}
        Playbooks with no automated action become filtered Workbooks — the audience carries over 1:1.
        Playbooks with a trigger + action become Sales Plays — the trigger maps to an inbound Sales Play trigger,
        the action becomes an attached workflow or set of individual actions.
      </div>

      {previewing && (
        <PreviewModal
          playbook={previewing.playbook}
          mapping={previewing.mapping}
          onClose={() => setPreviewing(null)}
          onConfirm={handlePreviewConfirm}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className="bg-surface border border-border rounded-md p-3">
      <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">{label}</div>
      <div className={`text-2xl font-semibold ${accent} mt-0.5`}>{value}</div>
    </div>
  );
}
