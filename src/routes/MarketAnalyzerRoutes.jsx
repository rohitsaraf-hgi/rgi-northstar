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

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
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
  Send,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Clock,
  Tags,
  FolderInput,
  Network,
  FolderPlus,
  BarChart3,
  Target,
} from 'lucide-react';
import {
  listProjects,
  listSegments,
  listScoringProfiles,
  listSystemDefaultProfiles,
  listCustomProfiles,
  cloneProfileToCustom,
  getScoringProfile,
  addSegment,
} from '../data/marketAnalyzer.js';
import {
  getMarketAnalyzerCompanies,
  MA_TOTAL_UNIVERSE,
} from '../data/marketAnalyzerCompanies.js';
import FilterPanel from '../components/workbook/FilterPanel.jsx';
import MarketAnalysisDashboard from '../components/market/MarketAnalysisDashboard.jsx';
import {
  goalsForPersona,
  defaultGoalForPersona,
  MARKET_GOALS_BY_ID,
  goalChartBlurb,
  goalTip,
} from '../data/marketGoals.js';
import { FILTER_REGISTRY } from '../data/filterRegistry.js';
import {
  promoteSegmentToWorkbook,
  isWorkbookNameTaken,
} from '../data/workbooks.js';
import { useDemo } from '../context/DemoContext.jsx';
import { usePersona } from '../context/PersonaContext.jsx';
import { usePageAgent } from '../context/PageAgentContext.jsx';

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

// Derive a category label for a project from its name + description.
// Used by the "categorize / bulk rename" agent action.
function projectCategory(p) {
  const text = `${p.name} ${p.description}`.toLowerCase();
  if (text.includes('cnapp')) return 'CNAPP';
  if (text.includes('healthcare') || text.includes('life science')) return 'Healthcare';
  if (text.includes('ai') || text.includes('runtime') || text.includes('agent')) return 'AI Defense';
  if (text.includes('palo alto') || text.includes('displacement') || text.includes('competit'))
    return 'Competitive';
  return 'General';
}

export function MarketAnalyzerProjectsRoute() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('mine');
  const [projects, setProjects] = useState(() => listProjects());
  const [highlightIds, setHighlightIds] = useState([]);
  const [insight, setInsight] = useState(null);

  // The agent is registered once on mount, so its `run` callbacks read
  // the latest projects through this ref and mutate via functional updates.
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  const filtered = tab === 'mine'
    ? projects.filter((p) => p.ownerId === 'priya')
    : tab === 'organization'
    ? projects.filter((p) => p.visibility === 'organization')
    : projects;

  // Create a project from chat — the headless "create projects thru NLP" path.
  const createProject = ({ name, description, visibility }) => {
    const proj = {
      id: `proj-new-${projectsRef.current.length + 1}`,
      name: (name || '').trim() || 'Untitled project',
      description: (description || '').trim(),
      visibility: visibility || 'organization',
      ownerId: 'priya',
      ownerName: 'Priya Sharma',
      createdAt: '2026-06-26',
      updatedAt: '2026-06-26',
      segmentCount: 0,
      companyCount: 0,
    };
    setProjects((prev) => [proj, ...prev]);
    return proj;
  };

  // ─── Page agent ───────────────────────────────────────────────────
  // Suggestions are one-shot edits; flows are guided, multi-step paths
  // that surface inline UI (a create form, a chart) right in the chat.
  usePageAgent({
    cta: 'Manage your projects with AI',
    title: 'Projects Agent',
    subtitle: 'Market Analyzer · Projects',
    flows: [
      {
        id: 'create-project',
        label: 'Create a project',
        category: 'Build',
        description: 'Spin up a new TAM / SAM / SOM analysis — no form-hunting.',
        keywords: ['create project', 'new project', 'add project', 'start a project'],
        icon: FolderPlus,
        run: async (ctx, { hint }) => {
          // Prefill a name from natural language like "...called Fintech TAM".
          const m = (hint || '').match(/(?:called|named|for|:)\s+(.+)$/i);
          const guess = m ? m[1].replace(/['"]/g, '').trim() : '';
          await ctx.say(
            "Let's set up a new project. I pre-filled what I could — tweak anything and hit create.",
          );
          const v = await ctx.ask({
            title: 'New project',
            submitLabel: 'Create project',
            summarize: (val) => `Creating “${val.name || 'Untitled project'}”…`,
            fields: [
              { key: 'name', label: 'Project name', type: 'text', placeholder: 'e.g. Q3 CNAPP TAM Analysis', default: guess },
              { key: 'description', label: 'Description', type: 'textarea', placeholder: 'What market is this sizing?' },
              {
                key: 'visibility',
                label: 'Visibility',
                type: 'select',
                default: 'organization',
                options: [
                  { id: 'organization', label: 'Org-visible' },
                  { id: 'private', label: 'Private' },
                ],
              },
            ],
          });
          const proj = createProject(v);
          setTab('all');
          setInsight(null);
          setHighlightIds([proj.id]);
          await ctx.say(
            `Done — “${proj.name}” is live in your projects list${
              proj.visibility === 'organization' ? ' and visible to your org' : ''
            }. Open it to add segments, or ask me to size the market next.`,
          );
        },
      },
      {
        id: 'analyze-projects',
        label: 'Analyze my portfolio',
        category: 'Analyze',
        description: 'A breakdown of coverage across your projects, explained.',
        keywords: ['analyze', 'breakdown', 'chart', 'compare projects', 'portfolio'],
        icon: BarChart3,
        run: async (ctx) => {
          await ctx.say('Here’s how your projects compare by company coverage.');
          const list = [...projectsRef.current].sort((a, b) => b.companyCount - a.companyCount);
          const total = list.reduce((s, p) => s + p.companyCount, 0) || 1;
          const top = list[0];
          const pct = Math.round((top.companyCount / total) * 100);
          await ctx.chart({
            title: 'Companies per project',
            data: list.map((p) => ({ label: p.name, value: p.companyCount })),
            explanation: `Your largest analysis, ${top.name}, holds ${top.companyCount.toLocaleString()} companies — about ${pct}% of everything you're tracking. The remaining ${
              list.length - 1
            } projects are tighter, more targeted cuts. If two of them overlap heavily, consider merging before you push to Sales Co-Pilot.`,
          });
        },
      },
    ],
    intro:
      'I can reorganize, inspect, and tidy up your TAM / SAM / SOM projects right here. Try one of these:',
    seedHistory: [
      {
        title: 'Which projects overlap?',
        preview:
          'Q3 CNAPP TAM and AI / Runtime Defense share ~1,240 companies — mostly Banking + Tech.',
        ts: '2d ago',
      },
      {
        title: 'Make my Q3 projects org-visible',
        preview: 'Set 2 private projects to Org-visible across the workspace.',
        ts: '5d ago',
      },
    ],
    suggestions: [
      {
        id: 'make-all-visible',
        label: 'Make all visible',
        category: 'Organize',
        description: 'Flip every project to org-visible so the whole team can see them.',
        icon: Eye,
        thinking: 'Updating visibility on your projects…',
        run: () => {
          const current = projectsRef.current;
          const privates = current.filter((p) => p.visibility !== 'organization');
          setProjects((prev) => prev.map((p) => ({ ...p, visibility: 'organization' })));
          setTab('all');
          setHighlightIds(privates.map((p) => p.id));
          if (privates.length === 0)
            return 'Every project is already Org-visible — nothing to change.';
          return `Set all ${current.length} projects to Org-visible. ${privates.length} were private: ${privates
            .map((p) => p.name)
            .join(', ')}.`;
        },
      },
      {
        id: 'inspect-updates',
        label: 'Inspect latest updates',
        category: 'Inspect',
        description: 'Sort by last touched and flag what’s recent vs. going stale.',
        icon: Clock,
        thinking: 'Scanning recent activity…',
        run: () => {
          const sorted = [...projectsRef.current].sort((a, b) =>
            b.updatedAt.localeCompare(a.updatedAt)
          );
          setProjects(sorted);
          setTab('all');
          const newest = sorted[0];
          const stale = sorted[sorted.length - 1];
          setHighlightIds([newest.id]);
          setInsight(null);
          return `Sorted by last updated.\n• Most recent: ${newest.name} — ${newest.updatedAt} (${newest.segmentCount} segments)\n• Oldest touch: ${stale.name} — ${stale.updatedAt}; might be worth a refresh.`;
        },
      },
      {
        id: 'find-common-companies',
        label: 'Find common companies',
        category: 'Inspect',
        description: 'Surface companies that overlap across projects before you push.',
        icon: Network,
        thinking: 'Comparing company sets across projects…',
        run: () => {
          const byCount = [...projectsRef.current].sort(
            (a, b) => b.companyCount - a.companyCount
          );
          const [a, b] = byCount;
          if (!b) return 'Need at least two projects to compare. Create another first.';
          const overlap = Math.round(Math.min(a.companyCount, b.companyCount) * 0.34);
          setHighlightIds([a.id, b.id]);
          setTab('all');
          setInsight({
            overlap,
            a: a.name,
            b: b.name,
          });
          return `Found ~${overlap.toLocaleString()} companies shared between ${a.name} and ${b.name} — mostly Banking + Tech accounts already in CRM. I've flagged both projects below.`;
        },
      },
      {
        id: 'move-projects',
        label: 'Move projects',
        category: 'Organize',
        description: 'Group projects into a shared workspace folder.',
        icon: FolderInput,
        thinking: 'Moving projects into a shared folder…',
        run: () => {
          const folder = 'FY26 Planning Book';
          const count = projectsRef.current.length;
          setProjects((prev) => prev.map((p) => ({ ...p, folder })));
          setTab('all');
          setHighlightIds([]);
          return `Moved all ${count} projects into the “${folder}” folder so they group together in your workspace.`;
        },
      },
      {
        id: 'categorize',
        label: 'Categorize projects (bulk rename)',
        category: 'Clean up',
        description: 'Auto-tag and bulk-rename projects by theme (CNAPP, Healthcare…).',
        icon: Tags,
        thinking: 'Categorizing and renaming projects…',
        run: () => {
          const tags = [...new Set(projectsRef.current.map(projectCategory))];
          setProjects((prev) =>
            prev.map((p) => {
              const tag = projectCategory(p);
              return p.name.startsWith(`[${tag}]`)
                ? p
                : { ...p, name: `[${tag}] ${p.name}` };
            })
          );
          setTab('all');
          setHighlightIds([]);
          return `Categorized and renamed ${projectsRef.current.length} projects across ${tags.length} categories: ${tags.join(
            ', '
          )}. Prefixes are now on each name.`;
        },
      },
    ],
  });

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

      {insight && (
        <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-md border border-primary/30 bg-primary/5">
          <span className="grid place-items-center w-6 h-6 rounded-md bg-primary/10 text-primary flex-shrink-0 mt-0.5">
            <Network size={13} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-text-primary">
              ~{insight.overlap.toLocaleString()} shared companies
            </div>
            <div className="text-[11.5px] text-text-secondary leading-relaxed">
              {insight.a} and {insight.b} overlap heavily — mostly Banking + Tech accounts already
              in CRM. Consider merging or de-duping before you push to Sales Co-Pilot.
            </div>
          </div>
          <button
            onClick={() => setInsight(null)}
            className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary flex-shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      )}

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
                className={`border-b border-border/40 hover:bg-bg/40 cursor-pointer transition-colors ${
                  highlightIds.includes(p.id) ? 'bg-primary/5 ring-1 ring-inset ring-primary/40' : ''
                }`}
              >
                <td className="px-4 py-2.5 text-text-primary font-medium">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{p.name}</span>
                    {p.folder && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                        <Folder size={9} /> {p.folder}
                      </span>
                    )}
                  </div>
                </td>
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

// ─── Push-segment-to-CRM modal ──────────────────────────────────────
//
// Distinct from "Push to Sales Co-Pilot": this path writes the
// segment's net-new logos as CRM accounts (Salesforce/HubSpot). CRM
// routing rules will assign owners on next sync; existing CRM accounts
// matched by domain get tagged with the segment source for filtering.
//
// Mocked in the prototype — no actual CRM write happens. The modal
// surfaces the impact and a confirm toast so the demo flow reads
// realistically.

function PushSegmentToCrmModal({ open, segment, onClose, onPushed, crmName = 'Salesforce' }) {
  const [submitting, setSubmitting] = useState(false);

  if (!open || !segment) return null;

  // For the prototype we estimate net-new vs existing by hashing the
  // segment id — gives a stable demo number without doing a real merge.
  const total = segment.companyCount || 0;
  const merged = Math.min(total, Math.round(total * 0.18));
  const netNew = total - merged;

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onPushed?.({ netNew, merged, crmName });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-[520px] max-w-[95vw] bg-bg border border-border rounded-md shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Send size={14} className="text-emerald-700 dark:text-emerald-300" />
            <div className="text-sm font-semibold text-text-primary">Push to {crmName}</div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="text-[12px] text-text-secondary leading-relaxed">
            Writes <strong className="text-text-primary">{segment.name}</strong> directly to{' '}
            <strong className="text-text-primary">{crmName}</strong>. Net-new logos become CRM
            accounts; existing accounts get tagged with the segment source so they can be
            filtered later. {crmName} routing rules assign owners on next sync.
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="px-3 py-2 rounded border border-emerald-500/30 bg-emerald-500/5">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-300">
                Create as new
              </div>
              <div className="text-lg font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                {netNew.toLocaleString()}
              </div>
              <div className="text-[10px] text-text-muted">net-new logos</div>
            </div>
            <div className="px-3 py-2 rounded border border-sky-500/30 bg-sky-500/5">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-sky-700 dark:text-sky-300">
                Tag existing
              </div>
              <div className="text-lg font-mono font-semibold text-sky-700 dark:text-sky-300">
                {merged.toLocaleString()}
              </div>
              <div className="text-[10px] text-text-muted">already in {crmName}</div>
            </div>
          </div>

          <div className="px-3 py-2 rounded bg-amber-500/5 border border-amber-500/20 text-[11px] text-text-secondary inline-flex items-start gap-2">
            <AlertTriangle size={11} className="text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5" />
            <span>
              Owner assignment runs through {crmName}'s routing rules — not Territory Design. Make sure
              your CRM rules are configured before pushing large lists.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-surface/40">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-500 disabled:opacity-50"
          >
            <Send size={11} />
            {submitting ? `Pushing to ${crmName}…` : `Push to ${crmName}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Push-segment-to-Sales-Co-Pilot modal ──────────────────────────
//
// One-way snapshot. Asks for a unique workbook name (defaulted from the
// segment) + visibility. On confirm, snapshots the segment rows into a
// PROMOTED_SEGMENT workbook and surfaces a deep-link toast.

function PushSegmentModal({ open, segment, onClose, onPushed }) {
  const { persona } = usePersona();
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState('organization');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && segment) {
      setName(segment.name || '');
      setVisibility('organization');
      setError(null);
      setSubmitting(false);
    }
  }, [open, segment?.id]);

  if (!open || !segment) return null;

  const trimmed = name.trim();
  const isDuplicate = trimmed && isWorkbookNameTaken(trimmed);
  const canSubmit = trimmed.length > 0 && !isDuplicate && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    // Snapshot rows from the curated company universe for the prototype.
    // In production this re-runs the segment's saved filters.
    const universe = getMarketAnalyzerCompanies();
    const sampleSize = Math.min(segment.companyCount || 20, universe.length);
    const rows = universe.slice(0, sampleSize).map((c) => ({ ...c, source: 'icp_match' }));
    const result = promoteSegmentToWorkbook({
      segmentId: segment.id,
      segmentName: segment.name,
      name: trimmed,
      rows,
      ownerId: persona?.id,
      ownerName: persona?.name,
      visibility,
    });
    if (result?.error === 'name_taken') {
      setError('A workbook with this name already exists. Pick a different name.');
      setSubmitting(false);
      return;
    }
    onPushed?.(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-[520px] max-w-[95vw] bg-bg border border-border rounded-md shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Send size={14} className="text-primary" />
            <div className="text-sm font-semibold text-text-primary">Push to Sales Co-Pilot</div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="text-[12px] text-text-secondary leading-relaxed">
            Snapshot{' '}
            <span className="font-mono font-semibold text-text-primary">
              {(segment.companyCount || 0).toLocaleString()}
            </span>{' '}
            companies from <strong className="text-text-primary">{segment.name}</strong> into a
            Sales Co-Pilot workbook. Accounts land unassigned — admins can route owners via
            Territory Design.
          </div>

          <label className="block">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1">
              Workbook name
            </div>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Fintech CNAPP-ready · Jun 23"
              className={`w-full px-3 py-2 text-sm rounded border ${
                isDuplicate || error ? 'border-rose-500/50' : 'border-border'
              } bg-surface focus:outline-none focus:border-primary`}
            />
            {isDuplicate && !error && (
              <div className="mt-1 text-[11px] text-rose-600 inline-flex items-center gap-1">
                <AlertTriangle size={10} /> A workbook with this name already exists — pick a unique one.
              </div>
            )}
            {error && (
              <div className="mt-1 text-[11px] text-rose-600 inline-flex items-center gap-1">
                <AlertTriangle size={10} /> {error}
              </div>
            )}
          </label>

          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1">
              Visibility
            </div>
            <div className="flex gap-2">
              {[
                { id: 'organization', label: 'Org-visible', desc: 'Everyone in the tenant can see + use it' },
                { id: 'private', label: 'Private', desc: 'Only you' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setVisibility(opt.id)}
                  className={`flex-1 text-left px-3 py-2 rounded border transition-colors ${
                    visibility === opt.id
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'bg-surface border-border text-text-secondary hover:border-primary/30'
                  }`}
                >
                  <div className="text-[12px] font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-text-muted leading-snug mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-surface/40">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={11} /> Push to Sales Co-Pilot
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Segments ───────────────────────────────────────────────────────

export function MarketAnalyzerSegmentsRoute() {
  const navigate = useNavigate();
  const segments = listSegments();
  const profiles = listScoringProfiles();
  const { hasModule, hasIntegration } = useDemo();
  const hasSalesCopilot = hasModule('sales_copilot');
  const crmConnected = hasIntegration?.('salesforce') || hasIntegration?.('hubspot') || false;
  const crmName = hasIntegration?.('salesforce') ? 'Salesforce' : hasIntegration?.('hubspot') ? 'HubSpot' : 'CRM';
  const [pushTarget, setPushTarget] = useState(null);
  const [crmPushTarget, setCrmPushTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const handlePushed = (workbook) => {
    if (!workbook) return;
    setPushTarget(null);
    setToast({ workbook });
    setTimeout(() => setToast(null), 6000);
  };
  const handleCrmPushed = (summary) => {
    setCrmPushTarget(null);
    setToast({ crm: summary });
    setTimeout(() => setToast(null), 6000);
  };

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
              {(hasSalesCopilot || crmConnected) && <th className="px-4 py-2 w-44"></th>}
            </tr>
          </thead>
          <tbody>
            {segments.map((s) => {
              const profile = s.appliedProfileId ? getScoringProfile(s.appliedProfileId) : null;
              return (
                <tr
                  key={s.id}
                  className="border-b border-border/40 hover:bg-bg/40 transition-colors"
                >
                  <td
                    onClick={() => navigate(`/market-analyzer/segments/${s.id}`)}
                    className="px-4 py-2.5 align-top cursor-pointer"
                  >
                    <div className="text-text-primary font-medium">{s.name}</div>
                    <div className="text-[11px] text-text-muted truncate max-w-md">{s.description}</div>
                  </td>
                  <td
                    onClick={() => navigate(`/market-analyzer/segments/${s.id}`)}
                    className="px-4 py-2.5 text-text-secondary text-[12px] cursor-pointer"
                  >
                    {s.projectName}
                  </td>
                  <td
                    onClick={() => navigate(`/market-analyzer/segments/${s.id}`)}
                    className="px-4 py-2.5 cursor-pointer"
                  >
                    {profile ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                        <Gauge size={9} />
                        {profile.name}
                      </span>
                    ) : (
                      <span className="text-[10px] text-text-muted italic">None applied</span>
                    )}
                  </td>
                  <td
                    onClick={() => navigate(`/market-analyzer/segments/${s.id}`)}
                    className="px-4 py-2.5 text-right text-text-secondary font-mono text-[12px] cursor-pointer"
                  >
                    {s.companyCount.toLocaleString()}
                  </td>
                  <td
                    onClick={() => navigate(`/market-analyzer/segments/${s.id}`)}
                    className="px-4 py-2.5 text-text-muted text-[11px] cursor-pointer"
                  >
                    {s.createdAt}
                  </td>
                  {(hasSalesCopilot || crmConnected) && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 justify-end">
                        {crmConnected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCrmPushTarget(s);
                            }}
                            title={`Push net-new logos to ${crmName}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-500/10 transition-colors"
                          >
                            <Send size={10} /> CRM
                          </button>
                        )}
                        {hasSalesCopilot && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPushTarget(s);
                            }}
                            title="Push this segment to Sales Co-Pilot as a workbook"
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold border border-primary/30 text-primary rounded hover:bg-primary/5 transition-colors"
                          >
                            <Send size={10} /> SC
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-[11px] text-text-muted max-w-3xl leading-relaxed">
        Click a segment to open the company list with the applied scoring profile. Use{' '}
        <span className="font-semibold text-text-secondary">Push</span> to snapshot a segment into a
        Sales Co-Pilot workbook sellers can work off of.
      </div>

      <PushSegmentModal
        open={!!pushTarget}
        segment={pushTarget}
        onClose={() => setPushTarget(null)}
        onPushed={handlePushed}
      />
      <PushSegmentToCrmModal
        open={!!crmPushTarget}
        segment={crmPushTarget}
        crmName={crmName}
        onClose={() => setCrmPushTarget(null)}
        onPushed={handleCrmPushed}
      />
      {toast?.workbook && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white text-sm rounded-md shadow-elev flex items-center gap-3">
          <CheckCircle2 size={14} />
          <span>
            Pushed <strong>{toast.workbook.accountCount.toLocaleString()}</strong> accounts to{' '}
            <strong>{toast.workbook.name}</strong>
            {toast.workbook.mergeSummary?.needsRoutingCount > 0 && (
              <span className="opacity-90">
                {' '}· {toast.workbook.mergeSummary.needsRoutingCount} need routing
              </span>
            )}
          </span>
          <button
            onClick={() => navigate(`/workbook/${toast.workbook.id}`)}
            className="ml-2 text-xs underline hover:no-underline"
          >
            View workbook →
          </button>
        </div>
      )}
      {toast?.crm && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white text-sm rounded-md shadow-elev flex items-center gap-3">
          <CheckCircle2 size={14} />
          <span>
            Pushed to <strong>{toast.crm.crmName}</strong> ·{' '}
            <strong>{toast.crm.netNew.toLocaleString()}</strong> created ·{' '}
            <strong>{toast.crm.merged.toLocaleString()}</strong> tagged
          </span>
        </div>
      )}
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
  const { hasModule, hasIntegration } = useDemo();
  const hasSalesCopilot = hasModule('sales_copilot');
  const crmConnected = hasIntegration?.('salesforce') || hasIntegration?.('hubspot') || false;
  const crmName = hasIntegration?.('salesforce') ? 'Salesforce' : hasIntegration?.('hubspot') ? 'HubSpot' : 'CRM';
  const [pushOpen, setPushOpen] = useState(false);
  const [crmPushOpen, setCrmPushOpen] = useState(false);
  const [pushToast, setPushToast] = useState(null);

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
        primaryCta={
          <div className="flex items-center gap-2">
            {crmConnected && (
              <button
                onClick={() => setCrmPushOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 rounded-md transition-colors"
                title={`Write net-new logos to ${crmName}; CRM routing rules assign owners`}
              >
                <Send size={12} /> Push to {crmName}
              </button>
            )}
            {hasSalesCopilot && (
              <button
                onClick={() => setPushOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim transition-colors"
                title="Create a workbook in Sales Co-Pilot; admin routes owners via Territory Design"
              >
                <Send size={12} /> Push to Sales Co-Pilot
              </button>
            )}
          </div>
        }
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

      <PushSegmentModal
        open={pushOpen}
        segment={segment}
        onClose={() => setPushOpen(false)}
        onPushed={(workbook) => {
          setPushOpen(false);
          if (workbook) {
            setPushToast({ workbook });
            setTimeout(() => setPushToast(null), 5000);
          }
        }}
      />
      <PushSegmentToCrmModal
        open={crmPushOpen}
        segment={segment}
        crmName={crmName}
        onClose={() => setCrmPushOpen(false)}
        onPushed={(summary) => {
          setCrmPushOpen(false);
          setPushToast({ crm: summary });
          setTimeout(() => setPushToast(null), 6000);
        }}
      />
      {pushToast?.workbook && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white text-sm rounded-md shadow-elev flex items-center gap-3">
          <CheckCircle2 size={14} />
          <span>
            Pushed <strong>{pushToast.workbook.accountCount.toLocaleString()}</strong> accounts to{' '}
            <strong>{pushToast.workbook.name}</strong>
            {pushToast.workbook.mergeSummary?.needsRoutingCount > 0 && (
              <span className="opacity-90">
                {' '}
                · {pushToast.workbook.mergeSummary.needsRoutingCount} need routing
              </span>
            )}
          </span>
          <button
            onClick={() => navigate(`/workbook/${pushToast.workbook.id}`)}
            className="ml-2 text-xs underline hover:no-underline"
          >
            View workbook →
          </button>
        </div>
      )}
      {pushToast?.crm && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white text-sm rounded-md shadow-elev flex items-center gap-3">
          <CheckCircle2 size={14} />
          <span>
            Pushed to <strong>{pushToast.crm.crmName}</strong> ·{' '}
            <strong>{pushToast.crm.netNew.toLocaleString()}</strong> created ·{' '}
            <strong>{pushToast.crm.merged.toLocaleString()}</strong> tagged. Routing on next sync.
          </span>
        </div>
      )}
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
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const { persona } = usePersona();
  const marketGoals = useMemo(() => goalsForPersona(persona), [persona]);
  const [analysisGoal, setAnalysisGoal] = useState(() => defaultGoalForPersona(persona));
  const [analysisGoalDetail, setAnalysisGoalDetail] = useState('');
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
  // Agent registers once on mount; read the live count through a ref.
  const totalFoundRef = useRef(totalFound);
  totalFoundRef.current = totalFound;
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const filteredCompaniesRef = useRef(filteredCompanies);
  filteredCompaniesRef.current = filteredCompanies;
  const appliedProfileIdRef = useRef(appliedProfileId);
  appliedProfileIdRef.current = appliedProfileId;
  // Current analysis goal — read by suggestions/flows so every operation
  // can close with a goal-aligned tip.
  const analysisGoalRef = useRef(analysisGoal);
  analysisGoalRef.current = analysisGoal;
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

  // ─── Page agent ───────────────────────────────────────────────────
  // "Explore companies with AI" — each action drives the real page state
  // (filters, sort, scoring profile, save flow) so the table responds
  // immediately. Summaries count against the full universe via the same
  // spec predicates the FilterPanel uses, so the numbers line up.
  const applyFilterFromSpec = (specId, value) => {
    const spec = FILTER_REGISTRY[specId];
    if (!spec) return 0;
    const f = {
      id: specId,
      specId,
      group: spec.group,
      label: spec.label,
      value,
      displayValue: spec.format ? spec.format(value) : undefined,
    };
    // Replace any same-id filter, keep the rest, so the reported count is
    // the real intersection the table will show.
    const next = [...filtersRef.current.filter((x) => x.id !== specId), f];
    setFilters(next);
    setPage(0);
    let rows = allCompanies;
    for (const active of next) {
      const pred = FILTER_REGISTRY[active.specId]?.buildPredicate(active.value);
      if (pred) rows = rows.filter(pred);
    }
    return rows.length;
  };

  const parseSpend = (s) => {
    const m = String(s || '').match(/([\d.]+)\s*([KMBT])?/i);
    if (!m) return 0;
    const n = parseFloat(m[1]) || 0;
    const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[(m[2] || '').toUpperCase()] || 1;
    return n * mult;
  };

  // Apply several filters in one shot (avoids the stale-ref race that
  // sequential single applies would hit inside a flow), return the count.
  const applyFilters = (specValuePairs) => {
    let next = [...filtersRef.current];
    for (const [specId, value] of specValuePairs) {
      const spec = FILTER_REGISTRY[specId];
      if (!spec) continue;
      next = [
        ...next.filter((x) => x.id !== specId),
        { id: specId, specId, group: spec.group, label: spec.label, value, displayValue: spec.format ? spec.format(value) : undefined },
      ];
    }
    setFilters(next);
    setPage(0);
    let rows = allCompanies;
    for (const active of next) {
      const pred = FILTER_REGISTRY[active.specId]?.buildPredicate(active.value);
      if (pred) rows = rows.filter(pred);
    }
    return rows.length;
  };

  // Bucket the universe into coarse industry groups for "analyze market".
  const industryBuckets = (rows) => {
    const BUCKETS = [
      { label: 'Financial Svcs', keys: ['financial', 'banking', 'bnpl'] },
      { label: 'Insurance', keys: ['insurance'] },
      { label: 'Healthcare / Pharma', keys: ['health', 'pharmaceutical', 'life science'] },
      { label: 'Tech / Software', keys: ['computer', 'electronic', 'software', 'internet', 'semiconductor'] },
      { label: 'Manufacturing', keys: ['manufacturing'] },
      { label: 'Retail', keys: ['retail'] },
    ];
    return BUCKETS.map((b) => ({
      label: b.label,
      value: rows.filter((r) => b.keys.some((k) => String(r.industry || '').toLowerCase().includes(k))).length,
    }))
      .filter((b) => b.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  // Save-as-segment as an inline flow step (no modal) — collects a name,
  // note, and target project right in the chat, then writes the segment.
  const saveSegmentInline = async (ctx) => {
    const count = totalFoundRef.current;
    const projectList = listProjects();
    await ctx.say(`Let's save the current ${count.toLocaleString()} companies as a segment.`);
    const v = await ctx.ask({
      title: 'Save as segment',
      submitLabel: 'Save segment',
      summarize: (val) =>
        `Saving “${(val.name || '').trim() || 'Untitled segment'}” · ${count.toLocaleString()} companies…`,
      fields: [
        {
          key: 'name',
          label: 'Segment name',
          type: 'text',
          default: filtersRef.current.length ? 'ICP segment' : 'Company shortlist',
          placeholder: 'e.g. Fintech CNAPP-ready',
        },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional note for your team' },
        {
          key: 'projectId',
          label: 'Attach to project',
          type: 'select',
          default: projectList[0]?.id || '',
          options: projectList.map((p) => ({ id: p.id, label: p.name })),
        },
      ],
    });
    const proj = projectList.find((p) => p.id === v.projectId);
    const seg = addSegment({
      name: (v.name || '').trim() || 'Untitled segment',
      description: v.description,
      projectId: v.projectId || null,
      projectName: proj?.name,
      companyCount: count,
      appliedProfileId: appliedProfileIdRef.current,
    });
    setSaveToast({ message: `Saved "${seg.name}" — ${count.toLocaleString()} companies` });
    setTimeout(() => setSaveToast(null), 3500);
    await ctx.say(
      `Saved “${seg.name}” — ${count.toLocaleString()} companies${
        proj ? ` under ${proj.name}` : ''
      }. It's in your Segments list now, ready to push to Sales Co-Pilot.`,
    );
  };

  usePageAgent({
    cta: 'Explore companies with AI',
    title: 'Companies Agent',
    subtitle: 'Market Analyzer · Companies',
    intro:
      'What do you want to do? I can drive Market Analyzer for you — analyze the market, build an ICP segment, or set up scoring. UI shows up when it helps.',
    // Goal-aligned tip appended by the launcher after each operation.
    tip: () => goalTip(analysisGoalRef.current),
    flows: [
      {
        id: 'analyze-market',
        label: 'Analyze my market',
        category: 'Analyze',
        description: 'Break down HG’s universe with a chart and a plain-English read.',
        keywords: ['analyze', 'market', 'breakdown', 'chart', 'overview', 'tam'],
        icon: BarChart3,
        run: async (ctx) => {
          // 1) Ask what the user is trying to achieve — drives the analysis.
          await ctx.say('First — what are you trying to get out of this analysis?');
          const g = await ctx.ask({
            title: 'Your goal',
            submitLabel: 'Analyze',
            summarize: (val) => `Goal: ${MARKET_GOALS_BY_ID[val.goal]?.label}.`,
            fields: [
              {
                key: 'goal',
                label: 'What do you want to do?',
                type: 'select',
                default: analysisGoalRef.current,
                options: marketGoals.map((x) => ({ id: x.id, label: x.label })),
              },
            ],
          });
          let detail = '';
          const goalObj = MARKET_GOALS_BY_ID[g.goal];
          if (goalObj?.requiresDetail) {
            const d = await ctx.ask({
              title: goalObj.detailLabel || 'Details',
              submitLabel: 'Continue',
              summarize: (val) => (val.detail ? `Partner: ${val.detail}.` : 'No partner specified.'),
              fields: [{ key: 'detail', type: 'text', placeholder: goalObj.detailPlaceholder || '' }],
            });
            detail = (d.detail || '').trim();
          }
          setAnalysisGoal(g.goal);
          setAnalysisGoalDetail(detail);

          // 2) Chart + goal-framed read-out.
          await ctx.say(`Got it — analyzing through a “${goalObj?.label}” lens.`);
          const data = industryBuckets(filteredCompaniesRef.current);
          const top = data[0];
          await ctx.chart({
            title: `Universe by industry · ${filteredCompaniesRef.current.length.toLocaleString()} companies`,
            data,
            explanation: goalChartBlurb(g.goal, {
              topLabel: top?.label,
              topVal: top?.value,
              total: filteredCompaniesRef.current.length,
              detail,
            }),
            action: { label: 'View detailed analysis', run: () => setAnalysisOpen(true) },
          });
        },
      },
      {
        id: 'create-icp',
        label: 'Create an ICP segment',
        category: 'Build',
        description: 'Define ideal-customer criteria; I filter live, then save it.',
        keywords: ['icp', 'ideal customer', 'icp segment', 'define icp', 'build a segment'],
        icon: Target,
        run: async (ctx, { hint }) => {
          await ctx.say('Let’s define your ICP. Pick the criteria and I’ll filter the universe live.');
          const guessFin = /fin|bank/i.test(hint || '');
          const v = await ctx.ask({
            title: 'ICP criteria',
            submitLabel: 'Apply filters',
            summarize: (val) =>
              `ICP: ${(val.industries || []).length || 'any'} industries${val.minRev ? `, ${val.minRev}+ revenue` : ''}.`,
            fields: [
              {
                key: 'industries',
                label: 'Target industries',
                type: 'chips',
                default: guessFin ? ['banking'] : ['banking'],
                options: [
                  { id: 'banking', label: 'Financial Svcs' },
                  { id: 'healthcare', label: 'Healthcare' },
                  { id: 'tech', label: 'Tech' },
                  { id: 'manufacturing', label: 'Manufacturing' },
                  { id: 'retail', label: 'Retail' },
                ],
              },
              {
                key: 'minRev',
                label: 'Minimum revenue',
                type: 'select',
                default: '1B',
                options: [
                  { id: '', label: 'Any' },
                  { id: '1B', label: '$1B+' },
                  { id: '10B', label: '$10B+' },
                ],
              },
            ],
          });
          const pairs = [];
          if (v.industries?.length) pairs.push(['industry', v.industries]);
          if (v.minRev) pairs.push(['revenue', { min: v.minRev, max: '' }]);
          const n = pairs.length ? applyFilters(pairs) : allCompanies.length;
          await ctx.say(
            `Filtered the table to your ICP — ${n.toLocaleString()} companies match. The filter chips are live on the page so you can fine-tune. Save it as a segment?`,
          );
          const conf = await ctx.ask({
            title: 'Save as segment?',
            submitLabel: 'Continue',
            summarize: (val) => (val.save ? 'Saving as a segment…' : 'Left it as a live view.'),
            fields: [{ key: 'save', type: 'toggle', label: 'Save this as a segment now' }],
          });
          if (conf.save) {
            await saveSegmentInline(ctx);
          } else {
            await ctx.say('Kept it as a live view. Say the word when you want to save it.');
          }
        },
      },
      {
        id: 'build-scoring',
        label: 'Set up scoring',
        category: 'Score',
        description: 'Weight what matters; I apply a fit lens to the universe.',
        keywords: ['scoring', 'score', 'weights', 'fit model', 'rank by fit'],
        icon: Gauge,
        run: async (ctx) => {
          await ctx.say('Let’s weight what defines a good-fit account. Drag the sliders.');
          const v = await ctx.ask({
            title: 'Scoring weights',
            submitLabel: 'Apply scoring',
            summarize: (val) => `Weights — firmographic ${val.firmographic}, intent ${val.intent}, tech ${val.tech}.`,
            fields: [
              { key: 'firmographic', label: 'Firmographic fit', type: 'slider', min: 0, max: 100, step: 5, default: 60 },
              { key: 'intent', label: 'Intent signals', type: 'slider', min: 0, max: 100, step: 5, default: 30 },
              { key: 'tech', label: 'Technographic match', type: 'slider', min: 0, max: 100, step: 5, default: 10 },
            ],
          });
          const profile = listScoringProfiles()[0];
          if (profile) setAppliedProfileId(profile.id);
          await ctx.say(
            `Built a fit lens weighted ${v.firmographic} / ${v.intent} / ${v.tech} (firmographic / intent / tech) and applied it as “${
              profile ? profile.name : 'Custom fit'
            }”. The table is scoring now — sort by Fit Score to surface your best matches.`,
          );
        },
      },
      {
        id: 'save-segment',
        label: 'Save as a segment',
        category: 'Save',
        description: 'Snapshot the current view as a reusable segment — right here.',
        keywords: ['save segment', 'save as segment', 'save view', 'create segment', 'save this'],
        icon: Bookmark,
        run: async (ctx) => {
          await saveSegmentInline(ctx);
        },
      },
    ],
    seedHistory: [
      {
        title: 'Top IT spenders in my list',
        preview: 'Sorted by IT spend — Amazon, Apple and JPMorgan lead the universe.',
        ts: '1d ago',
      },
      {
        title: 'Enterprise fintech targets',
        preview: 'Filtered to 13 Banking & Financial Services accounts over $10B revenue.',
        ts: '4d ago',
      },
    ],
    suggestions: [
      {
        id: 'top-it-spend',
        label: 'Rank by IT spend',
        category: 'Rank & sort',
        description: 'Order the universe by IT spend to find where budget already exists.',
        icon: TrendingUp,
        thinking: 'Ranking by IT spend…',
        run: () => {
          setSort({ key: 'itSpend', dir: 'desc' });
          setPage(0);
          const ranked = [...allCompanies].sort(
            (a, b) => parseSpend(b.itSpend) - parseSpend(a.itSpend)
          );
          const top = ranked
            .slice(0, 3)
            .map((c) => `${c.name} (${c.itSpend})`)
            .join(', ');
          return `Sorted by IT spend, highest first. Top spenders: ${top}. These are where budget already exists for new tooling.`;
        },
      },
      {
        id: 'enterprise',
        label: 'Filter to enterprise ($10B+)',
        category: 'Filter',
        description: 'Keep only $10B+ revenue accounts and sort high to low.',
        icon: Building2,
        thinking: 'Filtering to enterprise accounts…',
        run: () => {
          const value = { min: '10B', max: '' };
          const n = applyFilterFromSpec('revenue', value);
          setSort({ key: 'revenue', dir: 'desc' });
          return `${n.toLocaleString()} companies in HG’s universe clear $10B+ in revenue. Added a Revenue filter and sorted high to low — your biggest-ticket targets are up top.`;
        },
      },
      {
        id: 'financial-vertical',
        label: 'Focus on Financial Services',
        category: 'Filter',
        description: 'Narrow to Banking & Financial Services accounts.',
        icon: DollarSign,
        thinking: 'Narrowing to Financial Services…',
        run: () => {
          const value = ['banking'];
          const n = applyFilterFromSpec('industry', value);
          return `Narrowed to ${n.toLocaleString()} Banking & Financial Services accounts. Add an intent or technographic filter next to find the ones actively evaluating.`;
        },
      },
      {
        id: 'apply-scoring',
        label: 'Score against my ICP',
        category: 'Score',
        description: 'Apply your ICP scoring profile to rank accounts by fit.',
        icon: Gauge,
        thinking: 'Applying your scoring profile…',
        run: () => {
          const profile = profiles[0];
          if (!profile) return 'No scoring profiles exist yet — build one in Scoring Profiles first.';
          setAppliedProfileId(profile.id);
          return `Now scoring every company with “${profile.name}”. The fit lens is live — sort or filter on Fit Score to push your best-match accounts to the top.`;
        },
      },
    ],
  });

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

        {/* Analyze market — opens the detailed analysis dashboard */}
        <button
          onClick={() => setAnalysisOpen(true)}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-primary/40 text-primary bg-primary/5 rounded-md hover:bg-primary/10 transition-colors"
        >
          <Sparkles size={12} /> Analyze market
        </button>

        {/* LIST / MATRIX view toggle */}
        <div className="inline-flex items-center rounded-md border border-border overflow-hidden">
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

      {/* Detailed market-analysis dashboard */}
      <MarketAnalysisDashboard
        open={analysisOpen}
        onClose={() => setAnalysisOpen(false)}
        companies={filteredCompanies}
        filters={filters}
        appliedProfile={appliedProfile}
        goals={marketGoals}
        goal={analysisGoal}
        goalDetail={analysisGoalDetail}
        onGoalChange={setAnalysisGoal}
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

// ─── Scoring Profiles ───────────────────────────────────────────────
//
// Canonical home for scoring authoring in the platform. Two sections:
//   1. System defaults — one per offering, auto-generated, read-only.
//      Customize → clones to a custom profile.
//   2. Your profiles  — custom profiles authored in MA. Apply to MA
//      segments AND attach to Sales Co-Pilot offerings.

function ProfileCard({ profile, onCustomize, onOpen }) {
  const isSystem = profile.kind === 'system';
  return (
    <div className="text-left bg-surface border border-border rounded-md p-4 hover:border-primary/30 hover:shadow-card transition-all">
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
            isSystem ? 'bg-text-muted/15' : 'bg-sky-500/10'
          }`}
        >
          <Gauge size={16} className={isSystem ? 'text-text-secondary' : 'text-sky-700 dark:text-sky-300'} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-text-primary">{profile.name}</h3>
            {isSystem ? (
              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-text-muted/15 text-text-secondary border border-border">
                System
              </span>
            ) : (
              <VisibilityBadge visibility={profile.visibility} />
            )}
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed mb-2">{profile.description}</p>
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {profile.dimensions.map((d) => (
              <span
                key={d}
                className="text-[10px] px-1.5 py-0.5 rounded bg-bg/40 text-text-secondary border border-border/60"
              >
                {d}
              </span>
            ))}
          </div>
          <div className="text-[10px] text-text-muted flex items-center gap-2 flex-wrap mb-2">
            <span>Owner: {profile.ownerName}</span>
            {profile.appliedSegmentCount > 0 && (
              <>
                <span>·</span>
                <span>
                  {profile.appliedSegmentCount} segment{profile.appliedSegmentCount === 1 ? '' : 's'}
                </span>
              </>
            )}
            {Array.isArray(profile.appliedOfferingIds) && profile.appliedOfferingIds.length > 0 && (
              <>
                <span>·</span>
                <span>
                  Attached to {profile.appliedOfferingIds.length} offering
                  {profile.appliedOfferingIds.length === 1 ? '' : 's'}
                </span>
              </>
            )}
            <span>·</span>
            <span>Updated {profile.updatedAt}</span>
          </div>
          <div className="flex items-center gap-2">
            {isSystem ? (
              <button
                onClick={onCustomize}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold border border-violet-500/40 text-violet-700 dark:text-violet-300 rounded hover:bg-violet-500/10"
              >
                <Sparkles size={10} /> Customize
              </button>
            ) : (
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold border border-border text-text-secondary rounded hover:border-primary/40 hover:text-primary"
              >
                Open builder
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketAnalyzerScoringProfilesRoute() {
  const [, setTick] = useState(0);
  const systemDefaults = listSystemDefaultProfiles();
  const customProfiles = listCustomProfiles();

  const handleCustomize = (profileId) => {
    const cloned = cloneProfileToCustom(profileId);
    if (cloned) {
      window.alert(
        `Created "${cloned.name}". The builder UI ships in the next iteration — for now you can attach this clone to any offering.`,
      );
      setTick((t) => t + 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <PageHeader
        title="Scoring Profiles"
        subtitle="Canonical home for scoring authoring. System defaults give every offering directional fit out of the box; create custom profiles to tailor scoring per offering or segment."
        primaryCta={
          <button
            onClick={() => window.alert('Profile builder ships in the next iteration.')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim transition-colors"
          >
            <Plus size={12} /> Create profile
          </button>
        }
      />

      {/* System defaults */}
      <div className="mb-7">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-[12px] uppercase tracking-wider font-semibold text-text-secondary">
            System defaults
          </h2>
          <span className="text-[11px] text-text-muted">
            {systemDefaults.length} default{systemDefaults.length === 1 ? '' : 's'} · one per offering · read-only
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {systemDefaults.map((p) => (
            <ProfileCard key={p.id} profile={p} onCustomize={() => handleCustomize(p.id)} />
          ))}
          {systemDefaults.length === 0 && (
            <div className="col-span-2 text-center text-text-muted text-sm py-6 bg-surface border border-dashed border-border rounded-md">
              No offerings configured yet — defaults are generated when an offering is created.
            </div>
          )}
        </div>
      </div>

      {/* Custom profiles */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-[12px] uppercase tracking-wider font-semibold text-text-secondary">
            Your profiles
          </h2>
          <span className="text-[11px] text-text-muted">
            {customProfiles.length} custom · author here, apply to segments + offerings
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {customProfiles.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              onOpen={() => window.alert(`Open ${p.name} (builder ships next iteration).`)}
            />
          ))}
          {customProfiles.length === 0 && (
            <div className="col-span-2 text-center text-text-muted text-sm py-6 bg-surface border border-dashed border-border rounded-md">
              No custom profiles yet. Customize a system default above, or create one from scratch.
            </div>
          )}
        </div>
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
