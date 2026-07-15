import { useMemo, useState } from 'react';
import { X, ListChecks, CheckCircle2, XCircle, Edit3, Mail, Building2, User } from 'lucide-react';

// Mock drafts that stand in for what a real Prospecting batch would produce.
// The point of this preview is UX demonstration — reps grok how per-item
// accept/reject / edit works before ever running a live workflow.
const MOCK_DRAFTS = [
  {
    id: 'd_1',
    account: 'Snowflake',
    contact: 'Sarah Chen · VP Engineering',
    subject: 'Cutting your Databricks bill by 34% — a specific approach',
    body: 'Hi Sarah — I noticed Snowflake\'s reliance on Databricks for streaming has grown ~40% YoY (per HG). Three peers in your segment cut spend by 30%+ by moving that layer to our platform — happy to share the exact playbook. Worth 20 mins next week?',
  },
  {
    id: 'd_2',
    account: 'Snowflake',
    contact: 'Marcus Wu · Head of Data Platform',
    subject: 'Data platform sprawl — a pattern from your peers',
    body: 'Hi Marcus — three companies your size (all running Databricks + Snowflake) have consolidated onto us this quarter. Common thread: 32% cost reduction and 2x pipeline reliability. Would a 15-min technical walkthrough be useful?',
  },
  {
    id: 'd_3',
    account: 'Cloudflare',
    contact: 'Elena Petrov · Director, Security Engineering',
    subject: 'Your CrowdStrike renewal is 6 months out — here\'s what we\'d show',
    body: 'Hi Elena — noticed your CrowdStrike contract cycles in October. We\'ve helped 8 similar security orgs cut incident MTTR by 45% while consolidating tooling. Would a benchmark call make sense before renewal planning starts?',
  },
  {
    id: 'd_4',
    account: 'Cloudflare',
    contact: 'James Park · VP Platform',
    subject: 'Consolidating security tooling — a peer-group benchmark',
    body: 'Hi James — Cloudflare\'s stack (Datadog + Splunk + CrowdStrike per HG) matches a pattern we\'ve seen consolidate 3-to-1 this year. Interested in a comparison to companies who\'ve made that move?',
  },
  {
    id: 'd_5',
    account: 'Databricks',
    contact: 'Priya Menon · Head of ML Infrastructure',
    subject: 'ML infra pattern from Netflix / Airbnb / Stripe',
    body: 'Hi Priya — three ML orgs your size adopted our platform this quarter, all citing feature-store fragmentation as the trigger. Would a 20-min walkthrough of the architecture be useful?',
  },
];

function DraftCard({ draft, verdict, onApprove, onReject, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(draft.body);

  const borderCls = verdict === 'approved'
    ? 'border-emerald-500/40 bg-emerald-500/5'
    : verdict === 'rejected'
    ? 'border-rose-500/40 bg-rose-500/5 opacity-60'
    : 'border-border bg-surface';

  return (
    <div className={`px-3 py-3 rounded border transition-colors ${borderCls}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
            <Building2 size={9} />
            <span className="font-semibold">{draft.account}</span>
            <span className="text-text-muted">·</span>
            <User size={9} />
            <span>{draft.contact}</span>
          </div>
          <div className="text-xs font-semibold text-text-primary mt-1 leading-snug">{draft.subject}</div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onApprove}
            className={`p-1 rounded transition-colors ${verdict === 'approved' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'text-text-muted hover:text-emerald-600 hover:bg-emerald-500/10'}`}
            title="Approve"
          >
            <CheckCircle2 size={13} />
          </button>
          <button
            onClick={onReject}
            className={`p-1 rounded transition-colors ${verdict === 'rejected' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300' : 'text-text-muted hover:text-rose-600 hover:bg-rose-500/10'}`}
            title="Reject"
          >
            <XCircle size={13} />
          </button>
          <button
            onClick={() => setEditing((e) => !e)}
            className={`p-1 rounded transition-colors ${editing ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-primary hover:bg-primary/10'}`}
            title="Edit before approving"
          >
            <Edit3 size={13} />
          </button>
        </div>
      </div>
      {editing ? (
        <div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full px-2 py-1.5 text-[11px] bg-bg border border-border rounded text-text-primary focus:outline-none focus:border-primary/40"
          />
          <div className="flex gap-1.5 mt-1.5">
            <button
              onClick={() => { onEdit?.(body); setEditing(false); }}
              className="text-[10px] font-semibold text-primary hover:underline"
            >
              Save edit
            </button>
            <button
              onClick={() => { setBody(draft.body); setEditing(false); }}
              className="text-[10px] text-text-muted hover:text-text-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-text-secondary leading-relaxed">{body}</p>
      )}
    </div>
  );
}

export default function BatchApprovalPreview({ tree, onClose }) {
  // Find the first batch-approval checkpoint (or fall back to any approval).
  const gateNode = useMemo(() => {
    const nodes = tree?.nodes || {};
    const batch = Object.values(nodes).find((n) => n.type === 'checkpoint.batch_approval');
    if (batch) return batch;
    return Object.values(nodes).find((n) => n.type === 'checkpoint.approval') || null;
  }, [tree]);

  const groupBy = gateNode?.config?.group_by || 'account';
  const perItemEdit = gateNode?.config?.per_item_edit !== 'no';

  const [verdicts, setVerdicts] = useState({});
  const [, setEdits] = useState({});

  const setVerdict = (id, verdict) => {
    setVerdicts((v) => {
      const next = { ...v };
      if (next[id] === verdict) delete next[id];
      else next[id] = verdict;
      return next;
    });
  };

  const setEdit = (id, body) => setEdits((e) => ({ ...e, [id]: body }));

  const approveAll = () => {
    const next = {};
    for (const d of MOCK_DRAFTS) next[d.id] = 'approved';
    setVerdicts(next);
  };
  const rejectAll = () => {
    const next = {};
    for (const d of MOCK_DRAFTS) next[d.id] = 'rejected';
    setVerdicts(next);
  };

  const grouped = useMemo(() => {
    if (groupBy === 'none (flat list)') return { All: MOCK_DRAFTS };
    const out = {};
    for (const d of MOCK_DRAFTS) {
      const key = groupBy === 'account' ? d.account : d.contact;
      if (!out[key]) out[key] = [];
      out[key].push(d);
    }
    return out;
  }, [groupBy]);

  const approvedCount = Object.values(verdicts).filter((v) => v === 'approved').length;
  const rejectedCount = Object.values(verdicts).filter((v) => v === 'rejected').length;
  const pendingCount = MOCK_DRAFTS.length - approvedCount - rejectedCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <div className="bg-bg border border-border rounded-lg shadow-modal max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center">
              <ListChecks size={15} className="text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Batch approval — preview</h2>
              <p className="text-[11px] text-text-muted">
                {MOCK_DRAFTS.length} drafts · grouped by {groupBy} · {perItemEdit ? 'per-item edit enabled' : 'read-only'}
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

        <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2 border-b border-border bg-surface-2/40">
          <div className="flex items-center gap-1 text-[10px]">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold">
              {approvedCount} approved
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold">
              {rejectedCount} rejected
            </span>
            <span className="px-2 py-0.5 rounded bg-surface border border-border text-text-secondary font-semibold">
              {pendingCount} pending
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={approveAll}
              className="flex items-center gap-1 px-2 py-1 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] rounded hover:bg-emerald-500/10 transition-colors"
            >
              <CheckCircle2 size={11} />
              Approve all
            </button>
            <button
              onClick={rejectAll}
              className="flex items-center gap-1 px-2 py-1 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] rounded hover:bg-rose-500/10 transition-colors"
            >
              <XCircle size={11} />
              Reject all
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {Object.entries(grouped).map(([groupKey, drafts]) => (
            <div key={groupKey}>
              <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                <Mail size={10} />
                {groupKey}
                <span className="text-text-muted">·</span>
                <span className="font-mono">{drafts.length} draft{drafts.length === 1 ? '' : 's'}</span>
              </div>
              <div className="space-y-2">
                {drafts.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    verdict={verdicts[draft.id]}
                    onApprove={() => setVerdict(draft.id, 'approved')}
                    onReject={() => setVerdict(draft.id, 'rejected')}
                    onEdit={perItemEdit ? (body) => setEdit(draft.id, body) : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-[10px] text-text-muted leading-snug max-w-md">
            Only approved drafts continue to downstream steps (Add to CRM, Enroll in sequence). Rejected drafts are excluded from the entire batch.
          </p>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
          >
            Close preview
          </button>
        </div>
      </div>
    </div>
  );
}
