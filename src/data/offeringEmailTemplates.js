// Offering-aware email/outbound templates. Drives what the account thread
// shows when a seller clicks "Email draft" in a specific offering lens.
//
// Real product: these are agent-generated. Here we hand-curate per-offering
// scaffolds + per-account variable interpolation.

import { getOffering } from './offerings.js';
import { getFitFor } from './accountOfferingFit.js';

const TEMPLATES = {
  cnapp: {
    subject: 'Quick observation on your cloud security posture',
    opening: (account) =>
      `Hi {champion_first_name},\n\nNoticed ${account.name} is running multi-cloud (${account.cloud}) — and that ${account.competitor && account.competitor !== 'None detected' ? account.competitor : 'your incumbent CNAPP'} is unlikely to be unifying posture across AWS and Azure the way Wiz does natively.`,
    body: (account, offering, fit) =>
      `A few CNAPP customers your size have found that 60-70% of cloud risk lives in misconfigurations that don't bubble up in CSPM tools alone. We've helped teams at Bridgewater and Block consolidate posture + CIEM + DSPM into one graph — usually cutting alert noise by 40%.\n\n${fit?.reasons?.[0] ? `What stood out for ${account.name}: ${fit.reasons[0]}.` : ''}`,
    cta: () =>
      `Worth a 30-minute walkthrough next week? I can bring our solutions engineer to walk through how the unified graph works on a multi-cloud footprint like yours.`,
    closer: () =>
      `Either way — appreciate you considering it.\n\nBest,\n{seller_name}`,
    positioningNotes: [
      'Multi-cloud posture unification (the Wiz differentiator)',
      'Wiz security graph vs. siloed CSPM',
      'Consolidation savings vs. point tools',
    ],
    competitorsMentioned: ['Palo Alto Prisma Cloud', 'Lacework', 'Orca Security'],
    callOutSignal: (signal) =>
      signal ? `Saw the ${signal.headline.toLowerCase()} — that's exactly the moment to consolidate.` : null,
  },
  ciem: {
    subject: 'A quick thought on cloud identity sprawl',
    opening: (account) =>
      `Hi {champion_first_name},\n\nA few peers in ${account.industry.split(' ')[0]} have been flagging the same pattern: cloud IAM permissions growing 30-40% faster than headcount, and audit findings landing on entitlement sprawl. ${account.name}'s cloud footprint suggests you may be hitting the same curve.`,
    body: (account, offering, fit) =>
      `Wiz CIEM continuously evaluates effective permissions across AWS, Azure, and GCP and auto-recommends right-sizing without breaking workloads. ${fit?.reasons?.[0] ? `For ${account.name} specifically: ${fit.reasons[0]}.` : ''}\n\nWe typically see 60% reduction in over-permissioned identities within 90 days.`,
    cta: () =>
      `Open to a 25-minute IAM audit demo? We'll show actual effective-permission analysis on a sample of your environment (read-only, no install).`,
    closer: () =>
      `Best,\n{seller_name}`,
    positioningNotes: [
      'Continuous effective-permission evaluation',
      'Audit-finding remediation in days, not quarters',
      'No-install pilot via read-only IAM scan',
    ],
    competitorsMentioned: ['SailPoint', 'Saviynt', 'Sonrai', 'Ermetic'],
    callOutSignal: (signal) =>
      signal ? `${signal.headline} is a strong signal of broader identity governance work — CIEM tends to surface in those conversations.` : null,
  },
  dspm: {
    subject: 'On the data sensitivity question',
    opening: (account) =>
      `Hi {champion_first_name},\n\nWith ${account.name}'s data platform footprint, the question we hear most from peers is: "Where does sensitive data live, and who can access it, *right now*?" Most teams can't answer that confidently across cloud storage, warehouses, and SaaS.`,
    body: (account, offering, fit) =>
      `Wiz DSPM discovers + classifies sensitive data across your data stores and stitches it to access paths in our security graph. ${fit?.reasons?.[0] ? `For ${account.name}: ${fit.reasons[0]}.` : ''}\n\nWe typically surface 3-5 shadow-data exposures in the first scan that customers didn't know existed.`,
    cta: () =>
      `Open to a quick DSPM scan demo? We can dry-run on a single bucket or warehouse if you'd like to see real output before going broader.`,
    closer: () =>
      `Best,\n{seller_name}`,
    positioningNotes: [
      'Shadow data discovery as the wedge',
      'Access path mapping (data + identity together)',
      'No-install scan as first proof point',
    ],
    competitorsMentioned: ['Cyera', 'Concentric AI', 'Laminar', 'Sentra'],
    callOutSignal: (signal) =>
      signal ? `${signal.headline} usually correlates with stronger data-classification budget cycles.` : null,
  },
  workload: {
    subject: 'Container security at scale — a quick angle',
    opening: (account) =>
      `Hi {champion_first_name},\n\nKubernetes-heavy environments like ${account.name}'s tend to hit the same wall: runtime CVE noise drowns out the 5-10 alerts that actually matter. We've spent the last 18 months obsessing on that exact problem.`,
    body: (account, offering, fit) =>
      `Wiz Workload Protection prioritizes runtime vulnerabilities by actual exposure path through the cloud — not raw CVSS — and feeds that back into the same graph your CSPM team uses. ${fit?.reasons?.[0] ? `For ${account.name}: ${fit.reasons[0]}.` : ''}`,
    cta: () =>
      `Worth a 30-minute look? We can run a free environment scan and show you the top 10 actually-exploitable issues in your runtime today.`,
    closer: () =>
      `Best,\n{seller_name}`,
    positioningNotes: [
      'Exploit-path-based CVE prioritization',
      'Shared graph with CSPM (one tool, not two)',
      'Free env scan as proof of value',
    ],
    competitorsMentioned: ['Sysdig', 'Aqua Security', 'Snyk'],
    callOutSignal: (signal) =>
      signal ? `${signal.headline} suggests now is the moment for runtime convergence.` : null,
  },
};

const ALL_OFFERINGS_FALLBACK = {
  subject: 'Quick follow-up',
  opening: (account) => `Hi {champion_first_name},\n\nFollowing up on ${account.name}.`,
  body: () => `Wanted to share a quick thought based on recent signals at your end.`,
  cta: () => `Open to a 25-minute conversation next week?`,
  closer: () => `Best,\n{seller_name}`,
  positioningNotes: ['Generic follow-up — switch offering lens for tailored positioning'],
  competitorsMentioned: [],
  callOutSignal: () => null,
};

// Compose an email draft for a given offering + account.
// Returns { subject, body, positioningNotes, competitorsMentioned, signalCallout }
export function composeOfferingEmail({ offeringId, account, championName, sellerName, topSignal }) {
  const template = TEMPLATES[offeringId] || ALL_OFFERINGS_FALLBACK;
  const offering = getOffering(offeringId);
  const fit = offeringId && offeringId !== 'all' ? getFitFor(account.id, offeringId) : null;

  const championFirst = (championName || 'there').split(' ')[0];

  const interpolate = (text) =>
    String(text || '')
      .replaceAll('{champion_first_name}', championFirst)
      .replaceAll('{seller_name}', sellerName || 'your seller');

  const parts = [
    template.opening(account, offering, fit),
    '',
    template.body(account, offering, fit),
    '',
    template.callOutSignal(topSignal),
    template.callOutSignal(topSignal) ? '' : null,
    template.cta(account, offering, fit),
    '',
    template.closer(account, offering, fit),
  ]
    .filter((line) => line !== null && line !== undefined)
    .map(interpolate)
    .join('\n');

  return {
    subject: interpolate(template.subject),
    body: parts,
    positioningNotes: template.positioningNotes,
    competitorsMentioned: template.competitorsMentioned,
    signalUsed: template.callOutSignal(topSignal) ? topSignal : null,
  };
}
