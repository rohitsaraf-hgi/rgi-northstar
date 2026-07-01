// Welcome state — first thing the user sees when the conversation is empty.
//
// Spec §5: greeting headline + suggested starter prompts (4 cards) + (in
// engagement layer) Monday Monitor and recent analyses.
//
// We deliberately skip Monday Monitor + recent analyses for now — those
// land with Phase 3 (engagement layer). Today: greet + 4 starters.

import { Sparkles, ArrowRight, Clock } from 'lucide-react';
import { copilotScript } from '../../data/marketAnalyzerCopilot/copilotScript.js';
import MondayMonitor from './MondayMonitor.jsx';

function StarterCard({ starter, onPick }) {
  const isComingSoon = starter.comingSoon;
  return (
    <button
      onClick={() => !isComingSoon && onPick(starter)}
      disabled={isComingSoon}
      className={`text-left p-4 rounded-xl border transition-all group ${
        isComingSoon
          ? 'bg-surface/60 border-border/60 opacity-60 cursor-not-allowed'
          : 'bg-surface border-border hover:border-primary/40 hover:shadow-card cursor-pointer'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-wider font-bold text-text-muted inline-flex items-center gap-1">
          <Sparkles size={10} />
          {starter.label}
        </div>
        {isComingSoon ? (
          <span className="text-[9px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
            <Clock size={9} /> Soon
          </span>
        ) : (
          <ArrowRight
            size={12}
            className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all"
          />
        )}
      </div>
      <div className="text-[13.5px] font-semibold text-text-primary leading-snug mb-1">
        "{starter.promptText}"
      </div>
      <div className="text-[11px] text-text-muted leading-relaxed">{starter.examples}</div>
    </button>
  );
}

export default function WelcomeState({ firstName, onStarterPick, onMondayMonitorAction }) {
  return (
    <div className="max-w-3xl mx-auto pt-8 pb-4">
      {/* Monday Monitor — proactive weekly digest sits above the greeting.
          For the demo it always shows; in production it'd only render
          on Monday or when new signal-changes exist. */}
      {onMondayMonitorAction && <MondayMonitor onAction={onMondayMonitorAction} />}

      <div
        className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
        style={{ background: 'linear-gradient(135deg, #4F7FFF 0%, #6B4FA0 100%)' }}
      >
        <Sparkles size={20} className="text-white" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-text-primary mb-1">
        {copilotScript.welcome.greeting(firstName)}
      </h1>
      <p className="text-base text-text-secondary mb-6">{copilotScript.welcome.subtitle}</p>

      <div className="text-[11px] uppercase tracking-wider font-bold text-text-muted mb-2">
        {copilotScript.welcome.starterHeader}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {copilotScript.welcome.starterPrompts.map((s) => (
          <StarterCard key={s.id} starter={s} onPick={onStarterPick} />
        ))}
      </div>
    </div>
  );
}
