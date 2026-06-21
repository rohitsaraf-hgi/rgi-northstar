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

import { useState } from 'react';
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
  ChevronDown,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  listProjects,
  listSegments,
  listScoringProfiles,
  getScoringProfile,
} from '../data/marketAnalyzer.js';

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

// ─── Companies (light search) ───────────────────────────────────────

export function MarketAnalyzerCompaniesRoute() {
  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <PageHeader
        title="Companies"
        subtitle="Search and filter HG's full company universe. Save filtered views as Segments to attach to a Project."
        primaryCta={
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border text-text-secondary hover:text-primary hover:border-primary/40 rounded-md transition-colors">
            <Bookmark size={12} /> Save as segment
          </button>
        }
      />
      <div className="bg-surface border border-border rounded-md p-3 mb-4 flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search companies by name, domain, NAICS..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded border border-border bg-bg focus:outline-none focus:border-primary"
          />
        </div>
        <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border text-text-secondary hover:text-primary hover:border-primary/40 rounded-md transition-colors">
          Filters
        </button>
      </div>
      <div className="bg-surface border border-dashed border-border rounded-md p-10 text-center text-text-muted">
        <Compass size={20} className="mx-auto mb-2 text-text-muted" />
        <div className="text-sm font-semibold text-text-primary mb-1">38.8M companies indexed</div>
        <p className="text-xs max-w-md mx-auto leading-relaxed">
          Full company search + faceted filters render here. For the prototype the
          Project / Segment / Scoring Profile structure is the focus — the table will
          mirror the patterns used in the Sales Co-Pilot Workbook.
        </p>
      </div>
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
