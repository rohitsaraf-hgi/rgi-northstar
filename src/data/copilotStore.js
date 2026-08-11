// Copilot conversation store — per-persona localStorage.
//
// Persists turns across page reloads so the copilot panel restores its
// history on open. Subscribe/notify pattern for cross-component sync.

const STORAGE_KEY = 'rgi-copilot-turns';
const PANEL_OPEN_KEY = 'rgi-copilot-panel-open';

const subscribers = new Set();

function notify() {
  for (const cb of subscribers) {
    try { cb(); } catch { /* isolate subscriber errors */ }
  }
}

// Read all turns for a persona.
export function listTurns(personaId) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY}-${personaId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Append a turn to the persona's history.
export function addTurn(personaId, turn) {
  if (typeof window === 'undefined') return;
  const next = [...listTurns(personaId), turn];
  window.localStorage.setItem(`${STORAGE_KEY}-${personaId}`, JSON.stringify(next));
  notify();
}

// Wipe the persona's history.
export function clearHistory(personaId) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(`${STORAGE_KEY}-${personaId}`);
  notify();
}

export function subscribeCopilotStore(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

// ─── Panel open state (per-persona, persistent) ──────────────────────
export function isPanelOpen(personaId) {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(`${PANEL_OPEN_KEY}-${personaId}`) === '1';
}

export function setPanelOpen(personaId, open) {
  if (typeof window === 'undefined') return;
  if (open) {
    window.localStorage.setItem(`${PANEL_OPEN_KEY}-${personaId}`, '1');
  } else {
    window.localStorage.removeItem(`${PANEL_OPEN_KEY}-${personaId}`);
  }
  notify();
}

// Turn factory — canonical shape so consumers don't drift.
export function makeUserTurn(query) {
  return {
    id: `u-${Date.now()}-${Math.floor(performance.now() % 10000)}`,
    role: 'user',
    query,
    timestamp: new Date().toISOString(),
  };
}

export function makeCopilotTurn(response) {
  return {
    id: `c-${Date.now()}-${Math.floor(performance.now() % 10000)}`,
    role: 'copilot',
    response,
    timestamp: new Date().toISOString(),
  };
}
