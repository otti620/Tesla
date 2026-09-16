import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  collection,
  onSnapshot 
} from 'firebase/firestore';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAQ0HiUMzTZdk-2QqirTWL8QG1uB9lEJkU",
  authDomain: "tesla-90.firebaseapp.com",
  projectId: "tesla-90",
  storageBucket: "tesla-90.firebasestorage.app",
  messagingSenderId: "1037292422450",
  appId: "1:1037292422450:web:92e3efd6b2cc07c8cc432b",
  measurementId: "G-10H7LT9KYZ"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Safely initialize Analytics if supported in current browser runtime
export const analyticsPromise = isSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch(() => null);

// Initialize Firebase Authentication - STRICTLY NO ANONYMOUS SIGNUP
export const auth = getAuth(app);

// Initialize Cloud Firestore with default database
export const db = getFirestore(app);

/**
 * Normalizes any phone number format (+234 707..., 0707..., 234..., 707...) into
 * a standard, deterministic Firebase Auth email address.
 * Example: "+234 7077599057" -> "user_7077599057@tesla-90.firebaseapp.com"
 */
export function phoneToAuthEmail(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('234')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
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
