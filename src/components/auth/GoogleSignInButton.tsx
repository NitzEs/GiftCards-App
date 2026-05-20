'use client';

import { useState, useEffect, useRef } from 'react';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const router = useRouter();
  const popupRef = useRef<Window | null>(null);

  // Listen for the id_token message sent back by the popup callback page
  useEffect(() => {
    async function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'google-auth-token') return;

      const { idToken } = event.data as { idToken: string };

      try {
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);

        // Upsert user doc (non-critical)
        try {
          await setDoc(
            doc(db, 'users', result.user.uid),
            { email: result.user.email, displayName: result.user.displayName || '', updatedAt: serverTimestamp() },
            { merge: true }
          );
        } catch { /* non-critical */ }

        // Apply pending shares (fire-and-forget)
        try {
          const token = await result.user.getIdToken();
          fetch('/api/share-all/apply-pending', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        } catch { /* non-critical */ }

        router.replace('/dashboard');
      } catch (err) {
        console.error('Firebase credential sign-in failed:', err);
        setError('שגיאה בהתחברות — נסה שוב');
        setLoading(false);
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [router]);

  function handleClick() {
    setLoading(true);
    setError('');

    const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('google_oauth_state', state);

    // Build the Google OAuth URL — redirect_uri points to our popup-callback page
    const params = new URLSearchParams({
      client_id:     process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      redirect_uri:  `${window.location.origin}/auth/google-popup`,
      response_type: 'code',
      scope:         'openid email profile',
      prompt:        'select_account',
      state,
      access_type:   'online',
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    // Open a popup DIRECTLY to accounts.google.com — no Firebase handler in the middle.
    // Google sees the user's cookies in a first-party popup context → account chooser.
    const w = 500, h = 600;
    const left = Math.round(window.screenX + (window.outerWidth  - w) / 2);
    const top  = Math.round(window.screenY + (window.outerHeight - h) / 2);

    const popup = window.open(
      url,
      'google-signin',
      `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=yes,scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      // Popup blocked — fall back to full-page redirect
      window.location.href = url.replace(
        `${window.location.origin}/auth/google-popup`,
        `${window.location.origin}/api/auth/google`
      );
      return;
    }

    popupRef.current = popup;

    // Detect if user closes popup without finishing
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        setLoading(false);
      }
    }, 500);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl px-4 py-3 transition border border-gray-200 shadow-sm disabled:opacity-60"
      >
        {loading ? (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        <span>{loading ? 'מתחבר...' : 'המשך עם Google'}</span>
      </button>
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
    </div>
  );
}
