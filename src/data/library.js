import { THREADS } from './threads.js';
import { THREAD_ARTIFACTS, ARTIFACT_TYPES } from './artifacts.js';

// Aggregate all artifacts visible to a persona — owned threads + threads they
// participate in. The library treats artifacts as first-class persistent assets
// that accumulate across threads.

export function getSavedAssetsForPersona(personaId) {
  const items = [];
  for (const [threadId, artifacts] of Object.entries(THREAD_ARTIFACTS)) {
    const thread = THREADS[threadId];
    if (!thread) continue;
    const isOwner = thread.owner === personaId;
    const isParticipant = thread.participants?.includes(personaId);
    if (!isOwner && !isParticipant) continue;
    for (const a of artifacts) {
      items.push({
        ...a,
        threadId,
        threadName: thread.name,
        threadOwner: thread.owner,
        sharedWithMe: !isOwner,
      });
    }
  }
  // Sort newest-first by timestamp string heuristic (April 25 > April 22 > ...)
  return items.sort((a, b) => {
    const ax = parseDateLoose(a.timestamp);
    const bx = parseDateLoose(b.timestamp);
    return bx - ax;
  });
}

// Loose date parser — month name + day. Works for our prototype timestamp strings.
function parseDateLoose(s) {
  if (!s) return 0;
  if (/today/i.test(s)) return 1e12;
  const m = /([A-Za-z]+)\s+(\d{1,2})/.exec(s);
  if (!m) return 0;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthIdx = months.findIndex((mn) => mn.toLowerCase().startsWith(m[1].slice(0, 3).toLowerCase()));
  if (monthIdx < 0) return 0;
  return new Date(2026, monthIdx, parseInt(m[2], 10)).getTime();
}

export function groupByType(items) {
  const groups = {};
  for (const item of items) {
    const type = item.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(item);
  }
  return groups;
}

export const TYPE_DESCRIPTIONS = {
  LIST: 'Account lists, target lists, action queues',
  SEGMENT: 'ICP segments, market segments, scored cohorts',
  BRIEF: 'Account briefs, pre-call briefs, stakeholder maps',
  DRAFT: 'Email drafts, sequences, follow-ups',
  ANALYSIS: 'TAM analyses, drift investigations, comparisons',
  DECISION: 'Logged decisions and approvals',
  REPORT: 'Health reports, validation reports, performance summaries',
  LIVE_VIEW: 'Pinned snapshots of live interactive views',
};

export const TYPE_ORDER = ['LIST', 'SEGMENT', 'BRIEF', 'DRAFT', 'LIVE_VIEW', 'ANALYSIS', 'REPORT', 'DECISION'];

export { ARTIFACT_TYPES };
