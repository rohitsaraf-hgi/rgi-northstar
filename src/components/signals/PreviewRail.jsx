import { useMemo, useState, useEffect } from 'react';
import { RefreshCw, Layers, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { SAMPLE_ACCOUNTS, evaluateSignal, batchEvaluate } from '../../data/signalEval.js';
import { OUTPUT_TYPES } from '../../data/signals.js';

// Debounce hook — re-evaluates 600ms after the tree settles.
function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

function formatValue(value, outputType) {
  if (value == null) return '—';
  if (outputType === 'boolean') return value ? 'FIRES' : 'does not fire';
  if (outputType === 'tier') return String(value);
  if (outputType === 'score') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

export default function PreviewRail({ tree, outputType = 'boolean', collapsed, onToggle }) {
  const [primaryIdx, setPrimaryIdx] = useState(0);
  const [sampleSeed, setSampleSeed] = useState(0);
  const debouncedTree = useDebounced(tree, 600);

  // Re-sample slices SAMPLE_ACCOUNTS deterministically.
  const sampledAccounts = useMemo(() => {
    const all = SAMPLE_ACCOUNTS;
    const start = sampleSeed % all.length;
    return [
      all[start],
      all[(start + 1) % all.length],
      all[(start + 2) % all.length],
      all[(start + 3) % all.length],
    ];
  }, [sampleSeed]);

  const primary = sampledAccounts[primaryIdx];

  // Per-sample-account results
  const sampleResults = useMemo(
    () => batchEvaluate(debouncedTree, sampledAccounts),
    [debouncedTree, sampledAccounts],
  );

  // Full-book eval for coverage stats
  const allResults = useMemo(
    () => batchEvaluate(debouncedTree, SAMPLE_ACCOUNTS),
    [debouncedTree],
  );
  const firing = allResults.filter((r) => r.fires).length;
  const total = SAMPLE_ACCOUNTS.length;
  const firingPct = total > 0 ? ((firing / total) * 100).toFixed(1) : '0';

  // Primary result for the detail card
  const primaryResult = sampleResults[primaryIdx];
  const nodeCount = Object.keys(debouncedTree.nodes || {}).length;
  const hasOutput = !!debouncedTree.output_node && nodeCount > 0;

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="h-full w-10 bg-bg/40 border-l border-border flex flex-col items-center justify-start py-4 hover:bg-surface-2 transition-colors"
        title="Expand preview rail"
      >
        <Layers size={14} className="text-emerald-700 dark:text-emerald-300" />
        <span className="rotate-90 mt-10 text-[10px] uppercase tracking-wider text-text-muted whitespace-nowrap origin-left">
          Preview
        </span>
      </button>
    );
  }

  return (
    <div className="h-full bg-bg/40 border-l border-border flex flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Layers size={12} className="text-emerald-700 dark:text-emerald-300" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
          Preview
        </span>
        <button
          onClick={() => setSampleSeed((s) => s + 1)}
          className="ml-auto p-1 text-text-muted hover:text-text-secondary transition-colors"
          title="Re-sample accounts"
        >
          <RefreshCw size={10} />
        </button>
        <button
          onClick={onToggle}
          className="text-[10px] text-text-muted hover:text-text-secondary transition-colors"
          title="Collapse pane"
        >
          →
        </button>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-4">
        {/* Sample account picker */}
        <div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
            Sample account
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {sampledAccounts.map((a, i) => (
              <button
                key={a.id}
                onClick={() => setPrimaryIdx(i)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors ${
                  primaryIdx === i
                    ? 'bg-primary/15 text-primary'
                    : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                }`}
              >
                <span
                  className="w-3 h-3 rounded flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                  style={{ background: a.logoColor }}
                >
                  {a.name.charAt(0)}
                </span>
                <span className="truncate">{a.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live eval result */}
        <div className="bg-surface border border-border rounded-md p-3">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
            Result · {primary.name}
          </div>
          {!hasOutput ? (
            <div className="text-[11px] text-text-muted italic flex items-start gap-1.5">
              <AlertCircle size={10} className="flex-shrink-0 mt-0.5" />
              <span>Add nodes and a terminal output to see live evaluation.</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                {primaryResult?.fires ? (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0" />
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      {formatValue(primaryResult.value, outputType)}
                    </span>
                  </>
                ) : primaryResult?.value != null ? (
                  <>
                    <CheckCircle2 size={16} className="text-text-secondary flex-shrink-0" />
                    <span className="text-sm font-semibold text-text-secondary">
                      {formatValue(primaryResult.value, outputType)}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="text-text-muted flex-shrink-0" />
                    <span className="text-sm font-semibold text-text-secondary">
                      No result — config incomplete
                    </span>
                  </>
                )}
                <span className="ml-auto text-[10px] text-text-muted font-mono">
                  → {OUTPUT_TYPES[outputType]?.label.toLowerCase()}
                </span>
              </div>

              {/* Evidence trace */}
              {primaryResult?.evidence?.length > 0 && (
                <div className="border-t border-border pt-2 mt-2">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1">
                    Source evidence
                  </div>
                  <div className="space-y-0.5">
                    {primaryResult.evidence.map((e, i) => (
                      <div
                        key={i}
                        className="text-[10px] text-text-secondary font-mono leading-snug truncate"
                        title={e.evidence}
                      >
                        • {e.evidence}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Per-account list */}
        <div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
            Across sample
          </div>
          <div className="space-y-1">
            {sampleResults.map((r) => (
              <button
                key={r.account.id}
                onClick={() => setPrimaryIdx(sampledAccounts.findIndex((s) => s.id === r.account.id))}
                className="w-full text-left flex items-center gap-2 px-2 py-1 bg-surface border border-border rounded text-[11px] hover:border-primary/30 transition-colors"
              >
                <span
                  className="w-3 h-3 rounded flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                  style={{ background: r.account.logoColor }}
                >
                  {r.account.name.charAt(0)}
                </span>
                <span className="flex-1 text-text-secondary truncate">{r.account.name}</span>
                {r.fires ? (
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 size={11} />
                    <span className="text-[10px] font-mono">{formatValue(r.value, outputType)}</span>
                  </span>
                ) : r.value != null ? (
                  <span className="text-[10px] font-mono text-text-secondary">
                    {formatValue(r.value, outputType)}
                  </span>
                ) : (
                  <XCircle size={11} className="text-text-muted" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Coverage estimate */}
        <div className="bg-surface border border-border rounded-md p-3">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">
            Coverage
          </div>
          {!hasOutput ? (
            <div className="text-[11px] text-text-muted italic">
              Not enough tree to evaluate.
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-semibold text-text-primary leading-none">
                  {firing}
                </span>
                <span className="text-text-muted text-xs">of {total}</span>
                <span className="ml-auto text-xs font-mono text-text-secondary">
                  {firingPct}%
                </span>
              </div>
              <div className="text-[11px] text-text-secondary mt-1">
                accounts fire today (mock book)
              </div>
              {/* Coverage bar */}
              <div className="mt-2 h-1.5 bg-bg/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Number(firingPct))}%` }}
                />
              </div>
            </>
          )}
          <div className="mt-2 text-[10px] text-text-muted italic">
            Sample-only — real evaluation runs against the full book on event triggers.
          </div>
        </div>
      </div>
    </div>
  );
}
