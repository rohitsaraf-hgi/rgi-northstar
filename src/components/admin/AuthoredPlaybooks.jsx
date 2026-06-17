import { motion } from 'framer-motion';
import {
  Play,
  Cpu,
  GitBranch,
  Workflow,
  ListChecks,
  Plus,
  Edit3,
  TrendingUp,
  Minus,
  Pause,
  AlertTriangle,
  Users as UsersIcon,
  ExternalLink,
} from 'lucide-react';
import { AUTHORED_PLAYBOOKS, PLAYBOOK_TYPES } from '../../data/playbooks.js';
import { useToast } from '../../context/ToastContext.jsx';
import { usePlaybookDetail } from '../../context/PlaybookDetailContext.jsx';

const ICONS = {
  play: Play,
  cpu: Cpu,
  'git-branch': GitBranch,
  workflow: Workflow,
  'list-checks': ListChecks,
};

function StatusDot({ status }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-success/15 text-success rounded text-[10px] font-bold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-success" />
        Live
      </span>
    );
  }
  if (status === 'draft') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-text-muted/15 text-text-secondary rounded text-[10px] font-bold uppercase tracking-wider">
        <Pause size={9} />
        Draft
      </span>
    );
  }
  if (status === 'paused') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-warning/15 text-warning rounded text-[10px] font-bold uppercase tracking-wider">
        <Pause size={9} />
        Paused
      </span>
    );
  }
  return null;
}

function PerformanceTrend({ trend }) {
  if (trend === 'up') return <TrendingUp size={10} className="text-success flex-shrink-0" />;
  if (trend === 'down') return <TrendingUp size={10} className="text-danger flex-shrink-0 rotate-180" />;
  if (trend === 'flat') return <Minus size={10} className="text-text-muted flex-shrink-0" />;
  return null;
}

function PlaybookCard({ playbook, index }) {
  const cfg = PLAYBOOK_TYPES[playbook.type] || PLAYBOOK_TYPES['Sales Play'];
  const Icon = ICONS[cfg.icon] || Play;
  const { showToast } = useToast();
  const { open } = usePlaybookDetail();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => open(playbook.id)}
      className="bg-surface border border-border rounded-lg p-4 flex flex-col hover:border-primary/40 hover:shadow-card transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold ${cfg.bg} ${cfg.color}`}>
          <Icon size={10} />
          {cfg.label}
        </div>
        <StatusDot status={playbook.status} />
      </div>

      <h3 className="text-sm font-semibold text-text-primary mb-1.5 leading-tight">{playbook.name}</h3>
      <p className="text-xs text-text-secondary leading-relaxed mb-3 flex-1">{playbook.description}</p>

      {playbook.blockReason && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-warning/10 border border-warning/30 rounded text-[10px] text-warning mb-3">
          <AlertTriangle size={10} />
          {playbook.blockReason}
        </div>
      )}

      {playbook.status === 'live' && (
        <div className="grid grid-cols-2 gap-2 mb-3 pt-3 border-t border-border">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Runs / week</div>
            <div className="text-base font-semibold text-text-primary">{playbook.runsThisWeek}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold flex items-center gap-1">
              <UsersIcon size={9} />
              Active users
            </div>
            <div className="text-base font-semibold text-text-primary">{playbook.activeUsers}</div>
            {playbook.activeUserNames.length > 0 && (
              <div className="text-[10px] text-text-muted truncate">{playbook.activeUserNames.join(', ')}</div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-text-muted">
        <PerformanceTrend trend={playbook.performanceTrend} />
        <span className="flex-1 truncate">{playbook.performance}</span>
      </div>

      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
        <button
          onClick={(e) => {
            e.stopPropagation();
            open(playbook.id, 'summary');
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded transition-colors"
        >
          <ExternalLink size={11} />
          Open
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            open(playbook.id, 'usage');
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:bg-bg/40 hover:text-text-primary rounded transition-colors"
        >
          View usage
        </button>
        <span className="ml-auto text-[10px] text-text-muted">Edited {playbook.lastEdited}</span>
      </div>
    </motion.div>
  );
}

export default function AuthoredPlaybooks({ onBuildNew }) {
  const live = AUTHORED_PLAYBOOKS.filter((p) => p.status === 'live').length;
  const draft = AUTHORED_PLAYBOOKS.filter((p) => p.status === 'draft').length;
  const totalRuns = AUTHORED_PLAYBOOKS.reduce((sum, p) => sum + p.runsThisWeek, 0);
  const totalUsers = AUTHORED_PLAYBOOKS.reduce((sum, p) => sum + p.activeUsers, 0);

  return (
    <section className="px-8 py-6">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary">Playbooks Authored</h2>
        <button
          onClick={onBuildNew}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-primary-dim transition-colors"
        >
          <Plus size={14} />
          Build a Playbook
        </button>
      </div>
      <div className="text-xs text-text-secondary mb-4">
        Configurations you've built for the team to consume.{' '}
        <span className="text-text-primary font-medium">{live} live</span> · {draft} draft ·{' '}
        <span className="text-text-primary font-medium">{totalRuns}</span> runs this week across {totalUsers} users
      </div>

      <div className="grid grid-cols-3 gap-3">
        {AUTHORED_PLAYBOOKS.map((p, i) => (
          <PlaybookCard key={p.id} playbook={p} index={i} />
        ))}
      </div>
    </section>
  );
}
