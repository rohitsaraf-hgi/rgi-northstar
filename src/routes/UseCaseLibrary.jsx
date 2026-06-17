import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Globe,
  Compass,
  Crosshair,
  ListChecks,
  Swords,
  Inbox,
  UserCheck,
  Layers,
  Play,
  Zap,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Newspaper,
  Building2,
  Phone,
  ShieldAlert,
  Activity,
  Cpu,
  Plug,
  Users,
  SlidersHorizontal,
  GitBranch,
  Lock,
  Check,
} from 'lucide-react';
import { USE_CASES, USE_CASE_CATEGORIES, STAGES } from '../data/useCases.js';
import { USE_CASE_MODULE_MAP, useCaseAvailability, moduleLabel, moduleById } from '../data/modules.js';
import { usePersona, usePermissions } from '../context/PersonaContext.jsx';
import { useDemo } from '../context/DemoContext.jsx';
import { useModuleDetail } from '../context/ModuleDetailContext.jsx';
import UseCaseActivationModal from '../components/usecase/UseCaseActivationModal.jsx';

const ICON_MAP = {
  globe: Globe,
  compass: Compass,
  crosshair: Crosshair,
  'list-checks': ListChecks,
  swords: Swords,
  inbox: Inbox,
  'user-check': UserCheck,
  layers: Layers,
  play: Play,
  zap: Zap,
  'refresh-cw': RefreshCw,
  newspaper: Newspaper,
  'building-2': Building2,
  phone: Phone,
  'shield-alert': ShieldAlert,
  activity: Activity,
  cpu: Cpu,
  plug: Plug,
  users: Users,
  'sliders-horizontal': SlidersHorizontal,
  'git-branch': GitBranch,
};

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'FIND_MARKET', label: 'Find Your Market' },
  { id: 'SELL', label: 'Sell & Close' },
  { id: 'SCORE_PRIORITIZE', label: 'Score & Prioritize' },
  { id: 'UNDERSTAND_ENGAGE', label: 'Understand & Engage' },
  { id: 'PLATFORM_OPS', label: 'Platform & Ops', adminOnly: true },
];

const AVAILABILITY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'partial', label: 'Partial' },
  { id: 'locked', label: 'Locked' },
];

function StageMap({ useCaseId, modulesOwned, onAddModule }) {
  const map = USE_CASE_MODULE_MAP[useCaseId];
  if (!map) return null;
  const availability = useCaseAvailability(useCaseId, modulesOwned);

  return (
    <div className="space-y-1 mb-3 pb-3 border-b border-border">
      {STAGES.map((stage, i) => {
        const required = map.stages[i];
        const owned = required === null || modulesOwned.includes(required);
        const mod = required ? moduleById(required) : null;
        return (
          <div key={stage} className="flex items-center gap-2 text-[10px]">
            <span className="w-16 text-text-muted uppercase tracking-wider font-semibold">
              {stage}
            </span>
            {required === null ? (
              <span className="text-text-muted italic flex-1 truncate">Always available</span>
            ) : (
              <span
                className="inline-flex items-center gap-1 flex-1 truncate"
                style={{ color: owned ? mod?.color : 'rgb(var(--color-text-muted))' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: owned ? mod?.color : 'rgb(var(--color-text-muted) / 0.5)' }} />
                {mod?.name || required}
              </span>
            )}
            {owned ? (
              <Check size={10} className="text-success flex-shrink-0" />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddModule(required);
                }}
                className="text-[10px] text-text-muted hover:text-text-secondary"
                title="Open module detail"
              >
                Not in plan
              </button>
            )}
          </div>
        );
      })}
      <div className="pt-1.5">
        {availability.state === 'available' && (
          <span className="text-[10px] uppercase tracking-wider font-bold text-success">
            ✓ Full depth available
          </span>
        )}
        {availability.state === 'partial' && (
          <span className="text-[10px] uppercase tracking-wider font-bold text-warning">
            Your depth: {availability.stagesAvailable} of {availability.totalStages} stages available
          </span>
        )}
        {availability.state === 'locked' && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-danger">
            <Lock size={9} /> Module required
          </span>
        )}
      </div>
    </div>
  );
}

function UseCaseCard({ u, onStart, featured = false, modulesOwned, onAddModule }) {
  const cat = USE_CASE_CATEGORIES[u.category];
  const Icon = ICON_MAP[u.icon] || Globe;
  const availability = useCaseAvailability(u.id, modulesOwned);
  const isLocked = availability.state === 'locked';
  const isPartial = availability.state === 'partial';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`bg-surface border rounded-lg p-4 flex flex-col transition-colors ${
        isLocked
          ? 'border-border opacity-60'
          : featured
          ? 'border-primary/30 shadow-card'
          : 'border-border hover:border-border-2'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold ${cat.bg} ${cat.color}`}>
          <Icon size={10} />
          {cat.label}
        </div>
        <span className="text-[10px] text-text-muted font-mono">{u.timeToOutput}</span>
      </div>

      <h3 className="text-base font-semibold text-text-primary mb-2 leading-tight">{u.name}</h3>
      <p className="text-xs text-text-secondary mb-4 leading-relaxed">{u.outcome}</p>

      <StageMap useCaseId={u.id} modulesOwned={modulesOwned} onAddModule={onAddModule} />

      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {u.personas.map((p) => (
          <span
            key={p}
            className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-bg/60 border border-border rounded text-text-muted font-medium"
          >
            {p}
          </span>
        ))}
      </div>

      <button
        onClick={() => onStart(u.id)}
        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors group ${
          isLocked
            ? 'bg-bg/40 text-text-muted hover:bg-bg/60'
            : isPartial
            ? 'bg-warning/10 hover:bg-warning hover:text-white text-warning'
            : 'bg-primary/10 hover:bg-primary text-primary hover:text-white'
        }`}
      >
        {isLocked ? (
          <>
            <Lock size={11} />
            Module required
          </>
        ) : isPartial ? (
          <>
            Activate with {availability.stagesAvailable} stages
            <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </>
        ) : (
          <>
            Start this use case
            <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </button>
    </motion.div>
  );
}

export default function UseCaseLibrary() {
  const { persona, personaId } = usePersona();
  const permissions = usePermissions();
  const { config } = useDemo();
  const { open: openModuleModal } = useModuleDetail();
  const [filter, setFilter] = useState('all');
  const [availFilter, setAvailFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [presetId, setPresetId] = useState(null);

  const accessibleUseCases = useMemo(() => {
    return USE_CASES.filter((u) => !u.requiresAdmin || permissions.canAccessAdmin);
  }, [permissions.canAccessAdmin]);

  // Compute availability counts for the filter row
  const availabilityCounts = useMemo(() => {
    const counts = { all: 0, available: 0, partial: 0, locked: 0 };
    for (const u of accessibleUseCases) {
      const a = useCaseAvailability(u.id, config.modulesOwned);
      counts.all++;
      counts[a.state]++;
    }
    return counts;
  }, [accessibleUseCases, config.modulesOwned]);

  const featured = useMemo(
    () => accessibleUseCases.filter((u) => u.featuredFor?.includes(personaId)),
    [accessibleUseCases, personaId]
  );
  const featuredIds = new Set(featured.map((u) => u.id));

  const rest = useMemo(() => {
    return accessibleUseCases.filter((u) => !featuredIds.has(u.id));
  }, [accessibleUseCases, featuredIds]);

  const matchesFilters = (u) => {
    const matchesCategory = filter === 'all' || u.category === filter;
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.outcome.toLowerCase().includes(search.toLowerCase());
    if (availFilter !== 'all') {
      const a = useCaseAvailability(u.id, config.modulesOwned);
      if (a.state !== availFilter) return false;
    }
    return matchesCategory && matchesSearch;
  };

  const filtered = useMemo(() => rest.filter(matchesFilters), [rest, filter, search, availFilter, config.modulesOwned]);
  const filteredFeatured = useMemo(() => featured.filter(matchesFilters), [featured, filter, search, availFilter, config.modulesOwned]);

  const handleStart = (id) => {
    setPresetId(id);
    setModalOpen(true);
  };

  const handleAddModule = (moduleId) => openModuleModal(moduleId);

  return (
    <>
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="mb-2 text-xs text-text-muted">Playbooks</div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Use Case Library</h1>
        <p className="text-sm text-text-secondary mb-6">
          Activate a structured workflow to go from data to decision. Each card shows which stages are available given your active modules.
        </p>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search use cases..."
              className="w-full bg-surface border border-border rounded-md pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/40"
            />
          </div>
        </div>

        {/* Availability filter row */}
        <div className="flex items-center gap-1 mb-4">
          {AVAILABILITY_FILTERS.map((f) => {
            const count = availabilityCounts[f.id];
            return (
              <button
                key={f.id}
                onClick={() => setAvailFilter(f.id)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
                  availFilter === f.id
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-text-secondary hover:bg-bg/40'
                }`}
              >
                {f.label}
                <span
                  className={`text-[10px] font-mono ${
                    availFilter === f.id ? 'text-primary' : 'text-text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category filter row */}
        <div className="flex items-center gap-1 mb-6 border-b border-border overflow-x-auto">
          {CATEGORY_FILTERS.filter((f) => !f.adminOnly || permissions.canAccessAdmin).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-2 text-sm transition-colors border-b-2 -mb-px whitespace-nowrap ${
                filter === f.id
                  ? 'text-text-primary border-primary'
                  : 'text-text-secondary border-transparent hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filteredFeatured.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-primary" />
              <h2 className="text-sm font-semibold text-text-primary">
                Featured for {persona.name.split(' ')[0]}
              </h2>
              <span className="text-xs text-text-muted">· {persona.role}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {filteredFeatured.map((u) => (
                <UseCaseCard
                  key={u.id}
                  u={u}
                  onStart={handleStart}
                  featured
                  modulesOwned={config.modulesOwned}
                  onAddModule={handleAddModule}
                />
              ))}
            </div>
          </section>
        )}

        {filtered.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-text-secondary">More use cases</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {filtered.map((u) => (
                <UseCaseCard
                  key={u.id}
                  u={u}
                  onStart={handleStart}
                  modulesOwned={config.modulesOwned}
                  onAddModule={handleAddModule}
                />
              ))}
            </div>
          </section>
        )}

        {filteredFeatured.length === 0 && filtered.length === 0 && (
          <div className="text-center text-text-muted py-12">No use cases match your search.</div>
        )}
      </div>

      <UseCaseActivationModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPresetId(null);
        }}
        presetUseCaseId={presetId}
      />
    </>
  );
}
