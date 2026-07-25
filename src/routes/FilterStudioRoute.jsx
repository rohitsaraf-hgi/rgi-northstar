import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, X, CheckCircle2, AlertTriangle,
  Layers, Sparkles, Database, Filter as FilterIcon, Trash2, Users,
  Building2, Zap, ChevronDown, ChevronRight, Cpu, ListTree, TrendingUp,
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import {
  listDerivedFilters,
  subscribeDerivedFilters,
  upsertDerivedFilter,
  deleteDerivedFilter,
  hasCycle,
  evaluateMatchCount,
  summarizeComposition,
  COMPOSER_PRIMITIVES,
  COMPOSER_GROUPS,
  VISIBILITY,
  MAX_COMPOSITION_DEPTH,
} from '../data/derivedFilters.js';

// Section counts on the header — these are illustrative for the demo.
const HG_PRIMITIVE_COUNT = COMPOSER_PRIMITIVES.length + 24; // registry + composer extras
const CRM_CUSTOM_COUNT = 14; // mocked auto-imported fields

const GROUP_ICON = {
  Person: Users,
  Company: Building2,
  Firmographics: Building2,
  Technographics: Cpu,
  Intent: Sparkles,
  Event: Zap,
  Behavior: TrendingUp,
  CRM: Database,
  Scoring: TrendingUp,
};

// -----------------------------------------------------------------------------
// Composer modal
// -----------------------------------------------------------------------------
function makeEmptyGroup() {
  return {
    op: 'or',
    conditions: [{ source: 'primitive', id: '', op: 'contains', values: [''] }],
  };
}

function ComposerModal({ initial, onClose, onSaved, allFilters }) {
  const isEdit = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [group, setGroup] = useState(initial?.group || 'Person');
  const [visibility, setVisibility] = useState(initial?.visibility || VISIBILITY.TENANT);
  const [groups, setGroups] = useState(
    initial?.composition?.groups?.length
      ? JSON.parse(JSON.stringify(initial.composition.groups))
      : [makeEmptyGroup()],
  );

  const composition = { groups };
  const matchCount = useMemo(() => evaluateMatchCount(composition), [groups]); // eslint-disable-line react-hooks/exhaustive-deps
  const cycleCheck = useMemo(() => {
    const candidate = { id: initial?.id || '__pending__', composition };
    return hasCycle(candidate, allFilters);
  }, [groups, initial?.id, allFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateGroup = (gIdx, patch) => {
    setGroups(groups.map((g, i) => (i === gIdx ? { ...g, ...patch } : g)));
  };
  const updateCondition = (gIdx, cIdx, patch) => {
    setGroups(groups.map((g, i) => {
      if (i !== gIdx) return g;
      return {
        ...g,
        conditions: g.conditions.map((c, j) => (j === cIdx ? { ...c, ...patch } : c)),
      };
    }));
  };
  const addCondition = (gIdx) => {
    setGroups(groups.map((g, i) => {
      if (i !== gIdx) return g;
      return { ...g, conditions: [...g.conditions, { source: 'primitive', id: '', op: 'contains', values: [''] }] };
    }));
  };
  const removeCondition = (gIdx, cIdx) => {
    setGroups(groups.map((g, i) => {
      if (i !== gIdx) return g;
      const next = g.conditions.filter((_, j) => j !== cIdx);
      return next.length > 0 ? { ...g, conditions: next } : g;
    }));
  };
  const addGroup = () => setGroups([...groups, makeEmptyGroup()]);
  const removeGroup = (gIdx) => {
    if (groups.length <= 1) return;
    setGroups(groups.filter((_, i) => i !== gIdx));
  };

  const canPublish = name.trim().length > 0
    && groups.every((g) => (g.conditions || []).every((c) => c.id))
    && cycleCheck.ok;

  const handleSave = (publish) => {
    const payload = {
      ...(initial || {}),
      name: name.trim(),
      description: description.trim(),
      group,
      visibility,
      composition,
      matchCount,
      definedBy: initial?.definedBy || 'Priya Sharma',
      status: publish ? 'published' : 'draft',
    };
    const saved = upsertDerivedFilter(payload);
    onSaved?.(saved);
  };

  const otherDerived = (allFilters || []).filter((f) => f.id !== initial?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <div className="bg-bg border border-border rounded-lg shadow-modal max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <ListTree size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">{isEdit ? 'Edit derived filter' : 'New derived filter'}</h2>
              <p className="text-[11px] text-text-muted">
                Compose primitives into a named filter your reps can pick from the FilterPanel.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-2 rounded transition-colors text-text-secondary">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Name + metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. GTM Persona"
                className="w-full px-3 py-2 mt-1 text-sm bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:border-primary/40"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Group</label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-3 py-2 mt-1 text-sm bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:border-primary/40"
              >
                {COMPOSER_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One sentence — how this filter helps and when to use it."
              className="w-full px-3 py-2 mt-1 text-xs bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:border-primary/40"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Visibility</label>
            <div className="flex items-center gap-1 mt-1 bg-surface border border-border rounded-md p-0.5 max-w-md">
              {[VISIBILITY.TENANT, VISIBILITY.TEAM, VISIBILITY.PRIVATE].map((v) => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors capitalize ${
                    visibility === v ? 'bg-primary/15 text-primary font-semibold' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Composition */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Composition</label>
              <span className="text-[10px] text-text-muted">
                All groups are joined with AND
              </span>
            </div>
            <div className="space-y-2">
              {groups.map((g, gIdx) => (
                <div key={gIdx} className="border border-border rounded-md p-3 bg-bg/40">
                  <div className="flex items-center gap-2 mb-2">
                    <select
                      value={g.op}
                      onChange={(e) => updateGroup(gIdx, { op: e.target.value })}
                      className="px-2 py-1 text-xs bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary/40 font-semibold"
                    >
                      <option value="or">Any of (OR)</option>
                      <option value="and">All of (AND)</option>
                    </select>
                    <span className="text-[11px] text-text-muted">
                      {(g.conditions || []).length} condition{(g.conditions || []).length === 1 ? '' : 's'}
                    </span>
                    {groups.length > 1 && (
                      <button
                        onClick={() => removeGroup(gIdx)}
                        className="ml-auto text-text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        title="Remove group"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {(g.conditions || []).map((c, cIdx) => (
                      <ConditionRow
                        key={cIdx}
                        condition={c}
                        otherDerived={otherDerived}
                        onChange={(patch) => updateCondition(gIdx, cIdx, patch)}
                        onRemove={() => removeCondition(gIdx, cIdx)}
                        canRemove={g.conditions.length > 1}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => addCondition(gIdx)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <Plus size={11} />
                    Add condition
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addGroup}
              className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] border border-dashed border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded transition-colors"
            >
              <Plus size={11} />
              Add AND group
            </button>
          </div>

          {/* Live preview + validation */}
          <div className={`rounded-md p-3 border ${cycleCheck.ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
            {cycleCheck.ok ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0" />
                <div className="text-[12px] text-text-primary flex-1">
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {matchCount.toLocaleString()}
                  </span>
                  {' '}records match this definition today
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <AlertTriangle size={13} className="text-rose-600 mt-0.5 flex-shrink-0" />
                <div className="text-[12px] text-text-primary">
                  <div className="font-semibold text-rose-700 dark:text-rose-300 mb-0.5">
                    {cycleCheck.reason === 'depth_exceeded' ? 'Too deep' : 'Circular reference'}
                  </div>
                  <div className="text-[11px] text-text-secondary leading-snug">
                    {cycleCheck.reason === 'depth_exceeded'
                      ? `Derived filters can compose up to ${MAX_COMPOSITION_DEPTH} levels deep. Trim a reference to publish.`
                      : `Reference chain would loop back to this filter: ${(cycleCheck.path || []).join(' → ')}`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-[10px] text-text-muted leading-snug">
            Published filters appear in the FilterPanel for every rep with visibility {visibility}.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={!canPublish}
              className="px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save as draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={!canPublish}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle2 size={11} />
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// A single condition row in the composer.
function ConditionRow({ condition, otherDerived, onChange, onRemove, canRemove }) {
  const isDerived = condition.source === 'derived';
  const prim = COMPOSER_PRIMITIVES.find((p) => p.id === condition.id);

  return (
    <div className="flex items-start gap-2 px-2 py-1.5 rounded bg-surface border border-border">
      {/* Source picker (primitive vs derived) */}
      <select
        value={condition.source}
        onChange={(e) => onChange({ source: e.target.value, id: '', op: e.target.value === 'derived' ? 'is' : 'contains', values: [''] })}
        className="px-1.5 py-1 text-[11px] bg-bg border border-border rounded text-text-primary focus:outline-none focus:border-primary/40 flex-shrink-0"
      >
        <option value="primitive">Primitive</option>
        <option value="derived">Derived filter</option>
      </select>

      {/* Field picker */}
      {isDerived ? (
        <select
          value={condition.id}
          onChange={(e) => onChange({ id: e.target.value })}
          className="flex-1 min-w-0 px-2 py-1 text-[11px] bg-bg border border-border rounded text-text-primary focus:outline-none focus:border-primary/40"
        >
          <option value="">Select a derived filter…</option>
          {otherDerived.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      ) : (
        <select
          value={condition.id}
          onChange={(e) => {
            const nextPrim = COMPOSER_PRIMITIVES.find((p) => p.id === e.target.value);
            onChange({
              id: e.target.value,
              op: nextPrim?.ops?.[0] || 'is',
              values: [nextPrim?.values?.[0] || ''],
            });
          }}
          className="flex-1 min-w-0 px-2 py-1 text-[11px] bg-bg border border-border rounded text-text-primary focus:outline-none focus:border-primary/40"
        >
          <option value="">Select a primitive…</option>
          {COMPOSER_GROUPS.map((groupName) => {
            const items = COMPOSER_PRIMITIVES.filter((p) => p.group === groupName);
            if (items.length === 0) return null;
            return (
              <optgroup key={groupName} label={groupName}>
                {items.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </optgroup>
            );
          })}
        </select>
      )}

      {/* Op picker */}
      {!isDerived && prim && (
        <select
          value={condition.op}
          onChange={(e) => onChange({ op: e.target.value })}
          className="px-1.5 py-1 text-[11px] bg-bg border border-border rounded text-text-primary focus:outline-none focus:border-primary/40 flex-shrink-0 w-20"
        >
          {(prim.ops || []).map((op) => <option key={op} value={op}>{op}</option>)}
        </select>
      )}

      {/* Values input */}
      {!isDerived && prim && (
        <input
          type={prim.type === 'number' ? 'number' : 'text'}
          value={Array.isArray(condition.values) ? condition.values.join(', ') : ''}
          onChange={(e) => onChange({
            values: e.target.value.split(',').map((v) => v.trim()).filter((v, i, arr) => v !== '' || arr.length === 1),
          })}
          placeholder={prim.values ? prim.values.join(', ') : (prim.type === 'number' ? '0' : 'value')}
          className="flex-1 min-w-0 px-2 py-1 text-[11px] font-mono bg-bg border border-border rounded text-text-primary focus:outline-none focus:border-primary/40"
        />
      )}

      {canRemove && (
        <button
          onClick={onRemove}
          className="p-1 text-text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors flex-shrink-0"
          title="Remove condition"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Filter tile — used by the read-only sections (HG primitives, CRM fields).
// -----------------------------------------------------------------------------
function PrimitiveTile({ label, group }) {
  const Icon = GROUP_ICON[group] || FilterIcon;
  return (
    <div className="px-2.5 py-1.5 rounded border border-border bg-bg/40 flex items-center gap-1.5">
      <Icon size={10} className="text-text-muted" />
      <span className="text-[11px] text-text-primary truncate">{label}</span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Route shell
// -----------------------------------------------------------------------------
export default function FilterStudioRoute() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tick, setTick] = useState(0);
  const [composerInitial, setComposerInitial] = useState(null); // null | {} | derivedFilter
  const [composerOpen, setComposerOpen] = useState(false);
  const [expandedHg, setExpandedHg] = useState(false);
  const [expandedCrm, setExpandedCrm] = useState(false);

  useEffect(() => subscribeDerivedFilters(() => setTick((t) => t + 1)), []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const derived = useMemo(() => listDerivedFilters(), [tick]);

  const openComposer = (initial) => {
    setComposerInitial(initial || {});
    setComposerOpen(true);
  };
  const closeComposer = () => {
    setComposerOpen(false);
    setComposerInitial(null);
  };
  const handleSaved = (saved) => {
    showToast(`${saved.status === 'published' ? 'Published' : 'Saved draft'} "${saved.name}"`, 'success');
    closeComposer();
  };
  const handleDelete = (filter) => {
    if (!window.confirm(`Delete "${filter.name}"? This can't be undone.`)) return;
    deleteDerivedFilter(filter.id);
    showToast(`Deleted "${filter.name}"`, 'info');
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Admin Hub
      </button>
      <div className="mb-2 text-xs text-text-muted">Platform & Ops · Filter Studio</div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center flex-shrink-0">
            <ListTree size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Filter Studio</h1>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
              Compose named filters your reps can use everywhere. Combine HG&rsquo;s primitives with your CRM custom fields, save them as reusable definitions, and publish them to the FilterPanel.
            </p>
          </div>
        </div>
        <button
          onClick={() => openComposer(null)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary-dim transition-colors shadow-sm flex-shrink-0"
        >
          <Plus size={12} />
          New derived filter
        </button>
      </div>

      {/* Tier 1 — HG primitives (collapsed by default) */}
      <TierCard
        icon={Sparkles}
        title="HG-provided primitives"
        countLabel={`${HG_PRIMITIVE_COUNT} filters · system`}
        blurb="Firmographics, technographics, intent, scoring, CRM, person, behavior, and event primitives. Always available. Ship with the platform."
        expanded={expandedHg}
        onToggle={() => setExpandedHg((v) => !v)}
      >
        <div className="grid grid-cols-3 gap-2">
          {COMPOSER_PRIMITIVES.slice(0, 12).map((p) => (
            <PrimitiveTile key={p.id} label={p.label} group={p.group} />
          ))}
          <div className="col-span-3 text-center text-[10px] text-text-muted mt-1">
            + {HG_PRIMITIVE_COUNT - 12} more — see the FilterPanel for the full catalog.
          </div>
        </div>
      </TierCard>

      {/* Tier 2 — CRM custom fields (auto-imported, collapsed) */}
      <TierCard
        icon={Database}
        title="Your CRM · Custom fields"
        countLabel={`${CRM_CUSTOM_COUNT} filters · auto-imported`}
        blurb="Every custom field on your Salesforce Account, Contact, Opportunity, and Lead objects appears as a filter automatically. Zero admin config."
        expanded={expandedCrm}
        onToggle={() => setExpandedCrm((v) => !v)}
      >
        <div className="grid grid-cols-3 gap-2">
          {['Territory (SF)', 'Segment (SF)', 'Tier (SF)', 'AE Name (SF)', 'CS Manager (SF)', 'Contract Value (SF)',
            'Contract End Date (SF)', 'Renewal Owner (SF)', 'Legal Status (HubSpot)', 'Product Interest (HubSpot)',
            'Deal Health (HubSpot)', 'Onboarding Stage (HubSpot)'].map((label) => (
            <PrimitiveTile key={label} label={label} group="CRM" />
          ))}
        </div>
      </TierCard>

      {/* Tier 3 — Tenant definitions (expanded, editable) */}
      <div className="bg-surface border border-primary/30 rounded-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <ListTree size={12} className="text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-text-primary">Your tenant definitions</h2>
          <span className="text-[11px] text-text-muted">{derived.length} filter{derived.length === 1 ? '' : 's'}</span>
        </div>
        {derived.length === 0 ? (
          <div className="text-center py-8">
            <ListTree size={20} className="text-text-muted mx-auto mb-2" />
            <div className="text-sm font-semibold text-text-primary mb-1">No derived filters yet</div>
            <div className="text-[11px] text-text-muted mb-3 max-w-md mx-auto leading-relaxed">
              Combine primitives with a boolean rule and publish. Reps will see it in the FilterPanel alongside the HG-provided filters.
            </div>
            <button
              onClick={() => openComposer(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
            >
              <Plus size={11} />
              Create your first
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {derived.map((f) => (
              <DerivedCard
                key={f.id}
                filter={f}
                allFilters={derived}
                onEdit={() => openComposer(f)}
                onDelete={() => handleDelete(f)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-border text-[11px] text-text-muted leading-relaxed max-w-3xl">
        <span className="font-semibold text-text-secondary">Composition rules:</span>{' '}
        Groups are joined with AND. Inside a group, conditions are joined by the group operator (Any-of / All-of).
        Derived filters can reference other derived filters up to <span className="font-semibold">{MAX_COMPOSITION_DEPTH} levels deep</span>. Cycles are detected at author time.
      </div>

      {composerOpen && (
        <ComposerModal
          initial={composerInitial}
          allFilters={derived}
          onClose={closeComposer}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function TierCard({ icon: Icon, title, countLabel, blurb, expanded, onToggle, children }) {
  return (
    <div className="bg-surface border border-border rounded-md mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-surface-2 transition-colors"
      >
        {expanded ? <ChevronDown size={12} className="text-text-muted flex-shrink-0" /> : <ChevronRight size={12} className="text-text-muted flex-shrink-0" />}
        <div className="w-6 h-6 rounded-md bg-primary/5 flex items-center justify-center flex-shrink-0">
          <Icon size={12} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text-primary">{title}</div>
          <div className="text-[10px] text-text-muted">{countLabel}</div>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <p className="text-[11px] text-text-secondary leading-snug mb-3">{blurb}</p>
          {children}
        </div>
      )}
    </div>
  );
}

function DerivedCard({ filter, allFilters, onEdit, onDelete }) {
  const summary = summarizeComposition(filter, allFilters);
  const Icon = GROUP_ICON[filter.group] || FilterIcon;
  return (
    <div className="bg-bg/40 border border-border rounded p-3 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon size={13} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-semibold text-text-primary">{filter.name}</span>
            <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
              {filter.group}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-surface-2 text-text-secondary border border-border capitalize">
              {filter.visibility}
            </span>
            {filter.status === 'draft' && (
              <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Draft
              </span>
            )}
          </div>
          {filter.description && (
            <p className="text-[11px] text-text-secondary leading-snug mb-1">{filter.description}</p>
          )}
          <div className="text-[10px] font-mono text-text-muted line-clamp-1" title={summary}>
            {summary}
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Layers size={10} />
              <span className="font-mono font-bold text-text-primary">{(filter.matchCount || 0).toLocaleString()}</span>
              matches
            </span>
            <span>·</span>
            <span>
              Used in <span className="font-mono font-bold text-text-primary">{filter.usage?.plays || 0}</span> plays
              · <span className="font-mono font-bold text-text-primary">{filter.usage?.workbooks || 0}</span> workbooks
            </span>
            <span>·</span>
            <span>Defined by {filter.definedBy || 'admin'} · {filter.definedAt || filter.updatedAt || '—'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="px-2 py-1 text-[11px] border border-primary/30 text-primary hover:bg-primary/10 rounded transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
            title="Delete filter"
            disabled={(filter.usage?.plays || 0) + (filter.usage?.workbooks || 0) > 0}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
