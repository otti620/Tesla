import React, { useState } from 'react';
import { Users, Copy, Check, Share2, Send, MessageCircle, Sparkles, Link2, RefreshCw, ShieldAlert, Headset } from 'lucide-react';
import { UserState, PlatformSettings } from '../types';
import { getDynamicReferralLink, shareReferralLink, getReferralShareMessage } from '../utils/referral';
import { DangoteLogo } from './DangoteLogo';

interface TeamScreenProps {
  user: UserState;
  platformSettings?: PlatformSettings;
  onNavigateToTeamDetails: () => void;
  onOpenFlyerModal?: () => void;
  onNavigateToCustomerService?: () => void;
  onNavigateToAdmin?: () => void;
  onRefreshTeam?: () => Promise<void>;
  onNavigateToTasks?: () => void;
}

export const TeamScreen: React.FC<TeamScreenProps> = ({ 
  user, 
  platformSettings, 
  onNavigateToTeamDetails,
  onOpenFlyerModal,
  onNavigateToCustomerService,
  onNavigateToAdmin,
  onRefreshTeam,
  onNavigateToTasks,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const inviteLink = getDynamicReferralLink(user.inviteCode);

  const handleRefreshTeam = async () => {
    setRefreshing(true);
    if (onRefreshTeam) {
      try {
        await onRefreshTeam();
      } catch (err) {
        console.warn('Team live sync notice:', err);
      }
    }
    setTimeout(() => setRefreshing(false), 600);
  };

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

  const lv1Members = user.teamMembers.filter((m) => m.level === 1);
  const lv2Members = user.teamMembers.filter((m) => m.level === 2);
  const lv3Members = user.teamMembers.filter((m) => m.level === 3);

  const lv1Bonus = lv1Members.reduce((sum, m) => sum + m.commission, 0);
  const lv2Bonus = lv2Members.reduce((sum, m) => sum + m.commission, 0);
  const lv3Bonus = lv3Members.reduce((sum, m) => sum + m.commission, 0);

  const totalPeople = user.teamMembers.length;
  const totalTeamIncome = lv1Bonus + lv2Bonus + lv3Bonus;

  return (
    <div className="min-h-screen pb-24 bg-slate-50 text-slate-900 font-sans">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-slate-900">My Team Network</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshTeam}
            className={`p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh Team & Commissions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition flex items-center gap-1 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>HQ</span>
            </button>
          )}

          {onNavigateToCustomerService && (
            <button
              onClick={onNavigateToCustomerService}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black shadow-xs border border-slate-200 transition cursor-pointer active:scale-95"
              title="Support"
            >
              <Headset className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* My Team Summary Card */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">My Team</h3>
                <p className="text-xs text-slate-700 font-bold">Referral Network Commission Breakdown</p>
              </div>
            </div>

            <button
              onClick={onNavigateToTeamDetails}
              className="py-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
            >
              Team details &gt;&gt;
            </button>
          </div>

          {/* Tiers List */}
          <div className="space-y-3">
            {/* LV1 */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-sky-100 text-sky-900 border border-sky-300 flex items-center justify-center font-black text-xs font-mono shrink-0">
                  LV1
                </div>
                <div>
                  <div className="text-sm font-black text-sky-700">15% Commission</div>
                  <div className="text-xs text-slate-700 font-bold">Direct Invite Buyers</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">{lv1Members.length} Members</div>
                <div className="text-xs font-mono font-black text-blue-700">₦{lv1Bonus.toLocaleString()}.00 Bonus</div>
              </div>
            </div>

            {/* LV2 */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-900 border border-blue-300 flex items-center justify-center font-black text-xs font-mono shrink-0">
                  LV2
                </div>
                <div>
                  <div className="text-sm font-black text-blue-700">3% Commission</div>
                  <div className="text-xs text-slate-700 font-bold">Tier 2 Network</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">{lv2Members.length} Members</div>
                <div className="text-xs font-mono font-black text-blue-700">₦{lv2Bonus.toLocaleString()}.00 Bonus</div>
              </div>
            </div>

            {/* LV3 */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center justify-center font-black text-xs font-mono shrink-0">
                  LV3
                </div>
                <div>
                  <div className="text-sm font-black text-indigo-700">1% Commission</div>
                  <div className="text-xs text-slate-700 font-bold">Tier 3 Network</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">{lv3Members.length} Members</div>
                <div className="text-xs font-mono font-black text-blue-700">₦{lv3Bonus.toLocaleString()}.00 Bonus</div>
              </div>
            </div>
          </div>

          {/* Aggregate Stats Cards */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-4 text-center shadow-xs border border-sky-400/40 text-white">
              <div className="text-2xl font-black font-mono">{totalPeople}</div>
              <div className="text-xs font-bold text-sky-200 mt-0.5">Total Members</div>
            </div>

            <div className="bg-white rounded-2xl p-4 text-center shadow-xs border border-slate-200">
              <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono">₦ {totalTeamIncome.toLocaleString()}</div>
              <div className="text-xs font-bold text-slate-600 mt-0.5">Total Team Income</div>
            </div>
          </div>
        </div>

        {/* Invitation Bonus Rules & Sharing Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-xs">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span>Invitation Bonus &amp; Rules</span>
          </h4>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            When a friend you invite registers and acquires share tranches, you will immediately receive a cash reward of <strong>15%</strong> of their investment amount on Level 1, <strong>3%</strong> on Level 2, and <strong>1%</strong> on Level 3.
          </p>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Invitation Code</span>
                <span className="text-lg font-black font-mono text-blue-700">{user.inviteCode}</span>
              </div>
              <button
                onClick={() => copyToClipboard(user.inviteCode, false)}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
              >
                {copiedCode ? 'Copied Code!' : 'Copy Code'}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 font-bold block">Shareable Dynamic Link</span>
                <span className="text-xs font-mono text-blue-700 truncate block font-bold">{inviteLink}</span>
              </div>
              <button
                onClick={() => copyToClipboard(inviteLink, true)}
                className="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition shrink-0 cursor-pointer"
              >
                {copiedLink ? 'Copied Link!' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleShareClick}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-sky-300" />
              <span>Share Referral Link</span>
            </button>
            {onOpenFlyerModal && (
              <button
                onClick={onOpenFlyerModal}
                className="py-3 px-4 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>Flyer Studio</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
