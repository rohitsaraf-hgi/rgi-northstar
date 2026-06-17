// Pure helpers for working with signal trees (DAGs).
//
// Tree shape: { nodes: { [id]: { type, config } }, edges: [[from, to]], output_node: id }
//
// All mutations return NEW objects — we never mutate in place.

import { NODE_TYPES } from './signals.js';
import { defaultConfigForType, validateNodeConfig } from './nodeSchemas.js';

// Generate a stable readable node id.
let nodeCounter = 0;
export function nextNodeId(prefix = 'n') {
  nodeCounter += 1;
  return `${prefix}_${nodeCounter}_${Math.random().toString(36).slice(2, 6)}`;
}

// Longest path from any source root to each node. Sources get depth 0; the
// terminal sits at max depth.
export function computeDepth(tree) {
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
    if (seen.has(id)) return; // cycle guard
    if (depth[id] != null && depth[id] >= d) return;
    depth[id] = d;
    const outs = outgoing[id] || [];
    const nextSeen = new Set(seen);
    nextSeen.add(id);
    for (const to of outs) visit(to, d + 1, nextSeen);
  }
  for (const root of roots) visit(root, 0, new Set());
  // Any orphans that weren't reached (no edges at all) — assign depth 0.
  for (const id of Object.keys(tree.nodes)) {
    if (depth[id] == null) depth[id] = 0;
  }
  return depth;
}

// Auto-layout: assign (col, row) to each node based on topological depth.
// `row` = depth, `col` = index within that row (stable order).
export function computeLayout(tree) {
  const depth = computeDepth(tree);
  const rows = {};
  for (const id of Object.keys(tree.nodes || {})) {
    const r = depth[id] ?? 0;
    if (!rows[r]) rows[r] = [];
    rows[r].push(id);
  }
  // Stable within-row order: terminal sits centered last; otherwise stable by id
  for (const r of Object.keys(rows)) {
    rows[r].sort();
  }
  const positions = {};
  for (const r of Object.keys(rows)) {
    const ids = rows[r];
    ids.forEach((id, col) => {
      positions[id] = { row: Number(r), col, rowSize: ids.length };
    });
  }
  return { positions, maxRow: Math.max(0, ...Object.keys(rows).map(Number)) };
}

// Add a node to the tree (returns new tree).
export function addNode(tree, type, config) {
  const id = nextNodeId();
  const finalConfig = { ...defaultConfigForType(type), ...(config || {}) };
  const next = {
    ...tree,
    nodes: { ...tree.nodes, [id]: { type, config: finalConfig } },
  };
  // If adding a threshold and there's no terminal yet, set it.
  if (NODE_TYPES[type]?.isTerminal && !tree.output_node) {
    next.output_node = id;
  }
  return { tree: next, id };
}

// Remove a node and any incident edges. Returns new tree.
export function removeNode(tree, id) {
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

// Add an edge if compatible. Returns { tree, error? }.
export function addEdge(tree, from, to) {
  if (from === to) return { tree, error: 'Cannot connect a node to itself.' };
  if (!tree.nodes[from] || !tree.nodes[to]) {
    return { tree, error: 'Node not found.' };
  }
  // Already connected?
  if (tree.edges.some(([f, t]) => f === from && t === to)) {
    return { tree, error: 'Edge already exists.' };
  }
  // Terminal nodes cannot be source of an edge.
  const fromType = NODE_TYPES[tree.nodes[from].type];
  if (fromType?.isTerminal) {
    return { tree, error: 'Terminal output cannot feed another node.' };
  }
  // Cycle check via DFS from `to` — if we can reach `from`, cycle.
  if (canReach(tree, to, from)) {
    return { tree, error: 'Cannot create a cycle.' };
  }
  return {
    tree: { ...tree, edges: [...tree.edges, [from, to]] },
  };
}

// Remove an edge.
export function removeEdge(tree, from, to) {
  return {
    ...tree,
    edges: tree.edges.filter(([f, t]) => !(f === from && t === to)),
  };
}

// Update a node's config (immutable).
export function updateNodeConfig(tree, id, patch) {
  if (!tree.nodes[id]) return tree;
  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [id]: { ...tree.nodes[id], config: { ...tree.nodes[id].config, ...patch } },
    },
  };
}

// Set the terminal output node (must be a threshold node).
export function setOutputNode(tree, id) {
  if (!tree.nodes[id]) return tree;
  if (!NODE_TYPES[tree.nodes[id].type]?.isTerminal) return tree;
  return { ...tree, output_node: id };
}

// DFS reachability used for cycle detection.
function canReach(tree, from, target) {
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

// Validate the tree for publish.
export function validateTree(tree) {
  const issues = [];
  const nodeIds = Object.keys(tree.nodes || {});
  if (nodeIds.length === 0) {
    return { ok: false, issues: [{ severity: 'error', message: 'Empty tree — add at least one source and a terminal.' }] };
  }
  // Must have exactly one terminal.
  const terminals = nodeIds.filter((id) => NODE_TYPES[tree.nodes[id].type]?.isTerminal);
  if (terminals.length === 0) {
    issues.push({ severity: 'error', message: 'Add a terminal output node (Boolean / Tier / Score).' });
  } else if (terminals.length > 1) {
    issues.push({ severity: 'error', message: 'Only one terminal output is allowed.' });
  } else if (!tree.output_node || tree.output_node !== terminals[0]) {
    issues.push({ severity: 'warning', message: 'Terminal output node not set as the signal output.' });
  }
  // Must have at least one source.
  const sources = nodeIds.filter((id) => NODE_TYPES[tree.nodes[id].type]?.family === 'source');
  if (sources.length === 0) {
    issues.push({ severity: 'error', message: 'Add at least one source (HG / CRM / Event).' });
  }
  // Every node should reach the terminal.
  if (terminals.length === 1) {
    const term = terminals[0];
    for (const id of nodeIds) {
      if (id === term) continue;
      if (!canReach(tree, id, term)) {
        const label = NODE_TYPES[tree.nodes[id].type]?.label || id;
        issues.push({
          severity: 'warning',
          message: `${label} (${id}) doesn't connect to the terminal — orphan node.`,
        });
      }
    }
  }
  // Per-node config validation: required fields populated.
  for (const id of nodeIds) {
    const node = tree.nodes[id];
    const result = validateNodeConfig(node.type, node.config);
    if (!result.ok) {
      const label = NODE_TYPES[node.type]?.label || node.type;
      issues.push({
        severity: 'error',
        message: `${label} (${id}) missing required field${result.missing.length === 1 ? '' : 's'}: ${result.missing.join(', ')}`,
      });
    }
  }
  const errors = issues.filter((i) => i.severity === 'error');
  return { ok: errors.length === 0, issues };
}

// Convenience: build an empty tree shape.
export function emptyTree() {
  return { nodes: {}, edges: [], output_node: null };
}

// Clone a tree (used when entering edit mode on a published signal).
export function cloneTree(tree) {
  return {
    output_node: tree.output_node || null,
    nodes: Object.fromEntries(
      Object.entries(tree.nodes || {}).map(([id, n]) => [id, { type: n.type, config: { ...n.config } }]),
    ),
    edges: (tree.edges || []).map(([f, t]) => [f, t]),
  };
}
