import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ─── Purge stale signInWithRedirect state from localStorage/sessionStorage ───
// Must run BEFORE initializeAuth so the SDK finds nothing to auto-process.
// We also use browserLocalStoragePersistence only (no IndexedDB) so Firebase
// never reads stale redirect state stored in IndexedDB from old sessions.
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

// Use initializeAuth (not getAuth) to restrict persistence to localStorage only.
// This means Firebase NEVER reads from IndexedDB — old redirect state stored
// there from previous signInWithRedirect calls is completely ignored on load.
function buildAuth() {
  try {
    return initializeAuth(app, {
      persistence: [browserLocalPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    // Already initialized (hot reload / StrictMode double-init)
    return getAuth(app);
  }
}

export const auth = buildAuth();
export const db = getFirestore(app);
