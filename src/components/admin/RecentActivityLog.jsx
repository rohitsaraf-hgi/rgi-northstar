import { Activity, ListChecks, Cpu, GitBranch, Plug, Users, Workflow } from 'lucide-react';
import Avatar from '../shared/Avatar.jsx';
import { RECENT_ACTIVITY } from '../../data/playbooks.js';

const TARGET_ICONS = {
  list: ListChecks,
  model: Cpu,
  config: GitBranch,
  integration: Plug,
  users: Users,
  playbook: Workflow,
};

const ACTION_TONES = {
  pinned: 'text-text-secondary',
  published: 'text-success',
  approved: 'text-success',
  flagged: 'text-warning',
  invited: 'text-primary',
  'requested approval': 'text-primary',
  edited: 'text-text-secondary',
};

export default function RecentActivityLog() {
  return (
    <section className="px-8 py-6">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={14} className="text-text-secondary" />
        <h2 className="text-sm font-semibold text-text-primary">Recent Activity</h2>
        <span className="text-xs text-text-muted">· what's happening across the org</span>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {RECENT_ACTIVITY.map((a, i) => {
          const Icon = TARGET_ICONS[a.targetType] || Activity;
          const actionTone = ACTION_TONES[a.action] || 'text-text-secondary';
          return (
            <div
              key={a.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < RECENT_ACTIVITY.length - 1 ? 'border-b border-border' : ''
              } hover:bg-bg/40 transition-colors`}
            >
              <Avatar
                name={a.actor}
                initials={a.actorInitials}
                color={a.actorColor}
                size={26}
              />
              <div className="flex-1 min-w-0 flex items-center gap-2 text-xs">
                <span className="text-text-primary font-medium">{a.actor}</span>
                <span className={actionTone}>{a.action}</span>
                <Icon size={11} className="text-text-muted flex-shrink-0" />
                <span className="text-text-primary truncate">{a.target}</span>
              </div>
              <div className="text-[10px] text-text-muted whitespace-nowrap">{a.timestamp}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
