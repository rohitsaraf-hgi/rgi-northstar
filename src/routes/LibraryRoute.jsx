import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Layers,
  FileText,
  Mail,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Sparkles,
  ListChecks,
  ArrowRight,
  ExternalLink,
  Share2,
  Users,
  RefreshCw,
} from 'lucide-react';
import { usePersona } from '../context/PersonaContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getSavedAssetsForPersona, groupByType, TYPE_DESCRIPTIONS, TYPE_ORDER, ARTIFACT_TYPES } from '../data/library.js';

const ICON_MAP = {
  layers: Layers,
  'file-text': FileText,
  mail: Mail,
  'bar-chart-3': BarChart3,
  'check-circle-2': CheckCircle2,
  'clipboard-list': ClipboardList,
  sparkles: Sparkles,
  'list-checks': ListChecks,
};

function AssetCard({ item, onOpen, onRerun }) {
  const cfg = ARTIFACT_TYPES[item.type] || ARTIFACT_TYPES.BRIEF;
  const Icon = ICON_MAP[cfg.icon] || FileText;
  const { showToast } = useToast();
  const isRerunable = item.rerunable === true;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="bg-surface border border-border rounded-lg p-4 hover:border-border-2 transition-colors flex flex-col"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className={cfg.color} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
            {cfg.label}
          </span>
          {item.version && (
            <span className="text-[10px] text-text-muted font-mono">{item.version}</span>
          )}
        </div>
        {item.sharedWithMe && (
          <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
            <Users size={10} />
            Shared
          </span>
        )}
      </div>

      <div className="text-sm font-semibold text-text-primary mb-1.5 leading-snug flex items-center gap-1.5">
        <span className="truncate">{item.name}</span>
        {isRerunable && (
          <span title="Recomputable — re-runs against current data" className="flex-shrink-0">
            <RefreshCw size={10} className="text-primary" />
          </span>
        )}
      </div>
      {item.meta && <div className="text-xs text-text-secondary mb-2 font-mono">{item.meta}</div>}

      <div className="text-xs text-text-muted mb-3 flex items-center gap-1.5">
        <span>From</span>
        <button
          onClick={() => onOpen(item.threadId)}
          className="text-text-secondary hover:text-primary transition-colors truncate max-w-[180px]"
          title={item.threadName}
        >
          {item.threadName}
        </button>
      </div>

      <div className="text-[10px] text-text-muted mb-3">{item.timestamp}</div>

      <div className="flex items-center gap-1 mt-auto pt-3 border-t border-border">
        <button
          onClick={() => onOpen(item.threadId)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded transition-colors"
        >
          <ExternalLink size={11} />
          Open
        </button>
        {isRerunable && (
          <button
            onClick={() => onRerun(item)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary hover:bg-primary hover:text-white rounded transition-colors"
            title="Re-run against current book data"
          >
            <RefreshCw size={11} />
            Re-run
          </button>
        )}
        <button
          onClick={() => showToast('Link copied to clipboard')}
          className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:bg-bg/40 hover:text-text-primary rounded transition-colors"
        >
          <Share2 size={11} />
          Share
        </button>
      </div>
    </motion.div>
  );
}

export default function LibraryRoute() {
  const { persona, personaId } = usePersona();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('all');

  const items = useMemo(() => getSavedAssetsForPersona(personaId), [personaId]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchesType = activeType === 'all' || it.type === activeType;
      const matchesSearch =
        !search ||
        it.name.toLowerCase().includes(search.toLowerCase()) ||
        (it.threadName || '').toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [items, activeType, search]);

  const groups = groupByType(items);
  const orderedTypes = TYPE_ORDER.filter((t) => groups[t]?.length > 0);

  const handleOpen = (threadId) => {
    navigate(`/thread/${threadId}`);
  };

  const handleRerun = (item) => {
    showToast(`Re-running "${item.name}" against current data...`);
    navigate(`/thread/${item.threadId}?rerun=${item.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="mb-2 text-xs text-text-muted">Playbooks</div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Saved Library</h1>
      <p className="text-sm text-text-secondary mb-6 max-w-2xl">
        Every artifact you pin or save accumulates here, grouped by type. {persona.name.split(' ')[0]} has{' '}
        <span className="text-text-primary font-medium">{items.length} saved asset{items.length !== 1 ? 's' : ''}</span> across{' '}
        {orderedTypes.length} categor{orderedTypes.length !== 1 ? 'ies' : 'y'}. Click any asset to jump back to its source thread.
      </p>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved assets..."
            className="w-full bg-surface border border-border rounded-md pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/40"
          />
        </div>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-1 mb-6 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveType('all')}
          className={`px-3 py-2 text-sm transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeType === 'all'
              ? 'text-text-primary border-primary'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          All <span className="text-text-muted ml-1 font-mono">({items.length})</span>
        </button>
        {orderedTypes.map((type) => {
          const cfg = ARTIFACT_TYPES[type];
          const count = groups[type].length;
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-3 py-2 text-sm transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeType === type
                  ? 'text-text-primary border-primary'
                  : 'text-text-secondary border-transparent hover:text-text-primary'
              }`}
            >
              {cfg.label.charAt(0) + cfg.label.slice(1).toLowerCase().replace('_', ' ')}
              <span className="text-text-muted ml-1 font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {activeType === 'all' ? (
        <div className="space-y-8">
          {orderedTypes.map((type) => {
            const cfg = ARTIFACT_TYPES[type];
            const Icon = ICON_MAP[cfg.icon] || FileText;
            return (
              <section key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={14} className={cfg.color} />
                  <h2 className={`text-sm font-semibold uppercase tracking-wider ${cfg.color}`}>
                    {cfg.label}
                  </h2>
                  <span className="text-xs text-text-muted">· {TYPE_DESCRIPTIONS[type]}</span>
                  <span className="text-xs text-text-muted ml-auto font-mono">
                    {groups[type].length} item{groups[type].length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {groups[type].map((it) => (
                    <AssetCard key={`${it.threadId}-${it.id}`} item={it} onOpen={handleOpen} onRerun={handleRerun} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((it) => (
            <AssetCard key={`${it.threadId}-${it.id}`} item={it} onOpen={handleOpen} onRerun={handleRerun} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center text-text-muted py-12">No assets match your search.</div>
          )}
        </div>
      )}
    </div>
  );
}
