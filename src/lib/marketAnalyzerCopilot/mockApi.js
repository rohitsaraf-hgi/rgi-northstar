// Mock API for the Market Analyzer Copilot prototype.
//
// Section 8 of the spec: "Every 'API call' returns a promise that
// resolves after 600-1200ms to simulate latency. The API trace panel
// shows each call as it fires."
//
// runAnalysis(jtbdId, params, onTrace) walks the JTBD's apiCallChain
// sequentially:
//   - emits a trace event {status: 'started'} when each call fires
//   - waits mockDelay ms
//   - emits {status: 'completed'} with the mock result
//   - emits {status: 'finished'} after the last call
// then resolves with the rendered Insight Card (params interpolated).
//
// onTrace is optional; the trace panel passes a sink to receive events
// live. If you pass null, the function still simulates latency but
// produces no trace.

import { getJtbd } from '../../data/marketAnalyzerCopilot/jtbds.js';

let traceSeq = 0;
function nextTraceId() {
  traceSeq += 1;
  return `trace-${traceSeq}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Resolve {placeholders} in a string against params. Multi-select values
// render as a human-readable list ("Gong, Clari & Chorus"). Missing keys
// stay as the bare placeholder so engineers spot misconfigured fixtures
// in dev.
export function interpolate(str, params) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params?.[key];
    if (value == null) return match;
    if (Array.isArray(value)) {
      if (value.length === 0) return match;
      if (value.length === 1) return String(value[0]);
      if (value.length === 2) return `${value[0]} & ${value[1]}`;
      return `${value.slice(0, -1).join(', ')} & ${value[value.length - 1]}`;
    }
    return String(value);
  });
}

// Deeply walk the card and interpolate every string against params.
// Arrays + plain objects are recursed; other types are returned as-is.
// This means new fixture sections (tiers' messaging, spend trend titles,
// lock-in detail, …) work without touching this function.
function deepInterpolate(value, params) {
  if (typeof value === 'string') return interpolate(value, params);
  if (Array.isArray(value)) return value.map((v) => deepInterpolate(v, params));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = deepInterpolate(v, params);
    return out;
  }
  return value;
}

function renderInsightCard(card, params) {
  return deepInterpolate(card, params);
}

export async function runAnalysis(jtbdId, params, onTrace) {
  const jtbd = getJtbd(jtbdId);
  if (!jtbd) throw new Error(`Unknown JTBD id: ${jtbdId}`);

  for (const call of jtbd.apiCallChain) {
    const traceId = nextTraceId();
    const startedAt = new Date().toISOString();
    onTrace?.({
      id: traceId,
      jtbdId,
      tool: call.tool,
      source: call.source,
      purpose: call.purpose,
      params,
      status: 'started',
      startedAt,
    });
    await sleep(call.mockDelay);
    onTrace?.({
      id: traceId,
      jtbdId,
      tool: call.tool,
      source: call.source,
      purpose: call.purpose,
      params,
      status: 'completed',
      startedAt,
      finishedAt: new Date().toISOString(),
      mockResult: call.mockResult,
    });
  }

  return {
    jtbdId,
    params,
    card: renderInsightCard(jtbd.insightCard, params),
    soWhat: jtbd.soWhat,
    followUps: jtbd.followUps,
    generatedAt: new Date().toISOString(),
  };
}
