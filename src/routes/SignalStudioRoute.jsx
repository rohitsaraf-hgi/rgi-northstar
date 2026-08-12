import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Plus, X, Search, MoreVertical, Play, Pause, Trash2,
  Database, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Wand2,
  FileText, Mail, Users, Send, ListTodo, Flag, Filter as FilterIcon,
} from 'lucide-react';
import {
  CRM_ATTRIBUTES, CRM_OBJECTS, OPERATOR_LABELS, SIGNAL_ACTIONS, SIGNAL_CATEGORIES,
  SEVERITIES, groupedAttributes, getAttribute, getAction,
  classifyNaturalLanguage, listSignals, upsertSignal, deleteSignal,
  subscribeSignals, estimateMatchCount, summarizeRules,
} from '../data/firstPartySignals.js';
import { useToast } from '../context/ToastContext.jsx';

const ACTION_ICON = {
  generate_account_brief:   FileText,
  draft_personalized_email: Mail,
  find_buying_personas:     Users,
  add_to_outreach:          Send,
  create_crm_tasks:         ListTodo,
  flag_for_review:          Flag,
};

// -----------------------------------------------------------------------------
// Root — list view + designer modal
// -----------------------------------------------------------------------------
export default function SignalStudioRoute() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tick, setTick] = useState(0);
  const [designerOpen, setDesignerOpen] = useState(false);
  const [editingSignal, setEditingSignal] = useState(null);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    const unsub = subscribeSignals(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const signals = useMemo(() => listSignals(), [tick]);
  const filtered = signals.filter(
    (s) =>
      !searchQ ||
      s.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQ.toLowerCase()),
  );
  const liveCount = signals.filter((s) => s.status === 'live').length;
  const draftCount = signals.filter((s) => s.status === 'draft').length;

  const handleNew = () => {
    setEditingSignal(null);
    setDesignerOpen(true);
  };
  const handleEdit = (signal) => {
    setEditingSignal(signal);
    setDesignerOpen(true);
  };
  const handleDelete = (signal) => {
    if (!window.confirm(`Delete signal "${signal.name}"?`)) return;
    deleteSignal(signal.id);
    showToast(`Deleted "${signal.name}"`, 'info');
  };
  const handleToggleStatus = (signal) => {
    const next = { ...signal, status: signal.status === 'live' ? 'draft' : 'live' };
    upsertSignal(next);
    showToast(`${signal.name}: ${next.status === 'live' ? 'published' : 'moved to draft'}`, 'success');
  };
  const handleSave = (signal) => {
    upsertSignal(signal);
    setDesignerOpen(false);
    setEditingSignal(null);
    showToast(`${signal.status === 'live' ? 'Published' : 'Saved draft'}: ${signal.name}`, 'success');
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded transition-colors mt-1"
            title="Back to admin"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <div className="text-xs text-text-muted mb-0.5">Admin · First-Party Signal Studio</div>
            <h1 className="text-2xl font-semibold tracking-tight">First-Party Signal Studio</h1>
            <div className="text-sm text-text-secondary mt-1 max-w-2xl">
              Define CRM-driven signals over Account, Opportunity, Contact, and Activity attributes.
              Every signal has an action. Live signals surface as firings on the seller's account cards.
            </div>
          </div>
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-primary text-white rounded hover:bg-primary-dim transition-colors flex-shrink-0"
        >
          <Plus size={13} />
          New signal
        </button>
      </div>

      {/* Stats + search */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <StatChip label="Live" value={liveCount} color="emerald" />
        <StatChip label="Drafts" value={draftCount} color="amber" />
        <StatChip label="CRM attributes available" value={CRM_ATTRIBUTES.length} color="slate" />
        <div className="flex-1" />
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search signals..."
            className="pl-7 pr-3 py-1.5 text-xs bg-surface border border-border rounded w-56 focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg/40 border-b border-border">
            <tr className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
              <th className="text-left px-4 py-2 font-semibold">Signal</th>
              <th className="text-left px-4 py-2 font-semibold">Action</th>
              <th className="text-left px-4 py-2 font-semibold">Category</th>
              <th className="text-right px-4 py-2 font-semibold">Firings · 7d</th>
              <th className="text-left px-4 py-2 font-semibold">Status</th>
              <th className="text-right px-4 py-2 font-semibold w-16" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <SignalRow
                key={s.id}
                signal={s}
                onEdit={() => handleEdit(s)}
                onDelete={() => handleDelete(s)}
                onToggle={() => handleToggleStatus(s)}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-sm text-text-muted">
                  No signals matched. Click <span className="text-text-primary font-semibold">New signal</span> to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {designerOpen && (
        <DesignerModal
          initial={editingSignal}
          onClose={() => { setDesignerOpen(false); setEditingSignal(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────
function SignalRow({ signal, onEdit, onDelete, onToggle }) {
  const category = SIGNAL_CATEGORIES.find((c) => c.id === signal.category) || SIGNAL_CATEGORIES.find((c) => c.id === 'custom');
  const action = getAction(signal.action);
  const ActionIcon = ACTION_ICON[signal.action] || Wand2;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-bg/30 transition-colors">
      <td className="px-4 py-3 cursor-pointer" onClick={onEdit}>
        <div className="text-sm font-semibold text-text-primary">{signal.name}</div>
        <div className="text-[11px] text-text-secondary mt-0.5 max-w-md truncate" title={summarizeRules(signal)}>
          {summarizeRules(signal)}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-primary">
          <ActionIcon size={11} className="text-primary" />
          {action?.label || signal.action}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded ${category.bg} ${category.color}`}>
          {category.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-[12px] font-mono text-text-secondary">
        {signal.firingCountLast7d ?? 0}
      </td>
      <td className="px-4 py-3">
        <StatusPill status={signal.status} />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="relative inline-block">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border rounded shadow-lg z-10 py-1"
            >
              <MenuButton onClick={onEdit} label="Edit signal" />
              <MenuButton
                onClick={onToggle}
                label={signal.status === 'live' ? 'Move to draft' : 'Publish (live)'}
                Icon={signal.status === 'live' ? Pause : Play}
              />
              <MenuButton onClick={onDelete} label="Delete" danger Icon={Trash2} />
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function MenuButton({ onClick, label, Icon, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-surface-2 transition-colors ${
        danger ? 'text-rose-600 dark:text-rose-400 hover:text-rose-700' : 'text-text-primary'
      }`}
    >
      {Icon && <Icon size={12} />}
      {label}
    </button>
  );
}

function StatusPill({ status }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
      Draft
    </span>
  );
}

function StatChip({ label, value, color }) {
  const bg = {
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    amber:   'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    slate:   'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  }[color] || 'bg-slate-500/10 text-slate-700';
  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded ${bg}`}>
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">{label}</span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Designer modal — NL prompt + rule chips + action selector
// -----------------------------------------------------------------------------
function DesignerModal({ initial, onClose, onSave }) {
  const isEdit = Boolean(initial?.id);

  // ─── State ────────────────────────────────────────────────────────
  const [name, setName]               = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [rules, setRules]             = useState(initial?.rules || []);
  const [logic, setLogic]             = useState(initial?.logic || 'AND');
  const [action, setAction]           = useState(initial?.action || 'generate_account_brief');
  const [category, setCategory]       = useState(initial?.category || 'custom');
  const [severity, setSeverity]       = useState(initial?.severity || 'medium');

  const [nlPrompt, setNlPrompt]       = useState('');
  const [nlSparkle, setNlSparkle]     = useState(false); // pulse when AI populates
  const [editingRuleId, setEditingRuleId] = useState(null);

  // Live-count preview
  const [id] = useState(initial?.id);
  const draftSignal = useMemo(() => ({ id, name, description, rules, logic, action, category, severity }), [id, name, description, rules, logic, action, category, severity]);
  const matchCount = useMemo(() => estimateMatchCount(draftSignal), [draftSignal]);

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleGenerate = () => {
    const draft = classifyNaturalLanguage(nlPrompt);
    if (!draft) return;
    setName(draft.name);
    setDescription(draft.description);
    setRules(draft.rules);
    setLogic(draft.logic);
    setCategory(draft.category);
    setSeverity(draft.severity);
    setNlSparkle(true);
    setTimeout(() => setNlSparkle(false), 600);
  };

  const addBlankRule = () => {
    const first = CRM_ATTRIBUTES[0];
    const rule = { id: `r_${Math.random().toString(36).slice(2, 8)}`, field: first.id, operator: first.operators[0], value: '' };
    setRules([...rules, rule]);
    setEditingRuleId(rule.id);
  };
  const updateRule = (id, patch) => setRules(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const deleteRule = (id) => setRules(rules.filter((r) => r.id !== id));

  const handleSave = (status) => {
    if (!name.trim()) {
      alert('Give the signal a name before saving.');
      return;
    }
    onSave({ ...draftSignal, status, weight: SEVERITIES.find((s) => s.id === severity)?.weight || 40 });
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-4xl mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">
                {isEdit ? 'Edit signal' : 'New first-party signal'}
              </div>
              <div className="text-[11px] text-text-muted">
                Describe what you want, then refine the rules.
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-2">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* ─── NL prompt (mockup #1 + #2) ────────────────────────── */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
              Describe the signal
            </label>
            <div className={`flex items-center gap-2 bg-surface border-2 rounded-lg px-3 py-2 transition-colors ${nlSparkle ? 'border-primary' : 'border-primary/40 focus-within:border-primary'}`}>
              <Sparkles size={16} className="text-amber-400 flex-shrink-0" />
              <input
                type="text"
                value={nlPrompt}
                onChange={(e) => setNlPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                placeholder="E.g.: Show me buyers active in the product..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              <button
                onClick={handleGenerate}
                disabled={!nlPrompt.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Wand2 size={11} />
                Generate rules
              </button>
            </div>
            <div className="text-[10px] text-text-muted mt-1.5">
              Try: "open opportunities" · "no activity in 30 days" · "renewal in 90 days" · "high value deals stuck" · "competitor mentioned"
            </div>
          </div>

          {/* ─── Name + description ────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">Signal name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Open opportunities"
                className="w-full px-2.5 py-1.5 text-sm bg-surface border border-border rounded focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description sellers will see on the account card"
                className="w-full px-2.5 py-1.5 text-sm bg-surface border border-border rounded focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* ─── Rules (mockup #3 — chips + New rule) ──────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-text-muted">
                Rules
              </label>
              <LogicToggle value={logic} onChange={setLogic} disabled={rules.length < 2} />
            </div>
            <div className="bg-bg/40 border border-border rounded-md p-3">
              {rules.length === 0 ? (
                <div className="text-[12px] text-text-muted italic px-1 py-2">
                  No rules yet. Type a description above and click Generate rules — or add one manually.
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {rules.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-2">
                      {i > 0 && (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted">
                          {logic}
                        </span>
                      )}
                      <RuleChip
                        rule={r}
                        editing={editingRuleId === r.id}
                        onOpen={() => setEditingRuleId(r.id)}
                        onClose={() => setEditingRuleId(null)}
                        onChange={(patch) => updateRule(r.id, patch)}
                        onDelete={() => deleteRule(r.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <button
                  onClick={addBlankRule}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-primary border border-primary/40 rounded hover:bg-primary/10 transition-colors"
                >
                  <Plus size={10} />
                  New rule
                </button>
                <div className="ml-auto text-[11px] text-text-muted">
                  <span className="font-mono">~{matchCount}</span> accounts would match in your CRM
                </div>
              </div>
            </div>
          </div>

          {/* ─── Action selector ───────────────────────────────────── */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
              When this signal fires, do this action
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SIGNAL_ACTIONS.map((a) => {
                const Icon = ACTION_ICON[a.id] || Wand2;
                const selected = action === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setAction(a.id)}
                    className={`text-left px-3 py-2 border rounded flex items-start gap-2.5 transition-colors ${
                      selected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40 hover:bg-surface-2'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${selected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                      <Icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold ${selected ? 'text-primary' : 'text-text-primary'}`}>
                        {a.label}
                      </div>
                      <div className="text-[10px] text-text-muted leading-snug mt-0.5">
                        {a.description}
                      </div>
                    </div>
                    {selected && <CheckCircle2 size={13} className="text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Metadata ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2 py-1.5 text-sm bg-surface border border-border rounded focus:outline-none focus:border-primary/50"
              >
                {SIGNAL_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-2 py-1.5 text-sm bg-surface border border-border rounded focus:outline-none focus:border-primary/50"
              >
                {SEVERITIES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label} (weight {s.weight})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="text-[11px] text-text-muted">
            {rules.length === 0 ? (
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                <AlertTriangle size={11} />
                Add at least one rule before publishing.
              </span>
            ) : (
              <span>
                Estimated firings: <span className="font-mono font-semibold text-text-primary">~{matchCount}</span> accounts today
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave('draft')}
              disabled={!name.trim() || rules.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-2 disabled:opacity-40 transition-colors"
            >
              Save draft
            </button>
            <button
              onClick={() => handleSave('live')}
              disabled={!name.trim() || rules.length === 0}
              className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded hover:bg-primary-dim disabled:opacity-40 transition-colors"
            >
              Publish signal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LogicToggle ────────────────────────────────────────────────────
function LogicToggle({ value, onChange, disabled }) {
  return (
    <div className={`inline-flex items-center bg-surface border border-border rounded p-0.5 text-[10px] uppercase tracking-wider font-semibold ${disabled ? 'opacity-40' : ''}`}>
      {['AND', 'OR'].map((v) => (
        <button
          key={v}
          disabled={disabled}
          onClick={() => onChange(v)}
          className={`px-2 py-0.5 rounded transition-colors ${
            value === v ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Match {v}
        </button>
      ))}
    </div>
  );
}

// ─── RuleChip — chip + popover editor ───────────────────────────────
function RuleChip({ rule, editing, onOpen, onClose, onChange, onDelete }) {
  const attr = getAttribute(rule.field);
  const opLabel = OPERATOR_LABELS[rule.operator] || rule.operator;
  const displayValue = rule.value == null
    ? ''
    : Array.isArray(rule.value)
      ? rule.value.slice(0, 2).join(', ') + (rule.value.length > 2 ? ` +${rule.value.length - 2}` : '')
      : String(rule.value);

  const needsValue = !['is_empty', 'is_not_empty'].includes(rule.operator);

  return (
    <div className="relative">
      <button
        onClick={onOpen}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border rounded hover:border-primary/40 hover:bg-primary/5 transition-colors group"
      >
        <Database size={10} className="text-text-muted" />
        <span className="text-[11px] font-semibold text-text-primary">{attr?.label || rule.field}</span>
        <span className="text-[11px] text-text-secondary">{opLabel}</span>
        {needsValue && displayValue && (
          <span className="text-[11px] font-semibold text-primary">{displayValue}</span>
        )}
      </button>
      {editing && (
        <RulePopover rule={rule} onClose={onClose} onChange={onChange} onDelete={onDelete} />
      )}
    </div>
  );
}

function RulePopover({ rule, onClose, onChange, onDelete }) {
  const [expandedObject, setExpandedObject] = useState(getAttribute(rule.field)?.object || 'account');
  const attr = getAttribute(rule.field);
  const grouped = groupedAttributes();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onClick = (e) => {
      if (!e.target.closest('.rule-popover')) onClose();
    };
    window.addEventListener('keydown', onKey);
    // Delay attach so the click that opened the popover doesn't close it
    setTimeout(() => window.addEventListener('mousedown', onClick), 0);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [onClose]);

  const setField = (fieldId) => {
    const next = getAttribute(fieldId);
    if (!next) return;
    onChange({
      field: fieldId,
      operator: next.operators[0],
      value: next.type === 'boolean' ? true : (next.type === 'number' || next.type === 'date' ? '' : (next.options?.[0] || '')),
    });
  };

  const renderValueInput = () => {
    if (!attr) return null;
    if (['is_empty', 'is_not_empty'].includes(rule.operator)) return null;
    if (attr.type === 'number' || attr.operator === 'in_last_n_days' || rule.operator === 'in_next_n_days' || rule.operator === 'older_than_n_days') {
      return (
        <input
          type="number"
          value={rule.value ?? ''}
          onChange={(e) => onChange({ value: e.target.value === '' ? '' : Number(e.target.value) })}
          className="w-full px-2 py-1 text-sm bg-bg/40 border border-border rounded focus:outline-none focus:border-primary/50"
        />
      );
    }
    if (attr.type === 'date') {
      return (
        <input
          type="text"
          value={rule.value ?? ''}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="today, or YYYY-MM-DD"
          className="w-full px-2 py-1 text-sm bg-bg/40 border border-border rounded focus:outline-none focus:border-primary/50"
        />
      );
    }
    if (attr.type === 'boolean') {
      return (
        <select
          value={rule.value === true ? 'true' : 'false'}
          onChange={(e) => onChange({ value: e.target.value === 'true' })}
          className="w-full px-2 py-1 text-sm bg-bg/40 border border-border rounded focus:outline-none focus:border-primary/50"
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }
    if (attr.type === 'enum' && ['in', 'not_in'].includes(rule.operator) && attr.options) {
      const arr = Array.isArray(rule.value) ? rule.value : (rule.value ? [rule.value] : []);
      const toggle = (opt) => {
        onChange({ value: arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt] });
      };
      return (
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1 bg-bg/40 border border-border rounded">
          {attr.options.map((o) => (
            <button
              key={o}
              onClick={() => toggle(o)}
              className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${
                arr.includes(o)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      );
    }
    if (attr.type === 'enum' && attr.options) {
      return (
        <select
          value={rule.value || ''}
          onChange={(e) => onChange({ value: e.target.value })}
          className="w-full px-2 py-1 text-sm bg-bg/40 border border-border rounded focus:outline-none focus:border-primary/50"
        >
          {attr.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        type="text"
        value={rule.value ?? ''}
        onChange={(e) => onChange({ value: e.target.value })}
        className="w-full px-2 py-1 text-sm bg-bg/40 border border-border rounded focus:outline-none focus:border-primary/50"
      />
    );
  };

  return (
    <div className="rule-popover absolute z-50 top-full left-0 mt-1 w-96 bg-surface border border-border rounded-md shadow-xl p-3 space-y-3">
      {/* Field picker */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1">CRM attribute</label>
        <div className="bg-bg/40 border border-border rounded max-h-40 overflow-y-auto">
          {grouped.map((obj) => (
            <div key={obj.id}>
              <button
                onClick={() => setExpandedObject(expandedObject === obj.id ? '' : obj.id)}
                className="w-full text-left px-2 py-1.5 flex items-center gap-1 text-[11px] font-semibold text-text-secondary hover:bg-surface-2"
              >
                {expandedObject === obj.id ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                {obj.label}
                <span className="ml-1 text-[10px] text-text-muted">({obj.attributes.length})</span>
              </button>
              {expandedObject === obj.id && (
                <div className="pl-4 pb-1">
                  {obj.attributes.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setField(a.id)}
                      className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors ${
                        rule.field === a.id
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-text-primary hover:bg-surface-2'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Operator */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1">Operator</label>
        <select
          value={rule.operator}
          onChange={(e) => onChange({ operator: e.target.value })}
          className="w-full px-2 py-1 text-sm bg-bg/40 border border-border rounded focus:outline-none focus:border-primary/50"
        >
          {(attr?.operators || []).map((op) => (
            <option key={op} value={op}>{OPERATOR_LABELS[op] || op}</option>
          ))}
        </select>
      </div>

      {/* Value */}
      {!['is_empty', 'is_not_empty'].includes(rule.operator) && (
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1">Value</label>
          {renderValueInput()}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-rose-600 dark:text-rose-400 hover:underline"
        >
          <Trash2 size={10} />
          Delete rule
        </button>
        <button
          onClick={onClose}
          className="px-2.5 py-1 text-[11px] font-semibold bg-primary text-white rounded hover:bg-primary-dim transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
