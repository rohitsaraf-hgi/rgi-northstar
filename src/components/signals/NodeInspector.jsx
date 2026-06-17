import { Trash2, CornerDownRight, CircleDot, Info, AlertCircle } from 'lucide-react';
import { NODE_TYPES } from '../../data/signals.js';
import { NODE_CONFIG_SCHEMAS, validateNodeConfig } from '../../data/nodeSchemas.js';
import { FAMILY_ACCENTS } from './SignalCanvas.jsx';

// Render a single field control based on its schema.
function FieldControl({ field, value, onChange, isMissing }) {
  const cls = `w-full px-2 py-1.5 text-xs bg-bg border rounded text-text-primary font-mono focus:outline-none transition-colors ${
    isMissing ? 'border-rose-500/40 focus:border-rose-500/60' : 'border-border focus:border-primary/40'
  }`;
  if (field.type === 'select') {
    return (
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={cls}>
        {!value && <option value="">Select...</option>}
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={value ?? ''}
        placeholder={field.placeholder || ''}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
      />
    );
  }
  return (
    <input
      type="text"
      value={value ?? ''}
      placeholder={field.placeholder || ''}
      onChange={(e) => onChange(e.target.value)}
      className={cls}
    />
  );
}

function TypedConfig({ node, onChange }) {
  const schema = NODE_CONFIG_SCHEMAS[node.type];
  const validation = validateNodeConfig(node.type, node.config);
  if (!schema) {
    return (
      <div className="text-[11px] text-text-muted italic px-1">
        No schema defined for this node type.
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {schema.fields.map((field) => {
        const isMissing = validation.missing.includes(field.key);
        return (
          <div key={field.key}>
            <div className="flex items-center gap-1 mb-0.5">
              <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                {field.label}
                {field.required && <span className="text-rose-500 ml-0.5">*</span>}
              </label>
              {isMissing && <AlertCircle size={9} className="text-rose-500" />}
            </div>
            <FieldControl
              field={field}
              value={node.config?.[field.key]}
              onChange={(v) => onChange({ [field.key]: v })}
              isMissing={isMissing}
            />
            {field.hint && (
              <div className="text-[9px] text-text-muted mt-0.5 leading-snug">{field.hint}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function NodeInspector({
  selectedNodeId,
  tree,
  onUpdateConfig,
  onDeleteNode,
  onStartConnect,
  onSetOutput,
  validationIssues,
}) {
  if (!selectedNodeId || !tree.nodes[selectedNodeId]) {
    return (
      <div className="px-3 py-4">
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
          Inspector
        </div>
        <div className="text-[11px] text-text-secondary leading-relaxed">
          Select a node on the canvas to edit its config, or add a node from the palette below.
        </div>
        {validationIssues && validationIssues.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
              Tree validation
            </div>
            {validationIssues.map((iss, i) => (
              <div
                key={i}
                className={`flex items-start gap-1.5 text-[11px] px-2 py-1.5 rounded ${
                  iss.severity === 'error'
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                }`}
              >
                <Info size={10} className="flex-shrink-0 mt-0.5" />
                <span>{iss.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const node = tree.nodes[selectedNodeId];
  const meta = NODE_TYPES[node.type];
  const accent = FAMILY_ACCENTS[meta?.family] || FAMILY_ACCENTS.source;
  const isTerminal = meta?.isTerminal;
  const isOutput = tree.output_node === selectedNodeId;

  return (
    <div className="px-3 py-3">
      <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
        Inspector
      </div>

      {/* Header */}
      <div className={`px-2 py-2 rounded border ${accent.bg} ${accent.border} mb-3`}>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase tracking-wider font-bold ${accent.text}`}>
            {meta?.family}
          </span>
          <span className="text-xs font-semibold text-text-primary">{meta?.label}</span>
        </div>
        <div className="text-[10px] text-text-muted font-mono mt-0.5">{selectedNodeId}</div>
        {meta?.output && (
          <div className="text-[10px] text-text-secondary mt-1">
            Output: <span className="font-mono text-text-primary">{meta.output}</span>
          </div>
        )}
      </div>

      {/* Config */}
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
          Configuration
        </div>
        <TypedConfig node={node} onChange={(patch) => onUpdateConfig(selectedNodeId, patch)} />
      </div>

      {/* Actions */}
      <div className="space-y-1.5 border-t border-border pt-3">
        {!isTerminal && (
          <button
            onClick={() => onStartConnect(selectedNodeId)}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs rounded transition-colors"
          >
            <CornerDownRight size={11} />
            Connect output to...
          </button>
        )}
        {isTerminal && !isOutput && (
          <button
            onClick={() => onSetOutput(selectedNodeId)}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs rounded transition-colors"
          >
            <CircleDot size={11} />
            Set as signal output
          </button>
        )}
        <button
          onClick={() => onDeleteNode(selectedNodeId)}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 border border-border hover:border-rose-500/40 hover:bg-rose-500/5 text-text-secondary hover:text-rose-600 dark:hover:text-rose-400 text-xs rounded transition-colors"
        >
          <Trash2 size={11} />
          Delete node
        </button>
      </div>
    </div>
  );
}
