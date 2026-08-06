// Canonical signal catalog — one entry per row of the Account Signals spec
// (docs/Account Signals and New Sales Copilot Home Page.md).
//
// This is the single source of truth. Every consumer — Home Attention Queue,
// Home Signal Board, workbook signal-category filter, Filter Studio, agents,
// plays — reads from this registry.
//
// Contract:
//   id                — stable string used everywhere
//   category          — one of SIGNAL_CATEGORIES
//   source            — 'HG data' | '1P Data Pipeline' | 'CRM'
//   description       — one-line human explanation
//   detectionRule     — how the detector layer computes "fires"
//   nba               — { verb: string, agent: string | null } — the Next
//                       Best Action mapped 1:1 to the spec's NBA column
//   weight            — used by the Attention Queue to rank rows
//   tenantContextRequired — true when the signal depends on tenant config
//                           (competitor list, product lens, etc.)
//   attentionEligible — true when the signal should surface in the Home
//                       Attention Queue (not just the Signal Board)

// ─── Categories (in display order on the Signal Board) ───────────────────

export const SIGNAL_CATEGORIES = {
  deal_health: {
    id: 'deal_health',
    label: 'Deal Health',
    hint: 'Deals stuck, past due, or closing soon',
    icon: 'Activity',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
  engagement: {
    id: 'engagement',
    label: 'Engagement',
    hint: 'Activity + meeting cadence decay',
    icon: 'TrendingDown',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  relationship_coverage: {
    id: 'relationship_coverage',
    label: 'Relationship Coverage',
    hint: 'Single-threading, missing economic buyer, no champion',
    icon: 'Users',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
  deal_risk: {
    id: 'deal_risk',
    label: 'Deal Risk',
    hint: 'Competitor mentioned, procurement late, security missing',
    icon: 'AlertTriangle',
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  buyer_intent: {
    id: 'buyer_intent',
    label: 'Buyer Intent',
    hint: 'TrustRadius comparisons + topic intent surges',
    icon: 'Sparkles',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  account_health: {
    id: 'account_health',
    label: 'Account Health',
    hint: 'Multiple opps, renewal not started, expansion untapped',
    icon: 'Building2',
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
  },
  competitive: {
    id: 'competitive',
    label: 'Competitive',
    hint: 'Competitor installs and renewal windows',
    icon: 'Sword',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
  partner: {
    id: 'partner',
    label: 'Partner',
    hint: 'Complementary product installs',
    icon: 'Handshake',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
  },
  momentum: {
    id: 'momentum',
    label: 'Product Momentum',
    hint: 'Tenant product install trajectory',
    icon: 'TrendingUp',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  first_party_activity: {
    id: 'first_party_activity',
    label: '1P Activity',
    hint: 'Sales, web, and marketing activity from your data pipeline',
    icon: 'Globe',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
  },
};

export const SIGNAL_CATEGORY_ORDER = [
  'deal_health',
  'engagement',
  'relationship_coverage',
  'deal_risk',
  'buyer_intent',
  'account_health',
  'competitive',
  'partner',
  'momentum',
  'first_party_activity',
];

// ─── Signal registry ─────────────────────────────────────────────────────
// 24 signals mirroring the spec table. Weights calibrated from the design
// discussion (past-close = 100, single-threaded-large = 80, intent = 45,
// etc.). Signals not in the Attention Queue set attentionEligible: false
// but still populate the Signal Board.

export const SIGNAL_CATALOG = [
  // ─── Deal Health ─────────────────────────────────────────────────────
  {
    id: 'past_close_date',
    category: 'deal_health',
    source: 'CRM',
    description: 'Opportunity close date has passed but the stage is still open',
    detectionRule: 'CloseDate < today AND IsClosed = false',
    nba: { verb: 'Update close date + status', agent: 'update_opportunity_field' },
    weight: 100,
    attentionEligible: true,
  },
  {
    id: 'closing_in_14_days',
    category: 'deal_health',
    source: 'CRM',
    description: 'Deal closes within 14 days but is not yet at Commit or Negotiate stage',
    detectionRule: 'CloseDate between today and today+14 AND Stage NOT IN (Commit, Negotiate)',
    nba: { verb: 'Generate deal status brief', agent: 'generate_account_brief' },
    weight: 90,
    attentionEligible: true,
  },
  {
    id: 'stuck_at_stage',
    category: 'deal_health',
    source: 'CRM',
    description: 'Opportunity has been at the current stage longer than the tenant\'s threshold',
    detectionRule: 'StageName unchanged for > 21 days (LastStageChangeDate + StageName)',
    nba: { verb: 'Generate deal status brief', agent: 'generate_account_brief' },
    weight: 65,
    attentionEligible: true,
  },

  // ─── Engagement ──────────────────────────────────────────────────────
  {
    id: 'no_activity_30d',
    category: 'engagement',
    source: 'CRM',
    description: 'Open opportunity with amount > $0 and no logged activity in 30+ days',
    detectionRule: 'LastActivityDate < today - 30 AND Amount > 0 AND Opportunity is open',
    nba: { verb: 'Draft outreach email', agent: 'draft_personalized_email' },
    weight: 65,
    attentionEligible: true,
  },
  {
    id: 'no_meeting_21d',
    category: 'engagement',
    source: 'CRM',
    description: 'No meeting logged in the last 21 days on this opportunity',
    detectionRule: 'No Event with Type = Meeting in last 21 days on Opportunity',
    nba: { verb: 'Draft a quick sync email', agent: 'draft_personalized_email' },
    weight: 50,
    attentionEligible: true,
  },

  // ─── Relationship Coverage ──────────────────────────────────────────
  {
    id: 'single_threaded',
    category: 'relationship_coverage',
    source: 'CRM',
    description: 'Only one contact linked to this open opportunity — deal is single-threaded',
    detectionRule: 'COUNT(OpportunityContactRole) = 1 AND Stage NOT IN (Closed Won, Closed Lost)',
    nba: { verb: 'Find contacts', agent: 'find_buying_personas' },
    // Weight is dynamic — 80 when the linked opportunity Amount >= $50K, else 40.
    // The detector emits the concrete weight in the firing's context.weight.
    weight: 80,
    attentionEligible: true,
  },
  {
    id: 'no_economic_buyer',
    category: 'relationship_coverage',
    source: 'CRM',
    description: 'No VP/C-level contact linked as Decision Maker on this open opportunity',
    detectionRule: 'No Contact with Title containing VP/C-level in OpportunityContactRole.Role = Decision Maker',
    nba: { verb: 'Find decision makers', agent: 'find_buying_personas' },
    weight: 55,
    attentionEligible: true,
  },
  {
    id: 'no_champion',
    category: 'relationship_coverage',
    source: 'CRM',
    description: 'No contact has the Champion role on this opportunity',
    detectionRule: 'OpportunityContactRole has no Role = Champion',
    nba: { verb: 'Identify a champion', agent: 'find_buying_personas' },
    weight: 45,
    attentionEligible: true,
  },
  {
    id: 'contacts_none_active',
    category: 'relationship_coverage',
    source: 'CRM',
    description: 'Account has contacts on file but none are linked as roles on the open opportunity',
    detectionRule: 'Account has Contacts, none linked as ContactRole on open Opportunity',
    nba: { verb: 'Attach contacts to opp', agent: 'update_crm_contact_fields' },
    weight: 40,
    attentionEligible: false,
  },

  // ─── Deal Risk ──────────────────────────────────────────────────────
  {
    id: 'competitor_mentioned',
    category: 'deal_risk',
    source: 'CRM',
    description: 'Competitor name mentioned in opportunity notes or activity, and deal is late-stage',
    detectionRule: 'Keyword match in Opportunity Description, NextStep, or Task/Call notes',
    nba: { verb: 'Prepare competitive battlecard', agent: 'generate_account_brief' },
    weight: 60,
    attentionEligible: true,
    tenantContextRequired: true,
  },
  {
    id: 'procurement_added_late',
    category: 'deal_risk',
    source: 'CRM',
    description: 'Procurement contact was added late in the cycle — signals scrutiny',
    detectionRule: 'New Contact with Title = Procurement added at Stage ≥ Negotiate',
    nba: { verb: 'Prep for procurement review', agent: 'generate_account_brief' },
    weight: 55,
    attentionEligible: true,
  },
  {
    id: 'late_stage_no_security_review',
    category: 'deal_risk',
    source: 'CRM',
    description: 'Deal is in late stage but no security-review task has been logged',
    detectionRule: 'Stage = Negotiate or Commit AND no Task with Type = Security Review',
    nba: { verb: 'Log security review', agent: 'create_crm_tasks' },
    weight: 50,
    attentionEligible: true,
  },

  // ─── Buyer Intent ────────────────────────────────────────────────────
  {
    id: 'trustradius_intent',
    category: 'buyer_intent',
    source: 'HG data',
    description: 'Account has shown TrustRadius comparison activity in the last 14 days',
    detectionRule: 'TrustRadius intent record within last 14 days',
    nba: { verb: 'Reach out with a peer-comparison angle', agent: 'draft_personalized_email' },
    weight: 45,
    attentionEligible: true,
  },
  {
    id: 'topic_intent',
    category: 'buyer_intent',
    source: 'HG data',
    description: 'Topic intent score elevated for tenant-relevant topics',
    detectionRule: 'Intent score above threshold for tenant-configured topics',
    nba: { verb: 'Reference the intent topic in outreach', agent: 'draft_personalized_email' },
    weight: 40,
    attentionEligible: false,
    tenantContextRequired: true,
  },

  // ─── Account Health ──────────────────────────────────────────────────
  {
    id: 'renewal_not_started',
    category: 'account_health',
    source: 'CRM',
    description: 'Contract end date within 90 days and no renewal-type opportunity exists',
    detectionRule: 'Contract_End_Date within 90 days AND no open Renewal Opportunity',
    nba: { verb: 'Open a renewal opportunity', agent: 'create_crm_tasks' },
    weight: 40,
    attentionEligible: true,
  },
  {
    id: 'multi_opp_conflict',
    category: 'account_health',
    source: 'CRM',
    description: 'Multiple open opportunities on the same account owned by different reps',
    detectionRule: 'COUNT(open Opportunities) ≥ 2 on same AccountId with different Owners',
    nba: { verb: 'Coordinate with other opp owner', agent: 'notify_rep' },
    weight: 35,
    attentionEligible: false,
  },
  {
    id: 'expansion_untapped',
    category: 'account_health',
    source: 'CRM + HG',
    description: 'Customer account with no open expansion opp, but HG signals indicate growth',
    detectionRule: 'Customer with no open Expansion Opp AND HG spend/usage indicates growth',
    nba: { verb: 'Draft an expansion pitch', agent: 'generate_account_brief' },
    weight: 30,
    attentionEligible: false,
  },

  // ─── Competitive (HG) ────────────────────────────────────────────────
  {
    id: 'competitor_install_detected',
    category: 'competitive',
    source: 'HG data',
    description: 'Competitor product installed at this account (per HG technographic data)',
    detectionRule: 'HG installs contain a tenant-configured competitor product',
    nba: {
      verb: 'Draft displacement email',
      agent: 'competitive_battlecard',
      guidance: 'Run a competitive displacement play. Draft an email leading with your key differentiator vs. the specific competitor installed. Get in before the competitor completes onboarding.',
    },
    weight: 45,
    attentionEligible: true,
    tenantContextRequired: true,
  },
  {
    id: 'competitor_momentum_increasing',
    category: 'competitive',
    source: 'HG data',
    description: 'Competitor product install is expanding at this account',
    detectionRule: 'HG install-count trend on competitor product, direction = increasing',
    nba: {
      verb: 'Draft displacement email',
      agent: 'competitive_battlecard',
      guidance: 'For prospects: run displacement play now before they go deeper. For existing customers: flag as churn risk.',
    },
    weight: 55,
    attentionEligible: true,
    tenantContextRequired: true,
  },
  {
    id: 'competitor_momentum_decreasing',
    category: 'competitive',
    source: 'HG data',
    description: 'Competitor product usage is decreasing — high-value displacement moment',
    detectionRule: 'HG install-count trend on competitor product, direction = decreasing',
    nba: {
      verb: 'Draft migration pitch',
      agent: 'competitive_battlecard',
      guidance: 'High-value displacement signal. Reach out with a "we\'ve helped others in your situation migrate from X" message. Pair with a case study. Strike before they re-commit to the competitor.',
    },
    weight: 60,
    attentionEligible: true,
    tenantContextRequired: true,
  },
  {
    id: 'competitor_renewal_window',
    category: 'competitive',
    source: 'HG data',
    description: 'Competitor product install is within the 90-day renewal window',
    detectionRule: 'HG installs show competitor product with install-age ≥ contract-term − 90d',
    nba: {
      verb: 'Launch displacement play',
      agent: 'find_competitor_accounts',
      guidance: 'Launch the full competitive displacement play immediately. Get in before the competitor\'s renewal conversation starts.',
    },
    weight: 65,
    attentionEligible: true,
    tenantContextRequired: true,
  },

  // ─── Partner (HG) ────────────────────────────────────────────────────
  {
    id: 'partner_install_detected',
    category: 'partner',
    source: 'HG data',
    description: 'Complementary partner product installed at this account',
    detectionRule: 'HG installs contain a tenant-configured partner product',
    nba: { verb: 'Loop in partner co-sell', agent: null },
    weight: 25,
    attentionEligible: false,
    tenantContextRequired: true,
  },

  // ─── Product Momentum (HG) ───────────────────────────────────────────
  {
    id: 'tenant_product_momentum',
    category: 'momentum',
    source: 'HG data',
    description: 'Tenant product install trajectory (increasing or decreasing)',
    detectionRule: 'HG install trend on tenant product, direction from delta',
    nba: {
      verb: 'Draft growth pitch',
      agent: 'draft_personalized_email',
      guidance: 'Lead with a growth/scale angle: "As you grow, here\'s how [Your Product] scales with you." For existing customers, this is an expansion signal — propose an upgrade or add-on.',
    },
    weight: 30,
    attentionEligible: true,
    tenantContextRequired: true,
  },

  // ─── 1P Activity ─────────────────────────────────────────────────────
  {
    id: 'sales_activity_7d',
    category: 'first_party_activity',
    source: '1P Data Pipeline',
    description: 'Sales-side activity detected on this account in the last 7 days',
    detectionRule: 'Sales activity event within last 7 days',
    nba: {
      verb: 'View 1P activity',
      agent: null,
      guidance: 'Take them to the 1P activities tab on the account to see the underlying interaction.',
    },
    weight: 30,
    attentionEligible: false,
  },
  {
    id: 'web_activity_7d',
    category: 'first_party_activity',
    source: '1P Data Pipeline',
    description: 'Website activity detected on this account in the last 7 days (e.g. pricing page = high intent, product page = research)',
    detectionRule: 'Web activity event within last 7 days',
    nba: {
      verb: 'Draft interest-based outreach',
      agent: 'draft_personalized_email',
      guidance: 'Draft outreach referencing their area of interest. Combine with HG intent signals for a stronger opening.',
    },
    weight: 35,
    attentionEligible: true,
  },
  {
    id: 'marketing_activity_7d',
    category: 'first_party_activity',
    source: '1P Data Pipeline',
    description: 'Marketing engagement detected on this account in the last 7 days (e.g. form filled, attended webinar)',
    detectionRule: 'Marketing engagement event within last 7 days',
    nba: {
      verb: 'Draft personalized outreach',
      agent: 'draft_personalized_email',
      guidance: 'Personalize outreach referencing the specific marketing activity (webinar attended, content downloaded, form completed).',
    },
    weight: 35,
    attentionEligible: true,
  },
  {
    id: 'app_usage_7d',
    category: 'first_party_activity',
    source: '1P Data Pipeline',
    description: 'App usage detected on this account in the last 7 days',
    detectionRule: 'App usage event within last 7 days',
    nba: {
      verb: 'Propose expansion',
      agent: 'draft_personalized_email',
      guidance: 'Identify power users for expansion or reference conversations. Have CSMs check in to understand use cases. When usage and tenant momentum increase together, propose an upgrade.',
    },
    weight: 40,
    attentionEligible: true,
  },
];

// ─── Lookups ─────────────────────────────────────────────────────────────

const BY_ID = Object.fromEntries(SIGNAL_CATALOG.map((s) => [s.id, s]));

export function getSignalDefinition(id) {
  return BY_ID[id] || null;
}

export function listSignalsInCategory(categoryId) {
  return SIGNAL_CATALOG.filter((s) => s.category === categoryId);
}

export function listAttentionEligibleSignals() {
  return SIGNAL_CATALOG.filter((s) => s.attentionEligible);
}

// The NBA verb is the button label on the Attention Queue row.
export function nbaVerbFor(signalId) {
  return BY_ID[signalId]?.nba?.verb || 'Take action';
}

// The NBA guidance is the seller-facing "why + how" for the signal.
// Used in tooltips and the recommended-play rationale.
export function nbaGuidanceFor(signalId) {
  return BY_ID[signalId]?.nba?.guidance || null;
}
