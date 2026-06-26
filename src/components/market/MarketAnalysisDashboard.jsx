import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Sparkles,
  TrendingUp,
  Building2,
  Globe,
  DollarSign,
  Target,
  Swords,
  Lightbulb,
  Boxes,
  Handshake,
  Crosshair,
  Map as MapIcon,
  Users,
} from 'lucide-react';
import { listOfferings } from '../../data/offerings.js';
import { MARKET_GOALS_BY_ID } from '../../data/marketGoals.js';

// ─── Market Analysis Dashboard ──────────────────────────────────────
//
// A full-screen, read-only analytics view over the companies currently
// in the Companies table (post-filter). Computes firmographic
// distributions and layers an "AI analysis" that reasons about the set
// through the lens of the ICP (active filters / scoring) and the
// tenant's products (Wiz offerings) — product alignment, competitive
// displacement, and recommended next moves.
//
// Everything here is derived from the passed-in company set, so the
// dashboard always reflects whatever the chat or filters produced.

function parseNum(s) {
  const m = String(s || '').match(/([\d.]+)\s*([KMBT])?/i);
  if (!m) return 0;
  const n = parseFloat(m[1]) || 0;
  const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[(m[2] || '').toUpperCase()] || 1;
  return n * mult;
}

function fmtMoney(n) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

const INDUSTRY_BUCKETS = [
  { label: 'Financial Svcs', keys: ['financial', 'banking', 'bnpl'] },
  { label: 'Insurance', keys: ['insurance'] },
  { label: 'Healthcare / Pharma', keys: ['health', 'pharmaceutical', 'life science'] },
  { label: 'Tech / Software', keys: ['computer', 'electronic', 'software', 'internet', 'semiconductor'] },
  { label: 'Manufacturing', keys: ['manufacturing'] },
  { label: 'Retail', keys: ['retail'] },
  { label: 'Telecom / Media', keys: ['telecom', 'media', 'entertainment'] },
];

function regionOf(hq) {
  const s = String(hq || '').toLowerCase();
  if (/(ireland|london|england|united kingdom|germany|berlin|munich|france|paris|amsterdam|madrid|zurich)/.test(s))
    return 'Europe';
  if (/(singapore|tokyo|japan|bangalore|mumbai|delhi|india|sydney|melbourne|australia|hong kong|seoul)/.test(s))
    return 'APAC';
  if (/(toronto|vancouver|ottawa|canada)/.test(s)) return 'Canada';
  return 'United States';
}

function Bars({ data, unit, accent = false }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((d) => {
        const isTop = d.value === max;
        // The dominant bar is emphasized; in a goal-focused block the
        // whole chart shifts to the accent colour.
        const barClass = accent
          ? isTop
            ? 'bg-primary'
            : 'bg-primary/45'
          : isTop
          ? 'bg-primary/80'
          : 'bg-primary/30';
        return (
          <div key={d.label} className="flex items-center gap-3">
            <span className={`text-[11px] w-32 truncate flex-shrink-0 ${isTop ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
              {d.label}
            </span>
            <div className="flex-1 h-4 bg-surface-2 rounded overflow-hidden">
              <div
                className={`h-full rounded transition-all duration-500 ${barClass}`}
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
            <span className={`text-[11px] font-mono w-14 text-right flex-shrink-0 ${isTop ? 'text-text-primary' : 'text-text-muted'}`}>
              {unit === 'money' ? fmtMoney(d.value) : d.value.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Panel({ icon: Icon, title, children, hint, focus = false, insight }) {
  return (
    <div
      className={`rounded-lg p-4 border transition-colors ${
        focus ? 'border-primary/40 bg-primary/[0.04] ring-1 ring-primary/15' : 'border-border bg-surface'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`grid place-items-center w-6 h-6 rounded-md flex-shrink-0 ${
            focus ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
          }`}
        >
          <Icon size={13} />
        </span>
        <div className="text-[13px] font-semibold text-text-primary">{title}</div>
        {focus ? (
          <span className="ml-auto text-[9px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
            Goal focus
          </span>
        ) : (
          hint && <span className="ml-auto text-[10px] text-text-muted">{hint}</span>
        )}
      </div>
      {children}
      {insight && (
        <div className="mt-2.5 pt-2 border-t border-border/50 flex items-start gap-1.5 text-[11px] text-text-secondary leading-snug">
          <Sparkles size={10} className="text-primary flex-shrink-0 mt-0.5" />
          <span>{insight}</span>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, sub }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">{label}</div>
      <div className="text-xl font-semibold text-text-primary mt-0.5">{value}</div>
      {sub && <div className="text-[11px] text-text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

// Build the goal-specific AI analysis: a headline read plus three cards.
// Everything is derived from the computed stats so it tracks the data.
function buildGoalAnalysis(goalId, { a, productFit, competitors, detail }) {
  const top = a.industry[0]?.label || 'your top sector';
  const topVal = a.industry[0]?.value || 0;
  const second = a.industry[1]?.label;
  const partner = detail || 'a complementary vendor';
  const netNew = Math.round(a.n * 0.78);

  switch (goalId) {
    case 'competitor':
      return {
        headline: `Incumbents are most entrenched in ${top.toLowerCase()} (${topVal} of ${a.n}). With ${a.enterprisePct}% of the set enterprise and ${fmtMoney(a.avgSpend)} average IT spend, there's budget to fund a rip-and-replace — lead with time-to-value.`,
        cards: [
          { icon: Swords, title: 'Incumbent exposure', type: 'chips', content: competitors, note: 'Most likely installed across this set:' },
          {
            icon: DollarSign,
            title: 'Displacement economics',
            type: 'bullets',
            content: [
              `${a.enterprise} enterprise accounts carry the budget (${fmtMoney(a.avgSpend)} avg).`,
              `${a.regulated} regulated accounts — compliance pressure accelerates replacement.`,
              `Lead competitive deals on fastest proven time-to-value.`,
            ],
          },
          {
            icon: Lightbulb,
            title: 'Win themes',
            type: 'bullets',
            content: ['Agentless coverage vs. agent sprawl', 'Unified platform vs. point tools', `Displacement references in ${top}`],
          },
        ],
      };
    case 'partnership':
      return {
        headline: `A partnership with ${partner} would extend reach into ${top.toLowerCase()} — your densest sector (${topVal} accounts). Joint focus pays off across the ${a.enterprise} enterprise accounts where integrated stacks win.`,
        cards: [
          {
            icon: Handshake,
            title: 'Complementary fit',
            type: 'bullets',
            content: [
              `${partner} + Wiz cover adjacent layers — joint accounts get end-to-end coverage.`,
              `${a.regulated} regulated accounts value a single, audited, integrated stack.`,
            ],
          },
          {
            icon: Crosshair,
            title: 'Co-sell targets',
            type: 'bullets',
            content: [
              `${a.enterprise} enterprise accounts are the strongest joint targets.`,
              `${top} is the densest shared sector (${topVal} accounts).`,
            ],
          },
          {
            icon: Lightbulb,
            title: 'Partnership motions',
            type: 'bullets',
            content: [`Stand up a marketplace / integration listing`, `Run a joint GTM play into ${top}`, `Align on shared displacement targets`],
          },
        ],
      };
    case 'whitespace':
      return {
        headline: `Of ${a.n} accounts in view, roughly ${netNew.toLocaleString()} are net-new whitespace not yet in your book. ${top} carries the most uncovered logos${second ? `, followed by ${second.toLowerCase()}` : ''}.`,
        cards: [
          {
            icon: MapIcon,
            title: 'Coverage gaps',
            type: 'bullets',
            content: [
              `~${netNew.toLocaleString()} net-new logos (~78%) sit outside CRM coverage.`,
              `${top}${second ? ` and ${second.toLowerCase()}` : ''} are the densest gaps.`,
            ],
          },
          {
            icon: Boxes,
            title: 'Net-new by sector',
            type: 'list',
            content: a.industry.slice(0, 4).map((b) => ({
              name: b.label,
              meta: Math.round(b.value * 0.78).toLocaleString(),
              sub: 'est. net-new logos',
            })),
          },
          {
            icon: Lightbulb,
            title: 'Recommended next moves',
            type: 'bullets',
            content: ['Save as a whitespace segment', 'Route owners via Territory Design', 'Push net-new logos to CRM'],
          },
        ],
      };
    case 'outreach':
      return {
        headline: `Prioritizing ${a.n} accounts for outreach: ${a.enterprise} are enterprise with real budget (${fmtMoney(a.avgSpend)} avg spend), and ${top} is the richest vein (${topVal} accounts). Work the highest-spend, highest-fit accounts first.`,
        cards: [
          {
            icon: Target,
            title: 'Priority accounts',
            type: 'list',
            content: a.spenders.slice(0, 5).map((s) => ({ name: s.label, meta: fmtMoney(s.value), sub: 'IT spend' })),
          },
          {
            icon: TrendingUp,
            title: 'Scoring signals',
            type: 'bullets',
            content: [`Enterprise (${a.enterprise}) — budget exists`, 'High IT spend — tooling appetite', `${a.regulated} regulated — compliance urgency`],
          },
          {
            icon: Lightbulb,
            title: 'Sequencing',
            type: 'bullets',
            content: ['Tier 1: enterprise + high spend → exec outreach', 'Tier 2: mid-market → automated cadence', 'Apply a scoring profile to rank fit'],
          },
        ],
      };
    case 'product-market':
    default:
      return {
        headline: `This set skews ${top.toLowerCase()} (${topVal} of ${a.n}) and is ${a.enterprisePct}% enterprise, carrying ${fmtMoney(a.totalSpend)} in combined IT spend.${a.regulated > 0 ? ` ${a.regulated} accounts sit in regulated sectors — strong pull toward posture + data-security controls.` : ''}`,
        cards: [
          {
            icon: Boxes,
            title: 'Product alignment',
            type: 'list',
            content: productFit.map((p) => ({ name: p.name, meta: p.addressable.toLocaleString(), sub: p.why })),
          },
          { icon: Swords, title: 'Displacement targets', type: 'chips', content: competitors, note: 'Incumbents to lead against:' },
          {
            icon: Lightbulb,
            title: 'Where to play',
            type: 'bullets',
            content: [
              `Carve ${top} into a focused ICP segment.`,
              `Prioritize the ${a.enterprise} enterprise accounts — budget exists.`,
              'Push the shortlist to Sales Co-Pilot with a tailored sequence.',
            ],
          },
        ],
      };
  }
}

function AnalysisCard({ card }) {
  const Icon = card.icon;
  return (
    <div className="bg-surface border border-border rounded-lg p-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} className="text-primary" />
        <span className="text-[12px] font-semibold text-text-primary">{card.title}</span>
      </div>
      {card.note && <p className="text-[11.5px] text-text-muted leading-snug mb-2">{card.note}</p>}
      {card.type === 'list' && (
        <div className="space-y-2">
          {card.content.map((p) => (
            <div key={p.name} className="text-[11.5px] leading-snug">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text-primary truncate">{p.name}</span>
                <span className="font-mono text-text-muted flex-shrink-0 ml-2">{p.meta}</span>
              </div>
              {p.sub && <div className="text-text-muted">{p.sub}</div>}
            </div>
          ))}
        </div>
      )}
      {card.type === 'chips' && (
        <div className="flex flex-wrap gap-1">
          {card.content.map((c) => (
            <span key={c} className="text-[10.5px] px-2 py-0.5 rounded-full border border-border bg-bg/50 text-text-secondary">
              {c}
            </span>
          ))}
        </div>
      )}
      {card.type === 'bullets' && (
        <ul className="space-y-1.5 text-[11.5px] text-text-secondary leading-snug list-disc pl-4">
          {card.content.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MarketAnalysisDashboard({
  open,
  onClose,
  companies = [],
  filters = [],
  appliedProfile,
  goals = [],
  goal,
  goalDetail,
  onGoalChange,
}) {
  const [goalId, setGoalId] = useState(goal);
  useEffect(() => {
    if (goal) setGoalId(goal);
  }, [goal]);
  const changeGoal = (id) => {
    setGoalId(id);
    onGoalChange?.(id);
  };
  const a = useMemo(() => {
    const rows = companies;
    const n = rows.length || 1;

    const industry = INDUSTRY_BUCKETS.map((b) => ({
      label: b.label,
      value: rows.filter((r) => b.keys.some((k) => String(r.industry || '').toLowerCase().includes(k))).length,
    }))
      .filter((b) => b.value > 0)
      .sort((x, y) => y.value - x.value);

    const revBand = (lo, hi) =>
      rows.filter((r) => {
        const v = parseNum(r.fai?.revenue);
        return v >= lo && v < hi;
      }).length;
    const revenue = [
      { label: '< $1B', value: revBand(0, 1e9) },
      { label: '$1B – $10B', value: revBand(1e9, 1e10) },
      { label: '$10B – $50B', value: revBand(1e10, 5e10) },
      { label: '$50B+', value: revBand(5e10, Infinity) },
    ].filter((b) => b.value > 0);

    const empBand = (lo, hi) =>
      rows.filter((r) => {
        const v = parseNum(r.fai?.employees);
        return v >= lo && v < hi;
      }).length;
    const employees = [
      { label: '< 1K', value: empBand(0, 1e3) },
      { label: '1K – 10K', value: empBand(1e3, 1e4) },
      { label: '10K – 50K', value: empBand(1e4, 5e4) },
      { label: '50K+', value: empBand(5e4, Infinity) },
    ].filter((b) => b.value > 0);

    const geoMap = {};
    rows.forEach((r) => {
      const g = regionOf(r.fai?.hq);
      geoMap[g] = (geoMap[g] || 0) + 1;
    });
    const geography = Object.entries(geoMap)
      .map(([label, value]) => ({ label, value }))
      .sort((x, y) => y.value - x.value);

    const spenders = [...rows]
      .map((r) => ({ label: r.name, value: parseNum(r.itSpend) }))
      .sort((x, y) => y.value - x.value)
      .slice(0, 6);

    const totalSpend = rows.reduce((s, r) => s + parseNum(r.itSpend), 0);
    const enterprise = rows.filter((r) => parseNum(r.fai?.revenue) >= 1e9).length;
    const enterprisePct = Math.round((enterprise / n) * 100);
    const avgSpend = totalSpend / n;

    return {
      n: rows.length,
      industry,
      revenue,
      employees,
      geography,
      spenders,
      totalSpend,
      enterprise,
      enterprisePct,
      avgSpend,
      regulated: rows.filter((r) =>
        ['financial', 'banking', 'insurance', 'health', 'pharmaceutical'].some((k) =>
          String(r.industry || '').toLowerCase().includes(k),
        ),
      ).length,
      cloudNative: rows.filter((r) =>
        ['computer', 'electronic', 'software', 'internet', 'semiconductor'].some((k) =>
          String(r.industry || '').toLowerCase().includes(k),
        ),
      ).length,
    };
  }, [companies]);

  const offerings = useMemo(() => listOfferings().filter((o) => o.id !== 'all'), []);
  const competitors = useMemo(() => {
    // Pull competitor names off each offering (legacy strings + new schema).
    const set = new Set();
    offerings.forEach((o) => {
      (o.competitors || []).forEach((c) => set.add(typeof c === 'string' ? c : c.name || c.vendor));
    });
    return [...set].filter(Boolean).slice(0, 8);
  }, [offerings]);

  // Heuristic product-alignment scoring for the AI narrative.
  const productFit = useMemo(() => {
    const map = {
      cnapp: { addressable: a.n, why: 'every cloud-operating account is a posture + runtime candidate' },
      ciem: { addressable: a.enterprise, why: 'large orgs carry the most identity sprawl and over-permissioned access' },
      dspm: { addressable: a.regulated, why: 'regulated finance & healthcare carry sensitive-data exposure' },
      workload: { addressable: a.cloudNative, why: 'tech & software run the most containerized workloads' },
    };
    return offerings.map((o) => ({
      id: o.id,
      name: o.name,
      addressable: map[o.id]?.addressable ?? a.n,
      why: map[o.id]?.why || 'broadly applicable across the set',
    }));
  }, [offerings, a]);

  const filterSummary = filters.length
    ? filters.map((f) => f.label + (f.displayValue ? ` (${f.displayValue})` : '')).join(' · ')
    : 'Full universe — no filters applied';

  const analysis = useMemo(
    () => buildGoalAnalysis(goalId, { a, productFit, competitors, detail: goalDetail }),
    [goalId, a, productFit, competitors, goalDetail],
  );
  const goalLabel = MARKET_GOALS_BY_ID[goalId]?.label || 'Market analysis';

  // Similarity profiles — cluster the set by the descriptive dimensions
  // NOT already constrained by the active filters, so the ranking adds
  // new signal instead of echoing the filters.
  const profiles = useMemo(() => {
    const excluded = new Set();
    filters.forEach((f) => {
      if (f.specId === 'industry') excluded.add('industry');
      if (f.specId === 'emp_count') excluded.add('size');
      if (f.specId === 'geography') excluded.add('region');
    });
    const sizeTier = (c) => {
      const e = parseNum(c.fai?.employees);
      if (e >= 50000) return 'Enterprise';
      if (e >= 10000) return 'Large';
      if (e >= 1000) return 'Mid-market';
      return 'SMB';
    };
    const indLabel = (c) => {
      const s = String(c.industry || '').toLowerCase();
      const b = INDUSTRY_BUCKETS.find((bk) => bk.keys.some((k) => s.includes(k)));
      return b ? b.label : 'Other sectors';
    };
    const counts = {};
    companies.forEach((c) => {
      const dims = [];
      if (!excluded.has('size')) dims.push(sizeTier(c));
      if (!excluded.has('industry')) dims.push(indLabel(c));
      if (!excluded.has('region')) dims.push(regionOf(c.fai?.hq));
      const label = dims.slice(0, 2).join(' · ') || 'Diverse mix';
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((x, y) => y.value - x.value)
      .slice(0, 5);
  }, [companies, filters]);

  const profileHeadline = (() => {
    if (!profiles.length) return '';
    const names = profiles.slice(0, 3).map((p) => `${p.label} (${p.value})`);
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.slice(-1)}` : names[0];
    return `Most companies in this market are ${list}.`;
  })();

  // Goal-driven highlighting + a one-line insight per chart block.
  const FOCUS_BY_GOAL = {
    'product-market': ['industry', 'revenue'],
    competitor: ['industry', 'itspend'],
    partnership: ['industry', 'geography'],
    whitespace: ['industry', 'geography'],
    outreach: ['itspend', 'icpfit'],
  };
  const focus = new Set(FOCUS_BY_GOAL[goalId] || []);
  const pct = (x) => Math.round((x / (a.n || 1)) * 100);
  const largeShare = a.employees
    .filter((b) => b.label === '10K – 50K' || b.label === '50K+')
    .reduce((s, b) => s + b.value, 0);
  const insights = {
    industry: a.industry[0] ? `${a.industry[0].label} leads at ${pct(a.industry[0].value)}% of the set.` : null,
    revenue: `${a.enterprisePct}% clear $1B in revenue — capital to fund new tooling.`,
    size: `${pct(largeShare)}% run 10K+ employees.`,
    geography: a.geography[0] ? `${pct(a.geography[0].value)}% are HQ'd in ${a.geography[0].label}.` : null,
    itspend: a.spenders[0] ? `${a.spenders[0].label} leads IT spend at ${fmtMoney(a.spenders[0].value)}.` : null,
    icpfit: `${a.regulated} regulated · ${a.cloudNative} cloud-native · ${a.enterprise} enterprise.`,
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 12, scale: 0.98 }}
            transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl max-h-[92vh] bg-bg border border-border rounded-xl shadow-elev overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4 bg-surface/60 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <Sparkles size={18} />
                </span>
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-text-primary">Market Analysis</div>
                  <div className="text-[12px] text-text-muted truncate">
                    {a.n.toLocaleString()} companies · {filterSummary}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {goals.length > 0 && (
                  <label className="flex items-center gap-1.5">
                    <span className="text-[11px] text-text-muted">Goal</span>
                    <select
                      value={goalId}
                      onChange={(e) => changeGoal(e.target.value)}
                      className="text-[12px] font-medium px-2 py-1.5 rounded-md border border-border bg-surface text-text-primary focus:outline-none focus:border-primary max-w-[220px]"
                    >
                      {goals.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Companies" value={a.n.toLocaleString()} sub="in current view" />
                <Kpi label="Total IT spend" value={fmtMoney(a.totalSpend)} sub={`avg ${fmtMoney(a.avgSpend)} / account`} />
                <Kpi label="Enterprise ($1B+)" value={`${a.enterprisePct}%`} sub={`${a.enterprise.toLocaleString()} accounts`} />
                <Kpi
                  label="Scoring lens"
                  value={appliedProfile ? appliedProfile.name.split(' ').slice(0, 2).join(' ') : 'None'}
                  sub={appliedProfile ? 'fit profile applied' : 'apply one to rank fit'}
                />
              </div>

              {/* Main profiles — similarity ranking */}
              <div className="border border-primary/30 bg-primary/[0.04] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="grid place-items-center w-6 h-6 rounded-md bg-primary text-white flex-shrink-0">
                    <Users size={13} />
                  </span>
                  <span className="text-[13px] font-semibold text-text-primary">Main profiles</span>
                  <span className="ml-auto text-[10px] text-text-muted">ranked by similarity</span>
                </div>
                <p className="text-[12.5px] text-text-secondary leading-relaxed mb-3">{profileHeadline}</p>
                <Bars data={profiles} accent />
              </div>

              {/* Charts — goal-aware highlighting + per-block insight */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Panel icon={Building2} title="Industry mix" hint={`${a.industry.length} sectors`} focus={focus.has('industry')} insight={insights.industry}>
                  <Bars data={a.industry} accent={focus.has('industry')} />
                </Panel>
                <Panel icon={DollarSign} title="Revenue distribution" focus={focus.has('revenue')} insight={insights.revenue}>
                  <Bars data={a.revenue} accent={focus.has('revenue')} />
                </Panel>
                <Panel icon={Boxes} title="Company size (employees)" focus={focus.has('size')} insight={insights.size}>
                  <Bars data={a.employees} accent={focus.has('size')} />
                </Panel>
                <Panel icon={Globe} title="HQ geography" focus={focus.has('geography')} insight={insights.geography}>
                  <Bars data={a.geography} accent={focus.has('geography')} />
                </Panel>
                <Panel icon={TrendingUp} title="IT spend leaders" hint="top 6" focus={focus.has('itspend')} insight={insights.itspend}>
                  <Bars data={a.spenders} unit="money" accent={focus.has('itspend')} />
                </Panel>
                <Panel icon={Target} title="ICP fit signal" focus={focus.has('icpfit')} insight={insights.icpfit}>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-text-secondary">Regulated industries</span>
                      <span className="font-mono text-text-primary">{a.regulated.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-text-secondary">Cloud-native / tech</span>
                      <span className="font-mono text-text-primary">{a.cloudNative.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-text-secondary">Enterprise ($1B+)</span>
                      <span className="font-mono text-text-primary">{a.enterprise.toLocaleString()}</span>
                    </div>
                  </div>
                </Panel>
              </div>

              {/* AI analysis — tailored to the selected goal */}
              <div className="border border-primary/30 bg-primary/[0.04] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-primary" />
                  <span className="text-[13px] font-semibold text-text-primary">AI analysis</span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {goalLabel}
                  </span>
                </div>

                <p className="text-[13px] text-text-secondary leading-relaxed">{analysis.headline}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {analysis.cards.map((card) => (
                    <AnalysisCard key={card.title} card={card} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
