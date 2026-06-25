import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Plus,
  Briefcase,
  Target,
  Cpu,
  Settings,
  Library,
  Bot,
  BarChart3,
  Table,
  ChevronsLeft,
  ChevronsRight,
  Bell,
  Wrench,
  BookmarkCheck,
  MessageSquare,
  Hash,
  Terminal,
  Pin,
  TrendingUp,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { usePersona, usePermissions } from '../../context/PersonaContext.jsx';
import { THREADS, SIDEBAR_THREADS, SIDEBAR_CHANNELS, CHANNEL_ORIGINS } from '../../data/threads.js';
import {
  getAccountsForOwner,
  ACCOUNT_STAGES,
  curateForSidebar,
  getPinnedAccountIds,
} from '../../data/accounts.js';
import StatusDot from '../shared/StatusDot.jsx';
import PersonaSwitcher from './PersonaSwitcher.jsx';
import {
  listPlaysVisibleTo,
  subscribePlays,
  upsertPlay,
  playReferencesCrm,
} from '../../data/plays.js';
import { listOfferings } from '../../data/offerings.js';
import { useDemo } from '../../context/DemoContext.jsx';
import { ManagePlayDrawer } from '../onboarding/StepPlays.jsx';
import { Swords } from 'lucide-react';

const ORIGIN_ICONS = {
  'message-square': MessageSquare,
  hash: Hash,
  terminal: Terminal,
};

const TYPE_ICONS = {
  deal: Briefcase,
  campaign: Target,
  model: Cpu,
  config: Settings,
};

function NavItem({ icon: Icon, label, active, onClick, collapsed, badge, rightSlot }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors text-sm ${
        active
          ? 'bg-primary/15 text-primary'
          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
      }`}
      title={collapsed ? label : undefined}
    >
      <Icon size={16} className="flex-shrink-0" />
      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {!collapsed && badge && (
        <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded font-medium">
          {badge}
        </span>
      )}
      {!collapsed && rightSlot}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="px-2.5 pt-5 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-text-muted/70">
      {children}
    </div>
  );
}

function AccountRow({ account, isActive, isPinned, onOpen }) {
  const cfg = ACCOUNT_STAGES[account.stage];
  const newSignal = (account.signals || []).some((s) => s.daysAgo != null && s.daysAgo < 7);
  return (
    <button
      onClick={() => onOpen(account.id)}
      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors group ${
        isActive ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
      }`}
    >
      <div
        className="w-4 h-4 rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
        style={{ background: account.logoColor }}
      >
        {account.name.charAt(0)}
      </div>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0`} title={cfg.label} />
      <span className="flex-1 text-left truncate">{account.name}</span>
      {isPinned && <Pin size={9} className="text-primary flex-shrink-0" />}
      {!isPinned && newSignal && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
      )}
    </button>
  );
}

function BucketHeader({ icon: Icon, label, count, color = 'text-text-muted' }) {
  return (
    <div className="px-2.5 pt-3 pb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-text-muted/70 font-medium">
      <Icon size={10} className={color} />
      <span>{label}</span>
      <span className="text-text-muted/50 font-mono">{count}</span>
    </div>
  );
}

function AccountBuckets({ curated, currentPath, onOpen, onViewAll }) {
  const { pinned, hot, meetings, overflow, total } = curated;
  const empty = pinned.length === 0 && hot.length === 0 && meetings.length === 0;

  return (
    <>
      <SectionLabel>My Accounts</SectionLabel>

      {empty && (
        <div className="px-2.5 py-2 text-[11px] text-text-muted leading-relaxed">
          No accounts to focus on yet.{' '}
          <button onClick={onViewAll} className="text-primary hover:underline">
            Browse {total} accounts →
          </button>
        </div>
      )}

      {pinned.length > 0 && (
        <>
          <BucketHeader icon={Pin} label="Pinned" count={pinned.length} color="text-primary" />
          <div className="space-y-0.5">
            {pinned.map((a) => (
              <AccountRow
                key={a.id}
                account={a}
                isActive={currentPath === `/account/${a.id}`}
                isPinned
                onOpen={onOpen}
              />
            ))}
          </div>
        </>
      )}

      {hot.length > 0 && (
        <>
          <BucketHeader icon={TrendingUp} label="Hot this week" count={hot.length} color="text-amber-700 dark:text-amber-300" />
          <div className="space-y-0.5">
            {hot.map((a) => (
              <AccountRow
                key={a.id}
                account={a}
                isActive={currentPath === `/account/${a.id}`}
                isPinned={false}
                onOpen={onOpen}
              />
            ))}
          </div>
        </>
      )}

      {meetings.length > 0 && (
        <>
          <BucketHeader icon={Calendar} label="Meetings this week" count={meetings.length} color="text-emerald-700 dark:text-emerald-300" />
          <div className="space-y-0.5">
            {meetings.map((a) => (
              <AccountRow
                key={a.id}
                account={a}
                isActive={currentPath === `/account/${a.id}`}
                isPinned={false}
                onOpen={onOpen}
              />
            ))}
          </div>
        </>
      )}

      {overflow > 0 && (
        <button
          onClick={onViewAll}
          className="w-full flex items-center justify-between px-2.5 py-2 mt-2 text-[11px] text-text-muted hover:text-primary hover:bg-surface-2 rounded-md transition-colors"
        >
          <span>View all {total} accounts</span>
          <ArrowRight size={10} />
        </button>
      )}
    </>
  );
}

import SidebarAdmin from './SidebarAdmin.jsx';
import SidebarMarketAnalyzer from './SidebarMarketAnalyzer.jsx';

// Top-level Sidebar: routes RevOps admins to the minimal admin shell, and
// sellers / strategists to the rich SellerSidebar below. Keeping the routing
// here (vs. inside SellerSidebar) avoids Rules-of-Hooks violations — both
// children render unconditionally once selected.
export default function Sidebar(props) {
  const { persona } = usePersona();
  const location = useLocation();
  // Market Analyzer is its own module — render its sidebar whenever the
  // user is on a /market-analyzer/* path, regardless of role. (Today only
  // admins have access in the switcher, but the routing is permission-clean.)
  if (location.pathname.startsWith('/market-analyzer')) {
    return <SidebarMarketAnalyzer collapsed={props.collapsed} onToggle={props.onToggle} />;
  }
  if (persona.roleType === 'admin' && !persona.plgUser) {
    return <SidebarAdmin collapsed={props.collapsed} onToggle={props.onToggle} />;
  }
  return <SellerSidebar {...props} />;
}

function SellerSidebar({ collapsed, onToggle, onNewThread }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { personaId, persona } = usePersona();
  const permissions = usePermissions();
  const { hasIntegration } = useDemo();

  const threadIds = SIDEBAR_THREADS[personaId] || [];
  const channelIds = SIDEBAR_CHANNELS[personaId] || [];

  // Sales Plays — re-fetch on play mutations so the sidebar stays in
  // sync with edits made elsewhere.
  const [, setPlaysTick] = useState(0);
  useEffect(() => subscribePlays(() => setPlaysTick((t) => t + 1)), []);

  const visiblePlays = listPlaysVisibleTo(persona).filter(
    (p) => p.status === 'active' || p.confirmed,
  );
  const crmConnected = hasIntegration?.('salesforce') || hasIntegration?.('hubspot') || false;
  const confirmedOfferings = listOfferings().filter((o) => o.confirmed !== false);

  // Inline play creation drawer — sellers create only private plays.
  const [playDrawerOpen, setPlayDrawerOpen] = useState(false);
  const handleSavePlay = (draft) => {
    upsertPlay({
      ...draft,
      // Hard-stamp: sellers' new plays are always private + owned by them.
      visibility: persona.roleType === 'admin' ? draft.visibility : 'private',
      created_by: personaId,
      userIds: persona.roleType === 'admin' ? draft.userIds || [] : [personaId],
    });
    setPlayDrawerOpen(false);
  };

  // PLG sellers: load full book + curate for sidebar (3 buckets).
  const myAccounts = persona.plgUser ? getAccountsForOwner(personaId) : [];
  const [pinnedIds, setPinnedIds] = useState(() => (persona.plgUser ? getPinnedAccountIds(personaId) : []));

  // Re-read pins when persona switches or window storage changes (e.g. user pins
  // from the account header).
  useEffect(() => {
    if (!persona.plgUser) return;
    const refresh = () => setPinnedIds(getPinnedAccountIds(personaId));
    refresh();
    const handler = (e) => {
      if (e.key && e.key.includes('rgi-pinned-accounts')) refresh();
    };
    window.addEventListener('storage', handler);
    window.addEventListener('rgi:pins-changed', refresh);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('rgi:pins-changed', refresh);
    };
  }, [personaId, persona.plgUser]);

  const curated = persona.plgUser ? curateForSidebar(myAccounts, pinnedIds) : null;
  const newSignalCount = myAccounts.reduce(
    (s, a) => s + (a.signals?.filter((sig) => sig.daysAgo != null && sig.daysAgo < 7).length || 0),
    0
  );

  return (
    <div
      className={`h-screen flex flex-col bg-bg border-r border-border/60 transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-60'
      }`}
    >
      {/* Toggle */}
      <div className="h-14 flex items-center px-3 border-b border-border/60">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-surface-2 text-text-muted hover:text-text-secondary transition-colors ml-auto"
        >
          {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-2 py-2">
        {/* WORKSPACE */}
        {!collapsed && <SectionLabel>Workspace</SectionLabel>}
        <div className={collapsed ? 'pt-3 space-y-1' : 'space-y-0.5'}>
          <NavItem
            icon={LayoutGrid}
            label="Home"
            active={location.pathname === '/home' || location.pathname === '/workspace'}
            onClick={() => navigate(persona.plgUser ? '/home' : '/workspace')}
            collapsed={collapsed}
            badge={persona.plgUser && newSignalCount > 0 ? `${newSignalCount} signals` : undefined}
          />
          <NavItem
            icon={Table}
            label="Workbook"
            active={location.pathname === '/workbook'}
            onClick={() => navigate('/workbook')}
            collapsed={collapsed}
          />
        </div>

        {/* SALES PLAYS — tenant-wide plays (org-visible) + this user's
            own private plays. Sellers can launch + create their own
            (private only). Admins promote them to org-visible later. */}
        {!collapsed && (
          <>
            <SectionLabel>Sales Plays</SectionLabel>
            <div className="space-y-0.5">
              {visiblePlays.length === 0 ? (
                <div className="px-3 py-1.5 text-[10px] text-text-muted/60 italic">
                  No plays yet. Create one below.
                </div>
              ) : (
                visiblePlays.slice(0, 6).map((p) => {
                  const playFilterActive = new URLSearchParams(location.search).get('play') === p.id;
                  const crmBroken = playReferencesCrm(p) && !crmConnected;
                  const isPrivate = p.visibility === 'private';
                  return (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/workbook?source=all&play=${p.id}`)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors group ${
                        playFilterActive
                          ? 'bg-primary/15 text-primary'
                          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                      }`}
                      title={crmBroken ? 'This play references CRM data — connect a CRM to enable it' : p.description || p.name}
                    >
                      <Swords size={13} className="flex-shrink-0 opacity-70" />
                      <span className="flex-1 text-left truncate">{p.name}</span>
                      {isPrivate && (
                        <span className="text-[8px] uppercase tracking-wider font-bold text-text-muted/70">
                          Private
                        </span>
                      )}
                    </button>
                  );
                })
              )}
              <button
                onClick={() => setPlayDrawerOpen(true)}
                className="w-full pl-2.5 pr-2.5 py-1 text-[11px] text-left text-primary/80 hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <Plus size={11} /> Create play
              </button>
            </div>
          </>
        )}

        {/* MY ACCOUNTS — bucketed focus list (PLG seller only) */}
        {persona.plgUser && !collapsed && curated && (
          <AccountBuckets
            curated={curated}
            currentPath={location.pathname}
            onOpen={(id) => navigate(`/account/${id}`)}
            onViewAll={() => navigate('/home')}
          />
        )}

        {/* ACTIVE THREADS */}
        {!collapsed && <SectionLabel>Active Threads</SectionLabel>}
        {!collapsed && (
          <div className="space-y-0.5">
            {threadIds.length === 0 ? (
              <div className="px-2.5 py-2 text-[11px] text-text-muted leading-relaxed">
                {persona.plgUser ? 'No general threads — work happens in your account threads above.' : 'No threads yet. Activate a use case to start your first one.'}
              </div>
            ) : (
              threadIds.map((id) => {
                const t = THREADS[id];
                if (!t) return null;
                const Icon = TYPE_ICONS[t.type] || Briefcase;
                const isActive = location.pathname === `/thread/${id}`;
                return (
                  <button
                    key={id}
                    onClick={() => navigate(`/thread/${id}`)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors group ${
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                    }`}
                  >
                    <Icon size={13} className="flex-shrink-0 opacity-70" />
                    <StatusDot variant={t.sidebarStatus} />
                    <span className="flex-1 text-left truncate">{t.name}</span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* CHANNELS */}
        {!collapsed && channelIds.length > 0 && (
          <button
            onClick={() => navigate('/channels')}
            className="w-full flex items-center justify-between px-2.5 pt-5 pb-1.5 group"
          >
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted/70 group-hover:text-text-secondary transition-colors">
              Channels
            </span>
            <span className="text-[9px] text-text-muted/60 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
              View all →
            </span>
          </button>
        )}
        {!collapsed && channelIds.length > 0 && (
          <div className="space-y-0.5">
            {channelIds.map((id) => {
              const t = THREADS[id];
              if (!t) return null;
              const originCfg = CHANNEL_ORIGINS[t.origin];
              const Icon = (originCfg && ORIGIN_ICONS[originCfg.icon]) || MessageSquare;
              const isActive = location.pathname === `/thread/${id}`;
              return (
                <button
                  key={id}
                  onClick={() => navigate(`/thread/${id}`)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors group ${
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                  }`}
                >
                  <Icon size={12} className="flex-shrink-0 opacity-70" />
                  <StatusDot variant={t.sidebarStatus} />
                  <span className="flex-1 text-left truncate">{t.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* PLAYBOOKS */}
        {!collapsed && <SectionLabel>Playbooks</SectionLabel>}
        <div className={collapsed ? 'pt-3 space-y-1' : 'space-y-0.5'}>
          <NavItem
            icon={Library}
            label="Use Case Library"
            active={location.pathname === '/use-cases'}
            onClick={() => navigate('/use-cases')}
            collapsed={collapsed}
          />
          <NavItem
            icon={BookmarkCheck}
            label="Saved Library"
            active={location.pathname === '/library'}
            onClick={() => navigate('/library')}
            collapsed={collapsed}
          />
          <NavItem
            icon={Bot}
            label="Daily Digest"
            active={false}
            onClick={() => {}}
            collapsed={collapsed}
            badge="AI"
          />
          <NavItem
            icon={BarChart3}
            label="ROI Dashboard"
            active={location.pathname === '/roi'}
            onClick={() => navigate('/roi')}
            collapsed={collapsed}
          />
          {permissions.canAccessAdmin && (
            <NavItem
              icon={Wrench}
              label="Admin Hub"
              active={location.pathname.startsWith('/admin')}
              onClick={() => navigate('/admin')}
              collapsed={collapsed}
              badge="6"
            />
          )}
        </div>
      </div>

      {/* Persona switcher */}
      <div className="p-2 border-t border-border/60">
        <PersonaSwitcher collapsed={collapsed} />
      </div>

      {/* Create-play drawer — surface from the sidebar so sellers can
          build a private play without leaving their current context.
          Visibility validation is enforced inside the drawer. */}
      {playDrawerOpen && (
        <ManagePlayDrawer
          play={null}
          confirmedOfferings={confirmedOfferings}
          persona={persona}
          crmConnected={crmConnected}
          onSave={handleSavePlay}
          onClose={() => setPlayDrawerOpen(false)}
        />
      )}
    </div>
  );
}
