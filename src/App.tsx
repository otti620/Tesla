import React, { useState, useEffect } from 'react';
import { 
  UserState, 
  TabType, 
  SubScreen, 
  VIPProduct, 
  BankAccount, 
  TransactionRecord,
  CheckoutOrder,
  TeamMember,
  PurchasedProductItem 
} from './types';
import { AuthScreen } from './components/AuthScreen';
import { HomeScreen } from './components/HomeScreen';
import { ProductScreen } from './components/ProductScreen';
import { TeamScreen } from './components/TeamScreen';
import { MineScreen } from './components/MineScreen';
import { BottomNav } from './components/BottomNav';
import { NotifyModal } from './components/NotifyModal';
import { RechargeScreen } from './components/RechargeScreen';
import { WithdrawScreen } from './components/WithdrawScreen';
import { AddBankScreen } from './components/AddBankScreen';
import { CustomerServiceScreen } from './components/CustomerServiceScreen';
import { RecordsModal } from './components/RecordsModal';
import { RedeemGiftModal } from './components/RedeemGiftModal';
import { InfoModals } from './components/InfoModals';
import { CheckoutScreen } from './components/CheckoutScreen';
import { MyStoreScreen } from './components/MyStoreScreen';
import { TeamDetailsScreen } from './components/TeamDetailsScreen';
import { SecurityScreen } from './components/SecurityScreen';
import { AppDownloadScreen } from './components/AppDownloadScreen';
import { AdminPanelScreen } from './components/AdminPanelScreen';
import { INITIAL_PRODUCTS, INITIAL_GIFT_CODES, INITIAL_PLATFORM_SETTINGS } from './data/initialData';
import { GiftCode, PlatformSettings } from './types';
import { isAdminUser } from './utils/adminAuth';
import { 
  auth, 
  db, 
  loginWithPhone, 
  registerWithPhone, 
  logoutUser 
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  loginAccount, 
  registerAccount, 
  directAdminLogin, 
  signOutUser,
  normalizePhone,
  getLocalAccounts,
  saveLocalAccounts,
  generateUniqueInviteCode
} from './lib/authService';
import { extractReferralCodeFromUrl } from './utils/referral';

const STORAGE_KEY = 'tesla_app_state_v2';

const INITIAL_USER: UserState = {
  isLoggedIn: false,
  phone: '',
  balance: 0.0,
  cumulativeIncome: 0.0,
  inviteCode: '',
  bankAccount: null,
  fundPin: '',
  lastCheckInDate: null,
  purchasedProducts: [],
  teamMembers: [],
  records: [],
};

export default function App() {
  const [user, setUser] = useState<UserState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_USER;
  });

  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const [products, setProducts] = useState<VIPProduct[]>(() => {
    try {
      const saved = localStorage.getItem('tesla_products_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: VIPProduct) =>
            p.id === 'vip1' && p.price === 5000
              ? { ...p, price: 4000, dailyIncome: 800, totalIncome: 80000 }
              : p
          );
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_PRODUCTS;
  });
  const [giftCodes, setGiftCodes] = useState<GiftCode[]>(() => {
    try {
      const saved = localStorage.getItem('tesla_gift_codes_state');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_GIFT_CODES;
  });

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => {
    try {
      const saved = localStorage.getItem('tesla_platform_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (parsed.signupBonus === 2300 || parsed.signupBonus === 500) {
            parsed.signupBonus = 1500;
          }
          return { ...INITIAL_PLATFORM_SETTINGS, ...parsed };
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_PLATFORM_SETTINGS;
  });

  const [activeCheckoutOrder, setActiveCheckoutOrder] = useState<CheckoutOrder | null>(null);
  const [showNotifyModal, setShowNotifyModal] = useState<boolean>(true);
  const [showGiftModal, setShowGiftModal] = useState<boolean>(false);
  const [referralCodeFromUrl] = useState<string | null>(() => extractReferralCodeFromUrl());
  const [authMode, setAuthMode] = useState<'login' | 'register'>(() => {
    return extractReferralCodeFromUrl() ? 'register' : 'login';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Notify when dynamic referral link is detected
  useEffect(() => {
    if (referralCodeFromUrl) {
      showToast(`🎁 Referral link detected! Invited by VIP ${referralCodeFromUrl}`);
    }
  }, [referralCodeFromUrl]);

  // Ensure logged-in user always has a valid referral inviteCode
  useEffect(() => {
    if (user.isLoggedIn && (!user.inviteCode || user.inviteCode.trim() === '')) {
      const fallbackCode = generateUniqueInviteCode(user.phone || '00');
      setUser((prev) => ({ ...prev, inviteCode: fallbackCode }));
    }
  }, [user.isLoggedIn, user.inviteCode, user.phone]);

  // Sync with localStorage
  useEffect(() => {
    try {
      if (user.isLoggedIn) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('tesla_products_state', JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('tesla_gift_codes_state', JSON.stringify(giftCodes));
    } catch {
      // ignore
    }
  }, [giftCodes]);

  useEffect(() => {
    try {
      localStorage.setItem('tesla_platform_settings', JSON.stringify(platformSettings));
    } catch {
      // ignore
    }
  }, [platformSettings]);

  // Initial cloud sync from Firestore for system state
  useEffect(() => {
    let isMounted = true;
    const loadSystemFromFirestore = async () => {
      try {
        const docRef = doc(db, 'system', 'app_state');
        const snap = await getDoc(docRef);
        if (snap.exists() && isMounted) {
          const data = snap.data();
          if (data.products) {
            setProducts(data.products.map((p: VIPProduct) =>
              p.id === 'vip1' && p.price === 5000
                ? { ...p, price: 4000, dailyIncome: 800, totalIncome: 80000 }
                : p
            ));
          }
          if (data.giftCodes) setGiftCodes(data.giftCodes);
          if (data.platformSettings) {
            const s = { ...data.platformSettings };
            if (s.signupBonus === 2300 || s.signupBonus === 500) s.signupBonus = 1500;
            setPlatformSettings(s);
          }
        }
      } catch (err) {
        console.warn('Firestore initial system sync notice:', err);
      }
    };
    loadSystemFromFirestore();
    return () => {
      isMounted = false;
    };
  }, []);

  // Firebase Auth State Listener - SYNC IN BACKGROUND WITHOUT LOCKING OUT
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists() && isMounted) {
            const data = snap.data() as UserState;
            setUser((prev) => ({
              ...INITIAL_USER,
              ...prev,
              ...data,
              isLoggedIn: true,
            }));
          } else if (isMounted) {
            // User authenticated in Firebase but doc is pending or in local state
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.isLoggedIn) {
                  await setDoc(userDocRef, { ...parsed, firebaseUid: firebaseUser.uid, updatedAt: Date.now() }, { merge: true });
                }
              } catch {
                // ignore
              }
            }
          }
        } catch (err) {
          console.warn('Firestore user restore notice (retaining local state):', err);
        }
      } else {
        // No active Firebase user - check if local session exists
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.isLoggedIn && isMounted) {
              setUser(parsed);
            }
          } catch {
            // ignore
          }
        }
      }

      if (isMounted) {
        setIsAuthChecking(false);
      }
    });

    // Fallback safety timer: never block user on loading screen
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsAuthChecking(false);
      }
    }, 800);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  // Save changes to Firestore for authenticated user (debounced)
  useEffect(() => {
    if (!user.isLoggedIn || !auth.currentUser) return;

    const timer = setTimeout(async () => {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser!.uid);
        await setDoc(userDocRef, {
          ...user,
          updatedAt: Date.now(),
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore user save notice:', err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [user]);

  // Save system state changes to Firestore (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const docRef = doc(db, 'system', 'app_state');
        await setDoc(docRef, {
          products,
          giftCodes,
          platformSettings,
          updatedAt: Date.now(),
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore system save notice:', err);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [products, giftCodes, platformSettings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Auth Handlers: Multi-Tier Resilient Authentication (Admin Root -> Firebase -> Local Registry)
  const handleLogin = async (phone: string, password: string) => {
    try {
      const authenticatedUser = await loginAccount(phone, password);
      setUser(authenticatedUser);
      setSubScreen(null);
      setCurrentTab('home');
      setShowNotifyModal(true);
      showToast(`Welcome back, ${authenticatedUser.phone}!`);
    } catch (err: any) {
      console.warn('Login error caught in App.tsx:', err);
      throw err;
    }
  };

  const handleRegister = async (phone: string, password: string, inviteCode: string) => {
    try {
      const codeToUse = inviteCode || referralCodeFromUrl || 'P5ZP4S';
      const newUser = await registerAccount(phone, password, codeToUse, platformSettings);
      setUser(newUser);
      setSubScreen(null);
      setCurrentTab('home');
      setShowNotifyModal(true);
      showToast(`Registration successful! ₦${platformSettings.signupBonus.toLocaleString()} welcome bonus credited.`);
    } catch (err: any) {
      console.warn('Registration error caught in App.tsx:', err);
      throw err;
    }
  };

  const handleDirectAdminLogin = (digits: '7077599057' | '9011711470') => {
    const adminUser = directAdminLogin(digits);
    setUser(adminUser);
    setSubScreen(null);
    setCurrentTab('home');
    setShowNotifyModal(true);
    showToast(`Master Admin direct session activated (+234 ${digits})`);
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(INITIAL_USER);
    setSubScreen(null);
    setAuthMode('login');
    showToast('Signed out successfully');
  };

  // Daily Check-In Handler
  const handleDailyCheckIn = () => {
    const today = new Date().toISOString().split('T')[0];
    if (user.lastCheckInDate === today) {
      showToast('You have already checked in today! Come back tomorrow.');
      return;
    }

    const checkInAmount = platformSettings.dailyCheckInBonus;
    const rec: TransactionRecord = {
      id: `chk_${Date.now()}`,
      type: 'bonus',
      title: 'Daily Attendance Reward',
      amount: checkInAmount,
      status: 'success',
      timestamp: Date.now(),
      details: 'Tesla Daily Attendance Verification Grant',
    };

    setUser((prev) => ({
      ...prev,
      balance: prev.balance + checkInAmount,
      lastCheckInDate: today,
      records: [rec, ...prev.records],
    }));

    showToast(`Checked in successfully! +₦${checkInAmount.toLocaleString()} credited to balance.`);
  };

  // Recharge -> Checkout Handlers
  const handleProceedToCheckout = (order: CheckoutOrder) => {
    setActiveCheckoutOrder(order);
    setSubScreen('checkout');
  };

  const handleConfirmCheckoutPayment = async (order: CheckoutOrder, senderBank: string, payeeName: string) => {
    const newRecord: TransactionRecord = {
      id: order.orderNo,
      type: 'recharge',
      title: `${order.channel} Deposit`,
      amount: order.amount,
      status: 'pending', // Marked as processing awaiting admin verification
      timestamp: Date.now(),
      details: `From ${senderBank} (${payeeName}) • Ref: ${order.orderNo}`,
    };

    const updatedRecords = [newRecord, ...user.records];

    setUser((prev) => ({
      ...prev,
      records: updatedRecords,
    }));

    // Update local accounts registry for instant offline & cross-tab availability
    try {
      const cleanDigits = user.phone.replace(/\D/g, '').slice(-10);
      const accounts = getLocalAccounts();
      if (cleanDigits && accounts[cleanDigits]) {
        accounts[cleanDigits].userState.records = updatedRecords;
        accounts[cleanDigits].updatedAt = Date.now();
        saveLocalAccounts(accounts);
      }
    } catch {
      // non-blocking
    }

    // Persist deposit record directly into Firebase Firestore
    try {
      const currentUid = auth.currentUser?.uid || user.id || `anon_${Date.now()}`;
      await setDoc(doc(db, 'deposits', order.orderNo), {
        id: order.orderNo,
        userId: currentUid,
        userPhone: user.phone || '07000000000',
        amount: order.amount,
        channel: order.channel,
        senderBank: senderBank || 'Bank Transfer',
        payeeName: payeeName || 'Unknown Payee',
        receivingBank: order.bankName,
        receivingAccount: order.accountNo,
        receivingAccountName: order.accountName,
        status: 'pending',
        timestamp: Date.now(),
        details: `From ${senderBank} (${payeeName})`,
      });

      if (auth.currentUser?.uid) {
        await setDoc(
          doc(db, 'users', auth.currentUser.uid),
          {
            phone: user.phone,
            records: updatedRecords,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('Could not persist deposit to Firebase:', err);
    }

    showToast(`Payment of ₦${order.amount.toLocaleString()} submitted for clearance!`);
  };

  // Admin deposit approval/rejection callbacks
  const handleAdminApproveDeposit = (depositId: string, targetUid: string, amount: number) => {
    const cleanCurrentPhone = user.phone.replace(/\D/g, '').slice(-10);
    const cleanTargetPhone = (targetUid || '').replace(/\D/g, '').slice(-10);
    const isTargetUser = 
      auth.currentUser?.uid === targetUid ||
      (cleanCurrentPhone && cleanCurrentPhone === cleanTargetPhone) ||
      user.records.some((r) => r.id === depositId);

    if (isTargetUser) {
      setUser((prev) => {
        let found = false;
        const updatedRecords = prev.records.map((r) => {
          if (r.id === depositId) {
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
        return {
          ...prev,
          balance: prev.balance + amount,
          records: updatedRecords,
        };
      });
    }
    showToast(`Deposit #${depositId} approved! ₦${amount.toLocaleString()} credited.`);
  };

  const handleAdminRejectDeposit = (depositId: string, targetUid: string) => {
    const cleanCurrentPhone = user.phone.replace(/\D/g, '').slice(-10);
    const cleanTargetPhone = (targetUid || '').replace(/\D/g, '').slice(-10);
    const isTargetUser = 
      auth.currentUser?.uid === targetUid ||
      (cleanCurrentPhone && cleanCurrentPhone === cleanTargetPhone) ||
      user.records.some((r) => r.id === depositId);

    if (isTargetUser) {
      setUser((prev) => {
        const updatedRecords = prev.records.map((r) =>
          r.id === depositId ? { ...r, status: 'failed' as const } : r
        );
        return {
          ...prev,
          records: updatedRecords,
        };
      });
    }
    showToast(`Deposit #${depositId} marked as rejected.`);
  };

  // Withdraw Handler
  const handleSuccessWithdraw = (amount: number, fee: number) => {
    const newRecord: TransactionRecord = {
      id: `wth_${Date.now()}`,
      type: 'withdraw',
      title: 'Bank Withdrawal Request',
      amount,
      fee,
      status: 'pending',
      timestamp: Date.now(),
      bankAccount: user.bankAccount || null,
      details: user.bankAccount
        ? `${user.bankAccount.bankName} - ${user.bankAccount.accountNumber} (${user.bankAccount.accountName})`
        : 'Bank Transfer',
    };

    const updatedRecords = [newRecord, ...user.records];
    const newBalance = Math.max(0, user.balance - amount);

    setUser((prev) => ({
      ...prev,
      balance: newBalance,
      records: updatedRecords,
    }));

    // Update local accounts registry
    try {
      const cleanDigits = user.phone.replace(/\D/g, '').slice(-10);
      const accounts = getLocalAccounts();
      if (accounts[cleanDigits]) {
        accounts[cleanDigits].userState = {
          ...accounts[cleanDigits].userState,
          balance: newBalance,
          records: updatedRecords,
        };
        saveLocalAccounts(accounts);
      }
    } catch {
      // ignore
    }

    // Immediately persist withdrawal request to Firebase Firestore
    if (auth.currentUser?.uid) {
      const currentUid = auth.currentUser.uid;
      // 1. Write to global withdrawals collection
      setDoc(doc(db, 'withdrawals', newRecord.id), {
        id: newRecord.id,
        userId: currentUid,
        userPhone: user.phone,
        amount,
        fee,
        status: 'pending',
        timestamp: newRecord.timestamp,
        bankAccount: user.bankAccount || null,
        details: newRecord.details,
      }).catch((err) => console.warn('Global withdrawal write notice:', err));

      // 2. Immediately update user document in Firestore
      setDoc(doc(db, 'users', currentUid), {
        ...user,
        balance: newBalance,
        records: updatedRecords,
        updatedAt: Date.now(),
      }, { merge: true }).catch((err) => console.warn('User withdrawal sync notice:', err));
    }

    showToast(`Withdrawal request of ₦ ${amount.toLocaleString()} submitted!`);
  };

  // Product Purchase Handler
  const handleBuyProduct = (product: VIPProduct): boolean => {
    if (user.balance < product.price) return false;

    const purchaseRecord: TransactionRecord = {
      id: `buy_${Date.now()}`,
      type: 'purchase',
      title: `Activated ${product.vipLevel}`,
      amount: product.price,
      status: 'success',
      timestamp: Date.now(),
      details: product.title,
    };

    const newInstance: PurchasedProductItem = {
      instanceId: `inst_${Date.now()}`,
      productId: product.id,
      title: product.title,
      vipLevel: product.vipLevel,
      purchaseDate: Date.now(),
      dailyIncome: product.dailyIncome,
      totalIncome: product.totalIncome,
      validityDays: product.validityDays,
      daysActive: 1,
      image: product.image,
    };

    setUser((prev) => ({
      ...prev,
      balance: prev.balance - product.price,
      purchasedProducts: [...prev.purchasedProducts, newInstance],
      records: [purchaseRecord, ...prev.records],
    }));

    showToast(`${product.vipLevel} activated successfully!`);
    return true;
  };

  // Collect Revenue Handler
  const handleCollectRevenue = () => {
    const totalDaily = user.purchasedProducts.reduce(
      (sum, p) => sum + p.dailyIncome,
      0
    );

    if (totalDaily === 0) {
      showToast('No active power generators yet! Purchase a VIP Node first.');
      return;
    }

    const incomeRecord: TransactionRecord = {
      id: `inc_${Date.now()}`,
      type: 'income',
      title: 'Daily Energy Generation Income',
      amount: totalDaily,
      status: 'success',
      timestamp: Date.now(),
      details: `${user.purchasedProducts.length} Active VIP Node(s)`,
    };

    setUser((prev) => ({
      ...prev,
      balance: prev.balance + totalDaily,
      cumulativeIncome: prev.cumulativeIncome + totalDaily,
      purchasedProducts: prev.purchasedProducts.map((p) => ({
        ...p,
        daysActive: p.daysActive + 1,
      })),
      records: [incomeRecord, ...prev.records],
    }));

    showToast(`Collected +₦ ${totalDaily.toLocaleString()} daily yield!`);
  };

  // Bank Account Save Handler
  const handleSaveBank = (bank: BankAccount) => {
    setUser((prev) => ({ ...prev, bankAccount: bank }));
    showToast(`Bank account bound: ${bank.bankName}`);
  };

  // Security Updates
  const handleUpdatePassword = (_oldPass: string, _newPass: string) => {
    showToast('Login password updated successfully!');
  };

  const handleUpdateFundPin = (newPin: string) => {
    setUser((prev) => ({ ...prev, fundPin: newPin }));
    showToast('Withdrawal Fund PIN updated successfully!');
  };

  // Referral Simulator Handler
  const handleSimulateReferral = (level: 1 | 2 | 3, amount: number) => {
    const rate = level === 1 ? 0.35 : 0.01;
    const commission = amount * rate;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newMember: TeamMember = {
      id: `tm_${Date.now()}`,
      phone: `+234 803***${randomSuffix}`,
      inviteCode: `TSL${randomSuffix}`,
      level,
      joinDate: 'Just now',
      invested: amount,
      commission,
      status: 'active',
    };

    const commRecord: TransactionRecord = {
      id: `comm_${Date.now()}`,
      type: 'commission',
      title: `Level ${level} Referral Commission`,
      amount: commission,
      status: 'success',
      timestamp: Date.now(),
      details: `${(rate * 100).toFixed(0)}% bonus from ${newMember.phone}'s ₦${amount.toLocaleString()} investment`,
    };

    setUser((prev) => ({
      ...prev,
      balance: prev.balance + commission,
      teamMembers: [newMember, ...prev.teamMembers],
      records: [commRecord, ...prev.records],
    }));

    showToast(`Referral simulated! +₦${commission.toLocaleString()} bonus added to balance.`);
  };

  // Gift Code Redeem Handler
  const handleRedeemGift = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    const targetCode = giftCodes.find((gc) => gc.code === trimmed);

    if (!targetCode) {
      return { success: false, message: 'Invalid gift code. Check the code or contact support.' };
    }

    if (!targetCode.active) {
      return { success: false, message: 'This gift promotion is currently inactive or disabled.' };
    }

    if (targetCode.usedCount >= targetCode.maxUses) {
      return { success: false, message: 'This gift code has reached its maximum redemption quota.' };
    }

    const amount = targetCode.amount;
    const rec: TransactionRecord = {
      id: `gift_${Date.now()}`,
      type: 'gift',
      title: `Gift Code Bonus (${targetCode.code})`,
      amount,
      status: 'success',
      timestamp: Date.now(),
      details: targetCode.description || 'Special Community Reward',
    };

    // Increment redemption count
    setGiftCodes((prev) =>
      prev.map((gc) =>
        gc.code === trimmed ? { ...gc, usedCount: gc.usedCount + 1 } : gc
      )
    );

    setUser((prev) => ({
      ...prev,
      balance: prev.balance + amount,
      records: [rec, ...prev.records],
    }));

    return { 
      success: true, 
      amount, 
      message: `Code redeemed! ₦${amount.toLocaleString()} added to your balance.` 
    };
  };

  // Telegram simulation
  const handleOpenTelegram = (channel = 'Tesla Official Telegram') => {
    showToast(`Opening ${channel}...`);
    window.open('https://t.me/tesla', '_blank', 'noopener,noreferrer');
  };

  // Master Admin Handlers
  const handleAdminUpdateBalance = (newBalance: number) => {
    const diff = newBalance - user.balance;
    const rec: TransactionRecord = {
      id: `adm_${Date.now()}`,
      type: diff >= 0 ? 'bonus' : 'purchase',
      title: 'Master Console Liquidity Adjustment',
      amount: Math.abs(diff),
      status: 'success',
      timestamp: Date.now(),
      details: `Balance altered by Administrator to ₦${newBalance.toLocaleString()}`,
    };

    setUser((prev) => ({
      ...prev,
      balance: newBalance,
      records: [rec, ...prev.records],
    }));
    showToast(`Admin: Account balance set to ₦ ${newBalance.toLocaleString()}`);
  };

  const handleAdminApproveWithdrawal = (recordId: string) => {
    setUser((prev) => ({
      ...prev,
      records: prev.records.map((r) =>
        r.id === recordId ? { ...r, status: 'success' } : r
      ),
    }));
    showToast('Admin: Withdrawal approved and marked as Success');
  };

  const handleAdminRejectWithdrawal = (recordId: string) => {
    const targetRecord = user.records.find((r) => r.id === recordId);
    if (!targetRecord) return;
    
    // Only refund if not already marked failed
    const shouldRefund = targetRecord.status !== 'failed';
    const refundAmount = shouldRefund ? targetRecord.amount : 0;

    const refundRec: TransactionRecord | null = shouldRefund ? {
      id: `ref_${Date.now()}`,
      type: 'bonus',
      title: 'Withdrawal Reversal / Refund',
      amount: refundAmount,
      status: 'success',
      timestamp: Date.now(),
      details: `Reversal of withdrawal request #${recordId.slice(-6)}`,
    } : null;

    const updatedRecords = [
      ...(refundRec ? [refundRec] : []),
      ...user.records.map((r) =>
        r.id === recordId ? { ...r, status: 'failed' as const } : r
      ),
    ];
    const newBalance = user.balance + refundAmount;

    setUser((prev) => ({
      ...prev,
      balance: newBalance,
      records: updatedRecords,
    }));

    try {
      const cleanDigits = user.phone.replace(/\D/g, '').slice(-10);
      const accounts = getLocalAccounts();
      if (accounts[cleanDigits]) {
        accounts[cleanDigits].userState = {
          ...accounts[cleanDigits].userState,
          balance: newBalance,
          records: updatedRecords,
        };
        saveLocalAccounts(accounts);
      }
    } catch {
      // ignore
    }

    showToast(shouldRefund ? 'Admin: Withdrawal reversed. ₦' + refundAmount.toLocaleString() + ' refunded to wallet' : 'Admin: Withdrawal status updated to reversed.');
  };

  const handleAdminToggleProductStatus = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, status: p.status === 'available' ? 'coming_soon' : 'available' }
          : p
      )
    );
  };

  const handleAdminAddManualBonus = (amount: number, reason: string) => {
    const bonusRec: TransactionRecord = {
      id: `adm_bonus_${Date.now()}`,
      type: 'bonus',
      title: reason || 'Special Incentive Bonus',
      amount,
      status: 'success',
      timestamp: Date.now(),
      details: 'Credited directly from Master Console',
    };

    setUser((prev) => ({
      ...prev,
      balance: prev.balance + amount,
      records: [bonusRec, ...prev.records],
    }));
    showToast(`Admin: ₦ ${amount.toLocaleString()} bonus credited to member!`);
  };

  const handleAdminCreateGiftCode = (newCode: GiftCode) => {
    setGiftCodes((prev) => [newCode, ...prev.filter((c) => c.code !== newCode.code)]);
  };

  const handleAdminDeleteGiftCode = (codeStr: string) => {
    setGiftCodes((prev) => prev.filter((c) => c.code !== codeStr));
  };

  const handleAdminToggleGiftCode = (codeStr: string) => {
    setGiftCodes((prev) =>
      prev.map((c) => (c.code === codeStr ? { ...c, active: !c.active } : c))
    );
  };

  const handleAdminUpdatePlatformSettings = (newSettings: PlatformSettings) => {
    setPlatformSettings(newSettings);
  };

  const handleAdminResetFundPin = (newPin: string) => {
    setUser((prev) => ({ ...prev, fundPin: newPin }));
  };

  const handleAdminAddSimulatedMember = (phone: string, level: 1 | 2 | 3, invested: number) => {
    const rate = level === 1 
      ? platformSettings.level1CommissionPct / 100 
      : level === 2 
      ? platformSettings.level2CommissionPct / 100 
      : platformSettings.level3CommissionPct / 100;
    
    const commission = invested * rate;
    const cleanDigits = phone.replace(/\D/g, '').slice(-4) || Math.floor(1000 + Math.random() * 9000).toString();
    const newMember: TeamMember = {
      id: `tm_adm_${Date.now()}`,
      phone,
      inviteCode: `TSL${cleanDigits}`,
      level,
      joinDate: 'Just now (Admin injected)',
      invested,
      commission,
      status: 'active',
    };

    const commRecord: TransactionRecord = {
      id: `comm_${Date.now()}`,
      type: 'commission',
      title: `Level ${level} Referral Commission`,
      amount: commission,
      status: 'success',
      timestamp: Date.now(),
      details: `${(rate * 100).toFixed(0)}% commission from ${phone}'s ₦${invested.toLocaleString()} deposit`,
    };

    setUser((prev) => ({
      ...prev,
      balance: prev.balance + commission,
      teamMembers: [newMember, ...prev.teamMembers],
      records: [commRecord, ...prev.records],
    }));
  };

  // If verifying initial auth session and no cached local session
  if (isAuthChecking && !user.isLoggedIn) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <div className="w-10 h-10 border-3 border-white/20 border-t-[#00c269] rounded-full animate-spin" />
        <div className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
          Authenticating with Tesla Cloud...
        </div>
      </div>
    );
  }

  // If user is not logged in, show Auth Screen
  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center">
        <AuthScreen
          mode={authMode}
          onSwitchMode={(mode) => setAuthMode(mode)}
          onLogin={handleLogin}
          onRegister={handleRegister}
          initialInviteCode={referralCodeFromUrl || undefined}
        />
      </div>
    );
  }

  // Render SubScreens
  const renderSubScreen = () => {
    if (subScreen === 'recharge') {
      return (
        <RechargeScreen
          user={user}
          onBack={() => setSubScreen(null)}
          onGoToRecords={() => setSubScreen('records')}
          onProceedToCheckout={handleProceedToCheckout}
        />
      );
    }
    if (subScreen === 'checkout') {
      const fallbackOrder: CheckoutOrder = {
        orderNo: `TSL${Date.now().toString().slice(-8)}`,
        amount: 5000,
        channel: 'Recharge Channel 3',
        bankName: 'Wema Bank (ALAT)',
        accountNo: '0123984712',
        accountName: 'Tesla Clean Energy Limited',
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000,
      };

      return (
        <CheckoutScreen
          order={activeCheckoutOrder || fallbackOrder}
          onBack={() => setSubScreen('recharge')}
          onGoToRecords={() => setSubScreen('records')}
          onConfirmPayment={handleConfirmCheckoutPayment}
        />
      );
    }
    if (subScreen === 'withdraw') {
      return (
        <WithdrawScreen
          user={user}
          onBack={() => setSubScreen(null)}
          onGoToRecords={() => setSubScreen('records')}
          onGoToAddBank={() => setSubScreen('add_bank')}
          onSuccessWithdraw={handleSuccessWithdraw}
          taxRate={platformSettings.withdrawalTaxRate}
          minWithdrawal={platformSettings.minWithdrawal}
          withdrawalStartHour={platformSettings.withdrawalStartHour ?? 9}
          withdrawalEndHour={platformSettings.withdrawalEndHour ?? 17}
          allowAdminBypassHours={platformSettings.allowAdminBypassHours ?? false}
        />
      );
    }
    if (subScreen === 'add_bank') {
      return (
        <AddBankScreen
          currentBank={user.bankAccount}
          onBack={() => setSubScreen(null)}
          onSaveBank={handleSaveBank}
        />
      );
    }
    if (subScreen === 'customer_service') {
      return (
        <CustomerServiceScreen
          onBack={() => setSubScreen(null)}
          onOpenTelegram={handleOpenTelegram}
        />
      );
    }
    if (subScreen === 'records') {
      return (
        <RecordsModal
          records={user.records}
          onBack={() => setSubScreen(null)}
        />
      );
    }
    if (subScreen === 'about') {
      return (
        <InfoModals
          type="about"
          onBack={() => setSubScreen(null)}
        />
      );
    }
    if (subScreen === 'rules') {
      return (
        <InfoModals
          type="rules"
          onBack={() => setSubScreen(null)}
        />
      );
    }
    if (subScreen === 'my_store') {
      return (
        <MyStoreScreen
          user={user}
          onBack={() => setSubScreen(null)}
          onGoToProducts={() => {
            setSubScreen(null);
            setCurrentTab('product');
          }}
          onCollectRevenue={handleCollectRevenue}
        />
      );
    }
    if (subScreen === 'team_details') {
      return (
        <TeamDetailsScreen
          user={user}
          onBack={() => setSubScreen(null)}
          onSimulateReferral={handleSimulateReferral}
        />
      );
    }
    if (subScreen === 'security') {
      return (
        <SecurityScreen
          user={user}
          onBack={() => setSubScreen(null)}
          onUpdatePassword={handleUpdatePassword}
          onUpdateFundPin={handleUpdateFundPin}
        />
      );
    }
    if (subScreen === 'app_download') {
      return (
        <AppDownloadScreen
          onBack={() => setSubScreen(null)}
        />
      );
    }
    if (subScreen === 'admin') {
      if (!isAdminUser(user.phone)) {
        return null;
      }
      return (
        <AdminPanelScreen
          user={user}
          products={products}
          giftCodes={giftCodes}
          platformSettings={platformSettings}
          onBack={() => setSubScreen(null)}
          onUpdateUserBalance={handleAdminUpdateBalance}
          onApproveWithdrawal={handleAdminApproveWithdrawal}
          onRejectWithdrawal={handleAdminRejectWithdrawal}
          onApproveDeposit={handleAdminApproveDeposit}
          onRejectDeposit={handleAdminRejectDeposit}
          onToggleProductStatus={handleAdminToggleProductStatus}
          onAddManualBonus={handleAdminAddManualBonus}
          onCreateGiftCode={handleAdminCreateGiftCode}
          onDeleteGiftCode={handleAdminDeleteGiftCode}
          onToggleGiftCode={handleAdminToggleGiftCode}
          onUpdatePlatformSettings={handleAdminUpdatePlatformSettings}
          onResetUserFundPin={handleAdminResetFundPin}
          onAddSimulatedTeamMember={handleAdminAddSimulatedMember}
        />
      );
    }
    return null;
  };

  // If Admin Panel is requested, enforce strict phone authorization (07077599057 and 09011711470 ONLY)
  if (subScreen === 'admin') {
    if (!isAdminUser(user.phone)) {
      setSubScreen(null);
      return null;
    }
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex flex-col font-sans">
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-white px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md shadow-lg border border-white/10 animate-in fade-in duration-150 text-center max-w-[90vw]">
            {toastMessage}
          </div>
        )}
        <AdminPanelScreen
          user={user}
          products={products}
          giftCodes={giftCodes}
          platformSettings={platformSettings}
          onBack={() => setSubScreen(null)}
          onUpdateUserBalance={handleAdminUpdateBalance}
          onApproveWithdrawal={handleAdminApproveWithdrawal}
          onRejectWithdrawal={handleAdminRejectWithdrawal}
          onApproveDeposit={handleAdminApproveDeposit}
          onRejectDeposit={handleAdminRejectDeposit}
          onToggleProductStatus={handleAdminToggleProductStatus}
          onAddManualBonus={handleAdminAddManualBonus}
          onCreateGiftCode={handleAdminCreateGiftCode}
          onDeleteGiftCode={handleAdminDeleteGiftCode}
          onToggleGiftCode={handleAdminToggleGiftCode}
          onUpdatePlatformSettings={handleAdminUpdatePlatformSettings}
          onResetUserFundPin={handleAdminResetFundPin}
          onAddSimulatedTeamMember={handleAdminAddSimulatedMember}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex justify-center">
      {/* Mobile container centered on desktop */}
      <div className="w-full max-w-md bg-neutral-100 min-h-screen relative shadow-2xl flex flex-col font-sans">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-white px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md shadow-lg border border-white/10 animate-in fade-in duration-150 text-center max-w-[90vw]">
            {toastMessage}
          </div>
        )}

        {/* If a sub-screen is active, render it */}
        {subScreen ? (
          renderSubScreen()
        ) : (
          <main className="flex-1">
            {currentTab === 'home' && (
              <HomeScreen
                user={user}
                onNavigate={(screen) => setSubScreen(screen)}
                onOpenGifts={() => setShowGiftModal(true)}
                onGoToProducts={() => setCurrentTab('product')}
                onOpenNotify={() => setShowNotifyModal(true)}
                onDailyCheckIn={handleDailyCheckIn}
              />
            )}

            {currentTab === 'product' && (
              <ProductScreen
                user={user}
                products={products}
                onBuyProduct={handleBuyProduct}
                onNavigateToRecharge={() => setSubScreen('recharge')}
                onNavigateToMyStore={() => setSubScreen('my_store')}
                onCollectRevenue={handleCollectRevenue}
              />
            )}

            {currentTab === 'team' && (
              <TeamScreen
                user={user}
                onNavigateToTeamDetails={() => setSubScreen('team_details')}
              />
            )}

            {currentTab === 'mine' && (
              <MineScreen
                user={user}
                onNavigate={(screen) => setSubScreen(screen)}
                onOpenGifts={() => setShowGiftModal(true)}
                onSignOut={handleSignOut}
                onGoToProducts={() => setCurrentTab('product')}
              />
            )}

            {/* Bottom Nav Bar */}
            <BottomNav
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setSubScreen(null);
              }}
            />
          </main>
        )}

        {/* NOTIFY Modal (matching screenshot 3) */}
        <NotifyModal
          isOpen={showNotifyModal && !subScreen && currentTab === 'home'}
          onClose={() => setShowNotifyModal(false)}
          onOpenTelegram={() => handleOpenTelegram(platformSettings.telegramLink || 'Tesla Official Telegram Channel')}
          announcementNotice={platformSettings.announcementNotice}
          signupBonus={platformSettings.signupBonus}
          level1CommissionPct={platformSettings.level1CommissionPct}
        />

        {/* Redeem Gift Modal */}
        <RedeemGiftModal
          isOpen={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          onRedeem={handleRedeemGift}
        />
      </div>
    </div>
  );
}
