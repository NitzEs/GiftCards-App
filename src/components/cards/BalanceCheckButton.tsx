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

type FetchState = 'idle' | 'loading' | 'success' | 'failed';

export function BalanceCheckButton({ cardId, onBalanceFetched }: BalanceCheckButtonProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [fetchedBalance, setFetchedBalance] = useState<number | null>(null);
  const [savingBalance, setSavingBalance] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-select the number when modal opens
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
      setFetchState('idle');
      setFetchedBalance(null);
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
      // clipboard blocked (e.g. corporate PC) — number is visible below
    }
    window.open(MULTIPASS_URL, '_blank', 'noopener,noreferrer');
    setShowModal(false);
  }

  // Auto-fetch balance from multipass server-side
  async function handleAutoFetch() {
    if (!user) return;
    setFetchState('loading');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/balance?cardId=${cardId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error('fetch-failed');
      const { balance } = await res.json() as { balance: number };
      setFetchedBalance(balance);
      setFetchState('success');
      onBalanceFetched?.(balance);
    } catch {
      setFetchState('failed');
    }
  }

  async function handleSaveBalance() {
    if (fetchedBalance === null) return;
    setSavingBalance(true);
    try {
      await updateCardAmount(cardId, fetchedBalance);
      showToast('היתרה עודכנה בהצלחה ✅');
      setShowModal(false);
    } catch {
      showToast(t('genericError'), 'error');
    } finally {
      setSavingBalance(false);
    }
  }

  if (showModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
          <h3 className="font-semibold text-gray-900 text-center">בירור יתרה</h3>

          {/* ── Auto-fetch section ── */}
          {fetchState === 'idle' && (
            <Button onClick={handleAutoFetch} variant="secondary" className="w-full">
              ⚡ שאוב יתרה אוטומטית
            </Button>
          )}

          {fetchState === 'loading' && (
            <div className="flex items-center justify-center gap-2 py-2 text-blue-600">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-sm">מושך יתרה מהאתר...</span>
            </div>
          )}

          {fetchState === 'success' && fetchedBalance !== null && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">יתרה נמצאה</p>
                <p className="text-3xl font-bold text-green-600">₪{fetchedBalance.toLocaleString()}</p>
              </div>
              <Button onClick={handleSaveBalance} loading={savingBalance} className="w-full">
                💾 עדכן יתרה בכרטיס
              </Button>
              <Button variant="secondary" onClick={() => setShowModal(false)} className="w-full">
                {t('cancel')}
              </Button>
            </div>
          )}

          {fetchState === 'failed' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
              <p className="text-xs text-orange-700 mb-2">השאיבה האוטומטית לא הצליחה</p>
              <Button variant="secondary" onClick={handleAutoFetch} className="w-full text-sm">
                נסה שוב
              </Button>
            </div>
          )}

          {/* ── Manual section (always shown unless auto-fetch succeeded) ── */}
          {fetchState !== 'success' && (
            <>
              {fetchState !== 'idle' && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-400">או ידנית</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
              )}

              {/* Card number display — auto-selected for Ctrl+C */}
              <div
                className="bg-gray-50 border-2 border-blue-200 rounded-xl p-3 text-center cursor-text"
                onClick={() => { inputRef.current?.focus(); inputRef.current?.select(); }}
              >
                <input
                  ref={inputRef}
                  readOnly
                  value={cardNumber}
                  dir="ltr"
                  className="w-full bg-transparent font-mono text-xl font-bold tracking-widest text-blue-700 text-center outline-none select-all"
                />
                <p className="text-xs text-gray-400 mt-1">
                  מסומן — לחץ Ctrl+C, או לחץ על הכפתור הירוק לסלולר
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {/* Primary: copy + open (works on mobile) */}
                <Button onClick={handleCopyAndOpen} className="w-full">
                  📋 העתק ופתח מולטיפס
                </Button>
                <Button variant="secondary" onClick={() => setShowModal(false)} className="w-full">
                  {t('cancel')}
                </Button>
              </div>
            </>
          )}
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
