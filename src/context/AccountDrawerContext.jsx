import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/*
 * AccountDrawerContext
 *
 * Powers the workbook triage flow: L1 hover preview, L2 side drawer,
 * L3 full-page. Drives keyboard navigation (j/k next/prev), pinning,
 * and per-account thread existence for the ✨ badge on workbook rows.
 *
 * Thread map is intentionally lightweight — an in-memory Set of account
 * IDs the seller has already opened an Account AI conversation for. The
 * drawer sets it when the user clicks "Open Account AI"; sidebar Account
 * AI reads it to render Recent chips.
 */

const AccountDrawerContext = createContext(null);

const RECENT_LIMIT = 12;

export function AccountDrawerProvider({ children }) {
  const [openAccount, setOpenAccount] = useState(null);
  const [accountsList, setAccountsList] = useState([]);
  const [threadedIds, setThreadedIds] = useState(() => new Set());
  const [recentIds, setRecentIds] = useState([]);
  const [pinnedIds, setPinnedIds] = useState([]);
  const openerRef = useRef(null);

  const openAccountDrawer = useCallback((account, opts = {}) => {
    if (!account) return;
    setOpenAccount(account);
    if (Array.isArray(opts.accountsList)) setAccountsList(opts.accountsList);
    if (typeof document !== 'undefined') openerRef.current = document.activeElement;
  }, []);

  const closeAccountDrawer = useCallback(() => {
    setOpenAccount(null);
    // Return focus to the originating row when we can.
    if (openerRef.current?.focus) {
      try { openerRef.current.focus(); } catch (_) { /* noop */ }
    }
  }, []);

  const stepAccount = useCallback(
    (delta) => {
      if (!openAccount || accountsList.length === 0) return null;
      const idx = accountsList.findIndex((a) => a.id === openAccount.id);
      if (idx === -1) return null;
      const nextIdx = (idx + delta + accountsList.length) % accountsList.length;
      const next = accountsList[nextIdx];
      setOpenAccount(next);
      return next;
    },
    [openAccount, accountsList]
  );

  const markAccountAIStarted = useCallback((accountId) => {
    if (!accountId) return;
    setThreadedIds((prev) => {
      if (prev.has(accountId)) return prev;
      const next = new Set(prev);
      next.add(accountId);
      return next;
    });
    setRecentIds((prev) => [accountId, ...prev.filter((id) => id !== accountId)].slice(0, RECENT_LIMIT));
  }, []);

  const togglePin = useCallback((accountId) => {
    if (!accountId) return;
    setPinnedIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [accountId, ...prev]
    );
  }, []);

  const value = useMemo(
    () => ({
      openAccount,
      accountsList,
      openAccountDrawer,
      closeAccountDrawer,
      nextAccount: () => stepAccount(1),
      prevAccount: () => stepAccount(-1),
      threadedIds,
      hasThread: (id) => threadedIds.has(id),
      markAccountAIStarted,
      recentIds,
      pinnedIds,
      togglePin,
      isPinned: (id) => pinnedIds.includes(id),
    }),
    [openAccount, accountsList, openAccountDrawer, closeAccountDrawer, stepAccount, threadedIds, markAccountAIStarted, recentIds, pinnedIds, togglePin]
  );

  // Global keyboard shortcuts while the drawer is open.
  useEffect(() => {
    if (!openAccount) return undefined;
    const handler = (e) => {
      // Ignore when typing into a form field.
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'Escape') {
        closeAccountDrawer();
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        stepAccount(1);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        stepAccount(-1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openAccount, closeAccountDrawer, stepAccount]);

  return <AccountDrawerContext.Provider value={value}>{children}</AccountDrawerContext.Provider>;
}

export function useAccountDrawer() {
  const ctx = useContext(AccountDrawerContext);
  if (!ctx) throw new Error('useAccountDrawer must be used inside AccountDrawerProvider');
  return ctx;
}
