export interface PromoterMilestone {
  id: string;
  tierLevel: number;
  title: string;
  badge: string;
  requiredActiveInvites: number;
  bonusAmount: number;
  description: string;
  gradient: string;
  tag: string;
  bgLight: string;
  borderLight: string;
  textColor: string;
}

export const PROMOTER_MILESTONES: PromoterMilestone[] = [
  {
    id: 'promoter_tier_1',
    tierLevel: 1,
    title: 'Bronze Promoter',
    badge: 'Level 1 Bounty',
    requiredActiveInvites: 5,
    bonusAmount: 2500,
    description: 'Invite 5 direct friends who purchase any VIP product unit.',
    gradient: 'from-amber-600 to-amber-800',
    tag: 'Starter Bounty',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-700',
  },
  {
    id: 'promoter_tier_2',
    tierLevel: 2,
    title: 'Silver Ambassador',
    badge: 'Level 2 Bounty',
    requiredActiveInvites: 8,
    bonusAmount: 7500,
    description: 'Reach 8 direct active VIP product buyers in your team.',
    gradient: 'from-slate-600 to-slate-800',
    tag: 'Silver Bonus',
    bgLight: 'bg-slate-50',
    borderLight: 'border-slate-200',
    textColor: 'text-slate-700',
  },
  {
    id: 'promoter_tier_3',
    tierLevel: 3,
    title: 'Gold Team Leader',
    badge: 'Level 3 Bounty',
    requiredActiveInvites: 20,
    bonusAmount: 20000,
    description: 'Reach 20 direct active VIP product buyers in your network.',
    gradient: 'from-yellow-500 to-amber-600',
    tag: 'Gold Payout',
    bgLight: 'bg-yellow-50',
    borderLight: 'border-yellow-200',
    textColor: 'text-yellow-800',
  },
  {
    id: 'promoter_tier_4',
    tierLevel: 4,
    title: 'Platinum Director',
    badge: 'Level 4 Bounty',
    requiredActiveInvites: 50,
    bonusAmount: 50000,
    description: 'Scale to 50 direct active VIP product buyers in your team.',
    gradient: 'from-blue-600 to-indigo-800',
    tag: 'Director Bounty',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  {
    id: 'promoter_tier_5',
    tierLevel: 5,
    title: 'Diamond Elite Partner',
    badge: 'Level 5 Bounty',
    requiredActiveInvites: 100,
    bonusAmount: 100000,
    description: 'Achieve 100 direct active VIP buyers for the ₦100,000 cash bounty.',
    gradient: 'from-purple-600 via-rose-600 to-red-600',
    tag: '₦100k Grand Bounty',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    textColor: 'text-rose-700',
  },
  {
    id: 'promoter_tier_6',
    tierLevel: 6,
    title: 'Crown Ambassador',
    badge: 'Level 6 Bounty',
    requiredActiveInvites: 200,
    bonusAmount: 250000,
    description: 'Achieve 200 direct active VIP buyers for the ₦250,000 mega cash reward.',
    gradient: 'from-fuchsia-600 via-pink-600 to-rose-600',
    tag: '₦250k Mega Bounty',
    bgLight: 'bg-fuchsia-50',
    borderLight: 'border-fuchsia-200',
    textColor: 'text-fuchsia-700',
  },
  {
    id: 'promoter_tier_7',
    tierLevel: 7,
    title: 'National Director',
    badge: 'Level 7 Bounty',
    requiredActiveInvites: 500,
    bonusAmount: 600000,
    description: 'Scale to 500 direct active VIP buyers for a massive ₦600,000 cash bounty.',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    tag: '₦600k Elite Bounty',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    textColor: 'text-emerald-700',
  },
  {
    id: 'promoter_tier_8',
    tierLevel: 8,
    title: 'Black Diamond Pinnacle',
    badge: 'Level 8 Bounty',
    requiredActiveInvites: 1000,
    bonusAmount: 1500000,
    description: 'Reach 1,000 direct active VIP buyers for the prestigious ₦1.5 Million cash award.',
    gradient: 'from-neutral-900 via-neutral-800 to-amber-600',
    tag: '₦1.5M Pinnacle Bounty',
    bgLight: 'bg-neutral-100',
    borderLight: 'border-amber-300',
    textColor: 'text-amber-700',
  },
  {
    id: 'promoter_tier_9',
    tierLevel: 9,
    title: 'Global Shareholder Legend',
    badge: 'Level 9 Pinnacle',
    requiredActiveInvites: 2500,
    bonusAmount: 3500000,
    description: 'Achieve 2,500 direct active VIP buyers for the ultimate ₦3.5 Million crown reward.',
    gradient: 'from-amber-500 via-rose-600 to-purple-800',
    tag: '₦3.5M Legend Bounty',
    bgLight: 'bg-amber-50',
    borderLight: 'border-rose-300',
    textColor: 'text-purple-700',
  },
];

export interface LeaderboardEntry {
  rank: number;
  phoneMasked: string;
  activeInvites: number;
  totalEarned: number;
  currentTier: string;
  badge: string;
}

export const SAMPLE_PROMOTER_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    phoneMasked: '0803***8912',
    activeInvites: 1240,
    totalEarned: 2530000,
    currentTier: 'Black Diamond Pinnacle',
    badge: '👑 No. 1 Legend',
  },
  {
    rank: 2,
    phoneMasked: '0706***4419',
    activeInvites: 615,
    totalEarned: 1030000,
    currentTier: 'National Director',
    badge: '🥈 National Director',
  },
  {
    rank: 3,
    phoneMasked: '0901***9921',
    activeInvites: 245,
    totalEarned: 430000,
    currentTier: 'Crown Ambassador',
    badge: '🥉 Crown Ambassador',
  },
  {
    rank: 4,
    phoneMasked: '0814***2130',
    activeInvites: 118,
    totalEarned: 180000,
    currentTier: 'Diamond Elite Partner',
    badge: 'Diamond Partner',
  },
  {
    rank: 5,
    phoneMasked: '0809***7715',
    activeInvites: 64,
    totalEarned: 80000,
    currentTier: 'Platinum Director',
    badge: 'Platinum Leader',
  },
];
