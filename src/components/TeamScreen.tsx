import React, { useState } from 'react';
import { Users, Copy, Check, Share2, Send, MessageCircle, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';
import { UserState, PlatformSettings } from '../types';
import { getDynamicReferralLink, shareReferralLink, getReferralShareMessage } from '../utils/referral';

interface TeamScreenProps {
  user: UserState;
  platformSettings?: PlatformSettings;
  onNavigateToTeamDetails: () => void;
  onOpenFlyerModal?: () => void;
  onSyncTeam?: () => Promise<void> | void;
}

export const TeamScreen: React.FC<TeamScreenProps> = ({ 
  user, 
  platformSettings, 
  onNavigateToTeamDetails,
  onOpenFlyerModal,
  onSyncTeam,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const inviteLink = getDynamicReferralLink(user.inviteCode);

  const copyToClipboard = (text: string, isLink: boolean) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShareClick = async () => {
    const res = await shareReferralLink(user.inviteCode, inviteLink);
    if (res.method === 'clipboard') {
      setCopiedLink(true);
      setShareFeedback('Dynamic link copied to clipboard!');
      setTimeout(() => {
        setCopiedLink(false);
        setShareFeedback(null);
      }, 2500);
    } else if (res.method === 'native') {
      setShareFeedback('Referral invitation shared successfully!');
      setTimeout(() => setShareFeedback(null), 2500);
    }
  };

  const handleManualSync = async () => {
    if (!onSyncTeam || isSyncing) return;
    setIsSyncing(true);
    try {
      await onSyncTeam();
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const shareText = getReferralShareMessage(user.inviteCode, inviteLink);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;

  const lv1Members = (user.teamMembers || []).filter((m) => m.level === 1);
  const lv2Members = (user.teamMembers || []).filter((m) => m.level === 2);
  const lv3Members = (user.teamMembers || []).filter((m) => m.level === 3);

  const lv1Bonus = lv1Members.reduce((sum, m) => sum + (Number(m.commission) || 0), 0);
  const lv2Bonus = lv2Members.reduce((sum, m) => sum + (Number(m.commission) || 0), 0);
  const lv3Bonus = lv3Members.reduce((sum, m) => sum + (Number(m.commission) || 0), 0);

  const totalPeople = (user.teamMembers || []).length;
  const totalTeamIncome = lv1Bonus + lv2Bonus + lv3Bonus;

  const l1Pct = platformSettings?.level1CommissionPct ?? 25;
  const l2Pct = platformSettings?.level2CommissionPct ?? 1;
  const l3Pct = platformSettings?.level3CommissionPct ?? 1;

  return (
    <div className="min-h-screen pb-24 bg-neutral-100 text-neutral-900">
      {/* Top Banner with Dynamic Invitation Code & Link */}
      <div className="relative min-h-64 w-full overflow-hidden bg-neutral-900 text-white p-5 flex flex-col justify-center">
        <img
          src="https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=800&auto=format&fit=crop&q=80"
          alt="Ola Cabs Team Referral"
          className="absolute inset-0 w-full h-full object-cover brightness-35"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-black/50 to-transparent" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2 rounded-md bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/35 text-[10px] font-black tracking-wider uppercase">
                Dynamic Referral Link
              </span>
              {user.invitedBy && (
                <span className="p-1 px-2 rounded-md bg-white/10 text-neutral-200 border border-white/15 text-[10px] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#a3e635]" />
                  Sponsor: <strong className="font-mono text-[#a3e635]">{user.invitedBy}</strong>
                </span>
              )}
            </div>
            {shareFeedback && (
              <span className="text-xs text-[#a3e635] font-bold animate-in fade-in">
                {shareFeedback}
              </span>
            )}
          </div>

          {/* Invitation Code Row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-black tracking-wider text-white font-mono">
                {user.inviteCode}
              </div>
              <div className="text-xs text-neutral-300 font-medium">
                Your VIP Invitation Code
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(user.inviteCode, false)}
              className="py-1.5 px-5 rounded-full bg-[#a3e635] hover:bg-[#84cc16] text-neutral-950 text-xs font-black shadow-md active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Dynamic Invitation Link Row */}
          <div className="bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-[#a3e635] truncate font-mono select-all">
                  {inviteLink}
                </div>
                <div className="text-[10px] text-neutral-400 font-medium">
                  Dynamic link auto-applies your referral code upon click
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(inviteLink, true)}
                className="py-1.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-[#a3e635]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Quick Share Buttons Bar */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
              <button
                onClick={handleShareClick}
                className="flex-1 py-2 px-3 rounded-xl bg-[#a3e635] hover:bg-[#84cc16] text-neutral-950 text-xs font-black transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </button>

              {onOpenFlyerModal && (
                <button
                  type="button"
                  onClick={onOpenFlyerModal}
                  className="py-2 px-3 rounded-xl bg-[#a3e635]/20 hover:bg-[#a3e635]/30 text-[#a3e635] border border-[#a3e635]/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Generate Advertising Flyer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#a3e635]" />
                  <span>Flyer Studio</span>
                </button>
              )}

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
                title="Share via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>

              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/30 text-xs font-bold transition flex items-center gap-1.5"
                title="Share via Telegram"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Telegram</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-3 space-y-3 -mt-3 relative z-20">
        {/* My Team Card */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-neutral-200">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-neutral-950 text-[#a3e635] flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm text-neutral-800">My team</span>
            </div>

            <div className="flex items-center gap-1.5">
              {onSyncTeam && (
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="py-1 px-2.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Sync Team & Commissions"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#4d7c0f]' : ''}`} />
                  <span>Sync</span>
                </button>
              )}
              <button
                onClick={onNavigateToTeamDetails}
                className="py-1 px-3 rounded-md bg-[#a3e635] hover:bg-[#84cc16] text-neutral-950 text-xs font-black shadow-xs active:scale-95 transition flex items-center gap-0.5 cursor-pointer"
              >
                <span>Team details &gt;&gt;</span>
              </button>
            </div>
          </div>

          {/* Commission Tiers list (LV1, LV2, LV3) */}
          <div className="space-y-4">
            {/* LV1 */}
            <div className="flex items-center justify-between text-center">
              <div className="w-14 h-14 rounded-full border border-neutral-200 flex items-center justify-center font-extrabold text-sm text-neutral-800 shadow-xs bg-neutral-50">
                LV1
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">{l1Pct}%</div>
                <div className="text-[11px] text-neutral-500">Buy commission</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">{lv1Members.length}</div>
                <div className="text-[11px] text-neutral-500">Valid user</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">
                  ₦{lv1Bonus.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-neutral-500">Bonus</div>
              </div>
            </div>

            {/* LV2 */}
            <div className="flex items-center justify-between text-center">
              <div className="w-14 h-14 rounded-full border border-neutral-200 flex items-center justify-center font-extrabold text-sm text-neutral-800 shadow-xs bg-neutral-50">
                LV2
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">{l2Pct}%</div>
                <div className="text-[11px] text-neutral-500">Commission Rate</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">{lv2Members.length}</div>
                <div className="text-[11px] text-neutral-500">Valid user</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">
                  ₦{lv2Bonus.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-neutral-500">Bonus</div>
              </div>
            </div>

            {/* LV3 */}
            <div className="flex items-center justify-between text-center">
              <div className="w-14 h-14 rounded-full border border-neutral-200 flex items-center justify-center font-extrabold text-sm text-neutral-800 shadow-xs bg-neutral-50">
                LV3
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">{l3Pct}%</div>
                <div className="text-[11px] text-neutral-500">Commission Rate</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">{lv3Members.length}</div>
                <div className="text-[11px] text-neutral-500">Valid user</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">
                  ₦{lv3Bonus.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-neutral-500">Bonus</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2 Summary Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-neutral-950 border border-[#a3e635]/40 rounded-lg p-3 text-center shadow-xs text-white">
            <div className="text-xl font-black text-[#a3e635]">{totalPeople}</div>
            <div className="text-xs font-semibold text-neutral-300">Number of people</div>
          </div>
          <div className="bg-[#a3e635] border border-[#84cc16] rounded-lg p-3 text-center shadow-xs text-neutral-950">
            <div className="text-xl font-black text-neutral-950">
              ₦ {totalTeamIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-bold text-neutral-800">Team income</div>
          </div>
        </div>

        {/* Invitation Bonus Info Card */}
        <div className="bg-neutral-950 text-white rounded-xl p-4 shadow-sm border border-[#a3e635]/35">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-[#a3e635] rounded-full" />
            <h4 className="text-sm font-black text-[#a3e635]">Invitation bonus</h4>
          </div>

          <div className="text-xs space-y-2.5 text-neutral-200 font-normal leading-relaxed">
            <p>
              When a friend you invite registers and invests, you will immediately receive a cash reward of {l1Pct}% of the friend's investment amount.
            </p>
            <p>
              When your Level 2 team members invest, you will receive a {l2Pct}% cash bonus.
            </p>
            <p>
              When your Level 3 team members invest, you will receive a {l3Pct}% cash bonus.
            </p>
            <p className="text-[#a3e635] font-semibold">
              Once your team member invests, the cash bonus is instantly credited to your account balance and you can withdraw it right away.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
