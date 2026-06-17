import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Share2,
  ArrowLeft,
  ArrowRight,
  FileText,
  ListChecks,
  BarChart3,
  Presentation,
  Mail,
  Map,
  ExternalLink,
  Folder,
  Pencil,
  Layers,
} from 'lucide-react';
import { useTenant } from '../context/TenantContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getLibraryForTenant, getDefaultSaveLocation, ARTIFACT_KINDS } from '../data/workbenchLibrary.js';

const KIND_ICONS = {
  BRIEF: FileText,
  LIST: ListChecks,
  REPORT: BarChart3,
  DECK: Presentation,
  EMAIL: Mail,
  MARKET: Map,
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'BRIEF', label: 'Briefs' },
  { id: 'LIST', label: 'Lists' },
  { id: 'MARKET', label: 'Market' },
  { id: 'REPORT', label: 'Reports' },
  { id: 'DECK', label: 'Decks' },
  { id: 'EMAIL', label: 'Emails' },
];

function KindBadge({ kind }) {
  const cfg = ARTIFACT_KINDS[kind];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function ArtifactRow({ a, onOpen, onShareToggle, onExport }) {
  const Icon = KIND_ICONS[a.kind] || FileText;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 items-center px-3 py-2.5 border-t border-border first:border-t-0 hover:bg-bg/40 transition-colors"
    >
      <div className="w-7 h-7 rounded bg-bg/40 border border-border flex items-center justify-center flex-shrink-0">
        <Icon size={13} className="text-text-muted" />
      </div>
      <button
        onClick={() => onOpen && onOpen(a)}
        className="text-left min-w-0"
      >
        <div className="text-xs font-medium text-text-primary truncate">{a.name}</div>
        <div className="text-[10px] text-text-muted truncate flex items-center gap-1.5 mt-0.5">
          <span>{a.play}</span>
          <span>·</span>
          <span>{a.owner}</span>
          <span>·</span>
          <span>{a.size}</span>
          <span>·</span>
          <span>{a.createdAt}</span>
        </div>
      </button>
      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {a.tags?.slice(0, 2).map((t) => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium truncate">{t}</span>
        ))}
        {a.tags?.length > 2 && <span className="text-[10px] text-text-muted">+{a.tags.length - 2}</span>}
      </div>
      <KindBadge kind={a.kind} />
      <button
        onClick={() => onShareToggle && onShareToggle(a)}
        className={`text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${
          a.shared
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
            : 'bg-bg/40 text-text-muted border-border'
        }`}
      >
        <Share2 size={9} />
        {a.shared ? 'Shared' : 'Private'}
      </button>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onOpen && onOpen(a)}
          className="p-1 rounded hover:bg-bg/60 text-text-muted hover:text-text-secondary"
          title="Open"
        >
          <ExternalLink size={11} />
        </button>
        <button
          onClick={() => onExport && onExport(a)}
          className="p-1 rounded hover:bg-bg/60 text-text-muted hover:text-text-secondary"
          title="Export"
        >
          <Download size={11} />
        </button>
      </div>
    </motion.div>
  );
}

export default function WorkbenchLibrary() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { showToast } = useToast();

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [saveLocation, setSaveLocation] = useState(getDefaultSaveLocation(tenant.id));
  const [editingLocation, setEditingLocation] = useState(false);
  const [items, setItems] = useState(() => getLibraryForTenant(tenant.id));

  const filtered = useMemo(() => {
    let rows = [...items];
    if (filter !== 'all') rows = rows.filter((r) => r.kind === filter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q) || (r.tags || []).some((t) => t.toLowerCase().includes(q)));
    }
    return rows;
  }, [items, filter, search]);

  const counts = items.reduce((acc, r) => {
    acc[r.kind] = (acc[r.kind] || 0) + 1;
    return acc;
  }, {});

  const handleOpen = (a) => {
    if (a.threadId === 'demo') {
      showToast(`Re-open from a saved thread coming soon — for now, the file lives at ${saveLocation}${a.name}`, 'info');
    } else {
      showToast(`Opening ${a.name}`, 'info');
    }
  };
  const handleShareToggle = (a) => {
    setItems((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, shared: !x.shared } : x))
    );
    showToast(`${a.name} → ${a.shared ? 'Private' : 'Shared'}`, 'success');
  };
  const handleExport = (a) => {
    showToast(`Exported to ${saveLocation}${a.name}`, 'success');
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <button onClick={() => navigate('/workbench')} className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors">
        <ArrowLeft size={11} />
        Workbench
      </button>

      <div className="mb-2 text-xs text-text-muted">{tenant.name} · Artifact Library</div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Library</h1>
      <p className="text-sm text-text-secondary mb-5 max-w-3xl">
        All artifacts produced by your plays — briefs, lists, decks, market sizings, emails. They live in this tenant
        forever and download to your chosen folder.
      </p>

      {/* Save location + quick counts */}
      <div className="grid grid-cols-[1fr_auto] gap-3 mb-4">
        <div className="bg-surface border border-border rounded-md px-4 py-3 flex items-center gap-3">
          <Folder size={14} className="text-text-muted flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Save location</div>
            {editingLocation ? (
              <input
                value={saveLocation}
                onChange={(e) => setSaveLocation(e.target.value)}
                onBlur={() => setEditingLocation(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setEditingLocation(false);
                    showToast('Save location updated', 'success');
                  }
                }}
                autoFocus
                className="w-full text-sm font-mono text-text-primary bg-transparent focus:outline-none"
              />
            ) : (
              <div className="text-sm font-mono text-text-primary">{saveLocation}</div>
            )}
          </div>
          <button
            onClick={() => setEditingLocation(true)}
            className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
          >
            <Pencil size={10} /> Change
          </button>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-md">
          <Layers size={14} className="text-text-muted" />
          <div className="text-[11px] text-text-secondary">
            <span className="font-semibold text-text-primary">{items.length}</span> artifacts ·
            {' '}{counts.BRIEF || 0} briefs · {counts.LIST || 0} lists · {counts.MARKET || 0} market analyses
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-1 px-2 py-1 bg-bg/40 border border-border rounded text-xs flex-1 max-w-xs">
          <Search size={11} className="text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artifacts or tags…"
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={10} className="text-text-muted" />
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                filter === f.id ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-bg/40 border-border text-text-secondary hover:border-border-2'
              }`}
            >
              {f.label}
              {counts[f.id] != null && f.id !== 'all' && (
                <span className="ml-1 text-text-muted">{counts[f.id]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Artifact list */}
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-text-muted">
            No artifacts match your filters. Activate a play from the Workbench to generate one.
          </div>
        ) : (
          filtered.map((a) => (
            <ArtifactRow
              key={a.id}
              a={a}
              onOpen={handleOpen}
              onShareToggle={handleShareToggle}
              onExport={handleExport}
            />
          ))
        )}
      </div>

      <div className="mt-5 flex items-center justify-between text-[11px] text-text-muted">
        <span>
          {filtered.length} of {items.length} · sorted by created (most recent)
        </span>
        <button
          onClick={() => navigate('/workbench/resources')}
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          Research Resources <ArrowRight size={10} />
        </button>
      </div>
    </div>
  );
}
