import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Globe,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Building2,
  Target,
  DollarSign,
  Cpu,
  Swords,
  Users as UsersIcon,
  Handshake,
  Lightbulb,
  Globe2,
  AlertTriangle,
  Layers,
  Edit2,
  Plus,
  Info,
  X,
} from 'lucide-react';
import { matchTenantByUrl, WIZ_TENANT } from '../data/tenants.js';
import { useTenant } from '../context/TenantContext.jsx';
import { usePersona } from '../context/PersonaContext.jsx';
import StepPlays from '../components/onboarding/StepPlays.jsx';
import StepOfferings from '../components/onboarding/StepOfferings.jsx';
import { replaceOfferings, upsertPlay } from '../data/configStore.js';

// ===== Step 1: Landing =====
function StepLanding({ onNext, defaults }) {
  const [url, setUrl] = useState(defaults.url);
  const [name, setName] = useState(defaults.name);
  const [role, setRole] = useState(defaults.role);

  const submit = (e) => {
    e?.preventDefault();
    onNext({ url: url.trim(), name: name.trim(), role });
  };

  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="w-full max-w-xl"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 bg-primary/10 border border-primary/20 rounded-full text-[11px] uppercase tracking-wider text-primary font-bold">
          <Sparkles size={11} /> Zero-config onboarding
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Spin up your tenant</h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          Paste your company URL. Phoenix agents read your site, SEC filings, and HG's graph
          to build your products, ICP, competitors, and buying committee — automatically.
        </p>
      </div>

      <form onSubmit={submit} className="bg-surface border border-border rounded-lg p-6 shadow-card">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold flex items-center gap-1.5 mb-1.5">
              <Globe size={11} /> Company URL
            </label>
            <input
              autoFocus
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="wiz.io"
              className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5 block">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Chen"
                className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5 block">
                Your role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-bg/40 border border-border rounded text-sm text-text-primary focus:border-primary/40 focus:outline-none"
              >
                <option>Account Executive</option>
                <option>RevOps</option>
                <option>Marketing Strategist</option>
                <option>VP Sales</option>
                <option>Admin</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={!url.trim() || !name.trim()}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm rounded-md hover:bg-primary-dim disabled:opacity-40 transition-colors font-medium"
          >
            Build my tenant <ArrowRight size={14} />
          </button>
        </div>
        <div className="mt-4 pt-4 border-t border-border text-[11px] text-text-muted leading-relaxed">
          <Sparkles size={9} className="inline text-primary mr-1" />
          For the demo, <span className="font-mono">wiz.io</span> is fully derived. Other URLs will
          use a similar pipeline with mock data.
        </div>
      </form>
    </motion.div>
  );
}

// ===== Step 2: Deriving (animated pipeline) =====
const DERIVATION_AGENTS = [
  { id: 'corporate', label: 'Corporate Linkage', desc: 'Resolving entity + HQ + parent structure', icon: Building2, durationMs: 1400 },
  { id: 'products', label: 'Product Inference', desc: 'Reading site copy to extract products + pain points', icon: Target, durationMs: 1800 },
  { id: 'spend', label: 'HG Spend Mapping', desc: 'Mapping products to HG IT spend categories', icon: DollarSign, durationMs: 1200 },
  { id: 'intent', label: 'Intent Lookup', desc: 'Pulling HG intent topics aligned to your product', icon: Cpu, durationMs: 1300 },
  { id: 'competitors', label: 'Competitor Discovery', desc: 'Finding HG products + vendors in your competitive landscape', icon: Swords, durationMs: 1500 },
  { id: 'icp', label: 'ICP Synthesis', desc: 'Industries + geos + revenue/employee bands + tech stack', icon: Globe2, durationMs: 1400 },
  { id: 'buying', label: 'Buying Committee', desc: 'Identifying buyer roles + influence per product category', icon: UsersIcon, durationMs: 1100 },
];

function StepDeriving({ form, onNext }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [completedIds, setCompletedIds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    let cumulativeDelay = 600;
    DERIVATION_AGENTS.forEach((agent, i) => {
      setTimeout(() => {
        if (cancelled) return;
        setActiveIdx(i);
      }, cumulativeDelay);
      cumulativeDelay += agent.durationMs;
      setTimeout(() => {
        if (cancelled) return;
        setCompletedIds((prev) => [...prev, agent.id]);
      }, cumulativeDelay - 100);
    });
    setTimeout(() => {
      if (!cancelled) onNext();
    }, cumulativeDelay + 500);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      key="deriving"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-2xl"
    >
      <div className="text-center mb-6">
        <div className="text-[11px] uppercase tracking-wider text-primary font-bold mb-2 inline-flex items-center gap-1.5">
          <Sparkles size={11} className="animate-pulse" /> Reading {form.url}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Building your tenant…</h1>
        <p className="text-sm text-text-secondary">
          7 Phoenix agents reading your site, SEC filings, and HG's graph. ~12 seconds.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-lg p-3 shadow-card space-y-1.5">
        {DERIVATION_AGENTS.map((a, i) => {
          const isDone = completedIds.includes(a.id);
          const isActive = activeIdx === i && !isDone;
          const isQueued = !isDone && !isActive;
          const Icon = a.icon;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: isQueued ? 0.4 : 1 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md border transition-colors ${
                isActive
                  ? 'border-primary/40 bg-primary/[0.04]'
                  : isDone
                  ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
                  : 'border-border bg-bg/30'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                  isDone ? 'bg-emerald-500/15' : isActive ? 'bg-primary/15' : 'bg-text-muted/10'
                }`}
              >
                {isDone ? (
                  <Check size={13} className="text-emerald-700 dark:text-emerald-300" />
                ) : isActive ? (
                  <Loader2 size={13} className="text-primary animate-spin" />
                ) : (
                  <Icon size={13} className="text-text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-text-primary">{a.label}</div>
                <div className="text-[11px] text-text-secondary leading-snug">{a.desc}</div>
              </div>
              <div className="text-[10px] font-mono text-text-muted">
                {isDone ? 'done' : isActive ? 'running…' : 'queued'}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ===== Step 3: Confirm =====
function ChipSection({ icon: Icon, label, count, children, accent = 'text-text-muted', accentBg = 'bg-text-muted/15' }) {
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-5 h-5 rounded ${accentBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={11} className={accent} />
        </div>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">{label}</span>
        {count != null && <span className="text-[10px] text-text-muted">{count}</span>}
      </div>
      {children}
    </div>
  );
}

function Chip({ children, sub }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded text-[11px] font-medium">
      {children}
      {sub && <span className="text-text-muted font-normal text-[10px]">· {sub}</span>}
    </span>
  );
}

function StepConfirm({ tenant, form, onConfirm }) {
  return (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="w-full max-w-4xl"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-bold">
          <Check size={11} /> Tenant built · {DERIVATION_AGENTS.length} agents ran
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">{tenant.name}</h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          Review the derived profile below. Everything is editable — chips can be removed, added,
          or refined later in Admin.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <ChipSection icon={Target} label="Products" count={tenant.products.length} accent="text-primary" accentBg="bg-primary/15">
          <div className="flex flex-wrap gap-1.5">
            {tenant.products.map((p) => (
              <Chip key={p.id} sub={p.category}>{p.name}</Chip>
            ))}
          </div>
        </ChipSection>
        <ChipSection icon={Lightbulb} label="Pain Points" count={tenant.painPoints.length} accent="text-amber-700 dark:text-amber-300" accentBg="bg-amber-500/15">
          <div className="space-y-1">
            {tenant.painPoints.slice(0, 3).map((p, i) => (
              <div key={i} className="text-[11px] text-text-secondary leading-snug">
                <span className="text-amber-700 dark:text-amber-300 mr-1">•</span>
                {p.statement}
              </div>
            ))}
          </div>
        </ChipSection>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <ChipSection icon={DollarSign} label="Spend Categories (HG)" count={tenant.spendCategories.length} accent="text-blue-700 dark:text-blue-300" accentBg="bg-blue-500/15">
          <div className="flex flex-wrap gap-1.5">
            {tenant.spendCategories.map((s) => (
              <Chip key={s.hgId} sub={s.relevance}>{s.name}</Chip>
            ))}
          </div>
        </ChipSection>
        <ChipSection icon={Cpu} label="Intent Topics (HG)" count={tenant.intentTopics.length} accent="text-purple-700 dark:text-purple-300" accentBg="bg-purple-500/15">
          <div className="flex flex-wrap gap-1.5">
            {tenant.intentTopics.slice(0, 8).map((t) => (
              <Chip key={t.hgId}>{t.name}</Chip>
            ))}
            {tenant.intentTopics.length > 8 && (
              <span className="text-[10px] text-text-muted px-1.5 py-0.5">+{tenant.intentTopics.length - 8} more</span>
            )}
          </div>
        </ChipSection>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <ChipSection icon={Swords} label="Competitors" count={tenant.competitors.length} accent="text-rose-700 dark:text-rose-300" accentBg="bg-rose-500/15">
          <div className="space-y-1">
            {tenant.competitors.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-[11px]">
                <span className="text-text-primary font-medium">{c.name}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-rose-700 dark:text-rose-300">{c.threat}</span>
              </div>
            ))}
          </div>
        </ChipSection>
        <ChipSection icon={UsersIcon} label="Buying Committee" count={tenant.buyingCommittee.length} accent="text-emerald-700 dark:text-emerald-300" accentBg="bg-emerald-500/15">
          <div className="space-y-1">
            {tenant.buyingCommittee.map((m, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-text-primary font-medium">{m.role}</span>
                <span className="text-[10px] uppercase tracking-wider text-text-muted">{m.influence}</span>
              </div>
            ))}
          </div>
        </ChipSection>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <ChipSection icon={Globe2} label="ICP" accent="text-primary" accentBg="bg-primary/15">
          <div className="space-y-2">
            <div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Industries</div>
              <div className="flex flex-wrap gap-1">
                {tenant.icp.industries.map((i) => <Chip key={i.hgId} sub={`${(i.weight * 100).toFixed(0)}%`}>{i.name}</Chip>)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Geography</div>
              <div className="flex flex-wrap gap-1">
                {tenant.icp.geos.map((g) => <Chip key={g.id} sub={`${(g.weight * 100).toFixed(0)}%`}>{g.name}</Chip>)}
              </div>
            </div>
            <div className="flex gap-3 text-[11px] text-text-secondary">
              <span><strong className="text-text-primary">Revenue:</strong> {tenant.icp.revenueBand.low}–{tenant.icp.revenueBand.high}</span>
              <span><strong className="text-text-primary">Employees:</strong> {tenant.icp.employeeBand.low}–{tenant.icp.employeeBand.high}</span>
            </div>
            <div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Tech stack signal</div>
              <div className="flex flex-wrap gap-1">
                {tenant.icp.techStack.map((t) => <Chip key={t.id}>{t.name}</Chip>)}
              </div>
            </div>
          </div>
        </ChipSection>
        <div className="space-y-3">
          <ChipSection icon={Handshake} label="Partners" count={tenant.partners.length} accent="text-cyan-700 dark:text-cyan-300" accentBg="bg-cyan-500/15">
            <div className="flex flex-wrap gap-1.5">
              {tenant.partners.map((p) => <Chip key={p.name} sub={p.type}>{p.name}</Chip>)}
            </div>
          </ChipSection>
          <ChipSection icon={Building2} label="Firmographics" accent="text-text-secondary" accentBg="bg-text-muted/15">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span className="text-text-muted">Headcount:</span> <span className="text-text-primary font-medium">{tenant.fai.headcount}</span></div>
              <div><span className="text-text-muted">Revenue:</span> <span className="text-text-primary font-medium">{tenant.fai.revenue}</span></div>
              <div><span className="text-text-muted">HQ:</span> <span className="text-text-primary font-medium">{tenant.fai.hq}</span></div>
              <div><span className="text-text-muted">Stage:</span> <span className="text-text-primary font-medium">{tenant.fai.stage}</span></div>
            </div>
          </ChipSection>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="text-[11px] text-text-muted">
          <Sparkles size={9} className="inline text-primary mr-1" />
          Edit any field later in Admin · Workflows pre-fill from this profile
        </div>
        <button
          onClick={onConfirm}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm rounded-md hover:bg-primary-dim transition-colors font-medium"
        >
          Confirm offerings <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}


// ===== Main route =====
export default function SignupFlow() {
  const navigate = useNavigate();
  const { upsertTenant, seedFromFixture, tenants } = useTenant();
  const { switchPersona } = usePersona();

  const [step, setStep] = useState('landing'); // landing → deriving → confirm → offerings → plays
  const [form, setForm] = useState({ url: 'wiz.io', name: 'Alex Chen', role: 'Account Executive' });
  const [resolvedTenant, setResolvedTenant] = useState(null);
  const [confirmedOfferings, setConfirmedOfferings] = useState([]);
  const advancingRef = useRef(false);

  const handleLanding = ({ url, name, role }) => {
    setForm({ url, name, role });
    setStep('deriving');
  };

  const handleDerivingComplete = () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    const matched = matchTenantByUrl(form.url) || WIZ_TENANT;
    const seeded = seedFromFixture(matched.id) || matched;
    setResolvedTenant(seeded);
    setStep('confirm');
  };

  const handleTenantConfirm = () => {
    setStep('offerings');
  };

  const handleOfferingsConfirm = (offerings) => {
    // Persist the wizard-confirmed offerings into the unified config store.
    // From here, /admin/offerings, the scoring model builder, and the wizard
    // all read from the same source of truth.
    if (offerings.length > 0) {
      replaceOfferings(offerings);
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          'rgi-onboarding-confirmed-offerings',
          JSON.stringify({
            confirmedAt: new Date().toISOString(),
            offeringIds: offerings.map((o) => o.id),
          })
        );
      } catch {
        // localStorage quota — ignore for the prototype
      }
    }
    setConfirmedOfferings(offerings);
    setStep('plays');
  };

  const handlePlaysConfirm = (activatedPlays) => {
    // Persist activated plays into the unified config store. /admin/plays
    // and the workbook chip rail both read from here.
    activatedPlays.forEach((play) =>
      upsertPlay({
        ...play,
        status: 'active',
        confirmed: true,
        offering_id: play.offerings?.[0] || play.offering_id, // legacy compat
      }),
    );

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          'rgi-onboarding-activated-plays',
          JSON.stringify({
            confirmedAt: new Date().toISOString(),
            playIds: activatedPlays.map((p) => p.id),
          })
        );
      } catch {
        // ignore
      }
    }

    // Switch to the role-appropriate persona and land in the workbench. Per
    // the new frictionless-signup architecture, scoring + integrations +
    // teams + agents + sellers all become a post-landing setup checklist.
    const role = (form.role || '').toLowerCase();
    const targetPersona = role.includes('revops') || role.includes('admin') ? 'priya' : 'alex';
    switchPersona(targetPersona);
    navigate('/workbook');
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-10">
      <AnimatePresence mode="wait">
        {step === 'landing' && <StepLanding key="landing" onNext={handleLanding} defaults={form} />}
        {step === 'deriving' && (
          <StepDeriving key="deriving" form={form} onNext={handleDerivingComplete} />
        )}
        {step === 'confirm' && resolvedTenant && (
          <StepConfirm key="confirm" tenant={resolvedTenant} form={form} onConfirm={handleTenantConfirm} />
        )}
        {step === 'offerings' && resolvedTenant && (
          <StepOfferings
            key="offerings"
            tenant={resolvedTenant}
            onConfirm={handleOfferingsConfirm}
            onBack={() => setStep('confirm')}
          />
        )}
        {step === 'plays' && (
          <StepPlays
            key="plays"
            confirmedOfferings={confirmedOfferings}
            onConfirm={handlePlaysConfirm}
            onBack={() => setStep('offerings')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
