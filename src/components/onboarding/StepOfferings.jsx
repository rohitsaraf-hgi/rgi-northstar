import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Info,
  Layers,
  Swords,
  Target,
  TrendingUp,
} from 'lucide-react';

// ─── GTM motion catalog ────────────────────────────────────────────────────
//
// Each offering supports one or more GTM motions. The selected motions
// drive which plays the AI proposes in Step 3 and feed into the per-offering
// scoring model.

export const GTM_MOTIONS = [
  { id: 'displacement', label: 'Displacement',       icon: Swords,      color: 'text-rose-700 dark:text-rose-300',     bg: 'bg-rose-500/15',     border: 'border-rose-500/30' },
  { id: 'new_logo',     label: 'Net New Logo',       icon: Target,      color: 'text-sky-700 dark:text-sky-300',       bg: 'bg-sky-500/15',      border: 'border-sky-500/30' },
  { id: 'expansion',    label: 'Expansion',          icon: TrendingUp,  color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
];

function gtmMotionMeta(id) {
  return GTM_MOTIONS.find((m) => m.id === id) || GTM_MOTIONS[0];
}

// ─── Per-offering data templates (LLM-equivalent grouping for the demo) ────
//
// Same templates the inline version used — keyed by inferred offering type.

const COMPETITOR_BUCKETS = {
  cnapp: ['palo-alto-prisma', 'crowdstrike-falcon-cloud', 'lacework', 'orca', 'sysdig'],
  code:  ['snyk', 'checkmarx', 'veracode', 'github-advanced-security'],
  cdr:   ['crowdstrike-falcon-cloud', 'sysdig', 'sentinelone-cloud', 'sweet-security'],
};

const SYNTHETIC_COMPETITORS = {
  'snyk':                      { id: 'snyk', name: 'Snyk', vendor: 'Snyk', threat: 'incumbent' },
  'checkmarx':                 { id: 'checkmarx', name: 'Checkmarx One', vendor: 'Checkmarx', threat: 'incumbent' },
  'veracode':                  { id: 'veracode', name: 'Veracode', vendor: 'Veracode', threat: 'declining' },
  'github-advanced-security':  { id: 'github-advanced-security', name: 'GitHub Advanced Security', vendor: 'GitHub', threat: 'rising' },
  'sentinelone-cloud':         { id: 'sentinelone-cloud', name: 'SentinelOne Singularity Cloud', vendor: 'SentinelOne', threat: 'rising' },
  'sweet-security':            { id: 'sweet-security', name: 'Sweet Security', vendor: 'Sweet', threat: 'emerging' },
};

const COMPLEMENTARY_TECH_BY_OFFERING = {
  cnapp: ['AWS', 'Azure', 'Google Cloud', 'Kubernetes', 'Terraform'],
  code:  ['GitHub', 'GitLab', 'Terraform', 'Bitbucket', 'Jenkins'],
  cdr:   ['AWS', 'Kubernetes', 'Splunk', 'Datadog', 'CrowdStrike Falcon'],
};

const PAIN_POINTS_BY_OFFERING = {
  cnapp: [
    'Cloud sprawl creates blind spots across multi-cloud deployments',
    'Tool fragmentation forces context-switching between CSPM, CWPP, KSPM, CIEM',
    'Compliance evidence is manual and audit-cycle painful',
  ],
  code: [
    'Dev velocity blocked by manual security reviews',
    'Vulnerabilities reach production before security can review',
    'IaC misconfigurations slip past pre-deploy checks',
  ],
  cdr: [
    'Cloud runtime attacks go undetected until exfiltration',
    'No unified incident response across AWS, Azure, Kubernetes workloads',
    'EDR vendors can\'t see cloud-native attack patterns',
  ],
};

const INTENT_BY_OFFERING = {
  cnapp: ['CNAPP', 'cloud security posture management', 'kubernetes security', 'cloud cybersecurity', 'Zero Trust'],
  code:  ['DevSecOps', 'infrastructure as code security', 'application security testing', 'SAST', 'software supply chain security'],
  cdr:   ['cloud detection and response', 'runtime threat detection', 'cloud workload protection', 'incident response'],
};

function inferOfferingKey(product) {
  const cat = (product.category || '').toLowerCase();
  if (cat.includes('cnapp') || cat.includes('cspm')) return 'cnapp';
  if (cat.includes('code')) return 'code';
  if (cat.includes('cdr') || cat.includes('runtime')) return 'cdr';
  return 'cnapp';
}

function offeringIconAccent(key) {
  switch (key) {
    case 'cnapp': return { color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500/15', border: 'border-sky-500/30' };
    case 'code':  return { color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-500/15', border: 'border-violet-500/30' };
    case 'cdr':   return { color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-500/15', border: 'border-rose-500/30' };
    default:      return { color: 'text-text-secondary', bg: 'bg-surface-2', border: 'border-border' };
  }
}

function deriveOfferings(tenant) {
  return tenant.products.map((product) => {
    const key = inferOfferingKey(product);
    const competitorIds = COMPETITOR_BUCKETS[key] || [];
    const competitors = competitorIds
      .map((cid) => {
        const fromTenant = tenant.competitors.find((c) => c.id === cid);
        return fromTenant || SYNTHETIC_COMPETITORS[cid] || null;
      })
      .filter(Boolean);

    return {
      id: product.id,
      key,
      name: product.name,
      shortName: product.name.replace(/^Wiz /, ''),
      description: product.description,
      products: [{ id: product.id, name: product.name, description: product.description, source: 'derived' }],
      painPoints: PAIN_POINTS_BY_OFFERING[key] || [],
      intentTopics: INTENT_BY_OFFERING[key] || [],
      competitors,
      complementaryTech: COMPLEMENTARY_TECH_BY_OFFERING[key] || [],
      targetIcp: {
        industries: tenant.icp.industries.map((i) => i.name),
        employeeBand: `${tenant.icp.employeeBand.low}–${tenant.icp.employeeBand.high}`,
        revenueBand: `${tenant.icp.revenueBand.low}–${tenant.icp.revenueBand.high}`,
        geography: tenant.icp.geos.map((g) => g.name),
      },
      gtmMotions: ['displacement', 'new_logo', 'expansion'], // all three on by default
      groupingRationale:
        key === 'cnapp'
          ? 'CISO-driven multi-cloud security buying motion. Posture + workload + identity bundled under a single platform.'
          : key === 'code'
          ? 'DevSecOps + Engineering-led motion. Different buyer (VP Eng, Head of Platform) and different evaluation cycle from CNAPP.'
          : 'SOC + IR-led motion. Runtime detection is a separate budget line from posture and code security.',
      confirmed: true,
    };
  });
}

// ─── Shared ChipEditor (local duplicate — keep this file self-contained) ───

function ChipEditor({ label, chips, onChange, placeholder, compact = false }) {
  const [input, setInput] = useState('');

  function add() {
    const v = input.trim();
    if (!v || chips.includes(v)) {
      setInput('');
      return;
    }
    onChange([...chips, v]);
    setInput('');
  }

  function remove(chip) {
    onChange(chips.filter((c) => c !== chip));
  }

  return (
    <div>
      {label && (
        <label className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block mb-1">{label}</label>
      )}
      <div className="flex flex-wrap gap-1 mb-1">
        {chips.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-surface text-text-secondary border border-border"
          >
            {c}
            <button onClick={() => remove(c)} className="text-text-muted hover:text-rose-600">
              <X size={9} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={`flex-1 px-2 ${compact ? 'py-1' : 'py-1.5'} bg-surface border border-border rounded text-[11px] text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none`}
        />
        <button
          onClick={add}
          disabled={!input.trim()}
          className="text-[11px] px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 disabled:opacity-40"
        >
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── Product editor (name + description, list) ─────────────────────────────

function ProductsEditor({ products, onChange }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function add() {
    if (!name.trim()) return;
    const next = {
      id: `prod-custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      source: 'manual',
    };
    onChange([...products, next]);
    setName('');
    setDescription('');
  }

  function remove(id) {
    onChange(products.filter((p) => p.id !== id));
  }

  function updateField(id, field, value) {
    onChange(products.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  return (
    <div className="space-y-2">
      {products.map((p) => (
        <div key={p.id} className="bg-surface border border-border rounded p-2 space-y-1.5">
          <div className="flex items-start gap-2">
            <input
              type="text"
              value={p.name}
              onChange={(e) => updateField(p.id, 'name', e.target.value)}
              className="flex-1 px-2 py-1 bg-bg/40 border border-border rounded text-[12px] font-semibold text-text-primary focus:border-primary/40 focus:outline-none"
            />
            {p.source === 'derived' ? (
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 font-bold flex-shrink-0">
                AI
              </span>
            ) : (
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold flex-shrink-0">
                Manual
              </span>
            )}
            <button onClick={() => remove(p.id)} className="text-text-muted hover:text-rose-600 flex-shrink-0">
              <Trash2 size={11} />
            </button>
          </div>
          <textarea
            value={p.description}
            onChange={(e) => updateField(p.id, 'description', e.target.value)}
            placeholder="Product description (optional)"
            rows={2}
            className="w-full px-2 py-1 bg-bg/40 border border-border rounded text-[11px] text-text-secondary focus:border-primary/40 focus:outline-none resize-none"
          />
        </div>
      ))}

      <div className="bg-bg/30 border border-dashed border-border rounded p-2 space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Add a product</div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
          className="w-full px-2 py-1 bg-surface border border-border rounded text-[12px] text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Product description (optional)"
          rows={2}
          className="w-full px-2 py-1 bg-surface border border-border rounded text-[11px] text-text-secondary placeholder:text-text-muted focus:border-primary/40 focus:outline-none resize-none"
        />
        <button
          onClick={add}
          disabled={!name.trim()}
          className="text-[11px] px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 disabled:opacity-40 inline-flex items-center gap-1"
        >
          <Plus size={11} /> Add product
        </button>
      </div>
    </div>
  );
}

// ─── GTM Motion chip strip ─────────────────────────────────────────────────

function GtmMotionPicker({ selected, onChange, size = 'sm' }) {
  function toggle(id) {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else onChange([...selected, id]);
  }

  const px = size === 'lg' ? 'px-2.5 py-1' : 'px-2 py-0.5';
  const text = size === 'lg' ? 'text-[11px]' : 'text-[10px]';

  return (
    <div className="flex flex-wrap gap-1.5">
      {GTM_MOTIONS.map((m) => {
        const active = selected.includes(m.id);
        const Icon = m.icon;
        return (
          <button
            key={m.id}
            onClick={() => toggle(m.id)}
            className={`${px} ${text} rounded border inline-flex items-center gap-1 transition-colors ${
              active
                ? `${m.bg} ${m.color} ${m.border} font-semibold`
                : 'bg-surface border-border text-text-muted hover:border-primary/30'
            }`}
            title={active ? `${m.label} motion enabled — used in AI scoring` : `${m.label} motion disabled`}
          >
            <Icon size={10} className={active ? '' : 'opacity-50'} />
            {active && <Check size={9} />}
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Offering Card ─────────────────────────────────────────────────────────

function OfferingCard({ offering, onPatch, onToggleConfirm, onEdit, onDelete, expanded, onToggleExpand }) {
  const accent = offeringIconAccent(offering.key);

  function updateMotions(next) {
    onPatch({ gtmMotions: next });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`bg-surface border rounded-lg overflow-hidden ${offering.confirmed ? accent.border : 'border-border'} ${
        offering.confirmed ? '' : 'opacity-60'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`w-10 h-10 rounded-md ${accent.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Layers size={16} className={accent.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-text-primary">{offering.name}</h3>
            <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold ${accent.bg} ${accent.color}`}>
              {(offering.shortName || offering.name).toUpperCase().replace(/\s+/g, '_')}
            </span>
            <span className="text-[10px] text-text-muted">·</span>
            <span className="text-[10px] text-text-muted">
              {offering.products.length} {offering.products.length === 1 ? 'product' : 'products'}
            </span>
            {offering.confirmed ? (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300">
                <Check size={10} /> Confirmed
              </span>
            ) : (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300">
                Skipped
              </span>
            )}
          </div>
          <p className="text-[12px] text-text-secondary leading-relaxed mb-2">{offering.description}</p>

          {/* GTM motions — always visible, inline-toggleable */}
          <div className="mb-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
              <Sparkles size={10} />
              <span>GTM motions</span>
              <span className="text-text-muted/60 normal-case tracking-normal font-normal">— used in AI scoring</span>
            </div>
            <GtmMotionPicker selected={offering.gtmMotions} onChange={updateMotions} />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <Info size={10} />
            <span className="italic leading-snug">{offering.groupingRationale}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-bg/40 px-4 py-3 grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1.5">Pain points</div>
            <ul className="space-y-1">
              {offering.painPoints.map((pt, i) => (
                <li key={i} className="text-[11px] text-text-secondary leading-snug flex items-start gap-1.5">
                  <span className={`${accent.color} mt-0.5`}>•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1.5">Target ICP</div>
            <div className="space-y-1 text-[11px]">
              <div className="text-text-secondary">
                <span className="text-text-muted">Industries:</span>{' '}
                <span className="text-text-primary">{offering.targetIcp.industries.slice(0, 4).join(', ')}</span>
              </div>
              <div className="text-text-secondary">
                <span className="text-text-muted">Size:</span>{' '}
                <span className="text-text-primary">{offering.targetIcp.employeeBand} employees</span>
              </div>
              <div className="text-text-secondary">
                <span className="text-text-muted">Revenue:</span>{' '}
                <span className="text-text-primary">{offering.targetIcp.revenueBand}</span>
              </div>
            </div>
          </div>

          <div className="col-span-2 grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1.5">Intent topics</div>
              <div className="flex flex-wrap gap-1">
                {offering.intentTopics.map((t) => (
                  <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded ${accent.bg} ${accent.color} font-medium`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1.5">
                Competitors{' '}
                <span className="text-text-muted font-normal normal-case tracking-normal">({offering.competitors.length})</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {offering.competitors.map((c) => (
                  <span key={c.id} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 font-medium">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1.5">Complementary tech</div>
              <div className="flex flex-wrap gap-1">
                {offering.complementaryTech.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-text-secondary border border-border font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-border px-4 py-2 flex items-center gap-3 bg-surface/50">
        <button onClick={onToggleExpand} className="text-[11px] text-text-secondary hover:text-text-primary inline-flex items-center gap-1">
          {expanded ? 'Hide details' : 'Show details'}
        </button>
        <span className="text-text-muted text-[10px]">·</span>
        <button
          onClick={onEdit}
          className="text-[11px] text-text-secondary hover:text-primary inline-flex items-center gap-1"
          title="Edit offering"
        >
          <Edit2 size={10} /> Edit
        </button>
        <span className="text-text-muted text-[10px]">·</span>
        <button
          onClick={onDelete}
          className="text-[11px] text-text-muted hover:text-rose-600 inline-flex items-center gap-1"
          title="Delete offering"
        >
          <Trash2 size={10} /> Delete
        </button>

        <div className="ml-auto">
          <label className="inline-flex items-center gap-2 text-[11px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={offering.confirmed}
              onChange={onToggleConfirm}
              className="w-3.5 h-3.5 accent-primary"
            />
            <span className="text-text-secondary">Include in setup</span>
          </label>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Manage Offering Drawer (Edit + Add) ───────────────────────────────────

export function ManageOfferingDrawer({ offering, onSave, onClose }) {
  const isEdit = !!offering?.id;
  const blank = {
    id: `offering-custom-${Date.now()}`,
    key: 'cnapp',
    name: '',
    shortName: '',
    description: '',
    products: [],
    painPoints: [],
    intentTopics: [],
    competitors: [],
    complementaryTech: [],
    targetIcp: { industries: [], employeeBand: '', revenueBand: '', geography: [] },
    gtmMotions: ['displacement', 'new_logo', 'expansion'],
    groupingRationale: '',
    confirmed: true,
  };
  const [draft, setDraft] = useState(offering || blank);

  function patch(updates) {
    setDraft((prev) => ({ ...prev, ...updates }));
  }

  function patchIcp(updates) {
    setDraft((prev) => ({ ...prev, targetIcp: { ...prev.targetIcp, ...updates } }));
  }

  function canSave() {
    return draft.name.trim().length > 0 && draft.products.length > 0;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="w-full max-w-3xl max-h-[88vh] overflow-y-auto bg-surface border border-border rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg/40 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Edit2 size={14} className="text-primary" />
            <h2 className="text-sm font-semibold text-text-primary">{isEdit ? 'Edit offering' : 'Add an offering'}</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">
                Offering name
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="e.g. Wiz Cloud Security Platform"
                className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">
                Short label
              </label>
              <input
                type="text"
                value={draft.shortName}
                onChange={(e) => patch({ shortName: e.target.value })}
                placeholder="e.g. CNAPP"
                className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">Description</label>
            <textarea
              value={draft.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="What does this offering do? Who's the buyer?"
              rows={2}
              className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none resize-none"
            />
          </div>

          {/* Products */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">
              Products <span className="text-text-muted/70 normal-case tracking-normal ml-1">(one or more — AI-discovered or add your own)</span>
            </label>
            <ProductsEditor products={draft.products} onChange={(products) => patch({ products })} />
          </div>

          {/* GTM motions */}
          <div className="bg-bg/30 border border-border/60 rounded p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-text-muted">
              <Sparkles size={11} className="text-primary" /> GTM motions
              <span className="text-text-muted/60 normal-case tracking-normal font-normal ml-1">— drives AI scoring + play proposals</span>
            </div>
            <GtmMotionPicker selected={draft.gtmMotions} onChange={(gtmMotions) => patch({ gtmMotions })} size="lg" />
          </div>

          {/* Pain points */}
          <ChipEditor
            label="Pain points"
            chips={draft.painPoints}
            onChange={(painPoints) => patch({ painPoints })}
            placeholder="e.g. Tool fragmentation across CSPM, CWPP, KSPM"
          />

          {/* Intent topics */}
          <ChipEditor
            label="Intent topics (HG)"
            chips={draft.intentTopics}
            onChange={(intentTopics) => patch({ intentTopics })}
            placeholder="e.g. CNAPP"
          />

          {/* Competitors */}
          <ChipEditor
            label="Competitors"
            chips={draft.competitors.map((c) => (typeof c === 'string' ? c : c.name))}
            onChange={(names) => {
              const next = names.map((name, i) => {
                const existing = draft.competitors.find((c) => (typeof c === 'string' ? c : c.name) === name);
                return existing && typeof existing === 'object' ? existing : { id: `comp-${i}-${Date.now()}`, name, vendor: name, threat: 'direct' };
              });
              patch({ competitors: next });
            }}
            placeholder="e.g. Palo Alto Prisma Cloud"
          />

          {/* Complementary tech */}
          <ChipEditor
            label="Complementary tech / stack"
            chips={draft.complementaryTech}
            onChange={(complementaryTech) => patch({ complementaryTech })}
            placeholder="e.g. AWS, Kubernetes"
          />

          {/* ICP */}
          <div className="bg-bg/30 border border-border/60 rounded p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Target ICP</div>
            <ChipEditor
              label="Industries"
              chips={draft.targetIcp.industries}
              onChange={(industries) => patchIcp({ industries })}
              placeholder="e.g. Banking & Financial Services"
              compact
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block mb-1">Employee band</label>
                <input
                  type="text"
                  value={draft.targetIcp.employeeBand}
                  onChange={(e) => patchIcp({ employeeBand: e.target.value })}
                  placeholder="e.g. 1,000–10K+"
                  className="w-full px-2 py-1.5 bg-surface border border-border rounded text-[12px] text-text-primary focus:border-primary/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block mb-1">Revenue band</label>
                <input
                  type="text"
                  value={draft.targetIcp.revenueBand}
                  onChange={(e) => patchIcp({ revenueBand: e.target.value })}
                  placeholder="e.g. $1B–$10B+"
                  className="w-full px-2 py-1.5 bg-surface border border-border rounded text-[12px] text-text-primary focus:border-primary/40 focus:outline-none"
                />
              </div>
            </div>
            <ChipEditor
              label="Geography"
              chips={draft.targetIcp.geography}
              onChange={(geography) => patchIcp({ geography })}
              placeholder="e.g. United States, Europe"
              compact
            />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border bg-bg/40 flex items-center justify-end gap-2 sticky bottom-0">
          <button onClick={onClose} className="text-[12px] px-3 py-1.5 rounded border border-border text-text-secondary hover:border-primary/30">
            Cancel
          </button>
          <button
            disabled={!canSave()}
            onClick={() => onSave(draft)}
            className="text-[12px] px-3 py-1.5 rounded bg-primary text-white hover:bg-primary-dim disabled:opacity-40 font-semibold flex items-center gap-1.5"
          >
            <Check size={12} /> {isEdit ? 'Save changes' : 'Add offering'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main wizard step ──────────────────────────────────────────────────────

export default function StepOfferings({ tenant, onConfirm, onBack }) {
  const [offerings, setOfferings] = useState(() => deriveOfferings(tenant));
  const [expandedId, setExpandedId] = useState(offerings[0]?.id || null);
  const [editing, setEditing] = useState(null); // offering object, 'new', or null
  const [confirmDelete, setConfirmDelete] = useState(null);

  const confirmedCount = offerings.filter((o) => o.confirmed).length;

  function patchOffering(id, updates) {
    setOfferings((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  }

  function toggleConfirm(id) {
    patchOffering(id, { confirmed: !offerings.find((o) => o.id === id)?.confirmed });
  }

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function saveOffering(draft) {
    setOfferings((prev) => {
      const exists = prev.find((o) => o.id === draft.id);
      if (exists) return prev.map((o) => (o.id === draft.id ? { ...o, ...draft } : o));
      return [...prev, draft];
    });
    setEditing(null);
  }

  function deleteOffering(id) {
    setOfferings((prev) => prev.filter((o) => o.id !== id));
    setConfirmDelete(null);
  }

  function handleContinue() {
    onConfirm(offerings.filter((o) => o.confirmed));
  }

  function handleSkip() {
    onConfirm(offerings.filter((o) => o.confirmed));
  }

  return (
    <motion.div
      key="offerings"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="w-full max-w-4xl"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 bg-violet-500/15 border border-violet-500/30 rounded-full text-[11px] uppercase tracking-wider text-violet-700 dark:text-violet-300 font-bold">
          <Sparkles size={11} /> Step 2 of 3 · Auto-grouped from your products
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Confirm your offerings</h1>
        <p className="text-sm text-text-secondary leading-relaxed max-w-2xl mx-auto">
          We grouped your products into <strong>{offerings.length} offerings</strong>, each with pain points, intent topics, competitors, complementary tech, target ICP, and GTM motions. Each anchors a separate buying motion and scoring model. Edit, add, or delete as needed.
        </p>
      </div>

      <div className="space-y-3 mb-4">
        <AnimatePresence initial={false}>
          {offerings.map((offering) => (
            <OfferingCard
              key={offering.id}
              offering={offering}
              expanded={expandedId === offering.id}
              onToggleExpand={() => toggleExpand(offering.id)}
              onToggleConfirm={() => toggleConfirm(offering.id)}
              onPatch={(updates) => patchOffering(offering.id, updates)}
              onEdit={() => setEditing(offering)}
              onDelete={() => setConfirmDelete(offering.id)}
            />
          ))}
        </AnimatePresence>

        <button
          onClick={() => setEditing('new')}
          className="w-full bg-surface border border-dashed border-border hover:border-primary/40 rounded-lg p-3 text-[12px] text-text-secondary hover:text-primary transition-all flex items-center justify-center gap-2"
        >
          <Plus size={13} /> Add another offering
        </button>
      </div>

      <div className="bg-surface border border-border rounded-md p-4 flex items-center gap-3">
        <button onClick={onBack} className="text-[12px] text-text-secondary hover:text-text-primary inline-flex items-center gap-1">
          <ArrowLeft size={12} /> Back to tenant
        </button>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-[11px] text-text-muted">
            {confirmedCount === 0 ? (
              <span className="text-amber-700 dark:text-amber-300">No offerings confirmed · platform will show unfiltered scored accounts</span>
            ) : (
              <span>
                <strong className="text-text-primary">{confirmedCount}</strong> of {offerings.length} offerings ready · scoring runs in the background
              </span>
            )}
          </div>
          <button
            onClick={handleSkip}
            className="text-[12px] px-3 py-2 rounded border border-border hover:border-primary/30 text-text-secondary"
          >
            Skip for now
          </button>
          <button
            onClick={handleContinue}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-dim transition-colors font-medium"
          >
            Configure plays <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 text-center text-[11px] text-text-muted">
        <Sparkles size={9} className="inline text-primary mr-1" />
        Add, edit, or delete offerings any time from <span className="font-mono">/admin/offerings</span>.
      </div>

      {/* Edit / Add drawer */}
      <AnimatePresence>
        {editing && (
          <ManageOfferingDrawer
            offering={editing === 'new' ? null : editing}
            onSave={saveOffering}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-surface border border-border rounded-lg p-5 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-text-primary mb-1">Delete this offering?</h3>
              <p className="text-[12px] text-text-secondary mb-4">
                Any plays attached to this offering will lose their anchor. You can re-add the offering later from <span className="font-mono">/admin/offerings</span>.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-[12px] px-3 py-1.5 rounded border border-border text-text-secondary hover:border-primary/30"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteOffering(confirmDelete)}
                  className="text-[12px] px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-500 font-semibold"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
