// Seller home filter state — offering lens + signal selection.
//
// Per-persona persistence in localStorage. We expose a tiny custom-event
// channel so other tabs / surfaces can react if needed.

const STORAGE_KEY_PREFIX = 'rgi-seller-home-filter-';
const CHANGE_EVENT = 'rgi:seller-home-filter-changed';

function keyFor(personaId) {
  return `${STORAGE_KEY_PREFIX}${personaId}`;
}

const DEFAULT = {
  offeringId: 'all',
  signalKinds: [], // empty array = "all signals"
};

export function readFilterState(personaId) {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = window.localStorage.getItem(keyFor(personaId));
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      offeringId: parsed.offeringId || 'all',
      signalKinds: Array.isArray(parsed.signalKinds) ? parsed.signalKinds : [],
    };
  } catch {
    return DEFAULT;
  }
}

export function writeFilterState(personaId, state) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(keyFor(personaId), JSON.stringify(state));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore quota
  }
}

export function subscribeFilterState(onChange) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

// ----- Signal kinds the filter bar exposes -----
//
// These are coarse signal "themes" (not literal signal IDs) so the bar fits
// 5-7 chips. Each one maps to a predicate over account.signals[].headline.

export const SIGNAL_KINDS = [
  {
    id: 'new_champion',
    label: 'New CISO / champion',
    matches: (s) => /CISO|champion|joined|hire/i.test(s.headline || ''),
  },
  {
    id: 'active_rfp',
    label: 'Active RFP / RFI',
    matches: (s) => /RFP|RFI|evaluation|surge/i.test(s.headline || '') || s.type === 'intent_surge',
  },
  {
    id: 'competitor_displacement',
    label: 'Competitor displacement',
    matches: (s) => /Orca|Splunk|Palo Alto|Lacework|competitor|expiring|contract/i.test((s.headline || '') + ' ' + (s.detail || '')),
  },
  {
    id: 'engaged_reply',
    label: 'Engaged · replied',
    matches: (s) => /replied|reply|responded|engaged/i.test(s.headline || ''),
  },
  {
    id: 'web_visit',
    label: 'Web / product visits',
    matches: (s) => /page visit|product page|web|download|paper/i.test(s.headline || '') || s.type === 'web_event',
  },
  {
    id: 'stale_no_touch',
    label: 'Stale — no touch',
    matches: () => false, // computed against account.lastTouchDaysAgo not signals
  },
];

export const SIGNAL_KIND_BY_ID = Object.fromEntries(SIGNAL_KINDS.map((k) => [k.id, k]));

// Apply current filter to an account → boolean (should show?).
// Returns { show, matchedKinds } so the card can label why it matched.
export function evaluateAccountAgainstFilter(account, filter, offeringFit) {
  const result = { show: true, matchedKinds: [] };

  // Offering filter: when not 'all', require a non-trivial fit score for that offering.
  if (filter.offeringId && filter.offeringId !== 'all') {
    const score = offeringFit?.score ?? 0;
    if (score < 50) {
      result.show = false;
      return result;
    }
  }

  // Signal kind filter: if any kinds selected, account must match at least one.
  if (filter.signalKinds.length > 0) {
    const matched = [];
    const signals = account.signals || [];
    for (const kindId of filter.signalKinds) {
      const kind = SIGNAL_KIND_BY_ID[kindId];
      if (!kind) continue;
      if (kindId === 'stale_no_touch') {
        const days = account.lastTouchDaysAgo;
        if (days == null || days > 14) matched.push(kindId);
      } else {
        if (signals.some(kind.matches)) matched.push(kindId);
      }
    }
    if (matched.length === 0) {
      result.show = false;
      return result;
    }
    result.matchedKinds = matched;
  }

  return result;
}

// Compute counts of accounts matching each signal kind for the chip badges.
export function computeSignalKindCounts(accounts, filter, fitGetter) {
  const counts = {};
  for (const kind of SIGNAL_KINDS) {
    counts[kind.id] = 0;
  }
  for (const account of accounts) {
    // Apply offering filter independently of signal filter for the count
    const fit = fitGetter(account.id);
    if (filter.offeringId !== 'all' && (fit?.score ?? 0) < 50) continue;
    for (const kind of SIGNAL_KINDS) {
      if (kind.id === 'stale_no_touch') {
        const days = account.lastTouchDaysAgo;
        if (days == null || days > 14) counts[kind.id] += 1;
      } else if ((account.signals || []).some(kind.matches)) {
        counts[kind.id] += 1;
      }
    }
  }
  return counts;
}
