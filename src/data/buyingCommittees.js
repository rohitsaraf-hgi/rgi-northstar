// Buying committees per offering — different offerings require different
// stakeholders to close a deal. This is the "secret sauce" that elevates the
// offering lens from a filter to a strategy: it tells sellers WHO they need to
// meet, not just what to send.

// Each committee defines the required + recommended roles. The Stakeholders
// tab cross-references these against account.stakeholders to surface gaps.

export const BUYING_COMMITTEES = {
  cnapp: {
    offering_id: 'cnapp',
    name: 'CNAPP buying committee',
    roles: [
      {
        id: 'cnapp-decision-maker',
        title: 'CISO',
        priority: 'required',
        function: 'Decision maker',
        matchTitles: ['ciso', 'chief information security'],
        notes: 'Final approver — owns budget and posture mandate.',
      },
      {
        id: 'cnapp-champion',
        title: 'VP Cloud Security / Head of CSPM',
        priority: 'required',
        function: 'Champion',
        matchTitles: ['vp cloud security', 'head of cloud security', 'cspm lead', 'cloud security architect'],
        notes: 'Internal champion — owns the technical evaluation and runs the pilot.',
      },
      {
        id: 'cnapp-tech-user',
        title: 'Head of DevSecOps',
        priority: 'recommended',
        function: 'Power user',
        matchTitles: ['devsecops', 'devops security', 'platform security'],
        notes: 'Day-to-day operator — needs to like the product or deployment stalls.',
      },
      {
        id: 'cnapp-sre',
        title: 'SRE Lead',
        priority: 'optional',
        function: 'Influencer',
        matchTitles: ['sre lead', 'site reliability', 'platform reliability'],
        notes: 'Sometimes contributes to runtime / Kubernetes evaluation.',
      },
      {
        id: 'cnapp-eb',
        title: 'CFO',
        priority: 'required_above_200k',
        function: 'Economic buyer',
        matchTitles: ['cfo', 'chief financial', 'vp finance'],
        notes: 'Required for deals above $200k ARR. Cost-saving narrative matters.',
      },
    ],
  },
  ciem: {
    offering_id: 'ciem',
    name: 'CIEM buying committee',
    roles: [
      {
        id: 'ciem-decision-maker',
        title: 'CISO',
        priority: 'required',
        function: 'Decision maker',
        matchTitles: ['ciso', 'chief information security'],
        notes: 'Final approver. Often delegates technical eval to identity team.',
      },
      {
        id: 'ciem-champion',
        title: 'IAM Architect / Head of Identity',
        priority: 'required',
        function: 'Champion',
        matchTitles: ['iam architect', 'head of identity', 'identity governance', 'iga'],
        notes: 'Owns the identity audit, runs the entitlement review pilot.',
      },
      {
        id: 'ciem-compliance',
        title: 'Head of Audit / Compliance',
        priority: 'recommended',
        function: 'Buyer',
        matchTitles: ['compliance', 'audit', 'risk officer', 'cco'],
        notes: 'Strong buyer in regulated industries — compliance findings drive urgency.',
      },
      {
        id: 'ciem-tech-user',
        title: 'Cloud Engineering Lead',
        priority: 'recommended',
        function: 'Power user',
        matchTitles: ['cloud engineering', 'cloud platform', 'devops lead'],
        notes: 'Implements right-sizing recommendations.',
      },
      {
        id: 'ciem-eb',
        title: 'CFO',
        priority: 'required_above_200k',
        function: 'Economic buyer',
        matchTitles: ['cfo', 'chief financial'],
        notes: 'Cost-of-audit-failure narrative.',
      },
    ],
  },
  dspm: {
    offering_id: 'dspm',
    name: 'DSPM buying committee',
    roles: [
      {
        id: 'dspm-decision-maker-1',
        title: 'CISO',
        priority: 'required',
        function: 'Decision maker',
        matchTitles: ['ciso', 'chief information security'],
        notes: 'Final approver alongside Chief Privacy Officer in regulated industries.',
      },
      {
        id: 'dspm-decision-maker-2',
        title: 'Chief Privacy Officer',
        priority: 'required',
        function: 'Decision maker',
        matchTitles: ['chief privacy', 'cpo', 'privacy officer', 'dpo'],
        notes: 'Co-decision maker. Drives compliance + DSAR narrative.',
      },
      {
        id: 'dspm-champion',
        title: 'Head of Data Platform',
        priority: 'required',
        function: 'Champion',
        matchTitles: ['head of data', 'vp data', 'data platform', 'chief data'],
        notes: 'Owns the data-platform evaluation. Champion = success.',
      },
      {
        id: 'dspm-tech-user',
        title: 'Data Engineering Lead',
        priority: 'recommended',
        function: 'Power user',
        matchTitles: ['data engineering', 'data engineer lead', 'analytics engineering'],
        notes: 'Implements classification + lineage. Daily operator.',
      },
      {
        id: 'dspm-compliance',
        title: 'Compliance / Risk Lead',
        priority: 'recommended',
        function: 'Buyer',
        matchTitles: ['compliance', 'audit', 'risk officer'],
        notes: 'Especially strong in fintech / healthcare.',
      },
    ],
  },
  workload: {
    offering_id: 'workload',
    name: 'Workload Protection buying committee',
    roles: [
      {
        id: 'workload-decision-maker',
        title: 'CISO',
        priority: 'required',
        function: 'Decision maker',
        matchTitles: ['ciso', 'chief information security'],
        notes: 'Final approver — often delegates technical to DevSecOps.',
      },
      {
        id: 'workload-champion',
        title: 'Head of DevSecOps / Platform Security',
        priority: 'required',
        function: 'Champion',
        matchTitles: ['devsecops', 'platform security', 'devops security'],
        notes: 'Daily owner — runtime protection lands in their domain.',
      },
      {
        id: 'workload-sre',
        title: 'SRE Lead / Platform Engineering',
        priority: 'required',
        function: 'Power user',
        matchTitles: ['sre lead', 'site reliability', 'platform engineering'],
        notes: 'Operates the Kubernetes / runtime environment.',
      },
      {
        id: 'workload-app-sec',
        title: 'AppSec Lead',
        priority: 'recommended',
        function: 'Influencer',
        matchTitles: ['appsec', 'application security', 'product security'],
        notes: 'Co-owns vulnerability remediation prioritization.',
      },
    ],
  },
};

// Curated per-account stakeholder rolls for the Stakeholders tab. In production
// these come from CRM + LinkedIn enrichment; here we hand-curate the demo so the
// gap analysis is provable.
//
// Each entry: { name, title, email, linkedinUrl, isChampion?, identifiedVia? }
export const ACCOUNT_STAKEHOLDERS = {
  'acct-jpmc': [
    { id: 'sk-jpmc-1', name: 'Sarah Chen', title: 'CISO', email: 'sarah.chen@jpmorganchase.com', source: 'CRM + LinkedIn', isChampion: true, joined: 'Apr 14, 2026' },
    { id: 'sk-jpmc-2', name: 'Diana Park', title: 'VP Cloud Security', email: 'diana.park@jpmorganchase.com', source: 'CRM' },
    { id: 'sk-jpmc-3', name: 'Marcus Wei', title: 'IAM Architect', email: 'marcus.wei@jpmorganchase.com', source: 'LinkedIn' },
    { id: 'sk-jpmc-4', name: 'Patricia Singh', title: 'CFO', email: 'patricia.singh@jpmorganchase.com', source: 'CRM' },
  ],
  'acct-snowflake': [
    { id: 'sk-snow-1', name: 'Mike Goldman', title: 'CISO (ex-Datadog)', email: 'mike.goldman@snowflake.com', source: 'LinkedIn', isChampion: true, joined: 'Mar 28, 2026' },
  ],
  'acct-acme': [
    { id: 'sk-acme-1', name: 'Sarah Chen', title: 'VP Engineering', email: 'sarah.chen@acme.com', source: 'CRM', isChampion: true },
    { id: 'sk-acme-2', name: 'David Wong', title: 'Head of Platform Security', email: 'david.wong@acme.com', source: 'LinkedIn' },
    { id: 'sk-acme-3', name: 'Diana Park', title: 'CFO', email: 'diana.park@acme.com', source: 'CRM' },
    { id: 'sk-acme-4', name: 'Marcus Reeve', title: 'CISO', email: 'marcus.reeve@acme.com', source: 'CRM' },
  ],
  'acct-databricks': [],
  'acct-visa': [
    { id: 'sk-visa-1', name: 'Priya Ananth', title: 'CISO', email: 'priya.ananth@visa.com', source: 'CRM' },
    { id: 'sk-visa-2', name: 'James Liu', title: 'Head of Data Platform', email: 'james.liu@visa.com', source: 'CRM' },
    { id: 'sk-visa-3', name: 'Carla Mendez', title: 'Compliance Officer', email: 'carla.mendez@visa.com', source: 'LinkedIn' },
  ],
};

export function getBuyingCommittee(offeringId) {
  return BUYING_COMMITTEES[offeringId] || null;
}

export function getAccountStakeholders(accountId) {
  return ACCOUNT_STAKEHOLDERS[accountId] || [];
}

// Match a stakeholder title against a committee role's matchTitles array.
function titleMatches(stakeholderTitle, matchTitles) {
  if (!stakeholderTitle) return false;
  const t = stakeholderTitle.toLowerCase();
  return matchTitles.some((m) => t.includes(m.toLowerCase()));
}

// For a given account + offering, return:
//   { committee, mapping: [{role, matchedStakeholders[]}], gaps: [role], coverage }
export function analyzeAccountCoverage(accountId, offeringId) {
  const committee = getBuyingCommittee(offeringId);
  const stakeholders = getAccountStakeholders(accountId);
  if (!committee) return null;

  const mapping = committee.roles.map((role) => {
    const matched = stakeholders.filter((s) => titleMatches(s.title, role.matchTitles));
    return { role, matchedStakeholders: matched, filled: matched.length > 0 };
  });

  const requiredFilled = mapping.filter(
    (m) => (m.role.priority === 'required' || m.role.priority === 'required_above_200k') && m.filled,
  ).length;
  const requiredTotal = committee.roles.filter(
    (r) => r.priority === 'required' || r.priority === 'required_above_200k',
  ).length;

  const gaps = mapping.filter((m) => !m.filled && m.role.priority !== 'optional').map((m) => m.role);

  return {
    committee,
    mapping,
    gaps,
    coverage: {
      requiredFilled,
      requiredTotal,
      coveragePct: requiredTotal > 0 ? Math.round((requiredFilled / requiredTotal) * 100) : 100,
    },
  };
}

export const PRIORITY_TREATMENTS = {
  required: { label: 'Required', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  required_above_200k: { label: 'Required for large deal', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  recommended: { label: 'Recommended', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  optional: { label: 'Optional', color: 'text-text-muted', bg: 'bg-surface-2', border: 'border-border' },
};
