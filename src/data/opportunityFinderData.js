// Opportunity Finder fixture — curated pool of ~25 mock companies tagged with
// signals the Wiz tenant would care about (cloud-heavy, security incumbents,
// active CNAPP / Zero Trust intent). The component ranks top 20 by combined
// ICP fit + intent surge + competitor presence.

export const OPPORTUNITY_POOL = [
  // ===== Tier-A: BFS + cloud-native + competitor incumbent + active intent =====
  { id: 'jpmc', name: 'JPMorgan Chase', url: 'jpmorganchase.com', industry: 'Banking and Financial Services', employees: '309K', revenue: '$162.4B', itSpend: '$16.9B', country: 'USA', cloud: 'Multi-cloud (AWS + Azure)', competitor: 'Palo Alto Prisma Cloud', intentTopics: ['Zero Trust Architecture', 'CNAPP', 'cloud cybersecurity'], intentSurge: 87, fit: 96, hgInstalls: ['Palo Alto Prisma Cloud', 'Snowflake', 'Kubernetes', 'Terraform'], reasons: ['Q3 earnings flagged "cloud security consolidation" as Q4 priority', 'Active CNAPP RFP detected via intent', '14 security-engineer roles open'] },
  { id: 'visa', name: 'Visa', url: 'visa.com', industry: 'Banking and Financial Services', employees: '28K', revenue: '$36.0B', itSpend: '$4.2B', country: 'USA', cloud: 'AWS-primary', competitor: 'Lacework', intentTopics: ['Zero Trust', 'cloud cybersecurity', 'CSPM'], intentSurge: 78, fit: 94, hgInstalls: ['Lacework', 'AWS', 'Kubernetes'], reasons: ['Lacework renewal Q3 — known retention struggles', 'Zero Trust mandate from new CISO (Apr 2026)', 'Cloud spend up 24% YoY'] },
  { id: 'mastercard', name: 'Mastercard', url: 'mastercard.com', industry: 'Banking and Financial Services', employees: '32K', revenue: '$25.1B', itSpend: '$2.9B', country: 'USA', cloud: 'Multi-cloud', competitor: 'None detected', intentTopics: ['endpoint cybersecurity', 'Zero Trust', 'CNAPP'], intentSurge: 81, fit: 92, hgInstalls: ['AWS', 'Azure', 'Snowflake'], reasons: ['No CNAPP incumbent — clean entry', 'Multi-cloud footprint matches Wiz strength', 'Posted "Cloud Security Architect" role last week'] },
  { id: 'goldman', name: 'Goldman Sachs', url: 'gs.com', industry: 'Banking and Financial Services', employees: '49K', revenue: '$47.4B', itSpend: '$5.8B', country: 'USA', cloud: 'AWS + private cloud', competitor: 'Aqua Security', intentTopics: ['Zero Trust Architecture', 'kubernetes security'], intentSurge: 74, fit: 91, hgInstalls: ['Aqua Security', 'AWS', 'Kubernetes'], reasons: ['Aqua install ageing (>5yr) — displacement candidate', 'AWS spend doubled in 2025', 'CISO publicly quoted on Zero Trust maturity'] },

  // ===== Tier-A: Tech / SaaS — high cloud-native, clean entry points =====
  { id: 'snowflake', name: 'Snowflake', url: 'snowflake.com', industry: 'Computer and Electronic Product Manufacturing', employees: '7.6K', revenue: '$3.4B', itSpend: '$580M', country: 'USA', cloud: 'AWS + Azure + GCP', competitor: 'None detected', intentTopics: ['CNAPP', 'DSPM', 'cloud cybersecurity'], intentSurge: 89, fit: 95, hgInstalls: ['AWS', 'Azure', 'GCP', 'Kubernetes'], reasons: ['Their product runs on customer clouds — top-tier security maturity required', 'No CNAPP detected (data not flowing)', 'CISO hire Q1 from Datadog'] },
  { id: 'databricks', name: 'Databricks', url: 'databricks.com', industry: 'Computer and Electronic Product Manufacturing', employees: '7K', revenue: '$2.4B', itSpend: '$390M', country: 'USA', cloud: 'AWS + Azure + GCP', competitor: 'Orca Security', intentTopics: ['CNAPP', 'DSPM', 'cloud cybersecurity', 'kubernetes security'], intentSurge: 92, fit: 95, hgInstalls: ['Orca Security', 'AWS', 'Azure'], reasons: ['Orca contract expiring Sept 2026', 'Pre-IPO security posture push', '38 cloud security topics surging in 14 days'] },
  { id: 'cloudflare', name: 'Cloudflare', url: 'cloudflare.com', industry: 'Computer and Electronic Product Manufacturing', employees: '3.8K', revenue: '$1.4B', itSpend: '$210M', country: 'USA', cloud: 'AWS-primary', competitor: 'None detected', intentTopics: ['Zero Trust', 'Zero Trust Architecture'], intentSurge: 65, fit: 88, hgInstalls: ['AWS'], reasons: ['Public Zero Trust evangelist — natural fit conversation', 'No CNAPP detected'] },
  { id: 'datadog', name: 'Datadog', url: 'datadoghq.com', industry: 'Computer and Electronic Product Manufacturing', employees: '5K', revenue: '$2.6B', itSpend: '$340M', country: 'USA', cloud: 'AWS + GCP', competitor: 'Wiz (potential coopetition)', intentTopics: ['cloud cybersecurity', 'CSPM'], intentSurge: 58, fit: 81, hgInstalls: ['AWS', 'GCP', 'Kubernetes'], reasons: ['Tangential competitor for observability — pure security carve-out possible'] },
  { id: 'nvidia', name: 'Nvidia', url: 'nvidia.com', industry: 'Computer and Electronic Product Manufacturing', employees: '36K', revenue: '$130.5B', itSpend: '$11.9B', country: 'USA', cloud: 'Multi-cloud + on-prem', competitor: 'Palo Alto Prisma Cloud', intentTopics: ['CNAPP', 'cloud cybersecurity', 'kubernetes security'], intentSurge: 84, fit: 90, hgInstalls: ['Palo Alto Prisma Cloud', 'Kubernetes'], reasons: ['Rapid scale-up of AI workloads = new attack surface', 'Prisma struggles with GPU-cloud architectures'] },
  { id: 'shopify', name: 'Shopify', url: 'shopify.com', industry: 'Retail Trade', employees: '8.3K', revenue: '$7.1B', itSpend: '$890M', country: 'Canada', cloud: 'GCP-primary', competitor: 'None detected', intentTopics: ['CNAPP', 'Zero Trust'], intentSurge: 71, fit: 87, hgInstalls: ['GCP', 'Kubernetes'], reasons: ['Single-cloud GCP shop — Wiz strong on GCP coverage', 'PCI compliance pressure'] },

  // ===== Tier-B: Mid-tier ICP match =====
  { id: 'pinterest', name: 'Pinterest', url: 'pinterest.com', industry: 'Media and Entertainment', employees: '4.4K', revenue: '$3.1B', itSpend: '$280M', country: 'USA', cloud: 'AWS-primary', competitor: 'None detected', intentTopics: ['cloud cybersecurity'], intentSurge: 52, fit: 82, hgInstalls: ['AWS', 'Kubernetes'], reasons: ['Mid-tier ICP — AWS-only simplifies sale'] },
  { id: 'spotify', name: 'Spotify', url: 'spotify.com', industry: 'Media and Entertainment', employees: '7.2K', revenue: '$13.2B', itSpend: '$1.4B', country: 'USA', cloud: 'GCP-primary', competitor: 'Sysdig Secure', intentTopics: ['CNAPP', 'kubernetes security'], intentSurge: 68, fit: 85, hgInstalls: ['GCP', 'Kubernetes', 'Sysdig Secure'], reasons: ['Sysdig competitive overlap', 'Heavy K8s footprint matches Wiz strength'] },
  { id: 'wayfair', name: 'Wayfair', url: 'wayfair.com', industry: 'Retail Trade', employees: '14K', revenue: '$11.9B', itSpend: '$1.1B', country: 'USA', cloud: 'AWS + GCP', competitor: 'Lacework', intentTopics: ['cloud cybersecurity', 'CSPM'], intentSurge: 64, fit: 84, hgInstalls: ['Lacework', 'AWS'], reasons: ['Lacework displacement opportunity'] },
  { id: 'expedia', name: 'Expedia Group', url: 'expedia.com', industry: 'Travel and Tourism', employees: '17K', revenue: '$13.1B', itSpend: '$1.2B', country: 'USA', cloud: 'Multi-cloud', competitor: 'Palo Alto Prisma Cloud', intentTopics: ['cloud cybersecurity', 'Zero Trust'], intentSurge: 61, fit: 80, hgInstalls: ['Palo Alto Prisma Cloud', 'AWS', 'Azure'], reasons: ['Prisma incumbent — displacement requires senior AE'] },
  { id: 'hcsc', name: 'Health Care Service Corp', url: 'hcsc.com', industry: 'Health Care and Social Assistance', employees: '24K', revenue: '$58B', itSpend: '$2.8B', country: 'USA', cloud: 'Azure-primary', competitor: 'None detected', intentTopics: ['cybersecurity regulation', 'Zero Trust'], intentSurge: 55, fit: 83, hgInstalls: ['Azure', 'Kubernetes'], reasons: ['HIPAA-driven security spend', 'No CNAPP detected'] },
  { id: 'cvs', name: 'CVS Health', url: 'cvs.com', industry: 'Health Care and Social Assistance', employees: '300K', revenue: '$362.9B', itSpend: '$3.4B', country: 'USA', cloud: 'AWS + Azure', competitor: 'Palo Alto Prisma Cloud', intentTopics: ['cybersecurity regulation', 'cloud cybersecurity'], intentSurge: 67, fit: 82, hgInstalls: ['Palo Alto Prisma Cloud', 'AWS'], reasons: ['Massive scale displacement opportunity', 'Pharmacy cloud migration in progress'] },
  { id: 'humana', name: 'Humana', url: 'humana.com', industry: 'Health Care and Social Assistance', employees: '67K', revenue: '$106.4B', itSpend: '$1.9B', country: 'USA', cloud: 'Azure-primary', competitor: 'None detected', intentTopics: ['Zero Trust', 'cybersecurity regulation'], intentSurge: 58, fit: 81, hgInstalls: ['Azure'], reasons: ['Clean entry — no CNAPP detected'] },
  { id: 'uber', name: 'Uber', url: 'uber.com', industry: 'Travel and Tourism', employees: '32K', revenue: '$43.9B', itSpend: '$2.1B', country: 'USA', cloud: 'AWS + GCP', competitor: 'Orca Security', intentTopics: ['CNAPP', 'cloud cybersecurity', 'DSPM'], intentSurge: 73, fit: 87, hgInstalls: ['Orca Security', 'AWS', 'GCP', 'Kubernetes'], reasons: ['Orca contract attrition signals', 'Post-IPO security maturity push'] },
  { id: 'doordash', name: 'DoorDash', url: 'doordash.com', industry: 'Retail Trade', employees: '8.6K', revenue: '$10.7B', itSpend: '$680M', country: 'USA', cloud: 'AWS', competitor: 'None detected', intentTopics: ['cloud cybersecurity', 'CSPM'], intentSurge: 70, fit: 86, hgInstalls: ['AWS', 'Kubernetes'], reasons: ['Pure AWS shop — Wiz native strength', 'PCI burden growing'] },
  { id: 'workday', name: 'Workday', url: 'workday.com', industry: 'Computer and Electronic Product Manufacturing', employees: '20K', revenue: '$8.4B', itSpend: '$1.1B', country: 'USA', cloud: 'AWS', competitor: 'CrowdStrike Falcon Cloud Security', intentTopics: ['Zero Trust', 'cloud cybersecurity', 'DSPM'], intentSurge: 76, fit: 89, hgInstalls: ['AWS', 'Kubernetes', 'CrowdStrike Falcon Cloud Security'], reasons: ['CrowdStrike CDR is rising threat — Wiz still wins on CNAPP depth', 'Massive customer-data trust mandate'] },

  // ===== Tier-B + outliers =====
  { id: 'salesforce', name: 'Salesforce', url: 'salesforce.com', industry: 'Computer and Electronic Product Manufacturing', employees: '79K', revenue: '$34.8B', itSpend: '$2.4B', country: 'USA', cloud: 'AWS + private cloud', competitor: 'Palo Alto Prisma Cloud', intentTopics: ['cloud cybersecurity'], intentSurge: 54, fit: 77, hgInstalls: ['Palo Alto Prisma Cloud', 'AWS'], reasons: ['Prisma deep incumbent — long-cycle'] },
  { id: 'square', name: 'Block (Square)', url: 'block.xyz', industry: 'Banking and Financial Services', employees: '12K', revenue: '$21.9B', itSpend: '$1.3B', country: 'USA', cloud: 'AWS', competitor: 'None detected', intentTopics: ['Zero Trust', 'cloud cybersecurity', 'CNAPP'], intentSurge: 81, fit: 90, hgInstalls: ['AWS', 'Kubernetes'], reasons: ['No CNAPP', 'Fintech + AWS = exact ICP', 'Crypto exposure → high security stakes'] },
  { id: 'stripe', name: 'Stripe', url: 'stripe.com', industry: 'Banking and Financial Services', employees: '7K', revenue: '$1.6B', itSpend: '$220M', country: 'USA', cloud: 'AWS-primary', competitor: 'None detected', intentTopics: ['cloud cybersecurity', 'CNAPP', 'Zero Trust Architecture'], intentSurge: 79, fit: 88, hgInstalls: ['AWS', 'Kubernetes'], reasons: ['Pure AWS, pure security-conscious, pure fintech', 'No CNAPP detected'] },
  { id: 'roblox', name: 'Roblox', url: 'roblox.com', industry: 'Media and Entertainment', employees: '2.4K', revenue: '$3.5B', itSpend: '$310M', country: 'USA', cloud: 'AWS', competitor: 'None detected', intentTopics: ['cloud cybersecurity', 'kubernetes security'], intentSurge: 59, fit: 78, hgInstalls: ['AWS', 'Kubernetes'], reasons: ['Gaming security pressure + AWS-native'] },
];

// Rank a pool against a tenant's ICP weights. For demo, just use the
// pre-computed fit + intent scores (fit and intent are pre-tagged).
export function rankOpportunities(pool, tenant) {
  // Apply tenant.icp.industries weight as a multiplier on fit
  return pool
    .map((c) => {
      const industryMatch = tenant?.icp?.industries.find((i) => i.name === c.industry);
      const industryBoost = industryMatch ? industryMatch.weight : 0;
      const baseFit = c.fit;
      // Combined score: weighted by fit + intent + industry boost
      const combined = Math.round(baseFit * 0.5 + c.intentSurge * 0.4 + industryBoost * 100 * 0.1);
      return { ...c, combined };
    })
    .sort((a, b) => b.combined - a.combined);
}

// Tier helper
export function getOppTier(combined) {
  if (combined >= 80) return 'A';
  if (combined >= 65) return 'B';
  if (combined >= 50) return 'C';
  return 'D';
}
