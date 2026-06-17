import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  BarChart2,
  Cpu,
  Target,
  Star,
  Bot,
  Sparkles,
  ArrowRight,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { useModuleDetail } from '../../context/ModuleDetailContext.jsx';
import { useDemo } from '../../context/DemoContext.jsx';
import { usePersona } from '../../context/PersonaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { USE_CASE_MODULE_MAP, useCaseAvailability, moduleById } from '../../data/modules.js';
import { USE_CASES } from '../../data/useCases.js';

const ICONS = {
  BarChart2,
  Cpu,
  Target,
  Star,
  Bot,
};

const PERSONA_USAGE = {
  market_analyzer: ['Marketing', 'AE'],
  data_studio: ['RevOps', 'AE', 'Marketing'],
  sales_copilot: ['AE', 'AM'],
  trust_radius: ['Marketing', 'AE'],
  rgi_agents: ['AE', 'RevOps'],
};

export default function ModuleDetailModal() {
  const { openModuleId, close } = useModuleDetail();
  const { config } = useDemo();
  const { persona } = usePersona();
  const { showToast } = useToast();

  const m = openModuleId ? moduleById(openModuleId) : null;

  const Icon = m ? (ICONS[m.icon] || Cpu) : Cpu;
  const isOwned = m ? config.modulesOwned.includes(m.id) : false;

  // Compute use-case impact: which use cases improve when this module is added?
  const impacts = m
    ? USE_CASES.filter((u) => USE_CASE_MODULE_MAP[u.id]).map((u) => {
        const before = useCaseAvailability(u.id, config.modulesOwned);
        const after = useCaseAvailability(u.id, [...config.modulesOwned, m.id]);
        return {
          useCase: u,
          beforeCount: before.stagesAvailable,
          afterCount: after.stagesAvailable,
          improves: after.stagesAvailable > before.stagesAvailable,
        };
      })
    : [];

  const affected = impacts.filter((i) => i.improves);
  const personaTags = m ? (PERSONA_USAGE[m.id] || []).map((s) => s.toLowerCase()) : [];
  const personaRelevant = affected
    .filter((i) =>
      i.useCase.personas?.some((p) => personaTags.includes(p.toLowerCase()))
    )
    .sort((a, b) => b.afterCount - a.afterCount)[0] || affected[0];

  return (
    <AnimatePresence>
      {m && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[80]"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="bg-surface border border-border rounded-xl w-full max-w-xl max-h-[85vh] overflow-y-auto pointer-events-auto">
              {/* Header */}
              <div className="p-5 border-b border-border flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${m.color}20` }}
                  >
                    <Icon size={20} style={{ color: m.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-lg font-semibold text-text-primary">{m.name}</h2>
                      {isOwned && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-success/15 text-success rounded">
                          Active
                        </span>
                      )}
                      {!isOwned && m.isExpansion && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-warning/15 text-warning rounded">
                          Expansion
                        </span>
                      )}
                      {!isOwned && !m.isExpansion && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-text-muted/15 text-text-muted rounded">
                          Not in plan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{m.description}</p>
                  </div>
                </div>
                <button onClick={close} className="p-1.5 rounded hover:bg-bg/40 text-text-muted">
                  <X size={14} />
                </button>
              </div>

              {/* Persona tags */}
              {PERSONA_USAGE[m.id] && (
                <div className="px-5 py-3 border-b border-border bg-bg/30">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
                    Typically used by
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PERSONA_USAGE[m.id].map((p) => (
                      <span
                        key={p}
                        className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-surface border border-border rounded text-text-secondary font-medium"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* What it unlocks */}
              {!isOwned && (
                <div className="p-5 border-b border-border">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
                    What it unlocks for you
                  </div>

                  {personaRelevant && (
                    <div
                      className="mb-3 p-3 rounded-md border"
                      style={{
                        background: 'rgb(254 243 199 / 0.06)',
                        borderColor: 'rgb(245 158 11 / 0.4)',
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles size={11} className="text-warning" />
                        <span className="text-[10px] uppercase tracking-wider font-bold text-warning">
                          Highest impact for {persona.name.split(' ')[0]}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-text-primary mb-1">
                        {personaRelevant.useCase.name}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {personaRelevant.beforeCount} of 5 stages today →{' '}
                        <span className="text-success font-semibold">
                          {personaRelevant.afterCount} of 5 stages with {m.name}
                        </span>
                      </div>
                    </div>
                  )}

                  {affected.length > 0 ? (
                    <div className="space-y-1.5">
                      {affected.slice(0, 6).map((i) => (
                        <div
                          key={i.useCase.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 bg-bg/40 border border-border rounded text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-text-primary font-medium truncate">{i.useCase.name}</div>
                            <div className="text-[10px] text-text-muted">
                              {i.beforeCount} of 5 stages →{' '}
                              <span className="text-success font-medium">{i.afterCount} of 5 stages</span>
                              {i.afterCount === 5 && ' (full depth)'}
                            </div>
                          </div>
                          <ArrowRight size={11} className="text-success flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-text-secondary">
                      Adding this module wouldn't change current use case depth — it powers expansion use cases not yet activated.
                    </div>
                  )}
                </div>
              )}

              {isOwned && (
                <div className="p-5 border-b border-border">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
                    Currently active
                  </div>
                  <div className="text-xs text-text-secondary leading-relaxed">
                    {m.name} is part of your plan and powering use cases across your workspace. Configure module settings in the Admin Hub.
                  </div>
                </div>
              )}

              {/* Next step */}
              <div className="p-5 bg-bg/30">
                {!isOwned ? (
                  <>
                    <div className="text-sm text-text-primary mb-3 leading-relaxed">
                      Talk to your CSM to add <span className="font-semibold">{m.name}</span> to your plan.
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          showToast(`Message sent to your CSM about ${m.name}`);
                          close();
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
                      >
                        <MessageSquare size={11} />
                        Contact CSM
                      </button>
                      <button
                        onClick={() => {
                          showToast(`Demo of ${m.name} requested — calendar invite incoming`);
                          close();
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 border border-border text-text-secondary text-xs rounded-md hover:bg-surface-2 hover:text-text-primary transition-colors"
                      >
                        <Calendar size={11} />
                        Schedule a demo
                      </button>
                      <button
                        onClick={close}
                        className="ml-auto px-3 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={close}
                      className="px-3 py-2 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
                    >
                      Got it
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
