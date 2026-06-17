// SidebarAdmin — minimal left navigation for RevOps admin personas.
//
// Sections (each rendered only if it has content):
//   1. WORKSPACE                — Workbook (default landing) + Admin Hub
//   2. MY WORKBOOKS             — saved Workbook views the admin authored
//   3. PINNED ACCOUNTS          — accounts the admin starred from any surface
//   4. ACCOUNT CONVERSATIONS    — recent AI chats about specific accounts
//   5. SALES PLAYS              — admin-configured active plays
//   6. CONNECTED INTEGRATIONS   — only integrations with agent access granted
//
// Distinct from the seller sidebar (which carries Active Threads, Channels,
// Playbooks, Use Case Library, etc.). Admins live in a quieter shell.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Table,
  Wrench,
  ChevronsLeft,
  ChevronsRight,
  Bookmark,
  Pin,
  MessageSquare,
  Swords,
  Plug,
  Sparkles,
  Building2,
} from 'lucide-react';
import { usePersona } from '../../context/PersonaContext.jsx';
import { listViewsBySource, subscribeViews } from '../../data/workbookViews.js';
import { getPinnedAccountIds } from '../../data/accounts.js';
import { listPlays, subscribePlays } from '../../data/plays.js';
import { getIntegrationGovernance } from '../../data/integrationGovernance.js';
import PersonaSwitcher from './PersonaSwitcher.jsx';

// ─── Section header helper ────────────────────────────────────────────

function SectionLabel({ children, count }) {
  return (
    <div className="px-2.5 pt-4 pb-1 flex items-center gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted/70">
        {children}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-[9px] text-text-muted/50 font-mono">{count}</span>
      )}
    </div>
  );
}

// ─── Single nav row ──────────────────────────────────────────────────

function NavRow({ icon: Icon, label, active, onClick, badge, accent, collapsed, indent = false, dotColor }) {
  if (collapsed && !Icon) return null;
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-2 ${collapsed ? 'px-2 justify-center' : indent ? 'pl-5 pr-2.5' : 'px-2.5'} py-1.5 rounded-md text-xs transition-colors group ${
        active
          ? 'bg-primary/15 text-primary'
          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
      }`}
    >
      {dotColor && !collapsed && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
      )}
      {Icon && <Icon size={13} className={`flex-shrink-0 ${active ? '' : 'opacity-80'}`} />}
      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {!collapsed && badge && (
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${accent || 'bg-surface-2 text-text-muted'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Demo seed data for surfaces not yet wired ───────────────────────

const DEMO_ACCOUNT_CONVERSATIONS = [
  { id: 'conv-1', account: 'Wells Fargo',     summary: 'CISO change · cloud security RFP',  startedAgo: '2h ago' },
  { id: 'conv-2', account: 'Goldman Sachs',   summary: 'Lacework renewal window',           startedAgo: 'Yesterday' },
  { id: 'conv-3', account: 'Stripe',          summary: 'DevSecOps pull · IaC growth',       startedAgo: '3d ago' },
];

// Integrations considered "connected" — read from governance store. For the
// demo, show any with agentAccess granted. Display labels per id.
const INTEGRATION_LABELS = {
  salesforce: { label: 'Salesforce',  dotColor: '#00A1E0' },
  hubspot:    { label: 'HubSpot',     dotColor: '#FF7A59' },
  slack:      { label: 'Slack',       dotColor: '#4A154B' },
  marketo:    { label: 'Marketo',     dotColor: '#5C4C9F' },
  snowflake:  { label: 'Snowflake',   dotColor: '#29B5E8' },
  outreach:   { label: 'Outreach',    dotColor: '#5951FF' },
  segment:    { label: 'Segment',     dotColor: '#52BD94' },
  amplitude:  { label: 'Amplitude',   dotColor: '#1F8FFF' },
  teams:      { label: 'MS Teams',    dotColor: '#6264A7' },
};

// For demo purposes, mark a few integrations as connected even if governance
// hasn't been explicitly toggled. In production this list comes from the
// integration connection state.
const DEMO_CONNECTED = ['salesforce', 'slack', 'snowflake'];

function getConnectedIntegrations() {
  const ids = Object.keys(INTEGRATION_LABELS);
  return ids.filter((id) => {
    if (DEMO_CONNECTED.includes(id)) return true;
    const g = getIntegrationGovernance(id);
    return g?.agentAccess === true && !g?.alwaysGranted;
  });
}

// ─── Main component ──────────────────────────────────────────────────

export default function SidebarAdmin({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { personaId } = usePersona();
  const [, setTick] = useState(0);

  // Subscribe to live changes: workbook views, plays, pinned accounts.
  useEffect(() => subscribeViews(() => setTick((t) => t + 1)), []);
  useEffect(() => subscribePlays(() => setTick((t) => t + 1)), []);
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener('rgi:pins-changed', handler);
    return () => window.removeEventListener('rgi:pins-changed', handler);
  }, []);

  // Saved workbook views — both book and whitespace sources, deduped by id.
  const bookViews = listViewsBySource(personaId, 'book') || [];
  const whitespaceViews = listViewsBySource(personaId, 'whitespace') || [];
  const allViews = useMemo(() => {
    const seen = new Set();
    return [...bookViews, ...whitespaceViews].filter((v) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  }, [bookViews, whitespaceViews]);

  // Pinned accounts (admin can pin too — same store as sellers).
  const pinnedIds = getPinnedAccountIds(personaId) || [];

  // Active plays from the config store.
  const allPlays = listPlays();
  const activePlays = allPlays.filter((p) => p.status === 'active' || p.confirmed);

  // Connected integrations.
  const connectedIntegrations = getConnectedIntegrations();

  // Path predicates
  const isWorkbookActive = location.pathname === '/workbook';
  const isAdminActive = location.pathname.startsWith('/admin');

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
          <NavRow
            icon={Table}
            label="Workbook"
            active={isWorkbookActive}
            onClick={() => navigate('/workbook')}
            collapsed={collapsed}
          />
          <NavRow
            icon={Wrench}
            label="Admin Hub"
            active={isAdminActive}
            onClick={() => navigate('/admin')}
            collapsed={collapsed}
          />
        </div>

        {/* MY WORKBOOKS */}
        {!collapsed && allViews.length > 0 && (
          <>
            <SectionLabel count={allViews.length}>My Workbooks</SectionLabel>
            <div className="space-y-0.5">
              {allViews.slice(0, 6).map((v) => (
                <NavRow
                  key={v.id}
                  icon={Bookmark}
                  label={v.name}
                  active={location.search.includes(`view=${v.id}`)}
                  onClick={() => navigate(`/workbook?view=${v.id}&source=${v.source || 'book'}`)}
                  collapsed={collapsed}
                  indent
                />
              ))}
              {allViews.length > 6 && (
                <div className="px-5 py-1 text-[10px] text-text-muted/70">
                  +{allViews.length - 6} more
                </div>
              )}
            </div>
          </>
        )}

        {/* PINNED ACCOUNTS */}
        {!collapsed && pinnedIds.length > 0 && (
          <>
            <SectionLabel count={pinnedIds.length}>Pinned Accounts</SectionLabel>
            <div className="space-y-0.5">
              {pinnedIds.slice(0, 5).map((id) => (
                <NavRow
                  key={id}
                  icon={Pin}
                  label={id} /* prototype: ids are readable enough for demo */
                  active={location.pathname === `/account/${id}`}
                  onClick={() => navigate(`/account/${id}`)}
                  collapsed={collapsed}
                  indent
                />
              ))}
            </div>
          </>
        )}

        {/* ACCOUNT CONVERSATIONS */}
        {!collapsed && DEMO_ACCOUNT_CONVERSATIONS.length > 0 && (
          <>
            <SectionLabel count={DEMO_ACCOUNT_CONVERSATIONS.length}>Account Conversations</SectionLabel>
            <div className="space-y-0.5">
              {DEMO_ACCOUNT_CONVERSATIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    // For now, conversations don't have their own route — link
                    // to the account threads index. Engineering wires the AI
                    // conversation history in the next milestone.
                    alert(`Conversation: ${c.account} — ${c.summary}\n\nFull AI conversation thread ships in the next iteration.`);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-surface-2 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <Sparkles size={11} className="text-violet-500 flex-shrink-0" />
                    <span className="text-xs text-text-primary truncate flex-1">{c.account}</span>
                    <span className="text-[9px] text-text-muted/60 flex-shrink-0">{c.startedAgo}</span>
                  </div>
                  <div className="pl-5 text-[10px] text-text-muted truncate">{c.summary}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* SALES PLAYS */}
        {!collapsed && activePlays.length > 0 && (
          <>
            <SectionLabel count={activePlays.length}>Sales Plays</SectionLabel>
            <div className="space-y-0.5">
              {activePlays.slice(0, 6).map((p) => (
                <NavRow
                  key={p.id}
                  icon={Swords}
                  label={p.name}
                  active={location.pathname === `/admin/plays/${p.id}`}
                  onClick={() => navigate(`/admin/plays/${p.id}`)}
                  collapsed={collapsed}
                  indent
                />
              ))}
              {activePlays.length > 6 && (
                <button
                  onClick={() => navigate('/admin/plays')}
                  className="w-full pl-5 pr-2.5 py-1 text-[10px] text-text-muted/70 hover:text-primary text-left"
                >
                  +{activePlays.length - 6} more · view all
                </button>
              )}
            </div>
          </>
        )}

        {/* CONNECTED INTEGRATIONS */}
        {!collapsed && connectedIntegrations.length > 0 && (
          <>
            <SectionLabel count={connectedIntegrations.length}>Connected Integrations</SectionLabel>
            <div className="space-y-0.5">
              {connectedIntegrations.map((id) => {
                const meta = INTEGRATION_LABELS[id];
                return (
                  <NavRow
                    key={id}
                    icon={Plug}
                    label={meta?.label || id}
                    active={false}
                    onClick={() => navigate('/admin/apps')}
                    collapsed={collapsed}
                    indent
                    dotColor={meta?.dotColor}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Persona switcher */}
      <div className="p-2 border-t border-border/60">
        <PersonaSwitcher collapsed={collapsed} />
      </div>
    </div>
  );
}
