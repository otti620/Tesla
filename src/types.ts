export interface BankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface VIPProduct {
  id: string;
  vipLevel: string;
  title: string;
  price: number;
  validityDays: number;
  dailyIncome: number;
  totalIncome: number;
  status: 'available' | 'coming_soon';
  image: string;
  category: string;
}

export interface TransactionRecord {
  id: string;
  type: 'recharge' | 'withdraw' | 'bonus' | 'income' | 'purchase' | 'gift' | 'commission';
  title: string;
  amount: number;
  fee?: number;
  status: 'success' | 'pending' | 'failed';
  timestamp: number;
  details?: string;
  bankAccount?: BankAccount | null;
  processedAt?: number;
}

export interface TeamMember {
  id: string;
  phone: string;
  inviteCode?: string;
  level: 1 | 2 | 3;
  joinDate: string | number;
  invested: number;
  commission: number;
  status: 'active' | 'pending';
}

export interface PurchasedProductItem {
  instanceId: string;
  productId: string;
  title: string;
  vipLevel: string;
  purchaseDate: number;
  dailyIncome: number;
  totalIncome: number;
  validityDays: number;
  daysActive: number;
  image?: string;
  lastClaimDate?: number;
}

export interface CheckoutOrder {
  orderNo: string;
  amount: number;
  channel: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  createdAt: number;
  expiresAt: number;
}

export interface GiftCode {
  code: string;
  amount: number;
  maxUses: number;
  usedCount: number;
  description: string;
  active: boolean;
}

export interface PlatformSettings {
  signupBonus: number;
  dailyCheckInBonus: number;
  withdrawalTaxRate: number; // e.g. 0.18 for 18%
  minWithdrawal: number;
  telegramLink: string;
  telegramGroupLink?: string;
  customerServiceManagerLink?: string;
  customerServiceUsername?: string;
  announcementNotice: string;
  level1CommissionPct: number;
  level2CommissionPct: number;
  level3CommissionPct: number;
  withdrawalStartHour: number; // 9 for 9:00 AM
  withdrawalEndHour: number; // 17 for 5:00 PM
  sundayWithdrawalStartHour?: number; // 14 for 2:00 PM (Strict Sunday Schedule)
  sundayWithdrawalEndHour?: number; // 17 for 5:00 PM (Strict Sunday Schedule)
  allowAdminBypassHours?: boolean;
  depositBankName?: string;
  depositAccountNo?: string;
  depositAccountName?: string;
}

export interface UserState {
  id?: string;
  isLoggedIn: boolean;
  phone: string;
  balance: number;
  cumulativeIncome: number;
  inviteCode: string;
  invitedBy?: string;
  bankAccount: BankAccount | null;
  purchasedProducts: PurchasedProductItem[];
  records: TransactionRecord[];
  teamMembers: TeamMember[];
  lastCheckInDate: string | null;
  fundPin: string | null;
  loginPassword?: string;
  checkoutOrder?: CheckoutOrder | null;
  claimedPromoterMilestones?: string[];
  creditedByAdmin?: boolean;
}

export type TabType = 'home' | 'product' | 'promoters' | 'team' | 'mine';
export type SubScreen = 
  | null 
  | 'recharge' 
  | 'checkout'
  | 'withdraw' 
  | 'add_bank' 
  | 'customer_service' 
  | 'records' 
  | 'about' 
  | 'rules' 
  | 'my_store' 
  | 'team_details'
  | 'security'
  | 'app_download'
  | 'admin'
  | 'login'
  | 'register';

export interface NotificationBannerItem {
  id: string;
  type: 'revenue_ready' | 'system' | 'reward' | 'info';
  title: string;
  message: string;
  amount?: number;
  actionLabel?: string;
  secondaryActionLabel?: string;
  badgeText?: string;
  timestamp: number;
  persistent?: boolean;
  priority?: number;
}

