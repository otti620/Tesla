import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db, auth, withFirestoreTimeout } from './firebase';
import { getLocalAccounts, saveLocalAccounts } from './authService';
import { cleanNigerianPhoneDigits } from '../utils/adminAuth';
import { 
  UserState, 
  VIPProduct, 
  GiftCode, 
  PlatformSettings, 
  TransactionRecord, 
  BankAccount, 
  TeamMember,
  PurchasedProductItem 
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_GIFT_CODES, INITIAL_PLATFORM_SETTINGS } from '../data/initialData';
import { distributeProductPurchaseCommissions } from './referralService';
import { normalizePurchasedProducts, normalizeProductCatalog, getCanonicalProduct } from '../utils/productUtils';
import { sanitizeForFirestore } from '../utils/firestoreSanitizer';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface CloudUserRecord {
  uid: string;
  phone: string;
  balance: number;
  cumulativeIncome: number;
  inviteCode: string;
  invitedBy?: string | null;
  fundPin?: string;
  bankAccount?: BankAccount | null;
  purchasedProducts?: PurchasedProductItem[];
  teamMembers?: TeamMember[];
  records?: TransactionRecord[];
  lastCheckInDate?: string | null;
  claimedPromoterMilestones?: string[];
  creditedByAdmin?: boolean;
  updatedAt?: number;
}

export interface CloudWithdrawalRecord {
  id: string;
  userId: string;
  userPhone: string;
  amount: number;
  fee: number;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  bankAccount?: BankAccount | null;
  details?: string;
}

export interface CloudDepositRecord {
  id: string;
  userId: string;
  userPhone: string;
  amount: number;
  channel: string;
  senderBank: string;
  payeeName: string;
  receivingBank?: string;
  receivingAccount?: string;
  receivingAccountName?: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  processedAt?: number;
  rejectedReason?: string;
  details?: string;
}

export interface AdminPlatformData {
  users: CloudUserRecord[];
  withdrawals: CloudWithdrawalRecord[];
  deposits: CloudDepositRecord[];
  products: VIPProduct[];
  giftCodes: GiftCode[];
  platformSettings: PlatformSettings;
  stats: {
    totalUsersCount: number;
    totalUserBalances: number;
    totalCumulativeIncome: number;
    totalActiveVipNodes: number;
    pendingWithdrawalsCount: number;
    pendingWithdrawalsAmount: number;
    approvedWithdrawalsCount: number;
    approvedWithdrawalsAmount: number;
    pendingDepositsCount: number;
    pendingDepositsAmount: number;
    approvedDepositsCount: number;
    approvedDepositsAmount: number;
    totalCompletedDeposits: number;
  };
  lastFetchedAt: number;
}

/**
 * FETCHES ADMIN DATA STRICTLY ON DEMAND DIRECTLY FROM FIREBASE FIRESTORE
 * Never attaches background subscription listeners. Runs only when explicitly called.
 */
export async function fetchAdminPlatformDataOnDemand(): Promise<AdminPlatformData> {
  const usersPath = 'users';
  const systemPath = 'system/app_state';
  const withdrawalsPath = 'withdrawals';
  const depositsPath = 'deposits';

  const usersList: CloudUserRecord[] = [];
  const withdrawalMap = new Map<string, CloudWithdrawalRecord>();
  const depositMap = new Map<string, CloudDepositRecord>();

  const userMap = new Map<string, CloudUserRecord>();

  const collectUserRecordsToMaps = (uidKey: string, data: UserState) => {
    if (Array.isArray(data.records)) {
      data.records.forEach((r) => {
        if (r.type === 'withdraw') {
          withdrawalMap.set(r.id, {
            id: r.id,
            userId: uidKey,
            userPhone: data.phone || 'User',
            amount: Number(r.amount) || 0,
            fee: Number(r.fee) || 0,
            status: r.status || 'pending',
            timestamp: r.timestamp || Date.now(),
            bankAccount: r.bankAccount || data.bankAccount || null,
            details: r.details,
          });
        } else if (r.type === 'recharge' || r.type === 'deposit') {
          let senderBank = 'Bank Transfer';
          let payeeName = data.phone || 'Member';
          if (r.details) {
            const match = r.details.match(/From (.*?) \((.*?)\)/);
            if (match) {
              senderBank = match[1];
              payeeName = match[2];
            }
          }
          depositMap.set(r.id, {
            id: r.id,
            userId: uidKey,
            userPhone: data.phone || 'User',
            amount: Number(r.amount) || 0,
            channel: r.title || 'Recharge Channel',
            senderBank,
            payeeName,
            status: r.status || 'pending',
            timestamp: r.timestamp || Date.now(),
            details: r.details,
          });
        }
      });
    }
  };

  // 0. Seed from local accounts registry first so data is always complete even offline
  try {
    const localAccounts = getLocalAccounts();
    Object.entries(localAccounts).forEach(([digitsKey, acc]) => {
      if (acc?.userState) {
        const data = acc.userState;
        const cleanP = cleanNigerianPhoneDigits(data.phone || digitsKey) || digitsKey;
        const userRec: CloudUserRecord = {
          uid: cleanP,
          phone: data.phone || `+234 ${cleanP}`,
          balance: Number(data.balance) || 0,
          cumulativeIncome: Number(data.cumulativeIncome) || 0,
          inviteCode: data.inviteCode || 'N/A',
          invitedBy: data.invitedBy || null,
          fundPin: data.fundPin || '123456',
          bankAccount: data.bankAccount || null,
          purchasedProducts: normalizePurchasedProducts(data.purchasedProducts),
          teamMembers: data.teamMembers || [],
          records: data.records || [],
          lastCheckInDate: data.lastCheckInDate || null,
          claimedPromoterMilestones: data.claimedPromoterMilestones || [],
          creditedByAdmin:
            data.creditedByAdmin === true ||
            Boolean(
              data.records &&
                data.records.some(
                  (r: any) =>
                    r.id?.startsWith('adm_') ||
                    r.title?.toLowerCase().includes('admin') ||
                    r.title?.toLowerCase().includes('grant')
                )
            ),
        };
        userMap.set(cleanP, userRec);
        collectUserRecordsToMaps(cleanP, data);
      }
    });
  } catch {}

  // 1. Fetch Users, Withdrawals, Deposits, and System State in parallel with fast timeout
  const [usersResult, wthResult, depResult, sysResult] = await Promise.allSettled([
    withFirestoreTimeout(getDocs(collection(db, usersPath)), 2200),
    withFirestoreTimeout(getDocs(collection(db, withdrawalsPath)), 2000),
    withFirestoreTimeout(getDocs(collection(db, depositsPath)), 2000),
    withFirestoreTimeout(getDoc(doc(db, 'system', 'app_state')), 2000),
  ]);

  if (usersResult.status === 'fulfilled') {
    usersResult.value.forEach((d) => {
      const data = d.data() as UserState;
      const cleanP = cleanNigerianPhoneDigits(data.phone || d.id) || d.id;
      const userRec: CloudUserRecord = {
        uid: d.id,
        phone: data.phone || (d.id.startsWith('+') || d.id.startsWith('0') ? data.phone || d.id : `+234 ${cleanP}`),
        balance: Number(data.balance) || 0,
        cumulativeIncome: Number(data.cumulativeIncome) || 0,
        inviteCode: data.inviteCode || 'N/A',
        invitedBy: data.invitedBy || null,
        fundPin: data.fundPin || '123456',
        bankAccount: data.bankAccount || null,
        purchasedProducts: normalizePurchasedProducts(data.purchasedProducts),
        teamMembers: data.teamMembers || [],
        records: data.records || [],
        lastCheckInDate: data.lastCheckInDate || null,
        claimedPromoterMilestones: data.claimedPromoterMilestones || [],
        creditedByAdmin:
          data.creditedByAdmin === true ||
          Boolean(
            data.records &&
              data.records.some(
                (r: any) =>
                  r.id?.startsWith('adm_') ||
                  r.title?.toLowerCase().includes('admin') ||
                  r.title?.toLowerCase().includes('grant')
              )
          ),
      };
      userMap.set(cleanP, userRec);
      collectUserRecordsToMaps(d.id, data);
    });
  }

  usersList.push(...Array.from(userMap.values()));

  // Ensure Master Admin accounts are listed
  const adminNumbers = ['7077599057', '9011711470'];
  adminNumbers.forEach((admDigits) => {
    const phone = `+234 ${admDigits}`;
    if (!usersList.some((u) => cleanNigerianPhoneDigits(u.phone) === admDigits || u.uid === admDigits)) {
      const adminRec: CloudUserRecord = {
        uid: admDigits,
        phone,
        balance: 0,
        cumulativeIncome: 0,
        inviteCode: admDigits === '7077599057' ? 'TSLROOT1' : 'TSLROOT2',
        invitedBy: null,
        fundPin: '123456',
        bankAccount: null,
        purchasedProducts: [],
        teamMembers: [],
        records: [],
        lastCheckInDate: null,
        claimedPromoterMilestones: [],
        creditedByAdmin: true,
      };
      usersList.push(adminRec);
    }
  });

  // 2. Process Global Withdrawals Collection from Firestore (if fulfilled)
  if (wthResult.status === 'fulfilled') {
    wthResult.value.forEach((d) => {
      const data = d.data() as CloudWithdrawalRecord;
      const matchedUser = usersList.find(
        (u) =>
          (data.userId && u.uid === data.userId) ||
          (data.userPhone &&
            (u.phone === data.userPhone ||
              u.phone.replace(/\D/g, '') === data.userPhone.replace(/\D/g, '')))
      );
      withdrawalMap.set(d.id, {
        id: d.id,
        userId: data.userId || matchedUser?.uid || matchedUser?.phone || 'User',
        userPhone: data.userPhone || matchedUser?.phone || 'User',
        amount: Number(data.amount) || 0,
        fee: Number(data.fee) || 0,
        status: data.status || 'pending',
        timestamp: data.timestamp || Date.now(),
        bankAccount: data.bankAccount || matchedUser?.bankAccount || null,
        details: data.details,
      });
    });
  }

  // 3. Process Global Deposits Collection from Firestore (if fulfilled)
  if (depResult.status === 'fulfilled') {
    depResult.value.forEach((d) => {
      const data = d.data() as CloudDepositRecord;
      const matchedUser = usersList.find(
        (u) =>
          (data.userId && u.uid === data.userId) ||
          (data.userPhone &&
            (u.phone === data.userPhone ||
              u.phone.replace(/\D/g, '') === data.userPhone.replace(/\D/g, '')))
      );
      depositMap.set(d.id, {
        id: d.id,
        userId: data.userId || matchedUser?.uid || matchedUser?.phone || 'User',
        userPhone: data.userPhone || matchedUser?.phone || 'User',
        amount: Number(data.amount) || 0,
        channel: data.channel || 'Recharge Channel',
        senderBank: data.senderBank || 'Bank Transfer',
        payeeName: data.payeeName || matchedUser?.phone || 'Member',
        receivingBank: data.receivingBank,
        receivingAccount: data.receivingAccount,
        receivingAccountName: data.receivingAccountName,
        status: data.status || 'pending',
        timestamp: data.timestamp || Date.now(),
        processedAt: data.processedAt,
        rejectedReason: data.rejectedReason,
        details: data.details,
      });
    });
  }

  // 4. Process Platform System State (with localStorage fallback)
  let products = INITIAL_PRODUCTS;
  let giftCodes = INITIAL_GIFT_CODES;
  let platformSettings = INITIAL_PLATFORM_SETTINGS;

  try {
    const savedProd = localStorage.getItem('tesla_products_state');
    if (savedProd) {
      const parsed = JSON.parse(savedProd);
      if (Array.isArray(parsed) && parsed.length > 0) products = normalizeProductCatalog(parsed);
    }
    const savedGift = localStorage.getItem('tesla_gift_codes_state');
    if (savedGift) {
      const parsed = JSON.parse(savedGift);
      if (Array.isArray(parsed)) giftCodes = parsed;
    }
    const savedSettings = localStorage.getItem('tesla_platform_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed) platformSettings = { ...INITIAL_PLATFORM_SETTINGS, ...parsed };
    }
  } catch {}

  if (sysResult.status === 'fulfilled' && sysResult.value.exists()) {
    const data = sysResult.value.data();
    if (Array.isArray(data.products) && data.products.length > 0) {
      products = normalizeProductCatalog(data.products);
    }
    if (Array.isArray(data.giftCodes)) {
      giftCodes = data.giftCodes.filter(
        (gc: GiftCode) =>
          gc.code !== 'TESLA2026' && gc.code !== 'TESLABONUS' && gc.code !== 'CYBERTRUCK'
      );
    }
    if (data.platformSettings) {
      const s = { ...data.platformSettings };
      if (s.signupBonus === 2300 || s.signupBonus === 1500 || s.signupBonus === 500 || s.signupBonus === 1000) s.signupBonus = 1100;
      if (s.minWithdrawal === 2000 || s.minWithdrawal === 2300 || s.minWithdrawal === 1500 || !s.minWithdrawal) s.minWithdrawal = 800;
      if (typeof s.announcementNotice === 'string' && s.announcementNotice.includes('Tesla')) {
        s.announcementNotice = s.announcementNotice
          .replace(/Tesla Clean Energy Fleet/gi, 'Ola Cabs (OlaCabs) Mobility Fleet')
          .replace(/Tesla Clean Energy/gi, 'Ola Cabs (OlaCabs)')
          .replace(/Tesla/gi, 'Ola Cabs');
      }
      platformSettings = {
        ...INITIAL_PLATFORM_SETTINGS,
        ...s,
      };
    }
  }

  // Compile all withdrawal requests
  const withdrawals = Array.from(withdrawalMap.values()).sort(
    (a, b) => b.timestamp - a.timestamp
  );

  // Compile all deposit requests
  const deposits = Array.from(depositMap.values()).sort(
    (a, b) => b.timestamp - a.timestamp
  );

  // Compute Platform Metrics
  const totalUsersCount = usersList.length;
  const totalUserBalances = usersList.reduce((acc, u) => acc + (u.balance || 0), 0);
  const totalCumulativeIncome = usersList.reduce((acc, u) => acc + (u.cumulativeIncome || 0), 0);
  const totalActiveVipNodes = usersList.reduce(
    (acc, u) => acc + (u.purchasedProducts?.length || 0),
    0
  );

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
  const approvedWithdrawals = withdrawals.filter((w) => w.status === 'success');

  const pendingWithdrawalsCount = pendingWithdrawals.length;
  const pendingWithdrawalsAmount = pendingWithdrawals.reduce((s, w) => s + w.amount, 0);
  const approvedWithdrawalsCount = approvedWithdrawals.length;
  const approvedWithdrawalsAmount = approvedWithdrawals.reduce((s, w) => s + w.amount, 0);

  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const approvedDeposits = deposits.filter((d) => d.status === 'success');

  const pendingDepositsCount = pendingDeposits.length;
  const pendingDepositsAmount = pendingDeposits.reduce((s, d) => s + d.amount, 0);
  const approvedDepositsCount = approvedDeposits.length;
  const approvedDepositsAmount = approvedDeposits.reduce((s, d) => s + d.amount, 0);

  // Calculate total recharge/deposit volume from all users' success recharge records and approved deposits
  let totalCompletedDeposits = approvedDepositsAmount;
  if (totalCompletedDeposits === 0) {
    usersList.forEach((u) => {
      if (Array.isArray(u.records)) {
        u.records
          .filter((r) => (r.type === 'recharge' || r.type === 'deposit') && r.status === 'success')
          .forEach((r) => {
            totalCompletedDeposits += r.amount;
          });
      }
    });
  }

  return {
    users: usersList,
    withdrawals,
    deposits,
    products,
    giftCodes,
    platformSettings,
    stats: {
      totalUsersCount,
      totalUserBalances,
      totalCumulativeIncome,
      totalActiveVipNodes,
      pendingWithdrawalsCount,
      pendingWithdrawalsAmount,
      approvedWithdrawalsCount,
      approvedWithdrawalsAmount,
      pendingDepositsCount,
      pendingDepositsAmount,
      approvedDepositsCount,
      approvedDepositsAmount,
      totalCompletedDeposits,
    },
    lastFetchedAt: Date.now(),
  };
}

/**
 * Helper to resolve the user document reference across UID, phone, and local registry
 */
export async function resolveUserDocRef(
  targetUid: string,
  targetPhone?: string
): Promise<{ ref: any; data: UserState; docId: string }> {
  // 1. Direct getDoc on targetUid
  if (targetUid) {
    try {
      const directRef = doc(db, 'users', targetUid);
      const snap = await withFirestoreTimeout(getDoc(directRef), 1500);
      if (snap.exists()) {
        return { ref: directRef, data: snap.data() as UserState, docId: directRef.id };
      }
    } catch {}
  }

  // 2. Search collection('users') by phone matching targetPhone or targetUid
  const cleanPhone = cleanNigerianPhoneDigits(targetPhone || targetUid);
  if (cleanPhone) {
    try {
      const directPhoneRef = doc(db, 'users', cleanPhone);
      const phoneSnap = await withFirestoreTimeout(getDoc(directPhoneRef), 1500);
      if (phoneSnap.exists()) {
        return { ref: directPhoneRef, data: phoneSnap.data() as UserState, docId: cleanPhone };
      }
    } catch {}

    try {
      const snap = await withFirestoreTimeout(getDocs(collection(db, 'users')), 2000);
      for (const d of snap.docs) {
        const u = d.data() as UserState;
        if (cleanNigerianPhoneDigits(u.phone || '') === cleanPhone || d.id === cleanPhone) {
          return { ref: d.ref, data: u, docId: d.id };
        }
      }
    } catch {}
  }

  // 3. Fallback from local accounts registry
  const localAccounts = getLocalAccounts();
  const matchedKey = Object.keys(localAccounts).find((k) => {
    return k === targetUid || cleanNigerianPhoneDigits(localAccounts[k].phone) === cleanPhone;
  });

  const fallbackData: UserState = (matchedKey && localAccounts[matchedKey])
    ? localAccounts[matchedKey].userState
    : {
        isLoggedIn: true,
        phone: targetPhone || (cleanPhone ? `+234 ${cleanPhone}` : targetUid),
        balance: 0,
        cumulativeIncome: 0,
        inviteCode: cleanPhone ? `OLA${cleanPhone.slice(-4)}` : 'OLA0000',
        bankAccount: null,
        fundPin: '123456',
        lastCheckInDate: null,
        purchasedProducts: [],
        teamMembers: [],
        records: [],
      };

  const primaryDocId = cleanPhone || targetUid || `user_${Date.now()}`;
  const newRef = doc(db, 'users', primaryDocId);
  try {
    const payload = sanitizeForFirestore({ ...fallbackData, updatedAt: Date.now() });
    await withFirestoreTimeout(setDoc(newRef, payload, { merge: true }), 1500);
  } catch {}

  return { ref: newRef, data: fallbackData, docId: primaryDocId };
}

/**
 * ADMIN: Update a user's wallet balance directly in Firebase Firestore and active state
 */
export async function adminUpdateUserBalanceInFirebase(
  targetUid: string,
  newBalance: number,
  reason: string = 'Admin Balance Calibration',
  targetPhone?: string
): Promise<void> {
  const cleanPhone = cleanNigerianPhoneDigits(targetPhone || targetUid);
  const resolved = await resolveUserDocRef(targetUid, targetPhone);
  const currentBalance = resolved ? Number(resolved.data.balance) || 0 : 0;
  const diff = newBalance - currentBalance;

  const auditRecord: TransactionRecord = {
    id: `adm_adj_${Date.now()}`,
    type: diff >= 0 ? 'bonus' : 'withdraw',
    title: diff >= 0 ? 'Admin Balance Adjustment' : 'Admin Balance Deduction',
    amount: Math.abs(diff),
    status: 'success',
    timestamp: Date.now(),
    details: `${reason} (Prev: ₦${currentBalance.toLocaleString()} → Now: ₦${newBalance.toLocaleString()})`,
  };

  const updatedRecords = resolved ? [auditRecord, ...(resolved.data.records || [])] : [auditRecord];

  // 1. Update all possible Firestore document targets (resolved doc, UID, phone digits)
  const docRefsToUpdate = new Set<string>();
  if (resolved?.docId) docRefsToUpdate.add(resolved.docId);
  if (targetUid) docRefsToUpdate.add(targetUid);
  if (cleanPhone) docRefsToUpdate.add(cleanPhone);

  for (const dId of docRefsToUpdate) {
    try {
      await setDoc(
        doc(db, 'users', dId),
        {
          balance: newBalance,
          records: updatedRecords,
          creditedByAdmin: true,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (err) {
      console.debug(`Firestore balance update notice for doc ${dId}:`, (err as Error)?.message || String(err));
    }
  }

  // 2. Update in Local Registry
  try {
    const localAccounts = getLocalAccounts();
    const matchedKey = Object.keys(localAccounts).find(
      (k) => k === targetUid || cleanNigerianPhoneDigits(localAccounts[k].phone) === cleanPhone
    );
    if (matchedKey && localAccounts[matchedKey]) {
      const u = localAccounts[matchedKey].userState;
      u.balance = newBalance;
      u.records = updatedRecords;
      u.creditedByAdmin = true;
      localAccounts[matchedKey].updatedAt = Date.now();
      saveLocalAccounts(localAccounts);
    }
  } catch {}

  // 3. Update active session in localStorage if matching
  try {
    const sessionRaw = localStorage.getItem('dangote_app_state_v2') || localStorage.getItem('tesla_app_state_v2');
    if (sessionRaw) {
      const sessionUser = JSON.parse(sessionRaw);
      if (cleanPhone && cleanNigerianPhoneDigits(sessionUser.phone) === cleanPhone) {
        sessionUser.balance = newBalance;
        sessionUser.records = updatedRecords;
        sessionUser.creditedByAdmin = true;
        localStorage.setItem('dangote_app_state_v2', JSON.stringify(sessionUser));
        localStorage.setItem('tesla_app_state_v2', JSON.stringify(sessionUser));
      }
    }
  } catch {}

  // 4. Dispatch real-time cross-component and cross-tab events
  window.dispatchEvent(new CustomEvent('dangote_user_balance_updated', { detail: { balance: newBalance, creditedByAdmin: true } }));
  window.dispatchEvent(new CustomEvent('tesla_user_balance_updated', { detail: { balance: newBalance, creditedByAdmin: true } }));
  window.dispatchEvent(new CustomEvent('dangote_user_state_updated', { detail: { balance: newBalance, records: updatedRecords, creditedByAdmin: true } }));
  window.dispatchEvent(new CustomEvent('tesla_user_state_updated', { detail: { balance: newBalance, records: updatedRecords, creditedByAdmin: true } }));
}

/**
 * ADMIN: Deduct balance from user directly
 */
export async function adminDeductUserBalanceInFirebase(
  targetUid: string,
  deductAmount: number,
  reason: string = 'Admin Balance Debit',
  targetPhone?: string
): Promise<void> {
  const resolved = await resolveUserDocRef(targetUid, targetPhone);
  const currentBalance = resolved ? Number(resolved.data.balance) || 0 : 0;
  const newBalance = Math.max(0, currentBalance - Math.abs(deductAmount));
  return adminUpdateUserBalanceInFirebase(targetUid, newBalance, reason, targetPhone);
}

/**
 * ADMIN: Grant incentive bonus to a member directly in Firebase Firestore
 */
export async function adminGrantUserBonusInFirebase(
  targetUid: string,
  amount: number,
  reason: string = 'Admin VIP Incentive Grant',
  targetPhone?: string
): Promise<void> {
  const resolved = await resolveUserDocRef(targetUid, targetPhone);
  const currentBalance = resolved ? Number(resolved.data.balance) || 0 : 0;
  const newBalance = currentBalance + amount;

  const bonusRec: TransactionRecord = {
    id: `adm_bon_${Date.now()}`,
    type: 'bonus',
    title: 'Official Executive Grant',
    amount,
    status: 'success',
    timestamp: Date.now(),
    details: reason,
  };

  if (resolved) {
    try {
      await setDoc(
        resolved.ref,
        {
          balance: newBalance,
          records: [bonusRec, ...(resolved.data.records || [])],
          creditedByAdmin: true,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (err) {
      console.debug('Firestore bonus grant notice:', (err as Error)?.message || String(err));
    }
  }

  const cleanPhone = cleanNigerianPhoneDigits(targetPhone || targetUid);
  try {
    const localAccounts = getLocalAccounts();
    const matchedKey = Object.keys(localAccounts).find(
      (k) => k === targetUid || cleanNigerianPhoneDigits(localAccounts[k].phone) === cleanPhone
    );
    if (matchedKey && localAccounts[matchedKey]) {
      const u = localAccounts[matchedKey].userState;
      u.balance = (Number(u.balance) || 0) + amount;
      u.records = [bonusRec, ...(u.records || [])];
      u.creditedByAdmin = true;
      localAccounts[matchedKey].updatedAt = Date.now();
      saveLocalAccounts(localAccounts);
    }
  } catch {}

  try {
    const sessionRaw = localStorage.getItem('dangote_app_state_v2') || localStorage.getItem('tesla_app_state_v2');
    if (sessionRaw) {
      const sessionUser = JSON.parse(sessionRaw);
      if (cleanNigerianPhoneDigits(sessionUser.phone) === cleanPhone) {
        sessionUser.balance = (Number(sessionUser.balance) || 0) + amount;
        sessionUser.records = [bonusRec, ...(sessionUser.records || [])];
        sessionUser.creditedByAdmin = true;
        localStorage.setItem('dangote_app_state_v2', JSON.stringify(sessionUser));
        localStorage.setItem('tesla_app_state_v2', JSON.stringify(sessionUser));
        window.dispatchEvent(new CustomEvent('dangote_user_balance_updated', { detail: { balance: sessionUser.balance, creditedByAdmin: true } }));
        window.dispatchEvent(new CustomEvent('tesla_user_balance_updated', { detail: { balance: sessionUser.balance, creditedByAdmin: true } }));
        window.dispatchEvent(new CustomEvent('dangote_user_state_updated', { detail: { balance: sessionUser.balance, records: sessionUser.records, creditedByAdmin: true } }));
        window.dispatchEvent(new CustomEvent('tesla_user_state_updated', { detail: { balance: sessionUser.balance, records: sessionUser.records, creditedByAdmin: true } }));
      }
    }
  } catch {}
}

/**
 * ADMIN: Explicitly toggle or set a user's admin credited withdrawal authorization status
 */
export async function adminSetUserCreditedStatusInFirebase(
  targetUid: string,
  isCredited: boolean = true,
  reason: string = 'Admin Direct Withdrawal Authorization',
  targetPhone?: string
): Promise<{ success: boolean; message: string }> {
  const cleanPhone = cleanNigerianPhoneDigits(targetPhone || targetUid);
  const resolved = await resolveUserDocRef(targetUid, targetPhone);

  const authRecord: TransactionRecord = {
    id: `adm_auth_${Date.now()}`,
    type: 'bonus',
    title: isCredited ? 'Admin Withdrawal Authorization Granted' : 'Admin Withdrawal Authorization Revoked',
    amount: 0,
    status: 'success',
    timestamp: Date.now(),
    details: `${reason} - Executed by Master Console`,
  };

  const updatedRecords = resolved ? [authRecord, ...(resolved.data.records || [])] : [authRecord];

  const docRefsToUpdate = new Set<string>();
  if (resolved?.docId) docRefsToUpdate.add(resolved.docId);
  if (targetUid) docRefsToUpdate.add(targetUid);
  if (cleanPhone) docRefsToUpdate.add(cleanPhone);

  for (const dId of docRefsToUpdate) {
    try {
      await setDoc(
        doc(db, 'users', dId),
        {
          creditedByAdmin: isCredited,
          records: updatedRecords,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (err) {
      console.debug(`Firestore credit authorization notice for doc ${dId}:`, (err as Error)?.message || String(err));
    }
  }

  // Update in Local Registry
  try {
    const localAccounts = getLocalAccounts();
    const matchedKey = Object.keys(localAccounts).find(
      (k) => k === targetUid || cleanNigerianPhoneDigits(localAccounts[k].phone) === cleanPhone
    );
    if (matchedKey && localAccounts[matchedKey]) {
      const u = localAccounts[matchedKey].userState;
      u.creditedByAdmin = isCredited;
      u.records = updatedRecords;
      localAccounts[matchedKey].updatedAt = Date.now();
      saveLocalAccounts(localAccounts);
    }
  } catch {}

  // Update active session in localStorage if matching
  try {
    const sessionRaw = localStorage.getItem('dangote_app_state_v2') || localStorage.getItem('tesla_app_state_v2');
    if (sessionRaw) {
      const sessionUser = JSON.parse(sessionRaw);
      if (cleanPhone && cleanNigerianPhoneDigits(sessionUser.phone) === cleanPhone) {
        sessionUser.creditedByAdmin = isCredited;
        sessionUser.records = updatedRecords;
        localStorage.setItem('dangote_app_state_v2', JSON.stringify(sessionUser));
        localStorage.setItem('tesla_app_state_v2', JSON.stringify(sessionUser));
        window.dispatchEvent(new CustomEvent('dangote_user_state_updated', { detail: { creditedByAdmin: isCredited, records: updatedRecords } }));
        window.dispatchEvent(new CustomEvent('tesla_user_state_updated', { detail: { creditedByAdmin: isCredited, records: updatedRecords } }));
      }
    }
  } catch {}

  return {
    success: true,
    message: isCredited
      ? `User ${targetPhone || targetUid} is now authorized for direct withdrawal (Credited by Admin).`
      : `Admin credit authorization revoked for ${targetPhone || targetUid}.`,
  };
}

/**
 * ADMIN: Real-Time Add / Grant a VIP fleet product directly to a user in Firebase Firestore and local registry
 */
export async function adminAssignProductToUserInFirebase(
  targetUid: string,
  product: VIPProduct,
  targetPhone?: string,
  reason: string = 'Admin VIP Direct Allocation',
  distributeCommission: boolean = false,
  platformSettings?: PlatformSettings
): Promise<{ success: boolean; message: string; instance?: PurchasedProductItem }> {
  const cleanPhone = cleanNigerianPhoneDigits(targetPhone || targetUid);
  const resolved = await resolveUserDocRef(targetUid, targetPhone);

  const now = Date.now();
  const canonical = getCanonicalProduct(product.id) || getCanonicalProduct(product.vipLevel) || product;
  const newInstance: PurchasedProductItem = {
    instanceId: `inst_${now}_${Math.random().toString(36).slice(2, 6)}`,
    productId: canonical.id,
    title: canonical.title,
    vipLevel: canonical.vipLevel,
    purchaseDate: now,
    lastClaimDate: now,
    dailyIncome: canonical.dailyIncome,
    totalIncome: canonical.totalIncome,
    validityDays: canonical.validityDays,
    daysActive: 0,
    image: canonical.image,
  };

  const grantRec: TransactionRecord = {
    id: `adm_prod_${now}`,
    type: 'purchase',
    title: `Admin VIP Grant: ${canonical.vipLevel}`,
    amount: canonical.price,
    status: 'success',
    timestamp: now,
    details: `${reason} (${canonical.title} - Daily: ₦${canonical.dailyIncome.toLocaleString()})`,
  };

  // 1. Update in Firestore
  if (resolved) {
    try {
      const existingProducts = (resolved.data.purchasedProducts || []) as PurchasedProductItem[];
      const existingRecords = (resolved.data.records || []) as TransactionRecord[];
      const updatedProducts = normalizePurchasedProducts([...existingProducts, newInstance]);
      const updatedRecords = [grantRec, ...existingRecords];

      await setDoc(
        resolved.ref,
        {
          purchasedProducts: updatedProducts,
          records: updatedRecords,
          updatedAt: now,
        },
        { merge: true }
      );

      // Mirror to phone document ID if resolved doc ID is UID
      if (cleanPhone && resolved.ref.id !== cleanPhone) {
        await setDoc(
          doc(db, 'users', cleanPhone),
          {
            purchasedProducts: updatedProducts,
            records: updatedRecords,
            updatedAt: now,
          },
          { merge: true }
        ).catch(() => {});
      }
    } catch (err) {
      console.debug('Firestore admin product grant notice:', (err as Error)?.message || String(err));
    }
  } else if (cleanPhone || targetUid) {
    const targetId = cleanPhone || targetUid;
    try {
      await setDoc(
        doc(db, 'users', targetId),
        {
          phone: targetPhone || targetUid,
          purchasedProducts: [newInstance],
          records: [grantRec],
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (err) {
      console.debug('Direct bootstrap product grant notice:', (err as Error)?.message || String(err));
    }
  }

  // 2. Update in Local Accounts Registry
  try {
    const localAccounts = getLocalAccounts();
    const matchedKey = Object.keys(localAccounts).find(
      (k) => k === targetUid || cleanNigerianPhoneDigits(localAccounts[k].phone) === cleanPhone
    );
    if (matchedKey && localAccounts[matchedKey]) {
      const u = localAccounts[matchedKey].userState;
      u.purchasedProducts = [...(u.purchasedProducts || []), newInstance];
      u.records = [grantRec, ...(u.records || [])];
      localAccounts[matchedKey].updatedAt = now;
      saveLocalAccounts(localAccounts);
    }
  } catch {}

  // 3. Update active session if target matches current user
  try {
    const sessionRaw = localStorage.getItem('dangote_app_state_v2') || localStorage.getItem('tesla_app_state_v2');
    if (sessionRaw) {
      const sessionUser = JSON.parse(sessionRaw);
      if (cleanNigerianPhoneDigits(sessionUser.phone) === cleanPhone || sessionUser.id === targetUid) {
        sessionUser.purchasedProducts = [...(sessionUser.purchasedProducts || []), newInstance];
        sessionUser.records = [grantRec, ...(sessionUser.records || [])];
        localStorage.setItem('dangote_app_state_v2', JSON.stringify(sessionUser));
        localStorage.setItem('tesla_app_state_v2', JSON.stringify(sessionUser));
        window.dispatchEvent(new CustomEvent('dangote_user_state_updated', { detail: sessionUser }));
        window.dispatchEvent(new CustomEvent('tesla_user_state_updated', { detail: sessionUser }));
        window.dispatchEvent(new CustomEvent('dangote_product_assigned', { detail: { product: newInstance } }));
        window.dispatchEvent(new CustomEvent('tesla_product_assigned', { detail: { product: newInstance } }));
      }
    }
  } catch {}

  // 4. Optionally distribute referral commissions
  if (distributeCommission && resolved?.data?.invitedBy && platformSettings) {
    try {
      await distributeProductPurchaseCommissions({
        buyerPhone: targetPhone || resolved.data.phone,
        buyerInviteCode: resolved.data.inviteCode,
        buyerInvitedBy: resolved.data.invitedBy,
        amount: product.price,
        productTitle: `Admin Grant: ${product.title}`,
        platformSettings: platformSettings,
      });
    } catch (commErr) {
      console.warn('Commission distribution notice during grant:', commErr);
    }
  }

  return {
    success: true,
    message: `Granted ${product.vipLevel} (${product.title}) to ${targetPhone || targetUid} in Real-Time!`,
    instance: newInstance,
  };
}

/**
 * Save user's bank account in Firebase Firestore and local accounts registry
 */
export async function saveUserBankAccountInFirebase(
  targetUidOrPhone: string,
  bankAccount: BankAccount,
  targetPhone?: string
): Promise<void> {
  const cleanPhone = cleanNigerianPhoneDigits(targetPhone || targetUidOrPhone);
  const resolved = await resolveUserDocRef(targetUidOrPhone, targetPhone || cleanPhone);

  // 1. Write to resolved primary user doc in Firestore
  if (resolved) {
    try {
      await setDoc(resolved.ref, { bankAccount, updatedAt: Date.now() }, { merge: true });
    } catch (err) {
      console.debug('Firestore bank account save notice:', (err as Error)?.message || String(err));
    }
  }

  // 2. Also write to direct phone & uid doc keys if different
  if (cleanPhone) {
    try {
      await setDoc(doc(db, 'users', cleanPhone), { bankAccount, updatedAt: Date.now() }, { merge: true });
    } catch {}
  }
  if (auth.currentUser?.uid) {
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), { bankAccount, updatedAt: Date.now() }, { merge: true });
    } catch {}
  }

  // 3. Update local accounts registry
  try {
    const localAccounts = getLocalAccounts();
    const matchedKey = Object.keys(localAccounts).find(
      (k) => k === targetUidOrPhone || cleanNigerianPhoneDigits(localAccounts[k].phone) === cleanPhone
    );
    if (matchedKey && localAccounts[matchedKey]) {
      localAccounts[matchedKey].userState.bankAccount = bankAccount;
      localAccounts[matchedKey].updatedAt = Date.now();
      saveLocalAccounts(localAccounts);
    }
  } catch {}
}

/**
 * ADMIN: Reset user's 6-digit withdrawal PIN in Firebase Firestore
 */
export async function adminResetUserPinInFirebase(
  targetUid: string,
  newPin: string,
  targetPhone?: string
): Promise<void> {
  const resolved = await resolveUserDocRef(targetUid, targetPhone);
  if (resolved) {
    try {
      await setDoc(resolved.ref, { fundPin: newPin, updatedAt: Date.now() }, { merge: true });
    } catch (err) {
      console.debug('Firestore PIN reset notice:', (err as Error)?.message || String(err));
    }
  }

  const cleanPhone = cleanNigerianPhoneDigits(targetPhone || targetUid);
  try {
    const localAccounts = getLocalAccounts();
    const matchedKey = Object.keys(localAccounts).find(
      (k) => k === targetUid || cleanNigerianPhoneDigits(localAccounts[k].phone) === cleanPhone
    );
    if (matchedKey && localAccounts[matchedKey]) {
      localAccounts[matchedKey].userState.fundPin = newPin;
      localAccounts[matchedKey].updatedAt = Date.now();
      saveLocalAccounts(localAccounts);
    }
  } catch {}
}

/**
 * ADMIN: Approve a withdrawal payout in Firebase Firestore
 */
export async function adminApproveWithdrawalInFirebase(
  withdrawalId: string,
  targetUid?: string,
  targetPhone?: string
): Promise<void> {
  const cleanPhone = cleanNigerianPhoneDigits(targetPhone || targetUid || '');

  // 1. Update global withdrawals collection
  try {
    const wDocRef = doc(db, 'withdrawals', withdrawalId);
    await setDoc(
      wDocRef,
      {
        status: 'success',
        processedAt: Date.now(),
      },
      { merge: true }
    );
  } catch {}

  // 2. Update user's records in Firestore
  if (targetUid || cleanPhone) {
    const resolved = await resolveUserDocRef(targetUid || '', targetPhone || targetUid);
    if (resolved) {
      try {
        const updatedRecords = (resolved.data.records || []).map((r) =>
          r.id === withdrawalId ? { ...r, status: 'success' as const } : r
        );
        await setDoc(
          resolved.ref,
          {
            records: updatedRecords,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      } catch (err) {
        console.debug('Firestore withdrawal approval notice:', (err as Error)?.message || String(err));
      }
    }
  }

  // 3. Update local registry
  try {
    const localAccounts = getLocalAccounts();
    const matchedKey = Object.keys(localAccounts).find(
      (k) => k === targetUid || (cleanPhone && cleanNigerianPhoneDigits(localAccounts[k].phone) === cleanPhone)
    );
    if (matchedKey && localAccounts[matchedKey]) {
      const u = localAccounts[matchedKey].userState;
      u.records = (u.records || []).map((r) =>
        r.id === withdrawalId ? { ...r, status: 'success' as const } : r
      );
      localAccounts[matchedKey].updatedAt = Date.now();
      saveLocalAccounts(localAccounts);
    }
  } catch {}

  // 4. Update active session if matching
  try {
    const sessionRaw = localStorage.getItem('dangote_app_state_v2') || localStorage.getItem('tesla_app_state_v2');
    if (sessionRaw) {
      const sessionUser = JSON.parse(sessionRaw);
      if (cleanPhone && cleanNigerianPhoneDigits(sessionUser.phone) === cleanPhone) {
        sessionUser.records = (sessionUser.records || []).map((r: TransactionRecord) =>
          r.id === withdrawalId ? { ...r, status: 'success' as const } : r
        );
        localStorage.setItem('dangote_app_state_v2', JSON.stringify(sessionUser));
        localStorage.setItem('tesla_app_state_v2', JSON.stringify(sessionUser));
        window.dispatchEvent(new CustomEvent('dangote_user_records_updated'));
        window.dispatchEvent(new CustomEvent('tesla_user_records_updated'));
      }
    }
  } catch {}
}

/**
 * ADMIN: Reject a withdrawal payout and refund balance in Firebase Firestore
 */
export async function adminRejectWithdrawalInFirebase(
  withdrawalId: string,
  targetUid?: string,
  refundAmount?: number,
  targetPhone?: string
): Promise<void> {
  const cleanPhone = cleanNigerianPhoneDigits(targetPhone || targetUid || '');

  // 1. Check global withdrawals doc to prevent duplicate reversal/refund
  try {
    const wDocRef = doc(db, 'withdrawals', withdrawalId);
    const wSnap = await getDoc(wDocRef);
    if (wSnap.exists() && wSnap.data()?.status === 'failed') {
      console.log(`Withdrawal #${withdrawalId} has already been reversed/rejected. Skipping duplicate refund.`);
      return;
    }
    await setDoc(
      wDocRef,
      {
        status: 'failed',
        rejectedAt: Date.now(),
      },
      { merge: true }
    );
  } catch {}

  let finalRefundAmount = refundAmount || 0;

  // 2. Update user document and refund wallet in Firestore idempotently
  if (targetUid || cleanPhone) {
    const resolved = await resolveUserDocRef(targetUid || '', targetPhone || targetUid);
    if (resolved) {
      try {
        const uData = resolved.data;
        const targetRecord = (uData.records || []).find((r) => r.id === withdrawalId);
        
        // If the record was already marked failed, skip crediting balance to avoid double refund
        if (targetRecord && targetRecord.status === 'failed') {
          console.log(`Withdrawal record #${withdrawalId} already marked failed in user doc. Skipping.`);
        } else {
          if (!finalRefundAmount) {
            finalRefundAmount = targetRecord?.amount ?? 0;
          }

          const updatedRecords = (uData.records || []).map((r) =>
            r.id === withdrawalId ? { ...r, status: 'failed' as const } : r
          );

          const refundRecord: TransactionRecord = {
            id: `ref_${withdrawalId}`,
            type: 'bonus',
            title: 'Withdrawal Refund',
            amount: finalRefundAmount,
            status: 'success',
            timestamp: Date.now(),
            details: `Reversal of rejected withdrawal payout #${withdrawalId.slice(-6)}`,
          };

          const newBal = (Number(uData.balance) || 0) + finalRefundAmount;
          await setDoc(
            resolved.ref,
            {
              balance: newBal,
              records: [refundRecord, ...updatedRecords],
              updatedAt: Date.now(),
            },
            { merge: true }
          );
        }
      } catch (err) {
        console.debug('Firestore withdrawal rejection notice:', (err as Error)?.message || String(err));
      }
    }
  }

  // 3. Update local registry idempotently
  try {
    const localAccounts = getLocalAccounts();
    const matchedKey = Object.keys(localAccounts).find(
      (k) => k === targetUid || (cleanPhone && cleanNigerianPhoneDigits(localAccounts[k].phone) === cleanPhone)
    );
    if (matchedKey && localAccounts[matchedKey]) {
      const u = localAccounts[matchedKey].userState;
      const targetRecord = (u.records || []).find((r) => r.id === withdrawalId);
      if (!targetRecord || targetRecord.status !== 'failed') {
        const amountToRefund = finalRefundAmount || targetRecord?.amount || 0;
        const updatedRecords = (u.records || []).map((r) =>
          r.id === withdrawalId ? { ...r, status: 'failed' as const } : r
        );
        const refundRecord: TransactionRecord = {
          id: `ref_${withdrawalId}`,
          type: 'bonus',
          title: 'Withdrawal Refund',
          amount: amountToRefund,
          status: 'success',
          timestamp: Date.now(),
          details: `Reversal of rejected withdrawal payout #${withdrawalId.slice(-6)}`,
        };
        u.balance = (Number(u.balance) || 0) + amountToRefund;
        u.records = [refundRecord, ...updatedRecords];
        localAccounts[matchedKey].updatedAt = Date.now();
        saveLocalAccounts(localAccounts);
      }
    }
  } catch {}

  // 4. Update active session in localStorage
  try {
    const sessionRaw = localStorage.getItem('dangote_app_state_v2') || localStorage.getItem('tesla_app_state_v2');
    if (sessionRaw) {
      const sessionUser = JSON.parse(sessionRaw);
      if (cleanPhone && cleanNigerianPhoneDigits(sessionUser.phone) === cleanPhone) {
        const targetRecord = (sessionUser.records || []).find((r: TransactionRecord) => r.id === withdrawalId);
        if (!targetRecord || targetRecord.status !== 'failed') {
          const amountToRefund = finalRefundAmount;
          sessionUser.balance = (Number(sessionUser.balance) || 0) + amountToRefund;
          const updatedRecords = (sessionUser.records || []).map((r: TransactionRecord) =>
            r.id === withdrawalId ? { ...r, status: 'failed' as const } : r
          );
          const refundRecord: TransactionRecord = {
            id: `ref_${withdrawalId}`,
            type: 'bonus',
            title: 'Withdrawal Refund',
            amount: amountToRefund,
            status: 'success',
            timestamp: Date.now(),
            details: `Reversal of rejected withdrawal payout #${withdrawalId.slice(-6)}`,
          };
          sessionUser.records = [refundRecord, ...updatedRecords];
          localStorage.setItem('dangote_app_state_v2', JSON.stringify(sessionUser));
          localStorage.setItem('tesla_app_state_v2', JSON.stringify(sessionUser));
          window.dispatchEvent(new CustomEvent('dangote_user_balance_updated', { detail: { balance: sessionUser.balance } }));
          window.dispatchEvent(new CustomEvent('tesla_user_balance_updated', { detail: { balance: sessionUser.balance } }));
        }
      }
    }
  } catch {}
}

/**
 * ADMIN: Reverse a withdrawal payout and refund balance in Firebase Firestore (Alias)
 */
export const adminReverseWithdrawalInFirebase = adminRejectWithdrawalInFirebase;

/**
 * ADMIN: Save updated Platform Settings to Firebase Firestore
 */
export async function adminSavePlatformSettingsInFirebase(
  newSettings: PlatformSettings
): Promise<void> {
  try {
    localStorage.setItem('tesla_platform_settings', JSON.stringify(newSettings));
  } catch {}
  const path = 'system/app_state';
  try {
    await withFirestoreTimeout(
      setDoc(
        doc(db, path),
        {
          platformSettings: newSettings,
          updatedAt: Date.now(),
        },
        { merge: true }
      ),
      2000
    );
  } catch {
    // Saved locally when offline
  }
}

/**
 * ADMIN: Save VIP Products list to Firebase Firestore
 */
export async function adminSaveProductsInFirebase(
  products: VIPProduct[]
): Promise<void> {
  try {
    localStorage.setItem('tesla_products_state', JSON.stringify(products));
  } catch {}
  const path = 'system/app_state';
  try {
    await withFirestoreTimeout(
      setDoc(
        doc(db, path),
        {
          products,
          updatedAt: Date.now(),
        },
        { merge: true }
      ),
      2000
    );
  } catch {
    // Saved locally when offline
  }
}

/**
 * ADMIN: Save Gift Codes list to Firebase Firestore
 */
export async function adminSaveGiftCodesInFirebase(
  giftCodes: GiftCode[]
): Promise<void> {
  try {
    localStorage.setItem('tesla_gift_codes_state', JSON.stringify(giftCodes));
  } catch {}
  const path = 'system/app_state';
  try {
    await withFirestoreTimeout(
      setDoc(
        doc(db, path),
        {
          giftCodes,
          updatedAt: Date.now(),
        },
        { merge: true }
      ),
      2000
    );
  } catch {
    // Saved locally when offline
  }
}

/**
 * Helper to find matching account in local accounts registry by phone, uid, or transaction id
 */
function findMatchingLocalAccountKey(
  targetUid?: string,
  targetPhone?: string,
  transactionId?: string
): string | null {
  try {
    const localAccounts = getLocalAccounts();
    const phoneDigits = targetPhone ? targetPhone.replace(/\D/g, '').slice(-10) : '';
    const uidDigits = targetUid ? targetUid.replace(/\D/g, '').slice(-10) : '';

    if (phoneDigits && localAccounts[phoneDigits]) return phoneDigits;
    if (uidDigits && uidDigits.length >= 8 && localAccounts[uidDigits]) return uidDigits;

    // Search by user id or record id
    for (const [key, acc] of Object.entries(localAccounts)) {
      if (targetUid && acc?.userState?.id === targetUid) return key;
      if (transactionId && acc?.userState?.records?.some((r) => r.id === transactionId)) return key;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * ADMIN: Approve a deposit transaction in Firebase Firestore and automatically credit user balance idempotently
 */
export async function adminApproveDepositInFirebase(
  depositId: string,
  targetUid: string,
  amount: number,
  targetPhone?: string
): Promise<{ success: boolean; message: string }> {
  // 1. Check if deposit was already approved to prevent duplicate credit
  const depDocRef = doc(db, 'deposits', depositId);
  try {
    const depSnap = await getDoc(depDocRef);
    if (depSnap.exists() && depSnap.data()?.status === 'success') {
      console.log(`Deposit #${depositId} is already marked as success. Skipping duplicate credit.`);
      return { success: true, message: `Deposit #${depositId} was already approved.` };
    }
    await setDoc(
      depDocRef,
      {
        status: 'success',
        processedAt: Date.now(),
      },
      { merge: true }
    );
  } catch {
    // Non-blocking fallback
  }

  // 2. Automatically credit user's wallet balance in local accounts registry idempotently
  try {
    const matchedKey = findMatchingLocalAccountKey(targetUid, targetPhone, depositId);
    if (matchedKey) {
      const localAccounts = getLocalAccounts();
      if (localAccounts[matchedKey]) {
        const u = localAccounts[matchedKey].userState;
        const alreadyApproved = (u.records || []).some(
          (r) => (r.id === depositId || (r.type === 'recharge' && r.details?.includes(depositId))) && r.status === 'success'
        );

        if (!alreadyApproved) {
          u.balance = (Number(u.balance) || 0) + amount;
          let found = false;
          u.records = (u.records || []).map((r) => {
            if (r.id === depositId || (r.type === 'recharge' && r.details?.includes(depositId))) {
              found = true;
              return { ...r, status: 'success' as const };
            }
            return r;
          });
          if (!found) {
            u.records.unshift({
              id: depositId,
              type: 'recharge',
              title: 'Deposit Approved',
              amount,
              status: 'success',
              timestamp: Date.now(),
              details: `Approved by Treasury Auditor #${depositId.slice(-6)}`,
            });
          }
          localAccounts[matchedKey].updatedAt = Date.now();
          saveLocalAccounts(localAccounts);
        }
      }
    }
  } catch {
    // local fallback non-blocking
  }

  // 3. Update Firestore user document idempotently
  const resolved = await resolveUserDocRef(targetUid, targetPhone);
  if (resolved) {
    try {
      const uData = resolved.data;
      const alreadyApprovedInCloud = (uData.records || []).some(
        (r) => (r.id === depositId || (r.type === 'recharge' && r.details?.includes(depositId))) && r.status === 'success'
      );

      if (!alreadyApprovedInCloud) {
        const currentBal = Number(uData.balance) || 0;
        const newBal = currentBal + amount;

        let found = false;
        const updatedRecords = (uData.records || []).map((r) => {
          if (r.id === depositId || (r.type === 'recharge' && r.details?.includes(depositId))) {
            found = true;
            return { ...r, status: 'success' as const };
          }
          return r;
        });

        if (!found) {
          updatedRecords.unshift({
            id: depositId,
            type: 'recharge',
            title: 'Deposit Approved',
            amount,
            status: 'success',
            timestamp: Date.now(),
            details: `Approved by Treasury Auditor #${depositId.slice(-6)}`,
          });
        }

        const docIdsToUpdate = new Set<string>();
        if (resolved.docId) docIdsToUpdate.add(resolved.docId);
        const cleanP = cleanNigerianPhoneDigits(targetPhone || targetUid);
        if (cleanP) docIdsToUpdate.add(cleanP);
        if (targetUid) docIdsToUpdate.add(targetUid);

        for (const dId of docIdsToUpdate) {
          try {
            await setDoc(
              doc(db, 'users', dId),
              {
                balance: newBal,
                records: updatedRecords,
                updatedAt: Date.now(),
              },
              { merge: true }
            );
          } catch (err) {
            console.warn(`Firestore deposit approval sync notice for doc ${dId}:`, err);
          }
        }
      }
    } catch (err) {
      console.warn('Firestore deposit approval update notice:', err);
    }
  }

  // 4. Update active session in localStorage if matching current user
  const cleanPhone = cleanNigerianPhoneDigits(targetPhone || targetUid);
  try {
    const sessionRaw = localStorage.getItem('dangote_app_state_v2') || localStorage.getItem('tesla_app_state_v2');
    if (sessionRaw) {
      const sessionUser = JSON.parse(sessionRaw);
      if (cleanPhone && cleanNigerianPhoneDigits(sessionUser.phone) === cleanPhone) {
        const alreadyApprovedInSession = (sessionUser.records || []).some(
          (r: TransactionRecord) => (r.id === depositId || (r.type === 'recharge' && r.details?.includes(depositId))) && r.status === 'success'
        );
        if (!alreadyApprovedInSession) {
          sessionUser.balance = (Number(sessionUser.balance) || 0) + amount;
          let found = false;
          sessionUser.records = (sessionUser.records || []).map((r: TransactionRecord) => {
            if (r.id === depositId || (r.type === 'recharge' && r.details?.includes(depositId))) {
              found = true;
              return { ...r, status: 'success' as const };
            }
            return r;
          });
          if (!found) {
            sessionUser.records.unshift({
              id: depositId,
              type: 'recharge',
              title: 'Deposit Approved',
              amount,
              status: 'success',
              timestamp: Date.now(),
              details: `Approved by Treasury Auditor #${depositId.slice(-6)}`,
            });
          }
          localStorage.setItem('dangote_app_state_v2', JSON.stringify(sessionUser));
          localStorage.setItem('tesla_app_state_v2', JSON.stringify(sessionUser));
          window.dispatchEvent(new CustomEvent('dangote_user_balance_updated', { detail: { balance: sessionUser.balance } }));
          window.dispatchEvent(new CustomEvent('tesla_user_balance_updated', { detail: { balance: sessionUser.balance } }));
          window.dispatchEvent(new CustomEvent('dangote_user_state_updated', { detail: { balance: sessionUser.balance, records: sessionUser.records } }));
          window.dispatchEvent(new CustomEvent('tesla_user_state_updated', { detail: { balance: sessionUser.balance, records: sessionUser.records } }));
        }
      }
    }
  } catch {}

  return { success: true, message: `Deposit #${depositId} approved and credited.` };
}

/**
 * ADMIN: Reject a deposit transaction in Firebase Firestore
 */
export async function adminRejectDepositInFirebase(
  depositId: string,
  targetUid: string,
  reason: string = 'Payment not found in platform bank account',
  targetPhone?: string
): Promise<void> {
  // 1. Update deposit document
  try {
    const depDocRef = doc(db, 'deposits', depositId);
    await setDoc(
      depDocRef,
      {
        status: 'failed',
        rejectedAt: Date.now(),
        rejectedReason: reason,
      },
      { merge: true }
    );
  } catch {
    // Non-blocking fallback
  }

  // 2. Update local registry
  try {
    const matchedKey = findMatchingLocalAccountKey(targetUid, targetPhone, depositId);
    if (matchedKey) {
      const localAccounts = getLocalAccounts();
      if (localAccounts[matchedKey]) {
        const u = localAccounts[matchedKey].userState;
        u.records = (u.records || []).map((r) => {
          if (r.id === depositId || (r.type === 'recharge' && r.details?.includes(depositId))) {
            return {
              ...r,
              status: 'failed' as const,
              details: `${r.details || ''} [Rejected: ${reason}]`,
            };
          }
          return r;
        });
        localAccounts[matchedKey].updatedAt = Date.now();
        saveLocalAccounts(localAccounts);
      }
    }
  } catch {
    // local fallback non-blocking
  }

  // 3. Update user's records to failed in Firestore
  if (targetUid) {
    const path = `users/${targetUid}`;
    try {
      const uRef = doc(db, 'users', targetUid);
      const snap = await getDoc(uRef);
      if (snap.exists()) {
        const uData = snap.data() as UserState;
        const updatedRecords = (uData.records || []).map((r) => {
          if (r.id === depositId || (r.type === 'recharge' && r.details?.includes(depositId))) {
            return {
              ...r,
              status: 'failed' as const,
              details: `${r.details || ''} [Rejected: ${reason}]`,
            };
          }
          return r;
        });

        await updateDoc(uRef, {
          records: updatedRecords,
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      console.warn('Firestore deposit rejection update notice:', err);
    }
  }
}
