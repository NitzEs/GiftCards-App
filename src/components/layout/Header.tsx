'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';

export function Header({ onAddCard }: { onAddCard?: () => void }) {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm shadow-lg shadow-indigo-500/20">
            🎁
          </div>
          <h1 className="text-base font-bold text-zinc-100 tracking-tight">{t('appName')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {onAddCard && (
            <button
              onClick={onAddCard}
              className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium px-3.5 py-2 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t('addCard')}
            </button>
          )}
          <LanguageToggle />
          {user && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-sm text-zinc-400 truncate max-w-[140px]">
                {user.displayName || user.email}
              </span>
              <button
                onClick={signOut}
                className="text-zinc-500 hover:text-zinc-300 text-sm px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
