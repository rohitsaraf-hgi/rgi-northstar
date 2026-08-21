import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, RefreshCw, Trash2, MoreVertical, Search, ArrowRight, X, Check,
  BarChart3, Sparkles, Clock, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import {
  listReports, saveReport, refreshReport, deleteReport, subscribeReports,
} from '../data/marketReportStore.js';
import { listReportablePlays, formatCount, formatSpend } from '../data/marketReport.js';
import { useToast } from '../context/ToastContext.jsx';

// -----------------------------------------------------------------------------
// Root — list + picker modal
// -----------------------------------------------------------------------------
export default function MarketReportsListRoute() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tick, setTick] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    const unsub = subscribeReports(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reports = useMemo(() => listReports(), [tick]);
  const filtered = reports.filter(
    (r) => !searchQ || r.name.toLowerCase().includes(searchQ.toLowerCase()),
  );

  const handleNew = () => setPickerOpen(true);

  const handleGenerate = ({ name, profileIds }) => {
    const rpt = saveReport({ name, scoringProfileIds: profileIds });
    setPickerOpen(false);
    showToast('Report generated', 'success');
    navigate(`/market-analyzer/reports/${rpt.id}`);
  };

  const handleRefresh = (id) => {
    refreshReport(id);
    showToast('Report refreshed', 'success');
  };

  const handleDelete = (report) => {
    if (!window.confirm(`Delete "${report.name}"?`)) return;
    deleteReport(report.id);
    showToast('Deleted', 'info');
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center flex-shrink-0">
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <div className="text-xs text-text-muted mb-0.5">Market Analyzer · Reports</div>
            <h1 className="text-xl font-semibold tracking-tight">Sales play market reports</h1>
            <div className="text-sm text-text-secondary mt-1 max-w-2xl">
              Pick your configured sales plays, generate a detailed market analysis —
              TAM, tier distribution, industry + size + geo mix, cross-play overlap,
              and a recommendation on which play to lead with.
            </div>
          </div>
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-primary text-white rounded hover:bg-primary-dim transition-colors flex-shrink-0"
        >
          <Plus size={13} />
          New report
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search reports..."
            className="pl-7 pr-3 py-1.5 text-xs bg-surface border border-border rounded w-64 focus:outline-none focus:border-primary/50"
          />
        </div>
        <span className="text-[11px] text-text-muted ml-auto">{filtered.length} report{filtered.length === 1 ? '' : 's'}</span>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((r) => (
          <ReportRow
            key={r.id}
            report={r}
            onOpen={() => navigate(`/market-analyzer/reports/${r.id}`)}
            onRefresh={() => handleRefresh(r.id)}
            onDelete={() => handleDelete(r)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="bg-surface border border-dashed border-border rounded p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 mx-auto mb-2 flex items-center justify-center">
              <Sparkles size={16} className="text-primary" />
            </div>
            <div className="text-sm font-semibold text-text-primary mb-1">No reports yet</div>
            <div className="text-[12px] text-text-muted mb-3">
              Generate your first market analysis by picking up to 5 configured sales plays.
            </div>
            <button
              onClick={handleNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded hover:bg-primary-dim"
            >
              <Plus size={11} />
              New report
            </button>
          </div>
        )}
      </div>

      {pickerOpen && (
        <PlayPickerModal
          onClose={() => setPickerOpen(false)}
          onGenerate={handleGenerate}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Row
// -----------------------------------------------------------------------------
function ReportRow({ report, onOpen, onRefresh, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const totalQualified = report.snapshot?.executiveSummary?.totalQualified || 0;
  const totalSpend = report.snapshot?.executiveSummary?.totalAddressableSpend || 0;
  const playNames = report.snapshot?.scoringProfileNames || [];

  return (
    <div className="bg-surface border border-border rounded hover:border-primary/30 transition-colors relative">
      <button onClick={onOpen} className="w-full text-left p-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BarChart3 size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-text-primary">{report.name}</span>
              <span className="text-[10px] text-text-muted">·</span>
              <span className="text-[10px] text-text-muted">Refreshed {relativeAgo(report.lastRefreshedAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {playNames.slice(0, 5).map((n) => (
                <span key={n} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                  {n}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 text-[11px] text-text-secondary">
              <span><span className="font-semibold text-text-primary">{formatCount(totalQualified)}</span> qualified</span>
              <span><span className="font-semibold text-text-primary">{formatSpend(totalSpend)}</span> addressable spend</span>
              <span>{playNames.length} plays</span>
            </div>
          </div>
          <ArrowRight size={13} className="text-text-muted flex-shrink-0 mt-2" />
        </div>
      </button>
      <div className="absolute top-2 right-2">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
        >
          <MoreVertical size={13} />
        </button>
        {menuOpen && (
          <div
            onMouseLeave={() => setMenuOpen(false)}
            className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded shadow-lg z-10 py-1"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onRefresh(); setMenuOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-2 flex items-center gap-2"
            >
              <RefreshCw size={11} />
              Refresh snapshot
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-surface-2 flex items-center gap-2"
            >
              <Trash2 size={11} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return '—';
  }
}

// -----------------------------------------------------------------------------
// Play Picker Modal
// -----------------------------------------------------------------------------
function PlayPickerModal({ onClose, onGenerate }) {
  const allPlays = useMemo(() => listReportablePlays(), []);
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState('');

  const toggle = (id) => {
    if (selected.includes(id)) setSelected(selected.filter((s) => s !== id));
    else if (selected.length < 5) setSelected([...selected, id]);
  };

  const canGenerate = selected.length >= 1 && !generating;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !generating) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, generating]);

  const handleGenerate = () => {
    setGenerating(true);
    const phases = [
      'Aggregating tier distributions...',
      'Computing industry + size + geo mix...',
      'Calculating cross-play overlap...',
      'Building recommendations...',
    ];
    let step = 0;
    setPhase(phases[0]);
    const tick = setInterval(() => {
      step += 1;
      if (step >= phases.length) {
        clearInterval(tick);
        onGenerate({
          name: name.trim() || `Market analysis — ${new Date('2026-08-20').toLocaleDateString()}`,
          profileIds: selected,
        });
        return;
      }
      setPhase(phases[step]);
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">New market analysis report</div>
              <div className="text-[11px] text-text-muted">Pick 1–5 scoring profiles to compare</div>
            </div>
          </div>
          <button onClick={onClose} disabled={generating} className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-2 disabled:opacity-40">
            <X size={16} />
          </button>
        </div>

        {generating ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center mb-4 animate-pulse">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="text-sm font-semibold text-text-primary mb-1">Generating report...</div>
            <div className="text-[12px] text-text-muted italic">{phase}</div>
            <div className="text-[10px] text-text-muted mt-4">{selected.length} play{selected.length === 1 ? '' : 's'} · computing on the fly</div>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-1">Report name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q3 sales plays market analysis"
                className="w-full mb-4 px-2.5 py-1.5 text-sm bg-surface border border-border rounded focus:outline-none focus:border-primary/50"
              />

              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] uppercase tracking-wider font-semibold text-text-muted">Scoring profiles</label>
                <span className={`text-[11px] font-mono ${selected.length >= 5 ? 'text-amber-700 dark:text-amber-300' : 'text-text-muted'}`}>
                  {selected.length} / 5 selected
                </span>
              </div>

              <div className="space-y-1.5">
                {allPlays.map((p) => {
                  const isSelected = selected.includes(p.id);
                  const atCap = !isSelected && selected.length >= 5;
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggle(p.id)}
                      disabled={atCap}
                      className={`w-full text-left p-3 border rounded transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : atCap
                            ? 'border-border opacity-40 cursor-not-allowed'
                            : 'border-border hover:border-primary/40 hover:bg-surface-2'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-primary border-primary' : 'border-border'
                        }`}>
                          {isSelected && <Check size={9} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-text-primary">{p.name}</span>
                            {p.kind === 'system' && (
                              <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted bg-bg/40 px-1 py-0.5 rounded">System</span>
                            )}
                          </div>
                          <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">{p.description}</div>
                          {p.dimensions?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.dimensions.map((d) => (
                                <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-bg/40 border border-border text-text-secondary">
                                  {d}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <div className="text-[11px] text-text-muted flex items-center gap-1.5">
                <Clock size={11} />
                Estimated compute: ~2s
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-semibold text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Sparkles size={11} />
                  Generate report
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
