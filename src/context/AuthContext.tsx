'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleToken: (idToken: string | null, accessToken?: string | null) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signInWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signInWithGoogleToken: async () => {},
  register: async () => {},
  signOut: async () => {},
});

async function upsertUserDoc(user: User) {
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        email: user.email,
        displayName: user.displayName || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // Non-critical — auth still works without the user doc
  }
}

async function applyPendingShares(user: User) {
  try {
    const idToken = await user.getIdToken();
    await fetch('/api/share-all/apply-pending', {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
    });
  } catch {
    // Non-critical
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Purge any stale Firebase redirect state left over from previous
    // signInWithRedirect attempts. Without this, Firebase SDK auto-processes
    // the stored state on every page load and hijacks navigation.
    try {
      for (const store of [localStorage, sessionStorage]) {
        const toRemove: string[] = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i) ?? '';
          if (k.startsWith('firebase') &&
              (k.includes('pendingRedirect') || k.includes('redirectUser'))) {
            toRemove.push(k);
          }
        }
        toRemove.forEach((k) => store.removeItem(k));
      }
      // Also strip #stck_rt= from the URL if present
      if (window.location.hash.includes('stck_rt')) {
        window.history.replaceState(
          null, '', window.location.pathname + window.location.search
        );
      }
    } catch { /* storage may be blocked in some browsers */ }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signInWithEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  // Google sign-in is handled directly in GoogleSignInButton via signInWithPopup
  async function signInWithGoogle() {}

  async function signInWithGoogleToken(idToken: string | null, accessToken?: string | null) {
    const credential = GoogleAuthProvider.credential(idToken, accessToken ?? undefined);
    const result = await signInWithCredential(auth, credential);
    await upsertUserDoc(result.user);
    applyPendingShares(result.user);
  }

  async function register(email: string, password: string, displayName: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await upsertUserDoc(result.user);
    applyPendingShares(result.user); // fire-and-forget
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signInWithGoogle, signInWithGoogleToken, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
