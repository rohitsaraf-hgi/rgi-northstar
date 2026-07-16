import { useEffect, useState } from 'react';
import { X, PlayCircle, CheckCircle2, Loader2, Clock, Layers, AlertCircle } from 'lucide-react';
import { generateMockBatches, setPlayActivation } from '../../data/plays.js';

function formatBatchTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function StatusChip({ status }) {
  if (status === 'running') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        <Loader2 size={9} className="animate-spin" />
        Running
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 size={9} />
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-surface-2 text-text-secondary">
      <Clock size={9} />
      Scheduled
    </span>
  );
}

export default function PlayActivationModal({ play, workbookRecordCount, onClose, onActivated }) {
  const [step, setStep] = useState(play?.activation?.activatedAt ? 'activated' : 'confirm');
  const [batches, setBatches] = useState(() => play?.activation?.batches || []);
  const [runningCount, setRunningCount] = useState(0);

  const batchSize = play?.activation?.batchSize || 10;
  const batchGapMinutes = play?.activation?.batchGapMinutes || 30;
  const total = workbookRecordCount ?? 0;
  const totalBatches = Math.max(1, Math.ceil(total / batchSize));

  // When in "activated" state, run a lightweight counter so batch 1 looks
  // alive. Purely visual — no side effects on the store.
  useEffect(() => {
    if (step !== 'activated') return;
    const batch1 = batches[0];
    if (!batch1 || batch1.status !== 'running') return;
    if (runningCount >= batch1.recordCount) return;
    const t = setTimeout(() => setRunningCount((c) => Math.min(c + 1, batch1.recordCount)), 300);
    return () => clearTimeout(t);
  }, [step, runningCount, batches]);

  const handleActivate = () => {
    const activatedAt = new Date().toISOString();
    const next = generateMockBatches({
      totalRecords: total,
      batchSize,
      batchGapMinutes,
      activatedAt,
    });
    setBatches(next);
    setRunningCount(0);
    setPlayActivation(play.id, { activatedAt, batches: next });
    setStep('activated');
    onActivated?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <div className="bg-bg border border-border rounded-lg shadow-modal max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <PlayCircle size={15} className="text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Activate play &middot; {play.name}</h2>
              <p className="text-[11px] text-text-muted">
                {total} records in workbook &middot; {batchSize}/batch &middot; {batchGapMinutes} min between batches
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-2 rounded transition-colors text-text-secondary"
          >
            <X size={14} />
          </button>
        </div>

        {step === 'confirm' && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <div className="flex items-start gap-2 px-3 py-2.5 rounded border border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300">
                <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                <div className="text-[11px] leading-snug">
                  This will queue the attached workflow to run for every record currently in the workbook.
                  Execution is batched to avoid CRM rate limits.
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="px-3 py-2 rounded border border-border bg-surface">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Records</div>
                  <div className="text-lg font-semibold text-text-primary mt-0.5">{total.toLocaleString()}</div>
                </div>
                <div className="px-3 py-2 rounded border border-border bg-surface">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Batches</div>
                  <div className="text-lg font-semibold text-text-primary mt-0.5">{totalBatches}</div>
                </div>
                <div className="px-3 py-2 rounded border border-border bg-surface">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Total time</div>
                  <div className="text-lg font-semibold text-text-primary mt-0.5">
                    ~{Math.max(0, (totalBatches - 1) * batchGapMinutes)} min
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-text-secondary leading-relaxed">
                {play?.activation?.autoRunOnNewRecords ? (
                  <>Dynamic workbook &mdash; as new records enter, the workflow will run for them automatically without re-activation.</>
                ) : (
                  <>Static workbook &mdash; you&rsquo;ll need to manually run the workflow for records added after activation.</>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-border">
              <button
                onClick={onClose}
                className="px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleActivate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
              >
                <PlayCircle size={11} />
                Activate now
              </button>
            </div>
          </>
        )}

        {step === 'activated' && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold flex items-center gap-1.5">
                  <Layers size={10} />
                  Batch queue
                </div>
                <span className="text-[10px] text-text-muted">
                  activated {play?.activation?.activatedAt ? formatBatchTime(play.activation.activatedAt) : ''}
                </span>
              </div>
              <div className="space-y-2">
                {batches.map((b, i) => {
                  const isRunning = b.status === 'running';
                  const percent = isRunning && b.recordCount > 0 ? Math.round((runningCount / b.recordCount) * 100) : 0;
                  return (
                    <div
                      key={i}
                      className={`px-3 py-2.5 rounded border ${
                        isRunning ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border bg-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-text-muted flex-shrink-0">
                          Batch {b.index}/{b.total}
                        </span>
                        <StatusChip status={b.status} />
                        <span className="text-[10px] text-text-muted">
                          {b.recordCount} record{b.recordCount === 1 ? '' : 's'}
                        </span>
                        <span className="ml-auto text-[10px] font-mono text-text-muted">
                          {formatBatchTime(b.scheduledAt)}
                        </span>
                      </div>
                      {isRunning && (
                        <div className="w-full bg-surface-2 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-200"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-border">
              <p className="text-[10px] text-text-muted leading-snug max-w-sm">
                Reps see workflow runs on their account cards as each batch completes.
              </p>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
