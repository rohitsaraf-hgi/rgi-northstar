import { Plus } from 'lucide-react';
import { WORKFLOW_NODE_TYPES, NODE_FAMILIES, MODE_BADGES } from '../../data/workflowNodes.js';
import { NODE_ICONS } from './WorkflowCanvas.jsx';

const SECTIONS = [
  {
    family: 'trigger',
    label: 'Triggers',
    desc: 'One per workflow — how it gets invoked',
    types: ['trigger.signal', 'trigger.manual', 'trigger.scheduled'],
  },
  {
    family: 'agent',
    label: 'Phoenix agents (agentic)',
    desc: 'LLM-powered steps — drafts, research, reasoning',
    types: [
      'agent.email_draft',
      'agent.competitive_battlecard',
      'agent.persona_discovery',
      'agent.meeting_prep',
      'agent.value_hypothesis',
      'agent.renewal_readiness',
      'agent.account_research',
    ],
  },
  {
    family: 'api',
    label: 'API calls (deterministic)',
    desc: 'Cheap, predictable external calls — HG computations, CRM, sequences',
    types: [
      'api.hg.install',
      'api.hg.spend',
      'api.hg.intent',
      'api.crm.read',
      'api.crm.write',
      'api.crm.create_task',
      'api.outreach.enroll',
      'api.marketo.trigger',
      'api.slack.notify',
      'api.custom.webhook',
    ],
  },
  {
    family: 'logic',
    label: 'Logic',
    desc: 'Branch, match, loop',
    types: ['logic.branch', 'logic.match', 'logic.loop'],
  },
  {
    family: 'checkpoint',
    label: 'Human-in-loop',
    desc: 'Approval and review checkpoints',
    types: ['checkpoint.approval', 'checkpoint.review'],
  },
  {
    family: 'wait',
    label: 'Wait',
    desc: 'Async delays and event waits',
    types: ['wait.duration', 'wait.event'],
  },
  {
    family: 'output',
    label: 'Outputs (terminal)',
    desc: 'Outcome capture or notification',
    types: ['output.outcome', 'output.notify'],
  },
];

function PaletteItem({ type, onAdd }) {
  const meta = WORKFLOW_NODE_TYPES[type];
  if (!meta) return null;
  const Icon = NODE_ICONS[meta.icon] || NODE_ICONS.Bot;
  const familyCfg = NODE_FAMILIES[meta.family];
  const modeBadge = MODE_BADGES[meta.mode];
  return (
    <button
      onClick={() => onAdd(type)}
      className="w-full flex items-start gap-2 px-2 py-1.5 rounded hover:bg-surface-2 transition-colors text-left group"
    >
      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 border ${familyCfg?.bg} ${familyCfg?.color} ${familyCfg?.border}`}>
        <Icon size={11} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-text-primary truncate">{meta.label}</span>
          <span className={`text-[9px] uppercase tracking-wider font-bold px-1 rounded ${modeBadge?.bg} ${modeBadge?.color}`}>
            {modeBadge?.label}
          </span>
        </div>
        <div className="text-[10px] text-text-muted truncate">{meta.desc}</div>
      </div>
      <Plus size={11} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
    </button>
  );
}

export default function WorkflowNodePalette({ onAdd }) {
  return (
    <div className="border-t border-border">
      <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-text-muted font-semibold border-b border-border bg-bg/30">
        Node Palette
      </div>
      <div className="overflow-y-auto thin-scrollbar" style={{ maxHeight: 380 }}>
        {SECTIONS.map((section) => (
          <div key={section.family} className="py-2 border-b border-border/50 last:border-b-0">
            <div className="px-3 mb-1">
              <div className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">
                {section.label}
              </div>
              <div className="text-[9px] text-text-muted">{section.desc}</div>
            </div>
            <div className="px-1 space-y-0.5">
              {section.types.map((t) => (
                <PaletteItem key={t} type={t} onAdd={onAdd} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
