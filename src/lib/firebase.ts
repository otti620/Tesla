import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  setLogLevel,
  Firestore,
} from 'firebase/firestore';

import { cleanNigerianPhoneDigits } from '../utils/adminAuth';

import firebaseAppletConfig from '../../firebase-applet-config.json';

// Suppress internal @firebase/firestore 10s offline/WebChannel console.error spam
// so the app smoothly operates with its offline/local fallback without triggering error overlays
try {
  setLogLevel('silent');
} catch {
  // ignore
}

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  projectId: firebaseAppletConfig.projectId,
  storageBucket: firebaseAppletConfig.storageBucket,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
  appId: firebaseAppletConfig.appId,
  measurementId: firebaseAppletConfig.measurementId,
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Safely initialize Analytics if supported in current browser runtime
export const analyticsPromise = isSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch(() => null);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore with memoryLocalCache so cross-origin iframe IndexedDB
// restrictions never abort Firestore transactions (local persistence is handled synchronously via localStorage)
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      localCache: memoryLocalCache(),
      experimentalAutoDetectLongPolling: true,
    },
    firebaseAppletConfig.firestoreDatabaseId
  );
} catch {
  firestoreDb = getFirestore(app, firebaseAppletConfig.firestoreDatabaseId);
}

export const db = firestoreDb;

/**
 * Helper that races a Firestore operation against a short timeout so offline
 * or restricted connections immediately fall back to local state without hanging.
 */
export function withFirestoreTimeout<T>(promise: Promise<T>, timeoutMs = 2500): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Firestore operation timed out'));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Normalizes any phone number format (+234 707..., 0707..., 234..., 707...) into
 * a standard, deterministic Firebase Auth email address.
 * Example: "+234 7077599057" -> "user_7077599057@tesla-90.firebaseapp.com"
 */
export function phoneToAuthEmail(phone: string): string {
  const digits = cleanNigerianPhoneDigits(phone);
  if (!digits || digits.length < 7) {
    throw new Error('Please enter a valid Nigerian phone number.');
  }
  return `user_${digits}@tesla-90.firebaseapp.com`;
}

/**
 * Authenticates an existing user via Phone-as-Email credentials
 */
export async function loginWithPhone(phone: string, password: string) {
  const email = phoneToAuthEmail(phone);
  return await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Registers a new user via Phone-as-Email credentials
 */
export async function registerWithPhone(phone: string, password: string) {
  const email = phoneToAuthEmail(phone);
  return await createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Signs out the current user session
 */
export async function logoutUser() {
  return await signOut(auth);
}
