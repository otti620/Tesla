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
    bonusAmount: 3000,
    description: 'Invite 5 direct friends who activate any VIP Ola Cab unit for an instant ₦3,000 cash bounty.',
    gradient: 'from-neutral-900 to-lime-700',
    tag: '₦3,000 Bounty',
    bgLight: 'bg-lime-50',
    borderLight: 'border-lime-300',
    textColor: 'text-lime-800',
  },
  {
    id: 'promoter_tier_2',
    tierLevel: 2,
    title: 'Silver Ambassador',
    badge: 'Level 2 Bounty',
    requiredActiveInvites: 8,
    bonusAmount: 7500,
    description: 'Reach 8 direct active VIP Ola Cab buyers in your team for an instant ₦7,500 cash bounty.',
    gradient: 'from-neutral-900 to-lime-600',
    tag: '₦7,500 Bounty',
    bgLight: 'bg-lime-50',
    borderLight: 'border-lime-300',
    textColor: 'text-lime-800',
  },
  {
    id: 'promoter_tier_3',
    tierLevel: 3,
    title: 'Gold Team Leader',
    badge: 'Level 3 Bounty',
    requiredActiveInvites: 20,
    bonusAmount: 22500,
    description: 'Reach 20 direct active VIP Ola Cab buyers in your network for an instant ₦22,500 cash payout.',
    gradient: 'from-neutral-950 via-neutral-900 to-lime-600',
    tag: '₦22,500 Payout',
    bgLight: 'bg-lime-50',
    borderLight: 'border-lime-300',
    textColor: 'text-lime-900',
  },
  {
    id: 'promoter_tier_4',
    tierLevel: 4,
    title: 'Platinum Director',
    badge: 'Level 4 Bounty',
    requiredActiveInvites: 50,
    bonusAmount: 52500,
    description: 'Scale to 50 direct active VIP Ola Cab buyers in your team for a ₦52,500 cash bounty.',
    gradient: 'from-neutral-950 via-lime-900 to-lime-600',
    tag: '₦52,500 Bounty',
    bgLight: 'bg-lime-50',
    borderLight: 'border-lime-300',
    textColor: 'text-lime-900',
  },
  {
    id: 'promoter_tier_5',
    tierLevel: 5,
    title: 'Diamond Elite Partner',
    badge: 'Level 5 Bounty',
    requiredActiveInvites: 100,
    bonusAmount: 105000,
    description: 'Achieve 100 direct active VIP Ola Cab buyers for the ₦105,000 grand cash bounty.',
    gradient: 'from-neutral-950 via-lime-800 to-lime-500',
    tag: '₦105,000 Grand Bounty',
    bgLight: 'bg-lime-100',
    borderLight: 'border-lime-400',
    textColor: 'text-lime-950',
  },
  {
    id: 'promoter_tier_6',
    tierLevel: 6,
    title: 'Crown Ambassador',
    badge: 'Level 6 Bounty',
    requiredActiveInvites: 200,
    bonusAmount: 255000,
    description: 'Achieve 200 direct active VIP Ola Cab buyers for the ₦255,000 mega cash reward.',
    gradient: 'from-neutral-950 via-lime-700 to-lime-500',
    tag: '₦255,000 Mega Bounty',
    bgLight: 'bg-lime-100',
    borderLight: 'border-lime-400',
    textColor: 'text-lime-950',
  },
  {
    id: 'promoter_tier_7',
    tierLevel: 7,
    title: 'National Director',
    badge: 'Level 7 Bounty',
    requiredActiveInvites: 500,
    bonusAmount: 600000,
    description: 'Scale to 500 direct active VIP Ola Cab buyers for a massive ₦600,000 cash bounty.',
    gradient: 'from-neutral-950 via-lime-700 to-lime-400',
    tag: '₦600,000 Elite Bounty',
    bgLight: 'bg-lime-100',
    borderLight: 'border-lime-400',
    textColor: 'text-lime-950',
  },
  {
    id: 'promoter_tier_8',
    tierLevel: 8,
    title: 'Black Diamond Pinnacle',
    badge: 'Level 8 Bounty',
    requiredActiveInvites: 1000,
    bonusAmount: 1500000,
    description: 'Reach 1,000 direct active VIP Ola Cab buyers for the prestigious ₦1,500,000 cash award.',
    gradient: 'from-neutral-950 via-neutral-800 to-lime-500',
    tag: '₦1.5M Pinnacle Bounty',
    bgLight: 'bg-lime-100',
    borderLight: 'border-lime-500',
    textColor: 'text-neutral-950',
  },
  {
    id: 'promoter_tier_9',
    tierLevel: 9,
    title: 'Global Shareholder Legend',
    badge: 'Level 9 Pinnacle',
    requiredActiveInvites: 2500,
    bonusAmount: 3500000,
    description: 'Achieve 2,500 direct active VIP Ola Cab buyers for the ultimate ₦3,500,000 crown reward.',
    gradient: 'from-neutral-950 via-lime-700 to-lime-400',
    tag: '₦3.5M Legend Bounty',
    bgLight: 'bg-lime-100',
    borderLight: 'border-lime-500',
    textColor: 'text-neutral-950',
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
