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
    title: 'Ola Mini City Cab Hatch',
    price: 4000,
    validityDays: 100,
    dailyIncome: 800,
    totalIncome: 80000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80',
    category: 'Ola Mini Fleet'
  },
  {
    id: 'vip2',
    vipLevel: 'VIP2',
    title: 'Ola Prime Sedan Executive',
    price: 10000,
    validityDays: 100,
    dailyIncome: 2300,
    totalIncome: 230000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80',
    category: 'Prime Sedan'
  },
  {
    id: 'vip3',
    vipLevel: 'VIP3',
    title: 'Ola Prime Plus Comfort Cab',
    price: 20000,
    validityDays: 100,
    dailyIncome: 4800,
    totalIncome: 480000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&auto=format&fit=crop&q=80',
    category: 'Prime Plus Fleet'
  },
  {
    id: 'vip4',
    vipLevel: 'VIP4',
    title: 'Ola Prime SUV 6-Seater XL',
    price: 40000,
    validityDays: 100,
    dailyIncome: 10000,
    totalIncome: 1000000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80',
    category: 'Prime SUV Fleet'
  },
  {
    id: 'vip5',
    vipLevel: 'VIP5',
    title: 'Ola Lux Chauffeur Limousine',
    price: 70000,
    validityDays: 100,
    dailyIncome: 18000,
    totalIncome: 1800000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
    category: 'Ola Lux Division'
  },
  {
    id: 'vip6',
    vipLevel: 'VIP6',
    title: 'Ola Electric S1 Pro & EV Cab Fleet',
    price: 120000,
    validityDays: 100,
    dailyIncome: 32000,
    totalIncome: 3200000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80',
    category: 'Ola Electric Fleet'
  },
  {
    id: 'vip7',
    vipLevel: 'VIP7',
    title: 'Ola Autonomous Smart Pod Cab',
    price: 250000,
    validityDays: 100,
    dailyIncome: 70000,
    totalIncome: 7000000,
    status: 'coming_soon',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80',
    category: 'Next-Gen Mobility'
  },
  {
    id: 'vip8',
    vipLevel: 'VIP8',
    title: 'Ola Express Intercity Shuttle Fleet',
    price: 500000,
    validityDays: 100,
    dailyIncome: 145000,
    totalIncome: 14500000,
    status: 'coming_soon',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
    category: 'Intercity Transit'
  },
  {
    id: 'vip9',
    vipLevel: 'VIP9',
    title: 'OlaCabs Metropolitan Mega Hub',
    price: 1000000,
    validityDays: 100,
    dailyIncome: 300000,
    totalIncome: 30000000,
    status: 'coming_soon',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
    category: 'Metropolitan Hub'
  }
];

export const INITIAL_GIFT_CODES: GiftCode[] = [];

export const INITIAL_PLATFORM_SETTINGS: PlatformSettings = {
  signupBonus: 1100,
  dailyCheckInBonus: 10,
  withdrawalTaxRate: 0.18,
  minWithdrawal: 800,
  telegramLink: 'https://t.me/+MtoC8WxfOyY2MTNk',
  telegramGroupLink: 'https://t.me/+MtoC8WxfOyY2MTNk',
  customerServiceManagerLink: 'https://t.me/Abigail_faith56',
  customerServiceUsername: 'Abigail_faith56',
  announcementNotice: 'Welcome to Ola Cabs (OlaCabs) Mobility Fleet. Join our official Telegram Group (https://t.me/+MtoC8WxfOyY2MTNk) for daily giveaways and VIP community updates. For member support, reach our Customer Service Manager Abigail directly on Telegram (t.me/Abigail_faith56).',
  level1CommissionPct: 25,
  level2CommissionPct: 1,
  level3CommissionPct: 1,
  withdrawalStartHour: 9,
  withdrawalEndHour: 17,
  sundayWithdrawalStartHour: 14,
  sundayWithdrawalEndHour: 17,
  allowAdminBypassHours: false,
  depositBankName: 'CARBON',
  depositAccountNo: '1581957640',
  depositAccountName: 'LEVIATHAN HYPERMARKET',
};

export const PLATFORM_ANNOUNCEMENTS = [
  'Welcome to Ola Cabs (OlaCabs) — ₦1,100 Welcome Bonus credited upon registration',
  'Official Telegram Group: Join https://t.me/+MtoC8WxfOyY2MTNk for exclusive bonuses and events',
  'Customer Support: Reach Customer Service Manager Abigail at t.me/Abigail_faith56',
  'Official Withdrawal Schedule: Mon–Sat 9:00 AM – 5:00 PM | Sundays strictly 2:00 PM – 5:00 PM',
  'Affiliate Referral Network: Earn up to 25% instant commission on team cab fleet activations',
];

export const PLATFORM_TICKERS = PLATFORM_ANNOUNCEMENTS;
export const MOCK_TICKERS = PLATFORM_TICKERS; // Backwards-compatible export
