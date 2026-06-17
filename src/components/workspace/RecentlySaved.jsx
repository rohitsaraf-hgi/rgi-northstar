import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Layers,
  FileText,
  Mail,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Sparkles,
  ListChecks,
  ArrowRight,
  BookmarkCheck,
} from 'lucide-react';
import { usePersona } from '../../context/PersonaContext.jsx';
import { getSavedAssetsForPersona, ARTIFACT_TYPES } from '../../data/library.js';

const ICON_MAP = {
  layers: Layers,
  'file-text': FileText,
  mail: Mail,
  'bar-chart-3': BarChart3,
  'check-circle-2': CheckCircle2,
  'clipboard-list': ClipboardList,
  sparkles: Sparkles,
  'list-checks': ListChecks,
};

export default function RecentlySaved({ limit = 6 }) {
  const navigate = useNavigate();
  const { personaId } = usePersona();
  const items = getSavedAssetsForPersona(personaId).slice(0, limit);

  if (items.length === 0) return null;

  // Group by type for the chip strip at top
  const counts = items.reduce((acc, it) => {
    acc[it.type] = (acc[it.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <section className="px-8 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookmarkCheck size={14} className="text-text-secondary" />
          <h2 className="text-sm font-semibold text-text-primary">Recently Saved</h2>
          <span className="text-xs text-text-muted">
            · assets accumulating across your threads
          </span>
        </div>
        <button
          onClick={() => navigate('/library')}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          Open Saved Library
          <ArrowRight size={11} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {Object.entries(counts).map(([type, count]) => {
          const cfg = ARTIFACT_TYPES[type];
          if (!cfg) return null;
          const Icon = ICON_MAP[cfg.icon] || FileText;
          return (
            <div
              key={type}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface border border-border rounded text-[10px]"
            >
              <Icon size={9} className={cfg.color} />
              <span className={`uppercase tracking-wider font-semibold ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className="text-text-muted font-mono ml-0.5">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {items.map((item, i) => {
          const cfg = ARTIFACT_TYPES[item.type] || ARTIFACT_TYPES.BRIEF;
          const Icon = ICON_MAP[cfg.icon] || FileText;
          return (
            <motion.button
              key={`${item.threadId}-${item.id}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/thread/${item.threadId}`)}
              className="text-left bg-surface border border-border rounded-md p-3 hover:border-border-2 transition-colors group"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={11} className={cfg.color} />
                <span className={`text-[9px] font-bold uppercase tracking-wider ${cfg.color}`}>
                  {cfg.label}
                </span>
                {item.version && (
                  <span className="text-[10px] text-text-muted font-mono ml-auto">{item.version}</span>
                )}
              </div>
              <div className="text-xs font-medium text-text-primary truncate">{item.name}</div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                {item.threadName} · {item.timestamp}
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
