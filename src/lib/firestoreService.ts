import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { getLocalAccounts, saveLocalAccounts } from './authService';
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

  // 1. Fetch Users from Firestore on-demand
  try {
    const usersSnap = await getDocs(collection(db, usersPath));
    usersSnap.forEach((d) => {
      const data = d.data() as UserState;
      const userRec: CloudUserRecord = {
        uid: d.id,
        phone: data.phone || 'Unknown Phone',
        balance: Number(data.balance) || 0,
        cumulativeIncome: Number(data.cumulativeIncome) || 0,
        inviteCode: data.inviteCode || 'N/A',
        invitedBy: data.invitedBy || null,
        fundPin: data.fundPin || '123456',
        bankAccount: data.bankAccount || null,
        purchasedProducts: data.purchasedProducts || [],
        teamMembers: data.teamMembers || [],
        records: data.records || [],
        lastCheckInDate: data.lastCheckInDate || null,
      };
      usersList.push(userRec);

      // Collect user withdrawal and recharge records to maps
      if (Array.isArray(data.records)) {
        data.records.forEach((r) => {
          if (r.type === 'withdraw') {
            withdrawalMap.set(r.id, {
              id: r.id,
              userId: d.id,
              userPhone: data.phone || 'User',
              amount: r.amount,
              fee: r.fee || 0,
              status: r.status,
              timestamp: r.timestamp,
              bankAccount: data.bankAccount,
              details: r.details,
            });
          } else if (r.type === 'recharge') {
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
              userId: d.id,
              userPhone: data.phone || 'User',
              amount: r.amount,
              channel: r.title || 'Recharge Channel',
              senderBank,
              payeeName,
              status: r.status,
              timestamp: r.timestamp,
              details: r.details,
            });
          }
        });
      }
    });
  } catch (err) {
    console.warn('Firestore users on-demand fetch notice (using local registry fallback):', err);
  }

  // Merge registered accounts from local registry (ensures zero data loss and offline admin functionality)
  try {
    const localAccounts = getLocalAccounts();
    Object.values(localAccounts).forEach((acc) => {
      const existingUser = usersList.find((u) => u.phone === acc.phone || u.uid === acc.digits);
      if (!existingUser) {
        usersList.push({
          uid: acc.digits,
          phone: acc.phone,
          balance: acc.userState.balance || 0,
          cumulativeIncome: acc.userState.cumulativeIncome || 0,
          inviteCode: acc.userState.inviteCode || 'N/A',
          invitedBy: acc.userState.invitedBy || null,
          fundPin: acc.userState.fundPin || '123456',
          bankAccount: acc.userState.bankAccount || null,
          purchasedProducts: acc.userState.purchasedProducts || [],
          teamMembers: acc.userState.teamMembers || [],
          records: acc.userState.records || [],
          lastCheckInDate: acc.userState.lastCheckInDate || null,
        });
      }

      // Merge records for withdrawals and deposits from local accounts
      if (Array.isArray(acc.userState.records)) {
        acc.userState.records.forEach((r) => {
          if (r.type === 'withdraw' && !withdrawalMap.has(r.id)) {
            withdrawalMap.set(r.id, {
              id: r.id,
              userId: acc.digits,
              userPhone: acc.phone,
              amount: r.amount,
              fee: r.fee || 0,
              status: r.status,
              timestamp: r.timestamp,
              bankAccount: acc.userState.bankAccount,
              details: r.details,
            });
          } else if (r.type === 'recharge' && !depositMap.has(r.id)) {
            let senderBank = 'Bank Transfer';
            let payeeName = acc.phone;
            if (r.details) {
              const match = r.details.match(/From (.*?) \((.*?)\)/);
              if (match) {
                senderBank = match[1];
                payeeName = match[2];
              }
            }
            depositMap.set(r.id, {
              id: r.id,
              userId: acc.digits,
              userPhone: acc.phone,
              amount: r.amount,
              channel: r.title || 'Bank Transfer',
              senderBank,
              payeeName,
              status: r.status,
              timestamp: r.timestamp,
              details: r.details,
            });
          }
        });
      }
    });
  } catch (localErr) {
    console.warn('Local accounts merge notice:', localErr);
  }

  // 2. Fetch Global Withdrawals Collection from Firestore (if populated)
  try {
    const wthSnap = await getDocs(collection(db, withdrawalsPath));
    wthSnap.forEach((d) => {
      const data = d.data() as CloudWithdrawalRecord;
      const matchedUser = usersList.find(
        (u) => (data.userId && u.uid === data.userId) || 
               (data.userPhone && (u.phone === data.userPhone || u.phone.replace(/\D/g, '') === data.userPhone.replace(/\D/g, '')))
      );
      withdrawalMap.set(d.id, {
        id: d.id,
        userId: data.userId || matchedUser?.uid || matchedUser?.phone || 'User',
        userPhone: data.userPhone || matchedUser?.phone || 'User',
        amount: Number(data.amount) || 0,
        fee: Number(data.fee) || 0,
        status: data.status,
        timestamp: data.timestamp || Date.now(),
        bankAccount: data.bankAccount || matchedUser?.bankAccount || null,
        details: data.details,
      });
    });
  } catch {
    // Non-blocking if collection does not yet exist
  }

  // 3. Fetch Global Deposits Collection from Firestore (if populated)
  try {
    const depSnap = await getDocs(collection(db, depositsPath));
    depSnap.forEach((d) => {
      const data = d.data() as CloudDepositRecord;
      depositMap.set(d.id, {
        id: d.id,
        userId: data.userId,
        userPhone: data.userPhone,
        amount: Number(data.amount) || 0,
        channel: data.channel || 'Recharge Channel',
        senderBank: data.senderBank || 'Bank Transfer',
        payeeName: data.payeeName || 'Member',
        receivingBank: data.receivingBank,
        receivingAccount: data.receivingAccount,
        receivingAccountName: data.receivingAccountName,
        status: data.status,
        timestamp: data.timestamp || Date.now(),
        processedAt: data.processedAt,
        rejectedReason: data.rejectedReason,
        details: data.details,
      });
    });
  } catch {
    // Non-blocking if collection does not yet exist
  }

  // 3. Fetch Platform System State from Firestore
  let products = INITIAL_PRODUCTS;
  let giftCodes = INITIAL_GIFT_CODES;
  let platformSettings = INITIAL_PLATFORM_SETTINGS;

  try {
    const sysSnap = await getDoc(doc(db, 'system', 'app_state'));
    if (sysSnap.exists()) {
      const data = sysSnap.data();
      if (Array.isArray(data.products) && data.products.length > 0) {
        products = data.products.map((p: VIPProduct) =>
          p.id === 'vip1' && p.price === 5000
            ? { ...p, price: 4000, dailyIncome: 800, totalIncome: 80000 }
            : p
        );
      }
      if (Array.isArray(data.giftCodes)) {
        giftCodes = data.giftCodes;
      }
      if (data.platformSettings) {
        const s = { ...data.platformSettings };
        if (s.signupBonus === 2300 || s.signupBonus === 500) s.signupBonus = 1500;
        platformSettings = {
          ...INITIAL_PLATFORM_SETTINGS,
          ...s,
        };
      }
    } else {
      // Seed initial document into Firebase if missing
      await setDoc(doc(db, 'system', 'app_state'), {
        products: INITIAL_PRODUCTS,
        giftCodes: INITIAL_GIFT_CODES,
        platformSettings: INITIAL_PLATFORM_SETTINGS,
        updatedAt: Date.now(),
      });
    }
  } catch (err) {
    console.warn('System app_state on-demand fetch notice:', err);
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
          .filter((r) => r.type === 'recharge' && r.status === 'success')
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
 * ADMIN: Update a user's wallet balance directly in Firebase Firestore
 */
export async function adminUpdateUserBalanceInFirebase(
  targetUid: string,
  newBalance: number,
  reason: string = 'Admin Balance Calibration'
): Promise<void> {
  const path = `users/${targetUid}`;
  try {
    const userDocRef = doc(db, 'users', targetUid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      throw new Error(`User ${targetUid} not found in Firebase Firestore.`);
    }

    const currentData = snap.data() as UserState;
    const diff = newBalance - currentData.balance;

    const auditRecord: TransactionRecord = {
      id: `adm_adj_${Date.now()}`,
      type: diff >= 0 ? 'bonus' : 'withdraw',
      title: 'Admin Balance Adjustment',
      amount: Math.abs(diff),
      status: 'success',
      timestamp: Date.now(),
      details: `${reason} (Prev: ₦${currentData.balance.toLocaleString()} → Now: ₦${newBalance.toLocaleString()})`,
    };

    const updatedRecords = [auditRecord, ...(currentData.records || [])];

    await updateDoc(userDocRef, {
      balance: newBalance,
      records: updatedRecords,
      updatedAt: Date.now(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * ADMIN: Grant incentive bonus to a member directly in Firebase Firestore
 */
export async function adminGrantUserBonusInFirebase(
  targetUid: string,
  amount: number,
  reason: string = 'Admin VIP Incentive Grant'
): Promise<void> {
  const path = `users/${targetUid}`;
  try {
    const userDocRef = doc(db, 'users', targetUid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      throw new Error(`User ${targetUid} not found in Firebase.`);
    }

    const currentData = snap.data() as UserState;
    const newBalance = (currentData.balance || 0) + amount;

    const bonusRec: TransactionRecord = {
      id: `adm_bon_${Date.now()}`,
      type: 'bonus',
      title: 'Official Executive Grant',
      amount,
      status: 'success',
      timestamp: Date.now(),
      details: reason,
    };

    await updateDoc(userDocRef, {
      balance: newBalance,
      records: [bonusRec, ...(currentData.records || [])],
      updatedAt: Date.now(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * ADMIN: Reset user's 6-digit withdrawal PIN in Firebase Firestore
 */
export async function adminResetUserPinInFirebase(
  targetUid: string,
  newPin: string
): Promise<void> {
  const path = `users/${targetUid}`;
  try {
    const userDocRef = doc(db, 'users', targetUid);
    await updateDoc(userDocRef, {
      fundPin: newPin,
      updatedAt: Date.now(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * ADMIN: Approve a withdrawal payout in Firebase Firestore
 */
export async function adminApproveWithdrawalInFirebase(
  withdrawalId: string,
  targetUid?: string
): Promise<void> {
  // Update local registry
  if (targetUid) {
    try {
      const cleanDigits = targetUid.replace(/\D/g, '').slice(-10);
      const localAccounts = getLocalAccounts();
      if (localAccounts[cleanDigits]) {
        const u = localAccounts[cleanDigits].userState;
        u.records = (u.records || []).map((r) =>
          r.id === withdrawalId ? { ...r, status: 'success' as const } : r
        );
        saveLocalAccounts(localAccounts);
      }
    } catch {
      // ignore
    }
  }

  // 1. Update global withdrawals collection if document exists
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
  } catch {
    // fallback to user records
  }

  // 2. Update user's records in users collection
  if (targetUid) {
    const path = `users/${targetUid}`;
    try {
      const uRef = doc(db, 'users', targetUid);
      const snap = await getDoc(uRef);
      if (snap.exists()) {
        const uData = snap.data() as UserState;
        const updatedRecords = (uData.records || []).map((r) =>
          r.id === withdrawalId ? { ...r, status: 'success' as const } : r
        );
        await updateDoc(uRef, {
          records: updatedRecords,
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      console.warn('Firestore withdrawal approval notice:', err);
    }
  }
}

/**
 * ADMIN: Reject a withdrawal payout and refund balance in Firebase Firestore
 */
export async function adminRejectWithdrawalInFirebase(
  withdrawalId: string,
  targetUid?: string,
  refundAmount?: number
): Promise<void> {
  // Update local registry
  if (targetUid) {
    try {
      const cleanDigits = targetUid.replace(/\D/g, '').slice(-10);
      const localAccounts = getLocalAccounts();
      if (localAccounts[cleanDigits]) {
        const u = localAccounts[cleanDigits].userState;
        const targetRecord = (u.records || []).find((r) => r.id === withdrawalId);
        const amountToRefund = refundAmount ?? targetRecord?.amount ?? 0;
        const updatedRecords = (u.records || []).map((r) =>
          r.id === withdrawalId ? { ...r, status: 'failed' as const } : r
        );
        const refundRecord: TransactionRecord = {
          id: `ref_${Date.now()}`,
          type: 'bonus',
          title: 'Withdrawal Refund',
          amount: amountToRefund,
          status: 'success',
          timestamp: Date.now(),
          details: `Reversal of rejected withdrawal payout #${withdrawalId.slice(-6)}`,
        };
        u.balance = (u.balance || 0) + amountToRefund;
        u.records = [refundRecord, ...updatedRecords];
        saveLocalAccounts(localAccounts);
      }
    } catch {
      // ignore
    }
  }

  // 1. Update global withdrawals doc
  try {
    const wDocRef = doc(db, 'withdrawals', withdrawalId);
    await setDoc(
      wDocRef,
      {
        status: 'failed',
        rejectedAt: Date.now(),
      },
      { merge: true }
    );
  } catch {
    // fallback
  }

  // 2. Update user document and refund wallet
  if (targetUid) {
    const path = `users/${targetUid}`;
    try {
      const uRef = doc(db, 'users', targetUid);
      const snap = await getDoc(uRef);
      if (snap.exists()) {
        const uData = snap.data() as UserState;
        const targetRecord = (uData.records || []).find((r) => r.id === withdrawalId);
        const amountToRefund = refundAmount ?? targetRecord?.amount ?? 0;

        const updatedRecords = (uData.records || []).map((r) =>
          r.id === withdrawalId ? { ...r, status: 'failed' as const } : r
        );

        const refundRecord: TransactionRecord = {
          id: `ref_${Date.now()}`,
          type: 'bonus',
          title: 'Withdrawal Refund',
          amount: amountToRefund,
          status: 'success',
          timestamp: Date.now(),
          details: `Reversal of rejected withdrawal payout #${withdrawalId.slice(-6)}`,
        };

        await updateDoc(uRef, {
          balance: (uData.balance || 0) + amountToRefund,
          records: [refundRecord, ...updatedRecords],
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      console.warn('Firestore withdrawal rejection notice:', err);
    }
  }
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
  const path = 'system/app_state';
  try {
    await setDoc(
      doc(db, path),
      {
        platformSettings: newSettings,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * ADMIN: Save VIP Products list to Firebase Firestore
 */
export async function adminSaveProductsInFirebase(
  products: VIPProduct[]
): Promise<void> {
  const path = 'system/app_state';
  try {
    await setDoc(
      doc(db, path),
      {
        products,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * ADMIN: Save Gift Codes list to Firebase Firestore
 */
export async function adminSaveGiftCodesInFirebase(
  giftCodes: GiftCode[]
): Promise<void> {
  const path = 'system/app_state';
  try {
    await setDoc(
      doc(db, path),
      {
        giftCodes,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
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
 * ADMIN: Approve a deposit transaction in Firebase Firestore and automatically credit user balance
 */
export async function adminApproveDepositInFirebase(
  depositId: string,
  targetUid: string,
  amount: number,
  targetPhone?: string
): Promise<void> {
  // 1. Update deposit document
  try {
    const depDocRef = doc(db, 'deposits', depositId);
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

  // 2. Automatically credit user's wallet balance in local accounts registry
  try {
    const matchedKey = findMatchingLocalAccountKey(targetUid, targetPhone, depositId);
    if (matchedKey) {
      const localAccounts = getLocalAccounts();
      if (localAccounts[matchedKey]) {
        const u = localAccounts[matchedKey].userState;
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
  } catch {
    // local fallback non-blocking
  }

  // 3. Update Firestore user document if accessible
  if (targetUid) {
    const path = `users/${targetUid}`;
    try {
      const uRef = doc(db, 'users', targetUid);
      const snap = await getDoc(uRef);
      if (snap.exists()) {
        const uData = snap.data() as UserState;
        const currentBal = Number(uData.balance) || 0;
        const newBal = currentBal + amount;

        // Check if record exists in user's records array
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

        await updateDoc(uRef, {
          balance: newBal,
          records: updatedRecords,
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      console.warn('Firestore deposit approval update notice:', err);
    }
  }
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
