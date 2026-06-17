// Unified company lookup. The Company Detail drawer reads from any of these
// sources by ID — fintech whitespace, Jordan's book, APAC market analysis.

import { FINTECH_WHITESPACE_COMPANIES } from './fintechWhitespaceData.js';
import { JORDAN_BOOK } from './accountData.js';
import { APAC_COMPANIES } from './apacTamData.js';

// Normalize the various shapes into the rich shape the drawer expects.
function normalize(record, source) {
  const base = {
    id: record.id,
    name: record.name,
    initials: record.initials || record.name?.slice(0, 4).toUpperCase(),
    logoColor: record.logoColor || '#E0E7FF',
    logoText: record.logoText || '#3730A3',
    industry: record.industry || 'Unknown',
    description: record.description || '',
    status: record.status || 'Prospect',
    location: record.location || record.country || record.hq || '—',
    hq: record.hq || record.location || record.country || '—',
    founded: record.founded || null,
    type: record.type || '—',
    employees: record.employees,
    employeesLabel: record.employeesLabel || (typeof record.employees === 'number' ? record.employees.toLocaleString() : record.employees) || '—',
    revenue: record.revenue,
    revenueLabel: record.revenueLabel || record.revenue || '—',
    itSpend: record.itSpend || '—',
    propensity: record.propensity ?? record.score ?? null,
    propensityLabel: record.propensityLabel || (record.score ? `Score ${record.score}` : null),
    signalsCount: record.signalsCount ?? (record.recentSignals?.length || 0),
    intentTopics: record.intentTopics || [],
    competitors: record.competitors || (record.competitor && record.competitor !== 'None' ? [record.competitor] : []),
    displacement: record.displacement || (record.competitor && record.competitor !== 'None'),
    owner: record.owner || null,
    crmContext: record.crmContext || {
      stage: '—',
      openOpps: 0,
      acv: record.arrLabel || '—',
      lastActivity: record.lastTouchLabel || '—',
    },
    techInstalls: record.techInstalls || [],
    contacts: record.contacts || [],
    recentSignals: record.recentSignals || [],
    source,
  };

  // Carry through extras useful for triage list rows (Jordan's book)
  if (record.tier) base.tier = record.tier;
  if (record.intent) base.intent = record.intent;
  if (record.intentScore != null) base.intentScore = record.intentScore;
  if (record.lastTouchLabel) base.lastTouchLabel = record.lastTouchLabel;
  if (record.whyNow) base.whyNow = record.whyNow;
  if (record.threadId) base.threadId = record.threadId;
  if (record.opportunity) base.opportunity = record.opportunity;
  if (record.country) base.country = record.country;

  return base;
}

const REGISTRY = new Map();

for (const c of FINTECH_WHITESPACE_COMPANIES) {
  REGISTRY.set(c.id, normalize(c, 'whitespace'));
}
for (const c of JORDAN_BOOK) {
  REGISTRY.set(c.id, normalize(c, 'book'));
}
for (const c of APAC_COMPANIES) {
  REGISTRY.set(c.id, normalize(c, 'apac'));
}

export function findCompanyById(id) {
  return REGISTRY.get(id) || null;
}
