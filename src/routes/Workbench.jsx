import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Globe2,
  Target,
  FileSearch,
  Compass,
  ArrowRight,
  Settings,
  BookmarkPlus,
  ExternalLink,
  Layers,
  Pin,
  Workflow,
} from 'lucide-react';
import { useTenant } from '../context/TenantContext.jsx';
import { usePersona } from '../context/PersonaContext.jsx';
import { useDemo } from '../context/DemoContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { createRuntimeThread } from '../data/runtimeThreads.js';
import { listPinnedPlaybooksForSeller, subscribeAdminConfig } from '../data/adminConfig.js';

// ===== Tile component =====
function PlayTile({ icon: Icon, kind, title, subtitle, gradient, onClick, badge }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`text-left rounded-lg p-5 border border-border bg-surface hover:shadow-card transition-all relative overflow-hidden group ${gradient}`}
    >
      <div className="absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-md bg-white/80 dark:bg-bg/40 flex items-center justify-center backdrop-blur-sm border border-border">
            <Icon size={18} className="text-text-primary" />
          </div>
          {badge && (
            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-bg/60 border border-border rounded font-bold text-text-secondary">
              {badge}
            </span>
          )}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">{kind}</div>
        <h3 className="text-base font-semibold text-text-primary mb-1 tracking-tight">{title}</h3>
        <p className="text-xs text-text-secondary leading-relaxed mb-3">{subtitle}</p>
        <div className="text-xs text-primary font-medium inline-flex items-center gap-1">
          Activate <ArrowRight size={11} />
        </div>
      </div>
    </motion.button>
  );
}

function TenantHeader({ tenant, persona }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 mb-6">
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-lg flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
          style={{ background: tenant.logoColor }}
        >
          {tenant.logoLetter}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-xl font-semibold tracking-tight">{tenant.name}</h1>
            <span className="text-xs text-text-muted">·</span>
            <a
              href={`https://${tenant.url}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-text-secondary hover:text-primary inline-flex items-center gap-0.5"
            >
              {tenant.url} <ExternalLink size={9} />
            </a>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded font-bold">
              Active
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {tenant.products.slice(0, 4).map((p) => (
              <span key={p.id} className="text-[11px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">
                {p.name}
              </span>
            ))}
          </div>
          <div className="text-[11px] text-text-secondary leading-snug">
            <Sparkles size={9} className="inline text-primary mr-0.5" />
            ICP: {tenant.icp.industries.slice(0, 3).map((i) => i.name.split(' ').slice(0, 2).join(' ')).join(' · ')} ·
            {' '}{tenant.icp.geos.slice(0, 2).map((g) => g.name).join(', ')} ·
            {' '}{tenant.icp.revenueBand?.low}–{tenant.icp.revenueBand?.high} ·
            {' '}{tenant.icp.employeeBand?.low}–{tenant.icp.employeeBand?.high} employees
          </div>
        </div>
        <div className="text-right text-[11px] text-text-muted flex-shrink-0">
          <div className="font-semibold text-text-primary">{persona.name}</div>
          <div>{persona.role}</div>
        </div>
      </div>
    </div>
  );
}

function RecentArtifact({ name, kind, date }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-xs">
      <Layers size={11} className="text-text-muted flex-shrink-0" />
      <span className="text-text-primary truncate flex-1">{name}</span>
      <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">{kind}</span>
      <span className="text-[10px] text-text-muted w-12 text-right">{date}</span>
    </div>
  );
}

function PinnedPlaybookTile({ playbook, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="text-left rounded-lg p-4 border border-primary/30 bg-gradient-to-br from-primary/[0.06] to-transparent hover:shadow-card transition-all relative group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center">
          <Workflow size={15} className="text-emerald-700 dark:text-emerald-300" />
        </div>
        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold">
          <Pin size={8} /> RevOps
        </span>
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1 tracking-tight">{playbook.name}</h3>
      <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2 mb-2">
        {playbook.description}
      </p>
      <div className="text-[11px] text-primary font-medium inline-flex items-center gap-1">
        Run playbook <ArrowRight size={11} />
      </div>
    </motion.button>
  );
}

export default function Workbench() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { persona, personaId } = usePersona();
  const { config: demoConfig } = useDemo();
  const { showToast } = useToast();

  // Admin-pinned playbooks for this seller's role. Re-derive on admin-config changes.
  const [configTick, setConfigTick] = useState(0);
  useEffect(() => subscribeAdminConfig(() => setConfigTick((t) => t + 1)), []);
  const pinnedPlaybooks = (() => {
    void configTick;
    return listPinnedPlaybooksForSeller({
      modulesOwned: demoConfig.modulesOwned,
      salesRole: persona.salesRole,
    });
  })();

  const handlePinnedRun = (playbook) => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const handle = playbook.id.replace(/-flow$/, '').replace(/-/g, '_');
    const id = createRuntimeThread({
      useCaseId: 'admin-pinned',
      name: `${playbook.name} — ${today}`,
      configValue: `Admin-pinned playbook`,
      ownerPersonaId: personaId,
      autoInvoke: { playbookId: playbook.id, target: tenant.name },
    });
    if (id) {
      showToast(`Running @${handle} · pinned by RevOps`, 'success');
      navigate(`/thread/${id}`);
    }
  };

  // Activate "Market Analysis" — creates a TAM/SAM/SOM thread seeded with
  // the tenant's ICP. The LiveMarketBuilder appears pre-filled with the
  // tenant's industries, geos, revenue/employee bands, and spend categories.
  const handleMarketAnalysis = () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    // Map tenant ICP to LiveMarketBuilder state shape
    const industries = tenant.icp?.industries?.slice(0, 4).map((i) => i.hgId) || [];
    const geos = tenant.icp?.geos?.slice(0, 2).map((g) => g.id) || [];
    // Default to Software + Services for spend categories — most tenants are software vendors
    const spendDefaults = tenant.spendCategories?.length
      ? tenant.spendCategories.filter((s) => s.relevance === 'primary').map((s) => {
          // Map full HG ids back to internal builder ids
          if (s.name === 'Security (Software)') return 'sw_security';
          if (s.name === 'Cloud Services') return 'svc_cloud';
          if (s.name === 'Software Infrastructure') return 'sw_infra';
          if (s.name === 'Enterprise Applications') return 'sw_enterprise';
          return null;
        }).filter(Boolean)
      : ['sw', 'svc'];
    const seededBuilderState = {
      spend: spendDefaults.length ? spendDefaults : ['sw', 'svc'],
      industries,
      geos,
      revLow: 6,
      revHigh: 7,
      empLow: 5,
      empHigh: 6,
    };

    const seededConversation = [
      {
        id: 'tss-welcome',
        role: 'ai',
        timestamp: 'Just now',
        content: `Pre-filled from your tenant profile — ${tenant.name}'s ICP (${tenant.icp.industries.slice(0, 3).map((i) => i.name.split(' ')[0]).join(', ')} in ${tenant.icp.geos.slice(0, 2).map((g) => g.name).join('/')}). Adjust any input — TAM, SAM, and SOM recompute live.`,
        live: {
          type: 'MarketBuilder',
          props: { submitted: false, lockedState: seededBuilderState },
        },
        suggestions: ['Add a competitor', 'Drop a customer list', 'Tighten the headcount band'],
      },
    ];

    const id = createRuntimeThread({
      useCaseId: 'tam-sam-som',
      name: `Market Analysis — ${tenant.name} — ${today}`,
      configValue: `${tenant.icp.industries[0]?.name} · ${tenant.icp.geos[0]?.name}`,
      ownerPersonaId: personaId,
      seededConversation,
    });
    if (id) {
      showToast(`Market Analysis activated · seeded from ${tenant.name}'s ICP`, 'success');
      navigate(`/thread/${id}`);
    }
  };

  // Account Brief — open a fresh thread and remind user to @account_brief
  const handleAccountBrief = () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const id = createRuntimeThread({
      useCaseId: 'account-deep-dive',
      name: `Account Brief — ${today}`,
      configValue: 'Any target account',
      ownerPersonaId: personaId,
    });
    if (id) {
      showToast('Type @account_brief [account name] in the new thread', 'info');
      navigate(`/thread/${id}`);
    }
  };

  // Opportunity Finder — creates a thread with the playbook auto-invoked
  const handleOpportunityFinder = () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const id = createRuntimeThread({
      useCaseId: 'whitespace',
      name: `Opportunity Finder — ${tenant.name} — ${today}`,
      configValue: `Top 20 accounts matching ${tenant.name}'s ICP`,
      ownerPersonaId: personaId,
      autoInvoke: { playbookId: 'opportunity-finder-flow', target: tenant.name },
    });
    if (id) {
      showToast('Opportunity Finder running · top 20 accounts coming up', 'success');
      navigate(`/thread/${id}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">RGI Workbench</div>
      <h1 className="sr-only">Workbench</h1>

      <TenantHeader tenant={tenant} persona={persona} />

      {/* Admin-pinned playbooks for this seller's role */}
      {pinnedPlaybooks.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Pin size={12} className="text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Pinned by your RevOps team
            </h2>
            <span className="text-[10px] text-text-muted">{pinnedPlaybooks.length}</span>
          </div>
          <div className={`grid gap-3 ${pinnedPlaybooks.length === 1 ? 'grid-cols-1' : pinnedPlaybooks.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {pinnedPlaybooks.map((p) => (
              <PinnedPlaybookTile key={p.id} playbook={p} onClick={() => handlePinnedRun(p)} />
            ))}
          </div>
        </div>
      )}

      {/* Activate a play */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={12} className="text-primary" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Activate a play</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <PlayTile
            icon={Target}
            kind="Strategy play"
            title="Market Analysis"
            subtitle="Quantify your TAM, SAM, and SOM. Pre-filled from your ICP — adjust spend, industries, and bands interactively."
            gradient="bg-gradient-to-br from-blue-500/[0.06] to-transparent"
            badge="Market"
            onClick={handleMarketAnalysis}
          />
          <PlayTile
            icon={FileSearch}
            kind="Sales play"
            title="Account Brief"
            subtitle="8-agent research pipeline producing a MEDDIC-framed brief on any target. HG firmographics + web + SEC + CRM 360."
            gradient="bg-gradient-to-br from-purple-500/[0.06] to-transparent"
            badge="Account"
            onClick={handleAccountBrief}
          />
          <PlayTile
            icon={Compass}
            kind="Growth play"
            title="Opportunity Finder"
            subtitle={`Top 20 accounts matching ${tenant.name}'s ICP, ranked by intent surge and competitive overlap.`}
            gradient="bg-gradient-to-br from-emerald-500/[0.06] to-transparent"
            badge="Pipeline"
            onClick={handleOpportunityFinder}
          />
        </div>
      </div>

      {/* Two-column bottom strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Recent threads</span>
            <span className="text-[10px] text-text-muted">last 7 days</span>
          </div>
          <div className="space-y-0.5">
            <RecentArtifact name="Market Analysis — Fintech NA — May 8" kind="Thread" date="2h ago" />
            <RecentArtifact name="Account Brief — Acme Corp" kind="Thread" date="Today" />
            <RecentArtifact name="Top 20 Opps · BFS · May" kind="Thread" date="Yesterday" />
          </div>
          <button
            onClick={() => navigate('/workbench/library')}
            className="mt-2 text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
          >
            View artifact library <ArrowRight size={9} />
          </button>
        </div>

        <div className="bg-surface border border-border rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Research resources</span>
            <span className="text-[10px] text-text-muted">agents pull from here</span>
          </div>
          <div className="space-y-0.5">
            <RecentArtifact name={`${tenant.name} vs Prisma — Battle Card v3.2`} kind="PDF" date="May 10" />
            <RecentArtifact name="CISO Buyer Persona — Cloud Security" kind="DOC" date="May 5" />
            <RecentArtifact name="Forrester Wave: CNAPP Q2 2026" kind="REPORT" date="May 7" />
          </div>
          <button
            onClick={() => navigate('/workbench/resources')}
            className="mt-2 text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
          >
            Manage resources <ArrowRight size={9} />
          </button>
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
        <div className="inline-flex items-center gap-1.5">
          <Sparkles size={10} className="text-primary" />
          Every play uses {tenant.name}'s products, ICP, and competitor list automatically.
        </div>
        <button
          onClick={() => showToast('Tenant profile editor opens in Admin', 'info')}
          className="inline-flex items-center gap-1 hover:text-text-secondary"
        >
          <Settings size={10} /> Edit tenant profile
        </button>
      </div>
    </div>
  );
}
