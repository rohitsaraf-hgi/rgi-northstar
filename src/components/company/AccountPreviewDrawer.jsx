import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Maximize2,
  Sparkles,
  Crown,
  Package,
  Copy,
  Pin,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Lightbulb,
} from 'lucide-react';
import { useAccountDrawer } from '../../context/AccountDrawerContext.jsx';
import { listOfferings } from '../../data/offerings.js';
import { getHgIntelligence, OFFERING_CODES, resolveAccountOverview } from '../../data/hgIntelligence.js';
import { useToast } from '../../context/ToastContext.jsx';

// L2 side drawer — 45% width by default. Shows a *condensed* Overview:
// Why Now + Lead-With opener + top 3 highlights. Everything else lives
// behind "See all evidence →" which takes the user to the full page.
//
// Keyboard: Esc close, j/k or ↑↓ move to prev/next account in the list.

function StatChip({ label, value }) {
  if (!value) return null;
  return (
    <div className="px-2 py-1 rounded border border-border bg-bg/40 min-w-0">
      <div className="text-[9px] uppercase tracking-wider text-text-muted font-semibold leading-none">{label}</div>
      <div className="text-[12px] font-semibold text-text-primary truncate leading-tight mt-0.5">{value}</div>
    </div>
  );
}

function WhyNowCompact({ accountName, whyNow }) {
  if (!whyNow) return null;
  return (
    <div className="bg-gradient-to-br from-violet-500/5 via-primary/5 to-emerald-500/5 border border-violet-500/30 rounded-md p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles size={12} className="text-violet-700 dark:text-violet-300" />
        <div className="text-[10px] uppercase tracking-wider font-bold text-violet-700 dark:text-violet-300">
          Why now · {accountName}
        </div>
        {whyNow.freshness && (
          <span className="ml-auto text-[10px] text-text-muted">{whyNow.freshness}</span>
        )}
      </div>
      <p className="text-[12.5px] text-text-secondary leading-relaxed">{whyNow.narrative}</p>
      {Array.isArray(whyNow.triggers) && whyNow.triggers.length > 0 && (
        <div className="mt-2 flex items-center gap-1 flex-wrap">
          {whyNow.triggers.slice(0, 4).map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface border border-border text-text-secondary"
            >
              {t.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function LeadWithCompact({ leadWith, onCopyOpener }) {
  if (!leadWith) return null;
  const leadOffering = leadWith.offering;
  return (
    <div className="bg-surface border-2 border-primary/30 rounded-md p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Crown size={11} className="text-primary" />
        <div className="text-[10px] uppercase tracking-wider font-bold text-primary">Lead with</div>
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        {leadOffering && (
          <span className={`w-5 h-5 rounded ${leadOffering.bg || 'bg-primary/10'} flex items-center justify-center flex-shrink-0`}>
            <Package size={11} className={leadOffering.textColor || 'text-primary'} />
          </span>
        )}
        <span className="text-[13px] font-semibold text-text-primary truncate">{leadWith.offeringName}</span>
      </div>
      {leadWith.entryPoint && (
        <div className="text-[11px] text-text-secondary leading-snug mb-2">
          Entry point: <span className="font-medium text-text-primary">{leadWith.entryPoint}</span>
        </div>
      )}
      {leadWith.opener && (
        <div className="mt-1.5 pt-2 border-t border-border/60">
          <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1 flex items-center justify-between">
            <span>Opener you can say</span>
            <button
              onClick={() => onCopyOpener?.(leadWith.opener)}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-text-muted hover:text-primary transition-colors"
            >
              <Copy size={9} /> Copy
            </button>
          </div>
          <div className="text-[12px] text-text-primary leading-relaxed font-medium">{leadWith.opener}</div>
        </div>
      )}
    </div>
  );
}

function HighlightsCompact({ highlights }) {
  if (!Array.isArray(highlights) || highlights.length === 0) return null;
  const top = highlights.slice(0, 3);
  return (
    <div className="bg-surface border border-border rounded-md p-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <Lightbulb size={11} className="text-primary" />
        <div className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary">
          Key highlights
        </div>
        <span className="ml-auto text-[10px] text-text-muted">Top {top.length} of {highlights.length}</span>
      </div>
      <div className="space-y-2">
        {top.map((h) => (
          <div key={h.id} className="border border-border/60 rounded p-2.5">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">{h.category}</div>
              {h.magnitude && (
                <div className="text-[10px] font-semibold text-primary">{h.magnitude}</div>
              )}
            </div>
            <div className="text-[12px] font-semibold text-text-primary leading-snug">{h.headline}</div>
            {h.detail && (
              <div className="text-[11px] text-text-secondary leading-snug mt-0.5">{h.detail}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AccountPreviewDrawer() {
  const {
    openAccount,
    accountsList,
    closeAccountDrawer,
    nextAccount,
    prevAccount,
    markAccountAIStarted,
    isPinned,
    togglePin,
  } = useAccountDrawer();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const offerings = useMemo(() => listOfferings(), []);

  const account = openAccount;

  const overview = useMemo(() => {
    if (!account) return null;
    const intel = getHgIntelligence(account.id);
    const resolveOfferingByCode = (code) => {
      if (!code) return null;
      const key = OFFERING_CODES?.[code]?.key;
      return offerings.find((o) => o.key === key || o.id === key) || offerings.find((o) => o.id === code) || null;
    };
    return resolveAccountOverview({
      intel,
      account,
      leadOffering: resolveOfferingByCode(intel?.lead?.code),
      nextOffering: resolveOfferingByCode(intel?.next?.code),
    });
  }, [account, offerings]);

  const currentIndex = account ? accountsList.findIndex((a) => a.id === account.id) : -1;
  const totalCount = accountsList.length;

  const handleCopyOpener = (text) => {
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    showToast('Opener copied to clipboard', 'info');
  };

  const goToFullPage = (extraSearch = '') => {
    if (!account) return;
    const base = `/account/${account.id}?from=workbook${extraSearch ? '&' + extraSearch : ''}`;
    closeAccountDrawer();
    navigate(base);
  };

  const openAccountAI = () => {
    if (!account) return;
    markAccountAIStarted(account.id);
    goToFullPage('tab=chat');
  };

  return (
    <AnimatePresence>
      {account && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={closeAccountDrawer}
          />
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed right-0 top-0 h-full w-[45vw] min-w-[520px] max-w-[860px] bg-bg border-l border-border z-50 flex flex-col shadow-elev"
            role="dialog"
            aria-modal="true"
            aria-label={`${account.name} preview`}
          >
            {/* Sticky header */}
            <header className="flex-shrink-0 border-b border-border">
              <div className="flex items-start gap-3 px-5 pt-4 pb-3">
                <div
                  className="w-11 h-11 rounded-md flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: account.logoColor || '#6366f1' }}
                >
                  {account.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-lg font-semibold text-text-primary truncate">{account.name}</h2>
                    {account.stage && (
                      <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted">
                        {account.stage}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-text-secondary truncate">
                    {[account.industry, account.hq || account.location].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => togglePin(account.id)}
                    className={`p-1.5 rounded hover:bg-surface-2 transition-colors ${
                      isPinned(account.id) ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
                    }`}
                    title={isPinned(account.id) ? 'Unpin' : 'Pin'}
                  >
                    <Pin size={13} className={isPinned(account.id) ? 'fill-current' : ''} />
                  </button>
                  <button
                    onClick={() => goToFullPage()}
                    className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-secondary transition-colors"
                    title="Expand to full page (Enter)"
                  >
                    <Maximize2 size={13} />
                  </button>
                  <button
                    onClick={closeAccountDrawer}
                    className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
                    title="Close (Esc)"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Stat strip */}
              <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
                <StatChip label="Emp" value={account.employees} />
                <StatChip label="Rev" value={account.revenue} />
                {account.crmContext?.acv && account.crmContext.acv !== '—' && (
                  <StatChip label="ACV" value={account.crmContext.acv} />
                )}
                {account.owner?.name && <StatChip label="Owner" value={account.owner.name} />}
              </div>

              {/* Position indicator + prev/next */}
              {totalCount > 1 && currentIndex >= 0 && (
                <div className="px-5 py-2 flex items-center justify-between border-t border-border/60 bg-bg/40">
                  <div className="text-[10px] text-text-muted">
                    <span className="font-semibold text-text-secondary">{currentIndex + 1}</span> of {totalCount} in this workbook
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={prevAccount}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
                      title="Previous (k or ↑)"
                    >
                      <ChevronUp size={11} /> k
                    </button>
                    <button
                      onClick={nextAccount}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
                      title="Next (j or ↓)"
                    >
                      j <ChevronDown size={11} />
                    </button>
                  </div>
                </div>
              )}
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto thin-scrollbar px-5 py-4 space-y-3">
              {!overview ? (
                <div className="bg-surface border border-dashed border-border rounded-md p-6 text-center text-[12px] text-text-muted">
                  AI intelligence for this account is generating.
                </div>
              ) : (
                <>
                  <WhyNowCompact accountName={account.name} whyNow={overview.whyNow} />
                  <LeadWithCompact leadWith={overview.leadWith} onCopyOpener={handleCopyOpener} />
                  <HighlightsCompact highlights={overview.highlights} />

                  {/* See-all footer */}
                  <button
                    onClick={() => goToFullPage()}
                    className="w-full flex items-center justify-center gap-1.5 text-[11px] text-text-muted hover:text-primary py-2 border-t border-border/60 transition-colors"
                  >
                    See all evidence, contacts, and artifacts <ArrowRight size={11} />
                  </button>
                </>
              )}
            </div>

            {/* Sticky footer — primary actions */}
            <footer className="flex-shrink-0 border-t border-border px-4 py-3 flex items-center gap-2 bg-bg/60">
              <button
                onClick={openAccountAI}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-primary to-primary-dim text-white text-sm font-semibold rounded-md hover:brightness-110 transition-all shadow-sm"
              >
                <Sparkles size={13} />
                Open Account AI
              </button>
              <button
                onClick={() => goToFullPage()}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-border text-text-secondary text-sm rounded-md hover:bg-surface-2 hover:text-text-primary transition-colors"
                title="Expand to full page"
              >
                <Maximize2 size={12} />
                Expand
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
