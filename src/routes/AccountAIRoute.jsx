import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search, Bot, ArrowRight, Pin } from 'lucide-react';
import { ACCOUNTS_BY_OWNER, getAccountById } from '../data/accounts.js';
import { useAccountDrawer } from '../context/AccountDrawerContext.jsx';

// Sidebar destination for Account AI. Two entry states:
//   1. Cold — no account selected. Show picker + recent + pinned chips.
//   2. Warm — a selected account routes straight to /account/{id}?tab=chat,
//      because the full-page thread is the actual working surface.
//
// This route is the "landing pad" so reps can start an AI conversation
// without going through the workbook. Selecting an account navigates to
// the existing Account AI tab on the account page.

function AllAccounts() {
  const out = [];
  Object.values(ACCOUNTS_BY_OWNER).forEach((list) => {
    list.forEach((a) => out.push(a));
  });
  return out;
}

function AccountChip({ account, onClick, size = 'md' }) {
  const cls =
    size === 'sm'
      ? 'px-2 py-1 text-[11px]'
      : 'px-2.5 py-1.5 text-[12px]';
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded border border-border bg-surface hover:bg-surface-2 hover:border-primary/40 text-text-primary transition-colors ${cls}`}
    >
      <span
        className={`${size === 'sm' ? 'w-4 h-4 text-[9px]' : 'w-5 h-5 text-[10px]'} rounded flex items-center justify-center text-white font-bold flex-shrink-0`}
        style={{ background: account.logoColor || '#6366f1' }}
      >
        {account.name?.[0]?.toUpperCase()}
      </span>
      <span className="truncate max-w-[180px]">{account.name}</span>
    </button>
  );
}

export default function AccountAIRoute() {
  const navigate = useNavigate();
  const { recentIds, pinnedIds } = useAccountDrawer();
  const [query, setQuery] = useState('');

  const allAccounts = useMemo(() => AllAccounts(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allAccounts
      .filter((a) => a.name.toLowerCase().includes(q) || (a.industry || '').toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, allAccounts]);

  const recent = useMemo(
    () => recentIds.map((id) => getAccountById(id)).filter(Boolean),
    [recentIds]
  );
  const pinned = useMemo(
    () => pinnedIds.map((id) => getAccountById(id)).filter(Boolean),
    [pinnedIds]
  );

  const goToAccount = (account) => {
    if (!account) return;
    navigate(`/account/${account.id}?tab=chat`);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20 mb-3">
          <Sparkles size={22} className="text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-text-primary mb-1">Account AI</h1>
        <p className="text-[13px] text-text-secondary max-w-md mx-auto">
          Ask anything about an account. Draft outreach, run plays, or dig into a signal.
          Pick an account below to open its conversation.
        </p>
      </div>

      {/* Account picker */}
      <div className="relative mb-3">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an account…"
          className="w-full pl-9 pr-3 py-2.5 bg-surface border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          autoFocus
        />
      </div>

      {filtered.length > 0 && (
        <div className="border border-border rounded-md overflow-hidden mb-6 bg-surface">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => goToAccount(a)}
              className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-0 hover:bg-surface-2 text-left transition-colors"
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: a.logoColor || '#6366f1' }}
              >
                {a.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-text-primary truncate">{a.name}</div>
                <div className="text-[11px] text-text-muted truncate">
                  {[a.industry, a.hq || a.location].filter(Boolean).join(' · ')}
                </div>
              </div>
              <ArrowRight size={12} className="text-text-muted flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Recent + pinned chips */}
      {(recent.length > 0 || pinned.length > 0) && !query && (
        <div className="space-y-5 mt-8">
          {pinned.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Pin size={11} className="text-primary" />
                <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Pinned</div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {pinned.map((a) => (
                  <AccountChip key={a.id} account={a} onClick={() => goToAccount(a)} />
                ))}
              </div>
            </div>
          )}
          {recent.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Bot size={11} className="text-text-muted" />
                <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                  Recent conversations
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {recent.map((a) => (
                  <AccountChip key={a.id} account={a} onClick={() => goToAccount(a)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state — no history yet */}
      {recent.length === 0 && pinned.length === 0 && !query && (
        <div className="mt-6 bg-surface border border-dashed border-border rounded-md p-6 text-center">
          <div className="text-[12px] text-text-muted">
            No conversations yet. Pick an account from your workbook or search above to start one.
          </div>
        </div>
      )}
    </div>
  );
}
