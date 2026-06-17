// Lookalike similarity — find HG-universe whitespace accounts that resemble a
// given book account.
//
// The score is a weighted match across six dimensions:
//   - Industry match              (40 pts)
//   - Cloud profile overlap       (15 pts)
//   - Tech stack install overlap  (15 pts)
//   - Size band match (revenue)   (10 pts)
//   - Intent topic overlap        (10 pts)
//   - Best-offering fit alignment (10 pts)
//
// Total 100. We return the score plus a per-dimension breakdown the UI uses to
// label *why* each lookalike matched.

import { WHITESPACE_ACCOUNTS } from './whitespaceAccounts.js';
import { getRGIF } from './workbookRGIF.js';
import { getAllFitFor } from './accountOfferingFit.js';

const WEIGHTS = {
  industry: 40,
  cloud: 15,
  stack: 15,
  size: 10,
  intent: 10,
  offering: 10,
};

// Parse a revenue string like "$162.4B" / "$3.4B" / "$680M" into millions.
function revenueMillions(revStr) {
  if (!revStr) return null;
  const m = String(revStr).match(/\$?([0-9.]+)\s*([KMB]?)/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (Number.isNaN(n)) return null;
  const unit = (m[2] || '').toUpperCase();
  if (unit === 'B') return n * 1000;
  if (unit === 'K') return n / 1000;
  return n; // M default
}

// "Banking" / "Software" etc. — coarse vertical grouping for industry match.
function verticalOf(industry) {
  if (!industry) return null;
  const i = industry.toLowerCase();
  if (i.includes('bank') || i.includes('financial') || i.includes('fintech') || i.includes('insur')) return 'finserv';
  if (i.includes('software') || i.includes('saas') || i.includes('technology')) return 'software';
  if (i.includes('healthcare') || i.includes('pharma')) return 'healthcare';
  if (i.includes('manufact') || i.includes('automotive') || i.includes('aerospace')) return 'manufacturing';
  if (i.includes('retail') || i.includes('e-commerce') || i.includes('consumer')) return 'retail';
  if (i.includes('media') || i.includes('entertainment')) return 'media';
  if (i.includes('crypto')) return 'finserv';
  return i.split(' ')[0];
}

// Best-offering id (highest fit) for an account
function bestOffering(accountId) {
  const all = getAllFitFor(accountId);
  let best = null;
  for (const [oid, fit] of Object.entries(all)) {
    if (!best || (fit.score ?? 0) > (best.score ?? 0)) best = { id: oid, score: fit.score };
  }
  return best;
}

function setIntersection(a, b) {
  const sa = new Set(a || []);
  let n = 0;
  for (const x of b || []) if (sa.has(x)) n += 1;
  return n;
}

// Get the set of installed product keys (excluding non-present) for a given RGIF blob.
function installedProducts(rgif) {
  if (!rgif?.installs) return [];
  return Object.entries(rgif.installs).filter(([, v]) => v?.present).map(([k]) => k);
}

// Compute lookalike score between source account and candidate.
// Returns { score, breakdown: [{dim, points, label}], reasons: [string] }.
export function lookalikeScore(source, candidate) {
  const sourceRgif = getRGIF(source.id);
  const candRgif = getRGIF(candidate.id);
  if (!sourceRgif || !candRgif) return { score: 0, breakdown: [], reasons: [] };

  const breakdown = [];
  const reasons = [];
  let total = 0;

  // Industry / vertical
  const srcVert = verticalOf(source.industry);
  const candVert = verticalOf(candidate.industry);
  if (srcVert && candVert && srcVert === candVert) {
    total += WEIGHTS.industry;
    breakdown.push({ dim: 'industry', points: WEIGHTS.industry, label: `Same vertical (${srcVert})` });
    reasons.push(`Same vertical: ${srcVert}`);
  } else {
    breakdown.push({ dim: 'industry', points: 0, label: `Different vertical (${candVert || 'unknown'})` });
  }

  // Cloud profile overlap
  const srcClouds = sourceRgif.clouds || [];
  const candClouds = candRgif.clouds || [];
  const cloudOverlap = setIntersection(srcClouds, candClouds);
  const cloudUnion = new Set([...srcClouds, ...candClouds]).size || 1;
  const cloudPts = Math.round((cloudOverlap / cloudUnion) * WEIGHTS.cloud);
  total += cloudPts;
  breakdown.push({ dim: 'cloud', points: cloudPts, label: `${cloudOverlap}/${cloudUnion} clouds in common` });
  if (cloudOverlap >= 2) reasons.push(`Multi-cloud overlap: ${[...new Set([...srcClouds].filter((c) => candClouds.includes(c)))].join(' + ')}`);

  // Tech stack overlap
  const srcStack = installedProducts(sourceRgif);
  const candStack = installedProducts(candRgif);
  const stackOverlap = setIntersection(srcStack, candStack);
  const stackUnion = new Set([...srcStack, ...candStack]).size || 1;
  const stackPts = Math.round((stackOverlap / stackUnion) * WEIGHTS.stack);
  total += stackPts;
  breakdown.push({ dim: 'stack', points: stackPts, label: `${stackOverlap}/${stackUnion} installs in common` });
  if (stackOverlap >= 4) reasons.push(`Tech stack overlap: ${stackOverlap} shared installs`);

  // Size band — within 0.5x to 2x revenue
  const srcRev = revenueMillions(source.fai?.revenue);
  const candRev = revenueMillions(candidate.fai?.revenue);
  if (srcRev && candRev) {
    const ratio = srcRev > candRev ? srcRev / candRev : candRev / srcRev;
    let sizePts = 0;
    let sizeLabel = '';
    if (ratio <= 1.5) {
      sizePts = WEIGHTS.size;
      sizeLabel = `Similar revenue band ($${candRev >= 1000 ? (candRev / 1000).toFixed(1) + 'B' : candRev + 'M'})`;
      reasons.push(`Similar size`);
    } else if (ratio <= 3) {
      sizePts = Math.round(WEIGHTS.size * 0.5);
      sizeLabel = 'Adjacent size band';
    } else {
      sizeLabel = 'Different size band';
    }
    total += sizePts;
    breakdown.push({ dim: 'size', points: sizePts, label: sizeLabel });
  }

  // Intent topic overlap (with rough keyword normalization)
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  const srcIntent = (sourceRgif.intent || []).map(norm);
  const candIntent = (candRgif.intent || []).map(norm);
  const intentOverlap = setIntersection(srcIntent, candIntent);
  const intentPts = Math.min(intentOverlap * 3, WEIGHTS.intent);
  total += intentPts;
  breakdown.push({ dim: 'intent', points: intentPts, label: `${intentOverlap} shared intent topics` });
  if (intentOverlap >= 2) reasons.push(`Shared intent: ${intentOverlap} topics`);

  // Best-offering alignment
  const srcBest = bestOffering(source.id);
  const candBest = bestOffering(candidate.id);
  let offeringPts = 0;
  let offeringLabel = '';
  if (srcBest && candBest && srcBest.id === candBest.id) {
    offeringPts = WEIGHTS.offering;
    offeringLabel = `Same best-fit offering (${srcBest.id})`;
    reasons.push(`Same best-fit: ${srcBest.id.toUpperCase()}`);
  } else if (srcBest && candBest) {
    offeringLabel = `Different best-fit (src: ${srcBest.id}, cand: ${candBest.id})`;
  }
  total += offeringPts;
  breakdown.push({ dim: 'offering', points: offeringPts, label: offeringLabel });

  return { score: total, breakdown, reasons };
}

// Find top-N lookalikes for a source account from the whitespace pool.
export function findLookalikes(sourceAccount, { limit = 12, minScore = 35 } = {}) {
  if (!sourceAccount) return [];
  const candidates = WHITESPACE_ACCOUNTS;
  const scored = candidates
    .map((cand) => {
      const result = lookalikeScore(sourceAccount, cand);
      return { account: cand, ...result };
    })
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored;
}
