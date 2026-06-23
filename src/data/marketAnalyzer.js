// Market Analyzer demo data.
//
// Three primitives:
//   - Projects:        TAM / SAM / SOM analyses scoped to a market hypothesis.
//   - Segments:        saved filtered company views, attached to a project.
//   - Scoring Profiles: the ONE canonical scoring entity in the platform.
//                      Sales Co-Pilot consumes these — each offering attaches
//                      to a profile and the workbook shows fit scores from it.
//                      Two kinds:
//                         · system   — auto-generated from offering config,
//                                       one per offering, read-only.
//                                       Must clone to a custom profile to edit
//                                       (requires Market Analyzer entitlement).
//                         · custom   — admin-authored in MA. Can be applied
//                                       to MA segments AND attached to a
//                                       Sales Co-Pilot offering.
//
// All in-memory for the prototype. Real product persists to backend.

import { OFFERINGS } from './offerings.js';

export const MA_PROJECTS = [
  {
    id: 'proj-q3-tam',
    name: 'Q3 CNAPP TAM Analysis',
    description: 'Total addressable market for CNAPP across Banking + Tech, NA + EMEA.',
    visibility: 'organization',
    ownerId: 'priya',
    ownerName: 'Priya Sharma',
    createdAt: '2026-06-02',
    updatedAt: '2026-06-18',
    segmentCount: 4,
    companyCount: 18420,
  },
  {
    id: 'proj-healthcare-seg',
    name: 'Healthcare Vertical Segmentation',
    description: 'Whitespace within Healthcare & Life Sciences, 1K+ employees.',
    visibility: 'private',
    ownerId: 'priya',
    ownerName: 'Priya Sharma',
    createdAt: '2026-05-26',
    updatedAt: '2026-06-14',
    segmentCount: 2,
    companyCount: 3210,
  },
  {
    id: 'proj-ai-runtime',
    name: 'AI / Runtime Defense — Net New Logo TAM',
    description: 'Companies running AI agents at scale — sizing the Wiz Defend market.',
    visibility: 'organization',
    ownerId: 'priya',
    ownerName: 'Priya Sharma',
    createdAt: '2026-05-12',
    updatedAt: '2026-06-09',
    segmentCount: 3,
    companyCount: 1840,
  },
  {
    id: 'proj-displacement-q4',
    name: 'Q4 Palo Alto Displacement Whitespace',
    description: 'Accounts running aging Palo Alto Prisma — competitive takeout sizing.',
    visibility: 'private',
    ownerId: 'priya',
    ownerName: 'Priya Sharma',
    createdAt: '2026-04-30',
    updatedAt: '2026-05-21',
    segmentCount: 5,
    companyCount: 967,
  },
];

export const MA_SEGMENTS = [
  {
    id: 'seg-fintech-cnapp',
    name: 'Fintech · CNAPP-ready · 1K+ employees',
    description: 'Banking & Financial Services with multi-cloud AND no current CNAPP incumbent.',
    projectId: 'proj-q3-tam',
    projectName: 'Q3 CNAPP TAM Analysis',
    companyCount: 1247,
    appliedProfileId: 'sp-cnapp-readiness',
    createdAt: '2026-06-04',
  },
  {
    id: 'seg-prisma-aging',
    name: 'Palo Alto Prisma — install age ≥ 24mo',
    description: 'Accounts running aging Palo Alto Prisma Cloud, ripe for displacement.',
    projectId: 'proj-displacement-q4',
    projectName: 'Q4 Palo Alto Displacement Whitespace',
    companyCount: 412,
    appliedProfileId: 'sp-displacement-fit',
    createdAt: '2026-05-02',
  },
  {
    id: 'seg-ai-platforms',
    name: 'AI-native platforms · pre-IPO',
    description: 'Companies running 10K+ AI agents in production — Wiz Defend prime targets.',
    projectId: 'proj-ai-runtime',
    projectName: 'AI / Runtime Defense — Net New Logo TAM',
    companyCount: 187,
    appliedProfileId: 'sp-ai-readiness',
    createdAt: '2026-05-14',
  },
  {
    id: 'seg-healthcare-large',
    name: 'Healthcare · 10K+ employees',
    description: 'Hospital systems and large payers — regulatory compliance buyers.',
    projectId: 'proj-healthcare-seg',
    projectName: 'Healthcare Vertical Segmentation',
    companyCount: 89,
    appliedProfileId: null,
    createdAt: '2026-05-28',
  },
];

// Custom MA profiles — created by RevOps admin in MA. These coexist with
// system defaults; an offering can attach either kind. The `appliedOfferingIds`
// field lists offerings that currently use this profile (informational chip).
export const MA_SCORING_PROFILES = [
  {
    id: 'sp-cnapp-readiness',
    name: 'CNAPP Readiness Score',
    description: 'Multi-cloud signals × cloud spend × posture-refresh indicators. Standard profile for CNAPP TAM work.',
    ownerId: 'priya',
    ownerName: 'Priya Sharma',
    visibility: 'organization',
    createdAt: '2026-03-18',
    updatedAt: '2026-06-10',
    appliedSegmentCount: 3,
    dimensions: ['Cloud footprint', 'Compliance posture', 'IT spend', 'Engineering velocity'],
    kind: 'custom',
    appliedOfferingIds: [],
  },
  {
    id: 'sp-displacement-fit',
    name: 'Competitive Displacement Fit',
    description: 'Weights incumbent install age, contract-renewal proximity, and intent-surge on alternatives.',
    ownerId: 'priya',
    ownerName: 'Priya Sharma',
    visibility: 'organization',
    createdAt: '2026-02-04',
    updatedAt: '2026-05-29',
    appliedSegmentCount: 2,
    dimensions: ['Install age', 'Renewal window', 'Competitor intent', 'Champion signals'],
    kind: 'custom',
    appliedOfferingIds: [],
  },
  {
    id: 'sp-ai-readiness',
    name: 'AI / Runtime Readiness',
    description: 'Composite of agent-deployment scale, FedRAMP / HITRUST trajectory, and AI security signals.',
    ownerId: 'priya',
    ownerName: 'Priya Sharma',
    visibility: 'private',
    createdAt: '2026-04-20',
    updatedAt: '2026-06-12',
    appliedSegmentCount: 1,
    dimensions: ['Agent fleet size', 'Compliance posture', 'AI security spend', 'MCP adoption'],
    kind: 'custom',
    appliedOfferingIds: [],
  },
  {
    id: 'sp-budget-fit',
    name: 'Budget & ICP Fit Composite',
    description: 'Lightweight scoring for top-of-funnel TAM sizing — firmographic fit + IT spend tier.',
    ownerId: 'priya',
    ownerName: 'Priya Sharma',
    visibility: 'organization',
    createdAt: '2026-01-14',
    updatedAt: '2026-04-03',
    appliedSegmentCount: 4,
    dimensions: ['Industry', 'Revenue tier', 'IT spend', 'Geo'],
    kind: 'custom',
    appliedOfferingIds: [],
  },
];

// ─── System-default scoring profiles ────────────────────────────────
//
// One per offering, auto-generated. These are read-only — admin must
// clone to a custom profile (requires MA entitlement) to edit.
// Dimensions are derived from the offering's targetICP, competitors,
// and intent topics (mirrors what the legacy scoringModels.js builder
// produced, minus the Conservative/Aggressive variants and the tuning
// factor).

function buildSystemDefaultProfile(offering) {
  return {
    id: `sysdef-${offering.id}`,
    name: `${offering.name} — Default fit`,
    description: `System default scoring profile auto-generated from the ${offering.name} configuration. Directional fit score across your book. Customize in Market Analyzer to tighten.`,
    kind: 'system',
    readOnly: true,
    offeringId: offering.id,
    ownerId: 'system',
    ownerName: 'System',
    visibility: 'organization',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    appliedSegmentCount: 0,
    appliedOfferingIds: [offering.id],
    dimensions: [
      'Company Size',
      'Industry Fit',
      'IT Spend (bonus)',
      'Complexity Signals',
      'Displacement Targets',
      'Tech Demand',
      'Direct Product Intent',
      'Competitor Intent',
    ],
  };
}

export const MA_SYSTEM_DEFAULTS = OFFERINGS.map(buildSystemDefaultProfile);

// ─── Queries ──────────────────────────────────────────────────────────

export function listProjects() {
  return MA_PROJECTS;
}
export function listSegments() {
  return MA_SEGMENTS;
}

// Combined view used by pickers — system defaults first, then custom.
export function listScoringProfiles() {
  return [...MA_SYSTEM_DEFAULTS, ...MA_SCORING_PROFILES];
}
export function listSystemDefaultProfiles() {
  return MA_SYSTEM_DEFAULTS;
}
export function listCustomProfiles() {
  return MA_SCORING_PROFILES;
}
export function getScoringProfile(id) {
  return (
    MA_SYSTEM_DEFAULTS.find((p) => p.id === id) ||
    MA_SCORING_PROFILES.find((p) => p.id === id) ||
    null
  );
}

// Resolve the profile attached to an offering. Falls back to the
// offering's system default when no explicit profile is set, so the
// Workbook always has a profile to score against.
export function getProfileForOffering(offering) {
  if (!offering) return null;
  if (offering.scoringProfileId) {
    const explicit = getScoringProfile(offering.scoringProfileId);
    if (explicit) return explicit;
  }
  return MA_SYSTEM_DEFAULTS.find((p) => p.offeringId === offering.id) || null;
}

// Clone a system default into a custom profile (the Customize affordance
// on the MA Scoring Profiles page). Returns the new profile.
export function cloneProfileToCustom(profileId, opts = {}) {
  const source = getScoringProfile(profileId);
  if (!source) return null;
  const id = opts.id || `sp-${Date.now()}`;
  const next = {
    ...source,
    id,
    name: opts.name || `${source.name} (copy)`,
    description: opts.description || `Cloned from ${source.name}. Edit dimensions and weights to tailor.`,
    kind: 'custom',
    readOnly: false,
    ownerId: opts.ownerId || 'priya',
    ownerName: opts.ownerName || 'Priya Sharma',
    visibility: opts.visibility || 'organization',
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
    appliedSegmentCount: 0,
    appliedOfferingIds: [],
  };
  MA_SCORING_PROFILES.unshift(next);
  return next;
}

// Prepend a new segment created from the Companies page "Save segment" flow.
// In production this hits the backend; here it mutates the in-memory list so
// the Segments route sees it on next visit within the session.
export function addSegment(segment) {
  MA_SEGMENTS.unshift({
    id: segment.id || `seg-${Date.now()}`,
    name: segment.name,
    description: segment.description || '',
    projectId: segment.projectId || null,
    projectName: segment.projectName || 'Unassigned',
    companyCount: segment.companyCount || 0,
    appliedProfileId: segment.appliedProfileId || null,
    createdAt: new Date().toISOString().slice(0, 10),
  });
  return MA_SEGMENTS[0];
}
