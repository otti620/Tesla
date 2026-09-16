import React, { useState } from 'react';
import { ChevronLeft, Users, Search, Share2, Copy, Check, CheckCircle2, Link2 } from 'lucide-react';
import { UserState, PlatformSettings } from '../types';
import { getDynamicReferralLink, shareReferralLink } from '../utils/referral';

interface TeamDetailsScreenProps {
  user: UserState;
  platformSettings: PlatformSettings;
  onBack: () => void;
}

export const TeamDetailsScreen: React.FC<TeamDetailsScreenProps> = ({
  user,
  platformSettings,
  onBack,
}) => {
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const inviteLink = getDynamicReferralLink(user.inviteCode);

  const levelMembers = user.teamMembers.filter((m) => m.level === activeLevel);
  const filtered = levelMembers.filter((m) =>
    m.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const l1Rate = platformSettings.level1CommissionPct ?? 35;
  const l2Rate = platformSettings.level2CommissionPct ?? 1;
  const l3Rate = platformSettings.level3CommissionPct ?? 1;

  const currentRate = activeLevel === 1 ? l1Rate : activeLevel === 2 ? l2Rate : l3Rate;
  const levelTotalCommission = levelMembers.reduce((sum, m) => sum + m.commission, 0);

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(user.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShare = async () => {
    await shareReferralLink(user.inviteCode, inviteLink);
  };

  return (
    <div className="min-h-screen pb-16 bg-neutral-100 text-neutral-900">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100 shadow-2xs">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-neutral-800 hover:bg-neutral-100 rounded-full transition active:scale-95"
          aria-label="Go back"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <h1 className="text-base font-bold text-neutral-900">Team Hierarchy</h1>

        <button
          onClick={handleShare}
          className="text-xs font-bold text-[#00c269] hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Link</span>
        </button>
      </div>

      {/* Level Selector Tabs */}
      <div className="bg-white border-b border-neutral-200 grid grid-cols-3 text-center text-xs font-bold">
        {[
          { level: 1 as const, label: `LV1 (${l1Rate}%)` },
          { level: 2 as const, label: `LV2 (${l2Rate}%)` },
          { level: 3 as const, label: `LV3 (${l3Rate}%)` },
        ].map((tab) => (
          <button
            key={tab.level}
            onClick={() => setActiveLevel(tab.level)}
            className={`py-3 transition border-b-2 cursor-pointer ${
              activeLevel === tab.level
                ? 'border-[#00c269] text-[#00c269] font-black'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Level Summary Banner */}
      <div className="p-3">
        <div className="bg-white rounded-xl p-4 shadow-xs border border-neutral-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-medium">
              Level {activeLevel} Team Members
            </span>
            <span className="text-xl font-black text-neutral-900">
              {levelMembers.length} Members
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-neutral-400 block font-medium">
              Total Affiliate Earned
            </span>
            <span className="text-xl font-black text-[#00c269]">
              ₦ {levelTotalCommission.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Referral Link Card */}
      <div className="px-3 pb-2">
        <div className="bg-white border border-neutral-200 rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-700 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-emerald-600" />
              Your Real Referral Link
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="text-[11px] font-bold text-neutral-600 hover:text-neutral-900 bg-neutral-100 px-2 py-1 rounded-md"
              >
                {copiedCode ? 'Code Copied' : `Code: ${user.inviteCode}`}
              </button>
              <button
                onClick={handleCopyLink}
                className="text-[11px] font-bold text-white bg-[#00c269] hover:bg-[#00ab5c] px-2.5 py-1 rounded-md flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
          <div className="text-[11px] font-mono text-neutral-500 truncate bg-neutral-50 p-1.5 rounded-lg border border-neutral-100 select-all">
            {inviteLink}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs shadow-2xs">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member phone number..."
            className="w-full bg-transparent focus:outline-hidden text-neutral-800 placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Members List */}
      <div className="p-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-neutral-200 shadow-xs space-y-3">
            <Users className="w-10 h-10 text-neutral-300 mx-auto" />
            <div>
              <p className="text-xs font-semibold text-neutral-700">
                No active members in Level {activeLevel} yet
              </p>
              <p className="text-[11px] text-neutral-400 mt-1 max-w-xs mx-auto">
                Share your official Tesla referral link with friends. When they register and activate VIP nodes, real team commission ({currentRate}%) is automatically credited to your balance.
              </p>
            </div>
            <button
              onClick={handleShare}
              className="px-5 py-2 bg-[#00c269] hover:bg-[#00ab5c] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Referral Link Now</span>
            </button>
          </div>
        ) : (
          filtered.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-xl p-3.5 shadow-2xs border border-neutral-200 flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-900 font-mono">
                    {member.phone}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Valid Member
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400">
                  Joined: {member.joinDate}
                </div>
                <div className="text-[11px] text-neutral-600">
                  Invested: <span className="font-semibold">₦ {member.invested.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-neutral-400">Your Bonus:</div>
                <div className="text-sm font-extrabold text-[#00c269]">
                  +₦ {member.commission.toLocaleString()}
                </div>
                <span className="text-[10px] font-bold text-neutral-500">
                  ({currentRate}%)
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
