'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  signInWithGoogleToken: (idToken: string) => Promise<void>;
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
    // Handle result from signInWithRedirect (fires on page load after redirect)
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        await upsertUserDoc(result.user);
        applyPendingShares(result.user);
      }
    }).catch(() => {});

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signInWithEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    await upsertUserDoc(result.user);
    applyPendingShares(result.user);
  }

  async function signInWithGoogleToken(idToken: string) {
    const credential = GoogleAuthProvider.credential(idToken);
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
