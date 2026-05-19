'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (r: { credential: string }) => void;
            auto_select?: boolean;
            context?: string;
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
  const [error, setError] = useState('');
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    function initGIS() {
      if (!window.google?.accounts?.id || !containerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        context: 'signin',
        auto_select: true,
        callback: async (response: { credential: string }) => {
          setError('');
          try {
            await signInWithGoogleToken(response.credential);
          } catch {
            setError('שגיאה בהתחברות — נסה שוב');
          }
        },
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: Math.min(containerRef.current.offsetWidth || 320, 400),
        logo_alignment: 'left',
      });

      setRendered(true);
    }

    if (window.google?.accounts?.id) {
      initGIS();
      return;
    }

    // Load GIS script if not already loaded
    const existing = document.getElementById('gis-script');
    if (existing) {
      existing.addEventListener('load', initGIS);
      return;
    }

    const script = document.createElement('script');
    script.id = 'gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGIS;
    document.head.appendChild(script);
  }, [signInWithGoogleToken]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div
        ref={containerRef}
        className="w-full flex justify-center min-h-[44px]"
      />
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
