// Tenant fixtures — pre-seeded for instant PLG demo replay.
// In production these come from the live derivation pipeline. For demo we
// freeze them so anyone running the signup flow ends in the same place.

// ===== Wiz — the canonical PLG demo tenant =====
export const WIZ_TENANT = {
  id: 'wiz',
  url: 'wiz.io',
  name: 'Wiz',
  logoLetter: 'W',
  logoColor: '#0ea5e9',
  derivedAt: 'May 12, 2026 · 10:42 AM',

  products: [
    {
      id: 'wiz-cnapp',
      name: 'Wiz Cloud Security Platform',
      category: 'CNAPP',
      productLine: 'Core',
      description: 'Cloud-native application protection across multi-cloud — CSPM + CWPP + CIEM + DSPM in one platform.',
    },
    {
      id: 'wiz-code',
      name: 'Wiz Code',
      category: 'Code Security',
      productLine: 'Code-to-Cloud',
      description: 'IDE-to-cloud security: scans IaC, containers, and dependencies before deploy.',
    },
    {
      id: 'wiz-defend',
      name: 'Wiz Defend',
      category: 'CDR',
      productLine: 'Runtime',
      description: 'Cloud Detection & Response — runtime threat detection across cloud workloads.',
    },
  ],

  painPoints: [
    {
      statement: 'Cloud sprawl creates blind spots across multi-cloud deployments',
      audience: 'CISO / VP Security',
      signal: 'Multi-cloud migration + security debt mentions',
    },
    {
      statement: 'Tool fragmentation forces context-switching between CSPM, CWPP, KSPM, CIEM',
      audience: 'Security Architect',
      signal: 'Consolidation initiative · tool sprawl on earnings calls',
    },
    {
      statement: 'Dev velocity blocked by manual security reviews',
      audience: 'VP Engineering / DevSecOps lead',
      signal: 'Shift-left maturity · SDLC investment',
    },
    {
      statement: 'Compliance evidence is manual and audit-cycle painful',
      audience: 'Compliance / GRC',
      signal: 'SOC2, FedRAMP, ISO27001 hiring',
    },
  ],

  spendCategories: [
    { hgId: '1CD0024569FAA786304FE2B594AC0585', name: 'Security (Software)', tree: ['Software', 'Software Infrastructure', 'Security'], relevance: 'primary' },
    { hgId: 'svc_cloud', name: 'Cloud Services', tree: ['Services', 'Cloud Services'], relevance: 'primary' },
    { hgId: 'sw_infra', name: 'Software Infrastructure', tree: ['Software', 'Software Infrastructure'], relevance: 'adjacent' },
    { hgId: 'sw_appdev', name: 'Application Development & Deployment', tree: ['Software', 'Application Development and Deployment'], relevance: 'adjacent' },
    { hgId: 'hw_security', name: 'Security (Hardware)', tree: ['Hardware', 'Security'], relevance: 'tangential' },
  ],

  intentTopics: [
    { hgId: '2602297A54D93A062DE40470F5FFE6BD', name: 'cloud cybersecurity', category: 'security', relevance: 'primary' },
    { hgId: '3FE0AB5F0A4ECD2858B022178EB9DE67', name: 'Zero Trust', category: 'security', relevance: 'primary' },
    { hgId: 'C66928848C2664D99CBCABFE12D4871', name: 'Zero Trust Architecture', category: 'security', relevance: 'primary' },
    { hgId: 'cnapp', name: 'CNAPP', category: 'security', relevance: 'primary' },
    { hgId: 'cspm', name: 'cloud security posture management', category: 'security', relevance: 'primary' },
    { hgId: 'kspm', name: 'kubernetes security', category: 'security', relevance: 'primary' },
    { hgId: '1C237C85BCF987972A7EAF20CF39D9F8', name: 'endpoint cybersecurity', category: 'security', relevance: 'adjacent' },
    { hgId: '2542E6789B273C51BE81F0000A669969', name: 'zero trust network access (ZTNA)', category: 'networking', relevance: 'adjacent' },
    { hgId: 'devsecops', name: 'DevSecOps', category: 'security', relevance: 'adjacent' },
    { hgId: 'iac-security', name: 'infrastructure as code security', category: 'security', relevance: 'adjacent' },
  ],

  competitors: [
    { id: 'palo-alto-prisma', name: 'Palo Alto Prisma Cloud', vendor: 'Palo Alto Networks', productHgId: 17111, penetration: 'high', threat: 'incumbent' },
    { id: 'crowdstrike-falcon-cloud', name: 'CrowdStrike Falcon Cloud Security', vendor: 'CrowdStrike', penetration: 'rising', threat: 'rising' },
    { id: 'lacework', name: 'Lacework Polygraph', vendor: 'Lacework', penetration: 'medium', threat: 'declining' },
    { id: 'orca', name: 'Orca Security', vendor: 'Orca Security', penetration: 'medium', threat: 'direct' },
    { id: 'aqua', name: 'Aqua Security', vendor: 'Aqua', penetration: 'medium', threat: 'adjacent' },
    { id: 'sysdig', name: 'Sysdig Secure', vendor: 'Sysdig', penetration: 'medium', threat: 'adjacent' },
  ],

  partners: [
    { name: 'AWS Marketplace', type: 'distribution', signal: 'co-sell · AWS Security Competency' },
    { name: 'Microsoft Azure Marketplace', type: 'distribution', signal: 'co-sell' },
    { name: 'Google Cloud Marketplace', type: 'distribution', signal: 'co-sell' },
    { name: 'Snyk', type: 'integration', signal: 'IDE + code scanning co-marketing' },
    { name: 'Crowdstrike (limited)', type: 'integration', signal: 'select endpoint integrations' },
    { name: 'ServiceNow', type: 'integration', signal: 'ITSM ticketing co-resell' },
  ],

  icp: {
    industries: [
      { hgId: '2', name: 'Banking and Financial Services', weight: 0.22 },
      { hgId: '3', name: 'Computer and Electronic Product Manufacturing', weight: 0.18 },
      { hgId: '6', name: 'Health Care and Social Assistance', weight: 0.12 },
      { hgId: 'A', name: 'Media and Entertainment', weight: 0.10 },
      { hgId: 'F', name: 'Public Administration', weight: 0.10 },
      { hgId: '10', name: 'Retail Trade', weight: 0.08 },
    ],
    geos: [
      { id: 'usa', name: 'United States', weight: 0.55 },
      { id: 'uk', name: 'United Kingdom', weight: 0.08 },
      { id: 'germany', name: 'Germany', weight: 0.06 },
      { id: 'canada', name: 'Canada', weight: 0.05 },
      { id: 'australia', name: 'Australia', weight: 0.04 },
      { id: 'singapore', name: 'Singapore', weight: 0.03 },
    ],
    revenueBand: { low: '$1B', high: '$10B+' },
    employeeBand: { low: '1,000', high: '10K+' },
    techStack: [
      { id: 'aws', name: 'AWS', signal: 'cloud-native' },
      { id: 'gcp', name: 'Google Cloud', signal: 'cloud-native' },
      { id: 'azure', name: 'Microsoft Azure', signal: 'cloud-native' },
      { id: 'kubernetes', name: 'Kubernetes', signal: 'container security buyer' },
      { id: 'terraform', name: 'Terraform', signal: 'IaC maturity' },
      { id: 'snowflake', name: 'Snowflake', signal: 'data residency buyer' },
    ],
  },

  buyingCommittee: [
    { role: 'CISO', department: 'Security', influence: 'final-approver', signals: ['compliance budget owner', 'breach risk owner', 'board-facing'] },
    { role: 'VP Security Engineering', department: 'Security', influence: 'champion-target', signals: ['evaluates products', 'leads RFP', 'POC owner'] },
    { role: 'Cloud Security Architect', department: 'Security', influence: 'evaluator', signals: ['technical deep-dive', 'integration design'] },
    { role: 'CTO', department: 'Engineering', influence: 'executive-sponsor', signals: ['multi-cloud strategy', 'platform decisions'] },
    { role: 'VP Engineering', department: 'Engineering', influence: 'influencer', signals: ['dev velocity', 'shift-left advocate'] },
    { role: 'CFO', department: 'Finance', influence: 'final-approver-financial', signals: ['budget approval', 'tool consolidation ROI'] },
    { role: 'Head of GRC', department: 'Compliance', influence: 'influencer', signals: ['audit prep', 'evidence automation'] },
  ],

  fai: {
    headcount: '1,200+',
    revenue: '$500M+ ARR',
    hq: 'New York, NY',
    stage: 'Late-stage Private',
    fundingDate: 'May 2024 · $1B at $12B valuation',
    growthSignal: 'Fastest-growing software company in history',
  },

  // Tenant-level permissions controlled by the RevOps admin. Surfaced in
  // the Tenant Profile editor.
  policies: {
    // When true, sellers see an Upload button on their Workbook and can
    // bring their own book of accounts via CSV (account_name +
    // account_domain). All rows uploaded by a seller are auto-assigned
    // to that seller — owner_email is NOT in the seller schema.
    // Default ON so PLG / mid-market motions just work; enterprise can
    // toggle OFF to enforce admin-curated books.
    allowSellerBookUpload: true,
  },
};

// ===== Empty / new-tenant skeleton (for non-Wiz signups) =====
export const EMPTY_TENANT_SKELETON = {
  id: null,
  url: null,
  name: null,
  logoLetter: '?',
  logoColor: '#94a3b8',
  derivedAt: null,
  products: [],
  painPoints: [],
  spendCategories: [],
  intentTopics: [],
  competitors: [],
  partners: [],
  icp: { industries: [], geos: [], revenueBand: null, employeeBand: null, techStack: [] },
  buyingCommittee: [],
  fai: {},
  policies: { allowSellerBookUpload: true },
};

// HG-as-tenant fixture — what the existing HG personas operate inside.
// Not used in the PLG flow, but useful so /workbench can render for any persona.
export const HG_TENANT = {
  id: 'hg',
  url: 'hginsights.com',
  name: 'HG Insights',
  logoLetter: 'H',
  logoColor: '#3B82F6',
  derivedAt: 'Pre-seeded',
  products: [
    { id: 'market-analyzer', name: 'Market Analyzer', category: 'GTM Intelligence', productLine: 'Core' },
    { id: 'sales-copilot', name: 'Sales Copilot', category: 'Sales Intelligence', productLine: 'Core' },
    { id: 'data-studio', name: 'Data Studio', category: 'Scoring & Models', productLine: 'Core' },
  ],
  painPoints: [
    { statement: 'ICP scoring decays across multiple GTM tools', audience: 'RevOps', signal: 'GTM tooling sprawl' },
    { statement: 'Marketing and Sales operate from different account lists', audience: 'CRO / CMO', signal: 'ICP misalignment' },
  ],
  spendCategories: [
    { hgId: 'sw_enterprise', name: 'Enterprise Applications', tree: ['Software', 'Enterprise Applications'], relevance: 'primary' },
  ],
  intentTopics: [
    { hgId: 'gtm-consolidation', name: 'GTM platform consolidation', category: 'sales', relevance: 'primary' },
  ],
  competitors: [
    { id: 'zoominfo', name: 'ZoomInfo', vendor: 'ZoomInfo', penetration: 'high', threat: 'incumbent' },
    { id: '6sense', name: '6sense', vendor: '6sense', penetration: 'rising', threat: 'rising' },
  ],
  partners: [],
  icp: {
    industries: [
      { hgId: '3', name: 'Computer and Electronic Product Manufacturing', weight: 0.32 },
      { hgId: '2', name: 'Banking and Financial Services', weight: 0.18 },
    ],
    geos: [
      { id: 'usa', name: 'United States', weight: 0.7 },
      { id: 'canada', name: 'Canada', weight: 0.05 },
    ],
    revenueBand: { low: '$50M', high: '$5B' },
    employeeBand: { low: '200', high: '10K' },
    techStack: [
      { id: 'salesforce', name: 'Salesforce', signal: 'CRM modern' },
      { id: 'snowflake', name: 'Snowflake', signal: 'data-driven' },
    ],
  },
  buyingCommittee: [
    { role: 'RevOps Director', department: 'RevOps', influence: 'champion-target', signals: ['data-tool buyer'] },
    { role: 'VP Sales', department: 'Sales', influence: 'final-approver', signals: ['rep enablement'] },
    { role: 'CMO', department: 'Marketing', influence: 'final-approver', signals: ['ABM strategy'] },
  ],
  fai: {
    headcount: '450',
    revenue: '$80M ARR (est.)',
    hq: 'Santa Barbara, CA',
    stage: 'Private',
    fundingDate: '2018 (Riverwood)',
    growthSignal: 'Steady GTM Intelligence growth',
  },
  policies: { allowSellerBookUpload: true },
};

export const TENANT_FIXTURES = {
  wiz: WIZ_TENANT,
  hg: HG_TENANT,
};

// Match an inbound URL to a known tenant fixture. Returns null if no match.
export function matchTenantByUrl(url) {
  const normalized = (url || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  if (normalized.includes('wiz.io') || normalized.includes('wiz.com')) return WIZ_TENANT;
  if (normalized.includes('hginsights')) return HG_TENANT;
  return null;
}
