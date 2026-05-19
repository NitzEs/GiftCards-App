'use client';

import { useLanguage } from '@/context/LanguageContext';

export function LanguageToggle() {
  const { locale, toggleLocale } = useLanguage();
  return (
    <button
      onClick={toggleLocale}
      className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition px-2 py-1 rounded-lg hover:bg-white/5"
    >
      {locale === 'he' ? 'EN' : 'עב'}
    </button>
  );
}
