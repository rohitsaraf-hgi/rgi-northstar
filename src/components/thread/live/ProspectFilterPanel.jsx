import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Box,
  Package,
  Briefcase,
  Users,
  DollarSign,
  Zap,
  UserCheck,
  Flag,
  User,
  Clock,
} from 'lucide-react';
import { FILTER_GROUPS, FILTER_GROUP_LABELS } from '../../../data/prospectFilters.js';

const ICONS = {
  box: Box,
  package: Package,
  briefcase: Briefcase,
  users: Users,
  'dollar-sign': DollarSign,
  zap: Zap,
  'user-check': UserCheck,
  flag: Flag,
  user: User,
  clock: Clock,
};

function FilterSection({ group, activeFilters, onToggle, search }) {
  const [open, setOpen] = useState(true);
  const Icon = ICONS[group.icon] || Box;
  const activeForGroup = activeFilters.filter((f) => f.id === group.id);
  const aiCount = activeForGroup.filter((f) => f.appliedBy === 'ai').length;

  const filteredOptions = group.options.filter(
    (opt) => !search || opt.toLowerCase().includes(search.toLowerCase())
  );

  if (search && filteredOptions.length === 0) return null;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-bg/40 transition-colors"
      >
        <Icon size={13} className="text-text-secondary flex-shrink-0" />
        <span className="flex-1 text-left text-sm font-semibold text-text-primary">
          {group.label}
        </span>
        {activeForGroup.length > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/15 text-primary rounded text-[10px] font-bold">
            {activeForGroup.length}
            {aiCount > 0 && <Sparkles size={9} />}
          </span>
        )}
        {open ? (
          <ChevronUp size={13} className="text-text-muted" />
        ) : (
          <ChevronDown size={13} className="text-text-muted" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-3">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
            {group.label}
          </div>
          <div className="space-y-1">
            {filteredOptions.map((opt) => {
              const active = activeForGroup.find((f) => f.value === opt);
              const isAi = active?.appliedBy === 'ai';
              return (
                <button
                  key={opt}
                  onClick={() => onToggle(group.id, opt)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors text-left ${
                    active ? 'bg-primary/10' : 'hover:bg-bg/40'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                      active ? 'bg-primary border-primary' : 'bg-surface border-border-2'
                    }`}
                  >
                    {active && <Check size={9} className="text-white" />}
                  </span>
                  <span className={`flex-1 text-xs ${active ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                    {opt}
                  </span>
                  {isAi && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider px-1 py-0 bg-primary/15 text-primary rounded font-bold">
                      <Sparkles size={8} />
                      AI
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {group.includeMeta && activeForGroup.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5 flex items-center gap-1">
                <Clock size={9} />
                {group.includeMeta.afterDate}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-text-muted mb-1">After</div>
                  <input
                    defaultValue={group.includeMeta.defaultDate}
                    className="w-full bg-bg/40 border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-primary/40"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-text-muted mb-1">Before</div>
                  <input
                    placeholder="Optional"
                    className="w-full bg-bg/40 border border-border rounded px-2 py-1 text-xs text-text-muted focus:outline-none focus:border-primary/40"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProspectFilterPanel({ open, onClose, activeFilters, onChange }) {
  const [tab, setTab] = useState('hgData');
  const [search, setSearch] = useState('');

  const totalActive = activeFilters.length;
  const aiActive = activeFilters.filter((f) => f.appliedBy === 'ai').length;

  const handleToggle = (id, value) => {
    const exists = activeFilters.find((f) => f.id === id && f.value === value);
    if (exists) {
      onChange(activeFilters.filter((f) => !(f.id === id && f.value === value)));
    } else {
      onChange([...activeFilters, { id, value, appliedBy: 'manual' }]);
    }
  };

  const handleClearAll = () => onChange([]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="fixed right-0 top-0 h-full w-[400px] bg-surface border-l border-border z-40 flex flex-col shadow-elev"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-text-primary">Filters</span>
              {totalActive > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/15 text-primary rounded text-[10px] font-bold">
                  {totalActive}
                  {aiActive > 0 && <Sparkles size={9} />}
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* "Apply instantly" banner */}
          <div className="px-5 py-2 bg-success/8 border-b border-border flex items-center gap-2">
            <Check size={11} className="text-success flex-shrink-0" />
            <span className="text-[11px] text-text-secondary">Changes apply instantly — results update as you select</span>
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-border">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search filters or values..."
                className="w-full bg-bg/40 border border-border rounded-md pl-7 pr-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary/40"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="px-5 border-b border-border flex items-center gap-1">
            {Object.entries(FILTER_GROUP_LABELS).map(([key, label]) => {
              const isActive = tab === key;
              const groupActive = activeFilters.filter((f) =>
                FILTER_GROUPS[key].some((g) => g.id === f.id)
              ).length;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-3 py-2.5 text-xs transition-colors border-b-2 -mb-px font-medium flex items-center gap-1.5 ${
                    isActive
                      ? 'text-text-primary border-primary'
                      : 'text-text-secondary border-transparent hover:text-text-primary'
                  }`}
                >
                  {label}
                  {groupActive > 0 && (
                    <span className="text-[9px] px-1 py-0 bg-primary/15 text-primary rounded font-bold">
                      {groupActive}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter sections */}
          <div className="flex-1 overflow-y-auto thin-scrollbar">
            {FILTER_GROUPS[tab].map((group) => (
              <FilterSection
                key={group.id}
                group={group}
                activeFilters={activeFilters}
                onToggle={handleToggle}
                search={search}
              />
            ))}
          </div>

          {/* Footer */}
          {totalActive > 0 && (
            <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-bg/30">
              <button
                onClick={handleClearAll}
                className="text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                Clear all filters
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
