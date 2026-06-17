import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Search, ArrowRight, Check } from 'lucide-react';
import { USE_CASES, USE_CASE_CATEGORIES, STAGES } from '../../data/useCases.js';
import { createRuntimeThread } from '../../data/runtimeThreads.js';
import { usePersona } from '../../context/PersonaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import StageProgress from '../shared/StageProgress.jsx';

function StepIndicator({ step }) {
  const steps = ['Select', 'Configure', 'Name', 'Activate'];
  return (
    <div className="flex items-center gap-2 mb-5">
      {steps.map((s, i) => {
        const idx = i + 1;
        const isCurrent = idx === step;
        const isPast = idx < step;
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                isCurrent
                  ? 'bg-primary text-white'
                  : isPast
                  ? 'bg-primary/20 text-primary'
                  : 'bg-surface-2 text-text-muted'
              }`}
            >
              {isPast ? <Check size={10} /> : idx}
            </div>
            <span
              className={`text-xs ${
                isCurrent ? 'text-text-primary font-medium' : 'text-text-muted'
              }`}
            >
              {s}
            </span>
            {i < steps.length - 1 && <span className="text-text-muted text-xs">/</span>}
          </div>
        );
      })}
    </div>
  );
}

function buildDefaultName(useCase, configValue) {
  const today = 'Apr 25';
  const config = configValue ? ` — ${configValue}` : '';
  return `${useCase.name}${config} — ${today}`;
}

export default function UseCaseActivationModal({ open, onClose, presetUseCaseId }) {
  const navigate = useNavigate();
  const { personaId } = usePersona();
  const { showToast } = useToast();

  const [step, setStep] = useState(presetUseCaseId ? 2 : 1);
  const [selectedId, setSelectedId] = useState(presetUseCaseId || null);
  const [search, setSearch] = useState('');
  const [configValue, setConfigValue] = useState('');
  const [threadName, setThreadName] = useState('');

  useEffect(() => {
    if (open) {
      setStep(presetUseCaseId ? 2 : 1);
      setSelectedId(presetUseCaseId || null);
      setSearch('');
      setConfigValue('');
      setThreadName('');
    }
  }, [open, presetUseCaseId]);

  const useCase = USE_CASES.find((u) => u.id === selectedId);

  const filtered = USE_CASES.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.outcome.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id) => {
    const u = USE_CASES.find((uc) => uc.id === id);
    setSelectedId(id);
    setConfigValue(u.configOptions[0]);
    setStep(2);
  };

  const goToNameStep = () => {
    setThreadName(buildDefaultName(useCase, configValue));
    setStep(3);
  };

  const handleActivate = () => {
    const id = createRuntimeThread({
      useCaseId: selectedId,
      name: threadName || buildDefaultName(useCase, configValue),
      configValue,
      ownerPersonaId: personaId,
    });
    showToast(`Activated: ${useCase.name}`);
    onClose();
    navigate(`/thread/${id}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col pointer-events-auto">
              {/* Header */}
              <div className="p-5 border-b border-border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
                      Activate Use Case
                    </div>
                    <h2 className="text-lg font-semibold">
                      {step === 1 && 'Select a use case'}
                      {step === 2 && useCase?.name}
                      {step === 3 && 'Name this thread'}
                      {step === 4 && 'Ready to activate'}
                    </h2>
                  </div>
                  <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-2 text-text-muted">
                    <X size={16} />
                  </button>
                </div>
                <StepIndicator step={step} />
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto thin-scrollbar p-5">
                {/* STEP 1 — Select */}
                {step === 1 && (
                  <>
                    <div className="relative mb-4">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search use cases..."
                        className="w-full bg-bg border border-border rounded-md pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      {filtered.map((u) => {
                        const cat = USE_CASE_CATEGORIES[u.category];
                        return (
                          <button
                            key={u.id}
                            onClick={() => handleSelect(u.id)}
                            className="w-full text-left p-3 bg-bg border border-border rounded-md hover:border-primary/40 hover:bg-surface-2 transition-colors group"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${cat.bg} ${cat.color} font-semibold`}>
                                    {cat.label}
                                  </span>
                                  <span className="text-[10px] text-text-muted font-mono">{u.timeToOutput}</span>
                                </div>
                                <div className="text-sm font-medium text-text-primary mb-1">{u.name}</div>
                                <div className="text-xs text-text-secondary leading-snug">{u.outcome}</div>
                              </div>
                              <ArrowRight
                                size={14}
                                className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* STEP 2 — Configure */}
                {step === 2 && useCase && (
                  <div className="space-y-5">
                    <div className="bg-bg/40 border border-border rounded-md p-4">
                      <div className="text-xs text-text-secondary mb-1">Outcome</div>
                      <div className="text-sm text-text-primary">{useCase.outcome}</div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="text-xs text-text-muted mb-2">Journey</div>
                        <StageProgress currentStage={STAGES[0]} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-text-primary mb-2">
                        {useCase.configQuestion}
                      </label>
                      <select
                        value={configValue}
                        onChange={(e) => setConfigValue(e.target.value)}
                        className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/40"
                      >
                        {useCase.configOptions.map((opt) => (
                          <option key={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* STEP 3 — Name */}
                {step === 3 && useCase && (
                  <div className="space-y-4">
                    <p className="text-sm text-text-secondary">
                      Give this thread a name you'll recognize later. You can always rename it.
                    </p>
                    <input
                      autoFocus
                      value={threadName}
                      onChange={(e) => setThreadName(e.target.value)}
                      className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/40"
                    />
                    <div className="bg-bg/40 border border-border rounded-md p-3 text-xs text-text-secondary">
                      <div>Use case: <span className="text-text-primary">{useCase.name}</span></div>
                      <div className="mt-1">Configuration: <span className="text-text-primary">{configValue}</span></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-border bg-bg/30 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (step === 2 && !presetUseCaseId) setStep(1);
                    else if (step === 3) setStep(2);
                    else onClose();
                  }}
                  className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  {step === 1 || (step === 2 && presetUseCaseId) ? 'Cancel' : 'Back'}
                </button>

                {step === 2 && (
                  <button
                    onClick={goToNameStep}
                    disabled={!configValue}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-dim disabled:opacity-40 transition-colors"
                  >
                    Continue <ArrowRight size={12} />
                  </button>
                )}
                {step === 3 && (
                  <button
                    onClick={handleActivate}
                    disabled={!threadName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-dim disabled:opacity-40 transition-colors"
                  >
                    Activate Use Case <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
