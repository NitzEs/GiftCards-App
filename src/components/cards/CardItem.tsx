'use client';

import { useState } from 'react';
import { GiftCard } from '@/types/card';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { EditAmountInline } from './EditAmountInline';
import { DeleteCardDialog } from './DeleteCardDialog';
import { ShareCardModal } from './ShareCardModal';
import { BalanceCheckButton } from './BalanceCheckButton';

interface CardItemProps {
  card: GiftCard;
}

export function CardItem({ card }: CardItemProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showDelete, setShowDelete] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const isOwner = user?.uid === card.ownerId;
  const isShared = !isOwner;
  const canEdit = isOwner || card.sharedWith.includes(user?.uid ?? '');

  // Calculate usage percentage
  const usedPercent = card.originalAmount > 0
    ? Math.max(0, Math.min(100, ((card.originalAmount - card.amount) / card.originalAmount) * 100))
    : 0;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">{card.name}</h3>
            {isShared && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full w-fit">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('sharedBadge')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isOwner && (
              <>
                <button
                  onClick={() => setShowShare(true)}
                  title={t('share')}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  title={t('delete')}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Card number (masked) */}
        <div className="font-mono text-gray-500 text-sm tracking-widest" dir="ltr">
          •••• •••• •••• {card.numberLast4}
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${100 - usedPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{t('balance')}</span>
            <span>{t('originalAmount')}: ₪{card.originalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Amount + expiry */}
        <div className="flex items-end justify-between">
          <EditAmountInline cardId={card.id} amount={card.amount} isOwnerOrShared={canEdit} />
          <span className="text-sm text-gray-400" dir="ltr">{card.expiry}</span>
        </div>

        {/* Balance check */}
        <div className="border-t border-gray-50 pt-3">
          <BalanceCheckButton cardId={card.id} />
        </div>
      </div>

      <DeleteCardDialog
        open={showDelete}
        cardId={card.id}
        cardName={card.name}
        onClose={() => setShowDelete(false)}
      />
      <ShareCardModal
        open={showShare}
        cardId={card.id}
        onClose={() => setShowShare(false)}
      />
    </>
  );
}
