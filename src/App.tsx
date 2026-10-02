import React, { useState, useEffect, useRef } from 'react';
import { 
  UserState, 
  TabType, 
  SubScreen, 
  VIPProduct, 
  BankAccount, 
  TransactionRecord,
  CheckoutOrder,
  TeamMember,
  PurchasedProductItem,
  NotificationBannerItem
} from './types';
import { AuthScreen } from './components/AuthScreen';
import { HomeScreen } from './components/HomeScreen';
import { ProductScreen } from './components/ProductScreen';
import { TeamScreen } from './components/TeamScreen';
import { MineScreen } from './components/MineScreen';
import { BottomNav } from './components/BottomNav';
import { NotifyModal } from './components/NotifyModal';
import { NotificationBannerQueue } from './components/NotificationBannerQueue';
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
import { PromotersScreen } from './components/PromotersScreen';
import { FlyerModal } from './components/FlyerModal';
import { TemporaryAdministrationLandingScreen } from './components/TemporaryAdministrationLandingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { INITIAL_PRODUCTS, INITIAL_GIFT_CODES, INITIAL_PLATFORM_SETTINGS } from './data/initialData';
import { GiftCode, PlatformSettings } from './types';
import { PromoterMilestone } from './data/promoterTiers';
import { isAdminUser } from './utils/adminAuth';
import { calculateProductMaturity } from './utils/nigerianTime';
import { 
  auth, 
  db, 
  loginWithPhone, 
  registerWithPhone, 
  logoutUser 
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  loginAccount, 
  registerAccount, 
  directAdminLogin, 
  signOutUser,
  normalizePhone,
  getLocalAccounts,
  saveLocalAccounts,
  generateUniqueInviteCode,
  purgeAllMockDataAcrossPlatform,
  findCloudUserByPhoneOrUid
} from './lib/authService';
import { cleanNigerianPhoneDigits } from './utils/adminAuth';
import { extractReferralCodeFromUrl } from './utils/referral';
import { normalizePurchasedProducts, normalizeProductCatalog, getCanonicalProduct, mergePurchasedProducts } from './utils/productUtils';
import { checkWithdrawalEligibility } from './utils/withdrawalEligibility';
import { isWithinWithdrawalHours } from './utils/withdrawalHours';
import { 
  distributeProductPurchaseCommissions, 
  recordNewReferralRegistration 
} from './lib/referralService';
import { saveUserBankAccountInFirebase } from './lib/firestoreService';

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
  claimedPromoterMilestones: [],
};

export default function App() {
  const [user, setUser] = useState<UserState>(() => {
    try {
      purgeAllMockDataAcrossPlatform();
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn) {
          // Purge any lingering mock data from previous sessions
          parsed.teamMembers = (parsed.teamMembers || []).filter(
            (tm: any) =>
              !tm.id?.startsWith('tm_adm_') &&
              !tm.id?.startsWith('sim_') &&
              tm.phone !== '+234 8031122334' &&
              tm.phone !== '+234 8149988776'
          );
          parsed.purchasedProducts = normalizePurchasedProducts(
            (parsed.purchasedProducts || []).filter((p: any) => !p.instanceId?.startsWith('prod_adm_'))
          );
          parsed.records = (parsed.records || []).filter(
            (r: any) =>
              !r.id?.startsWith('rec_adm_grant_') &&
              !r.details?.includes('Pre-seeded') &&
              r.title !== 'Master Admin System Grant'
          );
          if (parsed.bankAccount?.accountName === 'Tesla Energy Master Treasury') {
            parsed.bankAccount = null;
          }
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
          return normalizeProductCatalog(parsed);
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (gc: GiftCode) =>
              gc.code !== 'TESLA2026' && gc.code !== 'TESLABONUS' && gc.code !== 'CYBERTRUCK'
          );
        }
      }
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
          if (parsed.minWithdrawal === 2000 || parsed.minWithdrawal === 2300 || !parsed.minWithdrawal) {
            parsed.minWithdrawal = 800;
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
  const [showFlyerModal, setShowFlyerModal] = useState<boolean>(false);
  const [referralCodeFromUrl] = useState<string | null>(() => extractReferralCodeFromUrl());
  const [authMode, setAuthMode] = useState<'login' | 'register'>(() => {
    return extractReferralCodeFromUrl() ? 'register' : 'login';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [bypassAdminMode, setBypassAdminMode] = useState<boolean>(false);

  // Local state based notification queue
  const [notificationQueue, setNotificationQueue] = useState<NotificationBannerItem[]>([]);
  const isCollectingRevenueRef = useRef<boolean>(false);

  // Local state based notification queue management for mature product revenue
  useEffect(() => {
    if (!user.isLoggedIn || !user.purchasedProducts || user.purchasedProducts.length === 0) {
      setNotificationQueue((prev) => prev.filter((item) => item.id !== 'product_revenue_ready'));
      return;
    }

    const checkRevenueMaturity = () => {
      const now = Date.now();
      let totalClaimable = 0;
      let matureUnitsCount = 0;

      for (const p of user.purchasedProducts) {
        const maturity = calculateProductMaturity(p, now);
        if (maturity.isMature && maturity.claimableYield > 0) {
          totalClaimable += maturity.claimableYield;
          matureUnitsCount += 1;
        }
      }

      if (totalClaimable > 0) {
        const revenueBanner: NotificationBannerItem = {
          id: 'product_revenue_ready',
          type: 'revenue_ready',
          title: 'Daily Product Revenue Ready for Collection!',
          message: `₦ ${totalClaimable.toLocaleString()} generated across ${matureUnitsCount} VIP unit${matureUnitsCount > 1 ? 's' : ''} is mature and ready to claim.`,
          amount: totalClaimable,
          actionLabel: `Claim +₦ ${totalClaimable.toLocaleString()}`,
          secondaryActionLabel: 'View Store',
          badgeText: '12:00 AM Settlement',
          timestamp: Date.now(),
          persistent: true,
          priority: 10,
        };

        setNotificationQueue((prev) => {
          const existingIdx = prev.findIndex((item) => item.id === 'product_revenue_ready');
          if (existingIdx >= 0) {
            const existing = prev[existingIdx];
            if (existing.amount === totalClaimable && existing.message === revenueBanner.message) {
              return prev;
            }
            const updated = [...prev];
            updated[existingIdx] = revenueBanner;
            return updated;
          }
          return [revenueBanner, ...prev];
        });
      } else {
        setNotificationQueue((prev) => prev.filter((item) => item.id !== 'product_revenue_ready'));
      }
    };

    checkRevenueMaturity();
    const interval = setInterval(checkRevenueMaturity, 2000);
    return () => clearInterval(interval);
  }, [user.isLoggedIn, user.purchasedProducts]);

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
            setProducts(normalizeProductCatalog(data.products));
          }
          if (data.giftCodes) setGiftCodes(data.giftCodes);
          if (data.platformSettings) {
            const s = { ...data.platformSettings };
            if (s.signupBonus === 2300 || s.signupBonus === 500) s.signupBonus = 1500;
            if (s.minWithdrawal === 2000 || s.minWithdrawal === 2300 || !s.minWithdrawal) s.minWithdrawal = 800;
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

  // Centralized robust persistence helper: synchronizes across active local session, accounts registry, and all Firestore doc aliases
  const syncUserToFirestoreAndLocal = async (updatedUser: UserState) => {
    const cleanDigits = cleanNigerianPhoneDigits(updatedUser.phone);
    const now = Date.now();

    // 1. Update localStorage active session
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      localStorage.setItem('tesla_app_state_v2', JSON.stringify(updatedUser));
    } catch {}

    // 2. Update local accounts registry
    try {
      const accounts = getLocalAccounts();
      const matchedKey = Object.keys(accounts).find(
        (k) => k === cleanDigits || cleanNigerianPhoneDigits(accounts[k].phone) === cleanDigits
      );
      if (matchedKey && accounts[matchedKey]) {
        accounts[matchedKey].userState = updatedUser;
        accounts[matchedKey].updatedAt = now;
        saveLocalAccounts(accounts);
      }
    } catch {}

    // 3. Update all Firestore document aliases (UID doc, phone digits doc, direct user ID)
    const docIdsToUpdate = new Set<string>();
    if (auth.currentUser?.uid) docIdsToUpdate.add(auth.currentUser.uid);
    if (cleanDigits) docIdsToUpdate.add(cleanDigits);
    if (updatedUser.id) docIdsToUpdate.add(updatedUser.id);

    for (const dId of docIdsToUpdate) {
      try {
        await setDoc(
          doc(db, 'users', dId),
          {
            phone: updatedUser.phone,
            balance: updatedUser.balance,
            cumulativeIncome: updatedUser.cumulativeIncome,
            bankAccount: updatedUser.bankAccount,
            purchasedProducts: normalizePurchasedProducts(updatedUser.purchasedProducts),
            records: updatedUser.records,
            fundPin: updatedUser.fundPin,
            inviteCode: updatedUser.inviteCode,
            invitedBy: updatedUser.invitedBy,
            lastCheckInDate: updatedUser.lastCheckInDate || null,
            claimedPromoterMilestones: updatedUser.claimedPromoterMilestones || [],
            updatedAt: now,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn(`Firestore sync notice for user doc ${dId}:`, err);
      }
    }
  };

  // Firebase Auth State Listener - SYNC IN BACKGROUND WITHOUT LOCKING OUT
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userDocRef);
          let cloudData: UserState | null = snap.exists() ? (snap.data() as UserState) : null;

          const digits = firebaseUser.email ? firebaseUser.email.replace(/^user_/, '').replace(/@.*$/, '') : '';
          if (digits) {
            try {
              const digitsSnap = await getDoc(doc(db, 'users', digits));
              if (digitsSnap.exists()) {
                const dData = digitsSnap.data() as UserState;
                if (!cloudData) {
                  cloudData = dData;
                } else {
                  cloudData = {
                    ...cloudData,
                    ...dData,
                    balance: (dData.balance || 0) > (cloudData.balance || 0) ? dData.balance : cloudData.balance,
                    cumulativeIncome: (dData.cumulativeIncome || 0) > (cloudData.cumulativeIncome || 0) ? dData.cumulativeIncome : cloudData.cumulativeIncome,
                    bankAccount: dData.bankAccount || cloudData.bankAccount || null,
                    purchasedProducts: mergePurchasedProducts(cloudData.purchasedProducts, dData.purchasedProducts),
                    records: (dData.records?.length || 0) > (cloudData.records?.length || 0) ? dData.records : cloudData.records,
                  };
                }
              }
            } catch {}
          }

          if (isMounted) {
            setUser((prev) => {
              const merged: UserState = {
                ...INITIAL_USER,
                ...prev,
                ...(cloudData || {}),
                isLoggedIn: true,
                balance: cloudData?.balance !== undefined ? cloudData.balance : prev.balance,
                cumulativeIncome: cloudData?.cumulativeIncome !== undefined ? cloudData.cumulativeIncome : prev.cumulativeIncome,
                bankAccount: cloudData?.bankAccount || prev.bankAccount || null,
                fundPin: cloudData?.fundPin || prev.fundPin || '123456',
                purchasedProducts: mergePurchasedProducts(
                  prev.purchasedProducts,
                  cloudData?.purchasedProducts
                ),
                claimedPromoterMilestones: cloudData?.claimedPromoterMilestones || prev.claimedPromoterMilestones || [],
                records: (cloudData?.records && cloudData.records.length > 0)
                  ? cloudData.records
                  : prev.records,
              };
              return merged;
            });
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

  // Real-Time Active Firestore Sync for User Session (Receives Admin Product Allocations, Balance, PIN in Real-Time)
  useEffect(() => {
    if (!user.isLoggedIn) return;

    const cleanDigits = cleanNigerianPhoneDigits(user.phone);
    const targetDocId = auth.currentUser?.uid || cleanDigits;
    if (!targetDocId) return;

    const userDocRef = doc(db, 'users', targetDocId);
    const unsubDoc = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data() as Partial<UserState>;
          setUser((prev) => {
            const remoteProducts = cloudData.purchasedProducts;
            const remoteRecords = cloudData.records;
            const remoteBalance = cloudData.balance;
            const remoteCumulative = cloudData.cumulativeIncome;
            const remoteBank = cloudData.bankAccount;
            const remotePin = cloudData.fundPin;
            const remoteTeam = cloudData.teamMembers;

            const productsChanged =
              remoteProducts &&
              (remoteProducts.length !== prev.purchasedProducts.length ||
                JSON.stringify(remoteProducts) !== JSON.stringify(prev.purchasedProducts));

            const balanceChanged = remoteBalance !== undefined && remoteBalance !== prev.balance;
            const cumulativeChanged =
              remoteCumulative !== undefined && remoteCumulative !== prev.cumulativeIncome;
            const pinChanged = remotePin !== undefined && remotePin !== prev.fundPin;
            const bankChanged =
              remoteBank !== undefined &&
              JSON.stringify(remoteBank) !== JSON.stringify(prev.bankAccount);
            const teamChanged =
              remoteTeam &&
              (remoteTeam.length !== prev.teamMembers.length ||
                JSON.stringify(remoteTeam) !== JSON.stringify(prev.teamMembers));
            const recordsChanged =
              remoteRecords &&
              (remoteRecords.length !== prev.records.length ||
                JSON.stringify(remoteRecords) !== JSON.stringify(prev.records));

            if (productsChanged || balanceChanged || cumulativeChanged || pinChanged || bankChanged || teamChanged || recordsChanged) {
              return {
                ...prev,
                ...cloudData,
                balance: remoteBalance !== undefined ? remoteBalance : prev.balance,
                cumulativeIncome: remoteCumulative !== undefined ? remoteCumulative : prev.cumulativeIncome,
                bankAccount: remoteBank !== undefined && remoteBank !== null ? remoteBank : prev.bankAccount,
                fundPin: remotePin || prev.fundPin,
                teamMembers: remoteTeam && remoteTeam.length > 0 ? remoteTeam : prev.teamMembers,
                purchasedProducts: mergePurchasedProducts(
                  prev.purchasedProducts,
                  remoteProducts
                ),
                claimedPromoterMilestones:
                  cloudData.claimedPromoterMilestones || prev.claimedPromoterMilestones || [],
                records: remoteRecords && remoteRecords.length > 0 ? remoteRecords : prev.records,
                isLoggedIn: true,
              };
            }
            return prev;
          });
        }
      },
      (err) => {
        console.warn('Real-time user snapshot notice:', err);
      }
    );

    // Cross-tab / In-app event listener for real-time updates
    const handleStateUpdated = (e: any) => {
      if (e.detail) {
        setUser((prev) => ({ ...prev, ...e.detail }));
      }
    };
    const handleBalanceUpdated = (e: any) => {
      if (e.detail?.balance !== undefined) {
        setUser((prev) => ({ ...prev, balance: Number(e.detail.balance) }));
      }
    };
    const handleProductAssigned = (e: any) => {
      if (e.detail?.product) {
        showToast(`⚡ New VIP Node Deployed: ${e.detail.product.vipLevel} is active in your store!`);
      }
    };

    window.addEventListener('tesla_user_state_updated', handleStateUpdated);
    window.addEventListener('tesla_user_balance_updated', handleBalanceUpdated);
    window.addEventListener('tesla_product_assigned', handleProductAssigned);

    return () => {
      unsubDoc();
      window.removeEventListener('tesla_user_state_updated', handleStateUpdated);
      window.removeEventListener('tesla_user_balance_updated', handleBalanceUpdated);
      window.removeEventListener('tesla_product_assigned', handleProductAssigned);
    };
  }, [user.isLoggedIn, user.phone, auth.currentUser?.uid]);

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
      // Link real user to upline's downline tree across local state and Firestore
      recordNewReferralRegistration(newUser.phone, newUser.inviteCode, codeToUse).catch((e) =>
        console.warn('Downline registration notice:', e)
      );
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

  const handleDirectAdminLogin = async (digits: '7077599057' | '9011711470') => {
    try {
      const adminUser = await directAdminLogin(digits);
      setUser(adminUser);
      setSubScreen(null);
      setCurrentTab('home');
      setShowNotifyModal(true);
      showToast(`Master Admin direct session activated (+234 ${digits})`);
    } catch (err: any) {
      showToast(err?.message || 'Admin session activation failed');
    }
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

    const checkInAmount = 10; // Strictly 10 Naira daily check-in bonus
    const rec: TransactionRecord = {
      id: `chk_${Date.now()}`,
      type: 'bonus',
      title: 'Daily Attendance Reward',
      amount: checkInAmount,
      status: 'success',
      timestamp: Date.now(),
      details: 'Tesla Daily Attendance Verification Grant (₦10)',
    };

    const newBalance = user.balance + checkInAmount;
    const updatedRecords = [rec, ...user.records];

    const updatedUserState: UserState = {
      ...user,
      balance: newBalance,
      lastCheckInDate: today,
      records: updatedRecords,
    };

    setUser(updatedUserState);
    syncUserToFirestoreAndLocal(updatedUserState);

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
        let wasAlreadyApproved = false;
        const updatedRecords = prev.records.map((r) => {
          if (r.id === depositId || (r.type === 'recharge' && r.details?.includes(depositId))) {
            found = true;
            if (r.status === 'success') {
              wasAlreadyApproved = true;
            }
            return { ...r, status: 'success' as const };
          }
          return r;
        });

        if (wasAlreadyApproved) {
          return prev;
        }

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
  const handleSuccessWithdraw = async (amount: number, fee: number) => {
    const hoursCheck = isWithinWithdrawalHours(
      platformSettings.withdrawalStartHour ?? 9,
      platformSettings.withdrawalEndHour ?? 17,
      undefined,
      platformSettings.sundayWithdrawalStartHour ?? 14,
      platformSettings.sundayWithdrawalEndHour ?? 17
    );

    if (!hoursCheck.isAllowed && !platformSettings.allowAdminBypassHours) {
      showToast(hoursCheck.errorMessage || 'Withdrawals are currently closed.');
      return;
    }

    const eligibility = checkWithdrawalEligibility(user);

    if (!eligibility.isEligible) {
      showToast('You must purchase a VIP product and make a deposit before withdrawal.');
      return;
    }

    const cleanDigits = cleanNigerianPhoneDigits(user.phone);
    const targetDocId = auth.currentUser?.uid || cleanDigits;
    const now = Date.now();

    const newRecord: TransactionRecord = {
      id: `wth_${now}`,
      type: 'withdraw',
      title: 'Bank Withdrawal Request',
      amount,
      fee,
      status: 'pending',
      timestamp: now,
      bankAccount: user.bankAccount || null,
      details: user.bankAccount
        ? `${user.bankAccount.bankName} - ${user.bankAccount.accountNumber} (${user.bankAccount.accountName})`
        : 'Bank Transfer',
    };

    const updatedRecords = [newRecord, ...user.records];
    const newBalance = Math.max(0, user.balance - amount);

    // 1. Immediately update React state
    setUser((prev) => ({
      ...prev,
      balance: newBalance,
      records: updatedRecords,
    }));

    // 2. Immediately update localStorage active session
    try {
      const updatedUser: UserState = {
        ...user,
        balance: newBalance,
        records: updatedRecords,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      localStorage.setItem('tesla_app_state_v2', JSON.stringify(updatedUser));
    } catch {}

    // 3. Immediately update local accounts registry
    try {
      const accounts = getLocalAccounts();
      if (cleanDigits && accounts[cleanDigits]) {
        accounts[cleanDigits].userState = {
          ...accounts[cleanDigits].userState,
          balance: newBalance,
          records: updatedRecords,
        };
        accounts[cleanDigits].updatedAt = now;
        saveLocalAccounts(accounts);
      }
    } catch {}

    // 4. Immediately write to global withdrawals collection
    try {
      await setDoc(doc(db, 'withdrawals', newRecord.id), {
        id: newRecord.id,
        userId: targetDocId,
        userPhone: user.phone,
        amount,
        fee,
        status: 'pending',
        timestamp: newRecord.timestamp,
        bankAccount: user.bankAccount || null,
        details: newRecord.details,
      });
    } catch (err) {
      console.warn('Global withdrawal write notice:', err);
    }

    // 5. Immediately update ALL user document references in Firestore with the deducted balance!
    const docIdsToUpdate = new Set<string>();
    if (targetDocId) docIdsToUpdate.add(targetDocId);
    if (cleanDigits) docIdsToUpdate.add(cleanDigits);
    if (auth.currentUser?.uid) docIdsToUpdate.add(auth.currentUser.uid);

    for (const dId of docIdsToUpdate) {
      try {
        await setDoc(
          doc(db, 'users', dId),
          {
            balance: newBalance,
            records: updatedRecords,
            updatedAt: now,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn(`User withdrawal sync notice for doc ${dId}:`, err);
      }
    }

    // 6. Broadcast event so any open screens/tabs immediately register the deduction
    window.dispatchEvent(
      new CustomEvent('tesla_user_state_updated', {
        detail: { balance: newBalance, records: updatedRecords },
      })
    );
    window.dispatchEvent(
      new CustomEvent('tesla_user_balance_updated', {
        detail: { balance: newBalance },
      })
    );

    showToast(`Withdrawal request of ₦ ${amount.toLocaleString()} submitted! ₦ ${amount.toLocaleString()} deducted.`);
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

    const newBalance = user.balance - canonical.price;
    const newPurchased = normalizePurchasedProducts([...user.purchasedProducts, newInstance]);
    const newRecords = [purchaseRecord, ...user.records];

    const updatedUserState: UserState = {
      ...user,
      balance: newBalance,
      purchasedProducts: newPurchased,
      records: newRecords,
    };

    setUser(updatedUserState);
    syncUserToFirestoreAndLocal(updatedUserState);

    // Distribute real multi-tier team commissions (Level 1: 25%, Level 2: 1%, Level 3: 1%)
    distributeProductPurchaseCommissions({
      buyerPhone: user.phone,
      buyerInviteCode: user.inviteCode,
      buyerInvitedBy: user.invitedBy,
      amount: product.price,
      productTitle: product.title,
      platformSettings,
      orderOrInstanceId: newInstance.instanceId,
    })
      .then((results) => {
        if (results && results.length > 0) {
          console.log('[CommissionEngine] Credited uplines successfully:', results);
        }
      })
      .catch((err) => console.warn('Commission distribution notice:', err));

    showToast(`${product.vipLevel} activated successfully! Daily revenue drops every midnight (12:00 AM WAT).`);
    return true;
  };

  // Collect Revenue Handler - DAILY 12:00 MIDNIGHT WAT SETTLEMENT
  const handleCollectRevenue = (instanceId?: string) => {
    if (isCollectingRevenueRef.current) return;
    isCollectingRevenueRef.current = true;

    try {
      if (user.purchasedProducts.length === 0) {
        showToast('No active power generators yet! Purchase a VIP Node first.');
        return;
      }

      const now = Date.now();
      let totalClaimable = 0;
      let claimedUnitsCount = 0;

      const updatedPurchased = user.purchasedProducts.map((p) => {
        // If a specific instance was requested to collect, ignore others
        if (instanceId && p.instanceId !== instanceId) {
          return p;
        }

        const maturity = calculateProductMaturity(p, now);

        if (maturity.isMature && maturity.claimableYield > 0) {
          totalClaimable += maturity.claimableYield;
          claimedUnitsCount += 1;
          return {
            ...p,
            daysActive: Math.min(p.validityDays || 100, (p.daysActive || 0) + 1),
            lastClaimDate: now,
          };
        }

        return p;
      });

      if (totalClaimable <= 0) {
        showToast('No mature daily revenue ready to claim yet. Next income drops after 12:00 AM midnight (WAT)!');
        return;
      }

      const incomeRecord: TransactionRecord = {
        id: `inc_${Date.now()}`,
        type: 'income',
        title: 'Daily Energy Generation Income',
        amount: totalClaimable,
        status: 'success',
        timestamp: Date.now(),
        details: `Daily 12:00 AM Midnight Generation Yield Claimed (${claimedUnitsCount} Unit${claimedUnitsCount > 1 ? 's' : ''})`,
      };

      const newBalance = user.balance + totalClaimable;
      const newCumulative = user.cumulativeIncome + totalClaimable;
      const newRecords = [incomeRecord, ...user.records];

      const updatedUserState: UserState = {
        ...user,
        balance: newBalance,
        cumulativeIncome: newCumulative,
        purchasedProducts: updatedPurchased,
        records: newRecords,
      };

      setUser(updatedUserState);
      syncUserToFirestoreAndLocal(updatedUserState);

      showToast(`Collected +₦ ${totalClaimable.toLocaleString()} daily yield!`);
    } finally {
      setTimeout(() => {
        isCollectingRevenueRef.current = false;
      }, 500);
    }
  };

  // Notification Queue Handlers
  const handleNotificationBannerAction = (item: NotificationBannerItem) => {
    if (item.type === 'revenue_ready') {
      handleCollectRevenue();
      setNotificationQueue((prev) => prev.filter((i) => i.id !== item.id));
    }
  };

  const handleNotificationBannerSecondaryAction = (item: NotificationBannerItem) => {
    if (item.type === 'revenue_ready') {
      setSubScreen('my_store');
    }
  };

  const handleDismissNotification = (id: string) => {
    setNotificationQueue((prev) => prev.filter((i) => i.id !== id));
  };

  // Claim Promoter Milestone Bounty Handler
  const handleClaimPromoterMilestone = async (milestone: PromoterMilestone): Promise<boolean> => {
    const claimedSet = new Set(user.claimedPromoterMilestones || []);
    if (claimedSet.has(milestone.id)) {
      showToast('This promoter milestone has already been claimed!');
      return false;
    }

    const lv1Buyers = user.teamMembers.filter((m) => m.level === 1 && (m.invested || 0) > 0).length;
    if (lv1Buyers < milestone.requiredActiveInvites) {
      showToast(
        `You need ${milestone.requiredActiveInvites - lv1Buyers} more direct active VIP buyer(s) to claim this bounty!`
      );
      return false;
    }

    const bountyRecord: TransactionRecord = {
      id: `prom_bounty_${Date.now()}`,
      type: 'bonus',
      title: `Promoter Bounty: ${milestone.title}`,
      amount: milestone.bonusAmount,
      status: 'success',
      timestamp: Date.now(),
      details: `${milestone.badge} unlocked for inviting ${milestone.requiredActiveInvites} active VIP buyers`,
    };

    const newBalance = user.balance + milestone.bonusAmount;
    const newCumulative = user.cumulativeIncome + milestone.bonusAmount;
    const updatedClaimed = [...(user.claimedPromoterMilestones || []), milestone.id];
    const newRecords = [bountyRecord, ...user.records];

    const updatedUserState: UserState = {
      ...user,
      balance: newBalance,
      cumulativeIncome: newCumulative,
      claimedPromoterMilestones: updatedClaimed,
      records: newRecords,
    };

    setUser(updatedUserState);
    await syncUserToFirestoreAndLocal(updatedUserState);

    showToast(`🎉 Congratulations! +₦${milestone.bonusAmount.toLocaleString()} Milestone Bounty credited to your balance!`);
    return true;
  };

  // Bank Account Save Handler
  const handleSaveBank = async (bank: BankAccount) => {
    const updatedUserState: UserState = {
      ...user,
      bankAccount: bank,
    };

    // 1. Update React User State
    setUser(updatedUserState);

    // 2. Persist to local & Firestore docs
    await syncUserToFirestoreAndLocal(updatedUserState);

    // 3. Broadcast real-time update event
    try {
      window.dispatchEvent(
        new CustomEvent('tesla_user_state_updated', {
          detail: { phone: user.phone, bankAccount: bank },
        })
      );
    } catch {}

    showToast(`Bank account bound: ${bank.bankName}`);
  };

  // Security Updates
  const handleUpdatePassword = (_newPass: string) => {
    showToast('Login password updated successfully!');
  };

  const handleUpdateFundPin = (newPin: string) => {
    setUser((prev) => ({ ...prev, fundPin: newPin }));
    showToast('Withdrawal Fund PIN updated successfully!');
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

    // Prevent duplicate redemption by the same user
    const alreadyRedeemed = user.records.some(
      (r) => r.type === 'gift' && (r.title.includes(trimmed) || r.details?.includes(trimmed))
    );
    if (alreadyRedeemed) {
      return { success: false, message: `You have already claimed gift code "${trimmed}".` };
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

    const newBalance = user.balance + amount;
    const updatedRecords = [rec, ...user.records];

    const updatedUserState: UserState = {
      ...user,
      balance: newBalance,
      records: updatedRecords,
    };

    setUser(updatedUserState);
    syncUserToFirestoreAndLocal(updatedUserState);

    return { 
      success: true, 
      amount, 
      message: `Code redeemed! ₦${amount.toLocaleString()} added to your balance.` 
    };
  };

  // Telegram navigation
  const handleOpenTelegram = (channel = 'Tesla Official Telegram', customUrl?: string) => {
    const targetUrl =
      customUrl ||
      platformSettings.telegramGroupLink ||
      platformSettings.telegramLink ||
      'https://t.me/teslainvestment456';
    showToast(`Opening ${channel}...`);
    try {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = targetUrl;
    }
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
      creditedByAdmin: true,
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
      creditedByAdmin: true,
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

  const handleAdminAssignProduct = (product: VIPProduct, targetPhone?: string) => {
    const cleanTarget = cleanNigerianPhoneDigits(targetPhone || '');
    const cleanUser = cleanNigerianPhoneDigits(user.phone);
    if (!targetPhone || cleanTarget === cleanUser) {
      if (user.purchasedProducts.some((p) => p.productId === product.id && Date.now() - (p.purchaseDate || 0) < 5000)) {
        return;
      }
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
        details: `Executive Direct Allocation: ${canonical.title} (Daily: ₦${canonical.dailyIncome.toLocaleString()})`,
      };
      const updatedUserState: UserState = {
        ...user,
        purchasedProducts: normalizePurchasedProducts([...user.purchasedProducts, newInstance]),
        records: [grantRec, ...user.records],
      };
      setUser(updatedUserState);
      syncUserToFirestoreAndLocal(updatedUserState);
      showToast(`Admin: Deployed ${product.vipLevel} to wallet in Real-Time!`);
    }
  };

  // If Temporary Administration mode is active and user has not bypassed or requested Admin Panel
  const isTemporaryAdminModeActive = platformSettings.isTemporaryAdministrationMode !== false;

  if (isTemporaryAdminModeActive && !bypassAdminMode && subScreen !== 'admin') {
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex flex-col font-sans">
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-white px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md shadow-lg border border-white/10 animate-in fade-in duration-150 text-center max-w-[90vw]">
            {toastMessage}
          </div>
        )}
        <TemporaryAdministrationLandingScreen
          platformSettings={platformSettings}
          onOpenTelegram={handleOpenTelegram}
        />
      </div>
    );
  }

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
          platformSettings={platformSettings}
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
        bankName: platformSettings.depositBankName || 'CARBON',
        accountNo: platformSettings.depositAccountNo || '1581957640',
        accountName: platformSettings.depositAccountName || 'LEVIATHAN HYPERMARKET',
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
          onGoToProducts={() => {
            setSubScreen(null);
            setCurrentTab('product');
          }}
          onGoToRecharge={() => setSubScreen('recharge')}
          onSuccessWithdraw={handleSuccessWithdraw}
          taxRate={platformSettings.withdrawalTaxRate}
          minWithdrawal={platformSettings.minWithdrawal}
          withdrawalStartHour={platformSettings.withdrawalStartHour ?? 9}
          withdrawalEndHour={platformSettings.withdrawalEndHour ?? 17}
          sundayWithdrawalStartHour={platformSettings.sundayWithdrawalStartHour ?? 14}
          sundayWithdrawalEndHour={platformSettings.sundayWithdrawalEndHour ?? 17}
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
          platformSettings={platformSettings}
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
          platformSettings={platformSettings}
          onBack={() => setSubScreen(null)}
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
        <ErrorBoundary fallbackTitle="Admin Panel Safe Mode" onReset={() => setSubScreen(null)}>
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
            onAdminAssignProduct={handleAdminAssignProduct}
          />
        </ErrorBoundary>
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
        <ErrorBoundary fallbackTitle="Admin Panel Safe Mode" onReset={() => setSubScreen(null)}>
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
            onAdminAssignProduct={handleAdminAssignProduct}
          />
        </ErrorBoundary>
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

        {/* Persistent Notification Banner Queue (Revenue Ready & System Alerts) */}
        {user.isLoggedIn && notificationQueue.length > 0 && (
          <NotificationBannerQueue
            queue={notificationQueue}
            onAction={handleNotificationBannerAction}
            onSecondaryAction={handleNotificationBannerSecondaryAction}
            onDismiss={handleDismissNotification}
          />
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
                onGoToPromoters={() => setCurrentTab('promoters')}
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

            {currentTab === 'promoters' && (
              <PromotersScreen
                user={user}
                platformSettings={platformSettings}
                onClaimMilestone={handleClaimPromoterMilestone}
                onNavigateToRecharge={() => setSubScreen('recharge')}
                onGoToProducts={() => setCurrentTab('product')}
                onOpenFlyerModal={() => setShowFlyerModal(true)}
              />
            )}

            {currentTab === 'team' && (
              <TeamScreen
                user={user}
                platformSettings={platformSettings}
                onNavigateToTeamDetails={() => setSubScreen('team_details')}
                onOpenFlyerModal={() => setShowFlyerModal(true)}
              />
            )}

            {currentTab === 'mine' && (
              <MineScreen
                user={user}
                onNavigate={(screen) => setSubScreen(screen)}
                onOpenGifts={() => setShowGiftModal(true)}
                onSignOut={handleSignOut}
                onGoToProducts={() => setCurrentTab('product')}
                onGoToPromoters={() => setCurrentTab('promoters')}
                onOpenFlyerModal={() => setShowFlyerModal(true)}
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

        {/* Floating Customer Service Image Widget on Major Pages (Home, Product, Promoters, Team, Mine) */}
        {user.isLoggedIn && !subScreen && (
          <button
            onClick={() => setSubScreen('customer_service')}
            className="fixed bottom-20 right-3.5 z-40 flex items-center gap-2 p-1.5 pl-2 pr-3 bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-neutral-200/90 hover:scale-105 active:scale-95 transition-all duration-200 group cursor-pointer animate-in fade-in slide-in-from-bottom-3"
            aria-label="24/7 Customer Service"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 shadow-xs shrink-0">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80"
                alt="Customer Service Manager"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                24/7 Care
              </span>
              <span className="text-xs font-black text-neutral-900 leading-tight">
                Support
              </span>
            </div>
          </button>
        )}

        {/* NOTIFY Modal with Prominent Join Telegram Group Button */}
        <NotifyModal
          isOpen={showNotifyModal && !subScreen && currentTab === 'home'}
          onClose={() => setShowNotifyModal(false)}
          onOpenTelegram={() =>
            handleOpenTelegram(
              'Tesla Official Telegram Group',
              platformSettings.telegramGroupLink || platformSettings.telegramLink || 'https://t.me/teslainvestment456'
            )
          }
          announcementNotice={platformSettings.announcementNotice}
          signupBonus={platformSettings.signupBonus}
          level1CommissionPct={platformSettings.level1CommissionPct}
          telegramGroupLink={
            platformSettings.telegramGroupLink || platformSettings.telegramLink || 'https://t.me/teslainvestment456'
          }
        />

        {/* Redeem Gift Modal */}
        <RedeemGiftModal
          isOpen={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          onRedeem={handleRedeemGift}
        />

        {/* Dynamic Advertising Flyer Studio Modal */}
        <FlyerModal
          isOpen={showFlyerModal}
          onClose={() => setShowFlyerModal(false)}
          user={user}
          platformSettings={platformSettings}
        />
      </div>
    </div>
  );
}
