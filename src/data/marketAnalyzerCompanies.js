// Market Analyzer Companies — the alphabetical universe view backing the
// MA Companies page.
//
// In production this is a backed-by-warehouse list of HG's full 38.8M
// company universe with cursor-pagination and server-side filtering.
// For the RGI Northstar prototype we curate ~80 companies (book accounts
// + whitespace + CRM-only + a "broad name list" extension) so the table
// feels populated alphabetically and conveys hierarchy. The "of 38.8M"
// hint communicates the production scale.
//
// Each row carries the columns the MA Companies page renders:
//   - name             (with subsidiaries indicator for hierarchy)
//   - employees        (fai.employees)
//   - revenue          (fai.revenue)
//   - hq               (fai.hq)
//   - industry
//   - itSpend          (rgif.spend.total)
// Plus auxiliary fields used by filters (clouds, intent, installs).
//
// Sort is stable alphabetical on name (case-insensitive).

import { ACCOUNTS_BY_OWNER } from './accounts.js';
import { WHITESPACE_ACCOUNTS } from './whitespaceAccounts.js';
import { CRM_ONLY_ACCOUNTS } from './unifiedWorkbook.js';
import { getRGIF } from './workbookRGIF.js';

// Curated "extras" — well-known companies with realistic firmographic
// data that aren't part of the existing book/whitespace seeds. Designed
// to give the alphabetical table breadth across industries + sizes.
// IT-spend is set as a coarse band derived from revenue (~0.3-1.5% of
// revenue for non-tech; ~3-6% for tech / regulated finance).
export const MA_COMPANY_EXTRAS = [
  {
    id: 'mac-abbvie',
    name: 'AbbVie',
    industry: 'Pharmaceutical Manufacturing',
    logoColor: '#071D49',
    fai: { revenue: '$58.1B', employees: '50K', hq: 'North Chicago, IL', stage: 'Public (NYSE)' },
    itSpend: '$420M',
  },
  {
    id: 'mac-accenture',
    name: 'Accenture',
    industry: 'Professional Services',
    logoColor: '#A100FF',
    fai: { revenue: '$64.9B', employees: '774K', hq: 'Dublin, Ireland', stage: 'Public (NYSE)' },
    itSpend: '$1.1B',
  },
  {
    id: 'mac-adobe',
    name: 'Adobe',
    industry: 'Software Publishers',
    logoColor: '#FF0000',
    fai: { revenue: '$19.4B', employees: '29K', hq: 'San Jose, CA', stage: 'Public (NASDAQ)' },
    itSpend: '$680M',
  },
  {
    id: 'mac-aig',
    name: 'AIG',
    industry: 'Insurance',
    logoColor: '#003791',
    fai: { revenue: '$46.7B', employees: '26K', hq: 'New York, NY', stage: 'Public (NYSE)' },
    itSpend: '$320M',
  },
  {
    id: 'mac-allstate',
    name: 'Allstate',
    industry: 'Insurance',
    logoColor: '#003DA5',
    fai: { revenue: '$57.1B', employees: '54K', hq: 'Northbrook, IL', stage: 'Public (NYSE)' },
    itSpend: '$390M',
  },
  {
    id: 'mac-amazon',
    name: 'Amazon',
    subsidiaries: [
      { name: 'Amazon Web Services', employees: '110K' },
      { name: 'Whole Foods Market', employees: '105K' },
      { name: 'Twitch', employees: '2K' },
      { name: 'Ring', employees: '3K' },
    ],
    industry: 'Internet Retail',
    logoColor: '#FF9900',
    fai: { revenue: '$574.8B', employees: '1.5M', hq: 'Seattle, WA', stage: 'Public (NASDAQ)' },
    itSpend: '$5.2B',
  },
  {
    id: 'mac-american-airlines',
    name: 'American Airlines',
    industry: 'Air Transportation',
    logoColor: '#0078D2',
    fai: { revenue: '$52.8B', employees: '129K', hq: 'Fort Worth, TX', stage: 'Public (NASDAQ)' },
    itSpend: '$240M',
  },
  {
    id: 'mac-american-express',
    name: 'American Express',
    industry: 'Banking and Financial Services',
    logoColor: '#006FCF',
    fai: { revenue: '$60.5B', employees: '77K', hq: 'New York, NY', stage: 'Public (NYSE)' },
    itSpend: '$880M',
  },
  {
    id: 'mac-apple',
    name: 'Apple',
    industry: 'Computer and Electronic Product Manufacturing',
    logoColor: '#000000',
    fai: { revenue: '$383.3B', employees: '161K', hq: 'Cupertino, CA', stage: 'Public (NASDAQ)' },
    itSpend: '$3.4B',
  },
  {
    id: 'mac-att',
    name: 'AT&T',
    industry: 'Telecommunications',
    logoColor: '#00A8E0',
    fai: { revenue: '$122.4B', employees: '149K', hq: 'Dallas, TX', stage: 'Public (NYSE)' },
    itSpend: '$1.4B',
  },
  {
    id: 'mac-bank-of-america',
    name: 'Bank of America',
    subsidiaries: [
      { name: 'Merrill Lynch', employees: '32K' },
      { name: 'BofA Securities', employees: '5K' },
    ],
    industry: 'Banking and Financial Services',
    logoColor: '#012169',
    fai: { revenue: '$98.6B', employees: '213K', hq: 'Charlotte, NC', stage: 'Public (NYSE)' },
    itSpend: '$1.6B',
  },
  {
    id: 'mac-best-buy',
    name: 'Best Buy',
    industry: 'Retail',
    logoColor: '#FFF200',
    fai: { revenue: '$43.5B', employees: '85K', hq: 'Richfield, MN', stage: 'Public (NYSE)' },
    itSpend: '$180M',
  },
  {
    id: 'mac-boeing',
    name: 'Boeing',
    industry: 'Aerospace Manufacturing',
    logoColor: '#0033A0',
    fai: { revenue: '$77.8B', employees: '156K', hq: 'Arlington, VA', stage: 'Public (NYSE)' },
    itSpend: '$520M',
  },
  {
    id: 'mac-capital-one',
    name: 'Capital One',
    industry: 'Banking and Financial Services',
    logoColor: '#004977',
    fai: { revenue: '$36.8B', employees: '52K', hq: 'McLean, VA', stage: 'Public (NYSE)' },
    itSpend: '$640M',
  },
  {
    id: 'mac-caterpillar',
    name: 'Caterpillar',
    industry: 'Industrial Manufacturing',
    logoColor: '#FFCD11',
    fai: { revenue: '$67.1B', employees: '109K', hq: 'Irving, TX', stage: 'Public (NYSE)' },
    itSpend: '$310M',
  },
  {
    id: 'mac-chevron',
    name: 'Chevron',
    industry: 'Energy',
    logoColor: '#0E50A0',
    fai: { revenue: '$200.9B', employees: '45K', hq: 'San Ramon, CA', stage: 'Public (NYSE)' },
    itSpend: '$680M',
  },
  {
    id: 'mac-cigna',
    name: 'Cigna',
    industry: 'Health Insurance',
    logoColor: '#FF6F00',
    fai: { revenue: '$195.3B', employees: '70K', hq: 'Bloomfield, CT', stage: 'Public (NYSE)' },
    itSpend: '$890M',
  },
  {
    id: 'mac-cisco',
    name: 'Cisco Systems',
    industry: 'Computer and Electronic Product Manufacturing',
    logoColor: '#1BA0D7',
    fai: { revenue: '$57.0B', employees: '85K', hq: 'San Jose, CA', stage: 'Public (NASDAQ)' },
    itSpend: '$1.3B',
  },
  {
    id: 'mac-citi',
    name: 'Citigroup',
    industry: 'Banking and Financial Services',
    logoColor: '#003B70',
    fai: { revenue: '$75.3B', employees: '240K', hq: 'New York, NY', stage: 'Public (NYSE)' },
    itSpend: '$1.5B',
  },
  {
    id: 'mac-coca-cola',
    name: 'Coca-Cola',
    industry: 'Beverage Manufacturing',
    logoColor: '#F40009',
    fai: { revenue: '$46.0B', employees: '79K', hq: 'Atlanta, GA', stage: 'Public (NYSE)' },
    itSpend: '$230M',
  },
  {
    id: 'mac-comcast',
    name: 'Comcast',
    subsidiaries: [
      { name: 'NBCUniversal', employees: '40K' },
      { name: 'Sky', employees: '24K' },
      { name: 'Xfinity Mobile', employees: '5K' },
    ],
    industry: 'Telecommunications',
    logoColor: '#000000',
    fai: { revenue: '$121.6B', employees: '186K', hq: 'Philadelphia, PA', stage: 'Public (NASDAQ)' },
    itSpend: '$1.1B',
  },
  {
    id: 'mac-costco',
    name: 'Costco',
    industry: 'Retail',
    logoColor: '#E31837',
    fai: { revenue: '$249.6B', employees: '316K', hq: 'Issaquah, WA', stage: 'Public (NASDAQ)' },
    itSpend: '$310M',
  },
  {
    id: 'mac-cvs',
    name: 'CVS Health',
    subsidiaries: [
      { name: 'Aetna', employees: '50K' },
      { name: 'Caremark', employees: '8K' },
    ],
    industry: 'Healthcare',
    logoColor: '#CC0000',
    fai: { revenue: '$357.8B', employees: '300K', hq: 'Woonsocket, RI', stage: 'Public (NYSE)' },
    itSpend: '$1.2B',
  },
  {
    id: 'mac-databricks',
    name: 'Databricks',
    industry: 'Software Publishers',
    logoColor: '#FF3621',
    fai: { revenue: '$2.4B', employees: '7.3K', hq: 'San Francisco, CA', stage: 'Private (Series I)' },
    itSpend: '$140M',
  },
  {
    id: 'mac-delta',
    name: 'Delta Air Lines',
    industry: 'Air Transportation',
    logoColor: '#003366',
    fai: { revenue: '$58.0B', employees: '100K', hq: 'Atlanta, GA', stage: 'Public (NYSE)' },
    itSpend: '$260M',
  },
  {
    id: 'mac-deutsche-bank',
    name: 'Deutsche Bank',
    industry: 'Banking and Financial Services',
    logoColor: '#012169',
    fai: { revenue: '$31.3B', employees: '90K', hq: 'Frankfurt, Germany', stage: 'Public (NYSE)' },
    itSpend: '$540M',
  },
  {
    id: 'mac-disney',
    name: 'Disney',
    subsidiaries: [
      { name: 'Disney+', employees: '5K' },
      { name: 'Hulu', employees: '4K' },
      { name: 'ESPN', employees: '8K' },
      { name: 'Marvel Studios', employees: '2K' },
    ],
    industry: 'Media & Entertainment',
    logoColor: '#000080',
    fai: { revenue: '$88.9B', employees: '225K', hq: 'Burbank, CA', stage: 'Public (NYSE)' },
    itSpend: '$720M',
  },
  {
    id: 'mac-exxon',
    name: 'ExxonMobil',
    industry: 'Energy',
    logoColor: '#E32726',
    fai: { revenue: '$334.7B', employees: '62K', hq: 'Spring, TX', stage: 'Public (NYSE)' },
    itSpend: '$890M',
  },
  {
    id: 'mac-fedex',
    name: 'FedEx',
    industry: 'Logistics & Transportation',
    logoColor: '#4D148C',
    fai: { revenue: '$87.7B', employees: '529K', hq: 'Memphis, TN', stage: 'Public (NYSE)' },
    itSpend: '$520M',
  },
  {
    id: 'mac-ford',
    name: 'Ford Motor Company',
    industry: 'Automotive Manufacturing',
    logoColor: '#003478',
    fai: { revenue: '$176.2B', employees: '177K', hq: 'Dearborn, MI', stage: 'Public (NYSE)' },
    itSpend: '$640M',
  },
  {
    id: 'mac-ge',
    name: 'General Electric',
    industry: 'Industrial Manufacturing',
    logoColor: '#005EB8',
    fai: { revenue: '$67.9B', employees: '125K', hq: 'Boston, MA', stage: 'Public (NYSE)' },
    itSpend: '$420M',
  },
  {
    id: 'mac-gm',
    name: 'General Motors',
    industry: 'Automotive Manufacturing',
    logoColor: '#005DAA',
    fai: { revenue: '$171.8B', employees: '163K', hq: 'Detroit, MI', stage: 'Public (NYSE)' },
    itSpend: '$580M',
  },
  {
    id: 'mac-google',
    name: 'Google',
    subsidiaries: [
      { name: 'YouTube', employees: '15K' },
      { name: 'Google Cloud', employees: '40K' },
      { name: 'Waymo', employees: '2.5K' },
    ],
    industry: 'Software Publishers',
    logoColor: '#4285F4',
    fai: { revenue: '$307.4B', employees: '182K', hq: 'Mountain View, CA', stage: 'Public (NASDAQ)' },
    itSpend: '$4.8B',
  },
  {
    id: 'mac-hca',
    name: 'HCA Healthcare',
    industry: 'Healthcare',
    logoColor: '#005DAA',
    fai: { revenue: '$64.9B', employees: '283K', hq: 'Nashville, TN', stage: 'Public (NYSE)' },
    itSpend: '$340M',
  },
  {
    id: 'mac-home-depot',
    name: 'Home Depot',
    industry: 'Retail',
    logoColor: '#F96302',
    fai: { revenue: '$152.7B', employees: '475K', hq: 'Atlanta, GA', stage: 'Public (NYSE)' },
    itSpend: '$420M',
  },
  {
    id: 'mac-honeywell',
    name: 'Honeywell',
    industry: 'Industrial Manufacturing',
    logoColor: '#EE2128',
    fai: { revenue: '$36.7B', employees: '95K', hq: 'Charlotte, NC', stage: 'Public (NASDAQ)' },
    itSpend: '$290M',
  },
  {
    id: 'mac-ibm',
    name: 'IBM',
    subsidiaries: [
      { name: 'Red Hat', employees: '20K' },
      { name: 'IBM Consulting', employees: '160K' },
    ],
    industry: 'Software Publishers',
    logoColor: '#1F70C1',
    fai: { revenue: '$61.9B', employees: '288K', hq: 'Armonk, NY', stage: 'Public (NYSE)' },
    itSpend: '$1.4B',
  },
  {
    id: 'mac-intel',
    name: 'Intel',
    industry: 'Computer and Electronic Product Manufacturing',
    logoColor: '#0071C5',
    fai: { revenue: '$54.2B', employees: '124K', hq: 'Santa Clara, CA', stage: 'Public (NASDAQ)' },
    itSpend: '$1.2B',
  },
  {
    id: 'mac-johnson-johnson',
    name: 'Johnson & Johnson',
    industry: 'Pharmaceutical Manufacturing',
    logoColor: '#CC0000',
    fai: { revenue: '$85.2B', employees: '152K', hq: 'New Brunswick, NJ', stage: 'Public (NYSE)' },
    itSpend: '$620M',
  },
  {
    id: 'mac-kaiser',
    name: 'Kaiser Permanente',
    industry: 'Healthcare',
    logoColor: '#006BA6',
    fai: { revenue: '$100.8B', employees: '309K', hq: 'Oakland, CA', stage: 'Private (Nonprofit)' },
    itSpend: '$480M',
  },
  {
    id: 'mac-lockheed',
    name: 'Lockheed Martin',
    industry: 'Aerospace Manufacturing',
    logoColor: '#11365E',
    fai: { revenue: '$67.6B', employees: '122K', hq: 'Bethesda, MD', stage: 'Public (NYSE)' },
    itSpend: '$540M',
  },
  {
    id: 'mac-lowes',
    name: "Lowe's",
    industry: 'Retail',
    logoColor: '#004990',
    fai: { revenue: '$86.4B', employees: '300K', hq: 'Mooresville, NC', stage: 'Public (NYSE)' },
    itSpend: '$280M',
  },
  {
    id: 'mac-marriott',
    name: 'Marriott International',
    industry: 'Hospitality',
    logoColor: '#A30D2F',
    fai: { revenue: '$23.7B', employees: '410K', hq: 'Bethesda, MD', stage: 'Public (NASDAQ)' },
    itSpend: '$210M',
  },
  {
    id: 'mac-mastercard',
    name: 'Mastercard',
    industry: 'Banking and Financial Services',
    logoColor: '#EB001B',
    fai: { revenue: '$25.1B', employees: '33K', hq: 'Purchase, NY', stage: 'Public (NYSE)' },
    itSpend: '$520M',
  },
  {
    id: 'mac-merck',
    name: 'Merck',
    industry: 'Pharmaceutical Manufacturing',
    logoColor: '#00857C',
    fai: { revenue: '$60.1B', employees: '71K', hq: 'Rahway, NJ', stage: 'Public (NYSE)' },
    itSpend: '$420M',
  },
  {
    id: 'mac-meta',
    name: 'Meta',
    subsidiaries: [
      { name: 'Instagram', employees: '5K' },
      { name: 'WhatsApp', employees: '2K' },
      { name: 'Reality Labs', employees: '15K' },
    ],
    industry: 'Software Publishers',
    logoColor: '#0866FF',
    fai: { revenue: '$134.9B', employees: '67K', hq: 'Menlo Park, CA', stage: 'Public (NASDAQ)' },
    itSpend: '$3.6B',
  },
  {
    id: 'mac-microsoft',
    name: 'Microsoft',
    subsidiaries: [
      { name: 'LinkedIn', employees: '21K' },
      { name: 'GitHub', employees: '3.5K' },
      { name: 'Xbox Game Studios', employees: '12K' },
    ],
    industry: 'Software Publishers',
    logoColor: '#0078D4',
    fai: { revenue: '$245.1B', employees: '228K', hq: 'Redmond, WA', stage: 'Public (NASDAQ)' },
    itSpend: '$4.2B',
  },
  {
    id: 'mac-morgan-stanley',
    name: 'Morgan Stanley',
    industry: 'Banking and Financial Services',
    logoColor: '#003F7F',
    fai: { revenue: '$54.1B', employees: '80K', hq: 'New York, NY', stage: 'Public (NYSE)' },
    itSpend: '$880M',
  },
  {
    id: 'mac-netflix',
    name: 'Netflix',
    industry: 'Media & Entertainment',
    logoColor: '#E50914',
    fai: { revenue: '$33.7B', employees: '13K', hq: 'Los Gatos, CA', stage: 'Public (NASDAQ)' },
    itSpend: '$680M',
  },
  {
    id: 'mac-nike',
    name: 'Nike',
    industry: 'Retail',
    logoColor: '#000000',
    fai: { revenue: '$51.4B', employees: '79K', hq: 'Beaverton, OR', stage: 'Public (NYSE)' },
    itSpend: '$260M',
  },
  {
    id: 'mac-northrop',
    name: 'Northrop Grumman',
    industry: 'Aerospace Manufacturing',
    logoColor: '#003D7C',
    fai: { revenue: '$39.3B', employees: '101K', hq: 'Falls Church, VA', stage: 'Public (NYSE)' },
    itSpend: '$310M',
  },
  {
    id: 'mac-nvidia',
    name: 'NVIDIA',
    industry: 'Computer and Electronic Product Manufacturing',
    logoColor: '#76B900',
    fai: { revenue: '$60.9B', employees: '30K', hq: 'Santa Clara, CA', stage: 'Public (NASDAQ)' },
    itSpend: '$1.6B',
  },
  {
    id: 'mac-oracle',
    name: 'Oracle',
    industry: 'Software Publishers',
    logoColor: '#C74634',
    fai: { revenue: '$50.0B', employees: '164K', hq: 'Austin, TX', stage: 'Public (NYSE)' },
    itSpend: '$1.1B',
  },
  {
    id: 'mac-pepsico',
    name: 'PepsiCo',
    industry: 'Beverage Manufacturing',
    logoColor: '#004B93',
    fai: { revenue: '$91.5B', employees: '318K', hq: 'Purchase, NY', stage: 'Public (NASDAQ)' },
    itSpend: '$420M',
  },
  {
    id: 'mac-pfizer',
    name: 'Pfizer',
    industry: 'Pharmaceutical Manufacturing',
    logoColor: '#0093D0',
    fai: { revenue: '$58.5B', employees: '88K', hq: 'New York, NY', stage: 'Public (NYSE)' },
    itSpend: '$520M',
  },
  {
    id: 'mac-procter-gamble',
    name: 'Procter & Gamble',
    industry: 'Consumer Goods',
    logoColor: '#003DA5',
    fai: { revenue: '$82.0B', employees: '107K', hq: 'Cincinnati, OH', stage: 'Public (NYSE)' },
    itSpend: '$340M',
  },
  {
    id: 'mac-prudential',
    name: 'Prudential',
    industry: 'Insurance',
    logoColor: '#001E60',
    fai: { revenue: '$58.0B', employees: '40K', hq: 'Newark, NJ', stage: 'Public (NYSE)' },
    itSpend: '$310M',
  },
  {
    id: 'mac-raytheon',
    name: 'Raytheon Technologies',
    industry: 'Aerospace Manufacturing',
    logoColor: '#DA291C',
    fai: { revenue: '$68.9B', employees: '185K', hq: 'Arlington, VA', stage: 'Public (NYSE)' },
    itSpend: '$480M',
  },
  {
    id: 'mac-salesforce',
    name: 'Salesforce',
    subsidiaries: [
      { name: 'Slack', employees: '2.5K' },
      { name: 'Tableau', employees: '5K' },
      { name: 'MuleSoft', employees: '3K' },
    ],
    industry: 'Software Publishers',
    logoColor: '#00A1E0',
    fai: { revenue: '$34.9B', employees: '72K', hq: 'San Francisco, CA', stage: 'Public (NYSE)' },
    itSpend: '$890M',
  },
  {
    id: 'mac-shell',
    name: 'Shell',
    industry: 'Energy',
    logoColor: '#FBCE07',
    fai: { revenue: '$316.6B', employees: '93K', hq: 'London, UK', stage: 'Public (LSE)' },
    itSpend: '$1.1B',
  },
  {
    id: 'mac-southwest',
    name: 'Southwest Airlines',
    industry: 'Air Transportation',
    logoColor: '#304CB2',
    fai: { revenue: '$26.1B', employees: '74K', hq: 'Dallas, TX', stage: 'Public (NYSE)' },
    itSpend: '$160M',
  },
  {
    id: 'mac-starbucks',
    name: 'Starbucks',
    industry: 'Restaurants',
    logoColor: '#006241',
    fai: { revenue: '$36.0B', employees: '402K', hq: 'Seattle, WA', stage: 'Public (NASDAQ)' },
    itSpend: '$190M',
  },
  {
    id: 'mac-stripe',
    name: 'Stripe',
    industry: 'Banking and Financial Services',
    logoColor: '#635BFF',
    fai: { revenue: '$18.3B', employees: '8.5K', hq: 'South San Francisco, CA', stage: 'Private (Series I)' },
    itSpend: '$310M',
  },
  {
    id: 'mac-target',
    name: 'Target',
    industry: 'Retail',
    logoColor: '#CC0000',
    fai: { revenue: '$107.4B', employees: '440K', hq: 'Minneapolis, MN', stage: 'Public (NYSE)' },
    itSpend: '$420M',
  },
  {
    id: 'mac-tesla',
    name: 'Tesla',
    industry: 'Automotive Manufacturing',
    logoColor: '#CC0000',
    fai: { revenue: '$96.8B', employees: '140K', hq: 'Austin, TX', stage: 'Public (NASDAQ)' },
    itSpend: '$640M',
  },
  {
    id: 'mac-toyota',
    name: 'Toyota North America',
    industry: 'Automotive Manufacturing',
    logoColor: '#EB0A1E',
    fai: { revenue: '$280.8B', employees: '378K', hq: 'Plano, TX', stage: 'Public (NYSE)' },
    itSpend: '$890M',
  },
  {
    id: 'mac-uber',
    name: 'Uber',
    industry: 'Transportation Services',
    logoColor: '#000000',
    fai: { revenue: '$37.3B', employees: '32K', hq: 'San Francisco, CA', stage: 'Public (NYSE)' },
    itSpend: '$420M',
  },
  {
    id: 'mac-unitedhealth',
    name: 'UnitedHealth Group',
    subsidiaries: [
      { name: 'Optum', employees: '210K' },
      { name: 'UnitedHealthcare', employees: '160K' },
    ],
    industry: 'Health Insurance',
    logoColor: '#002677',
    fai: { revenue: '$371.6B', employees: '440K', hq: 'Minnetonka, MN', stage: 'Public (NYSE)' },
    itSpend: '$1.9B',
  },
  {
    id: 'mac-ups',
    name: 'UPS',
    industry: 'Logistics & Transportation',
    logoColor: '#351C15',
    fai: { revenue: '$90.9B', employees: '500K', hq: 'Atlanta, GA', stage: 'Public (NYSE)' },
    itSpend: '$480M',
  },
  {
    id: 'mac-us-bank',
    name: 'US Bank',
    industry: 'Banking and Financial Services',
    logoColor: '#0C2074',
    fai: { revenue: '$28.0B', employees: '76K', hq: 'Minneapolis, MN', stage: 'Public (NYSE)' },
    itSpend: '$390M',
  },
  {
    id: 'mac-verizon',
    name: 'Verizon',
    industry: 'Telecommunications',
    logoColor: '#CD040B',
    fai: { revenue: '$133.9B', employees: '105K', hq: 'New York, NY', stage: 'Public (NYSE)' },
    itSpend: '$1.3B',
  },
  {
    id: 'mac-visa',
    name: 'Visa',
    industry: 'Banking and Financial Services',
    logoColor: '#1A1F71',
    fai: { revenue: '$33.4B', employees: '28K', hq: 'San Francisco, CA', stage: 'Public (NYSE)' },
    itSpend: '$680M',
  },
  {
    id: 'mac-walgreens',
    name: 'Walgreens',
    industry: 'Healthcare',
    logoColor: '#E31836',
    fai: { revenue: '$139.1B', employees: '331K', hq: 'Deerfield, IL', stage: 'Public (NASDAQ)' },
    itSpend: '$540M',
  },
  {
    id: 'mac-walmart',
    name: 'Walmart',
    subsidiaries: [
      { name: "Sam's Club", employees: '100K' },
      { name: 'Walmart International', employees: '550K' },
    ],
    industry: 'Retail',
    logoColor: '#0071CE',
    fai: { revenue: '$648.1B', employees: '2.1M', hq: 'Bentonville, AR', stage: 'Public (NYSE)' },
    itSpend: '$2.1B',
  },
];

// Normalize a row into the common shape the MA Companies table expects.
// itSpend is sourced (in order): explicit `itSpend` → rgif.spend.total →
// looked up via getRGIF(id).spend.total. Falls back to null.
function normalizeCompany(raw) {
  const rgif = raw.rgif || getRGIF(raw.id) || {};
  const itSpend =
    raw.itSpend ||
    rgif?.spend?.total ||
    null;
  return {
    id: raw.id,
    name: raw.name,
    industry: raw.industry || '—',
    logoColor: raw.logoColor,
    fai: raw.fai || {},
    subsidiaries: Array.isArray(raw.subsidiaries) ? raw.subsidiaries : [],
    itSpend,
    clouds: rgif?.clouds || [],
    intent: rgif?.intent || [],
    installs: rgif?.installs || {},
    isFortune: rgif?.isFortune || false,
    isMultinational: rgif?.isMultinational || false,
  };
}

// Returns the full alphabetically-sorted company universe used by the MA
// Companies page. In production this is a paged server query — here we
// curate so the prototype demonstrates the shape.
export function getMarketAnalyzerCompanies() {
  const book = (ACCOUNTS_BY_OWNER.alex || []).map(normalizeCompany);
  const whitespace = WHITESPACE_ACCOUNTS.map(normalizeCompany);
  const crmOnly = CRM_ONLY_ACCOUNTS.map(normalizeCompany);
  const extras = MA_COMPANY_EXTRAS.map(normalizeCompany);
  // Dedupe by case-insensitive name (book + whitespace + extras can overlap
  // on common companies — e.g. Snowflake is in both alex's book and as an
  // intent target).
  const seen = new Set();
  const all = [...book, ...whitespace, ...crmOnly, ...extras].filter((c) => {
    const k = (c.name || '').toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return all.sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' }),
  );
}

// Total universe size as displayed in the "showing X of Y" hint. The
// real HG company universe is ~38.8M; we surface that as the production
// scale even though the prototype renders ~80.
export const MA_TOTAL_UNIVERSE = 38_800_000;
