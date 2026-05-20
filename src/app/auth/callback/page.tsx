'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function GoogleCallbackPage() {
  const { signInWithGoogleToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const hash = window.location.hash;
    const query = window.location.search;

    // Parse token from fragment (#access_token=...) or query (?access_token=...)
    const params = new URLSearchParams(hash ? hash.slice(1) : query.slice(1));
    const accessToken = params.get('access_token');
    const errorParam = params.get('error');

    if (errorParam || !accessToken) {
      router.replace('/login');
      return;
    }

    // Verify CSRF state
    const returnedState = params.get('state');
    const savedState = sessionStorage.getItem('google_oauth_state');
    if (returnedState && savedState && returnedState !== savedState) {
      setError('שגיאת אבטחה — נסה שוב');
      setTimeout(() => router.replace('/login'), 2000);
      return;
    }
    sessionStorage.removeItem('google_oauth_state');

    signInWithGoogleToken(null, accessToken)
      .then(() => router.replace('/dashboard'))
      .catch(() => {
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
