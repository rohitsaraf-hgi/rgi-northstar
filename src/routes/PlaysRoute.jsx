import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { usePersona } from '../context/PersonaContext.jsx';
import { motion } from 'framer-motion';
import {
  Wand2,
  ArrowLeft,
  Plus,
  Package,
  Users,
  Sparkles,
  Database,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Globe,
  BookOpen,
  ChevronRight,
  Pin,
  Layers,
  Workflow,
} from 'lucide-react';
import { listPlays, getPlay, upsertPlay, deletePlay, subscribePlays, MOTION_LABELS } from '../data/plays.js';
import { listOfferings } from '../data/offerings.js';
import { ManagePlayDrawer } from '../components/onboarding/StepPlays.jsx';
import { AnimatePresence } from 'framer-motion';
import { Edit2, Trash2 } from 'lucide-react';
import { getOffering } from '../data/offerings.js';
import { getWorkflow } from '../data/workflows.js';
import { getSignalDef, SIGNAL_CATEGORIES } from '../data/rankingSignals.js';
import { useToast } from '../context/ToastContext.jsx';
import FilterPanel from '../components/workbook/FilterPanel.jsx';
import { getIntegrationGovernance } from '../data/integrationGovernance.js';
import { useTenant } from '../context/TenantContext.jsx';
import { Filter, X } from 'lucide-react';

// CRM connection detection — used to gate the CRM Filters group inside
// the Plays audience builder. Matches what WorkbookRoute uses for the
// workbookState.hasCrm flag but lives inline to avoid a refactor.
function detectCrmConnected() {
  const sf = getIntegrationGovernance('salesforce');
  const hs = getIntegrationGovernance('hubspot');
  return sf?.agentAccess === true || hs?.agentAccess === true;
}

// Render a single signal as a chip in the Play Builder
function SignalChip({ signal, showWeight = true }) {
  const cat = SIGNAL_CATEGORIES[signal.category];
  const styles =
    signal.kind === 'hg'
      ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
      : 'bg-sky-500/5 border-sky-500/30 text-sky-700 dark:text-sky-300';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] rounded border ${styles}`}
      title={signal.description}
    >
      {signal.kind === 'hg' ? <Globe size={9} /> : <BookOpen size={9} />}
      <span className="font-mono text-[9px] uppercase tracking-wider opacity-60">{cat?.label || signal.category}</span>
      <span className="font-medium">{signal.name}</span>
      {showWeight && (
        <span className="font-mono text-[9px] opacity-70">·w{signal.weight}</span>
      )}
    </span>
  );
}

function ScopeBadge({ scope }) {
  if (scope === 'both') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30">
        <Layers size={9} />
        Book + Whitespace
      </span>
    );
  }
  if (scope === 'whitespace') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30">
        <Globe size={9} />
        Whitespace only
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30">
      <BookOpen size={9} />
      Book only
    </span>
  );
}

function PlayCard({ play, onOpen }) {
  const offering = getOffering(play.offering_id);
  const signals = (play.signals || []).map((id) => getSignalDef(id)).filter(Boolean);
  const hgCount = signals.filter((s) => s.kind === 'hg').length;
  const crmCount = signals.filter((s) => s.kind === 'crm').length;
  const motionLabel = MOTION_LABELS[play.motion] || play.motion;
  return (
    <motion.button
      onClick={() => onOpen(play.id)}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full text-left bg-surface border ${offering?.borderColor || 'border-border'} rounded-md p-4 hover:shadow-card transition-all`}
    >
      <div className="flex items-start gap-3 mb-2">
        <div className={`w-9 h-9 rounded-md ${offering?.bg || 'bg-primary/10'} flex items-center justify-center flex-shrink-0`}>
          <Wand2 size={15} className={offering?.textColor || 'text-primary'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="text-sm font-semibold text-text-primary">{play.name}</h3>
            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
              {motionLabel}
            </span>
            {offering && (
              <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${offering.bg} ${offering.textColor}`}>
                {offering.name}
              </span>
            )}
            {play.is_default_chip && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30" title="Pinned to seller chip strip by default">
                <Pin size={9} />
                Default chip
              </span>
            )}
            <ScopeBadge scope={play.surface_scope} />
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{play.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/40">
        <span className="text-[9px] uppercase tracking-wider font-semibold text-text-muted">
          Signals ({signals.length}):
        </span>
        {signals.slice(0, 4).map((s) => (
          <SignalChip key={s.id} signal={s} showWeight={false} />
        ))}
        {signals.length > 4 && (
          <span className="text-[10px] text-text-muted">+{signals.length - 4} more</span>
        )}
        <span className="ml-auto text-[10px] text-text-muted flex items-center gap-2">
          {hgCount > 0 && <span className="text-emerald-700 dark:text-emerald-300">{hgCount} HG</span>}
          {crmCount > 0 && <span className="text-sky-700 dark:text-sky-300">{crmCount} CRM</span>}
          <span>·</span>
          <Users size={9} />
          {(play.audience_roles || play.audienceRoles || []).join(' / ') || '—'}
          <VisibilityChip visibility={play.visibility} />
        </span>
      </div>
    </motion.button>
  );
}

function VisibilityChip({ visibility }) {
  const v = visibility || 'tenant';
  const variants = {
    tenant:  { label: 'Shared with everyone', short: 'Tenant',  color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    team:    { label: 'Shared with teams',    short: 'Teams',   color: 'text-blue-700 dark:text-blue-300',       bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
    private: { label: 'Private to creator',   short: 'Private', color: 'text-text-muted',                        bg: 'bg-surface-2',      border: 'border-border' },
  };
  const cfg = variants[v];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color} ${cfg.border} font-bold`}
      title={cfg.label}
    >
      {cfg.short}
    </span>
  );
}

function PlayDetail({ play, onBack }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { tenant } = useTenant();
  const offering = getOffering(play.offering_id);
  const signals = (play.signals || []).map((id) => getSignalDef(id)).filter(Boolean);
  const hgSignals = signals.filter((s) => s.kind === 'hg');
  const crmSignals = signals.filter((s) => s.kind === 'crm');
  const recommendedWorkflows = (play.recommended_workflows || []).map((wid) => getWorkflow(wid)).filter(Boolean);
  const crmDependent = crmSignals.length > 0;
  const motionLabel = MOTION_LABELS[play.motion] || play.motion;

  // ─── ICP delta detection (soft warn) ─────────────────────────────
  // Audience hierarchy: tenant ICP ⊇ offering ICP ⊇ play audience.
  // We warn (never block) when the play reaches past either set.
  const playIndustries = (play.firmoFilters?.industries || []).filter((i) => i && i !== 'Any');
  const tenantIndustries = (tenant?.icp?.industries || []).map((i) =>
    typeof i === 'string' ? i : i?.name,
  ).filter(Boolean);
  const offeringIcp =
    offering?.targetIcp || offering?.targetICP || {};
  const offeringIndustries = (offeringIcp.industries || []).map((i) =>
    typeof i === 'string' ? i : i?.name,
  ).filter(Boolean);
  const lc = (s) => String(s || '').toLowerCase();
  const inSet = (list, needle) =>
    list.some((x) => lc(x) === lc(needle) || lc(x).includes(lc(needle)) || lc(needle).includes(lc(x)));
  const industriesOutsideTenant = playIndustries.filter((i) => tenantIndustries.length > 0 && !inSet(tenantIndustries, i));
  const industriesOutsideOffering = playIndustries.filter(
    (i) => offeringIndustries.length > 0 && !inSet(offeringIndustries, i),
  );
  const hasIcpReach = industriesOutsideTenant.length > 0 || industriesOutsideOffering.length > 0;

  // ─── Audience refinement (per the new model) ─────────────────────
  // Plays narrow the offering's ICP audience via optional HG-firmographic
  // refinements + first-party CRM filters (gated by CRM connection).
  // Filters live on the play and are persisted via configStore.
  const crmConnected = detectCrmConnected();
  const [audienceFilters, setAudienceFilters] = useState(play.audienceFilters || []);
  const [audiencePanelOpen, setAudiencePanelOpen] = useState(false);
  const persistAudienceFilters = (next) => {
    setAudienceFilters(next);
    upsertPlay({ ...play, audienceFilters: next });
  };
  const addOrUpdateAudienceFilter = (filter) => {
    const exists = audienceFilters.some((f) => f.id === filter.id);
    const next = exists
      ? audienceFilters.map((f) => (f.id === filter.id ? filter : f))
      : [...audienceFilters, filter];
    persistAudienceFilters(next);
  };
  const removeAudienceFilter = (id) =>
    persistAudienceFilters(audienceFilters.filter((f) => f.id !== id));
  const clearAudienceFilters = () => persistAudienceFilters([]);

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Plays
      </button>
      <div className="mb-2 text-xs text-text-muted">Platform & Ops · Plays · {play.name}</div>

      <div className="flex items-start gap-3 mb-5">
        <div className={`w-12 h-12 rounded-md ${offering?.bg || 'bg-primary/10'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Wand2 size={22} className={offering?.textColor || 'text-primary'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-semibold tracking-tight">{play.name}</h1>
            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
              {motionLabel}
            </span>
            {offering && (
              <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${offering.bg} ${offering.textColor}`}>
                {offering.name}
              </span>
            )}
            <ScopeBadge scope={play.surface_scope} />
            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
              <CheckCircle2 size={9} />
              {play.status}
            </span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed max-w-3xl">{play.description}</p>
          <div className="text-[10px] text-text-muted mt-2 flex items-center gap-2">
            <Users size={10} />
            Audience: {(play.audience_roles || play.audienceRoles || []).join(' / ') || '—'}
            <span>·</span>
            <span>v{play.version || 1} by {play.created_by || 'AI'}</span>
          </div>
        </div>
        <button
          onClick={() => showToast('Inline condition editing ships in the next phase. For now, conditions are read-only here.', 'info')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md"
        >
          <Edit3 size={11} />
          Edit conditions
        </button>
      </div>

      {/* Signals — the ranking + explanation mechanism */}
      <div className="bg-surface border border-border rounded-md p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-text-primary">Ranking signals</div>
            <div className="text-[11px] text-text-muted leading-relaxed mt-0.5">
              An account appears in this play if <span className="font-semibold">at least one signal fires</span>.
              Ranking = sum of firing signal weights × offering fit. Sellers see firing signals as provenance chips.
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-bg/40 text-text-secondary font-mono">
            {signals.length} signals
          </span>
        </div>

        {hgSignals.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Globe size={10} className="text-emerald-700 dark:text-emerald-300" />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-300">
                Third-party · HG signals
              </span>
              <span className="text-[10px] text-text-muted ml-1">
                Surface book + whitespace
              </span>
            </div>
            <div className="space-y-1.5 pl-4">
              {hgSignals.map((s) => (
                <div key={s.id} className="flex items-start gap-2">
                  <SignalChip signal={s} />
                  <span className="text-[10px] text-text-muted leading-snug flex-1">{s.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {crmSignals.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={10} className="text-sky-700 dark:text-sky-300" />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-sky-700 dark:text-sky-300">
                First-party · CRM signals
              </span>
              <span className="text-[10px] text-text-muted ml-1">
                Book only
              </span>
            </div>
            <div className="space-y-1.5 pl-4">
              {crmSignals.map((s) => (
                <div key={s.id} className="flex items-start gap-2">
                  <SignalChip signal={s} />
                  <span className="text-[10px] text-text-muted leading-snug flex-1">{s.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {crmDependent && play.surface_scope === 'whitespace' && (
          <div className="mt-3 px-2.5 py-2 bg-amber-500/5 border border-amber-500/30 rounded text-[11px] text-amber-700 dark:text-amber-300 inline-flex items-start gap-1.5">
            <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
            <span>
              This play references CRM signals — they're auto-skipped for whitespace accounts.
            </span>
          </div>
        )}

        {play.eligibility && Object.keys(play.eligibility).length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
              Eligibility gating
            </div>
            <div className="text-[11px] text-text-secondary">
              {play.eligibility.min_offering_fit != null && (
                <span>
                  Account must have {(offering?.name || 'offering')} fit score ≥{' '}
                  <span className="font-mono text-text-primary">{play.eligibility.min_offering_fit}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Soft-warn when the play's audience reaches outside the offering
          ICP or tenant ICP. Never blocks — admins can run plays in
          adjacent industries with intent. */}
      {hasIcpReach && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-md p-3 mb-4">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-0.5">
                Audience reaches outside your ICP
              </div>
              <div className="text-[11px] text-text-secondary leading-relaxed">
                {industriesOutsideOffering.length > 0 && (
                  <div>
                    <span className="font-medium">{industriesOutsideOffering.length}</span>{' '}
                    {industriesOutsideOffering.length === 1 ? 'industry' : 'industries'} not in the{' '}
                    <span className="font-mono">{offering?.name || 'offering'}</span> ICP:{' '}
                    {industriesOutsideOffering.map((i, idx) => (
                      <span
                        key={i}
                        className="font-mono text-amber-700 dark:text-amber-300"
                      >
                        {i}
                        {idx < industriesOutsideOffering.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                )}
                {industriesOutsideTenant.length > 0 && (
                  <div className="mt-1">
                    <span className="font-medium">{industriesOutsideTenant.length}</span>{' '}
                    {industriesOutsideTenant.length === 1 ? 'industry' : 'industries'} not in your{' '}
                    <span className="font-mono">tenant ICP</span>:{' '}
                    {industriesOutsideTenant.map((i, idx) => (
                      <span
                        key={i}
                        className="font-mono text-amber-700 dark:text-amber-300"
                      >
                        {i}
                        {idx < industriesOutsideTenant.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-text-muted mt-1.5">
                  This is a warning, not a block. Plays can target adjacent industries — confirm this is intentional.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audience refinement — optional HG + CRM filters on top of the
          play's offering ICP. Workbook itself has no filters; slicing the
          universe is a Play-level concern. */}
      <div className="bg-surface border border-border rounded-md p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-text-primary">Audience refinement</div>
            <div className="text-[11px] text-text-muted leading-relaxed mt-0.5">
              Optional. Layer firmographic / technographic / intent
              constraints — and CRM filters when connected — on top of the
              offering ICP.
            </div>
          </div>
          <button
            onClick={() => setAudiencePanelOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-md transition-colors ${
              audienceFilters.length > 0
                ? 'bg-primary/10 text-primary border-primary/40'
                : 'bg-surface text-text-secondary border-border hover:text-primary hover:border-primary/40'
            }`}
            title="Open the filter builder"
          >
            <Filter size={11} />
            Refine audience
            {audienceFilters.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                {audienceFilters.length}
              </span>
            )}
          </button>
        </div>
        {audienceFilters.length === 0 ? (
          <div className="text-[11px] text-text-muted italic">
            No refinements. Play surfaces every account in the offering ICP that has at least one signal firing.
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            {audienceFilters.map((f) => (
              <button
                key={f.id}
                onClick={() => setAudiencePanelOpen(true)}
                className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md text-[11px] bg-primary/10 border border-primary/30 text-primary hover:bg-primary/15 transition-colors"
              >
                <span className="text-text-muted text-[9px] uppercase tracking-wider">{f.group}:</span>
                <span className="font-medium">{f.label}</span>
                {f.displayValue && (
                  <span className="text-text-secondary font-mono text-[10px]">{f.displayValue}</span>
                )}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAudienceFilter(f.id);
                  }}
                  className="ml-0.5 p-0.5 rounded hover:bg-primary/20 text-primary/70 hover:text-primary transition-colors cursor-pointer"
                  title="Remove filter"
                >
                  <X size={10} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Coming soon: CRM filters preview. When a CRM is connected and the
          feature ships, these dimensions become writable inside the
          Audience refinement panel. For now they're shown as a preview so
          admins know what's coming. */}
      <div className="bg-bg/30 border border-dashed border-border rounded-md p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Database size={13} className="text-text-muted" />
          <div className="text-sm font-semibold text-text-secondary">
            CRM Filters (first-party)
          </div>
          <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            Coming soon
          </span>
          {!crmConnected && (
            <span className="text-[10px] text-text-muted italic ml-auto">
              Connect a CRM in <span className="font-mono">Admin Hub → Integrations</span> first.
            </span>
          )}
        </div>
        <div className="text-[11px] text-text-muted leading-relaxed mb-3">
          Once CRM filters ship, you'll be able to narrow a play's audience by these
          dimensions in addition to HG firmographics and technographics.
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Opportunity Stage', desc: 'Prospect / Qualified / Discovery / Negotiation / Closed Won' },
            { label: 'Owner', desc: 'Account owner (specific reps or unassigned)' },
            { label: 'Last Activity', desc: 'Days since last meaningful touch (e.g. ≥ 14 = stale)' },
            { label: 'Renewal Window', desc: 'Days until renewal date (e.g. ≤ 90 for next quarter)' },
            { label: 'Open Opp Value', desc: 'Sum of open opportunities in USD' },
            { label: 'CRM Region', desc: 'AMER / EMEA / APAC / LATAM' },
          ].map((d) => (
            <div
              key={d.label}
              className="px-2.5 py-1.5 rounded border border-border/60 bg-surface/60"
            >
              <div className="text-[11px] font-semibold text-text-secondary">{d.label}</div>
              <div className="text-[10px] text-text-muted leading-tight mt-0.5">{d.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <FilterPanel
        open={audiencePanelOpen}
        onClose={() => setAudiencePanelOpen(false)}
        filters={audienceFilters}
        onAddOrUpdate={addOrUpdateAudienceFilter}
        onRemove={removeAudienceFilter}
        onClearAll={clearAudienceFilters}
        // CRM Filters group is intentionally hidden in the play audience
        // editor for this iteration — we preview the dimensions below the
        // audience refinement card so admins know what's coming, but the
        // actual filters aren't writable yet.
        crmConnected={false}
        title={`Audience for ${play.name}`}
      />

      {/* Recommended workflows */}
      <div className="bg-surface border border-border rounded-md p-4 mb-4">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-3">
          Recommended workflows ({recommendedWorkflows.length})
        </div>
        {recommendedWorkflows.length === 0 ? (
          <div className="text-[11px] text-text-muted italic">No workflows attached. Sellers will see this play but won&rsquo;t have one-click actions.</div>
        ) : (
          <div className="space-y-2">
            {recommendedWorkflows.map((w) => (
              <button
                key={w.id}
                onClick={() => navigate(`/admin/workflows/${w.id}`)}
                className="w-full text-left bg-bg/40 border border-border rounded p-2.5 flex items-center gap-3 hover:border-primary/30 transition-colors"
              >
                <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center">
                  <Workflow size={13} className="text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-text-primary">{w.name}</div>
                  <div className="text-[10px] text-text-muted truncate">{w.description}</div>
                </div>
                <ChevronRight size={11} className="text-text-muted" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="text-[11px] text-text-muted leading-relaxed max-w-3xl border-t border-border pt-3">
        <span className="font-semibold text-text-secondary">How this play works:</span> when a seller picks
        this chip on their home, the platform evaluates the trigger conditions across {' '}
        {play.surface_scope === 'book' ? 'their book' : play.surface_scope === 'whitespace' ? 'HG\'s whitespace universe' : 'their book + HG\'s whitespace'},
        ranks matching accounts by match strength × offering fit, and surfaces them with provenance
        ("Matched because..."). Sellers can run the recommended workflows directly from each result row.
      </div>
    </div>
  );
}

export default function PlaysRoute() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { personaId, persona } = usePersona();
  const isAdmin = persona?.roleType === 'admin';
  const [audience, setAudience] = useState('all');
  const [, setTick] = useState(0);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Hooks must run before any early return — Rules of Hooks.
  useEffect(() => subscribePlays(() => setTick((t) => t + 1)), []);

  const allPlays = listPlays();
  // Visibility filter — non-admins only see tenant-shared plays + their own
  // private plays. Admins see everything.
  const visiblePlays = isAdmin
    ? allPlays
    : allPlays.filter((p) => {
        const v = p.visibility || 'tenant';
        if (v === 'tenant') return true;
        if (v === 'team') return true; // team filter ships next iteration
        if (v === 'private') return p.created_by === personaId || p.userIds?.includes(personaId);
        return false;
      });
  const filteredPlays = audience === 'all'
    ? visiblePlays
    : visiblePlays.filter((p) => (p.audienceRoles || p.audience_roles || []).includes(audience));
  const playsByOffering = useMemo(() => {
    const groups = {};
    for (const p of filteredPlays) {
      // New schema has offerings[]; legacy has offering_id (single).
      const ofIds = p.offerings && p.offerings.length > 0
        ? p.offerings
        : (p.offering_id ? [p.offering_id] : ['_unassigned']);
      for (const ofId of ofIds) {
        if (!groups[ofId]) groups[ofId] = [];
        if (!groups[ofId].find((x) => x.id === p.id)) groups[ofId].push(p);
      }
    }
    return groups;
  }, [filteredPlays]);

  const confirmedOfferings = listOfferings();

  function handleSave(draft) {
    // Sellers' newly-created plays default to private + stamped with their id
    // so visibility filtering shows them only to the creator. Admins keep
    // whatever visibility they picked in the drawer (defaults to tenant).
    const isNewByThisPersona = !draft.created_by;
    const defaults = isNewByThisPersona && !isAdmin
      ? { visibility: 'private', created_by: personaId }
      : isNewByThisPersona
        ? { created_by: personaId }
        : {};
    upsertPlay({
      ...draft,
      ...defaults,
      offering_id: draft.offerings?.[0] || draft.offering_id, // legacy compat
    });
    setEditing(null);
  }

  function handleDelete(playId) {
    deletePlay(playId);
    setConfirmDelete(null);
  }

  if (id) {
    const play = getPlay(id);
    if (!play) {
      return (
        <div className="max-w-6xl mx-auto px-8 py-8">
          <button onClick={() => navigate('/admin/plays')} className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3">
            <ArrowLeft size={11} />
            Plays
          </button>
          <div className="bg-surface border border-dashed border-border rounded-md p-10 text-center">
            <Wand2 size={20} className="mx-auto text-text-muted mb-2" />
            <h3 className="text-sm font-semibold text-text-primary">Play not found</h3>
          </div>
        </div>
      );
    }
    return <PlayDetail play={play} onBack={() => navigate('/admin/plays')} />;
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate(isAdmin ? '/admin' : '/workspace')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3"
      >
        <ArrowLeft size={11} />
        {isAdmin ? 'Admin Hub' : 'Back to Workspace'}
      </button>

      <div className="mb-2 text-xs text-text-muted">
        {isAdmin ? 'Platform & Ops · Plays' : 'My Plays'}
      </div>

      <div className="flex items-end justify-between mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isAdmin ? 'Plays' : 'Sales Plays'}
        </h1>
        <button
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
        >
          <Plus size={12} />
          {isAdmin ? 'New play' : 'Create my play'}
        </button>
      </div>

      <p className="text-sm text-text-secondary mb-3 max-w-3xl">
        {isAdmin ? (
          <>
            Plays are business motions — Competitive Takeout, Net New Logo, Expansion, Renewal Defense.
            Each play composes <span className="font-semibold">ranking signals</span> from HG technographic /
            intent / engagement data and CRM filters. Set visibility on each play to share with all sellers
            (Tenant), specific teams, or keep private.
          </>
        ) : (
          <>
            You're seeing plays your admin shared with everyone, plus any private plays you've created. Use{' '}
            <span className="font-semibold">Create my play</span> to compose your own — those default to{' '}
            <span className="font-mono text-[11px]">private</span> and only you see them.
          </>
        )}
      </p>

      <div className="mb-6 px-3 py-2 rounded-md bg-bg/40 border border-border flex items-center gap-2 text-[11px]">
        <Sparkles size={11} className="text-primary flex-shrink-0" />
        <span className="text-text-secondary">
          <span className="font-semibold text-text-primary">Signals are enriched in your Workbook.</span>{' '}
          Author Plays here that reference those signals.
        </span>
        <button
          onClick={() => navigate('/workbook')}
          className="ml-auto inline-flex items-center gap-1 text-primary hover:underline font-semibold"
        >
          Open Workbook →
        </button>
      </div>

      {/* Audience filter */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Audience:</span>
        {['all', 'AE', 'AM', 'CSM'].map((a) => (
          <button
            key={a}
            onClick={() => setAudience(a)}
            className={`px-2.5 py-1 text-[11px] rounded border transition-colors ${
              audience === a
                ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                : 'bg-surface border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {a === 'all' ? `All (${allPlays.length})` : a}
          </button>
        ))}
      </div>

      {/* Plays grouped by offering */}
      <div className="space-y-6">
        {Object.entries(playsByOffering).map(([offeringId, plays]) => {
          const offering = getOffering(offeringId);
          return (
            <div key={offeringId}>
              <div className="flex items-center gap-2 mb-3">
                {offering && (
                  <>
                    <Package size={12} className={offering.textColor} />
                    <h2 className={`text-sm font-semibold ${offering.textColor}`}>{offering.name}</h2>
                    <span className="text-[10px] text-text-muted">· {plays.length} plays</span>
                  </>
                )}
              </div>
              <div className="space-y-2">
                {plays.map((p) => (
                  <div key={p.id} className="relative group">
                    <PlayCard play={p} onOpen={(pid) => navigate(`/admin/plays/${pid}`)} />
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(p);
                        }}
                        className="text-[11px] px-1.5 py-1 rounded bg-bg/80 backdrop-blur border border-border hover:border-primary/30 text-text-secondary hover:text-primary inline-flex items-center gap-1"
                        title="Edit play"
                      >
                        <Edit2 size={11} /> Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(p.id);
                        }}
                        className="text-[11px] px-1.5 py-1 rounded bg-bg/80 backdrop-blur border border-border hover:border-rose-500/40 text-text-muted hover:text-rose-600 inline-flex items-center gap-1"
                        title="Delete play"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add drawer */}
      <AnimatePresence>
        {editing && (
          <ManagePlayDrawer
            play={editing === 'new' ? null : editing}
            confirmedOfferings={confirmedOfferings}
            onSave={handleSave}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <div
              className="bg-surface border border-border rounded-lg p-5 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-text-primary mb-1">Delete this play?</h3>
              <p className="text-[12px] text-text-secondary mb-4">
                You can recreate it later from this page or the onboarding wizard. Any seller workspaces
                referencing this play will fall back to the team default.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-[12px] px-3 py-1.5 rounded border border-border text-text-secondary hover:border-primary/30"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="text-[12px] px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-500 font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Power-user footer link */}
      <div className="mt-8 border-t border-border pt-4 flex items-start gap-3 max-w-3xl">
        <Layers size={14} className="text-text-muted flex-shrink-0 mt-0.5" />
        <div className="text-[11px] text-text-muted leading-relaxed flex-1">
          <span className="font-semibold text-text-secondary">Advanced authoring:</span> the raw signal +
          workflow primitives that power plays live in <a href="/admin/signals" className="text-primary hover:underline">Signal Studio</a> and {' '}
          <a href="/admin/workflows" className="text-primary hover:underline">Workflow Studio</a>. Most plays
          are authored visually here, but power users drop into the raw tools for complex condition trees.
        </div>
      </div>
    </div>
  );
}
