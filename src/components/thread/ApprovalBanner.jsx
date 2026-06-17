import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, MessageSquare, Clock, ExternalLink, Sparkles } from 'lucide-react';
import { useApprovals } from '../../context/ApprovalContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { SURFACES } from '../../data/surfaces.js';

// Banner shown at the top of a thread when there's an active approval request.
// Demonstrates cross-surface state sync — clicking Approve here OR in the
// Slack tab updates everywhere instantly (because both read from the same
// ApprovalContext).

export default function ApprovalBanner({ approval }) {
  const { resolvedApprovals, resolvedSurfaces, resolvedAt, resolveApproval } = useApprovals();
  const { showToast } = useToast();
  const decision = resolvedApprovals[approval.id];
  const surface = resolvedSurfaces[approval.id];
  const at = resolvedAt[approval.id];
  const sentViaCfg = SURFACES[approval.sentVia];

  const isResolved = !!decision;

  const handleDecision = (kind) => {
    resolveApproval(approval.id, kind, 'browser');
    showToast(
      kind === 'approve'
        ? 'Approved · Slack message updates in real-time'
        : 'Rejected · Slack message updates in real-time',
      kind === 'approve' ? 'success' : 'info'
    );
  };

  return (
    <AnimatePresence mode="wait">
      {!isResolved ? (
        <motion.div
          key="pending"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="mx-6 mt-3 mb-2 px-4 py-3 bg-warning/8 border border-warning/30 rounded-md"
        >
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-md bg-warning/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock size={13} className="text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-warning">Awaiting approval</span>
                <span className="text-text-muted">·</span>
                <span className="text-[11px] text-text-secondary">{approval.requestedAt}</span>
                {sentViaCfg && (
                  <>
                    <span className="text-text-muted">·</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-text-secondary">
                      <MessageSquare size={9} />
                      Sent to {approval.requestedFrom} via {sentViaCfg.label}
                    </span>
                  </>
                )}
              </div>
              <div className="text-sm font-semibold text-text-primary mb-1">{approval.title}</div>
              <div className="text-xs text-text-secondary leading-relaxed mb-3">{approval.summary}</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleDecision('approve')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-success text-white text-xs font-semibold rounded-md hover:bg-success/90 transition-colors"
                >
                  <Check size={11} />
                  Approve
                </button>
                <button
                  onClick={() => handleDecision('reject')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-border text-danger text-xs font-semibold rounded-md hover:bg-danger/5 transition-colors"
                >
                  <X size={11} />
                  Reject
                </button>
                <span className="text-[10px] text-text-muted ml-2">
                  Or approve from Slack — same result
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="resolved"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mx-6 mt-3 mb-2 px-4 py-2.5 rounded-md flex items-center gap-3 ${
            decision === 'approve'
              ? 'bg-success/8 border border-success/30'
              : 'bg-danger/8 border border-danger/30'
          }`}
        >
          {decision === 'approve' ? (
            <Check size={14} className="text-success flex-shrink-0" />
          ) : (
            <X size={14} className="text-danger flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0 text-xs">
            <span className="text-text-primary font-medium">{approval.title}</span>
            <span className="text-text-muted">{' · '}</span>
            <span
              className={`font-semibold ${
                decision === 'approve' ? 'text-success' : 'text-danger'
              }`}
            >
              {decision === 'approve' ? 'Approved' : 'Rejected'}
            </span>
            <span className="text-text-muted">
              {' · '}via {SURFACES[surface]?.label || 'Web'}
              {at && ` at ${at}`}
            </span>
          </div>
          <Sparkles size={11} className="text-primary" />
          <span className="text-[10px] text-primary">Synced across all surfaces</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
