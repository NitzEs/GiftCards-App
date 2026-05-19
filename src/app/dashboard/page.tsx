'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Header } from '@/components/layout/Header';
import { CardList } from '@/components/cards/CardList';
import { AddCardModal } from '@/components/cards/AddCardModal';
import { ShareAllModal } from '@/components/cards/ShareAllModal';
import { useCards } from '@/hooks/useCards';
import { useLanguage } from '@/context/LanguageContext';

export default function DashboardPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [showShareAll, setShowShareAll] = useState(false);
  const { cards, loading } = useCards();
  const { t } = useLanguage();
  const total = cards.reduce((s, c) => s + c.amount, 0);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0f0f11]">
        <Header onAddCard={() => setShowAdd(true)} />

        {/* Stats banner */}
        {!loading && cards.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-white/5">
            <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">{t('balance')} כולל</p>
                <p className="text-3xl font-bold text-white tracking-tight">
                  ₪{total.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-zinc-500 text-xs">{t('myCards')}</p>
                  <p className="text-xl font-bold text-zinc-200">{cards.length}</p>
                </div>
                <button
                  onClick={() => setShowShareAll(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-indigo-400 bg-white/5 hover:bg-indigo-500/10 px-3 py-2 rounded-xl transition-colors border border-white/5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  שתף רשימה
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="max-w-5xl mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center py-32">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            </div>
          ) : (
            <CardList cards={cards} onAddCard={() => setShowAdd(true)} />
          )}
        </main>

        <AddCardModal open={showAdd} onClose={() => setShowAdd(false)} />
        <ShareAllModal open={showShareAll} onClose={() => setShowShareAll(false)} />
      </div>
    </AuthGuard>
  );
}
