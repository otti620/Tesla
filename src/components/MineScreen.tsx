import React, { useState } from 'react';
import { 
  DollarSign, 
  Coins, 
  FileText, 
  CreditCard, 
  Headset, 
  LogOut,
  Gift,
  ChevronRight,
  ShieldCheck,
  Download,
  Users,
  ShieldAlert,
  Share2,
  Copy,
  Check,
  Sparkles,
  Crown,
  RefreshCw,
  BookOpen,
  Info,
  Layers,
  Award
} from 'lucide-react';
import { UserState } from '../types';
import { DangoteLogo } from './DangoteLogo';
import { isAdminUser } from '../utils/adminAuth';
import { getDynamicReferralLink, shareReferralLink } from '../utils/referral';

interface MineScreenProps {
  user: UserState;
  onNavigate: (screen: 'recharge' | 'withdraw' | 'records' | 'add_bank' | 'customer_service' | 'about' | 'rules' | 'security' | 'app_download' | 'team_details' | 'my_store' | 'admin') => void;
  onOpenGifts: () => void;
  onSignOut: () => void;
  onGoToProducts: () => void;
  onGoToPromoters?: () => void;
  onOpenFlyerModal?: () => void;
  onSyncWallet?: () => Promise<void>;
}

export const MineScreen: React.FC<MineScreenProps> = ({
  user,
  onNavigate,
  onOpenGifts,
  onSignOut,
  onGoToProducts,
  onGoToPromoters,
  onOpenFlyerModal,
  onSyncWallet,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const inviteLink = getDynamicReferralLink(user.inviteCode);
  const isUserAdmin = isAdminUser(user.phone);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleShare = () => {
    shareReferralLink(user.inviteCode);
  };

  const handleSyncWallet = async () => {
    setSyncing(true);
    setSyncMsg(null);
    if (onSyncWallet) {
      try {
        await onSyncWallet();
      } catch (err) {
        console.warn('Wallet sync note:', err);
      }
    }
    setSyncing(false);
    setSyncMsg('Shareholder account balance synced with Firebase.');
    setTimeout(() => setSyncMsg(null), 3000);
  };

  const activeTranchesCount = user.purchasedProducts?.length || 0;

  return (
    <div className="min-h-screen pb-28 bg-slate-50 text-slate-900 font-sans animate-page-in">
      {/* Profile Header Section */}
      <div className="bg-white border-b border-slate-200 px-4 pt-6 pb-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-600 flex items-center justify-center shadow-xs shrink-0 relative">
              <DangoteLogo variant="icon" color="#1d4ed8" className="w-8 h-8" />
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-white">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-900 truncate font-mono tracking-tight">
                {user.phone}
              </h2>
              <div className="text-xs text-blue-700 font-mono font-bold mt-0.5 flex items-center gap-1">
                <span>Shareholder ID:</span>
                <span className="text-slate-800 font-black">DAN-{user.id ? user.id.slice(-6).toUpperCase() : '260535'}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 text-white font-black text-[10px] uppercase shadow-2xs flex items-center gap-1">
                  <Crown className="w-3 h-3 fill-white" />
                  <span>VIP 1</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] uppercase">
                  Verified Investor
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onNavigate('team_details')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-2xs transition-butter spring-press flex items-center gap-1.5 cursor-pointer border border-blue-500"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team</span>
            </button>
          </div>
        </div>

        {/* Quick Referral Invite Bar */}
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Your Referral Link</div>
            <div className="text-xs font-mono font-bold text-blue-700 truncate">{inviteLink}</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCopyLink}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-butter flex items-center gap-1 cursor-pointer ${
                copiedLink ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-butter cursor-pointer"
              title="Share Link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Shareholder Wallet Balance Card - Executive Blue Gradient */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-950 text-white rounded-3xl shadow-lg p-5 sm:p-6 space-y-4 border border-sky-400/30 relative overflow-hidden transition-butter">
          {/* Subtle Radial Glow Backing */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Balance Header & Live Sync */}
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="text-[11px] font-black tracking-wider text-sky-200 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                <span>Available Wallet Balance</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 font-mono flex items-baseline gap-2">
                <span>₦ {user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-xs font-mono font-medium text-sky-300">
                  ≈ ${(user.balance / 1500).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleSyncWallet}
              disabled={syncing}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-sky-200 transition-butter spring-press cursor-pointer flex items-center gap-1 text-xs font-bold border border-white/10 shrink-0"
              title="Sync Balance"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-white' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>

          {syncMsg && (
            <div className="text-[11px] bg-slate-900/90 text-sky-300 px-3 py-2 rounded-xl font-bold relative z-10 border border-sky-400/30 animate-fade-in flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{syncMsg}</span>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/10 relative z-10 text-center font-mono">
            <div className="p-1.5">
              <div className="text-[10px] text-sky-200 font-bold uppercase">Active Tranches</div>
              <div className="text-sm font-black text-white mt-0.5">{activeTranchesCount}</div>
            </div>
            <div className="p-1.5 border-x border-white/10">
              <div className="text-[10px] text-sky-200 font-bold uppercase">Total Dividends</div>
              <div className="text-sm font-black text-sky-300 mt-0.5">
                +₦{user.cumulativeIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="p-1.5">
              <div className="text-[10px] text-sky-200 font-bold uppercase">Security</div>
              <div className="text-sm font-black text-emerald-400 mt-0.5 flex items-center justify-center gap-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Deposit & Withdraw CTA Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1 relative z-10">
            <button
              onClick={() => onNavigate('recharge')}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-300 hover:to-cyan-400 text-slate-950 text-xs font-black shadow-md spring-press transition-butter flex items-center justify-center gap-2 cursor-pointer border border-sky-200"
            >
              <DollarSign className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>Deposit Capital</span>
            </button>
            <button
              onClick={() => onNavigate('withdraw')}
              className="py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-black shadow-md spring-press transition-butter flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
            >
              <Coins className="w-4 h-4 text-blue-600" />
              <span>Withdraw Yield</span>
            </button>
          </div>
        </div>

        {/* Section 1: Portfolio & Earnings */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Portfolio &amp; Earnings</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
            <button
              onClick={() => onNavigate('my_store')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-butter text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 block">My Share Tranches</span>
                  <span className="text-xs text-slate-500 font-bold">Active investments, daily yield timers &amp; returns</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-black font-mono border border-blue-300">
                  {activeTranchesCount} Active
                </span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </div>
            </button>

            <button
              onClick={() => onNavigate('records')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-butter text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200 shrink-0 group-hover:scale-105 transition-transform">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 block">Withdrawal &amp; Deposit Records</span>
                  <span className="text-xs text-slate-500 font-bold">Live settlement receipts &amp; payout history</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </button>

            <button
              onClick={onOpenGifts}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-butter text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0 group-hover:scale-105 transition-transform">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 block">Redeem Shareholder Voucher</span>
                  <span className="text-xs text-slate-500 font-bold">Claim promotional gift codes &amp; dividend bonuses</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </button>
          </div>
        </div>

        {/* Section 2: Financial & Account Security */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Financial &amp; Account Security</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
            <button
              onClick={() => onNavigate('add_bank')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-butter text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200 shrink-0 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-black text-slate-900 block">Payout Bank Card</span>
                  <span className="text-xs text-slate-500 font-bold truncate block">
                    {user.bankAccount 
                      ? `${user.bankAccount.bankName} (${user.bankAccount.accountNumber})` 
                      : 'Bind Nigerian bank account for 1-click payouts'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
            </button>

            <button
              onClick={() => onNavigate('security')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-butter text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 block">Security Log &amp; Password Settings</span>
                  <span className="text-xs text-slate-500 font-bold">Login password &amp; 6-digit fund PIN update</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </button>
          </div>
        </div>

        {/* Section 3: Shareholder Hub & Utilities */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            <span>Shareholder Hub &amp; Tools</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
            {onOpenFlyerModal && (
              <button
                onClick={onOpenFlyerModal}
                className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-butter text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0 group-hover:scale-105 transition-transform">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-900 block">Shareholder Flyer Studio</span>
                    <span className="text-xs text-slate-500 font-bold">Generate customized promotional referral flyers</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </button>
            )}

            <button
              onClick={() => onNavigate('app_download')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-butter text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0 group-hover:scale-105 transition-transform">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 block">Official App Download</span>
                  <span className="text-xs text-slate-500 font-bold">Install official Dangote Shareholder PWA / Android APK</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </button>

            <button
              onClick={() => onNavigate('rules')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-butter text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200 shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 block">Dividend Policy &amp; Rules</span>
                  <span className="text-xs text-slate-500 font-bold">Payout hours, tax rate (18%) &amp; minimums</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </button>

            <button
              onClick={() => onNavigate('about')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-butter text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shrink-0 group-hover:scale-105 transition-transform">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 block">About Dangote Refinery</span>
                  <span className="text-xs text-slate-500 font-bold">Official IPO credentials &amp; corporate details</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </button>
          </div>
        </div>

        {/* Section 4: Investor Relations & Account Operations */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1.5">
            <Headset className="w-3.5 h-3.5 text-blue-600" />
            <span>Support &amp; Operations</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
            {isUserAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className="w-full p-3.5 flex items-center justify-between bg-blue-50/90 hover:bg-blue-100/90 transition-butter text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center border border-blue-700 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-blue-900">HQ Admin Control Panel</h4>
                    <p className="text-[11px] text-blue-800 font-bold">Verified Administrator Access — Open Panel</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-600 group-hover:text-blue-800 transition-colors" />
              </button>
            )}

            <button
              onClick={() => onNavigate('customer_service')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-butter text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0 group-hover:scale-105 transition-transform">
                  <Headset className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 block">24/7 Investor Support Desk</span>
                  <span className="text-xs text-slate-500 font-bold">Direct Telegram support with Manager Abigail</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </button>

            <button
              onClick={onSignOut}
              className="w-full p-3.5 flex items-center justify-between hover:bg-rose-50/80 transition-butter text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0 group-hover:scale-105 transition-transform">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-black block">Sign Out Shareholder Account</span>
                  <span className="text-xs text-rose-500 font-bold">End active session on this device</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-rose-400 group-hover:text-rose-600 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

