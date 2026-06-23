import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Target,
  DollarSign,
  Cpu,
  Swords,
  Users as UsersIcon,
  Globe2,
  Handshake,
  Lightbulb,
  Plus,
  X,
  Save,
  Sparkles,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useTenant } from '../context/TenantContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { TENANT_FIXTURES } from '../data/tenants.js';

// Editable chip group — supports add/remove. Used by every tenant-profile
// section that's a list of strings/objects.
function ChipGroup({ items, getLabel, getKey, onRemove, onAdd, placeholder = 'Add…' }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const submit = () => {
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft('');
    setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item, i) => {
        const key = getKey ? getKey(item) : (item.id || item.hgId || i);
        return (
          <span key={key} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-primary/10 border border-primary/30 text-primary rounded text-[11px] font-medium">
            {getLabel(item)}
            <button onClick={() => onRemove(item)} className="ml-0.5 p-0.5 rounded hover:bg-primary/20 hover:text-danger">
              <X size={10} />
            </button>
          </span>
        );
      })}
      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => setAdding(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') setAdding(false);
          }}
          placeholder={placeholder}
          className="px-2 py-0.5 bg-bg/40 border border-primary/40 rounded text-[11px] text-text-primary focus:outline-none min-w-[140px]"
        />
      ) : (
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 px-2 py-0.5 border border-dashed border-border text-text-muted hover:text-text-secondary hover:border-border-2 rounded text-[11px]">
          <Plus size={10} /> Add
        </button>
      )}
    </div>
  );
}

// Per-policy toggle row used in the Seller Permissions section.
function PolicyToggle({ id, label, description, icon: Icon, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 px-1 py-1.5 cursor-pointer rounded hover:bg-bg/30 transition-colors">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 accent-primary"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={11} className="text-text-muted flex-shrink-0" />}
          <span className="text-[12px] font-semibold text-text-primary">{label}</span>
        </div>
        {description && (
          <p className="text-[10px] text-text-muted leading-relaxed mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

function SectionCard({ icon: Icon, label, count, accent = 'text-text-muted', accentBg = 'bg-text-muted/15', children }) {
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-6 h-6 rounded ${accentBg} flex items-center justify-center`}>
          <Icon size={12} className={accent} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{label}</span>
        {count != null && <span className="text-[10px] text-text-muted">{count}</span>}
      </div>
      {children}
    </div>
  );
}

export default function AdminTenantEditor() {
  const navigate = useNavigate();
  const { tenant, tenantId, upsertTenant } = useTenant();
  const { showToast } = useToast();

  // Local working copy
  const [draft, setDraft] = useState(tenant);
  const dirty = draft !== tenant && JSON.stringify(draft) !== JSON.stringify(tenant);

  const update = (patch) => setDraft((prev) => ({ ...prev, ...patch }));
  const updateIcp = (patch) => setDraft((prev) => ({ ...prev, icp: { ...prev.icp, ...patch } }));

  const save = () => {
    upsertTenant({ ...draft, derivedAt: `${draft.derivedAt || ''} · edited ${new Date().toLocaleString()}` });
    showToast('Tenant profile saved', 'success');
  };

  const reset = () => {
    const fixture = TENANT_FIXTURES[tenantId];
    if (fixture) {
      setDraft(fixture);
      upsertTenant(fixture);
      showToast('Reset to derived profile', 'info');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <button onClick={() => navigate('/admin')} className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors">
        <ArrowLeft size={11} />
        Admin Hub
      </button>

      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{ background: draft.logoColor }}>
          {draft.logoLetter}
        </div>
        <div className="flex-1">
          <div className="text-xs text-text-muted mb-1">Platform & Ops · Tenant Profile</div>
          <h1 className="text-2xl font-semibold tracking-tight">{draft.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-text-secondary">
            <a href={`https://${draft.url}`} target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-0.5">
              {draft.url} <ExternalLink size={9} />
            </a>
            <span>·</span>
            <span>Derived {draft.derivedAt}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={reset} className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary border border-border rounded inline-flex items-center gap-1">
            <RotateCcw size={11} /> Reset
          </button>
          <button onClick={save} disabled={!dirty} className="px-4 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed font-medium inline-flex items-center gap-1.5">
            <Save size={11} /> Save changes
          </button>
        </div>
      </div>

      {/* Hero note about edits */}
      <div className="mb-5 px-3 py-2 bg-sky-500/[0.05] border border-sky-500/30 rounded text-[11px] text-sky-700 dark:text-sky-300">
        <Sparkles size={10} className="inline mr-1" />
        Edits here propagate everywhere: the Workbench, all 3 plays, and every Account Brief uses this profile as their lens.
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* PRODUCTS */}
        <SectionCard icon={Target} label="Products" count={draft.products.length} accent="text-primary" accentBg="bg-primary/15">
          <ChipGroup
            items={draft.products}
            getLabel={(p) => `${p.name} · ${p.category}`}
            getKey={(p) => p.id}
            onRemove={(p) => update({ products: draft.products.filter((x) => x.id !== p.id) })}
            onAdd={(text) => update({ products: [...draft.products, { id: `prod-${Date.now()}`, name: text, category: 'Core', productLine: 'Core' }] })}
            placeholder="Product name…"
          />
        </SectionCard>

        {/* PAIN POINTS */}
        <SectionCard icon={Lightbulb} label="Pain Points" count={draft.painPoints.length} accent="text-amber-700 dark:text-amber-300" accentBg="bg-amber-500/15">
          <div className="space-y-1">
            {draft.painPoints.map((p, i) => (
              <div key={i} className="flex items-start gap-1 text-[11px]">
                <span className="text-amber-700 dark:text-amber-300 mr-0.5">•</span>
                <span className="text-text-secondary flex-1 leading-snug">{p.statement}</span>
                <button
                  onClick={() => update({ painPoints: draft.painPoints.filter((_, idx) => idx !== i) })}
                  className="text-text-muted hover:text-danger"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const stmt = prompt('Pain point statement:');
                if (stmt?.trim()) update({ painPoints: [...draft.painPoints, { statement: stmt.trim(), audience: 'Buyer', signal: 'Manual' }] });
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 border border-dashed border-border text-text-muted hover:text-text-secondary hover:border-border-2 rounded text-[11px] mt-1"
            >
              <Plus size={10} /> Add pain point
            </button>
          </div>
        </SectionCard>

        {/* SPEND CATEGORIES */}
        <SectionCard icon={DollarSign} label="HG Spend Categories" count={draft.spendCategories.length} accent="text-blue-700 dark:text-blue-300" accentBg="bg-blue-500/15">
          <ChipGroup
            items={draft.spendCategories}
            getLabel={(s) => `${s.name}${s.relevance ? ` · ${s.relevance}` : ''}`}
            getKey={(s) => s.hgId}
            onRemove={(s) => update({ spendCategories: draft.spendCategories.filter((x) => x.hgId !== s.hgId) })}
            onAdd={(text) => update({ spendCategories: [...draft.spendCategories, { hgId: `sw-${Date.now()}`, name: text, tree: [text], relevance: 'primary' }] })}
            placeholder="Category name…"
          />
        </SectionCard>

        {/* INTENT TOPICS */}
        <SectionCard icon={Cpu} label="HG Intent Topics" count={draft.intentTopics.length} accent="text-purple-700 dark:text-purple-300" accentBg="bg-purple-500/15">
          <ChipGroup
            items={draft.intentTopics}
            getLabel={(t) => t.name}
            getKey={(t) => t.hgId}
            onRemove={(t) => update({ intentTopics: draft.intentTopics.filter((x) => x.hgId !== t.hgId) })}
            onAdd={(text) => update({ intentTopics: [...draft.intentTopics, { hgId: `topic-${Date.now()}`, name: text, category: 'manual', relevance: 'primary' }] })}
            placeholder="Intent topic…"
          />
        </SectionCard>

        {/* COMPETITORS */}
        <SectionCard icon={Swords} label="Competitors" count={draft.competitors.length} accent="text-rose-700 dark:text-rose-300" accentBg="bg-rose-500/15">
          <ChipGroup
            items={draft.competitors}
            getLabel={(c) => `${c.name} · ${c.threat || c.penetration || ''}`}
            getKey={(c) => c.id || c.name}
            onRemove={(c) => update({ competitors: draft.competitors.filter((x) => (x.id || x.name) !== (c.id || c.name)) })}
            onAdd={(text) => update({ competitors: [...draft.competitors, { id: `comp-${Date.now()}`, name: text, threat: 'manual' }] })}
            placeholder="Competitor name…"
          />
        </SectionCard>

        {/* PARTNERS */}
        <SectionCard icon={Handshake} label="Partners" count={draft.partners.length} accent="text-cyan-700 dark:text-cyan-300" accentBg="bg-cyan-500/15">
          <ChipGroup
            items={draft.partners}
            getLabel={(p) => `${p.name} · ${p.type || ''}`}
            getKey={(p) => p.name}
            onRemove={(p) => update({ partners: draft.partners.filter((x) => x.name !== p.name) })}
            onAdd={(text) => update({ partners: [...draft.partners, { name: text, type: 'integration', signal: 'manual' }] })}
            placeholder="Partner name…"
          />
        </SectionCard>

        {/* ICP */}
        <SectionCard icon={Globe2} label="ICP" accent="text-primary" accentBg="bg-primary/15">
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Industries</div>
              <ChipGroup
                items={draft.icp.industries}
                getLabel={(i) => `${i.name} · ${(i.weight * 100).toFixed(0)}%`}
                getKey={(i) => i.hgId}
                onRemove={(i) => updateIcp({ industries: draft.icp.industries.filter((x) => x.hgId !== i.hgId) })}
                onAdd={(text) => updateIcp({ industries: [...draft.icp.industries, { hgId: `ind-${Date.now()}`, name: text, weight: 0.05 }] })}
                placeholder="Industry…"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Geographies</div>
              <ChipGroup
                items={draft.icp.geos}
                getLabel={(g) => `${g.name} · ${(g.weight * 100).toFixed(0)}%`}
                getKey={(g) => g.id}
                onRemove={(g) => updateIcp({ geos: draft.icp.geos.filter((x) => x.id !== g.id) })}
                onAdd={(text) => updateIcp({ geos: [...draft.icp.geos, { id: `geo-${Date.now()}`, name: text, weight: 0.05 }] })}
                placeholder="Geography…"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Revenue band</div>
                <input
                  value={`${draft.icp.revenueBand?.low || ''} – ${draft.icp.revenueBand?.high || ''}`}
                  readOnly
                  className="w-full px-2 py-1 bg-bg/40 border border-border rounded text-[11px] text-text-secondary font-mono"
                />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Employee band</div>
                <input
                  value={`${draft.icp.employeeBand?.low || ''} – ${draft.icp.employeeBand?.high || ''}`}
                  readOnly
                  className="w-full px-2 py-1 bg-bg/40 border border-border rounded text-[11px] text-text-secondary font-mono"
                />
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Tech stack signal</div>
              <ChipGroup
                items={draft.icp.techStack}
                getLabel={(t) => t.name}
                getKey={(t) => t.id}
                onRemove={(t) => updateIcp({ techStack: draft.icp.techStack.filter((x) => x.id !== t.id) })}
                onAdd={(text) => updateIcp({ techStack: [...draft.icp.techStack, { id: `tech-${Date.now()}`, name: text, signal: 'manual' }] })}
                placeholder="Tech…"
              />
            </div>
          </div>
        </SectionCard>

        {/* BUYING COMMITTEE */}
        <SectionCard icon={UsersIcon} label="Buying Committee" count={draft.buyingCommittee.length} accent="text-emerald-700 dark:text-emerald-300" accentBg="bg-emerald-500/15">
          <div className="space-y-1">
            {draft.buyingCommittee.map((m, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] py-0.5">
                <div className="flex-1">
                  <span className="font-medium text-text-primary">{m.role}</span>
                  <span className="text-text-muted"> · {m.department}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-bold">{m.influence}</span>
                <button
                  onClick={() => update({ buyingCommittee: draft.buyingCommittee.filter((_, idx) => idx !== i) })}
                  className="ml-2 text-text-muted hover:text-danger"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const role = prompt('Role title (e.g. "VP Security"):');
                if (role?.trim()) update({ buyingCommittee: [...draft.buyingCommittee, { role: role.trim(), department: 'Manual', influence: 'evaluator', signals: [] }] });
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 border border-dashed border-border text-text-muted hover:text-text-secondary hover:border-border-2 rounded text-[11px] mt-1"
            >
              <Plus size={10} /> Add role
            </button>
          </div>
        </SectionCard>

        {/* FAI */}
        <SectionCard icon={Building2} label="Firmographics" accent="text-text-secondary" accentBg="bg-text-muted/15">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
            {[
              ['Headcount', 'headcount'],
              ['Revenue', 'revenue'],
              ['HQ', 'hq'],
              ['Stage', 'stage'],
              ['Funding', 'fundingDate'],
              ['Growth', 'growthSignal'],
            ].map(([label, key]) => (
              <div key={key}>
                <div className="text-text-muted uppercase tracking-wider text-[10px] font-semibold mb-0.5">{label}</div>
                <input
                  value={draft.fai?.[key] || ''}
                  onChange={(e) => update({ fai: { ...draft.fai, [key]: e.target.value } })}
                  className="w-full px-2 py-1 bg-bg/40 border border-border rounded text-[11px] text-text-primary focus:border-primary/40 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Seller permissions — tenant-level policies controlling what
            sellers can do in Sales Co-Pilot. Currently scoped to the
            book-upload toggle; more policies land here as we expand. */}
        <SectionCard
          icon={ShieldCheck}
          label="Seller Permissions"
          accent="text-violet-700 dark:text-violet-300"
          accentBg="bg-violet-500/15"
        >
          <PolicyToggle
            id="allowSellerBookUpload"
            label="Allow sellers to upload their book"
            description="When ON, sellers see an Upload button on their Workbook and can bring their own accounts via CSV (account_name, account_domain). Every uploaded row is auto-assigned to the seller."
            icon={Upload}
            checked={draft.policies?.allowSellerBookUpload !== false}
            onChange={(v) =>
              update({
                policies: { ...(draft.policies || {}), allowSellerBookUpload: v },
              })
            }
          />
        </SectionCard>
      </div>

      {/* Sticky save bar (when dirty) */}
      {dirty && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-border rounded-full shadow-2xl px-5 py-2 flex items-center gap-3 z-30"
        >
          <span className="text-xs text-text-secondary">Unsaved changes</span>
          <button onClick={() => setDraft(tenant)} className="text-xs text-text-muted hover:text-text-secondary">Discard</button>
          <button onClick={save} className="px-3 py-1 bg-primary text-white text-xs rounded-full hover:bg-primary-dim font-medium inline-flex items-center gap-1">
            <Save size={11} /> Save
          </button>
        </motion.div>
      )}
    </div>
  );
}
