'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { NewCardInput } from '@/types/card';

interface AddCardModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddCardModal({ open, onClose }: AddCardModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  function reset() {
    setName('');
    setNumber('');
    setExpiry('');
    setAmount('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const payload: NewCardInput = {
        name,
        number,
        expiry,
        amount: parseFloat(amount),
      };
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      showToast(`${t('addCard')} ✓`);
      reset();
      onClose();
    } catch {
      showToast(t('genericError'), 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleExpiryChange(val: string) {
    // Auto-insert slash after MM
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setExpiry(cleaned);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('addCard')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t('cardName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="רמי לוי, Golf, H&M..."
        />
        <Input
          label={t('cardNumber')}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
          placeholder="1234-5678-9012-3456"
          dir="ltr"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('expiry')}
            value={expiry}
            onChange={(e) => handleExpiryChange(e.target.value)}
            placeholder={t('expiryPlaceholder')}
            dir="ltr"
            required
          />
          <Input
            label={`${t('balance')} (₪)`}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
            required
            dir="ltr"
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('add')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
