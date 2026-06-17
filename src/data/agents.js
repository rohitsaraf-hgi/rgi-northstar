// Phoenix agent registry. Two kinds:
//   - Data Agents: enrichment primitives (corporate linkage, intent, technographic, spend, contacts).
//     Always read-only.
//   - Atomic Agents: task primitives the seller can compose (Research / Content / Workflow).
//
// Capability ceiling tiers (the maximum the agent can ever do — see PermissionsModel):
//   - 'suggest': read-only — produces output, never writes
//   - 'draft':   produces an artifact pending human approval before any side-effect
//   - 'act':     can execute against external systems (still gated by runtime policy + approvals)
//
// Each agent has a `simulatedSteps` array used by the mock orchestrator to render
// the step-breadcrumb in an agent-run turn. Steps are tool calls + intermediate
// outputs that compose into the final artifact.

export const AGENT_CATEGORIES = {
  data: { label: 'Data', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-500/10', dot: 'bg-blue-500' },
  research: { label: 'Research', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-500/10', dot: 'bg-blue-500' },
  content: { label: 'Content', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-500/10', dot: 'bg-purple-500' },
  workflow: { label: 'Workflow', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
};

export const CAPABILITY_TIERS = {
  suggest: { label: 'Suggest', desc: 'Read-only output', color: 'text-text-secondary', bg: 'bg-bg/40', border: 'border-border' },
  draft:   { label: 'Draft',   desc: 'Creates artifact pending approval', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  act:     { label: 'Act',     desc: 'Executes against systems (with checkpoint)', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
};

export const AGENTS = {
  // ===== DATA AGENTS =====
  corporate_linkage: {
    id: 'corporate_linkage',
    kind: 'data',
    category: 'data',
    label: 'Corporate Linkage',
    desc: 'Maps parent–subsidiary relationships and corporate hierarchies',
    icon: 'Network',
    ceiling: 'suggest',
    inputs: [{ name: 'company', type: 'string', required: true }],
    outputs: [{ name: 'hierarchy', type: 'object', desc: 'Parent + subsidiaries graph' }],
    requiredModule: 'market_analyzer',
    writeScope: [],
    simulatedSteps: [
      { tool: 'corporate.lookup', detail: 'Resolved canonical entity id', durationMs: 320 },
      { tool: 'corporate.parents', detail: 'Walked up to ultimate parent (3 levels)', durationMs: 410 },
      { tool: 'corporate.subsidiaries', detail: 'Pulled active subsidiaries (12 nodes)', durationMs: 480 },
    ],
  },
  intent_signal: {
    id: 'intent_signal',
    kind: 'data',
    category: 'data',
    label: 'Intent Signal',
    desc: 'Detects buying signals and research activity across target accounts',
    icon: 'Target',
    ceiling: 'suggest',
    inputs: [{ name: 'accounts', type: 'array', required: true }],
    outputs: [{ name: 'signals', type: 'array', desc: 'Surge topics + scores per account' }],
    requiredModule: 'sales_copilot',
    writeScope: [],
    simulatedSteps: [
      { tool: 'intent.scan', detail: 'Scanned 12K topics over last 30 days', durationMs: 540 },
      { tool: 'intent.score', detail: 'Computed surge scores', durationMs: 280 },
    ],
  },
  technographic: {
    id: 'technographic',
    kind: 'data',
    category: 'data',
    label: 'Technographic',
    desc: 'Analyzes technology stacks and identifies competitive displacement opportunities',
    icon: 'Cpu',
    ceiling: 'suggest',
    inputs: [{ name: 'company', type: 'string', required: true }],
    outputs: [{ name: 'install_base', type: 'object' }],
    requiredModule: 'market_analyzer',
    writeScope: [],
    simulatedSteps: [
      { tool: 'tech.installs', detail: 'Pulled 247 verified installs', durationMs: 460 },
      { tool: 'tech.competitors', detail: 'Flagged 6 displacement candidates', durationMs: 310 },
    ],
  },
  spend_intelligence: {
    id: 'spend_intelligence',
    kind: 'data',
    category: 'data',
    label: 'Spend Intelligence',
    desc: 'Provides IT budget insights and spending pattern analysis',
    icon: 'BarChart3',
    ceiling: 'suggest',
    inputs: [{ name: 'company', type: 'string', required: true }],
    outputs: [{ name: 'spend_breakdown', type: 'object' }],
    requiredModule: 'market_analyzer',
    writeScope: [],
    simulatedSteps: [
      { tool: 'spend.fetch', detail: 'Pulled IT spend categories', durationMs: 380 },
      { tool: 'spend.peers', detail: 'Benchmarked vs 24 peer companies', durationMs: 290 },
    ],
  },
  contact_list: {
    id: 'contact_list',
    kind: 'data',
    category: 'data',
    label: 'Contact & List',
    desc: 'Builds targeted prospect lists with verified contact information',
    icon: 'Users',
    ceiling: 'suggest',
    inputs: [{ name: 'criteria', type: 'object', required: true }],
    outputs: [{ name: 'contacts', type: 'array' }],
    requiredModule: 'sales_copilot',
    writeScope: [],
    simulatedSteps: [
      { tool: 'contact.search', detail: 'Matched 84 contacts on title + seniority', durationMs: 520 },
      { tool: 'contact.verify', detail: 'Verified 81 emails (96% deliverability)', durationMs: 430 },
    ],
  },

  // ===== ATOMIC AGENTS — RESEARCH =====
  account_research: {
    id: 'account_research',
    kind: 'atomic',
    category: 'research',
    label: 'Account Research',
    desc: 'Comprehensive account intelligence in minutes',
    icon: 'FileSearch',
    ceiling: 'suggest',
    inputs: [{ name: 'account', type: 'string', required: true }],
    outputs: [{ name: 'brief', type: 'document' }],
    requiredModule: 'sales_copilot',
    writeScope: [],
    composes: ['corporate_linkage', 'technographic', 'intent_signal'],
    simulatedSteps: [
      { tool: 'kb.read', detail: 'Pulled product positioning + ICP definitions', durationMs: 220 },
      { tool: 'agent.corporate_linkage', detail: 'Resolved parent: Acme Holdings · 4 subsidiaries', durationMs: 410 },
      { tool: 'agent.technographic', detail: 'Identified Salesforce + ZoomInfo install', durationMs: 460 },
      { tool: 'agent.intent_signal', detail: 'Surge: "competitive displacement" (+38pts)', durationMs: 540 },
      { tool: 'compose.brief', detail: 'Synthesized account brief (12 sections)', durationMs: 760 },
    ],
  },
  competitive_battlecard: {
    id: 'competitive_battlecard',
    kind: 'atomic',
    category: 'research',
    label: 'Competitive Battlecard',
    desc: 'Generate competitive positioning guides',
    icon: 'Target',
    ceiling: 'suggest',
    inputs: [{ name: 'competitor', type: 'string', required: true }],
    outputs: [{ name: 'battlecard', type: 'document' }],
    requiredModule: 'sales_copilot',
    writeScope: [],
    simulatedSteps: [
      { tool: 'kb.search', detail: 'Pulled 8 internal battlecard sources', durationMs: 280 },
      { tool: 'web.search', detail: 'Recent reviews + analyst takes (last 90d)', durationMs: 620 },
      { tool: 'compose.battlecard', detail: 'Produced strengths/weaknesses/objections', durationMs: 540 },
    ],
  },
  linkedin_connect: {
    id: 'linkedin_connect',
    kind: 'atomic',
    category: 'research',
    label: 'LinkedIn Connect',
    desc: 'Personalized connection request messaging',
    icon: 'Linkedin',
    ceiling: 'draft',
    inputs: [{ name: 'contact', type: 'string', required: true }],
    outputs: [{ name: 'message', type: 'string' }],
    requiredModule: 'sales_copilot',
    writeScope: ['linkedin.send_invite'],
    simulatedSteps: [
      { tool: 'profile.fetch', detail: 'Pulled current title + recent posts', durationMs: 360 },
      { tool: 'compose.message', detail: 'Drafted 3 variants (280-char)', durationMs: 280 },
    ],
  },
  meeting_prep: {
    id: 'meeting_prep',
    kind: 'atomic',
    category: 'research',
    label: 'Meeting Prep',
    desc: 'Pre-meeting briefings with key insights',
    icon: 'Calendar',
    ceiling: 'suggest',
    inputs: [{ name: 'meeting_id', type: 'string', required: true }],
    outputs: [{ name: 'brief', type: 'document' }],
    requiredModule: 'sales_copilot',
    writeScope: [],
    simulatedSteps: [
      { tool: 'cal.fetch', detail: 'Read attendees + agenda', durationMs: 180 },
      { tool: 'crm.activity', detail: 'Pulled last 30d touches', durationMs: 340 },
      { tool: 'compose.brief', detail: '5-min meeting brief generated', durationMs: 410 },
    ],
  },

  // ===== ATOMIC AGENTS — CONTENT =====
  email_draft: {
    id: 'email_draft',
    kind: 'atomic',
    category: 'content',
    label: 'Email Draft',
    desc: 'Context-aware email composition',
    icon: 'Mail',
    ceiling: 'act',
    inputs: [{ name: 'recipient', type: 'string', required: true }, { name: 'context', type: 'object' }],
    outputs: [{ name: 'email', type: 'document' }],
    requiredModule: 'sales_copilot',
    writeScope: ['gmail.send', 'outreach.send'],
    simulatedSteps: [
      { tool: 'context.gather', detail: 'Pulled prior thread + account brief', durationMs: 240 },
      { tool: 'compose.email', detail: '3-variant subject + body drafted', durationMs: 480 },
      { tool: 'tone.check', detail: 'Tone calibrated to recipient seniority', durationMs: 180 },
    ],
  },
  follow_up_drafting: {
    id: 'follow_up_drafting',
    kind: 'atomic',
    category: 'content',
    label: 'Follow-Up Drafting',
    desc: 'Automated follow-up sequences',
    icon: 'MessageSquare',
    ceiling: 'draft',
    inputs: [{ name: 'thread_id', type: 'string', required: true }],
    outputs: [{ name: 'sequence', type: 'array' }],
    requiredModule: 'sales_copilot',
    writeScope: ['outreach.create_sequence'],
    simulatedSteps: [
      { tool: 'thread.read', detail: 'Read prior 4 messages', durationMs: 220 },
      { tool: 'compose.sequence', detail: '3-touch sequence over 8 days', durationMs: 460 },
    ],
  },
  proposal_builder: {
    id: 'proposal_builder',
    kind: 'atomic',
    category: 'content',
    label: 'Proposal Builder',
    desc: 'Custom proposal and quote generation',
    icon: 'FileText',
    ceiling: 'draft',
    inputs: [{ name: 'opportunity_id', type: 'string', required: true }],
    outputs: [{ name: 'proposal', type: 'document' }],
    requiredModule: 'sales_copilot',
    writeScope: ['gdrive.create'],
    simulatedSteps: [
      { tool: 'crm.opportunity', detail: 'Pulled product + pricing config', durationMs: 320 },
      { tool: 'compose.proposal', detail: 'Generated 14-page proposal', durationMs: 1100 },
    ],
  },
  qbr_builder: {
    id: 'qbr_builder',
    kind: 'atomic',
    category: 'content',
    label: 'QBR Builder',
    desc: 'Quarterly business review preparation',
    icon: 'BarChart3',
    ceiling: 'draft',
    inputs: [{ name: 'account_id', type: 'string', required: true }],
    outputs: [{ name: 'deck', type: 'document' }],
    requiredModule: 'sales_copilot',
    writeScope: ['gslides.create'],
    simulatedSteps: [
      { tool: 'usage.fetch', detail: 'Pulled last quarter usage metrics', durationMs: 380 },
      { tool: 'compose.deck', detail: '12-slide QBR deck assembled', durationMs: 920 },
    ],
  },

  // ===== ATOMIC AGENTS — WORKFLOW =====
  account_handoff: {
    id: 'account_handoff',
    kind: 'atomic',
    category: 'workflow',
    label: 'Account Handoff',
    desc: 'Structured handoff documentation',
    icon: 'Handshake',
    ceiling: 'act',
    inputs: [{ name: 'account_id', type: 'string', required: true }, { name: 'to_user', type: 'string' }],
    outputs: [{ name: 'handoff_doc', type: 'document' }],
    requiredModule: 'sales_copilot',
    writeScope: ['sfdc.update_owner', 'gdrive.create'],
    simulatedSteps: [
      { tool: 'crm.account', detail: 'Pulled full account history', durationMs: 320 },
      { tool: 'compose.handoff', detail: 'Generated structured handoff doc', durationMs: 580 },
    ],
  },
  call_summary: {
    id: 'call_summary',
    kind: 'atomic',
    category: 'workflow',
    label: 'Call Summary',
    desc: 'Action items from call transcripts',
    icon: 'MessageSquare',
    ceiling: 'draft',
    inputs: [{ name: 'transcript_id', type: 'string', required: true }],
    outputs: [{ name: 'summary', type: 'document' }],
    requiredModule: 'sales_copilot',
    writeScope: ['sfdc.create_task'],
    simulatedSteps: [
      { tool: 'transcript.fetch', detail: 'Loaded 47-min transcript', durationMs: 280 },
      { tool: 'extract.actions', detail: 'Extracted 8 action items + owners', durationMs: 460 },
    ],
  },
  renewal_readiness: {
    id: 'renewal_readiness',
    kind: 'atomic',
    category: 'workflow',
    label: 'Renewal Readiness',
    desc: 'Expansion and renewal opportunity scoring',
    icon: 'TrendingUp',
    ceiling: 'draft',
    inputs: [{ name: 'account_id', type: 'string', required: true }],
    outputs: [{ name: 'readiness_report', type: 'document' }],
    requiredModule: 'sales_copilot',
    writeScope: ['vitally.create_plan'],
    simulatedSteps: [
      { tool: 'health.fetch', detail: 'Pulled Vitally health + NPS history', durationMs: 340 },
      { tool: 'usage.trend', detail: '12-week usage trend computed', durationMs: 280 },
      { tool: 'compose.report', detail: 'Renewal readiness scored: 78/100', durationMs: 520 },
    ],
  },
  value_hypothesis: {
    id: 'value_hypothesis',
    kind: 'atomic',
    category: 'workflow',
    label: 'Value Hypothesis',
    desc: 'ROI and value proposition builder',
    icon: 'Sparkles',
    ceiling: 'suggest',
    inputs: [{ name: 'account_id', type: 'string', required: true }],
    outputs: [{ name: 'value_card', type: 'document' }],
    requiredModule: 'sales_copilot',
    writeScope: [],
    simulatedSteps: [
      { tool: 'kb.read', detail: 'Pulled value framework + benchmarks', durationMs: 240 },
      { tool: 'compose.value', detail: 'Generated 3-pillar value hypothesis', durationMs: 480 },
    ],
  },

  web_research: {
    id: 'web_research',
    kind: 'atomic',
    category: 'research',
    label: 'Web Research',
    desc: 'Pulls news, press releases, leadership signals, and hiring trends from the open web — filtered through your product lens',
    icon: 'Sparkles',
    ceiling: 'suggest',
    inputs: [
      { name: 'company', type: 'string', required: true },
      { name: 'product_lens', type: 'array', desc: 'Topics to weight findings by' },
    ],
    outputs: [{ name: 'signals', type: 'array', desc: 'Ranked signals with provenance' }],
    requiredModule: 'sales_copilot',
    writeScope: [],
    simulatedSteps: [
      { tool: 'web.search', detail: 'Searched site + news + LinkedIn (28 sources)', durationMs: 620 },
      { tool: 'web.fetch', detail: 'Extracted leadership posts, press releases, job postings', durationMs: 480 },
      { tool: 'extract.signals', detail: '7 hiring + 3 expansion + 2 leadership signals found', durationMs: 340 },
      { tool: 'rank.by_product_lens', detail: 'Filtered to signals matching your product thesis', durationMs: 220 },
    ],
  },
  sec_financials: {
    id: 'sec_financials',
    kind: 'atomic',
    category: 'research',
    label: 'SEC Financials',
    desc: 'Parses the latest 10-K / 10-Q for revenue trends, segment focus, and stated investment areas',
    icon: 'BarChart3',
    ceiling: 'suggest',
    inputs: [{ name: 'company', type: 'string', required: true }],
    outputs: [{ name: 'financial_signals', type: 'object' }],
    requiredModule: 'sales_copilot',
    writeScope: [],
    simulatedSteps: [
      { tool: 'sec.lookup', detail: 'Pulled latest 10-Q (Q3 FY26, filed Apr 2026)', durationMs: 420 },
      { tool: 'parse.mdna', detail: "Extracted MD&A section — 'cloud sprawl' flagged as margin headwind", durationMs: 580 },
      { tool: 'extract.segments', detail: 'Segment revenue + capex by area', durationMs: 380 },
    ],
  },
  crm_360: {
    id: 'crm_360',
    kind: 'atomic',
    category: 'workflow',
    label: 'CRM 360',
    desc: 'Merges Salesforce/HubSpot account history with Amplitude/Segment/Marketo first-party signals into a unified account view',
    icon: 'Handshake',
    ceiling: 'suggest',
    inputs: [
      { name: 'account_id', type: 'string', required: true },
      { name: 'integrations', type: 'array', desc: 'Which integrations to pull from' },
    ],
    outputs: [{ name: 'account_360', type: 'object', desc: 'Champion, multi-thread state, activity, risks' }],
    requiredModule: 'sales_copilot',
    writeScope: [],
    simulatedSteps: [
      { tool: 'sfdc.account', detail: 'Pulled Salesforce account + 18 contacts + 4 open opportunities', durationMs: 520 },
      { tool: 'sfdc.activity', detail: 'Last 90 days of activity (47 touches, 8 stakeholders)', durationMs: 380 },
      { tool: 'amplitude.events', detail: 'Product analytics: 12 page visits, 1 white paper download', durationMs: 280 },
      { tool: 'marketo.engagement', detail: 'Nurture campaigns + email opens', durationMs: 240 },
      { tool: 'compose.account_360', detail: 'Synthesized champion + multi-thread map + open risks', durationMs: 420 },
    ],
  },
  kb_resource_search: {
    id: 'kb_resource_search',
    kind: 'atomic',
    category: 'research',
    label: 'Resource Library Search',
    desc: "Pulls agent-enabled resources from your tenant's Research Resources library — battle cards, earnings transcripts, buyer personas, internal notes — and cites them in agent outputs.",
    icon: 'BookOpen',
    ceiling: 'suggest',
    inputs: [
      { name: 'tenant_id', type: 'string', required: true },
      { name: 'context_tags', type: 'array' },
    ],
    outputs: [{ name: 'citations', type: 'array', desc: 'Resources with title, source, summary' }],
    requiredModule: 'sales_copilot',
    writeScope: [],
    simulatedSteps: [
      { tool: 'kb.scan', detail: 'Scanned tenant resource library', durationMs: 220 },
      { tool: 'kb.rank', detail: 'Ranked agent-enabled resources by tag overlap', durationMs: 280 },
      { tool: 'kb.cite', detail: 'Selected top 3 resources for citation', durationMs: 180 },
    ],
  },
  meddic_compose: {
    id: 'meddic_compose',
    kind: 'atomic',
    category: 'workflow',
    label: 'MEDDIC Compose',
    desc: 'Synthesizes upstream signals into the MEDDIC framework (Metrics / Economic Buyer / Decision Criteria / Decision Process / Identify Pain / Champion) with per-dimension evidence status',
    icon: 'FileText',
    ceiling: 'suggest',
    inputs: [{ name: 'inputs', type: 'object', desc: 'Outputs from upstream agents' }],
    outputs: [{ name: 'meddic', type: 'object', desc: 'Six dimensions with status + evidence + source' }],
    requiredModule: 'sales_copilot',
    writeScope: [],
    simulatedSteps: [
      { tool: 'aggregate.signals', detail: 'Joined 8 upstream agent outputs', durationMs: 280 },
      { tool: 'meddic.classify', detail: 'Mapped evidence to 6 MEDDIC dimensions', durationMs: 460 },
      { tool: 'meddic.status', detail: 'Confirmed: 3 · Inferred: 2 · Unknown: 1', durationMs: 240 },
      { tool: 'compose.brief', detail: 'Generated full 5-section brief', durationMs: 580 },
    ],
  },
  persona_discovery: {
    id: 'persona_discovery',
    kind: 'atomic',
    category: 'research',
    label: 'Persona Discovery',
    desc: 'Finds key personas missing from your CRM — filter by job title, seniority, and location. Reveals verified email / phone and can push enriched contacts straight to Outreach.',
    icon: 'UserPlus',
    ceiling: 'draft',
    inputs: [
      { name: 'company', type: 'string', required: true },
      { name: 'job_titles', type: 'array' },
      { name: 'seniority', type: 'array' },
      { name: 'location', type: 'array' },
    ],
    outputs: [{ name: 'personas', type: 'array', desc: 'Ranked persona candidates with reveal actions' }],
    requiredModule: 'sales_copilot',
    writeScope: ['sfdc.contact.create', 'outreach.add_to_sequence'],
    simulatedSteps: [
      { tool: 'persona.search', detail: 'Matched 10 candidates on title + seniority + region', durationMs: 420 },
      { tool: 'persona.gap', detail: 'Flagged 4 not present in connected CRM', durationMs: 280 },
      { tool: 'contact.reveal', detail: 'Verified email (96%) + phone (74%) coverage', durationMs: 360 },
      { tool: 'compose.actions', detail: 'Prepared 1-click Salesforce + Outreach enrichment', durationMs: 220 },
    ],
  },
  crm_enrichment: {
    id: 'crm_enrichment',
    kind: 'atomic',
    category: 'workflow',
    label: 'CRM Enrichment',
    desc: 'Bulk enrich CRM accounts with HG firmographics, tech installs, intent surge, and computed scoring',
    icon: 'TrendingUp',
    ceiling: 'act',
    inputs: [
      { name: 'list_id', type: 'string', required: true },
      { name: 'crm', type: 'enum', values: ['salesforce', 'hubspot'], required: true },
      { name: 'fields', type: 'array', desc: 'fields to write back' },
    ],
    outputs: [{ name: 'run_summary', type: 'document', desc: 'rows enriched, fields written, errors' }],
    requiredModule: 'market_analyzer',
    writeScope: ['sfdc.account.update', 'sfdc.lead.update', 'hubspot.company.update'],
    composes: ['corporate_linkage', 'technographic', 'spend_intelligence', 'intent_signal'],
    simulatedSteps: [
      { tool: 'list.read', detail: 'Loaded saved company list (15 rows)', durationMs: 220 },
      { tool: 'agent.corporate_linkage', detail: 'Resolved canonical entities + parent hierarchy', durationMs: 540 },
      { tool: 'agent.technographic', detail: 'Pulled active tech installs (avg 247 per company)', durationMs: 980 },
      { tool: 'agent.spend_intelligence', detail: 'IT spend categories computed', durationMs: 620 },
      { tool: 'agent.intent_signal', detail: 'Last-30d surge topics fetched', durationMs: 480 },
      { tool: 'score.apply', detail: 'Combined Fit + Intent scores written', durationMs: 320 },
      { tool: 'crm.write', detail: 'Salesforce: 15 accounts updated · 8 custom fields per account', durationMs: 1100 },
    ],
  },
};

export const AGENTS_BY_CATEGORY = {
  data: ['corporate_linkage', 'intent_signal', 'technographic', 'spend_intelligence', 'contact_list'],
  research: ['account_research', 'web_research', 'sec_financials', 'kb_resource_search', 'persona_discovery', 'competitive_battlecard', 'linkedin_connect', 'meeting_prep'],
  content: ['email_draft', 'follow_up_drafting', 'proposal_builder', 'qbr_builder'],
  workflow: ['account_handoff', 'crm_360', 'meddic_compose', 'call_summary', 'renewal_readiness', 'value_hypothesis', 'crm_enrichment'],
};

// Resolve effective capability for a single agent invocation, applying the
// 4-layer permissions model:
//   1. Agent ceiling (hard cap, set in this file)
//   2. Workflow policy (per-agent capability inside a Playbook)
//   3. Audience policy (downgrade for tenure/role within Playbook audience)
//   4. Run-time override (seller can downgrade per run)
// All layers can ONLY downgrade — never elevate.
const TIER_RANK = { suggest: 0, draft: 1, act: 2 };
export function resolveCapability({ agentId, workflowPolicy, audienceOverride, runOverride }) {
  const agent = AGENTS[agentId];
  if (!agent) return 'suggest';
  const layers = [agent.ceiling, workflowPolicy, audienceOverride, runOverride].filter(Boolean);
  let lowest = agent.ceiling;
  for (const layer of layers) {
    if (TIER_RANK[layer] < TIER_RANK[lowest]) lowest = layer;
  }
  return lowest;
}

export function agentById(id) {
  return AGENTS[id] || null;
}

export function listAgents() {
  return Object.values(AGENTS);
}

// Filter agents the seller can see in the @-autocomplete given their tier,
// modules owned, and any audience override list. For demo: any agent whose
// requiredModule is owned. (We do NOT tier-gate individual agents — Agent
// Mode tier-gating is at the AGENT MODE level, not per-agent invocation.)
export function listAvailableAgents({ modulesOwned }) {
  return listAgents().filter((a) => modulesOwned.includes(a.requiredModule));
}
