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
import { TasksScreen } from './components/TasksScreen';
import { FlyerModal } from './components/FlyerModal';
import { TelegramGroupFlyerModal } from './components/TelegramGroupFlyerModal';
import { DangoteLogo } from './components/DangoteLogo';
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
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
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
import { sanitizeForFirestore } from './utils/firestoreSanitizer';

const STORAGE_KEY = 'dangote_app_state_v2';
const LEGACY_STORAGE_KEY = 'tesla_app_state_v2';

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
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn && parsed.phone) {
          const cleanDigits = cleanNigerianPhoneDigits(parsed.phone);
          const accounts = getLocalAccounts();
          if (accounts[cleanDigits] || isAdminUser(parsed.phone)) {
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
            if (
              parsed.bankAccount?.accountName === 'Dangote Refinery Master Treasury' ||
              parsed.bankAccount?.accountName === 'Tesla Energy Master Treasury'
            ) {
              parsed.bankAccount = null;
            }
            return parsed;
          }
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
      const saved = localStorage.getItem('dangote_products_state') || localStorage.getItem('tesla_products_state');
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
      const saved = localStorage.getItem('dangote_gift_codes_state') || localStorage.getItem('tesla_gift_codes_state');
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
      const saved = localStorage.getItem('dangote_platform_settings') || localStorage.getItem('tesla_platform_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (parsed.signupBonus !== 1000) {
            parsed.signupBonus = 1000;
          }
          if (parsed.minWithdrawal !== 1500) {
            parsed.minWithdrawal = 1500;
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
  const [showGiftModal, setShowGiftModal] = useState<boolean>(false);
  const [showFlyerModal, setShowFlyerModal] = useState<boolean>(false);
  const [showTelegramGroupFlyer, setShowTelegramGroupFlyer] = useState<boolean>(false);
  const [referralCodeFromUrl] = useState<string | null>(() => extractReferralCodeFromUrl());
  const [authMode, setAuthMode] = useState<'login' | 'register'>(() => {
    return extractReferralCodeFromUrl() ? 'register' : 'login';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(false);

  // Local state based notification queue
  const [notificationQueue, setNotificationQueue] = useState<NotificationBannerItem[]>([]);
  const isCollectingRevenueRef = useRef<boolean>(false);
  const isPurchasingRef = useRef<boolean>(false);
  const isCheckingInRef = useRef<boolean>(false);
  const isClaimingMilestoneRef = useRef<boolean>(false);

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
      localStorage.setItem('dangote_products_state', JSON.stringify(products));
      localStorage.setItem('tesla_products_state', JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('dangote_gift_codes_state', JSON.stringify(giftCodes));
      localStorage.setItem('tesla_gift_codes_state', JSON.stringify(giftCodes));
    } catch {
      // ignore
    }
  }, [giftCodes]);

  useEffect(() => {
    try {
      localStorage.setItem('dangote_platform_settings', JSON.stringify(platformSettings));
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
            if (s.signupBonus !== 1000) s.signupBonus = 1000;
            if (s.minWithdrawal !== 1500) s.minWithdrawal = 1500;
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
        const payload = sanitizeForFirestore({
          phone: updatedUser.phone,
          balance: typeof updatedUser.balance === 'number' && !isNaN(updatedUser.balance) ? updatedUser.balance : 0,
          cumulativeIncome: typeof updatedUser.cumulativeIncome === 'number' && !isNaN(updatedUser.cumulativeIncome) ? updatedUser.cumulativeIncome : 0,
          bankAccount: updatedUser.bankAccount || null,
          purchasedProducts: normalizePurchasedProducts(updatedUser.purchasedProducts || []),
          teamMembers: updatedUser.teamMembers || [],
          records: updatedUser.records || [],
          fundPin: updatedUser.fundPin || '123456',
          inviteCode: updatedUser.inviteCode || '',
          invitedBy: updatedUser.invitedBy || null,
          lastCheckInDate: updatedUser.lastCheckInDate || null,
          claimedPromoterMilestones: updatedUser.claimedPromoterMilestones || [],
          updatedAt: now,
        });
        await setDoc(doc(db, 'users', dId), payload, { merge: true });
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

          const accounts = getLocalAccounts();
          const localAcc = digits ? accounts[digits] : null;

          // STRICT CHECK: Does this user actually have a valid account in cloudData, localAcc, or isAdmin?
          const hasValidProfile = Boolean(
            (cloudData && (cloudData.phone || cloudData.inviteCode)) ||
            (localAcc && localAcc.userState?.phone) ||
            isAdminUser(digits)
          );

          if (!hasValidProfile) {
            // Firebase Auth user has no registered profile! Do NOT log in! Strictly enforce AuthScreen!
            console.warn('Firebase user has no registered account in Firestore or local registry. Logging out.');
            await signOut(auth).catch(() => {});
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(LEGACY_STORAGE_KEY);
            if (isMounted) {
              setUser(INITIAL_USER);
              setIsAuthChecking(false);
            }
            return;
          }

          if (isMounted) {
            setUser((prev) => {
              const baseData = cloudData || localAcc?.userState || prev;
              const merged: UserState = {
                ...INITIAL_USER,
                ...baseData,
                isLoggedIn: true,
                phone: baseData.phone || (digits ? `+234 ${digits}` : prev.phone),
                balance: typeof cloudData?.balance === 'number' && !isNaN(cloudData.balance)
                  ? cloudData.balance
                  : (typeof localAcc?.userState?.balance === 'number' && !isNaN(localAcc.userState.balance)
                    ? localAcc.userState.balance
                    : (typeof prev.balance === 'number' && !isNaN(prev.balance) ? prev.balance : 0)),
                cumulativeIncome: typeof cloudData?.cumulativeIncome === 'number' && !isNaN(cloudData.cumulativeIncome)
                  ? cloudData.cumulativeIncome
                  : (typeof localAcc?.userState?.cumulativeIncome === 'number' && !isNaN(localAcc.userState.cumulativeIncome)
                    ? localAcc.userState.cumulativeIncome
                    : (typeof prev.cumulativeIncome === 'number' && !isNaN(prev.cumulativeIncome) ? prev.cumulativeIncome : 0)),
                bankAccount: cloudData?.bankAccount || localAcc?.userState?.bankAccount || prev.bankAccount || null,
                fundPin: cloudData?.fundPin || localAcc?.userState?.fundPin || prev.fundPin || '123456',
                purchasedProducts: mergePurchasedProducts(
                  prev.purchasedProducts || [],
                  cloudData?.purchasedProducts || localAcc?.userState?.purchasedProducts || []
                ),
                claimedPromoterMilestones: cloudData?.claimedPromoterMilestones || localAcc?.userState?.claimedPromoterMilestones || prev.claimedPromoterMilestones || [],
                records: (cloudData?.records && cloudData.records.length > 0)
                  ? cloudData.records
                  : (localAcc?.userState?.records || prev.records || []),
                teamMembers: cloudData?.teamMembers || localAcc?.userState?.teamMembers || prev.teamMembers || [],
              };
              return merged;
            });
          }
        } catch (err) {
          // Silent fallback to local user state if Firestore document read is unavailable or offline
        }
      } else {
        // No active Firebase user - check if local session exists
        const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.isLoggedIn && parsed.phone && isMounted) {
              const cleanDigits = cleanNigerianPhoneDigits(parsed.phone);
              const accounts = getLocalAccounts();
              if (accounts[cleanDigits] || isAdminUser(parsed.phone)) {
                setUser({
                  ...INITIAL_USER,
                  ...parsed,
                  balance: typeof parsed.balance === 'number' && !isNaN(parsed.balance) ? parsed.balance : 0,
                  cumulativeIncome: typeof parsed.cumulativeIncome === 'number' && !isNaN(parsed.cumulativeIncome) ? parsed.cumulativeIncome : 0,
                  purchasedProducts: parsed.purchasedProducts || [],
                  records: parsed.records || [],
                  teamMembers: parsed.teamMembers || [],
                });
              } else {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(LEGACY_STORAGE_KEY);
                setUser(INITIAL_USER);
              }
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

    window.addEventListener('dangote_user_state_updated', handleStateUpdated);
    window.addEventListener('tesla_user_state_updated', handleStateUpdated);
    window.addEventListener('dangote_user_balance_updated', handleBalanceUpdated);
    window.addEventListener('tesla_user_balance_updated', handleBalanceUpdated);
    window.addEventListener('dangote_product_assigned', handleProductAssigned);
    window.addEventListener('tesla_product_assigned', handleProductAssigned);

    return () => {
      unsubDoc();
      window.removeEventListener('dangote_user_state_updated', handleStateUpdated);
      window.removeEventListener('tesla_user_state_updated', handleStateUpdated);
      window.removeEventListener('dangote_user_balance_updated', handleBalanceUpdated);
      window.removeEventListener('tesla_user_balance_updated', handleBalanceUpdated);
      window.removeEventListener('dangote_product_assigned', handleProductAssigned);
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
      showToast(`Welcome back, ${authenticatedUser.phone}!`);
    } catch (err: any) {
      console.warn('Login error caught in App.tsx:', err);
      await signOut(auth).catch(() => {});
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      setUser(INITIAL_USER);
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
      showToast(`Registration successful! ₦${platformSettings.signupBonus.toLocaleString()} welcome bonus credited.`);
    } catch (err: any) {
      console.warn('Registration error caught in App.tsx:', err);
      await signOut(auth).catch(() => {});
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      setUser(INITIAL_USER);
      throw err;
    }
  };

  const handleDirectAdminLogin = async (digits: '7077599057' | '9011711470') => {
    try {
      const adminUser = await directAdminLogin(digits);
      setUser(adminUser);
      setSubScreen(null);
      setCurrentTab('home');
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

  // Daily Check-In Handler (Strict anti-double crediting with ref lock & record verification)
  const handleDailyCheckIn = () => {
    if (isCheckingInRef.current) return;
    isCheckingInRef.current = true;
    try {
      const today = new Date().toISOString().split('T')[0];
      if (user.lastCheckInDate === today) {
        showToast('You have already checked in today! Come back tomorrow.');
        return;
      }

      // Check if user already has an attendance reward recorded for today
      const alreadyHasAttendanceToday = user.records.some((r) => {
        if (r.type === 'bonus' && r.title.includes('Daily Attendance')) {
          const recDate = new Date(r.timestamp).toISOString().split('T')[0];
          return recDate === today;
        }
        return false;
      });

      if (alreadyHasAttendanceToday) {
        setUser((prev) => ({ ...prev, lastCheckInDate: today }));
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
        details: 'Dangote Shareholder Daily Attendance Grant (₦10)',
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
    } finally {
      setTimeout(() => {
        isCheckingInRef.current = false;
      }, 500);
    }
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

  // Product Purchase Handler (Protected against double execution & duplicate commissions)
  const handleBuyProduct = (product: VIPProduct): boolean => {
    if (isPurchasingRef.current) return false;
    isPurchasingRef.current = true;
    try {
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

    // Persist order to dedicated orders collection in Firestore
    try {
      setDoc(doc(db, 'orders', newInstance.instanceId), {
        id: newInstance.instanceId,
        userId: user.id || auth.currentUser?.uid || user.phone,
        userPhone: user.phone,
        productId: canonical.id,
        productTitle: canonical.title,
        vipLevel: canonical.vipLevel,
        amount: canonical.price,
        dailyIncome: canonical.dailyIncome,
        totalIncome: canonical.totalIncome,
        validityDays: canonical.validityDays,
        status: 'active',
        timestamp: now,
      }).catch((e) => console.warn('Orders collection notice:', e));
    } catch {}

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
    } finally {
      setTimeout(() => {
        isPurchasingRef.current = false;
      }, 600);
    }
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

  // Claim Promoter Milestone Bounty Handler (Strict single-claim verification & lock)
  const handleClaimPromoterMilestone = async (milestone: PromoterMilestone): Promise<boolean> => {
    if (isClaimingMilestoneRef.current) return false;
    isClaimingMilestoneRef.current = true;
    try {
      const claimedSet = new Set(user.claimedPromoterMilestones || []);
      if (claimedSet.has(milestone.id)) {
        showToast('This promoter milestone has already been claimed!');
        return false;
      }
      // Also check transaction records to guarantee it was never credited previously
      const alreadyRecorded = user.records.some(
        (r) => r.type === 'bonus' && r.title.includes(milestone.title)
      );
      if (alreadyRecorded) {
        setUser((prev) => ({
          ...prev,
          claimedPromoterMilestones: Array.from(new Set([...(prev.claimedPromoterMilestones || []), milestone.id])),
        }));
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
    } finally {
      setTimeout(() => {
        isClaimingMilestoneRef.current = false;
      }, 500);
    }
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
  const handleOpenTelegram = (channel = 'Dangote Shareholder Telegram', customUrl?: string) => {
    const targetUrl =
      customUrl ||
      platformSettings.telegramGroupLink ||
      platformSettings.telegramLink ||
      'https://t.me/dangote_ipo';
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

      // Also persist to orders collection in Firestore
      try {
        setDoc(doc(db, 'orders', newInstance.instanceId), {
          id: newInstance.instanceId,
          userId: user.id || auth.currentUser?.uid || user.phone,
          userPhone: user.phone,
          productId: canonical.id,
          productTitle: canonical.title,
          vipLevel: canonical.vipLevel,
          amount: canonical.price,
          dailyIncome: canonical.dailyIncome,
          totalIncome: canonical.totalIncome,
          validityDays: canonical.validityDays,
          status: 'active',
          timestamp: now,
          allocatedByAdmin: true,
        }).catch(() => {});
      } catch {}

      showToast(`Admin: Deployed ${product.vipLevel} to wallet in Real-Time!`);
    }
  };

  // Complete Firebase synchronization for balance, orders, team, and commissions
  const handleFullFirestoreSync = async (): Promise<void> => {
    if (!user.phone && !auth.currentUser?.uid) return;
    try {
      const cleanDigits = cleanNigerianPhoneDigits(user.phone);
      const targetDocId = auth.currentUser?.uid || cleanDigits;
      if (!targetDocId) return;

      // 1. Fetch user doc from Firestore
      const userDocRef = doc(db, 'users', targetDocId);
      const snap = await getDoc(userDocRef);
      let remoteUser = snap.exists() ? (snap.data() as Partial<UserState>) : null;

      if (!remoteUser && cleanDigits) {
        const dSnap = await getDoc(doc(db, 'users', cleanDigits));
        if (dSnap.exists()) {
          remoteUser = dSnap.data() as Partial<UserState>;
        }
      }

      // 2. Fetch all orders for this user from /orders
      const cloudOrders: PurchasedProductItem[] = [];
      try {
        const ordersSnap = await getDocs(collection(db, 'orders'));
        ordersSnap.docs.forEach((docItem) => {
          const ord = docItem.data();
          if (
            (cleanDigits && cleanNigerianPhoneDigits(ord.userPhone || '') === cleanDigits) ||
            ord.userId === targetDocId ||
            ord.userId === user.id
          ) {
            cloudOrders.push({
              instanceId: ord.id || docItem.id,
              productId: ord.productId,
              title: ord.productTitle,
              vipLevel: ord.vipLevel,
              purchaseDate: ord.timestamp || Date.now(),
              lastClaimDate: ord.timestamp || Date.now(),
              dailyIncome: ord.dailyIncome || 0,
              totalIncome: ord.totalIncome || 0,
              validityDays: ord.validityDays || 100,
              daysActive: 0,
              image: '',
            });
          }
        });
      } catch (err) {
        console.warn('Orders query notice:', err);
      }

      // 3. Fetch commissions for this user from /commissions
      const cloudCommissions: TransactionRecord[] = [];
      try {
        const commSnap = await getDocs(collection(db, 'commissions'));
        commSnap.docs.forEach((docItem) => {
          const comm = docItem.data();
          if (
            (cleanDigits && cleanNigerianPhoneDigits(comm.uplinePhone || '') === cleanDigits) ||
            comm.uplineInviteCode === user.inviteCode
          ) {
            cloudCommissions.push({
              id: comm.id || docItem.id,
              type: 'commission',
              title: `Level ${comm.level || 1} Team Commission`,
              amount: comm.amount || 0,
              status: 'success',
              timestamp: comm.timestamp || Date.now(),
              details: `${comm.buyerPhone ? `From downline ${comm.buyerPhone}: ` : ''}${comm.productTitle || 'Share Tranche Subscription'}`,
            });
          }
        });
      } catch (err) {
        console.warn('Commissions query notice:', err);
      }

      setUser((prev) => {
        const mergedProducts = mergePurchasedProducts(
          mergePurchasedProducts(prev.purchasedProducts, remoteUser?.purchasedProducts),
          cloudOrders
        );
        const existingRecIds = new Set(prev.records.map((r) => r.id));
        const mergedRecords = [...prev.records];
        cloudCommissions.forEach((cr) => {
          if (!existingRecIds.has(cr.id)) {
            existingRecIds.add(cr.id);
            mergedRecords.push(cr);
          }
        });
        (remoteUser?.records || []).forEach((rr) => {
          if (!existingRecIds.has(rr.id)) {
            existingRecIds.add(rr.id);
            mergedRecords.push(rr);
          }
        });
        mergedRecords.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        const updated: UserState = {
          ...prev,
          ...(remoteUser || {}),
          balance: remoteUser?.balance !== undefined ? remoteUser.balance : prev.balance,
          cumulativeIncome: remoteUser?.cumulativeIncome !== undefined ? remoteUser.cumulativeIncome : prev.cumulativeIncome,
          bankAccount: remoteUser?.bankAccount !== undefined ? remoteUser.bankAccount : prev.bankAccount,
          fundPin: remoteUser?.fundPin || prev.fundPin,
          teamMembers: remoteUser?.teamMembers && remoteUser.teamMembers.length > 0 ? remoteUser.teamMembers : prev.teamMembers,
          purchasedProducts: mergedProducts,
          records: mergedRecords,
          isLoggedIn: true,
        };
        syncUserToFirestoreAndLocal(updated);
        return updated;
      });
      showToast('Live balance, orders, team and commission data synced from Firebase!');
    } catch (err) {
      console.warn('Firestore live sync error:', err);
    }
  };

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
        orderNo: `DNG${Date.now().toString().slice(-8)}`,
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
          onOpenTelegram={handleOpenTelegram}
          managerTelegramUrl={platformSettings.customerServiceManagerLink || 'https://t.me/Abigail_faith56'}
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
          onOpenTelegram={handleOpenTelegram}
          managerTelegramUrl={platformSettings.customerServiceManagerLink || 'https://t.me/Abigail_faith56'}
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
          onRefreshOrders={handleFullFirestoreSync}
          onNavigateToAdmin={() => setSubScreen('admin')}
          onNavigateToCustomerService={() => setSubScreen('customer_service')}
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
        if (subScreen === 'tasks') {
      return (
        <TasksScreen
          user={user}
          platformSettings={platformSettings}
          onBack={() => setSubScreen(null)}
          onClaimPromoterMilestone={handleClaimPromoterMilestone}
          onDailyCheckIn={handleDailyCheckIn}
          onRedeemGiftCode={handleRedeemGift}
          onNavigateToRecharge={() => setSubScreen('recharge')}
          onNavigateToProducts={() => {
            setSubScreen(null);
            setCurrentTab('product');
          }}
          onOpenTelegram={handleOpenTelegram}
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
          <ErrorBoundary fallbackTitle="Portal Screen Safe Mode" onReset={() => setSubScreen(null)}>
            <div key={subScreen} className="animate-page-in">
              {renderSubScreen()}
            </div>
          </ErrorBoundary>
        ) : (
          <main className="flex-1">
            <ErrorBoundary fallbackTitle="Shareholder Dashboard Safe Mode" onReset={() => setCurrentTab('home')}>
              <div key={currentTab} className="animate-page-in">
                {currentTab === 'home' && (
                  <HomeScreen
                    user={user}
                    onNavigate={(screen) => setSubScreen(screen)}
                    onOpenGifts={() => setShowGiftModal(true)}
                    onGoToProducts={() => setCurrentTab('product')}
                    onGoToOrders={() => setCurrentTab('orders')}
                    onDailyCheckIn={handleDailyCheckIn}
                    onOpenTelegramGroupFlyer={() => setShowTelegramGroupFlyer(true)}
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

                {currentTab === 'orders' && (
                  <MyStoreScreen
                    user={user}
                    onBack={() => setCurrentTab('home')}
                    onGoToProducts={() => setCurrentTab('product')}
                    onCollectRevenue={handleCollectRevenue}
                    onRefreshOrders={handleFullFirestoreSync}
                    onNavigateToAdmin={() => setSubScreen('admin')}
                    onNavigateToCustomerService={() => setSubScreen('customer_service')}
                  />
                )}

                {currentTab === 'team' && (
                  <TeamScreen
                    user={user}
                    platformSettings={platformSettings}
                    onNavigateToTeamDetails={() => setSubScreen('team_details')}
                    onOpenFlyerModal={() => setShowFlyerModal(true)}
                    onNavigateToCustomerService={() => setSubScreen('customer_service')}
                    onNavigateToAdmin={() => setSubScreen('admin')}
                    onRefreshTeam={handleFullFirestoreSync}
                    onNavigateToTasks={() => setSubScreen('tasks')}
                  />
                )}

                {currentTab === 'mine' && (
                  <MineScreen
                    user={user}
                    onNavigate={(screen) => setSubScreen(screen)}
                    onOpenGifts={() => setShowGiftModal(true)}
                    onSignOut={handleSignOut}
                    onGoToProducts={() => setCurrentTab('product')}
                    onOpenFlyerModal={() => setShowFlyerModal(true)}
                    onSyncWallet={handleFullFirestoreSync}
                  />
                )}
              </div>
            </ErrorBoundary>

            {/* Bottom Nav Bar */}
            <BottomNav
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setSubScreen(null);
                handleFullFirestoreSync();
              }}
            />
          </main>
        )}

        {/* Floating Customer Service Image Widget on Major Pages (Home, Product, Promoters, Team, Mine) */}
        {user.isLoggedIn && !subScreen && (
          <button
            onClick={() => setSubScreen('customer_service')}
            className="fixed bottom-20 right-3.5 z-40 flex items-center gap-2 p-1.5 pl-2.5 pr-3.5 bg-gradient-to-r from-[#002B49] via-[#003B66] to-[#001D33] text-white rounded-full shadow-[0_10px_25px_-5px_rgba(0,43,73,0.8)] border-2 border-cyan-400/60 hover:border-cyan-300 hover:scale-105 active:scale-95 transition-all duration-200 group cursor-pointer animate-in fade-in slide-in-from-bottom-3"
            aria-label="24/7 Customer Service"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-neutral-950 shadow-md shrink-0">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80"
                alt="Customer Service Manager"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-neutral-950 rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase text-sky-300 tracking-wider flex items-center gap-1 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                24/7 LIVE
              </span>
              <span className="text-xs font-black text-white leading-tight">
                Support
              </span>
            </div>
          </button>
        )}

        {/* Redeem Gift Modal */}
        <RedeemGiftModal
          isOpen={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          onRedeem={handleRedeemGift}
          onOpenTelegram={handleOpenTelegram}
          managerTelegramUrl={platformSettings.customerServiceManagerLink || 'https://t.me/Abigail_faith56'}
        />

        {/* Dynamic Advertising Flyer Studio Modal */}
        <FlyerModal
          isOpen={showFlyerModal}
          onClose={() => setShowFlyerModal(false)}
          user={user}
          platformSettings={platformSettings}
        />

        {/* Telegram Group Popup Flyer Modal */}
        <TelegramGroupFlyerModal
          isOpen={showTelegramGroupFlyer}
          onClose={() => setShowTelegramGroupFlyer(false)}
          groupLink={platformSettings.telegramGroupLink || 'https://t.me/teslainvestment456'}
        />
      </div>
    </div>
  );
}
