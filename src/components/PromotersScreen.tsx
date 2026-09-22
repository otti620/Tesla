import React, { useState } from 'react';
import { 
  Flame, 
  Award, 
  Crown, 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  Send, 
  Users, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Zap,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { UserState, PlatformSettings } from '../types';
import { PROMOTER_MILESTONES, SAMPLE_PROMOTER_LEADERBOARD, PromoterMilestone } from '../data/promoterTiers';
import { getDynamicReferralLink, shareReferralLink, getReferralShareMessage } from '../utils/referral';

interface PromotersScreenProps {
  user: UserState;
  platformSettings?: PlatformSettings;
  onClaimMilestone: (milestone: PromoterMilestone) => Promise<boolean> | boolean;
  onNavigateToRecharge?: () => void;
  onGoToProducts?: () => void;
  onOpenFlyerModal?: () => void;
}

export const PromotersScreen: React.FC<PromotersScreenProps> = ({
  user,
  platformSettings,
  onClaimMilestone,
  onNavigateToRecharge,
  onGoToProducts,
  onOpenFlyerModal,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'tiers' | 'leaderboard' | 'guide'>('tiers');

  const inviteLink = getDynamicReferralLink(user.inviteCode);

  // Calculate active direct VIP buyers (Level 1 team members with at least 1 product purchase)
  const lv1Members = user.teamMembers.filter((m) => m.level === 1);
  const activeVipBuyers = lv1Members.filter((m) => (m.invested || 0) > 0).length;
  const claimedMilestoneIds = new Set(user.claimedPromoterMilestones || []);

  // Calculate total milestone bonuses already claimed
  const totalMilestonesClaimedAmount = PROMOTER_MILESTONES
    .filter((m) => claimedMilestoneIds.has(m.id))
    .reduce((sum, m) => sum + m.bonusAmount, 0);

  // Determine current unlocked tier and next target
  const currentTier = [...PROMOTER_MILESTONES]
    .reverse()
    .find((m) => activeVipBuyers >= m.requiredActiveInvites) || null;

  const nextTier = PROMOTER_MILESTONES.find((m) => activeVipBuyers < m.requiredActiveInvites) || null;

  const copyToClipboard = (text: string, type: 'code' | 'link' | 'pitch') => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else if (type === 'pitch') {
      setCopiedPitch(true);
      setTimeout(() => setCopiedPitch(false), 2000);
    }
  };

  const handleShareClick = async () => {
    const res = await shareReferralLink(user.inviteCode, inviteLink);
    if (res.method === 'clipboard') {
      setCopiedLink(true);
      setShareFeedback('Referral link copied to clipboard!');
      setTimeout(() => {
        setCopiedLink(false);
        setShareFeedback(null);
      }, 2500);
    } else if (res.method === 'native') {
      setShareFeedback('Share sheet opened successfully!');
      setTimeout(() => setShareFeedback(null), 2500);
    }
  };

  const highConvertingPitch = `🔥 MASSIVE EARNING OPPORTUNITY IN NIGERIA! 🔥

Join Tesla Hypermarket & VIP Cloud Energy Platform!
💰 Instant ₦${platformSettings?.signupBonus || 500} Free Signup Bonus
⚡ VIP 1 generates ₦800 EVERY SINGLE DAY!
💵 Instant Withdrawable Returns daily straight to your Nigerian bank!

Register now using my VIP link:
👉 ${inviteLink}
Referral Code: ${user.inviteCode}

Start earning daily automated income today! 🚀`;

  const shareText = getReferralShareMessage(user.inviteCode, inviteLink);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;

  const handleClaim = async (milestone: PromoterMilestone) => {
    if (claimingId) return;
    setClaimingId(milestone.id);
    try {
      await onClaimMilestone(milestone);
    } finally {
      setClaimingId(null);
    }
  };

  const maxBounty = PROMOTER_MILESTONES[PROMOTER_MILESTONES.length - 1]?.bonusAmount || 3500000;
  const maxBountyFormatted = `₦${(maxBounty / 1000000).toFixed(1).replace('.0', '')}M`;

  return (
    <div className="min-h-screen pb-24 bg-neutral-100 text-neutral-900 font-sans">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-rose-950 text-white p-5 pt-7">
        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-12 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold tracking-wide uppercase">
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              Promoter Mega Bounty Program
            </div>
            <button
              onClick={() => setShowRulesModal(true)}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 underline underline-offset-2 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Bounty Terms
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Earn Up To <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-red-400">₦{maxBounty.toLocaleString()}</span> Cash
            </h1>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
              Invite active VIP product buyers and unlock progressive tiered cash payouts credited instantly to your withdrawable balance.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10 text-center">
              <div className="text-[10px] text-neutral-300 font-medium uppercase tracking-wider">Active VIPs</div>
              <div className="text-lg font-black text-amber-400 mt-0.5">{activeVipBuyers}</div>
              <div className="text-[9px] text-neutral-400">Level 1 Buyers</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10 text-center">
              <div className="text-[10px] text-neutral-300 font-medium uppercase tracking-wider">Bounties Claimed</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">₦{totalMilestonesClaimedAmount.toLocaleString()}</div>
              <div className="text-[9px] text-neutral-400">{claimedMilestoneIds.size} Tier(s) Claimed</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10 text-center">
              <div className="text-[10px] text-neutral-300 font-medium uppercase tracking-wider">Current Rank</div>
              <div className="text-xs font-bold text-white mt-1 truncate">
                {currentTier ? currentTier.title.split(' ')[0] : 'Novice'}
              </div>
              <div className="text-[9px] text-rose-300 font-medium truncate">
                {nextTier ? `${nextTier.requiredActiveInvites - activeVipBuyers} to ${nextTier.title.split(' ')[0]}` : 'Max Tier Reached!'}
              </div>
            </div>
          </div>

          {/* Quick Action: Open Advertising Flyer Studio */}
          {onOpenFlyerModal && (
            <button
              onClick={onOpenFlyerModal}
              className="w-full mt-2 py-2.5 px-3.5 bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-red-500/30 hover:from-amber-500/40 hover:to-red-500/40 border border-amber-400/40 rounded-xl flex items-center justify-between transition cursor-pointer text-white shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-black text-amber-200">Advertising Flyer Studio</div>
                  <div className="text-[10px] text-neutral-300">Download high-res HD posters with your dynamic QR code</div>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-300 flex items-center bg-amber-400/20 px-2 py-1 rounded-lg border border-amber-400/30">
                Open <ArrowRight className="w-3 h-3 ml-1" />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-4 -mt-2">
        {/* Navigation Sub-Tabs */}
        <div className="bg-white rounded-xl p-1 shadow-sm border border-neutral-200 flex items-center">
          <button
            onClick={() => setActiveTab('tiers')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'tiers' 
                ? 'bg-neutral-900 text-white shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            Milestone Ladder
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'leaderboard' 
                ? 'bg-neutral-900 text-white shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Top Promoters
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'guide' 
                ? 'bg-neutral-900 text-white shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Promo Kit
          </button>
        </div>

        {/* Tab 1: Milestone Tiers */}
        {activeTab === 'tiers' && (
          <div className="space-y-3.5">
            {/* Next Milestone Spotlight */}
            {nextTier && (
              <div className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 text-white rounded-2xl p-4 border border-white/10 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-xs">
                      #{nextTier.tierLevel}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-neutral-300">Next Target: {nextTier.title}</div>
                      <div className="text-sm font-black text-amber-300">
                        Reward: ₦{nextTier.bonusAmount.toLocaleString()} Cash Bounty
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                    {activeVipBuyers} / {nextTier.requiredActiveInvites} VIPs
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full h-2.5 bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(5, (activeVipBuyers / nextTier.requiredActiveInvites) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-1">
                    <span>Current: {activeVipBuyers} VIP Buyers</span>
                    <span>Target: {nextTier.requiredActiveInvites} VIP Buyers</span>
                  </div>
                </div>
              </div>
            )}

            {/* List of All Tier Milestones */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                  Tiered Cash Milestone Ladder
                </h3>
                <span className="text-[11px] font-semibold text-rose-600">
                  Conservative & Sustainable
                </span>
              </div>

              {PROMOTER_MILESTONES.map((milestone) => {
                const isClaimed = claimedMilestoneIds.has(milestone.id);
                const isEligible = activeVipBuyers >= milestone.requiredActiveInvites;
                const isCurrentProgress = !isClaimed && isEligible;
                const progressPct = Math.min(100, (activeVipBuyers / milestone.requiredActiveInvites) * 100);
                const isClaimingThis = claimingId === milestone.id;

                return (
                  <div
                    key={milestone.id}
                    className={`bg-white rounded-2xl p-4 border transition-all shadow-sm relative overflow-hidden ${
                      isClaimed
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : isEligible
                        ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    {/* Top Tier Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white bg-gradient-to-br ${milestone.gradient} shadow-sm`}
                        >
                          T{milestone.tierLevel}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-neutral-900">{milestone.title}</h4>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${milestone.bgLight} ${milestone.borderLight} ${milestone.textColor} border`}>
                              {milestone.tag}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Requirement: <strong className="text-neutral-800">{milestone.requiredActiveInvites} Active VIP Buyers</strong>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-neutral-900">
                          +₦{milestone.bonusAmount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-medium">Direct Bounty</div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-neutral-600 mt-2 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                      {milestone.description}
                    </p>

                    {/* Progress Bar & Status Action */}
                    <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between items-center text-[10px] text-neutral-500 mb-1">
                          <span>Progress: {activeVipBuyers}/{milestone.requiredActiveInvites} VIPs</span>
                          <span>{Math.round(progressPct)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isClaimed ? 'bg-emerald-500' : isEligible ? 'bg-amber-500' : 'bg-neutral-400'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {isClaimed ? (
                          <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Claimed
                          </div>
                        ) : isEligible ? (
                          <button
                            onClick={() => handleClaim(milestone)}
                            disabled={isClaimingThis}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-rose-600 text-white rounded-lg text-xs font-black shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 animate-pulse disabled:opacity-50"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            {isClaimingThis ? 'Claiming...' : `Claim ₦${milestone.bonusAmount.toLocaleString()}`}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 text-neutral-400 rounded-lg text-[11px] font-semibold">
                            <Lock className="w-3 h-3 text-neutral-400" />
                            {milestone.requiredActiveInvites - activeVipBuyers} more VIPs
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-amber-500 to-rose-600 text-white rounded-2xl p-4 shadow-sm space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-200" />
                <h3 className="font-black text-sm">Weekly Top Promoter Standings</h3>
              </div>
              <p className="text-xs text-amber-100 leading-relaxed">
                Top promoters with highest active invited VIP buyers receive additional weekly profit-share bonuses!
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm divide-y divide-neutral-100 overflow-hidden">
              {SAMPLE_PROMOTER_LEADERBOARD.map((promoter) => (
                <div key={promoter.rank} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        promoter.rank === 1
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 font-black'
                          : promoter.rank === 2
                          ? 'bg-slate-100 text-slate-700 border border-slate-300'
                          : promoter.rank === 3
                          ? 'bg-amber-50 text-amber-900 border border-amber-200'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {promoter.rank}
                    </div>

                    <div>
                      <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                        <span>{promoter.phoneMasked}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 font-medium">
                          {promoter.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {promoter.activeInvites} Direct VIPs • {promoter.currentTier}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-emerald-600">
                      +₦{promoter.totalEarned.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-neutral-400">Total Bounties</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Promo Kit & High-Converting Pitch */}
        {activeTab === 'guide' && (
          <div className="space-y-4">
            {/* 1-Click Copy Box */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-rose-600" />
                Your Dedicated Referral Assets
              </h3>

              {/* Code */}
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Referral Code</div>
                  <div className="text-base font-mono font-black text-neutral-900">{user.inviteCode}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(user.inviteCode, 'code')}
                  className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Link */}
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 flex items-center justify-between">
                <div className="flex-1 mr-2 truncate">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Dynamic Referral Link</div>
                  <div className="text-xs font-mono text-neutral-700 truncate">{inviteLink}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(inviteLink, 'link')}
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied' : 'Copy Link'}
                </button>
              </div>

              {/* Share Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-[#25D366] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:brightness-105 active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Share to WhatsApp
                </a>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-[#0088cc] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:brightness-105 active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Share to Telegram
                </a>
              </div>

              {/* Flyer Creator CTA */}
              {onOpenFlyerModal && (
                <button
                  type="button"
                  onClick={onOpenFlyerModal}
                  className="w-full mt-1 py-3 px-3 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 hover:from-neutral-800 hover:to-neutral-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-between shadow-md border border-neutral-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span>Generate &amp; Download Custom Advertising Flyer (HD)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </button>
              )}
            </div>

            {/* High-Converting WhatsApp Marketing Script */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  High-Converting Marketing Copy
                </h3>
                <button
                  onClick={() => copyToClipboard(highConvertingPitch, 'pitch')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  {copiedPitch ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedPitch ? 'Copied Script!' : 'Copy Script'}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500">
                Copy and paste this proven sales pitch directly to WhatsApp groups, Facebook, and Telegram channels to get instant VIP signups.
              </p>
              <pre className="text-xs font-sans bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-neutral-800 whitespace-pre-wrap leading-relaxed select-all">
                {highConvertingPitch}
              </pre>
            </div>
          </div>
        )}

        {/* 3-Level Commission Overrides Card */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm space-y-2.5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            Instant 3-Level Direct Commission Structure
          </h3>
          <p className="text-xs text-neutral-500">
            In addition to tiered milestone cash bounties, you earn instant commission automatically on every product purchased in your 3-level organization:
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-2">
              <div className="text-[10px] font-bold text-rose-700 uppercase">Level 1 (Direct)</div>
              <div className="text-lg font-black text-rose-800 mt-0.5">{platformSettings?.level1CommissionPct ?? 25}%</div>
              <div className="text-[9px] text-rose-600">Instant Cash</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2">
              <div className="text-[10px] font-bold text-amber-700 uppercase">Level 2</div>
              <div className="text-lg font-black text-amber-800 mt-0.5">{platformSettings?.level2CommissionPct ?? 1}%</div>
              <div className="text-[9px] text-amber-600">Indirect Team</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2">
              <div className="text-[10px] font-bold text-blue-700 uppercase">Level 3</div>
              <div className="text-lg font-black text-blue-800 mt-0.5">{platformSettings?.level3CommissionPct ?? 1}%</div>
              <div className="text-[9px] text-blue-600">Deep Team</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules & Transparency Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-rose-600" />
                Promoter Bounty Program Rules
              </h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-800 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-600 leading-relaxed max-h-80 overflow-y-auto pr-1">
              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                <strong className="text-neutral-900 block mb-0.5">1. Valid VIP Buyer Qualification</strong>
                A qualified invite is a directly registered Level 1 team member who has activated any standard VIP energy product (VIP 1 to VIP 9).
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                <strong className="text-neutral-900 block mb-0.5">2. Instant Withdrawable Credit</strong>
                Milestone bounties (₦2,500 up to ₦3,500,000) are credited directly to your withdrawable balance upon clicking "Claim".
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                <strong className="text-neutral-900 block mb-0.5">3. One-Time Claim Per Tier</strong>
                Each milestone tier can be claimed once per account as your team reaches the required active buyer thresholds.
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                <strong className="text-neutral-900 block mb-0.5">4. Safe & Conservative Architecture</strong>
                All milestone payouts are mathematically backed by verified product purchases, ensuring long-term liquidity and platform reliability.
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
