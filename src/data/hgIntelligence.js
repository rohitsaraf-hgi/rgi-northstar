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

// Each entry shape — MVP set (backward compatible):
//   {
//     narrative: string,
//     lead: { code, name, entryPoint, rationaleLine?, opener? },
//     next:  { type: 'co-sell' | 'expansion', code, name, reasoning },
//     // NEW — Account Card v2 fields (all optional; deriveOverview()
//     // fills sensible defaults when absent so accounts without rich
//     // authoring still render a coherent Overview):
//     freshness?: string,          // e.g. "7d ago" — most recent trigger
//     confidence?: 'high' | 'medium' | 'low',
//     triggers?: [                 // 2-4 auditable signals behind the narrative
//       { id, label, kind, detectedAt, evidenceUrl? }
//     ],
//     highlights?: [               // 3-5 dynamic tiles (strongest signals)
//       { id, category, headline, detail, magnitude? }
//     ],
//     painPoints?: [               // Account-wide, offering-tagged
//       { text, addressedBy: string[] }
//     ],
//   }
export const HG_INTELLIGENCE = {
  // ── ANCHOR ENTRIES (customer-authored) ──────────────────────────────

  'acct-jpmc': {
    narrative:
      'Cloud footprint jumped 50%→75% in one year while agentic AI went live across 40k+ developers — and CISO Patrick Opet already published an open letter in 2025 saying cloud and SaaS integrations are "quietly enabling cyberattackers." The case is already made by their own CISO.',
    freshness: '4d ago',
    confidence: 'high',
    triggers: [
      { id: 't-jpmc-1', label: 'Cloud footprint +25pt', kind: 'tech_change',    detectedAt: '2026-06-27' },
      { id: 't-jpmc-2', label: 'CISO open letter, 2025', kind: 'news',           detectedAt: '2025-04-15', evidenceUrl: 'https://reports.jpmorganchase.com/security' },
      { id: 't-jpmc-3', label: 'Agentic AI live · 40k devs', kind: 'tech_change', detectedAt: '2026-06-10' },
      { id: 't-jpmc-4', label: 'Payments modernization', kind: 'spend_delta',    detectedAt: '2026-05-30' },
    ],
    lead: {
      code: 'O-01',
      name: 'Cloud Security Platform',
      entryPoint: "CISO's office / VP Cloud Security",
      rationaleLine:
        'The public CISO position IS the pitch — you just show them how to operationalize their own argument.',
      opener:
        '"Patrick\'s open letter made the case publicly — we\'ve built the platform to operationalize exactly that argument across your cloud + SaaS estate. Worth 30 minutes with your VP Cloud Security?"',
    },
    next: {
      type: 'co-sell',
      code: 'O-03',
      name: 'AI & Runtime Defense',
      reasoning:
        'active agentic AI deployment at scale across payments and back-office',
    },
    highlights: [
      {
        id: 'h-jpmc-1',
        category: 'Cloud growth',
        headline: 'Cloud footprint 50% → 75% in 12 months',
        detail: 'Fastest cloud expansion across Tier-1 US banks — the surface HG tracks is growing faster than the security team.',
        magnitude: '+25pt YoY',
      },
      {
        id: 'h-jpmc-2',
        category: 'Buyer intent',
        headline: 'CISO publicly named cloud + SaaS as top risk',
        detail: 'Patrick Opet\'s 2025 open letter names SaaS integrations "quietly enabling cyberattackers." Rare on-record framing.',
        magnitude: 'On record',
      },
      {
        id: 'h-jpmc-3',
        category: 'AI at scale',
        headline: 'Agentic AI live across 40k+ developers',
        detail: 'Copilot + internal agent fleet in production. Runtime surface has ballooned; posture-only tooling can\'t see it.',
        magnitude: '40k+ devs',
      },
      {
        id: 'h-jpmc-4',
        category: 'Competitor gap',
        headline: 'No unified CNAPP layer detected',
        detail: '17 point-security vendors detected in the estate — sprawl consolidation is a stated 2026 platform priority.',
        magnitude: '17 vendors',
      },
      {
        id: 'h-jpmc-5',
        category: 'Compliance clock',
        headline: 'Payments modernization → PCI-DSS 4.0 gate',
        detail: 'Payments-fabric re-attestation window opens Q4 2026. Timing forces a posture refresh regardless.',
        magnitude: 'Q4 2026',
      },
    ],
    painPoints: [
      { text: 'Cloud sprawl creates blind spots across multi-cloud deployments',                addressedBy: ['O-01'] },
      { text: 'Tool fragmentation forces context-switching between CSPM, CWPP, KSPM, CIEM',      addressedBy: ['O-01'] },
      { text: 'Compliance evidence is manual and audit-cycle painful',                            addressedBy: ['O-01'] },
      { text: 'Agentic AI + copilot fleet has no runtime detection layer',                        addressedBy: ['O-03'] },
      { text: 'IaC + release velocity outpaces shift-left review capacity',                       addressedBy: ['O-02'] },
    ],
  },

  'acct-databricks': {
    narrative:
      'Agent Bricks launch puts 100k+ AI agents and managed MCP connections into production with no cloud infrastructure security layer underneath Unity AI Gateway. FedRAMP High and HITRUST pursuits across AWS and Azure make the compliance clock real.',
    freshness: '2d ago',
    confidence: 'high',
    triggers: [
      { id: 't-dbx-1', label: 'Agent Bricks GA · 100k agents', kind: 'tech_change', detectedAt: '2026-06-29' },
      { id: 't-dbx-2', label: 'FedRAMP High in flight',         kind: 'news',        detectedAt: '2026-05-12' },
      { id: 't-dbx-3', label: 'HITRUST audit window',           kind: 'news',        detectedAt: '2026-06-01' },
    ],
    lead: {
      code: 'O-03',
      name: 'AI & Runtime Defense',
      entryPoint: 'Head of AI Security / Head of Platform Security',
      rationaleLine:
        'Agent Bricks put 100k agents into production before a runtime-detection layer existed — the gap is fresh and visible.',
      opener:
        '"Congrats on Agent Bricks GA. Most teams shipping 100k agents at once end up needing runtime detection under Unity AI Gateway before the FedRAMP window closes. Worth a 30-min working session with your Head of AI Security?"',
    },
    next: {
      type: 'expansion',
      code: 'O-01',
      name: 'Cloud Security Platform',
      reasoning: 'as cloud workload footprint grows',
    },
    highlights: [
      {
        id: 'h-dbx-1',
        category: 'AI at scale',
        headline: 'Agent Bricks live · 100k+ agents in production',
        detail: 'Unity AI Gateway + MCP connections went GA this month. Attack surface just multiplied without a runtime layer.',
        magnitude: '100k agents',
      },
      {
        id: 'h-dbx-2',
        category: 'Compliance clock',
        headline: 'FedRAMP High + HITRUST both in flight',
        detail: 'Dual-cloud AWS + Azure audit paths converge Q4 2026 — creates a hard deadline for the security stack.',
        magnitude: 'Q4 2026',
      },
      {
        id: 'h-dbx-3',
        category: 'Tech stack fit',
        headline: 'AWS + Azure dual-cloud, no CNAPP incumbent',
        detail: 'Multi-cloud footprint with fragmented posture tools — clean CNAPP entry alongside runtime.',
        magnitude: '2 clouds',
      },
    ],
    painPoints: [
      { text: 'AI agent fleet has no runtime detection or policy layer',                addressedBy: ['O-03'] },
      { text: 'Multi-cloud posture fragmentation across AWS + Azure',                    addressedBy: ['O-01'] },
      { text: 'Compliance evidence collection is manual across FedRAMP + HITRUST',        addressedBy: ['O-01'] },
      { text: 'Model-supply-chain provenance unclear for external MCP connectors',        addressedBy: ['O-02', 'O-03'] },
    ],
  },

  // ── SYNTHESIZED (same shape, varies by account profile) ─────────────

  'acct-snowflake': {
    narrative:
      "New CISO hire from Datadog (security-mature org) signals posture-refresh window. Multi-cloud AWS + Azure + GCP plus Snowpark for data-science workloads creates a sprawling identity and data-plane surface that today's CSPM doesn't see across regions.",
    freshness: '11d ago',
    confidence: 'medium',
    triggers: [
      { id: 't-snow-1', label: 'New CISO ex-Datadog', kind: 'hiring',       detectedAt: '2026-06-20' },
      { id: 't-snow-2', label: 'Snowpark GA growth',   kind: 'tech_change', detectedAt: '2026-05-18' },
      { id: 't-snow-3', label: 'Tri-cloud identity sprawl', kind: 'intent', detectedAt: '2026-06-05' },
    ],
    lead: {
      code: 'O-01',
      name: 'Cloud Security Platform',
      entryPoint: 'New CISO + VP Platform Security',
      rationaleLine:
        'New CISO with security-mature pedigree = the 100-day posture-refresh window opens now. Best time to be the incumbent.',
      opener:
        '"Congrats on the new CISO chair. New security leaders usually run a posture audit in their first 90 days — happy to bring HG data on your multi-cloud identity surface to that conversation."',
    },
    next: {
      type: 'co-sell',
      code: 'O-02',
      name: 'Code Security',
      reasoning:
        'heavy IaC and data-pipeline release velocity — shift-left fits the engineering culture',
    },
    highlights: [
      { id: 'h-snow-1', category: 'People signal',  headline: 'New CISO from Datadog (security-mature)', detail: 'First 90 days = posture-audit window. Champion is inbound, not internal.', magnitude: 'Hired Jun' },
      { id: 'h-snow-2', category: 'Tech spread',    headline: 'Tri-cloud: AWS + Azure + GCP',            detail: 'Cross-region identity + data-plane surface exceeds current CSPM coverage.',   magnitude: '3 clouds' },
      { id: 'h-snow-3', category: 'Workload growth', headline: 'Snowpark data-science expansion',        detail: 'Data-plane workloads with novel identity + secrets patterns — no runtime layer.', magnitude: 'GA path' },
    ],
    painPoints: [
      { text: 'CSPM does not span AWS + Azure + GCP consistently',                       addressedBy: ['O-01'] },
      { text: 'Snowpark data-plane workloads have no runtime detection',                  addressedBy: ['O-03'] },
      { text: 'IaC + pipeline release velocity outpaces shift-left review',               addressedBy: ['O-02'] },
    ],
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

// ────────────────────────────────────────────────────────────────────
// Account Overview v2 — fallback derivation for entries without the
// full authored payload. Guarantees every account with intelligence
// renders a coherent Overview (Why Now + Lead With + Highlights +
// Pain Points), even when only the legacy narrative + lead + next
// exist.
//
// The component always reads through resolveAccountOverview() so it
// never has to branch on "does this account have new fields yet."
// ────────────────────────────────────────────────────────────────────

// Split a narrative into two-to-three sentences and pull short labels
// suitable for trigger chips. Not fancy — takes the first N sentences
// and truncates. When the fixture is fully authored these are ignored.
function narrativeToTriggers(narrative) {
  if (!narrative) return [];
  const sentences = narrative
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 3);
  return sentences.map((s, i) => ({
    id: `derived-trigger-${i}`,
    label: s.length > 60 ? `${s.slice(0, 57).trim()}…` : s.trim(),
    kind: 'derived',
    detectedAt: null,
  }));
}

// A generic opener template used when the fixture doesn't author one.
// Kept intentionally cautious — sellers will regenerate; this exists so
// the block never renders blank.
function defaultOpener(accountName, offeringName, entryPoint) {
  return `"Wanted to reach out on ${accountName}'s ${offeringName.toLowerCase()} priorities. Happy to bring HG data to a 30-min working session with ${entryPoint}."`;
}

function defaultRationale(offeringName) {
  return `Lead with ${offeringName} — the strongest signal alignment against this account's current moment.`;
}

// Fallback highlights when the fixture doesn't author its own. Pulls
// from the account object's signals + firmographics so the tiles feel
// specific. Kept to 3 to make the sparse state honest.
function deriveHighlightsFromAccount(account) {
  if (!account) return [];
  const highlights = [];
  const signals = Array.isArray(account.signals) ? account.signals : [];

  // Top-scoring signal → intent / event highlight
  const topSignal = signals[0];
  if (topSignal) {
    highlights.push({
      id: `derived-h-1`,
      category: topSignal.type ? topSignal.type.replace(/_/g, ' ') : 'Signal',
      headline: topSignal.headline || 'Recent signal detected',
      detail: topSignal.detail || 'Auto-surfaced from HG signal stream.',
      magnitude: topSignal.daysAgo != null ? `${topSignal.daysAgo}d ago` : null,
    });
  }

  // Firmographic anchor
  if (account.industry || account.employees || account.revenue) {
    const bits = [];
    if (account.industry) bits.push(account.industry);
    if (account.employees) bits.push(`${account.employees} employees`);
    if (account.revenue) bits.push(`${account.revenue} revenue`);
    highlights.push({
      id: `derived-h-2`,
      category: 'Firmographic fit',
      headline: bits[0] || 'Fits ICP profile',
      detail: bits.join(' · '),
      magnitude: null,
    });
  }

  // Second signal, if any
  if (signals[1]) {
    highlights.push({
      id: `derived-h-3`,
      category: signals[1].type ? signals[1].type.replace(/_/g, ' ') : 'Signal',
      headline: signals[1].headline || 'Recent signal detected',
      detail: signals[1].detail || 'Auto-surfaced from HG signal stream.',
      magnitude: signals[1].daysAgo != null ? `${signals[1].daysAgo}d ago` : null,
    });
  }

  return highlights;
}

// Fallback pain points — takes legacy `leadOffering.painPoints` (array
// of strings) and wraps as { text, addressedBy: [leadCode] }.
function derivePainPointsFromOffering(offeringPainPoints, leadCode) {
  if (!Array.isArray(offeringPainPoints)) return [];
  return offeringPainPoints.map((text) => ({
    text,
    addressedBy: leadCode ? [leadCode] : [],
  }));
}

// Main resolver. Takes the raw intelligence entry + resolved offering
// + full account object. Returns a stable AccountOverview shape.
//
// Contract for the component:
//   { whyNow, leadWith, coSell, highlights, painPoints }
// Any field can be null and the component hides that section.
export function resolveAccountOverview({ intel, account, leadOffering, nextOffering }) {
  if (!intel) return null;

  const authoredTriggers = Array.isArray(intel.triggers) && intel.triggers.length > 0;
  const authoredHighlights = Array.isArray(intel.highlights) && intel.highlights.length > 0;
  const authoredPainPoints = Array.isArray(intel.painPoints) && intel.painPoints.length > 0;

  const triggers = authoredTriggers ? intel.triggers : narrativeToTriggers(intel.narrative);

  // Confidence defaults: high when 3+ triggers are explicitly authored,
  // medium when at least one authored, low otherwise.
  const confidence =
    intel.confidence ||
    (authoredTriggers && triggers.length >= 3
      ? 'high'
      : authoredTriggers
      ? 'medium'
      : 'low');

  const whyNow = intel.narrative
    ? {
        narrative: intel.narrative,
        triggers,
        freshness: intel.freshness || null,
        confidence,
      }
    : null;

  const leadWith = intel.lead
    ? {
        offeringCode: intel.lead.code,
        offeringName: intel.lead.name,
        entryPoint: intel.lead.entryPoint || null,
        rationaleLine:
          intel.lead.rationaleLine || defaultRationale(intel.lead.name),
        opener:
          intel.lead.opener ||
          defaultOpener(
            account?.name || 'this account',
            intel.lead.name,
            intel.lead.entryPoint || 'the buyer',
          ),
        offering: leadOffering || null,
      }
    : null;

  const coSell = intel.next
    ? {
        offeringCode: intel.next.code,
        offeringName: intel.next.name,
        type: intel.next.type || 'co-sell',
        rationaleLine: intel.next.reasoning || null,
        offering: nextOffering || null,
      }
    : null;

  const highlights = authoredHighlights
    ? intel.highlights
    : deriveHighlightsFromAccount(account);

  const painPoints = authoredPainPoints
    ? intel.painPoints
    : derivePainPointsFromOffering(leadOffering?.painPoints, intel.lead?.code);

  return { whyNow, leadWith, coSell, highlights, painPoints };
}
