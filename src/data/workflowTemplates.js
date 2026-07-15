// HG-curated starter workflow templates.
//
// Two-axis categorization:
//   - vertical: SaaS / Fintech / Manufacturing (industry context)
//   - motion:   Champion & Retention / Prospecting & Pipeline / Inbound & Events / Competitive
//
// Every template ships with pre-wired input mappings against a shared Run
// Context (spec §1.1). The mapping shape is:
//   node.config.input_bindings = { input_key: 'trigger.data.contact_id' | 'step_N.output.brief_text' | ... }
// The InputMappingPanel reads/writes this map.

const SAAS_PQL_ACTIVATION = {
  id: 'wf-tpl-saas-pql',
  vertical: 'saas',
  name: 'PQL Activation Routing',
  description: 'Score every PQL on the fly, branch by score, route to AE fast lane or SDR queue with HG enrichment.',
  bound_play_hint: 'Inbound qualification → AE handoff',
  effectiveness_hint: '100% deterministic — runs at high volume with zero LLM cost',
  tree: {
    output_node: 'n_outcome',
    nodes: {
      n_trigger: { type: 'trigger.scheduled', config: { interval: 'on PQL event' } },
      n_crm: { type: 'api.crm.read', config: { object: 'lead', fields: 'company,title,plan_type' } },
      n_install: { type: 'api.hg.install', config: { entity: 'category', value: 'BI' } },
      n_score: { type: 'api.custom.webhook', config: { endpoint: 'pql-score-v3', returns: 'score 0-100' } },
      n_branch: { type: 'logic.branch', config: { on: 'pql_score', op: '>=', value: '75' } },
      n_fast: { type: 'api.crm.write', config: { field: 'lead_owner', value: 'next_AE' } },
      n_std: { type: 'api.crm.write', config: { field: 'lead_owner', value: 'SDR_queue' } },
      n_outcome: { type: 'output.outcome', config: { capture: 'AE_accepted, SDR_qualified, disqualified' } },
    },
    edges: [
      ['n_trigger', 'n_crm'],
      ['n_crm', 'n_install'],
      ['n_install', 'n_score'],
      ['n_score', 'n_branch'],
      ['n_branch', 'n_fast'],
      ['n_branch', 'n_std'],
      ['n_fast', 'n_outcome'],
      ['n_std', 'n_outcome'],
    ],
  },
  mapping_notes: ['custom.webhook endpoint — point to your scoring model'],
};

const SAAS_RENEWAL_SAVE = {
  id: 'wf-tpl-saas-renewal',
  vertical: 'saas',
  name: 'Renewal Save Play',
  description: 'When Renewal Risk fires, brief the AM, draft a save email, get approval, wait, escalate to Slack if no engagement.',
  bound_play_hint: 'Renewal risk → AM intervention',
  effectiveness_hint: '52% save rate on accounts >$50k ARR with 90d window',
  tree: {
    output_node: 'n_outcome',
    nodes: {
      n_trigger: { type: 'trigger.signal', config: { signal_id: 'renewal-risk' } },
      n_brief: { type: 'agent.renewal_readiness', config: { include: 'usage,nps,exec_engagement' } },
      n_email: { type: 'agent.email_draft', config: { tone: 'consultative', cadence: '1-touch', channel: 'email' } },
      n_approve: { type: 'checkpoint.approval', config: { assignee_role: 'AM', sla_hours: 24 } },
      n_wait: { type: 'wait.duration', config: { days: 7 } },
      n_slack: { type: 'api.slack.notify', config: { channel: '#renewal-watch' } },
      n_outcome: { type: 'output.outcome', config: { capture: 'saved, expanded, churned' } },
    },
    edges: [
      ['n_trigger', 'n_brief'],
      ['n_brief', 'n_email'],
      ['n_email', 'n_approve'],
      ['n_approve', 'n_wait'],
      ['n_wait', 'n_slack'],
      ['n_slack', 'n_outcome'],
    ],
  },
  mapping_notes: [],
};

const FINTECH_COMPLIANCE_BRIEF = {
  id: 'wf-tpl-fintech-compliance',
  vertical: 'fintech',
  name: 'Compliance Brief & Escalation',
  description: 'When Compliance Risk Tier fires, build compliance brief, route through legal review, notify deal team.',
  bound_play_hint: 'Compliance → Legal + AE escalation',
  effectiveness_hint: '2.1× faster cycle through legal review when flagged early',
  tree: {
    output_node: 'n_notify',
    nodes: {
      n_trigger: { type: 'trigger.signal', config: { signal_id: 'compliance-risk' } },
      n_crm: { type: 'api.crm.read', config: { object: 'opportunity', fields: 'stage,owner,compliance_review_status' } },
      n_research: { type: 'agent.account_research', config: { scope: 'web+sec' } },
      n_review: { type: 'checkpoint.review', config: { audience: 'Legal team', sla_hours: 48 } },
      n_notify: { type: 'output.notify', config: { channel: 'slack', format: 'brief' } },
    },
    edges: [
      ['n_trigger', 'n_crm'],
      ['n_crm', 'n_research'],
      ['n_research', 'n_review'],
      ['n_review', 'n_notify'],
    ],
  },
  mapping_notes: ['opportunity.compliance_review_status — your custom CRM field for tracking review state'],
};

const FINTECH_HIGH_VALUE = {
  id: 'wf-tpl-fintech-high-value',
  vertical: 'fintech',
  name: 'High-Value Inbound Fast-Lane',
  description: 'High-Value FinServ Inbound signal → AE fast-lane assignment + immediate Slack page + outreach prep.',
  bound_play_hint: 'High-value lead → AE fast-track',
  effectiveness_hint: '3.8× pipeline-create rate vs standard inbound routing',
  tree: {
    output_node: 'n_outcome',
    nodes: {
      n_trigger: { type: 'trigger.signal', config: { signal_id: 'high-value-finserv-inbound' } },
      n_crm: { type: 'api.crm.read', config: { object: 'lead', fields: 'company,arr_estimate,industry' } },
      n_assign: { type: 'api.crm.write', config: { field: 'lead_owner', value: 'finserv_AE_pool' } },
      n_slack: { type: 'api.slack.notify', config: { channel: '@finserv_AE_pool', message: 'High-value lead: {{lead.company}}' } },
      n_email: { type: 'agent.email_draft', config: { tone: 'executive', cadence: '1-touch', channel: 'email' } },
      n_outcome: { type: 'output.outcome', config: { capture: 'AE_accepted, meeting_booked, no_response_7d' } },
    },
    edges: [
      ['n_trigger', 'n_crm'],
      ['n_crm', 'n_assign'],
      ['n_assign', 'n_slack'],
      ['n_slack', 'n_email'],
      ['n_email', 'n_outcome'],
    ],
  },
  mapping_notes: [],
};

const MFG_CAPEX_OUTREACH = {
  id: 'wf-tpl-mfg-capex',
  vertical: 'manufacturing',
  name: 'Capex Window Outreach',
  description: 'Capex Window signal → persona discovery → exec brief + ROI email → AE approval → Outreach sequence enroll.',
  bound_play_hint: 'Capex window → exec outreach',
  effectiveness_hint: '22% meeting-book rate when fired within 60 days of funding event',
  tree: {
    output_node: 'n_outcome',
    nodes: {
      n_trigger: { type: 'trigger.signal', config: { signal_id: 'capex-window-open' } },
      n_personas: { type: 'agent.persona_discovery', config: { titles: 'VP IT,CTO,CIO', seniority: 'VP+' } },
      n_value: { type: 'agent.value_hypothesis', config: { focus: 'ROI on modernization' } },
      n_email: { type: 'agent.email_draft', config: { tone: 'executive', cadence: '2-touch', channel: 'email' } },
      n_approve: { type: 'checkpoint.approval', config: { assignee_role: 'AE', sla_hours: 24 } },
      n_enroll: { type: 'api.outreach.enroll', config: { sequence: 'Capex Modernization' } },
      n_outcome: { type: 'output.outcome', config: { capture: 'replied, meeting_booked, no_response_14d' } },
    },
    edges: [
      ['n_trigger', 'n_personas'],
      ['n_personas', 'n_value'],
      ['n_value', 'n_email'],
      ['n_email', 'n_approve'],
      ['n_approve', 'n_enroll'],
      ['n_enroll', 'n_outcome'],
    ],
  },
  mapping_notes: [],
};

const MFG_MODERNIZATION_BRIEF = {
  id: 'wf-tpl-mfg-modernization',
  vertical: 'manufacturing',
  name: 'Plant Modernization Brief',
  description: 'Manual play. Generates a modernization-readiness brief from HG IoT + Cloud spend + tech-stack analysis.',
  bound_play_hint: 'Manual brief → solutions engineer prep',
  effectiveness_hint: '1.9× larger average deal size when SE is engaged with this brief',
  tree: {
    output_node: 'n_notify',
    nodes: {
      n_trigger: { type: 'trigger.manual', config: { invocation: 'account header CTA' } },
      n_iot: { type: 'api.hg.install', config: { entity: 'category', value: 'IoT' } },
      n_cloud: { type: 'api.hg.spend', config: { category: 'Cloud' } },
      n_research: { type: 'agent.account_research', config: { scope: 'web+sec' } },
      n_value: { type: 'agent.value_hypothesis', config: { focus: 'Manufacturing 4.0' } },
      n_notify: { type: 'output.notify', config: { channel: 'thread', format: 'brief' } },
    },
    edges: [
      ['n_trigger', 'n_iot'],
      ['n_trigger', 'n_cloud'],
      ['n_iot', 'n_research'],
      ['n_cloud', 'n_research'],
      ['n_research', 'n_value'],
      ['n_value', 'n_notify'],
    ],
  },
  mapping_notes: [],
};

export const WORKFLOW_VERTICALS = [
  { id: 'saas', label: 'SaaS', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500/10' },
  { id: 'fintech', label: 'Fintech', color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-500/10' },
  { id: 'manufacturing', label: 'Manufacturing', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10' },
  { id: 'general', label: 'General GTM', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10' },
];

// Motion categories (spec §4.1). Independent of vertical — a template can
// belong to one motion and any number of verticals.
export const WORKFLOW_MOTIONS = [
  { id: 'champion_retention', label: 'Champion & Retention', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-500/10' },
  { id: 'prospecting_pipeline', label: 'Prospecting & Pipeline', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500/10' },
  { id: 'inbound_events', label: 'Inbound & Events', color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-500/10' },
  { id: 'competitive', label: 'Competitive', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10' },
];

// -----------------------------------------------------------------------------
// GTM Workflow Templates (Sales_Copilot_GTM_Workflows_Requirements.md §3)
// -----------------------------------------------------------------------------

// Template 1: Champion Job Change (§3.1)
const GTM_CHAMPION_JOB_CHANGE = {
  id: 'wf-tpl-champion-job-change',
  vertical: 'general',
  motion: 'champion_retention',
  name: 'Champion Job Change',
  description: 'When a tracked champion changes jobs, protect the existing deal and open a new opportunity at the new company — automatically. Congratulates the champion, upserts the new account, and links them to it.',
  bound_play_hint: 'Champion movement → warm outreach + new-logo pipeline',
  effectiveness_hint: '2.4× reply rate on congratulatory outreach vs cold, and 18% of moves convert to a new-logo opportunity within 90 days',
  batch_mode: false,
  tree: {
    output_node: 'n_notify',
    nodes: {
      n_trigger: {
        type: 'trigger.champion_job_change',
        config: { source: 'LinkedIn · verified change', min_seniority: 'Director+' },
      },
      n_history: {
        type: 'agent.get_engagement_history',
        config: {
          lookback_days: 90,
          types: 'email,meeting,call,note',
          input_bindings: { contact_id: 'trigger.data.contact_id' },
        },
      },
      n_email: {
        type: 'agent.draft_personalized_email',
        config: {
          purpose: 'Congratulate on new role and stay in touch',
          tone: 'warm',
          max_words: 140,
          approval_required: true,
          input_bindings: {
            contact_id: 'trigger.data.contact_id',
            engagement_history: 'n_history.output.interactions',
          },
        },
      },
      n_approve_email: {
        type: 'checkpoint.approval',
        config: { assignee_role: 'AE', sla_hours: 24 },
      },
      n_upsert_account: {
        type: 'agent.upsert_crm_account',
        config: {
          match_strategy: 'domain',
          approval_required: true,
          input_bindings: {
            company_name: 'trigger.data.new_company_name',
            domain: 'trigger.data.new_company_domain',
          },
        },
      },
      n_update_contact: {
        type: 'agent.update_crm_contact_fields',
        config: {
          fields_to_update: 'company,title',
          approval_required: false,
          input_bindings: {
            contact_id: 'trigger.data.contact_id',
            fields: 'n_upsert_account.output.account_id',
          },
        },
      },
      n_notify: {
        type: 'agent.notify_rep',
        config: {
          channel: 'both',
          message_template: 'Champion {{trigger.data.contact_name}} moved to {{trigger.data.new_company_name}} as {{trigger.data.new_title}}. Congrats email sent · account linked. Review pipeline signal.',
          input_bindings: {
            rep_id: 'trigger.data.rep_id',
            account_id: 'n_upsert_account.output.account_id',
          },
        },
      },
    },
    edges: [
      ['n_trigger', 'n_history'],
      ['n_history', 'n_email'],
      ['n_email', 'n_approve_email'],
      ['n_approve_email', 'n_upsert_account'],
      ['n_upsert_account', 'n_update_contact'],
      ['n_update_contact', 'n_notify'],
    ],
  },
  mapping_notes: [
    'trigger.data.rep_id — resolved from the account owner in CRM at trigger time',
    'Step 3 skips the write if the domain already resolves to an existing account (idempotent)',
  ],
};

// Template 2: Prospecting Agent (§3.2)
const GTM_PROSPECTING_AGENT = {
  id: 'wf-tpl-prospecting-agent',
  vertical: 'general',
  motion: 'prospecting_pipeline',
  name: 'Prospecting Agent',
  description: 'Batch prospecting motion — take the rep\'s top-fit accounts, find the right personas, draft outreach, add contacts to CRM, and enroll them in sequence. One approval batch across up to 10 accounts.',
  bound_play_hint: 'SDR outbound sprint · high-fit accounts',
  effectiveness_hint: '3.1× SDR productivity — 10 accounts in the time a rep takes to research 3 manually',
  batch_mode: true,
  tree: {
    output_node: 'n_notify',
    nodes: {
      n_trigger: {
        type: 'trigger.manual',
        config: { invocation: 'workbench tile' },
      },
      n_book: {
        type: 'agent.get_book_of_accounts',
        config: {
          fit_filter: 'High + Medium',
          limit: 10,
          input_bindings: { rep_id: 'trigger.data.rep_id' },
        },
      },
      n_brief: {
        type: 'agent.generate_account_brief',
        config: {
          brief_type: 'prospecting',
          max_length: '150 words',
          input_bindings: { account_ids: 'n_book.output.account_list' },
        },
      },
      n_personas: {
        type: 'agent.find_buying_personas',
        config: {
          titles: 'VP Engineering,CTO,Head of Data Platform',
          seniority: 'Director+',
          department: 'Engineering,Data',
          max_per_account: 3,
          input_bindings: { account_ids: 'n_book.output.account_list' },
        },
      },
      n_email: {
        type: 'agent.draft_personalized_email',
        config: {
          purpose: 'Introduce our platform against their tech stack and open a discovery conversation',
          tone: 'consultative',
          max_words: 160,
          approval_required: true,
          input_bindings: {
            contact_id: 'n_personas.output.contact_list',
            context_notes: 'n_brief.output.brief_list',
          },
        },
      },
      n_batch_approve: {
        type: 'checkpoint.batch_approval',
        config: { assignee_role: 'AE', sla_hours: 48, group_by: 'account', per_item_edit: 'yes' },
      },
      n_add_contacts: {
        type: 'agent.add_contacts_to_crm',
        config: {
          dedupe_by: 'email',
          approval_required: true,
          input_bindings: { contact_list: 'n_personas.output.contact_list' },
        },
      },
      n_update_account_status: {
        type: 'agent.update_account_status',
        config: {
          status_value: 'Prospecting',
          approval_required: false,
          input_bindings: { account_ids: 'n_book.output.account_list' },
        },
      },
      n_update_contact_status: {
        type: 'agent.update_contact_status',
        config: {
          status_value: 'Prospecting',
          approval_required: false,
          input_bindings: { contact_ids: 'n_add_contacts.output.contact_ids' },
        },
      },
      n_enroll: {
        type: 'agent.add_contacts_to_sequence',
        config: {
          sequence_id: 'EMEA Outbound Q3',
          fallback_to_crm_task: 'Create CRM follow-up task',
          approval_required: true,
          input_bindings: { contact_ids: 'n_add_contacts.output.contact_ids' },
        },
      },
      n_notify: {
        type: 'agent.notify_rep',
        config: {
          channel: 'both',
          message_template: 'Prospecting run complete · {{n_add_contacts.output.contact_ids.length}} new contacts across {{n_book.output.account_list.length}} accounts · enrolled in "EMEA Outbound Q3".',
          input_bindings: { rep_id: 'trigger.data.rep_id' },
        },
      },
    },
    edges: [
      ['n_trigger', 'n_book'],
      ['n_book', 'n_brief'],
      ['n_book', 'n_personas'],
      ['n_brief', 'n_email'],
      ['n_personas', 'n_email'],
      ['n_email', 'n_batch_approve'],
      ['n_batch_approve', 'n_add_contacts'],
      ['n_batch_approve', 'n_update_account_status'],
      ['n_add_contacts', 'n_update_contact_status'],
      ['n_add_contacts', 'n_enroll'],
      ['n_enroll', 'n_notify'],
      ['n_update_account_status', 'n_notify'],
      ['n_update_contact_status', 'n_notify'],
    ],
  },
  mapping_notes: [
    'Batch mode is on — the batch approval gate lets rep approve/reject drafts by account',
    'Sequence step falls back to a CRM task if Outreach isn\'t connected (spec §5 D1)',
    'Admin: change `sequence_id` to your Outreach cadence before publishing',
  ],
};

// Template 3: Inbound Lead Targeting (§3.3)
const GTM_INBOUND_LEAD = {
  id: 'wf-tpl-inbound-lead',
  vertical: 'general',
  motion: 'inbound_events',
  name: 'Inbound Lead Targeting',
  description: 'When a form fill, demo request, trial signup, or TrustRadius contact request arrives, enrich → score → route → draft outreach → notify — before the rep has to think.',
  bound_play_hint: 'Inbound → fast-lane AE handoff',
  effectiveness_hint: '5× faster first-touch on High-fit inbound and 68% of qualified leads get outreach within 15 minutes',
  batch_mode: false,
  tree: {
    output_node: 'n_notify',
    nodes: {
      n_trigger: {
        type: 'trigger.event_fired',
        config: {
          event_types: 'form_fill,demo_request,trial_signup,tr_contact_request',
          event_sources: 'marketing_form,TrustRadius',
          min_fit_score: 60,
        },
      },
      n_enrich: {
        type: 'agent.enrich_lead',
        config: {
          sources: 'all (fastest)',
          input_bindings: {
            lead_email: 'trigger.data.lead_email',
            lead_domain: 'trigger.data.lead_company_domain',
          },
        },
      },
      n_score: {
        type: 'agent.score_account',
        config: {
          model_id: 'fit-model-v4',
          min_tier: 'Medium',
          input_bindings: {
            account_id: 'n_enrich.output.inferred_account_id',
            lead_data: 'n_enrich.output.firmographic',
          },
        },
      },
      n_context: {
        type: 'agent.get_account_context',
        config: {
          include: 'crm,opps,hg_signals',
          input_bindings: { account_id: 'n_enrich.output.inferred_account_id' },
        },
      },
      n_email: {
        type: 'agent.draft_personalized_email',
        config: {
          purpose: 'Follow up on inbound interest — reference their {{trigger.data.event_type}} and open a discovery call',
          tone: 'helpful',
          max_words: 150,
          approval_required: true,
          input_bindings: {
            contact_id: 'trigger.data.contact_id',
            engagement_history: 'n_context.output.crm_data',
            context_notes: 'n_enrich.output.hg_signals',
          },
        },
      },
      n_task: {
        type: 'agent.create_crm_tasks',
        config: {
          default_due_in_days: 1,
          default_assignee: 'account owner',
          approval_required: false,
          input_bindings: { task_list: 'trigger.data.lead_name' },
        },
      },
      n_notify: {
        type: 'agent.notify_rep',
        config: {
          channel: 'both',
          message_template: 'Inbound · {{trigger.data.event_type}} from {{trigger.data.lead_name}} @ {{trigger.data.lead_company_domain}}. Fit: {{n_score.output.fit_tier}} ({{n_score.output.fit_score}}). Draft email ready to review.',
          input_bindings: {
            rep_id: 'n_context.output.account_summary',
            account_id: 'n_enrich.output.inferred_account_id',
          },
        },
      },
    },
    edges: [
      ['n_trigger', 'n_enrich'],
      ['n_enrich', 'n_score'],
      ['n_enrich', 'n_context'],
      ['n_score', 'n_email'],
      ['n_context', 'n_email'],
      ['n_email', 'n_task'],
      ['n_task', 'n_notify'],
    ],
  },
  mapping_notes: [
    'Fit-score gate: leads below "Medium" tier stop after step 2 and appear in the Unqualified Inbound panel',
    'Rep resolution falls back to territory rules when no CRM account match is found',
  ],
};

// Template 4: Intent Event Workflow (§3.4)
const GTM_INTENT_EVENT = {
  id: 'wf-tpl-intent-event',
  vertical: 'general',
  motion: 'inbound_events',
  name: 'Intent Event Workflow',
  description: 'Target account shows strong buying intent — researching competitors on TrustRadius or engaging with your 1P webinar. Surface it to the rep with full context and a ready-to-send outreach email before the competitor does.',
  bound_play_hint: 'Third-party intent → warm outreach',
  effectiveness_hint: '2.8× meeting-book rate when outreach happens within 24 hours of the intent event',
  batch_mode: false,
  tree: {
    output_node: 'n_notify',
    nodes: {
      n_trigger: {
        type: 'trigger.event_fired',
        config: {
          event_types: 'product_comparison,webinar_attended,pricing_page_visit',
          event_sources: 'TrustRadius,1P,G2',
        },
      },
      n_event: {
        type: 'agent.get_trigger_event_details',
        config: {
          include_raw_payload: 'yes',
          input_bindings: { event_id: 'trigger.data.event_type' },
        },
      },
      n_context: {
        type: 'agent.get_account_context',
        config: {
          include: 'crm,opps,hg_signals,icp_attributes',
          input_bindings: { account_id: 'trigger.data.account_id' },
        },
      },
      n_email: {
        type: 'agent.draft_personalized_email',
        config: {
          purpose: 'Reach out to account showing intent — reference the specific event and open a targeted conversation',
          tone: 'consultative',
          max_words: 160,
          approval_required: true,
          input_bindings: {
            contact_id: 'trigger.data.contact_id',
            context_notes: 'n_event.output.event_data',
            engagement_history: 'n_context.output.crm_data',
          },
        },
      },
      n_notify: {
        type: 'agent.notify_rep',
        config: {
          channel: 'both',
          message_template: '{{trigger.data.account_id}} showed intent on {{trigger.data.event_source}} ({{n_event.output.event_type}}). Account context + draft email ready.',
          input_bindings: {
            rep_id: 'n_context.output.account_summary',
            account_id: 'trigger.data.account_id',
          },
        },
      },
    },
    edges: [
      ['n_trigger', 'n_event'],
      ['n_trigger', 'n_context'],
      ['n_event', 'n_email'],
      ['n_context', 'n_email'],
      ['n_email', 'n_notify'],
    ],
  },
  mapping_notes: [
    'If contact_id is null on the trigger, the email drafts against the most recently engaged contact on the account (fallback rule)',
    'Add "Add contacts to sequence" as an optional step 5 for automated cadence enrollment',
  ],
};

// Template 5: Closed Won Competitor Targeting (§3.5)
const GTM_CLOSED_WON_COMPETITOR = {
  id: 'wf-tpl-closed-won-competitor',
  vertical: 'general',
  motion: 'competitive',
  name: 'Closed Won Competitor Targeting',
  description: 'When a deal closes, generate a list of accounts using the losing competitor. These accounts match your ICP and have a proven pain point — turn every win into a prospecting motion.',
  bound_play_hint: 'Won deal → competitor displacement targets',
  effectiveness_hint: '4.2× win rate on competitor-targeted outreach vs generic outbound; 22% of targeted accounts progress within 60 days',
  batch_mode: true,
  tree: {
    output_node: 'n_notify',
    nodes: {
      n_trigger: {
        type: 'trigger.crm_field_updated',
        config: {
          object: 'opportunity',
          field: 'Stage',
          target_value: 'Closed Won',
        },
      },
      n_context: {
        type: 'agent.get_account_context',
        config: {
          include: 'crm,hg_signals,icp_attributes',
          input_bindings: { account_id: 'trigger.data.account_id' },
        },
      },
      n_competitors: {
        type: 'agent.find_competitor_accounts',
        config: {
          competitor_source: 'CRM opportunity.competitor_mentioned',
          max_accounts: 20,
          input_bindings: {
            reference_account_id: 'trigger.data.account_id',
            competitor_product_ids: 'trigger.data.competitor_mentioned',
          },
        },
      },
      n_brief: {
        type: 'agent.generate_account_brief',
        config: {
          brief_type: 'closed-won follow-up',
          max_length: '300 words',
          input_bindings: { account_ids: 'n_competitors.output.account_list' },
        },
      },
      n_tasks: {
        type: 'agent.create_crm_tasks',
        config: {
          default_due_in_days: 3,
          default_assignee: 'opportunity owner',
          approval_required: true,
          input_bindings: {
            task_list: 'n_competitors.output.account_list',
          },
        },
      },
      n_notify: {
        type: 'agent.notify_rep',
        config: {
          channel: 'both',
          message_template: 'Congrats on {{trigger.data.account_name}}! {{n_competitors.output.account_list.length}} accounts using the same competitor identified. Briefs and tasks ready.',
          input_bindings: {
            rep_id: 'trigger.data.opportunity_id',
            account_id: 'trigger.data.account_id',
          },
        },
      },
    },
    edges: [
      ['n_trigger', 'n_context'],
      ['n_context', 'n_competitors'],
      ['n_competitors', 'n_brief'],
      ['n_brief', 'n_tasks'],
      ['n_tasks', 'n_notify'],
    ],
  },
  mapping_notes: [
    'When trigger.data.competitor_mentioned is empty, the agent falls back to the tenant\'s default competitor list (spec §5 D2)',
    'Max 20 tasks per closed-won event to prevent pipeline pollution',
  ],
};

const GTM_TEMPLATES = [
  GTM_CHAMPION_JOB_CHANGE,
  GTM_PROSPECTING_AGENT,
  GTM_INBOUND_LEAD,
  GTM_INTENT_EVENT,
  GTM_CLOSED_WON_COMPETITOR,
];

export const WORKFLOW_TEMPLATES = [
  ...GTM_TEMPLATES,
  SAAS_PQL_ACTIVATION,
  SAAS_RENEWAL_SAVE,
  FINTECH_COMPLIANCE_BRIEF,
  FINTECH_HIGH_VALUE,
  MFG_CAPEX_OUTREACH,
  MFG_MODERNIZATION_BRIEF,
];

export function listWorkflowTemplates() {
  return WORKFLOW_TEMPLATES;
}

export function getWorkflowTemplate(id) {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id) || null;
}
