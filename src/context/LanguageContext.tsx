'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { he } from '@/i18n/he';
import { en } from '@/i18n/en';

type Locale = 'he' | 'en';
type Strings = typeof he;

interface LanguageContextValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  t: (key: keyof Strings) => string;
  toggleLocale: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'he',
  dir: 'rtl',
  t: (key) => he[key],
  toggleLocale: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('he');

  const dir = locale === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  function t(key: keyof Strings): string {
    const strings = locale === 'he' ? he : en;
    return strings[key] as string;
  }

  function toggleLocale() {
    setLocale((prev) => (prev === 'he' ? 'en' : 'he'));
  }

  return (
    <LanguageContext.Provider value={{ locale, dir, t, toggleLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
