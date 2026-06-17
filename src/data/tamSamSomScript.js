// Adaptive script for the TAM/SAM/SOM use case. The thread starts with a
// welcome turn + a default TAM view. As the user scopes, drops a CSV, builds
// the market interactively, adds competitors, asks for whitespace, saves the
// list, develops a scoring profile, and triggers CRM enrichment, the script
// advances through stages.

// ===== Stable turn IDs for jump-to-section + locked-state preservation =====
const TURN_IDS = {
  scope: 'tss-scope',
  csv: 'tss-csv-form',
  derivedIcp: 'tss-derived-icp',
  marketSize: 'tss-market-size',
  breakdowns: 'tss-breakdowns',
  competitorForm: 'tss-competitor-form',
  competitorPenetration: 'tss-competitor-penetration',
  whitespace: 'tss-whitespace',
  marketBuilder: 'tss-market-builder',
  scoringProfile: 'tss-scoring-profile',
  scoredList: 'tss-scored-list',
  listSaved: 'tss-list-saved',
  enrichmentInvoked: 'tss-enrichment-invoked',
  exported: 'tss-exported',
};

// ===== STAGE: welcome (the starter conversation) =====
export const WELCOME_TURNS = [
  {
    id: 'tss-welcome',
    role: 'ai',
    timestamp: 'Just now',
    content:
      "Let's size your market. I've started with a global default — software spend across all industries.\n\nYou can describe your scope in words (\"fintech mid-market in North America\"), drop a customer list and I'll derive everything, or build the market manually with interactive controls.",
    live: {
      type: 'TamSamSomMarketSize',
      props: {
        variant: 'global-default',
        sourceTurnId: 'tss-welcome',
        editable: false,
      },
    },
    suggestions: [
      'Build the market interactively',
      'Size for fintech mid-market in North America',
      'Drop a customer list',
    ],
  },
];

// Right-rail state seeded by the welcome turn (kept for back-compat — rail is hidden in adaptive mode)
export const INITIAL_RAIL_STATE = {
  tam: {
    spend: '$4.7T',
    companies: '27.8M',
    filters: ['Software'],
    sourceTurnId: 'tss-welcome',
  },
};

// ===== STAGE: user scopes to fintech NA (text-driven) =====
function stageScopeFintechNA() {
  return {
    aiTurns: [
      {
        id: TURN_IDS.scope,
        role: 'ai',
        timestamp: 'Just now',
        content:
          'Filtering to Fintech in North America. TAM narrows to $1.4T across 27.8M companies in scope. To compute SAM and SOM, I need an ICP — drop a customer list and I\'ll derive everything, or build manually with interactive controls.',
        live: {
          type: 'TamSamSomMarketSize',
          props: { variant: 'fintech-na-tam', sourceTurnId: TURN_IDS.scope, editable: true, editTargetId: 'tss-welcome' },
        },
        suggestions: ['Drop a customer list', 'Build the market interactively', 'Show me competitors first'],
      },
    ],
  };
}

// ===== STAGE: open the CSV picker =====
function stageOpenCsvPicker() {
  return {
    aiTurns: [
      {
        id: TURN_IDS.csv,
        role: 'ai',
        timestamp: 'Just now',
        content:
          "Drop a CSV here, or use the sample. The same file becomes the input for whitespace classification later — no need to upload twice.",
        live: { type: 'CSVDropzone', props: { stage: 'csv', submitted: false } },
      },
    ],
  };
}

// ===== STAGE: open the interactive market builder =====
function stageOpenMarketBuilder() {
  return {
    aiTurns: [
      {
        id: TURN_IDS.marketBuilder,
        role: 'ai',
        timestamp: 'Just now',
        content:
          "Here's the live market builder. Adjust spend categories, industries, geographies, and revenue/employee bands — TAM/SAM/SOM recompute on every change. When the size feels right, view the company list.",
        live: { type: 'MarketBuilder', props: { submitted: false } },
      },
    ],
  };
}

// ===== STAGE: market locked (after MarketBuilder submit) =====
function stageMarketLocked(payload) {
  const { sizes } = payload || {};
  const somCount = sizes?.som?.companies || 'a target';
  return {
    aiTurns: [
      {
        id: 'tss-market-locked',
        role: 'ai',
        timestamp: 'Just now',
        content: `Locked. ${somCount} companies match your SOM definition. Let's look at who they are — classified as Customer (already in your CRM), Expansion Whitespace (subsidiary of a customer), or Prospect Whitespace (net-new logo).`,
        live: { type: 'TamSamSomWhitespaceList', props: { sourceTurnId: TURN_IDS.whitespace, showSaveAction: true } },
        suggestions: [
          'Save this list to the thread',
          'Develop a scoring profile',
          'Add a competitor first',
        ],
      },
    ],
  };
}

// ===== STAGE: CSV submitted, derive ICP + compute SAM + SOM =====
function stageCsvSubmitted({ filename, derived, matched }) {
  return {
    aiTurns: [
      {
        id: TURN_IDS.derivedIcp,
        role: 'ai',
        timestamp: 'Just now',
        content: `Matched ${matched} of 50 (94%). Derived your ICP from the firmographic patterns — Banking & Financial Services + Insurance + Computer/Electronic Mfg in USA & Canada, with revenue and employee bands centered around $1.2B and 12K respectively.\n\nApplying this ICP to your TAM gives you SAM, and tightening with the SOM thresholds gives you the realistically-obtainable market.`,
        live: {
          type: 'ICPDefinition',
          props: {
            icp: {
              industries: derived.industries,
              geographies: derived.geographies,
              revenue: [`${derived.revenue.p25}–${derived.revenue.p75}`],
              employees: [`${derived.employees.p25}–${derived.employees.p75}`],
            },
            derived: true,
            sourceCount: matched,
          },
        },
      },
      {
        id: TURN_IDS.marketSize,
        role: 'ai',
        timestamp: 'Just now',
        content: 'TAM, SAM, and SOM — sized using your derived ICP.',
        live: { type: 'TamSamSomMarketSize', props: { variant: 'fintech-na-sized', sourceTurnId: TURN_IDS.marketSize, editable: true, editTargetId: TURN_IDS.derivedIcp } },
      },
      {
        id: TURN_IDS.breakdowns,
        role: 'ai',
        timestamp: 'Just now',
        content: 'Breakdowns by geography, industry, revenue, and employee count. Click any segment to drill in, or ask "show me by [dimension]" to pivot.',
        live: { type: 'TamSamSomBreakdown', props: { variant: 'fintech-na-sized', sourceTurnId: TURN_IDS.breakdowns } },
        suggestions: [
          'Show the SOM company list',
          'Add Palo Alto Networks as competitor',
          'Tighten the headcount band',
        ],
      },
    ],
  };
}

// ===== STAGE: open competitor picker =====
function stageOpenCompetitorPicker(text) {
  return {
    aiTurns: [
      {
        id: TURN_IDS.competitorForm,
        role: 'ai',
        timestamp: 'Just now',
        content: "I'll size penetration across your SOM. Confirm or adjust the competitor set.",
        live: { type: 'CompetitorPicker', props: { stage: 'competitor', submitted: false } },
      },
    ],
  };
}

// ===== STAGE: competitor submitted =====
function stageCompetitorSubmitted({ names }) {
  const primary = names[0] || 'Palo Alto Networks';
  return {
    aiTurns: [
      {
        id: TURN_IDS.competitorPenetration,
        role: 'ai',
        timestamp: 'Just now',
        content: `${primary} is installed at 153 of your 271 SOM companies (56.5%). That splits into 153 competitive-overlap accounts (where ${primary} is incumbent) and 118 SOM whitespace (no ${primary} footprint — easier displacement entry points).`,
        live: { type: 'TamSamSomCompetitor', props: { competitor: primary, sourceTurnId: TURN_IDS.competitorPenetration } },
        suggestions: [
          'Show whitespace company list',
          'Filter to non-Palo-Alto SOM only',
          'Add CrowdStrike for comparison',
        ],
      },
    ],
  };
}

// ===== STAGE: whitespace classification (with save action) =====
function stageWhitespace() {
  return {
    aiTurns: [
      {
        id: TURN_IDS.whitespace,
        role: 'ai',
        timestamp: 'Just now',
        content:
          'Classified 168 organizations in your SOM. 8 are existing customers (from your CSV), 6 are expansion-whitespace (subsidiaries of existing customers), and 154 are net-new prospect-whitespace.\n\nWhen you\'re happy with this list, save it to the thread and we can develop a scoring profile to prioritize.',
        live: { type: 'TamSamSomWhitespaceList', props: { sourceTurnId: TURN_IDS.whitespace, showSaveAction: true } },
        suggestions: [
          'Save this list to the thread',
          'Develop a scoring profile',
          'Filter to expansion-whitespace only',
        ],
      },
    ],
  };
}

// ===== STAGE: list saved (after Save action) =====
function stageListSaved({ count }) {
  const listId = `list-${Date.now().toString(36)}`;
  return {
    userText: 'Save this list',
    aiTurns: [
      {
        id: TURN_IDS.listSaved,
        role: 'ai',
        timestamp: 'Just now',
        content: `Saved as a thread artifact. The list now lives in this thread and can be referenced by other agents — for example, the CRM Enrichment playbook will write back to your CRM using this exact list.`,
        artifact: {
          id: listId,
          type: 'LIST',
          name: `SOM Companies — Fintech NA — May 5`,
          meta: `${count || 168} organizations · 8 customers · 6 expansion · 154 prospect`,
        },
        suggestions: [
          'Develop a scoring profile',
          'Mark for CRM Enrichment',
          'Export to Salesforce',
        ],
      },
    ],
    listId,
  };
}

// ===== STAGE: open scoring profile builder =====
function stageOpenScoringProfile() {
  return {
    aiTurns: [
      {
        id: TURN_IDS.scoringProfile,
        role: 'ai',
        timestamp: 'Just now',
        content:
          "A scoring profile combines firmographic fit + technographic signal + intent surge into two scores per company: Fit (how well they match your ICP) and Intent (how active their research is right now). Adjust the weights to match how YOUR historical wins look — defaults below are HG benchmarks.",
        live: { type: 'ScoringProfileBuilder', props: { submitted: false } },
      },
    ],
  };
}

// ===== STAGE: scoring profile applied → scored list =====
function stageScoringApplied(payload) {
  return {
    aiTurns: [
      {
        id: TURN_IDS.scoredList,
        role: 'ai',
        timestamp: 'Just now',
        content:
          "Applied. Combined Fit × Intent score per company, tiered A/B/C/D. JPMorgan Chase, Visa, and Mastercard top the A-tier — all BFS, all in active Zero Trust research, none with your competitor incumbent.\n\nFrom here you can export to CRM directly, or trigger the Enrichment agent to pull HG firmographics + tech installs + write the scores back to Salesforce in one shot.",
        live: { type: 'ScoredCompanyList', props: { scoringWeights: payload, listSavedId: payload?.listSavedId } },
        suggestions: [
          'Mark for CRM Enrichment',
          'Export to Salesforce',
          'Filter to A-tier only',
          'Re-tune the scoring profile',
        ],
      },
    ],
  };
}

// ===== STAGE: export to CRM (terminal action) =====
function stageExportToCrm({ count = 15 } = {}) {
  return {
    userText: 'Export to Salesforce',
    aiTurns: [
      {
        id: TURN_IDS.exported,
        role: 'ai',
        timestamp: 'Just now',
        content:
          `Exported ${count} accounts to Salesforce. Created a Campaign "TAM/SAM/SOM Fintech NA — May 5" with all ${count} accounts attached. CrmId column on the saved list is updated. Account Owners notified via Slack DM.\n\nIf you want the scoring + firmographics WRITTEN BACK to each Salesforce account record (not just attached to a campaign), trigger CRM Enrichment instead.`,
        suggestions: [
          'Mark for CRM Enrichment',
          'Open Salesforce campaign',
          'Re-tune the scoring profile',
        ],
      },
    ],
  };
}

// ===== Detect a stage from free-text user input =====
export function detectStage(text, currentState) {
  const t = text.toLowerCase();
  // Order matters — most-specific keywords first
  if (/enrich|crm enrichment|mark.*enrichment/.test(t)) return 'enrichment';
  if (/^export|to (salesforce|crm|hubspot)|export to/.test(t)) return 'exportToCrm';
  if (/score|scoring|fit score|intent score|develop.*scoring/.test(t)) return 'scoringProfile';
  if (/^save( |$)|save (the |this )?list/.test(t)) return 'saveList';
  if (/whitespace|company list|opportunity|som (company )?list|view (the |som )?list|show (me )?(the )?(som |company )?list/.test(t))
    return 'whitespace';
  if (/competitor|palo alto|crowdstrike|zscaler|fortinet|cisco/.test(t)) return 'competitorPicker';
  if (/build.*manually|build.*interactiv|configure (scope|market)|market builder|define icp manually|interactive controls/.test(t))
    return 'marketBuilder';
  if (/csv|customer list|drop|upload|customer file/.test(t)) return 'csvPicker';
  if (/fintech.*(na|north america|us|usa)/.test(t) || /north america.*fintech/.test(t)) return 'scopeFintechNA';
  return null;
}

// ===== Run a stage by id =====
export function runStage(stageId, payload = {}) {
  switch (stageId) {
    case 'scopeFintechNA':
      return stageScopeFintechNA();
    case 'csvPicker':
      return stageOpenCsvPicker();
    case 'csvSubmitted':
      return stageCsvSubmitted(payload);
    case 'marketBuilder':
      return stageOpenMarketBuilder();
    case 'marketLocked':
      return stageMarketLocked(payload);
    case 'competitorPicker':
      return stageOpenCompetitorPicker(payload.text);
    case 'competitorSubmitted':
      return stageCompetitorSubmitted(payload);
    case 'whitespace':
      return stageWhitespace();
    case 'saveList':
      return stageListSaved(payload);
    case 'scoringProfile':
      return stageOpenScoringProfile();
    case 'scoringApplied':
      return stageScoringApplied(payload);
    case 'exportToCrm':
      return stageExportToCrm(payload);
    default:
      return null;
  }
}
