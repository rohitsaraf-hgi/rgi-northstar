// FilterPanel — HG-style full filter explorer. Slides in from the right
// of the workbook with a two-pane layout:
//   Left  · searchable category sidebar (Overview / Accounts / Scoring /
//           Intent / Firmographics / Technographics)
//   Right · the active filter's form widget (min/max, multi-select, etc.)
//
// Filters are stored as serializable specs so they can later be persisted
// onto a Workbook view. Predicates are materialized from spec via the
// FILTER_REGISTRY when filtering runs.

import { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Building2,
  BarChart3,
  Sparkles,
  Cpu,
  Users,
  FileText,
  Check,
  Database,
  ListTree,
  Layers,
} from 'lucide-react';
import { listOfferings } from '../../data/offerings.js';
import { FILTER_REGISTRY, FILTER_GROUPS, CRM_GATED_GROUPS } from '../../data/filterRegistry.js';
import {
  listDerivedFilters,
  subscribeDerivedFilters,
  summarizeComposition,
} from '../../data/derivedFilters.js';

// ─── Tiny presentational helpers ───────────────────────────────────────

function ActiveDot({ active }) {
  return (
    <span
      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        active ? 'bg-primary' : 'bg-text-muted/30'
      }`}
    />
  );
}

function SectionLabel({ children }) {
  return (
    <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider font-semibold text-text-muted">
      {children}
    </div>
  );
}

function FilterRow({ id, label, icon: Icon, active, hasValue, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
        active
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
      }`}
    >
      <ActiveDot active={hasValue} />
      {Icon && <Icon size={11} className="opacity-70 flex-shrink-0" />}
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}

// ─── Filter form widgets ───────────────────────────────────────────────

function MinMaxForm({ value, onChange, title, hint, allowFixedOnly = false }) {
  const v = value || {};
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1">Min</div>
          <input
            type="text"
            inputMode="numeric"
            placeholder="No limit"
            value={v.min ?? ''}
            onChange={(e) => onChange({ ...v, min: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded border border-border bg-surface focus:outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1">Max</div>
          <input
            type="text"
            inputMode="numeric"
            placeholder="No limit"
            value={v.max ?? ''}
            onChange={(e) => onChange({ ...v, max: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded border border-border bg-surface focus:outline-none focus:border-primary"
          />
        </label>
      </div>
      {allowFixedOnly && (
        <label className="flex items-start gap-2 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={!!v.fixedOnly}
            onChange={(e) => onChange({ ...v, fixedOnly: e.target.checked })}
            className="mt-0.5"
          />
          <span>Limit to companies with fixed {title?.toLowerCase()} values within this range</span>
        </label>
      )}
      {hint && (
        <div className="text-[11px] text-text-muted italic">{hint}</div>
      )}
    </div>
  );
}

function MultiSelectForm({ options, value, onChange, hint }) {
  const selected = new Set(value || []);
  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };
  return (
    <div className="space-y-2">
      {hint && (
        <div className="text-[11px] text-text-muted italic">{hint}</div>
      )}
      <div className="space-y-1 max-h-96 overflow-y-auto thin-scrollbar pr-1">
        {options.map((opt) => {
          const checked = selected.has(opt.id);
          return (
            <label
              key={opt.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt.id)}
              />
              <span className="text-sm flex-1">{opt.label}</span>
              {opt.tag && (
                <span className="text-[10px] text-text-muted font-mono">{opt.tag}</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function RadioForm({ options, value, onChange }) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.id}
          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-2 cursor-pointer"
        >
          <input
            type="radio"
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
          />
          <span className="text-sm flex-1">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function IntentForm({ value, onChange }) {
  const v = value || { topic: '', level: 'medium' };
  return (
    <div className="space-y-3">
      <label className="block">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1">Topic</div>
        <input
          type="text"
          placeholder="e.g. CNAPP, Zero Trust, IAM"
          value={v.topic || ''}
          onChange={(e) => onChange({ ...v, topic: e.target.value })}
          className="w-full px-3 py-2 text-sm rounded border border-border bg-surface focus:outline-none focus:border-primary"
        />
      </label>
      <label className="block">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1">Minimum Level</div>
        <select
          value={v.level || 'medium'}
          onChange={(e) => onChange({ ...v, level: e.target.value })}
          className="w-full px-3 py-2 text-sm rounded border border-border bg-surface focus:outline-none focus:border-primary"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
    </div>
  );
}

// ─── Main panel ────────────────────────────────────────────────────────

export default function FilterPanel({ open, onClose, filters, onAddOrUpdate, onRemove, onClearAll, crmConnected = false, title = 'Filters' }) {
  const [activeFilterId, setActiveFilterId] = useState('emp_count');
  const [search, setSearch] = useState('');
  // Working draft for the active filter (not yet committed).
  const activeSpec = FILTER_REGISTRY[activeFilterId];
  const existing = filters.find((f) => f.id === activeFilterId);
  const [draft, setDraft] = useState(existing?.value ?? activeSpec?.defaultValue);
  // Tenant-authored derived filters — surfaced in a dedicated "Your
  // definitions" section at the top of the sidebar.
  const [derivedTick, setDerivedTick] = useState(0);
  useEffect(() => subscribeDerivedFilters(() => setDerivedTick((t) => t + 1)), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const derivedFilters = useMemo(() => listDerivedFilters(), [derivedTick]);
  const activeDerived = derivedFilters.find((d) => `derived:${d.id}` === activeFilterId) || null;

  useEffect(() => {
    const cur = filters.find((f) => f.id === activeFilterId);
    setDraft(cur?.value ?? FILTER_REGISTRY[activeFilterId]?.defaultValue);
  }, [activeFilterId, filters]);

  // Build options that depend on tenant context / offerings at render time.
  const dynamicOptions = useMemo(() => {
    const offerings = listOfferings();
    return {
      products: [
        { id: 'palo-alto-prisma', label: 'Palo Alto Prisma Cloud' },
        { id: 'crowdstrike-falcon', label: 'CrowdStrike Falcon' },
        { id: 'wiz', label: 'Wiz' },
        { id: 'lacework', label: 'Lacework' },
        { id: 'orca-security', label: 'Orca Security' },
        { id: 'snowflake', label: 'Snowflake' },
        { id: 'splunk', label: 'Splunk' },
        { id: 'okta', label: 'Okta' },
      ],
      productCategories: [
        { id: 'cnapp', label: 'Cloud-Native Application Protection (CNAPP)' },
        { id: 'cspm', label: 'Cloud Security Posture Management' },
        { id: 'edr', label: 'Endpoint Detection & Response' },
        { id: 'siem', label: 'SIEM / Security Analytics' },
        { id: 'iam', label: 'Identity & Access Management' },
        { id: 'iac', label: 'Infrastructure-as-Code' },
      ],
      vendors: [
        { id: 'palo-alto', label: 'Palo Alto Networks' },
        { id: 'crowdstrike', label: 'CrowdStrike' },
        { id: 'wiz', label: 'Wiz' },
        { id: 'lacework', label: 'Lacework' },
        { id: 'aws', label: 'Amazon Web Services' },
        { id: 'microsoft', label: 'Microsoft' },
      ],
      industries: [
        { id: 'banking', label: 'Banking & Financial Services' },
        { id: 'healthcare', label: 'Health Care' },
        { id: 'retail', label: 'Retail' },
        { id: 'manufacturing', label: 'Manufacturing' },
        { id: 'tech', label: 'Computer & Electronic Manufacturing' },
        { id: 'media', label: 'Media & Entertainment' },
        { id: 'public', label: 'Public Administration' },
        { id: 'energy', label: 'Energy' },
      ],
      geography: [
        { id: 'usa', label: 'United States' },
        { id: 'canada', label: 'Canada' },
        { id: 'uk', label: 'United Kingdom' },
        { id: 'germany', label: 'Germany' },
        { id: 'france', label: 'France' },
        { id: 'australia', label: 'Australia' },
        { id: 'singapore', label: 'Singapore' },
        { id: 'india', label: 'India' },
      ],
      offerings: offerings.map((o) => ({ id: o.id, label: o.name })),
    };
  }, []);

  if (!open) return null;

  // Filter the left sidebar by search query.
  const matchesSearch = (spec) =>
    !search ||
    spec.label.toLowerCase().includes(search.toLowerCase()) ||
    spec.group.toLowerCase().includes(search.toLowerCase());

  const valuesById = Object.fromEntries(filters.map((f) => [f.id, f.value]));

  const handleSave = () => {
    if (!activeSpec) return;
    if (draft == null || (Array.isArray(draft) && draft.length === 0)) {
      onRemove(activeFilterId);
    } else {
      onAddOrUpdate({
        id: activeFilterId,
        specId: activeFilterId,
        group: activeSpec.group,
        label: activeSpec.label,
        value: draft,
        displayValue: activeSpec.format ? activeSpec.format(draft) : undefined,
      });
    }
  };

  const handleClear = () => {
    onRemove(activeFilterId);
    setDraft(activeSpec?.defaultValue);
  };

  // Render the right-pane form based on the spec's widget type.
  const renderForm = () => {
    if (!activeSpec) {
      return (
        <div className="text-[11px] text-text-muted italic">
          Pick a filter from the left to configure it.
        </div>
      );
    }
    switch (activeSpec.widget) {
      case 'minMax':
        return (
          <MinMaxForm
            value={draft}
            onChange={setDraft}
            title={activeSpec.label}
            hint={activeSpec.hint}
            allowFixedOnly={activeSpec.allowFixedOnly}
          />
        );
      case 'multiSelect':
        return (
          <MultiSelectForm
            options={
              typeof activeSpec.options === 'function'
                ? activeSpec.options(dynamicOptions)
                : activeSpec.options || []
            }
            value={draft}
            onChange={setDraft}
            hint={activeSpec.hint}
          />
        );
      case 'radio':
        return (
          <RadioForm
            options={activeSpec.options || []}
            value={draft}
            onChange={setDraft}
          />
        );
      case 'intent':
        return <IntentForm value={draft} onChange={setDraft} />;
      default:
        return (
          <div className="text-[11px] text-text-muted italic">
            Widget type <span className="font-mono">{activeSpec.widget}</span> not implemented yet.
          </div>
        );
    }
  };

  const groupIcons = {
    Accounts: Users,
    Scoring: BarChart3,
    Intent: Sparkles,
    Firmographics: Building2,
    Technographics: Cpu,
    'CRM Filters': Database,
    Overview: FileText,
  };

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/30" />
      <div
        className="w-[860px] max-w-[95vw] h-full bg-bg border-l border-border shadow-elev flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">{title}</div>
          <div className="flex items-center gap-2">
            {filters.length > 0 && (
              <button
                onClick={() => {
                  onClearAll();
                  setDraft(activeSpec?.defaultValue);
                }}
                className="text-[11px] text-rose-600 hover:underline"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-surface-2 text-text-secondary hover:text-text-primary"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          {/* Left: searchable category list */}
          <div className="w-64 border-r border-border flex flex-col">
            <div className="p-3 border-b border-border/60">
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search filters…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 text-xs rounded border border-border bg-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto thin-scrollbar py-1">
              <FilterRow
                id="overview"
                label="Overview"
                icon={FileText}
                active={activeFilterId === 'overview'}
                hasValue={false}
                onClick={() => setActiveFilterId('overview')}
              />
              {/* Your definitions — tenant-authored derived filters from
                  the Filter Studio. Section auto-hides when there are none. */}
              {derivedFilters.length > 0 && (
                <div>
                  <SectionLabel>Your definitions</SectionLabel>
                  {derivedFilters
                    .filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase()))
                    .map((d) => (
                      <FilterRow
                        key={d.id}
                        id={`derived:${d.id}`}
                        label={d.name}
                        icon={ListTree}
                        active={activeFilterId === `derived:${d.id}`}
                        hasValue={filters.some((f) => f.id === `derived:${d.id}`)}
                        onClick={() => setActiveFilterId(`derived:${d.id}`)}
                      />
                    ))}
                </div>
              )}
              {FILTER_GROUPS.map((groupName) => {
                // CRM groups only appear when the tenant has a CRM connected.
                if (CRM_GATED_GROUPS.has(groupName) && !crmConnected) return null;
                const specs = Object.values(FILTER_REGISTRY).filter(
                  (s) => s.group === groupName && matchesSearch(s),
                );
                if (specs.length === 0) return null;
                const Icon = groupIcons[groupName];
                return (
                  <div key={groupName}>
                    <SectionLabel>{groupName}</SectionLabel>
                    {specs.map((spec) => (
                      <FilterRow
                        key={spec.id}
                        id={spec.id}
                        label={spec.label}
                        icon={Icon}
                        active={activeFilterId === spec.id}
                        hasValue={valuesById[spec.id] != null}
                        onClick={() => setActiveFilterId(spec.id)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Right: active filter form */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  {activeDerived ? (
                    <>
                      <ListTree size={13} className="text-primary" />
                      {activeDerived.name}
                      <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
                        Your definition
                      </span>
                    </>
                  ) : activeFilterId === 'overview' ? 'Overview' : (activeSpec?.label || 'Pick a filter')}
                </div>
                {activeDerived && (
                  <div className="text-[11px] text-text-muted mt-0.5">{activeDerived.description}</div>
                )}
                {!activeDerived && activeFilterId !== 'overview' && activeSpec?.description && (
                  <div className="text-[11px] text-text-muted mt-0.5">{activeSpec.description}</div>
                )}
              </div>
              {activeDerived ? (
                <div className="flex items-center gap-2">
                  {filters.some((f) => f.id === `derived:${activeDerived.id}`) ? (
                    <button
                      onClick={() => onRemove(`derived:${activeDerived.id}`)}
                      className="text-[11px] text-text-muted hover:text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => onAddOrUpdate({
                        id: `derived:${activeDerived.id}`,
                        specId: `derived:${activeDerived.id}`,
                        group: 'Your definitions',
                        label: activeDerived.name,
                        displayValue: `${(activeDerived.matchCount || 0).toLocaleString()} records`,
                        value: { derivedId: activeDerived.id },
                      })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim transition-colors"
                    >
                      <Check size={11} />
                      Apply filter
                    </button>
                  )}
                </div>
              ) : activeFilterId !== 'overview' && (
                <div className="flex items-center gap-2">
                  {valuesById[activeFilterId] != null && (
                    <button
                      onClick={handleClear}
                      className="text-[11px] text-text-muted hover:text-rose-600 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim transition-colors"
                  >
                    <Check size={11} />
                    Apply
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto thin-scrollbar p-5">
              {activeDerived ? (
                <DerivedSummaryPane filter={activeDerived} allDerived={derivedFilters} />
              ) : activeFilterId === 'overview' ? (
                <OverviewPane filters={filters} onRemove={onRemove} onJump={setActiveFilterId} />
              ) : (
                renderForm()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewPane({ filters, onRemove, onJump }) {
  if (filters.length === 0) {
    return (
      <div className="text-center py-10 text-text-muted">
        <div className="text-sm font-semibold text-text-primary mb-1">No filters applied yet</div>
        <div className="text-[11px]">
          Pick a category on the left to start narrowing the company list.
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="text-[11px] text-text-muted mb-3">
        {filters.length} active filter{filters.length === 1 ? '' : 's'} · all intersect (AND).
      </div>
      {filters.map((f) => (
        <div
          key={f.id}
          className="flex items-center gap-2 px-3 py-2 rounded border border-primary/30 bg-primary/5"
        >
          <button
            onClick={() => onJump(f.id)}
            className="flex-1 text-left"
          >
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
              {f.group}
            </div>
            <div className="text-sm font-medium text-text-primary">{f.label}</div>
            {f.displayValue && (
              <div className="text-[11px] text-text-secondary mt-0.5 font-mono">{f.displayValue}</div>
            )}
          </button>
          <button
            onClick={() => onRemove(f.id)}
            className="p-1 rounded hover:bg-rose-500/10 text-text-muted hover:text-rose-600"
            title="Remove filter"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Right-pane view for a selected derived filter — shows the composition
// summary + match count. No form; derived filters apply as one click.
function DerivedSummaryPane({ filter, allDerived }) {
  const groups = filter?.composition?.groups || [];
  const summary = summarizeComposition(filter, allDerived);
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
        <Layers size={14} className="text-primary flex-shrink-0" />
        <div className="flex-1">
          <div className="text-xs text-text-primary">
            <span className="font-mono font-bold text-primary">{(filter.matchCount || 0).toLocaleString()}</span>
            {' '}records match this definition today
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">
            Applied filters intersect (AND) with the rest of your filters.
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">Composition</div>
        <div className="space-y-2">
          {groups.map((g, i) => (
            <div key={i} className="rounded border border-border bg-bg/40 p-3">
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
                {(g.op || 'and').toUpperCase()} of the following
              </div>
              <div className="space-y-1.5">
                {(g.conditions || []).map((c, j) => (
                  <div key={j} className="flex items-center gap-2 text-[11px] text-text-primary">
                    <span className="text-text-muted">·</span>
                    {c.source === 'derived' ? (
                      <>
                        <ListTree size={10} className="text-primary" />
                        <span className="font-semibold">{allDerived.find((d) => d.id === c.id)?.name || c.id}</span>
                        <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-primary/10 text-primary">Derived</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">{c.id}</span>
                        <span className="text-text-muted font-mono">{c.op}</span>
                        <span className="font-mono text-text-secondary">
                          {Array.isArray(c.values) ? c.values.join(', ') : String(c.values)}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-text-secondary leading-snug">
        <span className="font-semibold text-text-primary">Summary:</span> {summary}
      </div>
    </div>
  );
}
