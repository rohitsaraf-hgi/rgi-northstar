import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { useDemo } from '../../context/DemoContext.jsx';
import { useModuleDetail } from '../../context/ModuleDetailContext.jsx';
import { MODULE_DEFINITIONS, USE_CASE_MODULE_MAP, useCaseAvailability } from '../../data/modules.js';
import { USE_CASES } from '../../data/useCases.js';

// Priority order for "what's missing": Data Studio → Sales Copilot →
// Market Analyzer. Banner shown when modulesOwned.length < 3 and at least
// one core module is missing.

const PRIORITY = ['data_studio', 'sales_copilot', 'market_analyzer'];

const COPY = {
  data_studio: {
    title: 'DATA STUDIO NOT IN PLAN',
    body: 'use cases in your workspace reach the Score stage and stop. Data Studio would unlock full depth — ICP scoring, routing, and lead qualification.',
  },
  sales_copilot: {
    title: 'SALES COPILOT NOT IN PLAN',
    body: 'use cases stop short of the Action stage. Sales Copilot adds account intelligence, AI sales plays, and outreach drafting on top of your scoring.',
  },
  market_analyzer: {
    title: 'MARKET ANALYZER NOT IN PLAN',
    body: 'use cases lack the segmentation and competitive intelligence layer. Market Analyzer powers TAM/SAM/SOM, whitespace, and competitive analysis.',
  },
};

export default function ModuleCoverageBanner() {
  const { config } = useDemo();
  const { open } = useModuleDetail();
  const [dismissed, setDismissed] = useState(false);

  const missingModule = useMemo(() => {
    for (const m of PRIORITY) {
      if (!config.modulesOwned.includes(m)) return m;
    }
    return null;
  }, [config.modulesOwned]);

  // Count how many use cases would benefit
  const benefitCount = useMemo(() => {
    if (!missingModule) return 0;
    let n = 0;
    for (const u of USE_CASES) {
      if (!USE_CASE_MODULE_MAP[u.id] || u.requiresAdmin) continue;
      const map = USE_CASE_MODULE_MAP[u.id];
      if (map.stages.includes(missingModule)) {
        const before = useCaseAvailability(u.id, config.modulesOwned);
        const after = useCaseAvailability(u.id, [...config.modulesOwned, missingModule]);
        if (after.stagesAvailable > before.stagesAvailable) n++;
      }
    }
    return n;
  }, [missingModule, config.modulesOwned]);

  // Hide if: 3+ modules owned, no missing, dismissed, or no use cases benefit
  if (config.modulesOwned.length >= 3) return null;
  if (!missingModule || benefitCount === 0) return null;
  if (dismissed) return null;

  const copy = COPY[missingModule];
  const moduleObj = MODULE_DEFINITIONS.find((m) => m.id === missingModule);

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="px-8 pt-4"
      >
        <div className="border border-border/60 rounded-md p-3 flex items-center gap-3 bg-surface">
          <Sparkles size={12} className="text-text-muted flex-shrink-0" />
          <div className="flex-1 min-w-0 text-sm text-text-secondary">
            <span className="text-text-primary font-medium">{moduleObj.name} not in plan</span>
            <span className="text-text-muted"> — {benefitCount} use cases reach a gated stage and stop.</span>
          </div>
          <button
            onClick={() => open(missingModule)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-primary hover:bg-primary/10 rounded transition-colors whitespace-nowrap"
          >
            See what it adds
            <ArrowRight size={11} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded text-text-muted hover:bg-bg/40 hover:text-text-secondary transition-colors"
            title="Dismiss"
          >
            <X size={11} />
          </button>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
