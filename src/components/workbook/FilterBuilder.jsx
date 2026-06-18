// FilterBuilder — "+ Filter" button + popover that lets the admin add HG
// filter dimensions on top of the workbook. Filters compose with the
// active source tab, offering refine, and sales play (intersect / AND).
//
// Categories supported (prototype): Firmographics, Technographics, Intent,
// IT Spend, Engagement. Each category exposes 2-3 canned filter options so
// the demo shows the pattern without exploding scope.

import { useState, useRef, useEffect } from 'react';
import {
  Filter,
  Plus,
  Building2,
  Cpu,
  Sparkles,
  DollarSign,
  Activity,
  ChevronRight,
  X,
} from 'lucide-react';

// ─── Filter catalog ────────────────────────────────────────────────────

// Each option produces a filter chip { id, category, label, predicate }.
// The predicate runs against the account row (with rgif + signals).
// We keep these inline so the prototype demonstrates the pattern; in
// production the catalog would come from a registry driven by HG's
// canonical dimensions.

function rgifOf(account) {
  return account?.rgif || {};
}

function hasInstall(account, productKey, minIntensity = 0) {
  const installs = rgifOf(account).installs || {};
  const inst = installs[productKey];
  if (!inst?.present) return false;
  if (minIntensity > 0 && (inst.intensity || 0) < minIntensity) return false;
  return true;
}

function hasIntentTopic(account, topicKey, minLevel = 'medium') {
  const intent = rgifOf(account).intent || [];
  const order = { low: 1, medium: 2, high: 3 };
  return intent.some(
    (t) =>
      String(t.topic || '').toLowerCase().includes(topicKey) &&
      (order[t.level] || 0) >= (order[minLevel] || 0),
  );
}

function spendForKey(account, key) {
  const raw = rgifOf(account).spend?.[key];
  if (!raw) return 0;
  // "$48M" → 48
  const m = String(raw).match(/\$?([\d.]+)([MB])?/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (Number.isNaN(n)) return 0;
  return m[2]?.toUpperCase() === 'B' ? n * 1000 : n;
}

const CATEGORIES = [
  {
    id: 'firm',
    label: 'Firmographics',
    icon: Building2,
    options: [
      {
        id: 'firm-enterprise',
        label: 'Enterprise (10K+ employees)',
        build: () => ({
          predicate: (a) => {
            const emp = String(a?.fai?.employees || '').toUpperCase();
            if (!emp) return false;
            if (emp.includes('K')) {
              const n = parseFloat(emp);
              return n >= 10;
            }
            const n = parseInt(emp.replace(/,/g, ''), 10);
            return n >= 10000;
          },
        }),
      },
      {
        id: 'firm-mid',
        label: 'Mid-market (1K–10K employees)',
        build: () => ({
          predicate: (a) => {
            const emp = String(a?.fai?.employees || '').toUpperCase();
            if (!emp) return false;
            if (emp.includes('K')) {
              const n = parseFloat(emp);
              return n >= 1 && n < 10;
            }
            const n = parseInt(emp.replace(/,/g, ''), 10);
            return n >= 1000 && n < 10000;
          },
        }),
      },
      {
        id: 'firm-financial',
        label: 'Banking & Financial Services',
        build: () => ({
          predicate: (a) =>
            String(a?.industry || '').toLowerCase().includes('financial') ||
            String(a?.industry || '').toLowerCase().includes('banking'),
        }),
      },
      {
        id: 'firm-public',
        label: 'Public company',
        build: () => ({
          predicate: (a) =>
            String(a?.fai?.stage || '').toLowerCase().includes('public'),
        }),
      },
    ],
  },
  {
    id: 'tech',
    label: 'Technographics',
    icon: Cpu,
    options: [
      {
        id: 'tech-prisma',
        label: 'Has Palo Alto Prisma Cloud installed',
        build: () => ({
          predicate: (a) => hasInstall(a, 'palo-alto-prisma'),
        }),
      },
      {
        id: 'tech-prisma-declining',
        label: 'Prisma intensity declining',
        build: () => ({
          predicate: (a) => {
            const inst = rgifOf(a).installs?.['palo-alto-prisma'];
            return !!(inst?.present && inst?.trend === 'declining');
          },
        }),
      },
      {
        id: 'tech-aws',
        label: 'AWS in cloud stack',
        build: () => ({
          predicate: (a) =>
            (rgifOf(a).clouds || []).some((c) => String(c).toUpperCase() === 'AWS') ||
            String(a?.cloud || '').toUpperCase().includes('AWS'),
        }),
      },
      {
        id: 'tech-multicloud',
        label: 'Multi-cloud (2+ providers)',
        build: () => ({
          predicate: (a) => {
            const clouds = rgifOf(a).clouds || [];
            if (clouds.length >= 2) return true;
            return /\+/.test(String(a?.cloud || ''));
          },
        }),
      },
    ],
  },
  {
    id: 'intent',
    label: 'Intent',
    icon: Sparkles,
    options: [
      {
        id: 'intent-cnapp-high',
        label: 'High intent on CNAPP',
        build: () => ({
          predicate: (a) => hasIntentTopic(a, 'cnapp', 'high'),
        }),
      },
      {
        id: 'intent-zerotrust',
        label: 'Active intent on Zero Trust',
        build: () => ({
          predicate: (a) => hasIntentTopic(a, 'zero', 'medium'),
        }),
      },
      {
        id: 'intent-iam',
        label: 'Active intent on Identity / IAM',
        build: () => ({
          predicate: (a) =>
            hasIntentTopic(a, 'identity', 'medium') || hasIntentTopic(a, 'iam', 'medium'),
        }),
      },
    ],
  },
  {
    id: 'spend',
    label: 'IT Spend',
    icon: DollarSign,
    options: [
      {
        id: 'spend-security-50m',
        label: 'Security spend ≥ $50M',
        build: () => ({ predicate: (a) => spendForKey(a, 'security') >= 50 }),
      },
      {
        id: 'spend-cloud-100m',
        label: 'Cloud spend ≥ $100M',
        build: () => ({ predicate: (a) => spendForKey(a, 'cloud') >= 100 }),
      },
      {
        id: 'spend-growing',
        label: 'Spend trend = growing',
        build: () => ({
          predicate: (a) =>
            String(rgifOf(a).spendTrend || '').toLowerCase() === 'growing',
        }),
      },
    ],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    icon: Activity,
    options: [
      {
        id: 'eng-stale',
        label: 'No touch in 14+ days',
        build: () => ({
          predicate: (a) => {
            const d = a?.lastTouchDaysAgo;
            return d == null || d >= 14;
          },
        }),
      },
      {
        id: 'eng-new-champion',
        label: 'New champion signal',
        build: () => ({
          predicate: (a) =>
            (a?.signals || []).some(
              (s) => s.type === 'web_event' && /CISO|champion|joined/i.test(s.headline || ''),
            ),
        }),
      },
      {
        id: 'eng-active-rfp',
        label: 'Active RFP / RFI signal',
        build: () => ({
          predicate: (a) =>
            (a?.signals || []).some(
              (s) => s.type === 'intent_surge' || /RFP|RFI/i.test(s.headline || ''),
            ),
        }),
      },
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────────────

export default function FilterBuilder({ filters, onAdd, onClear }) {
  const [open, setOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState('firm');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const activeCategory = CATEGORIES.find((c) => c.id === activeCategoryId) || CATEGORIES[0];
  const usedIds = new Set(filters.map((f) => f.id));

  const handleAddOption = (cat, opt) => {
    if (usedIds.has(opt.id)) return;
    const built = opt.build();
    onAdd({
      id: opt.id,
      category: cat.id,
      categoryLabel: cat.label,
      label: opt.label,
      predicate: built.predicate,
    });
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-md transition-colors ${
          filters.length > 0
            ? 'bg-primary/10 text-primary border-primary/40'
            : 'bg-surface text-text-secondary border-border hover:text-primary hover:border-primary/40'
        }`}
        title="Add HG filter"
      >
        <Filter size={11} />
        Filter
        {filters.length > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary">
            {filters.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 z-30 bg-bg border border-border rounded-md shadow-elev w-[480px] flex">
          <div className="w-40 border-r border-border py-2">
            <div className="px-3 pb-1 text-[10px] uppercase tracking-wider font-semibold text-text-muted">
              Filter by
            </div>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === activeCategoryId;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`w-full text-left px-3 py-1.5 text-xs inline-flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                  }`}
                >
                  <Icon size={12} className="flex-shrink-0" />
                  <span className="flex-1 truncate">{cat.label}</span>
                  <ChevronRight size={10} className="text-text-muted flex-shrink-0" />
                </button>
              );
            })}
            {filters.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/60 px-3">
                <button
                  onClick={() => {
                    onClear();
                    setOpen(false);
                  }}
                  className="text-[11px] text-rose-600 hover:underline inline-flex items-center gap-1"
                >
                  <X size={10} /> Clear all
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 py-2 max-h-80 overflow-y-auto thin-scrollbar">
            <div className="px-3 pb-1 text-[10px] uppercase tracking-wider font-semibold text-text-muted">
              {activeCategory.label}
            </div>
            {activeCategory.options.map((opt) => {
              const already = usedIds.has(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => handleAddOption(activeCategory, opt)}
                  disabled={already}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                    already
                      ? 'text-text-muted cursor-not-allowed'
                      : 'text-text-primary hover:bg-primary/5'
                  }`}
                  title={already ? 'Already added' : 'Add this filter'}
                >
                  <Plus size={10} className={already ? 'text-text-muted' : 'text-primary'} />
                  <span className="flex-1">{opt.label}</span>
                  {already && (
                    <span className="text-[9px] text-text-muted italic">added</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
