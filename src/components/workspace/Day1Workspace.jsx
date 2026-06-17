import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check,
  Plug,
  MapPin,
  Zap,
  ArrowRight,
  Sparkles,
  Library,
  BookmarkCheck,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { usePersona } from '../../context/PersonaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

// Day 1 view replaces the standard workspace home for new users.
// The frame: grounded welcome → setup checklist → first use case →
// team examples → navigation tips. Each section is calibrated to give
// progress feeling without overwhelming.

const SETUP_STEPS = [
  {
    id: 'account',
    label: 'Account created',
    detail: 'Welcome to RGI · Apr 30',
    icon: Check,
    estimatedTime: null,
    complete: true,
  },
  {
    id: 'salesforce',
    label: 'Connect Salesforce',
    detail: 'Pulls your inherited 247-account book + opportunities',
    icon: Plug,
    estimatedTime: '2 min',
    complete: false,
    primaryAction: 'Connect →',
  },
  {
    id: 'territory',
    label: 'Confirm your territory',
    detail: 'Review what you\'re inheriting from Aisha (the previous AE)',
    icon: MapPin,
    estimatedTime: '1 min',
    complete: false,
    primaryAction: 'Review →',
    blocked: true, // depends on Salesforce
    blockReason: 'Connect Salesforce first',
  },
  {
    id: 'first-triage',
    label: 'Run your first Daily Account Triage',
    detail: 'See your top 12 accounts ranked by signal × ICP fit × deal stage',
    icon: Zap,
    estimatedTime: '3 min',
    complete: false,
    primaryAction: 'Run →',
    blocked: true,
    blockReason: 'Confirm territory first',
  },
];

const TEAM_EXAMPLES = [
  {
    threadId: 'meridian-deal',
    title: 'Meridian Cloud — Q2 Deal',
    owner: 'Jordan Chen',
    description: 'A live deal thread. Pre-call brief, stakeholder mapping, follow-up draft — all in one canvas.',
  },
  {
    threadId: 'daily-triage',
    title: 'Daily Account Triage',
    owner: 'Jordan Chen',
    description: '12 accounts ranked by AI today. Filter, drill in, draft outreach — without leaving the conversation.',
  },
  {
    threadId: 'globaltech-prospect',
    title: 'GlobalTech Prospecting',
    owner: 'Jordan Chen',
    description: 'A prospecting thread with intent signals, contact discovery, and a queued follow-up sequence.',
  },
];

function SetupStep({ step, index, onAction }) {
  const Icon = step.icon;
  const isClickable = !step.complete && !step.blocked;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-3 px-4 py-3 border rounded-md transition-colors ${
        step.complete
          ? 'border-success/30 bg-success/5'
          : step.blocked
          ? 'border-border/60 bg-bg/30 opacity-60'
          : 'border-border bg-surface hover:border-primary/40 hover:shadow-card'
      }`}
    >
      <div
        className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
          step.complete ? 'bg-success/15' : 'bg-bg/40'
        }`}
      >
        {step.complete ? (
          <Check size={13} className="text-success" />
        ) : (
          <Icon size={13} className="text-text-muted" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              step.complete ? 'text-text-secondary' : 'text-text-primary'
            }`}
          >
            {step.label}
          </span>
          {step.estimatedTime && !step.complete && (
            <span className="text-[10px] text-text-muted font-mono">{step.estimatedTime}</span>
          )}
        </div>
        <div className="text-xs text-text-muted mt-0.5">
          {step.blocked ? step.blockReason : step.detail}
        </div>
      </div>

      {isClickable && step.primaryAction && (
        <button
          onClick={() => onAction(step)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 rounded transition-colors font-medium whitespace-nowrap"
        >
          {step.primaryAction}
        </button>
      )}
    </motion.div>
  );
}

export default function Day1Workspace() {
  const { persona } = usePersona();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [completedSteps, setCompletedSteps] = useState(new Set(['account']));

  const handleStepAction = (step) => {
    if (step.id === 'salesforce') {
      showToast('Salesforce OAuth flow would open here · book sync starts on success');
      // For demo, optimistically mark as complete + unblock next step
      setCompletedSteps((prev) => new Set([...prev, 'salesforce']));
    } else if (step.id === 'territory') {
      showToast('Territory review screen would open · 247 accounts to confirm');
      setCompletedSteps((prev) => new Set([...prev, 'territory']));
    } else if (step.id === 'first-triage') {
      showToast('Activating Daily Account Triage...');
      setTimeout(() => navigate('/use-cases'), 600);
    }
  };

  // Dynamically resolve step state based on what's been completed
  const resolvedSteps = SETUP_STEPS.map((s, idx) => {
    if (completedSteps.has(s.id)) return { ...s, complete: true };
    // Unblock step if its predecessor is now complete
    if (s.blocked) {
      const prevId = SETUP_STEPS[idx - 1]?.id;
      if (prevId && completedSteps.has(prevId)) {
        return { ...s, blocked: false };
      }
    }
    return s;
  });

  const completedCount = resolvedSteps.filter((s) => s.complete).length;
  const totalCount = resolvedSteps.length;
  const pct = (completedCount / totalCount) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome strip */}
      <section className="px-8 pt-10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Welcome to RGI, {persona.name.split(' ')[0]}
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
          You inherited a {persona.bookSize}-account book from {persona.inheritedFrom}. Let's get you to your first actionable insight in under 5 minutes.
        </p>
      </section>

      {/* Setup checklist */}
      <section className="px-8 pb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary">Get started</h2>
          <span className="text-xs text-text-muted">
            {completedCount} of {totalCount} complete
          </span>
        </div>

        <div className="h-1 bg-border/60 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6 }}
            className="h-full bg-success rounded-full"
          />
        </div>

        <div className="space-y-1.5">
          {resolvedSteps.map((s, i) => (
            <SetupStep key={s.id} step={s} index={i} onAction={handleStepAction} />
          ))}
        </div>
      </section>

      {/* Featured first use case */}
      <section className="px-8 pb-8">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Your first use case</h2>
        <div className="border border-primary/20 bg-primary/5 rounded-md p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-text-primary mb-0.5">
              Daily Account Triage
            </div>
            <div className="text-xs text-text-secondary leading-relaxed">
              Get your top accounts ranked by signal strength, ICP fit, and deal stage. The AI explains why each one matters today — so you start your day with action, not search.
            </div>
          </div>
          <button
            onClick={() => {
              showToast('Activating Daily Account Triage — connect Salesforce first to see your real book');
              navigate('/use-cases');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors flex-shrink-0 font-medium"
          >
            Start
            <ArrowRight size={11} />
          </button>
        </div>
      </section>

      {/* Examples from your team */}
      <section className="px-8 pb-8">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="text-sm font-semibold text-text-primary">From your team</h2>
          <span className="text-xs text-text-muted">read-only previews</span>
        </div>
        <p className="text-xs text-text-muted mb-3">
          See what active threads look like — your workspace will fill in as you start working.
        </p>

        <div className="space-y-1.5">
          {TEAM_EXAMPLES.map((ex) => (
            <button
              key={ex.threadId}
              onClick={() => navigate(`/thread/${ex.threadId}`)}
              className="w-full flex items-start gap-3 px-4 py-3 border border-border/60 hover:border-border-2 hover:bg-surface rounded-md transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-text-primary truncate">{ex.title}</span>
                  <span className="text-[10px] text-text-muted">· {ex.owner}</span>
                </div>
                <div className="text-xs text-text-muted leading-relaxed">{ex.description}</div>
              </div>
              <ExternalLink size={12} className="text-text-muted flex-shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </section>

      {/* Where to go next */}
      <section className="px-8 pb-12">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Where to go next</h2>
        <div className="space-y-1">
          {[
            {
              icon: Library,
              label: 'Use Case Library',
              detail: '10 workflows from prospecting to renewal — pick one to run',
              href: '/use-cases',
            },
            {
              icon: BookmarkCheck,
              label: 'Saved Library',
              detail: 'Where every list, brief, and draft you build will live forever',
              href: '/library',
            },
            {
              icon: Bot,
              label: 'Daily Digest in Slack',
              detail: 'Connect Slack to receive your top signals each morning at 8 AM',
              href: null,
              toast: 'Slack integration setup would open here',
            },
            {
              icon: Sparkles,
              label: 'Switch persona to see other workflows',
              detail: 'Maya (Marketing), Jordan (AE veteran), Priya (RevOps) — see how the platform shapes to each role',
              href: null,
              toast: 'Open Demo Controls (bottom right) to switch persona',
            },
          ].map((tip) => {
            const Icon = tip.icon;
            return (
              <button
                key={tip.label}
                onClick={() => {
                  if (tip.href) navigate(tip.href);
                  else if (tip.toast) showToast(tip.toast, 'info');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface rounded-md transition-colors text-left group"
              >
                <Icon size={14} className="text-text-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary font-medium">{tip.label}</div>
                  <div className="text-xs text-text-muted">{tip.detail}</div>
                </div>
                <ArrowRight
                  size={11}
                  className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
