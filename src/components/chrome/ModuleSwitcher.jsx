// ModuleSwitcher — top-bar dropdown that lets a user move between the
// platform's apps. Phase A keeps everything at today's URLs (no route
// changes); the switcher just makes the module boundary visible.
//
// Modules:
//   sales-copilot — Workbook, plays, offerings, scoring, account threads
//   admin-hub     — Tenant profile, integrations, users & teams
//
// Visibility is role-gated: admins see both, sellers see only Sales Co-Pilot
// (in which case the switcher renders as a static label, no dropdown).

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Wrench, Check, ChevronDown, LineChart } from 'lucide-react';
import { usePersona } from '../../context/PersonaContext.jsx';

// ─── Module classification ──────────────────────────────────────────
// /admin/* normally means Admin Hub, EXCEPT for these paths which are
// part of Sales Co-Pilot (Plays, Offerings, Scoring Models). The URLs
// haven't been migrated out of /admin yet — module identity is
// classification-based, not URL-prefix-based.
const SALES_COPILOT_ADMIN_PATHS = [
  '/admin/plays',
  '/admin/offerings',
  '/admin/scoring',
];

function isSalesCopilotAdminPath(pathname) {
  return SALES_COPILOT_ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

export const MODULES = [
  {
    id: 'sales-copilot',
    name: 'Sales Co-Pilot',
    description: 'Workbook, plays, offerings, scoring',
    icon: Sparkles,
    accentClasses: 'text-violet-700 dark:text-violet-300',
    pillClasses: 'bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300',
    landingPath: '/workbook',
    matches: (pathname) =>
      !pathname.startsWith('/admin') &&
      !pathname.startsWith('/market-analyzer') || isSalesCopilotAdminPath(pathname),
    requiredRole: null, // anyone
  },
  {
    id: 'market-analyzer',
    name: 'Market Analyzer',
    description: 'TAM/SAM/SOM projects, segments, scoring profiles',
    icon: LineChart,
    accentClasses: 'text-sky-700 dark:text-sky-300',
    pillClasses: 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300',
    landingPath: '/market-analyzer/projects',
    matches: (pathname) => pathname.startsWith('/market-analyzer'),
    requiredRole: 'admin',
  },
  {
    id: 'admin-hub',
    name: 'Admin Hub',
    description: 'Tenant profile, integrations, users & teams',
    icon: Wrench,
    accentClasses: 'text-slate-700 dark:text-slate-300',
    pillClasses: 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-300',
    landingPath: '/admin',
    matches: (pathname) =>
      pathname.startsWith('/admin') && !isSalesCopilotAdminPath(pathname),
    requiredRole: 'admin',
  },
];

export function resolveCurrentModule(pathname) {
  return MODULES.find((m) => m.matches(pathname)) || MODULES[0];
}

// ─── Component ────────────────────────────────────────────────────────

export default function ModuleSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { persona } = usePersona();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const isAdmin = persona?.roleType === 'admin';
  const accessible = MODULES.filter((m) => !m.requiredRole || m.requiredRole === persona?.roleType || isAdmin);
  const current = resolveCurrentModule(location.pathname);
  const Icon = current.icon;

  // Only one module visible → render a static pill, no dropdown.
  if (accessible.length <= 1) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${current.pillClasses}`}
        title={current.description}
      >
        <Icon size={11} />
        {current.name}
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors hover:opacity-90 ${current.pillClasses}`}
        title={`${current.name} · ${current.description}`}
      >
        <Icon size={11} />
        {current.name}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-40 left-0 top-full mt-1 w-[280px] bg-bg border border-border rounded-md shadow-elev overflow-hidden">
          <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-text-muted">
            Switch app
          </div>
          {accessible.map((m) => {
            const ItemIcon = m.icon;
            const isActive = m.id === current.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setOpen(false);
                  if (!isActive) navigate(m.landingPath);
                }}
                className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors ${
                  isActive ? 'bg-primary/5' : 'hover:bg-surface-2'
                }`}
              >
                <ItemIcon size={13} className={`mt-0.5 flex-shrink-0 ${m.accentClasses}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                    {m.name}
                    {isActive && <Check size={11} className="text-primary" />}
                  </div>
                  <div className="text-[11px] text-text-muted leading-tight mt-0.5">
                    {m.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
