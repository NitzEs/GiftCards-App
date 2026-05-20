'use client';

/**
 * Popup callback page for Google OAuth.
 * Google redirects here with ?code=... after the user picks an account.
 * This page exchanges the code for an id_token via /api/auth/google-token,
 * posts the token back to the opener window, then closes itself.
 */

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function GooglePopupCallback() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code  = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      window.opener?.postMessage(
        { type: 'google-auth-error', error: error ?? 'no_code' },
        window.location.origin
      );
      window.close();
      return;
    }

    // Exchange the auth code for an id_token server-side
    fetch(`/api/auth/google-token?code=${encodeURIComponent(code)}`)
      .then((res) => res.json())
      .then(({ idToken, error: apiError }) => {
        if (idToken) {
          window.opener?.postMessage(
            { type: 'google-auth-token', idToken },
            window.location.origin
          );
        } else {
          window.opener?.postMessage(
            { type: 'google-auth-error', error: apiError ?? 'no_token' },
            window.location.origin
          );
        }
      })
      .catch(() => {
        window.opener?.postMessage(
          { type: 'google-auth-error', error: 'exchange_failed' },
          window.location.origin
        );
      })
      .finally(() => {
        window.close();
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-zinc-400 text-sm">מתחבר עם Google...</p>
      </div>
    </div>
  );
}

export default function GooglePopupPage() {
  return (
    <Suspense>
      <GooglePopupCallback />
    </Suspense>
  );
}
