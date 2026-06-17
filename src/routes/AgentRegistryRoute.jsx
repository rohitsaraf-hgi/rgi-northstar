import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  ShieldCheck,
  ArrowLeft,
  Network,
  Target,
  Cpu,
  BarChart3,
  Users,
  FileSearch,
  Mail,
  MessageSquare,
  FileText,
  UserPlus,
  Calendar,
  Handshake,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  BookOpen,
} from 'lucide-react';
import { AGENTS, AGENTS_BY_CATEGORY, AGENT_CATEGORIES, CAPABILITY_TIERS } from '../data/agents.js';
import { listAgenticPlaybooks } from '../data/playbooks.js';
import { moduleLabel } from '../data/modules.js';
import { getAgentConfig, setAgentConfig, subscribeAdminConfig } from '../data/adminConfig.js';
import { useToast } from '../context/ToastContext.jsx';

// Map agent.icon string → lucide component. Lucide doesn't ship a LinkedIn
// brand icon, so we use UserPlus for the LinkedIn connect agent.
const ICON_MAP = {
  Network, Target, Cpu, BarChart3, Users, FileSearch, Mail, MessageSquare,
  FileText, Linkedin: UserPlus, UserPlus, Calendar, Handshake, TrendingUp, Sparkles, Bot,
  BookOpen,
};

// Capability cap selector — admin can only downgrade from the agent ceiling.
const TIER_ORDER = ['suggest', 'draft', 'act'];
function allowedCaps(ceiling) {
  const ceilingIdx = TIER_ORDER.indexOf(ceiling);
  return TIER_ORDER.slice(0, ceilingIdx + 1);
}

function CapabilityChip({ tier }) {
  const cfg = CAPABILITY_TIERS[tier];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <ShieldCheck size={9} />
      {cfg.label}
    </span>
  );
}

function AgentCard({ agent, usedIn, config, onChangeVisible, onChangeCap }) {
  const Icon = ICON_MAP[agent.icon] || Bot;
  const cat = AGENT_CATEGORIES[agent.category];
  const caps = allowedCaps(agent.ceiling);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-surface border rounded-md p-4 transition-colors ${
        config.sellerVisible ? 'border-border hover:border-border-2' : 'border-border opacity-70'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-md ${cat.bg} flex items-center justify-center`}>
            <Icon size={13} className={cat.color} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary leading-tight">{agent.label}</h3>
            <span className="text-[10px] text-text-muted font-mono">@{agent.id}</span>
          </div>
        </div>
        <CapabilityChip tier={agent.ceiling} />
      </div>
      <p className="text-xs text-text-secondary leading-relaxed mb-3">{agent.desc}</p>

      <div className="flex flex-wrap gap-1 mb-2">
        <span className="text-[10px] uppercase tracking-wider text-text-muted">Module:</span>
        <span className="text-[10px] text-text-secondary font-medium">{moduleLabel(agent.requiredModule)}</span>
      </div>

      {agent.writeScope?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">Write scope:</span>
          {agent.writeScope.map((s) => (
            <span
              key={s}
              className="text-[10px] font-mono text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1 py-0.5 rounded"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Admin controls */}
      <div className="border-t border-border pt-3 mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChangeVisible(!config.sellerVisible)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider border transition-colors ${
            config.sellerVisible
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15'
              : 'bg-bg/40 text-text-muted border-border hover:text-text-secondary'
          }`}
          title={config.sellerVisible ? 'Visible to sellers — click to hide' : 'Hidden from sellers — click to show'}
        >
          {config.sellerVisible ? <Eye size={10} /> : <EyeOff size={10} />}
          {config.sellerVisible ? 'Seller visible' : 'Hidden'}
        </button>
        <label className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
          Cap:
          <select
            value={config.capabilityCap}
            onChange={(e) => onChangeCap(e.target.value)}
            className="flex-1 px-1.5 py-1 text-[10px] bg-bg border border-border rounded text-text-primary focus:border-primary/40 focus:outline-none font-mono"
            title={`Cap can downgrade — max is ${agent.ceiling.toUpperCase()}`}
          >
            {caps.map((c) => (
              <option key={c} value={c}>
                {CAPABILITY_TIERS[c]?.label || c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {usedIn.length > 0 && (
        <div className="border-t border-border pt-2 mt-2">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">
            Used in {usedIn.length} playbook{usedIn.length === 1 ? '' : 's'}
          </div>
          <div className="flex flex-wrap gap-1">
            {usedIn.map((p) => (
              <span key={p.id} className="text-[10px] text-text-secondary bg-bg/40 border border-border px-1.5 py-0.5 rounded">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function CategorySection({ categoryKey, agentIds, agenticPlaybooks, configs, onChangeVisible, onChangeCap }) {
  const cfg = AGENT_CATEGORIES[categoryKey];
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">{cfg.label}</h2>
        <span className="text-text-muted font-normal text-xs">{agentIds.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {agentIds.map((id) => {
          const agent = AGENTS[id];
          const usedIn = agenticPlaybooks.filter((p) => p.pipeline.some((n) => n.agent === id));
          const cfg = configs[id] || { sellerVisible: true, capabilityCap: agent.ceiling };
          return (
            <AgentCard
              key={id}
              agent={agent}
              usedIn={usedIn}
              config={cfg}
              onChangeVisible={(v) => onChangeVisible(id, v)}
              onChangeCap={(c) => onChangeCap(id, c)}
            />
          );
        })}
      </div>
    </section>
  );
}

function buildConfigs() {
  const out = {};
  for (const id of Object.keys(AGENTS)) {
    out[id] = getAgentConfig(id);
  }
  return out;
}

export default function AgentRegistryRoute() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const playbooks = listAgenticPlaybooks();
  const [configs, setConfigs] = useState(buildConfigs);

  useEffect(() => {
    return subscribeAdminConfig(() => setConfigs(buildConfigs()));
  }, []);

  const handleVisible = useCallback(
    (id, sellerVisible) => {
      setAgentConfig(id, { sellerVisible });
      showToast(
        sellerVisible
          ? `${AGENTS[id]?.label} now visible to sellers`
          : `${AGENTS[id]?.label} hidden from sellers`,
        'info',
      );
    },
    [showToast],
  );

  const handleCap = useCallback(
    (id, capabilityCap) => {
      setAgentConfig(id, { capabilityCap });
      showToast(
        `${AGENTS[id]?.label} capability capped at ${capabilityCap.toUpperCase()}`,
        'info',
      );
    },
    [showToast],
  );

  const visibleCount = Object.values(configs).filter((c) => c.sellerVisible).length;
  const totalCount = Object.keys(AGENTS).length;

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Admin Hub
      </button>
      <div className="mb-2 text-xs text-text-muted">Platform & Ops · Agents</div>
      <div className="flex items-end justify-between mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Agent Registry</h1>
        <div className="text-[11px] text-text-muted">
          <span className="text-text-primary font-semibold">{visibleCount}</span> of {totalCount} visible to sellers
        </div>
      </div>
      <p className="text-sm text-text-secondary mb-6 max-w-3xl">
        Phoenix atomic agents — the building blocks RevOps composes into Playbooks.
        Toggle <span className="font-semibold text-text-primary">Seller visible</span> to control which agents
        appear in seller @-autocomplete. Cap downgrades the ceiling for all invocations of that agent.
      </p>

      <CategorySection
        categoryKey="data"
        agentIds={AGENTS_BY_CATEGORY.data}
        agenticPlaybooks={playbooks}
        configs={configs}
        onChangeVisible={handleVisible}
        onChangeCap={handleCap}
      />
      <CategorySection
        categoryKey="research"
        agentIds={AGENTS_BY_CATEGORY.research}
        agenticPlaybooks={playbooks}
        configs={configs}
        onChangeVisible={handleVisible}
        onChangeCap={handleCap}
      />
      <CategorySection
        categoryKey="content"
        agentIds={AGENTS_BY_CATEGORY.content}
        agenticPlaybooks={playbooks}
        configs={configs}
        onChangeVisible={handleVisible}
        onChangeCap={handleCap}
      />
      <CategorySection
        categoryKey="workflow"
        agentIds={AGENTS_BY_CATEGORY.workflow}
        agenticPlaybooks={playbooks}
        configs={configs}
        onChangeVisible={handleVisible}
        onChangeCap={handleCap}
      />

      <div className="border-t border-border pt-4 mt-2 flex items-center gap-2 text-xs text-text-muted">
        <Sparkles size={11} />
        Compose into Playbooks in
        <button
          onClick={() => navigate('/admin/workflows')}
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          Workflow Studio
          <ExternalLink size={9} />
        </button>
      </div>
    </div>
  );
}
