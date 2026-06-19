# RGI Platform — Sales Co-Pilot Narrative

This doc is for engineers picking up RGI for the first time. It's not a spec — it's a walkthrough of what the product is, why each piece exists, and how the pieces compose into a real experience for two people: **Priya**, a RevOps Admin, and **Alex**, an Account Executive. If you understand the journey these two go through, the data model and the code are easy to follow.

There is no roadmap discussion here, no acceptance criteria, no API contracts. Read this when you're new, when you're context-switching back in after time away, or when you're about to argue with a designer about why something works the way it does.

---

## The cast of characters

| Persona | Role | What they care about |
|---|---|---|
| **Priya** | RevOps Admin | The tenant is set up correctly. The right accounts are in scope. The plays sellers run are sharp. The integrations work. The data is trustworthy. |
| **Alex** | Account Executive | "Who do I work today and what do I say?" Alex doesn't want to configure anything. Alex wants the workbook to already know the answers. |

Everything we build serves one of these two people. If a feature doesn't help Priya configure or Alex execute, it shouldn't exist.

---

## Day one — tenant onboarding

When a new tenant signs up, we don't ask them to fill out a 40-field form. We ask them for their company URL and let our agents do the work. The agents extract a *tenant context* — a structured snapshot of who this company is and what they sell. Priya then reviews and confirms.

### What the agent extracts

This is the tenant's identity inside RGI. Every other surface in the product reads from this object.

| Field | Why it exists |
|---|---|
| **Products** | The literal SKUs the tenant sells. Wiz sells *Cloud Security Platform*, *Code*, *Defend*. |
| **Pain points** | What problems these products solve for the tenant's customers. "Misconfigured cloud workloads." "Insecure code shipping to prod." Used by the AI to write briefs, emails, and rank signals. |
| **Competitors** | Who shows up in deals against them. Used to flag displacement opportunities ("this account has Palo Alto Prisma installed and it's declining"). |
| **Intent topics** | Search/research topics that signal a buyer is in-market. "CNAPP", "Zero Trust", "DSPM". Used to score Intent. |
| **Buying committee** | Roles that show up in their deals — CISO, VP Security Engineering, CFO. Used to find stakeholders inside target accounts. |
| **Target ICP** | The firmographic profile of their best customers: industries, revenue, geography, employee count. The **single most important field** — it bounds the entire universe of companies we surface. |
| **Partners** | Companies whose presence in an account is a *positive* signal — co-sell partners, integration partners, channel partners. |
| **Tech stack signals** | Same idea, technographic: technologies the tenant works well with. AWS, Kubernetes, Terraform, Snowflake — if an account runs these, the tenant has a story to tell. |

**Partners and Tech Stack signals do similar work**: both are *positive presence indicators*. If Snowflake is in the account, Wiz's data-security pitch lands. If Datadog is the observability stack, Wiz's runtime-defense pitch is easier. We track them separately because partners need explicit attribution and tech stack is data-derived, but functionally they answer the same question: *"Does this account look like an account we already win in?"*

Priya can edit any of this later. The agents give her a 95% draft, not a final answer.

---

## From tenant context to offerings

Here's where it gets interesting. **Products are not the same as Offerings.** Engineers often conflate them. They shouldn't.

> A **product** is what you build. An **offering** is *how you sell it.*

A few examples will make this concrete:

- **Tenant A** sells two products. They sell each one separately. → **2 products, 2 offerings.**
- **Tenant B** sells one product. They sell it to Enterprises with a different pitch, motion, and price than they sell to Startups. → **1 product, 2 offerings.**
- **Tenant C** has three products but bundles them into a single platform sale. → **3 products, 1 offering.**

This distinction matters because everything downstream — fit scoring, account briefs, sales plays, win/loss reporting — happens at the **offering level**, not the product level. Offerings are the unit of go-to-market. Products are the unit of engineering.

### The Offering object

An offering is a richer object than tenant context because it has to capture the *specific* motion this product line goes to market with. Here's what it contains:

| Field | What it represents |
|---|---|
| **Product(s)** | One or more — links back to the tenant's product list |
| **Description** | "Cloud Native Application Protection for multi-cloud enterprises" — the pitch in one sentence |
| **Pain points solved** | A subset of tenant pain points — *specifically the ones this offering addresses* |
| **Competitors** | Who you actually run into in these deals (may be different than tenant-wide competitors) |
| **Target ICP** | The firmographic profile *for this offering* — industries, revenue, geography, employee count |
| **Partners** | Partner footprint that signals offering fit |
| **Tech stack signals** | Technographic presence that signals offering fit |
| **Buying committee** | Roles that show up in deals for *this offering* (a CISO buys CNAPP; a VP Engineering buys Code Security) |
| **Intent topics** | The research topics that suggest someone is shopping for this offering specifically |
| **GTM motion** | How you sell this — Competitive Takeout, New Logo, Cross-sell / Expansion, Renewal Defense, In-Market |

### A critical relationship: Tenant ICP ⊇ Offering ICP

> An offering's Target ICP is a **subset** of the tenant's Target ICP.

If the tenant sells to Banking + Tech, the offering can sell to Banking only, or to Banking + Tech, but not to Banking + Tech + Retail. Retail isn't in the tenant ICP — it can't be in any offering's ICP.

**This is theory, not enforcement.** The platform does not check subset relationships at runtime. Admins can configure anything they want. We document the hierarchy because it's how engineers should *think* about the data model, but we never block, warn, or auto-correct. If discipline matters, that's the admin's job.

### Why we let Priya confirm offerings explicitly

The agent extracts offerings from the website. Priya **must confirm at least one**. This is the smallest possible commitment we ask for — one confirmed offering is the minimum viable configuration for the platform to do anything useful. Without a confirmed offering, we don't know which Target ICP to use, which competitors to flag, which intent topics to score. Confirmation is the moment the tenant says *"this is our offering, ship it."*

---

## What happens after confirmation: the Workbook

Once Priya confirms an offering, the Workbook comes alive.

The Workbook is the **central surface** of Sales Co-Pilot. Think of it as a giant table of every company that fits the tenant's ICP, enriched with HG signals (technographic, intent, IT spend), with a Source column showing whether each company came from HG, the tenant's CRM, or both.

The audience of the Workbook is **the tenant ICP, period**. Not an offering ICP — the *tenant* ICP, because the Workbook spans every offering the tenant sells. Each row carries scores for every offering side by side, so Priya can see at a glance: *"JPMorgan is a 96 for Cloud Security, a 62 for Code, a 54 for Defend."*

### Workbook is not configurable in the way you might expect

We intentionally do not put a filter bar on the Workbook. There is no "+ Filter" button. There is no "Industry = Healthcare" toggle.

Why? Because if Priya needs to narrow the Workbook by industry, the right answer is one of two things:

1. **Edit the tenant ICP.** If you don't actually sell to a segment, take it out of ICP. Don't filter — change the source of truth.
2. **Build a Sales Play.** Plays are the unit of slicing. They're shareable, named, measured, and they carry actions. Filtering the Workbook ad-hoc is a worse version of building a play.

This is the most important design decision in the product. We will be tempted, repeatedly, to add filters to the Workbook. Resist. The Workbook is *the universe*. Plays are *the slices*.

What the Workbook *does* expose:

- **Source tabs** (All Companies / Tenant Book / Whitespace / Needs Review) — these aren't filters, they're partitions by origin.
- **Saved views** — these capture columns, sort order, and AI-enriched questions. They never narrow the audience. Views can be shared (see below).
- **Enrich-with-AI** — Priya or Alex can ask a question across all rows ("Has this account had a CISO change in the last 6 months?") and the answer becomes a permanent column. Enrich runs across *every* account in the workbook, not a sampled subset.

### Sharing saved views

A saved view has the same visibility model as a play, scaled down:

| Visibility | Who sees it in their My Workbooks |
|---|---|
| **Just me** | Only the creator. The default. |
| **My team** | Sellers in the creator's team. |
| **Everyone** | Every persona in the tenant. |

This makes saved views a real collaboration surface for column layouts — e.g., Priya can craft a "QBR-prep view" with the right AI-enrichments and ship it to everyone in one click, no Slack message required. Storage-wise, private views live in the persona's local view bucket; shared views live in a global `rgi-workbook-views-shared` bucket, filtered by visibility on read.

Saved views still do not refine the audience. Sharing the column layout is not the same as sharing a play.

---

## Sales Plays — the actionable layer on top

A Sales Play is the most useful abstraction in the product.

> A **Play** is a named, ranked, actionable hypothesis about which subset of your market is most likely to convert *right now*.

Read that again. Every word matters:

- **Named** — Plays have identity. "Q3 CNAPP Competitive Takeout" is a thing you can discuss with your team.
- **Ranked** — Plays produce a sorted list of accounts. Highest signal at the top.
- **Actionable** — Plays carry actions. Briefs, emails, contact lists, outreach sequences. Sellers don't have to invent the next step.
- **Hypothesis** — Plays are bets, not certainties. We track outputs and outcomes so the team learns which hypotheses work.
- **Now** — Plays are temporal. The signal that fires *this week* is what makes a play active. Stale plays are weak plays.

### The Play object

| Field | What it represents |
|---|---|
| **Name** | "Competitive Takeout", "Net New Logo", "Expansion / Cross-sell" |
| **Description** | One sentence on the motion |
| **Associated offering** | **Exactly one offering.** This is a v1 constraint we're keeping deliberately — if a tenant has 3 offerings and wants 3 takeout plays, they build 3 separate plays. Multi-offering plays complicate audience inheritance, GTM motion language, and metric attribution; the gain isn't worth it yet. |
| **Motion type** | Competitive Takeout / New Logo / Expansion / Renewal Defense / In-Market / Catalyst |
| **Audience** | The "who" — see below |
| **Signals** | The "why now" — see below |
| **Visibility** | Who sees this play — Everyone (tenant-wide), Specific teams, or Just me (the creator) |
| **Actions** | The workflow bundle — generate brief, draft email, find contacts, push to outreach |
| **Metrics** | Outputs (briefs generated, emails drafted, contacts found) and outcomes (replies, meetings, opps) |

### Play Audience: inherits the offering's ICP, narrows further

A Play's Audience is a **further narrowing** of the offering's Target ICP. This is where the granular cuts live. There are three buckets:

1. **Technographics** — has Palo Alto Prisma installed, missing GitHub Advanced Security, Kubernetes-heavy, multi-cloud, etc. The 80% case.
2. **Intent-based** — active intent on CNAPP, high-level intent on Zero Trust, recent comparison research. The "why now" trigger.
3. **First-party CRM filters** (when CRM is connected) — Opportunity stage, account owner, last activity date, renewal window, open opp value. The play becomes territory-aware. Hidden in the play editor for v1; surfaced as a "Coming soon" preview.

**Important: the Audience inherits the offering's Target ICP live.** A play doesn't snapshot industries/regions/size at create time. When Priya later edits the offering's ICP (adds "Insurance" as an industry), every play that references that offering picks up the change automatically. If Priya wants a play to be *narrower* than the offering, she sets explicit overrides on the play's `firmoFilters` — those overrides win for the fields that are set, while empty fields keep inheriting.

A play that has CRM-side criteria but the tenant's CRM is disconnected gets a yellow ⚠ triangle on its card and a banner on its detail page: *"This play references CRM data but no CRM is connected."* It still runs (other criteria fire), but the admin sees that the configuration is broken.

### Signals — the firing condition

Every play has signals. An account appears in a play if **at least one signal fires**. The score is the sum of firing signal weights, multiplied by the offering fit. So an account that fires three high-weight signals on an offering it's a 90-fit for will land at the top of the ranked list.

Examples:

- "Palo Alto Prisma installed and aging" — fires the Competitive Takeout play
- "Active CNAPP RFP signal" — fires Net New Logo + Takeout + High-Intent Buyer
- "Existing CNAPP customer + champion identified" — fires Expansion / Cross-sell

### Sharing plays — Priya's leverage

When Priya creates a play, she chooses a visibility:

| Visibility | Who sees it |
|---|---|
| **Everyone** | All sellers in the tenant. Default for the canonical plays. |
| **Specific teams or sellers** | Multi-select teams + individual sellers. Useful for territory- or product-specific plays, or for piloting with one rep before rolling out. |
| **Just me** | Private to Priya. Used for drafts and experiments before publishing. |

Both pickers (teams + individual sellers) are live in the play create/edit drawer. Individual sellers are *additive* — a seller listed by name sees the play even if they're not in the selected teams. This makes "share with a single rep" a one-click operation without inventing a team for them.

Visibility is how a play stops being a Priya artifact and becomes a Priya-to-Alex artifact. The moment Priya publishes a play to "Everyone," every seller in the tenant sees that play in their sidebar.

---

## How Alex sees the world

Alex never sees the Admin Hub. Alex never edits tenant context or offerings. Alex lives in Sales Co-Pilot.

The seller experience is:

1. **Workbook** — Alex's book of accounts, ranked. Same columns as Priya sees, just filtered to Alex's owned accounts.
2. **Sales Plays in the sidebar** — every play Priya has published with visibility = Everyone (or to a team Alex belongs to). Clicking a play filters the Workbook to that play's audience.
3. **Account threads** — clicking into a row opens that account's profile with HG enrichment, MEDDIC tracking, AI chat, stakeholders, and the action bundle.
4. **Actions** — when Alex picks an account from a play, the workflow bundle is already wired up. Generate brief. Draft email. Find contacts. Push to sequence. Alex approves; the agent ships.

Alex's mental loop: *open the workbook → pick a play → work the top accounts → take the suggested actions*. That's the whole game.

---

## The mental model in one diagram

```
TENANT ────────────────────────────────────────────────────
│ Products, pain points, competitors, intent, committee,
│ tenant ICP, partners, tech stack
│
│  contains 1..N
│
├── OFFERING ──────────────────────────────────────────────
│   │ Product(s), pitch, pain points, competitors,
│   │ offering ICP (⊆ tenant ICP), partners, tech stack,
│   │ committee, intent topics, GTM motion
│   │
│   │  referenced by 0..N
│   │
│   ├── PLAY ──────────────────────────────────────────────
│   │   │ Name, motion, signals (why now),
│   │   │ audience (offering ICP + technographic + intent +
│   │   │   CRM filters; soft-warned outside offering/tenant ICP),
│   │   │ actions (brief, email, contacts, sequence),
│   │   │ visibility (tenant / teams / just me),
│   │   │ metrics (outputs + outcomes)
│   │   │
│   │   └── consumed by sellers via sidebar
│   │
│   └── WORKBOOK ─────────────────────────────────────────
│       │ Every account in tenant ICP, enriched with HG +
│       │ CRM signals. Per-row score per offering. Source
│       │ column shows origin (HG / CRM / Both).
│       │
│       └── consumed by both Priya (review/configure) and
│           Alex (work my book)
```

The three concentric scopes: **Tenant ICP ⊇ Offering ICP ⊇ Play Audience**. Everything else hangs off this hierarchy.

---

## The object graph — what filters what

This section is for the engineer who needs to know **exactly** what is being filtered, where, against what. Read this once and the rest of the code becomes self-explanatory.

### The five objects

```
┌──────────────────────────────────────────────────────────┐
│ TENANT                                                   │
│ One per customer account. Extracted on signup, edited by │
│ admin in Admin Hub → Tenant Profile.                     │
│                                                          │
│   id, name, url, derivedAt                               │
│   products[]              SKUs the tenant builds         │
│   painPoints[]            problems they solve            │
│   competitors[]           who they run into              │
│   intentTopics[]          research topics they care about│
│   buyingCommittee[]       roles they sell to (not people)│
│   partners[]              positive-signal partners       │
│   spendCategories[]       IT-spend lenses                │
│   fai                     {revenue, headcount, hq, stage}│
│   icp                     ★ the audience-defining field  │
│     ├─ industries[]                                      │
│     ├─ geos[]                                            │
│     ├─ revenueBand        {low, high}                    │
│     ├─ employeeBand       {low, high}                    │
│     └─ techStack[]                                       │
└──────────────────────────────────────────────────────────┘
            │
            │ has 1..N
            ▼
┌──────────────────────────────────────────────────────────┐
│ OFFERING                                                 │
│ How the tenant sells to market. Many offerings can share │
│ one product (Enterprise vs Startup tier); one offering   │
│ can bundle many products. Must be confirmed by admin.    │
│                                                          │
│   id, name, key (cnapp|code|cdr|custom), confirmed       │
│   description, painPointsSolved[]                        │
│   products[]                  refs Tenant.products       │
│   competitors[]                                          │
│   targetIcp                   ★ subset of Tenant.icp     │
│     ├─ industries[]                                      │
│     ├─ employeeBand                                      │
│     ├─ revenueBand                                       │
│     └─ geography[]                                       │
│   partners[]                                             │
│   techStack[] / techSignals[]                            │
│   buyingCommittee[]           roles for THIS offering    │
│   intentTopics[]                                         │
│   gtmMotion                   displacement | new_logo |  │
│                               expansion | renewal | ...  │
└──────────────────────────────────────────────────────────┘
            │
            │ referenced by 0..N (each play picks exactly 1)
            ▼
┌──────────────────────────────────────────────────────────┐
│ PLAY                                                     │
│ A named, ranked, actionable hypothesis. v1 constraint:   │
│ every play references EXACTLY ONE offering. Customers    │
│ with multiple offerings build one play per offering.     │
│                                                          │
│   id, name, description, motion                          │
│   offering_id                 ★ exactly 1                │
│   audience_roles[]            AE | AM | CSM | SDR        │
│   signals[]                   ranking signals (why now)  │
│   firmoFilters                ★ OVERRIDES — empty fields │
│     ├─ industries[]             inherit from offering    │
│     ├─ sizeBand                 ICP live, no snapshot    │
│     └─ regions[]                                         │
│   technoFilters               play-specific (no inherit) │
│     ├─ hasInstalled[]                                    │
│     ├─ missingInstall[]                                  │
│     └─ custom[]                                          │
│   audienceFilters[]           spec-driven HG filters     │
│                               (see FilterRegistry below) │
│   visibility                  tenant | team | private    │
│   teamIds[], userIds[]        gating when visibility=team│
│   status, recommended_workflows[]                        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ ACCOUNT (company shown in the Workbook)                  │
│ A row in the workbook. Source field captures origin.     │
│                                                          │
│   id, name, url, logoColor                               │
│   industry, fai {revenue, employees, hq, stage}          │
│   source                      ★ matched | crm | hg       │
│   presentIn                   {hg, salesforce, hubspot}  │
│   parentId, subsidiaries[]    company hierarchy          │
│   ownerIds[]                  which sellers own it (CRM) │
│   stage                       CRM opp stage              │
│   meddic, stakeholdersCount, buyingCommitteeCount        │
│   rgif                        ★ all HG enrichment        │
│     ├─ installs[]                                        │
│     ├─ intent[]                                          │
│     ├─ spend                  per spendCategory          │
│     ├─ clouds[]                                          │
│     └─ partnerStack[]                                    │
│   signals[]                   firing signals on this acct│
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ WORKBOOK VIEW (saved view)                               │
│ A LAYOUT, not an audience. Captures columns/sort/AI Q's. │
│                                                          │
│   id, name, ownerId, source (book|whitespace)            │
│   columns[]              built-in + AI-enriched          │
│   sort                   {columnId, dir}                 │
│   visibility             private | team | tenant         │
│   teamIds[], userIds[]                                   │
└──────────────────────────────────────────────────────────┘
```

### Account × Offering → Fit

The most important *derived* relationship in the system. For every `(account, offering)` pair there's an entry in the FITS table:

```
FIT { accountId, offeringId, score (0–100), reasons[] }
```

This is what the Workbook displays as offering-score columns and what plays use to rank accounts. The resolver (`resolveOfferingFit` / `resolveFitScore`) tries `offering.id → offering.key → KEY_FALLBACKS[key]` so wizard-saved offering ids still resolve to canonical fit data.

### What gets filtered, when, against what

This is the question engineers will ask themselves over and over. Here's the answer.

| Surface | Audience baseline | Additional filters applied |
|---|---|---|
| **Workbook — All Companies tab** | Every Account where `Account.icp` matches `Tenant.icp`* | Source partition (no filter) |
| **Workbook — Tenant Book tab** | Same baseline, restricted to `Account.source ∈ {matched, crm}` | — |
| **Workbook — Whitespace tab** | Same baseline, restricted to `Account.source === 'hg'` | — |
| **Workbook — Needs Review tab** | `Account.source === 'crm'` (in CRM, no HG match) | — |
| **Workbook + Play active** | Play's effective audience (see below) | Source partition |
| **Sales Play (ranked list)** | Account fits Play's effective audience AND ≥1 signal fires | — |
| **Saved View** | Inherits its parent Workbook tab's audience | None — views NEVER refine audience |
| **Enrich-with-AI** | Restricted to Tenant Book accounts | — |

\* "Matches" is the operative word here. We don't actually enforce this — `Tenant.icp` is documentation, and the Workbook today shows every Account known to the platform, on the assumption that the Account dataset is *already* filtered to ICP-relevant rows at the source. Engineering note: when scale becomes real, this is where the ICP filter has to actually run.

### A Play's "effective audience" is layered

When a play is active, its audience is computed by `getEffectivePlayAudience(play, offering)`:

```
effective.industries  = play.firmoFilters.industries.length > 0
                          ? play.firmoFilters.industries
                          : offering.targetIcp.industries     ← inherited
effective.sizeBand    = play.firmoFilters.sizeBand
                          || offering.targetIcp.employeeBand  ← inherited
effective.regions     = play.firmoFilters.regions.length > 0
                          ? play.firmoFilters.regions
                          : offering.targetIcp.geography      ← inherited

// these don't inherit — they're play-specific:
effective.technoFilters     = play.technoFilters
effective.audienceFilters[] = play.audienceFilters
```

Result: when admin adds an industry to an offering's ICP, every play that hasn't explicitly overridden `industries` picks up the new industry on next render. No snapshotting.

### The filter chain in WorkbookRoute (in order)

```
1. Start with the full Account universe (Tenant ICP — implicit).
2. Apply the source tab partition.            ← All / Book / Whitespace / Needs Review
3. If a Play is active:
     a. effective = getEffectivePlayAudience(play, offering)
     b. require resolveFitScore(account, offering) >= 50
     c. require at least one of play.signals fires on account
     d. require account.industry in effective.industries (if non-empty)
     e. require account.employees within effective.sizeBand
     f. require account.hq matches effective.regions
     g. require account.installs satisfies technoFilters
     h. require all play.audienceFilters predicates pass
4. Sort by the active view's sort column.
```

Read the workbook code with this list in hand and every `if` becomes obvious.

---

## Workbook view modes — Flat vs Segmented

The Workbook has two view modes, and they answer two different questions.

### Flat view — "show me one row per company, across all offerings"

Default for admins. Use when you want a single table with offering scores side-by-side.

Columns (left to right):
- **Account** (with subsidiary hierarchy indicator)
- **Source** (HG / SFDC / HubSpot icon stack)
- **Score per offering** — one column per confirmed offering
- **Employees**
- **Revenue**
- **Buying Committee** — count of stakeholders matched at this account
- **IT Spend** — values for the tenant's tracked spend categories
- **HQ location**
- **Industry**
- **HG Intelligence** — AI synthesis: which offering to lead with + entry point
- *Enriched columns* (any AI questions saved as columns)

### Segmented view — "show me each offering's best accounts, ranked"

Use when you want to see the strongest accounts per offering, with offering-specific context (competitive landscape, intent, partners).

Layout: one section per offering. Inside each section, accounts sorted **descending by that offering's fit score**.

Columns (per-offering section):
- **Account** + tier badge (A/B/C/D from score)
- **Employees**
- **Revenue**
- **Buying Committee** — count of stakeholders for that offering's committee
- **Competitive** — competitor footprint detected (offering-aware)
- **Intent** — intent topics firing for this offering
- **Partner Stack** — partners present in the account
- **HG Intelligence** — *why* this offering fits this account (narrative)

The two views share the same row-set (every Account in the tenant ICP). They differ only in column layout and grouping.

---

## CRM-gated experience

Until the tenant connects a CRM or uploads a book of accounts, the Workbook only knows about HG-side accounts (whitespace). That changes the Workbook in three meaningful ways:

| State | Behavior |
|---|---|
| **No CRM connected, no book uploaded** | Workbook shows only the **Whitespace** view. A banner at the top of the workbook reads: *"Upload your book of accounts or connect a CRM to unlock Tenant Book + Enrich-with-AI."* Source tabs are hidden — there's nothing to switch between. Enrich-with-AI is disabled. |
| **CRM connected OR book uploaded** | Source tabs unlock: **All Companies / Tenant Book / Whitespace / Needs Review**. Enrich-with-AI is enabled — but **only on the Tenant Book tab**. |

### Why Enrich-with-AI is restricted to Tenant Book

Enrich-with-AI runs the asked question across every row in the current view. The HG whitespace can be hundreds of thousands of accounts. Running an LLM question across all of them is wasteful and expensive — the right scope is the tenant's owned book. So the button is enabled only when `source === 'book'`, and disabled (with a tooltip explanation) on the other tabs.

---

## Where this lives in the code

A light map for orientation. Treat these as starting points, not boundaries.

| Concept | Files |
|---|---|
| Tenant context | `src/data/tenants.js`, `src/context/TenantContext.jsx` |
| Offerings (canonical + legacy adaptation) | `src/data/configStore.js`, `src/data/offerings.js`, `src/data/offerings.legacy.js` |
| Plays (canonical + legacy + visibility) | `src/data/plays.js`, `src/data/plays.legacy.js`, `src/data/configStore.js` (adaptLegacyPlay, ensureLegacyPlayFields, migrateStaleState) |
| Play editor — drawer | `src/components/onboarding/StepPlays.jsx` (ManagePlayDrawer) |
| Play detail page | `src/routes/PlaysRoute.jsx` (PlayDetail) |
| Audience builder (HG filter spec catalog) | `src/data/filterRegistry.js`, `src/components/workbook/FilterPanel.jsx` |
| Workbook (the universe) | `src/routes/WorkbookRoute.jsx` |
| Seller workbook table | `src/components/workbook/SellerWorkbookTable.jsx` |
| Fit scoring (account × offering) | `src/data/accountOfferingFit.js` (FITS table + resolveFit pattern) |
| Source classification | `src/data/unifiedWorkbook.js` |
| Module switcher (Sales Co-Pilot vs Admin Hub) | `src/components/chrome/ModuleSwitcher.jsx` |
| Admin sidebar (module-aware) | `src/components/chrome/SidebarAdmin.jsx` |

---

## Engineering open questions

Things this doc deliberately does *not* solve — flagged for the next round of design:

- **Scale of the Workbook**: in production the tenant ICP universe is plausibly 100K–500K companies. Demo is 37 rows. We need to decide between server-side pagination + lazy enrichment vs. full client-side render. Affects sort, Enrich-with-AI cost, and table virtualization.
- **ICP taxonomy**: industries/geos are free-text today, which is why we don't enforce subset. Canonical NAICS codes + ISO geos would let us actually check hierarchy. We chose not to enforce because we don't yet have the taxonomy — once we do, the soft-warn pattern can come back if you want it.
- **Offering changes propagate live, but signals don't.** When an offering's signals list changes, plays that reference removed signals will silently no-op. We should at minimum surface this in the play detail.
- **Outcome telemetry needs CRM write-back.** Output metrics (briefs generated, emails drafted) live in RGI. Outcome metrics (meetings booked, opps created, revenue) live in CRM. Without a two-way sync, plays remain hypotheses we never validate.
- **Agent extraction pipeline confidence + re-extraction cadence** is one paragraph in this doc. It's half the perceived magic of the platform. Worth its own design doc.
- **Play-to-play conflict**: when an account fires three plays, sellers see it in three lists. No "best play" classifier — by intent. Sellers pick via the account chat. Watch for confusion in user testing.

## What to remember

- **The Workbook is the universe; Plays are the slices.** Resist adding filters to the Workbook.
- **Tenant ICP ⊇ Offering ICP ⊇ Play Audience.** The hierarchy is the architecture (documented, not enforced).
- **Offerings ≠ Products.** Offerings are how you sell. Products are what you build.
- **One play, one offering.** Multi-offering plays are a v2 problem.
- **Plays inherit offering ICP live.** Edit the offering ICP → every play that hasn't overridden picks it up.
- **Plays carry actions. Saved views do not.** That's the line between them.
- **Confirmation is the moment.** A tenant isn't real to the platform until Priya confirms an offering.
- **Visibility makes plays leverage.** A play in "Just me" is a draft. A play in "Everyone" is the tenant's playbook.
- **No CRM, no Tenant Book.** Source tabs and Enrich-with-AI light up only after CRM connect / book upload.
- **Enrich-with-AI runs on Tenant Book only.** Not on whitespace. The scope is your book.
- **Alex never configures.** If Alex has to set something up, we've failed Alex.

That's the whole product.
