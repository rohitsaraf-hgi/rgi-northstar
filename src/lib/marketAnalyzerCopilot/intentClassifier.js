// Keyword-based intent classifier for the Market Analyzer Copilot prototype.
//
// Maps free-text user input to a JTBD id (1, 5 or 7 today). Production
// would swap this for an LLM classification call — same signature.
//
//   classifyIntent('I want to size the market for CNAPP') → 1
//   classifyIntent('show me whitespace in fintech')        → 5
//   classifyIntent('how do I displace Gong')               → 7
//   classifyIntent('what time is it?')                     → null
//
// Tie-breaker: highest sum of matched phrase lengths wins. Long phrases
// like "competitor's install base" outrank short generic ones like "go after".

import { JTBDS } from '../../data/marketAnalyzerCopilot/jtbds.js';

export function classifyIntent(text) {
  if (!text || typeof text !== 'string') return null;
  const normalized = text.toLowerCase().trim();
  if (!normalized) return null;

  let best = { jtbd: null, score: 0 };
  for (const jtbd of JTBDS) {
    let score = 0;
    for (const phrase of jtbd.triggerPhrases) {
      if (normalized.includes(phrase.toLowerCase())) {
        score += phrase.length;
      }
    }
    if (score > best.score) {
      best = { jtbd: jtbd.id, score };
    }
  }
  return best.jtbd;
}

// Extract entities mentioned in the user message that may pre-populate
// parameters. Today we only spot competitor names for JTBD 7 — but the
// shape is here so the LLM swap-in stays additive.
export function extractEntities(text) {
  if (!text || typeof text !== 'string') return {};
  const normalized = text.toLowerCase();
  const entities = {};

  const competitors = ['Gong', 'Clari', 'Chorus', 'Outreach'];
  for (const c of competitors) {
    if (normalized.includes(c.toLowerCase())) {
      entities.competitor = c;
      break;
    }
  }
  return entities;
}
