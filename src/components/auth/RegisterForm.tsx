'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleSignInButton } from './GoogleSignInButton';

export function RegisterForm() {
  const { register, user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect when user is set (works for both email and Google sign-in)
  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, displayName);
      // Navigation handled by useEffect above
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/email-already-in-use') {
        setError('האימייל כבר רשום — נסה להתחבר');
      } else if (code === 'auth/weak-password') {
        setError('הסיסמה חלשה מדי — לפחות 6 תווים');
      } else {
        setError(t('registerError'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/6 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-6 shadow-2xl shadow-black/40">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v13m0-13V6a4 4 0 00-4-4H6a2 2 0 00-2 2v2m8 0V6a4 4 0 014-4h2a2 2 0 012 2v2M5 12h14M5 12a2 2 0 01-2-2V8m2 4v8a2 2 0 002 2h6a2 2 0 002-2v-8M5 12H3m16 0h2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">{t('appName')}</h1>
          <p className="text-zinc-500 text-sm mt-1">{t('register')}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label={t('displayName')}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <Input
            label={t('email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label={t('password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
          />
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <Button type="submit" loading={loading} size="lg" className="w-full">
            {t('register')}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-xs text-zinc-600">OR</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        <GoogleSignInButton />

        <p className="text-center text-sm text-zinc-500">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
