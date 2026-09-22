import React, { useState } from 'react';
import { 
  DollarSign, 
  Coins, 
  FileText, 
  Info, 
  BookOpen, 
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
  Flame
} from 'lucide-react';
import { UserState } from '../types';
import { TeslaLogo } from './TeslaLogo';
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
}

export const MineScreen: React.FC<MineScreenProps> = ({
  user,
  onNavigate,
  onOpenGifts,
  onSignOut,
  onGoToProducts,
  onGoToPromoters,
  onOpenFlyerModal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const inviteLink = getDynamicReferralLink(user.inviteCode);

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShare = async () => {
    const res = await shareReferralLink(user.inviteCode, inviteLink);
    if (res.method === 'clipboard') {
      setCopiedLink(true);
      setShareMsg('Link copied to clipboard!');
      setTimeout(() => {
        setCopiedLink(false);
        setShareMsg(null);
      }, 2000);
    } else if (res.method === 'native') {
      setShareMsg('Invitation shared!');
      setTimeout(() => setShareMsg(null), 2000);
    }
  };
  return (
    <div className="min-h-screen pb-24 bg-neutral-100 text-neutral-900">
      {/* Top Profile Header (Screenshot 12) */}
      <div className="relative bg-gradient-to-r from-[#00c269] via-emerald-800 to-black text-white px-5 pt-8 pb-6 shadow-md">
        {/* Sign Out Button top right */}
        <div className="flex justify-end">
          <button
            onClick={onSignOut}
            className="flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-white px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-xs hover:bg-white/20 transition active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4 mt-2">
          {/* Avatar with Tesla T logo */}
          <div className="w-16 h-16 rounded-full bg-black border-2 border-white/40 flex items-center justify-center p-2.5 shadow-md shrink-0">
            <TeslaLogo variant="icon" color="#ffffff" className="w-full h-full" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Tesla Member
            </h2>
            <p className="text-xs text-emerald-200/90 font-mono mt-0.5">
              {user.phone}
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-[10px] font-semibold text-white">
              VIP Tier Active
            </span>
          </div>
        </div>

        {/* 3 Quick Action Shortcuts (Screenshot 12) */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/15 text-center">
          <button
            onClick={() => onNavigate('recharge')}
            className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white mb-1 group-hover:bg-white/25">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-medium text-white/90">Recharge</span>
          </button>

          <button
            onClick={() => onNavigate('withdraw')}
            className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white mb-1 group-hover:bg-white/25">
              <Coins className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-medium text-white/90">Withdraw</span>
          </button>

          <button
            onClick={() => onNavigate('records')}
            className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white mb-1 group-hover:bg-white/25">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-medium text-white/90">Records</span>
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3 -mt-2 relative z-20">
        {/* Balance Cards (Screenshot 12) */}
        <div className="grid grid-cols-2 gap-2 text-white">
          <div className="bg-[#00c269] rounded-xl p-3.5 shadow-xs">
            <div className="text-lg sm:text-xl font-black truncate">
              ₦ {user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-medium text-white/90 mt-0.5">
              Account balance
            </div>
          </div>

          <div className="bg-[#00c269] rounded-xl p-3.5 shadow-xs">
            <div className="text-lg sm:text-xl font-black truncate">
              ₦ {user.cumulativeIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-medium text-white/90 mt-0.5">
              Cumulative income
            </div>
          </div>
        </div>

        {/* Dynamic Referral Promotion Card */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-emerald-950 text-white rounded-xl p-4 shadow-sm border border-emerald-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">
                  Dynamic Referral Program
                </h4>
                <p className="text-[10px] text-neutral-300">
                  Earn 25% instant commission on invitee VIP purchases
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
              {user.inviteCode}
            </span>
          </div>

          <div className="bg-black/50 rounded-lg p-2 flex items-center justify-between gap-2 border border-white/10 mt-2.5">
            <div className="text-[11px] text-emerald-400 font-mono truncate select-all flex-1">
              {inviteLink}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleShare}
                className="px-2.5 py-1 rounded-md bg-[#00c269] hover:bg-[#00ab5c] text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition cursor-pointer active:scale-95"
              >
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </button>
            </div>
          </div>
          {shareMsg && (
            <div className="text-[10px] text-emerald-400 font-semibold mt-1.5 text-center">
              {shareMsg}
            </div>
          )}

          {/* Promoter Mega Bounty Shortcut */}
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button
              onClick={onGoToPromoters}
              className="py-2 px-2.5 bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-red-500/20 hover:from-amber-500/30 hover:to-red-500/30 border border-rose-500/30 rounded-lg flex items-center justify-between transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
                <span className="text-[11px] font-bold text-white truncate">Promoter ₦3.5M</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            </button>

            {onOpenFlyerModal && (
              <button
                onClick={onOpenFlyerModal}
                className="py-2 px-2.5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 rounded-lg flex items-center justify-between transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold text-white truncate">Promo Flyer HD</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Store Banner (Screenshot 12) */}
        <div
          onClick={() => onNavigate('my_store')}
          className="relative h-24 rounded-xl overflow-hidden shadow-xs cursor-pointer group border border-neutral-200"
        >
          <img
            src="https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?w=800&auto=format&fit=crop&q=80"
            alt="Tesla shop"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300 brightness-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 p-4 flex flex-col justify-center text-white">
            <h3 className="text-base font-bold tracking-tight">
              Accelerate The Future
            </h3>
            <p className="text-xs text-neutral-200 mt-0.5">
              Click to view my store &gt;
            </p>
          </div>
        </div>

        {/* Menu Grid (Screenshot 12) */}
        <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-4 space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-3 text-center">
            {/* About us */}
            <button
              onClick={() => onNavigate('about')}
              className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00c269] flex items-center justify-center mb-1.5 shadow-2xs group-hover:bg-emerald-100">
                <Info className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[11px] text-neutral-700 font-medium">About us</span>
            </button>

            {/* Platform rules */}
            <button
              onClick={() => onNavigate('rules')}
              className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00c269] flex items-center justify-center mb-1.5 shadow-2xs group-hover:bg-emerald-100">
                <BookOpen className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[11px] text-neutral-700 font-medium leading-tight">Platform rules</span>
            </button>

            {/* Account records */}
            <button
              onClick={() => onNavigate('records')}
              className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00c269] flex items-center justify-center mb-1.5 shadow-2xs group-hover:bg-emerald-100">
                <FileText className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[11px] text-neutral-700 font-medium leading-tight">Account records</span>
            </button>

            {/* Help */}
            <button
              onClick={() => onNavigate('customer_service')}
              className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00c269] flex items-center justify-center mb-1.5 shadow-2xs group-hover:bg-emerald-100">
                <Headset className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[11px] text-neutral-700 font-medium">Help</span>
            </button>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-3 text-center pt-2 border-t border-neutral-100">
            {/* Bank Card */}
            <button
              onClick={() => onNavigate('add_bank')}
              className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00c269] flex items-center justify-center mb-1.5 shadow-2xs group-hover:bg-emerald-100">
                <CreditCard className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[11px] text-neutral-700 font-medium leading-tight">Bank Card</span>
            </button>

            {/* Security */}
            <button
              onClick={() => onNavigate('security')}
              className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00c269] flex items-center justify-center mb-1.5 shadow-2xs group-hover:bg-emerald-100">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[11px] text-neutral-700 font-medium leading-tight">Security</span>
            </button>

            {/* App Download */}
            <button
              onClick={() => onNavigate('app_download')}
              className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00c269] flex items-center justify-center mb-1.5 shadow-2xs group-hover:bg-emerald-100">
                <Download className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[11px] text-neutral-700 font-medium leading-tight">App Download</span>
            </button>

            {/* Team Report */}
            <button
              onClick={() => onNavigate('team_details')}
              className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00c269] flex items-center justify-center mb-1.5 shadow-2xs group-hover:bg-emerald-100">
                <Users className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[11px] text-neutral-700 font-medium leading-tight">Team Reports</span>
            </button>
          </div>

          {/* Secondary Options List */}
          <div className="pt-2 border-t border-neutral-100 space-y-1">
            <button
              onClick={() => onNavigate('add_bank')}
              className="w-full flex items-center justify-between p-2.5 hover:bg-neutral-50 rounded-lg text-xs font-medium text-neutral-800 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-50 text-[#00c269] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span>
                  {user.bankAccount ? `Bank Account (${user.bankAccount.bankName})` : 'Bind Bank Account'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-neutral-400">
                <span>{user.bankAccount ? 'Bound' : 'Not bound'}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={onOpenGifts}
              className="w-full flex items-center justify-between p-2.5 hover:bg-neutral-50 rounded-lg text-xs font-medium text-neutral-800 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-50 text-[#00c269] flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <span>Redeem Gift Code</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Admin Console Access - Strictly for 07077599057 and 09011711470 */}
            {isAdminUser(user.phone) && (
              <button
                onClick={() => onNavigate('admin')}
                className="w-full flex items-center justify-between p-2.5 hover:bg-neutral-900/5 rounded-lg text-xs font-semibold text-red-600 transition cursor-pointer mt-1 bg-red-50/60 border border-red-100"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-red-100 text-red-600 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span>Master Admin Console</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-mono font-bold">ROOT</span>
                  <ChevronRight className="w-4 h-4 text-red-400" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
