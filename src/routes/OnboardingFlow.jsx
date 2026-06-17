import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  TrendingUp,
  Settings,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { usePersona } from '../context/PersonaContext.jsx';
import { useAIThinking } from '../context/AIThinkingContext.jsx';
import Typewriter from '../components/shared/Typewriter.jsx';
import ArtifactCard from '../components/thread/ArtifactCard.jsx';

const ROLES = [
  {
    id: 'maya',
    title: 'Marketing & Strategy',
    description: 'I define markets, segments, and ICPs',
    icon: Target,
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    departments: ['Marketing', 'Strategy', 'Product Marketing', 'Demand Gen', 'GTM Strategy'],
  },
  {
    id: 'jordan',
    title: 'Sales & Pipeline',
    description: 'I build pipeline and close deals',
    icon: TrendingUp,
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    departments: ['AE / Account Executive', 'AM / Account Manager', 'Full-Cycle Rep', 'SDR / BDR', 'Sales Manager'],
  },
  {
    id: 'priya',
    title: 'Revenue Operations',
    description: 'I configure the platform and manage data quality',
    icon: Settings,
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    departments: ['RevOps', 'Sales Ops', 'Marketing Ops', 'GTM Engineering', 'Data / Analytics'],
  },
  {
    id: 'exec',
    title: 'Executive & Leadership',
    description: 'I need visibility into market position and pipeline',
    icon: BarChart3,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    departments: ['CRO', 'CMO', 'VP Sales', 'VP Marketing', 'CFO / Finance'],
  },
];

const TEAM_SIZES = ['Just me', '2–10', '11–50', '51–200', '200+'];

const SUGGESTIONS = {
  maya: {
    heading: "Let's define your target market",
    subtext: "I'll help you build your first ICP segment. You'll end up with a scored list of target companies. Takes about 3 minutes.",
    cta: 'Build my first segment →',
    firstTurn: "Got it. To build your first ICP segment, I need three things — a vertical to target, a geography, and a rough company size band. What's top of mind?",
    artifact: {
      type: 'SEGMENT',
      name: 'Fintech Mid-Market — Initial Build',
      meta: '3,200 candidates · Very Good: 280 · Good: 720',
      version: 'v0.1',
    },
    landing: '/workspace',
    landingLabel: 'Go to your workspace',
  },
  jordan: {
    heading: "Let's plan your day",
    subtext: "I'll surface which accounts in your book need attention right now — ranked by signal strength and ICP fit. Takes about 2 minutes.",
    cta: 'Show me my top accounts →',
    firstTurn: "Pulling signals across your book of 247 accounts. I'll rank them by intent strength, recency, and ICP fit. Give me a moment...",
    artifact: {
      type: 'BRIEF',
      name: "Today's Top 5 Plays",
      meta: '5 accounts · 3 high-intent · 2 stakeholder changes',
      version: 'v1',
    },
    landing: '/workspace',
    landingLabel: 'Go to your workspace',
  },
  priya: {
    heading: "Let's get your platform setup",
    subtext: "Most defaults are AI-authored from your CRM, website, and historical data — you'll only review what matters. The full setup takes about 15 minutes.",
    cta: 'Open my Setup Guide →',
    firstTurn: "Inspecting your current platform state. AI-authoring defaults for personas, ICP, competitors, and intent topics from your CRM and website. Most settings will be ready before you touch them...",
    artifact: {
      type: 'REPORT',
      name: 'Platform Setup — Initial Scan',
      meta: '4 of 6 steps complete · 1 blocker (HubSpot OAuth) · AI-authored defaults ready',
      version: 'v1',
    },
    landing: '/admin',
    landingLabel: 'Open Admin Hub',
  },
  exec: {
    heading: "Let's give you a market position snapshot",
    subtext: "I'll generate an executive view of your pipeline, market share, and platform-driven contribution. Takes about 3 minutes.",
    cta: 'Show me the snapshot →',
    firstTurn: 'Compiling the executive view. Drawing from Q2 pipeline data, market sizing, and platform attribution...',
    artifact: {
      type: 'REPORT',
      name: 'Q2 Executive Snapshot',
      meta: '$2.1M influenced · 34% from platform · 127 net-new accounts',
      version: 'v1',
    },
    landing: '/roi',
    landingLabel: 'Open ROI Dashboard',
  },
};

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const { switchPersona } = usePersona();
  const { simulateThinking } = useAIThinking();

  const [screen, setScreen] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [department, setDepartment] = useState(null);
  const [teamSize, setTeamSize] = useState(null);
  const [showArtifact, setShowArtifact] = useState(false);
  const [busy, setBusy] = useState(false);

  const role = selectedRole ? ROLES.find((r) => r.id === selectedRole) : null;
  const suggestion = selectedRole ? SUGGESTIONS[selectedRole] : null;

  const handleRolePick = (id) => {
    setSelectedRole(id);
    setDepartment(null);
    setTimeout(() => setScreen(2), 400);
  };

  const handleContextSubmit = () => {
    const personaTarget = selectedRole === 'exec' ? 'maya' : selectedRole;
    switchPersona(personaTarget);
    setScreen(3);
  };

  const startGuidedThread = async () => {
    setScreen(4);
    setBusy(true);
    await simulateThinking(1200, 1800);
    setShowArtifact(true);
    setBusy(false);
  };

  const goToLanding = () => {
    navigate(suggestion?.landing || '/workspace');
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8">
      <AnimatePresence mode="wait">
        {/* SCREEN 1 — Role Declaration */}
        {screen === 1 && (
          <motion.div
            key="screen1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl w-full"
          >
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center font-bold text-sm text-white">
                  HG
                </div>
                <div className="text-lg font-semibold tracking-tight">RGI Platform</div>
              </div>
              <div className="text-xs text-text-muted mb-3">Step 1 of 3</div>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">
                What best describes your role?
              </h1>
              <p className="text-text-secondary text-sm">
                We'll personalize your workspace and surface the most relevant use cases for you.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <motion.button
                    key={r.id}
                    onClick={() => handleRolePick(r.id)}
                    whileHover={{ scale: isSelected ? 1.02 : 1.01 }}
                    animate={isSelected ? { scale: 1.04 } : { scale: 1 }}
                    className={`p-6 rounded-xl border-2 text-left transition-colors ${
                      isSelected
                        ? `${r.bg} ${r.border} ring-2 ring-primary/50`
                        : 'bg-surface border-border hover:border-border-2'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${r.bg} ${r.border} border flex items-center justify-center mb-4`}>
                      <Icon size={18} className={r.color} />
                    </div>
                    <div className="text-base font-semibold text-text-primary mb-1">{r.title}</div>
                    <div className="text-xs text-text-secondary leading-relaxed">{r.description}</div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* SCREEN 2 — Department + Team Size */}
        {screen === 2 && role && (
          <motion.div
            key="screen2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="max-w-xl w-full"
          >
            <div className="mb-8">
              <button
                onClick={() => setScreen(1)}
                className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary mb-4 transition-colors"
              >
                <ArrowLeft size={12} />
                Back
              </button>
              <div className="text-xs text-text-muted mb-2">Step 2 of 3</div>
              <h1 className="text-2xl font-semibold tracking-tight mb-2">A bit more about your role</h1>
              <p className="text-sm text-text-secondary">
                This helps us tailor your use case library and notifications.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-muted font-semibold mb-2.5">
                  Department / function
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {role.departments.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDepartment(d)}
                      className={`text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                        department === d
                          ? 'bg-primary/10 border-primary/40 text-text-primary'
                          : 'bg-bg/40 border-border text-text-secondary hover:border-border-2 hover:text-text-primary'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-text-muted font-semibold mb-2.5">
                  How big is your team?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TEAM_SIZES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTeamSize(t)}
                      className={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
                        teamSize === t
                          ? 'bg-primary/10 border-primary/40 text-text-primary'
                          : 'bg-bg/40 border-border text-text-secondary hover:border-border-2'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleContextSubmit}
                disabled={!department || !teamSize}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continue
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* SCREEN 3 — Suggestion */}
        {screen === 3 && suggestion && (
          <motion.div
            key="screen3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl w-full"
          >
            <div className="text-center mb-8">
              <div className="text-xs text-text-muted mb-3">Step 3 of 3</div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary mb-6">
                <Sparkles size={11} />
                Personalized for {department}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight mb-3">{suggestion.heading}</h1>
              <p className="text-text-secondary text-sm leading-relaxed max-w-lg mx-auto">
                {suggestion.subtext}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setScreen(2)}
                className="px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Back
              </button>
              <button
                onClick={startGuidedThread}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dim transition-colors"
              >
                {suggestion.cta}
              </button>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => navigate(suggestion.landing || '/workspace')}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                Skip and {suggestion.landingLabel.toLowerCase()} →
              </button>
            </div>
          </motion.div>
        )}

        {/* SCREEN 4 — Guided First Use Case */}
        {screen === 4 && suggestion && (
          <motion.div
            key="screen4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl w-full"
          >
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-primary/15 rounded-md flex items-center justify-center">
                  <Sparkles size={12} className="text-primary" />
                </div>
                <span className="text-sm font-semibold text-text-primary">RGI</span>
                <span className="text-xs text-text-muted">Setting up your first thread</span>
              </div>

              <div className="text-sm text-text-primary leading-relaxed pl-3 border-l-2 border-primary/30">
                <Typewriter text={suggestion.firstTurn} speed={20} />
              </div>

              {busy && (
                <div className="mt-4 flex items-center gap-1.5 pl-3">
                  <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
                </div>
              )}

              {showArtifact && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5"
                >
                  <div className="text-xs text-text-secondary mb-2">
                    Your first workspace thread is ready. Here's what we built:
                  </div>
                  <ArtifactCard artifact={suggestion.artifact} inline />
                  <button
                    onClick={goToLanding}
                    className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dim transition-colors"
                  >
                    {suggestion.landingLabel}
                    <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
