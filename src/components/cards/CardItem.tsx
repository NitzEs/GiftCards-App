'use client';

import { useState } from 'react';
import { GiftCard } from '@/types/card';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { EditAmountInline } from './EditAmountInline';
import { DeleteCardDialog } from './DeleteCardDialog';
import { ShareCardModal } from './ShareCardModal';
import { BalanceCheckButton } from './BalanceCheckButton';

const GRADIENTS = [
  { from: '#6366f1', to: '#8b5cf6' },
  { from: '#10b981', to: '#0d9488' },
  { from: '#f43f5e', to: '#ec4899' },
  { from: '#f59e0b', to: '#ef4444' },
  { from: '#3b82f6', to: '#6366f1' },
  { from: '#06b6d4', to: '#3b82f6' },
];

function getGradient(name: string) {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

export function CardItem({ card }: { card: GiftCard }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showDelete, setShowDelete] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const isOwner = user?.uid === card.ownerId;
  const isShared = !isOwner;
  const canEdit = isOwner || card.sharedWith.includes(user?.uid ?? '');
  const { from, to } = getGradient(card.name);
  const remainingPct = card.originalAmount > 0
    ? Math.max(0, Math.min(100, (card.amount / card.originalAmount) * 100))
    : 100;

  return (
    <>
      <div className="flex flex-col rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/60 animate-fade-in">

        {/* Card face */}
        <div
          className="relative p-5 flex flex-col justify-between overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${from}, ${to})`,
            minHeight: '160px',
          }}
        >
          {/* Gloss */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent pointer-events-none" />
          {/* Circle decoration */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-black/10 pointer-events-none" />

          {/* Top: name + actions */}
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-white text-lg leading-tight drop-shadow">{card.name}</h3>
              {isShared && (
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  משותף
                </span>
              )}
            </div>
            {isOwner && (
              <div className="flex gap-1">
                <button onClick={() => setShowShare(true)} className="p-1.5 bg-white/15 hover:bg-white/25 rounded-lg transition backdrop-blur-sm" title={t('share')}>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </button>
                <button onClick={() => setShowDelete(true)} className="p-1.5 bg-white/15 hover:bg-red-500/40 rounded-lg transition backdrop-blur-sm" title={t('delete')}>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            )}
          </div>

          {/* Card number */}
          <div className="relative font-mono text-white/60 text-sm tracking-[0.25em] mt-3" dir="ltr">
            •••• •••• •••• {card.numberLast4}
          </div>

          {/* Bottom: balance + expiry */}
          <div className="relative flex items-end justify-between mt-4">
            <div>
              <p className="text-white/50 text-xs mb-0.5">יתרה</p>
              <p className="text-white font-bold text-2xl leading-none drop-shadow">
                ₪{card.amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-xs mb-0.5">תוקף</p>
              <p className="text-white/90 font-mono text-sm" dir="ltr">{card.expiry}</p>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="p-4 flex flex-col gap-3">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
              <span>{Math.round(remainingPct)}% נותר</span>
              <span>מתוך ₪{card.originalAmount.toLocaleString()}</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1">
              <div
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: `${remainingPct}%`,
                  background: `linear-gradient(to right, ${from}, ${to})`,
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <EditAmountInline cardId={card.id} amount={card.amount} isOwnerOrShared={canEdit} />
            <BalanceCheckButton cardId={card.id} />
          </div>
        </div>
      </div>

      <DeleteCardDialog open={showDelete} cardId={card.id} cardName={card.name} onClose={() => setShowDelete(false)} />
      <ShareCardModal open={showShare} cardId={card.id} onClose={() => setShowShare(false)} />
    </>
  );
}
