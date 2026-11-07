import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updatePassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db, withFirestoreTimeout } from './firebase';
import { UserState, PlatformSettings, TransactionRecord, TeamMember } from '../types';
import { INITIAL_PLATFORM_SETTINGS } from '../data/initialData';
import { cleanNigerianPhoneDigits, isAdminUser } from '../utils/adminAuth';
import { sanitizeForFirestore } from '../utils/firestoreSanitizer';
import { mergePurchasedProducts, mergeTransactionRecords } from '../utils/productUtils';

export const ACCOUNTS_REGISTRY_KEY = 'tesla_accounts_registry_v2';
export const SESSION_STORAGE_KEY = 'tesla_app_state_v2';

export interface LocalAccount {
  phone: string; // "+234 7077599057"
  digits: string; // "7077599057"
  password: string;
  userState: UserState;
  createdAt: number;
  updatedAt: number;
}

/**
 * Normalizes any format into a consistent Nigerian phone number.
 * Correctly accommodates leading zero, +234, and accidental 3-sevens typos.
 */
export function normalizePhone(rawPhone: string) {
  const digits = cleanNigerianPhoneDigits(rawPhone);
  const display = `+234 ${digits}`;
  const authEmail = `user_${digits}@tesla-90.firebaseapp.com`;
  const isAdmin = isAdminUser(digits);
  return { display, last10: digits, authEmail, isAdmin };
}

/**
 * Creates the default initial state for Master Admin accounts with ZERO mock data
 */
export function createAdminDefaultState(last10: string): UserState {
  const phone = `+234 ${last10}`;
  return {
    isLoggedIn: true,
    phone,
    balance: 0.0,
    cumulativeIncome: 0.0,
    inviteCode: last10 === '7077599057' ? 'TSLROOT1' : 'TSLROOT2',
    bankAccount: null,
    fundPin: '123456',
    loginPassword: '123456',
    lastCheckInDate: null,
    purchasedProducts: [],
    teamMembers: [],
    records: [],
    updatedAt: 0,
  };
}

/**
 * Deduplicates and merges two arrays of TeamMember objects by (level, cleanPhoneDigits),
 * preserving the highest invested and commission figures.
 */
export function mergeTeamMembersList(
  primary?: TeamMember[] | null,
  secondary?: TeamMember[] | null
): TeamMember[] {
  const map = new Map<string, TeamMember>();

  const processList = (list?: TeamMember[] | null) => {
    if (!list || !Array.isArray(list)) return;
    for (const tm of list) {
      if (!tm || !tm.phone) continue;
      if (
        tm.id?.startsWith('tm_adm_') ||
        tm.id?.startsWith('sim_') ||
        tm.phone === '+234 8031122334' ||
        tm.phone === '+234 8149988776'
      ) {
        continue;
      }
      const digits = cleanNigerianPhoneDigits(tm.phone);
      const level = tm.level || 1;
      const key = `${level}_${digits}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          ...tm,
          phone: `+234 ${digits}`,
          level,
          invested: Number(tm.invested) || 0,
          commission: Number(tm.commission) || 0,
        });
      } else {
        map.set(key, {
          ...existing,
          ...tm,
          phone: `+234 ${digits}`,
          level,
          invested: Math.max(Number(existing.invested) || 0, Number(tm.invested) || 0),
          commission: Math.max(Number(existing.commission) || 0, Number(tm.commission) || 0),
          joinDate: existing.joinDate || tm.joinDate || (existing as any).joinedDate || (tm as any).joinedDate || new Date().toISOString().split('T')[0],
        });
      }
    }
  };

  processList(primary);
  processList(secondary);

  return Array.from(map.values());
}

/**
 * Computes the effective last-mutation timestamp for a UserState snapshot by inspecting
 * `updatedAt`, transaction record timestamps, and purchased product claim/purchase timestamps.
 */
export function getEffectiveStateTimestamp(s?: Partial<UserState> | null): number {
  if (!s) return 0;
  let maxTs = Number(s.updatedAt) || 0;

  if (Array.isArray(s.records)) {
    for (const r of s.records) {
      if (!r) continue;
      const isWelcome =
        r.title === 'Registration Welcome Bonus' ||
        r.id?.startsWith('reg_') ||
        (r.type === 'bonus' && r.details?.includes('Welcome Grant'));
      // Welcome bonus exists on initial registration; still consider it if maxTs is 0,
      // but non-welcome records reflect subsequent user activity
      const rTs = Math.max(Number(r.timestamp) || 0, Number(r.processedAt) || 0);
      if (!isWelcome && rTs > maxTs) {
        maxTs = rTs;
      } else if (isWelcome && maxTs === 0 && rTs > 0) {
        maxTs = 1; // baseline for newly registered state with only welcome bonus
      }
    }
  }

  if (Array.isArray(s.purchasedProducts)) {
    for (const p of s.purchasedProducts) {
      if (!p) continue;
      const pTs = Math.max(Number(p.purchaseDate) || 0, Number(p.lastClaimDate) || 0);
      if (pTs > maxTs) maxTs = pTs;
    }
  }

  return maxTs;
}

/**
 * Deterministically merges two UserState snapshots (e.g., local state and cloud state)
 * so that stale cloud snapshots NEVER overwrite newer local purchases, balance changes,
 * bank details, fund PINs, team members, or transaction records, and vice versa.
 */
export function mergeUserStates(
  stateA?: Partial<UserState> | null,
  stateB?: Partial<UserState> | null
): UserState {
  if (!stateA && !stateB) {
    return createAdminDefaultState('0000000000');
  }
  if (!stateA) return stateB as UserState;
  if (!stateB) return stateA as UserState;

  const tsA = getEffectiveStateTimestamp(stateA);
  const tsB = getEffectiveStateTimestamp(stateB);

  // Determine which state has more real activity if timestamps are tied or missing
  const richnessA =
    (stateA.purchasedProducts?.length || 0) * 100 +
    (stateA.records?.length || 0) * 10 +
    (stateA.teamMembers?.length || 0) * 5 +
    (stateA.bankAccount ? 20 : 0) +
    (stateA.fundPin && stateA.fundPin !== '123456' ? 10 : 0);

  const richnessB =
    (stateB.purchasedProducts?.length || 0) * 100 +
    (stateB.records?.length || 0) * 10 +
    (stateB.teamMembers?.length || 0) * 5 +
    (stateB.bankAccount ? 20 : 0) +
    (stateB.fundPin && stateB.fundPin !== '123456' ? 10 : 0);

  const timeA = Math.max(Number(stateA.updatedAt) || 0, getEffectiveStateTimestamp(stateA));
  const timeB = Math.max(Number(stateB.updatedAt) || 0, getEffectiveStateTimestamp(stateB));

  let older: Partial<UserState>;
  let newer: Partial<UserState>;

  if (timeA !== timeB) {
    older = timeA < timeB ? stateA : stateB;
    newer = timeA < timeB ? stateB : stateA;
  } else {
    const recTsA = Math.max(0, ...(stateA.records || []).map((r) => Number(r.timestamp) || 0));
    const recTsB = Math.max(0, ...(stateB.records || []).map((r) => Number(r.timestamp) || 0));
    if (recTsA !== recTsB) {
      older = recTsA < recTsB ? stateA : stateB;
      newer = recTsA < recTsB ? stateB : stateA;
    } else {
      older = richnessA <= richnessB ? stateA : stateB;
      newer = richnessA <= richnessB ? stateB : stateA;
    }
  }

  const mergedProducts = mergePurchasedProducts(newer.purchasedProducts, older.purchasedProducts);
  const mergedTeam = mergeTeamMembersList(newer.teamMembers, older.teamMembers);
  const mergedRecords = mergeTransactionRecords(newer.records, older.records);

  const mergedMilestones = Array.from(
    new Set([
      ...(newer.claimedPromoterMilestones || []),
      ...(older.claimedPromoterMilestones || []),
    ])
  );

  // Authoritative balance:
  // newer.balance reflects the latest confirmed user state (e.g. recent purchase deduction, withdrawal, or admin adjustment).
  const reconciledBalance =
    newer.balance !== undefined && newer.balance !== null
      ? Number(newer.balance)
      : Number(older.balance) || 0;

  // Reconcile cumulative income: never decrease, and ensure it is at least the sum of income + commission records
  const earnedFromRecords = mergedRecords
    .filter((r) => (r.type === 'income' || r.type === 'commission') && r.status === 'success')
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const reconciledCumulativeIncome = Math.max(
    Number(older.cumulativeIncome) || 0,
    Number(newer.cumulativeIncome) || 0,
    earnedFromRecords
  );

  // Preserve custom fundPin over default '123456'
  const resolvedFundPin =
    newer.fundPin && newer.fundPin !== '123456'
      ? newer.fundPin
      : older.fundPin && older.fundPin !== '123456'
      ? older.fundPin
      : newer.fundPin || older.fundPin || '123456';

  // Preserve latest lastCheckInDate
  const resolvedCheckIn =
    newer.lastCheckInDate && older.lastCheckInDate
      ? newer.lastCheckInDate >= older.lastCheckInDate
        ? newer.lastCheckInDate
        : older.lastCheckInDate
      : newer.lastCheckInDate || older.lastCheckInDate || null;

  // Preserve non-default inviteCode
  const resolvedInviteCode =
    newer.inviteCode && newer.inviteCode !== 'P5ZP4S'
      ? newer.inviteCode
      : older.inviteCode && older.inviteCode !== 'P5ZP4S'
      ? older.inviteCode
      : newer.inviteCode || older.inviteCode || 'P5ZP4S';

  const resolvedInvitedBy = newer.invitedBy || older.invitedBy;

  const merged: UserState = {
    ...older,
    ...newer,
    isLoggedIn: Boolean(newer.isLoggedIn ?? older.isLoggedIn ?? true),
    phone: newer.phone || older.phone || '',
    balance: Math.max(0, Number(reconciledBalance.toFixed(2))),
    cumulativeIncome: Math.max(0, Number(reconciledCumulativeIncome.toFixed(2))),
    inviteCode: resolvedInviteCode,
    ...(resolvedInvitedBy ? { invitedBy: resolvedInvitedBy } : {}),
    bankAccount: newer.bankAccount || older.bankAccount || null,
    fundPin: resolvedFundPin,
    loginPassword: newer.loginPassword || older.loginPassword || '123456',
    lastCheckInDate: resolvedCheckIn,
    purchasedProducts: mergedProducts,
    teamMembers: mergedTeam,
    records: mergedRecords,
    claimedPromoterMilestones: mergedMilestones,
    creditedByAdmin: Boolean(newer.creditedByAdmin || older.creditedByAdmin),
    updatedAt: Math.max(tsA, tsB, Number(newer.updatedAt) || 0, Number(older.updatedAt) || 0),
  };

  return merged;
}

/**
 * Synchronously saves a UserState into both localStorage keys (`SESSION_STORAGE_KEY` and `ACCOUNTS_REGISTRY_KEY`)
 * and asynchronously writes sanitized payloads to Firestore under both `users/{cleanDigits}` and `users/{firebaseUid}`.
 */
export async function persistUserStateEverywhere(
  userState: UserState,
  passwordOverride?: string
): Promise<UserState> {
  if (!userState || !userState.phone) return userState;

  const { display, last10 } = normalizePhone(userState.phone);
  const now = Date.now();

  let accounts: Record<string, LocalAccount> = {};
  try {
    const raw = localStorage.getItem(ACCOUNTS_REGISTRY_KEY);
    if (raw) accounts = JSON.parse(raw);
  } catch {}

  const existingLocal = accounts[last10]?.userState;
  const stampedInput: UserState = {
    ...userState,
    phone: display,
    updatedAt: Math.max(now, Number(userState.updatedAt) || 0),
  };

  // Merge with existing local registry entry so we never accidentally drop fields
  const finalState: UserState = existingLocal
    ? {
        ...mergeUserStates(existingLocal, stampedInput),
        // Because `stampedInput` is an explicit mutation from the caller, its balance and updatedAt are authoritative
        balance: stampedInput.balance,
        cumulativeIncome: Math.max(
          Number(stampedInput.cumulativeIncome) || 0,
          Number(existingLocal.cumulativeIncome) || 0
        ),
        bankAccount: stampedInput.bankAccount ?? existingLocal.bankAccount ?? null,
        fundPin: stampedInput.fundPin || existingLocal.fundPin || '123456',
        loginPassword:
          passwordOverride ||
          stampedInput.loginPassword ||
          existingLocal.loginPassword ||
          accounts[last10]?.password ||
          '123456',
        isLoggedIn: stampedInput.isLoggedIn,
        updatedAt: stampedInput.updatedAt,
      }
    : stampedInput;

  const resolvedPassword =
    passwordOverride ||
    finalState.loginPassword ||
    accounts[last10]?.password ||
    '123456';

  // 1. Update local accounts registry synchronously
  if (last10 && last10.length >= 7) {
    accounts[last10] = {
      phone: display,
      digits: last10,
      password: resolvedPassword,
      userState: finalState,
      createdAt: accounts[last10]?.createdAt || now,
      updatedAt: now,
    };
    saveLocalAccounts(accounts);
  }

  // 2. Update active session storage synchronously if logged in
  if (finalState.isLoggedIn) {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(finalState));
    } catch {}
  }

  // 3. Persist sanitized payload to Firestore under both `users/{last10}` and `users/{uid}`
  const uid = auth.currentUser?.uid;
  const sanitizedPayload = sanitizeForFirestore({
    ...finalState,
    ...(uid ? { firebaseUid: uid } : {}),
    updatedAt: finalState.updatedAt || now,
  });

  const writes: Promise<any>[] = [];
  if (last10 && last10.length >= 7) {
    writes.push(
      withFirestoreTimeout(
        setDoc(doc(db, 'users', last10), sanitizedPayload, { merge: true }),
        3500
      ).catch(() => {})
    );
  }
  if (uid && uid !== last10) {
    writes.push(
      withFirestoreTimeout(
        setDoc(doc(db, 'users', uid), sanitizedPayload, { merge: true }),
        3500
      ).catch(() => {})
    );
  }

  if (writes.length > 0) {
    await Promise.all(writes);
  }

  return finalState;
}

/**
 * Finds user profile in Firestore by phone number AND UID, merging both documents
 * if both exist so updates written to either document ID are always preserved.
 */
export async function findCloudUserByPhoneOrUid(
  cleanDigits: string,
  firebaseUid?: string | null
): Promise<{ data: UserState; docId: string } | null> {
  let uidDoc: { data: UserState; docId: string } | null = null;
  let phoneDoc: { data: UserState; docId: string } | null = null;

  // 1. Check by firebaseUid if provided
  if (firebaseUid) {
    try {
      const snap = await withFirestoreTimeout(getDoc(doc(db, 'users', firebaseUid)), 2500);
      if (snap.exists()) {
        uidDoc = { data: snap.data() as UserState, docId: snap.id };
      }
    } catch {}
  }

  // 2. Check by cleanDigits as doc id
  if (cleanDigits) {
    try {
      const snap = await withFirestoreTimeout(getDoc(doc(db, 'users', cleanDigits)), 2500);
      if (snap.exists()) {
        phoneDoc = { data: snap.data() as UserState, docId: snap.id };
      }
    } catch {}
  }

  if (uidDoc && phoneDoc) {
    return {
      data: mergeUserStates(uidDoc.data, phoneDoc.data),
      docId: phoneDoc.docId,
    };
  }
  if (phoneDoc) return phoneDoc;
  if (uidDoc) return uidDoc;

  // 3. Search collection('users') where phone clean digits match
  try {
    const snap = await withFirestoreTimeout(getDocs(collection(db, 'users')), 3000);
    let matched: { data: UserState; docId: string } | null = null;
    for (const d of snap.docs) {
      const u = d.data() as UserState;
      const p = cleanNigerianPhoneDigits(u.phone || '');
      if (p === cleanDigits) {
        if (!matched) {
          matched = { data: u, docId: d.id };
        } else {
          matched = { data: mergeUserStates(matched.data, u), docId: matched.docId };
        }
      }
    }
    if (matched) return matched;
  } catch {}

  return null;
}

let mockDataPurgedOnce = false;

/**
 * Purges legacy mock data across local storage structures once on startup
 * without wiping real user gift codes or user records.
 */
export function purgeAllMockDataAcrossPlatform(): void {
  if (mockDataPurgedOnce) return;
  mockDataPurgedOnce = true;

  try {
    const raw = localStorage.getItem(ACCOUNTS_REGISTRY_KEY);
    if (raw) {
      const accounts: Record<string, LocalAccount> = JSON.parse(raw);
      let changed = false;
      for (const [, acc] of Object.entries(accounts)) {
        if (acc?.userState) {
          const beforeTM = acc.userState.teamMembers?.length || 0;
          acc.userState.teamMembers = (acc.userState.teamMembers || []).filter(
            (tm) =>
              !tm.id?.startsWith('tm_adm_') &&
              !tm.id?.startsWith('sim_') &&
              tm.phone !== '+234 8031122334' &&
              tm.phone !== '+234 8149988776'
          );
          if ((acc.userState.teamMembers?.length || 0) !== beforeTM) changed = true;

          const beforeProd = acc.userState.purchasedProducts?.length || 0;
          acc.userState.purchasedProducts = (acc.userState.purchasedProducts || []).filter(
            (p) => !p.instanceId?.startsWith('prod_adm_')
          );
          if ((acc.userState.purchasedProducts?.length || 0) !== beforeProd) changed = true;

          const beforeRec = acc.userState.records?.length || 0;
          acc.userState.records = (acc.userState.records || []).filter(
            (r) =>
              !r.id?.startsWith('rec_adm_grant_') &&
              !r.details?.includes('Pre-seeded') &&
              r.title !== 'Master Admin System Grant'
          );
          if ((acc.userState.records?.length || 0) !== beforeRec) changed = true;

          if (acc.userState.bankAccount?.accountName === 'Tesla Energy Master Treasury') {
            acc.userState.bankAccount = null;
            changed = true;
          }
        }
      }
      if (changed) {
        localStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(accounts));
      }
    }
  } catch (err) {
    console.warn('Mock purge error:', err);
  }

  try {
    const sessionRaw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionRaw) {
      const u: UserState = JSON.parse(sessionRaw);
      if (u) {
        let changed = false;
        const beforeTM = u.teamMembers?.length || 0;
        u.teamMembers = (u.teamMembers || []).filter(
          (tm) =>
            !tm.id?.startsWith('tm_adm_') &&
            !tm.id?.startsWith('sim_') &&
            tm.phone !== '+234 8031122334' &&
            tm.phone !== '+234 8149988776'
        );
        if ((u.teamMembers?.length || 0) !== beforeTM) changed = true;

        const beforeProd = u.purchasedProducts?.length || 0;
        u.purchasedProducts = (u.purchasedProducts || []).filter(
          (p) => !p.instanceId?.startsWith('prod_adm_')
        );
        if ((u.purchasedProducts?.length || 0) !== beforeProd) changed = true;

        const beforeRec = u.records?.length || 0;
        u.records = (u.records || []).filter(
          (r) =>
            !r.id?.startsWith('rec_adm_grant_') &&
            !r.details?.includes('Pre-seeded') &&
            r.title !== 'Master Admin System Grant'
        );
        if ((u.records?.length || 0) !== beforeRec) changed = true;

        if (u.bankAccount?.accountName === 'Tesla Energy Master Treasury') {
          u.bankAccount = null;
          changed = true;
        }
        if (changed) {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(u));
        }
      }
    }
  } catch (err) {
    console.warn('Session mock purge error:', err);
  }
}

// Auto-run purge once on load
purgeAllMockDataAcrossPlatform();

/**
 * Retrieves the local accounts registry, ensuring admin accounts are initialized cleanly
 */
export function getLocalAccounts(): Record<string, LocalAccount> {
  purgeAllMockDataAcrossPlatform();

  let accounts: Record<string, LocalAccount> = {};
  try {
    const raw = localStorage.getItem(ACCOUNTS_REGISTRY_KEY);
    if (raw) {
      accounts = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read local accounts registry:', err);
  }

  // Pre-seed Master Admin accounts if missing (clean state, zero mock referrals)
  const adminNumbers = ['7077599057', '9011711470'];
  let modified = false;

  adminNumbers.forEach((admDigits) => {
    if (!accounts[admDigits]) {
      const adminState = createAdminDefaultState(admDigits);
      accounts[admDigits] = {
        phone: adminState.phone,
        digits: admDigits,
        password: '123456',
        userState: adminState,
        createdAt: Date.now() - 86400000 * 30,
        updatedAt: 0,
      };
      modified = true;
    }
  });

  if (modified) {
    saveLocalAccounts(accounts);
  }

  return accounts;
}

/**
 * Saves all accounts into localStorage registry
 */
export function saveLocalAccounts(accounts: Record<string, LocalAccount>) {
  try {
    localStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.warn('Could not persist accounts registry:', err);
  }
}

export function generateUniqueInviteCode(digits: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `OLA${rand}${digits.slice(-2)}`;
}

/**
 * Registers a new account with cloud synchronization and offline fallback.
 * If the account already exists in Firestore or local registry, safely merges and preserves all data.
 */
export async function registerAccount(
  rawPhone: string,
  password: string,
  inviteCode: string = 'P5ZP4S',
  settings: PlatformSettings = INITIAL_PLATFORM_SETTINGS
): Promise<UserState> {
  const { display, last10, authEmail, isAdmin } = normalizePhone(rawPhone);
  const accounts = getLocalAccounts();

  // 1. Authenticate or create user in Firebase Auth
  let firebaseUid: string | null = null;
  try {
    const cred = await createUserWithEmailAndPassword(auth, authEmail, password);
    firebaseUid = cred.user.uid;
  } catch (firebaseErr: any) {
    if (firebaseErr?.code === 'auth/email-already-in-use') {
      try {
        const cred = await signInWithEmailAndPassword(auth, authEmail, password);
        firebaseUid = cred.user.uid;
      } catch {
        try {
          const cred = await signInWithEmailAndPassword(auth, authEmail, '123456');
          firebaseUid = cred.user.uid;
          try {
            await updatePassword(cred.user, password);
          } catch {}
        } catch {
          if (accounts[last10]?.password) {
            try {
              const cred = await signInWithEmailAndPassword(auth, authEmail, accounts[last10].password);
              firebaseUid = cred.user.uid;
              try {
                await updatePassword(cred.user, password);
              } catch {}
            } catch {}
          }
        }
      }
    }
  }

  // 2. Check if this user already has an existing profile in Firestore or local registry
  const cloudExisting = await findCloudUserByPhoneOrUid(last10, firebaseUid);
  const localPrev = accounts[last10]?.userState;
  const cleanInviterCode = inviteCode ? inviteCode.trim().toUpperCase() : 'P5ZP4S';
  let finalUserState: UserState;

  if (cloudExisting || (localPrev && !isAdmin)) {
    const merged = mergeUserStates(localPrev, cloudExisting?.data);
    finalUserState = {
      ...merged,
      phone: display,
      isLoggedIn: true,
      loginPassword: password,
      invitedBy: merged.invitedBy || cleanInviterCode,
      updatedAt: Date.now(),
    };
  } else {
    // Fresh registration: grant welcome bonus
    const signupBonus = isAdmin ? 0 : (settings.signupBonus || 1100);
    const now = Date.now();
    const welcomeRecord: TransactionRecord = {
      id: `reg_${now}`,
      type: 'bonus',
      title: 'Registration Welcome Bonus',
      amount: signupBonus,
      status: 'success',
      timestamp: now,
      details: 'Official Ola Cabs Welcome Grant',
    };

    const userOwnInviteCode = isAdmin
      ? last10 === '7077599057'
        ? 'TSLROOT1'
        : 'TSLROOT2'
      : generateUniqueInviteCode(last10);

    finalUserState = isAdmin
      ? {
          ...mergeUserStates(createAdminDefaultState(last10), localPrev),
          phone: display,
          isLoggedIn: true,
          loginPassword: password,
          updatedAt: now,
        }
      : {
          isLoggedIn: true,
          phone: display,
          balance: signupBonus,
          cumulativeIncome: 0.0,
          inviteCode: userOwnInviteCode,
          invitedBy: cleanInviterCode,
          bankAccount: null,
          fundPin: '123456',
          loginPassword: password,
          lastCheckInDate: null,
          purchasedProducts: [],
          teamMembers: [],
          records: signupBonus > 0 ? [welcomeRecord] : [],
          updatedAt: now,
        };
  }

  return await persistUserStateEverywhere(finalUserState, password);
}

/**
 * Authenticates user with multi-tier fallback (Firebase Cloud + Local Registry reconciliation)
 * Strictly preserves all balances, purchased products, bank accounts, fund PINs, team members, and records.
 */
export async function loginAccount(rawPhone: string, password: string): Promise<UserState> {
  const { display, last10, authEmail, isAdmin } = normalizePhone(rawPhone);
  const accounts = getLocalAccounts();

  // TIER 1: Firebase Auth Sign-In
  let firebaseUid: string | null = null;

  try {
    const cred = await signInWithEmailAndPassword(auth, authEmail, password);
    firebaseUid = cred.user.uid;
  } catch (fbErr: any) {
    if (isAdmin || password === '123456') {
      try {
        const cred = await signInWithEmailAndPassword(auth, authEmail, '123456');
        firebaseUid = cred.user.uid;
        if (password !== '123456') {
          try {
            await updatePassword(cred.user, password);
          } catch {}
        }
      } catch {}
    }

    if (!firebaseUid && (fbErr?.code === 'auth/user-not-found' || fbErr?.code === 'auth/invalid-credential')) {
      try {
        const newCred = await createUserWithEmailAndPassword(auth, authEmail, password);
        firebaseUid = newCred.user.uid;
      } catch (createErr: any) {
        if (createErr?.code === 'auth/email-already-in-use') {
          try {
            const cred = await signInWithEmailAndPassword(auth, authEmail, '123456');
            firebaseUid = cred.user.uid;
            try {
              await updatePassword(cred.user, password);
            } catch {}
          } catch {}
        }
      }
    }
  }

  // TIER 2: Load User State from Firestore AND Local Registry, and deterministically merge them
  const cloudUser = await findCloudUserByPhoneOrUid(last10, firebaseUid);
  const localAcc = accounts[last10];
  const localUser = localAcc?.userState;

  if (cloudUser || localUser) {
    // Verify password if user only exists locally and Firebase Auth didn't validate
    if (!cloudUser && localAcc) {
      const isPasswordValid =
        localAcc.password === password ||
        localUser?.loginPassword === password ||
        (isAdmin && (password === '123456' || localAcc.password === '123456' || Boolean(password)));

      if (!isPasswordValid) {
        throw new Error('Incorrect password. Please verify your login credentials.');
      }
    }

    const merged = mergeUserStates(localUser, cloudUser?.data);
    const restoredState: UserState = {
      ...merged,
      phone: display,
      isLoggedIn: true,
      loginPassword: password || merged.loginPassword || '123456',
      updatedAt: Math.max(Date.now(), Number(merged.updatedAt) || 0),
    };

    return await persistUserStateEverywhere(restoredState, password);
  }

  // TIER 3: Admin auto-provision fallback if user entered admin phone
  if (isAdmin) {
    const adminState: UserState = {
      ...createAdminDefaultState(last10),
      loginPassword: password || '123456',
      updatedAt: Date.now(),
    };
    return await persistUserStateEverywhere(adminState, password || '123456');
  }

  // Not found in any provider
  throw new Error('Account does not exist. Please click "To register" to sign up first.');
}

/**
 * Direct Instant Admin Access for Authorized Numbers
 * Connects to Firebase Auth and merges cloud + local admin state
 */
export async function directAdminLogin(adminDigits: '7077599057' | '9011711470'): Promise<UserState> {
  const accounts = getLocalAccounts();
  const stored = accounts[adminDigits];

  // 1. Sign in to Firebase Auth in foreground
  const authEmail = `user_${adminDigits}@tesla-90.firebaseapp.com`;
  let firebaseUid: string | null = null;
  try {
    const cred = await signInWithEmailAndPassword(auth, authEmail, stored?.password || '123456');
    firebaseUid = cred.user.uid;
  } catch {
    try {
      const cred = await createUserWithEmailAndPassword(auth, authEmail, '123456');
      firebaseUid = cred.user.uid;
    } catch {}
  }

  // 2. Fetch Firestore profile if existing and merge with local
  const cloud = await findCloudUserByPhoneOrUid(adminDigits, firebaseUid);
  const baseState = stored?.userState || createAdminDefaultState(adminDigits);
  const merged = mergeUserStates(baseState, cloud?.data);

  const adminState: UserState = {
    ...merged,
    isLoggedIn: true,
    phone: `+234 ${adminDigits}`,
    updatedAt: Math.max(Date.now(), Number(merged.updatedAt) || 0),
  };

  return await persistUserStateEverywhere(adminState, stored?.password || '123456');
}

/**
 * Safely sign out current user without deleting their persistent account in `ACCOUNTS_REGISTRY_KEY`
 */
export async function signOutUser() {
  try {
    // Ensure current session state is saved to the accounts registry before removing active session key
    const sessionRaw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionRaw) {
      const currentSession: UserState = JSON.parse(sessionRaw);
      if (currentSession?.phone) {
        await persistUserStateEverywhere({ ...currentSession, isLoggedIn: false });
      }
    }
  } catch {}

  try {
    await signOut(auth);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

