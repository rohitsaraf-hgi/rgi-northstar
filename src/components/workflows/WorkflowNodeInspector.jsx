import { Trash2, CornerDownRight, CircleDot, Info, AlertCircle, Bot, Lock, Unlock, ExternalLink } from 'lucide-react';
import { WORKFLOW_NODE_TYPES, NODE_FAMILIES, MODE_BADGES } from '../../data/workflowNodes.js';
import { WORKFLOW_NODE_SCHEMAS, validateWorkflowNodeConfig } from '../../data/workflowSchemas.js';
import { listActiveSignals } from '../../data/signals.js';
import {
  integrationForWorkflowNode,
  getIntegrationGovernance,
  setIntegrationGovernance,
  listIntegrationTools,
} from '../../data/integrationGovernance.js';
import { CONNECTED_APPS } from '../../data/surfaces.js';
import { useNavigate } from 'react-router-dom';

function findIntegration(id) {
  for (const cat of CONNECTED_APPS) {
    const found = cat.apps.find((a) => a.id === id);
    if (found) return found;
  }
  return null;
}

function IntegrationDependencyBlock({ node }) {
  const navigate = useNavigate();
  const integrationId = integrationForWorkflowNode(node);
  if (!integrationId) return null;
  if (integrationId === 'hg_native') {
    return (
      <div className="px-2 py-1.5 rounded border bg-emerald-500/5 border-emerald-500/30 text-[10px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 mb-3">
        <Bot size={10} />
        <span className="font-semibold">HG-native</span>
        <span className="text-text-muted">— always available, no integration grant needed</span>
      </div>
    );
  }
  const gov = getIntegrationGovernance(integrationId);
  const integration = findIntegration(integrationId);
  if (!integration) {
    return (
      <div className="px-2 py-1.5 rounded border bg-amber-500/10 border-amber-500/30 text-[10px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5 mb-3">
        <AlertCircle size={10} />
        Integration <code className="font-mono">{integrationId}</code> not registered. Add it in /admin/apps before running this workflow.
      </div>
    );
  }
  const isConnected = integration.status === 'connected';
  const actionRequired = integration.status === 'action_required';
  const enabled = isConnected && gov?.agentAccess;

  const tone = enabled
    ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
    : actionRequired
    ? 'bg-warning/5 border-warning/30 text-warning'
    : 'bg-rose-500/5 border-rose-500/30 text-rose-700 dark:text-rose-300';

  return (
    <div className={`px-2 py-2 rounded border mb-3 ${tone}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {enabled ? <Unlock size={11} /> : <Lock size={11} />}
        <span className="text-[10px] uppercase tracking-wider font-bold">Integration · {integration.name}</span>
        <button
          onClick={() => navigate('/admin/apps')}
          className="ml-auto text-[10px] hover:underline flex items-center gap-0.5"
          title="Manage in /admin/apps"
        >
          Manage <ExternalLink size={8} />
        </button>
      </div>
      <div className="text-[11px] leading-snug">
        {!isConnected && !actionRequired && (
          <>Not connected. This step will fail at runtime. Connect <strong>{integration.name}</strong> in /admin/apps first.</>
        )}
        {actionRequired && <>OAuth expired. Re-auth before this workflow can run.</>}
        {isConnected && !gov?.agentAccess && (
          <>Connected, but agent access is disabled. Enable in /admin/apps to allow this step to run.</>
        )}
        {enabled && (
          <>Agent access enabled — this step can execute. {listIntegrationTools(integrationId).length} tools available.</>
        )}
      </div>
      {isConnected && !gov?.agentAccess && (
        <button
          onClick={() => {
            setIntegrationGovernance(integrationId, { agentAccess: true });
          }}
          className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-surface border border-border text-text-primary hover:bg-surface-2 transition-colors"
        >
          <Unlock size={9} />
          Enable agent access
        </button>
      )}
    </div>
  );
}

function FieldControl({ field, value, onChange, isMissing }) {
  const cls = `w-full px-2 py-1.5 text-xs bg-bg border rounded text-text-primary font-mono focus:outline-none transition-colors ${
    isMissing ? 'border-rose-500/40 focus:border-rose-500/60' : 'border-border focus:border-primary/40'
  }`;
  if (field.type === 'select') {
    return (
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={cls}>
        {!value && <option value="">Select...</option>}
        {field.options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }
  if (field.type === 'select-signal') {
    const signals = listActiveSignals();
    return (
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={cls}>
        {!value && <option value="">Select signal...</option>}
        {signals.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
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
  const schema = WORKFLOW_NODE_SCHEMAS[node.type];
  const validation = validateWorkflowNodeConfig(node.type, node.config);
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

export default function WorkflowNodeInspector({
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
              Workflow validation
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
  const meta = WORKFLOW_NODE_TYPES[node.type];
  const family = NODE_FAMILIES[meta?.family];
  const modeBadge = MODE_BADGES[meta?.mode];
  const isOutput = tree.output_node === selectedNodeId;

  return (
    <div className="px-3 py-3">
      <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
        Inspector
      </div>

      <div className={`px-2 py-2 rounded border ${family?.bg} ${family?.border} mb-3`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] uppercase tracking-wider font-bold ${family?.color}`}>{meta?.family}</span>
          <span className="text-xs font-semibold text-text-primary">{meta?.label}</span>
          {modeBadge && (
            <span className={`text-[9px] uppercase tracking-wider font-bold px-1 rounded ${modeBadge.bg} ${modeBadge.color}`}>
              {modeBadge.label}
            </span>
          )}
        </div>
        <div className="text-[10px] text-text-muted font-mono mt-0.5">{selectedNodeId}</div>
        {meta?.desc && (
          <div className="text-[10px] text-text-secondary mt-1 leading-snug">{meta.desc}</div>
        )}
        {meta?.estCostTokens != null && (
          <div className="text-[10px] text-text-muted mt-1">
            Est. cost: ~{meta.estCostTokens.toLocaleString()} tokens/run
          </div>
        )}
        {meta?.estCostMs != null && (
          <div className="text-[10px] text-text-muted mt-1">
            Est. latency: ~{meta.estCostMs}ms
          </div>
        )}
        {meta?.writeScope && (
          <div className="mt-1 flex flex-wrap gap-1">
            {meta.writeScope.map((s) => (
              <span key={s} className="text-[9px] font-mono text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Integration dependency / agent-access state */}
      <IntegrationDependencyBlock node={node} />

      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1.5">
          Configuration
        </div>
        <TypedConfig node={node} onChange={(patch) => onUpdateConfig(selectedNodeId, patch)} />
      </div>

      <div className="space-y-1.5 border-t border-border pt-3">
        {!meta?.isTerminal && (
          <button
            onClick={() => onStartConnect(selectedNodeId)}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs rounded transition-colors"
          >
            <CornerDownRight size={11} />
            Connect output to...
          </button>
        )}
        {meta?.isTerminal && !isOutput && (
          <button
            onClick={() => onSetOutput(selectedNodeId)}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs rounded transition-colors"
          >
            <CircleDot size={11} />
            Set as workflow output
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
