'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Handles the final step of Google Sign-In:
 * – Reads the id_token from the short-lived cookie set by /api/auth/google
 * – Signs into Firebase via signInWithGoogleToken
 * – Redirects to /dashboard on success
 */
export default function GoogleCallbackPage() {
  const { signInWithGoogleToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    // Read cookie set by /api/auth/google
    const cookies = Object.fromEntries(
      document.cookie.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );

    const idToken = cookies['google_id_token'];

    if (!idToken) {
      // Nothing to process — go back to login
      router.replace('/login');
      return;
    }

    // Consume the cookie immediately
    document.cookie = 'google_id_token=; Max-Age=0; path=/';

    signInWithGoogleToken(idToken, null)
      .then(() => router.replace('/dashboard'))
      .catch((err) => {
        console.error('Firebase sign-in failed:', err);
        setError('שגיאה בהתחברות — נסה שוב');
        setTimeout(() => router.replace('/login'), 2500);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center">
      {error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-zinc-400 text-sm">מתחבר עם Google...</p>
        </div>
      )}
    </div>
  );
}
