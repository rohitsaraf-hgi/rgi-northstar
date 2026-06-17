// Module + tier definitions used by Demo Controls and dependent views.
// USE_CASE_MODULE_MAP keys map to existing use case IDs in src/data/useCases.js.

export const MODULE_DEFINITIONS = [
  {
    id: 'market_analyzer',
    name: 'Market Analyzer',
    color: '#4F7FFF',
    icon: 'BarChart2',
    description: 'Market segmentation, TAM/SAM/SOM, competitive intelligence',
    coreServices: ['firmographic', 'technographic', 'intent'],
  },
  {
    id: 'data_studio',
    name: 'Data Studio',
    color: '#A855F7',
    icon: 'Cpu',
    description: 'ICP scoring models, inbound routing, lead qualification',
    coreServices: ['scoring', 'firmographic', 'technographic'],
  },
  {
    id: 'sales_copilot',
    name: 'Sales Copilot',
    color: '#F59E0B',
    icon: 'Target',
    description: 'Signal-based prioritization, AI sales plays, account intelligence',
    coreServices: ['intent', 'contacts', 'technographic', 'scoring'],
  },
  {
    id: 'trust_radius',
    name: 'TrustRadius',
    color: '#22C55E',
    icon: 'Star',
    description: 'Review intelligence, social proof signals, competitive sentiment',
    coreServices: ['trust_radius_reviews'],
    isExpansion: true,
  },
  {
    id: 'rgi_agents',
    name: 'RGI Agents',
    color: '#EF4444',
    icon: 'Bot',
    description: 'Autonomous execution — AI acts, human approves',
    coreServices: ['all'],
    isExpansion: true,
  },
];

export const CORE_SERVICES = [
  { id: 'firmographic', name: 'Firmographic Data', stat: '25M+ companies', icon: 'Building' },
  { id: 'technographic', name: 'Technographic Data', stat: '19K+ tech products', icon: 'Layers' },
  { id: 'intent', name: 'Intent Data', stat: '12K+ topics', icon: 'Activity' },
  { id: 'contacts', name: 'Contact Data', stat: '200M+ contacts', icon: 'Users' },
  { id: 'scoring', name: 'Account Scoring', stat: 'ML-powered models', icon: 'TrendingUp' },
  { id: 'trust_radius_reviews', name: 'TrustRadius Reviews', stat: 'Verified reviews', icon: 'Star' },
];

export const TIER_DEFINITIONS = {
  starter: {
    name: 'Starter',
    color: '#8B8FA8',
    aiTurnsPerThread: 5,
    exportLimitMonthly: 5000,
    collaborativeWorkspaces: false,
    agentAutonomy: false,
    apiAccess: false,
  },
  growth: {
    name: 'Growth',
    color: '#4F7FFF',
    aiTurnsPerThread: 25,
    exportLimitMonthly: 50000,
    collaborativeWorkspaces: true,
    agentAutonomy: false,
    apiAccess: false,
  },
  enterprise: {
    name: 'Enterprise',
    color: '#F59E0B',
    aiTurnsPerThread: -1,
    exportLimitMonthly: -1,
    collaborativeWorkspaces: true,
    agentAutonomy: true,
    apiAccess: true,
  },
};

// Stage order: [Define, Discover, Score, Understand, Action]
// null = always available regardless of modules owned
// Keys are existing use case IDs from src/data/useCases.js
export const USE_CASE_MODULE_MAP = {
  'tam-sam-som':              { stages: ['market_analyzer', 'market_analyzer', 'data_studio',   'market_analyzer', null] },
  whitespace:                 { stages: ['market_analyzer', 'market_analyzer', 'data_studio',   'sales_copilot',   'sales_copilot'] },
  'competitive-analysis':     { stages: ['market_analyzer', 'market_analyzer', 'data_studio',   'sales_copilot',   'sales_copilot'] },
  'segment-refresh':          { stages: ['market_analyzer', 'market_analyzer', 'data_studio',   'market_analyzer', null] },
  'market-intelligence-brief':{ stages: ['market_analyzer', 'market_analyzer', null,            'market_analyzer', null] },
  'account-scoring':          { stages: ['market_analyzer', 'market_analyzer', 'data_studio',   'sales_copilot',   null] },
  'competitive-displacement': { stages: ['market_analyzer', 'market_analyzer', 'data_studio',   'sales_copilot',   'sales_copilot'] },
  'inbound-qualification':    { stages: ['data_studio',     'data_studio',     'data_studio',   'data_studio',     null] },
  pql:                        { stages: ['data_studio',     'data_studio',     'data_studio',   'sales_copilot',   'sales_copilot'] },
  'multi-product-scoring':    { stages: ['data_studio',     'data_studio',     'data_studio',   'data_studio',     null] },
  'ai-sales-plays':           { stages: ['sales_copilot',   'sales_copilot',   'data_studio',   'sales_copilot',   'sales_copilot'] },
  'signal-prioritization':    { stages: ['sales_copilot',   'sales_copilot',   'sales_copilot', 'sales_copilot',   'sales_copilot'] },
  'daily-account-triage':     { stages: ['sales_copilot',   'sales_copilot',   'sales_copilot', 'sales_copilot',   'sales_copilot'] },
  'account-deep-dive':        { stages: ['sales_copilot',   'market_analyzer', 'sales_copilot', 'sales_copilot',   'sales_copilot'] },
  'pre-call-prep':            { stages: ['sales_copilot',   'sales_copilot',   null,            'sales_copilot',   'sales_copilot'] },
  'champion-tracking':        { stages: ['sales_copilot',   'sales_copilot',   null,            'sales_copilot',   'sales_copilot'] },
  'renewal-risk-review':      { stages: ['sales_copilot',   'sales_copilot',   'data_studio',   'sales_copilot',   'sales_copilot'] },
};

// Friendly mapping from module id → human label (centralized for UI)
export function moduleLabel(id) {
  const m = MODULE_DEFINITIONS.find((x) => x.id === id);
  return m ? m.name : id;
}

export function moduleById(id) {
  return MODULE_DEFINITIONS.find((x) => x.id === id) || null;
}

// Compute the availability state of a use case given which modules are owned
// Returns: { state: 'available' | 'partial' | 'locked', stagesAvailable, totalStages }
export function useCaseAvailability(useCaseId, modulesOwned) {
  const map = USE_CASE_MODULE_MAP[useCaseId];
  if (!map) return { state: 'available', stagesAvailable: 5, totalStages: 5 };
  let available = 0;
  for (const stage of map.stages) {
    if (stage === null || modulesOwned.includes(stage)) available++;
  }
  const total = map.stages.length;
  if (available === total) return { state: 'available', stagesAvailable: available, totalStages: total };
  if (available === 0) return { state: 'locked', stagesAvailable: 0, totalStages: total };
  return { state: 'partial', stagesAvailable: available, totalStages: total };
}
