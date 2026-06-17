// Mock conversational workflow-authoring agent.
//
// Pattern-matches user intent and proposes a complete workflow tree
// (trigger + heterogeneous nodes + outcome). Each recipe demonstrates a
// different mix of agentic and deterministic steps.

import { cloneWorkflowTree } from './workflowGraph.js';

// ---- Recipe library ----

const DISPLACEMENT = {
  tree: {
    output_node: 'n_outcome',
    nodes: {
      n_trigger: { type: 'trigger.signal', config: { signal_id: 'splunk-aging-displacement' } },
      n_install: { type: 'api.hg.install', config: { entity: 'product', value: 'Splunk' } },
      n_intent: { type: 'api.hg.intent', config: { category: 'Observability' } },
      n_battlecard: { type: 'agent.competitive_battlecard', config: { competitor: 'Splunk' } },
      n_email: { type: 'agent.email_draft', config: { tone: 'consultative', cadence: '3-touch', channel: 'email' } },
      n_approve: { type: 'checkpoint.approval', config: { assignee_role: 'AE', sla_hours: 24 } },
      n_enroll: { type: 'api.outreach.enroll', config: { sequence: 'EMEA Displacement' } },
      n_outcome: { type: 'output.outcome', config: { capture: 'replied, booked, no_response_14d' } },
    },
    edges: [
      ['n_trigger', 'n_install'],
      ['n_install', 'n_intent'],
      ['n_intent', 'n_battlecard'],
      ['n_battlecard', 'n_email'],
      ['n_email', 'n_approve'],
      ['n_approve', 'n_enroll'],
      ['n_enroll', 'n_outcome'],
    ],
  },
  name: 'Displacement Play (Splunk)',
  description: 'Signal-triggered displacement: HG install + intent → battlecard → draft → AE approval → Outreach enroll → outcome.',
  narration:
    "Wired this as a hybrid workflow — 2 deterministic HG fetches up front for cheap context, then 2 LLM agents for the heavier lifting (battlecard + email draft), AE approval before send, and an outcome logger at the end.",
  suggestions: [
    { label: 'Swap to Datadog displacement', applies: 'swap_datadog' },
    { label: 'Add Slack notification post-send', applies: 'add_slack' },
    { label: 'Add 7-day wait + follow-up', applies: 'add_wait_followup' },
  ],
  costNote: '3 agentic steps (~6k tokens) + 4 deterministic (~1100ms) + 1 human checkpoint. Most cost is the battlecard agent — consider deterministic alternatives if running at >500/day.',
  keywords: ['displacement', 'splunk', 'aging', 'install', 'competitive', 'takeout', 'outreach'],
};

const ACCOUNT_BRIEF = {
  tree: {
    output_node: 'n_notify',
    nodes: {
      n_trigger: { type: 'trigger.manual', config: { invocation: 'thread' } },
      n_crm: { type: 'api.crm.read', config: { object: 'account', fields: 'industry,arr,stage,renewal_date' } },
      n_install: { type: 'api.hg.install', config: { entity: 'category', value: 'BI' } },
      n_spend: { type: 'api.hg.spend', config: { category: 'IT' } },
      n_research: { type: 'agent.account_research', config: { scope: 'web+sec' } },
      n_personas: { type: 'agent.persona_discovery', config: { titles: 'VP,SVP,C-Level', seniority: 'Director+' } },
      n_value: { type: 'agent.value_hypothesis', config: { focus: 'MEDDIC roll-up' } },
      n_notify: { type: 'output.notify', config: { channel: 'thread', format: 'brief' } },
    },
    edges: [
      ['n_trigger', 'n_crm'],
      ['n_trigger', 'n_install'],
      ['n_trigger', 'n_spend'],
      ['n_crm', 'n_research'],
      ['n_install', 'n_research'],
      ['n_spend', 'n_research'],
      ['n_research', 'n_personas'],
      ['n_research', 'n_value'],
      ['n_personas', 'n_notify'],
      ['n_value', 'n_notify'],
    ],
  },
  name: 'Account Brief',
  description: '6-step parallel research synthesis — HG firmographics + web research + persona discovery + value hypothesis, delivered as a thread brief.',
  narration:
    "Manual trigger because sellers invoke this ad-hoc on accounts they're working. 3 deterministic fetches happen in parallel feeding 3 agents, which fan into a final notify. Total: 3 agentic, 3 deterministic, no human approval needed.",
  suggestions: [
    { label: 'Add MEDDIC stakeholder map step', applies: 'add_meddic' },
    { label: 'Trigger from Hot signal instead', applies: 'change_to_signal' },
    { label: 'Output to Slack instead of thread', applies: 'output_slack' },
  ],
  costNote: '3 agentic steps (~7100 tokens). Parallel fan-out keeps wall-clock under 4s. Deterministic fetches are free.',
  keywords: ['account brief', 'research', 'briefing', 'meddic', 'persona', 'value prop', 'firmographic'],
};

const ONBOARDING_RESCUE = {
  tree: {
    output_node: 'n_outcome',
    nodes: {
      n_trigger: { type: 'trigger.signal', config: { signal_id: 'onboarding-stalled' } },
      n_usage: { type: 'api.crm.read', config: { object: 'account', fields: 'product_usage_summary,feature_adoption' } },
      n_email: { type: 'agent.email_draft', config: { tone: 'helpful', cadence: '1-touch', channel: 'email' } },
      n_approve: { type: 'checkpoint.approval', config: { assignee_role: 'CSM', sla_hours: 24 } },
      n_task: { type: 'api.crm.create_task', config: { type: 'follow-up call', due_in_hours: 48 } },
      n_outcome: { type: 'output.outcome', config: { capture: 'replied, engaged, no_response_14d' } },
    },
    edges: [
      ['n_trigger', 'n_usage'],
      ['n_usage', 'n_email'],
      ['n_email', 'n_approve'],
      ['n_approve', 'n_task'],
      ['n_task', 'n_outcome'],
    ],
  },
  name: 'Onboarding Rescue',
  description: 'Signal-triggered re-engagement — pull usage detail, draft an email, CSM approves, create CRM follow-up task.',
  narration:
    "Bound to Onboarding Stalled signal. Keeps the agentic surface minimal — just one email draft — and uses deterministic CRM reads + task creation around it. CSM approval gates the send.",
  suggestions: [
    { label: 'Add usage chart attachment', applies: 'add_chart' },
    { label: 'Branch by ARR tier (>$100k → CSM-owned)', applies: 'add_arr_branch' },
    { label: 'Wait 7 days then send second touch', applies: 'add_second_touch' },
  ],
  costNote: '1 agentic step (~1200 tokens) + 3 deterministic. Cheapest workflow shape — appropriate for high-volume signals.',
  keywords: ['onboarding', 'stalled', 'rescue', 're-engagement', 'csm', 'new customer'],
};

const RENEWAL_DEFENSE = {
  tree: {
    output_node: 'n_outcome',
    nodes: {
      n_trigger: { type: 'trigger.signal', config: { signal_id: 'renewal-risk' } },
      n_brief: { type: 'agent.renewal_readiness', config: { include: 'usage,nps,exec_engagement' } },
      n_branch: { type: 'logic.branch', config: { on: 'account.arr', op: '>', value: '$100k' } },
      n_email_high: { type: 'agent.email_draft', config: { tone: 'executive', cadence: '1-touch', channel: 'email' } },
      n_email_low: { type: 'agent.email_draft', config: { tone: 'consultative', cadence: '2-touch', channel: 'email' } },
      n_wait: { type: 'wait.duration', config: { days: 7 } },
      n_slack: { type: 'api.slack.notify', config: { channel: '#renewal-watch' } },
      n_outcome: { type: 'output.outcome', config: { capture: 'saved, expanded, churned' } },
    },
    edges: [
      ['n_trigger', 'n_brief'],
      ['n_brief', 'n_branch'],
      ['n_branch', 'n_email_high'],
      ['n_branch', 'n_email_low'],
      ['n_email_high', 'n_wait'],
      ['n_email_low', 'n_wait'],
      ['n_wait', 'n_slack'],
      ['n_slack', 'n_outcome'],
    ],
  },
  name: 'Renewal Defense',
  description: 'Signal-triggered renewal save — brief, branch by ARR, draft tone-appropriate email, wait, escalate if no engagement.',
  narration:
    "Branches by ARR tier so the tone matches the audience. 7-day wait gives the customer time to respond before Slack escalation. Two email paths (executive vs consultative) — same agent, different tone configs.",
  suggestions: [
    { label: 'Add support ticket spike check', applies: 'add_support' },
    { label: 'Add usage-chart attachment', applies: 'add_chart' },
    { label: 'Escalate to Gong meeting request after wait', applies: 'add_meeting' },
  ],
  costNote: '2 agentic steps (~3400 tokens) but only one fires per run (the branch). Wait + Slack are free.',
  keywords: ['renewal', 'risk', 'defense', 'save', 'churn', 'exec brief'],
};

const INBOUND_QUAL = {
  tree: {
    output_node: 'n_outcome',
    nodes: {
      n_trigger: { type: 'trigger.scheduled', config: { interval: 'on form submission' } },
      n_crm: { type: 'api.crm.read', config: { object: 'lead', fields: 'company,title,country' } },
      n_install: { type: 'api.hg.install', config: { entity: 'category', value: 'BI' } },
      n_intent: { type: 'api.hg.intent', config: { category: 'Observability' } },
      n_score: { type: 'api.custom.webhook', config: { endpoint: 'fit-score-v2', returns: 'score 0-100' } },
      n_branch: { type: 'logic.branch', config: { on: 'fit_score', op: '>=', value: '80' } },
      n_fast: { type: 'api.crm.write', config: { field: 'lead_owner', value: 'next_AE_in_queue' } },
      n_std: { type: 'api.crm.write', config: { field: 'lead_owner', value: 'SDR_queue' } },
      n_outcome: { type: 'output.outcome', config: { capture: 'AE_accepted, SDR_qualified, disqualified' } },
    },
    edges: [
      ['n_trigger', 'n_crm'],
      ['n_crm', 'n_install'],
      ['n_install', 'n_intent'],
      ['n_intent', 'n_score'],
      ['n_score', 'n_branch'],
      ['n_branch', 'n_fast'],
      ['n_branch', 'n_std'],
      ['n_fast', 'n_outcome'],
      ['n_std', 'n_outcome'],
    ],
  },
  name: 'Inbound Qualification',
  description: 'Scheduled per inbound — enrich, score, branch by threshold, route to AE or SDR queue, log outcome.',
  narration:
    "100% deterministic — no LLM cost. Runs on every form submission, enriches via HG + custom scoring endpoint, branches at score >=80, and routes to the right queue. Outcome logger feeds back into Marcus's model retraining.",
  suggestions: [
    { label: 'Replace custom webhook with HG model API', applies: 'use_hg_score' },
    { label: 'Add agentic enrichment for ambiguous scores 60-80', applies: 'add_agent_band' },
    { label: 'Notify AE in Slack on fast-lane', applies: 'add_slack' },
  ],
  costNote: 'Zero LLM cost. 5 deterministic API calls totaling ~1100ms per run. Cheap to run at high volume — typical for inbound.',
  keywords: ['inbound', 'qualification', 'pql', 'lead', 'scoring', 'routing', 'sdr', 'form submission'],
};

const PERSONA_DISCOVERY = {
  tree: {
    output_node: 'n_outcome',
    nodes: {
      n_trigger: { type: 'trigger.manual', config: { invocation: '@-mention' } },
      n_personas: { type: 'agent.persona_discovery', config: { titles: 'VP,SVP,C-Level', seniority: 'Director+' } },
      n_loop: { type: 'logic.loop', config: { over: 'discovered_contacts' } },
      n_create: { type: 'api.crm.create_task', config: { type: 'enrich + add', due_in_hours: 24 } },
      n_li: { type: 'agent.email_draft', config: { channel: 'linkedin', tone: 'helpful', cadence: '1-touch' } },
      n_outcome: { type: 'output.outcome', config: { capture: 'connected, accepted, no_response' } },
    },
    edges: [
      ['n_trigger', 'n_personas'],
      ['n_personas', 'n_loop'],
      ['n_loop', 'n_create'],
      ['n_loop', 'n_li'],
      ['n_create', 'n_outcome'],
      ['n_li', 'n_outcome'],
    ],
  },
  name: 'Persona Discovery Probe',
  description: 'Manual play — discover missing personas, then loop per contact: create CRM record + draft LinkedIn connect.',
  narration:
    "Loop iterates over each discovered contact in parallel — one CRM record + one LinkedIn draft per persona. Cost scales linearly with persona count. AE invokes manually from the account thread.",
  suggestions: [
    { label: 'Add seniority filter (Director+)', applies: 'add_filter' },
    { label: 'Push contacts to Outreach sequence instead', applies: 'use_outreach' },
    { label: 'Branch by champion status', applies: 'champion_branch' },
  ],
  costNote: '1 agent + N agents (one per persona). Typical 4-6 personas = ~9000 tokens/run. Loop cost is the dominant factor.',
  keywords: ['persona', 'discovery', 'find contacts', 'stakeholder', 'linkedin', 'connect'],
};

const RECIPES = [
  { id: 'displacement', ...DISPLACEMENT },
  { id: 'account-brief', ...ACCOUNT_BRIEF },
  { id: 'onboarding-rescue', ...ONBOARDING_RESCUE },
  { id: 'renewal-defense', ...RENEWAL_DEFENSE },
  { id: 'inbound-qual', ...INBOUND_QUAL },
  { id: 'persona-discovery', ...PERSONA_DISCOVERY },
];

function scoreMatch(text, recipe) {
  const t = text.toLowerCase();
  let score = 0;
  for (const kw of recipe.keywords) {
    if (t.includes(kw)) score += 1;
  }
  return score;
}

export function proposeWorkflowFromIntent(text) {
  if (!text || !text.trim()) {
    return {
      ok: false,
      narration: "Tell me what workflow you want to build — describe the trigger, the steps, and what should happen at the end.",
    };
  }
  let best = null;
  for (const recipe of RECIPES) {
    const s = scoreMatch(text, recipe);
    if (s > 0 && (!best || s > best.score)) best = { ...recipe, score: s };
  }
  if (!best) {
    return {
      ok: false,
      narration:
        "I couldn't fully parse that. Try mentioning a known pattern (displacement, account brief, onboarding, renewal, inbound qualification, persona discovery) or specific tools (Outreach, Marketo, Slack, CRM).",
      suggestions: RECIPES.map((r) => ({ label: r.name, applies: r.id })),
    };
  }
  return {
    ok: true,
    recipeId: best.id,
    tree: cloneWorkflowTree(best.tree),
    meta: { name: best.name, description: best.description },
    narration: best.narration,
    suggestions: best.suggestions,
    costNote: best.costNote,
  };
}

export function applyWorkflowRefinement(tree, suggestionId) {
  const next = cloneWorkflowTree(tree);
  switch (suggestionId) {
    case 'add_slack': {
      const slackId = `n_slack_${Date.now().toString(36)}`;
      next.nodes[slackId] = { type: 'api.slack.notify', config: { channel: '#deal-watch' } };
      // Attach Slack before any outcome/notify terminal — find a terminal and rewire its inbound edge.
      const terminalEntries = Object.entries(next.nodes).filter(
        ([, n]) => n.type === 'output.outcome' || n.type === 'output.notify',
      );
      if (terminalEntries.length > 0) {
        const [terminalId] = terminalEntries[0];
        // Take incoming edges into terminal, redirect to slack, then slack to terminal.
        const incomingToTerminal = next.edges.filter(([, t]) => t === terminalId);
        next.edges = next.edges.filter(([, t]) => t !== terminalId);
        for (const [from] of incomingToTerminal) {
          next.edges.push([from, slackId]);
        }
        next.edges.push([slackId, terminalId]);
      }
      return { tree: next, narration: 'Inserted a Slack notify step before the outcome logger.' };
    }
    case 'add_wait_followup': {
      const waitId = `n_wait_${Date.now().toString(36)}`;
      next.nodes[waitId] = { type: 'wait.duration', config: { days: 7 } };
      const terminalEntries = Object.entries(next.nodes).filter(
        ([, n]) => n.type === 'output.outcome' || n.type === 'output.notify',
      );
      if (terminalEntries.length > 0) {
        const [terminalId] = terminalEntries[0];
        const incomingToTerminal = next.edges.filter(([, t]) => t === terminalId);
        next.edges = next.edges.filter(([, t]) => t !== terminalId);
        for (const [from] of incomingToTerminal) next.edges.push([from, waitId]);
        next.edges.push([waitId, terminalId]);
      }
      return { tree: next, narration: 'Added a 7-day wait step before the terminal.' };
    }
    case 'swap_datadog': {
      for (const [, n] of Object.entries(next.nodes)) {
        if (n.type === 'api.hg.install' && n.config?.value === 'Splunk') {
          n.config = { ...n.config, value: 'Datadog' };
        }
        if (n.type === 'agent.competitive_battlecard' && n.config?.competitor === 'Splunk') {
          n.config = { ...n.config, competitor: 'Datadog' };
        }
      }
      return { tree: next, narration: 'Swapped Splunk references to Datadog throughout the workflow.' };
    }
    case 'output_slack': {
      for (const [, n] of Object.entries(next.nodes)) {
        if (n.type === 'output.notify') {
          n.config = { ...n.config, channel: 'slack' };
        }
      }
      return { tree: next, narration: 'Switched the notification channel to Slack.' };
    }
    default:
      return { tree: next, narration: 'Refinement queued — full implementation lands when the agent is real.' };
  }
}

export function listWorkflowRecipes() {
  return RECIPES.map(({ tree, ...meta }) => meta);
}
