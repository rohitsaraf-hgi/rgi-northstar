import {
  Share2,
  UserPlus,
  Briefcase,
  Target,
  Cpu,
  Settings,
  MessageSquare,
  Hash,
  Terminal,
} from 'lucide-react';
import StatusBadge from '../shared/StatusBadge.jsx';
import StageProgress from '../shared/StageProgress.jsx';
import Avatar from '../shared/Avatar.jsx';
import { PARTICIPANT_PROFILES } from '../../data/artifacts.js';
import { CHANNEL_ORIGINS } from '../../data/threads.js';
import { useToast } from '../../context/ToastContext.jsx';

const TYPE_ICONS = {
  deal: Briefcase,
  campaign: Target,
  model: Cpu,
  config: Settings,
  channel: MessageSquare,
};

const ORIGIN_ICONS = {
  'message-square': MessageSquare,
  hash: Hash,
  terminal: Terminal,
};

export default function ThreadHeader({ thread, onPromote }) {
  const isChannel = thread.type === 'channel';
  const originCfg = isChannel ? CHANNEL_ORIGINS[thread.origin] : null;
  const Icon = isChannel
    ? (originCfg && ORIGIN_ICONS[originCfg.icon]) || MessageSquare
    : TYPE_ICONS[thread.type] || Briefcase;
  const { showToast } = useToast();

  return (
    <div className="border-b border-border/60 px-6 py-3.5 bg-bg/95 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Icon size={15} className="text-text-muted flex-shrink-0" />
        <h1 className="text-base font-semibold text-text-primary tracking-tight flex-1 min-w-0 truncate">
          {thread.name}
        </h1>

        {isChannel && originCfg && (
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-bg/40 border border-border/60 rounded text-text-muted font-bold">
            {originCfg.label}
          </span>
        )}

        {!isChannel && (
          <StageProgress
            currentStage={thread.stage}
            useCaseId={thread.useCaseId}
            showLabels={false}
          />
        )}

        <StatusBadge status={thread.status} />

        <div className="flex -space-x-1.5">
          {thread.participants.slice(0, 4).map((pid) => {
            const p = PARTICIPANT_PROFILES[pid];
            if (!p) return null;
            return (
              <Avatar
                key={pid}
                name={p.name}
                initials={p.initials}
                color={p.color}
                size={20}
                ring
              />
            );
          })}
        </div>

        <button
          onClick={() => showToast('Link copied to clipboard')}
          className="p-1.5 rounded-md hover:bg-surface text-text-muted hover:text-text-secondary transition-colors"
          title="Share"
        >
          <Share2 size={13} />
        </button>
        {!isChannel && (
          <button
            onClick={onPromote}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-secondary hover:bg-surface hover:text-text-primary rounded-md transition-colors"
            title="Promote to Collaborative Workspace"
          >
            <UserPlus size={11} />
            Collaborate
          </button>
        )}
      </div>
    </div>
  );
}
