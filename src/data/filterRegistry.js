// FilterRegistry — canonical catalog of HG filter dimensions for the
// admin workbook. Each entry defines:
//   - group, label, description       — for the FilterPanel UI
//   - widget                          — form widget type the panel renders
//   - defaultValue, options, etc.     — widget config
//   - buildPredicate(value)           — materializes the runtime filter fn
//   - format(value)                   — display-friendly string for chips
//
// All filters are spec-driven (serializable). Predicates are constructed
// from spec at filter-time, never persisted. This lets us round-trip
// filters into Workbook views later without serializing functions.

// ─── Internal predicate helpers ───────────────────────────────────────

function parseNumeric(s) {
  if (s == null || s === '') return null;
  if (typeof s === 'number') return s;
  const m = String(s).match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (Number.isNaN(n)) return null;
  const suffix = (m[2] || '').toUpperCase();
  if (suffix === 'K') return n * 1_000;
  if (suffix === 'M') return n * 1_000_000;
  if (suffix === 'B') return n * 1_000_000_000;
  return n;
}

function rgifOf(account) {
  return account?.rgif || {};
}

function withinRange(value, min, max) {
  if (value == null) return false;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

// ─── Filter groups (controls left-sidebar section order) ──────────────

export const FILTER_GROUPS = [
  'Accounts',
  'Scoring',
  'Intent',
  'Firmographics',
  'Technographics',
  'CRM Filters',
];

// Groups that only show when the tenant has a CRM connected. The FilterPanel
// checks this list against the active integrations before rendering.
export const CRM_GATED_GROUPS = new Set(['CRM Filters']);

// ─── Registry ─────────────────────────────────────────────────────────

export const FILTER_REGISTRY = {
  // ----- ACCOUNTS -----
  search_companies: {
    id: 'search_companies',
    group: 'Accounts',
    label: 'Search Companies',
    description: 'Match account name or domain (case-insensitive).',
    widget: 'minMax', // reuse the input but only "min" represents the query
    defaultValue: { min: '', max: '' },
    buildPredicate: (v) => {
      const q = String(v?.min || '').trim().toLowerCase();
      if (!q) return null;
      return (a) =>
        (a.name || '').toLowerCase().includes(q) ||
        (a.url || '').toLowerCase().includes(q);
    },
    format: (v) => (v?.min ? `name/domain ~ "${v.min}"` : null),
  },
  uploaded_accounts: {
    id: 'uploaded_accounts',
    group: 'Accounts',
    label: 'Uploaded Accounts',
    description: 'Only show accounts uploaded via CSV (CRM-only / matched).',
    widget: 'radio',
    defaultValue: 'any',
    options: [
      { id: 'any', label: 'Any source' },
      { id: 'crm', label: 'In tenant book (CRM or CSV)' },
      { id: 'hg', label: 'HG whitespace only' },
    ],
    buildPredicate: (v) => {
      if (v === 'any' || !v) return null;
      if (v === 'crm') return (a) => a.source === 'matched' || a.source === 'crm';
      if (v === 'hg') return (a) => a.source === 'hg';
      return null;
    },
    format: (v) =>
      v === 'crm' ? 'In tenant book' : v === 'hg' ? 'HG whitespace only' : null,
  },

  // ----- SCORING -----
  fit_score: {
    id: 'fit_score',
    group: 'Scoring',
    label: 'Fit Score',
    description: 'Filter by computed fit score (0–100) on the active lens.',
    widget: 'minMax',
    defaultValue: { min: '', max: '' },
    buildPredicate: (v) => {
      const min = parseNumeric(v?.min);
      const max = parseNumeric(v?.max);
      if (min == null && max == null) return null;
      return (a) => {
        const s = a.icpFit ?? a.combinedScore ?? null;
        return withinRange(s, min, max);
      };
    },
    format: (v) => {
      const min = v?.min ?? '';
      const max = v?.max ?? '';
      if (!min && !max) return null;
      return `${min || '0'}–${max || '100'}`;
    },
  },
  intent_score: {
    id: 'intent_score',
    group: 'Scoring',
    label: 'Intent Score',
    description: 'Filter by aggregate intent score (0–100).',
    widget: 'minMax',
    defaultValue: { min: '', max: '' },
    buildPredicate: (v) => {
      const min = parseNumeric(v?.min);
      const max = parseNumeric(v?.max);
      if (min == null && max == null) return null;
      return (a) => withinRange(a.intentScore, min, max);
    },
    format: (v) => {
      const min = v?.min ?? '';
      const max = v?.max ?? '';
      if (!min && !max) return null;
      return `${min || '0'}–${max || '100'}`;
    },
  },

  // ----- INTENT -----
  intent: {
    id: 'intent',
    group: 'Intent',
    label: 'Intent Topic',
    description: 'Active intent on a topic at or above a chosen level.',
    widget: 'intent',
    defaultValue: { topic: '', level: 'medium' },
    buildPredicate: (v) => {
      const topic = String(v?.topic || '').trim().toLowerCase();
      const level = v?.level || 'medium';
      if (!topic) return null;
      const order = { low: 1, medium: 2, high: 3 };
      return (a) =>
        (rgifOf(a).intent || []).some(
          (t) =>
            String(t.topic || '').toLowerCase().includes(topic) &&
            (order[t.level] || 0) >= (order[level] || 0),
        );
    },
    format: (v) => (v?.topic ? `${v.topic} · ${v.level || 'medium'}+` : null),
  },

  // ----- FIRMOGRAPHICS -----
  company_type: {
    id: 'company_type',
    group: 'Firmographics',
    label: 'Company Type',
    description: 'Public, private, or non-profit.',
    widget: 'radio',
    defaultValue: 'any',
    options: [
      { id: 'any', label: 'Any' },
      { id: 'public', label: 'Public' },
      { id: 'private', label: 'Private' },
      { id: 'nonprofit', label: 'Non-profit / Government' },
    ],
    buildPredicate: (v) => {
      if (v === 'any' || !v) return null;
      return (a) => {
        const s = String(a?.fai?.stage || '').toLowerCase();
        if (v === 'public') return s.includes('public');
        if (v === 'private') return s.includes('private');
        if (v === 'nonprofit') return /(government|public administration|non-profit|non profit|nonprofit)/i.test(s) || /(government|public administration)/i.test(a?.industry || '');
        return true;
      };
    },
    format: (v) => (v && v !== 'any' ? String(v).replace(/^./, (c) => c.toUpperCase()) : null),
  },
  emp_count: {
    id: 'emp_count',
    group: 'Firmographics',
    label: 'Employee Count',
    description: 'Total worldwide employees (HG firmographic).',
    widget: 'minMax',
    defaultValue: { min: '', max: '', fixedOnly: false },
    allowFixedOnly: true,
    buildPredicate: (v) => {
      const min = parseNumeric(v?.min);
      const max = parseNumeric(v?.max);
      if (min == null && max == null) return null;
      return (a) => {
        const emp = parseNumeric(a?.fai?.employees);
        return withinRange(emp, min, max);
      };
    },
    format: (v) => {
      const min = v?.min ?? '';
      const max = v?.max ?? '';
      if (!min && !max) return null;
      return `${min || '0'}–${max || '∞'}`;
    },
  },
  revenue: {
    id: 'revenue',
    group: 'Firmographics',
    label: 'Revenue',
    description: 'Annual revenue (USD).',
    widget: 'minMax',
    defaultValue: { min: '', max: '' },
    hint: 'Use suffixes like 100M or 1B.',
    buildPredicate: (v) => {
      const min = parseNumeric(v?.min);
      const max = parseNumeric(v?.max);
      if (min == null && max == null) return null;
      return (a) => {
        const rev = parseNumeric(a?.fai?.revenue);
        return withinRange(rev, min, max);
      };
    },
    format: (v) => {
      const min = v?.min ?? '';
      const max = v?.max ?? '';
      if (!min && !max) return null;
      return `${min || '0'}–${max || '∞'}`;
    },
  },
  industry: {
    id: 'industry',
    group: 'Firmographics',
    label: 'Industry',
    description: 'Select one or more industries (HG NAICS).',
    widget: 'multiSelect',
    defaultValue: [],
    options: (dyn) => dyn.industries,
    buildPredicate: (v) => {
      if (!Array.isArray(v) || v.length === 0) return null;
      const ids = new Set(v);
      // The mock industry strings vary; we match by keyword.
      const KEYWORDS = {
        banking: ['banking', 'financial'],
        healthcare: ['health'],
        retail: ['retail'],
        manufacturing: ['manufacturing'],
        tech: ['computer', 'electronic'],
        media: ['media', 'entertainment'],
        public: ['public administration', 'government'],
        energy: ['energy'],
      };
      return (a) => {
        const i = String(a.industry || '').toLowerCase();
        return v.some((id) => (KEYWORDS[id] || [id]).some((k) => i.includes(k)));
      };
    },
    format: (v) => (Array.isArray(v) && v.length > 0 ? `${v.length} selected` : null),
  },
  geography: {
    id: 'geography',
    group: 'Firmographics',
    label: 'Geography',
    description: 'HQ country.',
    widget: 'multiSelect',
    defaultValue: [],
    options: (dyn) => dyn.geography,
    buildPredicate: (v) => {
      if (!Array.isArray(v) || v.length === 0) return null;
      const KEYWORDS = {
        usa: ['ny', 'ca', 'tx', 'mn', 'wa', 'united states', 'usa', 'us'],
        canada: ['toronto', 'vancouver', 'ottawa', 'canada'],
        uk: ['london', 'manchester', 'united kingdom', 'uk', 'england'],
        germany: ['berlin', 'munich', 'germany'],
        france: ['paris', 'france'],
        australia: ['sydney', 'melbourne', 'australia'],
        singapore: ['singapore'],
        india: ['bangalore', 'mumbai', 'delhi', 'india'],
      };
      return (a) => {
        const hq = String(a?.fai?.hq || '').toLowerCase();
        return v.some((id) => (KEYWORDS[id] || [id]).some((k) => hq.includes(k)));
      };
    },
    format: (v) => (Array.isArray(v) && v.length > 0 ? `${v.length} selected` : null),
  },

  // ----- TECHNOGRAPHICS -----
  product_categories: {
    id: 'product_categories',
    group: 'Technographics',
    label: 'Product Categories',
    description: 'Has any product installed in a selected category.',
    widget: 'multiSelect',
    defaultValue: [],
    options: (dyn) => dyn.productCategories,
    buildPredicate: (v) => {
      if (!Array.isArray(v) || v.length === 0) return null;
      // Mock map: category → product keys we treat as belonging to it.
      const CATEGORY_TO_PRODUCTS = {
        cnapp: ['palo-alto-prisma', 'wiz', 'lacework', 'orca-security'],
        cspm: ['palo-alto-prisma', 'lacework', 'orca-security'],
        edr: ['crowdstrike-falcon'],
        siem: ['splunk'],
        iam: ['okta', 'sailpoint'],
        iac: ['terraform'],
      };
      return (a) => {
        const installs = rgifOf(a).installs || {};
        return v.some((cat) =>
          (CATEGORY_TO_PRODUCTS[cat] || []).some((key) => installs[key]?.present),
        );
      };
    },
    format: (v) => (Array.isArray(v) && v.length > 0 ? `${v.length} categor${v.length === 1 ? 'y' : 'ies'}` : null),
  },
  products: {
    id: 'products',
    group: 'Technographics',
    label: 'Products',
    description: 'Has specific products installed.',
    widget: 'multiSelect',
    defaultValue: [],
    options: (dyn) => dyn.products,
    buildPredicate: (v) => {
      if (!Array.isArray(v) || v.length === 0) return null;
      return (a) => {
        const installs = rgifOf(a).installs || {};
        return v.some((key) => installs[key]?.present);
      };
    },
    format: (v) => (Array.isArray(v) && v.length > 0 ? `${v.length} selected` : null),
  },
  vendors: {
    id: 'vendors',
    group: 'Technographics',
    label: 'Vendors',
    description: 'Has any product from a selected vendor.',
    widget: 'multiSelect',
    defaultValue: [],
    options: (dyn) => dyn.vendors,
    buildPredicate: (v) => {
      if (!Array.isArray(v) || v.length === 0) return null;
      const VENDOR_TO_PRODUCTS = {
        'palo-alto': ['palo-alto-prisma'],
        crowdstrike: ['crowdstrike-falcon'],
        wiz: ['wiz'],
        lacework: ['lacework'],
        aws: ['aws'],
        microsoft: ['azure', 'microsoft-defender'],
      };
      return (a) => {
        const installs = rgifOf(a).installs || {};
        return v.some((vid) =>
          (VENDOR_TO_PRODUCTS[vid] || [vid]).some((key) => installs[key]?.present),
        );
      };
    },
    format: (v) => (Array.isArray(v) && v.length > 0 ? `${v.length} selected` : null),
  },

  // ----- CRM FILTERS (gated by CRM connection) -----
  crm_stage: {
    id: 'crm_stage',
    group: 'CRM Filters',
    label: 'Opportunity Stage',
    description: 'Filter by CRM opportunity stage.',
    widget: 'multiSelect',
    defaultValue: [],
    options: [
      { id: 'prospect', label: 'Prospect' },
      { id: 'qualified', label: 'Qualified' },
      { id: 'discovery', label: 'Discovery' },
      { id: 'proposal', label: 'Proposal' },
      { id: 'negotiation', label: 'Negotiation' },
      { id: 'closed-won', label: 'Closed Won' },
      { id: 'customer', label: 'Customer' },
      { id: 'renewal', label: 'Renewal' },
    ],
    buildPredicate: (v) => {
      if (!Array.isArray(v) || v.length === 0) return null;
      const set = new Set(v);
      return (a) => set.has(String(a?.stage || '').toLowerCase());
    },
    format: (v) => (Array.isArray(v) && v.length > 0 ? `${v.length} selected` : null),
  },
  crm_owner: {
    id: 'crm_owner',
    group: 'CRM Filters',
    label: 'Owner',
    description: 'Filter by account owner (sales rep).',
    widget: 'multiSelect',
    defaultValue: [],
    options: [
      { id: 'alex', label: 'Alex Chen' },
      { id: 'priya', label: 'Priya Sharma' },
      { id: 'unassigned', label: 'Unassigned' },
    ],
    buildPredicate: (v) => {
      if (!Array.isArray(v) || v.length === 0) return null;
      const set = new Set(v);
      return (a) =>
        (a?.ownerIds || []).some((id) => set.has(id)) ||
        (set.has('unassigned') && (!a?.ownerIds || a.ownerIds.length === 0));
    },
    format: (v) => (Array.isArray(v) && v.length > 0 ? `${v.length} selected` : null),
  },
  crm_last_activity: {
    id: 'crm_last_activity',
    group: 'CRM Filters',
    label: 'Last Activity',
    description: 'Days since last meaningful touch.',
    widget: 'minMax',
    defaultValue: { min: '', max: '' },
    hint: 'Days. e.g. min=14 to find stale accounts.',
    buildPredicate: (v) => {
      const min = parseNumeric(v?.min);
      const max = parseNumeric(v?.max);
      if (min == null && max == null) return null;
      return (a) => {
        const days = a?.lastTouchDaysAgo;
        if (days == null) return min != null; // treat unknown as stale when filtering for stale
        return withinRange(days, min, max);
      };
    },
    format: (v) => {
      const min = v?.min ?? '';
      const max = v?.max ?? '';
      if (!min && !max) return null;
      return `${min || '0'}–${max || '∞'} days`;
    },
  },
  crm_renewal_window: {
    id: 'crm_renewal_window',
    group: 'CRM Filters',
    label: 'Renewal Window',
    description: 'Customers with renewal in N days.',
    widget: 'minMax',
    defaultValue: { min: '', max: '' },
    hint: 'Days until renewal. e.g. max=90 for next-quarter renewals.',
    buildPredicate: (v) => {
      const min = parseNumeric(v?.min);
      const max = parseNumeric(v?.max);
      if (min == null && max == null) return null;
      // Mock — accounts.stage === 'renewal' implies renewal window. Real
      // CRM data would have a concrete renewalDate field.
      return (a) => a?.stage === 'renewal' || a?.stage === 'customer';
    },
    format: (v) => {
      const min = v?.min ?? '';
      const max = v?.max ?? '';
      if (!min && !max) return null;
      return `${min || '0'}–${max || '∞'} days`;
    },
  },
  crm_opp_value: {
    id: 'crm_opp_value',
    group: 'CRM Filters',
    label: 'Open Opp Value',
    description: 'Minimum value of open opportunities (USD).',
    widget: 'minMax',
    defaultValue: { min: '', max: '' },
    hint: 'Use suffixes like 100K or 1M.',
    buildPredicate: (v) => {
      const min = parseNumeric(v?.min);
      const max = parseNumeric(v?.max);
      if (min == null && max == null) return null;
      return (a) => withinRange(parseNumeric(a?.oppValue), min, max);
    },
    format: (v) => {
      const min = v?.min ?? '';
      const max = v?.max ?? '';
      if (!min && !max) return null;
      return `${min || '0'}–${max || '∞'}`;
    },
  },
  crm_region: {
    id: 'crm_region',
    group: 'CRM Filters',
    label: 'CRM Region',
    description: 'Sales region or territory from CRM.',
    widget: 'multiSelect',
    defaultValue: [],
    options: [
      { id: 'amer', label: 'AMER' },
      { id: 'emea', label: 'EMEA' },
      { id: 'apac', label: 'APAC' },
      { id: 'latam', label: 'LATAM' },
    ],
    buildPredicate: (v) => {
      if (!Array.isArray(v) || v.length === 0) return null;
      return (a) => v.includes(String(a?.region || '').toLowerCase());
    },
    format: (v) => (Array.isArray(v) && v.length > 0 ? v.join(', ').toUpperCase() : null),
  },
};

// Materialize all spec → predicates at filter-time.
export function buildPredicates(filters) {
  return filters
    .map((f) => {
      const spec = FILTER_REGISTRY[f.specId || f.id];
      if (!spec) return null;
      return spec.buildPredicate(f.value);
    })
    .filter(Boolean);
}
