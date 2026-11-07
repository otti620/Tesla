import React, { useEffect, useMemo, useState } from 'react';
import { Crown, Users, TrendingUp, Award, RefreshCw } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db, withFirestoreTimeout } from '../lib/firebase';
import { getLocalAccounts } from '../lib/authService';
import { cleanNigerianPhoneDigits } from '../utils/adminAuth';
import { UserState } from '../types';
import { PROMOTER_MILESTONES, SAMPLE_PROMOTER_LEADERBOARD } from '../data/promoterTiers';

export interface PromoterLeaderboardRow {
  id: string;
  phoneMasked: string;
  rawDigits: string;
  inviteCode?: string;
  activeLevel1Count: number;
  activeVipLevel1Count: number;
  totalEarned: number;
  currentTier: string;
  badge: string;
  isCurrentUser?: boolean;
  isTeamMember?: boolean;
  teamLevel?: 1 | 2 | 3;
}

interface TopPromotersLeaderboardProps {
  user: UserState;
  compact?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
}

function maskPhoneNumber(phone: string): string {
  const digits = cleanNigerianPhoneDigits(phone);
  if (digits && digits.length === 10) {
    const local11 = `0${digits}`;
    return `${local11.slice(0, 4)}***${local11.slice(-4)}`;
  }
  const clean = phone.replace(/\s+/g, '');
  if (clean.length >= 8) {
    return `${clean.slice(0, 4)}***${clean.slice(-3)}`;
  }
  return phone || 'Unknown';
}

function resolveTierAndBadge(activeCount: number): { tierTitle: string; badge: string } {
  const unlocked = [...PROMOTER_MILESTONES]
    .reverse()
    .find((m) => activeCount >= m.requiredActiveInvites);

  if (!unlocked) {
    return {
      tierTitle: activeCount > 0 ? 'Rising Promoter' : 'Starter Promoter',
      badge: activeCount > 0 ? 'Active Promoter' : 'Member',
    };
  }

  return {
    tierTitle: unlocked.title,
    badge: unlocked.title,
  };
}

export const TopPromotersLeaderboard: React.FC<TopPromotersLeaderboardProps> = ({
  user,
  compact = false,
  maxItems,
  onViewAll,
}) => {
  const [cloudUsers, setCloudUsers] = useState<UserState[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterMode, setFilterMode] = useState<'team' | 'all'>('team');

  const fetchCloudPromoters = async () => {
    setIsRefreshing(true);
    try {
      const snap = await withFirestoreTimeout(getDocs(collection(db, 'users')), 2200);
      const list: UserState[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as UserState;
        if (data && data.phone) {
          list.push({ ...data, id: docSnap.id });
        }
      });
      setCloudUsers(list);
    } catch {
      // Fallback to local accounts & current user teamMembers seamlessly
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCloudPromoters();
  }, []);

  const { teamRows, allRows } = useMemo(() => {
    const currentUserDigits = cleanNigerianPhoneDigits(user.phone);
    const knownUsersByDigits = new Map<string, UserState>();

    // 1. Load local accounts
    try {
      const localAccounts = getLocalAccounts();
      for (const [key, acc] of Object.entries(localAccounts)) {
        if (acc?.userState) {
          const digits = cleanNigerianPhoneDigits(acc.userState.phone || key);
          if (digits) {
            knownUsersByDigits.set(digits, acc.userState);
          }
        }
      }
    } catch {
      // ignore local storage read errors
    }

    // 2. Merge cloud users
    for (const cu of cloudUsers) {
      const digits = cleanNigerianPhoneDigits(cu.phone);
      if (!digits) continue;
      const existing = knownUsersByDigits.get(digits);
      if (!existing) {
        knownUsersByDigits.set(digits, cu);
      } else {
        const existingTeamLen = existing.teamMembers?.length || 0;
        const cloudTeamLen = cu.teamMembers?.length || 0;
        knownUsersByDigits.set(digits, {
          ...existing,
          ...cu,
          teamMembers: cloudTeamLen >= existingTeamLen ? cu.teamMembers || [] : existing.teamMembers || [],
          cumulativeIncome: Math.max(Number(existing.cumulativeIncome) || 0, Number(cu.cumulativeIncome) || 0),
        });
      }
    }

    // Ensure current user is up to date in the map
    if (currentUserDigits) {
      knownUsersByDigits.set(currentUserDigits, user);
    }

    // Build a lookup of direct Level 1 downlines by inviter inviteCode
    const downlinesByInviterCode = new Map<string, Set<string>>();
    const activeVipDownlinesByInviterCode = new Map<string, Set<string>>();

    for (const [digits, candidate] of knownUsersByDigits.entries()) {
      const invBy = (candidate.invitedBy || '').trim().toUpperCase();
      if (!invBy) continue;
      if (!downlinesByInviterCode.has(invBy)) {
        downlinesByInviterCode.set(invBy, new Set());
      }
      downlinesByInviterCode.get(invBy)!.add(digits);

      const hasActiveProducts =
        (candidate.purchasedProducts?.length || 0) > 0 ||
        (candidate.records || []).some((r) => r.type === 'purchase' && r.status === 'success');
      if (hasActiveProducts) {
        if (!activeVipDownlinesByInviterCode.has(invBy)) {
          activeVipDownlinesByInviterCode.set(invBy, new Set());
        }
        activeVipDownlinesByInviterCode.get(invBy)!.add(digits);
      }
    }

    // Helper to compute active Level 1 downlines for any user/member
    const computeLevel1Stats = (targetDigits: string, fallbackInviteCode?: string) => {
      const fullUser = knownUsersByDigits.get(targetDigits);
      const inviteCode = (fullUser?.inviteCode || fallbackInviteCode || '').trim().toUpperCase();

      const activeL1DigitsSet = new Set<string>();
      const activeVipL1DigitsSet = new Set<string>();

      // From the user's own teamMembers list
      const l1List = (fullUser?.teamMembers || []).filter((m) => m.level === 1);
      for (const m of l1List) {
        const mDigits = cleanNigerianPhoneDigits(m.phone) || m.phone;
        if (m.status === 'active' || (m.invested || 0) > 0) {
          activeL1DigitsSet.add(mDigits);
        }
        if ((m.invested || 0) > 0) {
          activeVipL1DigitsSet.add(mDigits);
        }
      }

      // From global invitedBy index
      if (inviteCode) {
        const invitedSet = downlinesByInviterCode.get(inviteCode);
        if (invitedSet) {
          invitedSet.forEach((d) => activeL1DigitsSet.add(d));
        }
        const invitedVipSet = activeVipDownlinesByInviterCode.get(inviteCode);
        if (invitedVipSet) {
          invitedVipSet.forEach((d) => activeVipL1DigitsSet.add(d));
        }
      }

      const commissionEarned = (fullUser?.teamMembers || []).reduce(
        (sum, m) => sum + (Number(m.commission) || 0),
        0
      );

      return {
        activeLevel1Count: activeL1DigitsSet.size,
        activeVipLevel1Count: activeVipL1DigitsSet.size,
        totalEarned: Math.max(commissionEarned, Number(fullUser?.cumulativeIncome) || 0),
        inviteCode: fullUser?.inviteCode || fallbackInviteCode,
      };
    };

    // Build rows for current user + their team members
    const teamMap = new Map<string, PromoterLeaderboardRow>();

    // Add current user
    if (currentUserDigits) {
      const stats = computeLevel1Stats(currentUserDigits, user.inviteCode);
      const { tierTitle, badge } = resolveTierAndBadge(stats.activeLevel1Count);
      teamMap.set(currentUserDigits, {
        id: `promoter_${currentUserDigits}`,
        phoneMasked: maskPhoneNumber(user.phone),
        rawDigits: currentUserDigits,
        inviteCode: user.inviteCode,
        activeLevel1Count: stats.activeLevel1Count,
        activeVipLevel1Count: stats.activeVipLevel1Count,
        totalEarned: stats.totalEarned,
        currentTier: tierTitle,
        badge,
        isCurrentUser: true,
        isTeamMember: true,
      });
    }

    // Add each member from user.teamMembers
    for (const tm of user.teamMembers || []) {
      const tmDigits = cleanNigerianPhoneDigits(tm.phone) || tm.phone;
      if (!tmDigits || teamMap.has(tmDigits)) continue;

      const stats = computeLevel1Stats(tmDigits, tm.inviteCode);
      const { tierTitle, badge } = resolveTierAndBadge(stats.activeLevel1Count);

      teamMap.set(tmDigits, {
        id: tm.id || `promoter_${tmDigits}`,
        phoneMasked: maskPhoneNumber(tm.phone),
        rawDigits: tmDigits,
        inviteCode: stats.inviteCode,
        activeLevel1Count: stats.activeLevel1Count,
        activeVipLevel1Count: stats.activeVipLevel1Count,
        totalEarned: Math.max(stats.totalEarned, Number(tm.commission) || 0),
        currentTier: tierTitle,
        badge,
        isCurrentUser: false,
        isTeamMember: true,
        teamLevel: tm.level,
      });
    }

    // Sort team members by highest count of active Level 1 downlines
    const sortedTeamRows = Array.from(teamMap.values()).sort((a, b) => {
      if (b.activeLevel1Count !== a.activeLevel1Count) {
        return b.activeLevel1Count - a.activeLevel1Count;
      }
      if (b.activeVipLevel1Count !== a.activeVipLevel1Count) {
        return b.activeVipLevel1Count - a.activeVipLevel1Count;
      }
      return b.totalEarned - a.totalEarned;
    });

    // Build platform-wide leaderboard combining known users + sample top promoters
    const platformMap = new Map<string, PromoterLeaderboardRow>(teamMap);

    for (const [digits, knownUser] of knownUsersByDigits.entries()) {
      if (platformMap.has(digits)) continue;
      const stats = computeLevel1Stats(digits, knownUser.inviteCode);
      if (stats.activeLevel1Count <= 0 && stats.totalEarned <= 0) continue;
      const { tierTitle, badge } = resolveTierAndBadge(stats.activeLevel1Count);
      platformMap.set(digits, {
        id: `promoter_${digits}`,
        phoneMasked: maskPhoneNumber(knownUser.phone),
        rawDigits: digits,
        inviteCode: knownUser.inviteCode,
        activeLevel1Count: stats.activeLevel1Count,
        activeVipLevel1Count: stats.activeVipLevel1Count,
        totalEarned: stats.totalEarned,
        currentTier: tierTitle,
        badge,
        isCurrentUser: digits === currentUserDigits,
        isTeamMember: false,
      });
    }

    // Include benchmark platform leaders so platform view is always rich
    for (const sample of SAMPLE_PROMOTER_LEADERBOARD) {
      const sampleKey = `sample_${sample.rank}`;
      if (!platformMap.has(sampleKey)) {
        platformMap.set(sampleKey, {
          id: sampleKey,
          phoneMasked: sample.phoneMasked,
          rawDigits: sampleKey,
          activeLevel1Count: sample.activeInvites,
          activeVipLevel1Count: sample.activeInvites,
          totalEarned: sample.totalEarned,
          currentTier: sample.currentTier,
          badge: sample.badge,
          isCurrentUser: false,
          isTeamMember: false,
        });
      }
    }

    const sortedAllRows = Array.from(platformMap.values()).sort((a, b) => {
      if (b.activeLevel1Count !== a.activeLevel1Count) {
        return b.activeLevel1Count - a.activeLevel1Count;
      }
      return b.totalEarned - a.totalEarned;
    });

    return {
      teamRows: sortedTeamRows,
      allRows: sortedAllRows,
    };
  }, [user, cloudUsers]);

  // If user has team members, default to showing team members; if no other team members yet, still show team tab or allow toggle
  const activeList = filterMode === 'team' ? teamRows : allRows;
  const displayedRows = maxItems ? activeList.slice(0, maxItems) : activeList;

  return (
    <div className="space-y-3">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-[#1a2e05] border border-[#a3e635]/35 text-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#a3e635]/20 border border-[#a3e635]/40 flex items-center justify-center text-[#a3e635]">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[#a3e635] flex items-center gap-1.5">
                Top Promoters Leaderboard
              </h3>
              <p className="text-[11px] text-neutral-300">
                Ranked by highest count of active Level 1 downlines
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchCloudPromoters}
            disabled={isRefreshing}
            title="Refresh Leaderboard"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-200 border border-white/10 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#a3e635]' : ''}`} />
          </button>
        </div>

        {/* Toggle Filter: Team Members vs Platform Leaders */}
        <div className="mt-3 flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setFilterMode('team')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              filterMode === 'team'
                ? 'bg-[#a3e635] text-neutral-950 font-black shadow-sm'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            My Team Members ({teamRows.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              filterMode === 'all'
                ? 'bg-[#a3e635] text-neutral-950 font-black shadow-sm'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            All Top Promoters
          </button>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm divide-y divide-neutral-100 overflow-hidden">
        {displayedRows.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <Users className="w-8 h-8 text-neutral-300 mx-auto" />
            <div className="text-xs font-bold text-neutral-700">No Team Promoters Recorded Yet</div>
            <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
              Share your referral link to build your Level 1 downline team and climb the Top Promoters leaderboard.
            </p>
          </div>
        ) : (
          displayedRows.map((promoter, index) => {
            const rank = index + 1;
            return (
              <div
                key={promoter.id}
                className={`p-3.5 flex items-center justify-between transition-colors ${
                  promoter.isCurrentUser ? 'bg-lime-50/60' : 'hover:bg-neutral-50/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Badge */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      rank === 1
                        ? 'bg-neutral-950 text-[#a3e635] border border-[#a3e635] font-black shadow-sm'
                        : rank === 2
                        ? 'bg-lime-100 text-lime-900 border border-lime-300 font-black'
                        : rank === 3
                        ? 'bg-lime-50 text-lime-800 border border-lime-200 font-bold'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {rank}
                  </div>

                  {/* Promoter Info */}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">{promoter.phoneMasked}</span>
                      {promoter.isCurrentUser && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-950 text-[#a3e635] font-black uppercase tracking-wider">
                          You
                        </span>
                      )}
                      {promoter.teamLevel && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-lime-100 text-lime-900 border border-lime-300 font-bold">
                          Lv.{promoter.teamLevel} Member
                        </span>
                      )}
                      {!promoter.isCurrentUser && !promoter.teamLevel && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-medium truncate">
                          {promoter.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                      <span className="truncate">{promoter.currentTier}</span>
                      {promoter. totalEarned > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-[#4d7c0f] font-semibold">
                            ₦{promoter.totalEarned.toLocaleString()} earned
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active Level 1 Downlines Count */}
                <div className="text-right shrink-0 ml-2">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-950 text-[#a3e635] border border-[#a3e635]/40 text-xs font-black">
                    <Award className="w-3.5 h-3.5 text-[#a3e635]" />
                    <span>{promoter.activeLevel1Count}</span>
                    <span className="text-[10px] font-bold text-neutral-300">Lv.1</span>
                  </div>
                  <div className="text-[9px] text-neutral-400 mt-0.5 font-medium">
                    Active Level 1 Downlines
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Optional View All Footer when in compact mode */}
      {compact && onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="w-full py-2.5 px-4 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          <TrendingUp className="w-3.5 h-3.5 text-[#65a30d]" />
          View Full Top Promoters Leaderboard
        </button>
      )}
    </div>
  );
};
