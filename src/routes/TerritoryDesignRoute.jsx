import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Compass,
  Network,
  Users,
  Search,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Building2,
  TrendingUp,
  Filter,
  Wand2,
  ChevronRight,
  X,
  Info,
  Briefcase,
  ScanSearch,
  Send,
  FileText,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { useTenant } from '../context/TenantContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import BookUploadModal from '../components/workbook/BookUploadModal.jsx';
import {
  getTerritoryState,
  subscribeTerritory,
  listSellers,
  getSeller,
  listBook,
  listDiscoveryBatches,
  listRules,
  runIcpQuery,
  createDiscoveryBatch,
  dismissDiscoveryBatch,
  proposeRouting,
  commitRouting,
  assignOwner,
  mergeBookRows,
  getCoverageStats,
  resetTerritoryState,
  ROLES,
  DEFAULT_TEAMS,
  updateStagedSeller,
  removeStagedSeller,
  sendInvitations,
} from '../data/territoryDesign.js';
import { WHITESPACE_ACCOUNTS } from '../data/whitespaceAccounts.js';
import { listOfferings } from '../data/offerings.js';

const TABS = [
  { id: 'book',       label: 'Book of Accounts', icon: Briefcase },
  { id: 'discovery',  label: 'ICP Discovery',    icon: Compass },
  { id: 'routing',    label: 'Routing & Rules',  icon: Network },
];

export default function TerritoryDesignRoute() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('book');
  const [, setTick] = useState(0);

  useEffect(() => subscribeTerritory(() => setTick((t) => t + 1)), []);

  const state = getTerritoryState();
  const coverage = getCoverageStats();
  const sellers = state.sellers;

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      {/* ─── Header ─── */}
      <div className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-text-muted mb-1">
                <button
                  onClick={() => navigate('/admin')}
                  className="hover:text-text-primary transition-colors"
                >
                  Admin Hub
                </button>
                <ChevronRight size={11} />
                <span>Territory Design</span>
              </div>
              <h1 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
                Territory Design
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                  No-CRM mode
                </span>
              </h1>
              <p className="text-sm text-text-secondary mt-1 max-w-2xl">
                Upload your book of accounts, discover whitespace with ICP-driven AI, and route new accounts to the right sellers — without a CRM connection.
              </p>
            </div>

            <CoverageSummary stats={coverage} sellers={sellers} />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
            <div className="ml-auto">
              <button
                onClick={() => {
                  if (confirm('Reset territory design state to seed data? This clears any unsaved work.')) {
                    resetTerritoryState();
                  }
                }}
                className="text-[11px] text-text-muted hover:text-text-secondary"
              >
                Reset demo state
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'book' && <BookTab state={state} sellers={sellers} />}
        {activeTab === 'discovery' && <DiscoveryTab state={state} sellers={sellers} />}
        {activeTab === 'routing' && <RoutingTab state={state} sellers={sellers} coverage={coverage} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Coverage summary (header right)
// ═══════════════════════════════════════════════════════════════════════════

function CoverageSummary({ stats, sellers }) {
  return (
    <div className="flex items-center gap-4 bg-surface-2/40 border border-border rounded-md px-4 py-2.5">
      <Stat label="Book size" value={stats.totalBook} />
      <div className="w-px h-8 bg-border/60" />
      <Stat label="Owners" value={`${stats.ownersWithBook}/${sellers.length}`} />
      <div className="w-px h-8 bg-border/60" />
      <Stat label="Needs review" value={stats.needsReview} tone={stats.needsReview > 0 ? 'amber' : 'default'} />
      <div className="w-px h-8 bg-border/60" />
      <Stat label="Imbalance" value={`±${stats.imbalance}`} tone={stats.imbalance > 5 ? 'amber' : 'default'} />
    </div>
  );
}

function Stat({ label, value, tone = 'default' }) {
  const toneClass = {
    default: 'text-text-primary',
    amber: 'text-amber-700 dark:text-amber-300',
    emerald: 'text-emerald-700 dark:text-emerald-300',
  }[tone];
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">{label}</span>
      <span className={`text-base font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 1 — Book of Accounts
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// Discovered Sellers panel — shows owners surfaced by CSV upload who aren't
// yet on the platform. Admin reviews role + team, then clicks Send Invitations
// to create their seller accounts and dispatch magic links.
// ═══════════════════════════════════════════════════════════════════════════

function DiscoveredSellersPanel({ stagedSellers }) {
  const selectedCount = stagedSellers.filter((s) => s.selectedForInvite).length;
  const teamCounts = stagedSellers.reduce((acc, s) => {
    if (!s.selectedForInvite) return acc;
    const team = DEFAULT_TEAMS.find((t) => t.audience === s.role);
    const teamId = team?.id || 'account_owners';
    acc[teamId] = (acc[teamId] || 0) + 1;
    return acc;
  }, {});

  function handleSend() {
    const emails = stagedSellers.filter((s) => s.selectedForInvite).map((s) => s.email);
    if (emails.length === 0) return;
    sendInvitations(emails);
  }

  return (
    <div className="bg-gradient-to-br from-emerald-500/5 via-primary/5 to-violet-500/5 border border-emerald-500/20 rounded-md p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-md bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
          <Send size={18} className="text-emerald-700 dark:text-emerald-300" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            {stagedSellers.length} sellers discovered from CSV upload
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
              Awaiting invite
            </span>
          </h2>
          <p className="text-[12px] text-text-secondary leading-relaxed mt-0.5 max-w-3xl">
            The CSV's <code className="bg-surface-2 text-text-primary px-1 py-0.5 rounded text-[11px] font-mono">owner_email</code> +{' '}
            <code className="bg-surface-2 text-text-primary px-1 py-0.5 rounded text-[11px] font-mono">owner_role</code>{' '}
            columns introduced these sellers. Review role / team assignment and send magic-link invitations. Each
            invitee's workbench will be pre-loaded with the accounts they own.
          </p>
        </div>
      </div>

      {/* Per-row review */}
      <div className="space-y-1.5 mb-3">
        {stagedSellers.map((seller) => (
          <StagedSellerRow key={seller.email} seller={seller} />
        ))}
      </div>

      {/* Send action footer */}
      <div className="flex items-center justify-between pt-3 border-t border-emerald-500/20">
        <div className="text-[11px] text-text-muted">
          {selectedCount > 0 ? (
            <span>
              <strong className="text-text-primary">{selectedCount}</strong> sellers selected →{' '}
              {Object.entries(teamCounts).map(([tid, count], i) => {
                const team = DEFAULT_TEAMS.find((t) => t.id === tid);
                return (
                  <span key={tid} className="text-text-secondary">
                    {i > 0 && ' · '}
                    {count} to <strong>{team?.name || tid}</strong>
                  </span>
                );
              })}
            </span>
          ) : (
            <span className="text-amber-700 dark:text-amber-300">Select at least one seller to invite</span>
          )}
        </div>
        <button
          disabled={selectedCount === 0}
          onClick={handleSend}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-500 disabled:opacity-40 transition-colors"
        >
          <Send size={11} />
          Send {selectedCount > 0 ? selectedCount : ''} {selectedCount === 1 ? 'invitation' : 'invitations'}
        </button>
      </div>
    </div>
  );
}

function StagedSellerRow({ seller }) {
  const team = DEFAULT_TEAMS.find((t) => t.audience === seller.role);
  return (
    <div className="bg-surface border border-border rounded p-2.5 flex items-center gap-3">
      <input
        type="checkbox"
        checked={seller.selectedForInvite}
        onChange={(e) => updateStagedSeller(seller.email, { selectedForInvite: e.target.checked })}
        className="w-3.5 h-3.5 accent-emerald-600 flex-shrink-0"
      />
      <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] flex items-center justify-center font-semibold flex-shrink-0">
        {seller.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-12 gap-3 items-center">
        <div className="col-span-3">
          <div className="text-[12px] font-medium text-text-primary truncate">{seller.name}</div>
          <div className="text-[11px] text-text-muted truncate">{seller.email}</div>
        </div>
        <div className="col-span-2">
          <select
            value={seller.role}
            onChange={(e) => updateStagedSeller(seller.email, { role: e.target.value })}
            className="text-[11px] bg-bg/40 border border-border rounded px-1.5 py-1 w-full text-text-primary focus:border-primary/40 focus:outline-none"
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="col-span-3 text-[11px] text-text-secondary flex items-center gap-1">
          <ArrowRight size={10} className="text-text-muted" />
          <span className="font-semibold text-text-primary">{team?.name || 'Account Owners'}</span>
          <span className="text-text-muted">team</span>
        </div>
        <div className="col-span-2 text-[11px] text-text-muted">
          {seller.region}
        </div>
        <div className="col-span-2 text-[11px] text-text-secondary text-right">
          <strong className="text-text-primary">{seller.accountCount}</strong>{' '}
          {seller.accountCount === 1 ? 'account' : 'accounts'}
        </div>
      </div>
      <button
        onClick={() => removeStagedSeller(seller.email)}
        className="text-text-muted hover:text-rose-600 flex-shrink-0"
        title="Remove from invitation queue"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function BookTab({ state, sellers }) {
  const [showUpload, setShowUpload] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOwner, setFilterOwner] = useState('all');
  const [adminUploadOpen, setAdminUploadOpen] = useState(false);
  const { tenant, upsertTenant } = useTenant();
  const { showToast } = useToast();
  const allowSellerUpload = tenant?.policies?.allowSellerBookUpload !== false;

  const filtered = state.book.filter((row) => {
    if (filterStatus !== 'all' && row.status !== filterStatus) return false;
    if (filterOwner !== 'all' && row.ownerSellerId !== filterOwner) return false;
    return true;
  });

  const needsReview = state.book.filter((r) => r.status === 'needs_review' || r.status === 'duplicate');
  const stagedSellers = state.stagedSellers || [];

  const toggleSellerUpload = (next) => {
    upsertTenant({
      ...tenant,
      policies: { ...(tenant?.policies || {}), allowSellerBookUpload: next },
    });
    showToast(
      next
        ? 'Sellers can now upload their own book'
        : 'Seller upload disabled — admins control the book',
      'success',
    );
  };

  return (
    <div className="space-y-6">
      {/* Book of Accounts — canonical admin card. Mirrors the ZoomInfo
          pattern: the action you're permitting sits adjacent to the
          permission that gates it. This is the single home for the
          seller-upload policy. */}
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        <div className="px-5 py-4 flex items-start gap-4">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-text-primary">Book of Accounts</h2>
            <p className="text-[12px] text-text-secondary leading-relaxed mt-0.5 max-w-2xl">
              Manage the master book — upload via CSV (account_name, account_owner_email),
              extract owners, and route accounts. Owners must be existing platform users.
            </p>
          </div>
          <button
            onClick={() => setAdminUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dim transition-colors flex-shrink-0"
          >
            <Upload size={12} />
            {state.book.length > 0 ? 'Replace book' : 'Upload book CSV'}
          </button>
        </div>
        <div className="border-t border-border/70 px-5 py-3 bg-bg/30">
          <label htmlFor="allow-seller-upload" className="flex items-start gap-3 cursor-pointer">
            <input
              id="allow-seller-upload"
              type="checkbox"
              checked={allowSellerUpload}
              onChange={(e) => toggleSellerUpload(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={11} className="text-text-muted flex-shrink-0" />
                <span className="text-[12px] font-semibold text-text-primary">
                  Allow sellers to upload their own book of accounts
                </span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed mt-0.5">
                When ON, sellers see an Upload button on their Workbook and can bring their
                own accounts via CSV (account_name, account_domain). Every uploaded row is
                auto-assigned to the uploading seller.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Auxiliary upload affordance — kept for the inline ER + history flow */}
      {showUpload ? (
        <UploadPanel onClose={() => setShowUpload(false)} />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setShowUpload(true)}
            className="bg-surface border border-dashed border-border hover:border-primary/40 rounded-md p-5 text-left transition-all group"
          >
            <Upload size={18} className="text-primary mb-2" />
            <div className="text-sm font-semibold text-text-primary mb-1">Inline upload (with ER preview)</div>
            <div className="text-[12px] text-text-secondary leading-relaxed">
              Demo flow showing entity-resolution + duplicate detection inline.
            </div>
            <div className="text-[11px] text-primary mt-2 flex items-center gap-1">
              Start upload <ArrowRight size={11} />
            </div>
          </button>

          <ReviewQueueCard count={needsReview.length} onClick={() => setFilterStatus('needs_review')} />
          <UploadHistoryCard history={state.uploadHistory} />
        </div>
      )}

      {/* Admin upload modal — same component the Workbook uses. */}
      <BookUploadModal
        open={adminUploadOpen}
        onClose={() => setAdminUploadOpen(false)}
        hasExistingBook={state.book.length > 0}
        existingBookSize={state.book.length}
        onComplete={(summary) => {
          setAdminUploadOpen(false);
          showToast(
            `${summary.replaced ? 'Replaced' : 'Imported'} ${summary.matchedAccounts} accounts${
              summary.skippedAccounts ? ` · ${summary.skippedAccounts} skipped` : ''
            }`,
            'success',
          );
        }}
      />

      {/* Discovered sellers panel — appears when the latest CSV upload
          surfaced owner emails that aren't yet on the platform. Admin reviews
          and clicks "Send invitations" to create seller accounts. */}
      {stagedSellers.length > 0 && (
        <DiscoveredSellersPanel stagedSellers={stagedSellers} />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <Filter size={11} />
          <span>Filter:</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-[12px] bg-surface border border-border rounded px-2 py-1"
        >
          <option value="all">All statuses</option>
          <option value="high_confidence">High confidence</option>
          <option value="needs_review">Needs review</option>
          <option value="duplicate">Duplicate</option>
        </select>
        <select
          value={filterOwner}
          onChange={(e) => setFilterOwner(e.target.value)}
          className="text-[12px] bg-surface border border-border rounded px-2 py-1"
        >
          <option value="all">All owners</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div className="ml-auto text-[11px] text-text-muted">
          {filtered.length} of {state.book.length} accounts
        </div>
      </div>

      {/* Book table */}
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg/40 border-b border-border text-[11px] uppercase tracking-wider text-text-muted">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">Account</th>
              <th className="text-left px-3 py-2 font-semibold">Industry</th>
              <th className="text-left px-3 py-2 font-semibold">Employees</th>
              <th className="text-left px-3 py-2 font-semibold">Revenue</th>
              <th className="text-left px-3 py-2 font-semibold">Owner</th>
              <th className="text-left px-3 py-2 font-semibold">Source</th>
              <th className="text-left px-3 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <BookRow key={row.rowId} row={row} sellers={sellers} />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-text-muted text-sm py-8">
                  No accounts match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BookRow({ row, sellers }) {
  const owner = row.ownerSellerId ? getSeller(row.ownerSellerId) : null;
  const [editing, setEditing] = useState(false);

  const statusChip = {
    high_confidence: { label: 'Resolved', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
    needs_review:    { label: 'Needs review', color: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30' },
    duplicate:       { label: 'Duplicate', color: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/30' },
    unmatched:       { label: 'Unmatched', color: 'text-text-muted bg-text-muted/10 border-border' },
  }[row.status] || { label: row.status, color: 'text-text-muted' };

  const sourceChip = {
    csv:                { label: 'CSV', color: 'text-text-secondary bg-surface-2' },
    whitespace_routed:  { label: '✨ Routed', color: 'text-violet-700 dark:text-violet-300 bg-violet-500/10' },
    manual:             { label: 'Manual', color: 'text-text-secondary bg-surface-2' },
  }[row.source] || { label: row.source, color: 'text-text-muted' };

  return (
    <>
      <tr className="border-b border-border/60 hover:bg-bg/40">
        <td className="px-3 py-2">
          <div className="font-medium text-text-primary text-[13px]">{row.csvAccountName}</div>
          <div className="text-[11px] text-text-muted">{row.csvDomain}</div>
        </td>
        <td className="px-3 py-2 text-[12px] text-text-secondary">{row.industry || <em className="text-text-muted">—</em>}</td>
        <td className="px-3 py-2 text-[12px] text-text-secondary">{row.employees ? row.employees.toLocaleString() : <em className="text-text-muted">—</em>}</td>
        <td className="px-3 py-2 text-[12px] text-text-secondary">{row.revenue || <em className="text-text-muted">—</em>}</td>
        <td className="px-3 py-2">
          {owner ? (
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-1.5 text-[12px] text-text-primary hover:text-primary group"
            >
              <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center font-semibold">
                {owner.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </span>
              {owner.name}
            </button>
          ) : (
            <button
              onClick={() => setEditing(!editing)}
              className="text-[12px] text-amber-700 dark:text-amber-300 hover:underline"
            >
              Unassigned · Assign
            </button>
          )}
        </td>
        <td className="px-3 py-2">
          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold ${sourceChip.color}`}>
            {sourceChip.label}
          </span>
        </td>
        <td className="px-3 py-2">
          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-semibold ${statusChip.color}`}>
            {statusChip.label}
          </span>
        </td>
      </tr>
      {editing && (
        <tr className="bg-bg/40 border-b border-border/60">
          <td colSpan={7} className="px-3 py-3">
            <BookRowEditor row={row} sellers={sellers} onClose={() => setEditing(false)} />
          </td>
        </tr>
      )}
    </>
  );
}

function BookRowEditor({ row, sellers, onClose }) {
  return (
    <div className="space-y-3">
      {row.aiSuggestion && (
        <div className="bg-violet-500/5 border border-violet-500/20 rounded p-3 text-[12px]">
          <div className="flex items-center gap-1.5 text-violet-700 dark:text-violet-300 font-semibold mb-1">
            <Sparkles size={11} />
            AI suggestion
          </div>
          <div className="text-text-secondary leading-relaxed">{row.aiSuggestion.reason}</div>
          {row.aiSuggestion.candidates && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {row.aiSuggestion.candidates.map((c, i) => (
                <button key={i} className="text-[11px] bg-surface border border-border rounded px-2 py-0.5 hover:border-primary/40">
                  {c}
                </button>
              ))}
            </div>
          )}
          {row.aiSuggestion.mergeWith && (
            <button
              onClick={() => mergeBookRows(row.aiSuggestion.mergeWith, row.rowId)}
              className="text-[11px] mt-2 px-2 py-1 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 hover:bg-violet-500/25 font-semibold"
            >
              Merge with row {row.aiSuggestion.mergeWith}
            </button>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 text-[12px]">
        <span className="text-text-muted">Assign to:</span>
        {sellers.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              assignOwner(row.rowId, s.id);
              onClose();
            }}
            className={`px-2 py-0.5 rounded border text-[11px] ${
              row.ownerSellerId === s.id
                ? 'bg-primary/15 text-primary border-primary/40'
                : 'bg-surface border-border hover:border-primary/30 text-text-secondary'
            }`}
          >
            {s.name}
          </button>
        ))}
        <button onClick={onClose} className="ml-auto text-[11px] text-text-muted hover:text-text-primary">
          Close
        </button>
      </div>
    </div>
  );
}

function ReviewQueueCard({ count, onClick }) {
  if (count === 0) {
    return (
      <div className="bg-surface border border-border rounded-md p-5">
        <CheckCircle2 size={18} className="text-emerald-600 mb-2" />
        <div className="text-sm font-semibold text-text-primary mb-1">All resolved</div>
        <div className="text-[12px] text-text-secondary">No rows need your review right now.</div>
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      className="bg-surface border border-amber-500/30 hover:border-amber-500/50 rounded-md p-5 text-left transition-all"
    >
      <AlertTriangle size={18} className="text-amber-600 mb-2" />
      <div className="text-sm font-semibold text-text-primary mb-1">{count} rows need review</div>
      <div className="text-[12px] text-text-secondary leading-relaxed">
        AI flagged duplicates, unmatched entities, and unknown owner emails.
      </div>
      <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-2 flex items-center gap-1">
        Review now <ArrowRight size={11} />
      </div>
    </button>
  );
}

function UploadHistoryCard({ history }) {
  const latest = history[0];
  if (!latest) {
    return (
      <div className="bg-surface border border-border rounded-md p-5">
        <FileText size={18} className="text-text-muted mb-2" />
        <div className="text-sm font-semibold text-text-primary mb-1">No uploads yet</div>
        <div className="text-[12px] text-text-secondary">Upload your first CSV to seed the tenant book.</div>
      </div>
    );
  }
  return (
    <div className="bg-surface border border-border rounded-md p-5">
      <FileText size={18} className="text-text-muted mb-2" />
      <div className="text-sm font-semibold text-text-primary mb-1 truncate">{latest.filename}</div>
      <div className="text-[11px] text-text-secondary mb-2">
        {new Date(latest.uploadedAt).toLocaleDateString()} · {latest.uploadedBy}
      </div>
      <div className="text-[11px] text-text-secondary leading-relaxed">
        {latest.totalRows} rows · {latest.resolved} resolved · {latest.needsReview + latest.duplicates} flagged
      </div>
    </div>
  );
}

function UploadPanel({ onClose }) {
  // Demo: just simulates parsing the CSV — no real file processing.
  const [stage, setStage] = useState('idle'); // idle | parsing | resolved
  const [progress, setProgress] = useState(0);

  function simulateParse() {
    setStage('parsing');
    setProgress(0);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / 2200) * 100));
      setProgress(pct);
      if (pct < 100) requestAnimationFrame(tick);
      else setStage('resolved');
    };
    requestAnimationFrame(tick);
  }

  return (
    <div className="bg-surface border border-border rounded-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Upload size={15} /> Upload Book CSV
          </h2>
          <p className="text-[12px] text-text-secondary mt-0.5">
            Required columns: <code className="bg-surface-2 px-1 py-0.5 rounded">owner_email</code>, <code className="bg-surface-2 px-1 py-0.5 rounded">account_name</code>, <code className="bg-surface-2 px-1 py-0.5 rounded">account_domain</code>
          </p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X size={16} />
        </button>
      </div>

      {stage === 'idle' && (
        <div className="bg-bg/40 border border-dashed border-border rounded p-8 text-center">
          <Upload size={28} className="text-text-muted mx-auto mb-2" />
          <div className="text-sm text-text-secondary mb-3">Drop your CSV here, or click to browse</div>
          <button
            onClick={simulateParse}
            className="text-[12px] px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 font-semibold"
          >
            Use demo file (wiz-master-book-2026-06.csv)
          </button>
        </div>
      )}

      {stage === 'parsing' && (
        <div className="bg-bg/40 border border-border rounded p-8">
          <div className="flex items-center gap-2 text-[12px] text-text-secondary mb-3">
            <Sparkles size={12} className="text-violet-500 animate-pulse" />
            Entity Resolution Agent matching {`{name, domain}`} → HG entities…
          </div>
          <div className="h-2 bg-surface-2 rounded overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-[11px] text-text-muted mt-2">{progress}%</div>
        </div>
      )}

      {stage === 'resolved' && (
        <div className="space-y-3">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded p-4">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-[13px] mb-1">
              <CheckCircle2 size={13} /> Resolution complete
            </div>
            <div className="text-[12px] text-text-secondary leading-relaxed">
              <strong>15 rows</strong> processed · <strong>12 high-confidence</strong> matches ·
              <strong className="text-amber-700 dark:text-amber-300 ml-1">2 need review</strong> ·
              <strong className="text-rose-700 dark:text-rose-300 ml-1">1 duplicate</strong> ·
              <strong className="text-emerald-700 dark:text-emerald-300 ml-1">5 new sellers</strong> awaiting invite
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-[12px]">
            <Insight icon={CheckCircle2} tone="emerald" title="Matched accounts">
              JPMorgan, Salesforce, Adobe, Snowflake, UnitedHealth, Anthem +6 others matched to HG entities by name+domain (≥0.95 confidence).
            </Insight>
            <Insight icon={Send} tone="emerald" title="5 sellers discovered">
              <code className="bg-surface-2 text-text-primary px-1 py-0 rounded text-[10px] font-mono">owner_role</code> column auto-assigned 4 to Account Owners, 1 to SDRs. Send invitations from the Discovered Sellers panel below.
            </Insight>
            <Insight icon={AlertTriangle} tone="amber" title="2 rows need review">
              Acme Corp / Acme Corporation duplicate · Northrop owner email "unknown@wiz.io" unresolved.
            </Insight>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={onClose} className="text-[12px] px-3 py-1.5 rounded border border-border hover:border-primary/30 text-text-secondary">
              Close · Review later
            </button>
            <button onClick={onClose} className="text-[12px] px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 font-semibold">
              Accept · Open review queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Insight({ icon: Icon, tone, title, children }) {
  const toneClass = {
    emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
    amber: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300',
  }[tone];
  return (
    <div className={`border rounded p-3 ${toneClass}`}>
      <div className="flex items-center gap-1.5 font-semibold mb-1">
        <Icon size={11} />
        {title}
      </div>
      <div className="text-text-secondary text-[11px] leading-relaxed">{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 2 — ICP Discovery
// ═══════════════════════════════════════════════════════════════════════════

function DiscoveryTab({ state, sellers }) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [openBatchId, setOpenBatchId] = useState(null);

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-md p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-md bg-violet-500/10 flex items-center justify-center">
            <Compass size={18} className="text-violet-700 dark:text-violet-300" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-text-primary mb-1">ICP-driven whitespace discovery</h2>
            <p className="text-[13px] text-text-secondary leading-relaxed max-w-3xl">
              Define an Ideal Customer Profile (industry, size, region, technographics, intent). The system scans HG's universe for matches you don't already own and proposes a candidate batch — with rationale per account — that you can route to sellers.
            </p>
          </div>
          <button
            onClick={() => setShowBuilder(!showBuilder)}
            className="text-[12px] px-3 py-1.5 rounded bg-violet-600 text-white hover:bg-violet-500 font-semibold flex items-center gap-1.5"
          >
            <ScanSearch size={13} /> New ICP query
          </button>
        </div>
      </div>

      {showBuilder && (
        <IcpQueryBuilder
          onClose={() => setShowBuilder(false)}
          onCreated={(batchId) => {
            setShowBuilder(false);
            setOpenBatchId(batchId);
          }}
        />
      )}

      {/* Batches list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Recent discovery batches</h3>
          <span className="text-[11px] text-text-muted">{state.discoveryBatches.length} batches</span>
        </div>
        {state.discoveryBatches.map((batch) => (
          <BatchCard
            key={batch.id}
            batch={batch}
            isOpen={openBatchId === batch.id}
            onToggle={() => setOpenBatchId(openBatchId === batch.id ? null : batch.id)}
            sellers={sellers}
          />
        ))}
        {state.discoveryBatches.length === 0 && (
          <div className="text-center text-text-muted text-sm py-8 bg-surface border border-border rounded-md">
            No discovery batches yet. Create your first ICP query above.
          </div>
        )}
      </div>
    </div>
  );
}

function IcpQueryBuilder({ onClose, onCreated }) {
  const offerings = listOfferings();
  const [offeringId, setOfferingId] = useState(offerings[0]?.id || '');
  const [industries, setIndustries] = useState([]);
  const [employeesMin, setEmployeesMin] = useState('');
  const [employeesMax, setEmployeesMax] = useState('');
  const [regions, setRegions] = useState([]);
  const [revenueMin, setRevenueMin] = useState('');
  const [tech, setTech] = useState([]);

  const selectedOffering = offerings.find((o) => o.id === offeringId);

  // Pre-fill ICP filters from the selected offering's targetICP
  useEffect(() => {
    if (!selectedOffering) return;
    const icp = selectedOffering.targetICP || {};
    if (icp.industries) setIndustries(icp.industries);
    const empMatch = (icp.employees || '').match(/(\d+)/);
    if (empMatch) setEmployeesMin(empMatch[1]);
    if (selectedOffering.complementaryTech) setTech(selectedOffering.complementaryTech.slice(0, 3));
  }, [offeringId]);

  const filters = {
    offeringId,
    industries,
    employeesMin: employeesMin ? parseInt(employeesMin, 10) : null,
    employeesMax: employeesMax ? parseInt(employeesMax, 10) : null,
    regions,
    revenueMin: revenueMin ? parseFloat(revenueMin) * 1_000_000_000 : null,
    complementaryTech: tech,
    excludeCompetitors: [],
    requireIntentTopics: [],
  };

  const livePreview = useMemo(() => runIcpQuery(filters), [
    offeringId,
    industries.join(','),
    employeesMin,
    employeesMax,
    regions.join(','),
    revenueMin,
    tech.join(','),
  ]);

  return (
    <div className="bg-surface border border-violet-500/30 rounded-md p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 font-semibold">
          <Wand2 size={14} /> Build an ICP query
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X size={15} />
        </button>
      </div>

      {/* Offering picker — prefills the ICP */}
      <div>
        <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold block mb-1.5">
          Anchor to offering
        </label>
        <div className="flex flex-wrap gap-1.5">
          {offerings.map((o) => (
            <button
              key={o.id}
              onClick={() => setOfferingId(o.id)}
              className={`text-[12px] px-2.5 py-1 rounded border ${
                offeringId === o.id
                  ? 'bg-primary/15 text-primary border-primary/40 font-semibold'
                  : 'bg-surface border-border text-text-secondary hover:border-primary/30'
              }`}
            >
              {o.name}
            </button>
          ))}
        </div>
        {selectedOffering && (
          <div className="text-[11px] text-text-muted mt-1.5">
            Pre-filled from {selectedOffering.name} target ICP — edit any filter below.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Industries */}
        <ChipsField
          label="Industries"
          values={industries}
          onChange={setIndustries}
          options={['Banking and Financial Services', 'Technology', 'Healthcare', 'Retail', 'Telecommunications', 'Defense', 'Financial Technology', 'Insurance', 'Manufacturing']}
        />

        {/* Regions */}
        <ChipsField
          label="Regions"
          values={regions}
          onChange={setRegions}
          options={['US-East', 'US-West', 'US-All', 'AMER']}
        />

        {/* Employees */}
        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold block">Employees</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={employeesMin}
              onChange={(e) => setEmployeesMin(e.target.value)}
              className="text-[12px] bg-surface border border-border rounded px-2 py-1 w-24"
            />
            <span className="text-text-muted text-[11px]">to</span>
            <input
              type="number"
              placeholder="Max"
              value={employeesMax}
              onChange={(e) => setEmployeesMax(e.target.value)}
              className="text-[12px] bg-surface border border-border rounded px-2 py-1 w-24"
            />
          </div>
        </div>

        {/* Revenue */}
        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold block">Revenue ≥ ($B)</label>
          <input
            type="number"
            step="0.1"
            placeholder="e.g. 1"
            value={revenueMin}
            onChange={(e) => setRevenueMin(e.target.value)}
            className="text-[12px] bg-surface border border-border rounded px-2 py-1 w-24"
          />
        </div>

        {/* Complementary tech */}
        <div className="col-span-2">
          <ChipsField
            label="Complementary tech (e.g. AWS, Azure)"
            values={tech}
            onChange={setTech}
            options={['AWS', 'Azure', 'GCP', 'Kubernetes', 'Terraform', 'Snowflake', 'Okta']}
          />
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-bg/40 border border-border rounded p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Live preview</div>
          <div className="text-[12px] text-text-primary font-semibold">{livePreview.length} matches</div>
        </div>
        <div className="space-y-1">
          {livePreview.slice(0, 5).map((acc) => (
            <div key={acc.id} className="flex items-center gap-2 text-[12px]">
              <Building2 size={11} className="text-text-muted" />
              <span className="text-text-primary">{acc.name}</span>
              <span className="text-text-muted text-[11px]">· {acc.industry}</span>
              <span className="text-text-muted text-[11px] ml-auto">{acc.fai?.employees} · {acc.fai?.revenue}</span>
            </div>
          ))}
          {livePreview.length > 5 && (
            <div className="text-[11px] text-text-muted text-center pt-1">+{livePreview.length - 5} more</div>
          )}
          {livePreview.length === 0 && (
            <div className="text-[11px] text-text-muted text-center py-2">
              No matches. Loosen filters to see candidates.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button onClick={onClose} className="text-[12px] px-3 py-1.5 rounded border border-border hover:border-primary/30 text-text-secondary">
          Cancel
        </button>
        <button
          disabled={livePreview.length === 0}
          onClick={() => {
            const name = selectedOffering
              ? `${selectedOffering.name} · ${industries[0] || 'All industries'} · ${regions[0] || 'All regions'}`
              : 'Custom ICP query';
            createDiscoveryBatch(filters, name);
            const newId = `batch-${Date.now()}`; // optimistic; actual id is set inside store
            onCreated(newId);
          }}
          className="text-[12px] px-3 py-1.5 rounded bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 font-semibold flex items-center gap-1.5"
        >
          <Sparkles size={11} /> Create batch ({livePreview.length})
        </button>
      </div>
    </div>
  );
}

function ChipsField({ label, values, onChange, options }) {
  function toggle(v) {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  }
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold block">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`text-[11px] px-2 py-0.5 rounded border ${
              values.includes(opt)
                ? 'bg-primary/15 text-primary border-primary/40 font-semibold'
                : 'bg-surface border-border text-text-secondary hover:border-primary/30'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function BatchCard({ batch, isOpen, onToggle, sellers }) {
  const accounts = batch.resultIds.map((id) => WHITESPACE_ACCOUNTS.find((a) => a.id === id)).filter(Boolean);
  const [proposals, setProposals] = useState(null);

  function loadProposals() {
    setProposals(proposeRouting(batch.resultIds));
  }

  function commit() {
    if (!proposals) return;
    commitRouting(proposals);
    dismissDiscoveryBatch(batch.id);
  }

  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 hover:bg-bg/40 transition-colors flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded bg-violet-500/10 flex items-center justify-center flex-shrink-0">
          <Compass size={13} className="text-violet-700 dark:text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text-primary truncate">{batch.name}</div>
          <div className="text-[11px] text-text-muted truncate">{batch.rationale}</div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-text-muted">
          <span><strong className="text-text-primary">{accounts.length}</strong> matches</span>
          <span>{new Date(batch.createdAt).toLocaleDateString()}</span>
          <ChevronRight size={12} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border bg-bg/40 p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {accounts.map((acc) => (
              <div key={acc.id} className="bg-surface border border-border rounded p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center" style={{ background: acc.logoColor + '33', color: acc.logoColor }}>
                    {acc.name.split(' ')[0][0]}
                  </div>
                  <div className="text-[12px] font-semibold text-text-primary truncate">{acc.name}</div>
                </div>
                <div className="text-[11px] text-text-muted mb-1">{acc.industry}</div>
                <div className="text-[11px] text-text-secondary">{acc.fai?.employees} · {acc.fai?.revenue}</div>
                {batch.offeringId && acc.fits?.[batch.offeringId] && (
                  <div className="text-[10px] text-violet-700 dark:text-violet-300 mt-1.5 font-semibold">
                    Fit {acc.fits[batch.offeringId].score} · {batch.offeringId}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!proposals && (
            <button
              onClick={loadProposals}
              className="text-[12px] px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 font-semibold flex items-center gap-1.5"
            >
              <Network size={12} /> Propose routing
            </button>
          )}

          {proposals && (
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Routing Agent proposals</div>
              <div className="space-y-1.5">
                {proposals.map((p) => {
                  const acc = accounts.find((a) => a.id === p.accountId);
                  const owner = p.ownerSellerId ? getSeller(p.ownerSellerId) : null;
                  return (
                    <div key={p.accountId} className="flex items-start gap-3 bg-surface border border-border rounded p-2.5">
                      <Building2 size={13} className="text-text-muted mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-text-primary font-semibold">{acc?.name}</div>
                        <div className="text-[11px] text-text-secondary leading-relaxed">{p.rationale}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ArrowRight size={11} className="text-text-muted" />
                        {owner ? (
                          <div className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/30 rounded px-2 py-0.5 text-[11px] font-semibold">
                            <span className="w-4 h-4 rounded-full bg-primary/20 text-[9px] flex items-center justify-center">
                              {owner.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </span>
                            {owner.name}
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 dark:text-amber-300">Unassigned</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => dismissDiscoveryBatch(batch.id)}
                  className="text-[11px] px-2.5 py-1 rounded border border-border hover:border-primary/30 text-text-secondary"
                >
                  Dismiss batch
                </button>
                <button
                  onClick={commit}
                  className="text-[12px] px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500 font-semibold flex items-center gap-1.5"
                >
                  <Send size={11} /> Add {proposals.filter((p) => p.ownerSellerId).length} to book
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 3 — Routing & Rules
// ═══════════════════════════════════════════════════════════════════════════

function RoutingTab({ state, sellers, coverage }) {
  return (
    <div className="space-y-6">
      {/* Workload distribution */}
      <div className="bg-surface border border-border rounded-md p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">Workload by owner</h2>
          </div>
          <div className="text-[11px] text-text-muted">
            Avg {coverage.avgPerOwner} · Range {coverage.minLoad}–{coverage.maxLoad}
          </div>
        </div>

        <div className="space-y-2">
          {sellers.map((seller) => {
            const count = coverage.byOwner[seller.id] || 0;
            const max = Math.max(coverage.maxLoad, 1);
            const pct = (count / max) * 100;
            const overload = count > coverage.avgPerOwner * 1.5;
            const underload = count > 0 && count < coverage.avgPerOwner * 0.5;
            return (
              <div key={seller.id} className="flex items-center gap-3">
                <div className="w-32 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center font-semibold">
                    {seller.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="text-[12px] text-text-primary truncate">{seller.name}</div>
                </div>
                <div className="flex-1 h-5 bg-bg/40 rounded relative overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      overload ? 'bg-amber-500/60' : underload ? 'bg-violet-500/40' : 'bg-primary/60'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-2 text-[11px] font-semibold text-text-primary">
                    {count}
                  </div>
                </div>
                <div className="w-32 text-right text-[11px] text-text-muted truncate">
                  {seller.team} · {seller.region}
                </div>
              </div>
            );
          })}
        </div>

        {coverage.imbalance > 5 && (
          <div className="mt-4 bg-amber-500/5 border border-amber-500/30 rounded p-3 text-[12px] text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-1.5 font-semibold mb-1">
              <TrendingUp size={11} /> Imbalance detected
            </div>
            Spread of {coverage.imbalance} accounts between heaviest and lightest seller. Consider rebalancing — or let the Routing Agent prefer lighter books on next batch.
          </div>
        )}
      </div>

      {/* Territory rules */}
      <div className="bg-surface border border-border rounded-md p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Network size={14} className="text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">Territory rules</h2>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300">
              Inferred from book
            </span>
          </div>
          <span className="text-[11px] text-text-muted">{state.rules.length} rules</span>
        </div>

        <div className="bg-violet-500/5 border border-violet-500/20 rounded p-3 mb-3 text-[12px] text-text-secondary">
          <div className="flex items-center gap-1.5 text-violet-700 dark:text-violet-300 font-semibold mb-1">
            <Sparkles size={11} /> Territory Rule Inference Agent
          </div>
          Looking at your {state.book.length} uploaded accounts: owners appear split <strong>73% by US region</strong> (East/West), <strong>18% by vertical</strong> (Healthcare goes to Lisa, FinServ to James regardless of region), <strong>9% are exceptions</strong>. Below are the formalized rules — the Routing Agent will use these for every new whitespace account.
        </div>

        <div className="space-y-1.5">
          {state.rules.map((rule) => {
            const ownerLabel = rule.ownerSellerIds
              ? `Round-robin: ${rule.ownerSellerIds.map((sid) => getSeller(sid)?.name).join(', ')}`
              : `→ ${getSeller(rule.ownerSellerId)?.name || '—'}`;
            return (
              <div key={rule.id} className="flex items-center gap-3 bg-bg/40 border border-border rounded p-2.5">
                <div className="w-6 h-6 rounded bg-surface text-[11px] flex items-center justify-center font-semibold text-text-secondary border border-border">
                  {rule.priority}
                </div>
                <div className="flex-1">
                  <div className="text-[12px] text-text-primary">{rule.description}</div>
                  <div className="text-[11px] text-text-muted">{ownerLabel}</div>
                </div>
                <div className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Active
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit log */}
      <div className="bg-surface border border-border rounded-md p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={14} className="text-text-muted" />
          <h2 className="text-sm font-semibold text-text-primary">Activity log</h2>
        </div>
        <div className="space-y-1">
          {state.auditLog.slice(0, 8).map((entry, i) => (
            <div key={i} className="flex items-start gap-3 text-[12px] py-1.5 border-b border-border/40 last:border-b-0">
              <div className="text-text-muted text-[11px] w-32 flex-shrink-0">
                {new Date(entry.at).toLocaleString()}
              </div>
              <div className="text-text-secondary">{entry.actor}</div>
              <div className="text-text-primary flex-1">
                <span className="text-text-muted text-[11px] mr-1.5">{entry.action.replace(/_/g, ' ')} ·</span>
                {entry.payload}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
