// Structured config schemas per node type — drives the typed forms in the
// inspector and the validator.
//
// Field shapes:
//   { key, label, type: 'text'|'select'|'number', placeholder?, options?, hint?, required? }

export const NODE_CONFIG_SCHEMAS = {
  'source.hg': {
    family: 'source',
    fields: [
      {
        key: 'entity',
        label: 'Entity type',
        type: 'select',
        options: ['product', 'category', 'vendor'],
        required: true,
        hint: 'What kind of HG entity to look up',
      },
      {
        key: 'value',
        label: 'Value',
        type: 'text',
        placeholder: 'e.g., Splunk, AWS, IT, BI',
        required: true,
        hint: 'The specific product / category / vendor name',
      },
      {
        key: 'field',
        label: 'Field',
        type: 'select',
        options: ['install_age', 'install_count', 'spend_yoy', 'spend_absolute', 'intent_score', 'tech_churn'],
        required: true,
        hint: 'Which HG signal to pull for this entity',
      },
    ],
  },
  'source.crm': {
    family: 'source',
    fields: [
      {
        key: 'object',
        label: 'CRM object',
        type: 'select',
        options: ['account', 'contact', 'opportunity', 'activity', 'campaign_member'],
        required: true,
      },
      {
        key: 'field',
        label: 'Field name',
        type: 'text',
        placeholder: 'e.g., arr, stage, closed_won_date, is_champion',
        required: true,
        hint: 'Matches your CRM field exactly',
      },
    ],
  },
  'source.event': {
    family: 'source',
    fields: [
      {
        key: 'source',
        label: 'Event source',
        type: 'select',
        options: ['marketo', 'outreach', 'gong', 'segment', 'amplitude', 'product', 'custom'],
        required: true,
      },
      {
        key: 'event',
        label: 'Event name',
        type: 'text',
        placeholder: 'e.g., email_opened, reply_received, login, exec_meeting',
        required: true,
      },
    ],
  },
  'window.relative': {
    family: 'window',
    fields: [
      {
        key: 'window',
        label: 'Time window',
        type: 'text',
        placeholder: 'e.g., last 21 days, within 90 days, since renewal - 90d',
        required: true,
        hint: 'Use natural-language windows; resolved at evaluation time',
      },
    ],
  },
  'compute.aggregate': {
    family: 'compute',
    fields: [
      {
        key: 'op',
        label: 'Operation',
        type: 'select',
        options: ['count', 'sum', 'avg', 'min', 'max', 'percentile_50', 'percentile_90', 'weighted_sum'],
        required: true,
      },
      {
        key: 'window',
        label: 'Window (optional)',
        type: 'text',
        placeholder: 'e.g., last 30d',
        hint: 'If unspecified, aggregates over the upstream stream as-is',
      },
    ],
  },
  'compute.delta': {
    family: 'compute',
    fields: [
      {
        key: 'op',
        label: 'Delta type',
        type: 'select',
        options: ['YoY %', 'MoM %', 'last 30d vs prior 30d', 'last 7d vs prior 7d', 'stale_for'],
        required: true,
      },
    ],
  },
  'compute.ratio': {
    family: 'compute',
    fields: [
      {
        key: 'op',
        label: 'Ratio expression',
        type: 'text',
        placeholder: 'e.g., opens / sent, replies / outreach',
        required: true,
      },
    ],
  },
  'rule.compare': {
    family: 'rule',
    fields: [
      {
        key: 'op',
        label: 'Comparator',
        type: 'select',
        options: ['>', '<', '>=', '<=', '=', '!=', 'in', 'between', 'is_null', 'is_not_null'],
        required: true,
      },
      {
        key: 'value',
        label: 'Value',
        type: 'text',
        placeholder: 'e.g., 36, $25k, EMEA',
        hint: 'Leave empty for is_null / is_not_null',
      },
    ],
  },
  'rule.logic': {
    family: 'rule',
    fields: [
      {
        key: 'op',
        label: 'Operator',
        type: 'select',
        options: ['AND', 'OR', 'NOT'],
        required: true,
      },
    ],
  },
  'threshold.boolean': {
    family: 'threshold',
    fields: [
      {
        key: 'name',
        label: 'Signal name',
        type: 'text',
        placeholder: 'e.g., Onboarding Stalled',
        required: true,
        hint: 'Shown in HG Pulse, Plays, and account views',
      },
    ],
  },
  'threshold.tier': {
    family: 'threshold',
    fields: [
      {
        key: 'bands',
        label: 'Tier bands',
        type: 'text',
        placeholder: 'A:>20% / B:10-20% / C:0-10% / Out:<0%',
        required: true,
        hint: 'Format: bucket:condition separated by / — left-most band gets the highest priority',
      },
    ],
  },
  'threshold.score': {
    family: 'threshold',
    fields: [
      {
        key: 'scale',
        label: 'Score scale',
        type: 'text',
        placeholder: 'e.g., 0-100 capped at percentile-95',
        required: true,
        hint: 'How the upstream value maps to the final 0-100 score',
      },
    ],
  },
};

// Default config when a fresh node is added.
export function defaultConfigForType(type) {
  const schema = NODE_CONFIG_SCHEMAS[type];
  if (!schema) return {};
  const cfg = {};
  for (const field of schema.fields) {
    if (field.type === 'select' && Array.isArray(field.options)) {
      cfg[field.key] = field.options[0];
    } else {
      cfg[field.key] = '';
    }
  }
  return cfg;
}

// Validate a single node's config against its schema.
// Returns { ok, missing: [...required keys] }.
export function validateNodeConfig(type, config) {
  const schema = NODE_CONFIG_SCHEMAS[type];
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
