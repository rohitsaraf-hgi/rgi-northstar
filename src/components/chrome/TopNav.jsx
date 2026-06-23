import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Sparkles, Sun, Moon } from 'lucide-react';
import { usePersona } from '../../context/PersonaContext.jsx';
import { useAIThinking } from '../../context/AIThinkingContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useDemo } from '../../context/DemoContext.jsx';
import { THREADS } from '../../data/threads.js';
import { TIER_DEFINITIONS } from '../../data/modules.js';
import Avatar from '../shared/Avatar.jsx';
import ModuleSwitcher, { resolveCurrentModule } from './ModuleSwitcher.jsx';

// Page-within-module labels. The first breadcrumb crumb is now the
// module switcher; the second crumb is the page label resolved here.
const PAGE_LABELS = {
  // Sales Co-Pilot pages
  '/workspace': 'Workspace',
  '/home': 'Home',
  '/workbook': 'Workbook',
  '/use-cases': 'Use Case Library',
  '/roi': 'ROI Dashboard',
  '/library': 'Saved Library',
  '/plays': 'Sales Plays',
  '/channels': 'Channels',
  // Admin Hub pages
  '/admin': 'Admin Home',
  '/admin/copilot': 'Copilot Settings',
  '/admin/apps': 'Integrations',
  '/admin/agents': 'Agents',
  '/admin/workflows': 'Workflows',
  '/admin/tenant': 'Tenant Profile',
  '/admin/territory': 'Territory Design',
  '/admin/scoring': 'Scoring · Market Analyzer',
  '/admin/settings': 'Settings',
  '/admin/users': 'Users',
  '/admin/teams': 'Teams',
  '/admin/plays': 'Sales Plays',
  '/admin/offerings': 'Offerings',
  // Standalone
  '/onboarding': 'Onboarding',
  '/platform': 'Platform Architecture',
  // Market Analyzer
  '/market-analyzer': 'Projects',
  '/market-analyzer/projects': 'Projects',
  '/market-analyzer/companies': 'Companies',
  '/market-analyzer/segments': 'Segments',
  '/market-analyzer/scoring-profiles': 'Scoring Profiles',
  '/market-analyzer/tech-taxonomies': 'Tech & Taxonomies',
  '/market-analyzer/saved-collections': 'Saved Collections',
  '/market-analyzer/export-history': 'Export History',
};

function resolvePageLabel(pathname) {
  if (pathname.startsWith('/thread/')) {
    const id = pathname.split('/')[2];
    const t = THREADS[id];
    return t ? t.name : 'Thread';
  }
  if (pathname.startsWith('/collaborate/')) {
    const id = pathname.split('/')[2];
    const t = THREADS[id];
    return t ? `${t.name} (Collaborative)` : 'Collaborative Thread';
  }
  if (pathname.startsWith('/account/')) return 'Account';
  if (pathname.startsWith('/admin/workflows/')) return 'Workflow';
  if (pathname.startsWith('/market-analyzer/segments/')) return 'Segment';
  if (pathname.startsWith('/admin/settings/')) return 'Settings';
  return PAGE_LABELS[pathname] || null;
}

const TIER_BADGE_STYLES = {
  starter: { bg: '#3F4452', text: '#D8DAE5' },
  growth: { bg: '#1E3A8A', text: '#93C5FD' },
  enterprise: { bg: '#78350F', text: '#FCD34D' },
};

function TierBadge({ tier, onClick }) {
  const cfg = TIER_DEFINITIONS[tier];
  const style = TIER_BADGE_STYLES[tier] || TIER_BADGE_STYLES.growth;
  return (
    <button
      onClick={onClick}
      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
      style={{ background: style.bg, color: style.text }}
      title="View Platform Architecture"
    >
      {cfg?.name || tier}
    </button>
  );
}

export default function TopNav({ onBellClick, notificationCount = 3 }) {
  const { persona } = usePersona();
  const { isThinking } = useAIThinking();
  const { applied: themeApplied, toggle: toggleTheme } = useTheme();
  const { config } = useDemo();
  const location = useLocation();
  const navigate = useNavigate();
  const pageLabel = resolvePageLabel(location.pathname);

  return (
    <>
      <div className="h-14 border-b border-border/60 bg-bg/80 backdrop-blur-sm flex items-center px-5 gap-4 sticky top-0 z-30">
        <button
          onClick={() => navigate('/workspace')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center font-bold text-xs text-white">
            HG
          </div>
          <span className="text-sm font-semibold tracking-tight">RGI Platform</span>
        </button>

        <TierBadge tier={config.subscriptionTier} onClick={() => navigate('/platform')} />

        <div className="h-5 w-px bg-border" />

        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <ModuleSwitcher />
          {pageLabel && (
            <>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary truncate max-w-[260px]">{pageLabel}</span>
            </>
          )}
        </div>

        {isThinking && (
          <div className="flex items-center gap-2 text-xs text-primary ml-2 animate-pulse-slow">
            <Sparkles size={12} />
            <span>AI is thinking...</span>
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-md text-text-muted text-sm w-72">
          <Search size={14} />
          <span className="flex-1">Search threads, accounts, artifacts...</span>
          <kbd className="text-[10px] px-1.5 py-0.5 bg-bg border border-border rounded font-mono">⌘K</kbd>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-surface-2 rounded-md transition-colors text-text-secondary"
          title={themeApplied === 'dark' ? 'Switch to light' : 'Switch to dark'}
        >
          {themeApplied === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={onBellClick}
          className="relative p-2 hover:bg-surface-2 rounded-md transition-colors"
        >
          <Bell size={16} className="text-text-secondary" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] rounded-full flex items-center justify-center font-medium">
              {notificationCount}
            </span>
          )}
        </button>

        <Avatar name={persona.name} initials={persona.initials} color={persona.avatarColor} size={32} />
      </div>
    </>
  );
}
