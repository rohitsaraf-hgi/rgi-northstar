import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  ArrowLeft,
  Globe,
  FileText,
  File,
  Mic,
  Pencil,
  Bot,
  Share2,
  Plus,
  X,
  Sparkles,
  ExternalLink,
  Tag,
} from 'lucide-react';
import { useTenant } from '../context/TenantContext.jsx';
import { usePersona } from '../context/PersonaContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getResourcesForTenant, RESOURCE_TYPES } from '../data/researchResources.js';

const TYPE_ICONS = {
  url: Globe,
  pdf: FileText,
  doc: File,
  transcript: Mic,
  note: Pencil,
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'shared', label: 'Shared' },
  { id: 'private', label: 'Private only' },
  { id: 'agents', label: 'Used by agents' },
  { id: 'mine', label: 'Mine' },
];

function TypeIcon({ type }) {
  const Icon = TYPE_ICONS[type] || File;
  return (
    <div className="w-7 h-7 rounded bg-bg/40 border border-border flex items-center justify-center flex-shrink-0">
      <Icon size={13} className="text-text-muted" />
    </div>
  );
}

function ResourceRow({ r, onToggleShared, onToggleAgents, onOpen }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 px-3 py-3 border-t border-border first:border-t-0 hover:bg-bg/40 transition-colors"
    >
      <TypeIcon type={r.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <button onClick={() => onOpen(r)} className="text-xs font-semibold text-text-primary truncate text-left hover:text-primary">
            {r.title}
          </button>
          <span className="text-[10px] uppercase tracking-wider px-1 py-0.5 bg-bg/40 border border-border rounded font-bold text-text-muted">
            {RESOURCE_TYPES[r.type]?.label || r.type}
          </span>
          {r.citationCount > 0 && (
            <span className="text-[10px] inline-flex items-center gap-0.5 px-1 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded font-bold">
              <Bot size={9} /> cited {r.citationCount}×
            </span>
          )}
        </div>
        <div className="text-[11px] text-text-secondary leading-snug mb-1.5">{r.summary}</div>
        <div className="flex items-center gap-1 flex-wrap">
          {r.tags.map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium inline-flex items-center gap-0.5">
              <Tag size={8} />{t}
            </span>
          ))}
        </div>
        <div className="text-[10px] text-text-muted mt-1.5 flex items-center gap-2 flex-wrap">
          <span>{r.owner}</span>
          <span>·</span>
          <span>Added {r.addedAt}</span>
          {r.lastCitedIn && (
            <>
              <span>·</span>
              <span className="text-emerald-700 dark:text-emerald-300">last cited in <span className="font-medium">{r.lastCitedIn}</span></span>
            </>
          )}
          <span className="ml-auto text-text-muted font-mono truncate max-w-[280px]">{r.source}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <button
          onClick={() => onToggleShared(r)}
          className={`text-[10px] inline-flex items-center gap-1 px-2 py-1 rounded border ${
            r.shared ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' : 'bg-bg/40 text-text-muted border-border'
          }`}
        >
          <Share2 size={9} />
          {r.shared ? 'Shared' : 'Private'}
        </button>
        <button
          onClick={() => onToggleAgents(r)}
          className={`text-[10px] inline-flex items-center gap-1 px-2 py-1 rounded border ${
            r.usedByAgents ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30' : 'bg-bg/40 text-text-muted border-border'
          }`}
          title="When ON, agents can pull this resource during runs and cite it"
        >
          <Bot size={9} />
          {r.usedByAgents ? 'Agent-enabled' : 'Agent-disabled'}
        </button>
      </div>
    </motion.div>
  );
}

function AddResourceModal({ open, onClose, onAdd }) {
  const [type, setType] = useState('url');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [summary, setSummary] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [shared, setShared] = useState(true);
  const [usedByAgents, setUsedByAgents] = useState(true);

  if (!open) return null;

  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      id: `res-${Date.now().toString(36)}`,
      type,
      title: title.trim(),
      source: source.trim() || 'Internal',
      summary: summary.trim() || '(no summary)',
      tags,
      shared,
      usedByAgents,
      addedAt: 'Just now',
      citationCount: 0,
    });
    setTitle(''); setSource(''); setSummary(''); setTags([]); setTagInput('');
    onClose();
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold tracking-tight">Add research resource</h2>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-secondary rounded">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <select value={type} onChange={(e) => setType(e.target.value)} className="px-2 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary">
              {Object.entries(RESOURCE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource title…"
              autoFocus
              className="px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
            />
          </div>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="URL or filename (optional)"
            className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
          />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="One-line summary so agents (and teammates) can use it…"
            rows={2}
            className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none resize-none"
          />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Tags</div>
            <div className="flex flex-wrap items-center gap-1 mb-1">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[11px]">
                  {t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-danger"><X size={9} /></button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                }}
                placeholder="Add tag…"
                className="flex-1 min-w-[100px] px-2 py-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <label className="inline-flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
              <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} className="accent-primary" />
              Share with team
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
              <input type="checkbox" checked={usedByAgents} onChange={(e) => setUsedByAgents(e.target.checked)} className="accent-primary" />
              Available to agents during runs
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-border">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary">Cancel</button>
          <button onClick={submit} disabled={!title.trim()} className="px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim disabled:opacity-40 font-medium">
            Add resource
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function WorkbenchResources() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { persona } = usePersona();
  const { showToast } = useToast();

  const [resources, setResources] = useState(() => getResourcesForTenant(tenant.id));
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    let rows = [...resources];
    if (filter === 'shared') rows = rows.filter((r) => r.shared);
    if (filter === 'private') rows = rows.filter((r) => !r.shared);
    if (filter === 'agents') rows = rows.filter((r) => r.usedByAgents);
    if (filter === 'mine') rows = rows.filter((r) => r.owner === persona.name);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) => r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q) || (r.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return rows;
  }, [resources, filter, search, persona.name]);

  const agentEnabled = resources.filter((r) => r.usedByAgents).length;

  const handleToggleShared = (r) => {
    setResources((prev) => prev.map((x) => (x.id === r.id ? { ...x, shared: !x.shared } : x)));
    showToast(`${r.title} → ${r.shared ? 'Private' : 'Shared'}`, 'success');
  };
  const handleToggleAgents = (r) => {
    setResources((prev) => prev.map((x) => (x.id === r.id ? { ...x, usedByAgents: !x.usedByAgents } : x)));
    showToast(`${r.title} → ${r.usedByAgents ? 'Agent-disabled' : 'Agent-enabled'}`, 'success');
  };
  const handleAdd = (item) => {
    const enriched = { ...item, owner: persona.name, lastCitedIn: null };
    setResources((prev) => [enriched, ...prev]);
    showToast('Resource added · agents can use it on next run', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <button onClick={() => navigate('/workbench')} className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors">
        <ArrowLeft size={11} />
        Workbench
      </button>

      <div className="mb-2 text-xs text-text-muted">{tenant.name} · Research Resources</div>
      <div className="flex items-end justify-between mb-1">
        <h1 className="text-2xl font-semibold tracking-tight">Research Resources</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors font-medium"
        >
          <Plus size={11} /> Add resource
        </button>
      </div>
      <p className="text-sm text-text-secondary mb-5 max-w-3xl">
        Knowledge sellers contribute to the tenant — earnings transcripts, battle cards, buyer personas, internal notes.
        Resources marked <span className="font-medium text-sky-700 dark:text-sky-300">Agent-enabled</span> are pulled into Account Brief and Opportunity Finder runs and cited in the output.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-surface border border-border rounded-md px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Total resources</div>
          <div className="text-lg font-semibold text-text-primary">{resources.length}</div>
        </div>
        <div className="bg-surface border border-border rounded-md px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold inline-flex items-center gap-1">
            <Bot size={9} className="text-sky-700 dark:text-sky-300" /> Agent-enabled
          </div>
          <div className="text-lg font-semibold text-text-primary">{agentEnabled}</div>
        </div>
        <div className="bg-surface border border-border rounded-md px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold inline-flex items-center gap-1">
            <Share2 size={9} className="text-emerald-700 dark:text-emerald-300" /> Shared
          </div>
          <div className="text-lg font-semibold text-text-primary">{resources.filter((r) => r.shared).length}</div>
        </div>
        <div className="bg-surface border border-border rounded-md px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold inline-flex items-center gap-1">
            <Sparkles size={9} className="text-primary" /> Total citations
          </div>
          <div className="text-lg font-semibold text-text-primary">
            {resources.reduce((s, r) => s + (r.citationCount || 0), 0)}
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
            placeholder="Search resources or tags…"
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
            </button>
          ))}
        </div>
      </div>

      {/* Resources list */}
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-text-muted">
            No resources match your filters. <button onClick={() => setAddOpen(true)} className="text-primary hover:underline">Add one →</button>
          </div>
        ) : (
          filtered.map((r) => (
            <ResourceRow
              key={r.id}
              r={r}
              onToggleShared={handleToggleShared}
              onToggleAgents={handleToggleAgents}
              onOpen={() => showToast(`Opening ${r.title}…`, 'info')}
            />
          ))
        )}
      </div>

      <AddResourceModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
    </div>
  );
}
