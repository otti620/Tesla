import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, withFirestoreTimeout } from './firebase';
import { UserState, TeamMember, TransactionRecord, PlatformSettings } from '../types';
import { getLocalAccounts, saveLocalAccounts, mergeUserStates } from './authService';
import { cleanNigerianPhoneDigits } from '../utils/adminAuth';
import { sanitizeForFirestore } from '../utils/firestoreSanitizer';
import { getCanonicalProduct, mergeTransactionRecords } from '../utils/productUtils';
import { INITIAL_PLATFORM_SETTINGS } from '../data/initialData';

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
 * Merges two TeamMember arrays without losing members or downgrading invested/commission totals.
 */
export function mergeTeamMembers(
  existing?: TeamMember[],
  incoming?: TeamMember[]
): TeamMember[] {
  const map = new Map<string, TeamMember>();

  const addMember = (m: TeamMember) => {
    if (!m || !m.phone) return;
    const digits = cleanNigerianPhoneDigits(m.phone) || m.phone.trim();
    const key = `${m.level}_${digits}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, {
        ...m,
        invested: Number(m.invested) || 0,
        commission: Number(m.commission) || 0,
        status: m.status || 'active',
      });
    } else {
      map.set(key, {
        ...prev,
        ...m,
        id: prev.id || m.id,
        inviteCode: m.inviteCode || prev.inviteCode,
        joinDate: prev.joinDate || m.joinDate,
        invested: Math.max(Number(prev.invested) || 0, Number(m.invested) || 0),
        commission: Math.max(Number(prev.commission) || 0, Number(m.commission) || 0),
        status: 'active',
      });
    }
  };

  (existing || []).forEach(addMember);
  (incoming || []).forEach(addMember);

  return Array.from(map.values());
}

/**
 * Returns all invite codes that belong to a given user (including master admin aliases).
 */
export function getUserInviteCodeAliases(user: { phone?: string; inviteCode?: string }): Set<string> {
  const codes = new Set<string>();
  if (user.inviteCode) {
    codes.add(user.inviteCode.trim().toUpperCase());
  }
  const digits = cleanNigerianPhoneDigits(user.phone || '');
  if (digits === '7077599057') {
    codes.add('TSLROOT1');
    codes.add('P5ZP4S');
  } else if (digits === '9011711470') {
    codes.add('TSLROOT2');
  }
  return codes;
}

/**
 * Calculates total amount invested by a user based on their purchasedProducts and purchase records.
 */
export function calculateUserTotalInvested(u: Partial<UserState>): number {
  let fromProducts = 0;
  if (Array.isArray(u.purchasedProducts) && u.purchasedProducts.length > 0) {
    for (const p of u.purchasedProducts) {
      const canonical = getCanonicalProduct(p.productId) || getCanonicalProduct(p.vipLevel);
      if (canonical) {
        fromProducts += canonical.price;
      } else if (p.dailyIncome) {
        fromProducts += Math.round(p.dailyIncome * 3.75);
      }
    }
  }

  let fromRecords = 0;
  if (Array.isArray(u.records)) {
    for (const r of u.records) {
      if (r.type === 'purchase' && r.status === 'success') {
        fromRecords += Number(r.amount) || 0;
      }
    }
  }

  return Math.max(fromProducts, fromRecords);
}

/**
 * Helper: Find account across local storage and Firestore by inviteCode or Phone
 */
export async function findUserByInviteCode(
  inviteCode: string
): Promise<{ userState: UserState; source: 'local' | 'firestore'; keyOrUid: string } | null> {
  const cleanCode = (inviteCode || '').trim().toUpperCase();
  if (!cleanCode) return null;
  const cleanDigits = cleanNigerianPhoneDigits(cleanCode);

  // 1. Check known master codes
  if (cleanCode === 'TSLROOT1' || cleanCode === 'P5ZP4S') {
    const rootSearch = await findUserByInviteCode('7077599057');
    if (rootSearch) return rootSearch;
  }
  if (cleanCode === 'TSLROOT2') {
    const rootSearch = await findUserByInviteCode('9011711470');
    if (rootSearch) return rootSearch;
  }

  // 2. Search Local Accounts Registry
  let localMatch: { userState: UserState; source: 'local'; keyOrUid: string } | null = null;
  try {
    const local = getLocalAccounts();
    for (const [key, acc] of Object.entries(local)) {
      if (acc?.userState?.inviteCode?.toUpperCase() === cleanCode) {
        localMatch = { userState: acc.userState, source: 'local', keyOrUid: key };
        break;
      }
      if (
        cleanDigits &&
        (cleanNigerianPhoneDigits(acc?.phone || '') === cleanDigits ||
          cleanNigerianPhoneDigits(key) === cleanDigits)
      ) {
        localMatch = { userState: acc.userState, source: 'local', keyOrUid: key };
        break;
      }
    }
  } catch (err) {
    console.warn('Error reading local accounts for invite code:', err);
  }

  // 3. Search Firestore collection (with fast timeout) so cloud state is also checked
  try {
    if (cleanDigits) {
      const directDigitsDoc = await withFirestoreTimeout(getDoc(doc(db, 'users', cleanDigits)), 1800);
      if (directDigitsDoc.exists()) {
        const dData = directDigitsDoc.data() as UserState;
        const mergedState: UserState = localMatch
          ? mergeUserStates(localMatch.userState, dData)
          : { ...dData, id: directDigitsDoc.id };
        return { userState: mergedState, source: 'firestore', keyOrUid: directDigitsDoc.id };
      }
    }

    const snap = await withFirestoreTimeout(getDocs(collection(db, 'users')), 2200);
    for (const d of snap.docs) {
      const data = d.data() as UserState;
      if (
        data?.inviteCode?.toUpperCase() === cleanCode ||
        (cleanDigits &&
          (cleanNigerianPhoneDigits(data?.phone || '') === cleanDigits ||
            cleanNigerianPhoneDigits(d.id) === cleanDigits))
      ) {
        const mergedState: UserState = localMatch
          ? mergeUserStates(localMatch.userState, data)
          : { ...data, id: d.id };
        return { userState: mergedState, source: 'firestore', keyOrUid: d.id };
      }
    }
  } catch {
    // Firestore offline or timed out; fall back to localMatch
  }

  return localMatch;
}

/**
 * Helper: Persist updated user state to both Local Accounts and Firestore
 */
export async function persistUserUpdates(
  targetPhone: string,
  updater: (prev: UserState) => UserState
): Promise<UserState | null> {
  const digits = cleanNigerianPhoneDigits(targetPhone);
  let updatedState: UserState | null = null;

  // 1. Update Local Accounts Registry
  try {
    const local = getLocalAccounts();
    let foundKey = local[digits] ? digits : null;
    if (!foundKey) {
      for (const [k, acc] of Object.entries(local)) {
        if (cleanNigerianPhoneDigits(acc?.phone || '') === digits) {
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

  // 2. Update Firestore documents (synchronize both UID doc and cleanDigits doc with timeout)
  try {
    if (digits) {
      const directRef = doc(db, 'users', digits);
      try {
        const directSnap = await withFirestoreTimeout(getDoc(directRef), 1500);
        if (directSnap.exists()) {
          const cloudPrev = directSnap.data() as UserState;
          const mergedPrev: UserState = updatedState
            ? {
                ...cloudPrev,
                ...updatedState,
                teamMembers: mergeTeamMembers(cloudPrev.teamMembers, updatedState.teamMembers),
              }
            : cloudPrev;
          const nextData = updatedState || updater(mergedPrev);
          updatedState = nextData;
          const payload = sanitizeForFirestore({ ...nextData, updatedAt: Date.now() });
          await withFirestoreTimeout(setDoc(directRef, payload, { merge: true }), 1800);
        } else if (updatedState) {
          const payload = sanitizeForFirestore({ ...updatedState, updatedAt: Date.now() });
          await withFirestoreTimeout(setDoc(directRef, payload, { merge: true }), 1800);
        }
      } catch {}
    }

    const snap = await withFirestoreTimeout(getDocs(collection(db, 'users')), 2000);
    for (const d of snap.docs) {
      if (d.id === digits) continue;
      const data = d.data() as UserState;
      const dDigits = cleanNigerianPhoneDigits(data.phone || '');
      if (dDigits === digits || (updatedState?.id && d.id === updatedState.id)) {
        const nextData = updatedState
          ? {
              ...data,
              ...updatedState,
              teamMembers: mergeTeamMembers(data.teamMembers, updatedState.teamMembers),
            }
          : updater(data);
        if (!updatedState) updatedState = nextData;
        const payload = sanitizeForFirestore({ ...nextData, updatedAt: Date.now() });
        await withFirestoreTimeout(setDoc(doc(db, 'users', d.id), payload, { merge: true }), 1800);
      }
    }
  } catch {
    // Offline fallback already saved to local storage
  }

  // 3. Update active session in localStorage if target matches currently logged-in user
  try {
    const sessionRaw = localStorage.getItem('tesla_app_state_v2');
    if (sessionRaw) {
      const sessionUser = JSON.parse(sessionRaw) as UserState;
      const sessionDigits = cleanNigerianPhoneDigits(sessionUser.phone || '');
      if (sessionDigits === digits) {
        const nextSessionState = updatedState
          ? {
              ...sessionUser,
              ...updatedState,
              teamMembers: mergeTeamMembers(sessionUser.teamMembers, updatedState.teamMembers),
            }
          : updater(sessionUser);
        localStorage.setItem('tesla_app_state_v2', JSON.stringify(nextSessionState));
        window.dispatchEvent(new CustomEvent('tesla_user_state_updated', { detail: nextSessionState }));
        window.dispatchEvent(
          new CustomEvent('tesla_user_balance_updated', { detail: { balance: nextSessionState.balance } })
        );
      }
    }
  } catch {}

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
  const newDigits = cleanNigerianPhoneDigits(newUserPhone);

  try {
    // 1. Find Level 1 Inviter
    const lvl1 = await findUserByInviteCode(cleanInviter);
    if (!lvl1) return;

    const lvl1Digits = cleanNigerianPhoneDigits(lvl1.userState.phone);
    if (lvl1Digits === newDigits) return; // Prevent self-referral

    // Add new member to Level 1 Inviter's team
    await persistUserUpdates(lvl1.userState.phone, (prev) => {
      const existing = prev.teamMembers || [];
      if (
        existing.some(
          (m) =>
            m.level === 1 &&
            (cleanNigerianPhoneDigits(m.phone) === newDigits || m.inviteCode === newUserInviteCode)
        )
      ) {
        return prev;
      }

      const newMember: TeamMember = {
        id: `tm_l1_${newDigits || Date.now()}`,
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
        teamMembers: mergeTeamMembers([newMember], existing),
      };
    });

    // 2. Check Level 2 Inviter (upline of Level 1)
    const lvl1InvitedBy = lvl1.userState.invitedBy;
    if (!lvl1InvitedBy) return;

    const lvl2 = await findUserByInviteCode(lvl1InvitedBy);
    if (!lvl2) return;

    const lvl2Digits = cleanNigerianPhoneDigits(lvl2.userState.phone);
    if (lvl2Digits === newDigits || lvl2Digits === lvl1Digits) return;

    await persistUserUpdates(lvl2.userState.phone, (prev) => {
      const existing = prev.teamMembers || [];
      if (
        existing.some(
          (m) =>
            m.level === 2 &&
            (cleanNigerianPhoneDigits(m.phone) === newDigits || m.inviteCode === newUserInviteCode)
        )
      ) {
        return prev;
      }

      const newMember: TeamMember = {
        id: `tm_l2_${newDigits || Date.now()}`,
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
        teamMembers: mergeTeamMembers([newMember], existing),
      };
    });

    // 3. Check Level 3 Inviter (upline of Level 2)
    const lvl2InvitedBy = lvl2.userState.invitedBy;
    if (!lvl2InvitedBy) return;

    const lvl3 = await findUserByInviteCode(lvl2InvitedBy);
    if (!lvl3) return;

    const lvl3Digits = cleanNigerianPhoneDigits(lvl3.userState.phone);
    if (lvl3Digits === newDigits || lvl3Digits === lvl1Digits || lvl3Digits === lvl2Digits) return;

    await persistUserUpdates(lvl3.userState.phone, (prev) => {
      const existing = prev.teamMembers || [];
      if (
        existing.some(
          (m) =>
            m.level === 3 &&
            (cleanNigerianPhoneDigits(m.phone) === newDigits || m.inviteCode === newUserInviteCode)
        )
      ) {
        return prev;
      }

      const newMember: TeamMember = {
        id: `tm_l3_${newDigits || Date.now()}`,
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
        teamMembers: mergeTeamMembers([newMember], existing),
      };
    });
  } catch (err) {
    console.error('Failed to link referral tree on registration:', err);
  }
}

/**
 * Distributes real team commission to uplines when a member purchases a VIP fleet node.
 * Level 1 receives level1CommissionPct (default 25%)
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
  orderOrInstanceId?: string;
}): Promise<CommissionResult[]> {
  const {
    buyerPhone,
    buyerInviteCode,
    buyerInvitedBy,
    amount,
    productTitle,
    platformSettings,
    orderOrInstanceId,
  } = params;

  let cleanInvitedBy = (buyerInvitedBy || '').trim().toUpperCase();

  // If buyerInvitedBy is missing, auto-discover from user document in Firestore / Local Accounts
  if (!cleanInvitedBy) {
    const buyerAccount = await findUserByInviteCode(buyerInviteCode || buyerPhone);
    if (buyerAccount?.userState?.invitedBy) {
      cleanInvitedBy = buyerAccount.userState.invitedBy.trim().toUpperCase();
    }
  }

  if (!cleanInvitedBy) {
    return [];
  }

  const results: CommissionResult[] = [];
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];
  const buyerCleanDigits = cleanNigerianPhoneDigits(buyerPhone);
  const uniqueIdSuffix =
    orderOrInstanceId ||
    `${buyerCleanDigits}_${amount}_${productTitle.replace(/\s+/g, '_')}_${now}`;

  const l1Pct = Number(platformSettings.level1CommissionPct) || 25;
  const l2Pct = Number(platformSettings.level2CommissionPct) || 1;
  const l3Pct = Number(platformSettings.level3CommissionPct) || 1;

  try {
    // -------------------------------------------------------------
    // LEVEL 1 COMMISSION
    // -------------------------------------------------------------
    const lvl1 = await findUserByInviteCode(cleanInvitedBy);
    if (lvl1 && cleanNigerianPhoneDigits(lvl1.userState.phone) !== buyerCleanDigits) {
      const comm1 = Math.round(amount * (l1Pct / 100));
      const recId1 = `comm_l1_${uniqueIdSuffix}`;
      if (comm1 > 0) {
        const rec1: TransactionRecord = {
          id: recId1,
          type: 'commission',
          title: 'Level 1 Referral Commission',
          amount: comm1,
          status: 'success',
          timestamp: now,
          details: `${l1Pct}% direct affiliate bonus from ${buyerPhone}'s activation of ${productTitle} (₦${amount.toLocaleString()})`,
        };

        try {
          const commPayload = sanitizeForFirestore({
            id: recId1,
            uplinePhone: lvl1.userState.phone,
            uplineInviteCode: lvl1.userState.inviteCode,
            buyerPhone,
            level: 1,
            amount: comm1,
            productTitle,
            timestamp: now,
            status: 'success',
          });
          withFirestoreTimeout(setDoc(doc(db, 'commissions', recId1), commPayload), 1800).catch(() => {});
        } catch {}

        await persistUserUpdates(lvl1.userState.phone, (prev) => {
          if (prev.records?.some((r) => r.id === recId1)) {
            return prev;
          }

          const members = [...(prev.teamMembers || [])];
          const mIdx = members.findIndex(
            (m) =>
              m.level === 1 &&
              (cleanNigerianPhoneDigits(m.phone) === buyerCleanDigits ||
                (buyerInviteCode && m.inviteCode === buyerInviteCode))
          );
          if (mIdx >= 0) {
            members[mIdx] = {
              ...members[mIdx],
              invested: (members[mIdx].invested || 0) + amount,
              commission: (members[mIdx].commission || 0) + comm1,
              status: 'active',
            };
          } else {
            members.unshift({
              id: `tm_l1_${buyerCleanDigits || now}`,
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
            cumulativeIncome: (prev.cumulativeIncome || 0) + comm1,
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
      let lvl1InvitedBy = lvl1.userState.invitedBy;
      if (!lvl1InvitedBy) {
        const lvl1Fresh = await findUserByInviteCode(lvl1.userState.inviteCode || lvl1.userState.phone);
        lvl1InvitedBy = lvl1Fresh?.userState?.invitedBy;
      }

      if (lvl1InvitedBy) {
        const lvl2 = await findUserByInviteCode(lvl1InvitedBy);
        if (
          lvl2 &&
          cleanNigerianPhoneDigits(lvl2.userState.phone) !== buyerCleanDigits &&
          cleanNigerianPhoneDigits(lvl2.userState.phone) !==
            cleanNigerianPhoneDigits(lvl1.userState.phone)
        ) {
          const comm2 = Math.round(amount * (l2Pct / 100));
          const recId2 = `comm_l2_${uniqueIdSuffix}`;
          if (comm2 > 0) {
            const rec2: TransactionRecord = {
              id: recId2,
              type: 'commission',
              title: 'Level 2 Team Commission',
              amount: comm2,
              status: 'success',
              timestamp: now,
              details: `${l2Pct}% team affiliate bonus from ${buyerPhone}'s activation of ${productTitle} (₦${amount.toLocaleString()})`,
            };

            try {
              const commPayload2 = sanitizeForFirestore({
                id: recId2,
                uplinePhone: lvl2.userState.phone,
                uplineInviteCode: lvl2.userState.inviteCode,
                buyerPhone,
                level: 2,
                amount: comm2,
                productTitle,
                timestamp: now,
                status: 'success',
              });
              withFirestoreTimeout(setDoc(doc(db, 'commissions', recId2), commPayload2), 1800).catch(() => {});
            } catch {}

            await persistUserUpdates(lvl2.userState.phone, (prev) => {
              if (prev.records?.some((r) => r.id === recId2)) {
                return prev;
              }

              const members = [...(prev.teamMembers || [])];
              const mIdx = members.findIndex(
                (m) =>
                  m.level === 2 &&
                  (cleanNigerianPhoneDigits(m.phone) === buyerCleanDigits ||
                    (buyerInviteCode && m.inviteCode === buyerInviteCode))
              );
              if (mIdx >= 0) {
                members[mIdx] = {
                  ...members[mIdx],
                  invested: (members[mIdx].invested || 0) + amount,
                  commission: (members[mIdx].commission || 0) + comm2,
                  status: 'active',
                };
              } else {
                members.unshift({
                  id: `tm_l2_${buyerCleanDigits || now}`,
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
                cumulativeIncome: (prev.cumulativeIncome || 0) + comm2,
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
          let lvl2InvitedBy = lvl2.userState.invitedBy;
          if (!lvl2InvitedBy) {
            const lvl2Fresh = await findUserByInviteCode(
              lvl2.userState.inviteCode || lvl2.userState.phone
            );
            lvl2InvitedBy = lvl2Fresh?.userState?.invitedBy;
          }

          if (lvl2InvitedBy) {
            const lvl3 = await findUserByInviteCode(lvl2InvitedBy);
            if (
              lvl3 &&
              cleanNigerianPhoneDigits(lvl3.userState.phone) !== buyerCleanDigits &&
              cleanNigerianPhoneDigits(lvl3.userState.phone) !==
                cleanNigerianPhoneDigits(lvl1.userState.phone) &&
              cleanNigerianPhoneDigits(lvl3.userState.phone) !==
                cleanNigerianPhoneDigits(lvl2.userState.phone)
            ) {
              const comm3 = Math.round(amount * (l3Pct / 100));
              const recId3 = `comm_l3_${uniqueIdSuffix}`;
              if (comm3 > 0) {
                const rec3: TransactionRecord = {
                  id: recId3,
                  type: 'commission',
                  title: 'Level 3 Team Commission',
                  amount: comm3,
                  status: 'success',
                  timestamp: now,
                  details: `${l3Pct}% team affiliate bonus from ${buyerPhone}'s activation of ${productTitle} (₦${amount.toLocaleString()})`,
                };

                try {
                  const commPayload3 = sanitizeForFirestore({
                    id: recId3,
                    uplinePhone: lvl3.userState.phone,
                    uplineInviteCode: lvl3.userState.inviteCode,
                    buyerPhone,
                    level: 3,
                    amount: comm3,
                    productTitle,
                    timestamp: now,
                    status: 'success',
                  });
                  withFirestoreTimeout(setDoc(doc(db, 'commissions', recId3), commPayload3), 1800).catch(
                    () => {}
                  );
                } catch {}

                await persistUserUpdates(lvl3.userState.phone, (prev) => {
                  if (prev.records?.some((r) => r.id === recId3)) {
                    return prev;
                  }

                  const members = [...(prev.teamMembers || [])];
                  const mIdx = members.findIndex(
                    (m) =>
                      m.level === 3 &&
                      (cleanNigerianPhoneDigits(m.phone) === buyerCleanDigits ||
                        (buyerInviteCode && m.inviteCode === buyerInviteCode))
                  );
                  if (mIdx >= 0) {
                    members[mIdx] = {
                      ...members[mIdx],
                      invested: (members[mIdx].invested || 0) + amount,
                      commission: (members[mIdx].commission || 0) + comm3,
                      status: 'active',
                    };
                  } else {
                    members.unshift({
                      id: `tm_l3_${buyerCleanDigits || now}`,
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
                    cumulativeIncome: (prev.cumulativeIncome || 0) + comm3,
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
 * Collects all known user states across Local Accounts Registry and Firestore.
 */
async function collectAllKnownUsers(): Promise<Map<string, UserState>> {
  const userByDigits = new Map<string, UserState>();

  try {
    const local = getLocalAccounts();
    for (const [k, acc] of Object.entries(local)) {
      if (acc?.userState) {
        const digits = cleanNigerianPhoneDigits(acc.userState.phone || k);
        if (digits) {
          userByDigits.set(digits, acc.userState);
        }
      }
    }
  } catch {}

  try {
    const snap = await withFirestoreTimeout(getDocs(collection(db, 'users')), 2200);
    snap.forEach((d) => {
      const data = d.data() as UserState;
      const digits = cleanNigerianPhoneDigits(data.phone || d.id);
      if (!digits) return;
      const prev = userByDigits.get(digits);
      if (!prev) {
        userByDigits.set(digits, { ...data, id: d.id });
      } else {
        userByDigits.set(digits, mergeUserStates(prev, data));
      }
    });
  } catch {}

  return userByDigits;
}

/**
 * Reconciles a user's 3-level team hierarchy and ensures any uncredited referral commissions
 * from downline VIP product purchases are automatically synced and credited.
 */
export async function reconcileUserTeamAndCommissions(
  user: UserState,
  platformSettings: PlatformSettings = INITIAL_PLATFORM_SETTINGS
): Promise<{
  updatedUser: UserState;
  changed: boolean;
  newlyCreditedCommission: number;
}> {
  const userDigits = cleanNigerianPhoneDigits(user.phone);
  if (!userDigits || !user.inviteCode) {
    return { updatedUser: user, changed: false, newlyCreditedCommission: 0 };
  }

  const allUsers = await collectAllKnownUsers();
  const rootCodes = getUserInviteCodeAliases(user);

  const l1Pct = Number(platformSettings.level1CommissionPct) || 25;
  const l2Pct = Number(platformSettings.level2CommissionPct) || 1;
  const l3Pct = Number(platformSettings.level3CommissionPct) || 1;

  const discoveredMembers: TeamMember[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Level 1: Users invited by any of user's inviteCode aliases
  const l1Users: UserState[] = [];
  const l1Codes = new Set<string>();

  for (const [digits, candidate] of allUsers.entries()) {
    if (digits === userDigits) continue;
    const invBy = (candidate.invitedBy || '').trim().toUpperCase();
    if (invBy && rootCodes.has(invBy)) {
      l1Users.push(candidate);
      if (candidate.inviteCode) {
        l1Codes.add(candidate.inviteCode.trim().toUpperCase());
      }
    }
  }

  // Level 2: Users invited by any Level 1 user
  const l2Users: UserState[] = [];
  const l2Codes = new Set<string>();

  if (l1Codes.size > 0) {
    for (const [digits, candidate] of allUsers.entries()) {
      if (digits === userDigits || l1Users.some((u) => cleanNigerianPhoneDigits(u.phone) === digits)) {
        continue;
      }
      const invBy = (candidate.invitedBy || '').trim().toUpperCase();
      if (invBy && l1Codes.has(invBy)) {
        l2Users.push(candidate);
        if (candidate.inviteCode) {
          l2Codes.add(candidate.inviteCode.trim().toUpperCase());
        }
      }
    }
  }

  // Level 3: Users invited by any Level 2 user
  const l3Users: UserState[] = [];
  if (l2Codes.size > 0) {
    for (const [digits, candidate] of allUsers.entries()) {
      if (
        digits === userDigits ||
        l1Users.some((u) => cleanNigerianPhoneDigits(u.phone) === digits) ||
        l2Users.some((u) => cleanNigerianPhoneDigits(u.phone) === digits)
      ) {
        continue;
      }
      const invBy = (candidate.invitedBy || '').trim().toUpperCase();
      if (invBy && l2Codes.has(invBy)) {
        l3Users.push(candidate);
      }
    }
  }

  let additionalCommissionToCredit = 0;
  const newCommissionRecords: TransactionRecord[] = [];
  const existingRecords = [...(user.records || [])];

  const processTierUsers = (tierUsers: UserState[], level: 1 | 2 | 3, pct: number) => {
    for (const memberUser of tierUsers) {
      const mDigits = cleanNigerianPhoneDigits(memberUser.phone);
      if (!mDigits || mDigits === userDigits) {
        continue; // Strictly skip self or invalid downline
      }

      const existingMember = (user.teamMembers || []).find(
        (tm) =>
          tm.level === level &&
          (cleanNigerianPhoneDigits(tm.phone) === mDigits ||
            (memberUser.inviteCode && tm.inviteCode === memberUser.inviteCode))
      );

      const actualInvested = Math.max(
        existingMember?.invested || 0,
        calculateUserTotalInvested(memberUser)
      );
      const expectedCommission = Math.round(actualInvested * (pct / 100));

      // Match all commission records that reference this downline member
      const isRecordFromBuyer = (r: TransactionRecord) => {
        if (r.type !== 'commission') return false;
        if (mDigits && (r.details?.includes(mDigits) || r.id?.includes(mDigits))) return true;
        if (memberUser.phone && (r.details?.includes(memberUser.phone) || r.id?.includes(memberUser.phone))) return true;
        if (memberUser.inviteCode && (r.details?.includes(memberUser.inviteCode) || r.id?.includes(memberUser.inviteCode))) return true;
        return false;
      };

      const buyerCommissionRecords = existingRecords.filter(isRecordFromBuyer);
      const recordedCommFromBuyer = buyerCommissionRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const existingMemberComm = Number(existingMember?.commission) || 0;
      const alreadyCredited = Math.max(existingMemberComm, recordedCommFromBuyer);

      // CRITICAL: If ANY commission was already credited or recorded for this buyer,
      // distributeProductPurchaseCommissions is authoritative and already credited it in real-time.
      // NEVER credit duplicate commissions via reconcileUserTeamAndCommissions!
      if (alreadyCredited === 0 && buyerCommissionRecords.length === 0 && actualInvested > 0) {
        const syncRecId = `comm_sync_l${level}_${mDigits}`;
        if (!existingRecords.some((r) => r.id === syncRecId)) {
          additionalCommissionToCredit += expectedCommission;
          newCommissionRecords.push({
            id: syncRecId,
            type: 'commission',
            title: level === 1 ? 'Level 1 Referral Commission' : `Level ${level} Team Commission`,
            amount: expectedCommission,
            status: 'success',
            timestamp: Date.now(),
            details: `${pct}% affiliate commission from ${memberUser.phone}'s fleet investment (₦${actualInvested.toLocaleString()})`,
          });
        }
      }

      discoveredMembers.push({
        id: existingMember?.id || `tm_l${level}_${mDigits}`,
        phone: memberUser.phone,
        inviteCode: memberUser.inviteCode,
        level,
        joinDate: existingMember?.joinDate || today,
        invested: actualInvested,
        commission: Math.max(alreadyCredited, expectedCommission),
        status: 'active',
      });
    }
  };

  processTierUsers(l1Users, 1, l1Pct);
  processTierUsers(l2Users, 2, l2Pct);
  processTierUsers(l3Users, 3, l3Pct);

  const mergedTeam = mergeTeamMembers(user.teamMembers, discoveredMembers);

  const teamChanged =
    mergedTeam.length !== (user.teamMembers?.length || 0) ||
    JSON.stringify(mergedTeam) !== JSON.stringify(user.teamMembers || []);

  if (!teamChanged && additionalCommissionToCredit <= 0) {
    return { updatedUser: user, changed: false, newlyCreditedCommission: 0 };
  }

  const updatedUser: UserState = {
    ...user,
    balance: (user.balance || 0) + additionalCommissionToCredit,
    cumulativeIncome: (user.cumulativeIncome || 0) + additionalCommissionToCredit,
    teamMembers: mergedTeam,
    records: mergeTransactionRecords(newCommissionRecords, existingRecords),
  };

  await persistUserUpdates(user.phone, () => updatedUser);

  return {
    updatedUser,
    changed: true,
    newlyCreditedCommission: additionalCommissionToCredit,
  };
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

  if (cleanNigerianPhoneDigits(targetUpline.userState.phone) === cleanNigerianPhoneDigits(userPhone)) {
    return { success: false, message: 'A user cannot be their own inviter.' };
  }

  // Update target user's invitedBy
  const updatedTarget = await persistUserUpdates(userPhone, (prev) => ({
    ...prev,
    invitedBy: cleanNewCode,
  }));

  await recordNewReferralRegistration(
    userPhone,
    updatedTarget?.inviteCode || cleanNewCode,
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
  const downlineDigits = cleanNigerianPhoneDigits(downlinePhone);
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
    const idx = members.findIndex(
      (m) => cleanNigerianPhoneDigits(m.phone) === downlineDigits || m.phone === downlinePhone
    );
    if (idx >= 0) {
      members[idx] = {
        ...members[idx],
        commission: (members[idx].commission || 0) + amount,
      };
    } else if (downlinePhone) {
      members.unshift({
        id: `tm_l${tierLevel}_${downlineDigits || now}`,
        phone: downlinePhone,
        level: tierLevel,
        joinDate: new Date().toISOString().split('T')[0],
        invested: 0,
        commission: amount,
        status: 'active',
      });
    }

    return {
      ...prev,
      balance: (prev.balance || 0) + amount,
      cumulativeIncome: (prev.cumulativeIncome || 0) + amount,
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
 * ADMIN: Inspect complete downline tree for any user (Level 1, 2, 3) across both Local & Cloud
 */
export async function fetchUserDownlineTree(phone: string): Promise<{
  inviterCode: string | null;
  inviterPhone: string | null;
  level1: TeamMember[];
  level2: TeamMember[];
  level3: TeamMember[];
  totalCommission: number;
}> {
  const rawDigits = cleanNigerianPhoneDigits(phone);
  const allUsers = await collectAllKnownUsers();
  const userState = allUsers.get(rawDigits);

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

  // Reconcile downline members dynamically so the admin always sees real-time downlines
  const reconciled = await reconcileUserTeamAndCommissions(userState);
  const team = reconciled.updatedUser.teamMembers || [];
  const level1 = team.filter((m) => m.level === 1);
  const level2 = team.filter((m) => m.level === 2);
  const level3 = team.filter((m) => m.level === 3);
  const totalCommission = team.reduce((acc, m) => acc + (m.commission || 0), 0);

  let inviterPhone: string | null = null;
  if (userState.invitedBy) {
    const cleanInv = userState.invitedBy.trim().toUpperCase();
    for (const u of allUsers.values()) {
      const aliases = getUserInviteCodeAliases(u);
      if (aliases.has(cleanInv)) {
        inviterPhone = u.phone;
        break;
      }
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
