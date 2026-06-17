// Runtime-created threads from the activation modal.
// Pragmatic mutable map for prototype — no persistence beyond page reload.

import { USE_CASES } from './useCases.js';
import { WELCOME_TURNS, INITIAL_RAIL_STATE } from './tamSamSomScript.js';

const runtimeThreads = new Map();
const runtimeConversations = new Map();
const runtimeRailState = new Map();

export function createRuntimeThread({ useCaseId, name, configValue, ownerPersonaId, autoInvoke, seededConversation }) {
  const useCase = USE_CASES.find((u) => u.id === useCaseId);
  if (!useCase) return null;

  const id = `new-${useCaseId}-${Date.now().toString(36)}`;

  const threadType =
    useCase.category === 'FIND_MARKET'
      ? 'campaign'
      : useCase.category === 'SCORE_PRIORITIZE'
      ? 'model'
      : 'campaign';

  // TAM/SAM/SOM threads are adaptive — they get a tailored welcome conversation
  // and an adaptive right rail seeded with the global TAM default.
  const isAdaptiveTamSamSom = useCaseId === 'tam-sam-som';

  const thread = {
    id,
    name,
    type: threadType,
    persona: ownerPersonaId,
    status: 'ACTIVE',
    stage: 'DEFINE',
    useCase: useCase.name,
    useCaseId,
    accounts: [configValue || 'Pending configuration'],
    owner: ownerPersonaId,
    participants: [ownerPersonaId],
    createdAt: 'Just now',
    lastActivity: 'Just now',
    artifactCount: 0,
    sidebarStatus: 'active',
    summary: useCase.outcome,
    isRuntime: true,
    adaptive: isAdaptiveTamSamSom,
    autoInvoke: autoInvoke || null,
  };

  const conversation = seededConversation
    ? seededConversation
    : isAdaptiveTamSamSom
    ? WELCOME_TURNS.map((t) => ({ ...t }))
    : [
        {
          id: 't0',
          role: 'ai',
          timestamp: 'Just now',
          content:
            `Activated "${useCase.name}". I'll guide you through the Define stage first — we'll set up the data scope, success criteria, and any constraints.\n\n` +
            `Configuration so far: ${configValue || '(none)'}\n\n` +
            `To kick off, tell me — what's the primary outcome you want from this thread? Are we building toward a one-time analysis, a recurring report, or an action-ready list?`,
        },
      ];

  runtimeThreads.set(id, thread);
  runtimeConversations.set(id, conversation);
  if (isAdaptiveTamSamSom) {
    runtimeRailState.set(id, { ...INITIAL_RAIL_STATE });
  }
  return id;
}

export function getRuntimeThread(id) {
  return runtimeThreads.get(id) || null;
}

export function getRuntimeConversation(id) {
  return runtimeConversations.get(id) || null;
}

export function getRuntimeRailState(id) {
  return runtimeRailState.get(id) || null;
}

export function setRuntimeRailState(id, state) {
  runtimeRailState.set(id, state);
}
