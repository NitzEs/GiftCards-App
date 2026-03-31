'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import { Button } from '@/components/ui/Button';

export function Header({ onAddCard }: { onAddCard?: () => void }) {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎁</span>
          <h1 className="text-lg font-bold text-gray-900">{t('appName')}</h1>
        </div>

        <div className="flex items-center gap-2">
          {onAddCard && (
            <Button onClick={onAddCard} size="sm">
              + {t('addCard')}
            </Button>
          )}
          <LanguageToggle />
          {user && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[140px]">
                {user.displayName || user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                {t('logout')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
