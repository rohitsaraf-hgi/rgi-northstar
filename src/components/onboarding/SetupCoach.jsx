import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  X,
  Check,
  CheckCircle2,
  Circle,
  ArrowRight,
  Layers,
  Swords,
  Database,
  Network,
  UserPlus,
  ShieldCheck,
  Clock,
  Lock,
  Upload,
  Plug,
} from 'lucide-react';
import {
  getCoachState,
  subscribeCoach,
  markTaskComplete,
  markTaskInProgress,
  setCoachExpanded,
  dismissCoach,
} from '../../data/onboardingCoach.js';

const ICONS = {
  Layers,
  Swords,
  Sparkles,
  Database,
  Network,
  UserPlus,
  ShieldCheck,
};

const ACCENT_CLASSES = {
  violet:  { bg: 'bg-violet-500/15',  color: 'text-violet-700 dark:text-violet-300',     border: 'border-violet-500/30' },
  rose:    { bg: 'bg-rose-500/15',    color: 'text-rose-700 dark:text-rose-300',         border: 'border-rose-500/30' },
  sky:     { bg: 'bg-sky-500/15',     color: 'text-sky-700 dark:text-sky-300',           border: 'border-sky-500/30' },
  emerald: { bg: 'bg-emerald-500/15', color: 'text-emerald-700 dark:text-emerald-300',   border: 'border-emerald-500/30' },
  amber:   { bg: 'bg-amber-500/15',   color: 'text-amber-700 dark:text-amber-300',       border: 'border-amber-500/30' },
  blue:    { bg: 'bg-blue-500/15',    color: 'text-blue-700 dark:text-blue-300',         border: 'border-blue-500/30' },
  slate:   { bg: 'bg-slate-500/15',   color: 'text-slate-700 dark:text-slate-300',       border: 'border-slate-500/30' },
};

function accentFor(name) {
  return ACCENT_CLASSES[name] || ACCENT_CLASSES.violet;
}

export default function SetupCoach() {
  const navigate = useNavigate();
  const [state, setState] = useState(() => getCoachState());
  const [branchMenuFor, setBranchMenuFor] = useState(null);

  useEffect(() => {
    return subscribeCoach(() => setState(getCoachState()));
  }, []);

  if (state.dismissed) return null;
  if (state.allComplete) return <AllCompletePill onDismiss={() => dismissCoach()} />;

  function toggleExpanded() {
    setCoachExpanded(!state.expanded);
  }

  function handleTaskClick(task) {
    if (task.gated) return;
    if (task.branched) {
      setBranchMenuFor(task.id);
      return;
    }
    markTaskInProgress(task.id);
    navigate(task.route);
  }

  function handleMarkComplete(taskId, e) {
    e.stopPropagation();
    markTaskComplete(taskId);
  }

  function handleBranchPick(taskId, route) {
    markTaskInProgress(taskId);
    setBranchMenuFor(null);
    navigate(route);
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full">
      <AnimatePresence mode="wait">
        {state.expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
          >
            <CoachHeader
              state={state}
              onCollapse={toggleExpanded}
              onDismiss={() => dismissCoach()}
            />
            <div className="max-h-[60vh] overflow-y-auto">
              {state.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onClick={() => handleTaskClick(task)}
                  onMarkComplete={(e) => handleMarkComplete(task.id, e)}
                  isBranchOpen={branchMenuFor === task.id}
                  onCloseBranch={() => setBranchMenuFor(null)}
                  onBranchPick={(route) => handleBranchPick(task.id, route)}
                />
              ))}
            </div>
            <CoachFooter nextTask={state.nextTask} onJump={() => state.nextTask && handleTaskClick(state.nextTask)} />
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={toggleExpanded}
            className="flex items-center gap-2 bg-surface border border-border hover:border-primary/40 rounded-full pl-2 pr-3 py-1.5 shadow-lg group ml-auto"
          >
            <div className="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center">
              <Sparkles size={12} className="text-violet-700 dark:text-violet-300" />
            </div>
            <div className="text-[12px]">
              <span className="font-semibold text-text-primary">Setup</span>
              <span className="text-text-secondary ml-1.5">
                {state.completedCount} of {state.totalCount}
              </span>
            </div>
            <div className="w-12 h-1 bg-bg/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all"
                style={{ width: `${state.percent}%` }}
              />
            </div>
            <ChevronUp size={11} className="text-text-muted group-hover:text-text-primary" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function CoachHeader({ state, onCollapse, onDismiss }) {
  return (
    <div className="px-4 py-3 bg-violet-500/5 border-b border-border">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-md bg-violet-500/15 flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-violet-700 dark:text-violet-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Complete your setup</h3>
            <p className="text-[11px] text-text-secondary">
              <strong className="text-text-primary">{state.completedCount}</strong> of {state.totalCount} steps complete
              {state.nextTask && (
                <span className="text-text-muted"> · next: {state.nextTask.title}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onCollapse}
            className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-bg/60"
            title="Collapse"
          >
            <ChevronDown size={13} />
          </button>
          <button
            onClick={onDismiss}
            className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-bg/60"
            title="Dismiss (you can re-open from the header)"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 bg-bg/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all"
          style={{ width: `${state.percent}%` }}
        />
      </div>
    </div>
  );
}

function TaskRow({ task, onClick, onMarkComplete, isBranchOpen, onCloseBranch, onBranchPick }) {
  const accent = accentFor(task.accent);
  const Icon = ICONS[task.icon] || Sparkles;

  return (
    <div
      className={`relative border-b border-border/60 last:border-b-0 ${
        task.gated ? 'opacity-50' : ''
      }`}
    >
      <button
        onClick={onClick}
        disabled={task.gated}
        className="w-full text-left px-4 py-3 hover:bg-bg/40 transition-colors flex items-start gap-3 disabled:cursor-not-allowed"
      >
        {/* Completion indicator */}
        <div className="flex-shrink-0 mt-0.5">
          {task.complete ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check size={11} className="text-emerald-700 dark:text-emerald-300" />
            </div>
          ) : task.gated ? (
            <div className="w-5 h-5 rounded-full bg-bg/60 flex items-center justify-center">
              <Lock size={10} className="text-text-muted" />
            </div>
          ) : task.inProgress ? (
            <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          ) : (
            <Circle size={18} className="text-text-muted/60" />
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className={`w-7 h-7 rounded ${accent.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={12} className={accent.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h4 className={`text-[13px] font-semibold ${task.complete ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                  {task.title}
                </h4>
                {task.optional && (
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-2 text-text-muted font-bold">
                    Optional
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed mb-1">{task.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-text-muted">
                <span className="inline-flex items-center gap-0.5">
                  <Clock size={9} /> ~{task.estimatedMinutes} min
                </span>
                <span className="inline-flex items-center gap-0.5 text-text-secondary">
                  <Sparkles size={9} className={accent.color} /> {task.valueUnlocked}
                </span>
              </div>
            </div>

            {/* CTA */}
            {!task.complete && !task.gated && (
              <div className="flex-shrink-0">
                <span className={`text-[11px] inline-flex items-center gap-0.5 font-semibold ${accent.color}`}>
                  {task.cta}
                  <ArrowRight size={10} />
                </span>
              </div>
            )}
          </div>

          {/* Mark complete affordance — only show if not complete and in progress */}
          {!task.complete && task.inProgress && (
            <div className="mt-1.5 pl-9">
              <button
                onClick={onMarkComplete}
                className="text-[10px] text-emerald-700 dark:text-emerald-300 hover:underline inline-flex items-center gap-1"
              >
                <CheckCircle2 size={10} /> Mark complete
              </button>
            </div>
          )}
        </div>
      </button>

      {/* Branch menu (data source choice) */}
      <AnimatePresence>
        {isBranchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-bg/60 border-t border-border overflow-hidden"
          >
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                  Pick a method
                </span>
                <button onClick={onCloseBranch} className="text-text-muted hover:text-text-primary">
                  <X size={11} />
                </button>
              </div>
              <button
                onClick={() => onBranchPick('/admin/apps')}
                className="w-full text-left bg-surface border border-border hover:border-primary/40 rounded p-2.5 flex items-start gap-2 transition-colors"
              >
                <Plug size={13} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[12px] font-semibold text-text-primary">Connect Salesforce / HubSpot</div>
                  <div className="text-[11px] text-text-secondary leading-relaxed">
                    OAuth into your CRM. Pulls accounts, contacts, opportunities. Bi-directional sync.
                  </div>
                </div>
              </button>
              <button
                onClick={() => onBranchPick('/admin/territory')}
                className="w-full text-left bg-surface border border-border hover:border-primary/40 rounded p-2.5 flex items-start gap-2 transition-colors"
              >
                <Upload size={13} className="text-violet-700 dark:text-violet-300 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[12px] font-semibold text-text-primary">Upload Book CSV</div>
                  <div className="text-[11px] text-text-secondary leading-relaxed">
                    No CRM yet? Upload owner_email, account_name, account_domain — AI resolves to HG entities.
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CoachFooter({ nextTask, onJump }) {
  return (
    <div className="px-4 py-2.5 bg-bg/40 border-t border-border flex items-center justify-between">
      <div className="text-[11px] text-text-muted">
        You can keep working — finish setup any time.
      </div>
      {nextTask && (
        <button
          onClick={onJump}
          className="text-[11px] px-2 py-1 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 font-semibold inline-flex items-center gap-1"
        >
          Jump to next <ArrowRight size={10} />
        </button>
      )}
    </div>
  );
}

function AllCompletePill({ onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-500/10 border border-emerald-500/30 rounded-full pl-2 pr-3 py-1.5 shadow-lg flex items-center gap-2"
      >
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 size={14} className="text-emerald-700 dark:text-emerald-300" />
        </div>
        <span className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">Setup complete</span>
        <button onClick={onDismiss} className="text-emerald-700/60 hover:text-emerald-700">
          <X size={12} />
        </button>
      </motion.div>
    </div>
  );
}
