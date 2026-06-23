// SellerBookUploadModal — simpler upload flow for the seller persona.
//
// Sellers don't need owner mapping — every row they upload is auto-assigned
// to themselves. Schema is therefore just:
//   account_name, account_domain
//
// Re-upload triggers a Replace confirmation (Merge ships later). Threads
// and artifacts attached to removed accounts are archived, not deleted.

import { Fragment, useEffect, useState } from 'react';
import {
  Upload,
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

const MOCK_SELLER_ROWS = [
  { account_name: 'Northpoint Bank', account_domain: 'northpoint-bank.com' },
  { account_name: 'Helix Bio', account_domain: 'helix-bio.com' },
  { account_name: 'Velocity Robotics', account_domain: 'velocityrobotics.io' },
  { account_name: 'Tideline Health', account_domain: 'tideline.health' },
  { account_name: 'Anchor Federal Credit Union', account_domain: 'anchorfcu.org' },
  { account_name: 'Orbital Mfg', account_domain: 'orbitalmfg.com' },
  { account_name: 'Cascade Insurance', account_domain: 'cascade-ins.com' },
  { account_name: 'Mosaic Energy', account_domain: 'mosaic-energy.com' },
];

export default function SellerBookUploadModal({
  open,
  onClose,
  hasExistingBook = false,
  existingBookSize = 0,
  ownerName = 'you',
  onComplete,
}) {
  const [step, setStep] = useState(1); // 1=pick, 2=confirm
  const [fileName, setFileName] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setFileName(null);
      setRows([]);
      setShowReplaceConfirm(false);
    }
  }, [open]);

  if (!open) return null;

  const handleFakeUpload = () => {
    setParsing(true);
    setFileName('my-book.csv');
    setTimeout(() => {
      setRows(MOCK_SELLER_ROWS);
      setParsing(false);
      setStep(2);
    }, 500);
  };

  const handleImport = () => {
    if (hasExistingBook && !showReplaceConfirm) {
      setShowReplaceConfirm(true);
      return;
    }
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      onComplete?.({
        totalRows: rows.length,
        importedAccounts: rows.length,
        replaced: hasExistingBook,
      });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-[540px] max-w-[95vw] max-h-[90vh] bg-bg border border-border rounded-md shadow-elev flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload size={14} className="text-primary" />
            <div className="text-sm font-semibold text-text-primary">
              {hasExistingBook ? 'Re-upload my book' : 'Upload my book'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar px-5 py-5">
          {step === 1 && (
            <>
              <div className="text-[12px] text-text-secondary mb-3 leading-relaxed">
                Drop a CSV with the minimum schema:{' '}
                <code className="px-1 py-0.5 rounded bg-surface-2 text-text-primary text-[11px] font-mono">
                  account_name
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-surface-2 text-text-primary text-[11px] font-mono">
                  account_domain
                </code>
                . All rows will be assigned to {ownerName}.
              </div>

              {hasExistingBook && (
                <div className="mb-3 px-3 py-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Your book currently has <strong>{existingBookSize.toLocaleString()}</strong>{' '}
                    accounts. Re-uploading will <strong>replace</strong> them — threads and
                    artifacts on removed accounts are archived.
                  </span>
                </div>
              )}

              {!fileName ? (
                <button
                  onClick={handleFakeUpload}
                  className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/60 hover:bg-primary/5 transition-colors group"
                >
                  <Upload size={20} className="mx-auto text-text-muted group-hover:text-primary mb-2" />
                  <div className="text-sm font-semibold text-text-primary mb-1">
                    Drop your CSV here, or click to choose a file
                  </div>
                  <div className="text-[11px] text-text-muted">
                    For the prototype we'll use a sample CSV with 8 accounts.
                  </div>
                </button>
              ) : (
                <div className="border border-border rounded-md p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {parsing ? (
                      <Loader2 size={16} className="animate-spin text-primary" />
                    ) : (
                      <FileText size={16} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">{fileName}</div>
                    <div className="text-[11px] text-text-muted">
                      {parsing ? 'Parsing rows…' : `${rows.length} accounts ready`}
                    </div>
                  </div>
                  {!parsing && <CheckCircle2 size={14} className="text-emerald-500" />}
                </div>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <div className="text-[12px] text-text-secondary mb-3 leading-relaxed">
                <strong className="text-text-primary">{rows.length}</strong> accounts will be{' '}
                {hasExistingBook ? 'imported and replace your existing book' : 'added to your book'}
                , assigned to {ownerName}.
              </div>

              <div className="border border-border rounded-md overflow-hidden">
                <div className="px-3 py-2 bg-bg/40 border-b border-border text-[10px] uppercase tracking-wider font-semibold text-text-muted flex items-center gap-2">
                  <FileText size={10} />
                  Preview · first {Math.min(5, rows.length)} rows
                </div>
                <div className="divide-y divide-border/40">
                  {rows.slice(0, 5).map((r, i) => (
                    <div key={i} className="px-3 py-2 flex items-center gap-3 text-[12px]">
                      <span className="text-text-primary font-medium flex-1 truncate">
                        {r.account_name}
                      </span>
                      <span className="text-text-muted font-mono text-[11px] truncate max-w-[180px]">
                        {r.account_domain}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {hasExistingBook && showReplaceConfirm && (
                <div className="mt-3 px-3 py-3 rounded bg-rose-500/10 border border-rose-500/30 text-[12px] text-rose-700 dark:text-rose-300">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold mb-1">Confirm replace</div>
                      <p className="leading-relaxed">
                        This removes <strong>{existingBookSize.toLocaleString()}</strong> existing
                        accounts from your book. Threads and artifacts are archived (not deleted)
                        and remain accessible via search.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface/40">
          <button
            onClick={() => {
              if (step === 1) onClose();
              else setStep(1);
            }}
            className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step === 2 && (
            <button
              disabled={importing}
              onClick={handleImport}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim disabled:opacity-60"
            >
              {importing ? (
                <>
                  <Loader2 size={11} className="animate-spin" /> Importing…
                </>
              ) : showReplaceConfirm ? (
                <>
                  <AlertTriangle size={11} /> Confirm replace
                </>
              ) : (
                <>
                  <CheckCircle2 size={11} />
                  {hasExistingBook ? 'Replace book' : 'Import book'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
