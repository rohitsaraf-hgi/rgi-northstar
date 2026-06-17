// Offerings — tenant product/solution offerings, configured by RevOps.
//
// Each offering is a distinct product or solution the tenant sells. An account
// can score differently for each offering (Wiz CNAPP fit vs Wiz CIEM fit).
// Signals and workflows tag which offerings they're relevant for, so sellers
// can pick an offering lens and see only what matters.

export const OFFERINGS = [
  {
    id: 'cnapp',
    name: 'Wiz CNAPP',
    fullName: 'Cloud-Native Application Protection Platform',
    description: 'Unified posture management, threat detection, and runtime protection across AWS, Azure, GCP, and Kubernetes.',
    color: '#0ea5e9',
    bg: 'bg-sky-500/10',
    textColor: 'text-sky-700 dark:text-sky-300',
    borderColor: 'border-sky-500/30',
    painPoints: [
      'Multi-cloud security posture fragmentation',
      'Alert fatigue from too many tools',
      'Slow time to remediate misconfigurations',
      'Compliance evidence collection',
    ],
    intentTopics: [
      'CNAPP',
      'cloud security posture management',
      'CSPM',
      'cloud native application protection',
      'cloud security RFP',
      'AWS security audit',
    ],
    complementaryTech: ['AWS', 'Azure', 'Google Cloud', 'Kubernetes', 'Terraform', 'GitHub Actions'],
    competitors: ['Palo Alto Prisma Cloud', 'Lacework', 'Orca Security', 'Aqua Security', 'CrowdStrike Falcon Cloud'],
    targetICP: {
      employees: '1000+',
      industries: ['Technology', 'Financial Services', 'Healthcare', 'Retail'],
      cloudPosture: 'Multi-cloud with >$1M annual cloud spend',
    },
    activeAccounts: 47,
    avgDealSize: '$320k',
    salesMotion: 'Outbound + RFP-driven',
  },
  {
    id: 'ciem',
    name: 'Wiz CIEM',
    fullName: 'Cloud Infrastructure Entitlement Management',
    description: 'Audit and right-size cloud identities to eliminate over-permissioned access and IAM sprawl.',
    color: '#8b5cf6',
    bg: 'bg-violet-500/10',
    textColor: 'text-violet-700 dark:text-violet-300',
    borderColor: 'border-violet-500/30',
    painPoints: [
      'Over-permissioned cloud identities',
      'IAM policy sprawl across accounts',
      'Failed audit findings on entitlements',
      'Privileged access governance',
    ],
    intentTopics: [
      'CIEM',
      'cloud identity governance',
      'IAM audit',
      'over-permissioned access',
      'identity sprawl',
      'least privilege',
    ],
    complementaryTech: ['Okta', 'Azure AD', 'AWS IAM', 'Google Cloud IAM', 'Auth0', 'OneLogin'],
    competitors: ['SailPoint', 'Saviynt', 'Sonrai', 'Ermetic', 'Authomize'],
    targetICP: {
      employees: '500+',
      industries: ['Financial Services', 'Healthcare', 'Government', 'Technology'],
      cloudPosture: 'AWS/Azure-heavy with >100 cloud identities',
    },
    activeAccounts: 23,
    avgDealSize: '$180k',
    salesMotion: 'Cross-sell into CNAPP customers',
  },
  {
    id: 'dspm',
    name: 'Wiz DSPM',
    fullName: 'Data Security Posture Management',
    description: 'Discover, classify, and protect sensitive data across cloud storage, warehouses, and SaaS.',
    color: '#10b981',
    bg: 'bg-emerald-500/10',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-500/30',
    painPoints: [
      'Shadow data — unknown sensitive data exposure',
      'Compliance posture across data stores',
      'Data classification at scale',
      'Cross-cloud data lineage',
    ],
    intentTopics: [
      'DSPM',
      'data security posture',
      'data classification',
      'shadow data',
      'cloud data discovery',
      'data lineage',
    ],
    complementaryTech: ['Snowflake', 'Databricks', 'BigQuery', 'Amazon S3', 'Azure Blob', 'Salesforce'],
    competitors: ['Cyera', 'Concentric AI', 'Laminar', 'Sentra', 'Dig Security'],
    targetICP: {
      employees: '1000+',
      industries: ['Financial Services', 'Healthcare', 'Retail', 'Technology'],
      cloudPosture: 'Data lake / warehouse heavy (Snowflake or Databricks present)',
    },
    activeAccounts: 14,
    avgDealSize: '$240k',
    salesMotion: 'Net-new + cross-sell — RFP-driven',
  },
  {
    id: 'workload',
    name: 'Wiz Workload Protection',
    fullName: 'Cloud Workload Protection Platform (CWPP)',
    description: 'Runtime protection for containers, VMs, and serverless workloads with vulnerability and threat detection.',
    color: '#f59e0b',
    bg: 'bg-amber-500/10',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-500/30',
    painPoints: [
      'Container/runtime threats',
      'Vulnerability prioritization in production',
      'Kubernetes security posture',
      'Workload drift from baseline',
    ],
    intentTopics: [
      'CWPP',
      'container security',
      'kubernetes security',
      'runtime protection',
      'workload security',
      'CVE prioritization',
    ],
    complementaryTech: ['EKS', 'GKE', 'AKS', 'Containerd', 'Docker', 'ArgoCD'],
    competitors: ['Sysdig', 'Aqua Security', 'Snyk', 'Anchore', 'StackRox'],
    targetICP: {
      employees: '500+',
      industries: ['Technology', 'Financial Services', 'E-commerce'],
      cloudPosture: 'Kubernetes-heavy with >50 production clusters',
    },
    activeAccounts: 18,
    avgDealSize: '$210k',
    salesMotion: 'DevSecOps champion-led',
  },
];

export const OFFERING_BY_ID = Object.fromEntries(OFFERINGS.map((o) => [o.id, o]));

export function listOfferings() {
  return OFFERINGS;
}

export function getOffering(id) {
  return OFFERING_BY_ID[id] || null;
}

// "All" pseudo-offering used by filter UIs
export const ALL_OFFERINGS_LENS = {
  id: 'all',
  name: 'All offerings',
  textColor: 'text-text-primary',
  bg: 'bg-primary/15',
  borderColor: 'border-primary/40',
};
