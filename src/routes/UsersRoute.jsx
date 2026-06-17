// Users & Sellers — RevOps admin's view of everyone with platform access.
//
// Reads from the unified seller store in territoryDesign.js. Status is one of:
//   - active        (accepted invite, logging in)
//   - invited       (magic link sent, awaiting acceptance)
//   - declined      (declined the invite)
//   - revoked       (admin revoked access)
//
// Admins can resend invites, change roles/teams, and revoke. Bulk invite via
// CSV happens in Territory Design — this surface is the steady-state manager.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Plus,
  RotateCw,
  Users as UsersIcon,
  X,
  Send,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import {
  listSellers,
  listStagedSellers,
  resendInvitation,
  subscribeTerritory,
  inviteSeller,
  ROLES,
  DEFAULT_TEAMS,
} from '../data/territoryDesign.js';
import { listBook } from '../data/territoryDesign.js';
import { useToast } from '../context/ToastContext.jsx';

// ─── Single-seller invite modal ─────────────────────────────────────────
//
// Lightweight form for inviting one seller without going through CSV upload.
// Validates email format + uniqueness, auto-derives name from email if blank,
// and auto-routes the seller to the team matching their role (1:1 mapping).

function InviteSellerModal({ open, onClose, onInvited, existingEmails }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('account_owner');
  const [region, setRegion] = useState('');
  const [error, setError] = useState('');

  function reset() {
    setName('');
    setEmail('');
    setRole('account_owner');
    setRegion('');
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e) {
    e?.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    if (existingEmails.includes(trimmed)) {
      setError('A seller with this email is already on the platform.');
      return;
    }
    const result = inviteSeller({ name, email: email.trim(), role, region });
    if (!result) {
      setError('Could not create invitation. Try again.');
      return;
    }
    onInvited({ name: name.trim() || email.trim().split('@')[0], email: email.trim() });
    reset();
  }

  if (!open) return null;

  const teamForRole = DEFAULT_TEAMS.find((t) => t.audience === role);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-lg bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg/40">
          <div className="flex items-center gap-2">
            <Send size={14} className="text-primary" />
            <h2 className="text-sm font-semibold text-text-primary">Invite a seller</h2>
          </div>
          <button onClick={handleClose} className="text-text-muted hover:text-text-primary">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="erik@wiz.io"
              className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">
              Name <span className="text-text-muted/60 normal-case tracking-normal ml-1">(optional — auto-derived from email)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Erik Larson"
              className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">
                Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary focus:border-primary/40 focus:outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">
                Region <span className="text-text-muted/60 normal-case tracking-normal ml-1">(optional)</span>
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="US-West"
                className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Auto-derived team preview */}
          <div className="bg-violet-500/5 border border-violet-500/20 rounded p-3 text-[12px]">
            <div className="flex items-center gap-1.5 text-violet-700 dark:text-violet-300 font-semibold mb-1">
              <CheckCircle2 size={11} /> Auto-assigned team
            </div>
            <div className="text-text-secondary leading-relaxed">
              This seller will join the <strong className="text-text-primary">{teamForRole?.name}</strong> team
              and inherit its offerings, scoring profile, default plays, and enabled agents. They'll receive a
              magic-link invitation valid for 14 days.
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/5 border border-rose-500/30 rounded p-2.5 text-[12px] text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              className="text-[12px] px-3 py-1.5 rounded border border-border hover:border-primary/30 text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-[12px] px-3 py-1.5 rounded bg-primary text-white hover:bg-primary-dim font-semibold inline-flex items-center gap-1.5"
            >
              <Send size={11} /> Send invitation
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function StatusChip({ status }) {
  const variants = {
    active:   { label: 'Active',   bg: 'bg-emerald-500/10', color: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/30' },
    invited:  { label: 'Invited',  bg: 'bg-blue-500/10',    color: 'text-blue-700 dark:text-blue-300',       border: 'border-blue-500/30' },
    pending:  { label: 'Pending',  bg: 'bg-amber-500/10',   color: 'text-amber-700 dark:text-amber-300',     border: 'border-amber-500/30' },
    declined: { label: 'Declined', bg: 'bg-rose-500/10',    color: 'text-rose-700 dark:text-rose-300',       border: 'border-rose-500/30' },
    revoked:  { label: 'Revoked',  bg: 'bg-text-muted/10',  color: 'text-text-muted',                          border: 'border-border' },
  };
  const v = variants[status] || variants.active;
  return (
    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${v.bg} ${v.color} border ${v.border} font-semibold`}>
      {v.label}
    </span>
  );
}

export default function UsersRoute() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [, setTick] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);
  useEffect(() => subscribeTerritory(() => setTick((t) => t + 1)), []);

  const sellers = listSellers();
  const staged = listStagedSellers();
  const book = listBook();

  // Compute book size per seller (count of rows with ownerSellerId)
  const bookSizeBySeller = book.reduce((acc, r) => {
    if (r.ownerSellerId) acc[r.ownerSellerId] = (acc[r.ownerSellerId] || 0) + 1;
    return acc;
  }, {});

  function teamLabel(teamId) {
    return DEFAULT_TEAMS.find((t) => t.id === teamId)?.name || teamId;
  }
  function roleLabel(roleId) {
    return ROLES.find((r) => r.id === roleId)?.label || roleId;
  }

  function handleResend(seller) {
    resendInvitation(seller.id);
    showToast(`Resent invitation to ${seller.name}`, 'success');
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Admin Hub
      </button>

      <div className="mb-2 text-xs text-text-muted">User Management · Users & Sellers</div>

      <div className="flex items-end justify-between mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Users & Sellers</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/territory')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary hover:text-primary hover:border-primary/40 text-xs rounded-md transition-colors"
            title="Upload a CSV with owner_email + owner_role to invite multiple sellers at once"
          >
            <Upload size={12} />
            Bulk invite (CSV)
          </button>
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
          >
            <Plus size={12} />
            Invite seller
          </button>
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-6 max-w-3xl">
        Every person with access. Bulk invitations come from CSV uploads in Territory Design (the{' '}
        <code className="bg-surface-2 px-1 py-0.5 rounded text-[11px] font-mono">owner_email</code> +{' '}
        <code className="bg-surface-2 px-1 py-0.5 rounded text-[11px] font-mono">owner_role</code> columns
        drive team auto-assignment). Resend, change roles, or revoke access from this page.
      </p>

      {/* Top callout for pending staged sellers */}
      {staged.length > 0 && (
        <div className="mb-5 bg-amber-500/5 border border-amber-500/30 rounded p-3 flex items-center gap-3">
          <Mail size={14} className="text-amber-700 dark:text-amber-300 flex-shrink-0" />
          <div className="text-[12px] text-text-secondary flex-1">
            <strong className="text-text-primary">{staged.length} sellers</strong> from your latest CSV upload
            are awaiting invitation. Review and send from{' '}
            <button
              onClick={() => navigate('/admin/territory')}
              className="text-primary hover:underline font-semibold"
            >
              Territory Design
            </button>
            .
          </div>
        </div>
      )}

      {/* User table */}
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg/40 border-b border-border text-[11px] uppercase tracking-wider text-text-muted">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">Name</th>
              <th className="text-left px-3 py-2 font-semibold">Email</th>
              <th className="text-left px-3 py-2 font-semibold">Role</th>
              <th className="text-left px-3 py-2 font-semibold">Team</th>
              <th className="text-left px-3 py-2 font-semibold">Region</th>
              <th className="text-left px-3 py-2 font-semibold">Book size</th>
              <th className="text-left px-3 py-2 font-semibold">Status</th>
              <th className="text-right px-3 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => {
              const bookSize = bookSizeBySeller[s.id] || 0;
              return (
                <tr key={s.id} className="border-b border-border/60 hover:bg-bg/40">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center font-semibold">
                        {s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-[13px] text-text-primary">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[12px] text-text-secondary">{s.email}</td>
                  <td className="px-3 py-2 text-[12px] text-text-secondary">{roleLabel(s.role)}</td>
                  <td className="px-3 py-2 text-[12px] text-text-secondary">{teamLabel(s.teamId || s.team)}</td>
                  <td className="px-3 py-2 text-[12px] text-text-secondary">{s.region || '—'}</td>
                  <td className="px-3 py-2 text-[12px]">
                    {bookSize > 0 ? (
                      <span className="font-semibold text-text-primary">{bookSize}</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <StatusChip status={s.status || 'active'} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {(s.status === 'invited' || s.status === 'declined') ? (
                      <button
                        onClick={() => handleResend(s)}
                        className="text-[11px] px-2 py-1 rounded border border-border hover:border-primary/40 text-text-secondary hover:text-primary inline-flex items-center gap-1"
                        title={s.invitedAt ? `Last sent ${s.invitedAt}` : undefined}
                      >
                        <RotateCw size={10} />
                        Resend
                      </button>
                    ) : (
                      <span className="text-[10px] text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {sellers.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-text-muted text-sm py-10">
                  <UsersIcon size={20} className="mx-auto mb-2 text-text-muted/50" />
                  No sellers yet. Upload a Book CSV in Territory Design or use{' '}
                  <button onClick={() => setInviteOpen(true)} className="text-primary hover:underline font-semibold">
                    Invite seller
                  </button>{' '}
                  to add one manually.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        <InviteSellerModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          existingEmails={sellers.map((s) => s.email.toLowerCase())}
          onInvited={({ name, email }) => {
            setInviteOpen(false);
            showToast(`Invitation sent to ${name} (${email})`, 'success');
          }}
        />
      </AnimatePresence>
    </div>
  );
}
