import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_TEAMS, listSellers } from '../../data/territoryDesign.js';
import { listWorkbooksForPersona } from '../../data/workbooks.js';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Layers,
  Target,
  Swords,
  AlertTriangle,
  Handshake,
  Lightbulb,
  Filter,
  Building2,
  Cpu,
  Info,
} from 'lucide-react';

// ─── Motion catalog ────────────────────────────────────────────────────────
//
// Each motion has an accent color, icon, and short label. Plays are
// instances of motions composed against specific offerings + filters.

const MOTIONS = [
  { id: 'displacement',       label: 'DISPLACEMENT', icon: Swords,         color: 'text-rose-700 dark:text-rose-300',     bg: 'bg-rose-500/15',   border: 'border-rose-500/30' },
  { id: 'new_logo',           label: 'NEW LOGO',     icon: Target,         color: 'text-sky-700 dark:text-sky-300',       bg: 'bg-sky-500/15',    border: 'border-sky-500/30' },
  { id: 'in_market',          label: 'IN-MARKET',    icon: Sparkles,       color: 'text-amber-700 dark:text-amber-300',   bg: 'bg-amber-500/15',  border: 'border-amber-500/30' },
  { id: 'opportunity_window', label: 'EVENT',        icon: AlertTriangle,  color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-500/15', border: 'border-violet-500/30' },
  { id: 'expansion',          label: 'EXPANSION',    icon: ArrowRight,     color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  { id: 'renewal',            label: 'RENEWAL',      icon: Handshake,      color: 'text-blue-700 dark:text-blue-300',     bg: 'bg-blue-500/15',   border: 'border-blue-500/30' },
];

function motionAccent(motionId) {
  return MOTIONS.find((m) => m.id === motionId) || { id: 'unknown', label: 'PLAY', icon: Lightbulb, color: 'text-text-secondary', bg: 'bg-surface-2', border: 'border-border' };
}

// ─── Seeded AI-proposed plays — derived from the tenant's offerings ────────
//
// Per the new schema each play has:
//   - offerings:        which offerings (by id) the play applies to
//   - firmoFilters:     {industries, sizeBand, regions}
//   - technoFilters:    {hasInstalled, missingInstall, custom}
//   - signalCount + signalPreview (collapsed view of HG signals)
//   - actions deliberately NOT shown — those are configured post-onboarding
//     from /admin/plays.

function seedProposalsFor(confirmedOfferings) {
  // Find offerings by their canonical key. Fall back to any offering if not
  // found — keeps the wizard sane for tenants with different product mixes.
  const findByKey = (key) => confirmedOfferings.find((o) => o.key === key) || confirmedOfferings[0];
  const cnapp = findByKey('cnapp');
  const code = findByKey('code');
  const defend = findByKey('cdr');
  const allConfirmed = confirmedOfferings.map((o) => o.id);

  return [
    {
      id: 'play-competitive-takeout',
      name: 'Competitive Takeout',
      motion: 'displacement',
      description: 'Displace incumbent CNAPP vendors at accounts where their renewal cliff is approaching.',
      offerings: [cnapp?.id].filter(Boolean),
      workbookIds: ['wb-icp-match'],
      audienceRoles: ['AE'],
      firmoFilters: {
        industries: ['Banking & Financial Services', 'Technology', 'Healthcare'],
        sizeBand: '1,000+ employees',
        regions: ['United States', 'Europe'],
      },
      technoFilters: {
        hasInstalled: ['Palo Alto Prisma Cloud', 'Lacework Polygraph', 'Orca Security'],
        missingInstall: [],
        custom: ['Install age ≥ 24 months'],
      },
      signalCount: 9,
      signalPreview: ['Palo Alto installed (aging)', 'Lacework declining', 'CNAPP intent active', 'New CISO hired'],
      estimatedMatches: 142,
      confirmed: true,
    },
    {
      id: 'play-net-new-logo',
      name: 'Net New Logo',
      motion: 'new_logo',
      description: 'High-fit prospects with no CNAPP incumbent and active in-market signals — pure pursuit territory.',
      offerings: [cnapp?.id].filter(Boolean),
      workbookIds: ['wb-icp-match'],
      audienceRoles: ['AE'],
      firmoFilters: {
        industries: ['Technology', 'Healthcare', 'Banking & Financial Services'],
        sizeBand: '500+ employees',
        regions: ['Global'],
      },
      technoFilters: {
        hasInstalled: [],
        missingInstall: ['Palo Alto Prisma Cloud', 'Lacework', 'Orca Security', 'CrowdStrike Falcon Cloud'],
        custom: ['Multi-cloud: AWS + (Azure or GCP)'],
      },
      signalCount: 8,
      signalPreview: ['No CNAPP incumbent', 'CNAPP intent active', 'Multi-cloud signal', 'Funding raised'],
      estimatedMatches: 87,
      confirmed: true,
    },
    {
      id: 'play-high-intent-buyer',
      name: 'High-Intent Active Buyer',
      motion: 'in_market',
      description: 'Accounts surging on CNAPP topics with pricing page visits and comparison research — buying right now.',
      offerings: allConfirmed, // applies across the portfolio
      workbookIds: ['wb-icp-match'],
      audienceRoles: ['AE', 'BDR'],
      firmoFilters: {
        industries: ['Any'],
        sizeBand: '200+ employees',
        regions: ['Global'],
      },
      technoFilters: {
        hasInstalled: [],
        missingInstall: [],
        custom: ['Intent surge ≥ 30 in last 30d', 'Pricing page visits', 'Comparison research'],
      },
      signalCount: 6,
      signalPreview: ['Pricing page visits', 'Comparison research', 'Intent surge 30d'],
      estimatedMatches: 38,
      confirmed: true,
    },
    {
      id: 'play-catalyst-event',
      name: 'Catalyst Event',
      motion: 'opportunity_window',
      description: 'Recent breach disclosures, M&A activity, or compliance pressure that opens a near-term buying window.',
      offerings: [defend?.id, cnapp?.id].filter(Boolean),
      workbookIds: ['wb-icp-match'],
      audienceRoles: ['AE', 'CSM'],
      firmoFilters: {
        industries: ['Banking & Financial Services', 'Healthcare', 'Public Sector'],
        sizeBand: '1,000+ employees',
        regions: ['United States', 'Europe'],
      },
      technoFilters: {
        hasInstalled: [],
        missingInstall: [],
        custom: ['Breach disclosure ≤ 90d', 'M&A announcement', 'Compliance pressure'],
      },
      signalCount: 5,
      signalPreview: ['Breach disclosure 90d', 'M&A announcement', 'Compliance pressure'],
      estimatedMatches: 24,
      confirmed: true,
    },
    {
      id: 'play-devsec-pull',
      name: 'DevSecOps Pull',
      motion: 'new_logo',
      description: 'Engineering-led pursuits where DevSecOps maturity signals suggest Wiz Code fit.',
      offerings: [code?.id].filter(Boolean),
      workbookIds: ['wb-icp-match'],
      audienceRoles: ['AE', 'BDR'],
      firmoFilters: {
        industries: ['Technology', 'Financial Technology'],
        sizeBand: '200+ engineers',
        regions: ['Global'],
      },
      technoFilters: {
        hasInstalled: ['Snyk', 'Checkmarx'],
        missingInstall: ['GitHub Advanced Security'],
        custom: ['IaC growth', 'DevSecOps hiring'],
      },
      signalCount: 6,
      signalPreview: ['Snyk installed', 'GitHub Advanced Security gap', 'IaC growth', 'DevSecOps hiring'],
      estimatedMatches: 31,
      confirmed: true,
    },
  ];
}

// ─── Filter chip rendering helpers ─────────────────────────────────────────

function FilterChipRow({ icon: Icon, label, chips, accent }) {
  if (!chips || chips.length === 0) return null;
  return (
    <div className="flex items-start gap-2 text-[11px]">
      <div className="flex items-center gap-1 text-text-muted font-semibold uppercase tracking-wider min-w-[56px] mt-0.5">
        <Icon size={10} />
        <span className="text-[9px]">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1 flex-1">
        {chips.map((chip, i) => (
          <span
            key={i}
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${accent || 'bg-surface-2 text-text-secondary border border-border'}`}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Play Card ─────────────────────────────────────────────────────────────

function PlayCard({ play, offeringNameById, onToggleConfirm, onEdit, onDelete }) {
  const accent = motionAccent(play.motion);
  const Icon = accent.icon;

  const offeringChips = play.offerings.map((id) => offeringNameById[id]).filter(Boolean);

  // Compose firmo + techno chips for display
  const firmoChips = [
    ...(play.firmoFilters?.industries || []).map((i) => `Industry: ${i}`),
    play.firmoFilters?.sizeBand && `Size: ${play.firmoFilters.sizeBand}`,
    ...(play.firmoFilters?.regions || []).map((r) => `Region: ${r}`),
  ].filter(Boolean);

  const technoChips = [
    ...(play.technoFilters?.hasInstalled || []).map((t) => `Has: ${t}`),
    ...(play.technoFilters?.missingInstall || []).map((t) => `Missing: ${t}`),
    ...(play.technoFilters?.custom || []),
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`bg-surface border rounded-lg p-4 ${play.confirmed ? accent.border : 'border-border'} ${
        play.confirmed ? '' : 'opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-md ${accent.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className={accent.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-text-primary">{play.name}</h3>
            <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold ${accent.bg} ${accent.color}`}>
              {accent.label}
            </span>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-2 text-text-muted font-semibold">
              {play.audienceRoles.join(' · ')}
            </span>
          </div>
          <p className="text-[12px] text-text-secondary leading-relaxed mb-2">{play.description}</p>

          {/* Offering attachment */}
          <div className="space-y-1 mb-2">
            <FilterChipRow
              icon={Layers}
              label="OFFERINGS"
              chips={offeringChips}
              accent="bg-primary/10 text-primary border border-primary/20"
            />
            <FilterChipRow icon={Building2} label="FIRMO" chips={firmoChips} />
            <FilterChipRow icon={Cpu} label="TECHNO" chips={technoChips} />
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
            <div className="flex items-center gap-3 text-[11px] text-text-muted">
              <span className="inline-flex items-center gap-1">
                <Layers size={10} />
                {play.signalCount} HG signals
              </span>
              <span className="inline-flex items-center gap-1 text-text-secondary">
                <Sparkles size={10} className={accent.color} />
                <strong className="text-text-primary">{play.estimatedMatches.toLocaleString()}</strong>
                matching accounts
              </span>
              <span className="inline-flex items-center gap-1 text-text-muted/70 italic">
                <Info size={10} />
                Actions configured later in /admin/plays
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="text-[11px] text-text-secondary hover:text-primary inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-bg/40"
                title="Edit play"
              >
                <Edit2 size={11} /> Edit
              </button>
              <button
                onClick={onDelete}
                className="text-[11px] text-text-muted hover:text-rose-600 inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-rose-500/10"
                title="Delete play"
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 ml-2">
          <label className="inline-flex items-center gap-1.5 text-[11px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={play.confirmed}
              onChange={onToggleConfirm}
              className="w-3.5 h-3.5 accent-primary"
            />
            <span className="text-text-secondary">Activate</span>
          </label>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Manage Play Drawer (edit + add) ───────────────────────────────────────

// Pull the ICP defaults off an offering in a shape-agnostic way. Offerings
// in this codebase carry either the normalized `targetIcp` (wizard-built)
// or the legacy `targetICP` (older seed). Both expose industries; the rest
// gets a sensible fallback.
function offeringIcpDefaults(offering) {
  if (!offering) {
    return { industries: [], sizeBand: '', regions: [] };
  }
  const icp = offering.targetIcp || offering.targetICP || {};
  const industries = Array.isArray(icp.industries)
    ? icp.industries
        .map((i) => (typeof i === 'string' ? i : i?.name))
        .filter(Boolean)
    : [];
  const sizeBand =
    icp.employeeBand ||
    icp.employees ||
    (icp.employeeBand?.low ? `${icp.employeeBand.low}+ employees` : '');
  const regions = Array.isArray(icp.geography)
    ? icp.geography.map((g) => (typeof g === 'string' ? g : g?.name)).filter(Boolean)
    : Array.isArray(icp.geos)
    ? icp.geos.map((g) => g.name).filter(Boolean)
    : [];
  return { industries, sizeBand, regions };
}

export function ManagePlayDrawer({ play, confirmedOfferings, onSave, onClose }) {
  const isEdit = !!play?.id;
  // Prefill audience from the first confirmed offering's ICP on create.
  // Admin can narrow further or override — the soft-warn banner in PlayDetail
  // flags reaches outside the offering or tenant ICP.
  const seedOffering = confirmedOfferings[0];
  const seedIcpDefaults = offeringIcpDefaults(seedOffering);
  const [draft, setDraft] = useState(
    play || {
      id: `play-custom-${Date.now()}`,
      name: '',
      motion: 'new_logo',
      description: '',
      offerings: seedOffering ? [seedOffering.id] : [],
      audienceRoles: ['AE'],
      firmoFilters: seedIcpDefaults,
      technoFilters: { hasInstalled: [], missingInstall: [], custom: [] },
      signalCount: 0,
      signalPreview: [],
      estimatedMatches: 0,
      confirmed: true,
      visibility: 'tenant',
      // Default new plays to ICP Match. Admin can pick more workbooks
      // (multi-select) from the picker; an empty list also implies
      // "apply against ICP Match" at runtime.
      workbookIds: ['wb-icp-match'],
    }
  );

  // Teams + sellers for the visibility picker. Teams are static from
  // territoryDesign seed; sellers come from the live territory state so
  // newly-invited reps appear without a code change.
  const allTeams = DEFAULT_TEAMS;
  const allSellers = useMemo(() => listSellers().filter((s) => s.status === 'active'), []);

  // Workbook options for the play attachment picker. Admin builder
  // sees every tenant-visible workbook so they can range a play over
  // ICP Match, CRM Accounts, or a custom uploaded book.
  const playWorkbookOptions = useMemo(
    () => listWorkbooksForPersona({ personaId: 'priya', isAdmin: true, crmConnected: false }),
    [],
  );

  function patch(updates) {
    setDraft((prev) => ({ ...prev, ...updates }));
  }

  function patchFirmo(updates) {
    setDraft((prev) => ({ ...prev, firmoFilters: { ...prev.firmoFilters, ...updates } }));
  }

  function patchTechno(updates) {
    setDraft((prev) => ({ ...prev, technoFilters: { ...prev.technoFilters, ...updates } }));
  }

  // v1 constraint: a play references exactly ONE offering. The drawer
  // used to allow multi-select; we lock it to single-select here. Admins
  // with multiple offerings build separate plays.
  function toggleOffering(id) {
    const isSelected = draft.offerings.includes(id);
    patch({ offerings: isSelected ? [] : [id] });
  }

  function canSave() {
    return draft.name.trim().length > 0 && draft.offerings.length > 0;
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
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-surface border border-border rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg/40 sticky top-0">
          <div className="flex items-center gap-2">
            <Edit2 size={14} className="text-primary" />
            <h2 className="text-sm font-semibold text-text-primary">{isEdit ? 'Edit play' : 'Add a play'}</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">Name</label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="e.g. Competitive Takeout"
              className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
            />
          </div>

          {/* Motion */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">Motion</label>
            <div className="flex flex-wrap gap-1.5">
              {MOTIONS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => patch({ motion: m.id })}
                  className={`text-[11px] px-2 py-1 rounded border ${
                    draft.motion === m.id
                      ? `${m.bg} ${m.color} ${m.border} font-semibold`
                      : 'bg-surface border-border text-text-secondary hover:border-primary/30'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">Description</label>
            <textarea
              value={draft.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="What does this play target? When should sellers run it?"
              rows={2}
              className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none resize-none"
            />
          </div>

          {/* Offering — exactly one (v1 constraint). For multiple offerings,
              build separate plays. */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">
              Offering <span className="text-text-muted/70 normal-case tracking-normal ml-1">(pick one)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {confirmedOfferings.map((o) => {
                const selected = draft.offerings.includes(o.id);
                return (
                  <button
                    key={o.id}
                    onClick={() => toggleOffering(o.id)}
                    className={`text-[11px] px-2.5 py-1 rounded border ${
                      selected
                        ? 'bg-primary/15 text-primary border-primary/40 font-semibold'
                        : 'bg-surface border-border text-text-secondary hover:border-primary/30'
                    }`}
                  >
                    {selected && <Check size={10} className="inline mr-1" />}
                    {o.name}
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] text-text-muted italic mt-1.5">
              Each play targets one offering. Build separate plays for other offerings.
            </div>
          </div>

          {/* Workbooks — which workbook(s) this play filters against.
              Default to ICP Match. Multi-select: a play can apply across
              several workbooks at the same time (e.g. ICP Match + CRM
              Accounts), in which case only the first one is shown in the
              header but the play's criteria intersect every selected
              workbook. */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">
              Apply to workbook(s)
              <span className="text-text-muted/70 normal-case tracking-normal ml-1">
                · play filters intersect every selected workbook
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {playWorkbookOptions.map((wb) => {
                const selected = (draft.workbookIds || []).includes(wb.id);
                return (
                  <button
                    key={wb.id}
                    onClick={() => {
                      const cur = new Set(draft.workbookIds || []);
                      if (cur.has(wb.id)) cur.delete(wb.id);
                      else cur.add(wb.id);
                      patch({ workbookIds: Array.from(cur) });
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded border inline-flex items-center gap-1 ${
                      selected
                        ? 'bg-primary/15 text-primary border-primary/40 font-semibold'
                        : 'bg-surface border-border text-text-secondary hover:border-primary/30'
                    }`}
                  >
                    {selected && <Check size={10} />}
                    {wb.name}
                    {wb.accountCount > 0 && (
                      <span className="text-[10px] font-mono opacity-70">· {wb.accountCount.toLocaleString()}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] text-text-muted italic mt-1.5">
              Default is <strong>ICP Match</strong>. Pick CRM Accounts or My Book to scope to existing book; pick a custom workbook to run the play over a focused list.
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">Audience</label>
            <div className="flex flex-wrap gap-1.5">
              {['AE', 'AM', 'CSM', 'BDR'].map((r) => {
                const active = draft.audienceRoles.includes(r);
                return (
                  <button
                    key={r}
                    onClick={() => {
                      const next = active ? draft.audienceRoles.filter((x) => x !== r) : [...draft.audienceRoles, r];
                      patch({ audienceRoles: next });
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded border ${
                      active
                        ? 'bg-primary/15 text-primary border-primary/40 font-semibold'
                        : 'bg-surface border-border text-text-secondary hover:border-primary/30'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visibility — who sees this play */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1.5">
              Visibility
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'tenant',  label: 'Everyone',  hint: 'All sellers in the tenant see it' },
                { id: 'team',    label: 'Specific teams', hint: 'Only sellers in selected teams' },
                { id: 'private', label: 'Just me',   hint: 'Private to the creator' },
              ].map((v) => {
                const active = (draft.visibility || 'tenant') === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => patch({ visibility: v.id })}
                    className={`text-[11px] px-2.5 py-1 rounded border ${
                      active
                        ? 'bg-primary/15 text-primary border-primary/40 font-semibold'
                        : 'bg-surface border-border text-text-secondary hover:border-primary/30'
                    }`}
                    title={v.hint}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
            {draft.visibility === 'team' && (
              <div className="mt-3 space-y-3 bg-bg/30 border border-border/60 rounded p-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block mb-1.5">
                    Teams
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {allTeams.map((t) => {
                      const selected = (draft.teamIds || []).includes(t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            const ids = draft.teamIds || [];
                            patch({
                              teamIds: selected
                                ? ids.filter((id) => id !== t.id)
                                : [...ids, t.id],
                            });
                          }}
                          className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                            selected
                              ? 'bg-primary/10 text-primary border-primary/40 font-semibold'
                              : 'bg-surface border-border text-text-secondary hover:border-primary/30'
                          }`}
                          title={t.description}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                  {(draft.teamIds || []).length === 0 && (
                    <div className="text-[10px] text-text-muted italic mt-1">
                      No teams selected — this play won't appear in any team's sidebar.
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block mb-1.5">
                    Individual sellers (optional)
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto thin-scrollbar">
                    {allSellers.map((s) => {
                      const selected = (draft.userIds || []).includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            const ids = draft.userIds || [];
                            patch({
                              userIds: selected
                                ? ids.filter((id) => id !== s.id)
                                : [...ids, s.id],
                            });
                          }}
                          className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                            selected
                              ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/40 font-semibold'
                              : 'bg-surface border-border text-text-secondary hover:border-violet-500/30'
                          }`}
                          title={`${s.role} · ${s.region}`}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-text-muted italic mt-1">
                    Individual sellers see this play even if they're not in the selected teams.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Firmographic filters */}
          <div className="bg-bg/30 border border-border/60 rounded p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-text-muted">
              <Building2 size={11} /> Firmographic filters
            </div>
            <ChipEditor
              label="Industries"
              chips={draft.firmoFilters.industries}
              onChange={(industries) => patchFirmo({ industries })}
              placeholder="Add industry (e.g. Healthcare)"
            />
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block mb-1">Size band</label>
              <input
                type="text"
                value={draft.firmoFilters.sizeBand}
                onChange={(e) => patchFirmo({ sizeBand: e.target.value })}
                placeholder="e.g. 1,000+ employees"
                className="w-full px-2 py-1.5 bg-surface border border-border rounded text-[12px] text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
              />
            </div>
            <ChipEditor
              label="Regions"
              chips={draft.firmoFilters.regions}
              onChange={(regions) => patchFirmo({ regions })}
              placeholder="Add region (e.g. United States)"
            />
          </div>

          {/* Technographic filters */}
          <div className="bg-bg/30 border border-border/60 rounded p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-text-muted">
              <Cpu size={11} /> Technographic filters
            </div>
            <ChipEditor
              label="Has installed"
              chips={draft.technoFilters.hasInstalled}
              onChange={(hasInstalled) => patchTechno({ hasInstalled })}
              placeholder="Add product (e.g. Palo Alto Prisma Cloud)"
            />
            <ChipEditor
              label="Missing"
              chips={draft.technoFilters.missingInstall}
              onChange={(missingInstall) => patchTechno({ missingInstall })}
              placeholder="Add product to require missing (e.g. CNAPP)"
            />
            <ChipEditor
              label="Custom signals"
              chips={draft.technoFilters.custom}
              onChange={(custom) => patchTechno({ custom })}
              placeholder="e.g. Intent surge ≥ 30 in last 30d"
            />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border bg-bg/40 flex items-center justify-end gap-2 sticky bottom-0">
          <button onClick={onClose} className="text-[12px] px-3 py-1.5 rounded border border-border hover:border-primary/30 text-text-secondary">
            Cancel
          </button>
          <button
            disabled={!canSave()}
            onClick={() => onSave(draft)}
            className="text-[12px] px-3 py-1.5 rounded bg-primary text-white hover:bg-primary-dim disabled:opacity-40 font-semibold flex items-center gap-1.5"
          >
            <Check size={12} /> {isEdit ? 'Save changes' : 'Add play'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Simple chip-array editor — type, hit Enter, the chip appears. X to remove.
function ChipEditor({ label, chips, onChange, placeholder }) {
  const [input, setInput] = useState('');

  function add() {
    const v = input.trim();
    if (!v) return;
    if (chips.includes(v)) {
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
      <label className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block mb-1">{label}</label>
      <div className="flex flex-wrap gap-1 mb-1">
        {chips.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-surface text-text-secondary border border-border">
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
          className="flex-1 px-2 py-1 bg-surface border border-border rounded text-[11px] text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
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

// ─── Main wizard step ──────────────────────────────────────────────────────

export default function StepPlays({ confirmedOfferings, onConfirm, onBack }) {
  const [plays, setPlays] = useState(() => seedProposalsFor(confirmedOfferings));
  const [editingPlay, setEditingPlay] = useState(null); // play obj or 'new' or null
  const [confirmDelete, setConfirmDelete] = useState(null); // play id or null

  const offeringNameById = Object.fromEntries(confirmedOfferings.map((o) => [o.id, o.shortName || o.name]));
  const activatedCount = plays.filter((p) => p.confirmed).length;
  const totalEstimated = plays.filter((p) => p.confirmed).reduce((sum, p) => sum + (p.estimatedMatches || 0), 0);

  function toggleConfirm(id) {
    setPlays((prev) => prev.map((p) => (p.id === id ? { ...p, confirmed: !p.confirmed } : p)));
  }

  function deletePlay(id) {
    setPlays((prev) => prev.filter((p) => p.id !== id));
    setConfirmDelete(null);
  }

  function savePlay(draft) {
    setPlays((prev) => {
      const exists = prev.find((p) => p.id === draft.id);
      if (exists) return prev.map((p) => (p.id === draft.id ? { ...p, ...draft } : p));
      return [...prev, draft];
    });
    setEditingPlay(null);
  }

  function handleContinue() {
    onConfirm(plays.filter((p) => p.confirmed));
  }

  function handleSkip() {
    onConfirm([]); // empty array signals "skip"
  }

  return (
    <motion.div
      key="plays"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="w-full max-w-4xl"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 bg-rose-500/15 border border-rose-500/30 rounded-full text-[11px] uppercase tracking-wider text-rose-700 dark:text-rose-300 font-bold">
          <Sparkles size={11} /> Step 3 of 3 · AI-proposed plays · Optional
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Review your sales plays</h1>
        <p className="text-sm text-text-secondary leading-relaxed max-w-2xl mx-auto">
          Each play is a <strong>business motion</strong> (displacement, new logo, in-market, event, etc.) attached to one
          or more offerings, with HG firmographic + technographic filters. <strong>Actions</strong> (briefs, emails,
          contact discovery) are configured later from <span className="font-mono">/admin/plays</span> — for now,
          just review, refine, or skip.
        </p>
      </div>

      <div className="space-y-3 mb-4">
        <AnimatePresence initial={false}>
          {plays.map((play) => (
            <PlayCard
              key={play.id}
              play={play}
              offeringNameById={offeringNameById}
              onToggleConfirm={() => toggleConfirm(play.id)}
              onEdit={() => setEditingPlay(play)}
              onDelete={() => setConfirmDelete(play.id)}
            />
          ))}
        </AnimatePresence>

        <button
          onClick={() => setEditingPlay('new')}
          className="w-full bg-surface border border-dashed border-border hover:border-primary/40 rounded-lg p-3 text-[12px] text-text-secondary hover:text-primary transition-all flex items-center justify-center gap-2"
        >
          <Plus size={13} /> Add another play
        </button>
      </div>

      <div className="bg-surface border border-border rounded-md p-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-[12px] text-text-secondary hover:text-text-primary inline-flex items-center gap-1"
        >
          <ArrowLeft size={12} /> Back to offerings
        </button>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-[11px] text-text-muted">
            {activatedCount === 0 ? (
              <span>No plays activated · workbench will show unfiltered scored accounts</span>
            ) : (
              <span>
                <strong className="text-text-primary">{activatedCount}</strong> of {plays.length} plays active ·{' '}
                <strong className="text-text-primary">{totalEstimated.toLocaleString()}</strong> matching accounts
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
            Enter RGI Workbench <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 text-center text-[11px] text-text-muted">
        <Sparkles size={9} className="inline text-primary mr-1" />
        Add or refine plays any time from <span className="font-mono">/admin/plays</span>. Scoring runs in the
        background — matches populate as you explore.
      </div>

      {/* Edit / Add drawer */}
      <AnimatePresence>
        {editingPlay && (
          <ManagePlayDrawer
            play={editingPlay === 'new' ? null : editingPlay}
            confirmedOfferings={confirmedOfferings}
            onSave={savePlay}
            onClose={() => setEditingPlay(null)}
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
              <h3 className="text-sm font-semibold text-text-primary mb-1">Delete this play?</h3>
              <p className="text-[12px] text-text-secondary mb-4">
                You can re-create it later from <span className="font-mono">/admin/plays</span>, but the AI-proposed
                signal composition will need to be rebuilt.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-[12px] px-3 py-1.5 rounded border border-border text-text-secondary hover:border-primary/30"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deletePlay(confirmDelete)}
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
