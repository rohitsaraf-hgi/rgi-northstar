import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Maximize2,
  Pause,
  Play as PlayIcon,
  Edit3,
  Copy,
  Archive,
  Sparkles,
  TrendingUp,
  Users as UsersIcon,
  Workflow,
  Cpu,
  GitBranch,
  Play,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Database,
  Filter,
  Zap,
  Mail,
  Activity,
} from 'lucide-react';
import { usePlaybookDetail } from '../../context/PlaybookDetailContext.jsx';
import { findPlaybookById, PLAYBOOK_TYPES } from '../../data/playbooks.js';
import { useToast } from '../../context/ToastContext.jsx';
import Avatar from '../shared/Avatar.jsx';

const TYPE_ICONS = {
  play: Play,
  cpu: Cpu,
  'git-branch': GitBranch,
  workflow: Workflow,
  'list-checks': ListChecks,
};

const TRIGGER_ICONS = {
  install: Database,
  icp: Filter,
  signal: Zap,
  inbound: Activity,
  'on-demand': PlayIcon,
  static: ListChecks,
};

const ACTION_ICONS = {
  draft: Mail,
  enrich: Sparkles,
  route: GitBranch,
  score: Cpu,
  explain: TrendingUp,
  notify: Activity,
  export: ChevronRight,
  tag: ListChecks,
};

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'usage', label: 'Usage' },
  { id: 'performance', label: 'Performance' },
  { id: 'versions', label: 'Versions' },
];

function StatusPill({ status }) {
  const styles = {
    live: 'bg-success/15 text-success',
    draft: 'bg-text-muted/15 text-text-secondary',
    paused: 'bg-warning/15 text-warning',
    archived: 'bg-text-muted/15 text-text-muted',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>
      {status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-success" />}
      {status === 'paused' && <Pause size={9} />}
      {status === 'draft' && <Pause size={9} />}
      {status}
    </span>
  );
}

function PlaybookHeader({ playbook, onClose, onLifecycleAction }) {
  const cfg = PLAYBOOK_TYPES[playbook.type];
  const Icon = TYPE_ICONS[cfg.icon] || Play;
  const { showToast } = useToast();

  return (
    <div className="border-b border-border">
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-md ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={18} className={cfg.color} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-text-primary truncate">{playbook.name}</h2>
              <StatusPill status={playbook.status} />
            </div>
            <div className="text-xs text-text-secondary">
              <span className={cfg.color + ' font-medium'}>{cfg.label}</span>
              {' · '}
              <span>Built by {playbook.builtBy.name}</span>
              {' · '}
              <span>Last edited {playbook.lastEdited}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => showToast('Pop-out to full page would open here', 'info')}
            className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-secondary transition-colors"
            title="Open in full page"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {(playbook.blockReason || playbook.pausedReason) && (
        <div className={`mx-5 mb-3 px-3 py-2 rounded-md flex items-start gap-2 text-xs ${
          playbook.status === 'paused'
            ? 'bg-warning/10 border border-warning/30'
            : 'bg-warning/10 border border-warning/30'
        }`}>
          <AlertTriangle size={12} className="text-warning mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-warning font-semibold mb-0.5">
              {playbook.status === 'paused' ? 'Paused' : 'Blocked'}
            </div>
            <div className="text-text-secondary">
              {playbook.pausedReason || playbook.blockReason}
              {playbook.pausedAt && <span className="text-text-muted"> · {playbook.pausedAt}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Lifecycle actions */}
      <div className="px-5 pb-3 flex items-center gap-1.5">
        <button
          onClick={() => onLifecycleAction('edit')}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-primary-dim transition-colors"
        >
          <Edit3 size={11} />
          Edit
        </button>
        {playbook.status === 'live' && (
          <button
            onClick={() => onLifecycleAction('pause')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-border rounded-md text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
          >
            <Pause size={11} />
            Pause
          </button>
        )}
        {playbook.status === 'paused' && (
          <button
            onClick={() => onLifecycleAction('resume')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-success/40 text-success rounded-md hover:bg-success/10 transition-colors"
          >
            <PlayIcon size={11} />
            Resume
          </button>
        )}
        {playbook.status === 'draft' && (
          <button
            onClick={() => onLifecycleAction('publish')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-success/40 text-success rounded-md hover:bg-success/10 transition-colors"
          >
            <CheckCircle2 size={11} />
            Publish
          </button>
        )}
        <button
          onClick={() => onLifecycleAction('duplicate')}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-border rounded-md text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
        >
          <Copy size={11} />
          Duplicate
        </button>
        <button
          onClick={() => onLifecycleAction('archive')}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-border rounded-md text-text-muted hover:bg-surface-2 hover:text-danger transition-colors ml-auto"
        >
          <Archive size={11} />
          Archive
        </button>
      </div>
    </div>
  );
}

function ImpactStat({ label, value, accent }) {
  const tone = accent === 'success' ? 'text-success' : accent === 'warning' ? 'text-warning' : 'text-text-primary';
  return (
    <div className="bg-bg/40 border border-border rounded-md p-3">
      <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">{label}</div>
      <div className={`text-lg font-semibold tracking-tight ${tone}`}>{value}</div>
    </div>
  );
}

function SummaryTab({ playbook }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary leading-relaxed">{playbook.description}</p>

      {/* Impact summary — the cross-persona value */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
          Cross-persona impact
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ImpactStat label="Runs / week" value={playbook.impact.totalRuns} />
          {playbook.impact.totalPipeline !== '—' && (
            <ImpactStat label="Pipeline influenced" value={playbook.impact.totalPipeline} accent="success" />
          )}
          {playbook.impact.totalDeals > 0 && (
            <ImpactStat label="Deals influenced" value={playbook.impact.totalDeals} />
          )}
          {playbook.impact.replyRate !== '—' && playbook.impact.replyRate !== 'N/A' && (
            <ImpactStat label="Reply rate" value={playbook.impact.replyRate} accent="success" />
          )}
        </div>
        {playbook.impact.vsBaseline && (
          <div className="mt-2 px-3 py-2 bg-success/8 border border-success/20 rounded-md text-xs text-text-secondary flex items-center gap-2">
            <TrendingUp size={11} className="text-success" />
            {playbook.impact.vsBaseline}
          </div>
        )}
      </div>

      {/* Triggers */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
          Triggers
        </div>
        <div className="space-y-1.5">
          {playbook.triggers.map((t, i) => {
            const Icon = TRIGGER_ICONS[t.kind] || Database;
            return (
              <div key={i} className="border border-border rounded-md p-2.5 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded bg-bg/40 flex items-center justify-center flex-shrink-0">
                  <Icon size={12} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">{t.kind}</div>
                  <div className="text-xs text-text-primary mt-0.5">{t.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
          Actions
        </div>
        <div className="space-y-1.5">
          {playbook.actions.map((a, i) => {
            const Icon = ACTION_ICONS[a.kind] || Sparkles;
            return (
              <div key={i} className="border border-border rounded-md p-2.5 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={12} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">{a.kind}</div>
                  <div className="text-xs text-text-primary mt-0.5">{a.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-bg/40 border border-border rounded-md p-3 text-xs">
        <div className="flex items-center gap-1.5 text-text-muted mb-1">
          <UsersIcon size={11} />
          <span className="uppercase tracking-wider font-semibold text-[10px]">Audience</span>
        </div>
        <div className="text-text-primary">{playbook.audience}</div>
      </div>
    </div>
  );
}

function UsageTab({ playbook }) {
  if (playbook.usageByUser.length === 0) {
    return (
      <div className="text-center py-12 text-xs text-text-muted">
        No usage data yet — playbook hasn't been activated.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="text-xs text-text-secondary">
        How sellers and strategists are consuming this playbook. Cross-persona impact is the admin's measurable contribution.
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        {playbook.usageByUser.map((u, i) => (
          <div
            key={i}
            className={`px-3 py-3 flex items-center gap-3 ${
              i < playbook.usageByUser.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <Avatar name={u.name} initials={u.initials} color={u.color} size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary">{u.name}</div>
              <div className="text-[10px] text-text-muted">
                {u.role}
                {u.usageNote && <span> · {u.usageNote}</span>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-right">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-text-muted">Runs</div>
                <div className="text-sm font-mono text-text-primary">{u.runs}</div>
              </div>
              {u.deals > 0 && (
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-text-muted">Deals</div>
                  <div className="text-sm font-mono text-text-primary">{u.deals}</div>
                </div>
              )}
              {u.pipeline !== '—' && (
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-text-muted">Pipeline</div>
                  <div className="text-sm font-mono text-success">{u.pipeline}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-3 bg-primary/5 border border-primary/20 rounded-md">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={12} className="text-primary" />
          <span className="text-xs font-semibold text-primary">Your contribution</span>
        </div>
        <div className="text-xs text-text-secondary leading-relaxed">
          You authored this playbook. {playbook.usageByUser.filter((u) => u.runs > 0).length} people are running it,
          generating <span className="text-text-primary font-medium">{playbook.impact.totalRuns} runs/week</span>
          {playbook.impact.totalPipeline !== '—' && (
            <> and influencing <span className="text-success font-medium">{playbook.impact.totalPipeline}</span> in pipeline</>
          )}.
        </div>
      </div>
    </div>
  );
}

function PerformanceTab({ playbook }) {
  if (playbook.performanceHistory.length === 0) {
    return (
      <div className="text-center py-12 text-xs text-text-muted">
        No performance history yet.
      </div>
    );
  }
  const maxRuns = Math.max(...playbook.performanceHistory.map((p) => p.runs));
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
          Runs over time
        </div>
        <div className="border border-border rounded-md p-3 space-y-2">
          {playbook.performanceHistory.map((p) => (
            <div key={p.period} className="flex items-center gap-2 text-xs">
              <span className="w-12 text-text-muted font-mono">{p.period}</span>
              <div className="flex-1 h-5 bg-bg/40 rounded relative overflow-hidden">
                <div
                  className="h-full bg-primary/70 rounded transition-all"
                  style={{ width: `${maxRuns ? (p.runs / maxRuns) * 100 : 0}%` }}
                />
                <div className="absolute inset-0 flex items-center px-2 text-[10px] font-mono text-text-primary">
                  {p.runs} runs
                </div>
              </div>
              {p.replyRate > 0 && (
                <span className="text-[10px] text-success font-mono w-20 text-right">{p.replyRate}% reply</span>
              )}
              {p.precision != null && (
                <span className="text-[10px] text-success font-mono w-20 text-right">P {(p.precision / 100).toFixed(2)}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-bg/40 border border-border rounded-md p-3 text-xs space-y-2">
        <div className="text-text-muted uppercase tracking-wider text-[10px] font-semibold">Headline metrics</div>
        <div className="text-text-primary leading-relaxed">{playbook.performance}</div>
        {playbook.impact.vsBaseline && (
          <div className="text-success text-[11px] flex items-center gap-1">
            <TrendingUp size={10} />
            {playbook.impact.vsBaseline}
          </div>
        )}
      </div>
    </div>
  );
}

function VersionsTab({ playbook }) {
  return (
    <div className="space-y-2">
      {playbook.versions.map((v, i) => (
        <div
          key={i}
          className={`border rounded-md p-3 ${
            v.current ? 'border-primary/40 bg-primary/5' : 'border-border'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono font-semibold ${v.current ? 'text-primary' : 'text-text-primary'}`}>
                {v.version}
              </span>
              {v.current && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0 bg-primary/15 text-primary rounded font-bold">
                  Current
                </span>
              )}
            </div>
            <span className="text-[10px] text-text-muted font-mono">{v.date}</span>
          </div>
          <div className="text-xs text-text-secondary leading-relaxed">{v.summary}</div>
          <div className="text-[10px] text-text-muted mt-1">by {v.author}</div>
        </div>
      ))}
    </div>
  );
}

export default function PlaybookDetailDrawer() {
  const { openId, tab, setTab, close } = usePlaybookDetail();
  const playbook = openId ? findPlaybookById(openId) : null;
  const { showToast } = useToast();

  const handleLifecycle = (action) => {
    const verbs = {
      edit: 'Opening editor for',
      pause: 'Paused',
      resume: 'Resumed',
      publish: 'Published',
      duplicate: 'Duplicated',
      archive: 'Archived',
    };
    showToast(`${verbs[action] || action}: ${playbook.name}`);
  };

  return (
    <AnimatePresence>
      {playbook && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={close}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-[560px] bg-bg border-l border-border z-50 flex flex-col shadow-elev"
          >
            <PlaybookHeader playbook={playbook} onClose={close} onLifecycleAction={handleLifecycle} />

            <div className="border-b border-border px-5">
              <div className="flex items-center gap-1 overflow-x-auto">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-3 py-2.5 text-xs transition-colors border-b-2 -mb-px font-medium whitespace-nowrap ${
                      tab === t.id
                        ? 'text-text-primary border-primary'
                        : 'text-text-secondary border-transparent hover:text-text-primary'
                    }`}
                  >
                    {t.label}
                    {t.id === 'usage' && playbook.usageByUser.length > 0 && (
                      <span className="ml-1 text-[9px] px-1 py-0 bg-primary/15 text-primary rounded font-bold">
                        {playbook.usageByUser.filter((u) => u.runs > 0).length}
                      </span>
                    )}
                    {t.id === 'versions' && playbook.versions.length > 0 && (
                      <span className="ml-1 text-[9px] px-1 py-0 bg-text-muted/15 text-text-muted rounded">
                        {playbook.versions.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto thin-scrollbar p-5">
              {tab === 'summary' && <SummaryTab playbook={playbook} />}
              {tab === 'usage' && <UsageTab playbook={playbook} />}
              {tab === 'performance' && <PerformanceTab playbook={playbook} />}
              {tab === 'versions' && <VersionsTab playbook={playbook} />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
