import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, DollarSign, Users, MapPin, Flame, Zap, Globe, Star, UserCog,
  Sword, Handshake, TrendingUp, TrendingDown, Activity, Sparkles,
  ChevronDown, ChevronRight, Mail, FileText,
  Wand2, ArrowUpRight, MoonStar,
} from 'lucide-react';
import { listFiringsForAccount } from '../../data/signalFirings.js';
import { recommendedPlaysForAccount } from '../../data/signalPlayMap.js';
import { SIGNAL_CATEGORIES } from '../../data/signalCatalog.js';

// -----------------------------------------------------------------------------
// Icon resolver — a signal id → a lucide icon, based on the catalog category.
// -----------------------------------------------------------------------------
// Phase 1 signal icons — one per catalog id.
const SIGNAL_ICON = {
  // Buyer Intent (HG)
  trustradius_intent: Star,
  topic_intent: Sparkles,
  // Competitive (HG)
  competitor_install_detected: Sword,
  competitor_momentum_increasing: TrendingUp,
  competitor_momentum_decreasing: TrendingDown,
  competitor_renewal_window: Sword,
  // Partner (HG)
  partner_install_detected: Handshake,
  // Momentum (HG)
  tenant_product_momentum: TrendingUp,
  // 1P Activity
  sales_activity_7d: Activity,
  web_activity_7d: Globe,
  marketing_activity_7d: Sparkles,
};

// Phase 1 play icons — one per agent id in signalPlayMap.PLAY_TEMPLATES.
const PLAY_ICON = {
  competitive_battlecard: Sword,
  find_buying_personas: Users,
  draft_personalized_email: Mail,
  generate_account_brief: FileText,
};

// Weight buckets → severity chip
function severityFor(weight) {
  if (weight >= 90) return { label: 'Critical', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-500/10', dot: 'bg-rose-500' };
  if (weight >= 70) return { label: 'High', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-500/10', dot: 'bg-orange-500' };
  if (weight >= 50) return { label: 'Medium', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10', dot: 'bg-amber-500' };
  return { label: 'Info', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500/10', dot: 'bg-sky-500' };
}

// Relative time ("1 hour ago", "3 days ago", etc.) for source metadata.
function relativeAgo(iso) {
  if (!iso) return '';
  try {
    const now = new Date('2026-08-05');
    const then = new Date(iso);
    const diffMs = now - then;
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

// Score → color + label
function scoreDisplay(score) {
  if (score == null) return { value: '—', label: '', color: 'text-text-muted', ring: 'border-text-muted/30' };
  if (score >= 85) return { value: score, label: 'Very High', color: 'text-emerald-700 dark:text-emerald-300', ring: 'border-emerald-500' };
  if (score >= 70) return { value: score, label: 'High',      color: 'text-sky-700 dark:text-sky-300',         ring: 'border-sky-500' };
  if (score >= 50) return { value: score, label: 'Medium',    color: 'text-amber-700 dark:text-amber-300',     ring: 'border-amber-500' };
  return { value: score, label: 'Low', color: 'text-rose-700 dark:text-rose-300', ring: 'border-rose-500' };
}

// Deduped source metadata line for a signal firing.
function firingSourceMeta(f) {
  const parts = [];
  parts.push({ label: f.definition.source, icon: sourceIconFor(f.definition.source) });
  if (f.firedAt) parts.push({ label: relativeAgo(f.firedAt), icon: null });
  const person = f.context?.linkedContact || f.context?.contactName;
  if (person) parts.push({ label: person, icon: UserCog });
  return parts;
}

function sourceIconFor(source) {
  if ((source || '').includes('HG')) return Globe;
  if ((source || '').includes('CRM')) return Building2;
  if ((source || '').includes('1P')) return Activity;
  return Globe;
}

// -----------------------------------------------------------------------------
// Header
// -----------------------------------------------------------------------------
function CardHeader({ account, firings }) {
  const criticals = firings.filter((f) => f.weight >= 90).length;
  const highs = firings.filter((f) => f.weight >= 70 && f.weight < 90).length;
  const score = account.combinedScore ?? account.icpFit ?? null;
  const sd = scoreDisplay(score);
  return (
    <div className="flex items-start gap-3 mb-4">
      <div
        className="w-12 h-12 rounded-md text-[16px] font-bold text-white flex items-center justify-center flex-shrink-0"
        style={{ background: account.logoColor || '#64748b' }}
      >
        {(account.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-base font-semibold text-text-primary">{account.name}</span>
          {account.stage && (
            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
              {account.stage}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap text-[11px] text-text-secondary">
          {account.industry && (
            <span className="inline-flex items-center gap-1">
              <Building2 size={10} />
              {account.industry}
            </span>
          )}
          {account.fai?.revenue && (
            <span className="inline-flex items-center gap-1">
              <DollarSign size={10} />
              {account.fai.revenue}
            </span>
          )}
          {account.fai?.employees && (
            <span className="inline-flex items-center gap-1">
              <Users size={10} />
              {account.fai.employees}
            </span>
          )}
          {account.fai?.hq && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={10} />
              {account.fai.hq}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {criticals > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-1 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[11px] font-semibold">
            <Flame size={11} />
            {criticals}
          </span>
        )}
        {highs > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-1 rounded bg-orange-500/10 text-orange-700 dark:text-orange-300 text-[11px] font-semibold">
            <Zap size={11} />
            {highs}
          </span>
        )}
        {score != null && (
          <div className={`w-14 h-14 rounded-full border-4 ${sd.ring} flex flex-col items-center justify-center flex-shrink-0`}>
            <div className={`text-lg font-bold leading-none ${sd.color}`}>{sd.value}</div>
            <div className="text-[8px] uppercase tracking-wider text-text-muted mt-0.5">{sd.label}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Signals section
// -----------------------------------------------------------------------------
function SignalsBlock({ firings, onViewAll }) {
  if (firings.length === 0) return null;
  const top = firings.slice(0, 4);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-text-muted">
          <Activity size={10} />
          Signals ({firings.length})
        </div>
        {firings.length > 4 && (
          <button
            onClick={onViewAll}
            className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
          >
            View all
          </button>
        )}
      </div>
      <div className="space-y-2">
        {top.map((f, i) => <SignalRow key={f.signalId + i} firing={f} />)}
      </div>
    </div>
  );
}

function SignalRow({ firing }) {
  const sev = severityFor(firing.weight);
  const Icon = SIGNAL_ICON[firing.signalId] || Activity;
  const meta = firingSourceMeta(firing);
  const cat = SIGNAL_CATEGORIES[firing.definition.category];
  return (
    <div className="rounded border border-border bg-bg/40 px-3 py-2.5">
      <div className="flex items-start gap-2.5">
        <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
          <span className={`w-2 h-2 rounded-full ${sev.dot} mb-1.5`} />
          <div className="w-7 h-7 rounded-md bg-white/70 dark:bg-black/20 flex items-center justify-center">
            <Icon size={13} className={sev.color} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-[13px] font-semibold text-text-primary">{firing.definition.description}</span>
            <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${sev.bg} ${sev.color}`}>
              {sev.label}
            </span>
            {cat && (
              <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${cat.bg} ${cat.color}`}>
                {cat.label}
              </span>
            )}
          </div>
          {firing.context?.oppName && (
            <div className="text-[11px] text-text-secondary leading-snug">
              {firing.context.oppName}
              {firing.context.oppAmount ? ` · $${(firing.context.oppAmount / 1000).toLocaleString()}K` : ''}
              {firing.context.competitor ? ` · competitor: ${firing.context.competitor}` : ''}
              {firing.context.topic ? ` · topic: ${firing.context.topic}` : ''}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap text-[10px] text-text-muted mt-1">
            {meta.map((m, i) => {
              const MetaIcon = m.icon;
              return (
                <span key={i} className="inline-flex items-center gap-1">
                  {MetaIcon && <MetaIcon size={9} />}
                  {m.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Recommended plays
// -----------------------------------------------------------------------------
function RecommendedPlaysBlock({ accountId }) {
  const navigate = useNavigate();
  const plays = recommendedPlaysForAccount(accountId, { limit: 6 });
  if (plays.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wider font-semibold text-text-muted">
        <Sparkles size={10} />
        Recommended plays
      </div>
      <div className="space-y-2">
        {plays.map((p) => {
          const Icon = PLAY_ICON[p.agentId] || Wand2;
          return (
            <div key={p.id} className="rounded border border-border bg-bg/40 px-3 py-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-text-primary">{p.title}</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {p.category}
                  </span>
                </div>
                <div className="text-[11px] text-text-secondary leading-snug mt-0.5">{p.rationale}</div>
              </div>
              <button
                onClick={() => {
                  if (p.agentId) navigate(`/account/${accountId}?play=${p.agentId}`);
                  else navigate(`/account/${accountId}?tab=overview`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded hover:bg-primary-dim transition-colors flex-shrink-0"
              >
                {p.ctaLabel}
                <ArrowUpRight size={10} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Footer actions
// -----------------------------------------------------------------------------
function FooterActions({ accountId }) {
  const navigate = useNavigate();
  return (
    <div className="pt-3 border-t border-border flex items-center gap-2 flex-wrap">
      <button
        onClick={() => navigate(`/account/${accountId}?play=generate_account_brief`)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-gradient-to-r from-primary to-violet-500 text-white rounded transition-colors hover:opacity-90"
      >
        <Sparkles size={11} />
        AI Account Brief
      </button>
      <button
        onClick={() => navigate(`/account/${accountId}`)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-2 transition-colors"
      >
        <ArrowUpRight size={11} />
        Open account
      </button>
      <button
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-2 transition-colors"
        title="Hide this account from Home for 7 days"
      >
        <MoonStar size={11} />
        Snooze
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Full card
// -----------------------------------------------------------------------------
function FullCard({ account, firings }) {
  return (
    <div className="bg-surface border border-border rounded-md p-4 hover:border-primary/30 transition-colors">
      <CardHeader account={account} firings={firings} />
      <SignalsBlock firings={firings} />
      <RecommendedPlaysBlock accountId={account.id} />
      <FooterActions accountId={account.id} />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Compressed row (with inline expand)
// -----------------------------------------------------------------------------
function CompressedRow({ account, firings, initiallyExpanded = false }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const cats = Array.from(new Set(firings.map((f) => f.definition.category)));
  const topPlay = recommendedPlaysForAccount(account.id, { limit: 1 })[0];
  const Icon = topPlay ? (PLAY_ICON[topPlay.agentId] || Wand2) : null;
  const sd = scoreDisplay(account.combinedScore ?? account.icpFit);

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg/40 transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <div
          className="w-8 h-8 rounded text-[11px] font-bold text-white flex items-center justify-center flex-shrink-0 cursor-pointer"
          style={{ background: account.logoColor || '#64748b' }}
          onClick={() => navigate(`/account/${account.id}`)}
        >
          {(account.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('')}
        </div>
        <button
          onClick={() => navigate(`/account/${account.id}`)}
          className="text-left flex-1 min-w-0"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-primary truncate">{account.name}</span>
            {account.stage && (
              <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-primary/10 text-primary">
                {account.stage}
              </span>
            )}
            <span className={`text-[9px] uppercase tracking-wider font-bold ${sd.color}`}>
              {sd.value != null && typeof sd.value === 'number' ? `${sd.value} · ${sd.label}` : ''}
            </span>
          </div>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          {cats.slice(0, 5).map((c) => {
            const cat = SIGNAL_CATEGORIES[c];
            if (!cat) return null;
            return (
              <span
                key={c}
                title={cat.label}
                className={`w-2 h-2 rounded-full ${cat.bg.replace('bg-', 'bg-').replace('/10', '')}`}
                style={{ background: cat.color?.includes('rose') ? '#f43f5e' :
                                    cat.color?.includes('amber') ? '#f59e0b' :
                                    cat.color?.includes('orange') ? '#f97316' :
                                    cat.color?.includes('emerald') ? '#10b981' :
                                    cat.color?.includes('violet') ? '#8b5cf6' :
                                    cat.color?.includes('sky') ? '#0ea5e9' :
                                    cat.color?.includes('blue') ? '#3b82f6' :
                                    cat.color?.includes('red') ? '#ef4444' :
                                    '#64748b' }}
              />
            );
          })}
          <span className="text-[10px] font-mono text-text-muted ml-1">
            {firings.length} sig
          </span>
        </div>
        {topPlay && (
          <button
            onClick={() => {
              if (topPlay.agentId) navigate(`/account/${account.id}?play=${topPlay.agentId}`);
              else navigate(`/account/${account.id}?tab=overview`);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-primary text-white rounded hover:bg-primary-dim transition-colors flex-shrink-0"
            title={topPlay.rationale}
          >
            {Icon && <Icon size={10} />}
            {topPlay.ctaLabel}
          </button>
        )}
      </div>
      {expanded && (
        <div className="px-4 pb-3 pt-1">
          <div className="border-t border-border/60 pt-3">
            <SignalsBlock firings={firings} />
            <RecommendedPlaysBlock accountId={account.id} />
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Public component
// -----------------------------------------------------------------------------
export default function TargetAccountCard({ account, mode = 'full' }) {
  const firings = listFiringsForAccount(account.id);
  // Sort by weight desc so the primary firing renders first.
  firings.sort((a, b) => b.weight - a.weight);

  if (mode === 'compressed') {
    return <CompressedRow account={account} firings={firings} />;
  }
  return <FullCard account={account} firings={firings} />;
}
