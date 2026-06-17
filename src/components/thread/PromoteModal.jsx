import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Users } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';

const SUGGESTED_INVITEES = {
  maya: { name: 'Priya Sharma', role: 'RevOps', email: 'priya@hginsights.com' },
  jordan: { name: 'Alex Reed', role: 'AE Manager', email: 'alex@hginsights.com' },
  priya: { name: 'Jordan Chen', role: 'AE', email: 'jordan@hginsights.com' },
};

export default function PromoteModal({ open, onClose, thread, onConfirm, ownerPersonaId }) {
  const [role, setRole] = useState('Contributor');
  const [note, setNote] = useState('');
  const { showToast } = useToast();

  const suggestion = SUGGESTED_INVITEES[ownerPersonaId] || SUGGESTED_INVITEES.maya;
  const [invitee, setInvitee] = useState(suggestion.name);

  const handleConfirm = () => {
    showToast(`${invitee} invited as ${role}`);
    onConfirm({ invitee, role, note });
    onClose();
    setNote('');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="bg-surface border border-border rounded-xl w-full max-w-lg pointer-events-auto">
              <div className="p-6 border-b border-border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-primary" />
                    <h2 className="text-base font-semibold">Promote to Collaborative Workspace</h2>
                  </div>
                  <button onClick={onClose} className="p-1 rounded hover:bg-surface-2 text-text-muted">
                    <X size={16} />
                  </button>
                </div>
                <p className="text-sm text-text-secondary">
                  Invite a colleague to collaborate on this thread. They'll see the conversation, artifacts, and timeline — and can contribute new turns.
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-text-muted block mb-1.5">
                    Thread
                  </label>
                  <div className="text-sm text-text-primary bg-bg/40 border border-border rounded-md px-3 py-2">
                    {thread?.name}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-text-muted block mb-1.5">
                    Invite participants
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={invitee}
                      onChange={(e) => setInvitee(e.target.value)}
                      placeholder="Name or email"
                      className="flex-1 bg-bg border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/40"
                    />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="bg-bg border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/40"
                    >
                      <option>Contributor</option>
                      <option>Reviewer</option>
                      <option>Viewer</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setInvitee(suggestion.name)}
                    className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    <UserPlus size={11} />
                    Suggested: {suggestion.name} — {suggestion.role}
                  </button>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-text-muted block mb-1.5">
                    Add a context note (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="What should they review or weigh in on?"
                    className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/40 resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border bg-bg/30 flex items-center justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!invitee.trim()}
                  className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Promote & Invite
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
