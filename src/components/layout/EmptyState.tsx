'use client';

import { useLanguage } from '@/context/LanguageContext';

export function EmptyState({ onAddCard }: { onAddCard: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-4xl">
        🎁
      </div>
      <div>
        <h2 className="text-xl font-semibold text-zinc-200 mb-2">{t('emptyTitle')}</h2>
        <p className="text-zinc-500 text-sm">{t('emptySubtitle')}</p>
      </div>
      <button
        onClick={onAddCard}
        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-medium px-6 py-3 rounded-2xl transition-colors shadow-lg shadow-indigo-500/20 text-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        {t('addCard')}
      </button>
    </div>
  );
}
