import { VIPProduct, GiftCode, PlatformSettings } from '../types';

export const NIGERIAN_BANKS = [
  'Access Bank',
  'Guaranty Trust Bank (GTBank)',
  'Zenith Bank',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Kuda Microfinance Bank',
  'OPay Digital Services',
  'PalmPay',
  'Fidelity Bank',
  'Union Bank of Nigeria',
  'Stanbic IBTC Bank',
  'Sterling Bank',
  'First City Monument Bank (FCMB)',
  'Wema Bank (ALAT)',
  'Ecobank Nigeria',
  'Polaris Bank',
  'Keystone Bank',
  'Moniepoint MFB',
  'Taj Bank',
  'Jaiz Bank'
];

export const INITIAL_PRODUCTS: VIPProduct[] = [
  {
    id: 'vip1',
    vipLevel: 'VIP1',
    title: 'Dangote Express Micro Share Tranche (₦5,000)',
    price: 5000,
    validityDays: 60,
    dailyIncome: 600,
    totalIncome: 36000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    category: 'Public IPO'
  },
  {
    id: 'vip2',
    vipLevel: 'VIP2',
    title: 'Dangote Retail Class-A Shares (Lekki Single-Train)',
    price: 7500,
    validityDays: 60,
    dailyIncome: 950,
    totalIncome: 57000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80',
    category: 'Public IPO'
  },
  {
    id: 'vip3',
    vipLevel: 'VIP3',
    title: 'Dangote Polypropylene & Fertilizer Complex Tranche',
    price: 15000,
    validityDays: 60,
    dailyIncome: 2100,
    totalIncome: 126000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800&auto=format&fit=crop&q=80',
    category: 'Petrochemical VIP Institutional'
  },
  {
    id: 'vip4',
    vipLevel: 'VIP4',
    title: 'Dangote Deepwater Marine Terminal Quota',
    price: 30000,
    validityDays: 60,
    dailyIncome: 4500,
    totalIncome: 270000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1565793979201-3e81edc2d63a?w=800&auto=format&fit=crop&q=80',
    category: 'Petrochemical VIP Institutional'
  },
  {
    id: 'vip5',
    vipLevel: 'VIP5',
    title: 'Dangote Crude Super-Tanker Fleet Syndicate',
    price: 75000,
    validityDays: 60,
    dailyIncome: 12000,
    totalIncome: 720000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=800&auto=format&fit=crop&q=80',
    category: 'Petrochemical VIP Institutional'
  },
  {
    id: 'vip6',
    vipLevel: 'VIP6',
    title: 'Dangote Refinery 650,000 BPD Mega-Train Share',
    price: 150000,
    validityDays: 60,
    dailyIncome: 26000,
    totalIncome: 1560000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80',
    category: 'Petrochemical VIP Institutional'
  },
  {
    id: 'vip7',
    vipLevel: 'VIP7',
    title: 'Dangote Pan-African Petrochemical Holding',
    price: 300000,
    validityDays: 60,
    dailyIncome: 56000,
    totalIncome: 3360000,
    status: 'coming_soon',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
    category: 'Institutional Equity'
  },
  {
    id: 'vip8',
    vipLevel: 'VIP8',
    title: 'Dangote Global Energy Syndicate Equity',
    price: 600000,
    validityDays: 60,
    dailyIncome: 120000,
    totalIncome: 7200000,
    status: 'coming_soon',
    image: 'https://images.unsplash.com/photo-1508873696983-2df57046475b?w=800&auto=format&fit=crop&q=80',
    category: 'Institutional Equity'
  },
  {
    id: 'vip9',
    vipLevel: 'VIP9',
    title: 'Dangote Board of Governors Sovereign Share',
    price: 1200000,
    validityDays: 60,
    dailyIncome: 260000,
    totalIncome: 15600000,
    status: 'coming_soon',
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
    category: 'Sovereign Syndicate'
  }
];

export const INITIAL_GIFT_CODES: GiftCode[] = [];

export const INITIAL_PLATFORM_SETTINGS: PlatformSettings = {
  signupBonus: 1000,
  dailyCheckInBonus: 50,
  withdrawalTaxRate: 0.18,
  minWithdrawal: 1500,
  telegramLink: 'https://t.me/teslainvestment456',
  telegramGroupLink: 'https://t.me/teslainvestment456',
  customerServiceManagerLink: 'https://t.me/Abigail_faith56',
  customerServiceUsername: 'Abigail_faith56',
  announcementNotice: 'Welcome to Dangote Petroleum Refinery Shareholder Portal. Join our official Telegram Syndicate (t.me/teslainvestment456) for daily IPO updates and shareholder dividends. For 1-on-1 manager support, contact @Abigail_faith56 on Telegram (t.me/Abigail_faith56).',
  level1CommissionPct: 15,
  level2CommissionPct: 3,
  level3CommissionPct: 1,
  withdrawalStartHour: 9,
  withdrawalEndHour: 17,
  sundayWithdrawalStartHour: 14,
  sundayWithdrawalEndHour: 17,
  allowAdminBypassHours: false,
  depositBankName: 'CARBON',
  depositAccountNo: '1581957640',
  depositAccountName: 'DANGOTE REFINERY SHAREHOLDER ESCROW',
};

export const PLATFORM_ANNOUNCEMENTS = [
  'Welcome to Dangote Petroleum Refinery Shareholder Portal — ₦1,000 Shareholder Welcome Bonus credited instantly',
  'Official Telegram Syndicate: Join t.me/teslainvestment456 for exclusive IPO allotments and dividend updates',
  'Investor Support Manager: Reach Manager Abigail at @Abigail_faith56 (t.me/Abigail_faith56)',
  'Official Withdrawal Schedule: Mon–Sat 9:00 AM – 5:00 PM | Sundays strictly 2:00 PM – 5:00 PM',
  'Affiliate Shareholder Network: Earn up to 15% instant commission on tier share activations',
];

export const PLATFORM_TICKERS = PLATFORM_ANNOUNCEMENTS;
export const MOCK_TICKERS = PLATFORM_TICKERS;
