// Config schemas for workflow node types — drives inspector forms and validation.

import { listActiveSignals } from './signals.js';

// Schemas keyed by node type. Fields share the same shape as signal schemas.
export const WORKFLOW_NODE_SCHEMAS = {
  // Triggers
  'trigger.signal': {
    fields: [
      {
        key: 'signal_id',
        label: 'Bound signal',
        type: 'select-signal',
        required: true,
        hint: 'Workflow fires when this signal evaluates true on an account',
      },
    ],
  },
  'trigger.manual': {
    fields: [
      {
        key: 'invocation',
        label: 'Invocation surface',
        type: 'select',
        options: ['thread', '@-mention', 'account header CTA', 'workbench tile'],
        required: true,
      },
    ],
  },
  'trigger.scheduled': {
    fields: [
      {
        key: 'interval',
        label: 'Schedule',
        type: 'text',
        placeholder: 'e.g., hourly, daily 6am UTC, on form submission',
        required: true,
      },
    ],
  },
  'trigger.champion_job_change': {
    fields: [
      {
        key: 'source',
        label: 'Signal source',
        type: 'select',
        options: ['LinkedIn · verified change', 'ZoomInfo · title change', 'HG · verified change'],
        required: true,
      },
      {
        key: 'min_seniority',
        label: 'Minimum seniority to fire',
        type: 'select',
        options: ['Any', 'Manager+', 'Director+', 'VP+', 'C-Level'],
        required: false,
      },
    ],
  },
  'trigger.event_fired': {
    fields: [
      {
        key: 'event_types',
        label: 'Event types (comma-separated)',
        type: 'text',
        placeholder: 'form_fill,demo_request,trial_signup,tr_contact_request,product_comparison,webinar_attended',
        required: true,
        hint: 'Filter which events fire this workflow',
      },
      {
        key: 'event_sources',
        label: 'Event sources',
        type: 'text',
        placeholder: 'e.g., TrustRadius, 1P, marketing_form',
        required: false,
      },
      {
        key: 'min_fit_score',
        label: 'Minimum fit score threshold',
        type: 'number',
        placeholder: '60',
        required: false,
        hint: 'Below-threshold leads land in the "Unqualified inbound" panel',
      },
    ],
  },
  'trigger.crm_field_updated': {
    fields: [
      {
        key: 'object',
        label: 'CRM object',
        type: 'select',
        options: ['opportunity', 'account', 'contact', 'lead'],
        required: true,
      },
      {
        key: 'field',
        label: 'Field to watch',
        type: 'text',
        placeholder: 'e.g., Stage, Status, Owner',
        required: true,
      },
      {
        key: 'target_value',
        label: 'New value that fires this trigger',
        type: 'text',
        placeholder: 'e.g., Closed Won',
        required: true,
      },
    ],
  },

  // Phoenix agents — config shape per agent family
  'agent.email_draft': {
    fields: [
      { key: 'tone', label: 'Tone', type: 'select', options: ['consultative', 'executive', 'helpful', 'urgent'], required: true },
      { key: 'cadence', label: 'Cadence', type: 'select', options: ['1-touch', '2-touch', '3-touch'], required: true },
      { key: 'channel', label: 'Channel', type: 'select', options: ['email', 'linkedin'], hint: 'Where the draft will be delivered' },
    ],
  },
  'agent.competitive_battlecard': {
    fields: [
      { key: 'competitor', label: 'Competitor', type: 'text', placeholder: 'e.g., Splunk, Datadog', required: true },
    ],
  },
  'agent.persona_discovery': {
    fields: [
      { key: 'titles', label: 'Titles to find', type: 'text', placeholder: 'VP,SVP,C-Level', required: true },
      { key: 'seniority', label: 'Seniority floor', type: 'select', options: ['Manager+', 'Director+', 'VP+', 'C-Level'] },
    ],
  },
  'agent.meeting_prep': {
    fields: [
      { key: 'meeting_type', label: 'Meeting type', type: 'select', options: ['discovery', 'demo', 'exec', 'qbr', 'renewal'], required: true },
    ],
  },
  'agent.value_hypothesis': {
    fields: [
      { key: 'focus', label: 'Focus', type: 'text', placeholder: 'e.g., MEDDIC roll-up, ROI quantification', required: true },
    ],
  },
  'agent.renewal_readiness': {
    fields: [
      { key: 'include', label: 'Include', type: 'text', placeholder: 'e.g., usage,nps,exec_engagement', required: true },
    ],
  },
  'agent.account_research': {
    fields: [
      { key: 'scope', label: 'Scope', type: 'select', options: ['web', 'sec', 'web+sec', 'web+sec+social'], required: true },
    ],
  },

  // ---- GTM atomic agents (write) ----
  'agent.upsert_crm_account': {
    fields: [
      { key: 'match_strategy', label: 'Match by', type: 'select', options: ['domain', 'name+domain', 'name'], required: true },
    ],
  },
  'agent.update_crm_contact_fields': {
    fields: [
      { key: 'fields_to_update', label: 'Fields to update (comma-separated)', type: 'text', placeholder: 'e.g., company,title,phone', required: true, hint: 'Values are mapped from prior steps or the trigger' },
    ],
  },
  'agent.add_contacts_to_crm': {
    fields: [
      { key: 'dedupe_by', label: 'Dedupe by', type: 'select', options: ['email', 'linkedin_id', 'name+company'], required: true },
    ],
  },
  'agent.update_account_status': {
    fields: [
      { key: 'status_value', label: 'Status value', type: 'text', placeholder: 'e.g., Prospecting, Active', required: true },
    ],
  },
  'agent.update_contact_status': {
    fields: [
      { key: 'status_value', label: 'Status value', type: 'text', placeholder: 'e.g., Prospecting, Active', required: true },
    ],
  },
  'agent.add_contacts_to_sequence': {
    fields: [
      { key: 'sequence_id', label: 'Sequence', type: 'text', placeholder: 'e.g., EMEA Outbound Q3', required: true },
      { key: 'fallback_to_crm_task', label: 'Fallback if Outreach not connected', type: 'select', options: ['Create CRM follow-up task', 'Skip step'], required: false, hint: 'V1 proxies through a CRM task when Outreach integration is absent' },
    ],
  },
  'agent.create_crm_tasks': {
    fields: [
      { key: 'default_due_in_days', label: 'Default due in (days)', type: 'number', placeholder: '3', required: true },
      { key: 'default_assignee', label: 'Default assignee', type: 'select', options: ['account owner', 'opportunity owner', 'rep on trigger', 'territory owner'], required: true },
    ],
  },
  'agent.update_opportunity_field': {
    fields: [
      { key: 'field', label: 'Field', type: 'text', placeholder: 'e.g., competitor_mentioned', required: true },
      { key: 'value_source', label: 'Value source', type: 'select', options: ['constant', 'trigger.data', 'prior step output'], required: true },
      { key: 'value', label: 'Value (if constant)', type: 'text', placeholder: 'e.g., CrowdStrike', required: false },
    ],
  },

  // ---- GTM atomic agents (read / generate) ----
  'agent.get_engagement_history': {
    fields: [
      { key: 'lookback_days', label: 'Lookback (days)', type: 'number', placeholder: '90', required: true },
      { key: 'types', label: 'Include types (comma-separated)', type: 'text', placeholder: 'email,meeting,call,note', required: false },
    ],
  },
  'agent.draft_personalized_email': {
    fields: [
      { key: 'purpose', label: 'Email purpose', type: 'text', placeholder: 'e.g., Congratulate on new role and stay in touch', required: true, hint: 'The intent the AI writes toward' },
      { key: 'tone', label: 'Tone', type: 'select', options: ['consultative', 'executive', 'helpful', 'warm', 'urgent'], required: true },
      { key: 'max_words', label: 'Max words', type: 'number', placeholder: '160', required: false },
    ],
  },
  'agent.get_book_of_accounts': {
    fields: [
      { key: 'fit_filter', label: 'Fit tier filter', type: 'select', options: ['Any', 'High only', 'High + Medium', 'Medium only'], required: true },
      { key: 'limit', label: 'Max accounts', type: 'number', placeholder: '10', required: true, hint: 'Range 1–50' },
    ],
  },
  'agent.generate_account_brief': {
    fields: [
      { key: 'brief_type', label: 'Brief type', type: 'select', options: ['prospecting', 'closed-won follow-up', 'renewal', 'meeting prep', 'exec sponsor'], required: true },
      { key: 'max_length', label: 'Max length', type: 'select', options: ['150 words', '300 words', '500 words'], required: false },
    ],
  },
  'agent.find_buying_personas': {
    fields: [
      { key: 'titles', label: 'Title keywords (comma-separated)', type: 'text', placeholder: 'VP Engineering,CTO,Head of Data', required: true },
      { key: 'seniority', label: 'Seniority floor', type: 'select', options: ['Manager+', 'Director+', 'VP+', 'C-Level'], required: true },
      { key: 'department', label: 'Department', type: 'text', placeholder: 'e.g., Engineering, Security, Marketing', required: false },
      { key: 'max_per_account', label: 'Max per account', type: 'number', placeholder: '3', required: false },
    ],
  },
  'agent.enrich_lead': {
    fields: [
      { key: 'sources', label: 'Sources', type: 'select', options: ['firmographic', 'firmographic + technographic', 'all (fastest)'], required: true },
    ],
  },
  'agent.score_account': {
    fields: [
      { key: 'model_id', label: 'Fit model', type: 'text', placeholder: 'e.g., fit-model-v4', required: true },
      { key: 'min_tier', label: 'Minimum tier to pass', type: 'select', options: ['Low', 'Medium', 'High'], required: false, hint: 'Downstream steps skip below-tier records' },
    ],
  },
  'agent.get_account_context': {
    fields: [
      { key: 'include', label: 'Include', type: 'text', placeholder: 'crm,opps,hg_signals,icp_attributes', required: true },
    ],
  },
  'agent.find_competitor_accounts': {
    fields: [
      { key: 'competitor_source', label: 'Competitor source', type: 'select', options: ['CRM opportunity.competitor_mentioned', 'Tenant default competitor list', 'Infer from HG signals'], required: true, hint: 'Spec §5 D2 — default list is most reliable' },
      { key: 'max_accounts', label: 'Max accounts to return', type: 'number', placeholder: '20', required: true },
    ],
  },
  'agent.get_trigger_event_details': {
    fields: [
      { key: 'include_raw_payload', label: 'Include raw payload', type: 'select', options: ['yes', 'no'], required: false },
    ],
  },
  'agent.notify_rep': {
    fields: [
      { key: 'channel', label: 'Channel', type: 'select', options: ['slack', 'in_app', 'both'], required: true },
      { key: 'message_template', label: 'Message template', type: 'text', placeholder: 'e.g., "{{account_name}} — new intent signal. Draft ready to review."', required: true, hint: 'Supports {{ trigger.data.* }} and {{ step_N.output.* }} interpolation' },
    ],
  },

  // API calls — endpoint-specific schemas
  'api.hg.install': {
    fields: [
      { key: 'entity', label: 'Entity', type: 'select', options: ['product', 'category', 'vendor'], required: true },
      { key: 'value', label: 'Value', type: 'text', placeholder: 'e.g., Splunk, BI, Salesforce', required: true },
    ],
  },
  'api.hg.spend': {
    fields: [
      { key: 'category', label: 'Spend category', type: 'select', options: ['IT', 'Cloud', 'Security', 'Marketing'], required: true },
    ],
  },
  'api.hg.intent': {
    fields: [
      { key: 'category', label: 'Intent category', type: 'text', placeholder: 'e.g., Observability, Risk Management', required: true },
    ],
  },
  'api.crm.read': {
    fields: [
      { key: 'object', label: 'Object', type: 'select', options: ['account', 'contact', 'opportunity', 'lead', 'activity'], required: true },
      { key: 'fields', label: 'Fields', type: 'text', placeholder: 'comma-separated, e.g., arr,stage,renewal_date', required: true },
    ],
  },
  'api.crm.write': {
    fields: [
      { key: 'field', label: 'Field to update', type: 'text', placeholder: 'e.g., lead_owner, stage', required: true },
      { key: 'value', label: 'Value or expression', type: 'text', placeholder: 'e.g., next_AE_in_queue', required: true },
    ],
  },
  'api.crm.create_task': {
    fields: [
      { key: 'type', label: 'Task type', type: 'text', placeholder: 'e.g., follow-up call, demo prep', required: true },
      { key: 'due_in_hours', label: 'Due in (hours)', type: 'number', placeholder: '48', required: true },
    ],
  },
  'api.outreach.enroll': {
    fields: [
      { key: 'sequence', label: 'Sequence name', type: 'text', placeholder: 'e.g., EMEA Displacement', required: true },
    ],
  },
  'api.marketo.trigger': {
    fields: [
      { key: 'program', label: 'Program name', type: 'text', placeholder: 'e.g., Q2 Re-engagement', required: true },
    ],
  },
  'api.slack.notify': {
    fields: [
      { key: 'channel', label: 'Channel or @user', type: 'text', placeholder: 'e.g., #renewal-watch', required: true },
      { key: 'message', label: 'Message template (optional)', type: 'text', placeholder: 'e.g., "Renewal action needed for {{account}}"' },
    ],
  },
  'api.custom.webhook': {
    fields: [
      { key: 'endpoint', label: 'Endpoint name', type: 'text', placeholder: 'e.g., fit-score-v2', required: true },
      { key: 'returns', label: 'Returns', type: 'text', placeholder: 'e.g., score 0-100' },
    ],
  },

  // Logic
  'logic.branch': {
    fields: [
      { key: 'on', label: 'Branch on (upstream key)', type: 'text', placeholder: 'e.g., account.arr, fit_score', required: true },
      { key: 'op', label: 'Operator', type: 'select', options: ['>', '<', '>=', '<=', '=', '!=', 'in'], required: true },
      { key: 'value', label: 'Value', type: 'text', placeholder: 'e.g., $100k, 80', required: true },
    ],
  },
  'logic.match': {
    fields: [
      { key: 'on', label: 'Match on', type: 'text', placeholder: 'e.g., account.tier, intent_topic', required: true },
      { key: 'cases', label: 'Cases (comma-separated)', type: 'text', placeholder: 'e.g., A,B,C,Out' },
    ],
  },
  'logic.loop': {
    fields: [
      { key: 'over', label: 'Iterate over', type: 'text', placeholder: 'e.g., discovered_contacts, opportunities', required: true },
    ],
  },

  // Checkpoint
  'checkpoint.approval': {
    fields: [
      { key: 'assignee_role', label: 'Assignee role', type: 'select', options: ['AE', 'AM', 'CSM', 'SDR', 'admin'], required: true },
      { key: 'sla_hours', label: 'SLA (hours)', type: 'number', placeholder: '24', required: true },
    ],
  },
  'checkpoint.review': {
    fields: [
      { key: 'audience', label: 'Audience', type: 'text', placeholder: 'e.g., AE, CSM, account owner', required: true },
      { key: 'sla_hours', label: 'Auto-continue after (hours)', type: 'number', placeholder: '24' },
    ],
  },
  'checkpoint.batch_approval': {
    fields: [
      { key: 'assignee_role', label: 'Assignee role', type: 'select', options: ['AE', 'AM', 'CSM', 'SDR', 'admin'], required: true },
      { key: 'sla_hours', label: 'SLA (hours)', type: 'number', placeholder: '24', required: true },
      { key: 'group_by', label: 'Group items by', type: 'select', options: ['account', 'contact', 'none (flat list)'], required: false, hint: 'How to organize items in the batch-review UI' },
      { key: 'per_item_edit', label: 'Allow per-item edit', type: 'select', options: ['yes', 'no'], required: false, hint: 'Reps can edit individual drafts before approving' },
    ],
  },

  // Wait
  'wait.duration': {
    fields: [
      { key: 'days', label: 'Days to wait', type: 'number', placeholder: '7' },
      { key: 'hours', label: 'Or hours', type: 'number', placeholder: '24' },
    ],
  },
  'wait.event': {
    fields: [
      { key: 'until', label: 'Wait until event', type: 'text', placeholder: 'e.g., outreach.reply_received, crm.stage_changed', required: true },
      { key: 'timeout_hours', label: 'Timeout (hours)', type: 'number', placeholder: '168' },
    ],
  },

  // Outputs
  'output.outcome': {
    fields: [
      { key: 'capture', label: 'Outcomes to capture (comma-separated)', type: 'text', placeholder: 'e.g., replied, booked, no_response_14d', required: true, hint: 'Outcomes feed the per-tenant scoring model' },
    ],
  },
  'output.notify': {
    fields: [
      { key: 'channel', label: 'Channel', type: 'select', options: ['thread', 'slack', 'email', 'in-app'], required: true },
      { key: 'format', label: 'Format', type: 'select', options: ['brief', 'summary', 'detail'], hint: 'Determines payload shape' },
    ],
  },
};

export function defaultWorkflowConfig(type) {
  const schema = WORKFLOW_NODE_SCHEMAS[type];
  if (!schema) return {};
  const cfg = {};
  for (const field of schema.fields) {
    if (field.type === 'select' && Array.isArray(field.options)) {
      cfg[field.key] = field.options[0];
    } else if (field.type === 'select-signal') {
      // Pick first active signal as a sensible default
      const active = listActiveSignals();
      cfg[field.key] = active[0]?.id || '';
    } else {
      cfg[field.key] = '';
    }
  }
  return cfg;
}

export function validateWorkflowNodeConfig(type, config) {
  const schema = WORKFLOW_NODE_SCHEMAS[type];
  if (!schema) return { ok: true, missing: [] };
  const missing = [];
  for (const field of schema.fields) {
    if (field.required) {
      const v = config?.[field.key];
      if (v == null || String(v).trim() === '') missing.push(field.key);
    }
  }
  return { ok: missing.length === 0, missing };
}
