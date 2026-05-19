'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            ux_mode?: string;
            login_uri?: string;
            callback?: (r: { credential: string }) => void;
          }) => void;
          renderButton: (el: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

export function GoogleSignInButton() {
  const { signInWithGoogleToken } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle return from Google redirect (credential in query param)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gisCredential = params.get('_gis');
    if (gisCredential) {
      window.history.replaceState({}, '', '/login');
      signInWithGoogleToken(gisCredential).catch(() => {});
    }
  }, [signInWithGoogleToken]);

  useEffect(() => {
    function initButton() {
      if (!window.google?.accounts?.id || !containerRef.current) return;

      const loginUri = `${window.location.origin}/api/auth/google`;

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        ux_mode: 'redirect',
        login_uri: loginUri,
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: containerRef.current.offsetWidth || 320,
        logo_alignment: 'center',
      });
    }

    if (window.google?.accounts?.id) {
      initButton();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initButton;
    document.head.appendChild(script);
  }, []);

  return <div ref={containerRef} className="w-full" />;
}
