import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Maximize2,
  Globe,
  AlertTriangle,
  Users as UsersIcon,
  DollarSign,
  MapPin,
  Calendar,
  TrendingUp,
  Building,
  Mail,
  ExternalLink,
  Zap,
  UserPlus,
  Newspaper,
  Briefcase,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useCompanyDetail } from '../../context/CompanyDetailContext.jsx';
import { findCompanyById } from '../../data/companyRegistry.js';
import { useToast } from '../../context/ToastContext.jsx';

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'company', label: 'Company' },
  { id: 'installs', label: 'Installs' },
  { id: 'signals', label: 'Signals' },
  { id: 'contacts', label: 'Contacts' },
];

const SIGNAL_ICONS = {
  intent: Zap,
  hiring: UserPlus,
  news: Newspaper,
  expansion: TrendingUp,
  'job-change': Briefcase,
};

function StatusBadge({ status }) {
  const styles = {
    Customer: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    Prospect: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    'At Risk': 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    Lost: 'bg-text-muted/15 text-text-muted',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${styles[status] || styles.Prospect}`}>
      {status}
    </span>
  );
}

function StatCell({ icon: Icon, label, value, sub }) {
  return (
    <div className="border border-border rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] text-text-muted uppercase tracking-wider mb-1">
        <Icon size={10} />
        {label}
      </div>
      <div className="text-base font-semibold text-text-primary">{value}</div>
      {sub && <div className="text-[10px] text-text-secondary mt-0.5">{sub}</div>}
    </div>
  );
}

function PropensityBar({ score, label }) {
  const tier = score >= 80 ? 'Very High' : score >= 65 ? 'High' : score >= 50 ? 'Medium' : 'Low';
  const tone =
    score >= 80
      ? 'bg-emerald-500'
      : score >= 65
      ? 'bg-blue-500'
      : score >= 50
      ? 'bg-amber-500'
      : 'bg-text-muted';
  return (
    <div className="bg-bg/40 border border-border rounded-lg p-3.5">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-text-muted font-semibold mb-2">
        <span>Propensity Score</span>
        <span className={score >= 80 ? 'text-emerald-700 dark:text-emerald-300' : 'text-text-primary'}>
          {score} — {label || tier}
        </span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6 }}
          className={`h-full rounded-full ${tone}`}
        />
      </div>
    </div>
  );
}

function CompanyHeader({ company, onClose }) {
  const { showToast } = useToast();
  return (
    <div className="border-b border-border">
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0"
            style={{ background: company.logoColor, color: company.logoText }}
          >
            {company.initials.slice(0, 4)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-semibold text-text-primary truncate">{company.name}</h2>
              <StatusBadge status={company.status} />
            </div>
            <div className="text-xs text-text-secondary">
              {company.industry} · {company.location}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => showToast(`Opening ${company.name} on the web`, 'info')}
            className="p-1.5 hover:bg-surface-2 rounded text-text-muted hover:text-text-secondary transition-colors"
            title="Open website"
          >
            <Globe size={14} />
          </button>
          <button
            onClick={() => showToast('Pop-out to full page would open here', 'info')}
            className="p-1.5 hover:bg-surface-2 rounded text-text-muted hover:text-text-secondary transition-colors"
            title="Open in full page"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-2 rounded text-text-muted hover:text-text-primary transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {company.owner && (
        <div className="px-5 pb-3 flex items-center gap-4 text-xs">
          <div className="text-text-muted">
            Owner: <span className="text-text-primary font-medium">{company.owner.name}</span>
          </div>
          {company.crmContext?.stage && company.crmContext.stage !== '—' && (
            <>
              <span className="text-text-muted">·</span>
              <div className="text-text-muted">
                Stage: <span className="text-text-primary font-medium">{company.crmContext.stage}</span>
              </div>
            </>
          )}
          {company.crmContext?.acv && company.crmContext.acv !== '—' && (
            <>
              <span className="text-text-muted">·</span>
              <div className="text-text-muted">
                ACV: <span className="text-success font-medium">{company.crmContext.acv}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryTab({ company }) {
  const { showToast } = useToast();
  return (
    <div className="space-y-5">
      {/* Displacement Opportunity */}
      {company.displacement && company.competitors.length > 0 && (
        <div className="bg-rose-500/5 border border-rose-500/30 rounded-lg p-3.5">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-rose-700 dark:text-rose-300 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-1">
                Displacement Opportunity
              </div>
              <div className="text-xs text-text-secondary">
                {company.name} runs {company.competitors.join(', ')} — displacement opportunity detected.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* "Why now" callout for triage rows */}
      {company.whyNow && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3.5">
          <div className="flex items-start gap-2">
            <Sparkles size={14} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-primary mb-1">Why now</div>
              <div className="text-xs text-text-secondary leading-relaxed">{company.whyNow}</div>
            </div>
          </div>
        </div>
      )}

      {company.description && (
        <p className="text-sm text-text-secondary leading-relaxed">{company.description}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <StatCell icon={UsersIcon} label="Employees" value={company.employeesLabel} />
        <StatCell icon={DollarSign} label="Revenue" value={company.revenueLabel} />
        <StatCell icon={MapPin} label="HQ" value={company.hq} />
        {company.founded && <StatCell icon={Calendar} label="Founded" value={company.founded} />}
        <StatCell icon={TrendingUp} label="IT Spend" value={company.itSpend} />
        <StatCell icon={Building} label="Type" value={company.type} />
      </div>

      {company.propensity != null && (
        <PropensityBar score={company.propensity} label={company.propensityLabel} />
      )}

      {company.crmContext && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
            CRM Context
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            {[
              ['Owner', company.owner?.name || '—'],
              ['Stage', company.crmContext.stage],
              ['Open Opps', String(company.crmContext.openOpps ?? 0)],
              ['ACV', company.crmContext.acv],
              ['Last Activity', company.crmContext.lastActivity],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between px-3 py-2 border-b border-border last:border-0 text-xs"
              >
                <span className="text-text-secondary">{k}</span>
                <span className="text-text-primary font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {company.techInstalls.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
            Key Tech Installs
          </div>
          <div className="space-y-1.5">
            {company.techInstalls.map((t, i) => {
              const isCompetitor = t.tag === 'Competitor';
              const isPartner = t.tag === 'Partner';
              return (
                <div
                  key={i}
                  className="flex items-center justify-between border border-border rounded-md px-3 py-2"
                >
                  <span className="text-xs text-text-primary">{t.name}</span>
                  {t.tag && (
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${
                        isCompetitor
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                          : isPartner
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'bg-text-muted/10 text-text-muted'
                      }`}
                    >
                      {t.tag}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action footer */}
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <button
          onClick={() => showToast(`Drafting AI sales play for ${company.name}...`, 'info')}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-dim transition-colors"
        >
          <Sparkles size={12} />
          Run AI sales play
        </button>
        <button
          onClick={() => showToast('Opening in Salesforce...', 'info')}
          className="flex items-center gap-1.5 px-3 py-2 border border-border text-text-secondary text-sm rounded-md hover:bg-surface-2 hover:text-text-primary transition-colors"
        >
          <ExternalLink size={12} />
          Salesforce
        </button>
      </div>
    </div>
  );
}

function SignalsTab({ company }) {
  if (company.recentSignals.length === 0) {
    return (
      <div className="text-center py-12 text-xs text-text-muted">
        No recent signals tracked for {company.name}.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {company.recentSignals.map((s, i) => {
        const Icon = SIGNAL_ICONS[s.kind] || Zap;
        return (
          <div key={i} className="border border-border rounded-md p-3 flex items-start gap-3">
            <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Icon size={12} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-0.5">
                {s.kind.replace('-', ' ')}
              </div>
              {s.topic && (
                <div className="text-xs font-medium text-text-primary">{s.topic}</div>
              )}
              <div className="text-xs text-text-secondary mt-0.5 leading-snug">{s.detail}</div>
            </div>
            <div className="text-[10px] text-text-muted whitespace-nowrap">{s.date}</div>
          </div>
        );
      })}
    </div>
  );
}

function ContactsTab({ company }) {
  const { showToast } = useToast();
  if (company.contacts.length === 0) {
    return (
      <div className="text-center py-12 text-xs text-text-muted">
        No contacts mapped at {company.name} yet.
        <button
          onClick={() => showToast('Contact discovery would run here', 'info')}
          className="block mx-auto mt-3 px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-md hover:bg-primary hover:text-white transition-colors"
        >
          Discover contacts
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {company.contacts.map((c, i) => (
        <div key={i} className="border border-border rounded-md p-3 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {c.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm font-medium text-text-primary">{c.name}</span>
              {c.isChampion && (
                <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded font-bold">
                  Champion
                </span>
              )}
            </div>
            <div className="text-xs text-text-secondary">{c.role}</div>
            {c.email && (
              <a className="text-[10px] text-text-muted hover:text-text-secondary block mt-0.5" href={`mailto:${c.email}`}>
                {c.email}
              </a>
            )}
          </div>
          <button
            onClick={() => showToast(`Drafting outreach to ${c.name}...`, 'info')}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-primary/10 text-primary hover:bg-primary hover:text-white rounded transition-colors"
          >
            <Mail size={10} />
            Email
          </button>
        </div>
      ))}
    </div>
  );
}

function StubTab({ company, label }) {
  return (
    <div className="text-center py-12 text-xs text-text-muted">
      {label} detail for {company.name} would render here.
    </div>
  );
}

export default function CompanyDetailDrawer() {
  const { openCompanyId, activeTab, setActiveTab, closeCompany } = useCompanyDetail();
  const company = openCompanyId ? findCompanyById(openCompanyId) : null;

  return (
    <AnimatePresence>
      {company && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closeCompany}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-[520px] bg-bg border-l border-border z-50 flex flex-col shadow-elev"
          >
            <CompanyHeader company={company} onClose={closeCompany} />

            <div className="border-b border-border px-5">
              <div className="flex items-center gap-1 overflow-x-auto">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-3 py-2.5 text-xs transition-colors border-b-2 -mb-px whitespace-nowrap font-medium flex items-center gap-1.5 ${
                      activeTab === t.id
                        ? 'text-text-primary border-primary'
                        : 'text-text-secondary border-transparent hover:text-text-primary'
                    }`}
                  >
                    {t.label}
                    {t.id === 'signals' && company.signalsCount > 0 && (
                      <span className="text-[9px] px-1 py-0 bg-rose-500/15 text-rose-700 dark:text-rose-300 rounded font-bold">
                        {company.signalsCount}
                      </span>
                    )}
                    {t.id === 'contacts' && company.contacts.length > 0 && (
                      <span className="text-[9px] px-1 py-0 bg-text-muted/15 text-text-muted rounded">
                        {company.contacts.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto thin-scrollbar p-5">
              {activeTab === 'summary' && <SummaryTab company={company} />}
              {activeTab === 'signals' && <SignalsTab company={company} />}
              {activeTab === 'contacts' && <ContactsTab company={company} />}
              {activeTab === 'company' && <StubTab company={company} label="Full firmographics" />}
              {activeTab === 'installs' && <StubTab company={company} label="All detected tech installs" />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
