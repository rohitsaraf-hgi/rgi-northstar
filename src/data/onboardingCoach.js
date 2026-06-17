// Onboarding Coach — task list shown to admins after they land in the
// platform via the wizard. Each task points the admin to a deeper admin
// surface (scoring, integrations, territory, users, SSO) and tracks its
// own completion state in localStorage.
//
// The coach is read by SetupCoach.jsx (floating widget). Per-task state
// can be derived from other stores (territory book size, offering store,
// integrations store) OR explicitly marked complete by the admin.

const STORAGE_KEY = 'rgi-onboarding-coach-v1';
const CHANGE_EVENT = 'rgi:onboarding-coach-changed';

// Canonical task list. Order = priority order shown to the admin.
export const COACH_TASKS = [
  {
    id: 'confirm_offerings',
    title: 'Confirm your offerings',
    description: 'AI-grouped from your products. Review pain points, ICP, competitors, and GTM motions.',
    valueUnlocked: 'Per-offering scoring + targeting',
    estimatedMinutes: 2,
    icon: 'Layers',
    accent: 'violet',
    route: '/admin/offerings',
    cta: 'Review offerings',
    autoDerivedKey: 'rgi-onboarding-confirmed-offerings', // set by wizard
  },
  {
    id: 'activate_plays',
    title: 'Activate your sales plays',
    description: 'Each play is a business motion composed of HG signals + firmo/techno filters.',
    valueUnlocked: 'Sellers see ranked accounts per play',
    estimatedMinutes: 3,
    icon: 'Swords',
    accent: 'rose',
    route: '/admin/plays',
    cta: 'Configure plays',
    autoDerivedKey: 'rgi-onboarding-activated-plays', // set by wizard
  },
  {
    id: 'confirm_scoring_models',
    title: 'Confirm scoring models',
    description: 'AI built Fit / Need / Intent models per offering. Review the top accounts and click "Go live".',
    valueUnlocked: 'Whitespace accounts scored against your offerings',
    estimatedMinutes: 5,
    icon: 'Sparkles',
    accent: 'sky',
    // Lands on /admin/offerings list — each offering card has a "Review model"
    // CTA into the builder where the admin clicks "Go live" to complete the task.
    route: '/admin/offerings',
    cta: 'Review scoring',
  },
  {
    id: 'add_book_of_accounts',
    title: 'Add your book of accounts',
    description: 'Connect Salesforce / HubSpot, OR upload a CSV. Without a book the platform shows whitespace only.',
    valueUnlocked: 'Workbook flips from whitespace-only to book + whitespace',
    estimatedMinutes: 8,
    icon: 'Database',
    accent: 'emerald',
    route: '/admin/territory',
    cta: 'Connect or upload',
    branched: true, // shows branching mini-menu when clicked
  },
  {
    id: 'design_territory',
    title: 'Design territory + assign sellers',
    description: 'Define routing rules (region, vertical, size) and balance the book across your sellers.',
    valueUnlocked: 'Each seller sees their own scoped book',
    estimatedMinutes: 6,
    icon: 'Network',
    accent: 'amber',
    route: '/admin/territory',
    cta: 'Design territory',
    dependsOn: ['add_book_of_accounts'],
  },
  {
    id: 'invite_sellers',
    title: 'Invite your sellers',
    description: 'Bulk-invite via magic link. Each seller lands in their pre-configured workbench.',
    valueUnlocked: 'Your team is activated',
    estimatedMinutes: 4,
    icon: 'UserPlus',
    accent: 'blue',
    route: '/admin/territory',
    cta: 'Invite sellers',
    dependsOn: ['design_territory'],
  },
  {
    id: 'configure_sso',
    title: 'Set up SSO (optional)',
    description: 'SAML / OIDC for your IDP. Recommended once your team grows beyond 10 sellers.',
    valueUnlocked: 'Centralized auth',
    estimatedMinutes: 10,
    icon: 'ShieldCheck',
    accent: 'slate',
    route: '/admin',
    cta: 'Configure SSO',
    optional: true,
  },
];

const DEFAULT_STATE = {
  // per-task manual completion flags (admin marks complete)
  completed: {},
  // per-task "in progress" flags (admin clicked CTA but hasn't returned)
  inProgress: {},
  dismissed: false,
  expanded: true, // first time = expanded; user can collapse
};

function safeParse(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

function readState() {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw && safeParse(raw);
  return { ...DEFAULT_STATE, ...(parsed || {}) };
}

function writeState(next) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // quota — ignore
  }
}

function isAutoDerivedComplete(task) {
  if (!task.autoDerivedKey) return false;
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(task.autoDerivedKey) !== null;
}

// ─── Public API ────────────────────────────────────────────────────────────

export function getCoachState() {
  const state = readState();
  const tasks = COACH_TASKS.map((task) => {
    const manualComplete = !!state.completed[task.id];
    const autoComplete = isAutoDerivedComplete(task);
    const inProgress = !!state.inProgress[task.id] && !manualComplete;
    return {
      ...task,
      complete: manualComplete || autoComplete,
      inProgress,
      // dependencies — show as gated if their deps aren't done
      gated: (task.dependsOn || []).some((depId) => {
        const dep = COACH_TASKS.find((t) => t.id === depId);
        if (!dep) return false;
        return !(state.completed[depId] || isAutoDerivedComplete(dep));
      }),
    };
  });

  const required = tasks.filter((t) => !t.optional);
  const completedCount = required.filter((t) => t.complete).length;
  const totalCount = required.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextTask = required.find((t) => !t.complete && !t.gated);

  return {
    tasks,
    dismissed: state.dismissed,
    expanded: state.expanded,
    completedCount,
    totalCount,
    percent,
    nextTask,
    allComplete: completedCount === totalCount,
  };
}

export function subscribeCoach(onChange) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  // Also listen to storage events for cross-tab + autoDerivedKey changes
  const storageHandler = () => onChange();
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

export function markTaskComplete(taskId) {
  const state = readState();
  writeState({
    ...state,
    completed: { ...state.completed, [taskId]: true },
    inProgress: { ...state.inProgress, [taskId]: false },
  });
}

export function markTaskIncomplete(taskId) {
  const state = readState();
  const completed = { ...state.completed };
  delete completed[taskId];
  writeState({ ...state, completed });
}

export function markTaskInProgress(taskId) {
  const state = readState();
  writeState({
    ...state,
    inProgress: { ...state.inProgress, [taskId]: true },
  });
}

export function setCoachExpanded(expanded) {
  const state = readState();
  writeState({ ...state, expanded });
}

export function dismissCoach() {
  const state = readState();
  writeState({ ...state, dismissed: true });
}

export function restoreCoach() {
  const state = readState();
  writeState({ ...state, dismissed: false, expanded: true });
}

export function resetCoach() {
  writeState(DEFAULT_STATE);
}
