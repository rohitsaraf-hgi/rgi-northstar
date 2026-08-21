// Market Report engine — takes a set of scoring profile ids, computes a
// structured market analysis snapshot with per-play breakdowns + cross-play
// synthesis (overlap, comparison matrix, recommendations, coverage gaps).
//
// Compute happens on the fly (per JTBD spec answer #2). Report snapshots
// captured to storage are frozen at generation time; refresh recomputes.

import { getScoringProfile, listScoringProfiles } from './marketAnalyzer.js';

// ─── Per-profile seed data ──────────────────────────────────────────
// Each MA scoring profile carries its own market distribution shape:
// total universe size, tier distribution, industry mix, size bands,
// geo mix, and top A-tier accounts.
//
// In production these come from the scoring engine's materialized
// distribution stats (matching the image the user shared: A/B/C/D/F
// counts + composite score histogram).
const PROFILE_DIST = {
  'sp-cnapp-readiness': {
    universeSize: 44_269_712,
    tiers: [
      { id: 'A', count: 2_184,      spend: 58_400_000_000,  avgScore: 82 },
      { id: 'B', count: 22_152,     spend: 91_300_000_000,  avgScore: 68 },
      { id: 'C', count: 76_116,     spend: 47_100_000_000,  avgScore: 47 },
      { id: 'D', count: 216_016,    spend: 22_400_000_000,  avgScore: 24 },
      { id: 'F', count: 24_378_232, spend: 8_100_000_000,   avgScore: 6  },
    ],
    industries: [
      { name: 'Banking and Financial Services', count: 512, spend: 18_400_000_000 },
      { name: 'Computer and Electronic Products', count: 340, spend: 15_200_000_000 },
      { name: 'Insurance', count: 288, spend: 9_700_000_000 },
      { name: 'Retail Trade', count: 210, spend: 6_800_000_000 },
      { name: 'Manufacturing', count: 190, spend: 4_900_000_000 },
      { name: 'Healthcare', count: 156, spend: 2_400_000_000 },
    ],
    sizes: [
      { band: '10,000 and above',    count: 775,    spend: 30_700_000_000 },
      { band: '5,000 to 9,999',      count: 620,    spend: 7_340_000_000 },
      { band: '1,000 to 4,999',      count: 789,    spend: 9_410_000_000 },
    ],
    geos: [
      { country: 'United States',              count: 1_240, spend: 42_100_000_000 },
      { country: 'United Kingdom',             count: 296,   spend: 6_100_000_000 },
      { country: 'Germany',                    count: 168,   spend: 3_400_000_000 },
      { country: 'France',                     count: 122,   spend: 2_300_000_000 },
      { country: 'India',                      count: 96,    spend: 1_800_000_000 },
    ],
    topAccounts: ['Microsoft', 'Oracle', 'Adobe', 'AT&T', 'Netflix', 'Vodafone', 'AMD', 'JPMorgan Chase'],
  },
  'sp-displacement-fit': {
    universeSize: 22_600_000,
    tiers: [
      { id: 'A', count: 1_640,      spend: 41_800_000_000,  avgScore: 79 },
      { id: 'B', count: 14_800,     spend: 68_500_000_000,  avgScore: 66 },
      { id: 'C', count: 52_100,     spend: 34_200_000_000,  avgScore: 45 },
      { id: 'D', count: 168_400,    spend: 15_100_000_000,  avgScore: 22 },
      { id: 'F', count: 22_364_060, spend: 6_400_000_000,   avgScore: 5  },
    ],
    industries: [
      { name: 'Insurance',                     count: 380, spend: 14_100_000_000 },
      { name: 'Banking and Financial Services', count: 320, spend: 11_800_000_000 },
      { name: 'Retail Trade',                  count: 245, spend: 6_400_000_000 },
      { name: 'Manufacturing',                 count: 210, spend: 4_900_000_000 },
      { name: 'Wholesale Trade',               count: 145, spend: 2_700_000_000 },
    ],
    sizes: [
      { band: '10,000 and above',    count: 520,  spend: 23_400_000_000 },
      { band: '5,000 to 9,999',      count: 420,  spend: 8_100_000_000 },
      { band: '1,000 to 4,999',      count: 700,  spend: 7_200_000_000 },
    ],
    geos: [
      { country: 'United States',              count: 920,   spend: 30_800_000_000 },
      { country: 'United Kingdom',             count: 220,   spend: 4_600_000_000 },
      { country: 'Canada',                     count: 138,   spend: 2_100_000_000 },
      { country: 'Australia',                  count: 106,   spend: 1_400_000_000 },
    ],
    topAccounts: ['Comcast', 'Wells Fargo', 'Bank of America', 'Allstate', 'Progressive', 'CVS Health', 'Kroger'],
  },
  'sp-ai-readiness': {
    universeSize: 8_400_000,
    tiers: [
      { id: 'A', count: 940,       spend: 18_900_000_000,  avgScore: 86 },
      { id: 'B', count: 8_120,     spend: 34_600_000_000,  avgScore: 71 },
      { id: 'C', count: 31_200,    spend: 21_100_000_000,  avgScore: 48 },
      { id: 'D', count: 92_400,    spend: 8_800_000_000,   avgScore: 25 },
      { id: 'F', count: 8_267_340, spend: 4_200_000_000,   avgScore: 6  },
    ],
    industries: [
      { name: 'Computer and Electronic Products', count: 380, spend: 12_100_000_000 },
      { name: 'Information Technology',           count: 240, spend: 4_400_000_000 },
      { name: 'Banking and Financial Services',   count: 155, spend: 1_900_000_000 },
      { name: 'Healthcare',                       count: 88,  spend: 400_000_000 },
    ],
    sizes: [
      { band: '10,000 and above',    count: 320,  spend: 13_200_000_000 },
      { band: '5,000 to 9,999',      count: 240,  spend: 3_400_000_000 },
      { band: '1,000 to 4,999',      count: 380,  spend: 2_300_000_000 },
    ],
    geos: [
      { country: 'United States',              count: 620,   spend: 15_400_000_000 },
      { country: 'United Kingdom',             count: 92,    spend: 1_400_000_000 },
      { country: 'Germany',                    count: 88,    spend: 1_100_000_000 },
      { country: 'Japan',                      count: 74,    spend: 800_000_000 },
    ],
    topAccounts: ['Microsoft', 'NVIDIA', 'Google', 'Meta', 'Databricks', 'OpenAI', 'Anthropic', 'Palantir'],
  },
  'sp-budget-fit': {
    universeSize: 44_300_000,
    tiers: [
      { id: 'A', count: 3_100,      spend: 44_200_000_000,  avgScore: 76 },
      { id: 'B', count: 28_400,     spend: 82_100_000_000,  avgScore: 63 },
      { id: 'C', count: 96_800,     spend: 39_700_000_000,  avgScore: 44 },
      { id: 'D', count: 240_100,    spend: 17_800_000_000,  avgScore: 21 },
      { id: 'F', count: 23_931_600, spend: 7_100_000_000,   avgScore: 4  },
    ],
    industries: [
      { name: 'Banking and Financial Services', count: 640, spend: 14_100_000_000 },
      { name: 'Manufacturing',                 count: 480, spend: 9_800_000_000 },
      { name: 'Retail Trade',                  count: 410, spend: 7_100_000_000 },
      { name: 'Healthcare',                    count: 360, spend: 5_400_000_000 },
      { name: 'Wholesale Trade',               count: 280, spend: 3_400_000_000 },
      { name: 'Insurance',                     count: 240, spend: 3_100_000_000 },
    ],
    sizes: [
      { band: '10,000 and above',    count: 990,  spend: 22_400_000_000 },
      { band: '5,000 to 9,999',      count: 820,  spend: 9_800_000_000 },
      { band: '1,000 to 4,999',      count: 1_290, spend: 11_100_000_000 },
    ],
    geos: [
      { country: 'United States',              count: 1_890, spend: 32_400_000_000 },
      { country: 'United Kingdom',             count: 380,   spend: 4_200_000_000 },
      { country: 'Canada',                     count: 280,   spend: 2_800_000_000 },
      { country: 'Australia',                  count: 210,   spend: 1_800_000_000 },
      { country: 'Germany',                    count: 190,   spend: 1_700_000_000 },
    ],
    topAccounts: ['Walmart', 'Amazon', 'Verizon', 'AT&T', 'Ford', 'GM', 'Target', 'Home Depot'],
  },
};

// Fallback for system-default profiles or any profile without seeded data.
function synthesizeFallbackDist(profileId) {
  // Deterministic hash so the same profile always produces the same numbers.
  let h = 0;
  for (const c of profileId) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  const base = Math.abs(h);
  const universe = 8_000_000 + (base % 20_000_000);
  const aCount = 900 + (base % 2_600);
  return {
    universeSize: universe,
    tiers: [
      { id: 'A', count: aCount,           spend: aCount * 22_000_000, avgScore: 78 },
      { id: 'B', count: aCount * 9,       spend: aCount * 90_000_000, avgScore: 66 },
      { id: 'C', count: aCount * 30,      spend: aCount * 45_000_000, avgScore: 46 },
      { id: 'D', count: aCount * 80,      spend: aCount * 18_000_000, avgScore: 23 },
      { id: 'F', count: universe - aCount * 120, spend: aCount * 4_000_000,  avgScore: 5  },
    ],
    industries: [
      { name: 'Banking and Financial Services', count: 240, spend: 6_800_000_000 },
      { name: 'Manufacturing',                 count: 190, spend: 4_100_000_000 },
      { name: 'Retail Trade',                  count: 155, spend: 3_400_000_000 },
      { name: 'Healthcare',                    count: 120, spend: 2_400_000_000 },
    ],
    sizes: [
      { band: '10,000 and above',    count: 320, spend: 12_400_000_000 },
      { band: '5,000 to 9,999',      count: 280, spend: 4_200_000_000 },
      { band: '1,000 to 4,999',      count: 480, spend: 3_800_000_000 },
    ],
    geos: [
      { country: 'United States',              count: 720, spend: 15_400_000_000 },
      { country: 'United Kingdom',             count: 140, spend: 2_100_000_000 },
    ],
    topAccounts: ['Acme Corp', 'BetaCo', 'GammaInc', 'DeltaLtd', 'EpsilonInc'],
  };
}

function distFor(profileId) {
  return PROFILE_DIST[profileId] || synthesizeFallbackDist(profileId);
}

// ─── Formatting helpers ─────────────────────────────────────────────
export function formatSpend(usd) {
  if (usd == null) return '—';
  const n = Number(usd);
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

export function formatCount(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Compute functions ──────────────────────────────────────────────
function buildPlaySection(profile) {
  const dist = distFor(profile.id);
  const totalQualified = dist.tiers.filter((t) => ['A', 'B'].includes(t.id)).reduce((s, t) => s + t.count, 0);
  const totalQualifiedSpend = dist.tiers.filter((t) => ['A', 'B'].includes(t.id)).reduce((s, t) => s + t.spend, 0);
  const totalSpend = dist.tiers.reduce((s, t) => s + t.spend, 0);
  return {
    id: profile.id,
    name: profile.name,
    description: profile.description,
    dimensions: profile.dimensions || [],
    universeSize: dist.universeSize,
    totalSpend,
    totalQualified,
    totalQualifiedSpend,
    tierDistribution: dist.tiers.map((t) => ({
      ...t,
      pctOfUniverse: dist.universeSize ? (t.count / dist.universeSize) * 100 : 0,
      pctOfSpend: totalSpend ? (t.spend / totalSpend) * 100 : 0,
    })),
    industryMix: dist.industries.slice(0, 6),
    sizeDistribution: dist.sizes,
    geoDistribution: dist.geos,
    topAccounts: dist.topAccounts,
  };
}

// Cross-play overlap — synthesized deterministically per pair.
// In production this would be `count(distinct accounts in both A-tiers)`.
function computeOverlap(playA, playB) {
  // Hash the pair for a stable pseudo-random overlap ratio 15–55%.
  const seed = (playA.id + playB.id).split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const ratio = 0.15 + (Math.abs(seed) % 40) / 100;
  const minA = Math.min(playA.tierDistribution[0].count, playB.tierDistribution[0].count);
  return Math.round(minA * ratio);
}

function buildCrossPlay(playSections) {
  // Comparison matrix — each play's headline metrics
  const comparisonMatrix = playSections.map((p) => ({
    id: p.id,
    name: p.name,
    aCount:      p.tierDistribution[0].count,
    aSpend:      p.tierDistribution[0].spend,
    bCount:      p.tierDistribution[1].count,
    bSpend:      p.tierDistribution[1].spend,
    qualified:   p.totalQualified,
    qualifiedSpend: p.totalQualifiedSpend,
    avgAScore:   p.tierDistribution[0].avgScore,
    universeSize: p.universeSize,
  }));

  // Overlap: pairs + total multi-play A-tier
  const overlapPairs = [];
  let multiPlayATotal = 0;
  for (let i = 0; i < playSections.length; i++) {
    for (let j = i + 1; j < playSections.length; j++) {
      const overlapCount = computeOverlap(playSections[i], playSections[j]);
      overlapPairs.push({
        playAId: playSections[i].id,
        playAName: playSections[i].name,
        playBId: playSections[j].id,
        playBName: playSections[j].name,
        overlapCount,
      });
      multiPlayATotal += overlapCount;
    }
  }
  // Uniquify: dedup for the aggregate multi-play count (overcounts a little,
  // that's fine for the demo — real impl would use a set intersection over
  // account_ids).
  multiPlayATotal = Math.round(multiPlayATotal * 0.85);

  // Recommendation — top play by (aCount × aSpend density).
  const ranked = [...comparisonMatrix].sort((a, b) => {
    const dA = a.aCount * (a.aSpend / (a.aCount || 1));
    const dB = b.aCount * (b.aSpend / (b.aCount || 1));
    return dB - dA;
  });
  const recommendation = {
    leadWith: ranked[0]?.name,
    reason:   `Highest A-tier density × spend — ${formatCount(ranked[0]?.aCount)} A accounts, ${formatSpend(ranked[0]?.aSpend)} in spend.`,
    ranked:   ranked.map((r) => r.name),
  };

  // Coverage gaps — industries and geos that appear in <2 plays' top-5.
  const industryPresence = new Map();
  const geoPresence = new Map();
  for (const p of playSections) {
    for (const ind of p.industryMix.slice(0, 5)) {
      industryPresence.set(ind.name, (industryPresence.get(ind.name) || 0) + 1);
    }
    for (const g of p.geoDistribution.slice(0, 3)) {
      geoPresence.set(g.country, (geoPresence.get(g.country) || 0) + 1);
    }
  }
  const industryGaps = [...industryPresence.entries()]
    .filter(([, count]) => count === 1)
    .map(([name]) => name);
  const geoGaps = [...geoPresence.entries()]
    .filter(([, count]) => count === 1)
    .map(([name]) => name);

  return {
    comparisonMatrix,
    overlap: {
      multiPlayATotal,
      pairs: overlapPairs,
    },
    recommendation,
    coverageGaps: {
      industries: industryGaps.slice(0, 3),
      geos: geoGaps.slice(0, 3),
    },
  };
}

function buildExecutiveSummary(playSections, crossPlay) {
  const totalQualified = playSections.reduce((s, p) => s + p.totalQualified, 0);
  const totalAddressableSpend = playSections.reduce((s, p) => s + p.totalQualifiedSpend, 0);
  return {
    playCount:              playSections.length,
    totalQualified,
    totalAddressableSpend,
    leadWith:               crossPlay.recommendation.leadWith,
    leadWithReason:         crossPlay.recommendation.reason,
    multiPlayCount:         crossPlay.overlap.multiPlayATotal,
    industryGapCount:       crossPlay.coverageGaps.industries.length,
    geoGapCount:            crossPlay.coverageGaps.geos.length,
  };
}

// ─── Public: generate a report from a list of profile ids ───────────
export function generateReport(profileIds, { name } = {}) {
  const profiles = profileIds
    .map((id) => getScoringProfile(id))
    .filter(Boolean);
  if (profiles.length === 0) {
    throw new Error('No valid scoring profiles selected.');
  }

  const playSections = profiles.map(buildPlaySection);
  const crossPlay = buildCrossPlay(playSections);
  const executiveSummary = buildExecutiveSummary(playSections, crossPlay);

  return {
    name: name || `Market analysis — ${profiles.map((p) => p.name).join(' · ')}`,
    generatedAt: new Date('2026-08-20').toISOString(),
    scoringProfileIds: profileIds,
    scoringProfileNames: profiles.map((p) => p.name),
    executiveSummary,
    plays: playSections,
    crossPlay,
  };
}

// Convenience — return an eligible list of profiles for the picker.
export function listReportablePlays() {
  return listScoringProfiles();
}

// Convenience — tier metadata for consistent color rendering across views.
export const TIER_META = {
  A: { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/15',  border: 'border-emerald-500/40',  accent: '#10b981' },
  B: { color: 'text-sky-700 dark:text-sky-300',         bg: 'bg-sky-500/15',      border: 'border-sky-500/40',      accent: '#0ea5e9' },
  C: { color: 'text-amber-700 dark:text-amber-300',     bg: 'bg-amber-500/15',    border: 'border-amber-500/40',    accent: '#f59e0b' },
  D: { color: 'text-slate-700 dark:text-slate-300',     bg: 'bg-slate-500/15',    border: 'border-slate-500/40',    accent: '#94a3b8' },
  F: { color: 'text-rose-700 dark:text-rose-300',       bg: 'bg-rose-500/10',     border: 'border-rose-500/30',     accent: '#f43f5e' },
};
