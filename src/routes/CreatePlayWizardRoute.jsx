import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, X, Wand2, Layers as LayersIcon,
  Filter, Sparkles, Package, Users, Zap, Mail, Send, ListTodo,
  Workflow, Library, Plus, Bell, Repeat, CheckCircle2, Circle,
} from 'lucide-react';
import { usePersona } from '../context/PersonaContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { listWorkbooksForPersona, resolveWorkbookRows } from '../data/workbooks.js';
import { listOfferings } from '../data/offerings.js';
import { upsertPlay, PLAY_ACTION_TYPES } from '../data/plays.js';
import { listWorkflowTemplates } from '../data/workflowTemplates.js';
import { listWorkflows } from '../data/workflows.js';
import { WORKFLOW_NODE_TYPES } from '../data/workflowNodes.js';
import FilterPanel from '../components/workbook/FilterPanel.jsx';

const MOTION_OPTIONS = [
  { id: 'displacement',       label: 'Displacement',    desc: 'Displace an incumbent vendor',      defaultType: 'outbound' },
  { id: 'new_logo',           label: 'Net New Logo',    desc: 'Pursue net-new accounts',           defaultType: 'outbound' },
  { id: 'expansion',          label: 'Expansion',       desc: 'Sell more into existing customers', defaultType: 'outbound' },
  { id: 'in_market',          label: 'In-Market',       desc: 'Buyer showing purchase intent',     defaultType: 'inbound' },
  { id: 'opportunity_window', label: 'Catalyst Event',  desc: 'Time-boxed trigger (funding, hire, champion move)', defaultType: 'inbound' },
  { id: 'renewal',            label: 'Renewal Defense', desc: 'Protect an at-risk renewal',        defaultType: 'inbound' },
];

const STEPS = [
  { key: 'audience', label: 'Audience',  icon: Filter,   desc: 'Refine the record set' },
  { key: 'context',  label: 'Context',   icon: Package,  desc: 'Offering + motion' },
  { key: 'actions',  label: 'Actions',   icon: Zap,      desc: 'What the copilot will run' },
];

function workflowTriggerFor(workflow) {
  const nodes = workflow?.tree?.nodes || {};
  for (const node of Object.values(nodes)) {
    const meta = WORKFLOW_NODE_TYPES[node.type];
    if (meta?.isTrigger) return node.type;
  }
  return null;
}

function StepIndicator({ currentStep, onJump }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const isCurrent = i === currentStep;
        const isDone = i < currentStep;
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <button
              onClick={() => (isDone ? onJump(i) : null)}
              disabled={!isDone && !isCurrent}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${
                isCurrent
                  ? 'bg-primary/15 text-primary font-semibold'
                  : isDone
                  ? 'text-text-secondary hover:text-text-primary cursor-pointer'
                  : 'text-text-muted cursor-not-allowed'
              }`}
            >
              {isDone ? <Check size={11} /> : <Icon size={11} />}
              <span>{i + 1}. {s.label}</span>
            </button>
            {i < STEPS.length - 1 && <ArrowRight size={11} className="text-text-muted" />}
          </div>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Step 1 · Audience
// -----------------------------------------------------------------------------
function AudienceStep({ workbookId, setWorkbookId, workbooks, selectedRecordIds, setSelectedRecordIds, audienceFilters, setAudienceFilters, audienceMode, setAudienceMode, crmConnected }) {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const workbook = workbookId ? workbooks.find((w) => w.id === workbookId) : null;
  const workbookRows = useMemo(() => (workbook ? resolveWorkbookRows(workbook) : []), [workbook]);

  const effectiveRecordCount = selectedRecordIds.length > 0
    ? selectedRecordIds.length
    : workbookRows.length;

  const addOrUpdateFilter = (filter) => {
    const exists = audienceFilters.some((f) => f.id === filter.id);
    setAudienceFilters(exists ? audienceFilters.map((f) => (f.id === filter.id ? filter : f)) : [...audienceFilters, filter]);
  };
  const removeFilter = (id) => setAudienceFilters(audienceFilters.filter((f) => f.id !== id));
  const clearFilters = () => setAudienceFilters([]);

  return (
    <div className="space-y-4">
      {/* Workbook picker */}
      <div className="bg-surface border border-border rounded-md p-4">
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">Workbook</div>
        <div className="text-[11px] text-text-secondary mb-3 leading-relaxed">
          Every play starts from a workbook. This is your source record set — the copilot will run for these records when the play activates.
        </div>
        <div className="grid grid-cols-2 gap-2">
          {workbooks.map((w) => {
            const isSelected = w.id === workbookId;
            return (
              <button
                key={w.id}
                onClick={() => {
                  setWorkbookId(w.id);
                  // Clear record selection when switching workbook (records no longer apply).
                  setSelectedRecordIds([]);
                }}
                className={`text-left px-3 py-2.5 rounded border transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-bg/40 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSelected ? <CheckCircle2 size={12} className="text-primary" /> : <Circle size={12} className="text-text-muted" />}
                  <span className="text-xs font-semibold text-text-primary truncate">{w.name}</span>
                </div>
                <div className="text-[10px] text-text-muted mt-1 ml-5">
                  {w.accountCount ?? (w.rows?.length || 0)} records
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Refinement + filters */}
      {workbook && (
        <div className="bg-surface border border-border rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                Audience refinement
              </div>
              <div className="text-[11px] text-text-secondary mt-0.5">
                Layer HG + 1P filters on top of the workbook to narrow the record set.
              </div>
            </div>
            <button
              onClick={() => setFilterPanelOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors"
            >
              <Filter size={11} />
              {audienceFilters.length > 0 ? `Refine (${audienceFilters.length})` : 'Refine audience'}
            </button>
          </div>

          {audienceFilters.length === 0 ? (
            <div className="text-[11px] text-text-muted italic">
              No refinements yet. The play will operate on every record in the workbook.
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {audienceFilters.map((f) => (
                <span key={f.id} className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] rounded border bg-sky-500/5 border-sky-500/30 text-sky-700 dark:text-sky-300">
                  <span className="font-mono opacity-60">{f.group}</span>
                  <span>{f.label}: {f.displayValue}</span>
                  <button
                    onClick={() => removeFilter(f.id)}
                    className="hover:text-rose-600 transition-colors"
                  >
                    <X size={9} />
                  </button>
                </span>
              ))}
              <button
                onClick={clearFilters}
                className="text-[10px] text-text-muted hover:text-text-secondary"
              >
                Clear all
              </button>
            </div>
          )}

          {selectedRecordIds.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-[11px]">
              <LayersIcon size={11} className="text-primary" />
              <span className="text-text-secondary">
                Starting from <span className="font-semibold text-text-primary">{selectedRecordIds.length}</span> pre-selected record{selectedRecordIds.length === 1 ? '' : 's'} on this workbook.
              </span>
              <button
                onClick={() => setSelectedRecordIds([])}
                className="ml-auto text-[10px] text-text-muted hover:text-text-secondary"
              >
                Use full workbook instead
              </button>
            </div>
          )}
        </div>
      )}

      {/* Effective count summary */}
      {workbook && (
        <div className="bg-primary/5 border border-primary/30 rounded-md p-3 flex items-center gap-3">
          <Users size={16} className="text-primary flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-text-primary">
              {effectiveRecordCount.toLocaleString()} records in play scope
            </div>
            <div className="text-[11px] text-text-secondary mt-0.5">
              {selectedRecordIds.length > 0
                ? `${selectedRecordIds.length} pre-selected records from ${workbook.name}${audienceFilters.length > 0 ? ` · ${audienceFilters.length} filter${audienceFilters.length === 1 ? '' : 's'} applied` : ''}`
                : `All records in ${workbook.name}${audienceFilters.length > 0 ? ` · ${audienceFilters.length} filter${audienceFilters.length === 1 ? '' : 's'} applied` : ''}`}
            </div>
          </div>
        </div>
      )}

      {/* Audience mode toggle — static (frozen) vs dynamic (live query). */}
      {workbook && (
        <div className="bg-surface border border-border rounded-md p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Audience mode</div>
              <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                {audienceMode === 'dynamic'
                  ? 'Live — new records that match the filter will enter the play automatically.'
                  : 'Frozen — only the records in scope right now will execute. New matches won\'t be added.'}
              </div>
            </div>
            <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-md p-0.5 flex-shrink-0">
              <button
                onClick={() => setAudienceMode('static')}
                className={`px-2.5 py-1 text-xs rounded transition-colors inline-flex items-center gap-1 ${
                  audienceMode === 'static'
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Circle size={10} />
                Static
              </button>
              <button
                onClick={() => setAudienceMode('dynamic')}
                className={`px-2.5 py-1 text-xs rounded transition-colors inline-flex items-center gap-1 ${
                  audienceMode === 'dynamic'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Repeat size={10} />
                Dynamic
              </button>
            </div>
          </div>
        </div>
      )}

      <FilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={audienceFilters}
        onAddOrUpdate={addOrUpdateFilter}
        onRemove={removeFilter}
        onClearAll={clearFilters}
        crmConnected={crmConnected}
        title="Refine audience"
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Step 2 · Context (offering + motion + name + type)
// -----------------------------------------------------------------------------
function ContextStep({ playName, setPlayName, description, setDescription, offeringId, setOfferingId, motionId, setMotionId, playType, setPlayType, offerings }) {
  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-md p-4">
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">Play details</div>
        <div className="space-y-2.5">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Name</label>
            <input
              type="text"
              value={playName}
              onChange={(e) => setPlayName(e.target.value)}
              placeholder="e.g. Q3 Wiz Displacement — Banking"
              className="w-full px-3 py-2 mt-1 text-sm bg-bg border border-border rounded-md text-text-primary focus:outline-none focus:border-primary/40"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="1-2 sentences on what this play does and why it fires."
              className="w-full px-3 py-2 mt-1 text-xs bg-bg border border-border rounded-md text-text-primary focus:outline-none focus:border-primary/40 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-md p-4">
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">Offering</div>
        <div className="text-[11px] text-text-secondary mb-3 leading-relaxed">
          Which product this play sells. Determines fit scoring + persona targeting.
        </div>
        <div className="grid grid-cols-2 gap-2">
          {offerings.map((o) => {
            const isSelected = o.id === offeringId;
            return (
              <button
                key={o.id}
                onClick={() => setOfferingId(o.id)}
                className={`text-left px-3 py-2.5 rounded border transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-bg/40 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSelected ? <CheckCircle2 size={12} className="text-primary" /> : <Circle size={12} className="text-text-muted" />}
                  <span className="text-xs font-semibold text-text-primary truncate">{o.name}</span>
                </div>
                <div className="text-[10px] text-text-muted mt-1 ml-5 line-clamp-1">{o.description || o.shortName}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-md p-4">
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">GTM motion</div>
        <div className="grid grid-cols-2 gap-2">
          {MOTION_OPTIONS.map((m) => {
            const isSelected = m.id === motionId;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setMotionId(m.id);
                  // Auto-adjust play type based on motion default (rep can still toggle).
                  setPlayType(m.defaultType);
                }}
                className={`text-left px-3 py-2 rounded border transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-bg/40 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSelected ? <CheckCircle2 size={12} className="text-primary" /> : <Circle size={12} className="text-text-muted" />}
                  <span className="text-xs font-semibold text-text-primary">{m.label}</span>
                </div>
                <div className="text-[10px] text-text-muted mt-1 ml-5">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-md p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Play type</div>
            <div className="text-[11px] text-text-secondary mt-0.5">
              How the play activates — proactive (outbound) or trigger-driven (inbound).
            </div>
          </div>
          <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-md p-0.5">
            <button
              onClick={() => setPlayType('outbound')}
              className={`px-2.5 py-1 text-xs rounded transition-colors inline-flex items-center gap-1 ${
                playType === 'outbound' ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Repeat size={10} />
              Outbound
            </button>
            <button
              onClick={() => setPlayType('inbound')}
              className={`px-2.5 py-1 text-xs rounded transition-colors inline-flex items-center gap-1 ${
                playType === 'inbound' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Bell size={10} />
              Inbound
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Step 3 · Actions
// -----------------------------------------------------------------------------
function ActionsStep({ actions, setActions, workflowIds, setWorkflowIds, playType }) {
  const [tab, setTab] = useState('individual');
  const [addingType, setAddingType] = useState(null);
  const [draft, setDraft] = useState({});

  const workflows = useMemo(() => listWorkflows(), []);
  const templates = useMemo(() => listWorkflowTemplates(), []);

  const startAdding = (type) => {
    setAddingType(type);
    const spec = PLAY_ACTION_TYPES[type];
    const initial = {};
    for (const f of spec.fields) {
      if (f.type === 'select' && f.options?.length) initial[f.key] = f.options[0];
      else initial[f.key] = '';
    }
    setDraft(initial);
  };

  const commitAdd = () => {
    if (!addingType) return;
    const spec = PLAY_ACTION_TYPES[addingType];
    // Basic required-field check.
    for (const f of spec.fields) {
      if (f.required && !draft[f.key]) return;
    }
    setActions([
      ...actions,
      {
        id: `act_local_${Date.now()}`,
        type: addingType,
        config: { ...draft },
        requires_approval: spec.requires_approval_by_default,
      },
    ]);
    setAddingType(null);
    setDraft({});
  };

  const removeAction = (id) => setActions(actions.filter((a) => a.id !== id));

  const toggleWorkflow = (wfId) => {
    setWorkflowIds(workflowIds.includes(wfId) ? workflowIds.filter((id) => id !== wfId) : [...workflowIds, wfId]);
  };

  const compatibleWorkflows = (list) =>
    list.filter((w) => {
      const trigger = workflowTriggerFor(w);
      if (!trigger) return false;
      if (playType === 'outbound') return trigger === 'trigger.manual' || trigger === 'trigger.scheduled';
      return trigger !== 'trigger.manual' && trigger !== 'trigger.scheduled';
    });

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-md p-1 flex gap-1">
        <button
          onClick={() => setTab('individual')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded transition-colors ${
            tab === 'individual' ? 'bg-primary/15 text-primary font-semibold' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Zap size={11} />
          Individual actions
          {actions.length > 0 && (
            <span className="text-[10px] font-mono px-1 rounded bg-primary/20">{actions.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('workflow')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded transition-colors ${
            tab === 'workflow' ? 'bg-primary/15 text-primary font-semibold' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Workflow size={11} />
          Multi-step workflow
          {workflowIds.length > 0 && (
            <span className="text-[10px] font-mono px-1 rounded bg-primary/20">{workflowIds.length}</span>
          )}
        </button>
      </div>

      {tab === 'individual' && (
        <>
          <div className="bg-surface border border-border rounded-md p-4">
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">Attached actions</div>
            {actions.length === 0 ? (
              <div className="text-[11px] text-text-muted italic mb-3">
                No individual actions yet. Pick one below to add.
              </div>
            ) : (
              <div className="space-y-2 mb-3">
                {actions.map((a) => {
                  const spec = PLAY_ACTION_TYPES[a.type];
                  if (!spec) return null;
                  const configSummary = Object.entries(a.config || {})
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' · ');
                  return (
                    <div key={a.id} className="bg-bg/40 border border-border rounded p-2.5 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                        {a.type === 'add_to_sequence' && <Send size={13} className="text-primary" />}
                        {a.type === 'draft_email' && <Mail size={13} className="text-primary" />}
                        {a.type === 'create_task' && <ListTodo size={13} className="text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-text-primary">{spec.label}</div>
                        <div className="text-[10px] text-text-muted truncate">{configSummary || '—'}</div>
                      </div>
                      {a.requires_approval && (
                        <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          Approval
                        </span>
                      )}
                      <button
                        onClick={() => removeAction(a.id)}
                        className="p-1 text-text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {Object.values(PLAY_ACTION_TYPES).map((spec) => (
                <button
                  key={spec.id}
                  onClick={() => startAdding(spec.id)}
                  className="text-left px-3 py-2 rounded border border-dashed border-border bg-bg/40 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {spec.id === 'add_to_sequence' && <Send size={11} className="text-primary" />}
                    {spec.id === 'draft_email' && <Mail size={11} className="text-primary" />}
                    {spec.id === 'create_task' && <ListTodo size={11} className="text-primary" />}
                    <span className="text-xs font-semibold text-text-primary">{spec.label}</span>
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5 line-clamp-2">{spec.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {addingType && (
            <div className="bg-surface border border-primary/30 rounded-md p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-text-primary">
                  Configure: {PLAY_ACTION_TYPES[addingType].label}
                </span>
                <button
                  onClick={() => { setAddingType(null); setDraft({}); }}
                  className="ml-auto text-[10px] text-text-muted hover:text-text-secondary"
                >
                  Cancel
                </button>
              </div>
              <div className="space-y-2.5">
                {PLAY_ACTION_TYPES[addingType].fields.map((f) => (
                  <div key={f.key}>
                    <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                      {f.label}
                      {f.required && <span className="text-rose-500 ml-0.5">*</span>}
                    </label>
                    {f.type === 'select' ? (
                      <select
                        value={draft[f.key] || ''}
                        onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                        className="w-full px-2 py-1.5 mt-1 text-xs bg-bg border border-border rounded text-text-primary focus:outline-none focus:border-primary/40"
                      >
                        {f.options.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : f.type === 'number' ? (
                      <input
                        type="number"
                        value={draft[f.key] || ''}
                        placeholder={f.placeholder}
                        onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                        className="w-full px-2 py-1.5 mt-1 text-xs bg-bg border border-border rounded text-text-primary font-mono focus:outline-none focus:border-primary/40"
                      />
                    ) : (
                      <input
                        type="text"
                        value={draft[f.key] || ''}
                        placeholder={f.placeholder}
                        onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                        className="w-full px-2 py-1.5 mt-1 text-xs bg-bg border border-border rounded text-text-primary focus:outline-none focus:border-primary/40"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  onClick={() => { setAddingType(null); setDraft({}); }}
                  className="px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={commitAdd}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
                >
                  <Plus size={11} />
                  Add action
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'workflow' && (
        <>
          <div className="bg-surface border border-border rounded-md p-4">
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
              <Library size={10} className="inline mr-1" />
              Start from a template
            </div>
            <div className="text-[11px] text-text-secondary mb-3 leading-relaxed">
              Multi-step workflows pre-wired for common motions. Filtered to {playType} compatibility.
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
              {compatibleWorkflows(templates).map((w) => {
                const isSelected = workflowIds.includes(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => toggleWorkflow(w.id)}
                    className={`text-left px-3 py-2 rounded border transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border bg-bg/40 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? <CheckCircle2 size={12} className="text-primary" /> : <Circle size={12} className="text-text-muted" />}
                      <span className="text-xs font-semibold text-text-primary">{w.name}</span>
                      <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        Template
                      </span>
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5 ml-5 line-clamp-2">{w.description}</div>
                  </button>
                );
              })}
              {compatibleWorkflows(templates).length === 0 && (
                <div className="text-[11px] text-text-muted italic text-center py-4">
                  No templates match this play type. Try building your own below.
                </div>
              )}
            </div>
          </div>

          {compatibleWorkflows(workflows).length > 0 && (
            <div className="bg-surface border border-border rounded-md p-4">
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
                <Workflow size={10} className="inline mr-1" />
                Your workflows
              </div>
              <div className="grid grid-cols-1 gap-2">
                {compatibleWorkflows(workflows).map((w) => {
                  const isSelected = workflowIds.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      onClick={() => toggleWorkflow(w.id)}
                      className={`text-left px-3 py-2 rounded border transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border bg-bg/40 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected ? <CheckCircle2 size={12} className="text-primary" /> : <Circle size={12} className="text-text-muted" />}
                        <span className="text-xs font-semibold text-text-primary">{w.name}</span>
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5 ml-5 line-clamp-2">{w.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-surface border border-dashed border-border rounded-md p-4 text-center">
            <Sparkles size={16} className="text-text-muted mx-auto mb-2" />
            <div className="text-xs text-text-secondary mb-2">Need a fully custom workflow?</div>
            <a
              href="/admin/workflows/new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 text-primary hover:bg-primary/10 text-xs rounded-md transition-colors"
            >
              <Plus size={11} />
              Build your own in Workflow Studio
              <ArrowRight size={10} />
            </a>
          </div>
        </>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Wizard shell
// -----------------------------------------------------------------------------
export default function CreatePlayWizardRoute() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { personaId, persona } = usePersona();
  const [searchParams] = useSearchParams();

  const preselectedWorkbookId = searchParams.get('workbook') || null;
  const preselectedRecords = (searchParams.get('records') || '').split(',').filter(Boolean);

  const workbooks = useMemo(
    () => listWorkbooksForPersona({ personaId, isAdmin: persona?.roleType === 'admin', crmConnected: false }),
    [personaId, persona],
  );

  const offerings = useMemo(() => listOfferings().filter((o) => o.confirmed !== false), []);

  const [step, setStep] = useState(0);
  const [workbookId, setWorkbookId] = useState(preselectedWorkbookId || workbooks[0]?.id || null);
  const [selectedRecordIds, setSelectedRecordIds] = useState(preselectedRecords);
  const [audienceFilters, setAudienceFilters] = useState([]);
  const [playName, setPlayName] = useState('');
  const [description, setDescription] = useState('');
  const [offeringId, setOfferingId] = useState(offerings[0]?.id || null);
  const [motion, setMotion] = useState('new_logo');
  const [playType, setPlayType] = useState('outbound');
  const [actions, setActions] = useState([]);
  const [workflowIds, setWorkflowIds] = useState([]);
  // Audience mode — smart default keyed to authoring gesture.
  //   Rep ticked specific rows → static (they picked those records).
  //   Rep is working the filtered view → dynamic (they want anything that
  //   matches the filter, now or later).
  const [audienceMode, setAudienceMode] = useState(
    preselectedRecords.length > 0 ? 'static' : 'dynamic',
  );

  const canProceed = useMemo(() => {
    if (step === 0) return Boolean(workbookId);
    if (step === 1) return Boolean(playName.trim() && offeringId && motion);
    return true;
  }, [step, workbookId, playName, offeringId, motion]);

  const handlePublish = () => {
    if (!playName.trim() || !offeringId || !motion || !workbookId) return;
    const playId = `play-${Date.now()}`;
    const newPlay = {
      id: playId,
      name: playName.trim(),
      description: description.trim() || `${motion.replace('_', ' ')} play from ${workbooks.find((w) => w.id === workbookId)?.name || 'workbook'}.`,
      motion,
      type: playType,
      status: 'active',
      offerings: [offeringId],
      offering_id: offeringId,
      audience_roles: persona?.roleType === 'admin' ? ['AE', 'AM'] : [persona?.role || 'AE'],
      surface_scope: 'both',
      is_default_chip: false,
      confirmed: true,
      firmoFilters: { industries: [], sizeBand: '', regions: [] },
      technoFilters: { hasInstalled: [], missingInstall: [], custom: [] },
      audienceFilters: audienceFilters,
      signals: [],
      workbookIds: [workbookId],
      source_workbook_id: workbookId,
      source_record_ids: selectedRecordIds,
      recommended_workflows: workflowIds,
      actions: actions.map((a) => ({ ...a, id: a.id || `act_${Date.now()}_${Math.floor(Math.random() * 900)}` })),
      // Audience mode + filter snapshot. Dynamic plays freeze the
      // filter definition here so future re-eval matches the rep's intent.
      audience: {
        mode: audienceMode,
        refreshCadence: 'daily',
        filterDefinition: audienceMode === 'dynamic' && audienceFilters.length > 0
          ? {
              chips: audienceFilters.map((f) => ({
                field: f.label,
                op: 'matches',
                values: [f.displayValue],
              })),
              summary: audienceFilters.map((f) => `${f.label}: ${f.displayValue}`).join(' · '),
            }
          : null,
        sizeCap: 5000,
        lastRefreshedAt: null,
      },
      audience_events: [],
      created_by: persona?.name || 'Rep',
      version: 1,
      visibility: persona?.roleType === 'admin' ? 'tenant' : 'private',
    };
    upsertPlay(newPlay);
    showToast(`Play "${playName.trim()}" created.`, 'success');
    navigate(`/admin/plays/${playId}`);
  };

  const currentStepConfig = STEPS[step];
  const workbook = workbookId ? workbooks.find((w) => w.id === workbookId) : null;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="border-b border-border bg-bg/95 backdrop-blur-sm px-6 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
        >
          <ArrowLeft size={11} />
          Back
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <Wand2 size={16} className="text-emerald-700 dark:text-emerald-300" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Create Sales Play</h1>
                <div className="text-[11px] text-text-muted mt-0.5">
                  {STEPS[step].desc}
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex justify-center min-w-0">
            <StepIndicator currentStep={step} onJump={setStep} />
          </div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
            Step {step + 1} of {STEPS.length}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div
          key={currentStepConfig.key}
          className="max-w-3xl mx-auto px-6 py-8"
        >
          {step === 0 && (
            <AudienceStep
              workbookId={workbookId}
              setWorkbookId={setWorkbookId}
              workbooks={workbooks}
              selectedRecordIds={selectedRecordIds}
              setSelectedRecordIds={setSelectedRecordIds}
              audienceFilters={audienceFilters}
              setAudienceFilters={setAudienceFilters}
              audienceMode={audienceMode}
              setAudienceMode={setAudienceMode}
              crmConnected={false}
            />
          )}
          {step === 1 && (
            <ContextStep
              playName={playName}
              setPlayName={setPlayName}
              description={description}
              setDescription={setDescription}
              offeringId={offeringId}
              setOfferingId={setOfferingId}
              motionId={motion}
              setMotionId={setMotion}
              playType={playType}
              setPlayType={setPlayType}
              offerings={offerings}
            />
          )}
          {step === 2 && (
            <ActionsStep
              actions={actions}
              setActions={setActions}
              workflowIds={workflowIds}
              setWorkflowIds={setWorkflowIds}
              playType={playType}
            />
          )}
        </div>
      </div>

      <div className="border-t border-border bg-bg/95 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <div className="text-[11px] text-text-muted">
          {workbook && (
            <>
              Workbook: <span className="font-semibold text-text-secondary">{workbook.name}</span>
              {selectedRecordIds.length > 0 && <> &middot; {selectedRecordIds.length} preselected</>}
              {audienceFilters.length > 0 && <> &middot; {audienceFilters.length} filter{audienceFilters.length === 1 ? '' : 's'}</>}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors"
            >
              <ArrowLeft size={11} />
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ArrowRight size={11} />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={!canProceed}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Check size={11} />
              Create play
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
