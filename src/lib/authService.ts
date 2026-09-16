import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserState, PlatformSettings, TransactionRecord } from '../types';
import { INITIAL_PLATFORM_SETTINGS } from '../data/initialData';

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
 * Normalizes any format into a consistent 10-digit Nigerian phone number.
 * E.g. '07077599057' -> '7077599057', '+234 7077599057' -> '7077599057'
 */
export function normalizePhone(rawPhone: string) {
  const digits = rawPhone.replace(/\D/g, '');
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  const display = `+234 ${last10}`;
  const authEmail = `user_${last10}@tesla-90.firebaseapp.com`;
  const isAdmin = last10 === '7077599057' || last10 === '9011711470';
  return { display, last10, authEmail, isAdmin };
}

/**
 * Creates the default initial state for Master Admin accounts
 */
export function createAdminDefaultState(last10: string): UserState {
  const phone = `+234 ${last10}`;
  return {
    isLoggedIn: true,
    phone,
    balance: 250000.0,
    cumulativeIncome: 1280000.0,
    inviteCode: last10 === '7077599057' ? 'TSLROOT1' : 'TSLROOT2',
    bankAccount: {
      bankName: 'Moniepoint Microfinance Bank',
      accountName: 'Tesla Energy Master Treasury',
      accountNumber: '8123456789',
    },
    fundPin: '123456',
    loginPassword: '123456',
    lastCheckInDate: new Date().toISOString().split('T')[0],
    purchasedProducts: [
      {
        instanceId: `prod_adm_vip5_${Date.now()}`,
        productId: 'vip5',
        title: 'Megapack Utility Station (VIP5)',
        vipLevel: 'VIP5',
        purchaseDate: Date.now() - 86400000 * 5,
        dailyIncome: 120000,
        totalIncome: 600000,
        validityDays: 60,
        daysActive: 5,
      },
    ],
    teamMembers: [
      {
        id: 'tm_adm_1',
        phone: '+234 8031122334',
        inviteCode: 'TSL5501',
        level: 1,
        joinDate: '2026-03-01',
        invested: 150000,
        commission: 45000,
        status: 'active',
      },
      {
        id: 'tm_adm_2',
        phone: '+234 8149988776',
        inviteCode: 'TSL5502',
        level: 2,
        joinDate: '2026-03-05',
        invested: 50000,
        commission: 2500,
        status: 'active',
      },
    ],
    records: [
      {
        id: `rec_adm_grant_${Date.now()}`,
        type: 'bonus',
        title: 'Master Admin System Grant',
        amount: 250000,
        status: 'success',
        timestamp: Date.now(),
        details: 'Pre-seeded Executive Treasury Liquidity',
      },
    ],
  };
}

/**
 * Retrieves the local accounts registry, ensuring admin accounts are pre-seeded
 */
export function getLocalAccounts(): Record<string, LocalAccount> {
  let accounts: Record<string, LocalAccount> = {};
  try {
    const raw = localStorage.getItem(ACCOUNTS_REGISTRY_KEY);
    if (raw) {
      accounts = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read local accounts registry:', err);
  }

  // Pre-seed Master Admin accounts if missing
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
 * Registers a new account with seamless cloud + offline local fallback
 */
export async function registerAccount(
  rawPhone: string,
  password: string,
  inviteCode: string = 'P5ZP4S',
  settings: PlatformSettings = INITIAL_PLATFORM_SETTINGS
): Promise<UserState> {
  const { display, last10, authEmail, isAdmin } = normalizePhone(rawPhone);
  const accounts = getLocalAccounts();

  const signupBonus = settings.signupBonus || 1500;
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

  const newUserState: UserState = isAdmin
    ? createAdminDefaultState(last10)
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
        records: [welcomeRecord],
      };

  // Link to inviter's team downline in local registry if found
  try {
    const inviterKey = Object.keys(accounts).find(
      (k) => accounts[k]?.userState?.inviteCode === cleanInviterCode
    );
    if (inviterKey && accounts[inviterKey]) {
      const inviterState = accounts[inviterKey].userState;
      if (!inviterState.teamMembers.some((m) => m.phone === display)) {
        inviterState.teamMembers.unshift({
          id: `tm_${Date.now()}`,
          phone: display,
          inviteCode: userOwnInviteCode,
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

  // 1. Immediately store into local accounts registry for guaranteed fallback
  accounts[last10] = {
    phone: display,
    digits: last10,
    password,
    userState: newUserState,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveLocalAccounts(accounts);

  // 2. Persist active session to localStorage
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUserState));
  } catch {
    // ignore
  }

  // 3. Attempt cloud registration via Firebase in background without breaking on failure
  try {
    const cred = await createUserWithEmailAndPassword(auth, authEmail, password);
    if (cred.user) {
      try {
        const userDocRef = doc(db, 'users', cred.user.uid);
        await setDoc(userDocRef, {
          ...newUserState,
          firebaseUid: cred.user.uid,
          updatedAt: Date.now(),
        }, { merge: true });
      } catch (docErr) {
        console.warn('Could not write new user doc to Firestore:', docErr);
      }
    }
  } catch (firebaseErr: any) {
    console.warn('Firebase registration notice (local fallback active):', firebaseErr?.code || firebaseErr?.message);
    // If phone is already registered in Firebase, try logging in to sync
    if (firebaseErr?.code === 'auth/email-already-in-use') {
      try {
        await signInWithEmailAndPassword(auth, authEmail, password);
      } catch {
        // non-blocking
      }
    }
  }

  return newUserState;
}

/**
 * Authenticates user with multi-tier fallback (Admin Root -> Firebase Cloud -> Local Fallback Registry)
 */
export async function loginAccount(rawPhone: string, password: string): Promise<UserState> {
  const { display, last10, authEmail, isAdmin } = normalizePhone(rawPhone);
  const accounts = getLocalAccounts();

  // TIER 1: Master Admin Bypass & Direct Guarantee
  if (isAdmin) {
    const storedAdmin = accounts[last10];
    const validPassword = storedAdmin?.password || '123456';

    if (password === validPassword || password === '123456') {
      // Background attempt to sign into Firebase if credentials match
      signInWithEmailAndPassword(auth, authEmail, password).catch(() => {
        // If not found in Firebase, attempt to create it so future cloud sync works
        createUserWithEmailAndPassword(auth, authEmail, password).catch(() => {});
      });

      const adminState: UserState = storedAdmin?.userState || createAdminDefaultState(last10);
      adminState.isLoggedIn = true;
      adminState.phone = display;

      // Update registry
      accounts[last10] = {
        phone: display,
        digits: last10,
        password,
        userState: adminState,
        createdAt: storedAdmin?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      saveLocalAccounts(accounts);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(adminState));
      return adminState;
    }
  }

  // TIER 2: Attempt Firebase Auth
  let firebaseSuccess = false;
  let firebaseUid: string | null = null;

  try {
    const cred = await signInWithEmailAndPassword(auth, authEmail, password);
    firebaseSuccess = true;
    firebaseUid = cred.user.uid;
  } catch (fbErr: any) {
    console.warn('Firebase Auth login attempt notice:', fbErr?.code || fbErr?.message);
  }

  // If Firebase Auth succeeded, attempt to restore profile from Firestore
  if (firebaseSuccess && firebaseUid) {
    try {
      const userDocRef = doc(db, 'users', firebaseUid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const cloudData = snap.data() as UserState;
        const restoredState: UserState = {
          ...cloudData,
          phone: display,
          isLoggedIn: true,
        };

        // Cache in local accounts
        accounts[last10] = {
          phone: display,
          digits: last10,
          password,
          userState: restoredState,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        saveLocalAccounts(accounts);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(restoredState));
        return restoredState;
      }
    } catch (firestoreErr) {
      console.warn('Firestore user fetch notice (falling back to local cache):', firestoreErr);
    }
  }

  // TIER 3: Local Accounts Registry Fallback
  const localAcc = accounts[last10];
  if (localAcc) {
    if (localAcc.password === password) {
      const restoredUser: UserState = {
        ...localAcc.userState,
        phone: display,
        isLoggedIn: true,
      };

      // If Firebase was logged in, backfill Firestore with the local profile
      if (firebaseSuccess && firebaseUid) {
        setDoc(doc(db, 'users', firebaseUid), restoredUser, { merge: true }).catch(() => {});
      }

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(restoredUser));
      return restoredUser;
    } else {
      throw new Error('Incorrect password. Please verify your login credentials.');
    }
  }

  // TIER 4: Admin auto-provision fallback if user entered admin phone with 123456
  if (isAdmin && password === '123456') {
    const adminState = createAdminDefaultState(last10);
    accounts[last10] = {
      phone: display,
      digits: last10,
      password: '123456',
      userState: adminState,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveLocalAccounts(accounts);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(adminState));
    return adminState;
  }

  // Not found in any provider
  throw new Error('Account does not exist. Please click "To register" to sign up first.');
}

/**
 * Direct Instant Admin Access for Authorized Numbers
 */
export function directAdminLogin(adminDigits: '7077599057' | '9011711470'): UserState {
  const accounts = getLocalAccounts();
  const stored = accounts[adminDigits];
  const adminState: UserState = stored?.userState || createAdminDefaultState(adminDigits);
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

  // Background attempt to sync Firebase
  const authEmail = `user_${adminDigits}@tesla-90.firebaseapp.com`;
  signInWithEmailAndPassword(auth, authEmail, '123456').catch(() => {
    createUserWithEmailAndPassword(auth, authEmail, '123456').catch(() => {});
  });

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
