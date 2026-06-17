import { useNavigate } from 'react-router-dom';
import {
  Users,
  Coins,
  Cpu,
  Plug,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { CONFIG_HEALTH } from '../../data/playbooks.js';
import { SETUP_STEPS } from '../../data/adminHub.js';

const ICONS = {
  users: Users,
  credits: Coins,
  models: Cpu,
  integrations: Plug,
};

function StatCard({ keyName, data }) {
  const Icon = ICONS[keyName] || Users;
  const isWarning = data.accent === 'warning';
  return (
    <div
      className={`bg-surface border rounded-lg p-3.5 ${
        isWarning ? 'border-warning/40' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
        <Icon size={11} />
        {data.label}
      </div>
      <div
        className={`text-xl font-semibold tracking-tight ${
          isWarning ? 'text-warning' : 'text-text-primary'
        }`}
      >
        {data.value}
      </div>
      <div className="text-[11px] text-text-secondary mt-0.5">{data.sub}</div>
    </div>
  );
}

export default function ConfigHealthSummary() {
  const navigate = useNavigate();
  const completedSteps = SETUP_STEPS.filter((s) => s.status === 'complete').length;
  const totalSteps = SETUP_STEPS.length;
  const setupComplete = completedSteps === totalSteps;
  const blockers = SETUP_STEPS.filter((s) => s.status === 'blocked').length;

  return (
    <section className="px-8 pt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-tight text-text-primary">
          Configuration Health
        </h2>
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          Open Admin Hub
          <ArrowRight size={11} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-3">
        {Object.entries(CONFIG_HEALTH).map(([key, data]) => (
          <StatCard key={key} keyName={key} data={data} />
        ))}
      </div>

      <div className="flex items-center gap-3 px-3 py-2 bg-surface border border-border rounded-md">
        {setupComplete ? (
          <>
            <CheckCircle2 size={14} className="text-success" />
            <span className="text-xs text-text-secondary">
              Setup complete — all 6 configuration steps done
            </span>
          </>
        ) : blockers > 0 ? (
          <>
            <AlertTriangle size={14} className="text-warning" />
            <span className="text-xs text-text-secondary flex-1">
              <span className="text-text-primary font-medium">
                {completedSteps}/{totalSteps} setup complete
              </span>
              {' · '}
              <span className="text-warning">
                {blockers} blocker{blockers !== 1 ? 's' : ''}
              </span>
            </span>
            <button
              onClick={() => navigate('/admin')}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Resolve →
            </button>
          </>
        ) : (
          <>
            <CheckCircle2 size={14} className="text-success" />
            <span className="text-xs text-text-secondary flex-1">
              <span className="text-text-primary font-medium">
                {completedSteps}/{totalSteps} setup complete
              </span>
              {' · '}
              <span className="text-text-muted">
                {totalSteps - completedSteps} step
                {totalSteps - completedSteps !== 1 ? 's' : ''} remaining
              </span>
            </span>
            <button
              onClick={() => navigate('/admin')}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Continue →
            </button>
          </>
        )}
      </div>
    </section>
  );
}
