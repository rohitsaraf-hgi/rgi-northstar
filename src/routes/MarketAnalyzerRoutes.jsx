// Market Analyzer route components.
//
// One file by design — these are mostly thin list views over the seed data
// in src/data/marketAnalyzer.js. The product surface is large in production
// (filters, scoring builder, exports, prospecting hand-off) but for the
// RGI Northstar prototype we render the structural backbone:
//   - Projects list
//   - Segments list
//   - Companies (light search list)
//   - Scoring Profiles (NEW)
//   - Catalog stubs (Tech & Taxonomies, Saved Collections, Export History)
//
// Design follows the RGI Northstar tokens — same Tailwind utilities,
// DM Sans, lucide-react icons. Don't import HG Insights chrome.

import { Fragment, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Folder,
  Compass,
  List as ListIcon,
  Gauge,
  Layers,
  Bookmark,
  History,
  Plus,
  Search,
  Lock,
  Globe,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CornerDownRight,
  Sparkles,
  SlidersHorizontal,
  TrendingUp,
  GitBranch,
  Download,
  LayoutGrid,
  Rows3,
  MapPin,
  Building2,
  Users,
  DollarSign,
  X,
} from 'lucide-react';
import {
  listProjects,
  listSegments,
  listScoringProfiles,
  getScoringProfile,
  addSegment,
} from '../data/marketAnalyzer.js';
import {
  getMarketAnalyzerCompanies,
  MA_TOTAL_UNIVERSE,
} from '../data/marketAnalyzerCompanies.js';
import FilterPanel from '../components/workbook/FilterPanel.jsx';
import { FILTER_REGISTRY } from '../data/filterRegistry.js';

// ─── Shared layout helpers ──────────────────────────────────────────

function PageHeader({ title, subtitle, primaryCta }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-sm text-text-secondary mt-1 max-w-3xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {primaryCta}
    </div>
  );
}

function VisibilityBadge({ visibility }) {
  const isPublic = visibility === 'organization' || visibility === 'public';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
        isPublic
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
          : 'bg-text-muted/10 text-text-muted border border-border'
      }`}
      title={isPublic ? 'Visible to your organization' : 'Private to you'}
    >
      {isPublic ? <Globe size={9} /> : <Lock size={9} />}
      {isPublic ? 'Org' : 'Private'}
    </span>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 border-b border-border mb-4">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-3 py-2 text-xs uppercase tracking-wider font-semibold border-b-2 -mb-px transition-colors ${
            active === t.id
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Projects ───────────────────────────────────────────────────────

export function MarketAnalyzerProjectsRoute() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('mine');
  const all = listProjects();
  const filtered = tab === 'mine'
    ? all.filter((p) => p.ownerId === 'priya')
    : tab === 'organization'
    ? all.filter((p) => p.visibility === 'organization')
    : all;

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <PageHeader
        title="Projects"
        subtitle="Create and manage your TAM / SAM / SOM analyses. Each project holds one or more segments — filtered views of companies you've saved for ongoing work."
        primaryCta={
          <button
            onClick={() => window.alert('Create-project flow ships in the next iteration.')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim transition-colors"
          >
            <Plus size={12} /> Create project
          </button>
        }
      />
      <Tabs
        tabs={[
          { id: 'mine', label: 'My projects' },
          { id: 'organization', label: 'Organization' },
          { id: 'all', label: 'All' },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg/40 border-b border-border">
            <tr className="text-left text-[10px] uppercase tracking-wider text-text-muted font-semibold">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2 w-24">Visibility</th>
              <th className="px-4 py-2 w-28 text-right">Segments</th>
              <th className="px-4 py-2 w-28 text-right">Companies</th>
              <th className="px-4 py-2 w-28">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/market-analyzer/segments?project=${p.id}`)}
                className="border-b border-border/40 hover:bg-bg/40 cursor-pointer transition-colors"
              >
                <td className="px-4 py-2.5 text-text-primary font-medium">{p.name}</td>
                <td className="px-4 py-2.5 text-text-secondary text-[12px] max-w-md truncate">{p.description}</td>
                <td className="px-4 py-2.5">
                  <VisibilityBadge visibility={p.visibility} />
                </td>
                <td className="px-4 py-2.5 text-right text-text-secondary font-mono text-[12px]">{p.segmentCount}</td>
                <td className="px-4 py-2.5 text-right text-text-secondary font-mono text-[12px]">{p.companyCount.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-text-muted text-[11px]">{p.updatedAt}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted text-sm">
                  No projects in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Segments ───────────────────────────────────────────────────────

export function MarketAnalyzerSegmentsRoute() {
  const navigate = useNavigate();
  const segments = listSegments();
  const profiles = listScoringProfiles();

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <PageHeader
        title="Segments"
        subtitle="Saved company segments — filtered views you can rerun, share, and apply scoring profiles to."
      />
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg/40 border-b border-border">
            <tr className="text-left text-[10px] uppercase tracking-wider text-text-muted font-semibold">
              <th className="px-4 py-2">Segment</th>
              <th className="px-4 py-2">Project</th>
              <th className="px-4 py-2 w-32">Applied profile</th>
              <th className="px-4 py-2 w-28 text-right">Companies</th>
              <th className="px-4 py-2 w-28">Created</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((s) => {
              const profile = s.appliedProfileId ? getScoringProfile(s.appliedProfileId) : null;
              return (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/market-analyzer/segments/${s.id}`)}
                  className="border-b border-border/40 hover:bg-bg/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-2.5 align-top">
                    <div className="text-text-primary font-medium">{s.name}</div>
                    <div className="text-[11px] text-text-muted truncate max-w-md">{s.description}</div>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary text-[12px]">{s.projectName}</td>
                  <td className="px-4 py-2.5">
                    {profile ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                        <Gauge size={9} />
                        {profile.name}
                      </span>
                    ) : (
                      <span className="text-[10px] text-text-muted italic">None applied</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-secondary font-mono text-[12px]">
                    {s.companyCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-text-muted text-[11px]">{s.createdAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-[11px] text-text-muted max-w-3xl leading-relaxed">
        Click a segment to open the company list with the applied scoring profile. From the segment
        page you can also <span className="font-semibold text-text-secondary">add a profile</span>{' '}
        to score, then export or push the result to Sales Co-Pilot as a play audience.
      </div>
    </div>
  );
}

// ─── Segment Detail (light) ─────────────────────────────────────────

export function MarketAnalyzerSegmentDetailRoute() {
  const navigate = useNavigate();
  const { id } = useParams();
  const segment = listSegments().find((s) => s.id === id);
  const profiles = listScoringProfiles();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [appliedProfileId, setAppliedProfileId] = useState(segment?.appliedProfileId || null);
  const appliedProfile = appliedProfileId ? getScoringProfile(appliedProfileId) : null;

  if (!segment) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-16 text-center text-text-muted">
        <div className="text-base font-semibold text-text-primary mb-1">Segment not found</div>
        <button
          onClick={() => navigate('/market-analyzer/segments')}
          className="text-xs text-primary hover:underline"
        >
          Back to segments
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/market-analyzer/segments')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} /> Segments
      </button>
      <PageHeader
        title={segment.name}
        subtitle={segment.description}
      />

      <div className="bg-surface border border-border rounded-md p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Companies</div>
            <div className="text-xl font-semibold text-text-primary font-mono">
              {segment.companyCount.toLocaleString()}
            </div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Project</div>
            <div className="text-sm text-text-primary">{segment.projectName}</div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-md transition-colors ${
              appliedProfile
                ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/40'
                : 'bg-surface text-text-secondary border-border hover:border-primary/40'
            }`}
          >
            <Gauge size={11} />
            {appliedProfile ? `Profile: ${appliedProfile.name}` : 'Add scoring profile'}
            <ChevronDown size={10} />
          </button>
          {profileMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-bg border border-border rounded-md shadow-elev z-20">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-text-muted border-b border-border/60">
                Apply a scoring profile
              </div>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setAppliedProfileId(p.id);
                    setProfileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-surface-2 transition-colors ${
                    appliedProfileId === p.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="text-xs font-semibold text-text-primary">{p.name}</div>
                  <div className="text-[10px] text-text-muted leading-snug">{p.description}</div>
                </button>
              ))}
              <div className="border-t border-border/60">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/market-analyzer/scoring-profiles');
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-primary hover:bg-primary/5 inline-flex items-center gap-1"
                >
                  <Plus size={10} /> Create new profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface border border-dashed border-border rounded-md p-10 text-center text-text-muted">
        <Compass size={20} className="mx-auto mb-2 text-text-muted" />
        <div className="text-sm font-semibold text-text-primary mb-1">Company list preview</div>
        <p className="text-xs max-w-md mx-auto leading-relaxed">
          The full company table with applied scoring + filters renders here. For this prototype we
          stop at the segment shell — the structural piece engineering needs to scaffold the
          downstream company table against.
        </p>
      </div>
    </div>
  );
}

// ─── Companies ──────────────────────────────────────────────────────
//
// Alphabetical universe view over HG's company database. Mirrors the
// visual density + interactions of the Sales Co-Pilot Workbook (logo
// chip, subsidiary expand/collapse, sortable columns) but layers in the
// MA chrome from the production Market Analyzer:
//   - Segments / Companies breadcrumb
//   - "{N} organizations found of 38.8M" hint
//   - Filters + Save segment + Export
//   - LIST / MATRIX view toggle (LIST is the only implemented mode)
//   - Rows-per-page + paged footer
//
// Filters reuse the workbook FilterRegistry — same widget set, same
// predicates — so HG firmographic dimensions are available out of the
// box (employees, revenue, industry, geography, company type, intent,
// products, …).

const PAGE_SIZE_OPTIONS = [25, 50, 100];

// Sort spec: { key: 'name' | 'employees' | 'revenue' | 'hq' | 'industry'
//             | 'itSpend', dir: 'asc' | 'desc' }
function compareCompanies(a, b, sort) {
  const dir = sort.dir === 'desc' ? -1 : 1;
  const key = sort.key;
  if (key === 'name') {
    return dir * (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' });
  }
  if (key === 'industry') {
    return dir * (a.industry || '').localeCompare(b.industry || '', 'en', { sensitivity: 'base' });
  }
  if (key === 'hq') {
    return dir * (a.fai?.hq || '').localeCompare(b.fai?.hq || '', 'en', { sensitivity: 'base' });
  }
  if (key === 'employees') {
    return dir * (parseSuffixedNumber(a.fai?.employees) - parseSuffixedNumber(b.fai?.employees));
  }
  if (key === 'revenue') {
    return dir * (parseSuffixedNumber(a.fai?.revenue) - parseSuffixedNumber(b.fai?.revenue));
  }
  if (key === 'itSpend') {
    return dir * (parseSuffixedNumber(a.itSpend) - parseSuffixedNumber(b.itSpend));
  }
  return 0;
}

// "$162.4B" → 162400000000; "309K" → 309000. Null-safe.
function parseSuffixedNumber(s) {
  if (s == null || s === '') return 0;
  if (typeof s === 'number') return s;
  const m = String(s).match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (Number.isNaN(n)) return 0;
  const suffix = (m[2] || '').toUpperCase();
  if (suffix === 'K') return n * 1_000;
  if (suffix === 'M') return n * 1_000_000;
  if (suffix === 'B') return n * 1_000_000_000;
  return n;
}

function SortHeader({ label, sortKey, sort, onSort, align = 'left' }) {
  const active = sort.key === sortKey;
  const alignCls = align === 'right' ? 'justify-end text-right' : 'justify-start text-left';
  return (
    <th
      className={`text-[9px] uppercase tracking-wider font-semibold px-3 py-2 cursor-pointer select-none ${
        active ? 'text-text-primary' : 'text-text-muted'
      }`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`inline-flex items-center gap-1 ${alignCls} w-full`}>
        <span>{label}</span>
        {active && (
          sort.dir === 'asc' ? <ArrowUp size={9} /> : <ArrowDown size={9} />
        )}
      </div>
    </th>
  );
}

function SubsidiaryChip({ subsidiaries, expanded, onToggle }) {
  if (!Array.isArray(subsidiaries) || subsidiaries.length === 0) return null;
  const names = subsidiaries.map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border font-medium transition-colors ${
        expanded
          ? 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/50'
          : 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30 hover:bg-violet-500/20'
      }`}
      title={`Subsidiaries: ${names.join(', ')}`}
    >
      {expanded ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
      <GitBranch size={8} />
      +{names.length} {names.length === 1 ? 'subsidiary' : 'subsidiaries'}
    </button>
  );
}

function SaveSegmentModal({ open, onClose, onSave, filterCount, companyCount }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const projects = listProjects();
  const [projectId, setProjectId] = useState(projects[0]?.id || '');

  if (!open) return null;
  const canSave = name.trim().length > 0;
  const proj = projects.find((p) => p.id === projectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-[480px] max-w-[95vw] bg-bg border border-border rounded-md shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="text-sm font-semibold text-text-primary">Save as segment</div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded bg-primary/5 border border-primary/20 text-[11px] text-text-secondary">
            <Bookmark size={12} className="text-primary" />
            Saving{' '}
            <span className="font-mono font-semibold text-text-primary">
              {companyCount.toLocaleString()}
            </span>{' '}
            companies matched by{' '}
            <span className="font-mono font-semibold text-text-primary">{filterCount}</span> active
            filter{filterCount === 1 ? '' : 's'}.
          </div>
          <label className="block">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1">
              Segment name
            </div>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fintech · CNAPP-ready · 1K+ employees"
              className="w-full px-3 py-2 text-sm rounded border border-border bg-surface focus:outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1">
              Description <span className="text-text-muted/60">(optional)</span>
            </div>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One-line note for your team"
              className="w-full px-3 py-2 text-sm rounded border border-border bg-surface focus:outline-none focus:border-primary resize-none"
            />
          </label>
          <label className="block">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1">
              Attach to project
            </div>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded border border-border bg-surface focus:outline-none focus:border-primary"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-surface/40">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded-md"
          >
            Cancel
          </button>
          <button
            disabled={!canSave}
            onClick={() => onSave({ name: name.trim(), description: description.trim(), projectId, projectName: proj?.name })}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bookmark size={11} /> Save segment
          </button>
        </div>
      </div>
    </div>
  );
}

export function MarketAnalyzerCompaniesRoute() {
  const navigate = useNavigate();
  const allCompanies = useMemo(() => getMarketAnalyzerCompanies(), []);

  // ─── State ────────────────────────────────────────────────────────
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [filters, setFilters] = useState([]); // spec-driven; same shape as workbook
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(0);
  const [expandedSubs, setExpandedSubs] = useState(() => new Set());
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(null); // { message }
  const [appliedProfileId, setAppliedProfileId] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profiles = listScoringProfiles();
  const appliedProfile = appliedProfileId ? getScoringProfile(appliedProfileId) : null;

  const toggleSubsidiaries = (id) => {
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Filter pipeline ───────────────────────────────────────────────
  // 1) start from full universe
  // 2) apply search (name or hq match, case-insensitive)
  // 3) apply each active filter's compiled predicate from FILTER_REGISTRY
  const filteredCompanies = useMemo(() => {
    let rows = allCompanies;
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          (r.name || '').toLowerCase().includes(q) ||
          (r.fai?.hq || '').toLowerCase().includes(q) ||
          (r.industry || '').toLowerCase().includes(q),
      );
    }
    for (const f of filters) {
      const spec = FILTER_REGISTRY[f.specId];
      if (!spec) continue;
      const pred = spec.buildPredicate(f.value);
      if (pred) rows = rows.filter(pred);
    }
    return [...rows].sort((a, b) => compareCompanies(a, b, sort));
  }, [allCompanies, search, filters, sort]);

  const totalFound = filteredCompanies.length;
  const pageCount = Math.max(1, Math.ceil(totalFound / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageStart = safePage * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, totalFound);
  const pageRows = filteredCompanies.slice(pageStart, pageEnd);

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleSort = (key) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'name' || key === 'industry' || key === 'hq' ? 'asc' : 'desc' },
    );
    setPage(0);
  };
  const addOrUpdateFilter = (f) => {
    setFilters((prev) => {
      const existing = prev.findIndex((x) => x.id === f.id);
      if (existing === -1) return [...prev, f];
      const copy = prev.slice();
      copy[existing] = f;
      return copy;
    });
    setPage(0);
  };
  const removeFilter = (id) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
    setPage(0);
  };
  const clearFilters = () => {
    setFilters([]);
    setPage(0);
  };
  const handleSave = (data) => {
    const seg = addSegment({
      name: data.name,
      description: data.description,
      projectId: data.projectId,
      projectName: data.projectName,
      companyCount: totalFound,
      appliedProfileId,
    });
    setSaveModalOpen(false);
    setSaveToast({ message: `Saved "${seg.name}" — ${totalFound.toLocaleString()} companies` });
    setTimeout(() => setSaveToast(null), 3500);
  };

  return (
    <div className="px-8 py-6">
      {/* Breadcrumb */}
      <div className="text-[11px] text-text-muted mb-3 flex items-center gap-1.5">
        <button
          onClick={() => navigate('/market-analyzer/segments')}
          className="hover:text-text-secondary transition-colors"
        >
          Segments
        </button>
        <span>/</span>
        <span className="text-text-secondary">Companies</span>
      </div>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Companies</h1>
          <p className="text-[12px] text-text-secondary mt-1 max-w-2xl leading-relaxed">
            Every company in HG's universe. Filter on firmographic, technographic, intent and CRM
            attributes, then save the view as a Segment.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => window.alert('Export ships with the production wire-up.')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border text-text-secondary hover:text-primary hover:border-primary/40 rounded-md transition-colors"
          >
            <Download size={12} /> Export
          </button>
          <button
            onClick={() => setSaveModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim transition-colors"
          >
            <Bookmark size={12} /> Save segment
          </button>
        </div>
      </div>

      {/* Toolbar row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button
          onClick={() => setFilterPanelOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-md transition-colors ${
            filters.length > 0
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-surface text-text-secondary border-border hover:border-primary/40 hover:text-primary'
          }`}
        >
          <SlidersHorizontal size={11} /> Filters
          {filters.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold">
              {filters.length}
            </span>
          )}
        </button>
        {filters.length > 0 && (
          <button
            onClick={clearFilters}
            className="text-[11px] text-text-muted hover:text-rose-600 hover:underline"
          >
            Clear all
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-md transition-colors ${
              appliedProfile
                ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/40'
                : 'bg-surface text-text-secondary border-border hover:border-primary/40'
            }`}
          >
            <Plus size={11} />
            {appliedProfile ? `Profile: ${appliedProfile.name}` : 'Add profile'}
            <ChevronDown size={10} />
          </button>
          {profileMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-72 bg-bg border border-border rounded-md shadow-elev z-20">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-text-muted border-b border-border/60">
                Apply a scoring profile
              </div>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setAppliedProfileId(p.id);
                    setProfileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-surface-2 transition-colors ${
                    appliedProfileId === p.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="text-xs font-semibold text-text-primary">{p.name}</div>
                  <div className="text-[10px] text-text-muted leading-snug">{p.description}</div>
                </button>
              ))}
              {appliedProfile && (
                <div className="border-t border-border/60">
                  <button
                    onClick={() => {
                      setAppliedProfileId(null);
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-500/5"
                  >
                    Remove profile
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 max-w-md relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search companies by name, HQ, industry…"
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded border border-border bg-surface focus:outline-none focus:border-primary"
          />
        </div>

        {/* LIST / MATRIX view toggle */}
        <div className="ml-auto inline-flex items-center rounded-md border border-border overflow-hidden">
          <button className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold bg-primary/10 text-primary">
            <Rows3 size={11} /> List
          </button>
          <button
            onClick={() => window.alert('Matrix view ships in the next iteration.')}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-text-muted hover:text-text-primary hover:bg-surface-2 border-l border-border"
          >
            <LayoutGrid size={11} /> Matrix
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {filters.map((f) => (
            <div
              key={f.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] rounded-md bg-primary/8 border border-primary/30 text-text-secondary"
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                {f.group}
              </span>
              <span className="font-medium text-text-primary">{f.label}</span>
              {f.displayValue && (
                <span className="font-mono text-text-secondary">· {f.displayValue}</span>
              )}
              <button
                onClick={() => removeFilter(f.id)}
                className="ml-0.5 text-text-muted hover:text-rose-600"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Count line */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-sm">
          <span className="font-semibold text-text-primary">
            {totalFound.toLocaleString()}
          </span>
          <span className="text-text-secondary"> organizations found</span>
          <span className="text-text-muted"> · of {(MA_TOTAL_UNIVERSE / 1_000_000).toFixed(1)}M total in HG</span>
        </div>
        {appliedProfile && (
          <div className="text-[11px] text-text-muted">
            Scoring with{' '}
            <span className="text-sky-700 dark:text-sky-300 font-semibold">
              {appliedProfile.name}
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-md overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-bg/30 border-b border-border">
            <tr>
              <SortHeader label="Company Name" sortKey="name" sort={sort} onSort={handleSort} />
              <SortHeader label="Employees" sortKey="employees" sort={sort} onSort={handleSort} align="right" />
              <SortHeader label="Revenue" sortKey="revenue" sort={sort} onSort={handleSort} align="right" />
              <SortHeader label="HQ" sortKey="hq" sort={sort} onSort={handleSort} />
              <SortHeader label="Industry" sortKey="industry" sort={sort} onSort={handleSort} />
              <SortHeader label="IT Spend" sortKey="itSpend" sort={sort} onSort={handleSort} align="right" />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c) => {
              const isExpanded = expandedSubs.has(c.id);
              const subs = Array.isArray(c.subsidiaries) ? c.subsidiaries : [];
              return (
                <Fragment key={c.id}>
                  <tr className="border-b border-border/40 hover:bg-bg/40 transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {c.logoColor && (
                          <div
                            className="w-7 h-7 rounded text-[11px] font-bold flex items-center justify-center text-white flex-shrink-0"
                            style={{ background: c.logoColor }}
                          >
                            {c.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[13px] font-medium text-text-primary truncate">
                              {c.name}
                            </span>
                            <SubsidiaryChip
                              subsidiaries={c.subsidiaries}
                              expanded={isExpanded}
                              onToggle={() => toggleSubsidiaries(c.id)}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-[12px] text-text-secondary font-mono">
                      {c.fai?.employees || '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-[12px] text-text-secondary font-mono">
                      {c.fai?.revenue || '—'}
                    </td>
                    <td className="px-3 py-2 text-[12px] text-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={9} className="text-text-muted flex-shrink-0" />
                        {c.fai?.hq || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[12px] text-text-secondary truncate max-w-[240px]" title={c.industry || ''}>
                      <span className="inline-flex items-center gap-1">
                        <Building2 size={9} className="text-text-muted flex-shrink-0" />
                        {c.industry || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-[12px] text-text-primary font-mono font-semibold">
                      {c.itSpend ? (
                        <span className="inline-flex items-center gap-1">
                          <DollarSign size={9} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0" />
                          {c.itSpend}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                  {/* Subsidiary disclosure rows */}
                  {isExpanded && subs.map((sub, idx) => {
                    const subName = typeof sub === 'string' ? sub : sub.name;
                    const subEmp = typeof sub === 'object' ? sub.employees : '';
                    return (
                      <tr
                        key={`${c.id}-sub-${idx}`}
                        className="border-b border-border/30 bg-violet-500/[0.03]"
                      >
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-1.5 pl-9">
                            <CornerDownRight size={11} className="text-violet-500/70 flex-shrink-0" />
                            <span className="text-[12px] text-text-secondary">{subName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-right text-[11px] text-text-secondary font-mono">
                          {subEmp || '—'}
                        </td>
                        <td className="px-3 py-1.5 text-[10px] text-text-muted">—</td>
                        <td className="px-3 py-1.5 text-[10px] text-text-muted">—</td>
                        <td className="px-3 py-1.5 text-[10px] text-text-muted">—</td>
                        <td className="px-3 py-1.5 text-[10px] text-text-muted">—</td>
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted text-sm">
                  No companies match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between mt-3 text-[11px] text-text-secondary">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="px-2 py-1 text-xs border border-border bg-surface rounded focus:outline-none focus:border-primary"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span>
            <span className="font-mono">{totalFound === 0 ? 0 : pageStart + 1}</span>–
            <span className="font-mono">{pageEnd}</span> of{' '}
            <span className="font-mono">{totalFound.toLocaleString()}</span>{' '}
            <span className="text-text-muted">(filtered from {(MA_TOTAL_UNIVERSE / 1_000_000).toFixed(1)}M)</span>
          </span>
          <div className="inline-flex items-center gap-1">
            <button
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-1 rounded hover:bg-surface-2 text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="p-1 rounded hover:bg-surface-2 text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <FilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={filters}
        onAddOrUpdate={addOrUpdateFilter}
        onRemove={removeFilter}
        onClearAll={clearFilters}
        crmConnected={false}
        title="Filter companies"
      />

      {/* Save segment modal */}
      <SaveSegmentModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSave}
        filterCount={filters.length}
        companyCount={totalFound}
      />

      {/* Toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white text-sm rounded-md shadow-elev flex items-center gap-2">
          <Bookmark size={14} />
          {saveToast.message}
          <button
            onClick={() => navigate('/market-analyzer/segments')}
            className="ml-2 text-xs underline hover:no-underline"
          >
            View segments
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Scoring Profiles (NEW) ─────────────────────────────────────────

export function MarketAnalyzerScoringProfilesRoute() {
  const navigate = useNavigate();
  const profiles = listScoringProfiles();
  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <PageHeader
        title="Scoring Profiles"
        subtitle="Reusable scoring blueprints you can apply to any segment. A profile defines the dimensions and weights — applying it to a segment scores every company in that segment."
        primaryCta={
          <button
            onClick={() => window.alert('Profile builder ships in the next iteration.')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim transition-colors"
          >
            <Plus size={12} /> Create profile
          </button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => window.alert(`Open ${p.name} (profile builder ships next iteration).`)}
            className="text-left bg-surface border border-border rounded-md p-4 hover:border-primary/30 hover:shadow-card transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                <Gauge size={16} className="text-sky-700 dark:text-sky-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-sm font-semibold text-text-primary">{p.name}</h3>
                  <VisibilityBadge visibility={p.visibility} />
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed mb-2">{p.description}</p>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {p.dimensions.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-bg/40 text-text-secondary border border-border/60"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-text-muted flex items-center gap-2">
                  <span>Owner: {p.ownerName}</span>
                  <span>·</span>
                  <span>Applied to {p.appliedSegmentCount} segment{p.appliedSegmentCount === 1 ? '' : 's'}</span>
                  <span>·</span>
                  <span>Updated {p.updatedAt}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Catalog stubs ──────────────────────────────────────────────────

function StubRoute({ title, subtitle, icon: Icon }) {
  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      <div className="text-center text-text-muted">
        <Icon size={28} className="mx-auto mb-3 text-text-muted/60" />
        <div className="text-base font-semibold text-text-primary mb-1">{title}</div>
        <p className="text-sm max-w-md mx-auto leading-relaxed">{subtitle}</p>
        <p className="text-[11px] mt-4 text-text-muted italic">
          Prototype placeholder — the production surface ships against the existing Market Analyzer service.
        </p>
      </div>
    </div>
  );
}

export function MarketAnalyzerTechTaxonomiesRoute() {
  return (
    <StubRoute
      icon={Layers}
      title="Tech & Taxonomies"
      subtitle="Browse HG's product taxonomy — categories, products, vendors — used to compose technographic filters in your segments and scoring profiles."
    />
  );
}

export function MarketAnalyzerSavedCollectionsRoute() {
  return (
    <StubRoute
      icon={Bookmark}
      title="Saved Collections"
      subtitle="Named groups of companies you've bookmarked across segments — useful as input lists for new scoring runs or exports."
    />
  );
}

export function MarketAnalyzerExportHistoryRoute() {
  return (
    <StubRoute
      icon={History}
      title="Export History"
      subtitle="Audit trail of every export — who ran it, which segment + profile, when, and how many rows left the platform."
    />
  );
}
