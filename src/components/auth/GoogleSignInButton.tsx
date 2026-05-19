'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
          }) => void;
          renderButton: (el: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

export function GoogleSignInButton() {
  const { signInWithGoogleToken } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function initButton() {
      if (!window.google?.accounts?.id || !containerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        use_fedcm_for_prompt: true,
        callback: async ({ credential }) => {
          try {
            await signInWithGoogleToken(credential);
            router.replace('/dashboard');
          } catch {}
        },
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
  }, [signInWithGoogleToken, router]);

  return <div ref={containerRef} className="w-full" />;
}
