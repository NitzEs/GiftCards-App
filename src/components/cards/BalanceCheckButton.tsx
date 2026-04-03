'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { updateCardAmount } from '@/lib/firestore/cards';

interface BalanceCheckButtonProps {
  cardId: string;
  onBalanceFetched?: (balance: number) => void;
}

const MULTIPASS_URL = 'https://multipass.co.il/GetBalance';

export function BalanceCheckButton({ cardId, onBalanceFetched }: BalanceCheckButtonProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');

  async function handleClick() {
    if (!user) return;
    setLoading(true);
    try {
      const idToken = await user.getIdToken();

      // Get the decrypted card number from server
      const numRes = await fetch(`/api/cards/${cardId}/number`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!numRes.ok) throw new Error('fetch-number-failed');
      const { number } = await numRes.json() as { number: string };
      const cleanNumber = number.replace(/-/g, '');

      // Show modal with the number
      setCardNumber(cleanNumber);
      setShowModal(true);

    } catch {
      showToast(t('genericError'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyAndOpen() {
    try {
      await navigator.clipboard.writeText(cardNumber);
      showToast(t('numberCopied'));
    } catch {
      // clipboard failed — number is visible in the modal
    }
    window.open(MULTIPASS_URL, '_blank', 'noopener,noreferrer');
    setShowModal(false);
  }

  if (showModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
          <h3 className="font-semibold text-gray-900">מספר הכרטיס לבירור יתרה</h3>

          {/* Number display — tap to select */}
          <div
            className="bg-gray-50 border-2 border-blue-200 rounded-xl p-4 text-center cursor-pointer"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(cardNumber);
                showToast(t('numberCopied'));
              } catch { /* ignore */ }
            }}
          >
            <p className="font-mono text-2xl font-bold tracking-widest text-blue-700 select-all" dir="ltr">
              {cardNumber}
            </p>
            <p className="text-xs text-gray-400 mt-1">לחץ להעתקה</p>
          </div>

          <p className="text-sm text-gray-500 text-center">
            לאחר העתקה — הכנס מספר זה בשדה באתר מולטיפס
          </p>

          <div className="flex flex-col gap-2">
            <Button onClick={handleCopyAndOpen} className="w-full">
              📋 העתק ופתח את מולטיפס
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)} className="w-full">
              {t('cancel')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} loading={loading} title={t('checkBalance')}>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {t('checkBalance')}
    </Button>
  );
}
