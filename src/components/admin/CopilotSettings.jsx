import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Circle,
  ChevronRight,
  Plus,
  Sparkles,
  Swords,
  Handshake,
  HelpCircle,
} from 'lucide-react';
import { COPILOT_SETTINGS_STEPS, COMPETITORS, PARTNERS } from '../../data/adminHub.js';
import { useToast } from '../../context/ToastContext.jsx';

function StatusDot({ status }) {
  if (status === 'complete') {
    return (
      <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
        <Check size={11} className="text-success" />
      </div>
    );
  }
  if (status === 'in_progress') {
    return (
      <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
        4
      </div>
    );
  }
  return <Circle size={18} className="text-border-2 flex-shrink-0" />;
}

function TierBadge({ tier }) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
        tier === 'Primary'
          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
          : 'bg-text-muted/15 text-text-secondary'
      }`}
    >
      {tier}
    </span>
  );
}

function CompetitorRow({ comp }) {
  return (
    <div className="border-b border-border last:border-0 px-5 py-4">
      <div className="flex items-start justify-between mb-2 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="text-base font-semibold text-text-primary truncate">{comp.name}</div>
          <TierBadge tier={comp.tier} />
        </div>
        <div className="text-xs text-text-secondary whitespace-nowrap">{comp.category}</div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {comp.products.map((p) => (
          <span
            key={p}
            className="px-2 py-0.5 bg-rose-500/10 text-rose-700 dark:text-rose-300 rounded text-xs"
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

function PartnerRow({ p }) {
  return (
    <div className="flex items-center justify-between border-b border-border last:border-0 px-5 py-4">
      <div>
        <div className="text-sm font-medium text-text-primary">{p.name}</div>
        <div className="text-xs text-text-secondary">{p.subtitle}</div>
      </div>
      <span className="px-2.5 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
        {p.badge}
      </span>
    </div>
  );
}

export default function CopilotSettings() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeStep, setActiveStep] = useState('competitors');

  const completedCount = COPILOT_SETTINGS_STEPS.filter((s) => s.status === 'complete').length;
  const total = COPILOT_SETTINGS_STEPS.length;

  return (
    <div className="h-full flex">
      {/* Left sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-border bg-surface/40 overflow-y-auto thin-scrollbar">
        <div className="p-5 border-b border-border">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft size={12} />
            Back to Admin Home
          </button>
          <div className="text-xs text-text-muted mb-1">Copilot Settings</div>
          <div className="text-sm text-text-primary font-medium">{completedCount} of {total} steps</div>

          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-md">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles size={11} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                AI-Powered · Zero Config
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Defaults are AI-authored from your CRM, website, and deal history. Edit only what you want to override.
            </p>
          </div>
        </div>

        <nav className="p-2">
          {COPILOT_SETTINGS_STEPS.map((step, i) => {
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-md transition-colors text-left ${
                  isActive ? 'bg-primary/10' : 'hover:bg-surface'
                }`}
              >
                <StatusDot status={step.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm font-medium truncate ${
                        isActive ? 'text-primary' : step.status === 'complete' ? 'text-text-primary' : 'text-text-secondary'
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.aiAuthored && <Sparkles size={9} className="text-primary flex-shrink-0" />}
                  </div>
                  {isActive && (
                    <div className="text-[10px] text-text-muted mt-0.5">{step.summary}</div>
                  )}
                </div>
                {isActive && <ChevronRight size={14} className="text-primary mt-0.5 flex-shrink-0" />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {activeStep === 'competitors' && (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-2">
                      Competitors & Partners
                    </h1>
                    <p className="text-sm text-text-secondary max-w-2xl">
                      Define your competitive landscape so Copilot can trigger displacement plays and contextualize signals.
                    </p>
                  </div>
                  <button
                    onClick={() => showToast('Add Company flow would open here')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dim transition-colors"
                  >
                    <Plus size={14} />
                    Add Company
                  </button>
                </div>

                {/* Competitors */}
                <section className="bg-surface border border-border rounded-lg overflow-hidden mb-5">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Swords size={16} className="text-rose-700 dark:text-rose-300" />
                      <h2 className="text-sm font-semibold text-text-primary">Competitors</h2>
                    </div>
                    <span className="text-xs text-text-muted">{COMPETITORS.length} tracked</span>
                  </div>
                  {COMPETITORS.map((c) => (
                    <CompetitorRow key={c.id} comp={c} />
                  ))}
                </section>

                {/* Partners */}
                <section className="bg-surface border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Handshake size={16} className="text-success" />
                      <h2 className="text-sm font-semibold text-text-primary">Partners</h2>
                    </div>
                    <span className="text-xs text-text-muted">{PARTNERS.length} connected</span>
                  </div>
                  {PARTNERS.map((p) => (
                    <PartnerRow key={p.id} p={p} />
                  ))}
                </section>

                <div className="mt-6 flex items-center justify-between">
                  <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors">
                    <HelpCircle size={11} />
                    How Copilot uses this
                  </button>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        showToast('Competitors & Partners saved');
                      }}
                      className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-dim transition-colors"
                    >
                      Save & Continue →
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeStep !== 'competitors' && (
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-2">
                  {COPILOT_SETTINGS_STEPS.find((s) => s.id === activeStep)?.title}
                </h1>
                <p className="text-sm text-text-secondary mb-6">
                  {COPILOT_SETTINGS_STEPS.find((s) => s.id === activeStep)?.summary}
                </p>
                <div className="bg-surface border border-border rounded-lg p-12 text-center">
                  <Sparkles size={20} className="text-primary mx-auto mb-3" />
                  <div className="text-sm font-medium text-text-primary mb-1">
                    AI has authored your defaults
                  </div>
                  <div className="text-xs text-text-secondary max-w-md mx-auto">
                    Settings for this step were generated automatically based on your CRM, website, and historical deal data. Click any item to review or override.
                  </div>
                  <button className="mt-4 px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-md hover:bg-primary hover:text-white transition-colors">
                    Review AI-authored defaults
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
