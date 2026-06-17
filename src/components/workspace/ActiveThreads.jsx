import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Briefcase, Target, Cpu, Settings, ArrowRight } from 'lucide-react';
import { usePersona } from '../../context/PersonaContext.jsx';
import { THREADS, WORKSPACE_THREADS, STATUS_BADGES } from '../../data/threads.js';
import StageProgress from '../shared/StageProgress.jsx';

const TYPE_ICONS = {
  deal: Briefcase,
  campaign: Target,
  model: Cpu,
  config: Settings,
};

// Threads only get a status indicator if status is "important" — otherwise
// quiet. Reduces color competition.
const URGENT_STATUSES = new Set(['NEEDS_INPUT', 'ACTION_REQUIRED', 'BLOCKED']);

export default function ActiveThreads({ onNewThread }) {
  const navigate = useNavigate();
  const { personaId } = usePersona();
  const ids = WORKSPACE_THREADS[personaId] || [];

  return (
    <section className="px-8 py-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Active Threads</h2>
        <button
          onClick={onNewThread}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 rounded-md transition-colors"
        >
          <Plus size={12} />
          New thread
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ids.map((id, i) => {
          const t = THREADS[id];
          if (!t) return null;
          const Icon = TYPE_ICONS[t.type] || Briefcase;
          const isUrgent = URGENT_STATUSES.has(t.status);
          const statusCfg = STATUS_BADGES[t.status];
          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/thread/${id}`)}
              className="group relative bg-surface border border-border rounded-md p-4 text-left hover:border-border-2 hover:shadow-card transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon size={13} className="text-text-muted flex-shrink-0" />
                  <h3 className="text-sm font-medium text-text-primary truncate">{t.name}</h3>
                </div>
                {isUrgent && statusCfg && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${statusCfg.dot}`} title={statusCfg.label} />
                )}
              </div>

              <div className="text-xs text-text-muted mb-3 truncate">{t.lastActivity}</div>

              <div className="flex items-center justify-between">
                <StageProgress currentStage={t.stage} useCaseId={t.useCaseId} showLabels={false} />
                <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Open <ArrowRight size={10} />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
