import { useState } from 'react';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { moduleById } from '../../data/modules.js';
import { useModuleDetail } from '../../context/ModuleDetailContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

// Inline boundary card rendered in the conversation when a use case's Score
// stage requires a module the user doesn't own. Demonstrates: the platform is
// honest about what it can/can't do given the current plan, AND there's a
// clear path to unlock.

const UNLOCKED_BENEFITS = {
  data_studio: [
    'ICP score (A/B/C/D) per company',
    'Top signals driving each score',
    'CRM routing logic and propensity tiers',
  ],
  sales_copilot: [
    'Signal-based account prioritization',
    'AI sales plays per account',
    'Outreach drafting + sequence assignment',
  ],
  market_analyzer: [
    'Market size by geography, industry, revenue, employees',
    'Competitive presence + intent overlay',
    'Whitespace identification',
  ],
  trust_radius: [
    'Verified review intelligence per company',
    'Social proof signals + sentiment',
    'Competitive review comparison',
  ],
  rgi_agents: [
    'Autonomous execution of multi-step plays',
    'Approval-gated actions across systems',
    'Continuous monitoring and intervention',
  ],
};

export default function CapabilityBoundaryCard({ moduleId, label = 'this step', dismissText = 'Continue without scoring' }) {
  const [dismissed, setDismissed] = useState(false);
  const { open } = useModuleDetail();
  const { showToast } = useToast();
  const m = moduleById(moduleId);
  if (!m || dismissed) return null;

  const benefits = UNLOCKED_BENEFITS[moduleId] || [];

  return (
    <div className="my-4 border-l-2 rounded-r-md p-4" style={{ borderColor: '#F59E0B', background: 'rgb(254 243 199 / 0.06)' }}>
      <div className="flex items-center gap-2 mb-2">
        <Lock size={12} className="text-warning" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-warning">
          {m.name} required for {label}
        </span>
      </div>
      <div className="text-sm text-text-primary mb-3 leading-relaxed">
        Scoring 4,200 accounts against your ICP requires the{' '}
        <span className="font-semibold">{m.name}</span> module. Your current plan can complete the rest of this thread, but the scoring step will be skipped.
      </div>

      {benefits.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
            With {m.name} you'd get:
          </div>
          <ul className="space-y-1">
            {benefits.map((b, i) => (
              <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                <span className="text-warning mt-1">·</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setDismissed(true);
            showToast(`Continuing without ${m.name} — output will skip the scoring stage`, 'info');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-md text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
        >
          {dismissText}
          <ArrowRight size={11} />
        </button>
        <button
          onClick={() => open(moduleId)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-warning text-white rounded-md hover:bg-warning/90 transition-colors"
          style={{ background: '#F59E0B' }}
        >
          <Sparkles size={11} />
          Add {m.name}
        </button>
      </div>
    </div>
  );
}
