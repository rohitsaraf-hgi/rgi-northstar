// Fixture data for the adaptive TAM/SAM/SOM thread. Three primary variants
// progress through the demo script: global-default → fintech-na-tam → fintech-na-sized.

export const TAM_SAM_SOM_VARIANTS = {
  'global-default': {
    label: 'Global · Software',
    tam: { spend: '$4.7T', companies: '27,845,490', label: 'Software · global', dim: false },
    sam: { spend: '—', companies: '—', label: 'Define ICP to compute', dim: true },
    som: { spend: '—', companies: '—', label: 'Define ICP to compute', dim: true },
    filters: [
      { id: 'spend', label: 'Spend', value: 'Software', removable: true },
    ],
  },
  'fintech-na-tam': {
    label: 'Fintech · North America',
    tam: { spend: '$1.4T', companies: '27,845,490', label: 'Software · global', dim: false },
    sam: { spend: '—', companies: '—', label: 'Awaiting ICP', dim: true },
    som: { spend: '—', companies: '—', label: 'Awaiting ICP', dim: true },
    filters: [
      { id: 'spend', label: 'Spend', value: 'Software', removable: true },
      { id: 'industry', label: 'Industry', value: 'Fintech', removable: true },
      { id: 'geo', label: 'Geo', value: 'North America', removable: true },
    ],
  },
  'fintech-na-sized': {
    label: 'Fintech · North America · Sized',
    tam: { spend: '$1.4T', companies: '27,845,490', label: 'Software · global', dim: false },
    sam: { spend: '$102.4B', companies: '1,436,243', label: '7.3% of TAM', dim: false },
    som: { spend: '$58.3B', companies: '271', label: '<1% of SAM', dim: false, highlight: true },
    filters: [
      { id: 'spend', label: 'Spend', value: 'Software', removable: true },
      { id: 'industry', label: 'Industry', value: 'BFS · Insurance · Computer/Electronic', removable: true },
      { id: 'geo', label: 'Geo', value: 'USA · Canada', removable: true },
      { id: 'revenue', label: 'Revenue', value: '$1B+', removable: true },
      { id: 'employees', label: 'Employees', value: '10K+', removable: true },
    ],
  },
};

// Breakdown charts data — by geography, industry, revenue band, employee band
export const TAM_SAM_SOM_BREAKDOWNS = {
  'fintech-na-sized': {
    geography: [
      { label: 'United States', value: 58.3 },
      { label: 'Canada', value: 5.2 },
    ],
    industry: [
      { label: 'Banking & Financial Services', value: 31.4 },
      { label: 'Insurance', value: 14.2 },
      { label: 'Computer & Electronic Mfg', value: 7.8 },
      { label: 'Professional, Scientific & Tech', value: 4.9 },
    ],
    revenue: [
      { label: '$5B+', value: 53.8 },
      { label: '$1B–$5B', value: 4.6 },
    ],
    employees: [
      { label: '10K+', value: 58.3 },
    ],
  },
};

// Competitor penetration fixture
export const COMPETITOR_PENETRATION = {
  'palo-alto': {
    competitor: 'Palo Alto Networks',
    totalInScope: 271,
    installed: 153,
    pctInstalled: 56.5,
    notInstalled: 118,
    pctNotInstalled: 43.5,
    keyPlayers: [
      { name: 'Microsoft 365 Apps & Services', pct: 91.9, count: 249 },
      { name: 'Microsoft 365', pct: 90.0, count: 244 },
      { name: 'Google Marketing Platform', pct: 88.6, count: 240 },
      { name: 'Google Tag Manager', pct: 88.2, count: 239 },
      { name: 'Adobe (Unspecified)', pct: 86.3, count: 234 },
      { name: 'Atlassian (Unspecified)', pct: 83.8, count: 227 },
    ],
  },
};

// Whitespace company list — same shape as existing FINTECH_WHITESPACE_COMPANIES
// but with a categorical "opportunity type" column added.
// fit/intent are pre-computed scores (0–100) the demo will use once the user
// applies a scoring profile. These reflect realistic patterns: BFS companies
// score higher fit; companies with security intent surges score higher intent.
export const TAM_SAM_SOM_WHITESPACE = {
  totals: { all: 168, customer: 8, expansion: 6, prospect: 154 },
  companies: [
    { id: 'jpmc', name: 'JPMorgan Chase & Co.', url: 'jpmorganchase.com', country: 'USA', industry: 'Banking and Financial Services', employees: '309K', revenue: '$162.4B', itSpend: '$16.9B', competitor: 'Palo Alto Networks', opportunity: 'Prospect Whitespace', fit: 94, intent: 87, intentTopics: ['Zero Trust', 'cloud cybersecurity'] },
    { id: 'visa', name: 'Visa Inc.', url: 'visa.com', country: 'USA', industry: 'Banking and Financial Services', employees: '28K', revenue: '$36.0B', itSpend: '$4.2B', competitor: 'None', opportunity: 'Prospect Whitespace', fit: 92, intent: 78, intentTopics: ['Zero Trust Architecture', 'cybersecurity solutions'] },
    { id: 'mastercard', name: 'Mastercard Incorporated', url: 'mastercard.com', country: 'USA', industry: 'Banking and Financial Services', employees: '32K', revenue: '$25.1B', itSpend: '$2.9B', competitor: 'None', opportunity: 'Prospect Whitespace', fit: 91, intent: 81, intentTopics: ['endpoint cybersecurity', 'Zero Trust'] },
    { id: 'apple', name: 'Apple, Inc.', url: 'apple.com', country: 'USA', industry: 'Computer and Electronic Product Manufacturing', employees: '166K', revenue: '$416.2B', itSpend: '$35.4B', competitor: 'Palo Alto Networks', opportunity: 'Customer', fit: 86, intent: 42, intentTopics: ['cybersecurity'] },
    { id: 'alphabet', name: 'Alphabet Inc.', url: 'abc.xyz', country: 'USA', industry: 'Computer and Electronic Product Manufacturing', employees: '190K', revenue: '$402.8B', itSpend: '$53.2B', competitor: 'None', opportunity: 'Expansion Whitespace', fit: 85, intent: 71, intentTopics: ['Zero Trust', 'cloud cybersecurity'] },
    { id: 'microsoft', name: 'Microsoft Corporation', url: 'microsoft.com', country: 'USA', industry: 'Computer and Electronic Product Manufacturing', employees: '228K', revenue: '$281.7B', itSpend: '$26.3B', competitor: 'Palo Alto Networks', opportunity: 'Customer', fit: 84, intent: 38, intentTopics: ['cybersecurity'] },
    { id: 'meta', name: 'Meta Platforms, Inc.', url: 'meta.com', country: 'USA', industry: 'Computer and Electronic Product Manufacturing', employees: '79K', revenue: '$201.0B', itSpend: '$21.7B', competitor: 'Palo Alto Networks', opportunity: 'Prospect Whitespace', fit: 83, intent: 64, intentTopics: ['endpoint cybersecurity', 'Zero Trust'] },
    { id: 'nvidia', name: 'Nvidia Corporation', url: 'nvidia.com', country: 'USA', industry: 'Computer and Electronic Product Manufacturing', employees: '36K', revenue: '$130.5B', itSpend: '$11.9B', competitor: 'Palo Alto Networks', opportunity: 'Customer', fit: 82, intent: 55, intentTopics: ['cybersecurity solutions'] },
    { id: 'dell', name: 'Dell Technologies Inc.', url: 'dell.com', country: 'USA', industry: 'Computer and Electronic Product Manufacturing', employees: '108K', revenue: '$95.6B', itSpend: '$7.1B', competitor: 'Palo Alto Networks', opportunity: 'Customer', fit: 78, intent: 32, intentTopics: ['cybersecurity'] },
    { id: 'ibm', name: 'IBM Corporation', url: 'ibm.com', country: 'USA', industry: 'Computer and Electronic Product Manufacturing', employees: '264K', revenue: '$67.5B', itSpend: '$5.6B', competitor: 'Palo Alto Networks', opportunity: 'Customer', fit: 77, intent: 41, intentTopics: ['Zero Trust'] },
    { id: 'broadcom', name: 'Broadcom Inc.', url: 'broadcom.com', country: 'USA', industry: 'Computer and Electronic Product Manufacturing', employees: '33K', revenue: '$63.9B', itSpend: '$7.3B', competitor: 'Palo Alto Networks', opportunity: 'Expansion Whitespace', fit: 75, intent: 48, intentTopics: ['cybersecurity solutions'] },
    { id: 'oracle', name: 'Oracle Corporation', url: 'oracle.com', country: 'USA', industry: 'Computer and Electronic Product Manufacturing', employees: '162K', revenue: '$57.4B', itSpend: '$5.4B', competitor: 'Palo Alto Networks', opportunity: 'Customer', fit: 72, intent: 36, intentTopics: ['cybersecurity'] },
    { id: 'cisco', name: 'Cisco Systems, Inc.', url: 'cisco.com', country: 'USA', industry: 'Computer and Electronic Product Manufacturing', employees: '86K', revenue: '$56.7B', itSpend: '$5.6B', competitor: 'None', opportunity: 'Customer', fit: 70, intent: 28, intentTopics: [] },
    { id: 'hp', name: 'HP Inc.', url: 'hp.com', country: 'USA', industry: 'Computer and Electronic Product Manufacturing', employees: '55K', revenue: '$55.3B', itSpend: '$5.0B', competitor: 'Palo Alto Networks', opportunity: 'Customer', fit: 68, intent: 24, intentTopics: [] },
    { id: 'tdsynnex', name: 'TD Synnex Corporation', url: 'tdsynnex.com', country: 'USA', industry: 'Wholesale Trade', employees: '24K', revenue: '$62.5B', itSpend: '$5.2B', competitor: 'None', opportunity: 'Prospect Whitespace', fit: 52, intent: 18, intentTopics: [] },
  ],
};

// Combined-score tier thresholds
export const SCORE_TIERS = {
  A: { min: 80, label: 'A', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  B: { min: 65, label: 'B', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  C: { min: 50, label: 'C', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  D: { min: 0, label: 'D', color: 'text-text-muted', bg: 'bg-text-muted/15', border: 'border-border' },
};

export function getTier(combinedScore) {
  if (combinedScore >= SCORE_TIERS.A.min) return 'A';
  if (combinedScore >= SCORE_TIERS.B.min) return 'B';
  if (combinedScore >= SCORE_TIERS.C.min) return 'C';
  return 'D';
}
