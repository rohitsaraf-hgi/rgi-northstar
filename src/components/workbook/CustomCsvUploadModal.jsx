// CustomCsvUploadModal — creates a Custom CSV workbook from an uploaded
// list of accounts. Unlike SellerBookUploadModal (which adds rows to the
// owner's Book of Accounts), this flow stands up a *new* workbook the
// user can switch into from the breadcrumb dropdown. Mirrors the seller
// flow Priya used to seed "Q3 Competitive Takeout · Banking".
//
// Steps:
//   1. Name + visibility (sellers default private; admins can pick org)
//   2. CSV file picker → fake parse → preview first 5 rows
//   3. Confirm → createCustomWorkbook() → onComplete(workbook)
//
// Caller navigates to /workbook/:id on completion so the user lands on
// their new workbook.

import { useEffect, useState } from 'react';
import {
  Upload,
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Layers,
  Lock,
  Globe,
} from 'lucide-react';
import {
  createCustomWorkbook,
  isWorkbookNameTaken,
} from '../../data/workbooks.js';
import { getSellerByEmail } from '../../data/territoryDesign.js';

// Sample CSV used in the prototype — enough variety to show the table
// renders properly when the user lands on the new workbook.
// Sample CSV — seller uploads have no owner column (every row auto-
// assigns to the uploader). Admin uploads include account_owner_email
// so accounts land already-routed. Mixed emails simulate a real CSV
// where a few rows fail to resolve.
const MOCK_CSV_ROWS_SELLER = [
  { id: 'csv-row-1', name: 'Northpoint Bank', url: 'northpoint-bank.com', logoColor: '#1E40AF', industry: 'Banking and Financial Services', employees: 4200, revenue: '$1.2B' },
  { id: 'csv-row-2', name: 'Helix Bio', url: 'helix-bio.com', logoColor: '#059669', industry: 'Healthcare and Life Sciences', employees: 1800, revenue: '$420M' },
  { id: 'csv-row-3', name: 'Velocity Robotics', url: 'velocityrobotics.io', logoColor: '#7C3AED', industry: 'Computer and Electronic Product Manufacturing', employees: 950, revenue: '$185M' },
  { id: 'csv-row-4', name: 'Tideline Health', url: 'tideline.health', logoColor: '#0891B2', industry: 'Healthcare and Life Sciences', employees: 6700, revenue: '$2.1B' },
  { id: 'csv-row-5', name: 'Anchor Federal Credit Union', url: 'anchorfcu.org', logoColor: '#B45309', industry: 'Banking and Financial Services', employees: 3100, revenue: '$890M' },
  { id: 'csv-row-6', name: 'Orbital Mfg', url: 'orbitalmfg.com', logoColor: '#475569', industry: 'Manufacturing', employees: 12400, revenue: '$3.8B' },
  { id: 'csv-row-7', name: 'Cascade Insurance', url: 'cascade-ins.com', logoColor: '#9333EA', industry: 'Insurance', employees: 5600, revenue: '$1.9B' },
  { id: 'csv-row-8', name: 'Mosaic Energy', url: 'mosaic-energy.com', logoColor: '#DC2626', industry: 'Utilities', employees: 8900, revenue: '$2.7B' },
];

const MOCK_CSV_ROWS_ADMIN = MOCK_CSV_ROWS_SELLER.map((r, i) => {
  // Mix of resolvable + unresolvable emails to show the preview-time UX.
  // Active sellers in territoryDesign: erik@wiz.io, lisa@wiz.io, tariq@wiz.io
  // Unresolved emails fall back to needs-routing.
  const emails = [
    'erik@wiz.io',
    'lisa@wiz.io',
    'tariq@wiz.io',
    'erik@wiz.io',
    'lisa@wiz.io',
    'tariq@wiz.io',
    'sarah@wiz.io', // staged — not yet active
    'unknown@wiz.io', // unresolved
  ];
  return { ...r, owner_email: emails[i] };
});

export default function CustomCsvUploadModal({
  open,
  onClose,
  ownerId,
  ownerName,
  canShareOrgWide = false,
  onComplete,
}) {
  const [step, setStep] = useState(1); // 1=name+visibility, 2=file, 3=preview
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState(canShareOrgWide ? 'organization' : 'private');
  const [nameError, setNameError] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setName('');
      setVisibility(canShareOrgWide ? 'organization' : 'private');
      setNameError(null);
      setFileName(null);
      setRows([]);
    }
  }, [open, canShareOrgWide]);

  if (!open) return null;

  const validateName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Give your workbook a name.');
      return false;
    }
    if (isWorkbookNameTaken(trimmed)) {
      setNameError('A workbook with this name already exists.');
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateName()) return;
    setStep(2);
  };

  // Admins can upload a CSV with an account_owner_email column that
  // pre-routes accounts at import time. Sellers don't see that affordance
  // — the seller upload's owner is implicitly the uploader (handled in
  // Book of Accounts flow elsewhere).
  const resolveOwnerEmails = (parsedRows) => {
    if (!canShareOrgWide) return parsedRows; // sellers — no owner mapping
    return parsedRows.map((r) => {
      const email = (r.owner_email || '').toLowerCase().trim();
      if (!email) return { ...r, ownerSellerId: null, _ownerStatus: 'missing' };
      const seller = getSellerByEmail(email);
      if (seller) {
        return {
          ...r,
          ownerSellerId: seller.id,
          ownerName: seller.name,
          _ownerStatus: 'resolved',
        };
      }
      return { ...r, ownerSellerId: null, _ownerStatus: 'unresolved' };
    });
  };

  const handleFakeUpload = () => {
    setParsing(true);
    setFileName(`${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32) || 'workbook'}.csv`);
    setTimeout(() => {
      const source = canShareOrgWide ? MOCK_CSV_ROWS_ADMIN : MOCK_CSV_ROWS_SELLER;
      setRows(resolveOwnerEmails(source));
      setParsing(false);
      setStep(3);
    }, 500);
  };

  const handleImport = () => {
    setImporting(true);
    setTimeout(() => {
      // Strip the preview-only _ownerStatus before persisting.
      const cleanRows = rows.map(({ _ownerStatus, ...rest }) => rest);
      const wb = createCustomWorkbook({
        name: name.trim(),
        rows: cleanRows,
        ownerId,
        ownerName,
        visibility,
      });
      setImporting(false);
      onComplete?.(wb);
    }, 600);
  };

  // Owner resolution summary for the preview step (admin only).
  const ownerSummary = canShareOrgWide
    ? rows.reduce(
        (acc, r) => {
          if (r._ownerStatus === 'resolved') acc.resolved += 1;
          else if (r._ownerStatus === 'unresolved') acc.unresolved += 1;
          else acc.missing += 1;
          return acc;
        },
        { resolved: 0, unresolved: 0, missing: 0 },
      )
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-[560px] max-w-[95vw] max-h-[90vh] bg-bg border border-border rounded-md shadow-elev flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload size={14} className="text-primary" />
            <div className="text-sm font-semibold text-text-primary">
              Create workbook from CSV
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted ml-1">
              Step {step} of 3
            </span>
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
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
                  Workbook name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNext();
                  }}
                  placeholder="e.g. Q4 Field Targets · West"
                  className="w-full px-3 py-2 text-[13px] bg-surface-2 border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
                {nameError && (
                  <div className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle size={10} /> {nameError}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
                  Visibility
                </label>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={`w-full text-left px-3 py-2 rounded border flex items-start gap-2.5 transition-colors ${
                      visibility === 'private'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-surface-2'
                    }`}
                  >
                    <Lock size={12} className="text-text-muted flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-text-primary">Private</div>
                      <div className="text-[11px] text-text-muted">
                        Only you can see this workbook.
                      </div>
                    </div>
                    {visibility === 'private' && (
                      <CheckCircle2 size={12} className="text-primary flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={!canShareOrgWide}
                    onClick={() => canShareOrgWide && setVisibility('organization')}
                    className={`w-full text-left px-3 py-2 rounded border flex items-start gap-2.5 transition-colors ${
                      visibility === 'organization'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-surface-2'
                    } ${!canShareOrgWide ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Globe size={12} className="text-text-muted flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-text-primary">
                        Organization
                        {!canShareOrgWide && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider font-bold text-text-muted">
                            Admin only
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        Everyone in the workspace can view this workbook.
                      </div>
                    </div>
                    {visibility === 'organization' && (
                      <CheckCircle2 size={12} className="text-primary flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="px-3 py-2 rounded bg-bg/40 border border-border/40 text-[11px] text-text-muted flex items-start gap-2">
                <Layers size={11} className="flex-shrink-0 mt-0.5 text-text-muted" />
                <span>
                  Workbooks created from CSV are <strong>static snapshots</strong>. Re-upload to refresh.
                  Plays + scoring still apply on top of these accounts.
                </span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-[12px] text-text-secondary mb-3 leading-relaxed">
                Drop a CSV with the minimum schema:{' '}
                <code className="px-1 py-0.5 rounded bg-surface-2 text-text-primary text-[11px] font-mono">
                  account_name
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-surface-2 text-text-primary text-[11px] font-mono">
                  account_domain
                </code>
                .{canShareOrgWide ? (
                  <>
                    {' '}For routed-on-import, include{' '}
                    <code className="px-1 py-0.5 rounded bg-surface-2 text-text-primary text-[11px] font-mono">
                      account_owner_email
                    </code>
                    .
                  </>
                ) : null} Optional:{' '}
                <code className="px-1 py-0.5 rounded bg-surface-2 text-text-primary text-[11px] font-mono">
                  industry
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-surface-2 text-text-primary text-[11px] font-mono">
                  employees
                </code>
                ,{' '}
                <code className="px-1 py-0.5 rounded bg-surface-2 text-text-primary text-[11px] font-mono">
                  revenue
                </code>
                .
              </div>

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
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="text-[12px] text-text-secondary mb-3 leading-relaxed">
                <strong className="text-text-primary">{rows.length}</strong> accounts will land in a
                new workbook named{' '}
                <strong className="text-text-primary">"{name.trim()}"</strong>
                {visibility === 'private' ? ' · private to you' : ' · visible to the workspace'}.
              </div>

              {/* Owner resolution summary — admin uploads only. Tells the
                  admin how many rows were pre-routed by email mapping vs.
                  needing follow-up routing in Territory Design. */}
              {ownerSummary && (
                <div className="mb-3 px-3 py-2.5 rounded border border-border bg-bg/40">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
                    Owner resolution
                  </div>
                  <div className="flex items-center gap-3 text-[11px] flex-wrap">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 size={11} className="text-emerald-600" />
                      <strong className="text-text-primary">{ownerSummary.resolved}</strong>
                      <span className="text-text-muted">routed by email</span>
                    </span>
                    {ownerSummary.unresolved > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <AlertTriangle size={11} className="text-amber-600" />
                        <strong className="text-text-primary">{ownerSummary.unresolved}</strong>
                        <span className="text-text-muted">unresolved emails</span>
                      </span>
                    )}
                    {ownerSummary.missing > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <AlertTriangle size={11} className="text-amber-600" />
                        <strong className="text-text-primary">{ownerSummary.missing}</strong>
                        <span className="text-text-muted">no email column</span>
                      </span>
                    )}
                  </div>
                  {(ownerSummary.unresolved > 0 || ownerSummary.missing > 0) && (
                    <div className="mt-1.5 text-[10px] text-text-muted leading-relaxed">
                      Unrouted rows will show "Unassigned" in the workbook. You can finish routing
                      from <strong className="text-text-primary">Route owners →</strong> on the
                      workbook header.
                    </div>
                  )}
                </div>
              )}

              <div className="border border-border rounded-md overflow-hidden">
                <div className="px-3 py-2 bg-bg/40 border-b border-border text-[10px] uppercase tracking-wider font-semibold text-text-muted flex items-center gap-2">
                  <FileText size={10} />
                  Preview · first {Math.min(5, rows.length)} rows
                </div>
                <div className="divide-y divide-border/40">
                  {rows.slice(0, 5).map((r) => (
                    <div key={r.id} className="px-3 py-2 flex items-center gap-3 text-[12px]">
                      <span className="text-text-primary font-medium flex-1 truncate">
                        {r.name}
                      </span>
                      <span className="text-text-muted text-[11px] truncate max-w-[160px]">
                        {r.industry}
                      </span>
                      {ownerSummary && (
                        <span
                          className={`text-[10px] font-mono truncate max-w-[140px] ${
                            r._ownerStatus === 'resolved'
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-amber-700 dark:text-amber-300'
                          }`}
                          title={r.owner_email || 'no email'}
                        >
                          {r._ownerStatus === 'resolved'
                            ? `→ ${r.ownerName}`
                            : r._ownerStatus === 'unresolved'
                            ? `! ${r.owner_email}`
                            : '! unassigned'}
                        </span>
                      )}
                      <span className="text-text-muted font-mono text-[11px] truncate max-w-[140px]">
                        {r.url}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface/40">
          <button
            onClick={() => {
              if (step === 1) onClose();
              else setStep(step - 1);
            }}
            className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step === 1 && (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim"
            >
              Continue
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
                  <Loader2 size={11} className="animate-spin" /> Creating…
                </>
              ) : (
                <>
                  <CheckCircle2 size={11} /> Create workbook
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
