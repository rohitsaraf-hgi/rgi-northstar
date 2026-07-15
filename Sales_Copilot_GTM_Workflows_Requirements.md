# GTM Workflows — Atomic Agents & Concrete Workflow Templates

**Version:** 0.1 Draft · July 2026 **Audience:** Engineering, Product **Depends on:** Atomic Agents & Workflows base requirements (existing doc)

---

## Overview

This document defines two things:

1. The generic workflow execution architecture — how data flows between steps, how agent contracts are defined, and what makes the system flexible enough to support any GTM motion.  
2. Five concrete workflow templates that ship with Sales Copilot as pre-built, admin-activatable starting points.

The system must be generic enough that any of the five templates can be built using the same workflow builder and the same atomic agent library.

---

## Part 1: Workflow Execution Architecture

### 1.1 Run Context Object

Every workflow run has a **Run Context** — a shared JSON object that accumulates data as steps execute. It is the mechanism by which agent outputs are passed to subsequent steps.

Structure:

```json
{
  "workflow_id": "wf_champion_job_change",
  "run_id": "run_abc123",
  "triggered_at": "2026-07-13T14:00:00Z",
  "account_id": "acct_xyz",
  "rep_id": "rep_456",
  "trigger": {
    "type": "champion_job_change",
    "data": {
      "contact_id": "c_789",
      "contact_name": "Sarah Chen",
      "old_company": "Databricks",
      "old_title": "VP Engineering",
      "new_company": "Snowflake",
      "new_title": "SVP Engineering"
    }
  },
  "steps": {
    "step_1": { "status": "completed", "output": { ... } },
    "step_2": { "status": "pending_approval", "output": null },
    "step_3": { "status": "not_started", "output": null }
  }
}
```

The Run Context is persisted to the database at each step transition. If a step fails or is waiting for approval, the workflow can resume from the exact step where it paused, using the Run Context as the recovery state.

### 1.2 Agent Input/Output Contract

Every atomic agent declares a formal contract. This contract is the basis for the workflow builder's step configuration UI and for the engine's runtime validation.

```json
{
  "agent_id": "draft_personalized_email",
  "name": "Draft personalized email",
  "description": "Generates a personalized email draft for a contact using their engagement history and a purpose defined by the admin.",
  "inputs": [
    { "key": "contact_id", "type": "string", "required": true, "label": "Contact" },
    { "key": "engagement_history", "type": "object", "required": false, "label": "Engagement history" },
    { "key": "purpose", "type": "string", "required": true, "label": "Email purpose (e.g., 'congratulate on new role')" },
    { "key": "context_notes", "type": "string", "required": false, "label": "Additional context for AI" }
  ],
  "outputs": [
    { "key": "email_subject", "type": "string" },
    { "key": "email_body", "type": "string" },
    { "key": "draft_id", "type": "string" }
  ],
  "is_reversible": false,
  "requires_approval_by_default": true,
  "output_type": "artifact"
}
```

**Key contract fields:**

| Field | Description |
| :---- | :---- |
| `inputs` | Required and optional inputs. Each input maps to a field in the Run Context (trigger data or a prior step's output). |
| `outputs` | Named fields the agent writes to the Run Context on success. |
| `is_reversible` | If false, a "Require rep approval" toggle is shown in the workflow builder for this step. |
| `requires_approval_by_default` | Pre-fills the approval toggle state when admin adds the step. Admin can override. |
| `output_type` | `artifact` (email draft, brief), `crm_record` (account, contact, task), `data` (list, score), or `notification`. |

### 1.3 Input Mapping in the Workflow Builder

When an admin adds an agent step, a **Configure Step** panel opens. For each required input, the admin selects the data source from a dropdown. Available options are automatically populated from:

- Fields in `trigger.data`  
- Output fields from all previously completed steps

Example: For the "Draft personalized email" step added after a "Get engagement history" step, the `engagement_history` input dropdown would show `step_1.output.engagement_history` as an option.

For simple workflows where field names match unambiguously, the system auto-maps inputs and flags the pre-fill for admin confirmation (not silent). Admin always confirms mappings before saving.

If a required input cannot be resolved from available context, the workflow builder blocks saving and shows an error: "Step 3 input 'contact\_id' has no source. Map it to trigger data or a prior step output."

### 1.4 Batch vs. Single-Record Execution

Some workflows operate on a single account or contact (Champion Job Change). Others operate on a list (Prospecting — run for top 10 accounts). The workflow engine supports both modes.

**Single-record mode:** The workflow runs once per trigger event. All agents receive a single record as input.

**Batch mode:** The workflow runs once but agents receive and return lists. An agent in batch mode processes all items and returns an array of outputs. Admin configures batch size (max records) when setting up the trigger or the first step that produces the list.

Batch mode is explicitly configured per workflow, not auto-detected. The workflow builder shows a "Batch mode" toggle when the trigger or first step can produce a list.

**Batch approval gates:** When a batch step requires approval, the rep receives a single approval request showing all items in the batch. The rep can approve all, reject all, or approve/reject individual items. Only approved items proceed to the next step.

### 1.5 Concurrency and Queuing

As defined in the base requirements: if the same trigger fires twice for the same account within 10 minutes, the second run is queued. Beyond that:

- A single workflow can have at most 1 active run and 1 queued run per account at any time. If a third trigger fires, it is dropped and logged.  
- Across different workflows, concurrent runs on the same account are permitted. There is no global per-account lock.  
- Batch workflows have a global concurrency limit of 5 simultaneous batch runs per tenant (to prevent resource exhaustion). Additional batch runs queue behind.

### 1.6 Idempotency Requirement

All agents that write to the CRM (create record, update record, add to sequence) must be idempotent. If the same agent step runs twice with the same inputs (due to retry), the result must be the same as if it ran once. CRM write agents must check for existing records before creating and update rather than duplicate.

This is especially critical for the "Upsert CRM Account" and "Add Contact to CRM" agents, which are used in multiple workflows.

---

## Part 2: Atomic Agent Library

The following agents are required to support the five workflow templates. Each agent is an atomic unit — it does one thing, takes defined inputs, and produces defined outputs. Agents do not call other agents.

### Write Agents (require approval toggle)

| Agent | Key Inputs | Key Outputs | Used in |
| :---- | :---- | :---- | :---- |
| **Upsert CRM account** | `company_name`, `domain` | `account_id`, `is_new_record` (bool) | Champion JC |
| **Update CRM contact fields** | `contact_id`, `fields` (map of field → value) | `updated_contact_id`, `fields_changed` | Champion JC |
| **Add contacts to CRM** | `contact_list` (name, email, title, company) | `contact_ids`, `duplicates_skipped` | Prospecting |
| **Update account status** | `account_id` or `account_ids` (batch), `status_value` | `confirmation_list` | Prospecting |
| **Update contact status** | `contact_id` or `contact_ids` (batch), `status_value` | `confirmation_list` | Prospecting |
| **Add contacts to sequence** | `contact_ids`, `sequence_id` | `enrolled_count`, `skipped_count` | Prospecting |
| **Create CRM tasks** | `task_list` (description, assignee\_id, due\_date, related\_record\_id) | `task_ids` | Inbound, Closed Won |
| **Update opportunity field** | `opportunity_id`, `field`, `value` | `confirmation` | Closed Won |

### Read / Generate Agents (no approval required)

| Agent | Key Inputs | Key Outputs | Used in |
| :---- | :---- | :---- | :---- |
| **Get engagement history** | `contact_id`, `lookback_days` (default: 90\) | `interactions` (list: type, date, summary) | Champion JC |
| **Draft personalized email** | `contact_id`, `purpose`, `engagement_history` (optional), `context_notes` (optional) | `email_subject`, `email_body`, `draft_id` | Champion JC, Prospecting, Inbound, Event |
| **Get book of accounts** | `rep_id`, `filters` (optional), `limit` (default: 10\) | `account_list` (id, name, score, ARR) | Prospecting |
| **Generate account brief** | `account_id` or `account_ids` (batch), `brief_type` | `brief_text` or `brief_list` | Prospecting, Closed Won |
| **Find buying personas** | `account_id` or `account_ids` (batch), `persona_criteria` | `contact_list` (name, title, email, fit\_score) | Prospecting |
| **Enrich lead** | `lead_email` or `lead_domain` | `firmographic`, `technographic`, `hg_signals` | Inbound |
| **Score account** | `account_id` or `lead_data` | `fit_score`, `fit_tier` (High/Medium/Low) | Inbound |
| **Get account context** | `account_id` | `account_summary`, `crm_data`, `hg_signals`, `open_opportunities` | Event, Closed Won |
| **Find competitor accounts** | `reference_account_id`, `competitor_product_ids`, `territory_filter` (optional) | `account_list` (accounts using those competitors) | Closed Won |
| **Get trigger event details** | `event_id` (from trigger) | `event_type`, `event_source`, `event_data` | Event |
| **Notify rep** | `rep_id`, `message`, `account_id`, `channel` (`slack` / `in_app` / `both`) | `notification_id` | All |

**Notes for engineering:**

- Agents named with "or `account_ids` (batch)" support both single and batch execution. The agent inspects whether the input is a string or array and handles accordingly.  
- `draft_personalized_email` calls Account AI internally. It is subject to Account AI's latency. Async execution with a timeout of 60 seconds per email; batch draft generation times out per-item, not globally.  
- `find_buying_personas` queries HG Contact Discovery. It returns only contacts that pass the configured persona criteria (title, seniority, department). Admin configures persona criteria when adding this step to a workflow.  
- `find_competitor_accounts` uses HG technographic data. It returns accounts that have installs of the specified competitor products in HG's database. The result is filtered to the rep's territory if `territory_filter` is set.

---

## Part 3: Five Workflow Templates

Templates ship as pre-built workflow definitions that admins can activate, clone, and customize. They are not documentation — they are importable workflow configs. Each template below is defined as a sequence of steps with inputs, outputs, approval gates, and the mapping logic.

---

### Template 1: Champion Job Change

**Purpose:** When a tracked champion changes jobs, protect the existing deal and open a new opportunity at the champion's new company — automatically.

**Trigger:** `champion_job_change` **Trigger data available:**

- `contact_id`, `contact_name`, `contact_email`  
- `old_company_name`, `old_company_id`  
- `new_company_name`, `new_company_domain`, `new_title`  
- `related_opportunity_id` (if contact was linked to an open opportunity)

**Steps:**

| \# | Agent | Key Inputs (source) | Key Outputs | Approval required |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Get engagement history | `contact_id` (trigger) | `interactions` | No |
| 2 | Draft personalized email | `contact_id` (trigger), `purpose` \= "Congratulate on new role and stay in touch", `engagement_history` (step 1\) | `email_subject`, `email_body`, `draft_id` | Yes — rep approves before send |
| 3 | Upsert CRM account | `company_name` (trigger: `new_company_name`), `domain` (trigger: `new_company_domain`) | `account_id`, `is_new_record` | Yes if `is_new_record = true` |
| 4 | Update CRM contact fields | `contact_id` (trigger), `fields` \= `{company: step_3.account_id, title: trigger.new_title}` | `updated_contact_id` | No |
| 5 | Notify rep | `rep_id` (from workflow scope), message \= workflow summary including step 3 outcome | `notification_id` | No |

**Approval gate behavior:**

- Step 2 (email): Rep sees the draft email, the contact's name, and their new role. Rep can edit before approving. Approval sends the email from the rep's connected email account.  
- Step 3 (account creation): Only triggers if `is_new_record = true`. Rep sees a preview of the new account record fields. Rejection skips the record creation but continues the workflow (contact update in step 4 uses the existing account if available, or is skipped with a logged warning if no account exists).

**Step 3 mapping note:** "Upsert CRM account" checks for an existing account by domain match before creating. This avoids duplicate accounts. The agent is idempotent: running it twice returns the same `account_id`.

---

### Template 2: Prospecting Agent

**Purpose:** Automate the SDR prospecting motion — take a rep's top accounts, find the right buying personas, draft outreach, add contacts to CRM, and enroll in sequence.

**Trigger:** `manual` (rep or admin triggers from Sales Copilot) **Trigger data available:**

- `rep_id`, `triggered_by` (rep or admin), `limit` (configurable: default 10 accounts)

**Mode:** Batch

**Steps:**

| \# | Agent | Key Inputs (source) | Key Outputs | Approval required |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Get book of accounts | `rep_id` (trigger), `filters` \= High/Medium fit score only, `limit` (trigger) | `account_list` | No |
| 2 | Generate account brief | `account_ids` (step 1: batch) | `brief_list` (one per account) | No |
| 3 | Find buying personas | `account_ids` (step 1: batch), `persona_criteria` (admin-configured: title keywords, seniority, department) | `contact_list` (one or more contacts per account) | No |
| 4 | Draft personalized email | `contact_ids` (step 3: batch), `purpose` \= admin-configured outreach message, `context_notes` \= corresponding account brief from step 2 | `email_draft_list` | Yes — batch approval |
| 5 | Add contacts to CRM | `contact_list` (step 3: contacts not already in CRM) | `contact_ids`, `duplicates_skipped` | Yes |
| 6 | Update account status | `account_ids` (step 1), `status_value` \= "Prospecting" | `confirmation_list` | No |
| 7 | Update contact status | `contact_ids` (step 5), `status_value` \= "Prospecting" | `confirmation_list` | No |
| 8 | Add contacts to sequence | `contact_ids` (step 5), `sequence_id` (admin-configured) | `enrolled_count` | Yes |
| 9 | Notify rep | `rep_id` (trigger), message \= summary of accounts processed, contacts added, emails drafted | `notification_id` | No |

**Batch approval (step 4):** Rep sees a review panel with all email drafts grouped by account. Rep can edit individual emails, approve all, or exclude specific contacts. Only approved emails proceed. Rejected contacts are excluded from steps 5–8 as well.

**Step 5 deduplication:** "Add contacts to CRM" skips contacts whose email already exists in CRM. `duplicates_skipped` is reported in the rep notification (step 9).

**Admin configuration options for this template:**

- `limit`: how many accounts to process per run (1–50, default 10\)  
- `persona_criteria`: job title keywords, seniority levels, departments to target  
- `sequence_id`: which Outreach/CRM sequence to enroll contacts in  
- `status_value` for account and contact updates (changeable from "Prospecting" to any CRM picklist value)

---

### Template 3: Inbound Lead Targeting

**Purpose:** When a hand-raiser (form fill, demo request, trial signup, or TrustRadius contact request) comes in, instantly enrich the lead, score the account, route to the right rep, and generate a personalized outreach email — before the rep has to think.

**Trigger:** `event_fired` — filtered to: `event_type IN (form_fill, demo_request, trial_signup, tr_contact_request)` **Trigger data available:**

- `event_type`, `event_source`, `lead_email`, `lead_name`, `lead_company_domain`, `lead_form_data`

**Steps:**

| \# | Agent | Key Inputs (source) | Key Outputs | Approval required |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Enrich lead | `lead_email` (trigger), `lead_domain` (trigger: `lead_company_domain`) | `firmographic`, `technographic`, `hg_signals`, `inferred_account_id` (if CRM match found) | No |
| 2 | Score account | `account_id` (step 1: `inferred_account_id` if available) or `lead_data` (step 1 enrichment) | `fit_score`, `fit_tier` | No |
| 3 | Get account context | `account_id` (step 1: `inferred_account_id`, if available) | `account_summary`, `open_opportunities`, `crm_data` | No |
| 4 | Draft personalized email | `contact_id` (trigger: lead), `purpose` \= "Follow up on inbound interest — \[event\_type from trigger\]", `context_notes` \= step 1 enrichment \+ step 3 account context | `email_subject`, `email_body`, `draft_id` | Yes |
| 5 | Create CRM task | `task_list` \= \[{description: "Follow up with \[lead\_name\] — inbound \[event\_type\]", assignee\_id: rep\_id, due\_date: today \+ 1 business day, related\_record\_id: step\_1.inferred\_account\_id}\] | `task_ids` | No |
| 6 | Notify rep | `rep_id` (from territory assignment), message \= lead summary \+ fit score \+ draft email link | `notification_id` | No |

**Routing logic (step 6 rep assignment):** The rep who owns the account in CRM (if `inferred_account_id` is found) is the assignee. If no CRM account match, territory assignment rules apply (same logic as Territory Assignment feature). If no territory match, notification goes to the admin-configured fallback owner.

**Fit score gate:** Admin can configure a minimum fit score threshold for this workflow. Leads scoring below the threshold are logged but do not proceed past step 2\. Admin sees low-score leads in an "Unqualified inbound" panel. This prevents noise for reps when volume is high.

---

### Template 4: Intent Event Workflow (TrustRadius / 1P Event)

**Purpose:** When a target account exhibits strong buying intent — researching competitors on TrustRadius, visiting key pages, or engaging with specific 1P events — surface this to the rep with full context and a ready-to-send outreach email, before the competitor does.

**Trigger:** `event_fired` — admin configures specific event filters (e.g., `event_source = TrustRadius AND event_type = product_comparison`, or `event_source = 1P AND event_type = webinar_attended`) **Trigger data available:**

- `event_type`, `event_source`, `event_data` (source-specific payload), `account_id`, `contact_id` (if resolved)

**Steps:**

| \# | Agent | Key Inputs (source) | Key Outputs | Approval required |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Get trigger event details | `event_id` (trigger) | `event_type`, `event_source`, `event_context` (e.g., which products were compared on TR, which webinar was attended) | No |
| 2 | Get account context | `account_id` (trigger) | `account_summary`, `crm_data`, `hg_signals`, `open_opportunities` | No |
| 3 | Draft personalized email | `contact_id` (trigger, if resolved), `purpose` \= admin-configured (e.g., "Reach out to account showing intent on TrustRadius"), `context_notes` \= step 1 event context \+ step 2 account summary | `email_subject`, `email_body`, `draft_id` | Yes |
| 4 | Notify rep | `rep_id` (from account ownership), message includes: event summary, account context highlights, link to email draft | `notification_id` | No |

**Admin configuration options:**

- Event filter: which event types and sources trigger this workflow  
- Email purpose: the intent/goal of the outreach (used to guide the AI draft)  
- Optional: add "Add contact to sequence" as step 5 (admin can enable/disable)

**Contact resolution fallback:** If `contact_id` is null (account-level signal with no resolved contact), the "Draft personalized email" step targets the most recently engaged contact on the account (from CRM). If no contacts exist, the draft is addressed generically to the company and the rep notification flags "no resolved contact — review before sending."

---

### Template 5: Closed Won Competitor Targeting

**Purpose:** When a deal is won, immediately generate a list of accounts that use the losing competitor's products — these accounts match your ICP and have a proven pain point your product solves. Turn every win into a prospecting motion.

**Trigger:** `crm_field_updated` — Opportunity.Stage changes to "Closed Won" **Trigger data available:**

- `opportunity_id`, `account_id`, `account_name`, `products_sold` (from opportunity line items), `competitor_mentioned` (if CRM field populated), `close_date`, `arr`

**Steps:**

| \# | Agent | Key Inputs (source) | Key Outputs | Approval required |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Get account context | `account_id` (trigger) | `account_summary`, `hg_signals` (products installed), `icp_attributes` | No |
| 2 | Find competitor accounts | `reference_account_id` (trigger: `account_id`), `competitor_product_ids` (from step 1 hg\_signals — products the winning account previously used, or admin-configured competitor list), `territory_filter` \= rep's territory | `account_list` (accounts using those competitors, within territory) | No |
| 3 | Generate account brief | `account_ids` (step 2: batch, up to admin-configured max) | `brief_list` | No |
| 4 | Create CRM tasks | `task_list` \= \[{description: "Competitor targeting — \[account\_name\] uses \[competitor\]. Closed \[trigger.account\_name\] in same space.", assignee\_id: rep\_id, due\_date: today \+ 3 business days, related\_record\_id: each step\_2 account\_id}\] | `task_ids` | Yes — rep approves task creation |
| 5 | Notify rep | `rep_id` (opportunity owner), message \= list of new prospecting targets with brief highlights and competitor context | `notification_id` | No |

**Step 2 competitor logic:** "Find competitor accounts" uses HG technographic data to find accounts with installs of the same products the closed-won account was replacing. If `competitor_mentioned` is populated in the CRM opportunity (e.g., "Replaced CrowdStrike"), that product is used as the primary filter. If not, the agent infers from HG signals on the won account which products were likely replaced. Engineering must define the inference logic in the agent spec.

**Step 4 batch size cap:** Admin configures maximum accounts to target per Closed Won event (default: 20). Without a cap, a single closed-won deal could generate hundreds of CRM tasks, polluting the rep's pipeline.

---

## Part 4: Workflow Builder — Additional UX Requirements

These requirements extend the existing workflow builder spec to support the generic data flow and template system defined above.

### 4.1 Template Library

Admin sees a **Template Library** when creating a new workflow. Templates are categorized:

- Champion & Retention  
- Prospecting & Pipeline  
- Inbound & Events  
- Competitive

Each template shows: name, description, trigger type, number of steps, and estimated time to configure. Admin selects a template and is taken to the workflow builder with all steps pre-populated. All pre-populated values are editable.

Admin can also start from scratch ("Blank workflow") for custom motions.

### 4.2 Step Configuration Panel

When admin clicks a step, a side panel opens. It shows:

- Agent name and description  
- Each required input with a dropdown to select the data source (from trigger data or prior step outputs)  
- Each optional input (shown collapsed by default)  
- Approval gate toggle (shown only for non-reversible agents)  
- Agent-specific configuration (e.g., `purpose` text for email drafts, `persona_criteria` for contact search)

The panel validates that all required inputs are mapped before allowing the step to be saved.

### 4.3 Data Flow Visualizer

In the workflow builder, between each step, a connector shows the key data being passed. Example:

```
[Trigger: Champion job change]
        ↓ contact_id, new_company_name, new_title
[Step 1: Get engagement history]
        ↓ interactions
[Step 2: Draft personalized email]
        ↓ email_subject, email_body (APPROVAL GATE)
[Step 3: Upsert CRM account]
        ↓ account_id
[Step 4: Update CRM contact fields]
```

This helps admin understand and debug data dependencies without reading JSON. Hovering a connector shows the full field mapping.

### 4.4 Test Run (Dry Run Mode)

Before activating a workflow, admin can trigger a **Test Run** on a specific account they select. The test run executes all read-only steps with real data and simulates write steps (logs what would be written without actually writing to CRM or sending emails). The admin sees the full run output, including what each step received as input and what it produced as output.

Write steps in test mode show: "Would create account: \[preview of record\]" or "Would send email: \[preview of draft\]."

Test run results are shown in the workflow builder and are not stored in the audit log.

---

## Part 5: Decisions Required

| \# | Decision | Options | Recommendation |
| :---- | :---- | :---- | :---- |
| D1 | **Sequence integration in V1** — "Add contacts to sequence" assumes an Outreach integration. Is Outreach integration in scope for V1, or does V1 use a CSV export / CRM task as the proxy? | (a) Outreach native integration, (b) CSV export only, (c) CRM task creation as proxy | Define scope now — this affects the Prospecting and Inbound templates significantly. Recommend CRM task as proxy for V1, native Outreach integration in V2. |
| D2 | **Competitor product mapping for Closed Won template** — When the CRM opportunity does not have `competitor_mentioned` populated, how does the system infer which competitor products to search for? | (a) Tenant configures a default competitor product list in Settings, (b) Agent uses HG signals on the won account to infer, (c) Step is skipped if field not populated | Option (a) \+ (c) fallback is most reliable. Pure inference (b) is risky without validation. |
| D3 | **Batch approval UX** — For Prospecting template, the rep must review up to 10+ email drafts in a single approval request. | (a) Slack message with a link to a web review page, (b) In-app review panel only, (c) Email digest | Option (b) — in-app panel where rep can page through and edit drafts. Slack sends a link to this panel, not inline draft content. |
| D4 | **Scheduled trigger for Prospecting** — The Prospecting template uses "Manual" trigger, which requires a rep to initiate. Should a "Scheduled" trigger type (e.g., every Monday at 9am) be added to the V1 trigger library? | (a) Add scheduled trigger to V1, (b) Manual only in V1, scheduled in V2 | Recommend adding scheduled trigger to V1 specifically for the Prospecting template. It is a cron job — straightforward to implement and significantly increases the value of the feature. |
| D5 | **Agent execution environment** — Are atomic agents the same as Phoenix agents (referenced in the roadmap)? Or is this a separate execution layer? | Define the relationship between the workflow engine's agent steps and Phoenix atomic agents | This must be clarified before engineering begins. If they are the same, the Phoenix agent runtime is the execution layer and each workflow step is a Phoenix agent invocation. If separate, there are two agent systems to maintain. |

