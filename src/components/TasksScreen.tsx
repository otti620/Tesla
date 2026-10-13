import React, { useState } from 'react';
import {
  ChevronLeft,
  Award,
  Users,
  Copy,
  Check,
  Share2,
  Zap,
  Gift,
  CheckCircle2,
  Calendar,
  Send,
  MessageCircle,
  ExternalLink,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  HelpCircle,
  DollarSign
} from 'lucide-react';
import { UserState, PlatformSettings } from '../types';
import { PROMOTER_MILESTONES, PromoterMilestone, SAMPLE_PROMOTER_LEADERBOARD } from '../data/promoterTiers';
import { DangoteLogo } from './DangoteLogo';

interface TasksScreenProps {
  user: UserState;
  platformSettings?: PlatformSettings;
  onBack: () => void;
  onClaimPromoterMilestone: (milestone: PromoterMilestone) => Promise<boolean>;
  onDailyCheckIn: () => void;
  onRedeemGiftCode: (code: string) => Promise<any> | any;
  onNavigateToRecharge: () => void;
  onNavigateToProducts: () => void;
  onOpenTelegram: (channelName: string, customUrl?: string) => void;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({
  user,
  platformSettings,
  onBack,
  onClaimPromoterMilestone,
  onDailyCheckIn,
  onRedeemGiftCode,
  onNavigateToRecharge,
  onNavigateToProducts,
  onOpenTelegram,
}) => {
  const [activeTab, setActiveTab] = useState<'referrals' | 'daily' | 'leaderboard'>('referrals');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [giftInput, setGiftInput] = useState('');
  const [giftFeedback, setGiftFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isClaiming, setIsClaiming] = useState<string | null>(null);

  // Local completion tracker for quick daily social tasks
  const [completedSocialTasks, setCompletedSocialTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`dangote_social_tasks_${user.phone}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const referralUrl = `${window.location.origin}/?ref=${user.inviteCode}`;
  const directActiveCount = (user.teamMembers || []).filter(m => m.level === 1 && (m.invested || 0) > 0).length;
  const claimedMilestonesSet = new Set(user.claimedPromoterMilestones || []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🏛️ Join Dangote Petroleum Refinery Shareholder Syndicate! Earn daily share dividends and instant cash bonuses.\n\nUse my invite code: ${user.inviteCode}\n\nRegister here: ${referralUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleClaimMilestone = async (m: PromoterMilestone) => {
    if (isClaiming) return;
    setIsClaiming(m.id);
    try {
      await onClaimPromoterMilestone(m);
    } finally {
      setIsClaiming(null);
    }
  };

  const handleRedeemVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftInput.trim()) return;
    setGiftFeedback(null);
    try {
      const res = await onRedeemGiftCode(giftInput.trim());
      const isSuccess = typeof res === 'boolean' ? res : Boolean(res?.success);
      if (isSuccess) {
        setGiftFeedback({ type: 'success', msg: res?.message || 'Gift Voucher successfully redeemed and credited!' });
        setGiftInput('');
      } else {
        setGiftFeedback({ type: 'error', msg: res?.message || 'Invalid or expired gift voucher code.' });
      }
    } catch {
      setGiftFeedback({ type: 'error', msg: 'Failed to redeem gift voucher.' });
    }
  };

  const markSocialTaskComplete = (taskId: string, rewardAmount: number, taskTitle: string) => {
    if (completedSocialTasks[taskId]) return;
    const updated = { ...completedSocialTasks, [taskId]: true };
    setCompletedSocialTasks(updated);
    try {
      localStorage.setItem(`dangote_social_tasks_${user.phone}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const telegramLink = platformSettings?.telegramLink || 'https://t.me/teslainvestment456';
  const managerLink = platformSettings?.customerServiceManagerLink || 'https://t.me/Abigail_faith56';

  return (
    <div className="min-h-screen pb-24 bg-slate-50 text-slate-900 font-sans">
      {/* Top Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-xs">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition active:scale-95 cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-black tracking-wide text-slate-900 flex items-center gap-1.5 justify-center">
            <Award className="w-5 h-5 text-sky-500" />
            <span>Tasks &amp; Referral Rewards</span>
          </h1>
          <p className="text-[10px] text-blue-700 font-bold tracking-wider uppercase">
            Shareholder Bounty Hub
          </p>
        </div>

        <div className="w-8" />
      </div>

      {/* Referral Link & Share Box */}
      <div className="p-4 max-w-md mx-auto space-y-4">
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white rounded-3xl p-5 border border-sky-400/40 shadow-xl space-y-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DangoteLogo variant="icon" color="#ffffff" className="w-7 h-7 shrink-0" />
              <div>
                <h2 className="text-xs font-black text-sky-200 uppercase tracking-wider">
                  Your Shareholder Invite Code
                </h2>
                <div className="text-lg font-black font-mono text-white">
                  {user.inviteCode}
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black shadow-sm transition flex items-center gap-1 cursor-pointer border border-sky-300/50"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Referral URL Box */}
          <div className="bg-slate-950 rounded-2xl p-3 border border-sky-500/30 flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-sky-200 truncate flex-1">
              {referralUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-sky-400" /> : <Copy className="w-3.5 h-3.5 text-sky-300" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Action Row */}
          <div className="flex gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-300" />
              <span>Share WhatsApp</span>
            </button>
            <button
              onClick={() => onOpenTelegram('Dangote Channel', telegramLink)}
              className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>Share Telegram</span>
            </button>
          </div>

          {/* Tier Commission Summary */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div className="bg-black/30 p-2 rounded-xl border border-sky-400/20">
              <div className="text-[10px] text-sky-200 font-bold">Level 1 Commission</div>
              <div className="text-white font-black font-mono mt-0.5">15% Instant</div>
            </div>
            <div className="bg-black/30 p-2 rounded-xl border border-sky-400/20">
              <div className="text-[10px] text-sky-200 font-bold">Level 2 Commission</div>
              <div className="text-white font-black font-mono mt-0.5">3% Instant</div>
            </div>
            <div className="bg-black/30 p-2 rounded-xl border border-sky-400/20">
              <div className="text-[10px] text-sky-200 font-bold">Level 3 Commission</div>
              <div className="text-white font-black font-mono mt-0.5">1% Instant</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-200 p-1.5 rounded-2xl text-xs font-bold border border-slate-300">
          <button
            onClick={() => setActiveTab('referrals')}
            className={`flex-1 py-2 rounded-xl transition text-center cursor-pointer ${
              activeTab === 'referrals'
                ? 'bg-blue-600 text-white font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Referral Bounties ({PROMOTER_MILESTONES.length})
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-2 rounded-xl transition text-center cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-blue-600 text-white font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Tasks
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 rounded-xl transition text-center cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-blue-600 text-white font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Leaderboard
          </button>
        </div>

        {/* TAB 1: REFERRAL MILESTONES */}
        {activeTab === 'referrals' && (
          <div className="space-y-3.5">
            {/* Active Buyers Status Banner */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Active Direct VIP Buyers
                </div>
                <div className="text-xl font-black text-blue-700 font-mono mt-0.5">
                  {directActiveCount} Active Member{directActiveCount === 1 ? '' : 's'}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-bold">
                  Bounties Unlocked: {claimedMilestonesSet.size} / {PROMOTER_MILESTONES.length}
                </span>
              </div>
            </div>

            {/* Milestones List */}
            {PROMOTER_MILESTONES.map((m) => {
              const isClaimed = claimedMilestonesSet.has(m.id);
              const isEligible = directActiveCount >= m.requiredActiveInvites && !isClaimed;
              const progressPct = Math.min(100, Math.round((directActiveCount / m.requiredActiveInvites) * 100));

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 relative overflow-hidden shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="bg-sky-100 text-sky-900 border border-sky-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                          {m.badge}
                        </span>
                        <span className="text-xs font-black text-slate-900">{m.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 pt-1 leading-snug">
                        {m.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-blue-700 font-mono">
                        +₦{m.bonusAmount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        Cash Bounty
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 font-mono">
                      <span>Progress: {directActiveCount} / {m.requiredActiveInvites} Buyers</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-blue-700 transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Claim Action Button */}
                  <div className="pt-1 flex justify-end">
                    {isClaimed ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <span>Claimed &amp; Credited</span>
                      </span>
                    ) : isEligible ? (
                      <button
                        onClick={() => handleClaimMilestone(m)}
                        disabled={isClaiming === m.id}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md active:scale-95 transition flex items-center gap-1.5 cursor-pointer border border-blue-500"
                      >
                        <Zap className="w-4 h-4 fill-white" />
                        <span>{isClaiming === m.id ? 'Claiming...' : `Claim ₦${m.bonusAmount.toLocaleString()} Bounty`}</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed"
                      >
                        Needs {m.requiredActiveInvites - directActiveCount} More Active Invite{m.requiredActiveInvites - directActiveCount === 1 ? '' : 's'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: DAILY & ENGAGEMENT TASKS */}
        {activeTab === 'daily' && (
          <div className="space-y-3.5">
            {/* Task 1: Daily Check-In */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">Daily Shareholder Check-In</h3>
                    <p className="text-[10px] text-blue-700 font-bold">+₦10 Attendance Reward Daily</p>
                  </div>
                </div>

                <button
                  onClick={onDailyCheckIn}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                >
                  Check In
                </button>
              </div>
            </div>

            {/* Task 2: Join Official Telegram Syndicate */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 border border-sky-300 flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">Join Official Telegram Syndicate</h3>
                    <p className="text-[10px] text-sky-700 font-bold">+₦200 Instant Community Reward</p>
                  </div>
                </div>

                {completedSocialTasks['telegram_join'] ? (
                  <span className="text-[10px] text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Completed</span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      onOpenTelegram('Dangote Syndicate', telegramLink);
                      markSocialTaskComplete('telegram_join', 200, 'Telegram Community Join');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Join &amp; Claim</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Task 3: Contact Investor Manager Abigail */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-300 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">1-on-1 Investor Manager Support</h3>
                    <p className="text-[10px] text-indigo-700 font-bold">Contact Manager Abigail on Telegram</p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenTelegram('Manager Abigail Faith', managerLink)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <span>Chat Manager</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Redeem Gift Voucher Box */}
            <div className="bg-white rounded-2xl p-4 border border-blue-200 space-y-3 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-blue-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Redeem Gift Voucher Code
                </h3>
              </div>

              <form onSubmit={handleRedeemVoucherSubmit} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={giftInput}
                    onChange={(e) => setGiftInput(e.target.value)}
                    placeholder="Enter voucher code e.g. DANGOTE500"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 uppercase font-mono font-bold focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer shrink-0"
                  >
                    Redeem
                  </button>
                </div>

                {giftFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-bold border ${
                      giftFeedback.type === 'success'
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'bg-rose-50 border-rose-300 text-rose-800'
                    }`}
                  >
                    {giftFeedback.msg}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: PROMOTER LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-3.5">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Your Real Syndicate Network Ranking
                  </h3>
                </div>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
                  Live Firestore Data
                </span>
              </div>

              {/* User Real Team Performance Summary Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs font-mono shrink-0 shadow-xs">
                      #1
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 font-mono">
                        <span>{user.phone}</span>
                        <span className="text-[9px] text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full font-mono border border-blue-200 font-bold">
                          Active Shareholder
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Invite Code: {user.inviteCode}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <div className="text-xs font-black text-blue-700">
                      ₦ {user.teamMembers.reduce((sum, m) => sum + (m.commission || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-[9px] text-slate-500 font-medium">Team Commission</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-center text-xs font-mono">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-sans">Total Referrals</span>
                    <span className="text-sm font-black text-slate-900">{user.teamMembers.length} Members</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-sans">Active Direct Buyers</span>
                    <span className="text-sm font-black text-blue-700">{directActiveCount} Active</span>
                  </div>
                </div>
              </div>

              {user.teamMembers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">No external downline referrals yet.</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Share your official invite link ({user.inviteCode}) to build your real team tree. All commissions from registered referrals will populate here live in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800 pt-1">Real Downline Members ({user.teamMembers.length}):</div>
                  {user.teamMembers.map((m, idx) => (
                    <div key={m.id || idx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="font-black text-slate-900">{m.phone}</div>
                        <div className="text-[10px] text-slate-500">Level {m.level} • Joined {m.joinDate}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-blue-700">+₦{(m.commission || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500">Invested: ₦{(m.invested || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
