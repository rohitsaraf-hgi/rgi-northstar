// BookUploadModal — admin CSV upload flow for the Sales Co-Pilot book.
//
// Scope (locked v1):
//   - Admin uploads CSV with minimum schema: account_name, account_owner_email
//   - Owner emails are matched against existing platform users
//   - Matched owners auto-assign their accounts
//   - Unmatched owners can be invited inline or skipped (rows held aside)
//   - If a book already exists, the next step is a Replace confirmation
//     (Merge ships in a follow-up — for now Replace only)
//
// The actual file upload is mocked — we feed a pretend parsed result so the
// flow can be demoed end-to-end without backend wiring.

import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Upload,
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Users,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { listSellers } from '../../data/territoryDesign.js';

// Mock CSV preview rows. In production these come from a Papa Parse pass
// over the dropped file. The shape mirrors what a tenant onboarding CSV
// typically looks like for an admin upload:
//   account_name, account_owner_email
const MOCK_CSV_ROWS = [
  { account_name: 'JPMorgan Chase', account_owner_email: 'erik@wiz.io' },
  { account_name: 'Snowflake', account_owner_email: 'erik@wiz.io' },
  { account_name: 'Acme Corp', account_owner_email: 'erik@wiz.io' },
  { account_name: 'Databricks', account_owner_email: 'erik@wiz.io' },
  { account_name: 'Stripe', account_owner_email: 'lisa@wiz.io' },
  { account_name: 'Salesforce', account_owner_email: 'lisa@wiz.io' },
  { account_name: 'Adobe', account_owner_email: 'tariq@wiz.io' },
  { account_name: 'Microsoft', account_owner_email: 'tariq@wiz.io' },
  { account_name: 'Google', account_owner_email: 'jdoe@wiz.io' },
  { account_name: 'Meta', account_owner_email: 'jdoe@wiz.io' },
];

function StepDot({ active, done, label, idx }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
          done
            ? 'bg-emerald-500 text-white'
            : active
            ? 'bg-primary text-white'
            : 'bg-surface-2 text-text-muted border border-border'
        }`}
      >
        {done ? <CheckCircle2 size={12} /> : idx}
      </div>
      <span
        className={`text-[11px] ${
          active ? 'text-text-primary font-semibold' : done ? 'text-emerald-700 dark:text-emerald-300' : 'text-text-muted'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function Stepper({ step }) {
  const steps = [
    { idx: 1, label: 'Upload CSV' },
    { idx: 2, label: 'Match owners' },
    { idx: 3, label: 'Confirm import' },
  ];
  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-bg/30 border-b border-border">
      {steps.map((s, i) => (
        <Fragment key={s.idx}>
          <StepDot idx={s.idx} label={s.label} active={step === s.idx} done={step > s.idx} />
          {i < steps.length - 1 && <div className="flex-1 h-px bg-border" />}
        </Fragment>
      ))}
    </div>
  );
}

export default function BookUploadModal({
  open,
  onClose,
  hasExistingBook = false,
  existingBookSize = 0,
  onComplete,
}) {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  // Match parsed owner emails against platform users (sellers + admins).
  const platformUsers = useMemo(() => listSellers(), []);
  const ownerMatching = useMemo(() => {
    const byEmail = new Map(platformUsers.map((u) => [u.email?.toLowerCase(), u]));
    const groups = new Map(); // ownerEmail -> { email, user|null, count, accounts[] }
    for (const r of rows) {
      const email = (r.account_owner_email || '').toLowerCase().trim();
      if (!email) continue;
      const existing = groups.get(email) || {
        email,
        user: byEmail.get(email) || null,
        accounts: [],
      };
      existing.accounts.push(r.account_name);
      groups.set(email, existing);
    }
    return Array.from(groups.values());
  }, [rows, platformUsers]);

  const matchedOwners = ownerMatching.filter((o) => !!o.user);
  const unmatchedOwners = ownerMatching.filter((o) => !o.user);
  const matchedAccounts = matchedOwners.reduce((sum, o) => sum + o.accounts.length, 0);
  const unmatchedAccounts = unmatchedOwners.reduce((sum, o) => sum + o.accounts.length, 0);

  // Reset state when modal opens
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
    setFileName('book-of-accounts.csv');
    setTimeout(() => {
      setRows(MOCK_CSV_ROWS);
      setParsing(false);
      setStep(2);
    }, 600);
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
        matchedAccounts,
        skippedAccounts: unmatchedAccounts,
        replaced: hasExistingBook,
      });
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-[680px] max-w-[95vw] max-h-[90vh] bg-bg border border-border rounded-md shadow-elev flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload size={14} className="text-primary" />
            <div className="text-sm font-semibold text-text-primary">
              {hasExistingBook ? 'Re-upload book of accounts' : 'Upload book of accounts'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary"
          >
            <X size={14} />
          </button>
        </div>

        <Stepper step={step} />

        <div className="flex-1 overflow-y-auto thin-scrollbar">
          {step === 1 && (
            <Step1Upload
              fileName={fileName}
              parsing={parsing}
              onUpload={handleFakeUpload}
              hasExistingBook={hasExistingBook}
              existingBookSize={existingBookSize}
            />
          )}
          {step === 2 && (
            <Step2OwnerMatch
              matched={matchedOwners}
              unmatched={unmatchedOwners}
              totalRows={rows.length}
            />
          )}
          {step === 3 && (
            <Step3Confirm
              totalRows={rows.length}
              matchedAccounts={matchedAccounts}
              unmatchedAccounts={unmatchedAccounts}
              hasExistingBook={hasExistingBook}
              existingBookSize={existingBookSize}
              showReplaceConfirm={showReplaceConfirm}
            />
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface/40">
          <button
            onClick={() => {
              if (step === 1) onClose();
              else setStep((s) => Math.max(1, s - 1));
            }}
            className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1"
          >
            <ArrowLeft size={11} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <div className="flex items-center gap-2">
            {step === 1 && fileName && !parsing && (
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim"
              >
                Next <ArrowRight size={11} />
              </button>
            )}
            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim"
              >
                Next <ArrowRight size={11} />
              </button>
            )}
            {step === 3 && (
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
    </div>
  );
}

function Step1Upload({ fileName, parsing, onUpload, hasExistingBook, existingBookSize }) {
  return (
    <div className="px-5 py-5">
      <div className="text-[12px] text-text-secondary mb-3 leading-relaxed">
        Drop a CSV with the minimum schema:{' '}
        <code className="px-1 py-0.5 rounded bg-surface-2 text-text-primary text-[11px] font-mono">
          account_name
        </code>
        ,{' '}
        <code className="px-1 py-0.5 rounded bg-surface-2 text-text-primary text-[11px] font-mono">
          account_owner_email
        </code>
        . Owner emails must match an existing platform user.
      </div>

      {hasExistingBook && (
        <div className="mb-3 px-3 py-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
          <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
          <span>
            Your book already has <strong>{existingBookSize.toLocaleString()}</strong> accounts.
            Re-uploading will <strong>replace</strong> them — threads and artifacts on removed
            accounts will be archived. Merge support ships later.
          </span>
        </div>
      )}

      {!fileName ? (
        <button
          onClick={onUpload}
          className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/60 hover:bg-primary/5 transition-colors group"
        >
          <Upload size={20} className="mx-auto text-text-muted group-hover:text-primary mb-2" />
          <div className="text-sm font-semibold text-text-primary mb-1">
            Drop your CSV here, or click to choose a file
          </div>
          <div className="text-[11px] text-text-muted">
            For the prototype we'll use a sample CSV with 10 accounts across 4 owners.
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
              {parsing ? 'Parsing rows…' : 'Ready — click Next'}
            </div>
          </div>
          {!parsing && <CheckCircle2 size={14} className="text-emerald-500" />}
        </div>
      )}
    </div>
  );
}

function Step2OwnerMatch({ matched, unmatched, totalRows }) {
  return (
    <div className="px-5 py-5">
      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="px-3 py-2 rounded bg-bg/40 border border-border">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Rows</div>
          <div className="text-lg font-mono font-semibold text-text-primary">{totalRows}</div>
        </div>
        <div className="px-3 py-2 rounded bg-emerald-500/5 border border-emerald-500/20">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-300">
            Matched owners
          </div>
          <div className="text-lg font-mono font-semibold text-emerald-700 dark:text-emerald-300">
            {matched.length}
          </div>
        </div>
        <div className="px-3 py-2 rounded bg-amber-500/5 border border-amber-500/20">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-300">
            Unknown owners
          </div>
          <div className="text-lg font-mono font-semibold text-amber-700 dark:text-amber-300">
            {unmatched.length}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {matched.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
              Will be assigned
            </div>
            <div className="space-y-1">
              {matched.map((o) => (
                <div
                  key={o.email}
                  className="flex items-center gap-3 px-3 py-2 rounded border border-emerald-500/20 bg-emerald-500/[0.03]"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                    {o.user.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-text-primary truncate">
                      {o.user.name}
                    </div>
                    <div className="text-[10px] text-text-muted truncate">{o.email}</div>
                  </div>
                  <div className="text-[11px] font-mono text-text-secondary flex-shrink-0">
                    {o.accounts.length}{' '}
                    {o.accounts.length === 1 ? 'account' : 'accounts'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {unmatched.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-300 mb-1.5">
              Need attention
            </div>
            <div className="space-y-1">
              {unmatched.map((o) => (
                <div
                  key={o.email}
                  className="flex items-center gap-3 px-3 py-2 rounded border border-amber-500/30 bg-amber-500/[0.04]"
                >
                  <div className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-text-primary truncate">
                      {o.email}
                    </div>
                    <div className="text-[10px] text-text-muted truncate">
                      No matching platform user — {o.accounts.length} account
                      {o.accounts.length === 1 ? '' : 's'} will be skipped
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      window.alert(
                        `Invite flow opens (mocked for prototype) — would send a platform invitation to ${o.email}.`,
                      )
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold border border-amber-500/40 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-500/10"
                  >
                    <UserPlus size={10} /> Invite
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Step3Confirm({
  totalRows,
  matchedAccounts,
  unmatchedAccounts,
  hasExistingBook,
  existingBookSize,
  showReplaceConfirm,
}) {
  return (
    <div className="px-5 py-5 space-y-3">
      <div className="text-[12px] text-text-secondary leading-relaxed">
        Ready to import. Review the summary, then confirm to {hasExistingBook ? 'replace' : 'create'}{' '}
        the book.
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <div className="px-4 py-2.5 bg-bg/40 border-b border-border flex items-center gap-2">
          <Users size={11} className="text-primary" />
          <span className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
            Import summary
          </span>
        </div>
        <div className="divide-y divide-border/40">
          <SummaryRow label="Rows in CSV" value={totalRows} />
          <SummaryRow
            label="Accounts to import"
            value={matchedAccounts}
            tone="good"
          />
          {unmatchedAccounts > 0 && (
            <SummaryRow
              label="Skipped (unknown owner)"
              value={unmatchedAccounts}
              tone="warn"
            />
          )}
          {hasExistingBook && (
            <SummaryRow
              label="Existing book (will be replaced)"
              value={existingBookSize}
              tone="warn"
            />
          )}
        </div>
      </div>

      {hasExistingBook && showReplaceConfirm && (
        <div className="px-3 py-3 rounded bg-rose-500/10 border border-rose-500/30 text-[12px] text-rose-700 dark:text-rose-300">
          <div className="flex items-start gap-2">
            <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Confirm replace</div>
              <p className="leading-relaxed">
                This removes <strong>{existingBookSize.toLocaleString()}</strong> existing accounts.
                Threads and artifacts on removed accounts will be archived (not deleted) and remain
                accessible via search. This cannot be undone without re-importing the original
                book.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value, tone }) {
  const toneCls =
    tone === 'good'
      ? 'text-emerald-700 dark:text-emerald-300'
      : tone === 'warn'
      ? 'text-amber-700 dark:text-amber-300'
      : 'text-text-primary';
  return (
    <div className="px-4 py-2 flex items-center justify-between">
      <span className="text-[12px] text-text-secondary">{label}</span>
      <span className={`text-[13px] font-mono font-semibold ${toneCls}`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}
