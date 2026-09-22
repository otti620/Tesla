import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  Wallet, 
  Car, 
  PlusCircle, 
  MinusCircle,
  RefreshCw,
  Search,
  DollarSign,
  AlertTriangle,
  Gift,
  Settings,
  Bell,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  Building2,
  FileSpreadsheet,
  Check,
  Filter,
  Copy,
  X,
  Phone,
  Database,
  ExternalLink,
  ArrowDownCircle,
  CreditCard,
  RotateCcw,
  Banknote,
  Landmark,
  PackagePlus,
  Sparkles,
  Zap
} from 'lucide-react';
import { UserState, VIPProduct, TransactionRecord, GiftCode, PlatformSettings, TeamMember } from '../types';
import { isWithinWithdrawalHours } from '../utils/withdrawalHours';
import { isAdminUser, cleanNigerianPhoneDigits } from '../utils/adminAuth';
import {
  fetchAdminPlatformDataOnDemand,
  adminUpdateUserBalanceInFirebase,
  adminDeductUserBalanceInFirebase,
  adminGrantUserBonusInFirebase,
  adminResetUserPinInFirebase,
  adminAssignProductToUserInFirebase,
  adminApproveWithdrawalInFirebase,
  adminRejectWithdrawalInFirebase,
  adminApproveDepositInFirebase,
  adminRejectDepositInFirebase,
  adminSavePlatformSettingsInFirebase,
  adminSaveProductsInFirebase,
  adminSaveGiftCodesInFirebase,
  AdminPlatformData,
  CloudUserRecord,
  CloudWithdrawalRecord,
  CloudDepositRecord
} from '../lib/firestoreService';
import {
  adminReassignUserInviter,
  adminAwardTeamCommission,
  fetchUserDownlineTree
} from '../lib/referralService';
import { getDynamicReferralLink } from '../utils/referral';
import { purgeAllMockDataAcrossPlatform } from '../lib/authService';
import { ErrorBoundary } from './ErrorBoundary';

interface AdminPanelScreenProps {
  user: UserState;
  products: VIPProduct[];
  giftCodes: GiftCode[];
  platformSettings: PlatformSettings;
  onBack: () => void;
  onUpdateUserBalance: (newBalance: number) => void;
  onApproveWithdrawal: (recordId: string) => void;
  onRejectWithdrawal: (recordId: string) => void;
  onApproveDeposit?: (depositId: string, userId: string, amount: number) => void;
  onRejectDeposit?: (depositId: string, userId: string) => void;
  onToggleProductStatus: (productId: string) => void;
  onAddManualBonus: (amount: number, reason: string) => void;
  onCreateGiftCode: (code: GiftCode) => void;
  onDeleteGiftCode: (codeStr: string) => void;
  onToggleGiftCode: (codeStr: string) => void;
  onUpdatePlatformSettings: (settings: PlatformSettings) => void;
  onResetUserFundPin: (newPin: string) => void;
  onAdminAssignProduct?: (product: VIPProduct, targetPhone?: string) => void;
}

type AdminTab = 'deposits' | 'withdrawals' | 'overview' | 'users' | 'products' | 'gift_codes' | 'settings';

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({
  user,
  products: fallbackProducts,
  giftCodes: fallbackGiftCodes,
  platformSettings: fallbackSettings,
  onBack,
  onUpdateUserBalance,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onApproveDeposit,
  onRejectDeposit,
  onToggleProductStatus,
  onAddManualBonus,
  onCreateGiftCode,
  onDeleteGiftCode,
  onToggleGiftCode,
  onUpdatePlatformSettings,
  onResetUserFundPin,
  onAdminAssignProduct,
}) => {
  // STRICT ACCESS CHECK: Only 07077599057 and 09011711470 are authorized
  if (!isAdminUser(user.phone)) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Access Denied</h1>
        <p className="text-sm text-neutral-400 max-w-sm mb-6">
          This administration terminal is restricted. You do not have authorization to view or access this console.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-semibold transition cursor-pointer"
        >
          Return to App
        </button>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<AdminTab>('deposits');

  // ON-DEMAND FIREBASE STATE
  const [cloudData, setCloudData] = useState<AdminPlatformData | null>(null);
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(true);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Deposits Filter & Search State
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'success' | 'failed'>('all');
  const [depositSearch, setDepositSearch] = useState('');

  // Withdrawal Filter & Search State
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'success' | 'failed'>('all');
  const [withdrawalSearch, setWithdrawalSearch] = useState('');

  // Overview quick forms
  const [selectedUserForOverride, setSelectedUserForOverride] = useState<string>('primary');
  const [customBalance, setCustomBalance] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusReason, setBonusReason] = useState('Admin VIP Incentive Grant');

  // Gift Code state
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeAmount, setNewCodeAmount] = useState('');
  const [newCodeUses, setNewCodeUses] = useState('100');
  const [newCodeDesc, setNewCodeDesc] = useState('');

  // Settings state
  const [editableSettings, setEditableSettings] = useState<PlatformSettings>(fallbackSettings);

  // User Security State & Actions Modal
  const [selectedUserForAction, setSelectedUserForAction] = useState<CloudUserRecord | null>(null);
  const [actionModalType, setActionModalType] = useState<'balance' | 'deduct' | 'bonus' | 'pin' | 'reassign_inviter' | 'credit_commission' | 'add_product' | null>(null);
  const [modalInputValue, setModalInputValue] = useState('');
  const [modalReasonValue, setModalReasonValue] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [distributeGrantCommission, setDistributeGrantCommission] = useState(false);
  const [commissionTier, setCommissionTier] = useState<1 | 2 | 3>(1);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  // Quick Product Assignment State
  const [quickAssignPhone, setQuickAssignPhone] = useState('');
  const [quickAssignProductId, setQuickAssignProductId] = useState('');

  // Tree Modal Inspector State
  const [treeModalUser, setTreeModalUser] = useState<CloudUserRecord | null>(null);
  const [treeModalData, setTreeModalData] = useState<{
    inviterCode: string | null;
    inviterPhone: string | null;
    level1: TeamMember[];
    level2: TeamMember[];
    level3: TeamMember[];
    totalCommission: number;
  } | null>(null);
  const [treeModalLoading, setTreeModalLoading] = useState(false);

  // Withdrawal Reversal Modal State
  const [reversalModalTarget, setReversalModalTarget] = useState<CloudWithdrawalRecord | null>(null);

  // User Directory Search State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userCategoryFilter, setUserCategoryFilter] = useState<'all' | 'balance' | 'bank' | 'vip'>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Referral Console Quick Target State
  const [quickTargetPhone, setQuickTargetPhone] = useState('');
  const [quickInviterCode, setQuickInviterCode] = useState('');

  // FETCH ADMIN DATA STRICTLY ON DEMAND
  const loadDataOnDemand = async (manualNotice: boolean = false) => {
    setIsLoadingCloud(true);
    setCloudError(null);
    try {
      const data = await fetchAdminPlatformDataOnDemand();
      if (!data.platformSettings.dailyCheckInBonus || data.platformSettings.dailyCheckInBonus === 100) {
        data.platformSettings.dailyCheckInBonus = 10;
      }
      setCloudData(data);
      setEditableSettings(data.platformSettings);
      if (manualNotice) {
        showNotification(`Data refreshed from Firebase at ${new Date(data.lastFetchedAt).toLocaleTimeString()}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Failed to fetch on-demand data from Firebase:', err);
      setCloudError(msg || 'Error fetching Firebase data on demand');
    } finally {
      setIsLoadingCloud(false);
    }
  };

  useEffect(() => {
    loadDataOnDemand(false);
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3800);
  };

  const handleCopyText = (text: string, label: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedText(text);
    showNotification(`Copied ${label}: ${text}`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // ACTIVE DATA RESOLUTION
  const products = cloudData?.products || fallbackProducts;
  const giftCodes = cloudData?.giftCodes || fallbackGiftCodes;
  const platformSettings = cloudData?.platformSettings || fallbackSettings;

  // DEPOSITS RESOLUTION (ON DEMAND FROM FIREBASE)
  const allDeposits: CloudDepositRecord[] = cloudData?.deposits || [];
  const pendingDeposits = allDeposits.filter((d) => d.status === 'pending');
  const approvedDeposits = allDeposits.filter((d) => d.status === 'success');
  const rejectedDeposits = allDeposits.filter((d) => d.status === 'failed');

  const filteredDeposits = allDeposits.filter((d) => {
    if (depositFilter !== 'all' && d.status !== depositFilter) return false;
    if (depositSearch.trim()) {
      const q = depositSearch.trim().toLowerCase();
      const matchId = (d.id || '').toLowerCase().includes(q);
      const matchPhone = (d.userPhone || '').toLowerCase().includes(q);
      const matchBank = (d.senderBank || '').toLowerCase().includes(q);
      const matchPayee = (d.payeeName || '').toLowerCase().includes(q);
      const matchAmt = (d.amount || 0).toString().includes(q);
      const matchDetails = (d.details || '').toLowerCase().includes(q);
      return matchId || matchPhone || matchBank || matchPayee || matchAmt || matchDetails;
    }
    return true;
  });

  const totalPendingDepositsAmount = pendingDeposits.reduce((s, r) => s + r.amount, 0);
  const totalApprovedDepositsAmount = approvedDeposits.reduce((s, r) => s + r.amount, 0);

  // USERS RESOLUTION
  const allUsersList: CloudUserRecord[] = cloudData?.users || [];

  // Robust bank account resolver for any withdrawal record
  const resolveWithdrawalBankAccount = (record: CloudWithdrawalRecord) => {
    if (record.bankAccount?.bankName && record.bankAccount?.accountNumber) {
      return record.bankAccount;
    }
    const recPhoneClean = (record.userPhone || '').replace(/\D/g, '');
    const matchedUser = allUsersList.find(
      (u) =>
        (record.userId && u.uid === record.userId) ||
        (recPhoneClean &&
          ((u.phone || '') === record.userPhone ||
            (u.phone || '').replace(/\D/g, '') === recPhoneClean))
    );
    if (matchedUser?.bankAccount?.bankName && matchedUser?.bankAccount?.accountNumber) {
      return matchedUser.bankAccount;
    }
    if (user.phone === record.userPhone && user.bankAccount?.bankName) {
      return user.bankAccount;
    }
    return null;
  };

  // Comprehensive withdrawal collection: merge Firestore cloud withdrawals and local state
  const withdrawalMap = new Map<string, CloudWithdrawalRecord>();
  (cloudData?.withdrawals || []).forEach((w) => withdrawalMap.set(w.id, w));

  const taxRate = Number(platformSettings?.withdrawalTaxRate) || 0.18;

  (user.records || []).forEach((r) => {
    if (r.type === 'withdraw' && !withdrawalMap.has(r.id)) {
      withdrawalMap.set(r.id, {
        id: r.id,
        userId: user.phone,
        userPhone: user.phone,
        amount: r.amount || 0,
        fee: r.fee ?? (r.amount || 0) * taxRate,
        status: r.status || 'pending',
        timestamp: r.timestamp || Date.now(),
        bankAccount: r.bankAccount || user.bankAccount || null,
        details: r.details,
      });
    }
  });

  const allWithdrawals: CloudWithdrawalRecord[] = Array.from(withdrawalMap.values()).sort(
    (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
  );

  const pendingWithdrawals = allWithdrawals.filter((w) => w.status === 'pending');
  const approvedWithdrawals = allWithdrawals.filter((w) => w.status === 'success');
  const rejectedWithdrawals = allWithdrawals.filter((w) => w.status === 'failed');

  const filteredWithdrawals = allWithdrawals.filter((w) => {
    if (withdrawalFilter !== 'all' && w.status !== withdrawalFilter) return false;
    if (withdrawalSearch.trim()) {
      const q = withdrawalSearch.trim().toLowerCase();
      const matchId = (w.id || '').toLowerCase().includes(q);
      const matchPhone = (w.userPhone || '').toLowerCase().includes(q);
      const matchDetails = (w.details || '').toLowerCase().includes(q);
      const matchAmt = (w.amount ?? 0).toString().includes(q);
      const b = resolveWithdrawalBankAccount(w);
      const matchBank = ((b?.bankName || '')).toLowerCase().includes(q) || 
                        ((b?.accountNumber || '')).includes(q) ||
                        ((b?.accountName || '')).toLowerCase().includes(q);
      return matchId || matchPhone || matchDetails || matchAmt || matchBank;
    }
    return true;
  });

  const totalPendingAmount = pendingWithdrawals.reduce((s, r) => s + (r.amount || 0), 0);
  const totalApprovedAmount = approvedWithdrawals.reduce((s, r) => s + (r.amount || 0), 0);
  const totalRejectedAmount = rejectedWithdrawals.reduce((s, r) => s + (r.amount || 0), 0);
  const totalPendingNetAmount = pendingWithdrawals.reduce((s, r) => {
    const fee = r.fee ?? (r.amount || 0) * taxRate;
    return s + Math.max(0, (r.amount || 0) - fee);
  }, 0);

  const hoursCheck = isWithinWithdrawalHours(
    platformSettings.withdrawalStartHour ?? 9,
    platformSettings.withdrawalEndHour ?? 17
  );

  const filteredUsers = allUsersList.filter((u) => {
    if (userCategoryFilter === 'balance' && (u.balance || 0) <= 0) return false;
    if (userCategoryFilter === 'bank' && !u.bankAccount) return false;
    if (userCategoryFilter === 'vip' && (!u.purchasedProducts || u.purchasedProducts.length === 0)) return false;

    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.trim().toLowerCase();
    const digitsQ = userSearchQuery.replace(/\D/g, '');
    const phoneDigits = (u.phone || '').replace(/\D/g, '');

    const matchPhone = (u.phone || '').toLowerCase().includes(q) || (digitsQ.length >= 2 && phoneDigits.includes(digitsQ));
    const matchInvite = (u.inviteCode || '').toLowerCase().includes(q);
    const matchUid = (u.uid || '').toLowerCase().includes(q);
    const matchBank = (u.bankAccount?.bankName || '').toLowerCase().includes(q) || (u.bankAccount?.accountNumber || '').includes(q);

    return matchPhone || matchInvite || matchUid || matchBank;
  });

  // FIREBASE ACTIONS (EXECUTES ON-DEMAND AND RE-FETCHES)
  const handleApproveWithdrawalPayout = async (withdrawal: CloudWithdrawalRecord) => {
    try {
      setIsLoadingCloud(true);
      await adminApproveWithdrawalInFirebase(
        withdrawal.id,
        withdrawal.userId,
        withdrawal.userPhone
      );
      onApproveWithdrawal(withdrawal.id);
      showNotification(`Withdrawal #${withdrawal.id} marked as APPROVED in Firebase.`);
      await loadDataOnDemand(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Approval failed: ${msg}`);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleConfirmReversalPayout = async (withdrawal: CloudWithdrawalRecord) => {
    try {
      setIsLoadingCloud(true);
      await adminRejectWithdrawalInFirebase(
        withdrawal.id,
        withdrawal.userId || withdrawal.userPhone,
        withdrawal.amount
      );
      onRejectWithdrawal(withdrawal.id);
      showNotification(`Withdrawal #${withdrawal.id} REVERSED. ₦${withdrawal.amount.toLocaleString()} refunded to member's account.`);
      setReversalModalTarget(null);
      await loadDataOnDemand(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Reversal failed: ${msg}`);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleRejectWithdrawalPayout = (withdrawal: CloudWithdrawalRecord) => {
    setReversalModalTarget(withdrawal);
  };

  const handleApproveDepositTransaction = async (deposit: CloudDepositRecord) => {
    try {
      setIsLoadingCloud(true);
      const res = await adminApproveDepositInFirebase(deposit.id, deposit.userId, deposit.amount, deposit.userPhone);
      showNotification(res?.message || `Deposit #${deposit.id} APPROVED! ₦${deposit.amount.toLocaleString()} credited to ${deposit.userPhone}.`);
      await loadDataOnDemand(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Deposit approval failed: ${msg}`);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleRejectDepositTransaction = async (deposit: CloudDepositRecord) => {
    try {
      setIsLoadingCloud(true);
      await adminRejectDepositInFirebase(deposit.id, deposit.userId, 'Payment unverified in platform account', deposit.userPhone);
      if (onRejectDeposit) {
        onRejectDeposit(deposit.id, deposit.userId);
      }
      showNotification(`Deposit #${deposit.id} REJECTED in Firebase.`);
      await loadDataOnDemand(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Deposit rejection failed: ${msg}`);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleExecuteModalAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction || !actionModalType) return;

    setIsActionSubmitting(true);
    try {
      if (actionModalType === 'balance') {
        const val = parseFloat(modalInputValue);
        if (isNaN(val) || val < 0) {
          showNotification('Please enter a valid non-negative balance.');
          return;
        }
        await adminUpdateUserBalanceInFirebase(selectedUserForAction.uid, val, modalReasonValue || 'Admin Balance Calibration', selectedUserForAction.phone);
        showNotification(`Balance for ${selectedUserForAction.phone} updated to ₦${val.toLocaleString()} in Firebase.`);
      } else if (actionModalType === 'deduct') {
        const val = parseFloat(modalInputValue);
        if (isNaN(val) || val <= 0) {
          showNotification('Please enter a valid positive amount to deduct.');
          return;
        }
        await adminDeductUserBalanceInFirebase(selectedUserForAction.uid, val, modalReasonValue || 'Admin Balance Deduction', selectedUserForAction.phone);
        const newBal = Math.max(0, (selectedUserForAction.balance || 0) - val);
        showNotification(`₦${val.toLocaleString()} successfully deducted from ${selectedUserForAction.phone}. New Balance: ₦${newBal.toLocaleString()}`);
      } else if (actionModalType === 'bonus') {
        const val = parseFloat(modalInputValue);
        if (isNaN(val) || val <= 0) {
          showNotification('Please enter a valid positive bonus amount.');
          return;
        }
        await adminGrantUserBonusInFirebase(selectedUserForAction.uid, val, modalReasonValue || 'Admin VIP Grant', selectedUserForAction.phone);
        showNotification(`₦${val.toLocaleString()} bonus granted to ${selectedUserForAction.phone} in Firebase.`);
      } else if (actionModalType === 'pin') {
        const pin = modalInputValue.trim();
        if (pin.length !== 6 || isNaN(Number(pin))) {
          showNotification('PIN must be exactly 6 numeric digits.');
          return;
        }
        await adminResetUserPinInFirebase(selectedUserForAction.uid, pin, selectedUserForAction.phone);
        if (cleanNigerianPhoneDigits(selectedUserForAction.phone) === cleanNigerianPhoneDigits(user.phone)) {
          onResetUserFundPin(pin);
        }
        showNotification(`Fund PIN for ${selectedUserForAction.phone} reset to ${pin} in Firebase.`);
      } else if (actionModalType === 'reassign_inviter') {
        const newInviterCode = modalInputValue.trim().toUpperCase();
        if (!newInviterCode) {
          showNotification('Please provide a target inviter code.');
          return;
        }
        const res = await adminReassignUserInviter(selectedUserForAction.phone, newInviterCode);
        showNotification(res.message);
      } else if (actionModalType === 'credit_commission') {
        const bonusAmt = parseFloat(modalInputValue);
        if (isNaN(bonusAmt) || bonusAmt <= 0) {
          showNotification('Please enter a valid positive commission amount.');
          return;
        }
        const res = await adminAwardTeamCommission(
          selectedUserForAction.phone,
          modalReasonValue || 'Downline Member',
          bonusAmt,
          commissionTier
        );
        showNotification(res.message);
      } else if (actionModalType === 'add_product') {
        const availableProducts = cloudData?.products || fallbackProducts;
        const targetProd = availableProducts.find((p) => p.id === selectedProductId) || availableProducts[0];
        if (!targetProd) {
          showNotification('Please select a valid VIP product to grant.');
          return;
        }

        const res = await adminAssignProductToUserInFirebase(
          selectedUserForAction.uid,
          targetProd,
          selectedUserForAction.phone,
          modalReasonValue || 'Admin VIP Direct Allocation',
          distributeGrantCommission,
          editableSettings
        );

        showNotification(res.message);
      }

      setActionModalType(null);
      setSelectedUserForAction(null);
      setModalInputValue('');
      setModalReasonValue('');
      setSelectedProductId('');
      setDistributeGrantCommission(false);
      await loadDataOnDemand(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Action failed: ${msg}`);
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleQuickAssignProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = cleanNigerianPhoneDigits(quickAssignPhone);
    if (!cleanPhone || cleanPhone.length < 10) {
      showNotification('Please enter a valid 10-11 digit Nigerian phone number.');
      return;
    }
    const availableProducts = cloudData?.products || fallbackProducts;
    const targetProd = availableProducts.find((p) => p.id === quickAssignProductId) || availableProducts[0];
    if (!targetProd) {
      showNotification('Please select a valid VIP product.');
      return;
    }

    setIsActionSubmitting(true);
    try {
      const res = await adminAssignProductToUserInFirebase(
        cleanPhone,
        targetProd,
        quickAssignPhone,
        modalReasonValue || 'Admin Quick Fleet Deployment',
        distributeGrantCommission,
        editableSettings
      );

      showNotification(res.message);
      setQuickAssignPhone('');
      await loadDataOnDemand(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Grant failed: ${msg}`);
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleOpenTreeInspector = async (targetUser: CloudUserRecord) => {
    setTreeModalUser(targetUser);
    setTreeModalLoading(true);
    try {
      const tree = await fetchUserDownlineTree(targetUser.phone);
      setTreeModalData(tree);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Failed to load team tree: ${msg}`);
    } finally {
      setTreeModalLoading(false);
    }
  };

  const handlePurgeMockData = async () => {
    try {
      setIsLoadingCloud(true);
      purgeAllMockDataAcrossPlatform();
      const cleanGiftCodes = giftCodes.filter(
        (gc) => gc.code !== 'TESLA2026' && gc.code !== 'TESLABONUS' && gc.code !== 'CYBERTRUCK'
      );
      await adminSaveGiftCodesInFirebase(cleanGiftCodes);
      showNotification('Successfully purged all mock data across platform!');
      await loadDataOnDemand(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Purge error: ${msg}`);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleOverviewSetBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customBalance);
    if (isNaN(val) || val < 0) {
      showNotification('Enter a valid non-negative balance.');
      return;
    }

    const target = allUsersList.find((u) => u.uid === selectedUserForOverride) || allUsersList[0];
    if (!target) {
      showNotification('No target user found.');
      return;
    }

    try {
      setIsLoadingCloud(true);
      await adminUpdateUserBalanceInFirebase(target.uid, val, 'Overview Panel Override', target.phone);
      if (cleanNigerianPhoneDigits(target.phone) === cleanNigerianPhoneDigits(user.phone)) {
        onUpdateUserBalance(val);
      }
      showNotification(`Balance for ${target.phone} set to ₦${val.toLocaleString()} in Firebase!`);
      setCustomBalance('');
      await loadDataOnDemand(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Error: ${msg}`);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleOverviewGrantBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(bonusAmount);
    if (isNaN(val) || val <= 0) {
      showNotification('Enter a valid bonus amount.');
      return;
    }

    const target = allUsersList.find((u) => u.uid === selectedUserForOverride) || allUsersList[0];
    if (!target) {
      showNotification('No target user found.');
      return;
    }

    try {
      setIsLoadingCloud(true);
      await adminGrantUserBonusInFirebase(target.uid, val, bonusReason || 'Executive Incentive');
      if (target.phone === user.phone) {
        onAddManualBonus(val, bonusReason || 'Executive Incentive');
      }
      showNotification(`₦${val.toLocaleString()} bonus granted to ${target.phone} in Firebase!`);
      setBonusAmount('');
      await loadDataOnDemand(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Error: ${msg}`);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleToggleProductStatusInFirebase = async (prodId: string) => {
    const updated = products.map((p) =>
      p.id === prodId
        ? { ...p, status: (p.status === 'available' ? 'coming_soon' : 'available') as 'available' | 'coming_soon' }
        : p
    );
    try {
      setIsLoadingCloud(true);
      await adminSaveProductsInFirebase(updated);
      onToggleProductStatus(prodId);
      showNotification('Product status updated in Firebase!');
      await loadDataOnDemand(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Firebase error: ${msg}`);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleCreateGiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCodeName.trim().toUpperCase();
    const amt = parseFloat(newCodeAmount);
    const uses = parseInt(newCodeUses, 10) || 50;

    if (!code || isNaN(amt) || amt <= 0) {
      showNotification('Please provide a valid code name and bonus amount.');
      return;
    }

    const newCodeItem: GiftCode = {
      code,
      amount: amt,
      maxUses: uses,
      usedCount: 0,
      description: newCodeDesc || `${code} Promotional Grant`,
      active: true,
    };

    const updated = [newCodeItem, ...giftCodes];
    try {
      setIsLoadingCloud(true);
      await adminSaveGiftCodesInFirebase(updated);
      onCreateGiftCode(newCodeItem);
      showNotification(`Gift code "${code}" created in Firebase!`);
      setNewCodeName('');
      setNewCodeAmount('');
      setNewCodeDesc('');
      await loadDataOnDemand(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Firebase error: ${msg}`);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleToggleGiftCodeInFirebase = async (codeStr: string) => {
    const updated = giftCodes.map((gc) =>
      gc.code === codeStr ? { ...gc, active: !gc.active } : gc
    );
    try {
      setIsLoadingCloud(true);
      await adminSaveGiftCodesInFirebase(updated);
      onToggleGiftCode(codeStr);
      showNotification(`Gift code ${codeStr} updated in Firebase!`);
      await loadDataOnDemand(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Firebase error: ${msg}`);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleDeleteGiftCodeInFirebase = async (codeStr: string) => {
    const updated = giftCodes.filter((gc) => gc.code !== codeStr);
    try {
      setIsLoadingCloud(true);
      await adminSaveGiftCodesInFirebase(updated);
      onDeleteGiftCode(codeStr);
      showNotification(`Gift code ${codeStr} removed from Firebase!`);
      await loadDataOnDemand(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Firebase error: ${msg}`);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleSavePlatformSettingsToFirebase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoadingCloud(true);
      await adminSavePlatformSettingsInFirebase(editableSettings);
      onUpdatePlatformSettings(editableSettings);
      showNotification('Global parameters saved directly to Firebase!');
      await loadDataOnDemand(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Firebase error: ${msg}`);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 font-sans flex flex-col antialiased">
      {/* Top Header Bar */}
      <header className="bg-neutral-900/90 border-b border-neutral-800/80 px-4 sm:px-6 py-4 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Return to User App"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Exit Console</span>
            </button>

            <div className="h-6 w-px bg-neutral-800 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600/15 text-red-500 border border-red-500/30 flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                    Tesla Admin Central
                  </h1>
                  <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    FIREBASE MASTER
                  </span>
                </div>
                <p className="text-xs text-neutral-400 hidden sm:block">
                  On-Demand Cloud Operations • Verified Node: {user.phone}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Last Fetched Status Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs bg-neutral-900 border-neutral-800 text-neutral-300">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[11px]">
                {cloudData ? `Fetched: ${new Date(cloudData.lastFetchedAt).toLocaleTimeString()}` : 'Initializing...'}
              </span>
            </div>

            {/* Withdrawal Window Status Badge */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
              hoursCheck.isAllowed 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span className="font-semibold">
                9:00 AM – 5:00 PM ({hoursCheck.isAllowed ? 'OPEN' : 'CLOSED'})
              </span>
            </div>

            {/* PURGE MOCK DATA BUTTON */}
            <button 
              onClick={handlePurgeMockData}
              disabled={isLoadingCloud}
              className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 transition cursor-pointer font-bold shadow-xs disabled:opacity-50"
              title="Clear all mock data, test team trees, and mock gift codes"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Purge Mock Data</span>
            </button>

            {/* ON-DEMAND REFRESH BUTTON */}
            <button 
              onClick={() => loadDataOnDemand(true)}
              disabled={isLoadingCloud}
              className="text-xs text-white flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 border border-red-500/40 transition cursor-pointer font-bold shadow-xs disabled:opacity-50"
              title="Fetch latest data on demand from Firebase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCloud ? 'animate-spin' : ''}`} />
              <span>{isLoadingCloud ? 'Fetching...' : 'Fetch on Demand'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Cloud Notification Toast/Banner */}
      {successMsg && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 px-6 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Cloud Error Banner */}
      {cloudError && (
        <div className="bg-red-500/15 border-b border-red-500/30 text-red-300 px-6 py-2.5 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>Firebase Query Notice: {cloudError}</span>
          </div>
          <button
            onClick={() => loadDataOnDemand(true)}
            className="px-2.5 py-1 bg-red-600/30 hover:bg-red-600/50 rounded text-[11px] font-bold uppercase transition"
          >
            Retry Fetch
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6">
        {/* Left Desktop Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-2.5 space-y-1 shadow-sm">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Operations (Firebase)
            </div>

            <button
              onClick={() => setActiveTab('deposits')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'deposits'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ArrowDownCircle className="w-4 h-4" />
                <span>Deposits Approval</span>
              </div>
              {pendingDeposits.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'deposits' ? 'bg-white text-emerald-700' : 'bg-emerald-500 text-white animate-pulse'
                }`}>
                  {pendingDeposits.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'withdrawals'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Withdrawals Queue</span>
              </div>
              {pendingWithdrawals.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'withdrawals' ? 'bg-white text-red-600' : 'bg-red-600 text-white'
                }`}>
                  {pendingWithdrawals.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Liquidity &amp; Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Registered Users</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">
                {allUsersList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Fleet VIP Controls</span>
            </button>

            <button
              onClick={() => setActiveTab('gift_codes')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'gift_codes'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Gift className="w-4 h-4" />
                <span>Gift Bonus Codes</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">
                {giftCodes.length}
              </span>
            </button>

            <div className="pt-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              System Control
            </div>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Platform Rules &amp; Hours</span>
            </button>
          </div>

          {/* Quick Info Box in Sidebar */}
          <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-2xl p-4 text-xs space-y-2.5 hidden md:block">
            <div className="flex items-center gap-2 text-neutral-300 font-bold">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Cloud Firestore Status</span>
            </div>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              Data is loaded strictly on demand. No open socket subscriptions or passive background listeners are maintained.
            </p>
            <div className="pt-2 border-t border-neutral-800 text-[10px] text-neutral-400 font-mono">
              Database: <span className="text-emerald-400">(default) • tesla-90</span>
            </div>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="flex-1 min-w-0">
          <ErrorBoundary fallbackTitle="Admin Workspace View Guard" onReset={() => setActiveTab('deposits')}>
          {/* ========================================================================= */}
          {/* TAB: DEPOSITS (ON-DEMAND FIREBASE DEPOSIT APPROVAL QUEUE)                  */}
          {/* ========================================================================= */}
          {activeTab === 'deposits' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header with KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-neutral-400 font-medium">Pending Approvals</div>
                    <div className="text-2xl font-black text-amber-400 mt-1">
                      {pendingDeposits.length}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      ₦ {totalPendingDepositsAmount.toLocaleString()} awaiting audit
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-neutral-400 font-medium">Approved Deposits</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">
                      {approvedDeposits.length}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      ₦ {totalApprovedDepositsAmount.toLocaleString()} credited to wallets
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-neutral-400 font-medium">Rejected / Unverified</div>
                    <div className="text-2xl font-black text-red-400 mt-1">
                      {rejectedDeposits.length}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Disputed or invalid transfers
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Filters & Search Control Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-2xl">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {(['all', 'pending', 'success', 'failed'] as const).map((filterType) => (
                    <button
                      key={filterType}
                      onClick={() => setDepositFilter(filterType)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        depositFilter === filterType
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      {filterType === 'all' && `All (${allDeposits.length})`}
                      {filterType === 'pending' && `Pending (${pendingDeposits.length})`}
                      {filterType === 'success' && `Approved (${approvedDeposits.length})`}
                      {filterType === 'failed' && `Rejected (${rejectedDeposits.length})`}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={depositSearch}
                    onChange={(e) => setDepositSearch(e.target.value)}
                    placeholder="Search Order Ref, Phone, Sender Bank, Payee..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Table / Detailed Cards */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Deposit Verification &amp; Clearance Ledger</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                        NO RECEIPTS REQUIRED
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Users submit their Sender Bank &amp; Payee Name. Match against your bank alerts and click Approve to credit their wallet automatically in Firebase.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-neutral-400">
                    Showing {filteredDeposits.length} record(s)
                  </span>
                </div>

                {filteredDeposits.length === 0 ? (
                  <div className="p-12 text-center">
                    <ArrowDownCircle className="w-10 h-10 text-emerald-500/50 mx-auto mb-2.5" />
                    <p className="text-sm font-bold text-neutral-200">No Deposit Requests Found</p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                      {depositSearch 
                        ? 'No records match your search criteria.' 
                        : 'When users transfer to your receiving bank and submit their Sender Bank & Payee Name, their transaction is logged in Firebase and shows here for instant approval.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-950/60 border-b border-neutral-800 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          <th className="py-3.5 px-4 sm:px-6">Order Ref &amp; Time</th>
                          <th className="py-3.5 px-4">Member Phone</th>
                          <th className="py-3.5 px-4">Amount</th>
                          <th className="py-3.5 px-4">Sender Bank &amp; Payee Name</th>
                          <th className="py-3.5 px-4">Receiving Gateway</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 sm:px-6 text-right">Audit Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60 text-xs">
                        {filteredDeposits.map((record) => {
                          const isPending = record.status === 'pending';

                          return (
                            <tr key={record.id} className="hover:bg-neutral-800/30 transition">
                              <td className="py-4 px-4 sm:px-6 font-mono text-neutral-300">
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{record.id}</span>
                                  <button
                                    onClick={() => handleCopyText(record.id, 'Deposit Ref')}
                                    className="text-neutral-500 hover:text-white p-0.5 cursor-pointer"
                                    title="Copy Ref"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="text-[10px] text-neutral-400 mt-0.5">
                                  {new Date(record.timestamp).toLocaleString()}
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <div className="font-bold text-white">
                                  {record.userPhone || 'Member'}
                                </div>
                                <div className="text-[10px] font-mono text-neutral-500 truncate max-w-[110px]" title={record.userId}>
                                  UID: {record.userId?.slice(0, 10)}...
                                </div>
                              </td>

                              <td className="py-4 px-4 font-black text-emerald-400 font-mono text-sm">
                                ₦ {record.amount.toLocaleString()}
                              </td>

                              {/* Sender Bank & Payee Name Box */}
                              <td className="py-4 px-4">
                                <div className="bg-neutral-950/80 border border-neutral-700/80 rounded-xl p-2.5 space-y-1">
                                  <div className="flex items-center gap-1.5 text-white font-bold">
                                    <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>{record.senderBank || 'Bank Transfer'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]">
                                    <Users className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span>{record.payeeName || 'Unknown Payee'}</span>
                                  </div>
                                  <div className="text-[9px] text-neutral-400 uppercase tracking-wider font-mono">
                                    Match with Bank Credit Alert
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <div className="text-white font-medium">
                                  {record.channel || 'Direct Transfer'}
                                </div>
                                <div className="text-[10px] text-neutral-400 font-mono">
                                  {record.receivingBank || 'Platform Bank'}
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  record.status === 'success' 
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : record.status === 'pending'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                                    : 'bg-red-500/15 text-red-400 border border-red-500/30'
                                }`}>
                                  {record.status === 'success' && <Check className="w-3 h-3" />}
                                  {record.status === 'pending' && <Clock className="w-3 h-3" />}
                                  {record.status === 'failed' && <XCircle className="w-3 h-3" />}
                                  <span>{record.status === 'pending' ? 'Processing' : record.status}</span>
                                </span>
                              </td>

                              <td className="py-4 px-4 sm:px-6 text-right">
                                {isPending ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleApproveDepositTransaction(record)}
                                      disabled={isLoadingCloud}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      title="Confirm alert and credit wallet automatically in Firebase"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Approve</span>
                                    </button>

                                    <button
                                      onClick={() => handleRejectDepositTransaction(record)}
                                      disabled={isLoadingCloud}
                                      className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      title="Reject unverified deposit in Firebase"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Reject</span>
                                    </button>
                                  </div>
                                ) : (
                                  <span className={`text-[11px] font-bold font-mono ${
                                    record.status === 'success' ? 'text-emerald-400' : 'text-neutral-500'
                                  }`}>
                                    {record.status === 'success' ? 'Credited & Closed' : 'Rejected'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: WITHDRAWALS (ON-DEMAND FIREBASE WITHDRAWALS QUEUE)                     */}
          {/* ========================================================================= */}
          {/* TAB: WITHDRAWAL REQUEST AUDIT & DISBURSEMENT                              */}
          {/* ========================================================================= */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-6">
              {/* Header with KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-neutral-400 font-medium">Pending Approvals</div>
                    <div className="text-2xl font-black text-amber-400 mt-1">
                      {pendingWithdrawals.length}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      ₦ {totalPendingAmount.toLocaleString()} gross requested
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-neutral-400 font-medium">Net Payable to Banks</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">
                      ₦ {totalPendingNetAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </div>
                    <div className="text-[11px] text-emerald-400/80 mt-0.5">
                      Net of charges (to transfer)
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <Banknote className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-neutral-400 font-medium">Approved Payouts</div>
                    <div className="text-2xl font-black text-white mt-1">
                      {approvedWithdrawals.length}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      ₦ {totalApprovedAmount.toLocaleString()} disbursed
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-neutral-400 font-medium">Reversed / Refunded</div>
                    <div className="text-2xl font-black text-red-400 mt-1">
                      {rejectedWithdrawals.length}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      ₦ {totalRejectedAmount.toLocaleString()} refunded
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Operating hours alert */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">Daily Banking Processing Window: </span>
                    <span className="text-neutral-300 font-mono">
                      {platformSettings.withdrawalStartHour ?? 9}:00 – {platformSettings.withdrawalEndHour ?? 17}:00
                    </span>
                    <div className="text-[11px] text-neutral-400">
                      Withdrawal fee rate: {((Number(platformSettings?.withdrawalTaxRate) || 0.18) * 100).toFixed(0)}% • Min withdrawal: ₦{Number(platformSettings?.minWithdrawal ?? 800).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    hoursCheck.isAllowed
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${hoursCheck.isAllowed ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                    <span>{hoursCheck.isAllowed ? 'Window Open (Processing Allowed)' : 'Outside Standard Window'}</span>
                  </span>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                  {(['all', 'pending', 'success', 'failed'] as const).map((filterVal) => (
                    <button
                      key={filterVal}
                      onClick={() => setWithdrawalFilter(filterVal)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer shrink-0 ${
                        withdrawalFilter === filterVal
                          ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                      }`}
                    >
                      {filterVal === 'all' ? `All (${allWithdrawals.length})` : 
                       filterVal === 'pending' ? `Pending Audit (${pendingWithdrawals.length})` :
                       filterVal === 'success' ? `Approved (${approvedWithdrawals.length})` : 
                       `Reversed (${rejectedWithdrawals.length})`}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={withdrawalSearch}
                    onChange={(e) => setWithdrawalSearch(e.target.value)}
                    placeholder="Search phone, bank, account, ID..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>

              {/* Ledger Container */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Withdrawal Requests Ledger</h3>
                    <p className="text-xs text-neutral-400">
                      Audit all outgoing requests. Review destination bank accounts, inspect net payout after charges, and approve or reverse.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-neutral-400">
                    Showing {filteredWithdrawals.length} of {allWithdrawals.length} request(s)
                  </span>
                </div>

                {filteredWithdrawals.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto mb-2.5" />
                    <p className="text-sm font-bold text-neutral-200">No Withdrawal Requests Found</p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                      {withdrawalSearch ? 'No records match your search query.' : 'When members submit withdrawal requests, they will appear here for audit, bank verification, approval, or reversal.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-neutral-950/70 border-b border-neutral-800 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                            <th className="py-3.5 px-4">Request ID &amp; Time</th>
                            <th className="py-3.5 px-4 min-w-[240px]">Applicant &amp; Bank Account</th>
                            <th className="py-3.5 px-4">Gross Request</th>
                            <th className="py-3.5 px-4">Fee ({((Number(platformSettings?.withdrawalTaxRate) || 0.18) * 100).toFixed(0)}%)</th>
                            <th className="py-3.5 px-4 min-w-[170px]">Net Payout (Net of Charges)</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4 text-right min-w-[160px]">Audit Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/60 text-xs">
                          {filteredWithdrawals.map((record) => {
                            const fee = record.fee ?? ((record.amount || 0) * (Number(platformSettings?.withdrawalTaxRate) || 0.18));
                            const net = Math.max(0, (record.amount || 0) - fee);
                            const isPending = record.status === 'pending';
                            const isSuccess = record.status === 'success';
                            const isFailed = record.status === 'failed';
                            const bank = resolveWithdrawalBankAccount(record);

                            return (
                              <tr key={record.id} className="hover:bg-neutral-800/30 transition">
                                {/* Request ID & Timestamp */}
                                <td className="py-4 px-4 font-mono text-neutral-300">
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span className="text-xs">{record.id}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(record.id, 'Request ID')}
                                      className="text-neutral-500 hover:text-white p-0.5 cursor-pointer"
                                      title="Copy Request ID"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{new Date(record.timestamp).toLocaleString()}</span>
                                  </div>
                                </td>

                                {/* Member Phone & Destination Bank Details */}
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-1.5 font-semibold text-white">
                                    <Phone className="w-3 h-3 text-neutral-400" />
                                    <span>{record.userPhone || 'Member'}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(record.userPhone || '', 'Phone Number')}
                                      className="text-neutral-500 hover:text-white p-0.5 cursor-pointer"
                                      title="Copy Phone"
                                    >
                                      <Copy className="w-2.5 h-2.5" />
                                    </button>
                                  </div>

                                  {bank ? (
                                    <div className="mt-1.5 bg-neutral-950/90 border border-neutral-800 rounded-xl p-2.5 space-y-1">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-amber-400 flex items-center gap-1">
                                          <Building2 className="w-3 h-3" />
                                          {bank.bankName}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyText(bank.accountNumber, 'Account Number')}
                                          className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1 font-mono transition cursor-pointer"
                                          title="Copy Account Number"
                                        >
                                          <Copy className="w-2.5 h-2.5" />
                                          <span>Copy A/C</span>
                                        </button>
                                      </div>
                                      <div className="font-mono text-sm font-black text-white tracking-wider">
                                        {bank.accountNumber}
                                      </div>
                                      <div className="text-[11px] text-neutral-300 font-medium flex items-center justify-between">
                                        <span className="truncate max-w-[160px]">{bank.accountName}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyText(bank.accountName, 'Beneficiary Name')}
                                          className="text-[10px] text-neutral-500 hover:text-neutral-300 p-0.5 cursor-pointer"
                                          title="Copy Name"
                                        >
                                          <Copy className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-neutral-400 mt-1 font-mono bg-neutral-950/60 p-2 rounded-lg border border-neutral-800/80">
                                      {record.details || 'Bank Transfer Request'}
                                    </div>
                                  )}
                                </td>

                                {/* Gross Requested Amount */}
                                <td className="py-4 px-4 font-bold text-white font-mono text-sm">
                                  ₦ {record.amount.toLocaleString()}
                                </td>

                                {/* Deducted Charges / Fee */}
                                <td className="py-4 px-4 font-mono text-xs">
                                  <div className="text-amber-400 font-semibold">
                                    - ₦ {fee.toLocaleString()}
                                  </div>
                                  <div className="text-[10px] text-neutral-500">
                                    {((Number(platformSettings?.withdrawalTaxRate) || 0.18) * 100).toFixed(0)}% charge
                                  </div>
                                </td>

                                {/* Net Amount Net of Charges */}
                                <td className="py-4 px-4">
                                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5">
                                    <div className="text-[10px] uppercase font-bold text-emerald-300 flex items-center justify-between">
                                      <span>Net To Send:</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(net.toString(), 'Net Amount')}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 flex items-center gap-0.5 font-mono cursor-pointer"
                                        title="Copy Net Amount"
                                      >
                                        <Copy className="w-2.5 h-2.5" />
                                        <span>Copy</span>
                                      </button>
                                    </div>
                                    <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                                      ₦ {net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-[10px] text-neutral-400 mt-0.5">
                                      Net of ₦{fee.toLocaleString()} fee
                                    </div>
                                  </div>
                                </td>

                                {/* Status Badge */}
                                <td className="py-4 px-4">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                    isSuccess 
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : isPending
                                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                                  }`}>
                                    {isSuccess && <Check className="w-3 h-3" />}
                                    {isPending && <Clock className="w-3 h-3" />}
                                    {isFailed && <RotateCcw className="w-3 h-3" />}
                                    <span>{isSuccess ? 'Approved' : isPending ? 'Pending' : 'Reversed'}</span>
                                  </span>
                                </td>

                                {/* Actions: Approval or Reversal */}
                                <td className="py-4 px-4 text-right">
                                  {isPending ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleApproveWithdrawalPayout(record)}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                                        title="Approve and mark as disbursed"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Approve</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleRejectWithdrawalPayout(record)}
                                        className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                                        title="Reverse withdrawal and refund wallet"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Reverse</span>
                                      </button>
                                    </div>
                                  ) : isSuccess ? (
                                    <div className="flex items-center justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleRejectWithdrawalPayout(record)}
                                        className="px-2.5 py-1.5 rounded-lg bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/30 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                                        title="Reverse approval and refund amount back to user's wallet"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Reverse Payout</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="text-[10px] text-red-400 font-semibold italic">
                                        Reversed &amp; Refunded
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveWithdrawalPayout(record)}
                                        className="px-2 py-1 rounded-md bg-neutral-800 hover:bg-emerald-950 text-neutral-300 hover:text-emerald-300 border border-neutral-700 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                        title="Re-approve this payout"
                                      >
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Re-Approve</span>
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile & Tablet Card View */}
                    <div className="block lg:hidden divide-y divide-neutral-800/80">
                      {filteredWithdrawals.map((record) => {
                        const fee = record.fee ?? ((record.amount || 0) * (Number(platformSettings?.withdrawalTaxRate) || 0.18));
                        const net = Math.max(0, (record.amount || 0) - fee);
                        const isPending = record.status === 'pending';
                        const isSuccess = record.status === 'success';
                        const isFailed = record.status === 'failed';
                        const bank = resolveWithdrawalBankAccount(record);

                        return (
                          <div key={record.id} className="p-4 space-y-3">
                            {/* Top row: ID, Status, Timestamp */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-white">{record.id}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(record.id, 'Request ID')}
                                  className="text-neutral-500 hover:text-white p-0.5 cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>

                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isSuccess 
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : isPending
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
                              }`}>
                                {isSuccess && <Check className="w-3 h-3" />}
                                {isPending && <Clock className="w-3 h-3" />}
                                {isFailed && <RotateCcw className="w-3 h-3" />}
                                <span>{isSuccess ? 'Approved' : isPending ? 'Pending' : 'Reversed'}</span>
                              </span>
                            </div>

                            <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                              <span>Applicant: <strong className="text-white font-mono">{record.userPhone}</strong></span>
                              <span>{new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            {/* Bank Details Card */}
                            {bank ? (
                              <div className="bg-neutral-950/90 border border-neutral-800 rounded-xl p-3 space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5" />
                                    {bank.bankName}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(bank.accountNumber, 'Account Number')}
                                    className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1 font-mono transition cursor-pointer"
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                    <span>Copy A/C</span>
                                  </button>
                                </div>
                                <div className="font-mono text-base font-black text-white tracking-wider">
                                  {bank.accountNumber}
                                </div>
                                <div className="text-xs text-neutral-300 font-medium">
                                  {bank.accountName}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-neutral-400 font-mono bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800">
                                {record.details || 'Bank Transfer Request'}
                              </div>
                            )}

                            {/* Financial Breakdown & Net Payout */}
                            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-400">Gross Request:</span>
                                <span className="font-mono font-bold text-white">₦ {record.amount.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-400">Deducted Fee ({((Number(platformSettings?.withdrawalTaxRate) || 0.18) * 100).toFixed(0)}%):</span>
                                <span className="font-mono text-amber-400">- ₦ {fee.toLocaleString()}</span>
                              </div>
                              <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                                <div>
                                  <div className="text-[10px] uppercase font-bold text-emerald-300">Net To Send To Bank:</div>
                                  <div className="text-lg font-black text-emerald-400 font-mono">
                                    ₦ {net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(net.toString(), 'Net Amount')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Net</span>
                                </button>
                              </div>
                            </div>

                            {/* Actions on Mobile */}
                            <div className="pt-1">
                              {isPending ? (
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleApproveWithdrawalPayout(record)}
                                    className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve Payout</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectWithdrawalPayout(record)}
                                    className="py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reverse &amp; Refund</span>
                                  </button>
                                </div>
                              ) : isSuccess ? (
                                <button
                                  type="button"
                                  onClick={() => handleRejectWithdrawalPayout(record)}
                                  className="w-full py-2 rounded-xl bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Reverse Payout &amp; Refund to User</span>
                                </button>
                              ) : (
                                <div className="flex items-center justify-between bg-neutral-950/60 p-2 rounded-xl border border-neutral-800">
                                  <span className="text-xs text-red-400 font-semibold">Reversed &amp; Refunded</span>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveWithdrawalPayout(record)}
                                    className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-emerald-950 text-neutral-300 hover:text-emerald-300 border border-neutral-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Re-Approve</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: OVERVIEW & LIQUIDITY                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Overview KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                  <div className="text-xs uppercase font-bold text-neutral-400">Total User Balances</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    ₦ {cloudData?.stats.totalUserBalances.toLocaleString() || user.balance.toLocaleString()}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">Across all registered members</div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                  <div className="text-xs uppercase font-bold text-neutral-400">Total Registered Users</div>
                  <div className="text-2xl font-black text-blue-400 mt-1">
                    {cloudData?.stats.totalUsersCount ?? allUsersList.length} Accounts
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    Directly in Firebase Firestore
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                  <div className="text-xs uppercase font-bold text-neutral-400">Pending Withdrawals</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {pendingWithdrawals.length}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    ₦ {totalPendingAmount.toLocaleString()} awaiting audit
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                  <div className="text-xs uppercase font-bold text-neutral-400">Active VIP Fleet Nodes</div>
                  <div className="text-2xl font-black text-purple-400 mt-1">
                    {cloudData?.stats.totalActiveVipNodes ?? user.purchasedProducts.length} Nodes
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    Dispatched generators
                  </div>
                </div>
              </div>

              {/* Fast Liquidity Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Balance Override */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Manual Balance Calibration</h3>
                      <p className="text-xs text-neutral-400">Directly updates user balance in Firebase</p>
                    </div>
                  </div>

                  <form onSubmit={handleOverviewSetBalance} className="space-y-3">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Target Member Account</label>
                      <select
                        value={selectedUserForOverride}
                        onChange={(e) => setSelectedUserForOverride(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                      >
                        {allUsersList.map((u) => (
                          <option key={u.uid} value={u.uid}>
                            {u.phone} (Bal: ₦{(u.balance || 0).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-500">₦</span>
                      <input
                        type="number"
                        value={customBalance}
                        onChange={(e) => setCustomBalance(e.target.value)}
                        placeholder="e.g. 250000"
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      {[25000, 50000, 200000, 1000000].map((quick) => (
                        <button
                          key={quick}
                          type="button"
                          onClick={() => setCustomBalance(quick.toString())}
                          className="flex-1 py-1.5 rounded-lg bg-neutral-800 text-[11px] font-bold text-neutral-300 hover:bg-neutral-700 transition cursor-pointer"
                        >
                          ₦{(quick / 1000).toFixed(0)}k
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer shadow-sm"
                    >
                      Update Balance in Firebase
                    </button>
                  </form>
                </div>

                {/* Custom Incentive Bonus */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <PlusCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Credit Executive Bonus</h3>
                      <p className="text-xs text-neutral-400">Issue custom incentive grant directly to Firebase</p>
                    </div>
                  </div>

                  <form onSubmit={handleOverviewGrantBonus} className="space-y-3">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Target Member Account</label>
                      <select
                        value={selectedUserForOverride}
                        onChange={(e) => setSelectedUserForOverride(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                      >
                        {allUsersList.map((u) => (
                          <option key={u.uid} value={u.uid}>
                            {u.phone} (Bal: ₦{(u.balance || 0).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Bonus Amount (₦)</label>
                        <input
                          type="number"
                          value={bonusAmount}
                          onChange={(e) => setBonusAmount(e.target.value)}
                          placeholder="e.g. 10000"
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-hidden focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Reason</label>
                        <input
                          type="text"
                          value={bonusReason}
                          onChange={(e) => setBonusReason(e.target.value)}
                          placeholder="VIP Incentive"
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-hidden focus:border-red-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer shadow-sm"
                    >
                      Credit Bonus in Firebase
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: USERS DIRECTORY (FETCHED ON-DEMAND DIRECTLY FROM FIREBASE)            */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search & Filter Bar */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-red-600/15 text-red-500 border border-red-500/30 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        Registered Users Directory (Firebase)
                      </h3>
                      <p className="text-xs text-neutral-400">
                        {allUsersList.length} accounts found in Firestore. Manage individual balances and security PINs.
                      </p>
                    </div>
                  </div>

                  <span className="text-xs px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono">
                    Showing {filteredUsers.length} of {allUsersList.length}
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search by phone number, invite code, UID, or bank account..."
                    className="w-full bg-neutral-950 border border-neutral-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-red-500 font-mono transition"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 rounded-md transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-[11px] text-neutral-500 font-medium shrink-0 mr-1">Filter:</span>
                  {[
                    { id: 'all', label: `All Accounts (${allUsersList.length})` },
                    { id: 'balance', label: `With Balance > 0 (${allUsersList.filter(u => (u.balance || 0) > 0).length})` },
                    { id: 'bank', label: `With Bank Bound (${allUsersList.filter(u => !!u.bankAccount).length})` },
                    { id: 'vip', label: `With VIP Nodes (${allUsersList.filter(u => (u.purchasedProducts?.length || 0) > 0).length})` },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => setUserCategoryFilter(chip.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        userCategoryFilter === chip.id
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users List Cards */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-neutral-800/60">
                {filteredUsers.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <Search className="w-8 h-8 text-neutral-500 mx-auto" />
                    <h5 className="text-sm font-bold text-white">No accounts found</h5>
                    <p className="text-xs text-neutral-400">
                      No registered user accounts in Firebase match your current filter.
                    </p>
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isRoot = isAdminUser(u.phone);
                    return (
                      <div key={u.uid} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-neutral-800/30 transition">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-neutral-400" />
                              <span>{u.phone}</span>
                            </span>

                            {isRoot && (
                              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                                Admin Account
                              </span>
                            )}

                            <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                              <span>UID: {u.uid.slice(0, 10)}...</span>
                              <button
                                onClick={() => handleCopyText(u.uid, 'Firebase UID')}
                                className="text-neutral-400 hover:text-white p-0.5"
                                title="Copy UID"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
                            <span>
                              Balance: <strong className="text-emerald-400 font-mono">₦{(u.balance || 0).toLocaleString()}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Invite Code: <strong className="text-white font-mono">{u.inviteCode}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Invited By: <strong className="text-amber-300 font-mono">{u.invitedBy || 'Direct (Root)'}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Fund PIN: <strong className="text-white font-mono">{u.fundPin || '123456'}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Downlines: <strong className="text-emerald-300 font-mono">L1: {(u.teamMembers || []).filter(m => m.level === 1).length} | L2: {(u.teamMembers || []).filter(m => m.level === 2).length} | L3: {(u.teamMembers || []).filter(m => m.level === 3).length}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              VIP Nodes: <strong className="text-blue-400">{u.purchasedProducts?.length || 0} active</strong>
                            </span>
                          </div>

                          <div className="text-[11px] text-neutral-400 font-mono flex flex-wrap items-center gap-3">
                            <div>
                              Bank:{' '}
                              {u.bankAccount ? (
                                <span className="text-neutral-200">
                                  {u.bankAccount.bankName} • {u.bankAccount.accountNumber} ({u.bankAccount.accountName})
                                </span>
                              ) : (
                                <span className="text-neutral-500 italic">No bank bound</span>
                              )}
                            </div>
                            <div className="text-neutral-500">
                              Ref Link:{' '}
                              <button
                                type="button"
                                onClick={() => handleCopyText(getDynamicReferralLink(u.inviteCode), 'Referral Link')}
                                className="text-emerald-400 hover:underline cursor-pointer inline-flex items-center gap-1 font-mono text-[10px]"
                              >
                                <span>Copy Link</span>
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons for this specific user */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setSelectedUserForAction(u);
                              setActionModalType('add_product');
                              const prods = cloudData?.products || fallbackProducts;
                              setSelectedProductId(prods[0]?.id || '');
                              setModalReasonValue('Admin VIP Direct Allocation');
                              setDistributeGrantCommission(false);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Add Product</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUserForAction(u);
                              setActionModalType('balance');
                              setModalInputValue(u.balance.toString());
                              setModalReasonValue('Admin Calibration');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>Set Balance</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUserForAction(u);
                              setActionModalType('deduct');
                              setModalInputValue('1000');
                              setModalReasonValue('Executive Debit / Deduction');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                            <span>Deduct Balance</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUserForAction(u);
                              setActionModalType('bonus');
                              setModalInputValue('5000');
                              setModalReasonValue('Special VIP Incentive');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Credit Bonus</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUserForAction(u);
                              setActionModalType('pin');
                              setModalInputValue(u.fundPin || '123456');
                              setModalReasonValue('');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Reset PIN</span>
                          </button>

                          <button
                            onClick={() => handleOpenTreeInspector(u)}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Team Tree</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUserForAction(u);
                              setActionModalType('reassign_inviter');
                              setModalInputValue(u.invitedBy || '');
                              setModalReasonValue('');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Reassign Inviter</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUserForAction(u);
                              setActionModalType('credit_commission');
                              setModalInputValue('1400');
                              setModalReasonValue(`Downline Activation`);
                              setCommissionTier(1);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Award Commission</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Real-Time VIP Product Direct Assignment Console */}
              <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Real-Time VIP Fleet Direct Grant Console
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                          Active Sync
                        </span>
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Manually deploy an active VIP investment package directly to any user account in Firestore and their live session.
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-400">
                    Target: <span className="text-amber-400 font-bold font-mono">Firestore & Live User Store</span>
                  </div>
                </div>

                <form onSubmit={handleQuickAssignProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1 font-semibold">Recipient Phone Number</label>
                    <input
                      type="text"
                      value={quickAssignPhone}
                      onChange={(e) => setQuickAssignPhone(e.target.value)}
                      placeholder="e.g. 07077599057"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1 font-semibold">Select VIP Product Package</label>
                    <select
                      value={quickAssignProductId || (cloudData?.products || fallbackProducts)[0]?.id}
                      onChange={(e) => setQuickAssignProductId(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-amber-500 focus:outline-hidden"
                    >
                      {(cloudData?.products || fallbackProducts).map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.vipLevel} • {prod.title} (₦{prod.price.toLocaleString()} • +₦{prod.dailyIncome.toLocaleString()}/day)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1 font-semibold">Note / Reason</label>
                    <input
                      type="text"
                      value={modalReasonValue}
                      onChange={(e) => setModalReasonValue(e.target.value)}
                      placeholder="e.g. VIP Fleet Grant"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isActionSubmitting}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 disabled:opacity-50"
                  >
                    <PackagePlus className="w-4 h-4" />
                    <span>{isActionSubmitting ? 'Deploying...' : 'Deploy VIP Node to User'}</span>
                  </button>
                </form>
              </div>

              {/* Real Referral & Downline Management Console */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Referral Tree & Downline Control</h4>
                      <p className="text-xs text-neutral-400">Manage upline binding, verify real referral records, and issue commission adjustments</p>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-400">
                    Source of Truth: <span className="text-emerald-400 font-bold">Firebase & Real Registry</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Reassign Inviter Box */}
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                    <h5 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      Bind / Reassign Inviter
                    </h5>
                    <p className="text-[11px] text-neutral-400">
                      Link a member to an upline invite code. This updates their referrer in Firestore and links them into the upline&apos;s multi-tier team tree.
                    </p>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!quickTargetPhone || !quickInviterCode) {
                          showNotification('Please provide both member phone and target invite code.');
                          return;
                        }
                        setIsLoadingCloud(true);
                        try {
                          const res = await adminReassignUserInviter(quickTargetPhone, quickInviterCode.trim().toUpperCase());
                          showNotification(res.message);
                          setQuickTargetPhone('');
                          setQuickInviterCode('');
                          await loadDataOnDemand(false);
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : String(err);
                          showNotification(`Error: ${msg}`);
                        } finally {
                          setIsLoadingCloud(false);
                        }
                      }}
                      className="space-y-2.5"
                    >
                      <input
                        type="text"
                        value={quickTargetPhone}
                        onChange={(e) => setQuickTargetPhone(e.target.value)}
                        placeholder="Member phone (e.g. 08123456789)"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                      <input
                        type="text"
                        value={quickInviterCode}
                        onChange={(e) => setQuickInviterCode(e.target.value.toUpperCase())}
                        placeholder="Target Inviter Code (e.g. P5ZP4S)"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isLoadingCloud}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                      >
                        {isLoadingCloud ? 'Binding...' : 'Bind User to Inviter'}
                      </button>
                    </form>
                  </div>

                  {/* Manual Team Commission Credit Box */}
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                    <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      Award Team Commission
                    </h5>
                    <p className="text-[11px] text-neutral-400">
                      Credit genuine referral income directly to an upline&apos;s wallet balance and record it in their team transaction ledger.
                    </p>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const upline = (form.elements.namedItem('uplinePhone') as HTMLInputElement).value;
                        const amt = parseFloat((form.elements.namedItem('commAmount') as HTMLInputElement).value);
                        const tier = Number((form.elements.namedItem('tierSelect') as HTMLSelectElement).value) as 1 | 2 | 3;
                        const note = (form.elements.namedItem('commNote') as HTMLInputElement).value;

                        if (!upline || isNaN(amt) || amt <= 0) {
                          showNotification('Please enter a valid upline phone and commission amount.');
                          return;
                        }

                        setIsLoadingCloud(true);
                        try {
                          const res = await adminAwardTeamCommission(upline, note || 'Manual downline reward', amt, tier);
                          showNotification(res.message);
                          form.reset();
                          await loadDataOnDemand(false);
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : String(err);
                          showNotification(`Error: ${msg}`);
                        } finally {
                          setIsLoadingCloud(false);
                        }
                      }}
                      className="space-y-2.5"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          name="uplinePhone"
                          type="text"
                          placeholder="Upline Phone Number"
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                          required
                        />
                        <select
                          name="tierSelect"
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-2.5 py-2 text-xs text-white"
                        >
                          <option value={1}>Tier 1 ({platformSettings.level1CommissionPct ?? 25}%)</option>
                          <option value={2}>Tier 2 ({platformSettings.level2CommissionPct ?? 1}%)</option>
                          <option value={3}>Tier 3 ({platformSettings.level3CommissionPct ?? 1}%)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          name="commAmount"
                          type="number"
                          placeholder="Amount (₦)"
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                          required
                        />
                        <input
                          name="commNote"
                          type="text"
                          placeholder="Downline reference note"
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoadingCloud}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                      >
                        {isLoadingCloud ? 'Crediting...' : 'Award Verified Commission'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PRODUCTS (VIP FLEET CONTROLS STORED IN FIREBASE)                     */}
          {/* ========================================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Tesla Fleet VIP Products Management</h3>
                  <p className="text-xs text-neutral-400">
                    Product definitions saved directly to Firebase Firestore system state.
                  </p>
                </div>
                <span className="text-xs font-mono bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full text-neutral-300">
                  {products.length} Vehicles in Catalog
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((prod) => {
                  const isAvailable = prod.status === 'available';

                  return (
                    <div
                      key={prod.id}
                      className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-16 h-14 rounded-xl overflow-hidden bg-neutral-950 shrink-0 border border-neutral-700">
                          <img 
                            src={prod.image} 
                            alt={prod.title} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{prod.vipLevel}</span>
                            <span className="text-[10px] text-neutral-400 px-1.5 py-0.5 bg-neutral-800 rounded">
                              {prod.category}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-neutral-300 truncate max-w-[200px] mt-0.5">
                            {prod.title}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                            ₦ {prod.price.toLocaleString()} • Yield: ₦{prod.dailyIncome.toLocaleString()}/day
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            const target = (cloudData?.users || [])[0];
                            if (target) {
                              setSelectedUserForAction(target);
                              setActionModalType('add_product');
                              setSelectedProductId(prod.id);
                              setModalReasonValue('Admin VIP Fleet Direct Grant');
                            } else {
                              setQuickAssignProductId(prod.id);
                              showNotification(`Selected ${prod.vipLevel}. Enter user phone in Quick Deploy console below or in Users tab.`);
                            }
                          }}
                          className="px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                          title="Grant this VIP product to user"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span className="hidden sm:inline">Grant to User</span>
                        </button>

                        <button
                          onClick={() => handleToggleProductStatusInFirebase(prod.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                            isAvailable
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700'
                          }`}
                        >
                          {isAvailable ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{isAvailable ? 'Active' : 'Locked'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: GIFT CODES (STORED IN FIREBASE)                                      */}
          {/* ========================================================================= */}
          {activeTab === 'gift_codes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create New Gift Code Form */}
                <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Create Gift Code</h3>
                      <p className="text-xs text-neutral-400">Stores voucher in Firebase Firestore</p>
                    </div>
                  </div>

                  <form onSubmit={handleCreateGiftSubmit} className="space-y-3">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Code Voucher Name</label>
                      <input
                        type="text"
                        value={newCodeName}
                        onChange={(e) => setNewCodeName(e.target.value.toUpperCase())}
                        placeholder="e.g. CYBER2026"
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-hidden focus:border-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Bonus Credit (₦)</label>
                      <input
                        type="number"
                        value={newCodeAmount}
                        onChange={(e) => setNewCodeAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Maximum Uses</label>
                      <input
                        type="number"
                        value={newCodeUses}
                        onChange={(e) => setNewCodeUses(e.target.value)}
                        placeholder="100"
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Description / Note</label>
                      <input
                        type="text"
                        value={newCodeDesc}
                        onChange={(e) => setNewCodeDesc(e.target.value)}
                        placeholder="Telegram Official Reward"
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer shadow-sm"
                    >
                      Publish Code to Firebase
                    </button>
                  </form>
                </div>

                {/* Existing Codes List */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Active Promo Gift Codes</h4>
                    <span className="text-xs text-neutral-400">{giftCodes.length} codes listed</span>
                  </div>

                  <div className="space-y-3">
                    {giftCodes.map((gc) => (
                      <div
                        key={gc.code}
                        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-mono font-black text-white">{gc.code}</span>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                              +₦{gc.amount.toLocaleString()}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              gc.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                            }`}>
                              {gc.active ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-400 mt-1">{gc.description}</div>
                          <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                            Claimed: {gc.usedCount} / {gc.maxUses} uses
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleGiftCodeInFirebase(gc.code)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                              gc.active 
                                ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                            }`}
                          >
                            {gc.active ? 'Disable' : 'Enable'}
                          </button>

                          <button
                            onClick={() => handleDeleteGiftCodeInFirebase(gc.code)}
                            className="p-2 text-neutral-500 hover:text-red-400 rounded-xl hover:bg-neutral-800 transition cursor-pointer"
                            title="Delete Code"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: SETTINGS & RULES (STORED DIRECTLY IN FIREBASE)                       */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-400" />
                    <span>Global Platform Financial Parameters &amp; Operating Hours</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Directly updates `system/app_state` in Firebase Firestore.
                  </p>
                </div>

                <form onSubmit={handleSavePlatformSettingsToFirebase} className="space-y-6">
                  {/* Withdrawal Schedule Settings */}
                  <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-white">
                          Daily Withdrawal Processing Schedule
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-400 font-mono">
                        Standard: 9:00 AM – 5:00 PM
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Start Hour (24h clock)</label>
                        <select
                          value={editableSettings.withdrawalStartHour ?? 9}
                          onChange={(e) => setEditableSettings({ ...editableSettings, withdrawalStartHour: parseInt(e.target.value, 10) })}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                        >
                          {Array.from({ length: 24 }).map((_, i) => (
                            <option key={i} value={i}>
                              {i.toString().padStart(2, '0')}:00 ({i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">End Hour (24h clock)</label>
                        <select
                          value={editableSettings.withdrawalEndHour ?? 17}
                          onChange={(e) => setEditableSettings({ ...editableSettings, withdrawalEndHour: parseInt(e.target.value, 10) })}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                        >
                          {Array.from({ length: 24 }).map((_, i) => (
                            <option key={i} value={i}>
                              {i.toString().padStart(2, '0')}:00 ({i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Testing Mode</label>
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editableSettings.allowAdminBypassHours ?? false}
                            onChange={(e) => setEditableSettings({ ...editableSettings, allowAdminBypassHours: e.target.checked })}
                            className="w-4 h-4 rounded text-red-600 focus:ring-0"
                          />
                          <span className="text-xs text-neutral-300">Allow 24/7 testing bypass</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Financial Limits */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Signup Bonus (₦)</label>
                      <input
                        type="number"
                        value={editableSettings.signupBonus}
                        onChange={(e) => setEditableSettings({ ...editableSettings, signupBonus: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Daily Check-In Bonus (₦)</label>
                      <input
                        type="number"
                        value={editableSettings.dailyCheckInBonus}
                        onChange={(e) => setEditableSettings({ ...editableSettings, dailyCheckInBonus: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Withdrawal Tax Rate (%)</label>
                      <input
                        type="number"
                        value={(editableSettings.withdrawalTaxRate * 100).toFixed(0)}
                        onChange={(e) => setEditableSettings({ ...editableSettings, withdrawalTaxRate: (parseFloat(e.target.value) || 0) / 100 })}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Min Withdrawal Limit (₦)</label>
                      <input
                        type="number"
                        value={editableSettings.minWithdrawal}
                        onChange={(e) => setEditableSettings({ ...editableSettings, minWithdrawal: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Multi-tier Referral Commission */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Level 1 Commission (%)</label>
                      <input
                        type="number"
                        value={editableSettings.level1CommissionPct}
                        onChange={(e) => setEditableSettings({ ...editableSettings, level1CommissionPct: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Level 2 Commission (%)</label>
                      <input
                        type="number"
                        value={editableSettings.level2CommissionPct}
                        onChange={(e) => setEditableSettings({ ...editableSettings, level2CommissionPct: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Level 3 Commission (%)</label>
                      <input
                        type="number"
                        value={editableSettings.level3CommissionPct}
                        onChange={(e) => setEditableSettings({ ...editableSettings, level3CommissionPct: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Official Deposit Receiving Account Configuration */}
                  <div className="bg-neutral-950 border border-emerald-900/60 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Official Platform Deposit Receiving Account
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        Displayed on member Recharge & Checkout screen
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Destination Bank Name</label>
                        <input
                          type="text"
                          value={editableSettings.depositBankName ?? 'CARBON'}
                          onChange={(e) => setEditableSettings({ ...editableSettings, depositBankName: e.target.value })}
                          placeholder="e.g. CARBON"
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Account Number</label>
                        <input
                          type="text"
                          value={editableSettings.depositAccountNo ?? '1581957640'}
                          onChange={(e) => setEditableSettings({ ...editableSettings, depositAccountNo: e.target.value })}
                          placeholder="e.g. 1581957640"
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Beneficiary Account Name</label>
                        <input
                          type="text"
                          value={editableSettings.depositAccountName ?? 'LEVIATHAN HYPERMARKET'}
                          onChange={(e) => setEditableSettings({ ...editableSettings, depositAccountName: e.target.value })}
                          placeholder="e.g. LEVIATHAN HYPERMARKET"
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1 font-semibold">Official Telegram Group Link</label>
                      <input
                        type="text"
                        value={editableSettings.telegramGroupLink ?? editableSettings.telegramLink ?? 'https://t.me/teslainvestment456'}
                        onChange={(e) =>
                          setEditableSettings({
                            ...editableSettings,
                            telegramLink: e.target.value,
                            telegramGroupLink: e.target.value,
                          })
                        }
                        placeholder="https://t.me/teslainvestment456"
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-hidden focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1 font-semibold">Customer Service Manager Link</label>
                      <input
                        type="text"
                        value={editableSettings.customerServiceManagerLink ?? 'https://t.me/sallyservice4'}
                        onChange={(e) =>
                          setEditableSettings({
                            ...editableSettings,
                            customerServiceManagerLink: e.target.value,
                            customerServiceUsername: e.target.value.replace(/.*t\.me\//, '').replace('@', ''),
                          })
                        }
                        placeholder="https://t.me/sallyservice4"
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-hidden focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">App Startup Notification Text</label>
                    <textarea
                      rows={3}
                      value={editableSettings.announcementNotice}
                      onChange={(e) => setEditableSettings({ ...editableSettings, announcementNotice: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-red-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-3 rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Parameters Directly to Firebase</span>
                  </button>
                </form>
              </div>
            </div>
          )}
          </ErrorBoundary>
        </main>
      </div>

      {/* USER ACTION MODAL (SET BALANCE / GRANT BONUS / RESET PIN) */}
      {actionModalType && selectedUserForAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-bold">
                  {actionModalType === 'balance' && <Wallet className="w-4 h-4" />}
                  {actionModalType === 'deduct' && <MinusCircle className="w-4 h-4 text-rose-400" />}
                  {actionModalType === 'bonus' && <PlusCircle className="w-4 h-4" />}
                  {actionModalType === 'pin' && <KeyRound className="w-4 h-4" />}
                  {actionModalType === 'reassign_inviter' && <Building2 className="w-4 h-4" />}
                  {actionModalType === 'credit_commission' && <DollarSign className="w-4 h-4" />}
                  {actionModalType === 'add_product' && <Sparkles className="w-4 h-4 text-amber-400" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {actionModalType === 'balance' && 'Update Account Balance'}
                    {actionModalType === 'deduct' && 'Deduct Balance from Member'}
                    {actionModalType === 'bonus' && 'Issue Executive Bonus'}
                    {actionModalType === 'pin' && 'Reset 6-Digit Fund PIN'}
                    {actionModalType === 'reassign_inviter' && 'Reassign Referral Inviter'}
                    {actionModalType === 'credit_commission' && 'Award Team Commission'}
                    {actionModalType === 'add_product' && 'Real-Time Add VIP Product'}
                  </h4>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    User: {selectedUserForAction.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActionModalType(null);
                  setSelectedUserForAction(null);
                }}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteModalAction} className="space-y-3">
              {actionModalType === 'add_product' ? (
                <>
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1 font-semibold">Select VIP Product Package</label>
                    <select
                      value={selectedProductId || (cloudData?.products || fallbackProducts)[0]?.id}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-hidden focus:border-amber-500"
                    >
                      {(cloudData?.products || fallbackProducts).map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.vipLevel} • {prod.title} (₦{prod.price.toLocaleString()} | ₦{prod.dailyIncome.toLocaleString()}/day | {prod.validityDays} Days)
                        </option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const currentProd = (cloudData?.products || fallbackProducts).find(
                      (p) => p.id === (selectedProductId || (cloudData?.products || fallbackProducts)[0]?.id)
                    );
                    if (!currentProd) return null;
                    return (
                      <div className="bg-neutral-950 border border-amber-500/20 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-400">Daily Revenue Yield:</span>
                          <span className="text-emerald-400 font-mono font-bold">+₦{currentProd.dailyIncome.toLocaleString()} / day</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-400">Total Lifecycle Yield:</span>
                          <span className="text-amber-300 font-mono font-bold">₦{currentProd.totalIncome.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-400">Active Cycle Duration:</span>
                          <span className="text-white font-mono">{currentProd.validityDays} Days</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={distributeGrantCommission}
                        onChange={(e) => setDistributeGrantCommission(e.target.checked)}
                        className="w-4 h-4 rounded-sm border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-neutral-300">
                        Distribute 3-Tier Referral Commissions to Upline
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Reason / Note</label>
                    <input
                      type="text"
                      value={modalReasonValue}
                      onChange={(e) => setModalReasonValue(e.target.value)}
                      placeholder="e.g. Executive Promotion Grant"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  {actionModalType === 'credit_commission' && (
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Commission Tier Level</label>
                      <select
                        value={commissionTier}
                        onChange={(e) => setCommissionTier(Number(e.target.value) as 1 | 2 | 3)}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                      >
                        <option value={1}>Tier 1 ({platformSettings.level1CommissionPct ?? 25}%)</option>
                        <option value={2}>Tier 2 ({platformSettings.level2CommissionPct ?? 1}%)</option>
                        <option value={3}>Tier 3 ({platformSettings.level3CommissionPct ?? 1}%)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">
                      {actionModalType === 'balance' && 'New Wallet Balance (₦)'}
                      {actionModalType === 'deduct' && 'Amount to Deduct / Debit (₦)'}
                      {actionModalType === 'bonus' && 'Bonus Credit Amount (₦)'}
                      {actionModalType === 'pin' && 'New 6-Digit Security PIN'}
                      {actionModalType === 'reassign_inviter' && 'New Inviter Code (Upline)'}
                      {actionModalType === 'credit_commission' && 'Commission Bonus Amount (₦)'}
                    </label>
                    <input
                      type={actionModalType === 'reassign_inviter' ? 'text' : actionModalType === 'pin' ? 'text' : 'number'}
                      maxLength={actionModalType === 'pin' ? 6 : undefined}
                      value={modalInputValue}
                      onChange={(e) => setModalInputValue(actionModalType === 'reassign_inviter' ? e.target.value.toUpperCase() : e.target.value)}
                      placeholder={
                        actionModalType === 'pin' 
                          ? '123456' 
                          : actionModalType === 'reassign_inviter' 
                          ? 'e.g. P5ZP4S' 
                          : actionModalType === 'deduct'
                          ? '1000'
                          : '5000'
                      }
                      className={`w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-red-500 ${
                        actionModalType === 'reassign_inviter' ? 'uppercase' : ''
                      }`}
                      required
                    />
                  </div>

                  {actionModalType !== 'pin' && actionModalType !== 'reassign_inviter' && (
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">
                        {actionModalType === 'credit_commission' ? 'Downline Member Phone / Reference' : 'Reason / Reference Note'}
                      </label>
                      <input
                        type="text"
                        value={modalReasonValue}
                        onChange={(e) => setModalReasonValue(e.target.value)}
                        placeholder={actionModalType === 'credit_commission' ? '08123456789' : 'Executive Authorization'}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionModalType(null);
                    setSelectedUserForAction(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionSubmitting}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer ${
                    actionModalType === 'add_product'
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/20'
                      : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  {isActionSubmitting
                    ? 'Saving to Database...'
                    : actionModalType === 'add_product'
                    ? 'Grant VIP Product in Real-Time'
                    : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Tree Inspector Modal */}
      {treeModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Referral Hierarchy & Downlines
                  </h4>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    Member: {treeModalUser.phone} • Code: {treeModalUser.inviteCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setTreeModalUser(null);
                  setTreeModalData(null);
                }}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tree Summary Bar */}
            <div className="grid grid-cols-2 gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-400 block text-[11px]">Upline Inviter:</span>
                <span className="text-amber-300 font-mono font-bold">
                  {treeModalData?.inviterPhone 
                    ? `${treeModalData.inviterPhone} (${treeModalData.inviterCode})`
                    : treeModalData?.inviterCode || 'Direct (Root / None)'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-neutral-400 block text-[11px]">Total Affiliate Income:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  ₦{(treeModalData?.totalCommission || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {treeModalLoading ? (
              <div className="py-8 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                <span>Loading real downlines from database...</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Level 1 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-neutral-300 font-bold border-b border-neutral-800 pb-1">
                    <span className="text-emerald-400">Level 1 Downlines ({platformSettings.level1CommissionPct ?? 25}%)</span>
                    <span className="font-mono text-neutral-400">{treeModalData?.level1?.length || 0} members</span>
                  </div>
                  {(!treeModalData?.level1 || treeModalData.level1.length === 0) ? (
                    <p className="text-[11px] text-neutral-500 italic py-1">No Level 1 members registered yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {treeModalData.level1.map((m) => (
                        <div key={m.id} className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-white">{m.phone}</span>
                            <span className="text-[10px] text-neutral-400 block">Joined: {m.joinDate} • Invested: ₦{(m.invested || 0).toLocaleString()}</span>
                          </div>
                          <div className="text-right font-mono text-emerald-400 font-bold">
                            +₦{(m.commission || 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Level 2 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-neutral-300 font-bold border-b border-neutral-800 pb-1">
                    <span className="text-blue-400">Level 2 Downlines ({platformSettings.level2CommissionPct ?? 1}%)</span>
                    <span className="font-mono text-neutral-400">{treeModalData?.level2?.length || 0} members</span>
                  </div>
                  {(!treeModalData?.level2 || treeModalData.level2.length === 0) ? (
                    <p className="text-[11px] text-neutral-500 italic py-1">No Level 2 members registered yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {treeModalData.level2.map((m) => (
                        <div key={m.id} className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-white">{m.phone}</span>
                            <span className="text-[10px] text-neutral-400 block">Joined: {m.joinDate} • Invested: ₦{(m.invested || 0).toLocaleString()}</span>
                          </div>
                          <div className="text-right font-mono text-blue-400 font-bold">
                            +₦{(m.commission || 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Level 3 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-neutral-300 font-bold border-b border-neutral-800 pb-1">
                    <span className="text-purple-400">Level 3 Downlines ({platformSettings.level3CommissionPct ?? 1}%)</span>
                    <span className="font-mono text-neutral-400">{treeModalData?.level3?.length || 0} members</span>
                  </div>
                  {(!treeModalData?.level3 || treeModalData.level3.length === 0) ? (
                    <p className="text-[11px] text-neutral-500 italic py-1">No Level 3 members registered yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {treeModalData.level3.map((m) => (
                        <div key={m.id} className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-white">{m.phone}</span>
                            <span className="text-[10px] text-neutral-400 block">Joined: {m.joinDate} • Invested: ₦{(m.invested || 0).toLocaleString()}</span>
                          </div>
                          <div className="text-right font-mono text-purple-400 font-bold">
                            +₦{(m.commission || 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setTreeModalUser(null);
                  setTreeModalData(null);
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition cursor-pointer"
              >
                Close Tree Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Reversal Confirmation Modal */}
      {reversalModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Confirm Withdrawal Reversal
                  </h4>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    Request ID: {reversalModalTarget.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReversalModalTarget(null)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-200">
              Reversing this withdrawal will cancel the payout, set status to <span className="font-bold text-red-400">Failed/Reversed</span>, and immediately refund <span className="font-bold text-emerald-400">₦{reversalModalTarget.amount.toLocaleString()}</span> back to the member&apos;s wallet.
            </div>

            {(() => {
              const fee = reversalModalTarget.fee ?? ((reversalModalTarget.amount || 0) * (Number(platformSettings?.withdrawalTaxRate) || 0.18));
              const net = Math.max(0, (reversalModalTarget.amount || 0) - fee);
              const bank = resolveWithdrawalBankAccount(reversalModalTarget);

              return (
                <div className="space-y-3 bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Member Phone:</span>
                    <span className="font-mono font-bold text-white">{reversalModalTarget.userPhone}</span>
                  </div>

                  <div className="py-1 border-b border-neutral-800/60">
                    <div className="text-neutral-400 mb-1 flex items-center justify-between">
                      <span>Destination Bank:</span>
                      {bank && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(bank.accountNumber, 'Account Number')}
                          className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy A/C</span>
                        </button>
                      )}
                    </div>
                    {bank ? (
                      <div className="font-semibold text-white">
                        <div>{bank.bankName} • <span className="font-mono text-amber-300">{bank.accountNumber}</span></div>
                        <div className="text-[11px] text-neutral-300">{bank.accountName}</div>
                      </div>
                    ) : (
                      <div className="text-neutral-300">{reversalModalTarget.details || 'Bank Transfer'}</div>
                    )}
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Gross Request:</span>
                    <span className="font-mono font-bold text-white">₦ {reversalModalTarget.amount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Service Fee:</span>
                    <span className="font-mono text-amber-400">₦ {fee.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Net Transfer (Saved):</span>
                    <span className="font-mono font-bold text-emerald-400">₦ {net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center pt-1 font-bold">
                    <span className="text-white">Total Refund to User:</span>
                    <span className="font-mono text-base text-emerald-400">₦ {reversalModalTarget.amount.toLocaleString()}</span>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReversalModalTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoadingCloud}
                onClick={() => handleConfirmReversalPayout(reversalModalTarget)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoadingCloud ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>{isLoadingCloud ? 'Reversing...' : 'Confirm Reversal & Refund'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
