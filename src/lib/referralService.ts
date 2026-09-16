import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserState, TeamMember, TransactionRecord, PlatformSettings } from '../types';
import { getLocalAccounts, saveLocalAccounts, LocalAccount } from './authService';

/**
 * Referral & Multi-tier Team Commission Engine
 * Source of truth for referral links, downline trees, and commission distribution.
 */

export interface CommissionResult {
  level: 1 | 2 | 3;
  uplinePhone: string;
  uplineInviteCode: string;
  amount: number;
  commissionPct: number;
  buyerPhone: string;
  details: string;
}

/**
 * Helper: Find account across local storage and Firestore by inviteCode
 */
export async function findUserByInviteCode(
  inviteCode: string
): Promise<{ userState: UserState; source: 'local' | 'firestore'; keyOrUid: string } | null> {
  const cleanCode = (inviteCode || '').trim().toUpperCase();
  if (!cleanCode) return null;

  // 1. Search Local Accounts Registry
  try {
    const local = getLocalAccounts();
    for (const [key, acc] of Object.entries(local)) {
      if (acc?.userState?.inviteCode?.toUpperCase() === cleanCode) {
        return { userState: acc.userState, source: 'local', keyOrUid: key };
      }
    }
  } catch (err) {
    console.warn('Error reading local accounts for invite code:', err);
  }

  // 2. Search Firestore collection
  try {
    const snap = await getDocs(collection(db, 'users'));
    for (const d of snap.docs) {
      const data = d.data() as UserState;
      if (data?.inviteCode?.toUpperCase() === cleanCode) {
        return { userState: { ...data, id: d.id }, source: 'firestore', keyOrUid: d.id };
      }
    }
  } catch (err) {
    console.warn('Error searching Firestore for invite code:', err);
  }

  return null;
}

/**
 * Helper: Persist updated user state to both Local Accounts and Firestore
 */
export async function persistUserUpdates(
  targetPhone: string,
  updater: (prev: UserState) => UserState
): Promise<UserState | null> {
  const digits = targetPhone.replace(/\D/g, '').slice(-10);
  let updatedState: UserState | null = null;

  // 1. Update Local Accounts Registry
  try {
    const local = getLocalAccounts();
    let foundKey = local[digits] ? digits : null;
    if (!foundKey) {
      for (const [k, acc] of Object.entries(local)) {
        if (acc?.phone?.replace(/\D/g, '').slice(-10) === digits) {
          foundKey = k;
          break;
        }
      }
    }

    if (foundKey && local[foundKey]) {
      updatedState = updater(local[foundKey].userState);
      local[foundKey].userState = updatedState;
      local[foundKey].updatedAt = Date.now();
      saveLocalAccounts(local);
    }
  } catch (err) {
    console.warn('Could not persist user update locally:', err);
  }

  // 2. Update Firestore document
  try {
    const snap = await getDocs(collection(db, 'users'));
    for (const d of snap.docs) {
      const data = d.data() as UserState;
      const dDigits = (data.phone || '').replace(/\D/g, '').slice(-10);
      if (dDigits === digits || d.id === digits || d.id === updatedState?.id) {
        const nextData = updater(data);
        await setDoc(doc(db, 'users', d.id), nextData, { merge: true });
        if (!updatedState) updatedState = nextData;
        break;
      }
    }
  } catch (err) {
    console.warn('Could not persist user update to Firestore:', err);
  }

  return updatedState;
}

/**
 * Records a new registered user in their upline's downline tree (Level 1, 2, and 3).
 * Invoked on registration so referral trees accurately capture real members.
 */
export async function recordNewReferralRegistration(
  newUserPhone: string,
  newUserInviteCode: string,
  inviterCode: string
): Promise<void> {
  const cleanInviter = (inviterCode || '').trim().toUpperCase();
  if (!cleanInviter) return;

  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. Find Level 1 Inviter
    const lvl1 = await findUserByInviteCode(cleanInviter);
    if (!lvl1) return;

    // Add new member to Level 1 Inviter's team
    await persistUserUpdates(lvl1.userState.phone, (prev) => {
      const existing = prev.teamMembers || [];
      if (existing.some((m) => m.phone === newUserPhone)) return prev;

      const newMember: TeamMember = {
        id: `tm_l1_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        phone: newUserPhone,
        inviteCode: newUserInviteCode,
        level: 1,
        joinDate: today,
        invested: 0,
        commission: 0,
        status: 'active',
      };

      return {
        ...prev,
        teamMembers: [newMember, ...existing],
      };
    });

    // 2. Check Level 2 Inviter (upline of Level 1)
    const lvl1InvitedBy = lvl1.userState.invitedBy;
    if (!lvl1InvitedBy) return;

    const lvl2 = await findUserByInviteCode(lvl1InvitedBy);
    if (!lvl2) return;

    await persistUserUpdates(lvl2.userState.phone, (prev) => {
      const existing = prev.teamMembers || [];
      if (existing.some((m) => m.phone === newUserPhone)) return prev;

      const newMember: TeamMember = {
        id: `tm_l2_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        phone: newUserPhone,
        inviteCode: newUserInviteCode,
        level: 2,
        joinDate: today,
        invested: 0,
        commission: 0,
        status: 'active',
      };

      return {
        ...prev,
        teamMembers: [newMember, ...existing],
      };
    });

    // 3. Check Level 3 Inviter (upline of Level 2)
    const lvl2InvitedBy = lvl2.userState.invitedBy;
    if (!lvl2InvitedBy) return;

    const lvl3 = await findUserByInviteCode(lvl2InvitedBy);
    if (!lvl3) return;

    await persistUserUpdates(lvl3.userState.phone, (prev) => {
      const existing = prev.teamMembers || [];
      if (existing.some((m) => m.phone === newUserPhone)) return prev;

      const newMember: TeamMember = {
        id: `tm_l3_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        phone: newUserPhone,
        inviteCode: newUserInviteCode,
        level: 3,
        joinDate: today,
        invested: 0,
        commission: 0,
        status: 'active',
      };

      return {
        ...prev,
        teamMembers: [newMember, ...existing],
      };
    });
  } catch (err) {
    console.error('Failed to link referral tree on registration:', err);
  }
}

/**
 * Distributes real team commission to uplines when a member purchases a VIP fleet node.
 * Level 1 receives level1CommissionPct (default 35%)
 * Level 2 receives level2CommissionPct (default 1%)
 * Level 3 receives level3CommissionPct (default 1%)
 */
export async function distributeProductPurchaseCommissions(params: {
  buyerPhone: string;
  buyerInviteCode: string;
  buyerInvitedBy?: string;
  amount: number;
  productTitle: string;
  platformSettings: PlatformSettings;
}): Promise<CommissionResult[]> {
  const { buyerPhone, buyerInviteCode, buyerInvitedBy, amount, productTitle, platformSettings } =
    params;
  const cleanInvitedBy = (buyerInvitedBy || '').trim().toUpperCase();
  if (!cleanInvitedBy) return [];

  const results: CommissionResult[] = [];
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];

  const l1Pct = Number(platformSettings.level1CommissionPct) ?? 35;
  const l2Pct = Number(platformSettings.level2CommissionPct) ?? 1;
  const l3Pct = Number(platformSettings.level3CommissionPct) ?? 1;

  try {
    // -------------------------------------------------------------
    // LEVEL 1 COMMISSION
    // -------------------------------------------------------------
    const lvl1 = await findUserByInviteCode(cleanInvitedBy);
    if (lvl1 && lvl1.userState.phone !== buyerPhone) {
      const comm1 = Math.round(amount * (l1Pct / 100));
      if (comm1 > 0) {
        const rec1: TransactionRecord = {
          id: `comm_l1_${now}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'commission',
          title: 'Level 1 Referral Commission',
          amount: comm1,
          status: 'success',
          timestamp: now,
          details: `${l1Pct}% direct affiliate bonus from ${buyerPhone}'s activation of ${productTitle}`,
        };

        await persistUserUpdates(lvl1.userState.phone, (prev) => {
          const members = [...(prev.teamMembers || [])];
          const mIdx = members.findIndex((m) => m.phone === buyerPhone);
          if (mIdx >= 0) {
            members[mIdx] = {
              ...members[mIdx],
              invested: (members[mIdx].invested || 0) + amount,
              commission: (members[mIdx].commission || 0) + comm1,
            };
          } else {
            members.unshift({
              id: `tm_l1_${now}`,
              phone: buyerPhone,
              inviteCode: buyerInviteCode,
              level: 1,
              joinDate: today,
              invested: amount,
              commission: comm1,
              status: 'active',
            });
          }

          return {
            ...prev,
            balance: (prev.balance || 0) + comm1,
            teamMembers: members,
            records: [rec1, ...(prev.records || [])],
          };
        });

        results.push({
          level: 1,
          uplinePhone: lvl1.userState.phone,
          uplineInviteCode: lvl1.userState.inviteCode,
          amount: comm1,
          commissionPct: l1Pct,
          buyerPhone,
          details: rec1.details || '',
        });
      }

      // -------------------------------------------------------------
      // LEVEL 2 COMMISSION
      // -------------------------------------------------------------
      const lvl1InvitedBy = lvl1.userState.invitedBy;
      if (lvl1InvitedBy) {
        const lvl2 = await findUserByInviteCode(lvl1InvitedBy);
        if (lvl2 && lvl2.userState.phone !== buyerPhone) {
          const comm2 = Math.round(amount * (l2Pct / 100));
          if (comm2 > 0) {
            const rec2: TransactionRecord = {
              id: `comm_l2_${now}_${Math.random().toString(36).substring(2, 6)}`,
              type: 'commission',
              title: 'Level 2 Team Commission',
              amount: comm2,
              status: 'success',
              timestamp: now,
              details: `${l2Pct}% team affiliate bonus from ${buyerPhone}'s activation of ${productTitle}`,
            };

            await persistUserUpdates(lvl2.userState.phone, (prev) => {
              const members = [...(prev.teamMembers || [])];
              const mIdx = members.findIndex((m) => m.phone === buyerPhone);
              if (mIdx >= 0) {
                members[mIdx] = {
                  ...members[mIdx],
                  invested: (members[mIdx].invested || 0) + amount,
                  commission: (members[mIdx].commission || 0) + comm2,
                };
              } else {
                members.unshift({
                  id: `tm_l2_${now}`,
                  phone: buyerPhone,
                  inviteCode: buyerInviteCode,
                  level: 2,
                  joinDate: today,
                  invested: amount,
                  commission: comm2,
                  status: 'active',
                });
              }

              return {
                ...prev,
                balance: (prev.balance || 0) + comm2,
                teamMembers: members,
                records: [rec2, ...(prev.records || [])],
              };
            });

            results.push({
              level: 2,
              uplinePhone: lvl2.userState.phone,
              uplineInviteCode: lvl2.userState.inviteCode,
              amount: comm2,
              commissionPct: l2Pct,
              buyerPhone,
              details: rec2.details || '',
            });
          }

          // -------------------------------------------------------------
          // LEVEL 3 COMMISSION
          // -------------------------------------------------------------
          const lvl2InvitedBy = lvl2.userState.invitedBy;
          if (lvl2InvitedBy) {
            const lvl3 = await findUserByInviteCode(lvl2InvitedBy);
            if (lvl3 && lvl3.userState.phone !== buyerPhone) {
              const comm3 = Math.round(amount * (l3Pct / 100));
              if (comm3 > 0) {
                const rec3: TransactionRecord = {
                  id: `comm_l3_${now}_${Math.random().toString(36).substring(2, 6)}`,
                  type: 'commission',
                  title: 'Level 3 Team Commission',
                  amount: comm3,
                  status: 'success',
                  timestamp: now,
                  details: `${l3Pct}% team affiliate bonus from ${buyerPhone}'s activation of ${productTitle}`,
                };

                await persistUserUpdates(lvl3.userState.phone, (prev) => {
                  const members = [...(prev.teamMembers || [])];
                  const mIdx = members.findIndex((m) => m.phone === buyerPhone);
                  if (mIdx >= 0) {
                    members[mIdx] = {
                      ...members[mIdx],
                      invested: (members[mIdx].invested || 0) + amount,
                      commission: (members[mIdx].commission || 0) + comm3,
                    };
                  } else {
                    members.unshift({
                      id: `tm_l3_${now}`,
                      phone: buyerPhone,
                      inviteCode: buyerInviteCode,
                      level: 3,
                      joinDate: today,
                      invested: amount,
                      commission: comm3,
                      status: 'active',
                    });
                  }

                  return {
                    ...prev,
                    balance: (prev.balance || 0) + comm3,
                    teamMembers: members,
                    records: [rec3, ...(prev.records || [])],
                  };
                });

                results.push({
                  level: 3,
                  uplinePhone: lvl3.userState.phone,
                  uplineInviteCode: lvl3.userState.inviteCode,
                  amount: comm3,
                  commissionPct: l3Pct,
                  buyerPhone,
                  details: rec3.details || '',
                });
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error distributing multi-level commissions:', err);
  }

  return results;
}

/**
 * ADMIN: Reassign a user's inviter code and re-index team members.
 */
export async function adminReassignUserInviter(
  userPhone: string,
  newInviterCode: string
): Promise<{ success: boolean; message: string }> {
  const cleanNewCode = (newInviterCode || '').trim().toUpperCase();
  if (!cleanNewCode) {
    return { success: false, message: 'Invalid inviter code provided.' };
  }

  const targetUpline = await findUserByInviteCode(cleanNewCode);
  if (!targetUpline) {
    return { success: false, message: `No user found with invite code "${cleanNewCode}".` };
  }

  if (targetUpline.userState.phone === userPhone) {
    return { success: false, message: 'A user cannot be their own inviter.' };
  }

  // Update target user's invitedBy
  await persistUserUpdates(userPhone, (prev) => ({
    ...prev,
    invitedBy: cleanNewCode,
  }));

  // Re-link to new inviter
  const targetUserDigits = userPhone.replace(/\D/g, '').slice(-10);
  const localAccounts = getLocalAccounts();
  const targetUserState = localAccounts[targetUserDigits]?.userState;

  await recordNewReferralRegistration(
    userPhone,
    targetUserState?.inviteCode || cleanNewCode,
    cleanNewCode
  );

  return {
    success: true,
    message: `User ${userPhone} inviter successfully reassigned to ${targetUpline.userState.phone} (${cleanNewCode}).`,
  };
}

/**
 * ADMIN: Issue manual commission credit to an upline on behalf of downline activity
 */
export async function adminAwardTeamCommission(
  uplinePhone: string,
  downlinePhone: string,
  amount: number,
  tierLevel: 1 | 2 | 3,
  customNote?: string
): Promise<{ success: boolean; message: string }> {
  if (!uplinePhone || amount <= 0) {
    return { success: false, message: 'Invalid parameters for team commission credit.' };
  }

  const now = Date.now();
  const rec: TransactionRecord = {
    id: `comm_admin_${now}`,
    type: 'commission',
    title: `Level ${tierLevel} Admin Referral Grant`,
    amount,
    status: 'success',
    timestamp: now,
    details:
      customNote ||
      `Administrative Level ${tierLevel} commission granted for downline ${downlinePhone}`,
  };

  const updated = await persistUserUpdates(uplinePhone, (prev) => {
    const members = [...(prev.teamMembers || [])];
    const idx = members.findIndex((m) => m.phone === downlinePhone);
    if (idx >= 0) {
      members[idx] = {
        ...members[idx],
        commission: (members[idx].commission || 0) + amount,
      };
    }

    return {
      ...prev,
      balance: (prev.balance || 0) + amount,
      records: [rec, ...(prev.records || [])],
      teamMembers: members,
    };
  });

  if (!updated) {
    return { success: false, message: `Could not locate user account for ${uplinePhone}.` };
  }

  return {
    success: true,
    message: `Successfully credited ₦${amount.toLocaleString()} commission to ${uplinePhone}!`,
  };
}

/**
 * ADMIN: Inspect complete downline tree for any user (Level 1, 2, 3)
 */
export async function fetchUserDownlineTree(phone: string): Promise<{
  inviterCode: string | null;
  inviterPhone: string | null;
  level1: TeamMember[];
  level2: TeamMember[];
  level3: TeamMember[];
  totalCommission: number;
}> {
  const accounts = getLocalAccounts();
  const rawDigits = phone.replace(/\D/g, '').slice(-10);
  const account =
    accounts[rawDigits] ||
    Object.values(accounts).find(
      (a) => a.phone === phone || a.digits === rawDigits
    );

  const userState = account?.userState;
  if (!userState) {
    return {
      inviterCode: null,
      inviterPhone: null,
      level1: [],
      level2: [],
      level3: [],
      totalCommission: 0,
    };
  }

  const team = userState.teamMembers || [];
  const level1 = team.filter((m) => m.level === 1);
  const level2 = team.filter((m) => m.level === 2);
  const level3 = team.filter((m) => m.level === 3);
  const totalCommission = team.reduce((acc, m) => acc + (m.commission || 0), 0);

  let inviterPhone: string | null = null;
  if (userState.invitedBy) {
    const inviterAcc = Object.values(accounts).find(
      (a) => a.userState?.inviteCode === userState.invitedBy
    );
    if (inviterAcc) {
      inviterPhone = inviterAcc.phone;
    }
  }

  return {
    inviterCode: userState.invitedBy || null,
    inviterPhone,
    level1,
    level2,
    level3,
    totalCommission,
  };
}

