import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Building2,
  Clock,
  UserPlus,
  FileStack,
  Info,
  Layers,
  FileText,
  Mail,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Sparkles,
  Cpu,
  Activity,
  Users as UsersIcon,
  TrendingUp,
  Star,
  Zap,
  Link2,
  MessageSquare,
  Hash,
  Terminal,
  ArrowRight,
} from 'lucide-react';
import StageProgress from '../shared/StageProgress.jsx';
import Avatar from '../shared/Avatar.jsx';
import { THREAD_ARTIFACTS, THREAD_TIMELINES, PARTICIPANT_PROFILES, ARTIFACT_TYPES } from '../../data/artifacts.js';
import { THREADS, CHANNEL_ORIGINS } from '../../data/threads.js';
import { CORE_SERVICES, USE_CASE_MODULE_MAP, MODULE_DEFINITIONS, moduleById } from '../../data/modules.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useDemo } from '../../context/DemoContext.jsx';
import { useModuleDetail } from '../../context/ModuleDetailContext.jsx';

const REF_ORIGIN_ICONS = {
  'message-square': MessageSquare,
  hash: Hash,
  terminal: Terminal,
};

const ARTIFACT_ICONS = {
  layers: Layers,
  'file-text': FileText,
  mail: Mail,
  'bar-chart-3': BarChart3,
  'check-circle-2': CheckCircle2,
  'clipboard-list': ClipboardList,
  sparkles: Sparkles,
};

function Section({ icon: Icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-5 py-3 hover:bg-surface/50 transition-colors"
      >
        <Icon size={13} className="text-text-muted" />
        <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {title}
        </span>
        {open ? (
          <ChevronDown size={13} className="text-text-muted" />
        ) : (
          <ChevronRight size={13} className="text-text-muted" />
        )}
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

export default function ContextRail({ thread, collaborative = false }) {
  const artifacts = THREAD_ARTIFACTS[thread.id] || [];
  const timeline = THREAD_TIMELINES[thread.id] || [];
  const { showToast } = useToast();

  return (
    <div className="h-full overflow-y-auto thin-scrollbar bg-surface/30 border-l border-border">
      <Section icon={Info} title="Thread Identity">
        <dl className="text-xs space-y-2.5">
          <div className="flex justify-between gap-3">
            <dt className="text-text-muted">Type</dt>
            <dd className="text-text-primary capitalize">{thread.type}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-text-muted">Use Case</dt>
            <dd className="text-text-primary text-right">{thread.useCase}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-text-muted">Created</dt>
            <dd className="text-text-primary">{thread.createdAt}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-text-muted">Last activity</dt>
            <dd className="text-text-primary text-right">{thread.lastActivity}</dd>
          </div>
          <div className="pt-2">
            <div className="text-text-muted mb-1.5">Stage</div>
            <StageProgress currentStage={thread.stage} useCaseId={thread.useCaseId} showLabels={false} />
            <div className="text-[10px] text-text-secondary mt-1.5 font-medium">{thread.stage}</div>
          </div>
        </dl>
        {thread.accounts?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-text-muted mb-2">
              <Building2 size={10} />
              <span>Associated</span>
            </div>
            <div className="space-y-1">
              {thread.accounts.map((a, i) => (
                <div key={i} className="text-xs text-text-primary truncate">{a}</div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section icon={FileStack} title="Artifact Trail">
        <div className="space-y-2">
          {artifacts.length === 0 && (
            <div className="text-xs text-text-muted">No artifacts yet</div>
          )}
          {artifacts.slice().reverse().map((a) => {
            const cfg = ARTIFACT_TYPES[a.type] || ARTIFACT_TYPES.BRIEF;
            const Icon = ARTIFACT_ICONS[cfg.icon] || FileText;
            return (
              <button
                key={a.id}
                onClick={() => showToast(`Opened "${a.name}"`, 'info')}
                className="w-full text-left p-2.5 bg-surface border border-border rounded-md hover:border-border-2 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={11} className={cfg.color} />
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {a.version && (
                    <span className="text-[10px] text-text-muted font-mono ml-auto">{a.version}</span>
                  )}
                </div>
                <div className="text-xs text-text-primary truncate">{a.name}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{a.timestamp}</div>
              </button>
            );
          })}
        </div>
      </Section>

      <ReferencedConversationsSection thread={thread} />

      <Section icon={Clock} title="Timeline" defaultOpen={false}>
        <div className="space-y-2.5">
          {timeline.length === 0 && (
            <div className="text-xs text-text-muted">No history yet</div>
          )}
          {timeline.map((t, i) => (
            <div key={i} className="text-xs">
              <div className="text-text-muted font-mono text-[10px]">{t.date}</div>
              <div className="text-text-primary leading-snug">{t.event}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={UserPlus} title="Participants">
        <div className="space-y-2">
          {thread.participants.map((pid, i) => {
            const p = PARTICIPANT_PROFILES[pid];
            if (!p) return null;
            const isOwner = pid === thread.owner;
            const isActive = collaborative && Math.random() > 0.4;
            return (
              <div key={pid} className="flex items-center gap-2.5 p-2 bg-surface border border-border rounded-md">
                <div className="relative">
                  <Avatar name={p.name} initials={p.initials} color={p.color} size={26} />
                  {collaborative && isActive && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full ring-2 ring-bg" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-primary truncate">{p.name}</div>
                  <div className="text-[10px] text-text-muted">
                    {isOwner ? 'Owner' : i === 1 ? 'Contributor' : 'Reviewer'}
                  </div>
                </div>
                {collaborative && isActive && (
                  <span className="text-[10px] text-success font-medium">Active</span>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={() => showToast('Invite flow would open here', 'info')}
          className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-border rounded-md text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
        >
          <UserPlus size={11} />
          Invite to Collaborate
        </button>
      </Section>

      <PoweredBySection thread={thread} />
    </div>
  );
}

const SERVICE_ICONS = {
  Building: Building2,
  Layers: Layers,
  Activity: Activity,
  Users: UsersIcon,
  TrendingUp: TrendingUp,
  Star: Star,
};

function PoweredBySection({ thread }) {
  const { config } = useDemo();
  const { open: openModuleModal } = useModuleDetail();
  const map = USE_CASE_MODULE_MAP[thread.useCaseId];

  // Compute which core services are active given owned modules.
  // A service is active if any owned module declares it.
  const ownedModulesObjs = MODULE_DEFINITIONS.filter((m) => config.modulesOwned.includes(m.id));
  const activeServices = new Set();
  for (const m of ownedModulesObjs) {
    for (const s of m.coreServices) activeServices.add(s);
  }
  // 'all' means full access — RGI Agents
  const hasAll = activeServices.has('all');

  // Compute which modules would unlock a given missing service
  const unlockerFor = (serviceId) => {
    const candidates = MODULE_DEFINITIONS.filter((m) => m.coreServices.includes(serviceId) && !config.modulesOwned.includes(m.id));
    return candidates[0] || null;
  };

  return (
    <Section icon={Zap} title="Powered By" defaultOpen={false}>
      <div className="space-y-1.5 text-xs">
        {CORE_SERVICES.map((s) => {
          const Icon = SERVICE_ICONS[s.icon] || Activity;
          const active = hasAll || activeServices.has(s.id);
          const unlocker = !active ? unlockerFor(s.id) : null;
          return (
            <div
              key={s.id}
              className={`flex items-start gap-2 px-2.5 py-2 border rounded-md ${
                active ? 'border-success/30 bg-success/5' : 'border-border bg-bg/40'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0 ${
                  active ? 'bg-success' : 'bg-text-muted/50'
                }`}
              />
              <Icon size={11} className={`mt-0.5 flex-shrink-0 ${active ? 'text-success' : 'text-text-muted'}`} />
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${active ? 'text-text-primary' : 'text-text-muted'}`}>{s.name}</div>
                <div className="text-[10px] text-text-muted truncate">
                  {active ? s.stat : unlocker ? `Requires ${unlocker.name}` : 'Module not in plan'}
                </div>
              </div>
              {!active && unlocker && (
                <button
                  onClick={() => openModuleModal(unlocker.id)}
                  className="text-[10px] text-primary hover:text-primary/80 flex-shrink-0 mt-0.5"
                >
                  Add
                </button>
              )}
            </div>
          );
        })}
      </div>
      {map && (
        <div className="mt-3 pt-3 border-t border-border text-[10px] text-text-muted leading-relaxed">
          This thread runs the {moduleLabelOrUnknown(map.stages[0])} → {moduleLabelOrUnknown(map.stages[2])} pipeline. Active services depend on which modules you own.
        </div>
      )}
    </Section>
  );
}

function moduleLabelOrUnknown(id) {
  if (!id) return 'platform';
  const m = moduleById(id);
  return m ? m.name : id;
}

// Referenced conversations — bidirectional links to other threads (often
// channel threads from Slack or Claude Code). Demonstrates that ambient
// conversations are first-class threads, referenceable from project work.
function ReferencedConversationsSection({ thread }) {
  const navigate = useNavigate();
  const refs = thread.references || [];
  if (refs.length === 0) return null;

  const refThreads = refs.map((id) => THREADS[id]).filter(Boolean);
  if (refThreads.length === 0) return null;

  return (
    <Section icon={Link2} title="Referenced conversations" defaultOpen={true}>
      <div className="space-y-1.5">
        {refThreads.map((rt) => {
          const isChannel = rt.type === 'channel';
          const originCfg = isChannel ? CHANNEL_ORIGINS[rt.origin] : null;
          const Icon = isChannel
            ? (originCfg && REF_ORIGIN_ICONS[originCfg.icon]) || MessageSquare
            : Link2;
          return (
            <button
              key={rt.id}
              onClick={() => navigate(`/thread/${rt.id}`)}
              className="w-full text-left px-2.5 py-2 bg-surface border border-border/60 rounded-md hover:border-border-2 transition-colors group"
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon
                  size={11}
                  className={isChannel ? 'text-text-secondary' : 'text-text-muted'}
                />
                {originCfg && (
                  <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted">
                    {originCfg.label}
                  </span>
                )}
                {!isChannel && (
                  <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted">
                    Project thread
                  </span>
                )}
                <ArrowRight
                  size={9}
                  className="text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="text-xs text-text-primary truncate">{rt.name}</div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">{rt.lastActivity}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-[10px] text-text-muted leading-relaxed">
        These threads carry related context. The platform owns the full history; channels are projections.
      </div>
    </Section>
  );
}
