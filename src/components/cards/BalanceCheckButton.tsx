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
  const [debugMsg, setDebugMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-select the input when modal opens
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
      setDebugMsg('');
      setShowModal(true);
    } catch {
      showToast(t('genericError'), 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    console.log('[Copy] cardNumber:', cardNumber);
    console.log('[Copy] isSecureContext:', window.isSecureContext);
    console.log('[Copy] clipboard available:', !!navigator.clipboard);

    // Plain synchronous call — no await before this, user gesture intact
    navigator.clipboard.writeText(cardNumber)
      .then(() => {
        console.log('[Copy] clipboard.writeText resolved OK');
        setCopied(true);
        setDebugMsg('clipboard-api: OK');
        showToast(t('numberCopied'));
      })
      .catch((err: unknown) => {
        const msg = String(err);
        console.error('[Copy] clipboard.writeText failed:', msg);
        setDebugMsg('clipboard-api FAILED: ' + msg);

        // execCommand fallback
        const input = inputRef.current;
        if (input) {
          input.focus();
          input.select();
          input.setSelectionRange(0, 99999);
          let ok = false;
          try { ok = document.execCommand('copy'); } catch { /* ignore */ }
          console.log('[Copy] execCommand result:', ok);
          if (ok) {
            setCopied(true);
            setDebugMsg('execCommand: OK');
            showToast(t('numberCopied'));
          } else {
            setDebugMsg('execCommand: false — לחץ Ctrl+C');
            showToast('לחץ Ctrl+C — המספר מסומן', 'error');
          }
        }
      });
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

          {/* Visible input — auto-selected, also serves as copy source */}
          <div className="bg-gray-50 border-2 border-blue-200 rounded-xl p-4 text-center">
            <input
              ref={inputRef}
              readOnly
              value={cardNumber}
              dir="ltr"
              className="w-full bg-transparent font-mono text-2xl font-bold tracking-widest text-blue-700 text-center outline-none cursor-pointer"
              onClick={handleCopy}
            />
            <p className="text-xs text-gray-400 mt-1">לחץ להעתקה / Ctrl+C</p>
          </div>

          {/* Debug message */}
          {debugMsg && (
            <p className="text-xs text-center break-all px-1" style={{ color: debugMsg.includes('OK') ? 'green' : 'orange' }}>
              {debugMsg}
            </p>
          )}

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

          <p className="text-xs text-gray-400 text-center">
            {copied ? 'הועתק — עכשיו פתח מולטיפס והדבק' : 'המספר מסומן — אפשר ללחוץ Ctrl+C ישירות'}
          </p>
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
