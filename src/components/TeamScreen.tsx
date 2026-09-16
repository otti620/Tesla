import React, { useState } from 'react';
import { Users, Copy, Check, Share2, Send, MessageCircle, Sparkles, Link2 } from 'lucide-react';
import { UserState, PlatformSettings } from '../types';
import { getDynamicReferralLink, shareReferralLink, getReferralShareMessage } from '../utils/referral';

interface TeamScreenProps {
  user: UserState;
  platformSettings?: PlatformSettings;
  onNavigateToTeamDetails: () => void;
}

export const TeamScreen: React.FC<TeamScreenProps> = ({ 
  user, 
  platformSettings, 
  onNavigateToTeamDetails 
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

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

  const shareText = getReferralShareMessage(user.inviteCode, inviteLink);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;

  const lv1Members = user.teamMembers.filter((m) => m.level === 1);
  const lv2Members = user.teamMembers.filter((m) => m.level === 2);
  const lv3Members = user.teamMembers.filter((m) => m.level === 3);

  const lv1Bonus = lv1Members.reduce((sum, m) => sum + m.commission, 0);
  const lv2Bonus = lv2Members.reduce((sum, m) => sum + m.commission, 0);
  const lv3Bonus = lv3Members.reduce((sum, m) => sum + m.commission, 0);

  const totalPeople = user.teamMembers.length;
  const totalTeamIncome = lv1Bonus + lv2Bonus + lv3Bonus;

  return (
    <div className="min-h-screen pb-24 bg-neutral-100 text-neutral-900">
      {/* Top Banner with Dynamic Invitation Code & Link */}
      <div className="relative min-h-64 w-full overflow-hidden bg-neutral-900 text-white p-5 flex flex-col justify-center">
        <img
          src="https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=800&auto=format&fit=crop&q=80"
          alt="Tesla Team Referral"
          className="absolute inset-0 w-full h-full object-cover brightness-35"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-black/50 to-transparent" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tracking-wider uppercase">
                Dynamic Referral Link
              </span>
            </div>
            {shareFeedback && (
              <span className="text-xs text-emerald-400 font-bold animate-in fade-in">
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
              className="py-1.5 px-5 rounded-full bg-[#00c269] hover:bg-[#00ab5c] text-white text-xs font-bold shadow-md active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Dynamic Invitation Link Row */}
          <div className="bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-emerald-400 truncate font-mono select-all">
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
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Quick Share Buttons Bar */}
            <div className="pt-2 border-t border-white/10 flex items-center gap-2">
              <button
                onClick={handleShareClick}
                className="flex-1 py-2 px-3 rounded-xl bg-[#00c269] hover:bg-[#00ab5c] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
                title="Share via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>

              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3.5 rounded-xl bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/30 text-xs font-bold transition flex items-center gap-1.5"
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
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#00c269] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-neutral-800">My team</span>
            </div>

            <button
              onClick={onNavigateToTeamDetails}
              className="py-1 px-3 rounded-md bg-[#00c269] hover:bg-[#00ab5c] text-white text-xs font-semibold shadow-xs active:scale-95 transition flex items-center gap-0.5"
            >
              <span>Team details &gt;&gt;</span>
            </button>
          </div>

          {/* Commission Tiers list (LV1, LV2, LV3) */}
          <div className="space-y-4">
            {/* LV1 */}
            <div className="flex items-center justify-between text-center">
              <div className="w-14 h-14 rounded-full border border-neutral-200 flex items-center justify-center font-extrabold text-sm text-neutral-800 shadow-xs bg-neutral-50">
                LV1
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">{platformSettings?.level1CommissionPct ?? 35}%</div>
                <div className="text-[11px] text-neutral-500">Buy commission</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">{lv1Members.length}</div>
                <div className="text-[11px] text-neutral-500">Valid user</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">
                  {lv1Bonus.toFixed(2)}
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
                <div className="text-sm font-bold text-neutral-800">{platformSettings?.level2CommissionPct ?? 1}%</div>
                <div className="text-[11px] text-neutral-500">Commission Rate</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">{lv2Members.length}</div>
                <div className="text-[11px] text-neutral-500">Valid user</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">
                  {lv2Bonus.toFixed(2)}
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
                <div className="text-sm font-bold text-neutral-800">{platformSettings?.level3CommissionPct ?? 1}%</div>
                <div className="text-[11px] text-neutral-500">Commission Rate</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">{lv3Members.length}</div>
                <div className="text-[11px] text-neutral-500">Valid user</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-800">
                  {lv3Bonus.toFixed(2)}
                </div>
                <div className="text-[11px] text-neutral-500">Bonus</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2 Summary Cards (Screenshot 11) */}
        <div className="grid grid-cols-2 gap-2 text-white">
          <div className="bg-[#00c269] rounded-lg p-3 text-center shadow-xs">
            <div className="text-xl font-bold">{totalPeople}</div>
            <div className="text-xs font-medium text-white/90">Number of people</div>
          </div>
          <div className="bg-[#00c269] rounded-lg p-3 text-center shadow-xs">
            <div className="text-xl font-bold">
              ₦ {totalTeamIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-medium text-white/90">Team income</div>
          </div>
        </div>

        {/* Invitation Bonus Info Card (Screenshot 11) */}
        <div className="bg-[#005a30] text-white rounded-xl p-4 shadow-sm border border-emerald-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-amber-400 rounded-full" />
            <h4 className="text-sm font-bold text-amber-300">Invitation bonus</h4>
          </div>

          <div className="text-xs space-y-2.5 text-neutral-100 font-normal leading-relaxed">
            <p>
              When a friend you invite registers and invests, you will immediately receive a cash reward of 35% of the friend's investment amount.
            </p>
            <p>
              When your Level 2 team members invest, you will receive a 1% cash bonus.
            </p>
            <p>
              When your Level 3 team members invest, you will receive a 1% cash bonus.
            </p>
            <p className="text-amber-200/90 font-medium">
              Once your team member invests, the cash bonus is instantly credited to your account balance and you can withdraw it right away.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
