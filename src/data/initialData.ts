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

export const INITIAL_GIFT_CODES: GiftCode[] = [
  {
    code: 'TESLA2026',
    amount: 1000,
    maxUses: 1000,
    usedCount: 142,
    description: 'Special Community Welcome Bonus',
    active: true,
  },
  {
    code: 'TESLABONUS',
    amount: 2500,
    maxUses: 500,
    usedCount: 88,
    description: 'Exclusive VIP Promotional Bonus',
    active: true,
  },
  {
    code: 'CYBERTRUCK',
    amount: 5000,
    maxUses: 200,
    usedCount: 37,
    description: 'Foundation Series Launch Voucher',
    active: true,
  }
];

export const INITIAL_PLATFORM_SETTINGS: PlatformSettings = {
  signupBonus: 1500,
  dailyCheckInBonus: 10,
  withdrawalTaxRate: 0.18,
  minWithdrawal: 2000,
  telegramLink: 'https://t.me/tesla',
  announcementNotice: 'Welcome to Tesla Clean Energy Fleet. Withdrawals are processed daily from 9:00 AM to 5:00 PM. Each withdrawal request undergoes administrative review and instant bank dispatch.',
  level1CommissionPct: 35,
  level2CommissionPct: 1,
  level3CommissionPct: 1,
  withdrawalStartHour: 9,
  withdrawalEndHour: 17,
  allowAdminBypassHours: false,
};

export const MOCK_TICKERS = [
  '******1245 Recharge ₦100,000',
  '******9832 Withdraw ₦25,000',
  '******4412 Recharge ₦5,000',
  '******7890 Withdraw ₦14,200',
  '******3319 Recharge ₦40,000',
  '******6621 Withdraw ₦50,000',
  '******8721 Withdraw ₦10,000',
  '******5514 Recharge ₦10,000',
  '******9081 Withdraw ₦4,500'
];
