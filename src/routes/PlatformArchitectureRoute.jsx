import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  BarChart2,
  Cpu,
  Target,
  Star,
  Bot,
  Building,
  Activity,
  Users,
  TrendingUp,
  CheckCircle2,
  Lock,
  Plug,
  MessageSquare,
  Terminal,
  Code2,
  Globe,
  Mail,
} from 'lucide-react';
import { useDemo } from '../context/DemoContext.jsx';
import { useModuleDetail } from '../context/ModuleDetailContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  MODULE_DEFINITIONS,
  CORE_SERVICES,
  TIER_DEFINITIONS,
  USE_CASE_MODULE_MAP,
  useCaseAvailability,
} from '../data/modules.js';
import { USE_CASES, USE_CASE_CATEGORIES } from '../data/useCases.js';

const MODULE_ICONS = {
  BarChart2,
  Cpu,
  Target,
  Star,
  Bot,
};

const SERVICE_ICONS = {
  Building,
  Layers,
  Activity,
  Users,
  TrendingUp,
  Star,
};

function LayerLabel({ children }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-1">
      {children}
    </div>
  );
}

function LayerHeader({ label, tag }) {
  return (
    <div className="mb-3">
      <LayerLabel>{label}</LayerLabel>
      {tag && <div className="text-[11px] text-text-secondary italic">{tag}</div>}
    </div>
  );
}

function UserExperienceLayer() {
  return (
    <section className="border border-border rounded-lg p-5 bg-surface">
      <LayerHeader label="User Experience Layer" tag="What every user sees regardless of plan" />
      <div className="text-sm text-text-primary leading-relaxed">
        AI-native unified workspace · Single canvas · Thread-based · Conversation-first
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {[
          'Workspace Home',
          'Threads',
          'Live Components',
          'Saved Library',
          'Awareness',
          'Multi-surface',
        ].map((s) => (
          <span
            key={s}
            className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-primary/10 text-primary rounded"
          >
            {s}
          </span>
        ))}
      </div>
    </section>
  );
}

function UseCaseLayer({ modulesOwned }) {
  const grouped = USE_CASES.reduce((acc, u) => {
    if (u.requiresAdmin) return acc; // skip admin-only for the public view
    const k = u.category || 'OTHER';
    (acc[k] = acc[k] || []).push(u);
    return acc;
  }, {});
  return (
    <section className="border border-border rounded-lg p-5 bg-surface">
      <LayerHeader label="Use Case Layer" tag="Activated by persona · Depth determined by modules" />
      <div className="space-y-2.5">
        {Object.entries(grouped).map(([cat, list]) => {
          const catCfg = USE_CASE_CATEGORIES[cat];
          return (
            <div key={cat}>
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
                {catCfg?.label || cat}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {list.map((u) => {
                  const a = useCaseAvailability(u.id, modulesOwned);
                  const styles =
                    a.state === 'available'
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : a.state === 'partial'
                      ? 'bg-warning/15 text-warning border border-warning/30'
                      : 'bg-text-muted/10 text-text-muted border border-border';
                  return (
                    <span
                      key={u.id}
                      className={`text-[11px] px-2 py-0.5 rounded ${styles}`}
                      title={`${a.stagesAvailable} of ${a.totalStages} stages available`}
                    >
                      {u.name}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ModuleLayer({ modulesOwned, onOpenModule }) {
  return (
    <section className="border border-border rounded-lg p-5 bg-surface">
      <LayerHeader label="Module Layer" tag="Capability bundles built on core services" />
      <div className="grid grid-cols-5 gap-2">
        {MODULE_DEFINITIONS.map((m) => {
          const Icon = MODULE_ICONS[m.icon] || Cpu;
          const owned = modulesOwned.includes(m.id);
          const status = owned ? 'ACTIVE' : m.isExpansion ? 'EXPANSION' : 'NOT IN PLAN';
          return (
            <button
              key={m.id}
              onClick={() => onOpenModule(m.id)}
              className={`text-left p-3 rounded-md border transition-colors ${
                owned ? 'bg-bg/40 hover:bg-bg/60' : 'bg-bg/30 hover:bg-bg/50 opacity-80'
              }`}
              style={{ borderColor: owned ? `${m.color}50` : 'rgb(var(--color-border))' }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={14} style={{ color: owned ? m.color : 'rgb(var(--color-text-muted))' }} />
                <span className="text-xs font-semibold text-text-primary truncate">{m.name}</span>
              </div>
              <span
                className={`text-[9px] uppercase tracking-wider font-bold ${
                  owned
                    ? 'text-success'
                    : m.isExpansion
                    ? 'text-warning'
                    : 'text-text-muted'
                }`}
              >
                {status}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CoreServicesLayer({ modulesOwned }) {
  return (
    <section className="border border-border rounded-lg p-5 bg-surface">
      <LayerHeader label="Core Platform Services" tag="The data substrate every module reads from" />
      <div className="grid grid-cols-3 gap-2">
        {CORE_SERVICES.map((s) => {
          const Icon = SERVICE_ICONS[s.icon] || Activity;
          const consumers = MODULE_DEFINITIONS.filter(
            (m) => m.coreServices.includes(s.id) && modulesOwned.includes(m.id)
          );
          return (
            <div key={s.id} className="bg-bg/40 border border-border rounded-md p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} className="text-primary" />
                <span className="text-xs font-semibold text-text-primary">{s.name}</span>
              </div>
              <div className="text-[10px] text-text-muted mb-2">{s.stat}</div>
              <div className="flex items-center gap-1">
                {consumers.length > 0 ? (
                  consumers.map((m) => (
                    <span
                      key={m.id}
                      className="w-2 h-2 rounded-full"
                      style={{ background: m.color }}
                      title={m.name}
                    />
                  ))
                ) : (
                  <span className="text-[10px] text-text-muted italic">No consumers</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function IntegrationLayer({ integrationsConnected, subscriptionTier }) {
  const tier = TIER_DEFINITIONS[subscriptionTier];
  const allTiers = ['starter', 'growth', 'enterprise'];
  return (
    <section className="border border-border rounded-lg p-5 bg-surface">
      <LayerHeader label="Integration & Access Layer" tag="How users and downstream systems reach the platform" />
      <div className="grid grid-cols-3 gap-3">
        {/* Connected integrations */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
            Connected Integrations
          </div>
          <div className="space-y-1.5">
            {[
              { id: 'salesforce', name: 'Salesforce', sub: 'last sync 14 min ago' },
              { id: 'outreach', name: 'Outreach', sub: 'last sync 2 hours ago' },
              { id: 'hubspot', name: 'HubSpot', sub: 'not connected' },
              { id: 'marketo', name: 'Marketo', sub: 'not connected' },
            ].map((i) => {
              const on = integrationsConnected.includes(i.id);
              return (
                <div
                  key={i.id}
                  className="flex items-center gap-2 px-2 py-1.5 bg-bg/40 border border-border rounded"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-success' : 'bg-text-muted/50'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-text-primary truncate">{i.name}</div>
                    <div className="text-[9px] text-text-muted truncate">
                      {on ? i.sub : 'not connected'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subscription tier */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
            Subscription Tier
          </div>
          <div className="overflow-hidden rounded border border-border bg-bg/40">
            <div className="grid grid-cols-3 text-[10px] text-text-muted border-b border-border">
              {allTiers.map((t) => {
                const isActive = subscriptionTier === t;
                return (
                  <div
                    key={t}
                    className={`px-2 py-1 text-center uppercase font-semibold tracking-wider border-r last:border-r-0 border-border ${
                      isActive ? 'bg-primary/15 text-primary' : ''
                    }`}
                  >
                    {TIER_DEFINITIONS[t].name}
                  </div>
                );
              })}
            </div>
            {[
              ['AI turns / thread', (t) => (TIER_DEFINITIONS[t].aiTurnsPerThread === -1 ? '∞' : TIER_DEFINITIONS[t].aiTurnsPerThread)],
              ['Monthly export', (t) => (TIER_DEFINITIONS[t].exportLimitMonthly === -1 ? '∞' : `${(TIER_DEFINITIONS[t].exportLimitMonthly / 1000).toFixed(0)}K`)],
              ['Collaborative', (t) => (TIER_DEFINITIONS[t].collaborativeWorkspaces ? '✓' : '—')],
              ['Agent autonomy', (t) => (TIER_DEFINITIONS[t].agentAutonomy ? '✓' : '—')],
              ['API access', (t) => (TIER_DEFINITIONS[t].apiAccess ? '✓' : '—')],
            ].map(([label, valFn]) => (
              <div key={label} className="grid grid-cols-3 text-[10px] border-b last:border-b-0 border-border">
                {allTiers.map((t) => {
                  const isActive = subscriptionTier === t;
                  return (
                    <div
                      key={t}
                      className={`px-2 py-1 text-center border-r last:border-r-0 border-border ${
                        isActive ? 'bg-primary/5 text-text-primary font-medium' : 'text-text-secondary'
                      }`}
                    >
                      {valFn(t)}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="px-2 py-1 text-[9px] text-text-muted text-center bg-bg/60">
              row labels: turns · export · collab · agent · API
            </div>
          </div>
        </div>

        {/* Access channels */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
            Access Channels
          </div>
          <div className="space-y-1.5">
            {[
              { name: 'Web workspace', icon: Globe, status: 'active' },
              { name: 'Slack integration', icon: MessageSquare, status: 'active' },
              { name: 'Claude Code / API', icon: Terminal, status: tier?.apiAccess ? 'active' : 'enterprise-only' },
              { name: 'Microsoft Teams', icon: Code2, status: 'available' },
              { name: 'Email digest', icon: Mail, status: 'active' },
            ].map((ch) => {
              const Icon = ch.icon;
              const active = ch.status === 'active';
              const enterpriseOnly = ch.status === 'enterprise-only';
              return (
                <div
                  key={ch.name}
                  className="flex items-center gap-2 px-2 py-1.5 bg-bg/40 border border-border rounded"
                >
                  <Icon size={11} className={active ? 'text-success' : 'text-text-muted'} />
                  <span className="flex-1 text-[11px] text-text-primary truncate">{ch.name}</span>
                  {active ? (
                    <CheckCircle2 size={11} className="text-success" />
                  ) : enterpriseOnly ? (
                    <span className="inline-flex items-center gap-1 text-[9px] text-warning uppercase tracking-wider font-bold">
                      <Lock size={9} />
                      Enterprise
                    </span>
                  ) : (
                    <span className="text-[9px] text-text-muted uppercase">Available</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function PlatformHealthBar({ integrationsConnected }) {
  const items = [
    {
      label: 'Salesforce',
      ok: integrationsConnected.includes('salesforce'),
      okText: 'healthy',
      offText: 'not connected',
    },
    {
      label: 'Outreach',
      ok: integrationsConnected.includes('outreach'),
      okText: 'healthy',
      offText: 'not connected',
    },
    {
      label: 'HubSpot',
      ok: integrationsConnected.includes('hubspot'),
      okText: 'healthy',
      offText: 'not connected',
    },
  ];
  return (
    <section className="border border-border rounded-lg px-4 py-3 bg-bg/40 flex items-center gap-4 text-[11px] text-text-secondary flex-wrap">
      <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Platform Health</span>
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${it.ok ? 'bg-success' : 'bg-text-muted/40'}`} />
          {it.label} {it.ok ? <span className="text-success">{it.okText}</span> : <span className="text-text-muted">{it.offText}</span>}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-warning" />1 model needs attention
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />Credits 27.6% consumed
      </span>
    </section>
  );
}

export default function PlatformArchitectureRoute() {
  const navigate = useNavigate();
  const { config } = useDemo();
  const { open: openModuleModal } = useModuleDetail();

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="mb-2 text-xs text-text-muted">Platform</div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Platform Architecture</h1>
      <p className="text-sm text-text-secondary mb-6 max-w-3xl">
        Five layers from user experience down to integration. Use the Demo Controls (bottom right) to toggle modules, tier, or integrations — the layers update live to show what each plan exposes.
      </p>

      <div className="space-y-3">
        <UserExperienceLayer />
        <UseCaseLayer modulesOwned={config.modulesOwned} />
        <ModuleLayer modulesOwned={config.modulesOwned} onOpenModule={openModuleModal} />
        <CoreServicesLayer modulesOwned={config.modulesOwned} />
        <IntegrationLayer
          integrationsConnected={config.integrationsConnected}
          subscriptionTier={config.subscriptionTier}
        />
        <PlatformHealthBar integrationsConnected={config.integrationsConnected} />
      </div>
    </div>
  );
}
