'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Header } from '@/components/layout/Header';
import { CardList } from '@/components/cards/CardList';
import { AddCardModal } from '@/components/cards/AddCardModal';
import { ShareAllModal } from '@/components/cards/ShareAllModal';
import { useCards } from '@/hooks/useCards';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [showShareAll, setShowShareAll] = useState(false);
  const { cards, loading } = useCards();
  const { t } = useLanguage();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header onAddCard={() => setShowAdd(true)} />
        <main className="max-w-5xl mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center py-24">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <>
              {cards.length > 0 && (
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-700">
                    {t('myCards')} ({cards.length})
                  </h2>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-400">
                      {t('balance')}: ₪{cards.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => setShowShareAll(true)}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      שתף רשימה
                    </Button>
                  </div>
                </div>
              )}
              <CardList cards={cards} onAddCard={() => setShowAdd(true)} />
            </>
          )}
        </main>
        <AddCardModal open={showAdd} onClose={() => setShowAdd(false)} />
        <ShareAllModal open={showShareAll} onClose={() => setShowShareAll(false)} />
      </div>
    </AuthGuard>
  );
}
