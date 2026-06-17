// Filter taxonomy for the rich filter panel. Two top-level categories
// (HG Data — third-party signals; CRM Data — your own pipeline data).
// Each filter id maps to a row matcher that operates on a company record.

import { FINTECH_WHITESPACE_COMPANIES } from './fintechWhitespaceData.js';

export const FILTER_GROUPS = {
  hgData: [
    {
      id: 'vendors',
      label: 'Vendors',
      icon: 'box',
      hint: 'Tech installs detected on the company',
      // Match: any tech install with this name OR competitor matching
      match: (row, value) =>
        (row.techInstalls || []).some((t) => t.name?.toLowerCase().includes(value.toLowerCase())) ||
        (row.competitors || []).some((c) => c.toLowerCase().includes(value.toLowerCase())),
      options: ['Salesforce', '6sense', 'ZoomInfo', 'Apollo.io', 'HubSpot', 'Marketo', 'Outreach', 'Snowflake', 'Segment'],
      includeMeta: { afterDate: 'Install last verified', defaultDate: 'Jan 2025' },
    },
    {
      id: 'products',
      label: 'Products',
      icon: 'package',
      hint: 'Specific products or modules',
      match: (row, value) =>
        (row.techInstalls || []).some((t) => t.name?.toLowerCase().includes(value.toLowerCase())),
      options: ['Salesforce CRM', 'Salesforce Marketing Cloud', 'Marketo', 'HubSpot', 'Outreach', 'ZoomInfo SalesOS', '6sense Revenue AI', 'Segment', 'Gainsight'],
    },
    {
      id: 'industry',
      label: 'Industry',
      icon: 'briefcase',
      hint: 'Industry classification',
      match: (row, value) => row.industry?.toLowerCase().includes(value.toLowerCase()),
      options: ['FinTech', 'Enterprise Software', 'Cybersecurity', 'Cloud Data Platform', 'B2B SaaS', 'InsurTech', 'FinTech / Vertical SaaS'],
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: 'users',
      hint: 'Headcount band',
      match: (row, value) => {
        const e = row.employees || 0;
        if (value === '< 1,000') return e < 1000;
        if (value === '1,000 – 5,000') return e >= 1000 && e <= 5000;
        if (value === '5,000 – 10,000') return e >= 5000 && e <= 10000;
        if (value === '10,000+') return e > 10000;
        return false;
      },
      options: ['< 1,000', '1,000 – 5,000', '5,000 – 10,000', '10,000+'],
    },
    {
      id: 'revenue',
      label: 'Revenue',
      icon: 'dollar-sign',
      hint: 'Annual revenue band',
      match: (row, value) => {
        const r = row.revenue || 0;
        if (value === '< $500M') return r < 5e8;
        if (value === '$500M – $1B') return r >= 5e8 && r < 1e9;
        if (value === '$1B – $5B') return r >= 1e9 && r < 5e9;
        if (value === '$5B+') return r >= 5e9;
        return false;
      },
      options: ['< $500M', '$500M – $1B', '$1B – $5B', '$5B+'],
    },
    {
      id: 'intent',
      label: 'Intent topics',
      icon: 'zap',
      hint: 'Active topic intent on Bombora / TrustRadius',
      match: (row, value) =>
        (row.intentTopics || []).some((t) => t.name?.toLowerCase().includes(value.toLowerCase())),
      options: ['Competitor Intent', 'Category Intent', 'TrustRadius Intent'],
    },
  ],
  crmData: [
    {
      id: 'status',
      label: 'Relationship',
      icon: 'user-check',
      hint: 'Customer / prospect status',
      match: (row, value) => row.status === value,
      options: ['Prospect', 'Customer', 'At Risk', 'Lost'],
    },
    {
      id: 'stage',
      label: 'Deal stage',
      icon: 'flag',
      hint: 'Pipeline stage',
      match: (row, value) => row.crmContext?.stage === value,
      options: ['Discovery', 'Qualification', 'Negotiation', 'Renewal', 'Closed Won', 'Closed Lost'],
    },
    {
      id: 'owner',
      label: 'Owner',
      icon: 'user',
      hint: 'Assigned account owner',
      match: (row, value) => row.owner?.name === value,
      options: ['Sarah Miller', 'Marcus Kim', 'James Chen', 'Priya Patel', 'Alex Rodriguez'],
    },
    {
      id: 'lastActivity',
      label: 'Last activity',
      icon: 'clock',
      hint: 'Time since last touch',
      match: (row, value) => {
        // Loose match using string heuristic
        const la = row.crmContext?.lastActivity || '';
        if (value === 'Within 7 days') return /day|hour/i.test(la) && /\b[1-7]\b/.test(la);
        if (value === '7-30 days') return /\b(\d+) days?\b/.test(la);
        if (value === '30+ days') return /weeks|month/i.test(la);
        return false;
      },
      options: ['Within 7 days', '7-30 days', '30+ days'],
    },
  ],
};

export const FILTER_GROUP_LABELS = {
  hgData: 'HG Data',
  crmData: 'CRM Data',
};

// Apply a flat list of {id,value} filters to a row. AND across distinct ids,
// OR within the same id (multi-select within a group).
export function rowMatchesFilters(row, filters) {
  if (!filters || filters.length === 0) return true;
  const byId = new Map();
  for (const f of filters) {
    if (!byId.has(f.id)) byId.set(f.id, []);
    byId.get(f.id).push(f);
  }
  for (const [id, list] of byId) {
    const def = findDef(id);
    if (!def) continue;
    const anyMatch = list.some((f) => def.match(row, f.value));
    if (!anyMatch) return false;
  }
  return true;
}

function findDef(id) {
  return [...FILTER_GROUPS.hgData, ...FILTER_GROUPS.crmData].find((g) => g.id === id);
}

// Pre-defined filter sets the AI applies (referenced by variant)
export const FILTER_PRESETS = {
  initial: [
    { id: 'industry', value: 'FinTech', appliedBy: 'ai' },
    { id: 'vendors', value: 'Salesforce', appliedBy: 'ai' },
    { id: 'revenue', value: '$1B – $5B', appliedBy: 'ai' },
    { id: 'employees', value: '5,000 – 10,000', appliedBy: 'ai' },
  ],
  highPropensitySignals: [
    { id: 'industry', value: 'FinTech', appliedBy: 'ai' },
    { id: 'vendors', value: 'Salesforce', appliedBy: 'ai' },
  ],
  emeaTighten: [
    { id: 'vendors', value: 'Salesforce', appliedBy: 'ai' },
    { id: 'vendors', value: 'HubSpot', appliedBy: 'ai' },
    { id: 'industry', value: 'FinTech', appliedBy: 'ai' },
    { id: 'intent', value: 'Competitor Intent', appliedBy: 'ai' },
    { id: 'status', value: 'Prospect', appliedBy: 'ai' },
  ],
};

// Stats helper — for "X in CRM · Y net new" footer
export function summarize(rows) {
  return {
    total: rows.length,
    inCrm: rows.filter((r) => r.crmContext?.stage && r.crmContext.stage !== '—').length,
    netNew: rows.filter((r) => !r.crmContext?.stage || r.crmContext.stage === '—').length,
  };
}
