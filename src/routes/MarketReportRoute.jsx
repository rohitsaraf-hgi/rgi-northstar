import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Download, RefreshCw, Share2, Trash2, TrendingUp, Layers,
  Building2, Globe, Users, BarChart3, Target, AlertTriangle, ArrowRight,
  Sparkles, Award, Copy, Pencil,
} from 'lucide-react';
import { getReport, refreshReport, renameReport, deleteReport } from '../data/marketReportStore.js';
import { formatSpend, formatCount, TIER_META } from '../data/marketReport.js';
import { useToast } from '../context/ToastContext.jsx';

// -----------------------------------------------------------------------------
// Root route
// -----------------------------------------------------------------------------
export default function MarketReportRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tick, setTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const report = useMemo(() => getReport(id), [id, tick]);

  useEffect(() => {
    if (report && renaming) setNameDraft(report.name);
  }, [report, renaming]);

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <AlertTriangle size={20} className="mx-auto text-amber-500 mb-2" />
        <h1 className="text-lg font-semibold mb-2">Report not found</h1>
        <button
          onClick={() => navigate('/market-analyzer/reports')}
          className="text-primary text-xs hover:underline"
        >
          ← Back to reports
        </button>
      </div>
    );
  }

  const { snapshot } = report;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      refreshReport(id);
      setTick((t) => t + 1);
      setRefreshing(false);
      showToast('Report refreshed', 'success');
    }, 900);
  };

  const handleRename = () => {
    if (!nameDraft.trim()) return;
    renameReport(id, nameDraft.trim());
    setRenaming(false);
    setTick((t) => t + 1);
    showToast('Renamed', 'success');
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete report "${report.name}"?`)) return;
    deleteReport(id);
    navigate('/market-analyzer/reports');
    showToast('Report deleted', 'info');
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-6">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 mb-4">
        <button
          onClick={() => navigate('/market-analyzer/reports')}
          className="p-1.5 mt-1 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded transition-colors"
          title="Back to reports"
        >
          <ArrowLeft size={14} />
        </button>
        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center flex-shrink-0">
          <BarChart3 size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-text-muted mb-0.5">Market Analyzer · Sales play report</div>
          {renaming ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                className="text-xl font-semibold tracking-tight bg-surface border border-primary/40 rounded px-2 py-1 focus:outline-none focus:border-primary"
                autoFocus
              />
              <button onClick={handleRename} className="text-xs text-primary font-semibold">Save</button>
              <button onClick={() => setRenaming(false)} className="text-xs text-text-muted">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight">{report.name}</h1>
              <button onClick={() => setRenaming(true)} className="text-text-muted hover:text-text-primary p-1" title="Rename">
                <Pencil size={11} />
              </button>
            </div>
          )}
          <div className="text-[11px] text-text-muted mt-1 flex items-center gap-2 flex-wrap">
            <span>{snapshot.plays.length} play{snapshot.plays.length === 1 ? '' : 's'} analyzed</span>
            <span>·</span>
            <span>Last refreshed {relativeAgo(report.lastRefreshedAt)}</span>
            <span>·</span>
            <span>{report.ownerName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-2 transition-colors">
            <Download size={11} />
            Export
          </button>
          <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-2 transition-colors">
            <Share2 size={11} />
            Share
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 p-1.5 text-rose-600 dark:text-rose-400 border border-border rounded hover:bg-rose-500/10 transition-colors"
            title="Delete report"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* ─── Sticky ToC ────────────────────────────────────────── */}
        <nav className="w-40 flex-shrink-0 hidden lg:block">
          <div className="sticky top-4 space-y-1">
            <TocLink href="#executive-summary" label="Executive summary" />
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold px-2 pt-3 pb-1">Per play</div>
            {snapshot.plays.map((p) => (
              <TocLink key={p.id} href={`#play-${p.id}`} label={p.name} indent />
            ))}
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold px-2 pt-3 pb-1">Synthesis</div>
            <TocLink href="#comparison-matrix" label="Comparison matrix" indent />
            <TocLink href="#overlap-analysis"  label="Overlap"           indent />
            <TocLink href="#recommendation"    label="Recommendation"    indent />
            <TocLink href="#coverage-gaps"     label="Coverage gaps"     indent />
          </div>
        </nav>

        {/* ─── Body ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-8">
          <ExecutiveSummarySection summary={snapshot.executiveSummary} />
          {snapshot.plays.map((play, i) => (
            <PlaySection key={play.id} play={play} index={i} />
          ))}
          <ComparisonMatrixSection matrix={snapshot.crossPlay.comparisonMatrix} />
          <OverlapSection overlap={snapshot.crossPlay.overlap} plays={snapshot.plays} />
          <RecommendationSection recommendation={snapshot.crossPlay.recommendation} plays={snapshot.plays} />
          <CoverageGapsSection gaps={snapshot.crossPlay.coverageGaps} />
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Small utilities
// -----------------------------------------------------------------------------
function relativeAgo(iso) {
  if (!iso) return '—';
  try {
    const now = new Date('2026-08-20');
    const diff = now - new Date(iso);
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return '—';
  }
}

function TocLink({ href, label, indent }) {
  return (
    <a
      href={href}
      className={`block text-[11px] text-text-secondary hover:text-primary hover:bg-surface-2 rounded px-2 py-1 transition-colors ${indent ? 'pl-4' : ''}`}
    >
      {label}
    </a>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, id }) {
  return (
    <div id={id} className="flex items-start gap-3 mb-4 scroll-mt-4">
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-primary" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {subtitle && <div className="text-[11px] text-text-muted mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Section: Executive Summary
// -----------------------------------------------------------------------------
function ExecutiveSummarySection({ summary }) {
  return (
    <section>
      <SectionHeader
        id="executive-summary"
        icon={Sparkles}
        title="Executive summary"
        subtitle="At-a-glance market picture across selected plays"
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <SummaryStat label="Plays analyzed"          value={summary.playCount} />
        <SummaryStat label="Total qualified (A + B)" value={formatCount(summary.totalQualified)} />
        <SummaryStat label="Addressable IT spend"    value={formatSpend(summary.totalAddressableSpend)} />
        <SummaryStat label="Multi-play A-tier"       value={formatCount(summary.multiPlayCount)} hint="Accounts qualifying for 2+ plays" />
      </div>
      <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
        <div className="flex items-start gap-2">
          <Award size={14} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">Recommendation</div>
            <div className="text-sm text-text-primary font-semibold">Lead with {summary.leadWith}</div>
            <div className="text-[12px] text-text-secondary mt-0.5">{summary.leadWithReason}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryStat({ label, value, hint }) {
  return (
    <div className="bg-surface border border-border rounded p-3">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">{label}</div>
      <div className="text-lg font-semibold text-text-primary mt-1 leading-none">{value}</div>
      {hint && <div className="text-[10px] text-text-muted mt-1">{hint}</div>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Section: Per Play
// -----------------------------------------------------------------------------
function PlaySection({ play, index }) {
  const navigate = useNavigate();
  return (
    <section id={`play-${play.id}`} className="scroll-mt-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded bg-violet-500/10 flex items-center justify-center flex-shrink-0 text-[13px] font-bold text-violet-700 dark:text-violet-300">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-text-primary">{play.name}</h2>
            <button
              onClick={() => navigate(`/market-analyzer/scoring-profiles`)}
              className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
            >
              Edit profile <ArrowRight size={9} />
            </button>
          </div>
          <div className="text-[12px] text-text-secondary mt-0.5 leading-snug">{play.description}</div>
          {play.dimensions?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {play.dimensions.map((d) => (
                <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-bg/40 border border-border text-text-secondary">
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Play headline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <SummaryStat label="Universe" value={formatCount(play.universeSize)} />
        <SummaryStat label="Qualified (A+B)" value={formatCount(play.totalQualified)} />
        <SummaryStat label="Qualified spend" value={formatSpend(play.totalQualifiedSpend)} />
        <SummaryStat label="Total spend" value={formatSpend(play.totalSpend)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <TierDistributionCard play={play} />
        <IndustryMixCard industries={play.industryMix} />
        <SizeDistributionCard sizes={play.sizeDistribution} />
        <GeoDistributionCard geos={play.geoDistribution} />
      </div>

      <div className="mt-3 bg-surface border border-border rounded p-3">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">Top A-tier named accounts</div>
        <div className="flex flex-wrap gap-1.5">
          {play.topAccounts.map((n) => (
            <span key={n} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-primary bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {n}
            </span>
          ))}
          <button
            onClick={() => navigate('/market-analyzer/companies')}
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            See all {formatCount(play.tierDistribution[0].count)} A-tier accounts <ArrowRight size={9} />
          </button>
        </div>
      </div>
    </section>
  );
}

function TierDistributionCard({ play }) {
  const max = Math.max(...play.tierDistribution.map((t) => t.count));
  return (
    <div className="bg-surface border border-border rounded p-3">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">Tier distribution</div>
      <div className="space-y-1.5">
        {play.tierDistribution.map((t) => {
          const meta = TIER_META[t.id] || TIER_META.D;
          const pct = max ? (t.count / max) * 100 : 0;
          return (
            <div key={t.id} className="flex items-center gap-2">
              <span className={`text-[11px] font-bold w-4 ${meta.color}`}>{t.id}</span>
              <div className="flex-1 h-4 bg-bg/40 rounded relative overflow-hidden">
                <div
                  className="h-full rounded transition-all"
                  style={{ width: `${pct}%`, background: meta.accent }}
                />
              </div>
              <div className="text-[11px] font-mono text-text-secondary min-w-[100px] text-right">
                {formatCount(t.count)} · {formatSpend(t.spend)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarList({ items, valueKey, labelKey, formatValue }) {
  const max = Math.max(...items.map((i) => i[valueKey] || 0));
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => {
        const pct = max ? (item[valueKey] / max) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[11px] text-text-secondary min-w-[130px] truncate" title={item[labelKey]}>
              {item[labelKey]}
            </span>
            <div className="flex-1 h-3 bg-bg/40 rounded relative overflow-hidden">
              <div
                className="h-full rounded bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-text-muted min-w-[70px] text-right">
              {formatValue(item[valueKey])}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IndustryMixCard({ industries }) {
  return (
    <div className="bg-surface border border-border rounded p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Building2 size={11} className="text-text-muted" />
        <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Industry mix (by A+B spend)</div>
      </div>
      <BarList items={industries} valueKey="spend" labelKey="name" formatValue={formatSpend} />
    </div>
  );
}

function SizeDistributionCard({ sizes }) {
  return (
    <div className="bg-surface border border-border rounded p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Users size={11} className="text-text-muted" />
        <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Company size (A+B by spend)</div>
      </div>
      <BarList items={sizes} valueKey="spend" labelKey="band" formatValue={formatSpend} />
    </div>
  );
}

function GeoDistributionCard({ geos }) {
  return (
    <div className="bg-surface border border-border rounded p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Globe size={11} className="text-text-muted" />
        <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Geography (A+B by spend)</div>
      </div>
      <BarList items={geos} valueKey="spend" labelKey="country" formatValue={formatSpend} />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Section: Cross-play synthesis
// -----------------------------------------------------------------------------
function ComparisonMatrixSection({ matrix }) {
  return (
    <section>
      <SectionHeader
        id="comparison-matrix"
        icon={BarChart3}
        title="Play comparison matrix"
        subtitle="Side-by-side view of each play's headline metrics"
      />
      <div className="bg-surface border border-border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-bg/40 border-b border-border">
            <tr className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
              <th className="text-left px-3 py-2 font-semibold">Play</th>
              <th className="text-right px-3 py-2 font-semibold">A count</th>
              <th className="text-right px-3 py-2 font-semibold">A spend</th>
              <th className="text-right px-3 py-2 font-semibold">B count</th>
              <th className="text-right px-3 py-2 font-semibold">B spend</th>
              <th className="text-right px-3 py-2 font-semibold">Total qualified</th>
              <th className="text-right px-3 py-2 font-semibold">Total spend</th>
              <th className="text-right px-3 py-2 font-semibold">Avg A score</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-bg/30">
                <td className="px-3 py-2 text-sm font-semibold text-text-primary">{row.name}</td>
                <td className="px-3 py-2 text-right text-[12px] font-mono">{formatCount(row.aCount)}</td>
                <td className="px-3 py-2 text-right text-[12px] font-mono">{formatSpend(row.aSpend)}</td>
                <td className="px-3 py-2 text-right text-[12px] font-mono">{formatCount(row.bCount)}</td>
                <td className="px-3 py-2 text-right text-[12px] font-mono">{formatSpend(row.bSpend)}</td>
                <td className="px-3 py-2 text-right text-[12px] font-mono">{formatCount(row.qualified)}</td>
                <td className="px-3 py-2 text-right text-[12px] font-mono">{formatSpend(row.qualifiedSpend)}</td>
                <td className="px-3 py-2 text-right text-[12px] font-mono">{row.avgAScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OverlapSection({ overlap, plays }) {
  const nameById = new Map(plays.map((p) => [p.id, p.name]));
  return (
    <section>
      <SectionHeader
        id="overlap-analysis"
        icon={Copy}
        title="Overlap analysis"
        subtitle="A-tier accounts that qualify for multiple plays"
      />
      <div className="bg-primary/5 border border-primary/20 rounded p-3 mb-3">
        <div className="text-sm">
          <span className="font-semibold text-text-primary">{formatCount(overlap.multiPlayATotal)} A-tier accounts</span>
          <span className="text-text-secondary"> qualify for 2 or more plays — high-priority target pool</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {overlap.pairs.map((pair) => (
          <div key={pair.playAId + pair.playBId} className="bg-surface border border-border rounded p-3">
            <div className="text-[11px] text-text-secondary leading-snug">
              <span className="font-semibold text-text-primary">{pair.playAName}</span>
              <span className="text-text-muted"> × </span>
              <span className="font-semibold text-text-primary">{pair.playBName}</span>
            </div>
            <div className="text-lg font-semibold text-primary mt-1">{formatCount(pair.overlapCount)}</div>
            <div className="text-[10px] text-text-muted">A-tier accounts shared</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecommendationSection({ recommendation, plays }) {
  return (
    <section>
      <SectionHeader
        id="recommendation"
        icon={Award}
        title="Recommendation"
        subtitle="Which play to lead with · why"
      />
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded p-4">
        <div className="flex items-start gap-2 mb-3">
          <Target size={14} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300 mb-1">Lead with</div>
            <div className="text-base font-semibold text-text-primary">{recommendation.leadWith}</div>
            <div className="text-[12px] text-text-secondary mt-1">{recommendation.reason}</div>
          </div>
        </div>
        <div className="pt-3 border-t border-emerald-500/20">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">Ranked by A-tier density × spend</div>
          <ol className="space-y-1">
            {recommendation.ranked.map((name, i) => (
              <li key={name} className="flex items-center gap-2 text-[12px]">
                <span className={`text-[10px] font-bold w-4 ${i === 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-text-muted'}`}>
                  #{i + 1}
                </span>
                <span className={i === 0 ? 'font-semibold text-text-primary' : 'text-text-secondary'}>{name}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function CoverageGapsSection({ gaps }) {
  const hasGaps = (gaps.industries?.length || 0) + (gaps.geos?.length || 0) > 0;
  return (
    <section>
      <SectionHeader
        id="coverage-gaps"
        icon={AlertTriangle}
        title="Coverage gaps"
        subtitle="Industries or geographies underrepresented across all plays"
      />
      {!hasGaps ? (
        <div className="bg-surface border border-border rounded p-4 text-[12px] text-text-secondary">
          No obvious coverage gaps — the selected plays span the top industries and geographies together.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded p-3">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-300 mb-1.5">Industry gaps</div>
            {gaps.industries.length === 0 ? (
              <div className="text-[11px] text-text-secondary italic">All top industries covered</div>
            ) : (
              <ul className="space-y-1">
                {gaps.industries.map((n) => (
                  <li key={n} className="text-[12px] text-text-primary">· {n}</li>
                ))}
              </ul>
            )}
            <div className="text-[10px] text-text-muted mt-2">Appears in only one play's top-5 mix — consider a targeted play.</div>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded p-3">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-300 mb-1.5">Geography gaps</div>
            {gaps.geos.length === 0 ? (
              <div className="text-[11px] text-text-secondary italic">Geo coverage is broadly balanced</div>
            ) : (
              <ul className="space-y-1">
                {gaps.geos.map((n) => (
                  <li key={n} className="text-[12px] text-text-primary">· {n}</li>
                ))}
              </ul>
            )}
            <div className="text-[10px] text-text-muted mt-2">Appears in only one play's top-3 geos — consider a geo-focused play.</div>
          </div>
        </div>
      )}
    </section>
  );
}
