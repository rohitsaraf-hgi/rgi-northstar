// HG Intelligence — AI-synthesized account intelligence that ties signals,
// firmographics, technographics, and public events into a concrete
// recommendation. Each entry answers three questions for the seller:
//   1. What's happening at this account right now? (narrative)
//   2. Which offering should we lead with, and who is the buyer? (lead)
//   3. What's the natural co-sell or expansion follow-on? (next)
//
// Rendered as a column in the admin workbook. The two anchor entries
// (Databricks + JPMorgan Chase) are written verbatim from the customer's
// strategic intelligence; the rest are synthesized in the same shape so
// the demo feels populated end-to-end.

// Offering code → canonical lookup. Keeps the UI free of magic numbers.
export const OFFERING_CODES = {
  'O-01': { key: 'cnapp', name: 'Cloud Security Platform' },
  'O-02': { key: 'code', name: 'Code Security' },
  'O-03': { key: 'cdr', name: 'AI & Runtime Defense' },
};

// Each entry shape:
//   {
//     narrative: string,
//     lead: { code, name, entryPoint },
//     next:  { type: 'co-sell' | 'expansion', code, name, reasoning },
//   }
export const HG_INTELLIGENCE = {
  // ── ANCHOR ENTRIES (customer-authored) ──────────────────────────────

  'acct-jpmc': {
    narrative:
      'Cloud footprint jumped 50%→75% in one year while agentic AI went live across 40k+ developers — and CISO Patrick Opet already published an open letter in 2025 saying cloud and SaaS integrations are "quietly enabling cyberattackers." The case is already made by their own CISO.',
    lead: {
      code: 'O-01',
      name: 'Cloud Security Platform',
      entryPoint: "CISO's office / VP Cloud Security",
    },
    next: {
      type: 'co-sell',
      code: 'O-03',
      name: 'AI & Runtime Defense',
      reasoning:
        'active agentic AI deployment at scale across payments and back-office',
    },
  },

  'acct-databricks': {
    narrative:
      'Agent Bricks launch puts 100k+ AI agents and managed MCP connections into production with no cloud infrastructure security layer underneath Unity AI Gateway. FedRAMP High and HITRUST pursuits across AWS and Azure make the compliance clock real.',
    lead: {
      code: 'O-03',
      name: 'AI & Runtime Defense',
      entryPoint: 'Head of AI Security / Head of Platform Security',
    },
    next: {
      type: 'expansion',
      code: 'O-01',
      name: 'Cloud Security Platform',
      reasoning: 'as cloud workload footprint grows',
    },
  },

  // ── SYNTHESIZED (same shape, varies by account profile) ─────────────

  'acct-snowflake': {
    narrative:
      "New CISO hire from Datadog (security-mature org) signals posture-refresh window. Multi-cloud AWS + Azure + GCP plus Snowpark for data-science workloads creates a sprawling identity and data-plane surface that today's CSPM doesn't see across regions.",
    lead: {
      code: 'O-01',
      name: 'Cloud Security Platform',
      entryPoint: 'New CISO + VP Platform Security',
    },
    next: {
      type: 'co-sell',
      code: 'O-02',
      name: 'Code Security',
      reasoning:
        'heavy IaC and data-pipeline release velocity — shift-left fits the engineering culture',
    },
  },

  'acct-visa': {
    narrative:
      'AWS-primary footprint with PCI-DSS 4.0 deadline forcing posture re-attestation across payment processing fabric. Tokenization expansion and partnership-API growth (Visa Direct, Visa+) are pushing more workloads to the edge — and the existing CSPM is incumbent-vendor without runtime depth.',
    lead: {
      code: 'O-01',
      name: 'Cloud Security Platform',
      entryPoint: 'VP Cloud Security / Head of Payments Platform',
    },
    next: {
      type: 'expansion',
      code: 'O-03',
      name: 'AI & Runtime Defense',
      reasoning:
        'fraud-detection and partner-API surface increasingly handled by ML inference',
    },
  },

  'acct-mastercard': {
    narrative:
      'Recursion (acquisition) and Brighterion (AI fraud) integrations are pulling ML inference workloads onto Mastercard infrastructure. Combined with active CNAPP RFP signals and a growing Kubernetes footprint, the timing for a unified posture-plus-runtime story is unusually clean.',
    lead: {
      code: 'O-01',
      name: 'Cloud Security Platform',
      entryPoint: 'CISO + VP Application Security',
    },
    next: {
      type: 'co-sell',
      code: 'O-03',
      name: 'AI & Runtime Defense',
      reasoning:
        'AI-driven fraud platform brings runtime detection into scope alongside posture',
    },
  },

  'acct-stripe': {
    narrative:
      'IaC + DevSecOps-mature org with growing Terraform footprint and a public engineering-blog cadence on supply-chain security. Recent expansion into LLM-powered Radar workflows opens the AI-defense door, but the obvious lead is shift-left for the engineering org that already takes security seriously.',
    lead: {
      code: 'O-02',
      name: 'Code Security',
      entryPoint: 'VP Engineering / Head of Application Security',
    },
    next: {
      type: 'expansion',
      code: 'O-01',
      name: 'Cloud Security Platform',
      reasoning:
        'engineering-led security teams typically pull posture in once shift-left is bought',
    },
  },

  'acct-datadog': {
    narrative:
      'Datadog acquired Sqreen + Cloudcraft and is building competitive CSPM/CWPP capabilities — but their own infra runs multi-cloud with no integrated cloud-security control plane. Co-opetition is the right frame: position as the security primitives layer underneath their observability story.',
    lead: {
      code: 'O-01',
      name: 'Cloud Security Platform',
      entryPoint: 'CISO + Head of Internal Security Engineering',
    },
    next: {
      type: 'co-sell',
      code: 'O-02',
      name: 'Code Security',
      reasoning:
        'their own product velocity demands secure-by-default pipelines',
    },
  },

  'acct-cloudflare': {
    narrative:
      'Workers AI + R2 storage growth pushes Cloudflare into a workload provider profile, not just a CDN. Their internal security org is small relative to surface area, and recent zero-trust expansion has put cloud-posture on the roadmap for the first time.',
    lead: {
      code: 'O-01',
      name: 'Cloud Security Platform',
      entryPoint: 'CISO Joe Sullivan-style role / Head of Platform Security',
    },
    next: {
      type: 'expansion',
      code: 'O-03',
      name: 'AI & Runtime Defense',
      reasoning:
        'Workers AI inference workloads will outgrow generic posture tooling within 12 months',
    },
  },

  'acct-block': {
    narrative:
      'Crypto + Cash App + Square: three regulated stacks under one roof, each with distinct compliance regimes (PCI, BSA/AML, NYDFS). AWS-only simplifies the sale, but the multi-tenant blast radius makes runtime-detection the more defensible long-term lead than pure posture.',
    lead: {
      code: 'O-03',
      name: 'AI & Runtime Defense',
      entryPoint: 'VP Security Engineering (Cash App + Crypto)',
    },
    next: {
      type: 'co-sell',
      code: 'O-01',
      name: 'Cloud Security Platform',
      reasoning:
        'cross-product posture standardization is a stated 2026 priority',
    },
  },

  // ── WHITESPACE ENTRIES ──────────────────────────────────────────────

  'ws-wells-fargo': {
    narrative:
      'Multi-cloud AWS + Azure with declining Palo Alto Prisma intensity — a classic displacement window. 17 security vendors detected, only 1 EDR primary; consolidation pressure is real. Active CNAPP RFP intent surge (+72pts in 21 days) means the buying committee is already engaged.',
    lead: {
      code: 'O-01',
      name: 'Cloud Security Platform',
      entryPoint: 'CISO + Chief Technology Risk Officer',
    },
    next: {
      type: 'co-sell',
      code: 'O-02',
      name: 'Code Security',
      reasoning:
        'banking-incumbent posture refresh typically pulls shift-left within 6–9 months',
    },
  },

  'ws-coinbase': {
    narrative:
      'Public crypto exchange with a security-engineering org of 100+ and a CSPM stack assembled from point tools post-IPO. AWS-primary, Kubernetes-heavy, and active intent on SBOM + supply-chain attestation. Engineering culture aligns with shift-left as the credible lead.',
    lead: {
      code: 'O-02',
      name: 'Code Security',
      entryPoint: 'VP Security Engineering / Head of Platform',
    },
    next: {
      type: 'expansion',
      code: 'O-01',
      name: 'Cloud Security Platform',
      reasoning:
        'once dev-pipeline trust is established, posture consolidation is the natural next conversation',
    },
  },

  'ws-anthropic': {
    narrative:
      'Foundation-model lab with the highest agentic-AI-deployment surface area in the customer set. Claude inference + tool-use traffic at scale, FedRAMP and SOC 2 Type II in flight, no existing runtime-detection layer above the AWS substrate.',
    lead: {
      code: 'O-03',
      name: 'AI & Runtime Defense',
      entryPoint: 'Head of Security / Head of Trust & Safety',
    },
    next: {
      type: 'co-sell',
      code: 'O-01',
      name: 'Cloud Security Platform',
      reasoning:
        'training-cluster posture and inference-cluster runtime are complementary buys',
    },
  },

  'ws-openai': {
    narrative:
      'Azure-primary at the foundation-model layer with explosive GPT-5 agentic API growth. Internal security team is well-staffed but stretched across model-safety and infra-security domains. Active intent on data-plane isolation and prompt-injection defense.',
    lead: {
      code: 'O-03',
      name: 'AI & Runtime Defense',
      entryPoint: 'CISO + Head of Infrastructure Security',
    },
    next: {
      type: 'expansion',
      code: 'O-01',
      name: 'Cloud Security Platform',
      reasoning:
        'platform engineering needs unified posture as the agent fleet outgrows ad-hoc controls',
    },
  },
};

export function getHgIntelligence(accountId) {
  return HG_INTELLIGENCE[accountId] || null;
}
