// Admin Hub — the platform admin's home.
//
// Organized into 3 semantic sections grouped by what the admin is *doing*,
// not who built each tile:
//
//   1. Configure the Platform ✨   — Tenant Profile, Offerings, Scoring Models,
//                                    Sales Plays, Agents (all AI-prepared)
//   2. Connect Data + People       — Integrations, Territory, Users, Teams
//   3. Advanced + Settings         — Account Settings (sub-nav with 8 pages)
//
// AI-prepared tiles wear a corner sparkle badge — the same visual vocabulary
// sellers see on Enrich-with-AI columns and Why-Now reasons. Manual tiles
// have no badge.
//
// Signal Studio + Workflow Studio are intentionally not surfaced as tiles —
// they're power-user surfaces reachable via deep links from the relevant
// configuration tiles (e.g. Plays → Signal Studio for advanced authoring).

import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  Building2,
  TrendingUp,
  Pin,
  Eye,
  AlertCircle,
  Layers,
  Swords,
  Bot,
  Compass,
  Plug,
  Users,
  Workflow,
  Gauge,
  Settings as SettingsGear,
  ChevronRight,
} from 'lucide-react';
import { useTenant } from '../context/TenantContext.jsx';
import { AGENTS } from '../data/agents.js';
import { recentRuns } from '../data/agentRuns.js';
import { getAdoptionMetrics, subscribeAdminConfig } from '../data/adminConfig.js';
import { listSignals, listActiveSignals } from '../data/signals.js';
import { listOfferings } from '../data/offerings.js';
import { listPlays } from '../data/plays.js';
import { listAgenticPlaybooks } from '../data/playbooks.js';
import { subscribeConfig } from '../data/configStore.js';
import { getCoverageStats, listSellers } from '../data/territoryDesign.js';

// ─── AdminTile — the single tile component, with optional AI badge ─────

function AdminTile({
  icon: Icon,
  title,
  subtitle,
  stat,
  statLabel,
  accent,
  onClick,
  aiPrepared = false,
  wide = false,
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left bg-surface border ${aiPrepared ? 'border-violet-500/20 hover:border-violet-500/50' : 'border-border hover:border-primary/30'} rounded-md p-4 hover:shadow-card transition-all group relative ${
        wide ? 'col-span-3' : ''
      }`}
    >
      {aiPrepared && (
        <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
          <Sparkles size={9} />
          AI
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-md ${accent.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={15} className={accent.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
            <ArrowRight size={11} className="text-text-muted opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
          </div>
          <p className="text-xs text-text-secondary leading-relaxed mb-2">{subtitle}</p>
          {stat !== undefined && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-semibold text-text-primary">{stat}</span>
              <span className="text-[10px] uppercase tracking-wider text-text-muted">{statLabel}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── AdminSection — section wrapper with label + grid ─────────────────

function AdminSection({ label, icon: Icon, accentColor, aiPrepared, children, cols = 3 }) {
  const gridCols = cols === 5 ? 'grid-cols-5' : cols === 2 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon size={12} className={accentColor || 'text-text-muted'} />}
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</h2>
        {aiPrepared && (
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 font-bold inline-flex items-center gap-0.5">
            <Sparkles size={9} /> AI-prepared
          </span>
        )}
      </div>
      <div className={`grid ${gridCols} gap-3`}>{children}</div>
    </section>
  );
}

// ─── Adoption pulse (slim) ───────────────────────────────────────────

function AdoptionPulse({ metrics }) {
  return (
    <section className="bg-surface border border-border rounded-md p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={12} className="text-emerald-700 dark:text-emerald-300" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Adoption Pulse</h2>
        <span className="ml-auto text-[10px] text-text-muted">across {metrics.totalSeats} seats</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <PulseStat icon={Eye} label="Agents visible" value={`${metrics.visibleAgentCount} / ${metrics.totalAgentCount}`} />
        <PulseStat icon={Workflow} label="Playbooks live" value={`${metrics.publishedCount} / ${metrics.totalPlaybookCount}`} />
        <PulseStat icon={Pin} label="Pinned" value={metrics.pinnedCount} />
        <PulseStat icon={AlertCircle} label="Cold agents" value={metrics.coldAgents.length} sub="<10% activation" />
      </div>
    </section>
  );
}

function PulseStat({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-bg/40 border border-border rounded p-3">
      <div className="flex items-center gap-1 mb-1">
        <Icon size={10} className="text-text-muted" />
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">{label}</span>
      </div>
      <div className="text-lg font-semibold text-text-primary">{value}</div>
      {sub && <div className="text-[10px] text-text-muted">{sub}</div>}
    </div>
  );
}

// ─── Main route ──────────────────────────────────────────────────────

export default function AdminHub() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [, setConfigTick] = useState(0);

  // Subscribe to config-store changes so tile stats update live (e.g. after
  // upserting an offering or activating a play).
  useEffect(() => subscribeConfig(() => setConfigTick((t) => t + 1)), []);

  // Live data
  const playbooks = listAgenticPlaybooks();
  const livePlaybooks = playbooks.filter((p) => p.status === 'live').length;
  const totalAgents = Object.keys(AGENTS).length;
  const runsToday = recentRuns(50).filter((r) => r.timestamp.includes('min ago') || r.timestamp.includes('hr ago') || r.timestamp === 'Just now').length;
  const activeSignalCount = listActiveSignals().length;
  const totalSignalCount = listSignals().length;
  const offerings = listOfferings();
  const confirmedOfferings = offerings.filter((o) => o.confirmed !== false).length;
  const plays = listPlays();
  const activePlays = plays.filter((p) => p.status === 'active' || p.confirmed).length;
  const territoryStats = getCoverageStats();
  const sellerCount = listSellers().length;
  const [metrics, setMetrics] = useState(getAdoptionMetrics);
  useEffect(() => subscribeAdminConfig(() => setMetrics(getAdoptionMetrics())), []);

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="mb-2 text-xs text-text-muted">Platform & Ops</div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Admin Hub</h1>
      <p className="text-sm text-text-secondary mb-6 max-w-2xl">
        Configure the platform end-to-end. Tiles marked{' '}
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
          <Sparkles size={8} /> AI
        </span>{' '}
        are pre-built from your tenant data — review and refine. Other tiles are configured manually.
      </p>

      <AdoptionPulse metrics={metrics} />

      {/* ─── 1 · Configure the Platform ✨ ─── */}
      <AdminSection
        label="Configure the Platform"
        icon={Sparkles}
        accentColor="text-violet-500"
        aiPrepared
        cols={3}
      >
        <AdminTile
          icon={Building2}
          title="Tenant Profile"
          subtitle={`Firmographics, products, ICP, competitors, buying committee — derived from ${tenant.url || tenant.name}.`}
          stat={tenant.products?.length || 0}
          statLabel="Products"
          accent={{ bg: 'bg-sky-500/10', color: 'text-sky-700 dark:text-sky-300' }}
          onClick={() => navigate('/admin/tenant')}
          aiPrepared
        />
        <AdminTile
          icon={Layers}
          title="Offerings"
          subtitle="AI-grouped products → offerings. Pain points, intent topics, competitors, GTM motions."
          stat={offerings.length}
          statLabel={`${confirmedOfferings} confirmed`}
          accent={{ bg: 'bg-violet-500/10', color: 'text-violet-700 dark:text-violet-300' }}
          onClick={() => navigate('/admin/offerings')}
          aiPrepared
        />
        {/* Scoring Profiles tile removed — scoring is module-owned now.
            Production lives in Market Analyzer; consumption is the
            offering picker inside Sales Co-Pilot. Admin Hub stays focused
            on cross-module platform config. */}
        <AdminTile
          icon={Swords}
          title="Sales Plays"
          subtitle="Business motions (Competitive Takeout, Net New, Catalyst Event) composed from HG signals + filters."
          stat={plays.length}
          statLabel={`${activePlays} active`}
          accent={{ bg: 'bg-rose-500/10', color: 'text-rose-700 dark:text-rose-300' }}
          onClick={() => navigate('/admin/plays')}
          aiPrepared
        />
        <AdminTile
          icon={Bot}
          title="Agents"
          subtitle="Seller-facing AI in the Account view — brief, email, contacts, opportunity finder. Visibility per team."
          stat={totalAgents}
          statLabel="Available"
          accent={{ bg: 'bg-blue-500/10', color: 'text-blue-700 dark:text-blue-300' }}
          onClick={() => navigate('/admin/agents')}
          aiPrepared
        />
      </AdminSection>

      {/* ─── 2 · Connect Data + People ─── */}
      <AdminSection label="Connect Data + People" cols={2}>
        <AdminTile
          icon={Plug}
          title="Integrations"
          subtitle="Salesforce, HubSpot, Slack OAuth + agent write-back scopes + field mapping."
          stat={0}
          statLabel="Connected"
          accent={{ bg: 'bg-emerald-500/10', color: 'text-emerald-700 dark:text-emerald-300' }}
          onClick={() => navigate('/admin/apps')}
        />
        <AdminTile
          icon={Compass}
          title="Territory Design"
          subtitle="No-CRM mode. Upload book CSV, AI entity resolution, ICP whitespace discovery, routing rules."
          stat={territoryStats.totalBook}
          statLabel={`Accounts · ${territoryStats.ownersWithBook} owners`}
          accent={{ bg: 'bg-violet-500/10', color: 'text-violet-700 dark:text-violet-300' }}
          onClick={() => navigate('/admin/territory')}
        />
        <AdminTile
          icon={Users}
          title="Users & Sellers"
          subtitle="Invite via magic link, assign roles + teams, track first-action latency."
          stat={sellerCount}
          statLabel="Sellers"
          accent={{ bg: 'bg-blue-500/10', color: 'text-blue-700 dark:text-blue-300' }}
          onClick={() => navigate('/admin/users')}
        />
        <AdminTile
          icon={Users}
          title="Teams"
          subtitle="Group sellers by motion. Each team has offerings, scoring profile, default plays, and enabled agents."
          stat={3}
          statLabel="Teams"
          accent={{ bg: 'bg-indigo-500/10', color: 'text-indigo-700 dark:text-indigo-300' }}
          onClick={() => navigate('/admin/teams')}
        />
      </AdminSection>

      {/* ─── 3 · Advanced + Settings ─── */}
      <AdminSection label="Advanced + Settings" cols={1}>
        <AccountSettingsTile onNavigate={navigate} />
      </AdminSection>
    </div>
  );
}

function AccountSettingsTile({ onNavigate }) {
  const sublinks = [
    { id: 'account', label: 'Account' },
    { id: 'authentication', label: 'Authentication' },
    { id: 'push', label: 'Push Configuration' },
    { id: 'processes', label: 'Processes' },
    { id: 'credits', label: 'Credits Usage' },
    { id: 'api-keys', label: 'API Keys' },
    { id: 'api-usage', label: 'API Usage' },
    { id: 'privacy', label: 'Privacy' },
  ];

  return (
    <div className="bg-surface border border-border rounded-md p-4 hover:border-primary/30 hover:shadow-card transition-all group">
      <button
        onClick={() => onNavigate('/admin/settings')}
        className="w-full text-left flex items-start gap-3 mb-3"
      >
        <div className="w-9 h-9 rounded-md bg-slate-500/10 flex items-center justify-center flex-shrink-0">
          <SettingsGear size={15} className="text-slate-700 dark:text-slate-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-text-primary">Account Settings</h3>
            <ArrowRight size={11} className="text-text-muted opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Tenant-level controls — authentication, billing, privacy, API access. Configure once; applies platform-wide.
          </p>
        </div>
      </button>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {sublinks.map((s) => (
          <button
            key={s.id}
            onClick={() => onNavigate(`/admin/settings/${s.id}`)}
            className="text-[11px] px-2 py-1 rounded border border-border bg-bg/40 hover:bg-surface-2 hover:border-primary/30 text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            {s.label}
            <ChevronRight size={10} className="text-text-muted" />
          </button>
        ))}
      </div>
    </div>
  );
}
