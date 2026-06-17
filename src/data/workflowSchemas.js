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
