import { useMemo } from 'react';
import {
  Database, Edit, ListTodo, Send, Bell, Webhook,
  GitBranch, GitMerge, Repeat,
  CheckSquare, Eye,
  Clock, Hourglass,
  CircleCheck,
  Zap, Hand,
  Mail, Sword, Users, Calendar, Sparkles, Handshake, FileSearch, Bot,
  Trash2, CornerDownRight,
} from 'lucide-react';
import { WORKFLOW_NODE_TYPES, NODE_FAMILIES, MODE_BADGES } from '../../data/workflowNodes.js';
import { computeWorkflowLayout } from '../../data/workflowGraph.js';

const NODE_ICONS = {
  Database, Edit, ListTodo, Send, Bell, Webhook,
  GitBranch, GitMerge, Repeat,
  CheckSquare, Eye,
  Clock, Hourglass,
  CircleCheck,
  Zap, Hand,
  Mail, Sword, Users, Calendar, Sparkles, Handshake, FileSearch, Bot,
};

const NODE_WIDTH = 210;
const NODE_HEIGHT = 70;
const COL_GAP = 36;
const ROW_GAP = 52;
const CANVAS_PADDING_X = 32;
const CANVAS_PADDING_Y = 24;

function summarizeConfig(node) {
  const cfg = node.config || {};
  const order = ['signal_id', 'invocation', 'interval', 'sequence', 'channel', 'event', 'value', 'op', 'on', 'over', 'entity', 'category', 'object', 'fields', 'field', 'tone', 'cadence', 'competitor', 'titles', 'meeting_type', 'focus', 'include', 'scope', 'sla_hours', 'days', 'hours', 'until', 'capture', 'format', 'endpoint', 'returns', 'type', 'due_in_hours', 'message', 'program', 'cases', 'audience', 'assignee_role', 'timeout_hours'];
  const parts = [];
  for (const key of order) {
    if (cfg[key] != null && cfg[key] !== '') {
      parts.push(`${cfg[key]}`);
      if (parts.length >= 2) break;
    }
  }
  return parts.join(' · ').slice(0, 64);
}

function NodeCard({ id, node, x, y, isSelected, isOutput, isConnectSource, connectingFromId, onSelect, onDelete, onStartConnect, onCompleteConnect }) {
  const meta = WORKFLOW_NODE_TYPES[node.type];
  const family = meta?.family || 'agent';
  const familyCfg = NODE_FAMILIES[family];
  const Icon = NODE_ICONS[meta?.icon] || Bot;
  const modeBadge = MODE_BADGES[meta?.mode];
  const summary = summarizeConfig(node);
  const isConnectTarget = connectingFromId && connectingFromId !== id;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isConnectTarget) onCompleteConnect(id);
    else onSelect(id);
  };

  return (
    <div
      onClick={handleClick}
      style={{ left: x, top: y, width: NODE_WIDTH, height: NODE_HEIGHT }}
      className={`absolute select-none cursor-pointer rounded-md border transition-all ${
        isSelected
          ? 'border-primary shadow-card ring-2 ring-primary/20'
          : isConnectTarget
          ? 'border-primary/60 ring-1 ring-primary/30 bg-primary/5'
          : isConnectSource
          ? 'border-primary/80 ring-2 ring-primary/30'
          : 'border-border hover:border-border-2'
      } bg-surface`}
    >
      <div className="flex items-start gap-2 p-2 h-full">
        <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 border ${familyCfg?.bg} ${familyCfg?.color} ${familyCfg?.border}`}>
          <Icon size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-text-primary truncate">{meta?.label || node.type}</span>
            <span className={`text-[9px] uppercase tracking-wider font-bold px-1 rounded ${modeBadge?.bg} ${modeBadge?.color}`}>
              {modeBadge?.label}
            </span>
            {isOutput && (
              <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                output
              </span>
            )}
          </div>
          <div className="text-[10px] text-text-secondary font-mono truncate mt-0.5">
            {summary || <span className="italic text-text-muted">no config</span>}
          </div>
        </div>
      </div>
      {isSelected && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-surface border border-border rounded-md px-1.5 py-0.5 shadow-card z-10">
          {!meta?.isTerminal && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartConnect(id); }}
              className="p-1 hover:bg-surface-2 rounded transition-colors text-text-secondary hover:text-primary"
              title="Connect output to another node"
            >
              <CornerDownRight size={11} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(id); }}
            className="p-1 hover:bg-rose-500/10 rounded transition-colors text-text-muted hover:text-rose-600 dark:hover:text-rose-400"
            title="Delete node"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function WorkflowCanvas({
  tree,
  selectedNodeId,
  onSelectNode,
  onDeleteNode,
  connectingFromId,
  onStartConnect,
  onCompleteConnect,
  onCancelConnect,
}) {
  const { positions, maxRow } = useMemo(() => computeWorkflowLayout(tree), [tree]);

  const rowSizes = useMemo(() => {
    const sizes = {};
    for (const pos of Object.values(positions)) {
      sizes[pos.row] = Math.max(sizes[pos.row] || 0, pos.rowSize);
    }
    return sizes;
  }, [positions]);
  const widestRow = Math.max(0, ...Object.values(rowSizes));
  const canvasWidth = Math.max(720, widestRow * (NODE_WIDTH + COL_GAP) + CANVAS_PADDING_X * 2);
  const canvasHeight = (maxRow + 1) * (NODE_HEIGHT + ROW_GAP) + CANVAS_PADDING_Y * 2;

  const nodePositions = useMemo(() => {
    const out = {};
    for (const [id, pos] of Object.entries(positions)) {
      const rowWidth = rowSizes[pos.row] * NODE_WIDTH + (rowSizes[pos.row] - 1) * COL_GAP;
      const rowStartX = (canvasWidth - rowWidth) / 2;
      out[id] = {
        x: rowStartX + pos.col * (NODE_WIDTH + COL_GAP),
        y: CANVAS_PADDING_Y + pos.row * (NODE_HEIGHT + ROW_GAP),
      };
    }
    return out;
  }, [positions, rowSizes, canvasWidth]);

  const edgePaths = useMemo(() => {
    return (tree.edges || []).map(([from, to]) => {
      const fp = nodePositions[from];
      const tp = nodePositions[to];
      if (!fp || !tp) return null;
      const x1 = fp.x + NODE_WIDTH / 2;
      const y1 = fp.y + NODE_HEIGHT;
      const x2 = tp.x + NODE_WIDTH / 2;
      const y2 = tp.y;
      const midY = (y1 + y2) / 2;
      const d = `M ${x1} ${y1} C ${x1} ${midY} ${x2} ${midY} ${x2} ${y2}`;
      const fam = WORKFLOW_NODE_TYPES[tree.nodes[from]?.type]?.family || 'agent';
      return { key: `${from}|${to}`, d, family: fam, stroke: NODE_FAMILIES[fam]?.stroke };
    }).filter(Boolean);
  }, [tree.edges, tree.nodes, nodePositions]);

  return (
    <div
      onClick={() => {
        if (connectingFromId) onCancelConnect();
        else onSelectNode(null);
      }}
      className="relative w-full h-full overflow-auto bg-bg/30"
      style={{ minHeight: 480 }}
    >
      <div className="relative" style={{ width: canvasWidth, height: canvasHeight }}>
        <svg className="absolute inset-0 pointer-events-none" width={canvasWidth} height={canvasHeight}>
          <defs>
            {Object.entries(NODE_FAMILIES).map(([family, cfg]) => (
              <marker
                key={family}
                id={`wf-arrow-${family}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={cfg.stroke} opacity="0.7" />
              </marker>
            ))}
          </defs>
          {edgePaths.map((edge) => (
            <path
              key={edge.key}
              d={edge.d}
              stroke={edge.stroke}
              strokeWidth="2"
              strokeOpacity="0.6"
              fill="none"
              markerEnd={`url(#wf-arrow-${edge.family})`}
            />
          ))}
        </svg>

        {Object.entries(tree.nodes || {}).map(([id, node]) => {
          const pos = nodePositions[id];
          if (!pos) return null;
          return (
            <NodeCard
              key={id}
              id={id}
              node={node}
              x={pos.x}
              y={pos.y}
              isSelected={selectedNodeId === id}
              isOutput={tree.output_node === id}
              isConnectSource={connectingFromId === id}
              connectingFromId={connectingFromId}
              onSelect={onSelectNode}
              onDelete={onDeleteNode}
              onStartConnect={onStartConnect}
              onCompleteConnect={onCompleteConnect}
            />
          );
        })}

        {connectingFromId && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[11px] px-3 py-1.5 rounded-md shadow-card flex items-center gap-2 z-20 pointer-events-none">
            <CornerDownRight size={11} />
            Click a target node to connect — Esc or click empty space to cancel
          </div>
        )}

        {Object.keys(tree.nodes || {}).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-text-muted">
              <CircleCheck size={18} className="mx-auto mb-2" />
              <div className="text-xs">
                Empty canvas — describe the workflow in the left pane, or add nodes from the palette.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { NODE_ICONS };
