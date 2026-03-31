'use client';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';

export function EmptyState({ onAddCard }: { onAddCard: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="text-7xl">🎁</div>
      <h2 className="text-xl font-semibold text-gray-700">{t('emptyTitle')}</h2>
      <p className="text-gray-400 text-sm">{t('emptySubtitle')}</p>
      <Button onClick={onAddCard} size="lg">
        {t('addCard')}
      </Button>
    </div>
  );
}
