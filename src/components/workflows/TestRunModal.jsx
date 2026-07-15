import { useMemo, useState } from 'react';
import { X, PlayCircle, ChevronDown, ChevronRight, CircleCheck, CircleAlert, Zap, Shield, Play } from 'lucide-react';
import {
  WORKFLOW_NODE_TYPES,
  contractForNodeType,
  nodeRequiresApprovalGate,
  triggerDataFields,
} from '../../data/workflowNodes.js';
import { AGENTS, OUTPUT_TYPES } from '../../data/agents.js';
import { computeWorkflowDepth } from '../../data/workflowGraph.js';

// A tiny catalog of sample accounts for the dry-run modal. Real deployments
// would surface the tenant's Salesforce accounts; the demo uses hand-picked
// examples so the walkthrough tells a coherent story.
const SAMPLE_ACCOUNTS = [
  { id: 'acct_snow', name: 'Snowflake', domain: 'snowflake.com', arr: 4200000, rep: 'Priya', contact: 'Sarah Chen · VP Engineering' },
  { id: 'acct_cf', name: 'Cloudflare', domain: 'cloudflare.com', arr: 2800000, rep: 'Marcus', contact: 'Elena Petrov · Director, Security Engineering' },
  { id: 'acct_dbx', name: 'Databricks', domain: 'databricks.com', arr: 6100000, rep: 'Priya', contact: 'James Park · Head of ML Infrastructure' },
];

// Mock output builder — the modal walks the tree and calls this to compose a
// realistic-looking output payload per step.
function mockOutputFor(node, contract, account) {
  const outputs = contract?.outputs || [];
  const payload = {};
  for (const out of outputs) {
    const key = out.name || out.key;
    // Type-based mock values, tuned per common output name.
    if (key === 'account_id') payload[key] = `${account.id}_new`;
    else if (key === 'is_new_record') payload[key] = false;
    else if (key === 'contact_ids') payload[key] = ['c_1', 'c_2', 'c_3'];
    else if (key === 'contact_list') payload[key] = [
      { name: 'Sarah Chen', title: 'VP Engineering', email: 's.chen@' + account.domain },
      { name: 'Marcus Wu', title: 'Head of Data', email: 'm.wu@' + account.domain },
    ];
    else if (key === 'account_list') payload[key] = [
      { id: 'acct_1', name: 'Peer A', score: 88 },
      { id: 'acct_2', name: 'Peer B', score: 82 },
      { id: 'acct_3', name: 'Peer C', score: 79 },
    ];
    else if (key === 'brief_list') payload[key] = ['Brief 1 (280w)', 'Brief 2 (275w)', 'Brief 3 (290w)'];
    else if (key === 'interactions') payload[key] = [
      { type: 'meeting', date: '2026-07-01', summary: 'Product roadmap discussion' },
      { type: 'email', date: '2026-06-24', summary: 'Follow-up on pricing question' },
    ];
    else if (key === 'email_subject') payload[key] = 'Congrats on the new role at ' + account.name;
    else if (key === 'email_body') payload[key] = 'Hi — congratulations on moving to ' + account.name + '. Would love to stay in touch as you get settled.';
    else if (key === 'draft_id') payload[key] = 'draft_' + Math.floor(Math.random() * 900 + 100);
    else if (key === 'fit_score') payload[key] = 84;
    else if (key === 'fit_tier') payload[key] = 'High';
    else if (key === 'notification_id') payload[key] = 'ntf_' + Math.floor(Math.random() * 9000 + 1000);
    else if (key === 'duplicates_skipped') payload[key] = 2;
    else if (key === 'enrolled_count') payload[key] = 8;
    else if (key === 'skipped_count') payload[key] = 2;
    else if (key === 'task_ids') payload[key] = ['task_1', 'task_2', 'task_3'];
    else if (key === 'firmographic') payload[key] = { industry: 'Software', employees: 6800, hq: 'San Mateo, CA' };
    else if (key === 'technographic') payload[key] = { installs: 214, notable: ['Databricks', 'Snowflake', 'AWS'] };
    else if (key === 'hg_signals') payload[key] = { surge_topics: ['CNAPP', 'Data platform consolidation'] };
    else if (key === 'inferred_account_id') payload[key] = account.id;
    else if (key === 'account_summary') payload[key] = { name: account.name, arr: account.arr, tier: 'A' };
    else if (key === 'crm_data') payload[key] = { open_opps: 2, last_activity: '2026-07-08' };
    else if (key === 'open_opportunities') payload[key] = [{ id: 'opp_1', name: 'Q3 expansion', arr: 320000 }];
    else if (key === 'icp_attributes') payload[key] = { employees_band: '1000-5000', vertical: 'SaaS' };
    else if (key === 'event_type') payload[key] = 'product_comparison';
    else if (key === 'event_source') payload[key] = 'TrustRadius';
    else if (key === 'event_data') payload[key] = { products_compared: ['Us', 'Competitor A'] };
    else payload[key] = `<mock ${out.type || 'value'}>`;
  }
  return payload;
}

function StepRow({ node, depth, contract, meta, isWrite, approvalGate, output, expanded, onToggle }) {
  const outputMeta = contract?.output_type ? OUTPUT_TYPES[contract.output_type] : null;
  const stateChip = isWrite
    ? { label: 'Would write', bg: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300' }
    : { label: 'Executed', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' };

  return (
    <div className="border border-border rounded bg-surface">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
      >
        {expanded ? <ChevronDown size={11} className="text-text-muted flex-shrink-0" /> : <ChevronRight size={11} className="text-text-muted flex-shrink-0" />}
        <span className="text-[10px] font-mono text-text-muted flex-shrink-0 w-14">step {depth + 1}</span>
        <span className="text-xs font-semibold text-text-primary truncate">{meta?.label || node.type}</span>
        <span className={`text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded border ${stateChip.bg} flex-shrink-0`}>
          {stateChip.label}
        </span>
        {approvalGate && (
          <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 inline-flex items-center gap-0.5 flex-shrink-0">
            <Shield size={8} />
            approval
          </span>
        )}
        {outputMeta && (
          <span className={`ml-auto text-[9px] uppercase tracking-wider font-bold px-1 rounded ${outputMeta.bg} ${outputMeta.color} flex-shrink-0`}>
            {outputMeta.label}
          </span>
        )}
      </button>
      {expanded && (
        <div className="px-3 py-2 border-t border-border bg-bg/40 space-y-2">
          {/* Inputs — resolved bindings */}
          {contract?.inputs?.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-0.5">Inputs</div>
              <div className="space-y-0.5">
                {contract.inputs.map((inp) => {
                  const key = inp.name || inp.key;
                  const binding = node.config?.input_bindings?.[key];
                  return (
                    <div key={key} className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-text-primary">{key}</span>
                      <span className="text-text-muted">←</span>
                      {binding ? (
                        <span className="text-emerald-700 dark:text-emerald-300">{binding}</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 italic">unmapped</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Preview — what this step produced or would produce */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-0.5">
              {isWrite ? 'Would produce (dry run — no write)' : 'Output'}
            </div>
            <pre className="text-[10px] font-mono text-text-secondary bg-bg border border-border rounded px-2 py-1.5 overflow-x-auto leading-snug">
{JSON.stringify(output || {}, null, 2)}
            </pre>
          </div>
          {isWrite && contract && (
            <div className="text-[10px] text-amber-700 dark:text-amber-300 leading-snug">
              This is a non-reversible write step. In a live run the rep would approve the {outputMeta?.desc?.toLowerCase() || 'output'} before it executed.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TriggerRow({ triggerNode, account, expanded, onToggle }) {
  const meta = WORKFLOW_NODE_TYPES[triggerNode.type];
  const fields = triggerDataFields(triggerNode.type);
  const triggerData = useMemo(() => {
    const data = {};
    for (const f of fields) {
      if (f === 'contact_id') data[f] = 'c_' + account.id;
      else if (f === 'contact_name') data[f] = account.contact.split('·')[0].trim();
      else if (f === 'contact_email') data[f] = 'contact@' + account.domain;
      else if (f === 'new_company_name') data[f] = account.name;
      else if (f === 'new_company_domain') data[f] = account.domain;
      else if (f === 'new_title') data[f] = 'VP Engineering';
      else if (f === 'account_id') data[f] = account.id;
      else if (f === 'account_name') data[f] = account.name;
      else if (f === 'rep_id') data[f] = 'rep_' + account.rep.toLowerCase();
      else if (f === 'arr') data[f] = account.arr;
      else if (f === 'competitor_mentioned') data[f] = 'CrowdStrike';
      else if (f === 'lead_email') data[f] = 'lead@' + account.domain;
      else if (f === 'lead_company_domain') data[f] = account.domain;
      else if (f === 'event_type') data[f] = 'product_comparison';
      else if (f === 'event_source') data[f] = 'TrustRadius';
      else data[f] = `<mock ${f}>`;
    }
    return data;
  }, [fields, account]);
  return (
    <div className="border border-rose-500/30 rounded bg-rose-500/5">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-rose-500/10 transition-colors"
      >
        {expanded ? <ChevronDown size={11} className="text-text-muted flex-shrink-0" /> : <ChevronRight size={11} className="text-text-muted flex-shrink-0" />}
        <Zap size={11} className="text-rose-700 dark:text-rose-300 flex-shrink-0" />
        <span className="text-xs font-semibold text-text-primary">Trigger — {meta?.label}</span>
        <span className="ml-auto text-[10px] text-text-muted font-mono">trigger.data</span>
      </button>
      {expanded && (
        <div className="px-3 py-2 border-t border-rose-500/20 bg-bg/40">
          <pre className="text-[10px] font-mono text-text-secondary overflow-x-auto leading-snug">
{JSON.stringify(triggerData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function TestRunModal({ tree, meta, onClose }) {
  const [account, setAccount] = useState(SAMPLE_ACCOUNTS[0]);
  const [expanded, setExpanded] = useState({});
  const [hasRun, setHasRun] = useState(false);

  const depths = useMemo(() => computeWorkflowDepth(tree), [tree]);

  const orderedNodeIds = useMemo(() => {
    const ids = Object.keys(tree.nodes || {});
    return ids.sort((a, b) => (depths[a] ?? 0) - (depths[b] ?? 0));
  }, [tree.nodes, depths]);

  const triggerId = orderedNodeIds.find((id) => WORKFLOW_NODE_TYPES[tree.nodes[id]?.type]?.isTrigger);

  const steps = useMemo(() => {
    return orderedNodeIds
      .filter((id) => id !== triggerId)
      .map((id) => {
        const node = tree.nodes[id];
        const nodeMeta = WORKFLOW_NODE_TYPES[node.type];
        const contract = contractForNodeType(node.type, AGENTS);
        const isWrite = contract?.is_reversible === false || (Array.isArray(nodeMeta?.writeScope) && nodeMeta.writeScope.length > 0);
        const approvalGate = nodeRequiresApprovalGate(node.type, AGENTS, node.config);
        const output = mockOutputFor(node, contract, account);
        return { id, node, meta: nodeMeta, contract, isWrite, approvalGate, output };
      });
  }, [orderedNodeIds, triggerId, tree.nodes, account]);

  const writeCount = steps.filter((s) => s.isWrite).length;
  const approvalCount = steps.filter((s) => s.approvalGate).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <div className="bg-bg border border-border rounded-lg shadow-modal max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <PlayCircle size={15} className="text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Test run · dry-run mode</h2>
              <p className="text-[11px] text-text-muted">
                Walks every step against a sample account. Reads execute; writes render as &ldquo;Would&hellip;&rdquo; previews. Not stored in the audit log.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-2 rounded transition-colors text-text-secondary"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-shrink-0 px-5 py-3 border-b border-border bg-surface-2/30 flex items-center gap-3 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Sample account</span>
          <div className="flex items-center gap-1">
            {SAMPLE_ACCOUNTS.map((a) => (
              <button
                key={a.id}
                onClick={() => { setAccount(a); setHasRun(false); setExpanded({}); }}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  account.id === a.id ? 'bg-primary/15 text-primary font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
          {hasRun && (
            <div className="ml-auto flex items-center gap-2 text-[10px]">
              <span className="text-text-muted">{steps.length} steps ·</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold">
                {steps.length - writeCount} executed
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold">
                {writeCount} would-write
              </span>
              {approvalCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold">
                  {approvalCount} approval gate{approvalCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {!hasRun ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <Play size={20} className="text-emerald-700 dark:text-emerald-300 ml-0.5" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">Ready to dry-run &ldquo;{meta?.name || 'workflow'}&rdquo;</h3>
              <p className="text-[11px] text-text-muted max-w-md mb-4 leading-relaxed">
                We&rsquo;ll walk every step against <span className="font-semibold text-text-secondary">{account.name}</span>.
                Read steps will execute live; write steps will render as previews without touching CRM or sending emails.
              </p>
              <button
                onClick={() => setHasRun(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
              >
                <PlayCircle size={12} />
                Start test run
              </button>
            </div>
          ) : (
            <>
              {triggerId && (
                <TriggerRow
                  triggerNode={tree.nodes[triggerId]}
                  account={account}
                  expanded={expanded[triggerId]}
                  onToggle={() => setExpanded((e) => ({ ...e, [triggerId]: !e[triggerId] }))}
                />
              )}
              {steps.map((s, i) => (
                <StepRow
                  key={s.id}
                  node={s.node}
                  depth={i}
                  contract={s.contract}
                  meta={s.meta}
                  isWrite={s.isWrite}
                  approvalGate={s.approvalGate}
                  output={s.output}
                  expanded={expanded[s.id]}
                  onToggle={() => setExpanded((e) => ({ ...e, [s.id]: !e[s.id] }))}
                />
              ))}
              <div className="flex items-center gap-2 pt-3 text-[11px] text-emerald-700 dark:text-emerald-300">
                <CircleCheck size={12} />
                <span>Dry run complete. Nothing was written.</span>
              </div>
              {steps.some((s) => s.contract?.inputs?.some((inp) => (inp.required !== false) && !s.node.config?.input_bindings?.[inp.name || inp.key])) && (
                <div className="flex items-start gap-2 pt-2 text-[11px] text-amber-700 dark:text-amber-300">
                  <CircleAlert size={12} className="mt-0.5 flex-shrink-0" />
                  <span>Some required inputs are unmapped. In a live run these steps would fail — open the Inspector to complete the input mapping.</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-[10px] text-text-muted leading-snug max-w-md">
            Test runs are not stored in the audit log. Use them to verify data flow and approval gates before publishing.
          </p>
          <div className="flex items-center gap-1.5">
            {hasRun && (
              <button
                onClick={() => { setHasRun(false); setExpanded({}); }}
                className="px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs rounded-md transition-colors"
              >
                Reset
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-dim transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
