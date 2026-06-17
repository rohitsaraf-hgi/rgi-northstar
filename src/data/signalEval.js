// Lightweight signal evaluator for the preview rail.
//
// This is NOT production eval — real evaluation runs on the compute layer
// (event-triggered + nightly rollup) and operates on real source data. Here
// we use a fixed set of mock accounts with flat data keys, walk the tree
// recursively, and return per-node values + an evidence trace.

import { NODE_TYPES } from './signals.js';

// ----- Mock accounts -----
//
// Data keys follow a flat namespace so the evaluator can look up sources by
// composing keys from node config. Numeric values are scalar; event sources
// return { last_days_ago, count_30d, has_in_last_campaign } where applicable.

export const SAMPLE_ACCOUNTS = [
  {
    id: 'acme',
    name: 'Acme Corp',
    logoColor: '#0ea5e9',
    data: {
      // HG signals
      'hg.product.Splunk.install_age': 47,
      'hg.category.IT.spend_yoy': -12,
      'hg.category.Cloud.spend_yoy': 8,
      'hg.category.BI.install_count': 3,
      // CRM
      'crm.opportunity.closed_won_date.days_ago': 47,
      'crm.account.arr': 84000,
      'crm.account.renewal_date.days_until': 320,
      'crm.contact.is_champion': true,
      // Events — last_days_ago : how recently the last event arrived
      'event.product.login.last_days_ago': 23,
      'event.marketo.email_response.has_in_last_campaign': false,
      'event.marketo.email_opened.count_30d': 0,
      'event.marketo.form_submitted.count_30d': 0,
      'event.marketo.content_downloaded.count_30d': 0,
      'event.product.feature_usage.delta_30d': -8,
      'event.gong.exec_meeting.last_days_ago': 14,
    },
  },
  {
    id: 'globex',
    name: 'Globex Industries',
    logoColor: '#10b981',
    data: {
      'hg.product.Splunk.install_age': 41,
      'hg.category.IT.spend_yoy': -18,
      'hg.category.Cloud.spend_yoy': 24,
      'hg.category.BI.install_count': 5,
      'crm.opportunity.closed_won_date.days_ago': 220,
      'crm.account.arr': 320000,
      'crm.account.renewal_date.days_until': 81,
      'crm.contact.is_champion': true,
      'event.product.login.last_days_ago': 2,
      'event.marketo.email_response.has_in_last_campaign': true,
      'event.marketo.email_opened.count_30d': 18,
      'event.marketo.form_submitted.count_30d': 3,
      'event.marketo.content_downloaded.count_30d': 2,
      'event.product.feature_usage.delta_30d': -22,
      'event.gong.exec_meeting.last_days_ago': 78,
    },
  },
  {
    id: 'initech',
    name: 'Initech',
    logoColor: '#8b5cf6',
    data: {
      'hg.product.Splunk.install_age': 18,
      'hg.category.IT.spend_yoy': 4,
      'hg.category.Cloud.spend_yoy': 12,
      'hg.category.BI.install_count': 2,
      'crm.opportunity.closed_won_date.days_ago': 410,
      'crm.account.arr': 18000,
      'crm.account.renewal_date.days_until': 240,
      'crm.contact.is_champion': false,
      'event.product.login.last_days_ago': 1,
      'event.marketo.email_response.has_in_last_campaign': true,
      'event.marketo.email_opened.count_30d': 22,
      'event.marketo.form_submitted.count_30d': 4,
      'event.marketo.content_downloaded.count_30d': 1,
      'event.product.feature_usage.delta_30d': 6,
      'event.gong.exec_meeting.last_days_ago': 21,
    },
  },
  {
    id: 'wonka',
    name: 'Wonka Industries',
    logoColor: '#f59e0b',
    data: {
      'hg.product.Splunk.install_age': 12,
      'hg.category.IT.spend_yoy': 9,
      'hg.category.Cloud.spend_yoy': 28,
      'hg.category.BI.install_count': 7,
      'crm.opportunity.closed_won_date.days_ago': 830,
      'crm.account.arr': 480000,
      'crm.account.renewal_date.days_until': 190,
      'crm.contact.is_champion': true,
      'event.product.login.last_days_ago': 0,
      'event.marketo.email_response.has_in_last_campaign': true,
      'event.marketo.email_opened.count_30d': 12,
      'event.marketo.form_submitted.count_30d': 2,
      'event.marketo.content_downloaded.count_30d': 5,
      'event.product.feature_usage.delta_30d': 11,
      'event.gong.exec_meeting.last_days_ago': 10,
    },
  },
  {
    id: 'contoso',
    name: 'Contoso Health',
    logoColor: '#f43f5e',
    data: {
      'hg.product.Splunk.install_age': 26,
      'hg.category.IT.spend_yoy': -4,
      'hg.category.Cloud.spend_yoy': 2,
      'hg.category.BI.install_count': 4,
      'crm.opportunity.closed_won_date.days_ago': 720,
      'crm.account.arr': 145000,
      'crm.account.renewal_date.days_until': 62,
      'crm.contact.is_champion': false,
      'event.product.login.last_days_ago': 9,
      'event.marketo.email_response.has_in_last_campaign': false,
      'event.marketo.email_opened.count_30d': 6,
      'event.marketo.form_submitted.count_30d': 1,
      'event.marketo.content_downloaded.count_30d': 0,
      'event.product.feature_usage.delta_30d': -14,
      'event.gong.exec_meeting.last_days_ago': 84,
    },
  },
  {
    id: 'piedpiper',
    name: 'Pied Piper',
    logoColor: '#22c55e',
    data: {
      'hg.product.Splunk.install_age': 6,
      'hg.category.IT.spend_yoy': 11,
      'hg.category.Cloud.spend_yoy': 19,
      'hg.category.BI.install_count': 1,
      'crm.opportunity.closed_won_date.days_ago': 38,
      'crm.account.arr': 12000,
      'crm.account.renewal_date.days_until': 340,
      'crm.contact.is_champion': false,
      'event.product.login.last_days_ago': 28,
      'event.marketo.email_response.has_in_last_campaign': false,
      'event.marketo.email_opened.count_30d': 1,
      'event.marketo.form_submitted.count_30d': 0,
      'event.marketo.content_downloaded.count_30d': 0,
      'event.product.feature_usage.delta_30d': -2,
      'event.gong.exec_meeting.last_days_ago': 120,
    },
  },
];

// ----- Helpers -----

function parentsOf(id, tree) {
  return (tree.edges || []).filter(([, to]) => to === id).map(([f]) => f);
}

function buildSourceKey(node) {
  const c = node.config || {};
  if (node.type === 'source.hg') {
    return `hg.${c.entity}.${c.value}.${c.field}`;
  }
  if (node.type === 'source.crm') {
    return `crm.${c.object}.${c.field}`;
  }
  if (node.type === 'source.event') {
    // Source event keys take a hint suffix from the most-likely consumer.
    // Without a downstream consumer hint we default to last_days_ago.
    return `event.${c.source}.${c.event}`;
  }
  return null;
}

// ----- Parsers -----

// Parse a value spec like "$25k", "36 months", "0%", "EMEA" into a comparable number or string.
function parseValue(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  // Handle currency shorthand
  const m = s.match(/^\$?(-?[0-9.]+)\s*([kKmMbB]?)/);
  if (m) {
    const n = parseFloat(m[1]);
    const suffix = (m[2] || '').toLowerCase();
    const mult = suffix === 'k' ? 1000 : suffix === 'm' ? 1e6 : suffix === 'b' ? 1e9 : 1;
    if (!Number.isNaN(n)) return n * mult;
  }
  // Bare numeric
  const f = parseFloat(s);
  if (!Number.isNaN(f) && /^-?[0-9.]+/.test(s)) return f;
  // Boolean
  if (s.toLowerCase() === 'true') return true;
  if (s.toLowerCase() === 'false') return false;
  return s;
}

// Parse a time window like "last 21 days", "within 90 days", "no event in last 21 days"
// into a structured filter applied to event/scalar values.
function parseWindow(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase();
  const negative = /\bno event\b|\bno activity\b/.test(s);
  const m = s.match(/(\d+)\s*(day|week|month)/);
  if (!m) return { negative, days: null };
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const days = unit === 'day' ? n : unit === 'week' ? n * 7 : n * 30;
  return { negative, days };
}

// ----- Per-family evaluation -----

function evalSource(node, account) {
  const baseKey = buildSourceKey(node);
  if (!baseKey) return { value: null, evidence: 'unknown source config' };
  // For event sources, default to last_days_ago — windowed access can refine.
  let key = baseKey;
  if (node.type === 'source.event') {
    key = `${baseKey}.last_days_ago`;
    if (account.data[key] == null) {
      // Fall back to has_in_last_campaign if present
      const altKey = `${baseKey}.has_in_last_campaign`;
      if (account.data[altKey] != null) {
        return {
          value: account.data[altKey],
          evidence: `${baseKey}.has_in_last_campaign = ${account.data[altKey]}`,
          keyBase: baseKey,
        };
      }
      const countKey = `${baseKey}.count_30d`;
      if (account.data[countKey] != null) {
        return {
          value: account.data[countKey],
          evidence: `${baseKey}.count_30d = ${account.data[countKey]}`,
          keyBase: baseKey,
        };
      }
    }
  }
  const value = account.data[key];
  if (value === undefined) {
    return { value: null, evidence: `no value for ${key}`, keyBase: baseKey };
  }
  return { value, evidence: `${key} = ${value}`, keyBase: baseKey };
}

function evalWindow(node, parentResults, account) {
  if (parentResults.length === 0) return { value: null, evidence: 'window has no input' };
  const parent = parentResults[0];
  const w = parseWindow(node.config?.window);
  if (!w) return parent;
  if (w.negative) {
    // "no event in last N days" — true if parent's last_days_ago > N or null/missing
    if (parent.value == null) {
      return { value: true, evidence: `no recent activity (no events)` };
    }
    const fires = typeof parent.value === 'number' && parent.value > (w.days || 0);
    return {
      value: fires,
      evidence: `${parent.evidence} — ${fires ? `> ${w.days}d ago ✓` : `within ${w.days}d ✗`}`,
    };
  }
  // Positive "within N days" / "last N days" — true if value <= N (for events) or
  // value is within bounds for closed_won_date.days_ago / renewal_date.days_until.
  if (typeof parent.value === 'number' && w.days != null) {
    const fires = parent.value <= w.days;
    return {
      value: fires,
      evidence: `${parent.evidence} ≤ ${w.days}d → ${fires}`,
    };
  }
  return parent;
}

function evalCompute(node, parentResults) {
  if (parentResults.length === 0) return { value: null, evidence: 'compute has no input' };
  const op = node.config?.op;
  if (parentResults.length === 1) {
    const p = parentResults[0];
    if (op === 'stale_for') {
      // Pass through — meaning is captured by the parent's days value
      return { value: p.value, evidence: `stale_for: ${p.evidence}` };
    }
    if (op === 'YoY %' || op === 'MoM %') {
      return { value: p.value, evidence: `${op}: ${p.evidence}` };
    }
    return p;
  }
  // Multi-input aggregate
  const vals = parentResults.map((r) => r.value).filter((v) => typeof v === 'number');
  if (op === 'count' || op === 'sum') {
    const total = vals.reduce((a, b) => a + b, 0);
    return { value: total, evidence: `${op}(${vals.join(', ')}) = ${total}` };
  }
  if (op === 'avg') {
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { value: avg, evidence: `avg = ${avg.toFixed(1)}` };
  }
  if (op === 'weighted_sum') {
    // Demo: equal weights
    const total = vals.reduce((a, b) => a + b, 0);
    return { value: total, evidence: `weighted_sum = ${total}` };
  }
  return { value: vals[0] ?? null, evidence: `${op}: passthrough` };
}

function compareValues(a, op, b) {
  if (op === 'is_null') return a == null || a === '' || a === false;
  if (op === 'is_not_null') return a != null && a !== '' && a !== false;
  if (a == null) return false;
  if (op === '=') return a == b; // eslint-disable-line eqeqeq
  if (op === '!=') return a != b; // eslint-disable-line eqeqeq
  const aN = typeof a === 'number' ? a : parseFloat(a);
  const bN = typeof b === 'number' ? b : parseFloat(b);
  if (Number.isNaN(aN) || Number.isNaN(bN)) return false;
  if (op === '>') return aN > bN;
  if (op === '<') return aN < bN;
  if (op === '>=') return aN >= bN;
  if (op === '<=') return aN <= bN;
  return false;
}

function evalRule(node, parentResults) {
  const op = node.config?.op;
  if (op === 'AND' || op === 'OR' || op === 'NOT') {
    const truthy = parentResults.map((r) => Boolean(r.value));
    let value;
    if (op === 'AND') value = truthy.length > 0 && truthy.every(Boolean);
    else if (op === 'OR') value = truthy.some(Boolean);
    else value = truthy.length === 1 ? !truthy[0] : false;
    return {
      value,
      evidence: `${op}(${truthy.map((t) => (t ? '✓' : '✗')).join(' ')}) → ${value}`,
    };
  }
  // Compare: single parent + value config
  if (parentResults.length === 0) return { value: null, evidence: 'compare has no input' };
  const parent = parentResults[0];
  const cmp = parseValue(node.config?.value);
  const fires = compareValues(parent.value, op, cmp);
  const evidence = `${parent.evidence} ${op} ${node.config?.value ?? ''} → ${fires}`;
  return { value: fires, evidence };
}

function evalThreshold(node, parentResults) {
  if (parentResults.length === 0) return { value: null, evidence: 'threshold has no input' };
  const p = parentResults[0];
  if (node.type === 'threshold.boolean') {
    return { value: Boolean(p.value), evidence: p.evidence };
  }
  if (node.type === 'threshold.tier') {
    // Demo bucketization on a numeric value
    const v = typeof p.value === 'number' ? p.value : 0;
    const tier = v > 20 ? 'A' : v > 10 ? 'B' : v > 0 ? 'C' : 'Out';
    return { value: tier, evidence: `value=${v} → tier ${tier}` };
  }
  if (node.type === 'threshold.score') {
    const v = typeof p.value === 'number' ? p.value : 0;
    const score = Math.max(0, Math.min(100, Math.round(v * 4)));
    return { value: score, evidence: `score=${score}` };
  }
  return p;
}

// ----- Top-level eval -----

function evalNode(id, tree, account, memo) {
  if (memo[id]) return memo[id];
  const node = tree.nodes[id];
  if (!node) {
    const r = { value: null, evidence: 'node missing' };
    memo[id] = r;
    return r;
  }
  const meta = NODE_TYPES[node.type];
  if (!meta) {
    const r = { value: null, evidence: `unknown type ${node.type}` };
    memo[id] = r;
    return r;
  }
  const parents = parentsOf(id, tree);
  const parentResults = parents.map((p) => evalNode(p, tree, account, memo));
  let result;
  if (meta.family === 'source') result = evalSource(node, account);
  else if (meta.family === 'window') result = evalWindow(node, parentResults, account);
  else if (meta.family === 'compute') result = evalCompute(node, parentResults);
  else if (meta.family === 'rule') result = evalRule(node, parentResults);
  else if (meta.family === 'threshold') result = evalThreshold(node, parentResults);
  else result = { value: null, evidence: 'unknown family' };
  memo[id] = result;
  return result;
}

export function evaluateSignal(tree, account) {
  if (!tree?.output_node || !tree.nodes?.[tree.output_node]) {
    return { value: null, fires: false, evidence: [], result: null };
  }
  const memo = {};
  const result = evalNode(tree.output_node, tree, account, memo);
  // Collect evidence from source nodes for the trace.
  const evidence = [];
  for (const [nodeId, node] of Object.entries(tree.nodes)) {
    const meta = NODE_TYPES[node.type];
    if (meta?.family === 'source') {
      const r = memo[nodeId];
      if (r) evidence.push({ nodeId, type: node.type, evidence: r.evidence, value: r.value });
    }
  }
  return {
    value: result.value,
    fires: Boolean(result.value),
    evidence,
    result,
  };
}

export function batchEvaluate(tree, accounts = SAMPLE_ACCOUNTS) {
  return accounts.map((a) => ({
    account: a,
    ...evaluateSignal(tree, a),
  }));
}
