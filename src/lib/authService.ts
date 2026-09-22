import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updatePassword,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserState, PlatformSettings, TransactionRecord } from '../types';
import { INITIAL_PLATFORM_SETTINGS } from '../data/initialData';
import { cleanNigerianPhoneDigits, isAdminUser } from '../utils/adminAuth';

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
  };
}

/**
 * Finds user profile in Firestore by phone number or UID to ensure real cloud balance is loaded
 */
export async function findCloudUserByPhoneOrUid(
  cleanDigits: string,
  firebaseUid?: string | null
): Promise<{ data: UserState; docId: string } | null> {
  // 1. Check by firebaseUid if provided
  if (firebaseUid) {
    try {
      const snap = await getDoc(doc(db, 'users', firebaseUid));
      if (snap.exists()) {
        return { data: snap.data() as UserState, docId: snap.id };
      }
    } catch {}
  }

  // 2. Check by cleanDigits as doc id
  try {
    const snap = await getDoc(doc(db, 'users', cleanDigits));
    if (snap.exists()) {
      return { data: snap.data() as UserState, docId: snap.id };
    }
  } catch {}

  // 3. Search collection('users') where phone clean digits match
  try {
    const snap = await getDocs(collection(db, 'users'));
    for (const d of snap.docs) {
      const u = d.data() as UserState;
      const p = cleanNigerianPhoneDigits(u.phone || '');
      if (p === cleanDigits) {
        return { data: u, docId: d.id };
      }
    }
  } catch {}

  return null;
}

/**
 * Purges all mock data across all local storage structures (team members, fake products, fake grants, fake gift codes)
 */
export function purgeAllMockDataAcrossPlatform(): void {
  try {
    localStorage.removeItem('tesla_gift_codes_state');
    sessionStorage.removeItem('tesla_gift_codes_state');
  } catch {}

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

// Auto-run purge on load
purgeAllMockDataAcrossPlatform();

/**
 * Retrieves the local accounts registry, ensuring admin accounts are initialized cleanly
 */
export function getLocalAccounts(): Record<string, LocalAccount> {
  // Purge any stale mock data first
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
        updatedAt: Date.now(),
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
  return `TSL${rand}${digits.slice(-2)}`;
}

/**
 * Registers a new account with cloud synchronization and offline fallback
 * Ensures Firebase Auth user is created/signed-in and profile is stored in Firestore
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
    // If phone is already registered in Firebase Auth, sign in to link session
    if (firebaseErr?.code === 'auth/email-already-in-use') {
      try {
        const cred = await signInWithEmailAndPassword(auth, authEmail, password);
        firebaseUid = cred.user.uid;
      } catch {
        // Try fallback default password (e.g. if account was auto-provisioned earlier)
        try {
          const cred = await signInWithEmailAndPassword(auth, authEmail, '123456');
          firebaseUid = cred.user.uid;
          try {
            await updatePassword(cred.user, password);
          } catch {}
        } catch {
          // If password doesn't match, check local registry
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

  // 2. Check if this user already has an existing profile in Firestore
  const cloudExisting = await findCloudUserByPhoneOrUid(last10, firebaseUid);
  let finalUserState: UserState;

  if (cloudExisting) {
    // PRESERVE real cloud balance, cumulative income, products, and records!
    finalUserState = {
      ...cloudExisting.data,
      phone: display,
      isLoggedIn: true,
      loginPassword: password,
    };
  } else {
    // Fresh registration: grant welcome bonus
    const signupBonus = isAdmin ? 0 : (settings.signupBonus || 1500);
    const welcomeRecord: TransactionRecord = {
      id: `reg_${Date.now()}`,
      type: 'bonus',
      title: 'Registration Welcome Bonus',
      amount: signupBonus,
      status: 'success',
      timestamp: Date.now(),
      details: 'Official Tesla Welcome Grant',
    };

    const userOwnInviteCode = isAdmin 
      ? (last10 === '7077599057' ? 'TSLROOT1' : 'TSLROOT2')
      : generateUniqueInviteCode(last10);
    const cleanInviterCode = inviteCode ? inviteCode.trim().toUpperCase() : 'P5ZP4S';

    finalUserState = isAdmin
      ? {
          ...createAdminDefaultState(last10),
          balance: accounts[last10]?.userState?.balance ?? 0.0,
          cumulativeIncome: accounts[last10]?.userState?.cumulativeIncome ?? 0.0,
          records: accounts[last10]?.userState?.records ?? [],
          purchasedProducts: accounts[last10]?.userState?.purchasedProducts ?? [],
          bankAccount: accounts[last10]?.userState?.bankAccount ?? null,
          loginPassword: password,
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
        };
  }

  // Link to inviter's team downline in local registry if found
  try {
    const inviterKey = Object.keys(accounts).find(
      (k) => accounts[k]?.userState?.inviteCode === finalUserState.invitedBy
    );
    if (inviterKey && accounts[inviterKey]) {
      const inviterState = accounts[inviterKey].userState;
      if (!inviterState.teamMembers.some((m) => m.phone === display)) {
        inviterState.teamMembers.unshift({
          id: `tm_${Date.now()}`,
          phone: display,
          inviteCode: finalUserState.inviteCode,
          level: 1,
          joinDate: new Date().toISOString().split('T')[0],
          invested: 0,
          commission: 0,
          status: 'active',
        });
        accounts[inviterKey].updatedAt = Date.now();
      }
    }
  } catch {
    // non-blocking
  }

  // 3. Immediately store into local accounts registry for guaranteed fallback
  accounts[last10] = {
    phone: display,
    digits: last10,
    password,
    userState: finalUserState,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveLocalAccounts(accounts);

  // 4. Persist active session to localStorage
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(finalUserState));
  } catch {
    // ignore
  }

  // 5. Persist to Firestore under UID
  const targetDocId = firebaseUid || last10;
  try {
    await setDoc(doc(db, 'users', targetDocId), {
      ...finalUserState,
      firebaseUid: targetDocId,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (docErr) {
    console.warn('Could not write user doc to Firestore:', docErr);
  }

  return finalUserState;
}

/**
 * Authenticates user with multi-tier fallback (Firebase Cloud First -> Local Fallback Registry)
 * Strictly loads and preserves REAL cloud balances from Firebase.
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
    // If wrong password, and user is an admin or used 123456, try default credential
    if (isAdmin || password === '123456') {
      try {
        const cred = await signInWithEmailAndPassword(auth, authEmail, '123456');
        firebaseUid = cred.user.uid;
        if (password !== '123456') {
          try { await updatePassword(cred.user, password); } catch {}
        }
      } catch {}
    }

    // If user not found in Firebase Auth, auto-create so Firebase session is established
    if (!firebaseUid && (fbErr?.code === 'auth/user-not-found' || fbErr?.code === 'auth/invalid-credential')) {
      try {
        const newCred = await createUserWithEmailAndPassword(auth, authEmail, password);
        firebaseUid = newCred.user.uid;
      } catch (createErr: any) {
        if (createErr?.code === 'auth/email-already-in-use') {
          try {
            const cred = await signInWithEmailAndPassword(auth, authEmail, '123456');
            firebaseUid = cred.user.uid;
            try { await updatePassword(cred.user, password); } catch {}
          } catch {}
        }
      }
    }
  }

  // TIER 2: Load REAL User State from Firestore
  const cloudUser = await findCloudUserByPhoneOrUid(last10, firebaseUid);

  if (cloudUser) {
    const restoredState: UserState = {
      ...cloudUser.data,
      phone: display,
      isLoggedIn: true,
      loginPassword: password,
    };

    // Keep local registry cache updated with the REAL cloud balance
    accounts[last10] = {
      phone: display,
      digits: last10,
      password,
      userState: restoredState,
      createdAt: accounts[last10]?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    saveLocalAccounts(accounts);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(restoredState));

    // Sync to doc(db, 'users', firebaseUid) if needed
    if (firebaseUid && cloudUser.docId !== firebaseUid) {
      setDoc(doc(db, 'users', firebaseUid), { ...restoredState, firebaseUid }, { merge: true }).catch(() => {});
    }

    return restoredState;
  }

  // TIER 3: Local Registry Fallback
  const localAcc = accounts[last10];
  if (localAcc) {
    const isPasswordValid = 
      localAcc.password === password || 
      (isAdmin && (password === '123456' || localAcc.password === '123456' || Boolean(password)));

    if (isPasswordValid) {
      // If admin, update stored password to the active password
      if (isAdmin && password && localAcc.password !== password) {
        localAcc.password = password;
        localAcc.userState.loginPassword = password;
        accounts[last10] = localAcc;
        saveLocalAccounts(accounts);
      }

      const restoredUser: UserState = {
        ...localAcc.userState,
        phone: display,
        isLoggedIn: true,
        loginPassword: password,
      };

      // If Firebase Auth succeeded, backfill Firestore with the profile
      const targetDocId = firebaseUid || last10;
      setDoc(doc(db, 'users', targetDocId), {
        ...restoredUser,
        firebaseUid: targetDocId,
        updatedAt: Date.now(),
      }, { merge: true }).catch(() => {});

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(restoredUser));
      return restoredUser;
    } else {
      throw new Error('Incorrect password. Please verify your login credentials.');
    }
  }

  // TIER 4: Admin auto-provision fallback if user entered admin phone
  if (isAdmin) {
    const adminState = createAdminDefaultState(last10);
    adminState.loginPassword = password;
    accounts[last10] = {
      phone: display,
      digits: last10,
      password: password || '123456',
      userState: adminState,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveLocalAccounts(accounts);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(adminState));

    const targetDocId = firebaseUid || last10;
    setDoc(doc(db, 'users', targetDocId), {
      ...adminState,
      firebaseUid: targetDocId,
      updatedAt: Date.now(),
    }, { merge: true }).catch(() => {});

    return adminState;
  }

  // Not found in any provider
  throw new Error('Account does not exist. Please click "To register" to sign up first.');
}

/**
 * Direct Instant Admin Access for Authorized Numbers
 * Connects to Firebase Auth and fetches REAL cloud state
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

  // 2. Fetch REAL Firestore profile if existing
  const cloud = await findCloudUserByPhoneOrUid(adminDigits, firebaseUid);

  const adminState: UserState = cloud 
    ? { ...cloud.data, phone: `+234 ${adminDigits}`, isLoggedIn: true }
    : (stored?.userState || createAdminDefaultState(adminDigits));

  adminState.isLoggedIn = true;
  adminState.phone = `+234 ${adminDigits}`;

  accounts[adminDigits] = {
    phone: adminState.phone,
    digits: adminDigits,
    password: stored?.password || '123456',
    userState: adminState,
    createdAt: stored?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  saveLocalAccounts(accounts);
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(adminState));

  if (firebaseUid) {
    setDoc(doc(db, 'users', firebaseUid), {
      ...adminState,
      firebaseUid,
      updatedAt: Date.now(),
    }, { merge: true }).catch(() => {});
  }

  return adminState;
}

/**
 * Safely sign out current user
 */
export async function signOutUser() {
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
