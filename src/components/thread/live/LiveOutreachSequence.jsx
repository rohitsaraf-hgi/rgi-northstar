import { useState } from 'react';
import {
  Mail,
  Send,
  Edit3,
  Clock,
  Sparkles,
  Building2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LiveFrame } from './LiveFrame.jsx';
import { OUTREACH_SEQUENCES } from '../../../data/outreachData.js';
import { useToast } from '../../../context/ToastContext.jsx';

function EmailCard({ email, accountName, onSend, onEdit, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-bg/40 border border-border rounded-md overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-bg/60 transition-colors"
      >
        <div className="flex-shrink-0 mt-0.5">
          <div className="text-[10px] uppercase tracking-wider font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
            {email.day}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-text-primary truncate">{email.subject}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-text-muted">
            <Clock size={10} />
            <span>{email.sendAt}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Sparkles size={9} className="text-primary" />
              {email.signalHook}
            </span>
          </div>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-text-muted flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronDown size={14} className="text-text-muted flex-shrink-0 mt-0.5" />
        )}
      </button>
      {open && (
        <div className="border-t border-border">
          <div className="p-4 text-xs text-text-primary whitespace-pre-wrap leading-relaxed font-sans">
            {email.body}
          </div>
          <div className="px-4 py-2 border-t border-border bg-bg/40 flex items-center justify-end gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-text-secondary hover:bg-surface-2 hover:text-text-primary rounded transition-colors"
            >
              <Edit3 size={11} />
              Edit
            </button>
            <button
              onClick={onSend}
              className="flex items-center gap-1 px-2.5 py-1 bg-primary text-white text-xs rounded hover:bg-primary-dim transition-colors"
            >
              <Send size={11} />
              Schedule via Outreach
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LiveOutreachSequence({ sequenceId = 'top3-stale-renewals', onPin }) {
  const seq = OUTREACH_SEQUENCES[sequenceId];
  const [activeAccountId, setActiveAccountId] = useState(seq?.accounts[0]?.id);
  const { showToast } = useToast();

  if (!seq) return null;

  const activeAccount = seq.accounts.find((a) => a.id === activeAccountId) || seq.accounts[0];

  return (
    <LiveFrame
      title={seq.title}
      subtitle="Three-touch sequence per account, AI-drafted from each account's signal context. Edit any email before scheduling."
      onPin={onPin}
      footer={`${seq.accounts.length} accounts × 3 emails each · ${seq.accounts.length * 3} touches total`}
    >
      <div className="flex items-center gap-1 mb-4 border-b border-border overflow-x-auto">
        {seq.accounts.map((a) => (
          <button
            key={a.id}
            onClick={() => setActiveAccountId(a.id)}
            className={`px-3 py-2 text-xs transition-colors border-b-2 -mb-px whitespace-nowrap flex items-center gap-2 ${
              activeAccountId === a.id
                ? 'text-text-primary border-primary'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            <Building2 size={11} />
            {a.name}
          </button>
        ))}
      </div>

      <div
        className={`mb-4 p-3 border rounded-md ${activeAccount.playBg}`}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[10px] uppercase tracking-wider font-bold ${activeAccount.playColor}`}>
            {activeAccount.playType}
          </span>
        </div>
        <div className="text-xs text-text-primary leading-relaxed">{activeAccount.contextOneLiner}</div>
      </div>

      <div className="space-y-2">
        {activeAccount.emails.map((email, i) => (
          <EmailCard
            key={i}
            email={email}
            accountName={activeAccount.name}
            defaultOpen={i === 0}
            onSend={() =>
              showToast(
                `Scheduled "${email.subject}" via Outreach for ${activeAccount.name} · ${email.sendAt}`
              )
            }
            onEdit={() => showToast('Edit mode would open inline here', 'info')}
          />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-text-muted">
          All 3 sequences total <span className="font-mono text-text-secondary">9 emails across 14 days</span>
        </div>
        <button
          onClick={() => showToast('All 9 emails scheduled · first goes out today at 11:00 AM PT')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
        >
          <Mail size={11} />
          Schedule full sequence
        </button>
      </div>
    </LiveFrame>
  );
}
