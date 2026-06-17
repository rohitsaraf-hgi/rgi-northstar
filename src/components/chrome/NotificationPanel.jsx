import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, AlertCircle, Activity, Sparkles, ChevronRight, MessageSquare } from 'lucide-react';
import { usePersona } from '../../context/PersonaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { NOTIFICATIONS } from '../../data/personaContent.js';
import { THREADS } from '../../data/threads.js';
import SlackMessages from './SlackMessages.jsx';
import { useApprovals } from '../../context/ApprovalContext.jsx';

function Section({ title, accent, items, onItemClick }) {
  const accentClass =
    accent === 'red' ? 'border-l-danger' : accent === 'green' ? 'border-l-success' : 'border-l-primary';
  const titleColor =
    accent === 'red' ? 'text-danger' : accent === 'green' ? 'text-success' : 'text-primary';
  const Icon = accent === 'red' ? AlertCircle : accent === 'green' ? Activity : Sparkles;

  return (
    <div className="mb-5">
      <div className={`flex items-center gap-2 mb-2 ${titleColor}`}>
        <Icon size={14} />
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        <span className="text-text-muted text-xs">({items.length})</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => {
          const t = THREADS[item.threadId];
          return (
            <button
              key={i}
              onClick={() => item.threadId && onItemClick(item.threadId)}
              className={`w-full text-left p-3 bg-surface border-l-2 ${accentClass} border-y border-r border-border rounded-r-md hover:bg-surface-2 transition-colors group`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {t && (
                    <div className="text-xs text-text-secondary mb-1 truncate">{t.name}</div>
                  )}
                  <div className="text-sm text-text-primary">{item.text}</div>
                  {item.timestamp && (
                    <div className="text-xs text-text-muted mt-1">{item.timestamp}</div>
                  )}
                </div>
                <ChevronRight
                  size={14}
                  className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AwarenessTab({ data, onItemClick, navigate }) {
  return (
    <>
      <Section
        title="Needs Your Input"
        accent="red"
        items={data.needsInput}
        onItemClick={onItemClick}
      />
      <Section
        title="In Motion"
        accent="green"
        items={data.inMotion}
        onItemClick={onItemClick}
      />
      <Section
        title="Suggested"
        accent="blue"
        items={data.suggested.map((s) => ({ ...s, threadId: null }))}
        onItemClick={() => navigate('/use-cases')}
      />

      <div className="mt-2 p-4 bg-surface-2 border border-border rounded-md">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={12} className="text-primary" />
          <div className="text-xs uppercase tracking-wider text-text-muted font-semibold">
            Tomorrow's Digest Preview
          </div>
        </div>
        <div className="text-xs text-text-secondary mb-1">{data.digestPreview.time}</div>
        <div className="text-sm font-medium text-text-primary mb-3">
          {data.digestPreview.title}
        </div>
        <ul className="space-y-1.5">
          {data.digestPreview.bullets.map((b, i) => (
            <li key={i} className="text-sm text-text-secondary leading-relaxed">{b}</li>
          ))}
        </ul>
      </div>

      <button className="mt-4 text-xs text-text-muted hover:text-text-secondary transition-colors">
        Notification preferences →
      </button>
    </>
  );
}

export default function NotificationPanel({ open, onClose }) {
  const { personaId } = usePersona();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { resolvedApprovals, resolveApproval } = useApprovals();
  const [tab, setTab] = useState('awareness');
  const data = NOTIFICATIONS[personaId];

  const handleItemClick = (threadId) => {
    navigate(`/thread/${threadId}`);
    onClose();
  };

  const handleApprovalAction = (approvalId, decision, msg) => {
    resolveApproval(approvalId, decision, 'slack');
    if (decision === 'approve') {
      showToast(`Approved via Slack — platform thread updated in real time`);
    } else {
      showToast(`Rejected via Slack — platform thread updated`, 'info');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-[440px] bg-bg border-l border-border z-50 flex flex-col"
          >
            <div className="h-14 flex items-center justify-between px-5 border-b border-border flex-shrink-0">
              <div>
                <div className="text-sm font-semibold text-text-primary">Awareness</div>
                <div className="text-xs text-text-muted">Multi-surface notifications</div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-surface text-text-muted"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-border flex-shrink-0 px-5 flex items-center gap-1">
              <button
                onClick={() => setTab('awareness')}
                className={`px-3 py-2 text-xs transition-colors border-b-2 -mb-px font-medium flex items-center gap-1.5 ${
                  tab === 'awareness'
                    ? 'text-text-primary border-primary'
                    : 'text-text-secondary border-transparent hover:text-text-primary'
                }`}
              >
                <Sparkles size={11} />
                In platform
              </button>
              <button
                onClick={() => setTab('slack')}
                className={`px-3 py-2 text-xs transition-colors border-b-2 -mb-px font-medium flex items-center gap-1.5 ${
                  tab === 'slack'
                    ? 'text-text-primary border-primary'
                    : 'text-text-secondary border-transparent hover:text-text-primary'
                }`}
              >
                <MessageSquare size={11} />
                In Slack
              </button>
            </div>

            <div className="flex-1 overflow-y-auto thin-scrollbar p-5">
              {tab === 'awareness' && data && (
                <AwarenessTab data={data} onItemClick={handleItemClick} navigate={navigate} />
              )}
              {tab === 'slack' && (
                <SlackMessages
                  resolvedApprovals={resolvedApprovals}
                  onApprovalAction={handleApprovalAction}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
