import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ─── Purge stale signInWithRedirect state BEFORE getAuth() runs ──────────────
// Firebase Auth reads pendingRedirect from storage synchronously during
// getAuth() and will silently re-trigger the old redirect flow if it finds
// anything there. Wipe those keys here — the earliest possible moment.
if (typeof window !== 'undefined') {
  try {
    for (const store of [localStorage, sessionStorage]) {
      for (let i = store.length - 1; i >= 0; i--) {
        const k = store.key(i) ?? '';
        if (k.startsWith('firebase') &&
            (k.includes('pendingRedirect') || k.includes('redirectUser'))) {
          store.removeItem(k);
        }
      }
    }
  } catch { /* storage blocked */ }

  // Firebase also persists redirect state in IndexedDB ('firebaseLocalStorage').
  // Delete the whole DB so getAuth() finds nothing to auto-process.
  try {
    indexedDB.deleteDatabase('firebaseLocalStorage');
  } catch { /* IDB unavailable */ }
}
// ─────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
