import { useMemo } from 'react';
import {
  Database,
  Clock,
  Sigma,
  TrendingUp,
  Divide,
  GitCompare,
  Filter,
  CircleDot,
  BarChart3,
  Gauge,
  Trash2,
  CornerDownRight,
  X,
} from 'lucide-react';
import { NODE_TYPES, SOURCE_FAMILIES } from '../../data/signals.js';
import { computeLayout } from '../../data/signalGraph.js';

const NODE_ICONS = {
  Database, Clock, Sigma, TrendingUp, Divide, GitCompare, Filter, CircleDot, BarChart3, Gauge,
};

const FAMILY_ACCENTS = {
  source: { bg: 'bg-sky-500/10', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-500/30', stroke: '#0ea5e9' },
  window: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-500/30', stroke: '#f59e0b' },
  compute: { bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-500/30', stroke: '#8b5cf6' },
  rule: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-500/30', stroke: '#f43f5e' },
  threshold: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/30', stroke: '#10b981' },
};

const NODE_WIDTH = 200;
const NODE_HEIGHT = 64;
const COL_GAP = 36;
const ROW_GAP = 56;
const CANVAS_PADDING_X = 32;
const CANVAS_PADDING_Y = 24;

// Summarize node config into a short single-line string for the card.
function summarizeConfig(node) {
  const cfg = node.config || {};
  const parts = [];
  if (cfg.value) parts.push(String(cfg.value));
  if (cfg.field) parts.push(String(cfg.field));
  if (cfg.event) parts.push(String(cfg.event));
  if (cfg.op) parts.push(String(cfg.op));
  if (cfg.window) parts.push(String(cfg.window));
  if (cfg.source && !parts.length) parts.push(String(cfg.source));
  if (cfg.entity && cfg.value && !parts.length) parts.push(`${cfg.entity}:${cfg.value}`);
  if (cfg.name) parts.push(String(cfg.name));
  if (cfg.bands) parts.push(String(cfg.bands));
  if (cfg.scale) parts.push(String(cfg.scale));
  return parts.join(' · ').slice(0, 60);
}

function NodeCard({ id, node, x, y, isSelected, isTerminal, isConnectSource, onSelect, onDelete, onStartConnect, onCompleteConnect, connectingFromId }) {
  const meta = NODE_TYPES[node.type];
  const family = meta?.family || 'source';
  const accent = FAMILY_ACCENTS[family];
  const Icon = NODE_ICONS[meta?.icon] || CircleDot;
  const sourceFam = meta?.sourceFamily ? SOURCE_FAMILIES[meta.sourceFamily] : null;
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
        <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 border ${accent.bg} ${accent.text} ${accent.border}`}>
          <Icon size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-text-primary truncate">{meta?.label || node.type}</span>
            {sourceFam && (
              <span className={`text-[9px] uppercase tracking-wider font-bold px-1 rounded ${sourceFam.bg} ${sourceFam.color}`}>
                {sourceFam.label}
              </span>
            )}
            {isTerminal && (
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
          {!isTerminal && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartConnect(id);
              }}
              className="p-1 hover:bg-surface-2 rounded transition-colors text-text-secondary hover:text-primary"
              title="Connect output to another node"
            >
              <CornerDownRight size={11} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
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

export default function SignalCanvas({
  tree,
  selectedNodeId,
  onSelectNode,
  onDeleteNode,
  connectingFromId,
  onStartConnect,
  onCompleteConnect,
  onCancelConnect,
}) {
  const { positions, maxRow } = useMemo(() => computeLayout(tree), [tree]);

  // Compute canvas size based on widest row.
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

  // Per-node absolute pixel positions.
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

  // Pre-compute edge SVG paths.
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
      const fam = NODE_TYPES[tree.nodes[from]?.type]?.family || 'source';
      return { key: `${from}|${to}`, d, family: fam, stroke: FAMILY_ACCENTS[fam].stroke };
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
        {/* Edges layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={canvasWidth}
          height={canvasHeight}
        >
          <defs>
            {Object.entries(FAMILY_ACCENTS).map(([family, accent]) => (
              <marker
                key={family}
                id={`arrow-${family}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={accent.stroke} opacity="0.7" />
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
              markerEnd={`url(#arrow-${edge.family})`}
            />
          ))}
        </svg>

        {/* Nodes layer */}
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
              isTerminal={tree.output_node === id}
              isConnectSource={connectingFromId === id}
              onSelect={onSelectNode}
              onDelete={onDeleteNode}
              onStartConnect={onStartConnect}
              onCompleteConnect={onCompleteConnect}
              connectingFromId={connectingFromId}
            />
          );
        })}

        {/* Connect hint overlay */}
        {connectingFromId && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[11px] px-3 py-1.5 rounded-md shadow-card flex items-center gap-2 z-20 pointer-events-none">
            <CornerDownRight size={11} />
            Click a target node to connect — Esc or click empty space to cancel
          </div>
        )}

        {/* Empty state */}
        {Object.keys(tree.nodes || {}).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-text-muted">
              <CircleDot size={18} className="mx-auto mb-2" />
              <div className="text-xs">
                Empty canvas — describe a signal in the left pane, or add a node from the palette.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { FAMILY_ACCENTS, NODE_ICONS };
