import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePersona } from '../../context/PersonaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { FOCUS_ITEMS, TODAY_LABEL } from '../../data/personaContent.js';

// Minimalistic version: no colored backgrounds, single muted accent dot,
// label as small uppercase secondary text, primary action only.
export default function TodaysFocus() {
  const { personaId } = usePersona();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const items = FOCUS_ITEMS[personaId] || [];

  const handleAction = (action) => {
    if (action.toast) showToast(action.toast);
    if (action.threadId) navigate(`/thread/${action.threadId}`);
  };

  return (
    <section className="px-8 pt-6 pb-2">
      <div className="flex items-baseline justify-between mb-5">
        <h1 className="text-lg font-semibold tracking-tight">Today's Focus</h1>
        <div className="text-xs text-text-muted">{TODAY_LABEL}</div>
      </div>

      <div className="space-y-1">
        {items.map((item, i) => {
          // Only urgent items get colored dot — everything else uses neutral
          const isUrgent = item.color === 'danger';
          const dotClass = isUrgent ? 'bg-danger' : 'bg-text-muted/50';
          const primaryAction = item.actions.find((a) => a.kind === 'primary') || item.actions[0];
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => primaryAction && handleAction(primaryAction)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface rounded-md transition-colors text-left group"
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-primary font-medium truncate">
                  {item.threadName}
                </div>
                <div className="text-xs text-text-muted truncate mt-0.5">{item.context}</div>
              </div>
              <span className="text-xs text-text-muted flex-shrink-0">{item.timestamp}</span>
              {primaryAction && (
                <span className="text-xs text-primary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {primaryAction.label} →
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
