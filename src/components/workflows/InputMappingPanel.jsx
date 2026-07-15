import { useMemo } from 'react';
import { ArrowRight, CircleAlert, CircleCheck, Wand2 } from 'lucide-react';
import { WORKFLOW_NODE_TYPES, triggerDataFields, contractForNodeType } from '../../data/workflowNodes.js';
import { upstreamNodeIds } from '../../data/workflowGraph.js';
import { AGENTS, OUTPUT_TYPES } from '../../data/agents.js';

// Best-effort auto-mapping: if a binding is missing and there's an unambiguous
// upstream field with the same key, suggest it. Never silent — spec §1.3
// requires admin confirmation.
function suggestBinding(inputKey, upstreamOptions) {
  const matches = upstreamOptions.filter((opt) => opt.field === inputKey);
  if (matches.length === 1) return matches[0].path;
  // Fall back to substring match (e.g. `contact_id` matches `inferred_account_id`
  // ONLY if there's no exact-name match).
  const substr = upstreamOptions.filter((opt) => opt.field.includes(inputKey) || inputKey.includes(opt.field));
  if (substr.length === 1) return substr[0].path;
  return null;
}

function collectBindingOptions(tree, selectedNodeId) {
  const options = [];
  // 1. Trigger data
  const nodes = tree?.nodes || {};
  const triggerId = Object.keys(nodes).find((id) => WORKFLOW_NODE_TYPES[nodes[id].type]?.isTrigger);
  if (triggerId) {
    const triggerFields = triggerDataFields(nodes[triggerId].type);
    for (const field of triggerFields) {
      options.push({
        group: 'trigger.data',
        source: 'trigger',
        sourceLabel: WORKFLOW_NODE_TYPES[nodes[triggerId].type]?.label || 'Trigger',
        field,
        path: `trigger.data.${field}`,
      });
    }
  }
  // 2. Upstream node outputs
  if (selectedNodeId && tree.nodes[selectedNodeId]) {
    const upstream = upstreamNodeIds(tree, selectedNodeId).filter((id) => id !== triggerId);
    for (const stepId of upstream) {
      const stepNode = nodes[stepId];
      const contract = contractForNodeType(stepNode.type, AGENTS);
      const outputs = contract?.outputs || [];
      const label = WORKFLOW_NODE_TYPES[stepNode.type]?.label || stepId;
      for (const out of outputs) {
        options.push({
          group: stepId,
          source: stepId,
          sourceLabel: label,
          field: out.name || out.key,
          path: `${stepId}.output.${out.name || out.key}`,
          outputType: contract?.output_type,
        });
      }
    }
  }
  return options;
}

function BindingRow({ input, binding, options, autoSuggestion, onChange }) {
  const isAutoSuggested = !binding && autoSuggestion;
  const effectiveBinding = binding || autoSuggestion || '';
  const isResolved = Boolean(effectiveBinding);
  const isRequired = input.required !== false;
  const missing = isRequired && !effectiveBinding;

  return (
    <div className={`px-2 py-2 rounded border ${missing ? 'border-rose-500/40 bg-rose-500/5' : isAutoSuggested ? 'border-amber-500/30 bg-amber-500/5' : isResolved ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-surface-2'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <ArrowRight size={9} className="text-text-muted" />
        <span className="text-[11px] font-semibold text-text-primary font-mono">{input.name || input.key}</span>
        {isRequired && <span className="text-rose-500 text-[10px]">*</span>}
        {input.type && (
          <span className="text-[9px] uppercase tracking-wider font-mono text-text-muted">{input.type}</span>
        )}
        {isAutoSuggested && (
          <span className="ml-auto text-[9px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300 inline-flex items-center gap-0.5">
            <Wand2 size={8} />
            Auto — confirm
          </span>
        )}
        {isResolved && !isAutoSuggested && (
          <CircleCheck size={10} className="ml-auto text-emerald-600" />
        )}
        {missing && !isAutoSuggested && (
          <CircleAlert size={10} className="ml-auto text-rose-500" />
        )}
      </div>
      {input.label && (
        <div className="text-[10px] text-text-secondary mb-1 leading-snug">{input.label}</div>
      )}
      <select
        value={binding || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className={`w-full px-2 py-1 text-[11px] font-mono bg-bg border rounded text-text-primary focus:outline-none focus:border-primary/40 ${missing ? 'border-rose-500/40' : 'border-border'}`}
      >
        <option value="">
          {autoSuggestion ? `— suggested: ${autoSuggestion} — click to confirm` : '— select source —'}
        </option>
        <optgroup label="Trigger data">
          {options.filter((o) => o.source === 'trigger').map((o) => (
            <option key={o.path} value={o.path}>{o.path}</option>
          ))}
        </optgroup>
        {Array.from(new Set(options.filter((o) => o.source !== 'trigger').map((o) => o.source))).map((sourceId) => {
          const sourceOptions = options.filter((o) => o.source === sourceId);
          const label = sourceOptions[0]?.sourceLabel || sourceId;
          return (
            <optgroup key={sourceId} label={`${label} (${sourceId})`}>
              {sourceOptions.map((o) => (
                <option key={o.path} value={o.path}>{o.path}</option>
              ))}
            </optgroup>
          );
        })}
      </select>
      {isAutoSuggested && (
        <button
          onClick={() => onChange(autoSuggestion)}
          className="mt-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:underline"
        >
          Confirm suggestion
        </button>
      )}
    </div>
  );
}

export default function InputMappingPanel({ node, selectedNodeId, tree, onUpdateConfig }) {
  const contract = contractForNodeType(node.type, AGENTS);
  const options = useMemo(() => collectBindingOptions(tree, selectedNodeId), [tree, selectedNodeId]);
  if (!contract || !Array.isArray(contract.inputs) || contract.inputs.length === 0) return null;

  const currentBindings = node.config?.input_bindings || {};

  const handleBindingChange = (inputKey, path) => {
    const nextBindings = { ...currentBindings };
    if (path == null || path === '') {
      delete nextBindings[inputKey];
    } else {
      nextBindings[inputKey] = path;
    }
    onUpdateConfig({ input_bindings: nextBindings });
  };

  const outputType = contract.output_type;
  const outputMeta = outputType ? OUTPUT_TYPES[outputType] : null;

  // Compute suggestions per unmapped required input.
  const rows = contract.inputs.map((input) => {
    const key = input.name || input.key;
    const binding = currentBindings[key];
    const suggestion = binding ? null : suggestBinding(key, options);
    return { input, key, binding, suggestion };
  });

  const missingRequired = rows.filter((r) => (r.input.required !== false) && !r.binding && !r.suggestion).length;
  const autoPending = rows.filter((r) => !r.binding && r.suggestion).length;

  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold flex-1">
          Input mapping
        </div>
        {missingRequired > 0 && (
          <span className="text-[9px] uppercase tracking-wider font-bold text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/30 px-1 py-0.5 rounded">
            {missingRequired} missing
          </span>
        )}
        {autoPending > 0 && missingRequired === 0 && (
          <span className="text-[9px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1 py-0.5 rounded">
            {autoPending} auto · confirm
          </span>
        )}
      </div>
      <div className="text-[10px] text-text-muted mb-2 leading-snug">
        Each input reads from a field in the Run Context — either the trigger payload or a prior step&rsquo;s output.
      </div>
      <div className="space-y-1.5">
        {rows.map(({ input, key, binding, suggestion }) => (
          <BindingRow
            key={key}
            input={input}
            binding={binding}
            options={options}
            autoSuggestion={suggestion}
            onChange={(path) => handleBindingChange(key, path)}
          />
        ))}
      </div>

      {/* Outputs summary — helps admin see what this step contributes downstream */}
      {contract.outputs?.length > 0 && (
        <div className="mt-2 px-2 py-1.5 rounded bg-surface-2 border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Emits</div>
            {outputMeta && (
              <span className={`text-[9px] uppercase tracking-wider font-bold px-1 rounded ${outputMeta.bg} ${outputMeta.color}`}>
                {outputMeta.label}
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono text-text-secondary leading-snug">
            {contract.outputs.map((o) => `${selectedNodeId}.output.${o.name || o.key}`).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}
