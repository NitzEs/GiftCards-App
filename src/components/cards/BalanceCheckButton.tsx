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
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-select the number when modal opens — user can press Ctrl+C immediately
  useEffect(() => {
    if (showModal && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
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
      const cleanNumber = number.replace(/-/g, '');

      setCardNumber(cleanNumber);
      setCopied(false);
      setCopyStatus('');
      setShowModal(true);

    } catch {
      showToast(t('genericError'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    // Re-select the input before trying to copy
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      inputRef.current.setSelectionRange(0, 99999);
    }

    // Try modern Clipboard API — called directly from click, no preceding await
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(cardNumber);
        setCopied(true);
        setCopyStatus('clipboard-api');
        showToast(t('numberCopied'));
        return;
      } catch (err) {
        setCopyStatus('clipboard-api-failed: ' + String(err));
      }
    }

    // Fallback: execCommand on the already-selected input
    try {
      const ok = document.execCommand('copy');
      if (ok) {
        setCopied(true);
        setCopyStatus('execCommand');
        showToast(t('numberCopied'));
        return;
      }
      setCopyStatus('execCommand-returned-false');
    } catch (err) {
      setCopyStatus('execCommand-threw: ' + String(err));
    }

    // Both failed — number is selected, user can press Ctrl+C manually
    showToast('לא הצליח להעתיק אוטומטית — לחץ Ctrl+C', 'error');
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
          <h3 className="font-semibold text-gray-900">מספר הכרטיס לבירור יתרה</h3>

          {/* Visible input — styled like before, auto-selected on open */}
          <div className="bg-gray-50 border-2 border-blue-200 rounded-xl p-4 text-center">
            <input
              ref={inputRef}
              readOnly
              value={cardNumber}
              dir="ltr"
              className="w-full bg-transparent font-mono text-2xl font-bold tracking-widest text-blue-700 text-center outline-none cursor-pointer select-all"
              onClick={handleCopy}
            />
            <p className="text-xs text-gray-400 mt-1">לחץ להעתקה</p>
          </div>

          {/* Debug info — remove after fix confirmed */}
          {copyStatus ? (
            <p className="text-xs text-orange-500 text-center break-all">{copyStatus}</p>
          ) : null}

          <div className="flex flex-col gap-2">
            <Button onClick={handleCopy} className="w-full">
              {copied ? '✅ הועתק!' : '📋 העתק מספר'}
            </Button>

            <Button
              onClick={handleOpenMultipass}
              variant={copied ? 'primary' : 'secondary'}
              className="w-full"
            >
              🌐 פתח את מולטיפס
            </Button>

            <Button variant="secondary" onClick={() => setShowModal(false)} className="w-full">
              {t('cancel')}
            </Button>
          </div>

          {!copied && (
            <p className="text-xs text-gray-400 text-center">
              המספר מסומן — אפשר ללחוץ Ctrl+C ישירות
            </p>
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
