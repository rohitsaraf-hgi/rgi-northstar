import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings,
  Users,
  Plug,
  ShieldCheck,
  Cpu,
  Bot,
  Check,
  Circle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { SETUP_STEPS } from '../../data/adminHub.js';

const ICONS = {
  settings: Settings,
  users: Users,
  plug: Plug,
  'shield-check': ShieldCheck,
  cpu: Cpu,
  bot: Bot,
};

function StatusIcon({ status }) {
  if (status === 'complete') {
    return (
      <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center">
        <Check size={11} className="text-success" />
      </div>
    );
  }
  if (status === 'blocked') {
    return (
      <div className="w-5 h-5 rounded-full bg-danger/15 flex items-center justify-center">
        <AlertTriangle size={11} className="text-danger" />
      </div>
    );
  }
  if (status === 'in_progress') {
    return (
      <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    );
  }
  return <Circle size={18} className="text-border-2" />;
}

function StepCard({ step, index, onOpen }) {
  const Icon = ICONS[step.icon] || Settings;
  const isBlocked = step.status === 'blocked';
  const isComplete = step.status === 'complete';

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => onOpen(step)}
      className={`text-left bg-surface border rounded-lg p-5 transition-all hover:shadow-card ${
        isBlocked
          ? 'border-danger/30 hover:border-danger/50'
          : isComplete
          ? 'border-success/30 hover:border-success/40'
          : 'border-border hover:border-border-2'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${step.iconBg} flex items-center justify-center`}>
          <Icon size={18} className={step.iconColor} />
        </div>
        <StatusIcon status={step.status} />
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
          Step {index + 1}
        </span>
        <span className="text-text-muted text-[10px]">·</span>
        <span className="text-[10px] text-text-muted font-mono">{step.estimatedTime}</span>
        {step.pages > 0 && (
          <>
            <span className="text-text-muted text-[10px]">·</span>
            <span className="text-[10px] text-text-muted font-mono">
              {step.pages} {step.pages === 1 ? 'page' : 'pages'}
            </span>
          </>
        )}
      </div>

      <h3 className="text-base font-semibold text-text-primary mb-2">{step.title}</h3>
      <p className="text-xs text-text-secondary leading-relaxed mb-4">{step.description}</p>

      {step.aiPowered && (
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[10px] text-primary font-semibold uppercase tracking-wider mb-3">
          <Sparkles size={10} />
          AI-Powered · Zero Config
        </div>
      )}

      {step.subItems.length > 0 && (
        <ul className="space-y-1 mb-4">
          {step.subItems.slice(0, 5).map((sub) => (
            <li key={sub} className="text-xs text-text-secondary flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-text-muted" />
              {sub}
            </li>
          ))}
        </ul>
      )}

      {step.progress && (
        <div className="mb-4">
          <div className="text-[10px] text-text-muted mb-1">{step.progress.done} of {step.progress.total} steps complete</div>
          <div className="h-1 bg-bg/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${(step.progress.done / step.progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {isBlocked && (
        <div className="text-xs text-danger mb-3 flex items-start gap-1.5">
          <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
          <span>{step.blockReason}</span>
        </div>
      )}

      <div className="text-xs flex items-center gap-1 text-primary font-medium">
        {isComplete ? 'Review settings' : isBlocked ? 'Fix integration' : 'Get started'}
        <ArrowRight size={11} />
      </div>
    </motion.button>
  );
}

export default function SetupGuide({ compact = false }) {
  const navigate = useNavigate();

  const completed = SETUP_STEPS.filter((s) => s.status === 'complete').length;
  const total = SETUP_STEPS.length;
  const pct = (completed / total) * 100;

  const steps = compact ? SETUP_STEPS.slice(0, 6) : SETUP_STEPS;

  const handleOpen = (step) => {
    if (step.id === 'configure-copilot') {
      navigate('/admin/copilot');
    } else if (step.id === 'integrations') {
      navigate('/admin/apps');
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-text-primary">
            Welcome back, Priya
          </h2>
          <div className="text-sm text-text-secondary">
            Let's keep your platform ready — {total - completed} step{total - completed !== 1 ? 's' : ''} remaining.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1">
            <RotateCcw size={11} />
            Reset
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1"
          >
            <Sparkles size={11} />
            Setup Guide
          </button>
        </div>
      </div>

      <div className="mt-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-bg/60 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6 }}
              className="h-full bg-success rounded-full"
            />
          </div>
          <div className="text-xs font-mono text-text-primary font-semibold">
            {completed}/{total} complete
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {steps.map((step, i) => (
          <StepCard key={step.id} step={step} index={i} onOpen={handleOpen} />
        ))}
      </div>
    </div>
  );
}
