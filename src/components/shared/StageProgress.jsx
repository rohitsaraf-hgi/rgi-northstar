import { Lock } from 'lucide-react';
import { STAGES } from '../../data/useCases.js';
import { USE_CASE_MODULE_MAP, moduleLabel } from '../../data/modules.js';
import { useDemo } from '../../context/DemoContext.jsx';

export default function StageProgress({ currentStage, useCaseId, size = 'sm', showLabels = true }) {
  const idx = STAGES.indexOf(currentStage);
  const { config } = useDemo();
  const stageMap = useCaseId ? USE_CASE_MODULE_MAP[useCaseId] : null;

  const isLocked = (stageIndex) => {
    if (!stageMap) return false;
    const required = stageMap.stages[stageIndex];
    if (required === null || required === undefined) return false;
    return !config.modulesOwned.includes(required);
  };

  return (
    <div className="flex items-center gap-1.5">
      {STAGES.map((stage, i) => {
        const isPast = i < idx;
        const isCurrent = i === idx;
        const locked = isLocked(i);
        const required = stageMap?.stages[i];

        return (
          <div key={stage} className="flex items-center gap-1.5">
            <div
              className="flex items-center gap-1.5"
              title={locked ? `${moduleLabel(required)} required for ${stage}` : undefined}
            >
              {locked ? (
                <div className="relative w-2 h-2 flex items-center justify-center">
                  <span className="w-2 h-2 bg-text-muted/50 rounded-full" />
                  <Lock
                    size={7}
                    className="absolute -top-0.5 -right-1 text-text-muted"
                    strokeWidth={2.5}
                  />
                </div>
              ) : (
                <div
                  className={`rounded-full transition-colors ${
                    isCurrent
                      ? 'w-2 h-2 bg-primary ring-2 ring-primary/30'
                      : isPast
                      ? 'w-1.5 h-1.5 bg-primary/60'
                      : 'w-1.5 h-1.5 bg-text-muted/40'
                  }`}
                />
              )}
              {showLabels && (
                <span
                  className={`text-[10px] uppercase tracking-wider font-medium ${
                    locked
                      ? 'text-text-muted/60 line-through decoration-text-muted/40'
                      : isCurrent
                      ? 'text-primary'
                      : isPast
                      ? 'text-text-secondary'
                      : 'text-text-muted'
                  }`}
                >
                  {stage}
                </span>
              )}
            </div>
            {i < STAGES.length - 1 && (
              <div className={`h-px w-3 ${isPast && !locked ? 'bg-primary/40' : 'bg-text-muted/20'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
