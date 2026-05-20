'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

/* ── GIS type shim ──────────────────────────────────────────────────── */
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (error: { type: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

export function GoogleSignInButton() {
  const { signInWithGoogleToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const tokenClientRef = useRef<{ requestAccessToken: () => void } | null>(null);
  const gisReady = useRef(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    function setup() {
      if (!window.google || gisReady.current) return;
      gisReady.current = true;

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId!,
        scope: 'openid email profile',
        callback: async (response) => {
          if (!response.access_token) {
            setLoading(false);
            setError('שגיאה בהתחברות — נסה שוב');
            return;
          }
          try {
            await signInWithGoogleToken(null, response.access_token);
            // Navigation handled by useEffect in the form (user state change)
          } catch {
            setError('שגיאה בהתחברות — נסה שוב');
          } finally {
            setLoading(false);
          }
        },
        error_callback: (err) => {
          setLoading(false);
          if (err.type !== 'popup_closed' && err.type !== 'popup_failed_to_open') {
            setError('שגיאה בהתחברות — נסה שוב');
          }
        },
      });
    }

    // GIS may already be loaded (if script was added earlier)
    if (window.google) {
      setup();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src*="accounts.google.com/gsi/client"]'
      );
      if (existing) {
        existing.addEventListener('load', setup, { once: true });
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = setup;
        document.head.appendChild(script);
      }
    }
  }, [signInWithGoogleToken]);

  function handleClick() {
    if (!tokenClientRef.current) return;
    setError('');
    setLoading(true);
    tokenClientRef.current.requestAccessToken();
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
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
