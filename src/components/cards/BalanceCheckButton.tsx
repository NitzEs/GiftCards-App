'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

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
  const inputRef = useRef<HTMLInputElement>(null);

  // Select the number as soon as the modal appears
  useEffect(() => {
    if (showModal) {
      // Small delay so the DOM is ready
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [showModal]);

  async function handleClick() {
    if (!user) return;
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const numRes = await fetch(`/api/cards/${cardId}/number`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!numRes.ok) throw new Error('fetch-number-failed');
      const { number } = await numRes.json() as { number: string };
      setCardNumber(number.replace(/-/g, ''));
      setShowModal(true);
    } catch {
      showToast(t('genericError'), 'error');
    } finally {
      setLoading(false);
    }
  }

  function selectNumber() {
    inputRef.current?.focus();
    inputRef.current?.select();
  }

  function handleOpenMultipass() {
    window.open(MULTIPASS_URL, '_blank', 'noopener,noreferrer');
    setShowModal(false);
  }

  if (showModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
          <h3 className="font-semibold text-gray-900 text-center">מספר הכרטיס לבירור יתרה</h3>

          {/* Number — shown in a real input so it can be selected & copied with Ctrl+C */}
          <div
            className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 text-center cursor-text"
            onClick={selectNumber}
          >
            <input
              ref={inputRef}
              readOnly
              value={cardNumber}
              dir="ltr"
              className="w-full bg-transparent font-mono text-2xl font-bold tracking-widest text-blue-700 text-center outline-none select-all"
            />
          </div>

          {/* Clear instruction */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
            <p className="text-sm font-medium text-yellow-800">
              המספר מסומן — לחץ <kbd className="bg-white border border-yellow-400 rounded px-1.5 py-0.5 font-mono text-xs">Ctrl+C</kbd> להעתקה
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              לאחר מכן פתח מולטיפס והדבק עם Ctrl+V
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={selectNumber} variant="secondary" className="w-full">
              🖱️ סמן שוב את המספר
            </Button>

            <Button onClick={handleOpenMultipass} className="w-full">
              🌐 פתח את מולטיפס
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
