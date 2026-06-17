# PRD — RGI Workbench Onboarding

| | |
|---|---|
| **Owner** | Rohit Saraf, Product |
| **Status** | Draft · v0.1 |
| **Last updated** | 2026-06-11 |
| **Reviewers** | Engineering · Design · GTM Leadership |
| **Related** | Tenant Profile · Offerings · Scoring Models · Plays · Workbook |

---

## 1. Executive Summary

The RGI Workbench is HG Insights' AI-native GTM Intelligence platform. Customers buy it to **enrich their Salesforce accounts with HG's proprietary technographic, firmographic, IT spend, AI spend, and intent data** — then activate that enriched data through grounded outreach (account briefs, emails, business cases, contact discovery).

This PRD specifies the **onboarding experience for two personas**:

1. **RevOps admin onboarding** — extracts tenant context, configures offerings, builds scoring models, and prepares the workbench for sellers. *(this document)*
2. **Seller onboarding** — first-run experience after RevOps has set up the platform. *(stub at end of this doc; full spec in a follow-up version)*

**The onboarding's success is measured by**: time-to-first-value (RevOps reaching a fully-scored workbench) and the quality of the AI-extracted tenant context (admin acceptance rate, edit volume).

---

## 2. Strategic Context

Most GTM tools require RevOps to **manually configure** ICP filters, build segments, pick competitors, set up scoring rules. The friction is severe — most customers stall mid-setup and never reach value.

Our wedge is that **HG already knows everything we need to bootstrap a tenant** from their domain alone:

- We have firmographic data on the tenant company itself
- We have product / market intelligence on what the tenant sells
- We have install + intent data on competitors and the broader market
- We have IT spend and AI spend data per company

This means our onboarding can be **agentic from the first screen** — the admin reviews and refines, they don't build from scratch. That's the value-prop demonstration in the first 30 minutes.

By the time the admin "enters the workbench" the platform has already:
- Built and confirmed tenant context
- Configured up to 3 offerings with all attributes pre-populated
- Generated a scoring model per offering using Fit / Need / Intent methodology
- Scored the relevant universe of accounts (tenant book + matching HG universe whitespace)
- Tagged everything with provenance so the admin can trust and verify

---

## 3. Goals & Non-Goals

### Goals
- Provide a **three-step agentic onboarding** for RevOps that's complete within ~30 minutes of work (across multiple sessions if needed).
- Pre-populate everything we can from HG's data + LLM analysis of the tenant's domain. Admin's job is review + refine, not author.
- Make all extracted data **editable and traceable** — admin can see *why* the AI chose each value.
- Constrain offerings to **3 maximum** at onboarding; if tenant has more products, LLM groups them into logical offerings.
- Generate a **scoring model per offering** using the DC methodology (Fit 50% · Need 35% · Intent 15%) and score all relevant accounts before the admin enters the workbench.
- Persist all extracted state so admins can resume across sessions.

### Non-Goals
- Authoring more than 3 offerings during onboarding (post-onboarding admins can add more via Workbench).
- Authoring custom scoring models from scratch during onboarding (admin can tune the AI-generated model post-onboarding).
- Configuring Plays during onboarding (Plays come after the admin has worked the Workbench).
- Multi-language support (English-only for v1).
- Multi-tenant admin (single admin per tenant onboards; admin can invite teammates post-onboarding).

---

## 4. Personas

| Persona | Onboarding role | Time investment expected |
|---|---|---|
| **RevOps Admin** (Priya) | Drives onboarding. Final say on tenant context, offerings, scoring model approval. | 30–60 minutes total, may be split across sessions |
| **AE / AM Seller** (Alex, Riley) | Doesn't participate in this onboarding. Has separate first-run experience after RevOps finishes. | (specified in seller-onboarding PRD — stub at end) |
| **MOps / Data Lead** (Marcus) | Optional reviewer of the scoring model. Not required to complete onboarding. | 0–15 minutes if engaged |

---

## 5. End-to-End Onboarding Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1 — Tenant Context Extraction (Agentic)                       │
│  Input: tenant domain (e.g., wiz.io)                                │
│  AI agents extract everything we need to bootstrap the tenant.      │
│  Admin reviews + edits each field.                                  │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2 — Offering Configuration                                    │
│  AI proposes up to 3 offerings (grouping products if >3 exist).     │
│  Each offering: name, products, pain points, intent topics,         │
│  competitors, complementary tech, target ICP.                       │
│  Admin reviews + confirms each offering.                            │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3 — Scoring Models + Initial Universe Scoring                 │
│  AI generates a scoring model per offering (Fit / Need / Intent).   │
│  System scores all HG-universe accounts matching target ICP.        │
│  Admin reviews top-tier accounts per offering.                      │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4 — Workbench Entry (Default View + Enrichment)               │
│  Filtered, scored table of accounts per offering.                   │
│  Default columns + intent-based query engine for new columns.       │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5 — Play Configuration                                        │
│  AI proposes Plays per offering, composed from 1P + 3P signals,     │
│  with recommended actions. Admin reviews + activates.               │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 6 — Integrations Setup                                        │
│  Connect Salesforce, HubSpot, Slack (v1 set).                       │
│  Map fields, grant agent access scopes, confirm sync direction.     │
│  Initial bulk pull → admin notified when complete.                  │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 7 — Configure Teams                                           │
│  RevOps creates teams (e.g., "Enterprise West", "Mid-Market AMER"). │
│  Each team is assigned offerings + scoring profile + default Plays. │
│  Teams are the unit of seller grouping for book + lens inheritance. │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 8 — Configure Agents                                          │
│  RevOps enables which seller-facing agents are available:           │
│   • Account Brief Agent                                             │
│   • Email Outreach Agent                                            │
│   • Opportunity Finder Agent                                        │
│   • Find More Contacts Agent                                        │
│  Visibility set per Team (default) or per Seller (override).        │
│  Enabled agents appear in the seller's Account view.                │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 9 — Invite Sellers (CRM-driven discovery)                     │
│  Unlocks after CRM integration completes.                           │
│  System suggests sellers from CRM users. Admin assigns each seller  │
│  to a team (book + offering lens + Plays + agents inherited).       │
│  Bulk-invite via email + Slack DM with magic links.                 │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 10 — Seller First-Run (per seller, post-invite)               │
│  Seller clicks magic link → lands in RGI Workbench.                 │
│  Pre-loaded: their book of accounts + whitespace not in CRM,        │
│  scored against their team's offerings + Plays.                     │
│  Agents available in Account view are those RevOps enabled.         │
│  Short orientation tour, then they're live.                         │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
                       Onboarding Complete
```

Each step has explicit completion criteria. Steps can be revisited at any point post-onboarding (Workbench surfaces "Re-extract context", "Add offering", "Tune model", "Edit Play", "Manage integrations", "Manage teams", "Invite sellers" affordances).

---

## 6. Step 1 — Tenant Context Extraction

### 6.1 User Story

> *As a RevOps admin starting onboarding, I enter my company's domain and the platform tells me what it already knows about us so I don't have to type it all in. I review what's right, fix what's wrong, and approve.*

### 6.2 Input

- **Tenant domain** (required, e.g., `wiz.io`)
- Optional: tenant work email of the admin (used to verify they belong to the company)

### 6.3 AI-Extracted Tenant Context

Three logical groups of fields, all pre-populated by the agent and editable by the admin:

#### A. Tenant Firmographics (about the tenant's own company)
- `tenant.industry` — NAICS-level industry
- `tenant.employee_count` — exact or band (e.g., "1,000–5,000")
- `tenant.revenue` — exact or band (e.g., "$500M–$1B")
- `tenant.headquarters` — city, state, country
- `tenant.public_status` — public / private / pre-IPO
- `tenant.year_founded`

#### B. Product / Market Knowledge (what the tenant sells)
- `tenant.products[]` — array of product/service names the tenant sells
- `tenant.pain_points[]` — what problems the products solve
- `tenant.spend_categories[]` — IT spend categories the tenant operates in (mapped to HG's spend taxonomy)
- `tenant.intent_topics[]` — relevant HG intent topics the tenant's market researches

#### C. Market Positioning
- `tenant.competitors[]` — primary competitor companies
- `tenant.complementary_tech[]` — technology stack products that complement the tenant's
- `tenant.buying_committee[]` — persona titles that typically buy from the tenant (e.g., CISO, VP Cloud Security)

#### D. Target ICP
- `tenant.target_icp.industries[]` — tier-1 / tier-2 industries
- `tenant.target_icp.geography[]` — country/region focus
- `tenant.target_icp.revenue_band` — min / max
- `tenant.target_icp.employee_band` — min / max

### 6.4 Functional Requirements

| ID | Requirement |
|---|---|
| F1.1 | System accepts tenant domain as input and triggers the Tenant Context Extraction agent. |
| F1.2 | Agent uses HG firmographic data + web search + LLM analysis to populate all fields in §6.3. |
| F1.3 | Every extracted field shows its **source** — "HG firmographic database", "Web search · tenant.com/products", "LLM inferred from competitor pages", etc. |
| F1.4 | Every field is editable inline. Edit captures who/when in audit log. |
| F1.5 | Multi-value fields (`products[]`, `competitors[]`, etc.) support add/remove. Each entry is editable. |
| F1.6 | If extraction confidence is low for a field, surface a "Needs review" badge. |
| F1.7 | Admin can re-run extraction for any single field or for the entire context. |
| F1.8 | Admin must explicitly **confirm** the tenant context before proceeding to Step 2. Confirmation freezes a snapshot; future changes increment a version. |
| F1.9 | If the tenant domain is one HG has no data on, gracefully degrade — surface a manual entry flow with the same fields but no pre-fill. |
| F1.10 | Extraction is **idempotent** — re-running on the same domain returns same results unless underlying HG data has refreshed. |

### 6.5 UX Requirements

- **Initial state** — minimal form: domain input + "Start setup" button. After submit, show "Analyzing your domain..." with an agent-progress indicator (5–30 seconds expected).
- **Extraction results view** — three-column grouping (Firmographics · Product/Market · Positioning + ICP). Each card shows the value, source chip, edit affordance.
- **Confidence treatment** — high-confidence fields show plain; low-confidence fields outlined in amber with a "Verify this" prompt.
- **Provenance disclosure** — every field has a hover/click that shows *exactly* what the agent saw to make the call. Builds trust.
- **Progress indicator** — clear step 1/3 indicator at top with the next two steps preview-hinted.

### 6.6 Data Model

```ts
TenantContext {
  id: string                      // tenant id
  domain: string                  // primary domain (the input)
  status: 'extracting' | 'pending_review' | 'confirmed'
  version: number                 // increments on each confirmation
  extractedAt: ISODate
  confirmedAt: ISODate | null

  firmographics: {
    industry: { value: string, confidence: number, source: string }
    employee_count: { value: string, confidence: number, source: string }
    revenue: { value: string, confidence: number, source: string }
    headquarters: { value: string, confidence: number, source: string }
    public_status: { value: 'public' | 'private' | 'pre_ipo', confidence: number, source: string }
    year_founded: { value: number, confidence: number, source: string }
  }

  products: Array<{ name: string, description: string, source: string, confidence: number }>
  painPoints: Array<{ text: string, source: string, confidence: number }>
  spendCategories: Array<{ name: string, hgCategoryId: string, source: string, confidence: number }>
  intentTopics: Array<{ name: string, hgTopicId: string, source: string, confidence: number }>
  competitors: Array<{ name: string, domain: string | null, source: string, confidence: number }>
  complementaryTech: Array<{ name: string, hgProductId: string | null, source: string, confidence: number }>
  buyingCommittee: Array<{ title: string, seniority: string, source: string, confidence: number }>

  targetIcp: {
    industries: Array<{ name: string, tier: 1 | 2 | 3 }>
    geography: string[]
    revenueBand: { min: number, max: number, currency: 'USD' }
    employeeBand: { min: number, max: number }
  }

  auditLog: Array<{ field: string, action: 'extracted' | 'edited' | 'reset', by: string, at: ISODate, oldValue?: any, newValue?: any }>
}
```

### 6.7 Acceptance Criteria

- [ ] Given a valid domain, the system extracts all fields in §6.3 within 60 seconds.
- [ ] Every extracted field has a visible source chip.
- [ ] Admin can edit any field; edits persist immediately.
- [ ] Admin cannot proceed to Step 2 until they click "Confirm tenant context".
- [ ] Confidence < 0.6 fields are visually flagged.
- [ ] Audit log shows every edit with timestamp + user.
- [ ] If domain has no HG data, manual-entry fallback works for all fields.
- [ ] Re-extraction is idempotent and shows a diff vs. previous extraction.

### 6.8 Open Questions

1. What's our threshold for "low confidence"? (Suggest: <0.6 = visual flag, <0.3 = block confirmation until reviewed.)
2. Do we ask for the admin's email to validate domain ownership, or trust the domain unverified for v1?
3. How do we handle subsidiaries / parent companies (e.g., user enters `salesforce.com` but should we surface MuleSoft, Tableau as related entities)?
4. What's the rate limit on the extraction agent? Should multi-tenant signups queue?

---

## 7. Step 2 — Offering Configuration

### 7.1 User Story

> *As a RevOps admin, I see that the platform has organized my company's products into up to 3 offerings — each with the right competitors, target ICP, and pain points. I review the grouping, adjust if needed, and confirm.*

### 7.2 Input

- Confirmed tenant context from Step 1 (`tenant.products[]`, `tenant.pain_points[]`, `tenant.competitors[]`, etc.)

### 7.3 LLM-Driven Offering Grouping

If `tenant.products.length <= 3`: each product becomes its own offering (1:1 mapping).
If `tenant.products.length > 3`: an LLM agent **groups products into logical offerings** (max 3), each representing a distinct buying motion.

**Grouping principles the LLM should follow**:
- Group products that share **target buyer persona**.
- Group products that share **target ICP** (industries, size).
- Group products that share **primary competitors**.
- Split products that have **distinct buying motions** even if same target buyer (e.g., a CNAPP product vs. CIEM product — both bought by CISO but distinct evaluation cycles).
- Surface the **grouping rationale** to the admin so they can adjust.

### 7.4 Per-Offering Attributes

Each offering object has:

| Field | Source | Editable? |
|---|---|---|
| `name` | LLM-suggested or product name | Yes |
| `description` | LLM-generated | Yes |
| `products[]` | Subset of tenant.products[] | Yes (drag to reassign) |
| `painPoints[]` | LLM-filtered from tenant.painPoints[] | Yes (add/remove/edit) |
| `intentTopics[]` | LLM-filtered from tenant.intentTopics[] | Yes |
| `competitors[]` | LLM-filtered from tenant.competitors[] | Yes |
| `complementaryTech[]` | LLM-filtered from tenant.complementaryTech[] | Yes |
| `targetIcp.industries[]` | LLM may narrow tenant.targetIcp.industries for this offering | Yes |
| `targetIcp.revenueBand` | Inherits from tenant or LLM-narrowed | Yes |
| `targetIcp.employeeBand` | Inherits from tenant or LLM-narrowed | Yes |

### 7.5 Functional Requirements

| ID | Requirement |
|---|---|
| F2.1 | System auto-generates up to 3 offerings on entry to Step 2. |
| F2.2 | If tenant has ≤3 products, each product → 1 offering. If >3 products, LLM groups into 3 offerings. |
| F2.3 | Each offering shows its grouping rationale — "Why these products are grouped". |
| F2.4 | Admin can drag a product between offerings; UI re-computes the grouping rationale. |
| F2.5 | Admin can add a new offering (up to a hard cap of 3 during onboarding). |
| F2.6 | Admin can remove an offering (with confirmation; any products in it move to another offering or to a "Unassigned" bucket). |
| F2.7 | Admin can edit every offering attribute inline. |
| F2.8 | Admin must confirm **each offering** individually (or all-at-once) before proceeding. |
| F2.9 | All offering edits persist immediately to backend. |

### 7.6 UX Requirements

- **Initial state on entering Step 2** — show all 3 proposed offerings as side-by-side cards. Header reads "We grouped your products into N offerings. Review and adjust."
- **Offering card** — name (editable), description, expandable sections for products, pain points, intent topics, competitors, complementary tech, target ICP.
- **Grouping rationale** — small "Why this grouping?" disclosure on each offering card.
- **Inter-offering drag** — drag a product chip from one offering to another → updates groupings and triggers a "Re-evaluate" of dependent attributes (pain points, competitors).
- **Add offering** — button at end of offering list, opens an empty offering for manual configuration.
- **Confirmation** — each offering has its own "Confirm" button; once all confirmed, "Proceed to scoring →" lights up.

### 7.7 Data Model

```ts
Offering {
  id: string
  tenantId: string
  status: 'draft' | 'confirmed'
  confirmedAt: ISODate | null
  version: number
  
  name: string
  description: string
  products: Array<{ name: string, description?: string }>
  groupingRationale: string                // LLM-generated, editable
  
  painPoints: Array<{ text: string }>
  intentTopics: Array<{ name: string, hgTopicId: string }>
  competitors: Array<{ name: string, domain: string | null }>
  complementaryTech: Array<{ name: string, hgProductId: string | null }>
  
  targetIcp: {
    industries: Array<{ name: string, tier: 1 | 2 | 3 }>
    revenueBand: { min: number, max: number, currency: string }
    employeeBand: { min: number, max: number }
    geography: string[]
  }
  
  // Filled in Step 3
  scoringModelId: string | null
  
  auditLog: Array<{ field: string, action: 'created' | 'edited' | 'product_moved', by: string, at: ISODate }>
}
```

### 7.8 Acceptance Criteria

- [ ] On entering Step 2, between 1 and 3 offerings appear, pre-populated.
- [ ] Each offering shows a grouping rationale.
- [ ] Admin can drag products between offerings.
- [ ] Admin can edit any offering attribute and changes persist.
- [ ] Admin cannot proceed to Step 3 until all offerings are confirmed.
- [ ] Hard cap of 3 offerings during onboarding is enforced.
- [ ] Removing an offering safely re-homes its products.

### 7.9 Open Questions

1. What happens if the tenant truly has only 1 or 2 products? Do we still pad to 3 or accept fewer?
2. Should the LLM auto-name offerings based on buying motion (e.g., "Cloud Security Platform" instead of using the product names)?
3. How do we handle products that don't clearly belong to any offering — show a holding bucket, or force assignment?
4. Should the 3-offering cap be a config flag or a hard limit? (Some enterprise tenants may legitimately have 4–5 distinct motions.)

---

## 8. Step 3 — Scoring Models + Initial Universe Scoring

### 8.1 User Story

> *As a RevOps admin, after I confirm my offerings, the platform shows me a scoring model per offering — built using Fit / Need / Intent methodology — and the top accounts that match each offering. I review the models, accept them, and the workbench opens with accounts already scored and ready for sellers.*

### 8.2 Input

- Confirmed offerings from Step 2

### 8.3 AI-Generated Scoring Models — DC Methodology

For each confirmed offering, the platform generates a scoring model with three pillars:

**Fit (50%)** — Is this the right company?
- Company Size dimension (max 30 pts) — bell-curved on offering's target employee band
- Industry Fit dimension (max 30 pts) — tier-1 / tier-2 / tier-3 from offering.targetIcp.industries
- IT Spend bonus (max 15 pts) — bonus only; no penalty for missing data
- Complexity Signals (max 25 pts) — regulation, multinational, Fortune presence

**Need (35%)** — Does their tech stack show need?
- Vendor Ecosystem (max 15 pts) — accounts with the tenant's own products (cross-sell)
- Displacement Targets (max 35 pts) — accounts with the offering's competitors
- Tech Demand Signals (max 15 pts) — accounts with the offering's complementary tech
- Tech Sophistication (max 10 pts) — cloud / iPaaS / compliance tools
- Fragmentation (max 10 pts) — multiple overlapping tools = consolidation candidate
- Stack Momentum (max 15 pts) — recent installs of complementary tech, minus competitor installs

**Intent (15%)** — Are they actively researching?
- Direct Product Intent (max 35 pts) — offering's intent topics from §7.4
- Category Intent (max 30 pts) — tiered (core / adjacent / broad)
- Competitor Intent (max 20 pts) — researching offering's competitors
- Buyer Activity (max 15 pts) — TrustRadius / pricing page / comparison page activity

**Tier thresholds** (default): A ≥ 75 · B ≥ 55 · C ≥ 35 · D ≥ 15

### 8.4 Functional Requirements

| ID | Requirement |
|---|---|
| F3.1 | On entering Step 3, system auto-generates one scoring model per confirmed offering. |
| F3.2 | Each model uses Fit / Need / Intent pillar structure with caps from §8.3. |
| F3.3 | Each dimension is **auto-populated from the offering's config**: industries → Industry Fit; competitors → Displacement Targets; intent topics → Direct Product Intent; complementary tech → Vendor Ecosystem + Tech Demand. |
| F3.4 | Admin can review each dimension and adjust the inputs (e.g., reorder competitor tier, change ICP thresholds). |
| F3.5 | System runs initial scoring across **all HG-universe accounts that pass the offering's basic ICP filter**, NOT just the tenant's CRM book. |
| F3.6 | Scoring produces a tier (A / B / C / D / Out) per account per offering. |
| F3.7 | Admin sees a per-offering distribution chart (e.g., "47 A · 89 B · 320 C · 791 D · 25 not in CRM"). |
| F3.8 | Admin can drill into the top 20 A-tier accounts per offering for sanity check. |
| F3.9 | Admin must confirm each scoring model before proceeding to the workbench. |
| F3.10 | Models are versioned; any future tuning creates v2, v3, etc. (initial onboarding model is v1). |

### 8.5 UX Requirements

- **Initial state** — three scoring model cards (one per offering), each with status "Generating…" → "Ready for review".
- **Model card** — composite weights bar (50/35/15), tier distribution preview, "Open builder" CTA.
- **Builder route** — the existing `/admin/offerings/:id/model` route (already built). For onboarding, add a banner "Onboarding — review this scoring model and confirm".
- **Sanity check view** — top 20 A-tier accounts per offering, each row showing the dimensions that contributed most to its score (provenance).
- **Confirmation** — each model has a "Confirm model & scores" button. Once all three confirmed, the **Enter Workbench** CTA appears.

### 8.6 Data Model

```ts
ScoringModel {
  id: string
  offeringId: string
  status: 'generating' | 'pending_review' | 'confirmed' | 'active'
  version: number
  generatedAt: ISODate
  confirmedAt: ISODate | null

  compositeWeights: { fit: 50, need: 35, intent: 15 }
  tierThresholds: { A: 75, B: 55, C: 35, D: 15 }

  fit: {
    dimensions: Array<Dimension>
    disqualifiers: Array<{ rule: string, whenNull: 'skip' | 'penalize' }>
    sharedAcrossOfferings: boolean      // typically true for same tenant
  }
  need: { dimensions: Array<Dimension> }
  intent: { dimensions: Array<Dimension> }

  // After initial scoring
  totalAccountsScored: number
  tierDistribution: { A: number, B: number, C: number, D: number, Out: number }
  lastEvaluatedAt: ISODate
}

Dimension {
  id: string
  name: string
  cap: number
  rule: string                          // human-readable
  autoBuiltFrom: string                 // e.g., "offering.competitors"
  inputs: Array<{ label: string, value: string, source: 'offering' | 'manual' }>
}

AccountScore {
  accountId: string
  offeringId: string
  modelVersion: number
  composite: number                     // 0-100
  tier: 'A' | 'B' | 'C' | 'D' | 'Out'
  fitScore: number
  needScore: number
  intentScore: number
  dimensionBreakdown: { [dimensionId: string]: number }
  scoredAt: ISODate
}
```

### 8.7 Acceptance Criteria

- [ ] On entering Step 3, one scoring model per offering is auto-generated within 2 minutes.
- [ ] Each model's dimensions are pre-populated from offering config (see F3.3).
- [ ] Initial scoring runs against HG-universe accounts matching offering ICP filter.
- [ ] Admin sees tier distribution per offering.
- [ ] Top 20 A-tier accounts are visible with score breakdown.
- [ ] Admin can adjust any dimension input and re-score.
- [ ] Admin cannot proceed to the workbench until all models are confirmed.
- [ ] Confirmed models become v1 with `status: 'active'`.

### 8.8 Open Questions

1. What's the expected universe size? If we score 100K+ accounts per offering, what's the perf budget?
2. Should initial scoring be incremental (score top 1K first, return; score the rest in background)?
3. How do we handle accounts that score A-tier on multiple offerings — surface in all relevant offerings, or pick a "primary fit"?
4. Should we let admins skip Step 3 entirely (accept defaults, score in background, enter workbench immediately)? Pro: faster TTV. Con: weakens the trust-building moment.

---

## 9. Step 4 — Workbench Entry: Default View & Intent-Based Enrichment

Onboarding ends when the admin clicks **Enter Workbench**. The first surface they see is the RGI Workbench — a filtered, pre-scored table of accounts, ready to enrich and activate. This section specifies that landing experience and the **intent-based query engine** that powers further enrichment.

### 9.1 User Story

> *As a RevOps admin, the moment I enter the workbench I see a filtered, scored list of accounts for my offerings. Each row already tells me who they are, why they matter now, what competitors they run, and what complementary tech they have. From there, I can ask the workbench in plain language to enrich the list with more context — "show me which of these are researching Wiz competitors", "add IT spend trend for last 12 months", "flag any with recent CISO hires" — and new columns appear, sourced from HG intent + firmographic + technographic data.*

### 9.2 Entry State

When the admin enters the workbench post-onboarding:

- **Default offering lens** — the workbench is filtered to the **first confirmed offering** from Step 2. A lens switcher in the header allows toggling between offerings (or "All offerings" — union, deduped by best score).
- **Default account source** — **HG-universe whitespace accounts matching the offering's ICP**, filtered to A and B tiers from the Step 3 scoring run. If a CRM is connected, a source toggle (Book / Whitespace / Both) is visible; default is **Whitespace** for the post-onboarding moment (this is where the "we already found accounts you didn't know about" magic lives).
- **Default sort** — composite score descending.
- **Pre-applied filters** — Tier A + Tier B accounts only (toggleable). Admin can clear filters to see the full distribution.

### 9.3 Default Columns (v1)

The default table view has the following columns in this order. All are sortable. All are derived from existing HG data — no manual enrichment required.

| # | Column | Source | Behavior |
|---|---|---|---|
| 1 | **Account** | `account.name` + `account.domain` | Primary identifier. Click → AccountThread (offering-aware detail view). |
| 2 | **Tier** | `accountScore.tier` for current offering lens | Color-coded chip (A green · B blue · C amber · D grey). Hover → composite score + dimension breakdown. |
| 3 | **Revenue** | `account.revenue` (HG firmographics) | Formatted band or exact value. Sortable. |
| 4 | **Employees** | `account.employees` (HG firmographics) | Formatted band or exact value. Sortable. |
| 5 | **Why Now** | Derived from firing ranking signals + scoring dimensions for this offering | One-line summary of the top 1–2 reasons this account scores well *right now* (e.g., "Researching Wiz competitors · CISO hired in last 90 days"). Click → full provenance trail. |
| 6 | **Competitive Insights** | `account.installs[]` intersected with `offering.competitors[]` | Chips of competitor products the account currently runs (e.g., "Palo Alto Prisma Cloud · Lacework"). Hover → install age, region. Empty if no competitors installed. |
| 7 | **Complementary Tech** | `account.installs[]` intersected with `offering.complementaryTech[]` | Chips of complementary tech the account runs (e.g., "AWS · Kubernetes · Terraform"). Indicates readiness for the offering. |

**Why these columns specifically:** These are the questions every seller asks first — *who, how big, why now, what are they running today, are they ready for us?* By answering all five at-a-glance, the workbench eliminates the seller's #1 friction: opening 6 tabs to figure out if an account is worth a touch.

### 9.4 Intent-Based Query Engine (Enrichment)

The Workbench surfaces an **"Enrich workbook"** affordance (button or slash-prompt input in the table toolbar). This is the intent-based query engine — a natural-language interface to HG's data graph that returns **new columns** appended to the workbook.

#### 9.4.1 Capability

The query engine accepts plain-language requests and:

1. Interprets the request into a structured query against the HG data graph (firmographics, technographics, IT spend, intent topics, buyer activity, news/events, first-party CRM data if connected).
2. Resolves the query for every account in the current workbook view.
3. Returns a new column with the resolved values + a provenance chip per cell.

#### 9.4.2 Supported Query Categories (v1)

| Category | Example query | Resulting column |
|---|---|---|
| **Intent** | "Show which accounts are surging on Wiz CNAPP topics in the last 30 days" | `intent.cnapp_30d` — surge level chip (High · Medium · Low) + topic list |
| **Technographics** | "Add the cloud provider for each account" | `tech.cloud_provider` — chip (AWS / Azure / GCP / Multi) |
| **Technographics (age)** | "Show me how long they've had Palo Alto Prisma Cloud installed" | `tech.prisma_cloud_age` — months, with install date |
| **IT Spend** | "Add cloud security spend last 12 months" | `spend.cloud_security_12mo` — formatted $ value + YoY trend |
| **Buyer Activity** | "Flag any with recent TrustRadius activity on Wiz competitors" | `activity.competitor_trust_radius` — date + activity type chip |
| **News / Events** | "Flag any breach disclosures in the last 6 months" | `events.breach_6mo` — boolean + headline + date |
| **Hiring Signals** | "Show CISO or VP Security hires in the last 90 days" | `hiring.security_leader_90d` — name, title, hire date |
| **Compliance** | "Show which are SOC 2 / FedRAMP" | `compliance.frameworks` — chip list |
| **Custom (first-party)** | "Add their renewal date from Salesforce" | `crm.renewal_date` — if Salesforce is connected and field is exposed |

Queries can be combined ("Show intent surge AND recent CISO hires") and the engine returns multiple columns or a combined signal column.

#### 9.4.3 Functional Requirements

| ID | Requirement |
|---|---|
| F9.1 | Workbook table renders default columns (§9.3) on entry post-onboarding within 2 seconds for up to 5,000 accounts. |
| F9.2 | Offering lens switcher updates the table to show accounts scored for the selected offering. Switching takes ≤ 500ms (cached) or ≤ 3s (uncached). |
| F9.3 | Source toggle (Book / Whitespace / Both) is visible whenever a CRM is connected. |
| F9.4 | "Enrich workbook" input accepts plain-language queries up to 200 chars. |
| F9.5 | Query engine returns either a successful new column, a clarifying follow-up question, or a graceful "I can't answer that with the data we have" message. |
| F9.6 | Every enriched cell has a provenance chip — source, date last refreshed, link to underlying data point (e.g., "Intent · HG · 2026-06-08"). |
| F9.7 | Admin can pin enrichment columns to the default view (saves to a Saved View). |
| F9.8 | Admin can remove any enrichment column with a single click. |
| F9.9 | Enrichments are **non-destructive** — they layer on top of the base columns and persist per Saved View, not globally. |
| F9.10 | The query engine logs every query (text + resolved structured query + cells returned) for telemetry and prompt-quality improvement. |
| F9.11 | Queries against fields the tenant doesn't have access to (e.g., IT spend tier the tenant didn't license) return a clear "Upgrade required" affordance, not an error. |
| F9.12 | Bulk enrichment for 5,000 accounts on a single query completes within 30 seconds (target); 60 seconds (acceptable). |

#### 9.4.4 UX Requirements

- **Query entry** — single input in the workbook toolbar with placeholder hint cycling through example queries (e.g., "Show intent surge on Wiz CNAPP topics…").
- **Query result preview** — when the query resolves, show a preview card: "I'll add a column called *Intent · CNAPP 30d* with these values for your 312 accounts. Add it?" with Accept / Refine / Cancel.
- **Refine** — admin can edit the structured query before accepting (e.g., change the time window from 30d to 60d).
- **Column header** — newly enriched columns get a distinct header treatment: small "✨" marker + the source category color.
- **Cell provenance** — hovering a cell shows the underlying HG data point + last refresh date.
- **Query history** — a dropdown in the toolbar shows the admin's last 10 enrichment queries, re-applicable in one click.

#### 9.4.5 Data Model

```ts
WorkbookView {
  id: string
  tenantId: string
  ownerId: string
  name: string                              // "Default · Wiz CNAPP", or admin-named
  source: 'book' | 'whitespace' | 'both'
  offeringLens: string | 'all'              // offeringId or 'all'
  
  filters: {
    tiers?: Array<'A' | 'B' | 'C' | 'D'>
    industries?: string[]
    revenueBand?: { min: number, max: number }
    employeeBand?: { min: number, max: number }
    customFilters?: Array<EnrichmentFilter>
  }
  
  sort: { column: string, direction: 'asc' | 'desc' }
  
  baseColumns: Array<'account' | 'tier' | 'revenue' | 'employees' | 'why_now' | 'competitive_insights' | 'complementary_tech'>
  enrichmentColumns: Array<EnrichmentColumn>
  
  createdAt: ISODate
  updatedAt: ISODate
}

EnrichmentColumn {
  id: string                                // stable id, hashed from query
  query: string                             // original NL query
  structuredQuery: {                        // resolved query AST
    category: 'intent' | 'tech' | 'spend' | 'activity' | 'events' | 'hiring' | 'compliance' | 'crm' | 'custom'
    parameters: Record<string, any>
    timeWindow?: { value: number, unit: 'days' | 'months' }
  }
  columnHeader: string                      // human-readable, editable
  columnType: 'chip' | 'value' | 'date' | 'boolean' | 'list'
  cells: Array<{
    accountId: string
    value: any
    provenance: { source: string, refreshedAt: ISODate, dataPointId?: string }
    confidence: number
  }>
  refreshedAt: ISODate
  pinned: boolean
}

EnrichmentFilter {                          // when admin filters on an enrichment column
  columnId: string
  operator: 'equals' | 'contains' | 'gte' | 'lte' | 'in'
  value: any
}
```

#### 9.4.6 Why Now Column — Generation Logic

The **Why Now** column (§9.3 column 5) is special because it's a derived insight, not a raw field. Its generation logic:

1. Pull the account's firing ranking signals for the current offering lens (from existing `firingSignalsForAccount()` in `src/data/rankingSignals.js`).
2. Pull the top 3 contributing dimensions to the account's composite score (intent dimensions weighted higher when score > 50).
3. Pass these to a small LLM (or rule-based generator) that produces a one-line summary, max 80 chars.
4. Cache the result per (account, offering, model-version) tuple — refresh when underlying signals change.

Examples:
- "Surging on CNAPP intent (90/100) · Palo Alto Prisma Cloud installed 4 yrs"
- "CISO hired 2 mo ago · Fortune 500 · No DSPM detected"
- "Wiz competitor renewal coming · Multi-cloud · Compliance pressure"

#### 9.4.7 Acceptance Criteria

- [ ] Admin entering the workbench post-onboarding sees the default view in < 2s.
- [ ] All 7 default columns render with non-empty values for accounts that have the underlying data (graceful "—" for missing data).
- [ ] Offering lens switcher works and re-scores visible accounts to the selected offering.
- [ ] Source toggle works when CRM is connected; only Whitespace shows when not.
- [ ] "Enrich workbook" input accepts a query and returns a new column with provenance for each cell.
- [ ] Each of the 9 example query categories (§9.4.2) returns a sensible column.
- [ ] Admin can save the enriched view to a named Saved View.
- [ ] Admin can remove an enrichment column with a single click.
- [ ] Why Now column shows a meaningful one-liner for every A and B tier account.

### 9.5 Open Questions

1. Should the post-onboarding default view be **Whitespace** (this is the "we found accounts you didn't know about" magic) or **Both** (mixes book + whitespace, more pragmatic for daily use)?
2. Do we let admins **share** Saved Views with sellers from this surface, or is sharing a separate flow?
3. For the query engine — what's the right model? GPT-class for query interpretation; HG SQL generators for resolution. Latency budget?
4. When a query maps to data the tenant didn't license, do we silently degrade, surface an upsell, or return a partial result?
5. How do we handle queries that span 100K+ accounts (e.g., "show intent for all whitespace") — do we cap, paginate, or stream?
6. Should enrichment columns auto-refresh (daily / weekly)? Or only on explicit re-run?

---

## 10. Step 5 — Play Configuration

### 10.1 User Story

> *As a RevOps admin, after I've reviewed the scored workbook, I want to configure the **Plays** my sellers will run — Competitive Takeout, Net New Logo, Expansion, Renewal Defense, etc. The platform proposes Plays based on the offerings I confirmed, composes each from first-party (CRM) and third-party (HG intent + technographic) signals, and recommends actions. I review, edit signal weights if needed, and activate.*

### 10.2 Concept Recap (Plays vs Signals)

- **Play** = a business motion (Competitive Takeout, Net New Logo, Expansion, Renewal Defense, High-Intent Active Buyer, Catalyst Event, etc.).
- **Signal** = an atomic, weighted, evaluable primitive that ranks accounts within a play (e.g., "Intent surge on competitor", "Recent CISO hire", "Renewal in next 90 days").
- A Play **composes 3–7 signals** with weights. Account rank within a play = weighted sum of firing signals.
- Each Play has **recommended actions** — the seller-facing next step when an account ranks high (e.g., "Send displacement email", "Trigger competitive teardown workflow", "Schedule discovery call").

This is the architecture already implemented in the prototype (`src/data/plays.js`, `src/data/rankingSignals.js`, `src/data/playEvaluator.js`). Onboarding only configures and activates them; the runtime evaluator is unchanged.

### 10.3 1P vs 3P Signal Composition

Each Play draws signals from two pools:

#### First-Party (1P) Signals — from connected CRM
- CRM stage / amount / forecast category (after Salesforce or HubSpot is connected in Step 6)
- Last activity date (no touch in N days)
- Opportunity status (open / closed-lost / no-opp)
- Renewal date proximity
- Owner / segment / region
- Custom CRM fields (mapped during integration setup)

> Note: 1P signals require Step 6 integrations to be live. Onboarding handles this dependency by allowing admins to **configure Plays with only 3P signals** initially and **enable 1P signals when integrations connect**.

#### Third-Party (3P) Signals — from HG data
- Intent surge on offering / category / competitor topics
- Recent install / removal of competitor product
- Recent install of complementary tech
- IT spend trend (YoY change)
- Hiring signals (CISO, VP Cloud Security, etc.)
- News events (breaches, funding, acquisitions, leadership change)
- TrustRadius buyer activity

### 10.4 AI-Proposed Plays

On entering Step 5, the platform proposes **3–5 Plays** by default, tailored to the tenant's offerings. Proposal logic:

1. Map offerings to canonical play templates (Competitive Takeout — needs competitors; Net New Logo — needs target ICP; Expansion — needs CRM connected; Renewal Defense — needs CRM + renewal date; High-Intent Active Buyer — universal; Catalyst Event — universal).
2. For each canonical Play that maps to ≥1 offering, instantiate it with **offering-specific signal inputs** (e.g., Competitive Takeout pulls competitor list from offering.competitors[]).
3. Pre-set weights using DC defaults (Intent surge highest weight when present, recent install signals next, firmographic baseline last).
4. Generate recommended actions per play from a template library (e.g., Competitive Takeout → "Run displacement email workflow with competitor teardown").
5. Surface to admin with grouping rationale: *"We proposed Competitive Takeout because all 3 offerings have named competitors and we found N accounts running them."*

### 10.5 Per-Play Attributes

| Field | Source | Editable? |
|---|---|---|
| `name` | Canonical name or AI-suggested | Yes |
| `motion` | Categorical (Competitive · Net New · Expansion · Renewal · Active Buyer · Event) | Yes |
| `offerings[]` | Which offerings this play applies to (1 to all) | Yes |
| `signals[]` | Composed signal IDs with weights | Yes (add/remove/reweight) |
| `recommendedActions[]` | Templates: brief, email, workflow, contact discovery, business case | Yes |
| `audience` | Persona filter — AE only · CSM only · Both | Yes |
| `state` | `draft` · `proposed` · `active` · `paused` | Toggled by admin |
| `pinnedForPersonas[]` | Personas that see this play pinned on their home | Yes |

### 10.6 Functional Requirements

| ID | Requirement |
|---|---|
| F10.1 | On entering Step 5, system proposes 3–5 Plays based on confirmed offerings (§10.4). |
| F10.2 | Each proposed Play composes 3–7 signals with default weights. |
| F10.3 | Each signal is labeled as 1P or 3P, with a "Requires integration" badge for 1P signals if relevant integration is not yet connected. |
| F10.4 | Admin can add/remove signals from a Play, drag-to-reweight, and preview rank impact on the current workbook. |
| F10.5 | Admin can add a new Play (from a template library) or build from scratch. |
| F10.6 | Each Play surfaces **recommended actions** with a default action template; admin can edit text or attach to a workflow. |
| F10.7 | Admin sets each Play's **audience** (AE / CSM / Both) and **persona pin defaults**. |
| F10.8 | Admin must activate at least 1 Play to complete Step 5 (the rest can remain in `draft`). |
| F10.9 | Plays that depend on 1P signals can be **activated** but show "Awaiting integration" badge until Step 6 completes. |
| F10.10 | All Plays persist with version history; toggling state (active / paused) is audited. |
| F10.11 | Live preview — selecting a Play in the configurator shows the top 20 ranked accounts from the current workbook with their firing signals visible. |
| F10.12 | Play evaluation reuses the runtime evaluator in `src/data/playEvaluator.js` — no separate scoring pathway during onboarding. |

### 10.7 UX Requirements

- **Initial state** — three to five Play cards laid out as a vertical list. Each shows: name, motion chip, count of matched accounts (across all offerings), composing signals as chips, recommended actions.
- **Play detail drawer** — clicking a Play opens a right-side drawer with the full configurator: signals list with weight sliders, recommended actions, audience + pinning, live ranked preview.
- **Signal palette** — when editing signals, a left rail shows all available 1P + 3P signals grouped by category. Drag a signal in / out.
- **Weight visualization** — small bar next to each signal shows its weight as % of total. Total weights normalize to 100%.
- **Integration dependency** — 1P signals show an amber "Connect HubSpot/Salesforce in Step 6 to enable" badge if integration isn't live yet.
- **Activation confirmation** — toggling a Play to `active` shows a confirmation: "This Play will be visible to N sellers on their home. Continue?"
- **Skip option** — admin can skip activating Plays during onboarding and revisit from the Workbench. Default Plays remain in `proposed` state.

### 10.8 Data Model

```ts
Play {
  id: string
  tenantId: string
  name: string
  motion: 'competitive_takeout' | 'net_new_logo' | 'expansion' | 'renewal_defense' | 'active_buyer' | 'catalyst_event' | 'custom'
  description: string
  state: 'draft' | 'proposed' | 'active' | 'paused'
  
  offerings: string[]                       // offeringIds this play applies to
  
  signals: Array<{
    signalId: string                        // refs rankingSignals.js
    kind: '1p' | '3p'
    weight: number                          // 0-100
    required: boolean                       // if true, account must fire this signal to enter ranking
  }>
  
  recommendedActions: Array<{
    type: 'brief' | 'email' | 'workflow' | 'contact_discovery' | 'business_case' | 'custom'
    label: string                           // e.g., "Run displacement email workflow"
    workflowId?: string                     // optional ref to a workflow template
    promptTemplate?: string                 // optional prompt for AI-generated artifacts
  }>
  
  audience: 'ae' | 'csm' | 'both'
  pinnedForPersonas: string[]               // persona ids
  
  createdAt: ISODate
  activatedAt: ISODate | null
  version: number
  auditLog: Array<{ field: string, action: string, by: string, at: ISODate }>
}
```

### 10.9 Acceptance Criteria

- [ ] On entering Step 5, 3–5 Plays appear pre-populated for the tenant's offerings.
- [ ] Each Play shows its composing 1P + 3P signals with default weights.
- [ ] Live preview shows top 20 ranked accounts per Play from the current workbook.
- [ ] Admin can add/remove/reweight signals; preview updates within 1s.
- [ ] Admin can activate, pause, or save-as-draft any Play.
- [ ] Plays requiring 1P signals show "Awaiting integration" until Step 6 connects.
- [ ] Admin can complete Step 5 with at least 1 active Play.
- [ ] Activated Plays are immediately visible to invited sellers (after Step 6).

### 10.10 Open Questions

1. Should we allow admins to **fork** a canonical Play into multiple offering-specific variants, or keep Plays multi-offering by default?
2. How aggressive should "Awaiting integration" gating be — block Play activation entirely, or allow soft-activation with reduced ranking?
3. Recommended actions should they fire automatically (e.g., generate the brief on Play match) or stay manual (seller initiates)?
4. Do we cap the number of Plays an admin can activate during onboarding, or allow all?
5. How do we handle signal weight changes post-onboarding — does it create a new Play version (analyst-style versioning) or live-mutate?

---

## 11. Step 6 — Integrations Setup

### 11.1 User Story

> *As a RevOps admin, I want to connect my CRM, my marketing automation tool, and my team's Slack so the workbench can pull first-party data, sync enriched accounts back, and notify sellers when Plays match. I want to know exactly what data each integration accesses, what scopes it requests, and which agents can write back.*

### 11.2 Integrations Supported (v1)

| Integration | Type | Direction | Primary purpose |
|---|---|---|---|
| **Salesforce** | CRM | Bi-directional | Book of accounts, opportunities, contacts, custom fields. Sync enriched accounts and scoring tiers back. Agent write-back scopes (create/update accounts, contacts, opportunities). |
| **HubSpot** | CRM | Bi-directional | Same as Salesforce, for HubSpot-native tenants. Companies, deals, contacts, custom properties. |
| **Slack** | Notification + Light Read | Outbound + light inbound | Post Play matches, daily digest, scoring alerts to channels or DMs. Optionally read public channels for sentiment / signal capture (v2). |

Future integrations (v2+, **not in onboarding scope for v1**): Gong, Salesloft, Outreach, Zoominfo, Clay, NetSuite, Marketo, MS Dynamics, Vitally.

### 11.3 Per-Integration Setup Flow

#### A. Salesforce

The Salesforce integration is the **most permission-rich** integration in v1. It must cover the full read/write loop so the workbench can pull the book of accounts AND push enriched data, contacts, and agent-driven actions back into Salesforce.

1. **Connect** — OAuth flow. Admin selects sandbox vs production.
2. **Object scope** — admin selects which Salesforce objects to sync:
   - **Accounts** (always required, read + write)
   - **Contacts** (read + write — required for contact discovery + export)
   - **Leads** (read + write — required for inbound conversion flows)
   - **Opportunities** (read + write — required for stage/amount visibility + agent updates)
   - **Tasks / Activities** (write — required for logging agent actions like emails sent, calls scheduled)
   - **Notes** (write — required for posting agent-generated briefs)
   - **Campaigns** (read — optional, used to attribute Play impact)
   - **Users / Roles / Territories** (read — required to map sellers to their book in Step 7)
3. **Field mapping** — system auto-maps standard fields (Account → Company, Contact → Person, Opportunity → Deal). Admin reviews and approves any custom field mapping (e.g., `Account.HG_Tier__c`, `Account.HG_Why_Now__c`, `Account.HG_Last_Enriched_At__c`).
4. **Sync direction per object** — read-only, write-only, or bi-directional. Sensible defaults:
   - Accounts: bi-directional
   - Contacts: bi-directional (enriched contacts written back; existing contacts read)
   - Leads: bi-directional
   - Opportunities: read primary; write only via explicit agent scope
   - Tasks / Notes: write-only (we log; we don't ingest)
   - Users / Territories: read-only
5. **Required OAuth scopes** — Salesforce-side scopes the OAuth app requests (the **tenant's IT may need to approve**):
   - `api` — read/write access to standard + custom objects
   - `refresh_token, offline_access` — long-lived sessions
   - `chatter_api` — optional, for posting to Chatter feeds (v2)
   - `lightning, content` — optional, for embedding workbench actions inside Lightning UI (v2)
6. **Agent write-back scopes** — admin grants per-scope permission to AI agents. Each scope is **off by default**. Categories:

   | Scope | What it allows |
   |---|---|
   | `crm.account.create` | Agents may create new Account records (e.g., add whitespace to book) |
   | `crm.account.update` | Agents may update Account fields (e.g., write HG tier, intent score) |
   | `crm.contact.create` | Agents may export discovered contacts as new Contacts |
   | `crm.contact.update` | Agents may enrich existing Contact records (title, dept, last activity) |
   | `crm.lead.create` | Agents may push new whitespace as Leads |
   | `crm.lead.update` | Agents may enrich existing Lead records |
   | `crm.opportunity.update` | Agents may update Opportunity fields (next step, notes) |
   | `crm.task.create` | Agents may log Tasks (calls, emails, meetings) |
   | `crm.note.create` | Agents may post Notes (briefs, business cases) |
   | `crm.campaign.member.add` | Agents may add contacts to campaigns (Play-driven campaigns) |
   | `crm.bulk.export.accounts` | Bulk export of enriched accounts (full book) |
   | `crm.bulk.export.contacts` | Bulk export of discovered/enriched contacts |
   | `crm.bulk.import.scores` | Bulk import of scoring tiers / Why-Now / intent into Account custom fields |

7. **Test sync** — system runs:
   - A single-account read round-trip
   - A test write to a designated "RGI Test Account" (if admin enables write scopes)
   - A bulk read of N accounts to verify pagination + rate limits
8. **Initial bulk pull** — once verified, system pulls the full Account + Contact + Opportunity universe (capped at a sensible batch, with progress indicator). On completion, fire the integration-complete notification (§11.4a).

#### B. HubSpot

Mirrors the Salesforce permission set, mapped to HubSpot's object model:

1. **Connect** — OAuth.
2. **Object scope** — Companies, Contacts, Deals, Tickets (optional), Tasks/Engagements, Lists, Owners.
3. **Field mapping** — Companies, Deals, Contacts, custom properties. Same auto-map + review pattern as Salesforce.
4. **Sync direction per object** — same defaults as Salesforce.
5. **Required OAuth scopes** — `crm.objects.companies.read/write`, `crm.objects.contacts.read/write`, `crm.objects.deals.read/write`, `crm.lists.read/write`, `crm.schemas.companies.read`, `crm.schemas.contacts.read`, `crm.schemas.deals.read`, `crm.objects.owners.read`.
6. **Agent write-back scopes** — same shape as Salesforce, HubSpot-named:

   | Scope | What it allows |
   |---|---|
   | `crm.company.create/update` | Create/enrich Company records |
   | `crm.contact.create/update` | Create/enrich Contact records |
   | `crm.deal.create/update` | Create/update Deal records |
   | `crm.engagement.create` | Log emails, calls, meetings as Engagements |
   | `crm.note.create` | Post Notes (briefs, business cases) on Companies/Deals |
   | `crm.list.add_member` | Add Contacts to Active Lists for Play-driven campaigns |
   | `crm.bulk.export.companies` | Bulk export enriched Companies |
   | `crm.bulk.export.contacts` | Bulk export enriched Contacts |
   | `crm.bulk.import.scores` | Bulk import scoring tiers / Why-Now into Company properties |

7. **Test sync** — same shape as Salesforce.
8. **Initial bulk pull** — same shape as Salesforce; fires the integration-complete notification on finish.

> Salesforce **or** HubSpot — admins typically connect one, not both. If both are connected, admin picks the **primary CRM** (drives book-of-accounts source). Secondary CRM is read-only.

#### C. Slack
1. **Connect** — OAuth via Slack app install. Admin selects the workspace.
2. **Channel selection** — admin selects which channels to post into. Three categories:
   - **Play match alerts** — post when an account hits a Play threshold (per Play; admin chooses channel + frequency).
   - **Daily digest** — top accounts to action today (per seller, in DM; or per team in a channel).
   - **Critical events** — breaches, leadership change, intent surge spikes.
3. **DM permissions** — admin grants permission for the platform to DM individual sellers (opt-in by seller is still required).
4. **Read scope (optional v1, v2 default)** — admin can grant read access to selected public channels for sentiment / signal capture. Off by default. Always opt-in.
5. **Test post** — sends a test message to selected channel.

### 11.4 Integration Complete — Notification & Handoff

Once a CRM integration finishes its initial bulk pull and the data is available in the workbench, the system **notifies the admin** and gates the next step (Step 7 — Add Sellers).

#### 11.4.1 Trigger Conditions

The integration-complete notification fires when **all** of the following are true for a CRM integration (Salesforce or HubSpot):

- OAuth connection is active and credentials validate
- All selected object scopes have completed at least one full sync
- Initial bulk pull is finished (Accounts + Contacts + Opportunities/Deals + Users/Owners)
- Test sync round-trip passed
- Agent write-back scopes are saved (whether enabled or not — admin made an explicit choice)

For Slack, the notification fires when OAuth is active and the test post landed.

#### 11.4.2 Notification Channels

The notification is delivered on **multiple channels in parallel** so the admin cannot miss it:

| Channel | Content | Timing |
|---|---|---|
| **In-app toast + banner** | "Salesforce integration complete. 12,847 accounts, 38,210 contacts, 4,102 opportunities synced. Ready to add sellers." Includes CTA "Add Sellers →". | Immediate when bulk pull completes. Banner persists until dismissed. |
| **Email to admin** | Subject: "Your RGI Workbench is connected to Salesforce". Body lists synced object counts, enabled agent scopes, link to integration health page, CTA to add sellers. | Within 5 min of completion. |
| **Slack DM to admin** | If Slack is also connected, a DM lands in the admin's Slack with the same content as the in-app banner. | Within 5 min of completion. |
| **Audit log entry** | `integration.completed` event with full object/scope summary. Visible on the Integration Health page. | Immediate. |

#### 11.4.3 What the Notification Confirms (Explicit Capability Summary)

The notification's body **enumerates what the integration enables** so the admin has a clear permissions ledger:

- ✓ Read accounts, contacts, leads, opportunities from CRM
- ✓ Write enriched accounts back to CRM (if `crm.account.update` enabled)
- ✓ Export discovered contacts to CRM (if `crm.contact.create` enabled)
- ✓ Push whitespace as new accounts or leads (if `crm.account.create` or `crm.lead.create` enabled)
- ✓ Log agent actions as tasks/notes (if `crm.task.create` or `crm.note.create` enabled)
- ✓ Bulk export/import scoring tiers and Why-Now (if `crm.bulk.*` enabled)
- ✓ Add contacts to campaigns / lists for Play-driven outreach (if `crm.campaign.member.add` / `crm.list.add_member` enabled)

Each capability is listed with status (Enabled / Disabled) and a one-click jump to scope management. The intent: the admin sees, in one screen, exactly what the platform can do on their behalf.

#### 11.4.4 Gating — Add Sellers Unlocks

The **Add Sellers** step (§12, Step 7) is gated behind at least one CRM integration completing. Rationale:

- Sellers need a book — the book lives in the CRM
- Without CRM, we cannot map sellers to their territories (Salesforce Users + Territory Management, or HubSpot Owners)
- Slack-only integrations don't unlock Step 7 (Slack is a notification channel, not a source of truth for territories)

If the admin completed Steps 1–6 without connecting a CRM, the workbench is fully usable in whitespace-only mode but Step 7 stays locked with a CTA "Connect a CRM to invite sellers".

#### 11.4.5 Functional Requirements (Notification)

| ID | Requirement |
|---|---|
| F11.14 | Integration-complete notification fires within 5 min of bulk pull completion. |
| F11.15 | Notification is delivered on all configured channels (in-app + email + Slack DM if connected). |
| F11.16 | Notification body enumerates synced object counts (accounts, contacts, opportunities) with exact numbers. |
| F11.17 | Notification lists every enabled agent scope and every available-but-disabled scope, with one-click toggle. |
| F11.18 | Step 7 (Add Sellers) unlocks immediately after first CRM integration completes. |
| F11.19 | If bulk pull fails mid-sync, admin gets a `integration.sync_failed` notification with diagnostic + retry CTA. |
| F11.20 | Notification + capability summary persists on the Integration Health page indefinitely (admin can re-read at any time). |

### 11.5 Functional Requirements

| ID | Requirement |
|---|---|
| F11.1 | Step 6 supports Salesforce, HubSpot, Slack OAuth flows. |
| F11.2 | Admin can connect 0, 1, or all 3 integrations and proceed to Workbench. **Onboarding does not require any integration to complete** (graceful path: tenant uses whitespace-only mode until CRM connects). |
| F11.3 | Field mapping UI auto-suggests mappings with confidence; admin reviews + approves. |
| F11.4 | Custom fields require explicit admin approval. |
| F11.5 | Each agent write-back scope is **off by default**. Admin must explicitly enable each scope. |
| F11.6 | All scope changes write to the existing **agent-access audit log** (already implemented). |
| F11.7 | Test sync round-trip must pass before integration is marked `active`. |
| F11.8 | Slack channel posts are throttled per channel (max 1 message per minute per channel) to prevent noise. |
| F11.9 | Integration credentials are stored encrypted; tokens refresh automatically. Refresh failures notify the admin within 24h. |
| F11.10 | Disconnect is one-click and reversible (creds revoked, sync paused, data retained). |
| F11.11 | Each integration exposes a **health page** showing last sync time, last error, # records synced today. |
| F11.12 | Onboarding Step 5 (Plays) re-evaluates 1P signals immediately when Salesforce or HubSpot connects — admin sees Play match counts update live. |
| F11.13 | Slack channel writes for Play matches respect the audience configured in §10.5 (e.g., AE-only Plays post only to AE channels). |

### 11.6 UX Requirements

- **Initial state** — three integration tiles (Salesforce, HubSpot, Slack) with status: Not connected / Connected / Needs attention.
- **Tile detail** — clicking opens a setup wizard for that integration (steps above). Wizard supports save-and-resume.
- **Scope grant view** — for CRM integrations, scopes are listed with descriptions: "Allow agents to update Account records" — toggle on/off. Read scopes vs write scopes are visually grouped.
- **Test sync result** — green check + summary of what synced (or red error + diagnostic).
- **Slack channel picker** — autocomplete from the workspace's channel list, with channel type indicator (public / private / DM).
- **Skip path** — "Skip for now" button on each integration tile. Admin can complete onboarding without integrations and revisit any time.
- **Live re-evaluation** — when CRM connects mid-onboarding, a toast appears: "Connected. Re-evaluating 4 Plays with 1P signals…" and Play match counts refresh.

### 11.7 Data Model

```ts
Integration {
  id: string
  tenantId: string
  provider: 'salesforce' | 'hubspot' | 'slack'
  status: 'pending' | 'connected' | 'error' | 'disconnected'
  
  credentials: {
    encryptedTokenRef: string               // pointer to vault, never store raw
    refreshTokenRef: string | null
    expiresAt: ISODate | null
    environment?: 'sandbox' | 'production'  // Salesforce-specific
    workspaceId?: string                    // Slack-specific
    portalId?: string                       // HubSpot-specific
  }
  
  // CRM-specific
  fieldMappings?: Array<{
    sourceField: string                     // e.g., 'Account.Name'
    targetField: string                     // e.g., 'rgi.company.name'
    direction: 'read' | 'write' | 'both'
    custom: boolean
  }>
  
  objectScopes?: Array<{
    objectName: string                      // 'Account', 'Contact', 'Opportunity'
    direction: 'read' | 'write' | 'both'
    enabled: boolean
  }>
  
  agentScopes?: Array<{
    scope: string                           // e.g., 'crm.account.update'
    enabled: boolean
    enabledBy: string                       // admin user id
    enabledAt: ISODate
  }>
  
  // Slack-specific
  channelConfig?: {
    playMatchChannels: Array<{ playId: string, channelId: string, frequency: 'realtime' | 'hourly' | 'daily' }>
    digestChannel: { channelId: string | null, schedule: string }
    criticalEventsChannel: string | null
    dmEnabledFor: string[]                  // seller user ids who opted in
    readChannels: string[]                  // for sentiment capture (v2)
  }
  
  lastSyncAt: ISODate | null
  lastError: { message: string, at: ISODate } | null
  
  connectedAt: ISODate
  connectedBy: string
  auditLog: Array<{ action: string, by: string, at: ISODate, payload?: any }>
}
```

### 11.8 Acceptance Criteria

- [ ] Admin can connect Salesforce via OAuth from Step 6.
- [ ] Admin can connect HubSpot via OAuth from Step 6.
- [ ] Admin can connect Slack via OAuth from Step 6.
- [ ] Admin can complete onboarding without connecting any integration (graceful path).
- [ ] All agent write-back scopes default to off and require explicit toggle.
- [ ] Field mapping UI surfaces auto-suggestions and admin can approve / edit.
- [ ] Test sync passes before integration becomes `active`.
- [ ] Slack test post lands in the chosen channel.
- [ ] Audit log captures every connect, disconnect, scope change.
- [ ] Connecting CRM mid-onboarding re-evaluates 1P signals on existing Plays within 30s.

### 11.9 Open Questions

1. If a tenant has **both** Salesforce and HubSpot (some Mid-market companies in transition), how do we handle book-of-accounts source-of-truth? (Recommend: admin picks primary CRM; secondary becomes read-only for enrichment context.)
2. Slack DMs — do we require per-seller opt-in, or admin grants on behalf? (Recommend: admin grants, but seller can opt out from their own settings.)
3. For Salesforce sandbox connections during onboarding — do we allow promoting to production with one click, or require re-connect?
4. How do we handle SSO orgs where the admin doesn't have OAuth permission to connect CRM? Surface "Need IT approval" flow with email template to send to IT?
5. What's the right cadence for Slack daily digest defaults — start-of-day, mid-morning, customizable per seller?
6. Initial bulk-pull size cap — what's the right page-size + concurrency for large tenants (100K+ accounts) without hitting Salesforce/HubSpot rate limits?
7. Do we surface the integration-complete summary as a one-time modal admin must acknowledge, or as a dismissible banner?

---

## 12. Step 7 — Configure Teams

### 12.1 User Story

> *As a RevOps admin, after my offerings, scoring models, Plays, and CRM are set up, I want to organize my sellers into Teams. Each team has its own focus — which offerings they sell, which scoring profile ranks their book, which Plays they default to. A seller's experience is shaped by the team they belong to, so getting Teams right means every seller lands in a workbench that fits their motion.*

### 12.2 Why Teams Are a First-Class Construct

Sellers are not interchangeable. A Mid-Market AE selling CNAPP has a different book, different competitors, and different Plays than an Enterprise AE selling the full Wiz platform. Without Teams, every seller would inherit the tenant-wide defaults — too coarse to be useful.

Teams provide the **inheritance layer** between tenant-level configuration and per-seller configuration:

```
Tenant
  └── Offerings + Scoring Models + Plays (configured in Steps 2–5)
        └── Team (subset of offerings + chosen scoring profile + pinned Plays)
              └── Seller (inherits Team config; can override per-account)
```

When a seller logs in, their workbench is **pre-filtered** to their team's offerings, **pre-scored** with their team's scoring profile, and **pre-loaded** with their team's pinned Plays.

### 12.3 Trigger

Step 7 unlocks after Step 5 (Plays) is complete. CRM integration (Step 6) is **not** required — admins can configure Teams before connecting CRM, though seller assignment in Step 8 will be locked until Step 6 completes.

### 12.4 Per-Team Attributes

| Field | Source | Editable? |
|---|---|---|
| `name` | Admin-entered | Yes (e.g., "Enterprise West", "Mid-Market AMER", "Healthcare Vertical") |
| `description` | Admin-entered | Yes (optional) |
| `offerings[]` | Admin selects from configured offerings (Step 2). 1 or more. | Yes |
| `scoringProfile` | Admin selects which scoring profile to apply for this team's book | Yes |
| `defaultPlays[]` | Admin selects from active Plays (Step 5) — these become the team's pinned Plays for all sellers | Yes |
| `audience` | Categorical: `AE` · `AM` · `CSM` · `BDR/SDR` · `Mixed` | Yes |
| `territory` | Optional — CRM territory(ies) that map to this team (drives auto-seller-suggestion in Step 8) | Yes |
| `bookSource` | `whitespace_only` (no CRM) · `book_and_whitespace` (CRM connected) | Auto-set based on CRM status; admin can override |
| `managerId` | Optional — RGI user id of the team's manager | Yes |

### 12.5 Scoring Profile per Team

A **Scoring Profile** is one of the scoring models confirmed in Step 3. By default, each offering has its own model. The Team picks:

- **Primary scoring profile** — the model that drives the default Tier column shown to sellers in this team
- If the team has multiple offerings, the admin picks which offering's scoring profile is primary; the others are accessible via the offering lens switcher

This is why **Teams are scoped to offerings** — the scoring profile only makes sense in the context of the offerings the team sells.

### 12.6 Functional Requirements

| ID | Requirement |
|---|---|
| F12.1 | Step 7 unlocks after Step 5 (Plays) is confirmed. |
| F12.2 | Admin can create unlimited teams (no cap during onboarding). Reasonable default: 1–10 teams covers most tenants. |
| F12.3 | System proposes 1 default team ("All Sellers") pre-populated with all offerings + the most-active scoring profile + all active Plays. Admin can keep, edit, or delete. |
| F12.4 | If the tenant has multiple offerings with distinct ICPs (e.g., Wiz CNAPP for Enterprise + Wiz CIEM for Mid-Market), system suggests **one team per offering** as a starter. |
| F12.5 | Each team must have ≥1 offering and exactly 1 primary scoring profile to be `active`. |
| F12.6 | Admin can clone a team (useful for territory-based variants — clone "Enterprise West" → "Enterprise East"). |
| F12.7 | Admin can delete a team only if no sellers are assigned to it. Otherwise, force-reassign sellers first. |
| F12.8 | Changes to a team's offerings/Plays propagate to all assigned sellers in real time (their workbench updates on next refresh). |
| F12.9 | Team configuration persists with version history. |
| F12.10 | Live preview — selecting a team shows the count of accounts that match its offerings (across all whitespace + book) and the count of A/B tier accounts under its scoring profile. |

### 12.7 UX Requirements

- **Initial state** — admin sees a list of suggested teams (1 default or 1-per-offering, based on §12.3 logic). Each team card shows: name, # offerings, # Plays, scoring profile, audience chip, estimated book size.
- **Team card** — collapsed view: name + key stats. Expanded view: full editor (offerings checklist, scoring profile picker, Plays checklist, audience picker, optional territory + manager).
- **Offering picker** — multi-select chips from configured offerings.
- **Scoring profile picker** — radio-select from available scoring models (one per offering by default). Preview shows "This profile scores 12,847 accounts with 287 A-tier, 1,109 B-tier" for transparency.
- **Plays checklist** — list of active Plays with toggle-on/off. Default = all Plays whose audience matches the team's audience. Visual indicator if a Play depends on a 1P signal and CRM isn't connected yet.
- **Clone affordance** — "Duplicate team" button next to each team for territory-variant patterns.
- **Add team** — empty card at end of list with "+ New team" button → opens blank editor.
- **Confirmation** — admin must mark each team as `active` (or delete it) before proceeding to Step 8. Inactive teams are draft-only.

### 12.8 Data Model

```ts
Team {
  id: string
  tenantId: string
  name: string
  description: string
  status: 'draft' | 'active' | 'archived'
  
  offerings: string[]                       // offeringIds; ≥1 required
  primaryScoringProfileId: string           // scoringModelId from §8
  scoringProfileFallbacks: string[]         // additional models accessible via lens switcher
  
  defaultPlays: string[]                    // playIds; inherited by all sellers in this team
  audience: 'ae' | 'am' | 'csm' | 'bdr_sdr' | 'mixed'
  
  territoryHints: Array<{ source: 'salesforce' | 'hubspot' | 'manual', value: string }>
  bookSource: 'whitespace_only' | 'book_and_whitespace'
  
  managerId: string | null
  sellerIds: string[]                       // populated in Step 8
  
  createdAt: ISODate
  createdBy: string
  activatedAt: ISODate | null
  version: number
  auditLog: Array<{ field: string, action: string, by: string, at: ISODate }>
}
```

### 12.9 Acceptance Criteria

- [ ] Admin enters Step 7 and sees 1+ proposed Teams pre-populated.
- [ ] Admin can create, edit, clone, delete, and activate Teams.
- [ ] Each Team has ≥1 offering, exactly 1 primary scoring profile, ≥1 default Play.
- [ ] Preview shows realistic book size + A/B tier counts per team.
- [ ] Admin must activate at least 1 Team before proceeding to Step 8.
- [ ] Changing a Team's offerings/Plays propagates to assigned sellers without manual refresh.
- [ ] Audit log captures Team create / edit / activate / delete actions.

### 12.10 Open Questions

1. Should we allow a seller to belong to **multiple teams** (e.g., a hybrid AE/CSM)? Recommend: v1 = single team per seller; v2 = multi-team with primary designation.
2. Are there pre-built **team templates** (Enterprise / Mid-Market / SMB / Vertical-X) we should ship to accelerate config?
3. For tenants with no clear team structure (small startups with 3 sellers), is the default "All Sellers" team friction-free enough?
4. How do team-level Play customizations interact with seller-level Play pinning (does seller override take precedence)?
5. Do team managers get an admin-lite role to manage their team's offerings/Plays/sellers, or stay read-only?

---

## 13. Step 8 — Configure Agents (Seller-Facing AI Capabilities)

### 13.1 User Story

> *As a RevOps admin, before I invite my sellers, I want to decide which AI agents they can use in the Sales Copilot. Some agents are core (Account Brief, Email Outreach), others are powerful but situational (Opportunity Finder, Find More Contacts). I want to enable them at the Team level so sellers in different motions get the right toolset — and I want the ability to override per-seller for special cases. Agents I enable show up in the seller's account view as one-click affordances.*

### 13.2 Why Agent Configuration is a Distinct Step

Agents are **executable capabilities** — not data, not configuration. They take seller intent + account context and produce artifacts (briefs, emails, contact lists, opportunity suggestions). They:

- Consume API budget (LLM calls, web searches, CRM writes)
- Require permission scopes (some write to CRM; some only read)
- Vary in trust profile (brief generation is low-risk; auto-send email is high-risk)
- Need to be discoverable in the seller UI

Treating agent visibility as a first-class configuration step lets RevOps:
- Control cost (only enable expensive agents for premium teams)
- Control risk (only enable write-back agents after the team is trained)
- Control discoverability (avoid overwhelming new sellers with 10+ options)

### 13.3 Available Agents (v1)

Four seller-facing agents ship in v1. Each appears in the seller's **Account view** as a callable action when enabled.

#### A. Account Brief Agent
- **Purpose:** Generates a multi-section briefing on an account — firmographics, tech stack, intent signals, news, suggested talk track, recommended next step.
- **Inputs:** Account ID + offering lens + (optional) Play context.
- **Outputs:** Markdown-rendered brief (saved to the account; optionally exported to CRM as a Note).
- **Permission scopes required:**
  - `agent.brief.generate` (always required)
  - `crm.note.create` (optional — to export brief to CRM as a Note)
- **Cost profile:** 1 LLM call + 1–2 web fetches. ~$0.05 per brief.
- **Default visibility:** Enabled for all sellers.

#### B. Email Outreach Agent
- **Purpose:** Drafts personalized outreach emails — cold first-touch, follow-up, competitive displacement, expansion pitch. Uses account context + offering pain points + intent signals.
- **Inputs:** Account ID + email type (cold / follow-up / displacement / expansion) + optional Play context + optional contact target.
- **Outputs:** Drafted email (subject + body). Seller reviews and approves before send. **Optional auto-send** if the appropriate scope is granted.
- **Permission scopes required:**
  - `agent.email.draft` (always required)
  - `agent.email.send_via_provider` (optional — to send via connected email provider; v2 may add Gmail/Outlook integrations)
  - `crm.task.create` (optional — to log the outreach as a Task)
- **Cost profile:** 1 LLM call. ~$0.02 per draft.
- **Default visibility:** Enabled for AE and BDR audiences; off for CSM.

#### C. Opportunity Finder Agent
- **Purpose:** Scans an account (or a list of accounts) for **opportunity signals** — recent intent surges, competitive removals, leadership change, funding events, expansion within existing customer base. Returns ranked opportunity hypotheses with evidence.
- **Inputs:** Account ID (or list) + offering lens + (optional) time window.
- **Outputs:** List of opportunity hypotheses, each with a "why now" narrative, evidence chips (intent surge / install change / news / etc.), recommended action (brief, email, demo request).
- **Permission scopes required:**
  - `agent.opportunity.scan` (always required)
  - `crm.opportunity.update` (optional — to update CRM Opportunity Next Step from agent suggestion)
- **Cost profile:** 1–2 LLM calls + multiple data lookups. ~$0.10 per scan.
- **Default visibility:** Enabled for AE; default off for CSM, BDR (configurable).

#### D. Find More Contacts Agent
- **Purpose:** Discovers additional buying-committee contacts for an account — by title, function, seniority — that aren't already in the seller's CRM. Surfaces from HG's contact graph or via web (LinkedIn-style public sources).
- **Inputs:** Account ID + target persona profile (title patterns, seniority) + (optional) count to return.
- **Outputs:** Ranked contact list with name, title, email confidence, LinkedIn URL (if available), suggested outreach order.
- **Permission scopes required:**
  - `agent.contacts.discover` (always required)
  - `crm.contact.create` (optional — to export discovered contacts as new CRM Contact records)
- **Cost profile:** 1 LLM call + contact-graph lookup. ~$0.08 per discovery run.
- **Default visibility:** Enabled for AE and BDR; off for CSM.

### 13.4 Configuration Granularity

| Level | What's configured | When to use |
|---|---|---|
| **Tenant defaults** | Which agents are even available to be enabled. Admin can disable an agent globally if they don't want any seller to use it. | Set once during onboarding; rarely changed. |
| **Team-level visibility** | For each Team, which of the available agents are enabled. Inherited by all sellers on that team. | Primary configuration surface. Set during onboarding Step 8. |
| **Seller-level override** | A seller can have one or more agents enabled or disabled vs. their team default. | Special cases — pilot users, training cohorts, executive accounts. Configured during Step 9 (Invite Sellers) or post-onboarding. |

Per agent, the admin also configures:
- **Write-scope grants** — which of the agent's optional scopes are enabled (e.g., does Email Outreach Agent get `agent.email.send_via_provider`?)
- **Rate limits** — max invocations per seller per day (default: unlimited for v1; per-seller cap planned for v2)
- **Prompt customization** (optional, v2) — admin can edit the system prompt template for an agent

### 13.5 Functional Requirements

| ID | Requirement |
|---|---|
| F13.1 | Step 8 unlocks after Step 7 (Teams) is complete. CRM integration (Step 6) is recommended but not required — agents that need CRM scopes will be gated with a "Connect CRM to enable" badge. |
| F13.2 | Admin sees all 4 v1 agents listed with description, cost profile, required + optional scopes, and default visibility per audience. |
| F13.3 | For each agent, admin can toggle **tenant-wide availability** (off = no team can enable this agent). |
| F13.4 | For each Team (from Step 7), admin can toggle which available agents are **enabled** for that team's sellers. |
| F13.5 | Default enablement follows the audience defaults in §13.3 (e.g., Email Outreach defaults on for AE teams, off for CSM teams). |
| F13.6 | Admin can grant or revoke each agent's optional scopes per team (e.g., enable `crm.note.create` for Email Outreach Agent on the Enterprise team). |
| F13.7 | Per-team agent settings are versioned. Changes propagate to assigned sellers on next workbench refresh. |
| F13.8 | All agent scope grants integrate with the existing **agent-access audit log** (§11). |
| F13.9 | Each agent's required scopes auto-cascade: enabling Account Brief Agent implicitly grants `agent.brief.generate`. Optional scopes require explicit admin toggle. |
| F13.10 | Admin can preview the seller experience — selecting a team shows the agent affordances exactly as they will appear in the seller's account view. |
| F13.11 | Disabling an agent for a team removes the affordance from active sellers' account views within 60 seconds. In-flight agent runs complete; no new invocations start. |
| F13.12 | Onboarding can proceed to Step 9 even if zero agents are enabled (graceful — sellers get a workbench without agent affordances). |

### 13.6 UX Requirements

- **Agent gallery (initial state)** — top of Step 8 shows the 4 agents as cards with name, icon, one-line description, default audience, cost chip, scope list, and a tenant-availability toggle.
- **Team agent matrix** — below the gallery, a table: rows = teams (from Step 7), columns = available agents. Each cell is a toggle. Hovering a cell shows the team's audience + suggested setting.
- **Quick presets** — buttons above the matrix: "Apply audience defaults" (sets each team's agents per §13.3), "Enable all", "Disable all".
- **Scope drawer** — clicking an enabled agent in the matrix opens a drawer to configure that agent's optional scopes for that team.
- **Preview affordance** — "See seller view" button per team → opens a read-only preview of the Account view with the enabled agents shown as action buttons.
- **Cost summary** — sidebar shows estimated agent cost per seller per day, based on enabled agents and assumed usage. Helps RevOps reason about spend.
- **Confirmation** — once at least one team has at least one agent enabled (or admin explicitly opts to skip), the "Proceed to Step 9" CTA lights up.

### 13.7 Data Model

```ts
TenantAgentConfig {
  tenantId: string
  availableAgents: Array<{
    agentId: 'account_brief' | 'email_outreach' | 'opportunity_finder' | 'find_more_contacts'
    enabled: boolean                        // tenant-wide kill switch
    requiredScopes: string[]
    optionalScopes: string[]
    costPerInvocationUsd: number
  }>
  updatedAt: ISODate
  updatedBy: string
  auditLog: Array<{ action: string, by: string, at: ISODate, payload?: any }>
}

TeamAgentConfig {
  teamId: string
  tenantId: string
  agentSettings: Array<{
    agentId: string
    enabled: boolean
    enabledScopes: string[]                 // subset of optional scopes that admin granted
    rateLimit: { perSellerPerDay: number | null }  // null = unlimited
    promptOverride: string | null           // v2
  }>
  version: number
  updatedAt: ISODate
  updatedBy: string
}

SellerAgentOverride {
  sellerId: string
  teamId: string
  overrides: Array<{
    agentId: string
    enabled: boolean                        // explicit override of team default
    enabledScopes: string[] | null          // null = inherit from team
  }>
  reason: string | null                     // admin-provided rationale (e.g., "pilot tester")
  updatedAt: ISODate
  updatedBy: string
}
```

### 13.8 Seller-Side Invocation (Forward Reference)

When a seller enters the Account view (after Step 10 onboarding), enabled agents appear as a row of action buttons in the account header. Each button:

- Shows the agent's name and icon
- On click, opens a configuration popover (e.g., for Email Outreach: "Pick email type · Pick contact · Generate")
- Submits the agent run; result lands in the account's activity feed
- Provenance + cost are visible on each agent output

Agents the seller does NOT have enabled (because their team didn't enable them, or because RevOps overrode them off) simply don't appear. There is no "request access" affordance for sellers in v1 — they ask their admin out-of-band.

### 13.9 Acceptance Criteria

- [ ] On entering Step 8, admin sees all 4 agents with their descriptions, scopes, costs.
- [ ] Admin can toggle tenant-wide availability per agent.
- [ ] For each Team, admin can enable/disable each available agent.
- [ ] Audience-aware defaults apply on first entry (e.g., Email Outreach defaults on for AE teams).
- [ ] Admin can grant optional scopes per team via the scope drawer.
- [ ] Cost summary updates live as settings change.
- [ ] Preview shows what the seller's Account view will look like.
- [ ] Audit log captures every agent enable/disable + scope grant.
- [ ] Disabling an agent removes the affordance from sellers' views within 60s.
- [ ] Admin can complete Step 8 with zero agents enabled (graceful path).

### 13.10 Open Questions

1. Should agents have **trust tiers** — Tier 1 (low-risk, auto-enabled), Tier 2 (medium-risk, admin opt-in), Tier 3 (high-risk like auto-send email, multi-step approval)?
2. For Email Outreach Agent — do we ship "draft only" in v1 and add `send_via_provider` later, or attempt v1 send integrations (Gmail/Outlook)?
3. Rate limits — should we ship with per-seller daily caps (e.g., 50 briefs/day) to control runaway costs, or unlimited in v1 and add caps post-MVP?
4. Should sellers be able to **request access** to disabled agents (in-app request to their admin), or stay out-of-band?
5. Per-agent prompt customization (admin can tweak the brief template, the email tone) — v1 essential or v2?
6. How do we handle agents that produce variable-quality output (e.g., Find More Contacts when HG contact data is sparse)? Surface quality confidence per output?
7. Should agent-cost telemetry roll up to a per-tenant monthly dashboard for chargeback / cost monitoring?

---

## 14. Step 9 — Invite Sellers (CRM-Driven Discovery)

### 14.1 User Story

> *As a RevOps admin, with my Teams configured and my CRM connected, I want to invite sellers into the platform. The system reads my CRM users, suggests which team each seller belongs to (based on territory + role), and lets me bulk-assign and bulk-invite. Sellers click a magic link, set up their account, and land in their team's pre-configured workbench.*

### 14.2 Trigger

Step 9 unlocks after:
- Step 6 — at least one CRM integration completes (§11.4)
- Step 7 — at least one Team is `active`
- Step 8 — agent configuration saved (admin may save with zero agents enabled; the step just needs to be visited and confirmed)

Before any of these is met, the tile is disabled with a clear message ("Configure a Team in Step 7", "Connect a CRM in Step 6", or "Configure agents in Step 8").

### 14.3 Seller Discovery & Team Assignment

The platform reads CRM Users / Owners (Salesforce Users + Roles + Territories; HubSpot Owners) and proposes a seller list, **with each seller pre-assigned to a Team**:

- All active CRM users with role matching `Sales`, `AE`, `AM`, `CSM`, `BDR`, `SDR` (or tenant-mapped equivalents) are surfaced as candidates.
- Each candidate is auto-assigned to a Team based on:
  1. **Territory match** — if the seller's CRM territory matches a Team's `territoryHints`, that Team is suggested
  2. **Role match** — if no territory match, the Team whose `audience` aligns with the seller's role is suggested
  3. **Fallback** — assigned to the default "All Sellers" team
- Each candidate's book of accounts comes from CRM Owner mapping (Salesforce Owner; HubSpot Owner) — sellers inherit their team's offering lens + Plays + **enabled agents** automatically.

### 14.4 Per-Seller Invitation Config

| Field | Source | Editable? |
|---|---|---|
| `name` | CRM | Read-only (synced) |
| `email` | CRM | Read-only |
| `persona` | LLM-inferred from CRM role | Yes — admin picks AE / AM / CSM / BDR / Admin |
| `teamId` | Auto-assigned by §14.3 logic | Yes — admin can reassign |
| `book` | CRM Owner mapping | Yes — admin can override (e.g., move accounts) |
| `offeringLens` | Inherited from Team's primary offering | Yes — admin can override per-seller |
| `pinnedPlays` | Inherited from Team's default Plays | Yes — admin can add/remove for this seller |
| `enabledAgents` | Inherited from Team's agent config (§13) | Yes — admin can enable/disable specific agents per-seller |
| `slackHandle` | Matched from Slack workspace (if connected) | Yes |
| `role` | `seller` · `team_manager` · `admin` · `viewer` | Defaults to `seller`; team managers (§12.4 `managerId`) auto-set to `team_manager` |

### 14.5 Functional Requirements

| ID | Requirement |
|---|---|
| F14.1 | Step 9 is locked until CRM integration (Step 6), at least one Team (Step 7), and agent configuration (Step 8) are complete. |
| F14.2 | System pulls CRM Users / Owners and proposes a seller list within 30 seconds of Step 9 entry. |
| F14.3 | Each proposed seller is pre-assigned to a Team using §14.3 logic. |
| F14.4 | Admin can bulk-select sellers, filter by role/territory/team, and assign/reassign in batch. |
| F14.5 | Admin can drag-and-drop sellers between teams (or use a team picker dropdown). |
| F14.6 | Admin can override a seller's offering lens, pinned Plays, or enabled agents per-seller (departures from team inheritance are flagged visually). |
| F14.7 | Admin can add a seller manually (not in CRM) by entering name + email — system creates an RGI-only user. |
| F14.8 | Admin can remove a seller from the proposal list (skip-invite). |
| F14.9 | Sending invitations triggers a templated email per seller with: a magic link, team they're joining, book size preview, offering lens, pinned Plays, and enabled agents. |
| F14.10 | Slack DM invite is sent in parallel (if Slack connected and admin enabled DMs). |
| F14.11 | Invited sellers' status moves through: `proposed` → `invited` → `pending_acceptance` → `active`. |
| F14.12 | When a seller accepts and lands in the workbench, they trigger the **Step 10 Seller First-Run** flow (§15). |
| F14.13 | Admin can re-send invites or revoke pending invites at any time. |
| F14.14 | Bulk invite of up to 500 sellers in one click completes within 60 seconds. |
| F14.15 | Audit log captures all invitation actions + team assignment changes + agent overrides. |
| F14.16 | An admin can preview the seller experience ("Impersonate-view") to see exactly what a specific seller will see post-acceptance — including the agents available in their Account view. |

### 14.6 UX Requirements

- **Initial state** — table of CRM-detected sellers, grouped by suggested Team. Header row shows team name + member count.
- **Bulk actions toolbar** — Select all · Filter by role/team/territory · Assign to team · Assign offering lens override · Pin/unpin Plays · Send invites.
- **Per-row edit drawer** — clicking a seller row opens a drawer to override team, persona, lens, book, pinned plays.
- **Team-group view** — collapsible groups by team. Hovering a team header shows "12 sellers · 1,847 accounts in book · 38 A-tier, 124 B-tier · 4 Plays active".
- **Reassignment** — drag a seller card to a different team's group; team membership updates immediately.
- **Override indicator** — if a seller has any override vs. their team's defaults (custom lens, custom Plays), show a "Custom" chip on their row.
- **Invite preview** — clicking "Preview invite" shows the templated email + Slack DM exactly as the seller will see them, with their team's branding/context.
- **Impersonate-view** — admin clicks "See what they'll see" → opens a read-only preview of the seller's home + workbench.
- **Send confirmation** — "Invite 24 sellers across 3 teams? Each will get an email + Slack DM. Continue?"
- **Post-send status** — table updates with status chips per seller (Invited / Pending / Active / Declined). Refreshes live.
- **Completion** — once at least 1 seller is active, the Onboarding header reads "Onboarding complete · Sellers can log in" and the resume prompt clears.

### 14.7 Data Model

```ts
SellerInvitation {
  id: string
  tenantId: string
  sellerId: string                          // RGI user id (created on invite send)
  sourceCrmUserId: string | null            // Salesforce User Id or HubSpot Owner Id
  
  email: string
  name: string
  persona: 'ae' | 'am' | 'csm' | 'bdr' | 'sdr' | 'admin'
  role: 'seller' | 'team_manager' | 'admin' | 'viewer'
  
  teamId: string                            // ← new: every seller belongs to a team
  
  bookConfig: {
    crmOwnerId: string | null
    accountIds: string[]                    // explicit overrides on top of CRM ownership
    territory: string | null
  }
  
  // Per-seller overrides on top of Team inheritance
  offeringLensOverride: string | null       // null = use team's primary offering lens
  pinnedPlaysOverride: string[] | null      // null = use team's defaultPlays
  agentOverrides: Array<{                   // null entry = inherit team default for that agent
    agentId: string
    enabled: boolean
  }> | null
  
  slackHandle: string | null
  
  status: 'proposed' | 'invited' | 'pending_acceptance' | 'active' | 'declined' | 'revoked'
  invitedAt: ISODate | null
  invitedBy: string                         // admin user id
  acceptedAt: ISODate | null
  declinedAt: ISODate | null
  revokedAt: ISODate | null
  
  inviteToken: string                       // magic-link token, expires in 14 days
  resendCount: number
  
  auditLog: Array<{ action: string, by: string, at: ISODate, payload?: any }>
}
```

### 14.8 Acceptance Criteria

- [ ] Step 9 unlocks only after CRM integration (Step 6), ≥1 Team (Step 7), and agent config (Step 8) are complete.
- [ ] System surfaces a seller list pulled from CRM within 30 seconds.
- [ ] Each seller is pre-assigned to a Team based on territory/role.
- [ ] Each seller inherits their Team's offering lens + Plays by default; admin can override per-seller.
- [ ] Admin can bulk-assign sellers to teams via drag-drop or batch picker.
- [ ] Admin can bulk-invite up to 500 sellers in one batch.
- [ ] Sent invites are delivered via email (and Slack DM if connected).
- [ ] Impersonate-view shows the exact seller experience.
- [ ] Status changes (invited → active) reflect live in the admin's Users page.
- [ ] Audit log captures every invitation + team assignment action.
- [ ] Onboarding marks `complete` once at least 1 seller is active.

### 14.9 Open Questions

1. What's the right LLM mapping from CRM role strings → personas (Salesforce role names are unstandardized; HubSpot has free-text job titles)? Recommend: rule-based first pass with admin override.
2. For sellers not in CRM but added manually — do we create a stub Salesforce/HubSpot user, or just RGI-only? Tradeoff: stub keeps the data model clean; RGI-only avoids polluting the CRM.
3. Magic link expiry — 14 days reasonable, or shorter for security?
4. If a seller declines or never accepts within 14 days, do we auto-revoke or prompt the admin?
5. For very large teams (5,000+ sellers — e.g., Cisco-scale tenant), do we paginate the invitation flow or require CSV upload?
6. Should the auto-team-assignment logic surface its rationale per seller (e.g., "Assigned to Enterprise West because territory = US-WEST and role = AE")?

---

## 15. Step 10 — Seller First-Run Experience

### 15.1 User Story

> *As a newly-invited seller (Alex Chen, AE), I click the magic link in my email. I see a brief welcome screen, set up my account (or SSO in), and land directly in the RGI Workbench. My book of accounts is already there — scored, with Why-Now reasons, competitor insights, and complementary tech. I also see whitespace accounts I didn't know about, scored against the same criteria. The Plays my team focuses on are pinned to my sidebar. I get a 30-second orientation tour the first time, then I'm working.*

### 15.2 Trigger & Entry Path

1. Seller receives an email invitation (sent in Step 8) with subject "You're invited to RGI Workbench — [Tenant Name]".
2. Seller clicks the magic link → lands on the **invitation acceptance** screen.
3. Seller completes account setup (password or SSO) → magic-link token is consumed.
4. Seller is redirected to the RGI Workbench with their team's config pre-loaded.
5. First-time entry triggers a **30-second orientation overlay** (skippable, dismissible).

### 15.3 Account Setup (Pre-Workbench)

A minimal flow — we do not block the seller with lots of forms.

| Step | What the seller does | Time |
|---|---|---|
| Welcome | Sees "Welcome to RGI Workbench — your team [Team Name] is ready." with a "Continue" button. | 5s |
| Auth | Picks SSO (if tenant has SAML/OAuth) or sets a password + optional MFA. | 30–60s |
| Profile (light) | Confirms display name, time zone (auto-detected). Slack handle prefilled if Slack connected. | 15s |
| Done | Lands in Workbench. | — |

Total: typically < 2 minutes. Sellers can complete this from mobile (only the workbench requires desktop).

### 15.4 Default Workbench Load — What's Already There

When the seller enters the workbench, the platform has **pre-loaded** everything based on their Team config:

#### A. Book of Accounts (CRM-derived, filtered to their ownership)
- All accounts where the seller is the CRM Owner (Salesforce Account.Owner / HubSpot Company Owner)
- Plus accounts explicitly assigned via the admin override in Step 8 (§13.4 `bookConfig.accountIds`)
- Each account is **scored** against the seller's Team's primary scoring profile (their offering's Fit / Need / Intent model)
- Default sort: composite score descending
- Default filter: Tier A + B (toggleable)

#### B. Whitespace Accounts (HG universe, not in CRM)
- HG-universe accounts that:
  - Match the seller's team's offerings' target ICP
  - Are NOT in the seller's CRM book
  - Score ≥ Tier C (configurable threshold; default surfaces enough volume to be useful)
- Same column structure as the book table
- A source toggle in the workbench header lets the seller switch between "Book" / "Whitespace" / "Both"
- Default view on first entry: **Book** (most familiar); a "✨ N whitespace accounts ready to explore" banner nudges discovery

#### C. Columns (per Team's primary offering, default §9.3 column set)
- Account · Tier · Revenue · Employees · Why Now · Competitive Insights · Complementary Tech
- Why Now is computed using the seller's offering lens (e.g., "Surging on Wiz CNAPP intent · Lacework installed 5 yrs" for a Wiz-CNAPP seller)

#### D. Plays (sidebar, pinned)
- The Team's default Plays (from §12.4) appear pinned in the sidebar
- Each Play shows a count badge: "Competitive Takeout · 14 matches in your book"
- Clicking a Play filters the workbook to its ranked accounts
- Plays the admin overrode for this specific seller (§13.4 `pinnedPlaysOverride`) appear here too

#### E. Offering Lens Switcher (workbench header)
- If the Team has multiple offerings, a lens switcher lets the seller toggle which scoring profile drives the table
- Default lens = the team's primary offering
- Switching re-scores the visible accounts and updates Why Now + Tier columns

#### F. Agents Available in Account View
- When the seller opens any account (from book or whitespace), the **Account view** surfaces the agents enabled for them via Step 8 → Step 9 inheritance.
- Default agent row in the Account header (subject to enablement):
  - **Account Brief Agent** — "Generate brief" button → produces a multi-section brief, scoped to the seller's current offering lens.
  - **Email Outreach Agent** — "Draft email" button → opens a popover to pick email type + contact, then drafts.
  - **Opportunity Finder Agent** — "Find opportunities" button → scans the account for opportunity hypotheses.
  - **Find More Contacts Agent** — "Find contacts" button → discovers buying-committee contacts beyond what's in CRM.
- Agents not enabled for this seller are simply absent from the row (no greyed-out affordances).
- Each agent output lands in the account's activity feed with provenance + cost visible.

### 15.5 Orientation Tour (First-Time Only)

A 5-step interactive overlay, ≤ 40 seconds total. Each step is one tooltip pointing to the relevant UI:

| # | Highlights | Copy |
|---|---|---|
| 1 | The workbench table | "This is your book — already scored against [Offering]. The Why Now column tells you why each account matters today." |
| 2 | The source toggle | "You also have whitespace — companies HG knows about that aren't in your CRM yet. Toggle here." |
| 3 | The Plays sidebar | "Your team focuses on these Plays. Click one to see ranked accounts." |
| 4 | An account row → opens Account view | "Click any account to dive in. Your team has [N] agents ready: brief, email, contacts, opportunities." (number reflects enabled agents) |
| 5 | The Enrich + Activate buttons | "Add columns with plain language, or run an agent on an account. You're set." |

After step 5, the overlay dismisses. The seller can re-trigger from a "?" icon in the header.

### 15.6 First-Day Recommendations Drawer (Optional)

After the orientation, a dismissible right-side drawer surfaces "Start here" recommendations:

- **Top 3 A-tier accounts in your book** (with one-click "Generate brief" affordance)
- **Top 3 whitespace accounts** (with "Add to book" affordance, if `crm.account.create` scope is enabled)
- **Active Play with most matches** in their book (e.g., "Competitive Takeout has 14 hot accounts")

Sellers can dismiss the drawer permanently or per-session.

### 15.7 Functional Requirements

| ID | Requirement |
|---|---|
| F15.1 | Magic-link click validates the token, creates the RGI user account (if not already), and routes to account setup. |
| F15.2 | Expired or already-consumed tokens show a clear "This invite has expired — ask your admin to re-send" screen with the admin's contact info. |
| F15.3 | Account setup supports SSO (SAML / OAuth via the tenant's IDP) if configured, OR password + optional MFA. |
| F15.4 | After setup, seller is auto-routed to the Workbench. No intermediate dashboard. |
| F15.5 | Workbench pre-loads book + whitespace + scores + Plays + lens — first-paint ≤ 2 seconds. |
| F15.6 | Orientation overlay shows ONLY on first entry. Dismissed state persists per seller. |
| F15.7 | Seller can re-trigger orientation any time from a help icon. |
| F15.8 | First-day recommendations drawer shows ≤ 3 accounts per category, with affordances scoped to the seller's enabled agent permissions. |
| F15.9 | Source toggle (Book / Whitespace / Both) is visible in the workbench header. Default = Book. |
| F15.10 | Offering lens switcher is visible if the Team has > 1 offering. |
| F15.11 | If the seller has CRM ownership of 0 accounts (rare — territory not yet populated), default view = Whitespace. |
| F15.12 | Telemetry captures: time-from-invite-sent to first-login, time-from-first-login to first-action, orientation-completion rate, drawer-engagement rate. |
| F15.13 | First-run treats overrides from Step 8 (custom offering lens, custom Plays) as the source of truth, not the Team defaults. |
| F15.14 | A seller can be re-onboarded (admin triggers "reset first-run state") if their Team changes substantially. |

### 15.8 UX Requirements

- **Magic-link landing** — clean welcome screen with tenant logo, team name, and a primary "Get started" CTA. No marketing fluff.
- **Account setup** — single screen with SSO button (if available) above the password form. MFA is optional via toggle.
- **Profile step** — pre-filled fields; seller confirms with one click.
- **Workbench entry transition** — short "Loading your team's workbench…" splash (≤ 2 seconds) while pre-load happens. Skeleton table appears progressively.
- **Orientation overlay** — non-blocking; seller can interact with the workbench underneath. Each step has "Skip tour" and "Next" buttons.
- **First-day drawer** — slides in from right, dismissible per-session or permanently. Hover any row → action affordances.
- **Source toggle** — prominent segmented control in the header. Whitespace tab shows a count badge.
- **Persistent help** — "?" icon in the header opens a help menu with: re-run orientation, contact admin, docs, keyboard shortcuts.

### 15.9 Data Model

```ts
SellerOnboardingState {
  sellerId: string
  tenantId: string
  teamId: string
  
  invitedAt: ISODate
  acceptedAt: ISODate
  firstLoginAt: ISODate | null
  
  orientationCompleted: boolean
  orientationDismissedAt: ISODate | null
  
  firstDayDrawerDismissed: 'session' | 'permanent' | null
  
  firstActionAt: ISODate | null              // when seller first acted on an account
  firstActionType: 'brief' | 'email' | 'contact_discovery' | 'business_case' | 'play_run' | 'enrich_query' | null
  
  workbenchEntries: Array<{ at: ISODate, source: 'book' | 'whitespace' | 'both', offeringLens: string }>
  
  resetCount: number
  lastResetAt: ISODate | null
}
```

### 15.10 Acceptance Criteria

- [ ] Magic-link routes correctly to setup → workbench.
- [ ] Expired/invalid tokens show a clear error with admin contact.
- [ ] Account setup supports both SSO and password.
- [ ] Workbench loads with book + whitespace + scores + Plays ≤ 2s.
- [ ] Orientation overlay shows on first entry only.
- [ ] Seller can re-trigger orientation from the help icon.
- [ ] First-day drawer surfaces 3 A-tier book accounts + 3 whitespace + most-active Play.
- [ ] Source toggle and lens switcher work as specified.
- [ ] Telemetry captures the key first-run metrics.
- [ ] When admin updates the Team's config, the seller's workbench refreshes accordingly on next entry.

### 15.11 Open Questions

1. Should the orientation overlay be **mandatory** for first-time sellers (cannot skip) or always-dismissible? Recommend: dismissible (sellers hate forced flows).
2. SSO support — do we cover OIDC + SAML in v1, or just OIDC? Many enterprise tenants require SAML.
3. For sellers with empty CRM books (new hires not yet assigned), should we default to whitespace-only and surface a "Talk to your manager about territory assignment" nudge?
4. Should the first-day drawer's "Add to book" affordance write directly to CRM (requires `crm.account.create` scope) or just create an RGI-local list? Tradeoff: write-to-CRM is the magic moment; RGI-local is safer if scope isn't granted.
5. Should the orientation be **role-aware** — different copy for AE vs. CSM vs. BDR? Recommend: yes, but ship single-version in v1.
6. How long do we keep the "first-day" affordances visible — single session, 7 days, until dismissed?
7. Mobile-web for first-run setup is reasonable, but the workbench itself is desktop-first. Do we surface a "Continue on desktop" prompt if seller lands on mobile after setup?

---

## 16. Seller Workspace — Ongoing Experience

> *Not a numbered onboarding step. This section describes the steady-state seller experience that begins after Step 10 first-run and continues every day they log in. It defines the workspace anatomy, the Enrich-with-AI loop, and the agent-first Account view that powers the seller's day.*

### 16.1 User Story

> *As Alex Chen, an AE at Wiz, I log into RGI Workbench every morning. My book is right there — my CRM accounts, ranked by tier with Why-Now reasons that tell me where to focus today. Below my book I have whitespace — companies HG knows about that I don't yet own. When I want more context I don't have to dig through dashboards — I ask the workbook in plain language ("Show me which of these had a CISO change in the last 60 days"), and a new column appears. When I'm ready to act, I click into an account and the system surfaces all the agents I have — generate a brief, draft an email, find more contacts, scan for opportunities. The workspace is built around action, not exploration.*

### 16.2 Workspace Anatomy

The seller workspace has four primary surfaces:

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Tenant logo · Offering lens switcher · Search · Help   │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                       │
│  Plays   │   WORKBOOK (table view, the seller's home)            │
│ Sidebar  │   Source toggle: [ Book | Whitespace | Both ]         │
│          │   Columns: Account · Tier · Revenue · Employees ·     │
│ • Play A │              Why Now · Competitive Insights ·         │
│ • Play B │              Complementary Tech · [+ enriched]        │
│ • Play C │   Toolbar: Enrich with AI · Save view · Export · Sync │
│          │                                                       │
│  Saved   │   Row-click → opens Account View (right pane or       │
│  Views   │                                  full-screen route)   │
│          │                                                       │
└──────────┴──────────────────────────────────────────────────────┘
```

#### A. Plays Sidebar (left)
- Pinned Plays from the seller's Team (inherited via Step 7 → 9)
- Each Play shows count badge: "Competitive Takeout · 14 matches"
- Clicking a Play filters the workbook to its ranked accounts
- Saved views section below — seller's own workbook configurations (filters + enrichment columns + sort)

#### B. Workbook Table (center, primary)
- Two sources, one toggle: **Book** (CRM-owned), **Whitespace** (HG universe not in CRM), **Both** (union, deduped)
- Default columns from §9.3: Account · Tier · Revenue · Employees · Why Now · Competitive Insights · Complementary Tech
- Enriched columns (added via Enrich with AI) appear with the ✨ marker
- Sortable on every column; multi-sort supported
- Filter chips above the table

#### C. Account View (opens on row-click)
- Right-pane (default) or full-screen route
- This is the **agent-first action hub** — see §16.5
- Contains: account header (firmographics + tier + Why Now), agent action row, activity feed, contacts, intent signals, install timeline, recommended next step

#### D. Header
- Offering lens switcher (if the seller's team has multiple offerings)
- Global search across accounts + contacts
- Help / orientation re-trigger / keyboard shortcuts

### 16.3 Working the Book + Whitespace Together

The book vs. whitespace distinction is **central** to the seller workflow. Two ways to use them:

#### Source toggle (primary)
- **Book** — daily working surface. Sellers spend most of their time here.
- **Whitespace** — discovery surface. Sellers visit when prospecting new logos or expansion territories.
- **Both** — power-user view. Mix book and whitespace ranked together by score.

#### Add-to-book flow (whitespace → book transition)
When a seller finds a hot whitespace account, they can:
1. Click "Add to book" on the row (or in bulk via multi-select).
2. If the seller's CRM agent scope includes `crm.account.create` (or `crm.lead.create`), the account is pushed to CRM with the seller as Owner. The account flips from whitespace to book in real time.
3. If the scope is not granted, the account is added to an RGI-local "Watchlist" and surfaced for admin review (admin can approve push-to-CRM in batch).

This is the seller's whitespace → pipeline conversion path.

### 16.4 Enrich with AI — Seller-Facing Intent Query Engine

The same intent-based query engine specified in §9.4 for admins is exposed to sellers, scoped to the accounts they have access to. **This is the workspace's superpower** — sellers don't need a data team to answer ad-hoc questions about their accounts.

#### 16.4.1 What it does

A single input in the workbook toolbar — "Ask about these accounts…" — accepts plain language and returns a new column.

| Seller asks… | Resulting column |
|---|---|
| "Show me which of these had a CISO change in the last 60 days" | `hiring.ciso_change_60d` — name + hire date chip |
| "Add their cloud security spend last 12 months" | `spend.cloud_security_12mo` — formatted $ + YoY trend |
| "Flag any researching Wiz CNAPP in the last 30 days" | `intent.cnapp_30d` — surge level + topic list |
| "Show which have Palo Alto Prisma Cloud installed" | `tech.prisma_cloud` — install date chip |
| "Add their renewal date" *(if CRM connected)* | `crm.renewal_date` — date |
| "Flag breaches in the last 6 months" | `events.breach_6mo` — headline + date |

The query engine handles single-column queries, multi-column queries, and follow-ups ("Now show me which of those have an active opportunity").

#### 16.4.2 Differences from the admin version (§9.4)

| Aspect | Admin (§9.4) | Seller (§16.4) |
|---|---|---|
| Scope of accounts | All accounts in the workbook (book + whitespace, all teams) | Only the seller's book + their team's whitespace |
| Data tiers accessible | All licensed data | Subject to per-team licensing (e.g., a team may not have IT spend tier — that query degrades gracefully) |
| Save-to-view | Can save to tenant-wide Saved Views | Can save to personal Saved Views only |
| Sharing | Can share with sellers | Can share with own team (requires team-manager role) |
| Cost ceiling | Tenant-wide | Per-seller daily cap (configurable; default unlimited in v1) |

#### 16.4.3 Functional Requirements (Seller Enrichment)

| ID | Requirement |
|---|---|
| F16.1 | Sellers see the "Enrich with AI" input in the workbook toolbar. |
| F16.2 | Queries resolve in ≤ 30s for typical book sizes (≤ 1000 accounts); ≤ 60s for full whitespace (≤ 10K accounts). |
| F16.3 | Every enriched cell has a provenance chip (source · refresh date). |
| F16.4 | Sellers can save the enriched view to a personal Saved View. |
| F16.5 | Sellers can share a Saved View with their team if their role allows (default: seller can share with team manager for review). |
| F16.6 | Queries requesting data the team doesn't license return a clear "Not available in your plan — ask your admin" message with no error. |
| F16.7 | Enrichment queries are throttled per-seller per-minute (default: 10/min) to prevent abuse. |
| F16.8 | A seller's query history (last 20) is accessible from a dropdown for re-application. |
| F16.9 | Telemetry captures every query (text + structured AST + cell results) for engine improvement. |

### 16.5 The Account View — Agent-First Action Hub

When a seller clicks an account, the workspace pivots from list-mode to action-mode. The Account view is **designed around the agents available to them**, not around static account fields. This is the workspace's biggest departure from CRM-style account pages.

#### 16.5.1 Anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Back to Workbook                                                │
│                                                                   │
│  ACCOUNT HEADER                                                   │
│  ─ Logo · Account name · Domain · Tier chip · Why Now chip       │
│  ─ Firmographics row: Revenue · Employees · Industry · HQ         │
│                                                                   │
│  AGENT ACTION ROW (the action hub — see §16.5.2)                  │
│  [ 📋 Brief ] [ ✉️ Draft Email ] [ 🔍 Find Opportunities ]       │
│  [ 👥 Find Contacts ]                                             │
│  *(only enabled agents appear)*                                   │
│                                                                   │
│  ─────────────────────────────────────────────────────────────   │
│                                                                   │
│  TABS  [ Overview ] [ Signals ] [ Contacts ] [ Activity ]         │
│                                                                   │
│  [ tab content varies ]                                           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### 16.5.2 Agent Action Row

This is the **first thing the seller sees** after the header. Each agent enabled for them (via §13 Team config + §14 per-seller overrides) appears as a one-click button. Clicking:

- Opens a small input popover (e.g., for Email Outreach: pick email type + contact + tone) — typically 1–3 fields
- Fires the agent run
- Streams the output into the **activity feed** on the page (the seller doesn't navigate away)
- Each output is timestamped, shows agent provenance + cost, and is editable/regeneratable

| Agent | Popover inputs | Output lands in |
|---|---|---|
| **Account Brief Agent** | Brief type (Discovery / QBR / Competitive) · Offering context (defaulted to lens) | Activity feed as a saved Brief artifact. One-click "Export to CRM as Note" if scope enabled. |
| **Email Outreach Agent** | Email type (Cold / Follow-up / Displacement / Expansion) · Contact target (picked from §16.5.3 Contacts tab or typed) · Optional tone hint | Activity feed as a Draft. One-click "Send" if `send_via_provider` enabled (else "Copy to clipboard"). One-click "Log as Task in CRM". |
| **Opportunity Finder Agent** | Time window (default 90 days) · Hypothesis type filter | Activity feed as ranked Hypothesis cards (each with evidence + recommended action chain). |
| **Find More Contacts Agent** | Target persona (defaulted from offering's `buyingCommittee`) · Count (default 5) | Activity feed as a Contact list. One-click "Add to CRM" per contact if scope enabled. |

#### 16.5.3 Tabs (Lower Section)

- **Overview** — narrative summary (auto-generated from enrichment + scoring): Why this account scores [Tier], top 3 contributing signals, recommended next 24-hour action.
- **Signals** — full firing-signals breakdown for the current offering lens. Intent topics, recent installs/removals, news, hiring signals — all the atoms feeding the Tier + Why Now.
- **Contacts** — known contacts (from CRM + HG + agent-discovered). Filter by role, seniority, last-engagement.
- **Activity** — chronological feed of: agent outputs, manual notes, CRM sync events (write-backs), Play matches, intent surges, status changes.

### 16.6 Action-First Design Principles

The workspace is **action-oriented** by default. Concretely:

| Principle | What it looks like |
|---|---|
| **Default to act, not browse** | Every account row exposes a quick-action button without opening the account. Brief / Email are one-click from the table. |
| **Don't navigate away to act** | Agent runs land in the same view (Account view's activity feed). No page reloads, no separate "Drafts" inbox to remember. |
| **Every action has an outcome chip** | Brief → "View / Edit / Export". Email → "Send / Copy / Log". Contact → "Add to CRM / Save / Discard". |
| **Provenance is one hover away** | Every enriched cell, every Why-Now reason, every agent output shows its source. No black boxes. |
| **Persistence over rediscovery** | Saved Views, Play state, agent draft history all persist per-seller across sessions. |
| **Cross-page state continuity** | Selecting an account in the workbook and opening it doesn't lose your filter, your sort, or your enrichment columns. Back-button returns you to the exact state. |

### 16.7 Functional Requirements (Workspace Composite)

| ID | Requirement |
|---|---|
| F16.10 | Workspace first-paint after login ≤ 2s (warm cache); ≤ 4s (cold cache, fresh scoring). |
| F16.11 | Source toggle (Book / Whitespace / Both) preserves all filters and sort when switching. |
| F16.12 | Row-click on an account opens the Account view as a right-pane by default; seller can toggle to full-screen via header control. |
| F16.13 | Agent affordances in the Account view reflect exactly the seller's enabled agents (per §13 + §14). Disabled agents are absent (no greyed-out buttons). |
| F16.14 | Agent runs are non-blocking — sellers can browse the table while an agent works. Notification on completion. |
| F16.15 | Activity feed entries are individually addressable (deep-linkable URLs) for sharing with managers or pasting into Slack. |
| F16.16 | Whitespace "Add to book" honours the seller's CRM scopes — writes to CRM if allowed, falls back to a Watchlist otherwise. |
| F16.17 | Plays sidebar count badges refresh on workbook data change (e.g., new intent surge updates the Play's match count within 5 min). |
| F16.18 | Saved Views are personal by default; admins or team managers can promote a view to Team-shared. |
| F16.19 | Sellers can export the current workbook view to CSV (with all enriched columns) — gated by `crm.bulk.export.accounts` if the view includes CRM-owned accounts. |
| F16.20 | Every seller action that writes to CRM goes through the existing agent-scope audit log. |
| F16.21 | Sellers see a "lighter" version of provenance chips than admins — source + date but not full structured query — to reduce noise. Click-through reveals the full provenance. |

### 16.8 UX Requirements

- **Workbench landing** — book by default. Whitespace tab shows a count badge with delta vs. last visit ("✨ 12 new whitespace matches since Tuesday").
- **Enrich with AI input** — single full-width input in the toolbar with cycling placeholder hints. Submission shows a preview ("Add column · Intent CNAPP 30d for your 312 accounts?") before applying.
- **Account view transition** — slides in from right (default right-pane width: 60% of viewport). Esc closes; back arrow returns to workbook with state intact.
- **Agent action buttons** — primary visual weight on the agent row. Icons + short labels. Color-coded subtly by agent kind (Brief = blue, Email = green, Opportunity = amber, Contacts = purple) for muscle memory.
- **Activity feed** — reverse-chronological. Each entry has its own card with agent icon, timestamp, cost chip, and inline actions (edit, regenerate, export, delete).
- **Empty states matter** — an account with no firing signals shows a clear "No active signals yet — try checking back after [event] or run an Opportunity scan". Drives action.

### 16.9 Data Model (Refs)

Most data models are already defined in earlier sections. Workspace-specific additions:

```ts
SellerSession {
  sellerId: string
  tenantId: string
  teamId: string
  
  lastActiveAt: ISODate
  activeOfferingLens: string
  activeSource: 'book' | 'whitespace' | 'both'
  activeFilters: object
  activeSort: { column: string, direction: 'asc' | 'desc' }
  
  activeViewId: string | null               // currently-loaded Saved View, if any
  
  agentInvocations: Array<{
    agentId: string
    accountId: string
    invokedAt: ISODate
    completedAt: ISODate | null
    status: 'pending' | 'completed' | 'failed'
    costUsd: number
    outputArtifactId: string | null
  }>
  
  enrichmentQueriesToday: number            // for rate-limit enforcement
}

AccountActivityFeedEntry {
  id: string
  accountId: string
  sellerId: string
  
  kind: 'agent_output' | 'manual_note' | 'crm_sync' | 'play_match' | 'intent_surge' | 'status_change'
  agentId?: string                          // if kind == agent_output
  
  payload: any                              // varies by kind; structured per kind
  
  createdAt: ISODate
  visibleToTeam: boolean                    // false by default; seller can promote
  
  costUsd?: number                          // if kind == agent_output
  provenance: object
}
```

### 16.10 Acceptance Criteria

- [ ] Seller workspace renders book + whitespace with all default columns ≤ 2s warm.
- [ ] Source toggle preserves filters and sort on switch.
- [ ] Plays sidebar shows team's pinned Plays with live count badges.
- [ ] Enrich with AI input resolves a query and appends a new column with provenance.
- [ ] Saved Views persist per-seller and reload exact filter + enrichment state.
- [ ] Account view opens on row-click and shows only the agents the seller has enabled.
- [ ] Each agent in the action row has a one-click invocation that streams output into the activity feed.
- [ ] Whitespace → book conversion ("Add to book") writes to CRM when scope is granted; falls back to Watchlist otherwise.
- [ ] Every agent output and enriched cell has visible provenance.
- [ ] Workspace state (active filters, sort, view) persists across sessions and devices.

### 16.11 Open Questions

1. Should sellers see whitespace by default once they're comfortable, or always default to book? Consider a "first-week book / second-week mixed" auto-evolution.
2. For the Account view — right-pane vs. full-route vs. modal? Tradeoff: pane keeps workbook context; full-route gives more space for the agent activity feed.
3. Should there be a per-account "manager view" that a CSM or AE manager can open to see their seller's full activity on that account?
4. Quick actions in the workbook table — do we surface agent buttons on row hover (no Account view open), or require the seller to open the Account view first? Tradeoff: speed vs. context.
5. The activity feed grows unbounded over time. What's the retention/pagination model? Suggest: indefinite retention, paginate at 50.
6. How does a seller request access to a disabled agent? In-app request flow → admin notification? Or strictly out-of-band? (Same open question as §13.10 — likely answered same way.)
7. For "Both" source view, do we visually distinguish book rows from whitespace rows (e.g., subtle badge on whitespace rows)? Recommend yes — sellers need to know which world a row is in.

---

## 17. Cross-Cutting Requirements

### 17.1 Persistence
- Every step's state persists immediately. Admins can close the browser and resume.
- Each step has a "Save & exit" affordance.
- A persistent **resume prompt** appears on next login until all admin steps (1–8) are confirmed (or explicitly skipped where allowed). Step 9 is per-seller, not gated by admin completion.

### 17.2 AI Agent Architecture (high-level)
- Each step is driven by a dedicated agent type (Tenant Context Agent, Offering Grouping Agent, Scoring Model Agent, Workbook Enrichment Agent, Play Proposal Agent, Team Suggestion Agent, Seller Role Mapping Agent).
- Agents are **idempotent** and **observable** — same inputs → same outputs; every agent run logs its prompt, model version, raw output, and final decisions for audit.
- Agents may chain (Step 2 offering grouping depends on Step 1 products; Step 5 Play proposals depend on Step 2 offerings + Step 3 scoring; Step 7 Team suggestions depend on offerings + Plays; Step 8 seller suggestions depend on Step 6 CRM users + Step 7 Teams), but each agent is independently testable.

### 17.3 Error States
- **Agent failure** — surface a friendly retry. If repeated, allow admin to skip to manual entry.
- **HG data gap** — gracefully degrade to manual-entry mode for affected fields.
- **Domain not parseable** — clear error with examples of valid formats.
- **Integration auth failure** — clear error with reconnect CTA; allow admin to skip and revisit.
- **Invitation delivery failure** — bounce/unreachable handled per-seller with a "Re-send" or "Edit email" affordance.
- **Magic-link expired/consumed** — clear seller-facing error with admin contact info.

### 17.4 Observability
- Every agent run + admin edit + confirmation + integration scope change + Team change + invitation action + seller first-run event is logged with timestamps, actor, before/after.
- Telemetry tracks: time-to-confirm per step, edit volume per field, drop-off points per step, integration completion rate, seller acceptance rate, orientation-completion rate, time-from-invite to first-action.

### 17.5 Security / Privacy
- Tenant context is **tenant-private** by default. Cross-tenant anonymized patterns may be surfaced as insights but never raw data.
- Admin-only fields (e.g., audit log, integration credentials, agent scope grants) are gated by RBAC.
- Integration credentials encrypted at rest. OAuth tokens never logged in plaintext.
- Invitation magic links are single-use, time-bound, and tied to the inviting tenant.
- Sellers can only see accounts in their team's offering scope; cross-team visibility is admin-gated.

### 17.6 Performance Budgets
- Step 1 extraction: ≤ 60 seconds end-to-end on a happy-path tenant.
- Step 2 offering generation: ≤ 30 seconds.
- Step 3 scoring model generation: ≤ 2 minutes per offering. Initial universe scoring: ≤ 10 minutes (acceptable to background after model confirmation).
- Step 4 workbench entry: ≤ 2 seconds to first paint for ≤ 5,000 accounts. Enrichment query: ≤ 30s target, ≤ 60s acceptable.
- Step 5 Play proposal: ≤ 30 seconds for 3–5 Plays. Live preview update: ≤ 1 second.
- Step 6 OAuth handshake + field-mapping load: ≤ 10 seconds. Test sync round-trip: ≤ 15 seconds. Initial bulk pull: progress-tracked, no hard cap.
- Step 7 Team configuration: live preview update ≤ 1 second per change.
- Step 8 seller list load: ≤ 30 seconds. Bulk-invite up to 500 sellers: ≤ 60 seconds.
- Step 9 seller workbench first-paint: ≤ 2 seconds after account setup.

---

## 18. Out of Scope (Onboarding v1)

- Customizing the scoring model from scratch (full DC methodology authoring) — admin can tune post-onboarding via existing model builder.
- Authoring more than 3 offerings during onboarding — post-onboarding admins can add more via Workbench.
- Integrations beyond Salesforce, HubSpot, Slack (e.g., Gong, Outreach, Salesloft, NetSuite, MS Dynamics) — v2+.
- Bidirectional Slack message threading / replies — v2.
- Reading Slack channels for sentiment / signal capture — v2 (read scope is configurable in v1 but processing is post-v1).
- Multi-team seller membership — v2 (a seller belongs to exactly one team in v1).
- Role-aware orientation (different copy for AE vs. CSM vs. BDR) — v2.
- CSV-based seller invitation for very large teams (>500) — v2.
- Multi-tenant or multi-organization admin views.

---

## 19. Success Metrics

| Metric | Target | Why |
|---|---|---|
| **Time to confirmed workbench (Steps 1–3)** | < 60 minutes (median) | The core TTV claim |
| **Time to fully-configured tenant (Steps 1–8)** | < 150 minutes (median) | End-to-end admin onboarding cost |
| **Step 1 confirmation rate** | > 90% within 7 days of signup | Indicates context extraction quality |
| **Step 1 field edit rate** | < 30% of fields edited | Indicates AI extraction precision |
| **Step 2 offering edit rate** | < 50% of attributes edited | Indicates LLM grouping quality |
| **Step 3 scoring model approval rate** | > 80% accepted without dimension edits | Indicates model auto-build precision |
| **Step 4 enrichment query success rate** | > 75% of queries return a usable column | Indicates query engine quality |
| **Step 5 Play activation rate** | ≥ 1 Play active for > 80% of tenants | Indicates Play proposal relevance |
| **Step 6 integration completion** | ≥ 1 CRM connected for > 70% of tenants within 30 days | Indicates 1P data flow |
| **Step 7 Team configuration** | ≥ 1 Team active for > 95% of tenants reaching Step 7 | Indicates Team concept is sticky |
| **Step 8 agent enablement** | ≥ 2 agents enabled per active team (median) | Indicates agents are valuable enough to enable |
| **Step 9 seller invitation acceptance** | > 60% of invited sellers active within 7 days of invite | Indicates invitation UX quality |
| **Step 10 seller first-action latency** | < 10 minutes from first login to first account action (median) | Indicates workbench is immediately usable |
| **Step 10 first agent invocation rate** | > 50% of sellers invoke an agent within their first session | Indicates agents are discoverable and trusted |
| **Step 10 orientation completion** | > 70% of sellers complete the orientation overlay | Indicates orientation length/value |
| **Resume rate** | < 20% of admins start, don't finish onboarding | Indicates friction or value-gap |

---

## 20. Phasing & Rollout

| Phase | Scope | Eta |
|---|---|---|
| **Phase A** | Step 1 (Tenant Context Extraction) — end-to-end with manual fallback for unknown domains. | Q3 |
| **Phase B** | Step 2 (Offering Configuration) — assume Step 1 is complete. Includes LLM grouping. | Q3 / early Q4 |
| **Phase C** | Step 3 (Scoring Models + Initial Scoring) — depends on existing DC scoring SQL generators. | Q4 |
| **Phase D** | Step 4 (Workbench Entry) — default view + intent-based enrichment query engine. | Q4 |
| **Phase E** | Step 5 (Play Configuration) — Play proposal + signal composition + live preview. | Q4 / early Q5 |
| **Phase F** | Step 6 (Integrations) — Salesforce + HubSpot + Slack OAuth + field mapping + agent scopes + completion notification. | Q5 |
| **Phase G** | Step 7 (Teams) — Team data model + Team configurator UI + offering/Plays inheritance. | Q5 |
| **Phase H** | Step 8 (Agents) — Agent catalog (4 v1 agents) + tenant/team/seller visibility + scope grants + cost telemetry. | Q5 / early Q6 |
| **Phase I** | Step 9 (Seller Invitation) — CRM-driven seller discovery, team + agent assignment, bulk invite, magic-link delivery. | Q6 |
| **Phase J** | Step 10 (Seller First-Run) — magic-link landing, account setup, workbench pre-load, orientation overlay (5-step), agent affordances in Account view. | Q6 |
| **Phase K** | Stitching + polish — full 10-step flow, resume state, telemetry, error UX, end-to-end QA. | Q6 / early Q7 |

---

## 21. Appendix

### 21.1 Glossary

| Term | Definition |
|---|---|
| **Tenant** | The HG customer (e.g., Wiz.io is a tenant). |
| **Offering** | A distinct product/solution the tenant sells (e.g., Wiz CNAPP, Wiz CIEM). Max 3 during onboarding. |
| **Scoring Model** | DC methodology model that scores accounts on Fit / Need / Intent for a given offering. |
| **Play** | A business motion (Competitive Takeout, Net New Logo, Expansion, etc.) composed from atomic Signals + recommended actions. |
| **Signal (Ranking)** | Atomic, weighted, evaluable primitive that ranks accounts within a Play. 1P (from CRM) or 3P (from HG). |
| **HG-universe account** | Any company HG has data on. Distinct from "book account" which is in the tenant's CRM. |
| **DC methodology** | Doug Cardamone's scoring framework — see `/skills/scoring-with-dc-methodology`. |
| **RGI Workbench** | The seller's primary workspace. Sellers enter it after RevOps completes onboarding. |
| **Provenance** | Visible source/reason for every AI-suggested value. Builds trust. |
| **Enrichment column** | A workbook column added via the intent-based query engine. Layers on top of base columns. |
| **Team** | A grouping of sellers sharing offerings, scoring profile, default Plays, and enabled agents. Inheritance layer between tenant config and per-seller config. |
| **Agent** | A seller-facing AI capability invokable in the Account view (Account Brief, Email Outreach, Opportunity Finder, Find More Contacts). Visibility configured per Tenant/Team/Seller. |

### 21.2 Related Documents

- `docs/CLAUDE.md` — HG Insights GTM Intelligence Assistant rules
- `src/data/scoringModels.js` — current scoring model data layer
- `src/data/offerings.js` — current offerings data layer
- `src/data/plays.js`, `src/data/rankingSignals.js`, `src/data/playEvaluator.js` — Plays + Signals data + runtime evaluator
- `src/data/integrations.js` — integrations + agent-access audit log (prototype)
- `/admin/tenant`, `/admin/offerings`, `/admin/offerings/:id/model`, `/admin/integrations`, `/plays`, `/workbook` — existing surfaces this onboarding feeds into

### 21.3 Change Log

| Version | Date | Changes |
|---|---|---|
| v0.1 | 2026-06-11 | Initial draft — RevOps onboarding 3 steps. Seller onboarding stubbed. |
| v0.2 | 2026-06-11 | Added Step 4 (Workbench Entry + intent enrichment), Step 5 (Play Configuration), Step 6 (Integrations: Salesforce, HubSpot, Slack). |
| v0.3 | 2026-06-11 | Added integration-complete notification (§11.4), expanded Step 6 with full CRM permission set. Added Step 7 — Add Sellers (seller invitation flow gated by CRM completion). |
| v0.4 | 2026-06-11 | Introduced **Teams** as a first-class construct. Split into Step 7 (Configure Teams) and Step 8 (Invite Sellers with team assignment). Expanded Step 9 — Seller First-Run Experience from stub into full spec (magic link, account setup, workbench pre-load, orientation overlay, first-day drawer). |
| v0.5 | 2026-06-11 | Added **Step 8 — Configure Agents** (4 seller-facing agents: Account Brief, Email Outreach, Opportunity Finder, Find More Contacts). Agent visibility configured per Tenant/Team/Seller with scope grants. Invite Sellers shifted to Step 9, Seller First-Run to Step 10. Seller First-Run orientation expanded from 4 to 5 steps to include agent affordances in Account view. |
| v0.6 | 2026-06-11 | Added **§16 — Seller Workspace (Ongoing Experience)**: workspace anatomy (book + whitespace + Plays sidebar + workbook), Enrich-with-AI for sellers (intent query engine), the agent-first Account view with one-click agent actions + activity feed, whitespace→book conversion flow, action-first design principles. Distinct from §15 (first-run only). |

---

*Living document. Next iteration: close open questions from engineering review, add wireframes, deepen agent trust-tier model.*
