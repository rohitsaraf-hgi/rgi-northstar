import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileDown, TrendingUp, AlertTriangle, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { usePersona } from '../context/PersonaContext.jsx';
import { useDemo } from '../context/DemoContext.jsx';
import { useModuleDetail } from '../context/ModuleDetailContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ROI_DATA } from '../data/personaContent.js';
import { USE_CASES } from '../data/useCases.js';
import { MODULE_DEFINITIONS, USE_CASE_MODULE_MAP, useCaseAvailability, moduleById } from '../data/modules.js';

const ACCENT_MAP = {
  primary: 'text-primary border-primary/20',
  success: 'text-success border-success/20',
  warning: 'text-warning border-warning/20',
};

function StatCard({ label, value, accent = 'primary', large = false }) {
  const accentClass = ACCENT_MAP[accent] || ACCENT_MAP.primary;
  return (
    <div className={`bg-surface border ${accentClass} rounded-lg p-5`}>
      <div className={`font-semibold tracking-tight ${large ? 'text-3xl' : 'text-2xl'} text-text-primary`}>
        {value}
      </div>
      <div className="text-xs text-text-secondary mt-1">{label}</div>
    </div>
  );
}

function MyValueTab() {
  const { persona, personaId } = usePersona();
  const data = ROI_DATA[personaId]?.myValue;
  if (!data) return null;

  return (
    <motion.div
      key={personaId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-2 text-xs text-text-muted">{persona.name} · This Week</div>
      <h2 className="text-2xl font-semibold tracking-tight mb-6">Your Impact This Week</h2>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {data.stats.map((s, i) => (
          <StatCard key={i} label={s.label} value={s.value} />
        ))}
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-wider text-text-muted">
          <TrendingUp size={12} />
          Activity Summary
        </div>
        <p className="text-sm text-text-primary leading-relaxed">{data.narrative}</p>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="text-xs uppercase tracking-wider text-text-muted mb-3">This Week's Timeline</div>
        <div className="space-y-3">
          {data.timeline.map((t, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <div className="w-12 flex-shrink-0 text-xs text-text-muted font-mono pt-0.5">{t.date}</div>
              <div className="flex-1 text-text-primary">{t.event}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function PlatformValueTab() {
  const { showToast } = useToast();
  const data = ROI_DATA.platformValue;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="mb-2 text-xs text-text-muted">For Economic Buyers · Q2 2026</div>
          <h2 className="text-2xl font-semibold tracking-tight">Q2 2026 Platform Value Summary</h2>
        </div>
        <button
          onClick={() => showToast('PDF generation queued')}
          className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-md text-xs text-text-secondary hover:bg-surface hover:text-text-primary hover:border-border-2 transition-colors"
        >
          <FileDown size={12} />
          Share as PDF
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {data.headline.map((s, i) => (
          <StatCard key={i} label={s.label} value={s.value} accent={s.accent} large />
        ))}
      </div>

      {/* What the Platform Found */}
      <div className="bg-surface border border-border rounded-lg p-6 mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-1">What the Platform Found</h3>
        <p className="text-xs text-text-secondary mb-4">Accounts identified by use case</p>
        <div className="space-y-2.5">
          {data.accountsByUseCase.map((row) => {
            const pct = (row.count / row.max) * 100;
            return (
              <div key={row.useCase}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-secondary">{row.useCase}</span>
                  <span className="font-mono text-text-primary">{row.count}</span>
                </div>
                <div className="h-1.5 bg-bg/60 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Funnel */}
      <div className="bg-surface border border-border rounded-lg p-6 mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-1">What Converted (Pipeline Provenance)</h3>
        <p className="text-xs text-text-secondary mb-4">From identification to closed-won</p>
        <div className="space-y-2">
          {data.funnel.map((row, i) => {
            const maxValue = data.funnel[0].value;
            const widthPct = 30 + (row.value / maxValue) * 70;
            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="bg-gradient-to-r from-primary/30 to-primary/15 border border-primary/30 rounded px-3 py-2 text-sm font-medium text-text-primary"
                  style={{ width: `${widthPct}%`, minWidth: '180px' }}
                >
                  {row.stage}
                </div>
                {row.sub && <div className="text-xs text-text-muted">{row.sub}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* How the Team Worked Smarter */}
      <div className="bg-surface border border-border rounded-lg p-6 mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-1">How the Team Worked Smarter</h3>
        <p className="text-xs text-text-secondary mb-5">Before/after on key motion metrics</p>
        <div className="grid grid-cols-2 gap-4">
          {data.workSmarter.map((row, i) => (
            <div key={i} className="bg-bg/40 border border-border rounded-md p-4">
              <div className="text-xs text-text-secondary mb-3">{row.label}</div>
              <div className="flex items-end justify-between gap-3">
                <div className="flex-1">
                  <div className="text-xs text-text-muted mb-1">{row.before.tag}</div>
                  <div className="text-lg font-semibold text-text-secondary line-through decoration-text-muted">
                    {row.before.value}
                  </div>
                </div>
                <div className="text-text-muted">→</div>
                <div className="flex-1">
                  <div className="text-xs text-success mb-1">{row.after.tag}</div>
                  <div className="text-lg font-semibold text-text-primary">{row.after.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expansion Opportunities */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <AlertTriangle size={14} className="text-warning" />
          Where There's More Value Available
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {data.expansionOpportunities.map((opp, i) => (
            <div key={i} className="bg-surface border border-warning/30 rounded-lg p-4">
              <div className="text-sm font-medium text-text-primary mb-1.5">{opp.title}</div>
              <div className="text-xs text-text-secondary leading-relaxed">{opp.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Top expansion recommendation per persona — used on Plan Coverage tab
const RECOMMENDATIONS = {
  jordan: {
    moduleId: 'data_studio',
    quantified: [
      'Inbound Lead Qualification → ~$180K pipeline influence/quarter',
      'Account Scoring (full depth) → estimated 15% conversion lift',
      'PQL Generation → ~40 additional SQLs/month',
    ],
  },
  maya: {
    moduleId: 'data_studio',
    quantified: [
      'Whitespace Analysis → full 5-stage depth (currently stops at scoring)',
      'Account Scoring (full depth) → unlocks ICP tier publishing',
      'Multi-Product Account Scoring → cross-sell map across active ICPs',
    ],
  },
  priya: {
    moduleId: 'data_studio',
    quantified: [
      'Inbound Lead Qualification → 40 hrs/month manual review reclaimed',
      'Multi-Product Account Scoring → simultaneous ICP scoring for cross-sell',
      'Tune Scoring Model → continuous model drift monitoring',
    ],
  },
};

function CoverageMatrix({ modulesOwned }) {
  const useCasesShown = USE_CASES.filter((u) => USE_CASE_MODULE_MAP[u.id] && !u.requiresAdmin);

  const cellState = (useCaseId, moduleId) => {
    const stages = USE_CASE_MODULE_MAP[useCaseId]?.stages || [];
    const stagesUsing = stages.filter((s) => s === moduleId).length;
    if (stagesUsing === 0) return 'none';
    const owned = modulesOwned.includes(moduleId);
    if (!owned) return 'locked';
    const total = stages.length;
    if (stagesUsing >= total / 2) return 'full';
    return 'partial';
  };

  const cellRender = (state) => {
    if (state === 'full') return <span className="text-success font-mono">██</span>;
    if (state === 'partial') return <span className="text-success/60 font-mono">▒▒</span>;
    if (state === 'locked') return <Lock size={11} className="text-warning" />;
    return <span className="text-text-muted/40 font-mono">░░</span>;
  };

  const userModules = MODULE_DEFINITIONS.filter((m) => !m.isExpansion);

  return (
    <div className="overflow-x-auto border border-border rounded-md">
      <table className="w-full text-xs">
        <thead className="bg-bg/40">
          <tr>
            <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-text-muted font-bold sticky left-0 bg-bg/60">
              Use Case
            </th>
            {userModules.map((m) => (
              <th
                key={m.id}
                className="text-center px-2 py-2 text-[10px] uppercase tracking-wider font-bold whitespace-nowrap"
                style={{ color: m.color }}
              >
                {m.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {useCasesShown.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="px-3 py-2 text-text-primary sticky left-0 bg-surface">{u.name}</td>
              {userModules.map((m) => (
                <td key={m.id} className="text-center px-2 py-2">
                  {cellRender(cellState(u.id, m.id))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlanCoverageTab() {
  const { persona, personaId } = usePersona();
  const { config } = useDemo();
  const { open: openModuleModal } = useModuleDetail();

  const summary = useMemo(() => {
    let fully = 0;
    let withGaps = 0;
    for (const u of USE_CASES) {
      if (!USE_CASE_MODULE_MAP[u.id] || u.requiresAdmin) continue;
      const a = useCaseAvailability(u.id, config.modulesOwned);
      if (a.state === 'available') fully++;
      else if (a.state === 'partial') withGaps++;
    }
    return { fully, withGaps };
  }, [config.modulesOwned]);

  const rec = RECOMMENDATIONS[personaId] || RECOMMENDATIONS.jordan;
  const recModule = moduleById(rec.moduleId);
  const recAlreadyOwned = config.modulesOwned.includes(rec.moduleId);

  // If recommended is already owned, find the next missing core module
  const altModuleId = !recAlreadyOwned
    ? rec.moduleId
    : MODULE_DEFINITIONS.find((m) => !m.isExpansion && !config.modulesOwned.includes(m.id))?.id;
  const showRec = altModuleId;
  const recM = moduleById(altModuleId) || recModule;

  // Compute how many use cases would be unlocked at full depth by adding the recommended module
  const unlockCount = useMemo(() => {
    if (!altModuleId) return 0;
    let n = 0;
    for (const u of USE_CASES) {
      if (!USE_CASE_MODULE_MAP[u.id] || u.requiresAdmin) continue;
      const before = useCaseAvailability(u.id, config.modulesOwned);
      const after = useCaseAvailability(u.id, [...config.modulesOwned, altModuleId]);
      if (after.state === 'available' && before.state !== 'available') n++;
    }
    return n;
  }, [altModuleId, config.modulesOwned]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="mb-2 text-xs text-text-muted">
        {persona.name} · Active modules: {config.modulesOwned.length} of {MODULE_DEFINITIONS.length}
      </div>
      <h2 className="text-2xl font-semibold tracking-tight mb-2">Plan Coverage</h2>
      <p className="text-sm text-text-secondary mb-6 max-w-3xl">
        Which use cases your current modules cover, where the gaps are, and what unlocking a missing module would deliver.
      </p>

      {/* Coverage Matrix */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Coverage Matrix</h3>
        <CoverageMatrix modulesOwned={config.modulesOwned} />
        <div className="flex items-center gap-3 mt-3 text-[10px] text-text-muted flex-wrap">
          <span className="flex items-center gap-1">
            <span className="text-success font-mono">██</span> Full contribution
          </span>
          <span className="flex items-center gap-1">
            <span className="text-success/60 font-mono">▒▒</span> Partial contribution
          </span>
          <span className="flex items-center gap-1">
            <span className="text-text-muted/40 font-mono">░░</span> Not relevant
          </span>
          <span className="flex items-center gap-1">
            <Lock size={10} className="text-warning" />
            Module not owned
          </span>
        </div>
      </section>

      {/* Summary stats */}
      <section className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-surface border border-success/30 rounded-lg p-5">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">Fully available</div>
          <div className="text-3xl font-semibold text-success">{summary.fully}</div>
          <div className="text-xs text-text-secondary mt-1">of use cases</div>
        </div>
        <div className="bg-surface border border-warning/30 rounded-lg p-5">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">Use cases with gaps</div>
          <div className="text-3xl font-semibold text-warning">{summary.withGaps}</div>
          <div className="text-xs text-text-secondary mt-1">could go deeper</div>
        </div>
      </section>

      {/* Top Expansion Opportunity */}
      {showRec && recM && (
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-warning" />
            Top Expansion Opportunity
          </h3>
          <div className="bg-surface border border-warning/30 rounded-lg p-5">
            <div className="flex items-baseline gap-2 mb-2 flex-wrap">
              <span className="text-base font-semibold text-text-primary" style={{ color: recM.color }}>
                {recM.name}
              </span>
              <span className="text-sm text-text-secondary">
                — Unlocks {unlockCount} more use case{unlockCount !== 1 ? 's' : ''} at full depth
              </span>
            </div>
            <div className="text-xs text-text-secondary mb-3">Based on your current usage:</div>
            <ul className="space-y-1 mb-4">
              {rec.quantified.map((q, i) => (
                <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                  <span className="text-warning mt-1">·</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => openModuleModal(altModuleId)}
              className="flex items-center gap-1.5 px-3 py-2 bg-warning text-white text-xs rounded-md hover:opacity-90 transition-opacity"
              style={{ background: '#F59E0B' }}
            >
              Talk to your CSM
              <ArrowRight size={11} />
            </button>
          </div>
        </section>
      )}
    </motion.div>
  );
}

export default function RoiDashboard() {
  const [tab, setTab] = useState('myValue');

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setTab('myValue')}
          className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
            tab === 'myValue'
              ? 'text-text-primary border-primary'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          My Value
        </button>
        <button
          onClick={() => setTab('platformValue')}
          className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
            tab === 'platformValue'
              ? 'text-text-primary border-primary'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          Platform Value
        </button>
        <button
          onClick={() => setTab('planCoverage')}
          className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
            tab === 'planCoverage'
              ? 'text-text-primary border-primary'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          Plan Coverage
        </button>
      </div>

      {tab === 'myValue' && <MyValueTab />}
      {tab === 'platformValue' && <PlatformValueTab />}
      {tab === 'planCoverage' && <PlanCoverageTab />}
    </div>
  );
}
