'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [newBalance, setNewBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-select the card number when modal opens
  useEffect(() => {
    if (showModal) {
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
      setNewBalance('');
      setShowModal(true);
    } catch {
      showToast(t('genericError'), 'error');
    } finally {
      setLoading(false);
    }
  }

  // Copy number to clipboard then open multipass (works great on mobile)
  async function handleCopyAndOpen() {
    try {
      await navigator.clipboard.writeText(cardNumber);
      showToast(t('numberCopied'));
    } catch {
      // clipboard blocked on corporate PC — number is visible and selected below
    }
    window.open(MULTIPASS_URL, '_blank', 'noopener,noreferrer');
  }

  async function handleSaveBalance() {
    const amount = parseFloat(newBalance);
    if (isNaN(amount) || amount < 0) {
      showToast('הכנס סכום תקין', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateCardAmount(cardId, amount);
      onBalanceFetched?.(amount);
      showToast('היתרה עודכנה בהצלחה ✅');
      setShowModal(false);
    } catch {
      showToast(t('genericError'), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (showModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
          <h3 className="font-semibold text-gray-900 text-center">בירור יתרה</h3>

          {/* Step 1: Copy number and open multipass */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs font-medium text-blue-700 text-center">שלב 1 — העתק את המספר ובדוק יתרה</p>

            <div
              className="bg-white border-2 border-blue-300 rounded-xl p-3 text-center cursor-text"
              onClick={() => { inputRef.current?.focus(); inputRef.current?.select(); }}
            >
              <input
                ref={inputRef}
                readOnly
                value={cardNumber}
                dir="ltr"
                className="w-full bg-transparent font-mono text-xl font-bold tracking-widest text-blue-700 text-center outline-none select-all"
              />
              <p className="text-xs text-gray-400 mt-1">מסומן — Ctrl+C במחשב</p>
            </div>

            <Button onClick={handleCopyAndOpen} className="w-full">
              📋 העתק ופתח מולטיפס
            </Button>
          </div>

          {/* Step 2: Enter balance after checking */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs font-medium text-gray-600 text-center">שלב 2 — הכנס את היתרה שראית באתר</p>

            <div className="flex gap-2 items-center">
              <span className="text-gray-500 font-medium">₪</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveBalance()}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-lg font-medium text-center outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                dir="ltr"
              />
            </div>

            <Button
              onClick={handleSaveBalance}
              loading={saving}
              disabled={!newBalance}
              className="w-full"
            >
              💾 שמור יתרה
            </Button>
          </div>

          <Button variant="secondary" onClick={() => setShowModal(false)} className="w-full">
            {t('cancel')}
          </Button>
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
