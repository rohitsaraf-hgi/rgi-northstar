import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  Circle,
  Settings,
  Activity,
  ArrowLeft,
  ExternalLink,
  Terminal,
  MessageSquare,
  Code2,
  Mail,
  Globe,
  Bot,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CONNECTED_APPS, INTEGRATION_ACTIVITY, MCP_TOOLS, SURFACES } from '../data/surfaces.js';
import {
  getIntegrationGovernance,
  setIntegrationGovernance,
  listIntegrationTools,
  listAccessAuditLog,
  clearAccessAuditLog,
  subscribeIntegrationGovernance,
} from '../data/integrationGovernance.js';
import { useToast } from '../context/ToastContext.jsx';
import Avatar from '../components/shared/Avatar.jsx';

const SURFACE_ICONS = {
  browser: Globe,
  slack: MessageSquare,
  mcp: Terminal,
  api: Code2,
  email: Mail,
};

function StatusIcon({ status }) {
  if (status === 'connected') return <CheckCircle2 size={12} className="text-success flex-shrink-0" />;
  if (status === 'action_required') return <AlertTriangle size={12} className="text-warning flex-shrink-0" />;
  return <Circle size={12} className="text-text-muted flex-shrink-0" />;
}

function StatusLabel({ status, statusDetail }) {
  const tone =
    status === 'connected'
      ? 'text-success'
      : status === 'action_required'
      ? 'text-warning'
      : 'text-text-muted';
  return (
    <span className={`text-[11px] ${tone}`}>{statusDetail}</span>
  );
}

function AgentAccessBlock({ app, governance, onToggle }) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const tools = listIntegrationTools(app.id);
  const isConnected = app.status === 'connected';
  const actionRequired = app.status === 'action_required';
  const enabled = governance.agentAccess && isConnected;
  const blocked = !isConnected;
  const readCount = tools.filter((t) => t.scope === 'read').length;
  const writeCount = tools.filter((t) => t.scope === 'write').length;

  return (
    <div
      className={`border rounded-md p-2 mb-3 ${
        enabled
          ? 'bg-emerald-500/5 border-emerald-500/30'
          : actionRequired
          ? 'bg-warning/5 border-warning/30'
          : blocked
          ? 'bg-bg/40 border-border'
          : 'bg-surface-2 border-border'
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
            enabled ? 'bg-emerald-500/10' : 'bg-surface-2'
          }`}
        >
          <Bot size={11} className={enabled ? 'text-emerald-700 dark:text-emerald-300' : 'text-text-muted'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-text-primary leading-tight">Agent access</div>
          <div className="text-[10px] text-text-muted leading-tight">
            {blocked
              ? 'Connect this integration first to grant agent access'
              : actionRequired
              ? 'Re-auth required before agents can use this integration'
              : enabled
              ? `Agents may call ${tools.length} tool${tools.length === 1 ? '' : 's'} (${readCount} read · ${writeCount} write)`
              : 'Agents are blocked from using this integration'}
          </div>
        </div>
        <button
          onClick={() => onToggle(!governance.agentAccess)}
          disabled={blocked}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors flex-shrink-0 border ${
            enabled
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15'
              : blocked
              ? 'bg-bg/40 text-text-muted border-border cursor-not-allowed'
              : 'bg-surface text-text-secondary border-border hover:text-text-primary'
          }`}
          title={
            blocked
              ? 'Integration must be connected before agent access can be enabled'
              : enabled
              ? 'Agents can use this integration — click to revoke'
              : 'Agents cannot use this integration — click to grant'
          }
        >
          {enabled ? <Unlock size={9} /> : <Lock size={9} />}
          {enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {/* Tool catalog disclosure */}
      {tools.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/40">
          <button
            onClick={() => setToolsOpen((v) => !v)}
            className="w-full flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
          >
            {toolsOpen ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
            <span className="uppercase tracking-wider font-semibold">
              {toolsOpen ? 'Hide' : 'Show'} tools exposed to agents ({tools.length})
            </span>
          </button>
          {toolsOpen && (
            <div className="mt-1.5 space-y-1">
              {tools.map((t) => (
                <div key={t.id} className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded ${
                      t.scope === 'write'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {t.scope}
                  </span>
                  <code className="text-[10px] font-mono text-text-secondary">{t.id}</code>
                  <span className="text-[10px] text-text-muted">— {t.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AppCard({ app, governance, onToggleAgentAccess, onSelect }) {
  const { showToast } = useToast();
  const hasGovernance = listIntegrationTools(app.id).length > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-surface border rounded-lg p-4 flex flex-col ${
        app.status === 'action_required' ? 'border-warning/40' : 'border-border'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: app.logoColor }}
        >
          {app.logoText}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text-primary mb-0.5">{app.name}</div>
          <div className="flex items-center gap-1.5">
            <StatusIcon status={app.status} />
            <StatusLabel status={app.status} statusDetail={app.statusDetail} />
          </div>
        </div>
      </div>

      <p className="text-xs text-text-secondary leading-relaxed mb-3 flex-1">{app.description}</p>

      {app.warning && (
        <div className="flex items-start gap-1.5 px-2 py-1.5 bg-warning/10 border border-warning/30 rounded text-[11px] text-warning mb-3">
          <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
          {app.warning}
        </div>
      )}

      {app.endpoint && (
        <div className="text-[10px] font-mono text-text-muted mb-3 truncate" title={app.endpoint}>
          {app.endpoint}
        </div>
      )}

      {hasGovernance && (
        <AgentAccessBlock app={app} governance={governance} onToggle={onToggleAgentAccess} />
      )}

      <div className="flex items-center gap-1 mt-auto pt-3 border-t border-border">
        {app.lastActivity && (
          <span className="text-[10px] text-text-muted flex items-center gap-1">
            <Activity size={10} />
            {app.lastActivity}
          </span>
        )}
        <button
          onClick={() => {
            if (app.id === 'mcp') onSelect('mcp');
            else if (app.id === 'slack') showToast(`Slack workspace: ${app.statusDetail}`, 'info');
            else if (app.status === 'action_required') showToast(`Re-auth flow for ${app.name} would open here`, 'info');
            else showToast(`${app.name} configuration would open here`, 'info');
          }}
          className="ml-auto flex items-center gap-1 px-2 py-1 text-[11px] text-primary hover:bg-primary/10 rounded transition-colors"
        >
          <Settings size={11} />
          Manage
        </button>
      </div>
    </motion.div>
  );
}

function findIntegrationCard(integrationId) {
  for (const cat of CONNECTED_APPS) {
    const found = cat.apps.find((a) => a.id === integrationId);
    if (found) return found;
  }
  return null;
}

function formatAuditTime(iso) {
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) {
    const mins = Math.floor(diffMs / 60000);
    return mins <= 0 ? 'just now' : `${mins}m ago`;
  }
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${then.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

function AccessAuditRow({ entry }) {
  const integration = findIntegrationCard(entry.integrationId);
  const isEnable = entry.action === 'agent_access_enabled';
  const isToolMod = entry.action === 'tools_modified';
  const Icon = isToolMod ? Settings : isEnable ? Unlock : Lock;
  const tone = isToolMod
    ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
    : isEnable
    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300';
  const label = isToolMod ? 'Tools modified' : isEnable ? 'Granted' : 'Revoked';

  return (
    <div className="px-4 py-2.5 border-b border-border last:border-0 flex items-start gap-3 hover:bg-bg/40 transition-colors">
      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${tone}`}>
        <Icon size={11} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${tone}`}>
            {label}
          </span>
          <span className="text-text-primary font-medium">{entry.by}</span>
          <span className="text-text-secondary">
            {isToolMod
              ? 'modified tool exposure for'
              : isEnable
              ? 'enabled agent access for'
              : 'revoked agent access from'}
          </span>
          {integration ? (
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                style={{ background: integration.logoColor }}
              >
                {integration.logoText}
              </div>
              <span className="text-text-primary font-semibold">{integration.name}</span>
            </div>
          ) : (
            <code className="text-[11px] font-mono text-text-primary">{entry.integrationId}</code>
          )}
        </div>
        {entry.message && entry.action !== 'agent_access_enabled' && entry.action !== 'agent_access_disabled' && (
          <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">{entry.message}</div>
        )}
      </div>
      <span className="text-[10px] text-text-muted whitespace-nowrap flex-shrink-0">
        {formatAuditTime(entry.at)}
      </span>
    </div>
  );
}

function ActivityRow({ a }) {
  const cfg = SURFACES[a.surface] || SURFACES.browser;
  const Icon = SURFACE_ICONS[a.surface] || Globe;
  return (
    <div className="px-4 py-2.5 border-b border-border last:border-0 flex items-start gap-3 hover:bg-bg/40 transition-colors">
      <Avatar name={a.actor} initials={a.actorInitials} color={a.actorColor} size={24} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-text-primary font-medium">{a.actor}</span>
          <span className="text-text-secondary">{a.action}</span>
          <code className="text-[11px] font-mono px-1 py-0 bg-bg/60 border border-border rounded text-text-primary">
            {a.tool}
          </code>
          <span className="text-text-secondary">on</span>
          <span className="text-text-primary truncate">{a.target}</span>
        </div>
        <div className="text-[11px] text-text-secondary mt-0.5 leading-tight truncate">{a.detail}</div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}
        >
          <Icon size={9} />
          {cfg.short}
        </span>
        <span className="text-[10px] text-text-muted whitespace-nowrap">{a.timestamp}</span>
      </div>
    </div>
  );
}

function McpDetail() {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Terminal size={14} className="text-amber-700 dark:text-amber-300" />
        <h3 className="text-sm font-semibold text-text-primary">Claude Code MCP — Tools exposed</h3>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed mb-3">
        Tools that produce content take a <code className="text-[11px] font-mono px-1 py-0 bg-bg/60 border border-border rounded">targetThreadId</code> parameter — the platform enforces "system-of-record" at the API level, not just by convention.
      </p>
      <div className="space-y-1.5">
        {MCP_TOOLS.map((t) => (
          <div key={t.name} className="flex items-start gap-2 px-2.5 py-1.5 bg-bg/40 border border-border rounded">
            <code className="text-[11px] font-mono text-amber-700 dark:text-amber-300 font-semibold whitespace-nowrap">
              {t.name}
            </code>
            <span className="text-text-muted text-[11px]">·</span>
            <span className="text-[11px] text-text-secondary leading-snug">{t.purpose}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ConnectedAppsRoute() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [govTick, setGovTick] = useState(0);

  useEffect(() => subscribeIntegrationGovernance(() => setGovTick((t) => t + 1)), []);

  const handleSelect = (id) => {
    if (id === 'mcp') {
      const el = document.getElementById('mcp-detail');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleToggleAgentAccess = (app, next) => {
    setIntegrationGovernance(app.id, { agentAccess: next });
    showToast(
      next
        ? `Agents can now use ${app.name} — ${listIntegrationTools(app.id).length} tools exposed`
        : `Revoked agent access to ${app.name}`,
      next ? 'success' : 'info',
    );
  };

  const total = CONNECTED_APPS.reduce((s, c) => s + c.apps.length, 0);
  const connected = CONNECTED_APPS.reduce(
    (s, c) => s + c.apps.filter((a) => a.status === 'connected').length,
    0,
  );
  const action = CONNECTED_APPS.reduce(
    (s, c) => s + c.apps.filter((a) => a.status === 'action_required').length,
    0,
  );
  // eslint-disable-next-line no-unused-vars
  const _govDependency = govTick;
  const agentEnabled = CONNECTED_APPS.reduce((s, c) => {
    return (
      s +
      c.apps.filter((a) => {
        if (a.status !== 'connected') return false;
        if (listIntegrationTools(a.id).length === 0) return false;
        return getIntegrationGovernance(a.id).agentAccess;
      }).length
    );
  }, 0);
  const agentEligible = CONNECTED_APPS.reduce((s, c) => {
    return s + c.apps.filter((a) => a.status === 'connected' && listIntegrationTools(a.id).length > 0).length;
  }, 0);

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors mb-4"
      >
        <ArrowLeft size={12} />
        Back to Admin Hub
      </button>

      <div className="mb-2 text-xs text-text-muted">Platform & Ops · Connected Apps</div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Connected Apps & Integrations</h1>
      <p className="text-sm text-text-secondary mb-6 max-w-3xl">
        Every surface that touches the platform — Slack, Claude Code, public API, CRM, downstream systems. Outputs from any tool always write back to the platform as thread artifacts. The platform owns history, the tools deliver value.
      </p>

      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="bg-surface border border-border rounded-lg p-3.5">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Total integrations</div>
          <div className="text-2xl font-semibold text-text-primary">{total}</div>
        </div>
        <div className="bg-surface border border-success/30 rounded-lg p-3.5">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Connected</div>
          <div className="text-2xl font-semibold text-success">{connected}</div>
        </div>
        <div className="bg-surface border border-warning/30 rounded-lg p-3.5">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Action required</div>
          <div className="text-2xl font-semibold text-warning">{action}</div>
        </div>
        <div className="bg-surface border border-emerald-500/30 rounded-lg p-3.5">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1 flex items-center gap-1">
            <Bot size={9} className="text-emerald-700 dark:text-emerald-300" />
            Agent-enabled
          </div>
          <div className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
            {agentEnabled}
            <span className="text-text-muted font-normal text-base"> / {agentEligible}</span>
          </div>
        </div>
      </div>

      {CONNECTED_APPS.map((category) => (
        <section key={category.category} className="mb-8">
          <h2 className="text-sm font-semibold text-text-primary mb-3">{category.category}</h2>
          <div className="grid grid-cols-3 gap-3">
            {category.apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                governance={getIntegrationGovernance(app.id) || { agentAccess: false }}
                onToggleAgentAccess={(next) => handleToggleAgentAccess(app, next)}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </section>
      ))}

      {/* MCP detail — always visible below */}
      <div id="mcp-detail">
        <McpDetail />
      </div>

      {/* Access change log — admin governance events */}
      <AccessAuditSection />

      {/* Recent activity */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} className="text-text-secondary" />
          <h2 className="text-sm font-semibold text-text-primary">Recent integration activity</h2>
          <span className="text-xs text-text-muted">· agent tool invocations · last 24h</span>
        </div>
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {INTEGRATION_ACTIVITY.map((a) => (
            <ActivityRow key={a.id} a={a} />
          ))}
        </div>
      </section>
    </div>
  );
}

function AccessAuditSection() {
  const { showToast } = useToast();
  const audit = listAccessAuditLog({ limit: 20 });

  const handleClear = () => {
    if (typeof window === 'undefined') return;
    const ok = window.confirm('Clear the access change log? This cannot be undone.');
    if (!ok) return;
    clearAccessAuditLog();
    showToast('Access change log cleared', 'info');
  };

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Lock size={14} className="text-text-secondary" />
        <h2 className="text-sm font-semibold text-text-primary">Access change log</h2>
        <span className="text-xs text-text-muted">· who toggled what agent access</span>
        {audit.length > 0 && (
          <button
            onClick={handleClear}
            className="ml-auto text-[10px] text-text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            Clear log
          </button>
        )}
      </div>
      {audit.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-lg p-8 text-center">
          <Lock size={18} className="mx-auto mb-2 text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">No access changes yet</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
            Toggling agent access on any integration above will log here for audit. Entries persist
            until you clear them.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {audit.map((e, i) => (
            <AccessAuditRow key={`${e.at}-${i}`} entry={e} />
          ))}
        </div>
      )}
    </section>
  );
}
