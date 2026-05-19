'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleSignInButton } from './GoogleSignInButton';

export function LoginForm() {
  const { signInWithEmail, user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.replace('/dashboard');
    } catch {
      setError(t('loginError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/6 rounded-2xl shadow-2xl shadow-black/60 p-8 w-full max-w-sm flex flex-col gap-6 animate-fade-in">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30">
            🎁
          </div>
          <h1 className="text-xl font-bold text-zinc-50">{t('appName')}</h1>
          <p className="text-zinc-500 text-sm mt-1">{t('login')}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input label={t('email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <Input label={t('password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
            {t('login')}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/6" />
          <span className="text-xs text-zinc-600">OR</span>
          <div className="flex-1 h-px bg-white/6" />
        </div>

        <GoogleSignInButton />

        <p className="text-center text-sm text-zinc-600">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
