// Account Settings — tenant-level settings shell. The route is a wrapper
// around 8 sub-pages, navigated via the left rail. Each sub-page is a stub
// in v1 — engineering fills the content as features land.
//
// URL: /admin/settings/:section?
//   :section ∈ account | authentication | push | processes
//             | credits | api-keys | api-usage | privacy

import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Lock,
  Bell,
  Settings as SettingsGear,
  LineChart,
  Key,
  BarChart3,
  Shield,
  Construction,
} from 'lucide-react';

const SECTIONS = [
  { id: 'account',        label: 'Account',           icon: Building2,    description: 'Tenant name, logo, default lens, contact info' },
  { id: 'authentication', label: 'Authentication',    icon: Lock,         description: 'SSO (SAML, OIDC), MFA, password policy, session lifetime' },
  { id: 'push',           label: 'Push Configuration', icon: Bell,        description: 'Slack and email notification defaults per event type' },
  { id: 'processes',      label: 'Processes',          icon: SettingsGear, description: 'Scheduled jobs, retention windows, audit log policy' },
  { id: 'credits',        label: 'Credits Usage',      icon: LineChart,   description: 'Agent invocation cost tracking + monthly burn-down' },
  { id: 'api-keys',       label: 'API Keys',           icon: Key,         description: 'Programmatic access tokens for the RGI REST API' },
  { id: 'api-usage',      label: 'API Usage',          icon: BarChart3,   description: 'Quota usage + rate limit dashboard' },
  { id: 'privacy',        label: 'Privacy',            icon: Shield,      description: 'Data residency, retention, GDPR / SOC 2 controls' },
];

function StubSubpage({ section }) {
  const Icon = section.icon;
  return (
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon size={16} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{section.label}</h2>
          <p className="text-[12px] text-text-secondary">{section.description}</p>
        </div>
      </div>

      <div className="mt-6 bg-surface border border-dashed border-border rounded-md p-8 text-center">
        <Construction size={22} className="mx-auto mb-2 text-text-muted" />
        <h3 className="text-sm font-semibold text-text-primary mb-1">Coming in the next iteration</h3>
        <p className="text-[12px] text-text-secondary leading-relaxed max-w-md mx-auto">
          This sub-page is scaffolded so the navigation works end-to-end. Engineering will fill in
          the {section.label.toLowerCase()} controls in the next milestone.
        </p>
        <p className="text-[10px] text-text-muted mt-3 font-mono">/admin/settings/{section.id}</p>
      </div>

      <PlaceholderHint sectionId={section.id} />
    </div>
  );
}

function PlaceholderHint({ sectionId }) {
  const hints = {
    account: [
      'Tenant name + logo upload',
      'Default offering lens',
      'Default scoring tier thresholds (A/B/C/D)',
      'Billing contact + finance email',
      'Tenant timezone + working hours',
    ],
    authentication: [
      'SSO provider connection (SAML 2.0, OIDC)',
      'JIT user provisioning rules',
      'MFA enforcement policy',
      'Session lifetime + idle timeout',
      'Password complexity rules (non-SSO fallback)',
    ],
    push: [
      'Default Slack channel for play match alerts',
      'Email digest cadence (daily / weekly)',
      'Per-event-type opt-in matrix',
      'Quiet hours (no notifications X→Y)',
      'Per-seller override allowed (toggle)',
    ],
    processes: [
      'Scoring model recompute schedule',
      'Whitespace re-pull cadence',
      'Audit log retention window',
      'Failed-sync retry policy',
      'Background job dashboard',
    ],
    credits: [
      'Current month spend by agent',
      'Top spending sellers',
      'Spend forecast vs. plan',
      'Per-agent rate-limit caps',
      'Spend alerts (Slack / email)',
    ],
    'api-keys': [
      'Active token list with last-used',
      'Token rotation reminders',
      'Per-token scope grants',
      'IP allowlist per token',
      'Audit log of token actions',
    ],
    'api-usage': [
      'Calls per endpoint over 7 / 30 days',
      'Top API consumers',
      'Quota burn-down',
      'Rate-limit hits',
      'Cost breakdown',
    ],
    privacy: [
      'Data residency (US / EU / multi-region)',
      'PII retention windows',
      'GDPR data export + erase tooling',
      'SOC 2 compliance attestation',
      'Sub-processor list',
    ],
  };
  const items = hints[sectionId] || [];
  if (items.length === 0) return null;
  return (
    <div className="mt-4 bg-surface border border-border rounded-md p-4">
      <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-2">Planned controls</div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it} className="text-[12px] text-text-secondary flex items-start gap-1.5">
            <span className="text-text-muted mt-0.5">·</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AccountSettingsRoute() {
  const navigate = useNavigate();
  const { section: sectionId } = useParams();
  const activeId = sectionId && SECTIONS.find((s) => s.id === sectionId) ? sectionId : 'account';
  const activeSection = SECTIONS.find((s) => s.id === activeId) || SECTIONS[0];

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
      >
        <ArrowLeft size={11} />
        Admin Hub
      </button>

      <div className="mb-2 text-xs text-text-muted">Platform & Ops · Account Settings</div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Account Settings</h1>
      <p className="text-sm text-text-secondary mb-6 max-w-3xl">
        Tenant-level controls — authentication, billing, privacy, API access. Configure once;
        applies platform-wide.
      </p>

      <div className="flex gap-6">
        {/* Left rail */}
        <nav className="w-56 flex-shrink-0">
          <ul className="space-y-0.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === activeId;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => navigate(`/admin/settings/${s.id}`)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg/60'
                    }`}
                  >
                    <Icon size={13} className={isActive ? 'text-primary' : 'text-text-muted'} />
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sub-page content */}
        <StubSubpage section={activeSection} />
      </div>
    </div>
  );
}
