import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bot,
  ArrowLeft,
  Workflow,
  Play,
  ShieldCheck,
  Users,
  ArrowRight,
  ChevronDown,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Pin,
  PinOff,
  Globe,
  Upload,
  Eye,
} from 'lucide-react';
import { listAgenticPlaybooks, findPlaybookById } from '../data/playbooks.js';
import { AGENTS, CAPABILITY_TIERS, resolveCapability } from '../data/agents.js';
import { runsForPlaybook, runStats, AGENT_RUN_STATUSES } from '../data/agentRuns.js';
import { moduleLabel } from '../data/modules.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  getPlaybookConfig,
  setPlaybookConfig,
  subscribeAdminConfig,
  SELLER_ROLES,
} from '../data/adminConfig.js';

function CapabilityChip({ tier, dimmed }) {
  const cfg = CAPABILITY_TIERS[tier];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border} ${dimmed ? 'opacity-60' : ''}`}
      title={cfg.desc}
    >
      <ShieldCheck size={9} />
      {cfg.label}
    </span>
  );
}

function StatusDot({ status }) {
  const cfg = AGENT_RUN_STATUSES[status];
  if (!cfg) return null;
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
        {cfg.label}
      </span>
    </span>
  );
}

// ===== LIST VIEW =====
function StatusBadge({ status }) {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-success/15 text-success rounded text-[10px] font-bold uppercase tracking-wider">
        <span className="w-1 h-1 rounded-full bg-success" />
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-text-muted/15 text-text-secondary rounded text-[10px] font-bold uppercase tracking-wider">
      Draft
    </span>
  );
}

function AudienceBadge({ roles }) {
  if (!roles || roles.length === 0 || roles.length === SELLER_ROLES.length) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
        <Globe size={9} /> All sellers
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-text-secondary">
      <Users size={9} /> {roles.join(' · ')}
    </span>
  );
}

function PlaybookListView({ playbooks, configs, onTogglePin, onTogglePublish }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      {playbooks.map((p, i) => {
        const stats = runStats(p.id);
        const cfg = configs[p.id] || { status: 'draft', audienceRoles: [...SELLER_ROLES], pinnedToWorkbench: false };
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`w-full bg-surface border rounded-md p-4 transition-all group ${
              cfg.status === 'published'
                ? 'border-border hover:border-primary/30 hover:shadow-card'
                : 'border-border/60 opacity-90 hover:opacity-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Workflow size={15} className="text-emerald-700 dark:text-emerald-300" />
              </div>
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/workflows/${p.id}`)}
                  className="text-left w-full"
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-text-primary">{p.name}</h3>
                    <span className="text-[10px] text-text-muted font-mono">
                      @{p.id.replace(/-flow$/, '').replace(/-/g, '_')}
                    </span>
                    <StatusBadge status={cfg.status} />
                    {cfg.pinnedToWorkbench && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase tracking-wider">
                        <Pin size={8} /> Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed mb-3 line-clamp-2">
                    {p.description}
                  </p>

                  {/* Pipeline preview */}
                  <div className="flex items-center gap-1 flex-wrap mb-3">
                    {p.pipeline.map((node, idx) => {
                      const a = AGENTS[node.agent];
                      return (
                        <div key={idx} className="flex items-center gap-1">
                          <span className="text-[10px] font-mono text-text-secondary bg-bg/40 border border-border px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                            <Bot size={9} className="text-emerald-700 dark:text-emerald-300" />
                            {a?.label || node.agent}
                          </span>
                          {idx < p.pipeline.length - 1 && (
                            <ArrowRight size={9} className="text-text-muted" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Play size={10} />
                      {stats.total} runs
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      {stats.successRate}% success
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={10} />
                      {(stats.avgMs / 1000).toFixed(1)}s avg
                    </span>
                    <span className="mx-1 text-border">|</span>
                    <AudienceBadge roles={cfg.audienceRoles} />
                  </div>
                </button>

                {/* Quick admin actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePublish(p.id, cfg.status === 'published' ? 'draft' : 'published');
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider border transition-colors ${
                      cfg.status === 'published'
                        ? 'bg-bg/40 text-text-muted border-border hover:text-text-secondary'
                        : 'bg-primary text-white border-primary hover:bg-primary-dim'
                    }`}
                  >
                    <Upload size={10} />
                    {cfg.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(p.id, !cfg.pinnedToWorkbench);
                    }}
                    disabled={cfg.status !== 'published'}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider border transition-colors ${
                      cfg.pinnedToWorkbench
                        ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/15'
                        : 'bg-bg/40 text-text-muted border-border hover:text-text-secondary'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                    title={
                      cfg.status !== 'published'
                        ? 'Publish first to pin to seller Workbench'
                        : cfg.pinnedToWorkbench
                          ? 'Unpin from seller Workbench'
                          : 'Pin to seller Workbench'
                    }
                  >
                    {cfg.pinnedToWorkbench ? <PinOff size={10} /> : <Pin size={10} />}
                    {cfg.pinnedToWorkbench ? 'Unpin' : 'Pin to Workbench'}
                  </button>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ArrowRight size={10} />
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ===== DETAIL VIEW =====
function NodeRow({ node, audiencePolicies, onChangeCapability, onChangeAudienceOverride }) {
  const agent = AGENTS[node.agent];
  if (!agent) return null;
  return (
    <div className="bg-surface border border-border rounded-md p-3">
      <div className="flex items-start gap-2 mb-2">
        <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Bot size={11} className="text-emerald-700 dark:text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-text-primary">{agent.label}</span>
            <span className="text-[10px] text-text-muted font-mono">@{agent.id}</span>
          </div>
          <div className="text-[11px] text-text-secondary leading-snug mt-0.5">{agent.desc}</div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[9px] uppercase tracking-wider text-text-muted">Ceiling:</span>
          <CapabilityChip tier={agent.ceiling} dimmed />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">
            Workflow capability
          </div>
          <select
            value={node.capability}
            onChange={(e) => onChangeCapability(e.target.value)}
            className="w-full px-2 py-1 text-[11px] bg-bg border border-border rounded text-text-primary focus:border-primary/40 focus:outline-none"
          >
            {Object.entries(CAPABILITY_TIERS).map(([k, v]) => (
              <option key={k} value={k} disabled={CAPABILITY_TIERS[agent.ceiling] && Object.keys(CAPABILITY_TIERS).indexOf(k) > Object.keys(CAPABILITY_TIERS).indexOf(agent.ceiling)}>
                {v.label} — {v.desc}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">
            Required module
          </div>
          <div className="px-2 py-1 text-[11px] bg-bg/40 border border-border rounded text-text-secondary">
            {moduleLabel(agent.requiredModule)}
          </div>
        </div>
      </div>

      {audiencePolicies?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/60">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
            Audience overrides
          </div>
          <div className="space-y-1">
            {audiencePolicies.map((p) => {
              const overrideValue = p.overrides[node.agent];
              const effective = resolveCapability({
                agentId: node.agent,
                workflowPolicy: node.capability,
                audienceOverride: overrideValue,
              });
              return (
                <div key={p.key} className="flex items-center gap-2 text-[11px]">
                  <Users size={10} className="text-text-muted flex-shrink-0" />
                  <span className="text-text-secondary flex-1">{p.label}</span>
                  <select
                    value={overrideValue || ''}
                    onChange={(e) => onChangeAudienceOverride(p.key, node.agent, e.target.value || null)}
                    className="px-1.5 py-0.5 text-[10px] bg-bg border border-border rounded text-text-primary focus:border-primary/40 focus:outline-none"
                  >
                    <option value="">(no override)</option>
                    {Object.entries(CAPABILITY_TIERS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <span className="text-text-muted">→</span>
                  <CapabilityChip tier={effective} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PlaybookDetailView({ playbook }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [pipeline, setPipeline] = useState(playbook.pipeline);
  const [audiencePolicies, setAudiencePolicies] = useState(playbook.audiencePolicies || []);
  const [tab, setTab] = useState('definition');
  const [simulating, setSimulating] = useState(false);
  const [adminCfg, setAdminCfg] = useState(() => getPlaybookConfig(playbook.id));
  const [simulateAs, setSimulateAs] = useState('AE');

  useEffect(() => {
    return subscribeAdminConfig(() => setAdminCfg(getPlaybookConfig(playbook.id)));
  }, [playbook.id]);

  const stats = runStats(playbook.id);
  const runs = runsForPlaybook(playbook.id, 10);

  const updateCapability = (idx, capability) => {
    setPipeline((prev) => prev.map((n, i) => (i === idx ? { ...n, capability } : n)));
  };
  const updateAudienceOverride = (audKey, agentId, value) => {
    setAudiencePolicies((prev) =>
      prev.map((p) => {
        if (p.key !== audKey) return p;
        const overrides = { ...p.overrides };
        if (!value) delete overrides[agentId];
        else overrides[agentId] = value;
        return { ...p, overrides };
      })
    );
  };

  const togglePublish = () => {
    const next = adminCfg.status === 'published' ? 'draft' : 'published';
    setPlaybookConfig(playbook.id, { status: next });
    showToast(
      next === 'published'
        ? `${playbook.name} published — sellers can now invoke it`
        : `${playbook.name} reverted to draft — hidden from sellers`,
      next === 'published' ? 'success' : 'info',
    );
  };

  const togglePin = () => {
    const next = !adminCfg.pinnedToWorkbench;
    setPlaybookConfig(playbook.id, { pinnedToWorkbench: next });
    showToast(
      next ? 'Pinned to seller Workbench' : 'Removed from seller Workbench',
      'info',
    );
  };

  const toggleRole = (role) => {
    const current = adminCfg.audienceRoles;
    const next = current.includes(role) ? current.filter((r) => r !== role) : [...current, role];
    if (next.length === 0) {
      showToast('At least one role must be selected', 'warning');
      return;
    }
    setPlaybookConfig(playbook.id, { audienceRoles: next });
  };

  const simulate = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      showToast(
        `Simulated as ${simulateAs} — all ${pipeline.length} steps green · pipeline ready for ${simulateAs} role`,
        'success',
      );
    }, 1400);
  };

  return (
    <div>
      <button
        onClick={() => navigate('/admin/workflows')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        All workflows
      </button>

      <div className="flex items-start gap-3 mb-1">
        <div className="w-10 h-10 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Workflow size={17} className="text-emerald-700 dark:text-emerald-300" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-text-muted mb-0.5">Workflow Studio · Playbook</div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{playbook.name}</h1>
            <StatusBadge status={adminCfg.status} />
            {adminCfg.pinnedToWorkbench && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase tracking-wider">
                <Pin size={9} /> Pinned to Workbench
              </span>
            )}
          </div>
          <span className="text-[11px] text-text-muted font-mono">
            @{playbook.id.replace(/-flow$/, '').replace(/-/g, '_')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted">
            As
            <select
              value={simulateAs}
              onChange={(e) => setSimulateAs(e.target.value)}
              className="px-1.5 py-1 text-[10px] bg-bg border border-border rounded text-text-primary focus:border-primary/40 focus:outline-none font-mono"
            >
              {SELLER_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          <button
            onClick={simulate}
            disabled={simulating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg/40 border border-border text-text-primary text-xs rounded-md hover:bg-surface-2 disabled:opacity-60 transition-colors"
          >
            {simulating ? <Sparkles size={12} className="animate-pulse" /> : <Eye size={12} />}
            {simulating ? 'Simulating…' : 'Simulate'}
          </button>
          <button
            onClick={togglePublish}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
              adminCfg.status === 'published'
                ? 'bg-bg/40 border border-border text-text-secondary hover:bg-surface-2'
                : 'bg-primary text-white hover:bg-primary-dim'
            }`}
          >
            <Upload size={12} />
            {adminCfg.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>
      <p className="text-sm text-text-secondary mt-3 mb-5 max-w-3xl leading-relaxed">
        {playbook.description}
      </p>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-5">
        {[
          { id: 'definition', label: 'Definition' },
          { id: 'publish', label: 'Publish & Audience' },
          { id: 'audience', label: 'Capability Overrides' },
          { id: 'runs', label: `Runs (${stats.total})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'text-primary border-primary'
                : 'text-text-muted border-transparent hover:text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'definition' && (
        <div className="space-y-4">
          <section>
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
              Triggers
            </div>
            <div className="space-y-1">
              {playbook.triggers?.map((t, i) => (
                <div key={i} className="text-xs text-text-secondary flex items-start gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                    {t.kind}
                  </span>
                  <span className="leading-relaxed">{t.detail}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                Pipeline · {pipeline.length} agents
              </div>
              <span className="text-[10px] text-text-muted">Linear · top → bottom</span>
            </div>
            <div className="space-y-2">
              {pipeline.map((node, idx) => (
                <div key={idx} className="relative">
                  <NodeRow
                    node={node}
                    audiencePolicies={audiencePolicies}
                    onChangeCapability={(c) => updateCapability(idx, c)}
                    onChangeAudienceOverride={updateAudienceOverride}
                  />
                  {idx < pipeline.length - 1 && (
                    <div className="flex items-center justify-center my-1">
                      <ChevronDown size={14} className="text-text-muted" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
              Delivery
            </div>
            <div className="text-xs text-text-secondary bg-surface border border-border rounded-md px-3 py-2">
              {playbook.delivery?.channel === 'slack-dm'
                ? 'Posted to AE\'s Slack DM as a channel-thread (also referenced in the account thread)'
                : playbook.delivery?.channel === 'thread'
                ? 'Posted as a turn in the originating thread'
                : 'Default delivery'}
            </div>
          </section>
        </div>
      )}

      {tab === 'publish' && (
        <div className="space-y-5">
          {/* Status section */}
          <section className="bg-surface border border-border rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                  Lifecycle status
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={adminCfg.status} />
                  <span className="text-xs text-text-secondary">
                    {adminCfg.status === 'published'
                      ? 'Sellers can discover and invoke this Playbook'
                      : 'Hidden from sellers — not invokable via @-mention or Workbench'}
                  </span>
                </div>
              </div>
              <button
                onClick={togglePublish}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                  adminCfg.status === 'published'
                    ? 'bg-bg/40 border border-border text-text-secondary hover:bg-surface-2'
                    : 'bg-primary text-white hover:bg-primary-dim'
                }`}
              >
                <Upload size={12} />
                {adminCfg.status === 'published' ? 'Revert to Draft' : 'Publish to sellers'}
              </button>
            </div>
            {adminCfg.firstPublishedAt && (
              <div className="text-[10px] text-text-muted mt-2">
                First published {new Date(adminCfg.firstPublishedAt).toLocaleString()}
              </div>
            )}
          </section>

          {/* Audience roles */}
          <section className="bg-surface border border-border rounded-md p-4">
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
              Audience · sales roles
            </div>
            <p className="text-xs text-text-secondary mb-3">
              Only sellers whose role is selected here will see this Playbook in
              @-autocomplete or the Plays tab.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {SELLER_ROLES.map((role) => {
                const active = adminCfg.audienceRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider border transition-colors ${
                      active
                        ? 'bg-primary/10 text-primary border-primary/40'
                        : 'bg-bg/40 text-text-muted border-border hover:text-text-secondary'
                    }`}
                  >
                    {active ? <CheckCircle2 size={11} className="inline mr-1" /> : null}
                    {role}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Pin to Workbench */}
          <section className="bg-surface border border-border rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                  Push to seller Workbench
                </div>
                <p className="text-xs text-text-secondary">
                  Pinned Playbooks appear as a tile on every targeted seller's Workbench home — the
                  single biggest driver of adoption for new capabilities.
                </p>
              </div>
              <button
                onClick={togglePin}
                disabled={adminCfg.status !== 'published'}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                  adminCfg.pinnedToWorkbench
                    ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15'
                    : 'bg-bg/40 border border-border text-text-secondary hover:bg-surface-2'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={adminCfg.status !== 'published' ? 'Publish first to pin' : ''}
              >
                {adminCfg.pinnedToWorkbench ? <PinOff size={12} /> : <Pin size={12} />}
                {adminCfg.pinnedToWorkbench ? 'Unpin from Workbench' : 'Pin to Workbench'}
              </button>
            </div>
          </section>
        </div>
      )}

      {tab === 'audience' && (
        <div className="space-y-3">
          <div className="text-xs text-text-secondary mb-3">
            Per-audience capability overrides apply to all agents in this Playbook
            for users matching the audience attributes. Overrides can only downgrade.
          </div>
          {audiencePolicies.length === 0 ? (
            <div className="border border-border rounded-md px-6 py-12 text-center text-sm text-text-muted">
              No audience policies — this Playbook applies its workflow capability to everyone.
            </div>
          ) : (
            audiencePolicies.map((p) => (
              <div key={p.key} className="bg-surface border border-border rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={13} className="text-text-muted" />
                  <span className="text-sm font-semibold text-text-primary">{p.label}</span>
                  <span className="text-[10px] text-text-muted font-mono ml-auto">
                    {Object.keys(p.overrides).length} override{Object.keys(p.overrides).length === 1 ? '' : 's'}
                  </span>
                </div>
                {Object.keys(p.overrides).length === 0 ? (
                  <div className="text-[11px] text-text-muted italic">
                    No overrides — this audience uses the workflow defaults.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(p.overrides).map(([agentId, override]) => {
                      const a = AGENTS[agentId];
                      return (
                        <div key={agentId} className="flex items-center gap-2 text-[11px]">
                          <Bot size={10} className="text-emerald-700 dark:text-emerald-300" />
                          <span className="text-text-secondary flex-1">{a?.label || agentId}</span>
                          <span className="text-text-muted">→</span>
                          <CapabilityChip tier={override} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'runs' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 mb-2">
            <div className="bg-surface border border-border rounded-md p-3">
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                Total runs
              </div>
              <div className="text-lg font-semibold text-text-primary">{stats.total}</div>
            </div>
            <div className="bg-surface border border-border rounded-md p-3">
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                Success rate
              </div>
              <div className="text-lg font-semibold text-text-primary">{stats.successRate}%</div>
            </div>
            <div className="bg-surface border border-border rounded-md p-3">
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                Avg duration
              </div>
              <div className="text-lg font-semibold text-text-primary">
                {(stats.avgMs / 1000).toFixed(1)}s
              </div>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-bg/40 text-text-muted">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Run</th>
                  <th className="text-left px-3 py-2 font-semibold">Invoked by</th>
                  <th className="text-left px-3 py-2 font-semibold">Surface</th>
                  <th className="text-left px-3 py-2 font-semibold">Target</th>
                  <th className="text-left px-3 py-2 font-semibold">Status</th>
                  <th className="text-right px-3 py-2 font-semibold">Duration</th>
                  <th className="text-right px-3 py-2 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-bg/40">
                    <td className="px-3 py-2 font-mono text-[10px] text-text-muted">{r.id}</td>
                    <td className="px-3 py-2 text-text-secondary">{r.invokedBy.name}</td>
                    <td className="px-3 py-2 text-text-secondary">{r.surface}</td>
                    <td className="px-3 py-2 text-text-secondary truncate max-w-[200px]">{r.target}</td>
                    <td className="px-3 py-2"><StatusDot status={r.status} /></td>
                    <td className="px-3 py-2 text-right text-text-secondary font-mono">
                      {(r.durationMs / 1000).toFixed(1)}s
                    </td>
                    <td className="px-3 py-2 text-right text-text-muted">{r.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function buildPlaybookConfigs(playbooks) {
  const out = {};
  for (const p of playbooks) {
    out[p.id] = getPlaybookConfig(p.id);
  }
  return out;
}

// ===== ROUTE =====
export default function WorkflowStudioRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const playbooks = listAgenticPlaybooks();
  const playbook = id ? findPlaybookById(id) : null;
  const [configs, setConfigs] = useState(() => buildPlaybookConfigs(playbooks));

  useEffect(() => {
    return subscribeAdminConfig(() => setConfigs(buildPlaybookConfigs(playbooks)));
  }, [playbooks]);

  const handleTogglePublish = useCallback(
    (playbookId, status) => {
      const p = playbooks.find((x) => x.id === playbookId);
      setPlaybookConfig(playbookId, { status });
      showToast(
        status === 'published'
          ? `${p?.name || 'Playbook'} published — sellers can now invoke it`
          : `${p?.name || 'Playbook'} reverted to draft`,
        status === 'published' ? 'success' : 'info',
      );
    },
    [playbooks, showToast],
  );

  const handleTogglePin = useCallback(
    (playbookId, pinnedToWorkbench) => {
      setPlaybookConfig(playbookId, { pinnedToWorkbench });
      showToast(
        pinnedToWorkbench
          ? 'Pinned to seller Workbench'
          : 'Removed from seller Workbench',
        'info',
      );
    },
    [showToast],
  );

  if (id && (!playbook || !playbook.pipeline)) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-8">
        <button
          onClick={() => navigate('/admin/workflows')}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
        >
          <ArrowLeft size={11} />
          All workflows
        </button>
        <div className="border border-warning/40 bg-warning/10 rounded-md p-6 flex items-start gap-3">
          <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h1 className="text-base font-semibold text-text-primary mb-1">Playbook not found</h1>
            <p className="text-sm text-text-secondary">No agentic Playbook with id "{id}".</p>
          </div>
        </div>
      </div>
    );
  }

  if (playbook) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-8">
        <PlaybookDetailView playbook={playbook} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Admin Hub
      </button>
      <div className="mb-2 text-xs text-text-muted">Platform & Ops · Workflows</div>
      <div className="flex items-end justify-between mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Workflow Studio</h1>
        <Link
          to="/admin/agents"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          Browse atomic agents
          <ExternalLink size={10} />
        </Link>
      </div>
      <p className="text-sm text-text-secondary mb-6 max-w-3xl">
        Compose Phoenix agents into Playbooks. Each step is a typed agent invocation;
        capability defaults can be downgraded per-audience. Sellers invoke published
        Playbooks via @-mention in any thread.
      </p>

      <PlaybookListView
        playbooks={playbooks}
        configs={configs}
        onTogglePublish={handleTogglePublish}
        onTogglePin={handleTogglePin}
      />
    </div>
  );
}
