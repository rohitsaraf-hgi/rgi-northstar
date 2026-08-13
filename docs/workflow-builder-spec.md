# Workflow Builder — Engineering Specification

**Product:** Sales Copilot · **Surface:** `/workflows` (rep-facing) + `/admin/workflows` (governance) · **Version:** v1 spec · **Status:** Ready for build

---

## 1. Purpose

Enable reps and RevOps to visually configure multi-step workflows: **Trigger → Records → Actions → Outputs**. Reps run and monitor; admins govern. Every node is composable and typed so the runtime is predictable and debuggable.

**In v1:**
- Visual builder (drag-drop nodes, connect edges)
- 5 node categories (Trigger · Data · Agent · Tool · Control)
- Human approval gates + node-level rerun
- Signal / Schedule / Manual triggers
- Draft → Published lifecycle with version history
- 5 seeded templates

**Out of scope for v1 (Phase 2):** natural-language authoring, workflow marketplace, custom-code/webhook nodes, cross-workflow orchestration, rollback UI.

---

## 2. Building Blocks

### 2.1 Five Node Categories

| Category | Role | Color | Cardinality per workflow |
|---|---|---|---|
| **Trigger** | Starts the workflow | Rose | Exactly 1, entry node |
| **Data**    | Produces a record set (accounts / contacts) | Blue  | 0+ (usually 1) |
| **Agent**   | AI-produced artifact (brief, email, battlecard) | Violet | 0+ |
| **Tool**    | Atomic external side effect | Emerald | 0+ |
| **Control** | Human approval, branch, wait, loop, notify | Amber | 0+ |

### 2.2 Node Type Catalog (v1)

**Trigger nodes** (exactly one, always the entry)

| Type | Config | Emits |
|---|---|---|
| `trigger.manual` | `workbench_tile_label` | `void` |
| `trigger.scheduled` | `cron_expression`, `timezone` | `void` |
| `trigger.signal` | `signal_id` (from First-Party Signal Studio), `dedupe_window_hours` | `account_list` (accounts on which the signal fired) |

**Data nodes** (produce record sets)

| Type | Config | Inputs | Outputs |
|---|---|---|---|
| `data.workbook` | `workbook_id` | — | `account_list` |
| `data.filter` | `filter_expression` (composed via existing FilterRegistry primitives) | `account_list` | `account_list` |
| `data.contact_query` | `role_filter`, `seniority_filter`, `engagement_min` | `account_list` | `contact_list` |

**Agent nodes** (return structured artifact)

| Type | Config | Inputs | Outputs |
|---|---|---|---|
| `agent.account_brief` | tone, length, `system_prompt_override`, `references[]` | `account_list` | `brief_list` |
| `agent.draft_email` | tone, length, `system_prompt_override`, `references[]` | `account_list`, optional `contact_list`, optional `brief` (as context) | `email_list` |
| `agent.competitive_battlecard` | `competitor`, `system_prompt_override`, `references[]` | `account_list` | `battlecard_list` |
| `agent.find_buying_committee` | `roles[]`, `seniority_min` | `account_list` | `contact_list` |
| `agent.meeting_prep` | `meeting_context`, `references[]` | `account_list`, optional `contact_list` | `prep_notes_list` |

**Tool nodes** (atomic external side effect)

| Type | Config | Inputs | Outputs |
|---|---|---|---|
| `tool.crm.add_contacts` | dedupe strategy (skip/merge/create), `field_map` | `contact_list` | `contact_ids`, `duplicates` |
| `tool.crm.add_accounts`  | dedupe strategy, `field_map` | `account_list` | `account_ids`, `duplicates` |
| `tool.crm.update_field`  | `object`, `field`, `value_expression` | `account_list` \| `contact_list` | `updated_ids` |
| `tool.enrich.contacts`   | provider (ZoomInfo / Apollo / Clearbit) | `contact_list` | `contact_list` (enriched) |
| `tool.sequence.add`      | `provider` (Outreach/SalesLoft/Gong), `sequence_id` | `contact_list`, optional `email` | `sequence_run_ids` |
| `tool.notify.slack`      | `channel_or_user`, `template` | any (attached as context) | `void` |
| `tool.notify.email`      | `to`, `subject_template`, `body_template` | any | `void` |
| `tool.export.csv`        | `filename`, `destination` (Drive/S3/local) | any list | `file_url` |

**Control nodes**

| Type | Config | Inputs | Outputs |
|---|---|---|---|
| `control.approval` | `approver_role` (AE/Manager/CSM), `timeout_hours`, `notification_target` | any | passes through same type on approve; `void` on reject |
| `control.branch` | `condition_expression` (single condition v1) | any | two outputs: `true` (same type), `false` (same type) |
| `control.wait` | `duration`, `unit` (minutes/hours/days) | any | same type, passthrough |
| `control.loop_for_each` | `max_concurrency` (default 20) | any `*_list` | element type per iteration |
| `control.merge` | — | multiple typed inputs | combined list |

### 2.3 Universal Node Schema

```jsonc
{
  "id": "node_a1b2c3",
  "type": "agent.draft_email",
  "category": "agent",
  "label": "Draft displacement email",
  "position": { "x": 400, "y": 320 },

  // User-editable configuration for this node type
  "config": {
    "tone": "consultative",
    "max_length_words": 180,
    "system_prompt_override": "You are an SDR at HG. Lead with the differentiator vs. {{competitor}} and reference the specific renewal timing...",
    "references": [
      { "kind": "kb_doc", "id": "kb_wiz_vs_lacework_v3",     "label": "Wiz vs Lacework battlecard" },
      { "kind": "pdf",    "asset_id": "asset_case_study_db", "label": "Databricks case study",     "url": "s3://..." },
      { "kind": "url",    "url": "https://internal.hginsights.com/positioning/cnapp" }
    ]
  },

  // Typed contracts — edges connect matching types only
  "inputs": [
    { "name": "accounts",  "type": "account_list", "required": true },
    { "name": "committee", "type": "contact_list", "required": false, "hint": "If linked, personalize to top persona" },
    { "name": "brief",     "type": "brief",        "required": false, "hint": "Use as context for the email" }
  ],
  "outputs": [
    { "name": "email", "type": "email_list" }
  ],

  // Engineering-controlled runtime; users can override retry policy only
  "runtime": {
    "on_error": "fail",       // fail | skip | retry
    "max_retries": 3,
    "backoff_ms": [1000, 4000, 16000],
    "timeout_seconds": 60
  }
}
```

**Rules:**
- `config` is user-editable per node type. Every agent node MUST support `system_prompt_override` and `references[]`.
- `inputs[]` and `outputs[]` are the typed contract. **Edges can only connect matching types** (or types with a registered adapter — see §2.5).
- `runtime` defaults are engineering-owned; only `on_error` + `max_retries` are user-tunable.

### 2.4 Edge Schema

```jsonc
{
  "id": "edge_...",
  "from": { "node_id": "node_a1b2", "output_name": "email" },
  "to":   { "node_id": "node_c3d4", "input_name":  "attachment" },
  "transform": null   // v1: null; v2: optional field-mapping expression
}
```

### 2.5 Edge Data Types + Auto-Adapters (v1)

**Types on the wire:**
- `account_list` — `[{account_id, name, industry, ...core fields}]`
- `contact_list` — `[{contact_id, name, email?, phone?, role?, account_id}]`
- `brief_list` — `[{account_id, html, pdf_url?, markdown, sources[]}]`
- `email_list` — `[{account_id, subject, body_html, body_text, to?, tone}]`
- `battlecard_list` — `[{account_id, html, pdf_url?, competitor, differentiators[]}]`
- `prep_notes_list` — `[{meeting_id?, notes_html, key_moments[]}]`
- `contact_ids` / `account_ids` — `[string]`
- `boolean` — from `control.branch`
- `void` — control passthrough
- `file_url` — from `tool.export.csv`

**Auto-adapters engineering ships (users don't author these):**
- `brief_list` → `email.attachments`
- `battlecard_list` → `email.attachments`
- `contact_list` → `tool.crm.add_contacts.input`
- `contact_list` → `tool.sequence.add.input`
- `email_list` → `tool.notify.email.body`
- `brief_list` → `tool.notify.slack.attachment`

If the source type isn't in the adapter table and doesn't match the target type, the UI blocks the connection with a clear error ("`email` cannot connect to `contact_list` — no adapter registered").

---

## 3. Runtime Model

### 3.1 Two Entities

**Workflow (definition, versioned)**

```jsonc
{
  "id": "wf_...",
  "name": "Competitive displacement — Lacework renewal",
  "description": "Fires when a competitor renewal window opens; runs full displacement play with approval gate.",
  "version": 4,
  "status": "draft" | "live" | "archived",
  "trigger_node_id": "node_trigger",
  "nodes": [ /* Node[] */ ],
  "edges": [ /* Edge[] */ ],
  "owner_id": "user_priya",
  "governance": {
    "requires_admin_approval_to_publish": true,
    "tenant_visibility": "all" | "team:sec_sales" | "user:alex"
  },
  "created_at": "...", "updated_at": "..."
}
```

**Run (execution, immutable snapshot of the version at start)**

```jsonc
{
  "id": "run_...",
  "workflow_id": "wf_...",
  "workflow_version": 4,
  "started_by": { "kind": "user"|"signal"|"schedule", "id": "..." },
  "status": "pending" | "running" | "paused" | "completed" | "failed" | "cancelled",
  "started_at": "...", "completed_at": "...",
  "node_states": {
    "node_a1b2": {
      "status": "succeeded" | "running" | "waiting_approval" | "failed" | "skipped",
      "started_at": "...", "ended_at": "...",
      "input_snapshot": { "accounts": [...] },
      "output_snapshot": { "email": [...] },
      "error": null,
      "attempts": 1,
      "cost": { "tokens_in": 1234, "tokens_out": 567, "usd": 0.02 }
    }
  }
}
```

Node input/output snapshots are stored so runs are **debuggable, replayable, and auditable**.

### 3.2 Execution Semantics

- **Idempotent triggers.** `trigger.signal` dedupes by `(signal_id, account_id, dedupe_window_hours)`. Re-firing within window does not spawn a new run.
- **Approval nodes** pause the run. Pending approvals older than `timeout_hours` auto-cancel the run and notify.
- **Fan-out (`loop_for_each`)** runs child subgraph in parallel bounded by `max_concurrency`. `control.merge` waits for all to complete.
- **Failure** default is `fail-and-halt`. Per-node override to `skip-and-continue`.
- **Retries** exponential backoff (`1s → 4s → 16s`), max 3. Only for transient errors (network, rate limit).
- **Concurrency cap per tenant**: default 20 parallel runs. Excess are queued.
- **Cost tracking**: every agent node records token I/O and $ cost to `node_states.cost`; roll up to run + workflow totals.

---

## 4. Storage

Two tables (or two collections):

- **`workflows`** — one row per version. Publishing creates a new version and archives the prior. Look up by `id` returns the latest live version by default; `?version=N` for a specific one.
- **`workflow_runs`** — one row per execution. `node_states` blob is JSONB, indexed by `(workflow_id, status, started_at DESC)` for the run history view.

---

## 5. UI Surfaces

### 5.1 Builder Canvas

- **Left rail: node palette** — 5 category tabs, drag onto canvas
- **Center: graph** — nodes render as cards with icon + category chip + config summary line; edges labeled with output-type
- **Right rail: Node Config Panel** for the selected node (see §5.2)
- **Toolbar**: Save · Test run · Publish · Version history · Diff-against-live

Selection + wiring UX:
- Click node → right rail loads config
- Drag from output port → dashed edge preview → drop on compatible input port
- Incompatible target grays out with tooltip explaining the type mismatch
- Auto-layout button (optional in v1)

### 5.2 Node Config Panel — required fields per node type

Common to every node: `label`, `description`, `on_error`, `max_retries`.

**Agent nodes** additionally:
- **Tone** (consultative / direct / warm) — dropdown
- **Max length** — number input
- **System prompt override** — full editable textarea, with the default agent system prompt shown as placeholder. Empty = use default.
- **References** — multi-select against a shared **Reference Library** (§7):
  - KB doc (from Confluence / Doc360 / internal wiki)
  - PDF asset (uploaded to tenant asset library)
  - URL (arbitrary link with metadata)
- **Model** — v1: hidden (tenant-default). v2: expose.

**Tool nodes** additionally:
- **Field mapping** — grid of `output_field → target_field` (mandatory for CRM writes)
- **Dedupe strategy** (CRM tools) — skip / merge / create-anyway
- **Provider selection** (sequence, enrichment) — dropdown from tenant integrations

**Control nodes** additionally:
- **Approval**: `approver_role`, `timeout_hours`, `notify_via` (slack/email), `notify_target`
- **Branch**: rule expression against any prior output field (v1: single condition; v2: full boolean expression)
- **Wait**: duration + unit
- **Loop**: max concurrency, error strategy per iteration

**Trigger nodes** additionally:
- **Manual**: workbench tile label + description shown to reps
- **Scheduled**: cron string (with plain-English preview), timezone
- **Signal**: signal picker (from Signal Studio), dedupe window in hours

### 5.3 Test Run

- Rep picks a sample account (or workbook) and clicks **Test Run**
- Executes in dry-run mode: agent nodes produce real output; tool nodes render a **"would do" preview** (no side effects)
- Node-by-node inspector shows input/output snapshots + errors
- Estimated cost + duration surfaced before + after

### 5.4 Run History (rep-facing at `/workflows/:id/runs`)

- Table of runs: started at · trigger · status · duration · cost · owner
- Drill in → **node-by-node timeline** with status, duration, snapshot viewer, error trace
- **Approvals inbox** at `/workflows/approvals`: all pending approvals across workflows, grouped by workflow

---

## 6. Governance

- **Draft → Published**: draft workflows can be test-run but do NOT fire on signals or run on schedule.
- **Publish gate**: workflows containing `tool.crm.*`, `tool.enrich.*`, or `tool.sequence.*` require admin approval to go live (tenant-configurable).
- **Version pinning**: runs record the workflow version at start and always execute that snapshot; edits to the definition never affect in-flight runs.
- **Audit log** per run: `started_by`, every tool-node side effect (payload hash + response), approver identities.
- **Rollback**: v1 via API only (set an older version to `live`); UI in v2.

---

## 7. Reference Library (cross-cutting)

Agent nodes reference documents. These live in a **shared Reference Library** at the tenant level so multiple workflows can reuse the same KB doc / battlecard / positioning PDF.

Reference schema:

```jsonc
{
  "id": "ref_...",
  "kind": "kb_doc" | "pdf" | "url" | "prompt_snippet",
  "label": "Wiz vs Lacework — Q3 battlecard",
  "source_id": "confluence:abc123" | "s3://..." | "https://...",
  "tenant_id": "...",
  "tags": ["competitive", "lacework", "cnapp"],
  "created_by": "user_...",
  "updated_at": "..."
}
```

The Reference picker in the Node Config Panel:
- Search by label + tag
- Preview inline (first 200 words for docs, thumbnail for PDFs)
- Multi-select up to 5 per node

---

## 8. Sample Workflow — End-to-End JSON

Matches the shape shown in the current prototype screenshot:

```jsonc
{
  "id": "wf_comp_displacement",
  "name": "Competitive Displacement — Lacework Renewal",
  "version": 1,
  "status": "draft",
  "trigger_node_id": "n_trigger",
  "nodes": [
    { "id": "n_trigger",  "type": "trigger.signal",           "category": "trigger", "label": "Competitor renewal window",
      "config": { "signal_id": "sig_competitor_renewal_window", "dedupe_window_hours": 168 },
      "outputs": [{ "name": "accounts", "type": "account_list" }] },

    { "id": "n_filter",   "type": "data.filter",              "category": "data",    "label": "Enterprise + Fintech only",
      "config": { "filter_expression": "industry in ['Fintech', 'Financial Services'] AND arr > 500000" },
      "inputs":  [{ "name": "in",  "type": "account_list", "required": true }],
      "outputs": [{ "name": "out", "type": "account_list" }] },

    { "id": "n_brief",    "type": "agent.account_brief",      "category": "agent",   "label": "Generate account brief",
      "config": { "tone": "consultative", "references": [{ "kind": "kb_doc", "id": "ref_positioning" }] },
      "inputs":  [{ "name": "accounts", "type": "account_list", "required": true }],
      "outputs": [{ "name": "briefs",   "type": "brief_list" }] },

    { "id": "n_committee","type": "agent.find_buying_committee","category":"agent",  "label": "Find security committee",
      "config": { "roles": ["Decision Maker", "Champion"], "seniority_min": "Director" },
      "inputs":  [{ "name": "accounts",  "type": "account_list", "required": true }],
      "outputs": [{ "name": "contacts",  "type": "contact_list" }] },

    { "id": "n_email",    "type": "agent.draft_email",        "category": "agent",   "label": "Draft displacement email",
      "config": { "tone": "consultative", "max_length_words": 180,
                  "system_prompt_override": "Lead with the differentiator vs. Lacework Polygraph...",
                  "references": [{ "kind": "kb_doc", "id": "ref_wiz_vs_lacework" }] },
      "inputs":  [
        { "name": "accounts",  "type": "account_list", "required": true },
        { "name": "committee", "type": "contact_list", "required": false },
        { "name": "brief",     "type": "brief_list",   "required": false }
      ],
      "outputs": [{ "name": "emails", "type": "email_list" }] },

    { "id": "n_approval", "type": "control.approval",         "category": "control", "label": "AE approval",
      "config": { "approver_role": "AE", "timeout_hours": 72, "notify_via": "slack" },
      "inputs":  [{ "name": "in",  "type": "email_list" }],
      "outputs": [{ "name": "out", "type": "email_list" }] },

    { "id": "n_add_crm",  "type": "tool.crm.add_contacts",    "category": "tool",    "label": "Add contacts to Salesforce",
      "config": { "dedupe_strategy": "merge", "field_map": { "role": "Contact.Role__c" } },
      "inputs":  [{ "name": "contacts", "type": "contact_list" }],
      "outputs": [{ "name": "ids", "type": "contact_ids" }, { "name": "duplicates", "type": "contact_ids" }] },

    { "id": "n_seq",      "type": "tool.sequence.add",        "category": "tool",    "label": "Add to Outreach cadence",
      "config": { "provider": "outreach", "sequence_id": "cad_wiz_displacement_v2" },
      "inputs":  [{ "name": "contacts", "type": "contact_list" }, { "name": "email", "type": "email_list", "required": false }],
      "outputs": [{ "name": "run_ids", "type": "sequence_run_ids" }] }
  ],
  "edges": [
    { "from": { "node_id": "n_trigger",   "output_name": "accounts" }, "to": { "node_id": "n_filter",    "input_name": "in" } },
    { "from": { "node_id": "n_filter",    "output_name": "out" },      "to": { "node_id": "n_brief",     "input_name": "accounts" } },
    { "from": { "node_id": "n_filter",    "output_name": "out" },      "to": { "node_id": "n_committee", "input_name": "accounts" } },
    { "from": { "node_id": "n_brief",     "output_name": "briefs" },   "to": { "node_id": "n_email",     "input_name": "brief" } },
    { "from": { "node_id": "n_committee", "output_name": "contacts" }, "to": { "node_id": "n_email",     "input_name": "committee" } },
    { "from": { "node_id": "n_filter",    "output_name": "out" },      "to": { "node_id": "n_email",     "input_name": "accounts" } },
    { "from": { "node_id": "n_email",     "output_name": "emails" },   "to": { "node_id": "n_approval",  "input_name": "in" } },
    { "from": { "node_id": "n_approval",  "output_name": "out" },      "to": { "node_id": "n_add_crm",   "input_name": "contacts" } },
    { "from": { "node_id": "n_approval",  "output_name": "out" },      "to": { "node_id": "n_seq",       "input_name": "contacts" } }
  ]
}
```

---

## 9. Seeded Templates (ship 5 with v1)

1. **Competitive Displacement** — signal(`competitor_renewal_window`) → workbook filter → find committee → account brief → draft email → AE approval → CRM add + sequence add
2. **Renewal Push** — schedule(weekly) → workbook(contract ends <90d) → account brief → CRM task + Slack manager
3. **Signal Response** — signal(`topic_intent`) → account brief → draft email → AE approval → sequence add
4. **Champion Re-engagement** — schedule(monthly) → contacts(engagement dropped >20%) → draft email → AE approval → sequence add
5. **Prospect Enrichment** — manual → workbook → audience filter → enrich contacts → CRM add → Slack notify

Each template is a fully-populated Workflow JSON — reps can duplicate, edit, publish.

---

## 10. Open Questions for Team Review

1. **Model selection per node** — expose in v1 or default to tenant setting? *Recommendation: hide in v1, expose in v2 with cost impact preview.*
2. **Rollback on partial failure** — if `tool.crm.add_contacts` succeeds but a later node fails, do we delete the writes? *Recommendation: leave the write, flag it in run history. No auto-rollback for tool nodes.*
3. **Approval routing** — static role vs. round-robin per rep? *Recommendation: static role in v1; round-robin in v2.*
4. **Concurrency limits** — tenant-level cap on parallel runs. *Recommendation: default 20; admin-tunable.*
5. **Cost budgets** — should admins be able to cap monthly spend per workflow? *Recommendation: v2.*
6. **Sub-workflows** — can a node call another workflow? *Recommendation: v2 via a `control.subflow` node.*

---

## 11. Non-Goals for v1

- Natural-language authoring ("build me a workflow that…") — deferred to Sales Copilot chat in v2
- Cross-tenant marketplace of workflows
- Custom-code / webhook nodes (v2: `tool.webhook` with tenant-signed URLs)
- Multi-tenant analytics dashboard (v2)
- Version rollback in the UI (API only in v1)

---

## Appendix A — Concrete Build Sequence (suggested)

Ordering for engineering to minimize rework:

1. **Core schema + storage** (Workflow + Run tables, JSON validation via Zod/Pydantic)
2. **Runtime executor** (topological run with node state machine; support agent + tool + control-wait + control-approval)
3. **Trigger dispatchers** (manual button, cron scheduler, signal listener)
4. **Node catalog** (v1 nodes registered as first-class handlers; edge adapters as static registry)
5. **Builder canvas** (React Flow or similar; palette + right-rail config)
6. **Reference Library** (upload + tag + search)
7. **Test Run mode** (dry-run engine that mocks tool side effects)
8. **Run history + approvals inbox** (rep-facing views)
9. **Governance gates** (publish approval, audit log, version pinning)
10. **Seed 5 templates**

Estimated effort: ~6-8 weeks with 2 full-stack engineers + 1 designer.
