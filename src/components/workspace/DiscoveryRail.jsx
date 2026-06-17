import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { usePersona } from '../../context/PersonaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { DISCOVERY_SUGGESTIONS } from '../../data/personaContent.js';

// Minimalistic suggestion — single horizontal row with text + action.
// No gradient, no icon container, no card chrome.
export default function DiscoveryRail({ onActivate }) {
  const { personaId } = usePersona();
  const { showToast } = useToast();
  const suggestion = DISCOVERY_SUGGESTIONS[personaId];
  const [dismissed, setDismissed] = useState(false);

  if (!suggestion || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="px-8 py-6"
      >
        <div className="flex items-start gap-3 px-4 py-3 border border-border/60 rounded-md bg-surface">
          <Sparkles size={14} className="text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-text-primary leading-snug mb-0.5">
              {suggestion.headline}
            </div>
            <div className="text-xs text-text-muted leading-relaxed">{suggestion.rationale}</div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onActivate(suggestion.targetUseCase)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 rounded-md transition-colors whitespace-nowrap font-medium"
            >
              {suggestion.ctaLabel.replace(' →', '')}
              <ArrowRight size={11} />
            </button>
            <button
              onClick={() => {
                setDismissed(true);
                showToast('Suggestion dismissed', 'info');
              }}
              className="p-1.5 rounded text-text-muted hover:bg-bg/40 hover:text-text-secondary transition-colors"
              title="Dismiss"
            >
              <X size={11} />
            </button>
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
