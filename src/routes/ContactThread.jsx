import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Mail, Phone, Building2, Crown, BadgeCheck,
  BadgeX, Eye, Copy, ExternalLink, Briefcase, Activity, Layers, MapPin,
  Users, DollarSign, Sparkles, Clock, CheckCircle2,
  CalendarClock, MousePointerClick, FileText, MessageSquare, Video,
  Globe,
} from 'lucide-react';
import { getContact, listContactActivities } from '../data/buyingCommittees.js';
import { getAccountById } from '../data/accounts.js';
import { getHgIntelligence } from '../data/hgIntelligence.js';
import { useToast } from '../context/ToastContext.jsx';

// Contact card viewer at /contact/:id.
// Mirrors the Account card layout — header · sub-stats · tabs · sections.

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function relativeDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date('2026-07-17');
    const days = Math.round((now - d) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

// Activity type → icon + accent color
const ACTIVITY_META = {
  meeting:      { icon: Video,             color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10',  label: 'Meeting' },
  email_open:   { icon: Mail,              color: 'text-sky-700 dark:text-sky-300',         bg: 'bg-sky-500/10',      label: 'Email' },
  webinar:      { icon: CalendarClock,     color: 'text-violet-700 dark:text-violet-300',   bg: 'bg-violet-500/10',   label: 'Webinar' },
  page_visit:   { icon: MousePointerClick, color: 'text-amber-700 dark:text-amber-300',     bg: 'bg-amber-500/10',    label: 'Page visit' },
  form_fill:    { icon: FileText,          color: 'text-rose-700 dark:text-rose-300',       bg: 'bg-rose-500/10',     label: 'Form' },
  linkedin_post:{ icon: MessageSquare,     color: 'text-blue-700 dark:text-blue-300',       bg: 'bg-blue-500/10',     label: 'LinkedIn' },
};

// ─── Reveal-CTA — hidden value shows "Reveal", persists in local state ──
function RevealField({ icon: Icon, label, value, revealFormat, onCopy }) {
  const [revealed, setRevealed] = useState(false);
  if (!value) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-border bg-bg/40 text-[11px] text-text-muted">
        <Icon size={11} />
        <span className="italic">{label} not on file</span>
      </div>
    );
  }
  if (!revealed) {
    return (
      <button
        onClick={() => setRevealed(true)}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-primary/30 bg-primary/5 hover:bg-primary/10 text-[11px] text-primary transition-colors"
        title={`Reveal ${label.toLowerCase()}`}
      >
        <Icon size={11} />
        <span className="font-mono opacity-70">••••••</span>
        <span className="ml-0.5 inline-flex items-center gap-0.5 font-semibold">
          <Eye size={10} />
          Reveal {label.toLowerCase()}
        </span>
      </button>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/5 text-[11px] text-text-primary group">
      <Icon size={11} className="text-emerald-600" />
      <span className="font-mono">{revealFormat ? revealFormat(value) : value}</span>
      <button
        onClick={() => onCopy?.(value)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-text-primary"
        title="Copy"
      >
        <Copy size={10} />
      </button>
      <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
        Revealed
      </span>
    </div>
  );
}

// ─── Overview tab ────────────────────────────────────────────────────────
function OverviewTab({ account, intel, activities, onJumpTab }) {
  const fai = account?.fai || {};
  const narrative = intel?.narrative || account?.threadStarter || 'No company narrative available yet.';
  const highlights = intel?.highlights || [];
  const painPoints = intel?.painPoints || [];
  const recent = (activities || []).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Company Firmographics */}
      <div className="bg-surface border border-border rounded-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={13} className="text-text-muted" />
          <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
            Company firmographics
          </span>
          {account && (
            <button
              onClick={() => window?.location && (window.location.href = `/account/${account.id}`)}
              className="ml-auto inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              Open company card
              <ArrowRight size={10} />
            </button>
          )}
        </div>
        {account ? (
          <div className="grid grid-cols-4 gap-2">
            <FaiCard icon={DollarSign} label="Revenue" value={fai.revenue || '—'} />
            <FaiCard icon={Users} label="Employees" value={fai.employees || '—'} />
            <FaiCard icon={MapPin} label="HQ" value={fai.hq || '—'} />
            <FaiCard icon={Layers} label="Industry" value={account.industry || '—'} />
          </div>
        ) : (
          <div className="text-[11px] text-text-muted italic">Company not resolved.</div>
        )}
      </div>

      {/* Company Overview (narrative + highlights) */}
      <div className="bg-surface border border-border rounded-md p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={13} className="text-violet-500" />
          <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
            Company overview
          </span>
          {intel?.freshness && (
            <span className="text-[10px] text-text-muted">&middot; {intel.freshness}</span>
          )}
        </div>
        <p className="text-xs text-text-secondary leading-relaxed mb-3">{narrative}</p>
        {highlights.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {highlights.slice(0, 3).map((h) => (
              <div key={h.id} className="px-3 py-2 rounded border border-border bg-bg/40">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {h.category && (
                    <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted">{h.category}</span>
                  )}
                  {h.magnitude && (
                    <span className="text-[9px] font-mono text-primary">{h.magnitude}</span>
                  )}
                </div>
                <div className="text-xs font-semibold text-text-primary">{h.headline}</div>
                {h.detail && (
                  <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">{h.detail}</div>
                )}
              </div>
            ))}
          </div>
        )}
        {painPoints.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
              Pain points
            </div>
            <div className="space-y-1">
              {painPoints.slice(0, 3).map((p, i) => (
                <div key={i} className="text-[11px] text-text-secondary leading-snug">
                  &middot; {p.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent 1P Activities snippet */}
      <div className="bg-surface border border-border rounded-md p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={13} className="text-text-muted" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
              Recent 1P activities
            </span>
            <span className="text-[10px] font-mono text-text-muted">({activities.length})</span>
          </div>
          {activities.length > 3 && (
            <button
              onClick={() => onJumpTab('activities')}
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              View all
              <ArrowRight size={10} />
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="text-[11px] text-text-muted italic">
            No 1P activities on this contact yet.
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((a, i) => (
              <ActivityRow key={i} activity={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FaiCard({ icon: Icon, label, value }) {
  return (
    <div className="px-3 py-2 rounded border border-border bg-bg/40">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-text-muted font-semibold">
        <Icon size={9} />
        <span>{label}</span>
      </div>
      <div className="text-sm font-semibold text-text-primary mt-0.5 truncate" title={value}>
        {value}
      </div>
    </div>
  );
}

function ActivityRow({ activity }) {
  const meta = ACTIVITY_META[activity.type] || {
    icon: Clock, color: 'text-text-secondary', bg: 'bg-surface-2', label: activity.type,
  };
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-3 px-3 py-2 rounded border border-border bg-bg/40">
      <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
        <Icon size={12} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-text-primary">{activity.label}</span>
          <span className={`text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded ${meta.bg} ${meta.color}`}>
            {meta.label}
          </span>
        </div>
        {activity.detail && (
          <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">{activity.detail}</div>
        )}
      </div>
      <div className="text-[10px] text-text-muted font-mono flex-shrink-0">{relativeDate(activity.date)}</div>
    </div>
  );
}

// ─── Job History tab ─────────────────────────────────────────────────────
function JobHistoryTab({ contact }) {
  const history = contact.jobHistory || [];
  if (history.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-md p-8 text-center">
        <Briefcase size={18} className="text-text-muted mx-auto mb-2" />
        <div className="text-sm font-semibold text-text-primary mb-1">No job history on file</div>
        <div className="text-[11px] text-text-muted">
          Run contact enrichment to pull this contact&rsquo;s past roles from LinkedIn.
        </div>
      </div>
    );
  }
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <div className="flex items-center gap-2 mb-3">
        <Briefcase size={13} className="text-text-muted" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
          Job history
        </span>
        <span className="text-[10px] font-mono text-text-muted">({history.length})</span>
      </div>
      <div className="relative pl-5">
        <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
        {history.map((role, i) => {
          const isCurrent = role.end === 'Present' || i === 0;
          return (
            <div key={i} className="relative pb-4 last:pb-0">
              <div className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 ${
                isCurrent ? 'border-primary bg-primary' : 'border-border bg-bg'
              }`} />
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-text-primary">{role.title}</span>
                {isCurrent && (
                  <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    Current
                  </span>
                )}
              </div>
              <div className="text-[11px] text-text-secondary">
                {role.company}
              </div>
              <div className="text-[10px] text-text-muted font-mono mt-0.5">
                {role.start} &mdash; {role.end || 'Present'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 1P Activities tab ───────────────────────────────────────────────────
function ActivitiesTab({ activities }) {
  if (activities.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-md p-8 text-center">
        <Activity size={18} className="text-text-muted mx-auto mb-2" />
        <div className="text-sm font-semibold text-text-primary mb-1">No 1P activities yet</div>
        <div className="text-[11px] text-text-muted">
          Activities appear here when the contact engages with your emails, sequences, webinars, or website.
        </div>
      </div>
    );
  }
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={13} className="text-text-muted" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
          1P activity feed
        </span>
        <span className="text-[10px] font-mono text-text-muted">({activities.length})</span>
      </div>
      <div className="space-y-2">
        {activities.map((a, i) => (
          <ActivityRow key={i} activity={a} />
        ))}
      </div>
    </div>
  );
}

// ─── Route shell ─────────────────────────────────────────────────────────
export default function ContactThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const contact = useMemo(() => getContact(id), [id]);
  const account = useMemo(() => (contact?.accountId ? getAccountById(contact.accountId) : null), [contact]);
  const intel = useMemo(() => (contact?.accountId ? getHgIntelligence(contact.accountId) : null), [contact]);
  const activities = useMemo(() => listContactActivities(id), [id]);

  const [tab, setTab] = useState('overview');

  if (!contact) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
        >
          <ArrowLeft size={11} />
          Back
        </button>
        <div className="bg-surface border border-dashed border-border rounded-md p-10 text-center">
          <div className="text-sm font-semibold text-text-primary mb-1">Contact not found</div>
          <p className="text-xs text-text-muted">The contact id <span className="font-mono">{id}</span> doesn&rsquo;t exist.</p>
        </div>
      </div>
    );
  }

  const handleCopy = (v) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(v).then(() => showToast('Copied', 'success')).catch(() => {});
    }
  };

  const inCrm = contact.inCrm !== false;
  const source = contact.source || 'Unknown';

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Back
      </button>
      <div className="mb-2 text-xs text-text-muted">
        Contacts &middot; {account?.name || contact.accountId} &middot; {contact.name}
      </div>

      {/* Header — mirrors AccountThread */}
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-16 h-16 rounded-md text-[22px] font-bold text-white flex items-center justify-center flex-shrink-0"
          style={{ background: account?.logoColor || '#0ea5e9' }}
        >
          {initials(contact.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-semibold tracking-tight">{contact.name}</h1>
            {contact.isChampion && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <Crown size={9} />
                Champion
              </span>
            )}
            <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${
              inCrm
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
            }`}>
              {inCrm ? <BadgeCheck size={9} /> : <BadgeX size={9} />}
              {inCrm ? 'In CRM' : 'Not in CRM'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-sm text-text-secondary">
            <span>{contact.title}</span>
            {account && (
              <>
                <span className="text-text-muted">&middot;</span>
                <button
                  onClick={() => navigate(`/account/${account.id}`)}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Building2 size={11} />
                  {account.name}
                </button>
              </>
            )}
            {contact.linkedinUrl && (
              <>
                <span className="text-text-muted">&middot;</span>
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline"
                  title="View LinkedIn profile"
                >
                  <Globe size={11} />
                  LinkedIn
                  <ExternalLink size={9} />
                </a>
              </>
            )}
          </div>

          {/* Reveal-CTA row */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <RevealField
              icon={Mail}
              label="Email"
              value={contact.email}
              onCopy={handleCopy}
            />
            <RevealField
              icon={Phone}
              label="Phone"
              value={contact.phone}
              onCopy={handleCopy}
            />
          </div>

          {/* Sub-stats row */}
          <div className="mt-3 flex items-center gap-3 flex-wrap text-[11px] text-text-muted">
            {contact.department && (
              <span className="inline-flex items-center gap-1">
                <Layers size={10} />
                {contact.department}
              </span>
            )}
            {contact.lifecycleStage && (
              <>
                <span>&middot;</span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  Lifecycle: <span className="text-text-secondary font-semibold">{contact.lifecycleStage}</span>
                </span>
              </>
            )}
            <span>&middot;</span>
            <span className="inline-flex items-center gap-1">
              Source: <span className="font-mono text-text-secondary">{source}</span>
            </span>
            {contact.joined && (
              <>
                <span>&middot;</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={10} />
                  Joined {contact.joined}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-4">
        <div className="flex items-center gap-1">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'job_history', label: 'Job History', count: contact.jobHistory?.length || 0 },
            { key: 'activities', label: '1P Activities', count: activities.length },
          ].map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border-b-2 ${
                  isActive
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <span>{t.label}</span>
                {t.count != null && t.count > 0 && (
                  <span className="text-[10px] font-mono text-text-muted">({t.count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <OverviewTab account={account} intel={intel} activities={activities} onJumpTab={setTab} />
      )}
      {tab === 'job_history' && <JobHistoryTab contact={contact} />}
      {tab === 'activities' && <ActivitiesTab activities={activities} />}
    </div>
  );
}
