import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Hash, Terminal, ArrowRight } from 'lucide-react';
import { usePersona } from '../context/PersonaContext.jsx';
import { THREADS, SIDEBAR_CHANNELS, CHANNEL_ORIGINS } from '../data/threads.js';

const ICONS = {
  'message-square': MessageSquare,
  hash: Hash,
  terminal: Terminal,
};

const ORIGIN_GROUPS = [
  { id: 'slack-dm', label: 'Slack — Direct messages' },
  { id: 'slack-channel', label: 'Slack — Channels' },
  { id: 'mcp-session', label: 'Claude Code — Sessions' },
];

function ChannelCard({ thread, onOpen }) {
  const originCfg = CHANNEL_ORIGINS[thread.origin];
  const Icon = (originCfg && ICONS[originCfg.icon]) || MessageSquare;
  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(thread.id)}
      className="text-left w-full px-4 py-3 border border-border/60 rounded-md bg-surface hover:border-border-2 hover:shadow-card transition-all group"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={13} className="text-text-muted flex-shrink-0" />
        <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted">
          {originCfg?.label || 'Channel'}
        </span>
        {thread.channelLabel && thread.channelLabel !== originCfg?.label && (
          <span className="text-[10px] text-text-muted">· {thread.channelLabel}</span>
        )}
        <ArrowRight
          size={11}
          className="text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
      <div className="text-sm font-medium text-text-primary mb-0.5 truncate">{thread.name}</div>
      <div className="text-xs text-text-muted truncate mb-1.5">{thread.lastActivity}</div>
      <div className="text-xs text-text-secondary leading-snug line-clamp-2">{thread.summary}</div>
    </motion.button>
  );
}

export default function ChannelsRoute() {
  const { personaId, persona } = usePersona();
  const navigate = useNavigate();
  const channelIds = SIDEBAR_CHANNELS[personaId] || [];

  // Group by origin
  const grouped = ORIGIN_GROUPS.map((g) => ({
    ...g,
    threads: channelIds
      .map((id) => THREADS[id])
      .filter((t) => t && t.origin === g.id),
  })).filter((g) => g.threads.length > 0);

  const handleOpen = (id) => navigate(`/thread/${id}`);

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <div className="mb-2 text-xs text-text-muted">Workspace · Channels</div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Channels</h1>
      <p className="text-sm text-text-secondary mb-6 max-w-2xl">
        Slack DMs, channel mentions, and Claude Code sessions stored as first-class threads. Same data shape as project threads — searchable, referenceable, and authoritative. The platform owns the history; the channels are projections.
      </p>

      {channelIds.length === 0 ? (
        <div className="border border-border/60 rounded-md px-6 py-12 text-center text-sm text-text-muted">
          No channel threads yet for {persona.name.split(' ')[0]}. Connect Slack or run a Claude Code session targeting your workspace to populate this view.
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.id}>
              <h2 className="text-sm font-semibold text-text-primary mb-3">
                {group.label}
                <span className="text-text-muted font-normal ml-2">{group.threads.length}</span>
              </h2>
              <div className="space-y-2">
                {group.threads.map((t) => (
                  <ChannelCard key={t.id} thread={t} onOpen={handleOpen} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
