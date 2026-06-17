// Live component data for the APAC TAM hero conversation.
// Each "variant" represents the data state at a specific turn — when filters
// are added/removed mid-conversation, the AI responds with a new variant.

export const APAC_MARKET_SIZE = {
  initial: {
    tam: { spend: '$14.2B', companies: '14,200', label: 'All APAC Fintech' },
    sam: { spend: '$3.84B', companies: '3,840', label: 'Mid-market matching ICP' },
    som: { spend: '$1.84B', companies: '1,840', label: 'With buying signals' },
    filters: [
      { id: 'industry', label: 'Industry', value: 'Fintech', removable: true },
      { id: 'geography', label: 'Geography', value: 'APAC (5 countries)', removable: true },
      { id: 'employees', label: 'Employees', value: '> 500', removable: true },
      { id: 'modernStack', label: 'Tech stack', value: 'CDP + Salesforce/HubSpot', removable: true },
    ],
    creditUsage: { used: 18420, total: 1000000 },
  },
  noEmployeesFilter: {
    tam: { spend: '$14.2B', companies: '14,200', label: 'All APAC Fintech' },
    sam: { spend: '$5.21B', companies: '5,210', label: 'Mid-market matching ICP' },
    som: { spend: '$2.48B', companies: '2,480', label: 'With buying signals' },
    filters: [
      { id: 'industry', label: 'Industry', value: 'Fintech', removable: true },
      { id: 'geography', label: 'Geography', value: 'APAC (5 countries)', removable: true },
      { id: 'modernStack', label: 'Tech stack', value: 'CDP + Salesforce/HubSpot', removable: true },
    ],
    creditUsage: { used: 19840, total: 1000000 },
  },
};

// MarketBreakdown — by-country, by-industry, by-revenue, by-employees
export const APAC_BREAKDOWNS = {
  country: {
    dimension: 'Country',
    rows: [
      { label: 'Australia', companies: 754, spend: '$754M', pct: 41 },
      { label: 'Singapore', companies: 405, spend: '$401M', pct: 22 },
      { label: 'Japan', companies: 331, spend: '$316M', pct: 18 },
      { label: 'India', companies: 258, spend: '$269M', pct: 14 },
      { label: 'Hong Kong', companies: 92, spend: '$94M', pct: 5 },
    ],
    insight:
      'AU and SG together account for 63% of SOM and have buying signals consistent with your strongest NA cohorts. If you wanted to phase the launch, AU/SG first is the cleaner play.',
  },
  industry: {
    dimension: 'Industry sub-vertical',
    rows: [
      { label: 'Payments', companies: 699, spend: '$701M', pct: 38 },
      { label: 'WealthTech', companies: 442, spend: '$436M', pct: 24 },
      { label: 'Banking SaaS', companies: 331, spend: '$329M', pct: 18 },
      { label: 'InsurTech', companies: 221, spend: '$224M', pct: 12 },
      { label: 'Crypto/Blockchain', companies: 147, spend: '$149M', pct: 8 },
    ],
    insight:
      'Payments and WealthTech together drive 62% of SOM. Crypto/Blockchain is small but growing fast — worth a separate motion if it crosses 15%.',
  },
  revenue: {
    dimension: 'Revenue band',
    rows: [
      { label: '$100M-$500M', companies: 828, spend: '$840M', pct: 45 },
      { label: '$500M-$1B', companies: 515, spend: '$508M', pct: 28 },
      { label: '$1B+', companies: 331, spend: '$331M', pct: 18 },
      { label: '$50M-$100M', companies: 166, spend: '$163M', pct: 9 },
    ],
    insight:
      '73% of SOM lands in the $100M-$1B revenue band — your existing pricing tiers map cleanly here. The $50M-$100M band is small but converts faster historically.',
  },
  employees: {
    dimension: 'Employee count',
    rows: [
      { label: '500-1,000', companies: 699, spend: '$686M', pct: 38 },
      { label: '1,000-2,500', companies: 588, spend: '$589M', pct: 32 },
      { label: '2,500-5,000', companies: 331, spend: '$338M', pct: 18 },
      { label: '5,000+', companies: 221, spend: '$227M', pct: 12 },
    ],
    insight:
      '70% of SOM is in the 500-2,500 headcount band — same target band as your NA closed-won cohort.',
  },
};

// CompetitorPenetration data
export const APAC_COMPETITORS = {
  initial: {
    market: 'APAC Fintech SOM (1,840 companies)',
    competitors: [
      { name: 'ZoomInfo', companies: 590, pct: 32.1, color: '#F59E0B' },
      { name: 'Apollo.io', companies: 147, pct: 8.0, color: '#3B82F6' },
      { name: '6sense', companies: 92, pct: 5.0, color: '#8B5CF6' },
      { name: 'Demandbase', companies: 55, pct: 3.0, color: '#10B981' },
      { name: 'No vendor detected', companies: 956, pct: 51.9, color: '#6B7280' },
    ],
    insight:
      "ZoomInfo is dominant at 32%. But 52% of the market shows no incumbent vendor — that's your cleanest opportunity. Apollo's 8% in this segment is unusually low compared to their 22% NA share, suggesting they haven't prioritized APAC yet.",
  },
  trend: {
    period: 'Last 12 months',
    series: [
      {
        name: 'ZoomInfo',
        color: '#F59E0B',
        points: [
          { month: 'Apr 2025', pct: 30.4 },
          { month: 'Jul 2025', pct: 31.0 },
          { month: 'Oct 2025', pct: 31.8 },
          { month: 'Jan 2026', pct: 32.1 },
        ],
      },
      {
        name: 'Apollo.io',
        color: '#3B82F6',
        points: [
          { month: 'Apr 2025', pct: 3.2 },
          { month: 'Jul 2025', pct: 4.8 },
          { month: 'Oct 2025', pct: 6.4 },
          { month: 'Jan 2026', pct: 8.0 },
        ],
      },
    ],
    insight:
      "Apollo's penetration grew 2.5x in 12 months — that's the fastest-growing competitor signal in APAC. If their trajectory holds, they'll cross 15% by Q4. Worth flagging as a competitive risk.",
  },
};

// CompanyList — top whitespace + customer accounts in APAC SOM
export const APAC_COMPANIES = [
  {
    id: 'c1',
    name: 'Afterpay',
    url: 'afterpay.com',
    country: 'Australia',
    employees: '1,200',
    revenue: '$924M',
    itSpend: '$48M',
    competitor: 'ZoomInfo',
    opportunity: 'Customer',
    industry: 'Payments',
  },
  {
    id: 'c2',
    name: 'Airwallex',
    url: 'airwallex.com',
    country: 'Australia',
    employees: '1,500',
    revenue: '$680M',
    itSpend: '$32M',
    competitor: 'None',
    opportunity: 'Prospect Whitespace',
    industry: 'Payments',
  },
  {
    id: 'c3',
    name: 'StashAway',
    url: 'stashaway.com',
    country: 'Singapore',
    employees: '320',
    revenue: '$185M',
    itSpend: '$8M',
    competitor: 'Apollo.io',
    opportunity: 'Prospect Whitespace',
    industry: 'WealthTech',
  },
  {
    id: 'c4',
    name: 'Tiger Brokers',
    url: 'itigerup.com',
    country: 'Singapore',
    employees: '950',
    revenue: '$412M',
    itSpend: '$22M',
    competitor: 'ZoomInfo',
    opportunity: 'Expansion Whitespace',
    industry: 'WealthTech',
  },
  {
    id: 'c5',
    name: 'Mercari',
    url: 'mercari.com',
    country: 'Japan',
    employees: '1,820',
    revenue: '$1.1B',
    itSpend: '$58M',
    competitor: 'None',
    opportunity: 'Prospect Whitespace',
    industry: 'Payments',
  },
  {
    id: 'c6',
    name: 'PayPay',
    url: 'paypay.ne.jp',
    country: 'Japan',
    employees: '2,400',
    revenue: '$1.4B',
    itSpend: '$72M',
    competitor: 'ZoomInfo',
    opportunity: 'Customer',
    industry: 'Payments',
  },
  {
    id: 'c7',
    name: 'Razorpay',
    url: 'razorpay.com',
    country: 'India',
    employees: '2,800',
    revenue: '$580M',
    itSpend: '$28M',
    competitor: 'None',
    opportunity: 'Prospect Whitespace',
    industry: 'Payments',
  },
  {
    id: 'c8',
    name: 'PolicyBazaar',
    url: 'policybazaar.com',
    country: 'India',
    employees: '4,200',
    revenue: '$320M',
    itSpend: '$18M',
    competitor: 'Apollo.io',
    opportunity: 'Expansion Whitespace',
    industry: 'InsurTech',
  },
  {
    id: 'c9',
    name: 'WeLab',
    url: 'welab.co',
    country: 'Hong Kong',
    employees: '780',
    revenue: '$240M',
    itSpend: '$11M',
    competitor: 'None',
    opportunity: 'Prospect Whitespace',
    industry: 'Banking SaaS',
  },
  {
    id: 'c10',
    name: 'Xendit',
    url: 'xendit.co',
    country: 'Singapore',
    employees: '650',
    revenue: '$210M',
    itSpend: '$9M',
    competitor: 'None',
    opportunity: 'Prospect Whitespace',
    industry: 'Payments',
  },
  {
    id: 'c11',
    name: 'Cred',
    url: 'cred.club',
    country: 'India',
    employees: '900',
    revenue: '$148M',
    itSpend: '$7M',
    competitor: '6sense',
    opportunity: 'Prospect Whitespace',
    industry: 'WealthTech',
  },
  {
    id: 'c12',
    name: 'GoTo Financial',
    url: 'gotofinancial.com',
    country: 'Indonesia',
    employees: '3,100',
    revenue: '$890M',
    itSpend: '$42M',
    competitor: 'ZoomInfo',
    opportunity: 'Expansion Whitespace',
    industry: 'Payments',
  },
];
