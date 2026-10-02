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
    title: 'Tesla Model 3 Standard Range RWD',
    price: 4000,
    validityDays: 100,
    dailyIncome: 800,
    totalIncome: 80000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80',
    category: 'Sedan Division'
  },
  {
    id: 'vip2',
    vipLevel: 'VIP2',
    title: 'Tesla Model S Plaid Tri-Motor',
    price: 10000,
    validityDays: 100,
    dailyIncome: 2300,
    totalIncome: 230000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80',
    category: 'Performance Sedan'
  },
  {
    id: 'vip3',
    vipLevel: 'VIP3',
    title: 'Tesla Model 3 Performance Track Edition',
    price: 20000,
    validityDays: 100,
    dailyIncome: 4800,
    totalIncome: 480000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?w=800&auto=format&fit=crop&q=80',
    category: 'Electric Vehicle Fleet'
  },
  {
    id: 'vip4',
    vipLevel: 'VIP4',
    title: 'Tesla Model Y Long Range All-Wheel Drive',
    price: 40000,
    validityDays: 100,
    dailyIncome: 10000,
    totalIncome: 1000000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800&auto=format&fit=crop&q=80',
    category: 'Electric SUV Fleet'
  },
  {
    id: 'vip5',
    vipLevel: 'VIP5',
    title: 'Tesla Cybertruck Dual-Motor Foundation Series',
    price: 70000,
    validityDays: 100,
    dailyIncome: 18000,
    totalIncome: 1800000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1698870404396-7c089c2c62c2?w=800&auto=format&fit=crop&q=80',
    category: 'Cyber All-Terrain'
  },
  {
    id: 'vip6',
    vipLevel: 'VIP6',
    title: 'Tesla Cyberbeast 845HP Tri-Motor Truck',
    price: 120000,
    validityDays: 100,
    dailyIncome: 32000,
    totalIncome: 3200000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1707924619472-ee1eefcecf5b?w=800&auto=format&fit=crop&q=80',
    category: 'Cyber Super-Truck'
  },
  {
    id: 'vip7',
    vipLevel: 'VIP7',
    title: 'Tesla Cybercab Autonomous 2-Seat Robotaxi',
    price: 250000,
    validityDays: 100,
    dailyIncome: 70000,
    totalIncome: 7000000,
    status: 'coming_soon',
    image: 'https://images.unsplash.com/photo-1508873696983-2df57046475b?w=800&auto=format&fit=crop&q=80',
    category: 'Next-Gen Autonomous'
  },
  {
    id: 'vip8',
    vipLevel: 'VIP8',
    title: 'Tesla Robovan Autonomous Multi-Passenger',
    price: 500000,
    validityDays: 100,
    dailyIncome: 145000,
    totalIncome: 14500000,
    status: 'coming_soon',
    image: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=800&auto=format&fit=crop&q=80',
    category: 'Next-Gen Autonomous'
  },
  {
    id: 'vip9',
    vipLevel: 'VIP9',
    title: 'Tesla Next-Gen Roadster SpaceX Package',
    price: 1000000,
    validityDays: 100,
    dailyIncome: 300000,
    totalIncome: 30000000,
    status: 'coming_soon',
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
    category: 'Hyper-EV Prototype'
  }
];

export const INITIAL_GIFT_CODES: GiftCode[] = [];

export const INITIAL_PLATFORM_SETTINGS: PlatformSettings = {
  signupBonus: 1500,
  dailyCheckInBonus: 10,
  withdrawalTaxRate: 0.18,
  minWithdrawal: 800,
  telegramLink: 'https://t.me/teslainvestment456',
  telegramGroupLink: 'https://t.me/teslainvestment456',
  customerServiceManagerLink: 'https://t.me/sallyservice4',
  customerServiceUsername: 'sallyservice4',
  announcementNotice: 'Welcome to Tesla Clean Energy Fleet. Join our official Telegram Group (t.me/teslainvestment456) for daily giveaways and VIP community updates. For member support, reach our Customer Service Manager Sally directly on Telegram (t.me/sallyservice4).',
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
  isTemporaryAdministrationMode: true,
  administrationNotice: 'Official Notice of Temporary Administration: The Tesla Clean Energy Fleet platform is undergoing scheduled administrative review, balance verification, and server infrastructure restructuring. Normal operations will resume shortly with enhanced security and yield reliability.',
};

export const PLATFORM_ANNOUNCEMENTS = [
  'Welcome to Tesla Clean Energy — ₦1,500 Welcome Bonus credited upon registration',
  'Official Telegram Group: Join t.me/teslainvestment456 for exclusive bonuses and events',
  'Customer Support: Reach Customer Service Manager Sally at t.me/sallyservice4',
  'Official Withdrawal Schedule: Mon–Sat 9:00 AM – 5:00 PM | Sundays strictly 2:00 PM – 5:00 PM',
  'Affiliate Referral Network: Earn up to 25% instant commission on team fleet activations',
];

export const PLATFORM_TICKERS = PLATFORM_ANNOUNCEMENTS;
export const MOCK_TICKERS = PLATFORM_TICKERS; // Backwards-compatible export
