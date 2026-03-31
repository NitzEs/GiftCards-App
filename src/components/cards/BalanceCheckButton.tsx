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

  async function handleClick() {
    if (!user) return;
    setLoading(true);
    try {
      const idToken = await user.getIdToken();

      // 1. Get the decrypted card number from server
      const numRes = await fetch(`/api/cards/${cardId}/number`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!numRes.ok) throw new Error('fetch-number-failed');
      const { number } = await numRes.json() as { number: string };

      // 2. Strip dashes and copy to clipboard
      const cleanNumber = number.replace(/-/g, '');
      let copied = false;
      try {
        await navigator.clipboard.writeText(cleanNumber);
        copied = true;
      } catch {
        // Fallback: create a temporary input element
        const input = document.createElement('input');
        input.value = cleanNumber;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        try {
          document.execCommand('copy');
          copied = true;
        } catch { /* ignore */ }
        document.body.removeChild(input);
      }

      // 3. Open multipass in new tab
      window.open(MULTIPASS_URL, '_blank', 'noopener,noreferrer');

      if (copied) {
        showToast(t('numberCopied'));
      } else {
        // Show number in prompt so user can copy manually
        window.prompt('העתק את מספר הכרטיס:', cleanNumber);
      }

      // 4. Try auto-fetch balance in background
      try {
        const balRes = await fetch(`/api/balance?cardId=${cardId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (balRes.ok) {
          const { balance } = await balRes.json() as { balance: number };
          if (typeof balance === 'number' && !isNaN(balance)) {
            // Offer to update
            const shouldUpdate = window.confirm(
              `${t('updateBalanceFromSite')}: ₪${balance}?`
            );
            if (shouldUpdate) {
              await updateCardAmount(cardId, balance);
              onBalanceFetched?.(balance);
              showToast(t('balanceFetched'));
            }
          }
        }
      } catch {
        // Auto-fetch failed silently — user still has number in clipboard
      }
    } catch {
      showToast(t('genericError'), 'error');
    } finally {
      setLoading(false);
    }
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
