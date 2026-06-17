// Pure helpers for working with workflow trees (DAGs).
// Mirrors signalGraph.js but with workflow-specific validation:
//   - Exactly one trigger node, must be a root
//   - At least one terminal output node
//   - Branches may have 2+ outgoing edges (we don't enforce <=2)

import { WORKFLOW_NODE_TYPES, isTerminal, isTrigger } from './workflowNodes.js';
import { defaultWorkflowConfig, validateWorkflowNodeConfig } from './workflowSchemas.js';
import { integrationForWorkflowNode, isAgentAccessEnabled } from './integrationGovernance.js';
import { CONNECTED_APPS } from './surfaces.js';

function findIntegrationStatus(integrationId) {
  for (const cat of CONNECTED_APPS) {
    const found = cat.apps.find((a) => a.id === integrationId);
    if (found) return found;
  }
  return null;
}

let workflowNodeCounter = 0;
export function nextWorkflowNodeId(prefix = 'n') {
  workflowNodeCounter += 1;
  return `${prefix}_${workflowNodeCounter}_${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyWorkflowTree() {
  return { nodes: {}, edges: [], output_node: null };
}

export function cloneWorkflowTree(tree) {
  return {
    output_node: tree.output_node || null,
    nodes: Object.fromEntries(
      Object.entries(tree.nodes || {}).map(([id, n]) => [id, { type: n.type, config: { ...n.config } }]),
    ),
    edges: (tree.edges || []).map(([f, t]) => [f, t]),
  };
}

// Depth of each node from the trigger (or any root if no trigger).
export function computeWorkflowDepth(tree) {
  if (!tree?.nodes) return {};
  const depth = {};
  const outgoing = {};
  for (const [from, to] of tree.edges || []) {
    if (!outgoing[from]) outgoing[from] = [];
    outgoing[from].push(to);
  }
  const hasIncoming = new Set();
  for (const [, to] of tree.edges || []) hasIncoming.add(to);
  const roots = Object.keys(tree.nodes).filter((id) => !hasIncoming.has(id));

  function visit(id, d, seen) {
    if (seen.has(id)) return;
    if (depth[id] != null && depth[id] >= d) return;
    depth[id] = d;
    const outs = outgoing[id] || [];
    const nextSeen = new Set(seen);
    nextSeen.add(id);
    for (const to of outs) visit(to, d + 1, nextSeen);
  }
  for (const root of roots) visit(root, 0, new Set());
  for (const id of Object.keys(tree.nodes)) {
    if (depth[id] == null) depth[id] = 0;
  }
  return depth;
}

export function computeWorkflowLayout(tree) {
  const depth = computeWorkflowDepth(tree);
  const rows = {};
  for (const id of Object.keys(tree.nodes || {})) {
    const r = depth[id] ?? 0;
    if (!rows[r]) rows[r] = [];
    rows[r].push(id);
  }
  for (const r of Object.keys(rows)) rows[r].sort();
  const positions = {};
  for (const r of Object.keys(rows)) {
    const ids = rows[r];
    ids.forEach((id, col) => {
      positions[id] = { row: Number(r), col, rowSize: ids.length };
    });
  }
  return { positions, maxRow: Math.max(0, ...Object.keys(rows).map(Number)) };
}

export function addWorkflowNode(tree, type, config) {
  const id = nextWorkflowNodeId();
  const finalConfig = { ...defaultWorkflowConfig(type), ...(config || {}) };
  const next = {
    ...tree,
    nodes: { ...tree.nodes, [id]: { type, config: finalConfig } },
  };
  if (isTerminal(type) && !tree.output_node) {
    next.output_node = id;
  }
  return { tree: next, id };
}

export function removeWorkflowNode(tree, id) {
  if (!tree.nodes[id]) return tree;
  const { [id]: _omit, ...rest } = tree.nodes;
  const next = {
    ...tree,
    nodes: rest,
    edges: tree.edges.filter(([f, t]) => f !== id && t !== id),
  };
  if (tree.output_node === id) next.output_node = null;
  return next;
}

function workflowCanReach(tree, from, target) {
  const outgoing = {};
  for (const [f, t] of tree.edges) {
    if (!outgoing[f]) outgoing[f] = [];
    outgoing[f].push(t);
  }
  const stack = [from];
  const seen = new Set();
  while (stack.length) {
    const id = stack.pop();
    if (id === target) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const next of outgoing[id] || []) stack.push(next);
  }
  return false;
}

export function addWorkflowEdge(tree, from, to) {
  if (from === to) return { tree, error: 'Cannot connect a node to itself.' };
  if (!tree.nodes[from] || !tree.nodes[to]) {
    return { tree, error: 'Node not found.' };
  }
  if (tree.edges.some(([f, t]) => f === from && t === to)) {
    return { tree, error: 'Edge already exists.' };
  }
  // Terminal outputs cannot be source of an edge.
  const fromMeta = WORKFLOW_NODE_TYPES[tree.nodes[from].type];
  if (fromMeta?.isTerminal) {
    return { tree, error: 'Terminal output cannot feed another node.' };
  }
  // Triggers cannot be the target of an edge.
  const toMeta = WORKFLOW_NODE_TYPES[tree.nodes[to].type];
  if (toMeta?.isTrigger) {
    return { tree, error: 'Trigger cannot be the target of an edge.' };
  }
  if (workflowCanReach(tree, to, from)) {
    return { tree, error: 'Cannot create a cycle.' };
  }
  return {
    tree: { ...tree, edges: [...tree.edges, [from, to]] },
  };
}

export function removeWorkflowEdge(tree, from, to) {
  return {
    ...tree,
    edges: tree.edges.filter(([f, t]) => !(f === from && t === to)),
  };
}

export function updateWorkflowNodeConfig(tree, id, patch) {
  if (!tree.nodes[id]) return tree;
  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [id]: { ...tree.nodes[id], config: { ...tree.nodes[id].config, ...patch } },
    },
  };
}

export function setWorkflowOutputNode(tree, id) {
  if (!tree.nodes[id]) return tree;
  if (!isTerminal(tree.nodes[id].type)) return tree;
  return { ...tree, output_node: id };
}

export function validateWorkflowTree(tree) {
  const issues = [];
  const nodeIds = Object.keys(tree.nodes || {});
  if (nodeIds.length === 0) {
    return { ok: false, issues: [{ severity: 'error', message: 'Empty workflow — add a trigger, at least one step, and an outcome logger.' }] };
  }
  const triggers = nodeIds.filter((id) => isTrigger(tree.nodes[id].type));
  if (triggers.length === 0) {
    issues.push({ severity: 'error', message: 'Add a trigger node (signal / manual / scheduled).' });
  } else if (triggers.length > 1) {
    issues.push({ severity: 'error', message: 'Only one trigger node is allowed per workflow.' });
  }
  const terminals = nodeIds.filter((id) => isTerminal(tree.nodes[id].type));
  if (terminals.length === 0) {
    issues.push({ severity: 'error', message: 'Add a terminal output (Outcome Logger or Notify).' });
  } else if (!tree.output_node) {
    issues.push({ severity: 'warning', message: 'Set a terminal as the workflow output.' });
  }
  // Trigger must be a root (no incoming edges).
  if (triggers.length === 1) {
    const triggerId = triggers[0];
    const incoming = (tree.edges || []).some(([, to]) => to === triggerId);
    if (incoming) {
      issues.push({ severity: 'error', message: 'Trigger cannot have incoming edges — it must be the entry point.' });
    }
  }
  // Every non-trigger node should be reachable from the trigger.
  if (triggers.length === 1) {
    const triggerId = triggers[0];
    for (const id of nodeIds) {
      if (id === triggerId) continue;
      if (!workflowCanReach(tree, triggerId, id)) {
        const label = WORKFLOW_NODE_TYPES[tree.nodes[id].type]?.label || id;
        issues.push({
          severity: 'warning',
          message: `${label} (${id}) isn't reachable from the trigger — orphan node.`,
        });
      }
    }
  }
  // Per-node config validation.
  for (const id of nodeIds) {
    const node = tree.nodes[id];
    const r = validateWorkflowNodeConfig(node.type, node.config);
    if (!r.ok) {
      const label = WORKFLOW_NODE_TYPES[node.type]?.label || node.type;
      issues.push({
        severity: 'error',
        message: `${label} (${id}) missing required field${r.missing.length === 1 ? '' : 's'}: ${r.missing.join(', ')}`,
      });
    }
  }
  // Integration agent-access validation — nodes that depend on integrations
  // can't run if the integration isn't connected or agent access is disabled.
  for (const id of nodeIds) {
    const node = tree.nodes[id];
    const integrationId = integrationForWorkflowNode(node);
    if (!integrationId || integrationId === 'hg_native') continue;
    const integration = findIntegrationStatus(integrationId);
    const label = WORKFLOW_NODE_TYPES[node.type]?.label || node.type;
    if (!integration) {
      issues.push({
        severity: 'warning',
        message: `${label} (${id}) depends on integration "${integrationId}" which isn't registered in /admin/apps.`,
      });
      continue;
    }
    if (integration.status === 'not_connected') {
      issues.push({
        severity: 'error',
        message: `${label} (${id}) requires ${integration.name} integration to be connected.`,
      });
    } else if (integration.status === 'action_required') {
      issues.push({
        severity: 'error',
        message: `${label} (${id}) — ${integration.name} needs re-auth before agents can use it.`,
      });
    } else if (!isAgentAccessEnabled(integrationId)) {
      issues.push({
        severity: 'error',
        message: `${label} (${id}) — agent access for ${integration.name} is disabled. Enable in /admin/apps.`,
      });
    }
  }
  const errors = issues.filter((i) => i.severity === 'error');
  return { ok: errors.length === 0, issues };
}
