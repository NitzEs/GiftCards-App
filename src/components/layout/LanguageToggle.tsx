'use client';

import { useLanguage } from '@/context/LanguageContext';

export function LanguageToggle() {
  const { locale, toggleLocale } = useLanguage();
  return (
    <button
      onClick={toggleLocale}
      className="text-sm font-medium text-gray-500 hover:text-gray-700 transition px-2 py-1 rounded-lg hover:bg-gray-100"
    >
      {locale === 'he' ? 'EN' : 'עב'}
    </button>
  );
}
