// SellerPicker — popover for assigning a row (or bulk selection) to a
// platform user. Pulls from listSellers() (active platform users) and
// listStagedSellers() (discovered from CSV uploads, not yet invited).
// Staged sellers are dimmed + tagged "Pending invite" — picking one
// stages the assignment but it won't activate until the seller accepts.
//
// Used by:
//   - Inline Owner cell in SellerWorkbookTable (single-row assign)
//   - WorkbookRoutingRoute bulk-assign toolbar
//
// Anchored vs. centered modal: pass `anchorRect` for popover, omit for
// centered modal (used by bulk action).

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, UserCircle2, Mail, CheckCircle2 } from 'lucide-react';
import { listSellers, listStagedSellers } from '../../data/territoryDesign.js';

const ROLE_LABELS = {
  account_owner: 'Account Owner',
  csm: 'CSM',
  sdr: 'SDR',
};

function SellerRow({ seller, staged = false, isSelected, onPick }) {
  const initials = (seller.name || seller.email || '?')
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <button
      type="button"
      onClick={() => onPick(seller.id || seller.email)}
      className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-surface-2 transition-colors ${
        isSelected ? 'bg-primary/5' : ''
      } ${staged ? 'opacity-75' : ''}`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
          staged
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
            : 'bg-primary/10 text-primary'
        }`}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-text-primary truncate">{seller.name}</span>
          {staged && (
            <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex-shrink-0">
              Pending invite
            </span>
          )}
        </div>
        <div className="text-[10px] text-text-muted truncate">
          {seller.email}
          {seller.role ? ` · ${ROLE_LABELS[seller.role] || seller.role}` : ''}
          {seller.region ? ` · ${seller.region}` : ''}
        </div>
      </div>
      {isSelected && <CheckCircle2 size={12} className="text-primary flex-shrink-0" />}
    </button>
  );
}

export default function SellerPicker({
  currentOwnerId,
  onPick, // (sellerId | null) => void — null = unassign
  onClose,
  // Optional: anchor positioning (left, top in px) for inline use
  anchorRect = null,
}) {
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const { active, staged } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (s) =>
      !q ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.region || '').toLowerCase().includes(q);
    return {
      active: listSellers().filter(matches),
      staged: listStagedSellers().filter(matches),
    };
  }, [query]);

  // Anchored popover positioning — clamp to viewport
  const style = anchorRect
    ? {
        position: 'fixed',
        left: Math.min(anchorRect.left, window.innerWidth - 320),
        top: anchorRect.bottom + 4,
        zIndex: 60,
      }
    : null;

  const body = (
    <div
      ref={rootRef}
      className="w-[320px] max-h-[420px] bg-bg border border-border rounded-md shadow-elev flex flex-col overflow-hidden"
      style={style || undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Search size={11} className="text-text-muted" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, region…"
          className="flex-1 text-[12px] bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        {!anchorRect && (
          <button
            onClick={onClose}
            className="p-0.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary"
          >
            <X size={11} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {currentOwnerId && (
          <button
            type="button"
            onClick={() => onPick(null)}
            className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-surface-2 transition-colors border-b border-border/40"
          >
            <div className="w-7 h-7 rounded-full bg-text-muted/10 border border-border flex items-center justify-center flex-shrink-0">
              <UserCircle2 size={14} className="text-text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-text-primary">Unassigned</div>
              <div className="text-[10px] text-text-muted">Remove the current owner</div>
            </div>
          </button>
        )}

        {active.length > 0 && (
          <>
            <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider font-semibold text-text-muted bg-bg/30">
              Active
            </div>
            {active.map((s) => (
              <SellerRow
                key={s.id}
                seller={s}
                isSelected={s.id === currentOwnerId}
                onPick={onPick}
              />
            ))}
          </>
        )}

        {staged.length > 0 && (
          <>
            <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider font-semibold text-text-muted bg-bg/30 border-t border-border/40">
              Pending invite
            </div>
            {staged.map((s) => (
              <SellerRow
                key={s.email}
                seller={s}
                staged
                isSelected={s.email === currentOwnerId}
                onPick={onPick}
              />
            ))}
          </>
        )}

        {active.length === 0 && staged.length === 0 && (
          <div className="px-3 py-6 text-center text-[11px] text-text-muted">
            No sellers match "{query}".
            <div className="mt-2 inline-flex items-center gap-1 text-primary text-[11px]">
              <Mail size={10} /> Invite by email (admin only)
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Anchored mode: render as positioned popover. Modal mode: center
  // overlay used by bulk routing.
  if (anchorRect) return body;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      {body}
    </div>
  );
}
