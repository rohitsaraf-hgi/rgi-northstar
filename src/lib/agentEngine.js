// Mock agent orchestrator. Given an invocation request, builds a sequence of
// step updates that progressively mutate an agent turn from 'pending' →
// 'running' → 'done'. The thread is the system of record; turns get appended
// here and updated via setTurns().

import { AGENTS, resolveCapability } from '../data/agents.js';
import { findPlaybookById, findAgenticPlaybookByHandle } from '../data/playbooks.js';

const ARTIFACT_FIXTURES = {
  account_brief: (target) => ({
    kind: 'BRIEF',
    title: `Account Brief — ${target}`,
    meta: '12 sections · 4.2s',
    sections: [
      { heading: 'Corporate hierarchy', body: `${target} is a wholly-owned subsidiary of ${target} Holdings. 4 active subsidiaries across NA + EMEA. Decision authority centralized at HQ.` },
      { heading: 'Tech install', body: 'Salesforce (CRM) · ZoomInfo (data) · Outreach (sequencing) · 6sense (intent). No HG Insights footprint detected — net-new opportunity.' },
      { heading: 'Intent signal', body: 'Surge on "competitive displacement" (+38pts in 14 days) and "go-to-market platform" (+22pts). Early-stage research mode, not yet talking to vendors.' },
      { heading: 'Value hypothesis', body: 'ZoomInfo + 6sense → consolidation candidate. Estimated $180K seat displacement + $80K incremental Sales Copilot. Champion likely in RevOps Director seat.' },
    ],
  }),
  account_research: (target) => ({
    kind: 'RESEARCH',
    title: `Research — ${target}`,
    meta: '8 sources · 3.1s',
    sections: [
      { heading: 'Firmographics', body: '$420M revenue · 1,400 employees · HQ Boston · Series D ($240M, Aug 2025).' },
      { heading: 'Recent moves', body: 'CRO hire from Snowflake (Mar 2026). Series D earmarks "GTM platform consolidation" as a stated use of funds.' },
      { heading: 'Org changes', body: '7 RevOps openings posted in last 30 days — strong build-out signal.' },
    ],
  }),
  email_draft: (target) => ({
    kind: 'EMAIL',
    title: `Draft — Re: GTM platform conversation @ ${target}`,
    meta: 'Variant 1 of 3 · 240 words',
    sections: [
      { heading: 'Subject', body: 'Quick thought after seeing your Series D announcement' },
      { heading: 'Body', body: `Hi [First name],\n\nSaw the announcement on the Series D — congrats. The "GTM platform consolidation" line in the press release jumped out — that's the exact problem we help RevOps teams solve at HG.\n\nQuick question: is the consolidation play primarily about data quality (firmographics + intent in one place) or workflow (one ICP scoring layer feeding both Marketing and Sales)?\n\nHappy to send a 5-minute Loom showing how teams like Snowflake's RevOps org tackled this, no slides. Worth a look?\n\n— ${target.split(' ')[0]}` },
    ],
  }),
  competitive_battlecard: (target) => ({
    kind: 'BATTLECARD',
    title: `Battlecard — ${target}`,
    meta: '4 sections',
    sections: [
      { heading: 'Their strengths', body: 'Brand recognition · large sales team · strong incumbent in mid-market.' },
      { heading: 'Their weaknesses', body: 'Pricing opacity · slow product velocity · weak technographic depth.' },
      { heading: 'Common objections', body: '"We already pay for X" → consolidation savings angle. "Switching cost" → 2-week white-glove migration.' },
    ],
  }),
  renewal_readiness: (target) => ({
    kind: 'READINESS',
    title: `Renewal Readiness — ${target}`,
    meta: 'Score 78 / 100',
    sections: [
      { heading: 'Health', body: 'Vitally health 72 (up 8pts QoQ). NPS 9 (last survey).' },
      { heading: 'Usage trend', body: '12-week usage up 14% — Sales Copilot adoption finally landed.' },
      { heading: 'Recommended action', body: 'Initiate expansion conversation in next 14 days. Estimated +$80K seat add.' },
    ],
  }),
  value_hypothesis: (target) => ({
    kind: 'VALUE',
    title: `Value Hypothesis — ${target}`,
    meta: '3 pillars',
    sections: [
      { heading: 'Consolidation', body: 'Replace ZoomInfo + 6sense with HG → est. $180K savings annually.' },
      { heading: 'Scoring lift', body: '+22% precision improvement vs current ICP model based on similar customers.' },
      { heading: 'Time-to-pipeline', body: 'Avg 38 days from signature to first qualified pipeline (HG benchmark).' },
    ],
  }),
};

function buildArtifact({ agentId, playbookId, target }) {
  // Playbook-level artifact — use the playbook handle if we have a fixture,
  // otherwise fall back to the LAST step's agent fixture.
  // BRIEF_V2: account-brief-flow now produces the rich MEDDIC brief that the
  // AgentRunTurn renders via LiveAccountBriefV2 (not the basic sections preview).
  if (playbookId === 'account-brief-flow') {
    return {
      kind: 'BRIEF_V2',
      title: `Account Brief — ${target}`,
      meta: '8 agents · MEDDIC framework',
      target,
    };
  }
  if (playbookId === 'opportunity-finder-flow') {
    return {
      kind: 'OPPORTUNITY_LIST',
      title: `Top 20 Opportunities — ${target}`,
      meta: '5 agents · ranked by Fit × Intent × Competitor',
      target,
    };
  }
  if (playbookId === 'renewal-readiness-flow') return ARTIFACT_FIXTURES.renewal_readiness(target);
  if (playbookId === 'inbound-qual-workflow') return ARTIFACT_FIXTURES.email_draft(target);
  const fixture = ARTIFACT_FIXTURES[agentId];
  if (fixture) return fixture(target);
  return null;
}

function buildSteps({ agentId, playbookId, audience }) {
  if (playbookId) {
    const pb = findPlaybookById(playbookId);
    if (!pb || !pb.pipeline) return [];
    return pb.pipeline.map((node) => {
      const a = AGENTS[node.agent];
      if (!a) return null;
      const audOverrides = (pb.audiencePolicies || []).find((p) => p.key === audience)?.overrides || {};
      const capability = resolveCapability({
        agentId: node.agent,
        workflowPolicy: node.capability,
        audienceOverride: audOverrides[node.agent],
      });
      // Pull the agent's first simulated step as a representative summary of
      // its work inside the pipeline (single-agent step trace within a
      // multi-agent run is collapsed to one line for legibility).
      const primary = a.simulatedSteps?.[0] || { tool: `${node.agent}.run`, durationMs: 600 };
      return {
        agentId: node.agent,
        tool: primary.tool,
        detail: `${a.label} → ${primary.detail || 'completed'}`,
        durationMs: a.simulatedSteps?.reduce((s, x) => s + (x.durationMs || 400), 0) || 600,
        capability,
        status: 'pending',
      };
    }).filter(Boolean);
  }

  if (agentId) {
    const a = AGENTS[agentId];
    if (!a) return [];
    return (a.simulatedSteps || []).map((s) => ({
      agentId,
      tool: s.tool,
      detail: s.detail,
      durationMs: s.durationMs || 400,
      status: 'pending',
    }));
  }
  return [];
}

// Persona policy is the 5th layer (set by admins per-user, not per-Playbook).
// Currently we only support 'downgradeAct' which floors any 'act' capability
// at the policy's value (typically 'draft'). Applies to BOTH standalone
// agent invocations and Playbook runs.
function applyPersonaPolicy(capability, personaPolicy) {
  if (!personaPolicy) return capability;
  if (capability === 'act' && personaPolicy.downgradeAct) {
    return personaPolicy.downgradeAct;
  }
  return capability;
}

function pickRunCapability({ agentId, playbookId, runOverride, audience, personaPolicy }) {
  if (playbookId) {
    const pb = findPlaybookById(playbookId);
    if (!pb || !pb.pipeline?.length) return 'suggest';
    // Composed capability = highest tier among nodes (since some nodes can
    // only suggest, but the run as a whole reflects the most-elevated step).
    const audOverrides = (pb.audiencePolicies || []).find((p) => p.key === audience)?.overrides || {};
    const RANK = { suggest: 0, draft: 1, act: 2 };
    let highest = 'suggest';
    for (const node of pb.pipeline) {
      let cap = resolveCapability({
        agentId: node.agent,
        workflowPolicy: node.capability,
        audienceOverride: audOverrides[node.agent],
        runOverride,
      });
      cap = applyPersonaPolicy(cap, personaPolicy);
      if (RANK[cap] > RANK[highest]) highest = cap;
    }
    return highest;
  }
  if (agentId) {
    let cap = resolveCapability({ agentId, runOverride });
    return applyPersonaPolicy(cap, personaPolicy);
  }
  return 'suggest';
}

let runCounter = 2902;
function nextRunId() {
  runCounter += 1;
  return `run-${runCounter}`;
}

// Resolve a seller-typed handle like "@account_brief Acme Corp"
// Returns: { agentId | playbookId, target, raw }
export function parseAgentInvocation(text) {
  const trimmed = text.trim();
  const m = trimmed.match(/^@([a-z][a-z0-9_]*)\b\s*(.*)$/i);
  if (!m) return null;
  const handle = m[1].toLowerCase();
  const target = m[2].trim() || 'this account';

  // First check if it's an agentic playbook (composed)
  const playbook = findAgenticPlaybookByHandle(handle);
  if (playbook) {
    return { playbookId: playbook.id, agentId: null, target, handle, raw: trimmed };
  }
  // Otherwise a single atomic agent
  if (AGENTS[handle]) {
    return { playbookId: null, agentId: handle, target, handle, raw: trimmed };
  }
  return null;
}

// Build the initial agent turn (all steps pending). The runner then emits
// step updates over time.
export function buildAgentTurn({ agentId, playbookId, target, surface = 'thread', invokedBy, audience = 'all_ae', runOverride, personaPolicy }) {
  const steps = buildSteps({ agentId, playbookId, audience });
  const capability = pickRunCapability({ agentId, playbookId, runOverride, audience, personaPolicy });
  return {
    id: `agent-${Date.now()}`,
    role: 'agent',
    surface,
    agentId,
    playbookId,
    target,
    invokedBy,
    capability,
    runId: nextRunId(),
    steps,
    timestamp: 'Just now',
  };
}

// Generator-style runner. Returns an array of [delayMs, mutation] pairs.
// Caller setTimeouts each mutation; mutation receives current turns and
// returns next turns. This keeps the engine pure and React-agnostic.
export function planAgentRun(turn) {
  const updates = [];
  let cumulative = 250;
  // First: mark step 0 as running immediately
  updates.push([cumulative, (turns) => updateStep(turns, turn.id, 0, { status: 'running' })]);
  // Each step: complete after its duration, start the next
  turn.steps.forEach((step, i) => {
    cumulative += Math.min(step.durationMs || 600, 1400);
    updates.push([cumulative, (turns) => updateStep(turns, turn.id, i, { status: 'done' })]);
    if (i < turn.steps.length - 1) {
      updates.push([cumulative + 80, (turns) => updateStep(turns, turn.id, i + 1, { status: 'running' })]);
    }
  });
  // Final: attach summary + artifact
  cumulative += 200;
  updates.push([
    cumulative,
    (turns) => finalizeTurn(turns, turn.id, {
      summary: turn.playbookId
        ? `Pipeline complete — ${turn.steps.length} agents executed across ${(cumulative / 1000).toFixed(1)}s.`
        : null,
      artifact: buildArtifact({ agentId: turn.agentId, playbookId: turn.playbookId, target: turn.target }),
    }),
  ]);
  return updates;
}

function updateStep(turns, turnId, stepIndex, patch) {
  return turns.map((t) => {
    if (t.id !== turnId) return t;
    const nextSteps = t.steps.map((s, i) => (i === stepIndex ? { ...s, ...patch } : s));
    return { ...t, steps: nextSteps };
  });
}

function finalizeTurn(turns, turnId, patch) {
  return turns.map((t) => (t.id === turnId ? { ...t, ...patch } : t));
}

export function approveAgentTurn(turns, turnId, detail) {
  return turns.map((t) =>
    t.id === turnId ? { ...t, approved: true, approvedDetail: detail || 'sent via Outreach' } : t
  );
}

export function discardAgentTurn(turns, turnId) {
  return turns.filter((t) => t.id !== turnId);
}
